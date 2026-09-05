import {
  ADDITIVE_CAP_LITERS,
  BARREL_AGE,
  BARREL_MATURE,
  CHEST_SLOTS,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_SECONDS,
  FERT_BAG_LITERS,
  FREEZER_SLOTS,
  FURNACE_ASH,
  FURNACE_CAP,
  FURNACE_NEED,
  FURNACE_SECONDS,
  GRIND_MAX,
  grindMinAt,
  GRIND_WORK,
  JAM_BUFFER,
  JAM_IN,
  JAM_SECONDS,
  MILL_WORK,
  SILO_SEED_CAP,
  STATION_GRAFT_MAX,
  STATION_GRAFT_MIN,
  STATION_IN,
  STATION_SECONDS,
  STILL_CAP,
  STILL_SECONDS,
  SUGAR_SHOP,
  SYNTH_BAG_LITERS,
  WEED_SPRAY_BAG,
} from '../defs/items.ts'
import { tierOf, type VarietyId } from '../defs/varieties.ts'
import type { AnnualId, BarrelCrop, CropId, JamCrop, MillRecipe, Signal, StillCrop, TreeId } from './ids.ts'
import { compostValue, fruitStack, giveSlots, makeCompost, organic, slotsCouldTake, type Item, type Slot } from './item.ts'
import { statsOf } from './modifiers.ts'
import {
  addStillFeed,
  bakeSpiritSale,
  barrelNeed,
  feedUnits,
  feedVariety,
  feedVarietyOf,
  fruitCount,
  fruitCrop,
  fruitQuality,
  fruitVariety,
  furnaceMul,
  furnaceUnit,
  grindProduct,
  jamCropOf,
  jamSale,
  jamSugar,
  jamWorking,
  meanQuality,
  millDumpUnits,
  millNeed,
  millProduct,
  millRecipeOf,
  millWorking,
  mixQuality,
  spiritKind,
  stillCropOf,
  stillReady,
} from './feature-machines/machine.ts'
import { emitPair, emitProduct, pullStillWater } from './feature-machines/machines.emit.ts'
import type { World } from './world.ts'
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
export const PUMP_BASE: RectBase = { shape: 'rect', col: 18, row: 7, w: 2, h: 1 }
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

