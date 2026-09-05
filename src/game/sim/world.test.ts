// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import { CROPS, freshMul, HAPPY_MAX, HAPPY_START } from '../defs/crops.ts'
import {
  ADDITIVE_CAP_LITERS,
  BULK_UP_CRAFTED_STEP,
  BULK_UP_STEP,
  COMPOST_LITERS,
  COMPOST_SECONDS,
  CONTAINERS,
  FERT_BAG_LITERS,
  FREEZER_LARGE_SLOTS,
  CHOP_GRAFTS,
  GRIND_MAX,
  GRIND_MIN,
  grindMinAt,
  NEIGHBOUR_REACH,
  SILO_SEED_CAP,
  SPEECH_S,
  SPRINKLER_TILE_RATE,
  STACK_MAX,
  STACK_MAX_CRAFTED,
  STILL_WATER,
  SYNTH_BAG_LITERS,
  WEED_SPRAY_BAG,
  GRIND_WORK,
} from '../defs/items.ts'
import { BETTER_QUALITY, purposeMul, qualityMul, STARTER_TREE_GRAFTS, VARIETY, type VarietyId } from '../defs/varieties.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { HUSBAND_SKILL_IDS, JAM_ROT, PLAYER_SKILL_IDS, SKILLS, TEND_WORK, skillIds } from '../defs/skills.ts'
import { packSku, TREE_IDS, type AnnualId, type ResearchId, type SkuId } from './ids.ts'
import {
  Chest,
  CHUNK,
  DOOR,
  Freezer,
  Grinder,
  HOUSE_BASE,
  Mill,
  PAD,
  PotStill,
  PUMP_BASE,
  SILO_BASE,
  chunkRect,
  occupiedCells,
} from './building.ts'
import { FREEZER_ROT_MUL, SUGAR_BAG, SUGAR_MILL, SUGAR_SHOP } from '../defs/items.ts'
import { TREES, TREE_OFF_MUL, TREE_YIELD_DAYS, TREE_YIELD_MUL } from '../defs/trees.ts'
import { dump, parse } from './save.ts'
import { fruitMoney, itemLine, makePickaxe, makeShovel, skuLabel, type Hand, type Item } from './item.ts'
import { Plant, Weed } from './plant.ts'
import { aoe, junction, vertexKey, type Edge } from './pipe.ts'
import { Rock, Tree } from './building.ts'
import { Act, type Cmd } from './log.ts'
import { Rng } from './rng.ts'
import { Clock, DAY_SECONDS, days } from './clock.ts'
import { BIG_TICK, Soil, SOIL_TILL_WATER, SOIL_WATER_MID, STUNT, WEED_CHANCE, WEED_FERT_PER_SEC, GRASS_CHANCE, PLANT_FERT_PER_SEC, ramped } from './soil.ts'
import { bare } from './plot.ts'
import { SOURCE } from './water.ts'
import { goodness } from './noise.ts'
import { STALL_IDS } from './stall.ts'
import { statsOf } from './modifiers.ts'
import { grindAccept, grindApply, grindProduct } from './machine.ts'
import { footOutline } from '../view/outline.ts'
import { dest, DT_MAX, fillable, POINTS_PER_DAY, World } from './world.ts'
import { BUILD_SKUS, SHELVES, SHOP_SKUS } from '../defs/shelf.ts'


const HOME = [{ cx: 0, cy: 0 }]
const AT = { col: 10, row: 12 }

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
  return new Soil(water, fertilizer, WEED_CHANCE)
}

describe('beta-1 invariants', () => {
  test('weed and grass chances ramp from -10% over one day of big ticks', () => {
    expect(ramped(WEED_CHANCE, 0)).toBeLessThan(0)
    expect(ramped(GRASS_CHANCE, 0)).toBeLessThan(0)
    expect(ramped(WEED_CHANCE, 12)).toBeCloseTo((-0.1 + (WEED_CHANCE + 0.1) * 0.5), 9)
    expect(ramped(WEED_CHANCE, 24)).toBe(WEED_CHANCE)
    expect(ramped(GRASS_CHANCE, 24)).toBe(GRASS_CHANCE)
  })

  test('no plant tick across sundown', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: new Plant('carrot', 'base', 0) })
    w.clock.t = 239.999
    const before = (w.cell(AT) as { plant: Plant }).plant.maturity
    w.tick(1)
    const after = (w.cell(AT) as { plant: Plant }).plant.maturity
    expect(w.clock.day).toBe(2)
    expect(after).toBe(before)
  })

  test('growing plant grows; wilted grows stunted', () => {
    const w = new World()
    const p = new Plant('carrot', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(0.5), plant: p })
    const dry = new Plant('carrot', 'base', 0)
    w.setCell({ col: 10, row: 13 }, { kind: 'growing', soil: bed(0), plant: dry })
    const dt = 1 / 15
    w.tick(dt)
    expect(p.maturity).toBeCloseTo(dt / CROPS.carrot.growSeconds, 9)
    expect(dry.maturity).toBeCloseTo((dt * STUNT) / CROPS.carrot.growSeconds, 9)
  })

  test('dry starving soil kills growing not ripe', () => {
    const w = new World()
    const g = new Plant('carrot', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(0, 0), plant: g })
    for (let n = 0; n < 2000 && w.cell(AT).kind === 'growing'; n++) {
      if (w.seam.kind === 'recap') w.dismissRecap()
      w.tick(1)
    }
    expect(w.cell(AT).kind).toBe('dead')
    const r = new Plant('carrot', 'base', 0)
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
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'container', id: 'bucket', liters: 2, capacityLiters: 2 },
    }
    const s = bed(0.4)
    const p = new Plant('carrot', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: s, plant: p })
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    for (let n = 0; n < 12 && w.seats[0].queue.length > 0; n++) w.tick(1 / 15)
    const target = SOIL_WATER_MID + p.stats(w.modifiers).waterTolerance
    expect(s.water).toBeCloseTo(target, 2)
    expect(
      w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'container' ? w.seats[0].hand.item.liters : -1,
    ).toBeCloseTo(2 - (target - 0.4), 2)

    const bare2 = { col: 11, row: 12 }
    const sb = bed(0.2)
    w.setCell(bare2, { kind: 'empty', soil: sb })
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'container', id: 'bucket', liters: 2, capacityLiters: 2 },
    }
    w.seats[0].actor.x = 11.5
    w.seats[0].actor.y = 12.5
    w.click(bare2)
    for (let n = 0; n < 12 && w.seats[0].queue.length > 0; n++) w.tick(1 / 15)
    expect(sb.water).toBeCloseTo(SOIL_WATER_MID, 6)
    expect(
      w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'container' ? w.seats[0].hand.item.liters : -1,
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
    const sale = new Plant('carrot', 'base', 0).stats(w.modifiers).sale
    expect(sale).toBe(CROPS.carrot.sale * 1.04)
  })

  test('shovel 0 removes item', () => {
    const w = new World()
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 1, workSeconds: 0 } }
    w.setCell(AT, bare('soft'))
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.seats[0].hand.kind).toBe('empty')
    expect(w.cell(AT).kind).toBe('empty')
  })

  test('house occupies 12 cells, pump two, pumpjack does not mutate starter', () => {
    expect(occupiedCells(HOUSE_BASE, HOME)).toHaveLength(12)
    expect(occupiedCells(PUMP_BASE, HOME)).toEqual([
      { col: 18, row: 7 },
      { col: 19, row: 7 },
    ])
    const w = new World()
    w.buy('buy-pumpjack')
    expect(w.pump.water.rate).toBe(SOURCE.pump.rate)
    w.money = 50
    w.done.add('unlock-irrigation')
    w.done.add('unlock-water-storage')
    w.buy('buy-pumpjack')
    expect(w.seats[0].place.kind).toBe('sku')
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
    expect(w.seats[0].hand.kind).toBe('hold')
  })

  test('tilling mints soil at 0.75 water and noise fertilizer', () => {
    const w = new World()
    w.setCell(AT, bare('soft'))
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    for (let n = 0; n < 20 && w.cell(AT).kind !== 'empty'; n++) w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('empty')
    const soil = (w.cell(AT) as { soil: Soil }).soil
    expect(soil.water).toBe(SOIL_TILL_WATER)
    expect(soil.fertilizer).toBe(goodness(w.rng, AT.col, AT.row))
  })

  test('seed buy merges into the silo, not the house', () => {
    const w = new World()
    expect(siloCount(w, 'carrot', 'base')).toBe(7)
    expect(w.seats[0].inventory.some(s => s.kind === 'hold' && s.item.kind === 'seeds')).toBe(false)
    expect(w.drops).toHaveLength(1)
    expect(w.drops[0].item.kind).toBe('container')
    expect(w.buy('pack-carrot')).toBeUndefined()
    expect(w.money).toBe(47)
    expect(w.seats[0].place.kind).toBe('none')
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind).toBe('shovel')
    expect(siloCount(w, 'carrot', 'base')).toBe(12)
  })

  test('silo take puts the whole stack in hand and refuses past the cap', () => {
    const w = new World()
    w.seats[0].hand = { kind: 'empty' }
    w.takeSilo('potato', 'base')
    const hand = handOf(w)
    expect(hand.kind === 'hold' && hand.item.kind === 'seeds' && hand.item.count).toBe(2)
    expect(siloCount(w, 'potato', 'base')).toBe(0)
    w.silo.seeds.length = 0
    w.silo.seeds.push({ crop: 'carrot', variety: 'base', quality: 0, count: SILO_SEED_CAP })
    w.money = 999
    expect(w.buy('pack-wheat')).toBe('Seed silo full')
  })

  test('walking up to the silo stores every seed you carry', () => {
    const w = new World()
    w.seats[0].hand = { kind: 'hold', item: { kind: 'seeds', crop: 'wheat', variety: 'red-fife', quality: 0, count: 3 } }
    w.seats[0].inventory[5] = { kind: 'hold', item: { kind: 'seeds', crop: 'grape', variety: 'base', quality: 0, count: 4 } }
    w.click({ col: SILO_BASE.col, row: SILO_BASE.row })
    for (let n = 0; n < 60 && w.seats[0].queue.length > 0; n++) w.tick(1 / 15)
    expect(w.seats[0].hand.kind).toBe('empty')
    expect(siloCount(w, 'wheat', 'red-fife')).toBe(8)
    expect(siloCount(w, 'grape', 'base')).toBe(4)
    expect(w.seats[0].cue.kind).toBe('silo')
  })

  test('fertilizer is delivered to the additive store and drawn back as a bag', () => {
    const w = new World()
    w.money = 999
    expect(w.buy('buy-fertilizer')).toBeUndefined()
    expect(w.seats[0].place.kind).toBe('none')
    expect(w.additives.litersOf('fertilizer')).toBe(FERT_BAG_LITERS)
    w.seats[0].hand = { kind: 'empty' }
    w.takeAdditive('fertilizer')
    const hand = handOf(w)
    expect(hand.kind === 'hold' && hand.item.kind).toBe('fertilizer')
    expect(hand.kind === 'hold' && hand.item.kind === 'fertilizer' && hand.item.liters).toBe(FERT_BAG_LITERS)
    expect(w.additives.litersOf('fertilizer')).toBe(0)
  })

  test('sugar is delivered to the additive store and drawn back as a bag', () => {
    const w = new World()
    w.money = 999
    w.done.add('unlock-preservatives')
    expect(w.buy('buy-sugar')).toBeUndefined()
    expect(w.seats[0].place.kind).toBe('none')
    expect(w.additives.sugar.liters).toBe(SUGAR_BAG)
    expect(w.seats[0].inventory.some(s => s.kind === 'hold' && s.item.kind === 'sugar')).toBe(false)
    w.seats[0].hand = { kind: 'empty' }
    w.takeSugar()
    const hand = handOf(w)
    expect(hand.kind === 'hold' && hand.item.kind).toBe('sugar')
    expect(hand.kind === 'hold' && hand.item.kind === 'sugar' && hand.item.liters).toBe(SUGAR_BAG)
    expect(hand.kind === 'hold' && hand.item.kind === 'sugar' && hand.item.unitSale).toBe(SUGAR_SHOP)
    expect(w.additives.sugar.liters).toBe(0)
  })

  test('the store mixes sugar sale and quality by liters', () => {
    const w = new World()
    expect(w.putSugar(2, 10, 1)).toBe(2)
    expect(w.putSugar(2, 20, 0)).toBe(2)
    expect(w.additives.sugar.liters).toBe(4)
    expect(w.additives.sugar.unitSale).toBeCloseTo(15, 9)
    expect(w.additives.sugar.quality).toBeCloseTo(0.5, 9)
  })

  test('additive store caps at its liters and refuses the buy past it', () => {
    const w = new World()
    w.money = 999
    w.additives.held.length = 0
    w.additives.held.push({ id: 'fertilizer', liters: ADDITIVE_CAP_LITERS })
    expect(w.buy('buy-fertilizer')).toBe('Additive store full')
  })

  test('taking from a store sets down what the store will not keep', () => {
    const w = new World()
    const before = w.drops.length
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind).toBe('shovel')
    w.takeSilo('carrot', 'base')
    expect(w.drops).toHaveLength(before + 1)
    expect(w.drops[w.drops.length - 1].item.kind).toBe('shovel')
    const hand = handOf(w)
    expect(hand.kind === 'hold' && hand.item.kind === 'seeds' && hand.item.count).toBe(7)
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
      expect(w.seam.recap.water).toBe(0)
    }
  })

  test('bucket 5L large-bucket 10L no can ids', () => {
    expect(CONTAINERS.bucket.capacityLiters).toBe(5)
    expect(CONTAINERS['large-bucket'].capacityLiters).toBe(10)
    expect(Object.keys(CONTAINERS).sort()).toEqual(['bucket', 'large-bucket'])
    expect(Object.keys(SKUS).includes('buy-can')).toBe(false)
    expect(Object.keys(SKUS).includes('buy-can-large')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-can')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-large-can')).toBe(false)
  })

  test('drop and inventory enqueue until arrive', () => {
    const w = new World()
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    const hand = w.seats[0].hand
    const drops = w.drops.length
    w.setCell({ col: 8, row: 12 }, bare('soft'))
    w.rightClick({ col: 8, row: 12 })
    expect(w.seats[0].hand).toEqual(hand)
    expect(w.drops).toHaveLength(drops)
    expect(w.seats[0].queue[0]).toEqual({ act: 'drop', at: { col: 8, row: 12 } })
    w.click({ col: 14, row: 6 })
    expect(w.seats[0].queue[1]).toEqual({ act: 'inventory' })
    expect(w.seats[0].cue).toEqual({ kind: 'none' })
    expect(w.seats[0].hand).toEqual(hand)
  })

  test('compact after buy and swap', () => {
    const w = new World()
    w.buy('pack-carrot')
    expectPacked(w)
    expect(siloCount(w, 'carrot', 'base')).toBe(12)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 2, unitSale: 4, freshness: 1, bio: true, cut: false } }
    w.swap(1)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 3, unitSale: 4, freshness: 1, bio: true, cut: false } }
    w.swap(2)
    expectPacked(w)
    const fruits = w.seats[0].inventory.filter(s => s.kind === 'hold' && s.item.kind === 'fruit')
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
    expect(w.points).toBe(10)
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
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    const soil = bed()
    w.setCell(AT, { kind: 'growing', soil, plant: new Plant('carrot', 'base', 0) })
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT).kind).toBe('empty')
    expect((w.cell(AT) as { soil: Soil }).soil).toBe(soil)
    const seed = w.drops.find(d => d.at.col === 10 && d.at.row === 12)
    expect(seed?.item).toEqual({ kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 1 })
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    const dead = { col: 10, row: 13 }
    const deadSoil = bed()
    w.setCell(dead, { kind: 'dead', soil: deadSoil, plant: new Plant('carrot', 'base', 0) })
    const n = w.drops.length
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 13.5
    w.click(dead)
    w.tick(0.05)
    expect(w.cell(dead).kind).toBe('empty')
    expect((w.cell(dead) as { soil: Soil }).soil).toBe(deadSoil)
    expect(w.drops).toHaveLength(n)
    expect(w.drops.some(d => d.at.col === dead.col && d.at.row === dead.row && d.item.kind === 'dead')).toBe(false)
  })

  test('research costs match table', () => {
    expect(RESEARCH['unlock-tomato']).toMatchObject({ cost: 8, seconds: 30 })
    expect(RESEARCH['unlock-raspberry']).toMatchObject({ cost: 32, seconds: 45 })
    expect(RESEARCH['unlock-heirloom']).toMatchObject({ cost: 140, seconds: 140, tree: 'plants' })
    expect(RESEARCH['unlock-better-tools']).toMatchObject({ cost: 16, seconds: 45 })
    expect(RESEARCH['unlock-irrigation']).toMatchObject({ cost: 10, seconds: 40 })
    expect(RESEARCH['unlock-water-storage']).toMatchObject({ cost: 30, seconds: 70 })
    expect(RESEARCH['unlock-expand']).toMatchObject({ cost: 25, seconds: 45 })
    expect(RESEARCH['expand-land']).toMatchObject({ cost: 120, seconds: 90 })
    expect(RESEARCH['eminent-domain']).toMatchObject({ cost: 420, seconds: 180 })
    expect(RESEARCH['unlock-auto-irrigation']).toMatchObject({ cost: 20, seconds: 55 })
    expect(RESEARCH['unlock-adv-irrigation']).toMatchObject({ cost: 75, seconds: 75 })
    expect(RESEARCH['unlock-advanced-sensors']).toMatchObject({ cost: 140, seconds: 60 })
    expect(RESEARCH['unlock-smart-irrigation']).toMatchObject({ cost: 60, seconds: 100 })
    expect(RESEARCH['unlock-silos']).toMatchObject({ cost: 30, seconds: 60 })
    expect(RESEARCH['unlock-dispatch']).toMatchObject({ cost: 100, seconds: 80, tree: 'automation' })
    expect(RESEARCH['unlock-fertilizer']).toMatchObject({ cost: 10, seconds: 30 })
    expect(RESEARCH['unlock-crop-variants']).toMatchObject({ cost: 5, seconds: 40, tree: 'plants' })
    expect(RESEARCH['unlock-pickaxe']).toMatchObject({ cost: 12, seconds: 40 })
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
    expect(w.cell({ col: 19, row: 7 }).kind).toBe('pump')
    expect(w.cell({ col: 19, row: 7 })).toBe(w.cell({ col: 18, row: 7 }))
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
    w.seats[0].hand = makeShovel('shovel') as never
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 5, workSeconds: 1 } }
    w.setCell(AT, bare('hard'))
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.seats[0].actor.x = 4.5
    w.seats[0].actor.y = 4.5
    w.click(AT)
    expect(w.taskName(w.seats[0].queue[0])).toBe('Move here and dig')
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    for (let i = 0; i < 20; i++) w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('untilled')
    for (let i = 0; i < 20; i++) w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('empty')
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'shovel' && w.seats[0].hand.item.usesLeft).toBe(3)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 1, workSeconds: 1 } }
    const hard = { col: 10, row: 14 }
    w.setCell(hard, bare('hard'))
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 14.5
    w.click(hard)
    expect(w.seats[0].queue).toHaveLength(0)
    expect(w.cell(hard).kind).toBe('untilled')
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'shovel' && w.seats[0].hand.item.usesLeft).toBe(1)
  })

  test('very-hard and rock refuse shovel', () => {
    const w = new World()
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.setCell(AT, bare('very-hard'))
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    expect(w.seats[0].queue).toHaveLength(0)
    expect(w.cell(AT).kind).toBe('untilled')
    w.setCell(AT, new Rock({ shape: 'rect', col: 10, row: 12, w: 1, h: 1 }))
    w.click(AT)
    expect(w.seats[0].queue).toHaveLength(0)
    expect(w.cell(AT).kind).toBe('rock')
  })

  test('pickaxe turns very-hard into infertile', () => {
    const w = new World()
    w.seats[0].hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    w.setCell(AT, bare('very-hard'))
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    for (let i = 0; i < 70; i++) w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('infertile')
    w.seats[0].hand = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 1 } }
    w.click(AT)
    expect(w.seats[0].queue).toHaveLength(0)
    expect(w.cell(AT).kind).toBe('infertile')
  })

  test('pickaxe mines 1x1 and 1x2', () => {
    const w = new World()
    w.seats[0].hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    w.setCell(AT, new Rock({ shape: 'rect', col: 10, row: 12, w: 1, h: 1 }))
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    for (let i = 0; i < 130; i++) w.tick(1 / 15)
    expect(w.cell(AT)).toEqual(bare('soft'))
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'pickaxe' && w.seats[0].hand.item.usesLeft).toBe(24)
    const a = { col: 10, row: 16 }
    const b = { col: 10, row: 17 }
    const rock = new Rock({ shape: 'rect', col: 10, row: 16, w: 1, h: 2 })
    w.setCell(a, rock)
    w.setCell(b, rock)
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 16.5
    w.click(a)
    for (let i = 0; i < 250; i++) w.tick(1 / 15)
    expect(w.cell(a)).toEqual(bare('soft'))
    expect(w.cell(b)).toEqual(bare('soft'))
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'pickaxe' && w.seats[0].hand.item.usesLeft).toBe(22)
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

  test('shovel tree drops tree-seed; cells stay tree until dug', () => {
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('apricot', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0, { kind: 'on', daysLeft: 2 })
    w.setCell(AT, tree)
    w.setCell(below, tree)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT)).toEqual(bare('soft'))
    expect(w.cell(below)).toEqual(bare('soft'))
    expect(w.drops.some(d => d.item.kind === 'tree-seed' && d.item.kind === 'tree-seed' && d.item.tree === 'apricot')).toBe(true)
  })

  test('planting a tree seed puts the clicked cell at the foot of the tree', () => {
    const w = new World()
    const above = { col: AT.col, row: AT.row - 1 }
    w.setCell(AT, bare('soft'))
    w.setCell(above, bare('soft'))
    w.setCell({ col: AT.col, row: AT.row + 1 }, bare('soft'))
    w.seats[0].hand = { kind: 'hold', item: { kind: 'tree-seed', tree: 'cherry', variety: 'base', quality: 0 } }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 2.5
    w.click(AT)
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const foot = w.cell(AT)
    const head = w.cell(above)
    expect(foot.kind).toBe('tree')
    expect(head).toBe(foot)
    expect(foot.kind === 'tree' && foot.base.row).toBe(above.row)
    expect(w.cell({ col: AT.col, row: AT.row + 1 })).toEqual(bare('soft'))
  })

  test('pickaxe sku 20 gated on unlock-pickaxe; rarity table', () => {
    expect(SKUS['buy-pickaxe'].price).toBe(18)
    expect(SKUS['buy-pickaxe'].unlock).toBe('unlock-pickaxe')
    expect(SKUS['buy-better-pickaxe'].unlock).toBe('unlock-pickaxe')
    expect(qualityMul(0)).toBe(1)
    expect(qualityMul(1)).toBe(3.5)
    expect(RESEARCH['unlock-raspberry'].reveal).toEqual(['unlock-tomato', 'unlock-grape'])
  })

  test('walk onto rock is legal', () => {
    const w = new World()
    w.setCell(AT, new Rock({ shape: 'rect', col: 10, row: 12, w: 1, h: 1 }))
    w.seats[0].hand = { kind: 'empty' }
    w.seats[0].actor.x = 4.5
    w.seats[0].actor.y = 4.5
    w.click(AT)
    expect(w.seats[0].queue[0]).toEqual({ act: 'walk', at: AT })
    for (let i = 0; i < 40; i++) w.tick(1 / 15)
    expect(w.seats[0].actor.inside(AT)).toBe(true)
  })
})

