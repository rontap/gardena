import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import type { ResearchId, SkuId } from '../sim/ids.ts'
import { SKILLS } from './skills.ts'
import { RESEARCH, RESEARCH_IDS, SKUS } from './research.ts'
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
    w.startResearch('unlock-multi-crop')
    expect(w.job.kind).toBe('run')
    if (w.job.kind !== 'run') return
    expect(w.job.id).toBe('unlock-multi-crop')
    const left = w.job.left
    const money = w.money
    w.startResearch('unlock-irrigation')
    expect(w.job.kind === 'run' && w.job.id).toBe('unlock-multi-crop')
    expect(w.job.kind === 'run' && w.job.left).toBe(left)
    expect(w.money).toBe(money)
    expect(w.done.has('unlock-irrigation')).toBe(false)
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
  test('Better crop is `better-*` `saleMul` and ripen `betterGain`; potato / wheat gated on `unlock-crop-variants`; tomato / grape gated on `unlock-advanced-plants`; raspberry gated on `unlock-raspberry`; Őstermelő gated on `unlock-heirloom`; no tree `better-*`.', () => {
    expect(SKILLS['better-potato'].effect).toEqual({ kind: 'better', crop: 'potato', saleMul: 1 })
    expect(SKILLS['better-potato'].gate).toEqual({ kind: 'research', id: 'unlock-crop-variants' })
    expect(SKILLS['better-wheat'].gate).toEqual({ kind: 'research', id: 'unlock-crop-variants' })
    expect(SKILLS['better-tomato'].gate).toEqual({ kind: 'research', id: 'unlock-advanced-plants' })
    expect(SKILLS['better-grape'].gate).toEqual({ kind: 'research', id: 'unlock-advanced-plants' })
    expect(SKILLS['better-raspberry'].gate).toEqual({ kind: 'research', id: 'unlock-raspberry' })
    expect(SKILLS.heirloom.gate).toEqual({ kind: 'research', id: 'unlock-heirloom' })
    expect('better-apple' in SKILLS).toBe(false)
    expect('better-apricot' in SKILLS).toBe(false)
    expect('better-olive' in SKILLS).toBe(false)
    expect('better-cherry' in SKILLS).toBe(false)
  })
})

describe('research.variants', () => {
  test("`unlock-crop-variants` parent `unlock-multi-crop`, `effect` `feature`; ladder effects die: seed packs `'base'` quality 0 with or without it; ripen does not roll; silo does not hide columns; `buy-research-station` unlock and show that row; `unlock-heirloom` parent is it; both rows stay; earn path: [[plans/next-variant]].", () => {
    expect(RESEARCH['unlock-crop-variants']).toMatchObject({
      path: 'unlock-multi-crop',
      parent: 'unlock-multi-crop',
      cost: 16,
      seconds: 40,
      effect: { kind: 'feature' },
    })
    expect(RESEARCH['unlock-heirloom'].parent).toBe('unlock-crop-variants')
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
    locked.done.add('unlock-multi-crop')
    expect(locked.buy('pack-wheat')).toBeUndefined()
    expect(locked.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.quality).toBe(0)
    locked.done.add('unlock-crop-variants')
    expect(locked.buy('pack-wheat')).toBeUndefined()
    expect(locked.silo.seeds.find(st => st.crop === 'wheat' && st.variety === 'base')?.quality).toBe(0)
  })
})

describe('research.unlockAll', () => {
  test('`unlockAll`: every research done, `money += 999`, job idle, `World.points = 99`; does not grant skills; job drain ×3 is `cheatFastResearch`, not this.', () => {
    const w = new World(1)
    w.startResearch('unlock-multi-crop')
    const money = w.money
    const owned = w.family.owned.size
    w.unlockAll()
    RESEARCH_IDS.forEach(id => {
      expect(w.done.has(id)).toBe(true)
    })
    expect(w.job).toEqual({ kind: 'idle' })
    expect(w.money).toBe(money + 999)
    expect(w.points).toBe(99)
    expect(w.family.owned.size).toBe(owned)
    expect(w.cheatFastResearch).toBe(false)
  })
})

