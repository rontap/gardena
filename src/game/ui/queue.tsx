import * as Progress from '@radix-ui/react-progress'
import type { World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'

export function Queue({ world }: { world: World }) {
  if (world.queue.length === 0) return null
  const pct = world.taskProgress() * 100
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20">
      <Chrome className="border border-ink">
        <div className="relative px-3 py-2">
          {world.queue.map((intent, i) => (
            <div key={i} className={i === 0 ? 'bg-dirt px-1' : 'px-1'}>
              {world.taskName(intent)}
            </div>
          ))}
          <Progress.Root className="relative mt-1 h-2 overflow-hidden bg-dirt-dark" value={pct}>
            <Progress.Indicator className="h-full bg-leaf" style={{ width: `${pct}%` }} />
          </Progress.Root>
        </div>
      </Chrome>
    </div>
  )
}
