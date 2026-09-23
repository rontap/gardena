import { describe, expect, test } from 'vitest'
import { CROPS, TREE_FERT_PER_DAY } from '../defs/crops.ts'
import { AXES } from '../defs/items.ts'
import {
  TREES,
  TREE_HAPPY_DROWN_SECONDS,
  TREE_HAPPY_GAIN_SECONDS,
  TREE_HAPPY_START,
  TREE_HAPPY_STARVE_SECONDS,
  TREE_HAPPY_WILT_SECONDS,
  TREE_OFF_CHANCE,
} from '../defs/trees.ts'
import { Tree, frontOf } from './building.ts'
import { DAY_SECONDS } from './clock.ts'
import { makeAxe, makeChainsaw, makeContainer } from './item.ts'
import { statsOf } from './modifiers.ts'
import { sprinklerTargets } from './nets.ts'
import { goodness } from './noise.ts'
import { treeLine } from './prompt.ts'
import { bare } from './plot.ts'
import { canWater } from './feature-field/field.ts'
import { dump, parse } from './feature-save/save.ts'
import {
  happyBand,
  makeTreeSoil,
  TREE_FERT_MAX,
  TREE_WATER_MAX,
  TREE_WATER_MID,
  WEED_CHANCE,
} from './soil.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function plantTree(w: World, juvenile = 1, fruit = 0, y: Tree['yield'] = { kind: 'pending' }): Tree {
  const below = { col: AT.col, row: AT.row + 1 }
  const tree = new Tree(
    'apple',
    { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 },
    makeTreeSoil(TREE_WATER_MID, TREE_FERT_MAX, WEED_CHANCE),
    TREE_HAPPY_START,
    juvenile,
    fruit,
    y,
  )
  w.setCell(AT, tree)
  w.setCell(below, tree)
  ;[AT, below].forEach(origin => {
    frontOf(origin).forEach(p => {
      if (!w.inWorld(p)) return
      if (w.cell(p).kind === 'tree') return
      w.setCell(p, bare('soft', 0))
    })
  })
  return tree
}

function drain(w: World): void {
  while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
}

