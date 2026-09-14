import { m } from '../../../paraglide/messages.js'
import { useState, type ReactNode } from 'react'
import { COMPANIES } from '../../defs/companies.ts'
import { CROPS, cropVariety } from '../../defs/crops.ts'
import { FERT_BAG_LITERS, SUGAR_MILL } from '../../defs/items.ts'
import { JAM_CROPS, type JamCrop, type StallGoodId } from '../../sim/ids.ts'
import { makePickaxe, makeShovel, type Item } from '../../sim/item.ts'
import { DAY_SECONDS } from '../../sim/clock.ts'
import { cancelFee, demandGood, filledOf, needOf, REP_MAX, rollBoard } from '../../sim/feature-contracts/market.ts'
import type { Active, ContractOffer, Demand, HistoryEntry, Outcome, Prize, Stars } from '../../sim/feature-contracts/market.h.ts'
import { isCropStall, stallGoodName } from '../../sim/stall.ts'
import type { World } from '../../sim/world.ts'
import { COMPANY, EXPAND_LAND, SKILL_POINT, skuInner, STAT_REPUTATION, symHref, UI_COIN } from '../../view/svgs.ts'
import { CalloutHover } from '../callout-hover.tsx'
import { Bar, Coin, Label, Overlay } from '../frame.tsx'
import { DashFace, ItemFace } from '../held.tsx'
import { useCycle } from '../cycle.ts'

type Tip = { title: string; description: ReactNode } | undefined