describe('research.start', () => {
  test('Start rows are three: `unlock-multi-crop`, `unlock-irrigation`, `unlock-grinder` (`parent: null`); `pack-wheat` unlock `unlock-multi-crop`, show `start`; carrot / potato start; wheat is not start; `unlock-landscaping` and `unlock-expand` are not start.', () => {
    expect(RESEARCH['unlock-multi-crop'].parent).toBe(null)
    expect(RESEARCH['unlock-irrigation'].parent).toBe(null)
    expect(RESEARCH['unlock-grinder'].parent).toBe(null)
    const starts = RESEARCH_IDS.filter(id => RESEARCH[id].parent === null)
    expect(starts).toEqual(['unlock-multi-crop', 'unlock-irrigation', 'unlock-grinder'])
    expect(RESEARCH['unlock-landscaping'].parent).toBe('unlock-grinder')
    expect(RESEARCH['unlock-expand'].parent).toBe('unlock-landscaping')
    expect(SKUS['pack-wheat']).toMatchObject({ unlock: 'unlock-multi-crop', show: 'start' })
    expect(SKUS['pack-carrot'].unlock).toBe('start')
    expect(SKUS['pack-potato'].unlock).toBe('start')
    const w = new World(1)
    expect(w.skuOpen('pack-wheat')).toBe(false)
    expect(w.skuOpen('pack-carrot')).toBe(true)
    expect(w.researchOpen('unlock-multi-crop')).toBe(true)
    expect(w.researchOpen('unlock-landscaping')).toBe(false)
    expect(w.researchOpen('unlock-expand')).toBe(false)
  })
})

