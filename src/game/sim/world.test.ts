// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import {describe, expect, test} from 'vitest'
import {m} from '../../paraglide/messages.js'
import {CROPS, freshMul, HAPPY_START} from '../defs/crops.ts'
import {
    ADDITIVE_CAP_LITERS,
    CONTAINERS,
    FERT_BAG_LITERS,
    GRIND_MAX,
    GRIND_MIN,
    SILO_SEED_CAP,
    SPRINKLER_TILE_RATE,
    GRIND_WORK,
} from '../defs/items.ts'
import {
    qualityMul,
    STARTER_FRUIT,
    STARTER_FRUIT_N,
    STARTER_TREE_GRAFTS,
    VARIETY,
    type VarietyId
} from '../defs/varieties.ts'
import {RESEARCH, SKUS} from '../defs/research.ts'
import {PLAYER_SKILL_IDS, SKILLS, skillIds} from '../defs/skills.ts'
import {TREE_IDS, type AnnualId, type ResearchId, type SkuId} from './ids.ts'
import {
    Chest,
    DOOR,
    Grinder,
    HOUSE_BASE,
    PAD,
    PUMP_BASE,
    SILO_BASE,
    occupiedCells,
} from './building.ts'
import {SUGAR_BAG, SUGAR_SHOP} from '../defs/items.ts'
import {dump, parse} from './feature-save/save.ts'
import {fruitMoney, itemLine, makePickaxe, makeShovel, skuLabel, type Hand} from './item.ts'
import {Plant} from './plant.ts'
import {aoe, junction, vertexKey, type Edge} from './pipe.ts'
import {Rock, Tree} from './building.ts'
import {Act} from './log.ts'
import {Rng} from './rng.ts'
import {Clock, DAY_SECONDS, days} from './clock.ts'
import {
    BIG_TICK,
    Soil,
    SOIL_TILL_WATER,
    SOIL_WATER_MID,
    STUNT,
    WEED_CHANCE,
    GRASS_CHANCE,
    ramped
} from './soil.ts'
import {bare} from './plot.ts'
import {SOURCE} from './water.ts'
import {goodness} from './noise.ts'
import {dest} from './queue.ts'
import {fillable} from './nets.ts'
import {DT_MAX, World} from './world.ts'
import {BUILD_SKUS, SHELVES, SHOP_SKUS} from '../defs/shelf.ts'

const HOME = [{cx: 0, cy: 0}]
const AT = {col: 10, row: 12}

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
    return new Soil(water, fertilizer, WEED_CHANCE)
}

function readHand(w: World): Hand {
    return w.seats[0].hand
}

