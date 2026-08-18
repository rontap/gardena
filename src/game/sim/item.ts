import { BOX_LARGE, BOX_SMALL, CONTAINERS, PICKAXES, SHOVELS } from '../defs/items.ts'
import type { Rarity } from '../defs/rarity.ts'
import type { ContainerId, CropId, PickaxeId, ShovelId, SkuId } from './ids.ts'

export type Stack = { crop: CropId; rarity: Rarity; count: number }

export type Item =
  | { kind: 'shovel'; id: ShovelId; usesLeft: number; workSeconds: number }
  | { kind: 'pickaxe'; id: PickaxeId; usesLeft: number; workSeconds: number }
  | { kind: 'container'; id: ContainerId; liters: number; capacityLiters: number }
  | {
      kind: 'box'
      cap: 5 | 15
      cargo:
        | { kind: 'empty' }
        | { kind: 'stack'; goods: 'fruit' | 'seeds'; stack: Stack }
        | { kind: 'berry'; rarity: Rarity; count: number }
    }
  | { kind: 'seeds'; crop: CropId; rarity: Rarity; count: number }
  | { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number }
  | { kind: 'berry'; rarity: Rarity; count: number }
  | { kind: 'shrub' }

export type Hand = { kind: 'empty' } | { kind: 'hold'; item: Item }
export type Slot = { kind: 'empty' } | { kind: 'hold'; item: Item }

export function cropName(id: CropId): string {
  return id.slice(0, 1).toUpperCase() + id.slice(1)
}

