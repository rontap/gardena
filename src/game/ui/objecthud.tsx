import { m } from '../../paraglide/messages.js'
import type { ReactNode } from 'react'
import { CROPS, CROP_NAME } from '../defs/crops.ts'
import { SPRINKLER_TILE_DAY } from '../defs/items.ts'
import { WEATHER_NAME } from '../defs/weather.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import type { Coord } from '../sim/building.ts'
import type { CropId } from '../sim/ids.ts'
import { statsOf } from '../sim/modifiers.ts'
import type { Vertex } from '../sim/pipe.ts'
import type { HudTarget, World } from '../sim/world.ts'
import { TILE, type Camera } from '../view/camera.ts'
import { bindHud } from '../view/motion.ts'
import { cropInner, itemInner, ripeGroup } from '../view/svgs.ts'
import { Btn, Checkbox, Chrome, Field, Radio } from './frame.tsx'

export type HudOption = { id: string; label: string; note: string; icon: string; on: boolean }

export type HudRow =
  | { kind: 'check'; id: string; label: string; on: boolean }
  | { kind: 'radio'; id: string; label: string; options: { id: string; label: string; on: boolean }[] }

export type HudSpec = {
  title: string
  col: number
  row: number
  stay: boolean
  pick: (id: string) => void
} & ({ chrome: 'btns'; options: HudOption[] } | { chrome: 'rows'; rows: HudRow[] })

const TUNABLE = (Object.keys(CROPS) as (keyof typeof CROPS)[]).filter(id => CROPS[id].waterUsePerSec > 0)

function perDay(n: number): string {
  return m.sensors_per_tile({ n: Number((n * DAY_SECONDS).toFixed(2)) })
}

function sprinklerSpec(world: World, at: Vertex): HudSpec | undefined {
  const s = world.sprinklerAt(at)
  if (s === undefined) return undefined
  return {
    title: m.sensors_sprinkler_output(),
    col: at.col,
    row: at.row,
    stay: false,
    chrome: 'btns',
    options: [
      {
        id: 'flat',
        label: m.sensors_full_flow(),
        note: m.sensors_per_tile({ n: SPRINKLER_TILE_DAY }),
        icon: itemInner({ kind: 'sprinkler' }),
        on: s.tune.kind === 'flat',
      },
      ...TUNABLE.map(crop => ({
        id: crop,
        label: CROP_NAME[crop](),
        note: perDay(statsOf(crop, 'base', 0, world.modifiers).waterUsePerSec),
        icon: cropInner(crop, ripeGroup('base')),
        on: s.tune.kind === 'crop' && s.tune.crop === crop,
      })),
    ],
    pick: id => {
      world.tuneSprinkler(at, id === 'flat' ? { kind: 'flat' } : { kind: 'crop', crop: id as CropId })
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
    stay: true,
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
    stay: true,
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
    stay: true,
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
    stay: true,
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
    stay: true,
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
    stay: true,
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
    stay: true,
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
  children,
}: {
  col: number
  row: number
  cam: Camera
  title: string
  onClose: () => void
  pin: 'above' | 'at'
  children: ReactNode
}) {
  const above = pin === 'above'
  return (
    <div
      className="pointer-events-auto absolute z-30 w-56"
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
    >
      {spec.chrome === 'rows' ? <div className="text-sm text-ink/55">{m.sensors_send_when()}</div> : undefined}
      {spec.chrome === 'btns'
        ? spec.options.map(o => (
            <Btn
              key={o.id}
              className="w-full"
              selected={o.on}
              onClick={() => {
                spec.pick(o.id)
                if (!spec.stay) onClose()
              }}
            >
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: o.icon }} />
                <span className="flex flex-col leading-tight">
                  <span className="text-base">{o.label}</span>
                  <span className="text-base opacity-70">{o.note}</span>
                </span>
              </span>
            </Btn>
          ))
        : <RowList spec={spec} />}
    </HudShell>
  )
}
