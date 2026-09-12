import { describe, expect, test } from 'vitest'
import { AXES } from '../../defs/items.ts'
import { DAY_SECONDS } from '../clock.ts'
import { makeChainsaw } from '../item.ts'
import { POINTS_PER_DAY, World } from '../world.ts'
import { dump, parse } from './save.ts'
import { bare } from '../plot.ts'

describe('save.nomigrate', () => {
  test("A dump whose `family` is not `{ owned: { id: SkillId; tier: number }[] }`, or whose `owned` holds a dropped or unknown skill id, or whose `done` holds an unknown research id, fails hydrate (`unusable`). No alias. No merge. No fold.", () => {
    const w = new World(1)
    w.family.owned.set('boots', 1)
    const s = dump(w)
    expect(s.family).toEqual({ owned: [{ id: 'boots', tier: 1 }] })
    expect('player' in s.family).toBe(false)
    const loaded = parse(JSON.stringify(s))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.family.owned.get('boots')).toBe(1)

    const members = dump(new World(1)) as { family: Record<string, unknown> }
    members.family = {
      player: { pickCount: 0, owned: [], offers: [] },
      husband: { pickCount: 0, owned: [], offers: [] },
      daughter: { pickCount: 0, owned: [], offers: [] },
    }
    const old = parse(JSON.stringify(members))
    expect(old.ok).toBe(false)
    if (!old.ok) expect(old.reason).toBe('unusable')

    const dropped = dump(new World(1))
    dropped.family = { owned: [{ id: 'forecast' as never, tier: 1 }] }
    const drop = parse(JSON.stringify(dropped))
    expect(drop.ok).toBe(false)
    if (!drop.ok) expect(drop.reason).toBe('unusable')

    const research = dump(new World(1))
    research.done = ['unlock-tomato' as never]
    const badDone = parse(JSON.stringify(research))
    expect(badDone.ok).toBe(false)
    if (!badDone.ok) expect(badDone.reason).toBe('unusable')
  })

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


describe('save.weather-station', () => {
  test('`weather-station` `base`, and `originOf` lists it so the 1×2 dumps one record.', () => {
    const w = new World(1)
    w.done.add('unlock-weather-station')
    w.money = 999
    const at = { col: 10, row: 12 }
    w.setCell(at, bare('soft', 0))
    w.setCell({ col: 10, row: 13 }, bare('soft', 0))
    w.buy('buy-weather-station')
    w.confirmPlace(at)
    const s = dump(w)
    const cells = s.chunks[0].cells.flat()
    const stations = cells.filter(c => c.kind === 'weather-station')
    const occ = cells.filter(c => c.kind === 'occ')
    expect(stations).toHaveLength(1)
    expect(occ.length).toBeGreaterThan(0)
    const loaded = parse(JSON.stringify(s))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.cell(at).kind).toBe('weather-station')
    expect(loaded.world.forecastCount).toBe(1)
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
