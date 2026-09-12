import { SUGAR_BAG } from '../defs/items.ts'
import { freshMul } from '../defs/crops.ts'
import { ADDITIVE_BAG } from './building.ts'
import { purposeMul, qualityMul, tierOf, VARIETY_IDS } from '../defs/varieties.ts'
import { WEATHER_FRUIT_SALE } from '../defs/weather.ts'
import { frontOf, type AdditiveHolder, type AdditiveId, type Coord, type SeedStore } from './building.ts'
import { isPlot } from './plot.ts'
import { SPIRIT_KINDS, type AnnualId, type StallGoodId } from './ids.ts'
import type { Item } from './item.ts'
import { Accepts, SAT_DEPTH, SAT_RECOVER_PER_DAY, mul, paid } from './feature-contracts/market.ts'
import * as market from './feature-contracts/market.ts'
import { binCount, isBakedStall, isInfusedStall, isSpiritStall, stallX, STALL_IDS } from './stall.ts'
import type { VarietyId } from '../defs/varieties.ts'
import type { World } from './world.ts'
import type { SellAllQuote } from './feature-contracts/market.h.ts'

export function seedStoreAt(world: World, at: Coord): SeedStore {
  const c = world.cell(at)
  if (c.kind === 'seed-silo' || c.kind === 'silo-seed') return c
  return world.silo
}

export function additiveStoreAt(world: World, at: Coord): AdditiveHolder {
  const c = world.cell(at)
  if (c.kind === 'additive-store' || c.kind === 'silo-spray') return c
  return world.additives
}

export function putSilo(world: World, crop: AnnualId, variety: VarietyId, quality: number, count: number): number {
  return world.silo.put(crop, variety, quality, count)
}

export function takeSiloBody(world: World, at: Coord, crop: AnnualId, variety: VarietyId): void {
  const silo = seedStoreAt(world, at)
  const i = silo.seeds.findIndex(st => st.crop === crop && st.variety === variety)
  if (i < 0) return
  const st = silo.seeds[i]
  if (st.count <= 0) return
  const hand = world.act.hand
  if (hand.kind === 'hold' && hand.item.kind === 'seeds' && hand.item.crop === crop && hand.item.variety === variety) {
    const it = hand.item
    it.quality = (it.quality * it.count + st.quality * st.count) / (it.count + st.count)
    it.count += st.count
    silo.seeds.splice(i, 1)
    world.ping()
    return
  }
  if (!handToSilo(world, silo)) return
  silo.seeds.splice(i, 1)
  world.act.hand = { kind: 'hold', item: { kind: 'seeds', crop, variety, quality: st.quality, count: st.count } }
  world.ping()
}

function handToSilo(world: World, silo: SeedStore): boolean {
  const hand = world.act.hand
  if (hand.kind !== 'hold') return true
  const it = hand.item
  if (it.kind !== 'seeds') return freeHand(world)
  it.count -= silo.put(it.crop, it.variety, it.quality, it.count)
  if (it.count > 0) return freeHand(world)
  world.act.hand = { kind: 'empty' }
  return true
}

