import type { Stop } from '../sound.h.ts'
import { DRUM, GM, KIT, ROOM, playScore, type ScoreNote, type Sweep, type Tempo } from '../sound.utils.ts'
import { grid, line, sing } from './score.ts'

// Built on the buildup of a live DJ cover, recreated from its analysis, with the drums in half time.
// Intro, two piano verses, the "OHH" refrain, a drop, a piano breakdown, the refrain, a shorter drop, an outro.
const BARS = 80
const TEMPO: Tempo = { bpm: 163.33, slow: [] }

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

const VERSE: Chord[] = ['Abmaj7', 'Abmaj7', 'Cm7', 'Bb', 'Abmaj7', 'Abadd9', 'Cm7', 'Bb']
const OUTRO: Chord[] = ['Abmaj7', 'Bb', 'Eb', 'Abadd9']

// The piano theme, on the groove's long-long-short (3-3-2): a sigh falling on two dotted quarters and a quarter,
// answered by a run of eighths climbing like the refrain's steps and landing off the beat. Bar 3 is the sigh a
// step higher; the first half stops on C over B flat, the second peaks on F5 and settles on F.
const THEME = [
  'C5 1.5, Bb4 1.5, G4 1',
  'Ab4 .5, Bb4 .5, C5 .5, Eb5 1, C5 1.5',
  'D5 1.5, C5 1.5, Bb4 1',
  'G4 .5, Ab4 .5, Bb4 .5, D5 1, C5 1.5',
  'C5 1.5, Bb4 1.5, G4 1',
  'Ab4 .5, Bb4 .5, C5 .5, F5 1, Eb5 1.5',
  'Eb5 1.5, D5 1.5, Bb4 1',
  'C5 .5, Bb4 .5, G4 .5, F4 2.5',
]
// Verse 2: its second half climbs to B flat, leading into the refrain.
const THEME_RISE = [...THEME.slice(0, 6), 'G4 .5, Bb4 .5, C5 1.5, D5 1.5', 'Eb5 .5, D5 .5, C5 .5, Bb4 2.5']
// The outro: the sigh falling a step at a time, C-B flat-G, A flat-G-F, onto a low E flat.
const HOME = ['C5 1.5, Bb4 1.5, G4 1', 'Ab4 1.5, G4 1.5, F4 1', 'Eb4 4', 'r 4']

// The refrain: the "OHH" line, bar by bar from its pickup. Long notes spill into the next bar, whose string starts
// with a rest. One stanza: a long C opening up, a bend up through D to E flat, a short F, a bend back to D. Every
// step bends: 180 ms between long notes, 120 ms around the short F. The stanza plays twice, then a third time that
// stops on the first rise to D, into the drop.
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

// Woodblock, one bar each: a clock tick, then ti-ti ta, then straight eighths.
const TICK = 'E5 1, A4 1, E5 1, A4 1'
const BUSY = 'E5 .5, E5 .5, A4 1, E5 .5, E5 .5, A4 1'
const RUN = 'E5 .5, A4 .5, E5 .5, A4 .5, E5 .5, A4 .5, E5 .5, A4 .5'

// Drums as analysed. Its section C, first six bars, then its two-bar groove, its build and its drop.
const KICK_IN = ['................', '........X.......', 'X.....x.........', '..........x.....', 'X.....x.........', 'X..x..x...x..x..']
const SNARE_IN = ['........X.......', '........X.......', '................', '........X.......', 'x.......X.......', 'x.......X.......']
const HAT_IN = ['.xxxxxxx...x.xxx', 'x..x..x....xxxxx', '.......x...xxxxx', 'x..x..x....xxxxx', '.xxxxxxx...xxxxx', 'x..x..x....xxxxx']
const KICK = ['X.....x.........', 'X..x..x...x..x..']
const SNARE = ['x.......X.......', 'x.......X.......']
const HAT = ['.xxxxxxx...xxxxx', 'x..x..x....xxxxx']
const KICK_DROP = ['X..x.........x..']
const CLAP_DROP = ['........X.......']
// The last bar of verse 2: kick on every beat, a snare roll, no hats.
const KICK_FILL = ['X...X...X...X...']
const SNARE_FILL = ['........x.x.xxxX']

