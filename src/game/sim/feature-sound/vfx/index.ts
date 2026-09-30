import type { Cell } from '../../plot.ts'
import type { Intent } from '../../world.h.ts'
import type { OnceFn, OpenBuilding, SoundCue } from '../sound.h.ts'
import { sfx, vary, type Layer } from './sfx.ts'

// The sound of a job while it runs: `play` at its start and again after each `every` seconds of work, so a longer
// job plays more hits, never slower ones. `Infinity` plays once, at the start. `cell` is the job's target.
export type Hit = { every: number; play: (cell: Cell) => OnceFn }

// `n` grains of soil: short noise at a random pitch around `hz`, each at a random time within `span` s after `from`.
function crumbs(n: number, from: number, span: number, hz: number, vol: number): Layer[] {
  return Array.from({ length: n }, () => {
    const f = vary(hz, 0.35)
    return { kind: 'noise', at: from + Math.random() * span, len: vary(0.03, 0.3), rise: 0.002, vol: vary(vol, 0.4), band: 'bandpass', hz: f, to: f * 0.8, q: 2 }
  })
}

// The blade into soil, a low thump, and grains falling: noise only, with a quiet low sine under the thump for weight.
// Each hit starts up to 40 ms late, so hits at a fixed `every` do not land on an exact beat.
function dig(cell: Cell): Layer[] {
  const d = Math.random() * 0.04
  if (cell.kind === 'untilled' && cell.cover.kind === 'burrow') {
    return [
      { kind: 'noise', at: d, len: 0.2, rise: 0.015, vol: 0.3, band: 'lowpass', hz: vary(600, 0.15), to: 250, q: 0.5 },
      { kind: 'noise', at: d, len: 0.16, rise: 0.008, vol: 0.4, band: 'lowpass', hz: 220, to: 110, q: 1.2 },
      ...crumbs(3, d + 0.03, 0.12, 1200, 0.1),
    ]
  }
  // Harder soil: a brighter, shorter hit, more grains, and a stone scrape from `hardness` 0.5.
  const h = cell.kind === 'untilled' ? cell.hardness : 0
  const body = vary(1100 + 900 * h, 0.12)
  const hit: Layer[] = [
    { kind: 'noise', at: d, len: 0.15 - 0.04 * h, rise: 0.01, vol: 0.35, band: 'lowpass', hz: body, to: body * 0.4, q: 0.6 },
    { kind: 'noise', at: d, len: 0.1, rise: 0.006, vol: 0.4, band: 'lowpass', hz: vary(260, 0.15), to: 120, q: 1.2 },
    { kind: 'tone', at: d, len: 0.07, rise: 0.006, vol: 0.07, wave: 'sine', hz: vary(90, 0.15), to: 55 },
    ...crumbs(3 + Math.round(2 * h), d + 0.02, 0.1, 1800 + 1500 * h, 0.13),
  ]
  if (h < 0.5) return hit
  const scrape = vary(3200, 0.1)
  return [...hit, { kind: 'noise', at: d, len: 0.025, rise: 0.001, vol: 0.2 * h, band: 'bandpass', hz: scrape, to: scrape * 0.9, q: 5 }]
}

const turn = (): Layer[] => [
  { kind: 'noise', at: 0, len: 0.32, rise: 0.03, vol: 0.35, band: 'lowpass', hz: 900, to: 250, q: 0.6 },
  { kind: 'noise', at: 0.05, len: 0.2, rise: 0.008, vol: 0.4, band: 'lowpass', hz: 200, to: 100, q: 1.2 },
  { kind: 'tone', at: 0.05, len: 0.08, rise: 0.006, vol: 0.07, wave: 'sine', hz: vary(70, 0.15), to: 45 },
  ...crumbs(5, 0.1, 0.25, 1500, 0.1),
]

const pick = (): Layer[] => [
  { kind: 'tone', at: 0, len: 0.08, rise: 0.002, vol: 0.18, wave: 'triangle', hz: vary(1800, 0.06), to: 1500 },
  { kind: 'tone', at: 0, len: 0.05, rise: 0.002, vol: 0.08, wave: 'sine', hz: vary(2900, 0.06), to: 2700 },
  { kind: 'noise', at: 0, len: 0.06, rise: 0.002, vol: 0.25, band: 'highpass', hz: 2500, to: 2500, q: 0.7 },
  { kind: 'tone', at: 0, len: 0.08, rise: 0.004, vol: 0.25, wave: 'sine', hz: 140, to: 70 },
]

const rockBreak = (): Layer[] => [
  { kind: 'noise', at: 0, len: 0.35, rise: 0.004, vol: 0.4, band: 'bandpass', hz: 1200, to: 400, q: 0.9 },
  { kind: 'tone', at: 0, len: 0.25, rise: 0.004, vol: 0.4, wave: 'sine', hz: 80, to: 40 },
  { kind: 'noise', at: 0.1, len: 0.06, rise: 0.002, vol: 0.2, band: 'bandpass', hz: vary(2200, 0.1), to: 1800, q: 2 },
  { kind: 'noise', at: 0.18, len: 0.05, rise: 0.002, vol: 0.15, band: 'bandpass', hz: vary(1800, 0.1), to: 1500, q: 2 },
]

