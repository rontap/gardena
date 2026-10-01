import type { WeatherKind } from '../sim/weather.ts'
import { HAPPY_MAX } from './crops.ts'
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

export const MUSHROOM_MYCOLOGIST: { readonly [K in WeatherKind]: number } = {
  clear: 0.01,
  rain: 0.02,
  flood: 0.04,
  dry: 0.01,
  drought: 0,
}

export const MUSHROOM_HAPPY_MIN = 0.5
export const MUSHROOM_HAPPY_MAX = 1.5

export function mushroomChance(weather: WeatherKind, rank: number, happiness: number): number {
  const mul = MUSHROOM_HAPPY_MIN + ((MUSHROOM_HAPPY_MAX - MUSHROOM_HAPPY_MIN) * happiness) / HAPPY_MAX
  return (MUSHROOM_CHANCE[weather] + MUSHROOM_MYCOLOGIST[weather] * rank) * mul
}

export const MUSHROOM_TRUFFLE: { readonly [K in VarietyTier]: number } = {
  base: 1 / 5,
  variant: 1 / 3,
  heirloom: 2 / 3,
}
