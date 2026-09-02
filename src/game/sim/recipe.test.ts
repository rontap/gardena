import { describe, expect, test } from 'vitest'
import {
  BARREL_CAP,
  BARREL_MATURE,
  COMPOST_NEED,
  GRIND_MAX,
  GRIND_MIN,
  JAM_IN,
  JAM_SUGAR,
  MILL_WORK,
  STILL_CAP,
  STILL_SECONDS,
  STILL_WATER,
  SUGAR_BAG,
} from '../defs/items.ts'
import { JAM_CROPS, MILL_RECIPES, STILL_CROPS } from './ids.ts'
import { millNeed } from './machine.ts'
import { CompostBox, Grinder, JamMachine, Mill, PotStill, WineBarrel } from './building.ts'
import { MACHINE_IDS, craftState, recipesOf } from './recipe.ts'
import type { Ingredient, Recipe } from './recipe.ts'

const BASE = { shape: 'rect', col: 10, row: 12, w: 1, h: 1 } as const

function litersOf(inputs: readonly Ingredient[]): readonly number[] {
  return inputs.flatMap(i => (i.amount.kind === 'liters' ? [i.amount.l] : []))
}

function unitsOf(input: Ingredient): number {
  return input.amount.kind === 'units' ? input.amount.n : -1
}

describe('recipes.table', () => {
  test('every machine enumerates at least one recipe', () => {
    MACHINE_IDS.forEach(m => expect(recipesOf(m).length).toBeGreaterThan(0))
  })

  test('row counts follow the id arrays', () => {
    expect(recipesOf('mill').length).toBe(MILL_RECIPES.length)
    expect(recipesOf('jam').length).toBe(JAM_CROPS.length)
    expect(recipesOf('still').length).toBe(STILL_CROPS.length + 1)
    expect(recipesOf('barrel').length).toBe(1)
  })

  test('mill inputs equal millNeed for every recipe', () => {
    recipesOf('mill').forEach((r: Recipe, i) => {
      expect(unitsOf(r.inputs[0])).toBe(millNeed(MILL_RECIPES[i]))
      expect(r.duration).toEqual({ kind: 'work', seconds: MILL_WORK })
    })
  })

  test('mill yields sugar in liters and flour in units', () => {
    const cane = recipesOf('mill')[MILL_RECIPES.indexOf('sugar-cane')]
    expect(cane.out).toMatchObject({ kind: 'exact', amount: { kind: 'liters', l: SUGAR_BAG } })
    const wheat = recipesOf('mill')[MILL_RECIPES.indexOf('wheat')]
    expect(wheat.out).toMatchObject({ kind: 'exact', amount: { kind: 'units', n: 1 } })
  })

  test('every still recipe carries water and a full charge', () => {
    recipesOf('still').forEach(r => {
      expect(litersOf(r.inputs)).toEqual([STILL_WATER])
      expect(unitsOf(r.inputs[0])).toBe(STILL_CAP)
      expect(r.duration).toEqual({ kind: 'fixed', seconds: STILL_SECONDS })
    })
  })

  test('jam carries fruit units and a sugar charge', () => {
    recipesOf('jam').forEach(r => {
      expect(unitsOf(r.inputs[0])).toBe(JAM_IN)
      expect(litersOf(r.inputs)).toEqual([JAM_SUGAR])
    })
  })

  test('grinder yields the seed range', () => {
    expect(recipesOf('grinder')[0].out).toMatchObject({ kind: 'range', min: GRIND_MIN, max: GRIND_MAX })
  })

  test('compost counts waste, not items', () => {
    expect(recipesOf('compost-box')[0].inputs[0].amount).toEqual({ kind: 'waste', n: COMPOST_NEED })
  })

  test('barrel ages rather than works', () => {
    expect(recipesOf('barrel')[0].duration).toEqual({ kind: 'age', seconds: BARREL_MATURE })
  })
})

