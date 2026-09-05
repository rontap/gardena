import type { CropId } from '../sim/ids.ts'

export type VarietyTier = 'base' | 'variant' | 'heirloom'

export type VarietyId =
  | 'base'
  | 'bintje'
  | 'red-fife'
  | 'green-zebra'
  | 'san-marzano'
  | 'black-raspberry'
  | 'concord'
  | 'keknyelu'
  | 'kingston-black'
  | 'pink-lady'
  | 'klosterneuburger'
  | 'blenheim'
  | 'arbequina'
  | 'bing'

export type Purpose = 'produce' | 'processed' | 'alcohol'

export const VARIETY_IDS: readonly VarietyId[] = [
  'base',
  'bintje',
  'red-fife',
  'green-zebra',
  'san-marzano',
  'black-raspberry',
  'concord',
  'keknyelu',
  'kingston-black',
  'pink-lady',
  'klosterneuburger',
  'blenheim',
  'arbequina',
  'bing',
]

export const PURPOSE_MUL: {
  readonly [K in Exclude<VarietyTier, 'base'>]: { readonly on: number; readonly off: number }
} = {
  variant: { on: 1.5, off: 0.8 },
  heirloom: { on: 2, off: 0.7 },
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

export const VARIETY: {
  readonly [K in Exclude<VarietyId, 'base'>]: {
    crop: CropId
    tier: Exclude<VarietyTier, 'base'>
    purpose: Purpose
  }
} = {
  bintje: { crop: 'potato', tier: 'variant', purpose: 'alcohol' },
  'red-fife': { crop: 'wheat', tier: 'variant', purpose: 'processed' },
  'green-zebra': { crop: 'tomato', tier: 'variant', purpose: 'produce' },
  'san-marzano': { crop: 'tomato', tier: 'heirloom', purpose: 'processed' },
  'black-raspberry': { crop: 'raspberry', tier: 'heirloom', purpose: 'processed' },
  concord: { crop: 'grape', tier: 'variant', purpose: 'processed' },
  keknyelu: { crop: 'grape', tier: 'heirloom', purpose: 'alcohol' },
  'kingston-black': { crop: 'apple', tier: 'variant', purpose: 'alcohol' },
  'pink-lady': { crop: 'apple', tier: 'heirloom', purpose: 'produce' },
  klosterneuburger: { crop: 'apricot', tier: 'heirloom', purpose: 'alcohol' },
  blenheim: { crop: 'apricot', tier: 'variant', purpose: 'produce' },
  arbequina: { crop: 'olive', tier: 'variant', purpose: 'processed' },
  bing: { crop: 'cherry', tier: 'heirloom', purpose: 'produce' },
}

export const VARIETIES: { readonly [K in CropId]: readonly VarietyId[] } = {
  carrot: ['base'],
  potato: ['base', 'bintje'],
  wheat: ['base', 'red-fife'],
  tomato: ['base', 'green-zebra', 'san-marzano'],
  raspberry: ['base', 'black-raspberry'],
  grape: ['base', 'concord', 'keknyelu'],
  vanilla: ['base'],
  'sugar-cane': ['base'],
  apple: ['base', 'kingston-black', 'pink-lady'],
  apricot: ['base', 'blenheim', 'klosterneuburger'],
  olive: ['base', 'arbequina'],
  cherry: ['base', 'bing'],
}

export const STARTER_VARIETY_PACKS: readonly Exclude<VarietyId, 'base'>[] = [
  'bintje',
  'red-fife',
  'green-zebra',
  'san-marzano',
  'black-raspberry',
  'concord',
  'keknyelu',
]

export const STARTER_FRUIT: readonly Exclude<VarietyId, 'base'>[] = ['keknyelu', 'san-marzano']

export const STARTER_FRUIT_N = 5

export const STARTER_TREE_GRAFTS: readonly Exclude<VarietyId, 'base'>[] = [
  'kingston-black',
  'pink-lady',
  'blenheim',
  'klosterneuburger',
  'arbequina',
  'bing',
]

export const NEIGHBOUR_IDS: readonly VarietyId[] = ['keknyelu', 'pink-lady', 'bing']

export function needsNeighbour(variety: VarietyId): boolean {
  return NEIGHBOUR_IDS.includes(variety)
}

export function qualityMul(q: number): number {
  return 1 + (QUALITY_TOP - 1) * q
}

export function qualityGain(h: number, happyStart: number, happyMax: number): number {
  if (h >= happyStart) return (QUALITY_STEP * (h - happyStart)) / (happyMax - happyStart)
  return (-QUALITY_STEP * (happyStart - h)) / happyStart
}

export function tierOf(variety: VarietyId): VarietyTier {
  if (variety === 'base') return 'base'
  return VARIETY[variety].tier
}

export function purposeOf(variety: VarietyId): Purpose | 'base' {
  if (variety === 'base') return 'base'
  return VARIETY[variety].purpose
}

export type CaskGroup = 'base' | 'heirloom'

export function caskGroup(variety: VarietyId): CaskGroup {
  return tierOf(variety) === 'heirloom' ? 'heirloom' : 'base'
}

export function purposeMul(variety: VarietyId, path: Purpose): number {
  if (variety === 'base') return 1
  const { tier, purpose } = VARIETY[variety]
  const mul = PURPOSE_MUL[tier]
  return purpose === path ? mul.on : mul.off
}

export function varietyFits(crop: CropId, variety: VarietyId): boolean {
  if (variety === 'base') return true
  return VARIETY[variety].crop === crop
}
