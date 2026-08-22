import type {CropId, ResearchId, SkuId} from '../sim/ids.ts'

export type ResearchDef = {
    id: ResearchId
    name: string
    tree: 'plants' | 'utilities' | 'expansion' | 'automation'
    cost: number
    seconds: number
    reveal: 'start' | ResearchId
    blurb: string
    effect:
        | { kind: 'unlock-sku'; sku: SkuId }
        | { kind: 'sale-mul'; crop: CropId; saleMul: number }
        | { kind: 'expand' }
}

export const RESEARCH: { readonly [K in ResearchId]: ResearchDef } = {
    'unlock-tomato': {
        id: 'unlock-tomato',
        name: 'Tomato seeds',
        tree: 'plants',
        cost: 7,
        seconds: 30,
        reveal: 'start',
        blurb: 'Unlocks Tomato seeds in the general store.',
        effect: {kind: 'unlock-sku', sku: 'pack-tomato'},
    },
    'unlock-raspberry': {
        id: 'unlock-raspberry',
        name: 'Raspberry seeds',
        tree: 'plants',
        cost: 12,
        seconds: 45,
        reveal: 'start',
        blurb: 'Unlocks Raspberry seeds in the general store.',
        effect: {kind: 'unlock-sku', sku: 'pack-raspberry'},
    },
    'unlock-watermelon': {
        id: 'unlock-watermelon',
        name: 'Watermelon seeds',
        tree: 'plants',
        cost: 8,
        seconds: 35,
        reveal: 'start',
        blurb: 'Unlocks Watermelon seeds in the general store.',
        effect: {kind: 'unlock-sku', sku: 'pack-watermelon'},
    },
    'bump-carrot': {
        id: 'bump-carrot',
        name: 'Better carrots',
        tree: 'plants',
        cost: 10,
        seconds: 40,
        reveal: 'start',
        blurb: 'Carrot fruit sells for 1.1×.',
        effect: {kind: 'sale-mul', crop: 'carrot', saleMul: 1.1},
    },
    'bump-potato': {
        id: 'bump-potato',
        name: 'Better potatoes',
        tree: 'plants',
        cost: 10,
        seconds: 40,
        reveal: 'start',
        blurb: 'Potato fruit sells for 1.1×.',
        effect: {kind: 'sale-mul', crop: 'potato', saleMul: 1.1},
    },
    'bump-wheat': {
        id: 'bump-wheat',
        name: 'Better wheat',
        tree: 'plants',
        cost: 12,
        seconds: 45,
        reveal: 'start',
        blurb: 'Wheat fruit sells for 1.1×.',
        effect: {kind: 'sale-mul', crop: 'wheat', saleMul: 1.1},
    },
    'unlock-better-tools': {
        id: 'unlock-better-tools',
        name: 'Better gardening tools',
        tree: 'utilities',
        cost: 16,
        seconds: 45,
        reveal: 'start',
        blurb: 'Unlocks Better shovel and Large bucket in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-better-shovel'},
    },
    'unlock-large-box': {
        id: 'unlock-large-box',
        name: 'Fruit boxes',
        tree: 'utilities',
        cost: 17,
        seconds: 50,
        reveal: 'start',
        blurb: 'Unlocks Fruit box and Large fruit box in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-box'},
    },
    'unlock-irrigation': {
        id: 'unlock-irrigation',
        name: 'Irrigation',
        tree: 'automation',
        cost: 20,
        seconds: 50,
        reveal: 'start',
        blurb: 'Unlocks Pumpjack in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-pumpjack'},
    },
    'unlock-auto-irrigation': {
        id: 'unlock-auto-irrigation',
        name: 'Automated irrigation',
        tree: 'automation',
        cost: 22,
        seconds: 55,
        reveal: 'unlock-irrigation',
        blurb: 'Unlocks Pipe and Sprinkler in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-pipe'},
    },
    'unlock-adv-irrigation': {
        id: 'unlock-adv-irrigation',
        name: 'Advanced irrigation',
        tree: 'automation',
        cost: 28,
        seconds: 65,
        reveal: 'unlock-auto-irrigation',
        blurb: 'Unlocks Well, Vertical sprinkler, and Large sprinkler in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-well'},
    },
    'unlock-chest': {
        id: 'unlock-chest',
        name: 'Chest',
        tree: 'utilities',
        cost: 12,
        seconds: 40,
        reveal: 'start',
        blurb: 'Unlocks Chest in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-chest'},
    },
    'unlock-expand': {
        id: 'unlock-expand',
        name: 'Unlock land',
        tree: 'expansion',
        cost: 15,
        seconds: 45,
        reveal: 'start',
        blurb: 'Unlocks land expansion on the map edge.',
        effect: {kind: 'expand'},
    },
    'unlock-pickaxe': {
        id: 'unlock-pickaxe',
        name: 'Pickaxes',
        tree: 'utilities',
        cost: 0,
        seconds: 40,
        reveal: 'start',
        blurb: 'Unlocks Pickaxe and Hardened pickaxe in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-pickaxe'},
    },
    'unlock-fertilizer': {
        id: 'unlock-fertilizer',
        name: 'Fertilizer',
        tree: 'plants',
        cost: 9,
        seconds: 40,
        reveal: 'start',
        blurb: 'Unlocks Synthetic fertilizer in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-synth-fertilizer'},
    },
    'unlock-compost': {
        id: 'unlock-compost',
        name: 'Composting',
        tree: 'utilities',
        cost: 14,
        seconds: 45,
        reveal: 'unlock-fertilizer',
        blurb: 'Unlocks Compost box in the general store. Turns organic waste back into fertilizer.',
        effect: {kind: 'unlock-sku', sku: 'buy-compost-box'},
    },
    'unlock-grinder': {
        id: 'unlock-grinder',
        name: 'Seed grinder',
        tree: 'automation',
        cost: 18,
        seconds: 50,
        reveal: 'start',
        blurb: 'Unlocks Seed grinder in the general store.',
        effect: {kind: 'unlock-sku', sku: 'buy-grinder'},
    },
}

