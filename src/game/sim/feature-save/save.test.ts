import { describe, expect, test } from 'vitest'
import { AXES } from '../../defs/items.ts'
import { WeatherStation } from '../building.ts'
import { DAY_SECONDS } from '../clock.ts'
import { makeAxe } from '../item.ts'
import { POINTS_PER_DAY, World } from '../world.ts'
import { dump, parse } from './save.ts'

describe('save.nomigrate', () => {
  test('`family` dumps as `{ owned: { id: SkillId; tier: number }[] }` and loads back.', () => {
    const w = new World(1)
    w.family.owned.set('boots', 1)
    const s = dump(w)
    expect(s.family).toEqual({ owned: [{ id: 'boots', tier: 1 }] })
    const loaded = parse(JSON.stringify(s))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.family.owned.get('boots')).toBe(1)
  })

  test("`Item` `axe` `id` `chainsaw` `usesLeft`+`workSeconds`", () => {
    const w = new World(1)
    w.seats[0].hand = { kind: 'hold', item: makeAxe('chainsaw') }
    const loaded = parse(JSON.stringify(dump(w)))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.seats[0].hand).toEqual({
      kind: 'hold',
      item: { kind: 'axe', id: 'chainsaw', usesLeft: AXES.chainsaw.uses, workSeconds: AXES.chainsaw.workSeconds },
    })
  })
})


describe('save.weather-station', () => {
  test('`weather-station` `base`, and `originOf` lists it so the 1×2 dumps one record.', () => {
    const w = new World(1)
    const at = { col: 10, row: 12 }
    const station = new WeatherStation({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 2 })
    w.setCell(at, station)
    w.setCell({ col: 10, row: 13 }, station)
    expect(w.forecastCount).toBe(0)
    w.done.add('unlock-weather-station')
    expect(w.forecastCount).toBe(1)
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
  test('Dump writes `recaps: Recap[]`, `recapUnseen: number[]` and `tally.contracts`; `SaveRecap` includes `contracts: HistoryEntry[]`. They load back as written.', () => {
    const w = new World(1)
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    const s = dump(w)
    expect(s.tally.contracts).toEqual([])
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
    expect(loaded.world.tally.contracts).toEqual([])
  })
})
