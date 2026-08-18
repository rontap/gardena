export type Rarity = 'common' | 'uncommon' | 'rare' | 'heirloom'

export const RARITY_SALE: { readonly [K in Rarity]: number } = {
  common: 1,
  uncommon: 1.5,
  rare: 2.5,
  heirloom: 4,
}
