import {
  BOOM_LONG,
  HANGAR_H,
  HANGAR_W,
  SILO_H,
  SILO_W,
  HARVEST_SLOTS,
  HITCH_BACK,
  QUAD_ACCEL,
  QUAD_EMPTY_MUL,
  QUAD_VMAX,
  QUAD_YAW,
  SURFACE_NORMAL,
  SURFACE_PAVED,
  SURFACE_SLOW,
  TRACTOR_ACCEL,
  TRACTOR_VMAX,
  TRACTOR_YAW,
  TRAILER_CAP,
  TRAILER_LEN,
  VEHICLE_SLOTS,
} from '../defs/items.ts'
import type { VarietyId } from '../defs/varieties.ts'
import type { AnnualId, HarvestSlot, RouteId, TrailerId, TrailerKind, VehicleId, VehicleKind, VehicleSlot } from './ids.ts'
import { compostValue, countable, mergeInto, organic, stackable, type Item, type Slot } from './item.ts'
import {
  ADDITIVE_BAG,
  type AdditiveId,
  type AdditiveStore,
  type Chest,
  type CompostBox,
  type Coord,
  type Freezer,
  type Furnace,
  type JamMachine,
  type Mill,
  type PotStill,
  type RectBase,
  type SeedSilo,
} from './building.ts'
import type { Drop } from './drop.ts'
import {
  jamFruitAccept,
  jamFruitApply,
  jamSugarAccept,
  jamSugarApply,
  mergeSugar,
  millAccept,
  millApply,
  furnaceAccept,
  furnaceApply,
  stillAccept,
  stillApply,
} from './machine.ts'
import { isSolid, isTilled, type Cell } from './plot.ts'
import type { SeatId } from './world.ts'

export type Drive = { throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }

export type RouteStop =
  | { kind: 'goto'; x: number; y: number }
  | { kind: 'unload'; at: Coord }
  | { kind: 'load'; at: Coord }
  | { kind: 'wait'; at: Coord }

export type Route = { id: RouteId; name: string; stops: RouteStop[] }

export type VehiclePose =
  | { kind: 'stored'; hangar: Coord }
  | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }

export type TrailerPose =
  | { kind: 'stored'; hangar: Coord }
  | { kind: 'attached'; vehicle: VehicleId; heading: number }

export type SeedHopper = { kind: 'empty' } | { kind: 'hold'; item: Extract<Item, { kind: 'seeds' }> }
export type SprayHopper =
  | { kind: 'empty' }
  | { kind: 'hold'; item: Extract<Item, { kind: 'fertilizer' | 'synth' | 'compost' }> }

export type Vehicle =
  | {
      kind: 'quad'
      id: VehicleId
      fuel: number
      slots: Slot[]
      pose: VehiclePose
      route: RouteId | 'none'
      cursor: number
      running: boolean
      dwell: number
    }
  | {
      kind: 'tractor'
      id: VehicleId
      fuel: number
      hitch: TrailerId | 'none'
      boom: 3 | 5
      pose: VehiclePose
      route: RouteId | 'none'
      cursor: number
      running: boolean
      dwell: number
    }

export type Trailer =
  | { kind: 'seed'; id: TrailerId; pose: TrailerPose; hopper: SeedHopper }
  | { kind: 'spray'; id: TrailerId; pose: TrailerPose; hopper: SprayHopper }
  | { kind: 'harvest'; id: TrailerId; pose: TrailerPose; slots: Slot[] }

export type { HarvestSlot, RouteId, TrailerId, TrailerKind, VehicleId, VehicleKind, VehicleSlot }

export function emptyVehicleSlots(): Slot[] {
  return Array.from({ length: VEHICLE_SLOTS }, (): Slot => ({ kind: 'empty' }))
}

export function emptyHarvestSlots(): Slot[] {
  return Array.from({ length: HARVEST_SLOTS }, (): Slot => ({ kind: 'empty' }))
}

export function makeQuad(id: VehicleId, fuel: number, slots: Slot[], pose: VehiclePose): Extract<Vehicle, { kind: 'quad' }> {
  return { kind: 'quad', id, fuel, slots, pose, route: 'none', cursor: 0, running: false, dwell: 0 }
}

