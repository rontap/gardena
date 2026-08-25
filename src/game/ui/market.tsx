import { useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { COMPANIES } from '../defs/companies.ts'
import { CROPS } from '../defs/crops.ts'
import { SUGAR_MILL } from '../defs/items.ts'
import { type JamCrop, type StallGoodId } from '../sim/ids.ts'
import { cropName, SPIRIT_NAME, type Item } from '../sim/item.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import { cancelFee, filledOf, needOf, rollBoard, SAT_FLOOR } from '../sim/market.ts'
import type { Active, ContractOffer, Demand, HistoryEntry, MarketQuote } from '../sim/market.h.ts'
import { binCount, isCropStall } from '../sim/stall.ts'
import type { World } from '../sim/world.ts'
import { COMPANY, itemInner, qualityPip, UI_CONTRACT_STARS, UI_MARKET_STALL } from '../view/svgs.ts'
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
  const board = rollBoard(world.rng, world.clock.day, slots).filter(o => !world.contracts.takenToday.includes(o.id))
  const nowDay = world.clock.day - 1 + world.clock.t / DAY_SECONDS
  const atCap = world.contracts.active.length >= cap
  return (
    <Overlay
      title="Market"
      onClose={onClose}
      className="max-h-[calc(100%-4rem)] w-[52rem]"
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
          <Tabs.Content value="contracts" className="grid grid-cols-2 min-h-0 flex-1">
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
            <ContractsRight world={world} guest={guest} nowDay={nowDay} />
          </Tabs.Content>
        )}
      </Tabs.Root>
    </Overlay>
  )
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
  const why = cap === 4 ? 'Four contracts already running.' : 'Three contracts already running.'
  const grey = atCap && !guest
  const body = (
    <>
      <HeaderRow offer={offer} />
      {offer.lines.map((line, i) => (
        <AmountRow key={i} demand={line} markup={i === 0 ? offer.markup : undefined} />
      ))}
      <div className="flex items-center justify-between text-sm">
        <span>{offer.days} days</span>
        <Coin n={offer.reward} />
      </div>
    </>
  )
  if (guest) {
    return <div className="bg-ink/6 px-3 py-2 flex flex-col gap-1">{body}</div>
  }
  return (
    <button
      type="button"
      className={`bg-ink/6 px-3 py-2 flex flex-col gap-1 text-left ${grey ? 'text-ink/35' : 'cursor-pointer'}`}
      aria-disabled={grey || undefined}
      onPointerEnter={() => {
        if (grey) onTip({ title: COMPANIES[offer.company].name, description: <span className="mt-2 block font-bold text-roof">{why}</span> })
      }}
      onPointerLeave={() => onTip(undefined)}
      onClick={() => {
        if (grey) return
        onAccept()
      }}
    >
      {body}
    </button>
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
      <svg viewBox="0 0 36 8" className="h-4" dangerouslySetInnerHTML={{ __html: UI_CONTRACT_STARS[offer.stars] }} />
    </div>
  )
}

function AmountRow({ demand, markup }: { demand: Demand; markup?: number }) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold">
      <span>{demand.amount}</span>
      <span>×</span>
      {demandFace(demand)}
      {markup !== undefined && (
        <span className="ml-auto text-sm font-normal">{Math.round(markup * 100)}%</span>
      )}
    </div>
  )
}

function demandFace(demand: Demand) {
  const face =
    demand.kind === 'group' && demand.group === 'jam' ? (
      <span className="relative flex h-12 w-12 items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="h-10 w-10"
          dangerouslySetInnerHTML={{ __html: itemInner({ kind: 'jam-machine' }) }}
        />
      </span>
    ) : (
      <ItemFace item={demandItem(demand)} />
    )
  if (demand.kind === 'plain' || (demand.kind === 'group' && demand.group === 'jam')) return face
  if (demand.kind === 'rated' && isCropStall(demand.good)) return face
  const pip = qualityPip(demand.minRarity)
  if (pip === undefined) return face
  return (
    <>
      {face}
      <svg viewBox="0 0 8 8" className="h-2 w-2 shrink-0" dangerouslySetInnerHTML={{ __html: pip }} />
    </>
  )
}

