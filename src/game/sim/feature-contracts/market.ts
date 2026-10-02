import { COMPANY_IDS, COMPANY_PRIZES, PRIZE_BAND_MIN, prizeBandOf } from '../../defs/companies.ts'
import { CROPS } from '../../defs/crops.ts'
import { SKUS } from '../../defs/research.ts'
import {
  BREAD,
  FERT_BAG_LITERS,
  FLOUR,
  JAM_SALE,
  OIL,
  SUGAR_MILL,
  CASK_SALE,
} from '../../defs/items.ts'
import { DOOR } from '../building.ts'
import { DAY_SECONDS } from '../clock.ts'
import {
  ANNUAL_IDS,
  BARREL_CROPS,
  CASK_IDS,
  CASK_OF,
  JAM_CROPS,
  JAM_IDS,
  PLANT_CROPS,
  SPIRIT_KINDS,
  SPIRIT_OF,
  STILL_CROPS,
  TREE_IDS,
  isAnnualId,
  type CaskId,
  type GrownCrop,
  type JamCrop,
  type JamId,
  type PlantCrop,
  type SpiritKind,
  type StallGoodId,
} from '../ids.ts'
import { makeAxe, makePickaxe, makeShovel, type Item } from '../item.ts'
import { bakeSpiritSale } from '../feature-machines/machine.ts'
import type {
  Active,
  Bins,
  CompanyBook,
  CompanyId,
  Condition,
  ContractId,
  ContractOffer,
  Contracts,
  ContractTuning,
  DeadlineBand,
  DeadlineTuning,
  Delivered,
  Demand,
  GoodTuning,
  GroupId,
  HistoryEntry,
  Lines,
  Need,
  Prize,
  PrizePool,
  PrizeTool,
  Range,
  Stars,
  VarietyNeed,
} from './market.h.ts'
import { NamedProduce, OfftypeNamedProduce, SpecialtyAlcohol, SpecialtyProcessed, is } from '../../defs/contracts.ts'
import { isBakedStall, isCropStall, STALL_IDS } from '../stall.ts'
import { WEATHER_FRUIT_IMPACT } from '../../defs/weather.ts'
import { FAMILIARITY_RECOVER, VARIETIES, tierOf, type VarietyId, type VarietyTier } from '../../defs/varieties.ts'
import { boughtSeedQuality } from '../store.ts'
import type { Rng, Spatial } from '../rng.ts'
import type { World } from '../world.ts'

export const SAT_MAX_CUT = 0.5

export const SAT_RECOVER: { readonly [K in StallGoodId]: number } = {
  carrot: 0.3,
  potato: 0.2,
  'sugar-cane': 0.2,
  cherry: 0.2,
  wheat: 0.15,
  chilli: 0.15,
  apricot: 0.15,
  olive: 0.15,
  apple: 0.15,
  tomato: 0.1,
  grape: 0.1,
  raspberry: 0.1,
  vanilla: 0.1,
  vodka: 0.3,
  beer: 0.3,
  brandy: 0.3,
  mixed: 0.3,
  wine: 0.3,
  cider: 0.3,
  'jam-apricot': 0.3,
  'jam-grape': 0.3,
  'jam-raspberry': 0.3,
  'jam-cherry': 0.3,
  'jam-tomato': 0.3,
  oil: 0.3,
  flour: 0.3,
  bread: 0.3,
  sugar: 0.3,
}

export const SAT_MIN = -0.8

export const SAT_MAX = 1

export const DEMAND_NUDGE = 33

export const SAT_STEP_FRUIT = 0.02

export const SAT_STEP_CRAFT = 0.06

export const SAT_IMPACT_FRUIT: { readonly [K in VarietyTier]: number } = {
  base: 0.5,
  variant: 0.4,
  heirloom: 0.3,
}

export const SAT_IMPACT_CRAFT: { readonly [K in VarietyTier]: number } = {
  base: 0.35,
  variant: 0.25,
  heirloom: 0.25,
}

export function stepOf(good: StallGoodId): number {
  return isCropStall(good) ? SAT_STEP_FRUIT : SAT_STEP_CRAFT
}

export function impactOf(good: StallGoodId, variety: VarietyId): number {
  const t = tierOf(variety)
  if (isCropStall(good)) return SAT_IMPACT_FRUIT[t]
  if (isBakedStall(good) || good === 'oil') return SAT_IMPACT_CRAFT.base
  return SAT_IMPACT_CRAFT[t]
}

export function clampSat(sat: number): number {
  if (sat < SAT_MIN) return SAT_MIN
  if (sat > SAT_MAX) return SAT_MAX
  return sat
}

export function cutOf(sat: number, cap: number): number {
  const raw = sat * SAT_MAX_CUT
  return raw < cap ? raw : cap
}

export function mul(sat: number, cap: number, weatherAdd = 0): number {
  return 1 - cutOf(sat, cap) + weatherAdd
}

export function saleUnits(
  sat: number,
  n: number,
  rate: number,
  cap: number,
  avg: number,
  weatherAdd: number,
): { paid: number; after: number } {
  if (n <= 0) return { paid: 0, after: sat }
  const start = sat * SAT_MAX_CUT
  const iHit = start >= cap ? 0 : Math.ceil((cap - start) / rate - 1e-12)
  const nLow = iHit < n ? (iHit < 0 ? 0 : iHit) : n
  const nHigh = n - nLow
  const sumCuts = nLow * start + rate * nLow * (nLow - 1) / 2 + nHigh * cap
  const paid = avg * (n * (1 + weatherAdd) - sumCuts)
  const after = clampSat(sat + n * rate / SAT_MAX_CUT)
  return { paid, after }
}

export function recoverPerDay(good: StallGoodId, familiarityOf: (crop: GrownCrop) => number): number {
  return SAT_RECOVER[good] + (isCropStall(good) ? familiarityOf(good) * FAMILIARITY_RECOVER : 0)
}