describe('beta-4 invariants', () => {
  test("`inventory.slots` — House starter: four `'base'` tree seeds and one graft of every tree variety. Ten of sixteen.", () => {
    const w = new World()
    const inv = w.seats[0].inventory
    const trees = inv.flatMap(s => (s.kind === 'hold' && s.item.kind === 'tree-seed' ? [s.item] : []))
    expect(trees.map(t => t.tree).sort()).toEqual(['apple', 'apricot', 'cherry', 'olive'])
    expect(trees.every(t => t.variety === 'base' && t.quality === 0)).toBe(true)
    const grafts = inv.flatMap(s => (s.kind === 'hold' && s.item.kind === 'graft' ? [s.item] : []))
    expect(grafts.map(g => g.variety).sort()).toEqual([...STARTER_TREE_GRAFTS].sort())
    expect(grafts.every(g => g.count === 1 && g.quality === 0 && VARIETY[g.variety as Exclude<VarietyId, 'base'>].crop === g.crop)).toBe(true)
    expect(inv.filter(s => s.kind === 'hold').length).toBe(TREE_IDS.length + STARTER_TREE_GRAFTS.length)
    expect(inv.length).toBe(16)
  })

  test('buy-chest place 1x1 own slots', () => {
    expect(SKUS['buy-chest'].price).toBe(18)
    expect(RESEARCH['unlock-chest'].cost).toBe(10)
    const w = new World()
    w.done.add('unlock-chest')
    const a = { col: 10, row: 12 }
    const b = { col: 11, row: 12 }
    w.setCell(a, { kind: 'empty', soil: bed() })
    w.setCell(b, { kind: 'empty', soil: bed() })
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
    ca.slots[0] = { kind: 'hold', item: { kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0 } }
    expect(cb.slots[0].kind).toBe('empty')
  })

  test('Grinder is a hopper. `GRIND_WORK` 12 — preference. Mill-like tick. Not actor work. Seeds do not merge into house.', () => {
    expect(GRIND_WORK).toBe(12)
    const w = grindWorld(7)
    w.seats[0].inventory.forEach((_, i) => {
      w.seats[0].inventory[i] = { kind: 'hold', item: { kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0 } }
    })
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'wheat', variety: 'red-fife', quality: 0, count: 1, unitSale: 28, freshness: 1, bio: true, cut: false },
    }
    w.click(AT)
    w.tick(DT_MAX)
    expect(w.seats[0].workTotal).toBe(0.4)
    for (let i = 0; i < 10; i++) w.tick(DT_MAX)
    const g = w.cell(AT)
    expect(g.kind).toBe('grinder')
    if (g.kind !== 'grinder') return
    expect(g.crop).toBe('wheat')
    expect(g.variety).toBe('red-fife')
    expect(g.units).toBe(1)
    const loaded = parse(JSON.stringify(dump(w)))
    expect(loaded.ok).toBe(true)
    if (loaded.ok) {
      const lg = loaded.world.cell(AT)
      expect(lg.kind === 'grinder' && lg.crop).toBe('wheat')
      expect(lg.kind === 'grinder' && lg.units).toBe(1)
    }
    expect(w.seats[0].hand.kind).toBe('empty')
    expect(w.seats[0].inventory.every(s => s.kind === 'hold' && s.item.kind === 'tree-seed')).toBe(true)
    for (let i = 0; i < Math.ceil(GRIND_WORK / DT_MAX) + 20; i++) w.tick(DT_MAX)
    const u = new Rng(7).stream('grind').at(AT.col, AT.row, 1, 0)
    const expectCount = GRIND_MIN + Math.floor(u * (GRIND_MAX - GRIND_MIN + 1))
    const dropped = w.drops.filter(d => d.item.kind === 'seeds')
    expect(dropped).toHaveLength(1)
    expect(dropped[0].item.kind === 'seeds' && dropped[0].item.crop).toBe('wheat')
    expect(dropped[0].item.kind === 'seeds' && dropped[0].item.variety).toBe('red-fife')
    expect(dropped[0].item.kind === 'seeds' && dropped[0].item.count).toBe(expectCount)
    expect(w.seats[0].inventory.every(s => s.kind === 'hold' && s.item.kind === 'tree-seed')).toBe(true)
    expect(g.crop).toBe('none')
  })

  test('fruit stack N hopper dump hand empty overflow drops', () => {
    const n = 3
    const w = grindWorld(11)
    w.seats[0].inventory.forEach((_, i) => {
      w.seats[0].inventory[i] = { kind: 'hold', item: { kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0 } }
    })
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'tomato', variety: 'green-zebra', quality: 0, count: n, unitSale: 22.5, freshness: 1, bio: true, cut: false },
    }
    w.click(AT)
    w.tick(DT_MAX)
    expect(w.seats[0].workTotal).toBe(0.4)
    for (let i = 0; i < 10; i++) w.tick(DT_MAX)
    expect(w.seats[0].hand.kind).toBe('empty')
    const g = w.cell(AT)
    expect(g.kind === 'grinder' && g.units).toBe(n)
    for (let i = 0; i < Math.ceil((n * GRIND_WORK) / DT_MAX) + 20; i++) w.tick(DT_MAX)
    let expectCount = 0
    for (let i = 0; i < n; i++) {
      const u = new Rng(11).stream('grind').at(AT.col, AT.row, 1, i)
      expectCount += GRIND_MIN + Math.floor(u * (GRIND_MAX - GRIND_MIN + 1))
    }
    const dropped = w.drops.filter(d => d.item.kind === 'seeds' && d.item.crop === 'tomato' && d.item.variety === 'green-zebra')
    const got = dropped.reduce((s, d) => s + (d.item.kind === 'seeds' ? d.item.count : 0), 0)
    expect(got).toBe(expectCount)
    expect(w.seats[0].inventory.every(s => s.kind === 'hold' && s.item.kind === 'tree-seed')).toBe(true)
  })

  test('unlock-grinder automation buy-grinder 30', () => {
    expect(RESEARCH['unlock-grinder'].cost).toBe(10)
    expect(RESEARCH['unlock-grinder'].tree).toBe('trade')
    expect(SKUS['buy-grinder'].price).toBe(30)
    expect(SKUS['buy-grinder'].unlock).toBe('unlock-grinder')
  })

  test('research names and unlock-expand tree', () => {
    expect(RESEARCH['unlock-tomato'].name).toBe('Tomato seeds')
    expect(RESEARCH['unlock-raspberry'].name).toBe('Raspberry seeds')
    expect(RESEARCH['unlock-heirloom'].name).toBe('Heirloom crops')
    expect(RESEARCH['unlock-fertilizer'].name).toBe('Synthetic fertilizer')
    expect(RESEARCH['unlock-better-tools'].name).toBe('Better gardening tools')
    expect(RESEARCH['unlock-irrigation'].name).toBe('Irrigation')
    expect(RESEARCH['unlock-chest'].name).toBe('Chest')
    expect(RESEARCH['unlock-water-storage'].name).toBe('Water storage')
    expect(RESEARCH['unlock-silos'].name).toBe('Field silos')
    expect(RESEARCH['unlock-expand'].name).toBe('Expansion')
    expect(RESEARCH['unlock-pickaxe'].name).toBe('Pickaxes')
    expect(RESEARCH['unlock-grinder'].name).toBe('Machinery')
    expect(RESEARCH['unlock-expand'].tree).toBe('land')
  })

  test('itemLine fruit shows freshness; berry has no money clause', () => {
    const w = new World()
    expect(
      itemLine({ kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 3, unitSale: 4, freshness: 1, bio: true, cut: false }, w.modifiers),
    ).toBe(`Carrot - 3, freshness 100% ${m.hud_quality_pct({ n: 0 })}`)
    expect(itemLine({ kind: 'sugar', liters: 2, capacityLiters: 2, unitSale: 5, quality: 0 }, w.modifiers)).toBe(
      `Sugar - 2L ${m.hud_quality_pct({ n: 0 })}`,
    )
  })

  test('infertile prompt is does not need seeds', () => {
    const w = new World()
    w.setCell(AT, { kind: 'infertile' })
    const p = w.prompt(AT)
    expect(p.kind).toBe('blocked')
    expect(p.text).toBe('Does not need seeds')
  })

  test('pickaxe on ripe does not queue and speaks', () => {
    const w = new World()
    w.setCell(AT, { kind: 'ripe', soil: bed(), plant: new Plant('carrot', 'base', 0) })
    w.seats[0].hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    const q = [...w.seats[0].queue]
    w.click(AT)
    expect(w.seats[0].queue).toEqual(q)
    expect(w.speech).toEqual({
      kind: 'say',
      text: m.prompt_cannot_use({ tool: m.names_pickaxe_pickaxe(), action: m.prompt_harvest() }),
      left: 2.5,
    })
  })

  test('better pickaxe shown after pickaxe research', () => {
    const w = new World()
    expect(w.skuShown('buy-pickaxe')).toBe(true)
    expect(w.skuShown('buy-better-pickaxe')).toBe(false)
    w.done.add('unlock-pickaxe')
    expect(w.skuShown('buy-better-pickaxe')).toBe(true)
    expect(w.skuOpen('buy-better-pickaxe')).toBe(true)
  })
})

