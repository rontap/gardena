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
  GRASS_PACK,
  GRIND_WORK,
  PICKAXES,
  SHOVELS,
  SPRINKLER_TILE_DAY,
  SYNTH_BAG_LITERS,
} from '../defs/items.ts'
import type { Rarity } from '../defs/rarity.ts'
import { CLASS_NAME, cropVariety, freshMul, type CropClass } from '../defs/crops.ts'
import { TREE_NAME } from '../defs/trees.ts'
import { SOURCE, TAP_RATE } from './water.ts'
import type { AnnualId, ContainerId, CropId, PickaxeId, ShovelId, SkuId, TileId, TreeId } from './ids.ts'
import { isTreeId } from './ids.ts'
import type { Modifier } from './modifiers.ts'

export type Stack = { crop: AnnualId; rarity: Rarity; count: number }
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
    }
  | { kind: 'seeds'; crop: AnnualId; rarity: Rarity; count: number }
  | { kind: 'grass-seeds'; count: number }
  | { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number; unitSale: number; freshness: number; bio: boolean }
  | { kind: 'sapling'; tree: TreeId }
  | { kind: 'sugar'; count: number; unitSale: number }
  | { kind: 'rotten'; cls: CropClass; count: number }
  | { kind: 'dead'; cls: CropClass; count: number }
  | { kind: 'weed'; count: number }
  | { kind: 'grass'; count: number }

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
  | { kind: 'fence' }

export function compostValue(item: Item): number {
  if (item.kind === 'seeds') return COMPOST_VALUE.seeds * item.count
  if (item.kind === 'grass-seeds') return COMPOST_VALUE.seeds * item.count
  if (item.kind === 'fruit') {
    return (item.rarity === 'heirloom' ? COMPOST_VALUE.heirloom : COMPOST_VALUE.fruit) * item.count
  }
  if (item.kind === 'sugar') return COMPOST_VALUE.fruit * item.count
  if (item.kind === 'rotten') return COMPOST_VALUE.rotten * item.count
  if (item.kind === 'dead') return COMPOST_VALUE.dead * item.count
  if (item.kind === 'weed') return COMPOST_VALUE.weed * item.count
  if (item.kind === 'grass') return COMPOST_VALUE.grass * item.count
  return 0
}

export function organic(item: Item): boolean {
  return compostValue(item) > 0
}

export const SHOVEL_NAME: { readonly [K in ShovelId]: string } = {
  shovel: 'Shovel',
  'better-shovel': 'Better shovel',
  'rotary-shovel': 'Rotary shovel',
}

export const PICKAXE_NAME: { readonly [K in PickaxeId]: string } = {
  pickaxe: 'Pickaxe',
  'better-pickaxe': 'Hardened pickaxe',
  'diamond-pickaxe': 'Diamond pickaxe',
}

