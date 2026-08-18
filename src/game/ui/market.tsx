import type { World } from '../sim/world.ts'
import { Btn, Dock } from './frame.tsx'

export function Market({ world, onClose }: { world: World; onClose: () => void }) {
  const offer = world.saleOffer()
  return (
    <Dock side="right" title="Market" onClose={onClose}>
      {offer.kind === 'ok' ? (
        <div className="flex flex-col gap-3">
          <div>
            {offer.label} ${offer.money}
          </div>
          <Btn
            className="w-full"
            onClick={() => {
              world.enqueue({ act: 'sell' })
              onClose()
            }}
          >
            Sell
          </Btn>
        </div>
      ) : (
        <div>{offer.text}</div>
      )}
    </Dock>
  )
}
