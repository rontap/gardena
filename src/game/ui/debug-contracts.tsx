import { CONTRACT_OFFERS, rollBoardAtD } from '../sim/market.ts'
import { Rng } from '../sim/rng.ts'
import { Chrome } from './frame.tsx'
import { OfferCard } from './market.tsx'

const DS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40] as const
const SEED = 1

export function DebugContracts() {
  const rng = new Rng(SEED)
  return (
    <div className="min-h-screen bg-ink p-4">
      <Chrome className="relative mx-auto w-full max-w-[96rem] px-4 py-3">
        <div className="relative z-20 flex flex-col gap-6">
          <div className="font-display text-lg">Contracts</div>
          {DS.map(D => (
            <div key={D} className="flex flex-col gap-2">
              <div className="text-sm font-semibold text-ink/45">D {D}</div>
              <div className="grid grid-cols-6 gap-2">
                {rollBoardAtD(rng, D, CONTRACT_OFFERS).map(offer => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    guest
                    atCap={false}
                    cap={3}
                    onTip={() => {}}
                    onAccept={() => {}}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Chrome>
    </div>
  )
}
