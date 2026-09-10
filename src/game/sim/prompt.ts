import { m } from '../../paraglide/messages.js'
import { cropVariety } from '../defs/crops.ts'
import { tierOf, type VarietyId } from '../defs/varieties.ts'
import { inWorld, sortVariety, sorterBase, sorterCells, type Barrel, type Coord, type Facing, type Furnace, type Grinder, type Infuser, type JamMachine, type Mill, type PotStill, type ResearchStation, type Sorter, type Tree } from './building.ts'
import { onCell, topIndex } from './drop.ts'
import type { CropId, JamCrop, MillRecipe, SensorKind, SkuId } from './ids.ts'
import { DAY_SECONDS } from './clock.ts'
import {
  BARREL_MATURE,
  HANGAR_H,
  HANGAR_W,
  MILL_H,
  MILL_W,
  SILO_H,
  SILO_W,
  JAM_BUFFER,
  JAM_IN,
  STATION_IN,
  STILL_CAP,
  FURNACE_BREAD_IN,
  FURNACE_NEED,
  INFUSE_EXTRACT,
  INFUSE_FLAKES,
  INFUSE_IN,
} from '../defs/items.ts'
import { caskName, countable, faceName, jamJar, jamJarName, skuLabel, spiritName, stackable, tierLabel, toolName, type Hand, type Item } from './item.ts'
import {
  barrelAccept,
  barrelCropOf,
  barrelNeed,
  feedUnits,
  feedVariety,
  fruitCrop,
  grindAccept,
  jamCropOf,
  jamFruitAccept,
  jamSugar,
  millAccept,
  millNeed,
  millRecipeOf,
  furnaceAccept,
  furnaceUnit,
  infusableOf,
  sameInfusable,
  stationAccept,
  stillCropOf,
} from './feature-machines/machine.ts'
import { aoe, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import { CASK_OF, CROP_OF_CASK, CROP_OF_SPIRIT, SENSOR_CELL_SKUS } from './ids.ts'
import { isFenceSite, isPavingSite, isPlot, isTilled, type Cell } from './plot.ts'
import { isSensor, isSeqIn, makeSensor, sameNode, skuKind, wouldCycle, type WireEnd } from './sensor.ts'
import { FERT_PLOT_MAX } from './soil.ts'
import { COMPOST_NEED } from '../defs/items.ts'
import { dest } from './queue.ts'
import { openClaim } from './feature-necronomicon/necronomicon.ts'
import { fillable } from './nets.ts'
import { seedPair, waterable } from './feature-field/field.helpers.ts'
import type { Intent, TaskName, World } from './world.ts'

export const NOT_OWNED = m.prompt_not_owned()
export const HAND_FULL = m.prompt_hand_full()
export const QUEUE_FULL = m.prompt_queue_full()

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
  | { kind: 'logic-hud'; at: Coord }
  | { kind: 'variety-hud'; at: Coord }
  | { kind: 'weather-hud'; at: Coord }
  | { kind: 'pressure-hud'; at: Coord }

const CROP_LABEL: { readonly [K in CropId]: () => string } = {
  carrot: m.names_crop_carrot,
  potato: m.names_crop_potato,
  wheat: m.names_crop_wheat,
  tomato: m.names_crop_tomato,
  raspberry: m.names_crop_raspberry,
  grape: m.names_crop_grape,
  vanilla: m.names_crop_vanilla,
  chilli: m.names_crop_chilli,
  'sugar-cane': m.names_crop_sugar_cane,
  grass: m.names_sku_pack_grass,
  apple: m.names_crop_apple,
  apricot: m.names_crop_apricot,
  olive: m.names_crop_olive,
  cherry: m.names_crop_cherry,
}

const SENSOR_LABEL: { readonly [K in SensorKind]: () => string } = {
  lever: m.names_sensor_lever,
  button: m.names_sensor_button,
  lamp: m.names_sensor_lamp,
  logic: m.names_sensor_logic,
  not: m.names_sensor_not,
  pulser: m.names_sensor_pulser,
  counter: m.names_sensor_counter,
  'sensor-water': m.names_sensor_water,
  'sensor-fert': m.names_sensor_fert,
  'sensor-harvest': m.names_sensor_harvest,
  'sensor-day': m.names_sensor_day,
  'sensor-variety': m.names_sensor_variety,
  'sensor-weather': m.names_sensor_weather,
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

export function millProductName(recipe: MillRecipe): string {
  if (recipe === 'sugar-cane') return m.names_item_sugar()
  if (recipe === 'olive') return m.names_item_oil()
  if (recipe === 'wheat') return m.names_item_flour()
  if (recipe === 'vanilla') return m.names_item_vanilla_extract()
  if (recipe === 'chilli') return m.names_item_flakes()
  return m.names_item_extract()
}

export function taskName(w: World, i: Intent): TaskName {
  w.act = w.seats[w.local]
  if (!w.act.actor.inside(dest(i, w))) {
    if (i.act === 'shovel') return m.prompt_move_here_and_dig()
    if (i.act === 'consign') return m.prompt_drop_off()
    return m.prompt_move_here()
  }
  switch (i.act) {
    case 'walk':
      return m.prompt_move_here()
    case 'shovel':
      return m.prompt_dig()
    case 'mine':
      return m.prompt_mine()
    case 'plant':
      return m.prompt_plant_bare()
    case 'water':
      return m.names_face_water()
    case 'fertilize':
      return m.prompt_fertilize()
    case 'compost':
      return m.names_item_compost()
    case 'harvest':
      return m.prompt_harvest()
    case 'fill':
      return m.prompt_fill()
    case 'consign':
      return m.prompt_drop_off()
    case 'pickup':
      return m.prompt_pick_up()
    case 'drop':
      return m.prompt_drop()
    case 'inventory':
      return m.prompt_inventory()
    case 'chest':
      return m.names_building_chest()
    case 'silo':
      return m.names_building_seed_silo()
    case 'additives':
      return m.prompt_additives()
    case 'grind':
      return m.prompt_grind()
    case 'mill':
      return m.names_building_mill()
    case 'still':
      return m.names_building_still()
    case 'furnace':
      return m.names_building_furnace()
    case 'station':
      return m.names_building_station()
    case 'barrel':
      return m.names_building_barrel()
    case 'jam':
      return m.names_building_jam()
    case 'hangar':
      return m.names_building_hangar()
    case 'vehicle': {
      const v = w.vehicles.find(x => x.id === i.id)
      if (v === undefined) throw new Error('vehicle')
      return v.kind === 'tractor' ? m.names_vehicle_tractor() : m.names_vehicle_quad()
    }
    case 'embark':
      return m.vehicles_embark()
    case 'valve':
      return m.names_building_valve()
    case 'toggle': {
      const c = w.cell(i.at)
      return c.kind === 'button' ? m.prompt_press_bare() : m.prompt_flip_bare()
    }
    case 'tend':
      return m.prompt_tend()
    case 'weed-spray':
      return m.prompt_spray()
    case 'chop':
      return m.prompt_chop()
    case 'graft':
      return m.prompt_graft()
    case 'infuse':
      return m.names_building_infuser()
    case 'necronomicon':
      return m.names_building_necronomicon()
  }
}

export function maybeSay(w: World, at: Coord, blocked: string): void {
  if (blocked === HAND_FULL) {
    w.say(HAND_FULL)
    return
  }
  if (usesLeftBlocked(w, at)) return
  if (emptyBucketBlocked(w, at)) return
  const action = primaryAct(w.cell(at))
  if (action === undefined) return
  w.say(m.prompt_cannot_use({ tool: toolName(w.act.hand), action }))
}

function usesLeftBlocked(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const cell = w.cell(at)
  if (w.act.hand.item.kind === 'shovel' && cell.kind === 'untilled' && cell.ground === 'hard' && w.act.hand.item.usesLeft < 2) {
    return true
  }
  if (w.act.hand.item.kind === 'pickaxe' && cell.kind === 'rock') {
    const n = cell.base.w * cell.base.h
    if (n > 1 && w.act.hand.item.usesLeft < 2) return true
  }
  return false
}

function emptyBucketBlocked(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'container' || w.act.hand.item.liters > 0) return false
  return waterable(w.cell(at), w.modifiers)
}

function primaryAct(cell: Cell): string | undefined {
  if (cell.kind === 'ripe') return m.prompt_harvest()
  if (cell.kind === 'growing') return m.names_face_water()
  if (cell.kind === 'weed') return m.prompt_dig()
  if (cell.kind === 'empty') return m.prompt_plant_bare()
  if (cell.kind === 'untilled' && cell.ground === 'very-hard') return m.prompt_mine()
  if (cell.kind === 'untilled') return m.prompt_dig()
  if (cell.kind === 'infertile') return m.prompt_plant_bare()
  if (cell.kind === 'rock') return m.prompt_mine()
  if (cell.kind === 'pump') return m.prompt_fill()
  if (cell.kind === 'grinder') return m.prompt_grind()
  if (cell.kind === 'compost-box') return m.names_item_compost()
  if (cell.kind === 'chest') return m.prompt_open_act()
  if (cell.kind === 'house') return m.prompt_inventory()
  if (cell.kind === 'dead') return m.prompt_dig()
  if (cell.kind === 'rotten') return m.prompt_dig()
  return undefined
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
  if (seg?.gate.kind !== 'valve') return { kind: 'blocked', text: m.prompt_cannot_reach() }
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
    return { kind: 'blocked', text: m.prompt_cannot_demolish() }
  }
  if (hit.kind === 'pipe') {
    const seg = w.segmentAt(hit.edge)
    if (w.edgeOwned(hit.edge) && seg !== undefined) {
      return {
        kind: 'place',
        text: m.prompt_demolish({
          name: (seg.gate.kind === 'valve' ? m.names_building_valve() : m.names_building_pipe()).toLowerCase(),
        }),
      }
    }
    return { kind: 'blocked', text: m.prompt_cannot_demolish() }
  }
  if (w.sprinklerAt(hit.at) !== undefined) {
    return { kind: 'place', text: m.prompt_demolish({ name: m.names_building_sprinkler().toLowerCase() }) }
  }
  return { kind: 'blocked', text: m.prompt_cannot_demolish() }
}

