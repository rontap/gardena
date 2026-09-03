import { m } from '../../paraglide/messages.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { RESEARCH } from '../defs/research.ts'
import type { ResearchId } from '../sim/ids.ts'
import { Btn, Chrome, Coin } from './frame.tsx'
import {
  buildTree,
  KEY_START,
  keyFromDomId,
  keyOfGrant,
  keyOfResearch,
  keyOfSkill,
  keyOfSku,
  skuGates,
} from './techtree.ts'
import type { Leaf, Node, Tree } from './techtree.ts'

type Detail =
  | { kind: 'start' }
  | { kind: 'research'; node: Node }
  | { kind: 'leaf'; leaf: Leaf; from: ResearchId }

type Filter = 'all' | string

const token = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#1c1710'

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  flowchart: { htmlLabels: false, curve: 'basis', nodeSpacing: 30, rankSpacing: 70 },
  themeVariables: {
    fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif',
    fontSize: '13px',
    background: token('--color-house'),
    primaryColor: token('--color-dirt'),
    primaryTextColor: token('--color-house'),
    primaryBorderColor: token('--color-ink'),
    lineColor: token('--color-ink'),
    textColor: token('--color-ink'),
    titleColor: token('--color-ink'),
    clusterBkg: token('--color-house'),
    clusterBorder: token('--color-ink'),
    nodeBorder: token('--color-ink'),
    edgeLabelBackground: token('--color-parch'),
  },
})

