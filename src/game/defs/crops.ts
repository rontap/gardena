import { m } from '../../paraglide/messages.js'
import { MILL_IN, SUGAR_BAG } from './items.ts'
import { TOL_MIN, TOL_RARITY, type Rarity } from './rarity.ts'
import type { CropId } from '../sim/ids.ts'

export type CropClass = 'root' | 'grain' | 'fruit'

export type CropDef = {
  id: CropId
  cls: CropClass
  desc: () => string
  growSeconds: number
  waterUsePerSec: number
  waterTolerance: number
  fertTolerance: number
  sale: number
  seed: number
  rotSeconds: number
  saleMul?: { readonly [K in Rarity]: number }
}

export const CROPS: { readonly [K in CropId]: CropDef } = {
  carrot: {
    id: 'carrot',
    cls: 'root',
    desc: () => m.catalog_crop_carrot(),
    growSeconds: 90,
    waterUsePerSec: 0.004889,
    waterTolerance: 0.9,
    fertTolerance: 0.9,
    sale: 3,
    seed: 1,
    rotSeconds: 420,
  },
  potato: {
    id: 'potato',
    cls: 'root',
    desc: () => m.catalog_crop_potato(),
    growSeconds: 120,
    waterUsePerSec: 0.00375,
    waterTolerance: 0.85,
    fertTolerance: 0.85,
    sale: 6,
    seed: 2,
    rotSeconds: 600,
  },
  wheat: {
    id: 'wheat',
    cls: 'grain',
    desc: () => m.catalog_crop_wheat(),
    growSeconds: 180,
    waterUsePerSec: 0.0045833,
    waterTolerance: 0.75,
    fertTolerance: 0.7,
    sale: 12,
    seed: 2,
    rotSeconds: 420,
  },
  tomato: {
    id: 'tomato',
    cls: 'fruit',
    desc: () => m.catalog_crop_tomato(),
    growSeconds: 280,
    waterUsePerSec: 0.0043611,
    waterTolerance: 0.65,
    fertTolerance: 0.6,
    sale: 20,
    seed: 3,
    rotSeconds: 300,
  },
  raspberry: {
    id: 'raspberry',
    cls: 'fruit',
    desc: () => m.catalog_crop_raspberry(),
    growSeconds: 340,
    waterUsePerSec: 0.0045833,
    waterTolerance: 0.6,
    fertTolerance: 0.55,
    sale: 26,
    seed: 4,
    rotSeconds: 160,
  },
  apple: {
    id: 'apple',
    cls: 'fruit',
    desc: () => m.catalog_crop_apple(),
    growSeconds: 600,
    waterUsePerSec: 0,
    waterTolerance: 0.9,
    fertTolerance: 0.9,
    sale: 15.4,
    seed: 4,
    rotSeconds: 660,
  },
  grape: {
    id: 'grape',
    cls: 'fruit',
    desc: () => m.catalog_crop_grape(),
    growSeconds: 300,
    waterUsePerSec: 0.005,
    waterTolerance: 0.62,
    fertTolerance: 0.58,
    sale: 18,
    seed: 3,
    rotSeconds: 220,
  },
  vanilla: {
    id: 'vanilla',
    cls: 'fruit',
    desc: () => m.catalog_crop_vanilla(),
    growSeconds: 480,
    waterUsePerSec: 0.0058333,
    waterTolerance: 0.42,
    fertTolerance: 0.38,
    sale: 22,
    seed: 8,
    rotSeconds: 600,
    saleMul: { common: 1, uncommon: 1.25, rare: 3, heirloom: 6 },
  },
  'sugar-cane': {
    id: 'sugar-cane',
    cls: 'grain',
    desc: () => m.catalog_crop_sugar_cane({ cane: MILL_IN, bag: SUGAR_BAG }),
    growSeconds: 200,
    waterUsePerSec: 0.0104167,
    waterTolerance: 0.55,
    fertTolerance: 0.65,
    sale: 5,
    seed: 1,
    rotSeconds: 360,
  },
  apricot: {
    id: 'apricot',
    cls: 'fruit',
    desc: () => m.catalog_crop_apricot(),
    growSeconds: 480,
    waterUsePerSec: 0,
    waterTolerance: 0.9,
    fertTolerance: 0.9,
    sale: 6.1,
    seed: 0,
    rotSeconds: 340,
  },
  olive: {
    id: 'olive',
    cls: 'fruit',
    desc: () => m.catalog_crop_olive(),
    growSeconds: 480,
    waterUsePerSec: 0,
    waterTolerance: 0.9,
    fertTolerance: 0.9,
    sale: 24.4,
    seed: 0,
    rotSeconds: 540,
  },
  cherry: {
    id: 'cherry',
    cls: 'fruit',
    desc: () => m.catalog_crop_cherry(),
    growSeconds: 480,
    waterUsePerSec: 0,
    waterTolerance: 0.9,
    fertTolerance: 0.9,
    sale: 8.45,
    seed: 0,
    rotSeconds: 180,
  },
}