const DELETE_NAME: { readonly [K in string]?: () => string } = {
  'rain-tank': m.names_building_rain_tank,
  tap: m.names_building_tap,
  well: m.names_building_well,
  chest: m.names_building_chest,
  'compost-box': m.names_building_compost_box,
  mill: m.names_building_mill,
  infuser: m.names_building_infuser,
  sorter: m.names_building_sorter,
  still: m.names_building_still,
  furnace: m.names_building_furnace,
  barrel: m.names_building_barrel,
  jam: m.names_building_jam,
  freezer: m.names_building_freezer,
  hangar: m.names_building_hangar,
  'silo-seed': m.names_building_silo_seed,
  'silo-spray': m.names_building_silo_spray,
  'silo-produce': m.names_building_silo_produce,
  lever: m.names_sensor_lever,
  button: m.names_sensor_button,
  lamp: m.names_sensor_lamp,
  logic: m.names_sensor_logic,
  not: m.names_sensor_not,
  pulser: m.names_sensor_pulser,
  counter: m.names_sensor_counter,
  'sensor-water': m.names_sensor_water,
  'sensor-fert': m.names_sensor_fert,
  'sensor-harvest': m.names_sensor_harvest,
  'sensor-day': m.names_sensor_day,
  'sensor-variety': m.names_sensor_variety,
  'sensor-weather': m.names_sensor_weather,
  'water-system': m.names_sensor_water_system,
  'vehicle-detector': m.names_sensor_vehicle_detector,
  'traffic-light': m.names_sensor_traffic_light,
}

