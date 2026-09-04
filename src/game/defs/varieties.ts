import type { CropId } from '../sim/ids.ts'

export type VarietyTier = 'base' | 'variant' | 'heirloom'

export type VarietyId =
  | 'base'
  | 'bintje'
  | 'russian-banana'
  | 'sonora'
  | 'red-fife'
  | 'green-zebra'
  | 'san-marzano'
  | 'black-raspberry'
  | 'concord'
  | 'thompson'
  | 'keknyelu'
  | 'kingston-black'
  | 'pink-lady'
  | 'moorpark'
  | 'klosterneuburger'
  | 'blenheim'
  | 'kalamata'
  | 'arbequina'
  | 'montmorency'
  | 'bing'

export type Rating = 1 | 2 | 3 | 4 | 5

export type Use = { preserve: Rating | 'none'; fresh: Rating; alcohol: Rating | 'none' }

export const VARIETY_IDS: readonly VarietyId[] = [
  'base',
  'bintje',
  'russian-banana',
  'sonora',
  'red-fife',
  'green-zebra',
  'san-marzano',
  'black-raspberry',
  'concord',
  'thompson',
  'keknyelu',
  'kingston-black',
  'pink-lady',
  'moorpark',
  'klosterneuburger',
  'blenheim',
  'kalamata',
  'arbequina',
  'montmorency',
  'bing',
]

export const RATING_SALE: { readonly [K in Rating]: number } = {
  1: 0.6,
  2: 0.8,
  3: 1,
  4: 1.3,
  5: 1.8,
}

export const VARIETY_GROW: { readonly [K in VarietyTier]: number } = {
  base: 1,
  variant: (1 / 1.05 + 1 / 1.1) / 2,
  heirloom: 1,
}

export const VARIETY_TOL: { readonly [K in VarietyTier]: number } = {
  base: 1,
  variant: (0.92 + 0.8) / 2,
  heirloom: 0.65,
}

export const VARIETY_ROT: { readonly [K in VarietyTier]: number } = {
  base: 1,
  variant: (1 + 1 / 1.1) / 2,
  heirloom: 1 / 1.25,
}

export const QUALITY_TOP = 3.5
export const QUALITY_STEP = 0.25
export const BETTER_QUALITY = 0.04
export const TOL_MIN = 0.25

const none3none: Use = { preserve: 'none', fresh: 3, alcohol: 'none' }
const none33: Use = { preserve: 'none', fresh: 3, alcohol: 3 }
const u333: Use = { preserve: 3, fresh: 3, alcohol: 3 }
const u33none: Use = { preserve: 3, fresh: 3, alcohol: 'none' }

export const BASE_USE: { readonly [K in CropId]: Use } = {
  carrot: none3none,
  potato: none33,
  wheat: u333,
  tomato: u33none,
  raspberry: u33none,
  grape: u333,
  vanilla: u33none,
  'sugar-cane': u33none,
  apple: none33,
  apricot: u333,
  olive: u33none,
  cherry: u33none,
}