export function recover(
  good: StallGoodId,
  sat: number,
  dt: number,
  familiarityOf: (crop: GrownCrop) => number,
): number {
  const step = (recoverPerDay(good, familiarityOf) / SAT_MAX_CUT) * dt / DAY_SECONDS
  if (sat > 0) {
    const next = sat - step
    return next < 0 ? 0 : next
  }
  if (sat < 0) {
    const next = sat + step
    return next > 0 ? 0 : next
  }
  return 0
}

export function rollDayDemand(rng: Rng, day: number): readonly { good: StallGoodId; delta: number }[] {
  const crops = STALL_IDS.filter(isCropStall)
  const stream = rng.stream('market-demand')
  const i0 = Math.floor(stream.at(day, 0) * crops.length)
  let i1 = Math.floor(stream.at(day, 1) * (crops.length - 1))
  if (i1 >= i0) i1 += 1
  return [
    { good: crops[i0], delta: DEMAND_NUDGE },
    { good: crops[i1], delta: -DEMAND_NUDGE },
  ]
}

export function applyDayDemand(w: World): void {
  rollDayDemand(w.rng, w.clock.day).forEach(({ good, delta }) => {
    w.stall[good].sat = clampSat(w.stall[good].sat - delta / 100 / SAT_MAX_CUT)
  })
}

export const CONTRACT_OFFERS = 6

export const CONTRACT_ACTIVE = 3

export const BROKER_MAX_TIER = 3

export const CONTRACT_SLOT_MAX = CONTRACT_OFFERS + BROKER_MAX_TIER

export const CONTRACT_HISTORY_MAX = 24

export const DIFFICULTY_MAX = 40

export const DIFFICULTY_START = 8

export const DIFFICULTY_PER_DAY = 0.8

export const DIFFICULTY_CEILING = 60

export const REP_MAX = 20

export const REP_DONE: { readonly [K in Stars]: number } = { 1: 0.5, 2: 1, 3: 1.5, 4: 2 }

export const STARTER_CROPS: readonly PlantCrop[] = ['carrot', 'potato', 'wheat']

export const D_STARTER = -1

export const SLOT_BANDS: readonly (readonly [number, number])[] = [
  [8, 16],
  [13, 21],
  [18, 26],
  [23, 31],
  [28, 36],
  [32, 40],
  [25, 33],
  [32, 40],
  [28, 36],
]

export const STAR_MIN: { readonly [K in Stars]: number } = {
  1: 0,
  2: 10,
  3: 20,
  4: 30,
}

export const NICE_AMOUNTS: readonly number[] = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]

export const MARKUP_BASE = 0.15

export const MARKUP_PER_DIFFICULTY = 0.004

export const MARKUP_BAND: { readonly [K in DeadlineBand]: number } = {
  short: 0.11,
  normal: 0.05,
}

export const LOAD_MIN = 0.12

export const LOAD_MAX = 1.35

export const LOAD_CURVE = 2

export const LOAD_D_OFFSET = 6

export const MIX_FLOOR = 2

export const MIX_SHARE = 0.5

export const BUDGET_OVERDRAFT = 3

export const AMOUNT_MIN = 2

export const PENALTY_FLOOR = 0.25

export const PAIR_COST = 10

export const GROUP_COST = -4

export const GROUP_CHANCE = 0.5

export const PRIZE_SLOTS = 2

export const DEADLINE_DAYS: { readonly [K in DeadlineBand]: Range } = {
  short: [1, 2.5],
  normal: [2, 3.5],
}

export const DEADLINE_STEP = 0.5

export const DEADLINE_COST: { readonly [K in DeadlineBand]: number } = {
  short: 8,
  normal: 0,
}

export const CONDITIONS: readonly Condition[] = ['pair', 'freshness', 'quality', 'variety', 'short', 'large']

export const CONDITIONS_PER_LEVEL = 0.1

export const CONDITIONS_JITTER = 1

export const CONDITIONS_MAX = 6

export const CONDITION_WEIGHT: { readonly [K in Condition]: number } = {
  pair: 1,
  freshness: 1,
  quality: 1,
  variety: 1,
  short: 1,
  large: 1,
}

export const FRESHNESS_RANGE: Range = [0.4, 0.8]

export const QUALITY_RANGE: Range = [0, 0.9]

export const HEIRLOOM_RANGE: Range = [0, 1]

export const LARGE_MUL = 2

export const ANY_NEED: Need = { variety: { kind: 'any' }, quality: 0, freshness: 0 }

export const GOOD_COST: { readonly [K in StallGoodId]: number } = {
  carrot: 0,
  potato: 1,
  wheat: 2,
  tomato: 3,
  grape: 4,
  olive: 5,
  raspberry: 6,
  apple: 5,
  apricot: 5,
  cherry: 6,
  'sugar-cane': 4,
  vanilla: 14,
  chilli: 7,
  sugar: 3,
  'jam-apricot': 6,
  'jam-grape': 6,
  'jam-raspberry': 6,
  'jam-cherry': 6,
  'jam-tomato': 6,
  oil: 5,
  flour: 4,
  bread: 4,
  vodka: 8,
  beer: 7,
  brandy: 10,
  mixed: 4,
  wine: 12,
  cider: 13,
}

export const GOOD_TIER: { readonly [K in StallGoodId]: Stars } = {
  carrot: 1,
  potato: 1,
  wheat: 1,
  tomato: 1,
  raspberry: 1,
  olive: 3,
  grape: 1,
  vanilla: 1,
  chilli: 1,
  'sugar-cane': 1,
  apple: 3,
  apricot: 3,
  cherry: 3,
  'jam-grape': 2,
  'jam-raspberry': 2,
  'jam-tomato': 2,
  'jam-apricot': 3,
  'jam-cherry': 3,
  oil: 2,
  flour: 2,
  bread: 2,
  wine: 2,
  cider: 3,
  vodka: 2,
  beer: 2,
  brandy: 2,
  mixed: 2,
  sugar: 1,
}

export const GROUP_TIER: { readonly [K in GroupId]: Stars } = { jam: 3, spirit: 2 }

