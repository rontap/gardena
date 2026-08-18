import { fill } from '../defs/catalog.ts'
import { BOX_LARGE, BOX_SMALL, CHEST_SLOTS, CONTAINERS, GRIND_MAX, GRIND_MIN, GRIND_WORK, PICKAXES, SHOVELS } from '../defs/items.ts'
import { BERRY_SALE, RARITY_SALE, type Rarity } from '../defs/rarity.ts'
import type { ContainerId, CropId, PickaxeId, ShovelId, SkuId } from './ids.ts'
import { statsOf, type Modifier } from './modifiers.ts'

export type Stack = { crop: CropId; rarity: Rarity; count: number }

export type Item =
  | { kind: 'shovel'; id: ShovelId; usesLeft: number; workSeconds: number }
  | { kind: 'pickaxe'; id: PickaxeId; usesLeft: number; workSeconds: number }
  | { kind: 'container'; id: ContainerId; liters: number; capacityLiters: number }
  | {
      kind: 'box'
      cap: 5 | 14
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

export function boxName(cap: 5 | 14): string {
  return cap === 5 ? 'Fruit box' : 'Large fruit box'
}

export function fruitMoney(crop: CropId, rarity: Rarity, n: number, mods: readonly Modifier[]): number {
  return statsOf(crop, rarity, mods).sale * n
}

export function berryMoney(rarity: Rarity, n: number): number {
  return BERRY_SALE * RARITY_SALE[rarity] * n
}

export function grindN(hand: Hand): number {
  if (hand.kind !== 'hold') return 0
  if (hand.item.kind === 'fruit' && hand.item.count >= 1) return 1
  if (
    hand.item.kind === 'box' &&
    hand.item.cargo.kind === 'stack' &&
    hand.item.cargo.goods === 'fruit' &&
    hand.item.cargo.stack.count >= 1
  ) {
    return hand.item.cargo.stack.count
  }
  return 0
}

export function toolName(hand: Hand): string {
  if (hand.kind === 'empty') return 'hand'
  const it = hand.item
  if (it.kind === 'shovel') return it.id === 'shovel' ? 'Shovel' : 'Better shovel'
  if (it.kind === 'pickaxe') return it.id === 'pickaxe' ? 'Pickaxe' : 'Hardened pickaxe'
  if (it.kind === 'container') return it.id === 'bucket' ? 'Bucket' : 'Large bucket'
  if (it.kind === 'box') return boxName(it.cap)
  if (it.kind === 'seeds') return `${cropName(it.crop)} seed`
  if (it.kind === 'fruit') return cropName(it.crop)
  if (it.kind === 'berry') return 'Berry'
  return 'Shrub'
}

export function itemLine(item: Item, mods: readonly Modifier[]): string {
  if (item.kind === 'shovel') {
    const name = item.id === 'shovel' ? 'Shovel' : 'Better shovel'
    return `${name} - ${item.usesLeft}/${SHOVELS[item.id].uses} uses left`
  }
  if (item.kind === 'pickaxe') {
    const name = item.id === 'pickaxe' ? 'Pickaxe' : 'Hardened pickaxe'
    return `${name} - ${item.usesLeft}/${PICKAXES[item.id].uses} uses left`
  }
  if (item.kind === 'container') {
    const name = item.id === 'bucket' ? 'Bucket' : 'Large bucket'
    return `${name} - ${item.liters}/${item.capacityLiters}L`
  }
  if (item.kind === 'box') {
    const name = boxName(item.cap)
    if (item.cargo.kind === 'empty') return `${name} - empty`
    if (item.cargo.kind === 'berry') return `${name} - Berry ${item.cargo.count}/${item.cap}`
    const n = cropName(item.cargo.stack.crop)
    if (item.cargo.goods === 'seeds') return `${name} - ${n} seed ${item.cargo.stack.count}/${item.cap}`
    return `${name} - ${n} ${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'seeds') return `${cropName(item.crop)} seed - ${item.count}, plant it`
  if (item.kind === 'fruit')
    return `${cropName(item.crop)} - ${item.count}, sell for $${fruitMoney(item.crop, item.rarity, item.count, mods)}`
  if (item.kind === 'berry') return `Berry - ${item.count}, sell for $${berryMoney(item.rarity, item.count)}`
  return 'Shrub - plant it'
}

export function heldText(hand: Hand, mods: readonly Modifier[]): string {
  if (hand.kind === 'empty') return 'Nothing in hand'
  return itemLine(hand.item, mods)
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
      return 'Hardened pickaxe'
    case 'buy-bucket':
      return 'Bucket'
    case 'buy-bucket-large':
      return 'Large bucket'
    case 'buy-box':
      return 'Fruit box'
    case 'buy-box-large':
      return 'Large fruit box'
    case 'buy-pumpjack':
      return 'Pumpjack'
    case 'buy-chest':
      return 'Chest'
    case 'buy-grinder':
      return 'Seed grinder'
  }
}

export function skuDesc(id: SkuId): string {
  switch (id) {
    case 'pack-carrot':
      return fill('Pack of ${count} ${name} seeds.', { count: 5, name: cropName('carrot') })
    case 'pack-potato':
      return fill('Pack of ${count} ${name} seeds.', { count: 5, name: cropName('potato') })
    case 'pack-wheat':
      return fill('Pack of ${count} ${name} seeds.', { count: 5, name: cropName('wheat') })
    case 'pack-tomato':
      return fill('Pack of ${count} ${name} seeds.', { count: 5, name: cropName('tomato') })
    case 'pack-raspberry':
      return fill('Pack of ${count} ${name} seeds.', { count: 5, name: cropName('raspberry') })
    case 'buy-shovel':
      return fill('${uses} uses, ${workSeconds}s dig.', SHOVELS.shovel)
    case 'buy-better-shovel':
      return fill('${uses} uses, ${workSeconds}s dig.', SHOVELS['better-shovel'])
    case 'buy-pickaxe':
      return fill('${uses} uses, ${workSeconds}s mine.', PICKAXES.pickaxe)
    case 'buy-better-pickaxe':
      return fill('${uses} uses, ${workSeconds}s mine.', PICKAXES['better-pickaxe'])
    case 'buy-bucket':
      return fill('${capacityLiters} L.', CONTAINERS.bucket)
    case 'buy-bucket-large':
      return fill('${capacityLiters} L.', CONTAINERS['large-bucket'])
    case 'buy-box':
      return fill('Carry ${cap}.', { cap: BOX_SMALL })
    case 'buy-box-large':
      return fill('Carry ${cap}.', { cap: BOX_LARGE })
    case 'buy-pumpjack':
      return fill('Place a ${output} L/s pump.', { output: 2 })
    case 'buy-chest':
      return fill('Chest. ${slots} slots. Walk up and store any item.', { slots: CHEST_SLOTS })
    case 'buy-grinder':
      return fill(
        'Seed grinder. One fruit becomes ${min}–${max} seeds of the same crop and rarity. ${workSeconds}s per fruit.',
        { min: GRIND_MIN, max: GRIND_MAX, workSeconds: GRIND_WORK },
      )
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

export function makeBox(cap: 5 | 14): Item {
  return { kind: 'box', cap, cargo: { kind: 'empty' } }
}

export function skuItem(id: SkuId): Item | { kind: 'pumpjack' } | { kind: 'chest' } | { kind: 'grinder' } {
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
    case 'buy-bucket':
      return makeContainer('bucket', CONTAINERS.bucket.capacityLiters)
    case 'buy-bucket-large':
      return makeContainer('large-bucket', CONTAINERS['large-bucket'].capacityLiters)
    case 'buy-box':
      return makeBox(BOX_SMALL)
    case 'buy-box-large':
      return makeBox(BOX_LARGE)
    case 'buy-pumpjack':
      return { kind: 'pumpjack' }
    case 'buy-chest':
      return { kind: 'chest' }
    case 'buy-grinder':
      return { kind: 'grinder' }
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
