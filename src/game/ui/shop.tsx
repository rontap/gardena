import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { SKUS } from '../defs/research.ts'
import type { SkuId } from '../sim/ids.ts'
import { skuDesc, skuItem, skuLabel } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { skuInner } from '../view/svgs.ts'
import { Btn, Coin, Dock, tabTriggerClass } from './frame.tsx'

const SEEDS: SkuId[] = [
  'pack-carrot',
  'pack-potato',
  'pack-wheat',
  'pack-tomato',
  'pack-raspberry',
  'pack-watermelon',
]
const UTILITY: SkuId[] = [
  'buy-shovel',
  'buy-better-shovel',
  'buy-pickaxe',
  'buy-better-pickaxe',
  'buy-bucket',
  'buy-bucket-large',
  'buy-box',
  'buy-box-large',
  'buy-fertilizer',
  'buy-synth-fertilizer',
]
const BUILDING_TILES: SkuId[] = ['buy-tile-paved', 'buy-tile-brick', 'buy-tile-cobble']
export const AUTOMATION: SkuId[] = [
  'buy-pumpjack',
  'buy-well',
  'buy-pipe',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-chest',
  'buy-grinder',
  'buy-compost-box',
]

const TAB_LINE = {
  seeds: 'Seeds for the field.',
  utility: 'Tools and carry.',
  automation: 'Machines you place.',
  building: 'Building tiles for the garden.',
} as const

type Tab = keyof typeof TAB_LINE

const TABS: { id: Tab; label: string; skus: SkuId[] }[] = [
  { id: 'seeds', label: 'Seeds', skus: SEEDS },
  { id: 'utility', label: 'Utility', skus: UTILITY },
  { id: 'automation', label: 'Automation', skus: AUTOMATION },
  { id: 'building', label: 'Building Tiles', skus: BUILDING_TILES },
]

type RowState = 'not-researched' | 'cannot-afford' | 'inventory-full' | 'ok'

export function Shop({ world, onClose }: { world: World; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('seeds')
  const [hot, setHot] = useState<SkuId | undefined>(undefined)
  const reason =
    hot === undefined
      ? undefined
      : rowState(world, hot) === 'not-researched'
        ? 'not researched'
        : rowState(world, hot) === 'cannot-afford'
          ? 'cannot afford'
          : rowState(world, hot) === 'inventory-full'
            ? 'inventory-full'
            : undefined
  return (
    <Dock
      title="General store"
      onClose={onClose}
      footer={
        <div className="min-h-10 px-1 pt-1 text-sm text-ink">
          {hot === undefined ? (
            <div>{TAB_LINE[tab]}</div>
          ) : (
            <>
              <div>{skuDesc(hot)}</div>
              {reason !== undefined && <div>{reason}</div>}
            </>
          )}
        </div>
      }
    >
      <Tabs.Root
        value={tab}
        onValueChange={v => {
          setTab(v as Tab)
          setHot(undefined)
        }}
      >
        <Tabs.List className="sticky top-0 z-10 mb-2 flex gap-1 border-b border-ink/20 bg-house">
          {TABS.map(t => (
            <Tabs.Trigger key={t.id} value={t.id} className={tabTriggerClass}>
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TABS.map(t => (
          <Tabs.Content key={t.id} value={t.id}>
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

function SkuRow({
  id,
  world,
  onHot,
}: {
  id: SkuId
  world: World
  onHot: (id: SkuId | undefined) => void
}) {
  const state = rowState(world, id)
  return (
    <div className="mb-1" onMouseEnter={() => onHot(id)} onMouseLeave={() => onHot(undefined)}>
      <Btn
        className="w-full"
        selected={world.place.kind === 'sku' && world.place.id === id}
        disabled={state !== 'ok'}
        onClick={() => {
          if (state === 'ok') world.buy(id)
        }}
      >
        <span className="flex items-center gap-2">
          <svg
            className="h-6 w-6 shrink-0"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{ __html: skuInner(id) }}
          />
          <span className="inline-flex items-center gap-1">
            {skuLabel(id)} <Coin n={SKUS[id].price} />
          </span>
        </span>
      </Btn>
    </div>
  )
}

function rowState(world: World, id: SkuId): RowState {
  if (!world.skuOpen(id)) return 'not-researched'
  if (world.money < SKUS[id].price) return 'cannot-afford'
  if (
    id === 'pack-carrot' ||
    id === 'pack-potato' ||
    id === 'pack-wheat' ||
    id === 'pack-tomato' ||
    id === 'pack-raspberry' ||
    id === 'pack-watermelon'
  ) {
    const made = skuItem(id)
    if (made.kind === 'seeds') {
      const merge = world.inventory.findIndex(
        s =>
          s.kind === 'hold' &&
          s.item.kind === 'seeds' &&
          s.item.crop === made.crop &&
          s.item.rarity === made.rarity,
      )
      const empty = world.inventory.findIndex(s => s.kind === 'empty')
      if (merge < 0 && empty < 0) return 'inventory-full'
    }
  }
  return 'ok'
}
