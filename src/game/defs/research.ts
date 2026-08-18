import type { CropId, ResearchId, SkuId } from '../sim/ids.ts'

export type ResearchDef = {
  id: ResearchId
  name: string
  tree: 'plants' | 'utilities' | 'expansion' | 'automation'
  cost: number
  seconds: number
  effect:
    | { kind: 'unlock-sku'; sku: SkuId }
    | { kind: 'sale-mul'; crop: CropId; saleMul: number }
    | { kind: 'pumpjack' }
    | { kind: 'expand' }
}

export const RESEARCH: { readonly [K in ResearchId]: ResearchDef } = {
  'unlock-tomato': {
    id: 'unlock-tomato',
    name: 'Tomato seeds',
    tree: 'plants',
    cost: 7,
    seconds: 30,
    effect: { kind: 'unlock-sku', sku: 'pack-tomato' },
  },
  'unlock-raspberry': {
    id: 'unlock-raspberry',
    name: 'Raspberry seeds',
    tree: 'plants',
    cost: 12,
    seconds: 45,
    effect: { kind: 'unlock-sku', sku: 'pack-raspberry' },
  },
  'bump-carrot': {
    id: 'bump-carrot',
    name: 'Better carrots',
    tree: 'plants',
    cost: 10,
    seconds: 40,
    effect: { kind: 'sale-mul', crop: 'carrot', saleMul: 1.1 },
  },
  'bump-potato': {
    id: 'bump-potato',
    name: 'Better potatoes',
    tree: 'plants',
    cost: 10,
    seconds: 40,
    effect: { kind: 'sale-mul', crop: 'potato', saleMul: 1.1 },
  },
  'bump-wheat': {
    id: 'bump-wheat',
    name: 'Better wheat',
    tree: 'plants',
    cost: 12,
    seconds: 45,
    effect: { kind: 'sale-mul', crop: 'wheat', saleMul: 1.1 },
  },
  'unlock-better-tools': {
    id: 'unlock-better-tools',
    name: 'Better gardening tools',
    tree: 'utilities',
    cost: 16,
    seconds: 45,
    effect: { kind: 'unlock-sku', sku: 'buy-better-shovel' },
  },
  'unlock-large-box': {
    id: 'unlock-large-box',
    name: 'Large fruit box',
    tree: 'utilities',
    cost: 17,
    seconds: 50,
    effect: { kind: 'unlock-sku', sku: 'buy-box-large' },
  },
  'unlock-pumpjack': {
    id: 'unlock-pumpjack',
    name: 'Pumpjack',
    tree: 'utilities',
    cost: 20,
    seconds: 60,
    effect: { kind: 'pumpjack' },
  },
  'unlock-chest': {
    id: 'unlock-chest',
    name: 'Chest',
    tree: 'utilities',
    cost: 12,
    seconds: 40,
    effect: { kind: 'unlock-sku', sku: 'buy-chest' },
  },
  'unlock-expand': {
    id: 'unlock-expand',
    name: 'Unlock land',
    tree: 'expansion',
    cost: 15,
    seconds: 45,
    effect: { kind: 'expand' },
  },
  'unlock-pickaxe': {
    id: 'unlock-pickaxe',
    name: 'Pickaxes',
    tree: 'utilities',
    cost: 0,
    seconds: 40,
    effect: { kind: 'unlock-sku', sku: 'buy-pickaxe' },
  },
  'unlock-grinder': {
    id: 'unlock-grinder',
    name: 'Seed grinder',
    tree: 'automation',
    cost: 18,
    seconds: 50,
    effect: { kind: 'unlock-sku', sku: 'buy-grinder' },
  },
}

export type Sku = {
  id: SkuId
  price: number
  unlock: 'start' | ResearchId
  show: 'start' | ResearchId
}

export const SKUS: { readonly [K in SkuId]: Sku } = {
  'pack-carrot': { id: 'pack-carrot', price: 3, unlock: 'start', show: 'start' },
  'pack-potato': { id: 'pack-potato', price: 6, unlock: 'start', show: 'start' },
  'pack-wheat': { id: 'pack-wheat', price: 8, unlock: 'start', show: 'start' },
  'pack-tomato': { id: 'pack-tomato', price: 12, unlock: 'unlock-tomato', show: 'start' },
  'pack-raspberry': { id: 'pack-raspberry', price: 16, unlock: 'unlock-raspberry', show: 'start' },
  'buy-shovel': { id: 'buy-shovel', price: 10, unlock: 'start', show: 'start' },
  'buy-better-shovel': { id: 'buy-better-shovel', price: 30, unlock: 'unlock-better-tools', show: 'start' },
  'buy-pickaxe': { id: 'buy-pickaxe', price: 18, unlock: 'unlock-pickaxe', show: 'start' },
  'buy-better-pickaxe': {
    id: 'buy-better-pickaxe',
    price: 24,
    unlock: 'unlock-pickaxe',
    show: 'unlock-pickaxe',
  },
  'buy-bucket': { id: 'buy-bucket', price: 8, unlock: 'start', show: 'start' },
  'buy-bucket-large': { id: 'buy-bucket-large', price: 22, unlock: 'unlock-better-tools', show: 'start' },
  'buy-box': { id: 'buy-box', price: 6, unlock: 'start', show: 'start' },
  'buy-box-large': { id: 'buy-box-large', price: 18, unlock: 'unlock-large-box', show: 'start' },
  'buy-pumpjack': { id: 'buy-pumpjack', price: 50, unlock: 'unlock-pumpjack', show: 'start' },
  'buy-chest': { id: 'buy-chest', price: 18, unlock: 'unlock-chest', show: 'start' },
  'buy-grinder': { id: 'buy-grinder', price: 30, unlock: 'unlock-grinder', show: 'start' },
}
