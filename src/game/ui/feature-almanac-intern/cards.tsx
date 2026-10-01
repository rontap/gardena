import { m } from '../../../paraglide/messages.js'
import { Fragment, useContext, type ReactNode } from 'react'
import type { CatalogEntry } from '../../defs/catalog.ts'
import { COMPOST_LITERS, COUNTER_MAX, FERT_BAG_LITERS, SUGAR_BAG, SUGAR_SHOP, WEED_SPRAY_BAG } from '../../defs/items.ts'
import { SKUS } from '../../defs/research.ts'
import { MILL_DUST_X, MILL_DUST_Y } from '../../sim/feature-machines/machine.ts'
import { MACHINE_IDS, recipesMaking, type MachineId } from '../../sim/feature-machines/recipe.ts'
import { VFX_FRAMES, type VfxId } from '../../sim/ids.ts'
import { faceName, makeExtract, type Face } from '../../sim/item.ts'
import type { World } from '../../sim/world.ts'
import { atlasHtml, vfxKey } from '../../view/atlas.ts'
import {
  BARREL,
  buttonArt,
  COMPOST_BOX,
  counterArt,
  daySensorArt,
  fertSensorArt,
  furnaceArt,
  GRINDER,
  harvestSensorArt,
  infuserArt,
  itemInner,
  JAM,
  lampArt,
  leverArt,
  logicArt,
  MILL,
  PIPE_I,
  PIPE_L,
  PIPE_STUB,
  PIPE_T,
  PIPE_X,
  PROP_NOT,
  pulserArt,
  stationArt,
  STILL,
  varietySensorArt,
  vehicleDetectorArt,
  waterSensorArt,
  weatherSensorArt,
} from '../../view/svgs.ts'
import { VFX } from '../../view/vfx.ts'
import { useCycle } from '../cycle.ts'
import { Coin } from '../frame.tsx'
import { Recipes } from '../recipe.tsx'
import { AlmanacTip, type Price, Rich, skuEntry, toolIds, type ToolFamily } from './nav.tsx'

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

