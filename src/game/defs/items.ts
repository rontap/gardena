import { DAY_SECONDS } from '../sim/clock.ts'
import type { ContainerId, PickaxeId, ShovelId } from '../sim/ids.ts'

export const SHOVELS: { readonly [K in ShovelId]: { uses: number; workSeconds: number } } = {
  shovel: { uses: 80, workSeconds: 1.2 },
  'better-shovel': { uses: 200, workSeconds: 0.6 },
}

export const PICKAXES: { readonly [K in PickaxeId]: { uses: number; workSeconds: number } } = {
  pickaxe: { uses: 25, workSeconds: 4 },
  'better-pickaxe': { uses: 40, workSeconds: 2 },
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
