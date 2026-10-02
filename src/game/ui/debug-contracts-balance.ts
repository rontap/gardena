import { prizeBandOf } from '../defs/companies.ts'
import { HARDNESS, type Difficulty } from '../defs/rules.ts'
import type { Purpose } from '../defs/varieties.ts'
import { CONDITIONS, CONTRACT_TUNING, priceOf, referenceGoldPerDay, rollBoard } from '../sim/feature-contracts/market.ts'
import type {
  Condition,
  ContractOffer,
  ContractTuning,
  DeadlineBand,
  Demand,
  GroupId,
  Prize,
  PrizeBand,
  Range,
  Stars,
} from '../sim/feature-contracts/market.h.ts'
import { tierOf, type VarietyTier } from '../defs/varieties.ts'
import { CASK_IDS, SPIRIT_KINDS, type StallGoodId } from '../sim/ids.ts'
import { Rng } from '../sim/rng.ts'
import { STALL_IDS, isCropStall } from '../sim/stall.ts'

export type AnyKey = 'any-jam' | 'any-spirit'

export type LineKey = StallGoodId | AnyKey

export type LineKind = 'single' | 'any-jam' | 'any-spirit'

export type RewardKind = 'money' | 'prize'

export type PrizeKind = Exclude<Prize['kind'], 'cash'>

export type ScalarKey = { [K in keyof ContractTuning]: ContractTuning[K] extends number ? K : never }[keyof ContractTuning]

export type Spread = { mean: number; median: number; min: number; max: number }

export type Share<K> = { key: K; share: number }

export type GoodStat = { key: LineKey; share: number; amount: number; value: number }

export type VarietyAsked = 'any' | Exclude<VarietyTier, 'base'>

export type Measured = { kind: 'none' } | { kind: 'some'; spread: Spread }

export type Stats = {
  offers: number
  lines: number
  prized: number
  reference: number
  conditionCount: readonly Share<number>[]
  conditions: readonly Share<Condition>[]
  varieties: readonly Share<VarietyAsked>[]
  minQuality: Measured
  minFreshness: Measured
  goodsPerOffer: readonly Share<number>[]
  lineKinds: readonly Share<LineKind>[]
  rewards: readonly Share<RewardKind>[]
  stars: readonly Share<Stars>[]
  deadlines: readonly Share<DeadlineBand>[]
  days: readonly Share<number>[]
  prizeColumns: readonly Share<PrizeBand>[]
  prizeKinds: readonly Share<PrizeKind>[]
  groupLines: readonly Share<Purpose>[]
  groupValue: readonly Share<Purpose>[]
  difficulty: Spread
  reward: Spread
  perDay: Spread
  clean: Spread
  markup: Spread
  penalty: Spread
  goods: readonly { group: Purpose; rows: readonly GoodStat[] }[]
}

export type Sample = { day: number; rep: number; slots: number; difficulty: Difficulty; boards: number }

export type Odds = { key: LineKey; group: Purpose; at: readonly number[] }

export const ANY_GROUP: { readonly [K in AnyKey]: GroupId } = { 'any-jam': 'jam', 'any-spirit': 'spirit' }

const GROUP_IDS: readonly GroupId[] = ['jam', 'spirit']

export const DEADLINE_KINDS: readonly DeadlineBand[] = ['short', 'normal']

const VARIETY_ASKED: readonly VarietyAsked[] = ['any', 'variant', 'heirloom']

export const RANGE_KEYS: readonly ('freshnessRange' | 'qualityRange' | 'heirloomRange')[] = ['freshnessRange', 'qualityRange', 'heirloomRange']

export const STAR_LIST: readonly Stars[] = [1, 2, 3, 4]

export const GROUPS: readonly Purpose[] = ['produce', 'processed', 'alcohol']

const LINE_KINDS: readonly LineKind[] = ['single', 'any-jam', 'any-spirit']

const REWARD_KINDS: readonly RewardKind[] = ['money', 'prize']

const PRIZE_BANDS: readonly PrizeBand[] = [0, 1, 2, 3]

const PRIZE_KINDS: readonly PrizeKind[] = ['tree-seed', 'seeds', 'tool', 'skill-points', 'freezer', 'expansion-slot', 'fertilizer']

const LINE_KEYS: readonly LineKey[] = [...STALL_IDS, 'any-jam', 'any-spirit']

export const SCALAR_KEYS: readonly ScalarKey[] = [
  'difficultyStart',
  'difficultyPerDay',
  'difficultyMax',
  'difficultyCeiling',
  'dStarter',
  'deadlineStep',
  'mixFloor',
  'mixShare',
  'budgetOverdraft',
  'pairCost',
  'groupCost',
  'groupChance',
  'loadMin',
  'loadMax',
  'loadCurve',
  'loadDOffset',
  'amountMin',
  'markupBase',
  'markupPerDifficulty',
  'prizeSlots',
  'conditionsPerLevel',
  'conditionsJitter',
  'conditionsMax',
  'largeMul',
]

