import { RESEARCH, SKUS } from '../defs/research.ts'
import { shelfOf } from '../defs/shelf.ts'
import type { SkuId } from '../sim/ids.ts'
import { skuDesc, skuItem, skuLabel } from '../sim/item.ts'
import { guestBlockedSku } from '../sim/mp.ts'
import type { World } from '../sim/world.ts'
import { skuInner } from '../view/svgs.ts'
import { machineOfSku } from '../sim/recipe.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Recipes } from './recipe.tsx'
import { Coin } from './frame.tsx'

export type RowState = 'not-researched' | 'need-skill' | 'cannot-afford' | 'inventory-full' | 'silo-full' | 'store-full' | 'ok'

const REASON: { readonly [K in RowState]: string } = {
  'not-researched': 'Locked behind research',
  'need-skill': 'You need to earn the Vanilla tending skill',
  'cannot-afford': 'Not enough money',
  'inventory-full': 'No room in the inventory',
  'silo-full': 'The seed silo is full',
  'store-full': 'The additive store is full',
  ok: '',
}

export function rowState(world: World, id: SkuId): RowState {
  if (!world.skuOpen(id)) return 'not-researched'
  if (world.money < world.skuPrice(id)) return 'cannot-afford'
  const made = skuItem(id)
  if (made.kind === 'seeds') {
    return world.silo.free < made.count ? 'silo-full' : 'ok'
  }
  if (made.kind === 'fertilizer' || made.kind === 'synth') {
    return world.additives.free < made.liters ? 'store-full' : 'ok'
  }
  const inv = world.seats[world.local].inventory
  if (made.kind === 'grass-seeds' || made.kind === 'sugar' || made.kind === 'weed-spray') {
    const merge = inv.findIndex(s => s.kind === 'hold' && s.item.kind === made.kind)
    const empty = inv.findIndex(s => s.kind === 'empty')
    if (merge < 0 && empty < 0) return 'inventory-full'
  }
  return 'ok'
}

/**
 * Research gating only. Never money or capacity: those flip while the player
 * hovers, and cards must not reshuffle under the cursor.
 */
export function locked(world: World, id: SkuId): boolean {
  return !world.skuOpen(id)
}

export function gateLine(world: World, id: SkuId, state: RowState): string {
  if (state === 'need-skill') return REASON['need-skill']
  if (state !== 'not-researched') return REASON[state]
  const sku = SKUS[id]
  if (sku.need === 'prize') return 'A contract prize. Not for sale.'
  if (sku.unlock !== 'start' && !world.done.has(sku.unlock)) return `Needs the ${RESEARCH[sku.unlock].name} research`
  if (sku.need.length > 0) return `Needs ${sku.need.map(r => RESEARCH[r].name).join(' or ')}`
  return REASON[state]
}

export function matches(id: SkuId, q: string): boolean {
  const shelf = shelfOf(id)
  const hay = `${skuLabel(id)} ${shelf.label} ${skuDesc(id)}`.toLowerCase()
  return hay.includes(q.trim().toLowerCase())
}

export function crumbOf(id: SkuId): string {
  const shelf = shelfOf(id)
  return `${shelf.panel === 'shop' ? 'Store' : 'Build'} · ${shelf.label}`
}

export function SkuCallout({ world, id }: { world: World; id: SkuId }) {
  const state = rowState(world, id)
  const crumb = crumbOf(id)
  const bulkFail = world.buyPacksFail(id)
  const bulk = bulkFail === 'Locked' ? undefined : world.packsPrice(id)
  const guestOff = world.local !== 0 && guestBlockedSku(id)
  const machine = machineOfSku(id)
  return (
    <CalloutHover
      title={skuLabel(id)}
      description={
        <>
          <span className="mb-2 block text-xs opacity-60">{crumb}</span>
          <span>{skuDesc(id)}</span>
          {machine !== undefined && (
            <span className="mt-2 block border-t border-ink/15 pt-1">
              <Recipes view={{ kind: 'list', machine }} size="sm" />
            </span>
          )}
          {state !== 'ok' && !guestOff && <span className="mt-2 block font-bold text-roof">{gateLine(world, id, state)}</span>}
          {bulk !== undefined && (
            <span className={`mt-2 flex items-center gap-1 font-bold ${bulkFail === undefined ? '' : 'text-roof'}`}>
              Ctrl-click: 5 packs for <Coin n={bulk} />
              {bulkFail !== undefined && <span>&mdash; {bulkFail.toLowerCase()}</span>}
            </span>
          )}
        </>
      }
    />
  )
}

export function SkuCard({
  id,
  world,
  onHot,
  onAct,
}: {
  id: SkuId
  world: World
  onHot: (id: SkuId | undefined) => void
  onAct: (id: SkuId) => void
}) {
  const state = rowState(world, id)
  const place = world.seats[world.local].place
  const armed = place.kind === 'sku' && place.id === id
  const guestOff = world.local !== 0 && guestBlockedSku(id)
  const off = state !== 'ok' || guestOff
  const face = off
    ? 'cursor-default bg-ink/6 text-ink/35'
    : armed
      ? 'cursor-pointer bg-ink text-house'
      : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
  return (
    <button
      type="button"
      aria-disabled={off}
      onPointerEnter={() => onHot(id)}
      onPointerLeave={() => onHot(undefined)}
      onFocus={() => onHot(id)}
      onClick={e => {
        if (off) return
        if (e.ctrlKey && world.buyPacksFail(id) === undefined) {
          world.buyPacks(id)
          return
        }
        onAct(id)
      }}
      className={`flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden px-1 py-1.5 text-center ${face}`}
    >
      <svg
        className={`h-10 w-10 shrink-0 ${off ? 'opacity-40' : ''}`}
        viewBox="0 0 24 24"
        dangerouslySetInnerHTML={{ __html: skuInner(id) }}
      />
      <span className="line-clamp-2 min-h-8 text-sm leading-tight font-semibold">{skuLabel(id)}</span>
      {armed && <span className="text-xs opacity-70">placing</span>}
      <span className="text-sm tabular-nums">
        <Coin n={world.skuPrice(id)} />
      </span>
    </button>
  )
}
