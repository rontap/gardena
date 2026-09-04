import {
  BARREL_AGE,
  BARREL_MATURE,
  EXTRACT,
  FLOUR,
  FURNACE_CAP,
  FURNACE_NEED,
  FURNACE_REACH,
  FURNACE_HASTE,
  FURNACE_VALUE,
  JAM_BUFFER,
  JAM_IN,
  JAM_SUGAR,
  JAM_SALE,
  MILL_GRASS,
  MILL_IN,
  MILL_VANILLA_IN,
  MILL_VANILLA_OUT,
  MIXED_MUL,
  OIL,
  SPIRIT_SALE,
  STILL_CAP,
  SUGAR_BAG,
  SUGAR_MILL,
  CASK_AGE,
  CASK_SALE,
} from '../defs/items.ts'
import { qualityMul, type VarietyId } from '../defs/varieties.ts'
import type { AnnualId, BarrelCrop, CaskId, CropId, JamCrop, MillRecipe, SpiritKind, StillCrop } from './ids.ts'
import { isAnnualId } from './ids.ts'
import type { Barrel, CompostBox, Coord, Furnace, Grinder, JamMachine, Mill, PotStill, RectBase } from './building.ts'
import { compostValue, cropName, furnaceValue, organic, type Item } from './item.ts'
import { m } from '../../paraglide/messages.js'

export type IoCell = Mill | JamMachine | PotStill | CompostBox | Grinder | Furnace

export function isIoCell(c: { kind: string }): c is IoCell {
  return (
    c.kind === 'mill' ||
    c.kind === 'jam' ||
    c.kind === 'still' ||
    c.kind === 'compost-box' ||
    c.kind === 'grinder' ||
    c.kind === 'furnace'
  )
}

export function machineWest(base: RectBase): Coord {
  return { col: base.col - 1, row: base.row }
}

export function machineEast(base: RectBase): Coord {
  return { col: base.col + base.w, row: base.row }
}

export function millNeed(recipe: MillRecipe): number {
  if (recipe === 'grass') return MILL_GRASS
  if (recipe === 'vanilla') return MILL_VANILLA_IN
  return MILL_IN
}

export function barrelNeed(crop: BarrelCrop): number {
  return crop === 'apple' ? 4 : 5
}

export function millProductName(recipe: MillRecipe): string {
  if (recipe === 'sugar-cane') return m.names_item_sugar()
  if (recipe === 'olive') return m.names_item_oil()
  if (recipe === 'wheat') return m.names_item_flour()
  if (recipe === 'vanilla') return m.names_item_vanilla_extract()
  return m.names_item_extract()
}

export function millProduct(recipe: MillRecipe, quality = 0): Item {
  const mul = qualityMul(quality)
  if (recipe === 'sugar-cane') {
    return { kind: 'sugar', liters: SUGAR_BAG, capacityLiters: SUGAR_BAG, unitSale: SUGAR_MILL * mul, quality }
  }
  if (recipe === 'olive') return { kind: 'oil', count: 1, unitSale: OIL * mul, quality }
  if (recipe === 'wheat') return { kind: 'flour', count: 1, unitSale: FLOUR * mul, quality }
  if (recipe === 'vanilla') return { kind: 'extract', count: MILL_VANILLA_OUT, unitSale: EXTRACT * mul, quality }
  return { kind: 'extract', count: 1, unitSale: EXTRACT * mul, quality }
}

export function fruitCrop(item: Item): CropId | undefined {
  if (item.kind === 'fruit') return item.crop
  return undefined
}

export function fruitCount(item: Item): number {
  if (item.kind === 'fruit') return item.count
  return 0
}

export function fruitVariety(item: Item): VarietyId | undefined {
  if (item.kind === 'fruit') return item.variety
  return undefined
}

export function fruitQuality(item: Item): number {
  if (item.kind === 'fruit') return item.quality
  if (item.kind === 'sugar') return item.quality
  return 0
}

export function millRecipeOf(item: Item): MillRecipe | undefined {
  if (item.kind === 'grass') return 'grass'
  const crop = fruitCrop(item)
  if (crop === 'sugar-cane' || crop === 'olive' || crop === 'wheat' || crop === 'vanilla') return crop
  return undefined
}