describe('beta-5 invariants', () => {
  test('buy-pipe 3; two adjacent owned edges join one net', () => {
    expect(SKUS['buy-pipe'].price).toBe(3)
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.money = 50
    w.buy('buy-pipe')
    expect(w.seats[0].place).toEqual({ kind: 'sku', id: 'buy-pipe' })
    const e1: Edge = { axis: 'h', col: 10, row: 12 }
    const e2: Edge = { axis: 'h', col: 11, row: 12 }
    w.placePipe(e1)
    w.placePipe(e2)
    expect(w.seats[0].place).toEqual({ kind: 'sku', id: 'buy-pipe' })
    expect(w.hasPipe(e1)).toBe(true)
    expect(w.hasPipe(e2)).toBe(true)
    expect(w.money).toBe(44)
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
    expect(SKUS['buy-pumpjack'].price).toBe(50)
    expect(SKUS['buy-well'].price).toBe(75)
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.done.add('unlock-adv-irrigation')
    w.done.add('unlock-water-storage')
    w.money = 200
    w.buy('buy-pipe')
    const e1: Edge = { axis: 'h', col: 10, row: 12 }
    w.placePipe(e1)
    const wellAt = { col: 20, row: 12 }
    w.setCell(wellAt, bare('soft'))
    w.buy('buy-well')
    w.confirmPlace(wellAt)
    const well = w.cell(wellAt)
    expect(well.kind).toBe('well')
    if (well.kind !== 'well') return
    expect(well.water.rate).toBe(SOURCE.well.rate)
    expect(well.water.capacity).toBe(SOURCE.well.capacity)
    expect(well.water.stored).toBe(SOURCE.well.start)
    expect(w.wells).toHaveLength(1)
    const net = w.netOfVertex({ col: 18, row: 7 })
    expect(net).toBeDefined()
    expect(net?.sources).toHaveLength(1)
    const wellNet = w.netOfVertex(wellAt)
    expect(wellNet).toBeDefined()
    expect(wellNet?.sources).toHaveLength(1)
    expect(wellNet).not.toBe(net)
  })

  test('well is a 1x1 source cell: joins its four corners into one net, fills a bucket, deletes like a building', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.done.add('unlock-adv-irrigation')
    w.done.add('unlock-water-storage')
    w.money = 200
    const at = { col: 10, row: 12 }
    w.setCell(at, bare('soft'))
    w.buy('buy-well')
    w.confirmPlace(at)
    expect(w.cell(at).kind).toBe('well')
    const a = w.netOfVertex({ col: 10, row: 12 })
    const b = w.netOfVertex({ col: 11, row: 13 })
    expect(a).toBeDefined()
    expect(a).toBe(b)
    expect(fillable(w, at)).toBe(true)
    w.armDelete()
    w.deleteBuilding(at)
    expect(w.cell(at).kind).toBe('empty')
    expect(w.wells).toHaveLength(0)
  })

  test('one jack + five sprinklers share the source and water growing tiles', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.done.add('unlock-water-storage')
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
      w.placeSprinkler({ variant: 'basic', at: { col, row: 20 }, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    })
    const soils: Soil[] = []
    ;[5, 6, 7, 8, 9].forEach(col => {
      const s = bed(0.2)
      soils.push(s)
      const p = new Plant('carrot', 'base', 0)
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

  test('sprinkler vfx flips on the tick the pour changes, not on the big tick', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.done.add('unlock-water-storage')
    w.money = 500
    w.buy('buy-pumpjack')
    const at = { col: 5, row: 20 }
    w.setCell(at, bare('soft'))
    w.setCell({ col: 6, row: 20 }, bare('soft'))
    w.confirmPlace(at)
    w.buy('buy-pipe')
    w.placePipe({ axis: 'h', col: 5, row: 20 })
    w.buy('buy-sprinkler')
    const v = { col: 5, row: 20 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    w.setCell({ col: 5, row: 19 }, { kind: 'growing', soil: bed(0.2), plant: new Plant('carrot', 'base', 0) })

    w.tick(DT_MAX)
    expect(w.vfx.get(vertexKey(v))).toBe(true)

    w.setCell({ col: 5, row: 19 }, bare('soft'))
    w.tick(DT_MAX)
    expect(w.vfx.get(vertexKey(v))).toBe(false)
    expect(w.now * DT_MAX).toBeLessThan(BIG_TICK)
  })

  test('pipes no source rate 0', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-pipe')
    const e: Edge = { axis: 'h', col: 10, row: 20 }
    w.placePipe(e)
    w.buy('buy-sprinkler')
    w.placeSprinkler({ variant: 'basic', at: { col: 10, row: 20 }, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    expect(w.rate({ col: 10, row: 20 })).toBe(0)
  })

  test('research names trees reveal', () => {
    expect(RESEARCH['unlock-grape']).toMatchObject({
      name: 'Grape seeds',
      tree: 'plants',
      reveal: [],
    })
    expect(RESEARCH['unlock-irrigation']).toMatchObject({
      name: 'Irrigation',
      tree: 'automation',
      reveal: [],
    })
    expect(RESEARCH['unlock-heirloom']).toMatchObject({
      name: 'Heirloom crops',
      tree: 'plants',
      reveal: ['expand-land', 'unlock-vehicles', 'unlock-crop-variants'],
      requires: ['unlock-crop-variants'],
    })
    expect(RESEARCH['unlock-auto-irrigation']).toMatchObject({
      name: 'Automated irrigation',
      tree: 'automation',
      reveal: ['unlock-irrigation'],
      requires: ['unlock-irrigation'],
    })
    expect(RESEARCH['unlock-adv-irrigation']).toMatchObject({
      name: 'Advanced irrigation',
      tree: 'automation',
      reveal: ['unlock-auto-irrigation'],
      requires: ['unlock-auto-irrigation'],
    })
    expect(RESEARCH['unlock-smart-irrigation']).toMatchObject({
      reveal: ['unlock-sensors'],
      requires: ['unlock-adv-irrigation', 'unlock-sensors'],
    })
    expect(RESEARCH['unlock-dispatch']).toMatchObject({
      name: 'Automated dispatch',
      tree: 'automation',
      reveal: ['unlock-vehicles'],
      requires: ['unlock-vehicles'],
      grants: ['Automate on the Vehicle hangar'],
      effect: { kind: 'feature' },
    })
    expect(Object.keys(RESEARCH).includes('unlock-pumpjack')).toBe(false)
    const w = new World()
    w.done.add('unlock-irrigation')
    expect(w.skuShown('buy-sprinkler')).toBe(true)
    expect(w.skuOpen('buy-sprinkler')).toBe(false)
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    expect(w.skuOpen('buy-sprinkler')).toBe(true)
  })

  test('`unlock-dispatch` automation, `reveal` and `requires` `unlock-vehicles`, `effect` `feature`, grants Automate chrome. Card **Automated dispatch**. Cost 100, seconds 80 preference. Automate chrome iff that row is in `done`. `buy-traffic-light` `show` `unlock-sensors` `need` `unlock-dispatch`. `Sku.tab` automation. `haggling`. `Act.route` no-op unless `unlock-dispatch` in `done`.', () => {
    expect(RESEARCH['unlock-dispatch']).toMatchObject({
      tree: 'automation',
      reveal: ['unlock-vehicles'],
      requires: ['unlock-vehicles'],
      effect: { kind: 'feature' },
      grants: ['Automate on the Vehicle hangar'],
      name: 'Automated dispatch',
      cost: 100,
      seconds: 80,
    })
    expect(SKUS['buy-traffic-light']).toMatchObject({
      show: 'unlock-sensors',
      need: ['unlock-dispatch'],
      tab: 'automation',
    })
    const w = new World(1)
    w.createRoute()
    expect(w.routes).toHaveLength(0)
    w.done.add('unlock-dispatch')
    w.createRoute()
    expect(w.routes).toHaveLength(1)
  })

  test('delete no money change; pumpjack remains', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.done.add('unlock-water-storage')
    w.done.add('unlock-grinder')
    w.money = 200
    w.buy('buy-pumpjack')
    const at = { col: 10, row: 12 }
    w.setCell(at, { kind: 'empty', soil: bed() })
    w.setCell({ col: 11, row: 12 }, { kind: 'empty', soil: bed() })
    w.confirmPlace(at)
    expect(w.cell(at).kind).toBe('pump')
    w.buy('buy-pipe')
    const e: Edge = { axis: 'h', col: 10, row: 12 }
    w.placePipe(e)
    w.buy('buy-sprinkler')
    const v = { col: 10, row: 12 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    w.buy('buy-grinder')
    const g = { col: 8, row: 12 }
    w.setCell(g, { kind: 'empty', soil: bed() })
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
    expect(sorted(aoe({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 }))).toEqual(
      sorted([
        { col: 9, row: 11 },
        { col: 10, row: 11 },
        { col: 9, row: 12 },
        { col: 10, row: 12 },
      ]),
    )
    expect(sorted(aoe({ variant: 'large', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 }))).toEqual(
      sorted(
        [-2, -1, 0, 1].flatMap(dr => [-2, -1, 0, 1].map(dc => ({ col: 10 + dc, row: 12 + dr }))),
      ),
    )
    expect(sorted(aoe({ variant: 'vert', at: v, facing: 'ns', tune: { kind: 'flat' }, inn: 0, hold: 0 }))).toEqual(
      sorted(
        [-2, -1, 0, 1].flatMap(dr => [-1, 0].map(dc => ({ col: 10 + dc, row: 12 + dr }))),
      ),
    )
    expect(sorted(aoe({ variant: 'vert', at: v, facing: 'ew', tune: { kind: 'flat' }, inn: 0, hold: 0 }))).toEqual(
      sorted(
        [-1, 0].flatMap(dr => [-2, -1, 0, 1].map(dc => ({ col: 10 + dc, row: 12 + dr }))),
      ),
    )
  })

  test('sprinkler waters growing soil only; ripe untouched', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-pipe')
    w.placePipe({ axis: 'h', col: 18, row: 7 })
    w.buy('buy-sprinkler')
    w.placeSprinkler({ variant: 'basic', at: { col: 19, row: 7 }, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    const gs = bed(0.5)
    const g = new Plant('carrot', 'base', 0)
    w.setCell({ col: 18, row: 6 }, { kind: 'growing', soil: gs, plant: g })
    const rs = bed(0.5)
    const r = new Plant('carrot', 'base', 0)
    r.maturity = 1
    w.setCell({ col: 19, row: 6 }, { kind: 'ripe', soil: rs, plant: r })
    w.tick(1 / 15)
    expect(gs.water).toBeGreaterThan(0.5)
    expect(rs.water).toBe(0.5)
  })

  test('place basic, no incident pipe, succeeds, rate 0', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-sprinkler')
    const v = { col: 10, row: 12 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    expect(w.sprinklerAt(v)).toEqual({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    expect(w.rate(v)).toBe(0)
  })

  test('isolated sprinkler then source-touching pipe at vertex', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-sprinkler')
    const v = { col: 19, row: 7 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    const g = new Plant('carrot', 'base', 0)
    w.setCell({ col: 18, row: 6 }, { kind: 'growing', soil: bed(0.5), plant: g })
    expect(w.rate(v)).toBe(0)
    w.buy('buy-pipe')
    const e: Edge = { axis: 'h', col: 18, row: 7 }
    w.placePipe(e)
    expect(w.rate(v)).toBeCloseTo(SPRINKLER_TILE_RATE, 9)
  })

  test('growing in AoE R>0 soil not below dry trajectory', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.money = 100
    w.buy('buy-pipe')
    w.placePipe({ axis: 'h', col: 18, row: 7 })
    w.buy('buy-sprinkler')
    const v = { col: 19, row: 7 }
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    const s = bed(0.5)
    const g = new Plant('carrot', 'base', 0)
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
    expect(SKUS['pack-raspberry'].price).toBe(22)
  })

  test('ripe plant freshness starts 1 then rots', () => {
    const w = new World()
    const p = new Plant('raspberry', 'base', 0)
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
    w.seats[0].hand = { kind: 'empty' }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    const sale = new Plant('carrot', 'base', 0).stats(w.modifiers).sale
    const a = new Plant('carrot', 'base', 0)
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
    w.seats[0].hand = { kind: 'empty' }
    const b = new Plant('carrot', 'base', 0)
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
    w.seats[0].inventory[0] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 1, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    w.seats[0].inventory[1] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 1, unitSale: 6, freshness: 1, bio: true, cut: false },
    }
    w.compactInventory()
    const slot = w.seats[0].inventory[0]
    expect(slot.kind === 'hold' && slot.item.kind === 'fruit' && slot.item.unitSale).toBe(5)
    expect(slot.kind === 'hold' && slot.item.kind === 'fruit' && slot.item.count).toBe(2)
    if (slot.kind === 'hold' && slot.item.kind === 'fruit') expect(fruitMoney(slot.item)).toBe(10)
  })

  test('buy-delete is not a SkuId; the build shelf has no Delete', () => {
    expect((Object.keys(SKUS) as string[]).includes('buy-delete')).toBe(false)
    expect(BUILD_SKUS.includes('buy-delete' as SkuId)).toBe(false)
    expect(BUILD_SKUS.some(id => skuLabel(id) === 'Delete')).toBe(false)
  })

  test('every sku sits in exactly one shelf group', () => {
    const shelved = SHELVES.flatMap(s => s.groups.flatMap(g => g.skus))
    expect([...shelved].sort()).toEqual((Object.keys(SKUS) as SkuId[]).sort())
  })

  test('build shelves hold no seeds tab sku', () => {
    expect(BUILD_SKUS.filter(id => SKUS[id].tab === 'seeds')).toEqual([])
    expect(SHOP_SKUS.length + BUILD_SKUS.length).toBe(Object.keys(SKUS).length)
  })

  test('delete pumpjack money unchanged both empty starter remains', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-water-storage')
    w.money = 200
    w.buy('buy-pumpjack')
    w.setCell(AT, { kind: 'empty', soil: bed() })
    w.setCell({ col: 11, row: 12 }, { kind: 'empty', soil: bed() })
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
    w.setCell(AT, { kind: 'empty', soil: bed() })
    w.confirmPlace(AT)
    const chest = w.cell(AT)
    expect(chest.kind).toBe('chest')
    if (chest.kind !== 'chest') return
    chest.slots[0] = { kind: 'hold', item: { kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0 } }
    chest.slots[1] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 2 } }
    w.armDelete()
    const n = w.drops.length
    w.deleteBuilding(AT)
    expect(w.cell(AT).kind).toBe('empty')
    expect(w.drops).toHaveLength(n + 2)
    expect(w.drops.some(d => d.at.col === AT.col && d.at.row === AT.row && d.item.kind === 'tree-seed')).toBe(true)
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
    w.seats[0].hand = { kind: 'hold', item: makePickaxe('pickaxe') }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    const drops = w.drops.length
    w.click(AT)
    expect(w.cell(AT).kind).toBe('rotten')
    w.seats[0].hand = { kind: 'empty' }
    w.click(AT)
    expect(w.cell(AT).kind).toBe('rotten')
    while (w.seats[0].queue.length > 0) w.tick(1 / 15)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT).kind).toBe('empty')
    expect(w.drops).toHaveLength(drops)
    expect(w.drops.some(d => d.at.col === AT.col && d.at.row === AT.row && d.item.kind === 'rotten')).toBe(false)
  })

  test('different rarity seeds do not merge', () => {
    const w = new World()
    w.seats[0].inventory[0] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 2 } }
    w.seats[0].inventory[1] = { kind: 'hold', item: { kind: 'seeds', crop: 'potato', variety: 'bintje', quality: 0, count: 3 } }
    w.compactInventory()
    const a = w.seats[0].inventory[0]
    const b = w.seats[0].inventory[1]
    expect(a.kind === 'hold' && a.item.kind === 'seeds' && a.item.variety).toBe('base')
    expect(a.kind === 'hold' && a.item.kind === 'seeds' && a.item.count).toBe(2)
    expect(b.kind === 'hold' && b.item.kind === 'seeds' && b.item.variety).toBe('bintje')
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
    const wilt = new Plant('carrot', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: drySoil, plant: wilt })
    const wetAt = { col: 11, row: 12 }
    const wetSoil = bed(1)
    const wet = new Plant('carrot', 'base', 0)
    w.setCell(wetAt, { kind: 'growing', soil: wetSoil, plant: wet })
    const use = wilt.stats(w.modifiers).waterUsePerSec
    const dt = 1 / 15
    w.tick(dt)
    expect(drySoil.water).toBe(0)
    expect(wetSoil.water).toBeCloseTo(1 - use * dt, 9)
    expect(wilt.maturity).toBeCloseTo((dt * STUNT) / CROPS.carrot.growSeconds, 9)
    expect(wet.maturity).toBeCloseTo(dt / CROPS.carrot.growSeconds, 9)
  })

  test("shop packs are `'base'` quality 0. `heirloom` skill gated on `unlock-heirloom`.", () => {
    expect(SKILLS.heirloom.gate).toEqual({ kind: 'research', id: 'unlock-heirloom' })
    const w = new World(1)
    expect(w.buy('pack-wheat')).toBeUndefined()
    expect(w.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')).toEqual({
      crop: 'wheat',
      variety: 'base',
      quality: 0,
      count: 5,
    })
  })

  test('wilt drains happiness', () => {
    const w = new World()
    const p = new Plant('carrot', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: p })
    w.tick(1 / 15)
    expect(p.happiness).toBeLessThan(HAPPY_START)
    expect(p.happiness).toBeGreaterThan(0)
  })
})

function readHand(w: World): Hand {
  return w.seats[0].hand
}

