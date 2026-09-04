import { m } from '../../paraglide/messages.js'
import type { Rarity } from '../defs/rarity.ts'
import { inWorld, type Barrel, type Coord, type Furnace, type Grinder, type JamMachine, type Mill, type PotStill, type Tree } from './building.ts'
import { onCell, topIndex } from './drop.ts'
import type { BarrelCrop, CropId, SensorKind, SkuId } from './ids.ts'
import { DAY_SECONDS } from './clock.ts'
import {
  BARREL_MATURE,
  HANGAR_H,
  HANGAR_W,
  SILO_H,
  SILO_W,
  JAM_BUFFER,
  JAM_IN,
  JAM_SUGAR,
  STILL_CAP,
  FURNACE_NEED,
} from '../defs/items.ts'
import { countable, organic, skuLabel, stackable, type Hand, type Item } from './item.ts'
import {
  barrelNeed,
  feedUnits,
  fruitCrop,
  grindAccept,
  jamCropName,
  jamCropOf,
  millDumpUnits,
  millNeed,
  millProductName,
  millRecipeOf,
  furnaceAccept,
  furnaceUnit,
  stillCropOf,
} from './machine.ts'
import { aoe, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import { CASK_OF, SENSOR_CELL_SKUS } from './ids.ts'
import { isFenceSite, isPlot, isTilled, isTileSite } from './plot.ts'
import { isSensor, isSeqIn, sameNode, wouldCycle, type WireEnd } from './sensor.ts'
import { FERT_PLOT_MAX } from './soil.ts'
import { COMPOST_NEED } from '../defs/items.ts'
import { fillable, waterable, type Intent, type World } from './world.ts'

export const NOT_OWNED = m.prompt_not_owned()
export const HAND_FULL = m.prompt_hand_full()

export type Prompt =
  | { kind: 'intent'; text: string; intent: Intent }
  | { kind: 'place'; text: string }
  | { kind: 'blocked'; text: string }

export type PromptHit =
  | { kind: 'cell'; at: Coord }
  | { kind: 'edge'; edge: Edge }
  | { kind: 'sprinkler'; sprinkler: Sprinkler }
  | { kind: 'delete-pipe'; edge: Edge }
  | { kind: 'delete-sprinkler'; at: Vertex }
  | { kind: 'valve'; edge: Edge }
  | { kind: 'sprinkler-hud'; at: Vertex }
  | { kind: 'port'; end: WireEnd }
  | { kind: 'delete-wire'; from: WireEnd; to: WireEnd }
  | { kind: 'water-hud'; at: Coord }
  | { kind: 'harvest-hud'; at: Coord }
  | { kind: 'counter-hud'; at: Coord }
  | { kind: 'day-hud'; at: Coord }

const CROP_LABEL: { readonly [K in CropId]: () => string } = {
  carrot: m.names_crop_carrot,
  potato: m.names_crop_potato,
  wheat: m.names_crop_wheat,
  tomato: m.names_crop_tomato,
  raspberry: m.names_crop_raspberry,
  grape: m.names_crop_grape,
  vanilla: m.names_crop_vanilla,
  'sugar-cane': m.names_crop_sugar_cane,
  apple: m.names_crop_apple,
  apricot: m.names_crop_apricot,
  olive: m.names_crop_olive,
  cherry: m.names_crop_cherry,
}

const SENSOR_LABEL: { readonly [K in SensorKind]: () => string } = {
  lever: m.names_sensor_lever,
  button: m.names_sensor_button,
  lamp: m.names_sensor_lamp,
  or: m.names_sensor_or,
  and: m.names_sensor_and,
  not: m.names_sensor_not,
  pulser: m.names_sensor_pulser,
  counter: m.names_sensor_counter,
  'sensor-water': m.names_sensor_water,
  'sensor-fert': m.names_sensor_fert,
  'sensor-harvest': m.names_sensor_harvest,
  'sensor-day': m.names_sensor_day,
  'water-system': m.names_sensor_water_system,
  'vehicle-detector': m.names_sensor_vehicle_detector,
  'traffic-light': m.names_sensor_traffic_light,
}

export function cropLabel(id: CropId): string {
  return CROP_LABEL[id]()
}

export function sensorName(k: SensorKind): string {
  return SENSOR_LABEL[k]()
}

export function placeLabel(id: SkuId): string {
  return skuLabel(id)
}

export function pipePrompt(w: World, e: Edge): Prompt {
  if (w.act.place.kind !== 'sku') return { kind: 'blocked', text: m.prompt_cannot_place() }
  const id = w.act.place.id
  if (id !== 'buy-pipe' && id !== 'buy-valve') {
    return { kind: 'blocked', text: m.prompt_cannot_place() }
  }
  if (id !== 'buy-valve' && w.money < w.skuPrice(id)) return { kind: 'blocked', text: m.prompt_cannot_afford() }
  if (!w.edgeOwned(e)) return { kind: 'blocked', text: m.prompt_cannot_place() }
  if (id === 'buy-pipe') {
    if (w.hasPipe(e)) return { kind: 'blocked', text: m.prompt_cannot_place() }
    return { kind: 'place', text: m.prompt_place({ name: m.names_sku_buy_pipe() }) }
  }
  if (w.hasValve(e)) return { kind: 'blocked', text: m.prompt_pipe_has_valve() }
  const cost = w.hasPipe(e) ? w.skuPrice('buy-valve') : w.skuPrice('buy-valve') + w.skuPrice('buy-pipe')
  if (w.money < cost) return { kind: 'blocked', text: m.prompt_cannot_afford() }
  return { kind: 'place', text: m.prompt_place({ name: m.names_sku_buy_valve() }) }
}

export function valveStand(w: World, e: Edge): Coord {
  const near = { col: e.col, row: e.row }
  const far = e.axis === 'h' ? { col: e.col, row: e.row - 1 } : { col: e.col - 1, row: e.row }
  return inWorld(near, w.owned) ? near : far
}

export function valvePrompt(w: World, e: Edge): Prompt {
  const seg = w.segmentAt(e)
  if (seg === undefined || seg.gate.kind !== 'valve') return { kind: 'blocked', text: m.prompt_cannot_reach() }
  if (w.valveWired(e)) return { kind: 'blocked', text: labeled(m.names_building_valve(), m.prompt_wired()) }
  return intent(
    seg.gate.open
      ? m.prompt_close({ name: m.names_building_valve().toLowerCase() })
      : m.prompt_open({ name: m.names_building_valve().toLowerCase() }),
    { act: 'valve', at: valveStand(w, e), edge: e },
  )
}

export function sprinklerPrompt(w: World, s: Sprinkler): Prompt {
  const id = sprinklerSku(s)
  if (w.act.place.kind !== 'sku' || w.act.place.id !== id) return { kind: 'blocked', text: m.prompt_cannot_place() }
  if (w.money < w.skuPrice(id)) return { kind: 'blocked', text: m.prompt_cannot_afford() }
  if (!w.vertexOwned(s.at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
  if (w.sprinklerAt(s.at) !== undefined) return { kind: 'blocked', text: m.prompt_cannot_place() }
  if (!aoe(s).every(c => w.inWorld(c))) return { kind: 'blocked', text: m.prompt_cannot_place() }
  if (s.variant === 'basic') return { kind: 'place', text: m.prompt_place({ name: m.names_sku_buy_sprinkler() }) }
  if (s.variant === 'vert') return { kind: 'place', text: m.prompt_place({ name: m.names_sku_buy_sprinkler_vert() }) }
  return { kind: 'place', text: m.prompt_place({ name: m.names_sku_buy_sprinkler_large() }) }
}

export function deletePrompt(
  w: World,
  hit: { kind: 'pipe'; edge: Edge } | { kind: 'sprinkler'; at: Vertex },
): Prompt {
  if (w.act.place.kind !== 'delete') {
    return { kind: 'blocked', text: m.prompt_cannot_delete() }
  }
  if (hit.kind === 'pipe') {
    const seg = w.segmentAt(hit.edge)
    if (w.edgeOwned(hit.edge) && seg !== undefined) {
      return {
        kind: 'place',
        text: m.prompt_delete({
          name: (seg.gate.kind === 'valve' ? m.names_building_valve() : m.names_building_pipe()).toLowerCase(),
        }),
      }
    }
    return { kind: 'blocked', text: m.prompt_cannot_delete() }
  }
  if (w.sprinklerAt(hit.at) !== undefined) {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_sprinkler().toLowerCase() }) }
  }
  return { kind: 'blocked', text: m.prompt_cannot_delete() }
}