// The whole mix goes muffled and opens: twice in the intro, open for the verses, closed through each build and
// snapped open on the drop, muffled for the breakdown, closed again at the end.
const SWEEPS: Sweep[] = [
  { beat: 0, len: 8, from: 700, to: 3700 },
  { beat: 8, len: 8, from: 3700, to: 700 },
  { beat: 16, len: 8, from: 700, to: 2200 },
  { beat: 24, len: 8, from: 2200, to: 700 },
  { beat: 32, len: 4, from: 700, to: 20000 },
  { beat: 33 * 4, len: 3.5, from: 20000, to: 1200 },
  { beat: 33 * 4 + 3.5, len: 0.5, from: 1200, to: 20000 },
  { beat: 50 * 4, len: 4, from: 20000, to: 3000 },
  { beat: 57 * 4, len: 4, from: 3000, to: 20000 },
  { beat: 67 * 4, len: 3.5, from: 20000, to: 1200 },
  { beat: 67 * 4 + 3.5, len: 0.5, from: 1200, to: 20000 },
  { beat: 76 * 4, len: 16, from: 20000, to: 700 },
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

// The piano's left hand: root on beat 1, the fifth above on beat 3, an octave above the chord's bass.
function fifths(out: ScoreNote[], bar: number, names: Chord[], vel: number): void {
  chords(bar, names, (beat, c) => {
    out.push({ beat, len: 2, pitch: up(c[0]), vel, program: GM.piano })
    out.push({ beat: beat + 2, len: 2, pitch: up(c[1]), vel: vel * 0.85, program: GM.piano })
  })
}

// The theme in octaves, for the drops.
function octaves(out: ScoreNote[], bar: number, vel: number, bars: string[]): void {
  line(out, GM.piano, bar, vel, bars)
  line(out, GM.piano, bar, vel * 0.7, bars.map(text => text.replace(/([A-G]b?)(\d)/g, (_, n, o) => `${n}${Number(o) - 1}`)))
}

// The held low E flat under the refrain.
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

function clicks(out: ScoreNote[], bar: number, bars: number, pattern: string, vel: number): void {
  line(out, GM.woodblock, bar, vel, times(bars, [pattern]))
}

function fade(out: ScoreNote[], bar: number, bars: number, pattern: string, from: number, to: number, span: number, at: number): void {
  for (let i = 0; i < bars; i++) clicks(out, bar + i, 1, pattern, from + ((to - from) * (at + i)) / (span - 1))
}

// The line on two voices at once: the clear triangles lead, the buzzier sawtooths under them at 0.45 of the velocity.
function voices(out: ScoreNote[], part: number, bar: number, vel: number, bars: string[]): void {
  sing(out, GM.voiceOoh, part, bar, vel, bars)
  sing(out, GM.synthVoice, part, bar, vel * 0.45, bars)
}

function drums(out: ScoreNote[], bar: number, kick: string[], snare: string[], hat: string[], vel: number): void {
  grid(out, DRUM.kick, bar, vel, kick)
  grid(out, DRUM.snare, bar, vel * 0.75, snare)
  grid(out, DRUM.hat, bar, vel * 0.5, hat)
}

// The refrain from its pickup bar: it lands with an open hat and a low E flat, then the three stanzas and the
// harmony over the held E flat, drums in the groove, and in its last bar the kick stops while hats on every
// sixteenth and a seven-hit snare roll build into the drop.
function refrain(out: ScoreNote[], bar: number): void {
  grid(out, DRUM.openHat, bar + 1, 0.5, ['X...............'])
  out.push({ beat: (bar + 1) * 4, len: 4, pitch: 'Eb1', vel: 0.5, program: GM.synthBass })
  voices(out, 0, bar, 0.55, OHH)
  voices(out, 1, bar + 4, 0.3, THIRD)
  drums(out, bar + 1, times(9, KICK), times(9, SNARE), times(9, HAT), 0.75)
  drums(out, bar + 10, ['................'], ['.........xxxxxxX'], ['........xxxxxxxx'], 0.8)
  pedal(out, bar + 1, 10, 0.3)
}

// Under the second refrain: a low E flat on every kick of the groove, the first of each bar an octave lower,
// and a clap on every beat 3.
function thump(out: ScoreNote[], bar: number, bars: number, vel: number): void {
  times(bars, KICK).forEach((steps, i) =>
    [...steps].forEach((step, j) => {
      if (step === '.') return
      out.push({ beat: (bar + i) * 4 + j / 4, len: 0.5, pitch: j === 0 ? 'Eb1' : 'Eb2', vel: step === 'X' ? vel : vel * 0.8, program: GM.synthBass })
    }),
  )
  grid(out, DRUM.clap, bar, 0.45, times(bars, CLAP_DROP))
}

// A drop: bass on the kick, clap on the snare, woodblock in eighths, the theme in octaves on piano.
function drop(out: ScoreNote[], bar: number, bars: number, vel: number): void {
  const names = times(bars, VERSE)
  grid(out, DRUM.openHat, bar, 0.87, ['X...............'])
  bass(out, bar, names, 0.87)
  drums(out, bar, times(bars, KICK_DROP), times(bars, SNARE), times(bars, HAT), 1.27)
  grid(out, DRUM.clap, bar, 0.79, times(bars, CLAP_DROP))
  clicks(out, bar, bars, RUN, 0.88)
  pad(out, bar, names, 0.51)
  pluck(out, bar, names, 0.48)
  octaves(out, bar, vel, times(bars, THEME))
}

function score(): ScoreNote[] {
  const out: ScoreNote[] = []

  // Intro, bars 1-8: pad and pluck under the two sweeps.
  pad(out, 0, times(8, ['Abadd9'] as Chord[]), 0.28)
  pluck(out, 0, times(8, ['Abadd9'] as Chord[]), 0.36)

  // Verse 1, bars 9-16: the filter opens, the piano theme over its left hand, the woodblock ticking.
  line(out, GM.piano, 8, 0.55, THEME)
  fifths(out, 8, VERSE, 0.3)
  pad(out, 8, VERSE, 0.34)
  pluck(out, 8, VERSE, 0.3)
  bells(out, 12, VERSE.slice(4, 7), 0.2)
  fade(out, 8, 8, TICK, 0.44, 0.88, 16, 0)

  // Verse 2, bars 17-24: the drums come in as analysed, the theme climbs into the refrain. The storm: a noise
  // riser across the last two bars, and in the last bar a fill of kick on every beat and a snare roll.
  line(out, GM.piano, 16, 0.6, THEME_RISE)
  fifths(out, 16, VERSE, 0.32)
  pad(out, 16, VERSE, 0.3)
  pluck(out, 16, VERSE, 0.26)
  fade(out, 16, 8, BUSY, 0.44, 0.88, 16, 8)
  drums(out, 16, [...KICK_IN, KICK[0]], [...SNARE_IN, SNARE[0]], [...HAT_IN, HAT[0]], 0.75)
  drums(out, 23, KICK_FILL, SNARE_FILL, ['................'], 0.8)
  out.push({ beat: 22 * 4, len: 8, pitch: DRUM.riser, vel: 0.45, program: GM.drums })

  // Refrain, bars 25-34, its pickup in bar 24, building into the drop.
  refrain(out, 23)
  pluck(out, 24, times(9, ['Eb5'] as Chord[]), 0.2)

  // Drop, bars 35-50: the 8-bit lead doubles the theme in its second half.
  drop(out, 34, 16, 0.98)
  line(out, GM.squareLead, 42, 0.48, THEME)

  // Breakdown, bars 51-58: the theme alone on piano over held fifths, muffled, the woodblock ticking.
  line(out, GM.piano, 50, 0.5, THEME)
  fifths(out, 50, VERSE, 0.28)
  pad(out, 50, VERSE, 0.26)
  pluck(out, 50, VERSE, 0.26)
  clicks(out, 50, 8, TICK, 0.88)

  // Refrain again, bars 59-68, its pickup in bar 58, fuller: chords and bells, and the low E flat on the kick.
  refrain(out, 57)
  pad(out, 58, VERSE, 0.3)
  bells(out, 62, VERSE.slice(4, 8), 0.2)
  thump(out, 58, 9, 0.5)

  // Drop 2, bars 69-76, with the 8-bit lead from the start.
  drop(out, 68, 8, 1.01)
  line(out, GM.squareLead, 68, 0.48, THEME)

  // Outro, bars 77-80: the answer lands on E flat, the filter closes onto the intro.
  line(out, GM.piano, 76, 0.5, HOME)
  fifths(out, 76, OUTRO, 0.28)
  pad(out, 76, OUTRO, 0.3)
  pluck(out, 76, OUTRO, 0.3)
  clicks(out, 76, 4, TICK, 0.88)

  return out
}

export function startSong5(done: () => void): Stop {
  return playScore({ tempo: TEMPO, beats: BARS * 4, notes: score(), room: ROOM.hall, sweeps: SWEEPS, kit: KIT.standard }, done)
}
