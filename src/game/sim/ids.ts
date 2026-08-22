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

export type StallGoodId = Exclude<CropId, 'sugar-cane'> | 'sugar'

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
  | 'unlock-landscaping'
  | 'unlock-rotary-shovel'
  | 'unlock-diamond-pickaxe'

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
