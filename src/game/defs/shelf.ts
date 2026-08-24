import type { SkuId } from '../sim/ids.ts'

export type ShopShelfId = 'seeds' | 'tools' | 'supplies'
export type BuildShelfId = 'water' | 'processing' | 'storage' | 'vehicles' | 'logic' | 'land'
export type ShelfId = ShopShelfId | BuildShelfId

export type Group = { label: string; skus: SkuId[] }

export type Shelf =
  | { panel: 'shop'; id: ShopShelfId; label: string; line: string; groups: Group[] }
  | { panel: 'build'; id: BuildShelfId; label: string; line: string; cluster: 'build' | 'none'; groups: Group[] }

export const SHELVES: readonly Shelf[] = [
  {
    panel: 'shop',
    id: 'seeds',
    label: 'Seeds',
    line: 'Sow on tilled soil.',
    groups: [
      {
        label: 'Crops',
        skus: [
          'pack-carrot',
          'pack-potato',
          'pack-wheat',
          'pack-tomato',
          'pack-watermelon',
          'pack-olive',
          'pack-grape',
          'pack-raspberry',
          'pack-vanilla',
          'pack-sugar-cane',
        ],
      },
      { label: 'Ground cover', skus: ['pack-grass'] },
    ],
  },
  {
    panel: 'shop',
    id: 'tools',
    label: 'Tools',
    line: 'Tools and carry.',
    groups: [
      { label: 'Digging', skus: ['buy-shovel', 'buy-better-shovel', 'buy-rotary-shovel'] },
      { label: 'Mining', skus: ['buy-pickaxe', 'buy-better-pickaxe', 'buy-diamond-pickaxe'] },
      { label: 'Carry', skus: ['buy-bucket', 'buy-bucket-large', 'buy-box', 'buy-box-large'] },
    ],
  },
  {
    panel: 'shop',
    id: 'supplies',
    label: 'Supplies',
    line: 'Feeds go to the additive store. Sugar and weed spray to your hands.',
    groups: [
      { label: 'Feeds', skus: ['buy-fertilizer', 'buy-synth-fertilizer', 'buy-weed-spray'] },
      { label: 'Pantry', skus: ['buy-sugar'] },
    ],
  },
  {
    panel: 'build',
    id: 'water',
    label: 'Water',
    line: 'Source, flow, output.',
    cluster: 'build',
    groups: [
      { label: 'Source', skus: ['buy-pumpjack', 'buy-well', 'buy-rain-tank'] },
      { label: 'Flow', skus: ['buy-tap', 'buy-pipe', 'buy-valve', 'buy-smart-valve'] },
      { label: 'Output', skus: ['buy-sprinkler', 'buy-sprinkler-vert', 'buy-sprinkler-large'] },
    ],
  },
  {
    panel: 'build',
    id: 'processing',
    label: 'Processing',
    line: 'Machines that make goods.',
    cluster: 'build',
    groups: [
      { label: 'Grinding', skus: ['buy-grinder', 'buy-mill'] },
      { label: 'Brewing', skus: ['buy-still', 'buy-barrel'] },
      { label: 'Preserving', skus: ['buy-jam'] },
      { label: 'Compost', skus: ['buy-compost-box'] },
    ],
  },
  {
    panel: 'build',
    id: 'storage',
    label: 'Storage',
    line: 'Keep what you picked.',
    cluster: 'build',
    groups: [{ label: 'Boxes', skus: ['buy-chest', 'buy-freezer'] }],
  },
  {
    panel: 'build',
    id: 'vehicles',
    label: 'Vehicles',
    line: 'Hangar and the field silos that load trailers.',
    cluster: 'build',
    groups: [
      { label: 'Hangar', skus: ['buy-hangar'] },
      { label: 'Silos', skus: ['buy-silo-seed', 'buy-silo-spray', 'buy-silo-produce'] },
    ],
  },
  {
    panel: 'build',
    id: 'logic',
    label: 'Sensors',
    line: 'Signal, gates, readers.',
    cluster: 'build',
    groups: [
      {
        label: 'Signal',
        skus: ['buy-lever', 'buy-button', 'buy-lamp', 'buy-or', 'buy-and', 'buy-not', 'buy-pulser', 'buy-counter'],
      },
      {
        label: 'Readers',
        skus: [
          'buy-sensor-water',
          'buy-sensor-fert',
          'buy-sensor-harvest',
          'buy-water-system',
          'buy-vehicle-detector',
          'buy-sensor-day',
        ],
      },
    ],
  },
  {
    panel: 'build',
    id: 'land',
    label: 'Land',
    line: 'Paving and fencing. Click as many tiles as you like, Escape when done.',
    cluster: 'none',
    groups: [
      { label: 'Paving', skus: ['buy-tile-cobble', 'buy-tile-brick', 'buy-tile-paved'] },
      { label: 'Fencing', skus: ['buy-fence'] },
    ],
  },
]

function skusOf(shelves: readonly Shelf[]): SkuId[] {
  return shelves.flatMap(s => s.groups.flatMap(g => g.skus))
}

export const SHOP_SHELVES = SHELVES.filter(s => s.panel === 'shop')
export const BUILD_SHELVES = SHELVES.filter(s => s.panel === 'build')
export const SHOP_SKUS = skusOf(SHOP_SHELVES)
export const BUILD_SKUS = skusOf(BUILD_SHELVES)
export const GHOST_SKUS = skusOf(BUILD_SHELVES.filter(s => s.panel === 'build' && s.cluster === 'build'))

const HOME = new Map<SkuId, Shelf>(SHELVES.flatMap(s => s.groups.flatMap(g => g.skus.map(id => [id, s] as const))))

export function shelfOf(id: SkuId): Shelf {
  return HOME.get(id)!
}
