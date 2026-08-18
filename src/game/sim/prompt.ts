import { SKUS } from '../defs/research.ts'
import type { Rarity } from '../defs/rarity.ts'
import { inWorld, type Coord } from './building.ts'
import { onCell } from './drop.ts'
import type { CropId, SkuId } from './ids.ts'
import { boxAccepts, skuLabel } from './item.ts'
import { isPlot } from './plot.ts'
import type { Intent, World } from './world.ts'

export type Prompt =
  | { kind: 'intent'; text: string; intent: Intent }
  | { kind: 'place'; text: string }
  | { kind: 'blocked'; text: string }

export function placeLabel(id: SkuId): string {
  return skuLabel(id)
}

export function readPrompt(w: World, at: Coord): Prompt {
  if (w.place.kind === 'sku') {
    if (w.money < SKUS[w.place.id].price) return { kind: 'blocked', text: 'Cannot afford' }
    if (w.place.id === 'buy-pumpjack') {
      if (!pumpjackOk(w, at)) return { kind: 'blocked', text: 'Cannot place here' }
      return { kind: 'place', text: 'Place Pumpjack' }
    }
    if (!inWorld(at, w.owned) || !isPlot(w.cell(at))) return { kind: 'blocked', text: 'Cannot place here' }
    return { kind: 'place', text: `Place ${placeLabel(w.place.id)}` }
  }
  if (!inWorld(at, w.owned)) return { kind: 'blocked', text: 'Cannot place here' }
  const cell = w.cell(at)
  if (cell.kind === 'house') return intent('Inventory', { act: 'inventory' })
  if (onCell(w.drops, at).length > 0) return intent('Pick up', { act: 'pickup', at })
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
    return { kind: 'blocked', text: 'Need seeds' }
  }
  if (w.hand.kind === 'hold' && w.hand.item.kind === 'shovel') {
    if (cell.kind === 'rock' || (cell.kind === 'untilled' && cell.ground === 'very-hard')) {
      return { kind: 'blocked', text: 'Need a pickaxe' }
    }
    if (cell.kind === 'shrub' && !cell.ripe) return { kind: 'blocked', text: 'Not ready' }
    if (cell.kind === 'shrub' && cell.ripe) return intent('Dig', { act: 'shovel', at })
    if (cell.kind === 'untilled' && cell.ground === 'hard' && w.hand.item.usesLeft < 2) {
      return { kind: 'blocked', text: 'Cannot dig' }
    }
    if (cell.kind === 'untilled' || cell.kind === 'empty') return intent('Dig', { act: 'shovel', at })
    if (cell.kind === 'growing' || cell.kind === 'ripe') return intent('Dig up plant', { act: 'shovel', at })
    if (cell.kind === 'dead') return intent('Dig out dead plant', { act: 'shovel', at })
    return { kind: 'blocked', text: 'Need seeds' }
  }
  if (w.hand.kind === 'hold' && w.hand.item.kind === 'shrub') {
    if (cell.kind === 'untilled' && cell.ground === 'soft') return intent('Plant', { act: 'plant', at })
  }
  if (w.hand.kind === 'hold' && w.hand.item.kind === 'seeds') {
    if (cell.kind === 'empty') return intent(`Plant ${w.hand.item.crop}`, { act: 'plant', at })
    return { kind: 'blocked', text: 'Need seeds' }
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
  return { kind: 'blocked', text: 'Need seeds' }
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

function intent(text: string, i: Intent): Prompt {
  return { kind: 'intent', text, intent: i }
}
