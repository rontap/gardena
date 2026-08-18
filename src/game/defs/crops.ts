import type { CropId } from '../sim/ids.ts'

export type CropDef = {
  id: CropId
  growSeconds: number
  waterUsePerSec: number
  sale: number
  seed: number
}

export const CROPS: { readonly [K in CropId]: CropDef } = {
  carrot: { id: 'carrot', growSeconds: 45, waterUsePerSec: 0.008333, sale: 4, seed: 2 },
  potato: { id: 'potato', growSeconds: 60, waterUsePerSec: 0.007333, sale: 7, seed: 3 },
  wheat: { id: 'wheat', growSeconds: 75, waterUsePerSec: 0.006, sale: 10, seed: 5 },
  tomato: { id: 'tomato', growSeconds: 90, waterUsePerSec: 0.009333, sale: 14, seed: 7 },
  raspberry: { id: 'raspberry', growSeconds: 120, waterUsePerSec: 0.01, sale: 20, seed: 10 },
}

export const WITHER = 0.33
export const CRITICAL = 0.1
export const HEALTH = 0.5
export const PLANT_THIRST = 0.75
