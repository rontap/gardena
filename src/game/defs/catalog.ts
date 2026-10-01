
import { m } from '../../paraglide/messages.js'
import { CROP_NAME, CROPS } from './crops.ts'
import {
  GRASS_GROW,
  GRASS_PACK,
  CHEST_SLOTS,
  COMPOST_LITERS,
  CONTAINERS,
  FERT_BAG_LITERS,
  WEED_SPRAY_BAG,
  PICKAXES,
  AXES,
  SHOVELS,
  FUEL_BATCH,
  SPRINKLER_TILE_DAY,
  SUGAR_BAG,
  SUGAR_SHOP,
  FREEZER_LARGE_SLOTS,
  FREEZER_SLOTS,
  FREEZER_ROT_MUL,
  HANGAR_H,
  HANGAR_W,
  EXTRACT_BAG_LITERS,
  EXTRACT_INFUSED_SECONDS,
  EXTRACT_POUR,
  EXTRACT_SECONDS,
  MILL_TRUFFLE_OUT,
  PRODUCE_SLOTS,
  ROTTEN_GROUND_DAYS,
  SILO_FIELD_ADDITIVE_CAP,
  SILO_FIELD_SEED_CAP,
  STILL_SPRAY_IN,
  STILL_SPRAY_WATER,
} from './items.ts'
import { FAMILIARITY_POINT } from './varieties.ts'
import { WELL_DROUGHT } from './weather.ts'
import { SOURCE, TAP_RATE } from '../sim/water.ts'
import { SOIL_WATER_MAX, SOIL_WATER_MID, WEED_GONE_DAYS } from '../sim/soil.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import type { GrownCrop, TileId } from '../sim/ids.ts'
import { goodsTaking, makeExtract, rottenName, type Face } from '../sim/item.ts'

export type CatalogEntry = {
  id: string
  title: string
  icon: Face
  blurb: string
}

const TILE_TITLE: { readonly [K in TileId]: () => string } = {
  asphalt: () => m.names_tile_asphalt(),
  paved: () => m.names_tile_paved(),
  brick: () => m.names_tile_brick(),
  cobble: () => m.names_tile_cobble(),
}

const FREEZER_PCT = (1 - FREEZER_ROT_MUL) * 100