const esc = (s: string): string => s.replace(/"/g, '#quot;')

function title(s: string): string {
  if (s === 'plants') return m.hud_research_plants()
  if (s === 'land') return m.hud_research_land()
  if (s === 'automation') return m.hud_research_automation()
  if (s === 'trade') return m.hud_research_trade()
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}

const projects = (n: number): string => (n === 1 ? m.hud_debug_project({ n }) : m.hud_debug_projects({ n }))

const secs = (n: number): string => (n < 60 ? m.hud_debug_secs({ n }) : m.hud_debug_min_secs({ m: Math.floor(n / 60), s: n % 60 }))

function source(tree: Tree, filter: Filter, leaves: boolean): { src: string; detail: Map<string, Detail> } {
  const detail = new Map<string, Detail>([[KEY_START, { kind: 'start' }]])
  const shown = [...tree.nodes.values()].filter(n => filter === 'all' || n.def.tree === filter)
  const ids = new Set(shown.map(n => n.id))
  const outside = new Set<ResearchId>()
  for (const n of shown) for (const p of n.parents) if (!ids.has(p)) outside.add(p)

  const lines = ['flowchart LR', `  ${KEY_START}(("${m.hud_debug_start_node()}"))`]

  const groups = new Map<string, string[]>()
  for (const n of shown) {
    const body: string[] = []
    const key = keyOfResearch(n.id)
    detail.set(key, { kind: 'research', node: n })
    body.push(`    ${key}["${esc(n.def.name)}<br/>$${n.def.cost} · ${n.def.seconds}s"]`)
    body.push(`    class ${key} research`)
    if (leaves) {
      n.leaves.forEach((leaf, i) => {
        const lk =
          leaf.kind === 'sku'
            ? keyOfSku(leaf.id)
            : leaf.kind === 'skill'
              ? keyOfSkill(leaf.id)
              : keyOfGrant(n.id, i)
        detail.set(lk, { kind: 'leaf', leaf, from: n.id })
        if (leaf.kind === 'sku') body.push(`    ${lk}(["${esc(leaf.label)} $${leaf.sku.price}"])`)
        else if (leaf.kind === 'skill') body.push(`    ${lk}{{"${esc(leaf.label)}"}}`)
        else body.push(`    ${lk}>"${esc(leaf.text)}"]`)
        body.push(`    class ${lk} ${leaf.kind}`)
      })
    }
    const g = groups.get(n.def.tree) ?? []
    g.push(...body)
    groups.set(n.def.tree, g)
  }

  for (const [name, body] of groups) {
    lines.push(`  subgraph tree_${name}["${esc(title(name))}"]`, ...body, '  end')
  }
  for (const id of outside) {
    const key = keyOfResearch(id)
    const n = tree.nodes.get(id)
    if (n !== undefined) detail.set(key, { kind: 'research', node: n })
    lines.push(`  ${key}["${esc(RESEARCH[id].name)}"]`, `  class ${key} outside`)
  }

  for (const n of shown) {
    const key = keyOfResearch(n.id)
    if (n.parents.length === 0) lines.push(`  ${KEY_START} --> ${key}`)
    for (const r of n.def.reveal) lines.push(`  ${keyOfResearch(r)} --> ${key}`)
    for (const r of n.def.requires) lines.push(`  ${keyOfResearch(r)} ==> ${key}`)
    if (!leaves) continue
    n.leaves.forEach((leaf, i) => {
      const lk =
        leaf.kind === 'sku'
          ? keyOfSku(leaf.id)
          : leaf.kind === 'skill'
            ? keyOfSkill(leaf.id)
            : keyOfGrant(n.id, i)
      lines.push(`  ${key} ${leaf.kind === 'sku' && leaf.second ? '-.->' : '-->'} ${lk}`)
    })
  }

  lines.push(
    `  classDef research fill:${token('--color-dirt')},stroke:${token('--color-ink')},color:${token('--color-house')},stroke-width:2px`,
    `  classDef sku fill:${token('--color-parch')},stroke:${token('--color-ink')},color:${token('--color-ink')}`,
    `  classDef skill fill:${token('--color-leaf')},stroke:${token('--color-ink')},color:${token('--color-ink')}`,
    `  classDef grant fill:${token('--color-ripe')},stroke:${token('--color-ink')},color:${token('--color-ink')}`,
    `  classDef outside fill:none,stroke:${token('--color-ink')},color:${token('--color-ink')},stroke-dasharray:4 3`,
  )
  return { src: lines.join('\n'), detail }
}

export function DebugTechTree() {
  const tree = useMemo(buildTree, [])
  const [filter, setFilter] = useState<Filter>('all')
  const [leaves, setLeaves] = useState(true)
  const [svg, setSvg] = useState('')
  const [err, setErr] = useState<string | undefined>(undefined)
  const [pick, setPick] = useState<Detail | undefined>(undefined)
  const box = useRef<HTMLDivElement>(null)

  const { src, detail } = useMemo(() => source(tree, filter, leaves), [tree, filter, leaves])

  useEffect(() => {
    let dead = false
    setPick(undefined)
    mermaid
      .render(`tt-${Math.random().toString(36).slice(2)}`, src)
      .then(r => {
        if (dead) return
        setErr(undefined)
        setSvg(r.svg)
      })
      .catch((e: unknown) => {
        if (!dead) setErr(String(e))
      })
    return () => {
      dead = true
    }
  }, [src])

  useEffect(() => {
    const el = box.current
    if (el === null) return
    const over = (e: PointerEvent) => {
      const g = (e.target as Element | null)?.closest('g.node')
      if (g === null || g === undefined) return
      const d = detail.get(keyFromDomId(g.id))
      if (d !== undefined) setPick(d)
    }
    el.addEventListener('pointerover', over)
    return () => el.removeEventListener('pointerover', over)
  }, [detail, svg])

  return (
    <div className="h-full overflow-y-auto scroll-pane bg-ink p-4">
      <Chrome className="relative mx-auto w-full max-w-[96rem] px-4 py-3">
        <div className="relative z-20 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-2 font-display text-lg">{m.hud_debug_tech()}</div>
            <Btn selected={filter === 'all'} onClick={() => setFilter('all')}>
              {m.hud_debug_all()}
            </Btn>
            {tree.trees.map(t => (
              <Btn key={t} selected={filter === t} onClick={() => setFilter(t)}>
                {title(t)}
              </Btn>
            ))}
            <span className="mx-2 text-ink/25">|</span>
            <Btn selected={leaves} onClick={() => setLeaves(v => !v)}>
              {m.hud_debug_unlocks()}
            </Btn>
            <span className="ml-auto text-sm text-ink/45">
              {m.hud_debug_counts({
                research: tree.nodes.size,
                unlocks: [...tree.nodes.values()].reduce((n, x) => n + x.leaves.length, 0),
              })}
            </span>
          </div>

          <Legend />

          {err !== undefined && <div className="text-sm whitespace-pre-wrap text-roof">{err}</div>}
          <div
            ref={box}
            className="overflow-x-auto scroll-pane border border-ink/15 bg-parch p-2 [&_svg]:h-auto [&_svg]:max-w-none"
            onPointerLeave={() => setPick(undefined)}
            dangerouslySetInnerHTML={{ __html: svg }}
          />

          <Panel pick={pick} tree={tree} />
        </div>
      </Chrome>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-ink/55">
      <Swatch color="bg-dirt" label={m.names_role_research()} />
      <Swatch color="bg-parch border border-ink/40" label={m.hud_debug_shop_item()} />
      <Swatch color="bg-leaf" label={m.hud_debug_skill()} />
      <Swatch color="bg-ripe" label={m.hud_debug_concept()} />
      <span>{m.hud_debug_reveals()}</span>
      <span className="font-bold">{m.hud_debug_requires()}</span>
      <span>{m.hud_debug_second()}</span>
    </div>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 ${color}`} />
      {label}
    </span>
  )
}

function Panel({ pick, tree }: { pick: Detail | undefined; tree: Tree }) {
  return (
    <div className="min-h-56 border-t border-ink/20 pt-3">
      {pick === undefined ? (
        <div className="text-sm text-ink/40">{m.hud_debug_hover()}</div>
      ) : pick.kind === 'start' ? (
        <div className="text-sm text-ink/55">{m.hud_debug_start({ n: tree.roots.length })}</div>
      ) : pick.kind === 'research' ? (
        <ResearchDetail node={pick.node} tree={tree} />
      ) : (
        <LeafDetail leaf={pick.leaf} from={pick.from} tree={tree} />
      )}
    </div>
  )
}

function ResearchDetail({ node, tree }: { node: Node; tree: Tree }) {
  const { def } = node
  const skus = node.leaves.filter(l => l.kind === 'sku')
  const skills = node.leaves.filter(l => l.kind === 'skill')
  const grants = node.leaves.filter(l => l.kind === 'grant')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-display text-sm">{def.name}</span>
        <span className="text-sm text-ink/45">{def.tree}</span>
        <span className="text-sm text-ink/45">{def.id}</span>
      </div>
      <div className="text-sm text-ink/75">{def.blurb}</div>

      <div className="flex flex-wrap gap-6">
        <Stat label={m.hud_debug_this_project()}>
          <Coin n={def.cost} /> <span className="tabular-nums">{secs(def.seconds)}</span>
        </Stat>
        <Stat label={m.hud_debug_total({ projects: projects(node.ancestors.length + 1) })}>
          <Coin n={node.totalCost} /> <span className="tabular-nums">{secs(node.totalSeconds)}</span>
        </Stat>
      </div>

      {node.ancestors.length > 0 && (
        <Row label={m.hud_debug_needs_first()}>
          {node.ancestors
            .map(a => `${RESEARCH[a].name} ($${RESEARCH[a].cost} · ${RESEARCH[a].seconds}s)`)
            .join(' · ')}
        </Row>
      )}
      {def.requires.length > 0 && (
        <Row label={def.requires.length > 1 ? m.hud_debug_hard_all() : m.hud_debug_hard_one()}>
          {def.requires.map(r => RESEARCH[r].name).join(' · ')}
        </Row>
      )}

      <div className="grid grid-cols-3 gap-6">
        <Col label={m.hud_debug_shop_items({ n: skus.length })}>
          {skus.map(l =>
            l.kind !== 'sku' ? null : (
              <li key={`${l.id}-${String(l.second)}`} className="text-sm">
                {l.label} <span className="text-ink/45">${l.sku.price}</span>
                {l.second && <span className="ml-1 text-roof">{m.hud_debug_second_lock()}</span>}
                {l.sku.show !== 'start' && l.sku.show !== node.id && (
                  <span className="ml-1 text-ink/35">{m.hud_debug_shelf_at({ name: RESEARCH[l.sku.show].name })}</span>
                )}
              </li>
            ),
          )}
        </Col>
        <Col label={m.hud_debug_skills({ n: skills.length })}>
          {skills.map(l =>
            l.kind !== 'skill' ? null : (
              <li key={l.id} className="text-sm">
                {l.label} <span className="text-ink/45">{l.def.member}</span>
              </li>
            ),
          )}
        </Col>
        <Col label={m.hud_debug_concepts({ n: grants.length })}>
          {grants.map(l =>
            l.kind !== 'grant' ? null : (
              <li key={l.text} className="text-sm">
                {l.text}
              </li>
            ),
          )}
        </Col>
      </div>

      {tree.nodes.get(node.id)?.children.length !== 0 && (
        <Row label={m.hud_debug_leads()}>{(tree.nodes.get(node.id)?.children ?? []).map(c => RESEARCH[c].name).join(' · ')}</Row>
      )}
    </div>
  )
}

function LeafDetail({ leaf, from, tree }: { leaf: Leaf; from: ResearchId; tree: Tree }) {
  const node = tree.nodes.get(from)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-display text-sm">
          {leaf.kind === 'grant' ? leaf.text : leaf.label}
        </span>
        <span className="text-sm text-ink/45">
          {leaf.kind === 'sku' ? m.hud_debug_kind_sku() : leaf.kind === 'skill' ? m.hud_debug_kind_skill() : m.hud_debug_kind_concept()}
        </span>
        {leaf.kind !== 'grant' && <span className="text-sm text-ink/45">{leaf.id}</span>}
      </div>

      {leaf.kind === 'skill' && <div className="text-sm text-ink/75">{leaf.def.blurb}</div>}
      {leaf.kind === 'sku' && (
        <div className="flex flex-wrap gap-6">
          <Stat label={m.hud_debug_price()}>
            <Coin n={leaf.sku.price} />
          </Stat>
          <Stat label={m.hud_debug_shelf()}>
            <span>{leaf.sku.tab}</span>
          </Stat>
        </div>
      )}

      {leaf.kind === 'sku' && (
        <Row label={m.hud_debug_gated()}>
          {skuGates(leaf.id)
            .map(g => `${g.field}: ${RESEARCH[g.research].name}`)
            .join(' · ') || m.hud_debug_open_start()}
        </Row>
      )}
      {leaf.kind !== 'sku' && <Row label={m.hud_debug_gated()}>{RESEARCH[from].name}</Row>}

      {node !== undefined && (
        <div className="flex flex-wrap gap-6">
          <Stat label={m.hud_debug_total_reach({ projects: projects(node.ancestors.length + 1) })}>
            <Coin n={node.totalCost} /> <span className="tabular-nums">{secs(node.totalSeconds)}</span>
          </Stat>
        </div>
      )}
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-ink/45">{label}</span>
      <span className="flex items-center gap-2 text-sm">{children}</span>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 text-ink/45">{label}:</span>
      <span className="text-ink/75">{children}</span>
    </div>
  )
}

function Col({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm font-semibold text-ink/45">{label}</span>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  )
}
