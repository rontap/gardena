import { COMPANIES, COMPANY_IDS } from '../defs/companies.ts'
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
import { JAM_IDS, SPIRIT_KINDS, type JamCrop, type JamId, type StallGoodId } from './ids.ts'
import { bakeSpiritSale } from './machine.ts'
import type {
  Active,
  ContractOffer,
  DeadlineBand,
  Demand,
  GoodClass,
  Lines,
  PlainGoodId,
  RarityGoodId,
  Stars,
} from './market.h.ts'
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
  lemon: 0.4,
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

export const DIFFICULTY_PER_DAY = 0.6

export const SLOT_BANDS: readonly (readonly [number, number])[] = [
  [0, 8],
  [4, 12],
  [8, 18],
  [12, 24],
  [18, 32],
  [24, 40],
  [20, 36],
  [28, 40],
]

export const STAR_MIN: { readonly [K in Stars]: number } = {
  1: 0,
  2: 10,
  3: 20,
  4: 30,
}

export const NICE_AMOUNTS: readonly number[] = [4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]

export const MARKUP_BASE = 0.2

export const MARKUP_PER_DIFFICULTY = 0.015

export const MARKUP_PER_DAY = 0.04

export const PENALTY_RATE = 0.2

export const VALUE_BASE = 40

export const VALUE_SCALE = 20

export const AMOUNT_MIN = 4

export const SCALE_START = 0.35

export const SCALE_DAYS = 24

export const PENALTY_FLOOR = 0.25

export const CANCEL_MIN = 0.05

export const PAIR_COST = 6

export const GROUP_COST = -4

export const DEADLINE_DAYS: { readonly [K in DeadlineBand]: readonly [number, number] } = {
  tight: [1, 2],
  normal: [2, 3],
  long: [4, 5],
}

export const DEADLINE_COST: { readonly [K in DeadlineBand]: number } = {
  tight: 8,
  normal: 3,
  long: 0,
}

