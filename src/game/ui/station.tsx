import { m } from '../../paraglide/messages.js'
import { cropVariety } from '../defs/crops.ts'
import { STATION_GRAFT_MAX, STATION_GRAFT_MIN } from '../defs/items.ts'
import type { Coord } from '../sim/building.ts'
import type { World } from '../sim/world.ts'
import { Bar } from './frame.tsx'
import { Shell } from './store.tsx'

export function StationUi({ world, at, onClose }: { world: World; at: Coord; onClose: () => void }) {
  const cell = world.cell(at)
  if (cell.kind !== 'station') return null
  const crop = cell.crop
  return (
    <Shell title={m.names_building_station()} onClose={onClose} className="w-[30rem]">
      <div className="flex flex-col gap-2 text-base text-ink">
        <Row
          label={m.hud_station_variety()}
          value={crop === 'none' ? m.prompt_station_empty_variety() : cropVariety(crop, cell.variety)}
        />
        <Row
          label={m.hud_station_quality()}
          value={
            crop === 'none' ? m.prompt_station_empty_variety() : m.hud_station_pct({ n: Math.floor(cell.quality * 100) })
          }
        />
        <Row
          label={m.hud_station_grafts()}
          value={m.prompt_station_grafts({ min: STATION_GRAFT_MIN, max: STATION_GRAFT_MAX })}
        />
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-ink/55">{m.hud_station_progress()}</span>
          <Bar value={cell.progress} color="bg-leaf" track="bg-ink/25" className="h-1.5 flex-1" />
        </div>
      </div>
      <div className="mt-3 text-sm text-ink/55">{m.prompt_station_footer()}</div>
    </Shell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-24 shrink-0 text-ink/55">{label}</span>
      <span className="min-w-0 flex-1 truncate">{value}</span>
    </div>
  )
}