export function deleteBuildingPrompt(w: World, at: Coord): Prompt {
  if (w.act.place.kind !== 'delete') return { kind: 'blocked', text: m.prompt_cannot_demolish() }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
  const cell = w.cell(at)
  if (cell.kind === 'pump' && cell.form === 'jack') {
    return { kind: 'place', text: m.prompt_demolish({ name: m.names_face_pumpjack().toLowerCase() }) }
  }
  if (isSensor(cell) && cell.fenceable && w.hasFence(at)) {
    const nameFn = DELETE_NAME[cell.kind]
    if (nameFn === undefined) return { kind: 'blocked', text: m.prompt_cannot_demolish() }
    return { kind: 'place', text: m.prompt_demolish({ name: nameFn().toLowerCase() }) }
  }
  if (w.hasFence(at)) {
    if (w.act.id !== 0) return { kind: 'blocked', text: m.prompt_cannot_demolish() }
    return { kind: 'place', text: m.prompt_demolish({ name: m.names_building_fence().toLowerCase() }) }
  }

  if (cell.kind === 'grinder') return { kind: 'place', text: m.prompt_demolish_grinder() }
  if (cell.kind === 'infuser') return { kind: 'place', text: m.prompt_demolish_infuser() }
  if (cell.kind === 'station') return { kind: 'place', text: m.prompt_demolish_station() }
  if (cell.kind === 'sorter') return { kind: 'place', text: m.prompt_demolish_sorter() }
  if (cell.kind === 'necronomicon') return { kind: 'blocked', text: m.prompt_cannot_demolish_necronomicon() }
  if (cell.kind === 'hangar') {
    const origin = { col: cell.base.col, row: cell.base.row }
    if (w.hangarStores(origin)) return { kind: 'blocked', text: m.prompt_cannot_demolish_stores() }
  }
  const nameFn = DELETE_NAME[cell.kind]
  if (nameFn === undefined) {
    if (w.act.id === 0 && isPlot(cell) && w.pavingAt(at) !== 'none') {
      return { kind: 'place', text: m.prompt_demolish_paving() }
    }
    return { kind: 'blocked', text: m.prompt_cannot_demolish() }
  }
  const name = nameFn()
  return {
    kind: 'place',
    text: m.prompt_demolish({ name: cell.kind === 'not' ? name : name.toLowerCase() }),
  }
}

