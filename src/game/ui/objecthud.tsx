import { m } from '../../paraglide/messages.js'
import type { ReactNode } from 'react'
import { CROPS, CROP_NAME } from '../defs/crops.ts'
import { SPRINKLER_STEP, SPRINKLER_TILE_DAY, snapFlow } from '../defs/items.ts'
import { WEATHER_NAME } from '../defs/weather.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import type { Coord } from '../sim/building.ts'
import type { GrownCrop } from '../sim/ids.ts'
import { statsOf } from '../sim/modifiers.ts'
import { tuneDay } from '../sim/nets.ts'
import type { Vertex } from '../sim/pipe.ts'
import type { HudTarget, World } from '../sim/world.ts'
import { TILE, type Camera } from '../view/camera.ts'
import { bindHud } from '../view/motion.ts'
import { cropInner, ripeGroup } from '../view/svgs.ts'
import { Btn, Checkbox, Chrome, Field, Radio, Slider } from './frame.tsx'

export type HudRow =
  | { kind: 'check'; id: string; label: string; on: boolean }
  | { kind: 'radio'; id: string; label: string; options: { id: string; label: string; on: boolean }[] }

/** A crop drawn above the sprinkler slider, at the flow that crop drinks. */
export type HudMark = { crop: GrownCrop; label: string; day: number; icon: string }

export type HudSpec = { title: string; col: number; row: number } & (
  | { chrome: 'rows'; rows: HudRow[]; pick: (id: string) => void }
  | { chrome: 'slider'; day: number; max: number; step: number; marks: HudMark[]; set: (day: number) => void }
)

const TUNABLE = (Object.keys(CROPS) as (keyof typeof CROPS)[]).filter(id => CROPS[id].waterUsePerSec > 0)

function perDay(n: number): string {
  return m.sensors_per_tile({ n: Number(n.toFixed(2)) })
}

function cropDay(world: World, crop: GrownCrop): number {
  return statsOf(crop, 'base', 0, world.modifiers).waterUsePerSec * DAY_SECONDS
}

function sprinklerSpec(world: World, at: Vertex): HudSpec | undefined {
  const s = world.sprinklerAt(at)
  if (s === undefined) return undefined
  return {
    title: m.sensors_sprinkler_output(),
    col: at.col,
    row: at.row,
    chrome: 'slider',
    day: snapFlow(tuneDay(world, s)),
    max: SPRINKLER_TILE_DAY,
    step: SPRINKLER_STEP,
    marks: TUNABLE.map(crop => ({
      crop,
      label: CROP_NAME[crop](),
      day: snapFlow(cropDay(world, crop)),
      icon: cropInner(crop, ripeGroup('base')),
    })),
    set: day => {
      world.tuneSprinkler(at, { kind: 'rate', day: snapFlow(day) })
    },
  }
}

function waterSpec(world: World, at: Vertex): HudSpec | undefined {
  const c = world.cell(at)
  if (c.kind !== 'sensor-water') return undefined
  return {
    title: m.names_sensor_water(),
    col: at.col,
    row: at.row,
    chrome: 'rows',
    rows: [
      { kind: 'check', id: 'wilt', label: m.sensors_wilting(), on: c.wilt },
      { kind: 'check', id: 'over', label: m.sensors_overwatered(), on: c.over },
    ],
    pick: id => {
      if (id === 'wilt') world.tuneWater(at, !c.wilt, c.over)
      else world.tuneWater(at, c.wilt, !c.over)
    },
  }
}

function harvestSpec(world: World, at: Vertex): HudSpec | undefined {
  const c = world.cell(at)
  if (c.kind !== 'sensor-harvest') return undefined
  return {
    title: m.names_sensor_harvest(),
    col: at.col,
    row: at.row,
    chrome: 'rows',
    rows: [
      {
        kind: 'radio',
        id: 'mode',
        label: '',
        options: [
          { id: 'any', label: m.sensors_any(), on: c.mode === 'any' },
          { id: 'all', label: m.sensors_all(), on: c.mode === 'all' },
        ],
      },
    ],
    pick: id => {
      world.tuneHarvest(at, id === 'all' ? 'all' : 'any')
    },
  }
}

