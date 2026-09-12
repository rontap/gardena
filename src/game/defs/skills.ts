import { m } from '../../paraglide/messages.js'
import type { CropId, ResearchId, SkillId } from '../sim/ids.ts'
import {BULK_UP_CRAFTED_STEP, BULK_UP_STEP, STACK_MAX, STACK_MAX_CRAFTED} from './items.ts'
import {BETTER_QUALITY} from './varieties.ts'
import {HAPPY_MAX} from './crops.ts'

export const TEND_WORK = 0.7

export const SEED_BANK_QUALITY = 0.1

export function seedBankQuality(tier: number): number {
    return SEED_BANK_QUALITY * tier
}

export const SKILL_IDS: readonly SkillId[] = [
    'boots',
    'tending',
    'seed-bank',
    'better-wheat',
    'better-potato',
    'better-tomato',
    'better-grape',
    'better-raspberry',
    'grafting',
    'lucky',
    'bulk-up',
    'driving-classes',
    'machinery',
    'industrial',
    'inherit-land',
    'saleswoman',
    'jam',
    'heirloom',
    'specialty',
    'broker',
]

export type BetterCrop = 'potato' | 'wheat' | 'tomato' | 'raspberry' | 'grape'

export const BETTER_IDS = {
    potato: 'better-potato',
    wheat: 'better-wheat',
    tomato: 'better-tomato',
    raspberry: 'better-raspberry',
    grape: 'better-grape',
} as const satisfies { readonly [K in BetterCrop]: SkillId }

export function experiencedTier(crop: CropId, tierOf: (id: SkillId) => number): number {
    if (!(crop in BETTER_IDS)) return 0
    return tierOf(BETTER_IDS[crop as BetterCrop])
}

export function betterGain(crop: CropId, h: number, tierOf: (id: SkillId) => number): number {
    const t = experiencedTier(crop, tierOf)
    if (t <= 0) return 0
    return BETTER_QUALITY * t * (h / HAPPY_MAX)
}

export const JAM_ROT = 0.15
export const JAM_ROT_FRESH = 0.5

export function jamRotMul(tier: number, freshness: number): number {
    if (tier <= 0 || freshness >= JAM_ROT_FRESH) return 1
    return 1 + JAM_ROT * tier
}

export type SkillGate =
    | { kind: 'none' }
    | { kind: 'research'; id: ResearchId }

export type SkillEffect =
    | { kind: 'walk'; mul: 1.05 }
    | { kind: 'bulk-up' }
    | { kind: 'driving-classes' }
    | { kind: 'machine'; mul: 1.05 }
    | { kind: 'tend' }
    | { kind: 'broker' }
    | { kind: 'industrial' }
    | { kind: 'inherit-land' }
    | { kind: 'saleswoman'; mul: 1.02 }
    | { kind: 'heirloom'; mul: 1.05 }
    | { kind: 'specialty'; mul: 1.05 }
    | { kind: 'better'; crop: CropId; saleMul: number }
    | { kind: 'jam' }
    | { kind: 'grafting' }
    | { kind: 'lucky' }
    | { kind: 'seed-bank' }

export type SkillDef = {
    id: SkillId
    name: string
    blurb: string
    maxTier: number
    parent: SkillId | null
    gate: SkillGate
    effect: SkillEffect
}

function row(
    id: SkillId,
    name: string,
    blurb: string,
    maxTier: number,
    parent: SkillId | null,
    effect: SkillEffect,
    gate: SkillGate = {kind: 'none'},
): SkillDef {
    return {id, name, blurb, maxTier, parent, gate, effect}
}

const WALK_PCT = 5
const DRIVE_PCT = 5
const MACHINE_PCT = 5
const SALE_PCT = 2
const HEIRLOOM_PCT = 5
const SPECIALTY_PCT = 5
const INDUSTRIAL_PCT = 3
const JAM_PCT = Math.round(JAM_ROT * 100)

