import { CROPS } from '../defs/crops.ts'
import { BERRY_SALE, RARITY_RANK, type Rarity } from '../defs/rarity.ts'
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
  'apple',
  'berry',
]

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
  if (id === 'berry') return BERRY_SALE
  return CROPS[id].sale * saleMul(id, mods)
}

export function rate(offered: number, market: number): number {
  if (tenths(offered) >= tenths(1.75 * market)) return 0
  return Math.min(0.2, (0.1 * market) / offered)
}

export class StallGood {
  readonly id: StallGoodId
  offered: number
  market: number
  target: number
  acc: number
  readonly stock: { [K in Rarity]: number }

  constructor(id: StallGoodId, x: number) {
    this.id = id
    this.offered = x
    this.market = x
    this.target = x
    this.acc = 0
    this.stock = { common: 0, uncommon: 0, rare: 0, heirloom: 0 }
  }
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
    const n = RARITY_RANK.reduce((s, r) => s + g.stock[r], 0)
    if (n <= 0) return
    const start = Math.floor(hash(seed, 'crate', goodIx(id)) * YARD.length)
    const at = YARD.map((_, i) => YARD[(start + i) % YARD.length]).find(c => !used.has(`${c.col},${c.row}`))
    if (at === undefined) return
    used.add(`${at.col},${at.row}`)
    out.push({ id, at })
  })
  return out
}
