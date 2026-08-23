import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { RESEARCH, SKUS } from '../defs/research.ts'
import type { SkuId } from '../sim/ids.ts'
import { skuDesc, skuItem, skuLabel } from '../sim/item.ts'
import { guestBlockedSku } from '../sim/mp.ts'
import type { World } from '../sim/world.ts'
import { skuInner } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Coin, Dock, tabTriggerClass } from './frame.tsx'

const SEEDS: SkuId[] = [
  'pack-carrot',
  'pack-potato',
  'pack-wheat',
  'pack-tomato',
  'pack-raspberry',
  'pack-watermelon',
  'pack-olive',
  'pack-grape',
  'pack-vanilla',
  'pack-sugar-cane',
  'pack-grass',
]
const UTILITY: SkuId[] = [
  'buy-shovel',
  'buy-better-shovel',
  'buy-rotary-shovel',
  'buy-pickaxe',
  'buy-better-pickaxe',
  'buy-diamond-pickaxe',
  'buy-bucket',
  'buy-bucket-large',
  'buy-box',
  'buy-box-large',
  'buy-fertilizer',
  'buy-synth-fertilizer',
  'buy-sugar',
]
const BUILDING: SkuId[] = ['buy-fence', 'buy-tile-cobble', 'buy-tile-brick', 'buy-tile-paved']
export const AUTOMATION: SkuId[] = [
  'buy-pumpjack',
  'buy-well',
  'buy-rain-tank',
  'buy-tap',
  'buy-pipe',
  'buy-valve',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-chest',
  'buy-grinder',
  'buy-compost-box',
  'buy-mill',
  'buy-still',
  'buy-barrel',
  'buy-jam',
  'buy-freezer',
]

const TAB_LINE = {
  seeds: 'Sow on tilled soil.',
  utility: 'Tools and carry.',
  automation: 'Machines you place.',
  building: 'Paving and fencing. Click as many tiles as you like, Escape when done.',
} as const

type Tab = keyof typeof TAB_LINE

const TABS: { id: Tab; label: string; skus: SkuId[] }[] = [
  { id: 'seeds', label: 'Seeds', skus: SEEDS },
  { id: 'utility', label: 'Utility', skus: UTILITY },
  { id: 'automation', label: 'Automation', skus: AUTOMATION },
  { id: 'building', label: 'Building', skus: BUILDING },
]

type RowState = 'not-researched' | 'need-skill' | 'cannot-afford' | 'inventory-full' | 'ok'

const REASON: { readonly [K in RowState]: string } = {
  'not-researched': 'Locked behind research',
  'need-skill': 'You need to earn the Vanilla tending skill',
  'cannot-afford': 'Not enough money',
  'inventory-full': 'No room in the inventory',
  ok: '',
}

export function Shop({ world, onClose }: { world: World; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('seeds')
  const [hot, setHot] = useState<SkuId | undefined>(undefined)
  const state = hot === undefined ? undefined : rowState(world, hot)
  const bulk =
    hot !== undefined && SEEDS.includes(hot) && world.hasSkill('bulk-buying')
      ? 5 * world.skuPrice(hot) * 0.95
      : undefined
  return (
    <Dock
      wide
      title="General store"
      onClose={onClose}
      aside={
        hot !== undefined && state !== undefined ? (
          <CalloutHover
            title={skuLabel(hot)}
            description={
              <>
                <span>{skuDesc(hot)}</span>
                {state !== 'ok' && !(world.local !== 0 && guestBlockedSku(hot)) && (
                  <span className="mt-2 block font-bold text-roof">{gateLine(hot, state)}</span>
                )}
                {state === 'ok' && bulk !== undefined && (
                  <span className="mt-2 flex items-center gap-1 font-bold">
                    Ctrl-click: 5 packs for <Coin n={bulk} />
                  </span>
                )}
              </>
            }
          />
        ) : undefined
      }
      footer={<div className="text-sm text-ink/55">{TAB_LINE[tab]}</div>}
    >
      <Tabs.Root
        value={tab}
        onValueChange={v => {
          setTab(v as Tab)
          setHot(undefined)
        }}
      >
        <Tabs.List className="sticky top-0 z-10 -mx-1 mb-2 flex gap-1 border-b border-ink/20 bg-house px-1">
          {TABS.map(t => (
            <Tabs.Trigger key={t.id} value={t.id} className={tabTriggerClass}>
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TABS.map(t => (
          <Tabs.Content key={t.id} value={t.id} className="flex flex-col gap-1.5">
            {t.skus.filter(id => world.skuShown(id)).length === 0 && (
              <div className="py-4 text-sm text-ink/50">Nothing here yet. Research opens this shelf.</div>
            )}
            {t.skus
              .filter(id => world.skuShown(id))
              .map(id => (
                <SkuRow key={id} id={id} world={world} onHot={setHot} />
              ))}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Dock>
  )
}

function SkuRow({ id, world, onHot }: { id: SkuId; world: World; onHot: (id: SkuId | undefined) => void }) {
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
        if (e.ctrlKey && SEEDS.includes(id) && world.hasSkill('bulk-buying')) {
          world.buyPacks(id)
          return
        }
        world.buy(id)
      }}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left ${face}`}
    >
      <svg
        className={`h-7 w-7 shrink-0 ${off ? 'opacity-40' : ''}`}
        viewBox="0 0 24 24"
        dangerouslySetInnerHTML={{ __html: skuInner(id) }}
      />
      <span className="min-w-0 flex-1 truncate text-base font-semibold">{skuLabel(id)}</span>
      {armed && <span className="shrink-0 text-xs opacity-70">placing</span>}
      <span className="shrink-0 text-base tabular-nums">
        <Coin n={world.skuPrice(id)} />
      </span>
    </button>
  )
}

function gateLine(id: SkuId, state: RowState): string {
  if (state === 'need-skill') return REASON['need-skill']
  if (state !== 'not-researched') return REASON[state]
  const unlock = SKUS[id].unlock
  if (unlock === 'start') return REASON[state]
  return `Needs the ${RESEARCH[unlock].name} research`
}

function rowState(world: World, id: SkuId): RowState {
  const need = SKUS[id].need
  if (need !== undefined && !world.hasSkill(need)) return 'need-skill'
  if (!world.skuOpen(id)) return 'not-researched'
  if (world.money < world.skuPrice(id)) return 'cannot-afford'
  const inv = world.seats[world.local].inventory
  const made = skuItem(id)
  if (made.kind === 'grass-seeds') {
    const merge = inv.findIndex(s => s.kind === 'hold' && s.item.kind === 'grass-seeds')
    const empty = inv.findIndex(s => s.kind === 'empty')
    if (merge < 0 && empty < 0) return 'inventory-full'
  }
  if (made.kind === 'sugar') {
    const merge = inv.findIndex(s => s.kind === 'hold' && s.item.kind === 'sugar')
    const empty = inv.findIndex(s => s.kind === 'empty')
    if (merge < 0 && empty < 0) return 'inventory-full'
  }
  if (made.kind === 'seeds') {
    const merge = inv.findIndex(
      s =>
        s.kind === 'hold' && s.item.kind === 'seeds' && s.item.crop === made.crop && s.item.rarity === made.rarity,
    )
    const empty = inv.findIndex(s => s.kind === 'empty')
    if (merge < 0 && empty < 0) return 'inventory-full'
  }
  return 'ok'
}
