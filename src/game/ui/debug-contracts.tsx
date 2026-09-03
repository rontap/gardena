import { m } from '../../paraglide/messages.js'
import { useState, type ReactNode } from 'react'
import { CONTRACT_OFFERS, REP_MAX, rollBoard, rollBoardAtD } from '../sim/market.ts'
import { Rng } from '../sim/rng.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Btn, Chrome } from './frame.tsx'
import { OfferCard } from './market.tsx'

type Tip = { title: string; description: ReactNode } | undefined

const DS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40] as const
const DAYS = [0, 1, 2, 3, 5, 8, 12, 16, 24, 32] as const

export function DebugContracts() {
  const [seed, setSeed] = useState(1)
  const [rep, setRep] = useState(0)
  const [tip, setTip] = useState<Tip>(undefined)
  return (
    <div className="h-full overflow-y-auto scroll-pane bg-ink p-4">
      <div className="relative mx-auto w-full max-w-[96rem]">
      <Chrome className="relative px-4 py-3">
        <div className="relative z-20 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="font-display text-lg">{m.market_contracts()}</div>
            <span className="text-sm text-ink/45">{m.hud_debug_seed({ n: seed })}</span>
            <Btn onClick={() => setSeed(s => s + 1)}>{m.hud_debug_reroll()}</Btn>
            <span className="text-sm text-ink/45">{m.hud_debug_rep({ n: rep })}</span>
            <Btn onClick={() => setRep(r => (r + 5 > REP_MAX ? 0 : r + 5))}>{m.hud_debug_rep_plus({ n: 5 })}</Btn>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-display text-sm">{m.hud_debug_forced()}</div>
            {DS.map(D => (
              <Row key={D} label={m.hud_debug_d({ n: D })} offers={rollBoardAtD(new Rng(seed), D, CONTRACT_OFFERS)} onTip={setTip} />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-display text-sm">{m.hud_debug_boards()}</div>
            {DAYS.map(day => (
              <Row
                key={day}
                label={m.hud_debug_day({ n: day })}
                offers={rollBoard(new Rng(seed), day, CONTRACT_OFFERS, rep)}
                onTip={setTip}
              />
            ))}
          </div>
        </div>
      </Chrome>
      {tip !== undefined ? <CalloutHover title={tip.title} description={tip.description} /> : undefined}
      </div>
    </div>
  )
}

function Money({ offers }: { offers: readonly ReturnType<typeof rollBoard>[number][] }) {
  const xs = offers.filter(o => o.prize.kind === 'cash').map(o => o.reward).sort((a, b) => a - b)
  if (xs.length === 0) return <span className="text-sm text-ink/30">{m.hud_debug_all_prizes()}</span>
  const mid = xs[Math.floor(xs.length / 2)]
  return (
    <span className="text-sm tabular-nums text-ink/45">
      ${xs[0]} / <span className="font-semibold text-ink/70">${mid}</span> / ${xs[xs.length - 1]}
      <span className="ml-2 text-ink/30">{m.hud_debug_cash({ n: xs.length })}</span>
    </span>
  )
}

function Row({
  label,
  offers,
  onTip,
}: {
  label: string
  offers: readonly ReturnType<typeof rollBoard>[number][]
  onTip: (tip: Tip) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-3">
        <div className="text-sm font-semibold text-ink/45">{label}</div>
        <Money offers={offers} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {offers.map(offer => (
          <OfferCard
            key={offer.id}
            offer={offer}
            guest={false}
            atCap={false}
            cap={3}
            onTip={onTip}
            onAccept={() => {}}
          />
        ))}
      </div>
    </div>
  )
}
