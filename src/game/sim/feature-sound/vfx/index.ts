import type { Intent } from '../../world.h.ts'
import type { LoopFn, OnceFn, OpenBuilding, SoundCue } from '../sound.h.ts'

export function actLoop(_act: Intent['act']): LoopFn | undefined {
  return undefined
}

export function actOnce(_act: Intent['act']): OnceFn | undefined {
  return undefined
}

export function openOnce(_building: OpenBuilding): OnceFn | undefined {
  return undefined
}

export function noticeOnce(_notice: SoundCue & { kind: 'notice' }): OnceFn | undefined {
  return undefined
}