export const CLASS_NAME: { readonly [K in CropClass]: () => string } = {
  root: () => m.names_class_root(),
  grain: () => m.names_class_grain(),
  fruit: () => m.names_class_fruit(),
}

export const CROP_NAME: { readonly [K in CropId]: () => string } = {
  carrot: () => m.names_crop_carrot(),
  potato: () => m.names_crop_potato(),
  wheat: () => m.names_crop_wheat(),
  tomato: () => m.names_crop_tomato(),
  raspberry: () => m.names_crop_raspberry(),
  grape: () => m.names_crop_grape(),
  vanilla: () => m.names_crop_vanilla(),
  'sugar-cane': () => m.names_crop_sugar_cane(),
  apple: () => m.names_crop_apple(),
  apricot: () => m.names_crop_apricot(),
  olive: () => m.names_crop_olive(),
  cherry: () => m.names_crop_cherry(),
}

export function tolerance(base: number, rarity: Rarity): number {
  const t = base * TOL_RARITY[rarity]
  return t < TOL_MIN ? TOL_MIN : t
}

const VARIETY: { readonly [K in CropId]: { readonly [R in Rarity]: () => string } } = {
  carrot: {
    common: () => m.names_variety_carrot_common(),
    uncommon: () => m.names_variety_carrot_uncommon(),
    rare: () => m.names_variety_carrot_rare(),
    heirloom: () => m.names_variety_carrot_heirloom(),
  },
  potato: {
    common: () => m.names_variety_potato_common(),
    uncommon: () => m.names_variety_potato_uncommon(),
    rare: () => m.names_variety_potato_rare(),
    heirloom: () => m.names_variety_potato_heirloom(),
  },
  wheat: {
    common: () => m.names_variety_wheat_common(),
    uncommon: () => m.names_variety_wheat_uncommon(),
    rare: () => m.names_variety_wheat_rare(),
    heirloom: () => m.names_variety_wheat_heirloom(),
  },
  tomato: {
    common: () => m.names_variety_tomato_common(),
    uncommon: () => m.names_variety_tomato_uncommon(),
    rare: () => m.names_variety_tomato_rare(),
    heirloom: () => m.names_variety_tomato_heirloom(),
  },
  raspberry: {
    common: () => m.names_variety_raspberry_common(),
    uncommon: () => m.names_variety_raspberry_uncommon(),
    rare: () => m.names_variety_raspberry_rare(),
    heirloom: () => m.names_variety_raspberry_heirloom(),
  },
  apple: {
    common: () => m.names_variety_apple_common(),
    uncommon: () => m.names_variety_apple_uncommon(),
    rare: () => m.names_variety_apple_rare(),
    heirloom: () => m.names_variety_apple_heirloom(),
  },
  grape: {
    common: () => m.names_variety_grape_common(),
    uncommon: () => m.names_variety_grape_uncommon(),
    rare: () => m.names_variety_grape_rare(),
    heirloom: () => m.names_variety_grape_heirloom(),
  },
  vanilla: {
    common: () => m.names_variety_vanilla_common(),
    uncommon: () => m.names_variety_vanilla_uncommon(),
    rare: () => m.names_variety_vanilla_rare(),
    heirloom: () => m.names_variety_vanilla_heirloom(),
  },
  'sugar-cane': {
    common: () => m.names_variety_sugar_cane_common(),
    uncommon: () => m.names_variety_sugar_cane_uncommon(),
    rare: () => m.names_variety_sugar_cane_rare(),
    heirloom: () => m.names_variety_sugar_cane_heirloom(),
  },
  apricot: {
    common: () => m.names_variety_apricot_common(),
    uncommon: () => m.names_variety_apricot_uncommon(),
    rare: () => m.names_variety_apricot_rare(),
    heirloom: () => m.names_variety_apricot_heirloom(),
  },
  olive: {
    common: () => m.names_variety_olive_common(),
    uncommon: () => m.names_variety_olive_uncommon(),
    rare: () => m.names_variety_olive_rare(),
    heirloom: () => m.names_variety_olive_heirloom(),
  },
  cherry: {
    common: () => m.names_variety_cherry_common(),
    uncommon: () => m.names_variety_cherry_uncommon(),
    rare: () => m.names_variety_cherry_rare(),
    heirloom: () => m.names_variety_cherry_heirloom(),
  },
}

export function cropVariety(id: CropId, rarity: Rarity): string {
  return VARIETY[id][rarity]()
}

export function freshMul(f: number): number {
  return f >= 0.8 ? 1 : f / 0.8
}
