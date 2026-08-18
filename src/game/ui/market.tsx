import * as Dialog from '@radix-ui/react-dialog'
import type { World } from '../sim/world.ts'
import { Frame } from './frame.tsx'

export function Market({ world, onClose }: { world: World; onClose: () => void }) {
  const offer = world.saleOffer()
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
          <Frame title="market" onClose={onClose}>
            <Dialog.Title className="sr-only">market</Dialog.Title>
            {offer.kind === 'ok' ? (
              <div className="flex flex-col gap-3">
                <div>
                  {offer.label} ${offer.money}
                </div>
                <button
                  type="button"
                  className="border border-ink bg-dirt px-3 py-1 text-house"
                  onClick={() => {
                    world.enqueue({ act: 'sell' })
                    onClose()
                  }}
                >
                  Sell
                </button>
              </div>
            ) : (
              <div>{offer.text}</div>
            )}
          </Frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
