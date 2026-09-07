import { describe, expect, test } from 'vitest'
import { HAPPY_MAX } from '../defs/crops.ts'
import { Plant } from '../sim/plant.ts'
import { Soil, SOIL_WATER_MID, WEED_CHANCE } from '../sim/soil.ts'
import { World } from '../sim/world.ts'
import { doneRows, groupNotices, noticeRows, passOf, NOTICE_ORDER, type Notice } from './notices.ts'

const AT = { col: 10, row: 12 }

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
  return new Soil(water, fertilizer, WEED_CHANCE)
}

function kinds(rows: readonly Notice[]): string[] {
  return rows.map(r => r.kind)
}

describe('notices.pure', () => {
  test('noticeRows(world) reads World and writes nothing', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    const before = {
      money: w.money,
      points: w.points,
      grow: w.grow.size,
      day: w.clock.day,
      t: w.clock.t,
      job: w.job.kind,
      active: w.contracts.active.length,
      cell: w.cell(AT).kind,
    }
    let pinged = 0
    const off = w.on(() => {
      pinged += 1
    })
    noticeRows(w)
    noticeRows(w)
    off()
    expect(pinged).toBe(0)
    expect({
      money: w.money,
      points: w.points,
      grow: w.grow.size,
      day: w.clock.day,
      t: w.clock.t,
      job: w.job.kind,
      active: w.contracts.active.length,
      cell: w.cell(AT).kind,
    }).toEqual(before)
  })
})

describe('notices.red', () => {
  test('only a red band is a notice. Orange is not.', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    expect(kinds(noticeRows(w))).toContain('wilting')

    const mid = new World()
    mid.setCell(AT, { kind: 'growing', soil: bed(SOIL_WATER_MID), plant: new Plant('carrot', 'base', 0) })
    expect(kinds(noticeRows(mid))).not.toContain('wilting')
  })

  test('drowning splits off wilting on the wet side of red', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(2), plant: new Plant('carrot', 'base', 0) })
    const rows = noticeRows(w)
    expect(kinds(rows)).toContain('drowning')
    expect(kinds(rows)).not.toContain('wilting')
  })

  test('a red fertilizer band is starving, and carries the happiness clock', () => {
    const w = new World()
    const p = new Plant('carrot', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(SOIL_WATER_MID, 0), plant: p })
    const row = noticeRows(w).find(r => r.kind === 'starving')
    expect(row).toBeDefined()
    expect(row?.bar).toBe(p.happiness / HAPPY_MAX)
    expect(row?.cells).toEqual([AT])
  })

  test('dead and rotten cells are notices with no bar', () => {
    const w = new World()
    w.setCell(AT, { kind: 'dead', soil: bed(), plant: new Plant('carrot', 'base', 0) })
    w.setCell({ col: 10, row: 13 }, { kind: 'rotten', soil: bed(), crop: 'carrot' })
    const rows = noticeRows(w)
    expect(kinds(rows)).toContain('dead')
    expect(kinds(rows)).toContain('rotten')
    rows
      .filter(r => r.kind === 'dead' || r.kind === 'rotten')
      .forEach(r => {
        expect(r.bar).toBeUndefined()
      })
  })
})

describe('notices.once', () => {
  test('a contract gone from active with a done outcome mints a completed row', () => {
    const w = new World()
    w.contracts.history.push({
      id: 7,
      company: 'whole-cart',
      stars: 1,
      day: 1,
      outcome: { kind: 'done', paid: 10, prize: { kind: 'cash' } },
    })
    const rows = doneRows(w, { activeIds: [7], running: undefined })
    expect(kinds(rows)).toEqual(['contract-done'])
    expect(rows[0].bar).toBeUndefined()
  })

  test('a contract gone from active with a missed outcome mints nothing', () => {
    const w = new World()
    w.contracts.history.push({
      id: 7,
      company: 'whole-cart',
      stars: 1,
      day: 1,
      outcome: { kind: 'missed', sold: 0, penalty: 5 },
    })
    expect(doneRows(w, { activeIds: [7], running: undefined })).toEqual([])
  })

  test('a run that stopped with its id in done mints a research row', () => {
    const w = new World()
    w.done.add('unlock-fertilizer')
    const rows = doneRows(w, { activeIds: [], running: 'unlock-fertilizer' })
    expect(kinds(rows)).toEqual(['research-done'])
  })

  test('a run still running mints nothing', () => {
    const w = new World()
    w.job = { kind: 'run', id: 'unlock-fertilizer', left: 5 }
    w.done.add('unlock-fertilizer')
    expect(doneRows(w, passOf(w))).toEqual([])
  })
})

describe('notices.group', () => {
  test('rows of one kind are one block, in NOTICE_ORDER', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    w.setCell({ col: 10, row: 13 }, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    w.points = 2
    const blocks = groupNotices(noticeRows(w))
    const wilting = blocks.find(b => b.kind === 'wilting')
    expect(wilting?.rows.length).toBe(2)
    expect(blocks.filter(b => b.kind === 'wilting').length).toBe(1)
    const order = blocks.map(b => NOTICE_ORDER.indexOf(b.kind))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  test('a row id is stable across passes for the same condition on the same plot', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    const first = noticeRows(w).map(r => r.id)
    const second = noticeRows(w).map(r => r.id)
    expect(second).toEqual(first)
  })
})

describe('standing rows', () => {
  test('skill points and expansion show only above zero, and click through', () => {
    const w = new World()
    expect(kinds(noticeRows(w))).not.toContain('points')
    w.points = 3
    const row = noticeRows(w).find(r => r.kind === 'points')
    expect(row?.go).toBe('family')
    expect(row?.bar).toBeUndefined()
  })
})
