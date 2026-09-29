import { note, playSong, type Length, type Note } from '../sound.utils.ts'

const MP = 0.42
const MF = 0.7
const OST = ['G4', 'Bb4', 'F4', 'Bb4', 'G4', 'Bb4', 'F4', 'Bb4']
const SIX = ['F5', 'G5', 'Bb5', 'G5']
const FIG = ['G4', 'Bb4', 'F4', 'Bb4']
const BASS_A = [['G2', 'G3'], ['Bb3'], ['Bb2', 'F3'], ['Bb3']]
const BASS_B = [['Eb2', 'Eb3'], ['Bb3'], ['F2', 'F3'], ['Bb3']]

function add(out: Note[], bar: number, quarters: number, notes: string[], len: Length, vel: number): void {
  out.push(note(bar, quarters, notes, len, vel))
}

function eighths(out: Note[], bar: number, seq: string[], vel: number): void {
  seq.forEach((n, i) => add(out, bar, i * 0.5, [n], 0.5, vel))
}

function ostinato(out: Note[], bar: number, vel: number): void {
  eighths(out, bar, OST, vel)
  add(out, bar, 0, ['G2', 'G3'], 2, vel)
  add(out, bar, 2, ['Bb2', 'Bb3'], 2, vel)
  eighths(out, bar + 1, OST, vel)
  add(out, bar + 1, 0, ['Eb2', 'Eb3'], 2, vel)
  add(out, bar + 1, 2, ['F2', 'F3'], 2, vel)
}

function level(v: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map(() => v)
}

function quarters(out: Note[], bar: number, vel: number[]): void {
  FIG.forEach((n, i) => add(out, bar, i, [n], 1, vel[i]))
  FIG.forEach((n, i) => add(out, bar + 1, i, [n], 1, vel[4 + i]))
  ;[0, 1, 2, 3].forEach(i => {
    add(out, bar, i + 0.5, ['G2'], 0.25, vel[i] * 0.55)
    add(out, bar + 1, i + 0.5, ['G2'], 0.25, vel[4 + i] * 0.55)
  })
  add(out, bar, 0, ['G2', 'G3'], 2, vel[0])
  add(out, bar, 2, ['Bb2', 'Bb3'], 2, vel[2])
  add(out, bar + 1, 0, ['Eb2', 'G2', 'Eb3'], 2, vel[4])
  add(out, bar + 1, 2, ['F2', 'F3'], 2, vel[6])
}

function cell(
  out: Note[],
  bar: number,
  head: string[],
  tail: string[],
  chords: string[][],
  vel: number,
  holdLast: boolean,
): void {
  head.forEach((n, i) => add(out, bar, i * 0.5, [n], 0.5, vel))
  SIX.forEach((n, i) => add(out, bar, 0.5 + i * 0.25, [n], 0.25, vel))
  tail.forEach((n, i) => add(out, bar, 1.5 + i * 0.5, [n], i === tail.length - 1 && holdLast ? 1 : 0.5, vel))
  chords.forEach((notes, i) => add(out, bar, i, notes, 1, vel * 0.85))
}

function score(): Note[] {
  const out: Note[] = []
  ostinato(out, 0, MP)
  ostinato(out, 2, MP)
  ;[0, 1, 2, 3].forEach(i => quarters(out, 4 + i * 2, level(MF)))
  cell(out, 12, [], ['D6', 'C6', 'Bb5', 'C6', 'Bb5'], BASS_A, MF, true)
  cell(out, 13, [], ['D6', 'C6', 'Bb5', 'C6', 'G5'], BASS_B, MF, false)
  cell(out, 14, ['G5'], ['D6', 'C6', 'Bb5', 'C6', 'Bb5'], BASS_A, MF, false)
  cell(out, 15, ['Bb5'], ['D6', 'C6', 'Bb5', 'C6', 'G5'], BASS_B, MF, false)
  ostinato(out, 16, MF)
  ostinato(out, 18, 0.55)
  quarters(out, 20, level(MF))
  quarters(out, 22, [0.7, 0.46, 0.28, 0.14, 0.14, 0.38, 0.62, 0.88])
  return out
}

export function startSong1(done: () => void): () => void {
  return playSong({ bpm: 63, bars: 24, notes: score() }, done)
}
