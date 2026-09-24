import {
  Chorus,
  Context,
  FMSynth,
  Filter,
  Frequency,
  Gain,
  MembraneSynth,
  MonoSynth,
  NoiseSynth,
  Part,
  PingPongDelay,
  PolySynth,
  Reverb,
  Synth,
  Tremolo,
  Vibrato,
  Volume,
  getContext,
  getDraw,
  getDestination,
  getTransport,
  setContext,
  start,
  type ToneAudioNode,
} from 'tone'
import type { Stop } from './sound.h.ts'

setContext(new Context({ context: new AudioContext({ latencyHint: 'playback' }), lookAhead: 0.1 }))

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
    envelope: { attack: 0.05, decay: 0.6, sustain: 0.3, release: 1.4 },
  })
  synth.volume.value = -16
  synth.maxPolyphony = 48
  const { mix } = bus()
  const send = new Gain(0.6)
  const space = ROOM.hall(song.bpm)
  synth.fan(mix, send)
  send.connect(space[0])
  space[0].connect(mix)
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
    send.dispose()
    space.forEach(n => n.dispose())
    mix.dispose()
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

// One voice of an instrument, for a melody line that bends: `portamento` glides from the note before,
// `detune` carries the scoop and the fall.
type Solo = {
  triggerAttackRelease(note: number, dur: number, time: number, vel: number): void
  volume: { value: number }
  portamento: number
  detune: {
    cancelScheduledValues(time: number): unknown
    setValueAtTime(cents: number, time: number): unknown
    linearRampToValueAtTime(cents: number, time: number): unknown
  }
  chain(...nodes: ToneAudioNode[]): unknown
  dispose(): void
}

type Env = { attack: number; decay: number; sustain: number; release: number }
type Patch = { voice: () => Voice; solo: () => Solo; db: number; poly: number; send: number; fx: () => ToneAudioNode[] }
type Played = { voice: Voice; nodes: ToneAudioNode[] }
type Sung = { voice: Solo; nodes: ToneAudioNode[] }

// Cents and milliseconds. `glide`: time to slide from the note before. `scoop`: where the note starts, reaching
// its pitch after `scoopMs`. `fall`: where the note ends, leaving its pitch `fallMs` before the end.
// `part`: which solo voice of the instrument sings it, so two bending lines on one instrument keep their own.
export type Bend = { part: number; glide: number; scoop: number; scoopMs: number; fall: number; fallMs: number }

type MidiNote = { sec: number; dur: number; hz: number; vel: number; program: number; bend?: Bend }

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

function fm(
  harmonicity: number,
  modulationIndex: number,
  envelope: Env,
  modDecay: number,
  type: 'sine' | 'triangle',
): Pick<Patch, 'voice' | 'solo'> {
  const options = () => ({
    harmonicity,
    modulationIndex,
    oscillator: { type },
    envelope,
    modulation: { type: 'sine' as const },
    modulationEnvelope: { attack: envelope.attack, decay: modDecay, sustain: 0, release: modDecay },
  })
  return { voice: () => new PolySynth(FMSynth, options()), solo: () => new FMSynth(options()) }
}

function wave(type: 'sine' | 'triangle' | 'fattriangle' | 'sawtooth' | 'square' | 'fatsquare', envelope: Env): Pick<Patch, 'voice' | 'solo'> {
  return {
    voice: () => new PolySynth(Synth, { oscillator: { type }, envelope }),
    solo: () => new Synth({ oscillator: { type }, envelope }),
  }
}

function reed(
  type: 'sawtooth' | 'square' | 'fatsquare',
  envelope: Env,
  cutoff: number,
  fx: () => ToneAudioNode[],
): Pick<Patch, 'voice' | 'solo' | 'fx'> {
  return {
    ...wave(type, envelope),
    fx: () => [new Filter({ frequency: cutoff, type: 'lowpass', rolloff: -24, Q: 0.7 }), ...fx()],
  }
}

