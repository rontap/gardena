import { CROPS } from '../defs/crops.ts'
import { SPRINKLER_TILE_DAY } from '../defs/items.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import type { CropId } from '../sim/ids.ts'
import { statsOf } from '../sim/modifiers.ts'
import type { Vertex } from '../sim/pipe.ts'
import type { HudTarget, World } from '../sim/world.ts'
import { TILE, type Camera } from '../view/camera.ts'
import { cropInner, itemInner, ripeGroup } from '../view/svgs.ts'
import { Btn, Chrome } from './frame.tsx'

export type HudOption = { id: string; label: string; note: string; icon: string; on: boolean }

export type HudSpec = { title: string; at: Vertex; options: HudOption[]; pick: (id: string) => void }

const TUNABLE = (Object.keys(CROPS) as CropId[]).filter(id => CROPS[id].waterUsePerSec > 0)

function perDay(n: number): string {
  return `${Number((n * DAY_SECONDS).toFixed(2))} L/day per tile`
}

function sprinklerSpec(world: World, at: Vertex): HudSpec | undefined {
  const s = world.sprinklerAt(at)
  if (s === undefined) return undefined
  return {
    title: 'Sprinkler output',
    at,
    options: [
      {
        id: 'flat',
        label: 'Full flow',
        note: `${SPRINKLER_TILE_DAY} L/day per tile`,
        icon: itemInner({ kind: 'sprinkler' }),
        on: s.tune.kind === 'flat',
      },
      ...TUNABLE.map(crop => ({
        id: crop,
        label: crop.slice(0, 1).toUpperCase() + crop.slice(1),
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

export function hudSpec(world: World, target: HudTarget): HudSpec | undefined {
  return sprinklerSpec(world, target.at)
}

export function ObjectHud({ world, cam, onClose }: { world: World; cam: Camera; onClose: () => void }) {
  const target = world.hud
  if (target === undefined) return undefined
  const spec = hudSpec(world, target)
  if (spec === undefined) return undefined
  return (
    <div
      className="pointer-events-auto absolute z-30 w-56"
      style={{
        left: `calc(50% + ${(spec.at.col - cam.x) * TILE * cam.scale}px)`,
        top: `calc(50% + ${(spec.at.row - cam.y) * TILE * cam.scale}px)`,
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
                  onClose()
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
