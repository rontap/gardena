export type Coord = { col: number; row: number }

export type RectBase = { shape: 'rect'; col: number; row: number; w: number; h: number }
export type CircleBase = { shape: 'circle'; cx: number; cy: number; r: number }
export type Base = RectBase | CircleBase

export const COLS = 32
export const ROWS = 48

export function inWorld(at: Coord): boolean {
  return at.col >= 0 && at.col < COLS && at.row >= 0 && at.row < ROWS
}

export function occupiedCells(base: Base): Coord[] {
  const out: Coord[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (areaOverlap(base, col, row) > 0) out.push({ col, row })
    }
  }
  return out
}

function areaOverlap(base: Base, col: number, row: number): number {
  const l = col
  const r = col + 1
  const t = row
  const b = row + 1
  if (base.shape === 'rect') {
    const x1 = Math.max(l, base.col)
    const x2 = Math.min(r, base.col + base.w)
    const y1 = Math.max(t, base.row)
    const y2 = Math.min(b, base.row + base.h)
    const w = x2 - x1
    const h = y2 - y1
    if (w <= 0 || h <= 0) return 0
    return w * h
  }
  return circleSquare(base.cx, base.cy, base.r, l, t, r, b)
}

function circleSquare(
  cx: number,
  cy: number,
  rad: number,
  l: number,
  t: number,
  r: number,
  b: number,
): number {
  const nx = clamp(cx, l, r)
  const ny = clamp(cy, t, b)
  const dx = cx - nx
  const dy = cy - ny
  if (dx * dx + dy * dy >= rad * rad) return 0
  const x1 = Math.max(l, cx - rad)
  const x2 = Math.min(r, cx + rad)
  const y1 = Math.max(t, cy - rad)
  const y2 = Math.min(b, cy + rad)
  const w = x2 - x1
  const h = y2 - y1
  if (w <= 0 || h <= 0) return 0
  return w * h
}

function clamp(n: number, a: number, c: number): number {
  return Math.min(c, Math.max(a, n))
}

export const HOUSE_BASE: RectBase = { shape: 'rect', col: 14, row: 0, w: 4, h: 3 }
export const PUMP_BASE: CircleBase = { shape: 'circle', cx: 18.5, cy: 1.5, r: 0.5 }
export const DOOR: Coord = { col: 15, row: 3 }

export class House {
  readonly kind = 'house' as const
  readonly base: RectBase
  readonly door: Coord
  constructor(base: RectBase, door: Coord) {
    this.base = base
    this.door = door
  }
}

export class Pump {
  readonly kind = 'pump' as const
  readonly base: CircleBase
  outputLitersPerSec: number
  constructor(base: CircleBase, outputLitersPerSec: number) {
    this.base = base
    this.outputLitersPerSec = outputLitersPerSec
  }
}

export type Building = House | Pump
