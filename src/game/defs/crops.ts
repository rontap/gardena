import { m } from '../../paraglide/messages.js'
import { MILL_IN, SUGAR_BAG } from './items.ts'
import { TOL_MIN, VARIETY_TOL, type VarietyId, type VarietyTier } from './varieties.ts'
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
  saleMul?: number
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
    saleMul: 1,
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

export const HAPPY_START = 0.5
export const HAPPY_MAX = 1
export const HAPPY_GAIN_SECONDS = 900
export const HAPPY_WILT_SECONDS = 240
export const HAPPY_STARVE_SECONDS = 400
export const HAPPY_DROWN_SECONDS = 180

export function tolerance(base: number, tier: VarietyTier): number {
  const t = base * VARIETY_TOL[tier]
  return t < TOL_MIN ? TOL_MIN : t
}

const NAMED: { readonly [K in Exclude<VarietyId, 'base'>]: () => string } = {
  bintje: () => m.names_variety_bintje(),
  'russian-banana': () => m.names_variety_russian_banana(),
  sonora: () => m.names_variety_sonora(),
  'red-fife': () => m.names_variety_red_fife(),
  'green-zebra': () => m.names_variety_green_zebra(),
  'san-marzano': () => m.names_variety_san_marzano(),
  'black-raspberry': () => m.names_variety_black_raspberry(),
  concord: () => m.names_variety_concord(),
  thompson: () => m.names_variety_thompson(),
  keknyelu: () => m.names_variety_keknyelu(),
  'kingston-black': () => m.names_variety_kingston_black(),
  'pink-lady': () => m.names_variety_pink_lady(),
  moorpark: () => m.names_variety_moorpark(),
  klosterneuburger: () => m.names_variety_klosterneuburger(),
  blenheim: () => m.names_variety_blenheim(),
  kalamata: () => m.names_variety_kalamata(),
  arbequina: () => m.names_variety_arbequina(),
  montmorency: () => m.names_variety_montmorency(),
  bing: () => m.names_variety_bing(),
}

export function cropVariety(id: CropId, variety: VarietyId): string {
  if (variety === 'base') return CROP_NAME[id]()
  return NAMED[variety]()
}

export function freshMul(f: number): number {
  return f >= 0.8 ? 1 : f / 0.8
}
