import { CROPS } from '../defs/crops.ts'
import {
  BARREL_AGE,
  BARREL_MATURE,
  CASK_AGE_MAX,
  CASK_AGE_MIN,
  FERT_BAG_LITERS,
  FLOUR,
  JAM_IN,
  JAM_SALE,
  JAM_SECONDS,
  JAM_SUGAR,
  KETCHUP_SUGAR,
  MILL_CHILLI_IN,
  MILL_IN,
  MILL_VANILLA_IN,
  MILL_WORK,
  OIL,
  CASK_SALE,
  SPIRIT_SALE,
  STILL_CAP,
  STILL_SECONDS,
  SUGAR_BAG,
  SUGAR_MILL,
  SUGAR_SHOP,
} from '../defs/items.ts'
import { SKUS } from '../defs/research.ts'
import { TREE_OFF_MUL, TREE_YIELD_DAYS, TREE_YIELD_MUL, TREES } from '../defs/trees.ts'
import {
  PURPOSE_MUL,
  QUALITY_TOP,
  TOL_MIN,
  VARIETIES,
  VARIETY,
  VARIETY_GROW,
  VARIETY_ROT,
  VARIETY_TOL,
  caskGroup,
  purposeOf,
  type Purpose,
  type VarietyId,
  type VarietyTier,
} from '../defs/varieties.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import {
  CASK_OF,
  SPIRIT_OF,
  packSku,
  type BarrelCrop,
  type CaskId,
  type CropId,
  type JamCrop,
  type MillRecipe,
  type SpiritKind,
  type StillCrop,
  ANNUAL_IDS,
  TREE_IDS,
  isTreeId,
} from '../sim/ids.ts'
import { skuItem } from '../sim/item.ts'
import {
  bakeCaskSale,
  bakeSpiritSale,
  barrelNeed,
  jamSale as liveJamSale,
  jamSugar as liveJamSugar,
  millProduct,
} from '../sim/feature-machines/machine.ts'
import { statsOf } from '../sim/modifiers.ts'
import { PLANT_FERT_PER_SEC, SOIL_TILL_WATER, SOIL_WATER_MID } from '../sim/soil.ts'

export const CROP_IDS: readonly CropId[] = [...ANNUAL_IDS, ...TREE_IDS]

export const OFF_CHANCE_START = -0.2
export const OFF_CHANCE_STEP = 0.2

export type PurposePair = { on: number; off: number }

export type Globals = {
  daySeconds: number
  soilWaterMid: number
  startWater: number
  treeYieldDays: number
  treeYieldMul: number
  treeOffMul: number
  offChanceStart: number
  offChanceStep: number
  fertDraw: number
  fertBagLiters: number
  fertCost: number
  sugarBag: number
  sugarShop: number
  sugarMill: number
  sugarFromMill: boolean
  fertPaid: boolean
  jamIn: number
  jamSugar: number
  ketchupSugar: number
  jamSeconds: number
  millIn: number
  millVanillaIn: number
  millWork: number
  stillCap: number
  stillSeconds: number
  barrelMature: number
  barrelAge: number
  caskAgeMin: number
  caskAgeMax: number
  qualityTop: number
  quality: number
  tolMin: number
  purpose: { variant: PurposePair; heirloom: PurposePair }
  varietyGrow: { base: number; variant: number; heirloom: number }
  varietyTol: { base: number; variant: number; heirloom: number }
  varietyRot: { base: number; variant: number; heirloom: number }
  buyClicks: number
  plantClicks: number
  harvestClicks: number
  sellClicks: number
  machineClicks: number
  sugarBagClicks: number
}

export type CropEdit = {
  id: CropId
  packPrice: number | null
  packUnits: number | null
  waterUsePerSec: number
  fruitSeconds: number
  juvenileSeconds: number | null
  sale: number
  waterTolerance: number
  rotSeconds: number
  saleMul: number
  jamSale: number | null
  millSale: number | null
  alcoholSale: number | null
  millRecipe: Exclude<MillRecipe, 'grass'> | null
  jamCrop: JamCrop | null
  stillKind: Exclude<SpiritKind, 'mixed'> | null
  caskKind: CaskId | null
  barrelIn: number | null
}