function demandItem(demand: Demand): Item {
  if (demand.kind === 'group' && demand.group === 'spirit') {
    return { kind: 'spirit', spirit: 'vodka', rarity: demand.minRarity, count: 1, unitSale: 1 }
  }
  if (demand.kind === 'plain') {
    if (demand.good === 'sugar') return { kind: 'sugar', liters: 1, capacityLiters: 1, unitSale: SUGAR_MILL }
    if (demand.good === 'oil' || demand.good === 'flour' || demand.good === 'extract') {
      return { kind: demand.good, count: 1, unitSale: 1 }
    }
    return { kind: 'jam', crop: demand.good.slice(4) as JamCrop, count: 1, unitSale: 1 }
  }
  if (demand.kind === 'rated' && demand.good === 'wine') {
    return { kind: 'wine', rarity: demand.minRarity, count: 1, unitSale: 1 }
  }
  if (demand.kind === 'rated' && (demand.good === 'vodka' || demand.good === 'beer' || demand.good === 'brandy' || demand.good === 'mixed')) {
    return { kind: 'spirit', spirit: demand.good, rarity: demand.minRarity, count: 1, unitSale: 1 }
  }
  if (demand.kind !== 'rated' || !isCropStall(demand.good)) throw new Error('demandItem')
  return {
    kind: 'fruit',
    crop: demand.good,
    rarity: demand.minRarity,
    count: 1,
    unitSale: CROPS[demand.good].sale,
    freshness: 1,
    bio: false,
  }
}

function ContractsRight({ world, guest, nowDay }: { world: World; guest: boolean; nowDay: number }) {
  const empty = world.contracts.active.length === 0 && world.contracts.history.length === 0
  if (empty) {
    return <div className="flex items-center justify-center text-sm text-ink/50">No contracts running.</div>
  }
  return (
    <div className="flex min-h-0 flex-col overflow-y-auto scroll-pane">
      <div className="flex flex-col gap-2">
        {world.contracts.active.map(a => (
          <ActiveCard key={a.offer.id} active={a} guest={guest} nowDay={nowDay} world={world} />
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
}: {
  active: Active
  guest: boolean
  nowDay: number
  world: World
}) {
  const [armed, setArmed] = useState(false)
  const need = needOf(active)
  const filled = filledOf(active)
  const left = active.dueDay - nowDay
  const fee = cancelFee(active, nowDay)
  return (
    <div className="bg-ink/6 px-3 py-2 flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <HeaderRow offer={active.offer} />
          {active.bins.map((bin, i) => (
            <div key={i} className="flex items-center gap-2 text-base font-semibold">
              <span>{bin.demand.amount - bin.filled}</span>
              <span>×</span>
              {demandFace(bin.demand)}
            </div>
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
      <div className="flex items-center justify-between text-sm">
        <span className="tabular-nums">{left.toFixed(1)} days left</span>
        <Coin n={active.offer.reward} />
      </div>
      <Bar value={filled / need} color="bg-leaf" track="bg-ink/25" />
      {!guest && (
        <Btn
          selected={armed}
          onClick={() => {
            if (!armed) {
              setArmed(true)
              return
            }
            world.cancelContract(active.offer.id)
          }}
        >
          Cancel <Coin n={fee} />
        </Btn>
      )}
    </div>
  )
}

function HistoryLine({ entry }: { entry: HistoryEntry }) {
  const outcome =
    entry.outcome.kind === 'done' ? 'Completed' : entry.outcome.kind === 'missed' ? 'Missed' : 'Cancelled'
  const n =
    entry.outcome.kind === 'done'
      ? entry.outcome.paid
      : entry.outcome.kind === 'missed'
        ? entry.outcome.penalty
        : entry.outcome.fee
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{COMPANIES[entry.company].name}</span>
      <svg viewBox="0 0 36 8" className="h-4" dangerouslySetInnerHTML={{ __html: UI_CONTRACT_STARS[entry.stars] }} />
      <span>{entry.day}</span>
      <span>{outcome}</span>
      <span className="ml-auto">
        <Coin n={n} />
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
