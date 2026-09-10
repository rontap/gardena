// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import {describe, expect, test} from 'vitest'
import {RESEARCH} from '../defs/research.ts'
import {Plant} from './plant.ts'
import {Act} from './log.ts'
import {DAY_SECONDS} from './clock.ts'
import {Soil, SOIL_WATER_MID, WEED_CHANCE} from './soil.ts'
import {DT_MAX, POINTS_PER_DAY, STIPEND, stipendOf, World} from './world.ts'

const AT = {col: 10, row: 12}

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
    return new Soil(water, fertilizer, WEED_CHANCE)
}

describe('day.seam', () => {
    test('Seam at `t >= DAY_SECONDS` runs `stipendOf`, tax, pump bill, burrow mint, tree seam, then appends `Recap`, pushes `recapUnseen`, `grantPoints(POINTS_PER_DAY)`, `banner = 4`, `seam` stays play, then tally reset — all before any field tick of the new day. `World.tick` does not return early.', () => {
        const w = new World(2)
        const p = new Plant('carrot', 'base', 0)
        p.maturity = 0.4
        w.setCell(AT, {kind: 'growing', soil: bed(), plant: p})
        w.tally.died = 2
        w.tally.harvests = 5
        const money = w.money
        const burrows = w.burrows.size
        w.clock.t = DAY_SECONDS - 0.001
        w.tick(1)
        expect(w.clock.day).toBe(2)
        expect(w.seam.kind).toBe('play')
        const recap = w.recapAt(1)
        expect(w.money).toBe(money + stipendOf(1) - recap.tax - recap.water)
        expect(recap.day).toBe(1)
        expect(recap.died).toBe(2)
        expect(recap.harvests).toBe(5)
        expect(recap.stipend).toBe(stipendOf(1))
        expect(recap.water).toBe(0)
        expect(w.recaps).toHaveLength(1)
        expect(w.recapUnseen).toEqual([1])
        expect(w.points).toBe(POINTS_PER_DAY)
        expect(w.clock.banner).toBe(4)
        expect(w.tally).toEqual({died: 0, harvests: 0, research: [], contracts: []})
        expect(p.maturity).toBe(0.4)
        expect(w.burrows.size).toBe(burrows + 1)
        const n = w.now
        w.tick(DT_MAX)
        expect(w.now).toBe(n + 1)
        expect(p.maturity).toBeGreaterThan(0.4)
        expect(w.seam.kind).toBe('play')
    })
})

describe('day.stipend', () => {
    test('`stipendOf(endedDay)` is 12 on ended days 1–3, 6 on 4–6, 3 on 7–10, else 0. `Recap.stipend` stores that. Recap ledger omits the stipend line when 0. Identifier `stipendOf`. Bands `STIPEND` — preference.', () => {
        expect(stipendOf(1)).toBe(12)
        expect(stipendOf(3)).toBe(12)
        expect(stipendOf(4)).toBe(6)
        expect(stipendOf(6)).toBe(6)
        expect(stipendOf(7)).toBe(3)
        expect(stipendOf(10)).toBe(3)
        expect(stipendOf(11)).toBe(0)
        expect(STIPEND).toEqual([
            {through: 3, amount: 12},
            {through: 6, amount: 6},
            {through: 10, amount: 3},
        ])
        const w = new World(1)
        for (let d = 1; d <= 11; d++) {
            w.clock.t = DAY_SECONDS - 0.001
            w.tick(DT_MAX)
            expect(w.recapAt(d).stipend).toBe(stipendOf(d))
        }
        expect(w.recapAt(11).stipend).toBe(0)
    })
})

describe('day.recap', () => {
    test('Recap persists on `World.recaps` (one per ended day). Grant is the seam, not Close. Popup opens from a Command Center recap notice (App `recapDay`, not `World.seam`). Close / Esc / backdrop is `seeRecap(day)`. `Act.dismissRecap` is a no-op. Stipend line omitted when `Recap.stipend === 0`.', () => {
        const w = new World(1)
        w.clock.t = DAY_SECONDS - 0.001
        w.tick(1)
        expect(w.recaps).toHaveLength(1)
        expect(w.recapUnseen).toEqual([1])
        expect(w.points).toBe(POINTS_PER_DAY)
        expect(w.seam.kind).toBe('play')
        w.dismissRecap()
        expect(w.points).toBe(POINTS_PER_DAY)
        expect(w.recapUnseen).toEqual([1])
        expect(w.seam.kind).toBe('play')
        expect(w.log).toEqual([{a: Act.dismissRecap, t: 1, p: 0}])
        w.seeRecap(1)
        expect(w.recapUnseen).toEqual([])
        expect(w.recaps).toHaveLength(1)
        expect(w.recapAt(1).day).toBe(1)
        w.seeRecap(1)
        expect(w.recapUnseen).toEqual([])
        w.clock.t = DAY_SECONDS - 0.001
        w.tick(1)
        expect(w.recaps.map(r => r.day)).toEqual([1, 2])
        expect(w.recapUnseen).toEqual([2])
    })
})

describe('day.end-day', () => {
    test('End day sets `clock.t = DAY_SECONDS`. No remaining-field sim. Next tick seams.', () => {
        const w = new World(1)
        const p = new Plant('carrot', 'base', 0)
        p.maturity = 0.4
        w.setCell(AT, {kind: 'growing', soil: bed(), plant: p})
        w.clock.t = 80
        w.endDay()
        expect(w.clock.t).toBe(DAY_SECONDS)
        expect(p.maturity).toBe(0.4)
        expect(w.seam.kind).toBe('play')
        expect(w.log).toEqual([{a: Act.cheat, t: 0, p: 0, k: 'day'}])
        w.tick(DT_MAX)
        expect(w.seam.kind).toBe('play')
        expect(w.recaps).toHaveLength(1)
        expect(p.maturity).toBe(0.4)
    })
})

describe('world.cheatSpeed', () => {
    test('`World.cheatSpeed` is `1 | 3`. App host accumulator `frameDt * cheatSpeed`. World.tick does not multiply `dt`. `Act.cheat` `{ k: \'speed\'; n: 1 | 3 }`. `?speed=3` boots 3; any other URL value boots 1. Not job drain.', () => {
        const w = new World(1)
        expect(w.cheatSpeed).toBe(1)
        w.setCheatSpeed(3)
        expect(w.cheatSpeed).toBe(3)
        expect(w.log).toEqual([{a: Act.cheat, t: 0, p: 0, k: 'speed', n: 3}])
        w.setCheatSpeed(1)
        expect(w.cheatSpeed).toBe(1)

        const a = new World(1)
        const b = new World(1)
        b.setCheatSpeed(3)
        const pa = new Plant('carrot', 'base', 0)
        const pb = new Plant('carrot', 'base', 0)
        a.setCell(AT, {kind: 'growing', soil: bed(), plant: pa})
        b.setCell(AT, {kind: 'growing', soil: bed(), plant: pb})
        a.tick(DT_MAX)
        b.tick(DT_MAX)
        expect(pb.maturity).toBe(pa.maturity)

        const c = new World(1)
        c.setCheatSpeed(3)
        c.startResearch('unlock-tomato')
        const left = RESEARCH['unlock-tomato'].seconds
        c.tick(DT_MAX)
        expect(c.job.kind === 'run' && c.job.left).toBeCloseTo(left - DT_MAX, 5)
        expect(c.cheatFastResearch).toBe(false)
    })
})

