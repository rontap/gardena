import spray from '../../assets/vfx/vfx-spray.svg?raw'
import sprayLarge from '../../assets/vfx/vfx-spray-large.svg?raw'
import sprayVert from '../../assets/vfx/vfx-spray-vert.svg?raw'
import tend from '../../assets/vfx/vfx-tend.svg?raw'
import pour from '../../assets/vfx/vfx-pour.svg?raw'
import brew from '../../assets/vfx/vfx-brew.svg?raw'
import dust from '../../assets/vfx/vfx-dust.svg?raw'
import steam from '../../assets/vfx/vfx-steam.svg?raw'
import dig from '../../assets/vfx/vfx-dig.svg?raw'
import type { VfxId } from '../sim/ids.ts'
import { groupInner, symId } from './svgs.ts'

export type VfxCut = 'vfx-cut-2' | 'vfx-cut-4' | 'vfx-cut-8'

export type VfxAnchor = 'vertex' | 'cell'

export type VfxDef = {
  frames: string[]
  cut: VfxCut
  slots: number
  dur: number
  span: number
  tall: number
  anchor: VfxAnchor
}

function framesOf(raw: string, n: number): string[] {
  return Array.from({ length: n }, (_x, i) => groupInner(raw, `f${i}`))
}

function def(
  raw: string,
  n: 2 | 4,
  rest: 0 | 2 | 4,
  dur: number,
  span: number,
  tall: number,
  anchor: VfxAnchor,
): VfxDef {
  const slots = n + rest
  return { frames: framesOf(raw, n), cut: `vfx-cut-${slots}` as VfxCut, slots, dur, span, tall, anchor }
}

export const VFX: Record<VfxId, VfxDef> = {
  'sprinkler-spray': def(spray, 4, 0, 1.2, 48, 48, 'vertex'),
  'sprinkler-spray-large': def(sprayLarge, 4, 0, 1.6, 96, 96, 'vertex'),
  'sprinkler-spray-vert': def(sprayVert, 2, 0, 0.6, 96, 48, 'vertex'),
  tend: def(tend, 2, 0, 0.7, 24, 24, 'cell'),
  pour: def(pour, 2, 0, 0.5, 24, 24, 'cell'),
  brew: def(brew, 4, 4, 3.2, 24, 24, 'cell'),
  dust: def(dust, 2, 2, 1.6, 24, 24, 'cell'),
  steam: def(steam, 4, 4, 4, 48, 24, 'cell'),
  dig: def(dig, 4, 0, 0.5, 24, 24, 'cell'),
}

export const VFX_REDUCED: boolean = matchMedia('(prefers-reduced-motion: reduce)').matches

Object.values(VFX).forEach(d => {
  d.frames.forEach(f => symId(f))
})
