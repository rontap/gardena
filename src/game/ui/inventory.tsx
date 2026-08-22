import * as Dialog from '@radix-ui/react-dialog'
import { itemLine } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { Frame } from './frame.tsx'
import { ItemFace, ItemLineView } from './held.tsx'

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
          <Frame title="Inventory" onClose={onClose} wide>
            <Dialog.Title className="sr-only">Inventory</Dialog.Title>
            <div className="grid grid-cols-4 gap-2">
              {world.inventory.map((slot, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className="flex h-16 w-16 cursor-pointer items-center justify-center bg-ink/15 hover:bg-ink/25"
                    onClick={() => world.swap(i)}
                  >
                    {slot.kind === 'hold' ? <ItemFace item={slot.item} /> : null}
                  </button>
                  {slot.kind === 'hold' && (
                    <div className="text-center text-xs leading-tight text-ink/70">
                      {slot.item.kind === 'fruit' || slot.item.kind === 'sugar' ? (
                        <ItemLineView item={slot.item} />
                      ) : (
                        itemLine(slot.item, world.modifiers)
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
