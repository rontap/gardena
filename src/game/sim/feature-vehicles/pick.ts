import { VARIETIES, type VarietyId } from '../../defs/varieties.ts'
import { CROP_OF_CASK, CROP_OF_SPIRIT } from '../ids.ts'
import type { AnnualId, CaskId, CropId, GrownCrop, JamCrop, JamId, SpiritKind } from '../ids.ts'
import type { Item } from '../item.ts'

export type PickType = 'seed' | 'fruit' | 'produce' | 'alcohol' | 'compostable' | 'tool' | 'other'

export type PickGood =
  | CropId
  | JamId
  | SpiritKind
  | CaskId
  | 'sugar'
  | 'oil'
  | 'flour'
  | 'extract'
  | 'bread'
  | 'wood'
  | 'ash'
  | 'weed'
  | 'dead'
  | 'rotten'
  | 'fly-agaric'
  | 'shovel'
  | 'pickaxe'
  | 'axe'
  | 'chainsaw'
  | 'container'
  | 'vanilla-extract'
  | 'flakes'
  | 'treasure'
  | 'fertilizer'
  | 'compost'
  | 'weed-spray'

export type Pick =
  | { step: 'any' }
  | { step: 'type'; type: PickType }
  | { step: 'good'; type: PickType; good: PickGood }
  | { step: 'variety'; type: PickType; good: PickGood; variety: VarietyId }

export const ANY: Pick = { step: 'any' }

export const PICK_TYPES: readonly PickType[] = [
  'seed',
  'fruit',
  'produce',
  'alcohol',
  'compostable',
  'tool',
  'other',
]

const CROPS_ALL: readonly CropId[] = [
  'carrot',
  'potato',
  'wheat',
  'tomato',
  'raspberry',
  'grape',
  'vanilla',
  'chilli',
  'sugar-cane',
  'grass',
  'apple',
  'apricot',
  'olive',
  'cherry',
]

const JAM_CROPS: readonly JamCrop[] = ['apricot', 'grape', 'raspberry', 'cherry', 'tomato']

const GOODS: { readonly [K in PickType]: readonly PickGood[] } = {
  seed: CROPS_ALL,
  fruit: CROPS_ALL.filter((c): c is GrownCrop => c !== 'grass'),
  produce: [...JAM_CROPS.map((c): JamId => `jam-${c}`), 'sugar', 'oil', 'flour', 'extract', 'bread'],
  alcohol: ['vodka', 'beer', 'brandy', 'mixed', 'wine', 'cider'],
  compostable: ['wood', 'ash', 'weed', 'grass', 'dead', 'rotten', 'fly-agaric'],
  tool: ['shovel', 'pickaxe', 'axe', 'chainsaw', 'container'],
  other: ['vanilla-extract', 'flakes', 'treasure', 'fertilizer', 'compost', 'weed-spray'],
}

export function typeOf(item: Item): PickType {
  const k = item.kind
  if (k === 'seeds' || k === 'tree-seed' || k === 'graft') return 'seed'
  if (k === 'fruit') return 'fruit'
  if (k === 'jam' || k === 'oil' || k === 'flour' || k === 'extract' || k === 'bread' || k === 'sugar') {
    return 'produce'
  }
  if (k === 'spirit' || k === 'cask') return 'alcohol'
  if (k === 'wood' || k === 'ash' || k === 'weed' || k === 'grass' || k === 'dead' || k === 'rotten' || k === 'fly-agaric') {
    return 'compostable'
  }
  if (k === 'shovel' || k === 'pickaxe' || k === 'axe' || k === 'chainsaw' || k === 'container') return 'tool'
  return 'other'
}

export function goodOf(item: Item): PickGood {
  if (item.kind === 'seeds' || item.kind === 'graft' || item.kind === 'fruit') return item.crop
  if (item.kind === 'tree-seed') return item.tree
  if (item.kind === 'jam') return `jam-${item.crop}`
  if (item.kind === 'spirit') return item.spirit
  if (item.kind === 'cask') return item.cask
  return item.kind
}

export function varietyOf(item: Item): VarietyId | 'none' {
  if (
    item.kind === 'seeds' ||
    item.kind === 'graft' ||
    item.kind === 'fruit' ||
    item.kind === 'tree-seed' ||
    item.kind === 'jam' ||
    item.kind === 'spirit' ||
    item.kind === 'cask'
  ) {
    return item.variety
  }
  return 'none'
}

export function goodsOf(type: PickType): readonly PickGood[] {
  return GOODS[type]
}

export type PickSlot = { type: PickType; good: PickGood }

export type PadGoods = 'all' | readonly PickSlot[]

export function slots(type: PickType, goods: readonly PickGood[]): PickSlot[] {
  return goods.map(good => ({ type, good }))
}

export function allSlots(type: PickType): PickSlot[] {
  return slots(type, GOODS[type])
}

export function padTypesOf(pad: PadGoods): readonly PickType[] {
  if (pad === 'all') return PICK_TYPES
  return PICK_TYPES.filter(t => pad.some(s => s.type === t))
}

export function padGoodsOf(pad: PadGoods, type: PickType): readonly PickGood[] {
  if (pad === 'all') return GOODS[type]
  return GOODS[type].filter(g => pad.some(s => s.type === type && s.good === g))
}