const knock = (): Layer[] => [
  { kind: 'tone', at: 0, len: 0.1, rise: 0.003, vol: 0.4, wave: 'sine', hz: vary(220, 0.06), to: 160 },
  { kind: 'tone', at: 0, len: 0.06, rise: 0.002, vol: 0.15, wave: 'triangle', hz: vary(520, 0.06), to: 420 },
  { kind: 'noise', at: 0, len: 0.05, rise: 0.002, vol: 0.3, band: 'bandpass', hz: 1400, to: 1200, q: 2 },
]

const trunkFall = (): Layer[] => [
  { kind: 'noise', at: 0, len: 0.08, rise: 0.002, vol: 0.4, band: 'highpass', hz: 1800, to: 1800, q: 0.7 },
  { kind: 'noise', at: 0.05, len: 0.4, rise: 0.01, vol: 0.25, band: 'bandpass', hz: 900, to: 300, q: 1 },
  { kind: 'tone', at: 0.25, len: 0.35, rise: 0.004, vol: 0.5, wave: 'sine', hz: 70, to: 40 },
]

const pour = (): Layer[] => [
  { kind: 'noise', at: 0, len: 0.4, rise: 0.08, vol: 0.2, band: 'bandpass', hz: 900, to: 1800, q: 0.8 },
  { kind: 'noise', at: 0, len: 0.35, rise: 0.06, vol: 0.15, band: 'lowpass', hz: 500, to: 400, q: 0.7 },
  { kind: 'tone', at: vary(0.12, 0.2), len: 0.04, rise: 0.003, vol: 0.06, wave: 'sine', hz: vary(1200, 0.1), to: 1800 },
  { kind: 'tone', at: vary(0.22, 0.15), len: 0.04, rise: 0.003, vol: 0.06, wave: 'sine', hz: vary(1300, 0.1), to: 1900 },
  { kind: 'tone', at: vary(0.31, 0.1), len: 0.04, rise: 0.003, vol: 0.05, wave: 'sine', hz: vary(1100, 0.1), to: 1700 },
]

const soak = (): Layer[] => [{ kind: 'noise', at: 0, len: 0.25, rise: 0.02, vol: 0.12, band: 'lowpass', hz: 400, to: 150, q: 0.7 }]

// A bag of fertilizer or compost: thicker and lower than water, with a gulp on each rise.
const pourBag = (): Layer[] => [
  { kind: 'noise', at: 0, len: 0.6, rise: 0.1, vol: 0.2, band: 'bandpass', hz: 500, to: 900, q: 0.9 },
  { kind: 'tone', at: 0.1, len: 0.07, rise: 0.005, vol: 0.1, wave: 'sine', hz: vary(300, 0.1), to: 420 },
  { kind: 'tone', at: 0.3, len: 0.07, rise: 0.005, vol: 0.1, wave: 'sine', hz: vary(320, 0.1), to: 440 },
  { kind: 'tone', at: 0.45, len: 0.07, rise: 0.005, vol: 0.08, wave: 'sine', hz: vary(280, 0.1), to: 400 },
]

const rustle = (): Layer[] => [
  { kind: 'noise', at: 0, len: 0.18, rise: 0.03, vol: 0.12, band: 'highpass', hz: 3500, to: 3500, q: 0.7 },
  { kind: 'noise', at: 0.1, len: 0.12, rise: 0.02, vol: 0.08, band: 'bandpass', hz: vary(2200, 0.1), to: 2600, q: 1 },
]

const pluck = (): Layer[] => [
  { kind: 'tone', at: 0, len: 0.07, rise: 0.002, vol: 0.3, wave: 'sine', hz: vary(900, 0.08), to: 300 },
  { kind: 'noise', at: 0, len: 0.03, rise: 0.002, vol: 0.1, band: 'bandpass', hz: 2500, to: 2500, q: 1.5 },
]

// Every machine: the lid opens, the item drops in, the lid shuts. One sound for all of them.
const load = (): Layer[] => [
  { kind: 'tone', at: 0, len: 0.08, rise: 0.01, vol: 0.08, wave: 'triangle', hz: 300, to: 520 },
  { kind: 'noise', at: 0, len: 0.03, rise: 0.002, vol: 0.2, band: 'bandpass', hz: 2500, to: 2500, q: 3 },
  { kind: 'tone', at: 0.15, len: 0.1, rise: 0.004, vol: 0.3, wave: 'sine', hz: vary(160, 0.06), to: 90 },
  { kind: 'noise', at: 0.15, len: 0.08, rise: 0.004, vol: 0.2, band: 'lowpass', hz: 800, to: 600, q: 0.7 },
  { kind: 'tone', at: 0.3, len: 0.08, rise: 0.003, vol: 0.35, wave: 'sine', hz: 200, to: 130 },
  { kind: 'noise', at: 0.3, len: 0.04, rise: 0.002, vol: 0.3, band: 'bandpass', hz: 1800, to: 1800, q: 2 },
]

