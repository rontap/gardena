// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { PUMP_BASE } from '../sim/building.ts'
import { edgeKey } from '../sim/pipe.ts'
import { makeSensor } from '../sim/sensor.ts'
import { World } from '../sim/world.ts'
import { clickHit, onEdgeBand, roundVertex, routeCells, routeEdges } from './hit.ts'

describe('view.route', () => {
  test('L path, long axis first, unique edges, endpoints joined.', () => {
    const run = routeEdges({ col: 2, row: 2 }, { col: 5, row: 4 }, false)
    expect(run).toHaveLength(5)
    expect(new Set(run.map(edgeKey)).size).toBe(5)
    expect(run.filter(e => e.axis === 'h')).toHaveLength(3)
    expect(run.map(edgeKey)).toEqual(['h:2,2', 'h:3,2', 'h:4,2', 'v:5,2', 'v:5,3'])
  })

  test('Shift flips the corner.', () => {
    const run = routeEdges({ col: 2, row: 2 }, { col: 5, row: 4 }, true)
    expect(run.map(edgeKey)).toEqual(['v:2,2', 'v:2,3', 'h:2,4', 'h:3,4', 'h:4,4'])
  })

  test('Backwards and straight runs.', () => {
    expect(routeEdges({ col: 5, row: 2 }, { col: 2, row: 2 }, false).map(edgeKey)).toEqual(['h:4,2', 'h:3,2', 'h:2,2'])
    expect(routeEdges({ col: 2, row: 5 }, { col: 2, row: 2 }, false).map(edgeKey)).toEqual(['v:2,4', 'v:2,3', 'v:2,2'])
    expect(routeEdges({ col: 2, row: 2 }, { col: 2, row: 2 }, false)).toEqual([])
  })

  test('routeCells is the same L on cells; both ends included; same cell is that one cell.', () => {
    expect(routeCells({ col: 2, row: 2 }, { col: 5, row: 4 }, false)).toEqual([
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
      { col: 5, row: 2 },
      { col: 5, row: 3 },
      { col: 5, row: 4 },
    ])
    expect(routeCells({ col: 2, row: 2 }, { col: 5, row: 4 }, true)).toEqual([
      { col: 2, row: 2 },
      { col: 2, row: 3 },
      { col: 2, row: 4 },
      { col: 3, row: 4 },
      { col: 4, row: 4 },
      { col: 5, row: 4 },
    ])
    expect(routeCells({ col: 2, row: 2 }, { col: 2, row: 2 }, false)).toEqual([{ col: 2, row: 2 }])
  })

  test('Edge band is the outer 0.35 of a tile; the middle pans.', () => {
    expect(onEdgeBand(3.02, 3.5)).toBe(true)
    expect(onEdgeBand(3.5, 3.98)).toBe(true)
    expect(onEdgeBand(3.5, 3.5)).toBe(false)
    expect(roundVertex(3.6, 3.2)).toEqual({ col: 4, row: 3 })
  })
})

describe('view.hit', () => {
  test("Farm sprites `eventMode` `'none'`. Hits are `hit.ts` world-space math. Overlay Graphics do not take pointer.", () => {
    const w = new World(1)
    const put = (kind: 'logic' | 'sensor-variety' | 'sensor-weather' | 'vehicle-detector' | 'sensor-water', at: { col: number; row: number }) => {
      w.setCell(at, makeSensor(kind, { shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }))
    }
    const logic = { col: 10, row: 12 }
    const variety = { col: 11, row: 12 }
    const weather = { col: 12, row: 12 }
    const pressure = { col: 10, row: 13 }
    const water = { col: 11, row: 13 }
    put('logic', logic)
    put('sensor-variety', variety)
    put('sensor-weather', weather)
    put('vehicle-detector', pressure)
    put('sensor-water', water)
    expect(clickHit(w, logic.col + 0.5, logic.row + 0.5, 'off')).toEqual({ kind: 'logic-hud', at: logic })
    expect(clickHit(w, variety.col + 0.5, variety.row + 0.5, 'off')).toEqual({ kind: 'variety-hud', at: variety })
    expect(clickHit(w, weather.col + 0.5, weather.row + 0.5, 'off')).toEqual({ kind: 'weather-hud', at: weather })
    expect(clickHit(w, pressure.col + 0.5, pressure.row + 0.5, 'off')).toEqual({ kind: 'pressure-hud', at: pressure })
    expect(clickHit(w, water.col + 0.5, water.row + 0.5, 'sensors')).toEqual({ kind: 'water-hud', at: water })
    expect(clickHit(w, pressure.col + 0.5, pressure.row + 0.5, 'sensors')).toEqual({ kind: 'pressure-hud', at: pressure })
    const origin = { col: PUMP_BASE.col, row: PUMP_BASE.row }
    expect(clickHit(w, origin.col + 0.5, origin.row + 0.5, 'sensors')).toEqual({
      kind: 'port',
      end: { kind: 'cell', at: origin, port: 'in' },
    })
    const east = { col: origin.col + 1, row: origin.row }
    expect(clickHit(w, east.col + 0.5, east.row + 0.5, 'sensors')).toEqual({ kind: 'cell', at: east })
  })
})
