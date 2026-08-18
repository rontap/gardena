import { describe, expect, test } from 'vitest'
import { CROPS, PLANT_THIRST } from '../defs/crops.ts'
import { CONTAINERS, GRIND_MAX, GRIND_MIN, GRIND_WORK } from '../defs/items.ts'
import { BERRY_SALE, RARITY_SALE, RARITY_WEIGHT } from '../defs/rarity.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import type { ResearchId } from './ids.ts'
import { Chest, Grinder, HOUSE_BASE, PUMP_BASE, occupiedCells } from './building.ts'
import { itemLine, makePickaxe, makeShovel, skuLabel } from './item.ts'
import { Plant } from './plant.ts'
import { Rock, Shrub } from './building.ts'
import { hash } from './rng.ts'
import { World } from './world.ts'

const HOME = [{ cx: 0, cy: 0 }]
const AT = { col: 10, row: 12 }

describe('beta-1 invariants', () => {
  test('no plant tick across sundown', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', plant: new Plant('carrot', 'common') })
    w.clock.t = 239.999
    const before = (w.cell(AT) as { plant: Plant }).plant.maturity
    w.tick(1)
    const after = (w.cell(AT) as { plant: Plant }).plant.maturity
    expect(w.clock.day).toBe(2)
    expect(after).toBe(before)
  })

  test('growth only when hydrated', () => {
    const w = new World()
    const p = new Plant('carrot', 'common')
    p.thirst = 0.2
    w.setCell(AT, { kind: 'growing', plant: p })
    w.tick(1)
    expect(p.maturity).toBe(0)
  })

  test('thirst 0 kills growing not ripe', () => {
    const w = new World()
    const g = new Plant('carrot', 'common')
    g.thirst = 0.001
    w.setCell(AT, { kind: 'growing', plant: g })
    for (let n = 0; n < 5; n++) w.tick(1)
    expect(w.cell(AT).kind).toBe('dead')
    const r = new Plant('carrot', 'common')
    r.maturity = 1
    r.thirst = 0.001
    const ripe = { col: 11, row: 12 }
    w.setCell(ripe, { kind: 'ripe', plant: r })
    for (let n = 0; n < 5; n++) w.tick(1)
    expect(w.cell(ripe).kind).toBe('ripe')
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
    w.setCell(AT, { kind: 'growing', plant: p })
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
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
    w.setCell(AT, { kind: 'untilled', ground: 'soft' })
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.hand.kind).toBe('empty')
    expect(w.cell(AT).kind).toBe('empty')
  })

  test('house occupies 12 cells, pump one, pumpjack does not mutate starter', () => {
    expect(occupiedCells(HOUSE_BASE, HOME)).toHaveLength(12)
    expect(occupiedCells(PUMP_BASE, HOME)).toEqual([{ col: 18, row: 7 }])
    const w = new World()
    w.buy('buy-pumpjack')
    expect(w.pump.outputLitersPerSec).toBe(2)
    w.money = 50
    w.done.add('unlock-pumpjack')
    w.buy('buy-pumpjack')
    expect(w.place.kind).toBe('sku')
    expect(w.pump.outputLitersPerSec).toBe(2)
    w.setCell(AT, { kind: 'untilled', ground: 'soft' })
    w.setCell({ col: 11, row: 12 }, { kind: 'untilled', ground: 'soft' })
    w.confirmPlace(AT)
    expect(w.pumps).toHaveLength(2)
    expect(w.pumps[1].outputLitersPerSec).toBe(2)
    expect(w.pump.outputLitersPerSec).toBe(2)
    expect(w.cell(AT).kind).toBe('pump')
  })

  test('hand is one item', () => {
    const w = new World()
    expect(w.hand.kind).toBe('hold')
  })

  test('plant starts thirst 0.75', () => {
    expect(new Plant('carrot', 'common').thirst).toBe(PLANT_THIRST)
    expect(PLANT_THIRST).toBe(0.75)
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
    expect(w.money).toBe(47)
    expect(w.place.kind).toBe('none')
    expect(w.hand.kind === 'hold' && w.hand.item.kind).toBe('shovel')
    const slot = w.inventory[0]
    expect(slot.kind === 'hold' && slot.item.kind === 'seeds' && slot.item.count).toBe(10)
  })
})

