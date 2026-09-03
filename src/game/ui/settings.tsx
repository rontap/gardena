import { m } from '../../paraglide/messages.js'
import { useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { SETTINGS_DEFAULT, type Settings } from '../sim/settings.ts'
import { Btn } from './frame.tsx'

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
      <Checkbox.Root
        checked={checked}
        aria-label={label}
        onCheckedChange={v => onChange(v === true)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer border-2 border-ink/30 bg-parch shadow-[inset_2px_2px_0_0_rgba(28,23,16,0.12)] outline-none focus-visible:border-ink data-[state=checked]:border-ink data-[state=checked]:bg-ink"
      >
        <Checkbox.Indicator className="flex items-center justify-center text-house">
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
            <path d="M2 6.5 L4.75 9 L10 3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Root>
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
