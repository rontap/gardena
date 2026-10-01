import { m } from '../../../paraglide/messages.js'
import type { ReactNode } from 'react'
import { VFX_FRAMES, type VfxId } from '../../sim/ids.ts'
import { MILL_DUST_X, MILL_DUST_Y } from '../../sim/feature-machines/machine.ts'
import { VFX } from '../../view/vfx.ts'
import { atlasHtml, vfxKey } from '../../view/atlas.ts'
import {
  BARREL,
  COMPOST_BOX,
  furnaceArt,
  GRINDER,
  infuserArt,
  itemInner,
  JAM,
  MILL,
  PIPE_I,
  PIPE_L,
  PIPE_STUB,
  PIPE_T,
  PIPE_X,
  stationArt,
  STILL,
} from '../../view/svgs.ts'
import { COMPOST_LITERS, FERT_BAG_LITERS, SUGAR_BAG, SUGAR_SHOP, WEED_SPRAY_BAG } from '../../defs/items.ts'
import { makeExtract, type Face } from '../../sim/item.ts'
import { useCycle } from '../cycle.ts'

export const BROWN = 'bg-dirt-dark'
export const GREEN = 'bg-grass'
export const BLUE = 'bg-water'

export const BAG_IDS = ['fertilizer', 'compost', 'weed-spray', 'extract', 'sugar'] as const

type BagId = (typeof BAG_IDS)[number]

export const BAG_FACES: { readonly [K in BagId]: readonly Face[] } = {
  fertilizer: [{ kind: 'fertilizer', liters: FERT_BAG_LITERS, capacityLiters: FERT_BAG_LITERS }],
  compost: [{ kind: 'compost', liters: COMPOST_LITERS, capacityLiters: COMPOST_LITERS }],
  'weed-spray': [{ kind: 'weed-spray', liters: WEED_SPRAY_BAG, capacityLiters: WEED_SPRAY_BAG }],
  extract: [makeExtract(false), makeExtract(true)],
  sugar: [{ kind: 'sugar', liters: SUGAR_BAG, capacityLiters: SUGAR_BAG, unitSale: SUGAR_SHOP, quality: 0 }],
}

export function CardPane({ title, text, fill, art }: { title: string; text: ReactNode; fill: string; art: string }) {
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{text}</p>
      <Portrait caption={title} fill={fill}>
        <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: art }} />
      </Portrait>
    </>
  )
}

const PIPE_JOINS = [PIPE_STUB, PIPE_I, PIPE_L, PIPE_T, PIPE_X] as const

export function PipePane({ title, blurb }: { title: string; blurb: ReactNode }) {
  const stage = useCycle(PIPE_JOINS.length)
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{blurb}</p>
      <Portrait caption={title} fill={GREEN}>
        <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: PIPE_JOINS[stage] }} />
      </Portrait>
    </>
  )
}

export function Portrait({ caption, fill, children }: { caption: string; fill: string; children: ReactNode }) {
  return (
    <div
      className={`relative flex h-32 w-24 shrink-0 items-start justify-center overflow-hidden rounded-lg border-2 border-ink/25 pt-3 shadow-sm shadow-ink/15 ${fill}`}
    >
      {children}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/75 to-transparent px-1 pt-5 pb-1.5 text-center text-sm leading-tight font-semibold text-white">
        {caption}
      </div>
    </div>
  )
}

export const MACHINE_TAB_IDS = ['grinder', 'mill', 'jam', 'still', 'barrel', 'infuser', 'compost-box', 'furnace', 'station', 'sorter'] as const

type MachineTabId = (typeof MACHINE_TAB_IDS)[number]

type MachineFx = { id: VfxId; dx: number; dy: number }

type MachineState = { caption: () => string; art: string; fx: readonly MachineFx[] }

export type MachineLook = { box: string; size: string; states: readonly MachineState[] }

const idle = (art: string): MachineState => ({ caption: () => m.almanac_state_idle(), art, fx: [] })

const working = (art: string, fx: readonly MachineFx[]): MachineState => ({ caption: () => m.almanac_state_working(), art, fx })

const fx = (id: VfxId, dx: number, dy: number): MachineFx => ({ id, dx, dy })

const SQUARE = { box: '0 0 24 24', size: 'h-16 w-16' }
const WIDE = { box: '0 0 48 24', size: 'h-10 w-20' }
const BIG = { box: '0 0 48 48', size: 'h-16 w-16' }

export const MACHINE_LOOK: { readonly [K in MachineTabId]: MachineLook } = {
  grinder: { ...SQUARE, states: [idle(GRINDER), working(GRINDER, [fx('grind', 0, 0)])] },
  mill: { ...BIG, states: [idle(MILL), working(MILL, [fx('dust', MILL_DUST_X, MILL_DUST_Y)])] },
  jam: { ...SQUARE, states: [idle(JAM), working(JAM, [fx('dust', 0, 0)])] },
  still: { ...WIDE, states: [idle(STILL), working(STILL, [fx('steam', 0, 0)])] },
  barrel: { ...SQUARE, states: [idle(BARREL), working(BARREL, [fx('brew', 0, 0)])] },
  infuser: { ...BIG, states: [idle(infuserArt(false)), working(infuserArt(true), [])] },
  'compost-box': { box: '0 -24 24 48', size: 'h-20 w-10', states: [idle(COMPOST_BOX), working(COMPOST_BOX, [fx('compost', 0, -1)])] },
  furnace: {
    box: '0 0 24 48',
    size: 'h-20 w-10',
    states: [idle(furnaceArt(false)), working(furnaceArt(true), [fx('furnace', 0, 1), fx('furnace-smoke', 0, 0)])],
  },
  station: {
    ...WIDE,
    states: [idle(stationArt(false)), working(stationArt(true), [fx('station', 0, 0), fx('station-lights', 1, 0)])],
  },
  sorter: { ...SQUARE, states: [{ caption: () => m.names_building_sorter(), art: itemInner({ kind: 'sorter' }), fx: [] }] },
}

function fxHtml(f: MachineFx): string {
  const def = VFX[f.id]
  const frames = VFX_FRAMES.filter(i => i < def.frames).map(
    i =>
      `<g class="vfx-frame" data-vfx-i="${i}" style="--vfx-cut: vfx-cut-${def.slots}; --vfx-dur: ${def.dur}s; --vfx-t: ${i / def.slots}">${atlasHtml(vfxKey(f.id, i))}</g>`,
  )
  return `<g transform="translate(${f.dx * 24} ${f.dy * 24})">${frames.join('')}</g>`
}

export function MachineCard({ look }: { look: MachineLook }) {
  const state = look.states[useCycle(look.states.length)]
  return (
    <Portrait caption={state.caption()} fill={GREEN}>
      <svg
        className={`${look.size} overflow-visible`}
        viewBox={look.box}
        dangerouslySetInnerHTML={{ __html: state.art + state.fx.map(fxHtml).join('') }}
      />
    </Portrait>
  )
}