describe('beta-2 invariants', () => {
  test('money starts 50 and sundown adds 10 then tax', () => {
    const w = new World()
    w.tick(1 / 15)
    expect(w.money).toBe(50)
    w.clock.t = 239.999
    w.tick(1)
    expect(w.money).toBe(58)
    expect(w.seam.kind).toBe('recap')
    if (w.seam.kind === 'recap') {
      expect(w.seam.recap.money).toBe(58)
      expect(w.seam.recap.tax).toBe(2)
    }
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
    w.actor.y = 12.5
    const hand = w.hand
    const drops = w.drops.length
    w.setCell({ col: 8, row: 12 }, { kind: 'untilled', ground: 'soft' })
    w.rightClick({ col: 8, row: 12 })
    expect(w.hand).toEqual(hand)
    expect(w.drops).toHaveLength(drops)
    expect(w.queue[0]).toEqual({ act: 'drop', at: { col: 8, row: 12 } })
    w.click({ col: 14, row: 6 })
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
    const money = w.money
    w.unlockAll()
    ;(Object.keys(RESEARCH) as ResearchId[]).forEach(id => {
      expect(w.done.has(id)).toBe(true)
    })
    expect(w.job).toEqual({ kind: 'idle' })
    expect(w.money).toBe(money + 999)
  })

  test('shovel SKU is 10', () => {
    expect(SKUS['buy-shovel'].price).toBe(10)
  })

  test('dig growing drops seed, dead does not', () => {
    const w = new World()
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.setCell(AT, { kind: 'growing', plant: new Plant('carrot', 'common') })
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT).kind).toBe('empty')
    const seed = w.drops.find(d => d.at.col === 10 && d.at.row === 12)
    expect(seed?.item).toEqual({ kind: 'seeds', crop: 'carrot', rarity: 'common', count: 1 })
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    const dead = { col: 10, row: 13 }
    w.setCell(dead, { kind: 'dead', plant: new Plant('carrot', 'common') })
    w.actor.x = 10.5
    w.actor.y = 13.5
    const n = w.drops.length
    w.click(dead)
    w.tick(0.05)
    expect(w.cell(dead).kind).toBe('empty')
    expect(w.drops).toHaveLength(n)
  })

  test('research costs match table', () => {
    expect(RESEARCH['unlock-tomato']).toMatchObject({ cost: 7, seconds: 30 })
    expect(RESEARCH['unlock-raspberry']).toMatchObject({ cost: 12, seconds: 45 })
    expect(RESEARCH['bump-carrot']).toMatchObject({ cost: 10, seconds: 40 })
    expect(RESEARCH['bump-potato']).toMatchObject({ cost: 10, seconds: 40 })
    expect(RESEARCH['bump-wheat']).toMatchObject({ cost: 12, seconds: 45 })
    expect(RESEARCH['unlock-better-tools']).toMatchObject({ cost: 16, seconds: 45 })
    expect(RESEARCH['unlock-large-box']).toMatchObject({ cost: 17, seconds: 50 })
    expect(RESEARCH['unlock-pumpjack']).toMatchObject({ cost: 20, seconds: 60 })
    expect(RESEARCH['unlock-expand']).toMatchObject({ cost: 15, seconds: 45 })
    expect(RESEARCH['unlock-pickaxe']).toMatchObject({ cost: 0, seconds: 40 })
  })
})

