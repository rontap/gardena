import { Container, Texture } from 'pixi.js'
import { HOUSE_BASE } from '../../sim/building.ts'
import { isSensor } from '../../sim/sensor.ts'
import { COMPOST_NEED } from '../../defs/items.ts'
import type { World } from '../../sim/world.ts'
import { TILE } from '../camera.ts'
import { atlasTex, sensorKey, type AtlasKey } from '../atlas.ts'
import { SpritePool } from '../app.ts'

const WHITE = Texture.WHITE
const WASH = 0xcfc6b0
const GOOD = 0x2fd15a
const INK = 0x1c1710

const PROP = {
  chest: 'chest',
  grinder: 'grinder',
  mill: 'mill',
  barrel: 'barrel',
  jam: 'jam',
  freezer: 'freezer',
  still: 'still',
} as const satisfies Record<string, AtlasKey>

export class PropsLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly pool = new SpritePool(this.root)

  patch(world: World): void {
    this.pool.begin()
    const put = (key: AtlasKey, col: number, row: number) => {
      const s = this.pool.take(atlasTex(key))
      s.position.set(col * TILE, row * TILE)
    }
    world.pumps.forEach(p => {
      const col = p.base.shape === 'rect' ? p.base.col : Math.floor(p.base.cx - p.base.r)
      const row = p.base.shape === 'rect' ? p.base.row : Math.floor(p.base.cy - p.base.r)
      put('pump', col, row)
    })
    world.tanks.forEach(t => put('rain-tank', t.base.col, t.base.row))
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
      s.position.set(l.x * TILE, l.y * TILE)
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