// A stack of five copies of the wave spread over `spread` cents, so their beating reads as several voices,
// through a low-pass filter that opens on each note from `cutoff` Hz by `octaves`, then rests 80% of the way up.
function vowel(type: 'fattriangle' | 'fatsawtooth', spread: number, cutoff: number, octaves: number): Pick<Patch, 'voice' | 'solo'> {
  const options = () => ({
    oscillator: { type, count: 5, spread },
    envelope: { attack: 0.25, decay: 0.3, sustain: 0.9, release: 0.8 },
    filter: { type: 'lowpass' as const, Q: 0.7, rolloff: -12 as const },
    filterEnvelope: { attack: 0.4, decay: 0.8, sustain: 0.8, release: 0.8, baseFrequency: cutoff, octaves },
  })
  return { voice: () => new PolySynth(MonoSynth, options()), solo: () => new MonoSynth(options()) }
}

const VOICE_FX = (): ToneAudioNode[] => [new Vibrato(4.8, 0.03), new Chorus({ frequency: 0.6, delayTime: 3, depth: 0.3, wet: 0.35 }).start()]

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
  marimba: 12,
  accordion: 21,
  nylonGuitar: 24,
  acousticBass: 32,
  violin: 40,
  synthBass: 38,
  sawBass: 39,
  cello: 42,
  pizzicato: 45,
  harp: 46,
  strings: 48,
  choir: 52,
  voiceOoh: 53,
  synthVoice: 54,
  bassoon: 70,
  clarinet: 71,
  flute: 73,
  recorder: 74,
  ocarina: 79,
  squareLead: 80,
  sawLead: 81,
  warmPad: 89,
  woodblock: 115,
  // Not a program: the drum kit, which General MIDI puts on channel 10. Its pitches are `DRUM`.
  drums: 128,
} as const

// General MIDI drum keys, the pitches `kit` plays. `riser` is below the General MIDI drum keys: a noise swell whose
// length is the note's.
export const DRUM = { kick: 'C2', snare: 'D2', clap: 'D#2', hat: 'F#2', openHat: 'A#2', riser: 'C1' } as const