describe('beta-3 invariants', () => {
  test('starter 32x32 house door pump', () => {
    const w = new World()
    const b = w.bounds()
    expect(b).toEqual({ col0: 0, row0: 0, col1: 32, row1: 32 })
    expect(w.cell({ col: 14, row: 6 }).kind).toBe('house')
    expect(w.cell({ col: 17, row: 8 }).kind).toBe('house')
    expect(w.cell({ col: 15, row: 9 }).kind).not.toBe('house')
    expect(w.cell({ col: 18, row: 7 }).kind).toBe('pump')
    expect(w.pump.outputLitersPerSec).toBe(2)
  })

  test('expand price tax seam may go negative', () => {
    const w = new World()
    expect(w.expandPrice()).toBe(40)
    expect(w.tax()).toBe(2)
    w.done.add('unlock-expand')
    w.money = 40
    w.expand({ cx: 0, cy: -1 })
    expect(w.owned).toHaveLength(2)
    expect(w.expandPrice()).toBe(55)
    expect(w.tax()).toBe(8)
    expect(w.money).toBe(0)
    w.clock.t = 239.999
    w.tick(1)
    expect(w.money).toBe(2)
    w.money = -5
    w.seam = { kind: 'play' }
    w.clock.t = 239.999
    w.tick(1)
    expect(w.money).toBeLessThan(0)
  })

  test('expand no-op if locked poor owned not neighbor', () => {
    const w = new World()
    const money = w.money
    w.expand({ cx: 0, cy: -1 })
    expect(w.owned).toHaveLength(1)
    w.done.add('unlock-expand')
    w.money = 10
    w.expand({ cx: 0, cy: -1 })
    expect(w.owned).toHaveLength(1)
    w.money = 200
    w.expand({ cx: 2, cy: 2 })
    expect(w.owned).toHaveLength(1)
    w.expand({ cx: 0, cy: 0 })
    expect(w.owned).toHaveLength(1)
    expect(w.money).toBe(200)
    w.expand({ cx: 1, cy: 0 })
    expect(w.owned).toHaveLength(2)
    expect(money).toBe(50)
  })

  test('hard shovel 2 uses 2x time; poor uses no-op', () => {
    const w = new World()
    w.hand = makeShovel('shovel') as never
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 5, workSeconds: 1 } }
    w.setCell(AT, { kind: 'untilled', ground: 'hard' })
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.actor.x = 4.5
    w.actor.y = 4.5
    w.click(AT)
    expect(w.taskName(w.queue[0])).toBe('Move here and dig')
    w.actor.x = 10.5
    w.actor.y = 12.5
    for (let i = 0; i < 20; i++) w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('untilled')
    for (let i = 0; i < 20; i++) w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('empty')
    expect(w.hand.kind === 'hold' && w.hand.item.kind === 'shovel' && w.hand.item.usesLeft).toBe(3)
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 1, workSeconds: 1 } }
    const hard = { col: 10, row: 14 }
    w.setCell(hard, { kind: 'untilled', ground: 'hard' })
    w.actor.x = 10.5
    w.actor.y = 14.5
    w.click(hard)
    expect(w.queue).toHaveLength(0)
    expect(w.cell(hard).kind).toBe('untilled')
    expect(w.hand.kind === 'hold' && w.hand.item.kind === 'shovel' && w.hand.item.usesLeft).toBe(1)
  })

  test('very-hard and rock refuse shovel', () => {
    const w = new World()
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.setCell(AT, { kind: 'untilled', ground: 'very-hard' })
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    expect(w.queue).toHaveLength(0)
    expect(w.cell(AT).kind).toBe('untilled')
    w.setCell(AT, new Rock({ shape: 'rect', col: 10, row: 12, w: 1, h: 1 }))
    w.click(AT)
    expect(w.queue).toHaveLength(0)
    expect(w.cell(AT).kind).toBe('rock')
  })

  test('pickaxe turns very-hard into infertile', () => {
    const w = new World()
    w.hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    w.setCell(AT, { kind: 'untilled', ground: 'very-hard' })
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    for (let i = 0; i < 70; i++) w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('infertile')
    w.hand = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 1 } }
    w.click(AT)
    expect(w.queue).toHaveLength(0)
    expect(w.cell(AT).kind).toBe('infertile')
  })

  test('pickaxe mines 1x1 and 1x2', () => {
    const w = new World()
    w.hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    w.setCell(AT, new Rock({ shape: 'rect', col: 10, row: 12, w: 1, h: 1 }))
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    for (let i = 0; i < 130; i++) w.tick(1 / 15)
    expect(w.cell(AT)).toEqual({ kind: 'untilled', ground: 'soft' })
    expect(w.hand.kind === 'hold' && w.hand.item.kind === 'pickaxe' && w.hand.item.usesLeft).toBe(24)
    const a = { col: 10, row: 16 }
    const b = { col: 10, row: 17 }
    const rock = new Rock({ shape: 'rect', col: 10, row: 16, w: 1, h: 2 })
    w.setCell(a, rock)
    w.setCell(b, rock)
    w.actor.x = 10.5
    w.actor.y = 16.5
    w.click(a)
    for (let i = 0; i < 250; i++) w.tick(1 / 15)
    expect(w.cell(a)).toEqual({ kind: 'untilled', ground: 'soft' })
    expect(w.cell(b)).toEqual({ kind: 'untilled', ground: 'soft' })
    expect(w.hand.kind === 'hold' && w.hand.item.kind === 'pickaxe' && w.hand.item.usesLeft).toBe(22)
  })

  test('same seed same map; fixture 1-3 shrubs', () => {
    const a = new World(2)
    const b = new World(2)
    const cellsA: string[] = []
    const cellsB: string[] = []
    let shrubs = 0
    a.forEachCell((at, c) => {
      cellsA.push(`${at.col},${at.row}:${c.kind}`)
      if (c.kind === 'shrub') shrubs += 1
    })
    b.forEachCell((at, c) => {
      cellsB.push(`${at.col},${at.row}:${c.kind}`)
    })
    expect(cellsA).toEqual(cellsB)
    expect(shrubs).toBeGreaterThanOrEqual(1)
    expect(shrubs).toBeLessThanOrEqual(6)
    const c = new World(3)
    const cellsC: string[] = []
    c.forEachCell((at, cell) => {
      cellsC.push(`${at.col},${at.row}:${cell.kind}`)
    })
    expect(cellsC).not.toEqual(cellsA)
  })

  test('no specials within 8 of door', () => {
    const w = new World(2)
    w.forEachCell((at, c) => {
      if (Math.hypot(at.col + 0.5 - 15.5, at.row + 0.5 - 9.5) >= 8) return
      expect(c.kind).not.toBe('rock')
      expect(c.kind).not.toBe('shrub')
      if (c.kind === 'untilled') expect(c.ground).toBe('soft')
    })
  })

  test('harvest berry cycles; shovel ripe extracts', () => {
    const w = new World()
    const shrub = new Shrub(true, 1)
    w.setCell(AT, shrub)
    w.hand = { kind: 'empty' }
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    for (let i = 0; i < 12; i++) w.tick(1 / 15)
    expect(w.hand.kind === 'hold' && w.hand.item.kind).toBe('berry')
    expect(w.cell(AT).kind === 'shrub' && (w.cell(AT) as Shrub).ripe).toBe(false)
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    ;(w.cell(AT) as Shrub).ripe = true
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT)).toEqual({ kind: 'untilled', ground: 'soft' })
    expect(w.drops.some(d => d.item.kind === 'shrub')).toBe(true)
  })

  test('pickaxe sku 20 gated on unlock-pickaxe; rarity table', () => {
    expect(SKUS['buy-pickaxe'].price).toBe(18)
    expect(SKUS['buy-pickaxe'].unlock).toBe('unlock-pickaxe')
    expect(SKUS['buy-better-pickaxe'].unlock).toBe('unlock-pickaxe')
    expect(RARITY_SALE).toEqual({ common: 1, uncommon: 1.25, rare: 2, heirloom: 3.5 })
    expect(RARITY_WEIGHT).toEqual({ common: 0.55, uncommon: 0.35, rare: 0.09, heirloom: 0.01 })
    expect(BERRY_SALE).toBe(2)
  })

  test('walk onto rock is legal', () => {
    const w = new World()
    w.setCell(AT, new Rock({ shape: 'rect', col: 10, row: 12, w: 1, h: 1 }))
    w.hand = { kind: 'empty' }
    w.actor.x = 4.5
    w.actor.y = 4.5
    w.click(AT)
    expect(w.queue[0]).toEqual({ act: 'walk', at: AT })
    for (let i = 0; i < 40; i++) w.tick(1 / 15)
    expect(w.actor.inside(AT)).toBe(true)
  })
})

