import { useEffect, useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { COMPANIES } from '../defs/companies.ts'
import { CROPS } from '../defs/crops.ts'
import type { Rarity } from '../defs/rarity.ts'
import { TREE_NAME } from '../defs/trees.ts'
import { FERT_BAG_LITERS, SUGAR_MILL } from '../defs/items.ts'
import { JAM_CROPS, type JamCrop, type StallGoodId } from '../sim/ids.ts'
import { cropName, makePickaxe, makeShovel, SPIRIT_NAME, type Item } from '../sim/item.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import { cancelFee, demandGood, filledOf, needOf, REP_MAX, rollBoard, SAT_FLOOR } from '../sim/market.ts'
import type { Active, ContractOffer, Demand, HistoryEntry, MarketQuote, Prize, Stars } from '../sim/market.h.ts'
import { binCount, isCropStall } from '../sim/stall.ts'
import type { World } from '../sim/world.ts'
import { COMPANY, EXPAND_LAND, qualityPip, SKILL_POINT, skuInner, UI_MARKET_STALL } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Bar, Btn, Coin, Overlay, tabTriggerClass } from './frame.tsx'
import { ItemFace } from './held.tsx'

type Tip = { title: string; description: ReactNode } | undefined

export function Market({ world, guest, onClose }: { world: World; guest: boolean; onClose: () => void }) {
  const [tip, setTip] = useState<Tip>(undefined)
  const quote = world.marketQuote()
  const open = world.marketOpen()
  const phase = world.clock.phase()
  const closed =
    open
      ? undefined
      : phase === 'sunset'
        ? 'Stall closed until morning.'
        : 'Stall closed at twilight.'
  const contracts = world.done.has('unlock-contracts')
  const slots = world.contractSlots()
  const cap = world.contractCap()
  const board = rollBoard(world.rng, world.clock.day, slots, world.contracts.repDay).filter(o => !world.contracts.takenToday.includes(o.id))
  const nowDay = world.clock.day - 1 + world.clock.t / DAY_SECONDS
  const atCap = world.contracts.active.length >= cap
  return (
    <Overlay
      title="Market"
      onClose={onClose}
      className="max-h-[calc(100%-4rem)] w-[72rem]"
      aside={tip !== undefined ? <CalloutHover title={tip.title} description={tip.description} /> : undefined}
    >
      <Tabs.Root defaultValue="stall" className="relative z-20 flex min-h-0 flex-1 flex-col">
        <Tabs.List className="flex shrink-0 flex-wrap gap-1 border-b border-ink/20 bg-house px-4">
          <Tabs.Trigger value="stall" className={tabTriggerClass}>
            Stall
          </Tabs.Trigger>
          {contracts && (
            <Tabs.Trigger value="contracts" className={tabTriggerClass}>
              Contracts
            </Tabs.Trigger>
          )}
        </Tabs.List>
        <Tabs.Content value="stall">
          <svg viewBox="0 0 240 120" aria-hidden="true" className="h-24 w-full" dangerouslySetInnerHTML={{ __html: UI_MARKET_STALL }} />
          <div className="flex flex-col gap-2 pt-2">
            {quote.rows.length === 0 ? (
              <div className="py-4 text-sm text-ink/50">No produce.</div>
            ) : (
              quote.rows.map(row => <StallRow key={row.good} row={row} world={world} onTip={setTip} />)
            )}
            <Btn
              data-sell-all=""
              className="w-full"
              disabled={quote.paid === 0 || !open}
              onClick={() => {
                world.sellAll()
                onClose()
              }}
            >
              Sell all - <Coin n={quote.paid} />
              {quote.paid !== quote.clean && (
                <span className="text-ink/55">
                  {' '}
                  <Coin n={quote.clean} />
                </span>
              )}
            </Btn>
            {closed !== undefined && <div className="text-sm text-roof">{closed}</div>}
          </div>
        </Tabs.Content>
        {contracts && (
          <Tabs.Content value="contracts" className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-2 px-1 pb-2 pt-1 text-sm">
              <span className="text-ink/60">Reputation</span>
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
                  guest={guest}
                  atCap={atCap}
                  cap={cap}
                  onTip={setTip}
                  onAccept={() => world.acceptContract(offer.id)}
                />
              ))}
            </div>
            <ContractsRight world={world} guest={guest} nowDay={nowDay} onTip={setTip} />
            </div>
          </Tabs.Content>
        )}
      </Tabs.Root>
    </Overlay>
  )
}

