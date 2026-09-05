import type { World } from './world.ts'
import { tierOf, type VarietyId } from '../defs/varieties.ts'
import type { AnnualId, StallGoodId } from './ids.ts'
import { frontOf, inWorld, type AdditiveId, type Coord } from './building.ts'
import { crafted, type Countable } from './item.ts'
import { mul, paid } from './market.ts'
import type { SellAllQuote } from './market.h.ts'
import { binCount, isBakedStall, isSpiritStall, stallX } from './stall.ts'
import { isPlot } from './plot.ts'
import { compactSlots, putSugarInto } from './vehicle.ts'

export function putGrass(w: World, count: number): void {
  const merge = grassSlot(w)
  if (merge >= 0) {
    const slot = w.act.inventory[merge]
    if (slot.kind === 'hold' && slot.item.kind === 'grass-seeds') slot.item.count += count
    return
  }
  w.act.inventory[w.act.inventory.findIndex(s => s.kind === 'empty')] = {
    kind: 'hold',
    item: { kind: 'grass-seeds', count },
  }
}

export function canFitGrass(w: World): boolean {
  return grassSlot(w) >= 0 || w.act.inventory.some(s => s.kind === 'empty')
}

export function grassSlot(w: World): number {
  return w.act.inventory.findIndex(s => s.kind === 'hold' && s.item.kind === 'grass-seeds')
}

export function putSilo(w: World, crop: AnnualId, variety: VarietyId, quality: number, count: number): number {
  const n = Math.min(count, w.silo.free)
  if (n <= 0) return 0
  const hit = w.silo.seeds.find(st => st.crop === crop && st.variety === variety)
  if (hit !== undefined) {
    hit.quality = (hit.quality * hit.count + quality * n) / (hit.count + n)
    hit.count += n
  } else w.silo.seeds.push({ crop, variety, quality, count: n })
  return n
}

export function takeSiloBody(w: World, crop: AnnualId, variety: VarietyId): void {
  const i = w.silo.seeds.findIndex(st => st.crop === crop && st.variety === variety)
  if (i < 0) return
  const st = w.silo.seeds[i]
  if (st.count <= 0) return
  if (!freeHand(w)) return
  w.silo.seeds.splice(i, 1)
  w.act.hand = { kind: 'hold', item: { kind: 'seeds', crop, variety, quality: st.quality, count: st.count } }
  w.ping()
}

export function putAdditive(w: World, id: AdditiveId, liters: number): number {
  const n = Math.min(liters, w.additives.free)
  if (n <= 0) return 0
  const hit = w.additives.held.find(h => h.id === id)
  if (hit !== undefined) hit.liters += n
  else w.additives.held.push({ id, liters: n })
  return n
}

export function takeAdditiveBody(w: World, id: AdditiveId): void {
  const i = w.additives.held.findIndex(h => h.id === id)
  if (i < 0) return
  const held = w.additives.held[i]
  const bag = ADDITIVE_BAG[id]
  const liters = Math.min(bag, held.liters)
  if (liters <= 0) return
  if (!freeHand(w)) return
  held.liters -= liters
  if (held.liters <= 0) w.additives.held.splice(i, 1)
  w.act.hand = { kind: 'hold', item: { kind: id, liters, capacityLiters: bag } }
  w.ping()
}

export function putSugar(w: World, liters: number, unitSale: number, quality: number): number {
  return putSugarInto(w.additives, liters, unitSale, quality)
}

export function takeSugarBody(w: World): void {
  const bin = w.additives.sugar
  const liters = Math.min(SUGAR_BAG, bin.liters)
  if (liters <= 0) return
  if (!freeHand(w)) return
  bin.liters -= liters
  w.act.hand = {
    kind: 'hold',
    item: { kind: 'sugar', liters, capacityLiters: SUGAR_BAG, unitSale: bin.unitSale, quality: bin.quality },
  }
  w.ping()
}

export function freeHand(w: World): boolean {
  if (w.act.hand.kind !== 'hold') return true
  const at = dropSite(w)
  if (at === undefined) return false
  w.drops.push({ at, item: w.act.hand.item })
  w.act.hand = { kind: 'empty' }
  return true
}

export function dropSite(w: World): Coord | undefined {
  const here = { col: Math.floor(w.act.actor.x), row: Math.floor(w.act.actor.y) }
  if (w.inWorld(here) && isPlot(w.cell(here))) return here
  const near = frontOf(here).find(p => w.inWorld(p) && isPlot(w.cell(p)))
  return near === undefined ? undefined : { ...near }
}