export type BalanceState = {
  g: Globals
  crops: CropEdit[]
}

export type Row = {
  id: CropId
  tree: boolean
  variety: VarietyId
  purpose: Purpose | 'base'
  packPrice: number | null
  packUnits: number | null
  costSeed: number | null
  waterUsePerSec: number
  fruitSeconds: number
  juvenileSeconds: number | null
  growSeconds: number
  growDays: number
  fruitDays: number
  totalWater: number
  pours: number
  rotDays: number
  saleBase: number
  fruitSale: number
  fertL: number
  fertCost: number
  produceCpm: number
  jamCpm: number | null
  millCpm: number | null
  alcoholCpm: number | null
  alcoholAgedCpm: number | null
  jamSale: number | null
  millSale: number | null
  alcoholSale: number | null
  alcoholAgedSale: number | null
  jamNet: number | null
  fieldClicks: number
  produceClicks: number
  coinPerClickProduce: number | null
  jamClicks: number | null
  millClicks: number | null
  alcoholClicks: number | null
  alcoholAgedClicks: number | null
  machineClicksJam: number | null
  machineClicksProcess: number | null
  coinPerClickJam: number | null
  coinPerClickMill: number | null
  coinPerClickAlcohol: number | null
  coinPerClickAlcoholAged: number | null
  F: number
  offDays: number | null
  fruitSaleLive: number
  jamSaleLive: number | null
  millSaleLive: number | null
  alcoholSaleLive: number | null
  alcoholAgedSaleLive: number | null
  jamSugarLive: number | null
  jamSugarL: number | null
}

function jamOf(id: CropId): JamCrop | null {
  if (id === 'apricot' || id === 'grape' || id === 'raspberry' || id === 'cherry' || id === 'tomato') return id
  return null
}

function millOf(id: CropId): Exclude<MillRecipe, 'grass'> | null {
  if (id === 'sugar-cane' || id === 'olive' || id === 'wheat' || id === 'vanilla' || id === 'chilli') return id
  return null
}

function stillOf(id: CropId): StillCrop | null {
  if (id === 'potato' || id === 'wheat' || id === 'apricot') return id
  return null
}

function barrelOf(id: CropId): BarrelCrop | null {
  if (id === 'grape' || id === 'apple') return id
  return null
}

function millBase(id: Exclude<MillRecipe, 'grass'>): number {
  if (id === 'sugar-cane') return SUGAR_BAG * SUGAR_MILL
  if (id === 'olive') return OIL
  if (id === 'wheat') return FLOUR
  return 0
}

function packOf(id: CropId): { price: number; units: number } | null {
  if (isTreeId(id)) return null
  const sku = packSku(id)
  if (sku === undefined) return null
  const face = skuItem(sku)
  if (face.kind !== 'seeds') return null
  return { price: SKUS[sku].price, units: face.count }
}

function alcoholBase(id: CropId): number | null {
  const still = stillOf(id)
  if (still !== null) return SPIRIT_SALE[SPIRIT_OF[still]]
  const barrel = barrelOf(id)
  if (barrel !== null) return CASK_SALE[CASK_OF[barrel]]
  return null
}

