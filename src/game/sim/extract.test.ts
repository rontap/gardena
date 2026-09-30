import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import {
  EXTRACT_BAG_LITERS,
  EXTRACT_GROWTH,
  EXTRACT_INFUSED_SECONDS,
  EXTRACT_POUR,
  EXTRACT_SEASON,
  EXTRACT_SECONDS,
  EXTRACT_WORK,
  INFUSE_REAGENTS,
  INFUSE_SECONDS,
  MILL_GRASS,
  MILL_H,
  MILL_TRUFFLE_OUT,
  MILL_W,
  MILL_WORK,
} from '../defs/items.ts'
import { TREES, TREE_HAPPY_START } from '../defs/trees.ts'
import { Infuser, Mill, occupiedCells, Tree } from './building.ts'
import { advanceYield } from './feature-field/field.ts'
import { canExtract, doChop } from './feature-field/field.helpers.ts'
import { dump, parse } from './feature-save/save.ts'
import { INFUSABLE_KINDS, REAGENTS, type Reagent } from './ids.ts'
import { makeAxe, makeExtract, type Item } from './item.ts'
import { Plant } from './plant.ts'
import { readPrompt } from './prompt.ts'
import { makeTreeSoil, Soil, SOIL_WATER_MID, STUNT, TREE_FERT_MAX, TREE_WATER_MID, WEED_CHANCE } from './soil.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 20 }
const NEXT = { col: 12, row: 20 }

function stand(w: World, at: { col: number; row: number }): void {
  w.seats[0].actor.x = at.col + 0.5
  w.seats[0].actor.y = at.row + 0.5
  w.act = w.seats[0]
}

function drain(w: World): void {
  for (let i = 0; i < 200 && w.seats[0].queue.length > 0; i++) w.tick(DT_MAX)
}

function run(w: World, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / DT_MAX); i++) w.tick(DT_MAX)
}

function sow(w: World, at: { col: number; row: number }, water = SOIL_WATER_MID): Plant {
  const plant = new Plant('tomato', 'base', 0)
  w.setCell(at, { kind: 'growing', soil: new Soil(water, 1, WEED_CHANCE), plant })
  return plant
}

function pour(w: World, at: { col: number; row: number }, item: Item): void {
  stand(w, at)
  w.seats[0].hand = { kind: 'hold', item }
  w.enqueue({ act: 'extract', at })
  drain(w)
}

function tree(w: World, juvenile: number, y: Tree['yield']): Tree {
  const t = new Tree(
    'apple',
    { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 },
    makeTreeSoil(TREE_WATER_MID, TREE_FERT_MAX, WEED_CHANCE),
    TREE_HAPPY_START,
    juvenile,
    0,
    y,
  )
  w.setCell(AT, t)
  w.setCell({ col: AT.col, row: AT.row + 1 }, t)
  return t
}

