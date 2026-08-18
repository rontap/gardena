import * as Progress from '@radix-ui/react-progress'
import { RESEARCH } from '../defs/research.ts'
import type { World } from '../sim/world.ts'
import { Btn, Chrome } from './frame.tsx'

export function Hud({
  world,
  onShop,
  onResearch,
  onMarket,
}: {
  world: World
  onShop: () => void
  onResearch: () => void
  onMarket: () => void
}) {
  const job = world.job
  const def = job.kind === 'run' ? RESEARCH[job.id] : undefined
  const pct = def !== undefined && job.kind === 'run' ? ((def.seconds - job.left) / def.seconds) * 100 : 0
  return (
    <Chrome className="relative flex items-stretch gap-4 px-3 py-2">
      <div className="flex flex-col justify-center gap-0.5">
        <span className="text-lg leading-none">${Math.floor(world.money)}</span>
        <span data-clock className="text-xs">
          day {world.clock.day} · {Math.floor(world.clock.remaining)}s
        </span>
      </div>
      <div data-research className="flex min-w-0 flex-1 flex-col justify-center gap-1" hidden={job.kind !== 'run'}>
        {def !== undefined && (
          <>
            <span data-research-left className="truncate text-xs">
              {def.id} {Math.floor(job.left)}s
            </span>
            <Progress.Root className="relative h-2 overflow-hidden bg-dirt-dark" value={pct}>
              <Progress.Indicator data-research-bar className="h-full bg-leaf" style={{ width: `${pct}%` }} />
            </Progress.Root>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Btn onClick={onShop}>Shop</Btn>
        <Btn onClick={onResearch}>Research</Btn>
        <Btn onClick={onMarket}>Market</Btn>
      </div>
    </Chrome>
  )
}
