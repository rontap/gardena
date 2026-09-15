import { COMPANY_IDS, COMPANY_PRIZES, prizeBandOf } from '../../defs/companies.ts'
import { CROPS } from '../../defs/crops.ts'
import { SKUS } from '../../defs/research.ts'
import {
  BREAD,
  EXTRACT,
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
  CASK_IDS,
  JAM_IDS,
  SPIRIT_KINDS,
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
import { makePickaxe, makeShovel, type Item } from '../item.ts'
import { bakeSpiritSale } from '../feature-machines/machine.ts'
import type {
  Active,
  Bins,
  CompanyBook,
  CompanyId,
  ContractGoodId,
  ContractId,
  ContractOffer,
  Contracts,
  DeadlineBand,
  Demand,
  GroupId,
  HistoryEntry,
  Lines,
  Prize,
  PrizePool,
  Stars,
} from './market.h.ts'
import { isBakedStall, isCropStall, isInfusedStall, STALL_IDS } from '../stall.ts'
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
  extract: 0.3,
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

export const CONTRACT_SLOT_MAX = 8

export const BROKER_MAX_TIER = 2

export const CONTRACT_HISTORY_MAX = 24

export const DIFFICULTY_MAX = 40

export const DIFFICULTY_START = 8

export const DIFFICULTY_PER_DAY = 0.8

export const DIFFICULTY_CEILING = 60

export const REP_MAX = 20

export const REP_DONE: { readonly [K in Stars]: number } = { 1: 0.5, 2: 1, 3: 1.5, 4: 2 }

export const REP_LOST: { readonly [K in Stars]: number } = { 1: 1, 2: 2, 3: 3, 4: 4 }

export const REP_IDLE = 0.3

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
  tight: 0.11,
  normal: 0.05,
  long: 0,
}

export const PENALTY_RATE = 0.2

export const LOAD_MIN = 0.12

export const LOAD_MAX = 1.35

export const LOAD_CURVE = 2

export const LOAD_D_OFFSET = 6

export const MIX_FLOOR = 2

export const MIX_SHARE = 0.5

export const BUDGET_OVERDRAFT = 3

export const AMOUNT_MIN = 2

export const SCALE_START = 0.35

export const SCALE_DAYS = 24

export const PENALTY_FLOOR = 0.25

export const CANCEL_MIN = 0.05

export const PAIR_COST = 10

export const GROUP_COST = -4

export const DEADLINE_DAYS: { readonly [K in DeadlineBand]: readonly [number, number] } = {
  tight: [1, 2],
  normal: [2, 3],
  long: [3, 4],
}

/** Deadlines land on half days, so a band offers three lengths, not two. */
export const DEADLINE_STEP = 0.5

export const DEADLINE_COST: { readonly [K in DeadlineBand]: number } = {
  tight: 8,
  normal: 0,
  long: -4,
}

export const DEADLINE_WEIGHT: { readonly [K in DeadlineBand]: number } = {
  tight: 2,
  normal: 5,
  long: 2,
}

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
  extract: 8,
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
  extract: 1,
}

export const GROUP_TIER: { readonly [K in GroupId]: Stars } = { jam: 3, spirit: 2 }

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
  extract: 80,
  bread: 1,
  sugar: 160,
  wine: 1,
  cider: 0.6,
}

const DEADLINE_BANDS: readonly DeadlineBand[] = ['tight', 'normal', 'long']

const JAM_MIN = Math.min(...JAM_IDS.map(id => JAM_SALE[jamCrop(id)]))

type Shape =
  | { kind: 'plain'; good: StallGoodId }
  | { kind: 'group'; group: 'jam' }
  | { kind: 'group'; group: 'spirit' }

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

function pick<T>(xs: readonly T[], u: number): T {
  return xs[Math.floor(u * xs.length)]
}

function starsOf(D: number): Stars {
  if (D >= STAR_MIN[4]) return 4
  if (D >= STAR_MIN[3]) return 3
  if (D >= STAR_MIN[2]) return 2
  return 1
}

