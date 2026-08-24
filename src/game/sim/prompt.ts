import type { Rarity } from '../defs/rarity.ts'
import { inWorld, type Coord } from './building.ts'
import { onCell } from './drop.ts'
import type { CropId, SensorKind, SkuId } from './ids.ts'
import { DAY_SECONDS } from './clock.ts'
import {
  BARREL_CAP,
  BARREL_MATURE,
  HANGAR_H,
  HANGAR_W,
  SILO_H,
  SILO_W,
  JAM_BUFFER,
  JAM_IN,
  JAM_SUGAR,
  STILL_CAP,
} from '../defs/items.ts'
import type { JamMachine, Mill, PotStill, WineBarrel } from './building.ts'
import { boxAccepts, grindN, organic, skuLabel, type Hand, type Item } from './item.ts'
import {
  feedUnits,
  fruitCrop,
  jamCropName,
  jamCropOf,
  millDumpUnits,
  millNeed,
  millProductName,
  millRecipeOf,
  stillCropOf,
} from './machine.ts'
import { aoe, edgeKey, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import { SENSOR_CELL_SKUS } from './ids.ts'
import { isFenceSite, isPlot, isTilled, isTileSite } from './plot.ts'
import { isSensor, isSeqIn, sameNode, wouldCycle, type SmartHold, type WireEnd } from './sensor.ts'
import { FERT_PLOT_MAX } from './soil.ts'
import { COMPOST_NEED } from '../defs/items.ts'
import { TREE_NAME } from '../defs/trees.ts'
import { fillable, waterable, type Intent, type World } from './world.ts'

export const NOT_OWNED = "I don't own this land"

export type Prompt =
  | { kind: 'intent'; text: string; intent: Intent }
  | { kind: 'place'; text: string }
  | { kind: 'blocked'; text: string }

export type PromptHit =
  | { kind: 'cell'; at: Coord }
  | { kind: 'edge'; edge: Edge }
  | { kind: 'sprinkler'; sprinkler: Sprinkler }
  | { kind: 'delete-pipe'; edge: Edge }
  | { kind: 'delete-well'; edge: Edge }
  | { kind: 'delete-sprinkler'; at: Vertex }
  | { kind: 'valve'; edge: Edge }
  | { kind: 'well'; edge: Edge }
  | { kind: 'sprinkler-hud'; at: Vertex }
  | { kind: 'port'; end: WireEnd }
  | { kind: 'delete-wire'; from: WireEnd; to: WireEnd }
  | { kind: 'smart-valve'; edge: Edge }
  | { kind: 'water-hud'; at: Coord }
  | { kind: 'harvest-hud'; at: Coord }
  | { kind: 'counter-hud'; at: Coord }
  | { kind: 'day-hud'; at: Coord }

export function placeLabel(id: SkuId): string {
  return skuLabel(id)
}

export function pipePrompt(w: World, e: Edge): Prompt {
  if (w.act.place.kind !== 'sku') return { kind: 'blocked', text: 'Cannot place here' }
  const id = w.act.place.id
  if (id !== 'buy-pipe' && id !== 'buy-valve' && id !== 'buy-well' && id !== 'buy-smart-valve') {
    return { kind: 'blocked', text: 'Cannot place here' }
  }
  if (w.money < w.skuPrice(id)) return { kind: 'blocked', text: 'Cannot afford' }
  if (!w.edgeOwned(e)) return { kind: 'blocked', text: 'Cannot place here' }
  if (id === 'buy-pipe') {
    if (w.hasPipe(e) || w.hasWell(e) || w.hasSmart(e)) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: 'Place Pipe' }
  }
  if (id === 'buy-well') {
    if (w.hasPipe(e) || w.hasWell(e) || w.hasSmart(e)) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: 'Place Well' }
  }
  if (id === 'buy-smart-valve') {
    if (w.hasPipe(e) || w.hasWell(e) || w.hasSmart(e)) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: 'Place Smart valve' }
  }
  if (w.hasSmart(e)) return { kind: 'blocked', text: 'Cannot place here' }
  if (!w.hasPipe(e)) return { kind: 'blocked', text: 'Valve needs a pipe' }
  if (w.hasValve(e)) return { kind: 'blocked', text: 'Pipe already has a valve' }
  return { kind: 'place', text: 'Place Manual valve' }
}

