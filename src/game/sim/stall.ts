import { CROPS } from '../defs/crops.ts'
import { RARITY_RANK, raritySale, type Rarity } from '../defs/rarity.ts'
import { YARD, type Coord } from './building.ts'
import type { CropId, StallGoodId } from './ids.ts'
import type { Modifier } from './modifiers.ts'
import { hash } from './rng.ts'

export const STALL_IDS: StallGoodId[] = [
  'carrot',
  'potato',
  'wheat',
  'tomato',
  'raspberry',
  'watermelon',
  'olive',
  'grape',
  'vanilla',
  'apple',
  'apricot',
  'lemon',
  'cherry',
  'sugar',
]

export const BIO_KEYS = ['organic', 'synth'] as const
export type BioKey = (typeof BIO_KEYS)[number]

export function bioKey(bio: boolean): BioKey {
  return bio ? 'organic' : 'synth'
}

export type BioBins = { organic: number; synth: number }

export function goodIx(id: StallGoodId): number {
  return STALL_IDS.indexOf(id)
}

export function tenths(n: number): number {
  return Math.floor(n * 10)
}

function saleMul(id: CropId, mods: readonly Modifier[]): number {
  return mods.filter(m => m.crop === undefined || m.crop === id).reduce((a, m) => a * m.saleMul, 1)
}

export function stallX(id: StallGoodId, mods: readonly Modifier[]): number {
  if (id === 'sugar') return CROPS['sugar-cane'].sale
  return CROPS[id].sale * saleMul(id, mods)
}

export function stallRarity(id: StallGoodId, rarity: Rarity): number {
  if (id === 'sugar') return 1
  return raritySale(CROPS[id], rarity)
}

export function rate(offered: number, market: number): number {
  if (tenths(offered) >= tenths(1.75 * market)) return 0
  return Math.min(0.2, (0.1 * market) / offered)
}

function emptyBins(): { [K in Rarity]: BioBins } {
  return {
    common: { organic: 0, synth: 0 },
    uncommon: { organic: 0, synth: 0 },
    rare: { organic: 0, synth: 0 },
    heirloom: { organic: 0, synth: 0 },
  }
}

export class StallGood {
  readonly id: StallGoodId
  offered: number
  market: number
  target: number
  acc: number
  readonly stock: { [K in Rarity]: BioBins }
  readonly worth: { [K in Rarity]: BioBins }

  constructor(id: StallGoodId, x: number) {
    this.id = id
    this.offered = x
    this.market = x
    this.target = x
    this.acc = 0
    this.stock = emptyBins()
    this.worth = emptyBins()
  }

  take(rarity: Rarity, count: number, freshness: number, bio: boolean): void {
    const k = bioKey(bio)
    this.stock[rarity][k] += count
    this.worth[rarity][k] += count * freshness
  }

  takeSugar(count: number, unitSale: number): void {
    this.stock.common.organic += count
    this.worth.common.organic += count * unitSale
  }
}

export function binCount(g: StallGood): number {
  return RARITY_RANK.reduce((n, rarity) => n + g.stock[rarity].organic + g.stock[rarity].synth, 0)
}

export type StallMap = { [K in StallGoodId]: StallGood }

export type StallSale = { good: StallGoodId; rarity: Rarity; money: number }

export function makeStall(id: StallGoodId, mods: readonly Modifier[]): StallGood {
  return new StallGood(id, stallX(id, mods))
}

export function crateCells(seed: number, stall: StallMap): { id: StallGoodId; at: Coord }[] {
  const used = new Set<string>()
  const out: { id: StallGoodId; at: Coord }[] = []
  STALL_IDS.forEach(id => {
    const g = stall[id]
    const n = binCount(g)
    if (n <= 0) return
    const start = Math.floor(hash(seed, 'crate', goodIx(id)) * YARD.length)
    const at = YARD.map((_, i) => YARD[(start + i) % YARD.length]).find(c => !used.has(`${c.col},${c.row}`))
    if (at === undefined) return
    used.add(`${at.col},${at.row}`)
    out.push({ id, at })
  })
  return out
}
