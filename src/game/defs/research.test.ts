import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import type { ResearchId } from '../sim/ids.ts'
import { SKILLS } from './skills.ts'
import { RESEARCH, SKUS } from './research.ts'
import { PAD } from '../sim/building.ts'
import { DT_MAX, World } from '../sim/world.ts'

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

describe('research.job', () => {
  test('One research job; `buy-fertilizer` unlock `start`; `buy-weed-spray` utility, unlock and show `unlock-better-tools`; `unlock-better-tools` effect `buy-pickaxe`.', () => {
    expect(SKUS['buy-fertilizer'].unlock).toBe('start')
    expect(SKUS['buy-weed-spray']).toMatchObject({
      tab: 'utility',
      unlock: 'unlock-better-tools',
      show: 'unlock-better-tools',
    })
    expect(RESEARCH['unlock-better-tools'].effect).toEqual({ kind: 'unlock-sku', sku: 'buy-pickaxe' })
    expect(SKUS['buy-chest'].price).toBe(12)
    expect(SKUS['buy-shovel'].price).toBe(8)
    expect(SKUS['buy-better-shovel'].price).toBe(24)
    expect(SKUS['buy-pumpjack'].price).toBe(75)
    expect(SKUS['buy-well'].price).toBe(50)
    expect(SKUS['buy-freezer'].price).toBe(32)
    expect(RESEARCH['unlock-fermentation'].cost).toBe(40)
    const w = new World(1)
    w.money = 999
    w.startResearch('unlock-tomato')
    expect(w.job.kind).toBe('run')
    if (w.job.kind !== 'run') return
    expect(w.job.id).toBe('unlock-tomato')
    const left = w.job.left
    const money = w.money
    w.startResearch('unlock-grape')
    expect(w.job.kind === 'run' && w.job.id).toBe('unlock-tomato')
    expect(w.job.kind === 'run' && w.job.left).toBe(left)
    expect(w.money).toBe(money)
    expect(w.done.has('unlock-grape')).toBe(false)
  })
})

describe('research.tiles', () => {
  test('`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`; cosmetic; keep `ground`.', () => {
    expect(SKUS['buy-tile-paved']).toMatchObject({ unlock: 'unlock-landscaping', show: 'start' })
    expect(SKUS['buy-tile-brick']).toMatchObject({ unlock: 'unlock-landscaping', show: 'start' })
    expect(SKUS['buy-tile-cobble']).toMatchObject({ unlock: 'unlock-landscaping', show: 'start' })
  })
})

describe('research.better', () => {
  test('Better crop is player `better-*` `saleMul` and ripen `betterGain`; potato / wheat gated on `unlock-crop-variants`; Őstermelő gated on `unlock-heirloom`; tree `better-*` gate none.', () => {
    expect(SKILLS['better-potato'].member).toBe('player')
    expect(SKILLS['better-potato'].effect).toEqual({ kind: 'better', crop: 'potato', saleMul: 1 })
    expect(SKILLS['better-potato'].gate).toEqual({ kind: 'research', id: 'unlock-crop-variants' })
    expect(SKILLS['better-wheat'].gate).toEqual({ kind: 'research', id: 'unlock-crop-variants' })
    expect(SKILLS.heirloom.gate).toEqual({ kind: 'research', id: 'unlock-heirloom' })
    expect(SKILLS['better-apple'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-apricot'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-olive'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-cherry'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-apple'].effect).toEqual({ kind: 'better', crop: 'apple', saleMul: 1.04 })
  })
})

