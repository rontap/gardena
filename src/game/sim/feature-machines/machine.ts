import {
  BARREL_AGE,
  BARREL_MATURE,
  BREAD,
  COMPOST_NEED,
  FLOUR,
  FURNACE_BREAD_IN,
  FURNACE_NEED,
  FURNACE_REACH,
  FURNACE_HASTE,
  FURNACE_VALUE,
  FUEL_WORTH,
  INFUSE_IN,
  INFUSE_REAGENT,
  INFUSE_REAGENTS,
  JAM_IN,
  JAM_SUGAR,
  JAM_SALE,
  KETCHUP_SUGAR,
  INFUSE_EXTRACT_SECONDS,
  INFUSE_SECONDS,
  MILL_GRASS,
  MILL_GRASS_WORK,
  MILL_IN,
  MILL_OLIVE_WORK,
  MILL_WHEAT_WORK,
  MILL_WORK,
  MILL_CHILLI_IN,
  MILL_CHILLI_OUT,
  MILL_TRUFFLE_IN,
  MILL_TRUFFLE_OUT,
  MILL_VANILLA_IN,
  MILL_VANILLA_OUT,
  MIXED_MUL,
  OIL,
  SPIRIT_SALE,
  STILL_CAP,
  STILL_SPRAY_IN,
  SUGAR_BAG,
  SUGAR_MILL,
  WEED_SPRAY_BAG,
  CASK_AGE_MAX,
  CASK_AGE_MIN,
  CASK_SALE,
} from '../../defs/items.ts'
import { familiarityMax, purposeMul, qualityMul, tierOf, type VarietyId } from '../../defs/varieties.ts'
import { FAMILIARITY_GAIN } from '../../defs/items.ts'
import type { BarrelCrop, CaskId, GrownCrop, Infusable, JamCrop, MillRecipe, Reagent, SkuId, SpiritKind, StillCrop } from '../ids.ts'
import { isAnnualId, SPIRIT_OF } from '../ids.ts'
import type {
  Barrel,
  CompostBox,
  Coord,
  Furnace,
  Grinder,
  Refuel,
  Infuser,
  Necronomicon,
  JamMachine,
  Mill,
  PotStill,
  RectBase,
  ResearchStation,
  StillBatch,
  StillLoad,
} from '../building.ts'
import { furnaceValue, makeExtract, type Item } from '../item.ts'

export type IoCell = Mill | JamMachine | PotStill | CompostBox | Grinder | Furnace | ResearchStation | Infuser | Necronomicon | Refuel

export function isIoCell(c: { kind: string }): c is IoCell {
  return (
    c.kind === 'mill' ||
    c.kind === 'jam' ||
    c.kind === 'still' ||
    c.kind === 'compost-box' ||
    c.kind === 'grinder' ||
    c.kind === 'furnace' ||
    c.kind === 'station' ||
    c.kind === 'infuser' ||
    c.kind === 'necronomicon' ||
    c.kind === 'refuel'
  )
}

export const IO_SKUS: readonly SkuId[] = [
  'buy-mill',
  'buy-infuser',
  'buy-necronomicon',
  'buy-jam',
  'buy-still',
  'buy-compost-box',
  'buy-grinder',
  'buy-furnace',
  'buy-research-station',
  'buy-refuel',
]

export const CHUTE_SKUS: readonly SkuId[] = [...IO_SKUS, 'buy-sorter']

export function machineWest(base: RectBase): Coord {
  return { col: base.col - 1, row: base.row + base.h - 1 }
}

export function machineEast(base: RectBase): Coord {
  return { col: base.col + base.w, row: base.row + base.h - 1 }
}

export function millNeed(recipe: MillRecipe): number {
  if (recipe === 'grass') return MILL_GRASS
  if (recipe === 'vanilla') return MILL_VANILLA_IN
  if (recipe === 'chilli') return MILL_CHILLI_IN
  if (recipe === 'truffle') return MILL_TRUFFLE_IN
  return MILL_IN
}

