import { useState } from 'react'
import * as Progress from '@radix-ui/react-progress'
import * as Tabs from '@radix-ui/react-tabs'
import { RESEARCH } from '../defs/research.ts'
import type { ResearchId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { Btn, Dock, tabTriggerClass } from './frame.tsx'

const TREES = ['plants', 'utilities', 'expansion', 'automation'] as const

type Tree = (typeof TREES)[number]

export function Research({ world, onClose }: { world: World; onClose: () => void }) {
  const [tab, setTab] = useState<Tree>('plants')
  return (
    <Dock side="right" title="Research" onClose={onClose}>
      <Btn className="mb-3 w-full" onClick={() => world.unlockAll()}>
        unlock all instantly
      </Btn>
      <Tabs.Root value={tab} onValueChange={v => setTab(v as Tree)}>
        <Tabs.List className="mb-2 flex flex-wrap gap-1 border-b border-ink/20">
          {TREES.map(id => (
            <Tabs.Trigger key={id} value={id} className={tabTriggerClass}>
              {id.slice(0, 1).toUpperCase() + id.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TREES.map(id => (
          <Tabs.Content key={id} value={id}>
            {idsIn(id).map(rid => (
              <Row key={rid} id={rid} world={world} />
            ))}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Dock>
  )
}

function idsIn(tree: Tree): ResearchId[] {
  return (Object.keys(RESEARCH) as ResearchId[]).filter(id => (RESEARCH[id].tree as Tree) === tree)
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
        {d.name} ${d.cost} {d.seconds}s{done ? ' done' : ''}
      </div>
      {(run || done) && (
        <Progress.Root className="relative mt-1 h-1.5 overflow-hidden bg-dirt-dark" value={pct}>
          <Progress.Indicator className="h-full bg-leaf" style={{ width: `${pct}%` }} />
        </Progress.Root>
      )}
    </Btn>
  )
}
