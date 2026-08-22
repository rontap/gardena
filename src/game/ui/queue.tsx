import * as Progress from '@radix-ui/react-progress'
import type { World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'

export function Queue({ world }: { world: World }) {
  if (world.queue.length === 0) return null
  const pct = world.taskProgress() * 100
  return (
    <Chrome className="relative w-full">
      <div className="relative px-3 py-3 text-sm">
        {world.queue.map((intent, i) => (
          <div key={i} className={i === 0 ? 'bg-dirt px-2 py-0.5' : 'px-2 py-0.5 text-ink/70'}>
            {world.taskName(intent)}
          </div>
        ))}
        <Progress.Root className="relative mt-2 h-2 overflow-hidden bg-dirt-dark" value={pct}>
          <Progress.Indicator data-queue-bar className="h-full bg-leaf" style={{ width: `${pct}%` }} />
        </Progress.Root>
      </div>
    </Chrome>
  )
}