export function cropName(id: CropId): string {
  if (id === 'sugar-cane') return 'Sugar cane'
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

export function grindN(hand: Hand): number {
  if (hand.kind !== 'hold') return 0
  if (hand.item.kind === 'fruit' && hand.item.count >= 1 && !isTreeId(hand.item.crop) && hand.item.crop !== 'sugar-cane')
    return 1
  if (
    hand.item.kind === 'box' &&
    hand.item.cargo.kind === 'stack' &&
    hand.item.cargo.goods === 'fruit' &&
    hand.item.cargo.stack.count >= 1 &&
    !isTreeId(hand.item.cargo.stack.crop) &&
    hand.item.cargo.stack.crop !== 'sugar-cane'
  ) {
    return hand.item.cargo.stack.count
  }
  return 0
}

export function toolName(hand: Hand): string {
  if (hand.kind === 'empty') return 'hand'
  const it = hand.item
  if (it.kind === 'shovel') return SHOVEL_NAME[it.id]
  if (it.kind === 'pickaxe') return PICKAXE_NAME[it.id]
  if (it.kind === 'container') return it.id === 'bucket' ? 'Bucket' : 'Large bucket'
  if (it.kind === 'fertilizer') return 'Fertilizer bag'
  if (it.kind === 'synth') return 'Synthetic fertilizer'
  if (it.kind === 'compost') return 'Compost'
  if (it.kind === 'box') return boxName(it.cap)
  if (it.kind === 'seeds') return `${cropName(it.crop)} seed`
  if (it.kind === 'grass-seeds') return 'Grass seed'
  if (it.kind === 'fruit') return cropVariety(it.crop, it.rarity)
  if (it.kind === 'sugar') return 'Sugar'
  if (it.kind === 'sapling') return `${TREE_NAME[it.tree]} sapling`
  if (it.kind === 'rotten') return rottenName(it.cls)
  if (it.kind === 'dead') return deadName(it.cls)
  if (it.kind === 'weed') return 'Pulled weed'
  if (it.kind === 'grass') return 'Cut grass'
  return 'Sugar'
}

export function rottenName(cls: CropClass): string {
  return `Rotten ${CLASS_NAME[cls]}`
}

export function deadName(cls: CropClass): string {
  return `Dead ${CLASS_NAME[cls]} plant`
}

export function itemLine(item: Item, _mods: readonly Modifier[]): string {
  if (item.kind === 'shovel') {
    return `${SHOVEL_NAME[item.id]} - ${item.usesLeft}/${SHOVELS[item.id].uses} uses left`
  }
  if (item.kind === 'pickaxe') {
    return `${PICKAXE_NAME[item.id]} - ${item.usesLeft}/${PICKAXES[item.id].uses} uses left`
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
    const n = cropName(item.cargo.stack.crop)
    if (item.cargo.goods === 'seeds') return `${name} - ${n} seed ${item.cargo.stack.count}/${item.cap}`
    return `${name} - ${n} ${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'seeds') return `${cropName(item.crop)} seed - ${item.count}, plant it`
  if (item.kind === 'grass-seeds') return `Grass seed - ${item.count}, plant it on tilled soil`
  if (item.kind === 'fruit') {
    return `${cropVariety(item.crop, item.rarity)} - ${item.count}, freshness ${Math.floor(item.freshness * 100)}%`
  }
  if (item.kind === 'sugar') return `Sugar - ${item.count}`
  if (item.kind === 'sapling') return `${TREE_NAME[item.tree]} sapling - plant on soft ground`
  if (item.kind === 'rotten') return `${rottenName(item.cls)} - ${item.count}, compost it`
  if (item.kind === 'dead') return `${deadName(item.cls)} - ${item.count}, compost it`
  if (item.kind === 'weed') return `Pulled weed - ${item.count}, compost it`
  if (item.kind === 'grass') return `Cut grass - ${item.count}, compost it`
  return 'Sugar'
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
    case 'pack-olive':
      return 'Olive seeds'
    case 'pack-grape':
      return 'Grape seeds'
    case 'pack-vanilla':
      return 'Vanilla seeds'
    case 'pack-sugar-cane':
      return 'Sugar cane seeds'
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
      return 'Paving slab'
    case 'buy-tile-brick':
      return 'Brickwork'
    case 'buy-tile-cobble':
      return 'Cobblestone'
    case 'buy-fence':
      return 'Wooden fence'
    case 'pack-grass':
      return 'Grass seeds'
    case 'buy-rotary-shovel':
      return 'Rotary shovel'
    case 'buy-diamond-pickaxe':
      return 'Diamond pickaxe'
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
    case 'pack-olive':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('olive') })
    case 'pack-grape':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('grape') })
    case 'pack-vanilla':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('vanilla') })
    case 'pack-sugar-cane':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil. Ripe cane bags as sugar.', { name: cropName('sugar-cane') })
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
      return 'Allows you to gather up to 5 of the same fruits at the same time. Also holds seeds of one kind.'
    case 'buy-box-large':
      return 'Allows you to gather up to 14 of the same fruits at the same time. Also holds seeds of one kind.'
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
      return TILE_T
    case 'buy-tile-brick':
      return TILE_T
    case 'buy-tile-cobble':
      return TILE_T
    case 'buy-fence':
      return FENCE_T
    case 'pack-grass':
      return fill(GRASS_SEED_T, { n: GRASS_PACK })
    case 'buy-rotary-shovel':
      return fill(
        'Motorised. Digs anything a shovel digs, near enough instantly. ${uses} uses, ${workSeconds}s per dig.',
        SHOVELS['rotary-shovel'],
      )
    case 'buy-diamond-pickaxe':
      return fill(
        'Cuts rock like tilled soil. ${uses} uses, ${workSeconds}s per mine.',
        PICKAXES['diamond-pickaxe'],
      )
  }
}

const TILE_T = 'Paving. Lays on untilled ground and stays put. Keeps the garden walkable and tidy.'
const FENCE_T =
  'Sits in the middle of an untilled tile and joins up with the fences beside it. Marks a boundary; the gardener still walks through.'
const GRASS_SEED_T =
  'Pack of ${n}. Sow on tilled soil. Drinks almost nothing and takes a quarter day to root, then the plot goes back to untilled lawn.'

export function itemTip(item: Item): string {
  if (item.kind === 'shovel') return `${item.id} ${item.usesLeft}`
  if (item.kind === 'pickaxe') return `${item.id} ${item.usesLeft}`
  if (item.kind === 'container') return `${item.id} ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'fertilizer') return `fertilizer ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'synth') return `synth ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'compost') return `compost ${item.liters}/${item.capacityLiters}L`
  if (item.kind === 'box') {
    if (item.cargo.kind === 'empty') return `box ${item.cap}`
    return `box ${item.cargo.goods} ${item.cargo.stack.crop} ${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'seeds') return `seeds ${item.crop} ${item.count}`
  if (item.kind === 'grass-seeds') return `grass-seeds ${item.count}`
  if (item.kind === 'fruit') return `fruit ${item.crop} ${item.count}`
  if (item.kind === 'sugar') return `sugar ${item.count}`
  if (item.kind === 'sapling') return `sapling ${item.tree}`
  if (item.kind === 'rotten') return `rotten ${item.cls} ${item.count}`
  if (item.kind === 'dead') return `dead ${item.cls} ${item.count}`
  if (item.kind === 'weed') return `weed ${item.count}`
  if (item.kind === 'grass') return `grass ${item.count}`
  return 'sugar'
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
    case 'pack-olive':
      return { kind: 'seeds', crop: 'olive', rarity: 'common', count: 5 }
    case 'pack-grape':
      return { kind: 'seeds', crop: 'grape', rarity: 'common', count: 5 }
    case 'pack-vanilla':
      return { kind: 'seeds', crop: 'vanilla', rarity: 'common', count: 5 }
    case 'pack-sugar-cane':
      return { kind: 'seeds', crop: 'sugar-cane', rarity: 'common', count: 5 }
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
    case 'buy-fence':
      return { kind: 'fence' }
    case 'pack-grass':
      return { kind: 'grass-seeds', count: GRASS_PACK }
    case 'buy-rotary-shovel':
      return makeShovel('rotary-shovel')
    case 'buy-diamond-pickaxe':
      return makePickaxe('diamond-pickaxe')
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
  if (box.cargo.kind !== 'stack') return 0
  if (box.cargo.goods !== goods || box.cargo.stack.crop !== crop || box.cargo.stack.rarity !== rarity) {
    return 0
  }
  return Math.min(n, box.cap - box.cargo.stack.count)
}

export function boxAdd(
  box: Extract<Item, { kind: 'box' }>,
  goods: 'seeds',
  crop: AnnualId,
  rarity: Rarity,
  n: number,
): number {
  const take = boxAccepts(box, 'seeds', crop, rarity, n)
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
