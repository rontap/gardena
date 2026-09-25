import type { Stop } from '../sound.h.ts'
import { DRUM, GM, KIT, ROOM, playScore, type ScoreNote, type Sweep, type Tempo } from '../sound.utils.ts'
import { grid, line } from './score.ts'

const TEMPO: Tempo = { bpm: 90, slow: [] }

const SWEEPS: Sweep[] = [
  { beat: 0, len: 108, from: 205, to: 1755 },
  { beat: 108, len: 48, from: 1755, to: 10000 },
  { beat: 51 * 4, len: 15.5, from: 10000, to: 1500 },
  { beat: 51 * 4 + 15.5, len: 0.5, from: 1500, to: 10000 },
  { beat: 59 * 4, len: 16, from: 10000, to: 3300 },
  { beat: 63 * 4, len: 16, from: 3300, to: 205 },
]

const LOOP = 'B3 .5, F#4 .5, A3 .5, D5 .5, A3 .5, C#5 .5, F#3 .5, B4 .5'
const LOOP_OCTAVE = 'B4 .5, F#3 .5, A4 .5, D4 .5, A4 .5, C#4 .5, F#4 .5, B3 .5'
const LOOP_HINT = 'B3 .5, F#4 .5, A3 .5, D5 .5, r 2'
const LOOP_HINT_OCTAVE = 'B4 .5, F#3 .5, A4 .5, D4 .5, r 2'

const THEME = [
  'r .5, F#4 .5, B4 1.5, r .5, A4 .5, B4 .5, C#5 1.5',
  'r 1.5, B4 .5, F#4 2',
  'r .5, F#4 .5, B4 1.5, r .5, A4 .5, B4 .5, E5 1.5',
  'r 1.5, D5 .5, C#5 .5, B4 1.5',
  'r .5, D5 .5, B4 1.5, r .5, G4 .5, A4 .5, B4 1.5',
  'r 1.5, A4 .5, G4 .5, D4 1.5',
  'r .5, E4 .5, A4 1.5, r .5, C#5 .5, D5 .5, E5 1.5',
  'r 1.5, C#5 2.5',
]
const STABS = [
  { bar: 0, beats: [3.5], notes: ['B3', 'D4', 'G4'], vel: 0.35 },
  { bar: 1, beats: [1.5, 3.5], notes: ['D4', 'G4', 'B4'], vel: 0.4 },
  { bar: 2, beats: [1.5, 2.5, 3.5], notes: ['E4', 'A4', 'C#5'], vel: 0.47 },
]
const FALL = [
  { beat: 0.5, notes: ['A4', 'C#5', 'E5'] },
  { beat: 1.5, notes: ['F#4', 'A4', 'D5'] },
  { beat: 2.5, notes: ['E4', 'A4', 'C#5'] },
  { beat: 3.5, notes: ['E4', 'A4', 'C#5'] },
]
const SCALE = ['C#', 'D', 'E', 'F#', 'G', 'A', 'B']

const KICK = 'X...X...X...X...'
const HALF_KICK = 'X...X...X.....x.'
const BREAK_KICK = 'X.....X.........'
const CLAP = '....X.......X...'
const HALF_CLAP = '....x.......x...'
const BREAK_CLAP = '........X.......'
const HAT = 'x...X..xx...X...'
const HAT_FULL = 'xx..X..xx...X...'
const HAT_TURN = 'xx..X...xx..X...'
const EIGHTH_HAT = 'x.x.x.x.x.x.x.x.'
const NO_HAT = '................'
const OPEN = '..x...x...X...x.'
const OPEN_FULL = '..X...x...X...x.'
const OPEN_TURN = '..X...X...X...X.'
const BREAK_OPEN = '..X.......X.....'

function pump(a: string, b: string): string {
  return `r .5, ${a} .5, r .25, ${a} .75, r .5, ${b} .5, r .25, ${b} .75`
}

function halfPump(note: string): string {
  return `r .5, ${note} .5, r .25, ${note} .75, r .5, ${note} 1.5`
}

function gap(note: string): string {
  return `r .5, ${note} 1, r .5, ${note} 1.5, r .5`
}

const B = pump('B1', 'B1')
const BD = pump('B1', 'D2')
const GD = pump('G2', 'D2')
const PHRASE = [B, B, BD, B, B, B, GD, B, B, B, BD, B, B, B]

