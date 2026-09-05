import { BaseBuilding, type Furnace, type RectBase } from '../building.ts'
import { compactSlots } from '../item.ts'
import type { World } from '../world.ts'
import { furnaceMul, furnaceWorking, isIoCell, machineWest, takeCount } from './machine.ts'

export {
  canBarrel,
  canBarrelCollect,
  canCompost,
  canFurnace,
  canGrind,
  canJam,
  canMill,
  canStation,
  canStill,
  doBarrel,
  doCompost,
  doFurnace,
  doGrind,
  doJam,
  doMill,
  doStation,
  doStill,
} from './machines.helpers.ts'

export { dropSpot, emitPair, emitProduct, pullStillWater } from './machines.emit.ts'

export function furnaceMulFor(w: World, base: RectBase): number {
  return furnaceMul(workingFurnaces(w), base)
}

export function workingFurnaces(w: World): Furnace[] {
  const out: Furnace[] = []
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (c.kind !== 'furnace') continue
    if (c.base.col !== at.col || c.base.row !== at.row) continue
    if (furnaceWorking(c)) out.push(c)
  }
  return out
}

export function tickMachines(w: World, dt: number): void {
  w.furnaceSnap = workingFurnaces(w)
  let dirty = false
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (!(c instanceof BaseBuilding) || !c.ticks || c.base.col !== at.col || c.base.row !== at.row) continue
    if (c.tick(w, at, dt)) dirty = true
  }
  if (dirty) w.pingFor('field')
}

export function pullMachineStores(w: World): void {
  let dirty = false
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (!isIoCell(c)) continue
    if (c.base.col !== at.col || c.base.row !== at.row) continue
    const west = machineWest(c.base)
    if (!w.inWorld(west)) continue
    const store = w.cell(west)
    if (store.kind !== 'chest' && store.kind !== 'freezer') continue
    store.slots.forEach((s, i) => {
      if (s.kind !== 'hold') return
      const n = c.accept(s.item)
      if (n <= 0) return
      c.apply(s.item, n)
      if (c.takeAll || takeCount(s.item, n)) store.slots[i] = { kind: 'empty' }
      dirty = true
    })
    compactSlots(store.slots)
    w.track(at, c)
    w.track(west, store)
  }
  if (dirty) w.pingFor('field')
}
