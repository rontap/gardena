import {
  BARREL_AGE,
  BARREL_MATURE,
  COMPOST_NEED,
  COMPOST_SECONDS,
  FURNACE_ASH,
  FURNACE_NEED,
  FURNACE_SECONDS,
  GRIND_MAX,
  grindMinAt,
  GRIND_WORK,
  JAM_IN,
  JAM_SECONDS,
  JAM_SUGAR,
  MILL_WORK,
  STATION_GRAFT_MAX,
  STATION_GRAFT_MIN,
  STATION_IN,
  STATION_SECONDS,
  STILL_SECONDS,
  STILL_WATER,
} from '../../defs/items.ts'
import {
  frontOf,
  type Coord,
  type Furnace,
  type JamMachine,
  type Mill,
  type PotStill,
  type RectBase,
} from '../building.ts'
import { compactSlots, fruitStack, insertSlots, makeCompost, type Item, type Slot } from '../item.ts'
import { statsOf } from '../modifiers.ts'
import { isPlot } from '../plot.ts'
import type { World } from '../world.ts'
import {
  bakeSpiritSale,
  barrelNeed,
  feedUnits,
  feedVariety,
  furnaceMul,
  furnaceWorking,
  grindProduct,
  isIoCell,
  jamSale,
  jamWorking,
  machineEast,
  machineWest,
  meanQuality,
  millNeed,
  millProduct,
  millWorking,
  spiritKind,
  stillReady,
  takeCount,
} from './machine.ts'

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

export function tickCompost(w: World, dt: number): void {
  let dirty = false
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (c.kind !== 'compost-box') continue
    if (c.base.col !== at.col || c.base.row !== at.row) continue
    if (c.units < COMPOST_NEED) continue
    c.progress += (dt * furnaceMul(w.furnaceSnap, c.base)) / COMPOST_SECONDS
    if (c.progress < 1) continue
    if (!emitProduct(w, at, c.base, makeCompost())) continue
    c.progress = 0
    c.units -= COMPOST_NEED
    w.track(at, c)
    dirty = true
  }
  if (dirty) w.pingFor('field')
}

export function tickMachines(w: World, dt: number): void {
  w.furnaceSnap = workingFurnaces(w)
  const snap = w.furnaceSnap
  let dirty = false
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (c.kind === 'mill') {
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      const mill: Mill = c
      if (!millWorking(c)) continue
      const need = millNeed(c.recipe)
      c.progress += (dt * w.machineMul() * furnaceMul(snap, c.base)) / MILL_WORK
      if (c.progress < 1) continue
      if (!emitProduct(w, at, c.base, millProduct(c.recipe, c.variety, c.quality))) continue
      c.progress = 0
      c.units -= need
      if (c.units === 0) mill.recipe = 'none'
      w.track(at, c)
      dirty = true
      continue
    }
    if (c.kind === 'jam') {
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      const jam: JamMachine = c
      if (!jamWorking(c)) continue
      c.progress += (dt * w.machineMul() * furnaceMul(snap, c.base)) / JAM_SECONDS
      if (c.progress < 1) continue
      if (!emitProduct(w, at, c.base, { kind: 'jam', crop: c.crop, variety: c.variety, quality: c.quality, count: 1, unitSale: jamSale(c.crop, c.variety, c.quality) })) continue
      c.progress = 0
      c.fruit -= JAM_IN
      c.sugar -= JAM_SUGAR
      if (c.fruit === 0) jam.crop = 'none'
      w.track(at, c)
      dirty = true
      continue
    }
    if (c.kind === 'still') {
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      if (!stillReady(c)) continue
      if (c.progress === 0) {
        if (!pullStillWater(w, c)) continue
        dirty = true
      }
      c.progress += (dt * furnaceMul(snap, c.base)) / STILL_SECONDS
      if (c.progress < 1) continue
      const kind = spiritKind(c.feed)
      const quality = meanQuality(c.feed)
      const variety = kind === 'mixed' ? 'base' : feedVariety(c.feed)
      if (
        !emitProduct(w, at, c.base, {
          kind: 'spirit',
          spirit: kind,
          variety,
          quality,
          count: 1,
          unitSale: bakeSpiritSale(kind, variety, quality),
        })
      ) {
        continue
      }
      c.feed = []
      c.progress = 0
      c.n += 1
      w.track(at, c)
      dirty = true
      continue
    }
    if (c.kind === 'grinder') {
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      if (c.crop === 'none' || c.units < 1) continue
      c.progress += (dt * w.machineMul() * furnaceMul(snap, c.base)) / GRIND_WORK
      if (c.progress < 1) continue
      const u = w.rng.stream('grind').at(at.col, at.row, w.clock.day, c.n)
      const floor = grindMinAt(c.quality)
      const count = floor + Math.floor(u * (GRIND_MAX - floor + 1))
      if (!emitProduct(w, at, c.base, grindProduct(c, count))) continue
      c.progress = 0
      c.units -= 1
      c.n += 1
      if (c.units === 0) c.crop = 'none'
      w.track(at, c)
      dirty = true
      continue
    }
    if (c.kind === 'barrel') {
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      if (c.crop === 'none' || feedUnits(c.feed) !== barrelNeed(c.crop)) continue
      const was = c.age
      c.age += dt
      if (was < BARREL_MATURE && c.age >= BARREL_MATURE) {
        c.feed = [{ variety: feedVariety(c.feed), quality: meanQuality(c.feed), count: barrelNeed(c.crop) }]
        c.n += 1
      }
      if (was < BARREL_AGE && c.age >= BARREL_AGE) dirty = true
      w.track(at, c)
      continue
    }
    if (c.kind === 'station') {
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      if (c.inn === 1) continue
      if (c.crop === 'none' || c.units < STATION_IN) continue
      if (c.progress < 1) c.progress += dt / STATION_SECONDS
      if (c.progress < 1) continue
      const u = w.rng.stream('grind').at(at.col, at.row, w.clock.day)
      const count = STATION_GRAFT_MIN + Math.floor(u * (STATION_GRAFT_MAX - STATION_GRAFT_MIN + 1))
      const sale = statsOf(c.crop, c.variety, c.quality, w.modifiers).sale
      const cut: Item = {
        kind: 'fruit',
        ...fruitStack(c.crop, c.variety, c.quality, STATION_IN, sale, 1, false, true),
      }
      const grafts: Item = { kind: 'graft', crop: c.crop, variety: c.variety, quality: c.quality, count }
      if (!emitPair(w, at, c.base, cut, grafts)) continue
      c.progress = 0
      c.units -= STATION_IN
      if (c.units === 0) c.crop = 'none'
      w.track(at, c)
      dirty = true
      continue
    }
    if (c.kind === 'furnace') {
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      if (c.inn === 1) continue
      if (c.units < FURNACE_NEED) continue
      if (c.progress < 1) c.progress += (dt * furnaceMul(snap, c.base)) / FURNACE_SECONDS
      if (c.progress < 1) continue
      if (!emitProduct(w, at, c.base, { kind: 'ash', count: FURNACE_ASH })) continue
      c.progress = 0
      c.units -= FURNACE_NEED
      w.track(at, c)
      dirty = true
    }
  }
  if (dirty) w.pingFor('field')
}

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

export function pullStillWater(w: World, still: PotStill): boolean {
  const net = w.netOfCell(still.base)
  if (net === undefined) return false
  const held = net.sources.reduce((n, s) => n + s.stored, 0)
  if (held < STILL_WATER) return false
  w.pullWater(net.sources, STILL_WATER)
  return true
}