export function valveStand(w: World, e: Edge): Coord {
  const near = { col: e.col, row: e.row }
  const far = e.axis === 'h' ? { col: e.col, row: e.row - 1 } : { col: e.col - 1, row: e.row }
  return inWorld(near, w.owned) ? near : far
}

export function valvePrompt(w: World, e: Edge): Prompt {
  const seg = w.segmentAt(e)
  if (seg === undefined || seg.gate.kind !== 'valve') return { kind: 'blocked', text: 'Cannot reach here' }
  return intent(seg.gate.open ? 'Close valve' : 'Open valve', { act: 'valve', at: valveStand(w, e), edge: e })
}

export function wellPrompt(w: World, e: Edge): Prompt {
  if (w.wellAt(e) === undefined) return { kind: 'blocked', text: 'Cannot reach here' }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'container') {
    return intent('Fill', { act: 'fillWell', stand: valveStand(w, e), edge: e })
  }
  return { kind: 'blocked', text: 'Need a bucket' }
}

export function sprinklerPrompt(w: World, s: Sprinkler): Prompt {
  const id = sprinklerSku(s)
  if (w.act.place.kind !== 'sku' || w.act.place.id !== id) return { kind: 'blocked', text: 'Cannot place here' }
  if (w.money < w.skuPrice(id)) return { kind: 'blocked', text: 'Cannot afford' }
  if (!w.vertexOwned(s.at)) return { kind: 'blocked', text: 'Cannot place here' }
  if (w.sprinklerAt(s.at) !== undefined) return { kind: 'blocked', text: 'Cannot place here' }
  if (!aoe(s).every(c => w.inWorld(c))) return { kind: 'blocked', text: 'Cannot place here' }
  if (s.variant === 'basic') return { kind: 'place', text: 'Place Sprinkler' }
  if (s.variant === 'vert') return { kind: 'place', text: 'Place Vertical sprinkler' }
  return { kind: 'place', text: 'Place Large sprinkler' }
}

export function deletePrompt(
  w: World,
  hit: { kind: 'pipe'; edge: Edge } | { kind: 'well'; edge: Edge } | { kind: 'sprinkler'; at: Vertex },
): Prompt {
  if (w.act.place.kind !== 'delete') {
    return { kind: 'blocked', text: 'Cannot delete here' }
  }
  if (hit.kind === 'pipe') {
    const seg = w.segmentAt(hit.edge)
    if (w.edgeOwned(hit.edge) && seg !== undefined) {
      return { kind: 'place', text: seg.gate.kind === 'valve' ? 'Delete valve' : 'Delete pipe' }
    }
    return { kind: 'blocked', text: 'Cannot delete here' }
  }
  if (hit.kind === 'well') {
    if (w.wellAt(hit.edge) !== undefined) return { kind: 'place', text: 'Delete well' }
    return { kind: 'blocked', text: 'Cannot delete here' }
  }
  if (w.sprinklerAt(hit.at) !== undefined) return { kind: 'place', text: 'Delete sprinkler' }
  return { kind: 'blocked', text: 'Cannot delete here' }
}

