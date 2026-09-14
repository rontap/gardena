import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import { SHOVELS, SPEECH_S } from '../defs/items.ts'
import { BURROW_MUL } from '../defs/burrow.ts'
import { onCell } from './drop.ts'
import type { GrownCrop, PlantCrop } from './ids.ts'
import { makeShovel, type Item } from './item.ts'
import { Plant, Weed } from './plant.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MAX, SOIL_WATER_MID, Soil, WEED_CHANCE } from './soil.ts'
import { QUEUE_CAP, World } from './world.ts'

const AT = { col: 10, row: 12 }

function ripe(crop: PlantCrop): Plant {
  const p = new Plant(crop, 'base', 0)
  p.maturity = 1
  return p
}

function fruit(crop: GrownCrop, count: number): Extract<Item, { kind: 'fruit' }> {
  return { kind: 'fruit', crop, variety: 'base', quality: 0, count, unitSale: 1, freshness: 1, cut: false }
}

describe('world.queue', () => {
  test('world.queue — Seat.queue length ≤ QUEUE_CAP. Further enqueueOn is a no-op and say(prompt_queue_full). Not Save.', () => {
    const w = new World(1)
    Array.from({ length: QUEUE_CAP }, () => w.enqueue({ act: 'walk', at: AT }))
    expect(w.seats[0].queue).toHaveLength(QUEUE_CAP)
    w.enqueue({ act: 'walk', at: AT })
    expect(w.seats[0].queue).toHaveLength(QUEUE_CAP)
    expect(w.speech).toEqual({ kind: 'say', text: m.prompt_queue_full(), left: SPEECH_S })
  })
})

describe('world.on-arrival', () => {
  test('world.on-arrival - A watered plot and a fertilized plot still read Water / Fertilize and queue. canWater / canFertilize drop the head on arrival with no speech.', () => {
    const w = new World(1)
    w.setCell(AT, { kind: 'empty', soil: new Soil(SOIL_WATER_MAX, FERT_PLOT_MAX, WEED_CHANCE) })
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'container', id: 'bucket', liters: 5, capacityLiters: 5 } }
    const water = w.prompt(AT)
    expect(water.kind === 'intent' && water.intent.act).toBe('water')
    w.click(AT)
    expect(w.seats[0].queue).toHaveLength(1)
    w.tick(1 / 60)
    expect(w.seats[0].queue).toHaveLength(0)
    expect(w.speech.kind).toBe('none')
    expect((w.cell(AT) as { soil: Soil }).soil.water).toBe(SOIL_WATER_MAX)

    w.seats[0].hand = { kind: 'hold', item: { kind: 'fertilizer', liters: 5, capacityLiters: 5 } }
    const feed = w.prompt(AT)
    expect(feed.kind === 'intent' && feed.intent.act).toBe('fertilize')
    w.click(AT)
    w.tick(1 / 60)
    expect(w.seats[0].queue).toHaveLength(0)
    expect(w.speech.kind).toBe('none')
    expect((w.cell(AT) as { soil: Soil }).soil.fertilizer).toBe(FERT_PLOT_MAX)
  })

  test('world.on-arrival - A plot that dries before the gardener arrives is watered by the act that queued while it was full.', () => {
    const w = new World(1)
    w.setCell(AT, { kind: 'empty', soil: new Soil(SOIL_WATER_MAX, FERT_PLOT_MAX, WEED_CHANCE) })
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'container', id: 'bucket', liters: 5, capacityLiters: 5 } }
    w.click(AT)
    ;(w.cell(AT) as { soil: Soil }).soil.water = 0
    Array.from({ length: 40 }, () => w.tick(1 / 60))
    expect((w.cell(AT) as { soil: Soil }).soil.water).toBeGreaterThan(0)
  })
})

describe('inventory.pick-full', () => {
  test('inventory.pick-full - A cell pick-up with a full hand queues, then says NEED_EMPTY_HAND on arrival and sets nothing down. A ground drop still swaps.', () => {
    const w = new World(1)
    w.setCell(AT, { kind: 'weed', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE), weed: new Weed(0) })
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    const p = w.prompt(AT)
    expect(p.kind === 'intent' && p.intent.act).toBe('pickup')
    w.click(AT)
    w.tick(1 / 60)
    expect(w.speech).toEqual({ kind: 'say', text: m.prompt_need_empty_hand(), left: SPEECH_S })
    expect(w.seats[0].hand).toEqual({ kind: 'hold', item: { kind: 'wood', count: 1 } })
    expect(w.cell(AT).kind).toBe('weed')
    expect(onCell(w.drops, AT)).toHaveLength(0)

    const swap = new World(1)
    swap.setCell(AT, { kind: 'empty', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE) })
    swap.seats[0].actor.x = AT.col + 0.5
    swap.seats[0].actor.y = AT.row + 0.5
    swap.drops.push({ at: { ...AT }, item: makeShovel('shovel') })
    swap.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    swap.click(AT)
    swap.tick(1 / 60)
    expect(swap.seats[0].hand.kind === 'hold' && swap.seats[0].hand.item.kind).toBe('shovel')
    expect(onCell(swap.drops, AT).map(d => d.item.kind)).toEqual(['wood'])
  })

  test('inventory.pick-full - A ripe plot reads Harvest with the wrong crop in hand and says NEED_EMPTY_HAND on arrival. The same crop at the stack cap stays blocked My hand is full!.', () => {
    const w = new World(1)
    w.setCell(AT, { kind: 'ripe', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE), plant: ripe('carrot') })
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = { kind: 'hold', item: fruit('tomato', 1) }
    const p = w.prompt(AT)
    expect(p.kind === 'intent' && p.intent.act).toBe('harvest')
    w.click(AT)
    w.tick(1 / 60)
    expect(w.speech).toEqual({ kind: 'say', text: m.prompt_need_empty_hand(), left: SPEECH_S })
    expect(w.cell(AT).kind).toBe('ripe')
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'fruit' && w.seats[0].hand.item.crop).toBe('tomato')

    const full = new World(1)
    full.setCell(AT, { kind: 'ripe', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE), plant: ripe('carrot') })
    const cap = full.stackMax(fruit('carrot', 1))
    full.seats[0].hand = { kind: 'hold', item: fruit('carrot', cap) }
    const blocked = full.prompt(AT)
    expect(blocked.kind).toBe('blocked')
    expect(blocked.text).toBe(m.prompt_hand_full())
  })
})

describe('burrow.dig speed', () => {
  test('Better shovel extract is workSeconds × BURROW_MUL', () => {
    const w = new World(1)
    w.setCell(AT, {
      kind: 'untilled',
      ground: 'soft',
      hardness: 0,
      cover: { kind: 'burrow', loot: { kind: 'treasure', coins: 4 } },
    })
    w.seats[0].hand = { kind: 'hold', item: makeShovel('better-shovel') }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.click(AT)
    w.tick(1 / 60)
    expect(w.seats[0].workTotal).toBe(SHOVELS['better-shovel'].workSeconds * BURROW_MUL)
  })
})