export function makeTractor(
  id: VehicleId,
  fuel: number,
  hitch: TrailerId | 'none',
  boom: 3 | 5,
  pose: VehiclePose,
): Extract<Vehicle, { kind: 'tractor' }> {
  return { kind: 'tractor', id, fuel, hitch, boom, pose, route: 'none', cursor: 0, running: false, dwell: 0 }
}

export function hangarPad(base: RectBase): Coord[] {
  const row = base.row + HANGAR_H
  return Array.from({ length: HANGAR_W }, (_, i) => ({ col: base.col + i, row }))
}

export function siloPad(base: RectBase): Coord[] {
  const row = base.row + SILO_H
  return Array.from({ length: SILO_W }, (_, i) => ({ col: base.col + i, row }))
}

export function dropoffPad(base: RectBase): Coord[] {
  return Array.from({ length: base.w }, (_, i) => ({ row: base.row - 1, col: base.col + i }))
}

export function takeupPad(base: RectBase): Coord[] {
  return Array.from({ length: base.w }, (_, i) => ({ row: base.row + base.h, col: base.col + i }))
}

export function onPad(pads: readonly Coord[], at: Coord): boolean {
  return pads.some(p => p.col === at.col && p.row === at.row)
}

export function padCenter(base: RectBase): { x: number; y: number } {
  return { x: base.col + HANGAR_W / 2, y: base.row + HANGAR_H + 0.5 }
}

export function surfaceMul(c: Cell): number {
  if (c.kind === 'untilled' && c.cover.kind === 'tile' && c.cover.tile === 'paved') return SURFACE_PAVED
  if (isTilled(c)) return SURFACE_SLOW
  if (c.kind === 'rock' || isSolid(c)) return SURFACE_SLOW
  return SURFACE_NORMAL
}

export function seekSpeed(speed: number, target: number, accel: number, dt: number): number {
  const step = accel * dt
  const d = target - speed
  if (Math.abs(d) <= step) return target
  return speed + Math.sign(d) * step
}

export function wrapHeading(h: number): number {
  const t = TWO_PI
  const n = h % t
  return n < 0 ? n + t : n
}

export function headingDelta(from: number, to: number): number {
  const d = wrapHeading(to - from)
  return d > Math.PI ? d - TWO_PI : d
}

export function stopXY(s: RouteStop): { x: number; y: number } {
  if (s.kind === 'goto') return { x: s.x, y: s.y }
  return { x: s.at.col + 0.5, y: s.at.row + 0.5 }
}

const TWO_PI = Math.PI * 2

export function hitchP(x: number, y: number, heading: number): { x: number; y: number } {
  return { x: x - HITCH_BACK * Math.cos(heading), y: y - HITCH_BACK * Math.sin(heading) }
}

export function trailerCenter(p: { x: number; y: number }, heading: number): { x: number; y: number } {
  return { x: p.x - (TRAILER_LEN / 2) * Math.cos(heading), y: p.y - (TRAILER_LEN / 2) * Math.sin(heading) }
}

export function followHitch(
  pose: Extract<TrailerPose, { kind: 'attached' }>,
  before: { x: number; y: number; heading: number },
  after: { x: number; y: number; heading: number },
): void {
  const p0 = hitchP(before.x, before.y, before.heading)
  const center = trailerCenter(p0, pose.heading)
  const p1 = hitchP(after.x, after.y, after.heading)
  const rear = {
    x: center.x - (TRAILER_LEN / 2) * Math.cos(pose.heading),
    y: center.y - (TRAILER_LEN / 2) * Math.sin(pose.heading),
  }
  pose.heading = wrapHeading(Math.atan2(p1.y - rear.y, p1.x - rear.x))
}

function proj(px: number, py: number, ax: number, ay: number): number {
  return px * ax + py * ay
}

function overlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a1 >= b0 && b1 >= a0
}