// `send` is the share of the voice sent to the reverb.
const PATCH: Partial<Record<number, Patch>> = {
  [GM.piano]: { ...fm(3, 8, { attack: 0.008, decay: 0.4, sustain: 0.12, release: 0.55 }, 0.2, 'sine'), db: -14, poly: 48, send: 0.3, fx: DRY },
  [GM.electricPiano]: { ...fm(8, 2, { attack: 0.004, decay: 0.3, sustain: 0.05, release: 0.3 }, 0.15, 'sine'), db: -16, poly: 16, send: 0.35, fx: DRY },
  [GM.celesta]: { ...fm(4, 1.5, { attack: 0.002, decay: 1.2, sustain: 0, release: 1 }, 0.3, 'sine'), db: -16, poly: 16, send: 0.5, fx: DRY },
  [GM.glockenspiel]: { ...fm(3.5, 2, { attack: 0.001, decay: 1.4, sustain: 0, release: 1.2 }, 0.4, 'sine'), db: -14, poly: 16, send: 0.5, fx: DRY },
  [GM.musicBox]: { ...fm(5.07, 2.5, { attack: 0.001, decay: 1.4, sustain: 0, release: 1.2 }, 0.25, 'sine'), db: -16, poly: 16, send: 0.55, fx: DRY },
  [GM.vibraphone]: {
    ...fm(4, 1.2, { attack: 0.002, decay: 0.9, sustain: 0.05, release: 0.6 }, 0.4, 'sine'),
    db: -14,
    poly: 12,
    send: 0.4,
    fx: () => [new Tremolo(5.5, 0.25).start()],
  },
  [GM.marimba]: { ...fm(4, 1.2, { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 }, 0.06, 'sine'), db: -12, poly: 16, send: 0.25, fx: DRY },
  [GM.woodblock]: { ...fm(3.1, 5, { attack: 0.001, decay: 0.07, sustain: 0, release: 0.05 }, 0.02, 'sine'), db: -12, poly: 8, send: 0.15, fx: DRY },
  [GM.accordion]: { ...reed('fatsquare', { attack: 0.06, decay: 0.1, sustain: 0.9, release: 0.2 }, 1350, DRY), db: -26, poly: 8, send: 0.25 },
  [GM.nylonGuitar]: { ...fm(1, 2.2, PLUCK, 0.12, 'triangle'), db: -14, poly: 12, send: 0.3, fx: DRY },
  [GM.acousticBass]: { ...wave('triangle', { attack: 0.005, decay: 0.7, sustain: 0.25, release: 0.3 }), db: -14, poly: 8, send: 0.1, fx: DRY },
  [GM.violin]: { ...reed('sawtooth', { attack: 0.08, decay: 0.15, sustain: 0.75, release: 0.3 }, 2700, vibrato(5.5, 0.06)), db: -17, poly: 8, send: 0.35 },
  [GM.cello]: { ...reed('sawtooth', { ...PAD, attack: 0.08 }, 850, DRY), db: -15, poly: 8, send: 0.2 },
  [GM.pizzicato]: { ...fm(1, 2, { attack: 0.003, decay: 0.28, sustain: 0, release: 0.2 }, 0.05, 'triangle'), db: -11, poly: 16, send: 0.3, fx: DRY },
  [GM.harp]: { ...fm(1, 1.4, { ...PLUCK, decay: 2, release: 1.4 }, 0.35, 'triangle'), db: -14, poly: 16, send: 0.45, fx: DRY },
  [GM.strings]: {
    ...reed('sawtooth', PAD, 2000, () => [new Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.5, wet: 0.5 }).start()]),
    db: -21,
    poly: 16,
    send: 0.5,
  },
  [GM.choir]: {
    ...wave('fattriangle', { attack: 0.8, decay: 0.3, sustain: 0.85, release: 1.2 }),
    db: -30,
    poly: 12,
    send: 0.6,
    fx: () => [new Chorus({ frequency: 0.8, delayTime: 4, depth: 0.6, wet: 0.5 }).start()],
  },
  [GM.bassoon]: { ...reed('square', { attack: 0.03, decay: 0.2, sustain: 0.7, release: 0.15 }, 600, DRY), db: -18, poly: 8, send: 0.2 },
  [GM.clarinet]: { ...reed('square', { attack: 0.04, decay: 0.1, sustain: 0.8, release: 0.15 }, 1600, vibrato(5, 0.03)), db: -18, poly: 8, send: 0.3 },
  [GM.flute]: { ...wave('sine', { attack: 0.07, decay: 0.1, sustain: 0.55, release: 0.2 }), db: -12, poly: 8, send: 0.35, fx: vibrato(5, 0.05) },
  [GM.recorder]: { ...wave('triangle', { attack: 0.03, decay: 0.1, sustain: 0.7, release: 0.12 }), db: -14, poly: 8, send: 0.35, fx: vibrato(5.5, 0.04) },
  [GM.ocarina]: { ...wave('sine', { attack: 0.06, decay: 0.2, sustain: 0.7, release: 0.2 }), db: -14, poly: 8, send: 0.4, fx: vibrato(4.5, 0.08) },
  [GM.squareLead]: {
    voice: () => new PolySynth(Synth, { oscillator: { type: 'pulse', width: 0.25 }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.1 } }),
    solo: () => new Synth({ oscillator: { type: 'pulse', width: 0.25 }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.1 } }),
    db: -20,
    poly: 8,
    send: 0.15,
    fx: DRY,
  },
  [GM.synthBass]: { ...reed('square', { attack: 0.005, decay: 0.25, sustain: 0.7, release: 0.15 }, 420, DRY), db: -12, poly: 8, send: 0.1 },
  [GM.sawBass]: { ...reed('sawtooth', { attack: 0.005, decay: 0.3, sustain: 0.8, release: 0.08 }, 600, DRY), db: -14, poly: 8, send: 0.05 },
  [GM.sawLead]: { ...reed('sawtooth', { attack: 0.02, decay: 0.2, sustain: 0.8, release: 0.15 }, 3000, DRY), db: -20, poly: 8, send: 0.2 },
  [GM.warmPad]: {
    ...reed('sawtooth', { attack: 0.05, decay: 0.25, sustain: 0.7, release: 0.35 }, 900, () => [new Chorus({ frequency: 0.8, delayTime: 3, depth: 0.4, wet: 0.4 }).start()]),
    db: -18,
    poly: 16,
    send: 0.4,
  },
  // Choir-like "ooh"s opening on each note, a faint vibrato and a light chorus: clear triangles, and buzzier
  // sawtooths. Song 5 sings its line on both at once.
  [GM.voiceOoh]: { ...vowel('fattriangle', 15, 1200, 1.5), db: -10, poly: 8, send: 0.55, fx: VOICE_FX },
  [GM.synthVoice]: { ...vowel('fatsawtooth', 30, 700, 2), db: -14, poly: 8, send: 0.55, fx: VOICE_FX },
}
const OTHER: Patch = { ...wave('triangle', SING), db: -15, poly: 16, send: 0.3, fx: DRY }
const KIT_PATCH: Pick<Patch, 'db' | 'send' | 'fx'> = { db: -8, send: 0.1, fx: DRY }

