// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { DAY_SECONDS } from './clock.ts'
import { onCell } from './drop.ts'
import { Weed } from './plant.ts'
import { Soil, WEED_CHANCE, WEED_GONE_DAYS, WEED_GROW, SOIL_WATER_MID } from './soil.ts'
import { dump } from './feature-save/save.ts'
import { parse } from './feature-save/save.parse.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function weeded(w: World, maturity: number): Weed {
  const weed = new Weed(0)
  weed.maturity = maturity
  w.setCell(AT, { kind: 'weed', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE), weed })
  return weed
}

describe('weeds.gone', () => {
  test('weeds.gone - Maturity 1 stamps readyAt with the day. The seam WEED_GONE_DAYS later leaves soft untilled ground under a grass cover, no Soil and no drop.', () => {
    const w = new World(1)
    const weed = weeded(w, 1 - DT_MAX / WEED_GROW / 2)
    expect(weed.readyAt).toEqual({ kind: 'growing' })
    w.tick(DT_MAX)
    expect(weed.maturity).toBe(1)
    expect(weed.readyAt).toEqual({ kind: 'ready', day: w.clock.day })
    const stamped = w.clock.day

    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    expect(w.clock.day - stamped).toBe(WEED_GONE_DAYS)
    const c = w.cell(AT)
    expect(c.kind).toBe('untilled')
    expect(c.kind === 'untilled' && c.ground).toBe('soft')
    expect(c.kind === 'untilled' && c.hardness).toBe(0)
    expect(c.kind === 'untilled' && c.cover.kind).toBe('grass')
    expect('soil' in c).toBe(false)
    expect(onCell(w.drops, AT)).toHaveLength(0)
  })

  test('weeds.gone - A weed still short of maturity 1 survives the seam, and readyAt round-trips through a save.', () => {
    const w = new World(1)
    const weed = weeded(w, 0.5)
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    expect(w.cell(AT).kind).toBe('weed')
    expect(weed.readyAt).toEqual({ kind: 'growing' })

    const ripe = new World(1)
    const grown = weeded(ripe, 1)
    grown.readyAt = { kind: 'ready', day: ripe.clock.day }
    const back = parse(JSON.stringify(dump(ripe)))
    expect(back.ok).toBe(true)
    if (!back.ok) return
    const cell = back.world.cell(AT)
    expect(cell.kind === 'weed' && cell.weed.readyAt).toEqual({ kind: 'ready', day: ripe.clock.day })
  })
})
