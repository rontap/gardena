import { m } from '../../paraglide/messages.js'
import type { SkuId } from '../sim/ids.ts'

export type ShelfId = 'tools' | 'water' | 'automation' | 'storage' | 'logic' | 'land'

export type Group = { label: string; skus: SkuId[] }

export type Shelf = {
  id: ShelfId
  label: () => string
  line: () => string
  cluster: 'build' | 'none'
  groups: Group[]
}

export const SHELVES: readonly Shelf[] = [
  {
    id: 'tools',
    label: () => m.hud_shelf_tools(),
    line: () => m.hud_shelf_tools_line(),
    cluster: 'none',
    groups: [
      { label: 'Digging', skus: ['buy-shovel', 'buy-better-shovel'] },
      { label: 'Mining', skus: ['buy-pickaxe', 'buy-better-pickaxe', 'buy-axe', 'buy-chainsaw'] },
      { label: 'Carry', skus: ['buy-bucket', 'buy-bucket-large'] },
    ],
  },
  {
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
    id: 'automation',
    label: () => m.hud_shelf_automation(),
    line: () => m.hud_shelf_automation_line(),
    cluster: 'build',
    groups: [
      { label: 'Grinding', skus: ['buy-grinder', 'buy-mill'] },
      { label: 'Brewing', skus: ['buy-still', 'buy-barrel'] },
      { label: 'Preserving', skus: ['buy-jam'] },
      { label: 'Infusing', skus: ['buy-infuser'] },
      { label: 'Compost', skus: ['buy-compost-box', 'buy-furnace'] },
      { label: 'Grafting', skus: ['buy-research-station'] },
      { label: 'Hangar', skus: ['buy-hangar'] },
    ],
  },
  {
    id: 'storage',
    label: () => m.hud_shelf_storage(),
    line: () => m.hud_shelf_storage_line(),
    cluster: 'build',
    groups: [
      { label: 'Boxes', skus: ['buy-chest', 'buy-freezer', 'buy-freezer-large'] },
      { label: 'Silos', skus: ['buy-silo-seed', 'buy-silo-spray', 'buy-silo-produce'] },
    ],
  },
  {
    id: 'logic',
    label: () => m.hud_shelf_logic(),
    line: () => m.hud_shelf_logic_line(),
    cluster: 'build',
    groups: [
      {
        label: 'Signal',
        skus: [
          'buy-lever',
          'buy-button',
          'buy-lamp',
          'buy-logic',
          'buy-not',
          'buy-pulser',
          'buy-counter',
          'buy-traffic-light',
        ],
      },
      {
        label: 'Readers',
        skus: [
          'buy-sensor-water',
          'buy-sensor-fert',
          'buy-sensor-harvest',
          'buy-sensor-variety',
          'buy-sensor-weather',
          'buy-vehicle-detector',
          'buy-sensor-day',
        ],
      },
    ],
  },
  {
    id: 'land',
    label: () => m.hud_shelf_land(),
    line: () => m.hud_shelf_land_line(),
    cluster: 'none',
    groups: [
      { label: 'Paving', skus: ['buy-tile-asphalt', 'buy-tile-cobble', 'buy-tile-brick', 'buy-tile-paved'] },
      { label: 'Fencing', skus: ['buy-fence'] },
      { label: 'Ground cover', skus: ['pack-grass'] },
    ],
  },
]

function skusOf(shelves: readonly Shelf[]): SkuId[] {
  return shelves.flatMap(s => s.groups.flatMap(g => g.skus))
}

export const SHELF_SKUS = skusOf(SHELVES)
export const GHOST_SKUS = skusOf(SHELVES.filter(s => s.cluster === 'build'))

const HOME = new Map<SkuId, Shelf>(SHELVES.flatMap(s => s.groups.flatMap(g => g.skus.map(id => [id, s] as const))))

export function shelfOf(id: SkuId): Shelf {
  return HOME.get(id)!
}
