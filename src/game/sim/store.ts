import { m } from '../../paraglide/messages.js'
import { SUGAR_BAG } from '../defs/items.ts'
import { freshMul } from '../defs/crops.ts'
import { ADDITIVE_BAG } from './building.ts'
import { purposeMul, qualityMul, tierOf, VARIETIES, VARIETY_IDS } from '../defs/varieties.ts'
import { WEATHER_FRUIT_IMPACT } from '../defs/weather.ts'
import { frontOf, type AdditiveHolder, type AdditiveId, type Coord, type SeedStore } from './building.ts'
import { isPlot } from './plot.ts'
import { SPIRIT_KINDS, type AnnualId, type StallGoodId } from './ids.ts'
import { rottenName, type Item } from './item.ts'
import { Accepts, SAT_MAX_CUT, SAT_RECOVER, impactOf, mul, saleUnits, stepOf, unitOf } from './feature-contracts/market.ts'
import * as market from './feature-contracts/market.ts'
import { binCount, isBakedStall, isCropStall, isInfusedStall, isSpiritStall, stallGoodName, stallX, STALL_IDS } from './stall.ts'
import type { VarietyId } from '../defs/varieties.ts'
import type { World } from './world.ts'
import type { DemandChip, MarketQuote, Sale, SellAllQuote } from './feature-contracts/market.h.ts'

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
  if (!consignItem(world, world.act.hand.item)) return
  world.act.hand = { kind: 'empty' }
}

export function consignUnits(world: World, item: Item): number {
  if (item.kind === 'fruit') return item.count
  if (item.kind === 'sugar') return item.liters
  if (item.kind === 'rotten') return world.done.has('unlock-fermentation') ? item.count : 0
  if (
    item.kind === 'spirit' ||
    item.kind === 'cask' ||
    item.kind === 'jam' ||
    item.kind === 'oil' ||
    item.kind === 'flour' ||
    item.kind === 'extract' ||
    item.kind === 'bread'
  ) {
    return item.count
  }
  return 0
}

export function consignItem(world: World, item: Item): boolean {
  if (consignUnits(world, item) === 0) return false
  const stalled = toStall(world, item)
  market.finishFull(world)
  const paid = sellAllBody(world)
  if (paid > 0 && stalled.n > 0) {
    world.say(m.market_sold({ n: Math.round(stalled.n), good: stalled.name, money: Math.round(paid) }))
  }
  return true
}

function toStall(world: World, item: Item): Sale {
  if (item.kind === 'fruit') {
    const unit = freshMul(item.freshness) * qualityMul(item.quality) * purposeMul(item.variety, 'produce')
    const rest = splitConsign(world, item.crop, item.count, item.freshness === 0, n => {
      world.stall[item.crop].take(item.variety, n, unit)
    }, false)
    return { name: stallGoodName(item.crop, item.variety), n: rest }
  }
  if (item.kind === 'sugar') {
    const rest = splitConsign(world, 'sugar', item.liters, false, n => {
      world.stall.sugar.takeSugar(n, item.unitSale)
    }, false)
    return { name: stallGoodName('sugar', 'base'), n: rest }
  }
  if (item.kind === 'spirit') {
    const rest = splitConsign(world, item.spirit, item.count, false, n => {
      world.stall[item.spirit].takeSpirit(item.variety, n, item.unitSale, item.infused)
    }, item.infused)
    return { name: stallGoodName(item.spirit, item.variety), n: rest }
  }
  if (item.kind === 'cask') {
    const rest = splitConsign(world, item.cask, item.count, false, n => {
      world.stall[item.cask].takeSpirit(item.variety, n, item.unitSale, item.infused)
    }, item.infused)
    return { name: stallGoodName(item.cask, item.variety), n: rest }
  }
  if (item.kind === 'jam') {
    const good = `jam-${item.crop}` as StallGoodId
    const rest = splitConsign(world, good, item.count, false, n => {
      world.stall[good].takeSpirit(item.variety, n, item.unitSale, item.infused)
    }, item.infused)
    return { name: stallGoodName(good, item.variety), n: rest }
  }
  if (item.kind === 'oil') {
    const rest = splitConsign(world, item.kind, item.count, false, n => {
      world.stall.oil.takeSpirit('base', n, item.unitSale, item.infused)
    }, item.infused)
    return { name: stallGoodName('oil', 'base'), n: rest }
  }
  if (item.kind === 'flour' || item.kind === 'extract' || item.kind === 'bread') {
    const good = item.kind
    const rest = splitConsign(world, good, item.count, false, n => {
      world.stall[good].takeBaked(n, item.unitSale)
    }, false)
    return { name: stallGoodName(good, 'base'), n: rest }
  }
  if (item.kind === 'rotten') {
    world.clearance += item.count
    return { name: rottenName(item.cls), n: item.count }
  }
  throw new Error(item.kind)
}