function daySpec(world: World, at: Vertex): HudSpec | undefined {
  const c = world.cell(at)
  if (c.kind !== 'sensor-day') return undefined
  return {
    title: m.names_sensor_day(),
    col: at.col,
    row: at.row,
    chrome: 'rows',
    rows: [
      { kind: 'check', id: 'sunrise', label: m.names_phase_sunrise(), on: c.sunrise },
      { kind: 'check', id: 'day', label: m.sensors_day(), on: c.day },
      { kind: 'check', id: 'sunset', label: m.names_phase_sunset(), on: c.sunset },
      { kind: 'check', id: 'twilight', label: m.names_phase_twilight(), on: c.twilight },
    ],
    pick: id => {
      if (id === 'sunrise') world.tuneDay(at, !c.sunrise, c.day, c.sunset, c.twilight)
      else if (id === 'day') world.tuneDay(at, c.sunrise, !c.day, c.sunset, c.twilight)
      else if (id === 'sunset') world.tuneDay(at, c.sunrise, c.day, !c.sunset, c.twilight)
      else world.tuneDay(at, c.sunrise, c.day, c.sunset, !c.twilight)
    },
  }
}

function logicSpec(world: World, at: Vertex): HudSpec | undefined {
  const c = world.cell(at)
  if (c.kind !== 'logic') return undefined
  return {
    title: m.names_sensor_logic(),
    col: at.col,
    row: at.row,
    chrome: 'rows',
    rows: [
      {
        kind: 'radio',
        id: 'mode',
        label: '',
        options: [
          { id: 'or', label: m.sensors_or(), on: c.mode === 'or' },
          { id: 'and', label: m.sensors_and(), on: c.mode === 'and' },
        ],
      },
    ],
    pick: id => {
      world.tuneSensor({ k: 'logic', at, mode: id === 'and' ? 'and' : 'or' })
    },
  }
}

function varietySpec(world: World, at: Vertex): HudSpec | undefined {
  const c = world.cell(at)
  if (c.kind !== 'sensor-variety') return undefined
  return {
    title: m.names_sensor_variety(),
    col: at.col,
    row: at.row,
    chrome: 'rows',
    rows: [
      { kind: 'check', id: 'base', label: m.sensors_base(), on: c.baseOn },
      { kind: 'check', id: 'variant', label: m.sensors_variant(), on: c.variant },
      { kind: 'check', id: 'heirloom', label: m.names_rarity_heirloom(), on: c.heirloom },
    ],
    pick: id => {
      if (id === 'base') world.tuneSensor({ k: 'variety', at, base: !c.baseOn, variant: c.variant, heirloom: c.heirloom })
      else if (id === 'variant') {
        world.tuneSensor({ k: 'variety', at, base: c.baseOn, variant: !c.variant, heirloom: c.heirloom })
      } else world.tuneSensor({ k: 'variety', at, base: c.baseOn, variant: c.variant, heirloom: !c.heirloom })
    },
  }
}

function weatherSpec(world: World, at: Vertex): HudSpec | undefined {
  const c = world.cell(at)
  if (c.kind !== 'sensor-weather') return undefined
  return {
    title: m.names_sensor_weather(),
    col: at.col,
    row: at.row,
    chrome: 'rows',
    rows: [
      { kind: 'check', id: 'clear', label: WEATHER_NAME.clear(), on: c.clear },
      { kind: 'check', id: 'rain', label: WEATHER_NAME.rain(), on: c.rain },
      { kind: 'check', id: 'dry', label: WEATHER_NAME.dry(), on: c.dry },
      { kind: 'check', id: 'flood', label: WEATHER_NAME.flood(), on: c.flood },
      { kind: 'check', id: 'drought', label: WEATHER_NAME.drought(), on: c.drought },
    ],
    pick: id => {
      world.tuneSensor({
        k: 'weather',
        at,
        clear: id === 'clear' ? !c.clear : c.clear,
        rain: id === 'rain' ? !c.rain : c.rain,
        dry: id === 'dry' ? !c.dry : c.dry,
        flood: id === 'flood' ? !c.flood : c.flood,
        drought: id === 'drought' ? !c.drought : c.drought,
      })
    },
  }
}

