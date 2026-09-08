import {
  BaseBuilding,
  type AdditiveStore,
  type Chest,
  type CompostBox,
  type Freezer,
  type Grinder,
  type Hangar,
  type House,
  type SiloProduce,
  type SiloSeed,
  type SiloSpray,
  type JamMachine,
  type Mill,
  type Furnace,
  type Infuser,
  type PotStill,
  type Pump,
  type ResearchStation,
  type RainTank,
  type Rock,
  type SeedSilo,
  type Tap,
  type Tree,
  type Truck,
  type Well,
  type Barrel,
} from './building.ts'
import type { VarietyId } from '../defs/varieties.ts'
import type { CropId, TreeId } from './ids.ts'
import type { Plant, Turf, Weed } from './plant.ts'
import { isSensor, type Sensor } from './sensor.ts'
import type { Soil } from './soil.ts'

export type Ground = 'soft' | 'hard' | 'very-hard'

export type LootItem =
  | { kind: 'treasure'; coins: number }
  | { kind: 'tree-seed'; tree: TreeId; variety: VarietyId; quality: number }
  | { kind: 'seeds'; crop: 'tomato' | 'raspberry' | 'grape' | 'vanilla'; variety: VarietyId; quality: number; count: number }
  | { kind: 'fertilizer'; liters: number; capacityLiters: number }
  | { kind: 'shovel'; id: 'better-shovel'; usesLeft: number; workSeconds: number }
  | { kind: 'pickaxe'; id: 'better-pickaxe'; usesLeft: number; workSeconds: number }
  | { kind: 'axe'; usesLeft: number; workSeconds: number }

export type Cover =
  | { kind: 'bare' }
  | { kind: 'grass'; variant: 0 | 1 | 2 }
  | { kind: 'burrow'; loot: LootItem }

export type Plot =
  | { kind: 'untilled'; ground: Ground; hardness: number; cover: Cover }
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
  | Well
  | Rock
  | Tree
  | Chest
  | Grinder
  | CompostBox
  | Truck
  | Mill
  | JamMachine
  | PotStill
  | Furnace
  | Infuser
  | ResearchStation
  | Barrel
  | Freezer
  | Hangar
  | SiloSeed
  | SiloSpray
  | SiloProduce
  | SeedSilo
  | AdditiveStore
  | Sensor

export function bare(ground: Ground, hardness: number): Plot {
  return { kind: 'untilled', ground, hardness, cover: { kind: 'bare' } }
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

export function isFenceSite(c: Cell): boolean {
  if (c.kind === 'untilled') return c.cover.kind !== 'burrow'
  return isSensor(c) && c.fenceable
}

export function isSolid(c: Cell): boolean {
  return (
    (c instanceof BaseBuilding && c.solid) ||
    c.kind === 'house' ||
    c.kind === 'pump' ||
    c.kind === 'rain-tank' ||
    c.kind === 'tap' ||
    c.kind === 'well' ||
    c.kind === 'rock' ||
    c.kind === 'tree' ||
    c.kind === 'truck' ||
    c.kind === 'hangar' ||
    c.kind === 'silo-seed' ||
    c.kind === 'silo-spray' ||
    c.kind === 'silo-produce' ||
    isSensor(c)
  )
}

export function isPavingSite(c: Cell): boolean {
  if (c.kind === 'untilled') return c.cover.kind !== 'burrow'
  if (c.kind === 'rock' || c.kind === 'tree') return false
  return isSolid(c)
}