export function deleteBuildingPrompt(w: World, at: Coord): Prompt {
  if (w.act.place.kind !== 'delete') return { kind: 'blocked', text: m.prompt_cannot_delete() }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
  const cell = w.cell(at)
  if (cell.kind === 'pump' && cell.form === 'jack') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_face_pumpjack().toLowerCase() }) }
  }
  if (cell.kind === 'rain-tank') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_rain_tank().toLowerCase() }) }
  }
  if (cell.kind === 'tap') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_tap().toLowerCase() }) }
  }
  if (cell.kind === 'well') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_well().toLowerCase() }) }
  }
  if (w.hasFence(at)) {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_fence().toLowerCase() }) }
  }
  if (cell.kind === 'untilled' && cell.cover.kind === 'tile') return { kind: 'place', text: m.prompt_delete_paving() }
  if (cell.kind === 'chest') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_chest().toLowerCase() }) }
  }
  if (cell.kind === 'grinder') return { kind: 'place', text: m.prompt_delete_grinder() }
  if (cell.kind === 'compost-box') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_compost_box().toLowerCase() }) }
  }
  if (cell.kind === 'mill') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_mill().toLowerCase() }) }
  }
  if (cell.kind === 'still') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_still().toLowerCase() }) }
  }
  if (cell.kind === 'furnace') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_furnace().toLowerCase() }) }
  }
  if (cell.kind === 'barrel') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_barrel().toLowerCase() }) }
  }
  if (cell.kind === 'jam') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_jam().toLowerCase() }) }
  }
  if (cell.kind === 'freezer') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_freezer().toLowerCase() }) }
  }
  if (cell.kind === 'hangar') {
    const origin = { col: cell.base.col, row: cell.base.row }
    if (w.hangarStores(origin)) return { kind: 'blocked', text: m.prompt_cannot_delete_stores() }
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_hangar().toLowerCase() }) }
  }
  if (cell.kind === 'silo-seed') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_silo_seed().toLowerCase() }) }
  }
  if (cell.kind === 'silo-spray') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_silo_spray().toLowerCase() }) }
  }
  if (cell.kind === 'silo-produce') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_building_silo_produce().toLowerCase() }) }
  }
  if (cell.kind === 'lever') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_lever().toLowerCase() }) }
  }
  if (cell.kind === 'button') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_button().toLowerCase() }) }
  }
  if (cell.kind === 'lamp') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_lamp().toLowerCase() }) }
  }
  if (cell.kind === 'or') return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_or() }) }
  if (cell.kind === 'and') return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_and() }) }
  if (cell.kind === 'not') return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_not() }) }
  if (cell.kind === 'pulser') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_pulser().toLowerCase() }) }
  }
  if (cell.kind === 'counter') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_counter().toLowerCase() }) }
  }
  if (cell.kind === 'sensor-water') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_water().toLowerCase() }) }
  }
  if (cell.kind === 'sensor-fert') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_fert().toLowerCase() }) }
  }
  if (cell.kind === 'sensor-harvest') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_harvest().toLowerCase() }) }
  }
  if (cell.kind === 'sensor-day') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_day().toLowerCase() }) }
  }
  if (cell.kind === 'water-system') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_water_system().toLowerCase() }) }
  }
  if (cell.kind === 'vehicle-detector') {
    return { kind: 'place', text: m.prompt_delete({ name: m.names_sensor_vehicle_detector().toLowerCase() }) }
  }
  return { kind: 'blocked', text: m.prompt_cannot_delete() }
}

