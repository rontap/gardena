import { m } from '../../paraglide/messages.js'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import mermaid from 'mermaid'
import { RESEARCH } from '../defs/research.ts'
import { SKILLS, SKILL_IDS, skillBlurb, skillLabel } from '../defs/skills.ts'
import type { ResearchId, SkillId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import {
  researchInner,
  skillInner,
  skuInner,
  SKILL_UNKNOWN,
  SKILL_POINT,
  UI_COIN,
} from '../view/svgs.ts'
import { Bar, Btn, Coin, FullDock } from './frame.tsx'
import { buildTree, keyFromDomId, keyOfResearch, keyOfSkill, type Leaf } from './techtree.ts'

const token = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#1c1710'

const ICON = 36

function bootMermaid(): void {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    htmlLabels: true,
    theme: 'base',
    maxTextSize: 500000,
    flowchart: { htmlLabels: true, curve: 'stepAfter', nodeSpacing: 26, rankSpacing: 48, padding: 1 },
    themeVariables: {
      fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif',
      fontSize: '14px',
      background: 'transparent',
      primaryColor: token('--color-dirt'),
      primaryTextColor: token('--color-house'),
      primaryBorderColor: token('--color-ink'),
      lineColor: token('--color-ink'),
      textColor: token('--color-ink'),
      clusterBkg: 'transparent',
      clusterBorder: 'transparent',
      nodeBorder: token('--color-ink'),
    },
  })
}

function svgImg(inner: string, size: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">${inner}</svg>`
  const src = `data:image/svg+xml,${encodeURIComponent(svg).replace(/[[\]]/g, c => (c === '[' ? '%5B' : '%5D'))}`
  return (
    `<div style='width:${size}px;height:${size}px;flex-shrink:0;overflow:hidden'>` +
    `<img src='${src}' width='${size}' height='${size}' alt='' style='width:${size}px;height:${size}px;display:block'/>` +
    `</div>`
  )
}

function pinLabelImages(root: HTMLElement): void {
  root.querySelectorAll('.nodeLabel img').forEach(el => {
    const img = el as HTMLImageElement
    const w = img.getAttribute('width') ?? String(ICON)
    img.style.width = `${w}px`
    img.style.height = `${w}px`
    img.style.maxWidth = `${w}px`
    img.style.minWidth = `${w}px`
    img.style.display = 'block'
  })
}

function sizeSvgs(root: HTMLElement): void {
  root.querySelectorAll('svg').forEach(s => {
    const vb = s.getAttribute('viewBox')
    if (vb === null) return
    const p = vb.trim().split(/[\s,]+/).map(Number)
    const w = p[2]
    const h = p[3]
    if (w === undefined || h === undefined || !(w > 0) || !(h > 0)) return
    s.removeAttribute('width')
    s.style.width = `${w}px`
    s.style.height = `${h}px`
    s.style.maxWidth = 'none'
  })
}

