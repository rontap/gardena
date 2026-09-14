import { m } from '../../paraglide/messages.js'
import { useState, type ReactNode } from 'react'
import { CROPS } from '../defs/crops.ts'
import { SUGAR_MILL } from '../defs/items.ts'
import type { VarietyId } from '../defs/varieties.ts'
import { type JamCrop, type StallGoodId } from '../sim/ids.ts'
import type { Item } from '../sim/item.ts'
import { cutOf } from '../sim/feature-contracts/market.ts'
import type { DemandChip } from '../sim/feature-contracts/market.h.ts'
import { isCropStall, stallGoodName } from '../sim/stall.ts'
import type { World } from '../sim/world.ts'
import { UI_PRICE_ARROW, faceGfx } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Coin, Dock, Label } from './frame.tsx'
import { useRefresh } from './cycle.ts'

type Tip = { title: string; description: ReactNode } | undefined

const WIDTH = 'w-[38rem]'

const MARKET_COLS = 'grid-cols-[minmax(7rem,1fr)_6.5rem_5rem_4rem_5rem]'

export function Market({ world, onClose }: { world: World; onClose: () => void }) {
  const [tip, setTip] = useState<Tip>(undefined)
  useRefresh()
  const demand = world.marketDemand()
  return (
    <Dock
      width={WIDTH}
      title={m.names_role_market()}
      onClose={onClose}
      aside={tip !== undefined ? <CalloutHover title={tip.title} description={tip.description} /> : undefined}
    >
      <div className={`grid shrink-0 ${MARKET_COLS} items-end gap-x-2 border-b border-ink/20 px-1 pb-0.5`}>
        <Label>{m.market_col_produce()}</Label>
        <div className="text-right">
          <Label>{m.market_col_price()}</Label>
        </div>
        <div className="text-right">
          <Label>{m.market_col_current()}</Label>
        </div>
        <div className="text-right">
          <Label>{m.market_col_msrp()}</Label>
        </div>
        <div className="text-right">
          <Label>{m.market_col_baseline()}</Label>
        </div>
      </div>
      {demand.length === 0 ? (
        <div className="py-6 text-center text-sm text-ink/50">{m.market_demand_empty()}</div>
      ) : (
        demand.map(chip => <DemandRow key={`${chip.good}:${chip.variety}`} chip={chip} onTip={setTip} />)
      )}
    </Dock>
  )
}

function arrowDeg(shown: number): number {
  if (shown >= 1) return -90 * Math.min(1, (shown - 1) / 0.4)
  return 90 * Math.min(1, Math.max(0, (1 - shown) / 0.5))
}

function priceTint(shown: number, cap: number, sat: number): 'water' | 'flat' | 'tier-3' | 'tier-4' {
  if (shown > 1) return 'water'
  if (shown === 1) return 'flat'
  return cutOf(sat, cap) < cap / 2 ? 'tier-3' : 'tier-4'
}

const TINT_HEX = { water: '#3d7ea6', flat: '#1c1710', 'tier-3': '#e07b18', 'tier-4': '#e23b2e' } as const
const TINT_CLASS = { water: 'text-water', flat: 'text-ink/55', 'tier-3': 'text-tier-3', 'tier-4': 'text-tier-4' } as const

function PriceCell({ shown, cap, sat }: { shown: number; cap: number; sat: number }) {
  const tint = priceTint(shown, cap, sat)
  const inner = UI_PRICE_ARROW.replace(/fill="#3d7ea6"/g, `fill="${TINT_HEX[tint]}"`)
  return (
    <div className={`flex items-center justify-end gap-1.5 ${TINT_CLASS[tint]}`}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
        style={{ transform: `rotate(${arrowDeg(shown)}deg)` }}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
      <span className="w-9 text-right text-sm tabular-nums">{Math.round(shown * 100)}%</span>
    </div>
  )
}

function DemandRow({ chip, onTip }: { chip: DemandChip; onTip: (tip: Tip) => void }) {
  const floor = m.market_floor({ n: chip.cap * 100, days: nd(chip.recoverDays) })
  const name = stallGoodName(chip.good, chip.variety)
  return (
    <div
      data-stall-box={chip.good}
      className={`grid ${MARKET_COLS} items-center gap-x-2 border-b border-ink/10 px-1 py-1.5 hover:bg-ink/6`}
      onPointerEnter={() => onTip({ title: name, description: floor })}
      onPointerLeave={() => onTip(undefined)}
    >
      <div className="flex min-w-0 items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-8 w-8 shrink-0"
          dangerouslySetInnerHTML={{ __html: faceGfx(boxFace(chip.good, chip.variety, false, 1)) }}
        />
        <span className="truncate text-sm font-semibold">{name}</span>
      </div>
      <PriceCell shown={chip.shown} cap={chip.cap} sat={chip.sat} />
      <span className="justify-self-end text-sm tabular-nums">
        <Coin n={chip.price} />
      </span>
      <span className="justify-self-end text-sm tabular-nums text-ink/55">
        <Coin n={chip.msrp} />
      </span>
      <span className="justify-self-end text-sm tabular-nums text-ink/55">{days(chip.recoverDays)}</span>
    </div>
  )
}

function round1(n: number): number | string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? r : r.toFixed(1)
}

function days(n: number): string {
  const r = round1(n)
  return r === 1 ? m.market_one_day() : m.market_days({ n: r })
}

function nd(days: number): string {
  return m.market_recover({ n: round1(days) })
}

function boxFace(id: StallGoodId, variety: VarietyId, infused: boolean, n: number): Item {
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