describe('trees.chop', () => {
  test('Axe or chainsaw, mature not trunk, work held `workSeconds`, `AXES.axe.uses` 30, `AXES.chainsaw.uses` 90 `workSeconds` 3, 1 wood and trunk always, 2 grafts of that tree\'s variety iff `grafting` owned, fruit progress lost.', () => {
    const w = new World()
    w.family.owned.set('grafting', 1)
    const tree = plantTree(w, 1, 0.6, { kind: 'on', daysLeft: 2 })
    tree.tended = true
    const stay = { col: AT.col + 1, row: AT.row }
    w.setCell(stay, bare('soft', 0))
    w.drops.push({ at: stay, item: { kind: 'weed', count: 1 } })
    w.seats[0].hand = { kind: 'hold', item: makeAxe() }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    const prompt = w.prompt(AT)
    expect(prompt.kind).toBe('intent')
    if (prompt.kind === 'intent') expect(prompt.intent).toEqual({ act: 'chop', at: AT })
    const below = { col: AT.col, row: AT.row + 1 }
    const foot = w.prompt(below)
    expect(foot.kind === 'intent' && foot.intent.act === 'chop').toBe(true)
    w.enqueue({ act: 'chop', at: AT })
    w.tick(DT_MAX)
    expect(w.seats[0].workTotal).toBe(AXES.axe.workSeconds)
    expect(w.seats[0].workLeft).toBe(AXES.axe.workSeconds)
    drain(w)
    expect(tree.trunk).toBe(true)
    expect(tree.juvenile).toBeCloseTo(DT_MAX / TREES.apple.juvenileSeconds, 8)
    expect(tree.fruit).toBe(0)
    expect(tree.yield).toEqual({ kind: 'pending' })
    expect(tree.tended).toBe(false)
    expect(w.seats[0].hand).toEqual({
      kind: 'hold',
      item: { kind: 'axe', usesLeft: AXES.axe.uses - 1, workSeconds: AXES.axe.workSeconds },
    })
    const wood = w.drops.filter(d => d.item.kind === 'wood')
    expect(wood).toHaveLength(1)
    expect(wood[0].item).toEqual({ kind: 'wood', count: 1 })
    const grafts = w.drops.filter(d => d.item.kind === 'graft')
    expect(grafts).toHaveLength(1)
    expect(grafts[0].item).toEqual({ kind: 'graft', crop: 'apple', variety: 'base', quality: 0, count: 2 })
    expect(w.drops.some(d => d.item.kind === 'weed' && d.at.col === stay.col && d.at.row === stay.row)).toBe(true)
    expect(w.cell(AT)).toBe(tree)
    expect(w.cell(below)).toBe(tree)

    tree.trunk = false
    tree.juvenile = 1
    tree.fruit = 0.4
    tree.yield = { kind: 'off', chance: 0.2 }
    w.seats[0].hand = { kind: 'hold', item: { kind: 'axe', usesLeft: 1, workSeconds: AXES.axe.workSeconds } }
    w.enqueue({ act: 'chop', at: below })
    drain(w)
    expect(w.seats[0].hand).toEqual({ kind: 'empty' })
    expect(tree.trunk).toBe(true)
    expect(tree.fruit).toBe(0)
    expect(tree.yield).toEqual({ kind: 'pending' })

    tree.trunk = false
    tree.juvenile = 0.4
    w.seats[0].hand = { kind: 'hold', item: makeAxe() }
    const growPrompt = w.prompt(AT)
    expect(growPrompt.kind === 'intent' && growPrompt.intent.act === 'chop').toBe(false)
    expect(growPrompt).toEqual({ kind: 'blocked', text: treeLine(tree) })
    const woods = w.drops.filter(d => d.item.kind === 'wood').length
    const uses = w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'axe' ? w.seats[0].hand.item.usesLeft : 0
    w.enqueue({ act: 'chop', at: AT })
    drain(w)
    expect(tree.trunk).toBe(false)
    expect(w.drops.filter(d => d.item.kind === 'wood')).toHaveLength(woods)
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'axe' && w.seats[0].hand.item.usesLeft).toBe(uses)
    expect(w.seats[0].queue).toHaveLength(0)

    tree.trunk = true
    tree.juvenile = 0
    const trunkPrompt = w.prompt(AT)
    expect(trunkPrompt.kind === 'intent' && trunkPrompt.intent.act === 'chop').toBe(false)
    expect(trunkPrompt).toEqual({ kind: 'blocked', text: treeLine(tree) })
    w.enqueue({ act: 'chop', at: AT })
    drain(w)
    expect(tree.trunk).toBe(true)
    expect(w.drops.filter(d => d.item.kind === 'wood')).toHaveLength(woods)
    expect(w.seats[0].hand.kind === 'hold' && w.seats[0].hand.item.kind === 'axe' && w.seats[0].hand.item.usesLeft).toBe(uses)
    expect(w.seats[0].queue).toHaveLength(0)

    expect(AXES.axe.uses).toBe(30)
    expect(AXES.chainsaw).toEqual({ uses: 90, workSeconds: 3 })
    tree.trunk = false
    tree.juvenile = 1
    tree.fruit = 0.3
    w.seats[0].hand = { kind: 'hold', item: makeChainsaw() }
    w.enqueue({ act: 'chop', at: AT })
    w.tick(DT_MAX)
    expect(w.seats[0].workTotal).toBe(AXES.chainsaw.workSeconds)
    drain(w)
    expect(tree.trunk).toBe(true)
    expect(w.seats[0].hand).toEqual({
      kind: 'hold',
      item: { kind: 'chainsaw', usesLeft: AXES.chainsaw.uses - 1, workSeconds: AXES.chainsaw.workSeconds },
    })
  })
})