export function deleteBuildingPrompt(w: World, at: Coord): Prompt {
  if (w.act.place.kind !== 'delete') return { kind: 'blocked', text: 'Cannot delete here' }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
  const cell = w.cell(at)
  if (cell.kind === 'pump' && cell.form === 'jack') return { kind: 'place', text: 'Delete pumpjack' }
  if (cell.kind === 'rain-tank') return { kind: 'place', text: 'Delete rainwater tank' }
  if (cell.kind === 'tap') return { kind: 'place', text: 'Delete tap' }
  if (w.hasFence(at)) return { kind: 'place', text: 'Delete wooden fence' }
  if (cell.kind === 'untilled' && cell.cover.kind === 'tile') return { kind: 'place', text: 'Delete paving' }
  if (cell.kind === 'chest') return { kind: 'place', text: 'Delete chest' }
  if (cell.kind === 'grinder') return { kind: 'place', text: 'Delete grinder' }
  if (cell.kind === 'compost-box') return { kind: 'place', text: 'Delete compost box' }
  if (cell.kind === 'mill') return { kind: 'place', text: 'Delete mill' }
  if (cell.kind === 'still') return { kind: 'place', text: 'Delete pot still' }
  if (cell.kind === 'barrel') return { kind: 'place', text: 'Delete wine barrel' }
  if (cell.kind === 'jam') return { kind: 'place', text: 'Delete jam machine' }
  if (cell.kind === 'freezer') return { kind: 'place', text: 'Delete freezer' }
  if (cell.kind === 'hangar') {
    const origin = { col: cell.base.col, row: cell.base.row }
    if (w.hangarStores(origin)) return { kind: 'blocked', text: 'Cannot delete here (stores a vehicle)' }
    return { kind: 'place', text: 'Delete vehicle hangar' }
  }
  if (cell.kind === 'silo-seed') return { kind: 'place', text: 'Delete seeding silo' }
  if (cell.kind === 'silo-spray') return { kind: 'place', text: 'Delete spraying silo' }
  if (cell.kind === 'silo-produce') return { kind: 'place', text: 'Delete produce silo' }
  if (cell.kind === 'lever') return { kind: 'place', text: 'Delete lever' }
  if (cell.kind === 'button') return { kind: 'place', text: 'Delete button' }
  if (cell.kind === 'lamp') return { kind: 'place', text: 'Delete lamp' }
  if (cell.kind === 'or') return { kind: 'place', text: 'Delete OR gate' }
  if (cell.kind === 'and') return { kind: 'place', text: 'Delete AND gate' }
  if (cell.kind === 'not') return { kind: 'place', text: 'Delete NOT gate' }
  if (cell.kind === 'pulser') return { kind: 'place', text: 'Delete pulser' }
  if (cell.kind === 'counter') return { kind: 'place', text: 'Delete counter' }
  if (cell.kind === 'sensor-water') return { kind: 'place', text: 'Delete water sensor' }
  if (cell.kind === 'sensor-fert') return { kind: 'place', text: 'Delete fertilizer sensor' }
  if (cell.kind === 'sensor-harvest') return { kind: 'place', text: 'Delete harvest sensor' }
  if (cell.kind === 'sensor-day') return { kind: 'place', text: 'Delete day sensor' }
  if (cell.kind === 'water-system') return { kind: 'place', text: 'Delete water-system sensor' }
  if (cell.kind === 'vehicle-detector') return { kind: 'place', text: 'Delete vehicle detector' }
  return { kind: 'blocked', text: 'Cannot delete here' }
}

