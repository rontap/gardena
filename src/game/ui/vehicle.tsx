import { m } from '../../paraglide/messages.js'
import * as Dialog from '@radix-ui/react-dialog'
import type { HarvestSlot, VehicleId, VehicleSlot } from '../sim/ids.ts'
import { itemLine, type Slot } from '../sim/item.ts'
import type { Modifier } from '../sim/modifiers.ts'
import type { Trailer } from '../sim/feature-vehicles/vehicle.ts'
import type { World } from '../sim/world.ts'
import { UI_SLOT_DOWN } from '../view/svgs.ts'
import { Bar } from './frame.tsx'
import { Frame } from './frame.tsx'
import { ItemFace, ItemLineView } from './held.tsx'

const QUAD_SLOTS: readonly VehicleSlot[] = [0, 1, 2, 3, 4, 5]
const HARVEST_IX: readonly HarvestSlot[] = [0, 1, 2, 3, 4, 5, 6, 7]

function SlotCell({
  slot,
  modifiers,
  onClick,
  overlay,
}: {
  slot: Slot
  modifiers: readonly Modifier[]
  onClick: () => void
  overlay?: boolean
}) {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        type="button"
        className="flex h-16 w-16 items-center justify-center border-2 border-ink bg-dirt-dark"
        onClick={onClick}
      >
        {slot.kind === 'hold' ? <ItemFace item={slot.item} /> : null}
        {overlay && (
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute h-6 w-6" dangerouslySetInnerHTML={{ __html: UI_SLOT_DOWN }} />
        )}
      </button>
      {slot.kind === 'hold' && (
        <div className="text-center text-base leading-tight">
          {slot.item.kind === 'fruit' || slot.item.kind === 'sugar' ? (
            <ItemLineView item={slot.item} />
          ) : (
            itemLine(slot.item, modifiers)
          )}
        </div>
      )}
    </div>
  )
}

export function VehicleUi({ world, id, onClose }: { world: World; id: VehicleId; onClose: () => void }) {
  const v = world.vehicles.find(x => x.id === id)
  const title = v !== undefined && v.kind === 'tractor' ? m.names_vehicle_tractor() : m.names_vehicle_quad()
  const trailer: Trailer | undefined =
    v !== undefined && v.kind === 'tractor' && v.hitch !== 'none' ? world.trailers.find(t => t.id === v.hitch) : undefined
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
            <div className="mb-3 flex items-center gap-3">
              {v !== undefined && <Bar value={v.fuel} color="bg-ripe" className="h-1.5 w-20" />}
              <button
                type="button"
                className="px-3 py-2 text-base font-semibold cursor-pointer bg-dirt text-house hover:bg-dirt-dark"
                onClick={() => world.embark(id)}
              >
                {m.vehicles_embark()}
              </button>
            </div>
            {v !== undefined && v.kind === 'quad' && (
              <div className="grid grid-cols-3 gap-2">
                {QUAD_SLOTS.map(i => (
                  <SlotCell
                    key={i}
                    slot={v.slots[i]}
                    modifiers={world.modifiers}
                    onClick={() => world.swapVehicle(id, i)}
                  />
                ))}
              </div>
            )}
            {trailer !== undefined && trailer.kind !== 'harvest' && (
              <div className="grid grid-cols-1 gap-2">
                <SlotCell
                  slot={trailer.hopper.kind === 'empty' ? { kind: 'empty' } : { kind: 'hold', item: trailer.hopper.item }}
                  modifiers={world.modifiers}
                  overlay
                  onClick={() => world.swapTrailer(trailer.id, 0)}
                />
              </div>
            )}
            {trailer !== undefined && trailer.kind === 'harvest' && (
              <div className="grid grid-cols-4 gap-2">
                {HARVEST_IX.map(i => (
                  <SlotCell
                    key={i}
                    slot={trailer.slots[i]}
                    modifiers={world.modifiers}
                    onClick={() => world.swapTrailer(trailer.id, i)}
                  />
                ))}
              </div>
            )}
          </Frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
