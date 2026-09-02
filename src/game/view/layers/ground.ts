import { Container, Rectangle } from 'pixi.js'
import { FADE, chunkKey, chunkOf } from '../../sim/building.ts'
import { goodness, HARD_MAX, VERY_HARD_MAX } from '../../sim/noise.ts'
import type { Cell } from '../../sim/plot.ts'
import type { World } from '../../sim/world.ts'
import { TILE, tileVariant } from '../camera.ts'
import { atlasTex, type AtlasKey } from '../atlas.ts'
import { SpritePool } from '../app.ts'

const GROUND_CHUNK = 16
const VH_BAND = VERY_HARD_MAX / 3
const HARD_BAND = (HARD_MAX - VERY_HARD_MAX) / 3

function band3(n: number): 0 | 1 | 2 {
  if (n <= 0) return 0
  if (n === 1) return 1
  return 2
}

function vhBand(g: number): 0 | 1 | 2 {
  return band3(Math.min(2, Math.floor(g / VH_BAND)))
}

function hBand(g: number): 0 | 1 | 2 {
  return band3(Math.min(2, Math.floor((g - VERY_HARD_MAX) / HARD_BAND)))
}

const GRASS: readonly AtlasKey[] = ['grass-0', 'grass-1', 'grass-2', 'grass-3', 'grass-4', 'grass-5', 'grass-6', 'grass-7']

function grassKey(col: number, row: number): AtlasKey {
  const i = tileVariant(col, row, 2) * 4 + tileVariant(col, row, 4, 1)
  const k = GRASS[i]
  if (k === undefined) throw new Error('grass')
  return k
}

function fadeKey(col: number, row: number, g: number): AtlasKey {
  if (g < VERY_HARD_MAX) return `vh-${vhBand(g)}`
  if (g < HARD_MAX) return `hard-${hBand(g)}`
  return grassKey(col, row)
}

function groundKey(col: number, row: number, cell: Cell, g: number): AtlasKey {
  if (cell.kind === 'untilled' && cell.cover.kind === 'tile') return `tile-${cell.cover.tile}`
  if (cell.kind === 'untilled' && cell.ground === 'hard') return `hard-${hBand(g)}`
  if ((cell.kind === 'untilled' && cell.ground === 'very-hard') || cell.kind === 'infertile') return `vh-${vhBand(g)}`
  return grassKey(col, row)
}

function token(col: number, row: number, cell: Cell, g: number): string {
  if (cell.kind === 'untilled' && cell.cover.kind === 'tile') return `t:${cell.cover.tile}`
  if (cell.kind === 'untilled' && cell.ground === 'hard') return `h${hBand(g)}`
  if ((cell.kind === 'untilled' && cell.ground === 'very-hard') || cell.kind === 'infertile') return `v${vhBand(g)}`
  return `g${tileVariant(col, row, 2) * 4 + tileVariant(col, row, 4, 1)}`
}

type Chunk = { sig: string; root: Container; pool: SpritePool }

export class GroundLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly chunks = new Map<string, Chunk>()
  private world: World | undefined

  rebuild(world: World): void {
    if (this.world !== world) {
      this.chunks.forEach(c => c.root.destroy({ children: true }))
      this.chunks.clear()
      this.world = world
    }
    const b = world.bounds()
    const keys = new Set(world.owned.map(chunkKey))
    const live = new Set<string>()
    const cyEnd = Math.floor((b.row1 + FADE - 1) / GROUND_CHUNK)
    const cxBnd = Math.floor((b.col1 + FADE - 1) / GROUND_CHUNK)
    for (let cy = Math.floor((b.row0 - FADE) / GROUND_CHUNK); cy <= cyEnd; cy++) {
      for (let cx = Math.floor((b.col0 - FADE) / GROUND_CHUNK); cx <= cxBnd; cx++) {
        const key = `${cx},${cy}`
        live.add(key)
        const sig = this.sig(world, cx, cy, keys, b)
        let ch = this.chunks.get(key)
        if (ch !== undefined && ch.sig === sig) continue
        if (ch === undefined) {
          const root = new Container({ eventMode: 'none' })
          root.cullable = true
          root.cullArea = new Rectangle(cx * GROUND_CHUNK * TILE, cy * GROUND_CHUNK * TILE, GROUND_CHUNK * TILE, GROUND_CHUNK * TILE)
          this.root.addChild(root)
          ch = { sig: '', root, pool: new SpritePool(root) }
          this.chunks.set(key, ch)
        }
        ch.sig = sig
        this.paint(ch, world, cx, cy, keys, b)
      }
    }
    this.chunks.forEach((ch, key) => {
      if (live.has(key)) return
      this.root.removeChild(ch.root)
      ch.root.destroy({ children: true })
      this.chunks.delete(key)
    })
  }

  private sig(
    world: World,
    cx: number,
    cy: number,
    keys: Set<string>,
    b: ReturnType<World['bounds']>,
  ): string {
    const c0 = cx * GROUND_CHUNK
    const r0 = cy * GROUND_CHUNK
    let sig = ''
    for (let row = r0; row < r0 + GROUND_CHUNK; row++) {
      for (let col = c0; col < c0 + GROUND_CHUNK; col++) {
        if (!keys.has(chunkKey(chunkOf({ col, row })))) {
          const d = Math.max(b.col0 - col, col - (b.col1 - 1), b.row0 - row, row - (b.row1 - 1), 0)
          if (d > FADE) continue
          sig += `${fadeKey(col, row, goodness(world.rng, col, row))}:${d <= 1 ? 0.65 : 0.35};`
          continue
        }
        sig += `${token(col, row, world.cell({ col, row }), goodness(world.rng, col, row))};`
      }
    }
    return sig
  }

  private paint(
    ch: Chunk,
    world: World,
    cx: number,
    cy: number,
    keys: Set<string>,
    b: ReturnType<World['bounds']>,
  ): void {
    ch.pool.begin()
    const c0 = cx * GROUND_CHUNK
    const r0 = cy * GROUND_CHUNK
    for (let row = r0; row < r0 + GROUND_CHUNK; row++) {
      for (let col = c0; col < c0 + GROUND_CHUNK; col++) {
        const at = { col, row }
        const g = goodness(world.rng, col, row)
        const owned = keys.has(chunkKey(chunkOf(at)))
        if (!owned) {
          const d = Math.max(b.col0 - col, col - (b.col1 - 1), b.row0 - row, row - (b.row1 - 1), 0)
          if (d > FADE) continue
          const s = ch.pool.take(atlasTex(fadeKey(col, row, g)))
          s.position.set(col * TILE, row * TILE)
          s.alpha = d <= 1 ? 0.65 : 0.35
          continue
        }
        const s = ch.pool.take(atlasTex(groundKey(col, row, world.cell(at), g)))
        s.position.set(col * TILE, row * TILE)
      }
    }
    ch.pool.end()
  }
}
