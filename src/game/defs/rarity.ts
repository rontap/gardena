export type Rarity = 'common' | 'uncommon' | 'rare' | 'heirloom'

export const RARITY_SALE: { readonly [K in Rarity]: number } = {
  common: 1,
  uncommon: 1.25,
  rare: 2,
  heirloom: 3.5,
}

export const RARITY_WEIGHT: { readonly [K in Rarity]: number } = {
  common: 0.55,
  uncommon: 0.35,
  rare: 0.09,
  heirloom: 0.01,
}

export const BERRY_SALE = 2