describe('beta-4 invariants', () => {
  test('immature shrub plus shovel extracts', () => {
    const w = new World()
    w.setCell(AT, new Shrub(false, 0.2))
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT)).toEqual({ kind: 'untilled', ground: 'soft' })
    expect(w.drops.some(d => d.at.col === AT.col && d.at.row === AT.row && d.item.kind === 'shrub')).toBe(true)
  })

  test('buy-chest place 1x1 own slots', () => {
    expect(SKUS['buy-chest'].price).toBe(18)
    expect(RESEARCH['unlock-chest'].cost).toBe(12)
    const w = new World()
    w.done.add('unlock-chest')
    const a = { col: 10, row: 12 }
    const b = { col: 11, row: 12 }
    w.setCell(a, { kind: 'empty' })
    w.setCell(b, { kind: 'empty' })
    w.buy('buy-chest')
    w.confirmPlace(a)
    w.buy('buy-chest')
    w.confirmPlace(b)
    const ca = w.cell(a)
    const cb = w.cell(b)
    expect(ca.kind).toBe('chest')
    expect(cb.kind).toBe('chest')
    expect(ca).toBeInstanceOf(Chest)
    expect(cb).toBeInstanceOf(Chest)
    if (ca.kind !== 'chest' || cb.kind !== 'chest') return
    expect(ca.base).toEqual({ shape: 'rect', col: 10, row: 12, w: 1, h: 1 })
    expect(ca.slots).toHaveLength(9)
    expect(cb.slots).toHaveLength(9)
    expect(ca.slots.every(s => s.kind === 'empty')).toBe(true)
    expect(ca.slots).not.toBe(cb.slots)
    ca.slots[0] = { kind: 'hold', item: { kind: 'shrub' } }
    expect(cb.slots[0].kind).toBe('empty')
  })

  test('hand fruit grinds 1-3 same crop rarity; same seed day at', () => {
    const countA = grindHandOnce(7)
    const countB = grindHandOnce(7)
    expect(countA).toBe(countB)
    expect(countA).toBeGreaterThanOrEqual(GRIND_MIN)
    expect(countA).toBeLessThanOrEqual(GRIND_MAX)
    const u = hash(7, 'grind', AT.col, AT.row, 1, 0)
    expect(countA).toBe(GRIND_MIN + Math.floor(u * (GRIND_MAX - GRIND_MIN + 1)))
    const w = grindWorld(7)
    w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'wheat', rarity: 'rare', count: 1 } }
    w.click(AT)
    for (let i = 0; i < 50; i++) w.tick(1 / 15)
    const slot = w.inventory.find(
      s => s.kind === 'hold' && s.item.kind === 'seeds' && s.item.crop === 'wheat' && s.item.rarity === 'rare',
    )
    expect(slot?.kind === 'hold' && slot.item.kind === 'seeds' && slot.item.count).toBe(countA)
  })

  test('box fruit N rolls work 2N box empty overflow drops', () => {
    const n = 3
    const w = grindWorld(11)
    w.inventory.forEach((_, i) => {
      w.inventory[i] = { kind: 'hold', item: { kind: 'shrub' } }
    })
    w.hand = {
      kind: 'hold',
      item: {
        kind: 'box',
        cap: 5,
        cargo: { kind: 'stack', goods: 'fruit', stack: { crop: 'tomato', rarity: 'uncommon', count: n } },
      },
    }
    w.click(AT)
    w.tick(1 / 15)
    expect(w.workTotal).toBe(GRIND_WORK * n)
    for (let i = 0; i < 200; i++) w.tick(1 / 15)
    expect(w.hand.kind === 'hold' && w.hand.item.kind === 'box' && w.hand.item.cargo.kind).toBe('empty')
    let expectCount = 0
    for (let i = 0; i < n; i++) {
      const u = hash(11, 'grind', AT.col, AT.row, 1, i)
      expectCount += GRIND_MIN + Math.floor(u * (GRIND_MAX - GRIND_MIN + 1))
    }
    const dropped = w.drops.filter(
      d =>
        d.at.col === AT.col &&
        d.at.row === AT.row &&
        d.item.kind === 'seeds' &&
        d.item.crop === 'tomato' &&
        d.item.rarity === 'uncommon',
    )
    expect(dropped).toHaveLength(1)
    expect(dropped[0].item.kind === 'seeds' && dropped[0].item.count).toBe(expectCount)
    expect(w.inventory.every(s => s.kind === 'hold' && s.item.kind === 'shrub')).toBe(true)
  })

  test('unlock-grinder automation buy-grinder 30', () => {
    expect(RESEARCH['unlock-grinder'].cost).toBe(18)
    expect(RESEARCH['unlock-grinder'].tree).toBe('automation')
    expect(SKUS['buy-grinder'].price).toBe(30)
    expect(SKUS['buy-grinder'].unlock).toBe('unlock-grinder')
  })

  test('research names and unlock-expand tree', () => {
    expect(RESEARCH['unlock-tomato'].name).toBe('Tomato seeds')
    expect(RESEARCH['unlock-raspberry'].name).toBe('Raspberry seeds')
    expect(RESEARCH['bump-carrot'].name).toBe('Better carrots')
    expect(RESEARCH['bump-potato'].name).toBe('Better potatoes')
    expect(RESEARCH['bump-wheat'].name).toBe('Better wheat')
    expect(RESEARCH['unlock-better-tools'].name).toBe('Better gardening tools')
    expect(RESEARCH['unlock-large-box'].name).toBe('Large fruit box')
    expect(RESEARCH['unlock-pumpjack'].name).toBe('Pumpjack')
    expect(RESEARCH['unlock-chest'].name).toBe('Chest')
    expect(RESEARCH['unlock-expand'].name).toBe('Unlock land')
    expect(RESEARCH['unlock-pickaxe'].name).toBe('Pickaxes')
    expect(RESEARCH['unlock-grinder'].name).toBe('Seed grinder')
    expect(RESEARCH['unlock-expand'].tree).toBe('expansion')
  })

  test('itemLine fruit berry sell-for equals sellSlot', () => {
    const w = new World()
    w.inventory[0] = { kind: 'hold', item: { kind: 'fruit', crop: 'carrot', rarity: 'common', count: 3 } }
    const fruitLine = itemLine(
      w.inventory[0].kind === 'hold' ? w.inventory[0].item : { kind: 'shrub' },
      w.modifiers,
    )
    const before = w.money
    w.sellSlot(0)
    expect(fruitLine).toBe(`Carrot - 3, sell for $${w.money - before}`)
    w.inventory[0] = { kind: 'hold', item: { kind: 'berry', rarity: 'uncommon', count: 2 } }
    const berryLine = itemLine(
      w.inventory[0].kind === 'hold' ? w.inventory[0].item : { kind: 'shrub' },
      w.modifiers,
    )
    const mid = w.money
    w.sellSlot(0)
    expect(berryLine).toBe(`Berry - 2, sell for $${w.money - mid}`)
  })

  test('infertile prompt is does not need seeds', () => {
    const w = new World()
    w.setCell(AT, { kind: 'infertile' })
    const p = w.prompt(AT)
    expect(p.kind).toBe('blocked')
    expect(p.text).toBe('does not need seeds')
  })

  test('pickaxe on ripe does not queue and speaks', () => {
    const w = new World()
    w.setCell(AT, { kind: 'ripe', plant: new Plant('carrot', 'common') })
    w.hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    const q = [...w.queue]
    w.click(AT)
    expect(w.queue).toEqual(q)
    expect(w.speech).toEqual({
      kind: 'say',
      text: 'I cannot use this Pickaxe to harvest',
      left: 2.5,
    })
  })

  test('skuLabel buy-box is Fruit box', () => {
    expect(skuLabel('buy-box')).toBe('Fruit box')
  })

  test('fruit box start; better pickaxe shown after pickaxe research', () => {
    expect(SKUS['buy-box'].unlock).toBe('start')
    const w = new World()
    expect(w.skuOpen('buy-box')).toBe(true)
    expect(w.skuShown('buy-box')).toBe(true)
    expect(w.skuShown('buy-pickaxe')).toBe(true)
    expect(w.skuShown('buy-better-pickaxe')).toBe(false)
    w.done.add('unlock-pickaxe')
    expect(w.skuShown('buy-better-pickaxe')).toBe(true)
    expect(w.skuOpen('buy-better-pickaxe')).toBe(true)
  })
})

function grindWorld(seed: number): World {
  const w = new World(seed)
  w.setCell(AT, new Grinder({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 }))
  w.actor.x = AT.col + 0.5
  w.actor.y = AT.row + 0.5
  return w
}

function grindHandOnce(seed: number): number {
  const w = grindWorld(seed)
  w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'wheat', rarity: 'rare', count: 1 } }
  w.click(AT)
  for (let i = 0; i < 50; i++) w.tick(1 / 15)
  const slot = w.inventory.find(
    s => s.kind === 'hold' && s.item.kind === 'seeds' && s.item.crop === 'wheat' && s.item.rarity === 'rare',
  )
  if (slot === undefined || slot.kind !== 'hold' || slot.item.kind !== 'seeds') return 0
  return slot.item.count
}

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