describe('plants.extract', () => {
  test('Extract adds `EXTRACT_GROWTH` ÷ `EXTRACT_SECONDS` growth per second for the bag\'s seconds, the same at any point of growth; Infused Extract runs `EXTRACT_INFUSED_SECONDS`; once per plant, and a second pour shows no prompt and uses nothing.', () => {
    const w = new World(2)
    const boosted = sow(w, AT)
    const plain = sow(w, NEXT)
    boosted.maturity = 0.5
    plain.maturity = 0.5
    pour(w, AT, makeExtract(false))
    expect(boosted.boosted).toBe(true)
    expect(w.seats[0].hand).toEqual({ kind: 'hold', item: { ...makeExtract(false), liters: EXTRACT_BAG_LITERS - EXTRACT_POUR } })
    expect(canExtract(w, AT)).toBe(false)
    expect(readPrompt(w, AT)).not.toMatchObject({ text: m.prompt_pour_extract() })
    run(w, EXTRACT_SECONDS + 5)
    expect(boosted.boost).toBe(0)
    expect(boosted.maturity - plain.maturity).toBeCloseTo(EXTRACT_GROWTH, 6)

    const v = new World(2)
    const infused = sow(v, AT)
    const base = sow(v, NEXT)
    pour(v, AT, makeExtract(true))
    run(v, EXTRACT_INFUSED_SECONDS + 5)
    expect(infused.maturity - base.maturity).toBeCloseTo((EXTRACT_GROWTH * EXTRACT_INFUSED_SECONDS) / EXTRACT_SECONDS, 6)
    expect(EXTRACT_WORK).toBeGreaterThan(0)
  })

  test('The extra growth is × `STUNT` for each red range; ripening ends it; a ripe plant takes no Extract; the bag leaves the hand below `EXTRACT_POUR`; boost and boosted are saved.', () => {
    const w = new World(2)
    const dry = sow(w, AT, 0)
    const plain = sow(w, NEXT, 0)
    pour(w, AT, { ...makeExtract(false), liters: EXTRACT_POUR })
    expect(w.seats[0].hand).toEqual({ kind: 'empty' })
    run(w, EXTRACT_SECONDS + 5)
    expect(dry.maturity - plain.maturity).toBeCloseTo(EXTRACT_GROWTH * STUNT, 6)
    const round = parse(JSON.stringify(dump(w)))
    expect(round.ok).toBe(true)
    if (!round.ok) return
    const back = round.world.cell(AT)
    expect(back.kind === 'growing' && [back.plant.boost, back.plant.boosted]).toEqual([dry.boost, true])
    dry.maturity = 0.999
    dry.boost = EXTRACT_SECONDS
    dry.boosted = true
    w.setCell(AT, { kind: 'growing', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE), plant: dry })
    run(w, 1)
    const ripe = w.cell(AT)
    expect(ripe.kind === 'ripe' && ripe.plant.boost).toBe(0)
    w.seats[0].hand = { kind: 'hold', item: makeExtract(false) }
    expect(canExtract(w, AT)).toBe(false)
  })
})

describe('trees.extract', () => {
  test('On a sapling or stump Extract adds `EXTRACT_GROWTH` ÷ `EXTRACT_SECONDS` to `juvenile` per second; on an out-of-season tree it adds `EXTRACT_SEASON` to `chance`; no prompt on a waiting or in-season tree; once until a chop, a stump becoming a sapling, or a season end.', () => {
    const w = new World(2)
    const t = tree(w, 0.1, { kind: 'pending' })
    pour(w, AT, makeExtract(true))
    expect(t.boost).toBeGreaterThan(0)
    expect(t.boosted).toBe(true)
    const j0 = t.juvenile
    run(w, EXTRACT_INFUSED_SECONDS + 5)
    const own = ((EXTRACT_INFUSED_SECONDS + 5) / TREES.apple.juvenileSeconds)
    expect(t.juvenile - j0).toBeCloseTo(own + (EXTRACT_GROWTH * EXTRACT_INFUSED_SECONDS) / EXTRACT_SECONDS, 2)
    expect(canExtract(w, AT)).toBe(false)

    t.juvenile = 1
    t.yield = { kind: 'on', daysLeft: 2 }
    t.boosted = false
    w.seats[0].hand = { kind: 'hold', item: makeExtract(false) }
    expect(canExtract(w, AT)).toBe(false)
    t.yield = { kind: 'pending' }
    expect(canExtract(w, AT)).toBe(false)
    t.yield = { kind: 'off', chance: 0.1 }
    pour(w, AT, makeExtract(false))
    expect(t.yield).toEqual({ kind: 'off', chance: 0.1 + EXTRACT_SEASON })
    expect(canExtract(w, AT)).toBe(false)

    t.yield = { kind: 'on', daysLeft: 1 }
    advanceYield(w, t)
    expect(t.boosted).toBe(false)
    t.boosted = true
    stand(w, AT)
    w.seats[0].hand = { kind: 'hold', item: makeAxe('axe') }
    doChop(w, AT)
    expect([t.trunk, t.boost, t.boosted]).toEqual([true, 0, false])
    t.boosted = true
    t.juvenile = 1 - 1e-9
    w.tick(DT_MAX)
    expect([t.trunk, t.juvenile, t.boosted]).toEqual([false, 0, false])
    const round = parse(JSON.stringify(dump(w)))
    expect(round.ok).toBe(true)
  })
})

