import {SKUS} from '../defs/research.ts'
import {inWorld, type Coord} from './building.ts'
import {onCell} from './drop.ts'
import type {Rarity} from '../defs/rarity.ts'
import {boxAccepts, skuItem} from './item.ts'
import type {CropId, SkuId} from './ids.ts'
import {isPlot} from './plot.ts'
import type {Intent, World} from './world.ts'

export type Prompt =
    | { kind: 'intent'; text: string; intent: Intent }
    | { kind: 'inventory'; text: 'Inventory' }
    | { kind: 'place'; text: string }
    | { kind: 'blocked'; text: string }

export function placeLabel(id: SkuId): string {
    const made = skuItem(id)
    return itemPlaceName(made)
}

export function readPrompt(w: World, at: Coord): Prompt {
    if (w.place.kind === 'sku') {
        if (!inWorld(at) || !isPlot(w.cell(at))) return {kind: 'blocked', text: 'Cannot place here'}
        if (w.money < SKUS[w.place.id].price) return {kind: 'blocked', text: 'Cannot afford'}
        return {kind: 'place', text: `Place ${placeLabel(w.place.id)}`}
    }
    if (!inWorld(at)) return {kind: 'blocked', text: 'Cannot place here'}
    const cell = w.cell(at)
    if (cell.kind === 'house') return {kind: 'inventory', text: 'Inventory'}
    if (onCell(w.drops, at).length > 0) return intent('Pick up', {act: 'pickup', at})
    if (cell.kind === 'pump') {
        if (w.hand.kind === 'hold' && w.hand.item.kind === 'container') return intent('Fill', {act: 'fill'})
        return {kind: 'blocked', text: 'Need a bucket'}
    }
    if (w.hand.kind === 'hold' && w.hand.item.kind === 'shovel') {
        if (cell.kind === 'untilled' || cell.kind === 'empty') return intent('Dig', {act: 'shovel', at})
        if (cell.kind === 'growing' || cell.kind === 'ripe') return intent('Dig up plant', {act: 'shovel', at})
        return intent('Dig out dead plant', {act: 'shovel', at})
    }
    if (w.hand.kind === 'hold' && w.hand.item.kind === 'seeds') {
        if (cell.kind === 'empty') return intent(`Plant ${w.hand.item.crop}`, {act: 'plant', at})
        return {kind: 'blocked', text: 'Need seeds'}
    }
    if (w.hand.kind === 'hold' && w.hand.item.kind === 'container' && (cell.kind === 'growing' || cell.kind === 'ripe')) {
        if (w.hand.item.liters >= 1) return intent('Water', {act: 'water', at})
        return {kind: 'blocked', text: 'Bucket empty'}
    }
    if (cell.kind === 'ripe' && canHarvestHand(w, cell.plant.crop, cell.plant.rarity)) {
        return intent('Harvest', {act: 'harvest', at})
    }
    if (w.hand.kind === 'empty') return intent('Move here', {act: 'walk', at})
    return {kind: 'blocked', text: 'Need seeds'}
}

function canHarvestHand(w: World, crop: CropId, rarity: Rarity): boolean {
    if (w.hand.kind === 'empty') return true
    if (w.hand.item.kind !== 'box') return false
    return boxAccepts(w.hand.item, 'fruit', crop, rarity, 1) > 0
}

function intent(text: string, i: Intent): Prompt {
    return {kind: 'intent', text, intent: i}
}

function itemPlaceName(made: ReturnType<typeof skuItem>): string {
    if (made.kind === 'pumpjack') return 'pumpjack'
    if (made.kind === 'seeds') return made.crop
    if (made.kind === 'shovel') return made.id
    if (made.kind === 'container') return made.id
    if (made.kind === 'box') return made.cap === 5 ? 'box' : 'large-box'
    return made.crop
}