export const GROUP_SHARES: { readonly [K in GroupId]: Range } = { jam: [0, 60], spirit: [0, 60] }

export const CONTRACT_OFF: readonly StallGoodId[] = ['sugar', 'beer', 'flour']

export const GOOD_SHARES: { readonly [K in StallGoodId]: Range } = {
  carrot: [90, -5],
  potato: [70, 5],
  wheat: [60, 10],
  tomato: [35, 45],
  raspberry: [15, 50],
  grape: [35, 45],
  vanilla: [-15, 40],
  chilli: [0, 20],
  'sugar-cane': [0, 20],
  apple: [2, 50],
  apricot: [-8, 50],
  olive: [-15, 55],
  cherry: [-10, 50],
  sugar: [60, 10],
  vodka: [-5, 55],
  beer: [-10, 50],
  brandy: [-15, 60],
  mixed: [-5, 45],
  wine: [-12, 60],
  cider: [-12, 60],
  'jam-apricot': [-12, 55],
  'jam-grape': [-5, 55],
  'jam-raspberry': [-10, 55],
  'jam-cherry': [-15, 55],
  'jam-tomato': [0, 55],
  oil: [-20, 65],
  flour: [-10, 50],
  bread: [-5, 55],
}

export const FEASIBLE_PER_DAY: { readonly [K in StallGoodId]: number } = {
  carrot: 21,
  potato: 16,
  wheat: 11,
  tomato: 7,
  raspberry: 6,
  olive: 4,
  grape: 6,
  vanilla: 4,
  chilli: 8,
  'sugar-cane': 10,
  apple: 3,
  apricot: 4,
  cherry: 4,
  vodka: 4 / 3,
  beer: 4 / 3,
  brandy: 4 / 3,
  mixed: 4 / 3,
  'jam-apricot': 12,
  'jam-grape': 12,
  'jam-raspberry': 12,
  'jam-cherry': 12,
  'jam-tomato': 12,
  oil: 80,
  flour: 80,
  bread: 1,
  sugar: 160,
  wine: 1,
  cider: 0.6,
}

const JAM_MIN = Math.min(...JAM_IDS.map(id => JAM_SALE[jamCrop(id)]))

type Shape =
  | { kind: 'plain'; good: StallGoodId; variety: VarietyNeed }
  | { kind: 'group'; group: 'jam' }
  | { kind: 'group'; group: 'spirit' }

type Option = { good: StallGoodId; variety: VarietyNeed; weight: number }

type Frame = { band: DeadlineBand; days: number; pair: boolean; budget: number; solo: number; share: number }

const VARIETY_GROUPS = [NamedProduce, OfftypeNamedProduce, SpecialtyAlcohol, SpecialtyProcessed]

export function lineItem(good: StallGoodId, variety: VarietyId, count: number): Delivered {
  if (good === 'sugar') return { kind: 'sugar', liters: count, capacityLiters: count, unitSale: SUGAR_MILL, quality: 0 }
  if (good === 'flour' || good === 'bread') return { kind: good, quality: 0, count, unitSale: unitOf(good) }
  if (good === 'oil') return { kind: 'oil', quality: 0, count, unitSale: OIL, infused: false }
  if (isCaskClass(good)) return { kind: 'cask', cask: good, variety, quality: 0, count, unitSale: CASK_SALE[good], infused: false }
  if (isSpiritClass(good)) return { kind: 'spirit', spirit: good, variety, quality: 0, count, unitSale: unitOf(good), infused: false }
  if (isJamClass(good)) {
    return { kind: 'jam', crop: jamCrop(good), variety, quality: 0, count, unitSale: JAM_SALE[jamCrop(good)], infused: false }
  }
  return { kind: 'fruit', crop: good, variety, quality: 0, cut: false, count, unitSale: CROPS[good].sale, freshness: 1 }
}

function productsOf(crop: GrownCrop): readonly StallGoodId[] {
  const jam = JAM_CROPS.find(c => c === crop)
  const still = STILL_CROPS.find(c => c === crop)
  const barrel = BARREL_CROPS.find(c => c === crop)
  return [
    crop,
    ...(jam === undefined ? [] : [`jam-${jam}` as const]),
    ...(still === undefined ? [] : [SPIRIT_OF[still]]),
    ...(barrel === undefined ? [] : [CASK_OF[barrel]]),
  ]
}

export const VARIETY_GOODS: readonly { good: StallGoodId; variety: VarietyId }[] = [...PLANT_CROPS, ...TREE_IDS].flatMap(crop =>
  VARIETIES[crop]
    .filter(v => tierOf(v) !== 'base')
    .flatMap(variety =>
      productsOf(crop)
        .filter(good => is(lineItem(good, variety, 1))(VARIETY_GROUPS))
        .map(good => ({ good, variety })),
    ),
)

function isJamClass(g: StallGoodId): g is JamId {
  return (JAM_IDS as readonly string[]).includes(g)
}

function isSpiritClass(g: StallGoodId): g is SpiritKind {
  return (SPIRIT_KINDS as readonly string[]).includes(g)
}

function isCaskClass(g: StallGoodId): g is CaskId {
  return (CASK_IDS as readonly string[]).includes(g)
}

function jamCrop(id: JamId): JamCrop {
  return id.slice(4) as JamCrop
}

function weightedPick<T>(xs: readonly T[], weight: (x: T) => number, u: number): T {
  let acc = u * xs.reduce((n, x) => n + weight(x), 0)
  for (const x of xs) {
    acc -= weight(x)
    if (acc < 0) return x
  }
  return xs[xs.length - 1]
}

function lerp([lo, hi]: Range, x: number): number {
  return lo + (hi - lo) * x
}

function percent(n: number): number {
  return Math.round(n * 100) / 100
}

function starsOf(t: ContractTuning, D: number): Stars {
  if (D >= t.starMin[4]) return 4
  if (D >= t.starMin[3]) return 3
  if (D >= t.starMin[2]) return 2
  return 1
}

function nice(t: ContractTuning, x: number): number {
  return t.niceAmounts.reduce((n, a) => (a <= x ? a : n), t.niceAmounts[0])
}

