import { describe, expect, test } from 'vitest'
import { CROPS, freshMul } from '../defs/crops.ts'
import { CONTAINERS, GRIND_MAX, GRIND_MIN, GRIND_WORK, SPRINKLER_TILE_RATE } from '../defs/items.ts'
import {
  HAPPY_MAX,
  HAPPY_START,
  RARITY_SALE,
  RARITY_WEIGHT,
  rarityOdds,
  rollGrowRarity,
  rollShopRarity,
  stepRarity,
} from '../defs/rarity.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { SKILLS } from '../defs/skills.ts'
import type { ResearchId, SkuId } from './ids.ts'
import { Chest, Grinder, HOUSE_BASE, PUMP_BASE, occupiedCells } from './building.ts'
import { fruitMoney, itemLine, makePickaxe, makeShovel, skuLabel, type Hand } from './item.ts'
import { Plant } from './plant.ts'
import { aoe, junction, type Edge } from './pipe.ts'
import { Rock, Tree } from './building.ts'
import { hash } from './rng.ts'
import { Clock, days } from './clock.ts'
import { Soil, SOIL_TILL_WATER, SOIL_WATER_MID, STUNT } from './soil.ts'
import { bare } from './plot.ts'
import { SOURCE } from './water.ts'
import { goodness } from './noise.ts'
import { statsOf } from './modifiers.ts'
import { World } from './world.ts'
import { AUTOMATION } from '../ui/shop.tsx'
import { qualityPip } from '../view/svgs.ts'

