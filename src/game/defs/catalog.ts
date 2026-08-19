import { BERRY_SALE } from './rarity.ts'
import { CROPS } from './crops.ts'
import {
  BOX_LARGE,
  BOX_SMALL,
  CONTAINERS,
  GRIND_MAX,
  GRIND_MIN,
  GRIND_WORK,
  PICKAXES,
  SHOVELS,
  SHRUB_GROW,
} from './items.ts'
import type { CropId } from '../sim/ids.ts'
import type { Face } from '../sim/item.ts'

export type CatalogEntry = {
  id: string
  title: string
  icon: Face
  blurb: string
}

const SHOVEL_T = 'Digs grass and hard soil, and uproots plants and shrubs. ${uses} uses, ${workSeconds}s per dig.'
const BETTER_SHOVEL_T = 'Same jobs, faster and longer lasting. ${uses} uses, ${workSeconds}s per dig.'
const PICKAXE_T = 'Breaks rocks and very hard soil. ${uses} uses, ${workSeconds}s per mine.'
const BETTER_PICKAXE_T = 'Same jobs, faster and longer lasting. ${uses} uses, ${workSeconds}s per mine.'
const BUCKET_T = 'Holds ${n} L. Fill at a pump or well. 1 L fills one plot.'
const BOX_T = 'Allows you to gather up to ${cap} of the same fruits at the same time. Also holds seeds or berries of one kind.'
const BERRY_T = 'Wild berry. Sells for ${sale} times the rarity multiplier.'
const SHRUB_T = 'Berry shrub. Matures in ${growSeconds}s, then berries. Shovel to move.'
const PUMP_T = 'Place a 2 L/s pump on two tiles. Fill a bucket here. Pipe its edges to feed sprinklers.'
const CHEST_T = '9 slots. Walk up and store any item.'
const GRIND_T = 'One fruit becomes ${min}–${max} seeds of the same crop and rarity. ${workSeconds}s per fruit.'
const PIPE_T = 'Pipe. 4 per edge. Hidden unless the Pipes lens or a pipe tool is out.'
const SPRINKLER_T = 'Waters a 2×2 around a corner. 0.5 L/s when piped to a source.'
const SPRINKLER_VERT_T = 'Waters a 4×2 strip. Rotate while placing to flip NS/EW. 0.5 L/s when piped.'
const SPRINKLER_LARGE_T = 'Waters a 4×4 around a corner. 0.5 L/s when piped to a source.'
const WELL_T = 'Place a 5 L/s well on one tile. Fill a bucket here. Pipe its edges to feed sprinklers.'

export function fill(template: string, vars: { readonly [key: string]: string | number }): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
    if (!Object.hasOwn(vars, key)) throw new Error(key)
    return String(vars[key])
  })
}

function cropTitle(id: CropId): string {
  return id.slice(0, 1).toUpperCase() + id.slice(1)
}

