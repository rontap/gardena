import { DOOR } from './building.ts'
import { hash } from './rng.ts'

export const VERY_HARD_MAX = 0.2
export const HARD_MAX = 0.34

const OCTAVES = [
  { freq: 1 / 9, amp: 0.5 },
  { freq: 1 / 4.5, amp: 0.3 },
  { freq: 1 / 2.2, amp: 0.2 },
]

const CONTRAST = 1.9
const BOOST_RADIUS = 16
const BOOST_FALLOFF = 8
const BOOST_MIN = 0.4
const BOOST_SPAN = 0.35
const BOOST_TAIL = Math.exp(-BOOST_RADIUS / BOOST_FALLOFF)

export function goodness(seed: number, col: number, row: number): number {
  const x = col + 0.5
  const y = row + 0.5
  const raw = OCTAVES.reduce((a, o, i) => a + o.amp * valueNoise(seed, i, x * o.freq, y * o.freq), 0)
  const r = Math.hypot(x - (DOOR.col + 0.5), y - (DOOR.row + 0.5))
  const fade = r >= BOOST_RADIUS ? 0 : (Math.exp(-r / BOOST_FALLOFF) - BOOST_TAIL) / (1 - BOOST_TAIL)
  const boost = fade * (BOOST_MIN + BOOST_SPAN * hash(seed, 'soil-boost', col, row))
  const v = 0.5 + (raw - 0.5) * CONTRAST + boost
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function groundOf(g: number): 'soft' | 'hard' | 'very-hard' {
  if (g < VERY_HARD_MAX) return 'very-hard'
  if (g < HARD_MAX) return 'hard'
  return 'soft'
}

function valueNoise(seed: number, oct: number, x: number, y: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = smooth(x - x0)
  const fy = smooth(y - y0)
  const a = hash(seed, 'soil-noise', oct, x0, y0)
  const b = hash(seed, 'soil-noise', oct, x0 + 1, y0)
  const c = hash(seed, 'soil-noise', oct, x0, y0 + 1)
  const d = hash(seed, 'soil-noise', oct, x0 + 1, y0 + 1)
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy)
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