describe('extract.infuser', () => {
  test('The Mill makes one full `EXTRACT_BAG_LITERS` bag of Extract from `MILL_GRASS` Cut grass and `MILL_TRUFFLE_OUT` Truffle extract from one Truffle; the Infuser turns a full bag and one Fly agaric or Truffle extract into a full bag of Infused Extract and refuses a used bag.', () => {
    const w = new World(2)
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: MILL_W, h: MILL_H })
    occupiedCells(mill.base, w.owned).forEach(p => w.setCell(p, mill))
    stand(w, AT)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'grass', count: MILL_GRASS } }
    w.enqueue({ act: 'mill', at: AT })
    drain(w)
    run(w, MILL_WORK + 1)
    expect(w.drops.map(d => d.item)).toContainEqual(makeExtract(false))
    w.drops.length = 0
    w.seats[0].hand = { kind: 'hold', item: { kind: 'truffle', count: 1 } }
    w.enqueue({ act: 'mill', at: AT })
    drain(w)
    run(w, MILL_WORK + 1)
    expect(w.drops.map(d => d.item)).toContainEqual({ kind: 'truffle-extract', count: MILL_TRUFFLE_OUT })

    const v = new World(2)
    const at = { col: 20, row: 20 }
    const inf = new Infuser({ shape: 'rect', col: at.col, row: at.row, w: MILL_W, h: MILL_H })
    occupiedCells(inf.base, v.owned).forEach(p => v.setCell(p, inf))
    stand(v, at)
    expect(inf.accept({ ...makeExtract(false), liters: EXTRACT_BAG_LITERS - EXTRACT_POUR })).toBe(0)
    expect(inf.accept(makeExtract(true))).toBe(0)
    v.seats[0].hand = { kind: 'hold', item: makeExtract(false) }
    v.enqueue({ act: 'infuse', at })
    drain(v)
    expect(v.seats[0].hand).toEqual({ kind: 'empty' })
    expect(inf.lock).toEqual({ kind: 'extract' })
    v.seats[0].hand = { kind: 'hold', item: { kind: 'flakes', quality: 0, count: 1 } }
    v.enqueue({ act: 'infuse', at })
    drain(v)
    run(v, INFUSE_SECONDS + 1)
    expect(inf.lock).toEqual({ kind: 'extract' })
    v.seats[0].hand = { kind: 'hold', item: { kind: 'fly-agaric', count: 1 } }
    v.enqueue({ act: 'infuse', at })
    drain(v)
    run(v, INFUSE_SECONDS + 1)
    expect(inf.lock).toBe('none')
    expect(inf.reagents).toEqual({ 'vanilla-extract': 0, flakes: 1, 'truffle-extract': 0, 'fly-agaric': 0 })
    expect(v.drops.map(d => d.item)).toContainEqual(makeExtract(true))
  })

  test('Each good takes two reagents; among vanilla extract, flakes and Truffle extract any two infuse every good but Extract, and one alone does not.', () => {
    const three: readonly Reagent[] = ['vanilla-extract', 'flakes', 'truffle-extract']
    const goods = INFUSABLE_KINDS.filter(k => k !== 'extract')
    goods.forEach(k => expect(INFUSE_REAGENTS[k].every(r => REAGENTS.includes(r))).toBe(true))
    three.forEach(a => {
      expect(goods.every(k => INFUSE_REAGENTS[k].includes(a))).toBe(false)
      three.filter(b => b !== a).forEach(b => {
        expect(goods.every(k => INFUSE_REAGENTS[k].includes(a) || INFUSE_REAGENTS[k].includes(b))).toBe(true)
      })
    })
    expect(INFUSE_REAGENTS.extract).toEqual(['fly-agaric', 'truffle-extract'])
  })
})
