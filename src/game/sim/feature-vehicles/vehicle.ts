import { CROPS } from '../../defs/crops.ts'
import {
  AUTO_DECEL_MUL,
  DISPATCH_DWELL,
  AUTO_VMAX_MUL,
  BOOM_LONG,
  HANGAR_H,
  HANGAR_W,
  HEADING_SOUTH,
  SILO_H,
  SILO_W,
  SUGAR_BAG,
  HARVEST_SLOTS,
  HITCH_BACK,
  QUAD_ACCEL,
  QUAD_EMPTY_MUL,
  QUAD_FUEL_SECONDS,
  QUAD_PRICE,
  QUAD_REFILL,
  QUAD_VMAX,
  QUAD_YAW,
  ROUTE_ALIGN,
  ROUTE_ARRIVE,
  SURFACE_NORMAL,
  SURFACE_PAVED,
  SURFACE_SLOW,
  TRACTOR_ACCEL,
  TRACTOR_PRICE,
  TRACTOR_VMAX,
  TRACTOR_YAW,
  TRAILER_CAP,
  TRAILER_HARVEST_PRICE,
  TRAILER_LEN,
  TRAILER_SEED_PRICE,
  TRAILER_SPRAY_PRICE,
  VEHICLE_SLOTS,
} from '../../defs/items.ts'
import type { HarvestSlot, TrailerId, TrailerKind, VehicleId, VehicleKind, VehicleSlot } from '../ids.ts'
import {
  cargoCount,
  compactSlots,
  fruitStack,
  giveSlots,
  insertSlots,
  slotsCouldTake,
  type Item,
  type Slot,
} from '../item.ts'
import {
  ADDITIVE_BAG,
  type AdditiveId,
  type AdditiveStore,
  type Coord,
  type RectBase,
  type SeedSilo,
  type SugarBin,
} from '../building.ts'
import type { Drop } from '../drop.ts'
import { Act, type Cmd } from '../log.ts'
import { statsOf } from '../modifiers.ts'
import { Plant } from '../plant.ts'
import { isSolid, isTilled, type Cell } from '../plot.ts'
import { FERT_PLOT_MAX } from '../soil.ts'
import { stepHold, type Sensor } from '../sensor.ts'
import type { SeatId, World } from '../world.ts'
import type {
  Cargo,
  Drive,
  PadCell,
  Route,
  RouteStop,
  Trailer,
  TrailerPose,
  Vehicle,
  VehiclePose,
} from './vehicle.h.ts'

export { cargoCount, compactSlots, insertSlots }

export type {
  Cargo,
  Drive,
  HarvestSlot,
  PadCell,
  Route,
  RouteId,
  RouteStop,
  SeedHopper,
  SprayHopper,
  Trailer,
  TrailerId,
  TrailerKind,
  TrailerPose,
  Vehicle,
  VehicleId,
  VehicleKind,
  VehiclePose,
  VehicleSlot,
} from './vehicle.h.ts'

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

export function isPadCell(c: Cell): c is PadCell {
  return 'pads' in c && c.pads === 'both'
}

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
  return dest.accept(item)
}