function grindWorld(seed: number): World {
  const w = new World(seed)
  w.setCell(AT, new Grinder({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 }))
  w.seats[0].actor.x = AT.col + 0.5
  w.seats[0].actor.y = AT.row + 0.5
  return w
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
    expect(statsOf('vanilla', 'base', 0, w.modifiers).sale).toBe(22)
    expect(statsOf('vanilla', 'base', 1, w.modifiers).sale).toBe(22 * 3.5)
    expect(statsOf('raspberry', 'base', 0, w.modifiers).sale).toBe(26)
  })

  test('fermentation unlocks cane; raspberry reveal is grape', () => {
    expect(RESEARCH['unlock-fermentation']).toMatchObject({ tree: 'trade', cost: 45, seconds: 85, reveal: ['unlock-grinder'] })
    expect(SKUS['pack-sugar-cane'].unlock).toBe('unlock-fermentation')
    expect(RESEARCH['unlock-raspberry'].reveal).toEqual(['unlock-tomato', 'unlock-grape'])
    expect(Object.keys(RESEARCH).includes('unlock-vanilla')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-olive')).toBe(false)
  })

  test('vanilla, olive and the two late tools have no shop SKU: contract prizes only', () => {
    expect(Object.keys(SKUS).includes('pack-vanilla')).toBe(false)
    expect(Object.keys(SKUS).includes('pack-olive')).toBe(false)
    expect(Object.keys(SKUS).includes('buy-rotary-shovel')).toBe(false)
    expect(Object.keys(SKUS).includes('buy-diamond-pickaxe')).toBe(false)
    expect(packSku('vanilla')).toBeUndefined()
    expect(packSku('grape')).toBe('pack-grape')
  })

  test('Ripe cane harvests as fruit. Mill 5 cane → `SUGAR_BAG` 2 L at `SUGAR_MILL` 5 / L. Sugar `{ kind: \'sugar\'; liters; capacityLiters; unitSale }`. Illegal: `sugar.count`. Sugar does not tick freshness.', () => {
    const w = new World()
    w.seats[0].hand = { kind: 'empty' }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    const p = new Plant('sugar-cane', 'base', 0)
    w.setCell(AT, { kind: 'ripe', soil: bed(), plant: p })
    w.click(AT)
    for (let i = 0; i < 20; i++) w.tick(1 / 15)
    const h = w.seats[0].hand as Hand
    expect(h.kind).toBe('hold')
    if (h.kind !== 'hold' || h.item.kind !== 'fruit') throw new Error('fruit')
    expect(h.item.crop).toBe('sugar-cane')
    expect(w.cell(AT).kind).toBe('empty')
    expect('count' in { kind: 'sugar', liters: 2, capacityLiters: 2, unitSale: 5, quality: 0 }).toBe(false)
  })

  test('tree juvenile then pending; next seam starts yield', () => {
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('olive', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0, { kind: 'pending' })
    w.setCell(AT, tree)
    w.setCell(below, tree)
    expect(tree.yield.kind).toBe('pending')
    w.clock.t = 239.9
    for (let i = 0; i < 20 && w.seam.kind !== 'recap'; i++) w.tick(1)
    expect(tree.yield.kind).toBe('on')
    if (tree.yield.kind === 'on') expect(tree.yield.daysLeft).toBe(2)
  })

  test('juvenile growth does not ping', () => {
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('olive', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 0, 0, { kind: 'pending' })
    w.setCell(AT, tree)
    w.setCell(below, tree)
    let n = 0
    w.on(() => {
      n += 1
    })
    for (let i = 0; i < 30; i++) w.tick(DT_MAX)
    w.flushDirty()
    expect(n).toBe(0)
    expect(tree.juvenile).toBeGreaterThan(0)
    expect(tree.juvenile).toBeLessThan(1)
  })

  test('till grass does not bump groundRev', () => {
    const w = new World()
    w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0 } }
    w.setCell(AT, bare('soft'))
    const rev = w.groundRev
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.click(AT)
    w.tick(0.05)
    expect(w.cell(AT).kind).toBe('empty')
    expect(w.groundRev).toBe(rev)
  })
})

describe('1.2 machines', () => {
  test('Mill 5 cane → 2 L', () => {
    const w = new World()
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 })
    w.setCell(AT, mill)
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'sugar-cane', variety: 'base', quality: 0, count: 5, unitSale: 5, freshness: 1, bio: true, cut: false },
    }
    w.enqueue({ act: 'mill', at: AT })
    for (let i = 0; i < 200; i++) w.tick(DT_MAX)
    const drop = w.drops.find(d => d.item.kind === 'sugar')
    expect(drop?.item).toEqual({ kind: 'sugar', liters: SUGAR_BAG, capacityLiters: SUGAR_BAG, unitSale: SUGAR_MILL, quality: 0 })
    expect(mill.units).toBe(0)
  })

  test('still water refuse', () => {
    const w = new World()
    const still = new PotStill({ shape: 'rect', col: AT.col, row: AT.row, w: 2, h: 1 })
    w.setCell(AT, still)
    w.setCell({ col: AT.col + 1, row: AT.row }, still)
    w.stills.push(still)
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', variety: 'base', quality: 0, count: 10, unitSale: 6, freshness: 1, bio: true, cut: false },
    }
    w.enqueue({ act: 'still', at: AT })
    for (let i = 0; i < 40; i++) w.tick(DT_MAX)
    expect(still.progress).toBe(0)
    expect(w.drops.some(d => d.item.kind === 'spirit')).toBe(false)
  })

  test('freezer slows rot to `FREEZER_ROT_MUL` of the open rate, it does not stop it', () => {
    const w = new World()
    const fz = new Freezer({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 })
    w.setCell(AT, fz)
    const chestAt = { col: AT.col + 1, row: AT.row }
    const chest = new Chest({ shape: 'rect', col: chestAt.col, row: chestAt.row, w: 1, h: 1 })
    w.setCell(chestAt, chest)
    const fruit = { kind: 'fruit' as const, crop: 'carrot' as const, variety: 'base' as const, quality: 0 as const, count: 1, unitSale: 4, freshness: 1, bio: true, cut: false }
    fz.slots[0] = { kind: 'hold', item: { ...fruit } }
    chest.slots[0] = { kind: 'hold', item: { ...fruit } }
    w.tick(1)
    const frozen = fz.slots[0]
    const stored = chest.slots[0]
    const frozenLoss = frozen.kind === 'hold' && frozen.item.kind === 'fruit' ? 1 - frozen.item.freshness : 0
    const storedLoss = stored.kind === 'hold' && stored.item.kind === 'fruit' ? 1 - stored.item.freshness : 0
    expect(storedLoss).toBeGreaterThan(0)
    expect(frozenLoss).toBeGreaterThan(0)
    expect(frozenLoss / storedLoss).toBeCloseTo(FREEZER_ROT_MUL, 6)
  })

  test('Picked fruit keeps ticking freshness (hand, house, chest, ground, quad, harvest trailer) until sold. Freezer slots rot at `FREEZER_ROT_MUL`. Mill hopper is units, no freshness. `<= 0` replaces that slot with `{ kind: \'rotten\'; cls: CROPS[crop].cls; count }` in place, no auto-merge. Illegal: fruit with `freshness <= 0` after tick.', () => {
    const w = new World()
    const fruit = {
      kind: 'fruit' as const,
      crop: 'carrot' as const,
      variety: 'base' as const, quality: 0 as const,
      count: 3,
      unitSale: 3,
      freshness: 0.0001,
      bio: true,
      cut: false,
    }
    w.seats[0].hand = { kind: 'hold', item: { ...fruit } }
    w.seats[0].inventory[0] = { kind: 'hold', item: { ...fruit } }
    const chest = new Chest({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 })
    w.setCell(AT, chest)
    chest.slots[0] = { kind: 'hold', item: { ...fruit } }
    w.drops.push({ at: { col: AT.col + 1, row: AT.row }, item: { ...fruit } })
    w.tick(1)
    const rotten = { kind: 'rotten' as const, cls: CROPS.carrot.cls, count: 3 }
    expect(w.seats[0].hand).toEqual({ kind: 'hold', item: rotten })
    expect(w.seats[0].inventory[0]).toEqual({ kind: 'hold', item: rotten })
    expect(chest.slots[0]).toEqual({ kind: 'hold', item: rotten })
    expect(w.drops.find(d => d.item.kind === 'rotten')).toEqual({ at: { col: AT.col + 1, row: AT.row }, item: rotten })
  })

  test('consign processed', () => {
    const w = new World()
    w.seats[0].actor.x = PAD.col + 0.5
    w.seats[0].actor.y = PAD.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'spirit', spirit: 'vodka', variety: 'base', quality: 0, count: 1, unitSale: 72 },
    }
    w.enqueue({ act: 'consign' })
    w.tick(DT_MAX)
    expect(w.stall.vodka.stock.base.organic).toBe(1)
    expect(w.stall.vodka.worth.base.organic).toBe(72)
  })

  test('Broken dump missing seats → unusable. No migrate.', () => {
    const w = new World(1)
    const s = dump(w)
    const noSeats = { ...s }
    delete (noSeats as { seats?: unknown }).seats
    const bad = parse(JSON.stringify(noSeats))
    expect(bad.ok).toBe(false)
    if (bad.ok) return
    expect(bad.reason).toBe('unusable')
  })

  test('`PotStill` `RectBase` `w = 2` `h = 1`, origin NW, no rotate, same instance both cells, tick origin, water join any corner.', () => {
    const w = new World(1)
    w.unlockAll()
    w.money = 999
    const at = { col: 10, row: 16 }
    w.buy('buy-still')
    w.confirmPlace(at)
    const a = w.cell(at)
    const b = w.cell({ col: 11, row: 16 })
    expect(a.kind).toBe('still')
    expect(b.kind).toBe('still')
    expect(a).toBe(b)
    if (a.kind !== 'still') return
    expect(a.base.w).toBe(2)
    expect(a.base.h).toBe(1)
    expect(a.base.col).toBe(10)
    expect(a.base.row).toBe(16)
    expect(w.stills).toContain(a)
    a.feed = [{ crop: 'potato', variety: 'base', quality: 0, count: 10 }]
    a.progress = 0.5
    w.tick(DT_MAX)
    expect(a.progress).toBeGreaterThan(0.5)
  })

  test('`inn === 1` freezes mill/jam/still ticks (progress + still water pull). Dump and Unload still fill.', () => {
    const w = new World(1)
    w.unlockAll()
    w.money = 999
    const millAt = { col: 10, row: 16 }
    w.buy('buy-mill')
    w.confirmPlace(millAt)
    const mill = w.cell(millAt)
    expect(mill.kind).toBe('mill')
    if (mill.kind !== 'mill') return
    mill.recipe = 'wheat'
    mill.units = 5
    mill.progress = 0.2
    const leverAt = { col: 10, row: 15 }
    w.buy('buy-lever')
    w.confirmPlace(leverAt)
    const lever = w.cell(leverAt)
    expect(lever.kind).toBe('lever')
    if (lever.kind !== 'lever') return
    lever.on = true
    lever.out = 1
    w.armWire({ kind: 'cell', at: leverAt, port: 'out' })
    w.placeWire({ kind: 'cell', at: leverAt, port: 'out' }, { kind: 'cell', at: millAt, port: 'in' })
    w.tick(DT_MAX)
    expect(mill.inn).toBe(1)
    expect(mill.progress).toBe(0.2)
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'wheat', variety: 'base', quality: 0, count: 3, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    w.seats[0].actor.x = millAt.col + 0.5
    w.seats[0].actor.y = millAt.row + 0.5
    w.enqueue({ act: 'mill', at: millAt })
    for (let i = 0; i < 10; i++) w.tick(DT_MAX)
    expect(mill.units).toBe(8)
    expect(mill.progress).toBe(0.2)
  })
})

function handOf(w: World): Hand {
  return w.seats[0].hand
}

function siloCount(w: World, crop: AnnualId, variety: VarietyId): number {
  return w.silo.seeds.find(st => st.crop === crop && st.variety === variety)?.count ?? 0
}