const ROOT = {
  B: { bass: GM.sawBass, note: 'B1', vel: 0.38, hat: HAT, open: OPEN_FULL, chord: ['B2', 'F#3', 'A3', 'D4'] },
  G: { bass: GM.synthBass, note: 'G2', vel: 0.84, hat: HAT_TURN, open: OPEN_TURN, chord: ['G2', 'D3', 'F#3', 'B3'] },
  A: { bass: GM.synthBass, note: 'A2', vel: 0.84, hat: HAT_TURN, open: OPEN_TURN, chord: ['A2', 'E3', 'A3', 'C#4'] },
} as const
type Root = keyof typeof ROOT
const CYCLE: Root[] = ['B', 'B', 'B', 'B', 'G', 'G', 'A', 'A']
const RISE: Root[] = ['G', 'G', 'A', 'A']

const FADE_IN = [0.13, 0.31, 0.64, 1]
const FADE_OUT = [1, 0.66, 0.4, 0.18]

function times<T>(n: number, cycle: T[]): T[] {
  return Array.from({ length: n }, (_, i) => cycle[i % cycle.length])
}

function scaled(vels: number[], k: number): number[] {
  return vels.map(v => v * k)
}

function third(text: string): string {
  return text.replace(/([A-G]#?)(\d)/g, (_, name: string, octave: string) => {
    const i = SCALE.indexOf(name) - 2
    return i < 0 ? `${SCALE[i + 7]}${Number(octave) - 1}` : `${SCALE[i]}${octave}`
  })
}

function loop(out: ScoreNote[], bar: number, vels: number[]): void {
  vels.forEach((vel, i) => {
    line(out, GM.warmPad, bar + i, vel, [LOOP])
    line(out, GM.warmPad, bar + i, vel * 0.6, [LOOP_OCTAVE])
  })
}

function pad(out: ScoreNote[], bar: number, names: Root[]): void {
  names.forEach((name, i) => ROOT[name].chord.forEach(pitch => out.push({ beat: (bar + i) * 4, len: 4, pitch, vel: 0.3, program: GM.warmPad })))
}

function roll(out: ScoreNote[], beat: number, notes: string[], len: number, vel: number): void {
  notes.forEach((pitch, j) => out.push({ beat: beat + j * 0.06, len: len - j * 0.06, pitch, vel, program: GM.rhodes }))
}

function groove(out: ScoreNote[], bar: number, names: Root[]): void {
  names.forEach((name, i) => {
    const root = ROOT[name]
    line(out, root.bass, bar + i, root.vel, [pump(root.note, root.note)])
    grid(out, DRUM.hat, bar + i, 0.38, [root.hat])
    grid(out, DRUM.openHat, bar + i, 0.38, [root.open])
  })
  grid(out, DRUM.kick, bar, 0.76, times(names.length, [KICK]))
  grid(out, DRUM.clap, bar, 0.3, times(names.length, [CLAP]))
}

function rise(out: ScoreNote[]): void {
  loop(out, 0, [...scaled(FADE_IN, 0.33), ...times(39, [0.48])])
  FADE_IN.forEach((f, i) => {
    grid(out, DRUM.kick, i, 0.76 * f, [KICK])
    line(out, GM.sawBass, i, 0.38 * f, [PHRASE[i]])
  })
  grid(out, DRUM.kick, 4, 0.76, [...times(22, [KICK]), 'X...X..xX...X..x', ...times(15, [KICK])])
  grid(out, DRUM.clap, 11, 0.3, times(31, [CLAP]))
  line(out, GM.sawBass, 4, 0.38, PHRASE.slice(4))
  line(out, GM.sawBass, 14, 0.38, PHRASE.slice(0, 10))
  line(out, GM.sawBass, 28, 0.38, PHRASE)
  grid(out, DRUM.hat, 27, 0.42, ['x...x...x...x...', ...times(8, [HAT]), ...times(6, [HAT_FULL])])
  grid(out, DRUM.openHat, 28, 0.42, [...times(8, [OPEN]), ...times(5, [OPEN_FULL]), 'X.....x...X...x.'])
  out.push({ beat: 41 * 4 + 1, len: 9, pitch: DRUM.riser, vel: 0.45, program: GM.drums })

  grid(out, DRUM.kick, 42, 0.76, ['........x...x...'])
  grid(out, DRUM.clap, 42, 0.3, [CLAP])
  grid(out, DRUM.hat, 42, 0.38, [HAT_FULL])
  grid(out, DRUM.openHat, 42, 0.38, [OPEN_TURN])
  line(out, GM.synthBass, 42, 0.84, [GD])
  line(out, GM.sawLead, 42, 0.2, [pump('G2', 'D2')])
}

