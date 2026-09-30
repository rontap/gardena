import type { Stop } from '../sound.h.ts'
import { GM, KIT, ROOM, playScore, type ScoreNote, type Tempo } from '../sound.utils.ts'
import { line } from './score.ts'

const BARS = 36
// The return slows across the bar of `HOME` that carries the answer, into the F.
const TEMPO: Tempo = { bpm: 43.2, slow: [{ from: 34 * 4, to: 35 * 4, bpm: 33.6 }] }

// Voicings from the bass up. Index 0 is the bass, 2 to 4 are the upper chord, kept between F3 and F4.
const CHORD = {
  Fmaj7: ['F2', 'C3', 'A3', 'C4', 'E4'],
  Bbmaj7: ['Bb2', 'F3', 'A3', 'D4', 'F4'],
  Am: ['A2', 'E3', 'A3', 'C4', 'E4'],
  Am7: ['A2', 'E3', 'G3', 'C4', 'E4'],
  C: ['C2', 'G2', 'G3', 'C4', 'E4'],
  Csus4: ['C2', 'G2', 'G3', 'C4', 'F4'],
  Dm: ['D2', 'A2', 'A3', 'D4', 'F4'],
  Dm7: ['D2', 'A2', 'A3', 'C4', 'F4'],
  Gm7: ['G2', 'D3', 'F3', 'Bb3', 'D4'],
} as const
type Chord = keyof typeof CHORD

const INTRO: Chord[] = ['Fmaj7', 'Bbmaj7', 'Fmaj7', 'Csus4']
const THEME_CHORDS: Chord[] = ['Fmaj7', 'Am7', 'Bbmaj7', 'C', 'Dm7', 'Bbmaj7', 'Gm7', 'Csus4']
const ANSWER_CHORDS: Chord[] = ['Fmaj7', 'Am7', 'Bbmaj7', 'Gm7', 'Dm7', 'Am7', 'Bbmaj7', 'C']
const BRIDGE_CHORDS: Chord[] = ['Dm', 'Am', 'Bbmaj7', 'Fmaj7', 'Gm7', 'Am7', 'Bbmaj7', 'Csus4']
const RETURN_CHORDS: Chord[] = [...THEME_CHORDS.slice(0, 6), 'C', 'Fmaj7']

const THEME = [
  'A4 1.5, G4 .5, F4 1, C4 1',
  'E4 1.5, F4 .5, G4 2',
  'F4 1, A4 1, D5 1.5, C5 .5',
  'C5 1/3, D5 1/3, C5 1/3, Bb4 .5, A4 .5, G4 2',
  'F4 .5, G4 .5, A4 .5, C5 .5, D5 1, C5 1',
  'D5 .5, C5 .5, A4 .5, G4 .5, F4 1, G4 1',
  'Bb4 1.5, A4 .5, G4 1/3, A4 1/3, Bb4 1/3, C5 1',
  'G4 .5, A4 .5, Bb4 .5, D5 .5, C5 2',
]
// The theme's falling answer, its bar 4, over C, then down a step from its G to F.
const HOME = [THEME[3], 'F4 4']
const RETURN = [...THEME.slice(0, 6), ...HOME]
const ANSWER = [
  'A4 1.5, G4 .5, F4 1, C5 1',
  'C5 .5, A4 .5, G4 .5, A4 .5, E4 2',
  'F4 .5, G4 .5, A4 .5, C5 .5, D5 1, F5 1',
  'D5 1.5, C5 .5, Bb4 .5, A4 .5, G4 1',
  'A4 1/3, Bb4 1/3, C5 1/3, D5 1, C5 .5, A4 .5, F4 1',
  'E4 .5, G4 .5, A4 .5, C5 .5, A4 2',
  'Bb4 .5, A4 .5, F4 .5, A4 .5, D5 1, C5 1',
  'C5 1, Bb4 .5, A4 .5, G4 2',
]
const COUNTER = ['r 4', 'r 2, G3 1, C4 1', 'r 4', 'r 2, F4 1, Bb3 1', 'r 4', 'r 2, C4 1, E4 1', 'r 4', 'r 2, E4 1, C4 1']
const BRIDGE = [
  'D4 .5, F4 .5, A4 .5, D5 .5, C5 1, A4 1',
  'C5 1.5, A4 .5, E4 2',
  'F4 .5, G4 .5, A4 .5, Bb4 .5, D5 1, C5 1',
  'C5 1.5, A4 .5, F4 2',
  'Bb4 1/3, A4 1/3, G4 1/3, A4 1, Bb4 1, D5 1',
  'C5 .5, A4 .5, G4 .5, E4 .5, A4 2',
  'F4 .5, A4 .5, C5 .5, A4 .5, D5 2',
  'C5 3, r 1',
]
const REPLY = ['r 2.5, A4 .5, C5 .5, E5 .5', 'r 4', 'r 4', 'r 4', 'r 1, G4 .5, A4 .5, Bb4 1, r 1']

