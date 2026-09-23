import type { ScoreNote } from '../sound.utils.ts'

// One string per 4/4 bar: `pitch beats`, `r` is a rest. Beats may be a fraction: `1/3` is one note of a triplet.
export function line(out: ScoreNote[], program: number, bar: number, vel: number, bars: string[]): void {
  bars.forEach((text, i) => {
    let beat = (bar + i) * 4
    text.split(',').forEach(token => {
      const [pitch, len] = token.trim().split(' ')
      const [num, den = '1'] = len.split('/')
      const beats = Number(num) / Number(den)
      if (pitch !== 'r') out.push({ beat, len: beats, pitch, vel, program })
      beat += beats
    })
  })
}
