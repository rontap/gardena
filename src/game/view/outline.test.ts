import { describe, expect, test } from 'vitest'
import { TILE } from './camera.ts'
import { footOutline } from './outline.ts'
import { furnaceCoveringCells } from '../sim/feature-machines/machine.ts'

function verts(d: string): { x: number; y: number }[] {
  return [...d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(m => ({
    x: Number(m[1]),
    y: Number(m[2]),
  }))
}

function rect(col: number, row: number, w: number, h: number): { col: number; row: number }[] {
  return Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => ({ col: col + c, row: row + r }))).flat()
}

describe('view.outline', () => {
  test('Hover paints one outline per footprint: the boundary of the union of its cells, internal edges dropped, one `data-cell-stroke` element.', () => {
    const one = footOutline([{ col: 3, row: 5 }])
    if (one === undefined) throw new Error('outline')
    expect(one.d.match(/M /g)).toHaveLength(1)
    expect(one.d.match(/Z/g)).toHaveLength(1)
    const house = footOutline(rect(14, 6, 4, 3))
    if (house === undefined) throw new Error('outline')
    expect(house.d.match(/M /g)).toHaveLength(1)
    expect(house.d.match(/Z/g)).toHaveLength(1)
    const hv = verts(house.d)
    const minX = Math.min(...hv.map(v => v.x))
    const maxX = Math.max(...hv.map(v => v.x))
    const minY = Math.min(...hv.map(v => v.y))
    const maxY = Math.max(...hv.map(v => v.y))
    expect(maxX - minX).toBe(4 * TILE)
    expect(maxY - minY).toBe(3 * TILE)
    expect(hv.every(v => v.x === minX || v.x === maxX || v.y === minY || v.y === maxY)).toBe(true)
    const still = footOutline(rect(10, 11, 2, 1))
    if (still === undefined) throw new Error('outline')
    expect(still.d.match(/M /g)).toHaveLength(1)
    const furnace = footOutline(rect(12, 11, 1, 2))
    if (furnace === undefined) throw new Error('outline')
    expect(furnace.d.match(/M /g)).toHaveLength(1)
    const fv = verts(furnace.d)
    expect(Math.max(...fv.map(v => v.y)) - Math.min(...fv.map(v => v.y))).toBe(2 * TILE)
  })
})

describe('view.furnace-cover', () => {
  test('Armed `buy-furnace` (ghost follows hover) and unarmed hover of a placed furnace (either cell): one `data-furnace-cover` path, the union of covering cells (Chebyshev ≤ `FURNACE_REACH` over the 1×2, derived 7×8). `fill-none` `stroke-ink` `strokeWidth` 2. Clip to owned (`inWorld`); drop fade and off-farm cells. Internal edges dropped. Footprint `data-cell-stroke` stays. Not sprinkler fill. Not a lens. Not a dock. Not Pixi overlay wash.', () => {
    const cells = furnaceCoveringCells({ shape: 'rect', col: 12, row: 11, w: 1, h: 2 })
    const cover = footOutline(cells)
    if (cover === undefined) throw new Error('outline')
    expect(cover.d.match(/M /g)).toHaveLength(1)
    expect(cover.d.match(/Z/g)).toHaveLength(1)
    const cv = verts(cover.d)
    const minX = Math.min(...cv.map(v => v.x))
    const maxX = Math.max(...cv.map(v => v.x))
    const minY = Math.min(...cv.map(v => v.y))
    const maxY = Math.max(...cv.map(v => v.y))
    expect(maxX - minX).toBe(7 * TILE)
    expect(maxY - minY).toBe(8 * TILE)
    expect(cv.every(v => v.x === minX || v.x === maxX || v.y === minY || v.y === maxY)).toBe(true)
  })
})
