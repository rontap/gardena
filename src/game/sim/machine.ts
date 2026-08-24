import {
  BARREL_AGE,
  BARREL_MATURE,
  EXTRACT,
  FLOUR,
  JAM_BUFFER,
  JAM_SALE,
  MILL_GRASS,
  MILL_IN,
  MIXED_MUL,
  OIL,
  SPIRIT_RARITY,
  SPIRIT_SALE,
  STILL_CAP,
  SUGAR_BAG,
  SUGAR_MILL,
  WINE_AGE,
  WINE_SALE,
} from '../defs/items.ts'
import { RARITY_RANK, type Rarity } from '../defs/rarity.ts'
import type { CropId, JamCrop, MillRecipe, SpiritKind, StillCrop } from './ids.ts'
import type { JamMachine, Mill, PotStill } from './building.ts'
import type { Item } from './item.ts'

export function millNeed(recipe: MillRecipe): number {
  return recipe === 'grass' ? MILL_GRASS : MILL_IN
}

export function millProductName(recipe: MillRecipe): string {
  if (recipe === 'sugar-cane') return 'sugar'
  if (recipe === 'olive') return 'olive oil'
  if (recipe === 'wheat') return 'flour'
  return 'extract'
}

export function millProduct(recipe: MillRecipe): Item {
  if (recipe === 'sugar-cane') {
    return { kind: 'sugar', liters: SUGAR_BAG, capacityLiters: SUGAR_BAG, unitSale: SUGAR_MILL }
  }
  if (recipe === 'olive') return { kind: 'oil', count: 1, unitSale: OIL }
  if (recipe === 'wheat') return { kind: 'flour', count: 1, unitSale: FLOUR }
  return { kind: 'extract', count: 1, unitSale: EXTRACT }
}

export function fruitCrop(item: Item): CropId | undefined {
  if (item.kind === 'fruit') return item.crop
  if (item.kind === 'box' && item.cargo.kind === 'stack' && item.cargo.goods === 'fruit') return item.cargo.stack.crop
  return undefined
}

export function fruitCount(item: Item): number {
  if (item.kind === 'fruit') return item.count
  if (item.kind === 'box' && item.cargo.kind === 'stack' && item.cargo.goods === 'fruit') return item.cargo.stack.count
  return 0
}

export function fruitRarity(item: Item): Rarity | undefined {
  if (item.kind === 'fruit') return item.rarity
  if (item.kind === 'box' && item.cargo.kind === 'stack' && item.cargo.goods === 'fruit') return item.cargo.stack.rarity
  return undefined
}

export function millRecipeOf(item: Item): MillRecipe | undefined {
  if (item.kind === 'grass') return 'grass'
  const crop = fruitCrop(item)
  if (crop === 'sugar-cane' || crop === 'olive' || crop === 'wheat') return crop
  return undefined
}

export function millDumpUnits(item: Item, recipe: MillRecipe): number {
  if (recipe === 'grass') return item.kind === 'grass' ? item.count : 0
  const crop = fruitCrop(item)
  if (crop === undefined) return 0
  if (recipe === 'sugar-cane' && crop === 'sugar-cane') return fruitCount(item)
  if (recipe === 'olive' && crop === 'olive') return fruitCount(item)
  if (recipe === 'wheat' && crop === 'wheat') return fruitCount(item)
  return 0
}

export type MillTake = { recipe: MillRecipe; n: number }

export function millAccept(mill: Mill, item: Item): MillTake | undefined {
  const recipe = millRecipeOf(item)
  if (recipe === undefined) return undefined
  if (mill.recipe !== 'none' && mill.recipe !== recipe) return undefined
  const n = millDumpUnits(item, recipe)
  if (n <= 0) return undefined
  return { recipe, n }
}

export function millApply(mill: Mill, item: Item, n: number): void {
  const recipe = millRecipeOf(item)
  if (recipe === undefined || n <= 0) return
  if (mill.recipe === 'none') mill.recipe = recipe
  mill.units += n
}

export function jamFruitAccept(jam: JamMachine, item: Item): number {
  const crop = jamCropOf(item)
  if (crop === undefined) return 0
  if (jam.crop !== 'none' && jam.crop !== crop) return 0
  return fruitCount(item)
}

export function jamFruitApply(jam: JamMachine, item: Item, n: number): void {
  const crop = jamCropOf(item)
  if (crop === undefined || n <= 0) return
  if (jam.crop === 'none') jam.crop = crop
  jam.fruit += n
}

