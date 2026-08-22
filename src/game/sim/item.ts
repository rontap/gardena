import { fill } from '../defs/catalog.ts'
import {
  BOX_LARGE,
  BOX_SMALL,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_SECONDS,
  COMPOST_VALUE,
  CONTAINERS,
  FERT_BAG_LITERS,
  GRIND_MAX,
  GRIND_MIN,
  GRIND_WORK,
  PICKAXES,
  SHOVELS,
  SPRINKLER_TILE_DAY,
  SYNTH_BAG_LITERS,
} from '../defs/items.ts'
import { BERRY_SALE, RARITY_SALE, type Rarity } from '../defs/rarity.ts'
import { CLASS_NAME, cropVariety, freshMul, type CropClass } from '../defs/crops.ts'
import { SOURCE, TAP_RATE } from './water.ts'
import type { ContainerId, CropId, PickaxeId, ShovelId, SkuId, TileId } from './ids.ts'
import type { Modifier } from './modifiers.ts'

export type Stack = { crop: CropId; rarity: Rarity; count: number }
export type FruitStack = {
  crop: CropId
  rarity: Rarity
  count: number
  unitSale: number
  freshness: number
  bio: boolean
}

export type Item =
  | { kind: 'shovel'; id: ShovelId; usesLeft: number; workSeconds: number }
  | { kind: 'pickaxe'; id: PickaxeId; usesLeft: number; workSeconds: number }
  | { kind: 'container'; id: ContainerId; liters: number; capacityLiters: number }
  | { kind: 'fertilizer'; liters: number; capacityLiters: number }
  | { kind: 'synth'; liters: number; capacityLiters: number }
  | { kind: 'compost'; liters: number; capacityLiters: number }
  | {
      kind: 'box'
      cap: 5 | 14
      cargo:
        | { kind: 'empty' }
        | { kind: 'stack'; goods: 'seeds'; stack: Stack }
        | { kind: 'stack'; goods: 'fruit'; stack: FruitStack }
        | { kind: 'berry'; rarity: Rarity; count: number }
    }
  | { kind: 'seeds'; crop: CropId; rarity: Rarity; count: number }
  | { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number; unitSale: number; freshness: number; bio: boolean }
  | { kind: 'berry'; rarity: Rarity; count: number }
  | { kind: 'rotten'; cls: CropClass; count: number }
  | { kind: 'dead'; cls: CropClass; count: number }
  | { kind: 'weed'; count: number }
  | { kind: 'grass'; count: number }
  | { kind: 'shrub' }
  | { kind: 'apple-tree' }

export type Hand = { kind: 'empty' } | { kind: 'hold'; item: Item }
export type Slot = { kind: 'empty' } | { kind: 'hold'; item: Item }

export type Face =
  | Item
  | { kind: 'pumpjack' }
  | { kind: 'chest' }
  | { kind: 'grinder' }
  | { kind: 'compost-box' }
  | { kind: 'well' }
  | { kind: 'pipe' }
  | { kind: 'sprinkler' }
  | { kind: 'sprinkler-vert' }
  | { kind: 'sprinkler-large' }
  | { kind: 'valve' }
  | { kind: 'rain-tank' }
  | { kind: 'tap' }
  | { kind: 'delete' }
  | { kind: 'tile'; tile: TileId }

export function compostValue(item: Item): number {
  if (item.kind === 'seeds') return COMPOST_VALUE.seeds * item.count
  if (item.kind === 'fruit') {
    return (item.rarity === 'heirloom' ? COMPOST_VALUE.heirloom : COMPOST_VALUE.fruit) * item.count
  }
  if (item.kind === 'berry') {
    return (item.rarity === 'heirloom' ? COMPOST_VALUE.heirloom : COMPOST_VALUE.fruit) * item.count
  }
  if (item.kind === 'rotten') return COMPOST_VALUE.rotten * item.count
  if (item.kind === 'dead') return COMPOST_VALUE.dead * item.count
  if (item.kind === 'weed') return COMPOST_VALUE.weed * item.count
  if (item.kind === 'grass') return COMPOST_VALUE.grass * item.count
  if (item.kind === 'shrub') return COMPOST_VALUE.fruit
  return 0
}

export function organic(item: Item): boolean {
  return compostValue(item) > 0
}

export function cropName(id: CropId): string {
  return id.slice(0, 1).toUpperCase() + id.slice(1)
}

export function boxName(cap: 5 | 14): string {
  return cap === 5 ? 'Fruit box' : 'Large fruit box'
}

