import { m } from '../../paraglide/messages.js'
import type {
    AnnualId,
    CropId,
    DaughterSkillId,
    HusbandSkillId,
    MemberId,
    PlayerSkillId,
    ResearchId,
    SkillId,
} from '../sim/ids.ts'
import {isTreeId} from '../sim/ids.ts'
import {BULK_UP_CRAFTED_STEP, BULK_UP_STEP, STACK_MAX, STACK_MAX_CRAFTED} from './items.ts'
import {SEED_BANK_CHANCE} from './rarity.ts'

export const TEND_WORK = 0.7

export const PLAYER_SKILL_IDS: readonly PlayerSkillId[] = [
    'boots',
    'bulk-up',
    'driving-classes',
    'tending',
    'seed-bank',
    'better-carrot',
    'better-potato',
    'better-wheat',
    'better-tomato',
    'better-raspberry',
    'better-grape',
    'better-vanilla',
    'better-sugar-cane',
]

export const BETTER_IDS = {
    carrot: 'better-carrot',
    potato: 'better-potato',
    wheat: 'better-wheat',
    tomato: 'better-tomato',
    raspberry: 'better-raspberry',
    grape: 'better-grape',
    vanilla: 'better-vanilla',
    'sugar-cane': 'better-sugar-cane',
} as const satisfies { readonly [K in AnnualId]: PlayerSkillId }

export const BETTER_UP1 = 0.04

export function extraGrowUp1(crop: CropId, has: (id: SkillId) => boolean): number {
    if (isTreeId(crop)) return 0
    return has(BETTER_IDS[crop]) ? BETTER_UP1 : 0
}

export const HUSBAND_SKILL_IDS: readonly HusbandSkillId[] = [
    'research-speed',
    'machinery',
    'haggling',
    'forecast',
    'tax',
    'water-study',
    'land-study',
    'inherit-land',
]
export const DAUGHTER_SKILL_IDS: readonly DaughterSkillId[] = [
    'saleswoman',
    'heirloom',
    'bio',
    'industrial',
    'broker',
    'open-late',
    'open-24',
    'jam',
    'clearance',
]

export const JAM_ROT = 0.15
export const JAM_ROT_FRESH = 0.5

export function jamRotMul(tier: number, freshness: number): number {
    if (tier <= 0 || freshness >= JAM_ROT_FRESH) return 1
    return 1 + JAM_ROT * tier
}

export type SkillGate =
    | { kind: 'none' }
    | { kind: 'research'; id: ResearchId }
    | { kind: 'skill'; id: 'open-late' }
    | { kind: 'hidden' }

export type SkillEffect =
    | { kind: 'walk'; mul: 1.05 }
    | { kind: 'bulk-up' }
    | { kind: 'driving-classes' }
    | { kind: 'machine'; mul: 1.05 }
    | { kind: 'tend' }
    | { kind: 'research-speed'; mul: 1.05 }
    | { kind: 'haggling' }
    | { kind: 'broker' }
    | { kind: 'industrial' }
    | { kind: 'tax'; mul: 0.98 }
    | { kind: 'water-study' }
    | { kind: 'land-study' }
    | { kind: 'inherit-land' }
    | { kind: 'saleswoman'; mul: 1.02 }
    | { kind: 'heirloom'; mul: 1.05 }
    | { kind: 'better'; crop: CropId; saleMul: 1.04; up1: 0.04 }
    | { kind: 'seed-bank' }
    | { kind: 'bio'; mul: 1.04 }
    | { kind: 'open-late' }
    | { kind: 'open-24' }
    | { kind: 'jam' }
    | { kind: 'clearance' }
    | { kind: 'forecast' }

export type SkillDef<Id extends SkillId = SkillId> = {
    id: Id
    member: MemberId
    name: string
    blurb: string
    maxTier: number
    gate: SkillGate
    effect: SkillEffect
}

function row<Id extends SkillId>(
    id: Id,
    member: MemberId,
    name: string,
    blurb: string,
    maxTier: number,
    effect: SkillEffect,
    gate: SkillGate = {kind: 'none'},
): SkillDef<Id> {
    return {id, member, name, blurb, maxTier, gate, effect}
}

const WALK_PCT = 5
const DRIVE_PCT = 5
const MACHINE_PCT = 5
const RESEARCH_PCT = 5
const TAX_PCT = 2
const SALE_PCT = 2
const HEIRLOOM_PCT = 5
const BETTER_SALE_PCT = 4
const BIO_PCT = 4
const INDUSTRIAL_PCT = 3
const HAGGLE_OFF = 1
const PRICE_FLOOR = 1
const CLEARANCE_PRICE = 1
const JAM_PCT = Math.round(JAM_ROT * 100)