export function load(t: ContractTuning, D: number): number {
  const x = (D + t.loadDOffset) / (t.difficultyCeiling + t.loadDOffset)
  return t.loadMin + (t.loadMax - t.loadMin) * x ** t.loadCurve
}

export function cleanUnit(d: Demand): number {
  if (d.kind === 'group') {
    if (d.group === 'jam') return JAM_MIN
    return bakeSpiritSale('vodka', 'base', 0)
  }
  return unitOf(d.good)
}

export function demandGood(d: Demand): StallGoodId {
  if (d.kind === 'plain') return d.good
  if (d.group === 'jam') return 'jam-cherry'
  return 'vodka'
}

export function unitOf(good: StallGoodId): number {
  if (isJamClass(good)) return JAM_SALE[jamCrop(good)]
  if (good === 'sugar') return SUGAR_MILL
  if (good === 'oil') return OIL
  if (good === 'flour') return FLOUR
  if (good === 'bread') return BREAD
  if (isCaskClass(good)) return CASK_SALE[good]
  if (isSpiritClass(good)) return bakeSpiritSale(good, 'base', 0)
  return CROPS[good].sale
}

function deadlineOf(band: DeadlineBand): DeadlineTuning {
  const [lo, hi] = DEADLINE_DAYS[band]
  return { lo, hi, cost: DEADLINE_COST[band], markup: MARKUP_BAND[band] }
}

function goodOf(good: StallGoodId): GoodTuning {
  return {
    on: !CONTRACT_OFF.includes(good),
    tier: GOOD_TIER[good],
    cost: GOOD_COST[good],
    feasible: FEASIBLE_PER_DAY[good],
    price: unitOf(good),
    starter: (STARTER_CROPS as readonly string[]).includes(good),
    shares: GOOD_SHARES[good],
  }
}

export const CONTRACT_TUNING: ContractTuning = {
  difficultyStart: DIFFICULTY_START,
  difficultyPerDay: DIFFICULTY_PER_DAY,
  difficultyMax: DIFFICULTY_MAX,
  difficultyCeiling: DIFFICULTY_CEILING,
  slotBands: SLOT_BANDS,
  starMin: STAR_MIN,
  dStarter: D_STARTER,
  deadlineStep: DEADLINE_STEP,
  deadlines: { short: deadlineOf('short'), normal: deadlineOf('normal') },
  mixFloor: MIX_FLOOR,
  mixShare: MIX_SHARE,
  budgetOverdraft: BUDGET_OVERDRAFT,
  pairCost: PAIR_COST,
  groupCost: GROUP_COST,
  groupChance: GROUP_CHANCE,
  groupTier: GROUP_TIER,
  groupShares: GROUP_SHARES,
  loadMin: LOAD_MIN,
  loadMax: LOAD_MAX,
  loadCurve: LOAD_CURVE,
  loadDOffset: LOAD_D_OFFSET,
  amountMin: AMOUNT_MIN,
  niceAmounts: NICE_AMOUNTS,
  markupBase: MARKUP_BASE,
  markupPerDifficulty: MARKUP_PER_DIFFICULTY,
  prizeSlots: PRIZE_SLOTS,
  prizeBandMin: PRIZE_BAND_MIN,
  conditionsPerLevel: CONDITIONS_PER_LEVEL,
  conditionsJitter: CONDITIONS_JITTER,
  conditionsMax: CONDITIONS_MAX,
  conditionWeight: CONDITION_WEIGHT,
  freshnessRange: FRESHNESS_RANGE,
  qualityRange: QUALITY_RANGE,
  heirloomRange: HEIRLOOM_RANGE,
  largeMul: LARGE_MUL,
  goods: Object.fromEntries(STALL_IDS.map(g => [g, goodOf(g)])) as { readonly [K in StallGoodId]: GoodTuning },
}

export function contractGoods(t: ContractTuning): readonly StallGoodId[] {
  return STALL_IDS.filter(g => t.goods[g].on)
}

export function referenceGoldPerDay(t: ContractTuning): number {
  const xs = contractGoods(t)
    .map(g => t.goods[g].price * t.goods[g].feasible)
    .sort((a, b) => a - b)
  return xs[Math.floor(xs.length / 2)]
}

export function priceOf(t: ContractTuning, d: Demand): number {
  if (d.kind === 'plain') return t.goods[d.good].price
  if (d.group === 'jam') return Math.min(...JAM_IDS.map(id => t.goods[id].price))
  return t.goods.vodka.price
}

function demandOf(shape: Shape, amount: number, need: Need): Demand {
  if (shape.kind === 'plain') return { kind: 'plain', good: shape.good, amount, need }
  if (shape.group === 'jam') return { kind: 'group', group: 'jam', amount, need }
  return { kind: 'group', group: 'spirit', amount, need }
}

function shapeGood(shape: Shape): StallGoodId {
  if (shape.kind === 'plain') return shape.good
  return shape.group === 'jam' ? 'jam-cherry' : 'vodka'
}

function lineAmount(t: ContractTuning, shape: Shape, target: number): number {
  return nice(t, target / priceOf(t, demandOf(shape, t.amountMin, ANY_NEED)))
}

function sameFamily(a: StallGoodId, b: StallGoodId): boolean {
  if (isJamClass(a)) return isJamClass(b)
  if (isSpiritClass(a)) return isSpiritClass(b)
  return a === b
}

function candidates(
  t: ContractTuning,
  budget: number,
  taken: StallGoodId | undefined,
  target: number,
  tier: Stars,
): readonly StallGoodId[] {
  return contractGoods(t).filter(
    g =>
      (taken === undefined || !sameFamily(taken, g)) &&
      t.goods[g].tier <= tier &&
      t.goods[g].cost <= budget + t.budgetOverdraft &&
      t.goods[g].price * t.amountMin <= target,
  )
}

function shapeD(t: ContractTuning, shape: Shape): number {
  return t.goods[shapeGood(shape)].starter ? t.dStarter : 0
}