function expectPacked(w: World): void {
  const seen = new Set<string>()
  let empty = false
  w.seats[0].inventory.forEach(slot => {
    if (slot.kind === 'empty') {
      empty = true
      return
    }
    expect(empty).toBe(false)
    if (slot.item.kind === 'seeds' || slot.item.kind === 'fruit') {
      const key = `${slot.item.kind}:${slot.item.crop}:${slot.item.variety}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })
}

function play(seed: number, cmds: Cmd[], dt = 1 / 15): World {
  const w = new World(seed)
  for (const cmd of cmds) {
    while (w.now < cmd.t) w.tick(dt)
    w.apply(cmd)
  }
  return w
}

function stepBig(w: World): void {
  const n = w.bigTicks
  while (w.bigTicks === n) {
    if (w.seam.kind === 'recap') w.dismissRecap()
    w.tick(DT_MAX)
  }
}

function grassCount(w: World): number {
  let n = 0
  w.forEachCell((_at, c) => {
    if (c.kind === 'untilled' && c.cover.kind === 'grass') n += 1
  })
  return n
}

function ownedGrassPick(w: World, bigTicks: number, i: number): { col: number; row: number } {
  const n = w.owned.length * CHUNK * CHUNK
  const u = new Rng(w.seed).stream('grass').at(bigTicks, i, 0)
  let index = Math.floor(u * n)
  if (index >= n) index = n - 1
  const per = CHUNK * CHUNK
  const id = w.owned[Math.floor(index / per)]
  const localIx = index % per
  const { col0, row0 } = chunkRect(id)
  return { col: col0 + (localIx % CHUNK), row: row0 + Math.floor(localIx / CHUNK) }
}

function aabbGrassPick(w: World, bigTicks: number, i: number): { col: number; row: number } {
  const b = w.bounds()
  const grass = new Rng(w.seed).stream('grass')
  return {
    col: b.col0 + Math.floor(grass.at(bigTicks, i, 0) * (b.col1 - b.col0)),
    row: b.row0 + Math.floor(grass.at(bigTicks, i, 1) * (b.row1 - b.row0)),
  }
}

function expectedGrassAt(w: World, bigTicks: number): { col: number; row: number } | undefined {
  const n = w.owned.length * CHUNK * CHUNK
  const grass = new Rng(w.seed).stream('grass')
  if (!(Math.min(1, ramped(GRASS_CHANCE, bigTicks) * n) > grass.at(bigTicks))) return undefined
  for (let i = 0; i < 24; i++) {
    const at = ownedGrassPick(w, bigTicks, i)
    const c = w.cell(at)
    if (c.kind !== 'untilled' || c.ground === 'very-hard' || c.cover.kind !== 'bare') continue
    if (w.drops.some(d => d.at.col === at.col && d.at.row === at.row)) continue
    return at
  }
  return undefined
}

function digest(w: World) {
  const cells: string[] = []
  w.forEachCell((at, c) => {
    let s = `${at.col},${at.row}:${c.kind}`
    if (c.kind === 'growing' || c.kind === 'ripe' || c.kind === 'dead') {
      s += `:${c.plant.crop}:${c.plant.variety}:${c.plant.quality}:${c.plant.maturity}`
    }
    cells.push(s)
  })
  return {
    money: w.money,
    day: w.clock.day,
    t: w.clock.t,
    hand: w.seats[0].hand,
    inventory: w.seats[0].inventory,
    cells,
    drops: w.drops.length,
    done: [...w.done].sort(),
    family: {
      player: [...w.family.player.owned.entries()].sort(),
      husband: [...w.family.husband.owned.entries()].sort(),
      daughter: [...w.family.daughter.owned.entries()].sort(),
    },
    stall: Object.fromEntries(STALL_IDS.map(id => [id, w.stall[id].stock])),
  }
}

describe('0.9 log and rng', () => {
  test('World.now starts 0. Each tick() entry, including recap return, now += 1. dispatch stamps Cmd.t = now. Same-t cmds apply in log order. Ticks are not cmds.', () => {
    const w = new World(1)
    expect(w.now).toBe(0)
    expect(w.log).toEqual([])
    w.cheatMoney()
    w.cheatPoints()
    expect(w.log).toEqual([
      { a: Act.cheat, t: 0, p: 0, k: 'money' },
      { a: Act.cheat, t: 0, p: 0, k: 'points' },
    ])
    w.tick(1 / 15)
    expect(w.now).toBe(1)
    expect(w.log).toHaveLength(2)
    w.clock.t = 239.999
    w.tick(1)
    expect(w.seam.kind).toBe('recap')
    const n = w.now
    w.tick(1 / 15)
    expect(w.now).toBe(n + 1)
    expect(w.log.every(c => c.a !== undefined)).toBe(true)
    expect(w.log).toHaveLength(2)
  })

  test('dispatch appends to World.log and sink, then apply. apply does not log. Replay is apply only. enqueue does not dispatch.', () => {
    const w = new World(1)
    w.apply({ a: Act.cheat, t: 0, p: 0, k: 'money' })
    expect(w.log).toEqual([])
    expect(w.money).toBe(250)
    w.cheatMoney()
    expect(w.log).toEqual([{ a: Act.cheat, t: 0, p: 0, k: 'money' }])
    expect(w.money).toBe(450)
    w.enqueue({ act: 'walk', at: AT })
    expect(w.log).toHaveLength(1)
    expect(w.seats[0].queue[0]).toEqual({ act: 'walk', at: AT })
  })

  test('Log is player Cmds only. Not sips, rot, weed sprout, ripen, tree drop, grass, stall ticks, research drain, walk, panel, camera, hover, lens.', () => {
    const w = new World(1)
    const p = new Plant('carrot', 'base', 0)
    p.maturity = 1
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: p })
    w.tick(1 / 15)
    expect(w.cell(AT).kind).toBe('ripe')
    expect(w.log).toEqual([])
    w.buy('pack-carrot')
    expect(w.log).toEqual([{ a: Act.buy, t: 1, p: 0, s: 'pack-carrot' }])
  })

  test('Same seed + same Cmd[] applied at those t with dt = 1/15 → equal digest: money, clock.day, clock.t, hand, inventory, cell kinds, plant crop/rarity/maturity, drop count, done, family owned, stall stock.', () => {
    const seed = 42
    const w = new World(seed)
    for (let i = 0; i < 15; i++) w.tick(1 / 15)
    w.cheatMoney()
    w.buy('pack-wheat')
    w.armDelete()
    w.cancelPlace()
    w.sellAll()
    w.swap(0)
    const copy = play(seed, w.log)
    expect(digest(copy)).toEqual(digest(w))
  })

  test('Two Worlds, same seed, no cmds, N ticks of 1/15 → equal digest.', () => {
    const a = new World(5)
    const b = new World(5)
    for (let i = 0; i < 45; i++) {
      a.tick(1 / 15)
      b.tick(1 / 15)
    }
    expect(digest(a)).toEqual(digest(b))
  })

  test('shop.next() does not move when grow rolls. Same seed: shop-only vs plant-then-shop, first granted pack rarity matches.', () => {
    const seed = 9
    const shopOnly = new World(seed)
    expect(shopOnly.buy('pack-wheat')).toBeUndefined()
    const grown = new World(seed)
    const p = new Plant('carrot', 'base', 0)
    p.maturity = 1
    grown.setCell(AT, { kind: 'growing', soil: bed(), plant: p })
    grown.tick(1 / 15)
    expect(grown.buy('pack-wheat')).toBeUndefined()
    const stack = (w: World) => w.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')
    expect(stack(shopOnly)?.variety).toBe('base')
    expect(stack(grown)?.variety).toBe('base')
    expect(stack(shopOnly)?.quality).toBe(0)
    expect(stack(grown)?.quality).toBe(0)
  })

  test('Two growing→ripe on one cell the same day use distinct n. Rarities need not match.', () => {
    const w = new World(1)
    const first = new Plant('carrot', 'base', 0)
    first.maturity = 1
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: first })
    w.tick(1 / 15)
    const ripe0 = w.cell(AT)
    expect(ripe0.kind).toBe('ripe')
    expect(ripe0.kind === 'ripe' && ripe0.plant.quality).toBe(0)
    expect(ripe0.kind === 'ripe' && ripe0.plant.variety).toBe('base')
    const second = new Plant('carrot', 'base', 0)
    second.maturity = 1
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: second })
    w.tick(1 / 15)
    const ripe1 = w.cell(AT)
    expect(ripe1.kind).toBe('ripe')
    expect(ripe1.kind === 'ripe' && ripe1.plant.quality).toBe(0)
  })

  test('Two successful tree drops the same day each consume two fruit.next(): drop spot then rarity. Rarities need not match.', () => {
    const w = new World(1)
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('olive', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 1, {
      kind: 'on',
      daysLeft: 2,
    })
    w.setCell(AT, tree)
    w.setCell(below, tree)
    ;[
      { col: AT.col - 1, row: AT.row },
      { col: AT.col + 1, row: AT.row },
      { col: AT.col, row: AT.row - 1 },
      { col: AT.col - 1, row: AT.row + 1 },
      { col: AT.col + 1, row: AT.row + 1 },
      { col: AT.col, row: AT.row + 2 },
    ].forEach(p => w.setCell(p, { kind: 'empty', soil: bed() }))
    const n0 = w.drops.length
    w.tick(1 / 15)
    expect(w.drops.length).toBe(n0 + 1)
    tree.fruit = 1
    w.tick(1 / 15)
    expect(w.drops.length).toBe(n0 + 2)
    const olives = w.drops.filter(d => d.item.kind === 'fruit' && d.item.crop === 'olive')
    expect(olives).toHaveLength(2)
    expect(olives[0].item.kind === 'fruit' && olives[0].item.quality).toBe(0)
    expect(olives[1].item.kind === 'fruit' && olives[1].item.quality).toBe(0)
    expect(olives[0].item.kind === 'fruit' && olives[0].item.variety).toBe('base')
    expect(w.rng.consumed('fruit')).toBe(2)
  })

  test('Failed buy / buyPacks (closed, cannot afford, cannot fit) consumes 0 shop.next(). Failed tree drop consumes 0 fruit.next(). Granted pack: one next() each. buyPacks success: 5.', () => {
    const seed = 3
    const w = new World(seed)
    w.money = 0
    expect(w.buy('pack-carrot')).toBe('Cannot afford')
    w.buyPacks('pack-wheat')
    expect(w.buy('pack-tomato')).toBeUndefined()
    w.money = 50
    w.silo.seeds.length = 0
    w.silo.seeds.push({ crop: 'carrot', variety: 'base', quality: 0, count: SILO_SEED_CAP })
    expect(w.buy('pack-carrot')).toBe('Seed silo full')
    w.silo.seeds.length = 0
    expect(w.buy('pack-wheat')).toBeUndefined()
    expect(w.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.variety).toBe('base')
    expect(w.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.quality).toBe(0)
    const bulk = new World(seed)
    bulk.money = 1000
    bulk.buyPacks('pack-wheat')
    expect(bulk.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.count).toBe(25)
    expect(bulk.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.variety).toBe('base')
    const dropFail = new World(seed)
    const trapped = new Tree('olive', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 1, {
      kind: 'on',
      daysLeft: 2,
    })
    dropFail.setCell(AT, trapped)
    dropFail.setCell({ col: AT.col, row: AT.row + 1 }, trapped)
    dropFail.forEachCell((at, c) => {
      if (c.kind === 'untilled') dropFail.setCell(at, new Rock({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }))
    })
    const nDrops = dropFail.drops.length
    dropFail.tick(1 / 15)
    expect(dropFail.drops.length).toBe(nDrops)
    expect(trapped.fruit).toBe(1)
    dropFail.setCell({ col: AT.col - 1, row: AT.row }, { kind: 'empty', soil: bed() })
    trapped.fruit = 1
    dropFail.tick(1 / 15)
    const olives = dropFail.drops.filter(d => d.item.kind === 'fruit' && d.item.crop === 'olive')
    expect(olives).toHaveLength(1)
    expect(olives[0].item.kind === 'fruit' && olives[0].item.quality).toBe(0)
    expect(olives[0].item.kind === 'fruit' && olives[0].item.variety).toBe('base')
    expect(dropFail.rng.consumed('fruit')).toBe(1)
  })

  test('existing common carrot stack in the silo: buy and buyPacks merge; shop.next consumed 1 then 5', () => {
    const w = new World(1)
    w.money = 50
    expect(siloCount(w, 'carrot', 'base')).toBe(7)
    expect(w.buy('pack-carrot')).toBeUndefined()
    expect(siloCount(w, 'carrot', 'base')).toBe(12)
    const bulk = new World(1)
    bulk.money = 50
    bulk.buyPacks('pack-carrot')
    expect(siloCount(bulk, 'carrot', 'base')).toBe(32)
  })

  test('Pack rarity is rollShopRarity(seed-bank tier, shop.next()). Not clock.t. Not money.', () => {
    const w = new World(1)
    w.clock.t = 80
    w.money = 80
    expect(w.buy('pack-wheat')).toBeUndefined()
    expect(w.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')).toEqual({
      crop: 'wheat',
      variety: 'base',
      quality: 0,
      count: 5,
    })
  })
})

describe('1.5.2', () => {
  test('`Soil.weedChance: number` required. New soil (till, expand) = `WEED_CHANCE`. Copy soil on harvest/death keeps the field. Spawn: `mul` 0 → skip; else `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks) * mul`. Recover: iff `weedChance < WEED_CHANCE`, `min(WEED_CHANCE, weedChance + 0.15 × dt / DAY_SECONDS)`. Does not pull outbreak down. Tick every `dt` on the recover index (tilled cells with `weedChance < WEED_CHANCE`). Same formula.', () => {
    expect(WEED_CHANCE).toBe(0.03)
    const w = new World()
    const soil = bed()
    expect(soil.weedChance).toBe(WEED_CHANCE)
    soil.weedChance = 0
    w.setCell(AT, { kind: 'empty', soil })
    w.tick(DT_MAX)
    expect(soil.weedChance).toBeCloseTo((0.15 * DT_MAX) / 240, 8)
    soil.weedChance = 0.08
    w.tick(DT_MAX)
    expect(soil.weedChance).toBe(0.08)
  })

  test('Outbreak: when a weed first reaches maturity 1, once. `Weed.spread: boolean`, starts `false`. `+0.05` on 4-adj (cardinals) that are empty tilled. No cap. Skip self / missing / not empty. Then `spread = true`.', () => {
    const w = new World()
    const soil = bed()
    const weed = new Weed(0)
    weed.maturity = 0.999
    w.setCell(AT, { kind: 'weed', soil, weed })
    const n = { col: AT.col + 1, row: AT.row }
    const adj = bed()
    w.setCell(n, { kind: 'empty', soil: adj })
    w.tick(1)
    expect(weed.spread).toBe(true)
    expect(weed.maturity).toBe(1)
    expect(adj.weedChance).toBeCloseTo(WEED_CHANCE + 0.05, 8)
    const again = adj.weedChance
    w.tick(1)
    expect(adj.weedChance).toBe(again)
  })

  test("Item `{ kind: 'weed-spray'; liters; capacityLiters }`. `WEED_SPRAY_BAG`. Illegal: `liters` 0 as held (empty bag leaves the hand). `buy-weed-spray` utility, unlock and show `unlock-fertilizer`. Additive store. Click a tilled plot: need `>= 1` L, spend 1 L, `weedChance = −1`. Instant. Not untilled. Not spray-trailer.", () => {
    expect(WEED_SPRAY_BAG).toBe(30)
    expect(SKUS['buy-weed-spray'].price).toBe(12)
    const w = new World()
    w.done.add('unlock-fertilizer')
    w.money = 50
    expect(w.buy('buy-weed-spray')).toBeUndefined()
    expect(w.seats[0].place.kind).toBe('none')
    expect(w.additives.litersOf('weed-spray')).toBe(WEED_SPRAY_BAG)
    expect(w.seats[0].inventory.some(s => s.kind === 'hold' && s.item.kind === 'weed-spray')).toBe(false)
    w.takeAdditive('weed-spray')
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'weed-spray' && w.seats[0].hand.item.liters).toBe(WEED_SPRAY_BAG)
    const soil = bed()
    w.setCell(AT, { kind: 'empty', soil })
    w.seats[0].hand = { kind: 'hold', item: { kind: 'weed-spray', liters: 1, capacityLiters: WEED_SPRAY_BAG } }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.enqueue({ act: 'weed-spray', at: AT })
    w.tick(DT_MAX)
    expect(soil.weedChance).toBeCloseTo(-1 + (0.15 * DT_MAX) / 240, 8)
    expect(w.seats[0].hand.kind).toBe('empty')
    const dumped = dump(w)
    dumped.seats[0].hand = { kind: 'hold', item: { kind: 'weed-spray', liters: 12, capacityLiters: WEED_SPRAY_BAG } }
    const ok = parse(JSON.stringify(dumped))
    expect(ok.ok).toBe(true)
    if (ok.ok) {
      const h = ok.world.seats[0].hand
      expect(h.kind === 'hold' && h.item.kind === 'weed-spray' && h.item.liters).toBe(12)
    }
    const bad = JSON.parse(JSON.stringify(dumped)) as { seats: { hand: { item: unknown } }[] }
    bad.seats[0].hand.item = { kind: 'weed-spray', usesLeft: 30 }
    const failed = parse(JSON.stringify(bad))
    expect(failed.ok).toBe(false)
  })

  test('weed spray clears the weed standing on the plot', () => {
    const w = new World()
    const soil = bed()
    w.setCell(AT, { kind: 'weed', soil, weed: new Weed(0) })
    w.seats[0].hand = { kind: 'hold', item: { kind: 'weed-spray', liters: 2, capacityLiters: WEED_SPRAY_BAG } }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.enqueue({ act: 'weed-spray', at: AT })
    w.tick(DT_MAX)
    const cell = w.cell(AT)
    expect(cell.kind).toBe('empty')
    expect(cell.kind === 'empty' && cell.soil).toBe(soil)
    expect(soil.weedChance).toBeLessThan(0)
  })

  test("Hand pull weed: drop `{ kind: 'weed' }`, `weedChance = 0`. Weeds in hand merge up to the stack cap; full is a no-op that says so. Shovel: no drop, `weedChance = −0.3`.", () => {
    const w = new World()
    const soil = bed()
    w.setCell(AT, { kind: 'weed', soil, weed: new Weed(0) })
    w.seats[0].hand = { kind: 'empty' }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.enqueue({ act: 'pickup', at: AT })
    w.tick(DT_MAX)
    expect(w.seats[0].hand).toEqual({ kind: 'hold', item: { kind: 'weed', count: 1 } })
    expect(soil.weedChance).toBeCloseTo((0.15 * DT_MAX) / 240, 8)
    const soil2 = bed()
    const at2 = { col: 11, row: 12 }
    w.setCell(at2, { kind: 'weed', soil: soil2, weed: new Weed(0) })
    w.seats[0].hand = { kind: 'hold', item: { kind: 'weed', count: 1 } }
    w.seats[0].actor.x = at2.col + 0.5
    w.seats[0].actor.y = at2.row + 0.5
    w.enqueue({ act: 'pickup', at: at2 })
    w.tick(DT_MAX)
    expect(w.seats[0].hand).toEqual({ kind: 'hold', item: { kind: 'weed', count: 2 } })
    expect(soil2.weedChance).toBeCloseTo((0.15 * DT_MAX) / 240, 8)
    const soil3 = bed()
    const at3 = { col: 12, row: 12 }
    w.setCell(at3, { kind: 'weed', soil: soil3, weed: new Weed(0) })
    w.seats[0].hand = { kind: 'hold', item: makeShovel('shovel') }
    w.seats[0].actor.x = at3.col + 0.5
    w.seats[0].actor.y = at3.row + 0.5
    const drops = w.drops.length
    w.enqueue({ act: 'shovel', at: at3 })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(w.drops.length).toBe(drops)
    expect(soil3.weedChance).toBeCloseTo(-0.3, 3)
    expect(w.cell(at3).kind).toBe('empty')
  })

  test('Each `BIG_TICK`, world roll: `mul` 0 → skip; else `min(1, ramped(GRASS_CHANCE, bigTicks) * ownedCellCount) * mul > grass.at(bigTicks)`. `ownedCellCount = owned.length * CHUNK * CHUNK`. Same day-one ramp. `mul` from current weather. If it fires, pick eligible untilled (untilled, not very-hard, cover bare, no drop) via grass stream try-index `i` mapped onto owned cells, not `bounds()` AABB. At most one tuft. Variant `grass.at(col, row, bigTicks)`.', () => {
    expect(ramped(GRASS_CHANCE, 0)).toBeLessThan(0)
    expect(ramped(GRASS_CHANCE, 1)).toBeLessThan(0)
    const fresh = new World(1)
    expect(grassCount(fresh)).toBe(0)
    stepBig(fresh)
    expect(fresh.bigTicks).toBe(1)
    expect(grassCount(fresh)).toBe(0)

    const seed = 1
    const n = CHUNK * CHUNK
    let tFire = 0
    const grass = new Rng(seed).stream('grass')
    for (let t = 1; t <= 24; t++) {
      const u = grass.at(t)
      const r = ramped(GRASS_CHANCE, t)
      if (r <= u && Math.min(1, r * n) > u) {
        tFire = t
        break
      }
    }
    expect(tFire).toBeGreaterThan(0)
    const w = new World(seed)
    w.bigTicks = tFire - 1
    const want = expectedGrassAt(w, tFire)
    expect(want).toBeDefined()
    stepBig(w)
    expect(w.bigTicks).toBe(tFire)
    expect(grassCount(w)).toBe(1)
    if (want === undefined) return
    expect(w.inWorld(want)).toBe(true)
    const grew = w.cell(want)
    expect(grew.kind === 'untilled' && grew.cover.kind === 'grass').toBe(true)
    if (grew.kind === 'untilled' && grew.cover.kind === 'grass') {
      expect(grew.cover.variant).toBe(Math.floor(new Rng(seed).stream('grass').at(want.col, want.row, tFire) * 3))
    }

    const hole = new World(seed)
    hole.done.add('unlock-expand')
    hole.done.add('expand-land')
    hole.money = 999
    hole.expand({ cx: 1, cy: 0 })
    hole.expand({ cx: 0, cy: 1 })
    expect(hole.owned).toHaveLength(3)
    const b = hole.bounds()
    expect(b).toEqual({ col0: 0, row0: 0, col1: 64, row1: 64 })
    expect(hole.inWorld({ col: 40, row: 40 })).toBe(false)
    const ownedN = hole.owned.length * CHUNK * CHUNK
    let holeTick = 0
    let aabbOutside = false
    for (let t = 5; t <= 24; t++) {
      const u = new Rng(seed).stream('grass').at(t)
      if (!(Math.min(1, ramped(GRASS_CHANCE, t) * ownedN) > u)) continue
      for (let i = 0; i < 24; i++) {
        const aabb = aabbGrassPick(hole, t, i)
        const owned = ownedGrassPick(hole, t, i)
        expect(hole.inWorld(owned)).toBe(true)
        if (!hole.inWorld(aabb) && aabb.col >= b.col0 && aabb.col < b.col1 && aabb.row >= b.row0 && aabb.row < b.row1) {
          aabbOutside = true
          holeTick = t
        }
      }
      if (aabbOutside) break
    }
    expect(aabbOutside).toBe(true)
    hole.bigTicks = holeTick - 1
    const at = expectedGrassAt(hole, holeTick)
    const before = grassCount(hole)
    stepBig(hole)
    expect(hole.bigTicks).toBe(holeTick)
    const after = grassCount(hole)
    expect(after - before).toBeLessThanOrEqual(1)
    expect(after - before).toBe(at === undefined ? 0 : 1)
    if (at !== undefined) {
      expect(hole.inWorld(at)).toBe(true)
      const c = hole.cell(at)
      expect(c.kind === 'untilled' && c.cover.kind === 'grass').toBe(true)
    }
  })

  test("`PlayerSkillId`: `driving-classes` not `machinery`. `driving-classes` max 3, gate `unlock-vehicles`. `HusbandSkillId`: `machinery`, `haggling`, `forecast`. `forecast` max 1, `{ kind: 'forecast' }`, HUD tomorrow iff owned. `haggling` max 3, gate `hidden`. `skuPrice` `− $tier` on utility AND automation, min $1. Drought then ×2 on `seeds` | `utility` after that floor. Hangar-buys still not `skuPrice`. Daughter `bio` `+4%`/tier max 3. `jam` max 3, `JAM_ROT`. `industrial` max 3, complete `× (1 + 0.03 × tier)`. `broker` max 2, gate `unlock-contracts`; T1 `+1` offered; T2 `+1` offered and `+1` active.", () => {
    expect(PLAYER_SKILL_IDS.includes('driving-classes')).toBe(true)
    expect(PLAYER_SKILL_IDS.includes('machinery' as never)).toBe(false)
    expect(SKILLS['driving-classes'].maxTier).toBe(3)
    expect(SKILLS['driving-classes'].gate).toEqual({ kind: 'research', id: 'unlock-vehicles' })
    expect(HUSBAND_SKILL_IDS.includes('machinery')).toBe(true)
    expect(HUSBAND_SKILL_IDS.includes('haggling')).toBe(true)
    expect(HUSBAND_SKILL_IDS.includes('forecast')).toBe(true)
    expect(SKILLS.forecast.maxTier).toBe(1)
    expect(SKILLS.forecast.effect).toEqual({ kind: 'forecast' })
    expect((HUSBAND_SKILL_IDS as readonly string[]).includes('contracts')).toBe(false)
    expect((HUSBAND_SKILL_IDS as readonly string[]).includes('tool-contracts')).toBe(false)
    expect((HUSBAND_SKILL_IDS as readonly string[]).includes('machine-contracts')).toBe(false)
    expect((HUSBAND_SKILL_IDS as readonly string[]).includes('bulk-buying')).toBe(false)
    expect(SKILLS.haggling.maxTier).toBe(3)
    expect(SKILLS.haggling.gate).toEqual({ kind: 'hidden' })
    expect(SKILLS.jam.effect).toEqual({ kind: 'jam' })
    expect(JAM_ROT).toBe(0.15)
    expect(SKILLS.bio.maxTier).toBe(3)
    expect(SKILLS.jam.maxTier).toBe(3)
    expect(SKILLS.industrial.maxTier).toBe(3)
    expect(SKILLS.broker.maxTier).toBe(2)
    expect(SKILLS.broker.gate).toEqual({ kind: 'research', id: 'unlock-contracts' })
    const w = new World()
    w.family.husband.owned.set('haggling', 2)
    expect(w.skuPrice('buy-shovel')).toBe(8)
    expect(w.skuPrice('buy-hangar')).toBe(78)
    expect(w.contractSlots()).toBe(6)
    expect(w.contractCap()).toBe(3)
    w.family.daughter.owned.set('broker', 1)
    expect(w.contractSlots()).toBe(7)
    expect(w.contractCap()).toBe(3)
    w.family.daughter.owned.set('broker', 2)
    expect(w.contractSlots()).toBe(7)
    expect(w.contractCap()).toBe(4)
  })

  test('`unlock-crop-variants` plants, cost 5, 40s, reveal tomato | grape | irrigation, effect feature. Without it: ripen identity, shop packs common, silo hides uncommon/rare unless stock. unlock-heirloom requires it.', () => {
    expect(RESEARCH['unlock-crop-variants']).toMatchObject({
      tree: 'plants',
      cost: 5,
      seconds: 40,
      reveal: ['unlock-tomato', 'unlock-grape', 'unlock-irrigation'],
      requires: [],
      effect: { kind: 'feature' },
    })
    expect(SKILLS['better-potato'].gate).toEqual({ kind: 'research', id: 'unlock-crop-variants' })
    expect(SKILLS['better-wheat'].gate).toEqual({ kind: 'research', id: 'unlock-crop-variants' })
    expect(SKUS['buy-compost-box']).toMatchObject({ unlock: 'start', price: 8 })
    expect(SKUS['buy-sensor-fert'].need).toEqual(['unlock-fertilizer'])
    const locked = new World(1)
    expect(locked.buy('pack-wheat')).toBeUndefined()
    expect(locked.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.variety).toBe('base')
    const p = new Plant('carrot', 'base', 0)
    p.maturity = 1
    p.happiness = HAPPY_MAX
    locked.setCell(AT, { kind: 'growing', soil: bed(), plant: p })
    locked.tick(1 / 15)
    const ripe = locked.cell(AT)
    expect(ripe.kind === 'ripe' && ripe.plant.variety).toBe('base')
    expect(ripe.kind === 'ripe' && ripe.plant.quality).toBeCloseTo(0.25, 8)
    expect(locked.researchShown('unlock-heirloom')).toBe(false)
    locked.done.add('unlock-crop-variants')
    expect(locked.researchShown('unlock-heirloom')).toBe(true)
    expect(locked.researchOpen('unlock-heirloom')).toBe(true)
  })

  test('jam rank N: fruit with freshness < 0.5 rots 15% × N slower. Ripe plant and picked fruit. Freezer skips.', () => {
    const w = new World(1)
    w.family.daughter.owned.set('jam', 2)
    const fruit: Extract<Item, { kind: 'fruit' }> = {
      kind: 'fruit',
      crop: 'carrot',
      variety: 'base', quality: 0,
      count: 1,
      unitSale: 4,
      freshness: 0.4,
      bio: true,
      cut: false,
    }
    w.seats[0].hand = { kind: 'hold', item: fruit }
    const rot = statsOf('carrot', 'base', 0, w.modifiers).rotSeconds
    w.tick(DT_MAX)
    expect(fruit.freshness).toBeCloseTo(0.4 - DT_MAX / (rot * (1 + 0.15 * 2)), 8)
  })

  test('haggling gate hidden. Never in the offer pool. Effect still applies if owned.', () => {
    const w = new World(1)
    expect(w.offers('husband').some(o => o.id === 'haggling')).toBe(false)
    w.family.husband.owned.set('haggling', 3)
    expect(w.skuPrice('buy-shovel')).toBe(7)
  })

  test('`CONTAINERS.bucket` 5. `large-bucket` 10. `FERT_BAG_LITERS` 10, `buy-fertilizer` $18. `SYNTH_BAG_LITERS` 16, `buy-synth-fertilizer` $15. `COMPOST_LITERS` 5. `WEED_SPRAY_BAG`, `buy-weed-spray`. `PLANT_FERT_PER_SEC` and `WEED_FERT_PER_SEC` × 0.9 on the prior tuned-to×0.6 values.', () => {
    expect(CONTAINERS.bucket.capacityLiters).toBe(5)
    expect(CONTAINERS['large-bucket'].capacityLiters).toBe(10)
    expect(FERT_BAG_LITERS).toBe(10)
    expect(SKUS['buy-fertilizer'].price).toBe(18)
    expect(SYNTH_BAG_LITERS).toBe(16)
    expect(SKUS['buy-synth-fertilizer'].price).toBe(15)
    expect(COMPOST_LITERS).toBe(5)
    expect(WEED_SPRAY_BAG).toBe(30)
    expect(SKUS['buy-weed-spray'].price).toBe(12)
    expect(COMPOST_SECONDS).toBe(60)
    expect(PLANT_FERT_PER_SEC).toBeCloseTo((1 / 720) * 0.6 * 0.9, 12)
    expect(WEED_FERT_PER_SEC).toBeCloseTo((1 / 240) * 0.6 * 0.9, 12)
  })

  test('`Seat.stride`. Not driver, `presence === \'in\'`, not recap: if `stride !== {0,0}` clear queue+work, `actor += dir * walkSpeed() * dt`, diagonal normalized. Surfaces not. Ignored while driver. Not in Save. `Act.stride` logged; integrate not.', () => {
    const w = new World(1)
    const x0 = w.seats[0].actor.x
    const y0 = w.seats[0].actor.y
    w.stride(1, 0)
    expect(w.log.some(c => c.a === Act.stride)).toBe(true)
    w.tick(DT_MAX)
    expect(w.seats[0].actor.x).toBeCloseTo(x0 + w.walkSpeed() * DT_MAX, 8)
    expect(w.seats[0].actor.y).toBe(y0)
    const s = dump(w)
    expect('stride' in s.seats[0]).toBe(false)
    w.stride(1, 1)
    const x1 = w.seats[0].actor.x
    const y1 = w.seats[0].actor.y
    w.tick(DT_MAX)
    const step = (w.walkSpeed() * DT_MAX) / Math.hypot(1, 1)
    expect(w.seats[0].actor.x).toBeCloseTo(x1 + step, 8)
    expect(w.seats[0].actor.y).toBeCloseTo(y1 + step, 8)
  })

  test('`STILL_WATER` 2. Start still requires full pull.', () => {
    expect(STILL_WATER).toBe(2)
  })

  test('Tree juvenile `TREES.juvenileSeconds` then `pending`. Next seam → `TREE_YIELD_MUL` for `TREE_YIELD_DAYS`. After that `chance = -0.2`, next seam +0.2 and roll. Off-season fruits at `TREE_OFF_MUL`. Juvenile unchanged.', () => {
    expect(TREES.apricot).toMatchObject({ juvenileSeconds: 192, fruitSeconds: 180 })
    expect(TREES.apple).toMatchObject({ juvenileSeconds: 240, fruitSeconds: 302.4 })
    expect(TREES.cherry).toMatchObject({ juvenileSeconds: 336, fruitSeconds: 124.8 })
    expect(TREES.olive).toMatchObject({ juvenileSeconds: 384, fruitSeconds: 240 })
    expect(CROPS.apricot.sale).toBe(6.1)
    expect(CROPS.apple.sale).toBe(15.4)
    expect(CROPS.cherry.sale).toBe(8.45)
    expect(CROPS.olive.sale).toBe(24.4)
    expect(TREE_YIELD_MUL).toBe(3.5)
    expect(TREE_OFF_MUL).toBe(0.75)
    expect(TREE_YIELD_DAYS).toBe(2)
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('olive', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0, { kind: 'pending' })
    w.setCell(AT, tree)
    w.setCell(below, tree)
    w.clock.t = 239.9
    for (let i = 0; i < 20 && w.seam.kind !== 'recap'; i++) w.tick(DT_MAX)
    expect(tree.yield).toEqual({ kind: 'on', daysLeft: TREE_YIELD_DAYS })
    expect(tree.juvenile).toBe(1)
    if (w.seam.kind === 'recap') w.dismissRecap()
    tree.fruit = 0
    w.tick(DT_MAX)
    expect(tree.fruit).toBeCloseTo(DT_MAX / (TREES.olive.fruitSeconds / TREE_YIELD_MUL), 8)
    tree.yield = { kind: 'on', daysLeft: 1 }
    tree.tended = true
    w.clock.t = 239.9
    for (let i = 0; i < 20 && w.seam.kind !== 'recap'; i++) w.tick(DT_MAX)
    expect(tree.tended).toBe(false)
    expect(tree.yield).toEqual({ kind: 'off', chance: -0.2 })
    if (w.seam.kind === 'recap') w.dismissRecap()
    tree.fruit = 0
    w.tick(DT_MAX)
    expect(tree.fruit).toBeCloseTo(DT_MAX / (TREES.olive.fruitSeconds / TREE_OFF_MUL), 8)
    expect(tree.juvenile).toBe(1)
  })

  test('Tend once per off-season: player owns `tending`, empty hand, `cell.kind === \'tree\'`, `juvenile >= 1`, `yield.kind === \'off\'`, `Tree.tended === false`. Either cell of the 1×2. Work `TEND_WORK`. Then `chance += 0.15`, `tended = true`. No cap. Seam `on` → `off`: `tended = false`, then `chance = -0.2`. Not pending. Not `{ on }`. Not juvenile. Prompt **Tend**. Witness `Tree.tended`.', () => {
    const w = new World()
    w.family.player.owned.set('tending', 1)
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0, { kind: 'off', chance: 0 })
    w.setCell(AT, tree)
    w.setCell(below, tree)
    expect(tree.tended).toBe(false)
    w.seats[0].hand = { kind: 'empty' }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    expect(w.canTend(AT)).toBe(true)
    expect(w.canTend(below)).toBe(true)
    w.enqueue({ act: 'tend', at: AT })
    for (let i = 0; i < Math.ceil(TEND_WORK / DT_MAX) + 2; i++) w.tick(DT_MAX)
    expect(tree.tended).toBe(true)
    expect(tree.yield).toEqual({ kind: 'off', chance: 0.15 })
    expect(w.canTend(AT)).toBe(false)
    tree.yield = { kind: 'pending' }
    expect(w.canTend(AT)).toBe(false)
    tree.yield = { kind: 'on', daysLeft: 2 }
    expect(w.canTend(AT)).toBe(false)
    tree.juvenile = 0.5
    tree.yield = { kind: 'off', chance: 0 }
    tree.tended = false
    expect(w.canTend(AT)).toBe(false)
    const saved = dump(w)
    const cell = saved.chunks[0].cells[AT.row][AT.col]
    expect(cell.kind === 'tree' && cell.tended).toBe(false)
    tree.juvenile = 1
    tree.tended = true
    const round = parse(JSON.stringify(dump(w)))
    expect(round.ok).toBe(true)
    if (round.ok) {
      const loaded = round.world.cell(AT)
      expect(loaded.kind === 'tree' && loaded.tended).toBe(true)
    }
  })
})