export function snapshot(): BalanceState {
  return {
    g: {
      daySeconds: DAY_SECONDS,
      soilWaterMid: SOIL_WATER_MID,
      startWater: SOIL_TILL_WATER,
      treeYieldDays: TREE_YIELD_DAYS,
      treeYieldMul: TREE_YIELD_MUL,
      treeOffMul: TREE_OFF_MUL,
      offChanceStart: OFF_CHANCE_START,
      offChanceStep: OFF_CHANCE_STEP,
      fertDraw: PLANT_FERT_PER_SEC,
      fertBagLiters: FERT_BAG_LITERS,
      fertCost: SKUS['buy-fertilizer'].price,
      sugarBag: SUGAR_BAG,
      sugarShop: SUGAR_SHOP,
      sugarMill: SUGAR_MILL,
      sugarFromMill: false,
      fertPaid: false,
      jamIn: JAM_IN,
      jamSugar: JAM_SUGAR,
      ketchupSugar: KETCHUP_SUGAR,
      jamSeconds: JAM_SECONDS,
      millIn: MILL_IN,
      millVanillaIn: MILL_VANILLA_IN,
      millWork: MILL_WORK,
      stillCap: STILL_CAP,
      stillSeconds: STILL_SECONDS,
      barrelMature: BARREL_MATURE,
      barrelAge: BARREL_AGE,
      caskAgeMin: CASK_AGE_MIN,
      caskAgeMax: CASK_AGE_MAX,
      qualityTop: QUALITY_TOP,
      quality: 0,
      tolMin: TOL_MIN,
      purpose: {
        variant: { on: PURPOSE_MUL.variant.on, off: PURPOSE_MUL.variant.off },
        heirloom: { on: PURPOSE_MUL.heirloom.on, off: PURPOSE_MUL.heirloom.off },
      },
      varietyGrow: { base: VARIETY_GROW.base, variant: VARIETY_GROW.variant, heirloom: VARIETY_GROW.heirloom },
      varietyTol: { base: VARIETY_TOL.base, variant: VARIETY_TOL.variant, heirloom: VARIETY_TOL.heirloom },
      varietyRot: { base: VARIETY_ROT.base, variant: VARIETY_ROT.variant, heirloom: VARIETY_ROT.heirloom },
      buyClicks: 1,
      plantClicks: 1,
      harvestClicks: 1,
      sellClicks: 1,
      machineClicks: 2,
      sugarBagClicks: 3,
    },
    crops: CROP_IDS.map(id => {
      const def = CROPS[id]
      const tree = isTreeId(id) ? TREES[id] : null
      const jam = jamOf(id)
      const mill = millOf(id)
      const still = stillOf(id)
      const barrel = barrelOf(id)
      const pack = packOf(id)
      return {
        id,
        packPrice: pack === null ? null : pack.price,
        packUnits: pack === null ? null : pack.units,
        waterUsePerSec: def.waterUsePerSec,
        fruitSeconds: tree === null ? def.growSeconds : tree.fruitSeconds,
        juvenileSeconds: tree === null ? null : tree.juvenileSeconds,
        sale: def.sale,
        waterTolerance: def.waterTolerance,
        rotSeconds: def.rotSeconds,
        saleMul: def.saleMul === undefined ? 1 : def.saleMul,
        jamSale: jam === null ? null : JAM_SALE[jam],
        millSale: mill === null ? null : millBase(mill),
        alcoholSale: alcoholBase(id),
        millRecipe: mill,
        jamCrop: jam,
        stillKind: still === null ? null : SPIRIT_OF[still],
        caskKind: barrel === null ? null : CASK_OF[barrel],
        barrelIn: barrel === null ? null : barrelNeed(barrel),
      }
    }),
  }
}

export const ORIGIN = snapshot()

export function sameState(a: BalanceState, b: BalanceState): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function tierOf(variety: VarietyId): VarietyTier {
  if (variety === 'base') return 'base'
  return VARIETY[variety].tier
}

function qualityMulAt(q: number, top: number): number {
  return 1 + (top - 1) * q
}

function purposeMulAt(variety: VarietyId, path: Purpose, g: Globals): number {
  if (variety === 'base') return 1
  const { tier, purpose } = VARIETY[variety]
  const mul = g.purpose[tier]
  return purpose === path ? mul.on : mul.off
}

function daysAt(s: number, g: Globals): number {
  return s / g.daySeconds
}