function grindWorld(seed: number): World {
    const w = new World(seed)
    w.setCell(AT, new Grinder({shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1}))
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

function handOf(w: World): Hand {
    return w.seats[0].hand
}

function siloCount(w: World, crop: AnnualId, variety: VarietyId): number {
    const hit = w.silo.seeds.find(st => st.crop === crop && st.variety === variety)
    if (hit === undefined) return 0
    return hit.count
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
        w.setCell(AT, {kind: 'growing', soil: bed(), plant: new Plant('carrot', 'base', 0)})
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
        w.setCell(AT, {kind: 'growing', soil: bed(0.5), plant: p})
        const dry = new Plant('carrot', 'base', 0)
        w.setCell({col: 10, row: 13}, {kind: 'growing', soil: bed(0), plant: dry})
        const dt = 1 / 15
        w.tick(dt)
        expect(p.maturity).toBeCloseTo(dt / CROPS.carrot.growSeconds, 9)
        expect(dry.maturity).toBeCloseTo((dt * STUNT) / CROPS.carrot.growSeconds, 9)
    })

    test('dry starving soil kills growing not ripe', () => {
        const w = new World()
        const g = new Plant('carrot', 'base', 0)
        w.setCell(AT, {kind: 'growing', soil: bed(0, 0), plant: g})
        for (let n = 0; n < 2000 && w.cell(AT).kind === 'growing'; n++) {
            if (w.seam.kind === 'recap') w.dismissRecap()
            w.tick(1)
        }
        expect(w.cell(AT).kind).toBe('dead')
        const r = new Plant('carrot', 'base', 0)
        r.maturity = 1
        const ripe = {col: 11, row: 12}
        w.setCell(ripe, {kind: 'ripe', soil: bed(0, 0), plant: r})
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
            item: {kind: 'container', id: 'bucket', liters: 2, capacityLiters: 2},
        }
        const s = bed(0.4)
        const p = new Plant('carrot', 'base', 0)
        w.setCell(AT, {kind: 'growing', soil: s, plant: p})
        w.seats[0].actor.x = 10.5
        w.seats[0].actor.y = 12.5
        w.click(AT)
        for (let n = 0; n < 12 && w.seats[0].queue.length > 0; n++) w.tick(1 / 15)
        const target = SOIL_WATER_MID + p.stats(w.modifiers).waterTolerance
        expect(s.water).toBeCloseTo(target, 2)
        expect(
            w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'container' ? w.seats[0].hand.item.liters : -1,
        ).toBeCloseTo(2 - (target - 0.4), 2)

        const bare2 = {col: 11, row: 12}
        const sb = bed(0.2)
        w.setCell(bare2, {kind: 'empty', soil: sb})
        w.seats[0].hand = {
            kind: 'hold',
            item: {kind: 'container', id: 'bucket', liters: 2, capacityLiters: 2},
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
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 1, workSeconds: 0}}
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
            {col: 18, row: 7},
            {col: 19, row: 7},
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
        w.setCell({col: 11, row: 12}, bare('soft'))
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
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0}}
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
        w.seats[0].hand = {kind: 'empty'}
        w.takeSilo('potato', 'base')
        const hand = handOf(w)
        expect(hand.kind === 'hold' && hand.item.kind === 'seeds' && hand.item.count).toBe(2)
        expect(siloCount(w, 'potato', 'base')).toBe(0)
        w.silo.seeds.length = 0
        w.silo.seeds.push({crop: 'carrot', variety: 'base', quality: 0, count: SILO_SEED_CAP})
        w.money = 999
        expect(w.buy('pack-wheat')).toBe('Seed silo full')
    })

    test('walking up to the silo stores every seed you carry', () => {
        const w = new World()
        w.seats[0].hand = {
            kind: 'hold',
            item: {kind: 'seeds', crop: 'wheat', variety: 'red-fife', quality: 0, count: 3}
        }
        w.seats[0].inventory[5] = {
            kind: 'hold',
            item: {kind: 'seeds', crop: 'grape', variety: 'base', quality: 0, count: 4}
        }
        w.click({col: SILO_BASE.col, row: SILO_BASE.row})
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
        w.seats[0].hand = {kind: 'empty'}
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
        w.seats[0].hand = {kind: 'empty'}
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
        w.additives.held.push({id: 'fertilizer', liters: ADDITIVE_CAP_LITERS})
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
        w.setCell({col: 8, row: 12}, bare('soft'))
        w.rightClick({col: 8, row: 12})
        expect(w.seats[0].hand).toEqual(hand)
        expect(w.drops).toHaveLength(drops)
        expect(w.seats[0].queue[0]).toEqual({act: 'drop', at: {col: 8, row: 12}})
        w.click({col: 14, row: 6})
        expect(w.seats[0].queue[1]).toEqual({act: 'inventory'})
        expect(w.seats[0].cue).toEqual({kind: 'none'})
        expect(w.seats[0].hand).toEqual(hand)
    })

    test('compact after buy and swap', () => {
        const w = new World()
        w.buy('pack-carrot')
        expectPacked(w)
        expect(siloCount(w, 'carrot', 'base')).toBe(12)
        w.seats[0].hand = {
            kind: 'hold',
            item: {
                kind: 'fruit',
                crop: 'carrot',
                variety: 'base',
                quality: 0,
                count: 2,
                unitSale: 4,
                freshness: 1,
                bio: true,
                cut: false
            }
        }
        w.swap(1)
        w.seats[0].hand = {
            kind: 'hold',
            item: {
                kind: 'fruit',
                crop: 'carrot',
                variety: 'base',
                quality: 0,
                count: 3,
                unitSale: 4,
                freshness: 1,
                bio: true,
                cut: false
            }
        }
        w.swap(2)
        expectPacked(w)
        const fruits = w.seats[0].inventory.filter(s => s.kind === 'hold' && s.item.kind === 'fruit' && s.item.crop === 'carrot')
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
        expect(w.job).toEqual({kind: 'idle'})
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
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0}}
        const soil = bed()
        w.setCell(AT, {kind: 'growing', soil, plant: new Plant('carrot', 'base', 0)})
        w.seats[0].actor.x = 10.5
        w.seats[0].actor.y = 12.5
        w.click(AT)
        w.tick(0.05)
        expect(w.cell(AT).kind).toBe('empty')
        expect((w.cell(AT) as { soil: Soil }).soil).toBe(soil)
        const seed = w.drops.find(d => d.at.col === 10 && d.at.row === 12)
        expect(seed?.item).toEqual({kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 1})
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0}}
        const dead = {col: 10, row: 13}
        const deadSoil = bed()
        w.setCell(dead, {kind: 'dead', soil: deadSoil, plant: new Plant('carrot', 'base', 0)})
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
        expect(RESEARCH['unlock-tomato']).toMatchObject({cost: 8, seconds: 30})
        expect(RESEARCH['unlock-raspberry']).toMatchObject({cost: 32, seconds: 45})
        expect(RESEARCH['unlock-heirloom']).toMatchObject({cost: 140, seconds: 140, tree: 'plants'})
        expect(RESEARCH['unlock-better-tools']).toMatchObject({cost: 16, seconds: 45})
        expect(RESEARCH['unlock-irrigation']).toMatchObject({cost: 10, seconds: 40})
        expect(RESEARCH['unlock-water-storage']).toMatchObject({cost: 30, seconds: 70})
        expect(RESEARCH['unlock-expand']).toMatchObject({cost: 25, seconds: 45})
        expect(RESEARCH['expand-land']).toMatchObject({cost: 120, seconds: 90})
        expect(RESEARCH['eminent-domain']).toMatchObject({cost: 420, seconds: 180})
        expect(RESEARCH['unlock-auto-irrigation']).toMatchObject({cost: 20, seconds: 55})
        expect(RESEARCH['unlock-adv-irrigation']).toMatchObject({cost: 75, seconds: 75})
        expect(RESEARCH['unlock-advanced-sensors']).toMatchObject({cost: 140, seconds: 60})
        expect(RESEARCH['unlock-smart-irrigation']).toMatchObject({cost: 60, seconds: 100})
        expect(RESEARCH['unlock-silos']).toMatchObject({cost: 30, seconds: 60})
        expect(RESEARCH['unlock-dispatch']).toMatchObject({cost: 100, seconds: 80, tree: 'automation'})
        expect(RESEARCH['unlock-fertilizer']).toMatchObject({cost: 10, seconds: 30})
        expect(RESEARCH['unlock-crop-variants']).toMatchObject({cost: 5, seconds: 40, tree: 'plants'})
        expect(RESEARCH['unlock-pickaxe']).toMatchObject({cost: 12, seconds: 40})
    })
})

