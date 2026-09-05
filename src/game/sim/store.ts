import { SUGAR_BAG } from '../defs/items.ts'
import { freshMul } from '../defs/crops.ts'
import { ADDITIVE_BAG } from './building.ts'
import { purposeMul, qualityMul, tierOf, VARIETY_IDS } from '../defs/varieties.ts'
import { WEATHER_FRUIT_SALE } from '../defs/weather.ts'
import { frontOf, type AdditiveId, type Coord } from './building.ts'
import { isPlot } from './plot.ts'
import type { AnnualId, StallGoodId } from './ids.ts'
import type { Item } from './item.ts'
import { Accepts, SAT_DEPTH, SAT_RECOVER_PER_DAY, mul, paid } from './feature-contracts/market.ts'
import * as market from './feature-contracts/market.ts'
import { BIO_KEYS, binCount, isBakedStall, isSpiritStall, stallX, STALL_IDS } from './stall.ts'
import type { VarietyId } from '../defs/varieties.ts'
import type { World } from './world.ts'
import type { SellAllQuote } from './feature-contracts/market.h.ts'

export function putSilo(world: World, crop: AnnualId, variety: VarietyId, quality: number, count: number): number {
  const n = Math.min(count, world.silo.free)
  if (n <= 0) return 0
  const hit = world.silo.seeds.find(st => st.crop === crop && st.variety === variety)
  if (hit !== undefined) {
    hit.quality = (hit.quality * hit.count + quality * n) / (hit.count + n)
    hit.count += n
  } else world.silo.seeds.push({ crop, variety, quality, count: n })
  return n
}

export function takeSiloBody(world: World, crop: AnnualId, variety: VarietyId): void {
  const i = world.silo.seeds.findIndex(st => st.crop === crop && st.variety === variety)
  if (i < 0) return
  const st = world.silo.seeds[i]
  if (st.count <= 0) return
  if (!freeHand(world)) return
  world.silo.seeds.splice(i, 1)
  world.act.hand = { kind: 'hold', item: { kind: 'seeds', crop, variety, quality: st.quality, count: st.count } }
  world.ping()
}

export function depositSilo(world: World): void {
  const take = (it: Item): boolean => {
    if (it.kind !== 'seeds') return false
    const n = putSilo(world, it.crop, it.variety, it.quality, it.count)
    it.count -= n
    return it.count <= 0
  }
  if (world.act.hand.kind === 'hold' && take(world.act.hand.item)) world.act.hand = { kind: 'empty' }
  world.act.inventory.forEach((slot, i) => {
    if (slot.kind === 'hold' && take(slot.item)) world.act.inventory[i] = { kind: 'empty' }
  })
  world.compactInventory()
}

export function putAdditive(world: World, id: AdditiveId, liters: number): number {
  const n = Math.min(liters, world.additives.free)
  if (n <= 0) return 0
  const hit = world.additives.held.find(h => h.id === id)
  if (hit !== undefined) hit.liters += n
  else world.additives.held.push({ id, liters: n })
  return n
}

export function takeSugarBody(world: World): void {
  const bin = world.additives.sugar
  const liters = Math.min(SUGAR_BAG, bin.liters)
  if (liters <= 0) return
  if (!freeHand(world)) return
  bin.liters -= liters
  world.act.hand = {
    kind: 'hold',
    item: { kind: 'sugar', liters, capacityLiters: SUGAR_BAG, unitSale: bin.unitSale, quality: bin.quality },
  }
  world.ping()
}

export function takeAdditiveBody(world: World, id: AdditiveId): void {
  const i = world.additives.held.findIndex(h => h.id === id)
  if (i < 0) return
  const held = world.additives.held[i]
  const bag = ADDITIVE_BAG[id]
  const liters = Math.min(bag, held.liters)
  if (liters <= 0) return
  if (!freeHand(world)) return
  held.liters -= liters
  if (held.liters <= 0) world.additives.held.splice(i, 1)
  world.act.hand = { kind: 'hold', item: { kind: id, liters, capacityLiters: bag } }
  world.ping()
}

export function depositAdditives(world: World): void {
  const take = (it: Item): boolean => {
    if (it.kind === 'sugar') {
      it.liters -= world.putSugar(it.liters, it.unitSale, it.quality)
      return it.liters <= 0
    }
    if (it.kind !== 'fertilizer' && it.kind !== 'synth' && it.kind !== 'compost' && it.kind !== 'weed-spray') return false
    const n = putAdditive(world, it.kind, it.liters)
    it.liters -= n
    return it.liters <= 0
  }
  if (world.act.hand.kind === 'hold' && take(world.act.hand.item)) world.act.hand = { kind: 'empty' }
  world.act.inventory.forEach((slot, i) => {
    if (slot.kind === 'hold' && take(slot.item)) world.act.inventory[i] = { kind: 'empty' }
  })
  world.compactInventory()
}

export function freeHand(world: World): boolean {
  if (world.act.hand.kind !== 'hold') return true
  const at = dropSite(world)
  if (at === undefined) return false
  world.drops.push({ at, item: world.act.hand.item })
  world.act.hand = { kind: 'empty' }
  return true
}

