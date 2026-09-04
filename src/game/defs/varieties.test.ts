import { describe, expect, test } from 'vitest'
import { CROPS } from './crops.ts'
import { ANNUAL_IDS, TREE_IDS, type CropId } from '../sim/ids.ts'
import { statsOf } from '../sim/modifiers.ts'
import { Plant } from '../sim/plant.ts'
import { Tree } from '../sim/building.ts'
import {
  BASE_USE,
  qualityMul,
  RATING_SALE,
  VARIETIES,
  VARIETY,
  varietyFits,
  type VarietyId,
} from './varieties.ts'

describe('variety.identity', () => {
  test("`Plant.variety`, `Tree.variety`, and `variety` on seeds, fruit, grafts are required `VarietyId`. Illegal: optional `variety`. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's `crop`. `'base'` is legal on every `CropId`. Set at plant. Graft is the only later change.", () => {
    const crops = [...ANNUAL_IDS, ...TREE_IDS] as CropId[]
    for (const crop of crops) {
      expect(varietyFits(crop, 'base')).toBe(true)
      expect(VARIETIES[crop][0]).toBe('base')
      expect(BASE_USE[crop].fresh).toBe(3)
    }
    const named = Object.keys(VARIETY) as Exclude<VarietyId, 'base'>[]
    for (const v of named) {
      expect(VARIETIES[VARIETY[v].crop]).toContain(v)
      expect(varietyFits(VARIETY[v].crop, v)).toBe(true)
      for (const crop of crops) {
        if (crop !== VARIETY[v].crop) expect(varietyFits(crop, v)).toBe(false)
      }
    }
    const plant = new Plant('potato', 'bintje', 0)
    expect(plant.variety).toBe('bintje')
    expect(varietyFits(plant.crop, plant.variety)).toBe(true)
    const tree = new Tree('apple', { shape: 'rect', col: 0, row: 0, w: 1, h: 2 })
    tree.variety = 'pink-lady'
    expect(tree.variety).toBe('pink-lady')
    expect(varietyFits(tree.species, tree.variety)).toBe(true)
    const seeds: { crop: 'wheat'; variety: VarietyId } = { crop: 'wheat', variety: 'red-fife' }
    expect(varietyFits(seeds.crop, seeds.variety)).toBe(true)
    const fruit: { crop: 'grape'; variety: VarietyId } = { crop: 'grape', variety: 'concord' }
    expect(varietyFits(fruit.crop, fruit.variety)).toBe(true)
  })
})

describe('quality.sale', () => {
  test('Fruit sale is `CROPS.sale × qualityMul(quality) × RATING_SALE[use.fresh] × Π saleMul`. `qualityMul(0)` matches today\'s `\'base\'` sale.', () => {
    expect(qualityMul(0)).toBe(1)
    expect(statsOf('carrot', 'base', 0, []).sale).toBe(CROPS.carrot.sale)
    expect(statsOf('potato', 'base', 0, []).sale).toBe(CROPS.potato.sale)
    const mods = [{ id: 'better-potato', source: 'skill' as const, crop: 'potato' as const, saleMul: 1.04, growSpeed: 1, waterUseMul: 1 }]
    expect(statsOf('potato', 'base', 0, mods).sale).toBe(CROPS.potato.sale * 1.04)
    expect(statsOf('potato', 'russian-banana', 1, []).sale).toBe(
      CROPS.potato.sale * qualityMul(1) * RATING_SALE[5],
    )
    expect(statsOf('vanilla', 'base', 0, []).sale).toBe(CROPS.vanilla.sale)
    expect(statsOf('vanilla', 'base', 0, []).sale).toBeLessThan(CROPS.raspberry.sale)
  })
})
