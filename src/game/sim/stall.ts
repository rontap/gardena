import { CROPS } from '../defs/crops.ts'
import { VARIETY_IDS, type VarietyId } from '../defs/varieties.ts'
import { YARD, type Coord } from './building.ts'
import {
  ANNUAL_IDS,
  CASK_IDS,
  JAM_IDS,
  SPIRIT_KINDS,
  TREE_IDS,
  type CropId,
  type StallGoodId,
} from './ids.ts'
import type { Modifier } from './modifiers.ts'
import type { Rng } from './rng.ts'

export const STALL_IDS: StallGoodId[] = [
  ...ANNUAL_IDS,
  ...TREE_IDS,
  'sugar',
  ...SPIRIT_KINDS,
  ...CASK_IDS,
  ...JAM_IDS,
  'oil',
  'flour',
  'extract',
]

export function isCropStall(id: StallGoodId): id is CropId {
  return (ANNUAL_IDS as readonly string[]).includes(id) || (TREE_IDS as readonly string[]).includes(id)
}

export function isBakedStall(id: StallGoodId): boolean {
  return id === 'sugar' || id === 'oil' || id === 'flour' || id === 'extract' || id.startsWith('jam-')
}

export function isSpiritStall(id: StallGoodId): boolean {
  return (SPIRIT_KINDS as readonly string[]).includes(id) || (CASK_IDS as readonly string[]).includes(id)
}

export const BIO_KEYS = ['organic', 'synth'] as const
export type BioKey = (typeof BIO_KEYS)[number]

export function bioKey(bio: boolean): BioKey {
  return bio ? 'organic' : 'synth'
}

export type BioBins = { organic: number; synth: number }

export function goodIx(id: StallGoodId): number {
  return STALL_IDS.indexOf(id)
}

function saleMul(id: CropId, mods: readonly Modifier[]): number {
  return mods.filter(m => m.crop === undefined || m.crop === id).reduce((a, m) => a * m.saleMul, 1)
}

export function stallX(id: StallGoodId, mods: readonly Modifier[]): number {
  if (!isCropStall(id)) return 1
  return CROPS[id].sale * saleMul(id, mods)
}

function emptyBins(): { [K in VarietyId]: BioBins } {
  return Object.fromEntries(VARIETY_IDS.map(v => [v, { organic: 0, synth: 0 }])) as { [K in VarietyId]: BioBins }
}

export class StallGood {
  readonly id: StallGoodId
  sat: number
  readonly stock: { [K in VarietyId]: BioBins }
  readonly worth: { [K in VarietyId]: BioBins }

  constructor(id: StallGoodId) {
    this.id = id
    this.sat = 0
    this.stock = emptyBins()
    this.worth = emptyBins()
  }

  take(variety: VarietyId, count: number, unitWorth: number, bio: boolean): void {
    const k = bioKey(bio)
    this.stock[variety][k] += count
    this.worth[variety][k] += count * unitWorth
  }

  takeSugar(liters: number, unitSale: number): void {
    this.stock.base.organic += liters
    this.worth.base.organic += liters * unitSale
  }

  takeBaked(count: number, unitSale: number): void {
    this.stock.base.organic += count
    this.worth.base.organic += count * unitSale
  }

  takeSpirit(variety: VarietyId, count: number, unitSale: number): void {
    this.stock[variety].organic += count
    this.worth[variety].organic += count * unitSale
  }
}

export function binCount(g: StallGood): number {
  return VARIETY_IDS.reduce((n, variety) => n + g.stock[variety].organic + g.stock[variety].synth, 0)
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