function anyOf(goods: readonly StallGoodId[]): readonly Option[] {
  return goods.map(good => ({ good, variety: { kind: 'any' }, weight: 1 }))
}

function lineOne(t: ContractTuning, cs: readonly Condition[], f: Frame, tier: Stars, x: number): readonly Option[] {
  const goods = candidates(t, f.budget, undefined, f.share, tier).filter(g => !cs.includes('freshness') || isCropStall(g))
  if (!cs.includes('variety')) return anyOf(goods)
  const heirloom = lerp(t.heirloomRange, x)
  return VARIETY_GOODS.filter(v => goods.includes(v.good))
    .map(v => ({
      good: v.good,
      variety: { kind: 'exact' as const, variety: v.variety },
      weight: tierOf(v.variety) === 'heirloom' ? heirloom : 1 - heirloom,
    }))
    .filter(o => o.weight > 0)
}

function frameOf(t: ContractTuning, stream: Spatial, day: number, slot: number, D: number, cs: readonly Condition[]): Frame {
  const band: DeadlineBand = cs.includes('short') ? 'short' : 'normal'
  const deadline = t.deadlines[band]
  const steps = Math.round((deadline.hi - deadline.lo) / t.deadlineStep) + 1
  const days = deadline.lo + t.deadlineStep * Math.floor(stream.at(day, slot, 6) * steps)
  const floor = -t.budgetOverdraft
  const opened = t.mixFloor + D * t.mixShare - deadline.cost
  const open = opened < floor ? floor : opened
  const pair = cs.includes('pair')
  const solo = referenceGoldPerDay(t) * days * load(t, D) * (cs.includes('large') ? t.largeMul : 1)
  return { band, days, pair, budget: pair ? (open - t.pairCost) / 2 : open, solo, share: pair ? solo / 2 : solo }
}

function conditionsOf(t: ContractTuning, stream: Spatial, day: number, slot: number, D: number, tier: Stars, x: number): readonly Condition[] {
  const jitter = (stream.at(day, slot, 40) * 2 - 1) * t.conditionsJitter
  const wanted = Math.round(D * t.conditionsPerLevel + jitter)
  const n = wanted < 0 ? 0 : wanted > t.conditionsMax ? t.conditionsMax : wanted
  let chosen: readonly Condition[] = []
  let left = CONDITIONS.filter(c => t.conditionWeight[c] > 0)
  for (let k = 0; chosen.length < n && left.length > 0; k++) {
    const c = weightedPick(left, w => t.conditionWeight[w], stream.at(day, slot, 41 + k))
    left = left.filter(w => w !== c)
    const next = [...chosen, c]
    if (lineOne(t, next, frameOf(t, stream, day, slot, D, next), tier, x).length > 0) chosen = next
  }
  return chosen
}

function spendLine(
  t: ContractTuning,
  stream: Spatial,
  day: number,
  slot: number,
  kGood: number,
  budget: number,
  options: readonly Option[],
  tier: Stars,
  groupable: boolean,
): { shape: Shape; budget: number } {
  const o = weightedPick(options, w => w.weight, stream.at(day, slot, kGood))
  const left = budget - t.goods[o.good].cost
  const grouped = groupable && stream.at(day, slot, kGood + 1) < t.groupChance
  if (isJamClass(o.good) && grouped && t.groupTier.jam <= tier) {
    return { shape: { kind: 'group', group: 'jam' }, budget: left - t.groupCost }
  }
  if (isSpiritClass(o.good) && grouped && t.groupTier.spirit <= tier) {
    return { shape: { kind: 'group', group: 'spirit' }, budget: left - t.groupCost }
  }
  return { shape: { kind: 'plain', good: o.good, variety: o.variety }, budget: left }
}

function shuffled(stream: Spatial, day: number, n: number): readonly CompanyId[] {
  const xs = [...COMPANY_IDS]
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(stream.at(day, 0, 20 + i) * (i + 1))
    const t = xs[i]
    xs[i] = xs[j]
    xs[j] = t
  }
  return Array.from({ length: n }, (_, i) => xs[i % xs.length])
}

function offerAt(
  t: ContractTuning,
  stream: Spatial,
  day: number,
  slot: number,
  D: number,
  company: CompanyId,
  penaltyRate: number,
): ContractOffer {
  const tier = starsOf(t, D)
  const x = D < 0 ? 0 : D > t.difficultyCeiling ? 1 : D / t.difficultyCeiling
  const drawn = conditionsOf(t, stream, day, slot, D, tier, x)
  const f = frameOf(t, stream, day, slot, D, drawn)
  const floor = -t.budgetOverdraft
  const line1 = spendLine(t, stream, day, slot, 2, f.budget, lineOne(t, drawn, f, tier, x), tier, !drawn.includes('variety'))
  const spare = line1.budget < floor ? floor : line1.budget
  const pool2 = f.pair ? anyOf(candidates(t, f.budget + spare, shapeGood(line1.shape), f.share, tier)) : []
  const line2 = pool2.length === 0 ? undefined : spendLine(t, stream, day, slot, 7, f.budget + spare, pool2, tier, true)
  const conditions = line2 === undefined ? drawn.filter(c => c !== 'pair') : drawn
  const bump = shapeD(t, line1.shape) + (line2 === undefined ? 0 : shapeD(t, line2.shape))
  const raw = D + bump
  const eff = raw < 0 ? 0 : raw > t.difficultyCeiling ? t.difficultyCeiling : raw
  const target = line2 === undefined ? f.solo : f.solo / 2
  const need: Need = {
    variety: line1.shape.kind === 'plain' ? line1.shape.variety : ANY_NEED.variety,
    quality: drawn.includes('quality') ? percent(lerp(t.qualityRange, x)) : 0,
    freshness: drawn.includes('freshness') ? percent(lerp(t.freshnessRange, x)) : 0,
  }
  const first = demandOf(line1.shape, lineAmount(t, line1.shape, target), need)
  const lines: Lines =
    line2 === undefined ? [first] : [first, demandOf(line2.shape, lineAmount(t, line2.shape, target), ANY_NEED)]
  const clean = Math.round(lines.reduce((n, d) => n + d.amount * priceOf(t, d), 0))
  const markup = Math.round((t.markupBase + t.markupPerDifficulty * eff + t.deadlines[f.band].markup) * 100) / 100
  return {
    id: day * CONTRACT_SLOT_MAX + slot,
    slot,
    company,
    difficulty: eff,
    stars: starsOf(t, eff),
    band: f.band,
    days: f.days,
    conditions,
    lines,
    prize: { kind: 'cash' },
    clean,
    markup,
    reward: Math.round(clean * (1 + markup)),
    penalty: Math.round(penaltyRate * clean),
  }
}