function pressureSpec(world: World, at: Vertex): HudSpec | undefined {
  const c = world.cell(at)
  if (c.kind !== 'vehicle-detector') return undefined
  return {
    title: m.names_sensor_vehicle_detector(),
    col: at.col,
    row: at.row,
    chrome: 'rows',
    rows: [
      { kind: 'check', id: 'vehicle', label: m.sensors_vehicle(), on: c.vehicle },
      { kind: 'check', id: 'player', label: m.sensors_player(), on: c.player },
      { kind: 'check', id: 'item', label: m.sensors_item(), on: c.item },
    ],
    pick: id => {
      if (id === 'vehicle') {
        world.tuneSensor({ k: 'pressure', at, vehicle: !c.vehicle, player: c.player, item: c.item })
      } else if (id === 'player') {
        world.tuneSensor({ k: 'pressure', at, vehicle: c.vehicle, player: !c.player, item: c.item })
      } else world.tuneSensor({ k: 'pressure', at, vehicle: c.vehicle, player: c.player, item: !c.item })
    },
  }
}

export function hudSpec(world: World, target: HudTarget): HudSpec | undefined {
  if (target.kind === 'sprinkler') return sprinklerSpec(world, target.at)
  if (target.kind === 'water') return waterSpec(world, target.at)
  if (target.kind === 'harvest') return harvestSpec(world, target.at)
  if (target.kind === 'day') return daySpec(world, target.at)
  if (target.kind === 'logic') return logicSpec(world, target.at)
  if (target.kind === 'variety') return varietySpec(world, target.at)
  if (target.kind === 'weather') return weatherSpec(world, target.at)
  if (target.kind === 'pressure') return pressureSpec(world, target.at)
  return undefined
}

function CounterHud({
  world,
  at,
  cam,
  onClose,
}: {
  world: World
  at: Coord
  cam: Camera
  onClose: () => void
}) {
  const c = world.cell(at)
  if (c.kind !== 'counter') return undefined
  return (
    <div
      className="pointer-events-auto absolute z-30 w-56"
      style={{
        left: `calc(50% + ${(at.col + 0.5 - cam.x) * TILE * cam.scale}px)`,
        top: `calc(50% + ${(at.row - cam.y) * TILE * cam.scale}px)`,
        transform: 'translate(-50%, calc(-100% - 8px))',
      }}
    >
      <Chrome className="relative">
        <div className="relative z-20 px-2 pb-2 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-lg text-ink">{m.names_sensor_counter()}</div>
            <button type="button" className="cursor-pointer px-1 text-lg text-ink hover:bg-dirt" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <div ref={el => bindHud('counter', el)} data-counter className="tabular-nums text-lg">
              {c.count}
            </div>
            <div className="text-sm">{m.sensors_count_to()}</div>
            <Field
              name="n"
              aria-label={m.sensors_count_to()}
              value={String(c.n)}
              onChange={v => {
                const n = Number.parseInt(v, 10)
                if (Number.isNaN(n)) return
                world.tuneCounter(at, n)
              }}
            />
            <Btn className="w-full" onClick={() => world.resetCounter(at)}>
              {m.sensors_reset({ n: 0 })}
            </Btn>
          </div>
        </div>
      </Chrome>
    </div>
  )
}

function HudShell({
  col,
  row,
  cam,
  title,
  onClose,
  pin,
  width,
  children,
}: {
  col: number
  row: number
  cam: Camera
  title: string
  onClose: () => void
  pin: 'above' | 'at'
  width: string
  children: ReactNode
}) {
  const above = pin === 'above'
  return (
    <div
      className={`pointer-events-auto absolute z-30 ${width}`}
      style={{
        left: `calc(50% + ${(col + (above ? 0.5 : 0) - cam.x) * TILE * cam.scale}px)`,
        top: `calc(50% + ${(row - cam.y) * TILE * cam.scale}px)`,
        transform: above ? 'translate(-50%, calc(-100% - 8px))' : undefined,
      }}
    >
      <Chrome className="relative">
        <div className="relative z-20 px-2 pb-2 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-lg text-ink">{title}</div>
            <button type="button" className="cursor-pointer px-1 text-lg text-ink hover:bg-dirt" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="flex flex-col gap-1">{children}</div>
        </div>
      </Chrome>
    </div>
  )
}