export function fruitMoney(it: { unitSale: number; count: number; freshness: number }): number {
  return it.unitSale * it.count * freshMul(it.freshness)
}

export function mergeUnitSale(a: { unitSale: number; count: number }, b: { unitSale: number; count: number }): number {
  return (a.unitSale * a.count + b.unitSale * b.count) / (a.count + b.count)
}

export function mergeFreshness(
  a: { freshness: number; count: number },
  b: { freshness: number; count: number },
): number {
  return (a.freshness * a.count + b.freshness * b.count) / (a.count + b.count)
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
  if (it.kind === 'fertilizer') return 'Fertilizer bag'
  if (it.kind === 'synth') return 'Synthetic fertilizer'
  if (it.kind === 'compost') return 'Compost'
  if (it.kind === 'box') return boxName(it.cap)
  if (it.kind === 'seeds') return `${cropName(it.crop)} seed`
  if (it.kind === 'fruit') return cropVariety(it.crop, it.rarity)
  if (it.kind === 'berry') return 'Berry'
  if (it.kind === 'rotten') return rottenName(it.cls)
  if (it.kind === 'dead') return deadName(it.cls)
  if (it.kind === 'weed') return 'Pulled weed'
  if (it.kind === 'grass') return 'Cut grass'
  if (it.kind === 'apple-tree') return 'Apple tree'
  return 'Shrub'
}

export function rottenName(cls: CropClass): string {
  return `Rotten ${CLASS_NAME[cls]}`
}

export function deadName(cls: CropClass): string {
  return `Dead ${CLASS_NAME[cls]} plant`
}

export function itemLine(item: Item, _mods: readonly Modifier[]): string {
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
  if (item.kind === 'fertilizer') {
    return `Fertilizer bag - ${Number(item.liters.toFixed(2))}/${item.capacityLiters}L`
  }
  if (item.kind === 'synth') {
    return `Synthetic fertilizer - ${Number(item.liters.toFixed(2))}/${item.capacityLiters}L`
  }
  if (item.kind === 'compost') {
    return `Compost - ${Number(item.liters.toFixed(2))}/${item.capacityLiters}L`
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
  if (item.kind === 'fruit') {
    return `${cropVariety(item.crop, item.rarity)} - ${item.count}, freshness ${Math.floor(item.freshness * 100)}%`
  }
  if (item.kind === 'berry') return `Berry - ${item.count}`
  if (item.kind === 'rotten') return `${rottenName(item.cls)} - ${item.count}, compost it`
  if (item.kind === 'dead') return `${deadName(item.cls)} - ${item.count}, compost it`
  if (item.kind === 'weed') return `Pulled weed - ${item.count}, compost it`
  if (item.kind === 'grass') return `Cut grass - ${item.count}, compost it`
  if (item.kind === 'apple-tree') return 'Apple tree'
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
    case 'pack-watermelon':
      return 'Watermelon seeds'
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
    case 'buy-fertilizer':
      return 'Fertilizer bag'
    case 'buy-synth-fertilizer':
      return 'Synthetic fertilizer'
    case 'buy-compost-box':
      return 'Compost box'
    case 'buy-pumpjack':
      return 'Pumpjack'
    case 'buy-chest':
      return 'Chest'
    case 'buy-grinder':
      return 'Seed grinder'
    case 'buy-pipe':
      return 'Pipe'
    case 'buy-sprinkler':
      return 'Sprinkler'
    case 'buy-sprinkler-vert':
      return 'Vertical sprinkler'
    case 'buy-sprinkler-large':
      return 'Large sprinkler'
    case 'buy-well':
      return 'Well'
    case 'buy-valve':
      return 'Manual valve'
    case 'buy-rain-tank':
      return 'Rainwater tank'
    case 'buy-tap':
      return 'Tap'
    case 'buy-tile-paved':
      return 'Paved tile'
    case 'buy-tile-brick':
      return 'Brick tile'
    case 'buy-tile-cobble':
      return 'Cobble tile'
  }
}