describe('trees', () => {
  test('Chop → trunk `juvenileSeconds` → sapling `juvenileSeconds` → pending. `trunk` required boolean. Stage `grow` is that sapling.', () => {
    const w = new World()
    const tree = plantTree(w, 1, 0.5, { kind: 'on', daysLeft: 1 })
    expect(tree.trunk).toBe(false)
    expect(tree.stage()).toBe('ripe')
    w.seats[0].hand = { kind: 'hold', item: makeAxe() }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.enqueue({ act: 'chop', at: AT })
    drain(w)
    expect(tree.trunk).toBe(true)
    expect(tree.juvenile).toBeGreaterThan(0)
    expect(tree.juvenile).toBeLessThan(1)
    expect(tree.fruit).toBe(0)
    expect(tree.yield).toEqual({ kind: 'pending' })
    expect(tree.stage()).toBe('trunk')
    const saved = dump(w)
    const cell = saved.chunks[0].cells[AT.row][AT.col]
    expect(cell.kind === 'tree' && cell.trunk).toBe(true)
    const round = parse(JSON.stringify(saved))
    expect(round.ok).toBe(true)
    if (round.ok) {
      const loaded = round.world.cell(AT)
      expect(loaded.kind === 'tree' && loaded.trunk).toBe(true)
    }

    const inc = DT_MAX / TREES.apple.juvenileSeconds
    tree.juvenile = 0
    w.tick(DT_MAX)
    expect(tree.trunk).toBe(true)
    expect(tree.juvenile).toBeCloseTo(inc, 8)
    expect(tree.fruit).toBe(0)
    expect(tree.stage()).toBe('trunk')
    tree.juvenile = 1 - inc / 2
    w.tick(DT_MAX)
    expect(tree.trunk).toBe(false)
    expect(tree.juvenile).toBe(0)
    expect(tree.yield).toEqual({ kind: 'pending' })
    expect(tree.fruit).toBe(0)
    expect(tree.stage()).toBe('grow')

    w.tick(DT_MAX)
    expect(tree.trunk).toBe(false)
    expect(tree.juvenile).toBeCloseTo(inc, 8)
    expect(tree.fruit).toBe(0)
    expect(tree.stage()).toBe('grow')
    tree.juvenile = 1 - inc / 2
    w.tick(DT_MAX)
    expect(tree.trunk).toBe(false)
    expect(tree.juvenile).toBe(1)
    expect(tree.yield).toEqual({ kind: 'pending' })
    expect(tree.fruit).toBe(0)
    expect(tree.stage()).toBe('unripe')
  })
})

describe('trees.drink', () => {
  test('trees.drink', () => {
    expect(CROPS.olive.waterUsePerSec).toBe(0.0015)
    expect(CROPS.apricot.waterUsePerSec).toBe(0.002333)
    expect(CROPS.cherry.waterUsePerSec).toBe(0.003167)
    expect(CROPS.apple.waterUsePerSec).toBe(0.00375)
    expect(TREE_FERT_PER_DAY.olive).toBe(0.09)
    expect(TREE_FERT_PER_DAY.apricot).toBe(0.12)
    expect(TREE_FERT_PER_DAY.cherry).toBe(0.165)
    expect(TREE_FERT_PER_DAY.apple).toBe(0.18)
    expect(statsOf('apple', 'base', 0, []).fertUsePerSec).toBeCloseTo(TREE_FERT_PER_DAY.apple / DAY_SECONDS, 12)
    expect(statsOf('carrot', 'base', 0, []).fertUsePerSec).not.toBe(statsOf('apple', 'base', 0, []).fertUsePerSec)
    const w = new World()
    const tree = plantTree(w, 0, 0, { kind: 'pending' })
    tree.trunk = true
    const st = statsOf('apple', 'base', 0, w.modifiers)
    const stages: { trunk: boolean; juvenile: number; y: Tree['yield'] }[] = [
      { trunk: true, juvenile: 0, y: { kind: 'pending' } },
      { trunk: false, juvenile: 0, y: { kind: 'pending' } },
      { trunk: false, juvenile: 1, y: { kind: 'pending' } },
      { trunk: false, juvenile: 1, y: { kind: 'on', daysLeft: 2 } },
      { trunk: false, juvenile: 1, y: { kind: 'off', chance: 0 } },
    ]
    stages.forEach(s => {
      tree.trunk = s.trunk
      tree.juvenile = s.juvenile
      tree.yield = s.y
      tree.soil.soak(TREE_WATER_MAX)
      tree.soil.feed(TREE_FERT_MAX)
      const water0 = tree.soil.water
      const fert0 = tree.soil.fertilizer
      w.tick(DT_MAX)
      expect(tree.soil.water).toBeCloseTo(water0 - st.waterUsePerSec * DT_MAX, 8)
      expect(tree.soil.fertilizer).toBeCloseTo(fert0 - st.fertUsePerSec * DT_MAX, 8)
    })
  })
})

