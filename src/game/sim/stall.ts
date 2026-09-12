import { CROPS } from '../defs/crops.ts'
import { VARIETY_IDS, type VarietyId } from '../defs/varieties.ts'
import { YARD, type Coord } from './building.ts'
import {
  CASK_IDS,
  JAM_IDS,
  PLANT_CROPS,
  SPIRIT_KINDS,
  TREE_IDS,
  type GrownCrop,
  type StallGoodId,
} from './ids.ts'
import type { InfusedKey } from './feature-contracts/market.h.ts'
import type { Modifier } from './modifiers.ts'
import type { Rng } from './rng.ts'

export const STALL_IDS: StallGoodId[] = [
  ...PLANT_CROPS,
  ...TREE_IDS,
  'sugar',
  ...SPIRIT_KINDS,
  ...CASK_IDS,
  ...JAM_IDS,
  'oil',
  'flour',
  'extract',
  'bread',
]

export const INFUSED_KEYS: readonly InfusedKey[] = ['plain', 'infused']

export function infusedKey(infused: boolean): InfusedKey {
  return infused ? 'infused' : 'plain'
}

export function isCropStall(id: StallGoodId): id is GrownCrop {
  return (PLANT_CROPS as readonly string[]).includes(id) || (TREE_IDS as readonly string[]).includes(id)
}

export function isBakedStall(id: StallGoodId): boolean {
  return id === 'sugar' || id === 'flour' || id === 'extract' || id === 'bread'
}

export function isInfusedStall(id: StallGoodId): boolean {
  return id === 'oil' || id.startsWith('jam-') || isSpiritStall(id)
}

export function isSpiritStall(id: StallGoodId): boolean {
  return (SPIRIT_KINDS as readonly string[]).includes(id) || (CASK_IDS as readonly string[]).includes(id)
}

export type InfusedBins = { [K in InfusedKey]: number }

export function goodIx(id: StallGoodId): number {
  return STALL_IDS.indexOf(id)
}

function saleMul(id: GrownCrop, mods: readonly Modifier[]): number {
  return mods.filter(m => m.crop === undefined || m.crop === id).reduce((a, m) => a * m.saleMul, 1)
}

export function stallX(id: StallGoodId, mods: readonly Modifier[]): number {
  if (!isCropStall(id)) return 1
  return CROPS[id].sale * saleMul(id, mods)
}

function emptyBins(): { [K in VarietyId]: InfusedBins } {
  return Object.fromEntries(VARIETY_IDS.map(v => [v, { plain: 0, infused: 0 }])) as { [K in VarietyId]: InfusedBins }
}

export class StallGood {
  readonly id: StallGoodId
  sat: number
  readonly stock: { [K in VarietyId]: InfusedBins }
  readonly worth: { [K in VarietyId]: InfusedBins }

  constructor(id: StallGoodId) {
    this.id = id
    this.sat = 0
    this.stock = emptyBins()
    this.worth = emptyBins()
  }

  take(variety: VarietyId, count: number, unitWorth: number): void {
    this.stock[variety].plain += count
    this.worth[variety].plain += count * unitWorth
  }

  takeSugar(liters: number, unitSale: number): void {
    this.stock.base.plain += liters
    this.worth.base.plain += liters * unitSale
  }

  takeBaked(count: number, unitSale: number): void {
    this.stock.base.plain += count
    this.worth.base.plain += count * unitSale
  }

  takeSpirit(variety: VarietyId, count: number, unitSale: number, infused: boolean): void {
    const k = infusedKey(infused)
    this.stock[variety][k] += count
    this.worth[variety][k] += count * unitSale
  }
}

export function binCount(g: StallGood): number {
  return VARIETY_IDS.reduce((n, variety) => n + g.stock[variety].plain + g.stock[variety].infused, 0)
}

export type StallMap = { [K in StallGoodId]: StallGood }

export function makeStall(id: StallGoodId): StallGood {
  return new StallGood(id)
}

export function crateCells(rng: Rng, stall: StallMap): { id: StallGoodId; at: Coord }[] {
  const used = new Set<string>()
  const out: { id: StallGoodId; at: Coord }[] = []
  STALL_IDS.forEach(id => {
    const g = stall[id]
    const n = binCount(g)
    if (n <= 0) return
    const start = Math.floor(rng.stream('gen').at(5, goodIx(id)) * YARD.length)
    const at = YARD.map((_, i) => YARD[(start + i) % YARD.length]).find(c => !used.has(`${c.col},${c.row}`))
    if (at === undefined) return
    used.add(`${at.col},${at.row}`)
    out.push({ id, at })
  })
  return out
}
