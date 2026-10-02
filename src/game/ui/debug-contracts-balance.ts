import { prizeBandOf } from '../defs/companies.ts'
import { HARDNESS, type Difficulty } from '../defs/rules.ts'
import type { Purpose } from '../defs/varieties.ts'
import { CONTRACT_TUNING, priceOf, referenceGoldPerDay, rollBoard } from '../sim/feature-contracts/market.ts'
import type { ContractOffer, ContractTuning, DeadlineBand, Demand, Prize, PrizeBand, Stars } from '../sim/feature-contracts/market.h.ts'
import { CASK_IDS, SPIRIT_KINDS, type StallGoodId } from '../sim/ids.ts'
import { Rng } from '../sim/rng.ts'
import { STALL_IDS, isCropStall } from '../sim/stall.ts'

export type LineKey = StallGoodId | 'any-jam' | 'any-spirit'

export type LineKind = 'single' | 'any-jam' | 'any-spirit'

export type RewardKind = 'money' | 'prize'

export type PrizeKind = Exclude<Prize['kind'], 'cash'>

export type ScalarKey = { [K in keyof ContractTuning]: ContractTuning[K] extends number ? K : never }[keyof ContractTuning]

export type Spread = { mean: number; median: number; min: number; max: number }

export type Share<K> = { key: K; share: number }

export type GoodStat = { key: LineKey; share: number; amount: number; value: number }

export type Stats = {
  offers: number
  lines: number
  prized: number
  reference: number
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

export const DEADLINE_KINDS: readonly DeadlineBand[] = ['tight', 'normal', 'long']

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

export function statsOf(t: ContractTuning, offers: readonly ContractOffer[]): Stats {
  const lines = offers.flatMap(o => o.lines)
  const prized = offers.filter(o => o.prize.kind !== 'cash')
  const days = [...new Set(offers.map(o => o.days))].sort((a, b) => a - b)
  return {
    offers: offers.length,
    lines: lines.length,
    prized: prized.length,
    reference: referenceGoldPerDay(t),
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
    ...STALL_IDS.flatMap(g =>
      (['on', 'tier', 'cost', 'feasible', 'price', 'starter'] as const).map(f => row('good', g, f, t.goods[g][f], o.goods[g][f])),
    ),
    ...DEADLINE_KINDS.flatMap(b =>
      (['weight', 'lo', 'hi', 'cost', 'markup'] as const).map(f => row('deadline', b, f, t.deadlines[b][f], o.deadlines[b][f])),
    ),
    ...t.slotBands.flatMap((band, i) => [
      row('position', String(i), 'lo', band[0], o.slotBands[i][0]),
      row('position', String(i), 'hi', band[1], o.slotBands[i][1]),
    ]),
  ].join('\n')
}
