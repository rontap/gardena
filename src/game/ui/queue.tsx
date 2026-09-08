import * as Progress from '@radix-ui/react-progress'
import { m } from '../../paraglide/messages.js'
import type { World } from '../sim/world.ts'
import { bindHud } from '../view/motion.ts'
import { Chrome } from './frame.tsx'

export const QUEUE_SHOWN = 5

export function Queue({ world }: { world: World }) {
  const queue = world.seats[world.local].queue
  if (queue.length === 0) return null
  const shown = queue.slice(0, QUEUE_SHOWN)
  const rest = queue.length - shown.length
  const pct = world.taskProgress() * 100
  return (
    <Chrome className="relative w-full">
      <div className="relative px-3 py-3 text-sm">
        {shown.map((intent, i) => (
          <div key={i} className={i === 0 ? 'bg-dirt px-2 py-0.5' : 'px-2 py-0.5 text-ink/70'}>
            {world.taskName(intent)}
          </div>
        ))}
        {rest > 0 && <div className="px-2 py-0.5 text-ink/50">{m.hud_queue_more({ n: rest })}</div>}
        <Progress.Root className="relative mt-2 h-2 overflow-hidden bg-dirt-dark" value={pct}>
          <Progress.Indicator
            ref={el => bindHud('queue-bar', el)}
            data-queue-bar
            className="h-full bg-leaf"
            style={{ width: `${pct}%` }}
          />
        </Progress.Root>
      </div>
    </Chrome>
  )
}
