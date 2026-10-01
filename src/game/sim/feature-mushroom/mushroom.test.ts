import { describe, expect, test } from 'vitest'
import { m } from '../../../paraglide/messages.js'
import { HAPPY_MAX } from '../../defs/crops.ts'
import { MUSHROOM_CHANCE, MUSHROOM_DAYS, MUSHROOM_TRUFFLE, mushroomChance, type MushroomId } from '../../defs/mushroom.ts'
import { TREE_HAPPY_START } from '../../defs/trees.ts'
import { tierOf, type VarietyId } from '../../defs/varieties.ts'
import { WEATHER_KINDS } from '../../defs/weather.ts'
import { Tree, type Coord } from '../building.ts'
import { canShovel, seedPair } from '../feature-field/field.helpers.ts'
import { treeArea } from '../feature-field/field.ts'
import { dump, parse } from '../feature-save/save.ts'
import { makeShovel } from '../item.ts'
import { bare, isFenceSite, isPavingSite, type Cell } from '../plot.ts'
import { placeSolidOk, readPrompt } from '../prompt.ts'
import { HARDNESS } from '../../defs/rules.ts'
import { makeTreeSoil, Soil, TREE_FERT_MAX, TREE_WATER_MID } from '../soil.ts'

const WEED_CHANCE = HARDNESS.normal.weedChance
import type { WeatherKind } from '../weather.ts'
import { DT_MAX, World } from '../world.ts'
import { grownTrees, mushroomSeam } from './mushroom.ts'

const AT = { col: 16, row: 20 }

function grownTree(w: World, at: Coord, variety: VarietyId = 'base'): Tree {
  const tree = new Tree(
    'apple',
    { shape: 'rect', col: at.col, row: at.row, w: 1, h: 2 },
    makeTreeSoil(TREE_WATER_MID, TREE_FERT_MAX, WEED_CHANCE),
    TREE_HAPPY_START,
    1,
    0,
    { kind: 'on', daysLeft: 2 },
  )
  tree.variety = variety
  treeArea(tree).forEach(p => w.setCell(p, bare('soft', 0)))
  w.setCell(at, tree)
  w.setCell({ col: at.col, row: at.row + 1 }, tree)
  return tree
}

function seamAfter(w: World, ended: number, kind: WeatherKind): void {
  w.clock.day = ended - 1
  w.pinTomorrow(kind)
  w.clock.day = ended + 1
  mushroomSeam(w)
}

function clear(w: World): void {
  ;[...w.mushrooms.values()].forEach(at => w.setCell(at, bare('soft', 0)))
}

function mushroomOf(c: Cell): { id: MushroomId; day: number } | undefined {
  return c.kind === 'untilled' && c.cover.kind === 'mushroom' ? { id: c.cover.id, day: c.cover.day } : undefined
}

function place(w: World, at: Coord, id: MushroomId, day: number): void {
  w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'mushroom', id, day } })
}

describe('mushroom.day', () => {
  test('At the end of each day each grown tree draws once against `mushroomChance` of the ended day\'s weather, the Mycologist rank and the tree\'s happiness, and places at most one mushroom in its area; the kind is Truffle below `MUSHROOM_TRUFFLE` of the tree\'s variety tier.', () => {
    const w = new World(3)
    const trees = [
      grownTree(w, { col: 4, row: 20 }, 'base'),
      grownTree(w, { col: 10, row: 20 }, 'kingston-black'),
      grownTree(w, { col: 16, row: 20 }, 'pink-lady'),
      grownTree(w, { col: 22, row: 20 }, 'base'),
    ]
    const stream = w.rng.stream('mushroom')
    let hits = 0
    WEATHER_KINDS.forEach(kind => {
      for (let ended = 2; ended < 60; ended++) {
        clear(w)
        seamAfter(w, ended, kind)
        trees.forEach(t => {
          const draw = (i: number) => stream.at(t.base.col, t.base.row, ended, i)
          const here = treeArea(t).flatMap(p => {
            const found = mushroomOf(w.cell(p))
            return found === undefined ? [] : [found]
          })
          if (draw(0) >= mushroomChance(kind, 0, t.happiness)) {
            expect(here).toEqual([])
            return
          }
          hits += 1
          const id: MushroomId = draw(2) < MUSHROOM_TRUFFLE[tierOf(t.variety)] ? 'truffle' : 'fly-agaric'
          expect(here).toEqual([{ id, day: ended }])
        })
      }
    })
    expect(hits).toBeGreaterThan(0)
    expect(MUSHROOM_CHANCE.drought).toBe(0)
  })
})

