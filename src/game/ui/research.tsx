import * as Progress from '@radix-ui/react-progress'
import * as Tabs from '@radix-ui/react-tabs'
import { RESEARCH } from '../defs/research.ts'
import type { ResearchId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { Btn, Dock } from './frame.tsx'

const PLANTS: ResearchId[] = [
  'unlock-tomato',
  'unlock-raspberry',
  'bump-carrot',
  'bump-potato',
  'bump-wheat',
]
const UTIL: ResearchId[] = [
  'unlock-large-bucket',
  'unlock-box',
  'unlock-large-box',
  'unlock-better-shovel',
  'unlock-pumpjack',
  'unlock-expand',
  'unlock-pickaxe',
]

export function Research({ world, onClose }: { world: World; onClose: () => void }) {
  return (
    <Dock side="right" title="Research" onClose={onClose}>
      <Btn className="mb-3 w-full" onClick={() => world.unlockAll()}>
        unlock all instantly
      </Btn>
      <Tabs.Root defaultValue="plants">
        <Tabs.List className="mb-2 flex gap-1">
          <Tabs.Trigger value="plants" className="bg-dirt px-2 py-1 text-ink data-[state=active]:bg-dirt-dark">
            plants
          </Tabs.Trigger>
          <Tabs.Trigger value="utilities" className="bg-dirt px-2 py-1 text-ink data-[state=active]:bg-dirt-dark">
            utilities
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="plants">
          {PLANTS.map(id => (
            <Row key={id} id={id} world={world} />
          ))}
        </Tabs.Content>
        <Tabs.Content value="utilities">
          {UTIL.map(id => (
            <Row key={id} id={id} world={world} />
          ))}
        </Tabs.Content>
      </Tabs.Root>
    </Dock>
  )
}

function label(id: ResearchId): string {
  if (id === 'unlock-expand') return 'Unlock land'
  if (id === 'unlock-pickaxe') return 'Unlock pickaxe'
  return id
}

function Row({ id, world }: { id: ResearchId; world: World }) {
  const d = RESEARCH[id]
  const done = world.done.has(id)
  const run = world.job.kind === 'run' && world.job.id === id
  const pct = run && world.job.kind === 'run' ? ((d.seconds - world.job.left) / d.seconds) * 100 : done ? 100 : 0
  return (
    <Btn
      className="mb-1 w-full"
      disabled={run || done}
      onClick={() => {
        if (!done) world.startResearch(id)
      }}
    >
      <div>
        {label(id)} ${d.cost} {d.seconds}s{done ? ' done' : ''}
      </div>
      {(run || done) && (
        <Progress.Root className="relative mt-1 h-1.5 overflow-hidden bg-dirt-dark" value={pct}>
          <Progress.Indicator className="h-full bg-leaf" style={{ width: `${pct}%` }} />
        </Progress.Root>
      )}
    </Btn>
  )
}