function nodePort(g: SVGGElement): { left: number; right: number; midY: number } | undefined {
  const rect = g.querySelector('rect')
  if (rect === null) return undefined
  const tr = g.getAttribute('transform') ?? ''
  const m = /translate\(\s*([-\d.]+)(?:[,\s]+)([-\d.]+)/.exec(tr)
  const cx = m === null ? 0 : Number(m[1])
  const cy = m === null ? 0 : Number(m[2])
  const w = Number(rect.getAttribute('width'))
  const h = Number(rect.getAttribute('height'))
  if (!(w > 0) || !(h > 0)) return undefined
  const rx = Number(rect.getAttribute('x') ?? 0)
  const ry = Number(rect.getAttribute('y') ?? 0)
  const left = cx + rx
  return { left, right: left + w, midY: cy + ry + h / 2 }
}

function pathEnds(d: string): { sx: number; sy: number; ex: number; ey: number } | undefined {
  const nums = [...d.matchAll(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)].map(n => Number(n[0]))
  if (nums.length < 4) return undefined
  const sx = nums[0]
  const sy = nums[1]
  const ex = nums[nums.length - 2]
  const ey = nums[nums.length - 1]
  if (sx === undefined || sy === undefined || ex === undefined || ey === undefined) return undefined
  return { sx, sy, ex, ey }
}

function routeLEdges(root: HTMLElement): void {
  root.querySelectorAll('svg').forEach(svg => {
    const ports = [...svg.querySelectorAll('g.node')].flatMap(g => {
      const p = nodePort(g as SVGGElement)
      return p === undefined ? [] : [p]
    })
    if (ports.length < 2) return
    svg.querySelectorAll('.edgePath path, path.flowchart-link').forEach(el => {
      const d = el.getAttribute('d')
      if (d === null) return
      const ends = pathEnds(d)
      if (ends === undefined) return
      let src = ports[0]
      let tgt = ports[0]
      if (src === undefined || tgt === undefined) return
      let srcD = Infinity
      let tgtD = Infinity
      for (const p of ports) {
        const ds = (p.right - ends.sx) ** 2 + (p.midY - ends.sy) ** 2
        const dt = (p.left - ends.ex) ** 2 + (p.midY - ends.ey) ** 2
        if (ds < srcD) {
          srcD = ds
          src = p
        }
        if (dt < tgtD) {
          tgtD = dt
          tgt = p
        }
      }
      if (src === tgt) return
      const midX = (src.right + tgt.left) / 2
      const endX = tgt.left - 12
      el.setAttribute(
        'd',
        `M ${src.right} ${src.midY} L ${midX} ${src.midY} L ${midX} ${tgt.midY} L ${endX} ${tgt.midY}`,
      )
    })
  })
}

function paintPick(root: HTMLElement, pick: Pick | undefined): void {
  const key =
    pick === undefined ? undefined : pick.kind === 'research' ? keyOfResearch(pick.id) : keyOfSkill(pick.id)
  root.querySelectorAll('g.node').forEach(g => {
    const on = key !== undefined && keyFromDomId(g.id) === key
    g.classList.toggle('picked', on)
    const thin = g.classList.contains('gated') || g.classList.contains('mystery')
    g.querySelectorAll('rect').forEach(r => {
      ;(r as SVGRectElement).style.setProperty('stroke-width', on ? '4px' : thin ? '1px' : '2px', 'important')
    })
  })
}

function escText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function cssRgb(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const n = parseInt(h, 16)
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`
}

function cardHtml(iconInner: string, name: string, meta: string, color: string): string {
  return (
    `<div style='display:flex;align-items:center;gap:4px;width:224px;height:56px;padding:1px 4px;color:${cssRgb(color)};font-family:Nunito,sans-serif'>` +
    svgImg(iconInner, ICON) +
    `<div style='display:flex;flex-direction:column;justify-content:center;min-width:0;flex:1;text-align:left;gap:1px'>` +
    `<div style='font-size:14px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>${escText(name)}</div>` +
    `<div style='font-size:13px;display:flex;align-items:center;gap:4px;line-height:1.2;min-height:1em'>${meta}</div>` +
    `</div></div>`
  )
}

function coinMeta(cost: number, seconds: number): string {
  return `${svgImg(UI_COIN, 12)}${cost}<span style='opacity:.7'>${seconds}s</span>`
}

function pointsMeta(n: number): string {
  return `${svgImg(SKILL_POINT, 12)}${escText(m.family_rank_cost({ n }))}`
}

type Face = 'mystery' | 'done' | 'run' | 'open' | 'gated'

function researchFace(world: World, id: ResearchId): Face {
  if (!world.researchKnown(id)) return 'mystery'
  if (world.done.has(id)) return 'done'
  if (world.job.kind === 'run' && world.job.id === id) return 'run'
  if (!world.researchOpen(id) || world.job.kind === 'run' || world.money < RESEARCH[id].cost) return 'gated'
  return 'open'
}

function skillFace(world: World, id: SkillId): Face {
  const def = SKILLS[id]
  if (!world.skillKnown(id)) return 'mystery'
  if (world.skillTier(id) >= def.maxTier) return 'done'
  const next = world.skillTier(id) + 1
  const locked = def.gate.kind === 'research' && !world.done.has(def.gate.id)
  if (!world.skillOpen(id) || locked || world.local !== 0 || world.points < next) return 'gated'
  return 'open'
}

function ink(): string {
  return token('--color-ink')
}
function house(): string {
  return token('--color-house')
}