type Band = { hz: number; q: number; decay: number }
export type Kit = {
  kick: { note: string; pitchDecay: number; octaves: number; decay: number; hold: number }
  snare: Band
  clap: Band
  hat: { hz: number; decay: number; open: number }
}

export const KIT = {
  standard: {
    kick: { note: 'A1', pitchDecay: 0.05, octaves: 5, decay: 0.4, hold: 0.1 },
    snare: { hz: 1800, q: 0.8, decay: 0.16 },
    clap: { hz: 1200, q: 1.2, decay: 0.12 },
    hat: { hz: 7000, decay: 0.04, open: 0.3 },
  },
  deep: {
    kick: { note: 'E1', pitchDecay: 0.15, octaves: 4, decay: 0.45, hold: 0.45 },
    snare: { hz: 1800, q: 0.8, decay: 0.16 },
    clap: { hz: 1000, q: 0.75, decay: 0.15 },
    hat: { hz: 1500, decay: 0.07, open: 0.3 },
  },
} satisfies Record<string, Kit>

function kit(k: Kit): Voice {
  const vol = new Volume()
  const snareBand = new Filter({ frequency: k.snare.hz, type: 'bandpass', Q: k.snare.q }).connect(vol)
  const clapBand = new Filter({ frequency: k.clap.hz, type: 'bandpass', Q: k.clap.q }).connect(vol)
  const hatHigh = new Filter({ frequency: k.hat.hz, type: 'highpass' }).connect(vol)
  const kick = new MembraneSynth({
    pitchDecay: k.kick.pitchDecay,
    octaves: k.kick.octaves,
    envelope: { attack: 0.001, decay: k.kick.decay, sustain: 0, release: 0.1 },
  }).connect(vol)
  const snare = new NoiseSynth({ envelope: { attack: 0.001, decay: k.snare.decay, sustain: 0 } }).connect(snareBand)
  const clap = new NoiseSynth({ envelope: { attack: 0.002, decay: k.clap.decay, sustain: 0 } }).connect(clapBand)
  const hat = new NoiseSynth({ envelope: { attack: 0.001, decay: k.hat.decay, sustain: 0 } }).connect(hatHigh)
  const openHat = new NoiseSynth({ envelope: { attack: 0.001, decay: k.hat.open, sustain: 0 } }).connect(hatHigh)
  const riserBand = new Filter({ frequency: 400, type: 'bandpass', Q: 1 }).connect(vol)
  const riser = new NoiseSynth({ envelope: { attack: 1, attackCurve: 'exponential', decay: 0.05, sustain: 1, release: 0.3 } }).connect(riserBand)
  const hit: Record<number, (time: number, vel: number, dur: number) => void> = {
    24: (time, vel, dur) => {
      riser.envelope.attack = dur
      riserBand.frequency.setValueAtTime(400, time)
      riserBand.frequency.exponentialRampToValueAtTime(7000, time + dur)
      riser.triggerAttackRelease(dur, time, vel)
    },
    36: (time, vel) => kick.triggerAttackRelease(k.kick.note, k.kick.hold, time, vel),
    38: (time, vel) => snare.triggerAttackRelease(0.1, time, vel),
    39: (time, vel) => clap.triggerAttackRelease(0.08, time, vel),
    42: (time, vel) => hat.triggerAttackRelease(0.03, time, vel),
    46: (time, vel) => openHat.triggerAttackRelease(0.2, time, vel),
  }
  const nodes = [kick, snare, clap, hat, openHat, riser, snareBand, clapBand, hatHigh, riserBand, vol]
  return {
    triggerAttackRelease: (hz, dur, time, vel) => hit[Math.round(69 + 12 * Math.log2(hz / 440))](time, vel, dur),
    volume: vol.volume,
    maxPolyphony: 1,
    chain: (...chain) => vol.chain(...chain),
    releaseAll: () => undefined,
    dispose: () => nodes.forEach(n => n.dispose()),
  }
}

