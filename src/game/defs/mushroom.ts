import type { WeatherKind } from '../sim/weather.ts'
import type { VarietyTier } from './varieties.ts'

export type MushroomId = 'fly-agaric' | 'truffle'

export const MUSHROOM_DAYS = 3

export const MUSHROOM_CHANCE: { readonly [K in WeatherKind]: number } = {
  clear: 0.02,
  rain: 0.16,
  flood: 0.32,
  dry: 0.01,
  drought: 0,
}

export const MUSHROOM_TRUFFLE: { readonly [K in VarietyTier]: number } = {
  base: 1 / 5,
  variant: 1 / 3,
  heirloom: 2 / 3,
}
