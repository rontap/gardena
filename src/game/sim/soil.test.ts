// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import {describe, expect, test} from 'vitest'
import {DIG_HARD_SPAN} from '../defs/items.ts'
import {DOOR, HOUSE_BASE, Rock} from './building.ts'
import {Soil} from './soil.ts'
import {bare, isPavingSite} from './plot.ts'
import {goodness, groundOf, hardnessOf, HARD_MAX} from './noise.ts'
import {World} from './world.ts'

const AT = {col: 10, row: 12}

describe('soil.hardness', () => {
    test('soil.hardness - untilled carries a continuous hardness alongside its tier, and the two never disagree: groundOf(1 - hardness) === ground. Generation writes 1 - goodness. Clearing a rock or a tree writes the soft baseline 0.', () => {
        const w = new World(7)
        for (let col = 4; col < 28; col++) {
            for (let row = 4; row < 28; row++) {
                const c = w.cell({col, row})
                if (c.kind !== 'untilled') continue
                expect(groundOf(1 - c.hardness)).toBe(c.ground)
                if (Math.hypot(col - DOOR.col, row - DOOR.row) <= 12) continue
                expect(c.hardness).toBeCloseTo(hardnessOf(goodness(w.rng, col, row)), 10)
            }
        }
        const soft = bare('soft', 0)
        expect(soft.kind === 'untilled' && soft.hardness).toBe(0)
        expect(groundOf(1 - 0)).toBe('soft')
    })

    test('soil.dig - shovel time is workSeconds x (1 + DIG_HARD_SPAN x hardness). No step at a tier boundary: two cells either side of HARD_MAX differ by the noise, not by the tier.', () => {
        const w = new World()
        const dig = (hardness: number) => {
            w.seats[0].hand = {kind: 'hold', item: {kind: 'shovel', id: 'shovel', usesLeft: 40, workSeconds: 1}}
            w.setCell(AT, bare(groundOf(1 - hardness), hardness))
            w.seats[0].actor.x = 10.5
            w.seats[0].actor.y = 12.5
            w.click(AT)
            const head = w.seats[0].queue[0]
            expect(head).toBeDefined()
            w.tick(1 / 60)
            const total = w.seats[0].workTotal
            w.seats[0].queue.length = 0
            w.seats[0].workLeft = 0
            w.seats[0].workTotal = 0
            return total
        }
        expect(dig(0)).toBeCloseTo(1, 5)
        expect(dig(0.4)).toBeCloseTo(1 + DIG_HARD_SPAN * 0.4, 5)
        const justSoft = 1 - HARD_MAX - 0.001
        const justHard = 1 - HARD_MAX + 0.001
        expect(Math.abs(dig(justHard) - dig(justSoft))).toBeLessThan(0.01)
    })
})

describe('tiles.paving', () => {
    test('tiles.paving - Paving is `World.paving`, not a `Cover`. It survives under a building and is deleted only once nothing stands on the cell: fence, then building, then paving.', () => {
        const w = new World(1)
        w.unlockAll()
        const at = {col: 10, row: 20}
        w.setCell(at, bare('soft', 0))
        w.money = 999
        w.buy('buy-tile-paved')
        w.confirmPlace(at)
        expect(w.pavingAt(at)).toBe('paved')
        expect(w.cell(at).kind).toBe('untilled')

        w.money = 999
        w.buy('buy-chest')
        w.confirmPlace(at)
        expect(w.cell(at).kind).toBe('chest')
        expect(w.pavingAt(at)).toBe('paved')

        w.armDelete()
        w.confirmPlace(at)
        expect(w.cell(at).kind).toBe('empty')
        expect(w.pavingAt(at)).toBe('paved')

        w.setCell(at, bare('soft', 0))
        w.armDelete()
        w.confirmPlace(at)
        expect(w.pavingAt(at)).toBe('none')
    })

    test('tiles.paving-site - Paving lays on any untilled cell or under a solid building, never on tilled soil, a burrow, a rock or a tree. Paving over paving replaces it.', () => {
        const w = new World(1)
        w.unlockAll()
        const soft = {col: 10, row: 21}
        const tilled = {col: 11, row: 21}
        w.setCell(soft, bare('soft', 0))
        w.setCell(tilled, {kind: 'empty', soil: new Soil(1, 1, 0.03)})
        expect(isPavingSite(w.cell(soft))).toBe(true)
        expect(isPavingSite(w.cell(tilled))).toBe(false)
        expect(isPavingSite(w.cell({col: HOUSE_BASE.col, row: HOUSE_BASE.row}))).toBe(true)
        expect(isPavingSite(new Rock({shape: 'rect', col: 0, row: 0, w: 1, h: 1}))).toBe(false)
        w.money = 999
        w.buy('buy-tile-cobble')
        w.confirmPlace(soft)
        expect(w.pavingAt(soft)).toBe('cobble')
        w.money = 999
        w.buy('buy-tile-asphalt')
        w.confirmPlace(soft)
        expect(w.pavingAt(soft)).toBe('asphalt')
        w.money = 999
        w.buy('buy-tile-paved')
        w.confirmPlace(tilled)
        expect(w.pavingAt(tilled)).toBe('none')
    })
})

