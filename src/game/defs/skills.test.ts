import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import type { SkillId } from '../sim/ids.ts'
import { BULK_UP_CRAFTED_STEP, BULK_UP_STEP, STACK_MAX, STACK_MAX_CRAFTED } from './items.ts'
import { SEED_BANK_CHANCE } from './rarity.ts'
import { JAM_ROT, SKILLS, skillBlurb } from './skills.ts'

describe('skills i18n', () => {
  test('RESEARCH[id].name and .blurb and SKILLS[id].name/.blurb become calls to `m.*`', () => {
    const ids = Object.keys(SKILLS) as SkillId[]
    const bag = m as unknown as Record<string, () => string>
    for (const id of ids) {
      const stem = id.replaceAll('-', '_')
      expect(SKILLS[id].name, id).toBe(bag[`skills_${stem}_name`]())
    }
    expect(SKILLS.boots.blurb).toBe(m.skills_boots_blurb({ pct: 5 }))
    expect(SKILLS['bulk-up'].blurb).toBe(
      m.skills_bulk_up_blurb({ step: BULK_UP_STEP, crafted: BULK_UP_CRAFTED_STEP }),
    )
    expect(SKILLS['driving-classes'].blurb).toBe(m.skills_driving_classes_blurb({ pct: 5 }))
    expect(SKILLS.tending.blurb).toBe(m.skills_tending_blurb())
    expect(SKILLS['seed-bank'].blurb).toBe(m.skills_seed_bank_blurb())
    expect(SKILLS['better-carrot'].blurb).toBe(m.skills_better_carrot_blurb({ pct: 4 }))
    expect(SKILLS['research-speed'].blurb).toBe(m.skills_research_speed_blurb({ pct: 5 }))
    expect(SKILLS.machinery.blurb).toBe(m.skills_machinery_blurb({ pct: 5 }))
    expect(SKILLS.haggling.blurb).toBe(m.skills_haggling_blurb({ off: 1 }))
    expect(SKILLS.forecast.blurb).toBe(m.skills_forecast_blurb())
    expect(SKILLS.tax.blurb).toBe(m.skills_tax_blurb({ pct: 2 }))
    expect(SKILLS['water-study'].blurb).toBe(m.skills_water_study_blurb())
    expect(SKILLS['land-study'].blurb).toBe(m.skills_land_study_blurb())
    expect(SKILLS['inherit-land'].blurb).toBe(m.skills_inherit_land_blurb())
    expect(SKILLS.saleswoman.blurb).toBe(m.skills_saleswoman_blurb({ pct: 2 }))
    expect(SKILLS.heirloom.blurb).toBe(m.skills_heirloom_blurb({ pct: 5 }))
    expect(SKILLS.bio.blurb).toBe(m.skills_bio_blurb({ pct: 4 }))
    expect(SKILLS.industrial.blurb).toBe(m.skills_industrial_blurb({ pct: 3 }))
    expect(SKILLS.broker.blurb).toBe(m.skills_broker_blurb())
    expect(SKILLS['open-late'].blurb).toBe(m.skills_open_late_blurb())
    expect(SKILLS['open-24'].blurb).toBe(m.skills_open_24_blurb())
    expect(SKILLS.jam.blurb).toBe(m.skills_jam_blurb({ pct: Math.round(JAM_ROT * 100) }))
    expect(SKILLS.clearance.blurb).toBe(m.skills_clearance_blurb({ price: 1 }))
  })

  test('Hover uses `skillBlurb(id, tier)` — jam names the rank’s slower rot; seed-bank names the rank’s shop pack odds.', () => {
    expect(skillBlurb('jam', 2)).toBe(m.skills_jam_skillblurb({ pct: Math.round(JAM_ROT * 2 * 100) }))
    const n = (rate: number) => `${+(rate * 100 * 3).toFixed(2)}`
    expect(skillBlurb('seed-bank', 3)).toBe(
      m.skills_seed_bank_skillblurb({
        uncommon: n(SEED_BANK_CHANCE.uncommon),
        rare: n(SEED_BANK_CHANCE.rare),
        heirloom: n(SEED_BANK_CHANCE.heirloom),
      }),
    )
  })

  test('Numbers from `src/game/defs/`. Copy never embeds digits.', () => {
    expect(skillBlurb('boots', 3)).toBe(m.skills_boots_skillblurb({ pct: 5 * 3 }))
    expect(skillBlurb('bulk-up', 2)).toBe(
      m.skills_bulk_up_skillblurb({
        stack: STACK_MAX + BULK_UP_STEP * 2,
        crafted: STACK_MAX_CRAFTED + BULK_UP_CRAFTED_STEP * 2,
      }),
    )
    expect(skillBlurb('driving-classes', 2)).toBe(m.skills_driving_classes_skillblurb({ pct: 5 * 2 }))
    expect(skillBlurb('machinery', 3)).toBe(m.skills_machinery_skillblurb({ pct: 5 * 3 }))
    expect(skillBlurb('research-speed', 2)).toBe(m.skills_research_speed_skillblurb({ pct: 5 * 2 }))
    expect(skillBlurb('haggling', 3)).toBe(m.skills_haggling_skillblurb({ off: 3, floor: 1 }))
    expect(skillBlurb('industrial', 2)).toBe(m.skills_industrial_skillblurb({ pct: 3 * 2 }))
    expect(skillBlurb('broker', 1)).toBe(m.skills_broker_skillblurb())
    expect(skillBlurb('broker', 2)).toBe(m.skills_broker_skillblurb_ii())
    expect(skillBlurb('tax', 2)).toBe(m.skills_tax_skillblurb({ pct: 2 * 2, floor: 1 }))
    expect(skillBlurb('saleswoman', 3)).toBe(m.skills_saleswoman_skillblurb({ pct: 2 * 3 }))
    expect(skillBlurb('heirloom', 2)).toBe(m.skills_heirloom_skillblurb({ pct: 5 * 2 }))
    expect(skillBlurb('bio', 3)).toBe(m.skills_bio_skillblurb({ pct: 4 * 3 }))
    expect(skillBlurb('tending', 1)).toBe(SKILLS.tending.blurb)
    expect(skillBlurb('better-carrot', 1)).toBe(SKILLS['better-carrot'].blurb)
  })
})