export function readPromptHit(w: World, hit: PromptHit | undefined): Prompt {
  if (w.act.place.kind === 'wire') {
    const from = w.act.place.from
    if (hit?.kind !== 'port') return { kind: 'blocked', text: m.prompt_cannot_wire() }
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
    if (hit?.kind !== 'edge') {
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
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'logic-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: skuLabel('buy-logic') }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'variety-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: skuLabel('buy-sensor-variety') }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'weather-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: skuLabel('buy-sensor-weather') }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'pressure-hud') {
    return { kind: 'place', text: m.prompt_tune({ name: skuLabel('buy-vehicle-detector') }) }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'port') {
    return { kind: 'place', text: m.prompt_place_bare() }
  }
  if (w.act.place.kind === 'delete' && hit !== undefined && hit.kind === 'delete-wire') {
    return { kind: 'place', text: m.prompt_demolish_wire() }
  }
  if (
    w.act.place.kind === 'sku' &&
    (w.act.place.id === 'buy-sprinkler' ||
      w.act.place.id === 'buy-sprinkler-vert' ||
      w.act.place.id === 'buy-sprinkler-large')
  ) {
    if (hit?.kind !== 'sprinkler') {
      if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: m.prompt_cannot_afford() }
      return { kind: 'blocked', text: m.prompt_cannot_place() }
    }
    return sprinklerPrompt(w, hit.sprinkler)
  }
  if (w.act.place.kind === 'delete') {
    if (hit !== undefined && hit.kind === 'delete-pipe') return deletePrompt(w, { kind: 'pipe', edge: hit.edge })
    if (hit !== undefined && hit.kind === 'delete-sprinkler') return deletePrompt(w, { kind: 'sprinkler', at: hit.at })
    if (hit !== undefined && hit.kind === 'cell') return deleteBuildingPrompt(w, hit.at)
    return { kind: 'blocked', text: m.prompt_cannot_demolish() }
  }
  if (hit?.kind !== 'cell') {
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
      if (!isPavingSite(w.cell(at))) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (w.act.place.id === 'buy-fence') {
      if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
      if (!isFenceSite(w.cell(at))) return { kind: 'blocked', text: m.prompt_fences_need_untilled() }
      if (w.hasFence(at)) return { kind: 'blocked', text: m.prompt_already_fenced() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (
      w.act.place.id === 'buy-pumpjack' ||
      w.act.place.id === 'buy-rain-tank' ||
      w.act.place.id === 'buy-still' ||
      w.act.place.id === 'buy-research-station'
    ) {
      if (!wideSiteOk(w, at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (w.act.place.id === 'buy-furnace') {
      if (!tallSiteOk(w, at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (w.act.place.id === 'buy-mill' || w.act.place.id === 'buy-infuser') {
      if (!squareSiteOk(w, at)) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (w.act.place.id === 'buy-sorter') {
      if (!sorterSiteOk(w, at, w.act.place.facing)) return { kind: 'blocked', text: m.prompt_cannot_place() }
      return { kind: 'place', text: m.prompt_place({ name: placeLabel(w.act.place.id) }) }
    }
    if (
      w.act.place.id === 'buy-chest' ||
      w.act.place.id === 'buy-grinder' ||
      w.act.place.id === 'buy-compost-box' ||
      w.act.place.id === 'buy-tap' ||
      w.act.place.id === 'buy-well' ||
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
      const kind = skuKind(w.act.place.id)
      if (
        kind !== undefined &&
        w.hasFence(at) &&
        !makeSensor(kind, { shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }).fenceable
      ) {
        return { kind: 'blocked', text: m.prompt_cannot_place() }
      }
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
  if (cell.kind === 'silo-seed') return intent(m.names_building_silo_seed(), { act: 'silo', at })
  if (cell.kind === 'silo-spray') return intent(m.names_building_silo_spray(), { act: 'additives', at })
  if (cell.kind === 'silo-produce') return intent(m.names_building_silo_produce(), { act: 'chest', at })
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
    if (w.act.hand.kind === 'hold' && cell.accept(w.act.hand.item) > 0) {
      return intent(m.prompt_grind(), { act: 'grind', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'mill') {
    const look = millLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && cell.accept(w.act.hand.item) > 0) {
      const recipe = millRecipeOf(w.act.hand.item)
      if (recipe !== undefined) {
        if (recipe === 'chilli') return intent(m.prompt_crush_flakes(), { act: 'mill', at })
        const name = millProductName(recipe)
        return intent(m.prompt_crush_into({ name }), { act: 'mill', at })
      }
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'still') {
    const look = stillLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && cell.accept(w.act.hand.item) > 0) {
      return intent(m.prompt_distill(), { act: 'still', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'furnace') {
    const look = furnaceLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && cell.accept(w.act.hand.item) > 0) {
      if (w.act.hand.item.kind === 'flour') return intent(m.prompt_bake(), { act: 'furnace', at })
      return intent(m.prompt_burn(), { act: 'furnace', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'infuser') {
    const look = infuserLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && cell.accept(w.act.hand.item) > 0) {
      return intent(m.prompt_infuse(), { act: 'infuse', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'station') {
    if (w.act.hand.kind === 'hold' && cell.accept(w.act.hand.item) > 0) {
      return intent(m.prompt_station_cut(), { act: 'station', at })
    }
    return intent(stationLook(cell, w.act.hand), { act: 'station', at })
  }
  if (cell.kind === 'necronomicon') {
    if (w.act.hand.kind === 'hold' && openClaim(w, cell, w.act.hand.item) !== undefined) {
      return intent(m.prompt_sacrifice(), { act: 'necronomicon', at })
    }
    return intent(m.prompt_necronomicon_read(), { act: 'necronomicon', at })
  }
  if (cell.kind === 'barrel') {
    const look = barrelLook(cell, w.act.hand)
    if (barrelCollectOk(cell, w.act.hand) && cell.crop !== 'none') {
      const name = caskName(CASK_OF[cell.crop], feedVariety(cell.feed)).toLowerCase()
      return intent(m.prompt_collect({ name }), { act: 'barrel', at })
    }
    if (barrelDumpOk(cell, w.act.hand)) {
      return intent(m.prompt_fill_named({ name: m.names_building_barrel().toLowerCase() }), { act: 'barrel', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'jam') {
    const look = jamLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && cell.accept(w.act.hand.item) > 0) {
      if (w.act.hand.item.kind === 'sugar') {
        return intent(m.prompt_fill_named({ name: m.names_item_sugar().toLowerCase() }), { act: 'jam', at })
      }
      const crop = jamCropOf(w.act.hand.item)
      const variety = w.act.hand.item.kind === 'fruit' ? w.act.hand.item.variety : 'base'
      return intent(jamDumpPrompt(crop, variety), { act: 'jam', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'compost-box') {
    if (w.act.hand.kind === 'hold' && cell.accept(w.act.hand.item) > 0) {
      return intent(m.names_item_compost(), { act: 'compost', at })
    }
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
    if (cell.kind === 'logic') {
      return { kind: 'place', text: m.prompt_tune({ name: skuLabel('buy-logic') }) }
    }
    if (cell.kind === 'sensor-variety') {
      return { kind: 'place', text: m.prompt_tune({ name: skuLabel('buy-sensor-variety') }) }
    }
    if (cell.kind === 'sensor-weather') {
      return { kind: 'place', text: m.prompt_tune({ name: skuLabel('buy-sensor-weather') }) }
    }
    if (cell.kind === 'vehicle-detector') {
      return { kind: 'place', text: m.prompt_tune({ name: skuLabel('buy-vehicle-detector') }) }
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
    if (cell.kind === 'untilled' && cell.cover.kind === 'burrow') {
      return { kind: 'blocked', text: m.names_ground_burrow() }
    }
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'shovel') {
    if (cell.kind === 'rock' || (cell.kind === 'untilled' && cell.ground === 'very-hard')) {
      return { kind: 'blocked', text: m.prompt_need_a({ name: m.names_pickaxe_pickaxe().toLowerCase() }) }
    }
    if (cell.kind === 'tree') return intent(m.prompt_dig(), { act: 'shovel', at })
    if (cell.kind === 'untilled' && cell.cover.kind === 'burrow') {
      return intent(m.prompt_dig(), { act: 'shovel', at })
    }
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
  if (
    w.act.hand.kind === 'hold' &&
    (w.act.hand.item.kind === 'axe' || w.act.hand.item.kind === 'chainsaw')
  ) {
    if (cell.kind === 'tree' && cell.juvenile >= 1 && !cell.trunk) {
      return intent(m.prompt_chop(), { act: 'chop', at })
    }
    if (cell.kind === 'tree') return { kind: 'blocked', text: treeLine(cell) }
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'graft' && w.canGraft(at)) {
    return intent(m.prompt_graft(), { act: 'graft', at })
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'tree-seed') {
    if (seedPair(w, at) !== undefined) {
      return intent(m.prompt_plant({ name: cropLabel(w.act.hand.item.tree) }), { act: 'plant', at })
    }
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'seeds') {
    if (cell.kind === 'empty') {
      if (w.act.hand.item.crop === 'grass') {
        return intent(m.prompt_sow({ name: m.names_ground_grass().toLowerCase() }), { act: 'plant', at })
      }
      return intent(m.prompt_plant({ name: cropLabel(w.act.hand.item.crop) }), { act: 'plant', at })
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
    if (canHarvestHand(w, cell.plant.crop, cell.plant.variety)) return intent(m.prompt_harvest(), { act: 'harvest', at })
    if (sameFruitInHand(w, cell.plant.crop, cell.plant.variety)) return { kind: 'blocked', text: HAND_FULL }
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
  if (c.kind === 'untilled' && c.cover.kind === 'burrow') return false
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

export function squareSiteOk(w: World, at: Coord): boolean {
  for (let row = 0; row < MILL_H; row++) {
    for (let col = 0; col < MILL_W; col++) {
      if (!placeSolidOk(w, { col: at.col + col, row: at.row + row })) return false
    }
  }
  return true
}

export function sorterSiteOk(w: World, at: Coord, facing: Facing): boolean {
  return sorterCells(sorterBase(at, facing)).every(p => placeSolidOk(w, p))
}

export function wideSiteOk(w: World, at: Coord): boolean {
  return placeSolidOk(w, at) && placeSolidOk(w, { col: at.col + 1, row: at.row })
}

export function tallSiteOk(w: World, at: Coord): boolean {
  return placeSolidOk(w, at) && placeSolidOk(w, { col: at.col, row: at.row + 1 })
}

function canHarvestHand(w: World, crop: CropId, variety: VarietyId): boolean {
  if (w.act.hand.kind === 'empty') return true
  const it = w.act.hand.item
  return it.kind === 'fruit' && it.crop === crop && it.variety === variety && it.count < w.stackMax(it)
}

function sameFruitInHand(w: World, crop: CropId, variety: VarietyId): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const it = w.act.hand.item
  return it.kind === 'fruit' && it.crop === crop && it.variety === variety
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
  if (
    it.kind === 'spirit' ||
    it.kind === 'cask' ||
    it.kind === 'jam' ||
    it.kind === 'oil' ||
    it.kind === 'flour' ||
    it.kind === 'extract' ||
    it.kind === 'bread'
  ) {
    return it.count >= 1
  }
  return false
}

export function millLook(mill: Mill, hand: Hand): string {
  const name = m.names_building_mill()
  if (mill.recipe !== 'none' && hand.kind === 'hold') {
    if (millRecipeOf(hand.item) !== undefined && millAccept(mill, hand.item) === undefined) {
      const locked =
        mill.recipe === 'grass' ? millProductName(mill.recipe) : cropVariety(mill.recipe, mill.variety)
      return labeled(name, m.prompt_only({ product: locked }))
    }
  }
  if (mill.recipe === 'none') return name
  const need = millNeed(mill.recipe)
  if (mill.units >= need) return labeled(name, m.prompt_full())
  return m.prompt_mill_arrow({ n: mill.units, need, product: millProductName(mill.recipe) })
}

export function grindLook(g: Grinder, hand: Hand): string {
  const name = m.names_building_grinder()
  if (g.crop !== 'none' && hand.kind === 'hold') {
    const take = grindAccept(g, hand.item)
    if (fruitCrop(hand.item) !== undefined && take === undefined) {
      return labeled(name, m.prompt_only({ product: cropVariety(g.crop, g.variety) }))
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

export function barrelLook(barrel: Barrel, hand: Hand): string {
  const name = m.names_building_barrel()
  const n = feedUnits(barrel.feed)
  const need = barrel.crop === 'none' ? 5 : barrelNeed(barrel.crop)
  if (n === need && barrel.age >= BARREL_MATURE) {
    return labeled(name, m.prompt_aging_d({ n: Math.floor(barrel.age / DAY_SECONDS) }))
  }
  if (n === need) return labeled(name, m.prompt_maturing_pct({ n: Math.floor((barrel.age / BARREL_MATURE) * 100) }))
  if (hand.kind === 'hold' && fruitCrop(hand.item) !== undefined) {
    if (barrelCropOf(hand.item) === undefined) return labeled(name, m.prompt_grapes_or_apples())
    if (barrel.crop !== 'none' && barrelAccept(barrel, hand.item) === undefined) {
      return labeled(name, m.prompt_only({ product: cropVariety(barrel.crop, feedVariety(barrel.feed)) }))
    }
    if (n === need) return labeled(name, m.prompt_full())
  }
  if (barrel.crop === 'none') return labeled(name, m.prompt_n_cap({ n, cap: 5 }))
  return labeled(name, m.prompt_n_cap_crop({ n, cap: need, crop: cropVariety(barrel.crop, feedVariety(barrel.feed)) }))
}

function barrelDumpOk(barrel: Barrel, hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  return barrelAccept(barrel, hand.item) !== undefined
}

function barrelCollectOk(barrel: Barrel, hand: Hand): boolean {
  if (barrel.crop === 'none' || feedUnits(barrel.feed) !== barrelNeed(barrel.crop) || barrel.age < BARREL_MATURE) return false
  if (hand.kind === 'empty') return true
  return (
    hand.item.kind === 'cask' &&
    hand.item.cask === CASK_OF[barrel.crop] &&
    hand.item.variety === feedVariety(barrel.feed)
  )
}

export function jamLook(jam: JamMachine, hand: Hand): string {
  const name = m.names_building_jam()
  if (jam.crop !== 'none' && jam.fruit >= JAM_IN && jam.sugar >= jamSugar(jam.crop, jam.variety)) {
    return labeled(name, m.prompt_working_pct({ n: Math.floor(jam.progress * 100) }))
  }
  if (jam.crop !== 'none' && hand.kind === 'hold') {
    if (jamCropOf(hand.item) !== undefined && jamFruitAccept(jam, hand.item) === 0) {
      return labeled(name, m.prompt_only({ product: cropVariety(jam.crop, jam.variety) }))
    }
  }
  if (jam.crop === 'none' && jam.fruit === 0 && jam.sugar === 0) return name
  const fruitLine =
    jam.crop === 'none'
      ? undefined
      : labeled(name, m.prompt_n_cap_crop({ n: jam.fruit, cap: JAM_IN, crop: jamJarName(jam.crop, jam.variety) }))
  const buf = m.prompt_jam_buffer({ sugar: jam.sugar, cap: JAM_BUFFER })
  if (fruitLine !== undefined) return `${fruitLine}\n${buf}`
  return buf
}

function jamDumpPrompt(crop: JamCrop | undefined, variety: VarietyId): string {
  if (crop === undefined) return m.prompt_make_jam()
  const jar = jamJar(crop, variety)
  if (!jar.named) return m.prompt_make_jam()
  return m.prompt_make({ name: variety === 'base' || variety === 'green-zebra' ? jar.name.toLowerCase() : jar.name })
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

export function stationLook(st: ResearchStation, hand: Hand): string {
  const name = m.prompt_station()
  if (hand.kind === 'hold' && hand.item.kind === 'fruit' && stationAccept(st, hand.item) === undefined) {
    if (hand.item.cut || tierOf(hand.item.variety) !== 'heirloom') {
      return labeled(name, m.prompt_station_refuse())
    }
    if (st.crop !== 'none' && st.units < STATION_IN) {
      return labeled(name, m.prompt_only({ product: cropVariety(st.crop, st.variety) }))
    }
  }
  if (st.progress >= 1) return labeled(name, m.hud_craft_blocked())
  if (st.inn === 1 && st.units > 0) return labeled(name, m.hud_craft_paused())
  if (st.units >= STATION_IN) return labeled(name, m.prompt_working_pct({ n: Math.floor(st.progress * 100) }))
  if (st.crop === 'none') return name
  return labeled(
    name,
    m.prompt_station_filling({
      name: cropVariety(st.crop, st.variety),
      have: st.units,
      need: STATION_IN,
      n: Math.floor(st.quality * 100),
    }),
  )
}

export function furnaceLook(furnace: Furnace, hand: Hand): string {
  const name = m.names_building_furnace()
  if (hand.kind === 'hold') {
    if (hand.item.kind === 'flour') {
      if (furnace.recipe === 'ash') return m.prompt_furnace_lock()
      if (furnaceAccept(furnace, hand.item) === 0) return labeled(name, m.prompt_full())
    } else if (furnaceUnit(hand.item) > 0) {
      if (furnace.recipe === 'bread') return m.prompt_furnace_lock()
      if (furnaceAccept(furnace, hand.item) === 0) return labeled(name, m.prompt_full())
    } else {
      return labeled(name, m.prompt_will_not_burn())
    }
  }
  if (furnace.progress >= 1) return labeled(name, m.hud_craft_blocked())
  if (furnace.inn === 1 && furnace.units > 0) return labeled(name, m.hud_craft_paused())
  if (furnace.recipe === 'bread') {
    if (furnace.units >= FURNACE_BREAD_IN) return labeled(name, m.prompt_working_pct({ n: Math.floor(furnace.progress * 100) }))
    return m.prompt_furnace_bread({ n: furnace.units, need: FURNACE_BREAD_IN })
  }
  if (furnace.units >= FURNACE_NEED) return labeled(name, m.prompt_working_pct({ n: Math.floor(furnace.progress * 100) }))
  if (furnace.units === 0) return name
  return labeled(name, m.prompt_n_cap_units({ n: furnace.units, cap: FURNACE_NEED }))
}

function infuserGoodName(lock: Exclude<Infuser['lock'], 'none'>): string {
  if (lock.kind === 'jam') return jamJarName(lock.crop, lock.variety)
  if (lock.kind === 'cask') return caskName(lock.cask, lock.variety)
  if (lock.kind === 'oil') return m.names_item_oil()
  if (lock.spirit === 'mixed') return spiritName('mixed', 'base')
  return spiritName(lock.spirit, lock.variety)
}

export function infuserLook(inf: Infuser, hand: Hand): string {
  if (hand.kind === 'hold') {
    if (
      (hand.item.kind === 'jam' || hand.item.kind === 'cask' || hand.item.kind === 'spirit' || hand.item.kind === 'oil') &&
      hand.item.infused
    ) {
      return m.prompt_already_infused()
    }
    const lock = infusableOf(hand.item)
    if (lock !== undefined && inf.lock !== 'none' && !sameInfusable(inf.lock, lock)) {
      if (inf.lock.kind === 'oil') return m.prompt_oil_only()
      if (inf.lock.kind === 'spirit' && inf.lock.spirit === 'mixed') return m.prompt_mixed_only()
      if (inf.lock.kind === 'jam') {
        return labeled(m.names_building_infuser(), m.prompt_only({ product: cropVariety(inf.lock.crop, inf.lock.variety) }))
      }
      if (inf.lock.kind === 'cask') {
        return labeled(m.names_building_infuser(), m.prompt_only({ product: cropVariety(CROP_OF_CASK[inf.lock.cask], inf.lock.variety) }))
      }
      return labeled(m.names_building_infuser(), m.prompt_only({ product: cropVariety(CROP_OF_SPIRIT[inf.lock.spirit], inf.lock.variety) }))
    }
  }
  if (inf.progress >= 1) return m.hud_craft_blocked()
  if (inf.inn === 1 && inf.units > 0) return m.hud_craft_paused()
  if (inf.lock !== 'none' && inf.units >= INFUSE_IN && (inf.flakes >= INFUSE_FLAKES || inf.extract >= INFUSE_EXTRACT)) {
    return m.prompt_infuse_working({ n: Math.floor(inf.progress * 100) })
  }
  if (inf.lock === 'none') return m.names_building_infuser()
  if (inf.units < INFUSE_IN) {
    return m.prompt_infuse_arrow({ have: inf.units, need: INFUSE_IN, name: infuserGoodName(inf.lock) })
  }
  if (inf.flakes > 0 || inf.extract === 0) {
    return m.prompt_infuse_flakes({ have: inf.flakes, need: INFUSE_FLAKES })
  }
  return m.prompt_infuse_extract({ have: inf.extract, need: INFUSE_EXTRACT })
}

export function treeLine(cell: Tree): string {
  const name = m.prompt_tree({ name: cropVariety(cell.species, cell.variety) })
  if (cell.trunk) return labeled(name, m.prompt_trunk())
  if (cell.juvenile < 1) return labeled(name, m.prompt_growing())
  if (cell.yield.kind === 'on') return labeled(name, m.prompt_on_season())
  return labeled(name, m.prompt_off_season())
}

export function sorterLook(c: Sorter): string {
  if (c.held === 'none') return m.names_building_sorter()
  const v = sortVariety(c.held)
  const tier = v === undefined ? 'base' : tierOf(v)
  if (c.progress >= 1) {
    return labeled(m.names_building_sorter(), m.prompt_sorter_full({ tier: tierLabel(tier) }))
  }
  return labeled(m.names_building_sorter(), m.prompt_sorter_sorting({ name: faceName(c.held) }))
}