export type Sku = {
    id: SkuId
    price: number
    unlock: 'start' | ResearchId
    show: 'start' | ResearchId
}

export const SKUS: { readonly [K in SkuId]: Sku } = {
    'pack-carrot': {id: 'pack-carrot', price: 3, unlock: 'start', show: 'start'},
    'pack-potato': {id: 'pack-potato', price: 6, unlock: 'start', show: 'start'},
    'pack-wheat': {id: 'pack-wheat', price: 10, unlock: 'start', show: 'start'},
    'pack-tomato': {id: 'pack-tomato', price: 15, unlock: 'unlock-tomato', show: 'start'},
    'pack-raspberry': {id: 'pack-raspberry', price: 22, unlock: 'unlock-raspberry', show: 'start'},
    'pack-watermelon': {id: 'pack-watermelon', price: 18, unlock: 'unlock-watermelon', show: 'start'},
    'buy-shovel': {id: 'buy-shovel', price: 10, unlock: 'start', show: 'start'},
    'buy-better-shovel': {id: 'buy-better-shovel', price: 30, unlock: 'unlock-better-tools', show: 'start'},
    'buy-pickaxe': {id: 'buy-pickaxe', price: 18, unlock: 'unlock-pickaxe', show: 'start'},
    'buy-better-pickaxe': {
        id: 'buy-better-pickaxe',
        price: 24,
        unlock: 'unlock-pickaxe',
        show: 'unlock-pickaxe',
    },
    'buy-bucket': {id: 'buy-bucket', price: 8, unlock: 'start', show: 'start'},
    'buy-bucket-large': {id: 'buy-bucket-large', price: 22, unlock: 'unlock-better-tools', show: 'start'},
    'buy-box': {id: 'buy-box', price: 6, unlock: 'unlock-large-box', show: 'start'},
    'buy-box-large': {id: 'buy-box-large', price: 18, unlock: 'unlock-large-box', show: 'start'},
    'buy-fertilizer': {id: 'buy-fertilizer', price: 6, unlock: 'start', show: 'start'},
    'buy-synth-fertilizer': {
        id: 'buy-synth-fertilizer',
        price: 5,
        unlock: 'unlock-fertilizer',
        show: 'unlock-fertilizer',
    },
    'buy-compost-box': {id: 'buy-compost-box', price: 20, unlock: 'unlock-compost', show: 'unlock-fertilizer'},
    'buy-pumpjack': {id: 'buy-pumpjack', price: 40, unlock: 'unlock-irrigation', show: 'start'},
    'buy-chest': {id: 'buy-chest', price: 18, unlock: 'unlock-chest', show: 'start'},
    'buy-grinder': {id: 'buy-grinder', price: 30, unlock: 'unlock-grinder', show: 'start'},
    'buy-pipe': {id: 'buy-pipe', price: 4, unlock: 'unlock-auto-irrigation', show: 'unlock-auto-irrigation'},
    'buy-sprinkler': {id: 'buy-sprinkler', price: 15, unlock: 'unlock-auto-irrigation', show: 'unlock-irrigation'},
    'buy-sprinkler-vert': {
        id: 'buy-sprinkler-vert',
        price: 30,
        unlock: 'unlock-adv-irrigation',
        show: 'unlock-auto-irrigation',
    },
    'buy-sprinkler-large': {
        id: 'buy-sprinkler-large',
        price: 33,
        unlock: 'unlock-adv-irrigation',
        show: 'unlock-auto-irrigation',
    },
    'buy-well': {id: 'buy-well', price: 75, unlock: 'unlock-adv-irrigation', show: 'unlock-auto-irrigation'},
    'buy-tile-paved': {id: 'buy-tile-paved', price: 1, unlock: 'start', show: 'start'},
    'buy-tile-brick': {id: 'buy-tile-brick', price: 1, unlock: 'start', show: 'start'},
    'buy-tile-cobble': {id: 'buy-tile-cobble', price: 1, unlock: 'start', show: 'start'},
}
