import type { AppleTree, Chest, CompostBox, Grinder, House, Pump, RainTank, Rock, Shrub, Tap, Truck } from './building.ts'
import type { CropId, TileId } from './ids.ts'
import type { Plant, Weed } from './plant.ts'
import type { Soil } from './soil.ts'

export type Ground = 'soft' | 'hard' | 'very-hard'

export type Cover = { kind: 'bare' } | { kind: 'grass'; variant: 0 | 1 | 2 } | { kind: 'tile'; tile: TileId }

export type Plot =
  | { kind: 'untilled'; ground: Ground; cover: Cover }
  | { kind: 'empty'; soil: Soil }
  | { kind: 'infertile' }
  | { kind: 'weed'; soil: Soil; weed: Weed }
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
  | Shrub
  | AppleTree
  | Chest
  | Grinder
  | CompostBox
  | Truck

export function bare(ground: Ground): Plot {
  return { kind: 'untilled', ground, cover: { kind: 'bare' } }
}

export function isPlot(c: Cell): c is Plot {
  return (
    c.kind === 'untilled' ||
    c.kind === 'empty' ||
    c.kind === 'infertile' ||
    c.kind === 'weed' ||
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
    c.kind === 'growing' ||
    c.kind === 'ripe' ||
    c.kind === 'dead' ||
    c.kind === 'rotten'
  )
}

export function isTileSite(c: Cell): c is Extract<Plot, { kind: 'untilled' }> {
  return c.kind === 'untilled' && (c.cover.kind === 'bare' || c.cover.kind === 'tile')
}

export function isSolid(c: Cell): boolean {
  return (
    c.kind === 'house' ||
    c.kind === 'pump' ||
    c.kind === 'rain-tank' ||
    c.kind === 'tap' ||
    c.kind === 'rock' ||
    c.kind === 'shrub' ||
    c.kind === 'apple-tree' ||
    c.kind === 'chest' ||
    c.kind === 'grinder' ||
    c.kind === 'compost-box' ||
    c.kind === 'truck'
  )
}