export function dropSite(world: World): Coord | undefined {
  const here = { col: Math.floor(world.act.actor.x), row: Math.floor(world.act.actor.y) }
  if (world.inWorld(here) && isPlot(world.cell(here))) return here
  const near = frontOf(here).find(p => world.inWorld(p) && isPlot(world.cell(p)))
  return near === undefined ? undefined : { ...near }
}

export function doConsign(world: World): void {
  if (world.act.hand.kind !== 'hold') return
  const item = world.act.hand.item
  if (item.kind === 'fruit') {
    const unit = freshMul(item.freshness) * qualityMul(item.quality) * purposeMul(item.variety, 'produce')
    splitConsign(world, item.crop, item.count, item.freshness === 0, rest => {
      world.stall[item.crop].take(item.variety, rest, unit, item.bio)
    })
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'sugar') {
    splitConsign(world, 'sugar', item.liters, false, rest => {
      world.stall.sugar.takeSugar(rest, item.unitSale)
    })
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'spirit') {
    splitConsign(world, item.spirit, item.count, false, rest => {
      world.stall[item.spirit].takeSpirit(item.variety, rest, item.unitSale)
    })
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'cask') {
    splitConsign(world, item.cask, item.count, false, rest => {
      world.stall[item.cask].takeSpirit(item.variety, rest, item.unitSale)
    })
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'jam') {
    splitConsign(world, `jam-${item.crop}`, item.count, false, rest => {
      world.stall[`jam-${item.crop}`].takeBaked(rest, item.unitSale)
    })
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'oil' || item.kind === 'flour' || item.kind === 'extract') {
    splitConsign(world, item.kind, item.count, false, rest => {
      world.stall[item.kind].takeBaked(rest, item.unitSale)
    })
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'rotten') {
    if (!world.hasSkill('clearance')) return
    world.clearance += item.count
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
  }
}

export function completeConsign(world: World): void {
  world.consignRevision += 1

  market.finishFull(world)
}

export function splitConsign(world: World, good: StallGoodId, n: number, skip: boolean, restToStall: (rest: number) => void): void {
  const bound = skip ? 0 : fillContracts(world, good, n)
  const rest = n - bound
  if (rest > 0) restToStall(rest)
}

export function fillContracts(world: World, good: StallGoodId, n: number): number {
  let left = n
  world.contracts.active.forEach(a => {
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

export function sellAllBody(world: World): void {
  if (!world.marketOpen()) return
  const quote = marketQuote(world)
  if (quote.paid === 0) return
  quote.rows.forEach(row => {
    world.stall[row.good].sat = Math.min(1, row.sat + row.clean / SAT_DEPTH)
  })
  STALL_IDS.forEach(id => {
    VARIETY_IDS.forEach(variety => {
      world.stall[id].stock[variety] = { organic: 0, synth: 0 }
      world.stall[id].worth[variety] = { organic: 0, synth: 0 }
    })
  })
  world.money += quote.paid
  world.clearance = 0
  world.emit('sold')
}

export function stallClean(world: World, id: StallGoodId): { clean: number; clearance: number } {
  const saleX = 1 + 0.02 * world.skillTier('saleswoman')
  const heirX = 1 + 0.05 * world.skillTier('heirloom')
  const bioX = 1 + 0.04 * world.skillTier('bio')
  if (isBakedStall(id)) {
    const count = world.stall[id].stock.base.organic
    if (count === 0) return { clean: 0, clearance: 0 }
    return { clean: world.stall[id].worth.base.organic * saleX, clearance: 0 }
  }
  if (isSpiritStall(id)) {
    return {
      clean: VARIETY_IDS.reduce((goodTotal, variety) => {
        const count = world.stall[id].stock[variety].organic
        if (count === 0) return goodTotal
        const worth = world.stall[id].worth[variety].organic
        const heir = id !== 'cider' && tierOf(variety) === 'heirloom' ? heirX : 1
        return goodTotal + worth * saleX * heir
      }, 0),
      clearance: 0,
    }
  }
  const x = stallX(id, world.modifiers)
  const w = world.weather(world.clock.day)
  const wx = w === 'flood' || w === 'drought' ? WEATHER_FRUIT_SALE : 1
  return VARIETY_IDS.reduce(
    (acc, variety) => {
      const heir = tierOf(variety) === 'heirloom' ? heirX : 1
      return BIO_KEYS.reduce((bioAcc, k) => {
        const count = world.stall[id].stock[variety][k]
        if (count === 0) return bioAcc
        const worth = world.stall[id].worth[variety][k]
        const avg = worth / count
        const organicMul = k === 'organic' ? bioX : 1
        return { clean: bioAcc.clean + count * avg * x * heir * saleX * organicMul * wx, clearance: bioAcc.clearance }
      }, acc)
    },
    { clean: 0, clearance: 0 },
  )
}

export function marketQuote(world: World): SellAllQuote {
  const rows = STALL_IDS.flatMap(id => {
    if (binCount(world.stall[id]) <= 0) return []
    const { clean } = stallClean(world, id)
    const sat = world.stall[id].sat
    return [
      {
        good: id,
        sat,
        mul: mul(sat, id),
        clean,
        paid: paid(sat, id, clean),
        recoverDays: sat / SAT_RECOVER_PER_DAY,
      },
    ]
  })
  return {
    rows,
    clean: rows.reduce((n, r) => n + r.clean, 0),
    paid: rows.reduce((n, r) => n + r.paid, 0) + world.clearance,
  }
}