describe('beta-3 invariants', () => {
    test('starter 32x32 house door pump', () => {
        const w = new World()
        const b = w.bounds()
        expect(b).toEqual({col0: 0, row0: 0, col1: 32, row1: 32})
        expect(w.cell({col: 14, row: 6}).kind).toBe('house')
        expect(w.cell({col: 17, row: 8}).kind).toBe('house')
        expect(w.cell({col: 15, row: 9}).kind).not.toBe('house')
        expect(w.cell({col: 18, row: 7}).kind).toBe('pump')
        expect(w.cell({col: 19, row: 7}).kind).toBe('pump')
        expect(w.cell({col: 19, row: 7})).toBe(w.cell({col: 18, row: 7}))
        expect(w.pump.water.rate).toBe(SOURCE.pump.rate)
        expect(w.pump.water.capacity).toBe(SOURCE.pump.capacity)
    })

    test('expand price tax seam may go negative', () => {
        const w = new World()
        expect(w.expandPrice()).toBe(40)
        expect(w.tax()).toBe(2)
        w.done.add('unlock-expand')
        w.money = 40
        w.expand({cx: 0, cy: -1})
        expect(w.owned).toHaveLength(2)
        expect(w.expandPrice()).toBe(55)
        expect(w.tax()).toBe(8)
        expect(w.money).toBe(0)
        w.clock.t = 239.999
        w.tick(1)
        expect(w.money).toBe(2)
        w.money = -5
        w.seam = {kind: 'play'}
        w.clock.t = 239.999
        w.tick(1)
        expect(w.money).toBeLessThan(0)
    })

    test('expand no-op if locked poor owned not neighbor', () => {
        const w = new World()
        const money = w.money
        w.expand({cx: 0, cy: -1})
        expect(w.owned).toHaveLength(1)
        w.done.add('unlock-expand')
        w.money = 10
        w.expand({cx: 0, cy: -1})
        expect(w.owned).toHaveLength(1)
        w.money = 200
        w.expand({cx: 2, cy: 2})
        expect(w.owned).toHaveLength(1)
        w.expand({cx: 0, cy: 0})
        expect(w.owned).toHaveLength(1)
        expect(w.money).toBe(200)
        w.expand({cx: 1, cy: 0})
        expect(w.owned).toHaveLength(2)
        expect(money).toBe(50)
    })

    test('hard shovel 2 uses 2x time; poor uses no-op', () => {
        const w = new World()
        w.seats[0].hand = makeShovel('shovel') as never
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 5, workSeconds: 1}}
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
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 1, workSeconds: 1}}
        const hard = {col: 10, row: 14}
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
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0}}
        w.setCell(AT, bare('very-hard'))
        w.seats[0].actor.x = 10.5
        w.seats[0].actor.y = 12.5
        w.click(AT)
        expect(w.seats[0].queue).toHaveLength(0)
        expect(w.cell(AT).kind).toBe('untilled')
        w.setCell(AT, new Rock({shape: 'rect', col: 10, row: 12, w: 1, h: 1}))
        w.click(AT)
        expect(w.seats[0].queue).toHaveLength(0)
        expect(w.cell(AT).kind).toBe('rock')
    })

    test('pickaxe turns very-hard into infertile', () => {
        const w = new World()
        w.seats[0].hand = {kind: 'hold', item: makePickaxe('pickaxe')}
        w.setCell(AT, bare('very-hard'))
        w.seats[0].actor.x = 10.5
        w.seats[0].actor.y = 12.5
        w.click(AT)
        for (let i = 0; i < 70; i++) w.tick(1 / 15)
        expect(w.cell(AT).kind).toBe('infertile')
        w.seats[0].hand = {kind: 'hold', item: {kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 1}}
        w.click(AT)
        expect(w.seats[0].queue).toHaveLength(0)
        expect(w.cell(AT).kind).toBe('infertile')
    })

    test('pickaxe mines 1x1 and 1x2', () => {
        const w = new World()
        w.seats[0].hand = {kind: 'hold', item: makePickaxe('pickaxe')}
        w.setCell(AT, new Rock({shape: 'rect', col: 10, row: 12, w: 1, h: 1}))
        w.seats[0].actor.x = 10.5
        w.seats[0].actor.y = 12.5
        w.click(AT)
        for (let i = 0; i < 130; i++) w.tick(1 / 15)
        expect(w.cell(AT)).toEqual(bare('soft'))
        expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'pickaxe' && w.seats[0].hand.item.usesLeft).toBe(24)
        const a = {col: 10, row: 16}
        const b = {col: 10, row: 17}
        const rock = new Rock({shape: 'rect', col: 10, row: 16, w: 1, h: 2})
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
        const below = {col: AT.col, row: AT.row + 1}
        const tree = new Tree('apricot', {shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2}, 1, 0, {
            kind: 'on',
            daysLeft: 2
        })
        w.setCell(AT, tree)
        w.setCell(below, tree)
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0}}
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
        const above = {col: AT.col, row: AT.row - 1}
        w.setCell(AT, bare('soft'))
        w.setCell(above, bare('soft'))
        w.setCell({col: AT.col, row: AT.row + 1}, bare('soft'))
        w.seats[0].hand = {kind: 'hold', item: {kind: 'tree-seed', tree: 'cherry', variety: 'base', quality: 0}}
        w.seats[0].actor.x = AT.col + 0.5
        w.seats[0].actor.y = AT.row + 2.5
        w.click(AT)
        while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
        const foot = w.cell(AT)
        const head = w.cell(above)
        expect(foot.kind).toBe('tree')
        expect(head).toBe(foot)
        expect(foot.kind === 'tree' && foot.base.row).toBe(above.row)
        expect(w.cell({col: AT.col, row: AT.row + 1})).toEqual(bare('soft'))
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
        w.setCell(AT, new Rock({shape: 'rect', col: 10, row: 12, w: 1, h: 1}))
        w.seats[0].hand = {kind: 'empty'}
        w.seats[0].actor.x = 4.5
        w.seats[0].actor.y = 4.5
        w.click(AT)
        expect(w.seats[0].queue[0]).toEqual({act: 'walk', at: AT})
        for (let i = 0; i < 40; i++) w.tick(1 / 15)
        expect(w.seats[0].actor.inside(AT)).toBe(true)
    })
})

