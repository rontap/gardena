import { describe, expect, test } from 'vitest'
import { PUMP_COST_PER_L, PUMP_DAY_COST } from '../defs/weather.ts'
import { Pump } from './building.ts'
import { DAY_SECONDS } from './clock.ts'
import { pull, Reservoir, SOURCE, type SourceKind } from './water.ts'

describe('water', () => {
  test('Starter pump and bought pumpjack are one `SOURCE.pump`. `SOURCE.pump.rate` 0.6. `SOURCE.well.rate` 0.4.', () => {
    const kinds: SourceKind[] = ['pump', 'well']
    expect(Object.keys(SOURCE)).toEqual(kinds)
    expect(SOURCE.pump.rate).toBe(0.6)
    expect(SOURCE.well.rate).toBe(0.4)
    const starter = new Pump({ shape: 'rect', col: 0, row: 0, w: 2, h: 1 }, 'starter')
    const jack = new Pump({ shape: 'rect', col: 2, row: 0, w: 2, h: 1 }, 'jack')
    expect(starter.water.kind).toBe('pump')
    expect(jack.water.kind).toBe('pump')
    expect(starter.water.rate).toBe(SOURCE.pump.rate)
    expect(jack.water.rate).toBe(SOURCE.pump.rate)
  })

  test('Player-facing gather rate for pump, pumpjack, and well is L/day: `rate × DAY_SECONDS`. Not L/s.', () => {
    expect(SOURCE.pump.rate * DAY_SECONDS).toBe(144)
    expect(SOURCE.well.rate * DAY_SECONDS).toBe(96)
  })

  test('`pull(sources, want)` draws in proportion to `stored`.', () => {
    const a = new Reservoir('pump')
    const b = new Reservoir('well')
    a.stored = 10
    b.stored = 30
    expect(pull([a, b], 20)).toBe(20)
    expect(a.stored).toBe(5)
    expect(b.stored).toBe(15)
  })

  test('`PUMP_COST_PER_L` = `PUMP_DAY_COST / (SOURCE.pump.rate × DAY_SECONDS)`.', () => {
    expect(PUMP_DAY_COST).toBe(10.8)
    expect(PUMP_COST_PER_L).toBeCloseTo(0.075, 12)
    expect(PUMP_COST_PER_L).toBe(PUMP_DAY_COST / (SOURCE.pump.rate * DAY_SECONDS))
  })
})
