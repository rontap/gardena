import { DAY_SECONDS } from '../sim/clock.ts'
import { BIG_TICK } from '../sim/soil.ts'
import { SOURCE } from '../sim/water.ts'

export const RAIN_SOAK_DAY = 0.15
export const FLOOD_SOAK_DAY = 0.8
export const DRY_EVAP_DAY = 0.2
export const DROUGHT_EVAP_DAY = 0.4
export const WEATHER_FRUIT_SALE = 1.2
export const WEATHER_WEED_MUL = 1.5
export const RAIN_TANK_RAIN = 6
export const RAIN_TANK_FLOOD = 12
export const WELL_DROUGHT = 0.5
export const PUMP_COST_DRY = 1.5
export const PUMP_COST_DROUGHT = 3
export const SPECIAL_START = -0.4
export const SPECIAL_STEP = 0.2
export const SPECIAL_AFTER_CLEAR = -0.2
export const CONTINUE_START = 0.4
export const CONTINUE_STEP = 0.15
export const SEVERE_P = 0.1
export const PUMP_DAY_COST = 40
export const WEATHER_THROUGH_DAY = 100

export const PUMP_COST_PER_L = PUMP_DAY_COST / (SOURCE.pump.rate * DAY_SECONDS)
export const RAIN_SOAK_TICK = RAIN_SOAK_DAY / (DAY_SECONDS / BIG_TICK)
export const FLOOD_SOAK_TICK = FLOOD_SOAK_DAY / (DAY_SECONDS / BIG_TICK)
export const DRY_EVAP_TICK = DRY_EVAP_DAY / (DAY_SECONDS / BIG_TICK)
export const DROUGHT_EVAP_TICK = DROUGHT_EVAP_DAY / (DAY_SECONDS / BIG_TICK)

export const WEATHER_NAME = {
  clear: 'Clear',
  rain: 'Rain',
  dry: 'Dry',
  flood: 'Flood',
  drought: 'Drought',
} as const

export const WEATHER_KINDS = ['clear', 'rain', 'dry', 'flood', 'drought'] as const