export const VARIETY: {
  readonly [K in Exclude<VarietyId, 'base'>]: { crop: CropId; tier: 'variant' | 'heirloom'; use: Use }
} = {
  bintje: { crop: 'potato', tier: 'variant', use: { preserve: 'none', fresh: 2, alcohol: 4 } },
  'russian-banana': { crop: 'potato', tier: 'heirloom', use: { preserve: 'none', fresh: 5, alcohol: 1 } },
  sonora: { crop: 'wheat', tier: 'variant', use: { preserve: 2, fresh: 3, alcohol: 4 } },
  'red-fife': { crop: 'wheat', tier: 'heirloom', use: { preserve: 5, fresh: 2, alcohol: 1 } },
  'green-zebra': { crop: 'tomato', tier: 'variant', use: { preserve: 2, fresh: 4, alcohol: 'none' } },
  'san-marzano': { crop: 'tomato', tier: 'heirloom', use: { preserve: 5, fresh: 2, alcohol: 'none' } },
  'black-raspberry': { crop: 'raspberry', tier: 'heirloom', use: { preserve: 5, fresh: 2, alcohol: 'none' } },
  concord: { crop: 'grape', tier: 'variant', use: { preserve: 4, fresh: 3, alcohol: 2 } },
  thompson: { crop: 'grape', tier: 'variant', use: { preserve: 3, fresh: 4, alcohol: 2 } },
  keknyelu: { crop: 'grape', tier: 'heirloom', use: { preserve: 1, fresh: 2, alcohol: 5 } },
  'kingston-black': { crop: 'apple', tier: 'variant', use: { preserve: 'none', fresh: 2, alcohol: 4 } },
  'pink-lady': { crop: 'apple', tier: 'heirloom', use: { preserve: 'none', fresh: 5, alcohol: 1 } },
  moorpark: { crop: 'apricot', tier: 'variant', use: { preserve: 3, fresh: 4, alcohol: 2 } },
  klosterneuburger: { crop: 'apricot', tier: 'variant', use: { preserve: 3, fresh: 2, alcohol: 4 } },
  blenheim: { crop: 'apricot', tier: 'heirloom', use: { preserve: 5, fresh: 2, alcohol: 1 } },
  kalamata: { crop: 'olive', tier: 'variant', use: { preserve: 2, fresh: 4, alcohol: 'none' } },
  arbequina: { crop: 'olive', tier: 'variant', use: { preserve: 4, fresh: 2, alcohol: 'none' } },
  montmorency: { crop: 'cherry', tier: 'variant', use: { preserve: 4, fresh: 2, alcohol: 'none' } },
  bing: { crop: 'cherry', tier: 'heirloom', use: { preserve: 2, fresh: 5, alcohol: 'none' } },
}

export const VARIETIES: { readonly [K in CropId]: readonly VarietyId[] } = {
  carrot: ['base'],
  potato: ['base', 'bintje', 'russian-banana'],
  wheat: ['base', 'sonora', 'red-fife'],
  tomato: ['base', 'green-zebra', 'san-marzano'],
  raspberry: ['base', 'black-raspberry'],
  grape: ['base', 'concord', 'thompson', 'keknyelu'],
  vanilla: ['base'],
  'sugar-cane': ['base'],
  apple: ['base', 'kingston-black', 'pink-lady'],
  apricot: ['base', 'moorpark', 'klosterneuburger', 'blenheim'],
  olive: ['base', 'kalamata', 'arbequina'],
  cherry: ['base', 'montmorency', 'bing'],
}

export const STARTER_VARIETY_PACKS: readonly Exclude<VarietyId, 'base'>[] = [
  'bintje',
  'russian-banana',
  'sonora',
  'red-fife',
  'green-zebra',
  'san-marzano',
  'black-raspberry',
  'concord',
  'thompson',
  'keknyelu',
]

export function qualityMul(q: number): number {
  return 1 + (QUALITY_TOP - 1) * q
}

export function qualityGain(h: number, happyStart: number, happyMax: number): number {
  if (h >= happyStart) return (QUALITY_STEP * (h - happyStart)) / (happyMax - happyStart)
  return (-QUALITY_STEP * (happyStart - h)) / happyStart
}

export function useOf(crop: CropId, variety: VarietyId): Use {
  if (variety === 'base') return BASE_USE[crop]
  return VARIETY[variety].use
}

export function tierOf(variety: VarietyId): VarietyTier {
  if (variety === 'base') return 'base'
  return VARIETY[variety].tier
}

export function varietyCrop(variety: VarietyId): CropId | 'any' {
  if (variety === 'base') return 'any'
  return VARIETY[variety].crop
}

export function isVarietyId(v: unknown): v is VarietyId {
  return typeof v === 'string' && (VARIETY_IDS as readonly string[]).includes(v)
}

export function varietyFits(crop: CropId, variety: VarietyId): boolean {
  if (variety === 'base') return true
  return VARIETY[variety].crop === crop
}