export function depositSilo(world: World, at: Coord): void {
  const silo = seedStoreAt(world, at)
  const take = (it: Item): boolean => {
    if (it.kind !== 'seeds') return false
    const n = silo.put(it.crop, it.variety, it.quality, it.count)
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
  return world.additives.putAdditive(id, liters)
}

export function takeSugarBody(world: World, at: Coord): void {
  const store = additiveStoreAt(world, at)
  const bin = store.sugar
  const hand = world.act.hand
  if (hand.kind === 'hold' && hand.item.kind === 'sugar') {
    const it = hand.item
    const n = Math.min(it.capacityLiters - it.liters, bin.liters)
    if (n <= 0) return
    const total = it.liters + n
    it.unitSale = (it.unitSale * it.liters + bin.unitSale * n) / total
    it.quality = (it.quality * it.liters + bin.quality * n) / total
    it.liters = total
    bin.liters -= n
    world.ping()
    return
  }
  const liters = Math.min(SUGAR_BAG, bin.liters)
  if (liters <= 0) return
  if (!handToAdditives(world, store)) return
  bin.liters -= liters
  world.act.hand = {
    kind: 'hold',
    item: { kind: 'sugar', liters, capacityLiters: SUGAR_BAG, unitSale: bin.unitSale, quality: bin.quality },
  }
  world.ping()
}

export function takeAdditiveBody(world: World, at: Coord, id: AdditiveId): void {
  const store = additiveStoreAt(world, at)
  const i = store.held.findIndex(h => h.id === id)
  if (i < 0) return
  const held = store.held[i]
  const bag = ADDITIVE_BAG[id]
  const hand = world.act.hand
  if (hand.kind === 'hold' && hand.item.kind === id) {
    const it = hand.item
    const n = Math.min(it.capacityLiters - it.liters, held.liters)
    if (n <= 0) return
    it.liters += n
    held.liters -= n
    if (held.liters <= 0) store.held.splice(i, 1)
    world.ping()
    return
  }
  const liters = Math.min(bag, held.liters)
  if (liters <= 0) return
  if (!handToAdditives(world, store)) return
  held.liters -= liters
  if (held.liters <= 0) store.held.splice(i, 1)
  world.act.hand = { kind: 'hold', item: { kind: id, liters, capacityLiters: bag } }
  world.ping()
}

function handToAdditives(world: World, store: AdditiveHolder): boolean {
  const hand = world.act.hand
  if (hand.kind !== 'hold') return true
  const it = hand.item
  if (it.kind === 'sugar') it.liters -= store.putSugar(it.liters, it.unitSale, it.quality)
  else if (it.kind === 'fertilizer' || it.kind === 'compost' || it.kind === 'weed-spray') {
    it.liters -= store.putAdditive(it.kind, it.liters)
  } else return freeHand(world)
  if (it.liters > 0) return freeHand(world)
  world.act.hand = { kind: 'empty' }
  return true
}

export function depositAdditives(world: World, at: Coord): void {
  const store = additiveStoreAt(world, at)
  const take = (it: Item): boolean => {
    if (it.kind === 'sugar') {
      it.liters -= store.putSugar(it.liters, it.unitSale, it.quality)
      return it.liters <= 0
    }
    if (it.kind !== 'fertilizer' && it.kind !== 'compost' && it.kind !== 'weed-spray') return false
    const n = store.putAdditive(it.kind, it.liters)
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

export function nearSite(world: World, at: Coord): Coord {
  const near = frontOf(at).find(p => world.inWorld(p) && isPlot(world.cell(p)))
  return near === undefined ? { ...at } : { ...near }
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
      world.stall[item.crop].take(item.variety, rest, unit)
    }, false)
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'sugar') {
    splitConsign(world, 'sugar', item.liters, false, rest => {
      world.stall.sugar.takeSugar(rest, item.unitSale)
    }, false)
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'spirit') {
    splitConsign(world, item.spirit, item.count, false, rest => {
      world.stall[item.spirit].takeSpirit(item.variety, rest, item.unitSale, item.infused)
    }, item.infused)
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'cask') {
    splitConsign(world, item.cask, item.count, false, rest => {
      world.stall[item.cask].takeSpirit(item.variety, rest, item.unitSale, item.infused)
    }, item.infused)
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'jam') {
    splitConsign(world, `jam-${item.crop}`, item.count, false, rest => {
      world.stall[`jam-${item.crop}`].takeSpirit(item.variety, rest, item.unitSale, item.infused)
    }, item.infused)
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'oil') {
    splitConsign(world, item.kind, item.count, false, rest => {
      world.stall[item.kind].takeSpirit('base', rest, item.unitSale, item.infused)
    }, item.infused)
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'flour' || item.kind === 'extract' || item.kind === 'bread') {
    splitConsign(world, item.kind, item.count, false, rest => {
      world.stall[item.kind].takeBaked(rest, item.unitSale)
    }, false)
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
    return
  }
  if (item.kind === 'rotten') {
    if (!world.done.has('unlock-fermentation')) return
    world.clearance += item.count
    world.act.hand = { kind: 'empty' }
    completeConsign(world)
  }
}

export function completeConsign(world: World): void {
  world.consignRevision += 1

  market.finishFull(world)
}