export const SKILLS: { readonly [K in SkillId]: SkillDef } = {
    boots: row('boots', m.skills_boots_name(), m.skills_boots_blurb({pct: WALK_PCT}), 3, null, {kind: 'walk', mul: 1.05}),
    tending: row('tending', m.skills_tending_name(), m.skills_tending_blurb(), 1, 'boots', {kind: 'tend'}),
    'seed-bank': row(
        'seed-bank',
        m.skills_seed_bank_name(),
        m.skills_seed_bank_blurb({pct: Math.round(SEED_BANK_QUALITY * 100)}),
        1,
        'boots',
        {kind: 'seed-bank'},
    ),
    'better-wheat': row(
        'better-wheat',
        m.skills_better_wheat_name(),
        m.skills_better_wheat_blurb(),
        1,
        'seed-bank',
        {kind: 'better', crop: 'wheat', saleMul: 1},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-potato': row(
        'better-potato',
        m.skills_better_potato_name(),
        m.skills_better_potato_blurb(),
        1,
        'seed-bank',
        {kind: 'better', crop: 'potato', saleMul: 1},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-tomato': row(
        'better-tomato',
        m.skills_better_tomato_name(),
        m.skills_better_tomato_blurb(),
        1,
        'seed-bank',
        {kind: 'better', crop: 'tomato', saleMul: 1},
        {kind: 'research', id: 'unlock-advanced-plants'},
    ),
    'better-grape': row(
        'better-grape',
        m.skills_better_grape_name(),
        m.skills_better_grape_blurb(),
        1,
        'seed-bank',
        {kind: 'better', crop: 'grape', saleMul: 1},
        {kind: 'research', id: 'unlock-advanced-plants'},
    ),
    'better-raspberry': row(
        'better-raspberry',
        m.skills_better_raspberry_name(),
        m.skills_better_raspberry_blurb(),
        1,
        'seed-bank',
        {kind: 'better', crop: 'raspberry', saleMul: 1},
        {kind: 'research', id: 'unlock-raspberry'},
    ),
    grafting: row('grafting', m.skills_grafting_name(), m.skills_grafting_blurb(), 1, 'boots', {kind: 'grafting'}),
    lucky: row('lucky', m.skills_lucky_name(), m.skills_lucky_blurb(), 3, 'boots', {kind: 'lucky'}),
    'bulk-up': row(
        'bulk-up',
        m.skills_bulk_up_name(),
        m.skills_bulk_up_blurb({step: BULK_UP_STEP, crafted: BULK_UP_CRAFTED_STEP}),
        3,
        null,
        {kind: 'bulk-up'},
    ),
    'driving-classes': row(
        'driving-classes',
        m.skills_driving_classes_name(),
        m.skills_driving_classes_blurb({pct: DRIVE_PCT}),
        3,
        'machinery',
        {kind: 'driving-classes'},
        {kind: 'research', id: 'unlock-vehicles'},
    ),
    machinery: row(
        'machinery',
        m.skills_machinery_name(),
        m.skills_machinery_blurb({pct: MACHINE_PCT}),
        3,
        'bulk-up',
        {kind: 'machine', mul: 1.05},
        {kind: 'research', id: 'unlock-grinder'},
    ),
    industrial: row(
        'industrial',
        m.skills_industrial_name(),
        m.skills_industrial_blurb({pct: INDUSTRIAL_PCT}),
        3,
        'broker',
        {kind: 'industrial'},
        {kind: 'research', id: 'unlock-contracts'},
    ),
    'inherit-land': row(
        'inherit-land',
        m.skills_inherit_land_name(),
        m.skills_inherit_land_blurb(),
        3,
        'bulk-up',
        {kind: 'inherit-land'},
        {kind: 'research', id: 'unlock-landscaping'},
    ),
    saleswoman: row(
        'saleswoman',
        m.skills_saleswoman_name(),
        m.skills_saleswoman_blurb({pct: SALE_PCT}),
        3,
        null,
        {kind: 'saleswoman', mul: 1.02},
    ),
    jam: row(
        'jam',
        m.skills_jam_name(),
        m.skills_jam_blurb({pct: JAM_PCT}),
        3,
        'saleswoman',
        {kind: 'jam'},
    ),
    heirloom: row(
        'heirloom',
        m.skills_heirloom_name(),
        m.skills_heirloom_blurb({pct: HEIRLOOM_PCT}),
        3,
        'saleswoman',
        {kind: 'heirloom', mul: 1.05},
        {kind: 'research', id: 'unlock-heirloom'},
    ),
    specialty: row(
        'specialty',
        m.skills_specialty_name(),
        m.skills_specialty_blurb({pct: SPECIALTY_PCT}),
        3,
        'heirloom',
        {kind: 'specialty', mul: 1.05},
        {kind: 'research', id: 'unlock-preservatives'},
    ),
    broker: row(
        'broker',
        m.skills_broker_name(),
        m.skills_broker_blurb(),
        3,
        'saleswoman',
        {kind: 'broker'},
        {kind: 'research', id: 'unlock-contracts'},
    ),
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

export function roman(tier: number): string {
    return ROMAN[tier - 1]
}

export function skillLabel(id: SkillId, tier: number): string {
    const def = SKILLS[id]
    if (def.maxTier === 1) return def.name
    return `${def.name} ${roman(tier)}`
}

export function skillBlurb(id: SkillId, tier: number): string {
    switch (id) {
        case 'boots':
            return m.skills_boots_skillblurb({pct: WALK_PCT * tier})
        case 'bulk-up':
            return m.skills_bulk_up_skillblurb({
                stack: STACK_MAX + BULK_UP_STEP * tier,
                crafted: STACK_MAX_CRAFTED + BULK_UP_CRAFTED_STEP * tier,
            })
        case 'driving-classes':
            return m.skills_driving_classes_skillblurb({pct: DRIVE_PCT * tier})
        case 'machinery':
            return m.skills_machinery_skillblurb({pct: MACHINE_PCT * tier})
        case 'industrial':
            return m.skills_industrial_skillblurb({pct: INDUSTRIAL_PCT * tier})
        case 'broker':
            return m.skills_broker_skillblurb({n: tier})
        case 'saleswoman':
            return m.skills_saleswoman_skillblurb({pct: SALE_PCT * tier})
        case 'heirloom':
            return m.skills_heirloom_skillblurb({pct: HEIRLOOM_PCT * tier})
        case 'specialty':
            return m.skills_specialty_skillblurb({pct: SPECIALTY_PCT * tier})
        case 'seed-bank':
            return m.skills_seed_bank_skillblurb({pct: Math.round(seedBankQuality(tier) * 100)})
        case 'jam':
            return m.skills_jam_skillblurb({pct: JAM_PCT * tier})
        default:
            return SKILLS[id].blurb
    }
}