describe('mushroom.chance', () => {
  test('`mushroomChance` is (`MUSHROOM_CHANCE` + `MUSHROOM_MYCOLOGIST` × Mycologist rank) × the happiness factor: ×0.5 at no happiness, ×1 at half, ×1.5 at full; the seam reads the farm\'s Mycologist rank.', () => {
    expect(mushroomChance('clear', 0, HAPPY_MAX / 2)).toBeCloseTo(0.02)
    expect(mushroomChance('clear', 3, HAPPY_MAX)).toBeCloseTo(0.075)
    expect(mushroomChance('rain', 3, HAPPY_MAX)).toBeCloseTo(0.33)
    expect(mushroomChance('dry', 3, HAPPY_MAX)).toBeCloseTo(0.06)
    expect(mushroomChance('flood', 3, HAPPY_MAX)).toBeCloseTo(0.66)
    expect(mushroomChance('drought', 3, HAPPY_MAX)).toBe(0)
    expect(mushroomChance('rain', 0, 0)).toBeCloseTo(0.08)
    expect(mushroomChance('rain', 1, HAPPY_MAX / 2)).toBeCloseTo(0.18)

    const w = new World(3)
    w.family.owned.set('mycologist', 3)
    const tree = grownTree(w, AT)
    tree.happiness = HAPPY_MAX
    const stream = w.rng.stream('mushroom')
    const ended = Array.from({ length: 400 }, (_, i) => i + 2).find(d => {
      const u = stream.at(tree.base.col, tree.base.row, d, 0)
      return u >= mushroomChance('flood', 0, TREE_HAPPY_START) && u < mushroomChance('flood', 3, HAPPY_MAX)
    })
    if (ended === undefined) throw new Error('day')
    seamAfter(w, ended, 'flood')
    expect(w.mushrooms.size).toBe(1)
    const plain = new World(3)
    grownTree(plain, AT)
    seamAfter(plain, ended, 'flood')
    expect(plain.mushrooms.size).toBe(0)
  })
})

describe('mushroom.till', () => {
  test('No mushroom comes up on a plot, a paved tile or under an item; a tree with no free tile gets nothing.', () => {
    const w = new World(3)
    const tree = grownTree(w, AT)
    const area = treeArea(tree)
    area.forEach(p => w.setCell(p, { kind: 'empty', soil: new Soil(0, 0, WEED_CHANCE) }))
    for (let ended = 2; ended < 80; ended++) seamAfter(w, ended, 'flood')
    expect(w.mushrooms.size).toBe(0)
  })
})

describe('mushroom.gone', () => {
  test('A mushroom from the end of day d is removed at the end of day d + `MUSHROOM_DAYS`, before new ones come up; the tile becomes bare untilled ground.', () => {
    const w = new World(3)
    const at = { col: 3, row: 3 }
    place(w, at, 'truffle', 5)
    seamAfter(w, 5 + MUSHROOM_DAYS - 1, 'drought')
    expect(mushroomOf(w.cell(at))).toEqual({ id: 'truffle', day: 5 })
    seamAfter(w, 5 + MUSHROOM_DAYS, 'drought')
    expect(w.cell(at)).toEqual({ kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
    expect(w.mushrooms.size).toBe(0)
  })
})

describe('mushroom.order', () => {
  test('Trees are taken by `base`, row then column; stumps and saplings are not grown trees; a tile holding a mushroom is not a free tile.', () => {
    const w = new World(3)
    const b = grownTree(w, { col: 20, row: 24 })
    const a = grownTree(w, { col: 8, row: 24 })
    const c = grownTree(w, { col: 14, row: 18 })
    const sapling = grownTree(w, { col: 26, row: 18 })
    sapling.juvenile = 0.5
    const stump = grownTree(w, { col: 2, row: 12 })
    stump.trunk = true
    expect(grownTrees(w).map(t => t.base)).toEqual([c.base, a.base, b.base])
    const shared = { col: 11, row: 30 }
    place(w, shared, 'fly-agaric', 2)
    expect(placeSolidOk(w, shared)).toBe(false)
  })
})

describe('mushroom.pick', () => {
  test('**Pick up** gives one item of the mushroom\'s kind and leaves bare untilled ground; a hand holding another item sees the mushroom\'s name and nothing happens.', () => {
    const w = new World(3)
    place(w, AT, 'truffle', 2)
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.act = w.seats[0]
    w.seats[0].hand = { kind: 'hold', item: makeShovel('shovel') }
    expect(readPrompt(w, AT)).toEqual({ kind: 'blocked', text: m.names_item_truffle() })
    w.seats[0].hand = { kind: 'hold', item: { kind: 'truffle', count: 2 } }
    const p = readPrompt(w, AT)
    expect(p.kind === 'intent' && p.text).toBe(m.prompt_pick_up())
    w.enqueue({ act: 'pickup', at: AT })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(w.seats[0].hand).toEqual({ kind: 'hold', item: { kind: 'truffle', count: 3 } })
    expect(w.cell(AT)).toEqual({ kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
    place(w, AT, 'fly-agaric', 2)
    w.seats[0].hand = { kind: 'empty' }
    w.enqueue({ act: 'pickup', at: AT })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(w.seats[0].hand).toEqual({ kind: 'hold', item: { kind: 'fly-agaric', count: 1 } })
  })
})

describe('mushroom.block', () => {
  test('A mushroom is walkable; placing, paving, fencing, planting a tree seed and tilling on it are refused; it is saved with its kind and day.', () => {
    const w = new World(3)
    place(w, AT, 'fly-agaric', 4)
    place(w, { col: AT.col, row: AT.row - 1 }, 'truffle', 4)
    const c = w.cell(AT)
    expect(placeSolidOk(w, AT)).toBe(false)
    expect(isPavingSite(c)).toBe(false)
    expect(isFenceSite(c)).toBe(false)
    expect(seedPair(w, AT)).toBeUndefined()
    w.act = w.seats[0]
    w.seats[0].hand = { kind: 'hold', item: makeShovel('shovel') }
    expect(canShovel(w, AT)).toBe(false)
    const round = parse(JSON.stringify(dump(w)))
    expect(round.ok).toBe(true)
    if (!round.ok) return
    expect(mushroomOf(round.world.cell(AT))).toEqual({ id: 'fly-agaric', day: 4 })
    expect(round.world.mushrooms.size).toBe(2)
  })
})
