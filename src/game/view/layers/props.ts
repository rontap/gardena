import { Container, Texture } from 'pixi.js'
import { HOUSE_BASE, type CircleBase, type Facing, type RectBase } from '../../sim/building.ts'
import { furnaceWorking, infuserWorking, millWorking, stationWorking } from '../../sim/feature-machines/machine.ts'
import { ritualReady } from '../../sim/feature-necronomicon/necronomicon.ts'
import { isSensor } from '../../sim/sensor.ts'
import { COMPOST_NEED } from '../../defs/items.ts'
import type { World } from '../../sim/world.ts'
import { TILE } from '../camera.ts'
import { atlasTex, sensorKey, type AtlasKey } from '../atlas.ts'
import { SpritePool } from '../app.ts'
import { vfxReduced } from '../vfx.ts'

const WHITE = Texture.WHITE
const WASH = 0xcfc6b0
const GOOD = 0x2fd15a
const INK = 0x1c1710

const SORTER_KEY: { readonly [K in Facing]: AtlasKey } = {
  n: 'sorter-n',
  e: 'sorter-e',
  s: 'sorter-s',
  w: 'sorter-w',
}

const PROP = {
  chest: 'chest',
  grinder: 'grinder',
  mill: 'mill-body',
  barrel: 'barrel',
  jam: 'jam',
  freezer: 'freezer',
  still: 'still',
} as const satisfies Record<string, AtlasKey>

const PUMP_STROKE = 1.6
const PUMP_LIFT = 3

const SAIL_REST = 45
const SAIL_TURN = 2.4
const SAIL_HUB_X = 24 / 48
const SAIL_HUB_Y = 18 / 48

function pumping(world: World, p: { base: RectBase | CircleBase }): boolean {
  const col = p.base.shape === 'rect' ? p.base.col : Math.floor(p.base.cx - p.base.r)
  const row = p.base.shape === 'rect' ? p.base.row : Math.floor(p.base.cy - p.base.r)
  return world.seats.some(seat => {
    const head = seat.queue[0]
    return head?.act === 'fill' && head.at.col >= col && head.at.col <= col + 1 && head.at.row === row
  })
}