export function withScalar(t: ContractTuning, k: ScalarKey, n: number): ContractTuning {
  return { ...t, [k]: n }
}

export function lineKey(d: Demand): LineKey {
  if (d.kind === 'plain') return d.good
  return d.group === 'jam' ? 'any-jam' : 'any-spirit'
}

function lineKind(d: Demand): LineKind {
  if (d.kind === 'plain') return 'single'
  return d.group === 'jam' ? 'any-jam' : 'any-spirit'
}

export function groupOf(k: LineKey): Purpose {
  if (k === 'any-jam') return 'processed'
  if (k === 'any-spirit') return 'alcohol'
  if (isCropStall(k)) return 'produce'
  if ((SPIRIT_KINDS as readonly string[]).includes(k) || (CASK_IDS as readonly string[]).includes(k)) return 'alcohol'
  return 'processed'
}

export const GROUPED_KEYS: readonly { group: Purpose; keys: readonly LineKey[] }[] = GROUPS.map(group => ({
  group,
  keys: LINE_KEYS.filter(k => groupOf(k) === group),
}))

export function isStallKey(k: LineKey): k is StallGoodId {
  return k !== 'any-jam' && k !== 'any-spirit'
}

export function isAnyKey(k: LineKey): k is AnyKey {
  return k === 'any-jam' || k === 'any-spirit'
}

export function levelsOf(t: ContractTuning): readonly number[] {
  return Array.from({ length: Math.floor(t.difficultyCeiling) + 1 }, (_, D) => D)
}

function sharesOf(t: ContractTuning, k: LineKey): Range {
  return isStallKey(k) ? t.goods[k].shares : t.groupShares[ANY_GROUP[k]]
}

function sharesAt(t: ContractTuning, k: LineKey, D: number): number {
  const [start, final] = sharesOf(t, k)
  const n = start + ((final - start) * D) / t.difficultyCeiling
  return n < 0 ? 0 : n
}

export function oddsOf(t: ContractTuning): readonly Odds[] {
  const rolled = GROUPED_KEYS.flatMap(({ group, keys }) =>
    keys.filter(k => !isStallKey(k) || t.goods[k].on).map(key => ({ key, group })),
  )
  const levels = levelsOf(t)
  const shares = rolled.map(({ key }) => levels.map(D => sharesAt(t, key, D)))
  const totals = levels.map((_, i) => shares.reduce((n, s) => n + s[i], 0))
  return rolled.map((r, j) => ({ ...r, at: shares[j].map((s, i) => (totals[i] === 0 ? 0 : s / totals[i])) }))
}

export function sample(t: ContractTuning, s: Sample): readonly ContractOffer[] {
  const rate = HARDNESS[s.difficulty].penaltyRate
  return Array.from({ length: s.boards }, (_, i) => rollBoard(new Rng(i + 1), s.day, s.slots, s.rep, rate, t)).flat()
}

function spread(xs: readonly number[]): Spread {
  const s = [...xs].sort((a, b) => a - b)
  return { mean: s.reduce((n, x) => n + x, 0) / s.length, median: s[Math.floor(s.length / 2)], min: s[0], max: s[s.length - 1] }
}

function weigh<T, J, K extends J>(keys: readonly K[], items: readonly T[], keyOf: (x: T) => J, weight: (x: T) => number): readonly Share<K>[] {
  const total = items.reduce((n, x) => n + weight(x), 0)
  return keys.map(key => ({
    key,
    share: total === 0 ? 0 : items.filter(x => keyOf(x) === key).reduce((n, x) => n + weight(x), 0) / total,
  }))
}

function count<T, J, K extends J>(keys: readonly K[], items: readonly T[], keyOf: (x: T) => J): readonly Share<K>[] {
  return weigh(keys, items, keyOf, () => 1)
}

function valueOf(t: ContractTuning, d: Demand): number {
  return d.amount * priceOf(t, d)
}

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((n, x) => n + x, 0) / xs.length
}

function measured(xs: readonly number[]): Measured {
  return xs.length === 0 ? { kind: 'none' } : { kind: 'some', spread: spread(xs) }
}

function varietyAsked(d: Demand): VarietyAsked {
  if (d.need.variety.kind === 'any') return 'any'
  return tierOf(d.need.variety.variety) === 'heirloom' ? 'heirloom' : 'variant'
}

