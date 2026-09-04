import { Container, Texture } from 'pixi.js'
import { isPlot } from '../../sim/plot.ts'
import { CROPS, tolerance } from '../../defs/crops.ts'
import { fertBand, waterBand, SOIL_WATER_MAX } from '../../sim/soil.ts'
import type { World } from '../../sim/world.ts'
import { EDGE_PAD, TILE, tileVariant } from '../camera.ts'
import { atlasTex, cropKey, ripeStage } from '../atlas.ts'
import { SpritePool } from '../app.ts'

const WHITE = Texture.WHITE
const BAD = 0xe23b2e
const MID = 0xd4a017
const INK = 0x1c1710
const WET_TINT_MAX = 0.24

function wetTint(water: number): number {
  const w = Math.min(1, water / SOIL_WATER_MAX)
  const r = Math.round(255 * (1 - WET_TINT_MAX * w))
  const g = Math.round(255 * (1 - WET_TINT_MAX * 0.85 * w))
  const b = Math.round(255 * (1 - WET_TINT_MAX * 0.4 * w))
  return (r << 16) | (g << 8) | b
}

export class PlotsLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly pool = new SpritePool(this.root)

  patch(world: World): void {
    this.pool.begin()
    for (const at of world.empty.values()) this.plot(world, at.col, at.row)
    for (const at of world.grow.values()) {
      const cell = world.cell(at)
      if (cell.kind === 'tree') {
        const stage = cell.trunk
          ? 'trunk'
          : cell.juvenile < 1
            ? 'grow'
            : cell.yield.kind === 'on' || cell.fruit >= 1
              ? 'ripe'
              : 'unripe'
        const s = this.pool.take(atlasTex(`tree-${cell.species}:${stage}`))
        s.position.set(at.col * TILE, at.row * TILE)
        continue
      }
      this.plot(world, at.col, at.row)
    }
    for (const at of world.tufts.values()) {
      const cell = world.cell(at)
      if (cell.kind === 'untilled' && cell.cover.kind === 'grass') {
        const s = this.pool.take(atlasTex(`tuft-${cell.cover.variant}`))
        s.position.set(at.col * TILE, at.row * TILE)
      }
    }
    for (const at of world.rocks.values()) {
      const cell = world.cell(at)
      if (cell.kind !== 'rock') continue
      if (cell.base.w === 1 && cell.base.h === 2) {
        const s = this.pool.take(atlasTex('rock-long'))
        s.position.set(at.col * TILE + TILE, at.row * TILE)
        s.rotation = Math.PI / 2
        continue
      }
      const s = this.pool.take(atlasTex(cell.base.w === 2 && cell.base.h === 1 ? 'rock-long' : 'rock'))
      s.position.set(at.col * TILE, at.row * TILE)
    }
    this.pool.end()
  }

  private plot(world: World, col: number, row: number): void {
    const cell = world.cell({ col, row })
    if (!isPlot(cell) || cell.kind === 'untilled' || cell.kind === 'infertile') return
    const dirt = this.pool.take(atlasTex(tileVariant(col, row, 2) === 0 ? 'dirt-0' : 'dirt-1'))
    dirt.position.set(col * TILE, row * TILE)
    dirt.tint = wetTint(cell.soil.water)
    const e = world.plotEdges(col, row)
    this.edge(col, row, e[0] === '1', 180)
    this.edge(col, row, e[1] === '1', -90)
    this.edge(col, row, e[2] === '1', 0)
    this.edge(col, row, e[3] === '1', 90)
    if (e[4] === '1') this.inset(col * TILE, row * TILE, 0)
    if (e[5] === '1') this.inset(col * TILE + TILE, row * TILE, 90)
    if (e[6] === '1') this.inset(col * TILE + TILE, row * TILE + TILE, 180)
    if (e[7] === '1') this.inset(col * TILE, row * TILE + TILE, -90)
    if (cell.kind === 'rotten') {
      const s = this.pool.take(atlasTex('rotten'))
      s.position.set(col * TILE, row * TILE)
    }
    if (cell.kind === 'turf') {
      const s = this.pool.take(atlasTex(`turf-${cell.turf.stage()}`))
      s.position.set(col * TILE, row * TILE)
    }
    if (cell.kind === 'weed') {
      const s = this.pool.take(atlasTex(`weed-${cell.weed.variant}-${cell.weed.stage()}`))
      s.position.set(col * TILE, row * TILE)
    }
    if (cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead') {
      const stage = cell.kind === 'ripe' ? ripeStage(cell.plant.rarity) : cell.plant.stage(cell.kind)
      const s = this.pool.take(atlasTex(cropKey(cell.plant.crop, stage)))
      s.position.set(col * TILE, row * TILE)
    }
    if (cell.kind === 'growing') {
      const water = waterBand(cell.soil.water, tolerance(CROPS[cell.plant.crop].waterTolerance, cell.plant.rarity))
      const fert = fertBand(cell.soil.fertilizer, tolerance(CROPS[cell.plant.crop].fertTolerance, cell.plant.rarity))
      if (water !== 'green') {
        this.bar(col, row, TILE - 6, water === 'red' ? BAD : MID, ((TILE - 6) * cell.soil.water) / SOIL_WATER_MAX)
      }
      if (fert !== 'green') {
        this.bar(col, row, TILE - 11, fert === 'red' ? BAD : MID, (TILE - 6) * cell.soil.fertilizer)
      }
    }
    if (cell.kind === 'ripe' && cell.plant.freshness < 0.8) {
      this.bar(col, row, TILE - 6, BAD, (TILE - 6) * cell.plant.freshness)
    }
  }

  private edge(col: number, row: number, on: boolean, rot: number): void {
    if (!on) return
    const s = this.pool.take(atlasTex('dirt-edge'))
    s.anchor.set(0.5)
    s.position.set(col * TILE + TILE / 2, row * TILE + TILE / 2)
    s.rotation = (rot * Math.PI) / 180
  }

  private inset(x: number, y: number, rot: number): void {
    const s = this.pool.take(atlasTex('dirt-inset'))
    const a = EDGE_PAD / (24 + EDGE_PAD * 2)
    s.anchor.set(a, a)
    s.position.set(x, y)
    s.rotation = (rot * Math.PI) / 180
  }

  private bar(col: number, row: number, yOff: number, fill: number, width: number): void {
    const bg = this.pool.take(WHITE)
    bg.tint = INK
    bg.position.set(col * TILE + 2, row * TILE + yOff)
    bg.width = TILE - 4
    bg.height = 4
    const fg = this.pool.take(WHITE)
    fg.tint = fill
    fg.position.set(col * TILE + 3, row * TILE + yOff + 1)
    fg.width = width
    fg.height = 2
  }
}
