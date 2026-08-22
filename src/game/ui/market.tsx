import { useEffect, useState } from 'react'
import { CROPS } from '../defs/crops.ts'
import { RARITY_RANK, RARITY_SALE } from '../defs/rarity.ts'
import { STALL_IDS, binCount, type StallSale } from '../sim/stall.ts'
import type { StallGoodId } from '../sim/ids.ts'
import type { Item } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { qualityPip, UI_MARKET_STALL } from '../view/svgs.ts'
import { Btn, Coin, Overlay } from './frame.tsx'
import { ItemFace } from './held.tsx'

const DYNAMIC_MARKET_DISPLAY = false

export function Market({ world, onClose }: { world: World; onClose: () => void }) {
  const stocked = STALL_IDS.filter(id => binCount(world.stall[id]) > 0)
  const gain = world.marketGain()
  const open = world.marketOpen()
  const phase = world.clock.phase()
  const closed =
    open
      ? undefined
      : phase === 'sunset'
        ? 'Stall closed until morning.'
        : 'Stall closed at twilight.'
  return (
    <Overlay title="Market" onClose={onClose} className="max-h-[calc(100%-4rem)] w-[40rem]">
      <svg viewBox="0 0 240 120" aria-hidden="true" className="h-24 w-full" dangerouslySetInnerHTML={{ __html: UI_MARKET_STALL }} />
      <div className="flex flex-col gap-2 pt-2">
        {stocked.length === 0 ? <div>No produce.</div> : stocked.map(id => <StallRow key={id} id={id} world={world} />)}
        {DYNAMIC_MARKET_DISPLAY && <DynamicMarketRows world={world} stocked={stocked} />}
        <Btn
          data-sell-all=""
          className="w-full"
          disabled={gain === 0 || !open}
          onClick={() => {
            world.sellAll()
            onClose()
          }}
        >
          Sell all - <Coin n={gain} />
        </Btn>
        {closed !== undefined && <div className="text-base text-ink/70">{closed}</div>}
      </div>
    </Overlay>
  )
}

function StallRow({ id, world }: { id: StallGoodId; world: World }) {
  return (
    <div data-stall-box={id} className="flex items-center gap-3 bg-dirt px-2 py-2 text-base">
      <ItemFace item={boxFace(id)} />
      <span>{binCount(world.stall[id])}</span>
    </div>
  )
}

function boxFace(id: StallGoodId): Item {
  if (id === 'berry') return { kind: 'box', cap: 5, cargo: { kind: 'berry', rarity: 'common', count: 1 } }
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

function DynamicMarketRows({ world, stocked }: { world: World; stocked: readonly StallGoodId[] }) {
  const [toasts, setToasts] = useState<StallSale[]>([])
  useEffect(() => {
    if (world.sales.length === 0) return
    setToasts(world.sales)
    const timeout = window.setTimeout(() => setToasts([]), 1200)
    return () => window.clearTimeout(timeout)
  }, [world.sales])
  return <>{stocked.map(id => <DynamicStallRow key={id} id={id} world={world} toasts={toasts} />)}</>
}

function DynamicStallRow({ id, world, toasts }: { id: StallGoodId; world: World; toasts: readonly StallSale[] }) {
  const good = world.stall[id]
  const x = stallX(world, id)
  const sale = toasts.find(s => s.good === id)
  return (
    <div data-stall-box={id} className="relative flex items-center gap-2 bg-dirt px-2 py-2 text-base">
      <ItemFace item={boxFace(id)} />
      <div>{binCount(world.stall[id])}</div>
      <div data-offered><Coin n={good.offered} /></div>
      <Btn data-plus="" disabled={Math.floor(good.offered * 10) >= Math.floor(3 * x * 10)} onClick={() => world.nudgeOffered(id, 1)}>+</Btn>
      <Btn data-minus="" disabled={Math.floor(good.offered * 10) <= 1} onClick={() => world.nudgeOffered(id, -1)}>−</Btn>
      <div data-market-price><Coin n={good.market} /></div>
      <div>
        {RARITY_RANK.slice(1).map(r => <span key={r}>{r[0].toUpperCase() + r.slice(1)} {RARITY_SALE[r]}× </span>)}
      </div>
      {sale !== undefined && <div data-sale-popup><Coin n={sale.money} /></div>}
      {RARITY_RANK.slice(1).filter(r => good.stock[r].organic + good.stock[r].synth > 0).map(r => <svg key={r} viewBox="0 0 8 8" dangerouslySetInnerHTML={{ __html: qualityPip(r) as string }} />)}
    </div>
  )
}

function stallX(world: World, id: StallGoodId): number {
  return id === 'berry' ? 2 : CROPS[id].sale * world.modifiers.filter(m => m.crop === undefined || m.crop === id).reduce((n, m) => n * m.saleMul, 1)
}