export function slotRange(t: ContractTuning, day: number, slot: number): readonly [number, number] {
  const capped = t.difficultyStart + t.difficultyPerDay * day
  const cap = capped < t.difficultyMax ? capped : t.difficultyMax
  const f = cap / t.difficultyMax
  const [lo, hi] = t.slotBands[slot]
  return [Math.round(lo * f), Math.round(hi * f)]
}

function slotD(t: ContractTuning, stream: Spatial, day: number, slot: number, rep: number): number {
  const [l, h] = slotRange(t, day, slot)
  const rolled = l + Math.floor(stream.at(day, slot, 0) * (h - l + 1)) + rep
  return rolled > t.difficultyCeiling ? t.difficultyCeiling : rolled
}

export const PLAIN_TREE_POOL = TREE_IDS.map(tree => ({ tree, variety: 'base' as const }))

export const NAMED_TREE_POOL = TREE_IDS.flatMap(tree =>
  VARIETIES[tree].filter(v => tierOf(v) === 'variant').map(variety => ({ tree, variety })),
)

export const HEIRLOOM_TREE_POOL = TREE_IDS.flatMap(tree =>
  VARIETIES[tree].filter(v => tierOf(v) === 'heirloom').map(variety => ({ tree, variety })),
)

export const NAMED_ANNUAL_POOL = ANNUAL_IDS.flatMap(crop => {
  if (!isAnnualId(crop) || crop === 'grass') return []
  return VARIETIES[crop].filter(v => tierOf(v) === 'variant').map(variety => ({ crop, variety }))
})

export const HEIRLOOM_ANNUAL_POOL = ANNUAL_IDS.flatMap(crop => {
  if (!isAnnualId(crop) || crop === 'grass') return []
  return VARIETIES[crop].filter(v => tierOf(v) === 'heirloom').map(variety => ({ crop, variety }))
})

export const FRUIT_ANNUAL_POOL = ANNUAL_IDS.flatMap(crop => {
  if (!isAnnualId(crop) || crop === 'grass' || crop === 'vanilla' || CROPS[crop].cls !== 'fruit') return []
  return [{ crop, variety: 'base' as const }]
})

export const STARTER_CROP_POOL = STARTER_CROPS.map(crop => ({ crop, variety: 'base' as const }))

const TREE_POOLS = {
  'plain-trees': PLAIN_TREE_POOL,
  'named-trees': NAMED_TREE_POOL,
  'heirloom-trees': HEIRLOOM_TREE_POOL,
} as const

const ANNUAL_POOLS = {
  'named-annuals': NAMED_ANNUAL_POOL,
  'heirloom-annuals': HEIRLOOM_ANNUAL_POOL,
  'fruit-annuals': FRUIT_ANNUAL_POOL,
  'starter-crops': STARTER_CROP_POOL,
} as const

function isTreePool(pool: PrizePool): pool is keyof typeof TREE_POOLS {
  return pool === 'plain-trees' || pool === 'named-trees' || pool === 'heirloom-trees'
}

function takeAt(pool: PrizePool, i: number, count: number | 'cash', reward: number): Prize {
  if (isTreePool(pool)) {
    const m = TREE_POOLS[pool][i]
    return { kind: 'tree-seed', tree: m.tree, variety: m.variety }
  }
  const m = ANNUAL_POOLS[pool][i]
  const n = count === 'cash' ? Math.ceil(reward / CROPS[m.crop].seed) : count
  return { kind: 'seeds', crop: m.crop, variety: m.variety, count: n }
}

function takePool(pool: PrizePool, u: number, count: number | 'cash', reward: number): Prize {
  const xs = isTreePool(pool) ? TREE_POOLS[pool] : ANNUAL_POOLS[pool]
  return takeAt(pool, Math.floor(u * xs.length), count, reward)
}

const PRIZE_K: readonly number[] = [30, 31, 33, 34, 35, 36]

function prizeSlots(t: ContractTuning, stream: Spatial, day: number): readonly number[] {
  return PRIZE_K.slice(0, t.prizeSlots).reduce<{ left: readonly number[]; picked: readonly number[] }>(
    ({ left, picked }, k) => {
      const i = Math.floor(stream.at(day, 0, k) * left.length)
      return { left: left.filter((_, j) => j !== i), picked: [...picked, left[i]] }
    },
    { left: Array.from({ length: CONTRACT_OFFERS }, (_, i) => i), picked: [] },
  ).picked
}

const PRIZE_TOOLS: readonly PrizeTool[] = ['rotary-shovel', 'diamond-pickaxe', 'electric-chainsaw']

export function prizeTool(tool: PrizeTool): Item {
  if (tool === 'rotary-shovel') return makeShovel(tool)
  if (tool === 'diamond-pickaxe') return makePickaxe(tool)
  return makeAxe(tool)
}