// Sets the patch volume, runs the voice through its effects, and splits it to the mix and the room.
function wire(p: Pick<Patch, 'db' | 'fx'>, send: number, voice: Voice | Solo, room: ToneAudioNode, mix: ToneAudioNode): ToneAudioNode[] {
  voice.volume.value = p.db
  const gain = new Gain(send).connect(room)
  const out = new Gain(1).fan(mix, gain)
  const fx = p.fx()
  voice.chain(...fx, out)
  return [...fx, out, gain]
}

function makeVoice(program: number, room: ToneAudioNode, mix: ToneAudioNode, send: number, drums: Kit): Played {
  if (program === GM.drums) {
    const voice = kit(drums)
    return { voice, nodes: wire(KIT_PATCH, send, voice, room, mix) }
  }
  const p = PATCH[program] ?? OTHER
  const voice = p.voice()
  voice.maxPolyphony = p.poly
  return { voice, nodes: wire(p, send, voice, room, mix) }
}

function makeSolo(program: number, room: ToneAudioNode, mix: ToneAudioNode, send: number): Sung {
  const p = PATCH[program] ?? OTHER
  const voice = p.solo()
  return { voice, nodes: wire(p, send, voice, room, mix) }
}

function patchSend(program: number): number {
  if (program === GM.drums) return KIT_PATCH.send
  return (PATCH[program] ?? OTHER).send
}

function bus(): { mix: Filter } {
  const mix = new Filter({ frequency: 20000, type: 'lowpass', rolloff: -24 }).connect(getDestination())
  return { mix }
}

