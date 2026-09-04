import { describe, expect, test } from 'vitest'
import { AXES } from '../defs/items.ts'
import { TREES } from '../defs/trees.ts'
import { Tree, frontOf } from './building.ts'
import { makeAxe } from './item.ts'
import { treeLine } from './prompt.ts'
import { bare } from './plot.ts'
import { dump, parse } from './save.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function plantTree(w: World, juvenile = 1, fruit = 0, y: Tree['yield'] = { kind: 'pending' }): Tree {
  const below = { col: AT.col, row: AT.row + 1 }
  const tree = new Tree('apple', { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 2 }, juvenile, fruit, y)
  w.setCell(AT, tree)
  w.setCell(below, tree)
  ;[AT, below].forEach(origin => {
    frontOf(origin).forEach(p => {
      if (!w.inWorld(p)) return
      if (w.cell(p).kind === 'tree') return
      w.setCell(p, bare('soft'))
    })
  })
  return tree
}

function drain(w: World): void {
  while (w.seats[0].queue.length > 0) {
    if (w.seam.kind === 'recap') w.dismissRecap()
    w.tick(DT_MAX)
  }
}

describe('trees', () => {
  test('Axe, mature not trunk, `AXES.axe.workSeconds`, `AXES.axe.uses`, 1 wood, fruit progress lost.', () => {
    const w = new World()
    const tree = plantTree(w, 1, 0.6, { kind: 'on', daysLeft: 2 })
    tree.tended = true
    const stay = { col: AT.col + 1, row: AT.row }
    w.setCell(stay, bare('soft'))
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
  })

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
