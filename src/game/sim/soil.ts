import { DAY_SECONDS } from './clock.ts'

export const SOIL_WATER_MID = 1
export const SOIL_WATER_MAX = 2
export const SOIL_TILL_WATER = 0.75
export const FERT_PLOT_MAX = 1
export const PLANT_FERT_PER_SEC = 0.00085
export const STUNT = 0.67
export const WEED_WATER_PER_SEC = 0.008
export const WEED_FERT_PER_SEC = (1 / 240) * 0.6 * 0.9
export const WEED_GROW = 60
export const WEED_GONE_DAYS = 1
export const BIG_TICK = 10
export const GRASS_CHANCE = 0.5
export const GRASS_RAMP_START = -0.1
export const CHANCE_RAMP_TICKS = DAY_SECONDS / BIG_TICK

export function ramped(chance: number, bigTicks: number, start: number): number {
  const k = Math.min(1, bigTicks / CHANCE_RAMP_TICKS)
  return start + (chance - start) * k
}

export const TREE_WATER_MAX = 10
export const TREE_WATER_MID = 5
export const TREE_FERT_MAX = 2

export type Band = 'green' | 'orange' | 'red'

export function fertBand(fertilizer: number, tol: number, max = FERT_PLOT_MAX): Band {
  const floor = max - tol
  if (fertilizer >= floor) return 'green'
  if (fertilizer <= floor / 2) return 'red'
  return 'orange'
}

export function waterBand(water: number, tol: number, mid = SOIL_WATER_MID): Band {
  const d = Math.abs(water - mid)
  if (d <= tol) return 'green'
  if (d >= (mid + tol) / 2) return 'red'
  return 'orange'
}

export function happyBand(h: number): Band {
  if (h < 0.25) return 'red'
  if (h < 0.5) return 'orange'
  return 'green'
}

export class Soil {
  water: number
  fertilizer: number
  weedChance: number
  readonly waterMax: number
  readonly waterMid: number
  readonly fertMax: number

  constructor(
    water: number,
    fertilizer: number,
    weedChance: number,
    waterMax = SOIL_WATER_MAX,
    waterMid = SOIL_WATER_MID,
    fertMax = FERT_PLOT_MAX,
  ) {
    this.water = water
    this.fertilizer = fertilizer
    this.weedChance = weedChance
    this.waterMax = waterMax
    this.waterMid = waterMid
    this.fertMax = fertMax
  }

  get drowning(): boolean {
    return this.water > this.waterMid
  }

  drink(liters: number): void {
    const next = this.water - liters
    this.water = next < 0 ? 0 : next
  }

  soak(liters: number): void {
    const next = this.water + liters
    this.water = next > this.waterMax ? this.waterMax : next
  }

  feed(liters: number): void {
    const next = this.fertilizer + liters
    this.fertilizer = next > this.fertMax ? this.fertMax : next
  }

  starve(liters: number): void {
    const next = this.fertilizer - liters
    this.fertilizer = next < 0 ? 0 : next
  }
}

export function makeTreeSoil(water: number, fertilizer: number, weedChance: number): Soil {
  return new Soil(water, fertilizer, weedChance, TREE_WATER_MAX, TREE_WATER_MID, TREE_FERT_MAX)
}