export function readPromptHit(w: World, hit: PromptHit | undefined): Prompt {
  if (w.act.place.kind === 'wire') {
    const from = w.act.place.from
    if (hit === undefined || hit.kind !== 'port') return { kind: 'blocked', text: m.prompt_cannot_wire() }
    if (hit.end.port === 'out') return { kind: 'blocked', text: m.prompt_cannot_wire() }
    if (w.wires.some(x => sameNode(x.from, from) && sameNode(x.to, hit.end))) {
      return { kind: 'place', text: m.prompt_remove_wire() }
    }
    if (
      wouldCycle(w.wires, from, hit.end, end =>
        isSeqIn(end, end.kind === 'cell' && w.inWorld(end.at) ? w.cell(end.at) : undefined),
      )
    ) {
      return { kind: 'blocked', text: m.prompt_cannot_loop() }
    }
    return { kind: 'place', text: m.prompt_place_bare() }
  }
  if (w.act.place.kind === 'sku' && (w.act.place.id === 'buy-pipe' || w.act.place.id === 'buy-valve')) {
    if (hit === undefined || hit.kind !== 'edge') {
      if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: m.prompt_cannot_afford() }
      return { kind: 'blocked', text: m.prompt_cannot_place() }
    }
    return pipePrompt(w, hit.edge)
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'valve') return valvePrompt(w, hit.edge)
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'sprinkler-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: m.names_building_sprinkler().toLowerCase() }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'water-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: m.names_sensor_water().toLowerCase() }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'harvest-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: m.names_sensor_harvest().toLowerCase() }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'counter-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: m.names_sensor_counter().toLowerCase() }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'day-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: m.names_sensor_day().toLowerCase() }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'port') {
    return { kind: 'place', text: m.prompt_place_bare() }
  }
  if (w.act.place.kind === 'delete' && hit !== undefined && hit.kind === 'delete-wire') {
    return { kind: 'place', text: m.prompt_delete_wire() }
  }
  if (
    w.act.place.kind === 'sku' &&
    (w.act.place.id === 'buy-sprinkler' ||
      w.act.place.id === 'buy-sprinkler-vert' ||
      w.act.place.id === 'buy-sprinkler-large')
  ) {
    if (hit === undefined || hit.kind !== 'sprinkler') {
      if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: m.prompt_cannot_afford() }
      return { kind: 'blocked', text: m.prompt_cannot_place() }
    }
    return sprinklerPrompt(w, hit.sprinkler)
  }
  if (w.act.place.kind === 'delete') {
    if (hit !== undefined && hit.kind === 'delete-pipe') return deletePrompt(w, { kind: 'pipe', edge: hit.edge })
    if (hit !== undefined && hit.kind === 'delete-sprinkler') return deletePrompt(w, { kind: 'sprinkler', at: hit.at })
    if (hit !== undefined && hit.kind === 'cell') return deleteBuildingPrompt(w, hit.at)
    return { kind: 'blocked', text: m.prompt_cannot_delete() }
  }
  if (hit === undefined || hit.kind !== 'cell') {
    if (w.act.place.kind === 'sku') {
      if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: m.prompt_cannot_afford() }
      return { kind: 'blocked', text: m.prompt_cannot_place() }
    }
    return { kind: 'blocked', text: m.prompt_cannot_place() }
  }
  return readPrompt(w, hit.at)
}