function prizeFor(t: ContractTuning, stream: Spatial, day: number, o: ContractOffer): Prize {
  const cell = COMPANY_PRIZES[o.company][prizeBandOf(t.prizeBandMin, o.difficulty)]
  const u = stream.at(day, o.slot, 32)
  if (cell.kind === 'tool') return { kind: 'tool', tool: PRIZE_TOOLS[Math.floor(u * PRIZE_TOOLS.length)] }
  if (cell.kind === 'pool') return takePool(cell.pool, u, cell.count, o.reward)
  if (cell.kind === 'from-cash') return takePool(cell.pool, u, 'cash', o.reward)
  if (cell.kind === 'pool-or-vanilla') {
    const xs = isTreePool(cell.pool) ? TREE_POOLS[cell.pool] : ANNUAL_POOLS[cell.pool]
    const i = Math.floor(u * (xs.length + 1))
    if (i === xs.length) return { kind: 'seeds', crop: 'vanilla', variety: 'base', count: cell.vanilla }
    return takeAt(cell.pool, i, cell.count, o.reward)
  }
  if (cell.kind === 'trees') {
    return { kind: 'tree-seed', tree: cell.trees[Math.floor(u * cell.trees.length)], variety: 'base' }
  }
  return cell
}

function withPrizes(t: ContractTuning, stream: Spatial, day: number, offers: readonly ContractOffer[]): readonly ContractOffer[] {
  const picked = prizeSlots(t, stream, day)
  return offers.map((o, i) => (picked.includes(i) ? { ...o, prize: prizeFor(t, stream, day, o) } : o))
}

export function rollBoard(
  rng: Rng,
  day: number,
  slots: number,
  rep: number,
  penaltyRate: number,
  t: ContractTuning,
): readonly ContractOffer[] {
  const stream = rng.stream('contract')
  const firms = shuffled(stream, day, slots)
  const base = Array.from({ length: slots }, (_, slot) =>
    offerAt(t, stream, day, slot, slotD(t, stream, day, slot, rep), firms[slot], penaltyRate),
  )
  return withPrizes(t, stream, day, base)
}

export function rollBoardAtD(rng: Rng, D: number, slots: number, penaltyRate: number, t: ContractTuning): readonly ContractOffer[] {
  const stream = rng.stream('contract')
  const firms = shuffled(stream, D, slots)
  const base = Array.from({ length: slots }, (_, slot) => offerAt(t, stream, D, slot, D, firms[slot], penaltyRate))
  return withPrizes(t, stream, D, base)
}

export function varietyOf(item: Delivered): VarietyId {
  if (item.kind === 'fruit' || item.kind === 'jam' || item.kind === 'spirit' || item.kind === 'cask') return item.variety
  return 'base'
}

export function meets(need: Need, item: Delivered): boolean {
  return (
    item.quality >= need.quality &&
    (item.kind !== 'fruit' || item.freshness >= need.freshness) &&
    (need.variety.kind === 'any' || varietyOf(item) === need.variety.variety)
  )
}

export function Accepts(d: Demand, good: StallGoodId, item: Delivered): boolean {
  if (!meets(d.need, item)) return false
  if (d.kind === 'plain') return good === d.good
  if (d.group === 'jam') return (JAM_IDS as readonly string[]).includes(good)
  return (SPIRIT_KINDS as readonly string[]).includes(good)
}

export function missPenalty(a: Active): number {
  const need = a.bins.reduce((n, b) => n + b.demand.amount, 0)
  const filled = a.bins.reduce((n, b) => n + b.filled, 0)
  const frac = 1 - filled / need
  const m = frac < PENALTY_FLOOR ? PENALTY_FLOOR : frac
  return Math.round(a.offer.penalty * m)
}

export function cancelFee(a: Active, nowDay: number, cancelMin: number): number {
  const elapsed = nowDay - (a.dueDay - a.offer.days)
  const t = elapsed / a.offer.days
  const u = t < 0 ? 0 : t > 1 ? 1 : t
  return Math.round((1 - u) * cancelMin * a.offer.clean + u * missPenalty(a))
}

export function needOf(a: Active): number {
  return a.bins.reduce((n, b) => n + b.demand.amount, 0)
}

export function filledOf(a: Active): number {
  return a.bins.reduce((n, b) => n + b.filled, 0)
}

export function emptyBook(): CompanyBook {
  return {
    'whole-cart': { done: 0, missed: 0 },
    'trade-jo': { done: 0, missed: 0 },
    'halbert-eijn': { done: 0, missed: 0 },
    'little-lid': { done: 0, missed: 0 },
    mercanova: { done: 0, missed: 0 },
    intercrop: { done: 0, missed: 0 },
  }
}

export function emptyContracts(): Contracts {
  return { active: [], takenToday: [], history: [], book: emptyBook(), rep: 0, repDay: 0 }
}

export function addRep(w: World, n: number): number {
  const was = w.contracts.rep
  const next = was + n
  w.contracts.rep = next < 0 ? 0 : next > REP_MAX ? REP_MAX : next
  return w.contracts.rep - was
}

function dropActive(w: World, a: Active): void {
  w.contracts.active = w.contracts.active.filter(x => x.offer.id !== a.offer.id)
}

function pushHistory(w: World, e: HistoryEntry): void {
  w.contracts.history.push(e)
  if (w.contracts.history.length > CONTRACT_HISTORY_MAX) w.contracts.history.shift()
  w.tally.contracts.push(e)
}

function addN(map: Map<StallGoodId, number>, good: StallGoodId, n: number): void {
  const cur = map.get(good)
  map.set(good, cur === undefined ? n : cur + n)
}

function dumpFilled(w: World, a: Active): number {
  const plainAdd = new Map<StallGoodId, number>()
  const infAdd = new Map<StallGoodId, number>()
  const unitOf = new Map<StallGoodId, number>()
  a.bins.forEach(bin => {
    if (bin.filled <= 0) return
    const good = demandGood(bin.demand)
    const unit = cleanUnit(bin.demand)
    unitOf.set(good, unit)
    const infN = bin.infusedFilled
    const plainN = bin.filled - infN
    if (plainN > 0) addN(plainAdd, good, plainN)
    if (infN > 0) addN(infAdd, good, infN)
  })
  const goods = new Set<StallGoodId>([...plainAdd.keys(), ...infAdd.keys()])
  const kind = w.weather(w.clock.day)
  let sold = 0
  goods.forEach(good => {
    const p = plainAdd.get(good)
    const i = infAdd.get(good)
    const plainN = p === undefined ? 0 : p
    const infN = i === undefined ? 0 : i
    const unit = unitOf.get(good)
    if (unit === undefined) return
    const sat = w.stall[good].sat
    const cap = impactOf(good, 'base')
    const wx = isCropStall(good) && (kind === 'flood' || kind === 'drought') ? WEATHER_FRUIT_IMPACT : 0
    const sale = saleUnits(sat, plainN, stepOf(good), cap, unit, wx)
    sold += sale.paid + infN * unit * mul(sat, cap, wx)
    w.stall[good].sat = sale.after
  })
  return sold
}