export function millDumpUnits(item: Item, recipe: MillRecipe): number {
  if (recipe === 'grass') return item.kind === 'grass' ? item.count : 0
  const crop = fruitCrop(item)
  if (crop === undefined) return 0
  if (recipe === 'sugar-cane' && crop === 'sugar-cane') return fruitCount(item)
  if (recipe === 'olive' && crop === 'olive') return fruitCount(item)
  if (recipe === 'wheat' && crop === 'wheat') return fruitCount(item)
  if (recipe === 'vanilla' && crop === 'vanilla') return fruitCount(item)
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
  const q = item.kind === 'fruit' ? item.quality : 0
  const v = item.kind === 'fruit' ? item.variety : 'base'
  if (mill.recipe === 'none') {
    mill.recipe = recipe
    mill.variety = v
    mill.quality = q
    mill.units = n
    return
  }
  mill.quality = mixQuality(mill.quality, mill.units, q, n)
  mill.units += n
}

export type GrindTake = { crop: AnnualId; variety: VarietyId; quality: number; n: number }

export function grindAccept(g: Grinder, item: Item): GrindTake | undefined {
  const crop = fruitCrop(item)
  const variety = fruitVariety(item)
  if (crop === undefined || variety === undefined) return undefined
  if (!isAnnualId(crop)) return undefined
  if (g.crop !== 'none' && (g.crop !== crop || g.variety !== variety)) return undefined
  const n = fruitCount(item)
  if (n <= 0) return undefined
  return { crop, variety, quality: fruitQuality(item), n }
}

export function grindApply(g: Grinder, take: GrindTake): void {
  if (g.crop === 'none') {
    g.crop = take.crop
    g.variety = take.variety
    g.quality = take.quality
    g.units = take.n
    return
  }
  g.quality = mixQuality(g.quality, g.units, take.quality, take.n)
  g.units += take.n
}

export function grindProduct(g: Grinder, count: number): Extract<Item, { kind: 'seeds' }> {
  if (g.crop === 'none') throw new Error('grind')
  return { kind: 'seeds', crop: g.crop, variety: g.variety, quality: g.quality, count }
}

export function feedAccept(cell: IoCell, item: Item): number {
  if (cell.kind === 'mill') {
    const take = millAccept(cell, item)
    if (take === undefined) return 0
    return take.n
  }
  if (cell.kind === 'jam') {
    const sugar = jamSugarAccept(cell, item)
    if (sugar > 0) return sugar
    return jamFruitAccept(cell, item)
  }
  if (cell.kind === 'still') return stillAccept(cell, item)
  if (cell.kind === 'compost-box') return organic(item) ? 1 : 0
  if (cell.kind === 'furnace') return furnaceAccept(cell, item)
  const take = grindAccept(cell, item)
  if (take === undefined) return 0
  return take.n
}

export function feedApply(cell: IoCell, item: Item, n: number): void {
  if (cell.kind === 'mill') {
    millApply(cell, item, n)
    return
  }
  if (cell.kind === 'jam') {
    if (item.kind === 'sugar') {
      jamSugarApply(cell, n)
      return
    }
    jamFruitApply(cell, item, n)
    return
  }
  if (cell.kind === 'still') {
    stillApply(cell, item, n)
    return
  }
  if (cell.kind === 'compost-box') {
    cell.units += compostValue(item)
    return
  }
  if (cell.kind === 'furnace') {
    furnaceApply(cell, item, n)
    return
  }
  const take = grindAccept(cell, item)
  if (take === undefined) return
  grindApply(cell, { crop: take.crop, variety: take.variety, quality: take.quality, n })
}

export function feedWhole(cell: IoCell): boolean {
  return cell.kind === 'compost-box'
}

export function takeCount(item: Item, n: number): boolean {
  if ('count' in item) {
    item.count -= n
    return item.count <= 0
  }
  if ('liters' in item) {
    item.liters -= n
    return item.liters <= 0
  }
  return true
}



export function jamFruitAccept(jam: JamMachine, item: Item): number {
  const crop = jamCropOf(item)
  if (crop === undefined) return 0
  if (jam.crop !== 'none' && jam.crop !== crop) return 0
  return fruitCount(item)
}