function nice(x: number): number {
  let n = NICE_AMOUNTS[0]
  for (const a of NICE_AMOUNTS) {
    if (a <= x) n = a
  }
  return n
}

export function scale(day: number): number {
  const s = SCALE_START + day / SCALE_DAYS
  return s < 1 ? s : 1
}

export function load(D: number): number {
  const t = (D + LOAD_D_OFFSET) / (DIFFICULTY_CEILING + LOAD_D_OFFSET)
  return LOAD_MIN + (LOAD_MAX - LOAD_MIN) * t ** LOAD_CURVE
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
  if (good === 'extract') return EXTRACT
  if (good === 'bread') return BREAD
  if (isCaskClass(good)) return CASK_SALE[good]
  if (isSpiritClass(good)) return bakeSpiritSale(good, 'base', 0)
  return CROPS[good].sale
}

export const CONTRACT_GOODS: readonly ContractGoodId[] = STALL_IDS.filter(
  (g): g is ContractGoodId => g !== 'sugar' && g !== 'extract',
)

export const REFERENCE_GOLD_PER_DAY = (() => {
  const xs = CONTRACT_GOODS.map(g => unitOf(g) * FEASIBLE_PER_DAY[g]).sort((a, b) => a - b)
  return xs[Math.floor(xs.length / 2)]
})()

function demandOf(shape: Shape, amount: number): Demand {
  if (shape.kind === 'plain') return { kind: 'plain', good: shape.good, amount }
  if (shape.group === 'jam') return { kind: 'group', group: 'jam', amount }
  return { kind: 'group', group: 'spirit', amount }
}

function shapeGood(shape: Shape): StallGoodId {
  return demandGood(demandOf(shape, AMOUNT_MIN))
}

function lineAmount(shape: Shape, days: number, day: number, target: number): number {
  const good = shapeGood(shape)
  const wanted = target / cleanUnit(demandOf(shape, AMOUNT_MIN))
  const cap = FEASIBLE_PER_DAY[good] * days * scale(day)
  return nice(wanted < cap ? wanted : cap)
}

function weighted(bands: readonly DeadlineBand[], u: number): DeadlineBand {
  const total = bands.reduce((n, b) => n + DEADLINE_WEIGHT[b], 0)
  let acc = u * total
  for (const b of bands) {
    acc -= DEADLINE_WEIGHT[b]
    if (acc < 0) return b
  }
  return bands[bands.length - 1]
}

function sameFamily(a: StallGoodId, b: StallGoodId): boolean {
  if (isJamClass(a)) return isJamClass(b)
  if (isSpiritClass(a)) return isSpiritClass(b)
  return a === b
}

function candidates(
  budget: number,
  taken: StallGoodId | undefined,
  target: number,
  tier: Stars,
): readonly ContractGoodId[] {
  return CONTRACT_GOODS.filter(
    g =>
      (taken === undefined || !sameFamily(taken, g)) &&
      GOOD_TIER[g] <= tier &&
      GOOD_COST[g] <= budget + BUDGET_OVERDRAFT &&
      unitOf(g) * AMOUNT_MIN <= target,
  )
}

function shapeD(shape: Shape): number {
  const good = shapeGood(shape)
  return (STARTER_CROPS as readonly string[]).includes(good) ? D_STARTER : 0
}