function perMin(net: number, seconds: number): number {
  return (net / seconds) * 60
}

function expectedOffDays(start: number, step: number): number {
  let chance = start
  let pStill = 1
  let e = 0
  for (let d = 1; pStill > 1e-15 && d < 1000; d++) {
    chance += step
    const pOn = chance < 0 ? 0 : chance > 1 ? 1 : chance
    e += d * pStill * pOn
    pStill *= 1 - pOn
    if (pOn >= 1) break
  }
  return e
}

function seasonF(onDays: number, onMul: number, offDays: number, offMul: number): number {
  return (onDays * onMul + offDays * offMul) / (onDays + offDays)
}

function poursUnrounded(totalUse: number, start: number, mid: number, tol: number): number {
  if (totalUse <= 0) return 0
  const low = mid - tol
  const high = mid + tol
  const first = Math.max(0, start - low)
  if (totalUse <= first) return 0
  return (totalUse - first) / (high - low)
}

function jamSugarAt(crop: JamCrop, variety: VarietyId, g: Globals): number {
  if (variety === 'san-marzano') return 0
  if (crop === 'tomato') return g.ketchupSugar
  return g.jamSugar
}

function millInAt(recipe: Exclude<MillRecipe, 'grass'>, g: Globals): number {
  if (recipe === 'vanilla') return g.millVanillaIn
  if (recipe === 'chilli') return MILL_CHILLI_IN
  return g.millIn
}

function growUnitCost(c: CropEdit, g: Globals): number {
  const growSeconds = c.fruitSeconds * g.varietyGrow.base
  const fertL = g.fertDraw * growSeconds
  const fertUnit = g.fertPaid ? (fertL / g.fertBagLiters) * g.fertCost : 0
  const seedUnit = c.packPrice === null || c.packUnits === null ? 0 : c.packPrice / c.packUnits
  return seedUnit + fertUnit
}

function millSugarGrowPerL(cane: CropEdit, g: Globals): number {
  const inn = millInAt('sugar-cane', g)
  return (inn * growUnitCost(cane, g)) / g.sugarBag
}

function liveMillSale(recipe: Exclude<MillRecipe, 'grass'>, variety: VarietyId, quality: number): number {
  const p = millProduct(recipe, variety, quality)
  if (p.kind === 'sugar') return p.liters * p.unitSale
  if (p.kind === 'oil' || p.kind === 'flour' || p.kind === 'extract') return p.count * p.unitSale
  return 0
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9
}

export function parityOk(row: Row, pristine: boolean): boolean {
  if (pristine === false) return true
  if (close(row.fruitSale, row.fruitSaleLive) === false) return false
  if (row.jamSale !== null && row.jamSaleLive !== null && close(row.jamSale, row.jamSaleLive) === false) return false
  if (row.millSale !== null && row.millSaleLive !== null && close(row.millSale, row.millSaleLive) === false) return false
  if (row.alcoholSale !== null && row.alcoholSaleLive !== null && close(row.alcoholSale, row.alcoholSaleLive) === false)
    return false
  if (
    row.alcoholAgedSale !== null &&
    row.alcoholAgedSaleLive !== null &&
    close(row.alcoholAgedSale, row.alcoholAgedSaleLive) === false
  )
    return false
  if (row.jamSugarL !== null && row.jamSugarLive !== null && close(row.jamSugarL, row.jamSugarLive) === false) return false
  return true
}

export function cellParity(got: number | null, live: number | null, pristine: boolean): boolean {
  if (pristine === false || got === null || live === null) return true
  return close(got, live)
}

