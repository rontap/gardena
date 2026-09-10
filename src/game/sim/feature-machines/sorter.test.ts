// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { SORT_LEN, SORT_SECONDS } from '../../defs/items.ts'
import { Chest, Sorter, sorterBase, sorterCells, type Coord, type Facing } from '../building.ts'
import { padDropCells, padTakeCells } from '../feature-vehicles/vehicle.ts'
import { bare } from '../plot.ts'
import { DT_MAX, World } from '../world.ts'
import type { Item } from '../item.ts'
import { dump, parse } from '../feature-save/save.ts'

const AT = { col: 10, row: 20 }

function ready(): World {
  const w = new World(1)
  w.unlockAll()
  w.money = 9999
  for (let row = -3; row <= 5; row++) {
    for (let col = -3; col <= 5; col++) w.setCell({ col: AT.col + col, row: AT.row + row }, bare('soft', 0))
  }
  w.drops.length = 0
  return w
}

function build(w: World, facing: Facing): Sorter {
  w.buy('buy-sorter')
  let guard = 0
  while (guard < 8) {
    const place = w.seats[0].place
    if (place.kind === 'sku' && place.id === 'buy-sorter' && place.facing === facing) break
    w.rotatePlace()
    guard += 1
  }
  w.confirmPlace(AT)
  const c = w.cell(AT)
  if (c.kind !== 'sorter') throw new Error('sorter')
  return c
}

function chestAt(w: World, at: Coord): Chest {
  const made = new Chest({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 })
  w.setCell(at, made)
  return made
}

function seeds(variety: 'base' | 'green-zebra' | 'san-marzano', count = 4): Item {
  return { kind: 'seeds', crop: 'tomato', variety, quality: 0, count }
}

function ticks(w: World, seconds: number): void {
  const n = Math.ceil(seconds / DT_MAX) + 1
  for (let i = 0; i < n; i++) w.tick(DT_MAX)
}

function outCells(c: Sorter): Coord[] {
  return c.storePorts().flatMap(p => (p.role === 'out' ? [p.at] : []))
}

function inCell(c: Sorter): Coord {
  const at = c.storePorts().find(p => p.role === 'in')?.at
  if (at === undefined) throw new Error('in')
  return at
}

describe('sorter.foot', () => {
  test('sorter.foot - The Variety sorter is one cell wide and SORT_LEN long, rotates through four facings, and carries the same instance on every cell. Facing turns the long side: e and w stand it upright, n and s lay it flat.', () => {
    const upright = sorterBase(AT, 'e')
    expect([upright.w, upright.h]).toEqual([1, SORT_LEN])
    const flat = sorterBase(AT, 'n')
    expect([flat.w, flat.h]).toEqual([SORT_LEN, 1])
    const w = ready()
    const c = build(w, 's')
    expect(c.facing).toBe('s')
    expect(sorterCells(c.base)).toHaveLength(SORT_LEN)
    sorterCells(c.base).forEach(p => {
      expect(w.cell(p)).toBe(c)
    })
  })
})

describe('sorter.ports', () => {
  test('sorter.ports - One input port sits beside the middle cell, three output ports beside each cell on the far side, in Plain, Named, Heirloom order along the footprint. The vehicle pads are those same cells, not the north and south edges.', () => {
    const w = ready()
    const c = build(w, 'e')
    expect(inCell(c)).toEqual({ col: AT.col - 1, row: AT.row + 1 })
    expect(outCells(c)).toEqual([
      { col: AT.col + 1, row: AT.row },
      { col: AT.col + 1, row: AT.row + 1 },
      { col: AT.col + 1, row: AT.row + 2 },
    ])
    expect(padDropCells(c)).toEqual([inCell(c)])
    expect(padTakeCells(c)).toEqual(outCells(c))
  })
})

describe('sorter.route', () => {
  test('sorter.route - A seed or fruit pulled from the chest on the input side leaves on the side its Variety tier owns, one item every SORT_SECONDS. A chest on that side takes it.', () => {
    const w = ready()
    const c = build(w, 'e')
    const feed = chestAt(w, inCell(c))
    const outs = outCells(c).map(p => chestAt(w, p))
    feed.slots[0] = { kind: 'hold', item: seeds('san-marzano') }
    feed.slots[1] = { kind: 'hold', item: seeds('green-zebra') }
    feed.slots[2] = { kind: 'hold', item: seeds('base') }
    ticks(w, SORT_SECONDS * 6)
    const held = outs.map(o => o.slots.flatMap(s => (s.kind === 'hold' ? [s.item] : [])))
    expect(held[0].map(i => i.kind === 'seeds' && i.variety)).toEqual(['base'])
    expect(held[1].map(i => i.kind === 'seeds' && i.variety)).toEqual(['green-zebra'])
    expect(held[2].map(i => i.kind === 'seeds' && i.variety)).toEqual(['san-marzano'])
    expect(feed.slots.every(s => s.kind === 'empty')).toBe(true)
  })
})

