import { m } from '../../paraglide/messages.js'
import {
  BARREL_AGE,
  BARREL_MATURE,
  CASK_SALE,
  CHEST_SLOTS,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_SECONDS,
  COMPOST_VALUE,
  CONTAINERS,
  AXES,
  FERT_BAG_LITERS,
  FURNACE_ASH,
  FURNACE_CAP,
  FURNACE_NEED,
  FURNACE_SECONDS,
  FURNACE_VALUE,
  FREEZER_LARGE_SLOTS,
  FREEZER_SLOTS,
  FREEZER_ROT_MUL,
  GRIND_MAX,
  GRIND_MIN,
  GRASS_PACK,
  GRIND_WORK,
  HANGAR_H,
  HANGAR_W,
  JAM_BUFFER,
  JAM_IN,
  JAM_SECONDS,
  JAM_SUGAR,
  MILL_GRASS,
  MILL_IN,
  MILL_WORK,
  PICKAXES,
  SHOVELS,
  SILO_H,
  SILO_W,
  SPRINKLER_TILE_DAY,
  STILL_CAP,
  STILL_SECONDS,
  STILL_WATER,
  SUGAR_BAG,
  SUGAR_MILL,
  STATION_GRAFT_MAX,
  STATION_GRAFT_MIN,
  STATION_IN,
  STATION_SECONDS,
  SUGAR_SHOP,
  SYNTH_BAG_LITERS,
  WEED_SPRAY_BAG,
} from '../defs/items.ts'
import { CLASS_NAME, CROP_NAME, cropVariety, freshMul, type CropClass } from '../defs/crops.ts'
import { pathSale, qualityMul, type VarietyId } from '../defs/varieties.ts'
import { SOURCE, TAP_RATE } from './water.ts'
import { SOIL_WATER_MID } from './soil.ts'
import { CROP_OF_CASK } from './ids.ts'
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
  variety: VarietyId
  quality: number
  count: number
  unitSale: number
  freshness: number
  bio: boolean
  cut: boolean
}

export type Item =
  | { kind: 'shovel'; id: ShovelId; usesLeft: number; workSeconds: number }
  | { kind: 'pickaxe'; id: PickaxeId; usesLeft: number; workSeconds: number }
  | { kind: 'container'; id: ContainerId; liters: number; capacityLiters: number }
  | { kind: 'fertilizer'; liters: number; capacityLiters: number }
  | { kind: 'synth'; liters: number; capacityLiters: number }
  | { kind: 'compost'; liters: number; capacityLiters: number }
  | { kind: 'seeds'; crop: AnnualId; variety: VarietyId; quality: number; count: number }
  | { kind: 'grass-seeds'; count: number }
  | { kind: 'fruit'; crop: CropId; variety: VarietyId; quality: number; count: number; unitSale: number; freshness: number; bio: boolean; cut: boolean }
  | { kind: 'tree-seed'; tree: TreeId; variety: VarietyId; quality: number }
  | { kind: 'graft'; crop: CropId; variety: VarietyId; quality: number; count: number }
  | { kind: 'sugar'; liters: number; capacityLiters: number; unitSale: number; quality: number }
  | { kind: 'spirit'; spirit: SpiritKind; variety: VarietyId; quality: number; count: number; unitSale: number }
  | { kind: 'cask'; cask: CaskId; variety: VarietyId; quality: number; count: number; unitSale: number }
  | { kind: 'jam'; crop: JamCrop; variety: VarietyId; quality: number; count: number; unitSale: number }
  | { kind: 'oil'; quality: number; count: number; unitSale: number }
  | { kind: 'flour'; quality: number; count: number; unitSale: number }
  | { kind: 'extract'; quality: number; count: number; unitSale: number }
  | { kind: 'rotten'; cls: CropClass; count: number }
  | { kind: 'dead'; cls: CropClass; count: number }
  | { kind: 'weed'; count: number }
  | { kind: 'grass'; count: number }
  | { kind: 'weed-spray'; liters: number; capacityLiters: number }
  | { kind: 'axe'; usesLeft: number; workSeconds: number }
  | { kind: 'wood'; count: number }
  | { kind: 'ash'; count: number }

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
  | { kind: 'furnace' }
  | { kind: 'station' }
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
    return COMPOST_VALUE.fruit * item.count
  }
  if (item.kind === 'sugar') return COMPOST_VALUE.fruit * item.liters
  if (item.kind === 'rotten') return COMPOST_VALUE.rotten * item.count
  if (item.kind === 'dead') return COMPOST_VALUE.dead * item.count
  if (item.kind === 'weed') return COMPOST_VALUE.weed * item.count
  if (item.kind === 'grass') return COMPOST_VALUE.grass * item.count
  if (item.kind === 'ash') return COMPOST_VALUE.ash * item.count
  return 0
}