export function millWork(recipe: MillRecipe): number {
  if (recipe === 'olive') return MILL_OLIVE_WORK
  if (recipe === 'wheat') return MILL_WHEAT_WORK
  if (recipe === 'grass') return MILL_GRASS_WORK
  return MILL_WORK
}

export function infuseSeconds(kind: Infusable['kind']): number {
  if (kind === 'extract') return INFUSE_EXTRACT_SECONDS
  return INFUSE_SECONDS
}

export function barrelNeed(crop: BarrelCrop): number {
  return crop === 'apple' ? 4 : 5
}

export function millProduct(recipe: MillRecipe, variety: VarietyId, quality: number): Item {
  const mul = purposeMul(variety, 'processed') * qualityMul(quality)
  if (recipe === 'sugar-cane') {
    return { kind: 'sugar', liters: SUGAR_BAG, capacityLiters: SUGAR_BAG, unitSale: SUGAR_MILL * mul, quality }
  }
  if (recipe === 'olive') return { kind: 'oil', count: 1, unitSale: OIL * mul, quality, infused: false }
  if (recipe === 'wheat') return { kind: 'flour', count: 1, unitSale: FLOUR * mul, quality }
  if (recipe === 'vanilla') return { kind: 'vanilla-extract', quality, count: MILL_VANILLA_OUT }
  if (recipe === 'chilli') return { kind: 'flakes', quality, count: MILL_CHILLI_OUT }
  if (recipe === 'truffle') return { kind: 'truffle-extract', count: MILL_TRUFFLE_OUT }
  return makeExtract(false)
}

export function fruitCrop(item: Item): GrownCrop | undefined {
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
  if (item.kind === 'truffle') return 'truffle'
  const crop = fruitCrop(item)
  if (crop === 'sugar-cane' || crop === 'olive' || crop === 'wheat' || crop === 'vanilla' || crop === 'chilli') return crop
  return undefined
}

export function millDumpUnits(item: Item, recipe: MillRecipe): number {
  if (recipe === 'grass') return item.kind === 'grass' ? item.count : 0
  if (recipe === 'truffle') return item.kind === 'truffle' ? item.count : 0
  const crop = fruitCrop(item)
  if (crop === undefined) return 0
  if (recipe === 'sugar-cane' && crop === 'sugar-cane') return fruitCount(item)
  if (recipe === 'olive' && crop === 'olive') return fruitCount(item)
  if (recipe === 'wheat' && crop === 'wheat') return fruitCount(item)
  if (recipe === 'vanilla' && crop === 'vanilla') return fruitCount(item)
  if (recipe === 'chilli' && crop === 'chilli') return fruitCount(item)
  return 0
}

export type MillTake = { recipe: MillRecipe; n: number }

export function feedVarietyOf(item: Item): VarietyId {
  return item.kind === 'fruit' ? item.variety : 'base'
}

export function millAccept(mill: Mill, item: Item): MillTake | undefined {
  const n = mill.accept(item)
  if (n <= 0) return undefined
  const recipe = millRecipeOf(item)
  if (recipe === undefined) return undefined
  return { recipe, n }
}

export type GrindTake = { crop: GrownCrop; variety: VarietyId; quality: number; n: number }

export function grindAccept(g: Grinder, item: Item): GrindTake | undefined {
  const n = g.accept(item)
  if (n <= 0) return undefined
  const crop = fruitCrop(item)
  const variety = fruitVariety(item)
  if (crop === undefined || variety === undefined) return undefined
  return { crop, variety, quality: fruitQuality(item), n }
}

export function grindApply(g: Grinder, take: GrindTake): void {
  g.applyTake(take.crop, take.variety, take.quality, take.n)
}

export function grindProduct(
  g: { crop: GrownCrop | 'none'; variety: VarietyId; quality: number },
  count: number,
): Extract<Item, { kind: 'seeds' | 'tree-seed' }> {
  if (g.crop === 'none') throw new Error('grind')
  if (!isAnnualId(g.crop)) return { kind: 'tree-seed', tree: g.crop, variety: 'base', quality: g.quality }
  return { kind: 'seeds', crop: g.crop, variety: g.variety, quality: g.quality, count }
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
  return jam.acceptFruit(item)
}