describe('sorter.ground', () => {
  test('sorter.ground - An output side with no chest drops on that side of its own cell, so the three tiers never land on one pile. It never walks the footprint ring.', () => {
    const w = ready()
    const c = build(w, 'e')
    const feed = chestAt(w, inCell(c))
    feed.slots[0] = { kind: 'hold', item: seeds('san-marzano') }
    ticks(w, SORT_SECONDS * 3)
    const heirloom = outCells(c)[2]
    expect(w.drops.map(d => ({ col: d.at.col, row: d.at.row }))).toEqual([heirloom])
  })
})

describe('sorter.skip', () => {
  test('sorter.skip - A full chest on one side stops that tier only. The sorter never takes in what it cannot put down, so the other two keep moving and nothing is destroyed.', () => {
    const w = ready()
    const c = build(w, 'e')
    const feed = chestAt(w, inCell(c))
    const outs = outCells(c).map(p => chestAt(w, p))
    outs[2].slots.forEach((_, i) => {
      outs[2].slots[i] = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    })
    feed.slots[0] = { kind: 'hold', item: seeds('san-marzano') }
    feed.slots[1] = { kind: 'hold', item: seeds('base') }
    ticks(w, SORT_SECONDS * 6)
    expect(outs[0].slots.filter(s => s.kind === 'hold')).toHaveLength(1)
    const left = feed.slots.flatMap(s => (s.kind === 'hold' ? [s.item] : []))
    expect(left).toHaveLength(1)
    expect(left[0].kind === 'seeds' && left[0].variety).toBe('san-marzano')
    expect(c.held).toBe('none')
  })
})

describe('sorter.takes', () => {
  test('sorter.takes - Seeds, tree seeds, fruit and grafts carry a Variety and sort. Everything else is refused at the input, and a busy sorter refuses a second item.', () => {
    const w = ready()
    const c = build(w, 'e')
    expect(c.accept(seeds('base'))).toBe(1)
    expect(c.accept({ kind: 'tree-seed', tree: 'apple', variety: 'base', quality: 0 })).toBe(1)
    expect(c.accept({ kind: 'graft', crop: 'apple', variety: 'pink-lady', quality: 0, count: 1 })).toBe(1)
    expect(c.accept({ kind: 'wood', count: 1 })).toBe(0)
    expect(c.accept({ kind: 'flour', quality: 0, count: 1, unitSale: 1 })).toBe(0)
    c.apply(seeds('base'), 1)
    expect(c.accept(seeds('base'))).toBe(0)
  })
})

describe('sorter.save', () => {
  test('sorter.save - A save keeps the footprint, the facing, the item mid-sort and the progress. Reloading puts the same instance back on all three cells.', () => {
    const w = ready()
    const c = build(w, 'w')
    c.held = seeds('green-zebra')
    c.progress = 0.5
    const loaded = parse(JSON.stringify(dump(w)))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    const back = loaded.world.cell(AT)
    if (back.kind !== 'sorter') throw new Error('sorter')
    expect(back.facing).toBe('w')
    expect(back.progress).toBe(0.5)
    expect(back.held !== 'none' && back.held.kind === 'seeds' && back.held.variety).toBe('green-zebra')
    sorterCells(back.base).forEach(p => {
      expect(loaded.world.cell(p)).toBe(back)
    })
  })
})

describe('sorter.demolish', () => {
  test('sorter.demolish - Demolishing clears every cell of the footprint back to bare ground and drops what the machine was holding at the origin.', () => {
    const w = ready()
    const c = build(w, 'e')
    c.held = seeds('base')
    const cells = sorterCells(c.base)
    w.armDelete()
    w.click(AT)
    cells.forEach(p => {
      expect(w.cell(p).kind).toBe('untilled')
    })
    expect(w.drops).toHaveLength(1)
    expect(w.drops[0].item.kind).toBe('seeds')
  })
})
