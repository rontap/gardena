import * as Tooltip from '@radix-ui/react-tooltip'
import { SKUS } from '../defs/research.ts'
import type { SkuId } from '../sim/ids.ts'
import { skuItem, skuLabel } from '../sim/item.ts'
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
  'buy-bucket-large',
  'buy-box',
  'buy-box-large',
  'buy-pumpjack',
]

type RowState = 'not-researched' | 'cannot-afford' | 'inventory-full' | 'ok'

export function Shop({ world, onClose }: { world: World; onClose: () => void }) {
  return (
    <Dock side="left" title="Shop" onClose={onClose}>
      {ORDER.map(id => (
        <SkuRow key={id} id={id} world={world} />
      ))}
    </Dock>
  )
}

function SkuRow({ id, world }: { id: SkuId; world: World }) {
  const state = rowState(world, id)
  const reason =
    state === 'not-researched'
      ? 'not researched'
      : state === 'cannot-afford'
        ? 'cannot afford'
        : state === 'inventory-full'
          ? 'inventory-full'
          : undefined
  const row = (
    <Btn
      className={`mb-1 w-full${world.place.kind === 'sku' && world.place.id === id ? ' bg-dirt-dark' : ''}`}
      disabled={state !== 'ok'}
      onClick={() => {
        if (state === 'ok') world.buy(id)
      }}
    >
      {skuLabel(id)} ${SKUS[id].price}
    </Btn>
  )
  if (reason === undefined) return row
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span className="mb-1 block w-full">{row}</span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="z-50 bg-house px-2 py-1 text-sm text-ink" sideOffset={6}>
          {reason}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
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
