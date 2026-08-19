import type { Chest, Grinder, House, Pump, Rock, Shrub, Truck } from './building.ts'
import type { Plant } from './plant.ts'

export type Ground = 'soft' | 'hard' | 'very-hard'

export type Plot =
  | { kind: 'untilled'; ground: Ground }
  | { kind: 'empty' }
  | { kind: 'infertile' }
  | { kind: 'growing'; plant: Plant }
  | { kind: 'ripe'; plant: Plant }
  | { kind: 'dead'; plant: Plant }
  | { kind: 'rotten' }

export type Cell = Plot | House | Pump | Rock | Shrub | Chest | Grinder | Truck

export function isPlot(c: Cell): c is Plot {
  return (
    c.kind === 'untilled' ||
    c.kind === 'empty' ||
    c.kind === 'infertile' ||
    c.kind === 'growing' ||
    c.kind === 'ripe' ||
    c.kind === 'dead' ||
    c.kind === 'rotten'
  )
}

export function isSolid(c: Cell): boolean {
  return (
    c.kind === 'house' ||
    c.kind === 'pump' ||
    c.kind === 'rock' ||
    c.kind === 'shrub' ||
    c.kind === 'chest' ||
    c.kind === 'grinder' ||
    c.kind === 'truck'
  )
}
