import { BERRY_SALE } from './rarity.ts'
import { CROPS } from './crops.ts'
import {
  BOX_LARGE,
  BOX_SMALL,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_SECONDS,
  CONTAINERS,
  FERT_BAG_LITERS,
  GRIND_MAX,
  GRIND_MIN,
  GRIND_WORK,
  PICKAXES,
  SHOVELS,
  SHRUB_GROW,
  SPRINKLER_TILE_DAY,
  SYNTH_BAG_LITERS,
  COMPOST_VALUE,
} from './items.ts'
import { SOURCE, TAP_RATE } from '../sim/water.ts'
import { BIO_RESTORE, SOIL_WATER_MAX, SOIL_WATER_MID, WEED_GROW } from '../sim/soil.ts'
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
const FERT_T =
  'Holds ${n} L. Tops a plot back up to full fertilizer, spending only what the soil is missing. Empty bags are thrown away.'
const SYNTH_T =
  'Holds ${n} L and tops a plot to full like the ordinary bag, but the soil turns non-organic and so does everything grown in it. Ordinary fertilizer or compost brings it back once ${restore} L land at once.'
const COMPOST_BOX_T =
  'Drop any organic waste in. ${need} units become ${liters} L of compost in ${seconds}s, left on the ground beside the box. Seeds ${seeds}, fruit ${fruit}, specialty fruit ${heirloom}, rotten fruit ${rotten}, dead plants and weeds ${dead}.'
const COMPOST_T = 'Holds ${liters} L. Feeds soil exactly like fertilizer, and it is organic.'
const WEED_T =
  'Takes over tilled soil left without seed. Full grown in ${seconds}s and drinks water and fertilizer the whole time. Dig it out with a shovel.'
const ROTTEN_T =
  'What is left when a plant drowns or a ripe crop is never picked. Worth nothing at market, worth ${n} units in the compost box.'
const DEAD_T =
  'What is left when a plant dries out or starves. Worth nothing at market, worth ${n} unit in the compost box.'
const GRASS_T = 'Cut from untilled ground. Worth ${n} unit in the compost box.'
const SOIL_T =
  'Tilled soil holds water and fertilizer, and keeps them through planting, harvest and death. Water reads 0 to ${max} L; plants want ${mid} L and drown above it. Fertilizer runs from 0 to 1 and a growing plant empties a full plot in three days.'
const BERRY_T = 'Wild berry. Sells for ${sale} times the rarity multiplier.'
const SHRUB_T = 'Berry shrub. Matures in ${growSeconds}s, then berries. Shovel to move.'
const PUMP_T =
  'Two tiles. Makes ${rate} L/s into a ${cap} L tank. Fill a bucket here, or touch any corner with pipe to feed the grid.'
const CHEST_T = '9 slots. Walk up and store any item.'
const GRIND_T = 'One fruit becomes ${min}–${max} seeds of the same crop and rarity. ${workSeconds}s per fruit.'
const PIPE_T = 'Pipe. 4 per edge. Hidden unless the Pipes lens or a pipe tool is out.'
const SPRINKLER_T =
  'Waters a 2×2 around a corner, ${day} L a day per tile. Smart sprinklers research lets you dial it down to the exact thirst of one crop.'
const SPRINKLER_VERT_T = 'Waters a 4×2 strip, ${day} L a day per tile. Rotate while placing to flip NS/EW.'
const SPRINKLER_LARGE_T = 'Waters a 4×4 around a corner, ${day} L a day per tile.'
const WELL_T =
  'One tile. Makes ${rate} L/s into a ${cap} L tank. Fill a bucket here, or touch any corner with pipe to feed the grid.'
const VALVE_T =
  'Sits on an edge like pipe. Click it to send the gardener over and turn the flow off or on. Water still reaches a sprinkler by any other open route.'
