import type { Stop } from '../sound.h.ts'
import { GM, KIT, ROOM, playScore, type ScoreNote, type Tempo } from '../sound.utils.ts'
import { line } from './score.ts'

const BARS = 48
// Each refrain slows across the first bar of `ANSWER_HOME`, so the phrase that returns is the one that slows, into the G.
const TEMPO: Tempo = {
  bpm: 106,
  slow: [
    { from: 25 * 4, to: 26 * 4, bpm: 80 },
    { from: 41 * 4, to: 42 * 4, bpm: 80 },
  ],
}

// Index 0 is the root and 1 the fifth above it, the piano's left hand. 2 to 4 are the right-hand chord.
const CHORD = {
  G: ['G2', 'D3', 'B3', 'D4', 'G4'],
  Em: ['E2', 'B2', 'G3', 'B3', 'E4'],
  Em7: ['E2', 'B2', 'G3', 'B3', 'D4'],
  C: ['C3', 'G3', 'C4', 'E4', 'G4'],
  Cadd9: ['C3', 'G3', 'D4', 'E4', 'G4'],
  Cmaj7: ['C3', 'G3', 'E4', 'G4', 'B4'],
  D: ['D2', 'A2', 'D4', 'F#4', 'A4'],
  DoverFs: ['F#2', 'D3', 'D4', 'F#4', 'A4'],
  Bm7: ['B2', 'F#3', 'D4', 'F#4', 'A4'],
  Am7: ['A2', 'E3', 'C4', 'E4', 'G4'],
} as const
type Chord = keyof typeof CHORD

const INTRO: Chord[] = ['G', 'Cadd9', 'G', 'D']
const THEME_CHORDS: Chord[] = ['G', 'Em7', 'Cadd9', 'D', 'G', 'Bm7', 'Cadd9', 'D']
const RISE_CHORDS: Chord[] = ['G', 'Em7', 'Cadd9', 'D', 'G', 'Bm7', 'Am7', 'D']
const REFRAIN_CHORDS: Chord[] = ['C', 'D', 'Bm7', 'Em7', 'Am7']
const BRIDGE_CHORDS: Chord[] = ['Em', 'Cmaj7', 'G', 'DoverFs', 'Em', 'Cmaj7', 'Am7', 'D']
const OUTRO: Chord[] = ['Cmaj7', 'D', 'G', 'G']

const THEME = [
  'D4 .5, G4 .5, B4 1, A4 .5, G4 .5, D4 1',
  'E4 .5, G4 .5, B4 1, D5 1, B4 1',
  'C5 .5, B4 .5, A4 1, G4 .5, E4 .5, G4 1',
  'A4 1, F#4 .5, E4 .5, D4 2',
  'D4 .5, G4 .5, B4 1, A4 .5, G4 .5, B4 1',
  'D5 .5, B4 .5, F#4 1, A4 .5, B4 .5, D5 1',
  'E5 1, D5 .5, C5 .5, B4 .5, A4 .5, G4 1',
  'A4 .5, B4 .5, A4 1, F#4 1, r 1',
]
const RISE = [...THEME.slice(0, 7), 'F#4 .5, G4 .5, A4 .5, B4 .5, C5 .5, D5 .5, r 1']
// The theme's falling answer, its bars 3 and 4, played over C then G instead of Cadd9 then D.
const ANSWER_HOME = THEME.slice(2, 4)
const REFRAIN = [
  'E4 .5, G4 .5, C5 1, C5 .5, D5 .5, E5 1',
  'D5 1.5, C5 .5, A4 2',
  'B4 .5, A4 .5, B4 1, D5 1, B4 1',
  'G4 1.5, F#4 .5, E4 2',
  'C5 .5, B4 .5, A4 1, C5 .5, D5 .5, E5 1',
  ...ANSWER_HOME,
  'r 4',
]
const BRIDGE = [
  'B4 1, G4 1, E4 2',
  'E4 .5, G4 .5, B4 1, G4 2',
  'D5 1, B4 1, G4 2',
  'F#4 1, A4 1, D5 2',
  'B4 1, G4 .5, A4 .5, B4 2',
  'C5 1, B4 1, G4 2',
  'A4 .5, B4 .5, C5 1, E5 1, D5 1',
  'D5 .5, C5 .5, B4 .5, A4 .5, F#4 1, A4 1',
]
const TAG = ['E4 .5, G4 .5, B4 1, r 2', 'A4 .5, F#4 .5, D4 1, r 2', 'B4 .5, A4 .5, G4 1, D4 1, G4 1', 'r 4']

// Woodblock, one bar each: a clock tick, then ti-ti ta, then straight eighths.
const TICK = 'E5 1, A4 1, E5 1, A4 1'
const BUSY = 'E5 .5, E5 .5, A4 1, E5 .5, E5 .5, A4 1'
const RUN = 'E5 .5, A4 .5, E5 .5, A4 .5, E5 .5, A4 .5, E5 .5, A4 .5'

const EIGHTHS = [2, 4, 3, 4, 2, 4, 3, 4]
const OFFBEATS = [1.5, 3.5]

function chords(bar: number, names: Chord[], play: (beat: number, c: readonly string[]) => void): void {
  names.forEach((name, i) => play((bar + i) * 4, CHORD[name]))
}

