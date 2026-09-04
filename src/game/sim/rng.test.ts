// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { hash, Rng } from './rng.ts'

describe('0.9 rng', () => {
  test('Spatial.at / hash: same args, any call order → same u', () => {
    const a = new Rng(7)
    const grind = a.stream('grind').at(10, 12, 1, 0)
    const weed = a.stream('weed').at(4, 5, 3, 1)
    const gen = a.stream('gen').at(0, 8, 9)
    expect(grind).toBe(hash(7, 'grind', 10, 12, 1, 0))
    expect(weed).toBe(hash(7, 'weed', 4, 5, 3, 1))
    expect(gen).toBe(hash(7, 'gen', 0, 8, 9))
    const b = new Rng(7)
    expect(b.stream('weed').at(4, 5, 3, 1)).toBe(weed)
    expect(b.stream('gen').at(0, 8, 9)).toBe(gen)
    expect(b.stream('grind').at(10, 12, 1, 0)).toBe(grind)
    expect(a.stream('grind').at(10, 12, 1, 1)).not.toBe(grind)
  })
})