function sing(voice: Solo, n: MidiNote, bend: Bend, time: number): void {
  const end = time + n.dur
  voice.portamento = bend.glide / 1000
  voice.detune.cancelScheduledValues(time)
  voice.detune.setValueAtTime(bend.scoop, time)
  voice.detune.linearRampToValueAtTime(0, time + bend.scoopMs / 1000)
  voice.detune.setValueAtTime(0, end - bend.fallMs / 1000)
  voice.detune.linearRampToValueAtTime(bend.fall, end)
  voice.triggerAttackRelease(n.hz, n.dur, time, n.vel)
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

// A note with `bend` plays on its instrument's solo voice, so its line must not overlap itself.
export type ScoreNote = { beat: number; len: number; pitch: string; vel: number; program: number; bend?: Bend }

// `slow` spans are ritardandos: from beat `from` to beat `to` the tempo moves evenly from `bpm` to the span's
// `bpm`, and at `to` it is back at `bpm`.
export type Tempo = { bpm: number; slow: { from: number; to: number; bpm: number }[] }

// Seconds from the start of the score to a beat.
function clock(tempo: Tempo): (beat: number) => number {
  const { bpm } = tempo
  return beat =>
    tempo.slow.reduce((sec, s) => {
      const x = Math.min(Math.max(beat, s.from), s.to) - s.from
      const k = (s.bpm - bpm) / (s.to - s.from)
      return sec + (60 / k) * Math.log((bpm + k * x) / bpm) - (x * 60) / bpm
    }, (beat * 60) / bpm)
}

// A ramp of the low-pass filter on the whole mix: set to `from` Hz at `beat`, then to `to` Hz over `len` beats.
export type Sweep = { beat: number; len: number; from: number; to: number }
export type Score = { tempo: Tempo; beats: number; notes: ScoreNote[]; room: Room; sweeps: Sweep[]; kit: Kit }
type Ramp = { sec: number; dur: number; from: number; to: number }

export function playScore(song: Score): Stop {
  const sec = clock(song.tempo)
  const notes = song.notes.map(n => ({
    sec: sec(n.beat),
    dur: sec(n.beat + n.len) - sec(n.beat),
    hz: Frequency(n.pitch).toFrequency(),
    vel: n.vel,
    program: n.program,
    bend: n.bend,
  }))
  const ramps = song.sweeps.map(s => ({ sec: sec(s.beat), dur: sec(s.beat + s.len) - sec(s.beat), from: s.from, to: s.to }))
  const bars = Array.from({ length: song.beats / 4 }, (_, i) => sec(i * 4))
  return playNotes(notes, ramps, bars, sec(song.beats), song.tempo.bpm, song.room, patchSend, song.kit)
}

export function playMidi(bytes: Uint8Array, bpm: number): Stop {
  const { notes, end } = readMidi(bytes, bpm)
  return playNotes(notes, [], [], end, bpm, ROOM.hall, () => 0.6, KIT.standard)
}

// `bars` are the start of each 4/4 bar in seconds; each one logs `[music] bar N` when it is heard.
function playNotes(
  notes: MidiNote[],
  ramps: Ramp[],
  bars: number[],
  end: number,
  bpm: number,
  room: Room,
  sendFor: (program: number) => number,
  drums: Kit,
): Stop {
  const { mix } = bus()
  const space = room(bpm)
  space[0].chain(...space.slice(1), mix)
  const played: Record<number, Played> = {}
  const sung: Record<string, Sung> = {}
  notes.forEach(n => {
    if (n.bend !== undefined) {
      const key = `${n.program}:${n.bend.part}`
      if (sung[key] === undefined) sung[key] = makeSolo(n.program, space[0], mix, sendFor(n.program))
      return
    }
    if (played[n.program] !== undefined) return
    played[n.program] = makeVoice(n.program, space[0], mix, sendFor(n.program), drums)
  })
  const sweep = new Part<Ramp & { time: number }>(
    (time, r) => {
      mix.frequency.setValueAtTime(r.from, time)
      mix.frequency.exponentialRampToValueAtTime(r.to, time + r.dur)
    },
    ramps.map(r => ({ ...r, time: r.sec })),
  )
  sweep.loop = true
  sweep.loopEnd = end
  sweep.start(0)
  const counter = new Part<{ time: number; bar: number }>(
    (time, b) => getDraw().schedule(() => console.log(`[music] bar ${b.bar}`), time),
    bars.map((time, i) => ({ time, bar: i + 1 })),
  )
  counter.loop = true
  counter.loopEnd = end
  counter.start(0)
  const part = new Part<MidiNote & { time: number }>(
    (time, ev) => {
      if (ev.bend !== undefined) sing(sung[`${ev.program}:${ev.bend.part}`].voice, ev, ev.bend, time)
      else played[ev.program].voice.triggerAttackRelease(ev.hz, ev.dur, time, ev.vel)
    },
    notes.map(n => ({ ...n, time: n.sec })),
  )
  part.loop = true
  part.loopEnd = end
  const transport = getTransport()
  transport.bpm.value = bpm
  transport.position = 0
  part.start(0)
  transport.start()
  return () => {
    part.dispose()
    sweep.dispose()
    counter.dispose()
    Object.values(played).forEach(p => {
      p.voice.releaseAll()
      p.voice.dispose()
      p.nodes.forEach(n => n.dispose())
    })
    Object.values(sung).forEach(s => {
      s.voice.dispose()
      s.nodes.forEach(n => n.dispose())
    })
    space.forEach(n => n.dispose())
    mix.dispose()
    transport.stop()
    transport.position = 0
  }
}
