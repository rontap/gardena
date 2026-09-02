import { Container } from 'pixi.js'
import { vertexKey } from '../../sim/pipe.ts'
import { millWorking, jamWorking, stillWorking, barrelWorking } from '../../sim/machine.ts'
import type { Cell } from '../../sim/plot.ts'
import type { Burst, World } from '../../sim/world.ts'
import type { VfxId } from '../../sim/ids.ts'
import { TILE } from '../camera.ts'
import { atlasTex, vfxKey } from '../atlas.ts'
import { SpritePool } from '../app.ts'
import { VFX, VFX_REDUCED } from '../vfx.ts'

export type VfxMount = { id: VfxId; col: number; row: number; rot: number; burst: boolean; seq?: number }

type LiveBurst = Burst & { t0: number }

function sprayId(variant: 'basic' | 'large' | 'vert'): VfxId {
  if (variant === 'basic') return 'sprinkler-spray'
  if (variant === 'large') return 'sprinkler-spray-large'
  return 'sprinkler-spray-vert'
}

function busyVfx(cell: Cell, at: { col: number; row: number }): VfxId | undefined {
  if (cell.kind !== 'mill' && cell.kind !== 'jam' && cell.kind !== 'still' && cell.kind !== 'barrel') return undefined
  if (cell.base.col !== at.col || cell.base.row !== at.row) return undefined
  if (cell.kind === 'mill') return millWorking(cell) ? 'dust' : undefined
  if (cell.kind === 'jam') return jamWorking(cell) ? 'dust' : undefined
  if (cell.kind === 'still') return stillWorking(cell) ? 'steam' : undefined
  return barrelWorking(cell) ? 'brew' : undefined
}

export class VfxLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly pool = new SpritePool(this.root)
  private bursts: LiveBurst[] = []
  private world: World | undefined
  mounts: VfxMount[] = []

  bind(world: World): void {
    if (this.world !== world) {
      this.world = world
      this.bursts = []
    }
  }

  ingest(world: World, now: number): void {
    const got = world.drainBursts()
    if (got.length === 0) return
    if (VFX_REDUCED) return
    this.bursts.push(...got.map(b => ({ ...b, t0: now })))
  }

  tick(world: World, now: number): void {
    this.bursts = this.bursts.filter(b => now - b.t0 < VFX[b.id].dur * 1000)
    this.mounts = []
    this.pool.begin()
    for (const at of world.machines.values()) {
      const cell = world.cell(at)
      const id = busyVfx(cell, at)
      if (id === undefined) continue
      this.draw(id, at.col, at.row, 0, false, now, undefined)
    }
    world.sprinklers.forEach(s => {
      if (world.vfx.get(vertexKey(s.at)) !== true) return
      const rot = s.variant === 'vert' && s.facing === 'ns' ? 90 : 0
      this.draw(sprayId(s.variant), s.at.col, s.at.row, rot, false, now, undefined)
    })
    this.bursts.forEach(b => {
      this.draw(b.id, b.at.col, b.at.row, 0, true, now, b.t0, b.seq)
    })
    this.pool.end()
  }

  private draw(
    id: VfxId,
    col: number,
    row: number,
    rot: number,
    burst: boolean,
    now: number,
    t0: number | undefined,
    seq?: number,
  ): void {
    const def = VFX[id]
    this.mounts.push({ id, col, row, rot, burst, seq })
    const x = col * TILE
    const y = row * TILE
    const offx = def.anchor === 'vertex' ? -(def.span * TILE) / 24 / 2 : 0
    const offy = def.anchor === 'vertex' ? -(def.tall * TILE) / 24 / 2 : 0
    const rad = (rot * Math.PI) / 180
    if (VFX_REDUCED && !burst) {
      const s = this.pool.take(atlasTex(vfxKey(id, 0)))
      s.position.set(x + offx, y + offy)
      s.rotation = rad
      return
    }
    const t = now / 1000
    let wrap = 1
    let p = (t / def.dur) % 1
    if (burst && t0 !== undefined) {
      const age = (now - t0) / 1000
      if (age >= def.dur) return
      p = age / def.dur
      wrap = age / def.dur < 0.7 ? 1 : Math.max(0, 1 - (age / def.dur - 0.7) / 0.3)
    }
    const frames = [0, 1, 2, 3] as const
    for (const i of frames) {
      if (i >= def.frames) break
      const delay = burst ? i / def.slots : i / def.slots - 1
      const local = burst ? p - delay : (((p - delay) % 1) + 1) % 1
      const on = burst ? local >= 0 && local < 1 / def.slots && p < 1 : local < 1 / def.slots
      if (!on) continue
      const s = this.pool.take(atlasTex(vfxKey(id, i)))
      s.position.set(x + offx, y + offy)
      s.rotation = rad
      s.alpha = wrap
    }
  }
}