export function itemLine(item: Item): string {
  if (item.kind === 'shovel') {
    const name = item.id === 'shovel' ? 'Shovel' : 'Better shovel'
    return `${name} - ${item.usesLeft}/${SHOVELS[item.id].uses} uses left`
  }
  if (item.kind === 'pickaxe') {
    const name = item.id === 'pickaxe' ? 'Pickaxe' : 'Better pickaxe'
    return `${name} - ${item.usesLeft}/${PICKAXES[item.id].uses} uses left`
  }
  if (item.kind === 'container') {
    const name = item.id === 'bucket' ? 'Bucket' : 'Large bucket'
    return `${name} - ${item.liters}/${item.capacityLiters}L`
  }
  if (item.kind === 'box') {
    if (item.cargo.kind === 'empty') return 'Box - empty'
    if (item.cargo.kind === 'berry') return `Box - Berry ${item.cargo.count}/${item.cap}`
    const n = cropName(item.cargo.stack.crop)
    if (item.cargo.goods === 'seeds') return `Box - ${n} seed ${item.cargo.stack.count}/${item.cap}`
    return `Box - ${n} ${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'seeds') return `${cropName(item.crop)} seed - ${item.count}, plant it`
  if (item.kind === 'fruit') return `${cropName(item.crop)} - ${item.count}, sell it`
  if (item.kind === 'berry') return `Berry - ${item.count}, sell it`
  return 'Shrub - plant it'
}

export function heldText(hand: Hand): string {
  if (hand.kind === 'empty') return 'Nothing in hand'
  return itemLine(hand.item)
}

export function skuLabel(id: SkuId): string {
  switch (id) {
    case 'pack-carrot':
      return 'Carrot seeds'
    case 'pack-potato':
      return 'Potato seeds'
    case 'pack-wheat':
      return 'Wheat seeds'
    case 'pack-tomato':
      return 'Tomato seeds'
    case 'pack-raspberry':
      return 'Raspberry seeds'
    case 'buy-shovel':
      return 'Shovel'
    case 'buy-better-shovel':
      return 'Better shovel'
    case 'buy-pickaxe':
      return 'Pickaxe'
    case 'buy-better-pickaxe':
      return 'Better pickaxe'
    case 'buy-bucket-large':
      return 'Large bucket'
    case 'buy-box':
      return 'Box'
    case 'buy-box-large':
      return 'Large box'
    case 'buy-pumpjack':
      return 'Pumpjack'
  }
}

export function skuDesc(id: SkuId): string {
  switch (id) {
    case 'pack-carrot':
      return 'Pack of 5 Carrot seeds.'
    case 'pack-potato':
      return 'Pack of 5 Potato seeds.'
    case 'pack-wheat':
      return 'Pack of 5 Wheat seeds.'
    case 'pack-tomato':
      return 'Pack of 5 Tomato seeds.'
    case 'pack-raspberry':
      return 'Pack of 5 Raspberry seeds.'
    case 'buy-shovel':
      return '100 uses, 1s dig.'
    case 'buy-better-shovel':
      return '250 uses, 0.5s dig.'
    case 'buy-pickaxe':
      return '40 uses, 4s mine.'
    case 'buy-better-pickaxe':
      return '80 uses, 2s mine.'
    case 'buy-bucket-large':
      return '8 L.'
    case 'buy-box':
      return 'Carry 5.'
    case 'buy-box-large':
      return 'Carry 15.'
    case 'buy-pumpjack':
      return 'Place a 2 L/s pump.'
  }
}

export function itemTip(item: Item): string {
  if (item.kind === 'shovel') return `${item.id} ${item.usesLeft}`
  if (item.kind === 'pickaxe') return `${item.id} ${item.usesLeft}`
  if (item.kind === 'container') return `${item.id} ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'box') {
    if (item.cargo.kind === 'empty') return `box ${item.cap}`
    if (item.cargo.kind === 'berry') return `box berry ${item.cargo.count}/${item.cap}`
    return `box ${item.cargo.goods} ${item.cargo.stack.crop} ${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'seeds') return `seeds ${item.crop} ${item.count}`
  if (item.kind === 'fruit') return `fruit ${item.crop} ${item.count}`
  if (item.kind === 'berry') return `berry ${item.count}`
  return 'shrub'
}

export function makeShovel(id: ShovelId): Item {
  const d = SHOVELS[id]
  return { kind: 'shovel', id, usesLeft: d.uses, workSeconds: d.workSeconds }
}

export function makePickaxe(id: PickaxeId): Item {
  const d = PICKAXES[id]
  return { kind: 'pickaxe', id, usesLeft: d.uses, workSeconds: d.workSeconds }
}

export function makeContainer(id: ContainerId, liters: number): Item {
  return { kind: 'container', id, liters, capacityLiters: CONTAINERS[id].capacityLiters }
}

export function makeBox(cap: 5 | 15): Item {
  return { kind: 'box', cap, cargo: { kind: 'empty' } }
}

export function skuItem(id: SkuId): Item | { kind: 'pumpjack' } {
  switch (id) {
    case 'pack-carrot':
      return { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 5 }
    case 'pack-potato':
      return { kind: 'seeds', crop: 'potato', rarity: 'common', count: 5 }
    case 'pack-wheat':
      return { kind: 'seeds', crop: 'wheat', rarity: 'common', count: 5 }
    case 'pack-tomato':
      return { kind: 'seeds', crop: 'tomato', rarity: 'common', count: 5 }
    case 'pack-raspberry':
      return { kind: 'seeds', crop: 'raspberry', rarity: 'common', count: 5 }
    case 'buy-shovel':
      return makeShovel('shovel')
    case 'buy-better-shovel':
      return makeShovel('better-shovel')
    case 'buy-pickaxe':
      return makePickaxe('pickaxe')
    case 'buy-better-pickaxe':
      return makePickaxe('better-pickaxe')
    case 'buy-bucket-large':
      return makeContainer('large-bucket', CONTAINERS['large-bucket'].capacityLiters)
    case 'buy-box':
      return makeBox(BOX_SMALL)
    case 'buy-box-large':
      return makeBox(BOX_LARGE)
    case 'buy-pumpjack':
      return { kind: 'pumpjack' }
  }
}

export function boxAccepts(
  box: Extract<Item, { kind: 'box' }>,
  goods: 'fruit' | 'seeds',
  crop: CropId,
  rarity: Rarity,
  n: number,
): number
export function boxAccepts(
  box: Extract<Item, { kind: 'box' }>,
  goods: 'berry',
  rarity: Rarity,
  n: number,
): number
export function boxAccepts(
  box: Extract<Item, { kind: 'box' }>,
  goods: 'fruit' | 'seeds' | 'berry',
  cropOrRarity: CropId | Rarity,
  rarityOrN: Rarity | number,
  n?: number,
): number {
  if (goods === 'berry') {
    const rarity = cropOrRarity as Rarity
    const count = rarityOrN as number
    if (box.cargo.kind === 'empty') return Math.min(box.cap, count)
    if (box.cargo.kind !== 'berry' || box.cargo.rarity !== rarity) return 0
    return Math.min(count, box.cap - box.cargo.count)
  }
  const crop = cropOrRarity as CropId
  const rarity = rarityOrN as Rarity
  const count = n as number
  if (box.cargo.kind === 'empty') return Math.min(box.cap, count)
  if (box.cargo.kind !== 'stack') return 0
  if (box.cargo.goods !== goods || box.cargo.stack.crop !== crop || box.cargo.stack.rarity !== rarity) {
    return 0
  }
  return Math.min(count, box.cap - box.cargo.stack.count)
}

export function boxAdd(
  box: Extract<Item, { kind: 'box' }>,
  goods: 'fruit' | 'seeds',
  crop: CropId,
  rarity: Rarity,
  n: number,
): number
export function boxAdd(
  box: Extract<Item, { kind: 'box' }>,
  goods: 'berry',
  rarity: Rarity,
  n: number,
): number
export function boxAdd(
  box: Extract<Item, { kind: 'box' }>,
  goods: 'fruit' | 'seeds' | 'berry',
  cropOrRarity: CropId | Rarity,
  rarityOrN: Rarity | number,
  n?: number,
): number {
  if (goods === 'berry') {
    const rarity = cropOrRarity as Rarity
    const count = rarityOrN as number
    const take = boxAccepts(box, 'berry', rarity, count)
    if (take === 0) return 0
    if (box.cargo.kind === 'empty') {
      box.cargo = { kind: 'berry', rarity, count: take }
      return take
    }
    if (box.cargo.kind === 'berry') box.cargo.count += take
    return take
  }
  const crop = cropOrRarity as CropId
  const rarity = rarityOrN as Rarity
  const count = n as number
  const take = boxAccepts(box, goods, crop, rarity, count)
  if (take === 0) return 0
  if (box.cargo.kind === 'empty') {
    box.cargo = { kind: 'stack', goods, stack: { crop, rarity, count: take } }
    return take
  }
  if (box.cargo.kind === 'stack') box.cargo.stack.count += take
  return take
}