describe('beta-4 invariants', () => {
    test("`inventory.slots` — House starter: four `'base'` tree seeds, one graft of every tree variety, and a stack of every starter Heirloom fruit. Twelve of sixteen.", () => {
        const w = new World()
        const inv = w.seats[0].inventory
        const trees = inv.flatMap(s => (s.kind === 'hold' && s.item.kind === 'tree-seed' ? [s.item] : []))
        expect(trees.map(t => t.tree).sort()).toEqual(['apple', 'apricot', 'cherry', 'olive'])
        expect(trees.every(t => t.variety === 'base' && t.quality === 0)).toBe(true)
        const grafts = inv.flatMap(s => (s.kind === 'hold' && s.item.kind === 'graft' ? [s.item] : []))
        expect(grafts.map(g => g.variety).sort()).toEqual([...STARTER_TREE_GRAFTS].sort())
        expect(grafts.every(g => g.count === 1 && g.quality === 0 && VARIETY[g.variety as Exclude<VarietyId, 'base'>].crop === g.crop)).toBe(true)
        const fruit = inv.flatMap(s => (s.kind === 'hold' && s.item.kind === 'fruit' ? [s.item] : []))
        expect(fruit.map(f => f.variety).sort()).toEqual([...STARTER_FRUIT].sort())
        expect(fruit.every(f => f.count === STARTER_FRUIT_N && f.quality === 0 && f.freshness === 1 && f.bio)).toBe(true)
        expect(inv.filter(s => s.kind === 'hold').length).toBe(
            TREE_IDS.length + STARTER_TREE_GRAFTS.length + STARTER_FRUIT.length,
        )
        expect(inv.length).toBe(16)
    })

    test('buy-chest place 1x1 own slots', () => {
        expect(SKUS['buy-chest'].price).toBe(18)
        expect(RESEARCH['unlock-chest'].cost).toBe(10)
        const w = new World()
        w.done.add('unlock-chest')
        const a = {col: 10, row: 12}
        const b = {col: 11, row: 12}
        w.setCell(a, {kind: 'empty', soil: bed()})
        w.setCell(b, {kind: 'empty', soil: bed()})
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
        expect(ca.base).toEqual({shape: 'rect', col: 10, row: 12, w: 1, h: 1})
        expect(ca.slots).toHaveLength(9)
        expect(cb.slots).toHaveLength(9)
        expect(ca.slots.every(s => s.kind === 'empty')).toBe(true)
        expect(ca.slots).not.toBe(cb.slots)
        ca.slots[0] = {kind: 'hold', item: {kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0}}
        expect(cb.slots[0].kind).toBe('empty')
    })

    test('Grinder is a hopper. `GRIND_WORK` 12 — preference. Mill-like tick. Not actor work. Seeds do not merge into house.', () => {
        expect(GRIND_WORK).toBe(12)
        const w = grindWorld(7)
        w.seats[0].inventory.forEach((_, i) => {
            w.seats[0].inventory[i] = {
                kind: 'hold',
                item: {kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0}
            }
        })
        w.seats[0].hand = {
            kind: 'hold',
            item: {
                kind: 'fruit',
                crop: 'wheat',
                variety: 'red-fife',
                quality: 0,
                count: 1,
                unitSale: 28,
                freshness: 1,
                bio: true,
                cut: false
            },
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
            w.seats[0].inventory[i] = {
                kind: 'hold',
                item: {kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0}
            }
        })
        w.seats[0].hand = {
            kind: 'hold',
            item: {
                kind: 'fruit',
                crop: 'tomato',
                variety: 'green-zebra',
                quality: 0,
                count: n,
                unitSale: 22.5,
                freshness: 1,
                bio: true,
                cut: false
            },
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
            itemLine({
                kind: 'fruit',
                crop: 'carrot',
                variety: 'base',
                quality: 0,
                count: 3,
                unitSale: 4,
                freshness: 1,
                bio: true,
                cut: false
            }, w.modifiers),
        ).toBe(`Carrot - 3, freshness 100% ${m.hud_quality_pct({n: 0})}`)
        expect(itemLine({kind: 'sugar', liters: 2, capacityLiters: 2, unitSale: 5, quality: 0}, w.modifiers)).toBe(
            `Sugar - 2L ${m.hud_quality_pct({n: 0})}`,
        )
    })

    test('infertile prompt is does not need seeds', () => {
        const w = new World()
        w.setCell(AT, {kind: 'infertile'})
        const p = w.prompt(AT)
        expect(p.kind).toBe('blocked')
        expect(p.text).toBe('Does not need seeds')
    })

    test('pickaxe on ripe does not queue and speaks', () => {
        const w = new World()
        w.setCell(AT, {kind: 'ripe', soil: bed(), plant: new Plant('carrot', 'base', 0)})
        w.seats[0].hand = {kind: 'hold', item: makePickaxe('pickaxe')}
        const q = [...w.seats[0].queue]
        w.click(AT)
        expect(w.seats[0].queue).toEqual(q)
        expect(w.speech).toEqual({
            kind: 'say',
            text: m.prompt_cannot_use({tool: m.names_pickaxe_pickaxe(), action: m.prompt_harvest()}),
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
        expect(w.seats[0].place).toEqual({kind: 'sku', id: 'buy-pipe'})
        const e1: Edge = {axis: 'h', col: 10, row: 12}
        const e2: Edge = {axis: 'h', col: 11, row: 12}
        w.placePipe(e1)
        w.placePipe(e2)
        expect(w.seats[0].place).toEqual({kind: 'sku', id: 'buy-pipe'})
        expect(w.hasPipe(e1)).toBe(true)
        expect(w.hasPipe(e2)).toBe(true)
        expect(w.money).toBe(44)
        const netA = w.netOfVertex({col: 10, row: 12})
        const netB = w.netOfVertex({col: 12, row: 12})
        expect(netA).toBeDefined()
        expect(netA).toBe(netB)
    })

    test('junction classification', () => {
        const v = {col: 10, row: 12}
        const hL: Edge = {axis: 'h', col: 9, row: 12}
        const hR: Edge = {axis: 'h', col: 10, row: 12}
        const vD: Edge = {axis: 'v', col: 10, row: 12}
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
        const e1: Edge = {axis: 'h', col: 10, row: 12}
        w.placePipe(e1)
        const wellAt = {col: 20, row: 12}
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
        const net = w.netOfVertex({col: 18, row: 7})
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
        const at = {col: 10, row: 12}
        w.setCell(at, bare('soft'))
        w.buy('buy-well')
        w.confirmPlace(at)
        expect(w.cell(at).kind).toBe('well')
        const a = w.netOfVertex({col: 10, row: 12})
        const b = w.netOfVertex({col: 11, row: 13})
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
        const at = {col: 5, row: 20}
        w.setCell(at, bare('soft'))
        w.setCell({col: 6, row: 20}, bare('soft'))
        w.confirmPlace(at)
        expect(w.cell(at).kind).toBe('pump')
        const jack = w.pumps[1]
        const before = jack.water.stored
        w.buy('buy-pipe')
        ;[5, 6, 7, 8, 9].forEach(col => {
            w.placePipe({axis: 'h', col, row: 20})
        })
        w.buy('buy-sprinkler')
        ;[5, 6, 7, 8, 9].forEach(col => {
            w.placeSprinkler({variant: 'basic', at: {col, row: 20}, tune: {kind: 'flat'}, inn: 0, hold: 0})
        })
        const soils: Soil[] = []
        ;[5, 6, 7, 8, 9].forEach(col => {
            const s = bed(0.2)
            soils.push(s)
            const p = new Plant('carrot', 'base', 0)
            w.setCell({col, row: 19}, {kind: 'growing', soil: s, plant: p})
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
        const at = {col: 5, row: 20}
        w.setCell(at, bare('soft'))
        w.setCell({col: 6, row: 20}, bare('soft'))
        w.confirmPlace(at)
        w.buy('buy-pipe')
        w.placePipe({axis: 'h', col: 5, row: 20})
        w.buy('buy-sprinkler')
        const v = {col: 5, row: 20}
        w.placeSprinkler({variant: 'basic', at: v, tune: {kind: 'flat'}, inn: 0, hold: 0})
        w.setCell({col: 5, row: 19}, {kind: 'growing', soil: bed(0.2), plant: new Plant('carrot', 'base', 0)})

        w.tick(DT_MAX)
        expect(w.vfx.get(vertexKey(v))).toBe(true)

        w.setCell({col: 5, row: 19}, bare('soft'))
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
        const e: Edge = {axis: 'h', col: 10, row: 20}
        w.placePipe(e)
        w.buy('buy-sprinkler')
        w.placeSprinkler({variant: 'basic', at: {col: 10, row: 20}, tune: {kind: 'flat'}, inn: 0, hold: 0})
        expect(w.rate({col: 10, row: 20})).toBe(0)
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
            effect: {kind: 'feature'},
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
            effect: {kind: 'feature'},
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
        const at = {col: 10, row: 12}
        w.setCell(at, {kind: 'empty', soil: bed()})
        w.setCell({col: 11, row: 12}, {kind: 'empty', soil: bed()})
        w.confirmPlace(at)
        expect(w.cell(at).kind).toBe('pump')
        w.buy('buy-pipe')
        const e: Edge = {axis: 'h', col: 10, row: 12}
        w.placePipe(e)
        w.buy('buy-sprinkler')
        const v = {col: 10, row: 12}
        w.placeSprinkler({variant: 'basic', at: v, tune: {kind: 'flat'}, inn: 0, hold: 0})
        w.buy('buy-grinder')
        const g = {col: 8, row: 12}
        w.setCell(g, {kind: 'empty', soil: bed()})
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
        const v = {col: 10, row: 12}
        expect(sorted(aoe({variant: 'basic', at: v, tune: {kind: 'flat'}, inn: 0, hold: 0}))).toEqual(
            sorted([
                {col: 9, row: 11},
                {col: 10, row: 11},
                {col: 9, row: 12},
                {col: 10, row: 12},
            ]),
        )
        expect(sorted(aoe({variant: 'large', at: v, tune: {kind: 'flat'}, inn: 0, hold: 0}))).toEqual(
            sorted(
                [-2, -1, 0, 1].flatMap(dr => [-2, -1, 0, 1].map(dc => ({col: 10 + dc, row: 12 + dr}))),
            ),
        )
        expect(sorted(aoe({variant: 'vert', at: v, facing: 'ns', tune: {kind: 'flat'}, inn: 0, hold: 0}))).toEqual(
            sorted(
                [-2, -1, 0, 1].flatMap(dr => [-1, 0].map(dc => ({col: 10 + dc, row: 12 + dr}))),
            ),
        )
        expect(sorted(aoe({variant: 'vert', at: v, facing: 'ew', tune: {kind: 'flat'}, inn: 0, hold: 0}))).toEqual(
            sorted(
                [-1, 0].flatMap(dr => [-2, -1, 0, 1].map(dc => ({col: 10 + dc, row: 12 + dr}))),
            ),
        )
    })

    test('sprinkler waters growing soil only; ripe untouched', () => {
        const w = new World()
        w.done.add('unlock-irrigation')
        w.done.add('unlock-auto-irrigation')
        w.money = 100
        w.buy('buy-pipe')
        w.placePipe({axis: 'h', col: 18, row: 7})
        w.buy('buy-sprinkler')
        w.placeSprinkler({variant: 'basic', at: {col: 19, row: 7}, tune: {kind: 'flat'}, inn: 0, hold: 0})
        const gs = bed(0.5)
        const g = new Plant('carrot', 'base', 0)
        w.setCell({col: 18, row: 6}, {kind: 'growing', soil: gs, plant: g})
        const rs = bed(0.5)
        const r = new Plant('carrot', 'base', 0)
        r.maturity = 1
        w.setCell({col: 19, row: 6}, {kind: 'ripe', soil: rs, plant: r})
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
        const v = {col: 10, row: 12}
        w.placeSprinkler({variant: 'basic', at: v, tune: {kind: 'flat'}, inn: 0, hold: 0})
        expect(w.sprinklerAt(v)).toEqual({variant: 'basic', at: v, tune: {kind: 'flat'}, inn: 0, hold: 0})
        expect(w.rate(v)).toBe(0)
    })

    test('isolated sprinkler then source-touching pipe at vertex', () => {
        const w = new World()
        w.done.add('unlock-irrigation')
        w.done.add('unlock-auto-irrigation')
        w.money = 100
        w.buy('buy-sprinkler')
        const v = {col: 19, row: 7}
        w.placeSprinkler({variant: 'basic', at: v, tune: {kind: 'flat'}, inn: 0, hold: 0})
        const g = new Plant('carrot', 'base', 0)
        w.setCell({col: 18, row: 6}, {kind: 'growing', soil: bed(0.5), plant: g})
        expect(w.rate(v)).toBe(0)
        w.buy('buy-pipe')
        const e: Edge = {axis: 'h', col: 18, row: 7}
        w.placePipe(e)
        expect(w.rate(v)).toBeCloseTo(SPRINKLER_TILE_RATE, 9)
    })

    test('growing in AoE R>0 soil not below dry trajectory', () => {
        const w = new World()
        w.done.add('unlock-irrigation')
        w.done.add('unlock-auto-irrigation')
        w.money = 100
        w.buy('buy-pipe')
        w.placePipe({axis: 'h', col: 18, row: 7})
        w.buy('buy-sprinkler')
        const v = {col: 19, row: 7}
        w.placeSprinkler({variant: 'basic', at: v, tune: {kind: 'flat'}, inn: 0, hold: 0})
        const s = bed(0.5)
        const g = new Plant('carrot', 'base', 0)
        w.setCell({col: 18, row: 6}, {kind: 'growing', soil: s, plant: g})
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
        w.setCell(AT, {kind: 'ripe', soil: bed(), plant: p})
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
        w.seats[0].hand = {kind: 'empty'}
        w.seats[0].actor.x = AT.col + 0.5
        w.seats[0].actor.y = AT.row + 0.5
        const sale = new Plant('carrot', 'base', 0).stats(w.modifiers).sale
        const a = new Plant('carrot', 'base', 0)
        a.freshness = 1
        w.setCell(AT, {kind: 'ripe', soil: bed(), plant: a})
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
        w.seats[0].hand = {kind: 'empty'}
        const b = new Plant('carrot', 'base', 0)
        b.freshness = 0.4
        w.setCell(AT, {kind: 'ripe', soil: bed(), plant: b})
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
            item: {
                kind: 'fruit',
                crop: 'carrot',
                variety: 'base',
                quality: 0,
                count: 1,
                unitSale: 4,
                freshness: 1,
                bio: true,
                cut: false
            },
        }
        w.seats[0].inventory[1] = {
            kind: 'hold',
            item: {
                kind: 'fruit',
                crop: 'carrot',
                variety: 'base',
                quality: 0,
                count: 1,
                unitSale: 6,
                freshness: 1,
                bio: true,
                cut: false
            },
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
        w.setCell(AT, {kind: 'empty', soil: bed()})
        w.setCell({col: 11, row: 12}, {kind: 'empty', soil: bed()})
        w.confirmPlace(AT)
        expect(w.cell(AT).kind).toBe('pump')
        expect(w.cell({col: 11, row: 12}).kind).toBe('pump')
        const starter = {col: 18, row: 7}
        expect(w.cell(starter).kind).toBe('pump')
        w.armDelete()
        const money = w.money
        w.deleteBuilding(AT)
        expect(w.money).toBe(money)
        expect(w.cell(AT).kind).toBe('empty')
        expect(w.cell({col: 11, row: 12}).kind).toBe('empty')
        expect(w.cell(starter).kind).toBe('pump')
        expect(w.pumps).toHaveLength(1)
        expect(w.pumps[0].form).toBe('starter')
    })

    test('delete chest drops items; house delete is no-op', () => {
        const w = new World()
        w.done.add('unlock-chest')
        w.money = 200
        w.buy('buy-chest')
        w.setCell(AT, {kind: 'empty', soil: bed()})
        w.confirmPlace(AT)
        const chest = w.cell(AT)
        expect(chest.kind).toBe('chest')
        if (chest.kind !== 'chest') return
        chest.slots[0] = {kind: 'hold', item: {kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0}}
        chest.slots[1] = {kind: 'hold', item: {kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 2}}
        w.armDelete()
        const n = w.drops.length
        w.deleteBuilding(AT)
        expect(w.cell(AT).kind).toBe('empty')
        expect(w.drops).toHaveLength(n + 2)
        expect(w.drops.some(d => d.at.col === AT.col && d.at.row === AT.row && d.item.kind === 'tree-seed')).toBe(true)
        const house = {col: 14, row: 6}
        expect(w.cell(house).kind).toBe('house')
        w.deleteBuilding(house)
        expect(w.cell(house).kind).toBe('house')
        w.click(house)
        expect(w.cell(house).kind).toBe('house')
    })

    test('rotten shovel empties with compostable drop; pickaxe and empty hand do not', () => {
        const w = new World()
        w.setCell(AT, {kind: 'rotten', soil: bed(), crop: 'carrot'})
        w.seats[0].hand = {kind: 'hold', item: makePickaxe('pickaxe')}
        w.seats[0].actor.x = AT.col + 0.5
        w.seats[0].actor.y = AT.row + 0.5
        const drops = w.drops.length
        w.click(AT)
        expect(w.cell(AT).kind).toBe('rotten')
        w.seats[0].hand = {kind: 'empty'}
        w.click(AT)
        expect(w.cell(AT).kind).toBe('rotten')
        while (w.seats[0].queue.length > 0) w.tick(1 / 15)
        w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 10, workSeconds: 0}}
        w.click(AT)
        w.tick(0.05)
        expect(w.cell(AT).kind).toBe('empty')
        expect(w.drops).toHaveLength(drops)
        expect(w.drops.some(d => d.at.col === AT.col && d.at.row === AT.row && d.item.kind === 'rotten')).toBe(false)
    })

    test('different rarity seeds do not merge', () => {
        const w = new World()
        w.seats[0].inventory[0] = {
            kind: 'hold',
            item: {kind: 'seeds', crop: 'carrot', variety: 'base', quality: 0, count: 2}
        }
        w.seats[0].inventory[1] = {
            kind: 'hold',
            item: {kind: 'seeds', crop: 'potato', variety: 'bintje', quality: 0, count: 3}
        }
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
        w.setCell(AT, {kind: 'growing', soil: drySoil, plant: wilt})
        const wetAt = {col: 11, row: 12}
        const wetSoil = bed(1)
        const wet = new Plant('carrot', 'base', 0)
        w.setCell(wetAt, {kind: 'growing', soil: wetSoil, plant: wet})
        const use = wilt.stats(w.modifiers).waterUsePerSec
        const dt = 1 / 15
        w.tick(dt)
        expect(drySoil.water).toBe(0)
        expect(wetSoil.water).toBeCloseTo(1 - use * dt, 9)
        expect(wilt.maturity).toBeCloseTo((dt * STUNT) / CROPS.carrot.growSeconds, 9)
        expect(wet.maturity).toBeCloseTo(dt / CROPS.carrot.growSeconds, 9)
    })

    test("shop packs are `'base'` quality 0. `heirloom` skill gated on `unlock-heirloom`.", () => {
        expect(SKILLS.heirloom.gate).toEqual({kind: 'research', id: 'unlock-heirloom'})
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
        w.setCell(AT, {kind: 'growing', soil: bed(0), plant: p})
        w.tick(1 / 15)
        expect(p.happiness).toBeLessThan(HAPPY_START)
        expect(p.happiness).toBeGreaterThan(0)
    })
})

describe('world.dest', () => {
    test('dest(hangar | silo | still | fill) is the origin of that instance, not the interior cell clicked. dest(inventory) is DOOR. dest(consign) is PAD.', () => {
        const w = new World(1)
        w.unlockAll()
        w.money = 999
        w.buy('buy-hangar')
        w.confirmPlace(AT)
        expect(dest({act: 'hangar', at: {col: AT.col + 1, row: AT.row + 1}}, w)).toEqual(AT)
        expect(dest({act: 'silo', at: {col: SILO_BASE.col, row: SILO_BASE.row + 1}}, w)).toEqual({
            col: SILO_BASE.col,
            row: SILO_BASE.row,
        })
        const stillAt = {col: 10, row: 16}
        w.buy('buy-still')
        w.confirmPlace(stillAt)
        expect(dest({act: 'still', at: {col: stillAt.col + 1, row: stillAt.row}}, w)).toEqual(stillAt)
        expect(dest({act: 'fill', at: {col: 18, row: 7}}, w)).toEqual({col: 18, row: 7})
        expect(dest({act: 'fill', at: {col: 19, row: 7}}, w)).toEqual({col: 18, row: 7})
        w.buy('buy-pumpjack')
        const jack = {col: 8, row: 16}
        w.confirmPlace(jack)
        expect(dest({act: 'fill', at: {col: jack.col + 1, row: jack.row}}, w)).toEqual(jack)
        expect(dest({act: 'inventory'}, w)).toEqual(DOOR)
        expect(dest({act: 'consign'}, w)).toEqual(PAD)
        expect(dest({act: 'additives', at: {col: 18, row: 10}}, w)).toEqual({col: 18, row: 10})
    })
})

describe('world.pulse', () => {
    test('World has no pulse field. Last-action highlight gone. Not a cmd. Not Save.', () => {
        const w = new World(1)
        expect('pulse' in w).toBe(false)
        w.buy('buy-pipe')
        w.placePipe({axis: 'h', col: 18, row: 7})
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
        expect(w.log).toEqual([{a: Act.cheat, t: 0, p: 0, k: 'skills'}])

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
        w.setCell(AT, {kind: 'growing', soil: bed(), plant: p})
        w.clock.t = 80
        w.endDay()
        expect(w.clock.t).toBe(DAY_SECONDS)
        expect(p.maturity).toBe(0.4)
        expect(w.seam.kind).toBe('play')
        expect(w.log).toEqual([{a: Act.cheat, t: 0, p: 0, k: 'day'}])
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
        expect(w.log).toEqual([{a: Act.cheat, t: 0, p: 0, k: 'speed', n: 3}])
        w.setCheatSpeed(1)
        expect(w.cheatSpeed).toBe(1)

        const a = new World(1)
        const b = new World(1)
        b.setCheatSpeed(3)
        const pa = new Plant('carrot', 'base', 0)
        const pb = new Plant('carrot', 'base', 0)
        a.setCell(AT, {kind: 'growing', soil: bed(), plant: pa})
        b.setCell(AT, {kind: 'growing', soil: bed(), plant: pb})
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