export function jamSugarAccept(jam: JamMachine, item: Item): number {
  return jam.acceptSugar(item)
}

export function stillAccept(still: PotStill, item: Item): number {
  return still.accept(item)
}

export function stillCropOf(item: Item): StillCrop | undefined {
  const crop = fruitCrop(item)
  if (crop === 'potato' || crop === 'wheat' || crop === 'apricot') return crop
  return undefined
}

export function barrelCropOf(item: Item): BarrelCrop | undefined {
  const crop = fruitCrop(item)
  return crop === 'grape' || crop === 'apple' ? crop : undefined
}

export function jamCropOf(item: Item): JamCrop | undefined {
  const crop = fruitCrop(item)
  if (crop === 'apricot' || crop === 'grape' || crop === 'raspberry' || crop === 'cherry' || crop === 'tomato') {
    return crop
  }
  return undefined
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

export type BarrelTake = { crop: BarrelCrop; variety: VarietyId; quality: number; n: number }

export function barrelAccept(barrel: Barrel, item: Item): BarrelTake | undefined {
  const crop = barrelCropOf(item)
  if (crop === undefined) return undefined
  const variety = feedVarietyOf(item)
  if (barrel.crop !== 'none' && (barrel.crop !== crop || feedVariety(barrel.feed) !== variety)) return undefined
  const room = barrelNeed(barrel.crop === 'none' ? crop : barrel.crop) - feedUnits(barrel.feed)
  const n = fruitCount(item)
  if (room <= 0 || n <= 0) return undefined
  return { crop, variety, quality: fruitQuality(item), n: n < room ? n : room }
}

export function spiritKind(feed: readonly { crop: StillCrop; variety: VarietyId; count: number }[]): SpiritKind {
  const live = feed.filter(f => f.count > 0)
  const crops = new Set(live.map(f => f.crop))
  const varieties = new Set(live.map(f => f.variety))
  if (crops.size !== 1 || varieties.size !== 1) return 'mixed'
  return SPIRIT_OF[[...crops][0]]
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

export function bakeSpiritSale(kind: SpiritKind, variety: VarietyId, quality: number): number {
  if (kind === 'mixed') return SPIRIT_SALE.vodka * MIXED_MUL * qualityMul(quality)
  return SPIRIT_SALE[kind] * purposeMul(variety, 'alcohol') * qualityMul(quality)
}

export function caskAgeTop(quality: number): number {
  return CASK_AGE_MIN + (CASK_AGE_MAX - CASK_AGE_MIN) * quality
}

export function caskAgeMul(age: number, quality: number): number {
  const t = (age - BARREL_MATURE) / BARREL_AGE
  const u = t < 0 ? 0 : t > 1 ? 1 : t
  return 1 + (caskAgeTop(quality) - 1) * u
}

export function bakeCaskSale(cask: CaskId, variety: VarietyId, quality: number, age: number): number {
  return CASK_SALE[cask] * purposeMul(variety, 'alcohol') * qualityMul(quality) * caskAgeMul(age, quality)
}

export function jamSale(crop: JamCrop, variety: VarietyId, quality: number): number {
  return JAM_SALE[crop] * purposeMul(variety, 'processed') * qualityMul(quality)
}

export function jamSugar(crop: JamCrop, variety: VarietyId): number {
  if (variety === 'san-marzano') return 0
  if (crop === 'tomato') return KETCHUP_SUGAR
  return JAM_SUGAR
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

export function fuelUnit(item: Item): number {
  if (item.kind === 'wood') return FUEL_WORTH.wood
  if (item.kind === 'oil') return FUEL_WORTH.oil
  if (item.kind === 'fruit' && item.crop === 'sugar-cane') return FUEL_WORTH.cane
  if (item.kind === 'spirit' || item.kind === 'cask') return FUEL_WORTH.alcohol
  return 0
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
  return furnace.accept(item)
}

export function furnaceWorking(c: Furnace): boolean {
  if (c.inn !== 0 || c.progress >= 1) return false
  if (c.recipe === 'bread') return c.units >= FURNACE_BREAD_IN
  if (c.recipe === 'ash') return c.units >= FURNACE_NEED
  return false
}

export function bakeBreadSale(quality: number): number {
  return BREAD * qualityMul(quality)
}

export function infusableOf(item: Item): Infusable | undefined {
  if (item.kind === 'jam' && !item.infused) return { kind: 'jam', crop: item.crop, variety: item.variety }
  if (item.kind === 'cask' && !item.infused) return { kind: 'cask', cask: item.cask, variety: item.variety }
  if (item.kind === 'oil' && !item.infused) return { kind: 'oil' }
  if (item.kind === 'extract') return !item.infused && item.liters === item.capacityLiters ? { kind: 'extract' } : undefined
  if (item.kind !== 'spirit' || item.infused) return undefined
  if (item.spirit === 'mixed') return { kind: 'spirit', spirit: 'mixed' }
  return { kind: 'spirit', spirit: item.spirit, variety: item.variety }
}

export function sameInfusable(a: Infusable, b: Infusable): boolean {
  if (a.kind === 'jam' && b.kind === 'jam') return a.crop === b.crop && a.variety === b.variety
  if (a.kind === 'cask' && b.kind === 'cask') return a.cask === b.cask && a.variety === b.variety
  if (a.kind === 'oil' && b.kind === 'oil') return true
  if (a.kind === 'extract' && b.kind === 'extract') return true
  if (a.kind === 'spirit' && b.kind === 'spirit') {
    if (a.spirit === 'mixed' || b.spirit === 'mixed') return a.spirit === b.spirit
    return a.spirit === b.spirit && a.variety === b.variety
  }
  return false
}

export function infuseReagent(c: Infuser): Reagent | undefined {
  const lock = c.lock
  if (lock === 'none') return undefined
  return INFUSE_REAGENTS[lock.kind].find(r => c.reagents[r] >= INFUSE_REAGENT)
}

export function infuserWorking(c: Infuser): c is Infuser & { lock: Infusable } {
  return c.inn !== 1 && c.lock !== 'none' && c.units >= INFUSE_IN && infuseReagent(c) !== undefined
}

export function infusedProduct(c: Infuser): Item {
  const lock = c.lock
  if (lock === 'none') throw new Error('infuse')
  if (lock.kind === 'extract') return makeExtract(true)
  if (lock.kind === 'jam') {
    return {
      kind: 'jam',
      crop: lock.crop,
      variety: lock.variety,
      quality: c.quality,
      count: 1,
      unitSale: c.unitSale,
      infused: true,
    }
  }
  if (lock.kind === 'cask') {
    return {
      kind: 'cask',
      cask: lock.cask,
      variety: lock.variety,
      quality: c.quality,
      count: 1,
      unitSale: c.unitSale,
      infused: true,
    }
  }
  if (lock.kind === 'oil') {
    return { kind: 'oil', quality: c.quality, count: 1, unitSale: c.unitSale, infused: true }
  }
  if (lock.spirit === 'mixed') {
    return { kind: 'spirit', spirit: 'mixed', variety: 'base', quality: c.quality, count: 1, unitSale: c.unitSale, infused: true }
  }
  return {
    kind: 'spirit',
    spirit: lock.spirit,
    variety: lock.variety,
    quality: c.quality,
    count: 1,
    unitSale: c.unitSale,
    infused: true,
  }
}

export const MILL_DUST_X = 0.5
export const MILL_DUST_Y = 1.65

export function furnaceStateVfx(origin: Coord): readonly { id: 'furnace' | 'furnace-smoke'; col: number; row: number }[] {
  return [
    { id: 'furnace', col: origin.col, row: origin.row + 1 },
    { id: 'furnace-smoke', col: origin.col, row: origin.row },
  ]
}

export function stationStateVfx(origin: Coord): readonly { id: 'station' | 'station-lights'; col: number; row: number }[] {
  return [
    { id: 'station', col: origin.col, row: origin.row },
    { id: 'station-lights', col: origin.col + 1, row: origin.row },
  ]
}

export function compostStateVfx(origin: Coord): { id: 'compost'; col: number; row: number } {
  return { id: 'compost', col: origin.col, row: origin.row - 1 }
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
  return 1 + FURNACE_HASTE * working.filter(f => f.base !== target && furnaceCovers(f, target)).length
}

export type StationTake = { crop: GrownCrop; variety: VarietyId; quality: number; n: number }

export function stationRoom(st: ResearchStation, crop: GrownCrop, known: number, variety: VarietyId): number {
  const left = familiarityMax(crop) - known
  if (left <= 0) return 0
  return Math.ceil(left / FAMILIARITY_GAIN[tierOf(variety)]) - st.units
}

export function stationAccept(
  st: ResearchStation,
  item: Item,
  familiarityOf: (c: GrownCrop) => number,
): StationTake | undefined {
  const n = st.accept(item)
  if (n <= 0) return undefined
  if (item.kind !== 'fruit') return undefined
  const room = stationRoom(st, item.crop, familiarityOf(item.crop), item.variety)
  if (room <= 0) return undefined
  return { crop: item.crop, variety: item.variety, quality: item.quality, n: Math.min(n, room) }
}

export function machineAccept(c: IoCell, item: Item, familiarityOf: (crop: GrownCrop) => number): number {
  if (c.kind !== 'station') return c.accept(item)
  const take = stationAccept(c, item, familiarityOf)
  return take === undefined ? 0 : take.n
}

export function stationApply(st: ResearchStation, take: StationTake): void {
  st.applyTake(take.crop, take.variety, take.quality, take.n)
}

export function stationWorking(c: ResearchStation): boolean {
  return c.inn !== 1 && c.crop !== 'none' && c.units >= 1
}

export function compostWorking(c: CompostBox): boolean {
  return c.units >= COMPOST_NEED && c.progress < 1
}

export function millDustAt(origin: Coord): Coord {
  return { col: origin.col + MILL_DUST_X, row: origin.row + MILL_DUST_Y }
}

export function grinderWorking(c: Grinder): boolean {
  return c.crop !== 'none' && c.units > 0 && c.progress < 1
}

export function millWorking(c: Mill): c is Mill & { recipe: MillRecipe } {
  return c.inn !== 1 && c.recipe !== 'none' && c.units >= millNeed(c.recipe)
}

export function jamWorking(c: JamMachine): c is JamMachine & { crop: JamCrop } {
  return c.inn !== 1 && c.crop !== 'none' && c.fruit >= JAM_IN && c.sugar >= jamSugar(c.crop, c.variety)
}

export function stillUnits(load: StillLoad): number {
  if (load.kind === 'spirit') return feedUnits(load.feed)
  if (load.kind === 'spray') return load.count
  return 0
}

export function stillNeed(load: StillLoad): number {
  return load.kind === 'spray' ? STILL_SPRAY_IN : STILL_CAP
}

export function stillFull(load: StillLoad): load is StillBatch {
  return load.kind !== 'empty' && stillUnits(load) === stillNeed(load)
}

export function stillProduct(load: StillBatch): Item {
  if (load.kind === 'spray') return { kind: 'weed-spray', liters: WEED_SPRAY_BAG, capacityLiters: WEED_SPRAY_BAG }
  const kind = spiritKind(load.feed)
  const variety = kind === 'mixed' ? 'base' : feedVariety(load.feed)
  const quality = meanQuality(load.feed)
  return { kind: 'spirit', spirit: kind, variety, quality, count: 1, unitSale: bakeSpiritSale(kind, variety, quality), infused: false }
}

export function copyStillLoad(load: StillLoad): StillLoad {
  return load.kind === 'spirit' ? { kind: 'spirit', feed: load.feed.map(f => ({ ...f })) } : { ...load }
}

export function stillReady(c: PotStill): boolean {
  return c.inn !== 1 && stillFull(c.load)
}

export function stillWorking(c: PotStill): boolean {
  return stillReady(c) && c.progress > 0
}

export function barrelWorking(c: Barrel): boolean {
  return c.crop !== 'none' && feedUnits(c.feed) === barrelNeed(c.crop) && c.age < BARREL_AGE
}