const RAIN_TANK_T = 'Two tiles. Gathers ${rate} L/s into a ${cap} L tank with no pump and no pipe run to a source.'
const TAP_T =
  'One tile on the grid. Fills a bucket at ${rate} L/s while the tanks hold water, and only as fast as the sources make it once they run dry.'

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
      icon: { kind: 'fruit', crop: id, rarity: 'common', count: 1, unitSale: d.sale, freshness: 1, bio: true },
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
      id: 'fertilizer',
      title: 'Fertilizer bag',
      icon: { kind: 'fertilizer', liters: FERT_BAG_LITERS, capacityLiters: FERT_BAG_LITERS },
      blurb: fill(FERT_T, { n: FERT_BAG_LITERS }),
    },
    {
      id: 'synth-fertilizer',
      title: 'Synthetic fertilizer',
      icon: { kind: 'synth', liters: SYNTH_BAG_LITERS, capacityLiters: SYNTH_BAG_LITERS },
      blurb: fill(SYNTH_T, { n: SYNTH_BAG_LITERS, restore: BIO_RESTORE }),
    },
    {
      id: 'compost',
      title: 'Compost',
      icon: { kind: 'compost', liters: COMPOST_LITERS, capacityLiters: COMPOST_LITERS },
      blurb: fill(COMPOST_T, { liters: COMPOST_LITERS }),
    },
    {
      id: 'compost-box',
      title: 'Compost box',
      icon: { kind: 'compost-box' },
      blurb: fill(COMPOST_BOX_T, {
        need: COMPOST_NEED,
        liters: COMPOST_LITERS,
        seconds: COMPOST_SECONDS,
        seeds: COMPOST_VALUE.seeds,
        fruit: COMPOST_VALUE.fruit,
        heirloom: COMPOST_VALUE.heirloom,
        rotten: COMPOST_VALUE.rotten,
        dead: COMPOST_VALUE.dead,
      }),
    },
    {
      id: 'soil',
      title: 'Tilled soil',
      icon: { kind: 'shovel', id: 'shovel', usesLeft: SHOVELS.shovel.uses, workSeconds: SHOVELS.shovel.workSeconds },
      blurb: fill(SOIL_T, { max: SOIL_WATER_MAX, mid: SOIL_WATER_MID }),
    },
    {
      id: 'weed',
      title: 'Weed',
      icon: { kind: 'weed', count: 1 },
      blurb: fill(WEED_T, { seconds: WEED_GROW }),
    },
    {
      id: 'rotten',
      title: 'Rotten produce',
      icon: { kind: 'rotten', cls: 'fruit', count: 1 },
      blurb: fill(ROTTEN_T, { n: COMPOST_VALUE.rotten }),
    },
    {
      id: 'dead',
      title: 'Dead plant',
      icon: { kind: 'dead', cls: 'fruit', count: 1 },
      blurb: fill(DEAD_T, { n: COMPOST_VALUE.dead }),
    },
    {
      id: 'grass',
      title: 'Cut grass',
      icon: { kind: 'grass', count: 1 },
      blurb: fill(GRASS_T, { n: COMPOST_VALUE.grass }),
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
      blurb: fill(PUMP_T, { rate: SOURCE.pump.rate, cap: SOURCE.pump.capacity }),
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
      blurb: fill(SPRINKLER_T, { day: SPRINKLER_TILE_DAY }),
    },
    {
      id: 'sprinkler-vert',
      title: 'Vertical sprinkler',
      icon: { kind: 'sprinkler-vert' },
      blurb: fill(SPRINKLER_VERT_T, { day: SPRINKLER_TILE_DAY }),
    },
    {
      id: 'sprinkler-large',
      title: 'Large sprinkler',
      icon: { kind: 'sprinkler-large' },
      blurb: fill(SPRINKLER_LARGE_T, { day: SPRINKLER_TILE_DAY }),
    },
    {
      id: 'well',
      title: 'Well',
      icon: { kind: 'well' },
      blurb: fill(WELL_T, { rate: SOURCE.well.rate, cap: SOURCE.well.capacity }),
    },
    {
      id: 'valve',
      title: 'Manual valve',
      icon: { kind: 'valve' },
      blurb: VALVE_T,
    },
    {
      id: 'rain-tank',
      title: 'Rainwater tank',
      icon: { kind: 'rain-tank' },
      blurb: fill(RAIN_TANK_T, { rate: SOURCE['rain-tank'].rate, cap: SOURCE['rain-tank'].capacity }),
    },
    {
      id: 'tap',
      title: 'Tap',
      icon: { kind: 'tap' },
      blurb: fill(TAP_T, { rate: TAP_RATE }),
    },
  ]
}