export function catalogEntries(): CatalogEntry[] {
  const crops: CatalogEntry[] = (Object.keys(CROPS) as CropId[]).map(id => {
    const d = CROPS[id]
    const name = cropTitle(id)
    return {
      id,
      title: name,
      icon: { kind: 'fruit', crop: id, rarity: 'common', count: 1, unitSale: d.sale },
      blurb: '',
    }
  })
  return [
    ...crops,
    {
      id: 'shovel',
      title: 'Shovel',
      icon: {
        kind: 'shovel',
        id: 'shovel',
        usesLeft: SHOVELS.shovel.uses,
        workSeconds: SHOVELS.shovel.workSeconds,
      },
      blurb: fill(SHOVEL_T, SHOVELS.shovel),
    },
    {
      id: 'better-shovel',
      title: 'Better shovel',
      icon: {
        kind: 'shovel',
        id: 'better-shovel',
        usesLeft: SHOVELS['better-shovel'].uses,
        workSeconds: SHOVELS['better-shovel'].workSeconds,
      },
      blurb: fill(BETTER_SHOVEL_T, SHOVELS['better-shovel']),
    },
    {
      id: 'pickaxe',
      title: 'Pickaxe',
      icon: {
        kind: 'pickaxe',
        id: 'pickaxe',
        usesLeft: PICKAXES.pickaxe.uses,
        workSeconds: PICKAXES.pickaxe.workSeconds,
      },
      blurb: fill(PICKAXE_T, PICKAXES.pickaxe),
    },
    {
      id: 'better-pickaxe',
      title: 'Hardened pickaxe',
      icon: {
        kind: 'pickaxe',
        id: 'better-pickaxe',
        usesLeft: PICKAXES['better-pickaxe'].uses,
        workSeconds: PICKAXES['better-pickaxe'].workSeconds,
      },
      blurb: fill(BETTER_PICKAXE_T, PICKAXES['better-pickaxe']),
    },
    {
      id: 'bucket',
      title: 'Bucket',
      icon: {
        kind: 'container',
        id: 'bucket',
        liters: CONTAINERS.bucket.capacityLiters,
        capacityLiters: CONTAINERS.bucket.capacityLiters,
      },
      blurb: fill(BUCKET_T, { n: CONTAINERS.bucket.capacityLiters }),
    },
    {
      id: 'large-bucket',
      title: 'Large bucket',
      icon: {
        kind: 'container',
        id: 'large-bucket',
        liters: CONTAINERS['large-bucket'].capacityLiters,
        capacityLiters: CONTAINERS['large-bucket'].capacityLiters,
      },
      blurb: fill(BUCKET_T, { n: CONTAINERS['large-bucket'].capacityLiters }),
    },
    {
      id: 'box',
      title: 'Fruit box',
      icon: { kind: 'box', cap: BOX_SMALL, cargo: { kind: 'empty' } },
      blurb: fill(BOX_T, { cap: BOX_SMALL }),
    },
    {
      id: 'box-large',
      title: 'Large fruit box',
      icon: { kind: 'box', cap: BOX_LARGE, cargo: { kind: 'empty' } },
      blurb: fill(BOX_T, { cap: BOX_LARGE }),
    },
    {
      id: 'berry',
      title: 'Wild berry',
      icon: { kind: 'berry', rarity: 'common', count: 1 },
      blurb: fill(BERRY_T, { sale: BERRY_SALE }),
    },
    {
      id: 'shrub',
      title: 'Berry shrub',
      icon: { kind: 'shrub' },
      blurb: fill(SHRUB_T, { growSeconds: SHRUB_GROW }),
    },
    {
      id: 'pumpjack',
      title: 'Pump',
      icon: { kind: 'pumpjack' },
      blurb: PUMP_T,
    },
    {
      id: 'chest',
      title: 'Chest',
      icon: { kind: 'chest' },
      blurb: CHEST_T,
    },
    {
      id: 'grinder',
      title: 'Seed grinder',
      icon: { kind: 'grinder' },
      blurb: fill(GRIND_T, { min: GRIND_MIN, max: GRIND_MAX, workSeconds: GRIND_WORK }),
    },
    {
      id: 'pipe',
      title: 'Pipe',
      icon: { kind: 'pipe' },
      blurb: PIPE_T,
    },
    {
      id: 'sprinkler',
      title: 'Sprinkler',
      icon: { kind: 'sprinkler' },
      blurb: SPRINKLER_T,
    },
    {
      id: 'sprinkler-vert',
      title: 'Vertical sprinkler',
      icon: { kind: 'sprinkler-vert' },
      blurb: SPRINKLER_VERT_T,
    },
    {
      id: 'sprinkler-large',
      title: 'Large sprinkler',
      icon: { kind: 'sprinkler-large' },
      blurb: SPRINKLER_LARGE_T,
    },
    {
      id: 'well',
      title: 'Well',
      icon: { kind: 'well' },
      blurb: WELL_T,
    },
  ]
}
