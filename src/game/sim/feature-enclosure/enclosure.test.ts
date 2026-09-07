import { describe, expect, test } from 'vitest'
import { DT_MAX, World } from '../world.ts'
import { bare } from '../plot.ts'
import * as enclosure from './enclosure.ts'

const O = { col: 4, row: 18 }

function k(at: { col: number; row: number }): string {
  return `${at.col},${at.row}`
}

function clear(w: World, col0: number, row0: number, n: number): void {
  for (let row = row0; row < row0 + n; row++) {
    for (let col = col0; col < col0 + n; col++) {
      w.setCell({ col, row }, bare('soft', 0))
    }
  }
}

function armFence(w: World): void {
  w.done.add('unlock-landscaping')
  w.money = 999
  w.buy('buy-fence')
}

function lay(w: World, cells: { col: number; row: number }[]): void {
  armFence(w)
  cells.forEach(at => w.confirmPlace(at))
}

function ring3(c: number, r: number): { col: number; row: number }[] {
  return [-1, 0, 1].flatMap(dr =>
    [-1, 0, 1].filter(dc => dc !== 0 || dr !== 0).map(dc => ({ col: c + dc, row: r + dr })),
  )
}

describe('enclosure.close', () => {
  test('a 3×3 fence ring around one owned cell yields one enclosure; that interior; eight fence cells (corners included).', () => {
    const w = new World(1)
    const hole = { col: O.col + 1, row: O.row + 1 }
    clear(w, O.col, O.row, 3)
    const fences = ring3(hole.col, hole.row)
    lay(w, fences)
    expect(w.enclosures.size).toBe(1)
    const enc = [...w.enclosures.values()][0]
    expect(enc.interior).toEqual([hole])
    expect(enc.fences).toHaveLength(8)
    expect(new Set(enc.fences.map(k))).toEqual(new Set(fences.map(k)))
    expect(w.plotEnclosures.get(k(hole))).toEqual([enc.id])
    fences.forEach(at => expect(w.fenceEnclosures.get(k(at))).toEqual([enc.id]))
    expect(enclosure.lookup(w, fences[0])).toEqual([hole])
  })
})

describe('enclosure.leak', () => {
  test('one orthogonal gap → zero enclosures. One diagonal gap → zero enclosures.', () => {
    const hole = { col: O.col + 1, row: O.row + 1 }
    const closed = ring3(hole.col, hole.row)
    const ortho = new World(1)
    clear(ortho, O.col, O.row, 3)
    lay(
      ortho,
      closed.filter(at => at.col !== hole.col || at.row !== hole.row + 1),
    )
    expect(ortho.enclosures.size).toBe(0)
    expect(ortho.fenceEnclosures.size).toBe(0)
    expect(ortho.plotEnclosures.size).toBe(0)
    const diag = new World(1)
    clear(diag, O.col, O.row, 3)
    lay(
      diag,
      closed.filter(at => at.col !== hole.col + 1 || at.row !== hole.row + 1),
    )
    expect(diag.enclosures.size).toBe(0)
    expect(diag.fenceEnclosures.size).toBe(0)
    expect(diag.plotEnclosures.size).toBe(0)
  })
})

describe('enclosure.grid', () => {
  test('the plus in a 2×2 of rooms is in four `fenceEnclosures`.', () => {
    const w = new World(1)
    clear(w, O.col, O.row, 5)
    const fences: { col: number; row: number }[] = []
    for (let dr = 0; dr < 5; dr++) {
      for (let dc = 0; dc < 5; dc++) {
        if (dr % 2 !== 0 && dc % 2 !== 0) continue
        fences.push({ col: O.col + dc, row: O.row + dr })
      }
    }
    lay(w, fences)
    expect(w.enclosures.size).toBe(4)
    const plus = { col: O.col + 2, row: O.row + 2 }
    const ids = w.fenceEnclosures.get(k(plus))
    expect(ids).toBeDefined()
    expect(ids).toHaveLength(4)
    expect(new Set(ids)).toEqual(new Set(w.enclosures.keys()))
    const corner = w.fenceEnclosures.get(k(O))
    expect(corner).toHaveLength(1)
    expect(enclosure.lookup(w, plus)).toHaveLength(4)
  })
})

describe('enclosure.nest', () => {
  test('inner-ring fence is in donut and hole; outer-ring fence is in donut only.', () => {
    const w = new World(1)
    clear(w, O.col, O.row, 7)
    const fences: { col: number; row: number }[] = []
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const outer = dr === 0 || dr === 6 || dc === 0 || dc === 6
        const inner = Math.max(Math.abs(dc - 3), Math.abs(dr - 3)) === 1
        if (!outer && !inner) continue
        fences.push({ col: O.col + dc, row: O.row + dr })
      }
    }
    lay(w, fences)
    expect(w.enclosures.size).toBe(2)
    const hole = { col: O.col + 3, row: O.row + 3 }
    const donut = { col: O.col + 1, row: O.row + 1 }
    const inner = { col: O.col + 3, row: O.row + 2 }
    const outer = { col: O.col + 3, row: O.row }
    const holeIds = w.plotEnclosures.get(k(hole))
    const donutIds = w.plotEnclosures.get(k(donut))
    if (holeIds === undefined || donutIds === undefined) throw new Error('enclosure')
    expect(holeIds).toHaveLength(1)
    expect(donutIds).toHaveLength(1)
    expect(holeIds).not.toEqual(donutIds)
    const innerIds = w.fenceEnclosures.get(k(inner))
    const outerIds = w.fenceEnclosures.get(k(outer))
    if (innerIds === undefined || outerIds === undefined) throw new Error('enclosure')
    expect(innerIds).toHaveLength(2)
    expect(new Set(innerIds)).toEqual(new Set([...holeIds, ...donutIds]))
    expect(outerIds).toEqual(donutIds)
  })
})

describe('enclosure.static', () => {
  test('eval / hover does not call rebuild. Rebuild only from fence add/remove and `indexAll`.', () => {
    const w = new World(1)
    const hole = { col: O.col + 1, row: O.row + 1 }
    clear(w, O.col, O.row, 4)
    const fences = ring3(hole.col, hole.row)
    lay(w, fences)
    expect(w.enclosures.size).toBe(1)
    w.enclosures.clear()
    w.fenceEnclosures.clear()
    w.plotEnclosures.clear()
    w.tick(DT_MAX)
    enclosure.lookup(w, fences[0])
    expect(w.enclosures.size).toBe(0)
    w.indexAll()
    expect(w.enclosures.size).toBe(1)
    w.enclosures.clear()
    armFence(w)
    w.confirmPlace({ col: O.col + 3, row: O.row + 3 })
    expect(w.enclosures.size).toBe(1)
    w.armDelete()
    w.deleteBuilding(fences[0])
    expect(w.enclosures.size).toBe(0)
  })
})
