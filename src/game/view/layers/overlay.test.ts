import { describe, expect, test } from 'vitest'
import { makeSensor } from '../../sim/sensor.ts'
import { World } from '../../sim/world.ts'
import { bare } from '../../sim/plot.ts'
import { sensorWashCells } from './overlay.ts'

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

describe('view.overlay', () => {
  test('Fenceable sensor wash is the watched set, not a hardcoded 3×3. On a fence with fenceEnclosures empty: no wash.', () => {
    const hole = { col: O.col + 1, row: O.row + 1 }
    const closed = new World(1)
    clear(closed, O.col, O.row, 3)
    const fences = ring3(hole.col, hole.row)
    lay(closed, fences)
    const on = fences[0]
    closed.setCell(on, makeSensor('sensor-water', { shape: 'rect', col: on.col, row: on.row, w: 1, h: 1 }))
    expect(sensorWashCells(closed, on, false).map(k)).toEqual([k(hole)])
    const open = new World(1)
    clear(open, O.col, O.row, 3)
    const openFences = fences.filter(at => at.col !== hole.col || at.row !== hole.row + 1)
    lay(open, openFences)
    const gapFence = openFences[0]
    open.setCell(gapFence, makeSensor('sensor-water', { shape: 'rect', col: gapFence.col, row: gapFence.row, w: 1, h: 1 }))
    expect(sensorWashCells(open, gapFence, false)).toEqual([])
    const inside = new World(1)
    inside.setCell(hole, makeSensor('sensor-water', { shape: 'rect', col: hole.col, row: hole.row, w: 1, h: 1 }))
    const around = sensorWashCells(inside, hole, false)
    expect(around).toHaveLength(8)
    expect(around.some(c => c.col === hole.col && c.row === hole.row)).toBe(false)
    const plate = new World(1)
    plate.setCell(hole, makeSensor('vehicle-detector', { shape: 'rect', col: hole.col, row: hole.row, w: 1, h: 1 }))
    expect(sensorWashCells(plate, hole, true)).toHaveLength(9)
  })

  test('Unarmed hover of a range-reader uses the watched set.', () => {
    const at = { col: O.col, row: O.row }
    const w = new World(1)
    w.setCell(at, makeSensor('sensor-water', { shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }))
    expect(sensorWashCells(w, at, false)).toHaveLength(8)
    w.setCell(at, makeSensor('vehicle-detector', { shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }))
    expect(sensorWashCells(w, at, true)).toHaveLength(9)
  })
})