function payPrize(w: World, prize: Exclude<Prize, { kind: 'cash' }>, cash: number): void {
  if (prize.kind === 'skill-points') {
    w.grantPoints(prize.n)
    return
  }
  if (prize.kind === 'expansion-slot') {
    w.prizeSlots += 1
    return
  }
  if (prize.kind === 'freezer') {
    w.prizeFreezers += 1
    return
  }
  if (prize.kind === 'seeds') {
    w.putSilo(prize.crop, prize.variety, boughtSeedQuality(w, prize.crop), prize.count)
    return
  }
  if (prize.kind === 'fertilizer') {
    const bags = Math.max(1, Math.round(cash / SKUS['buy-fertilizer'].price))
    w.putAdditive('fertilizer', bags * FERT_BAG_LITERS)
    return
  }
  const item: Item =
    prize.kind === 'tree-seed'
      ? { kind: 'tree-seed', tree: prize.tree, variety: prize.variety, quality: 0 }
      : prizeTool(prize.tool)
  post(w, item)
}

export function post(w: World, item: Item): void {
  const free = w.postbox.slots.findIndex(s => s.kind === 'empty')
  if (free < 0) {
    w.drops.push({ at: { ...DOOR }, item })
    return
  }
  w.postbox.slots[free] = { kind: 'hold', item }
}

function resolveDone(w: World, a: Active): void {
  const prize = a.offer.prize
  const paidN = prize.kind === 'cash' ? a.offer.reward * (1 + 0.03 * w.skillTier('industrial')) : 0
  if (prize.kind === 'cash') w.money += paidN
  else payPrize(w, prize, a.offer.reward)
  w.contracts.book[a.offer.company].done += 1
  const need = a.bins.reduce((n, b) => n + b.demand.amount, 0)
  const infused = a.bins.reduce((n, b) => n + b.infusedFilled, 0)
  const rep = addRep(w, REP_DONE[a.offer.stars] * (1 + 0.25 * infused / need))
  dropActive(w, a)
  pushHistory(w, {
    id: a.offer.id,
    company: a.offer.company,
    stars: a.offer.stars,
    day: w.clock.day,
    rep,
    lines: a.offer.lines,
    outcome: { kind: 'done', paid: paidN, prize },
  })
  w.ping()
}

function resolveMiss(w: World, a: Active): void {
  const sold = dumpFilled(w, a)
  const penalty = missPenalty(a)
  w.money += sold - penalty
  w.contracts.book[a.offer.company].missed += 1
  const rep = addRep(w, -w.hard.repLost[a.offer.stars])
  dropActive(w, a)
  pushHistory(w, {
    id: a.offer.id,
    company: a.offer.company,
    stars: a.offer.stars,
    day: w.clock.day,
    rep,
    lines: a.offer.lines,
    outcome: { kind: 'missed', sold, penalty },
  })
  w.cue({ kind: 'contract-missed' })
  w.ping()
}

export function finishFull(w: World): void {
  w.contracts.active
    .filter(a => a.bins.every(b => b.filled === b.demand.amount))
    .slice()
    .forEach(a => resolveDone(w, a))
}

export function tickContracts(w: World, after: number): void {
  w.contracts.active
    .filter(a => after >= a.dueDay)
    .slice()
    .forEach(a => {
      if (a.bins.every(b => b.filled === b.demand.amount)) resolveDone(w, a)
      else resolveMiss(w, a)
    })
}

export function acceptContractBody(w: World, c: ContractId): void {
  if (!w.done.has('unlock-contracts')) return
  if (w.contracts.active.length >= w.contractCap()) return
  if (w.contracts.takenToday.includes(c)) return
  const offer = rollBoard(w.rng, w.clock.day, w.contractSlots(), w.contracts.repDay, w.hard.penaltyRate, CONTRACT_TUNING).find(
    o => o.id === c,
  )
  if (offer === undefined) return
  const bins: Bins =
    offer.lines.length === 1
      ? [{ demand: offer.lines[0], filled: 0, infusedFilled: 0 }]
      : [
          { demand: offer.lines[0], filled: 0, infusedFilled: 0 },
          { demand: offer.lines[1], filled: 0, infusedFilled: 0 },
        ]
  w.contracts.active.push({ offer, dueDay: w.nowDay() + offer.days, bins })
  w.contracts.takenToday.push(c)
  w.ping()
}

export function cancelContractBody(w: World, c: ContractId): void {
  const a = w.contracts.active.find(x => x.offer.id === c)
  if (a === undefined) return
  const sold = dumpFilled(w, a)
  const fee = cancelFee(a, w.nowDay(), w.hard.cancelMin)
  w.money += sold - fee
  const rep = addRep(w, -w.hard.repLost[a.offer.stars])
  dropActive(w, a)
  pushHistory(w, {
    id: a.offer.id,
    company: a.offer.company,
    stars: a.offer.stars,
    day: w.clock.day,
    rep,
    lines: a.offer.lines,
    outcome: { kind: 'cancelled', sold, fee },
  })
  w.ping()
}

export function reorderContractBody(w: World, c: ContractId, d: 1 | -1): void {
  const i = w.contracts.active.findIndex(x => x.offer.id === c)
  if (i < 0) return
  const j = i + d
  if (j < 0 || j >= w.contracts.active.length) return
  const cur = w.contracts.active[i]
  w.contracts.active[i] = w.contracts.active[j]
  w.contracts.active[j] = cur
  w.ping()
}