function researchCard(world: World, id: ResearchId): { html: string; face: Face } {
  const face = researchFace(world, id)
  const d = RESEARCH[id]
  if (face === 'mystery') {
    return { face, html: cardHtml(SKILL_UNKNOWN, m.research_unknown_name(), '', ink()) }
  }
  const icon = researchInner(id)
  const color = face === 'run' ? house() : ink()
  if (face === 'done') return { face, html: cardHtml(icon, d.name, escText(m.hud_done()), color) }
  if (face === 'run' && world.job.kind === 'run') {
    return { face, html: cardHtml(icon, d.name, coinMeta(d.cost, Math.ceil(world.job.left)), color) }
  }
  return { face, html: cardHtml(icon, d.name, coinMeta(d.cost, d.seconds), color) }
}

function skillCard(world: World, id: SkillId): { html: string; face: Face } {
  const face = skillFace(world, id)
  const def = SKILLS[id]
  const have = world.skillTier(id)
  if (face === 'mystery') {
    return { face, html: cardHtml(SKILL_UNKNOWN, m.skills_unknown_name(), '', ink()) }
  }
  const icon = skillInner(id)
  const color = face === 'run' ? house() : ink()
  if (face === 'done') return { face, html: cardHtml(icon, def.name, escText(m.hud_done()), color) }
  return { face, html: cardHtml(icon, skillLabel(id, have + 1), pointsMeta(have + 1), color) }
}

function classDefs(): string[] {
  const parch = token('--color-parch')
  const houseC = house()
  const inkC = ink()
  return [
    `  classDef open fill:${parch},stroke:${inkC},color:${inkC},stroke-width:2px`,
    `  classDef done fill:#4a9e32,stroke:${inkC},color:${inkC},stroke-width:2px`,
    `  classDef run fill:${inkC},stroke:${inkC},color:${houseC},stroke-width:2px`,
    `  classDef gated fill:#d6d6d6,stroke:${inkC},color:${inkC},stroke-width:1px`,
    `  classDef mystery fill:none,stroke:${inkC},color:${inkC},stroke-width:1px,stroke-dasharray:4 3`,
  ]
}

type Group = { body: string[]; edges: string[] }

function emitGraphs(groups: Iterable<Group>): string[] {
  return [...groups].map(g => ['flowchart LR', ...g.body, ...g.edges, ...classDefs()].join('\n'))
}

function researchSrc(world: World): string[] {
  const tree = buildTree()
  const groups = new Map<string, Group>()
  for (const n of tree.nodes.values()) {
    const key = keyOfResearch(n.id)
    const { html, face } = researchCard(world, n.id)
    const g = groups.get(n.def.path)
    const row = [`    ${key}["${html}"]`, `    class ${key} ${face}`]
    if (g === undefined) {
      groups.set(n.def.path, { body: row, edges: [] })
    } else g.body.push(...row)
  }
  for (const n of tree.nodes.values()) {
    const g = groups.get(n.def.path)
    if (g === undefined) continue
    const key = keyOfResearch(n.id)
    for (const p of n.parents) g.edges.push(`    ${keyOfResearch(p)} --> ${key}`)
  }
  return emitGraphs(groups.values())
}

function skillRoot(id: SkillId): SkillId {
  let cur = id
  let p = SKILLS[cur].parent
  while (p !== null) {
    cur = p
    p = SKILLS[cur].parent
  }
  return cur
}

function skillSrc(world: World): string[] {
  const groups = new Map<SkillId, Group>()
  for (const id of SKILL_IDS) {
    const root = skillRoot(id)
    const key = keyOfSkill(id)
    const { html, face } = skillCard(world, id)
    const row = [`    ${key}["${html}"]`, `    class ${key} ${face}`]
    const g = groups.get(root)
    if (g === undefined) groups.set(root, { body: row, edges: [] })
    else g.body.push(...row)
  }
  for (const id of SKILL_IDS) {
    const p = SKILLS[id].parent
    if (p === null) continue
    const g = groups.get(skillRoot(id))
    if (g === undefined) continue
    g.edges.push(`    ${keyOfSkill(p)} --> ${keyOfSkill(id)}`)
  }
  return emitGraphs(groups.values())
}

export type Pick =
  | { kind: 'research'; id: ResearchId }
  | { kind: 'skill'; id: SkillId }

