import type { Coord } from '../sim/building.ts'
import type { VehicleId } from '../sim/ids.ts'

export type Panel =
  | { kind: 'none' }
  | { kind: 'family' }
  | { kind: 'shop' }
  | { kind: 'build' }
  | { kind: 'research' }
  | { kind: 'market' }
  | { kind: 'inventory' }
  | { kind: 'almanac' }
  | { kind: 'cheat' }
  | { kind: 'lens' }
  | { kind: 'chest'; at: Coord }
  | { kind: 'silo'; at: Coord }
  | { kind: 'additives'; at: Coord }
  | { kind: 'hangar'; at: Coord }
  | { kind: 'station'; at: Coord }
  | { kind: 'vehicle'; id: VehicleId }
  | { kind: 'menu' }
  | { kind: 'multiplayer' }

export type PanelKind = Panel['kind']

/** Panels a walk-up cue opened. Closing any of them has to ack the cue. */
export function cued(kind: PanelKind): boolean {
  return (
    kind === 'chest' ||
    kind === 'silo' ||
    kind === 'additives' ||
    kind === 'hangar' ||
    kind === 'station' ||
    kind === 'vehicle'
  )
}

/** Panels that can leave a placement ghost armed on the map. */
export function arming(kind: PanelKind): boolean {
  return kind === 'shop' || kind === 'build'
}
