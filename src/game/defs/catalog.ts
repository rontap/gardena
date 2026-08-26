
import { CROPS } from './crops.ts'
import {
  BOX_LARGE,
  BOX_SMALL,
  GRASS_GROW,
  GRASS_PACK,
  GRASS_WATER_PER_SEC,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_SECONDS,
  CONTAINERS,
  FERT_BAG_LITERS,
  WEED_SPRAY_USES,
  GRIND_MAX,
  GRIND_MIN,
  GRIND_WORK,
  PICKAXES,
  SHOVELS,

  SPRINKLER_TILE_DAY,
  SUGAR_BAG,
  SUGAR_SHOP,
  SYNTH_BAG_LITERS,
  COMPOST_VALUE,
  FREEZER_LARGE_SLOTS,
  FREEZER_SLOTS,
  MILL_IN,
  MILL_WORK,
  JAM_IN,
  JAM_SECONDS,
  STILL_CAP,
  STILL_SECONDS,
} from './items.ts'
import { SOURCE, TAP_RATE } from '../sim/water.ts'
import { BIO_RESTORE, SOIL_WATER_MAX, SOIL_WATER_MID, WEED_GROW } from '../sim/soil.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import type { CropId, TileId } from '../sim/ids.ts'
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
  'Drop any organic waste in. ${need} units become ${liters} L of compost in ${seconds}s. A chest on the right takes the bag, else it drops beside the box. Seeds ${seeds}, fruit ${fruit}, heirloom fruit ${heirloom}, rotten fruit ${rotten}, dead plants and weeds ${dead}.'
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
const TURF_T =
  'Sold in packs of ${pack}. Sow on tilled soil. Roots in ${seconds}s and drinks only ${drink} L a day, then the plot turns back into untilled lawn.'
const FENCE_T =
  'Stands in the middle of an untilled tile and joins up with any fence beside it. Boundary marker only - the gardener walks straight through.'
const PAVING_T = 'Laid on untilled ground. Keeps the garden walkable and tidy. Dig it up with the delete tool.'

const PUMP_T =
  'Two tiles. Makes ${rate} L/s into a ${cap} L tank. Fill a bucket here, or touch any corner with pipe to feed the grid.'
const CHEST_T = '9 slots. Walk up and store any item.'
const GRIND_T = 'Hopper. One fruit becomes ${min}–${max} seeds of the same crop and rarity. ${workSeconds}s per fruit.'
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

const TILE_TITLE: { readonly [K in TileId]: string } = {
  paved: 'Paving slab',
  brick: 'Brickwork',
  cobble: 'Cobblestone',
}

const ROTARY_T = 'Motorised. Digs anything a shovel digs, near enough instantly. ${uses} uses, ${workSeconds}s per dig.'
const DIAMOND_T = 'Cuts rock like tilled soil. ${uses} uses, ${workSeconds}s per mine.'