export function Contracts({ world, onClose }: { world: World; onClose: () => void }) {
  const [tip, setTip] = useState<Tip>(undefined)
  const slots = world.contractSlots()
  const cap = world.contractCap()
  const board = rollBoard(world.rng, world.clock.day, slots, world.contracts.repDay).filter(o => !world.contracts.takenToday.includes(o.id))
  const nowDay = world.clock.day - 1 + world.clock.t / DAY_SECONDS
  const atCap = world.contracts.active.length >= cap
  return (
    <Overlay
      title={m.names_role_contracts()}
      onClose={onClose}
      className="h-[min(732px,calc(100vh-6rem))] w-[72rem]"
      aside={tip !== undefined ? <CalloutHover title={tip.title} description={tip.description} /> : undefined}
    >
      <div className="relative z-20 flex min-h-0 flex-1 flex-col">
        <div className="my-3 flex w-56 shrink-0 items-center gap-2 bg-ink/6 px-2 py-1.5">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" dangerouslySetInnerHTML={{ __html: STAT_REPUTATION }} />
          <span className="min-w-0 truncate text-sm font-semibold">{m.market_reputation()}</span>
          <span className="ml-auto w-16 shrink-0">
            <Bar value={world.contracts.rep / REP_MAX} color="bg-ripe" />
          </span>
        </div>
        <div className="grid shrink-0 grid-cols-2">
          <div className="pr-4">
            <Label>{m.market_available({ n: board.length })}</Label>
          </div>
          <div className="pl-4">
            <Label>{m.market_taken({ n: world.contracts.active.length, max: cap })}</Label>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2">
          <div className="scroll-pane min-h-0 overflow-y-auto border-r border-ink/20 pr-4">
            {board.length === 0 ? (
              <div className="px-1 text-sm text-ink/55">{m.market_no_available()}</div>
            ) : (
              <div data-contract-board="" className="grid auto-rows-min grid-cols-2 gap-2">
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
            )}
          </div>
          <ContractsRight world={world} nowDay={nowDay} onTip={setTip} />
        </div>
      </div>
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
  const enter = () => onTip(offerHover(offer, atCap, cap))
  const leave = () => onTip(undefined)
  return (
    <button
      type="button"
      className={`flex flex-col gap-1.5 p-3 text-left ${
        grey
          ? 'bg-ink/6 text-ink/35'
          : 'cursor-pointer border border-[#444] bg-parch hover:bg-ink/6 active:bg-ink/12'
      }`}
      aria-disabled={grey || undefined}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onClick={() => {
        if (grey) return
        onAccept()
      }}
    >
      <HeaderRow offer={offer} />
      {offer.lines.map((line, i) => (
        <AmountRow key={i} demand={line} count={line.amount} />
      ))}
      <CardFoot>
        <div className="text-sm tabular-nums text-ink/60">
          {offer.days === 1 ? m.market_deadline_one() : m.market_deadline({ n: offer.days })}
        </div>
        <Rule />
        <Reward prize={offer.prize} reward={offer.reward} />
      </CardFoot>
    </button>
  )
}

function CardFoot({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex w-full flex-col gap-1.5 pt-1.5">{children}</div>
}

function Rule() {
  return <div className="border-t border-ink/15" />
}

export function prizeName(prize: Prize): string {
  if (prize.kind === 'cash') return m.market_cash()
  if (prize.kind === 'tree-seed') return m.market_tree_seed({ tree: cropVariety(prize.tree, prize.variety) })
  if (prize.kind === 'seeds') return m.market_crop_seeds({ crop: cropVariety(prize.crop, prize.variety) })
  if (prize.kind === 'fertilizer') return m.market_prize_fertilizer()
  if (prize.kind === 'freezer') return m.names_sku_buy_freezer_large()
  if (prize.kind === 'expansion-slot') return m.market_expansion_permit()
  if (prize.kind === 'skill-points') return prize.n === 1 ? m.market_skill_point() : m.market_skill_points({ n: prize.n })
  return prize.tool === 'rotary-shovel' ? m.names_shovel_rotary_shovel() : m.names_pickaxe_diamond_pickaxe()
}

function prizeItem(prize: Prize): Item | undefined {
  if (prize.kind === 'tree-seed') return { kind: 'tree-seed', tree: prize.tree, variety: prize.variety, quality: 0 }
  if (prize.kind === 'seeds') return { kind: 'seeds', crop: prize.crop, variety: prize.variety, quality: 0, count: prize.count }
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

function PrizeFace({ prize }: { prize: Prize }) {
  const item = prizeItem(prize)
  return item !== undefined ? (
    <DashFace item={item} />
  ) : (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0"
      dangerouslySetInnerHTML={{ __html: flat(prize) ? PRIZE_ART[prize.kind] : '' }}
    />
  )
}

export function PrizeChip({ prize }: { prize: Prize }) {
  if (prize.kind === 'cash') return null
  return (
    <span className="flex min-w-0 items-center gap-2">
      <PrizeFace prize={prize} />
      <span className="truncate">{prizeName(prize)}</span>
    </span>
  )
}

function CoinFace() {
  return (
    <svg viewBox="0 0 12 12" className="h-6 w-6 shrink-0">
      <use href={symHref(UI_COIN)} />
    </svg>
  )
}

function Reward({ prize, reward }: { prize: Prize; reward: number }) {
  if (prize.kind !== 'cash') return <PrizeChip prize={prize} />
  return (
    <span className="flex items-center gap-2 tabular-nums">
      <CoinFace />
      <span>{Math.round(reward)}</span>
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

function HeaderRow({
  offer,
  actions,
}: {
  offer: { company: ContractOffer['company']; stars: ContractOffer['stars'] }
  actions?: ReactNode
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" dangerouslySetInnerHTML={{ __html: COMPANY[offer.company] }} />
        <span className="truncate text-sm font-semibold">{COMPANIES[offer.company].name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Difficulty stars={offer.stars} />
        {actions}
      </div>
    </div>
  )
}

function AmountRow({ demand, count }: { demand: Demand; count: number }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 text-base font-semibold">
      {demandFace(demand, count)}
      <span className="truncate">{demandName(demand)}</span>
    </div>
  )
}

function demandName(demand: Demand): string {
  if (demand.kind === 'group') return demand.group === 'jam' ? m.market_any_jam() : m.market_any_spirit()
  return stallGoodName(demandGood(demand), 'base')
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

function anyJamAsJar(demand: Demand): Demand {
  if (demand.kind !== 'group' || demand.group !== 'jam') return demand
  return { kind: 'plain', good: `jam-${JAM_CROPS[0]}` as StallGoodId, amount: demand.amount }
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
  return (
    <div className="scroll-pane flex min-h-0 flex-col overflow-y-auto pl-4">
      {world.contracts.active.length === 0 ? (
        <div className="px-1 text-sm text-ink/55">{m.market_no_running()}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {world.contracts.active.map(a => (
            <ActiveCard key={a.offer.id} active={a} nowDay={nowDay} world={world} onTip={onTip} />
          ))}
        </div>
      )}
      {world.contracts.history.length > 0 && (
        <>
          <Label>{m.market_finished()}</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {world.contracts.history.map(e => (
              <HistoryChip key={`${e.id}-${e.day}-${e.outcome.kind}`} entry={e} onTip={onTip} />
            ))}
          </div>
        </>
      )}
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
  const need = needOf(active)
  const filled = filledOf(active)
  const left = active.dueDay - nowDay
  const fee = cancelFee(active, nowDay)
  return (
    <div className="flex flex-col gap-1.5 bg-ink/6 p-3">
      <HeaderRow
        offer={active.offer}
        actions={
          <>
            <div className="flex flex-col">
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
            <button
              type="button"
              title={m.market_cancel()}
              aria-label={m.market_cancel()}
              className="cursor-pointer px-2 py-0.5 text-lg leading-none text-ink/60 hover:bg-dirt hover:text-house"
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
              onClick={() => world.cancelContract(active.offer.id)}
            >
              ×
            </button>
          </>
        }
      />
      {active.bins.map((bin, i) => (
        <AmountRow key={i} demand={bin.demand} count={bin.demand.amount - bin.filled} />
      ))}
      <CardFoot>
        <div className="text-sm tabular-nums text-ink/60">{m.market_deadline({ n: left.toFixed(1) })}</div>
        <Bar value={filled / need} color="bg-leaf" track="bg-ink/25" />
        <Rule />
        <Reward prize={active.offer.prize} reward={active.offer.reward} />
      </CardFoot>
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

const OUTCOME_TINT: { readonly [K in Outcome['kind']]: string } = {
  done: 'bg-leaf/30',
  missed: 'bg-roof/30',
  cancelled: 'bg-roof/30',
}

function RepAmount({ rep }: { rep: number }) {
  if (rep === 0) return null
  const n = Math.round(Math.abs(rep) * 10) / 10
  return (
    <span className="flex shrink-0 items-center gap-1 tabular-nums">
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" dangerouslySetInnerHTML={{ __html: STAT_REPUTATION }} />
      <span>{`${rep > 0 ? '+' : '−'}${Number.isInteger(n) ? n : n.toFixed(1)}`}</span>
    </span>
  )
}

function HistoryChip({ entry, onTip }: { entry: HistoryEntry; onTip: (tip: Tip) => void }) {
  const outcome =
    entry.outcome.kind === 'done' ? m.recap_completed() : entry.outcome.kind === 'missed' ? m.recap_missed() : m.recap_cancelled()
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 text-sm ${OUTCOME_TINT[entry.outcome.kind]}`}
      onPointerEnter={() =>
        onTip({
          title: COMPANIES[entry.company].name,
          description: `${outcome}\n${m.hud_day({ day: entry.day })}\n${m.market_difficulty({ n: entry.stars })}`,
        })
      }
      onPointerLeave={() => onTip(undefined)}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" dangerouslySetInnerHTML={{ __html: COMPANY[entry.company] }} />
      {entry.lines.map((line, i) => (
        <DashFace key={i} item={demandItem(anyJamAsJar(line), line.amount)} />
      ))}
      <span className="ml-auto flex min-w-0 items-center gap-2">
        <RepAmount rep={entry.rep} />
        <OutcomePay entry={entry} />
      </span>
    </div>
  )
}
