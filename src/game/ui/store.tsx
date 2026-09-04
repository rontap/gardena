import { m } from '../../paraglide/messages.js'
import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CROPS, cropVariety } from '../defs/crops.ts'
import { qualityMul, RATING_SALE, useOf, VARIETIES, type VarietyId } from '../defs/varieties.ts'
import { ADDITIVE_BAG, ADDITIVE_IDS, type AdditiveId, type Coord } from '../sim/building.ts'
import { ANNUAL_IDS, packSku, type AnnualId, type SkuId } from '../sim/ids.ts'
import { skuLabel } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { cropInner, faceGfx, ripeGroup } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { gateLine, rowState } from './sku-card.tsx'
import { Bar, Coin, Frame } from './frame.tsx'

const ADDITIVE_LABEL: { readonly [K in AdditiveId]: () => string } = {
  fertilizer: () => m.hud_fertilizer(),
  synth: () => m.names_item_synth(),
  compost: () => m.names_item_compost(),
  'weed-spray': () => m.names_item_weed_spray(),
}

const FIT = 'w-fit min-w-80 max-w-[min(calc(92vw-17rem),72rem)] max-h-[min(88vh,48rem)]'

export function Shell({
  title,
  onClose,
  children,
  aside,
  className,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={o => {
        if (!o) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 outline-none">
          <Frame title={title} onClose={onClose} aside={aside} className={className ?? FIT}>
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            {children}
          </Frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Capacity({ hint, used, cap, unit }: { hint: string; used: number; cap: number; unit: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
      <span className="text-ink/55">{hint}</span>
      <span className="flex shrink-0 items-center gap-2">
        <Bar value={used / cap} color="bg-ripe" className="h-1.5 w-20" />
        <span className="tabular-nums text-ink/70">
          {m.hud_capacity_unit({ used, cap, unit })}
        </span>
      </span>
    </div>
  )
}

type Tip =
  | { kind: 'stock'; crop: AnnualId; variety: VarietyId }
  | { kind: 'buy'; crop: AnnualId; sku: SkuId }
  | undefined

export function SiloUi({ world, at, onClose }: { world: World; at: Coord; onClose: () => void }) {
  const [tip, setTip] = useState<Tip>(undefined)
  const cell = world.cell(at)
  if (cell.kind !== 'seed-silo') return null
  const stackOf = (crop: AnnualId, variety: VarietyId) => cell.seeds.find(st => st.crop === crop && st.variety === variety)
  const held = (crop: AnnualId, variety: VarietyId): number => stackOf(crop, variety)?.count ?? 0
  const crops = ANNUAL_IDS.filter(crop => {
    const pack = packSku(crop)
    return (pack !== undefined && world.skuShown(pack)) || VARIETIES[crop].some(v => held(crop, v) > 0)
  })
  const rows = Math.max(0, ...crops.map(c => VARIETIES[c].length))
  return (
    <Shell
      title={m.names_building_seed_silo()}
      onClose={onClose}
      aside={
        tip === undefined ? undefined : tip.kind === 'buy' ? (
          <SeedTip world={world} crop={tip.crop} variety="base" quality={0} sku={tip.sku} />
        ) : (
          <SeedTip
            world={world}
            crop={tip.crop}
            variety={tip.variety}
            quality={stackOf(tip.crop, tip.variety)?.quality ?? 0}
          />
        )
      }
    >
      <Capacity hint={m.hud_silo_hint()} used={cell.used} cap={cell.cap} unit={m.hud_silo_unit()} />
      {crops.length === 0 ? (
        <div className="py-4 text-sm text-ink/50">{m.hud_silo_empty()}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1.5">
            <tbody>
              {Array.from({ length: rows }, (_, row) => (
                <tr key={row}>
                  {crops.map(crop => {
                    const variety = VARIETIES[crop][row]
                    if (variety === undefined) return <td key={crop} />
                    const n = held(crop, variety)
                    const show = variety === 'base' || n > 0
                    if (!show) return <td key={crop} />
                    return (
                      <td key={crop}>
                        <button
                          type="button"
                          aria-disabled={n === 0}
                          aria-label={m.hud_silo_cell_aria({ variety: cropVariety(crop, variety), n })}
                          onPointerEnter={() => setTip({ kind: 'stock', crop, variety })}
                          onPointerLeave={() => setTip(undefined)}
                          onFocus={() => setTip({ kind: 'stock', crop, variety })}
                          onClick={() => {
                            if (n === 0) return
                            world.takeSilo(crop, variety)
                          }}
                          className={`flex h-[4.25rem] w-[4.25rem] flex-col items-center justify-center gap-0.5 ${
                            n === 0
                              ? 'cursor-default bg-ink/6 text-ink/25'
                              : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-8 w-8 ${n === 0 ? 'opacity-30' : ''}`}
                            dangerouslySetInnerHTML={{ __html: cropInner(crop, ripeGroup(crop, variety)) }}
                          />
                          <span className="text-[11px] leading-tight">{cropVariety(crop, variety)}</span>
                          <span className="text-sm leading-none font-bold tabular-nums">{n}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
              {crops.some(crop => packSku(crop) !== undefined) && (
                <tr>
                  {crops.map(crop => {
                    const sku = packSku(crop)
                    if (sku === undefined) return <td key={crop} />
                    return (
                      <td key={crop}>
                        <BuyPack
                          world={world}
                          sku={sku}
                          onHot={on => setTip(on ? { kind: 'buy', crop, sku } : undefined)}
                        />
                      </td>
                    )
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 text-sm text-ink/55">{m.hud_silo_walk()}</div>
    </Shell>
  )
}

function SeedTip({
  world,
  crop,
  variety,
  quality,
  sku,
}: {
  world: World
  crop: AnnualId
  variety: VarietyId
  quality: number
  sku?: SkuId
}) {
  const d = CROPS[crop]
  const packSkuId = sku ?? packSku(crop)
  const pack =
    sku !== undefined
      ? world.skuPrice(sku)
      : packSkuId !== undefined && world.skuShown(packSkuId)
        ? world.skuPrice(packSkuId)
        : undefined
  const sale = d.sale * qualityMul(quality) * RATING_SALE[useOf(crop, variety).fresh]
  const state = sku !== undefined ? rowState(world, sku) : 'ok'
  const bulk = sku !== undefined && world.buyPacksFail(sku) === undefined ? world.packsPrice(sku) : undefined
  return (
    <CalloutHover
      title={cropVariety(crop, variety)}
      description={
        <>
          <span className="flex items-center gap-1">{m.hud_silo_quality({ n: Math.floor(quality * 100) })}</span>
          <span className="flex items-center gap-1">
            {pack === undefined ? m.hud_seed_not_stocked() : <>{m.hud_seed_pack()}<Coin n={pack} />{m.hud_per_pack({ n: 5 })}</>}
          </span>
          <span className="mt-1 flex items-center gap-1">
            {m.hud_sells_for()}
            <Coin n={round(sale)} />
            {m.hud_silo_sale()}
          </span>
          {bulk !== undefined && (
            <span className="mt-1 flex items-center gap-1">
              <Coin n={bulk} />
            </span>
          )}
          {sku !== undefined && state !== 'ok' && (
            <span className="mt-2 block font-bold text-roof">{gateLine(world, sku, state)}</span>
          )}
        </>
      }
    />
  )
}

const ADDITIVE_SKU: { readonly [K in AdditiveId]: SkuId | 'none' } = {
  fertilizer: 'buy-fertilizer',
  synth: 'buy-synth-fertilizer',
  compost: 'none',
  'weed-spray': 'buy-weed-spray',
}

function AdditiveTip({ world, id }: { world: World; id: AdditiveId }) {
  const sku = ADDITIVE_SKU[id]
  if (sku === 'none') return null
  const state = rowState(world, sku)
  return (
    <CalloutHover
      title={ADDITIVE_LABEL[id]()}
      description={
        <>
          <span className="flex items-center gap-1">
            <Coin n={world.skuPrice(sku)} />
            {m.hud_for_liters({ n: ADDITIVE_BAG[id] })}
          </span>
          {state !== 'ok' && <span className="mt-2 block font-bold text-roof">{gateLine(world, sku, state)}</span>}
        </>
      }
    />
  )
}

function BuyPack({ world, sku, onHot }: { world: World; sku: SkuId; onHot: (on: boolean) => void }) {
  const off = rowState(world, sku) !== 'ok'
  return (
    <button
      type="button"
      aria-label={m.hud_buy_sku({ name: skuLabel(sku) })}
      aria-disabled={off}
      onPointerEnter={() => onHot(true)}
      onPointerLeave={() => onHot(false)}
      onFocus={() => onHot(true)}
      onBlur={() => onHot(false)}
      onClick={e => {
        if (e.ctrlKey && world.buyPacksFail(sku) !== 'Locked') {
          world.buyPacks(sku)
          return
        }
        if (off) return
        world.buy(sku)
      }}
      className={`flex h-[4.25rem] w-[4.25rem] flex-col items-center justify-center gap-0.5 ${
        off ? 'cursor-default bg-ink/6 text-ink/35' : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
      }`}
    >
      <span className="text-xs font-semibold">{m.hud_buy()}</span>
      <span className="text-sm leading-none">
        <Coin n={world.skuPrice(sku)} />
      </span>
    </button>
  )
}

function BuyAdditive({ world, sku, onHot }: { world: World; sku: SkuId; onHot: (on: boolean) => void }) {
  const off = rowState(world, sku) !== 'ok'
  return (
    <button
      type="button"
      aria-label={m.hud_buy_sku({ name: skuLabel(sku) })}
      aria-disabled={off}
      onPointerEnter={() => onHot(true)}
      onPointerLeave={() => onHot(false)}
      onFocus={() => onHot(true)}
      onBlur={() => onHot(false)}
      onClick={() => {
        if (off) return
        world.buy(sku)
      }}
      className={`flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-2 ${
        off ? 'cursor-default bg-ink/6 text-ink/35' : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
      }`}
    >
      <span className="text-xs font-semibold">{m.hud_buy()}</span>
      <span className="text-sm leading-none">
        <Coin n={world.skuPrice(sku)} />
      </span>
    </button>
  )
}

export function AdditivesUi({ world, at, onClose }: { world: World; at: Coord; onClose: () => void }) {
  const [hot, setHot] = useState<AdditiveId | undefined>(undefined)
  const cell = world.cell(at)
  if (cell.kind !== 'additive-store') return null
  return (
    <Shell
      title={m.names_building_additive_store()}
      onClose={onClose}
      className="w-[30rem]"
      aside={hot === undefined ? undefined : <AdditiveTip world={world} id={hot} />}
    >
      <Capacity hint={m.hud_fill_bag()} used={round(cell.used)} cap={cell.cap} unit="L" />
      <div className="flex flex-col gap-1.5">
        {ADDITIVE_IDS.map(id => {
          const liters = cell.litersOf(id)
          const off = liters <= 0
          const sku = ADDITIVE_SKU[id]
          return (
            <div key={id} className="flex items-stretch gap-1.5">
              <button
                type="button"
                aria-disabled={off}
                onClick={() => {
                  if (off) return
                  world.takeAdditive(id)
                }}
                className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left ${
                  off ? 'cursor-default bg-ink/6 text-ink/35' : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-10 w-10 shrink-0 ${off ? 'opacity-40' : ''}`}
                  dangerouslySetInnerHTML={{
                    __html: faceGfx({ kind: id, liters: ADDITIVE_BAG[id], capacityLiters: ADDITIVE_BAG[id] }),
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-base font-semibold">{ADDITIVE_LABEL[id]()}</span>
                <span className="shrink-0 text-base tabular-nums">{round(liters)} L</span>
              </button>
              {sku !== 'none' && <BuyAdditive world={world} sku={sku} onHot={on => setHot(on ? id : undefined)} />}
            </div>
          )
        })}
      </div>
      <div className="mt-2 text-sm text-ink/55">
        {cell.used > 0 ? '' : m.hud_additive_empty()}
        {m.hud_additive_walk()}
      </div>
    </Shell>
  )
}

function round(n: number): number {
  return Number(n.toFixed(2))
}
