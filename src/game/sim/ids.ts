import type { VarietyId } from '../defs/varieties.ts'

export type AnnualId =
  | 'carrot'
  | 'potato'
  | 'wheat'
  | 'tomato'
  | 'raspberry'
  | 'grape'
  | 'vanilla'
  | 'chilli'
  | 'sugar-cane'
  | 'grass'

export type PlantCrop = Exclude<AnnualId, 'grass'>

export type TreeId = 'apple' | 'apricot' | 'olive' | 'cherry'

export type CropId = AnnualId | TreeId

export type GrownCrop = Exclude<CropId, 'grass'>

export const ANNUAL_IDS: readonly AnnualId[] = [
  'carrot',
  'potato',
  'wheat',
  'tomato',
  'raspberry',
  'grape',
  'vanilla',
  'chilli',
  'sugar-cane',
  'grass',
]

export const PLANT_CROPS: readonly PlantCrop[] = ANNUAL_IDS.filter((c): c is PlantCrop => c !== 'grass')

export const TREE_IDS: readonly TreeId[] = ['apple', 'apricot', 'olive', 'cherry']

export function isTreeId(id: CropId): id is TreeId {
  return id === 'apple' || id === 'apricot' || id === 'olive' || id === 'cherry'
}

export function isAnnualId(id: CropId): id is AnnualId {
  return ANNUAL_IDS.some(a => a === id)
}

/** Seed pack for an annual, or `undefined` when it has none. Vanilla is contract-only. */
export function packSku(crop: AnnualId): SkuId | undefined {
  return crop === 'vanilla' ? undefined : (`pack-${crop}` as SkuId)
}

export type TileId = 'paved' | 'brick' | 'cobble' | 'asphalt'

export type SpiritKind = 'vodka' | 'beer' | 'brandy' | 'mixed'

export type JamCrop = 'apricot' | 'grape' | 'raspberry' | 'cherry' | 'tomato'

export type StillCrop = 'potato' | 'wheat' | 'apricot'

export type BarrelCrop = 'grape' | 'apple'

export type CaskId = 'wine' | 'cider'

export const BARREL_CROPS: readonly BarrelCrop[] = ['grape', 'apple']

export const CASK_IDS: readonly CaskId[] = ['wine', 'cider']

export const CASK_OF: { readonly [K in BarrelCrop]: CaskId } = { grape: 'wine', apple: 'cider' }

export const CROP_OF_CASK: { readonly [K in CaskId]: BarrelCrop } = { wine: 'grape', cider: 'apple' }

export const SPIRIT_OF: { readonly [K in StillCrop]: Exclude<SpiritKind, 'mixed'> } = {
  potato: 'vodka',
  wheat: 'beer',
  apricot: 'brandy',
}

export const CROP_OF_SPIRIT: { readonly [K in Exclude<SpiritKind, 'mixed'>]: StillCrop } = {
  vodka: 'potato',
  beer: 'wheat',
  brandy: 'apricot',
}

export type MillRecipe = 'sugar-cane' | 'olive' | 'wheat' | 'grass' | 'vanilla' | 'chilli'

export type FurnaceRecipe = 'none' | 'ash' | 'bread'

export type Infusable =
  | { kind: 'jam'; crop: JamCrop; variety: VarietyId }
  | { kind: 'cask'; cask: CaskId; variety: VarietyId }
  | { kind: 'spirit'; spirit: Exclude<SpiritKind, 'mixed'>; variety: VarietyId }
  | { kind: 'spirit'; spirit: 'mixed' }
  | { kind: 'oil' }

export type JamId = `jam-${JamCrop}`

export const SPIRIT_KINDS: readonly SpiritKind[] = ['vodka', 'beer', 'brandy', 'mixed']

export const JAM_CROPS: readonly JamCrop[] = ['apricot', 'grape', 'raspberry', 'cherry', 'tomato']

export const JAM_IDS: readonly JamId[] = JAM_CROPS.map(c => `jam-${c}` as JamId)

export const STILL_CROPS: readonly StillCrop[] = ['potato', 'wheat', 'apricot']

export const MILL_RECIPES: readonly MillRecipe[] = ['sugar-cane', 'olive', 'wheat', 'grass', 'vanilla', 'chilli']

export type StallGoodId = GrownCrop | 'sugar' | SpiritKind | CaskId | JamId | 'oil' | 'flour' | 'extract' | 'bread'

export type ShovelId = 'shovel' | 'better-shovel' | 'rotary-shovel'

export type PickaxeId = 'pickaxe' | 'better-pickaxe' | 'diamond-pickaxe'

export type ContainerId = 'bucket' | 'large-bucket'

export type MemberId = 'player' | 'husband' | 'daughter'

export type SkillId =
  | 'boots'
  | 'tending'
  | 'seed-bank'
  | 'better-wheat'
  | 'better-potato'
  | 'better-tomato'
  | 'better-grape'
  | 'better-raspberry'
  | 'grafting'
  | 'lucky'
  | 'bulk-up'
  | 'driving-classes'
  | 'machinery'
  | 'industrial'
  | 'inherit-land'
  | 'saleswoman'
  | 'jam'
  | 'heirloom'
  | 'specialty'
  | 'broker'