const lidOpen = (): Layer[] => [
  { kind: 'tone', at: 0, len: 0.25, rise: 0.05, vol: 0.06, wave: 'triangle', hz: vary(180, 0.05), to: 340 },
  { kind: 'tone', at: 0.2, len: 0.08, rise: 0.003, vol: 0.25, wave: 'sine', hz: 240, to: 180 },
  { kind: 'noise', at: 0.2, len: 0.04, rise: 0.002, vol: 0.15, band: 'bandpass', hz: 1600, to: 1600, q: 2 },
]

const lidShut = (): Layer[] => [
  { kind: 'tone', at: 0, len: 0.12, rise: 0.003, vol: 0.4, wave: 'sine', hz: vary(170, 0.04), to: 110 },
  { kind: 'noise', at: 0, len: 0.08, rise: 0.003, vol: 0.3, band: 'lowpass', hz: 1200, to: 800, q: 0.7 },
  { kind: 'noise', at: 0, len: 0.03, rise: 0.002, vol: 0.2, band: 'bandpass', hz: 2000, to: 2000, q: 2 },
]

const thump = (): Layer[] => [
  { kind: 'noise', at: 0, len: 0.14, rise: 0.004, vol: 0.35, band: 'lowpass', hz: vary(420, 0.1), to: 140, q: 0.8 },
  { kind: 'tone', at: 0, len: 0.1, rise: 0.004, vol: 0.18, wave: 'sine', hz: vary(95, 0.08), to: 55 },
]

const chime = (): Layer[] => [
  { kind: 'tone', at: 0.12, len: 0.3, rise: 0.004, vol: 0.12, wave: 'sine', hz: 784, to: 784 },
  { kind: 'tone', at: 0.19, len: 0.3, rise: 0.004, vol: 0.12, wave: 'sine', hz: 988, to: 988 },
  { kind: 'tone', at: 0.26, len: 0.45, rise: 0.004, vol: 0.14, wave: 'sine', hz: 1175, to: 1175 },
  { kind: 'tone', at: 0.26, len: 0.2, rise: 0.004, vol: 0.03, wave: 'triangle', hz: 2350, to: 2350 },
]

const click = (): Layer[] => [
  { kind: 'noise', at: 0, len: 0.03, rise: 0.001, vol: 0.22, band: 'bandpass', hz: vary(3200, 0.05), to: 2600, q: 4 },
  { kind: 'tone', at: 0, len: 0.025, rise: 0.001, vol: 0.06, wave: 'triangle', hz: 1400, to: 900 },
]

const LOAD: Hit = { every: Infinity, play: () => sfx(load) }

const HITS: Partial<Record<Intent['act'], Hit>> = {
  shovel: { every: 0.45, play: cell => sfx(() => dig(cell)) },
  mine: { every: 0.55, play: () => sfx(pick) },
  chop: { every: 0.7, play: () => sfx(knock) },
  water: { every: Infinity, play: () => sfx(pour) },
  fertilize: { every: Infinity, play: () => sfx(pourBag) },
  harvest: { every: Infinity, play: () => sfx(rustle) },
  compost: LOAD,
  grind: LOAD,
  mill: LOAD,
  still: LOAD,
  furnace: LOAD,
  refuel: LOAD,
  station: LOAD,
  barrel: LOAD,
  jam: LOAD,
  infuse: LOAD,
}

const DONE: Partial<Record<Intent['act'], OnceFn>> = {
  shovel: sfx(turn),
  mine: sfx(rockBreak),
  chop: sfx(trunkFall),
  water: sfx(soak),
  harvest: sfx(pluck),
  drop: sfx(thump),
}

const OPEN = sfx(lidOpen)
const SHUT = sfx(lidShut)
const CHIME = sfx(chime)
const CLICK = sfx(click)

export function burrowOnce(): OnceFn {
  return CHIME
}

export function clickOnce(): OnceFn {
  return CLICK
}

export function actHit(act: Intent['act']): Hit | undefined {
  return HITS[act]
}

export function actOnce(act: Intent['act']): OnceFn | undefined {
  return DONE[act]
}

export function openOnce(_building: OpenBuilding): OnceFn | undefined {
  return OPEN
}

export function closeOnce(_building: OpenBuilding): OnceFn | undefined {
  return SHUT
}

export function noticeOnce(_notice: SoundCue & { kind: 'notice' }): OnceFn | undefined {
  return undefined
}