export function readPromptHit(w: World, hit: PromptHit | undefined): Prompt {
  if (w.act.place.kind === 'wire') {
    const from = w.act.place.from
    if (hit === undefined || hit.kind !== 'port') return { kind: 'blocked', text: 'Cannot wire here' }
    if (hit.end.port === 'out') return { kind: 'blocked', text: 'Cannot wire here' }
    if (w.wires.some(x => sameNode(x.from, from) && sameNode(x.to, hit.end))) {
      return { kind: 'place', text: 'Remove wire' }
    }
    if (
      wouldCycle(w.wires, from, hit.end, end =>
        isSeqIn(end, end.kind === 'cell' && w.inWorld(end.at) ? w.cell(end.at) : undefined),
      )
    ) {
      return { kind: 'blocked', text: 'Cannot loop' }
    }
    return { kind: 'place', text: 'Place' }
  }
  if (w.act.place.kind === 'sku' && (w.act.place.id === 'buy-pipe' || w.act.place.id === 'buy-valve' || w.act.place.id === 'buy-well' || w.act.place.id === 'buy-smart-valve')) {
    if (hit === undefined || hit.kind !== 'edge') {
      if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: 'Cannot afford' }
      return { kind: 'blocked', text: 'Cannot place here' }
    }
    return pipePrompt(w, hit.edge)
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'valve') return valvePrompt(w, hit.edge)
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'smart-valve') {
    const h = w.smartHold.get(edgeKey(hit.edge)) as SmartHold
    return { kind: 'blocked', text: `Smart valve - ${h.level === 1 ? 'on' : 'off'}` }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'well') return wellPrompt(w, hit.edge)
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'sprinkler-hud') {
    return { kind: 'place', text: 'Tune sprinkler' }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'water-hud') {
    return { kind: 'place', text: 'Tune water sensor' }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'harvest-hud') {
    return { kind: 'place', text: 'Tune harvest sensor' }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'counter-hud') {
    return { kind: 'place', text: 'Tune counter' }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'day-hud') {
    return { kind: 'place', text: 'Tune day sensor' }
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'port') {
    return { kind: 'place', text: 'Place' }
  }
  if (w.act.place.kind === 'delete' && hit !== undefined && hit.kind === 'delete-wire') {
    return { kind: 'place', text: 'Delete wire' }
  }
  if (w.act.place.kind === 'delete' && hit !== undefined && hit.kind === 'smart-valve') {
    return { kind: 'place', text: 'Delete smart valve' }
  }
  if (
    w.act.place.kind === 'sku' &&
    (w.act.place.id === 'buy-sprinkler' ||
      w.act.place.id === 'buy-sprinkler-vert' ||
      w.act.place.id === 'buy-sprinkler-large')
  ) {
    if (hit === undefined || hit.kind !== 'sprinkler') {
      if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: 'Cannot afford' }
      return { kind: 'blocked', text: 'Cannot place here' }
    }
    return sprinklerPrompt(w, hit.sprinkler)
  }
  if (w.act.place.kind === 'delete') {
    if (hit !== undefined && hit.kind === 'delete-pipe') return deletePrompt(w, { kind: 'pipe', edge: hit.edge })
    if (hit !== undefined && hit.kind === 'delete-well') return deletePrompt(w, { kind: 'well', edge: hit.edge })
    if (hit !== undefined && hit.kind === 'delete-sprinkler') return deletePrompt(w, { kind: 'sprinkler', at: hit.at })
    if (hit !== undefined && hit.kind === 'cell') return deleteBuildingPrompt(w, hit.at)
    return { kind: 'blocked', text: 'Cannot delete here' }
  }
  if (hit === undefined || hit.kind !== 'cell') {
    if (w.act.place.kind === 'sku') {
      if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: 'Cannot afford' }
      return { kind: 'blocked', text: 'Cannot place here' }
    }
    return { kind: 'blocked', text: 'Cannot place here' }
  }
  return readPrompt(w, hit.at)
}