export type ResearchId =
  | 'unlock-multi-crop'
  | 'unlock-better-tools'
  | 'unlock-hardened-tools'
  | 'unlock-advanced-plants'
  | 'unlock-raspberry'
  | 'unlock-crop-variants'
  | 'unlock-heirloom'
  | 'unlock-irrigation'
  | 'unlock-auto-irrigation'
  | 'unlock-adv-irrigation'
  | 'unlock-water-storage'
  | 'unlock-vehicles'
  | 'unlock-dispatch'
  | 'unlock-silos'
  | 'unlock-sensors'
  | 'unlock-advanced-sensors'
  | 'unlock-smart-irrigation'
  | 'unlock-grinder'
  | 'unlock-preservatives'
  | 'unlock-fermentation'
  | 'unlock-infusion'
  | 'unlock-furnace'
  | 'unlock-contracts'
  | 'unlock-landscaping'
  | 'unlock-expand'
  | 'expand-land'
  | 'eminent-domain'
  | 'unlock-weather-station'
  | 'unlock-necronomicon'

export type SkuId =
  | 'pack-carrot'
  | 'pack-potato'
  | 'pack-wheat'
  | 'pack-tomato'
  | 'pack-raspberry'
  | 'pack-grape'
  | 'pack-sugar-cane'
  | 'pack-chilli'
  | 'buy-shovel'
  | 'buy-better-shovel'
  | 'buy-pickaxe'
  | 'buy-better-pickaxe'
  | 'buy-bucket'
  | 'buy-bucket-large'
  | 'buy-fertilizer'
  | 'buy-weed-spray'
  | 'buy-compost-box'
  | 'buy-pumpjack'
  | 'buy-chest'
  | 'buy-grinder'
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'buy-well'
  | 'buy-valve'
  | 'buy-tap'
  | 'buy-tile-paved'
  | 'buy-tile-brick'
  | 'buy-tile-cobble'
  | 'buy-tile-asphalt'
  | 'buy-fence'
  | 'pack-grass'
  | 'buy-mill'
  | 'buy-jam'
  | 'buy-still'
  | 'buy-barrel'
  | 'buy-freezer'
  | 'buy-freezer-large'
  | 'buy-sugar'
  | 'buy-hangar'
  | 'buy-silo-seed'
  | 'buy-silo-spray'
  | 'buy-silo-produce'
  | 'buy-lever'
  | 'buy-button'
  | 'buy-lamp'
  | 'buy-or'
  | 'buy-and'
  | 'buy-logic'
  | 'buy-not'
  | 'buy-pulser'
  | 'buy-counter'
  | 'buy-sensor-water'
  | 'buy-sensor-fert'
  | 'buy-sensor-harvest'
  | 'buy-sensor-day'
  | 'buy-sensor-variety'
  | 'buy-sensor-weather'
  | 'buy-water-system'
  | 'buy-vehicle-detector'
  | 'buy-traffic-light'
  | 'buy-furnace'
  | 'buy-axe'
  | 'buy-chainsaw'
  | 'buy-research-station'
  | 'buy-infuser'
  | 'buy-sorter'
  | 'buy-necronomicon'
  | 'buy-weather-station'

export type PageId = 'crop' | 'early-fruit' | 'ash' | 'gold' | 'agaric' | 'tool' | 'supper'

export type SupperId = 'palinka' | 'wine' | 'bread'

export type Grandma = 'well' | 'ill' | 'care' | 'gone' | 'told'

export const GRANDMA_IDS: readonly Grandma[] = ['well', 'ill', 'care', 'gone', 'told']

export type SensorKind =
  | 'lever'
  | 'button'
  | 'lamp'
  | 'logic'
  | 'not'
  | 'pulser'
  | 'counter'
  | 'sensor-water'
  | 'sensor-fert'
  | 'sensor-harvest'
  | 'sensor-day'
  | 'sensor-variety'
  | 'sensor-weather'
  | 'water-system'
  | 'vehicle-detector'
  | 'traffic-light'

export type Signal = 0 | 1

export const SENSOR_KINDS: readonly SensorKind[] = [
  'lever',
  'button',
  'lamp',
  'logic',
  'not',
  'pulser',
  'counter',
  'sensor-water',
  'sensor-fert',
  'sensor-harvest',
  'sensor-day',
  'sensor-variety',
  'sensor-weather',
  'water-system',
  'vehicle-detector',
  'traffic-light',
]

export const SENSOR_CELL_SKUS: readonly SkuId[] = [
  'buy-lever',
  'buy-button',
  'buy-lamp',
  'buy-logic',
  'buy-not',
  'buy-pulser',
  'buy-counter',
  'buy-sensor-water',
  'buy-sensor-fert',
  'buy-sensor-harvest',
  'buy-sensor-day',
  'buy-sensor-variety',
  'buy-sensor-weather',
  'buy-water-system',
  'buy-vehicle-detector',
  'buy-traffic-light',
]

export const SENSOR_LENS_SKUS: readonly SkuId[] = SENSOR_CELL_SKUS

export const RANGE_SENSOR_SKUS: readonly SkuId[] = [
  'buy-sensor-water',
  'buy-sensor-fert',
  'buy-sensor-harvest',
  'buy-sensor-variety',
  'buy-vehicle-detector',
]

export type VehicleKind = 'quad' | 'tractor'
export type VehicleId = number
export type RouteId = number
export type VehicleSlot = 0 | 1 | 2 | 3 | 4 | 5
export type TrailerKind = 'seed' | 'spray' | 'harvest'
export type TrailerId = number
export type HarvestSlot = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type VfxId =
  | 'sprinkler-spray'
  | 'sprinkler-spray-large'
  | 'sprinkler-spray-vert'
  | 'tend'
  | 'pour'
  | 'brew'
  | 'dust'
  | 'steam'
  | 'dig'
  | 'furnace'
  | 'furnace-smoke'
  | 'graft'
  | 'age'
  | 'grind'
  | 'station'
  | 'exhaust'
  | 'burrow-pop'
