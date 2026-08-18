import type { Building } from './building.ts'
import type { Plant } from './plant.ts'

export type Plot =
  | { kind: 'untilled' }
  | { kind: 'empty' }
  | { kind: 'growing'; plant: Plant }
  | { kind: 'ripe'; plant: Plant }
  | { kind: 'dead'; plant: Plant }

export type Cell = Plot | Building

export function isPlot(c: Cell): c is Plot {
  return (
    c.kind === 'untilled' ||
    c.kind === 'empty' ||
    c.kind === 'growing' ||
    c.kind === 'ripe' ||
    c.kind === 'dead'
  )
}
