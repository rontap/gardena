import type { CropId, ResearchId, SkuId } from '../sim/ids.ts'

export type ResearchDef = {
  id: ResearchId
  tree: 'plants' | 'utilities'
  cost: number
  seconds: number
  effect:
    | { kind: 'unlock-sku'; sku: SkuId }
    | { kind: 'sale-mul'; crop: CropId; saleMul: number }
    | { kind: 'pumpjack' }
}

export const RESEARCH: { readonly [K in ResearchId]: ResearchDef } = {
  'unlock-tomato': {
    id: 'unlock-tomato',
    tree: 'plants',
    cost: 7,
    seconds: 30,
    effect: { kind: 'unlock-sku', sku: 'pack-tomato' },
  },
  'unlock-raspberry': {
    id: 'unlock-raspberry',
    tree: 'plants',
    cost: 12,
    seconds: 45,
    effect: { kind: 'unlock-sku', sku: 'pack-raspberry' },
  },
  'bump-carrot': {
    id: 'bump-carrot',
    tree: 'plants',
    cost: 10,
    seconds: 40,
    effect: { kind: 'sale-mul', crop: 'carrot', saleMul: 1.1 },
  },
  'bump-potato': {
    id: 'bump-potato',
    tree: 'plants',
    cost: 10,
    seconds: 40,
    effect: { kind: 'sale-mul', crop: 'potato', saleMul: 1.1 },
  },
  'bump-wheat': {
    id: 'bump-wheat',
    tree: 'plants',
    cost: 12,
    seconds: 45,
    effect: { kind: 'sale-mul', crop: 'wheat', saleMul: 1.1 },
  },
  'unlock-large-bucket': {
    id: 'unlock-large-bucket',
    tree: 'utilities',
    cost: 10,
    seconds: 40,
    effect: { kind: 'unlock-sku', sku: 'buy-bucket-large' },
  },
  'unlock-box': {
    id: 'unlock-box',
    tree: 'utilities',
    cost: 10,
    seconds: 35,
    effect: { kind: 'unlock-sku', sku: 'buy-box' },
  },
  'unlock-large-box': {
    id: 'unlock-large-box',
    tree: 'utilities',
    cost: 17,
    seconds: 50,
    effect: { kind: 'unlock-sku', sku: 'buy-box-large' },
  },
  'unlock-better-shovel': {
    id: 'unlock-better-shovel',
    tree: 'utilities',
    cost: 12,
    seconds: 40,
    effect: { kind: 'unlock-sku', sku: 'buy-better-shovel' },
  },
  'unlock-pumpjack': {
    id: 'unlock-pumpjack',
    tree: 'utilities',
    cost: 20,
    seconds: 60,
    effect: { kind: 'pumpjack' },
  },
}

export type Sku = { id: SkuId; price: number; unlock: 'start' | ResearchId }

export const SKUS: { readonly [K in SkuId]: Sku } = {
  'pack-carrot': { id: 'pack-carrot', price: 4, unlock: 'start' },
  'pack-potato': { id: 'pack-potato', price: 6, unlock: 'start' },
  'pack-wheat': { id: 'pack-wheat', price: 8, unlock: 'start' },
  'pack-tomato': { id: 'pack-tomato', price: 12, unlock: 'unlock-tomato' },
  'pack-raspberry': { id: 'pack-raspberry', price: 16, unlock: 'unlock-raspberry' },
  'buy-shovel': { id: 'buy-shovel', price: 10, unlock: 'start' },
  'buy-better-shovel': { id: 'buy-better-shovel', price: 35, unlock: 'unlock-better-shovel' },
  'buy-bucket-large': { id: 'buy-bucket-large', price: 18, unlock: 'unlock-large-bucket' },
  'buy-box': { id: 'buy-box', price: 2, unlock: 'unlock-box' },
  'buy-box-large': { id: 'buy-box-large', price: 4, unlock: 'unlock-large-box' },
  'buy-pumpjack': { id: 'buy-pumpjack', price: 50, unlock: 'unlock-pumpjack' },
}
