import { m } from '../../paraglide/messages.js'
import { useEffect, useRef, useState } from 'react'
import { Btn, Field, Label, Overlay } from './frame.tsx'
import { HAT } from '../view/map.tsx'
import { NAME_MAX, type SeatId, type World } from '../sim/world.ts'

export const MP_COPY = {
  version: () => m.menu_mp_version(),
  full: () => m.menu_mp_full(),
  busy: () => m.menu_mp_busy(),
  ice: () => m.menu_mp_ice(),
  'host-left': () => m.menu_mp_host_left(),
  lost: () => m.menu_mp_lost(),
  desync: () => m.menu_mp_desync(),
  unusable: () => m.menu_mp_unusable(),
} as const

export type MpFail = keyof typeof MP_COPY

const SEAT_LABEL: { readonly [K in SeatId]: () => string } = {
  0: () => m.menu_seat_p1(),
  1: () => m.menu_seat_p2(),
  2: () => m.menu_seat_p3(),
  3: () => m.menu_seat_p4(),
}

const SEAT_IDS = [0, 1, 2, 3] as const

export function Notice({ fail }: { fail: MpFail | undefined }) {
  if (fail === undefined) return null
  return (
    <div className="border-l-4 border-roof bg-roof/12 px-3 py-2 text-sm text-ink" role="alert">
      {MP_COPY[fail]()}
    </div>
  )
}

function Dots() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setN(x => (x + 1) % 4), 400)
    return () => clearInterval(id)
  }, [])
  return <span className="inline-block w-6 text-left">{'.'.repeat(n)}</span>
}

function SeatRow({ world, id, local }: { world: World; id: SeatId; local: SeatId }) {
  const seat = world.seats[id]
  const open = seat === undefined
  const away = !open && seat.presence === 'away'
  const note = open ? m.recap_none() : id === local ? m.menu_you() : away ? m.menu_away() : m.menu_playing()
  return (
    <div className={`flex items-center gap-2 px-1 py-1 text-sm ${open ? 'text-ink/35' : 'text-ink'}`}>
      <span
        aria-hidden
        className={`size-3 shrink-0 border border-ink/40 ${open ? 'bg-transparent' : ''}`}
        style={open ? undefined : { background: HAT[id] }}
      />
      <span className="w-8 shrink-0 font-mono text-ink/45">{SEAT_LABEL[id]()}</span>
      <span className={`min-w-0 flex-1 truncate ${away ? 'text-ink/50' : ''}`}>
        {open ? m.menu_open_seat() : seat.name}
      </span>
      <span className="shrink-0 text-xs tracking-wide text-ink/45 uppercase">
        {id === 0 && !open ? m.menu_host() : note}
      </span>
    </div>
  )
}

function Roster({ world, local }: { world: World; local: SeatId }) {
  const taken = world.seats.length
  return (
    <div className="flex flex-col">
      <Label>{m.menu_gardeners({ taken, cap: 4 })}</Label>
      <div className="border border-ink/15 bg-parch/50 px-1 py-1">
        {SEAT_IDS.map(id => (
          <SeatRow key={id} world={world} id={id} local={local} />
        ))}
      </div>
    </div>
  )
}

export function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{m.menu_your_name()}</Label>
      <Field
        name="name"
        value={value}
        onChange={v => onChange(v.slice(0, NAME_MAX))}
        aria-label={m.menu_your_name()}
        placeholder={m.menu_name_placeholder()}
      />
    </div>
  )
}

export function JoinFields({
  fail,
  connecting,
  name,
  onName,
  onJoin,
  onClose,
}: {
  fail: MpFail | undefined
  connecting: boolean
  name: string
  onName: (v: string) => void
  onJoin: (key: string) => void
  onClose: () => void
}) {
  const [key, setKey] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    input.current?.focus()
  }, [])
  const trimmed = key.trim()
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={e => {
        e.preventDefault()
        if (connecting || trimmed === '') return
        onJoin(trimmed)
      }}
    >
      <NameField value={name} onChange={onName} />
      <Label>{m.menu_room_code()}</Label>
      <Field
        ref={input}
        name="key"
        value={key}
        onChange={setKey}
        aria-label={m.menu_room_code()}
        placeholder={m.menu_code_placeholder()}
      />
      <p className="text-xs text-ink/45">{m.menu_ask_host()}</p>
      <Btn className="w-full" type="submit" disabled={connecting || trimmed === ''}>
        {connecting ? (
          <span>
            {m.menu_connecting()}
            <Dots />
          </span>
        ) : (
          m.menu_join()
        )}
      </Btn>
      <Btn className="w-full" type="button" onClick={onClose}>
        {m.hud_cancel()}
      </Btn>
      <Notice fail={fail} />
    </form>
  )
}

export function HostDialog({
  roomKey,
  world,
  local,
  name,
  onName,
  onCopy,
  onClose,
}: {
  roomKey: string
  world: World
  local: SeatId
  name: string
  onName: (v: string) => void
  onCopy: () => Promise<boolean>
  onClose: () => void
}) {
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no')
  const live = roomKey !== ''
  useEffect(() => {
    if (copied === 'no') return
    const id = setTimeout(() => setCopied('no'), 2500)
    return () => clearTimeout(id)
  }, [copied])
  return (
    <Overlay title={m.hud_multiplayer()} onClose={onClose} className="w-[26rem]">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink/70">{live ? m.menu_host_live() : m.menu_host_opening()}</p>
        <NameField value={name} onChange={onName} />
        <div className="flex flex-col gap-2">
          <Label>{m.menu_room_code()}</Label>
          {live ? (
            <div className="border-2 border-ink/30 bg-parch px-2 py-2 font-mono text-sm break-all select-text">
              {roomKey}
            </div>
          ) : (
            <div className="border-2 border-ink/20 bg-parch/60 px-2 py-2 font-mono text-sm text-ink/45">
              {m.menu_getting_code()}
              <Dots />
            </div>
          )}
          <Btn
            className="w-full"
            disabled={!live}
            onClick={() => {
              void onCopy().then(ok => setCopied(ok ? 'yes' : 'failed'))
            }}
          >
            {copied === 'yes' ? m.menu_copied() : copied === 'failed' ? m.menu_could_not_copy() : m.menu_copy_code()}
          </Btn>
          {copied === 'failed' && <p className="text-xs text-ink/55">{m.menu_copy_fail()}</p>}
        </div>
        <Roster world={world} local={local} />
      </div>
    </Overlay>
  )
}

export function GuestDialog({
  world,
  local,
  name,
  onName,
  onLeave,
  onClose,
}: {
  world: World
  local: SeatId
  name: string
  onName: (v: string) => void
  onLeave: () => void
  onClose: () => void
}) {
  return (
    <Overlay title={m.hud_multiplayer()} onClose={onClose} className="w-[26rem]">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink/70">{m.menu_guest_body()}</p>
        <NameField value={name} onChange={onName} />
        <Roster world={world} local={local} />
        <Btn className="w-full" onClick={onLeave}>
          {m.menu_leave_farm()}
        </Btn>
      </div>
    </Overlay>
  )
}