export function furnaceValue(item: Item): number {
  if (
    item.kind === 'rotten' ||
    item.kind === 'seeds' ||
    item.kind === 'grass-seeds' ||
    item.kind === 'weed' ||
    item.kind === 'grass' ||
    item.kind === 'dead'
  ) {
    return FURNACE_VALUE.green * item.count
  }
  if (item.kind === 'tree-seed') return FURNACE_VALUE.green
  if (item.kind === 'graft') return FURNACE_VALUE.green * item.count
  if (item.kind === 'fruit') return FURNACE_VALUE.fruit * item.count
  if (item.kind === 'sugar') return FURNACE_VALUE.fruit * item.liters
  if (item.kind === 'oil') return FURNACE_VALUE.oil * item.count
  if (item.kind === 'spirit') return FURNACE_VALUE.spirit * item.count
  if (item.kind === 'wood') return FURNACE_VALUE.wood * item.count
  return 0
}

export function organic(item: Item): boolean {
  return compostValue(item) > 0
}

export const SHOVEL_NAME: { readonly [K in ShovelId]: () => string } = {
  shovel: () => m.names_shovel_shovel(),
  'better-shovel': () => m.names_shovel_better_shovel(),
  'rotary-shovel': () => m.names_shovel_rotary_shovel(),
}

export const PICKAXE_NAME: { readonly [K in PickaxeId]: () => string } = {
  pickaxe: () => m.names_pickaxe_pickaxe(),
  'better-pickaxe': () => m.names_pickaxe_better_pickaxe(),
  'diamond-pickaxe': () => m.names_pickaxe_diamond_pickaxe(),
}

export const CONTAINER_NAME: { readonly [K in ContainerId]: () => string } = {
  bucket: () => m.names_container_bucket(),
  'large-bucket': () => m.names_container_large_bucket(),
}

export function cropName(id: CropId): string {
  return CROP_NAME[id]()
}

export function jamJarName(crop: JamCrop, variety: VarietyId): string {
  if (variety === 'concord') return m.names_jam_concord()
  if (variety === 'black-raspberry') return m.names_jam_black_raspberry()
  if (variety === 'montmorency') return m.names_jam_montmorency()
  if (variety === 'blenheim') return m.names_jam_blenheim()
  if (variety === 'san-marzano') return m.names_jam_san_marzano()
  if (crop === 'tomato' && variety === 'base') return m.names_item_ketchup()
  return m.hud_tool_jam({ name: cropName(crop) })
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
  if (hand.kind === 'empty') return m.names_item_hand()
  const it = hand.item
  if (it.kind === 'shovel') return SHOVEL_NAME[it.id]()
  if (it.kind === 'pickaxe') return PICKAXE_NAME[it.id]()
  if (it.kind === 'container') return CONTAINER_NAME[it.id]()
  if (it.kind === 'fertilizer') return m.names_item_fertilizer()
  if (it.kind === 'synth') return m.names_item_synth()
  if (it.kind === 'compost') return m.names_item_compost()
  if (it.kind === 'seeds') return m.hud_tool_seed({ name: cropName(it.crop) })
  if (it.kind === 'grass-seeds') return m.names_item_grass_seed()
  if (it.kind === 'fruit') return cropVariety(it.crop, it.variety)
  if (it.kind === 'sugar') return m.names_item_sugar()
  if (it.kind === 'spirit') return SPIRIT_NAME[it.spirit]()
  if (it.kind === 'cask') return CASK_NAME[it.cask]()
  if (it.kind === 'jam') return jamJarName(it.crop, it.variety)
  if (it.kind === 'oil') return m.names_item_oil()
  if (it.kind === 'flour') return m.names_item_flour()
  if (it.kind === 'extract') return m.names_item_extract()
  if (it.kind === 'tree-seed') return m.hud_tool_seed({ name: cropVariety(it.tree, it.variety) })
  if (it.kind === 'rotten') return rottenName(it.cls)
  if (it.kind === 'dead') return deadName(it.cls)
  if (it.kind === 'weed') return m.names_item_weed()
  if (it.kind === 'weed-spray') return m.names_item_weed_spray()
  if (it.kind === 'axe') return m.names_item_axe()
  if (it.kind === 'wood') return m.names_item_wood()
  if (it.kind === 'ash') return m.names_item_ash()
  return m.names_item_cut_grass()
}

