import { DAY_SECONDS } from './clock.ts'

export const SOIL_WATER_MID = 1
export const SOIL_WATER_MAX = 2
export const SOIL_TILL_WATER = 0.75
export const FERT_PLOT_MAX = 1
export const BIO_RESTORE = 0.3
export const PLANT_FERT_PER_SEC = (1 / 720) * 0.6 * 0.9
export const STUNT = 0.67
export const WEED_WATER_PER_SEC = 0.008
export const WEED_FERT_PER_SEC = (1 / 240) * 0.6 * 0.9
export const WEED_GROW = 60
export const BIG_TICK = 10
export const WEED_CHANCE = 0.03
export const GRASS_CHANCE = 0.5
export const CHANCE_RAMP_TICKS = DAY_SECONDS / BIG_TICK

export function ramped(chance: number, bigTicks: number): number {
  const k = Math.min(1, bigTicks / CHANCE_RAMP_TICKS)
  return -0.1 + (chance + 0.1) * k
}

export type Band = 'green' | 'orange' | 'red'

export function fertBand(fertilizer: number, tol: number): Band {
  const floor = FERT_PLOT_MAX - tol
  if (fertilizer >= floor) return 'green'
  if (fertilizer <= floor / 2) return 'red'
  return 'orange'
}

export function waterBand(water: number, tol: number): Band {
  const d = Math.abs(water - SOIL_WATER_MID)
  if (d <= tol) return 'green'
  if (d >= (SOIL_WATER_MID + tol) / 2) return 'red'
  return 'orange'
}

export class Soil {
  water: number
  fertilizer: number
  bio = true
  weedChance: number

  constructor(water: number, fertilizer: number, weedChance: number) {
    this.water = water
    this.fertilizer = fertilizer
    this.weedChance = weedChance
  }

  get drowning(): boolean {
    return this.water > SOIL_WATER_MID
  }

  drink(liters: number): void {
    const next = this.water - liters
    this.water = next < 0 ? 0 : next
  }

  soak(liters: number): void {
    const next = this.water + liters
    this.water = next > SOIL_WATER_MAX ? SOIL_WATER_MAX : next
  }

  feed(liters: number): void {
    const next = this.fertilizer + liters
    this.fertilizer = next > FERT_PLOT_MAX ? FERT_PLOT_MAX : next
    if (liters >= BIO_RESTORE) this.bio = true
  }

  spike(liters: number): void {
    const next = this.fertilizer + liters
    this.fertilizer = next > FERT_PLOT_MAX ? FERT_PLOT_MAX : next
    this.bio = false
  }

  starve(liters: number): void {
    const next = this.fertilizer - liters
    this.fertilizer = next < 0 ? 0 : next
  }
}
