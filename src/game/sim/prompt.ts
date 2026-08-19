import { SKUS } from '../defs/research.ts'
import type { Rarity } from '../defs/rarity.ts'
import { inWorld, type Coord } from './building.ts'
import { onCell } from './drop.ts'
import type { CropId, SkuId } from './ids.ts'
import { boxAccepts, grindN, skuLabel, type Hand } from './item.ts'
import { aoe, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import { isPlot } from './plot.ts'
import type { Intent, World } from './world.ts'

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

export function placeLabel(id: SkuId): string {
  return skuLabel(id)
}

export function pipePrompt(w: World, e: Edge): Prompt {
  if (w.place.kind !== 'sku' || w.place.id !== 'buy-pipe') return { kind: 'blocked', text: 'Cannot place here' }
  if (w.money < SKUS['buy-pipe'].price) return { kind: 'blocked', text: 'Cannot afford' }
  if (!w.edgeOwned(e) || w.hasPipe(e)) return { kind: 'blocked', text: 'Cannot place here' }
  return { kind: 'place', text: 'Place Pipe' }
}

export function sprinklerPrompt(w: World, s: Sprinkler): Prompt {
  const id = sprinklerSku(s)
  if (w.place.kind !== 'sku' || w.place.id !== id) return { kind: 'blocked', text: 'Cannot place here' }
  if (w.money < SKUS[id].price) return { kind: 'blocked', text: 'Cannot afford' }
  if (!w.vertexOwned(s.at)) return { kind: 'blocked', text: 'Cannot place here' }
  if (w.sprinklerAt(s.at) !== undefined) return { kind: 'blocked', text: 'Cannot place here' }
  if (!aoe(s).every(c => w.inWorld(c))) return { kind: 'blocked', text: 'Cannot place here' }
  if (s.variant === 'basic') return { kind: 'place', text: 'Place Sprinkler' }
  if (s.variant === 'vert') return { kind: 'place', text: 'Place Vertical sprinkler' }
  return { kind: 'place', text: 'Place Large sprinkler' }
}

export function deletePrompt(
  w: World,
  hit: { kind: 'pipe'; edge: Edge } | { kind: 'sprinkler'; at: Vertex },
): Prompt {
  if (w.place.kind !== 'delete') {
    return { kind: 'blocked', text: 'Cannot delete here' }
  }
  if (hit.kind === 'pipe') {
    if (w.edgeOwned(hit.edge) && w.hasPipe(hit.edge)) return { kind: 'place', text: 'Delete pipe' }
    return { kind: 'blocked', text: 'Cannot delete here' }
  }
  if (w.sprinklerAt(hit.at) !== undefined) return { kind: 'place', text: 'Delete sprinkler' }
  return { kind: 'blocked', text: 'Cannot delete here' }
}

export function deleteBuildingPrompt(w: World, at: Coord): Prompt {
  if (w.place.kind !== 'delete') return { kind: 'blocked', text: 'Cannot delete here' }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: 'Cannot delete here' }
  const cell = w.cell(at)
  if (cell.kind === 'pump' && cell.form === 'jack') return { kind: 'place', text: 'Delete pumpjack' }
  if (cell.kind === 'pump' && cell.form === 'well') return { kind: 'place', text: 'Delete well' }
  if (cell.kind === 'chest') return { kind: 'place', text: 'Delete chest' }
  if (cell.kind === 'grinder') return { kind: 'place', text: 'Delete grinder' }
  return { kind: 'blocked', text: 'Cannot delete here' }
}

