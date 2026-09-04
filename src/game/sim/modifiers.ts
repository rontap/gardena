import { CROPS, tolerance, type CropDef } from '../defs/crops.ts'
import {
  qualityMul,
  RATING_SALE,
  tierOf,
  useOf,
  VARIETY_GROW,
  VARIETY_ROT,
  type VarietyId,
} from '../defs/varieties.ts'
import type { CropId } from './ids.ts'

export type Modifier = {
  id: string
  source: 'research' | 'fertilizer' | 'skill'
  crop?: CropId
  saleMul: number
  growSpeed: number
  waterUseMul: number
}

export type Stats = {
  sale: number
  growSeconds: number
  waterUsePerSec: number
  waterTolerance: number
  fertTolerance: number
  rotSeconds: number
}

export function apply(def: CropDef, variety: VarietyId, quality: number, mods: readonly Modifier[]): Stats {
  const mine = mods.filter(m => m.crop === undefined || m.crop === def.id)
  const skillSale = mine.reduce((a, m) => a * m.saleMul, 1)
  const growSpeed = mine.reduce((a, m) => a * m.growSpeed, 1)
  const waterUseMul = mine.reduce((a, m) => a * m.waterUseMul, 1)
  const tier = tierOf(variety)
  const fresh = useOf(def.id, variety).fresh
  const cropSale = def.saleMul === undefined ? 1 : def.saleMul
  return {
    sale: def.sale * qualityMul(quality) * RATING_SALE[fresh] * skillSale * cropSale,
    growSeconds: (def.growSeconds * VARIETY_GROW[tier]) / growSpeed,
    waterUsePerSec: def.waterUsePerSec * waterUseMul,
    waterTolerance: tolerance(def.waterTolerance, tier),
    fertTolerance: tolerance(def.fertTolerance, tier),
    rotSeconds: def.rotSeconds * VARIETY_ROT[tier],
  }
}

export function statsOf(crop: CropId, variety: VarietyId, quality: number, mods: readonly Modifier[]): Stats {
  return apply(CROPS[crop], variety, quality, mods)
}
