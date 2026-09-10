import { describe, expect, test } from 'vitest'
import { CROPS } from './crops.ts'
import { ANNUAL_IDS, TREE_IDS, type CropId } from '../sim/ids.ts'
import { statsOf } from '../sim/modifiers.ts'
import { Plant } from '../sim/plant.ts'
import { Tree } from '../sim/building.ts'
import {
  CROSSBREED_VAR_BONUS,
  EXPERIENCED_VAR_BONUS,
  MAX_QUALITY_VAR_IMPACT,
  nextVariety,
  PURPOSE_MUL,
  purposeMul,
  qualityMul,
  tierOf,
  VARIETIES,
  VARIETY,
  varietyChance,
  varietyFits,
  type Purpose,
  type VarietyId,
} from './varieties.ts'

describe('variety.ladder', () => {
  test("`nextVariety` is the rung above: `'base'` to that crop's `variant`, or straight to its `heirloom` when it has no `variant`; `variant` to `heirloom`. `heirloom` and a crop that lists only `'base'` have no next rung.", () => {
    expect(nextVariety('potato', 'base')).toBe('bintje')
    expect(nextVariety('potato', 'bintje')).toBeUndefined()
    expect(nextVariety('tomato', 'base')).toBe('green-zebra')
    expect(nextVariety('tomato', 'green-zebra')).toBe('san-marzano')
    expect(nextVariety('tomato', 'san-marzano')).toBeUndefined()
    expect(nextVariety('raspberry', 'base')).toBe('black-raspberry')
    expect(nextVariety('cherry', 'base')).toBe('bing')
    expect(nextVariety('carrot', 'base')).toBeUndefined()
    expect(nextVariety('vanilla', 'base')).toBeUndefined()
    expect(nextVariety('chilli', 'base')).toBeUndefined()
    expect(nextVariety('sugar-cane', 'base')).toBeUndefined()
    const crops = [...ANNUAL_IDS, ...TREE_IDS] as CropId[]
    for (const crop of crops) {
      const next = nextVariety(crop, 'base')
      if (next !== undefined) expect(VARIETIES[crop]).toContain(next)
      for (const v of VARIETIES[crop]) {
        if (tierOf(v) === 'heirloom') expect(nextVariety(crop, v)).toBeUndefined()
      }
    }
  })

  test('`varietyChance` is `quality squared x MAX_QUALITY_VAR_IMPACT`, plus `EXPERIENCED_VAR_BONUS` when the player owns that crop skill, plus `CROSSBREED_VAR_BONUS` when a different Variety of that crop is in reach. Nothing else moves it.', () => {
    expect(varietyChance(0, false, false)).toBe(0)
    expect(varietyChance(1, false, false)).toBeCloseTo(MAX_QUALITY_VAR_IMPACT, 12)
    expect(varietyChance(0.5, false, false)).toBeCloseTo(0.25 * MAX_QUALITY_VAR_IMPACT, 12)
    expect(varietyChance(0, true, false)).toBeCloseTo(EXPERIENCED_VAR_BONUS, 12)
    expect(varietyChance(0, false, true)).toBeCloseTo(CROSSBREED_VAR_BONUS, 12)
    expect(varietyChance(1, true, true)).toBeCloseTo(
      MAX_QUALITY_VAR_IMPACT + EXPERIENCED_VAR_BONUS + CROSSBREED_VAR_BONUS,
      12,
    )
    expect(varietyChance(1, true, true)).toBeGreaterThan(varietyChance(1, true, false))
  })
})

describe('variety.identity', () => {
  test("`Plant.variety`, `Tree.variety`, and `variety` on seeds, fruit, grafts are required `VarietyId`. Illegal: optional `variety`. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's `crop`. `'base'` is legal on every `CropId`. Set at plant. Graft is the only later change.", () => {
    const crops = [...ANNUAL_IDS, ...TREE_IDS] as CropId[]
    for (const crop of crops) {
      expect(varietyFits(crop, 'base')).toBe(true)
      expect(VARIETIES[crop][0]).toBe('base')
      expect(VARIETIES[crop].filter(v => tierOf(v) === 'variant').length).toBeLessThanOrEqual(1)
      expect(VARIETIES[crop].filter(v => tierOf(v) === 'heirloom').length).toBeLessThanOrEqual(1)
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
    expect(statsOf('tomato', 'san-marzano', 1, []).sale).toBe(
      CROPS.tomato.sale * qualityMul(1) * PURPOSE_MUL.heirloom.off,
    )
    expect(statsOf('cherry', 'bing', 1, []).sale).toBe(CROPS.cherry.sale * qualityMul(1) * PURPOSE_MUL.heirloom.on)
    expect(statsOf('vanilla', 'base', 0, []).sale).toBe(CROPS.vanilla.sale)
    expect(statsOf('vanilla', 'base', 0, []).sale).toBe(CROPS.raspberry.sale)
  })
})

describe('variety.purpose', () => {
  test("Every named Variety has exactly one `purpose`. `purposeMul` pays `PURPOSE_MUL[tier].on` on that purpose and `.off` on the other two; `'base'` is 1 everywhere. Six heirlooms, two per purpose.", () => {
    const paths: Purpose[] = ['produce', 'processed', 'alcohol']
    for (const path of paths) expect(purposeMul('base', path)).toBe(1)
    const named = Object.keys(VARIETY) as Exclude<VarietyId, 'base'>[]
    for (const v of named) {
      const { tier, purpose } = VARIETY[v]
      expect(purposeMul(v, purpose)).toBe(PURPOSE_MUL[tier].on)
      for (const path of paths) {
        if (path !== purpose) expect(purposeMul(v, path)).toBe(PURPOSE_MUL[tier].off)
      }
    }
    const heirlooms = named.filter(v => VARIETY[v].tier === 'heirloom')
    expect(heirlooms).toHaveLength(6)
    for (const path of paths) expect(heirlooms.filter(v => VARIETY[v].purpose === path)).toHaveLength(2)
  })
})
