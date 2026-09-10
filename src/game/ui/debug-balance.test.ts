import { expect, test } from 'vitest'
import { CROPS } from '../defs/crops.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import { CLICK_SECONDS, HAND_PLANTED_MAX, HAND_SAT, compute, handClicks, handCurve, handIncome, snapshot, toCsv } from './debug-balance.ts'

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

test('#debug-balance hand chart: cycle is grow or planted × click time. Late is `i × step − grow`. Auto-water field clicks match across pack annuals. Raspberry peaks after carrot. X 1…`HAND_PLANTED_MAX`.', () => {
  const s = snapshot()
  const { rows } = compute(s)
  const carrot = rows.find(r => r.id === 'carrot' && r.variety === 'base')
  const wheat = rows.find(r => r.id === 'wheat' && r.variety === 'base')
  if (carrot === undefined || wheat === undefined) throw new Error('row')
  expect(carrot.fruitSale).toBe(CROPS.carrot.sale)
  expect(carrot.costSeed).toBe(3 / 5)
  const one = handIncome(carrot, 1, true, CLICK_SECONDS, s.g.daySeconds, HAND_SAT, false)
  expect(one).toBeCloseTo(((CROPS.carrot.sale - 3 / 5) / CROPS.carrot.growSeconds) * 60, 10)
  const two = handIncome(carrot, 2, true, CLICK_SECONDS, s.g.daySeconds, HAND_SAT, false)
  expect(two).toBeCloseTo(one * 2, 10)
  const step = handClicks(carrot, true) * CLICK_SECONDS
  const fullN = Math.floor(CROPS.carrot.growSeconds / step) + 1
  const full = handIncome(carrot, fullN, true, CLICK_SECONDS, s.g.daySeconds, HAND_SAT, false)
  expect(full).toBeCloseTo(one * fullN, 10)
  const lines = handCurve(rows, true, CLICK_SECONDS, s.g.daySeconds, HAND_SAT, false)
  expect(lines[0]?.points.length).toBe(HAND_PLANTED_MAX)
  const peak = (id: (typeof rows)[number]['id']) => {
    const line = lines.find(l => l.id === id)
    if (line === undefined) throw new Error('line')
    let n = 1
    let y = line.points[0].cpm
    for (const p of line.points) {
      if (p.cpm > y) {
        y = p.cpm
        n = p.planted
      }
    }
    return n
  }
  expect(handClicks(carrot, true)).toBe(handClicks(wheat, true))
  expect(peak('carrot')).toBeLessThan(peak('raspberry'))
  const dry = handIncome(wheat, 40, false, CLICK_SECONDS, s.g.daySeconds, HAND_SAT, false)
  const wet = handIncome(wheat, 40, true, CLICK_SECONDS, s.g.daySeconds, HAND_SAT, false)
  expect(wet).toBeGreaterThan(dry)
  expect(handClicks(carrot, false)).toBe(carrot.fieldClicks)
  expect(handClicks(carrot, true)).toBe(carrot.fieldClicks - carrot.pours)
})

