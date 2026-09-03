
import { CROPS } from './crops.ts'
import {
  GRASS_GROW,
  GRASS_PACK,
  GRASS_WATER_PER_SEC,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_SECONDS,
  CONTAINERS,
  FERT_BAG_LITERS,
  WEED_SPRAY_BAG,
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
  FREEZER_ROT_MUL,
  MILL_IN,
  MILL_VANILLA_IN,
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
  'Gathers ${rate} L/s into a ${cap} L tank. Fill a bucket straight from it, or run pipe out of any of its corners to feed taps and sprinklers. Everything it pumps is charged at the end of the day.'
const CHEST_T = '9 slots. Walk up and store any item.'
const GRIND_T = 'Hopper. One fruit becomes ${min}–${max} seeds of the same crop and rarity. ${workSeconds}s per fruit.'
const PIPE_T = 'Lies on the edge between two tiles and carries water from a source to your taps and sprinklers. Drag while placing to lay a whole run at once. Any pipe touching a source at a corner is fed by it.'
const SPRINKLER_T =
  'Waters a 2×2 area of plots, ${day} L a day each. It pours only on plots with something growing, and only while pipe connects it to a source that still holds water.'
const SPRINKLER_VERT_T = 'Waters a 4×2 strip, ${day} L a day per plot. Rotate it while placing to lay the strip north-south or east-west.'
const SPRINKLER_LARGE_T = 'Waters a 4×4 area, ${day} L a day per plot.'
const WELL_T =
  'Gathers ${rate} L/s into a ${cap} L tank, and what you draw from it costs nothing. Fill a bucket straight from it, or run pipe out of any of its corners to feed taps and sprinklers. A drought slows it.'
const VALVE_T =
  'Sits on one pipe, and lays that pipe too if the edge is bare. Click it and the gardener walks over to shut that pipe off, or open it again. Water still reaches a sprinkler by any other open route.'
const RAIN_TANK_T = 'Gathers ${rate} L/s into a ${cap} L tank on its own, and many times that while it rains. It fills wherever it stands, with no pump and no pipe to a source.'
const TAP_T =
  'Fills a bucket at ${rate} L/s, as long as pipe connects it to a source. Put one next to your tilled soil and you stop walking back to the pump. Once the tanks run dry it fills only as fast as your sources make water.'

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
      icon: { kind: 'weed-spray', liters: WEED_SPRAY_BAG, capacityLiters: WEED_SPRAY_BAG },
      blurb: fill('Holds ${n} L. Click tilled soil to starve weeds there.', { n: WEED_SPRAY_BAG }),
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
      title: 'Valve',
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
      blurb: fill('Hopper mill. ${in} cane, olive or wheat, or ${vanilla} vanilla crush in ${work}s.', {
        in: MILL_IN,
        vanilla: MILL_VANILLA_IN,
        work: MILL_WORK,
      }),
    },
    {
      id: 'still',
      title: 'Pot still',
      icon: { kind: 'still' },
      blurb: fill('Distills ${cap} potato, wheat or apricot in ${seconds}s.', { cap: STILL_CAP, seconds: STILL_SECONDS }),
    },
    {
      id: 'barrel',
      title: 'Barrel',
      icon: { kind: 'barrel' },
      blurb: 'Grapes or apples, never mixed. Five grapes or four apples fill a barrel. Wine or cider, not whisky.',
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
        'Small ${n} slots, large ${m} slots. Fruit in here rots ${pct}% slower. The large one is a contract prize, never sold.',
        { n: FREEZER_SLOTS, m: FREEZER_LARGE_SLOTS, pct: (1 - FREEZER_ROT_MUL) * 100 },
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
      id: 'lever',
      title: 'Lever',
      icon: { kind: 'lever' },
      blurb: 'A switch you flip by hand to send a signal down its wire, and flip again to stop it. Wire it to a valve or a sprinkler and you control water without walking there. An incoming signal flips it too.',
    },
    {
      id: 'button',
      title: 'Button',
      icon: { kind: 'button' },
      blurb: 'Press it to send one short signal that stops on its own.',
    },
    {
      id: 'lamp',
      title: 'Lamp',
      icon: { kind: 'lamp' },
      blurb: 'Lights up while the wire feeding it is on. It does nothing else: it is there to show you what your wiring is doing.',
    },
    {
      id: 'or',
      title: 'OR gate',
      icon: { kind: 'or' },
      blurb: 'Turns on when either of its two inputs is on.',
    },
    {
      id: 'and',
      title: 'AND gate',
      icon: { kind: 'and' },
      blurb: 'Turns on only while both of its inputs are on.',
    },
    {
      id: 'not',
      title: 'NOT gate',
      icon: { kind: 'not' },
      blurb: 'Turns on while its input is off, and off while it is on.',
    },
    {
      id: 'pulser',
      title: 'Pulser',
      icon: { kind: 'pulser' },
      blurb: 'Sends a single signal the moment its input turns on, then stays quiet until that input goes off and comes back. It turns a signal that stays on into a single one.',
    },
    {
      id: 'counter',
      title: 'Counter',
      icon: { kind: 'counter' },
      blurb: 'Counts up while its input is on. Set a number to stop at: on reaching that count it sends one signal and starts again from zero, so something runs at intervals instead of constantly.',
    },
    {
      id: 'sensor-water',
      title: 'Water sensor',
      icon: { kind: 'sensor-water' },
      blurb: 'Watches the plots around it and turns on when a plant is too dry or too wet — tick which of the two you care about. Wire it to a sprinkler and the field waters itself.',
    },
    {
      id: 'sensor-fert',
      title: 'Fertilizer sensor',
      icon: { kind: 'sensor-fert' },
      blurb: 'Watches the growing plants around it and turns on as soon as one is starving for fertilizer.',
    },
    {
      id: 'sensor-harvest',
      title: 'Harvest sensor',
      icon: { kind: 'sensor-harvest' },
      blurb: 'Watches the crops around it and turns on when they are ready to pick. Set Any for the first ripe plant, or All to wait until the whole patch is ripe.',
    },
    {
      id: 'sensor-day',
      title: 'Day sensor',
      icon: { kind: 'sensor-day' },
      blurb: 'Turns on during the parts of the day you tick: sunrise, day, sunset, twilight.',
    },
    {
      id: 'water-system',
      title: 'Water-system sensor',
      icon: { kind: 'water-system' },
      blurb: 'Joins your water network like a tap, and turns on when the sprinklers want more water than the tanks hold. Wire it to a valve to shut part of the field off before the whole network runs dry.',
    },
    {
      id: 'vehicle-detector',
      title: 'Vehicle detector',
      icon: { kind: 'vehicle-detector' },
      blurb: 'A floor plate you drive over. Turns on while a Quad or tractor stands on it, so an arriving vehicle can set something off.',
    },
    {
      id: 'traffic-light',
      title: 'Traffic light',
      icon: { kind: 'traffic-light' },
      blurb: 'Stops a vehicle on its route while its input is off, and lets it go when the input turns on. It sends a signal of its own while a vehicle is waiting, so one vehicle can wait for another to finish.',
    },
  ]
}