export function boomHits(p: { x: number; y: number }, heading: number, wide: number, inWorld: (at: Coord) => boolean): Coord[] {
  const cos = Math.cos(heading)
  const sin = Math.sin(heading)
  const px = -sin
  const py = cos
  const ha = BOOM_LONG / 2
  const hp = wide / 2
  const corners = [
    { x: p.x + cos * ha + px * hp, y: p.y + sin * ha + py * hp },
    { x: p.x + cos * ha - px * hp, y: p.y + sin * ha - py * hp },
    { x: p.x - cos * ha + px * hp, y: p.y - sin * ha + py * hp },
    { x: p.x - cos * ha - px * hp, y: p.y - sin * ha - py * hp },
  ]
  let minX = corners[0].x
  let maxX = corners[0].x
  let minY = corners[0].y
  let maxY = corners[0].y
  corners.forEach(c => {
    if (c.x < minX) minX = c.x
    if (c.x > maxX) maxX = c.x
    if (c.y < minY) minY = c.y
    if (c.y > maxY) maxY = c.y
  })
  const axes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: cos, y: sin },
    { x: px, y: py },
  ]
  const hits: Coord[] = []
  const col0 = Math.floor(minX)
  const col1 = Math.floor(maxX)
  const row0 = Math.floor(minY)
  const row1 = Math.floor(maxY)
  for (let row = row0; row <= row1; row++) {
    for (let col = col0; col <= col1; col++) {
      const at = { col, row }
      if (!inWorld(at)) continue
      const tile = [
        { x: col, y: row },
        { x: col + 1, y: row },
        { x: col, y: row + 1 },
        { x: col + 1, y: row + 1 },
      ]
      const hit = axes.every(axis => {
        const t = tile.map(c => proj(c.x, c.y, axis.x, axis.y))
        const b = corners.map(c => proj(c.x, c.y, axis.x, axis.y))
        return overlaps(Math.min(...t), Math.max(...t), Math.min(...b), Math.max(...b))
      })
      if (hit) hits.push(at)
    }
  }
  hits.sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row))
  return hits
}

export function cargoCount(item: Item): number {
  if (item.kind === 'seeds' || item.kind === 'fruit' || item.kind === 'dead' || item.kind === 'rotten' || item.kind === 'weed') {
    return item.count
  }
  return 0
}

export function trailerUsed(t: Trailer): number {
  if (t.kind === 'seed') return t.hopper.kind === 'empty' ? 0 : t.hopper.item.count
  if (t.kind === 'spray') return t.hopper.kind === 'empty' ? 0 : Math.floor(t.hopper.item.liters)
  return t.slots.reduce((n, s) => n + (s.kind === 'hold' ? cargoCount(s.item) : 0), 0)
}

export function kindVMax(kind: VehicleKind): number {
  return kind === 'tractor' ? TRACTOR_VMAX : QUAD_VMAX
}

export function kindAccel(kind: VehicleKind): number {
  return kind === 'tractor' ? TRACTOR_ACCEL : QUAD_ACCEL
}

export function kindYaw(kind: VehicleKind): number {
  return kind === 'tractor' ? TRACTOR_YAW : QUAD_YAW
}

export function integrateVehicle(
  pose: Extract<VehiclePose, { kind: 'field' }>,
  drive: Drive,
  dt: number,
  fuel: number,
  surface: number,
  inWorld: (at: Coord) => boolean,
  vMax: number,
  accel: number,
  yaw: number,
): void {
  pose.heading = wrapHeading(pose.heading + drive.steer * yaw * dt)
  const cap = vMax * surface * (fuel > 0 ? 1 : QUAD_EMPTY_MUL)
  const target = drive.throttle === 1 ? cap : drive.throttle === -1 ? -cap : 0
  const braking = pose.speed !== 0 && Math.sign(drive.throttle) === -Math.sign(pose.speed)
  pose.speed = seekSpeed(pose.speed, target, braking ? accel * 2 : accel, dt)
  const nx = pose.x + Math.cos(pose.heading) * pose.speed * dt
  const ny = pose.y + Math.sin(pose.heading) * pose.speed * dt
  if (inWorld({ col: Math.floor(nx), row: Math.floor(ny) })) {
    pose.x = nx
    pose.y = ny
  }
}

