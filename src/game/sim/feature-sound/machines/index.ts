import type { MachineId } from '../../feature-machines/recipe.h.ts'
import type { LoopFn, OnceFn } from '../sound.h.ts'

export function machineLoop(_machine: MachineId): LoopFn | undefined {
  return undefined
}

export function machineOnce(_machine: MachineId): OnceFn | undefined {
  return undefined
}
