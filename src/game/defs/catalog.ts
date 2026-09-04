
import { m } from '../../paraglide/messages.js'
import { CROP_NAME, CROPS } from './crops.ts'
import {
  GRASS_GROW,
  GRASS_PACK,
  GRASS_WATER_PER_SEC,
  CHEST_SLOTS,
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
  AXES,
  SHOVELS,
  FURNACE_ASH,
  FURNACE_NEED,
  FURNACE_SECONDS,
  SPRINKLER_TILE_DAY,
  SUGAR_BAG,
  SUGAR_SHOP,
  SYNTH_BAG_LITERS,
  COMPOST_VALUE,
  FREEZER_LARGE_SLOTS,
  FREEZER_SLOTS,
  FREEZER_ROT_MUL,
  HANGAR_H,
  HANGAR_W,
  MILL_IN,
  MILL_VANILLA_IN,
  MILL_WORK,
  JAM_IN,
  JAM_SECONDS,
  SILO_H,
  SILO_W,
  STILL_CAP,
  STILL_SECONDS,
} from './items.ts'
import { SOURCE, TAP_RATE } from '../sim/water.ts'
import { BIO_RESTORE, FERT_PLOT_MAX, SOIL_WATER_MAX, SOIL_WATER_MID, WEED_GROW } from '../sim/soil.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import type { CropId, TileId } from '../sim/ids.ts'
import type { Face } from '../sim/item.ts'

export type CatalogEntry = {
  id: string
  title: string
  icon: Face
  blurb: string
}

const TILE_TITLE: { readonly [K in TileId]: () => string } = {
  paved: () => m.names_tile_paved(),
  brick: () => m.names_tile_brick(),
  cobble: () => m.names_tile_cobble(),
}

const FREEZER_PCT = (1 - FREEZER_ROT_MUL) * 100