export function splitConsign(
  world: World,
  good: StallGoodId,
  n: number,
  skip: boolean,
  restToStall: (rest: number) => void,
  infused: boolean,
): void {
  const bound = skip ? 0 : fillContracts(world, good, n, infused)
  const rest = n - bound
  if (rest > 0) restToStall(rest)
}

export function fillContracts(world: World, good: StallGoodId, n: number, infused: boolean): number {
  let left = n
  world.contracts.active.forEach(a => {
    a.bins.forEach(bin => {
      if (left <= 0) return
      if (!Accepts(bin.demand, good)) return
      const room = bin.demand.amount - bin.filled
      if (room <= 0) return
      const take = left < room ? left : room
      bin.filled += take
      if (infused) bin.infusedFilled += take
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
    const { clean, infused } = stallClean(world, row.good)
    world.stall[row.good].sat = Math.min(1, row.sat + (clean - infused) / SAT_DEPTH)
  })
  STALL_IDS.forEach(id => {
    VARIETY_IDS.forEach(variety => {
      world.stall[id].stock[variety] = { plain: 0, infused: 0 }
      world.stall[id].worth[variety] = { plain: 0, infused: 0 }
    })
  })
  world.money += quote.paid
  world.clearance = 0
  world.emit('sold')
}

function specialtyMul(world: World, id: StallGoodId, variety: VarietyId): number {
  const t = tierOf(variety)
  if (t !== 'variant' && t !== 'heirloom') return 1
  if (id.startsWith('jam-')) return 1 + 0.05 * world.skillTier('specialty')
  if (id === 'wine' || id === 'cider') return 1 + 0.05 * world.skillTier('specialty')
  if ((SPIRIT_KINDS as readonly string[]).includes(id)) return 1 + 0.05 * world.skillTier('specialty')
  return 1
}

export function stallClean(world: World, id: StallGoodId): { clean: number; infused: number; clearance: number } {
  const saleX = 1 + 0.02 * world.skillTier('saleswoman')
  const heirX = 1 + 0.05 * world.skillTier('heirloom')
  if (isInfusedStall(id)) {
    return VARIETY_IDS.reduce(
      (acc, variety) => {
        const heir = isSpiritStall(id) && id !== 'cider' && tierOf(variety) === 'heirloom' ? heirX : 1
        const spec = specialtyMul(world, id, variety)
        const x = saleX * heir * spec
        const plain = world.stall[id].worth[variety].plain * x
        const inf = world.stall[id].worth[variety].infused * x
        return { clean: acc.clean + plain + inf, infused: acc.infused + inf, clearance: 0 }
      },
      { clean: 0, infused: 0, clearance: 0 },
    )
  }
  if (isBakedStall(id)) {
    const count = world.stall[id].stock.base.plain
    if (count === 0) return { clean: 0, infused: 0, clearance: 0 }
    return { clean: world.stall[id].worth.base.plain * saleX, infused: 0, clearance: 0 }
  }
  const x = stallX(id, world.modifiers)
  const w = world.weather(world.clock.day)
  const wx = w === 'flood' || w === 'drought' ? WEATHER_FRUIT_SALE : 1
  return VARIETY_IDS.reduce(
    (acc, variety) => {
      const heir = tierOf(variety) === 'heirloom' ? heirX : 1
      const count = world.stall[id].stock[variety].plain
      if (count === 0) return acc
      const worth = world.stall[id].worth[variety].plain
      const avg = worth / count
      return {
        clean: acc.clean + count * avg * x * heir * saleX * wx,
        infused: acc.infused,
        clearance: acc.clearance,
      }
    },
    { clean: 0, infused: 0, clearance: 0 },
  )
}

export function marketQuote(world: World): SellAllQuote {
  const rows = STALL_IDS.flatMap(id => {
    if (binCount(world.stall[id]) <= 0) return []
    const { clean, infused } = stallClean(world, id)
    const sat = world.stall[id].sat
    const plain = clean - infused
    return [
      {
        good: id,
        sat,
        mul: mul(sat, id),
        clean,
        paid: paid(sat, id, plain) + infused * mul(sat, id),
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
