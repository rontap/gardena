import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { SKUS } from '../defs/research.ts'
import type { SkuId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { Frame } from './frame.tsx'

const ORDER: SkuId[] = [
  'pack-carrot',
  'pack-potato',
  'pack-wheat',
  'pack-tomato',
  'pack-raspberry',
  'buy-shovel',
  'buy-better-shovel',
  'buy-bucket-large',
  'buy-can',
  'buy-can-large',
  'buy-box',
  'buy-box-large',
  'buy-pumpjack',
]

export function Shop({ world, onClose }: { world: World; onClose: () => void }) {
  const [note, setNote] = useState('')
  return (
    <Dialog.Root open modal={false}>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed left-4 top-20 z-20 outline-none"
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          <Frame title="shop" onClose={onClose}>
            <Dialog.Title className="sr-only">shop</Dialog.Title>
            {ORDER.filter(id => world.skuOpen(id)).map(id => (
              <button
                key={id}
                type="button"
                className="mb-1 block w-full border border-ink bg-house px-2 py-1 text-left"
                onClick={() => {
                  const block = world.buy(id)
                  setNote(block === undefined ? '' : block)
                }}
              >
                {id} ${SKUS[id].price}
              </button>
            ))}
            {note !== '' && <div className="mt-2 text-sm text-roof">{note}</div>}
          </Frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
