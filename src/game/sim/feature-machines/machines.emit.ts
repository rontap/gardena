import { STILL_WATER } from '../../defs/items.ts'
import { compactSlots, insertSlots, slotsCouldTake, type Item, type Slot } from '../item.ts'
import { frontOfBase, type Coord, type RectBase, type Sorter } from '../building.ts'
import { isPlot } from '../plot.ts'
import type { World } from '../world.ts'
import { machineEast } from './machine.ts'

export function dropSpot(w: World, base: RectBase): Coord | undefined {
  return frontOfBase(base).find(p => w.inWorld(p) && isPlot(w.cell(p)))
}

export function emitPair(w: World, base: RectBase, a: Item, b: Item): boolean {
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
  return emitProduct(w, base, a) && emitProduct(w, base, b)
}

export function emitProduct(w: World, base: RectBase, item: Item): boolean {
  const east = machineEast(base)
  if (w.inWorld(east)) {
    const store = w.cell(east)
    if (store.kind === 'chest' || store.kind === 'freezer') {
      return insertSlots(store.slots, item, store.slots.length, undefined)
    }
  }
  const spot = dropSpot(w, base)
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

function sortPort(w: World, c: Sorter, item: Item): Coord | undefined {
  const at = c.storePorts().find(p => p.role === 'out' && p.takes !== undefined && p.takes(item))?.at
  if (at === undefined || !w.inWorld(at)) return undefined
  const cell = w.cell(at)
  if (cell.kind === 'chest' || cell.kind === 'freezer') {
    return slotsCouldTake(cell.slots, item, cell.slots.length, undefined) ? at : undefined
  }
  return isPlot(cell) ? at : undefined
}

export function emitSorted(w: World, c: Sorter, item: Item): boolean {
  const at = sortPort(w, c, item)
  if (at === undefined) return false
  const cell = w.cell(at)
  if (cell.kind === 'chest' || cell.kind === 'freezer') {
    const ok = insertSlots(cell.slots, item, cell.slots.length, undefined)
    if (ok) w.track(at, cell)
    return ok
  }
  w.drops.push({ at: { ...at }, item })
  return true
}

export function pullSorted(w: World, c: Sorter): Item | undefined {
  const at = c.storePorts().find(p => p.role === 'in')?.at
  if (at === undefined || !w.inWorld(at)) return undefined
  const store = w.cell(at)
  if (store.kind !== 'chest' && store.kind !== 'freezer') return undefined
  for (let i = 0; i < store.slots.length; i++) {
    const s = store.slots[i]
    if (s.kind !== 'hold') continue
    if (sortPort(w, c, s.item) === undefined) continue
    const item = s.item
    store.slots[i] = { kind: 'empty' }
    compactSlots(store.slots)
    w.track(at, store)
    return item
  }
  return undefined
}