export type PadCell = Mill | JamMachine | PotStill | CompostBox | Furnace | Chest | Freezer | SeedSilo | AdditiveStore

export type Cargo =
  | { kind: 'quad'; slots: Slot[] }
  | { kind: 'harvest'; slots: Slot[] }
  | { kind: 'seed'; trailer: Extract<Trailer, { kind: 'seed' }> }
  | { kind: 'spray'; trailer: Extract<Trailer, { kind: 'spray' }> }

export function trailerOf(trailers: readonly Trailer[], id: TrailerId): Trailer {
  const t = trailers.find(x => x.id === id)
  if (t === undefined) throw new Error('hitch')
  return t
}

export function vehicleCargo(v: Vehicle, trailers: readonly Trailer[]): Cargo | undefined {
  if (v.kind === 'quad') return { kind: 'quad', slots: v.slots }
  if (v.hitch === 'none') return undefined
  const t = trailerOf(trailers, v.hitch)
  if (t.kind === 'harvest') return { kind: 'harvest', slots: t.slots }
  if (t.kind === 'seed') return { kind: 'seed', trailer: t }
  return { kind: 'spray', trailer: t }
}

export function dumpAccept(dest: PadCell, item: Item): number {
  if (dest.kind === 'mill') {
    const take = millAccept(dest, item)
    if (take === undefined) return 0
    return take.n
  }
  if (dest.kind === 'jam') {
    const sugar = jamSugarAccept(dest, item)
    if (sugar > 0) return sugar
    return jamFruitAccept(dest, item)
  }
  if (dest.kind === 'still') return stillAccept(dest, item)
  if (dest.kind === 'compost-box') return organic(item) ? 1 : 0
  if (dest.kind === 'furnace') return furnaceAccept(dest, item)
  if (dest.kind === 'chest' || dest.kind === 'freezer') return slotsCouldTake(dest.slots, item, dest.slots.length, undefined) ? 1 : 0
  if (dest.kind === 'seed-silo') {
    if (item.kind !== 'seeds') return 0
    const n = dest.free < item.count ? dest.free : item.count
    return n > 0 ? n : 0
  }
  if (dest.kind === 'additive-store') {
    if (item.kind !== 'fertilizer' && item.kind !== 'synth' && item.kind !== 'compost' && item.kind !== 'weed-spray') return 0
    const n = dest.free < item.liters ? dest.free : item.liters
    return n > 0 ? n : 0
  }
  return 0
}

function dumpApply(dest: PadCell, item: Item, n: number, take: (n: number) => void): void {
  if (dest.kind === 'mill') {
    millApply(dest, item, n)
    take(n)
    return
  }
  if (dest.kind === 'jam') {
    if (item.kind === 'sugar') {
      jamSugarApply(dest, n)
      take(n)
      return
    }
    jamFruitApply(dest, item, n)
    take(n)
    return
  }
  if (dest.kind === 'still') {
    stillApply(dest, item, n)
    take(n)
    return
  }
  if (dest.kind === 'compost-box') {
    dest.units += compostValue(item)
    take(-1)
    return
  }
  if (dest.kind === 'furnace') {
    furnaceApply(dest, item, n)
    take(n)
    return
  }
  if (dest.kind === 'chest' || dest.kind === 'freezer') {
    if (!giveSlots(dest.slots, item, dest.slots.length, undefined)) return
    take(-1)
    return
  }
  if (dest.kind === 'seed-silo' && item.kind === 'seeds') {
    const got = putSiloInto(dest, item.crop, item.variety, item.quality, n)
    if (got > 0) take(got)
    return
  }
  if (dest.kind === 'additive-store' && (item.kind === 'fertilizer' || item.kind === 'synth' || item.kind === 'compost' || item.kind === 'weed-spray')) {
    const got = putAdditiveInto(dest, item.kind, n)
    if (got > 0) take(got)
  }
}

export function canDumpCargo(cargo: Cargo, dest: PadCell): boolean {
  return cargoSome(cargo, item => dumpAccept(dest, item) > 0)
}