export function splitConsign(
  world: World,
  good: StallGoodId,
  n: number,
  skip: boolean,
  restToStall: (rest: number) => void,
  infused: boolean,
): number {
  const bound = skip ? 0 : fillContracts(world, good, n, infused)
  const rest = n - bound
  if (rest > 0) restToStall(rest)
  return rest
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

export function sellAllBody(world: World): number {
  if (!world.marketOpen()) return 0
  const quote = marketQuote(world)
  if (quote.paid === 0) return 0
  STALL_IDS.forEach(id => {
    const next = quote.after[id]
    if (next !== undefined) world.stall[id].sat = next
    VARIETY_IDS.forEach(variety => {
      world.stall[id].stock[variety] = { plain: 0, infused: 0 }
      world.stall[id].worth[variety] = { plain: 0, infused: 0 }
    })
  })
  world.money += quote.paid
  world.clearance = 0
  world.emit('sold')
  return quote.paid
}

function specialtyMul(world: World, id: StallGoodId, variety: VarietyId): number {
  const t = tierOf(variety)
  if (t !== 'variant' && t !== 'heirloom') return 1
  if (id.startsWith('jam-')) return 1 + 0.05 * world.skillTier('specialty')
  if (id === 'wine' || id === 'cider') return 1 + 0.05 * world.skillTier('specialty')
  if ((SPIRIT_KINDS as readonly string[]).includes(id)) return 1 + 0.05 * world.skillTier('specialty')
  return 1
}

export function unitClean(world: World, id: StallGoodId, variety: VarietyId, infused: boolean): number {
  const saleX = 1 + 0.02 * world.skillTier('saleswoman')
  const heirX = 1 + 0.05 * world.skillTier('heirloom')
  const key = infused ? 'infused' : 'plain'
  const count = world.stall[id].stock[variety][key]
  if (count === 0) return 0
  const avg = world.stall[id].worth[variety][key] / count
  if (isInfusedStall(id)) {
    const heir = isSpiritStall(id) && id !== 'cider' && tierOf(variety) === 'heirloom' ? heirX : 1
    return avg * saleX * heir * specialtyMul(world, id, variety)
  }
  if (isBakedStall(id)) return avg * saleX
  const heir = tierOf(variety) === 'heirloom' ? heirX : 1
  return avg * stallX(id, world.modifiers) * heir * saleX
}

export function stallClean(world: World, id: StallGoodId): { clean: number; infused: number; clearance: number } {
  return VARIETY_IDS.reduce(
    (acc, variety) => {
      const nPlain = world.stall[id].stock[variety].plain
      const nInf = world.stall[id].stock[variety].infused
      const plain = nPlain * unitClean(world, id, variety, false)
      const inf = nInf * unitClean(world, id, variety, true)
      return { clean: acc.clean + plain + inf, infused: acc.infused + inf, clearance: 0 }
    },
    { clean: 0, infused: 0, clearance: 0 },
  )
}

export function marketQuote(world: World): SellAllQuote {
  const kind = world.weather(world.clock.day)
  const after: { [K in StallGoodId]?: number } = {}
  const rows = STALL_IDS.flatMap(id => {
    if (binCount(world.stall[id]) <= 0) return []
    const S0 = world.stall[id].sat
    const recoverDays = Math.abs(S0) * SAT_MAX_CUT / SAT_RECOVER[id]
    const wx = isCropStall(id) && (kind === 'flood' || kind === 'drought') ? WEATHER_FRUIT_IMPACT : 0
    const rate = stepOf(id)
    const out: MarketQuote[] = []
    let sat = S0
    VARIETY_IDS.forEach(variety => {
      const n = world.stall[id].stock[variety].plain
      if (n > 0) {
        const cap = impactOf(id, variety)
        const avg = unitClean(world, id, variety, false)
        const shown = mul(sat, cap, wx)
        const sale = saleUnits(sat, n, rate, cap, avg, wx)
        out.push({
          good: id,
          variety,
          infused: false,
          count: n,
          sat,
          mul: shown,
          cap,
          clean: n * avg,
          paid: sale.paid,
          recoverDays,
        })
        sat = sale.after
      }
      const infN = world.stall[id].stock[variety].infused
      if (infN > 0) {
        const cap = impactOf(id, variety)
        const avg = unitClean(world, id, variety, true)
        const shown = mul(S0, cap, wx)
        out.push({
          good: id,
          variety,
          infused: true,
          count: infN,
          sat: S0,
          mul: shown,
          cap,
          clean: infN * avg,
          paid: infN * avg * shown,
          recoverDays,
        })
      }
    })
    after[id] = sat
    return out
  })
  return {
    rows,
    clean: rows.reduce((n, r) => n + r.clean, 0),
    paid: rows.reduce((n, r) => n + r.paid, 0) + world.clearance,
    after,
  }
}

export function marketDemand(world: World): DemandChip[] {
  const kind = world.weather(world.clock.day)
  return STALL_IDS.flatMap(id => {
    const wx = isCropStall(id) && (kind === 'flood' || kind === 'drought') ? WEATHER_FRUIT_IMPACT : 0
    const sat = world.stall[id].sat
    const recoverDays = Math.abs(sat) * SAT_MAX_CUT / SAT_RECOVER[id]
    const rows = demandVarieties(id).map(variety => {
      const cap = impactOf(id, variety)
      const shown = mul(sat, cap, wx)
      const msrp = unitOf(id) * purposeMul(variety, 'produce')
      return { good: id, variety, shown, cap, sat, recoverDays, msrp, price: msrp * shown }
    })
    const split = rows.some(r => r.shown !== rows[0].shown)
    return (split ? rows : [rows[0]]).filter(r => Math.round(r.shown * 100) !== 100)
  })
}

function demandVarieties(id: StallGoodId): readonly VarietyId[] {
  return isCropStall(id) ? VARIETIES[id] : ['base']
}
