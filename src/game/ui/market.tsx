import { m } from '../../paraglide/messages.js'
import { useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { COMPANIES } from '../defs/companies.ts'
import { CROPS, cropVariety } from '../defs/crops.ts'
import { TREE_NAME } from '../defs/trees.ts'
import { FERT_BAG_LITERS, SUGAR_MILL } from '../defs/items.ts'
import { JAM_CROPS, type JamCrop, type StallGoodId } from '../sim/ids.ts'
import { caskName, cropName, jamJarName, makePickaxe, makeShovel, SPIRIT_NAME, type Item } from '../sim/item.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import { SAT_MAX_CUT, cancelFee, cutOf, demandGood, filledOf, needOf, REP_MAX, rollBoard } from '../sim/feature-contracts/market.ts'
import type { Active, ContractOffer, Demand, DemandChip, HistoryEntry, MarketQuote, Prize, Stars } from '../sim/feature-contracts/market.h.ts'
import { isCropStall } from '../sim/stall.ts'
import type { World } from '../sim/world.ts'
import { COMPANY, EXPAND_LAND, SKILL_POINT, skuInner, UI_PRICE_ARROW, faceGfx } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Bar, Btn, Coin, Label, Overlay, tabTriggerClass } from './frame.tsx'
import { ItemFace } from './held.tsx'
import { useCycle } from './cycle.ts'

type Tip = { title: string; description: ReactNode } | undefined

export type MarketTab = 'market' | 'contracts'

const MARKET_COLS = 'grid-cols-[minmax(12rem,1fr)_4.5rem_9rem_8rem]'

export function Market({
  world,
  tab,
  onTab,
  onClose,
}: {
  world: World
  tab: MarketTab
  onTab: (tab: MarketTab) => void
  onClose: () => void
}) {
  const [tip, setTip] = useState<Tip>(undefined)
  const quote = world.marketQuote()
  const contracts = world.done.has('unlock-contracts')
  const slots = world.contractSlots()
  const cap = world.contractCap()
  const board = rollBoard(world.rng, world.clock.day, slots, world.contracts.repDay).filter(o => !world.contracts.takenToday.includes(o.id))
  const nowDay = world.clock.day - 1 + world.clock.t / DAY_SECONDS
  const atCap = world.contracts.active.length >= cap
  return (
    <Overlay
      title={m.names_role_market()}
      onClose={onClose}
      className="h-[min(40rem,calc(100vh-6rem))] w-[72rem]"
      aside={tip !== undefined ? <CalloutHover title={tip.title} description={tip.description} /> : undefined}
    >
      <Tabs.Root
        value={contracts ? tab : 'market'}
        onValueChange={v => onTab(v as MarketTab)}
        className="relative z-20 flex min-h-0 flex-1 flex-col"
      >
        <Tabs.List className="flex shrink-0 flex-wrap gap-1 border-b border-ink/20 bg-house px-4">
          <Tabs.Trigger value="market" className={tabTriggerClass}>
            {m.market_stall()}
          </Tabs.Trigger>
          {contracts && (
            <Tabs.Trigger value="contracts" className={tabTriggerClass}>
              {m.market_contracts()}
            </Tabs.Trigger>
          )}
        </Tabs.List>
        <Tabs.Content value="market" className="flex min-h-0 flex-1 flex-col">
          <DemandStrip world={world} onTip={setTip} />
          <div className={`grid shrink-0 ${MARKET_COLS} items-end gap-x-3 border-b border-ink/20 px-1 pb-0.5`}>
            <Label>{m.market_col_produce()}</Label>
            <div className="text-right">
              <Label>{m.market_col_quantity()}</Label>
            </div>
            <div className="text-right">
              <Label>{m.market_col_price()}</Label>
            </div>
            <div className="text-right">
              <Label>{m.market_col_money()}</Label>
            </div>
          </div>
          {quote.rows.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-ink/50">{m.market_no_produce()}</div>
          ) : (
            <div className="scroll-pane min-h-0 flex-1">
              {quote.rows.map(row => (
                <MarketRow key={`${row.good}:${row.variety}:${row.infused ? 'i' : 'p'}`} row={row} onTip={setTip} />
              ))}
            </div>
          )}
          <div className="shrink-0 border-t border-ink/20 pt-2">
            <Btn
              data-sell-all=""
              className="w-full"
              disabled={quote.paid === 0}
              onClick={() => {
                world.sellAll()
                onClose()
              }}
            >
              <span className="flex items-center justify-between gap-3">
                {m.market_sell_all_label()}
                <span className="inline-flex items-center gap-3">
                  {quote.paid !== quote.clean && (
                    <span className="text-ink/55">
                      <Coin n={quote.clean} />
                    </span>
                  )}
                  <Coin n={quote.paid} />
                </span>
              </span>
            </Btn>
          </div>
        </Tabs.Content>
        {contracts && (
          <Tabs.Content value="contracts" className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-2 px-1 pb-2 pt-1 text-sm">
              <span className="text-ink/60">{m.market_reputation()}</span>
              <span className="w-24">
                <Bar value={world.contracts.rep / REP_MAX} color="bg-tier-2" />
              </span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2">
            <div
              className={`grid grid-cols-2 gap-2 overflow-hidden border-r border-ink/20 ${slots >= 7 ? 'grid-rows-4' : 'grid-rows-3'}`}
            >
              {board.map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  atCap={atCap}
                  cap={cap}
                  onTip={setTip}
                  onAccept={() => world.acceptContract(offer.id)}
                />
              ))}
            </div>
            <ContractsRight world={world} nowDay={nowDay} onTip={setTip} />
            </div>
          </Tabs.Content>
        )}
      </Tabs.Root>
    </Overlay>
  )
}

