import type { OnceFn } from '../sound.h.ts'

// Sound effects run on their own browser context, not the music's: `interactive` starts a sound in the frame that
// asked for it, where the music context schedules ahead. A sound builds its nodes when it plays and they end with it,
// so no node runs between sounds.
const ctx = new AudioContext({ latencyHint: 'interactive' })
const out = ctx.createGain()
out.connect(ctx.destination)
const white = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
white.getChannelData(0).forEach((_v, i, a) => {
  a[i] = Math.random() * 2 - 1
})

// One layer of a sound. `at` and `len` are seconds from the start of the sound, `rise` its attack, `vol` its peak gain.
// `hz` moves to `to` over `len`: the filter on white noise, the pitch on a tone. A noise `len` stays under one second.
// `saw` is a sawtooth held at `hz`, detuned by `cents`, through a low-pass at `cut`.
export type Layer =
  | { kind: 'noise'; at: number; len: number; rise: number; vol: number; band: BiquadFilterType; hz: number; to: number; q: number }
  | { kind: 'tone'; at: number; len: number; rise: number; vol: number; wave: OscillatorType; hz: number; to: number }
  | { kind: 'saw'; at: number; len: number; rise: number; vol: number; hz: number; cents: number; cut: number }

export function armEffects(): void {
  void ctx.resume()
}

export function holdEffects(paused: boolean): void {
  if (paused) void ctx.suspend()
  else void ctx.resume()
}

// `gain` multiplies every sound effect: 1 plays them at the levels their layers set.
export function effectsGain(gain: number): void {
  out.gain.value = gain
}

// `x` moved at random by up to `k` of itself either way, so repeated hits do not sound identical.
export function vary(x: number, k: number): number {
  return x * (1 + (Math.random() * 2 - 1) * k)
}

function envelope(t: number, l: Layer): GainNode {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.001, t)
  g.gain.exponentialRampToValueAtTime(l.vol, t + l.rise)
  g.gain.exponentialRampToValueAtTime(0.001, t + l.len)
  g.connect(out)
  return g
}

function source(l: Layer, now: number): AudioScheduledSourceNode {
  const t = now + l.at
  if (l.kind === 'tone') {
    const osc = ctx.createOscillator()
    osc.type = l.wave
    osc.frequency.setValueAtTime(l.hz, t)
    osc.frequency.exponentialRampToValueAtTime(l.to, t + l.len)
    osc.connect(envelope(t, l))
    osc.start(t)
    osc.stop(t + l.len)
    return osc
  }
  if (l.kind === 'saw') {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = l.hz
    osc.detune.value = l.cents
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = l.cut
    osc.connect(f).connect(envelope(t, l))
    osc.start(t)
    osc.stop(t + l.len)
    return osc
  }
  const src = ctx.createBufferSource()
  src.buffer = white
  const f = ctx.createBiquadFilter()
  f.type = l.band
  f.Q.value = l.q
  f.frequency.setValueAtTime(l.hz, t)
  f.frequency.exponentialRampToValueAtTime(l.to, t + l.len)
  src.connect(f).connect(envelope(t, l))
  src.start(t, Math.random() * (white.duration - l.len))
  src.stop(t + l.len)
  return src
}

// `make` runs on each play, so the `vary` inside it gives each play its own values.
export function sfx(make: () => Layer[]): OnceFn {
  return done => {
    const now = ctx.currentTime
    const srcs = make().map(l => source(l, now))
    let left = srcs.length
    srcs.forEach(s => {
      s.onended = () => {
        left -= 1
        if (left === 0) done()
      }
    })
    return () =>
      srcs.forEach(s => {
        s.onended = null
        s.stop()
      })
  }
}