function pickFromKey(key: string): Pick | undefined {
  if (key.startsWith('r_')) {
    const id = key.slice(2).replace(/_/g, '-') as ResearchId
    if (id in RESEARCH) return { kind: 'research', id }
    return undefined
  }
  if (key.startsWith('skill_')) {
    const id = key.slice(6).replace(/_/g, '-') as SkillId
    if (id in SKILLS) return { kind: 'skill', id }
    return undefined
  }
  return undefined
}

function samePick(a: Pick | undefined, b: Pick | undefined): boolean {
  if (a === undefined || b === undefined || a.kind !== b.kind) return false
  if (a.kind === 'research' && b.kind === 'research') return a.id === b.id
  if (a.kind === 'skill' && b.kind === 'skill') return a.id === b.id
  return false
}

const Graph = memo(function Graph({
  svgs,
  err,
  box,
}: {
  svgs: string[]
  err: string | undefined
  box: RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={box} className="tp-graph scroll-pane min-h-0 overflow-auto [&_g.node]:cursor-pointer [&_svg]:bg-transparent">
      {err !== undefined ? <div className="text-sm text-roof">{err}</div> : null}
      <div className="flex flex-col items-start gap-2">
        {svgs.map((svg, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: svg }} />
        ))}
      </div>
    </div>
  )
})

export function TreePanel({
  world,
  onClose,
  kind,
  title,
  header,
  footer,
}: {
  world: World
  onClose: () => void
  kind: 'research' | 'skill'
  title: string
  header?: ReactNode
  footer?: ReactNode
}) {
  const [svgs, setSvgs] = useState<string[]>([])
  const [err, setErr] = useState<string | undefined>(undefined)
  const [pick, setPick] = useState<Pick | undefined>(undefined)
  const [peek, setPeek] = useState<Pick | undefined>(undefined)
  const box = useRef<HTMLDivElement>(null)
  const shown = peek ?? pick
  const stamp =
    kind === 'research'
      ? `${[...world.done].join(',')}|${world.job.kind === 'run' ? world.job.id : ''}|${world.money}`
      : `${[...world.family.owned.entries()].map(([id, t]) => `${id}:${t}`).join(',')}|${world.points}|${[...world.done].join(',')}`
  const graphs = useMemo(
    () => (kind === 'research' ? researchSrc(world) : skillSrc(world)),
    [kind, stamp],
  )

  useEffect(() => {
    bootMermaid()
    let dead = false
    const nonce = Math.random().toString(36).slice(2)
    Promise.all(graphs.map((src, i) => mermaid.render(`tp-${nonce}-${i}`, src)))
      .then(rs => {
        if (dead) return
        setErr(undefined)
        setSvgs(rs.map(r => r.svg))
      })
      .catch((e: unknown) => {
        if (!dead) setErr(String(e))
      })
    return () => {
      dead = true
    }
  }, [graphs])

  useLayoutEffect(() => {
    const el = box.current
    if (el === null) return
    pinLabelImages(el)
    sizeSvgs(el)
    routeLEdges(el)
  }, [svgs])

  useLayoutEffect(() => {
    const el = box.current
    if (el === null) return
    paintPick(el, pick)
  }, [svgs, pick])

  useEffect(() => {
    const el = box.current
    if (el === null) return
    const nodes = [...el.querySelectorAll('g.node')]
    const onEnter = (e: Event) => {
      const d = pickFromKey(keyFromDomId((e.currentTarget as Element).id))
      setPeek(p => (samePick(p, d) ? p : d))
    }
    const onLeave = () => setPeek(undefined)
    const onDown = (e: Event) => {
      const d = pickFromKey(keyFromDomId((e.currentTarget as Element).id))
      if (d === undefined) return
      setPick(p => (samePick(p, d) ? p : d))
      paintPick(el, d)
    }
    const onDbl = (e: Event) => {
      const d = pickFromKey(keyFromDomId((e.currentTarget as Element).id))
      if (d?.kind !== 'research') return
      setPick(d)
      paintPick(el, d)
      world.startResearch(d.id)
    }
    for (const n of nodes) {
      n.addEventListener('pointerenter', onEnter)
      n.addEventListener('pointerleave', onLeave)
      n.addEventListener('pointerdown', onDown)
      n.addEventListener('dblclick', onDbl)
    }
    return () => {
      for (const n of nodes) {
        n.removeEventListener('pointerenter', onEnter)
        n.removeEventListener('pointerleave', onLeave)
        n.removeEventListener('pointerdown', onDown)
        n.removeEventListener('dblclick', onDbl)
      }
    }
  }, [svgs])

  return (
    <FullDock title={title} onClose={onClose} footer={footer}>
      {header}
      <div className={`grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_22rem] gap-3 ${header !== undefined ? 'mt-2' : ''}`}>
        <Graph svgs={svgs} err={err} box={box} />
        <Detail world={world} shown={shown} pick={pick} />
      </div>
    </FullDock>
  )
}

