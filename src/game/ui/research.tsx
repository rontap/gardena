import { useState } from 'react'
import * as Progress from '@radix-ui/react-progress'
import * as Tabs from '@radix-ui/react-tabs'
import { RESEARCH } from '../defs/research.ts'
import type { ResearchId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { researchInner } from '../view/svgs.ts'
import { Btn, Chrome, Coin, Dock, tabTriggerClass } from './frame.tsx'

const TREES = ['plants', 'utilities', 'expansion', 'automation'] as const

type Tree = (typeof TREES)[number]

export function Research({ world, onClose }: { world: World; onClose: () => void }) {
  const [tab, setTab] = useState<Tree>('plants')
  return (
    <Dock wide title="Research" onClose={onClose}>
      <Btn className="mb-3 w-full" onClick={() => world.unlockAll()}>
        unlock all instantly
      </Btn>
      <Tabs.Root value={tab} onValueChange={v => setTab(v as Tree)}>
        <Tabs.List className="sticky top-0 z-10 mb-2 flex flex-wrap gap-1 border-b border-ink/20 bg-house">
          {TREES.map(id => (
            <Tabs.Trigger key={id} value={id} className={tabTriggerClass}>
              {id.slice(0, 1).toUpperCase() + id.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TREES.map(id => (
          <Tabs.Content key={id} value={id}>
            <div className="grid grid-cols-3 gap-1">
              {idsIn(id, world).map(rid => (
                <Card key={rid} id={rid} world={world} />
              ))}
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Dock>
  )
}

function idsIn(tree: Tree, world: World): ResearchId[] {
  return (Object.keys(RESEARCH) as ResearchId[]).filter(
    id => (RESEARCH[id].tree as Tree) === tree && world.researchShown(id),
  )
}

function Card({ id, world }: { id: ResearchId; world: World }) {
  const d = RESEARCH[id]
  const done = world.done.has(id)
  const run = world.job.kind === 'run' && world.job.id === id
  const pct = run && world.job.kind === 'run' ? ((d.seconds - world.job.left) / d.seconds) * 100 : done ? 100 : 0
  const [hot, setHot] = useState<DOMRect | undefined>(undefined)
  return (
    <div
      className="relative"
      onMouseEnter={e => setHot(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setHot(undefined)}
    >
      <button
        type="button"
        disabled={run || done}
        className={`flex w-full flex-col gap-1 p-1.5 text-left text-xs ${
          run || done ? 'cursor-default bg-house text-ink/40' : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
        }`}
        onClick={() => {
          if (!done) world.startResearch(id)
        }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" dangerouslySetInnerHTML={{ __html: researchInner(id) }} />
        <div>{d.name}</div>
        <div className="flex items-center justify-between">
          <Coin n={d.cost} />
          <span>{d.seconds}s</span>
        </div>
        {(run || done) && (
          <Progress.Root className="relative h-1.5 overflow-hidden bg-dirt-dark" value={pct}>
            <Progress.Indicator className="h-full bg-leaf" style={{ width: `${pct}%` }} />
          </Progress.Root>
        )}
      </button>
      {hot !== undefined && (
        <div className="fixed z-30" style={{ left: hot.right, top: hot.top }}>
          <Chrome className="relative ml-1 w-56 p-2">
            <div className="relative z-20 flex flex-col gap-1 text-sm">
              <div>{d.name}</div>
              <div>{d.blurb}</div>
              <div className="flex items-center justify-between">
                <Coin n={d.cost} />
                <span>{d.seconds}s</span>
              </div>
            </div>
          </Chrome>
        </div>
      )}
    </div>
  )
}