describe('research.reveal', () => {
  test('`researchKnown` is parent null or parent open; `researchOpen` is parent null or parent in `done`; not known: card stays, `skill-unknown`, unknown copy, disabled; `unlock-necronomicon` known and open only after grandma `told` and `unlock-grinder` done; raspberry parent `unlock-advanced-plants`; no olive research row; no vanilla research row; vanilla has no pack; no `unlock-chilli`; `unlock-infusion` parent `unlock-fermentation`, gates `buy-infuser` and `pack-chilli`; `unlock-fermentation` parent `unlock-preservatives`, unlocks `pack-sugar-cane` and gates `buy-still` `buy-barrel`; rotten consign `$1` iff `unlock-fermentation` in `done`; `unlock-furnace` parent `unlock-preservatives`, gates `buy-furnace`, show `unlock-preservatives`; `unlock-grinder` also gates `buy-mill`; `unlock-preservatives` parent `unlock-grinder`, gates `buy-jam` `buy-freezer` `buy-sugar`; station has no research row.', () => {
    const w = new World(1)
    expect(w.researchKnown('unlock-multi-crop')).toBe(true)
    expect(w.researchOpen('unlock-multi-crop')).toBe(true)
    expect(w.researchKnown('unlock-better-tools')).toBe(true)
    expect(w.researchOpen('unlock-better-tools')).toBe(false)
    expect(w.researchKnown('unlock-hardened-tools')).toBe(false)
    expect(w.researchOpen('unlock-hardened-tools')).toBe(false)
    w.done.add('unlock-multi-crop')
    expect(w.researchOpen('unlock-better-tools')).toBe(true)
    expect(w.researchKnown('unlock-hardened-tools')).toBe(true)
    expect(RESEARCH['unlock-raspberry'].parent).toBe('unlock-advanced-plants')
    expect(Object.keys(RESEARCH).includes('unlock-olive')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-vanilla')).toBe(false)
    expect(Object.keys(SKUS).includes('pack-vanilla')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-chilli')).toBe(false)
    expect(RESEARCH['unlock-infusion'].parent).toBe('unlock-fermentation')
    expect(SKUS['buy-infuser'].unlock).toBe('unlock-infusion')
    expect(SKUS['pack-chilli']).toMatchObject({ unlock: 'unlock-infusion', show: 'unlock-infusion' })
    expect(RESEARCH['unlock-fermentation'].parent).toBe('unlock-preservatives')
    expect(SKUS['pack-sugar-cane'].unlock).toBe('unlock-fermentation')
    expect(SKUS['buy-still'].unlock).toBe('unlock-fermentation')
    expect(SKUS['buy-barrel'].unlock).toBe('unlock-fermentation')
    expect(RESEARCH['unlock-furnace'].parent).toBe('unlock-preservatives')
    expect(SKUS['buy-furnace']).toMatchObject({ unlock: 'unlock-furnace', show: 'unlock-preservatives' })
    expect(SKUS['buy-mill'].unlock).toBe('unlock-grinder')
    expect(RESEARCH['unlock-preservatives'].parent).toBe('unlock-grinder')
    expect(SKUS['buy-jam'].unlock).toBe('unlock-preservatives')
    expect(SKUS['buy-freezer'].unlock).toBe('unlock-preservatives')
    expect(SKUS['buy-sugar'].unlock).toBe('unlock-preservatives')
    expect(Object.keys(RESEARCH).some(id => id.includes('station') && id !== 'unlock-weather-station')).toBe(false)
    expect(w.researchKnown('unlock-necronomicon')).toBe(false)
    expect(w.researchOpen('unlock-necronomicon')).toBe(false)
    w.grandma = 'told'
    expect(w.researchKnown('unlock-necronomicon')).toBe(false)
    expect(w.researchOpen('unlock-necronomicon')).toBe(false)
    w.done.add('unlock-grinder')
    expect(w.researchKnown('unlock-necronomicon')).toBe(true)
    expect(w.researchOpen('unlock-necronomicon')).toBe(true)
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
  test('`better-grape` gated on `unlock-advanced-plants`; no `better-apple` `better-apricot` `better-olive` `better-cherry`; no `better-carrot` `better-vanilla` `better-sugar-cane` `better-chilli` `better-grass`; no `unlock-olive`; no `unlock-chilli`; no `unlock-tomato`; no `unlock-grape`; `machinery` gated on `unlock-grinder`.', () => {
    expect(SKILLS['better-grape'].gate).toEqual({ kind: 'research', id: 'unlock-advanced-plants' })
    expect('better-apple' in SKILLS).toBe(false)
    expect('better-apricot' in SKILLS).toBe(false)
    expect('better-olive' in SKILLS).toBe(false)
    expect('better-cherry' in SKILLS).toBe(false)
    expect('better-carrot' in SKILLS).toBe(false)
    expect('better-vanilla' in SKILLS).toBe(false)
    expect('better-sugar-cane' in SKILLS).toBe(false)
    expect('better-chilli' in SKILLS).toBe(false)
    expect('better-grass' in SKILLS).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-olive')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-chilli')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-tomato')).toBe(false)
    expect(Object.keys(RESEARCH).includes('unlock-grape')).toBe(false)
    expect(SKILLS.machinery.gate).toEqual({ kind: 'research', id: 'unlock-grinder' })
  })
})

describe('research.infusion', () => {
  test('`unlock-infusion` parent `unlock-fermentation`, `effect` `unlock-sku` `buy-infuser`; `buy-infuser` show `unlock-fermentation`, buy that row; `pack-chilli` show + buy that row; no chilli research row — [[mechanics/infusion]].', () => {
    expect(RESEARCH['unlock-infusion']).toMatchObject({
      parent: 'unlock-fermentation',
      effect: { kind: 'unlock-sku', sku: 'buy-infuser' },
    })
    expect(SKUS['buy-infuser']).toMatchObject({
      unlock: 'unlock-infusion',
      show: 'unlock-fermentation',
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
    expect(w.researchKnown('unlock-infusion')).toBe(true)
    expect(w.researchOpen('unlock-infusion')).toBe(false)
    w.done.add('unlock-fermentation')
    expect(w.researchOpen('unlock-infusion')).toBe(true)
    expect(w.skuShown('buy-infuser')).toBe(true)
    expect(w.skuOpen('buy-infuser')).toBe(false)
    w.done.add('unlock-infusion')
    expect(w.skuOpen('buy-infuser')).toBe(true)
    expect(w.skuShown('pack-chilli')).toBe(true)
    expect(w.skuOpen('pack-chilli')).toBe(true)
  })
})

describe('research.sku-tree', () => {
  test('Pulser and Counter buy on Advanced sensors; Day and Weather sensors on Smart irrigation; Variety sensor on Crop variants; Traffic light on Automated dispatch. Sensors shelf shows them after `unlock-sensors`.', () => {
    const rows: readonly [SkuId, ResearchId][] = [
      ['buy-pulser', 'unlock-advanced-sensors'],
      ['buy-counter', 'unlock-advanced-sensors'],
      ['buy-sensor-day', 'unlock-smart-irrigation'],
      ['buy-sensor-weather', 'unlock-smart-irrigation'],
      ['buy-sensor-variety', 'unlock-crop-variants'],
      ['buy-traffic-light', 'unlock-dispatch'],
    ]
    for (const [sku, unlock] of rows) {
      expect(SKUS[sku].unlock, sku).toBe(unlock)
      expect(SKUS[sku].show, sku).toBe('unlock-sensors')
    }
    const w = new World(1)
    w.money = 999
    w.done.add('unlock-sensors')
    expect(w.skuShown('buy-pulser')).toBe(true)
    expect(w.skuOpen('buy-pulser')).toBe(false)
    w.done.add('unlock-advanced-sensors')
    expect(w.skuOpen('buy-pulser')).toBe(true)
    expect(w.skuOpen('buy-counter')).toBe(true)
    expect(w.skuOpen('buy-sensor-day')).toBe(false)
    w.done.add('unlock-smart-irrigation')
    expect(w.skuOpen('buy-sensor-day')).toBe(true)
    expect(w.skuOpen('buy-sensor-weather')).toBe(true)
    expect(w.skuOpen('buy-sensor-variety')).toBe(false)
    w.done.add('unlock-crop-variants')
    expect(w.skuOpen('buy-sensor-variety')).toBe(true)
    expect(w.skuOpen('buy-traffic-light')).toBe(false)
    w.done.add('unlock-dispatch')
    expect(w.skuOpen('buy-traffic-light')).toBe(true)
  })
})

describe('research.dispatch', () => {
  test('`unlock-dispatch` parent `unlock-vehicles`, `effect` `feature`, grants Automate chrome; card **Automated dispatch**; Automate chrome iff that row is in `done`; `buy-traffic-light` unlock `unlock-dispatch`; `Act.route` no-op unless `unlock-dispatch` in `done`.', () => {
    expect(RESEARCH['unlock-dispatch']).toMatchObject({
      parent: 'unlock-vehicles',
      effect: { kind: 'feature' },
      grants: [m.research_grant_automate()],
      name: 'Automated dispatch',
    })
    expect(SKUS['buy-traffic-light'].unlock).toBe('unlock-dispatch')
    const w = new World(1)
    w.createRoute()
    expect(w.routes).toHaveLength(0)
    w.done.add('unlock-dispatch')
    w.createRoute()
    expect(w.routes).toHaveLength(1)
  })
})

describe('research.furnace', () => {
  test('Own row, parent `unlock-preservatives`, gates `buy-furnace`, show `unlock-preservatives`; `buy-axe` on `unlock-better-tools`.', () => {
    expect(RESEARCH['unlock-furnace']).toMatchObject({
      parent: 'unlock-preservatives',
      effect: { kind: 'unlock-sku', sku: 'buy-furnace' },
    })
    expect(SKUS['buy-furnace']).toMatchObject({ unlock: 'unlock-furnace', show: 'unlock-preservatives', tab: 'automation' })
    expect(SKUS['buy-axe']).toMatchObject({ unlock: 'unlock-better-tools', show: 'unlock-better-tools', tab: 'utility' })
  })
})

describe('research.hardened', () => {
  test('`unlock-hardened-tools` parent `unlock-better-tools`, `effect` `unlock-sku` `buy-better-shovel`; `buy-better-shovel` unlock + show that row; `buy-better-pickaxe` unlock + show that row; `buy-chainsaw` unlock + show that row; `buy-axe` stays `unlock-better-tools`.', () => {
    expect(RESEARCH['unlock-hardened-tools']).toMatchObject({
      parent: 'unlock-better-tools',
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

describe('research.techtree', () => {
  test('#debug-techtree subgraphs by `path`, edges from `parent`; omits SKUs `skuShown` false: `buy-or` `buy-and` `buy-water-system`.', () => {
    RESEARCH_IDS.forEach(id => {
      const def = RESEARCH[id]
      if (def.parent === null) expect(def.path).toBe(id)
      else expect(def.path).toBe(RESEARCH[def.parent].path)
    })
    const w = new World(1)
    expect(w.skuShown('buy-or')).toBe(false)
    expect(w.skuShown('buy-and')).toBe(false)
    expect(w.skuShown('buy-water-system')).toBe(false)
  })
})
