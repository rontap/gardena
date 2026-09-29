import type { Stop } from '../sound.h.ts'
import { GM, KIT, ROOM, playScore, type ScoreNote, type Tempo } from '../sound.utils.ts'
import { line } from './score.ts'

const BARS = 48
const TEMPO: Tempo = {
  bpm: 90,
  slow: [
    { from: 25 * 4, to: 26 * 4, bpm: 68 },
    { from: 41 * 4, to: 42 * 4, bpm: 68 },
  ],
}

const CHORD = {
  C: ['C2', 'G2', 'E4', 'G4', 'C5'],
  F: ['F2', 'C3', 'A3', 'C4', 'F4'],
  G: ['G2', 'D3', 'B3', 'D4', 'G4'],
  Am: ['A2', 'E3', 'C4', 'E4', 'A4'],
  Dm: ['D2', 'A2', 'D4', 'F4', 'A4'],
  Em: ['E2', 'B2', 'G3', 'B3', 'E4'],
} as const
type Chord = keyof typeof CHORD

const INTRO: Chord[] = ['C', 'C', 'C']
const THEME_CHORDS: Chord[] = ['C', 'Am', 'F', 'G', 'C', 'Dm', 'G', 'G']
const REFRAIN_CHORDS: Chord[] = ['F', 'G', 'Am', 'F', 'C']
const BRIDGE_CHORDS: Chord[] = ['Em', 'Am', 'F', 'G', 'C', 'Am', 'G', 'Em']
const OUTRO: Chord[] = ['C', 'F', 'C', 'C']

const THEME = [
  'E4 .5, G4 .5, E4 .5, G4 .5, E4 2/3, G4 2/3, G4 2/3',
  'E4 .5, A4 .5, E4 .5, A4 .5, E4 2/3, A4 2/3, A4 2/3',
  'G4 .5, A4 .5, G4 1, F4 .5, E4 .5, D4 1',
  'E4 1, D4 .5, C4 .5, G4 2',
  'E4 .5, G4 .5, E4 .5, G4 .5, E4 2/3, G4 2/3, G4 2/3',
  'D4 .5, F4 .5, D4 .5, F4 .5, D4 2/3, F4 2/3, F4 2/3',
  'F4 .5, G4 .5, A4 .5, B4 .5, C5 1, D5 1',
  'D5 .5, C5 .5, B4 1, G4 1, r 1',
]
const RISE = [...THEME.slice(0, 7), 'E4 .5, G4 .5, A4 .5, B4 .5, C5 .5, D5 .5, r 1']
const ANSWER = THEME.slice(2, 4)
const REFRAIN = [
  'A4 .5, C5 .5, A4 .5, C5 .5, A4 2/3, C5 2/3, C5 2/3',
  'B4 .5, D5 .5, B4 .5, D5 .5, B4 2/3, D5 2/3, D5 2/3',
  'E4 .5, A4 .5, E4 .5, A4 .5, C5 2',
  'A4 1, G4 .5, F4 .5, E4 2',
  'G4 .5, E4 .5, G4 1, A4 .5, G4 .5, E4 1',
  ...ANSWER,
  'r 4',
]
const BRIDGE = [
  'E4 .5, F4 .5, G4 .5, A4 .5, B4 2',
  'C5 .5, B4 .5, A4 .5, G4 .5, F4 .5, E4 1.5',
  'A4 .5, G4 .5, F4 1, E4 2',
  'D4 .5, E4 .5, F4 .5, G4 .5, A4 .5, B4 1.5',
  'G4 1, A4 .5, B4 .5, C5 2',
  'E4 1, D4 1, C4 2',
  'A4 .5, B4 .5, C5 .5, D5 .5, E5 1, D5 1',
  'D5 .5, C5 .5, B4 .5, A4 .5, G4 2',
]
const TAG = [
  'E4 .5, G4 .5, E4 .5, G4 .5, E4 2/3, G4 2/3, G4 2/3',
  'G4 .5, A4 .5, G4 1, F4 .5, E4 .5, D4 1',
  'E4 1, D4 .5, C4 .5, C4 2',
  'r 4',
]

const TICK = 'C5 1, G4 1, C5 1, G4 1'
const BUSY = 'C5 .5, C5 .5, G4 1, C5 .5, C5 .5, G4 1'
const RUN = 'C5 .5, G4 .5, C5 .5, G4 .5, C5 .5, G4 .5, C5 .5, G4 .5'

function up(pitch: string): string {
  return pitch.replace(/\d+$/, o => String(Number(o) + 1))
}

