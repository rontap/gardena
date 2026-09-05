import type { HarvestSlot, RouteId, TrailerId, TrailerKind, VehicleId, VehicleKind, VehicleSlot } from '../ids.ts'
import type { Item, Slot } from '../item.ts'
import type { BaseBuilding, Coord } from '../building.ts'
import type { Cell } from '../plot.ts'
import type { SeatId } from '../world.ts'

export type { HarvestSlot, RouteId, TrailerId, TrailerKind, VehicleId, VehicleKind, VehicleSlot }

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

export type PadCell = Extract<Cell, BaseBuilding> & { readonly pads: 'both' }

export type Cargo =
  | { kind: 'quad'; slots: Slot[] }
  | { kind: 'harvest'; slots: Slot[] }
  | { kind: 'seed'; trailer: Extract<Trailer, { kind: 'seed' }> }
  | { kind: 'spray'; trailer: Extract<Trailer, { kind: 'spray' }> }