function offerHover(offer: ContractOffer, atCap: boolean, cap: number): Tip {
  const company = COMPANIES[offer.company].name
  const days = offer.days === 1 ? m.market_one_day() : m.market_days({ n: offer.days })
  const deliver = offer.lines
    .map(line => m.market_deliver_plain({ amount: line.amount, good: demandName(line) }))
    .join('\n')
  const cash = offer.prize.kind === 'cash'
  const why = atCap ? (cap === 4 ? m.market_cap_four() : m.market_cap_three()) : undefined
  return {
    title: company,
    description: (
      <>
        {`${m.market_offer_head({ difficulty: offer.difficulty, max: 40, company })}\n${deliver}\n${m.market_duration_earn({ days })}`}
        {cash ? <Coin n={offer.reward} /> : prizeName(offer.prize)}
        {cash ? m.market_when_markup({ markup: Math.round(offer.markup * 100) }) : m.market_when_completed()}
        {`\n${m.market_cancel_cost()}`}
        <Coin n={offer.penalty} />
        {m.almanac_period()}
        {!atCap ? `\n${m.market_click_accept()}` : null}
        {why !== undefined ? <span className="mt-2 block font-bold text-roof">{why}</span> : null}
      </>
    ),
  }
}

export function OfferCard({
  offer,
  atCap,
  cap,
  onTip,
  onAccept,
}: {
  offer: ContractOffer
  atCap: boolean
  cap: number
  onTip: (tip: Tip) => void
  onAccept: () => void
}) {
  const grey = atCap
  const body = (
    <>
      <HeaderRow offer={offer} />
      {offer.lines.map((line, i) => (
        <AmountRow key={i} demand={line} count={line.amount} />
      ))}
      <div className="text-sm">{offer.days === 1 ? m.market_one_day() : m.market_days({ n: offer.days })}</div>
      <div>
        {offer.prize.kind === 'cash' ? <Coin n={offer.reward} /> : <PrizeChip prize={offer.prize} />}
      </div>
    </>
  )
  const enter = () => onTip(offerHover(offer, atCap, cap))
  const leave = () => onTip(undefined)
  return (
    <button
      type="button"
      className={`bg-ink/6 px-3 py-2 flex flex-col gap-1 text-left ${
        grey ? 'text-ink/35' : 'cursor-pointer hover:bg-ink/12 active:bg-ink/20'
      }`}
      aria-disabled={grey || undefined}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onClick={() => {
        if (grey) return
        onAccept()
      }}
    >
      {body}
    </button>
  )
}

