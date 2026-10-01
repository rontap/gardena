import { expect, test } from 'vitest'
import { CROPS } from '../defs/crops.ts'
import { TREES } from '../defs/trees.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import { PLANT_FERT_PER_SEC, TREE_WATER_MAX, TREE_WATER_MID } from '../sim/soil.ts'
import { compute, snapshot, toCsv } from './debug-balance.ts'

test('Constant settings **Water per day** is `waterUsePerSec × daySeconds`; the field writes `n / daySeconds`. CSV `water_use_per_day`. **Water consumed (L)** stays `waterUsePerSec × growSeconds`.', () => {
  const s = snapshot()
  expect(s.g.daySeconds).toBe(DAY_SECONDS)
  const { rows } = compute(s)
  const potato = rows.find(r => r.id === 'potato' && r.variety === 'base')
  expect(potato?.waterUsePerDay).toBe(CROPS.potato.waterUsePerSec * DAY_SECONDS)
  expect(potato?.totalWater).toBe(CROPS.potato.waterUsePerSec * CROPS.potato.growSeconds)

  const doubled = { ...s, g: { ...s.g, daySeconds: DAY_SECONDS * 2 } }
  const { rows: drows } = compute(doubled)
  const potatoDay = drows.find(r => r.id === 'potato' && r.variety === 'base')
  expect(potatoDay?.waterUsePerDay).toBe(CROPS.potato.waterUsePerSec * DAY_SECONDS * 2)
  expect(potatoDay?.totalWater).toBe(potato?.totalWater)

  const edited = {
    ...s,
    crops: s.crops.map(c => (c.id === 'potato' ? { ...c, waterUsePerSec: 1.2 / s.g.daySeconds } : c)),
  }
  const { rows: erows } = compute(edited)
  const potatoEdit = erows.find(r => r.id === 'potato' && r.variety === 'base')
  expect(potatoEdit?.waterUsePerDay).toBe(1.2)
  expect(potatoEdit?.totalWater).toBe((1.2 / DAY_SECONDS) * CROPS.potato.growSeconds)

  const csv = toCsv(rows, s.g)
  const header = csv.split('\n')[0]
  expect(header).toContain('water_use_per_day')
  expect(header.includes('water_use_per_sec')).toBe(false)
  const line = csv.split('\n').find(l => l.startsWith('potato,annual,base,'))
  expect(line).toBeDefined()
  const i = header.split(',').indexOf('water_use_per_day')
  expect(Number(line?.split(',')[i])).toBe(CROPS.potato.waterUsePerSec * DAY_SECONDS)
})

test('#debug-balance **Pours** is long-run: `waterUsePerSec × growSeconds / pourSpan`. Till start is not a credit.', () => {
  const s = snapshot()
  const { rows } = compute(s)
  const carrot = rows.find(r => r.id === 'carrot' && r.variety === 'base')
  if (carrot === undefined) throw new Error('row')
  const use = CROPS.carrot.waterUsePerSec * CROPS.carrot.growSeconds
  const red = (s.g.soilWaterMid + CROPS.carrot.waterTolerance) / 2
  const span = 2 * red
  expect(carrot.pours).toBeCloseTo(use / span, 10)
  expect(carrot.pours).toBeGreaterThan(0)
})

test('tree water and Fertilizer are not 0', () => {
  const s = snapshot()
  const { rows } = compute(s)
  const apple = rows.find(r => r.id === 'apple' && r.variety === 'base')
  if (apple === undefined) throw new Error('row')
  const growSeconds = TREES.apple.juvenileSeconds
  const totalWater = CROPS.apple.waterUsePerSec * growSeconds
  const tol = CROPS.apple.waterTolerance
  const red = (TREE_WATER_MID + tol) / 2
  const wilt = TREE_WATER_MID - red
  const drown = TREE_WATER_MAX - (TREE_WATER_MID + red)
  const span = TREE_WATER_MAX - wilt - drown
  expect(apple.totalWater).toBe(totalWater)
  expect(apple.totalWater).toBeGreaterThan(0)
  expect(apple.pours).toBeCloseTo(totalWater / span, 10)
  expect(apple.pours).toBeGreaterThan(0)
  expect(apple.fertL).toBeCloseTo(PLANT_FERT_PER_SEC * CROPS.apple.fertUseMul * growSeconds, 10)
  expect(apple.fertL).toBeGreaterThan(0)
})
