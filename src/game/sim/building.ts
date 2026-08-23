import {
  ADDITIVE_CAP_LITERS,
  CHEST_SLOTS,
  COMPOST_LITERS,
  FERT_BAG_LITERS,
  FREEZER_SLOTS,
  SILO_SEED_CAP,
  SYNTH_BAG_LITERS,
} from '../defs/items.ts'
import type { Rarity } from '../defs/rarity.ts'
import type { AnnualId, JamCrop, MillRecipe, StillCrop, TreeId } from './ids.ts'
import type { Slot } from './item.ts'
import { Reservoir } from './water.ts'

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

export const FADE = 2

export function fadeRect(owned: readonly ChunkId[]): {
  col0: number
  row0: number
  col1: number
  row1: number
} {
  let col0 = Infinity
  let row0 = Infinity
  let col1 = -Infinity
  let row1 = -Infinity
  owned.forEach(id => {
    const r = chunkRect(id)
    if (r.col0 < col0) col0 = r.col0
    if (r.row0 < row0) row0 = r.row0
    if (r.col1 > col1) col1 = r.col1
    if (r.row1 > row1) row1 = r.row1
  })
  return { col0: col0 - FADE, row0: row0 - FADE, col1: col1 + FADE, row1: row1 + FADE }
}

export function inFade(at: Coord, owned: readonly ChunkId[]): boolean {
  if (inWorld(at, owned)) return false
  const b = fadeRect(owned)
  return at.col >= b.col0 && at.col < b.col1 && at.row >= b.row0 && at.row < b.row1
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
export const TRUCK_BASE: RectBase = { shape: 'rect', col: 12, row: 8, w: 2, h: 1 }
export const YARD: Coord[] = [
  { col: 12, row: 9 },
  { col: 13, row: 9 },
  { col: 14, row: 9 },
]
export const PAD: Coord = { col: 12, row: 9 }
export const SILO_BASE: RectBase = { shape: 'rect', col: 17, row: 9, w: 1, h: 2 }
export const ADDITIVE_BASE: RectBase = { shape: 'rect', col: 18, row: 9, w: 1, h: 2 }

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
  readonly form: 'starter' | 'jack'
  readonly base: Base
  readonly water: Reservoir
  constructor(base: Base, form: 'starter' | 'jack') {
    this.base = base
    this.form = form
    this.water = new Reservoir('pump')
  }
}

export class RainTank {
  readonly kind = 'rain-tank' as const
  readonly base: RectBase
  readonly water = new Reservoir('rain-tank')
  constructor(base: RectBase) {
    this.base = base
  }
}

export class Tap {
  readonly kind = 'tap' as const
  readonly base: RectBase
  drawn = 0
  constructor(base: RectBase) {
    this.base = base
  }
}

export class Rock {
  readonly kind = 'rock' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}

export type TreeYield =
  | { kind: 'pending' }
  | { kind: 'on'; daysLeft: 1 | 2 }
  | { kind: 'off'; chance: number }

export class Tree {
  readonly kind = 'tree' as const
  readonly species: TreeId
  readonly base: RectBase
  juvenile: number
  fruit: number
  yield: TreeYield
  constructor(species: TreeId, base: RectBase, juvenile = 0, fruit = 0, y: TreeYield = { kind: 'pending' }) {
    this.species = species
    this.base = base
    this.juvenile = juvenile
    this.fruit = fruit
    this.yield = y
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

export class CompostBox {
  readonly kind = 'compost-box' as const
  readonly base: RectBase
  units = 0
  progress = 0
  constructor(base: RectBase) {
    this.base = base
  }
}

export class Truck {
  readonly kind = 'truck' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}

export class Mill {
  readonly kind = 'mill' as const
  readonly base: RectBase
  recipe: MillRecipe | 'none' = 'none'
  units = 0
  progress = 0
  constructor(base: RectBase) {
    this.base = base
  }
}

export class JamMachine {
  readonly kind = 'jam' as const
  readonly base: RectBase
  crop: JamCrop | 'none' = 'none'
  fruit = 0
  sugar = 0
  progress = 0
  constructor(base: RectBase) {
    this.base = base
  }
}

export class PotStill {
  readonly kind = 'still' as const
  readonly base: RectBase
  feed: { crop: StillCrop; rarity: Rarity; count: number }[] = []
  progress = 0
  n = 0
  constructor(base: RectBase) {
    this.base = base
  }
}

export class WineBarrel {
  readonly kind = 'barrel' as const
  readonly base: RectBase
  feed: { rarity: Rarity; count: number }[] = []
  age = 0
  n = 0
  constructor(base: RectBase) {
    this.base = base
  }
}

export class Freezer {
  readonly kind = 'freezer' as const
  readonly base: RectBase
  readonly slots: Slot[]
  constructor(base: RectBase) {
    this.base = base
    this.slots = Array.from({ length: FREEZER_SLOTS }, (): Slot => ({ kind: 'empty' }))
  }
}

/**
 * Shared contract for storage buildings: a capacity and the flag that marks which
 * instance a shop purchase flows into. Only one default exists per store kind today
 * and none are buyable, but `useDefault` is the seam multiple stores will hang off.
 */
export abstract class Store {
  readonly base: RectBase
  readonly cap: number
  useDefault: boolean
  constructor(base: RectBase, cap: number, useDefault = true) {
    this.base = base
    this.cap = cap
    this.useDefault = useDefault
  }
  abstract get used(): number
  get free(): number {
    const n = this.cap - this.used
    return n < 0 ? 0 : n
  }
}

export type SiloStack = { crop: AnnualId; rarity: Rarity; count: number }

export class SeedSilo extends Store {
  readonly kind = 'seed-silo' as const
  readonly seeds: SiloStack[] = []
  constructor(base: RectBase, useDefault = true) {
    super(base, SILO_SEED_CAP, useDefault)
  }
  get used(): number {
    return this.seeds.reduce((n, s) => n + s.count, 0)
  }
}

/** Additive kinds the store accepts. New consumable feeds append here. */
export const ADDITIVE_IDS = ['fertilizer', 'synth', 'compost'] as const
export type AdditiveId = (typeof ADDITIVE_IDS)[number]

export const ADDITIVE_BAG: { readonly [K in AdditiveId]: number } = {
  fertilizer: FERT_BAG_LITERS,
  synth: SYNTH_BAG_LITERS,
  compost: COMPOST_LITERS,
}

export type AdditiveHold = { id: AdditiveId; liters: number }

export class AdditiveStore extends Store {
  readonly kind = 'additive-store' as const
  readonly held: AdditiveHold[] = []
  constructor(base: RectBase, useDefault = true) {
    super(base, ADDITIVE_CAP_LITERS, useDefault)
  }
  get used(): number {
    return this.held.reduce((n, h) => n + h.liters, 0)
  }
  litersOf(id: AdditiveId): number {
    return this.held.find(h => h.id === id)?.liters ?? 0
  }
}

export function frontOf(at: Coord): Coord[] {
  return [
    { col: at.col, row: at.row + 1 },
    { col: at.col - 1, row: at.row },
    { col: at.col + 1, row: at.row },
    { col: at.col, row: at.row - 1 },
  ]
}

export type Building = House | Pump | RainTank
