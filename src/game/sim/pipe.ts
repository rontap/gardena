import type { Coord } from './building.ts'
import type { CropId, Signal } from './ids.ts'
import { Reservoir } from './water.ts'

export type Edge =
  | { axis: 'h'; col: number; row: number }
  | { axis: 'v'; col: number; row: number }

export type Vertex = { col: number; row: number }

export type Junction = 'stub' | 'I' | 'L' | 'T' | 'X'

export type Gate = { kind: 'bare' } | { kind: 'valve'; open: boolean } | { kind: 'smart' }

export type Segment = { at: Edge; gate: Gate }

export type Tune = { kind: 'flat' } | { kind: 'crop'; crop: CropId }

export type Sprinkler =
  | { variant: 'basic'; at: Vertex; tune: Tune; inn: Signal; hold: number }
  | { variant: 'vert'; at: Vertex; facing: 'ns' | 'ew'; tune: Tune; inn: Signal; hold: number }
  | { variant: 'large'; at: Vertex; tune: Tune; inn: Signal; hold: number }

export class Well {
  readonly kind = 'well' as const
  readonly at: Edge
  readonly water: Reservoir
  constructor(at: Edge) {
    this.at = at
    this.water = new Reservoir('well')
  }
}

export function flows(s: Segment): boolean {
  if (s.gate.kind === 'bare') return true
  if (s.gate.kind === 'valve') return s.gate.open
  return false
}

export function vertsOf(e: Edge): [Vertex, Vertex] {
  if (e.axis === 'h') return [{ col: e.col, row: e.row }, { col: e.col + 1, row: e.row }]
  return [{ col: e.col, row: e.row }, { col: e.col, row: e.row + 1 }]
}

export function boundsOf(at: Coord): Edge[] {
  return [
    { axis: 'h', col: at.col, row: at.row },
    { axis: 'h', col: at.col, row: at.row + 1 },
    { axis: 'v', col: at.col, row: at.row },
    { axis: 'v', col: at.col + 1, row: at.row },
  ]
}

export function corners(cells: readonly Coord[]): Vertex[] {
  const seen = new Set<string>()
  const out: Vertex[] = []
  cells.forEach(at => {
    ;[
      { col: at.col, row: at.row },
      { col: at.col + 1, row: at.row },
      { col: at.col, row: at.row + 1 },
      { col: at.col + 1, row: at.row + 1 },
    ].forEach(v => {
      const k = vertexKey(v)
      if (seen.has(k)) return
      seen.add(k)
      out.push(v)
    })
  })
  return out
}

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
