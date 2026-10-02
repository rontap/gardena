import { m } from '../../paraglide/messages.js'
import { Component, useMemo, useState, type ReactNode } from 'react'
import { HARDNESS, type Difficulty } from '../defs/rules.ts'
import type { Purpose } from '../defs/varieties.ts'
import {
  BROKER_MAX_TIER,
  CONTRACT_ACTIVE,
  CONTRACT_OFFERS,
  CONTRACT_TUNING,
  REP_MAX,
  rollBoard,
  slotRange,
} from '../sim/feature-contracts/market.ts'
import type {
  ContractTuning,
  DeadlineBand,
  DeadlineTuning,
  GoodTuning,
  GroupId,
  PrizeBandMin,
  Stars,
} from '../sim/feature-contracts/market.h.ts'
import type { StallGoodId } from '../sim/ids.ts'
import { Rng } from '../sim/rng.ts'
import { stallGoodName } from '../sim/stall.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Cat, Field, Num, Pair, Pct, Table, sticky, td, th } from './debug-balance.tsx'
import {
  DEADLINE_KINDS,
  GROUPED_KEYS,
  STAR_LIST,
  isStallKey,
  sample,
  statsOf,
  toCsv,
  withScalar,
  type LineKey,
  type LineKind,
  type PrizeKind,
  type RewardKind,
  type Sample,
  type ScalarKey,
  type Spread,
} from './debug-contracts-balance.ts'
import { OfferCard } from './feature-contracts/contracts.tsx'
import { Btn, Chrome } from './frame.tsx'

type Tip = { title: string; description: ReactNode } | undefined

type Input = { kind: 'num' } | { kind: 'pct'; max: number }

type Row = { label: string; share: number }

type Slice = Row & { color: string }

const NUM: Input = { kind: 'num' }

function pct(max: number): Input {
  return { kind: 'pct', max }
}

const DIFFICULTIES: readonly Difficulty[] = ['peaceful', 'normal', 'hard']

const DIFFICULTY_NAME: { readonly [K in Difficulty]: () => string } = {
  peaceful: m.menu_difficulty_peaceful,
  normal: m.menu_difficulty_normal,
  hard: m.menu_difficulty_hard,
}

const DEADLINE_NAME: { readonly [K in DeadlineBand]: () => string } = {
  tight: m.hud_debug_cb_tight,
  normal: m.hud_debug_cb_normal,
  long: m.hud_debug_cb_long,
}

const GROUP_NAME: { readonly [K in Purpose]: () => string } = {
  produce: m.names_purpose_produce,
  processed: m.names_purpose_processed,
  alcohol: m.names_purpose_alcohol,
}

const LINE_KIND_NAME: { readonly [K in LineKind]: () => string } = {
  single: m.hud_debug_cb_single,
  'any-jam': m.market_any_jam,
  'any-spirit': m.market_any_spirit,
}

const REWARD_NAME: { readonly [K in RewardKind]: () => string } = {
  money: m.almanac_group_money,
  prize: m.hud_debug_cb_prize_kind,
}

const PRIZE_NAME: { readonly [K in PrizeKind]: () => string } = {
  'tree-seed': m.hud_debug_cb_tree_seed,
  seeds: m.hud_debug_cb_seeds,
  tool: m.almanac_caption_tool,
  'skill-points': m.hud_station_point_name,
  freezer: m.names_sku_buy_freezer_large,
  'expansion-slot': m.hud_expansion,
  fertilizer: m.hud_debug_cb_fertilizer,
}

const ANY_NAME: { readonly [K in GroupId]: () => string } = {
  jam: m.market_any_jam,
  spirit: m.market_any_spirit,
}

const PIE: readonly string[] = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7']

const PIE_OTHER = '#8f8775'

const R = 40

const BROKER_RANKS: readonly number[] = Array.from({ length: BROKER_MAX_TIER + 1 }, (_, i) => i)

const box = 'size-4 accent-dirt'

const groupRow = 'px-1.5 pt-3 pb-1 font-display text-[11px] text-ink/70'

function fmt(n: number, d: number): string {
  return String(Number(n.toFixed(d)))
}

function share(n: number): string {
  return `${fmt(n * 100, 1)}%`
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n)
}

function lineName(k: LineKey): string {
  if (k === 'any-jam') return m.market_any_jam()
  if (k === 'any-spirit') return m.market_any_spirit()
  return stallGoodName(k, 'base')
}

