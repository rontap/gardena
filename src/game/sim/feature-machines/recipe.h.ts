import type { VarietyId } from '../../defs/varieties.ts'
import type { MillRecipe } from '../ids.ts'
import type { Barrel, CompostBox, Furnace, Grinder, JamMachine, Mill, PotStill, ResearchStation } from '../building.ts'
import type { Face } from '../item.ts'

export type MachineId = 'mill' | 'jam' | 'still' | 'barrel' | 'grinder' | 'compost-box' | 'furnace' | 'station'

export type Amount = { kind: 'units'; n: number } | { kind: 'liters'; l: number } | { kind: 'waste'; n: number }

export type Ingredient =
  | { kind: 'one'; face: Face; amount: Amount }
  | { kind: 'any'; faces: readonly Face[]; amount: Amount }

export type Yield =
  | { kind: 'exact'; face: Face; amount: Amount }
  | { kind: 'range'; faces: readonly Face[]; min: number; max: number }

export type Duration =
  | { kind: 'work'; seconds: number }
  | { kind: 'fixed'; seconds: number }
  | { kind: 'age'; seconds: number }

export type Recipe = {
  machine: MachineId
  inputs: readonly Ingredient[]
  out: Yield
  duration: Duration
}

export type Craft =
  | { kind: 'idle'; machine: MachineId }
  | { kind: 'filling'; recipe: Recipe; at: number; have: number; need: number }
  | { kind: 'paused'; recipe: Recipe }
  | { kind: 'thirsty'; recipe: Recipe }
  | { kind: 'working'; recipe: Recipe; progress: number; left: number }
  | { kind: 'ready'; recipe: Recipe }

export type CraftCell = Mill | JamMachine | PotStill | Barrel | Grinder | CompostBox | Furnace | ResearchStation

export type Pin<C> = { crop: C; variety: VarietyId }

export type MillPin = { recipe: MillRecipe; variety: VarietyId }