export function dumpCargo(cargo: Cargo, dest: PadCell): void {
  cargoEach(cargo, (item, take) => {
    const n = dumpAccept(dest, item)
    if (n <= 0) return
    dumpApply(dest, item, n, take)
  })
  compactCargo(cargo)
}

export function canPull(src: PadCell, cargo: Cargo, drops: readonly Drop[]): boolean {
  if (src.kind === 'chest' || src.kind === 'freezer') {
    return src.slots.some(s => s.kind === 'hold' && cargoCouldTake(cargo, s.item))
  }
  if (src.kind === 'seed-silo') {
    return src.seeds.some(
      st => st.count > 0 && cargoCouldTake(cargo, { kind: 'seeds', crop: st.crop, variety: st.variety, quality: st.quality, count: st.count }),
    )
  }
  if (src.kind === 'additive-store') {
    return src.held.some(h => {
      if (h.liters <= 0) return false
      const bag = ADDITIVE_BAG[h.id]
      const liters = bag < h.liters ? bag : h.liters
      return cargoCouldTake(cargo, { kind: h.id, liters, capacityLiters: bag })
    })
  }
  return takeupPad(src.base).some(p => drops.some(d => d.at.col === p.col && d.at.row === p.row && cargoCouldTake(cargo, d.item)))
}

export function pullFrom(src: PadCell, cargo: Cargo, drops: Drop[]): void {
  if (src.kind === 'chest' || src.kind === 'freezer') pullSlots(src.slots, cargo)
  else if (src.kind === 'seed-silo') pullSilo(src, cargo)
  else if (src.kind === 'additive-store') pullAdditive(src, cargo)
  else pullDrops(takeupPad(src.base), cargo, drops)
}

function pullSlots(slots: Slot[], cargo: Cargo): void {
  slots.forEach((s, i) => {
    if (s.kind !== 'hold') return
    if (giveCargo(cargo, s.item)) slots[i] = { kind: 'empty' }
  })
  compactSlots(slots)
}

function pullSilo(silo: SeedSilo, cargo: Cargo): void {
  for (let i = 0; i < silo.seeds.length; ) {
    const st = silo.seeds[i]
    const item: Item = { kind: 'seeds', crop: st.crop, variety: st.variety, quality: st.quality, count: st.count }
    giveCargo(cargo, item)
    st.count = item.count
    if (st.count <= 0) silo.seeds.splice(i, 1)
    else i += 1
  }
}

function pullAdditive(store: AdditiveStore, cargo: Cargo): void {
  for (let i = 0; i < store.held.length; ) {
    const h = store.held[i]
    const bag = ADDITIVE_BAG[h.id]
    while (h.liters > 0) {
      const liters = bag < h.liters ? bag : h.liters
      const item: Extract<Item, { kind: AdditiveId }> = { kind: h.id, liters, capacityLiters: bag }
      const before = item.liters
      giveCargo(cargo, item)
      const taken = before - item.liters
      if (taken <= 0) break
      h.liters -= taken
    }
    if (h.liters <= 0) store.held.splice(i, 1)
    else i += 1
  }
}

function pullDrops(pads: Coord[], cargo: Cargo, drops: Drop[]): void {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]
    if (!onPad(pads, d.at)) continue
    if (giveCargo(cargo, d.item)) drops.splice(i, 1)
  }
}

function cargoSome(cargo: Cargo, fn: (item: Item) => boolean): boolean {
  if (cargo.kind === 'quad' || cargo.kind === 'harvest') {
    return cargo.slots.some(s => s.kind === 'hold' && fn(s.item))
  }
  if (cargo.kind === 'seed') return cargo.trailer.hopper.kind === 'hold' && fn(cargo.trailer.hopper.item)
  return cargo.trailer.hopper.kind === 'hold' && fn(cargo.trailer.hopper.item)
}

function cargoEach(cargo: Cargo, fn: (item: Item, take: (n: number) => void) => void): void {
  if (cargo.kind === 'quad' || cargo.kind === 'harvest') {
    cargo.slots.forEach((s, i) => {
      if (s.kind !== 'hold') return
      fn(s.item, n => {
        if (n < 0 || takeItemCount(s.item, n)) cargo.slots[i] = { kind: 'empty' }
      })
    })
    return
  }
  if (cargo.trailer.hopper.kind !== 'hold') return
  const held = cargo.trailer.hopper.item
  fn(held, n => {
    if (n < 0 || takeItemCount(held, n)) cargo.trailer.hopper = { kind: 'empty' }
  })
}

