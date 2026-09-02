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
    | { kind: 'dummy' }

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

export const SKILLS: { readonly [K in SkillId]: SkillDef<K> } = {
    boots: row('boots', 'player', 'Boots', 'You walk faster. Each rank adds 5%.', 5, {kind: 'walk', mul: 1.05}),
    'bulk-up': row(
        'bulk-up',
        'player',
        'Bulk up',
        `You carry taller stacks. Each rank adds ${BULK_UP_STEP} to the pile you can hold, ${BULK_UP_CRAFTED_STEP} for bottled and jarred goods.`,
        3,
        {kind: 'bulk-up'},
    ),
    'driving-classes': row(
        'driving-classes',
        'player',
        'Driving classes',
        'You drive faster and burn less fuel. Each rank adds 5% to top speed and acceleration, and cuts burn 5%.',
        3,
        {kind: 'driving-classes'},
        {kind: 'research', id: 'unlock-vehicles'},
    ),
    machinery: row('machinery', 'husband', 'Machinery', 'Machine work finishes sooner. Each rank adds 5%.', 3, {
        kind: 'machine',
        mul: 1.05,
    }),
    tending: row(
        'tending',
        'player',
        'Careful tending',
        'Empty-handed, tend a growing plant once, which makes the plants slightly happier. Ripe plants cannot be tended.',
        1,
        {kind: 'tend'},
    ),
    'research-speed': row(
        'research-speed',
        'husband',
        'Speedy research',
        'Research is 5% faster.',
        3,
        {kind: 'research-speed', mul: 1.05},
    ),
    haggling: row(
        'haggling',
        'husband',
        'Haggling',
        'Utility and automation goods in the store cost less. Each rank knocks $1 off the price.',
        3,
        {kind: 'haggling'},
        {kind: 'hidden'},
    ),
    forecast: row('forecast', 'husband', 'Weather forecast', "Does nothing yet. Will show the next day's weather.", 1, {
        kind: 'dummy',
    }),
    tax: row(
        'tax',
        'husband',
        'Smart tax returns',
        'By optimizing your taxes, you can shave off 2% off your taxes at the end of the day, per rank.',
        3,
        {kind: 'tax', mul: 0.98},
    ),
    'water-study': row(
        'water-study',
        'husband',
        'Water study',
        'Adds Water need to the Lens menu. You can see wet and dry soil across the field.',
        1,
        {kind: 'water-study'},
    ),
    'land-study': row(
        'land-study',
        'husband',
        'Land quality study',
        'Adds Land quality to the Lens menu. You can see fertilizer in the dirt across the field.',
        1,
        {kind: 'land-study'},
    ),
    'inherit-land': row(
        'inherit-land',
        'husband',
        'Inherit land',
        'A relative signs a plot over to you. Each rank grants one expansion permit. The land still costs money.',
        2,
        {kind: 'inherit-land'},
        {kind: 'research', id: 'unlock-expand'},
    ),
    saleswoman: row(
        'saleswoman',
        'daughter',
        'Saleswoman',
        'Produce at the stall sells for more. Each rank adds 2%.',
        3,
        {kind: 'saleswoman', mul: 1.02},
    ),
    heirloom: row(
        'heirloom',
        'daughter',
        'Őstermelő',
        'You have become a noted quality heirloom producer. Heirloom produce sells for more. Each rank adds 5%.',
        3,
        {kind: 'heirloom', mul: 1.05},
        {kind: 'research', id: 'unlock-heirloom'},
    ),
    'seed-bank': row(
        'seed-bank',
        'player',
        'Trusted seed bank',
        'There is some chance that seeds bought from the shops have increased rarity.',
        5,
        {kind: 'seed-bank'},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-carrot': row(
        'better-carrot',
        'player',
        'Experienced carrot grower',
        'Carrots sell for 4% more. Increased chance that a happy plant will produce a superior fruit.',
        1,
        {kind: 'better', crop: 'carrot', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-potato': row(
        'better-potato',
        'player',
        'Experienced potato grower',
        'Potatoes sell for 4% more. Increased chance that a happy plant will produce a superior fruit.',
        1,
        {kind: 'better', crop: 'potato', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-wheat': row(
        'better-wheat',
        'player',
        'Experienced wheat grower',
        'Wheat sells for 4% more. Increased chance that a happy plant will produce a superior fruit.',
        1,
        {kind: 'better', crop: 'wheat', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-crop-variants'},
    ),
    'better-tomato': row(
        'better-tomato',
        'player',
        'Experienced tomato grower',
        'Tomatoes sell for 4% more. Increased chance that a happy plant will produce a superior fruit.',
        1,
        {kind: 'better', crop: 'tomato', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-tomato'},
    ),
    'better-raspberry': row(
        'better-raspberry',
        'player',
        'Experienced raspberry grower',
        'Raspberries sell for 4% more. Increased chance that a happy plant will produce a superior fruit.',
        1,
        {kind: 'better', crop: 'raspberry', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-raspberry'},
    ),
    'better-grape': row(
        'better-grape',
        'player',
        'Experienced grape harvester',
        'Grapes sell for 4% more. Increased chance that a happy plant will produce a superior fruit.',
        1,
        {kind: 'better', crop: 'grape', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-grape'},
    ),
    'better-vanilla': row(
        'better-vanilla',
        'player',
        'Experienced vanilla harvester',
        'Vanilla sells for 4% more. Increased chance that a happy plant will produce a superior fruit.',
        1,
        {kind: 'better', crop: 'vanilla', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-raspberry'},
    ),
    'better-sugar-cane': row(
        'better-sugar-cane',
        'player',
        'Better sugar cane',
        'Sugar sells for 4% more. Increased chance that a happy plant will produce a superior fruit.',
        1,
        {kind: 'better', crop: 'sugar-cane', saleMul: 1.04, up1: 0.04},
        {kind: 'research', id: 'unlock-fermentation'},
    ),
    bio: row(
        'bio',
        'daughter',
        'Bio farmer',
        'Organic fruit sells for more. Each rank adds 4%.',
        3,
        {kind: 'bio', mul: 1.04},
    ),
    industrial: row(
        'industrial',
        'daughter',
        'Industrial farmer',
        'Completed contracts pay more. Each rank adds 3%.',
        3,
        {kind: 'industrial'},
    ),
    broker: row(
        'broker',
        'daughter',
        'Broker',
        'The buyer board grows. Rank I adds one offer. Rank II adds one offer and one running contract.',
        2,
        {kind: 'broker'},
        {kind: 'research', id: 'unlock-contracts'},
    ),
    'open-late': row(
        'open-late',
        'daughter',
        'Open late',
        'The stall keeps selling through sunset. It still shuts at twilight.',
        1,
        {kind: 'open-late'},
    ),
    'open-24': row(
        'open-24',
        'daughter',
        'Open 24/7',
        'The stall keeps selling through twilight as well.',
        1,
        {kind: 'open-24'},
        {kind: 'skill', id: 'open-late'},
    ),
    jam: row(
        'jam',
        'daughter',
        'Still good for jam',
        'Fruit below half freshness rots slower. Each rank adds 15%.',
        3,
        {kind: 'jam'},
    ),
    clearance: row(
        'clearance',
        'daughter',
        'Clearance sale',
        'Fruit that has gone completely off still sells for $1 apiece, no matter the crop.',
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
            return `You walk ${5 * tier}% faster.`
        case 'bulk-up':
            return `You carry up to ${STACK_MAX + BULK_UP_STEP * tier} of a kind in hand, ${STACK_MAX_CRAFTED + BULK_UP_CRAFTED_STEP * tier} for bottled and jarred goods.`
        case 'driving-classes':
            return `You drive ${5 * tier}% faster and burn ${5 * tier}% less fuel.`
        case 'machinery':
            return `Machine work finishes ${5 * tier}% sooner.`
        case 'research-speed':
            return `Research jobs finish ${5 * tier}% sooner.`
        case 'haggling':
            return `Utility and automation goods in the store cost $${tier} less. Never below $1.`
        case 'industrial':
            return `Completed contracts pay ${3 * tier}% more.`
        case 'broker':
            return tier === 1
                ? 'The buyer board grows by one offer.'
                : 'The buyer board grows by one offer and you can run one more contract.'
        case 'tax':
            return `The bill at the end of the day is ${2 * tier}% lighter. You still pay at least $1.`
        case 'saleswoman':
            return `Produce at the stall sells for ${2 * tier}% more.`
        case 'heirloom':
            return `Heirloom produce sells for ${5 * tier}% more.`
        case 'bio':
            return `Organic fruit sells for ${4 * tier}% more.`
        case 'jam': {
            const pct = Math.round(JAM_ROT * tier * 100)
            return `Fruit below half freshness rots ${pct}% slower.`
        }
        case 'seed-bank': {
            const n = (rate: number) => `${+(rate * 100 * tier).toFixed(2)}`
            return `There is some chance that seeds bought from the shops have increased rarity (${n(SEED_BANK_CHANCE.uncommon)}% uncommon, ${n(SEED_BANK_CHANCE.rare)}% rare, ${n(SEED_BANK_CHANCE.heirloom)}% heirloom).`
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