describe('trees.happy', () => {
  test('trees.happy', () => {
    expect(TREE_HAPPY_GAIN_SECONDS).toBe(900)
    expect(TREE_HAPPY_START).toBe(0.33)
    expect(TREE_HAPPY_WILT_SECONDS).toBe(120)
    expect(TREE_HAPPY_STARVE_SECONDS).toBe(200)
    expect(TREE_HAPPY_DROWN_SECONDS).toBe(90)
    const w = new World()
    const tree = plantTree(w, 0, 0, { kind: 'pending' })
    tree.happiness = TREE_HAPPY_START
    const gain = DT_MAX / TREE_HAPPY_GAIN_SECONDS
    w.tick(DT_MAX)
    expect(tree.happiness).toBeCloseTo(TREE_HAPPY_START + gain + gain, 8)
    expect(tree.kind).toBe('tree')
    tree.happiness = 0
    tree.soil.starve(tree.soil.fertilizer)
    const j0 = tree.juvenile
    w.tick(DT_MAX)
    expect(tree.happiness).toBe(0)
    expect(w.cell(AT)).toBe(tree)
    expect(tree.juvenile).toBeGreaterThan(j0)
    tree.juvenile = 1
    tree.yield = { kind: 'on', daysLeft: 2 }
    tree.fruit = 0
    w.tick(DT_MAX)
    expect(tree.fruit).toBeGreaterThan(0)
    expect(w.cell(AT)).toBe(tree)
  })
})

describe('trees.chance', () => {
  test('trees.chance', () => {
    expect(happyBand(0)).toBe('red')
    expect(happyBand(0.24)).toBe('red')
    expect(happyBand(0.25)).toBe('orange')
    expect(happyBand(0.49)).toBe('orange')
    expect(happyBand(0.5)).toBe('green')
    expect(happyBand(1)).toBe('green')
    expect(TREE_OFF_CHANCE.red).toBe(0.1)
    expect(TREE_OFF_CHANCE.orange).toBe(0.15)
    expect(TREE_OFF_CHANCE.green).toBe(0.2)
    const w = new World()
    const tree = plantTree(w, 1, 0, { kind: 'off', chance: -10 })
    tree.happiness = 0
    w.clock.t = DAY_SECONDS - 0.001
    const d0 = w.clock.day
    for (let i = 0; i < 20 && w.clock.day === d0; i++) w.tick(DT_MAX)
    expect(tree.yield).toEqual({ kind: 'off', chance: -10 + TREE_OFF_CHANCE.red })
    tree.happiness = 0.3
    tree.yield = { kind: 'off', chance: -10 }
    w.clock.t = DAY_SECONDS - 0.001
    const d1 = w.clock.day
    for (let i = 0; i < 20 && w.clock.day === d1; i++) w.tick(DT_MAX)
    expect(tree.yield).toEqual({ kind: 'off', chance: -10 + TREE_OFF_CHANCE.orange })
    tree.happiness = 0.8
    tree.yield = { kind: 'off', chance: -10 }
    w.clock.t = DAY_SECONDS - 0.001
    const d2 = w.clock.day
    for (let i = 0; i < 20 && w.clock.day === d2; i++) w.tick(DT_MAX)
    expect(tree.yield).toEqual({ kind: 'off', chance: -10 + TREE_OFF_CHANCE.green })
    tree.happiness = 0.4
    tree.yield = { kind: 'on', daysLeft: 1 }
    w.clock.t = DAY_SECONDS - 0.001
    const d3 = w.clock.day
    for (let i = 0; i < 20 && w.clock.day === d3; i++) w.tick(DT_MAX)
    expect(tree.yield).toEqual({ kind: 'off', chance: -0.25 + tree.happiness * 0.1 })
  })
})