function spendLine(
  stream: Spatial,
  day: number,
  slot: number,
  kGood: number,
  budget: number,
  pool: readonly ContractGoodId[],
  tier: Stars,
): { shape: Shape; budget: number } {
  const good = pick(pool, stream.at(day, slot, kGood))
  budget -= GOOD_COST[good]
  const grouped = Math.floor(stream.at(day, slot, kGood + 1) * 2) === 0
  if (isJamClass(good)) {
    if (grouped && GROUP_TIER.jam <= tier) {
      return { shape: { kind: 'group', group: 'jam' }, budget: budget - GROUP_COST }
    }
    return { shape: { kind: 'plain', good }, budget }
  }
  if (isSpiritClass(good) && grouped && GROUP_TIER.spirit <= tier) {
    return { shape: { kind: 'group', group: 'spirit' }, budget: budget - GROUP_COST }
  }
  return { shape: { kind: 'plain', good }, budget }
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
  stream: Spatial,
  day: number,
  slot: number,
  D: number,
  company: CompanyId,
  scaleDay: number,
): ContractOffer {
  const tier = starsOf(D)
  const band = weighted(DEADLINE_BANDS, stream.at(day, slot, 5))
  const [dLo, dHi] = DEADLINE_DAYS[band]
  const steps = Math.round((dHi - dLo) / DEADLINE_STEP) + 1
  const days = dLo + DEADLINE_STEP * Math.floor(stream.at(day, slot, 6) * steps)
  const floor = -BUDGET_OVERDRAFT
  const opened = MIX_FLOOR + D * MIX_SHARE - DEADLINE_COST[band]
  const solo = REFERENCE_GOLD_PER_DAY * days * load(D)
  let budget = opened < floor ? floor : opened
  const wantsPair = budget >= PAIR_COST
  if (wantsPair) budget = (budget - PAIR_COST) / 2
  const share = wantsPair ? solo / 2 : solo
  const line1 = spendLine(stream, day, slot, 2, budget, candidates(budget, undefined, share, tier), tier)
  const spare = line1.budget < floor ? floor : line1.budget
  const pool2 = wantsPair ? candidates(budget + spare, shapeGood(line1.shape), share, tier) : []
  const line2 = pool2.length === 0 ? undefined : spendLine(stream, day, slot, 7, budget + spare, pool2, tier)
  const bump = shapeD(line1.shape) + (line2 === undefined ? 0 : shapeD(line2.shape))
  const raw = D + bump
  const eff = raw < 0 ? 0 : raw > DIFFICULTY_CEILING ? DIFFICULTY_CEILING : raw
  const target = line2 === undefined ? solo : solo / 2
  const lines: Lines = line2 === undefined
    ? [demandOf(line1.shape, lineAmount(line1.shape, days, scaleDay, target))]
    : [
        demandOf(line1.shape, lineAmount(line1.shape, days, scaleDay, target)),
        demandOf(line2.shape, lineAmount(line2.shape, days, scaleDay, target)),
      ]
  const clean = Math.round(lines.reduce((n, d) => n + d.amount * cleanUnit(d), 0))
  const markup = Math.round((MARKUP_BASE + MARKUP_PER_DIFFICULTY * eff + MARKUP_BAND[band]) * 100) / 100
  return {
    id: day * CONTRACT_SLOT_MAX + slot,
    slot,
    company,
    difficulty: eff,
    stars: starsOf(eff),
    band,
    days,
    lines,
    prize: { kind: 'cash' },
    clean,
    markup,
    reward: Math.round(clean * (1 + markup)),
    penalty: Math.round(PENALTY_RATE * clean),
  }
}

function slotD(stream: Spatial, day: number, slot: number, rep: number): number {
  const capped = DIFFICULTY_START + DIFFICULTY_PER_DAY * day
  const cap = capped < DIFFICULTY_MAX ? capped : DIFFICULTY_MAX
  const f = cap / DIFFICULTY_MAX
  const [lo, hi] = SLOT_BANDS[slot]
  const l = Math.round(lo * f)
  const h = Math.round(hi * f)
  const rolled = l + Math.floor(stream.at(day, slot, 0) * (h - l + 1)) + rep
  return rolled > DIFFICULTY_CEILING ? DIFFICULTY_CEILING : rolled
}

export const PRIZE_SLOTS = 2

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

function prizeSlots(stream: Spatial, day: number): readonly number[] {
  const a = Math.floor(stream.at(day, 0, 30) * CONTRACT_OFFERS)
  const b = Math.floor(stream.at(day, 0, 31) * (CONTRACT_OFFERS - 1))
  return [a, b >= a ? b + 1 : b]
}

