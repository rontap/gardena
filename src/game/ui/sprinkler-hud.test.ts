import { expect, test } from 'vitest'
import { SPRINKLER_STEP, SPRINKLER_TILE_DAY, snapFlow } from '../defs/items.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import { statsOf } from '../sim/modifiers.ts'
import { tileRate, tuneDay } from '../sim/nets.ts'
import { World } from '../sim/world.ts'
import { tunedCrop } from '../view/layers/pipes.ts'
import { hudSpec } from './objecthud.tsx'

const AT = { col: 8, row: 8 }

function withSprinkler(): World {
  const w = new World(1)
  w.unlockAll()
  w.cheatMoney()
  w.buy('buy-sprinkler')
  w.placeSprinkler({ variant: 'basic', at: AT, tune: { kind: 'flat' }, inn: 0, hold: 0 })
  return w
}

test('sprinkler.snap — the slider offers 0 to full flow on SPRINKLER_STEP stops, and nothing outside it', () => {
  expect(snapFlow(0)).toBe(0)
  expect(snapFlow(1.17)).toBe(1.15)
  expect(snapFlow(1.13)).toBe(1.15)
  expect(snapFlow(-4)).toBe(0)
  expect(snapFlow(99)).toBe(SPRINKLER_TILE_DAY)
  expect(snapFlow(SPRINKLER_TILE_DAY)).toBe(SPRINKLER_TILE_DAY)
  const stops = Math.round(SPRINKLER_TILE_DAY / SPRINKLER_STEP)
  for (let i = 0; i <= stops; i++) {
    const day = snapFlow(i * SPRINKLER_STEP)
    expect(snapFlow(day)).toBe(day)
  }
})

test('sprinkler.rate — a tuned head pours the litres it was set to, and a command from a seat is snapped on the way in', () => {
  const w = withSprinkler()
  w.tuneSprinkler(AT, { kind: 'rate', day: 1.17 })
  const s = w.sprinklerAt(AT)
  if (s === undefined) throw new Error('sprinkler')
  expect(s.tune).toEqual({ kind: 'rate', day: 1.15 })
  expect(tileRate(w, s)).toBeCloseTo(1.15 / DAY_SECONDS, 10)
  expect(tuneDay(w, s)).toBeCloseTo(1.15, 10)
  w.tuneSprinkler(AT, { kind: 'rate', day: 99 })
  expect(w.sprinklerAt(AT)?.tune).toEqual({ kind: 'rate', day: SPRINKLER_TILE_DAY })
})

test('sprinkler.legacy — a head saved before the slider still pours: flat is full flow, a crop is what that crop drinks', () => {
  const w = withSprinkler()
  expect(tuneDay(w, w.sprinklerAt(AT)!)).toBeCloseTo(SPRINKLER_TILE_DAY, 10)
  w.tuneSprinkler(AT, { kind: 'crop', crop: 'potato' })
  const want = statsOf('potato', 'base', 0, w.modifiers).waterUsePerSec * DAY_SECONDS
  expect(tuneDay(w, w.sprinklerAt(AT)!)).toBeCloseTo(want, 10)
})

test('sprinkler.hud — the HUD is one slider: the litres set, the range it moves over, and a mark per drinking crop', () => {
  const w = withSprinkler()
  w.tuneSprinkler(AT, { kind: 'rate', day: 1.1 })
  const spec = hudSpec(w, { kind: 'sprinkler', at: AT })
  if (spec?.chrome !== 'slider') throw new Error('chrome')
  expect(spec.day).toBe(1.1)
  expect(spec.max).toBe(SPRINKLER_TILE_DAY)
  expect(spec.step).toBe(SPRINKLER_STEP)
  expect(spec.marks.length).toBeGreaterThan(0)
  spec.marks.forEach(mk => {
    expect(mk.day).toBe(snapFlow(mk.day))
    expect(mk.day).toBeLessThanOrEqual(SPRINKLER_TILE_DAY)
  })
  spec.set(0)
  expect(w.sprinklerAt(AT)?.tune).toEqual({ kind: 'rate', day: 0 })
  expect(tileRate(w, w.sprinklerAt(AT)!)).toBe(0)
})

test('sprinkler.face — a head wears the crop that drinks exactly what it pours, and wears none between two crops', () => {
  const w = withSprinkler()
  const potato = statsOf('potato', 'base', 0, w.modifiers).waterUsePerSec * DAY_SECONDS
  w.tuneSprinkler(AT, { kind: 'rate', day: potato })
  expect(tunedCrop(w, w.sprinklerAt(AT)!)).toBe('potato')
  w.tuneSprinkler(AT, { kind: 'rate', day: snapFlow(potato) + SPRINKLER_STEP })
  expect(tunedCrop(w, w.sprinklerAt(AT)!)).toBe(undefined)
  w.tuneSprinkler(AT, { kind: 'flat' })
  expect(tunedCrop(w, w.sprinklerAt(AT)!)).toBe(undefined)
  w.tuneSprinkler(AT, { kind: 'crop', crop: 'wheat' })
  expect(tunedCrop(w, w.sprinklerAt(AT)!)).toBe('wheat')
})