export const TILE_NAME: { readonly [K in TileId]: () => string } = {
  paved: () => m.names_tile_paved(),
  brick: () => m.names_tile_brick(),
  cobble: () => m.names_tile_cobble(),
}

const PLACE_NAME = {
  water: () => m.names_face_water(),
  pumpjack: () => m.names_face_pumpjack(),
  chest: () => m.names_building_chest(),
  grinder: () => m.names_building_grinder(),
  'compost-box': () => m.names_building_compost_box(),
  well: () => m.names_building_well(),
  pipe: () => m.names_building_pipe(),
  sprinkler: () => m.names_building_sprinkler(),
  'sprinkler-vert': () => m.names_building_sprinkler_vert(),
  'sprinkler-large': () => m.names_building_sprinkler_large(),
  valve: () => m.names_building_valve(),
  'rain-tank': () => m.names_building_rain_tank(),
  tap: () => m.names_building_tap(),
  mill: () => m.names_building_mill(),
  'jam-machine': () => m.names_building_jam(),
  still: () => m.names_building_still(),
  furnace: () => m.names_building_furnace(),
  station: () => m.names_building_station(),
  barrel: () => m.names_building_barrel(),
  freezer: () => m.names_building_freezer(),
  hangar: () => m.names_building_hangar(),
  'silo-seed': () => m.names_building_silo_seed(),
  'silo-spray': () => m.names_building_silo_spray(),
  'silo-produce': () => m.names_building_silo_produce(),
  lever: () => m.names_sensor_lever(),
  button: () => m.names_sensor_button(),
  lamp: () => m.names_sensor_lamp(),
  or: () => m.names_sensor_or(),
  and: () => m.names_sensor_and(),
  not: () => m.names_sensor_not(),
  pulser: () => m.names_sensor_pulser(),
  counter: () => m.names_sensor_counter(),
  'sensor-water': () => m.names_sensor_water(),
  'sensor-fert': () => m.names_sensor_fert(),
  'sensor-harvest': () => m.names_sensor_harvest(),
  'sensor-day': () => m.names_sensor_day(),
  'water-system': () => m.names_sensor_water_system(),
  'vehicle-detector': () => m.names_sensor_vehicle_detector(),
  'traffic-light': () => m.names_sensor_traffic_light(),
  delete: () => m.names_face_delete(),
  fence: () => m.names_building_fence(),
} as const

export function faceName(face: Face): string {
  switch (face.kind) {
    case 'tile':
      return TILE_NAME[face.tile]()
    case 'water':
    case 'pumpjack':
    case 'chest':
    case 'grinder':
    case 'compost-box':
    case 'well':
    case 'pipe':
    case 'sprinkler':
    case 'sprinkler-vert':
    case 'sprinkler-large':
    case 'valve':
    case 'rain-tank':
    case 'tap':
    case 'mill':
    case 'jam-machine':
    case 'still':
    case 'furnace':
    case 'station':
    case 'barrel':
    case 'freezer':
    case 'hangar':
    case 'silo-seed':
    case 'silo-spray':
    case 'silo-produce':
    case 'lever':
    case 'button':
    case 'lamp':
    case 'or':
    case 'and':
    case 'not':
    case 'pulser':
    case 'counter':
    case 'sensor-water':
    case 'sensor-fert':
    case 'sensor-harvest':
    case 'sensor-day':
    case 'water-system':
    case 'vehicle-detector':
    case 'traffic-light':
    case 'delete':
    case 'fence':
      return PLACE_NAME[face.kind]()
    default:
      return toolName({ kind: 'hold', item: face })
  }
}