export function skuDesc(id: SkuId): string {
  switch (id) {
    case 'pack-carrot':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('carrot') })
    case 'pack-potato':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('potato') })
    case 'pack-wheat':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('wheat') })
    case 'pack-tomato':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('tomato') })
    case 'pack-raspberry':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('raspberry') })
    case 'pack-watermelon':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('watermelon') })
    case 'buy-shovel':
      return fill(
        'Digs grass and hard soil, and uproots plants and shrubs. ${uses} uses, ${workSeconds}s per dig.',
        SHOVELS.shovel,
      )
    case 'buy-better-shovel':
      return fill(
        'Same jobs, faster and longer lasting. ${uses} uses, ${workSeconds}s per dig.',
        SHOVELS['better-shovel'],
      )
    case 'buy-pickaxe':
      return fill('Breaks rocks and very hard soil. ${uses} uses, ${workSeconds}s per mine.', PICKAXES.pickaxe)
    case 'buy-better-pickaxe':
      return fill(
        'Same jobs, faster and longer lasting. ${uses} uses, ${workSeconds}s per mine.',
        PICKAXES['better-pickaxe'],
      )
    case 'buy-bucket':
      return fill('Holds ${n} L. Fill at a pump or well. 1 L fills one plot.', { n: CONTAINERS.bucket.capacityLiters })
    case 'buy-bucket-large':
      return fill('Holds ${n} L. Fill at a pump or well. 1 L fills one plot.', {
        n: CONTAINERS['large-bucket'].capacityLiters,
      })
    case 'buy-box':
      return 'Allows you to gather up to 5 of the same fruits at the same time. Also holds seeds or berries of one kind.'
    case 'buy-box-large':
      return 'Allows you to gather up to 14 of the same fruits at the same time. Also holds seeds or berries of one kind.'
    case 'buy-fertilizer':
      return fill('Holds ${n} L. Tops a plot back up to full fertilizer, spending only what the soil is missing.', {
        n: FERT_BAG_LITERS,
      })
    case 'buy-synth-fertilizer':
      return fill('Holds ${n} L and works the same, but the soil and its produce stop being organic.', {
        n: SYNTH_BAG_LITERS,
      })
    case 'buy-compost-box':
      return fill(
        'Drop organic waste in. ${need} units make ${liters} L of compost in ${seconds}s, left on the ground beside the box.',
        { need: COMPOST_NEED, liters: COMPOST_LITERS, seconds: COMPOST_SECONDS },
      )
    case 'buy-pumpjack':
      return fill(
        'Two tiles. Makes ${rate} L/s into a ${cap} L tank. Fill a bucket here, or touch any corner with pipe to feed the grid.',
        { rate: SOURCE.pump.rate, cap: SOURCE.pump.capacity },
      )
    case 'buy-chest':
      return '9 slots. Walk up and store any item.'
    case 'buy-grinder':
      return fill('One fruit becomes ${min}–${max} seeds of the same crop and rarity. ${workSeconds}s per fruit.', {
        min: GRIND_MIN,
        max: GRIND_MAX,
        workSeconds: GRIND_WORK,
      })
    case 'buy-pipe':
      return 'Pipe. 4 per edge. Hidden unless the Pipes lens or a pipe tool is out.'
    case 'buy-sprinkler':
      return fill('Waters a 2×2 around a corner, ${day} L a day per tile.', { day: SPRINKLER_TILE_DAY })
    case 'buy-sprinkler-vert':
      return fill('Waters a 4×2 strip, ${day} L a day per tile. Rotate while placing to flip NS/EW.', {
        day: SPRINKLER_TILE_DAY,
      })
    case 'buy-sprinkler-large':
      return fill('Waters a 4×4 around a corner, ${day} L a day per tile.', { day: SPRINKLER_TILE_DAY })
    case 'buy-well':
      return fill(
        'One tile. Makes ${rate} L/s into a ${cap} L tank. Fill a bucket here, or touch any corner with pipe to feed the grid.',
        { rate: SOURCE.well.rate, cap: SOURCE.well.capacity },
      )
    case 'buy-valve':
      return 'Sits on an edge like pipe. Click it to send the gardener over and turn the flow off or on.'
    case 'buy-rain-tank':
      return fill('Two tiles. Gathers ${rate} L/s into a ${cap} L tank, no pump needed.', {
        rate: SOURCE['rain-tank'].rate,
        cap: SOURCE['rain-tank'].capacity,
      })
    case 'buy-tap':
      return fill('One tile. Fills a bucket at ${rate} L/s while the grid holds water, slower once tanks run dry.', {
        rate: TAP_RATE,
      })
    case 'buy-tile-paved':
      return 'Place on bare untilled ground. $1 per tile.'
    case 'buy-tile-brick':
      return 'Place on bare untilled ground. $1 per tile.'
    case 'buy-tile-cobble':
      return 'Place on bare untilled ground. $1 per tile.'
  }
}

