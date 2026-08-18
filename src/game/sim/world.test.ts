import { describe, expect, test } from 'vitest'
import { CROPS } from '../defs/crops.ts'
import { RARITY_SALE } from '../defs/rarity.ts'
import { occupiedCells, HOUSE_BASE, PUMP_BASE } from './building.ts'
import { Plant } from './plant.ts'
import { World } from './world.ts'

describe('beta-1 invariants', () => {
  test('no plant tick across sundown', () => {
    const w = new World()
    w.grid[10][10] = { kind: 'growing', plant: new Plant('carrot', 'common') }
    w.clock.t = 239.999
    const before = (w.grid[10][10] as { plant: Plant }).plant.maturity
    w.tick(1)
    const after = (w.grid[10][10] as { plant: Plant }).plant.maturity
    expect(w.clock.day).toBe(2)
    expect(after).toBe(before)
  })

  test('growth only when hydrated', () => {
    const w = new World()
    const p = new Plant('carrot', 'common')
    p.thirst = 0.2
    w.grid[10][10] = { kind: 'growing', plant: p }
    w.tick(1)
    expect(p.maturity).toBe(0)
  })

  test('thirst 0 kills growing not ripe', () => {
    const w = new World()
    const g = new Plant('carrot', 'common')
    g.thirst = 0.001
    w.grid[10][10] = { kind: 'growing', plant: g }
    for (let n = 0; n < 5; n++) w.tick(1)
    expect(w.grid[10][10].kind).toBe('dead')
    const r = new Plant('carrot', 'common')
    r.maturity = 1
    r.thirst = 0.001
    w.grid[11][10] = { kind: 'ripe', plant: r }
    for (let n = 0; n < 5; n++) w.tick(1)
    expect(w.grid[11][10].kind).toBe('ripe')
  })

  test('watering 1L sets thirst 1', () => {
    const w = new World()
    w.hand = {
      kind: 'hold',
      item: { kind: 'container', id: 'bucket', liters: 2, capacityLiters: 2 },
    }
    const p = new Plant('carrot', 'common')
    p.thirst = 0.4
    w.grid[10][10] = { kind: 'growing', plant: p }
    w.actor.x = 10.5
    w.actor.y = 10.5
    w.click({ col: 10, row: 10 })
    for (let n = 0; n < 12; n++) w.tick(1 / 15)
    expect(p.thirst).toBeGreaterThan(0.9)
    expect(w.hand.kind === 'hold' && w.hand.item.kind === 'container' && w.hand.item.liters).toBe(1)
  })

  test('effectiveSale', () => {
    const w = new World()
    w.modifiers.push({
      id: 'bump-carrot',
      source: 'research',
      crop: 'carrot',
      saleMul: 1.1,
      growSpeed: 1,
      waterUseMul: 1,
    })
    const sale = new Plant('carrot', 'common').stats(w.modifiers).sale
    expect(sale).toBe(CROPS.carrot.sale * RARITY_SALE.common * 1.1)
  })

  test('shovel 0 removes item', () => {
    const w = new World()
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 1, workSeconds: 0 } }
    w.grid[8][8] = { kind: 'untilled' }
    w.actor.x = 8.5
    w.actor.y = 8.5
    w.click({ col: 8, row: 8 })
    w.tick(0.05)
    expect(w.hand.kind).toBe('empty')
    expect(w.grid[8][8].kind).toBe('empty')
  })

  test('house occupies 12 cells, pump one, pumpjack same tiles', () => {
    expect(occupiedCells(HOUSE_BASE)).toHaveLength(12)
    expect(occupiedCells(PUMP_BASE)).toEqual([{ col: 18, row: 1 }])
    const w = new World()
    w.buy('buy-pumpjack')
    expect(w.pump.outputLitersPerSec).toBe(2)
    w.money = 50
    w.done.add('unlock-pumpjack')
    w.buy('buy-pumpjack')
    expect(w.pump.outputLitersPerSec).toBe(5)
    expect(w.grid[1][18]).toBe(w.pump)
  })

  test('hand is one item', () => {
    const w = new World()
    expect(w.hand.kind).toBe('hold')
  })

  test('plant starts thirst 1', () => {
    expect(new Plant('carrot', 'common').thirst).toBe(1)
  })

  test('seed buy merges into inventory', () => {
    const w = new World()
    expect(w.inventory[0]).toEqual({
      kind: 'hold',
      item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 5 },
    })
    expect(w.drops).toHaveLength(1)
    expect(w.drops[0].item.kind).toBe('container')
    expect(w.buy('pack-carrot')).toBeUndefined()
    expect(w.money).toBe(0)
    expect(w.place.kind).toBe('none')
    expect(w.hand.kind === 'hold' && w.hand.item.kind).toBe('shovel')
    const slot = w.inventory[0]
    expect(slot.kind === 'hold' && slot.item.kind === 'seeds' && slot.item.count).toBe(10)
  })
})
