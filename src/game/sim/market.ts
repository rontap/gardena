import { COMPANY_IDS, COMPANY_PRIZES, prizeBandOf } from '../defs/companies.ts'
import { CROPS } from '../defs/crops.ts'
import {
  EXTRACT,
  FLOUR,
  JAM_SALE,
  OIL,
  SPIRIT_RARITY,
  SUGAR_MILL,
  WINE_SALE,
} from '../defs/items.ts'
import { RARITY_RANK, raritySale, type Rarity } from '../defs/rarity.ts'
import { DAY_SECONDS } from './clock.ts'
import { JAM_IDS, SPIRIT_KINDS, type JamCrop, type JamId, type SpiritKind, type StallGoodId } from './ids.ts'
import { bakeSpiritSale } from './machine.ts'
import type {
  Active,
  CompanyId,
  ContractGoodId,
  ContractOffer,
  DeadlineBand,
  Demand,
  GroupId,
  Lines,
  PlainGoodId,
  Prize,
  RarityGoodId,
  Stars,
} from './market.h.ts'
import { STALL_IDS } from './stall.ts'
import type { Rng, Spatial } from './rng.ts'

export const SAT_DEPTH = 400

export const SAT_RECOVER_PER_DAY = 1 / 3

export const SAT_FLOOR: { readonly [K in StallGoodId]: number } = {
  carrot: 0.55,
  potato: 0.55,
  wheat: 0.55,
  tomato: 0.4,
  raspberry: 0.4,
  watermelon: 0.4,
  olive: 0.4,
  grape: 0.4,
  vanilla: 0.4,
  'sugar-cane': 0.4,
  apple: 0.4,
  apricot: 0.4,
  cherry: 0.4,
  sugar: 0.35,
  'jam-apricot': 0.35,
  'jam-grape': 0.35,
  'jam-raspberry': 0.35,
  'jam-apple': 0.35,
  'jam-cherry': 0.35,
  'jam-tomato': 0.35,
  oil: 0.35,
  flour: 0.35,
  extract: 0.35,
  vodka: 0.25,
  beer: 0.25,
  brandy: 0.25,
  mixed: 0.25,
  wine: 0.25,
}

export function mul(sat: number, good: StallGoodId): number {
  return 1 - (1 - SAT_FLOOR[good]) * sat
}

export function paid(sat: number, good: StallGoodId, V: number): number {
  const k = 1 - SAT_FLOOR[good]
  if (sat + V / SAT_DEPTH <= 1) return V * (1 - k * (sat + V / (2 * SAT_DEPTH)))
  const vStar = SAT_DEPTH * (1 - sat)
  return vStar * (1 - k * (sat + vStar / (2 * SAT_DEPTH))) + (V - vStar) * SAT_FLOOR[good]
}

export function recover(sat: number, dt: number): number {
  const next = sat - SAT_RECOVER_PER_DAY * dt / DAY_SECONDS
  return next < 0 ? 0 : next
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

export const STARTER_CROPS: readonly StallGoodId[] = ['carrot', 'potato', 'wheat']

export const D_STARTER = -1

export const D_RARITY: { readonly [K in Rarity]: number } = { common: 0, uncommon: 0, rare: 1, heirloom: 3 }

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

export const RARITY_COST: { readonly [K in Rarity]: number } = {
  common: 0,
  uncommon: 2,
  rare: 5,
  heirloom: 9,
}

export const GOOD_COST: { readonly [K in StallGoodId]: number } = {
  carrot: 0,
  potato: 1,
  wheat: 2,
  tomato: 3,
  watermelon: 4,
  grape: 4,
  olive: 5,
  raspberry: 6,
  apple: 5,
  apricot: 5,
  cherry: 6,
  'sugar-cane': 4,
  vanilla: 14,
  sugar: 3,
  'jam-apricot': 6,
  'jam-grape': 6,
  'jam-raspberry': 6,
  'jam-apple': 6,
  'jam-cherry': 6,
  'jam-tomato': 6,
  oil: 5,
  flour: 4,
  extract: 8,
  vodka: 8,
  beer: 7,
  brandy: 10,
  mixed: 4,
  wine: 12,
}

export const GOOD_TIER: { readonly [K in StallGoodId]: Stars } = {
  carrot: 1,
  potato: 1,
  wheat: 1,
  tomato: 1,
  raspberry: 1,
  watermelon: 1,
  olive: 3,
  grape: 1,
  vanilla: 1,
  'sugar-cane': 1,
  apple: 3,
  apricot: 3,
  cherry: 3,
  'jam-grape': 2,
  'jam-raspberry': 2,
  'jam-tomato': 2,
  'jam-apple': 3,
  'jam-apricot': 3,
  'jam-cherry': 3,
  oil: 2,
  flour: 2,
  wine: 2,
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
  watermelon: 7,
  olive: 4,
  grape: 6,
  vanilla: 4,
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
  'jam-apple': 12,
  'jam-cherry': 12,
  'jam-tomato': 12,
  oil: 80,
  flour: 80,
  extract: 80,
  sugar: 160,
  wine: 1,
}

const DEADLINE_BANDS: readonly DeadlineBand[] = ['tight', 'normal', 'long']

const JAM_MIN = Math.min(...JAM_IDS.map(id => JAM_SALE[jamCrop(id)]))

type Shape =
  | { kind: 'rated'; good: RarityGoodId; minRarity: Rarity }
  | { kind: 'plain'; good: PlainGoodId }
  | { kind: 'group'; group: 'jam' }
  | { kind: 'group'; group: 'spirit'; minRarity: Rarity }

function isJamClass(g: StallGoodId): g is JamId {
  return (JAM_IDS as readonly string[]).includes(g)
}

function isSpiritClass(g: StallGoodId): g is SpiritKind {
  return (SPIRIT_KINDS as readonly string[]).includes(g)
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
    return bakeSpiritSale('vodka', d.minRarity)
  }
  if (d.kind === 'plain') {
    if (d.good === 'sugar') return SUGAR_MILL
    if (d.good === 'oil') return OIL
    if (d.good === 'flour') return FLOUR
    if (d.good === 'extract') return EXTRACT
    return JAM_SALE[jamCrop(d.good)]
  }
  if (d.good === 'wine') return WINE_SALE * SPIRIT_RARITY[d.minRarity]
  if (d.good === 'vodka' || d.good === 'beer' || d.good === 'brandy' || d.good === 'mixed') {
    return bakeSpiritSale(d.good, d.minRarity)
  }
  return CROPS[d.good].sale * raritySale(CROPS[d.good], d.minRarity)
}

