import { CHEST_SLOTS } from '../defs/items.ts'
import type { Slot } from './item.ts'

export type Coord = { col: number; row: number }

export type ChunkId = { cx: number; cy: number }

export type RectBase = { shape: 'rect'; col: number; row: number; w: number; h: number }
export type CircleBase = { shape: 'circle'; cx: number; cy: number; r: number }
export type Base = RectBase | CircleBase

export const CHUNK = 32

export function chunkOf(at: Coord): ChunkId {
  return { cx: Math.floor(at.col / CHUNK), cy: Math.floor(at.row / CHUNK) }
}

export function chunkRect(id: ChunkId): { col0: number; row0: number; col1: number; row1: number } {
  return {
    col0: id.cx * CHUNK,
    row0: id.cy * CHUNK,
    col1: id.cx * CHUNK + CHUNK,
    row1: id.cy * CHUNK + CHUNK,
  }
}

export function local(at: Coord): Coord {
  return {
    col: ((at.col % CHUNK) + CHUNK) % CHUNK,
    row: ((at.row % CHUNK) + CHUNK) % CHUNK,
  }
}

export function chunkKey(id: ChunkId): string {
  return `${id.cx},${id.cy}`
}

export function inWorld(at: Coord, owned: readonly ChunkId[]): boolean {
  const id = chunkOf(at)
  return owned.some(c => c.cx === id.cx && c.cy === id.cy)
}

export function occupiedCells(base: Base, owned: readonly ChunkId[]): Coord[] {
  const box = tileBox(base)
  const out: Coord[] = []
  for (let row = box.row0; row < box.row1; row++) {
    for (let col = box.col0; col < box.col1; col++) {
      if (!inWorld({ col, row }, owned)) continue
      if (areaOverlap(base, col, row) > 0) out.push({ col, row })
    }
  }
  return out
}

function tileBox(base: Base): { col0: number; row0: number; col1: number; row1: number } {
  if (base.shape === 'rect') {
    return {
      col0: Math.floor(base.col),
      row0: Math.floor(base.row),
      col1: Math.ceil(base.col + base.w),
      row1: Math.ceil(base.row + base.h),
    }
  }
  return {
    col0: Math.floor(base.cx - base.r),
    row0: Math.floor(base.cy - base.r),
    col1: Math.ceil(base.cx + base.r),
    row1: Math.ceil(base.cy + base.r),
  }
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

export const HOUSE_BASE: RectBase = { shape: 'rect', col: 14, row: 6, w: 4, h: 3 }
export const PUMP_BASE: CircleBase = { shape: 'circle', cx: 18.5, cy: 7.5, r: 0.5 }
export const DOOR: Coord = { col: 15, row: 9 }

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
  readonly base: Base
  outputLitersPerSec: number
  constructor(base: Base, outputLitersPerSec: number) {
    this.base = base
    this.outputLitersPerSec = outputLitersPerSec
  }
}

export class Rock {
  readonly kind = 'rock' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}

export class Shrub {
  readonly kind = 'shrub' as const
  ripe: boolean
  grow: number
  constructor(ripe: boolean, grow: number) {
    this.ripe = ripe
    this.grow = grow
  }
}

export class Chest {
  readonly kind = 'chest' as const
  readonly base: RectBase
  readonly slots: Slot[]
  constructor(base: RectBase) {
    this.base = base
    this.slots = Array.from({ length: CHEST_SLOTS }, (): Slot => ({ kind: 'empty' }))
  }
}

export class Grinder {
  readonly kind = 'grinder' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}

export type Building = House | Pump
