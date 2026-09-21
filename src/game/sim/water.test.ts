import { describe, expect, test } from 'vitest'
import { PUMP_COST_PER_L, PUMP_DAY_COST } from '../defs/weather.ts'
import { PUMP_BASE, Pump, Well } from './building.ts'
import { DAY_SECONDS } from './clock.ts'
import { fillDraw } from './queue.ts'
import { bare } from './plot.ts'
import { pull, Reservoir, SOURCE, TAP_RATE, type SourceKind } from './water.ts'
import { World } from './world.ts'

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

  test('water.fill', () => {
    expect(SOURCE.well.fill).toBe(2)
    expect(SOURCE.pump.fill).toBe(2.5)
    expect(TAP_RATE).toBe(4)
    const w = new World(1)
    const pump = w.pump
    pump.water.stored = 20
    pump.water.mul = 2
    expect(pump.water.rate).toBe(SOURCE.pump.rate * 2)
    expect(fillDraw(w, pump, 1)).toBe(SOURCE.pump.fill)
    expect(pump.water.stored).toBe(20 - SOURCE.pump.fill)
    pump.water.stored = 0
    pump.water.gather(1)
    expect(pump.water.stored).toBe(SOURCE.pump.rate * 2)
    expect(fillDraw(w, pump, 1)).toBe(SOURCE.pump.rate * 2)
    const jack = new Pump({ shape: 'rect', col: 2, row: 0, w: 2, h: 1 }, 'jack')
    jack.water.stored = 10
    expect(fillDraw(w, jack, 1)).toBe(SOURCE.pump.fill)
    const well = new Well({ shape: 'rect', col: 0, row: 0, w: 1, h: 1 })
    well.water.stored = 20
    well.water.mul = 0.5
    expect(well.water.rate).toBe(SOURCE.well.rate * 0.5)
    expect(fillDraw(w, well, 1)).toBe(SOURCE.well.fill)
    expect(well.water.stored).toBe(20 - SOURCE.well.fill)
    well.water.stored = 0
    well.water.gather(1)
    expect(well.water.stored).toBe(SOURCE.well.rate * 0.5)
    expect(fillDraw(w, well, 1)).toBe(SOURCE.well.rate * 0.5)
    well.water.stored = 0
    expect(fillDraw(w, well, 1)).toBe(0)
    w.done.add('unlock-irrigation')
    w.money = 999
    const tapAt = { col: PUMP_BASE.col, row: PUMP_BASE.row + 1 }
    w.setCell(tapAt, bare('soft', 0))
    w.buy('buy-pipe')
    w.placePipe({ axis: 'h', col: PUMP_BASE.col, row: PUMP_BASE.row + 1 })
    w.buy('buy-tap')
    w.confirmPlace(tapAt)
    const tap = w.cell(tapAt)
    expect(tap.kind).toBe('tap')
    if (tap.kind !== 'tap') return
    pump.water.stored = 50
    expect(fillDraw(w, tap, 1)).toBe(TAP_RATE)
    expect(pump.water.stored).toBe(50 - TAP_RATE)
    pump.water.stored = 0
    pump.water.mul = 1
    expect(fillDraw(w, tap, 1)).toBe(0)
    pump.water.gather(1)
    expect(fillDraw(w, tap, 1)).toBe(SOURCE.pump.rate)
  })
})