export function demandGood(d: Demand): StallGoodId {
  if (d.kind === 'rated') return d.good
  if (d.kind === 'plain') return d.good
  if (d.group === 'jam') return 'jam-cherry'
  return 'vodka'
}

function unitOf(good: StallGoodId): number {
  if (isJamClass(good)) return JAM_SALE[jamCrop(good)]
  if (good === 'sugar') return SUGAR_MILL
  if (good === 'oil') return OIL
  if (good === 'flour') return FLOUR
  if (good === 'extract') return EXTRACT
  if (good === 'wine') return WINE_SALE
  if (isSpiritClass(good)) return bakeSpiritSale(good, 'common')
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
  if (shape.kind === 'rated') return { kind: 'rated', good: shape.good, minRarity: shape.minRarity, amount }
  if (shape.kind === 'plain') return { kind: 'plain', good: shape.good, amount }
  if (shape.group === 'jam') return { kind: 'group', group: 'jam', amount }
  return { kind: 'group', group: 'spirit', minRarity: shape.minRarity, amount }
}

function shapeGood(shape: Shape): StallGoodId {
  return demandGood(demandOf(shape, AMOUNT_MIN))
}

/**
 * Units to ask for so the line is worth roughly `target`.
 *
 * Prices by `cleanUnit`, the same rarity-scaled unit `clean` pays out with — not
 * the common-rarity `unitOf` — or a rare line would be sized for common prices
 * and settled at rare ones. The cap is throughput, so it stays on raw counts.
 */
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
  const starter = (STARTER_CROPS as readonly string[]).includes(good) ? D_STARTER : 0
  if (shape.kind === 'plain' || (shape.kind === 'group' && shape.group === 'jam')) return starter
  return starter + D_RARITY[shape.minRarity]
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
  if (good === 'oil' || good === 'flour') {
    return { shape: { kind: 'plain', good }, budget }
  }
  const rarities = RARITY_RANK.filter(r => RARITY_COST[r] <= budget + BUDGET_OVERDRAFT)
  const minRarity = pick(rarities, stream.at(day, slot, kGood + 2))
  budget -= RARITY_COST[minRarity]
  if (isSpiritClass(good) && grouped && GROUP_TIER.spirit <= tier) {
    return { shape: { kind: 'group', group: 'spirit', minRarity }, budget: budget - GROUP_COST }
  }
  return { shape: { kind: 'rated', good, minRarity }, budget }
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

/**
 * The two slots that pay goods instead of money, as a distinct pair. Rolled per
 * day off the contract stream, so the board stays a pure function of the seed,
 * the day and reputation.
 *
 * Drawn from the base six, never from the live slot count: `broker` grows the
 * board and must not reshuffle the offers already on it. Broker's extra slots
 * are always cash.
 */
function prizeSlots(stream: Spatial, day: number): readonly number[] {
  const a = Math.floor(stream.at(day, 0, 30) * CONTRACT_OFFERS)
  const b = Math.floor(stream.at(day, 0, 31) * (CONTRACT_OFFERS - 1))
  return [a, b >= a ? b + 1 : b]
}

/** Resolves a company's fixed table entry, rolling the tool arm per offer. */
function prizeFor(stream: Spatial, day: number, o: ContractOffer): Prize {
  const p = COMPANY_PRIZES[o.company][prizeBandOf(o.difficulty)]
  if (p.kind !== 'tool') return p
  const roll = stream.at(day, o.slot, 32)
  return { kind: 'tool', tool: roll < 0.5 ? 'rotary-shovel' : 'diamond-pickaxe' }
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

export function Accepts(d: Demand, good: StallGoodId, rarity: Rarity): boolean {
  if (d.kind === 'rated') {
    return good === d.good && RARITY_RANK.indexOf(rarity) >= RARITY_RANK.indexOf(d.minRarity)
  }
  if (d.kind === 'plain') return good === d.good
  if (d.group === 'jam') return (JAM_IDS as readonly string[]).includes(good)
  return (SPIRIT_KINDS as readonly string[]).includes(good) && RARITY_RANK.indexOf(rarity) >= RARITY_RANK.indexOf(d.minRarity)
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
