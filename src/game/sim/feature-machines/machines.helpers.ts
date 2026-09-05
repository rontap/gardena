import { BARREL_MATURE } from '../../defs/items.ts'
import type { Coord } from '../building.ts'
import { CASK_OF } from '../ids.ts'
import { mergeInto, type Item } from '../item.ts'
import { HAND_FULL } from '../prompt.ts'
import type { World } from '../world.ts'
import {
  addBarrelFeed,
  bakeCaskSale,
  barrelAccept,
  barrelNeed,
  feedUnits,
  feedVariety,
  grindAccept,
  grindApply,
  meanQuality,
  millAccept,
  stationAccept,
  stationApply,
  takeCount,
} from './machine.ts'

function takeHandCount(w: World, n: number): void {
  if (w.act.hand.kind !== 'hold') return
  if (takeCount(w.act.hand.item, n)) w.act.hand = { kind: 'empty' }
}

export function canMill(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'mill') return false
  return millAccept(c, w.act.hand.item) !== undefined
}

export function doMill(w: World, at: Coord): void {
  if (!canMill(w, at)) return
  if (w.act.hand.kind !== 'hold') return
  const mill = w.cell(at)
  if (mill.kind !== 'mill') return
  const take = millAccept(mill, w.act.hand.item)
  if (take === undefined) return
  mill.apply(w.act.hand.item, take.n)
  takeHandCount(w, take.n)
  w.track(at, mill)
}

export function canStill(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'still') return false
  return c.accept(w.act.hand.item) > 0
}

export function doStill(w: World, at: Coord): void {
  if (!canStill(w, at)) return
  if (w.act.hand.kind !== 'hold') return
  const still = w.cell(at)
  if (still.kind !== 'still') return
  const n = still.accept(w.act.hand.item)
  if (n <= 0) return
  still.apply(w.act.hand.item, n)
  takeHandCount(w, n)
  w.track(at, still)
}

export function canFurnace(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'furnace') return false
  return c.accept(w.act.hand.item) > 0
}

export function doFurnace(w: World, at: Coord): void {
  if (!canFurnace(w, at)) return
  if (w.act.hand.kind !== 'hold') return
  const furnace = w.cell(at)
  if (furnace.kind !== 'furnace') return
  const n = furnace.accept(w.act.hand.item)
  if (n <= 0) return
  furnace.apply(w.act.hand.item, n)
  takeHandCount(w, n)
  w.track(at, furnace)
}

export function canStation(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'station') return false
  return stationAccept(c, w.act.hand.item) !== undefined
}

export function doStation(w: World, at: Coord): void {
  if (!canStation(w, at)) return
  if (w.act.hand.kind !== 'hold') return
  const station = w.cell(at)
  if (station.kind !== 'station') return
  const take = stationAccept(station, w.act.hand.item)
  if (take === undefined) return
  stationApply(station, take)
  takeHandCount(w, take.n)
  w.track(at, station)
}

export function canBarrelCollect(w: World, at: Coord): boolean {
  const c = w.cell(at)
  if (c.kind !== 'barrel') return false
  if (c.crop === 'none' || feedUnits(c.feed) !== barrelNeed(c.crop) || c.age < BARREL_MATURE) return false
  if (w.act.hand.kind === 'empty') return true
  if (w.act.hand.item.kind !== 'cask') return false
  if (w.act.hand.item.cask !== CASK_OF[c.crop]) return false
  return w.act.hand.item.variety === feedVariety(c.feed)
}

export function canBarrel(w: World, at: Coord): boolean {
  if (canBarrelCollect(w, at)) return true
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'barrel') return false
  return barrelAccept(c, w.act.hand.item) !== undefined
}

export function doBarrel(w: World, at: Coord): void {
  if (canBarrelCollect(w, at)) {
    const barrel = w.cell(at)
    if (barrel.kind !== 'barrel') return
    if (barrel.crop === 'none') return
    const variety = feedVariety(barrel.feed)
    const quality = meanQuality(barrel.feed)
    const cask: Item = {
      kind: 'cask',
      cask: CASK_OF[barrel.crop],
      variety,
      quality,
      count: 1,
      unitSale: bakeCaskSale(CASK_OF[barrel.crop], variety, quality, barrel.age),
    }
    if (w.act.hand.kind === 'empty') w.act.hand = { kind: 'hold', item: cask }
    else if (w.act.hand.item.kind === 'cask') {
      const it = w.act.hand.item
      if (it.count >= w.stackMax(it)) {
        w.say(HAND_FULL)
        return
      }
      mergeInto(it, cask, 1)
    }
    barrel.feed = []
    barrel.age = 0
    barrel.crop = 'none'
    w.track(at, barrel)
    return
  }
  if (w.act.hand.kind !== 'hold') return
  const barrel = w.cell(at)
  if (barrel.kind !== 'barrel') return
  const take = barrelAccept(barrel, w.act.hand.item)
  if (take === undefined) return
  barrel.crop = take.crop
  addBarrelFeed(barrel.feed, take.variety, take.quality, take.n)
  takeHandCount(w, take.n)
  w.track(at, barrel)
}

export function canJam(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'jam') return false
  return c.accept(w.act.hand.item) > 0
}

export function doJam(w: World, at: Coord): void {
  if (!canJam(w, at)) return
  if (w.act.hand.kind !== 'hold') return
  const jam = w.cell(at)
  if (jam.kind !== 'jam') return
  const it = w.act.hand.item
  const n = jam.accept(it)
  jam.apply(it, n)
  takeHandCount(w, n)
  w.track(at, jam)
}

export function canGrind(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'grinder') return false
  return grindAccept(c, w.act.hand.item) !== undefined
}

export function doGrind(w: World, at: Coord): void {
  if (!canGrind(w, at)) return
  if (w.act.hand.kind !== 'hold') return
  const grinder = w.cell(at)
  if (grinder.kind !== 'grinder') return
  const take = grindAccept(grinder, w.act.hand.item)
  if (take === undefined) return
  grindApply(grinder, take)
  takeHandCount(w, take.n)
  w.track(at, grinder)
}

export function canCompost(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'compost-box') return false
  return c.accept(w.act.hand.item) > 0
}

export function doCompost(w: World, at: Coord): void {
  if (!canCompost(w, at)) return
  if (w.act.hand.kind !== 'hold') return
  const box = w.cell(at)
  if (box.kind !== 'compost-box') return
  const n = box.accept(w.act.hand.item)
  box.apply(w.act.hand.item, n)
  w.track(at, box)
  w.act.hand = { kind: 'empty' }
}