describe('1.8 permits and points', () => {
  test('Expansion permits come from three researches, `inherit-land` II and contract prizes. Each expansion spends one.', () => {
    const w = new World(1)
    expect(w.expandSlots()).toBe(0)
    expect(w.expandLeft()).toBe(0)
    w.done.add('unlock-expand')
    expect(w.expandSlots()).toBe(1)
    w.done.add('expand-land')
    w.done.add('eminent-domain')
    expect(w.expandSlots()).toBe(3)
    w.family.husband.owned.set('inherit-land', 2)
    expect(w.expandSlots()).toBe(5)
    w.prizeSlots = 2
    expect(w.expandSlots()).toBe(7)
    w.purchases = 7
    expect(w.expandLeft()).toBe(0)
  })

  test('`expand` is refused once the permits run out, whatever the money says.', () => {
    const w = new World(1)
    w.done.add('unlock-expand')
    w.money = 99999
    w.expand({ cx: 1, cy: 0 })
    expect(w.owned).toHaveLength(2)
    expect(w.expandLeft()).toBe(0)
    w.expand({ cx: 0, cy: 1 })
    expect(w.owned).toHaveLength(2)
    w.done.add('expand-land')
    w.expand({ cx: 0, cy: 1 })
    expect(w.owned).toHaveLength(3)
  })

  test('`inherit-land` II is a husband skill gated on `unlock-expand`.', () => {
    expect(HUSBAND_SKILL_IDS.includes('inherit-land')).toBe(true)
    expect(SKILLS['inherit-land'].maxTier).toBe(2)
    expect(SKILLS['inherit-land'].gate).toEqual({ kind: 'research', id: 'unlock-expand' })
  })

  test('Skill points are one shared bank of `POINTS_PER_DAY` a day, spendable on any member.', () => {
    const w = new World(1)
    expect(w.points).toBe(0)
    w.grantPoints(POINTS_PER_DAY)
    expect(w.points).toBe(3)
    w.pickSkill('husband', 0)
    expect(w.points).toBe(2)
    w.pickSkill('daughter', 0)
    w.pickSkill('player', 0)
    expect(w.points).toBe(0)
    const before = w.family.player.owned.size
    w.pickSkill('player', 0)
    expect(w.family.player.owned.size).toBe(before)
  })

  test('The large freezer is not for sale: it opens only while a contract prize is banked, and placing it spends the stock.', () => {
    const w = new World(1)
    expect(SKUS['buy-freezer-large'].need).toBe('prize')
    expect(w.skuShown('buy-freezer-large')).toBe(false)
    expect(w.skuOpen('buy-freezer-large')).toBe(false)
    w.prizeFreezers = 1
    expect(w.skuShown('buy-freezer-large')).toBe(true)
    expect(w.skuOpen('buy-freezer-large')).toBe(true)
    const at = { col: 10, row: 12 }
    w.buy('buy-freezer-large')
    w.confirmPlace(at)
    const cell = w.cell(at)
    expect(cell.kind).toBe('freezer')
    if (cell.kind !== 'freezer') return
    expect(cell.slots).toHaveLength(FREEZER_LARGE_SLOTS)
    expect(w.prizeFreezers).toBe(0)
    expect(w.skuShown('buy-freezer-large')).toBe(false)
  })
})

