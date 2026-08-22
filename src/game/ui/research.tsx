import { useState } from 'react'
import * as Progress from '@radix-ui/react-progress'
import * as Tabs from '@radix-ui/react-tabs'
import { GATE_TEXT, RESEARCH } from '../defs/research.ts'
import { fill } from '../defs/catalog.ts'
import type { ResearchId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { researchInner } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Coin, Dock, tabTriggerClass } from './frame.tsx'

const TREES = ['plants', 'utilities', 'expansion', 'automation'] as const

type Tree = (typeof TREES)[number]

type Tip = { title: string; description: string; why?: string } | undefined

export function Research({ world, onClose }: { world: World; onClose: () => void }) {
  const [tab, setTab] = useState<Tree>('plants')
  const [tip, setTip] = useState<Tip>(undefined)
  const job = world.job
  return (
    <Dock
      wide
      title="Research"
      onClose={onClose}
      aside={
        tip !== undefined ? (
          <CalloutHover
            title={tip.title}
            description={
              <>
                <span>{tip.description}</span>
                {tip.why !== undefined && <span className="mt-2 block font-bold text-roof">{tip.why}</span>}
              </>
            }
          />
        ) : undefined
      }
      footer={
        <div className="text-sm text-ink/55">
          {job.kind === 'run'
            ? `${RESEARCH[job.id].name} · ${Math.ceil(job.left)}s left`
            : 'One project at a time. It runs while you garden.'}
        </div>
      }
    >
      <Tabs.Root
        value={tab}
        onValueChange={v => {
          setTab(v as Tree)
          setTip(undefined)
        }}
      >
        <Tabs.List className="sticky top-0 z-10 -mx-1 mb-2 flex flex-wrap gap-1 border-b border-ink/20 bg-house px-1">
          {TREES.map(id => (
            <Tabs.Trigger key={id} value={id} className={tabTriggerClass}>
              {id.slice(0, 1).toUpperCase() + id.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TREES.map(id => (
          <Tabs.Content key={id} value={id}>
            <div className="grid grid-cols-2 gap-1.5">
              {idsIn(id, world).map(rid => (
                <Card key={rid} id={rid} world={world} onTip={setTip} />
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

function Card({ id, world, onTip }: { id: ResearchId; world: World; onTip: (tip: Tip) => void }) {
  const d = RESEARCH[id]
  const done = world.done.has(id)
  const run = world.job.kind === 'run' && world.job.id === id
  const gated = !world.researchOpen(id)
  const busy = world.job.kind === 'run' && !run
  const pct = run && world.job.kind === 'run' ? ((d.seconds - world.job.left) / d.seconds) * 100 : done ? 100 : 0
  const off = run || done || gated || busy
  const why = done
    ? 'Already researched.'
    : run
      ? 'Running now.'
      : gated && d.gate.kind !== 'none'
        ? fill(GATE_TEXT[d.gate.kind], { have: world.gateHave(id), n: d.gate.n })
        : busy
          ? 'Another project is running. One at a time.'
          : world.money < d.cost
            ? 'Not enough money.'
            : undefined
  const face = done
    ? 'cursor-default bg-leaf/20 text-ink/60'
    : run
      ? 'cursor-default bg-ink text-house'
      : off
        ? 'cursor-default bg-ink/6 text-ink/40'
        : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
  return (
    <button
      type="button"
      aria-disabled={off}
      onPointerEnter={() => onTip({ title: d.name, description: d.blurb, why })}
      onPointerLeave={() => onTip(undefined)}
      onClick={() => {
        if (off) return
        world.startResearch(id)
      }}
      className={`flex w-full flex-col gap-1.5 p-2 text-left ${face}`}
    >
      <div className="flex items-start gap-2">
        <svg
          viewBox="0 0 24 24"
          className={`h-6 w-6 shrink-0 ${off && !run && !done ? 'opacity-45' : ''}`}
          dangerouslySetInnerHTML={{ __html: researchInner(id) }}
        />
        <span className="min-w-0 flex-1 text-base leading-snug font-semibold">{d.name}</span>
      </div>
      <div className="flex items-center justify-between text-sm tabular-nums">
        {done ? (
          <span className="font-semibold">Done</span>
        ) : (
          <>
            <Coin n={d.cost} />
            <span className="opacity-70">{run ? `${Math.ceil(world.job.kind === 'run' ? world.job.left : 0)}s` : `${d.seconds}s`}</span>
          </>
        )}
      </div>
      {gated && d.gate.kind !== 'none' && (
        <>
          <Progress.Root className="relative h-1.5 overflow-hidden bg-ink/15" value={world.gateProgress(id) * 100}>
            <Progress.Indicator className="h-full bg-roof" style={{ width: `${world.gateProgress(id) * 100}%` }} />
          </Progress.Root>
          <span className="text-xs leading-snug text-roof">
            {world.gateHave(id)} / {d.gate.n} {d.gate.kind}
          </span>
        </>
      )}
      {(run || done) && (
        <Progress.Root className="relative h-1.5 overflow-hidden bg-ink/25" value={pct}>
          <Progress.Indicator className="h-full bg-leaf" style={{ width: `${pct}%` }} />
        </Progress.Root>
      )}
    </button>
  )
}
