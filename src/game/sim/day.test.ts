// COMMANDMENT: never test specifically for versions, ever. expect(GAME_VERSION).toBe is disallowed.
import {describe, expect, test} from 'vitest'
import {LOAN_BELOW, LOAN_CASH, LOAN_DAYS, LOAN_PACK, LOAN_PACKS, LOAN_PAYBACK} from '../defs/loan.ts'
import {RESEARCH} from '../defs/research.ts'
import {skuItem} from './item.ts'
import {Plant} from './plant.ts'
import {Act} from './log.ts'
import {DAY_SECONDS} from './clock.ts'
import {Soil, SOIL_WATER_MID, WEED_CHANCE} from './soil.ts'
import {DT_MAX, POINTS_PER_DAY, pointsForEndedDay, STIPEND, stipendOf, World} from './world.ts'

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
        expect(w.points).toBe(pointsForEndedDay(1))
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

describe('day.points', () => {
    test('An odd ended day grants `POINTS_PER_DAY`. An even ended day grants 0. Ended days 1 through 80 grant 40.', () => {
        expect(pointsForEndedDay(1)).toBe(POINTS_PER_DAY)
        expect(pointsForEndedDay(2)).toBe(0)
        expect(pointsForEndedDay(80)).toBe(0)
        const w = new World(1)
        for (let d = 1; d <= 80; d++) {
            w.clock.t = DAY_SECONDS - 0.001
            w.tick(DT_MAX)
            expect(w.points).toBe(Math.ceil(d / 2))
        }
        expect(w.points).toBe(40)
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

describe('day.loan', () => {
    test('End of day, after support, tax, water bill and payback: money under `LOAN_BELOW` with an empty Seed silo puts `LOAN_PACKS` packs of `LOAN_PACK` in the Seed silo, adds `LOAN_CASH` and `LOAN_DAYS` payback days. Each payback day takes `LOAN_PAYBACK`. A second loan adds days, not payback per day.', () => {
        const pack = skuItem(LOAN_PACK)
        if (pack.kind !== 'seeds') throw new Error('pack')
        const w = new World(1)
        w.clock.day = 20
        w.silo.seeds.length = 0
        w.money = 0
        w.clock.t = DAY_SECONDS - 0.001
        w.tick(DT_MAX)
        const first = w.recapAt(20)
        expect(first.loan).toBe(LOAN_CASH)
        expect(first.payback).toBe(0)
        expect(first.loanDays).toBe(LOAN_DAYS)
        expect(w.money).toBeCloseTo(LOAN_CASH - first.tax - first.water, 8)
        expect(w.silo.baseCount(pack.crop)).toBe(LOAN_PACKS * pack.count)

        w.money = LOAN_BELOW
        w.clock.t = DAY_SECONDS - 0.001
        w.tick(DT_MAX)
        const second = w.recapAt(21)
        expect(second.loan).toBe(0)
        expect(second.payback).toBe(LOAN_PAYBACK)
        expect(second.loanDays).toBe(LOAN_DAYS - 1)

        w.silo.seeds.length = 0
        w.money = 0
        w.clock.t = DAY_SECONDS - 0.001
        w.tick(DT_MAX)
        const third = w.recapAt(22)
        expect(third.loan).toBe(LOAN_CASH)
        expect(third.payback).toBe(LOAN_PAYBACK)
        expect(third.loanDays).toBe(2 * LOAN_DAYS - 2)
        expect(w.money).toBeCloseTo(LOAN_CASH - LOAN_PAYBACK - third.tax - third.water, 8)
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
        c.startResearch('unlock-multi-crop')
        const left = RESEARCH['unlock-multi-crop'].seconds
        c.tick(DT_MAX)
        expect(c.job.kind === 'run' && c.job.left).toBeCloseTo(left - DT_MAX, 5)
        expect(c.cheatFastResearch).toBe(false)
    })
})

