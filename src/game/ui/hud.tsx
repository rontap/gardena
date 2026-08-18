import * as Progress from '@radix-ui/react-progress'
import { RESEARCH } from '../defs/research.ts'
import type { World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'
import { Held } from './held.tsx'

export function Hud({
  world,
  onShop,
  onResearch,
  onMarket,
  onHeld,
}: {
  world: World
  onShop: () => void
  onResearch: () => void
  onMarket: () => void
  onHeld: () => void
}) {
  const job = world.job
  const def = job.kind === 'run' ? RESEARCH[job.id] : undefined
  const pct = def !== undefined && job.kind === 'run' ? ((def.seconds - job.left) / def.seconds) * 100 : 0
  return (
    <Chrome className="flex items-stretch gap-4 border-b-2 border-ink px-3 py-2">
      <div className="flex flex-col justify-center gap-0.5">
        <span className="text-lg leading-none">${Math.floor(world.money)}</span>
        <span className="text-xs">
          day {world.clock.day} · {Math.floor(world.clock.remaining)}s
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {job.kind === 'run' && def !== undefined && (
          <>
            <span className="truncate text-xs">
              {def.id} {Math.floor(job.left)}s
            </span>
            <Progress.Root className="relative h-2 overflow-hidden bg-dirt-dark" value={pct}>
              <Progress.Indicator className="h-full bg-leaf" style={{ width: `${pct}%` }} />
            </Progress.Root>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="border border-ink bg-dirt px-3 py-1 text-house" onClick={onShop}>
          Shop
        </button>
        <button type="button" className="border border-ink bg-dirt px-3 py-1 text-house" onClick={onResearch}>
          Research
        </button>
        <button type="button" className="border border-ink bg-dirt px-3 py-1 text-house" onClick={onMarket}>
          Market
        </button>
      </div>
      <Held hand={world.hand} onClick={onHeld} />
    </Chrome>
  )
}
