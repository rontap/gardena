import * as Dialog from '@radix-ui/react-dialog'
import type { World } from '../sim/world.ts'
import { Frame } from './frame.tsx'
import { ItemFace } from './held.tsx'

export function Inventory({ world, onClose }: { world: World; onClose: () => void }) {
  return (
    <Dialog.Root
      open
      onOpenChange={o => {
        if (!o) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 outline-none">
          <Frame title="inventory" onClose={onClose} wide>
            <Dialog.Title className="sr-only">inventory</Dialog.Title>
            <div className="grid grid-cols-4 gap-2">
              {world.inventory.map((slot, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex h-16 w-16 items-center justify-center border-2 border-ink bg-dirt-dark"
                  onClick={() => world.swapSlot(i)}
                >
                  {slot.kind === 'hold' ? <ItemFace item={slot.item} /> : null}
                </button>
              ))}
            </div>
          </Frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