export function itemTip(item: Item): string {
  if (item.kind === 'shovel') return `${item.id} ${item.usesLeft}`
  if (item.kind === 'pickaxe') return `${item.id} ${item.usesLeft}`
  if (item.kind === 'container') return `${item.id} ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'fertilizer') return `fertilizer ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'synth') return `synth ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'compost') return `compost ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'box') {
    if (item.cargo.kind === 'empty') return `box ${item.cap}`
    if (item.cargo.kind === 'berry') return `box berry ${item.cargo.count}/${item.cap}`
    return `box ${item.cargo.goods} ${item.cargo.stack.crop} ${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'seeds') return `seeds ${item.crop} ${item.count}`
  if (item.kind === 'fruit') return `fruit ${item.crop} ${item.count}`
  if (item.kind === 'berry') return `berry ${item.count}`
  if (item.kind === 'rotten') return `rotten ${item.cls} ${item.count}`
  if (item.kind === 'dead') return `dead ${item.cls} ${item.count}`
  if (item.kind === 'weed') return `weed ${item.count}`
  if (item.kind === 'grass') return `grass ${item.count}`
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

export function makeFertilizer(): Item {
  return { kind: 'fertilizer', liters: FERT_BAG_LITERS, capacityLiters: FERT_BAG_LITERS }
}

export function makeSynth(): Item {
  return { kind: 'synth', liters: SYNTH_BAG_LITERS, capacityLiters: SYNTH_BAG_LITERS }
}

export function makeCompost(): Item {
  return { kind: 'compost', liters: COMPOST_LITERS, capacityLiters: COMPOST_LITERS }
}

export function skuItem(id: SkuId): Face {
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
    case 'pack-watermelon':
      return { kind: 'seeds', crop: 'watermelon', rarity: 'common', count: 5 }
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
    case 'buy-fertilizer':
      return makeFertilizer()
    case 'buy-synth-fertilizer':
      return makeSynth()
    case 'buy-compost-box':
      return { kind: 'compost-box' }
    case 'buy-pumpjack':
      return { kind: 'pumpjack' }
    case 'buy-chest':
      return { kind: 'chest' }
    case 'buy-grinder':
      return { kind: 'grinder' }
    case 'buy-pipe':
      return { kind: 'pipe' }
    case 'buy-sprinkler':
      return { kind: 'sprinkler' }
    case 'buy-sprinkler-vert':
      return { kind: 'sprinkler-vert' }
    case 'buy-sprinkler-large':
      return { kind: 'sprinkler-large' }
    case 'buy-well':
      return { kind: 'well' }
    case 'buy-valve':
      return { kind: 'valve' }
    case 'buy-rain-tank':
      return { kind: 'rain-tank' }
    case 'buy-tap':
      return { kind: 'tap' }
    case 'buy-tile-paved':
      return { kind: 'tile', tile: 'paved' }
    case 'buy-tile-brick':
      return { kind: 'tile', tile: 'brick' }
    case 'buy-tile-cobble':
      return { kind: 'tile', tile: 'cobble' }
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
  goods: 'seeds',
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
  goods: 'seeds' | 'berry',
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
  const take = boxAccepts(box, 'seeds', crop, rarity, count)
  if (take === 0) return 0
  if (box.cargo.kind === 'empty') {
    box.cargo = { kind: 'stack', goods: 'seeds', stack: { crop, rarity, count: take } }
    return take
  }
  if (box.cargo.kind === 'stack' && box.cargo.goods === 'seeds') box.cargo.stack.count += take
  return take
}

export function boxAddFruit(box: Extract<Item, { kind: 'box' }>, f: FruitStack): number {
  const take = boxAccepts(box, 'fruit', f.crop, f.rarity, f.count)
  if (take === 0) return 0
  const part = { ...f, count: take }
  if (box.cargo.kind === 'empty') {
    box.cargo = { kind: 'stack', goods: 'fruit', stack: part }
    return take
  }
  if (box.cargo.kind === 'stack' && box.cargo.goods === 'fruit') {
    const stack = box.cargo.stack
    stack.unitSale = mergeUnitSale(stack, part)
    stack.freshness = mergeFreshness(stack, part)
    stack.bio = stack.bio && part.bio
    stack.count += take
  }
  return take
}

export function fruitStack(
  crop: CropId,
  rarity: Rarity,
  count: number,
  unitSale: number,
  freshness: number,
  bio: boolean,
): FruitStack {
  return { crop, rarity, count, unitSale, freshness, bio }
}
