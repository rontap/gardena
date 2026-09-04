import type { VfxId } from '../sim/ids.ts'
import { settings } from '../sim/settings.ts'

export type VfxAnchor = 'vertex' | 'cell'

export type VfxDef = {
  frames: number
  slots: number
  dur: number
  span: number
  tall: number
  anchor: VfxAnchor
}

function def(n: 2 | 4, rest: 0 | 2 | 4, dur: number, span: number, tall: number, anchor: VfxAnchor): VfxDef {
  return { frames: n, slots: n + rest, dur, span, tall, anchor }
}

export const VFX: Record<VfxId, VfxDef> = {
  'sprinkler-spray': def(4, 0, 1.2, 48, 48, 'vertex'),
  'sprinkler-spray-large': def(4, 0, 1.6, 96, 96, 'vertex'),
  'sprinkler-spray-vert': def(2, 0, 0.6, 96, 48, 'vertex'),
  tend: def(2, 0, 0.7, 24, 24, 'cell'),
  pour: def(2, 0, 0.5, 24, 24, 'cell'),
  brew: def(4, 4, 3.2, 24, 24, 'cell'),
  dust: def(2, 2, 1.6, 24, 24, 'cell'),
  steam: def(4, 4, 4, 48, 24, 'cell'),
  dig: def(4, 0, 0.5, 24, 24, 'cell'),
  furnace: def(4, 0, 1.2, 24, 24, 'cell'),
  'furnace-smoke': def(4, 0, 1.2, 24, 24, 'cell'),
  graft: def(4, 0, 1.2, 24, 24, 'cell'),
  age: def(4, 2, 2.4, 24, 24, 'cell'),
}

const MOTION_QUERY = matchMedia('(prefers-reduced-motion: reduce)')

export function vfxReduced(): boolean {
  return MOTION_QUERY.matches || settings().reducedMotion
}