const RARITY_NAME: { readonly [K in Rarity]: string } = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  heirloom: 'Heirloom',
}

function rarityClause(demand: Demand): string {
  if (demand.kind === 'plain' || (demand.kind === 'group' && demand.group === 'jam')) return ''
  if (demand.minRarity === 'common') return ''
  return ` at least rarity of ${RARITY_NAME[demand.minRarity]}`
}

function offerHover(offer: ContractOffer, guest: boolean, atCap: boolean, cap: number): Tip {
  const company = COMPANIES[offer.company].name
  const days = offer.days === 1 ? '1 day' : `${offer.days} days`
  const deliver = offer.lines
    .map(line => `Deliver ${line.amount} ${demandName(line)}${rarityClause(line)}.`)
    .join('\n')
  const cash = offer.prize.kind === 'cash'
  const why =
    !guest && atCap ? (cap === 4 ? 'Four contracts already running.' : 'Three contracts already running.') : undefined
  return {
    title: company,
    description: (
      <>
        {`${offer.difficulty}/40 difficulty contract for ${company}.\n${deliver}\nContract duration is ${days}, earn `}
        {cash ? <Coin n={offer.reward} /> : prizeName(offer.prize)}
        {cash ? ` when completed (${Math.round(offer.markup * 100)}% more than farmer's market).` : ' when completed.'}
        {'\nCancellation cost is '}
        <Coin n={offer.penalty} />
        {'.'}
        {!guest && !atCap ? '\nClick to accept offer' : null}
        {why !== undefined ? <span className="mt-2 block font-bold text-roof">{why}</span> : null}
      </>
    ),
  }
}

export function OfferCard({
  offer,
  guest,
  atCap,
  cap,
  onTip,
  onAccept,
}: {
  offer: ContractOffer
  guest: boolean
  atCap: boolean
  cap: number
  onTip: (tip: Tip) => void
  onAccept: () => void
}) {
  const grey = atCap && !guest
  const body = (
    <>
      <HeaderRow offer={offer} />
      {offer.lines.map((line, i) => (
        <AmountRow key={i} demand={line} count={line.amount} />
      ))}
      <div className="text-sm">{offer.days === 1 ? '1 day' : `${offer.days} days`}</div>
      <div>
        {offer.prize.kind === 'cash' ? <Coin n={offer.reward} /> : <PrizeChip prize={offer.prize} />}
      </div>
    </>
  )
  const enter = () => onTip(offerHover(offer, guest, atCap, cap))
  const leave = () => onTip(undefined)
  if (guest) {
    return (
      <div className="bg-ink/6 px-3 py-2 flex flex-col gap-1" onPointerEnter={enter} onPointerLeave={leave}>
        {body}
      </div>
    )
  }
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
  if (prize.kind === 'cash') return 'Cash'
  if (prize.kind === 'sapling') return `${TREE_NAME[prize.tree]} sapling`
  if (prize.kind === 'seeds') return `${cropName(prize.crop)} seeds`
  if (prize.kind === 'fertilizer') return 'Fertilizer'
  if (prize.kind === 'freezer') return 'Large freezer'
  if (prize.kind === 'expansion-slot') return 'Expansion permit'
  if (prize.kind === 'skill-points') return prize.n === 1 ? '1 skill point' : `${prize.n} skill points`
  return prize.tool === 'rotary-shovel' ? 'Rotary shovel' : 'Diamond pickaxe'
}

