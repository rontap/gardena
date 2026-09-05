import type { World } from './world.ts'
import { canChop, canCompost, canFertilize, canGraft, canHarvest, canMine, canPlant, canShovel, canTend, canWater, doChop, doCompost, doFertilize, doGraft, doHarvest, doMine, doPlant, doShovel, doTend, doWater, doWeedSpray } from './field.ts'
import { demand, pullWater, rate, sources } from './nets.ts'
import { putAdditive, putSilo, putSugar, stackMax } from './store.ts'
import { dest, type Intent } from './world.h.ts'
import { AXES } from '../defs/items.ts'
import { freshMul } from '../defs/crops.ts'
import { purposeMul, qualityMul } from '../defs/varieties.ts'
import type { StallGoodId } from './ids.ts'
import { Pump, RainTank, Tap, Well, Barrel, local, type Coord } from './building.ts'
import { topIndex } from './drop.ts'
import { countable, mergeInto, stackable, type Item } from './item.ts'
import { addBarrelFeed, barrelAccept, bakeCaskSale, barrelNeed, feedUnits, feedVariety, meanQuality, takeCount } from './machine.ts'
import { Accepts, finishFull } from './market.ts'
import { isPlot } from './plot.ts'
import type { Edge } from './pipe.ts'
import { board, driverVehicle } from './vehicle.ts'
import { flipLever, pressButton } from './sensor.ts'

