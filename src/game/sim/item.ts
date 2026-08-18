import { BOX_LARGE, BOX_SMALL, CONTAINERS, SHOVELS } from '../defs/items.ts'
import type { Rarity } from '../defs/rarity.ts'
import type { SkuId } from './ids.ts'
import type { ContainerId, CropId, ShovelId } from './ids.ts'

export type Stack = { crop: CropId; rarity: Rarity; count: number }

export type Item =
  | { kind: 'shovel'; id: ShovelId; usesLeft: number; workSeconds: number }
  | { kind: 'container'; id: ContainerId; liters: number; capacityLiters: number }
  | {
      kind: 'box'
      cap: 5 | 15
      cargo: { kind: 'empty' } | { kind: 'stack'; goods: 'fruit' | 'seeds'; stack: Stack }
    }
  | { kind: 'seeds'; crop: CropId; rarity: Rarity; count: number }
  | { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number }

export type Hand = { kind: 'empty' } | { kind: 'hold'; item: Item }
export type Slot = { kind: 'empty' } | { kind: 'hold'; item: Item }

export function itemTip(item: Item): string {
  if (item.kind === 'shovel') return `${item.id} ${item.usesLeft}`
  if (item.kind === 'container') return `${item.id} ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'box') {
    if (item.cargo.kind === 'empty') return `box ${item.cap}`
    return `box ${item.cargo.goods} ${item.cargo.stack.crop} ${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'seeds') return `seeds ${item.crop} ${item.count}`
  return `fruit ${item.crop} ${item.count}`
}

export function makeShovel(id: ShovelId): Item {
  const d = SHOVELS[id]
  return { kind: 'shovel', id, usesLeft: d.uses, workSeconds: d.workSeconds }
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
    case 'buy-bucket-large':
      return makeContainer('large-bucket', CONTAINERS['large-bucket'].capacityLiters)
    case 'buy-can':
      return makeContainer('can', CONTAINERS.can.capacityLiters)
    case 'buy-can-large':
      return makeContainer('large-can', CONTAINERS['large-can'].capacityLiters)
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
): number {
  if (box.cargo.kind === 'empty') return Math.min(box.cap, n)
  const c = box.cargo
  if (c.goods !== goods || c.stack.crop !== crop || c.stack.rarity !== rarity) return 0
  return Math.min(n, box.cap - c.stack.count)
}

export function boxAdd(
  box: Extract<Item, { kind: 'box' }>,
  goods: 'fruit' | 'seeds',
  crop: CropId,
  rarity: Rarity,
  n: number,
): number {
  const take = boxAccepts(box, goods, crop, rarity, n)
  if (take === 0) return 0
  if (box.cargo.kind === 'empty') {
    box.cargo = { kind: 'stack', goods, stack: { crop, rarity, count: take } }
    return take
  }
  box.cargo.stack.count += take
  return take
}