function clicks(out: ScoreNote[], bar: number, bars: number, pattern: string, vel: number): void {
  line(out, GM.woodblock, bar, vel, Array.from({ length: bars }, () => pattern))
}

function ostinato(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) =>
    EIGHTHS.forEach((k, j) => out.push({ beat: beat + j * 0.5, len: 0.5, pitch: c[k], vel: j % 4 === 0 ? vel : vel * 0.8, program: GM.piano })),
  )
}

// Left hand alternates root and fifth on the beat, right hand plays the chord on beats 2½ and 4½.
function piano(out: ScoreNote[], bar: number, names: Chord[], bass: number, chord: number): void {
  chords(bar, names, (beat, c) => {
    ;[0, 1, 0, 1].forEach((k, j) => out.push({ beat: beat + j, len: 1, pitch: c[k], vel: bass, program: GM.piano }))
    OFFBEATS.forEach(at => c.slice(2).forEach(pitch => out.push({ beat: beat + at, len: 0.5, pitch, vel: chord, program: GM.piano })))
  })
}

// Left hand holds root and fifth for the whole bar.
function fifths(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) => c.slice(0, 2).forEach(pitch => out.push({ beat, len: 4, pitch, vel, program: GM.piano })))
}

function pizzicato(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) =>
    [0, 1, 0, 1].forEach((k, j) => out.push({ beat: beat + j, len: 0.5, pitch: c[k], vel: j === 0 ? vel : vel * 0.8, program: GM.pizzicato })),
  )
}

function roots(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) => out.push({ beat, len: 4, pitch: c[0], vel, program: GM.cello }))
}

// The last three bars of a refrain, with the woodblock silent and `TEMPO` slowing into the second.
// Bars 1 and 2: the piano plays `ANSWER_HOME`, whose first bar is the woodblock's ti-ti ta, over C held on beats 1 and 3.
// Bar 2, G: low G and the G chord rolled slowly from the bottom, held for two bars, pizzicato under it.
// Bar 3: a quiet G arpeggio that starts the motion again.
function home(out: ScoreNote[], bar: number, vel: number): void {
  const g = CHORD.G
  const at = bar * 4
  line(out, GM.piano, bar, vel * 1.3, ANSWER_HOME)
  ;[0, 2].forEach(t =>
    ['C2', 'G2', 'E3', 'G3'].forEach(pitch => out.push({ beat: at + t, len: 2, pitch, vel: vel * 0.75, program: GM.piano })),
  )
  ;['G1', ...g].forEach((pitch, j) => out.push({ beat: at + 4 + j * 0.2, len: 8 - j * 0.2, pitch, vel: vel * 1.15, program: GM.piano }))
  out.push({ beat: at + 4, len: 2, pitch: 'G2', vel: 0.4, program: GM.pizzicato })
  line(out, GM.piano, bar + 2, vel * 0.65, ['G3 .5, B3 .5, D4 .5, G4 .5, B4 2'])
}

function score(): ScoreNote[] {
  const out: ScoreNote[] = []

  clicks(out, 0, 4, TICK, 0.45)
  ostinato(out, 0, INTRO, 0.4)
  piano(out, 2, INTRO.slice(2), 0.34, 0.36)

  line(out, GM.piano, 4, 0.68, THEME)
  ostinato(out, 4, THEME_CHORDS, 0.4)
  piano(out, 4, THEME_CHORDS, 0.34, 0.36)
  clicks(out, 4, 8, TICK, 0.45)

  line(out, GM.piano, 12, 0.7, RISE)
  ostinato(out, 12, RISE_CHORDS, 0.42)
  piano(out, 12, RISE_CHORDS, 0.36, 0.38)
  pizzicato(out, 12, RISE_CHORDS, 0.32)
  clicks(out, 12, 8, BUSY, 0.46)

  line(out, GM.flute, 20, 0.5, REFRAIN)
  ostinato(out, 20, REFRAIN_CHORDS, 0.42)
  piano(out, 20, REFRAIN_CHORDS, 0.36, 0.38)
  pizzicato(out, 20, REFRAIN_CHORDS, 0.32)
  clicks(out, 20, 5, RUN, 0.42)
  home(out, 25, 0.52)

  line(out, GM.piano, 28, 0.62, BRIDGE)
  ostinato(out, 28, BRIDGE_CHORDS, 0.32)
  fifths(out, 28, BRIDGE_CHORDS, 0.32)
  roots(out, 32, BRIDGE_CHORDS.slice(4), 0.24)
  clicks(out, 28, 8, TICK, 0.4)

  line(out, GM.flute, 36, 0.52, REFRAIN)
  ostinato(out, 36, REFRAIN_CHORDS, 0.44)
  piano(out, 36, REFRAIN_CHORDS, 0.36, 0.4)
  pizzicato(out, 36, REFRAIN_CHORDS, 0.32)
  clicks(out, 36, 5, RUN, 0.44)
  home(out, 41, 0.54)

  line(out, GM.piano, 44, 0.62, TAG)
  ostinato(out, 44, OUTRO, 0.4)
  piano(out, 44, OUTRO, 0.34, 0.36)
  clicks(out, 44, 4, TICK, 0.45)

  return out
}

export function startSong4(done: () => void): Stop {
  return playScore({ tempo: TEMPO, beats: BARS * 4, notes: score(), room: ROOM.hall, sweeps: [], kit: KIT.standard }, done)
}
