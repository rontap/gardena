import { useState } from 'react'
import { CONTRACT_OFFERS, REP_MAX, rollBoard, rollBoardAtD } from '../sim/market.ts'
import { Rng } from '../sim/rng.ts'
import { Btn, Chrome } from './frame.tsx'
import { OfferCard } from './market.tsx'

const DS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40] as const
const DAYS = [0, 1, 2, 3, 5, 8, 12, 16, 24, 32] as const

export function DebugContracts() {
  const [seed, setSeed] = useState(1)
  const [rep, setRep] = useState(0)
  return (
    <div className="h-full overflow-y-auto scroll-pane bg-ink p-4">
      <Chrome className="relative mx-auto w-full max-w-[96rem] px-4 py-3">
        <div className="relative z-20 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="font-display text-lg">Contracts</div>
            <span className="text-sm text-ink/45">seed {seed}</span>
            <Btn onClick={() => setSeed(s => s + 1)}>Re-roll</Btn>
            <span className="text-sm text-ink/45">rep {rep}</span>
            <Btn onClick={() => setRep(r => (r + 5 > REP_MAX ? 0 : r + 5))}>Rep +5</Btn>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-display text-sm">Forced difficulty</div>
            {DS.map(D => (
              <Row key={D} label={`D ${D}`} offers={rollBoardAtD(new Rng(seed), D, CONTRACT_OFFERS)} />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-display text-sm">Real boards by day</div>
            {DAYS.map(day => (
              <Row key={day} label={`day ${day}`} offers={rollBoard(new Rng(seed), day, CONTRACT_OFFERS, rep)} />
            ))}
          </div>
        </div>
      </Chrome>
    </div>
  )
}

/** min / median / max of the cash rewards on one row. Prize offers pay no cash, so they sit out. */
function Money({ offers }: { offers: readonly ReturnType<typeof rollBoard>[number][] }) {
  const xs = offers.filter(o => o.prize.kind === 'cash').map(o => o.reward).sort((a, b) => a - b)
  if (xs.length === 0) return <span className="text-sm text-ink/30">all prizes</span>
  const mid = xs[Math.floor(xs.length / 2)]
  return (
    <span className="text-sm tabular-nums text-ink/45">
      ${xs[0]} / <span className="font-semibold text-ink/70">${mid}</span> / ${xs[xs.length - 1]}
      <span className="ml-2 text-ink/30">×{xs.length} cash</span>
    </span>
  )
}

function Row({ label, offers }: { label: string; offers: readonly ReturnType<typeof rollBoard>[number][] }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-3">
        <div className="text-sm font-semibold text-ink/45">{label}</div>
        <Money offers={offers} />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {offers.map(offer => (
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
  )
}
