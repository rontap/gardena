import { useState } from 'react'
import { SKUS } from '../defs/research.ts'
import type { SkuId } from '../sim/ids.ts'
import { skuDesc, skuItem, skuLabel } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { Btn, Dock } from './frame.tsx'

const ORDER: SkuId[] = [
  'pack-carrot',
  'pack-potato',
  'pack-wheat',
  'pack-tomato',
  'pack-raspberry',
  'buy-shovel',
  'buy-better-shovel',
  'buy-pickaxe',
  'buy-better-pickaxe',
  'buy-bucket-large',
  'buy-box',
  'buy-box-large',
  'buy-pumpjack',
]

type RowState = 'not-researched' | 'cannot-afford' | 'inventory-full' | 'ok'

export function Shop({ world, onClose }: { world: World; onClose: () => void }) {
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
    <Dock side="left" title="Shop" onClose={onClose}>
      {ORDER.map(id => (
        <SkuRow key={id} id={id} world={world} onHot={setHot} />
      ))}
      <div className="mt-2 min-h-10 px-1 pt-1 text-sm text-ink">
        {hot !== undefined && <div>{skuDesc(hot)}</div>}
        {reason !== undefined && <div>{reason}</div>}
      </div>
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
        className={`w-full${world.place.kind === 'sku' && world.place.id === id ? ' bg-dirt-dark' : ''}`}
        disabled={state !== 'ok'}
        onClick={() => {
          if (state === 'ok') world.buy(id)
        }}
      >
        {skuLabel(id)} ${SKUS[id].price}
      </Btn>
    </div>
  )
}

function rowState(world: World, id: SkuId): RowState {
  if (!world.skuOpen(id)) return 'not-researched'
  if (world.money < SKUS[id].price) return 'cannot-afford'
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
  return 'ok'
}