export function stallClean(w: World, id: StallGoodId): { clean: number; clearance: number } {
  const saleX = 1 + 0.02 * w.skillTier('saleswoman')
  const heirX = 1 + 0.05 * w.skillTier('heirloom')
  const bioX = 1 + 0.04 * w.skillTier('bio')
  if (isBakedStall(id)) {
    const count = w.stall[id].stock.base.organic
    if (count === 0) return { clean: 0, clearance: 0 }
    return { clean: w.stall[id].worth.base.organic * saleX, clearance: 0 }
  }
  if (isSpiritStall(id)) {
    return {
      clean: VARIETY_IDS.reduce((goodTotal, variety) => {
        const count = w.stall[id].stock[variety].organic
        if (count === 0) return goodTotal
        const worth = w.stall[id].worth[variety].organic
        const heir = id !== 'cider' && tierOf(variety) === 'heirloom' ? heirX : 1
        return goodTotal + worth * saleX * heir
      }, 0),
      clearance: 0,
    }
  }
  const x = stallX(id, w.modifiers)
  const w = w.weather(w.clock.day)
  const wx = w === 'flood' || w === 'drought' ? WEATHER_FRUIT_SALE : 1
  return VARIETY_IDS.reduce(
    (acc, variety) => {
      const heir = tierOf(variety) === 'heirloom' ? heirX : 1
      return BIO_KEYS.reduce((bioAcc, k) => {
        const count = w.stall[id].stock[variety][k]
        if (count === 0) return bioAcc
        const worth = w.stall[id].worth[variety][k]
        const avg = worth / count
        const organicMul = k === 'organic' ? bioX : 1
        return { clean: bioAcc.clean + count * avg * x * heir * saleX * organicMul * wx, clearance: bioAcc.clearance }
      }, acc)
    },
    { clean: 0, clearance: 0 },
  )
}

export function marketQuote(w: World): SellAllQuote {
  const rows = STALL_IDS.flatMap(id => {
    if (binCount(w.stall[id]) <= 0) return []
    const { clean } = stallClean(w, id)
    const sat = w.stall[id].sat
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
    paid: rows.reduce((n, r) => n + r.paid, 0) + w.clearance,
  }
}

export function marketGain(w: World): number {
  if (!w.marketOpen()) return 0
  return marketQuote(w).paid
}

export function sellAllBody(w: World): void {
  if (!w.marketOpen()) return
  const quote = marketQuote(w)
  if (quote.paid === 0) return
  quote.rows.forEach(row => {
    w.stall[row.good].sat = Math.min(1, row.sat + row.clean / SAT_DEPTH)
  })
  STALL_IDS.forEach(id => {
    VARIETY_IDS.forEach(variety => {
      w.stall[id].stock[variety] = { organic: 0, synth: 0 }
      w.stall[id].worth[variety] = { organic: 0, synth: 0 }
    })
  })
  w.money += quote.paid
  w.clearance = 0
  w.emit('sold')
}

export function swapBody(w: World, i: number): void {
  const held = w.act.hand
  w.act.hand = w.act.inventory[i]
  w.act.inventory[i] = held
  w.compactInventory()
  w.ping()
}

export function swapChestBody(w: World, at: Coord, i: number): void {
  const cell = w.cell(at)
  if (cell.kind !== 'chest' && cell.kind !== 'freezer') return
  const held = w.act.hand
  w.act.hand = cell.slots[i]
  cell.slots[i] = held
  compactSlots(cell.slots)
  w.ping()
}

export function stackMax(w: World, item: Countable): number {
  return crafted(item)
    ? STACK_MAX_CRAFTED + BULK_UP_CRAFTED_STEP * w.skillTier('bulk-up')
    : STACK_MAX + BULK_UP_STEP * w.skillTier('bulk-up')
}

export function expandSlots(w: World): number {
  return (
    (w.done.has('unlock-expand') ? 1 : 0) +
    (w.done.has('expand-land') ? 1 : 0) +
    (w.done.has('eminent-domain') ? 1 : 0) +
    w.skillTier('inherit-land') +
    w.prizeSlots
  )
}

export function expandLeft(w: World): number {
  const left = expandSlots(w) - w.purchases
  return left < 0 ? 0 : left
}