function prizeItem(prize: Prize): Item | undefined {
  if (prize.kind === 'sapling') return { kind: 'sapling', tree: prize.tree }
  if (prize.kind === 'seeds') return { kind: 'seeds', crop: prize.crop, rarity: 'common', count: prize.count }
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
    <span className="flex shrink-0 items-center gap-1" aria-label={`Difficulty ${stars}`}>
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
  if (demand.kind === 'group') return demand.group === 'jam' ? 'Any jam' : 'Any spirit'
  return stallName(demandGood(demand))
}

function AnyJamFace({ count }: { count: number }) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setStage(s => (s + 1) % JAM_CROPS.length), 800)
    return () => window.clearInterval(t)
  }, [])
  return <ItemFace item={{ kind: 'jam', crop: JAM_CROPS[stage], count, unitSale: 1 }} />
}

function demandFace(demand: Demand, count: number) {
  const face =
    demand.kind === 'group' && demand.group === 'jam' ? (
      <AnyJamFace count={count} />
    ) : (
      <ItemFace item={demandItem(demand, count)} />
    )
  if (demand.kind === 'plain' || (demand.kind === 'group' && demand.group === 'jam')) return face
  const pip = qualityPip(demand.minRarity)
  if (pip === undefined) return face
  return (
    <>
      {face}
      <svg viewBox="0 0 8 8" className="h-4 w-4 shrink-0" dangerouslySetInnerHTML={{ __html: pip }} />
    </>
  )
}

function demandItem(demand: Demand, count: number): Item {
  if (demand.kind === 'group' && demand.group === 'spirit') {
    return { kind: 'spirit', spirit: 'vodka', rarity: demand.minRarity, count, unitSale: 1 }
  }
  if (demand.kind === 'plain') {
    if (demand.good === 'sugar') return { kind: 'sugar', liters: count, capacityLiters: count, unitSale: SUGAR_MILL }
    if (demand.good === 'oil' || demand.good === 'flour' || demand.good === 'extract') {
      return { kind: demand.good, count, unitSale: 1 }
    }
    return { kind: 'jam', crop: demand.good.slice(4) as JamCrop, count, unitSale: 1 }
  }
  if (demand.kind === 'rated' && demand.good === 'wine') {
    return { kind: 'wine', rarity: demand.minRarity, count, unitSale: 1 }
  }
  if (demand.kind === 'rated' && (demand.good === 'vodka' || demand.good === 'beer' || demand.good === 'brandy' || demand.good === 'mixed')) {
    return { kind: 'spirit', spirit: demand.good, rarity: demand.minRarity, count, unitSale: 1 }
  }
  if (demand.kind !== 'rated' || !isCropStall(demand.good)) throw new Error('demandItem')
  return {
    kind: 'fruit',
    crop: demand.good,
    rarity: demand.minRarity,
    count,
    unitSale: CROPS[demand.good].sale,
    freshness: 1,
    bio: false,
  }
}

