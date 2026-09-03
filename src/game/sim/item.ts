import { fill } from '../defs/catalog.ts'
import {
  BARREL_AGE,
  BARREL_MATURE,
  CASK_SALE,
  SPIRIT_RARITY,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_SECONDS,
  COMPOST_VALUE,
  CONTAINERS,
  FERT_BAG_LITERS,
  FREEZER_LARGE_SLOTS,
  FREEZER_SLOTS,
  FREEZER_ROT_MUL,
  GRIND_MAX,
  GRIND_MIN,
  GRASS_PACK,
  GRIND_WORK,
  JAM_BUFFER,
  JAM_IN,
  JAM_SECONDS,
  JAM_SUGAR,
  MILL_GRASS,
  MILL_IN,
  MILL_WORK,
  PICKAXES,
  SHOVELS,
  SPRINKLER_TILE_DAY,
  STILL_CAP,
  STILL_SECONDS,
  STILL_WATER,
  SUGAR_BAG,
  SUGAR_MILL,
  SUGAR_SHOP,
  SYNTH_BAG_LITERS,
  WEED_SPRAY_BAG,
} from '../defs/items.ts'
import type { Rarity } from '../defs/rarity.ts'
import { CLASS_NAME, cropVariety, freshMul, type CropClass } from '../defs/crops.ts'
import { TREE_NAME } from '../defs/trees.ts'
import { SOURCE, TAP_RATE } from './water.ts'
import type {
  AnnualId,
  CaskId,
  ContainerId,
  CropId,
  JamCrop,
  PickaxeId,
  ShovelId,
  SkuId,
  SpiritKind,
  TileId,
  TreeId,
} from './ids.ts'
import type { Modifier } from './modifiers.ts'

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
  | { kind: 'seeds'; crop: AnnualId; rarity: Rarity; count: number }
  | { kind: 'grass-seeds'; count: number }
  | { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number; unitSale: number; freshness: number; bio: boolean }
  | { kind: 'tree-seed'; tree: TreeId }
  | { kind: 'sugar'; liters: number; capacityLiters: number; unitSale: number }
  | { kind: 'spirit'; spirit: SpiritKind; rarity: Rarity; count: number; unitSale: number }
  | { kind: 'cask'; cask: CaskId; rarity: Rarity; count: number; unitSale: number }
  | { kind: 'jam'; crop: JamCrop; count: number; unitSale: number }
  | { kind: 'oil'; count: number; unitSale: number }
  | { kind: 'flour'; count: number; unitSale: number }
  | { kind: 'extract'; count: number; unitSale: number }
  | { kind: 'rotten'; cls: CropClass; count: number }
  | { kind: 'dead'; cls: CropClass; count: number }
  | { kind: 'weed'; count: number }
  | { kind: 'grass'; count: number }
  | { kind: 'weed-spray'; liters: number; capacityLiters: number }

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
  | { kind: 'water' }
  | { kind: 'mill' }
  | { kind: 'jam-machine' }
  | { kind: 'still' }
  | { kind: 'barrel' }
  | { kind: 'freezer'; slots: number }
  | { kind: 'hangar' }
  | { kind: 'silo-seed' }
  | { kind: 'silo-spray' }
  | { kind: 'silo-produce' }
  | { kind: 'lever' }
  | { kind: 'button' }
  | { kind: 'lamp' }
  | { kind: 'or' }
  | { kind: 'and' }
  | { kind: 'not' }
  | { kind: 'pulser' }
  | { kind: 'counter' }
  | { kind: 'sensor-water' }
  | { kind: 'sensor-fert' }
  | { kind: 'sensor-harvest' }
  | { kind: 'sensor-day' }
  | { kind: 'water-system' }
  | { kind: 'vehicle-detector' }
  | { kind: 'traffic-light' }
  | { kind: 'delete' }
  | { kind: 'tile'; tile: TileId }
  | { kind: 'fence' }

