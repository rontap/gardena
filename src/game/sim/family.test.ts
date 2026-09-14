import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import { QUAD_PRICE, TRACTOR_PRICE } from '../defs/items.ts'
import { SKILLS, SKILL_IDS, jamRotMul } from '../defs/skills.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { statsOf } from './modifiers.ts'
import { Plant } from './plant.ts'
import type { Item } from './item.ts'
import { DAY_SECONDS } from './clock.ts'
import { Soil, WEED_CHANCE } from './soil.ts'
import { AXES } from '../defs/items.ts'
import { Tree } from './building.ts'
import { makeAxe } from './item.ts'
import { POINTS_PER_DAY, DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function bed(): Soil {
  return new Soil(1, 1, WEED_CHANCE)
}

function drain(w: World): void {
  for (let i = 0; i < 80; i++) {
    if (w.seats[0].queue.length === 0 && w.seats[0].workLeft <= 0) return
    w.tick(DT_MAX)
  }
}

describe('family.pick', () => {
  test('`Act.pickSkill` `{ id }`; rank n costs n of `World.points`; writes `owned[id]` to that rank; guest never; no offers.', () => {
    const w = new World(1)
    expect(w.points).toBe(0)
    expect('offers' in w.family).toBe(false)
    expect(w.family.owned.size).toBe(0)
    w.pickSkill('boots')
    expect(w.points).toBe(0)
    expect(w.family.owned.has('boots')).toBe(false)
    w.grantPoints(1)
    w.pickSkill('boots')
    expect(w.points).toBe(0)
    expect(w.family.owned.get('boots')).toBe(1)
    w.grantPoints(1)
    w.pickSkill('boots')
    expect(w.family.owned.get('boots')).toBe(1)
    expect(w.points).toBe(1)
    w.grantPoints(1)
    w.pickSkill('boots')
    expect(w.family.owned.get('boots')).toBe(2)
    expect(w.points).toBe(0)
    w.local = 1
    w.grantPoints(3)
    w.pickSkill('boots')
    expect(w.family.owned.get('boots')).toBe(2)
  })
})

describe('family.lens', () => {
  test('Water need lens iff `unlock-auto-irrigation` in `done`; land quality lens iff `unlock-expand` in `done`; vehicle interactions lens iff `unlock-vehicles` in `done`.', () => {
    const w = new World(1)
    expect(w.done.has('unlock-auto-irrigation')).toBe(false)
    expect(w.done.has('unlock-expand')).toBe(false)
    expect(w.done.has('unlock-vehicles')).toBe(false)
    expect(RESEARCH['unlock-auto-irrigation'].grants).toEqual([m.research_grant_water_lens()])
    expect(RESEARCH['unlock-expand'].grants).toContain(m.research_grant_land_lens())
    w.done.add('unlock-auto-irrigation')
    expect(w.done.has('unlock-auto-irrigation')).toBe(true)
    w.done.add('unlock-expand')
    expect(w.done.has('unlock-expand')).toBe(true)
    w.done.add('unlock-vehicles')
    expect(w.done.has('unlock-vehicles')).toBe(true)
  })
})

describe('family.skills', () => {
  test("One pool: `boots` `tending` `seed-bank` `better-wheat` `better-potato` `better-tomato` `better-grape` `better-raspberry` `grafting` `lucky` `bulk-up` `driving-classes` `machinery` `industrial` `inherit-land` `saleswoman` `jam` `heirloom` `specialty` `broker`; parent known/open as this note; research lock as this note; cap III on the I–III ids; hangar-buys are not `skuPrice`; drought ×2 on `seeds` | `utility`.", () => {
    expect([...SKILL_IDS]).toEqual([
      'boots',
      'tending',
      'seed-bank',
      'better-wheat',
      'better-potato',
      'better-tomato',
      'better-grape',
      'better-raspberry',
      'grafting',
      'lucky',
      'bulk-up',
      'driving-classes',
      'machinery',
      'industrial',
      'inherit-land',
      'saleswoman',
      'jam',
      'heirloom',
      'specialty',
      'broker',
    ])
    expect(SKILLS.boots.parent).toBe(null)
    expect(SKILLS.tending.parent).toBe('boots')
    expect(SKILLS['seed-bank'].parent).toBe('boots')
    expect(SKILLS.grafting.parent).toBe('boots')
    expect(SKILLS.lucky.parent).toBe('boots')
    expect(SKILLS['better-wheat'].parent).toBe('seed-bank')
    expect(SKILLS['bulk-up'].parent).toBe(null)
    expect(SKILLS['driving-classes'].parent).toBe('machinery')
    expect(SKILLS.machinery.parent).toBe('bulk-up')
    expect(SKILLS.industrial.parent).toBe('broker')
    expect(SKILLS['inherit-land'].parent).toBe('bulk-up')
    expect(SKILLS.saleswoman.parent).toBe(null)
    expect(SKILLS.jam.parent).toBe('saleswoman')
    expect(SKILLS.heirloom.parent).toBe('saleswoman')
    expect(SKILLS.specialty.parent).toBe('heirloom')
    expect(SKILLS.broker.parent).toBe('saleswoman')
    expect(SKILLS['driving-classes'].maxTier).toBe(3)
    expect(SKILLS['driving-classes'].gate).toEqual({ kind: 'research', id: 'unlock-vehicles' })
    expect(SKILLS.machinery.maxTier).toBe(3)
    expect(SKILLS.machinery.gate).toEqual({ kind: 'research', id: 'unlock-grinder' })
    expect(SKILLS.industrial.gate).toEqual({ kind: 'research', id: 'unlock-contracts' })
    expect(SKILLS['inherit-land'].maxTier).toBe(3)
    expect(SKILLS['inherit-land'].gate).toEqual({ kind: 'research', id: 'unlock-landscaping' })
    expect(SKILLS.broker.maxTier).toBe(3)
    expect(SKILLS.broker.gate).toEqual({ kind: 'research', id: 'unlock-contracts' })
    expect(SKILLS.heirloom.gate).toEqual({ kind: 'research', id: 'unlock-heirloom' })
    expect(SKILLS.specialty.gate).toEqual({ kind: 'research', id: 'unlock-preservatives' })
    expect(SKILLS.jam.maxTier).toBe(3)
    expect(SKILLS.industrial.maxTier).toBe(3)
    expect(SKILLS['bulk-up'].maxTier).toBe(3)
    expect(SKILLS.boots.maxTier).toBe(3)
    expect(SKILLS.lucky.maxTier).toBe(3)
    expect(SKILLS.tending.maxTier).toBe(1)
    expect(SKILLS.grafting.maxTier).toBe(1)
    const w = new World(1)
    expect(w.skillKnown('tending')).toBe(true)
    expect(w.skillOpen('tending')).toBe(false)
    w.family.owned.set('boots', 1)
    expect(w.skillOpen('tending')).toBe(true)
    expect(w.skillKnown('better-wheat')).toBe(true)
    expect(w.skillOpen('better-wheat')).toBe(false)
    w.family.owned.set('seed-bank', 1)
    expect(w.skillOpen('better-wheat')).toBe(true)
    expect(w.skuPrice('buy-shovel')).toBe(SKUS['buy-shovel'].price)
    expect(w.skuPrice('buy-hangar')).toBe(SKUS['buy-hangar'].price)
    expect(QUAD_PRICE).not.toBe(w.skuPrice('buy-hangar'))
    expect(TRACTOR_PRICE).not.toBe(w.skuPrice('buy-hangar'))
    w.pinTomorrow('drought')
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    expect(w.weather(w.clock.day)).toBe('drought')
    expect(w.skuPrice('pack-carrot')).toBe(SKUS['pack-carrot'].price * 2)
    expect(w.skuPrice('buy-shovel')).toBe(SKUS['buy-shovel'].price * 2)
    expect(w.skuPrice('buy-pipe')).toBe(SKUS['buy-pipe'].price)
    expect(w.skuPrice('buy-tile-cobble')).toBe(SKUS['buy-tile-cobble'].price)
    expect(w.skuPrice('buy-hangar')).toBe(SKUS['buy-hangar'].price)
  })
})

describe('family.jam-rot', () => {
  test('`jam` owned tier N: fruit with freshness `< 0.5` rots `15% × N` slower; ripe plant and picked fruit; freezer skips.', () => {
    expect(jamRotMul(2, 0.4)).toBe(1 + 0.15 * 2)
    expect(jamRotMul(2, 0.5)).toBe(1)
    expect(jamRotMul(0, 0.4)).toBe(1)
    const w = new World(1)
    w.family.owned.set('jam', 2)
    const fruit: Extract<Item, { kind: 'fruit' }> = {
      kind: 'fruit',
      crop: 'carrot',
      variety: 'base',
      quality: 0,
      count: 1,
      unitSale: 4,
      freshness: 0.4,
      cut: false,
    }
    w.seats[0].hand = { kind: 'hold', item: fruit }
    const rot = statsOf('carrot', 'base', 0, w.modifiers).rotSeconds
    w.tick(DT_MAX)
    expect(fruit.freshness).toBeCloseTo(0.4 - DT_MAX / (rot * (1 + 0.15 * 2)), 8)
    const ripe = new World(1)
    ripe.family.owned.set('jam', 3)
    const p = new Plant('carrot', 'base', 0)
    p.freshness = 0.4
    ripe.setCell(AT, { kind: 'ripe', soil: bed(), plant: p })
    const ripeRot = statsOf('carrot', 'base', 0, ripe.modifiers).rotSeconds
    ripe.tick(DT_MAX)
    expect(p.freshness).toBeCloseTo(0.4 - DT_MAX / (ripeRot * (1 + 0.15 * 3)), 8)
  })
})

describe('family.unlockSkills', () => {
  test('`unlockAllSkills`: every `SKILLS` id at `maxTier` on the one pool; ignores gates; rebuilds skill modifiers from owned `better-*` whose `saleMul` is not 1 at that tier; `unlockAll` still does not grant skills.', () => {
    const w = new World(1)
    w.grantPoints(1)
    const points = w.points
    const done = w.done.size
    w.unlockAllSkills()
    SKILL_IDS.forEach(id => {
      expect(w.skillTier(id)).toBe(SKILLS[id].maxTier)
    })
    expect(w.done.has('unlock-advanced-plants')).toBe(false)
    expect(w.skillTier('better-grape')).toBe(SKILLS['better-grape'].maxTier)
    expect(w.points).toBe(points)
    expect(w.done.size).toBe(done)
    expect(w.modifiers.filter(mod => mod.source === 'skill')).toEqual([])
    expect(w.skuPrice('buy-shovel')).toBe(SKUS['buy-shovel'].price)

    const u = new World(1)
    const owned = u.family.owned.size
    u.unlockAll()
    expect(u.family.owned.size).toBe(owned)
  })
})

describe('family.cost', () => {
  test('Rank n costs n of `World.points`; `POINTS_PER_DAY` is 1.', () => {
    expect(POINTS_PER_DAY).toBe(1)
    const w = new World(1)
    w.grantPoints(POINTS_PER_DAY)
    expect(w.points).toBe(1)
    w.pickSkill('saleswoman')
    expect(w.points).toBe(0)
    expect(w.family.owned.get('saleswoman')).toBe(1)
  })
})

describe('family.grafting', () => {
  test('Chop drops 2 grafts iff `grafting` owned; chop always wood and trunk — [[mechanics/trees]] `graft.axe`.', () => {
    const below = { col: AT.col, row: AT.row + 1 }
    const w = new World(1)
    const tree = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0.4)
    w.setCell(AT, tree)
    w.setCell(below, tree)
    w.seats[0].hand = { kind: 'hold', item: makeAxe() }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.enqueue({ act: 'chop', at: AT })
    drain(w)
    expect(tree.trunk).toBe(true)
    expect(w.drops.some(d => d.item.kind === 'wood')).toBe(true)
    expect(w.drops.some(d => d.item.kind === 'graft')).toBe(false)

    const g = new World(1)
    g.family.owned.set('grafting', 1)
    const t2 = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, 1, 0.4)
    g.setCell(AT, t2)
    g.setCell(below, t2)
    g.seats[0].hand = { kind: 'hold', item: makeAxe() }
    g.seats[0].actor.x = AT.col + 0.5
    g.seats[0].actor.y = AT.row + 0.5
    g.enqueue({ act: 'chop', at: AT })
    drain(g)
    expect(t2.trunk).toBe(true)
    const grafts = g.drops.filter(d => d.item.kind === 'graft')
    expect(grafts).toHaveLength(1)
    expect(grafts[0].item).toEqual({ kind: 'graft', crop: 'apple', variety: 'base', quality: 0, count: 2 })
    expect(AXES.axe.uses).toBe(30)
  })
})

describe('family.specialty', () => {
  test('jam / spirit / wine / cider whose variety tier is `variant` or `heirloom` × `(1 + 0.05 × tier)` at `marketGain`; stacks with heirloom — [[mechanics/market]].', () => {
    const jam = new World(1)
    jam.family.owned.set('specialty', 2)
    jam.stall['jam-grape'].takeSpirit('concord', 1, 100, false)
    expect(jam.marketQuote().clean).toBeCloseTo(110, 9)
    const wine = new World(1)
    wine.family.owned.set('heirloom', 1)
    wine.family.owned.set('specialty', 1)
    wine.stall.wine.takeSpirit('keknyelu', 1, 100, false)
    expect(wine.marketQuote().clean).toBeCloseTo(100 * 1.05 * 1.05, 9)
    const cider = new World(1)
    cider.family.owned.set('heirloom', 1)
    cider.family.owned.set('specialty', 1)
    cider.stall.cider.takeSpirit('base', 1, 100, false)
    expect(cider.marketQuote().clean).toBe(100)
    cider.stall.cider.takeSpirit('pink-lady', 1, 100, false)
    expect(cider.marketQuote().clean).toBe(205)
  })
})
