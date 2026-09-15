import { m } from '../../paraglide/messages.js'
import { CROP_NAME, cropVariety } from '../defs/crops.ts'
import { familiarityMax } from '../defs/varieties.ts'
import type { Coord } from '../sim/building.ts'
import { GROWN_IDS, type GrownCrop } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { fruitInner } from '../view/svgs.ts'
import { Bar } from './frame.tsx'
import { Shell } from './store.tsx'

export function StationUi({ world, at, onClose }: { world: World; at: Coord; onClose: () => void }) {
  const cell = world.cell(at)
  if (cell.kind !== 'station') return null
  const known = GROWN_IDS.filter(crop => world.familiarity[crop] > 0)
  return (
    <Shell title={m.hud_station_title()} onClose={onClose} className="w-[30rem]">
      {known.length === 0 ? (
        <div className="text-sm leading-relaxed text-ink/70">{m.hud_station_empty()}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {known.map(crop => (
            <CropRow key={crop} crop={crop} n={world.familiarity[crop]} />
          ))}
        </div>
      )}
      {cell.crop !== 'none' && (
        <div className="mt-3 flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-sm text-ink/55">
            {cropVariety(cell.crop, cell.variety)}
          </span>
          <Bar value={cell.progress} color="bg-leaf" track="bg-ink/25" className="h-1.5 flex-1" />
        </div>
      )}
    </Shell>
  )
}

function CropRow({ crop, n }: { crop: GrownCrop; n: number }) {
  const max = familiarityMax(crop)
  return (
    <div className="flex items-center gap-3 bg-ink/6 px-3 py-2">
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: fruitInner(crop) }} />
      <span className="min-w-0 flex-1 truncate text-base text-ink">{CROP_NAME[crop]()}</span>
      <span className="shrink-0 text-sm text-ink/55">{m.hud_station_row({ n, max })}</span>
      <Bar value={n / max} color="bg-leaf" track="bg-ink/20" className="h-1.5 w-24 shrink-0" />
    </div>
  )
}
