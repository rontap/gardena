import {
  HANGAR_H,
  HANGAR_W,
  QUAD_ACCEL,
  QUAD_EMPTY_MUL,
  QUAD_VMAX,
  QUAD_YAW,
  SURFACE_NORMAL,
  SURFACE_PAVED,
  SURFACE_SLOW,
  VEHICLE_SLOTS,
} from '../defs/items.ts'
import type { VehicleId, VehicleKind, VehicleSlot } from './ids.ts'
import type { Slot } from './item.ts'
import type { Coord, RectBase } from './building.ts'
import { isSolid, isTilled, type Cell } from './plot.ts'
import type { SeatId } from './world.ts'

export type Drive = { throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }
export type VehiclePose =
  | { kind: 'stored'; hangar: Coord }
  | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }

export type { VehicleId, VehicleKind, VehicleSlot }

export class Vehicle {
  id: VehicleId
  kind: VehicleKind
  fuel: number
  slots: Slot[]
  pose: VehiclePose
  constructor(id: VehicleId, kind: VehicleKind, fuel: number, slots: Slot[], pose: VehiclePose) {
    this.id = id
    this.kind = kind
    this.fuel = fuel
    this.slots = slots
    this.pose = pose
  }
}

export function emptyVehicleSlots(): Slot[] {
  return Array.from({ length: VEHICLE_SLOTS }, (): Slot => ({ kind: 'empty' }))
}

export function hangarPad(base: RectBase): Coord[] {
  const row = base.row + HANGAR_H
  return Array.from({ length: HANGAR_W }, (_, i) => ({ col: base.col + i, row }))
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

export function integrateVehicle(
  pose: Extract<VehiclePose, { kind: 'field' }>,
  drive: Drive,
  dt: number,
  fuel: number,
  machineryMul: number,
  surface: number,
  inWorld: (at: Coord) => boolean,
): void {
  pose.heading = wrapHeading(pose.heading + drive.steer * QUAD_YAW * dt)
  const vMax = QUAD_VMAX * machineryMul
  const accel = QUAD_ACCEL * machineryMul
  const cap = vMax * surface * (fuel > 0 ? 1 : QUAD_EMPTY_MUL)
  const target = drive.throttle === 1 ? cap : drive.throttle === -1 ? -cap : 0
  pose.speed = seekSpeed(pose.speed, target, accel, dt)
  const nx = pose.x + Math.cos(pose.heading) * pose.speed * dt
  const ny = pose.y + Math.sin(pose.heading) * pose.speed * dt
  if (inWorld({ col: Math.floor(nx), row: Math.floor(ny) })) {
    pose.x = nx
    pose.y = ny
  }
}
