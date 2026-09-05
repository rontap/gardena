import { STILL_WATER } from '../../defs/items.ts'
import { frontOf, type Coord, type RectBase } from '../building.ts'
import { insertSlots, type Item, type Slot } from '../item.ts'
import { isPlot } from '../plot.ts'
import type { World } from '../world.ts'
import { machineEast } from './machine.ts'

export function dropSpot(w: World, at: Coord): Coord | undefined {
  return frontOf(at).find(p => w.inWorld(p) && isPlot(w.cell(p)))
}

export function emitPair(w: World, at: Coord, base: RectBase, a: Item, b: Item): boolean {
  const east = machineEast(base)
  if (w.inWorld(east)) {
    const store = w.cell(east)
    if (store.kind === 'chest' || store.kind === 'freezer') {
      const test: Slot[] = store.slots.map(s =>
        s.kind === 'empty' ? { kind: 'empty' as const } : { kind: 'hold' as const, item: { ...s.item } },
      )
      if (!insertSlots(test, { ...a }, test.length, undefined)) return false
      if (!insertSlots(test, { ...b }, test.length, undefined)) return false
    }
  }
  return emitProduct(w, at, base, a) && emitProduct(w, at, base, b)
}

export function emitProduct(w: World, at: Coord, base: RectBase, item: Item): boolean {
  const east = machineEast(base)
  if (w.inWorld(east)) {
    const store = w.cell(east)
    if (store.kind === 'chest' || store.kind === 'freezer') {
      return insertSlots(store.slots, item, store.slots.length, undefined)
    }
  }
  const spot = dropSpot(w, at)
  if (spot === undefined) return false
  w.drops.push({ at: spot, item })
  return true
}

export function pullStillWater(w: World, still: { base: RectBase }): boolean {
  const net = w.netOfCell(still.base)
  if (net === undefined) return false
  const held = net.sources.reduce((n, s) => n + s.stored, 0)
  if (held < STILL_WATER) return false
  w.pullWater(net.sources, STILL_WATER)
  return true
}
