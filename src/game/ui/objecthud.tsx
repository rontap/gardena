import { m } from '../../paraglide/messages.js'
import { CROPS, CROP_NAME } from '../defs/crops.ts'
import { SPRINKLER_TILE_DAY } from '../defs/items.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import type { Coord } from '../sim/building.ts'
import type { CropId } from '../sim/ids.ts'
import { statsOf } from '../sim/modifiers.ts'
import type { Vertex } from '../sim/pipe.ts'
import type { HudTarget, World } from '../sim/world.ts'
import { TILE, type Camera } from '../view/camera.ts'
import { bindHud } from '../view/motion.ts'
import { cropInner, itemInner, ripeGroup } from '../view/svgs.ts'
import { Btn, Chrome, Field } from './frame.tsx'

export type HudOption = { id: string; label: string; note: string; icon: string; on: boolean }

export type HudSpec = {
  title: string
  col: number
  row: number
  options: HudOption[]
  pick: (id: string) => void
  stay: boolean
}

const TUNABLE = (Object.keys(CROPS) as CropId[]).filter(id => CROPS[id].waterUsePerSec > 0)

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
        note: perDay(statsOf(crop, 'common', world.modifiers).waterUsePerSec),
        icon: cropInner(crop, ripeGroup('common')),
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
    options: [
      {
        id: 'wilt',
        label: m.sensors_wilting(),
        note: '',
        icon: itemInner({ kind: 'sensor-water' }),
        on: c.wilt,
      },
      {
        id: 'over',
        label: m.sensors_overwatered(),
        note: '',
        icon: itemInner({ kind: 'sensor-water' }),
        on: c.over,
      },
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
    options: [
      {
        id: 'any',
        label: m.sensors_any(),
        note: '',
        icon: itemInner({ kind: 'sensor-harvest' }),
        on: c.mode === 'any',
      },
      {
        id: 'all',
        label: m.sensors_all(),
        note: '',
        icon: itemInner({ kind: 'sensor-harvest' }),
        on: c.mode === 'all',
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
    options: [
      {
        id: 'sunrise',
        label: m.names_phase_sunrise(),
        note: '',
        icon: itemInner({ kind: 'sensor-day' }),
        on: c.sunrise,
      },
      {
        id: 'day',
        label: m.sensors_day(),
        note: '',
        icon: itemInner({ kind: 'sensor-day' }),
        on: c.day,
      },
      {
        id: 'sunset',
        label: m.names_phase_sunset(),
        note: '',
        icon: itemInner({ kind: 'sensor-day' }),
        on: c.sunset,
      },
      {
        id: 'twilight',
        label: m.names_phase_twilight(),
        note: '',
        icon: itemInner({ kind: 'sensor-day' }),
        on: c.twilight,
      },
    ],
    pick: id => {
      if (id === 'sunrise') world.tuneDay(at, !c.sunrise, c.day, c.sunset, c.twilight)
      else if (id === 'day') world.tuneDay(at, c.sunrise, !c.day, c.sunset, c.twilight)
      else if (id === 'sunset') world.tuneDay(at, c.sunrise, c.day, !c.sunset, c.twilight)
      else world.tuneDay(at, c.sunrise, c.day, c.sunset, !c.twilight)
    },
  }
}

export function hudSpec(world: World, target: HudTarget): HudSpec | undefined {
  if (target.kind === 'sprinkler') return sprinklerSpec(world, target.at)
  if (target.kind === 'water') return waterSpec(world, target.at)
  if (target.kind === 'harvest') return harvestSpec(world, target.at)
  if (target.kind === 'day') return daySpec(world, target.at)
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
        left: `calc(50% + ${(at.col - cam.x) * TILE * cam.scale}px)`,
        top: `calc(50% + ${(at.row - cam.y) * TILE * cam.scale}px)`,
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

export function ObjectHud({ world, cam, onClose }: { world: World; cam: Camera; onClose: () => void }) {
  const target = world.hud
  if (target === undefined) return undefined
  if (target.kind === 'counter') return <CounterHud world={world} at={target.at} cam={cam} onClose={onClose} />
  const spec = hudSpec(world, target)
  if (spec === undefined) return undefined
  return (
    <div
      className="pointer-events-auto absolute z-30 w-56"
      style={{
        left: `calc(50% + ${(spec.col - cam.x) * TILE * cam.scale}px)`,
        top: `calc(50% + ${(spec.row - cam.y) * TILE * cam.scale}px)`,
      }}
    >
      <Chrome className="relative">
        <div className="relative z-20 px-2 pb-2 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-lg text-ink">{spec.title}</div>
            <button type="button" className="cursor-pointer px-1 text-lg text-ink hover:bg-dirt" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {spec.options.map(o => (
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
            ))}
          </div>
        </div>
      </Chrome>
    </div>
  )
}