/** Half the slider thumb, so a mark sits over the value the thumb reads there. */
const THUMB = 10

/** The cell a crop mark sits in. Big enough to read the fruit, not just tell that one is there. */
const MARK = 45

/** Crops that want the same amount share one spot, so they stack instead of hiding each other. */
function columnsOf(marks: readonly HudMark[]): HudMark[][] {
  const byDay = new Map<number, HudMark[]>()
  marks.forEach(mk => {
    const col = byDay.get(mk.day)
    if (col === undefined) byDay.set(mk.day, [mk])
    else col.push(mk)
  })
  return [...byDay.values()].sort((x, y) => x[0]!.day - y[0]!.day)
}

function FlowSlider({ spec }: { spec: Extract<HudSpec, { chrome: 'slider' }> }) {
  const columns = columnsOf(spec.marks)
  const tall = Math.max(...columns.map(col => col.length))
  return (
    <>
      <div className="relative" style={{ height: tall * MARK }}>
        {columns.map(col => (
          <div
            key={col[0]!.day}
            className="absolute bottom-0 flex -translate-x-1/2 flex-col-reverse items-center"
            style={{ left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${col[0]!.day / spec.max})` }}
          >
            {col.map(mk => (
              <button
                key={mk.crop}
                type="button"
                aria-label={`${mk.label} ${perDay(mk.day)}`}
                title={`${mk.label} — ${perDay(mk.day)}`}
                className="flex cursor-pointer items-center justify-center hover:bg-dirt/30"
                style={{ width: MARK, height: MARK }}
                onClick={() => spec.set(mk.day)}
              >
                <svg className="size-9" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: mk.icon }} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <Slider
        name="flow"
        aria-label={spec.title}
        value={spec.day}
        max={spec.max}
        step={spec.step}
        onChange={spec.set}
      />
      <div className="tabular-nums text-base text-ink">{perDay(spec.day)}</div>
    </>
  )
}

function RowList({ spec }: { spec: Extract<HudSpec, { chrome: 'rows' }> }) {
  return (
    <>
      {spec.rows.map(row => {
        if (row.kind === 'check') {
          return (
            <label key={row.id} className="flex cursor-pointer items-center gap-2 py-0.5">
              <Checkbox checked={row.on} onChange={() => spec.pick(row.id)} label={row.label} />
              <span className="text-base leading-none">{row.label}</span>
            </label>
          )
        }
        return (
          <div key={row.id} className="flex flex-col gap-1">
            {row.options.map(o => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 py-0.5">
                <Radio name={row.id} value={o.id} checked={o.on} onChange={() => spec.pick(o.id)} label={o.label} />
                <span className="text-base leading-none">{o.label}</span>
              </label>
            ))}
          </div>
        )
      })}
    </>
  )
}

export function ObjectHud({ world, cam, onClose }: { world: World; cam: Camera; onClose: () => void }) {
  const target = world.hud
  if (target === undefined) return undefined
  if (target.kind === 'counter') return <CounterHud world={world} at={target.at} cam={cam} onClose={onClose} />
  const spec = hudSpec(world, target)
  if (spec === undefined) return undefined
  return (
    <HudShell
      col={spec.col}
      row={spec.row}
      cam={cam}
      title={spec.title}
      onClose={onClose}
      pin={spec.chrome === 'rows' ? 'above' : 'at'}
      width={spec.chrome === 'rows' ? 'w-56' : 'w-72'}
    >
      {spec.chrome === 'rows' ? (
        <>
          <div className="text-sm text-ink/55">{m.sensors_send_when()}</div>
          <RowList spec={spec} />
        </>
      ) : (
        <FlowSlider spec={spec} />
      )}
    </HudShell>
  )
}