export function FormCards({ title, entries }: { title: string; entries: CatalogEntry[] }) {
  const blurbs = [...new Set(entries.map(e => e.blurb))]
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{title}</div>
      <div className="flex flex-col gap-4">
        {blurbs.map(blurb => (
          <div key={blurb}>
            <p className="mb-4 text-base leading-relaxed text-ink/75">
              <Rich text={blurb} />
            </p>
            <div className="flex flex-wrap gap-3">
              {entries
                .filter(e => e.blurb === blurb)
                .map(e => (
                  <Portrait key={e.id} caption={e.title} fill={skuFill(e.id)}>
                    <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(e.icon) }} />
                  </Portrait>
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function MachinePane({ entry, look, world }: { entry: CatalogEntry; look: MachineLook; world: World }) {
  const machine = MACHINE_IDS.find(x => x === entry.id)
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{entry.title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{entry.blurb}</p>
      <MachineCard key={entry.id} look={look} />
      {machine !== undefined && <MachineRecipes machine={machine} world={world} />}
    </>
  )
}

export const SENSOR_IDS = [
  'lever',
  'button',
  'lamp',
  'logic',
  'not',
  'pulser',
  'counter',
  'sensor-water',
  'sensor-fert',
  'sensor-harvest',
  'sensor-variety',
  'sensor-weather',
  'sensor-day',
  'vehicle-detector',
] as const

type SensorId = (typeof SENSOR_IDS)[number]

type SensorState = { art: string; caption: () => string }

type SensorPage = { states: readonly SensorState[]; input: () => string; output: () => string }

function onOff(art: (on: boolean) => string): readonly SensorState[] {
  return [
    { art: art(false), caption: () => m.almanac_state_off() },
    { art: art(true), caption: () => m.almanac_state_on() },
  ]
}

const COUNTER_STATES: readonly SensorState[] = [
  ...(['s0', 's1', 's2', 's3'] as const).map(g => ({ art: counterArt(g), caption: () => m.almanac_state_off() })),
  { art: counterArt('s4'), caption: () => m.almanac_state_on() },
]

export const SENSOR_PAGE: { readonly [K in SensorId]: SensorPage } = {
  lever: { states: onOff(leverArt), input: () => m.almanac_in_lever(), output: () => m.almanac_out_lever() },
  button: { states: onOff(buttonArt), input: () => m.almanac_in_button(), output: () => m.almanac_out_button() },
  lamp: { states: onOff(lampArt), input: () => m.almanac_in_lamp(), output: () => m.almanac_out_lamp() },
  logic: {
    states: [
      { art: logicArt('or'), caption: () => m.sensors_or() },
      { art: logicArt('and'), caption: () => m.sensors_and() },
    ],
    input: () => m.almanac_in_logic(),
    output: () => m.almanac_out_logic(),
  },
  not: {
    states: [{ art: PROP_NOT, caption: () => m.names_sensor_not() }],
    input: () => m.almanac_in_one(),
    output: () => m.almanac_out_not(),
  },
  pulser: { states: onOff(pulserArt), input: () => m.almanac_in_pulser(), output: () => m.almanac_out_pulser() },
  counter: {
    states: COUNTER_STATES,
    input: () => m.almanac_in_counter(),
    output: () => m.almanac_out_counter({ max: COUNTER_MAX, reset: m.sensors_reset({ n: 0 }) }),
  },
  'sensor-water': { states: onOff(waterSensorArt), input: () => m.almanac_in_watch(), output: () => m.almanac_out_water() },
  'sensor-fert': { states: onOff(fertSensorArt), input: () => m.almanac_in_watch(), output: () => m.almanac_out_fert() },
  'sensor-harvest': {
    states: onOff(harvestSensorArt),
    input: () => m.almanac_in_watch(),
    output: () => m.almanac_out_harvest(),
  },
  'sensor-variety': {
    states: onOff(varietySensorArt),
    input: () => m.almanac_in_watch(),
    output: () => m.almanac_out_variety(),
  },
  'sensor-weather': {
    states: onOff(weatherSensorArt),
    input: () => m.almanac_in_none(),
    output: () => m.almanac_out_weather(),
  },
  'sensor-day': { states: onOff(daySensorArt), input: () => m.almanac_in_none(), output: () => m.almanac_out_day() },
  'vehicle-detector': {
    states: onOff(vehicleDetectorArt),
    input: () => m.almanac_in_pressure(),
    output: () => m.almanac_out_pressure(),
  },
}

function SensorCard({ states }: { states: readonly SensorState[] }) {
  const state = states[useCycle(states.length)]
  return (
    <Portrait caption={state.caption()} fill={GREEN}>
      <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: state.art }} />
    </Portrait>
  )
}

export function SensorPane({ entry, page }: { entry: CatalogEntry; page: SensorPage }) {
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{entry.title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{entry.blurb}</p>
      <SensorCard states={page.states} />
      <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink">
        <li>
          <span className="font-semibold">{m.almanac_io_input()}</span> {page.input()}
        </li>
        <li>
          <span className="font-semibold">{m.almanac_io_output()}</span> {page.output()}
        </li>
      </ul>
    </>
  )
}

const MADE_IDS: readonly string[] = ['sugar', 'extract', 'ash']

const GROWN_IDS: readonly string[] = ['soil', 'weed', 'grass', 'grass-seeds', 'rotten', 'rotten-root', 'dead', 'wood', 'fly-agaric', 'truffle']

export function skuFill(id: string): string {
  if (MADE_IDS.includes(id)) return BLUE
  if (GROWN_IDS.includes(id)) return BROWN
  return GREEN
}

export function Plate({ entry }: { entry: CatalogEntry }) {
  return (
    <div className={`flex h-20 w-20 items-center justify-center ${skuFill(entry.id)}`}>
      <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(entry.icon) }} />
    </div>
  )
}

export function MachineRecipes({ machine, world }: { machine: MachineId; world: World }) {
  return (
    <div className="mt-4">
      <div className="mb-1 font-display text-xs leading-none text-ink">{m.hud_recipes()}</div>
      <Recipes view={{ kind: 'list', machine }} size="md" world={world} />
    </div>
  )
}

export function BagPane({ entry, faces }: { entry: CatalogEntry; faces: readonly Face[] }) {
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{entry.title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">
        <Rich text={entry.blurb} />
      </p>
      <div className="flex flex-wrap gap-3">
        {faces.map(face => (
          <MadeCard key={faceName(face)} face={face} fill={skuFill(entry.id)} />
        ))}
      </div>
    </>
  )
}

function MadeCard({ face, fill }: { face: Face; fill: string }) {
  const setTip = useContext(AlmanacTip)
  const recipes = recipesMaking(face)
  return (
    <div
      onPointerEnter={() => setTip(recipes.length === 0 ? undefined : { title: faceName(face), recipes })}
      onPointerLeave={() => setTip(undefined)}
    >
      <Portrait caption={faceName(face)} fill={fill}>
        <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(face) }} />
      </Portrait>
    </div>
  )
}

