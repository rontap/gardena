import { useEffect, useRef, useState } from 'react'
import { Btn, Field, Label, Overlay } from './frame.tsx'
import { HAT } from '../view/map.tsx'
import { NAME_MAX, type SeatId, type World } from '../sim/world.ts'

export const MP_COPY = {
  version: 'That farm runs a different build of Gardena. Both players need the same version.',
  full: 'That farm is full — it already has four gardeners.',
  busy: 'The host is letting someone else in. Try again in a moment.',
  ice: 'Could not reach that farm. Check the code and that the host is still hosting.',
  'host-left': 'The host closed the farm. Anything unsaved stayed with them.',
  lost: 'Lost the host and could not get back after three tries.',
  desync: 'This farm drifted out of step with the host and could not be repaired.',
  unusable: 'This farm could not be used.',
} as const

export type MpFail = keyof typeof MP_COPY

const SEAT_LABEL: { readonly [K in SeatId]: string } = {
  0: 'P1',
  1: 'P2',
  2: 'P3',
  3: 'P4',
}

const SEAT_IDS = [0, 1, 2, 3] as const

/** Failures are the only voice multiplayer has when something goes wrong, so give them a body. */
export function Notice({ fail }: { fail: MpFail | undefined }) {
  if (fail === undefined) return null
  return (
    <div className="border-l-4 border-roof bg-roof/12 px-3 py-2 text-sm text-ink" role="alert">
      {MP_COPY[fail]}
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
  const note = open ? '—' : id === local ? 'you' : away ? 'away' : 'playing'
  return (
    <div className={`flex items-center gap-2 px-1 py-1 text-sm ${open ? 'text-ink/35' : 'text-ink'}`}>
      <span
        aria-hidden
        className={`size-3 shrink-0 border border-ink/40 ${open ? 'bg-transparent' : ''}`}
        style={open ? undefined : { background: HAT[id] }}
      />
      <span className="w-8 shrink-0 font-mono text-ink/45">{SEAT_LABEL[id]}</span>
      <span className={`min-w-0 flex-1 truncate ${away ? 'text-ink/50' : ''}`}>
        {open ? 'Open seat' : seat.name}
      </span>
      <span className="shrink-0 text-xs tracking-wide text-ink/45 uppercase">
        {id === 0 && !open ? 'Host' : note}
      </span>
    </div>
  )
}

function Roster({ world, local }: { world: World; local: SeatId }) {
  const taken = world.seats.length
  return (
    <div className="flex flex-col">
      <Label>Gardeners ({taken} of 4)</Label>
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
      <Label>Your name</Label>
      <Field
        name="name"
        value={value}
        onChange={v => onChange(v.slice(0, NAME_MAX))}
        aria-label="Your name"
        placeholder="what should everyone call you?"
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
      <Label>Room code</Label>
      <Field
        ref={input}
        name="key"
        value={key}
        onChange={setKey}
        aria-label="Room code"
        placeholder="paste the code the host gave you"
      />
      <p className="text-xs text-ink/45">Ask the host to press the multiplayer button and copy their code.</p>
      <Btn className="w-full" type="submit" disabled={connecting || trimmed === ''}>
        {connecting ? (
          <span>
            Connecting
            <Dots />
          </span>
        ) : (
          'Join'
        )}
      </Btn>
      <Btn className="w-full" type="button" onClick={onClose}>
        Cancel
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
    <Overlay title="Multiplayer" onClose={onClose} className="w-[26rem]">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink/70">
          {live
            ? 'Your farm is open. Share this code and friends can drop in — the day keeps running while you wait.'
            : 'Opening your farm to the outside world.'}
        </p>
        <NameField value={name} onChange={onName} />
        <div className="flex flex-col gap-2">
          <Label>Room code</Label>
          {live ? (
            <div className="border-2 border-ink/30 bg-parch px-2 py-2 font-mono text-sm break-all select-text">
              {roomKey}
            </div>
          ) : (
            <div className="border-2 border-ink/20 bg-parch/60 px-2 py-2 font-mono text-sm text-ink/45">
              getting a code
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
            {copied === 'yes' ? 'Copied' : copied === 'failed' ? 'Could not copy' : 'Copy code'}
          </Btn>
          {copied === 'failed' && (
            <p className="text-xs text-ink/55">Select the code above and press Ctrl+C instead.</p>
          )}
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
    <Overlay title="Multiplayer" onClose={onClose} className="w-[26rem]">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink/70">
          You are gardening on someone else&rsquo;s farm. The host owns the save — leaving drops you back to the
          menu and keeps nothing.
        </p>
        <NameField value={name} onChange={onName} />
        <Roster world={world} local={local} />
        <Btn className="w-full" onClick={onLeave}>
          Leave farm
        </Btn>
      </div>
    </Overlay>
  )
}
