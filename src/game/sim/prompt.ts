import type { Rarity } from '../defs/rarity.ts'
import { inWorld, type Coord } from './building.ts'
import { onCell } from './drop.ts'
import type { CropId, SkuId } from './ids.ts'
import { boxAccepts, grindN, organic, skuLabel, type Hand, type Item } from './item.ts'
import { aoe, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import { isFenceSite, isPlot, isTilled, isTileSite } from './plot.ts'
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

export function placeLabel(id: SkuId): string {
  return skuLabel(id)
}

export function pipePrompt(w: World, e: Edge): Prompt {
  if (w.act.place.kind !== 'sku') return { kind: 'blocked', text: 'Cannot place here' }
  const id = w.act.place.id
  if (id !== 'buy-pipe' && id !== 'buy-valve' && id !== 'buy-well') {
    return { kind: 'blocked', text: 'Cannot place here' }
  }
  if (w.money < w.skuPrice(id)) return { kind: 'blocked', text: 'Cannot afford' }
  if (!w.edgeOwned(e)) return { kind: 'blocked', text: 'Cannot place here' }
  if (id === 'buy-pipe') {
    if (w.hasPipe(e) || w.hasWell(e)) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: 'Place Pipe' }
  }
  if (id === 'buy-well') {
    if (w.hasPipe(e) || w.hasWell(e)) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: 'Place Well' }
  }
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
  return { kind: 'blocked', text: 'Cannot delete here' }
}

export function readPromptHit(w: World, hit: PromptHit | undefined): Prompt {
  if (w.act.place.kind === 'sku' && (w.act.place.id === 'buy-pipe' || w.act.place.id === 'buy-valve' || w.act.place.id === 'buy-well')) {
    if (hit === undefined || hit.kind !== 'edge') {
      if (w.money < w.skuPrice(w.act.place.id)) return { kind: 'blocked', text: 'Cannot afford' }
      return { kind: 'blocked', text: 'Cannot place here' }
    }
    return pipePrompt(w, hit.edge)
  }
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'valve') return valvePrompt(w, hit.edge)
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'well') return wellPrompt(w, hit.edge)
  if (w.act.place.kind === 'none' && hit !== undefined && hit.kind === 'sprinkler-hud') {
    return { kind: 'place', text: 'Tune sprinkler' }
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
    if (w.act.place.id === 'buy-pumpjack' || w.act.place.id === 'buy-rain-tank') {
      if (!wideSiteOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
      return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
    }
    if (
      w.act.place.id === 'buy-chest' ||
      w.act.place.id === 'buy-grinder' ||
      w.act.place.id === 'buy-compost-box' ||
      w.act.place.id === 'buy-tap'
    ) {
      if (!placeSolidOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
      return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
    }
    if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
    if (!isPlot(w.cell(at))) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: `Place ${placeLabel(w.act.place.id)}` }
  }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: NOT_OWNED }
  const cell = w.cell(at)
  if (cell.kind === 'house') return intent('Inventory', { act: 'inventory' })
  if (cell.kind === 'truck') {
    if (canConsign(w.act.hand)) return intent('Drop off', { act: 'consign' })
    return needSeeds(cell)
  }
  if (onCell(w.drops, at).length > 0) return intent('Pick up', { act: 'pickup', at })
  if (cell.kind === 'chest') return intent('Chest', { act: 'chest', at })
  if (cell.kind === 'grinder') {
    if (grindN(w.act.hand) > 0) return intent('Grind', { act: 'grind', at })
    return { kind: 'blocked', text: 'Seed grinder' }
  }
  if (cell.kind === 'compost-box') {
    if (w.act.hand.kind === 'hold' && organic(w.act.hand.item)) return intent('Compost', { act: 'compost', at })
    return { kind: 'blocked', text: compostLine(cell.units, cell.progress) }
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
  if (cell.kind === 'ripe' && cell.plant.crop === 'sugar-cane' && canHarvestSugar(w)) {
    return intent('Harvest', { act: 'harvest', at })
  }
  if (cell.kind === 'ripe' && cell.plant.crop !== 'sugar-cane' && canHarvestHand(w, cell.plant.crop, cell.plant.rarity)) {
    return intent('Harvest', { act: 'harvest', at })
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

function canHarvestSugar(w: World): boolean {
  if (w.act.hand.kind === 'empty') return true
  return w.act.hand.item.kind === 'sugar'
}

function canConsign(hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  const it = hand.item
  if (it.kind === 'fruit') return it.count >= 1 && it.crop !== 'sugar-cane'
  if (it.kind === 'sugar') return it.count >= 1
  if (it.kind === 'box' && it.cargo.kind === 'stack' && it.cargo.goods === 'fruit') {
    return it.cargo.stack.count >= 1 && it.cargo.stack.crop !== 'sugar-cane'
  }
  return false
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