function chords(bar: number, names: readonly Chord[], play: (beat: number, c: readonly string[]) => void): void {
  names.forEach((name, i) => play((bar + i) * 4, CHORD[name]))
}

function clicks(out: ScoreNote[], bar: number, bars: number, pattern: string, vel: number): void {
  line(out, GM.woodblock, bar, vel, Array.from({ length: bars }, () => pattern))
}

function box(out: ScoreNote[], bar: number, names: readonly Chord[], vel: number): void {
  chords(bar, names, (beat, c) => {
    ;[3, 2, 4, 2].forEach((k, j) => out.push({ beat: beat + j, len: 1, pitch: c[k], vel: j === 0 ? vel : vel * 0.85, program: GM.musicBox }))
  })
}

function harp(out: ScoreNote[], bar: number, names: readonly Chord[], vel: number): void {
  chords(bar, names, (beat, c) => {
    ;[0, 2, 3, 4].forEach((k, j) => out.push({ beat: beat + j, len: 1.5, pitch: c[k], vel: j === 0 ? vel : vel * 0.8, program: GM.harp }))
  })
}

function root(out: ScoreNote[], bar: number, names: readonly Chord[], vel: number): void {
  chords(bar, names, (beat, c) => out.push({ beat, len: 4, pitch: c[0], vel, program: GM.cello }))
}

function octaves(out: ScoreNote[], bar: number, names: readonly Chord[], vel: number): void {
  chords(bar, names, (beat, c) => {
    out.push({ beat, len: 4, pitch: c[0], vel, program: GM.cello })
    out.push({ beat, len: 4, pitch: up(c[0]), vel: vel * 0.75, program: GM.cello })
  })
}

function home(out: ScoreNote[], bar: number, vel: number): void {
  const at = bar * 4
  line(out, GM.recorder, bar, vel, ANSWER)
  ;[0, 2].forEach(t => ['F2', 'C3', 'A3', 'C4'].forEach(pitch => out.push({ beat: at + t, len: 2, pitch, vel: vel * 0.7, program: GM.harp })))
  ;['C2', 'G2', 'E3', 'G3', 'C4', 'E4'].forEach((pitch, j) => out.push({ beat: at + 4 + j * 0.18, len: 8 - j * 0.18, pitch, vel, program: GM.harp }))
  line(out, GM.musicBox, bar + 2, vel * 0.65, ['C4 .5, E4 .5, G4 .5, C5 .5, E4 2'])
}

function score(): ScoreNote[] {
  const out: ScoreNote[] = []

  clicks(out, 0, 4, TICK, 0.82)
  box(out, 1, INTRO, 0.24)

  line(out, GM.recorder, 4, 0.4, THEME)
  clicks(out, 4, 8, TICK, 0.84)
  box(out, 4, THEME_CHORDS, 0.26)
  harp(out, 4, THEME_CHORDS, 0.22)

  line(out, GM.recorder, 12, 0.42, RISE)
  clicks(out, 12, 8, BUSY, 0.86)
  box(out, 12, THEME_CHORDS, 0.28)
  harp(out, 12, THEME_CHORDS, 0.24)

  line(out, GM.ocarina, 20, 0.36, REFRAIN)
  clicks(out, 20, 5, RUN, 0.9)
  box(out, 20, REFRAIN_CHORDS, 0.26)
  harp(out, 20, REFRAIN_CHORDS, 0.22)
  root(out, 20, REFRAIN_CHORDS, 0.2)
  home(out, 25, 0.46)

  line(out, GM.recorder, 28, 0.34, BRIDGE)
  clicks(out, 28, 8, TICK, 0.8)
  box(out, 28, BRIDGE_CHORDS, 0.2)
  octaves(out, 28, BRIDGE_CHORDS, 0.22)

  line(out, GM.ocarina, 36, 0.38, REFRAIN)
  clicks(out, 36, 5, RUN, 0.9)
  box(out, 36, REFRAIN_CHORDS, 0.26)
  harp(out, 36, REFRAIN_CHORDS, 0.24)
  root(out, 36, REFRAIN_CHORDS, 0.2)
  home(out, 41, 0.48)

  line(out, GM.recorder, 44, 0.36, TAG)
  clicks(out, 44, 4, TICK, 0.82)
  box(out, 44, OUTRO, 0.22)

  return out
}

export function startSong6(done: () => void): Stop {
  return playScore({ tempo: TEMPO, beats: BARS * 4, notes: score(), room: ROOM.echo, sweeps: [], kit: KIT.standard }, done)
}