export function caskAgeOf(item: { cask: CaskId; variety: VarietyId; quality: number; unitSale: number }): number {
  const rate = pathSale(CROP_OF_CASK[item.cask], item.variety, 'alcohol')
  return item.unitSale / (CASK_SALE[item.cask] * rate * qualityMul(item.quality))
}

export const CASK_NAME: { readonly [K in CaskId]: () => string } = {
  wine: () => m.names_cask_wine(),
  cider: () => m.names_cask_cider(),
}

export const SPIRIT_NAME: { readonly [K in SpiritKind]: () => string } = {
  vodka: () => m.names_spirit_vodka(),
  beer: () => m.names_spirit_beer(),
  brandy: () => m.names_spirit_brandy(),
  mixed: () => m.names_spirit_mixed(),
}

export function rottenName(cls: CropClass): string {
  return m.hud_tool_rotten({ cls: CLASS_NAME[cls]() })
}

export function deadName(cls: CropClass): string {
  return m.hud_tool_dead({ cls: CLASS_NAME[cls]() })
}

export function itemLine(item: Item, _mods: readonly Modifier[]): string {
  if (item.kind === 'shovel') {
    return m.hud_line_uses({ name: SHOVEL_NAME[item.id](), left: item.usesLeft, uses: SHOVELS[item.id].uses })
  }
  if (item.kind === 'pickaxe') {
    return m.hud_line_uses({ name: PICKAXE_NAME[item.id](), left: item.usesLeft, uses: PICKAXES[item.id].uses })
  }
  if (item.kind === 'container') {
    return m.hud_line_liters({
      name: CONTAINER_NAME[item.id](),
      liters: item.liters,
      capacity: item.capacityLiters,
    })
  }
  if (item.kind === 'fertilizer') {
    return m.hud_line_liters({
      name: m.names_item_fertilizer(),
      liters: Number(item.liters.toFixed(2)),
      capacity: item.capacityLiters,
    })
  }
  if (item.kind === 'synth') {
    return m.hud_line_liters({
      name: m.names_item_synth(),
      liters: Number(item.liters.toFixed(2)),
      capacity: item.capacityLiters,
    })
  }
  if (item.kind === 'compost') {
    return m.hud_line_liters({
      name: m.names_item_compost(),
      liters: Number(item.liters.toFixed(2)),
      capacity: item.capacityLiters,
    })
  }
  if (item.kind === 'seeds') {
    return `${m.hud_line_seed({ name: cropVariety(item.crop, item.variety), count: item.count })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'grass-seeds') {
    return m.hud_line_grass_seed({ name: m.names_item_grass_seed(), count: item.count })
  }
  if (item.kind === 'fruit') {
    return `${m.hud_line_fruit({
      name: cropVariety(item.crop, item.variety),
      count: item.count,
      pct: Math.floor(item.freshness * 100),
    })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'sugar') {
    return `${m.hud_line_sugar({ name: m.names_item_sugar(), liters: item.liters })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'spirit') {
    return `${m.hud_line_count({ name: SPIRIT_NAME[item.spirit](), count: item.count })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'cask') {
    const mul = Number(caskAgeOf(item).toFixed(2))
    const line =
      mul > 1
        ? m.hud_line_cask_aged({ name: CASK_NAME[item.cask](), mul, count: item.count })
        : m.hud_line_count({ name: CASK_NAME[item.cask](), count: item.count })
    return `${line} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'jam') {
    return `${m.hud_line_count({ name: jamJarName(item.crop, item.variety), count: item.count })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'oil') {
    return `${m.hud_line_count({ name: m.names_item_oil(), count: item.count })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'flour') {
    return `${m.hud_line_count({ name: m.names_item_flour(), count: item.count })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'extract') {
    return `${m.hud_line_count({ name: m.names_item_extract(), count: item.count })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'tree-seed') {
    return `${m.hud_line_tree_seed({ name: cropVariety(item.tree, item.variety) })} ${m.hud_quality_pct({ n: Math.floor(item.quality * 100) })}`
  }
  if (item.kind === 'graft') {
    return m.hud_held_graft({
      name: cropVariety(item.crop, item.variety),
      count: item.count,
      q: Math.floor(item.quality * 100),
    })
  }
  if (item.kind === 'rotten') return m.hud_line_compost({ name: rottenName(item.cls), count: item.count })
  if (item.kind === 'dead') return m.hud_line_compost({ name: deadName(item.cls), count: item.count })
  if (item.kind === 'weed') return m.hud_line_compost({ name: m.names_item_weed(), count: item.count })
  if (item.kind === 'weed-spray') {
    return m.hud_line_liters({
      name: m.names_item_weed_spray(),
      liters: Number(item.liters.toFixed(2)),
      capacity: item.capacityLiters,
    })
  }
  if (item.kind === 'axe') {
    return m.hud_line_uses({ name: m.names_item_axe(), left: item.usesLeft, uses: AXES.axe.uses })
  }
  if (item.kind === 'wood') return m.hud_line_count({ name: m.names_item_wood(), count: item.count })
  if (item.kind === 'ash') return m.hud_line_compost({ name: m.names_item_ash(), count: item.count })
  return m.hud_line_compost({ name: m.names_item_cut_grass(), count: item.count })
}

export function heldText(hand: Hand, mods: readonly Modifier[]): string {
  if (hand.kind === 'empty') return m.hud_held_empty()
  return itemLine(hand.item, mods)
}

const SKU_LABEL: { readonly [K in SkuId]: () => string } = {
  'pack-carrot': () => m.names_sku_pack_carrot(),
  'pack-potato': () => m.names_sku_pack_potato(),
  'pack-wheat': () => m.names_sku_pack_wheat(),
  'pack-tomato': () => m.names_sku_pack_tomato(),
  'pack-raspberry': () => m.names_sku_pack_raspberry(),
  'pack-grape': () => m.names_sku_pack_grape(),
  'pack-sugar-cane': () => m.names_sku_pack_sugar_cane(),
  'buy-shovel': () => m.names_sku_buy_shovel(),
  'buy-better-shovel': () => m.names_sku_buy_better_shovel(),
  'buy-pickaxe': () => m.names_sku_buy_pickaxe(),
  'buy-better-pickaxe': () => m.names_sku_buy_better_pickaxe(),
  'buy-bucket': () => m.names_sku_buy_bucket(),
  'buy-bucket-large': () => m.names_sku_buy_bucket_large(),
  'buy-fertilizer': () => m.names_sku_buy_fertilizer(),
  'buy-synth-fertilizer': () => m.names_sku_buy_synth_fertilizer(),
  'buy-weed-spray': () => m.names_sku_buy_weed_spray(),
  'buy-compost-box': () => m.names_sku_buy_compost_box(),
  'buy-pumpjack': () => m.names_sku_buy_pumpjack(),
  'buy-chest': () => m.names_sku_buy_chest(),
  'buy-grinder': () => m.names_sku_buy_grinder(),
  'buy-pipe': () => m.names_sku_buy_pipe(),
  'buy-sprinkler': () => m.names_sku_buy_sprinkler(),
  'buy-sprinkler-vert': () => m.names_sku_buy_sprinkler_vert(),
  'buy-sprinkler-large': () => m.names_sku_buy_sprinkler_large(),
  'buy-well': () => m.names_sku_buy_well(),
  'buy-valve': () => m.names_sku_buy_valve(),
  'buy-rain-tank': () => m.names_sku_buy_rain_tank(),
  'buy-tap': () => m.names_sku_buy_tap(),
  'buy-tile-paved': () => m.names_sku_buy_tile_paved(),
  'buy-tile-brick': () => m.names_sku_buy_tile_brick(),
  'buy-tile-cobble': () => m.names_sku_buy_tile_cobble(),
  'buy-fence': () => m.names_sku_buy_fence(),
  'pack-grass': () => m.names_sku_pack_grass(),
  'buy-mill': () => m.names_sku_buy_mill(),
  'buy-jam': () => m.names_sku_buy_jam(),
  'buy-still': () => m.names_sku_buy_still(),
  'buy-barrel': () => m.names_sku_buy_barrel(),
  'buy-freezer': () => m.names_sku_buy_freezer(),
  'buy-freezer-large': () => m.names_sku_buy_freezer_large(),
  'buy-sugar': () => m.names_sku_buy_sugar(),
  'buy-hangar': () => m.names_sku_buy_hangar(),
  'buy-silo-seed': () => m.names_sku_buy_silo_seed(),
  'buy-silo-spray': () => m.names_sku_buy_silo_spray(),
  'buy-silo-produce': () => m.names_sku_buy_silo_produce(),
  'buy-lever': () => m.names_sku_buy_lever(),
  'buy-button': () => m.names_sku_buy_button(),
  'buy-lamp': () => m.names_sku_buy_lamp(),
  'buy-or': () => m.names_sku_buy_or(),
  'buy-and': () => m.names_sku_buy_and(),
  'buy-not': () => m.names_sku_buy_not(),
  'buy-pulser': () => m.names_sku_buy_pulser(),
  'buy-counter': () => m.names_sku_buy_counter(),
  'buy-sensor-water': () => m.names_sku_buy_sensor_water(),
  'buy-sensor-fert': () => m.names_sku_buy_sensor_fert(),
  'buy-sensor-harvest': () => m.names_sku_buy_sensor_harvest(),
  'buy-sensor-day': () => m.names_sku_buy_sensor_day(),
  'buy-water-system': () => m.names_sku_buy_water_system(),
  'buy-vehicle-detector': () => m.names_sku_buy_vehicle_detector(),
  'buy-traffic-light': () => m.names_sku_buy_traffic_light(),
  'buy-furnace': () => m.names_sku_buy_furnace(),
  'buy-axe': () => m.names_sku_buy_axe(),
  'buy-research-station': () => m.names_sku_buy_research_station(),
}

export function skuLabel(id: SkuId): string {
  return SKU_LABEL[id]()
}

const PACK_N = 5
const FREEZER_PCT = (1 - FREEZER_ROT_MUL) * 100

const SKU_DESC: { readonly [K in SkuId]: () => string } = {
  'pack-carrot': () => m.catalog_sku_pack({ n: PACK_N, name: cropName('carrot') }),
  'pack-potato': () => m.catalog_sku_pack({ n: PACK_N, name: cropName('potato') }),
  'pack-wheat': () => m.catalog_sku_pack({ n: PACK_N, name: cropName('wheat') }),
  'pack-tomato': () => m.catalog_sku_pack({ n: PACK_N, name: cropName('tomato') }),
  'pack-raspberry': () => m.catalog_sku_pack({ n: PACK_N, name: cropName('raspberry') }),
  'pack-grape': () => m.catalog_sku_pack({ n: PACK_N, name: cropName('grape') }),
  'pack-sugar-cane': () => m.catalog_sku_pack_sugar_cane({ n: PACK_N, name: cropName('sugar-cane') }),
  'buy-shovel': () => m.catalog_shovel(SHOVELS.shovel),
  'buy-better-shovel': () => m.catalog_better_shovel(SHOVELS['better-shovel']),
  'buy-pickaxe': () => m.catalog_pickaxe(PICKAXES.pickaxe),
  'buy-better-pickaxe': () => m.catalog_better_pickaxe(PICKAXES['better-pickaxe']),
  'buy-bucket': () => m.catalog_bucket({ n: CONTAINERS.bucket.capacityLiters, plot: SOIL_WATER_MID }),
  'buy-bucket-large': () => m.catalog_bucket({ n: CONTAINERS['large-bucket'].capacityLiters, plot: SOIL_WATER_MID }),
  'buy-fertilizer': () => m.catalog_sku_buy_fertilizer({ n: FERT_BAG_LITERS }),
  'buy-synth-fertilizer': () => m.catalog_sku_buy_synth_fertilizer({ n: SYNTH_BAG_LITERS }),
  'buy-weed-spray': () => m.catalog_weed_spray({ n: WEED_SPRAY_BAG }),
  'buy-compost-box': () =>
    m.catalog_sku_buy_compost_box({ need: COMPOST_NEED, liters: COMPOST_LITERS, seconds: COMPOST_SECONDS }),
  'buy-pumpjack': () => m.catalog_pumpjack({ rate: SOURCE.pump.rate, cap: SOURCE.pump.capacity }),
  'buy-chest': () => m.catalog_chest({ n: CHEST_SLOTS }),
  'buy-grinder': () => m.catalog_grinder({ min: GRIND_MIN, max: GRIND_MAX, workSeconds: GRIND_WORK }),
  'buy-pipe': () => m.catalog_pipe(),
  'buy-sprinkler': () => m.catalog_sprinkler({ w: 2, h: 2, day: SPRINKLER_TILE_DAY }),
  'buy-sprinkler-vert': () => m.catalog_sprinkler_vert({ w: 4, h: 2, day: SPRINKLER_TILE_DAY }),
  'buy-sprinkler-large': () => m.catalog_sprinkler_large({ w: 4, h: 4, day: SPRINKLER_TILE_DAY }),
  'buy-well': () => m.catalog_well({ rate: SOURCE.well.rate, cap: SOURCE.well.capacity }),
  'buy-valve': () => m.catalog_valve(),
  'buy-rain-tank': () => m.catalog_rain_tank({ rate: SOURCE['rain-tank'].rate, cap: SOURCE['rain-tank'].capacity }),
  'buy-tap': () => m.catalog_tap({ rate: TAP_RATE }),
  'buy-tile-paved': () => m.catalog_sku_buy_tile(),
  'buy-tile-brick': () => m.catalog_sku_buy_tile(),
  'buy-tile-cobble': () => m.catalog_sku_buy_tile(),
  'buy-fence': () => m.catalog_sku_buy_fence(),
  'pack-grass': () => m.catalog_sku_pack_grass({ n: GRASS_PACK }),
  'buy-mill': () =>
    m.catalog_sku_buy_mill({ cane: MILL_IN, grass: MILL_GRASS, work: MILL_WORK, bag: SUGAR_BAG, sale: SUGAR_MILL }),
  'buy-jam': () => m.catalog_sku_buy_jam({ fruit: JAM_IN, sugar: JAM_SUGAR, seconds: JAM_SECONDS, buffer: JAM_BUFFER }),
  'buy-still': () => m.catalog_sku_buy_still({ cap: STILL_CAP, water: STILL_WATER, seconds: STILL_SECONDS }),
  'buy-barrel': () => m.catalog_sku_buy_barrel({ mature: BARREL_MATURE, age: BARREL_AGE }),
  'buy-freezer': () => m.catalog_sku_buy_freezer({ n: FREEZER_SLOTS, pct: FREEZER_PCT }),
  'buy-freezer-large': () => m.catalog_sku_buy_freezer_large({ n: FREEZER_LARGE_SLOTS, pct: FREEZER_PCT }),
  'buy-sugar': () => m.catalog_sku_buy_sugar({ bag: SUGAR_BAG, sale: SUGAR_SHOP }),
  'buy-hangar': () => m.catalog_hangar({ w: HANGAR_W, h: HANGAR_H }),
  'buy-silo-seed': () => m.catalog_silo({ w: SILO_W, h: SILO_H }),
  'buy-silo-spray': () => m.catalog_silo({ w: SILO_W, h: SILO_H }),
  'buy-silo-produce': () => m.catalog_silo({ w: SILO_W, h: SILO_H }),
  'buy-lever': () => m.catalog_lever(),
  'buy-button': () => m.catalog_button(),
  'buy-lamp': () => m.catalog_lamp(),
  'buy-or': () => m.catalog_or(),
  'buy-and': () => m.catalog_and(),
  'buy-not': () => m.catalog_not(),
  'buy-pulser': () => m.catalog_pulser(),
  'buy-counter': () => m.catalog_counter(),
  'buy-sensor-water': () => m.catalog_sensor_water(),
  'buy-sensor-fert': () => m.catalog_sensor_fert(),
  'buy-sensor-harvest': () => m.catalog_sensor_harvest(),
  'buy-sensor-day': () => m.catalog_sensor_day(),
  'buy-water-system': () => m.catalog_water_system(),
  'buy-vehicle-detector': () => m.catalog_vehicle_detector(),
  'buy-traffic-light': () => m.catalog_traffic_light(),
  'buy-furnace': () =>
    m.catalog_sku_buy_furnace({ need: FURNACE_NEED, seconds: FURNACE_SECONDS, ash: FURNACE_ASH, cap: FURNACE_CAP }),
  'buy-axe': () => m.catalog_axe(AXES.axe),
  'buy-research-station': () =>
    m.catalog_sku_buy_research_station({
      need: STATION_IN,
      seconds: STATION_SECONDS,
      min: STATION_GRAFT_MIN,
      max: STATION_GRAFT_MAX,
    }),
}

export function skuDesc(id: SkuId): string {
  return SKU_DESC[id]()
}

export function itemTip(item: Item): string {
  return itemLine(item, [])
}

export function makeShovel(id: ShovelId): Item {
  const d = SHOVELS[id]
  return { kind: 'shovel', id, usesLeft: d.uses, workSeconds: d.workSeconds }
}

export function makePickaxe(id: PickaxeId): Item {
  const d = PICKAXES[id]
  return { kind: 'pickaxe', id, usesLeft: d.uses, workSeconds: d.workSeconds }
}

export function makeAxe(): Item {
  return { kind: 'axe', usesLeft: AXES.axe.uses, workSeconds: AXES.axe.workSeconds }
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

export function makeSugar(liters: number, capacityLiters: number, unitSale: number, quality = 0): Item {
  return { kind: 'sugar', liters, capacityLiters, unitSale, quality }
}

export function skuItem(id: SkuId): Face {
  switch (id) {
    case 'pack-carrot':
      return { kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 5 }
    case 'pack-potato':
      return { kind: 'seeds', crop: 'potato', variety: 'base', quality: 0, count: 5 }
    case 'pack-wheat':
      return { kind: 'seeds', crop: 'wheat', variety: 'base', quality: 0, count: 5 }
    case 'pack-tomato':
      return { kind: 'seeds', crop: 'tomato', variety: 'base', quality: 0, count: 5 }
    case 'pack-raspberry':
      return { kind: 'seeds', crop: 'raspberry', variety: 'base', quality: 0, count: 5 }
    case 'pack-grape':
      return { kind: 'seeds', crop: 'grape', variety: 'base', quality: 0, count: 5 }
    case 'pack-sugar-cane':
      return { kind: 'seeds', crop: 'sugar-cane', variety: 'base', quality: 0, count: 5 }
    case 'buy-shovel':
      return makeShovel('shovel')
    case 'buy-better-shovel':
      return makeShovel('better-shovel')
    case 'buy-pickaxe':
      return makePickaxe('pickaxe')
    case 'buy-better-pickaxe':
      return makePickaxe('better-pickaxe')
    case 'buy-axe':
      return makeAxe()
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
    case 'buy-furnace':
      return { kind: 'furnace' }
    case 'buy-research-station':
      return { kind: 'station' }
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
  variety: VarietyId,
  quality: number,
  count: number,
  unitSale: number,
  freshness: number,
  bio: boolean,
  cut: boolean,
): FruitStack {
  return { crop, variety, quality, count, unitSale, freshness, bio, cut }
}

export function mergeQuality(
  a: { quality: number; count: number },
  b: { quality: number; count: number },
): number {
  return (a.quality * a.count + b.quality * b.count) / (a.count + b.count)
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
    const o = b as Extract<Countable, { crop: CropId | AnnualId; variety: VarietyId }>
    return a.crop === o.crop && a.variety === o.variety
  }
  if (a.kind === 'spirit') return a.spirit === (b as typeof a).spirit && a.variety === (b as typeof a).variety
  if (a.kind === 'cask') return a.cask === (b as typeof a).cask && a.variety === (b as typeof a).variety
  if (a.kind === 'jam') return a.crop === (b as typeof a).crop && a.variety === (b as typeof a).variety
  if (a.kind === 'graft') return a.crop === (b as typeof a).crop && a.variety === (b as typeof a).variety
  if (a.kind === 'rotten' || a.kind === 'dead') return a.cls === (b as typeof a).cls
  return true
}

export function mergeInto(a: Countable, b: Countable, n: number): void {
  if (a.kind === 'fruit' && b.kind === 'fruit') {
    const part = { ...b, count: n }
    a.unitSale = mergeUnitSale(a, part)
    a.freshness = mergeFreshness(a, part)
    a.quality = mergeQuality(a, part)
    a.bio = a.bio && b.bio
    a.cut = a.cut || b.cut
  } else if ('unitSale' in a && 'unitSale' in b) {
    a.unitSale = mergeUnitSale(a, { ...b, count: n })
    if ('quality' in a && 'quality' in b) a.quality = mergeQuality(a, { ...b, count: n })
  } else if ('quality' in a && 'quality' in b) {
    a.quality = mergeQuality(a, { ...b, count: n })
  }
  a.count += n
}
