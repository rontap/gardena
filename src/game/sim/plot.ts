import type {
  AdditiveStore,
  Chest,
  CompostBox,
  Freezer,
  Grinder,
  House,
  JamMachine,
  Mill,
  PotStill,
  Pump,
  RainTank,
  Rock,
  SeedSilo,
  Tap,
  Tree,
  Truck,
  WineBarrel,
} from './building.ts'
import type { CropId, TileId } from './ids.ts'
import type { Plant, Turf, Weed } from './plant.ts'
import type { Soil } from './soil.ts'

export type Ground = 'soft' | 'hard' | 'very-hard'

export type Cover = { kind: 'bare' } | { kind: 'grass'; variant: 0 | 1 | 2 } | { kind: 'tile'; tile: TileId }

export type Plot =
  | { kind: 'untilled'; ground: Ground; cover: Cover }
  | { kind: 'empty'; soil: Soil }
  | { kind: 'infertile' }
  | { kind: 'weed'; soil: Soil; weed: Weed }
  | { kind: 'turf'; soil: Soil; turf: Turf }
  | { kind: 'growing'; soil: Soil; plant: Plant }
  | { kind: 'ripe'; soil: Soil; plant: Plant }
  | { kind: 'dead'; soil: Soil; plant: Plant }
  | { kind: 'rotten'; soil: Soil; crop: CropId }

export type Tilled = Extract<Plot, { soil: Soil }>

export type Cell =
  | Plot
  | House
  | Pump
  | RainTank
  | Tap
  | Rock
  | Tree
  | Chest
  | Grinder
  | CompostBox
  | Truck
  | Mill
  | JamMachine
  | PotStill
  | WineBarrel
  | Freezer
  | SeedSilo
  | AdditiveStore

export function bare(ground: Ground): Plot {
  return { kind: 'untilled', ground, cover: { kind: 'bare' } }
}

export function isPlot(c: Cell): c is Plot {
  return (
    c.kind === 'untilled' ||
    c.kind === 'empty' ||
    c.kind === 'infertile' ||
    c.kind === 'weed' ||
    c.kind === 'turf' ||
    c.kind === 'growing' ||
    c.kind === 'ripe' ||
    c.kind === 'dead' ||
    c.kind === 'rotten'
  )
}

export function isTilled(c: Cell): c is Tilled {
  return (
    c.kind === 'empty' ||
    c.kind === 'weed' ||
    c.kind === 'turf' ||
    c.kind === 'growing' ||
    c.kind === 'ripe' ||
    c.kind === 'dead' ||
    c.kind === 'rotten'
  )
}

export function isTileSite(c: Cell): c is Extract<Plot, { kind: 'untilled' }> {
  return c.kind === 'untilled' && (c.cover.kind === 'bare' || c.cover.kind === 'tile')
}

export function isFenceSite(c: Cell): c is Extract<Plot, { kind: 'untilled' }> {
  return c.kind === 'untilled'
}

export function isSolid(c: Cell): boolean {
  return (
    c.kind === 'house' ||
    c.kind === 'pump' ||
    c.kind === 'rain-tank' ||
    c.kind === 'tap' ||
    c.kind === 'rock' ||
    c.kind === 'tree' ||
    c.kind === 'chest' ||
    c.kind === 'grinder' ||
    c.kind === 'compost-box' ||
    c.kind === 'truck' ||
    c.kind === 'mill' ||
    c.kind === 'jam' ||
    c.kind === 'still' ||
    c.kind === 'barrel' ||
    c.kind === 'freezer'
  )
}