export function cropOfGood(type: PickType, good: PickGood): CropId | 'none' {
  if (type === 'seed' || type === 'fruit') return CROPS_ALL.includes(good as CropId) ? (good as CropId) : 'none'
  if (type === 'produce') {
    const crop = JAM_CROPS.find(c => `jam-${c}` === good)
    return crop === undefined ? 'none' : crop
  }
  if (good === 'vodka' || good === 'beer' || good === 'brandy') return CROP_OF_SPIRIT[good]
  if (good === 'wine' || good === 'cider') return CROP_OF_CASK[good]
  return 'none'
}

export function varietiesOf(type: PickType, good: PickGood): readonly VarietyId[] {
  const crop = cropOfGood(type, good)
  return crop === 'none' ? [] : VARIETIES[crop]
}

export function pickTakes(pick: Pick, item: Item): boolean {
  if (pick.step === 'any') return true
  if (typeOf(item) !== pick.type) return false
  if (pick.step === 'type') return true
  if (goodOf(item) !== pick.good) return false
  if (pick.step === 'good') return true
  return varietyOf(item) === pick.variety
}

export function narrowType(type: PickType): Pick {
  return { step: 'type', type }
}

export function narrowGood(type: PickType, good: PickGood): Pick {
  return { step: 'good', type, good }
}

export function narrowVariety(type: PickType, good: PickGood, variety: VarietyId): Pick {
  return { step: 'variety', type, good, variety }
}

export function sampleItem(type: PickType, good: PickGood, variety: VarietyId): Item {
  const crop = cropOfGood(type, good)
  if (type === 'seed') {
    if (crop === 'apple' || crop === 'apricot' || crop === 'olive' || crop === 'cherry') {
      return { kind: 'tree-seed', tree: crop, variety, quality: 0.5 }
    }
    return { kind: 'seeds', crop: (crop === 'none' ? 'carrot' : crop) as AnnualId, variety, quality: 0.5, count: 1 }
  }
  if (type === 'fruit') {
    return { kind: 'fruit', crop: good as GrownCrop, variety, quality: 0.5, count: 1, unitSale: 1, freshness: 1, cut: false }
  }
  if (good === 'vodka' || good === 'beer' || good === 'brandy' || good === 'mixed') {
    return { kind: 'spirit', spirit: good, variety, quality: 0.5, count: 1, unitSale: 1, infused: false }
  }
  if (good === 'wine' || good === 'cider') {
    return { kind: 'cask', cask: good, variety, quality: 0.5, count: 1, unitSale: 1, infused: false }
  }
  if (crop !== 'none') {
    return { kind: 'jam', crop: crop as JamCrop, variety, quality: 0.5, count: 1, unitSale: 1, infused: false }
  }
  return FLAT[good as keyof typeof FLAT]
}

const FLAT = {
  sugar: { kind: 'sugar', liters: 1, capacityLiters: 1, unitSale: 1, quality: 0.5 },
  oil: { kind: 'oil', quality: 0.5, count: 1, unitSale: 1, infused: false },
  flour: { kind: 'flour', quality: 0.5, count: 1, unitSale: 1 },
  extract: { kind: 'extract', quality: 0.5, count: 1, unitSale: 1 },
  bread: { kind: 'bread', quality: 0.5, count: 1, unitSale: 1 },
  wood: { kind: 'wood', count: 1 },
  ash: { kind: 'ash', count: 1 },
  weed: { kind: 'weed', count: 1 },
  grass: { kind: 'grass', count: 1 },
  dead: { kind: 'dead', cls: 'root', count: 1 },
  rotten: { kind: 'rotten', cls: 'root', count: 1, createdAt: 0 },
  'fly-agaric': { kind: 'fly-agaric', count: 1 },
  shovel: { kind: 'shovel', id: 'shovel', usesLeft: 1, workSeconds: 1 },
  pickaxe: { kind: 'pickaxe', id: 'pickaxe', usesLeft: 1, workSeconds: 1 },
  axe: { kind: 'axe', usesLeft: 1, workSeconds: 1 },
  chainsaw: { kind: 'chainsaw', usesLeft: 1, workSeconds: 1 },
  container: { kind: 'container', id: 'bucket', liters: 0, capacityLiters: 1 },
  'vanilla-extract': { kind: 'vanilla-extract', quality: 0.5, count: 1 },
  flakes: { kind: 'flakes', quality: 0.5, count: 1 },
  treasure: { kind: 'treasure', coins: 1 },
  fertilizer: { kind: 'fertilizer', liters: 1, capacityLiters: 1 },
  compost: { kind: 'compost', liters: 1, capacityLiters: 1 },
  'weed-spray': { kind: 'weed-spray', liters: 1, capacityLiters: 1 },
} as const satisfies { readonly [k: string]: Item }

export function typeIcon(type: PickType): Item {
  return sampleItem(type, goodsOf(type)[0], 'base')
}

export function pickType(pick: Pick): PickType | 'any' {
  return pick.step === 'any' ? 'any' : pick.type
}

export function pickGood(pick: Pick): PickGood | 'any' {
  return pick.step === 'any' || pick.step === 'type' ? 'any' : pick.good
}
