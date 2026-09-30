import type { BurrowRarity } from '../../defs/burrow.ts'
import type { Item } from '../item.ts'

export type BurrowOdds = { uncommon: number; rare: number }

export type BurrowFind = { kind: 'item'; item: Item } | { kind: 'permit' } | { kind: 'skill-point' }

export type BurrowDig = { rarity: BurrowRarity; find: BurrowFind }