export function begin(w: World, i: Intent): void {
  switch (i.act) {
    case 'walk':
      shiftHead(w)
      return
    case 'shovel':
      if (!canShovel(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, shovelTime(w, i.at))
      return
    case 'mine':
      if (!canMine(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, mineTime(w, i.at))
      return
    case 'plant':
      if (!canPlant(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.5)
      return
    case 'water':
      if (!canWater(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.4)
      return
    case 'fertilize':
      if (!canFertilize(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.6)
      return
    case 'compost':
      if (!canCompost(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.4)
      return
    case 'harvest':
      if (!canHarvest(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.5)
      return
    case 'pickup':
      doPickup(w, i.at)
      shiftHead(w)
      return
    case 'consign':
      doConsign(w)
      shiftHead(w)
      return
    case 'fill':
      if (!canFill(w, i.at)) {
        shiftHead(w)
        return
      }
      w.act.filling = true
      return
    case 'drop':
      doDrop(w, i.at)
      shiftHead(w)
      return
    case 'inventory':
      w.act.cue = { kind: 'inventory' }
      shiftHead(w)
      return
    case 'silo': {
      if (w.cell(i.at).kind !== 'seed-silo') {
        shiftHead(w)
        return
      }
      depositSilo(w)
      w.act.cue = { kind: 'silo', at: { ...i.at } }
      shiftHead(w)
      return
    }
    case 'additives': {
      if (w.cell(i.at).kind !== 'additive-store') {
        shiftHead(w)
        return
      }
      depositAdditives(w)
      w.act.cue = { kind: 'additives', at: { ...i.at } }
      shiftHead(w)
      return
    }
    case 'chest': {
      const c = w.cell(i.at)
      if (c.kind !== 'chest' && c.kind !== 'freezer') {
        shiftHead(w)
        return
      }
      if (w.act.id !== 0) {
        shiftHead(w)
        return
      }
      w.act.cue = { kind: 'chest', at: { ...i.at } }
      shiftHead(w)
      return
    }
    case 'grind':
      if (!canGrind(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.4)
      return
    case 'mill':
      if (!canMill(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.4)
      return
    case 'still':
      if (!canStill(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.4)
      return
    case 'furnace':
      if (!canFurnace(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.4)
      return
    case 'station': {
      if (w.cell(i.at).kind !== 'station') {
        shiftHead(w)
        return
      }
      if (canStation(w, i.at)) {
        arm(w, 0.4)
        return
      }
      w.act.cue = { kind: 'station', at: { ...i.at } }
      shiftHead(w)
      return
    }
    case 'barrel':
      if (!canBarrel(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.4)
      return
    case 'jam':
      if (!canJam(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, 0.4)
      return
    case 'hangar': {
      if (w.cell(i.at).kind !== 'hangar') {
        shiftHead(w)
        return
      }
      w.act.cue = { kind: 'hangar', at: { ...i.at } }
      shiftHead(w)
      return
    }
    case 'vehicle': {
      const v = w.vehicles.find(x => x.id === i.id)
      if (v === undefined || v.pose.kind !== 'field' || v.pose.driver !== 'none') {
        shiftHead(w)
        return
      }
      w.act.cue = { kind: 'vehicle', id: i.id }
      shiftHead(w)
      return
    }
    case 'embark': {
      const v = w.vehicles.find(x => x.id === i.id)
      if (
        v === undefined ||
        v.pose.kind !== 'field' ||
        v.pose.driver !== 'none' ||
        w.driverVehicle(w.act.id) !== undefined
      ) {
        shiftHead(w)
        return
      }
      const floor = { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) }
      if (!w.act.actor.inside(floor)) {
        shiftHead(w)
        return
      }
      board(w, v)
      shiftHead(w)
      return
    }
    case 'valve':
      arm(w, 0.3 / w.machineMul())
      return
    case 'toggle':
      arm(w, 0)
      return
    case 'tend':
      if (!canTend(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, TEND_WORK)
      return
    case 'weed-spray':
      doWeedSpray(w, i.at)
      shiftHead(w)
      return
    case 'chop':
      if (!canChop(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, AXES.axe.workSeconds)
      return
    case 'graft':
      if (!canGraft(w, i.at)) {
        shiftHead(w)
        return
      }
      arm(w, GRAFT_WORK)
      return
  }
}

export function finishWork(w: World): void {
  const i = w.act.queue[0]
  if (i === undefined) return
  if (i.act === 'shovel') doShovel(w, i.at)
  if (i.act === 'mine') doMine(w, i.at)
  if (i.act === 'plant') doPlant(w, i.at)
  if (i.act === 'water' && doWater(w, i.at)) {
    w.emit('poured')
    w.burst('pour', i.at)
  }
  if (i.act === 'fertilize') doFertilize(w, i.at)
  if (i.act === 'compost') doCompost(w, i.at)
  if (i.act === 'harvest') doHarvest(w, i.at)
  if (i.act === 'grind') doGrind(w, i.at)
  if (i.act === 'mill') doMill(w, i.at)
  if (i.act === 'still') doStill(w, i.at)
  if (i.act === 'furnace') doFurnace(w, i.at)
  if (i.act === 'station') doStation(w, i.at)
  if (i.act === 'barrel') doBarrel(w, i.at)
  if (i.act === 'jam') doJam(w, i.at)
  if (i.act === 'valve') doValve(w, i.edge)
  if (i.act === 'toggle') doToggle(w, i.at)
  if (i.act === 'tend') {
    doTend(w, i.at)
    w.burst('tend', i.at)
  }
  if (i.act === 'weed-spray') doWeedSpray(w, i.at)
  if (i.act === 'chop') doChop(w, i.at)
  if (i.act === 'graft') doGraft(w, i.at)
  shiftHead(w)
}

export function tickQueue(w: World, dt: number): void {
  if (w.act.workLeft > 0) {
    w.act.workLeft -= dt
    if (w.act.workLeft > 0) return
    finishWork(w)
    return
  }
  if (w.act.filling) {
    tickFill(w, dt)
    return
  }
  const next = w.act.queue[0]
  if (next === undefined) return
  if (next.act === 'vehicle' || next.act === 'embark') {
    const v = w.vehicles.find(x => x.id === next.id)
    if (v === undefined || v.pose.kind !== 'field') {
      shiftHead(w)
      return
    }
  }
  const at = dest(next, w)
  if (!w.act.actor.inside(at)) {
    w.act.actor.walkToward(at, dt, w.walkSpeed())
    return
  }
  begin(w, next)
}

export function tickFill(w: World, dt: number): void {
  const head = w.act.queue[0]
  if (head === undefined || head.act !== 'fill') {
    w.act.filling = false
    shiftHead(w)
    return
  }
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'container') {
    w.act.filling = false
    shiftHead(w)
    return
  }
  const c0 = w.cell(head.at)
  const source: Pump | RainTank | Tap | Well | undefined =
    c0.kind === 'pump' || c0.kind === 'rain-tank' || c0.kind === 'tap' || c0.kind === 'well' ? c0 : undefined
  if (source === undefined) {
    w.act.filling = false
    shiftHead(w)
    return
  }
  const c = w.act.hand.item
  const miss = c.capacityLiters - c.liters
  if (miss <= 0) {
    w.act.filling = false
      shiftHead(w)
    return
  }
  const add = fillDraw(w, source, dt)
  c.liters = add >= miss ? c.capacityLiters : c.liters + add
  if (c.liters === c.capacityLiters) {
    w.act.filling = false
      shiftHead(w)
  }
}

export function fillDraw(w: World, source: Pump | RainTank | Tap | Well, dt: number): number {
  if (source.kind === 'tap') {
    const net = w.netOfCell(source.base)
    if (net === undefined) return 0
    const got = pullWater(w, net.sources, TAP_RATE * dt)
    source.drawn += got
    return got
  }
  const got = source.water.take(source.water.rate * dt)
  if (source.kind === 'pump') w.pumpLiters += got
  return got
}

export function arm(w: World, seconds: number): void {
  if (seconds <= 0) {
    finishWork(w)
    return
  }
  w.act.workLeft = seconds
  w.act.workTotal = seconds
}

export function markWalk(w: World, i: Intent): void {
  if (w.act.actor.inside(dest(i, w))) return
  w.act.legStart = { x: w.act.actor.x, y: w.act.actor.y }
}

export function shiftHead(w: World): void {
  w.act.queue.shift()
  w.act.workLeft = 0
  w.act.workTotal = 0
  const next = w.act.queue[0]
  if (next !== undefined) markWalk(w, next)
  w.ping()
}

export function taskProgress(w: World): number {
  w.act = w.seats[w.local]
  const head = w.act.queue[0]
  if (head === undefined) return 0
  if (w.act.workLeft > 0 && w.act.workTotal > 0) return 1 - w.act.workLeft / w.act.workTotal
  if (w.act.filling && w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'container') {
    return w.act.hand.item.liters / w.act.hand.item.capacityLiters
  }
  const at = dest(head, w)
  if (!w.act.actor.inside(at)) {
    const tx = at.col + 0.5
    const ty = at.row + 0.5
    const span = Math.hypot(w.act.legStart.x - tx, w.act.legStart.y - ty)
    if (span === 0) return 1
    return 1 - Math.hypot(w.act.actor.x - tx, w.act.actor.y - ty) / span
  }
  return 1
}

export function doPickup(w: World, at: Coord): void {
  const i = topIndex(w.drops, at)
  if (i < 0) {
    const c = w.cell(at)
    const cover = c.kind === 'untilled' && c.cover.kind === 'grass'
    if (c.kind !== 'weed' && !cover) return
    const kind = c.kind === 'weed' ? 'weed' : 'grass'
    const held = w.act.hand
    if (held.kind === 'hold') {
      if (held.item.kind !== kind) return
      if (held.item.count >= stackMax(w, held.item)) {
        w.say(HAND_FULL)
        return
      }
      held.item.count += 1
    }
    if (c.kind === 'weed') {
      c.soil.weedChance = 0
      w.setCell(at, { kind: 'empty', soil: c.soil })
    } else if (c.kind === 'untilled') {
      w.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'bare' } })
    }
    if (held.kind === 'empty') w.act.hand = { kind: 'hold', item: { kind, count: 1 } }
      return
  }
  const taken = w.drops[i].item
  const held = w.act.hand
  if (held.kind === 'hold' && countable(held.item) && countable(taken) && stackable(held.item, taken)) {
    const room = stackMax(w, held.item) - held.item.count
    if (room <= 0) {
      w.say(HAND_FULL)
      return
    }
    const n = taken.count < room ? taken.count : room
    mergeInto(held.item, taken, n)
    if (n === taken.count) w.drops.splice(i, 1)
    else taken.count -= n
      return
  }
  w.drops.splice(i, 1)
  if (held.kind === 'empty') {
    w.act.hand = { kind: 'hold', item: taken }
      return
  }
  w.drops.push({ at: { ...at }, item: held.item })
  w.act.hand = { kind: 'hold', item: taken }
}

export function doDrop(w: World, at: Coord): void {
  if (w.act.hand.kind !== 'hold') return
  if (!isPlot(w.cell(at))) return
  w.drops.push({ at: { ...at }, item: w.act.hand.item })
  w.act.hand = { kind: 'empty' }
}

export function doConsign(w: World): void {
  if (w.act.hand.kind !== 'hold') return
  const item = w.act.hand.item
  if (item.kind === 'fruit') {
    const unit = freshMul(item.freshness) * qualityMul(item.quality) * purposeMul(item.variety, 'produce')
    splitConsign(w, item.crop, item.count, item.freshness === 0, rest => {
      w.stall[item.crop].take(item.variety, rest, unit, item.bio)
    })
    w.act.hand = { kind: 'empty' }
    completeConsign(w)
    return
  }
  if (item.kind === 'sugar') {
    splitConsign(w, 'sugar', item.liters, false, rest => {
      w.stall.sugar.takeSugar(rest, item.unitSale)
    })
    w.act.hand = { kind: 'empty' }
    completeConsign(w)
    return
  }
  if (item.kind === 'spirit') {
    splitConsign(w, item.spirit, item.count, false, rest => {
      w.stall[item.spirit].takeSpirit(item.variety, rest, item.unitSale)
    })
    w.act.hand = { kind: 'empty' }
    completeConsign(w)
    return
  }
  if (item.kind === 'cask') {
    splitConsign(w, item.cask, item.count, false, rest => {
      w.stall[item.cask].takeSpirit(item.variety, rest, item.unitSale)
    })
    w.act.hand = { kind: 'empty' }
    completeConsign(w)
    return
  }
  if (item.kind === 'jam') {
    splitConsign(w, `jam-${item.crop}`, item.count, false, rest => {
      w.stall[`jam-${item.crop}`].takeBaked(rest, item.unitSale)
    })
    w.act.hand = { kind: 'empty' }
    completeConsign(w)
    return
  }
  if (item.kind === 'oil' || item.kind === 'flour' || item.kind === 'extract') {
    splitConsign(w, item.kind, item.count, false, rest => {
      w.stall[item.kind].takeBaked(rest, item.unitSale)
    })
    w.act.hand = { kind: 'empty' }
    completeConsign(w)
    return
  }
  if (item.kind === 'rotten') {
    if (!w.hasSkill('clearance')) return
    w.clearance += item.count
    w.act.hand = { kind: 'empty' }
    completeConsign(w)
  }
}

export function completeConsign(w: World): void {
  w.consignRevision += 1

  finishFull(w)
}

export function splitConsign(w: World, 
  good: StallGoodId,
  n: number,
  skip: boolean,
  restToStall: (rest: number) => void,
): void {
  const bound = skip ? 0 : fillContracts(w, good, n)
  const rest = n - bound
  if (rest > 0) restToStall(rest)
}

export function fillContracts(w: World, good: StallGoodId, n: number): number {
  let left = n
  w.contracts.active.forEach(a => {
    a.bins.forEach(bin => {
      if (left <= 0) return
      if (!Accepts(bin.demand, good)) return
      const room = bin.demand.amount - bin.filled
      if (room <= 0) return
      const take = left < room ? left : room
      bin.filled += take
      left -= take
    })
  })
  return n - left
}

export function doMill(w: World, at: Coord): void {
  if (!canMill(w, at) || w.act.hand.kind !== 'hold') return
  const c = w.cell(at)
  if (c.kind !== 'mill') return
  const n = c.accept(w.act.hand.item)
  c.apply(w.act.hand.item, n)
  takeHandCount(w, n)
  w.track(at, c)
}

export function doStill(w: World, at: Coord): void {
  if (!canStill(w, at) || w.act.hand.kind !== 'hold') return
  const c = w.cell(at)
  if (c.kind !== 'still') return
  const n = c.accept(w.act.hand.item)
  c.apply(w.act.hand.item, n)
  takeHandCount(w, n)
  w.track(at, c)
}

export function doFurnace(w: World, at: Coord): void {
  if (!canFurnace(w, at) || w.act.hand.kind !== 'hold') return
  const c = w.cell(at)
  if (c.kind !== 'furnace') return
  const n = c.accept(w.act.hand.item)
  c.apply(w.act.hand.item, n)
  takeHandCount(w, n)
  w.track(at, c)
}

export function doStation(w: World, at: Coord): void {
  if (!canStation(w, at) || w.act.hand.kind !== 'hold') return
  const c = w.cell(at)
  if (c.kind !== 'station') return
  const n = c.accept(w.act.hand.item)
  c.apply(w.act.hand.item, n)
  takeHandCount(w, n)
  w.track(at, c)
}

export function doBarrel(w: World, at: Coord): void {
  if (canBarrelCollect(w, at)) {
    const barrel = w.cell(at) as Barrel
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
      if (it.count >= stackMax(w, it)) {
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
  const barrel = w.cell(at) as Barrel
  const take = barrelAccept(barrel, w.act.hand.item)
  if (take === undefined) return
  barrel.crop = take.crop
  addBarrelFeed(barrel.feed, take.variety, take.quality, take.n)
  takeHandCount(w, take.n)
  w.track(at, barrel)
}

export function doJam(w: World, at: Coord): void {
  if (!canJam(w, at) || w.act.hand.kind !== 'hold') return
  const c = w.cell(at)
  if (c.kind !== 'jam') return
  const n = c.accept(w.act.hand.item)
  c.apply(w.act.hand.item, n)
  takeHandCount(w, n)
  w.track(at, c)
}

export function doGrind(w: World, at: Coord): void {
  if (!canGrind(w, at) || w.act.hand.kind !== 'hold') return
  const c = w.cell(at)
  if (c.kind !== 'grinder') return
  const n = c.accept(w.act.hand.item)
  c.apply(w.act.hand.item, n)
  takeHandCount(w, n)
  w.track(at, c)
}

export function canMill(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  return c.kind === 'mill' && c.accept(w.act.hand.item) > 0
}

export function canStill(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  return c.kind === 'still' && c.accept(w.act.hand.item) > 0
}

export function canFurnace(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  return c.kind === 'furnace' && c.accept(w.act.hand.item) > 0
}

export function canStation(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  return c.kind === 'station' && c.accept(w.act.hand.item) > 0
}

export function canBarrel(w: World, at: Coord): boolean {
  if (canBarrelCollect(w, at)) return true
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  if (c.kind !== 'barrel') return false
  return barrelAccept(c, w.act.hand.item) !== undefined
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

export function canJam(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  return c.kind === 'jam' && c.accept(w.act.hand.item) > 0
}

export function canGrind(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  return c.kind === 'grinder' && c.accept(w.act.hand.item) > 0
}

export function canFill(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'container') return false
  return fillable(w, at)
}

export function doValve(w: World, edge: Edge): void {
  w.toggleValve(edge)
}

export function doToggle(w: World, at: Coord): void {
  const c = w.cell(at)
  if (c.kind === 'lever') {
    flipLever(c)

    w.ping()
    return
  }
  if (c.kind === 'button') {
    pressButton(c)

    w.ping()
  }
}

export function takeHandCount(w: World, n: number): void {
  if (w.act.hand.kind !== 'hold') return
  if (takeCount(w.act.hand.item, n)) w.act.hand = { kind: 'empty' }
}

export function depositSilo(w: World): void {
  const take = (it: Item): boolean => {
    if (it.kind !== 'seeds') return false
    const n = putSilo(w, it.crop, it.variety, it.quality, it.count)
    it.count -= n
    return it.count <= 0
  }
  if (w.act.hand.kind === 'hold' && take(w.act.hand.item)) w.act.hand = { kind: 'empty' }
  w.act.inventory.forEach((slot, i) => {
    if (slot.kind === 'hold' && take(slot.item)) w.act.inventory[i] = { kind: 'empty' }
  })
  w.compactInventory()
}

export function depositAdditives(w: World): void {
  const take = (it: Item): boolean => {
    if (it.kind === 'sugar') {
      it.liters -= putSugar(w, it.liters, it.unitSale, it.quality)
      return it.liters <= 0
    }
    if (it.kind !== 'fertilizer' && it.kind !== 'synth' && it.kind !== 'compost' && it.kind !== 'weed-spray') return false
    const n = putAdditive(w, it.kind, it.liters)
    it.liters -= n
    return it.liters <= 0
  }
  if (w.act.hand.kind === 'hold' && take(w.act.hand.item)) w.act.hand = { kind: 'empty' }
  w.act.inventory.forEach((slot, i) => {
    if (slot.kind === 'hold' && take(slot.item)) w.act.inventory[i] = { kind: 'empty' }
  })
  w.compactInventory()
}
