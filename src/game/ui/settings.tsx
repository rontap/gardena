import { m } from '../../paraglide/messages.js'
import { useState } from 'react'
import { SETTINGS_DEFAULT, type Settings } from '../sim/settings.ts'
import { Btn, Checkbox } from './frame.tsx'

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

export function SettingsPage({
  value,
  onSave,
  onBack,
}: {
  value: Settings
  onSave: (next: Settings) => void
  onBack: () => void
}) {
  const [draft, setDraft] = useState<Settings>(value)
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