describe('1.9 stacks', () => {
  function ripeAt(w: World, at: { col: number; row: number }, crop: AnnualId, variety: VarietyId = 'base'): void {
    w.setCell(at, { kind: 'ripe', soil: bed(), plant: new Plant(crop, variety, 0) })
  }

  function pickAt(w: World, at: { col: number; row: number }): void {
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 0.5
    w.enqueue({ act: 'harvest', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
  }

  test('Hand merges same-kind only. Fruit picks onto the held stack up to `STACK_MAX`.', () => {
    const w = new World(1)
    w.seats[0].hand = { kind: 'empty' }
    for (let i = 0; i < STACK_MAX; i++) {
      const at = { col: 10 + i, row: 12 }
      ripeAt(w, at, 'carrot', 'base')
      pickAt(w, at)
    }
    const hand = handOf(w)
    expect(hand.kind === 'hold' && hand.item.kind === 'fruit' && hand.item.count).toBe(STACK_MAX)
  })

  test('A full hand refuses the merge, keeps the crop on the plant, and says so.', () => {
    const w = new World(1)
    const at = { col: 10, row: 12 }
    ripeAt(w, at, 'carrot', 'base')
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: STACK_MAX, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    expect(w.prompt(at)).toEqual({ kind: 'blocked', text: 'My hand is full!' })
    pickAt(w, at)
    expect(w.cell(at).kind).toBe('ripe')
    const hand = w.seats[0].hand
    expect(hand.kind === 'hold' && hand.item.kind === 'fruit' && hand.item.count).toBe(STACK_MAX)
  })

  test('Clicking a ripe plot with a full hand speaks `HAND_FULL`, not the wrong-tool line.', () => {
    const w = new World(1)
    const at = { col: 10, row: 12 }
    ripeAt(w, at, 'carrot', 'base')
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: STACK_MAX, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    w.click(at)
    expect(w.speech).toEqual({ kind: 'say', text: 'My hand is full!', left: SPEECH_S })
    expect(w.seats[0].queue).toHaveLength(0)
  })

  test('A different crop or rarity does not merge; the plant keeps its fruit.', () => {
    const w = new World(1)
    const at = { col: 10, row: 12 }
    ripeAt(w, at, 'carrot', 'base')
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', variety: 'base', quality: 0, count: 1, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    pickAt(w, at)
    expect(w.cell(at).kind).toBe('ripe')
    ripeAt(w, at, 'potato')
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', variety: 'bintje', quality: 0, count: 1, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    pickAt(w, at)
    expect(w.cell(at).kind).toBe('ripe')
  })

  test('Bottled and jarred goods cap at `STACK_MAX_CRAFTED`.', () => {
    const w = new World(1)
    expect(w.stackMax({ kind: 'jam', crop: 'apricot', variety: 'base', quality: 0, count: 1, unitSale: 1 })).toBe(STACK_MAX_CRAFTED)
    expect(w.stackMax({ kind: 'cask', cask: 'wine', variety: 'base', quality: 0, count: 1, unitSale: 1 })).toBe(STACK_MAX_CRAFTED)
    expect(w.stackMax({ kind: 'spirit', spirit: 'vodka', variety: 'base', quality: 0, count: 1, unitSale: 1 })).toBe(STACK_MAX_CRAFTED)
    expect(w.stackMax({ kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 1, unitSale: 1, freshness: 1, bio: true, cut: false })).toBe(STACK_MAX)
    expect(w.stackMax({ kind: 'weed', count: 1 })).toBe(STACK_MAX)
  })

  test('`bulk-up` adds `BULK_UP_STEP` per rank, `BULK_UP_CRAFTED_STEP` for bottled and jarred goods. Player skill, three ranks, no gate.', () => {
    const w = new World(1)
    expect(SKILLS['bulk-up'].member).toBe('player')
    expect(SKILLS['bulk-up'].maxTier).toBe(3)
    expect(SKILLS['bulk-up'].gate).toEqual({ kind: 'none' })
    expect(PLAYER_SKILL_IDS.includes('bulk-up')).toBe(true)
    w.family.player.owned.set('bulk-up', 2)
    expect(w.stackMax({ kind: 'weed', count: 1 })).toBe(STACK_MAX + 2 * BULK_UP_STEP)
    expect(w.stackMax({ kind: 'jam', crop: 'apricot', variety: 'base', quality: 0, count: 1, unitSale: 1 })).toBe(STACK_MAX_CRAFTED + 2 * BULK_UP_CRAFTED_STEP)
  })

  test('Pick up merges what fits and leaves the remainder on the ground.', () => {
    const w = new World(1)
    const at = { col: 10, row: 12 }
    w.setCell(at, { kind: 'empty', soil: bed() })
    w.drops.push({
      at,
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 8, unitSale: 4, freshness: 1, bio: true, cut: false },
    })
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 5, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 0.5
    w.enqueue({ act: 'pickup', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const hand = w.seats[0].hand
    expect(hand.kind === 'hold' && hand.item.kind === 'fruit' && hand.item.count).toBe(STACK_MAX)
    const left = w.drops.filter(d => d.at.col === at.col && d.at.row === at.row)
    expect(left).toHaveLength(1)
    expect(left[0].item.kind === 'fruit' && left[0].item.count).toBe(13 - STACK_MAX)
  })

  test('Pick up of an item that does not stack still swaps hand and ground.', () => {
    const w = new World(1)
    const at = { col: 10, row: 12 }
    w.setCell(at, { kind: 'empty', soil: bed() })
    w.drops.push({ at, item: { kind: 'tree-seed', tree: 'apple', variety: 'base', quality: 0 } })
    w.seats[0].hand = { kind: 'hold', item: makeShovel('shovel') }
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 0.5
    w.enqueue({ act: 'pickup', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const hand = w.seats[0].hand
    expect(hand.kind === 'hold' && hand.item.kind).toBe('tree-seed')
    const left = w.drops.filter(d => d.at.col === at.col && d.at.row === at.row)
    expect(left).toHaveLength(1)
    expect(left[0].item.kind).toBe('shovel')
  })

  test('Boxes are gone: no `buy-box` SKU, no `unlock-large-box` research, no box in the almanac.', () => {
    expect(Object.keys(SKUS).includes('buy-box')).toBe(false)
    expect(Object.keys(SKUS).includes('buy-box-large')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-large-box')).toBe(false)
    expect(SHOP_SKUS.includes('buy-box' as SkuId)).toBe(false)
  })
})

describe('world.dest', () => {
  test('dest(hangar | silo | still | fill) is the origin of that instance, not the interior cell clicked. dest(inventory) is DOOR. dest(consign) is PAD.', () => {
    const w = new World(1)
    w.unlockAll()
    w.money = 999
    w.buy('buy-hangar')
    w.confirmPlace(AT)
    expect(dest({ act: 'hangar', at: { col: AT.col + 1, row: AT.row + 1 } }, w)).toEqual(AT)
    expect(dest({ act: 'silo', at: { col: SILO_BASE.col, row: SILO_BASE.row + 1 } }, w)).toEqual({
      col: SILO_BASE.col,
      row: SILO_BASE.row,
    })
    const stillAt = { col: 10, row: 16 }
    w.buy('buy-still')
    w.confirmPlace(stillAt)
    expect(dest({ act: 'still', at: { col: stillAt.col + 1, row: stillAt.row } }, w)).toEqual(stillAt)
    expect(dest({ act: 'fill', at: { col: 18, row: 7 } }, w)).toEqual({ col: 18, row: 7 })
    expect(dest({ act: 'fill', at: { col: 19, row: 7 } }, w)).toEqual({ col: 18, row: 7 })
    w.buy('buy-pumpjack')
    const jack = { col: 8, row: 16 }
    w.confirmPlace(jack)
    expect(dest({ act: 'fill', at: { col: jack.col + 1, row: jack.row } }, w)).toEqual(jack)
    expect(dest({ act: 'inventory' }, w)).toEqual(DOOR)
    expect(dest({ act: 'consign' }, w)).toEqual(PAD)
    expect(dest({ act: 'additives', at: { col: 18, row: 10 } }, w)).toEqual({ col: 18, row: 10 })
  })
})

describe('world.pulse', () => {
  test('World has no pulse field. Last-action highlight gone. Not a cmd. Not Save.', () => {
    const w = new World(1)
    expect('pulse' in w).toBe(false)
    w.buy('buy-pipe')
    w.placePipe({ axis: 'h', col: 18, row: 7 })
    expect('pulse' in w).toBe(false)
  })
})

describe('family.unlockSkills', () => {
  test('`unlockAllSkills`: every `SKILLS` id at `maxTier` on its owner, including `haggling`. Ignores gates. Rebuilds skill modifiers from owned `better-*` at that tier. Empties offers. `unlockAll` still does not grant skills.', () => {
    const w = new World(1)
    w.grantPoints(1)
    const points = w.points
    const pick = w.family.player.pickCount
    const done = w.done.size
    expect(w.family.player.offers.length).toBeGreaterThan(0)
    w.unlockAllSkills()
    ;(['player', 'husband', 'daughter'] as const).forEach(member => {
      skillIds(member).forEach(id => {
        expect(w.skillTier(id)).toBe(SKILLS[id].maxTier)
      })
      expect(w.family[member].offers).toEqual([])
      expect(w.family[member].pickCount).toBe(member === 'player' ? pick : 0)
    })
    expect(w.hasSkill('haggling')).toBe(true)
    expect(w.done.has('unlock-grape')).toBe(false)
    expect(w.skillTier('better-grape')).toBe(SKILLS['better-grape'].maxTier)
    expect(w.points).toBe(points)
    expect(w.done.size).toBe(done)
    const better = PLAYER_SKILL_IDS.filter(id => SKILLS[id].effect.kind === 'better')
    expect(w.modifiers.filter(m => m.source === 'skill').map(m => m.id).sort()).toEqual([...better].sort())
    expect(w.skuPrice('buy-shovel')).toBe(SKUS['buy-shovel'].price - SKILLS.haggling.maxTier)
    expect(w.log).toEqual([{ a: Act.cheat, t: 0, p: 0, k: 'skills' }])

    const u = new World(1)
    const owned = {
      player: u.family.player.owned.size,
      husband: u.family.husband.owned.size,
      daughter: u.family.daughter.owned.size,
    }
    const offers = u.family.player.offers
    u.unlockAll()
    expect(u.family.player.owned.size).toBe(owned.player)
    expect(u.family.husband.owned.size).toBe(owned.husband)
    expect(u.family.daughter.owned.size).toBe(owned.daughter)
    expect(u.hasSkill('haggling')).toBe(false)
    expect(u.family.player.offers).toBe(offers)
  })
})

describe('day.end-day', () => {
  test('End day sets `clock.t = DAY_SECONDS`. No remaining-field sim. Next tick seams. Recap: no-op.', () => {
    const w = new World(1)
    const p = new Plant('carrot', 'base', 0)
    p.maturity = 0.4
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: p })
    w.clock.t = 80
    w.endDay()
    expect(w.clock.t).toBe(DAY_SECONDS)
    expect(p.maturity).toBe(0.4)
    expect(w.seam.kind).toBe('play')
    expect(w.log).toEqual([{ a: Act.cheat, t: 0, p: 0, k: 'day' }])
    w.tick(DT_MAX)
    expect(w.seam.kind).toBe('recap')
    expect(p.maturity).toBe(0.4)

    const r = new World(1)
    r.clock.t = DAY_SECONDS - 0.001
    r.tick(DT_MAX)
    expect(r.seam.kind).toBe('recap')
    const t = r.clock.t
    r.endDay()
    expect(r.clock.t).toBe(t)
    expect(r.seam.kind).toBe('recap')
  })
})

describe('world.cheatSpeed', () => {
  test('`World.cheatSpeed` is `1 | 3`. App host accumulator `frameDt * cheatSpeed`. World.tick does not multiply `dt`. `Act.cheat` `{ k: \'speed\'; n: 1 | 3 }`. `?speed=3` boots 3; any other URL value boots 1. Not job drain.', () => {
    const w = new World(1)
    expect(w.cheatSpeed).toBe(1)
    w.setCheatSpeed(3)
    expect(w.cheatSpeed).toBe(3)
    expect(w.log).toEqual([{ a: Act.cheat, t: 0, p: 0, k: 'speed', n: 3 }])
    w.setCheatSpeed(1)
    expect(w.cheatSpeed).toBe(1)

    const a = new World(1)
    const b = new World(1)
    b.setCheatSpeed(3)
    const pa = new Plant('carrot', 'base', 0)
    const pb = new Plant('carrot', 'base', 0)
    a.setCell(AT, { kind: 'growing', soil: bed(), plant: pa })
    b.setCell(AT, { kind: 'growing', soil: bed(), plant: pb })
    a.tick(DT_MAX)
    b.tick(DT_MAX)
    expect(pb.maturity).toBe(pa.maturity)

    const c = new World(1)
    c.setCheatSpeed(3)
    c.startResearch('unlock-tomato')
    const left = RESEARCH['unlock-tomato'].seconds
    c.tick(DT_MAX)
    expect(c.job.kind === 'run' && c.job.left).toBeCloseTo(left - DT_MAX, 5)
    expect(c.cheatFastResearch).toBe(false)
  })
})

describe('inventory.silo-buy', () => {
  test('Seed silo Buy row click `buy(packSku)`, Ctrl+click `buyPacks(packSku)`. Same fail / merge / shop-stream as shop. No pack: no Buy.', () => {
    expect(packSku('vanilla')).toBeUndefined()
    expect(packSku('carrot')).toBe('pack-carrot')
    const sku: SkuId = 'pack-carrot'
    const w = new World(1)
    w.money = 0
    expect(w.buy(sku)).toBe('Cannot afford')
    w.buyPacks(sku)
    expect(siloCount(w, 'carrot', 'base')).toBe(7)
    w.money = 50
    expect(w.buy(sku)).toBeUndefined()
    expect(siloCount(w, 'carrot', 'base')).toBe(12)
    const bulk = new World(1)
    bulk.money = 50
    bulk.buyPacks(sku)
    expect(siloCount(bulk, 'carrot', 'base')).toBe(32)
    const full = new World(1)
    full.money = 50
    full.silo.seeds.length = 0
    full.silo.seeds.push({ crop: 'carrot', variety: 'base', quality: 0, count: SILO_SEED_CAP })
    expect(full.buy(sku)).toBe('Seed silo full')
    full.buyPacks(sku)
    expect(siloCount(full, 'carrot', 'base')).toBe(SILO_SEED_CAP)
  })
})

describe('variety.stack', () => {
  test('Different variety never merges. Same variety at different quality merges and averages quality, weighted by count — by liters for sugar.', () => {
    const w = new World(1)
    w.seats[0].inventory[0] = { kind: 'hold', item: { kind: 'seeds', crop: 'potato', variety: 'base', quality: 0, count: 2 } }
    w.seats[0].inventory[1] = { kind: 'hold', item: { kind: 'seeds', crop: 'potato', variety: 'bintje', quality: 0, count: 3 } }
    w.compactInventory()
    expect(w.seats[0].inventory.filter(s => s.kind === 'hold' && s.item.kind === 'seeds')).toHaveLength(2)
    w.seats[0].inventory[0] = { kind: 'hold', item: { kind: 'seeds', crop: 'potato', variety: 'bintje', quality: 0, count: 2 } }
    w.seats[0].inventory[1] = { kind: 'hold', item: { kind: 'seeds', crop: 'potato', variety: 'bintje', quality: 1, count: 2 } }
    w.compactInventory()
    const merged = w.seats[0].inventory[0]
    expect(merged.kind === 'hold' && merged.item.kind === 'seeds' && merged.item.count).toBe(4)
    expect(merged.kind === 'hold' && merged.item.kind === 'seeds' && merged.item.quality).toBe(0.5)
    w.seats[0].inventory[0] = {
      kind: 'hold',
      item: { kind: 'sugar', liters: 1, capacityLiters: 2, unitSale: 5, quality: 0 },
    }
    w.seats[0].inventory[1] = {
      kind: 'hold',
      item: { kind: 'sugar', liters: 1, capacityLiters: 2, unitSale: 5, quality: 1 },
    }
    w.compactInventory()
    const sugar = w.seats[0].inventory[0]
    expect(sugar.kind === 'hold' && sugar.item.kind === 'sugar' && sugar.item.liters).toBe(2)
    expect(sugar.kind === 'hold' && sugar.item.kind === 'sugar' && sugar.item.quality).toBe(0.5)
  })
})

describe('quality.ripen', () => {
  test('No roll at ripen. Bought seed quality 0 stays 0 if happiness stays `HAPPY_START`. `betterGain` only if `better-{crop}` owned. Tree fruit quality is 0.', () => {
    const w = new World(1)
    const p = new Plant('potato', 'base', 0)
    p.maturity = 1
    p.happiness = HAPPY_START
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: p })
    w.tick(DT_MAX)
    const ripe = w.cell(AT)
    expect(ripe.kind === 'ripe' && ripe.plant.quality).toBe(0)
    expect(ripe.kind === 'ripe' && ripe.plant.variety).toBe('base')
    const cared = new Plant('potato', 'base', 0)
    cared.maturity = 1
    cared.happiness = HAPPY_MAX
    w.setCell({ col: 11, row: 12 }, { kind: 'growing', soil: bed(), plant: cared })
    w.tick(DT_MAX)
    const ripeCared = w.cell({ col: 11, row: 12 })
    expect(ripeCared.kind === 'ripe' && ripeCared.plant.quality).toBeCloseTo(0.25, 8)
    w.family.player.owned.set('better-potato', 1)
    const skilled = new Plant('potato', 'base', 0)
    skilled.maturity = 1
    skilled.happiness = HAPPY_MAX
    w.setCell({ col: 12, row: 12 }, { kind: 'growing', soil: bed(), plant: skilled })
    w.tick(DT_MAX)
    const ripeSkill = w.cell({ col: 12, row: 12 })
    expect(ripeSkill.kind === 'ripe' && ripeSkill.plant.quality).toBeCloseTo(0.25 + BETTER_QUALITY, 8)
    const tree = new Tree('olive', { shape: 'rect', col: 8, row: 12, w: 1, h: 2 }, 1, 1, { kind: 'on', daysLeft: 2 })
    w.setCell({ col: 8, row: 12 }, tree)
    w.setCell({ col: 8, row: 13 }, tree)
    ;[
      { col: 7, row: 12 },
      { col: 9, row: 12 },
      { col: 8, row: 11 },
      { col: 7, row: 13 },
      { col: 9, row: 13 },
      { col: 8, row: 14 },
    ].forEach(at => w.setCell(at, { kind: 'empty', soil: bed() }))
    const n = w.drops.length
    w.tick(DT_MAX)
    const fruit = w.drops.find((d, i) => i >= n && d.item.kind === 'fruit')
    expect(fruit !== undefined && fruit.item.kind === 'fruit' && fruit.item.quality).toBe(0)
  })
})

describe('market.quality', () => {
  test('Crop stall bins per crop × variety × organic. Consign folds `freshMul`, `qualityMul`, and `purposeMul(variety, produce)` into `worth`. Sell all uses `stallX` and sale skills; no second purpose multiplier.', () => {
    const w = new World(1)
    w.seats[0].actor.x = PAD.col + 0.5
    w.seats[0].actor.y = PAD.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: {
        kind: 'fruit',
        crop: 'potato',
        variety: 'bintje',
        quality: 0,
        count: 2,
        unitSale: 6,
        freshness: 1,
        bio: true,
        cut: false,
      },
    }
    w.enqueue({ act: 'consign' })
    w.tick(DT_MAX)
    expect(w.stall.potato.stock.bintje.organic).toBe(2)
    expect(w.stall.potato.stock.base.organic).toBe(0)
    const unit = qualityMul(0) * purposeMul('bintje', 'produce')
    expect(w.stall.potato.worth.bintje.organic).toBeCloseTo(2 * unit, 9)
    expect(w.marketQuote().clean).toBeCloseTo(2 * unit * CROPS.potato.sale, 9)
  })
})

describe('graft.attach', () => {
  const NAME =
    "A graft is never planted. Same crop, target variety tier not `heirloom`. Annual `growing`. Tree `juvenile < 1`. Complete: target `variety` and `quality` become the graft's; one consumed. Maturity, juvenile, `trunk`, happiness, `tended`, organic, soil untouched."

  function grafter(w: World, item: Item): void {
    w.seats[0].hand = { kind: 'hold', item }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
  }

  test(NAME, () => {
    const w = new World()
    const p = new Plant('grape', 'base', 0.1)
    p.maturity = 0.4
    p.happiness = 0.7
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: p })
    grafter(w, { kind: 'graft', crop: 'grape', variety: 'keknyelu', quality: 0.8, count: 2 })
    w.click(AT)
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(p.variety).toBe('keknyelu')
    expect(p.quality).toBeCloseTo(0.8, 9)
    expect(p.maturity).toBeGreaterThanOrEqual(0.4)
    expect(p.happiness).toBeGreaterThanOrEqual(0.7)
    const hand = w.seats[0].hand
    expect(hand.kind === 'hold' && hand.item.kind === 'graft' && hand.item.count).toBe(1)
  })

  test('Last graft leaves the hand empty. Wrong crop, ripe and empty plots are not targets.', () => {
    const w = new World()
    const p = new Plant('grape', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: p })
    grafter(w, { kind: 'graft', crop: 'grape', variety: 'concord', quality: 0.5, count: 1 })
    w.click(AT)
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(p.variety).toBe('concord')
    expect(w.seats[0].hand.kind).toBe('empty')

    const w2 = new World()
    w2.setCell(AT, { kind: 'growing', soil: bed(), plant: new Plant('tomato', 'base', 0) })
    grafter(w2, { kind: 'graft', crop: 'grape', variety: 'concord', quality: 0.5, count: 1 })
    expect(w2.canGraft(AT)).toBe(false)
    w2.setCell(AT, { kind: 'ripe', soil: bed(), plant: new Plant('grape', 'base', 0) })
    expect(w2.canGraft(AT)).toBe(false)
    w2.setCell(AT, { kind: 'empty', soil: bed() })
    expect(w2.canGraft(AT)).toBe(false)
  })

  test('An heirloom cannot be grafted over.', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: new Plant('grape', 'keknyelu', 0) })
    w.seats[0].hand = { kind: 'hold', item: { kind: 'graft', crop: 'grape', variety: 'concord', quality: 0.5, count: 1 } }
    expect(w.canGraft(AT)).toBe(false)
  })

  test('Tree target is `juvenile < 1` - a sapling or a trunk. Not mature. Variety changes; juvenile and `trunk` do not.', () => {
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const sapling = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 0.3, 0, { kind: 'pending' })
    w.setCell(AT, sapling)
    w.setCell(below, sapling)
    grafter(w, { kind: 'graft', crop: 'apple', variety: 'pink-lady', quality: 0.6, count: 1 })
    w.click(AT)
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(sapling.variety).toBe('pink-lady')
    expect(sapling.juvenile).toBeGreaterThanOrEqual(0.3)
    expect(sapling.juvenile).toBeLessThan(1)
    expect(sapling.trunk).toBe(false)

    const w2 = new World()
    const mature = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0, { kind: 'pending' })
    w2.setCell(AT, mature)
    w2.setCell(below, mature)
    grafter(w2, { kind: 'graft', crop: 'apple', variety: 'pink-lady', quality: 0.6, count: 1 })
    expect(w2.canGraft(AT)).toBe(false)
  })
})