function Detail({
  world,
  shown,
  pick,
}: {
  world: World
  shown: Pick | undefined
  pick: Pick | undefined
}) {
  if (shown === undefined) {
    return (
      <div className="flex min-h-0 flex-col border-l border-ink/15 pl-3">
        <div className="text-sm text-ink/40">{m.hud_debug_hover()}</div>
      </div>
    )
  }
  const armed = samePick(shown, pick)
  if (shown.kind === 'research') return <ResearchDetail world={world} id={shown.id} armed={armed} />
  return <SkillDetail world={world} id={shown.id} armed={armed} />
}

function ResearchDetail({ world, id, armed }: { world: World; id: ResearchId; armed: boolean }) {
  const d = RESEARCH[id]
  const known = world.researchKnown(id)
  const done = world.done.has(id)
  const open = world.researchOpen(id)
  const job = world.job
  const run = job.kind === 'run' && job.id === id
  const busy = job.kind === 'run' && !run
  const poor = world.money < d.cost
  const can = known && open && !done && !run && !busy && !poor
  const why = !known
    ? undefined
    : done
      ? m.hud_already_researched()
      : run
        ? m.hud_running_now()
        : !open && d.parent !== null
          ? m.hud_needs_first({ names: RESEARCH[d.parent].name })
          : busy
            ? m.hud_another_project()
            : poor
              ? m.hud_not_enough_money()
              : undefined
  const tree = buildTree()
  const node = tree.nodes.get(id)
  const leaves = node === undefined ? [] : node.leaves
  const skus = leaves.filter((l: Leaf): l is Extract<Leaf, { kind: 'sku' }> => l.kind === 'sku' && !l.second)
  const skills = leaves.filter((l: Leaf): l is Extract<Leaf, { kind: 'skill' }> => l.kind === 'skill')
  const grants = leaves.filter((l: Leaf): l is Extract<Leaf, { kind: 'grant' }> => l.kind === 'grant')
  const kids = node === undefined ? [] : node.children
  return (
    <div className="flex min-h-0 flex-col border-l border-ink/15 pl-3">
      <div className="scroll-pane min-h-0 flex-1 overflow-y-auto">
        <div className="font-display text-lg leading-tight">{known ? d.name : m.research_unknown_name()}</div>
        {known ? (
          <>
            <div className="mt-3 flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-ink/45">{m.hud_cost()}</span>
                <Coin n={d.cost} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ink/45">{m.hud_time()}</span>
                <span className="tabular-nums">{m.hud_secs({ secs: d.seconds })}</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-ink/75">{d.blurb}</div>
            <div className="my-3 border-t border-ink/15" />
            {skus.length + grants.length > 0 && (
              <UnlockBlock title={m.hud_unlocks()}>
                {skus.map(l => (
                  <UnlockRow key={l.id} tint="bg-parch" icon={skuInner(l.id)} label={l.label} />
                ))}
                {grants.map(l => (
                  <UnlockRow key={l.text} tint="bg-ripe/25" label={l.text} />
                ))}
              </UnlockBlock>
            )}
            {skills.length > 0 && (
              <UnlockBlock title={m.hud_unlocks_skills()}>
                {skills.map(l => (
                  <UnlockRow key={l.id} tint="bg-leaf/30" icon={skillInner(l.id)} label={l.label} />
                ))}
              </UnlockBlock>
            )}
            {kids.length > 0 && (
              <UnlockBlock title={m.hud_unlocks_research()}>
                {kids.map(cid => (
                  <UnlockRow
                    key={cid}
                    tint="bg-dirt/25"
                    icon={researchInner(cid)}
                    label={world.researchKnown(cid) ? RESEARCH[cid].name : m.research_unknown_name()}
                  />
                ))}
              </UnlockBlock>
            )}
          </>
        ) : (
          <div className="mt-3 text-sm text-ink/55">{m.research_unknown_blurb()}</div>
        )}
        {why !== undefined && <div className="mt-3 text-sm font-bold text-roof">{why}</div>}
      </div>
      <div className="mt-auto shrink-0 border-t border-ink/15 pt-3">
        {job.kind === 'run' ? (
          <div>
            <div className="mb-1.5 truncate text-sm">
              {RESEARCH[job.id].name}
              <span className="text-ink/55"> · {m.hud_secs({ secs: Math.ceil(job.left) })}</span>
            </div>
            <Bar
              value={(RESEARCH[job.id].seconds - job.left) / RESEARCH[job.id].seconds}
              color="bg-leaf"
              className="h-3"
            />
          </div>
        ) : (
          <Btn disabled={!armed || !can} className="w-full" onClick={() => world.startResearch(id)}>
            {m.names_role_research()}
          </Btn>
        )}
      </div>
    </div>
  )
}