function compactCargo(cargo: Cargo): void {
  if (cargo.kind === 'quad' || cargo.kind === 'harvest') compactSlots(cargo.slots)
}

function cargoCouldTake(cargo: Cargo, item: Item): boolean {
  if (cargo.kind === 'quad') return slotsCouldTake(cargo.slots, item, VEHICLE_SLOTS, undefined)
  if (cargo.kind === 'harvest') return slotsCouldTake(cargo.slots, item, HARVEST_SLOTS, TRAILER_CAP)
  if (cargo.kind === 'seed') {
    if (item.kind !== 'seeds') return false
    if (cargo.trailer.hopper.kind === 'empty') return item.count > 0
    const h = cargo.trailer.hopper.item
    if (h.crop !== item.crop || h.variety !== item.variety) return false
    return h.count < TRAILER_CAP
  }
  if (item.kind !== 'fertilizer' && item.kind !== 'synth' && item.kind !== 'compost') return false
  if (cargo.trailer.hopper.kind === 'empty') return item.liters > 0
  if (cargo.trailer.hopper.item.kind !== item.kind) return false
  return Math.floor(cargo.trailer.hopper.item.liters) < TRAILER_CAP
}

function copyItem(item: Item): Item {
  switch (item.kind) {
    case 'shovel':
    case 'pickaxe':
    case 'container':
    case 'fertilizer':
    case 'synth':
    case 'compost':
    case 'seeds':
    case 'grass-seeds':
    case 'fruit':
    case 'tree-seed':
    case 'graft':
    case 'sugar':
    case 'spirit':
    case 'cask':
    case 'jam':
    case 'oil':
    case 'flour':
    case 'extract':
    case 'rotten':
    case 'dead':
    case 'weed':
    case 'grass':
    case 'weed-spray':
    case 'axe':
    case 'wood':
    case 'ash':
      return { ...item }
  }
}

function slotsCouldTake(slots: Slot[], item: Item, maxSlots: number, maxUsed: number | undefined): boolean {
  const add = cargoCount(item)
  const used = slots.reduce((n, s) => n + (s.kind === 'hold' ? cargoCount(s.item) : 0), 0)
  if (maxUsed !== undefined && add > 0 && used >= maxUsed) return false
  const copy: Slot[] = slots.map(s => (s.kind === 'empty' ? { kind: 'empty' } : { kind: 'hold', item: copyItem(s.item) }))
  const piece =
    add > 0 && maxUsed !== undefined && (item.kind === 'seeds' || item.kind === 'fruit' || item.kind === 'dead' || item.kind === 'rotten' || item.kind === 'weed')
      ? { ...item, count: add < maxUsed - used ? add : maxUsed - used }
      : copyItem(item)
  const empty = copy.findIndex(s => s.kind === 'empty')
  if (empty >= 0) copy[empty] = { kind: 'hold', item: piece }
  else copy.push({ kind: 'hold', item: piece })
  compactSlots(copy)
  return copy.filter(s => s.kind === 'hold').length <= maxSlots
}