const HARP = [0, 2, 3, 4]
const BELL = [0, 1, 2, 1, 0, 1, 2, 1]

function up(pitch: string): string {
  return pitch.replace(/\d+$/, o => String(Number(o) + 1))
}

function chords(bar: number, names: Chord[], play: (beat: number, c: readonly string[]) => void): void {
  names.forEach((name, i) => play((bar + i) * 4, CHORD[name]))
}

function harp(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) =>
    HARP.forEach((k, j) => out.push({ beat: beat + j, len: 2, pitch: c[k], vel: j === 0 ? vel : vel * 0.8, program: GM.harp })),
  )
}

function bell(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) => {
    const tones = [up(c[2]), up(c[3]), up(c[4])]
    BELL.forEach((k, j) =>
      out.push({ beat: beat + j * 0.5, len: 0.5, pitch: tones[k], vel: j % 4 === 0 ? vel : vel * 0.8, program: GM.glockenspiel }),
    )
  })
}

function pad(out: ScoreNote[], bar: number, names: Chord[], program: number, vel: number): void {
  chords(bar, names, (beat, c) => c.slice(2).forEach(pitch => out.push({ beat, len: 4, pitch, vel, program })))
}

function roots(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) => out.push({ beat, len: 4, pitch: c[0], vel, program: GM.cello }))
}

function pizzicato(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) =>
    [0, 1, 2, 1].forEach((k, j) => out.push({ beat: beat + j, len: 0.5, pitch: c[k], vel: j === 0 ? vel : vel * 0.8, program: GM.pizzicato })),
  )
}

// The harp's chord rolled from the bottom, one string every fifth of a beat, held for the bar.
function roll(out: ScoreNote[], bar: number, name: Chord, vel: number): void {
  CHORD[name].forEach((pitch, j) => out.push({ beat: bar * 4 + j * 0.2, len: 4 - j * 0.2, pitch, vel, program: GM.harp }))
}

function drone(out: ScoreNote[], bar: number, bars: number): void {
  for (let i = 0; i < bars; i += 2) {
    out.push({ beat: (bar + i) * 4, len: 8, pitch: 'F2', vel: 0.16, program: GM.strings })
    out.push({ beat: (bar + i) * 4, len: 8, pitch: 'C3', vel: 0.13, program: GM.strings })
  }
}

function score(): ScoreNote[] {
  const out: ScoreNote[] = []

  harp(out, 0, INTRO, 0.55)
  bell(out, 0, INTRO, 0.4)
  line(out, GM.ocarina, 3, 0.44, ['r 3, F4 .5, G4 .5'])

  line(out, GM.ocarina, 4, 0.48, THEME)
  harp(out, 4, THEME_CHORDS, 0.5)
  bell(out, 4, THEME_CHORDS, 0.38)
  drone(out, 8, 4)

  line(out, GM.flute, 12, 0.5, ANSWER)
  line(out, GM.celesta, 12, 0.34, COUNTER)
  line(out, GM.vibraphone, 12, 0.36, ['C5 4'])
  harp(out, 12, ANSWER_CHORDS, 0.53)
  bell(out, 12, ANSWER_CHORDS, 0.36)
  pad(out, 12, ANSWER_CHORDS, GM.choir, 0.14)
  roots(out, 12, ANSWER_CHORDS, 0.34)

  line(out, GM.clarinet, 20, 0.5, BRIDGE)
  line(out, GM.recorder, 23, 0.44, REPLY)
  line(out, GM.vibraphone, 20, 0.36, ['A4 4'])
  line(out, GM.vibraphone, 24, 0.36, ['D5 4'])
  harp(out, 20, BRIDGE_CHORDS, 0.55)
  bell(out, 20, BRIDGE_CHORDS, 0.34)
  pizzicato(out, 20, BRIDGE_CHORDS, 0.46)

  line(out, GM.ocarina, 28, 0.48, RETURN)
  line(out, GM.vibraphone, 34, 0.42, HOME)
  harp(out, 28, RETURN_CHORDS.slice(0, 7), 0.53)
  roll(out, 35, 'Fmaj7', 0.62)
  bell(out, 28, RETURN_CHORDS, 0.38)
  roots(out, 34, RETURN_CHORDS.slice(6), 0.36)
  drone(out, 32, 2)

  return out
}

export function startSong3(done: () => void): Stop {
  return playScore({ tempo: TEMPO, beats: BARS * 4, notes: score(), room: ROOM.echo, sweeps: [], kit: KIT.standard }, done)
}