export function prizeName(prize: Prize): string {
  if (prize.kind === 'cash') return m.market_cash()
  if (prize.kind === 'tree-seed') return m.market_tree_seed({ tree: TREE_NAME[prize.tree]() })
  if (prize.kind === 'seeds') return m.market_crop_seeds({ crop: cropName(prize.crop) })
  if (prize.kind === 'fertilizer') return m.market_prize_fertilizer()
  if (prize.kind === 'freezer') return m.names_sku_buy_freezer_large()
  if (prize.kind === 'expansion-slot') return m.market_expansion_permit()
  if (prize.kind === 'skill-points') return prize.n === 1 ? m.market_skill_point() : m.market_skill_points({ n: prize.n })
  return prize.tool === 'rotary-shovel' ? m.names_shovel_rotary_shovel() : m.names_pickaxe_diamond_pickaxe()
}

function prizeItem(prize: Prize): Item | undefined {
  if (prize.kind === 'tree-seed') return { kind: 'tree-seed', tree: prize.tree, variety: 'base', quality: 0 }
  if (prize.kind === 'seeds') return { kind: 'seeds', crop: prize.crop, variety: 'base', quality: 0, count: prize.count }
  if (prize.kind === 'fertilizer') {
    return { kind: 'fertilizer', liters: FERT_BAG_LITERS, capacityLiters: FERT_BAG_LITERS }
  }
  if (prize.kind === 'tool') {
    return prize.tool === 'rotary-shovel' ? makeShovel('rotary-shovel') : makePickaxe('diamond-pickaxe')
  }
  return undefined
}

type FlatPrize = 'expansion-slot' | 'skill-points' | 'freezer'

const PRIZE_ART: { readonly [K in FlatPrize]: string } = {
  'expansion-slot': EXPAND_LAND,
  'skill-points': SKILL_POINT,
  freezer: skuInner('buy-freezer-large'),
}

function flat(prize: Prize): prize is Prize & { kind: FlatPrize } {
  return prize.kind === 'expansion-slot' || prize.kind === 'skill-points' || prize.kind === 'freezer'
}

export function PrizeChip({ prize }: { prize: Prize }) {
  if (prize.kind === 'cash') return null
  const item = prizeItem(prize)
  return (
    <span className="flex items-center gap-1 text-ripe">
      {item !== undefined ? (
        <ItemFace item={item} />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0"
          dangerouslySetInnerHTML={{ __html: flat(prize) ? PRIZE_ART[prize.kind] : '' }}
        />
      )}
      <span>{prizeName(prize)}</span>
    </span>
  )
}

const TIER_DOT: { readonly [K in Stars]: string } = {
  1: 'bg-tier-1',
  2: 'bg-tier-2',
  3: 'bg-tier-3',
  4: 'bg-tier-4',
}

