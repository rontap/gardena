import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import type { ResearchId } from '../sim/ids.ts'
import { SKILLS } from './skills.ts'
import { RESEARCH, SKUS } from './research.ts'
import { World } from '../sim/world.ts'

describe('research i18n', () => {
  test('RESEARCH[id].name and .blurb and SKILLS[id].name/.blurb become calls to `m.*`', () => {
    const ids = Object.keys(RESEARCH) as ResearchId[]
    for (const id of ids) {
      const stem = id.replaceAll('-', '_')
      const bag = m as unknown as Record<string, () => string>
      expect(RESEARCH[id].name, id).toBe(bag[`research_${stem}_name`]())
      expect(RESEARCH[id].blurb, id).toBe(bag[`research_${stem}_blurb`]())
    }
  })
})

describe('research.variants', () => {
  test("`unlock-crop-variants` plants, cost 16, 40s, `reveal` tomato | grape | irrigation, `effect` `feature`. Ladder effects die: shop packs `'base'` quality 0 with or without it; ripen does not roll; silo does not hide columns. `buy-research-station` unlock and show that row. `unlock-heirloom` `requires` it. Both rows stay.", () => {
    expect(RESEARCH['unlock-crop-variants']).toMatchObject({
      tree: 'plants',
      cost: 16,
      seconds: 40,
      reveal: ['unlock-tomato', 'unlock-grape', 'unlock-irrigation'],
      requires: [],
      effect: { kind: 'feature' },
    })
    expect(RESEARCH['unlock-heirloom'].requires).toEqual(['unlock-crop-variants'])
    expect(SKUS['buy-research-station']).toMatchObject({
      unlock: 'unlock-crop-variants',
      show: 'unlock-crop-variants',
    })
    const shown = new World(1)
    expect(shown.skuShown('buy-research-station')).toBe(false)
    expect(shown.skuOpen('buy-research-station')).toBe(false)
    shown.done.add('unlock-crop-variants')
    expect(shown.skuShown('buy-research-station')).toBe(true)
    expect(shown.skuOpen('buy-research-station')).toBe(true)
    const locked = new World(1)
    expect(locked.buy('pack-wheat')).toBeUndefined()
    expect(locked.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.quality).toBe(0)
    locked.done.add('unlock-crop-variants')
    expect(locked.buy('pack-wheat')).toBeUndefined()
    expect(locked.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.quality).toBe(0)
  })
})

describe('research.start', () => {
  test("Plants start shelf is four: `unlock-fertilizer`, `unlock-tomato`, `unlock-grape`, `unlock-better-tools`. `unlock-better-tools` plants, `reveal: []`. `unlock-grape` `reveal: []`, cost 12, seconds 40 — preference. `pack-grape` unlock `unlock-grape`, show `start`. Pack is not free on day 1. Land start shelf is `unlock-expand` and `unlock-landscaping` (`reveal: []`).", () => {
    expect(RESEARCH['unlock-better-tools']).toMatchObject({ tree: 'plants', reveal: [] })
    expect(RESEARCH['unlock-grape']).toMatchObject({ reveal: [], cost: 12, seconds: 40 })
    expect(SKUS['pack-grape']).toMatchObject({ unlock: 'unlock-grape', show: 'start' })
    expect(RESEARCH['unlock-expand'].reveal).toEqual([])
    expect(RESEARCH['unlock-landscaping'].reveal).toEqual([])
    const w = new World(1)
    const plants = (Object.keys(RESEARCH) as ResearchId[]).filter(
      id => RESEARCH[id].tree === 'plants' && w.researchShown(id),
    )
    expect(plants).toEqual(['unlock-fertilizer', 'unlock-tomato', 'unlock-grape', 'unlock-better-tools'])
    const land = (Object.keys(RESEARCH) as ResearchId[]).filter(
      id => RESEARCH[id].tree === 'land' && w.researchShown(id),
    )
    expect(land).toEqual(['unlock-expand', 'unlock-landscaping'])
    expect(w.skuOpen('pack-grape')).toBe(false)
  })
})

describe('research.hardened', () => {
  test('`unlock-hardened-tools` land, `reveal` and `requires` `unlock-pickaxe`, cost 100, seconds 20, `effect` `unlock-sku` `buy-better-pickaxe`. `buy-better-pickaxe` unlock + show that row, price 44. `buy-chainsaw` unlock + show that row, price 60. `buy-axe` stays `unlock-pickaxe`.', () => {
    expect(RESEARCH['unlock-hardened-tools']).toMatchObject({
      tree: 'land',
      reveal: ['unlock-pickaxe'],
      requires: ['unlock-pickaxe'],
      cost: 100,
      seconds: 20,
      effect: { kind: 'unlock-sku', sku: 'buy-better-pickaxe' },
    })
    expect(SKUS['buy-better-pickaxe']).toMatchObject({
      unlock: 'unlock-hardened-tools',
      show: 'unlock-hardened-tools',
      price: 44,
    })
    expect(SKUS['buy-chainsaw']).toMatchObject({
      unlock: 'unlock-hardened-tools',
      show: 'unlock-hardened-tools',
      price: 60,
      tab: 'utility',
    })
    expect(SKUS['buy-axe']).toMatchObject({ unlock: 'unlock-pickaxe', show: 'unlock-pickaxe' })
  })
})

describe('research.furnace', () => {
  test('Own trade row, reveal fermentation, gates `buy-furnace`, show `unlock-grinder`. `buy-axe` on `unlock-pickaxe`.', () => {
    expect(RESEARCH['unlock-furnace']).toMatchObject({
      tree: 'trade',
      reveal: ['unlock-fermentation'],
      requires: [],
      effect: { kind: 'unlock-sku', sku: 'buy-furnace' },
    })
    expect(SKUS['buy-furnace']).toMatchObject({ unlock: 'unlock-furnace', show: 'unlock-grinder', tab: 'automation' })
    expect(SKUS['buy-axe']).toMatchObject({ unlock: 'unlock-pickaxe', show: 'unlock-pickaxe', tab: 'utility' })
  })
})

describe('research.gates', () => {
  test('`better-grape` gated on `unlock-grape`. `better-apple` `better-apricot` `better-olive` `better-cherry` gate none. No `better-carrot` `better-vanilla` `better-sugar-cane`. No `unlock-olive`. `machinery` gated on `unlock-grinder`.', () => {
    expect(SKILLS['better-grape'].gate).toEqual({ kind: 'research', id: 'unlock-grape' })
    expect(SKILLS['better-apple'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-apricot'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-olive'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-cherry'].gate).toEqual({ kind: 'none' })
    expect('better-carrot' in SKILLS).toBe(false)
    expect('better-vanilla' in SKILLS).toBe(false)
    expect('better-sugar-cane' in SKILLS).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-olive')).toBe(false)
    expect(SKILLS.machinery.gate).toEqual({ kind: 'research', id: 'unlock-grinder' })
  })
})