type Cell = { kind: 'value'; value: ReactNode } | { kind: 'prize' }

type StatRow = { label: string; cells: readonly Cell[] }

function priceRow(prices: readonly Price[]): StatRow {
  return {
    label: m.almanac_stat_price(),
    cells: prices.map((p): Cell => (p.kind === 'sku' ? { kind: 'value', value: <Coin n={SKUS[p.sku].price} /> } : { kind: 'prize' })),
  }
}

function familyRows(family: ToolFamily, world: World): StatRow[] {
  switch (family.kind) {
    case 'work':
      return [
        priceRow(family.tools.map(t => t.price)),
        {
          label: m.almanac_stat_durability(),
          cells: family.tools.map((t): Cell => ({ kind: 'value', value: m.almanac_uses({ n: t.uses }) })),
        },
        {
          label: m.almanac_stat_use_time(),
          cells: family.tools.map((t): Cell => ({ kind: 'value', value: m.almanac_seconds({ n: Math.round(world.realSeconds(t.workSeconds)) }) })),
        },
      ]
    case 'hold':
      return [
        priceRow(family.tools.map(t => t.price)),
        {
          label: m.almanac_stat_content(),
          cells: family.tools.map((t): Cell => ({ kind: 'value', value: m.almanac_litres({ n: t.liters }) })),
        },
      ]
  }
}

function StatCell({ cell }: { cell: Cell }) {
  switch (cell.kind) {
    case 'value':
      return <span className="text-center text-base text-ink tabular-nums">{cell.value}</span>
    case 'prize':
      return <span className="text-center text-sm leading-tight text-ink/60">{m.almanac_price_prize()}</span>
  }
}

export function ToolPane({ title, family, byId, world }: { title: string; family: ToolFamily; byId: Map<string, CatalogEntry>; world: World }) {
  const ids = toolIds(family)
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{family.desc()}</p>
      <div
        className="grid items-center gap-x-4 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${ids.length}, 6rem) max-content` }}
      >
        {ids.map(id => {
          const entry = skuEntry(byId, id)
          return (
            <Portrait key={id} caption={entry.title} fill={BLUE}>
              <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(entry.icon) }} />
            </Portrait>
          )
        })}
        <span />
        {familyRows(family, world).map(row => (
          <Fragment key={row.label}>
            {row.cells.map((cell, i) => (
              <StatCell key={i} cell={cell} />
            ))}
            <span className="text-base text-ink/65">{row.label}</span>
          </Fragment>
        ))}
      </div>
    </>
  )
}
