import {
  Chorus,
  Context,
  FMSynth,
  Filter,
  Frequency,
  Gain,
  Part,
  PingPongDelay,
  PolySynth,
  Reverb,
  Synth,
  Tremolo,
  Vibrato,
  getContext,
  getDestination,
  getTransport,
  setContext,
  start,
  type ToneAudioNode,
} from 'tone'
import type { Stop } from './sound.h.ts'

// The global context carries music, scheduled one second ahead so a slow frame does not break the sound.
// `updateInterval` keeps that scheduling in 0.1 s steps; without it Tone sets it to half of `lookAhead` and schedules in bursts.
// A `PolySynth` holds a voice from the moment its note is scheduled until it falls silent, so `poly` covers `lookAhead` too.
// Sound effects must not wait that long: they get their own context with `latencyHint: 'interactive'`.
setContext(new Context({ latencyHint: 'playback', lookAhead: 1, updateInterval: 0.1 }))

export type Length = 0.25 | 0.5 | 1 | 2
export type Note = { time: string; notes: string[]; dur: string; vel: number }
export type Song = { bpm: number; bars: number; notes: Note[] }

const DUR: Record<Length, string> = { 0.25: '16n', 0.5: '8n', 1: '4n', 2: '2n' }

export function note(bar: number, quarters: number, notes: string[], len: Length, vel: number): Note {
  const at = bar * 4 + quarters
  const whole = Math.floor(at / 4)
  const rem = at - whole * 4
  const beat = Math.floor(rem)
  const six = Math.round((rem - beat) * 4)
  return { time: `${whole}:${beat}:${six}`, notes, dur: DUR[len], vel }
}

export function playSong(song: Song): Stop {
  const synth = new PolySynth(Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.015, decay: 0.22, sustain: 0.12, release: 0.35 },
  }).connect(getDestination())
  synth.volume.value = -16
  synth.maxPolyphony = 12
  const part = new Part<Note>((time, ev) => {
    synth.triggerAttackRelease(ev.notes, ev.dur, time, ev.vel)
  }, song.notes)
  part.loop = true
  part.loopEnd = `${song.bars}m`
  const transport = getTransport()
  transport.bpm.value = song.bpm
  transport.position = 0
  part.start(0)
  transport.start()
  return () => {
    part.dispose()
    synth.releaseAll()
    synth.dispose()
    transport.stop()
    transport.position = 0
  }
}

export function armAudio(): void {
  void start()
}

export function holdAudio(paused: boolean): void {
  const raw = getContext().rawContext as AudioContext
  if (paused) void raw.suspend()
  else void raw.resume()
}

type Voice = {
  triggerAttackRelease(note: number, dur: number, time: number, vel: number): void
  volume: { value: number }
  maxPolyphony: number
  chain(...nodes: ToneAudioNode[]): unknown
  releaseAll(): void
  dispose(): void
}

type Env = { attack: number; decay: number; sustain: number; release: number }
type Patch = { voice: () => Voice; db: number; poly: number; send: number; fx: () => ToneAudioNode[] }
type Played = { voice: Voice; nodes: ToneAudioNode[] }

type MidiNote = { sec: number; dur: number; hz: number; vel: number; program: number }

function vlq(bytes: Uint8Array, at: { i: number }): number {
  let v = 0
  for (;;) {
    const c = bytes[at.i]
    at.i += 1
    v = (v << 7) | (c & 0x7f)
    if (c < 128) return v
  }
}

function u16(bytes: Uint8Array, i: number): number {
  return (bytes[i] << 8) | bytes[i + 1]
}

function u32(bytes: Uint8Array, i: number): number {
  return ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0
}

type Raw =
  | { tick: number; kind: 'prog'; ch: number; program: number }
  | { tick: number; kind: 'on'; ch: number; pitch: number; vel: number }
  | { tick: number; kind: 'off'; ch: number; pitch: number }

