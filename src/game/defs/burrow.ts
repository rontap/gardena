import type { AxeId, PickaxeId, ShovelId, TreeId } from '../sim/ids.ts'
import type { VarietyId } from './varieties.ts'

export const BURROW_MUL = 3
export const BURROW_START_N = 3
export const BURROW_START_R = 8

export type BurrowLand = 'start' | 'other'

export const BURROW_DAY_CHANCE: { readonly [K in BurrowLand]: number } = { start: 0.66, other: 0.33 }
export const BURROW_DAY_MYCOLOGIST: { readonly [K in BurrowLand]: number } = { start: 0.03, other: 0.11 }

export function burrowDayChance(land: BurrowLand, rank: number): number {
  return BURROW_DAY_CHANCE[land] + BURROW_DAY_MYCOLOGIST[land] * rank
}

export const BURROW_DIST_FULL = 32
export const BURROW_UNCOMMON_BASE = 10
export const BURROW_UNCOMMON_DIST = 20
export const BURROW_UNCOMMON_DAYS = 20
export const BURROW_UNCOMMON_DAYS_FULL = 32
export const BURROW_RARE_BASE = 1
export const BURROW_RARE_STEP = 5
export const BURROW_RARE_DIST = 10
export const BURROW_RARE_DAYS = 10
export const BURROW_RARE_DAYS_FULL = 64
export const BURROW_RARE_MAX = 50

export const BURROW_TREASURE_MIN = 20
export const BURROW_TREASURE_MAX = 60
export const BURROW_TREASURE_UNCOMMON_MIN = 50
export const BURROW_TREASURE_UNCOMMON_MAX = 100
export const BURROW_SPECIAL_SHARE = 0.2
export const SEED_BASE_COUNT = 2
export const SEED_VARIANT_COUNT = 1
export const SEED_HEIRLOOM_COUNT = 1
export const WEED_LOOT_COUNT = 1
export const AGARIC_LOOT_COUNT = 1
export const TRUFFLE_LOOT_COUNT = 1
export const SKILL_POINT_LOOT = 1

export type BurrowRarity = 'common' | 'uncommon' | 'rare'
export const BURROW_RARITIES: readonly BurrowRarity[] = ['common', 'uncommon', 'rare']

type BurrowCrop = 'tomato' | 'raspberry' | 'grape'
export type BurrowTool = { kind: 'shovel'; id: ShovelId } | { kind: 'pickaxe'; id: PickaxeId } | { kind: 'axe'; id: AxeId }

export type BurrowEntry =
  | { kind: 'treasure'; min: number; max: number }
  | { kind: 'seeds'; count: number; pool: readonly { crop: BurrowCrop; variety: VarietyId }[] }
  | { kind: 'tree-seed'; pool: readonly { tree: TreeId; variety: VarietyId }[] }
  | { kind: 'weed' }
  | { kind: 'fly-agaric' }
  | { kind: 'truffle' }
  | { kind: 'tool'; pool: readonly BurrowTool[] }
  | { kind: 'special-tool'; pool: readonly BurrowTool[] }
  | { kind: 'skill-point' }
  | { kind: 'permit' }

export const BURROW_ENTRIES: { readonly [K in BurrowRarity]: readonly BurrowEntry[] } = {
  common: [
    {
      kind: 'seeds',
      count: SEED_BASE_COUNT,
      pool: [
        { crop: 'tomato', variety: 'base' },
        { crop: 'raspberry', variety: 'base' },
        { crop: 'grape', variety: 'base' },
      ],
    },
    {
      kind: 'tree-seed',
      pool: [
        { tree: 'apple', variety: 'base' },
        { tree: 'apricot', variety: 'base' },
        { tree: 'cherry', variety: 'base' },
        { tree: 'olive', variety: 'base' },
      ],
    },
    { kind: 'weed' },
    { kind: 'treasure', min: BURROW_TREASURE_MIN, max: BURROW_TREASURE_MAX },
    {
      kind: 'tool',
      pool: [
        { kind: 'shovel', id: 'better-shovel' },
        { kind: 'pickaxe', id: 'better-pickaxe' },
        { kind: 'axe', id: 'axe' },
      ],
    },
  ],
  uncommon: [
    {
      kind: 'seeds',
      count: SEED_VARIANT_COUNT,
      pool: [
        { crop: 'tomato', variety: 'green-zebra' },
        { crop: 'grape', variety: 'concord' },
      ],
    },
    {
      kind: 'tree-seed',
      pool: [
        { tree: 'apple', variety: 'kingston-black' },
        { tree: 'apricot', variety: 'blenheim' },
        { tree: 'olive', variety: 'arbequina' },
      ],
    },
    { kind: 'treasure', min: BURROW_TREASURE_UNCOMMON_MIN, max: BURROW_TREASURE_UNCOMMON_MAX },
    { kind: 'fly-agaric' },
    { kind: 'skill-point' },
  ],
  rare: [
    {
      kind: 'seeds',
      count: SEED_HEIRLOOM_COUNT,
      pool: [
        { crop: 'tomato', variety: 'san-marzano' },
        { crop: 'raspberry', variety: 'black-raspberry' },
        { crop: 'grape', variety: 'keknyelu' },
      ],
    },
    {
      kind: 'tree-seed',
      pool: [
        { tree: 'apple', variety: 'pink-lady' },
        { tree: 'apricot', variety: 'klosterneuburger' },
        { tree: 'cherry', variety: 'bing' },
      ],
    },
    { kind: 'permit' },
    {
      kind: 'special-tool',
      pool: [
        { kind: 'shovel', id: 'rotary-shovel' },
        { kind: 'pickaxe', id: 'diamond-pickaxe' },
        { kind: 'axe', id: 'electric-chainsaw' },
      ],
    },
    { kind: 'truffle' },
  ],
}
