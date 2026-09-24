import type { Stop } from '../sound.h.ts'
import { DRUM, GM, KIT, ROOM, playScore, type ScoreNote, type Sweep, type Tempo } from '../sound.utils.ts'
import { grid, line } from './score.ts'

const BARS = 71
const TEMPO: Tempo = { bpm: 92, slow: [] }

const SWEEPS: Sweep[] = [
  { beat: 0, len: 108, from: 205, to: 1755 },
  { beat: 108, len: 48, from: 1755, to: 10000 },
  { beat: 59 * 4, len: 32, from: 10000, to: 3300 },
  { beat: 67 * 4, len: 16, from: 3300, to: 205 },
]

const LOOP = 'B3 .5, F#4 .5, A3 .5, D5 .5, A3 .5, C#5 .5, F#3 .5, B4 .5'
const LOOP_OCTAVE = 'B4 .5, F#3 .5, A4 .5, D4 .5, A4 .5, C#4 .5, F#4 .5, B3 .5'

const KICK = 'X...X...X...X...'
const SOFT_KICK = 'x...x...x...x...'
const NO_KICK = '................'
const CLAP = '....X.......X...'
const HAT = 'x...X..xx...X...'
const HAT_FULL = 'xx..X..xx...X...'
const HAT_TURN = 'xx..X...xx..X...'
const OPEN = '..x...x...X...x.'
const OPEN_FULL = '..X...x...X...x.'
const OPEN_TURN = '..X...X...X...X.'

function pump(a: string, b: string): string {
  return `r .5, ${a} .5, r .25, ${a} .75, r .5, ${b} .5, r .25, ${b} .75`
}

const B = pump('B1', 'B1')
const BD = pump('B1', 'D2')
const GD = pump('G2', 'D2')
const PHRASE = [B, B, BD, B, B, B, GD, B, B, B, BD, B, B, B]

const ROOT = {
  B: { bass: GM.sawBass, note: 'B1', vel: 0.45, hat: HAT, open: OPEN_FULL },
  G: { bass: GM.synthBass, note: 'G2', vel: 1, hat: HAT_TURN, open: OPEN_TURN },
  A: { bass: GM.synthBass, note: 'A2', vel: 1, hat: HAT_TURN, open: OPEN_TURN },
} as const
const CYCLE = ['B', 'B', 'B', 'B', 'G', 'G', 'A', 'A'] as const

const FADE_IN = [0.13, 0.31, 0.64, 1]
const FADE_OUT = [1, 0.66, 0.4, 0.18]

function times<T>(n: number, cycle: T[]): T[] {
  return Array.from({ length: n }, (_, i) => cycle[i % cycle.length])
}

function scaled(vels: number[], k: number): number[] {
  return vels.map(v => v * k)
}

function loop(out: ScoreNote[], bar: number, vels: number[]): void {
  vels.forEach((vel, i) => {
    line(out, GM.warmPad, bar + i, vel, [LOOP])
    line(out, GM.warmPad, bar + i, vel * 0.6, [LOOP_OCTAVE])
  })
}

function drop(out: ScoreNote[], bar: number, last: string, lead: number[]): void {
  CYCLE.forEach((name, i) => {
    const root = ROOT[name]
    line(out, root.bass, bar + i, root.vel, [pump(root.note, root.note)])
    line(out, GM.sawLead, bar + i, lead[i], [pump(`${name}2`, `${name}2`)])
    grid(out, DRUM.hat, bar + i, 0.45, [root.hat])
    grid(out, DRUM.openHat, bar + i, 0.45, [root.open])
  })
  grid(out, DRUM.kick, bar, 0.9, [...times(7, [KICK]), last])
  grid(out, DRUM.clap, bar, 0.35, times(8, [CLAP]))
}

function score(): ScoreNote[] {
  const out: ScoreNote[] = []

  loop(out, 0, [...scaled(FADE_IN, 0.28), ...times(63, [0.4]), ...scaled(FADE_OUT, 0.4)])

  FADE_IN.forEach((f, i) => {
    grid(out, DRUM.kick, i, 0.9 * f, [KICK])
    line(out, GM.sawBass, i, 0.45 * f, [PHRASE[i]])
  })
  grid(out, DRUM.kick, 4, 0.9, [...times(22, [KICK]), 'X...X..xX...X..x', ...times(15, [KICK])])
  grid(out, DRUM.clap, 11, 0.35, times(31, [CLAP]))
  line(out, GM.sawBass, 4, 0.45, PHRASE.slice(4))
  line(out, GM.sawBass, 14, 0.45, PHRASE.slice(0, 10))
  line(out, GM.sawBass, 28, 0.45, PHRASE)
  grid(out, DRUM.hat, 27, 0.5, ['x...x...x...x...', ...times(8, [HAT]), ...times(6, [HAT_FULL])])
  grid(out, DRUM.openHat, 28, 0.5, [...times(8, [OPEN]), ...times(5, [OPEN_FULL]), 'X.....x...X...x.'])
  out.push({ beat: 41 * 4 + 1, len: 9, pitch: DRUM.riser, vel: 0.45, program: GM.drums })

  grid(out, DRUM.kick, 42, 0.9, ['........x...x...'])
  grid(out, DRUM.clap, 42, 0.35, [CLAP])
  grid(out, DRUM.hat, 42, 0.45, [HAT_FULL])
  grid(out, DRUM.openHat, 42, 0.45, [OPEN_TURN])
  line(out, GM.synthBass, 42, 1, [GD])
  line(out, GM.sawLead, 42, 0.2, [pump('G2', 'D2')])

  drop(out, 43, SOFT_KICK, [0.35, ...times(7, [0.5])])
  drop(out, 51, SOFT_KICK, times(8, [0.5]))
  drop(out, 59, NO_KICK, times(8, [0.5]))

  FADE_OUT.forEach((f, i) => {
    grid(out, DRUM.kick, 67 + i, 0.75 * f, [KICK])
    grid(out, DRUM.hat, 67 + i, 0.3 * f, ['x...X...x...x...'])
    line(out, GM.sawBass, 67 + i, 0.45 * f, [B])
  })
  grid(out, DRUM.openHat, 67, 0.3, ['X.............x.'])
  grid(out, DRUM.clap, 67, 0.3, [CLAP])

  return out
}

export function startSong7(): Stop {
  return playScore({ tempo: TEMPO, beats: BARS * 4, notes: score(), room: ROOM.hall, sweeps: SWEEPS, kit: KIT.deep })
}