describe('research.variants', () => {
  test("`unlock-crop-variants` plants, `reveal` tomato | grape | irrigation, `effect` `feature`; ladder effects die: seed packs `'base'` quality 0 with or without it; ripen does not roll; silo does not hide columns; `buy-research-station` unlock and show that row; `unlock-heirloom` `requires` it; both rows stay; earn path: [[plans/next-variant]].", () => {
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

describe('research.unlockAll', () => {
  test('`unlockAll`: every research done, `money += 999`, job idle, `World.points = 99`; does not grant skills; does not reroll; job drain ×3 is `cheatFastResearch`, not this.', () => {
    const w = new World(1)
    w.startResearch('unlock-tomato')
    const money = w.money
    const owned = w.family.player.owned.size
    const offers = w.family.player.offers
    w.unlockAll()
    ;(Object.keys(RESEARCH) as ResearchId[]).forEach(id => {
      expect(w.done.has(id)).toBe(true)
    })
    expect(w.job).toEqual({ kind: 'idle' })
    expect(w.money).toBe(money + 999)
    expect(w.points).toBe(99)
    expect(w.family.player.owned.size).toBe(owned)
    expect(w.family.player.offers).toBe(offers)
    expect(w.cheatFastResearch).toBe(false)
  })
})

describe('research.start', () => {
  test("Plants start shelf is three: `unlock-tomato`, `unlock-grape`, `unlock-better-tools`; `unlock-better-tools` plants, `reveal: []`; `unlock-grape` `reveal: []`; `pack-grape` unlock `unlock-grape`, show `start`; pack is not free on day 1; land start shelf is `unlock-expand` and `unlock-landscaping` (`reveal: []`).", () => {
    expect(RESEARCH['unlock-better-tools']).toMatchObject({ tree: 'plants', reveal: [] })
    expect(RESEARCH['unlock-grape']).toMatchObject({ reveal: [] })
    expect(SKUS['pack-grape']).toMatchObject({ unlock: 'unlock-grape', show: 'start' })
    expect(RESEARCH['unlock-expand'].reveal).toEqual([])
    expect(RESEARCH['unlock-landscaping'].reveal).toEqual([])
    const w = new World(1)
    const plants = (Object.keys(RESEARCH) as ResearchId[]).filter(
      id => RESEARCH[id].tree === 'plants' && w.researchShown(id),
    )
    expect(plants).toEqual(['unlock-tomato', 'unlock-grape', 'unlock-better-tools'])
    const land = (Object.keys(RESEARCH) as ResearchId[]).filter(
      id => RESEARCH[id].tree === 'land' && w.researchShown(id),
    )
    expect(land).toEqual(['unlock-expand', 'unlock-landscaping'])
    expect(w.skuOpen('pack-grape')).toBe(false)
  })
})

describe('research.reveal', () => {
  test('Raspberry research `reveal` tomato | grape; no olive research row; no vanilla research row; vanilla has no pack; no `unlock-chilli`; `unlock-infusion` trade, `reveal` and `requires` `unlock-preservatives`, gates `buy-infuser` and `pack-chilli`; `unlock-fermentation` unlocks `pack-sugar-cane` and gates `buy-still` `buy-barrel`; rotten consign `$1` iff `unlock-fermentation` in `done`; `unlock-furnace` trade, `reveal` fermentation, gates `buy-furnace`, show `unlock-grinder`; `unlock-grinder` also gates `buy-mill`; `unlock-preservatives` trade, reveal `unlock-grinder`, gates `buy-jam` `buy-freezer` `buy-sugar`; station has no research row.', () => {
    expect(RESEARCH['unlock-raspberry'].reveal).toEqual(['unlock-tomato', 'unlock-grape'])
    expect(Object.keys(RESEARCH).includes('unlock-olive')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-vanilla')).toBe(false)
    expect(Object.keys(SKUS).includes('pack-vanilla')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-chilli')).toBe(false)
    expect(RESEARCH['unlock-infusion']).toMatchObject({
      tree: 'trade',
      reveal: ['unlock-preservatives'],
      requires: ['unlock-preservatives'],
    })
    expect(SKUS['buy-infuser'].unlock).toBe('unlock-infusion')
    expect(SKUS['pack-chilli']).toMatchObject({ unlock: 'unlock-infusion', show: 'unlock-infusion' })
    expect(SKUS['pack-sugar-cane'].unlock).toBe('unlock-fermentation')
    expect(SKUS['buy-still'].unlock).toBe('unlock-fermentation')
    expect(SKUS['buy-barrel'].unlock).toBe('unlock-fermentation')
    expect(RESEARCH['unlock-furnace']).toMatchObject({
      tree: 'trade',
      reveal: ['unlock-fermentation'],
    })
    expect(SKUS['buy-furnace']).toMatchObject({ unlock: 'unlock-furnace', show: 'unlock-grinder' })
    expect(SKUS['buy-mill'].unlock).toBe('unlock-grinder')
    expect(RESEARCH['unlock-preservatives']).toMatchObject({
      tree: 'trade',
      reveal: ['unlock-grinder'],
    })
    expect(SKUS['buy-jam'].unlock).toBe('unlock-preservatives')
    expect(SKUS['buy-freezer'].unlock).toBe('unlock-preservatives')
    expect(SKUS['buy-sugar'].unlock).toBe('unlock-preservatives')
    expect(Object.keys(RESEARCH).some(id => id.includes('station'))).toBe(false)
    const refused = new World(1)
    refused.seats[0].actor.x = PAD.col + 0.5
    refused.seats[0].actor.y = PAD.row + 0.5
    refused.seats[0].hand = { kind: 'hold', item: { kind: 'rotten', cls: 'root', count: 4, createdAt: 1 } }
    refused.enqueue({ act: 'consign' })
    refused.tick(DT_MAX)
    expect(refused.clearance).toBe(0)
    expect(refused.seats[0].hand.kind).toBe('hold')
    const c = new World(1)
    c.done.add('unlock-fermentation')
    c.seats[0].actor.x = PAD.col + 0.5
    c.seats[0].actor.y = PAD.row + 0.5
    c.seats[0].hand = { kind: 'hold', item: { kind: 'rotten', cls: 'root', count: 10, createdAt: 1 } }
    c.enqueue({ act: 'consign' })
    c.tick(DT_MAX)
    expect(c.clearance).toBe(10)
    expect(c.marketGain()).toBe(10)
  })
})

describe('research.gates', () => {
  test('`better-grape` gated on `unlock-grape`; `better-apple` `better-apricot` `better-olive` `better-cherry` gate none; no `better-carrot` `better-vanilla` `better-sugar-cane` `better-chilli` `better-grass`; no `unlock-olive`; no `unlock-chilli`; `machinery` gated on `unlock-grinder`.', () => {
    expect(SKILLS['better-grape'].gate).toEqual({ kind: 'research', id: 'unlock-grape' })
    expect(SKILLS['better-apple'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-apricot'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-olive'].gate).toEqual({ kind: 'none' })
    expect(SKILLS['better-cherry'].gate).toEqual({ kind: 'none' })
    expect('better-carrot' in SKILLS).toBe(false)
    expect('better-vanilla' in SKILLS).toBe(false)
    expect('better-sugar-cane' in SKILLS).toBe(false)
    expect('better-chilli' in SKILLS).toBe(false)
    expect('better-grass' in SKILLS).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-olive')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-chilli')).toBe(false)
    expect(SKILLS.machinery.gate).toEqual({ kind: 'research', id: 'unlock-grinder' })
  })
})

describe('research.infusion', () => {
  test('`unlock-infusion` trade, `reveal` and `requires` `unlock-preservatives`, `effect` `unlock-sku` `buy-infuser`. `buy-infuser` show `unlock-preservatives`, buy that row. `pack-chilli` show + buy that row. no chilli research row — [[mechanics/infusion]].', () => {
    expect(RESEARCH['unlock-infusion']).toMatchObject({
      tree: 'trade',
      reveal: ['unlock-preservatives'],
      requires: ['unlock-preservatives'],
      effect: { kind: 'unlock-sku', sku: 'buy-infuser' },
    })
    expect(SKUS['buy-infuser']).toMatchObject({
      unlock: 'unlock-infusion',
      show: 'unlock-preservatives',
      tab: 'automation',
    })
    expect(SKUS['pack-chilli']).toMatchObject({
      unlock: 'unlock-infusion',
      show: 'unlock-infusion',
      price: 10,
      tab: 'seeds',
    })
    expect(Object.keys(RESEARCH).includes('unlock-chilli')).toBe(false)
    const w = new World(1)
    expect(w.skuShown('buy-infuser')).toBe(false)
    expect(w.skuOpen('buy-infuser')).toBe(false)
    expect(w.skuShown('pack-chilli')).toBe(false)
    expect(w.skuOpen('pack-chilli')).toBe(false)
    w.done.add('unlock-preservatives')
    expect(w.researchShown('unlock-infusion')).toBe(true)
    expect(w.researchOpen('unlock-infusion')).toBe(true)
    expect(w.skuShown('buy-infuser')).toBe(true)
    expect(w.skuOpen('buy-infuser')).toBe(false)
    w.done.add('unlock-infusion')
    expect(w.skuOpen('buy-infuser')).toBe(true)
    expect(w.skuShown('pack-chilli')).toBe(true)
    expect(w.skuOpen('pack-chilli')).toBe(true)
  })
})

describe('research.dispatch', () => {
  test('`unlock-dispatch` automation, `reveal` and `requires` `unlock-vehicles`, `effect` `feature`, grants Automate chrome; card **Automated dispatch**; Automate chrome iff that row is in `done`; `buy-traffic-light` `show` `unlock-sensors` `need` `unlock-dispatch`; `Act.route` no-op unless `unlock-dispatch` in `done`.', () => {
    expect(RESEARCH['unlock-dispatch']).toMatchObject({
      tree: 'automation',
      reveal: ['unlock-vehicles'],
      requires: ['unlock-vehicles'],
      effect: { kind: 'feature' },
      grants: [m.research_grant_automate()],
      name: 'Automated dispatch',
    })
    expect(SKUS['buy-traffic-light']).toMatchObject({
      show: 'unlock-sensors',
      need: ['unlock-dispatch'],
      tab: 'automation',
    })
    const w = new World(1)
    w.createRoute()
    expect(w.routes).toHaveLength(0)
    w.done.add('unlock-dispatch')
    w.createRoute()
    expect(w.routes).toHaveLength(1)
  })
})

describe('research.furnace', () => {
  test('Own trade row, reveal fermentation, gates `buy-furnace`, show `unlock-grinder`. `buy-axe` on `unlock-better-tools`.', () => {
    expect(RESEARCH['unlock-furnace']).toMatchObject({
      tree: 'trade',
      reveal: ['unlock-fermentation'],
      requires: [],
      effect: { kind: 'unlock-sku', sku: 'buy-furnace' },
    })
    expect(SKUS['buy-furnace']).toMatchObject({ unlock: 'unlock-furnace', show: 'unlock-grinder', tab: 'automation' })
    expect(SKUS['buy-axe']).toMatchObject({ unlock: 'unlock-better-tools', show: 'unlock-better-tools', tab: 'utility' })
  })
})

describe('research.hardened', () => {
  test('`unlock-hardened-tools` land, `reveal` and `requires` `unlock-better-tools`, `effect` `unlock-sku` `buy-better-shovel`; `buy-better-shovel` unlock + show that row; `buy-better-pickaxe` unlock + show that row; `buy-chainsaw` unlock + show that row; `buy-axe` stays `unlock-better-tools`.', () => {
    expect(RESEARCH['unlock-hardened-tools']).toMatchObject({
      tree: 'land',
      reveal: ['unlock-better-tools'],
      requires: ['unlock-better-tools'],
      cost: 100,
      seconds: 20,
      effect: { kind: 'unlock-sku', sku: 'buy-better-shovel' },
    })
    expect(SKUS['buy-better-shovel']).toMatchObject({
      unlock: 'unlock-hardened-tools',
      show: 'unlock-hardened-tools',
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
    expect(SKUS['buy-axe']).toMatchObject({ unlock: 'unlock-better-tools', show: 'unlock-better-tools' })
  })
})
