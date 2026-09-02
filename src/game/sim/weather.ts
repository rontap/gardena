import {
  CONTINUE_START,
  CONTINUE_STEP,
  DROUGHT_EVAP_TICK,
  DRY_EVAP_TICK,
  FLOOD_SOAK_TICK,
  PUMP_COST_DROUGHT,
  PUMP_COST_DRY,
  RAIN_SOAK_TICK,
  RAIN_TANK_FLOOD,
  RAIN_TANK_RAIN,
  SEVERE_P,
  SPECIAL_AFTER_CLEAR,
  SPECIAL_START,
  SPECIAL_STEP,
  WEATHER_WEED_MUL,
  WELL_DROUGHT,
} from '../defs/weather.ts'
import { Rng } from './rng.ts'
import type { SourceKind } from './water.ts'

export type WeatherKind = 'clear' | 'rain' | 'dry' | 'flood' | 'drought'

export function forecastWeather(
  seed: number,
  throughDay: number,
  pins?: Map<number, WeatherKind>,
): WeatherKind[] {
  const weather = new Rng(seed).stream('weather')
  const out: WeatherKind[] = []
  let prev: WeatherKind = 'clear'
  let specialP = SPECIAL_START
  let continueP = CONTINUE_START
  for (let D = 1; D <= throughDay; D++) {
    const pinned = pins !== undefined ? pins.get(D) : undefined
    let kind: WeatherKind
    if (pinned !== undefined) kind = pinned
    else if (prev === 'flood' || prev === 'drought') kind = 'clear'
    else if (prev === 'clear') {
      kind = weather.at(D, 0) < specialP ? (weather.at(D, 1) < 0.5 ? 'rain' : 'dry') : 'clear'
    } else if (weather.at(D, 0) < SEVERE_P) kind = prev === 'rain' ? 'flood' : 'drought'
    else if (weather.at(D, 1) < continueP) kind = prev
    else kind = 'clear'
    if (kind === 'clear') {
      if (prev === 'rain' || prev === 'dry') specialP = SPECIAL_AFTER_CLEAR
      else if (prev === 'flood' || prev === 'drought') specialP = SPECIAL_START
      else specialP += SPECIAL_STEP
    } else if (kind === 'rain' || kind === 'dry') {
      continueP = prev === kind ? continueP - CONTINUE_STEP : CONTINUE_START
    }
    prev = kind
    out.push(kind)
  }
  return out
}

export function sourceRateMul(kind: SourceKind, weather: WeatherKind): number {
  if (kind === 'pump') return 1
  if (kind === 'well') return weather === 'drought' ? WELL_DROUGHT : 1
  if (weather === 'rain') return RAIN_TANK_RAIN
  if (weather === 'flood') return RAIN_TANK_FLOOD
  if (weather === 'dry' || weather === 'drought') return 0
  return 1
}

export function pumpCostMul(weather: WeatherKind): number {
  if (weather === 'dry') return PUMP_COST_DRY
  if (weather === 'drought') return PUMP_COST_DROUGHT
  return 1
}

export function weedMul(weather: WeatherKind): number {
  if (weather === 'rain' || weather === 'flood') return WEATHER_WEED_MUL
  if (weather === 'dry' || weather === 'drought') return 0
  return 1
}

export function soakDelta(weather: WeatherKind): number {
  if (weather === 'rain') return RAIN_SOAK_TICK
  if (weather === 'flood') return FLOOD_SOAK_TICK
  if (weather === 'dry') return -DRY_EVAP_TICK
  if (weather === 'drought') return -DROUGHT_EVAP_TICK
  return 0
}
