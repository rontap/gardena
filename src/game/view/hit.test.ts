import { describe, expect, test } from 'vitest'
import { edgeKey } from '../sim/pipe.ts'
import { onEdgeBand, roundVertex, routeEdges } from './hit.ts'

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

  test('Edge band is the outer 0.35 of a tile; the middle pans.', () => {
    expect(onEdgeBand(3.02, 3.5)).toBe(true)
    expect(onEdgeBand(3.5, 3.98)).toBe(true)
    expect(onEdgeBand(3.5, 3.5)).toBe(false)
    expect(roundVertex(3.6, 3.2)).toEqual({ col: 4, row: 3 })
  })
})