function readTrack(data: Uint8Array, out: Raw[]): void {
  const at = { i: 0 }
  let tick = 0
  let running = 0
  while (at.i < data.length) {
    tick += vlq(data, at)
    let status = data[at.i]
    if (status >= 0x80) {
      at.i += 1
      if (status < 0xf0) running = status
    } else {
      status = running
    }
    if (status === 0xff) {
      at.i += 1
      const n = vlq(data, at)
      at.i += n
    } else if (status === 0xf0 || status === 0xf7) {
      at.i += vlq(data, at)
    } else {
      const kind = status & 0xf0
      const ch = status & 0x0f
      const a = data[at.i]
      at.i += 1
      if (kind === 0xc0) out.push({ tick, kind: 'prog', ch, program: a })
      else if (kind === 0xd0) continue
      else {
        const b = data[at.i]
        at.i += 1
        if (kind === 0x90 && b > 0) out.push({ tick, kind: 'on', ch, pitch: a, vel: b })
        else if (kind === 0x80 || (kind === 0x90 && b === 0)) out.push({ tick, kind: 'off', ch, pitch: a })
      }
    }
  }
}

function readMidi(bytes: Uint8Array, bpm: number): { notes: MidiNote[]; end: number } {
  const div = u16(bytes, 12)
  const sec = (tick: number) => (tick / div) * (60 / bpm)
  const raw: Raw[] = []
  let i = 14
  while (i + 8 <= bytes.length) {
    const tag = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3])
    const len = u32(bytes, i + 4)
    i += 8
    if (tag === 'MTrk') readTrack(bytes.subarray(i, i + len), raw)
    i += len
  }
  const rank = { prog: 0, off: 1, on: 2 }
  raw.sort((a, b) => a.tick - b.tick || rank[a.kind] - rank[b.kind])
  const program = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const open = new Map<string, { tick: number; vel: number; program: number }[]>()
  const notes: MidiNote[] = []
  raw.forEach(ev => {
    if (ev.kind === 'prog') {
      program[ev.ch] = ev.program
      return
    }
    const key = `${ev.ch}:${ev.pitch}`
    if (ev.kind === 'on') {
      const stack = open.get(key)
      const hit = { tick: ev.tick, vel: ev.vel, program: program[ev.ch] }
      if (stack === undefined) open.set(key, [hit])
      else stack.push(hit)
      return
    }
    const stack = open.get(key)
    if (stack === undefined) return
    const start = stack.shift()
    if (start === undefined) return
    const dur = sec(ev.tick - start.tick)
    if (dur <= 0) return
    notes.push({
      sec: sec(start.tick),
      dur,
      hz: 440 * 2 ** ((ev.pitch - 69) / 12),
      vel: start.vel / 127,
      program: start.program,
    })
  })
  let end = 0
  notes.forEach(n => {
    const stop = n.sec + n.dur
    if (stop > end) end = stop
  })
  return { notes, end }
}

function fm(harmonicity: number, modulationIndex: number, envelope: Env, modDecay: number, type: 'sine' | 'triangle'): () => Voice {
  return () =>
    new PolySynth(FMSynth, {
      harmonicity,
      modulationIndex,
      oscillator: { type },
      envelope,
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: envelope.attack, decay: modDecay, sustain: 0, release: modDecay },
    })
}

function wave(type: 'sine' | 'triangle' | 'fattriangle', envelope: Env): () => Voice {
  return () => new PolySynth(Synth, { oscillator: { type }, envelope })
}

function reed(
  type: 'sawtooth' | 'square' | 'fatsquare',
  envelope: Env,
  cutoff: number,
  fx: () => ToneAudioNode[],
): Pick<Patch, 'voice' | 'fx'> {
  return {
    voice: () => new PolySynth(Synth, { oscillator: { type }, envelope }),
    fx: () => [new Filter({ frequency: cutoff, type: 'lowpass', rolloff: -24, Q: 0.7 }), ...fx()],
  }
}

function vibrato(frequency: number, depth: number): () => ToneAudioNode[] {
  return () => [new Vibrato(frequency, depth)]
}

const DRY = (): ToneAudioNode[] => []
const PAD: Env = { attack: 0.16, decay: 0.2, sustain: 0.8, release: 0.5 }
const SING: Env = { attack: 0.05, decay: 0.15, sustain: 0.65, release: 0.25 }
const PLUCK: Env = { attack: 0.002, decay: 1.1, sustain: 0, release: 0.8 }