function outro(out: ScoreNote[], bar: number): void {
  loop(out, bar, scaled(FADE_OUT, 0.48))
  FADE_OUT.forEach((f, i) => {
    grid(out, DRUM.kick, bar + i, 0.63 * f, [KICK])
    grid(out, DRUM.hat, bar + i, 0.25 * f, ['x...X...x...x...'])
    line(out, GM.sawBass, bar + i, 0.38 * f, [B])
  })
  grid(out, DRUM.openHat, bar, 0.25, ['X.............x.'])
  grid(out, DRUM.clap, bar, 0.25, [CLAP])
}

function half(out: ScoreNote[], bar: number): void {
  CYCLE.forEach((name, i) => {
    const root = ROOT[name]
    line(out, root.bass, bar + i, root.vel, [halfPump(root.note)])
    grid(out, DRUM.hat, bar + i, 0.3, [root.hat])
  })
  grid(out, DRUM.kick, bar, 0.7, times(8, [HALF_KICK]))
  grid(out, DRUM.clap, bar, 0.3, times(8, [HALF_CLAP]))
  grid(out, DRUM.openHat, bar, 0.34, times(8, [BREAK_OPEN]))
  line(out, GM.warmPad, bar, 0.3, times(8, [LOOP]))
}

function broken(out: ScoreNote[], bar: number): void {
  CYCLE.forEach((name, i) => line(out, ROOT[name].bass, bar + i, ROOT[name].vel, [gap(ROOT[name].note)]))
  pad(out, bar, CYCLE)
  grid(out, DRUM.kick, bar, 0.76, times(8, [BREAK_KICK]))
  grid(out, DRUM.clap, bar, 0.3, times(8, [BREAK_CLAP]))
  grid(out, DRUM.openHat, bar, 0.38, times(8, [BREAK_OPEN]))
  grid(out, DRUM.hat, bar, 0.3, [...times(4, [NO_HAT]), ...times(4, [EIGHTH_HAT])])
}

function build(out: ScoreNote[], bar: number): void {
  line(out, GM.synthBass, bar, 0.84, [gap('G2'), pump('G2', 'G2'), pump('A2', 'A2'), pump('A2', 'A2')])
  pad(out, bar, RISE)
  grid(out, DRUM.kick, bar, 0.76, [BREAK_KICK, KICK, KICK, 'X...X...X.......'])
  grid(out, DRUM.clap, bar, 0.34, ['........X.......', 'X...X...X...X...', 'X.X.X.X.X.X.X.X.', 'xxxxxxxxXXXXXXXX'])
  grid(out, DRUM.hat, bar, 0.34, [EIGHTH_HAT, HAT_TURN, HAT_TURN, 'xxxxxxxxxxxxxxxx'])
  grid(out, DRUM.openHat, bar, 0.34, [BREAK_OPEN, OPEN_TURN, OPEN_TURN, NO_HAT])
  out.push({ beat: bar * 4, len: 16, pitch: DRUM.riser, vel: 0.5, program: GM.drums })
  STABS.forEach(s => s.beats.forEach(at => roll(out, (bar + s.bar) * 4 + at, s.notes, 0.5, s.vel)))
  FALL.forEach(s => roll(out, (bar + 3) * 4 + s.beat, s.notes, 0.5, 0.55))
  line(out, GM.warmPad, bar + 2, 0.2, [LOOP_HINT, LOOP_HINT])
  line(out, GM.warmPad, bar + 2, 0.12, [LOOP_HINT_OCTAVE, LOOP_HINT_OCTAVE])
}

function bridge(): ScoreNote[] {
  const out: ScoreNote[] = []
  rise(out)
  broken(out, 43)
  line(out, GM.rhodes, 43, 0.55, THEME)
  line(out, GM.rhodes, 47, 0.33, THEME.slice(4).map(third))
  build(out, 51)
  groove(out, 55, CYCLE)
  loop(out, 55, times(8, [0.48]))
  roll(out, 55 * 4, ['B3', 'D4', 'F#4', 'B4'], 4, 0.55)
  line(out, GM.rhodes, 57, 0.35, ['r .5, F#4 .5, B4 3'])
  roll(out, 59 * 4, ['B3', 'D4', 'G4'], 4, 0.35)
  roll(out, 61 * 4, ['C#4', 'E4', 'A4'], 4, 0.35)
  outro(out, 63)
  return out
}

export function startSong7(): Stop {
  return playScore({ tempo: TEMPO, beats: 67 * 4, notes: refrain(), room: ROOM.hall, sweeps: SWEEPS, kit: KIT.deep })
}

export function startSong7b(): Stop {
  return playScore({ tempo: TEMPO, beats: 67 * 4, notes: bridge(), room: ROOM.hall, sweeps: SWEEPS, kit: KIT.deep })
}
