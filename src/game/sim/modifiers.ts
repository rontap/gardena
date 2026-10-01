import { CROPS, tolerance, type CropDef } from '../defs/crops.ts'
import { HARDNESS, type Difficulty } from '../defs/rules.ts'
import { purposeMul, qualityMul, tierOf, VARIETY_GROW, VARIETY_ROT, type VarietyId } from '../defs/varieties.ts'
import { type CropId, type GrownCrop } from './ids.ts'
import { PLANT_FERT_PER_SEC } from './soil.ts'

export type Modifier = {
  id: string
  source: 'research' | 'fertilizer' | 'skill' | 'difficulty'
  crop?: CropId
  saleMul: number
  growSpeed: number
  waterUseMul: number
  fertUseMul: number
  rotMul: number
}

export type Stats = {
  sale: number
  growSeconds: number
  waterUsePerSec: number
  waterTolerance: number
  fertTolerance: number
  fertUsePerSec: number
  rotSeconds: number
}

export function apply(def: CropDef, variety: VarietyId, quality: number, mods: readonly Modifier[]): Stats {
  const mine = mods.filter(m => m.crop === undefined || m.crop === def.id)
  const skillSale = mine.reduce((a, m) => a * m.saleMul, 1)
  const growSpeed = mine.reduce((a, m) => a * m.growSpeed, 1)
  const waterUseMul = mine.reduce((a, m) => a * m.waterUseMul, 1)
  const fertUseMul = mine.reduce((a, m) => a * m.fertUseMul, 1)
  const rotMul = mine.reduce((a, m) => a * m.rotMul, 1)
  const tier = tierOf(variety)
  const cropSale = def.saleMul === undefined ? 1 : def.saleMul
  return {
    sale: def.sale * qualityMul(quality) * purposeMul(variety, 'produce') * skillSale * cropSale,
    growSeconds: (def.growSeconds * VARIETY_GROW[tier]) / growSpeed,
    waterUsePerSec: def.waterUsePerSec * waterUseMul,
    waterTolerance: tolerance(def.waterTolerance, tier),
    fertTolerance: tolerance(def.fertTolerance, tier),
    fertUsePerSec: PLANT_FERT_PER_SEC * def.fertUseMul * fertUseMul,
    rotSeconds: def.rotSeconds * VARIETY_ROT[tier] * rotMul,
  }
}

export function difficultyModifier(d: Difficulty): Modifier {
  return {
    id: 'difficulty',
    source: 'difficulty',
    saleMul: 1,
    growSpeed: 1,
    waterUseMul: 1,
    fertUseMul: HARDNESS[d].plantFertPerSec / PLANT_FERT_PER_SEC,
    rotMul: HARDNESS[d].rotMul,
  }
}

export function statsOf(crop: GrownCrop, variety: VarietyId, quality: number, mods: readonly Modifier[]): Stats {
  return apply(CROPS[crop], variety, quality, mods)
}