function daysName(n: number): string {
  return n === 1 ? m.hud_debug_cb_day_one() : m.hud_debug_cb_days_n({ n })
}

function withBand(min: PrizeBandMin, i: 1 | 2 | 3, v: number): PrizeBandMin {
  return [min[0], i === 1 ? v : min[1], i === 2 ? v : min[2], i === 3 ? v : min[3]]
}

function parseAmounts(text: string): readonly number[] {
  return text
    .split(/[\s,]+/)
    .map(Number)
    .filter(n => n > 0)
    .sort((a, b) => a - b)
}

function downloadCsv(t: ContractTuning): void {
  const blob = new Blob([toCsv(t)], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'contract-tuning.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function slicesOf(rows: readonly Row[]): readonly Slice[] {
  if (rows.length <= PIE.length) return rows.map((r, i) => ({ ...r, color: PIE[i] }))
  const head = rows.slice(0, PIE.length - 1).map((r, i) => ({ ...r, color: PIE[i] }))
  const rest = rows.slice(PIE.length - 1).reduce((n, r) => n + r.share, 0)
  return [...head, { label: m.almanac_group_other(), share: rest, color: PIE_OTHER }]
}

function wedge(a0: number, a1: number): string {
  const at = (a: number) => `${R + R * Math.sin(a)} ${R - R * Math.cos(a)}`
  return `M ${R} ${R} L ${at(a0)} A ${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${at(a1)} Z`
}

class Guard extends Component<{ children: ReactNode }, { error: string | undefined }> {
  state: { error: string | undefined } = { error: undefined }

  static getDerivedStateFromError(error: Error): { error: string } {
    return { error: error.message }
  }

  render(): ReactNode {
    if (this.state.error === undefined) return this.props.children
    return <div className="text-sm text-roof">{m.hud_debug_cb_broken({ error: this.state.error })}</div>
  }
}

function StarPick({ value, dirty, onChange }: { value: Stars; dirty: boolean; onChange: (s: Stars) => void }) {
  return (
    <select
      value={value}
      className={`border-2 bg-parch px-1 py-0.5 font-mono text-xs ${dirty ? 'border-ripe' : 'border-ink/30'}`}
      onChange={e => onChange(STAR_LIST[e.target.selectedIndex])}
    >
      {STAR_LIST.map(s => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}

function Tick({ on, dirty, onChange }: { on: boolean; dirty: boolean; onChange: (v: boolean) => void }) {
  return (
    <input
      type="checkbox"
      checked={on}
      className={`${box} ${dirty ? 'outline-2 outline-ripe' : ''}`}
      onChange={e => onChange(e.target.checked)}
    />
  )
}

function Scalar({
  t,
  k,
  label,
  input,
  onChange,
}: {
  t: ContractTuning
  k: ScalarKey
  label: string
  input: Input
  onChange: (n: number) => void
}) {
  const dirty = t[k] !== CONTRACT_TUNING[k]
  return (
    <Field k={label}>
      {input.kind === 'num' ? (
        <Num wide value={t[k]} dirty={dirty} onChange={onChange} />
      ) : (
        <Pct wide max={input.max} value={t[k]} dirty={dirty} onChange={onChange} />
      )}
    </Field>
  )
}

export function DebugContractsBalance() {
  const [t, setT] = useState<ContractTuning>(CONTRACT_TUNING)
  const [day, setDay] = useState(20)
  const [rep, setRep] = useState(0)
  const [seed, setSeed] = useState(1)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [broker, setBroker] = useState(0)
  const [boards, setBoards] = useState(500)
  const [tip, setTip] = useState<Tip>(undefined)
  const slots = CONTRACT_OFFERS + broker
  const s = useMemo<Sample>(() => ({ day, rep, slots, difficulty, boards }), [day, rep, slots, difficulty, boards])
  const pristine = JSON.stringify(t) === JSON.stringify(CONTRACT_TUNING)
  const o = CONTRACT_TUNING

  const scalar = (k: ScalarKey, label: string, input: Input) => (
    <Scalar key={k} t={t} k={k} label={label} input={input} onChange={n => setT(x => withScalar(x, k, n))} />
  )
  const setGood = (g: StallGoodId, patch: Partial<GoodTuning>) =>
    setT(x => ({ ...x, goods: { ...x.goods, [g]: { ...x.goods[g], ...patch } } }))
  const setDeadline = (b: DeadlineBand, patch: Partial<DeadlineTuning>) =>
    setT(x => ({ ...x, deadlines: { ...x.deadlines, [b]: { ...x.deadlines[b], ...patch } } }))
  const setSlot = (i: number, lo: number, hi: number) =>
    setT(x => ({ ...x, slotBands: x.slotBands.map((b, j) => (j === i ? ([lo, hi] as const) : b)) }))
  const totalWeight = DEADLINE_KINDS.reduce((n, b) => n + t.deadlines[b].weight, 0)

  return (
    <div className="h-screen overflow-hidden bg-ink p-4">
      <Chrome className="relative flex h-full flex-col px-4 py-3">
        <div className="relative z-20 flex min-h-0 flex-1 gap-4">
          <aside className="scroll-pane flex w-[22rem] shrink-0 flex-col gap-3 overflow-y-auto border-r border-ink/15 pr-3">
            <div className="font-display text-lg">{m.hud_debug_cb_title()}</div>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => setT(CONTRACT_TUNING)}>{m.menu_revert_default()}</Btn>
              <Btn onClick={() => downloadCsv(t)}>{m.hud_debug_cb_csv()}</Btn>
            </div>
            <span className="text-xs text-ink/45">{pristine ? m.hud_debug_cb_live() : m.hud_debug_cb_edited()}</span>

            <Cat title={m.hud_debug_cb_cat_game()}>
              <Field k={m.hud_debug_cb_game_difficulty()}>
                <div className="flex gap-1">
                  {DIFFICULTIES.map(d => (
                    <Btn key={d} selected={difficulty === d} onClick={() => setDifficulty(d)} className="text-xs">
                      {DIFFICULTY_NAME[d]()}
                    </Btn>
                  ))}
                </div>
              </Field>
              <Field k={m.hud_debug_cb_broker()}>
                <div className="flex gap-1">
                  {BROKER_RANKS.map(r => (
                    <Btn key={r} selected={broker === r} onClick={() => setBroker(r)} className="text-xs">
                      {r}
                    </Btn>
                  ))}
                </div>
              </Field>
              <Field k={m.hud_debug_cb_boards()}>
                <Num wide value={boards} min={1} onChange={n => setBoards(Math.round(n))} />
              </Field>
            </Cat>

            <Cat title={m.hud_debug_cb_cat_difficulty()}>
              <Pair>
                {scalar('difficultyStart', m.hud_debug_cb_difficulty_start(), NUM)}
                {scalar('difficultyPerDay', m.hud_debug_cb_difficulty_per_day(), NUM)}
              </Pair>
              <Pair>
                {scalar('difficultyMax', m.hud_debug_cb_difficulty_max(), NUM)}
                {scalar('difficultyCeiling', m.hud_debug_cb_difficulty_ceiling(), NUM)}
              </Pair>
              {scalar('dStarter', m.hud_debug_cb_d_starter(), NUM)}
              <div className="grid grid-cols-3 gap-2">
                {([2, 3, 4] as const).map(n => (
                  <Field key={n} k={m.hud_debug_cb_star_from({ n })}>
                    <Num
                      wide
                      value={t.starMin[n]}
                      dirty={t.starMin[n] !== o.starMin[n]}
                      onChange={v => setT(x => ({ ...x, starMin: { ...x.starMin, [n]: v } }))}
                    />
                  </Field>
                ))}
              </div>
            </Cat>

            <Cat title={m.hud_debug_cb_cat_budget()}>
              <Pair>
                {scalar('mixFloor', m.hud_debug_cb_mix_floor(), NUM)}
                {scalar('mixShare', m.hud_debug_cb_mix_share(), NUM)}
              </Pair>
              <Pair>
                {scalar('budgetOverdraft', m.hud_debug_cb_overdraft(), NUM)}
                {scalar('pairCost', m.hud_debug_cb_pair_cost(), NUM)}
              </Pair>
              {scalar('groupCost', m.hud_debug_cb_group_cost(), NUM)}
              {scalar('groupChance', m.hud_debug_cb_group_chance(), pct(100))}
              <Pair>
                {(['jam', 'spirit'] as const).map(g => (
                  <Field key={g} k={m.hud_debug_cb_group_tier({ name: ANY_NAME[g]() })}>
                    <StarPick
                      value={t.groupTier[g]}
                      dirty={t.groupTier[g] !== o.groupTier[g]}
                      onChange={v => setT(x => ({ ...x, groupTier: { ...x.groupTier, [g]: v } }))}
                    />
                  </Field>
                ))}
              </Pair>
            </Cat>

            <Cat title={m.hud_debug_cb_cat_money()}>
              {scalar('loadMin', m.hud_debug_cb_load_min(), pct(200))}
              {scalar('loadMax', m.hud_debug_cb_load_max(), pct(400))}
              <Pair>
                {scalar('loadCurve', m.hud_debug_cb_load_curve(), NUM)}
                {scalar('loadDOffset', m.hud_debug_cb_load_offset(), NUM)}
              </Pair>
            </Cat>

            <Cat title={m.hud_debug_cb_cat_amounts()}>
              {scalar('amountMin', m.hud_debug_cb_amount_min(), NUM)}
              <Field k={m.hud_debug_cb_nice()}>
                <input
                  key={t.niceAmounts.join(' ')}
                  defaultValue={t.niceAmounts.join(' ')}
                  className={`w-full border-2 bg-parch px-1 py-0.5 font-mono text-xs ${
                    t.niceAmounts.join(' ') === o.niceAmounts.join(' ') ? 'border-ink/30' : 'border-ripe'
                  }`}
                  onBlur={e => {
                    const xs = parseAmounts(e.target.value)
                    if (xs.length > 0) setT(x => ({ ...x, niceAmounts: xs }))
                  }}
                />
              </Field>
            </Cat>

            <Cat title={m.hud_debug_cb_cat_pay()}>
              {scalar('markupBase', m.hud_debug_cb_markup_base(), pct(100))}
              {scalar('markupPerDifficulty', m.hud_debug_cb_markup_per(), pct(5))}
            </Cat>

            <Cat title={m.hud_debug_cb_cat_deadline()}>{scalar('deadlineStep', m.hud_debug_cb_deadline_step(), NUM)}</Cat>

            <Cat title={m.hud_debug_cb_cat_prizes()}>
              {scalar('prizeSlots', m.hud_debug_cb_prize_slots(), NUM)}
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map(i => (
                  <Field key={i} k={m.hud_debug_cb_prize_from({ n: i + 1 })}>
                    <Num
                      wide
                      value={t.prizeBandMin[i]}
                      dirty={t.prizeBandMin[i] !== o.prizeBandMin[i]}
                      onChange={v => setT(x => ({ ...x, prizeBandMin: withBand(x.prizeBandMin, i, v) }))}
                    />
                  </Field>
                ))}
              </div>
            </Cat>
          </aside>

          <main className="flex min-w-0 flex-1 gap-4">
            <section className="scroll-pane flex min-w-0 flex-1 flex-col gap-6 overflow-auto pr-1">
              <Table title={m.hud_debug_cb_goods()}>
                <thead>
                  <tr>
                    <th className={`${th} ${sticky}`}>{m.hud_debug_cb_good()}</th>
                    <th className={th}>{m.hud_debug_cb_offered()}</th>
                    <th className={th}>{m.hud_debug_cb_stars()}</th>
                    <th className={th}>{m.hud_debug_cb_cost()}</th>
                    <th className={th}>{m.hud_debug_cb_feasible()}</th>
                    <th className={th}>{m.hud_debug_cb_price()}</th>
                    <th className={th}>{m.hud_debug_cb_lowers({ n: signed(t.dStarter) })}</th>
                    <th className={th}>{m.hud_debug_cb_money_day()}</th>
                  </tr>
                </thead>
                {GROUPED_KEYS.map(({ group, keys }) => (
                  <tbody key={group}>
                    <tr>
                      <td colSpan={8} className={`${groupRow} ${sticky}`}>
                        {GROUP_NAME[group]()}
                      </td>
                    </tr>
                    {keys.filter(isStallKey).map(g => {
                      const v = t.goods[g]
                      const d = o.goods[g]
                      return (
                        <tr key={g} className="border-t border-ink/10">
                          <td className={`${td} ${sticky}`}>{stallGoodName(g, 'base')}</td>
                          <td className={td}>
                            <Tick on={v.on} dirty={v.on !== d.on} onChange={on => setGood(g, { on })} />
                          </td>
                          <td className={td}>
                            <StarPick value={v.tier} dirty={v.tier !== d.tier} onChange={tier => setGood(g, { tier })} />
                          </td>
                          <td className={td}>
                            <Num value={v.cost} dirty={v.cost !== d.cost} onChange={cost => setGood(g, { cost })} />
                          </td>
                          <td className={td}>
                            <Num value={v.feasible} dirty={v.feasible !== d.feasible} min={0} onChange={feasible => setGood(g, { feasible })} />
                          </td>
                          <td className={td}>
                            <Num value={v.price} dirty={v.price !== d.price} min={0} onChange={price => setGood(g, { price })} />
                          </td>
                          <td className={td}>
                            <Tick on={v.starter} dirty={v.starter !== d.starter} onChange={starter => setGood(g, { starter })} />
                          </td>
                          <td className={`${td} font-mono tabular-nums`}>{fmt(v.price * v.feasible, 1)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                ))}
              </Table>

              <Table title={m.hud_debug_cb_deadlines()}>
                <thead>
                  <tr>
                    <th className={th}>{m.hud_debug_cb_kind()}</th>
                    <th className={th}>{m.hud_debug_cb_weight()}</th>
                    <th className={th}>{m.hud_debug_cb_chance()}</th>
                    <th className={th}>{m.hud_debug_cb_shortest()}</th>
                    <th className={th}>{m.hud_debug_cb_longest()}</th>
                    <th className={th}>{m.hud_debug_cb_cost()}</th>
                    <th className={th}>{m.hud_debug_cb_markup()}</th>
                  </tr>
                </thead>
                <tbody>
                  {DEADLINE_KINDS.map(b => {
                    const v = t.deadlines[b]
                    const d = o.deadlines[b]
                    return (
                      <tr key={b} className="border-t border-ink/10">
                        <td className={td}>{DEADLINE_NAME[b]()}</td>
                        <td className={td}>
                          <Num value={v.weight} dirty={v.weight !== d.weight} min={0} onChange={weight => setDeadline(b, { weight })} />
                        </td>
                        <td className={`${td} font-mono tabular-nums`}>{share(v.weight / totalWeight)}</td>
                        <td className={td}>
                          <Num value={v.lo} dirty={v.lo !== d.lo} min={0} onChange={lo => setDeadline(b, { lo })} />
                        </td>
                        <td className={td}>
                          <Num value={v.hi} dirty={v.hi !== d.hi} min={0} onChange={hi => setDeadline(b, { hi })} />
                        </td>
                        <td className={td}>
                          <Num value={v.cost} dirty={v.cost !== d.cost} onChange={cost => setDeadline(b, { cost })} />
                        </td>
                        <td className={td}>
                          <Pct value={v.markup} max={50} dirty={v.markup !== d.markup} onChange={markup => setDeadline(b, { markup })} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>

              <Table title={m.hud_debug_cb_positions()}>
                <thead>
                  <tr>
                    <th className={th}>{m.hud_debug_cb_position()}</th>
                    <th className={th}>{m.hud_debug_cb_lowest()}</th>
                    <th className={th}>{m.hud_debug_cb_highest()}</th>
                    <th className={th}>{m.hud_debug_cb_on_day({ day, rep })}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.slotBands.map(([lo, hi], i) => {
                    const [l, h] = slotRange(t, day, i)
                    const top = (n: number) => Math.min(n + rep, t.difficultyCeiling)
                    return (
                      <tr key={i} className="border-t border-ink/10">
                        <td className={td}>{i < CONTRACT_OFFERS ? i + 1 : m.hud_debug_cb_position_broker({ n: i + 1 })}</td>
                        <td className={td}>
                          <Num value={lo} dirty={lo !== o.slotBands[i][0]} onChange={n => setSlot(i, n, hi)} />
                        </td>
                        <td className={td}>
                          <Num value={hi} dirty={hi !== o.slotBands[i][1]} onChange={n => setSlot(i, lo, n)} />
                        </td>
                        <td className={`${td} font-mono tabular-nums`}>
                          {fmt(top(l), 1)}–{fmt(top(h), 1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </section>

            <section className="scroll-pane flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
              <div className="flex flex-col gap-2">
                <Field k={m.hud_debug_cb_day({ n: day })}>
                  <input type="range" min={0} max={80} step={1} value={day} className="w-full accent-dirt" onChange={e => setDay(Number(e.target.value))} />
                </Field>
                <Field k={m.hud_debug_cb_rep({ n: rep })}>
                  <input
                    type="range"
                    min={0}
                    max={REP_MAX}
                    step={0.5}
                    value={rep}
                    className="w-full accent-dirt"
                    onChange={e => setRep(Number(e.target.value))}
                  />
                </Field>
                <div className="flex items-center gap-3">
                  <Btn onClick={() => setSeed(n => n + 1)}>{m.hud_debug_reroll()}</Btn>
                  <span className="text-sm text-ink/45">{m.hud_debug_seed({ n: seed })}</span>
                </div>
              </div>
              <Guard key={JSON.stringify([t, s, seed])}>
                <div className="relative">
                  <Cards t={t} s={s} seed={seed} onTip={setTip} />
                  {tip !== undefined ? <CalloutHover title={tip.title} description={tip.description} placement="below" /> : undefined}
                </div>
                <Results t={t} s={s} />
              </Guard>
            </section>
          </main>
        </div>
      </Chrome>
    </div>
  )
}

function Cards({ t, s, seed, onTip }: { t: ContractTuning; s: Sample; seed: number; onTip: (tip: Tip) => void }) {
  const offers = rollBoard(new Rng(seed), s.day, s.slots, s.rep, HARDNESS[s.difficulty].penaltyRate, t)
  return (
    <div className="grid grid-cols-3 gap-2">
      {offers.map(offer => (
        <OfferCard
          key={offer.id}
          offer={offer}
          atCap={false}
          cap={CONTRACT_ACTIVE + s.slots - CONTRACT_OFFERS}
          cancelMin={HARDNESS[s.difficulty].cancelMin}
          onTip={onTip}
          onAccept={() => {}}
        />
      ))}
    </div>
  )
}

function Pie({ title, base, rows }: { title: string; base: string; rows: readonly Row[] }) {
  const slices = slicesOf(rows)
  const ends = slices.reduce<readonly number[]>((acc, x) => [...acc, acc[acc.length - 1] + x.share * 2 * Math.PI], [0])
  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="flex items-baseline gap-2">
        <span className="font-display text-xs">{title}</span>
        <span className="text-[11px] text-ink/45">{base}</span>
      </figcaption>
      <div className="flex flex-wrap items-center gap-3">
        <svg viewBox={`0 0 ${2 * R} ${2 * R}`} className="size-20 shrink-0" role="img" aria-label={title}>
          <circle cx={R} cy={R} r={R} fill="var(--color-parch)" />
          {slices.map((x, i) =>
            x.share <= 0 ? undefined : x.share >= 0.9999 ? (
              <circle key={x.label} cx={R} cy={R} r={R} fill={x.color}>
                <title>{`${x.label}: ${share(x.share)}`}</title>
              </circle>
            ) : (
              <path key={x.label} d={wedge(ends[i], ends[i + 1])} fill={x.color} stroke="var(--color-house)" strokeWidth={2} strokeLinejoin="round">
                <title>{`${x.label}: ${share(x.share)}`}</title>
              </path>
            ),
          )}
        </svg>
        <ul className="flex min-w-[10rem] flex-1 flex-col gap-0.5 text-xs">
          {slices.map(x => (
            <li key={x.label} className={`flex items-center gap-1.5 whitespace-nowrap ${x.share > 0 ? '' : 'text-ink/35'}`}>
              <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: x.color }} />
              <span>{x.label}</span>
              <span className="ml-auto pl-2 font-mono tabular-nums">{share(x.share)}</span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}

function SpreadRow({ label, n, d, percent }: { label: string; n: Spread; d: number; percent: boolean }) {
  const f = (x: number) => (percent ? share(x) : fmt(x, d))
  return (
    <tr className="border-t border-ink/10">
      <td className={td}>{label}</td>
      <td className={`${td} font-mono tabular-nums`}>{f(n.mean)}</td>
      <td className={`${td} font-mono tabular-nums`}>{f(n.median)}</td>
      <td className={`${td} font-mono tabular-nums`}>{f(n.min)}</td>
      <td className={`${td} font-mono tabular-nums`}>{f(n.max)}</td>
    </tr>
  )
}

function Results({ t, s }: { t: ContractTuning; s: Sample }) {
  const stats = useMemo(() => statsOf(t, sample(t, s)), [t, s])
  const offers = m.hud_debug_cb_of_offers({ n: stats.offers })
  const lines = m.hud_debug_cb_of_lines({ n: stats.lines })
  const prized = m.hud_debug_cb_of_prized({ n: stats.prized })
  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs text-ink/60">
        {m.hud_debug_cb_sampled({ n: stats.offers, day: s.day, rep: s.rep })} · {m.hud_debug_cb_reference({ n: fmt(stats.reference, 1) })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-x-6 gap-y-4">
        <Pie
          title={m.hud_debug_cb_pie_goods()}
          base={offers}
          rows={stats.goodsPerOffer.map(x => ({ label: x.key === 1 ? m.hud_debug_cb_one_good() : m.hud_debug_cb_pair(), share: x.share }))}
        />
        <Pie title={m.hud_debug_cb_pie_reward()} base={offers} rows={stats.rewards.map(x => ({ label: REWARD_NAME[x.key](), share: x.share }))} />
        <Pie title={m.hud_debug_cb_pie_stars()} base={offers} rows={stats.stars.map(x => ({ label: m.hud_debug_cb_star_n({ n: x.key }), share: x.share }))} />
        <Pie title={m.hud_debug_cb_pie_deadline()} base={offers} rows={stats.deadlines.map(x => ({ label: DEADLINE_NAME[x.key](), share: x.share }))} />
        <Pie title={m.hud_debug_cb_pie_days()} base={offers} rows={stats.days.map(x => ({ label: daysName(x.key), share: x.share }))} />
        <Pie title={m.hud_debug_cb_pie_lines()} base={lines} rows={stats.lineKinds.map(x => ({ label: LINE_KIND_NAME[x.key](), share: x.share }))} />
        <Pie title={m.hud_debug_cb_pie_group_lines()} base={lines} rows={stats.groupLines.map(x => ({ label: GROUP_NAME[x.key](), share: x.share }))} />
        <Pie title={m.hud_debug_cb_pie_group_value()} base={lines} rows={stats.groupValue.map(x => ({ label: GROUP_NAME[x.key](), share: x.share }))} />
        <Pie
          title={m.hud_debug_cb_pie_column()}
          base={prized}
          rows={stats.prizeColumns.map(x => ({ label: m.hud_debug_cb_column({ n: x.key + 1 }), share: x.share }))}
        />
        <Pie title={m.hud_debug_cb_pie_prize()} base={prized} rows={stats.prizeKinds.map(x => ({ label: PRIZE_NAME[x.key](), share: x.share }))} />
      </div>

      <Table title={m.hud_debug_cb_numbers()}>
        <thead>
          <tr>
            <th className={th} />
            <th className={th}>{m.hud_debug_cb_mean()}</th>
            <th className={th}>{m.hud_debug_cb_median()}</th>
            <th className={th}>{m.hud_debug_cb_lowest()}</th>
            <th className={th}>{m.hud_debug_cb_highest()}</th>
          </tr>
        </thead>
        <tbody>
          <SpreadRow label={m.hud_debug_cb_difficulty()} n={stats.difficulty} d={1} percent={false} />
          <SpreadRow label={m.hud_debug_cb_reward()} n={stats.reward} d={0} percent={false} />
          <SpreadRow label={m.hud_debug_cb_reward_day()} n={stats.perDay} d={1} percent={false} />
          <SpreadRow label={m.hud_debug_cb_clean()} n={stats.clean} d={0} percent={false} />
          <SpreadRow label={m.hud_debug_cb_markup()} n={stats.markup} d={0} percent />
          <SpreadRow label={m.hud_debug_cb_penalty()} n={stats.penalty} d={0} percent={false} />
        </tbody>
      </Table>

      <Table title={m.hud_debug_cb_on_offer()}>
        <thead>
          <tr>
            <th className={th}>{m.hud_debug_cb_good()}</th>
            <th className={th}>{m.hud_debug_cb_in_offers()}</th>
            <th className={th}>{m.hud_debug_cb_units()}</th>
            <th className={th}>{m.hud_debug_cb_value()}</th>
          </tr>
        </thead>
        {stats.goods.map(({ group, rows }) => (
          <tbody key={group}>
            <tr>
              <td colSpan={4} className={groupRow}>
                {GROUP_NAME[group]()}
              </td>
            </tr>
            {rows.map(g => (
              <tr key={g.key} className={`border-t border-ink/10 ${g.share > 0 ? '' : 'text-ink/35'}`}>
                <td className={td}>{lineName(g.key)}</td>
                <td className={`${td} font-mono tabular-nums`}>{share(g.share)}</td>
                <td className={`${td} font-mono tabular-nums`}>{fmt(g.amount, 1)}</td>
                <td className={`${td} font-mono tabular-nums`}>{fmt(g.value, 0)}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </Table>
    </div>
  )
}