export function Difficulty({ stars }: { stars: Stars }) {
  return (
    <span className="flex shrink-0 items-center gap-1" aria-label={m.market_difficulty({ n: stars })}>
      {Array.from({ length: stars }, (_, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${TIER_DOT[stars]}`} />
      ))}
    </span>
  )
}

function HeaderRow({ offer }: { offer: { company: ContractOffer['company']; stars: ContractOffer['stars'] } }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0"
          dangerouslySetInnerHTML={{ __html: COMPANY[offer.company] }}
        />
        <span className="text-sm font-semibold">{COMPANIES[offer.company].name}</span>
      </div>
      <Difficulty stars={offer.stars} />
    </div>
  )
}

function AmountRow({ demand, count }: { demand: Demand; count: number }) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold">
      {demandFace(demand, count)}
      <span className="truncate">{demandName(demand)}</span>
    </div>
  )
}

function demandName(demand: Demand): string {
  if (demand.kind === 'group') return demand.group === 'jam' ? m.market_any_jam() : m.market_any_spirit()
  return stallName(demandGood(demand))
}

function AnyJamFace({ count }: { count: number }) {
  const stage = useCycle(JAM_CROPS.length)
  return <ItemFace item={{ kind: 'jam', crop: JAM_CROPS[stage], variety: 'base', quality: 0, count, unitSale: 1, infused: false }} />
}

function demandFace(demand: Demand, count: number) {
  const face =
    demand.kind === 'group' && demand.group === 'jam' ? (
      <AnyJamFace count={count} />
    ) : (
      <ItemFace item={demandItem(demand, count)} />
    )
  return face
}

export function demandItem(demand: Demand, count: number): Item {
  if (demand.kind === 'group' && demand.group === 'spirit') {
    return { kind: 'spirit', spirit: 'vodka', variety: 'base', quality: 0, count, unitSale: 1, infused: false }
  }
  if (demand.kind === 'plain') {
    if (demand.good === 'sugar') return { kind: 'sugar', liters: count, capacityLiters: count, unitSale: SUGAR_MILL, quality: 0 }
    if (demand.good === 'flour' || demand.good === 'extract' || demand.good === 'bread') {
      return { kind: demand.good, quality: 0, count, unitSale: 1 }
    }
    if (demand.good === 'oil') {
      return { kind: 'oil', quality: 0, count, unitSale: 1, infused: false }
    }
    if (demand.good === 'wine' || demand.good === 'cider') {
      return { kind: 'cask', cask: demand.good, variety: 'base', quality: 0, count, unitSale: 1, infused: false }
    }
    if (demand.good === 'vodka' || demand.good === 'beer' || demand.good === 'brandy' || demand.good === 'mixed') {
      return { kind: 'spirit', spirit: demand.good, variety: 'base', quality: 0, count, unitSale: 1, infused: false }
    }
    if (demand.good.startsWith('jam-')) {
      return { kind: 'jam', crop: demand.good.slice(4) as JamCrop, variety: 'base', quality: 0, count, unitSale: 1, infused: false }
    }
    if (!isCropStall(demand.good)) throw new Error('demandItem')
    return {
      kind: 'fruit',
      crop: demand.good,
      variety: 'base',
      quality: 0,
      cut: false,
      count,
      unitSale: CROPS[demand.good].sale,
      freshness: 1,
    }
  }
  throw new Error('demandItem')
}

function ContractsRight({
  world,
  nowDay,
  onTip,
}: {
  world: World
  nowDay: number
  onTip: (tip: Tip) => void
}) {
  const empty = world.contracts.active.length === 0 && world.contracts.history.length === 0
  if (empty) {
    return <div className="flex items-center justify-center text-sm text-ink/50">{m.market_no_running()}</div>
  }
  return (
    <div className="flex min-h-0 flex-col overflow-y-auto scroll-pane">
      <div className="flex flex-col gap-2">
        {world.contracts.active.map(a => (
          <ActiveCard key={a.offer.id} active={a} nowDay={nowDay} world={world} onTip={onTip} />
        ))}
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {world.contracts.history.map(e => (
          <HistoryLine key={`${e.id}-${e.day}-${e.outcome.kind}`} entry={e} />
        ))}
      </div>
    </div>
  )
}

function ActiveCard({
  active,
  nowDay,
  world,
  onTip,
}: {
  active: Active
  nowDay: number
  world: World
  onTip: (tip: Tip) => void
}) {
  const [armed, setArmed] = useState(false)
  const need = needOf(active)
  const filled = filledOf(active)
  const left = active.dueDay - nowDay
  const fee = cancelFee(active, nowDay)
  return (
    <div className="relative bg-ink/6 px-3 py-2 flex flex-col gap-1">
      <button
        type="button"
        aria-label={m.market_cancel()}
        className={`absolute top-1 right-1 cursor-pointer text-lg ${
          armed ? 'bg-ink text-house' : 'text-ink/60 hover:bg-dirt hover:text-house'
        }`}
        onPointerEnter={() =>
          onTip({
            title: COMPANIES[active.offer.company].name,
            description: (
              <>
                {m.market_cancelling()}
                <Coin n={fee} />
                {m.market_penalty()}
              </>
            ),
          })
        }
        onPointerLeave={() => onTip(undefined)}
        onClick={() => {
          if (!armed) {
            setArmed(true)
            return
          }
          world.cancelContract(active.offer.id)
        }}
      >
        ×
      </button>
      <div className="flex items-start gap-2 pr-6">
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <HeaderRow offer={active.offer} />
          {active.bins.map((bin, i) => (
            <AmountRow key={i} demand={bin.demand} count={bin.demand.amount - bin.filled} />
          ))}
        </div>
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            className="cursor-pointer px-1 text-sm leading-none"
            onClick={() => world.reorderContract(active.offer.id, -1)}
          >
            ▲
          </button>
          <button
            type="button"
            className="cursor-pointer px-1 text-sm leading-none"
            onClick={() => world.reorderContract(active.offer.id, 1)}
          >
            ▼
          </button>
        </div>
      </div>
      <div className="text-sm tabular-nums">{m.market_days_left({ n: left.toFixed(1) })}</div>
      <div>
        {active.offer.prize.kind === 'cash' ? <Coin n={active.offer.reward} /> : <PrizeChip prize={active.offer.prize} />}
      </div>
      <Bar value={filled / need} color="bg-leaf" track="bg-ink/25" />
    </div>
  )
}

export function OutcomePay({ entry }: { entry: HistoryEntry }) {
  if (entry.outcome.kind === 'done' && entry.outcome.prize.kind !== 'cash') {
    return <PrizeChip prize={entry.outcome.prize} />
  }
  const n =
    entry.outcome.kind === 'done'
      ? entry.outcome.paid
      : entry.outcome.kind === 'missed'
        ? entry.outcome.penalty
        : entry.outcome.fee
  return <Coin n={n} />
}

export function RepChange({ rep }: { rep: number }) {
  if (rep === 0) return null
  const n = Math.round(Math.abs(rep) * 10) / 10
  return (
    <span className={rep > 0 ? 'text-tier-2' : 'text-roof'}>
      {m.market_rep_change({ sign: rep > 0 ? '+' : '−', n: Number.isInteger(n) ? n : n.toFixed(1) })}
    </span>
  )
}

function HistoryLine({ entry }: { entry: HistoryEntry }) {
  const outcome =
    entry.outcome.kind === 'done' ? m.recap_completed() : entry.outcome.kind === 'missed' ? m.recap_missed() : m.recap_cancelled()
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{COMPANIES[entry.company].name}</span>
      <Difficulty stars={entry.stars} />
      <span>{entry.day}</span>
      <span>{outcome}</span>
      <RepChange rep={entry.rep} />
      <span className="ml-auto">
        <OutcomePay entry={entry} />
      </span>
    </div>
  )
}

const DEMAND_COLS = 6

function demandArrow(shown: number, cap: number, sat: number, size: string) {
  const tint = priceTint(shown, cap, sat)
  const hex = tint === 'water' ? '#3d7ea6' : tint === 'tier-3' ? '#e07b18' : '#e23b2e'
  const inner = UI_PRICE_ARROW.replace(/fill="#3d7ea6"/g, `fill="${hex}"`)
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={size}
      style={{ transform: `rotate(${arrowDeg(shown)}deg)` }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}

function DemandStrip({ world, onTip }: { world: World; onTip: (tip: Tip) => void }) {
  const chips = world.marketDemand()
  return (
    <div className="mb-2 shrink-0 border-b border-ink/20 pb-2">
      <Label>{m.market_col_price()}</Label>
      {chips.length === 0 ? (
        <div className="flex min-h-20 items-center gap-3 bg-ink/8 px-3 py-2">
          {demandArrow(1, SAT_MAX_CUT, 0, 'h-8 w-8 shrink-0')}
          <div className="text-sm text-ink/55">{m.market_demand_empty()}</div>
        </div>
      ) : (
        <div className="grid w-fit grid-cols-6 gap-2">
          {chips.map(chip => (
            <DemandChipCell key={chip.good} chip={chip} onTip={onTip} />
          ))}
        </div>
      )}
    </div>
  )
}

function DemandChipCell({ chip, onTip }: { chip: DemandChip; onTip: (tip: Tip) => void }) {
  const name = stallName(chip.good)
  const floor = m.market_floor({ n: SAT_MAX_CUT * 100, days: nd(chip.recoverDays) })
  return (
    <div
      className="flex h-20 w-20 cursor-default flex-col items-center justify-center gap-1 bg-ink/15 px-1 py-1 hover:bg-ink/25"
      onPointerEnter={() =>
        onTip({
          title: name,
          description: `${Math.round(chip.shown * 100)}%\n${floor}`,
        })
      }
      onPointerLeave={() => onTip(undefined)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8" dangerouslySetInnerHTML={{ __html: faceGfx(boxFace(chip.good, 'base', false, 1)) }} />
      {demandArrow(chip.shown, SAT_MAX_CUT, chip.sat, 'h-5 w-5')}
    </div>
  )
}

function arrowDeg(shown: number): number {
  if (shown >= 1) return -90 * Math.min(1, (shown - 1) / 0.4)
  return 90 * Math.min(1, Math.max(0, (1 - shown) / 0.5))
}

function priceTint(shown: number, cap: number, sat: number): 'water' | 'tier-3' | 'tier-4' {
  if (shown > 1) return 'water'
  return cutOf(sat, cap) < cap / 2 ? 'tier-3' : 'tier-4'
}

function PriceCell({ shown, cap, sat }: { shown: number; cap: number; sat: number }) {
  const tint = priceTint(shown, cap, sat)
  const hex = tint === 'water' ? '#3d7ea6' : tint === 'tier-3' ? '#e07b18' : '#e23b2e'
  const inner = UI_PRICE_ARROW.replace(/fill="#3d7ea6"/g, `fill="${hex}"`)
  const color = tint === 'water' ? 'text-water' : tint === 'tier-3' ? 'text-tier-3' : 'text-tier-4'
  return (
    <div className={`flex items-center justify-end gap-2 ${color}`}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7 shrink-0"
        style={{ transform: `rotate(${arrowDeg(shown)}deg)` }}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
      <span className="w-10 text-right text-sm tabular-nums">{Math.round(shown * 100)}%</span>
    </div>
  )
}

function MarketRow({
  row,
  onTip,
}: {
  row: MarketQuote
  onTip: (tip: Tip) => void
}) {
  const floor = m.market_floor({ n: row.cap * 100, days: nd(row.recoverDays) })
  const name = stallRowName(row)
  return (
    <div
      data-stall-box={row.good}
      className={`grid ${MARKET_COLS} items-center gap-x-3 border-b border-ink/10 px-1 py-2 hover:bg-ink/6`}
      onPointerEnter={() =>
        onTip({
          title: name,
          description: floor,
        })
      }
      onPointerLeave={() => onTip(undefined)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ItemFace item={boxFace(row.good, row.variety, row.infused, row.count)} />
        <span className="truncate text-base font-semibold">{name}</span>
      </div>
      <span className="text-right text-base tabular-nums">{row.count}</span>
      <PriceCell shown={row.mul} cap={row.cap} sat={row.sat} />
      <span className="justify-self-end text-base tabular-nums">
        <Coin n={row.paid} />
      </span>
    </div>
  )
}

function nd(days: number): string {
  const n = Math.round(days * 10) / 10
  return m.market_recover({ n: Number.isInteger(n) ? n : n.toFixed(1) })
}

function stallName(id: StallGoodId): string {
  return stallRowName({ good: id, variety: 'base', infused: false } as MarketQuote)
}

function stallRowName(row: Pick<MarketQuote, 'good' | 'variety' | 'infused'>): string {
  const id = row.good
  if (id === 'sugar') return m.names_item_sugar()
  if (id === 'wine' || id === 'cider') return caskName(id, row.variety)
  if (id === 'oil') return m.names_item_oil()
  if (id === 'flour') return m.names_item_flour()
  if (id === 'extract') return m.names_item_extract()
  if (id === 'bread') return m.names_item_bread()
  if (id === 'vodka' || id === 'beer' || id === 'brandy' || id === 'mixed') return SPIRIT_NAME[id]()
  if (id.startsWith('jam-')) {
    const crop = id.slice(4) as JamCrop
    return jamJarName(crop, row.variety)
  }
  if (!isCropStall(id)) throw new Error(`stallName: ${id}`)
  return cropVariety(id, row.variety)
}

function boxFace(id: StallGoodId, variety: MarketQuote['variety'], infused: boolean, n: number): Item {
  if (id === 'sugar') return { kind: 'sugar', liters: n, capacityLiters: n, unitSale: SUGAR_MILL, quality: 0 }
  if (id === 'vodka' || id === 'beer' || id === 'brandy' || id === 'mixed') {
    return { kind: 'spirit', spirit: id, variety, quality: 0, count: n, unitSale: 1, infused }
  }
  if (id === 'wine' || id === 'cider') return { kind: 'cask', cask: id, variety, quality: 0, count: n, unitSale: 1, infused }
  if (id.startsWith('jam-')) {
    const crop = id.slice(4) as JamCrop
    return { kind: 'jam', crop, variety, quality: 0, count: n, unitSale: 1, infused }
  }
  if (id === 'flour' || id === 'extract' || id === 'bread') return { kind: id, quality: 0, count: n, unitSale: 1 }
  if (id === 'oil') return { kind: 'oil', quality: 0, count: n, unitSale: 1, infused }
  if (!isCropStall(id)) throw new Error(`boxFace: ${id}`)
  return { kind: 'fruit', crop: id, variety, quality: 0, count: n, unitSale: CROPS[id].sale, freshness: 1, cut: false }
}