function prizeFor(stream: Spatial, day: number, o: ContractOffer): Prize {
  const cell = COMPANY_PRIZES[o.company][prizeBandOf(o.difficulty)]
  const u = stream.at(day, o.slot, 32)
  if (cell.kind === 'tool') return { kind: 'tool', tool: u < 0.5 ? 'rotary-shovel' : 'diamond-pickaxe' }
  if (cell.kind === 'pool') return takePool(cell.pool, u, cell.count, o.reward)
  if (cell.kind === 'from-cash') return takePool(cell.pool, u, 'cash', o.reward)
  if (cell.kind === 'pool-or-vanilla') {
    const xs = isTreePool(cell.pool) ? TREE_POOLS[cell.pool] : ANNUAL_POOLS[cell.pool]
    const i = Math.floor(u * (xs.length + 1))
    if (i === xs.length) return { kind: 'seeds', crop: 'vanilla', variety: 'base', count: cell.vanilla }
    return takeAt(cell.pool, i, cell.count, o.reward)
  }
  return cell
}

function withPrizes(stream: Spatial, day: number, offers: readonly ContractOffer[]): readonly ContractOffer[] {
  const picked = prizeSlots(stream, day)
  return offers.map((o, i) => (picked.includes(i) ? { ...o, prize: prizeFor(stream, day, o) } : o))
}

export function rollBoard(rng: Rng, day: number, slots: number, rep: number): readonly ContractOffer[] {
  const stream = rng.stream('contract')
  const firms = shuffled(stream, day, slots)
  const base = Array.from({ length: slots }, (_, slot) =>
    offerAt(stream, day, slot, slotD(stream, day, slot, rep), firms[slot], day),
  )
  return withPrizes(stream, day, base)
}

export const LADDER_DAY = 24

export function rollBoardAtD(rng: Rng, D: number, slots: number): readonly ContractOffer[] {
  const stream = rng.stream('contract')
  const firms = shuffled(stream, D, slots)
  const base = Array.from({ length: slots }, (_, slot) => offerAt(stream, D, slot, D, firms[slot], LADDER_DAY))
  return withPrizes(stream, D, base)
}

export function Accepts(d: Demand, good: StallGoodId): boolean {
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

export function cancelFee(a: Active, nowDay: number): number {
  const elapsed = nowDay - (a.dueDay - a.offer.days)
  const t = elapsed / a.offer.days
  const u = t < 0 ? 0 : t > 1 ? 1 : t
  return Math.round((1 - u) * CANCEL_MIN * a.offer.clean + u * missPenalty(a))
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

function consignDemand(w: World, d: Demand, n: number, infused: boolean): void {
  if (d.kind === 'plain') {
    if (isCropStall(d.good)) w.stall[d.good].take('base', n, 1)
    else if (isInfusedStall(d.good)) w.stall[d.good].takeSpirit('base', n, cleanUnit(d), infused)
    else if (d.good === 'sugar') w.stall.sugar.takeSugar(n, SUGAR_MILL)
    else w.stall[d.good].takeBaked(n, cleanUnit(d))
    return
  }
  if (d.group === 'jam') w.stall['jam-cherry'].takeSpirit('base', n, JAM_SALE.cherry, infused)
  else w.stall.vodka.takeSpirit('base', n, bakeSpiritSale('vodka', 'base', 0), infused)
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
    if (plainN > 0) {
      addN(plainAdd, good, plainN)
      consignDemand(w, bin.demand, plainN, false)
    }
    if (infN > 0) {
      addN(infAdd, good, infN)
      consignDemand(w, bin.demand, infN, true)
    }
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
      : prize.tool === 'rotary-shovel'
        ? makeShovel('rotary-shovel')
        : makePickaxe('diamond-pickaxe')
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
  const rep = addRep(w, -REP_LOST[a.offer.stars])
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
  const offer = rollBoard(w.rng, w.clock.day, w.contractSlots(), w.contracts.repDay).find(o => o.id === c)
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
  const fee = cancelFee(a, w.nowDay())
  w.money += sold - fee
  const rep = addRep(w, -REP_LOST[a.offer.stars])
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
