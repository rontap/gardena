import type { Coord } from './building.ts'

export type Edge =
  | { axis: 'h'; col: number; row: number }
  | { axis: 'v'; col: number; row: number }

export type Vertex = { col: number; row: number }

export type Junction = 'stub' | 'I' | 'L' | 'T' | 'X'

export type Sprinkler =
  | { variant: 'basic'; at: Vertex }
  | { variant: 'vert'; at: Vertex; facing: 'ns' | 'ew' }
  | { variant: 'large'; at: Vertex }

export type System = { C: number; N: number; R: number }

export function edgeKey(e: Edge): string {
  return `${e.axis}:${e.col},${e.row}`
}

export function vertexKey(v: Vertex): string {
  return `${v.col},${v.row}`
}

export function incident(v: Vertex): Edge[] {
  return [
    { axis: 'h', col: v.col - 1, row: v.row },
    { axis: 'h', col: v.col, row: v.row },
    { axis: 'v', col: v.col, row: v.row - 1 },
    { axis: 'v', col: v.col, row: v.row },
  ]
}

export function edgeOwned(e: Edge, inWorld: (at: Coord) => boolean): boolean {
  if (e.axis === 'h') {
    return inWorld({ col: e.col, row: e.row }) || inWorld({ col: e.col, row: e.row - 1 })
  }
  return inWorld({ col: e.col, row: e.row }) || inWorld({ col: e.col - 1, row: e.row })
}

export function vertexOwned(v: Vertex, inWorld: (at: Coord) => boolean): boolean {
  return (
    inWorld({ col: v.col - 1, row: v.row - 1 }) ||
    inWorld({ col: v.col, row: v.row - 1 }) ||
    inWorld({ col: v.col - 1, row: v.row }) ||
    inWorld({ col: v.col, row: v.row })
  )
}

export function junction(v: Vertex, has: (e: Edge) => boolean): Junction | undefined {
  const hit = incident(v).filter(has)
  const n = hit.length
  if (n === 0) return undefined
  if (n === 1) return 'stub'
  if (n === 3) return 'T'
  if (n === 4) return 'X'
  if (hit[0].axis === hit[1].axis) return 'I'
  return 'L'
}

export function aoe(s: Sprinkler): Coord[] {
  const { col, row } = s.at
  if (s.variant === 'basic') {
    return [
      { col: col - 1, row: row - 1 },
      { col, row: row - 1 },
      { col: col - 1, row },
      { col, row },
    ]
  }
  if (s.variant === 'large') {
    return [-2, -1, 0, 1].flatMap(dr => [-2, -1, 0, 1].map(dc => ({ col: col + dc, row: row + dr })))
  }
  if (s.facing === 'ns') {
    return [-2, -1, 0, 1].flatMap(dr => [-1, 0].map(dc => ({ col: col + dc, row: row + dr })))
  }
  return [-1, 0].flatMap(dr => [-2, -1, 0, 1].map(dc => ({ col: col + dc, row: row + dr })))
}
