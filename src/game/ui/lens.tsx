import type { World } from '../sim/world.ts'
import type { Lens } from '../view/map.tsx'
import { Dock, Label } from './frame.tsx'

type Row = { id: Lens; label: string; blurb: string; swatches: { face: string; name: string }[] }

export const LENS_ROWS: Row[] = [
  {
    id: 'water',
    label: 'Water need',
    blurb: 'How close each plot sits to the water its crop wants.',
    swatches: [
      { face: 'bg-lens-bad', name: 'dry' },
      { face: 'bg-lens-good', name: 'wet' },
      { face: 'bg-lens-done', name: 'full' },
    ],
  },
  {
    id: 'land',
    label: 'Land quality',
    blurb: 'Fertility baked into the soil, before anything you add.',
    swatches: [
      { face: 'bg-lens-bad', name: 'low' },
      { face: 'bg-lens-good', name: 'ok' },
      { face: 'bg-lens-done', name: 'full' },
    ],
  },
  {
    id: 'ripe',
    label: 'Ripeness',
    blurb: 'How far along every growing plant is.',
    swatches: [
      { face: 'bg-lens-bad', name: 'early' },
      { face: 'bg-lens-good', name: 'ready' },
      { face: 'bg-lens-done', name: 'ripe' },
    ],
  },
  {
    id: 'kind',
    label: 'Object type',
    blurb: 'Sorts everything on the map into four families.',
    swatches: [
      { face: 'bg-leaf', name: 'plant' },
      { face: 'bg-water', name: 'machine' },
      { face: 'bg-ink', name: 'obstruction' },
      { face: 'bg-roof', name: 'building' },
    ],
  },
  {
    id: 'rarity',
    label: 'Rarity',
    blurb: 'The grade every planted crop is currently carrying.',
    swatches: [
      { face: 'bg-house', name: 'common' },
      { face: 'bg-leaf', name: 'uncommon' },
      { face: 'bg-water', name: 'rare' },
      { face: 'bg-ripe', name: 'heirloom' },
    ],
  },
  {
    id: 'pipes',
    label: 'Pipes',
    blurb: 'Reveals the whole water grid and every sprinkler reach.',
    swatches: [],
  },
]

export function LensPanel({
  world,
  lens,
  onPick,
  onClose,
}: {
  world: World
  lens: Lens
  onPick: (lens: Lens) => void
  onClose: () => void
}) {
  const rows = LENS_ROWS.filter(row => {
    if (row.id === 'water') return world.hasSkill('water-study')
    if (row.id === 'land') return world.hasSkill('land-study')
    return true
  })
  const locked = LENS_ROWS.length - rows.length
  return (
    <Dock title="Lens" onClose={onClose}>
      <button
        type="button"
        onClick={() => onPick('off')}
        className={`mb-3 flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm font-semibold ${
          lens === 'off' ? 'bg-ink text-house' : 'bg-ink/8 text-ink/70 hover:bg-ink/15'
        }`}
      >
        <span>No lens</span>
        {lens === 'off' && <span className="text-xs">active</span>}
      </button>
      <Label>Overlays</Label>
      <div className="flex flex-col gap-1.5">
        {rows.map(row => {
          const on = lens === row.id
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onPick(row.id)}
              className={`flex w-full cursor-pointer flex-col gap-1 px-3 py-2 text-left ${
                on ? 'bg-dirt-dark text-house' : 'bg-ink/8 text-ink hover:bg-ink/15'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-base leading-none font-semibold">{row.label}</span>
                {on && <span className="text-xs leading-none opacity-70">active</span>}
              </span>
              <span className={`text-sm leading-snug ${on ? 'text-house/75' : 'text-ink/55'}`}>{row.blurb}</span>
              {row.swatches.length > 0 && (
                <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-none">
                  {row.swatches.map(s => (
                    <span key={s.name} className="flex items-center gap-1">
                      <span className={`inline-block size-2.5 ${s.face} outline outline-ink/30`} />
                      {s.name}
                    </span>
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {locked > 0 && (
        <div className="mt-3 border-t border-ink/15 pt-2 text-sm text-ink/45">
          {locked} more {locked === 1 ? 'lens is' : 'lenses are'} waiting on a family study skill.
        </div>
      )}
    </Dock>
  )
}
