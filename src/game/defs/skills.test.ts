import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import type { SkillId } from '../sim/ids.ts'
import { burrowDayChance } from './burrow.ts'
import { mushroomChance } from './mushroom.ts'
import { BULK_UP_CRAFTED_STEP, BULK_UP_STEP, STACK_MAX, STACK_MAX_CRAFTED } from './items.ts'
import { BETTER_IDS, JAM_ROT, SKILLS, betterGain, skillBlurb } from './skills.ts'
import { BETTER_QUALITY } from './varieties.ts'
import { HAPPY_MAX } from './crops.ts'

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
    expect(SKILLS.machinery.blurb).toBe(m.skills_machinery_blurb({ pct: 5 }))
    expect(SKILLS.machinery.gate).toEqual({ kind: 'research', id: 'unlock-grinder' })
    expect(SKILLS['inherit-land'].blurb).toBe(m.skills_inherit_land_blurb())
    expect(SKILLS.saleswoman.blurb).toBe(m.skills_saleswoman_blurb({ pct: 2 }))
    expect(SKILLS.heirloom.blurb).toBe(m.skills_heirloom_blurb({ pct: 5 }))
    expect(SKILLS.industrial.blurb).toBe(m.skills_industrial_blurb({ pct: 3 }))
    expect(SKILLS.broker.blurb).toBe(m.skills_broker_blurb())
    expect(SKILLS.jam.blurb).toBe(m.skills_jam_blurb({ pct: Math.round(JAM_ROT * 100) }))
    expect(SKILLS.grafting.blurb).toBe(m.skills_grafting_blurb())
    expect(SKILLS.specialty.blurb).toBe(m.skills_specialty_blurb({ pct: 5 }))
    expect(SKILLS.mycologist.blurb).toBe(m.skills_mycologist_blurb())
  })

  test('Hover uses `skillBlurb(id, tier)` — jam names the rank’s slower rot; seed-bank names the rank’s shop pack odds.', () => {
    expect(skillBlurb('jam', 2)).toBe(m.skills_jam_skillblurb({ pct: Math.round(JAM_ROT * 2 * 100) }))
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
    expect(skillBlurb('industrial', 2)).toBe(m.skills_industrial_skillblurb({ pct: 3 * 2 }))
    expect(skillBlurb('broker', 1)).toBe(m.skills_broker_skillblurb({ n: 1 }))
    expect(skillBlurb('broker', 2)).toBe(m.skills_broker_skillblurb({ n: 2 }))
    expect(skillBlurb('saleswoman', 3)).toBe(m.skills_saleswoman_skillblurb({ pct: 2 * 3 }))
    expect(skillBlurb('heirloom', 2)).toBe(m.skills_heirloom_skillblurb({ pct: 5 * 2 }))
    expect(skillBlurb('specialty', 2)).toBe(m.skills_specialty_skillblurb({ pct: 5 * 2 }))
    expect(skillBlurb('tending', 1)).toBe(SKILLS.tending.blurb)
    expect(skillBlurb('better-potato', 1)).toBe(SKILLS['better-potato'].blurb)
  })
})

describe('family.mycologist', () => {
  test("`mycologist` is one skill with three ranks, parent `boots`, no research, effect `{ kind: 'mycologist' }`; `lucky` is gone; the rank's description names the Rain mushroom chance at half happiness and both daily burrow chances.", () => {
    expect(SKILLS.mycologist.maxTier).toBe(3)
    expect(SKILLS.mycologist.parent).toBe('boots')
    expect(SKILLS.mycologist.gate).toEqual({ kind: 'none' })
    expect(SKILLS.mycologist.effect).toEqual({ kind: 'mycologist' })
    expect(SKILLS.mycologist.name).toBe('Mycologist')
    expect('lucky' in SKILLS).toBe(false)
    expect(skillBlurb('mycologist', 2)).toBe(
      m.skills_mycologist_skillblurb({
        rain: Math.round(mushroomChance('rain', 2, HAPPY_MAX / 2) * 100),
        start: Math.round(burrowDayChance('start', 2) * 100),
        other: Math.round(burrowDayChance('other', 2) * 100),
      }),
    )
  })
})

describe('family.better-set', () => {
  test('`better-*` exists for potato wheat tomato raspberry grape; `betterGain` is `BETTER_QUALITY × owned tier × (h / HAPPY_MAX)`; `experiencedTier(crop, tierOf)` is the owned tier, 0 off the set; annual rows carry `saleMul` 1; no tree `better-*`.', () => {
    expect(Object.keys(BETTER_IDS).sort()).toEqual(['grape', 'potato', 'raspberry', 'tomato', 'wheat'].sort())
    expect('better-carrot' in SKILLS).toBe(false)
    expect('better-vanilla' in SKILLS).toBe(false)
    expect('better-sugar-cane' in SKILLS).toBe(false)
    expect('better-chilli' in SKILLS).toBe(false)
    expect('better-apple' in SKILLS).toBe(false)
    expect('better-apricot' in SKILLS).toBe(false)
    expect('better-olive' in SKILLS).toBe(false)
    expect('better-cherry' in SKILLS).toBe(false)
    expect(SKILLS['better-potato'].effect).toEqual({ kind: 'better', crop: 'potato', saleMul: 1 })
    const owned = (id: SkillId) => (id === 'better-potato' ? 1 : 0)
    expect(betterGain('potato', HAPPY_MAX, owned)).toBe(BETTER_QUALITY)
    expect(betterGain('potato', HAPPY_MAX / 2, owned)).toBe(BETTER_QUALITY * 0.5)
    expect(betterGain('carrot', HAPPY_MAX, owned)).toBe(0)
  })
})