describe('recipes.state', () => {
  test('a fresh machine is idle', () => {
    expect(craftState(new Mill(BASE), 1).kind).toBe('idle')
    expect(craftState(new JamMachine(BASE), 1).kind).toBe('idle')
    expect(craftState(new PotStill(BASE), 1).kind).toBe('idle')
  })

  test('a part-filled mill reports the shortfall', () => {
    const mill = new Mill(BASE)
    mill.recipe = 'wheat'
    mill.units = 2
    const craft = craftState(mill, 1)
    expect(craft).toMatchObject({ kind: 'filling', at: 0, have: 2, need: millNeed('wheat') })
  })

  test('a fed mill works', () => {
    const mill = new Mill(BASE)
    mill.recipe = 'wheat'
    mill.units = millNeed('wheat')
    expect(craftState(mill, 1).kind).toBe('working')
  })

  test('inn freezes the mill', () => {
    const mill = new Mill(BASE)
    mill.recipe = 'wheat'
    mill.units = millNeed('wheat')
    mill.inn = 1
    expect(craftState(mill, 1).kind).toBe('paused')
  })

  test('a full still with no progress is thirsty', () => {
    const still = new PotStill(BASE)
    still.feed = [{ crop: 'potato', rarity: 'common', count: STILL_CAP }]
    expect(craftState(still, 1).kind).toBe('thirsty')
  })

  test('a running still pins to its spirit', () => {
    const still = new PotStill(BASE)
    still.feed = [{ crop: 'potato', rarity: 'common', count: STILL_CAP }]
    still.progress = 0.5
    const craft = craftState(still, 1)
    expect(craft.kind).toBe('working')
    expect(craft.kind === 'working' && craft.recipe.out.face).toMatchObject({ kind: 'spirit', spirit: 'vodka' })
  })

  test('a mixed still pins to the mixed row', () => {
    const still = new PotStill(BASE)
    still.feed = [
      { crop: 'potato', rarity: 'common', count: 5 },
      { crop: 'wheat', rarity: 'common', count: 5 },
    ]
    still.progress = 0.5
    const craft = craftState(still, 1)
    expect(craft.kind === 'working' && craft.recipe.out.face).toMatchObject({ kind: 'spirit', spirit: 'mixed' })
  })

  test('jam short on sugar points at the sugar input', () => {
    const jam = new JamMachine(BASE)
    jam.crop = 'grape'
    jam.fruit = JAM_IN
    jam.sugar = 0
    expect(craftState(jam, 1)).toMatchObject({ kind: 'filling', at: 1, have: 0, need: JAM_SUGAR })
  })

  test('a barrel counts down to maturity', () => {
    const barrel = new WineBarrel(BASE)
    barrel.feed = [{ rarity: 'common', count: BARREL_CAP }]
    const craft = craftState(barrel, 1)
    expect(craft).toMatchObject({ kind: 'working', progress: 0, left: BARREL_MATURE })
  })

  test('an empty compost box is filling', () => {
    expect(craftState(new CompostBox(BASE), 1)).toMatchObject({ kind: 'filling', have: 0, need: COMPOST_NEED })
  })

  test('a grinder pins to its locked crop', () => {
    const g = new Grinder(BASE)
    g.crop = 'potato'
    g.units = 1
    const craft = craftState(g, 1)
    expect(craft.kind === 'working' && craft.recipe.out.face).toMatchObject({ kind: 'seeds', crop: 'potato' })
  })
})

describe('recipes.haste', () => {
  test('machinery speeds a mill but not a still', () => {
    const mill = new Mill(BASE)
    mill.recipe = 'wheat'
    mill.units = millNeed('wheat')
    const milled = craftState(mill, 1.1)
    expect(milled.kind === 'working' && milled.left).toBeCloseTo(MILL_WORK / 1.1)

    const still = new PotStill(BASE)
    still.feed = [{ crop: 'potato', rarity: 'common', count: STILL_CAP }]
    still.progress = 0.5
    const distilled = craftState(still, 1.1)
    expect(distilled.kind === 'working' && distilled.left).toBeCloseTo(STILL_SECONDS * 0.5)
  })
})