export function readPrompt(w: World, at: Coord): Prompt {
  if (w.act.place.kind === 'delete') return deleteBuildingPrompt(w, at)
  if (w.act.place.kind === 'sku') {
    if (
      w.act.place.id === 'buy-pipe' ||
      w.act.place.id === 'buy-valve' ||
      w.act.place.id === 'buy-well' ||
      w.act.place.id === 'buy-sprinkler' ||
      w.act.place.id === 'buy-sprinkler-vert' ||
      w.act.place.id === 'buy-sprinkler-large'
    ) {
      return readPromptHit(w, undefined)
    }
    if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: 'Cannot afford' }
    if (
      w.act.place.id === 'buy-tile-paved' ||
      w.act.place.id === 'buy-tile-brick' ||
      w.act.place.id === 'buy-tile-cobble'
    ) {
      if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
      if (!isTileSite(w.cell(at))) return { kind: 'blocked', text: 'Cannot place here' }
      return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
    }
    if (w.act.place.id === 'buy-fence') {
      if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
      if (!isFenceSite(w.cell(at))) return { kind: 'blocked', text: 'Fences need untilled ground' }
      if (w.hasFence(at)) return { kind: 'blocked', text: 'Already fenced' }
      return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
    }
    if (w.act.place.id === 'buy-pumpjack' || w.act.place.id === 'buy-rain-tank' || w.act.place.id === 'buy-still') {
      if (!wideSiteOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
      return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
    }
    if (
      w.act.place.id === 'buy-chest' ||
      w.act.place.id === 'buy-grinder' ||
      w.act.place.id === 'buy-compost-box' ||
      w.act.place.id === 'buy-tap' ||
      w.act.place.id === 'buy-mill' ||
      w.act.place.id === 'buy-jam' ||
      w.act.place.id === 'buy-barrel' ||
      w.act.place.id === 'buy-freezer' ||
      w.act.place.id === 'buy-hangar' ||
      w.act.place.id === 'buy-silo-seed' ||
      w.act.place.id === 'buy-silo-spray' ||
      w.act.place.id === 'buy-silo-produce' ||
      (SENSOR_CELL_SKUS as readonly string[]).includes(w.act.place.id)
    ) {
      if (w.act.place.id === 'buy-hangar') {
        if (!hangarSiteOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
        return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
      }
      if (
        w.act.place.id === 'buy-silo-seed' ||
        w.act.place.id === 'buy-silo-spray' ||
        w.act.place.id === 'buy-silo-produce'
      ) {
        if (!siloSiteOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
        return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
      }
      if (!placeSolidOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
      return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
    }
    if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
    if (!isPlot(w.cell(at))) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
  }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
  const cell = w.cell(at)
  const parked = w.parkedAt(at)
  if (parked !== undefined) return intent(parked.kind === 'tractor' ? 'Tractor' : 'Quad', { act: 'vehicle', id: parked.id })
  if (cell.kind === 'hangar') return intent('Vehicle hangar', { act: 'hangar', at })
  if (cell.kind === 'silo-seed') return { kind: 'blocked', text: 'Seeding silo' }
  if (cell.kind === 'silo-spray') return { kind: 'blocked', text: 'Spraying silo' }
  if (cell.kind === 'silo-produce') return { kind: 'blocked', text: 'Produce silo' }
  if (cell.kind === 'house') return intent('Inventory', { act: 'inventory' })
  if (cell.kind === 'truck') {
    if (canConsign(w.act.hand)) return intent('Drop off', { act: 'consign' })
    return needSeeds(cell)
  }
  if (onCell(w.drops, at).length > 0) return intent('Pick up', { act: 'pickup', at })
  if (cell.kind === 'seed-silo') return intent('Seed silo', { act: 'silo', at })
  if (cell.kind === 'additive-store') return intent('Additives', { act: 'additives', at })
  if (cell.kind === 'chest') return intent('Chest', { act: 'chest', at })
  if (cell.kind === 'freezer') return intent('Freezer', { act: 'chest', at })
  if (cell.kind === 'grinder') {
    if (grindN(w.act.hand) > 0) return intent('Grind', { act: 'grind', at })
    return { kind: 'blocked', text: 'Seed grinder' }
  }
  if (cell.kind === 'mill') {
    const look = millLook(cell, w.act.hand)
    if (w.act.hand.kind === 'hold' && millDumpOk(cell, w.act.hand)) {
      const recipe = millRecipeOf(w.act.hand.item)
      if (recipe !== undefined) {
        const name = millProductName(recipe)
        return intent(name === 'sugar' ? 'Crush into sugar' : `Crush into ${name}`, { act: 'mill', at })
      }
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'still') {
    const look = stillLook(cell, w.act.hand)
    if (stillDumpOk(cell, w.act.hand)) return intent('Distill', { act: 'still', at })
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'barrel') {
    const look = barrelLook(cell, w.act.hand)
    if (barrelCollectOk(cell, w.act.hand)) return intent('Collect wine', { act: 'barrel', at })
    if (barrelDumpOk(cell, w.act.hand)) return intent('Fill barrel', { act: 'barrel', at })
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'jam') {
    const look = jamLook(cell, w.act.hand)
    if (jamSugarOk(cell, w.act.hand)) return intent('Fill sugar', { act: 'jam', at })
    if (w.act.hand.kind === 'hold' && jamFruitOk(cell, w.act.hand)) {
      const crop = jamCropOf(w.act.hand.item)
      return intent(crop === 'tomato' ? 'Make ketchup' : 'Make jam', { act: 'jam', at })
    }
    return { kind: 'blocked', text: look }
  }
  if (cell.kind === 'compost-box') {
    if (w.act.hand.kind === 'hold' && organic(w.act.hand.item)) return intent('Compost', { act: 'compost', at })
    return { kind: 'blocked', text: compostLine(cell.units, cell.progress) }
  }
  if (isSensor(cell)) {
    if (cell.kind === 'lever') return intent('Flip lever', { act: 'toggle', at })
    if (cell.kind === 'button') return intent('Press button', { act: 'toggle', at })
    if (cell.kind === 'sensor-water') return { kind: 'place', text: 'Tune water sensor' }
    if (cell.kind === 'sensor-harvest') return { kind: 'place', text: 'Tune harvest sensor' }
    if (cell.kind === 'counter') return { kind: 'place', text: 'Tune counter' }
    if (cell.kind === 'sensor-day') return { kind: 'place', text: 'Tune day sensor' }
    return { kind: 'blocked', text: lookSensor(cell.kind) }
  }
  if (cell.kind === 'pump' || cell.kind === 'rain-tank' || cell.kind === 'tap') {
    if (!fillable(w, at)) return { kind: 'blocked', text: 'Tap has no water grid' }
    if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'container') {
      return intent('Fill', { act: 'fill', at })
    }
    return { kind: 'blocked', text: 'Need a bucket' }
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'pickaxe') {
    if (cell.kind === 'rock') {
      const n = cell.base.w * cell.base.h
      if (n > 1 && w.act.hand.item.usesLeft < 2) return { kind: 'blocked', text: 'Need a pickaxe' }
      return intent('Mine', { act: 'mine', at })
    }
    if (cell.kind === 'untilled' && cell.ground === 'very-hard') {
      return intent('Mine', { act: 'mine', at })
    }
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'shovel') {
    if (cell.kind === 'rock' || (cell.kind === 'untilled' && cell.ground === 'very-hard')) {
      return { kind: 'blocked', text: 'Need a pickaxe' }
    }
    if (cell.kind === 'tree') return intent('Dig', { act: 'shovel', at })
    if (cell.kind === 'untilled' && cell.ground === 'hard' && w.act.hand.item.usesLeft < 2) {
      return { kind: 'blocked', text: 'Cannot dig' }
    }
    if (cell.kind === 'weed') return intent('Pull weed', { act: 'shovel', at })
    if (cell.kind === 'untilled' || cell.kind === 'empty' || cell.kind === 'rotten')
      return intent('Dig', { act: 'shovel', at })
    if (cell.kind === 'growing' || cell.kind === 'ripe') return intent('Dig up plant', { act: 'shovel', at })
    if (cell.kind === 'dead') return intent('Dig out dead plant', { act: 'shovel', at })
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'sapling') {
    const below = { col: at.col, row: at.row + 1 }
    const a = cell
    const b = w.inWorld(below) ? w.cell(below) : undefined
    if (
      a.kind === 'untilled' &&
      a.ground === 'soft' &&
      a.cover.kind !== 'tile' &&
      b !== undefined &&
      b.kind === 'untilled' &&
      b.ground === 'soft' &&
      b.cover.kind !== 'tile'
    ) {
      return intent(`Plant ${TREE_NAME[w.act.hand.item.tree]}`, { act: 'plant', at })
    }
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'seeds') {
    if (cell.kind === 'empty') return intent(`Plant ${w.act.hand.item.crop}`, { act: 'plant', at })
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'grass-seeds') {
    if (cell.kind === 'empty') return intent('Sow grass', { act: 'plant', at })
    return needSeeds(cell)
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'container' && isTilled(cell)) {
    if (!waterable(cell, w.modifiers)) {
      return { kind: 'blocked', text: cell.soil.drowning ? 'Soil is drowning' : 'Soil is watered' }
    }
    if (w.act.hand.item.liters > 0) return intent('Water', { act: 'water', at })
    return { kind: 'blocked', text: 'Bucket empty' }
  }
  if (w.act.hand.kind === 'hold' && feedKind(w.act.hand.item) && isTilled(cell)) {
    if (cell.soil.fertilizer >= FERT_PLOT_MAX) return { kind: 'blocked', text: 'Soil is fertile' }
    return intent('Fertilize', { act: 'fertilize', at })
  }
  if (w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'weed-spray' && isTilled(cell)) {
    return intent('Spray', { act: 'weed-spray', at })
  }
  if (cell.kind === 'ripe' && canHarvestHand(w, cell.plant.crop, cell.plant.rarity)) {
    return intent('Harvest', { act: 'harvest', at })
  }
  if (cell.kind === 'weed' && w.act.hand.kind === 'hold' && w.act.hand.item.kind === 'box') {
    const box = w.act.hand.item
    const room =
      box.cargo.kind === 'empty'
        ? box.cap
        : box.cargo.kind === 'stack' && box.cargo.goods === 'weed'
          ? box.cap - box.cargo.count
          : 0
    if (room > 0) return intent('Pick up', { act: 'pickup', at })
  }
  if (w.act.hand.kind === 'empty' && (cell.kind === 'weed' || (cell.kind === 'untilled' && cell.cover.kind === 'grass'))) {
    return intent('Pick up', { act: 'pickup', at })
  }
  if (w.canTend(at)) return intent('Tend', { act: 'tend', at })
  if (w.act.hand.kind === 'empty') return intent('Move here', { act: 'walk', at })
  if (isPlot(cell)) return intent('Drop', { act: 'drop', at })
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

function canHarvestHand(w: World, crop: CropId, rarity: Rarity): boolean {
  if (w.act.hand.kind === 'empty') return true
  if (w.act.hand.item.kind !== 'box') return false
  return boxAccepts(w.act.hand.item, 'fruit', crop, rarity, 1) > 0
}

function canConsign(hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  const it = hand.item
  if (it.kind === 'fruit') return it.count >= 1
  if (it.kind === 'sugar') return it.liters > 0
  if (it.kind === 'spirit' || it.kind === 'wine' || it.kind === 'jam' || it.kind === 'oil' || it.kind === 'flour' || it.kind === 'extract') {
    return it.count >= 1
  }
  if (it.kind === 'box' && it.cargo.kind === 'stack' && it.cargo.goods === 'fruit') {
    return it.cargo.stack.count >= 1
  }
  return false
}

export function millLook(mill: Mill, hand: Hand): string {
  if (mill.recipe !== 'none' && hand.kind === 'hold') {
    const recipe = millRecipeOf(hand.item)
    if (recipe !== undefined && recipe !== mill.recipe) return `Mill - ${millProductName(mill.recipe)} only`
  }
  if (mill.recipe === 'none') return 'Mill'
  const need = millNeed(mill.recipe)
  if (mill.units >= need) return 'Mill - full'
  return `${mill.units}/${need} → ${millProductName(mill.recipe)}`
}

function millDumpOk(mill: Mill, hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  const recipe = millRecipeOf(hand.item)
  if (recipe === undefined) return false
  if (mill.recipe !== 'none' && mill.recipe !== recipe) return false
  return millDumpUnits(hand.item, recipe) > 0
}

export function stillLook(still: PotStill, hand: Hand): string {
  const n = feedUnits(still.feed)
  if (still.progress > 0) return `Pot still - working ${Math.floor(still.progress * 100)}%`
  if (hand.kind === 'hold' && stillCropOf(hand.item) === undefined && fruitCrop(hand.item) !== undefined) {
    return 'Pot still - potatoes, wheat or apricot'
  }
  if (n === STILL_CAP && hand.kind === 'hold' && stillCropOf(hand.item) !== undefined) return 'Pot still - full'
  if (n === STILL_CAP) return 'Pot still - 10/10, needs water'
  return `Pot still - ${n}/10`
}

function stillDumpOk(still: PotStill, hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  if (stillCropOf(hand.item) === undefined) return false
  return feedUnits(still.feed) < STILL_CAP
}

export function barrelLook(barrel: WineBarrel, hand: Hand): string {
  const n = feedUnits(barrel.feed)
  if (n === BARREL_CAP && barrel.age >= BARREL_MATURE) return `Wine barrel - aging ${Math.floor(barrel.age / DAY_SECONDS)}d`
  if (n === BARREL_CAP) return `Wine barrel - maturing ${Math.floor((barrel.age / BARREL_MATURE) * 100)}%`
  if (hand.kind === 'hold' && fruitCrop(hand.item) !== undefined && fruitCrop(hand.item) !== 'grape') {
    return 'Wine barrel - grapes'
  }
  if (n === BARREL_CAP && hand.kind === 'hold' && fruitCrop(hand.item) === 'grape') return 'Wine barrel - full'
  return `Wine barrel - ${n}/5`
}

function barrelDumpOk(barrel: WineBarrel, hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  if (fruitCrop(hand.item) !== 'grape') return false
  return feedUnits(barrel.feed) < BARREL_CAP
}

function barrelCollectOk(barrel: WineBarrel, hand: Hand): boolean {
  if (feedUnits(barrel.feed) !== BARREL_CAP || barrel.age < BARREL_MATURE) return false
  if (hand.kind === 'empty') return true
  return hand.item.kind === 'wine' && hand.item.rarity === barrel.feed[0].rarity
}

export function jamLook(jam: JamMachine, hand: Hand): string {
  if (jam.fruit >= JAM_IN && jam.sugar >= JAM_SUGAR && jam.crop !== 'none') {
    return `Jam machine - working ${Math.floor(jam.progress * 100)}%`
  }
  if (jam.crop !== 'none' && hand.kind === 'hold') {
    const crop = jamCropOf(hand.item)
    if (crop !== undefined && crop !== jam.crop) return `Jam machine - ${jamCropName(jam.crop)} only`
  }
  if (jam.crop === 'none' && jam.fruit === 0 && jam.sugar === 0) return 'Jam machine'
  const fruitLine =
    jam.crop === 'none' ? undefined : `Jam machine - ${jam.fruit}/5 ${jamCropName(jam.crop)}`
  const buf = `${jam.sugar}L / ${JAM_BUFFER}L`
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

function compostLine(units: number, progress: number): string {
  if (units < COMPOST_NEED) return `Compost box - ${units}/${COMPOST_NEED} units`
  return `Compost box - working ${Math.floor(progress * 100)}%`
}

function needSeeds(cell: { kind: string }): Prompt {
  return { kind: 'blocked', text: cell.kind === 'infertile' ? 'does not need seeds' : 'Need seeds' }
}

function intent(text: string, i: Intent): Prompt {
  return { kind: 'intent', text, intent: i }
}

function sprinklerSku(s: Sprinkler): SkuId {
  if (s.variant === 'basic') return 'buy-sprinkler'
  if (s.variant === 'vert') return 'buy-sprinkler-vert'
  return 'buy-sprinkler-large'
}

function lookSensor(k: SensorKind): string {
  if (k === 'lever') return 'Lever'
  if (k === 'button') return 'Button'
  if (k === 'lamp') return 'Lamp'
  if (k === 'or') return 'OR gate'
  if (k === 'and') return 'AND gate'
  if (k === 'not') return 'NOT gate'
  if (k === 'pulser') return 'Pulser'
  if (k === 'counter') return 'Counter'
  if (k === 'sensor-water') return 'Water sensor'
  if (k === 'sensor-fert') return 'Fertilizer sensor'
  if (k === 'sensor-harvest') return 'Harvest sensor'
  if (k === 'sensor-day') return 'Day sensor'
  if (k === 'water-system') return 'Water-system sensor'
  return 'Vehicle detector'
}