export function readPrompt(w: World, at: Coord): Prompt {
  if (w.act.place.kind === 'delete') return deleteBuildingPrompt(w, at)
  if (w.act.place.kind === 'sku') {
    if (
      w.act.place.id === 'buy-pipe' ||
      w.act.place.id === 'buy-valve' ||
      w.act.place.id === 'buy-sprinkler' ||
      w.act.place.id === 'buy-sprinkler-vert' ||
      w.act.place.id === 'buy-sprinkler-large'
    ) {
      return readPromptHit(w, undefined)
    }
    if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: m.prompt_cannot_afford() }
    if (
      w.act.place.id === 'buy-tile-paved' ||
      w.act.place.id === 'buy-tile-brick' ||
      w.act.place.id === 'buy-tile-cobble'
    ) {
      if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
      if (!isTileSite(w.cell(at))) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (w.act.place.id === 'buy-fence') {
      if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
      if (!isFenceSite(w.cell(at))) return { kind: 'blocked', text: m.prompt_fences_need_untilled() }
      if (w.hasFence(at)) return { kind: 'blocked', text: m.prompt_already_fenced() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (w.act.place.id === 'buy-pumpjack' || w.act.place.id === 'buy-rain-tank' || w.act.place.id === 'buy-still') {
      if (!wideSiteOk(w, at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (w.act.place.id === 'buy-furnace') {
      if (!tallSiteOk(w, at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (
      w.act.place.id === 'buy-chest' ||
      w.act.place.id === 'buy-grinder' ||
      w.act.place.id === 'buy-compost-box' ||
      w.act.place.id === 'buy-tap' ||
      w.act.place.id === 'buy-well' ||
      w.act.place.id === 'buy-mill' ||
      w.act.place.id === 'buy-jam' ||
      w.act.place.id === 'buy-barrel' ||
      w.act.place.id === 'buy-freezer' ||
      w.act.place.id === 'buy-freezer-large' ||
      w.act.place.id === 'buy-hangar' ||
      w.act.place.id === 'buy-silo-seed' ||
      w.act.place.id === 'buy-silo-spray' ||
      w.act.place.id === 'buy-silo-produce' ||
      (SENSOR_CELL_SKUS as readonly string[]).includes(w.act.place.id)
    ) {
      if (w.act.place.id === 'buy-hangar') {
        if (!hangarSiteOk(w, at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
        return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
      }
      if (
        w.act.place.id === 'buy-silo-seed' ||
        w.act.place.id === 'buy-silo-spray' ||
        w.act.place.id === 'buy-silo-produce'
      ) {
        if (!siloSiteOk(w, at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
        return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
      }
      if (!placeSolidOk(w, at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
    if (!isPlot(w.cell(at))) return { kind: 'blocked', text: m.prompt_cannot_place() }
    return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
  }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
  const cell = w.cell(at)
  const parked = w.parkedAt(at)
  if (parked !== undefined) {
    return intent(parked.kind === 'tractor' ? m.names_vehicle_tractor() : m.names_vehicle_quad(), {
      act: 'vehicle',
      id: parked.id,
    })
  }
  if (cell.kind === 'hangar') return intent(m.names_building_hangar(), { act: 'hangar', at })
  if (cell.kind === 'silo-seed') return { kind: 'blocked', text: m.names_building_silo_seed() }
  if (cell.kind === 'silo-spray') return { kind: 'blocked', text: m.names_building_silo_spray() }
  if (cell.kind === 'silo-produce') return { kind: 'blocked', text: m.names_building_silo_produce() }
  if (cell.kind === 'house') return intent(m.prompt_inventory(), { act: 'inventory' })
  if (cell.kind === 'truck') {
    if (canConsign(w.act.hand)) return intent(m.prompt_drop_off(), { act: 'consign' })
    return needSeeds(cell)
  }
  if (onCell(w.drops, at).length > 0) {
    if (handFullFor(w, w.drops[topIndex(w.drops, at)].item)) return { kind: 'blocked', text: HAND_FULL }
    return intent(m.prompt_pick_up(), { act: 'pickup', at })
  }
  if (cell.kind === 'seed-silo') return intent(m.names_building_seed_silo(), { act: 'silo', at })
  if (cell.kind === 'additive-store') return intent(m.prompt_additives(), { act: 'additives', at })
  if (cell.kind === 'chest') return intent(m.names_building_chest(), { act: 'chest', at })
  if (cell.kind === 'freezer') return intent(m.names_building_freezer(), { act: 'chest', at })
  if (cell.kind === 'grinder') {
    const look = grindLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && grindAccept(cell, w.act.hand.item) !== undefined) {
      return intent(m.prompt_grind(), { act: 'grind', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'mill') {
    const look = millLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && millDumpOk(cell, w.act.hand)) {
      const recipe = millRecipeOf(w.act.hand.item)
      if (recipe !== undefined) {
        const name = millProductName(recipe)
        return intent(m.prompt_crush_into({ name }), { act: 'mill', at })
      }
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'still') {
    const look = stillLook(cell, w.act.hand)
    if (stillDumpOk(cell, w.act.hand)) return intent(m.prompt_distill(), { act: 'still', at })
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'furnace') {
    const look = furnaceLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && furnaceAccept(cell, w.act.hand.item) > 0) {
      return intent(m.prompt_burn(), { act: 'furnace', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'barrel') {
    const look = barrelLook(cell, w.act.hand)
    if (barrelCollectOk(cell, w.act.hand) && cell.crop !== 'none') {
      const cask = CASK_OF[cell.crop]
      const name = (cask === 'wine' ? m.names_cask_wine() : m.names_cask_cider()).toLowerCase()
      return intent(m.prompt_collect({ name }), { act: 'barrel', at })
    }
    if (barrelDumpOk(cell, w.act.hand)) {
      return intent(m.prompt_fill_named({ name: m.names_building_barrel().toLowerCase() }), { act: 'barrel', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'jam') {
    const look = jamLook(cell, w.act.hand)
    if (jamSugarOk(cell, w.act.hand)) {
      return intent(m.prompt_fill_named({ name: m.names_item_sugar().toLowerCase() }), { act: 'jam', at })
    }
    if (w.act.hand.kind === 'hold' && jamFruitOk(cell, w.act.hand)) {
      const crop = jamCropOf(w.act.hand.item)
      return intent(
        crop === 'tomato' ? m.prompt_make({ name: m.names_item_ketchup().toLowerCase() }) : m.prompt_make_jam(),
        { act: 'jam', at },
      )
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'compost-box') {
    if (w.act.hand.kind === 'hold' && organic(w.act.hand.item)) return intent(m.names_item_compost(), { act: 'compost', at })
    return { kind: 'blocked', text: compostLine(cell.units, cell.progress) }
  }
  if (isSensor(cell)) {
    if (cell.kind === 'lever') {
      return intent(m.prompt_flip({ name: m.names_sensor_lever().toLowerCase() }), { act: 'toggle', at })
    }
    if (cell.kind === 'button') {
      return intent(m.prompt_press({ name: m.names_sensor_button().toLowerCase() }), { act: 'toggle', at })
    }
    if (cell.kind === 'sensor-water') {
      return { kind: 'place', text: m.prompt_tune({ name: m.names_sensor_water().toLowerCase() }) }
    }
    if (cell.kind === 'sensor-harvest') {
      return { kind: 'place', text: m.prompt_tune({ name: m.names_sensor_harvest().toLowerCase() }) }
    }
    if (cell.kind === 'counter') {
      return { kind: 'place', text: m.prompt_tune({ name: m.names_sensor_counter().toLowerCase() }) }
    }
    if (cell.kind === 'sensor-day') {
      return { kind: 'place', text: m.prompt_tune({ name: m.names_sensor_day().toLowerCase() }) }
    }
    return { kind: 'blocked', text: sensorName(cell.kind) }
  }
  if (cell.kind === 'pump' || cell.kind === 'rain-tank' || cell.kind === 'tap' || cell.kind === 'well') {
    if (!fillable(w, at)) return { kind: 'blocked', text: m.prompt_no_water_grid({ name: m.names_building_tap() }) }
    if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'container') {
      return intent(m.prompt_fill(), { act: 'fill', at })
    }
    return { kind: 'blocked', text: m.prompt_need_a({ name: m.names_container_bucket().toLowerCase() }) }
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'pickaxe') {
    if (cell.kind === 'rock') {
      const n = cell.base.w * cell.base.h
      if (n > 1 && w.act.hand.item.usesLeft < 2) {
        return { kind: 'blocked', text: m.prompt_need_a({ name: m.names_pickaxe_pickaxe().toLowerCase() }) }
      }
      return intent(m.prompt_mine(), { act: 'mine', at })
    }
    if (cell.kind === 'untilled' && cell.ground === 'very-hard') {
      return intent(m.prompt_mine(), { act: 'mine', at })
    }
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'shovel') {
    if (cell.kind === 'rock' || (cell.kind === 'untilled' && cell.ground === 'very-hard')) {
      return { kind: 'blocked', text: m.prompt_need_a({ name: m.names_pickaxe_pickaxe().toLowerCase() }) }
    }
    if (cell.kind === 'tree') return intent(m.prompt_dig(), { act: 'shovel', at })
    if (cell.kind === 'untilled' && cell.ground === 'hard' && w.act.hand.item.usesLeft < 2) {
      return { kind: 'blocked', text: m.prompt_cannot_dig() }
    }
    if (cell.kind === 'weed') {
      return intent(m.prompt_pull({ name: m.names_ground_weed().toLowerCase() }), { act: 'shovel', at })
    }
    if (cell.kind === 'untilled' || cell.kind === 'empty' || cell.kind === 'rotten')
      return intent(m.prompt_dig(), { act: 'shovel', at })
    if (cell.kind === 'growing' || cell.kind === 'ripe') return intent(m.prompt_dig_up_plant(), { act: 'shovel', at })
    if (cell.kind === 'dead') return intent(m.prompt_dig_out_dead(), { act: 'shovel', at })
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'axe') {
    if (cell.kind === 'tree' && cell.juvenile >= 1 && !cell.trunk) {
      return intent(m.prompt_chop(), { act: 'chop', at })
    }
    if (cell.kind === 'tree') return { kind: 'blocked', text: treeLine(cell) }
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'tree-seed') {
    const above = { col: at.col, row: at.row - 1 }
    const a = cell
    const b = w.inWorld(above) ? w.cell(above) : undefined
    if (
      a.kind === 'untilled' &&
      a.ground === 'soft' &&
      a.cover.kind !== 'tile' &&
      b !== undefined &&
      b.kind === 'untilled' &&
      b.ground === 'soft' &&
      b.cover.kind !== 'tile'
    ) {
      return intent(m.prompt_plant({ name: cropLabel(w.act.hand.item.tree) }), { act: 'plant', at })
    }
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'seeds') {
    if (cell.kind === 'empty') return intent(m.prompt_plant({ name: cropLabel(w.act.hand.item.crop) }), { act: 'plant', at })
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'grass-seeds') {
    if (cell.kind === 'empty') {
      return intent(m.prompt_sow({ name: m.names_ground_grass().toLowerCase() }), { act: 'plant', at })
    }
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'container' && isTilled(cell)) {
    if (!waterable(cell, w.modifiers)) {
      return { kind: 'blocked', text: cell.soil.drowning ? m.prompt_soil_drowning() : m.prompt_soil_watered() }
    }
    if (w.act.hand.item.liters > 0) return intent(m.names_face_water(), { act: 'water', at })
    return { kind: 'blocked', text: m.prompt_named_empty({ name: m.names_container_bucket() }) }
  }
  if (w.act.hand.kind === 'hold' && feedKind(w.act.hand.item) && isTilled(cell)) {
    if (cell.soil.fertilizer >= FERT_PLOT_MAX) return { kind: 'blocked', text: m.prompt_soil_fertile() }
    return intent(m.prompt_fertilize(), { act: 'fertilize', at })
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'weed-spray' && isTilled(cell) && w.act.hand.item.liters >= 1) {
    return intent(m.prompt_spray(), { act: 'weed-spray', at })
  }
  if (cell.kind === 'ripe') {
    if (canHarvestHand(w, cell.plant.crop, cell.plant.rarity)) return intent(m.prompt_harvest(), { act: 'harvest', at })
    if (sameFruitInHand(w, cell.plant.crop, cell.plant.rarity)) return { kind: 'blocked', text: HAND_FULL }
  }
  if (cell.kind === 'weed' || (cell.kind === 'untilled' && cell.cover.kind === 'grass')) {
    const kind = cell.kind === 'weed' ? 'weed' : 'grass'
    if (w.act.hand.kind === 'empty') return intent(m.prompt_pick_up(), { act: 'pickup', at })
    if (w.act.hand.item.kind === kind) {
      if (handFullFor(w, { kind, count: 1 })) return { kind: 'blocked', text: HAND_FULL }
      return intent(m.prompt_pick_up(), { act: 'pickup', at })
    }
  }
  if (w.canTend(at)) return intent(m.prompt_tend(), { act: 'tend', at })
  if (w.act.hand.kind === 'empty') return intent(m.prompt_move_here(), { act: 'walk', at })
  if (isPlot(cell)) return intent(m.prompt_drop(), { act: 'drop', at })
  return needSeeds(cell)
}

export function placeSolidOk(w: World, at: Coord): boolean {
  if (!inWorld(at, w.owned)) return false
  if (onCell(w.drops, at).length > 0) return false
  const c = w.cell(at)
  return isPlot(c) && (c.kind === 'untilled' || c.kind === 'empty')
}

export function hangarSiteOk(w: World, at: Coord): boolean {
  for (let row = 0; row < HANGAR_H; row++) {
    for (let col = 0; col < HANGAR_W; col++) {
      if (!placeSolidOk(w, { col: at.col + col, row: at.row + row })) return false
    }
  }
  return true
}

export function siloSiteOk(w: World, at: Coord): boolean {
  for (let row = 0; row < SILO_H; row++) {
    for (let col = 0; col < SILO_W; col++) {
      if (!placeSolidOk(w, { col: at.col + col, row: at.row + row })) return false
    }
  }
  return true
}

export function wideSiteOk(w: World, at: Coord): boolean {
  const b = { col: at.col + 1, row: at.row }
  if (!inWorld(at, w.owned) || !inWorld(b, w.owned)) return false
  if (onCell(w.drops, at).length > 0 || onCell(w.drops, b).length > 0) return false
  const a = w.cell(at)
  const c = w.cell(b)
  return (
    isPlot(a) &&
    isPlot(c) &&
    (a.kind === 'untilled' || a.kind === 'empty') &&
    (c.kind === 'untilled' || c.kind === 'empty')
  )
}

export function tallSiteOk(w: World, at: Coord): boolean {
  const b = { col: at.col, row: at.row + 1 }
  if (!inWorld(at, w.owned) || !inWorld(b, w.owned)) return false
  if (onCell(w.drops, at).length > 0 || onCell(w.drops, b).length > 0) return false
  const a = w.cell(at)
  const c = w.cell(b)
  return (
    isPlot(a) &&
    isPlot(c) &&
    (a.kind === 'untilled' || a.kind === 'empty') &&
    (c.kind === 'untilled' || c.kind === 'empty')
  )
}

function canHarvestHand(w: World, crop: CropId, rarity: Rarity): boolean {
  if (w.act.hand.kind === 'empty') return true
  const it = w.act.hand.item
  return it.kind === 'fruit' && it.crop === crop && it.rarity === rarity && it.count < w.stackMax(it)
}

function sameFruitInHand(w: World, crop: CropId, rarity: Rarity): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const it = w.act.hand.item
  return it.kind === 'fruit' && it.crop === crop && it.rarity === rarity
}

function handFullFor(w: World, item: Item): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const held = w.act.hand.item
  if (!countable(held) || !countable(item) || !stackable(held, item)) return false
  return held.count >= w.stackMax(held)
}

function canConsign(hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  const it = hand.item
  if (it.kind === 'fruit') return it.count >= 1
  if (it.kind === 'sugar') return it.liters > 0
  if (it.kind === 'spirit' || it.kind === 'cask' || it.kind === 'jam' || it.kind === 'oil' || it.kind === 'flour' || it.kind === 'extract') {
    return it.count >= 1
  }
  return false
}

export function millLook(mill: Mill, hand: Hand): string {
  const name = m.names_building_mill()
  if (mill.recipe !== 'none' && hand.kind === 'hold') {
    const recipe = millRecipeOf(hand.item)
    if (recipe !== undefined && recipe !== mill.recipe) {
      return labeled(name, m.prompt_only({ product: millProductName(mill.recipe) }))
    }
  }
  if (mill.recipe === 'none') return name
  const need = millNeed(mill.recipe)
  if (mill.units >= need) return labeled(name, m.prompt_full())
  return m.prompt_mill_arrow({ n: mill.units, need, product: millProductName(mill.recipe) })
}

function millDumpOk(mill: Mill, hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  const recipe = millRecipeOf(hand.item)
  if (recipe === undefined) return false
  if (mill.recipe !== 'none' && mill.recipe !== recipe) return false
  return millDumpUnits(hand.item, recipe) > 0
}

export function grindLook(g: Grinder, hand: Hand): string {
  const name = m.names_building_grinder()
  if (g.crop !== 'none' && hand.kind === 'hold') {
    const take = grindAccept(g, hand.item)
    if (fruitCrop(hand.item) !== undefined && take === undefined) {
      return labeled(name, m.prompt_only({ product: cropLabel(g.crop) }))
    }
  }
  if (g.crop === 'none') return name
  if (g.units >= 1) return labeled(name, m.prompt_working_pct({ n: Math.floor(g.progress * 100) }))
  return m.prompt_grind_arrow({ n: g.units })
}

export function stillLook(still: PotStill, hand: Hand): string {
  const name = m.names_building_still()
  const n = feedUnits(still.feed)
  if (still.progress > 0) return labeled(name, m.prompt_working_pct({ n: Math.floor(still.progress * 100) }))
  if (hand.kind === 'hold' && stillCropOf(hand.item) === undefined && fruitCrop(hand.item) !== undefined) {
    return labeled(name, m.prompt_still_feed())
  }
  if (n === STILL_CAP && hand.kind === 'hold' && stillCropOf(hand.item) !== undefined) return labeled(name, m.prompt_full())
  if (n === STILL_CAP) return labeled(name, m.prompt_n_cap_needs_water({ n, cap: STILL_CAP }))
  return labeled(name, m.prompt_n_cap({ n, cap: STILL_CAP }))
}

function stillDumpOk(still: PotStill, hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  if (stillCropOf(hand.item) === undefined) return false
  return feedUnits(still.feed) < STILL_CAP
}

export function barrelCropOf(item: Item): BarrelCrop | undefined {
  const crop = fruitCrop(item)
  return crop === 'grape' || crop === 'apple' ? crop : undefined
}

export function barrelLook(barrel: Barrel, hand: Hand): string {
  const name = m.names_building_barrel()
  const n = feedUnits(barrel.feed)
  const need = barrel.crop === 'none' ? 5 : barrelNeed(barrel.crop)
  if (n === need && barrel.age >= BARREL_MATURE) {
    return labeled(name, m.prompt_aging_d({ n: Math.floor(barrel.age / DAY_SECONDS) }))
  }
  if (n === need) return labeled(name, m.prompt_maturing_pct({ n: Math.floor((barrel.age / BARREL_MATURE) * 100) }))
  if (hand.kind === 'hold' && fruitCrop(hand.item) !== undefined) {
    const crop = barrelCropOf(hand.item)
    if (crop === undefined) return labeled(name, m.prompt_grapes_or_apples())
    if (barrel.crop !== 'none' && crop !== barrel.crop) return labeled(name, m.prompt_crop_s_only({ crop: cropLabel(barrel.crop) }))
    if (n === need) return labeled(name, m.prompt_full())
  }
  if (barrel.crop === 'none') return labeled(name, m.prompt_n_cap({ n, cap: 5 }))
  return labeled(name, m.prompt_n_cap_crop({ n, cap: need, crop: cropLabel(barrel.crop) }))
}

function barrelDumpOk(barrel: Barrel, hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  const crop = barrelCropOf(hand.item)
  if (crop === undefined) return false
  if (barrel.crop !== 'none' && crop !== barrel.crop) return false
  const need = barrelNeed(barrel.crop === 'none' ? crop : barrel.crop)
  return feedUnits(barrel.feed) < need
}

function barrelCollectOk(barrel: Barrel, hand: Hand): boolean {
  if (barrel.crop === 'none' || feedUnits(barrel.feed) !== barrelNeed(barrel.crop) || barrel.age < BARREL_MATURE) return false
  if (hand.kind === 'empty') return true
  return (
    hand.item.kind === 'cask' &&
    hand.item.cask === CASK_OF[barrel.crop] &&
    hand.item.rarity === barrel.feed[0].rarity
  )
}

export function jamLook(jam: JamMachine, hand: Hand): string {
  const name = m.names_building_jam()
  if (jam.fruit >= JAM_IN && jam.sugar >= JAM_SUGAR && jam.crop !== 'none') {
    return labeled(name, m.prompt_working_pct({ n: Math.floor(jam.progress * 100) }))
  }
  if (jam.crop !== 'none' && hand.kind === 'hold') {
    const crop = jamCropOf(hand.item)
    if (crop !== undefined && crop !== jam.crop) return labeled(name, m.prompt_only({ product: jamCropName(jam.crop) }))
  }
  if (jam.crop === 'none' && jam.fruit === 0 && jam.sugar === 0) return name
  const fruitLine =
    jam.crop === 'none' ? undefined : labeled(name, m.prompt_n_cap_crop({ n: jam.fruit, cap: JAM_IN, crop: jamCropName(jam.crop) }))
  const buf = m.prompt_jam_buffer({ sugar: jam.sugar, cap: JAM_BUFFER })
  if (fruitLine !== undefined) return `${fruitLine}\n${buf}`
  return buf
}

function jamFruitOk(jam: JamMachine, hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  const crop = jamCropOf(hand.item)
  if (crop === undefined) return false
  if (jam.crop !== 'none' && jam.crop !== crop) return false
  return true
}

function jamSugarOk(jam: JamMachine, hand: Hand): boolean {
  if (hand.kind !== 'hold' || hand.item.kind !== 'sugar') return false
  return hand.item.liters > 0 && jam.sugar < JAM_BUFFER
}

function feedKind(item: Item): boolean {
  return item.kind === 'fertilizer' || item.kind === 'synth' || item.kind === 'compost'
}

export function compostLine(units: number, progress: number): string {
  const name = m.names_building_compost_box()
  if (units < COMPOST_NEED) return labeled(name, m.prompt_n_cap_units({ n: units, cap: COMPOST_NEED }))
  return labeled(name, m.prompt_working_pct({ n: Math.floor(progress * 100) }))
}

function needSeeds(cell: { kind: string }): Prompt {
  return { kind: 'blocked', text: cell.kind === 'infertile' ? m.prompt_does_not_need_seeds() : m.prompt_need_seeds() }
}

function intent(text: string, i: Intent): Prompt {
  return { kind: 'intent', text, intent: i }
}

function sprinklerSku(s: Sprinkler): SkuId {
  if (s.variant === 'basic') return 'buy-sprinkler'
  if (s.variant === 'vert') return 'buy-sprinkler-vert'
  return 'buy-sprinkler-large'
}

function labeled(name: string, detail: string): string {
  return m.prompt_labeled({ name, detail })
}

export function furnaceLook(furnace: Furnace, hand: Hand): string {
  const name = m.names_building_furnace()
  if (hand.kind === 'hold') {
    if (furnaceUnit(hand.item) <= 0) return labeled(name, m.prompt_will_not_burn())
    if (furnaceAccept(furnace, hand.item) === 0) return labeled(name, m.prompt_full())
  }
  if (furnace.progress >= 1) return labeled(name, m.hud_craft_blocked())
  if (furnace.inn === 1 && furnace.units > 0) return labeled(name, m.hud_craft_paused())
  if (furnace.units >= FURNACE_NEED) return labeled(name, m.prompt_working_pct({ n: Math.floor(furnace.progress * 100) }))
  if (furnace.units === 0) return name
  return labeled(name, m.prompt_n_cap_units({ n: furnace.units, cap: FURNACE_NEED }))
}

export function treeLine(cell: Tree): string {
  const name = m.prompt_tree({ name: cropLabel(cell.species) })
  if (cell.trunk) return labeled(name, m.prompt_trunk())
  if (cell.juvenile < 1) return labeled(name, m.prompt_growing())
  if (cell.yield.kind === 'on') return labeled(name, m.prompt_on_season())
  return labeled(name, m.prompt_off_season())
}
