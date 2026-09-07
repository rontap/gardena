import { describe, expect, test } from 'vitest'
import { Act } from './log.ts'
import { DAY_SECONDS } from './clock.ts'
import { turn } from './play.ts'
import { World } from './world.ts'

describe('play.seam', () => {
  test('A seam inside a turn is captured into `days`. Do not call `dismissRecap`. A turn never holds at sundown.', () => {
    const w = new World(1)
    w.clock.t = DAY_SECONDS - 1
    const report = turn(w, [{ task: 'wait', sec: 2 }])
    expect(w.seam.kind).toBe('play')
    expect(w.clock.day).toBe(2)
    expect(w.clock.t).toBeGreaterThan(0)
    expect(report.days).toHaveLength(1)
    expect(report.days[0].day).toBe(1)
    expect(w.log.some(c => c.a === Act.dismissRecap)).toBe(false)
    expect(w.recapUnseen).toEqual([1])
  })
})
