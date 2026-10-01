import { useContext } from 'react'
import { m } from '../../../paraglide/messages.js'
import type { CatalogEntry } from '../../defs/catalog.ts'
import { COUNTER_MAX } from '../../defs/items.ts'
import { TREE_IDS } from '../../sim/ids.ts'
import type { World } from '../../sim/world.ts'
import { faceName, type Face } from '../../sim/item.ts'
import { MACHINE_IDS, recipesMaking, type MachineId } from '../../sim/feature-machines/recipe.ts'
import {
  buttonArt,
  counterArt,
  daySensorArt,
  DIRT,
  fertSensorArt,
  harvestSensorArt,
  itemInner,
  lampArt,
  leverArt,
  logicArt,
  PROP_NOT,
  pulserArt,
  varietySensorArt,
  vehicleDetectorArt,
  waterSensorArt,
  weatherSensorArt,
} from '../../view/svgs.ts'
import { useCycle } from '../cycle.ts'
import { Recipes } from '../recipe.tsx'
import {
  BAG_FACES,
  BAG_IDS,
  BLUE,
  BROWN,
  CardPane,
  GREEN,
  MACHINE_LOOK,
  MACHINE_TAB_IDS,
  MachineCard,
  PipePane,
  Portrait,
  type MachineLook,
} from './almanac-cards.tsx'
import type { AlmanacDone } from './almanac.tsx'
import { AlmanacTip, CROP_IDS, Rich, type AlmanacTab } from './nav.tsx'
import { CropPane, TreePane } from './stats.tsx'

const SILO_IDS: readonly string[] = ['silo-seed', 'silo-spray', 'silo-produce']

export function FormCards({ title, entries }: { title: string; entries: CatalogEntry[] }) {
  const blurbs = [...new Set(entries.map(e => e.blurb))]
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{title}</div>
      <div className="flex flex-col gap-4">
        {blurbs.map(blurb => (
          <div key={blurb}>
            <p className="mb-4 text-base leading-relaxed text-ink/75"><Rich text={blurb} /></p>
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

function MachinePane({ entry, look, world }: { entry: CatalogEntry; look: MachineLook; world: World }) {
  const machine = MACHINE_IDS.find(x => x === entry.id)
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{entry.title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75"><Rich text={entry.blurb} /></p>
      <MachineCard key={entry.id} look={look} />
      {machine !== undefined && <MachineRecipes machine={machine} world={world} />}
    </>
  )
}

const SENSOR_IDS = [
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

const SENSOR_PAGE: { readonly [K in SensorId]: SensorPage } = {
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

function SensorPane({ entry, page }: { entry: CatalogEntry; page: SensorPage }) {
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{entry.title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75"><Rich text={entry.blurb} /></p>
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

function skuFill(id: string): string {
  if (MADE_IDS.includes(id)) return BLUE
  if (GROWN_IDS.includes(id)) return BROWN
  return GREEN
}

function Plate({ entry }: { entry: CatalogEntry }) {
  return (
    <div className={`flex h-20 w-20 items-center justify-center ${skuFill(entry.id)}`}>
      <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(entry.icon) }} />
    </div>
  )
}

export function Pane({
  entry,
  done,
  familiarity,
  tab,
  world,
}: {
  entry: CatalogEntry
  done: AlmanacDone
  familiarity: World['familiarity']
  tab: AlmanacTab
  world: World
}) {
  const tree = TREE_IDS.find(id => id === entry.id)
  if (tree !== undefined) return <TreePane key={tree} tree={tree} n={familiarity[tree]} done={done} rules={world.rules} />
  const crop = CROP_IDS.find(id => id === entry.id)
  if (crop !== undefined) return <CropPane key={crop} crop={crop} n={familiarity[crop]} done={done} rules={world.rules} />
  const text = <Rich text={entry.blurb} />
  if (entry.id === 'pipe') return <PipePane title={entry.title} blurb={text} />
  if (SILO_IDS.includes(entry.id)) return <CardPane title={entry.title} text={text} fill={GREEN} art={itemInner(entry.icon)} />
  if (tab === 'misc') return <CardPane title={entry.title} text={text} fill={skuFill(entry.id)} art={entry.id === 'soil' ? DIRT[0] : itemInner(entry.icon)} />
  if (tab === 'water') return <CardPane title={entry.title} text={text} fill={GREEN} art={itemInner(entry.icon)} />
  const bag = BAG_IDS.find(id => id === entry.id)
  if (bag !== undefined) return <BagPane entry={entry} faces={BAG_FACES[bag]} />
  const sensor = SENSOR_IDS.find(id => id === entry.id)
  if (sensor !== undefined) return <SensorPane key={sensor} entry={entry} page={SENSOR_PAGE[sensor]} />
  const shown = MACHINE_TAB_IDS.find(id => id === entry.id)
  if (shown !== undefined) return <MachinePane entry={entry} look={MACHINE_LOOK[shown]} world={world} />
  const machine = MACHINE_IDS.find(m => m === entry.id)
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{entry.title}</div>
      <div className="mb-3">
        <Plate entry={entry} />
      </div>
      <div className="text-base leading-relaxed text-ink"><Rich text={entry.blurb} /></div>
      {machine !== undefined && <MachineRecipes machine={machine} world={world} />}
    </>
  )
}

function MachineRecipes({ machine, world }: { machine: MachineId; world: World }) {
  return (
    <div className="mt-4">
      <div className="mb-1 font-display text-xs leading-none text-ink">{m.hud_recipes()}</div>
      <Recipes view={{ kind: 'list', machine }} size="md" world={world} />
    </div>
  )
}

function BagPane({ entry, faces }: { entry: CatalogEntry; faces: readonly Face[] }) {
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{entry.title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75"><Rich text={entry.blurb} /></p>
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