export function readPromptHit(w: World, hit: PromptHit | undefined): Prompt {
  if (w.place.kind === 'sku' && w.place.id === 'buy-pipe') {
    if (hit === undefined || hit.kind !== 'edge') {
      if (w.money < SKUS['buy-pipe'].price) return { kind: 'blocked', text: 'Cannot afford' }
      return { kind: 'blocked', text: 'Cannot place here' }
    }
    return pipePrompt(w, hit.edge)
  }
  if (
    w.place.kind === 'sku' &&
    (w.place.id === 'buy-sprinkler' ||
      w.place.id === 'buy-sprinkler-vert' ||
      w.place.id === 'buy-sprinkler-large')
  ) {
    if (hit === undefined || hit.kind !== 'sprinkler') {
      if (w.money < SKUS[w.place.id].price) return { kind: 'blocked', text: 'Cannot afford' }
      return { kind: 'blocked', text: 'Cannot place here' }
    }
    return sprinklerPrompt(w, hit.sprinkler)
  }
  if (w.place.kind === 'delete') {
    if (hit !== undefined && hit.kind === 'delete-pipe') return deletePrompt(w, { kind: 'pipe', edge: hit.edge })
    if (hit !== undefined && hit.kind === 'delete-sprinkler') return deletePrompt(w, { kind: 'sprinkler', at: hit.at })
    if (hit !== undefined && hit.kind === 'cell') return deleteBuildingPrompt(w, hit.at)
    return { kind: 'blocked', text: 'Cannot delete here' }
  }
  if (hit === undefined || hit.kind !== 'cell') {
    if (w.place.kind === 'sku') {
      if (w.money < SKUS[w.place.id].price) return { kind: 'blocked', text: 'Cannot afford' }
      return { kind: 'blocked', text: 'Cannot place here' }
    }
    return { kind: 'blocked', text: 'Cannot place here' }
  }
  return readPrompt(w, hit.at)
}

