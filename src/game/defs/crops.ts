import { TOL_MIN, TOL_RARITY, type Rarity } from './rarity.ts'
import type { CropId } from '../sim/ids.ts'

export type CropClass = 'root' | 'grain' | 'fruit'

export type CropDef = {
  id: CropId
  cls: CropClass
  desc: string
  growSeconds: number
  waterUsePerSec: number
  waterTolerance: number
  fertTolerance: number
  sale: number
  seed: number
  rotSeconds: number
}

export const CROPS: { readonly [K in CropId]: CropDef } = {
  carrot: {
    id: 'carrot',
    cls: 'root',
    desc: 'Quick and forgiving. Shrugs off poor soil and thin feeding, but the roots fetch almost nothing.',
    growSeconds: 90,
    waterUsePerSec: 0.004889,
    waterTolerance: 0.9,
    fertTolerance: 0.9,
    sale: 3,
    seed: 1,
    rotSeconds: 420,
  },
  potato: {
    id: 'potato',
    cls: 'root',
    desc: 'Thrifty tuber. Drinks less than any other crop and keeps in store the longest.',
    growSeconds: 120,
    waterUsePerSec: 0.00375,
    waterTolerance: 0.85,
    fertTolerance: 0.85,
    sale: 6,
    seed: 2,
    rotSeconds: 600,
  },
  wheat: {
    id: 'wheat',
    cls: 'grain',
    desc: 'Slow grain, wants steady water and rich soil. Cut dry, so it holds its condition.',
    growSeconds: 180,
    waterUsePerSec: 0.0045833,
    waterTolerance: 0.75,
    fertTolerance: 0.7,
    sale: 12,
    seed: 2,
    rotSeconds: 420,
  },
  tomato: {
    id: 'tomato',
    cls: 'fruit',
    desc: 'Late to ripen and particular about water and feed. Bruises fast once picked.',
    growSeconds: 280,
    waterUsePerSec: 0.0043611,
    waterTolerance: 0.65,
    fertTolerance: 0.6,
    sale: 20,
    seed: 3,
    rotSeconds: 300,
  },
  raspberry: {
    id: 'raspberry',
    cls: 'fruit',
    desc: 'The richest crop and the most delicate. Slow to fruit, first to spoil.',
    growSeconds: 340,
    waterUsePerSec: 0.0045833,
    waterTolerance: 0.6,
    fertTolerance: 0.55,
    sale: 26,
    seed: 4,
    rotSeconds: 160,
  },
  watermelon: {
    id: 'watermelon',
    cls: 'fruit',
    desc: 'Swells quickly for its size and drinks more than anything else. A dry plot kills it.',
    growSeconds: 260,
    waterUsePerSec: 0.01125,
    waterTolerance: 0.5,
    fertTolerance: 0.6,
    sale: 20,
    seed: 4,
    rotSeconds: 360,
  },
  apple: {
    id: 'apple',
    cls: 'fruit',
    desc: 'The tree feeds itself - no water, no fertilizer. Slow to set fruit, then keeps for days.',
    growSeconds: 600,
    waterUsePerSec: 0,
    waterTolerance: 0.9,
    fertTolerance: 0.9,
    sale: 20,
    seed: 4,
    rotSeconds: 480,
  },
}

export const CLASS_NAME: { readonly [K in CropClass]: string } = {
  root: 'root',
  grain: 'grain',
  fruit: 'fruit',
}

export function tolerance(base: number, rarity: Rarity): number {
  const t = base * TOL_RARITY[rarity]
  return t < TOL_MIN ? TOL_MIN : t
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