describe('trees.wild', () => {
  test('trees.wild', () => {
    const w = new World(1)
    let found: Tree | undefined
    w.forEachCell((at, c) => {
      if (c.kind === 'tree' && at.col === c.base.col && at.row === c.base.row) found = c
    })
    expect(found).toBeDefined()
    if (found === undefined) return
    expect(found.species).toBe('apple')
    expect(found.juvenile).toBe(0)
    expect(found.tended).toBe(false)
    expect(found.trunk).toBe(false)
    expect(found.variety).toBe('base')
    expect(found.happiness).toBe(TREE_HAPPY_START)
    expect(found.soil.water).toBe(TREE_WATER_MID)
    expect(found.soil.waterMax).toBe(TREE_WATER_MAX)
    expect(found.soil.waterMid).toBe(TREE_WATER_MID)
    expect(found.soil.fertMax).toBe(TREE_FERT_MAX)
    expect(found.soil.fertilizer).toBeCloseTo(goodness(w.rng, found.base.col, found.base.row) * TREE_FERT_MAX, 10)
    const saved = dump(w)
    const cell = saved.chunks[0].cells[found.base.row][found.base.col]
    expect(cell.kind === 'tree' && cell.happiness).toBe(TREE_HAPPY_START)
    expect(cell.kind === 'tree' && cell.soil.water).toBe(TREE_WATER_MID)
  })
})

describe('water.pour', () => {
  test('water.pour', () => {
    const w = new World()
    const tree = plantTree(w, 1, 0, { kind: 'pending' })
    tree.soil.drink(TREE_WATER_MAX)
    const st = statsOf('apple', 'base', 0, w.modifiers)
    const target = TREE_WATER_MID + st.waterTolerance
    w.seats[0].hand = { kind: 'hold', item: makeContainer('bucket', 20) }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    expect(canWater(w, AT)).toBe(true)
    expect(canWater(w, { col: AT.col, row: AT.row + 1 })).toBe(true)
    w.enqueue({ act: 'water', at: AT })
    drain(w)
    expect(tree.soil.water).toBeCloseTo(target - st.waterUsePerSec * DT_MAX, 8)
  })
})

describe('water.targets', () => {
  test('water.targets', () => {
    const w = new World()
    w.done.add('unlock-irrigation')
    w.done.add('unlock-auto-irrigation')
    w.money = 999
    const tree = plantTree(w, 1, 0, { kind: 'pending' })
    const v = { col: AT.col + 1, row: AT.row + 1 }
    w.buy('buy-sprinkler')
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    const s = w.sprinklerAt(v)
    expect(s).toBeDefined()
    if (s === undefined) return
    const hits = sprinklerTargets(w, s)
    expect(hits).toEqual([{ col: tree.base.col, row: tree.base.row }])
    w.setCell({ col: AT.col, row: AT.row + 1 }, tree)
    expect(sprinklerTargets(w, s)).toHaveLength(1)
  })
})
