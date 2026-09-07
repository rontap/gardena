import { describe, expect, test } from 'vitest'
import { DAY_SECONDS } from '../clock.ts'
import { POINTS_PER_DAY, World } from '../world.ts'
import { dump, parse } from './save.ts'

describe('save.recaps', () => {
  test('Dump always writes `recaps: Recap[]` and `recapUnseen: number[]`. `SaveRecap` includes `contracts: HistoryEntry[]`. Parse missing `recaps` / `recapUnseen` as `[]`. Old `seam.kind === \'recap\'`: append that recap (`contracts` `[]` if omitted), push its day to `recapUnseen` if missing, `grantPoints(POINTS_PER_DAY)`, play, `banner = 2`. Not a migrate.', () => {
    const w = new World(1)
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    const s = dump(w)
    expect(s.seam).toEqual({ kind: 'play' })
    expect(s.recaps).toHaveLength(1)
    expect(s.recaps[0].day).toBe(1)
    expect(s.recaps[0].contracts).toEqual([])
    expect(s.recapUnseen).toEqual([1])
    const loaded = parse(JSON.stringify(s))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.seam.kind).toBe('play')
    expect(loaded.world.recaps).toHaveLength(1)
    expect(loaded.world.recapUnseen).toEqual([1])
    expect(loaded.world.clock.banner).toBe(0)
    expect(loaded.world.points).toBe(POINTS_PER_DAY)

    const fresh = dump(new World(1))
    const { recaps: _r, recapUnseen: _u, ...without } = fresh
    const empty = parse(JSON.stringify(without))
    expect(empty.ok).toBe(true)
    if (!empty.ok) return
    expect(empty.world.recaps).toEqual([])
    expect(empty.world.recapUnseen).toEqual([])

    const old = dump(new World(1))
    const { recaps: _r2, recapUnseen: _u2, ...base } = old
    const raw = {
      ...base,
      seam: {
        kind: 'recap' as const,
        recap: {
          day: 1,
          money: 40,
          stipend: 10,
          died: 0,
          harvests: 0,
          research: [],
          tax: 2,
          water: 0,
        },
      },
    }
    const hydrated = parse(JSON.stringify(raw))
    expect(hydrated.ok).toBe(true)
    if (!hydrated.ok) return
    expect(hydrated.world.seam.kind).toBe('play')
    expect(hydrated.world.recaps).toHaveLength(1)
    expect(hydrated.world.recapAt(1).contracts).toEqual([])
    expect(hydrated.world.recapUnseen).toEqual([1])
    expect(hydrated.world.points).toBe(POINTS_PER_DAY)
    expect(hydrated.world.clock.banner).toBe(2)
  })
})