function SkillDetail({ world, id, armed }: { world: World; id: SkillId; armed: boolean }) {
  const def = SKILLS[id]
  const known = world.skillKnown(id)
  const have = world.skillTier(id)
  const done = have >= def.maxTier
  const next = have + 1
  const locked = def.gate.kind === 'research' && !world.done.has(def.gate.id)
  const gated = !world.skillOpen(id)
  const guest = world.local !== 0
  const poor = world.points < next
  const can = known && !done && !locked && !gated && !guest && !poor
  const why = !known
    ? undefined
    : guest
      ? m.family_guest_pick()
      : done
        ? m.hud_done()
        : locked && def.gate.kind === 'research'
          ? m.hud_needs_first({ names: RESEARCH[def.gate.id].name })
          : gated && def.parent !== null
            ? m.hud_needs_first({ names: SKILLS[def.parent].name })
            : poor
              ? m.family_need_points({ n: next })
              : undefined
  const kids = SKILL_IDS.filter(s => SKILLS[s].parent === id)
  return (
    <div className="flex min-h-0 flex-col border-l border-ink/15 pl-3">
      <div className="scroll-pane min-h-0 flex-1 overflow-y-auto">
        <div className="font-display text-lg leading-tight">
          {known ? (done ? def.name : skillLabel(id, next)) : m.skills_unknown_name()}
        </div>
        {known ? (
          <>
            <div className="mt-3 flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-ink/45">{m.hud_cost()}</span>
                <span className="tabular-nums">{done ? m.hud_done() : m.family_rank_cost({ n: next })}</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-ink/75">{skillBlurb(id, done ? have : next)}</div>
            <div className="my-3 border-t border-ink/15" />
            {kids.length > 0 && (
              <UnlockBlock title={m.hud_unlocks_skills()}>
                {kids.map(cid => (
                  <UnlockRow
                    key={cid}
                    tint="bg-leaf/30"
                    icon={skillInner(cid)}
                    label={world.skillKnown(cid) ? SKILLS[cid].name : m.skills_unknown_name()}
                  />
                ))}
              </UnlockBlock>
            )}
          </>
        ) : (
          <div className="mt-3 text-sm text-ink/55">{m.skills_unknown_blurb()}</div>
        )}
        {why !== undefined && <div className="mt-3 text-sm font-bold text-roof">{why}</div>}
      </div>
      <div className="mt-auto shrink-0 border-t border-ink/15 pt-3">
        <Btn disabled={!armed || !can} className="w-full" onClick={() => world.pickSkill(id)}>
          {m.hud_get_skill()}
        </Btn>
      </div>
    </div>
  )
}

function UnlockBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="text-sm font-semibold text-ink/45">{title}</div>
      <div className="mt-1.5 flex flex-col gap-1">{children}</div>
    </div>
  )
}

function UnlockRow({ tint, icon, label }: { tint: string; icon?: string; label: string }) {
  return (
    <div className={`flex items-start gap-2 px-2 py-1.5 ${tint}`}>
      {icon !== undefined && (
        <svg viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0" dangerouslySetInnerHTML={{ __html: icon }} />
      )}
      <span className="min-w-0 text-sm leading-snug break-words">{label}</span>
    </div>
  )
}