export function catalogEntries(pace: number): CatalogEntry[] {
  const sec = (n: number) => n / pace
  const work = <T extends { workSeconds: number }>(t: T): T => ({ ...t, workSeconds: sec(t.workSeconds) })
  const crops: CatalogEntry[] = (Object.keys(CROPS) as GrownCrop[]).map(id => {
    const d = CROPS[id]
    return {
      id,
      title: CROP_NAME[id](),
      icon: { kind: 'fruit', crop: id, variety: 'base', quality: 0, count: 1, unitSale: d.sale, freshness: 1, cut: false },
      blurb: d.desc(),
    }
  })
  const sprinklers = m.almanac_desc_sprinklers({
    day: SPRINKLER_TILE_DAY,
    w1: 2,
    h1: 2,
    w2: 4,
    h2: 2,
    w3: 4,
    h3: 4,
  })
  const rottenDead = m.catalog_rotten_dead({
    days: ROTTEN_GROUND_DAYS,
    rotten: STILL_SPRAY_IN,
    water: STILL_SPRAY_WATER,
    liters: WEED_SPRAY_BAG,
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
      blurb: m.catalog_shovel(work(SHOVELS.shovel)),
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
      blurb: m.catalog_better_shovel(work(SHOVELS['better-shovel'])),
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
      blurb: m.catalog_pickaxe(work(PICKAXES.pickaxe)),
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
      blurb: m.catalog_better_pickaxe(work(PICKAXES['better-pickaxe'])),
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
      blurb: m.almanac_desc_fertilizer({ n: FERT_BAG_LITERS }),
    },
    {
      id: 'weed-spray',
      title: m.names_item_weed_spray(),
      icon: { kind: 'weed-spray', liters: WEED_SPRAY_BAG, capacityLiters: WEED_SPRAY_BAG },
      blurb: m.almanac_desc_weed_spray({ n: WEED_SPRAY_BAG }),
    },
    {
      id: 'compost',
      title: m.names_item_compost(),
      icon: { kind: 'compost', liters: COMPOST_LITERS, capacityLiters: COMPOST_LITERS },
      blurb: m.almanac_desc_compost({ liters: COMPOST_LITERS }),
    },
    {
      id: 'compost-box',
      title: m.names_building_compost_box(),
      icon: { kind: 'compost-box' },
      blurb: m.catalog_compost_box(),
    },
    {
      id: 'soil',
      title: m.names_ground_tilled(),
      icon: { kind: 'shovel', id: 'shovel', usesLeft: SHOVELS.shovel.uses, workSeconds: SHOVELS.shovel.workSeconds },
      blurb: m.catalog_soil({ max: SOIL_WATER_MAX }),
    },
    {
      id: 'weed',
      title: m.names_ground_weed(),
      icon: { kind: 'weed', count: 1 },
      blurb: m.catalog_weed({ days: WEED_GONE_DAYS }),
    },
    {
      id: 'rotten',
      title: m.catalog_title_rotten(),
      icon: { kind: 'rotten', cls: 'fruit', count: 1, createdAt: 0 },
      blurb: rottenDead,
    },
    {
      id: 'rotten-root',
      title: rottenName('root'),
      icon: { kind: 'rotten', cls: 'root', count: 1, createdAt: 0 },
      blurb: rottenDead,
    },
    {
      id: 'dead',
      title: m.catalog_title_dead(),
      icon: { kind: 'dead', cls: 'fruit', count: 1 },
      blurb: rottenDead,
    },
    {
      id: 'grass',
      title: m.names_item_cut_grass(),
      icon: { kind: 'grass', count: 1 },
      blurb: m.catalog_grass(),
    },

    {
      id: 'grass-seeds',
      title: m.names_sku_pack_grass(),
      icon: { kind: 'seeds', crop: 'grass', variety: 'base', quality: 0, count: GRASS_PACK },
      blurb: m.catalog_grass_seeds({ pack: GRASS_PACK, seconds: sec(GRASS_GROW) }),
    },
    {
      id: 'fence',
      title: m.names_building_fence(),
      icon: { kind: 'fence' },
      blurb: m.catalog_fence(),
    },
    ...(['asphalt', 'cobble', 'brick', 'paved'] as TileId[]).map(tile => ({
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
      blurb: m.catalog_rotary_shovel(work(SHOVELS['rotary-shovel'])),
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
      blurb: m.catalog_diamond_pickaxe(work(PICKAXES['diamond-pickaxe'])),
    },
    {
      id: 'pumpjack',
      title: m.names_building_pump(),
      icon: { kind: 'pumpjack' },
      blurb: m.almanac_desc_pump({ rate: SOURCE.pump.rate * DAY_SECONDS, cap: SOURCE.pump.capacity }),
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
      blurb: m.catalog_grinder(),
    },
    {
      id: 'pipe',
      title: m.names_building_pipe(),
      icon: { kind: 'pipe' },
      blurb: m.almanac_desc_pipe(),
    },
    {
      id: 'sprinkler',
      title: m.names_building_sprinkler(),
      icon: { kind: 'sprinkler' },
      blurb: sprinklers,
    },
    {
      id: 'sprinkler-vert',
      title: m.names_building_sprinkler_vert(),
      icon: { kind: 'sprinkler-vert' },
      blurb: sprinklers,
    },
    {
      id: 'sprinkler-large',
      title: m.names_building_sprinkler_large(),
      icon: { kind: 'sprinkler-large' },
      blurb: sprinklers,
    },
    {
      id: 'well',
      title: m.names_building_well(),
      icon: { kind: 'well' },
      blurb: m.almanac_desc_well({
        rate: SOURCE.well.rate * DAY_SECONDS,
        cap: SOURCE.well.capacity,
        drought: Math.round((1 - WELL_DROUGHT) * 100),
      }),
    },
    {
      id: 'valve',
      title: m.names_building_valve(),
      icon: { kind: 'valve' },
      blurb: m.almanac_desc_valve(),
    },
    {
      id: 'tap',
      title: m.names_building_tap(),
      icon: { kind: 'tap' },
      blurb: m.almanac_desc_tap({ rate: TAP_RATE }),
    },
    {
      id: 'sugar',
      title: m.names_item_sugar(),
      icon: { kind: 'sugar', liters: SUGAR_BAG, capacityLiters: SUGAR_BAG, unitSale: SUGAR_SHOP, quality: 0 },
      blurb: m.almanac_desc_sugar({ bag: SUGAR_BAG }),
    },
    {
      id: 'mill',
      title: m.names_building_mill(),
      icon: { kind: 'mill' },
      blurb: m.catalog_mill(),
    },
    {
      id: 'infuser',
      title: m.names_building_infuser(),
      icon: { kind: 'infuser' },
      blurb: m.catalog_infuser(),
    },
    {
      id: 'necronomicon',
      title: m.names_building_necronomicon(),
      icon: { kind: 'necronomicon' },
      blurb: m.catalog_necronomicon(),
    },
    {
      id: 'sorter',
      title: m.names_building_sorter(),
      icon: { kind: 'sorter' },
      blurb: m.catalog_sorter(),
    },
    {
      id: 'flakes',
      title: m.names_item_flakes(),
      icon: { kind: 'flakes', quality: 0, count: 1 },
      blurb: m.catalog_flakes({ goods: goodsTaking('flakes') }),
    },
    {
      id: 'vanilla-extract',
      title: m.names_item_vanilla_extract(),
      icon: { kind: 'vanilla-extract', quality: 0, count: 1 },
      blurb: m.catalog_vanilla_extract({ goods: goodsTaking('vanilla-extract') }),
    },
    {
      id: 'truffle-extract',
      title: m.names_item_truffle_extract(),
      icon: { kind: 'truffle-extract', count: 1 },
      blurb: m.catalog_truffle_extract({ goods: goodsTaking('truffle-extract') }),
    },
    {
      id: 'extract',
      title: m.names_item_extract(),
      icon: makeExtract(false),
      blurb: m.almanac_desc_extract({
        liters: EXTRACT_BAG_LITERS,
        pour: EXTRACT_POUR,
        seconds: sec(EXTRACT_SECONDS),
        infused: sec(EXTRACT_INFUSED_SECONDS),
      }),
    },
    {
      id: 'still',
      title: m.names_building_still(),
      icon: { kind: 'still' },
      blurb: m.catalog_still({ rotten: STILL_SPRAY_IN, water: STILL_SPRAY_WATER, liters: WEED_SPRAY_BAG }),
    },
    {
      id: 'furnace',
      title: m.names_building_furnace(),
      icon: { kind: 'furnace' },
      blurb: m.catalog_furnace(),
    },
    {
      id: 'station',
      title: m.names_building_station(),
      icon: { kind: 'station' },
      blurb: m.catalog_station({ n: FAMILIARITY_POINT }),
    },
    {
      id: 'axe',
      title: m.names_item_axe(),
      icon: { kind: 'axe', id: 'axe', usesLeft: AXES.axe.uses, workSeconds: AXES.axe.workSeconds },
      blurb: m.catalog_axe(work(AXES.axe)),
    },
    {
      id: 'chainsaw',
      title: m.names_item_chainsaw(),
      icon: { kind: 'axe', id: 'chainsaw', usesLeft: AXES.chainsaw.uses, workSeconds: AXES.chainsaw.workSeconds },
      blurb: m.catalog_chainsaw(work(AXES.chainsaw)),
    },
    {
      id: 'electric-chainsaw',
      title: m.names_item_electric_chainsaw(),
      icon: {
        kind: 'axe',
        id: 'electric-chainsaw',
        usesLeft: AXES['electric-chainsaw'].uses,
        workSeconds: AXES['electric-chainsaw'].workSeconds,
      },
      blurb: m.catalog_electric_chainsaw(work(AXES['electric-chainsaw'])),
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
      blurb: m.catalog_ash(),
    },
    {
      id: 'fly-agaric',
      title: m.names_item_fly_agaric(),
      icon: { kind: 'fly-agaric', count: 1 },
      blurb: m.catalog_fly_agaric({ goods: goodsTaking('fly-agaric') }),
    },
    {
      id: 'truffle',
      title: m.names_item_truffle(),
      icon: { kind: 'truffle', count: 1 },
      blurb: m.catalog_truffle({ n: MILL_TRUFFLE_OUT }),
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
      blurb: m.catalog_jam(),
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
      id: 'refuel',
      title: m.names_building_refuel(),
      icon: { kind: 'refuel' },
      blurb: m.catalog_refuel({ batch: FUEL_BATCH }),
    },
    {
      id: 'silo-seed',
      title: m.names_building_silo_seed(),
      icon: { kind: 'silo-seed' },
      blurb: m.catalog_silo_seed({ cap: SILO_FIELD_SEED_CAP }),
    },
    {
      id: 'silo-spray',
      title: m.names_building_silo_spray(),
      icon: { kind: 'silo-spray' },
      blurb: m.catalog_silo_spray({ cap: SILO_FIELD_ADDITIVE_CAP }),
    },
    {
      id: 'silo-produce',
      title: m.names_building_silo_produce(),
      icon: { kind: 'silo-produce' },
      blurb: m.catalog_silo_produce({ slots: PRODUCE_SLOTS }),
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
      id: 'logic',
      title: m.names_sensor_logic(),
      icon: { kind: 'logic' },
      blurb: m.catalog_logic(),
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
      id: 'sensor-variety',
      title: m.names_sensor_variety(),
      icon: { kind: 'sensor-variety' },
      blurb: m.catalog_sensor_variety(),
    },
    {
      id: 'sensor-weather',
      title: m.names_sensor_weather(),
      icon: { kind: 'sensor-weather' },
      blurb: m.catalog_sensor_weather(),
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
    {
      id: 'dispatch',
      title: m.names_sensor_dispatch(),
      icon: { kind: 'dispatch' },
      blurb: m.catalog_dispatch(),
    },
  ]
}
