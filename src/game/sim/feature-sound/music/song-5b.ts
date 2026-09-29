import type { Stop } from '../sound.h.ts'
import { DRUM, GM, KIT, ROOM, playScore, type ScoreNote, type Sweep, type Tempo } from '../sound.utils.ts'
import { grid, line, sing } from './score.ts'

// The buildup of a live DJ cover, recreated from its analysis: 140 bpm with the drums in half time.
const BARS = 67
const TEMPO: Tempo = { bpm: 140, slow: [] }

// Index 0 is the bass, 1 its fifth, 2 to 4 the upper chord.
const CHORD = {
  Abadd9: ['Ab1', 'Eb2', 'Ab3', 'Bb3', 'C4'],
  Abmaj7: ['Ab1', 'Eb2', 'G3', 'C4', 'Eb4'],
  Bb: ['Bb1', 'F2', 'F3', 'Bb3', 'D4'],
  Cm7: ['C2', 'G2', 'G3', 'Bb3', 'Eb4'],
  Eb: ['Eb2', 'Bb2', 'G3', 'Bb3', 'Eb4'],
  Eb5: ['Eb2', 'Bb2', 'Eb3', 'Bb3', 'Eb4'],
} as const
type Chord = keyof typeof CHORD

function times<T>(n: number, cycle: T[]): T[] {
  return Array.from({ length: n }, (_, i) => cycle[i % cycle.length])
}

const LAYERS: Chord[] = ['Abmaj7', 'Abmaj7', 'Cm7', 'Bb', 'Abmaj7', 'Abadd9', 'Cm7', 'Bb']
const DROP: Chord[] = times(16, ['Abmaj7', 'Bb', 'Cm7', 'Eb'] as Chord[])

// The "OHH" line, bar by bar from its pickup. Long notes spill into the next bar, whose string starts with a rest.
// One stanza: a long C opening up, a bend up through D to E flat, a short F, a bend back to D. Every step bends:
// 180 ms between long notes, 120 ms around the short F. The stanza plays twice, then a third time that stops on
// the first rise to D.
const OHH = [
  'r 3.5, C4 7 s-50:200',
  'r 4',
  'r 2.5, D4 1.5 g180',
  'Eb4 3.5 g180, F4 .5 g120',
  'D4 3.5 g120, C4 7 g180',
  'r 4',
  'r 2.5, D4 1.5 g180',
  'Eb4 3.5 g180, F4 .5 g120',
  'D4 3.5 g120, C4 7 g180',
  'r 4',
  'r 2.5, D4 1.5 g180',
]
// The second stanza's harmony, a third below and quieter, from its C onward (the fifth string of `OHH`).
const THIRD = ['r 3.5, Ab3 7 s-50:200', 'r 4', 'r 2.5, Bb3 1.5 g180', 'C4 3.5 g180, D4 .5 g120', 'Bb3 3.5 g120']
// The reprise: two stanzas, the second ending on its D.
const REPRISE = [...OHH.slice(0, 8), 'D4 4 g120']

// The 8-bit hook of the drop, over Abmaj7, Bb, Cm7, Eb.
const HOOK = [
  'C5 .75, Bb4 .75, G4 .5, Ab4 1, Eb4 1',
  'D5 .75, C5 .75, Bb4 .5, F4 2',
  'Eb5 .75, D5 .75, C5 .5, G4 1, Bb4 1',
  'G4 .75, F4 .75, Eb4 .5, D4 .5, Eb4 1.5',
]

// Drums as analysed. Section C, its first six bars, then its two-bar groove.
const KICK_IN = ['................', '........X.......', 'X.....x.........', '..........x.....', 'X.....x.........', 'X..x..x...x..x..']
const SNARE_IN = ['........X.......', '........X.......', '................', '........X.......', 'x.......X.......', 'x.......X.......']
const HAT_IN = ['.xxxxxxx...x.xxx', 'x..x..x....xxxxx', '.......x...xxxxx', 'x..x..x....xxxxx', '.xxxxxxx...xxxxx', 'x..x..x....xxxxx']
const KICK = ['X.....x.........', 'X..x..x...x..x..']
const SNARE = ['x.......X.......', 'x.......X.......']
const HAT = ['.xxxxxxx...xxxxx', 'x..x..x....xxxxx']
const KICK_DROP = ['X..x.........x..']

// The whole mix goes muffled and opens: twice in the intro, open for the layers, closed again at the end.
const SWEEPS: Sweep[] = [
  { beat: 0, len: 8, from: 700, to: 3700 },
  { beat: 8, len: 8, from: 3700, to: 700 },
  { beat: 16, len: 8, from: 700, to: 2200 },
  { beat: 24, len: 8, from: 2200, to: 700 },
  { beat: 32, len: 4, from: 700, to: 20000 },
  { beat: 63 * 4, len: 16, from: 20000, to: 700 },
]

const PLUCK = [0, 2, 1, 2]
const BELL = [0, 1, 2, 1, 0, 1, 2, 1]

function up(pitch: string): string {
  return pitch.replace(/\d+$/, o => String(Number(o) + 1))
}

function chords(bar: number, names: Chord[], play: (beat: number, c: readonly string[]) => void): void {
  names.forEach((name, i) => play((bar + i) * 4, CHORD[name]))
}

function pad(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) => c.slice(2).forEach(pitch => out.push({ beat, len: 4, pitch, vel, program: GM.strings })))
}

// A plucked chord note every dotted quarter, so it crosses the bar lines: 8 plucks per 3 bars.
function pluck(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  const end = (bar + names.length) * 4
  for (let beat = bar * 4, k = 0; beat < end; beat += 1.5, k++) {
    const c = CHORD[names[Math.floor(beat / 4) - bar]]
    out.push({ beat, len: 1.5, pitch: up(c[2 + PLUCK[k % 4]]), vel: k % 2 === 0 ? vel : vel * 0.8, program: GM.electricPiano })
  }
}

