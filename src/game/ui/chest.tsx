import * as Dialog from '@radix-ui/react-dialog'
import type { Coord } from '../sim/building.ts'
import { itemLine } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { Frame } from './frame.tsx'
import { ItemFace, ItemLineView } from './held.tsx'

export function ChestUi({ world, at, onClose }: { world: World; at: Coord; onClose: () => void }) {
  const cell = world.cell(at)
  if (cell.kind !== 'chest' && cell.kind !== 'freezer') return null
  const title = cell.kind === 'freezer' ? 'Freezer' : 'Chest'
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
          <Frame title={title} onClose={onClose}>
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <div className="grid grid-cols-3 gap-2">
              {cell.slots.map((slot, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className="flex h-16 w-16 items-center justify-center border-2 border-ink bg-dirt-dark"
                    onClick={() => world.swapChest(at, i)}
                  >
                    {slot.kind === 'hold' ? <ItemFace item={slot.item} /> : null}
                  </button>
                  {slot.kind === 'hold' && (
                    <div className="text-center text-base leading-tight">
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
