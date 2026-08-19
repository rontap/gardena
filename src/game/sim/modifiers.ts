import { CROPS, type CropDef } from '../defs/crops.ts'
import { RARITY_GROW, RARITY_ROT, RARITY_SALE, type Rarity } from '../defs/rarity.ts'
import type { CropId } from './ids.ts'

export type Modifier = {
  id: string
  source: 'research' | 'fertilizer'
  crop?: CropId
  saleMul: number
  growSpeed: number
  waterUseMul: number
}

export type Stats = {
  sale: number
  growSeconds: number
  waterUsePerSec: number
  rotSeconds: number
}

export function apply(def: CropDef, rarity: Rarity, mods: readonly Modifier[]): Stats {
  const mine = mods.filter(m => m.crop === undefined || m.crop === def.id)
  const saleMul = mine.reduce((a, m) => a * m.saleMul, RARITY_SALE[rarity])
  const growSpeed = mine.reduce((a, m) => a * m.growSpeed, 1)
  const waterUseMul = mine.reduce((a, m) => a * m.waterUseMul, 1)
  return {
    sale: def.sale * saleMul,
    growSeconds: (def.growSeconds * RARITY_GROW[rarity]) / growSpeed,
    waterUsePerSec: def.waterUsePerSec * waterUseMul,
    rotSeconds: def.rotSeconds * RARITY_ROT[rarity],
  }
}

export function statsOf(crop: CropId, rarity: Rarity, mods: readonly Modifier[]): Stats {
  return apply(CROPS[crop], rarity, mods)
}
