import { DAY_SECONDS } from '../sim/clock.ts'
import type { ContainerId, JamCrop, PickaxeId, ShovelId, SpiritKind } from '../sim/ids.ts'
import type { Rarity } from './rarity.ts'

export const SHOVELS: { readonly [K in ShovelId]: { uses: number; workSeconds: number } } = {
  shovel: { uses: 80, workSeconds: 1.2 },
  'better-shovel': { uses: 200, workSeconds: 0.6 },
  'rotary-shovel': { uses: 1000, workSeconds: 0.2 },
}

export const PICKAXES: { readonly [K in PickaxeId]: { uses: number; workSeconds: number } } = {
  pickaxe: { uses: 25, workSeconds: 4 },
  'better-pickaxe': { uses: 40, workSeconds: 2 },
  'diamond-pickaxe': { uses: 1000, workSeconds: 0.4 },
}

export const CONTAINERS: { readonly [K in ContainerId]: { capacityLiters: number } } = {
  bucket: { capacityLiters: 3 },
  'large-bucket': { capacityLiters: 8 },
}

export const BOX_SMALL = 5
export const BOX_LARGE = 14
export const CHEST_SLOTS = 9
export const GRIND_WORK = 2
export const GRIND_MIN = 1
export const GRIND_MAX = 3
export const SPEECH_S = 2.5
export const SHRUB_GROW = 360
export const GRASS_GROW = DAY_SECONDS / 4
export const GRASS_WATER_PER_SEC = 0.0012
export const GRASS_PACK = 5
export const ROTARY_DIGS = 200
export const DIAMOND_MINES = 150
export const SPRINKLER_TILE_DAY = 2.5
export const SPRINKLER_TILE_RATE = SPRINKLER_TILE_DAY / DAY_SECONDS
export const FERT_BAG_LITERS = 5
export const SYNTH_BAG_LITERS = 8
export const COMPOST_LITERS = 3
export const COMPOST_NEED = 10
export const COMPOST_SECONDS = 120
export const COMPOST_VALUE = {
  seeds: 1,
  fruit: 5,
  heirloom: 20,
  grass: 1,
  weed: 1,
  rotten: 2,
  dead: 1,
} as const

export const FREEZER_SLOTS = 6
export const SUGAR_BAG = 2
export const SUGAR_MILL = 5
export const SUGAR_SHOP = 8
export const MILL_IN = 5
export const MILL_GRASS = 15
export const MILL_WORK = 3
export const JAM_IN = 5
export const JAM_SUGAR = 0.4
export const JAM_SECONDS = 20
export const JAM_BUFFER = 4
export const STILL_CAP = 10
export const STILL_WATER = 0.1
export const STILL_SECONDS = 180
export const BARREL_CAP = 5
export const BARREL_MATURE = DAY_SECONDS
export const BARREL_AGE = 3 * DAY_SECONDS
export const OIL = 96
export const FLOUR = 72
export const EXTRACT = 8
export const MIXED_MUL = 0.7
export const WINE_SALE = 108
export const SPIRIT_SALE: { readonly [K in Exclude<SpiritKind, 'mixed'>]: number } = {
  vodka: 72,
  beer: 144,
  brandy: 108,
}
export const SPIRIT_RARITY: { readonly [K in Rarity]: number } = {
  common: 1,
  uncommon: 1.15,
  rare: 1.3,
  heirloom: 1.45,
}
export const WINE_AGE: { readonly [K in Rarity]: number } = {
  common: 1.5,
  uncommon: 2,
  rare: 2.5,
  heirloom: 3,
}
export const JAM_SALE: { readonly [K in JamCrop]: number } = {
  apricot: 36,
  grape: 72,
  raspberry: 104,
  apple: 80,
  cherry: 20,
  tomato: 80,
}
