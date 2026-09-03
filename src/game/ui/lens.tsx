import { m } from '../../paraglide/messages.js'
import type { World } from '../sim/world.ts'
import type { Lens } from '../view/map.tsx'
import { Dock, Label } from './frame.tsx'

type Row = { id: Lens; label: () => string; blurb: () => string; swatches: { face: string; name: () => string }[] }

export const LENS_ROWS: Row[] = [
  {
    id: 'water',
    label: () => m.hud_lens_water(),
    blurb: () => m.hud_lens_water_blurb(),
    swatches: [
      { face: 'bg-lens-bad', name: () => m.hud_swatch_dry() },
      { face: 'bg-lens-good', name: () => m.hud_swatch_wet() },
      { face: 'bg-lens-done', name: () => m.hud_swatch_full() },
    ],
  },
  {
    id: 'land',
    label: () => m.hud_lens_land(),
    blurb: () => m.hud_lens_land_blurb(),
    swatches: [
      { face: 'bg-lens-bad', name: () => m.hud_swatch_low() },
      { face: 'bg-lens-good', name: () => m.hud_swatch_ok() },
      { face: 'bg-lens-done', name: () => m.hud_swatch_full() },
    ],
  },
  {
    id: 'ripe',
    label: () => m.hud_lens_ripe(),
    blurb: () => m.hud_lens_ripe_blurb(),
    swatches: [
      { face: 'bg-lens-bad', name: () => m.hud_swatch_early() },
      { face: 'bg-lens-good', name: () => m.hud_swatch_ready() },
      { face: 'bg-lens-done', name: () => m.hud_swatch_ripe() },
    ],
  },
  {
    id: 'kind',
    label: () => m.hud_lens_kind(),
    blurb: () => m.hud_lens_kind_blurb(),
    swatches: [
      { face: 'bg-leaf', name: () => m.hud_swatch_plant() },
      { face: 'bg-water', name: () => m.hud_swatch_machine() },
      { face: 'bg-ink', name: () => m.hud_swatch_obstruction() },
      { face: 'bg-roof', name: () => m.hud_swatch_building() },
    ],
  },
  {
    id: 'rarity',
    label: () => m.almanac_concept_rarity(),
    blurb: () => m.hud_lens_rarity_blurb(),
    swatches: [
      { face: 'bg-house', name: () => m.hud_swatch_common() },
      { face: 'bg-leaf', name: () => m.hud_swatch_uncommon() },
      { face: 'bg-water', name: () => m.hud_swatch_rare() },
      { face: 'bg-ripe', name: () => m.hud_swatch_heirloom() },
    ],
  },
  {
    id: 'pipes',
    label: () => m.hud_lens_pipes(),
    blurb: () => m.hud_lens_pipes_blurb(),
    swatches: [],
  },
  {
    id: 'sensors',
    label: () => m.almanac_tab_sensors(),
    blurb: () => m.hud_lens_sensors_blurb(),
    swatches: [],
  },
  {
    id: 'vehicles',
    label: () => m.hud_lens_vehicles(),
    blurb: () => m.hud_lens_vehicles_blurb(),
    swatches: [],
  },
]

export function LensPanel({
  world,
  lens,
  lock,
  onPick,
  onLock,
  onClose,
}: {
  world: World
  lens: Lens
  lock: boolean
  onPick: (lens: Lens) => void
  onLock: (lock: boolean) => void
  onClose: () => void
}) {
  const rows = LENS_ROWS.filter(row => {
    if (row.id === 'water') return world.hasSkill('water-study')
    if (row.id === 'land') return world.hasSkill('land-study')
    if (row.id === 'sensors') return world.done.has('unlock-sensors')
    if (row.id === 'vehicles') return world.done.has('unlock-vehicles')
    return true
  })
  const locked = LENS_ROWS.filter(row => row.id === 'water' || row.id === 'land').length - rows.filter(row => row.id === 'water' || row.id === 'land').length
  return (
    <Dock title={m.hud_lens()} onClose={onClose} width="w-80">
      <button
        type="button"
        onClick={() => onPick('off')}
        className={`mb-3 flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm font-semibold ${
          lens === 'off' ? 'bg-ink text-house' : 'bg-ink/8 text-ink/70 hover:bg-ink/15'
        }`}
      >
        <span>{m.hud_lens_off()}</span>
        {lens === 'off' && <span className="text-xs">{m.hud_lens_active()}</span>}
      </button>
      <button
        type="button"
        disabled={lens === 'off'}
        onClick={() => onLock(!lock)}
        className={`mb-3 flex w-full items-center justify-between px-3 py-2 text-sm font-semibold ${
          lens === 'off'
            ? 'cursor-default bg-ink/5 text-ink/30'
            : lock
              ? 'cursor-pointer bg-dirt-dark text-house'
              : 'cursor-pointer bg-ink/8 text-ink/70 hover:bg-ink/15'
        }`}
      >
        <span>{m.hud_lens_lock()}</span>
        <span className="text-xs">
          {lens === 'off' ? m.hud_lens_pick_first() : lock ? m.hud_lens_stays() : m.hud_lens_off_close()}
        </span>
      </button>
      <Label>{m.hud_lens_overlays()}</Label>
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
                <span className="text-base leading-none font-semibold">{row.label()}</span>
                {on && <span className="text-xs leading-none opacity-70">{m.hud_lens_active()}</span>}
              </span>
              <span className={`text-sm leading-snug ${on ? 'text-house/75' : 'text-ink/55'}`}>{row.blurb()}</span>
              {row.swatches.length > 0 && (
                <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-none">
                  {row.swatches.map(s => (
                    <span key={s.face} className="flex items-center gap-1">
                      <span className={`inline-block size-2.5 ${s.face} outline outline-ink/30`} />
                      {s.name()}
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
          {locked === 1 ? m.hud_lens_waiting_one({ n: locked }) : m.hud_lens_waiting_many({ n: locked })}
        </div>
      )}
    </Dock>
  )
}