function cropTitle(id: CropId): string {
  if (id === 'sugar-cane') return 'Sugar cane'
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
      blurb: d.desc,
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
      id: 'weed-spray',
      title: 'Weed spray',
      icon: { kind: 'weed-spray', usesLeft: WEED_SPRAY_USES },
      blurb: fill('Hand sprayer. ${n} uses. Click tilled soil to starve weeds there.', { n: WEED_SPRAY_USES }),
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
      id: 'grass-seeds',
      title: 'Grass seeds',
      icon: { kind: 'grass-seeds', count: GRASS_PACK },
      blurb: fill(TURF_T, {
        pack: GRASS_PACK,
        seconds: GRASS_GROW,
        drink: Number((GRASS_WATER_PER_SEC * DAY_SECONDS).toFixed(2)),
      }),
    },
    {
      id: 'fence',
      title: 'Wooden fence',
      icon: { kind: 'fence' },
      blurb: FENCE_T,
    },
    ...(['cobble', 'brick', 'paved'] as TileId[]).map(tile => ({
      id: `tile-${tile}`,
      title: TILE_TITLE[tile],
      icon: { kind: 'tile' as const, tile },
      blurb: PAVING_T,
    })),
    {
      id: 'rotary-shovel',
      title: 'Rotary shovel',
      icon: {
        kind: 'shovel' as const,
        id: 'rotary-shovel' as const,
        usesLeft: SHOVELS['rotary-shovel'].uses,
        workSeconds: SHOVELS['rotary-shovel'].workSeconds,
      },
      blurb: fill(ROTARY_T, SHOVELS['rotary-shovel']),
    },
    {
      id: 'diamond-pickaxe',
      title: 'Diamond pickaxe',
      icon: {
        kind: 'pickaxe' as const,
        id: 'diamond-pickaxe' as const,
        usesLeft: PICKAXES['diamond-pickaxe'].uses,
        workSeconds: PICKAXES['diamond-pickaxe'].workSeconds,
      },
      blurb: fill(DIAMOND_T, PICKAXES['diamond-pickaxe']),
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
    {
      id: 'sugar',
      title: 'Sugar',
      icon: { kind: 'sugar', liters: SUGAR_BAG, capacityLiters: SUGAR_BAG, unitSale: SUGAR_SHOP },
      blurb: fill('${bag} L bag. Does not rot. Mill cane is cheaper per litre.', { bag: SUGAR_BAG }),
    },
    {
      id: 'mill',
      title: 'Mill',
      icon: { kind: 'mill' },
      blurb: fill('Hopper mill. ${in} cane, olive or wheat crush in ${work}s.', { in: MILL_IN, work: MILL_WORK }),
    },
    {
      id: 'still',
      title: 'Pot still',
      icon: { kind: 'still' },
      blurb: fill('Distills ${cap} potato, wheat or apricot in ${seconds}s.', { cap: STILL_CAP, seconds: STILL_SECONDS }),
    },
    {
      id: 'barrel',
      title: 'Wine barrel',
      icon: { kind: 'barrel' },
      blurb: 'Grapes only. Five fill a barrel. Wine, not whisky.',
    },
    {
      id: 'jam',
      title: 'Jam machine',
      icon: { kind: 'jam-machine' },
      blurb: fill('${fruit} fruit plus sugar cook in ${seconds}s. Tomato is ketchup.', { fruit: JAM_IN, seconds: JAM_SECONDS }),
    },
    {
      id: 'freezer',
      title: 'Freezer',
      icon: { kind: 'freezer', slots: FREEZER_SLOTS },
      blurb: fill(
        'Small ${n} slots, large ${m} slots. Fruit in here does not rot. The large one is a contract prize, never sold.',
        { n: FREEZER_SLOTS, m: FREEZER_LARGE_SLOTS },
      ),
    },
    {
      id: 'hangar',
      title: 'Vehicle hangar',
      icon: { kind: 'hangar' },
      blurb: '3×2 industrial shed. Buy Quads and tractors at a hangar.',
    },
    {
      id: 'silo-seed',
      title: 'Seeding silo',
      icon: { kind: 'silo-seed' },
      blurb: '2×3 field tank. Look only.',
    },
    {
      id: 'silo-spray',
      title: 'Spraying silo',
      icon: { kind: 'silo-spray' },
      blurb: '2×3 field tank. Look only.',
    },
    {
      id: 'silo-produce',
      title: 'Produce silo',
      icon: { kind: 'silo-produce' },
      blurb: '2×3 field tank. Look only.',
    },
    {
      id: 'smart-valve',
      title: 'Smart valve',
      icon: { kind: 'smart-valve' },
      blurb: 'Sits on an edge. Closed unless its input is high. No manual click.',
    },
    {
      id: 'lever',
      title: 'Lever',
      icon: { kind: 'lever' },
      blurb: 'Throw it, or a wire turning on throws it. Output high when on.',
    },
    {
      id: 'button',
      title: 'Button',
      icon: { kind: 'button' },
      blurb: 'Press. Output high for a short pulse.',
    },
    {
      id: 'lamp',
      title: 'Lamp',
      icon: { kind: 'lamp' },
      blurb: 'Lights when its input is high.',
    },
    {
      id: 'or',
      title: 'OR gate',
      icon: { kind: 'or' },
      blurb: 'Output high if either input is high.',
    },
    {
      id: 'and',
      title: 'AND gate',
      icon: { kind: 'and' },
      blurb: 'Output high if both inputs are high.',
    },
    {
      id: 'not',
      title: 'NOT gate',
      icon: { kind: 'not' },
      blurb: 'Output is the inverse of its input.',
    },
    {
      id: 'pulser',
      title: 'Pulser',
      icon: { kind: 'pulser' },
      blurb: 'When its input turns on, the output turns on once, then off until the input turns off.',
    },
    {
      id: 'counter',
      title: 'Counter',
      icon: { kind: 'counter' },
      blurb: 'Counts while its input is on. Set a number; when the count reaches it, the output turns on once and the count starts over.',
    },
    {
      id: 'sensor-water',
      title: 'Water sensor',
      icon: { kind: 'sensor-water' },
      blurb: 'Reads nearby plant water. Output high when a plot matches the checked boxes.',
    },
    {
      id: 'sensor-fert',
      title: 'Fertilizer sensor',
      icon: { kind: 'sensor-fert' },
      blurb: 'Reads nearby growing plants. Output high when any is starving.',
    },
    {
      id: 'sensor-harvest',
      title: 'Harvest sensor',
      icon: { kind: 'sensor-harvest' },
      blurb: 'Reads nearby crops. Any: one ripe. All: every growing or ripe plant is ripe.',
    },
    {
      id: 'sensor-day',
      title: 'Day sensor',
      icon: { kind: 'sensor-day' },
      blurb: 'Turns on during the parts of the day you check: sunrise, day, sunset, twilight. Day is checked when you place it.',
    },
    {
      id: 'water-system',
      title: 'Water-system sensor',
      icon: { kind: 'water-system' },
      blurb: 'Joins a water net. Output high when sprinklers on that net want more than the tanks hold.',
    },
    {
      id: 'vehicle-detector',
      title: 'Vehicle detector',
      icon: { kind: 'vehicle-detector' },
      blurb: 'Flush plate. Output high when a field Quad or tractor sits on this tile.',
    },
  ]
}
