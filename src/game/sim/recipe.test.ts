// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import {
  BARREL_CAP,
  BARREL_MATURE,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_VALUE,
  GRIND_MAX,
  GRIND_MIN,
  EXTRACT,
  JAM_IN,
  JAM_SUGAR,
  MILL_VANILLA_IN,
  MILL_VANILLA_OUT,
  MILL_WORK,
  STILL_CAP,
  STILL_SECONDS,
  STILL_WATER,
  SUGAR_BAG,
} from '../defs/items.ts'
import { ANNUAL_IDS, BARREL_CROPS, JAM_CROPS, MILL_RECIPES, STILL_CROPS, TREE_IDS, type CropId } from './ids.ts'
import { barrelNeed, millNeed } from './machine.ts'
import { Barrel, CompostBox, Grinder, JamMachine, Mill, PotStill } from './building.ts'
import { MACHINE_IDS, clockText, craftState, recipesOf, recipesUsing } from './recipe.ts'
import type { Ingredient, Recipe } from './recipe.ts'
import type { Face } from './item.ts'

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
    expect(recipesOf('barrel').length).toBe(BARREL_CROPS.length)
    expect(recipesOf('grinder').length).toBe(1)
    expect(recipesOf('compost-box').length).toBe(3)
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

  test('mill vanilla 2 fruit to 3 extract', () => {
    const vanilla = recipesOf('mill')[MILL_RECIPES.indexOf('vanilla')]
    expect(unitsOf(vanilla.inputs[0])).toBe(MILL_VANILLA_IN)
    expect(vanilla.out).toMatchObject({
      kind: 'exact',
      face: { kind: 'extract', count: MILL_VANILLA_OUT, unitSale: EXTRACT },
      amount: { kind: 'units', n: MILL_VANILLA_OUT },
    })
  })

  test('jam has no apple', () => {
    expect(JAM_CROPS).not.toContain('apple')
  })

  test('every still recipe carries water and a full charge', () => {
    recipesOf('still').forEach(r => {
      expect(litersOf(r.inputs)).toEqual([STILL_WATER])
      expect(unitsOf(r.inputs[0])).toBe(STILL_CAP)
      expect(r.inputs[1]).toMatchObject({ kind: 'one', face: { kind: 'water' } })
      expect(r.duration).toEqual({ kind: 'fixed', seconds: STILL_SECONDS })
    })
  })

  test('jam carries fruit units and a sugar charge', () => {
    recipesOf('jam').forEach(r => {
      expect(unitsOf(r.inputs[0])).toBe(JAM_IN)
      expect(litersOf(r.inputs)).toEqual([JAM_SUGAR])
    })
  })

  test('grinder yields the seed range in lockstep with annual fruit', () => {
    const row = recipesOf('grinder')[0]
    const input = row.inputs[0]
    expect(row.out).toMatchObject({ kind: 'range', min: GRIND_MIN, max: GRIND_MAX })
    expect(input.kind).toBe('any')
    expect(row.out.kind).toBe('range')
    if (input.kind !== 'any' || row.out.kind !== 'range') return
    expect(input.faces.map(f => (f.kind === 'fruit' ? f.crop : ''))).toEqual([...ANNUAL_IDS])
    expect(row.out.faces.map(f => (f.kind === 'seeds' ? f.crop : ''))).toEqual([...ANNUAL_IDS])
  })

  test('Compost lists three recipes. Fruit: any `CropId`. Green: weed, grass. Rotten: `CropClass` faces, amount `COMPOST_NEED / COMPOST_VALUE.rotten` (5). Sim still counts `COMPOST_NEED` waste. Empty box cycles all list rows.', () => {
    const [fruit, green, rotten] = recipesOf('compost-box')
    expect(recipesOf('compost-box').length).toBe(3)
    expect(fruit.inputs[0].kind).toBe('any')
    expect(green.inputs[0].kind).toBe('any')
    expect(rotten.inputs[0].kind).toBe('any')
    if (fruit.inputs[0].kind !== 'any' || green.inputs[0].kind !== 'any' || rotten.inputs[0].kind !== 'any') return
    expect(fruit.inputs[0].faces.map(f => (f.kind === 'fruit' ? f.crop : ''))).toEqual([...ANNUAL_IDS, ...TREE_IDS])
    expect(green.inputs[0].faces.map(f => f.kind)).toEqual(['weed', 'grass'])
    expect(rotten.inputs[0].faces.map(f => (f.kind === 'rotten' ? f.cls : ''))).toEqual(['root', 'grain', 'fruit'])
    expect(unitsOf(fruit.inputs[0])).toBe(COMPOST_NEED / COMPOST_VALUE.fruit)
    expect(unitsOf(green.inputs[0])).toBe(COMPOST_NEED / COMPOST_VALUE.weed)
    expect(unitsOf(rotten.inputs[0])).toBe(COMPOST_NEED / COMPOST_VALUE.rotten)
    expect(unitsOf(rotten.inputs[0])).toBe(5)
    expect(fruit.out).toMatchObject({ kind: 'exact', amount: { kind: 'liters', l: COMPOST_LITERS } })
    expect(green.out).toMatchObject({ kind: 'exact', amount: { kind: 'liters', l: COMPOST_LITERS } })
    expect(rotten.out).toMatchObject({ kind: 'exact', amount: { kind: 'liters', l: COMPOST_LITERS } })
  })

  test('clockText is seconds', () => {
    expect(clockText(15)).toBe('15 sec')
    expect(clockText(60)).toBe('60 sec')
    expect(clockText(BARREL_MATURE)).toBe(`${BARREL_MATURE} sec`)
  })

  test('barrel ages rather than works', () => {
    expect(recipesOf('barrel')[0].duration).toEqual({ kind: 'age', seconds: BARREL_MATURE })
    expect(recipesOf('barrel').map(r => unitsOf(r.inputs[0]))).toEqual(BARREL_CROPS.map(barrelNeed))
    expect(barrelNeed('apple')).toBe(4)
    expect(barrelNeed('grape')).toBe(5)
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
    expect(craft.kind === 'working' && craft.recipe.out).toMatchObject({
      kind: 'exact',
      face: { kind: 'spirit', spirit: 'vodka' },
    })
  })

  test('a mixed still pins to the mixed row', () => {
    const still = new PotStill(BASE)
    still.feed = [
      { crop: 'potato', rarity: 'common', count: 5 },
      { crop: 'wheat', rarity: 'common', count: 5 },
    ]
    still.progress = 0.5
    const craft = craftState(still, 1)
    expect(craft.kind === 'working' && craft.recipe.out).toMatchObject({
      kind: 'exact',
      face: { kind: 'spirit', spirit: 'mixed' },
    })
  })

  test('jam short on sugar points at the sugar input', () => {
    const jam = new JamMachine(BASE)
    jam.crop = 'grape'
    jam.fruit = JAM_IN
    jam.sugar = 0
    expect(craftState(jam, 1)).toMatchObject({ kind: 'filling', at: 1, have: 0, need: JAM_SUGAR })
  })

  test('a barrel counts down to maturity', () => {
    const barrel = new Barrel(BASE)
    barrel.crop = 'grape'
    barrel.feed = [{ rarity: 'common', count: BARREL_CAP }]
    const craft = craftState(barrel, 1)
    expect(craft).toMatchObject({ kind: 'working', progress: 0, left: BARREL_MATURE })
  })

  test('an empty compost box is idle', () => {
    expect(craftState(new CompostBox(BASE), 1).kind).toBe('idle')
  })

  test('a part-filled compost box reports waste', () => {
    const box = new CompostBox(BASE)
    box.units = 3
    expect(craftState(box, 1)).toMatchObject({ kind: 'filling', have: 3, need: COMPOST_NEED })
  })

  test('a grinder pins to its locked crop', () => {
    const g = new Grinder(BASE)
    g.crop = 'potato'
    g.units = 1
    const craft = craftState(g, 1)
    expect(craft.kind === 'working' && craft.recipe.out.kind === 'range' && craft.recipe.out.faces[0]).toMatchObject({
      kind: 'seeds',
      crop: 'potato',
    })
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

function fruit(crop: CropId): Face {
  return { kind: 'fruit', crop, rarity: 'rare', count: 1, unitSale: 0, freshness: 0.2, bio: true }
}

function outKind(r: Recipe): string {
  if (r.out.kind !== 'exact') return r.out.kind
  return r.out.face.kind === 'spirit' ? r.out.face.spirit : r.out.face.kind === 'cask' ? r.out.face.cask : r.out.face.kind
}

describe('machines.recipes-using', () => {
  test('`recipesUsing(face)` matches `one` inputs by kind+identity. Skip `any` (mixed still, grinder, compost). Still / jam fruit `one` matches even when water / sugar is a second `one`. Almanac Ingredients is this list, gated by machine unlock in `done`. No hardcoded crop→product plates on the fruit row.', () => {
    expect(recipesUsing(fruit('wheat')).map(r => [r.machine, outKind(r)])).toEqual([
      ['mill', 'flour'],
      ['still', 'beer'],
    ])
    expect(recipesUsing(fruit('apricot')).map(r => [r.machine, outKind(r)])).toEqual([
      ['jam', 'jam'],
      ['still', 'brandy'],
    ])
    expect(recipesUsing(fruit('vanilla')).map(r => [r.machine, outKind(r)])).toEqual([['mill', 'extract']])
    expect(recipesUsing(fruit('sugar-cane')).map(r => [r.machine, outKind(r)])).toEqual([['mill', 'sugar']])
    expect(recipesUsing(fruit('apple')).map(r => [r.machine, outKind(r)])).toEqual([['barrel', 'cider']])
    expect(recipesUsing(fruit('olive')).map(r => [r.machine, outKind(r)])).toEqual([['mill', 'oil']])
    expect(recipesUsing(fruit('grape')).map(r => [r.machine, outKind(r)])).toEqual([
      ['jam', 'jam'],
      ['barrel', 'wine'],
    ])
    expect(recipesUsing(fruit('carrot'))).toEqual([])
    expect(recipesUsing(fruit('potato')).map(r => [r.machine, outKind(r)])).toEqual([['still', 'vodka']])
    expect(recipesUsing({ kind: 'grass', count: 1 }).map(r => r.machine)).toEqual(['mill'])
    expect(recipesUsing({ kind: 'weed', count: 1 })).toEqual([])
    expect(recipesUsing({ kind: 'water' })).toEqual(recipesOf('still'))
    expect(recipesUsing({ kind: 'sugar', liters: 1, capacityLiters: 1, unitSale: 0 })).toEqual(recipesOf('jam'))
  })
})
