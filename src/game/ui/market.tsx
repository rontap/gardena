import type { World } from '../sim/world.ts'
import { Btn, Coin, Dock } from './frame.tsx'

export function Market({ world, onClose }: { world: World; onClose: () => void }) {
  const offer = world.saleOffer()
  return (
    <Dock title="Market" onClose={onClose}>
      {offer.kind === 'ok' ? (
        <div className="flex flex-col gap-3">
          <div>
            <span className="inline-flex items-center gap-1">
              {offer.label} <Coin n={offer.money} />
            </span>
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
