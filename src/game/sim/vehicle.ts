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
  TRAILER_LEN,
  VEHICLE_SLOTS,
} from '../defs/items.ts'
import type { HarvestSlot, TrailerId, TrailerKind, VehicleId, VehicleKind, VehicleSlot } from './ids.ts'
import type { Item, Slot } from './item.ts'
import type { Coord, RectBase } from './building.ts'
import { isSolid, isTilled, type Cell } from './plot.ts'
import type { SeatId } from './world.ts'

export type Drive = { throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }
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
    }
  | {
      kind: 'tractor'
      id: VehicleId
      fuel: number
      hitch: TrailerId | 'none'
      boom: 3 | 5
      pose: VehiclePose
    }

export type Trailer =
  | { kind: 'seed'; id: TrailerId; pose: TrailerPose; hopper: SeedHopper }
  | { kind: 'spray'; id: TrailerId; pose: TrailerPose; hopper: SprayHopper }
  | { kind: 'harvest'; id: TrailerId; pose: TrailerPose; slots: Slot[] }

export type { HarvestSlot, TrailerId, TrailerKind, VehicleId, VehicleKind, VehicleSlot }

export function emptyVehicleSlots(): Slot[] {
  return Array.from({ length: VEHICLE_SLOTS }, (): Slot => ({ kind: 'empty' }))
}

export function emptyHarvestSlots(): Slot[] {
  return Array.from({ length: HARVEST_SLOTS }, (): Slot => ({ kind: 'empty' }))
}

export function makeQuad(id: VehicleId, fuel: number, slots: Slot[], pose: VehiclePose): Extract<Vehicle, { kind: 'quad' }> {
  return { kind: 'quad', id, fuel, slots, pose }
}

export function makeTractor(
  id: VehicleId,
  fuel: number,
  hitch: TrailerId | 'none',
  boom: 3 | 5,
  pose: VehiclePose,
): Extract<Vehicle, { kind: 'tractor' }> {
  return { kind: 'tractor', id, fuel, hitch, boom, pose }
}

export function hangarPad(base: RectBase): Coord[] {
  const row = base.row + HANGAR_H
  return Array.from({ length: HANGAR_W }, (_, i) => ({ col: base.col + i, row }))
}

export function siloPad(base: RectBase): Coord[] {
  const row = base.row + SILO_H
  return Array.from({ length: SILO_W }, (_, i) => ({ col: base.col + i, row }))
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