function ContractsRight({
  world,
  guest,
  nowDay,
  onTip,
}: {
  world: World
  guest: boolean
  nowDay: number
  onTip: (tip: Tip) => void
}) {
  const empty = world.contracts.active.length === 0 && world.contracts.history.length === 0
  if (empty) {
    return <div className="flex items-center justify-center text-sm text-ink/50">No contracts running.</div>
  }
  return (
    <div className="flex min-h-0 flex-col overflow-y-auto scroll-pane">
      <div className="flex flex-col gap-2">
        {world.contracts.active.map(a => (
          <ActiveCard key={a.offer.id} active={a} guest={guest} nowDay={nowDay} world={world} onTip={onTip} />
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
  guest,
  nowDay,
  world,
  onTip,
}: {
  active: Active
  guest: boolean
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
      {!guest && (
        <button
          type="button"
          aria-label="Cancel"
          className={`absolute top-1 right-1 cursor-pointer text-lg ${
            armed ? 'bg-ink text-house' : 'text-ink/60 hover:bg-dirt hover:text-house'
          }`}
          onPointerEnter={() =>
            onTip({
              title: COMPANIES[active.offer.company].name,
              description: (
                <>
                  Cancelling this offer will incur a <Coin n={fee} /> penalty.
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
      )}
      <div className="flex items-start gap-2 pr-6">
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <HeaderRow offer={active.offer} />
          {active.bins.map((bin, i) => (
            <AmountRow key={i} demand={bin.demand} count={bin.demand.amount - bin.filled} />
          ))}
        </div>
        {!guest && (
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
        )}
      </div>
      <div className="text-sm tabular-nums">{left.toFixed(1)} days left</div>
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

function HistoryLine({ entry }: { entry: HistoryEntry }) {
  const outcome =
    entry.outcome.kind === 'done' ? 'Completed' : entry.outcome.kind === 'missed' ? 'Missed' : 'Cancelled'
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{COMPANIES[entry.company].name}</span>
      <Difficulty stars={entry.stars} />
      <span>{entry.day}</span>
      <span>{outcome}</span>
      <span className="ml-auto">
        <OutcomePay entry={entry} />
      </span>
    </div>
  )
}

function StallRow({
  row,
  world,
  onTip,
}: {
  row: MarketQuote
  world: World
  onTip: (tip: Tip) => void
}) {
  return (
    <div
      data-stall-box={row.good}
      className="flex items-center gap-3 bg-ink/8 px-3 py-2 text-base font-semibold"
      onPointerEnter={() =>
        onTip({
          title: stallName(row.good),
          description: `Floor ${SAT_FLOOR[row.good] * 100}%. ${nd(row.recoverDays)} to clean.`,
        })
      }
      onPointerLeave={() => onTip(undefined)}
    >
      <ItemFace item={boxFace(row.good)} />
      <span>{binCount(world.stall[row.good])}</span>
      <div className="ml-auto flex items-center gap-3 text-sm tabular-nums">
        <span>{Math.round(row.mul * 100)}%</span>
        <span>{row.sat === 0 ? '—' : '↓'}</span>
        <span>{nd(row.recoverDays)}</span>
      </div>
    </div>
  )
}

function nd(days: number): string {
  const n = Math.round(days * 10) / 10
  return `${Number.isInteger(n) ? n : n.toFixed(1)}d`
}

function stallName(id: StallGoodId): string {
  if (id === 'sugar') return 'Sugar'
  if (id === 'wine') return 'Wine'
  if (id === 'oil') return 'Olive oil'
  if (id === 'flour') return 'Flour'
  if (id === 'extract') return 'Extract'
  if (id === 'vodka' || id === 'beer' || id === 'brandy' || id === 'mixed') return SPIRIT_NAME[id]
  if (id.startsWith('jam-')) {
    const crop = id.slice(4) as JamCrop
    return crop === 'tomato' ? 'Ketchup' : `${cropName(crop)} jam`
  }
  if (!isCropStall(id)) throw new Error(`stallName: ${id}`)
  return cropName(id)
}

function boxFace(id: StallGoodId): Item {
  if (id === 'sugar') return { kind: 'sugar', liters: 1, capacityLiters: 1, unitSale: SUGAR_MILL }
  if (id === 'vodka' || id === 'beer' || id === 'brandy' || id === 'mixed') {
    return { kind: 'spirit', spirit: id, rarity: 'common', count: 1, unitSale: 1 }
  }
  if (id === 'wine') return { kind: 'wine', rarity: 'common', count: 1, unitSale: 1 }
  if (id.startsWith('jam-')) {
    const crop = id.slice(4) as JamCrop
    return { kind: 'jam', crop, count: 1, unitSale: 1 }
  }
  if (id === 'oil' || id === 'flour' || id === 'extract') return { kind: id, count: 1, unitSale: 1 }
  if (!isCropStall(id)) throw new Error(`boxFace: ${id}`)
  return {
    kind: 'box',
    cap: 5,
    cargo: {
      kind: 'stack',
      goods: 'fruit',
      stack: { crop: id, rarity: 'common', count: 1, unitSale: CROPS[id].sale, freshness: 1, bio: true },
    },
  }
}
