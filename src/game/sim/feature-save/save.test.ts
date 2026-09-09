import { describe, expect, test } from 'vitest'
import { AXES } from '../../defs/items.ts'
import { DAY_SECONDS } from '../clock.ts'
import { makeChainsaw } from '../item.ts'
import { POINTS_PER_DAY, World } from '../world.ts'
import { dump, parse } from './save.ts'

describe('save.nomigrate', () => {
  test("A dump with `{ kind: 'grass-seeds' }` or `SeedStore.grass` fails hydrate (`unusable`). No migrate.", () => {
    const w = new World(1)
    const s = dump(w)
    s.seats[0].hand = { kind: 'hold', item: { kind: 'grass-seeds', count: 5 } as never }
    const bad = parse(JSON.stringify(s))
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.reason).toBe('unusable')
    const g = dump(new World(1))
    const house = g.chunks[0].cells[9][17]
    expect(house.kind).toBe('seed-silo')
    ;(house as { grass?: number }).grass = 1
    const store = parse(JSON.stringify(g))
    expect(store.ok).toBe(false)
    if (!store.ok) expect(store.reason).toBe('unusable')
  })

  test("`Item` `chainsaw` `usesLeft`+`workSeconds`", () => {
    const w = new World(1)
    w.seats[0].hand = { kind: 'hold', item: makeChainsaw() }
    const loaded = parse(JSON.stringify(dump(w)))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.seats[0].hand).toEqual({
      kind: 'hold',
      item: { kind: 'chainsaw', usesLeft: AXES.chainsaw.uses, workSeconds: AXES.chainsaw.workSeconds },
    })
  })
})


describe('save.recaps', () => {
  test('Dump always writes `recaps: Recap[]` and `recapUnseen: number[]`. `SaveRecap` includes `contracts: HistoryEntry[]`. Parse missing `recaps` / `recapUnseen` as `[]`. Old `seam.kind === \'recap\'`: append that recap (`contracts` `[]` if omitted), push its day to `recapUnseen` if missing, `grantPoints(POINTS_PER_DAY)`, play, `banner = 4`. Not a migrate.', () => {
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
    expect(hydrated.world.clock.banner).toBe(4)
  })
})