export function jamFruitApply(jam: JamMachine, item: Item, n: number): void {
  if (item.kind !== 'fruit') return
  const crop = jamCropOf(item)
  if (crop === undefined || n <= 0) return
  if (jam.crop === 'none') {
    jam.crop = crop
    jam.variety = item.variety
    jam.quality = item.quality
    jam.fruit = n
    return
  }
  jam.quality = mixQuality(jam.quality, jam.fruit, item.quality, n)
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
  const variety = fruitVariety(item)
  if (crop === undefined || variety === undefined || n <= 0) return
  addStillFeed(still.feed, crop, variety, fruitQuality(item), n)
}

export function stillCropOf(item: Item): StillCrop | undefined {
  const crop = fruitCrop(item)
  if (crop === 'potato' || crop === 'wheat' || crop === 'apricot') return crop
  return undefined
}

export function jamCropOf(item: Item): JamCrop | undefined {
  const crop = fruitCrop(item)
  if (crop === 'apricot' || crop === 'grape' || crop === 'raspberry' || crop === 'cherry' || crop === 'tomato') {
    return crop
  }
  return undefined
}

export function jamCropName(crop: JamCrop): string {
  if (crop === 'tomato') return m.names_item_ketchup()
  return cropName(crop)
}

export function feedUnits(feed: readonly { count: number }[]): number {
  return feed.reduce((n, f) => n + f.count, 0)
}

export function addStillFeed(
  feed: { crop: StillCrop; variety: VarietyId; quality: number; count: number }[],
  crop: StillCrop,
  variety: VarietyId,
  quality: number,
  n: number,
): void {
  const hit = feed.find(f => f.crop === crop && f.variety === variety)
  if (hit !== undefined) {
    hit.quality = mixQuality(hit.quality, hit.count, quality, n)
    hit.count += n
    return
  }
  feed.push({ crop, variety, quality, count: n })
}

export function addBarrelFeed(
  feed: { variety: VarietyId; quality: number; count: number }[],
  variety: VarietyId,
  quality: number,
  n: number,
): void {
  const hit = feed.find(f => f.variety === variety)
  if (hit !== undefined) {
    hit.quality = mixQuality(hit.quality, hit.count, quality, n)
    hit.count += n
    return
  }
  feed.push({ variety, quality, count: n })
}

export function spiritKind(feed: readonly { crop: StillCrop; count: number }[]): SpiritKind {
  const crops = new Set(feed.filter(f => f.count > 0).map(f => f.crop))
  if (crops.size !== 1) return 'mixed'
  const crop = [...crops][0]
  if (crop === 'potato') return 'vodka'
  if (crop === 'wheat') return 'beer'
  return 'brandy'
}

export function meanQuality(units: readonly { quality: number; count: number }[]): number {
  const total = units.reduce((n, x) => n + x.count, 0)
  if (total <= 0) return 0
  return units.reduce((n, x) => n + x.quality * x.count, 0) / total
}

export function feedVariety(units: readonly { variety: VarietyId; count: number }[]): VarietyId {
  const live = units.filter(x => x.count > 0)
  return live.length === 0 ? 'base' : live[0].variety
}

export function mixQuality(prevQ: number, prevN: number, addQ: number, addN: number): number {
  const t = prevN + addN
  if (t <= 0) return 0
  return (prevQ * prevN + addQ * addN) / t
}

export function bakeSpiritSale(kind: SpiritKind, quality = 0): number {
  const base = kind === 'mixed' ? SPIRIT_SALE.vodka : SPIRIT_SALE[kind]
  const s = base * qualityMul(quality)
  return kind === 'mixed' ? s * MIXED_MUL : s
}

export function caskAgeMul(age: number): number {
  const t = (age - BARREL_MATURE) / BARREL_AGE
  const u = t < 0 ? 0 : t > 1 ? 1 : t
  return 1 + (CASK_AGE - 1) * u
}

export function bakeCaskSale(cask: CaskId, quality: number, age: number): number {
  return CASK_SALE[cask] * qualityMul(quality) * caskAgeMul(age)
}

export function jamSale(crop: JamCrop, quality = 0): number {
  return JAM_SALE[crop] * qualityMul(quality)
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
    quality: mixQuality(a.quality, a.liters, b.quality, b.liters),
  }
}

