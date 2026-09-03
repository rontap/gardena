import { m } from '../../paraglide/messages.js'
import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CROPS } from '../defs/crops.ts'
import { RARITY_RANK, raritySale, type Rarity } from '../defs/rarity.ts'
import { ADDITIVE_BAG, ADDITIVE_IDS, type AdditiveId, type Coord } from '../sim/building.ts'
import { ANNUAL_IDS, packSku, type AnnualId, type SkuId } from '../sim/ids.ts'
import { cropName, skuLabel } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { cropInner, faceGfx, rarityInner, ripeGroup } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { gateLine, rowState } from './sku-card.tsx'
import { Bar, Coin, Frame } from './frame.tsx'

const RARITY_LABEL: { readonly [K in Rarity]: () => string } = {
  common: () => m.names_rarity_common(),
  uncommon: () => m.names_rarity_uncommon(),
  rare: () => m.names_rarity_rare(),
  heirloom: () => m.names_rarity_heirloom(),
}

const ADDITIVE_LABEL: { readonly [K in AdditiveId]: () => string } = {
  fertilizer: () => m.hud_fertilizer(),
  synth: () => m.names_item_synth(),
  compost: () => m.names_item_compost(),
  'weed-spray': () => m.names_item_weed_spray(),
}

/**
 * Stores size to their contents: `w-fit` plus a max box, so one unlocked crop reads as a
 * small panel and ten read as a wide one with no hand-tuned width per shelf. The max
 * leaves room for the hover callout on the right, which the panel must never crowd out.
 */
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

/** Hint on the left, fill and count on the right — the bar sits next to the number it describes. */
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

type Tip = { crop: AnnualId; rarity: Rarity } | undefined

/**
 * Columns are crops, rows are rarities. Only shelves the player can actually reach
 * are drawn: a crop appears once its pack is on the shop shelf, heirloom once the
 * research lands. Stock the silo already holds always shows, whatever the gates say.
 */
export function SiloUi({ world, at, onClose }: { world: World; at: Coord; onClose: () => void }) {
  const [tip, setTip] = useState<Tip>(undefined)
  const cell = world.cell(at)
  if (cell.kind !== 'seed-silo') return null
  const held = (crop: AnnualId, rarity: Rarity): number =>
    cell.seeds.find(st => st.crop === crop && st.rarity === rarity)?.count ?? 0
  const crops = ANNUAL_IDS.filter(crop => {
    const pack = packSku(crop)
    return (pack !== undefined && world.skuShown(pack)) || RARITY_RANK.some(r => held(crop, r) > 0)
  })
  const rarities = RARITY_RANK.filter(r => {
    if (r === 'common') return true
    if (r === 'heirloom') return world.done.has('unlock-heirloom') || crops.some(c => held(c, 'heirloom') > 0)
    return world.done.has('unlock-crop-variants') || crops.some(c => held(c, r) > 0)
  })
  return (
    <Shell
      title={m.names_building_seed_silo()}
      onClose={onClose}
      aside={tip !== undefined ? <SeedTip world={world} crop={tip.crop} rarity={tip.rarity} /> : undefined}
    >
      <Capacity hint={m.hud_silo_hint()} used={cell.used} cap={cell.cap} unit={m.hud_silo_unit()} />
      {crops.length === 0 ? (
        <div className="py-4 text-sm text-ink/50">{m.hud_silo_empty()}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th />
                {crops.map(crop => (
                  <th key={crop} className="pb-1 align-bottom">
                    <div className="flex w-[4.25rem] flex-col items-center gap-0.5">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-9 w-9"
                        dangerouslySetInnerHTML={{ __html: cropInner(crop, ripeGroup('common')) }}
                      />
                      <span className="w-[4.25rem] text-center text-[11px] leading-tight text-ink/60">
                        {cropName(crop)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rarities.map(rarity => {
                const gem = rarityInner(rarity)
                return (
                  <tr key={rarity}>
                    <th className="pr-2 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm font-semibold whitespace-nowrap text-ink/70">
                          {RARITY_LABEL[rarity]()}
                        </span>
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                          {gem !== undefined && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" dangerouslySetInnerHTML={{ __html: gem }} />
                          )}
                        </span>
                      </div>
                    </th>
                    {crops.map(crop => {
                      const n = held(crop, rarity)
                      return (
                        <td key={crop}>
                          <button
                            type="button"
                            aria-disabled={n === 0}
                            aria-label={m.hud_silo_aria({ rarity: RARITY_LABEL[rarity](), crop: cropName(crop), n })}
                            onPointerEnter={() => setTip({ crop, rarity })}
                            onPointerLeave={() => setTip(undefined)}
                            onFocus={() => setTip({ crop, rarity })}
                            onClick={() => {
                              if (n === 0) return
                              world.takeSilo(crop, rarity)
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
                              dangerouslySetInnerHTML={{ __html: cropInner(crop, ripeGroup(rarity)) }}
                            />
                            <span className="text-sm leading-none font-bold tabular-nums">{n}</span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 text-sm text-ink/55">{m.hud_silo_walk()}</div>
    </Shell>
  )
}

function SeedTip({ world, crop, rarity }: { world: World; crop: AnnualId; rarity: Rarity }) {
  const d = CROPS[crop]
  const sku = packSku(crop)
  const pack = sku !== undefined && world.skuShown(sku) ? world.skuPrice(sku) : undefined
  const sale = d.sale * raritySale(d, rarity)
  return (
    <CalloutHover
      title={cropName(crop)}
      description={
        <>
          <span className="flex items-center gap-1">
            {pack === undefined ? m.hud_seed_not_stocked() : <>{m.hud_seed_pack()}<Coin n={pack} />{m.hud_per_pack({ n: 5 })}</>}
          </span>
          <span className="mt-1 flex items-center gap-1">
            {m.hud_sells_for()}
            <Coin n={round(sale)} />
            {m.hud_each_at({ rarity: RARITY_LABEL[rarity]().toLowerCase() })}
          </span>
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
