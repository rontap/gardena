export type AnnualId =
  | 'carrot'
  | 'potato'
  | 'wheat'
  | 'tomato'
  | 'raspberry'
  | 'watermelon'
  | 'olive'
  | 'grape'
  | 'vanilla'
  | 'sugar-cane'

export type TreeId = 'apple' | 'apricot' | 'lemon' | 'cherry'

export type CropId = AnnualId | TreeId

export const ANNUAL_IDS: readonly AnnualId[] = [
  'carrot',
  'potato',
  'wheat',
  'tomato',
  'raspberry',
  'watermelon',
  'olive',
  'grape',
  'vanilla',
  'sugar-cane',
]

export const TREE_IDS: readonly TreeId[] = ['apple', 'apricot', 'lemon', 'cherry']

export function isTreeId(id: CropId): id is TreeId {
  return id === 'apple' || id === 'apricot' || id === 'lemon' || id === 'cherry'
}

export function isAnnualId(id: CropId): id is AnnualId {
  return !isTreeId(id)
}

export type TileId = 'paved' | 'brick' | 'cobble'

export type SpiritKind = 'vodka' | 'beer' | 'brandy' | 'mixed'

export type JamCrop = 'apricot' | 'grape' | 'raspberry' | 'apple' | 'cherry' | 'tomato'

export type StillCrop = 'potato' | 'wheat' | 'apricot'

export type MillRecipe = 'sugar-cane' | 'olive' | 'wheat' | 'grass'

export type JamId = `jam-${JamCrop}`

export const SPIRIT_KINDS: readonly SpiritKind[] = ['vodka', 'beer', 'brandy', 'mixed']

export const JAM_CROPS: readonly JamCrop[] = ['apricot', 'grape', 'raspberry', 'apple', 'cherry', 'tomato']

export const JAM_IDS: readonly JamId[] = JAM_CROPS.map(c => `jam-${c}` as JamId)

export type StallGoodId = CropId | 'sugar' | SpiritKind | 'wine' | JamId | 'oil' | 'flour' | 'extract'

export type ShovelId = 'shovel' | 'better-shovel' | 'rotary-shovel'

export type PickaxeId = 'pickaxe' | 'better-pickaxe' | 'diamond-pickaxe'

export type ContainerId = 'bucket' | 'large-bucket'

export type MemberId = 'player' | 'husband' | 'daughter'

export type PlayerSkillId =
  | 'boots'
  | 'machinery'
  | 'tending'
  | 'vanilla-tending'
  | 'seed-bank'
  | 'better-carrot'
  | 'better-potato'
  | 'better-wheat'
  | 'better-tomato'
  | 'better-raspberry'
  | 'better-watermelon'
  | 'better-olive'
  | 'better-grape'
  | 'better-vanilla'
  | 'better-sugar-cane'

export type HusbandSkillId =
  | 'research-speed'
  | 'tool-contracts'
  | 'machine-contracts'
  | 'forecast'
  | 'tax'
  | 'water-study'
  | 'land-study'
  | 'bulk-buying'

export type DaughterSkillId =
  | 'saleswoman'
  | 'heirloom'
  | 'bio'
  | 'industrial'
  | 'open-late'
  | 'open-24'
  | 'jam'
  | 'clearance'

export type SkillId = PlayerSkillId | HusbandSkillId | DaughterSkillId

export type ResearchId =
  | 'unlock-tomato'
  | 'unlock-olive'
  | 'unlock-grape'
  | 'unlock-raspberry'
  | 'unlock-watermelon'
  | 'unlock-heirloom'
  | 'unlock-better-tools'
  | 'unlock-large-box'
  | 'unlock-irrigation'
  | 'unlock-auto-irrigation'
  | 'unlock-adv-irrigation'
  | 'unlock-expand'
  | 'unlock-pickaxe'
  | 'unlock-chest'
  | 'unlock-grinder'
  | 'unlock-fertilizer'
  | 'unlock-compost'
  | 'unlock-smart-sprinkler'
  | 'unlock-fermentation'
  | 'unlock-preservatives'
  | 'unlock-landscaping'
  | 'unlock-rotary-shovel'
  | 'unlock-diamond-pickaxe'
  | 'unlock-vehicles'
  | 'unlock-sensors'
  | 'unlock-smart-irrigation'

export type SkuId =
  | 'pack-carrot'
  | 'pack-potato'
  | 'pack-wheat'
  | 'pack-tomato'
  | 'pack-raspberry'
  | 'pack-watermelon'
  | 'pack-olive'
  | 'pack-grape'
  | 'pack-vanilla'
  | 'pack-sugar-cane'
  | 'buy-shovel'
  | 'buy-better-shovel'
  | 'buy-pickaxe'
  | 'buy-better-pickaxe'
  | 'buy-bucket'
  | 'buy-bucket-large'
  | 'buy-box'
  | 'buy-box-large'
  | 'buy-fertilizer'
  | 'buy-synth-fertilizer'
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
  | 'buy-rain-tank'
  | 'buy-tap'
  | 'buy-tile-paved'
  | 'buy-tile-brick'
  | 'buy-tile-cobble'
  | 'buy-fence'
  | 'pack-grass'
  | 'buy-rotary-shovel'
  | 'buy-diamond-pickaxe'
  | 'buy-mill'
  | 'buy-jam'
  | 'buy-still'
  | 'buy-barrel'
  | 'buy-freezer'
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
  | 'buy-not'
  | 'buy-sensor-water'
  | 'buy-sensor-fert'
  | 'buy-sensor-harvest'
  | 'buy-water-system'
  | 'buy-smart-valve'
  | 'buy-vehicle-detector'

export type SensorKind =
  | 'lever'
  | 'button'
  | 'lamp'
  | 'or'
  | 'and'
  | 'not'
  | 'sensor-water'
  | 'sensor-fert'
  | 'sensor-harvest'
  | 'water-system'
  | 'vehicle-detector'

export type Signal = 0 | 1

export const SENSOR_KINDS: readonly SensorKind[] = [
  'lever',
  'button',
  'lamp',
  'or',
  'and',
  'not',
  'sensor-water',
  'sensor-fert',
  'sensor-harvest',
  'water-system',
  'vehicle-detector',
]

export const SENSOR_CELL_SKUS: readonly SkuId[] = [
  'buy-lever',
  'buy-button',
  'buy-lamp',
  'buy-or',
  'buy-and',
  'buy-not',
  'buy-sensor-water',
  'buy-sensor-fert',
  'buy-sensor-harvest',
  'buy-water-system',
  'buy-vehicle-detector',
]

export const SENSOR_LENS_SKUS: readonly SkuId[] = [...SENSOR_CELL_SKUS, 'buy-smart-valve']

export type VehicleKind = 'quad' | 'tractor'
export type VehicleId = number
export type VehicleSlot = 0 | 1 | 2 | 3 | 4 | 5
export type TrailerKind = 'seed' | 'spray' | 'harvest'
export type TrailerId = number
export type HarvestSlot = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
