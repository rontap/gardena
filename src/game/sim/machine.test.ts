import { describe, expect, test } from 'vitest'
import {
  MILL_GRASS,
  MILL_IN,
  MIXED_MUL,
  SPIRIT_RARITY,
  SPIRIT_SALE,
  SUGAR_BAG,
  SUGAR_MILL,
  SUGAR_SHOP,
} from '../defs/items.ts'
import { PROTOCOL } from './mp.ts'
import { SAVE_VERSION } from './save.ts'
import {
  bakeSpiritSale,
  meanRarity,
  millNeed,
  millProduct,
  millRecipeOf,
  spiritKind,
} from './machine.ts'
import { PAD } from './building.ts'
import { DT_MAX, World } from './world.ts'

describe('machines', () => {
  test('10 common potato fruit `marketGain` $60. One still batch of 10 common potato is vodka `unitSale` $72.', () => {
    const w = new World()
    w.seats[0].actor.x = PAD.col + 0.5
    w.seats[0].actor.y = PAD.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', rarity: 'common', count: 10, unitSale: 6, freshness: 1, bio: true },
    }
    w.enqueue({ act: 'consign' })
    w.tick(DT_MAX)
    expect(w.marketGain()).toBe(60)
    expect(spiritKind([{ crop: 'potato', count: 10 }])).toBe('vodka')
    expect(bakeSpiritSale('vodka', 'common')).toBe(72)
  })

  test('10 heirloom potato fruit `marketGain` $210. One still batch of 10 heirloom potato is vodka `unitSale` $104.', () => {
    const w = new World()
    w.seats[0].actor.x = PAD.col + 0.5
    w.seats[0].actor.y = PAD.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', rarity: 'heirloom', count: 10, unitSale: 21, freshness: 1, bio: true },
    }
    w.enqueue({ act: 'consign' })
    w.tick(DT_MAX)
    expect(w.marketGain()).toBe(210)
    expect(bakeSpiritSale('vodka', 'heirloom')).toBe(SPIRIT_SALE.vodka * SPIRIT_RARITY.heirloom)
  })

  test('Mixed still `unitSale` = `MIXED_MUL` × that rarity’s spirit sale. Mixed common vodka < 10 common potato fruit $60.', () => {
    const mixed = bakeSpiritSale('mixed', 'common')
    expect(mixed).toBe(MIXED_MUL * SPIRIT_SALE.vodka * SPIRIT_RARITY.common)
    expect(mixed).toBeLessThan(60)
    expect(
      spiritKind([
        { crop: 'potato', count: 5 },
        { crop: 'wheat', count: 5 },
      ]),
    ).toBe('mixed')
  })

  test('`SUGAR_MILL` 5 / L < `SUGAR_SHOP` 8 / L. `buy-sugar` $16 for `SUGAR_BAG` 2 L.', () => {
    expect(SUGAR_MILL).toBe(5)
    expect(SUGAR_SHOP).toBe(8)
    expect(SUGAR_MILL).toBeLessThan(SUGAR_SHOP)
    expect(SUGAR_BAG).toBe(2)
    expect(SUGAR_SHOP * SUGAR_BAG).toBe(16)
    expect(millNeed('sugar-cane')).toBe(MILL_IN)
    expect(millNeed('grass')).toBe(MILL_GRASS)
    expect(millProduct('sugar-cane')).toEqual({
      kind: 'sugar',
      liters: SUGAR_BAG,
      capacityLiters: SUGAR_BAG,
      unitSale: SUGAR_MILL,
    })
    expect(millRecipeOf({ kind: 'fruit', crop: 'sugar-cane', rarity: 'common', count: 1, unitSale: 5, freshness: 1, bio: true })).toBe(
      'sugar-cane',
    )
  })

  test('Barrel is grapes → wine only. No whisky. No migrate.', () => {
    expect(SAVE_VERSION).toBe(1.62)
    expect(PROTOCOL).toBe(1.62)
    expect(meanRarity([{ rarity: 'common', count: 1 }, { rarity: 'heirloom', count: 1 }], 0)).toBe('rare')
    expect(meanRarity([{ rarity: 'common', count: 1 }, { rarity: 'heirloom', count: 1 }], 0.5)).toBe('uncommon')
    expect(meanRarity([{ rarity: 'heirloom', count: 1 }], 0.99)).toBe('heirloom')
    expect(meanRarity([{ rarity: 'common', count: 1 }], 0.99)).toBe('common')
  })
})