export function jamSugarAccept(jam: JamMachine, item: Item): number {
  if (item.kind !== 'sugar') return 0
  const room = JAM_BUFFER - jam.sugar
  if (room <= 0 || item.liters <= 0) return 0
  return item.liters < room ? item.liters : room
}

export function jamSugarApply(jam: JamMachine, n: number): void {
  jam.sugar += n
}

export function stillAccept(still: PotStill, item: Item): number {
  if (stillCropOf(item) === undefined) return 0
  const room = STILL_CAP - feedUnits(still.feed)
  const n = fruitCount(item)
  if (room <= 0 || n <= 0) return 0
  return n < room ? n : room
}

export function stillApply(still: PotStill, item: Item, n: number): void {
  const crop = stillCropOf(item)
  const rarity = fruitRarity(item)
  if (crop === undefined || rarity === undefined || n <= 0) return
  addStillFeed(still.feed, crop, rarity, n)
}

export function stillCropOf(item: Item): StillCrop | undefined {
  const crop = fruitCrop(item)
  if (crop === 'potato' || crop === 'wheat' || crop === 'apricot') return crop
  return undefined
}

export function jamCropOf(item: Item): JamCrop | undefined {
  const crop = fruitCrop(item)
  if (
    crop === 'apricot' ||
    crop === 'grape' ||
    crop === 'raspberry' ||
    crop === 'apple' ||
    crop === 'cherry' ||
    crop === 'tomato'
  ) {
    return crop
  }
  return undefined
}

export function jamCropName(crop: JamCrop): string {
  if (crop === 'tomato') return 'ketchup'
  return crop
}

export function feedUnits(feed: readonly { count: number }[]): number {
  return feed.reduce((n, f) => n + f.count, 0)
}

export function addStillFeed(
  feed: { crop: StillCrop; rarity: Rarity; count: number }[],
  crop: StillCrop,
  rarity: Rarity,
  n: number,
): void {
  const hit = feed.find(f => f.crop === crop && f.rarity === rarity)
  if (hit !== undefined) {
    hit.count += n
    return
  }
  feed.push({ crop, rarity, count: n })
}

export function addBarrelFeed(feed: { rarity: Rarity; count: number }[], rarity: Rarity, n: number): void {
  const hit = feed.find(f => f.rarity === rarity)
  if (hit !== undefined) {
    hit.count += n
    return
  }
  feed.push({ rarity, count: n })
}

export function spiritKind(feed: readonly { crop: StillCrop; count: number }[]): SpiritKind {
  const crops = new Set(feed.filter(f => f.count > 0).map(f => f.crop))
  if (crops.size !== 1) return 'mixed'
  const crop = [...crops][0]
  if (crop === 'potato') return 'vodka'
  if (crop === 'wheat') return 'beer'
  return 'brandy'
}

export function meanRarity(units: readonly { rarity: Rarity; count: number }[], u: number): Rarity {
  const total = units.reduce((n, x) => n + x.count, 0)
  const mean = units.reduce((n, x) => n + RARITY_RANK.indexOf(x.rarity) * x.count, 0) / total
  const flo = Math.floor(mean)
  const frac = mean - flo
  const i = u < frac ? Math.ceil(mean) : flo
  const j = i < 0 ? 0 : i > 3 ? 3 : i
  return RARITY_RANK[j]
}

export function bakeSpiritSale(kind: SpiritKind, rarity: Rarity): number {
  const base = kind === 'mixed' ? SPIRIT_SALE.vodka : SPIRIT_SALE[kind]
  const s = base * SPIRIT_RARITY[rarity]
  return kind === 'mixed' ? s * MIXED_MUL : s
}

export function wineAgeMul(rarity: Rarity, age: number): number {
  const t = (age - BARREL_MATURE) / BARREL_AGE
  const u = t < 0 ? 0 : t > 1 ? 1 : t
  const cap = WINE_AGE[rarity]
  return 1 + (cap - 1) * u
}

export function bakeWineSale(rarity: Rarity, age: number): number {
  return WINE_SALE * SPIRIT_RARITY[rarity] * wineAgeMul(rarity, age)
}

export function jamSale(crop: JamCrop): number {
  return JAM_SALE[crop]
}

export function mergeSugar(
  a: Extract<Item, { kind: 'sugar' }>,
  b: Extract<Item, { kind: 'sugar' }>,
): Extract<Item, { kind: 'sugar' }> {
  const liters = a.liters + b.liters
  return {
    kind: 'sugar',
    liters,
    capacityLiters: a.capacityLiters + b.capacityLiters,
    unitSale: (a.unitSale * a.liters + b.unitSale * b.liters) / liters,
  }
}