export function furnaceUnit(item: Item): number {
  if (item.kind === 'tree-seed') return FURNACE_VALUE.green
  if (item.kind === 'sugar') return FURNACE_VALUE.fruit
  if ('count' in item) {
    const n = item.count
    if (n <= 0) return 0
    return furnaceValue(item) / n
  }
  return 0
}

export function furnaceAccept(furnace: Furnace, item: Item): number {
  const unit = furnaceUnit(item)
  if (unit <= 0) return 0
  const room = FURNACE_CAP - furnace.units
  if (room <= 0) return 0
  if (item.kind === 'tree-seed') return unit <= room ? 1 : 0
  if (item.kind === 'sugar') {
    const maxL = room / unit
    return item.liters < maxL ? item.liters : maxL
  }
  if ('count' in item) {
    const maxN = Math.floor(room / unit)
    if (maxN <= 0) return 0
    return item.count < maxN ? item.count : maxN
  }
  return 0
}

export function furnaceApply(furnace: Furnace, item: Item, n: number): void {
  if (n <= 0) return
  furnace.units += furnaceUnit(item) * n
}

export function furnaceWorking(c: Furnace): boolean {
  return c.units >= FURNACE_NEED && c.inn === 0 && c.progress < 1
}

export function furnaceStateVfx(origin: Coord): readonly { id: 'furnace' | 'furnace-smoke'; col: number; row: number }[] {
  return [
    { id: 'furnace', col: origin.col, row: origin.row + 1 },
    { id: 'furnace-smoke', col: origin.col, row: origin.row },
  ]
}

function chebyshev(a: Coord, b: Coord): number {
  const dc = a.col < b.col ? b.col - a.col : a.col - b.col
  const dr = a.row < b.row ? b.row - a.row : a.row - b.row
  return dc > dr ? dc : dr
}

export function footprintCells(base: RectBase): Coord[] {
  return Array.from({ length: base.h }, (_, r) =>
    Array.from({ length: base.w }, (_, c) => ({ col: base.col + c, row: base.row + r })),
  ).flat()
}

export function furnaceCoveringCells(base: RectBase): Coord[] {
  const foot = footprintCells(base)
  const minCol = Math.min(...foot.map(c => c.col)) - FURNACE_REACH
  const maxCol = Math.max(...foot.map(c => c.col)) + FURNACE_REACH
  const minRow = Math.min(...foot.map(c => c.row)) - FURNACE_REACH
  const maxRow = Math.max(...foot.map(c => c.row)) + FURNACE_REACH
  return Array.from({ length: maxRow - minRow + 1 }, (_, i) =>
    Array.from({ length: maxCol - minCol + 1 }, (_, j) => ({ col: minCol + j, row: minRow + i })),
  )
    .flat()
    .filter(at => foot.some(f => chebyshev(f, at) <= FURNACE_REACH))
}

export function furnaceCovers(furnace: Furnace, target: RectBase): boolean {
  const fc = footprintCells(furnace.base)
  const tc = footprintCells(target)
  return fc.some(f => tc.some(t => chebyshev(f, t) <= FURNACE_REACH))
}

export function furnaceMul(working: readonly Furnace[], target: RectBase): number {
  return 1 + FURNACE_HASTE * working.filter(f => furnaceCovers(f, target)).length
}

export function millWorking(c: Mill): c is Mill & { recipe: MillRecipe } {
  return c.inn !== 1 && c.recipe !== 'none' && c.units >= millNeed(c.recipe)
}

export function jamWorking(c: JamMachine): c is JamMachine & { crop: JamCrop } {
  return c.inn !== 1 && c.crop !== 'none' && c.fruit >= JAM_IN && c.sugar >= JAM_SUGAR
}

export function stillReady(c: PotStill): boolean {
  return c.inn !== 1 && feedUnits(c.feed) === STILL_CAP
}

export function stillWorking(c: PotStill): boolean {
  return stillReady(c) && c.progress > 0
}

export function barrelWorking(c: Barrel): boolean {
  return c.crop !== 'none' && feedUnits(c.feed) === barrelNeed(c.crop) && c.age < BARREL_AGE
}