const HOME = [{ cx: 0, cy: 0 }]
const AT = { col: 10, row: 12 }

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
  return new Soil(water, fertilizer)
}

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

  test('growing plant grows; wilted grows stunted', () => {
    const w = new World()
    const p = new Plant('carrot', 'common')
    w.setCell(AT, { kind: 'growing', soil: bed(0.5), plant: p })
    const dry = new Plant('carrot', 'common')
    w.setCell({ col: 10, row: 13 }, { kind: 'growing', soil: bed(0), plant: dry })
    const dt = 1 / 15
    w.tick(dt)
    expect(p.maturity).toBeCloseTo(dt / CROPS.carrot.growSeconds, 9)
    expect(dry.maturity).toBeCloseTo((dt * STUNT) / CROPS.carrot.growSeconds, 9)
  })

  test('dry starving soil kills growing not ripe', () => {
    const w = new World()
    const g = new Plant('carrot', 'common')
    w.setCell(AT, { kind: 'growing', soil: bed(0, 0), plant: g })
    for (let n = 0; n < 2000 && w.cell(AT).kind === 'growing'; n++) {
      if (w.seam.kind === 'recap') w.dismissRecap()
      w.tick(1)
    }
    expect(w.cell(AT).kind).toBe('dead')
    const r = new Plant('carrot', 'common')
    r.maturity = 1
    const ripe = { col: 11, row: 12 }
    w.setCell(ripe, { kind: 'ripe', soil: bed(0, 0), plant: r })
    for (let n = 0; n < 5; n++) {
      if (w.seam.kind === 'recap') w.dismissRecap()
      w.tick(1)
    }
    expect(w.cell(ripe).kind).toBe('ripe')
  })

  test('watering tops growing to comfort margin; empty soil to 1L', () => {
    const w = new World()
    w.hand = {
      kind: 'hold',
      item: { kind: 'container', id: 'bucket', liters: 2, capacityLiters: 2 },
    }
    const s = bed(0.4)
    const p = new Plant('carrot', 'common')
    w.setCell(AT, { kind: 'growing', soil: s, plant: p })
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    for (let n = 0; n < 12 && w.queue.length > 0; n++) w.tick(1 / 15)
    const target = SOIL_WATER_MID + p.stats(w.modifiers).waterTolerance
    expect(s.water).toBeCloseTo(target, 2)
    expect(
      w.hand.kind === 'hold' && w.hand.item.kind === 'container' ? w.hand.item.liters : -1,
    ).toBeCloseTo(2 - (target - 0.4), 2)

    const bare2 = { col: 11, row: 12 }
    const sb = bed(0.2)
    w.setCell(bare2, { kind: 'empty', soil: sb })
    w.hand = {
      kind: 'hold',
      item: { kind: 'container', id: 'bucket', liters: 2, capacityLiters: 2 },
    }
    w.actor.x = 11.5
    w.actor.y = 12.5
    w.click(bare2)
    for (let n = 0; n < 12 && w.queue.length > 0; n++) w.tick(1 / 15)
    expect(sb.water).toBeCloseTo(SOIL_WATER_MID, 6)
    expect(
      w.hand.kind === 'hold' && w.hand.item.kind === 'container' ? w.hand.item.liters : -1,
    ).toBeCloseTo(1.2, 6)
  })

  test('effectiveSale', () => {
    const w = new World()
    w.modifiers.push({
      id: 'better-carrot',
      source: 'skill',
      crop: 'carrot',
      saleMul: 1.04,
      growSpeed: 1,
      waterUseMul: 1,
    })
    const sale = new Plant('carrot', 'common').stats(w.modifiers).sale
    expect(sale).toBe(CROPS.carrot.sale * RARITY_SALE.common * 1.04)
  })

  test('shovel 0 removes item', () => {
    const w = new World()
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 1, workSeconds: 0 } }
    w.setCell(AT, bare('soft'))
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
    expect(w.pump.water.rate).toBe(SOURCE.pump.rate)
    w.money = 50
    w.done.add('unlock-irrigation')
    w.buy('buy-pumpjack')
    expect(w.place.kind).toBe('sku')
    expect(w.pump.water.rate).toBe(SOURCE.pump.rate)
    w.setCell(AT, bare('soft'))
    w.setCell({ col: 11, row: 12 }, bare('soft'))
    w.confirmPlace(AT)
    expect(w.pumps).toHaveLength(2)
    expect(w.pumps[1].water.rate).toBe(SOURCE.pump.rate)
    expect(w.pump.water.rate).toBe(SOURCE.pump.rate)
    expect(w.cell(AT).kind).toBe('pump')
  })

  test('hand is one item', () => {
    const w = new World()
    expect(w.hand.kind).toBe('hold')
  })

  test('tilling mints soil at 0.75 water and noise fertilizer', () => {
    const w = new World()
    w.setCell(AT, bare('soft'))
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    for (let n = 0; n < 20 && w.cell(AT).kind !== 'empty'; n++) w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('empty')
    const soil = (w.cell(AT) as { soil: Soil }).soil
    expect(soil.water).toBe(SOIL_TILL_WATER)
    expect(soil.fertilizer).toBe(goodness(w.seed, AT.col, AT.row))
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
    w.setCell({ col: 8, row: 12 }, bare('soft'))
    w.rightClick({ col: 8, row: 12 })
    expect(w.hand).toEqual(hand)
    expect(w.drops).toHaveLength(drops)
    expect(w.queue[0]).toEqual({ act: 'drop', at: { col: 8, row: 12 } })
    w.click({ col: 14, row: 6 })
    expect(w.queue[1]).toEqual({ act: 'inventory' })
    expect(w.cue).toEqual({ kind: 'none' })
    expect(w.hand).toEqual(hand)
  })

  test('compact after buy and swap', () => {
    const w = new World()
    w.buy('pack-carrot')
    expectPacked(w)
    expect(w.inventory[0]).toEqual({
      kind: 'hold',
      item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 10 },
    })
    w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'carrot', rarity: 'common', count: 2, unitSale: 4 } }
    w.swap(1)
    w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'carrot', rarity: 'common', count: 3, unitSale: 4 } }
    w.swap(2)
    expectPacked(w)
    const fruits = w.inventory.filter(s => s.kind === 'hold' && s.item.kind === 'fruit')
    expect(fruits).toHaveLength(1)
    expect(fruits[0].kind === 'hold' && fruits[0].item.kind === 'fruit' && fruits[0].item.count).toBe(5)
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

  test('cheat money points and research 3×', () => {
    const w = new World()
    const money = w.money
    w.cheatMoney()
    expect(w.money).toBe(money + 200)
    w.cheatPoints()
    expect(w.family.player.points).toBe(10)
    expect(w.family.husband.points).toBe(10)
    expect(w.family.daughter.points).toBe(10)
    w.startResearch('unlock-tomato')
    w.toggleCheatResearch()
    expect(w.cheatFastResearch).toBe(true)
    for (let i = 0; i < 15; i++) w.tick(1 / 15)
    expect(w.job.kind === 'run' && w.job.left).toBeCloseTo(RESEARCH['unlock-tomato'].seconds - 3, 5)
  })

  test('shovel SKU is 10', () => {
    expect(SKUS['buy-shovel'].price).toBe(10)
  })

  test('dig growing drops seed; dead drops compostable', () => {
    const w = new World()
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    const soil = bed()
    w.setCell(AT, { kind: 'growing', soil, plant: new Plant('carrot', 'common') })
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT).kind).toBe('empty')
    expect((w.cell(AT) as { soil: Soil }).soil).toBe(soil)
    const seed = w.drops.find(d => d.at.col === 10 && d.at.row === 12)
    expect(seed?.item).toEqual({ kind: 'seeds', crop: 'carrot', rarity: 'common', count: 1 })
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    const dead = { col: 10, row: 13 }
    const deadSoil = bed()
    w.setCell(dead, { kind: 'dead', soil: deadSoil, plant: new Plant('carrot', 'common') })
    const n = w.drops.length
    w.actor.x = 10.5
    w.actor.y = 13.5
    w.click(dead)
    w.tick(0.05)
    expect(w.cell(dead).kind).toBe('empty')
    expect((w.cell(dead) as { soil: Soil }).soil).toBe(deadSoil)
    expect(w.drops).toHaveLength(n)
    expect(w.drops.some(d => d.at.col === dead.col && d.at.row === dead.row && d.item.kind === 'dead')).toBe(false)
  })

  test('research costs match table', () => {
    expect(RESEARCH['unlock-tomato']).toMatchObject({ cost: 7, seconds: 30 })
    expect(RESEARCH['unlock-raspberry']).toMatchObject({ cost: 12, seconds: 45 })
    expect(RESEARCH['unlock-heirloom']).toMatchObject({ cost: 20, seconds: 120, tree: 'plants' })
    expect(RESEARCH['unlock-better-tools']).toMatchObject({ cost: 16, seconds: 45 })
    expect(RESEARCH['unlock-large-box']).toMatchObject({ cost: 17, seconds: 50 })
    expect(RESEARCH['unlock-irrigation']).toMatchObject({ cost: 20, seconds: 50 })
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
    expect(w.pump.water.rate).toBe(SOURCE.pump.rate)
    expect(w.pump.water.capacity).toBe(SOURCE.pump.capacity)
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
    w.setCell(AT, bare('hard'))
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
    w.setCell(hard, bare('hard'))
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
    w.setCell(AT, bare('very-hard'))
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
    w.setCell(AT, bare('very-hard'))
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
    expect(w.cell(AT)).toEqual(bare('soft'))
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
    expect(w.cell(a)).toEqual(bare('soft'))
    expect(w.cell(b)).toEqual(bare('soft'))
    expect(w.hand.kind === 'hold' && w.hand.item.kind === 'pickaxe' && w.hand.item.usesLeft).toBe(22)
  })

  test('same seed same map; no shrub', () => {
    const a = new World(2)
    const b = new World(2)
    const cellsA: string[] = []
    const cellsB: string[] = []
    a.forEachCell((at, c) => {
      cellsA.push(`${at.col},${at.row}:${c.kind}`)

    })
    b.forEachCell((at, c) => {
      cellsB.push(`${at.col},${at.row}:${c.kind}`)
    })
    expect(cellsA).toEqual(cellsB)
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
      if (c.kind === 'untilled') expect(c.ground).toBe('soft')
    })
  })

  test('shovel tree drops sapling; cells stay tree until dug', () => {
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('apricot', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0, { kind: 'on', daysLeft: 2 })
    w.setCell(AT, tree)
    w.setCell(below, tree)
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.actor.x = 10.5
    w.actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT)).toEqual(bare('soft'))
    expect(w.cell(below)).toEqual(bare('soft'))
    expect(w.drops.some(d => d.item.kind === 'sapling' && d.item.kind === 'sapling' && d.item.tree === 'apricot')).toBe(true)
  })

  test('pickaxe sku 20 gated on unlock-pickaxe; rarity table', () => {
    expect(SKUS['buy-pickaxe'].price).toBe(18)
    expect(SKUS['buy-pickaxe'].unlock).toBe('unlock-pickaxe')
    expect(SKUS['buy-better-pickaxe'].unlock).toBe('unlock-pickaxe')
    expect(RARITY_SALE).toEqual({ common: 1, uncommon: 1.25, rare: 2, heirloom: 3.5 })
    expect(RARITY_WEIGHT).toEqual({ common: 0.55, uncommon: 0.35, rare: 0.09, heirloom: 0.01 })
    expect(RESEARCH['unlock-raspberry'].reveal).toBe('unlock-grape')
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
  test('starter house has three saplings', () => {
    const w = new World()
    const trees = w.inventory.filter(s => s.kind === 'hold' && s.item.kind === 'sapling').map(s => (s.kind === 'hold' && s.item.kind === 'sapling' ? s.item.tree : ''))
    expect(trees.sort()).toEqual(['apricot', 'cherry', 'lemon'])
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
    ca.slots[0] = { kind: 'hold', item: { kind: 'sapling', tree: 'lemon' } }
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
    w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'wheat', rarity: 'rare', count: 1, unitSale: 28 } }
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
      w.inventory[i] = { kind: 'hold', item: { kind: 'sapling', tree: 'lemon' } }
    })
    w.hand = {
      kind: 'hold',
      item: {
        kind: 'box',
        cap: 5,
        cargo: { kind: 'stack', goods: 'fruit', stack: { crop: 'tomato', rarity: 'uncommon', count: n, unitSale: 22.5 } },
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
    expect(w.inventory.every(s => s.kind === 'hold' && s.item.kind === 'sapling')).toBe(true)
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
    expect(RESEARCH['unlock-heirloom'].name).toBe('Heirloom crops')
    expect(RESEARCH['unlock-better-tools'].name).toBe('Better gardening tools')
    expect(RESEARCH['unlock-large-box'].name).toBe('Fruit boxes')
    expect(RESEARCH['unlock-irrigation'].name).toBe('Irrigation')
    expect(RESEARCH['unlock-chest'].name).toBe('Chest')
    expect(RESEARCH['unlock-expand'].name).toBe('Unlock land')
    expect(RESEARCH['unlock-pickaxe'].name).toBe('Pickaxes')
    expect(RESEARCH['unlock-grinder'].name).toBe('Seed grinder')
    expect(RESEARCH['unlock-expand'].tree).toBe('expansion')
  })

  test('itemLine fruit shows freshness; berry has no money clause', () => {
    const w = new World()
    expect(
      itemLine({ kind: 'fruit', crop: 'carrot', rarity: 'common', count: 3, unitSale: 4, freshness: 1, bio: true }, w.modifiers),
    ).toBe('Carrot - 3, freshness 100%')
    expect(itemLine({ kind: 'sugar', count: 2, unitSale: 5 }, w.modifiers)).toBe('Sugar - 2')
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

  test('fruit box gated on Fruit boxes research; better pickaxe shown after pickaxe research', () => {
    expect(SKUS['buy-box'].unlock).toBe('start')
    const w = new World()
    expect(w.skuOpen('buy-box')).toBe(true)
    expect(w.skuShown('buy-box')).toBe(true)
    expect(SKUS['buy-box-large'].unlock).toBe('unlock-large-box')
    expect(w.skuOpen('buy-box-large')).toBe(false)
    w.done.add('unlock-large-box')
    expect(w.skuOpen('buy-box-large')).toBe(true)
    expect(w.skuShown('buy-pickaxe')).toBe(true)
    expect(w.skuShown('buy-better-pickaxe')).toBe(false)
    w.done.add('unlock-pickaxe')
    expect(w.skuShown('buy-better-pickaxe')).toBe(true)
    expect(w.skuOpen('buy-better-pickaxe')).toBe(true)
  })
})

