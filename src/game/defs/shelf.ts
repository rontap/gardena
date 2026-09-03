import { m } from '../../paraglide/messages.js'
import type { SkuId } from '../sim/ids.ts'

export type ShopShelfId = 'seeds' | 'tools' | 'supplies'
export type BuildShelfId = 'water' | 'processing' | 'storage' | 'vehicles' | 'logic' | 'land'
export type ShelfId = ShopShelfId | BuildShelfId

export type Group = { label: string; skus: SkuId[] }

export type Shelf =
  | { panel: 'shop'; id: ShopShelfId; label: () => string; line: () => string; groups: Group[] }
  | { panel: 'build'; id: BuildShelfId; label: () => string; line: () => string; cluster: 'build' | 'none'; groups: Group[] }

export const SHELVES: readonly Shelf[] = [
  {
    panel: 'shop',
    id: 'seeds',
    label: () => m.hud_shelf_seeds(),
    line: () => m.hud_shelf_seeds_line(),
    groups: [
      {
        label: 'Crops',
        skus: [
          'pack-carrot',
          'pack-potato',
          'pack-wheat',
          'pack-tomato',
          'pack-grape',
          'pack-raspberry',
          'pack-sugar-cane',
        ],
      },
      { label: 'Ground cover', skus: ['pack-grass'] },
    ],
  },
  {
    panel: 'shop',
    id: 'tools',
    label: () => m.hud_shelf_tools(),
    line: () => m.hud_shelf_tools_line(),
    groups: [
      { label: 'Digging', skus: ['buy-shovel', 'buy-better-shovel'] },
      { label: 'Mining', skus: ['buy-pickaxe', 'buy-better-pickaxe'] },
      { label: 'Carry', skus: ['buy-bucket', 'buy-bucket-large'] },
    ],
  },
  {
    panel: 'shop',
    id: 'supplies',
    label: () => m.hud_shelf_supplies(),
    line: () => m.hud_shelf_supplies_line(),
    groups: [
      { label: 'Feeds', skus: ['buy-fertilizer', 'buy-synth-fertilizer', 'buy-weed-spray'] },
      { label: 'Pantry', skus: ['buy-sugar'] },
    ],
  },
  {
    panel: 'build',
    id: 'water',
    label: () => m.hud_shelf_water(),
    line: () => m.hud_shelf_water_line(),
    cluster: 'build',
    groups: [
      { label: 'Source', skus: ['buy-pumpjack', 'buy-well', 'buy-rain-tank'] },
      { label: 'Flow', skus: ['buy-tap', 'buy-pipe', 'buy-valve'] },
      { label: 'Output', skus: ['buy-sprinkler', 'buy-sprinkler-vert', 'buy-sprinkler-large'] },
    ],
  },
  {
    panel: 'build',
    id: 'processing',
    label: () => m.hud_shelf_processing(),
    line: () => m.hud_shelf_processing_line(),
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
    label: () => m.hud_shelf_storage(),
    line: () => m.hud_shelf_storage_line(),
    cluster: 'build',
    groups: [{ label: 'Boxes', skus: ['buy-chest', 'buy-freezer', 'buy-freezer-large'] }],
  },
  {
    panel: 'build',
    id: 'vehicles',
    label: () => m.hud_shelf_vehicles(),
    line: () => m.hud_shelf_vehicles_line(),
    cluster: 'build',
    groups: [
      { label: 'Hangar', skus: ['buy-hangar'] },
      { label: 'Silos', skus: ['buy-silo-seed', 'buy-silo-spray', 'buy-silo-produce'] },
    ],
  },
  {
    panel: 'build',
    id: 'logic',
    label: () => m.hud_shelf_logic(),
    line: () => m.hud_shelf_logic_line(),
    cluster: 'build',
    groups: [
      {
        label: 'Signal',
        skus: ['buy-lever', 'buy-button', 'buy-lamp', 'buy-or', 'buy-and', 'buy-not', 'buy-pulser', 'buy-counter', 'buy-traffic-light'],
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
    label: () => m.hud_shelf_land(),
    line: () => m.hud_shelf_land_line(),
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