export function statsOf(t: ContractTuning, offers: readonly ContractOffer[]): Stats {
  const lines = offers.flatMap(o => o.lines)
  const prized = offers.filter(o => o.prize.kind !== 'cash')
  const days = [...new Set(offers.map(o => o.days))].sort((a, b) => a - b)
  return {
    offers: offers.length,
    lines: lines.length,
    prized: prized.length,
    reference: referenceGoldPerDay(t),
    conditionCount: count(
      Array.from({ length: CONDITIONS.length + 1 }, (_, i) => i),
      offers,
      o => o.conditions.length,
    ),
    conditions: CONDITIONS.map(key => ({ key, share: offers.filter(o => o.conditions.includes(key)).length / offers.length })),
    varieties: count(VARIETY_ASKED, offers, o => varietyAsked(o.lines[0])),
    minQuality: measured(offers.filter(o => o.conditions.includes('quality')).map(o => o.lines[0].need.quality)),
    minFreshness: measured(offers.filter(o => o.conditions.includes('freshness')).map(o => o.lines[0].need.freshness)),
    goodsPerOffer: count([1, 2], offers, o => o.lines.length),
    lineKinds: count(LINE_KINDS, lines, lineKind),
    rewards: count(REWARD_KINDS, offers, o => (o.prize.kind === 'cash' ? 'money' : 'prize')),
    stars: count(STAR_LIST, offers, o => o.stars),
    deadlines: count(DEADLINE_KINDS, offers, o => o.band),
    days: count(days, offers, o => o.days),
    prizeColumns: count(PRIZE_BANDS, prized, o => prizeBandOf(t.prizeBandMin, o.difficulty)),
    prizeKinds: count(PRIZE_KINDS, prized, o => o.prize.kind),
    groupLines: count(GROUPS, lines, d => groupOf(lineKey(d))),
    groupValue: weigh(GROUPS, lines, d => groupOf(lineKey(d)), d => valueOf(t, d)),
    difficulty: spread(offers.map(o => o.difficulty)),
    reward: spread(offers.map(o => o.reward)),
    perDay: spread(offers.map(o => o.reward / o.days)),
    clean: spread(offers.map(o => o.clean)),
    markup: spread(offers.map(o => o.markup)),
    penalty: spread(offers.map(o => o.penalty)),
    goods: GROUPED_KEYS.map(({ group, keys }) => ({
      group,
      rows: keys.map(key => {
        const ls = lines.filter(d => lineKey(d) === key)
        return {
          key,
          share: offers.filter(o => o.lines.some(d => lineKey(d) === key)).length / offers.length,
          amount: mean(ls.map(d => d.amount)),
          value: mean(ls.map(d => valueOf(t, d))),
        }
      }),
    })),
  }
}

function row(section: string, key: string, field: string, value: number | string | boolean, origin: number | string | boolean): string {
  return [section, key, field, String(value), String(origin)].join(',')
}

export function toCsv(t: ContractTuning): string {
  const o = CONTRACT_TUNING
  return [
    'section,key,field,value,default',
    ...SCALAR_KEYS.map(k => row('setting', k, '', t[k], o[k])),
    ...([2, 3, 4] as const).map(s => row('setting', 'starMin', String(s), t.starMin[s], o.starMin[s])),
    ...(['jam', 'spirit'] as const).map(g => row('setting', 'groupTier', g, t.groupTier[g], o.groupTier[g])),
    ...([1, 2, 3] as const).map(i => row('setting', 'prizeBandMin', String(i), t.prizeBandMin[i], o.prizeBandMin[i])),
    row('setting', 'niceAmounts', '', t.niceAmounts.join(' '), o.niceAmounts.join(' ')),
    ...CONDITIONS.map(c => row('setting', 'conditionWeight', c, t.conditionWeight[c], o.conditionWeight[c])),
    ...RANGE_KEYS.flatMap(k => [row('setting', k, 'lo', t[k][0], o[k][0]), row('setting', k, 'hi', t[k][1], o[k][1])]),
    ...STALL_IDS.flatMap(g => [
      ...(['on', 'tier', 'cost', 'feasible', 'price', 'starter'] as const).map(f => row('good', g, f, t.goods[g][f], o.goods[g][f])),
      row('good', g, 'sharesStart', t.goods[g].shares[0], o.goods[g].shares[0]),
      row('good', g, 'sharesFinal', t.goods[g].shares[1], o.goods[g].shares[1]),
    ]),
    ...GROUP_IDS.flatMap(g => [
      row('group', g, 'sharesStart', t.groupShares[g][0], o.groupShares[g][0]),
      row('group', g, 'sharesFinal', t.groupShares[g][1], o.groupShares[g][1]),
    ]),
    ...DEADLINE_KINDS.flatMap(b =>
      (['lo', 'hi', 'cost', 'markup'] as const).map(f => row('deadline', b, f, t.deadlines[b][f], o.deadlines[b][f])),
    ),
    ...t.slotBands.flatMap((band, i) => [
      row('position', String(i), 'lo', band[0], o.slotBands[i][0]),
      row('position', String(i), 'hi', band[1], o.slotBands[i][1]),
    ]),
  ].join('\n')
}