export class PropsLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly pool = new SpritePool(this.root)
  private readonly arms = new SpritePool(this.root)

  tick(world: World, now: number): void {
    this.arms.begin()
    const phase = (now / 1000 / PUMP_STROKE) % 1
    const lift = vfxReduced() ? 0 : Math.round(Math.sin(phase * 2 * Math.PI) * PUMP_LIFT)
    world.pumps.forEach(p => {
      const col = p.base.shape === 'rect' ? p.base.col : Math.floor(p.base.cx - p.base.r)
      const row = p.base.shape === 'rect' ? p.base.row : Math.floor(p.base.cy - p.base.r)
      const s = this.arms.take(atlasTex('pump-arm'))
      s.position.set(col * TILE, row * TILE + (pumping(world, p) ? lift : 0))
    })
    const turn = vfxReduced() ? 0 : ((now / 1000 / SAIL_TURN) % 1) * 360
    for (const at of world.machines.values()) {
      const cell = world.cell(at)
      if (cell.kind !== 'mill') continue
      if (cell.base.col !== at.col || cell.base.row !== at.row) continue
      const s = this.arms.take(atlasTex('mill-sails'))
      s.anchor.set(SAIL_HUB_X, SAIL_HUB_Y)
      s.position.set((at.col + SAIL_HUB_X * 2) * TILE, (at.row + SAIL_HUB_Y * 2) * TILE)
      s.rotation = ((SAIL_REST + (millWorking(cell) ? turn : 0)) * Math.PI) / 180
    }
    this.arms.end()
  }

  patch(world: World): void {
    this.pool.begin()
    const put = (key: AtlasKey, col: number, row: number) => {
      const s = this.pool.take(atlasTex(key))
      s.position.set(col * TILE, row * TILE)
    }
    world.pumps.forEach(p => {
      const col = p.base.shape === 'rect' ? p.base.col : Math.floor(p.base.cx - p.base.r)
      const row = p.base.shape === 'rect' ? p.base.row : Math.floor(p.base.cy - p.base.r)
      put('pump-body', col, row)
    })
    world.taps.forEach(t => put('tap', t.base.col, t.base.row))
    world.wells.forEach(w => put('well', w.base.col, w.base.row))
    world.hangars.forEach(h => put('hangar', h.base.col, h.base.row))
    world.seedSilos.forEach(h => put('silo-seed', h.base.col, h.base.row))
    world.spraySilos.forEach(h => put('silo-spray', h.base.col, h.base.row))
    world.produceSilos.forEach(h => put('silo-produce', h.base.col, h.base.row))
    put('seed-silo', world.silo.base.col, world.silo.base.row)
    put('additive-store', world.additives.base.col, world.additives.base.row)
    put('truck', world.truck.base.col, world.truck.base.row)
    put('house', HOUSE_BASE.col, HOUSE_BASE.row)
    world.machineLinks().forEach(l => {
      const s = this.pool.take(atlasTex(l.side === 'in' ? 'link-in' : 'link-out'))
      s.anchor.set(0.5)
      s.rotation = l.turn
      s.position.set((l.x + 0.5) * TILE, (l.y + 0.5) * TILE)
    })
    for (const at of world.machines.values()) {
      const cell = world.cell(at)
      if (cell.kind === 'compost-box') {
        put('compost-box', at.col, at.row)
        const t = cell.units < COMPOST_NEED ? cell.units / COMPOST_NEED : cell.progress
        const bg = this.pool.take(WHITE)
        bg.tint = INK
        bg.position.set(at.col * TILE + 2, at.row * TILE + TILE - 6)
        bg.width = TILE - 4
        bg.height = 4
        const fg = this.pool.take(WHITE)
        fg.tint = cell.units < COMPOST_NEED ? WASH : GOOD
        fg.position.set(at.col * TILE + 3, at.row * TILE + TILE - 5)
        fg.width = (TILE - 6) * t
        fg.height = 2
        continue
      }
      if (cell.kind === 'station') {
        put(stationWorking(cell) ? 'station-on' : 'station-off', at.col, at.row)
        continue
      }
      if (cell.kind === 'furnace') {
        put(furnaceWorking(cell) ? 'furnace-on' : 'furnace-off', at.col, at.row)
        continue
      }
      if (cell.kind === 'infuser') {
        put(infuserWorking(cell) ? 'infuser-on' : 'infuser-off', at.col, at.row)
        continue
      }
      if (cell.kind === 'necronomicon') {
        put(ritualReady(world, cell) ? 'necronomicon-on' : 'necronomicon-off', at.col, at.row)
        continue
      }
      if (cell.kind === 'sorter') {
        put(SORTER_KEY[cell.facing], at.col, at.row)
        continue
      }
      if (
        cell.kind === 'chest' ||
        cell.kind === 'grinder' ||
        cell.kind === 'mill' ||
        cell.kind === 'barrel' ||
        cell.kind === 'jam' ||
        cell.kind === 'freezer' ||
        cell.kind === 'still'
      ) {
        put(PROP[cell.kind], at.col, at.row)
      }
    }
    for (const at of world.stores.values()) {
      const cell = world.cell(at)
      if (
        cell.kind === 'chest' ||
        cell.kind === 'grinder' ||
        cell.kind === 'mill' ||
        cell.kind === 'barrel' ||
        cell.kind === 'jam' ||
        cell.kind === 'freezer' ||
        cell.kind === 'still'
      ) {
        put(PROP[cell.kind], at.col, at.row)
      }
    }
    world.forEachCell((at, cell) => {
      if (cell.kind !== 'weather-station') return
      if (cell.base.col !== at.col || cell.base.row !== at.row) return
      put('weather-station', at.col, at.row)
    })
    for (const at of world.sensors.values()) {
      const cell = world.cell(at)
      if (!isSensor(cell) || cell.kind === 'button') continue
      put(sensorKey(cell), at.col, at.row)
    }
    for (const at of world.buttons.values()) {
      const cell = world.cell(at)
      if (cell.kind !== 'button') continue
      put(sensorKey(cell), at.col, at.row)
    }
    this.pool.end()
  }
}