export function catalogEntries(): CatalogEntry[] {
  const crops: CatalogEntry[] = (Object.keys(CROPS) as CropId[]).map(id => {
    const d = CROPS[id]
    return {
      id,
      title: CROP_NAME[id](),
      icon: { kind: 'fruit', crop: id, rarity: 'common', count: 1, unitSale: d.sale, freshness: 1, bio: true },
      blurb: d.desc(),
    }
  })
  return [
    ...crops,
    {
      id: 'shovel',
      title: m.names_shovel_shovel(),
      icon: {
        kind: 'shovel',
        id: 'shovel',
        usesLeft: SHOVELS.shovel.uses,
        workSeconds: SHOVELS.shovel.workSeconds,
      },
      blurb: m.catalog_shovel(SHOVELS.shovel),
    },
    {
      id: 'better-shovel',
      title: m.names_shovel_better_shovel(),
      icon: {
        kind: 'shovel',
        id: 'better-shovel',
        usesLeft: SHOVELS['better-shovel'].uses,
        workSeconds: SHOVELS['better-shovel'].workSeconds,
      },
      blurb: m.catalog_better_shovel(SHOVELS['better-shovel']),
    },
    {
      id: 'pickaxe',
      title: m.names_pickaxe_pickaxe(),
      icon: {
        kind: 'pickaxe',
        id: 'pickaxe',
        usesLeft: PICKAXES.pickaxe.uses,
        workSeconds: PICKAXES.pickaxe.workSeconds,
      },
      blurb: m.catalog_pickaxe(PICKAXES.pickaxe),
    },
    {
      id: 'better-pickaxe',
      title: m.names_pickaxe_better_pickaxe(),
      icon: {
        kind: 'pickaxe',
        id: 'better-pickaxe',
        usesLeft: PICKAXES['better-pickaxe'].uses,
        workSeconds: PICKAXES['better-pickaxe'].workSeconds,
      },
      blurb: m.catalog_better_pickaxe(PICKAXES['better-pickaxe']),
    },
    {
      id: 'bucket',
      title: m.names_container_bucket(),
      icon: {
        kind: 'container',
        id: 'bucket',
        liters: CONTAINERS.bucket.capacityLiters,
        capacityLiters: CONTAINERS.bucket.capacityLiters,
      },
      blurb: m.catalog_bucket({ n: CONTAINERS.bucket.capacityLiters, plot: SOIL_WATER_MID }),
    },
    {
      id: 'large-bucket',
      title: m.names_container_large_bucket(),
      icon: {
        kind: 'container',
        id: 'large-bucket',
        liters: CONTAINERS['large-bucket'].capacityLiters,
        capacityLiters: CONTAINERS['large-bucket'].capacityLiters,
      },
      blurb: m.catalog_bucket({ n: CONTAINERS['large-bucket'].capacityLiters, plot: SOIL_WATER_MID }),
    },
    {
      id: 'fertilizer',
      title: m.names_item_fertilizer(),
      icon: { kind: 'fertilizer', liters: FERT_BAG_LITERS, capacityLiters: FERT_BAG_LITERS },
      blurb: m.catalog_fertilizer({ n: FERT_BAG_LITERS }),
    },
    {
      id: 'synth-fertilizer',
      title: m.names_item_synth(),
      icon: { kind: 'synth', liters: SYNTH_BAG_LITERS, capacityLiters: SYNTH_BAG_LITERS },
      blurb: m.catalog_synth({ n: SYNTH_BAG_LITERS, restore: BIO_RESTORE }),
    },
    {
      id: 'weed-spray',
      title: m.names_item_weed_spray(),
      icon: { kind: 'weed-spray', liters: WEED_SPRAY_BAG, capacityLiters: WEED_SPRAY_BAG },
      blurb: m.catalog_weed_spray({ n: WEED_SPRAY_BAG }),
    },
    {
      id: 'compost',
      title: m.names_item_compost(),
      icon: { kind: 'compost', liters: COMPOST_LITERS, capacityLiters: COMPOST_LITERS },
      blurb: m.catalog_compost({ liters: COMPOST_LITERS }),
    },
    {
      id: 'compost-box',
      title: m.names_building_compost_box(),
      icon: { kind: 'compost-box' },
      blurb: m.catalog_compost_box({
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
      title: m.names_ground_tilled(),
      icon: { kind: 'shovel', id: 'shovel', usesLeft: SHOVELS.shovel.uses, workSeconds: SHOVELS.shovel.workSeconds },
      blurb: m.catalog_soil({
        min: 0,
        max: SOIL_WATER_MAX,
        mid: SOIL_WATER_MID,
        fertMin: 0,
        fertMax: FERT_PLOT_MAX,
      }),
    },
    {
      id: 'weed',
      title: m.names_ground_weed(),
      icon: { kind: 'weed', count: 1 },
      blurb: m.catalog_weed({ seconds: WEED_GROW }),
    },
    {
      id: 'rotten',
      title: m.catalog_title_rotten(),
      icon: { kind: 'rotten', cls: 'fruit', count: 1 },
      blurb: m.catalog_rotten({ n: COMPOST_VALUE.rotten }),
    },
    {
      id: 'dead',
      title: m.catalog_title_dead(),
      icon: { kind: 'dead', cls: 'fruit', count: 1 },
      blurb: m.catalog_dead({ n: COMPOST_VALUE.dead }),
    },
    {
      id: 'grass',
      title: m.names_item_cut_grass(),
      icon: { kind: 'grass', count: 1 },
      blurb: m.catalog_grass({ n: COMPOST_VALUE.grass }),
    },

    {
      id: 'grass-seeds',
      title: m.names_sku_pack_grass(),
      icon: { kind: 'grass-seeds', count: GRASS_PACK },
      blurb: m.catalog_grass_seeds({
        pack: GRASS_PACK,
        seconds: GRASS_GROW,
        drink: Number((GRASS_WATER_PER_SEC * DAY_SECONDS).toFixed(2)),
      }),
    },
    {
      id: 'fence',
      title: m.names_building_fence(),
      icon: { kind: 'fence' },
      blurb: m.catalog_fence(),
    },
    ...(['cobble', 'brick', 'paved'] as TileId[]).map(tile => ({
      id: `tile-${tile}`,
      title: TILE_TITLE[tile](),
      icon: { kind: 'tile' as const, tile },
      blurb: m.catalog_paving(),
    })),
    {
      id: 'rotary-shovel',
      title: m.names_shovel_rotary_shovel(),
      icon: {
        kind: 'shovel' as const,
        id: 'rotary-shovel' as const,
        usesLeft: SHOVELS['rotary-shovel'].uses,
        workSeconds: SHOVELS['rotary-shovel'].workSeconds,
      },
      blurb: m.catalog_rotary_shovel(SHOVELS['rotary-shovel']),
    },
    {
      id: 'diamond-pickaxe',
      title: m.names_pickaxe_diamond_pickaxe(),
      icon: {
        kind: 'pickaxe' as const,
        id: 'diamond-pickaxe' as const,
        usesLeft: PICKAXES['diamond-pickaxe'].uses,
        workSeconds: PICKAXES['diamond-pickaxe'].workSeconds,
      },
      blurb: m.catalog_diamond_pickaxe(PICKAXES['diamond-pickaxe']),
    },
    {
      id: 'pumpjack',
      title: m.names_building_pump(),
      icon: { kind: 'pumpjack' },
      blurb: m.catalog_pumpjack({ rate: SOURCE.pump.rate, cap: SOURCE.pump.capacity }),
    },
    {
      id: 'chest',
      title: m.names_building_chest(),
      icon: { kind: 'chest' },
      blurb: m.catalog_chest({ n: CHEST_SLOTS }),
    },
    {
      id: 'grinder',
      title: m.names_building_grinder(),
      icon: { kind: 'grinder' },
      blurb: m.catalog_grinder({ min: GRIND_MIN, max: GRIND_MAX, workSeconds: GRIND_WORK }),
    },
    {
      id: 'pipe',
      title: m.names_building_pipe(),
      icon: { kind: 'pipe' },
      blurb: m.catalog_pipe(),
    },
    {
      id: 'sprinkler',
      title: m.names_building_sprinkler(),
      icon: { kind: 'sprinkler' },
      blurb: m.catalog_sprinkler({ w: 2, h: 2, day: SPRINKLER_TILE_DAY }),
    },
    {
      id: 'sprinkler-vert',
      title: m.names_building_sprinkler_vert(),
      icon: { kind: 'sprinkler-vert' },
      blurb: m.catalog_sprinkler_vert({ w: 4, h: 2, day: SPRINKLER_TILE_DAY }),
    },
    {
      id: 'sprinkler-large',
      title: m.names_building_sprinkler_large(),
      icon: { kind: 'sprinkler-large' },
      blurb: m.catalog_sprinkler_large({ w: 4, h: 4, day: SPRINKLER_TILE_DAY }),
    },
    {
      id: 'well',
      title: m.names_building_well(),
      icon: { kind: 'well' },
      blurb: m.catalog_well({ rate: SOURCE.well.rate, cap: SOURCE.well.capacity }),
    },
    {
      id: 'valve',
      title: m.names_building_valve(),
      icon: { kind: 'valve' },
      blurb: m.catalog_valve(),
    },
    {
      id: 'rain-tank',
      title: m.names_building_rain_tank(),
      icon: { kind: 'rain-tank' },
      blurb: m.catalog_rain_tank({ rate: SOURCE['rain-tank'].rate, cap: SOURCE['rain-tank'].capacity }),
    },
    {
      id: 'tap',
      title: m.names_building_tap(),
      icon: { kind: 'tap' },
      blurb: m.catalog_tap({ rate: TAP_RATE }),
    },
    {
      id: 'sugar',
      title: m.names_item_sugar(),
      icon: { kind: 'sugar', liters: SUGAR_BAG, capacityLiters: SUGAR_BAG, unitSale: SUGAR_SHOP },
      blurb: m.catalog_sugar({ bag: SUGAR_BAG }),
    },
    {
      id: 'mill',
      title: m.names_building_mill(),
      icon: { kind: 'mill' },
      blurb: m.catalog_mill({
        cane: MILL_IN,
        vanilla: MILL_VANILLA_IN,
        work: MILL_WORK,
      }),
    },
    {
      id: 'still',
      title: m.names_building_still(),
      icon: { kind: 'still' },
      blurb: m.catalog_still({ cap: STILL_CAP, seconds: STILL_SECONDS }),
    },
    {
      id: 'furnace',
      title: m.names_building_furnace(),
      icon: { kind: 'furnace' },
      blurb: m.catalog_furnace({ need: FURNACE_NEED, seconds: FURNACE_SECONDS, ash: FURNACE_ASH }),
    },
    {
      id: 'axe',
      title: m.names_item_axe(),
      icon: { kind: 'axe', usesLeft: AXES.axe.uses, workSeconds: AXES.axe.workSeconds },
      blurb: m.catalog_axe(AXES.axe),
    },
    {
      id: 'wood',
      title: m.names_item_wood(),
      icon: { kind: 'wood', count: 1 },
      blurb: m.catalog_wood(),
    },
    {
      id: 'ash',
      title: m.names_item_ash(),
      icon: { kind: 'ash', count: 1 },
      blurb: m.catalog_ash({ n: COMPOST_VALUE.ash }),
    },
    {
      id: 'barrel',
      title: m.names_building_barrel(),
      icon: { kind: 'barrel' },
      blurb: m.catalog_barrel(),
    },
    {
      id: 'jam',
      title: m.names_building_jam(),
      icon: { kind: 'jam-machine' },
      blurb: m.catalog_jam({ fruit: JAM_IN, seconds: JAM_SECONDS }),
    },
    {
      id: 'freezer',
      title: m.names_building_freezer(),
      icon: { kind: 'freezer', slots: FREEZER_SLOTS },
      blurb: m.catalog_freezer({
        n: FREEZER_SLOTS,
        m: FREEZER_LARGE_SLOTS,
        pct: FREEZER_PCT,
      }),
    },
    {
      id: 'hangar',
      title: m.names_building_hangar(),
      icon: { kind: 'hangar' },
      blurb: m.catalog_hangar({ w: HANGAR_W, h: HANGAR_H }),
    },
    {
      id: 'silo-seed',
      title: m.names_building_silo_seed(),
      icon: { kind: 'silo-seed' },
      blurb: m.catalog_silo({ w: SILO_W, h: SILO_H }),
    },
    {
      id: 'silo-spray',
      title: m.names_building_silo_spray(),
      icon: { kind: 'silo-spray' },
      blurb: m.catalog_silo({ w: SILO_W, h: SILO_H }),
    },
    {
      id: 'silo-produce',
      title: m.names_building_silo_produce(),
      icon: { kind: 'silo-produce' },
      blurb: m.catalog_silo({ w: SILO_W, h: SILO_H }),
    },
    {
      id: 'lever',
      title: m.names_sensor_lever(),
      icon: { kind: 'lever' },
      blurb: m.catalog_lever(),
    },
    {
      id: 'button',
      title: m.names_sensor_button(),
      icon: { kind: 'button' },
      blurb: m.catalog_button(),
    },
    {
      id: 'lamp',
      title: m.names_sensor_lamp(),
      icon: { kind: 'lamp' },
      blurb: m.catalog_lamp(),
    },
    {
      id: 'or',
      title: m.names_sensor_or(),
      icon: { kind: 'or' },
      blurb: m.catalog_or(),
    },
    {
      id: 'and',
      title: m.names_sensor_and(),
      icon: { kind: 'and' },
      blurb: m.catalog_and(),
    },
    {
      id: 'not',
      title: m.names_sensor_not(),
      icon: { kind: 'not' },
      blurb: m.catalog_not(),
    },
    {
      id: 'pulser',
      title: m.names_sensor_pulser(),
      icon: { kind: 'pulser' },
      blurb: m.catalog_pulser(),
    },
    {
      id: 'counter',
      title: m.names_sensor_counter(),
      icon: { kind: 'counter' },
      blurb: m.catalog_counter(),
    },
    {
      id: 'sensor-water',
      title: m.names_sensor_water(),
      icon: { kind: 'sensor-water' },
      blurb: m.catalog_sensor_water(),
    },
    {
      id: 'sensor-fert',
      title: m.names_sensor_fert(),
      icon: { kind: 'sensor-fert' },
      blurb: m.catalog_sensor_fert(),
    },
    {
      id: 'sensor-harvest',
      title: m.names_sensor_harvest(),
      icon: { kind: 'sensor-harvest' },
      blurb: m.catalog_sensor_harvest(),
    },
    {
      id: 'sensor-day',
      title: m.names_sensor_day(),
      icon: { kind: 'sensor-day' },
      blurb: m.catalog_sensor_day(),
    },
    {
      id: 'water-system',
      title: m.names_sensor_water_system(),
      icon: { kind: 'water-system' },
      blurb: m.catalog_water_system(),
    },
    {
      id: 'vehicle-detector',
      title: m.names_sensor_vehicle_detector(),
      icon: { kind: 'vehicle-detector' },
      blurb: m.catalog_vehicle_detector(),
    },
    {
      id: 'traffic-light',
      title: m.names_sensor_traffic_light(),
      icon: { kind: 'traffic-light' },
      blurb: m.catalog_traffic_light(),
    },
  ]
}
