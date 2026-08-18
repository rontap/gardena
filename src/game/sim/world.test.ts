import { describe, expect, test } from 'vitest'
import { CROPS } from '../defs/crops.ts'
import { CONTAINERS } from '../defs/items.ts'
import { RARITY_SALE } from '../defs/rarity.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import type { ResearchId } from './ids.ts'
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
    expect(r.thirst).toBe(0.001)
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
    expect(w.money).toBe(46)
    expect(w.place.kind).toBe('none')
    expect(w.hand.kind === 'hold' && w.hand.item.kind).toBe('shovel')
    const slot = w.inventory[0]
    expect(slot.kind === 'hold' && slot.item.kind === 'seeds' && slot.item.count).toBe(10)
  })
})

describe('beta-2 invariants', () => {
  test('money starts 50 and sundown adds 10 before recap', () => {
    const w = new World()
    w.tick(1 / 15)
    expect(w.money).toBe(50)
    w.clock.t = 239.999
    w.tick(1)
    expect(w.money).toBe(60)
    expect(w.seam.kind).toBe('recap')
    if (w.seam.kind === 'recap') expect(w.seam.recap.money).toBe(60)
  })

  test('bucket 3L large-bucket 8L no can ids', () => {
    expect(CONTAINERS.bucket.capacityLiters).toBe(3)
    expect(CONTAINERS['large-bucket'].capacityLiters).toBe(8)
    expect(Object.keys(CONTAINERS).sort()).toEqual(['bucket', 'large-bucket'])
    expect(Object.keys(SKUS).includes('buy-can')).toBe(false)
    expect(Object.keys(SKUS).includes('buy-can-large')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-can')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-large-can')).toBe(false)
  })

  test('drop and inventory enqueue until arrive', () => {
    const w = new World()
    w.actor.x = 10.5
    w.actor.y = 10.5
    const hand = w.hand
    const drops = w.drops.length
    w.rightClick({ col: 8, row: 8 })
    expect(w.hand).toEqual(hand)
    expect(w.drops).toHaveLength(drops)
    expect(w.queue[0]).toEqual({ act: 'drop', at: { col: 8, row: 8 } })
    w.click({ col: 14, row: 0 })
    expect(w.queue[1]).toEqual({ act: 'inventory' })
    expect(w.cue).toEqual({ kind: 'none' })
    expect(w.hand).toEqual(hand)
  })

  test('compact after buy swap sellSlot', () => {
    const w = new World()
    w.buy('pack-carrot')
    expectPacked(w)
    expect(w.inventory[0]).toEqual({
      kind: 'hold',
      item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 10 },
    })
    w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'carrot', rarity: 'common', count: 2 } }
    w.swap(1)
    w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'carrot', rarity: 'common', count: 3 } }
    w.swap(2)
    expectPacked(w)
    const fruits = w.inventory.filter(s => s.kind === 'hold' && s.item.kind === 'fruit')
    expect(fruits).toHaveLength(1)
    expect(fruits[0].kind === 'hold' && fruits[0].item.kind === 'fruit' && fruits[0].item.count).toBe(5)
    w.sellSlot(1)
    expectPacked(w)
    expect(w.inventory.some(s => s.kind === 'hold' && s.item.kind === 'fruit')).toBe(false)
  })

  test('sellSlot fruit pays count and leaves hand', () => {
    const w = new World()
    const hand = w.hand
    w.inventory[0] = { kind: 'hold', item: { kind: 'fruit', crop: 'carrot', rarity: 'common', count: 3 } }
    const before = w.money
    w.sellSlot(0)
    expect(w.money).toBe(before + new Plant('carrot', 'common').stats(w.modifiers).sale * 3)
    expect(w.inventory[0].kind).toBe('empty')
    expect(w.hand).toEqual(hand)
  })

  test('unlockAll marks every research done and idles job', () => {
    const w = new World()
    w.startResearch('unlock-tomato')
    w.unlockAll()
    ;(Object.keys(RESEARCH) as ResearchId[]).forEach(id => {
      expect(w.done.has(id)).toBe(true)
    })
    expect(w.job).toEqual({ kind: 'idle' })
  })

  test('shovel SKU is 10', () => {
    expect(SKUS['buy-shovel'].price).toBe(10)
  })

  test('dig growing drops seed, dead does not', () => {
    const w = new World()
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.grid[8][8] = { kind: 'growing', plant: new Plant('carrot', 'common') }
    w.actor.x = 8.5
    w.actor.y = 8.5
    w.click({ col: 8, row: 8 })
    w.tick(0.05)
    expect(w.grid[8][8].kind).toBe('empty')
    const seed = w.drops.find(d => d.at.col === 8 && d.at.row === 8)
    expect(seed?.item).toEqual({ kind: 'seeds', crop: 'carrot', rarity: 'common', count: 1 })
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.grid[9][8] = { kind: 'dead', plant: new Plant('carrot', 'common') }
    w.actor.x = 8.5
    w.actor.y = 9.5
    const n = w.drops.length
    w.click({ col: 8, row: 9 })
    w.tick(0.05)
    expect(w.grid[9][8].kind).toBe('empty')
    expect(w.drops).toHaveLength(n)
  })

  test('research costs match table', () => {
    expect(RESEARCH['unlock-tomato']).toMatchObject({ cost: 7, seconds: 30 })
    expect(RESEARCH['unlock-raspberry']).toMatchObject({ cost: 12, seconds: 45 })
    expect(RESEARCH['bump-carrot']).toMatchObject({ cost: 10, seconds: 40 })
    expect(RESEARCH['bump-potato']).toMatchObject({ cost: 10, seconds: 40 })
    expect(RESEARCH['bump-wheat']).toMatchObject({ cost: 12, seconds: 45 })
    expect(RESEARCH['unlock-large-bucket']).toMatchObject({ cost: 10, seconds: 40 })
    expect(RESEARCH['unlock-box']).toMatchObject({ cost: 10, seconds: 35 })
    expect(RESEARCH['unlock-large-box']).toMatchObject({ cost: 17, seconds: 50 })
    expect(RESEARCH['unlock-better-shovel']).toMatchObject({ cost: 12, seconds: 40 })
    expect(RESEARCH['unlock-pumpjack']).toMatchObject({ cost: 20, seconds: 60 })
  })
})

function expectPacked(w: World): void {
  const seen = new Set<string>()
  let empty = false
  w.inventory.forEach(slot => {
    if (slot.kind === 'empty') {
      empty = true
      return
    }
    expect(empty).toBe(false)
    if (slot.item.kind === 'seeds' || slot.item.kind === 'fruit') {
      const key = `${slot.item.kind}:${slot.item.crop}:${slot.item.rarity}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })
}
