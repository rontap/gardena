export type Rarity = 'common' | 'uncommon' | 'rare' | 'heirloom'

export const RARITY_SALE: { readonly [K in Rarity]: number } = {
  common: 1,
  uncommon: 1.25,
  rare: 2,
  heirloom: 3.5,
}

export const RARITY_GROW: { readonly [K in Rarity]: number } = {
  common: 1,
  uncommon: 1 / 1.05,
  rare: 1 / 1.1,
  heirloom: 1,
}

export const RARITY_ROT: { readonly [K in Rarity]: number } = {
  common: 1,
  uncommon: 1,
  rare: 1 / 1.1,
  heirloom: 1 / 1.25,
}

export const RARITY_WEIGHT: { readonly [K in Rarity]: number } = {
  common: 0.55,
  uncommon: 0.35,
  rare: 0.09,
  heirloom: 0.01,
}

export const TOL_RARITY: { readonly [K in Rarity]: number } = {
  common: 1,
  uncommon: 0.92,
  rare: 0.8,
  heirloom: 0.65,
}

export const TOL_MIN = 0.25

export const BERRY_SALE = 2

export const HAPPY_START = 0.5

export const HAPPY_MAX = 1

export const HAPPY_GAIN_SECONDS = 600

export const HAPPY_WILT_SECONDS = 480

export const HAPPY_STARVE_SECONDS = 600

export const HAPPY_DROWN_SECONDS = 120

export const RARITY_RANK: readonly Rarity[] = ['common', 'uncommon', 'rare', 'heirloom']

export function rarityOdds(h: number): { up2: number; up1: number; down: number } {
  const x = h / HAPPY_START
  if (h >= HAPPY_START) return { up2: 0.005 * x, up1: 0.05 * x, down: 0 }
  return { up2: 0, up1: 0.05 * x, down: 0.05 * (1 - x) }
}

export function stepRarity(r: Rarity, delta: number): Rarity {
  const i = RARITY_RANK.indexOf(r)
  const j = Math.min(RARITY_RANK.length - 1, Math.max(0, i + delta))
  return RARITY_RANK[j]
}

export function rollGrowRarity(r: Rarity, h: number, u: number): Rarity {
  const { up2, up1, down } = rarityOdds(h)
  if (u < up2) return stepRarity(r, 2)
  if (u < up2 + up1) return stepRarity(r, 1)
  if (u < up2 + up1 + down) return stepRarity(r, -1)
  return r
}