export function compute(state: BalanceState): { rows: Row[]; offDays: number; treeF: number } {
  const g = state.g
  const offDays = expectedOffDays(g.offChanceStart, g.offChanceStep)
  const treeF = seasonF(g.treeYieldDays, g.treeYieldMul, offDays, g.treeOffMul)
  const qMul = qualityMulAt(g.quality, g.qualityTop)
  const cane = state.crops.find(x => x.id === 'sugar-cane')
  const sugarPrice =
    g.sugarFromMill && cane !== undefined ? millSugarGrowPerL(cane, g) : g.sugarShop
  const rows = state.crops.flatMap(c =>
    VARIETIES[c.id].map(variety => {
    const tree = isTreeId(c.id)
    const tier = tierOf(variety)
    const growSeconds = tree
      ? (c.juvenileSeconds === null ? c.fruitSeconds : c.juvenileSeconds)
      : c.fruitSeconds * g.varietyGrow[tier]
    const F = tree ? treeF : 1
    const fruitPeriod = tree ? c.fruitSeconds / F : growSeconds
    const tol = Math.max(g.tolMin, c.waterTolerance * g.varietyTol[tier])
    const totalWater = tree ? 0 : c.waterUsePerSec * growSeconds
    const pours = tree ? 0 : poursUnrounded(totalWater, g.startWater, g.soilWaterMid, tol)
    const fruitSale = c.sale * qMul * purposeMulAt(variety, 'produce', g) * c.saleMul
    const fertL = tree ? 0 : g.fertDraw * growSeconds
    const fertCost = (fertL / g.fertBagLiters) * g.fertCost
    const fertUnit = g.fertPaid ? fertCost : 0
    const costSeed = c.packPrice === null || c.packUnits === null ? null : c.packPrice / c.packUnits
    const seedUnit = costSeed === null ? 0 : costSeed
    const unitCost = seedUnit + fertUnit
    const produceNet = fruitSale - unitCost
    const produceCpm = perMin(produceNet, fruitPeriod)
    const buy = c.packUnits === null ? 0 : g.buyClicks / c.packUnits
    const plant = tree ? 0 : g.plantClicks
    const fieldClicks = buy + plant + g.harvestClicks + pours
    const produceClicks = fieldClicks + g.sellClicks

    let jamSale: number | null = null
    let jamNet: number | null = null
    let jamCpm: number | null = null
    let jamClicks: number | null = null
    let machineClicksJam: number | null = null
    let coinPerClickJam: number | null = null
    let jamSugarL: number | null = null
    let jamSaleLive: number | null = null
    let jamSugarLive: number | null = null
    if (c.jamCrop !== null && c.jamSale !== null) {
      const inn = g.jamIn
      const jamBatch = c.jamSale * purposeMulAt(variety, 'processed', g) * qMul
      jamSale = jamBatch / inn
      jamSugarL = jamSugarAt(c.jamCrop, variety, g)
      jamNet = jamBatch - jamSugarL * sugarPrice - inn * unitCost
      const jamTime = inn * fruitPeriod + g.jamSeconds
      jamCpm = perMin(jamNet, jamTime)
      const sugarClicks = g.sugarBagClicks * (jamSugarL / g.sugarBag)
      machineClicksJam = g.machineClicks + sugarClicks
      jamClicks = machineClicksJam / inn
      const jamPathClicks = produceClicks + jamClicks
      coinPerClickJam = jamPathClicks === 0 ? null : jamNet / inn / jamPathClicks
      jamSaleLive = liveJamSale(c.jamCrop, variety, g.quality) / inn
      jamSugarLive = liveJamSugar(c.jamCrop, variety)
    }

    let millSale: number | null = null
    let millCpm: number | null = null
    let millClicks: number | null = null
    let coinPerClickMill: number | null = null
    let millSaleLive: number | null = null
    let machineClicksProcess: number | null = null
    if (c.millRecipe !== null && c.millSale !== null) {
      const millBatch = c.millSale * purposeMulAt(variety, 'processed', g) * qMul
      const inn = millInAt(c.millRecipe, g)
      millSale = millBatch / inn
      const millNet = millBatch - inn * unitCost
      const millTime = inn * fruitPeriod + g.millWork
      millCpm = perMin(millNet, millTime)
      millClicks = g.machineClicks / inn
      const millPathClicks = produceClicks + millClicks
      coinPerClickMill = millPathClicks === 0 ? null : millNet / inn / millPathClicks
      millSaleLive = liveMillSale(c.millRecipe, variety, g.quality) / inn
      machineClicksProcess = g.machineClicks
    }

    let alcoholSale: number | null = null
    let alcoholCpm: number | null = null
    let alcoholClicks: number | null = null
    let coinPerClickAlcohol: number | null = null
    let alcoholSaleLive: number | null = null
    let alcoholAgedSale: number | null = null
    let alcoholAgedCpm: number | null = null
    let alcoholAgedClicks: number | null = null
    let coinPerClickAlcoholAged: number | null = null
    let alcoholAgedSaleLive: number | null = null
    if (c.alcoholSale !== null && c.stillKind !== null) {
      const alcoholBatch = c.alcoholSale * purposeMulAt(variety, 'alcohol', g) * qMul
      const inn = g.stillCap
      alcoholSale = alcoholBatch / inn
      const extra = g.stillSeconds
      const alcoholNet = alcoholBatch - inn * unitCost
      const alcoholTime = inn * fruitPeriod + extra
      alcoholCpm = perMin(alcoholNet, alcoholTime)
      alcoholClicks = g.machineClicks / inn
      const stillPathClicks = produceClicks + alcoholClicks
      coinPerClickAlcohol = stillPathClicks === 0 ? null : alcoholNet / inn / stillPathClicks
      alcoholSaleLive = bakeSpiritSale(c.stillKind, variety, g.quality) / inn
      machineClicksProcess = g.machineClicks
    } else if (c.alcoholSale !== null && c.caskKind !== null && c.barrelIn !== null) {
      const alcoholBatch = c.alcoholSale * purposeMulAt(variety, 'alcohol', g) * qMul
      const inn = c.barrelIn
      alcoholSale = alcoholBatch / inn
      const extra = g.barrelMature
      const alcoholNet = alcoholBatch - inn * unitCost
      const alcoholTime = inn * fruitPeriod + extra
      alcoholCpm = perMin(alcoholNet, alcoholTime)
      alcoholClicks = g.machineClicks / inn
      const caskPathClicks = produceClicks + alcoholClicks
      coinPerClickAlcohol = caskPathClicks === 0 ? null : alcoholNet / inn / caskPathClicks
      alcoholSaleLive = bakeCaskSale(c.caskKind, variety, g.quality, BARREL_MATURE) / inn
      machineClicksProcess = g.machineClicks
      const heirloomCask = caskGroup(variety) === 'heirloom'
      const agedMul = heirloomCask ? g.caskAgeMax : g.caskAgeMin
      const extraWait = heirloomCask ? (g.barrelAge * g.caskAgeMax) / g.caskAgeMin : g.barrelAge
      const agedBatch = alcoholBatch * agedMul
      alcoholAgedSale = agedBatch / inn
      const agedNet = agedBatch - inn * unitCost
      const agedTime = inn * fruitPeriod + g.barrelMature + extraWait
      alcoholAgedCpm = perMin(agedNet, agedTime)
      alcoholAgedClicks = alcoholClicks
      coinPerClickAlcoholAged = caskPathClicks === 0 ? null : agedNet / inn / caskPathClicks
      alcoholAgedSaleLive = heirloomCask
        ? null
        : bakeCaskSale(c.caskKind, variety, g.quality, BARREL_MATURE + BARREL_AGE) / inn
    }

    return {
      id: c.id,
      tree,
      variety,
      purpose: purposeOf(variety),
      packPrice: c.packPrice,
      packUnits: c.packUnits,
      costSeed,
      waterUsePerSec: c.waterUsePerSec,
      fruitSeconds: c.fruitSeconds,
      juvenileSeconds: c.juvenileSeconds,
      growSeconds,
      growDays: daysAt(growSeconds, g),
      fruitDays: daysAt(fruitPeriod, g),
      totalWater,
      pours,
      rotDays: daysAt(c.rotSeconds * g.varietyRot[tier], g),
      saleBase: c.sale,
      fruitSale,
      fertL,
      fertCost,
      produceCpm,
      jamCpm,
      millCpm,
      alcoholCpm,
      alcoholAgedCpm,
      jamSale,
      millSale,
      alcoholSale,
      alcoholAgedSale,
      jamNet,
      fieldClicks,
      produceClicks,
      coinPerClickProduce: produceClicks === 0 ? null : produceNet / produceClicks,
      jamClicks,
      millClicks,
      alcoholClicks,
      alcoholAgedClicks,
      machineClicksJam,
      machineClicksProcess,
      coinPerClickJam,
      coinPerClickMill,
      coinPerClickAlcohol,
      coinPerClickAlcoholAged,
      F,
      offDays: tree ? offDays : null,
      fruitSaleLive: statsOf(c.id, variety, g.quality, []).sale,
      jamSaleLive,
      millSaleLive,
      alcoholSaleLive,
      alcoholAgedSaleLive,
      jamSugarLive,
      jamSugarL,
    }
    }),
  )
  return { rows, offDays, treeF }
}