export function compostValue(item: Item): number {
  if (item.kind === 'seeds') return COMPOST_VALUE.seeds * item.count
  if (item.kind === 'grass-seeds') return COMPOST_VALUE.seeds * item.count
  if (item.kind === 'fruit') {
    return (item.rarity === 'heirloom' ? COMPOST_VALUE.heirloom : COMPOST_VALUE.fruit) * item.count
  }
  if (item.kind === 'sugar') return COMPOST_VALUE.fruit * item.liters
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

export function toolName(hand: Hand): string {
  if (hand.kind === 'empty') return 'hand'
  const it = hand.item
  if (it.kind === 'shovel') return SHOVEL_NAME[it.id]
  if (it.kind === 'pickaxe') return PICKAXE_NAME[it.id]
  if (it.kind === 'container') return it.id === 'bucket' ? 'Bucket' : 'Large bucket'
  if (it.kind === 'fertilizer') return 'Fertilizer bag'
  if (it.kind === 'synth') return 'Synthetic fertilizer'
  if (it.kind === 'compost') return 'Compost'
  if (it.kind === 'seeds') return `${cropName(it.crop)} seed`
  if (it.kind === 'grass-seeds') return 'Grass seed'
  if (it.kind === 'fruit') return cropVariety(it.crop, it.rarity)
  if (it.kind === 'sugar') return 'Sugar'
  if (it.kind === 'spirit') return SPIRIT_NAME[it.spirit]
  if (it.kind === 'cask') return CASK_NAME[it.cask]
  if (it.kind === 'jam') return it.crop === 'tomato' ? 'Ketchup' : `${cropName(it.crop)} jam`
  if (it.kind === 'oil') return 'Olive oil'
  if (it.kind === 'flour') return 'Flour'
  if (it.kind === 'extract') return 'Extract'
  if (it.kind === 'tree-seed') return `${TREE_NAME[it.tree]} seed`
  if (it.kind === 'rotten') return rottenName(it.cls)
  if (it.kind === 'dead') return deadName(it.cls)
  if (it.kind === 'weed') return 'Pulled weed'
  if (it.kind === 'weed-spray') return 'Weed spray'
  return 'Cut grass'
}

export function faceName(face: Face): string {
  if (face.kind === 'water') return 'Water'
  if (face.kind === 'pumpjack') return 'Pumpjack'
  if (face.kind === 'chest') return 'Chest'
  if (face.kind === 'grinder') return 'Seed grinder'
  if (face.kind === 'compost-box') return 'Compost box'
  if (face.kind === 'well') return 'Well'
  if (face.kind === 'pipe') return 'Pipe'
  if (face.kind === 'sprinkler') return 'Sprinkler'
  if (face.kind === 'sprinkler-vert') return 'Vertical sprinkler'
  if (face.kind === 'sprinkler-large') return 'Large sprinkler'
  if (face.kind === 'valve') return 'Valve'
  if (face.kind === 'rain-tank') return 'Rainwater tank'
  if (face.kind === 'tap') return 'Tap'
  if (face.kind === 'mill') return 'Mill'
  if (face.kind === 'jam-machine') return 'Jam machine'
  if (face.kind === 'still') return 'Pot still'
  if (face.kind === 'barrel') return 'Barrel'
  if (face.kind === 'freezer') return 'Freezer'
  if (face.kind === 'hangar') return 'Vehicle hangar'
  if (face.kind === 'silo-seed') return 'Seeding silo'
  if (face.kind === 'silo-spray') return 'Spraying silo'
  if (face.kind === 'silo-produce') return 'Produce silo'
  if (face.kind === 'lever') return 'Lever'
  if (face.kind === 'button') return 'Button'
  if (face.kind === 'lamp') return 'Lamp'
  if (face.kind === 'or') return 'OR gate'
  if (face.kind === 'and') return 'AND gate'
  if (face.kind === 'not') return 'NOT gate'
  if (face.kind === 'pulser') return 'Pulser'
  if (face.kind === 'counter') return 'Counter'
  if (face.kind === 'sensor-water') return 'Water sensor'
  if (face.kind === 'sensor-fert') return 'Fertilizer sensor'
  if (face.kind === 'sensor-harvest') return 'Harvest sensor'
  if (face.kind === 'sensor-day') return 'Day sensor'
  if (face.kind === 'water-system') return 'Water-system sensor'
  if (face.kind === 'vehicle-detector') return 'Vehicle detector'
  if (face.kind === 'traffic-light') return 'Traffic light'
  if (face.kind === 'delete') return 'Delete'
  if (face.kind === 'fence') return 'Wooden fence'
  if (face.kind === 'tile') {
    if (face.tile === 'paved') return 'Paving slab'
    if (face.tile === 'brick') return 'Brickwork'
    return 'Cobblestone'
  }
  return toolName({ kind: 'hold', item: face })
}

export function caskAgeOf(item: { cask: CaskId; rarity: Rarity; unitSale: number }): number {
  return item.unitSale / (CASK_SALE[item.cask] * SPIRIT_RARITY[item.rarity])
}

export const CASK_NAME: { readonly [K in CaskId]: string } = {
  wine: 'Wine',
  cider: 'Cider',
}

export const SPIRIT_NAME: { readonly [K in SpiritKind]: string } = {
  vodka: 'Vodka',
  beer: 'Beer',
  brandy: 'Brandy',
  mixed: 'Mixed spirit',
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
  if (item.kind === 'seeds') return `${cropName(item.crop)} seed - ${item.count}, plant it`
  if (item.kind === 'grass-seeds') return `Grass seed - ${item.count}, plant it on tilled soil`
  if (item.kind === 'fruit') {
    return `${cropVariety(item.crop, item.rarity)} - ${item.count}, freshness ${Math.floor(item.freshness * 100)}%`
  }
  if (item.kind === 'sugar') return `Sugar - ${item.liters}L`
  if (item.kind === 'spirit') return `${SPIRIT_NAME[item.spirit]} - ${item.count}`
  if (item.kind === 'cask') {
    const mul = Number(caskAgeOf(item).toFixed(2))
    return `${CASK_NAME[item.cask]}${mul > 1 ? ` ×${mul}` : ''} - ${item.count}`
  }
  if (item.kind === 'jam') {
    const name = item.crop === 'tomato' ? 'Ketchup' : `${cropName(item.crop)} jam`
    return `${name} - ${item.count}`
  }
  if (item.kind === 'oil') return `Olive oil - ${item.count}`
  if (item.kind === 'flour') return `Flour - ${item.count}`
  if (item.kind === 'extract') return `Extract - ${item.count}`
  if (item.kind === 'tree-seed') return `${TREE_NAME[item.tree]} seed - plant it on soft ground`
  if (item.kind === 'rotten') return `${rottenName(item.cls)} - ${item.count}, compost it`
  if (item.kind === 'dead') return `${deadName(item.cls)} - ${item.count}, compost it`
  if (item.kind === 'weed') return `Pulled weed - ${item.count}, compost it`
  if (item.kind === 'weed-spray') {
    return `Weed spray - ${Number(item.liters.toFixed(2))}/${item.capacityLiters}L`
  }
  return `Cut grass - ${item.count}, compost it`
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
    case 'pack-grape':
      return 'Grape seeds'
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
    case 'buy-fertilizer':
      return 'Fertilizer bag'
    case 'buy-synth-fertilizer':
      return 'Synthetic fertilizer'
    case 'buy-weed-spray':
      return 'Weed spray'
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
      return 'Valve'
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
    case 'buy-mill':
      return 'Mill'
    case 'buy-jam':
      return 'Jam machine'
    case 'buy-still':
      return 'Pot still'
    case 'buy-barrel':
      return 'Barrel'
    case 'buy-freezer':
      return 'Freezer'
    case 'buy-freezer-large':
      return 'Large freezer'
    case 'buy-sugar':
      return 'Sugar'
    case 'buy-hangar':
      return 'Vehicle hangar'
    case 'buy-silo-seed':
      return 'Seeding silo'
    case 'buy-silo-spray':
      return 'Spraying silo'
    case 'buy-silo-produce':
      return 'Produce silo'
    case 'buy-lever':
      return 'Lever'
    case 'buy-button':
      return 'Button'
    case 'buy-lamp':
      return 'Lamp'
    case 'buy-or':
      return 'OR gate'
    case 'buy-and':
      return 'AND gate'
    case 'buy-not':
      return 'NOT gate'
    case 'buy-pulser':
      return 'Pulser'
    case 'buy-counter':
      return 'Counter'
    case 'buy-sensor-water':
      return 'Water sensor'
    case 'buy-sensor-fert':
      return 'Fertilizer sensor'
    case 'buy-sensor-harvest':
      return 'Harvest sensor'
    case 'buy-sensor-day':
      return 'Day sensor'
    case 'buy-water-system':
      return 'Water-system sensor'
    case 'buy-vehicle-detector':
      return 'Vehicle detector'
    case 'buy-traffic-light':
      return 'Traffic light'
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
    case 'pack-grape':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil.', { name: cropName('grape') })
    case 'pack-sugar-cane':
      return fill('Pack of 5 ${name} seeds. Plant on tilled soil. Ripe cane is fruit. Mill cane for sugar.', {
        name: cropName('sugar-cane'),
      })
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
    case 'buy-fertilizer':
      return fill('Holds ${n} L. Tops a plot back up to full fertilizer, spending only what the soil is missing.', {
        n: FERT_BAG_LITERS,
      })
    case 'buy-synth-fertilizer':
      return fill('Holds ${n} L and works the same, but the soil and its produce stop being organic.', {
        n: SYNTH_BAG_LITERS,
      })
    case 'buy-weed-spray':
      return fill('Holds ${n} L. Click tilled soil to starve weeds there.', { n: WEED_SPRAY_BAG })
    case 'buy-compost-box':
      return fill(
        'Drop organic waste in. ${need} units make ${liters} L of compost in ${seconds}s. A chest on the right takes the bag, else it drops beside the box.',
        { need: COMPOST_NEED, liters: COMPOST_LITERS, seconds: COMPOST_SECONDS },
      )
    case 'buy-pumpjack':
      return fill(
        'Gathers ${rate} L/s into a ${cap} L tank. Fill a bucket straight from it, or run pipe out of any of its corners to feed taps and sprinklers. Everything it pumps is charged at the end of the day.',
        { rate: SOURCE.pump.rate, cap: SOURCE.pump.capacity },
      )
    case 'buy-chest':
      return '9 slots. Walk up and store any item.'
    case 'buy-grinder':
      return fill('Hopper. One fruit becomes ${min}–${max} seeds of the same crop and rarity. ${workSeconds}s per fruit.', {
        min: GRIND_MIN,
        max: GRIND_MAX,
        workSeconds: GRIND_WORK,
      })
    case 'buy-pipe':
      return 'Lies on the edge between two tiles and carries water from a source to your taps and sprinklers. Drag while placing to lay a whole run at once. Any pipe touching a source at a corner is fed by it.'
    case 'buy-sprinkler':
      return fill('Waters a 2×2 area of plots, ${day} L a day each. It pours only on plots with something growing, and only while pipe connects it to a source that still holds water.', { day: SPRINKLER_TILE_DAY })
    case 'buy-sprinkler-vert':
      return fill('Waters a 4×2 strip, ${day} L a day per plot. Rotate it while placing to lay the strip north-south or east-west.', {
        day: SPRINKLER_TILE_DAY,
      })
    case 'buy-sprinkler-large':
      return fill('Waters a 4×4 area, ${day} L a day per plot.', { day: SPRINKLER_TILE_DAY })
    case 'buy-well':
      return fill(
        'Gathers ${rate} L/s into a ${cap} L tank, and what you draw from it costs nothing. Fill a bucket straight from it, or run pipe out of any of its corners to feed taps and sprinklers. A drought slows it.',
        { rate: SOURCE.well.rate, cap: SOURCE.well.capacity },
      )
    case 'buy-valve':
      return 'Sits on one pipe, and lays that pipe too if the edge is bare. Click it and the gardener walks over to shut that pipe off, or open it again. Water still reaches a sprinkler by any other open route.'
    case 'buy-rain-tank':
      return fill('Gathers ${rate} L/s into a ${cap} L tank on its own, and many times that while it rains. It fills wherever it stands, with no pump and no pipe to a source.', {
        rate: SOURCE['rain-tank'].rate,
        cap: SOURCE['rain-tank'].capacity,
      })
    case 'buy-tap':
      return fill('Fills a bucket at ${rate} L/s, as long as pipe connects it to a source. Put one next to your tilled soil and you stop walking back to the pump. Once the tanks run dry it fills only as fast as your sources make water.', {
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
    case 'buy-mill':
      return fill(
        'Hopper mill. ${in} cane, olive or wheat, or ${grass} grass, crush in ${work}s. Cane makes ${bag} L sugar at ${sale}/L.',
        { in: MILL_IN, grass: MILL_GRASS, work: MILL_WORK, bag: SUGAR_BAG, sale: SUGAR_MILL },
      )
    case 'buy-jam':
      return fill('${fruit} fruit and ${sugar} L sugar cook in ${seconds}s. Buffer ${buffer} L.', {
        fruit: JAM_IN,
        sugar: JAM_SUGAR,
        seconds: JAM_SECONDS,
        buffer: JAM_BUFFER,
      })
    case 'buy-still':
      return fill('Distills ${cap} potato, wheat or apricot with ${water} L water in ${seconds}s.', {
        cap: STILL_CAP,
        water: STILL_WATER,
        seconds: STILL_SECONDS,
      })
    case 'buy-barrel':
      return fill('Five grapes or four apples. Matures in ${mature}s, ages to ${age}s.', {
        mature: BARREL_MATURE,
        age: BARREL_AGE,
      })
    case 'buy-freezer':
      return fill('${n} slots. Fruit in here rots ${pct}% slower.', { n: FREEZER_SLOTS, pct: (1 - FREEZER_ROT_MUL) * 100 })
    case 'buy-freezer-large':
      return fill('${n} slots. Fruit in here rots ${pct}% slower. Earned from a contract, never sold.', {
        n: FREEZER_LARGE_SLOTS,
        pct: (1 - FREEZER_ROT_MUL) * 100,
      })
    case 'buy-sugar':
      return fill('${bag} L bag at ${sale}/L.', { bag: SUGAR_BAG, sale: SUGAR_SHOP })
    case 'buy-hangar':
      return '3×2 industrial shed. Buy Quads and tractors at a hangar.'
    case 'buy-silo-seed':
      return '2×3 field tank. Look only.'
    case 'buy-silo-spray':
      return '2×3 field tank. Look only.'
    case 'buy-silo-produce':
      return '2×3 field tank. Look only.'
    case 'buy-lever':
      return 'A switch you flip by hand to send a signal down its wire, and flip again to stop it. Wire it to a valve or a sprinkler and you control water without walking there. An incoming signal flips it too.'
    case 'buy-button':
      return 'Press it to send one short signal that stops on its own.'
    case 'buy-lamp':
      return 'Lights up while the wire feeding it is on. It does nothing else: it is there to show you what your wiring is doing.'
    case 'buy-or':
      return 'Turns on when either of its two inputs is on.'
    case 'buy-and':
      return 'Turns on only while both of its inputs are on.'
    case 'buy-not':
      return 'Turns on while its input is off, and off while it is on.'
    case 'buy-pulser':
      return 'Sends a single signal the moment its input turns on, then stays quiet until that input goes off and comes back. It turns a signal that stays on into a single one.'
    case 'buy-counter':
      return 'Counts up while its input is on. Set a number to stop at: on reaching that count it sends one signal and starts again from zero, so something runs at intervals instead of constantly.'
    case 'buy-sensor-water':
      return 'Watches the plots around it and turns on when a plant is too dry or too wet — tick which of the two you care about. Wire it to a sprinkler and the field waters itself.'
    case 'buy-sensor-fert':
      return 'Watches the growing plants around it and turns on as soon as one is starving for fertilizer.'
    case 'buy-sensor-harvest':
      return 'Watches the crops around it and turns on when they are ready to pick. Set Any for the first ripe plant, or All to wait until the whole patch is ripe.'
    case 'buy-sensor-day':
      return 'Turns on during the parts of the day you tick: sunrise, day, sunset, twilight.'
    case 'buy-water-system':
      return 'Joins your water network like a tap, and turns on when the sprinklers want more water than the tanks hold. Wire it to a valve to shut part of the field off before the whole network runs dry.'
    case 'buy-vehicle-detector':
      return 'A floor plate you drive over. Turns on while a Quad or tractor stands on it, so an arriving vehicle can set something off.'
    case 'buy-traffic-light':
      return 'Stops a vehicle on its route while its input is off, and lets it go when the input turns on. It sends a signal of its own while a vehicle is waiting, so one vehicle can wait for another to finish.'
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
  if (item.kind === 'seeds') return `seeds ${item.crop} ${item.count}`
  if (item.kind === 'grass-seeds') return `grass-seeds ${item.count}`
  if (item.kind === 'fruit') return `fruit ${item.crop} ${item.count}`
  if (item.kind === 'sugar') return `sugar ${item.liters}L`
  if (item.kind === 'spirit') return `spirit ${item.spirit} ${item.count}`
  if (item.kind === 'cask') return `${item.cask} ${item.count} ×${Number(caskAgeOf(item).toFixed(2))}`
  if (item.kind === 'jam') return `jam ${item.crop} ${item.count}`
  if (item.kind === 'oil') return `oil ${item.count}`
  if (item.kind === 'flour') return `flour ${item.count}`
  if (item.kind === 'extract') return `extract ${item.count}`
  if (item.kind === 'tree-seed') return `tree-seed ${item.tree}`
  if (item.kind === 'rotten') return `rotten ${item.cls} ${item.count}`
  if (item.kind === 'dead') return `dead ${item.cls} ${item.count}`
  if (item.kind === 'weed') return `weed ${item.count}`
  if (item.kind === 'weed-spray') return `weed-spray ${item.liters}/${item.capacityLiters}L`
  return `grass ${item.count}`
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

export function makeFertilizer(): Item {
  return { kind: 'fertilizer', liters: FERT_BAG_LITERS, capacityLiters: FERT_BAG_LITERS }
}

export function makeSynth(): Item {
  return { kind: 'synth', liters: SYNTH_BAG_LITERS, capacityLiters: SYNTH_BAG_LITERS }
}

export function makeCompost(): Item {
  return { kind: 'compost', liters: COMPOST_LITERS, capacityLiters: COMPOST_LITERS }
}

export function makeSugar(liters: number, capacityLiters: number, unitSale: number): Item {
  return { kind: 'sugar', liters, capacityLiters, unitSale }
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
    case 'pack-grape':
      return { kind: 'seeds', crop: 'grape', rarity: 'common', count: 5 }
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
    case 'buy-fertilizer':
      return makeFertilizer()
    case 'buy-synth-fertilizer':
      return makeSynth()
    case 'buy-weed-spray':
      return { kind: 'weed-spray', liters: WEED_SPRAY_BAG, capacityLiters: WEED_SPRAY_BAG }
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
    case 'buy-mill':
      return { kind: 'mill' }
    case 'buy-jam':
      return { kind: 'jam-machine' }
    case 'buy-still':
      return { kind: 'still' }
    case 'buy-barrel':
      return { kind: 'barrel' }
    case 'buy-freezer':
      return { kind: 'freezer', slots: FREEZER_SLOTS }
    case 'buy-freezer-large':
      return { kind: 'freezer', slots: FREEZER_LARGE_SLOTS }
    case 'buy-sugar':
      return makeSugar(SUGAR_BAG, SUGAR_BAG, SUGAR_SHOP)
    case 'buy-hangar':
      return { kind: 'hangar' }
    case 'buy-silo-seed':
      return { kind: 'silo-seed' }
    case 'buy-silo-spray':
      return { kind: 'silo-spray' }
    case 'buy-silo-produce':
      return { kind: 'silo-produce' }
    case 'buy-lever':
      return { kind: 'lever' }
    case 'buy-button':
      return { kind: 'button' }
    case 'buy-lamp':
      return { kind: 'lamp' }
    case 'buy-or':
      return { kind: 'or' }
    case 'buy-and':
      return { kind: 'and' }
    case 'buy-not':
      return { kind: 'not' }
    case 'buy-pulser':
      return { kind: 'pulser' }
    case 'buy-counter':
      return { kind: 'counter' }
    case 'buy-sensor-water':
      return { kind: 'sensor-water' }
    case 'buy-sensor-fert':
      return { kind: 'sensor-fert' }
    case 'buy-sensor-harvest':
      return { kind: 'sensor-harvest' }
    case 'buy-sensor-day':
      return { kind: 'sensor-day' }
    case 'buy-water-system':
      return { kind: 'water-system' }
    case 'buy-vehicle-detector':
      return { kind: 'vehicle-detector' }
    case 'buy-traffic-light':
      return { kind: 'traffic-light' }
  }
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

export type Countable = Extract<Item, { count: number }>

export function countable(item: Item): item is Countable {
  return 'count' in item
}

export function crafted(item: Countable): boolean {
  return (
    item.kind === 'spirit' ||
    item.kind === 'cask' ||
    item.kind === 'jam' ||
    item.kind === 'oil' ||
    item.kind === 'flour' ||
    item.kind === 'extract'
  )
}

export function stackable(a: Countable, b: Countable): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'seeds' || a.kind === 'fruit') {
    const o = b as Extract<Countable, { crop: CropId | AnnualId; rarity: Rarity }>
    return a.crop === o.crop && a.rarity === o.rarity
  }
  if (a.kind === 'spirit') return a.spirit === (b as typeof a).spirit && a.rarity === (b as typeof a).rarity
  if (a.kind === 'cask') return a.cask === (b as typeof a).cask && a.rarity === (b as typeof a).rarity
  if (a.kind === 'jam') return a.crop === (b as typeof a).crop
  if (a.kind === 'rotten' || a.kind === 'dead') return a.cls === (b as typeof a).cls
  return true
}

export function mergeInto(a: Countable, b: Countable, n: number): void {
  if (a.kind === 'fruit' && b.kind === 'fruit') {
    const part = { ...b, count: n }
    a.unitSale = mergeUnitSale(a, part)
    a.freshness = mergeFreshness(a, part)
    a.bio = a.bio && b.bio
  } else if ('unitSale' in a && 'unitSale' in b) {
    a.unitSale = mergeUnitSale(a, { ...b, count: n })
  }
  a.count += n
}
