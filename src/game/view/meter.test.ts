import { describe, expect, test } from 'vitest'
import { BARREL_CAP, COMPOST_NEED, FURNACE_NEED, FUEL_BATCH, INFUSE_IN, INFUSE_REAGENT, JAM_IN, STILL_CAP } from '../defs/items.ts'
import { Barrel, CompostBox, Furnace, Grinder, Infuser, JamMachine, Mill, PotStill, Refuel } from '../sim/building.ts'
import { millNeed } from '../sim/feature-machines/machine.ts'
import { meterOf } from './meter.ts'

const BASE = { shape: 'rect', col: 10, row: 12, w: 1, h: 1 } as const

describe('meter', () => {
  test('a working batch shows its progress; filling, paused, thirsty, ready and idle do not', () => {
    const mill = new Mill(BASE)
    expect(meterOf(mill, 1, 1)).toEqual({ show: false })
    mill.recipe = 'wheat'
    mill.units = 2
    expect(meterOf(mill, 1, 1)).toEqual({ show: false })
    mill.units = millNeed('wheat')
    mill.progress = 0.4
    expect(meterOf(mill, 1, 1)).toEqual({ show: true, t: 0.4 })
    mill.inn = 1
    expect(meterOf(mill, 1, 1)).toEqual({ show: false })

    const still = new PotStill(BASE)
    still.load = { kind: 'spirit', feed: [{ crop: 'potato', variety: 'base', quality: 0, count: STILL_CAP }] }
    expect(meterOf(still, 1, 1)).toEqual({ show: false })
    still.progress = 0.5
    expect(meterOf(still, 1, 1)).toEqual({ show: true, t: 0.5 })

    const box = new CompostBox(BASE)
    box.units = 3
    expect(meterOf(box, 1, 1)).toEqual({ show: false })
    box.units = COMPOST_NEED
    box.progress = 0.25
    expect(meterOf(box, 1, 1)).toEqual({ show: true, t: 0.25 })

    const furnace = new Furnace(BASE)
    furnace.recipe = 'ash'
    furnace.units = FURNACE_NEED
    furnace.progress = 0.3
    expect(meterOf(furnace, 1, 1)).toEqual({ show: true, t: 0.3 })
    furnace.progress = 1
    expect(meterOf(furnace, 1, 1)).toEqual({ show: false })

    const jam = new JamMachine(BASE)
    jam.crop = 'tomato'
    jam.variety = 'san-marzano'
    jam.fruit = JAM_IN
    jam.progress = 0.2
    expect(meterOf(jam, 1, 1)).toEqual({ show: true, t: 0.2 })

    const grinder = new Grinder(BASE)
    grinder.crop = 'potato'
    grinder.units = 1
    grinder.progress = 0.6
    expect(meterOf(grinder, 1, 1)).toEqual({ show: true, t: 0.6 })

    const infuser = new Infuser(BASE)
    infuser.lock = { kind: 'jam', crop: 'grape', variety: 'base' }
    infuser.units = INFUSE_IN
    infuser.reagents.flakes = INFUSE_REAGENT
    infuser.progress = 0.7
    expect(meterOf(infuser, 1, 1)).toEqual({ show: true, t: 0.7 })

    const barrel = new Barrel(BASE)
    barrel.crop = 'grape'
    barrel.feed = [{ variety: 'base', quality: 0, count: BARREL_CAP }]
    barrel.age = 1
    expect(meterOf(barrel, 1, 1)).toEqual({ show: false })

    const refuel = new Refuel(BASE)
    refuel.units = FUEL_BATCH
    refuel.progress = 0.4
    expect(meterOf(refuel, 1, 1)).toEqual({ show: false })
  })
})