function csvCell(v: string | number | null): string {
  if (v === null) return ''
  const s = String(v)
  if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replaceAll('"', '""')}"`
  return s
}

export function toCsv(rows: Row[], g: Globals): string {
  const headers = [
    'crop',
    'kind',
    'variety',
    'quality',
    'pack_price',
    'pack_size',
    'cost_seed',
    'grow_seconds',
    'grow_days',
    'fruit_seconds',
    'fruit_days',
    'water_use_per_sec',
    'total_water_L',
    'pours',
    'fert_L',
    'fert_cost',
    'fruit_sale',
    'fruit_coin_per_min',
    'clicks_produce',
    'coin_per_click_produce',
    'jam_sale',
    'jam_net',
    'jam_coin_per_min',
    'clicks_jam',
    'coin_per_click_jam',
    'mill_sale',
    'mill_coin_per_min',
    'clicks_mill',
    'coin_per_click_mill',
    'alcohol_sale',
    'alcohol_coin_per_min',
    'clicks_alcohol',
    'coin_per_click_alcohol',
    'alcohol_aged_sale',
    'alcohol_aged_coin_per_min',
    'clicks_alcohol_aged',
    'coin_per_click_alcohol_aged',
  ]
  const body = rows.map(r =>
    [
      r.id,
      r.tree ? 'tree' : 'annual',
      r.variety,
      g.quality,
      r.packPrice,
      r.packUnits,
      r.costSeed,
      r.growSeconds,
      r.growDays,
      r.fruitSeconds,
      r.fruitDays,
      r.waterUsePerSec,
      r.totalWater,
      r.pours,
      r.fertL,
      r.fertCost,
      r.fruitSale,
      r.produceCpm,
      r.produceClicks,
      r.coinPerClickProduce,
      r.jamSale,
      r.jamNet,
      r.jamCpm,
      r.jamClicks,
      r.coinPerClickJam,
      r.millSale,
      r.millCpm,
      r.millClicks,
      r.coinPerClickMill,
      r.alcoholSale,
      r.alcoholCpm,
      r.alcoholClicks,
      r.coinPerClickAlcohol,
      r.alcoholAgedSale,
      r.alcoholAgedCpm,
      r.alcoholAgedClicks,
      r.coinPerClickAlcoholAged,
    ]
      .map(csvCell)
      .join(','),
  )
  return [headers.join(','), ...body].join('\n') + '\n'
}

export const ORIGIN_CROP: { readonly [K in CropId]: CropEdit } = Object.fromEntries(
  ORIGIN.crops.map(c => [c.id, c]),
) as { readonly [K in CropId]: CropEdit }