function giveCargo(cargo: Cargo, item: Item): boolean {
  if (cargo.kind === 'quad') return giveSlots(cargo.slots, item, VEHICLE_SLOTS, undefined)
  if (cargo.kind === 'harvest') return giveSlots(cargo.slots, item, HARVEST_SLOTS, TRAILER_CAP)
  if (cargo.kind === 'seed') {
    if (item.kind !== 'seeds') return false
    const have = cargo.trailer.hopper.kind === 'empty' ? 0 : cargo.trailer.hopper.item.count
    if (cargo.trailer.hopper.kind === 'hold') {
      const h = cargo.trailer.hopper.item
      if (h.crop !== item.crop || h.variety !== item.variety) return false
    }
    const n = item.count < TRAILER_CAP - have ? item.count : TRAILER_CAP - have
    if (n <= 0) return false
    if (cargo.trailer.hopper.kind === 'empty') {
      cargo.trailer.hopper = { kind: 'hold', item: { kind: 'seeds', crop: item.crop, variety: item.variety, quality: item.quality, count: n } }
    } else {
      cargo.trailer.hopper.item.quality =
        (cargo.trailer.hopper.item.quality * cargo.trailer.hopper.item.count + item.quality * n) /
        (cargo.trailer.hopper.item.count + n)
      cargo.trailer.hopper.item.count += n
    }
    item.count -= n
    return item.count <= 0
  }
  if (item.kind !== 'fertilizer' && item.kind !== 'synth' && item.kind !== 'compost') return false
  const have = cargo.trailer.hopper.kind === 'empty' ? 0 : cargo.trailer.hopper.item.liters
  if (cargo.trailer.hopper.kind === 'hold' && cargo.trailer.hopper.item.kind !== item.kind) return false
  const room = TRAILER_CAP - Math.floor(have)
  const n = item.liters < room ? item.liters : room
  if (n <= 0) return false
  if (cargo.trailer.hopper.kind === 'empty') {
    cargo.trailer.hopper = { kind: 'hold', item: { kind: item.kind, liters: n, capacityLiters: item.capacityLiters } }
  } else cargo.trailer.hopper.item.liters += n
  item.liters -= n
  return item.liters <= 0
}

function giveSlots(slots: Slot[], item: Item, maxSlots: number, maxUsed: number | undefined): boolean {
  const used = slots.reduce((n, s) => n + (s.kind === 'hold' ? cargoCount(s.item) : 0), 0)
  if (
    item.kind === 'fruit' ||
    item.kind === 'seeds' ||
    item.kind === 'dead' ||
    item.kind === 'rotten' ||
    item.kind === 'weed' ||
    item.kind === 'grass'
  ) {
    const room = maxUsed === undefined ? item.count : maxUsed - used
    const n = item.count < room ? item.count : room
    if (n <= 0) return false
    const piece = { ...item, count: n }
    if (!insertSlots(slots, piece, maxSlots, maxUsed)) return false
    item.count -= n
    return item.count <= 0
  }
  if (item.kind === 'sugar' || item.kind === 'fertilizer' || item.kind === 'synth' || item.kind === 'compost' || item.kind === 'weed-spray') {
    const piece = { ...item }
    if (!insertSlots(slots, piece, maxSlots, undefined)) return false
    item.liters = 0
    return true
  }
  if (!insertSlots(slots, item, maxSlots, undefined)) return false
  return true
}

function putSiloInto(silo: SeedSilo, crop: AnnualId, variety: VarietyId, quality: number, count: number): number {
  const n = Math.min(count, silo.free)
  if (n <= 0) return 0
  const hit = silo.seeds.find(st => st.crop === crop && st.variety === variety)
  if (hit !== undefined) {
    hit.quality = (hit.quality * hit.count + quality * n) / (hit.count + n)
    hit.count += n
  } else silo.seeds.push({ crop, variety, quality, count: n })
  return n
}

function putAdditiveInto(store: AdditiveStore, id: AdditiveId, liters: number): number {
  const n = Math.min(liters, store.free)
  if (n <= 0) return 0
  const hit = store.held.find(h => h.id === id)
  if (hit !== undefined) hit.liters += n
  else store.held.push({ id, liters: n })
  return n
}

function takeItemCount(item: Item, n: number): boolean {
  if ('count' in item) {
    item.count -= n
    return item.count <= 0
  }
  if ('liters' in item) {
    item.liters -= n
    return item.liters <= 0
  }
  return true
}

