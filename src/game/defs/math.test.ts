import { describe, expect, test } from 'vitest'
import { visualRound } from './math.ts'

describe('view.round', () => {
  test('view.round — Litres and recipe amounts a person reads use Math.visualRound (nearest half). Percents stay floor(* 100).', () => {
    expect(Math.visualRound(2.22)).toBe(2)
    expect(Math.visualRound(2.33)).toBe(2.5)
    expect(Math.visualRound(2)).toBe(2)
    expect(visualRound(2.22)).toBe(2)
    expect(visualRound(0.3)).toBe(0.5)
    expect(visualRound(0.1)).toBe(0)
  })
})
