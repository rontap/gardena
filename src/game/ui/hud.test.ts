import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import { PHASE_NAME } from '../sim/clock.ts'
import { WEATHER_NAME } from '../defs/weather.ts'
import { prizeName } from './market.tsx'
import { recapOutcome } from './recap.tsx'

test('names is the one source for Pumpjack, Heirloom', () => {
  expect(m.names_face_pumpjack()).toBe(m.names_sku_buy_pumpjack())
  expect(m.names_rarity_heirloom()).toBe('Heirloom')
  expect(WEATHER_NAME.clear()).toBe(m.names_weather_clear())
  expect(PHASE_NAME.sunrise()).toBe(m.names_phase_sunrise())
  expect(PHASE_NAME.day()).toBe(m.names_phase_day())
})

test('fill() is gone. Named params on the message.', () => {
  expect(m.hud_clock({ day: 3, phase: m.names_phase_sunrise() })).toBe('Day 3 · Sunrise')
  expect(m.hud_day({ day: 1 })).toBe('Day 1')
  expect(m.hud_secs({ secs: 12 })).toBe('12s')
})

describe('recap', () => {
  test('recap outcome labels', () => {
    expect(recapOutcome('done')).toBe(m.recap_completed())
    expect(recapOutcome('missed')).toBe(m.recap_missed())
    expect(recapOutcome('cancelled')).toBe(m.recap_cancelled())
  })
})

test('prize names reuse names_*', () => {
  expect(prizeName({ kind: 'freezer' })).toBe(m.names_sku_buy_freezer_large())
  expect(prizeName({ kind: 'tool', tool: 'rotary-shovel' })).toBe(m.names_shovel_rotary_shovel())
  expect(prizeName({ kind: 'tool', tool: 'diamond-pickaxe' })).toBe(m.names_pickaxe_diamond_pickaxe())
  expect(prizeName({ kind: 'cash' })).toBe(m.market_cash())
})