export function readPrompt(w: World, at: Coord): Prompt {
  if (w.place.kind === 'delete') return deleteBuildingPrompt(w, at)
  if (w.place.kind === 'sku') {
    if (
      w.place.id === 'buy-pipe' ||
      w.place.id === 'buy-sprinkler' ||
      w.place.id === 'buy-sprinkler-vert' ||
      w.place.id === 'buy-sprinkler-large'
    ) {
      return readPromptHit(w, undefined)
    }
    if (w.money < SKUS[w.place.id].price) return { kind: 'blocked', text: 'Cannot afford' }
    if (w.place.id === 'buy-pumpjack') {
      if (!pumpjackOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
      return { kind: 'place', text: 'Place Pumpjack' }
    }
    if (w.place.id === 'buy-chest' || w.place.id === 'buy-grinder' || w.place.id === 'buy-well') {
      if (!placeSolidOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
      return { kind: 'place', text: `Place ${placeLabel(w.place.id)}` }
    }
    if (!inWorld(at, w.owned) || !isPlot(w.cell(at))) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: `Place ${placeLabel(w.place.id)}` }
  }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: 'Cannot place here' }
  const cell = w.cell(at)
  if (cell.kind === 'house') return intent('Inventory', { act: 'inventory' })
  if (cell.kind === 'truck') {
    if (canConsign(w.hand)) return intent('Drop off', { act: 'consign' })
    return needSeeds(cell)
  }
  if (onCell(w.drops, at).length > 0) return intent('Pick up', { act: 'pickup', at })
  if (cell.kind === 'chest') return intent('Chest', { act: 'chest', at })
  if (cell.kind === 'grinder') {
    if (grindN(w.hand) > 0) return intent('Grind', { act: 'grind', at })
    return { kind: 'blocked', text: 'Seed grinder' }
  }
  if (cell.kind === 'pump') {
    if (w.hand.kind === 'hold' && w.hand.item.kind === 'container') {
      return intent('Fill', { act: 'fill', at })
    }
    return { kind: 'blocked', text: 'Need a bucket' }
  }
  if (w.hand.kind === 'hold' && w.hand.item.kind === 'pickaxe') {
    if (cell.kind === 'rock') {
      const n = cell.base.w * cell.base.h
      if (n > 1 && w.hand.item.usesLeft < 2) return { kind: 'blocked', text: 'Need a pickaxe' }
      return intent('Mine', { act: 'mine', at })
    }
    if (cell.kind === 'untilled' && cell.ground === 'very-hard') {
      return intent('Mine', { act: 'mine', at })
    }
    return needSeeds(cell)
  }
  if (w.hand.kind === 'hold' && w.hand.item.kind === 'shovel') {
    if (cell.kind === 'rock' || (cell.kind === 'untilled' && cell.ground === 'very-hard')) {
      return { kind: 'blocked', text: 'Need a pickaxe' }
    }
    if (cell.kind === 'shrub') return intent('Dig', { act: 'shovel', at })
    if (cell.kind === 'untilled' && cell.ground === 'hard' && w.hand.item.usesLeft < 2) {
      return { kind: 'blocked', text: 'Cannot dig' }
    }
    if (cell.kind === 'untilled' || cell.kind === 'empty' || cell.kind === 'rotten')
      return intent('Dig', { act: 'shovel', at })
    if (cell.kind === 'growing' || cell.kind === 'ripe') return intent('Dig up plant', { act: 'shovel', at })
    if (cell.kind === 'dead') return intent('Dig out dead plant', { act: 'shovel', at })
    return needSeeds(cell)
  }
  if (w.hand.kind === 'hold' && w.hand.item.kind === 'shrub') {
    if (cell.kind === 'untilled' && cell.ground === 'soft') return intent('Plant', { act: 'plant', at })
  }
  if (w.hand.kind === 'hold' && w.hand.item.kind === 'seeds') {
    if (cell.kind === 'empty') return intent(`Plant ${w.hand.item.crop}`, { act: 'plant', at })
    return needSeeds(cell)
  }
  if (w.hand.kind === 'hold' && w.hand.item.kind === 'container' && (cell.kind === 'growing' || cell.kind === 'ripe')) {
    if (w.hand.item.liters >= 1) return intent('Water', { act: 'water', at })
    return { kind: 'blocked', text: 'Bucket empty' }
  }
  if (cell.kind === 'shrub' && cell.ripe && canHarvestBerry(w)) {
    return intent('Harvest', { act: 'harvest', at })
  }
  if (cell.kind === 'ripe' && canHarvestHand(w, cell.plant.crop, cell.plant.rarity)) {
    return intent('Harvest', { act: 'harvest', at })
  }
  if (w.hand.kind === 'empty') return intent('Move here', { act: 'walk', at })
  if (isPlot(cell)) return intent('Drop', { act: 'drop', at })
  return needSeeds(cell)
}

export function placeSolidOk(w: World, at: Coord): boolean {
  if (!inWorld(at, w.owned)) return false
  if (onCell(w.drops, at).length > 0) return false
  const c = w.cell(at)
  return isPlot(c) && (c.kind === 'untilled' || c.kind === 'empty')
}

export function pumpjackOk(w: World, at: Coord): boolean {
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
  if (w.hand.kind === 'empty') return true
  if (w.hand.item.kind !== 'box') return false
  return boxAccepts(w.hand.item, 'fruit', crop, rarity, 1) > 0
}

function canHarvestBerry(w: World): boolean {
  if (w.hand.kind === 'empty') return true
  if (w.hand.item.kind !== 'box') return false
  const cargo = w.hand.item.cargo
  return cargo.kind === 'empty' || (cargo.kind === 'berry' && cargo.count < w.hand.item.cap)
}

function canConsign(hand: Hand): boolean {
  if (hand.kind !== 'hold') return false
  const it = hand.item
  if (it.kind === 'fruit') return it.count >= 1
  if (it.kind === 'berry') return it.count >= 1
  if (it.kind === 'box' && it.cargo.kind === 'stack' && it.cargo.goods === 'fruit') return it.cargo.stack.count >= 1
  if (it.kind === 'box' && it.cargo.kind === 'berry') return it.cargo.count >= 1
  return false
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
