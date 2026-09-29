import { m } from '../../paraglide/messages.js'
import { useEffect, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { SETTINGS_DEFAULT, VOLUME_DEFAULT, settings, type Settings } from '../sim/settings.ts'
import { Btn, Checkbox } from './frame.tsx'

const STEP = 5
const STEPS = 100 / STEP

function Toggle({
  checked,
  onChange,
  label,
  body,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  body: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 py-1.5">
      <Checkbox checked={checked} onChange={onChange} label={label} />
      <span className="min-w-0">
        <span className="block text-base leading-none">{label}</span>
        <span className="mt-1 block text-xs text-ink/55">{body}</span>
      </span>
    </label>
  )
}

function Volume({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const set = (v: number) => onChange(Math.min(Math.max(v, 0), 100))
  function pick(e: PointerEvent<HTMLDivElement>): void {
    const r = e.currentTarget.getBoundingClientRect()
    set(Math.ceil(((e.clientX - r.left) / r.width) * STEPS) * STEP)
  }
  function key(e: KeyboardEvent<HTMLDivElement>): void {
    const keys: Partial<Record<string, number>> = {
      ArrowLeft: value - STEP,
      ArrowDown: value - STEP,
      ArrowRight: value + STEP,
      ArrowUp: value + STEP,
      Home: 0,
      End: 100,
    }
    const next = keys[e.key]
    if (next === undefined) return
    e.preventDefault()
    set(next)
  }
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-base leading-none">{label}</span>
        <span className="text-xs tabular-nums text-ink/55">{value}%</span>
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}%`}
        className="relative mt-1.5 flex h-6 cursor-pointer touch-none items-end gap-px border-2 border-transparent pb-1.5 outline-none focus-visible:border-ink"
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId)
          pick(e)
        }}
        onPointerMove={e => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e)
        }}
        onKeyDown={key}
      >
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            className={`flex-1 ${(i + 1) * STEP <= value ? 'bg-ink' : 'bg-ink/15'}`}
            style={{ height: `${25 + (75 * (i + 1)) / STEPS}%` }}
          />
        ))}
        <span
          className="pointer-events-none absolute bottom-0 h-1 w-0.5 -translate-x-1/2 bg-ink/40"
          style={{ left: `${VOLUME_DEFAULT}%` }}
        />
      </div>
    </div>
  )
}

export function SettingsPage({
  value,
  onSave,
  onBack,
  onVolume,
}: {
  value: Settings
  onSave: (next: Settings) => void
  onBack: () => void
  onVolume: (music: number, effects: number) => void
}) {
  const [draft, setDraft] = useState<Settings>(value)
  useEffect(() => {
    onVolume(draft.music, draft.effects)
  }, [onVolume, draft.music, draft.effects])
  useEffect(
    () => () => {
      const saved = settings()
      onVolume(saved.music, saved.effects)
    },
    [onVolume],
  )
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-ink/15 pb-2">
        <button
          type="button"
          aria-label={m.menu_back()}
          className="-ml-2 cursor-pointer px-2 py-0.5 text-lg leading-none text-ink/60 hover:bg-dirt hover:text-house"
          onClick={onBack}
        >
          ←
        </button>
        <div className="font-display text-sm leading-none">{m.menu_settings()}</div>
      </div>
      <Volume value={draft.music} onChange={v => setDraft({ ...draft, music: v })} label={m.menu_music()} />
      <Volume value={draft.effects} onChange={v => setDraft({ ...draft, effects: v })} label={m.menu_effects()} />
      <Toggle
        checked={draft.reducedMotion}
        onChange={v => setDraft({ ...draft, reducedMotion: v })}
        label={m.menu_reduced_motion()}
        body={m.menu_reduced_motion_body()}
      />
      <Toggle
        checked={draft.pauseWhenHidden}
        onChange={v => setDraft({ ...draft, pauseWhenHidden: v })}
        label={m.menu_pause_hidden()}
        body={m.menu_pause_hidden_body()}
      />
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={() => setDraft(SETTINGS_DEFAULT)}>{m.menu_revert_default()}</Btn>
        <Btn onClick={() => onSave(draft)}>{m.menu_save_settings()}</Btn>
      </div>
    </div>
  )
}
