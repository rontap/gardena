import { GM, type Bend, type ScoreNote } from '../sound.utils.ts'

// One string per 4/4 bar: `pitch beats`, `r` is a rest. Beats may be a fraction: `1/3` is one note of a triplet.
function notes(bar: number, bars: string[], add: (beat: number, len: number, pitch: string, marks: string[]) => void): void {
  bars.forEach((text, i) => {
    let beat = (bar + i) * 4
    text.split(',').forEach(token => {
      const [pitch, len, ...marks] = token.trim().split(' ')
      const [num, den = '1'] = len.split('/')
      const beats = Number(num) / Number(den)
      if (pitch !== 'r') add(beat, beats, pitch, marks)
      beat += beats
    })
  })
}

export function line(out: ScoreNote[], program: number, bar: number, vel: number, bars: string[]): void {
  notes(bar, bars, (beat, len, pitch) => out.push({ beat, len, pitch, vel, program }))
}

// A melody that bends, on solo voice `part` of the instrument. After the length a note may carry marks, in cents
// and milliseconds: `g60` glides 60 ms from the note before, `s-100:80` starts 100 cents flat and reaches the pitch
// in 80 ms, `f-200:150` falls 200 cents over the last 150 ms. `C5 1 g40 s-50:60` carries two.
export function sing(out: ScoreNote[], program: number, part: number, bar: number, vel: number, bars: string[]): void {
  notes(bar, bars, (beat, len, pitch, marks) => out.push({ beat, len, pitch, vel, program, bend: bend(part, marks) }))
}

// A drum part, one `DRUM` per call: one string per 4/4 bar of 16 sixteenths. `X` is a hit at `vel`, `x` a hit at
// 0.6 of it, `.` nothing. `X..x..x...x..x..` is a kick on 1, 4, 7, 11 and 14.
export function grid(out: ScoreNote[], drum: string, bar: number, vel: number, bars: string[]): void {
  bars.forEach((steps, i) =>
    [...steps].forEach((step, j) => {
      if (step === '.') return
      out.push({ beat: (bar + i) * 4 + j / 4, len: 0.25, pitch: drum, vel: step === 'X' ? vel : vel * 0.6, program: GM.drums })
    }),
  )
}

function bend(part: number, marks: string[]): Bend {
  const b: Bend = { part, glide: 0, scoop: 0, scoopMs: 0, fall: 0, fallMs: 0 }
  marks.forEach(mark => {
    const [cents, ms = '0'] = mark.slice(1).split(':')
    if (mark[0] === 'g') b.glide = Number(cents)
    if (mark[0] === 's') {
      b.scoop = Number(cents)
      b.scoopMs = Number(ms)
    }
    if (mark[0] === 'f') {
      b.fall = Number(cents)
      b.fallMs = Number(ms)
    }
  })
  return b
}