export const RARITY_COST: { readonly [K in Rarity]: number } = {
  common: 0,
  uncommon: 3,
  rare: 8,
  heirloom: 16,
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
  lemon: 5,
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

export const FEASIBLE_PER_DAY: { readonly [K in StallGoodId]: number } = {
  carrot: 21,
  potato: 16,
  wheat: 11,
  tomato: 7,
  raspberry: 6,
  watermelon: 7,
  olive: 5,
  grape: 6,
  vanilla: 4,
  'sugar-cane': 10,
  apple: 3,
  apricot: 4,
  lemon: 4,
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

type Shape =
  | { kind: 'rated'; good: RarityGoodId; minRarity: Rarity }
  | { kind: 'plain'; good: PlainGoodId }
  | { kind: 'group'; group: 'jam' }
  | { kind: 'group'; group: 'spirit'; minRarity: Rarity }

function isJamClass(g: GoodClass): g is JamId {
  return (JAM_IDS as readonly string[]).includes(g)
}

function jamCrop(id: JamId): JamCrop {
  return id.slice(4) as JamCrop
}

function cheapest(pool: readonly GoodClass[]): GoodClass {
  return pool.reduce((a, b) => (GOOD_COST[b] < GOOD_COST[a] ? b : a))
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
  let n = 0
  for (const a of NICE_AMOUNTS) {
    if (a <= x) n = a
  }
  return n
}

export function scale(day: number): number {
  const s = SCALE_START + day / SCALE_DAYS
  return s < 1 ? s : 1
}

export function cleanUnit(d: Demand): number {
  if (d.kind === 'group') {
    if (d.group === 'jam') return JAM_SALE.cherry
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

function demandOf(shape: Shape, amount: number): Demand {
  if (shape.kind === 'rated') return { kind: 'rated', good: shape.good, minRarity: shape.minRarity, amount }
  if (shape.kind === 'plain') return { kind: 'plain', good: shape.good, amount }
  if (shape.group === 'jam') return { kind: 'group', group: 'jam', amount }
  return { kind: 'group', group: 'spirit', minRarity: shape.minRarity, amount }
}

function lineAmount(shape: Shape, share: number, days: number, day: number): number {
  const unit = cleanUnit(demandOf(shape, AMOUNT_MIN))
  const snapped = nice(share / unit)
  const cap = FEASIBLE_PER_DAY[demandGood(demandOf(shape, AMOUNT_MIN))] * days * scale(day)
  return snapped < cap ? snapped : cap
}

function spendLine(
  stream: Spatial,
  day: number,
  slot: number,
  kGood: number,
  pool: readonly GoodClass[],
  remaining: number,
): { shape: Shape; remaining: number } {
  const affordable = pool.filter(g => GOOD_COST[g] <= remaining)
  const good = affordable.length === 0 ? cheapest(pool) : pick(affordable, stream.at(day, slot, kGood))
  remaining -= GOOD_COST[good]
  if (isJamClass(good)) {
    const group = Math.floor(stream.at(day, slot, kGood + 1) * 2) === 0
    if (group) {
      remaining -= GROUP_COST
      return { shape: { kind: 'group', group: 'jam' }, remaining }
    }
    return { shape: { kind: 'plain', good }, remaining }
  }
  if (good === 'sugar' || good === 'oil' || good === 'flour' || good === 'extract') {
    return { shape: { kind: 'plain', good }, remaining }
  }
  const rarities = RARITY_RANK.filter(r => RARITY_COST[r] <= remaining)
  const minRarity = rarities.length === 0 ? 'common' : pick(rarities, stream.at(day, slot, kGood + 2))
  remaining -= RARITY_COST[minRarity]
  return { shape: { kind: 'rated', good, minRarity }, remaining }
}

function poolUnit(g: GoodClass): number {
  if (isJamClass(g)) return JAM_SALE[jamCrop(g)]
  if (g === 'sugar') return SUGAR_MILL
  if (g === 'oil') return OIL
  if (g === 'flour') return FLOUR
  if (g === 'extract') return EXTRACT
  if (g === 'wine') return WINE_SALE
  return CROPS[g].sale
}

function cheapestShape(pool: readonly GoodClass[]): Shape {
  const good = pool.reduce((a, b) => (poolUnit(b) < poolUnit(a) ? b : a))
  if (isJamClass(good)) return { kind: 'plain', good }
  if (good === 'sugar' || good === 'oil' || good === 'flour' || good === 'extract') return { kind: 'plain', good }
  return { kind: 'rated', good, minRarity: 'common' }
}

function offerAt(stream: Spatial, day: number, slot: number, D: number, retry = false): ContractOffer {
  const eligible = COMPANY_IDS.filter(id => COMPANIES[id].eligible <= D)
  const company = pick(eligible, stream.at(day, slot, 1))
  const def = COMPANIES[company]
  const Dmix = D * def.mix
  let Dval = D - Dmix
  let remaining = Dmix
  let line1: { shape: Shape; remaining: number }
  let line2: { shape: Shape; remaining: number } | undefined
  let band: DeadlineBand
  if (retry) {
    const shape = cheapestShape(def.pool)
    remaining -= GOOD_COST[demandGood(demandOf(shape, AMOUNT_MIN))]
    line1 = { shape, remaining }
    band = 'long'
  } else {
    line1 = spendLine(stream, day, slot, 2, def.pool, remaining)
    remaining = line1.remaining
    const bands = DEADLINE_BANDS.filter(b => DEADLINE_COST[b] <= remaining)
    band = bands.length === 0 ? 'long' : pick(bands, stream.at(day, slot, 5))
    remaining -= DEADLINE_COST[band]
    if (remaining >= PAIR_COST) {
      remaining -= PAIR_COST
      line2 = spendLine(stream, day, slot, 7, def.pool, remaining)
      remaining = line2.remaining
    }
  }
  const [dLo, dHi] = DEADLINE_DAYS[band]
  const days = dLo + Math.floor(stream.at(day, slot, 6) * (dHi - dLo + 1))
  Dval += remaining
  const V = VALUE_BASE * (1 + Dval / VALUE_SCALE)
  const lines: Lines = line2 === undefined
    ? [demandOf(line1.shape, lineAmount(line1.shape, V, days, day))]
    : [
        demandOf(line1.shape, lineAmount(line1.shape, V / 2, days, day)),
        demandOf(line2.shape, lineAmount(line2.shape, V / 2, days, day)),
      ]
  const clean = lines.reduce((n, d) => n + d.amount * cleanUnit(d), 0)
  const markup = MARKUP_BASE + MARKUP_PER_DIFFICULTY * D + MARKUP_PER_DAY * days
  return {
    id: day * CONTRACT_SLOT_MAX + slot,
    slot,
    company,
    difficulty: D,
    stars: starsOf(D),
    band,
    days,
    lines,
    clean,
    markup,
    reward: clean * (1 + markup),
    penalty: PENALTY_RATE * clean,
  }
}

function slotD(stream: Spatial, day: number, slot: number): number {
  const [lo, hi] = SLOT_BANDS[slot]
  const rolled = lo + Math.floor(stream.at(day, slot, 0) * (hi - lo + 1))
  return Math.min(rolled, DIFFICULTY_START + DIFFICULTY_PER_DAY * day, DIFFICULTY_MAX)
}

function amountsOk(offer: ContractOffer, day: number): boolean {
  return offer.lines.every(d => {
    const cap = FEASIBLE_PER_DAY[demandGood(d)] * offer.days * scale(day)
    return d.amount >= AMOUNT_MIN && d.amount <= cap
  })
}

export function rollBoard(rng: Rng, day: number, slots: number): readonly ContractOffer[] {
  const stream = rng.stream('contract')
  return Array.from({ length: slots }, (_, slot) => {
    const offer = offerAt(stream, day, slot, slotD(stream, day, slot))
    if (amountsOk(offer, day)) return offer
    const retry = offerAt(stream, day, slot, SLOT_BANDS[slot][0], true)
    if (amountsOk(retry, day)) return retry
    throw new Error('rollBoard')
  })
}

export function rollBoardAtD(rng: Rng, D: number, slots: number): readonly ContractOffer[] {
  const stream = rng.stream('contract')
  return Array.from({ length: slots }, (_, slot) => {
    const offer = offerAt(stream, D, slot, D)
    if (amountsOk(offer, D)) return offer
    const retry = offerAt(stream, D, slot, D, true)
    if (amountsOk(retry, D)) return retry
    throw new Error('rollBoardAtD')
  })
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
  return a.offer.penalty * m
}

export function cancelFee(a: Active, nowDay: number): number {
  const elapsed = nowDay - (a.dueDay - a.offer.days)
  const t = elapsed / a.offer.days
  const u = t < 0 ? 0 : t > 1 ? 1 : t
  return (1 - u) * CANCEL_MIN * a.offer.clean + u * missPenalty(a)
}

export function needOf(a: Active): number {
  return a.bins.reduce((n, b) => n + b.demand.amount, 0)
}

export function filledOf(a: Active): number {
  return a.bins.reduce((n, b) => n + b.filled, 0)
}