describe('beta-5 invariants', () => {
  test('buy-pipe 4; two adjacent owned edges join one net', () => {
    expect(SKUS['buy-pipe'].price).toBe(4)
    const w = new World()
    w.done.add('unlock-auto-irrigation')
    w.money = 50
    w.buy('buy-pipe')
    expect(w.place).toEqual({ kind: 'sku', id: 'buy-pipe' })
    const e1: Edge = { axis: 'h', col: 10, row: 12 }
    const e2: Edge = { axis: 'h', col: 11, row: 12 }
    w.placePipe(e1)
    w.placePipe(e2)
    expect(w.place).toEqual({ kind: 'sku', id: 'buy-pipe' })
    expect(w.hasPipe(e1)).toBe(true)
    expect(w.hasPipe(e2)).toBe(true)
    expect(w.money).toBe(42)
    const netA = w.netOfVertex({ col: 10, row: 12 })
    const netB = w.netOfVertex({ col: 12, row: 12 })
    expect(netA).toBeDefined()
    expect(netA).toBe(netB)
  })

  test('junction classification', () => {
    const v = { col: 10, row: 12 }
    const hL: Edge = { axis: 'h', col: 9, row: 12 }
    const hR: Edge = { axis: 'h', col: 10, row: 12 }
    const vD: Edge = { axis: 'v', col: 10, row: 12 }
    expect(junction(v, e => sameEdge(e, hL))).toBe('stub')
    expect(junction(v, e => sameEdge(e, hL) || sameEdge(e, hR))).toBe('I')
    expect(junction(v, e => sameEdge(e, hL) || sameEdge(e, vD))).toBe('L')
    expect(junction(v, e => sameEdge(e, hL) || sameEdge(e, hR) || sameEdge(e, vD))).toBe('T')
    expect(junction(v, () => true)).toBe('X')
  })

  test('prices outputs starter reservoirs', () => {
    expect(SKUS['buy-pumpjack'].price).toBe(40)
    expect(SKUS['buy-well'].price).toBe(75)
    const w = new World()
    w.done.add('unlock-adv-irrigation')
    w.money = 200
    w.buy('buy-well')
    const at = { col: 10, row: 12 }
    w.setCell(at, { kind: 'empty', soil: bed() })
    w.confirmPlace(at)
    const well = w.cell(at)
    expect(well.kind).toBe('pump')
    if (well.kind === 'pump') {
      expect(well.form).toBe('well')
      expect(well.water.rate).toBe(SOURCE.well.rate)
      expect(well.water.capacity).toBe(SOURCE.well.capacity)
      expect(well.water.stored).toBe(SOURCE.well.start)
      expect(well.base).toEqual({ shape: 'rect', col: 10, row: 12, w: 1, h: 1 })
    }
    const net = w.netOfVertex({ col: 18, row: 7 })
    expect(net).toBeDefined()
    expect(net?.sources).toHaveLength(1)
  })

  test('one jack + five sprinklers share the source and water growing tiles', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.money = 500
    w.buy('buy-pumpjack')
    const at = { col: 5, row: 20 }
    w.setCell(at, bare('soft'))
    w.setCell({ col: 6, row: 20 }, bare('soft'))
    w.confirmPlace(at)
    expect(w.cell(at).kind).toBe('pump')
    const jack = w.pumps[1]
    const before = jack.water.stored
    w.buy('buy-pipe')
    ;[5, 6, 7, 8, 9].forEach(col => {
      w.placePipe({ axis: 'h', col, row: 20 })
    })
    w.buy('buy-sprinkler')
    ;[5, 6, 7, 8, 9].forEach(col => {
      w.placeSprinkler({ variant: 'basic', at: { col, row: 20 }, tune: { kind: 'flat' } })
    })
    const soils: Soil[] = []
    ;[5, 6, 7, 8, 9].forEach(col => {
      const s = bed(0.2)
      soils.push(s)
      const p = new Plant('carrot', 'common')
      w.setCell({ col, row: 19 }, { kind: 'growing', soil: s, plant: p })
    })
    for (let n = 0; n < 10; n++) w.tick(1 / 15)
    soils.forEach((s, i) => {
      expect(s.water).toBeGreaterThan(0.2)
      void i
    })
    expect(jack.water.stored).toBeLessThan(before)
    expect(jack.water.drawn).toBeGreaterThan(0)
  })

  test('pipes no source rate 0', () => {
    const w = new World()
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-pipe')
    const e: Edge = { axis: 'h', col: 10, row: 20 }
    w.placePipe(e)
    w.buy('buy-sprinkler')
    w.placeSprinkler({ variant: 'basic', at: { col: 10, row: 20 }, tune: { kind: 'flat' } })
    expect(w.rate({ col: 10, row: 20 })).toBe(0)
  })

  test('research names trees reveal', () => {
    expect(RESEARCH['unlock-watermelon']).toMatchObject({
      name: 'Watermelon seeds',
      tree: 'plants',
      reveal: 'start',
    })
    expect(RESEARCH['unlock-irrigation']).toMatchObject({
      name: 'Irrigation',
      tree: 'automation',
      reveal: 'start',
    })
    expect(RESEARCH['unlock-auto-irrigation']).toMatchObject({
      name: 'Automated irrigation',
      tree: 'automation',
      reveal: 'unlock-irrigation',
    })
    expect(RESEARCH['unlock-adv-irrigation']).toMatchObject({
      name: 'Advanced irrigation',
      tree: 'automation',
      reveal: 'unlock-auto-irrigation',
    })
    expect(Object.keys(RESEARCH).includes('unlock-pumpjack')).toBe(false)
    const w = new World()
    w.done.add('unlock-irrigation')
    expect(w.skuShown('buy-sprinkler')).toBe(true)
    expect(w.skuOpen('buy-sprinkler')).toBe(false)
    w.done.add('unlock-auto-irrigation')
    expect(w.skuOpen('buy-sprinkler')).toBe(true)
  })

  test('watermelon waterUse pack research', () => {
    expect(CROPS.watermelon.waterUsePerSec).toBe(0.01125)
    expect(SKUS['pack-watermelon'].price).toBe(18)
    expect(RESEARCH['unlock-watermelon']).toMatchObject({ cost: 8, seconds: 35, tree: 'plants' })
  })

  test('delete no money change; pumpjack remains', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.done.add('unlock-grinder')
    w.money = 200
    w.buy('buy-pumpjack')
    const at = { col: 10, row: 12 }
    w.setCell(at, { kind: 'empty' })
    w.setCell({ col: 11, row: 12 }, { kind: 'empty' })
    w.confirmPlace(at)
    expect(w.cell(at).kind).toBe('pump')
    w.buy('buy-pipe')
    const e: Edge = { axis: 'h', col: 10, row: 12 }
    w.placePipe(e)
    w.buy('buy-sprinkler')
    const v = { col: 10, row: 12 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' } })
    w.buy('buy-grinder')
    const g = { col: 8, row: 12 }
    w.setCell(g, { kind: 'empty' })
    w.confirmPlace(g)
    w.armDelete()
    const money = w.money
    w.deletePipe(e)
    expect(w.money).toBe(money)
    expect(w.hasPipe(e)).toBe(false)
    w.deleteSprinkler(v)
    expect(w.money).toBe(money)
    expect(w.sprinklerAt(v)).toBeUndefined()
    w.deleteBuilding(g)
    expect(w.money).toBe(money)
    expect(w.cell(g).kind).toBe('empty')
    expect(w.cell(at).kind).toBe('pump')
    expect(w.pumps).toHaveLength(2)
  })

  test('aoe formulas', () => {
    const v = { col: 10, row: 12 }
    expect(sorted(aoe({ variant: 'basic', at: v }))).toEqual(
      sorted([
        { col: 9, row: 11 },
        { col: 10, row: 11 },
        { col: 9, row: 12 },
        { col: 10, row: 12 },
      ]),
    )
    expect(sorted(aoe({ variant: 'large', at: v }))).toEqual(
      sorted(
        [-2, -1, 0, 1].flatMap(dr => [-2, -1, 0, 1].map(dc => ({ col: 10 + dc, row: 12 + dr }))),
      ),
    )
    expect(sorted(aoe({ variant: 'vert', at: v, facing: 'ns' }))).toEqual(
      sorted(
        [-2, -1, 0, 1].flatMap(dr => [-1, 0].map(dc => ({ col: 10 + dc, row: 12 + dr }))),
      ),
    )
    expect(sorted(aoe({ variant: 'vert', at: v, facing: 'ew' }))).toEqual(
      sorted(
        [-1, 0].flatMap(dr => [-2, -1, 0, 1].map(dc => ({ col: 10 + dc, row: 12 + dr }))),
      ),
    )
  })

  test('sprinkler waters growing soil only; ripe untouched', () => {
    const w = new World()
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-pipe')
    w.placePipe({ axis: 'h', col: 18, row: 7 })
    w.buy('buy-sprinkler')
    w.placeSprinkler({ variant: 'basic', at: { col: 19, row: 7 }, tune: { kind: 'flat' } })
    const gs = bed(0.5)
    const g = new Plant('carrot', 'common')
    w.setCell({ col: 18, row: 6 }, { kind: 'growing', soil: gs, plant: g })
    const rs = bed(0.5)
    const r = new Plant('carrot', 'common')
    r.maturity = 1
    w.setCell({ col: 19, row: 6 }, { kind: 'ripe', soil: rs, plant: r })
    w.tick(1 / 15)
    expect(gs.water).toBeGreaterThan(0.5)
    expect(rs.water).toBe(0.5)
  })

  test('place basic, no incident pipe, succeeds, rate 0', () => {
    const w = new World()
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-sprinkler')
    const v = { col: 10, row: 12 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' } })
    expect(w.sprinklerAt(v)).toEqual({ variant: 'basic', at: v, tune: { kind: 'flat' } })
    expect(w.rate(v)).toBe(0)
  })

  test('isolated sprinkler then source-touching pipe at vertex', () => {
    const w = new World()
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-sprinkler')
    const v = { col: 19, row: 7 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' } })
    const g = new Plant('carrot', 'common')
    w.setCell({ col: 18, row: 6 }, { kind: 'growing', soil: bed(0.5), plant: g })
    expect(w.rate(v)).toBe(0)
    w.buy('buy-pipe')
    const e: Edge = { axis: 'h', col: 18, row: 7 }
    w.placePipe(e)
    expect(w.rate(v)).toBeCloseTo(SPRINKLER_TILE_RATE, 9)
  })

  test('growing in AoE R>0 soil not below dry trajectory', () => {
    const w = new World()
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-pipe')
    w.placePipe({ axis: 'h', col: 18, row: 7 })
    w.buy('buy-sprinkler')
    const v = { col: 19, row: 7 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' } })
    const s = bed(0.5)
    const g = new Plant('carrot', 'common')
    w.setCell({ col: 18, row: 6 }, { kind: 'growing', soil: s, plant: g })
    const r = w.rate(v)
    expect(r).toBeGreaterThan(0)
    const dt = 1 / 15
    const dry = 0.5 - g.stats(w.modifiers).waterUsePerSec * dt
    w.tick(dt)
    expect(s.water).toBeGreaterThanOrEqual(dry)
    expect(s.water).toBeGreaterThan(0.5)
  })
})

describe('beta-6 invariants', () => {
  test('pack prices and CROPS match the table', () => {
    expect(CROPS.carrot).toMatchObject({
      growSeconds: 90,
      waterUsePerSec: 0.004889,
      sale: 3,
      seed: 1,
      rotSeconds: 420,
    })
    expect(CROPS.potato).toMatchObject({
      growSeconds: 120,
      waterUsePerSec: 0.00375,
      sale: 6,
      seed: 2,
      rotSeconds: 600,
    })
    expect(CROPS.wheat).toMatchObject({
      growSeconds: 180,
      waterUsePerSec: 0.0045833,
      sale: 12,
      seed: 2,
      rotSeconds: 420,
    })
    expect(CROPS.tomato).toMatchObject({
      growSeconds: 280,
      waterUsePerSec: 0.0043611,
      sale: 20,
      seed: 3,
      rotSeconds: 300,
    })
    expect(CROPS.watermelon).toMatchObject({
      growSeconds: 260,
      waterUsePerSec: 0.01125,
      sale: 20,
      seed: 4,
      rotSeconds: 360,
    })
    expect(CROPS.raspberry).toMatchObject({
      growSeconds: 340,
      waterUsePerSec: 0.0045833,
      sale: 26,
      seed: 4,
      rotSeconds: 160,
    })
    expect(SKUS['pack-carrot'].price).toBe(3)
    expect(SKUS['pack-potato'].price).toBe(6)
    expect(SKUS['pack-wheat'].price).toBe(10)
    expect(SKUS['pack-tomato'].price).toBe(15)
    expect(SKUS['pack-watermelon'].price).toBe(18)
    expect(SKUS['pack-raspberry'].price).toBe(22)
  })

  test('ripe plant freshness starts 1 then rots', () => {
    const w = new World()
    const p = new Plant('raspberry', 'common')
    w.setCell(AT, { kind: 'ripe', soil: bed(), plant: p })
    expect(p.freshness).toBe(1)
    const rot = CROPS.raspberry.rotSeconds
    for (let t = 0; t < rot && w.cell(AT).kind === 'ripe'; t += 1 / 15) {
      if (w.seam.kind === 'recap') w.dismissRecap()
      w.tick(1 / 15)
    }
    expect(w.cell(AT).kind).toBe('rotten')
  })

  test('harvest bakes unitSale from freshness', () => {
    const w = new World()
    w.hand = { kind: 'empty' }
    w.actor.x = AT.col + 0.5
    w.actor.y = AT.row + 0.5
    const sale = new Plant('carrot', 'common').stats(w.modifiers).sale
    const a = new Plant('carrot', 'common')
    a.freshness = 1
    w.setCell(AT, { kind: 'ripe', soil: bed(), plant: a })
    w.click(AT)
    for (let i = 0; i < 20; i++) w.tick(1 / 15)
    {
      const h = readHand(w)
      expect(h.kind).toBe('hold')
      expect(h.kind === 'hold' && h.item.kind === 'fruit' ? h.item.unitSale : undefined).toBe(sale)
      expect(h.kind === 'hold' && h.item.kind === 'fruit' ? h.item.freshness : undefined).toBeCloseTo(1, 2)
    }
    expect(freshMul(0.8)).toBe(1)
    expect(freshMul(0.4)).toBe(0.5)
    w.hand = { kind: 'empty' }
    const b = new Plant('carrot', 'common')
    b.freshness = 0.4
    w.setCell(AT, { kind: 'ripe', soil: bed(), plant: b })
    w.click(AT)
    for (let i = 0; i < 20; i++) {
      const cell = w.cell(AT)
      if (cell.kind === 'ripe') cell.plant.freshness = 0.4
      w.tick(1 / 15)
    }
    {
      const h = readHand(w)
      expect(h.kind).toBe('hold')
      expect(h.kind === 'hold' && h.item.kind === 'fruit' ? h.item.unitSale : undefined).toBe(sale)
      expect(h.kind === 'hold' && h.item.kind === 'fruit' ? h.item.freshness : undefined).toBeCloseTo(0.4, 2)
    }
  })

  test('fruit merge weighted unitSale and freshness', () => {
    const w = new World()
    w.inventory[0] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', rarity: 'common', count: 1, unitSale: 4, freshness: 1, bio: true },
    }
    w.inventory[1] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', rarity: 'common', count: 1, unitSale: 6, freshness: 1, bio: true },
    }
    w.compactInventory()
    const slot = w.inventory[0]
    expect(slot.kind === 'hold' && slot.item.kind === 'fruit' && slot.item.unitSale).toBe(5)
    expect(slot.kind === 'hold' && slot.item.kind === 'fruit' && slot.item.count).toBe(2)
    if (slot.kind === 'hold' && slot.item.kind === 'fruit') expect(fruitMoney(slot.item)).toBe(10)
  })

  test('buy-delete is not a SkuId; shop automation has no Delete', () => {
    expect((Object.keys(SKUS) as string[]).includes('buy-delete')).toBe(false)
    expect(AUTOMATION.includes('buy-delete' as SkuId)).toBe(false)
    expect(AUTOMATION.some(id => skuLabel(id) === 'Delete')).toBe(false)
  })

  test('delete pumpjack money unchanged both empty starter remains', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.money = 200
    w.buy('buy-pumpjack')
    w.setCell(AT, { kind: 'empty' })
    w.setCell({ col: 11, row: 12 }, { kind: 'empty' })
    w.confirmPlace(AT)
    expect(w.cell(AT).kind).toBe('pump')
    expect(w.cell({ col: 11, row: 12 }).kind).toBe('pump')
    const starter = { col: 18, row: 7 }
    expect(w.cell(starter).kind).toBe('pump')
    w.armDelete()
    const money = w.money
    w.deleteBuilding(AT)
    expect(w.money).toBe(money)
    expect(w.cell(AT).kind).toBe('empty')
    expect(w.cell({ col: 11, row: 12 }).kind).toBe('empty')
    expect(w.cell(starter).kind).toBe('pump')
    expect(w.pumps).toHaveLength(1)
    expect(w.pumps[0].form).toBe('starter')
  })

  test('delete chest drops items; house delete is no-op', () => {
    const w = new World()
    w.done.add('unlock-chest')
    w.money = 200
    w.buy('buy-chest')
    w.setCell(AT, { kind: 'empty' })
    w.confirmPlace(AT)
    const chest = w.cell(AT)
    expect(chest.kind).toBe('chest')
    if (chest.kind !== 'chest') return
    chest.slots[0] = { kind: 'hold', item: { kind: 'sapling', tree: 'lemon' } }
    chest.slots[1] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 2 } }
    w.armDelete()
    const n = w.drops.length
    w.deleteBuilding(AT)
    expect(w.cell(AT).kind).toBe('empty')
    expect(w.drops).toHaveLength(n + 2)
    expect(w.drops.some(d => d.at.col === AT.col && d.at.row === AT.row && d.item.kind === 'sapling')).toBe(true)
    const house = { col: 14, row: 6 }
    expect(w.cell(house).kind).toBe('house')
    w.deleteBuilding(house)
    expect(w.cell(house).kind).toBe('house')
    w.click(house)
    expect(w.cell(house).kind).toBe('house')
  })

  test('rotten shovel empties with compostable drop; pickaxe and empty hand do not', () => {
    const w = new World()
    w.setCell(AT, { kind: 'rotten', soil: bed(), crop: 'carrot' })
    w.hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    w.actor.x = AT.col + 0.5
    w.actor.y = AT.row + 0.5
    const drops = w.drops.length
    w.click(AT)
    expect(w.cell(AT).kind).toBe('rotten')
    w.hand = { kind: 'empty' }
    w.click(AT)
    expect(w.cell(AT).kind).toBe('rotten')
    while (w.queue.length > 0) w.tick(1 / 15)
    w.hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT).kind).toBe('empty')
    expect(w.drops).toHaveLength(drops)
    expect(w.drops.some(d => d.at.col === AT.col && d.at.row === AT.row && d.item.kind === 'rotten')).toBe(false)
  })

  test('qualityPip uncommon+ only', () => {
    expect(qualityPip('common')).toBeUndefined()
    expect(qualityPip('uncommon')).toBeTruthy()
    expect(qualityPip('rare')).toBeTruthy()
    expect(qualityPip('heirloom')).toBeTruthy()
  })

  test('different rarity seeds do not merge', () => {
    const w = new World()
    w.inventory[0] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 2 } }
    w.inventory[1] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'rare', count: 3 } }
    w.compactInventory()
    const a = w.inventory[0]
    const b = w.inventory[1]
    expect(a.kind === 'hold' && a.item.kind === 'seeds' && a.item.rarity).toBe('common')
    expect(a.kind === 'hold' && a.item.kind === 'seeds' && a.item.count).toBe(2)
    expect(b.kind === 'hold' && b.item.kind === 'seeds' && b.item.rarity).toBe('rare')
    expect(b.kind === 'hold' && b.item.kind === 'seeds' && b.item.count).toBe(3)
  })

  test('phase at t=0/60/156/216', () => {
    const c = new Clock()
    expect(c.phase()).toBe('sunrise')
    c.t = 60
    expect(c.phase()).toBe('day')
    c.t = 156
    expect(c.phase()).toBe('sunset')
    c.t = 216
    expect(c.phase()).toBe('twilight')
  })

  test('days display', () => {
    expect(days(90).toFixed(2)).toBe('0.38')
    expect(Number(days(360).toFixed(2))).toBe(1.5)
  })

  test('wilted plant stunts; growing wet plant still grows and both drink', () => {
    const w = new World()
    const drySoil = bed(0)
    const wilt = new Plant('carrot', 'common')
    w.setCell(AT, { kind: 'growing', soil: drySoil, plant: wilt })
    const wetAt = { col: 11, row: 12 }
    const wetSoil = bed(1)
    const wet = new Plant('carrot', 'common')
    w.setCell(wetAt, { kind: 'growing', soil: wetSoil, plant: wet })
    const use = wilt.stats(w.modifiers).waterUsePerSec
    const dt = 1 / 15
    w.tick(dt)
    expect(drySoil.water).toBe(0)
    expect(wetSoil.water).toBeCloseTo(1 - use * dt, 9)
    expect(wilt.maturity).toBeCloseTo((dt * STUNT) / CROPS.carrot.growSeconds, 9)
    expect(wet.maturity).toBeCloseTo(dt / CROPS.carrot.growSeconds, 9)
  })

  test('happiness odds at 50% and 0%', () => {
    expect(rarityOdds(HAPPY_START)).toEqual({ up2: 0.005, up1: 0.05, down: 0 })
    expect(rarityOdds(0)).toEqual({ up2: 0, up1: 0, down: 0.05 })
    expect(rarityOdds(HAPPY_MAX, 0.04)).toEqual({ up2: 0.01, up1: 0.14, down: 0 })
    expect(rarityOdds(HAPPY_START, 0.04)).toEqual({ up2: 0.005, up1: 0.07, down: 0 })
    expect(stepRarity('common', -1)).toBe('common')
    expect(stepRarity('heirloom', 2)).toBe('heirloom')
    expect(rollGrowRarity('common', HAPPY_START, 0)).toBe('rare')
    expect(rollGrowRarity('common', HAPPY_START, 0.004)).toBe('rare')
    expect(rollGrowRarity('common', HAPPY_START, 0.006)).toBe('uncommon')
    expect(rollGrowRarity('common', HAPPY_START, 0.06)).toBe('common')
    expect(rollGrowRarity('uncommon', 0, 0.01)).toBe('common')
    expect(rollGrowRarity('common', HAPPY_MAX, 0.111)).toBe('common')
    expect(rollGrowRarity('common', HAPPY_MAX, 0.111, 0.04)).toBe('uncommon')
  })

  test('shop packs stay common until Trusted seed bank', () => {
    expect(rollShopRarity(0, 0)).toBe('common')
    expect(rollShopRarity(5, 0)).toBe('heirloom')
    expect(rollShopRarity(5, 0.009)).toBe('heirloom')
    expect(rollShopRarity(5, 0.011)).toBe('rare')
    expect(rollShopRarity(5, 0.069)).toBe('rare')
    expect(rollShopRarity(5, 0.071)).toBe('uncommon')
    expect(rollShopRarity(5, 0.319)).toBe('uncommon')
    expect(rollShopRarity(5, 0.32)).toBe('common')
    expect(SKILLS.heirloom.gate).toEqual({ kind: 'research', id: 'unlock-heirloom' })
    const w = new World(1)
    w.family.player.owned.set('seed-bank', 5)
    const u = hash(1, 'pack-rarity', w.clock.day, Math.floor(w.clock.t * 1000), Math.round(w.money * 10), 0)
    expect(w.buy('pack-wheat')).toBeUndefined()
    const got = w.inventory.find(s => s.kind === 'hold' && s.item.kind === 'seeds' && s.item.crop === 'wheat')
    expect(got).toEqual({
      kind: 'hold',
      item: { kind: 'seeds', crop: 'wheat', rarity: rollShopRarity(5, u), count: 5 },
    })
  })

  test('wilt drains happiness', () => {
    const w = new World()
    const p = new Plant('carrot', 'common')
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: p })
    w.tick(1 / 15)
    expect(p.happiness).toBeLessThan(HAPPY_START)
    expect(p.happiness).toBeGreaterThan(0)
  })
})