export class Well {
  readonly kind = 'well' as const
  readonly base: RectBase
  readonly water = new Reservoir('well')
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

export type TreeStage = 'trunk' | 'grow' | 'unripe' | 'ripe'

export class Tree {
  readonly kind = 'tree' as const
  readonly species: TreeId
  readonly base: RectBase
  juvenile: number
  fruit: number
  yield: TreeYield
  tended = false
  trunk = false
  variety: VarietyId = 'base'
  constructor(species: TreeId, base: RectBase, juvenile = 0, fruit = 0, y: TreeYield = { kind: 'pending' }) {
    this.species = species
    this.base = base
    this.juvenile = juvenile
    this.fruit = fruit
    this.yield = y
  }
  stage(): TreeStage {
    if (this.trunk) return 'trunk'
    if (this.juvenile < 1) return 'grow'
    if (this.yield.kind === 'on' || this.fruit >= 1) return 'ripe'
    return 'unripe'
  }
}

export class BaseBuilding {
  readonly base: RectBase
  readonly ports: readonly ('out' | 'in' | 'in-l' | 'in-r')[] = []
  readonly pads: 'none' | 'both' = 'none'
  readonly takeAll: boolean = false
  readonly solid: boolean = true
  readonly ticks: boolean = false
  readonly hasted: boolean = false
  constructor(base: RectBase) {
    this.base = base
  }
  accept(_item: Item): number {
    return 0
  }
  apply(_item: Item, _n: number): void {}
  tick(_w: World, _at: Coord, _dt: number): boolean {
    return false
  }
}

export class Machine extends BaseBuilding {
  inn: Signal = 0
  override readonly pads = 'both'
  override readonly ticks = true
}

export class Chest extends BaseBuilding {
  readonly kind = 'chest' as const
  override readonly pads = 'both'
  override readonly takeAll = true
  override readonly ports = ['out'] as const
  readonly slots: Slot[]
  out: Signal = 0
  hold = 0
  constructor(base: RectBase) {
    super(base)
    this.slots = Array.from({ length: CHEST_SLOTS }, (): Slot => ({ kind: 'empty' }))
  }
  override accept(item: Item): number {
    return slotsCouldTake(this.slots, item, this.slots.length, undefined) ? 1 : 0
  }
  override apply(item: Item, _n: number): void {
    giveSlots(this.slots, item, this.slots.length, undefined)
  }
}

export class Grinder extends BaseBuilding {
  readonly kind = 'grinder' as const
  override readonly ticks = true
  override readonly hasted = true
  crop: CropId | 'none' = 'none'
  variety: VarietyId = 'base'
  quality = 0
  units = 0
  progress = 0
  n = 0
  constructor(base: RectBase) {
    super(base)
  }
  override accept(item: Item): number {
    const crop = fruitCrop(item)
    const variety = fruitVariety(item)
    if (crop === undefined || variety === undefined) return 0
    if (this.crop !== 'none' && (this.crop !== crop || this.variety !== variety)) return 0
    const n = fruitCount(item)
    if (n <= 0) return 0
    return n
  }
  override apply(item: Item, n: number): void {
    const crop = fruitCrop(item)
    const variety = fruitVariety(item)
    if (crop === undefined || variety === undefined) return
    this.applyTake(crop, variety, fruitQuality(item), n)
  }
  applyTake(crop: CropId, variety: VarietyId, quality: number, n: number): void {
    if (this.crop === 'none') {
      this.crop = crop
      this.variety = variety
      this.quality = quality
      this.units = n
      return
    }
    this.quality = mixQuality(this.quality, this.units, quality, n)
    this.units += n
  }
  override tick(w: World, at: Coord, dt: number): boolean {
    if (this.crop === 'none' || this.units < 1) return false
    this.progress += (dt * w.machineMul() * furnaceMul(w.furnaceSnap, this.base)) / GRIND_WORK
    if (this.progress < 1) return false
    const u = w.rng.stream('grind').at(at.col, at.row, w.clock.day, this.n)
    const floor = grindMinAt(this.quality)
    const count = floor + Math.floor(u * (GRIND_MAX - floor + 1))
    if (!emitProduct(w, at, this.base, grindProduct(this, count))) return false
    this.progress = 0
    this.units -= 1
    this.n += 1
    if (this.units === 0) this.crop = 'none'
    w.track(at, this)
    return true
  }
}

export class CompostBox extends BaseBuilding {
  readonly kind = 'compost-box' as const
  override readonly pads = 'both'
  override readonly takeAll = true
  override readonly ticks = true
  override readonly hasted = true
  units = 0
  progress = 0
  constructor(base: RectBase) {
    super(base)
  }
  override accept(item: Item): number {
    return organic(item) ? 1 : 0
  }
  override apply(item: Item, _n: number): void {
    this.units += compostValue(item)
  }
  override tick(w: World, at: Coord, dt: number): boolean {
    if (this.units < COMPOST_NEED) return false
    this.progress += (dt * furnaceMul(w.furnaceSnap, this.base)) / COMPOST_SECONDS
    if (this.progress < 1) return false
    if (!emitProduct(w, at, this.base, makeCompost())) return false
    this.progress = 0
    this.units -= COMPOST_NEED
    w.track(at, this)
    return true
  }
}

export class Truck {
  readonly kind = 'truck' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}

export class Mill extends Machine {
  readonly kind = 'mill' as const
  override readonly ports = ['in'] as const
  override readonly hasted = true
  recipe: MillRecipe | 'none' = 'none'
  variety: VarietyId = 'base'
  quality = 0
  units = 0
  progress = 0
  constructor(base: RectBase) {
    super(base)
  }
  override accept(item: Item): number {
    const recipe = millRecipeOf(item)
    if (recipe === undefined) return 0
    if (this.recipe !== 'none' && (this.recipe !== recipe || this.variety !== feedVarietyOf(item))) return 0
    const n = millDumpUnits(item, recipe)
    if (n <= 0) return 0
    return n
  }
  override apply(item: Item, n: number): void {
    const recipe = millRecipeOf(item)
    if (recipe === undefined || n <= 0) return
    const q = item.kind === 'fruit' ? item.quality : 0
    const v = feedVarietyOf(item)
    if (this.recipe === 'none') {
      this.recipe = recipe
      this.variety = v
      this.quality = q
      this.units = n
      return
    }
    this.quality = mixQuality(this.quality, this.units, q, n)
    this.units += n
  }
  override tick(w: World, at: Coord, dt: number): boolean {
    if (!millWorking(this)) return false
    const need = millNeed(this.recipe)
    this.progress += (dt * w.machineMul() * furnaceMul(w.furnaceSnap, this.base)) / MILL_WORK
    if (this.progress < 1) return false
    if (!emitProduct(w, at, this.base, millProduct(this.recipe, this.variety, this.quality))) return false
    this.progress = 0
    this.units -= need
    if (this.units === 0) {
      const mill: Mill = this
      mill.recipe = 'none'
    }
    w.track(at, this)
    return true
  }
}

export class JamMachine extends Machine {
  readonly kind = 'jam' as const
  override readonly ports = ['in'] as const
  override readonly hasted = true
  crop: JamCrop | 'none' = 'none'
  variety: VarietyId = 'base'
  quality = 0
  fruit = 0
  sugar = 0
  progress = 0
  constructor(base: RectBase) {
    super(base)
  }
  override accept(item: Item): number {
    if (item.kind === 'sugar') return this.acceptSugar(item)
    return this.acceptFruit(item)
  }
  override apply(item: Item, n: number): void {
    if (item.kind === 'sugar') {
      this.applySugar(n)
      return
    }
    this.applyFruit(item, n)
  }
  acceptFruit(item: Item): number {
    const crop = jamCropOf(item)
    if (crop === undefined) return 0
    if (this.crop !== 'none' && (this.crop !== crop || this.variety !== feedVarietyOf(item))) return 0
    return fruitCount(item)
  }
  applyFruit(item: Item, n: number): void {
    if (item.kind !== 'fruit') return
    const crop = jamCropOf(item)
    if (crop === undefined || n <= 0) return
    if (this.crop === 'none') {
      this.crop = crop
      this.variety = item.variety
      this.quality = item.quality
      this.fruit = n
      return
    }
    this.quality = mixQuality(this.quality, this.fruit, item.quality, n)
    this.fruit += n
  }
  acceptSugar(item: Item): number {
    if (item.kind !== 'sugar') return 0
    const room = JAM_BUFFER - this.sugar
    if (room <= 0 || item.liters <= 0) return 0
    return item.liters < room ? item.liters : room
  }
  applySugar(n: number): void {
    this.sugar += n
  }
  override tick(w: World, at: Coord, dt: number): boolean {
    if (!jamWorking(this)) return false
    this.progress += (dt * w.machineMul() * furnaceMul(w.furnaceSnap, this.base)) / JAM_SECONDS
    if (this.progress < 1) return false
    if (
      !emitProduct(w, at, this.base, {
        kind: 'jam',
        crop: this.crop,
        variety: this.variety,
        quality: this.quality,
        count: 1,
        unitSale: jamSale(this.crop, this.variety, this.quality),
      })
    ) {
      return false
    }
    this.progress = 0
    this.fruit -= JAM_IN
    this.sugar -= jamSugar(this.crop, this.variety)
    if (this.fruit === 0) {
      const jam: JamMachine = this
      jam.crop = 'none'
    }
    w.track(at, this)
    return true
  }
}

export class PotStill extends Machine {
  readonly kind = 'still' as const
  override readonly ports = ['in'] as const
  override readonly hasted = true
  feed: { crop: StillCrop; variety: VarietyId; quality: number; count: number }[] = []
  progress = 0
  n = 0
  constructor(base: RectBase) {
    super({ shape: 'rect', col: base.col, row: base.row, w: 2, h: 1 })
  }
  override accept(item: Item): number {
    if (stillCropOf(item) === undefined) return 0
    const room = STILL_CAP - feedUnits(this.feed)
    const n = fruitCount(item)
    if (room <= 0 || n <= 0) return 0
    return n < room ? n : room
  }
  override apply(item: Item, n: number): void {
    const crop = stillCropOf(item)
    const variety = fruitVariety(item)
    if (crop === undefined || variety === undefined || n <= 0) return
    addStillFeed(this.feed, crop, variety, fruitQuality(item), n)
  }
  override tick(w: World, at: Coord, dt: number): boolean {
    if (!stillReady(this)) return false
    let dirty = false
    if (this.progress === 0) {
      if (!pullStillWater(w, this)) return false
      dirty = true
    }
    this.progress += (dt * furnaceMul(w.furnaceSnap, this.base)) / STILL_SECONDS
    if (this.progress < 1) return dirty
    const kind = spiritKind(this.feed)
    const quality = meanQuality(this.feed)
    const variety = kind === 'mixed' ? 'base' : feedVariety(this.feed)
    if (
      !emitProduct(w, at, this.base, {
        kind: 'spirit',
        spirit: kind,
        variety,
        quality,
        count: 1,
        unitSale: bakeSpiritSale(kind, variety, quality),
      })
    ) {
      return dirty
    }
    this.feed = []
    this.progress = 0
    this.n += 1
    w.track(at, this)
    return true
  }
}

export class Furnace extends Machine {
  readonly kind = 'furnace' as const
  override readonly ports = ['in', 'out'] as const
  override readonly hasted = true
  units = 0
  progress = 0
  out: Signal = 0
  hold = 0
  constructor(base: RectBase) {
    super({ shape: 'rect', col: base.col, row: base.row, w: 1, h: 2 })
  }
  override accept(item: Item): number {
    const unit = furnaceUnit(item)
    if (unit <= 0) return 0
    const room = FURNACE_CAP - this.units
    if (room <= 0) return 0
    if (item.kind === 'tree-seed') return unit <= room ? 1 : 0
    if (item.kind === 'sugar') {
      const maxL = room / unit
      return item.liters < maxL ? item.liters : maxL
    }
    if ('count' in item) {
      const maxN = Math.floor(room / unit)
      if (maxN <= 0) return 0
      return item.count < maxN ? item.count : maxN
    }
    return 0
  }
  override apply(item: Item, n: number): void {
    if (n <= 0) return
    this.units += furnaceUnit(item) * n
  }
  override tick(w: World, at: Coord, dt: number): boolean {
    if (this.inn === 1) return false
    if (this.units < FURNACE_NEED) return false
    if (this.progress < 1) this.progress += (dt * furnaceMul(w.furnaceSnap, this.base)) / FURNACE_SECONDS
    if (this.progress < 1) return false
    if (!emitProduct(w, at, this.base, { kind: 'ash', count: FURNACE_ASH })) return false
    this.progress = 0
    this.units -= FURNACE_NEED
    w.track(at, this)
    return true
  }
}

export class ResearchStation extends Machine {
  readonly kind = 'station' as const
  override readonly ports = ['in'] as const
  crop: CropId | 'none' = 'none'
  variety: VarietyId = 'base'
  quality = 0
  units = 0
  progress = 0
  constructor(base: RectBase) {
    super({ shape: 'rect', col: base.col, row: base.row, w: 2, h: 1 })
  }
  override accept(item: Item): number {
    if (item.kind !== 'fruit' || item.cut) return 0
    if (tierOf(item.variety) !== 'heirloom') return 0
    if (this.crop !== 'none' && (this.crop !== item.crop || this.variety !== item.variety)) return 0
    const room = STATION_IN - this.units
    if (room <= 0 || item.count <= 0) return 0
    return Math.min(room, item.count)
  }
  override apply(item: Item, n: number): void {
    if (item.kind !== 'fruit') return
    this.applyTake(item.crop, item.variety, item.quality, n)
  }
  applyTake(crop: CropId, variety: VarietyId, quality: number, n: number): void {
    if (n <= 0) return
    if (this.crop === 'none') {
      this.crop = crop
      this.variety = variety
      this.quality = quality
      this.units = n
      return
    }
    this.quality = mixQuality(this.quality, this.units, quality, n)
    this.units += n
  }
  override tick(w: World, at: Coord, dt: number): boolean {
    if (this.inn === 1) return false
    if (this.crop === 'none' || this.units < STATION_IN) return false
    if (this.progress < 1) this.progress += dt / STATION_SECONDS
    if (this.progress < 1) return false
    const u = w.rng.stream('grind').at(at.col, at.row, w.clock.day)
    const count = STATION_GRAFT_MIN + Math.floor(u * (STATION_GRAFT_MAX - STATION_GRAFT_MIN + 1))
    const sale = statsOf(this.crop, this.variety, this.quality, w.modifiers).sale
    const cut: Item = {
      kind: 'fruit',
      ...fruitStack(this.crop, this.variety, this.quality, STATION_IN, sale, 1, false, true),
    }
    const grafts: Item = { kind: 'graft', crop: this.crop, variety: this.variety, quality: this.quality, count }
    if (!emitPair(w, at, this.base, cut, grafts)) return false
    this.progress = 0
    this.units -= STATION_IN
    if (this.units === 0) this.crop = 'none'
    w.track(at, this)
    return true
  }
}

export class Barrel extends BaseBuilding {
  readonly kind = 'barrel' as const
  override readonly ticks = true
  crop: BarrelCrop | 'none' = 'none'
  feed: { variety: VarietyId; quality: number; count: number }[] = []
  age = 0
  n = 0
  constructor(base: RectBase) {
    super(base)
  }
  override tick(w: World, at: Coord, dt: number): boolean {
    if (this.crop === 'none' || feedUnits(this.feed) !== barrelNeed(this.crop)) return false
    const was = this.age
    this.age += dt
    if (was < BARREL_MATURE && this.age >= BARREL_MATURE) {
      this.feed = [{ variety: feedVariety(this.feed), quality: meanQuality(this.feed), count: barrelNeed(this.crop) }]
      this.n += 1
    }
    w.track(at, this)
    return was < BARREL_AGE && this.age >= BARREL_AGE
  }
}

export class Freezer extends BaseBuilding {
  readonly kind = 'freezer' as const
  override readonly pads = 'both'
  override readonly takeAll = true
  override readonly ports = ['out'] as const
  readonly slots: Slot[]
  out: Signal = 0
  hold = 0
  constructor(base: RectBase, n: number = FREEZER_SLOTS) {
    super(base)
    this.slots = Array.from({ length: n }, (): Slot => ({ kind: 'empty' }))
  }
  override accept(item: Item): number {
    return slotsCouldTake(this.slots, item, this.slots.length, undefined) ? 1 : 0
  }
  override apply(item: Item, _n: number): void {
    giveSlots(this.slots, item, this.slots.length, undefined)
  }
}

export class Hangar {
  readonly kind = 'hangar' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}

export class SiloSeed {
  readonly kind = 'silo-seed' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}

export class SiloSpray {
  readonly kind = 'silo-spray' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}

export class SiloProduce {
  readonly kind = 'silo-produce' as const
  readonly base: RectBase
  constructor(base: RectBase) {
    this.base = base
  }
}


export abstract class Store extends BaseBuilding {
  readonly cap: number
  useDefault: boolean
  override readonly pads = 'both'
  override readonly ports = ['out'] as const
  constructor(base: RectBase, cap: number, useDefault = true) {
    super(base)
    this.cap = cap
    this.useDefault = useDefault
  }
  abstract get used(): number
  get free(): number {
    const n = this.cap - this.used
    return n < 0 ? 0 : n
  }
}

export type SiloStack = { crop: AnnualId; variety: VarietyId; quality: number; count: number }

export class SeedSilo extends Store {
  readonly kind = 'seed-silo' as const
  readonly seeds: SiloStack[] = []
  out: Signal = 0
  hold = 0
  constructor(base: RectBase, useDefault = true) {
    super(base, SILO_SEED_CAP, useDefault)
  }
  get used(): number {
    return this.seeds.reduce((n, s) => n + s.count, 0)
  }
  override accept(item: Item): number {
    if (item.kind !== 'seeds') return 0
    const n = this.free < item.count ? this.free : item.count
    return n > 0 ? n : 0
  }
  override apply(item: Item, n: number): void {
    if (item.kind !== 'seeds') return
    this.put(item.crop, item.variety, item.quality, n)
  }
  put(crop: AnnualId, variety: VarietyId, quality: number, count: number): number {
    const n = Math.min(count, this.free)
    if (n <= 0) return 0
    const hit = this.seeds.find(st => st.crop === crop && st.variety === variety)
    if (hit !== undefined) {
      hit.quality = (hit.quality * hit.count + quality * n) / (hit.count + n)
      hit.count += n
    } else this.seeds.push({ crop, variety, quality, count: n })
    return n
  }
}

export const ADDITIVE_IDS = ['fertilizer', 'synth', 'compost', 'weed-spray'] as const
export type AdditiveId = (typeof ADDITIVE_IDS)[number]

export const ADDITIVE_BAG: { readonly [K in AdditiveId]: number } = {
  fertilizer: FERT_BAG_LITERS,
  synth: SYNTH_BAG_LITERS,
  compost: COMPOST_LITERS,
  'weed-spray': WEED_SPRAY_BAG,
}

export type AdditiveHold = { id: AdditiveId; liters: number }

export type SugarBin = { liters: number; unitSale: number; quality: number }

export class AdditiveStore extends Store {
  readonly kind = 'additive-store' as const
  readonly held: AdditiveHold[] = []
  sugar: SugarBin = { liters: 0, unitSale: SUGAR_SHOP, quality: 0 }
  out: Signal = 0
  hold = 0
  constructor(base: RectBase, useDefault = true) {
    super(base, ADDITIVE_CAP_LITERS, useDefault)
  }
  get used(): number {
    return this.held.reduce((n, h) => n + h.liters, this.sugar.liters)
  }
  litersOf(id: AdditiveId): number {
    return this.held.find(h => h.id === id)?.liters ?? 0
  }
  override accept(item: Item): number {
    if (item.kind === 'sugar') {
      const room = this.free < item.liters ? this.free : item.liters
      return room > 0 ? room : 0
    }
    if (item.kind !== 'fertilizer' && item.kind !== 'synth' && item.kind !== 'compost' && item.kind !== 'weed-spray') return 0
    const n = this.free < item.liters ? this.free : item.liters
    return n > 0 ? n : 0
  }
  override apply(item: Item, n: number): void {
    if (item.kind === 'sugar') {
      this.putSugar(item.liters < n ? item.liters : n, item.unitSale, item.quality)
      return
    }
    if (item.kind === 'fertilizer' || item.kind === 'synth' || item.kind === 'compost' || item.kind === 'weed-spray') {
      this.putAdditive(item.kind, n)
    }
  }
  putSugar(liters: number, unitSale: number, quality: number): number {
    const n = Math.min(liters, this.free)
    if (n <= 0) return 0
    const bin = this.sugar
    const total = bin.liters + n
    bin.unitSale = (bin.unitSale * bin.liters + unitSale * n) / total
    bin.quality = (bin.quality * bin.liters + quality * n) / total
    bin.liters = total
    return n
  }
  putAdditive(id: AdditiveId, liters: number): number {
    const n = Math.min(liters, this.free)
    if (n <= 0) return 0
    const hit = this.held.find(h => h.id === id)
    if (hit !== undefined) hit.liters += n
    else this.held.push({ id, liters: n })
    return n
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
