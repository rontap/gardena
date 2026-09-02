// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import {
  CONTINUE_START,
  CONTINUE_STEP,
  DROUGHT_EVAP_DAY,
  DRY_EVAP_DAY,
  FLOOD_SOAK_DAY,
  PUMP_COST_PER_L,
  RAIN_SOAK_DAY,
  SEVERE_P,
  SPECIAL_START,
  WEATHER_THROUGH_DAY,
} from '../defs/weather.ts'
import { SKILLS } from '../defs/skills.ts'
import { DAY_SECONDS } from './clock.ts'
import { hash, Rng } from './rng.ts'
import { BIG_TICK, Soil, SOIL_WATER_MID, WEED_CHANCE } from './soil.ts'
import { forecastWeather, pumpCostMul, soakDelta, type WeatherKind } from './weather.ts'
import { DAY_STIPEND, DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function bed(water = SOIL_WATER_MID): Soil {
  return new Soil(water, 1, WEED_CHANCE)
}

function stepBig(w: World): void {
  const n = w.bigTicks
  while (w.bigTicks === n) {
    if (w.seam.kind === 'recap') w.dismissRecap()
    w.tick(DT_MAX)
  }
}

function toDay(w: World, kind: WeatherKind): void {
  w.pinTomorrow(kind)
  w.clock.t = DAY_SECONDS - 0.001
  w.tick(1)
  if (w.seam.kind === 'recap') w.dismissRecap()
}

describe('weather', () => {
  test('Walk days 1…N from conceptual prev clear and `specialP = SPECIAL_START`. `forecastWeather` is that table. `World.weather(day)` indexes it. After flood or drought the next day is clear.', () => {
    expect(SPECIAL_START).toBeLessThanOrEqual(0)
    const table = forecastWeather(1, WEATHER_THROUGH_DAY)
    expect(table).toHaveLength(WEATHER_THROUGH_DAY)
    expect(table[0]).toBe('clear')
    expect(table[1]).toBe('clear')
    expect(table[2]).toBe('clear')
    table.forEach((kind, i) => {
      if ((kind === 'flood' || kind === 'drought') && i + 1 < table.length) expect(table[i + 1]).toBe('clear')
    })
    const w = new World(1)
    expect(w.weather(1)).toBe(table[0])
    expect(w.weather(w.clock.day)).toBe(table[w.clock.day - 1])
    const pins = new Map<number, WeatherKind>([[4, 'flood']])
    const pinned = forecastWeather(1, 6, pins)
    expect(pinned[3]).toBe('flood')
    expect(pinned[4]).toBe('clear')
  })

  test('`weather.at(day, k)` only. No `next()`. No `clock.t`. No `money`.', () => {
    const a = new Rng(7).stream('weather')
    expect(a.at(4, 0)).toBe(hash(7, 'weather', 4, 0))
    expect(a.at(4, 1)).toBe(hash(7, 'weather', 4, 1))
    expect(a.at(9, 0)).toBe(new Rng(7).stream('weather').at(9, 0))
    expect(a.at(4, 1)).not.toBe(a.at(4, 0))
  })

  test('`continueP <= 0` and not severe → clear.', () => {
    const pins = new Map<number, WeatherKind>([
      [4, 'rain'],
      [5, 'rain'],
      [6, 'rain'],
      [7, 'rain'],
    ])
    const continueP = CONTINUE_START - CONTINUE_STEP * 3
    expect(continueP).toBeLessThanOrEqual(0)
    const table = forecastWeather(1, 8, pins)
    const u0 = new Rng(1).stream('weather').at(8, 0)
    if (u0 < SEVERE_P) expect(table[7]).toBe('flood')
    else expect(table[7]).toBe('clear')
  })

  test('On rain/dry prev, severe (`at(D,0) < SEVERE_P`) before continue.', () => {
    let seed = 1
    let found = false
    for (; seed < 4000; seed++) {
      const u0 = new Rng(seed).stream('weather').at(5, 0)
      const u1 = new Rng(seed).stream('weather').at(5, 1)
      if (u0 < SEVERE_P && u1 < CONTINUE_START) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
    const pins = new Map<number, WeatherKind>([[4, 'rain']])
    const table = forecastWeather(seed, 5, pins)
    expect(table[4]).toBe('flood')
    const dryPins = new Map<number, WeatherKind>([[4, 'dry']])
    expect(forecastWeather(seed, 5, dryPins)[4]).toBe('drought')
  })

  test('Seam bills `pumpLiters × PUMP_COST_PER_L × costMul(ended weather)` before recap. Mid-day money unchanged. `recap.water` is the bill. `pumpLiters` then 0. Money may go negative.', () => {
    const w = new World(1)
    w.pumpLiters = 100
    const mid = w.money
    w.tick(DT_MAX)
    expect(w.money).toBe(mid)
    expect(w.pumpLiters).toBe(100)
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    const ended = w.weather(w.clock.day - 1)
    const bill = 100 * PUMP_COST_PER_L * pumpCostMul(ended)
    expect(w.seam.kind).toBe('recap')
    if (w.seam.kind === 'recap') {
      expect(w.seam.recap.water).toBeCloseTo(bill, 10)
      expect(w.seam.recap.money).toBeCloseTo(mid + DAY_STIPEND - w.seam.recap.tax - bill, 10)
    }
    expect(w.pumpLiters).toBe(0)
    const dry = new World(1)
    toDay(dry, 'dry')
    dry.pumpLiters = 50
    const before = dry.money
    dry.clock.t = DAY_SECONDS - 0.001
    dry.tick(1)
    const dryBill = 50 * PUMP_COST_PER_L * pumpCostMul('dry')
    expect(dry.seam.kind).toBe('recap')
    if (dry.seam.kind === 'recap') {
      expect(dry.seam.recap.water).toBeCloseTo(dryBill, 10)
      expect(dry.money).toBeCloseTo(before + DAY_STIPEND - dry.seam.recap.tax - dryBill, 8)
    }
    const broke = new World(1)
    broke.pumpLiters = 10000
    broke.clock.t = DAY_SECONDS - 0.001
    broke.tick(1)
    expect(broke.money).toBeLessThan(0)
    expect(broke.seam.kind).toBe('recap')
    if (broke.seam.kind === 'recap') expect(broke.seam.recap.water).toBeGreaterThan(0)
  })

  test('Soak/evap on `BIG_TICK` only, `tilled` index, not `forEachCell`, not every `dt`. Full day sums to `*_DAY`.', () => {
    expect(soakDelta('rain') * (DAY_SECONDS / BIG_TICK)).toBeCloseTo(RAIN_SOAK_DAY, 10)
    expect(soakDelta('flood') * (DAY_SECONDS / BIG_TICK)).toBeCloseTo(FLOOD_SOAK_DAY, 10)
    expect(-soakDelta('dry') * (DAY_SECONDS / BIG_TICK)).toBeCloseTo(DRY_EVAP_DAY, 10)
    expect(-soakDelta('drought') * (DAY_SECONDS / BIG_TICK)).toBeCloseTo(DROUGHT_EVAP_DAY, 10)
    expect(soakDelta('clear')).toBe(0)
    const w = new World(1)
    toDay(w, 'rain')
    w.setCell(AT, { kind: 'empty', soil: bed(1) })
    const soil = (w.cell(AT) as { soil: Soil }).soil
    stepBig(w)
    expect(soil.water).toBeCloseTo(1 + soakDelta('rain'), 10)
    w.tick(DT_MAX)
    expect(soil.water).toBeCloseTo(1 + soakDelta('rain'), 10)
    const full = new World(1)
    toDay(full, 'rain')
    full.pinTomorrow('rain')
    full.setCell(AT, { kind: 'empty', soil: bed(1) })
    const s = (full.cell(AT) as { soil: Soil }).soil
    for (let i = 0; i < DAY_SECONDS / BIG_TICK; i++) stepBig(full)
    expect(s.water).toBeCloseTo(1 + RAIN_SOAK_DAY, 8)
    const clear = new World(1)
    clear.setCell(AT, { kind: 'empty', soil: bed(1) })
    const c = (clear.cell(AT) as { soil: Soil }).soil
    stepBig(clear)
    expect(c.water).toBe(1)
  })

  test('`(flood ∧ sunrise) ∨ (drought ∧ day)` closed unless `open-24`. `open-late` does not reopen. Consign always.', () => {
    const w = new World(1)
    toDay(w, 'flood')
    w.clock.t = 0
    expect(w.marketOpen()).toBe(false)
    w.clock.t = DAY_SECONDS * 0.3
    expect(w.marketOpen()).toBe(true)
    w.family.daughter.owned.set('open-late', 1)
    w.clock.t = 0
    expect(w.marketOpen()).toBe(false)
    w.family.daughter.owned.set('open-24', 1)
    expect(w.marketOpen()).toBe(true)
    const d = new World(1)
    toDay(d, 'drought')
    d.clock.t = 0
    expect(d.marketOpen()).toBe(true)
    d.clock.t = DAY_SECONDS * 0.3
    expect(d.marketOpen()).toBe(false)
    d.family.daughter.owned.set('open-late', 1)
    expect(d.marketOpen()).toBe(false)
    d.family.daughter.owned.set('open-24', 1)
    expect(d.marketOpen()).toBe(true)
  })

  test('Drought `skuPrice`: `tab === \'seeds\' | \'utility\'`, after haggling min $1, then ×2. Automation / building / hangar-buys untouched.', () => {
    const w = new World(1)
    toDay(w, 'drought')
    expect(w.skuPrice('pack-carrot')).toBe(6)
    expect(w.skuPrice('buy-shovel')).toBe(20)
    expect(w.skuPrice('buy-pipe')).toBe(3)
    expect(w.skuPrice('buy-tile-cobble')).toBe(5)
    expect(w.skuPrice('buy-hangar')).toBe(80)
    w.family.husband.owned.set('haggling', 2)
    expect(w.skuPrice('buy-shovel')).toBe(16)
    expect(w.skuPrice('buy-pipe')).toBe(1)
    w.family.husband.owned.set('haggling', 3)
    expect(w.skuPrice('buy-pipe')).toBe(1)
  })

  test('HUD tomorrow iff husband owns `forecast`.', () => {
    expect(SKILLS.forecast.effect).toEqual({ kind: 'forecast' })
    expect(SKILLS.forecast.maxTier).toBe(1)
    const w = new World(1)
    expect(w.hasSkill('forecast')).toBe(false)
    w.family.husband.owned.set('forecast', 1)
    expect(w.hasSkill('forecast')).toBe(true)
    expect(w.weather(w.clock.day + 1)).toBe(forecastWeather(1, WEATHER_THROUGH_DAY)[w.clock.day])
  })

})