function bells(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) =>
    BELL.forEach((k, j) => out.push({ beat: beat + j * 0.5, len: 0.5, pitch: up(c[2 + k]), vel: j % 4 === 0 ? vel : vel * 0.8, program: GM.glockenspiel })),
  )
}

// The held low E flat under sections C and D.
function pedal(out: ScoreNote[], bar: number, bars: number, vel: number): void {
  for (let i = 0; i < bars; i += 2) {
    out.push({ beat: (bar + i) * 4, len: 8, pitch: 'Eb2', vel, program: GM.strings })
    out.push({ beat: (bar + i) * 4, len: 8, pitch: 'Bb2', vel: vel * 0.8, program: GM.strings })
  }
}

// The drop's bass follows the kick: root on steps 1 and 4, the fifth on step 14.
function bass(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) => {
    out.push({ beat, len: 0.75, pitch: c[0], vel, program: GM.synthBass })
    out.push({ beat: beat + 0.75, len: 2.5, pitch: c[0], vel: vel * 0.85, program: GM.synthBass })
    out.push({ beat: beat + 3.25, len: 0.75, pitch: c[1], vel: vel * 0.85, program: GM.synthBass })
  })
}

// The line on two voices at once: the clear triangles lead, the buzzier sawtooths under them at 0.7 of the velocity.
function voices(out: ScoreNote[], part: number, bar: number, vel: number, bars: string[]): void {
  sing(out, GM.voiceOoh, part, bar, vel, bars)
  sing(out, GM.synthVoice, part, bar, vel * 0.7, bars)
}

function drums(out: ScoreNote[], bar: number, kick: string[], snare: string[], hat: string[], vel: number): void {
  grid(out, DRUM.kick, bar, vel, kick)
  grid(out, DRUM.snare, bar, vel * 0.75, snare)
  grid(out, DRUM.hat, bar, vel * 0.5, hat)
}

function score(): ScoreNote[] {
  const out: ScoreNote[] = []

  // Intro, bars 1-8: pad and pluck under the sweeps.
  pad(out, 0, times(8, ['Abadd9'] as Chord[]), 0.28)
  pluck(out, 0, times(8, ['Abadd9'] as Chord[]), 0.36)

  // Layers, bars 9-16: the filter opens, chords move, a high layer, one open-hat hit.
  pad(out, 8, LAYERS, 0.45)
  pluck(out, 8, LAYERS, 0.38)
  bells(out, 12, LAYERS.slice(4, 7), 0.22)
  grid(out, DRUM.openHat, 15, 0.45, ['....X...........'])

  // Drums, bars 17-24, over the held E flat. Bar 24 carries the pickup of the "OHH" line.
  drums(out, 16, [...KICK_IN, ...KICK], [...SNARE_IN, ...SNARE], [...HAT_IN, ...HAT], 0.75)
  pedal(out, 16, 8, 0.3)
  pluck(out, 16, times(8, ['Eb5'] as Chord[]), 0.2)

  // The "OHH" line, bars 25-34.
  voices(out, 0, 23, 0.55, OHH)
  voices(out, 1, 27, 0.3, THIRD)
  drums(out, 24, times(10, KICK), times(10, SNARE), times(10, HAT), 0.75)
  pedal(out, 24, 10, 0.3)

  // Bass alone, bars 35-38. Bar 38 carries the pickup of the reprise.
  line(out, GM.synthBass, 34, 0.45, ['Ab1 4', 'Bb1 4', 'Eb2 4', 'C2 4'])

  // The line again over the chords, bars 39-46, the bass holding E flat for seven beats.
  voices(out, 0, 37, 0.6, REPRISE)
  voices(out, 1, 41, 0.33, [...THIRD.slice(0, 4), 'Bb3 4 g120'])
  pad(out, 38, LAYERS, 0.4)
  pluck(out, 38, LAYERS, 0.34)
  bells(out, 42, LAYERS.slice(4), 0.2)
  line(out, GM.synthBass, 38, 0.4, ['Eb2 7'])
  drums(out, 38, times(8, KICK), times(8, SNARE), times(8, HAT), 0.78)

  // Build, bar 47: hats on every sixteenth, then a seven-hit snare roll.
  drums(out, 46, ['................'], ['.........xxxxxxX'], ['........xxxxxxxx'], 0.8)
  pad(out, 46, ['Bb'], 0.4)

  // Drop, bars 48-63: bass on the kick, full drums, and the 8-bit hook in its second half.
  grid(out, DRUM.openHat, 47, 0.5, ['X...............'])
  bass(out, 47, DROP, 0.55)
  drums(out, 47, times(16, KICK_DROP), times(16, SNARE), times(16, HAT), 0.8)
  pad(out, 47, DROP, 0.36)
  pluck(out, 47, DROP, 0.34)
  line(out, GM.squareLead, 55, 0.4, [...HOOK, ...HOOK])

  // Outro, bars 64-67: the filter closes onto the intro.
  pad(out, 63, times(4, ['Abadd9'] as Chord[]), 0.3)
  pluck(out, 63, times(4, ['Abadd9'] as Chord[]), 0.34)
  line(out, GM.synthBass, 63, 0.35, ['Ab1 8'])
  grid(out, DRUM.hat, 63, 0.3, times(4, ['x...x...x...x...']))

  return out
}

export function startSong5(done: () => void): Stop {
  return playScore({ tempo: TEMPO, beats: BARS * 4, notes: score(), room: ROOM.hall, sweeps: SWEEPS, kit: KIT.standard }, done)
}