export function insertSlots(slots: Slot[], item: Item, maxSlots: number, maxUsed: number | undefined): boolean {
  const n = cargoCount(item)
  const used = slots.reduce((s, x) => s + (x.kind === 'hold' ? cargoCount(x.item) : 0), 0)
  if (maxUsed !== undefined && used + n > maxUsed) return false
  const copy: Slot[] = slots.map(s => (s.kind === 'empty' ? { kind: 'empty' as const } : { kind: 'hold' as const, item: s.item }))
  const empty = copy.findIndex(s => s.kind === 'empty')
  if (empty >= 0) copy[empty] = { kind: 'hold', item }
  else copy.push({ kind: 'hold', item })
  compactSlots(copy)
  const kept = copy.filter(s => s.kind === 'hold')
  if (kept.length > maxSlots) return false
  for (let i = 0; i < maxSlots; i++) {
    slots[i] = i < kept.length ? kept[i] : { kind: 'empty' }
  }
  return true
}

export function compactSlots(slots: Slot[]): void {
  const kept: Slot[] = []
  slots.forEach(slot => {
    if (slot.kind === 'empty') return
    if (slot.item.kind === 'seeds' || slot.item.kind === 'fruit') {
      const kind = slot.item.kind
      const crop = slot.item.crop
      const variety = slot.item.variety
      const hit = kept.find(
        s =>
          s.kind === 'hold' &&
          s.item.kind === kind &&
          (s.item.kind === 'seeds' || s.item.kind === 'fruit') &&
          s.item.crop === crop &&
          s.item.variety === variety,
      )
      if (hit !== undefined && hit.kind === 'hold' && (hit.item.kind === 'seeds' || hit.item.kind === 'fruit')) {
        mergeInto(hit.item, slot.item, slot.item.count)
        return
      }
    }
    if (slot.item.kind === 'sugar') {
      const hit = kept.find(s => s.kind === 'hold' && s.item.kind === 'sugar')
      if (hit !== undefined && hit.kind === 'hold' && hit.item.kind === 'sugar') {
        const m = mergeSugar(hit.item, slot.item)
        hit.item.liters = m.liters
        hit.item.capacityLiters = m.capacityLiters
        hit.item.unitSale = m.unitSale
        hit.item.quality = m.quality
        return
      }
    }
    if (
      slot.item.kind === 'spirit' ||
      slot.item.kind === 'cask' ||
      slot.item.kind === 'jam' ||
      slot.item.kind === 'oil' ||
      slot.item.kind === 'flour' ||
      slot.item.kind === 'extract'
    ) {
      const it = slot.item
      const hit = kept.find(
        s =>
          s.kind === 'hold' &&
          s.item.kind === it.kind &&
          (it.kind !== 'spirit' || (s.item.kind === 'spirit' && s.item.spirit === it.spirit && s.item.variety === it.variety)) &&
          (it.kind !== 'cask' || (s.item.kind === 'cask' && s.item.cask === it.cask && s.item.variety === it.variety)) &&
          (it.kind !== 'jam' || (s.item.kind === 'jam' && s.item.crop === it.crop && s.item.variety === it.variety)),
      )
      if (hit !== undefined && hit.kind === 'hold' && countable(hit.item) && countable(it) && stackable(hit.item, it)) {
        mergeInto(hit.item, it, it.count)
        return
      }
    }
    if (slot.item.kind === 'rotten' || slot.item.kind === 'dead') {
      const kind = slot.item.kind
      const cls = slot.item.cls
      const hit = kept.find(
        s =>
          s.kind === 'hold' &&
          s.item.kind === kind &&
          (s.item.kind === 'rotten' || s.item.kind === 'dead') &&
          s.item.cls === cls,
      )
      if (hit !== undefined && hit.kind === 'hold' && (hit.item.kind === 'rotten' || hit.item.kind === 'dead')) {
        hit.item.count += slot.item.count
        return
      }
    }
    if (slot.item.kind === 'weed' || slot.item.kind === 'grass') {
      const kind = slot.item.kind
      const hit = kept.find(s => s.kind === 'hold' && s.item.kind === kind)
      if (hit !== undefined && hit.kind === 'hold' && (hit.item.kind === 'weed' || hit.item.kind === 'grass')) {
        hit.item.count += slot.item.count
        return
      }
    }
    kept.push(slot)
  })
  kept.forEach((s, i) => {
    slots[i] = s
  })
  for (let i = kept.length; i < slots.length; i++) slots[i] = { kind: 'empty' }
}
