import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { RESEARCH } from '../defs/research.ts'
import type { ResearchId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { researchInner } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Bar, Coin, Dock, tabRailClass, tabRailListClass } from './frame.tsx'

const TREES = ['plants', 'utilities', 'expansion', 'automation'] as const

type Tree = (typeof TREES)[number]

type Tip = { title: string; description: string; why?: string } | undefined

export function Research({ world, onClose }: { world: World; onClose: () => void }) {
  const [tab, setTab] = useState<Tree>('plants')
  const [tip, setTip] = useState<Tip>(undefined)
  const job = world.job
  return (
    <Dock
      width="w-[28rem]"
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
        orientation="vertical"
        className="flex gap-2"
        onValueChange={v => {
          setTab(v as Tree)
          setTip(undefined)
        }}
      >
        <Tabs.List className={tabRailListClass}>
          {TREES.map(id => (
            <Tabs.Trigger key={id} value={id} className={tabRailClass}>
              {id.slice(0, 1).toUpperCase() + id.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TREES.map(id => (
          <Tabs.Content key={id} value={id} className="min-w-0 flex-1">
            <div className="grid auto-rows-[8.5rem] grid-cols-2 gap-1">
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
  const guest = world.local !== 0
  const off = run || done || gated || busy || guest
  const why = done
    ? 'Already researched.'
    : run
      ? 'Running now.'
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
        // TODO 1.1 multiplayer guest research start
        if (off) return
        world.startResearch(id)
      }}
      className={`flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden px-1 py-1.5 text-center ${face}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-10 w-10 shrink-0 ${off && !run && !done ? 'opacity-45' : ''}`}
        dangerouslySetInnerHTML={{ __html: researchInner(id) }}
      />
      <span className="line-clamp-2 min-h-8 text-sm leading-tight font-semibold">{d.name}</span>
      <span className="flex items-center gap-2 text-sm tabular-nums">
        {done ? (
          <span className="font-semibold">Done</span>
        ) : (
          <>
            <Coin n={d.cost} />
            <span className="opacity-70">
              {run ? `${Math.ceil(world.job.kind === 'run' ? world.job.left : 0)}s` : `${d.seconds}s`}
            </span>
          </>
        )}
      </span>
      {(run || done) && <Bar value={pct / 100} color="bg-leaf" track="bg-ink/25" className="h-1.5 w-full" />}
    </button>
  )
}