function dumpApply(dest: PadCell, item: Item, n: number, take: (n: number) => void): void {
  dest.apply(item, n)
  take(dest.takeAll ? -1 : n)
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
    if (
      src.sugar.liters > 0 &&
      cargoCouldTake(cargo, sugarBag(src.sugar, src.sugar.liters < SUGAR_BAG ? src.sugar.liters : SUGAR_BAG))
    ) {
      return true
    }
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
  else if (src.kind === 'additive-store') {
    pullSugar(src, cargo)
    pullAdditive(src, cargo)
  }
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

function sugarBag(bin: SugarBin, liters: number): Extract<Item, { kind: 'sugar' }> {
  return { kind: 'sugar', liters, capacityLiters: SUGAR_BAG, unitSale: bin.unitSale, quality: bin.quality }
}

export function putSugarInto(store: AdditiveStore, liters: number, unitSale: number, quality: number): number {
  return store.putSugar(liters, unitSale, quality)
}

function pullSugar(store: AdditiveStore, cargo: Cargo): void {
  while (store.sugar.liters > 0) {
    const liters = store.sugar.liters < SUGAR_BAG ? store.sugar.liters : SUGAR_BAG
    const item = sugarBag(store.sugar, liters)
    giveCargo(cargo, item)
    const taken = liters - item.liters
    if (taken <= 0) return
    store.sugar.liters -= taken
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

export function storedHere(p: VehiclePose | TrailerPose, origin: Coord): boolean {
  return p.kind === 'stored' && p.hangar.col === origin.col && p.hangar.row === origin.row
}

function harvestInsert(slots: Slot[], item: Item): boolean {
  return insertSlots(slots, item, HARVEST_SLOTS, TRAILER_CAP)
}

export function driverVehicle(w: World, id: SeatId): Vehicle | undefined {
  return w.vehicles.find(v => v.pose.kind === 'field' && v.pose.driver === id)
}

export function cargo(w: World): Cargo | undefined {
  const v = driverVehicle(w, w.act.id)
  if (v?.pose.kind !== 'field') return undefined
  return vehicleCargo(v, w.trailers)
}

export function padBuildings(w: World): PadCell[] {
  const out: PadCell[] = []
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (
      c.kind === 'mill' ||
      c.kind === 'jam' ||
      c.kind === 'still' ||
      c.kind === 'compost-box' ||
      c.kind === 'furnace' ||
      c.kind === 'station'
    ) {
      out.push(c)
    }
  }
  for (const at of w.stores.values()) {
    const c = w.cell(at)
    if (c.kind === 'chest' || c.kind === 'freezer') out.push(c)
  }
  out.push(w.silo, w.additives)
  return out
}

export function padHit(w: World, at: Coord): { cell: PadCell; side: 'dropoff' | 'takeup' } | undefined {
  for (const cell of padBuildings(w)) {
    if (onPad(dropoffPad(cell.base), at)) return { cell, side: 'dropoff' }
    if (onPad(takeupPad(cell.base), at)) return { cell, side: 'takeup' }
  }
  return undefined
}

export function driveBody(w: World, throttle: -1 | 0 | 1, steer: -1 | 0 | 1): void {
  if (driverVehicle(w, w.act.id) === undefined) return
  w.act.drive = { throttle, steer }
  w.ping()
}

export function buyVehicleBody(w: World, at: Coord, k: VehicleKind): void {
  if (!w.done.has('unlock-vehicles')) return
  const price = k === 'quad' ? QUAD_PRICE : TRACTOR_PRICE
  if (w.money < price) return
  const origin = w.hangarOrigin(at)
  if (origin === undefined) return
  w.money -= price
  const id = w.nextVehicleId
  w.nextVehicleId += 1
  const pose = { kind: 'stored' as const, hangar: { ...origin } }
  w.vehicles.push(k === 'quad' ? makeQuad(id, 1, emptyVehicleSlots(), pose) : makeTractor(id, 1, 'none', 5, pose))
  w.ping()
}

export function buyTrailerBody(w: World, at: Coord, k: TrailerKind): void {
  if (!w.done.has('unlock-vehicles')) return
  const price = k === 'seed' ? TRAILER_SEED_PRICE : k === 'spray' ? TRAILER_SPRAY_PRICE : TRAILER_HARVEST_PRICE
  if (w.money < price) return
  const origin = w.hangarOrigin(at)
  if (origin === undefined) return
  w.money -= price
  const id = w.nextTrailerId
  w.nextTrailerId += 1
  const pose = { kind: 'stored' as const, hangar: { ...origin } }
  const trailer: Trailer =
    k === 'seed'
      ? { kind: 'seed', id, pose, hopper: { kind: 'empty' } }
      : k === 'spray'
        ? { kind: 'spray', id, pose, hopper: { kind: 'empty' } }
        : { kind: 'harvest', id, pose, slots: emptyHarvestSlots() }
  w.trailers.push(trailer)
  w.ping()
}

export function deployBody(w: World, id: VehicleId, at: Coord, hitch: TrailerId | 'none'): void {
  const v = w.vehicles.find(x => x.id === id)
  if (v?.pose.kind !== 'stored') return
  if (driverVehicle(w, w.act.id) !== undefined) return
  const origin = w.hangarOrigin(at)
  if (origin === undefined) return
  const hangar = w.cell(origin)
  if (hangar.kind !== 'hangar') return
  const pad = padCenter(hangar.base)
  if (!w.inWorld({ col: Math.floor(pad.x), row: Math.floor(pad.y) })) return
  if (v.kind === 'quad' && hitch !== 'none') return
  let trailer: Trailer | undefined
  if (v.kind === 'tractor') {
    if (hitch !== 'none') {
      trailer = w.trailers.find(x => x.id === hitch)
      if (trailer?.pose.kind !== 'stored') return
    }
    v.hitch = hitch
  }
  v.pose = {
    kind: 'field',
    x: pad.x,
    y: pad.y,
    heading: HEADING_SOUTH,
    speed: 0,
    driver: w.act.id,
  }
  if (trailer !== undefined) {
    trailer.pose = { kind: 'attached', vehicle: id, heading: HEADING_SOUTH }
  }
  w.act.drive = { throttle: 0, steer: 0 }
  w.act.queue.length = 0
  w.act.workLeft = 0
  w.act.workTotal = 0
  w.act.filling = false
  w.act.cue = { kind: 'none' }
  w.act.actor.x = pad.x
  w.act.actor.y = pad.y
  w.ping()
}

export function board(w: World, v: Vehicle): void {
  if (v.pose.kind !== 'field') return
  v.pose.driver = w.act.id
  w.act.drive = { throttle: 0, steer: 0 }
  w.act.queue.length = 0
  w.act.workLeft = 0
  w.act.workTotal = 0
  w.act.filling = false
  w.act.cue = { kind: 'none' }
  w.act.actor.x = v.pose.x
  w.act.actor.y = v.pose.y
}

export function embarkBody(w: World, id: VehicleId): void {
  const v = w.vehicles.find(x => x.id === id)
  if (v?.pose.kind !== 'field' || v.pose.driver !== 'none') return
  if (driverVehicle(w, w.act.id) !== undefined) return
  if (v.running) {
    v.running = false
    v.pose.speed = 0
  }
  const floor = { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) }
  if (w.act.actor.inside(floor)) {
    board(w, v)
    w.ping()
    return
  }
  w.enqueueOn(w.act, { act: 'embark', id })
}

export function disembarkBody(w: World): void {
  const v = driverVehicle(w, w.act.id)
  if (v?.pose.kind !== 'field') return
  v.pose.speed = 0
  v.pose.driver = 'none'
  w.act.actor.x = v.pose.x
  w.act.actor.y = v.pose.y
  w.act.drive = { throttle: 0, steer: 0 }
  w.act.queue.length = 0
  w.ping()
}

export function dockBody(w: World): void {
  const v = driverVehicle(w, w.act.id)
  if (v?.pose.kind !== 'field') return
  const hangar = w.hangarAtPad({ col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
  if (hangar === undefined) return
  const x = v.pose.x
  const y = v.pose.y
  const origin = { col: hangar.base.col, row: hangar.base.row }
  if (v.kind === 'tractor' && v.hitch !== 'none') {
    const t = w.trailers.find(x => x.id === v.hitch)
    if (t !== undefined) t.pose = { kind: 'stored', hangar: origin }
    v.hitch = 'none'
  }
  v.pose = { kind: 'stored', hangar: origin }
  v.running = false
  w.act.actor.x = x
  w.act.actor.y = y
  w.act.drive = { throttle: 0, steer: 0 }
  w.act.queue.length = 0
  w.ping()
}

export function swapVehicleBody(w: World, id: VehicleId, i: VehicleSlot): void {
  const v = w.vehicles.find(x => x.id === id)
  if (v?.kind !== 'quad' || v.pose.kind !== 'field' || v.pose.driver !== 'none' || v.running) return
  const held = w.act.hand
  w.act.hand = v.slots[i]
  v.slots[i] = held
  compactSlots(v.slots)
  w.ping()
}

export function swapTrailerBody(w: World, u: TrailerId, i: HarvestSlot): void {
  const t = w.trailers.find(x => x.id === u)
  if (t?.pose.kind !== 'attached') return
  const hitch = t.pose.vehicle
  const v = w.vehicles.find(x => x.id === hitch)
  if (v?.kind !== 'tractor' || v.pose.kind !== 'field' || v.pose.driver !== 'none' || v.running) return
  if (t.kind === 'seed') {
    if (i !== 0) return
    const hand = w.act.hand
    if (hand.kind === 'hold') {
      if (hand.item.kind !== 'seeds') return
      if (hand.item.count > TRAILER_CAP) return
      w.act.hand = t.hopper.kind === 'empty' ? { kind: 'empty' } : { kind: 'hold', item: t.hopper.item }
      t.hopper = { kind: 'hold', item: hand.item }
    } else {
      w.act.hand = t.hopper.kind === 'empty' ? { kind: 'empty' } : { kind: 'hold', item: t.hopper.item }
      t.hopper = { kind: 'empty' }
    }
    w.ping()
    return
  }
  if (t.kind === 'spray') {
    if (i !== 0) return
    const hand = w.act.hand
    if (hand.kind === 'hold') {
      if (hand.item.kind !== 'fertilizer' && hand.item.kind !== 'synth' && hand.item.kind !== 'compost') return
      if (Math.floor(hand.item.liters) > TRAILER_CAP) return
      w.act.hand = t.hopper.kind === 'empty' ? { kind: 'empty' } : { kind: 'hold', item: t.hopper.item }
      t.hopper = { kind: 'hold', item: hand.item }
    } else {
      w.act.hand = t.hopper.kind === 'empty' ? { kind: 'empty' } : { kind: 'hold', item: t.hopper.item }
      t.hopper = { kind: 'empty' }
    }
    w.ping()
    return
  }
  const slot = t.slots[i]
  const incoming = w.act.hand.kind === 'hold' ? cargoCount(w.act.hand.item) : 0
  const outgoing = slot.kind === 'hold' ? cargoCount(slot.item) : 0
  if (trailerUsed(t) - outgoing + incoming > TRAILER_CAP) return
  const held = w.act.hand
  w.act.hand = slot
  t.slots[i] = held
  compactSlots(t.slots)
  w.ping()
}

export function refillBody(w: World, at: Coord): void {
  if (w.hangarOrigin(at) === undefined) return
  const cost = w.vehicles.reduce((n, v) => n + (1 - v.fuel) * QUAD_REFILL, 0)
  if (w.money < cost) return
  w.money -= cost
  w.vehicles.forEach(v => {
    v.fuel = 1
  })
  w.ping()
}

export function setBoomBody(w: World, width: 3 | 5): void {
  const v = driverVehicle(w, w.act.id)
  if (v?.kind !== 'tractor') return
  v.boom = width
  w.ping()
}

export function stopLegal(w: World, s: RouteStop): boolean {
  if (s.kind === 'goto') return w.inWorld({ col: Math.floor(s.x), row: Math.floor(s.y) })
  if (!w.inWorld(s.at)) return false
  if (s.kind === 'wait') return w.cell(s.at).kind === 'traffic-light'
  const hit = padHit(w, s.at)
  if (hit === undefined) return false
  if (s.kind === 'unload') return hit.side === 'dropoff'
  return hit.side === 'takeup'
}

export function stripRouteStops(w: World, route: Route, drop: (s: RouteStop, i: number) => boolean): void {
  const map: number[] = []
  const kept: RouteStop[] = []
  route.stops.forEach((s, i) => {
    if (drop(s, i)) map[i] = -1
    else {
      map[i] = kept.length
      kept.push(s)
    }
  })
  route.stops = kept
  w.vehicles.forEach(v => {
    if (v.route !== route.id) return
    if (kept.length === 0) {
      v.cursor = 0
      v.running = false
      return
    }
    if (map[v.cursor] >= 0) {
      v.cursor = map[v.cursor]
      return
    }
    let j = v.cursor + 1
    while (j < map.length && map[j] < 0) j += 1
    v.cursor = j < map.length ? map[j] : 0
  })
}

export function stripStops(w: World, drop: (s: RouteStop) => boolean): void {
  w.routes.forEach(r => stripRouteStops(w, r, s => drop(s)))
}

export function stripPadStops(w: World, cell: PadCell): void {
  const pads = [...dropoffPad(cell.base), ...takeupPad(cell.base)]
  stripStops(
    w,
    s => (s.kind === 'load' || s.kind === 'unload') && pads.some(p => p.col === s.at.col && p.row === s.at.row),
  )
}

export function routeBody(w: World, cmd: Extract<Cmd, { a: typeof Act.route }>): void {
  if (!w.done.has('unlock-dispatch')) return
  if (cmd.k === 'create') {
    const id = w.nextRouteId
    w.nextRouteId += 1
    w.routes.push({ id, name: `Route ${id}`, stops: [] })
    w.ping()
    return
  }
  if (cmd.k === 'delete') {
    if (w.vehicles.some(v => v.route === cmd.r)) return
    const i = w.routes.findIndex(r => r.id === cmd.r)
    if (i < 0) return
    w.routes.splice(i, 1)
    w.ping()
    return
  }
  if (cmd.k === 'assign') {
    const v = w.vehicles.find(x => x.id === cmd.v)
    if (v === undefined) return
    if (cmd.r === 'none') {
      v.route = 'none'
      v.cursor = 0
      v.running = false
      w.ping()
      return
    }
    const route = w.routeById(cmd.r)
    if (route === undefined) return
    if (v.route !== cmd.r) v.cursor = 0
    v.route = cmd.r
    if (route.stops.length === 0) v.running = false
    w.ping()
    return
  }
  if (cmd.k === 'add') {
    const route = w.routeById(cmd.r)
    if (route === undefined) return
    if (!stopLegal(w, cmd.s)) return
    route.stops.push(cmd.s)
    w.ping()
    return
  }
  if (cmd.k === 'remove') {
    const route = w.routeById(cmd.r)
    if (route === undefined) return
    if (cmd.i < 0 || cmd.i >= route.stops.length) return
    stripRouteStops(w, route, (_s, i) => i === cmd.i)
    w.ping()
    return
  }
  if (cmd.k === 'reorder') {
    const route = w.routeById(cmd.r)
    if (route === undefined) return
    const j = cmd.i + cmd.d
    if (cmd.i < 0 || cmd.i >= route.stops.length || j < 0 || j >= route.stops.length) return
    const a = route.stops[cmd.i]
    route.stops[cmd.i] = route.stops[j]
    route.stops[j] = a
    w.vehicles.forEach(v => {
      if (v.route !== route.id) return
      if (v.cursor === cmd.i) v.cursor = j
      else if (v.cursor === j) v.cursor = cmd.i
    })
    w.ping()
    return
  }
  if (cmd.k === 'rename') {
    if (cmd.n === '') return
    const route = w.routeById(cmd.r)
    if (route === undefined) return
    route.name = cmd.n
    w.ping()
    return
  }
  if (cmd.k === 'start') {
    const v = driverVehicle(w, w.act.id)
    if (v?.pose.kind !== 'field' || v.route === 'none') return
    const route = w.routeById(v.route)
    if (!(route?.stops.length)) return
    disembarkBody(w)
    v.running = true
    v.dwell = 0
    w.ping()
    return
  }
  if (cmd.k === 'automate') {
    const v = w.vehicles.find(x => x.id === cmd.v)
    if (v?.pose.kind !== 'stored' || v.route === 'none') return
    const route = w.routeById(v.route)
    if (!(route?.stops.length)) return
    const origin = w.hangarOrigin({ col: cmd.c[0], row: cmd.c[1] })
    if (origin === undefined) return
    const hangar = w.cell(origin)
    if (hangar.kind !== 'hangar') return
    const pad = padCenter(hangar.base)
    if (!w.inWorld({ col: Math.floor(pad.x), row: Math.floor(pad.y) })) return
    v.pose = {
      kind: 'field',
      x: pad.x,
      y: pad.y,
      heading: HEADING_SOUTH,
      speed: 0,
      driver: 'none',
    }
    v.cursor = 0
    v.running = true
    v.dwell = 0
    w.ping()
  }
}

export function stopArrived(pose: Extract<VehiclePose, { kind: 'field' }>, stop: RouteStop): boolean {
  if (stop.kind === 'goto') return Math.hypot(pose.x - stop.x, pose.y - stop.y) <= ROUTE_ARRIVE
  if (Math.floor(pose.x) !== stop.at.col || Math.floor(pose.y) !== stop.at.row) return false
  return pose.speed === 0
}

export function advanceRoute(v: Vehicle, route: Route): void {
  v.cursor = (v.cursor + 1) % route.stops.length
  v.dwell = 0
}

function arriveGoto(w: World, v: Vehicle, pose: Extract<VehiclePose, { kind: 'field' }>): void {
  if (v.route === 'none') return
  const route = w.routeById(v.route)
  if (!(route?.stops.length)) return
  const stop = route.stops[v.cursor]
  if (stop.kind !== 'goto') return
  if (Math.hypot(pose.x - stop.x, pose.y - stop.y) > ROUTE_ARRIVE) return
  advanceRoute(v, route)
}

function autoDrive(w: World, v: Vehicle, pose: Extract<VehiclePose, { kind: 'field' }>): Drive {
  const zero: Drive = { throttle: 0, steer: 0 }
  if (v.fuel === 0) return zero
  if (v.dwell > 0) return zero
  if (v.route === 'none') return zero
  const route = w.routeById(v.route)
  if (!(route?.stops.length)) return zero
  const stop = route.stops[v.cursor]
  if (stopArrived(pose, stop)) return zero
  if (stop.kind !== 'goto' && Math.floor(pose.x) === stop.at.col && Math.floor(pose.y) === stop.at.row) return zero
  const target = stopXY(stop)
  const want = Math.atan2(target.y - pose.y, target.x - pose.x)
  const d = headingDelta(pose.heading, want)
  if (Math.abs(d) > ROUTE_ALIGN) return { throttle: 0, steer: d > 0 ? 1 : -1 }
  if (stop.kind !== 'goto') {
    const dist = Math.hypot(target.x - pose.x, target.y - pose.y)
    const decel = kindAccel(v.kind) * AUTO_DECEL_MUL
    const stopDist = (pose.speed * pose.speed) / (2 * decel) + 0.2
    if (dist <= stopDist) return zero
  }
  return { throttle: 1, steer: 0 }
}

function harvestItem(w: World, c: Cell): Item | undefined {
  if (c.kind === 'ripe') {
    const p = c.plant
    return { kind: 'fruit', ...fruitStack(p.crop, p.variety, p.quality, 1, p.stats(w.modifiers).sale, p.freshness, p.bio, false) }
  }
  if (c.kind === 'growing') {
    const m = c.plant.maturity
    if (m < 0.2) return { kind: 'seeds', crop: c.plant.crop, variety: c.plant.variety, quality: c.plant.quality, count: 1 }
    if (m > 0.8) {
      const p = c.plant
      const q = w.bakeQuality(p)
      return { kind: 'fruit', ...fruitStack(p.crop, p.variety, q, 1, statsOf(p.crop, p.variety, q, w.modifiers).sale, m, p.bio, false) }
    }
    return undefined
  }
  if (c.kind === 'dead') return { kind: 'dead', cls: CROPS[c.plant.crop].cls, count: 1 }
  if (c.kind === 'rotten') return { kind: 'rotten', cls: CROPS[c.crop].cls, count: 1 }
  if (c.kind === 'weed') return { kind: 'weed', count: 1 }
  return undefined
}

function boomCell(w: World, t: Trailer, at: Coord): void {
  const c = w.cell(at)
  if (t.kind === 'seed') {
    if (t.hopper.kind === 'empty') return
    if (c.kind !== 'empty') return
    const seeds = t.hopper.item
    w.setCell(at, { kind: 'growing', soil: c.soil, plant: new Plant(seeds.crop, seeds.variety, seeds.quality) })
    seeds.count -= 1
    if (seeds.count === 0) t.hopper = { kind: 'empty' }
    return
  }
  if (t.kind === 'spray') {
    if (t.hopper.kind === 'empty') return
    if (!isTilled(c) || c.soil.fertilizer >= FERT_PLOT_MAX) return
    const bag = t.hopper.item
    const need = FERT_PLOT_MAX - c.soil.fertilizer
    const use = need > bag.liters ? bag.liters : need
    if (bag.kind === 'synth') c.soil.spike(use)
    else c.soil.feed(use)
    bag.liters -= use
    if (bag.liters <= 0) t.hopper = { kind: 'empty' }
    return
  }
  if (c.kind === 'tree' || c.kind === 'turf') return
  const item = harvestItem(w, c)
  if (item === undefined) {
    if (c.kind === 'growing' && c.plant.maturity >= 0.2 && c.plant.maturity <= 0.8) {
      w.setCell(at, { kind: 'empty', soil: c.soil })
    }
    return
  }
  if (!harvestInsert(t.slots, item)) return
  if (c.kind === 'ripe') w.tally.harvests += 1
  if (isTilled(c)) w.setCell(at, { kind: 'empty', soil: c.soil })
}

function boom(
  w: World,
  v: Extract<Vehicle, { kind: 'tractor' }>,
  t: Trailer,
  active: boolean,
  steer: number,
  heading: number,
): void {
  if (v.pose.kind !== 'field') return
  if (!active) return
  if (steer !== 0) return
  if (v.pose.speed <= 0) return
  const p = hitchP(v.pose.x, v.pose.y, v.pose.heading)
  boomHits(p, heading, v.boom, at => w.inWorld(at)).forEach(at => boomCell(w, t, at))
}

export function tickVehicles(w: World, dt: number): void {
  w.vehicles.forEach(v => {
    if (v.pose.kind !== 'field') return
    const pose = v.pose
    const before = { x: pose.x, y: pose.y, heading: pose.heading }
    const driver = pose.driver === 'none' ? undefined : w.seats[pose.driver]
    const accel = kindAccel(v.kind)
    const auto = driver === undefined && v.running
    let steer = 0
    if (auto) {
      const drive = autoDrive(w, v, pose)
      steer = drive.steer
      const driving = w.skillTier('driving-classes')
      if (drive.throttle !== 0 || drive.steer !== 0) {
        const next = v.fuel - (dt / QUAD_FUEL_SECONDS) * (1 - 0.05 * driving)
        v.fuel = next < 0 ? 0 : next
      }
      const at = { col: Math.floor(pose.x), row: Math.floor(pose.y) }
      const surface = surfaceMul(w.cell(at))
      const drivingMul = 1 + 0.05 * driving
      const braking = drive.throttle === 0 && pose.speed !== 0
      integrateVehicle(
        pose,
        drive,
        dt,
        v.fuel,
        surface,
        p => w.inWorld(p),
        kindVMax(v.kind) * drivingMul * AUTO_VMAX_MUL,
        accel * drivingMul * (braking ? AUTO_DECEL_MUL : 1),
        kindYaw(v.kind),
      )
      if (v.fuel > 0) arriveGoto(w, v, pose)
    } else if (driver === undefined) {
      pose.speed = seekSpeed(pose.speed, 0, accel, dt)
      const nx = pose.x + Math.cos(pose.heading) * pose.speed * dt
      const ny = pose.y + Math.sin(pose.heading) * pose.speed * dt
      if (w.inWorld({ col: Math.floor(nx), row: Math.floor(ny) })) {
        pose.x = nx
        pose.y = ny
      }
    } else {
      steer = driver.drive.steer
      const driving = w.skillTier('driving-classes')
      if (driver.drive.throttle !== 0 || driver.drive.steer !== 0) {
        const next = v.fuel - (dt / QUAD_FUEL_SECONDS) * (1 - 0.05 * driving)
        v.fuel = next < 0 ? 0 : next
      }
      const at = { col: Math.floor(pose.x), row: Math.floor(pose.y) }
      const surface = surfaceMul(w.cell(at))
      const drivingMul = 1 + 0.05 * driving
      integrateVehicle(
        pose,
        driver.drive,
        dt,
        v.fuel,
        surface,
        p => w.inWorld(p),
        kindVMax(v.kind) * drivingMul,
        accel * drivingMul,
        kindYaw(v.kind),
      )
      driver.actor.x = pose.x
      driver.actor.y = pose.y
    }
    if (v.kind === 'tractor' && v.hitch !== 'none') {
      const t = w.trailers.find(x => x.id === v.hitch)
      if (t !== undefined && t.pose.kind === 'attached') {
        followHitch(t.pose, before, pose)
        boom(w, v, t, driver !== undefined || auto, steer, t.pose.heading)
      }
    }
  })
}

export function transferLoad(w: World, v: Vehicle): void {
  if (v.pose.kind !== 'field') return
  const hit = padHit(w, { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
  const load = vehicleCargo(v, w.trailers)
  if (hit?.side !== 'takeup' || load === undefined) return
  pullFrom(hit.cell, load, w.drops)
}

export function transferUnload(w: World, v: Vehicle): void {
  if (v.pose.kind !== 'field') return
  const hit = padHit(w, { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
  const load = vehicleCargo(v, w.trailers)
  if (hit?.side !== 'dropoff' || load === undefined) return
  dumpCargo(load, hit.cell)
}

export function loadBody(w: World): void {
  const v = driverVehicle(w, w.act.id)
  if (v?.pose.kind !== 'field') return
  const hit = padHit(w, { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
  const load = cargo(w)
  if (hit?.side !== 'takeup' || load === undefined) return
  if (w.act.id !== 0 && (hit.cell.kind === 'chest' || hit.cell.kind === 'freezer')) return
  transferLoad(w, v)
  w.ping()
}

export function unloadBody(w: World): void {
  const v = driverVehicle(w, w.act.id)
  if (v?.pose.kind !== 'field') return
  const hit = padHit(w, { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
  const load = cargo(w)
  if (hit?.side !== 'dropoff' || load === undefined) return
  if (w.act.id !== 0 && (hit.cell.kind === 'chest' || hit.cell.kind === 'freezer')) return
  transferUnload(w, v)
  w.ping()
}

export function loadWould(w: World): boolean {
  const load = cargo(w)
  if (load === undefined) return false
  const v = driverVehicle(w, w.act.id)
  if (v?.pose.kind !== 'field') return false
  if (v.pose.speed !== 0) return false
  const hit = padHit(w, { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
  if (hit?.side !== 'takeup') return false
  if (w.act.id !== 0 && (hit.cell.kind === 'chest' || hit.cell.kind === 'freezer')) return false
  return canPull(hit.cell, load, w.drops)
}

export function unloadWould(w: World): boolean {
  const load = cargo(w)
  if (load === undefined) return false
  const v = driverVehicle(w, w.act.id)
  if (v?.pose.kind !== 'field') return false
  if (v.pose.speed !== 0) return false
  const hit = padHit(w, { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
  if (hit?.side !== 'dropoff') return false
  if (w.act.id !== 0 && (hit.cell.kind === 'chest' || hit.cell.kind === 'freezer')) return false
  return canDumpCargo(load, hit.cell)
}

export function tickDispatch(w: World, dt: number): void {
  w.vehicles.forEach(v => {
    if (v.pose.kind !== 'field' || !v.running || v.route === 'none') return
    const route = w.routeById(v.route)
    if (!(route?.stops.length)) return
    const stop = route.stops[v.cursor]
    if (stop.kind === 'goto') return
    if (!stopArrived(v.pose, stop)) return
    if (v.fuel === 0) return
    if (stop.kind === 'wait') {
      if (!w.inWorld(stop.at)) return
      const light = w.cell(stop.at)
      if (light.kind !== 'traffic-light') return
      if (light.inn === 1) advanceRoute(v, route)
      return
    }
    if (v.dwell <= 0) {
      v.dwell = DISPATCH_DWELL
      return
    }
    v.dwell -= dt
    if (v.dwell > 0) return
    v.dwell = 0
    if (stop.kind === 'load') transferLoad(w, v)
    else transferUnload(w, v)
    advanceRoute(v, route)
  })
  for (const at of w.sensors.values()) {
    const c = w.cell(at)
    if (c.kind !== 'traffic-light') continue
    const raw: 0 | 1 = lightWaiter(w, c) ? 1 : 0
    const next = stepHold(c.out, c.hold, raw)
    c.out = next.out
    c.hold = next.hold
  }
}

export function lightWaiter(w: World, light: Extract<Sensor, { kind: 'traffic-light' }>): boolean {
  const at = { col: light.base.col, row: light.base.row }
  return w.vehicles.some(v => {
    if (v.pose.kind !== 'field' || !v.running || v.route === 'none') return false
    const route = w.routeById(v.route)
    if (!(route?.stops.length)) return false
    const stop = route.stops[v.cursor]
    if (stop.kind !== 'wait') return false
    if (stop.at.col !== at.col || stop.at.row !== at.row) return false
    if (Math.floor(v.pose.x) !== at.col || Math.floor(v.pose.y) !== at.row) return false
    return light.inn === 0
  })
}