// General MIDI program numbers.
export const GM = {
  piano: 0,
  electricPiano: 5,
  celesta: 8,
  glockenspiel: 9,
  musicBox: 10,
  vibraphone: 11,
  accordion: 21,
  nylonGuitar: 24,
  acousticBass: 32,
  violin: 40,
  cello: 42,
  pizzicato: 45,
  harp: 46,
  strings: 48,
  choir: 52,
  bassoon: 70,
  clarinet: 71,
  flute: 73,
  recorder: 74,
  ocarina: 79,
  squareLead: 80,
} as const

// `send` is the share of the voice sent to the reverb.
const PATCH: Partial<Record<number, Patch>> = {
  [GM.piano]: { voice: fm(3, 8, { attack: 0.008, decay: 0.4, sustain: 0.12, release: 0.55 }, 0.2, 'sine'), db: -14, poly: 32, send: 0.3, fx: DRY },
  [GM.electricPiano]: { voice: fm(8, 2, { attack: 0.004, decay: 0.3, sustain: 0.05, release: 0.3 }, 0.15, 'sine'), db: -16, poly: 16, send: 0.35, fx: DRY },
  [GM.celesta]: { voice: fm(4, 1.5, { attack: 0.002, decay: 1.2, sustain: 0, release: 1 }, 0.3, 'sine'), db: -16, poly: 16, send: 0.5, fx: DRY },
  [GM.glockenspiel]: { voice: fm(3.5, 2, { attack: 0.001, decay: 1.4, sustain: 0, release: 1.2 }, 0.4, 'sine'), db: -14, poly: 12, send: 0.5, fx: DRY },
  [GM.musicBox]: { voice: fm(5.07, 2.5, { attack: 0.001, decay: 1.4, sustain: 0, release: 1.2 }, 0.25, 'sine'), db: -16, poly: 16, send: 0.55, fx: DRY },
  [GM.vibraphone]: {
    voice: fm(4, 1.2, { attack: 0.002, decay: 0.9, sustain: 0.05, release: 0.6 }, 0.4, 'sine'),
    db: -14,
    poly: 12,
    send: 0.4,
    fx: () => [new Tremolo(5.5, 0.25).start()],
  },
  [GM.accordion]: { ...reed('fatsquare', { attack: 0.06, decay: 0.1, sustain: 0.9, release: 0.2 }, 1350, DRY), db: -26, poly: 8, send: 0.25 },
  [GM.nylonGuitar]: { voice: fm(1, 2.2, PLUCK, 0.12, 'triangle'), db: -14, poly: 12, send: 0.3, fx: DRY },
  [GM.acousticBass]: { voice: wave('triangle', { attack: 0.005, decay: 0.7, sustain: 0.25, release: 0.3 }), db: -14, poly: 8, send: 0.1, fx: DRY },
  [GM.violin]: { ...reed('sawtooth', { attack: 0.08, decay: 0.15, sustain: 0.75, release: 0.3 }, 2700, vibrato(5.5, 0.06)), db: -17, poly: 8, send: 0.35 },
  [GM.cello]: { ...reed('sawtooth', { ...PAD, attack: 0.08 }, 850, DRY), db: -15, poly: 8, send: 0.2 },
  [GM.pizzicato]: { voice: fm(1, 2, { attack: 0.003, decay: 0.28, sustain: 0, release: 0.2 }, 0.05, 'triangle'), db: -11, poly: 16, send: 0.3, fx: DRY },
  [GM.harp]: { voice: fm(1, 1.4, { ...PLUCK, decay: 2, release: 1.4 }, 0.35, 'triangle'), db: -14, poly: 16, send: 0.45, fx: DRY },
  [GM.strings]: {
    ...reed('sawtooth', PAD, 2000, () => [new Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.5, wet: 0.5 }).start()]),
    db: -21,
    poly: 16,
    send: 0.5,
  },
  [GM.choir]: {
    voice: wave('fattriangle', { attack: 0.8, decay: 0.3, sustain: 0.85, release: 1.2 }),
    db: -30,
    poly: 12,
    send: 0.6,
    fx: () => [new Chorus({ frequency: 0.8, delayTime: 4, depth: 0.6, wet: 0.5 }).start()],
  },
  [GM.bassoon]: { ...reed('square', { attack: 0.03, decay: 0.2, sustain: 0.7, release: 0.15 }, 600, DRY), db: -18, poly: 8, send: 0.2 },
  [GM.clarinet]: { ...reed('square', { attack: 0.04, decay: 0.1, sustain: 0.8, release: 0.15 }, 1600, vibrato(5, 0.03)), db: -18, poly: 8, send: 0.3 },
  [GM.flute]: { voice: wave('sine', { attack: 0.07, decay: 0.1, sustain: 0.55, release: 0.2 }), db: -12, poly: 8, send: 0.35, fx: vibrato(5, 0.05) },
  [GM.recorder]: { voice: wave('triangle', { attack: 0.03, decay: 0.1, sustain: 0.7, release: 0.12 }), db: -14, poly: 8, send: 0.35, fx: vibrato(5.5, 0.04) },
  [GM.ocarina]: { voice: wave('sine', { attack: 0.06, decay: 0.2, sustain: 0.7, release: 0.2 }), db: -14, poly: 8, send: 0.4, fx: vibrato(4.5, 0.08) },
  [GM.squareLead]: {
    voice: () => new PolySynth(Synth, { oscillator: { type: 'pulse', width: 0.25 }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.1 } }),
    db: -20,
    poly: 8,
    send: 0.15,
    fx: DRY,
  },
}
const OTHER: Patch = { voice: wave('triangle', SING), db: -15, poly: 16, send: 0.3, fx: DRY }