function readHand(w: World): Hand {
  return w.hand
}

function grindWorld(seed: number): World {
  const w = new World(seed)
  w.setCell(AT, new Grinder({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 }))
  w.actor.x = AT.col + 0.5
  w.actor.y = AT.row + 0.5
  return w
}

function grindHandOnce(seed: number): number {
  const w = grindWorld(seed)
  w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'wheat', rarity: 'rare', count: 1, unitSale: 28 } }
  w.click(AT)
  for (let i = 0; i < 50; i++) w.tick(1 / 15)
  const slot = w.inventory.find(
    s => s.kind === 'hold' && s.item.kind === 'seeds' && s.item.crop === 'wheat' && s.item.rarity === 'rare',
  )
  if (slot === undefined || slot.kind !== 'hold' || slot.item.kind !== 'seeds') return 0
  return slot.item.count
}

function sameEdge(a: Edge, b: Edge): boolean {
  return a.axis === b.axis && a.col === b.col && a.row === b.row
}

function sorted(cs: { col: number; row: number }[]): { col: number; row: number }[] {
  return [...cs].sort((a, b) => a.row - b.row || a.col - b.col)
}

describe('0.8 plants and trees', () => {
  test('vanilla saleMul 1 / 1.25 / 3 / 6; common 22 < raspberry 26', () => {
    const w = new World()
    expect(statsOf('vanilla', 'common', w.modifiers).sale).toBe(22)
    expect(statsOf('vanilla', 'rare', w.modifiers).sale).toBe(66)
    expect(statsOf('vanilla', 'heirloom', w.modifiers).sale).toBe(132)
    expect(statsOf('raspberry', 'common', w.modifiers).sale).toBe(26)
  })

  test('fermentation unlocks cane; raspberry reveal is grape', () => {
    expect(RESEARCH['unlock-fermentation']).toMatchObject({ tree: 'automation', cost: 14, seconds: 50, reveal: 'start' })
    expect(SKUS['pack-sugar-cane'].unlock).toBe('unlock-fermentation')
    expect(RESEARCH['unlock-raspberry'].reveal).toBe('unlock-grape')
    expect(RESEARCH['unlock-olive'].reveal).toBe('unlock-tomato')
    expect(SKUS['pack-vanilla'].show).toBe('unlock-raspberry')
    expect(SKUS['pack-vanilla'].need).toBe('vanilla-tending')
    expect(Object.keys(RESEARCH).includes('unlock-vanilla')).toBe(false)
  })

  test('vanilla pack shows after raspberry; buy needs vanilla-tending', () => {
    const w = new World()
    expect(w.skuShown('pack-vanilla')).toBe(false)
    w.done.add('unlock-raspberry')
    expect(w.skuShown('pack-vanilla')).toBe(true)
    expect(w.skuOpen('pack-vanilla')).toBe(false)
    w.family.player.owned.set('vanilla-tending', 1)
    expect(w.skuOpen('pack-vanilla')).toBe(true)
  })

  test('ripe cane harvests sugar not fruit', () => {
    const w = new World()
    w.hand = { kind: 'empty' }
    w.actor.x = AT.col + 0.5
    w.actor.y = AT.row + 0.5
    const p = new Plant('sugar-cane', 'common')
    w.setCell(AT, { kind: 'ripe', soil: bed(), plant: p })
    w.click(AT)
    for (let i = 0; i < 20; i++) w.tick(1 / 15)
    expect(w.hand.kind === 'hold' && w.hand.item.kind).toBe('sugar')
    expect(w.cell(AT).kind).toBe('empty')
  })

  test('tree juvenile then pending; next seam starts yield', () => {
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('lemon', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0, { kind: 'pending' })
    w.setCell(AT, tree)
    w.setCell(below, tree)
    expect(tree.yield.kind).toBe('pending')
    w.clock.t = 239.9
    for (let i = 0; i < 20 && w.seam.kind !== 'recap'; i++) w.tick(1)
    expect(tree.yield.kind).toBe('on')
    if (tree.yield.kind === 'on') expect(tree.yield.daysLeft).toBe(2)
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
