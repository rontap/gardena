import * as Dialog from '@radix-ui/react-dialog'
import * as Progress from '@radix-ui/react-progress'
import * as Tabs from '@radix-ui/react-tabs'
import { RESEARCH } from '../defs/research.ts'
import type { ResearchId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { Frame } from './frame.tsx'

const PLANTS: ResearchId[] = [
  'unlock-tomato',
  'unlock-raspberry',
  'bump-carrot',
  'bump-potato',
  'bump-wheat',
]
const UTIL: ResearchId[] = [
  'unlock-can',
  'unlock-large-bucket',
  'unlock-large-can',
  'unlock-box',
  'unlock-large-box',
  'unlock-better-shovel',
  'unlock-pumpjack',
]

export function Research({ world, onClose }: { world: World; onClose: () => void }) {
  return (
    <Dialog.Root open modal={false}>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed left-4 top-20 z-20 outline-none"
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          <Frame title="research" onClose={onClose}>
            <Dialog.Title className="sr-only">research</Dialog.Title>
            <Tabs.Root defaultValue="plants">
              <Tabs.List className="mb-2 flex gap-1">
                <Tabs.Trigger
                  value="plants"
                  className="border border-ink px-2 py-1 data-[state=active]:bg-roof data-[state=active]:text-house"
                >
                  plants
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="utilities"
                  className="border border-ink px-2 py-1 data-[state=active]:bg-roof data-[state=active]:text-house"
                >
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
          </Frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Row({ id, world }: { id: ResearchId; world: World }) {
  const d = RESEARCH[id]
  const done = world.done.has(id)
  const run = world.job.kind === 'run' && world.job.id === id
  const pct = run && world.job.kind === 'run' ? ((d.seconds - world.job.left) / d.seconds) * 100 : done ? 100 : 0
  return (
    <button
      type="button"
      className="mb-1 block w-full border border-ink bg-house px-2 py-1 text-left"
      onClick={() => {
        if (!done) world.startResearch(id)
      }}
    >
      <div>
        {id} ${d.cost} {d.seconds}s{done ? ' done' : ''}
      </div>
      {(run || done) && (
        <Progress.Root className="relative mt-1 h-1.5 overflow-hidden bg-dirt-dark" value={pct}>
          <Progress.Indicator className="h-full bg-leaf" style={{ width: `${pct}%` }} />
        </Progress.Root>
      )}
    </button>
  )
}