function makeVoice(program: number, room: ToneAudioNode): Played {
  const p = PATCH[program] ?? OTHER
  const voice = p.voice()
  voice.volume.value = p.db
  voice.maxPolyphony = p.poly
  const send = new Gain(p.send).connect(room)
  const out = new Gain(1).fan(getDestination(), send)
  const fx = p.fx()
  voice.chain(...fx, out)
  return { voice, nodes: [...fx, out, send] }
}

// The chain the reverb sends pass through, first node to last, before the output.
type Room = (bpm: number) => ToneAudioNode[]

export const ROOM = {
  hall: () => [new Reverb({ decay: 2.2, preDelay: 0.03, wet: 1 })],
  // The Super Nintendo echo: a dark stereo feedback delay of one eighth note, into a short reverb.
  echo: (bpm: number) => [
    new Filter({ frequency: 2200, type: 'lowpass', rolloff: -12 }),
    new PingPongDelay({ delayTime: 30 / bpm, feedback: 0.35, wet: 0.4 }),
    new Reverb({ decay: 1.8, preDelay: 0.03, wet: 1 }),
  ],
} satisfies Record<string, Room>

export type ScoreNote = { beat: number; len: number; pitch: string; vel: number; program: number }

export function playScore(bpm: number, beats: number, score: ScoreNote[], room: Room): Stop {
  const sec = 60 / bpm
  const notes = score.map(n => ({
    sec: n.beat * sec,
    dur: n.len * sec,
    hz: Frequency(n.pitch).toFrequency(),
    vel: n.vel,
    program: n.program,
  }))
  return playNotes(notes, beats * sec, bpm, room)
}

export function playMidi(bytes: Uint8Array, bpm: number): Stop {
  const { notes, end } = readMidi(bytes, bpm)
  return playNotes(notes, end, bpm, ROOM.hall)
}

function playNotes(notes: MidiNote[], end: number, bpm: number, room: Room): Stop {
  const space = room(bpm)
  space[0].chain(...space.slice(1), getDestination())
  const played: Record<number, Played> = {}
  notes.forEach(n => {
    if (played[n.program] !== undefined) return
    played[n.program] = makeVoice(n.program, space[0])
  })
  const part = new Part<MidiNote & { time: number }>((time, ev) => {
    played[ev.program].voice.triggerAttackRelease(ev.hz, ev.dur, time, ev.vel)
  }, notes.map(n => ({ time: n.sec, sec: n.sec, dur: n.dur, hz: n.hz, vel: n.vel, program: n.program })))
  part.loop = true
  part.loopEnd = end
  const transport = getTransport()
  transport.bpm.value = bpm
  transport.position = 0
  part.start(0)
  transport.start()
  return () => {
    part.dispose()
    Object.values(played).forEach(p => {
      p.voice.releaseAll()
      p.voice.dispose()
      p.nodes.forEach(n => n.dispose())
    })
    space.forEach(n => n.dispose())
    transport.stop()
    transport.position = 0
  }
}