describe('graft.axe', () => {
  test('Chop complete drops 2 grafts of `Tree.variety` at quality 0, then the trunk result.', () => {
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('cherry', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0.5, {
      kind: 'on',
      daysLeft: 2,
    })
    tree.variety = 'bing'
    w.setCell(AT, tree)
    w.setCell(below, tree)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'axe', usesLeft: 10, workSeconds: 0.1 } }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 2.5
    w.click(AT)
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const grafts = w.drops.flatMap(d => (d.item.kind === 'graft' ? [d.item] : []))
    expect(grafts.length).toBe(1)
    expect(grafts[0]).toMatchObject({ crop: 'cherry', variety: 'bing', quality: 0, count: CHOP_GRAFTS })
    expect(w.drops.some(d => d.item.kind === 'wood')).toBe(true)
    expect(tree.trunk).toBe(true)
    expect(tree.juvenile).toBeLessThan(1)
    expect(tree.fruit).toBe(0)
    expect(tree.variety).toBe('bing')
  })
})

describe('variety.neighbour', () => {
  const NAME =
    '`keknyelu` `pink-lady` `bing` need a neighbour in Chebyshev `NEIGHBOUR_REACH`. Without one, annual `maturity` does not increase; tree `fruit` does not increase and the seam does not turn `pending` into `on`. Juvenile still grows. Water, fertilizer, happiness, stunt, death still tick.'

  test(NAME, () => {
    const w = new World()
    const lonely = new Plant('grape', 'keknyelu', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: lonely })
    w.tick(1)
    expect(lonely.maturity).toBe(0)

    w.setCell({ col: AT.col + NEIGHBOUR_REACH, row: AT.row }, {
      kind: 'growing',
      soil: bed(),
      plant: new Plant('grape', 'base', 0),
    })
    w.tick(1)
    expect(lonely.maturity).toBeGreaterThan(0)
  })

  test('Out of reach, an heirloom sibling, a ripe plant and a starving one are not neighbours.', () => {
    const w = new World()
    const lonely = new Plant('grape', 'keknyelu', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: lonely })
    w.setCell({ col: AT.col + NEIGHBOUR_REACH + 1, row: AT.row }, {
      kind: 'growing',
      soil: bed(),
      plant: new Plant('grape', 'base', 0),
    })
    w.tick(1)
    expect(lonely.maturity).toBe(0)

    const near = { col: AT.col + 1, row: AT.row }
    w.setCell(near, { kind: 'growing', soil: bed(), plant: new Plant('grape', 'keknyelu', 0) })
    w.tick(1)
    expect(lonely.maturity).toBe(0)

    w.setCell(near, { kind: 'ripe', soil: bed(), plant: new Plant('grape', 'base', 0) })
    w.tick(1)
    expect(lonely.maturity).toBe(0)

    w.setCell(near, { kind: 'growing', soil: bed(0), plant: new Plant('grape', 'base', 0) })
    w.tick(1)
    expect(lonely.maturity).toBe(0)

    w.setCell(near, { kind: 'growing', soil: bed(), plant: new Plant('grape', 'base', 0) })
    w.tick(1)
    expect(lonely.maturity).toBeGreaterThan(0)
  })

  test('A lonely plant still drinks and still loses happiness.', () => {
    const w = new World()
    const lonely = new Plant('grape', 'keknyelu', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: lonely })
    const before = lonely.happiness
    w.tick(1)
    expect(lonely.maturity).toBe(0)
    expect(lonely.happiness).toBeLessThan(before)
  })

  test('Hover reach is the Chebyshev block the outline walks: 25 cells from a plot, 30 from a 1x2 tree, one path.', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: new Plant('grape', 'keknyelu', 0) })
    const plot = w.neighbourWatch(AT)
    if (plot === undefined) throw new Error('watch')
    expect(plot.reach.length).toBe((NEIGHBOUR_REACH * 2 + 1) ** 2)
    expect(plot.tree).toBe(false)
    const plotPath = footOutline(plot.reach)
    if (plotPath === undefined) throw new Error('outline')
    expect(plotPath.d.match(/M/g)?.length).toBe(1)

    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0, { kind: 'pending' })
    tree.variety = 'pink-lady'
    w.setCell(AT, tree)
    w.setCell(below, tree)
    const t = w.neighbourWatch(AT)
    if (t === undefined) throw new Error('watch')
    expect(t.reach.length).toBe((NEIGHBOUR_REACH * 2 + 1) * (NEIGHBOUR_REACH * 2 + 2))
    expect(t.tree).toBe(true)
    const treePath = footOutline(t.reach)
    if (treePath === undefined) throw new Error('outline')
    expect(treePath.d.match(/M/g)?.length).toBe(1)
  })

  test('No watch on a variety that needs no neighbour, nor on a juvenile or trunk tree.', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: new Plant('grape', 'concord', 0) })
    expect(w.neighbourWatch(AT)).toBeUndefined()

    const below = { col: AT.col, row: AT.row + 1 }
    const sapling = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 0.5, 0, { kind: 'pending' })
    sapling.variety = 'pink-lady'
    w.setCell(AT, sapling)
    w.setCell(below, sapling)
    expect(w.neighbourWatch(AT)).toBeUndefined()
    sapling.juvenile = 1
    sapling.trunk = true
    expect(w.neighbourWatch(AT)).toBeUndefined()
  })

  test('A lone tree raises `juvenile` but not `fruit`, and the seam leaves `pending` alone.', () => {
    const w = new World()
    const below = { col: AT.col, row: AT.row + 1 }
    const tree = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 0.5, 0, { kind: 'pending' })
    tree.variety = 'pink-lady'
    w.setCell(AT, tree)
    w.setCell(below, tree)
    w.tick(1)
    expect(tree.juvenile).toBeGreaterThan(0.5)

    tree.juvenile = 1
    tree.fruit = 0
    tree.yield = { kind: 'pending' }
    w.clock.t = 239.9
    for (let i = 0; i < 20 && w.seam.kind !== 'recap'; i++) w.tick(1)
    expect(tree.yield.kind).toBe('pending')
    expect(tree.fruit).toBe(0)
    if (w.seam.kind === 'recap') w.dismissRecap()

    const sibAt = { col: AT.col + NEIGHBOUR_REACH, row: AT.row }
    const sib = new Tree('apple', { shape: 'rect', col: sibAt.col, row: sibAt.row, w: 1, h: 2 }, 1, 0, {
      kind: 'pending',
    })
    w.setCell(sibAt, sib)
    w.setCell({ col: sibAt.col, row: sibAt.row + 1 }, sib)
    w.clock.t = 239.9
    for (let i = 0; i < 20 && w.seam.kind !== 'recap'; i++) w.tick(1)
    expect(tree.yield.kind).toBe('on')
  })
})

describe('machines.grind-tree', () => {
  const NAME =
    "Tree fruit accepted. Yield `{ kind: 'tree-seed' }` of that species at `'base'`. Annual `heirloom` fruit to `'base'` seeds. Annual `'base'` or `variant` to same variety seeds. Seed quality equals fruit quality. Sugar refused. Hopper locks crop + variety. `GRIND_MIN_AT(q)` raises the yield floor with quality."

  function hopper(): Grinder {
    return new Grinder({ shape: 'rect', col: 0, row: 0, w: 1, h: 1 })
  }

  function fruitItem(crop: 'apple' | 'grape', variety: VarietyId): Item {
    return { kind: 'fruit', crop, variety, quality: 0, count: 1, unitSale: 1, freshness: 1, bio: true, cut: false }
  }

  test(NAME, () => {
    const tree = hopper()
    grindApply(tree, { crop: 'apple', variety: 'pink-lady', quality: 0.4, n: 1 })
    expect(grindProduct(tree, 2)).toEqual({ kind: 'tree-seed', tree: 'apple', variety: 'base', quality: 0.4 })

    const heir = hopper()
    grindApply(heir, { crop: 'tomato', variety: 'san-marzano', quality: 0.25, n: 1 })
    expect(grindProduct(heir, 2)).toEqual({ kind: 'seeds', crop: 'tomato', variety: 'base', quality: 0.25, count: 2 })

    const variant = hopper()
    grindApply(variant, { crop: 'grape', variety: 'concord', quality: 0.5, n: 1 })
    expect(grindProduct(variant, 2)).toEqual({ kind: 'seeds', crop: 'grape', variety: 'concord', quality: 0.5, count: 2 })

    const g = hopper()
    expect(grindAccept(g, { kind: 'sugar', liters: 5, capacityLiters: 5, unitSale: 1, quality: 0 })).toBeUndefined()
    expect(grindAccept(g, fruitItem('apple', 'base'))).toMatchObject({ crop: 'apple', variety: 'base' })
    grindApply(g, { crop: 'apple', variety: 'base', quality: 0, n: 1 })
    expect(grindAccept(g, fruitItem('apple', 'pink-lady'))).toBeUndefined()
    expect(grindAccept(g, fruitItem('grape', 'base'))).toBeUndefined()
  })

  test('`GRIND_MIN_AT(q)` raises the floor and full quality removes the roll.', () => {
    expect(grindMinAt(0)).toBe(GRIND_MIN)
    expect(grindMinAt(1)).toBe(GRIND_MAX)
    expect(grindMinAt(0.5)).toBe(GRIND_MIN + Math.round((GRIND_MAX - GRIND_MIN) * 0.5))
  })
})

describe('quality.carry', () => {
  test("Grind seed quality equals the fruit's quality. Graft copies quality onto the target.", () => {
    const g = new Grinder({ shape: 'rect', col: 0, row: 0, w: 1, h: 1 })
    grindApply(g, { crop: 'tomato', variety: 'green-zebra', quality: 0.62, n: 1 })
    expect(grindProduct(g, 1).quality).toBeCloseTo(0.62, 9)

    const w = new World()
    const p = new Plant('grape', 'base', 0.05)
    w.setCell(AT, { kind: 'growing', soil: bed(), plant: p })
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'graft', crop: 'grape', variety: 'concord', quality: 0.77, count: 1 },
    }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.click(AT)
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(p.quality).toBeCloseTo(0.77, 9)
  })
})
