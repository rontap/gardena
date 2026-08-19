import type { Rarity } from './rarity.ts'
import type { CropId } from '../sim/ids.ts'

export type CropDef = {
  id: CropId
  growSeconds: number
  waterUsePerSec: number
  sale: number
  seed: number
  rotSeconds: number
}

export const CROPS: { readonly [K in CropId]: CropDef } = {
  carrot: { id: 'carrot', growSeconds: 103.5, waterUsePerSec: 0.004889, sale: 4, seed: 1, rotSeconds: 480 },
  potato: { id: 'potato', growSeconds: 184, waterUsePerSec: 0.00375, sale: 8, seed: 2, rotSeconds: 480 },
  wheat: { id: 'wheat', growSeconds: 276, waterUsePerSec: 0.003333, sale: 14, seed: 2, rotSeconds: 480 },
  tomato: { id: 'tomato', growSeconds: 345, waterUsePerSec: 0.003111, sale: 18, seed: 3, rotSeconds: 300 },
  raspberry: { id: 'raspberry', growSeconds: 414, waterUsePerSec: 0.003333, sale: 24, seed: 4, rotSeconds: 158.4 },
  watermelon: { id: 'watermelon', growSeconds: 345, waterUsePerSec: 0.013333, sale: 19, seed: 4, rotSeconds: 360 },
  apple: { id: 'apple', growSeconds: 720, waterUsePerSec: 0, sale: 20, seed: 4, rotSeconds: 480 },
}

const VARIETY: { readonly [K in CropId]: { readonly [R in Rarity]: string } } = {
  carrot: { common: 'Carrot', uncommon: 'Carrot', rare: 'Atomic Red', heirloom: 'Cosmic Purple' },
  potato: { common: 'Potato', uncommon: 'Potato', rare: 'Adirondack Blue', heirloom: 'Russian Banana' },
  wheat: { common: 'Wheat', uncommon: 'Wheat', rare: 'Black emmer', heirloom: 'Red Fife' },
  tomato: { common: 'Tomato', uncommon: 'Tomato', rare: 'Cherokee Purple', heirloom: 'Green Zebra' },
  raspberry: { common: 'Raspberry', uncommon: 'Raspberry', rare: 'Golden raspberry', heirloom: 'Black raspberry' },
  watermelon: { common: 'Watermelon', uncommon: 'Watermelon', rare: 'Yellow Crimson', heirloom: 'Moon and Stars' },
  apple: { common: 'Apple', uncommon: 'Apple', rare: 'Apple', heirloom: 'Pink Lady' },
}

export function cropVariety(id: CropId, rarity: Rarity): string {
  return VARIETY[id][rarity]
}

export function freshMul(f: number): number {
  return f >= 0.8 ? 1 : f / 0.8
}

export const WITHER = 0.33
export const CRITICAL = 0.1
export const HEALTH = 0.5
export const PLANT_THIRST = 0.75
