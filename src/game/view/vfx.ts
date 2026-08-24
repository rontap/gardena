import spray from '../../assets/vfx/vfx-spray.svg?raw'
import sprayLarge from '../../assets/vfx/vfx-spray-large.svg?raw'
import sprayVert from '../../assets/vfx/vfx-spray-vert.svg?raw'
import tend from '../../assets/vfx/vfx-tend.svg?raw'
import pour from '../../assets/vfx/vfx-pour.svg?raw'
import type { VfxId } from '../sim/ids.ts'
import { groupInner, symId } from './svgs.ts'

export type VfxCut = 'vfx-cut-2' | 'vfx-cut-4'

export type VfxAnchor = 'vertex' | 'cell'

export type VfxDef = {
  frames: string[]
  cut: VfxCut
  dur: number
  span: number
  tall: number
  anchor: VfxAnchor
}

const CUT_FRAMES: Record<VfxCut, number> = { 'vfx-cut-2': 2, 'vfx-cut-4': 4 }

function framesOf(raw: string, cut: VfxCut): string[] {
  return Array.from({ length: CUT_FRAMES[cut] }, (_x, i) => groupInner(raw, `f${i}`))
}

export const VFX: Record<VfxId, VfxDef> = {
  'sprinkler-spray': { frames: framesOf(spray, 'vfx-cut-4'), cut: 'vfx-cut-4', dur: 1.2, span: 48, tall: 48, anchor: 'vertex' },
  'sprinkler-spray-large': { frames: framesOf(sprayLarge, 'vfx-cut-4'), cut: 'vfx-cut-4', dur: 1.6, span: 96, tall: 96, anchor: 'vertex' },
  'sprinkler-spray-vert': { frames: framesOf(sprayVert, 'vfx-cut-2'), cut: 'vfx-cut-2', dur: 0.6, span: 96, tall: 48, anchor: 'vertex' },
  tend: { frames: framesOf(tend, 'vfx-cut-2'), cut: 'vfx-cut-2', dur: 0.7, span: 24, tall: 24, anchor: 'cell' },
  pour: { frames: framesOf(pour, 'vfx-cut-2'), cut: 'vfx-cut-2', dur: 0.5, span: 24, tall: 24, anchor: 'cell' },
}

export const VFX_REDUCED: boolean = matchMedia('(prefers-reduced-motion: reduce)').matches

Object.values(VFX).forEach(def => {
  def.frames.forEach(f => symId(f))
})