export const SKILLS: { readonly [K in SkillId]: SkillDef<K> } = {
    boots: row('boots', 'player', m.skills_boots_name(), m.skills_boots_blurb({pct: WALK_PCT}), 5, {kind: 'walk', mul: 1.05}),
    'bulk-up': row(
        'bulk-up',
        'player',
        m.skills_bulk_up_name(),
        m.skills_bulk_up_blurb({step: BULK_UP_STEP, crafted: BULK_UP_CRAFTED_STEP}),
        3,
        {kind: 'bulk-up'},
    ),
    'driving-classes': row(
        'driving-classes',
        'player',
        m.skills_driving_classes_name(),
        m.skills_driving_classes_blurb({pct: DRIVE_PCT}),
        3,
        {kind: 'driving-classes'},
        {kind: 'research', id: 'unlock-vehicles'},
    ),
    machinery: row('machinery', 'husband', m.skills_machinery_name(), m.skills_machinery_blurb({pct: MACHINE_PCT}), 3, {
        kind: 'machine',
        mul: 1.05,
    }),
    tending: row(
        'tending',
        'player',
        m.skills_tending_name(),
        m.skills_tending_blurb(),
        1,
        {kind: 'tend'},
    ),
    'research-speed': row(
        'research-speed',
        'husband',
        m.skills_research_speed_name(),
        m.skills_research_speed_blurb({pct: RESEARCH_PCT}),
        3,
        {kind: 'research-speed', mul: 1.05},
    ),
    haggling: row(
        'haggling',
        'husband',
        m.skills_haggling_name(),
        m.skills_haggling_blurb({off: HAGGLE_OFF}),
        3,
        {kind: 'haggling'},
        {kind: 'hidden'},
    ),
    forecast: row(
        'forecast',
        'husband',
        m.skills_forecast_name(),
        m.skills_forecast_blurb(),
        1,
        {kind: 'forecast'},
    ),
    tax: row(
        'tax',
        'husband',
        m.skills_tax_name(),
        m.skills_tax_blurb({pct: TAX_PCT}),
        3,
        {kind: 'tax', mul: 0.98},
    ),
    'water-study': row(
        'water-study',
        'husband',
        m.skills_water_study_name(),
        m.skills_water_study_blurb(),
        1,
        {kind: 'water-study'},
    ),
    'land-study': row(
        'land-study',
        'husband',
        m.skills_land_study_name(),
        m.skills_land_study_blurb(),
        1,
        {kind: 'land-study'},
    ),
    'inherit-land': row(
        'inherit-land',
        'husband',
        m.skills_inherit_land_name(),
        m.skills_inherit_land_blurb(),
        2,
        {kind: 'inherit-land'},
        {kind: 'research', id: 'unlock-expand'},
    ),
    saleswoman: row(
        'saleswoman',
        'daughter',
        m.skills_saleswoman_name(),
        m.skills_saleswoman_blurb({pct: SALE_PCT}),
        3,
        {kind: 'saleswoman', mul: 1.02},
    ),
    heirloom: row(
        'heirloom',
        'daughter',
        m.skills_heirloom_name(),
        m.skills_heirloom_blurb({pct: HEIRLOOM_PCT}),
        3,
        {kind: 'heirloom', mul: 1.05},
        {kind: 'research', id: 'unlock-heirloom'},
    ),
    'seed-bank': row(
        'seed-bank',
        'player',
        m.skills_seed_bank_name(),
        m.skills_seed_bank_blurb(),
        5,
        {kind: 'seed-bank'},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-carrot': row(
        'better-carrot',
        'player',
        m.skills_better_carrot_name(),
        m.skills_better_carrot_blurb({pct: BETTER_SALE_PCT}),
        1,
        {kind: 'better', crop: 'carrot', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-potato': row(
        'better-potato',
        'player',
        m.skills_better_potato_name(),
        m.skills_better_potato_blurb({pct: BETTER_SALE_PCT}),
        1,
        {kind: 'better', crop: 'potato', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-wheat': row(
        'better-wheat',
        'player',
        m.skills_better_wheat_name(),
        m.skills_better_wheat_blurb({pct: BETTER_SALE_PCT}),
        1,
        {kind: 'better', crop: 'wheat', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-tomato': row(
        'better-tomato',
        'player',
        m.skills_better_tomato_name(),
        m.skills_better_tomato_blurb({pct: BETTER_SALE_PCT}),
        1,
        {kind: 'better', crop: 'tomato', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-tomato'},
    ),
    'better-raspberry': row(
        'better-raspberry',
        'player',
        m.skills_better_raspberry_name(),
        m.skills_better_raspberry_blurb({pct: BETTER_SALE_PCT}),
        1,
        {kind: 'better', crop: 'raspberry', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-raspberry'},
    ),
    'better-grape': row(
        'better-grape',
        'player',
        m.skills_better_grape_name(),
        m.skills_better_grape_blurb({pct: BETTER_SALE_PCT}),
        1,
        {kind: 'better', crop: 'grape', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-grape'},
    ),
    'better-vanilla': row(
        'better-vanilla',
        'player',
        m.skills_better_vanilla_name(),
        m.skills_better_vanilla_blurb({pct: BETTER_SALE_PCT}),
        1,
        {kind: 'better', crop: 'vanilla', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-raspberry'},
    ),
    'better-sugar-cane': row(
        'better-sugar-cane',
        'player',
        m.skills_better_sugar_cane_name(),
        m.skills_better_sugar_cane_blurb({pct: BETTER_SALE_PCT}),
        1,
        {kind: 'better', crop: 'sugar-cane', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-fermentation'},
    ),
    bio: row(
        'bio',
        'daughter',
        m.skills_bio_name(),
        m.skills_bio_blurb({pct: BIO_PCT}),
        3,
        {kind: 'bio', mul: 1.04},
    ),
    industrial: row(
        'industrial',
        'daughter',
        m.skills_industrial_name(),
        m.skills_industrial_blurb({pct: INDUSTRIAL_PCT}),
        3,
        {kind: 'industrial'},
    ),
    broker: row(
        'broker',
        'daughter',
        m.skills_broker_name(),
        m.skills_broker_blurb(),
        2,
        {kind: 'broker'},
        {kind: 'research', id: 'unlock-contracts'},
    ),
    'open-late': row(
        'open-late',
        'daughter',
        m.skills_open_late_name(),
        m.skills_open_late_blurb(),
        1,
        {kind: 'open-late'},
    ),
    'open-24': row(
        'open-24',
        'daughter',
        m.skills_open_24_name(),
        m.skills_open_24_blurb(),
        1,
        {kind: 'open-24'},
        {kind: 'skill', id: 'open-late'},
    ),
    jam: row(
        'jam',
        'daughter',
        m.skills_jam_name(),
        m.skills_jam_blurb({pct: JAM_PCT}),
        3,
        {kind: 'jam'},
    ),
    clearance: row(
        'clearance',
        'daughter',
        m.skills_clearance_name(),
        m.skills_clearance_blurb({price: CLEARANCE_PRICE}),
        1,
        {kind: 'clearance'},
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
        case 'research-speed':
            return m.skills_research_speed_skillblurb({pct: RESEARCH_PCT * tier})
        case 'haggling':
            return m.skills_haggling_skillblurb({off: HAGGLE_OFF * tier, floor: PRICE_FLOOR})
        case 'industrial':
            return m.skills_industrial_skillblurb({pct: INDUSTRIAL_PCT * tier})
        case 'broker':
            return tier === 1 ? m.skills_broker_skillblurb() : m.skills_broker_skillblurb_ii()
        case 'tax':
            return m.skills_tax_skillblurb({pct: TAX_PCT * tier, floor: PRICE_FLOOR})
        case 'saleswoman':
            return m.skills_saleswoman_skillblurb({pct: SALE_PCT * tier})
        case 'heirloom':
            return m.skills_heirloom_skillblurb({pct: HEIRLOOM_PCT * tier})
        case 'bio':
            return m.skills_bio_skillblurb({pct: BIO_PCT * tier})
        case 'jam':
            return m.skills_jam_skillblurb({pct: JAM_PCT * tier})
        case 'seed-bank': {
            const n = (rate: number) => `${+(rate * 100 * tier).toFixed(2)}`
            return m.skills_seed_bank_skillblurb({
                uncommon: n(SEED_BANK_CHANCE.uncommon),
                rare: n(SEED_BANK_CHANCE.rare),
                heirloom: n(SEED_BANK_CHANCE.heirloom),
            })
        }
        default:
            return SKILLS[id].blurb
    }
}

export function skillIds(member: MemberId): readonly SkillId[] {
    if (member === 'player') return PLAYER_SKILL_IDS
    if (member === 'husband') return HUSBAND_SKILL_IDS
    return DAUGHTER_SKILL_IDS
}
