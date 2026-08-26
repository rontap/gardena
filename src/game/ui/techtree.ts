import { RESEARCH, SKUS } from '../defs/research.ts'
import type { ResearchDef, Sku } from '../defs/research.ts'
import { SKILLS } from '../defs/skills.ts'
import type { SkillDef } from '../defs/skills.ts'
import { skuLabel } from '../sim/item.ts'
import type { ResearchId, SkillId, SkuId } from '../sim/ids.ts'

export type Leaf =
  | { kind: 'sku'; id: SkuId; label: string; sku: Sku; second: boolean }
  | { kind: 'skill'; id: SkillId; label: string; def: SkillDef }
  | { kind: 'grant'; text: string }

export type Node = {
  id: ResearchId
  def: ResearchDef
  parents: ResearchId[]
  children: ResearchId[]
  leaves: Leaf[]
  ancestors: ResearchId[]
  totalCost: number
  totalSeconds: number
}

export type Tree = { nodes: Map<ResearchId, Node>; roots: ResearchId[]; trees: string[] }

export const researchIds = (): ResearchId[] => Object.keys(RESEARCH) as ResearchId[]

function parentsOf(def: ResearchDef): ResearchId[] {
  return [...new Set([...def.reveal, ...def.requires])]
}

/** Every distinct research that must finish before `id` can start, walking both edge kinds. */
function ancestorsOf(id: ResearchId, seen: Set<ResearchId>): ResearchId[] {
  const out: ResearchId[] = []
  const queue = [...parentsOf(RESEARCH[id])]
  while (queue.length > 0) {
    const next = queue.shift()
    if (next === undefined || seen.has(next)) continue
    seen.add(next)
    out.push(next)
    queue.push(...parentsOf(RESEARCH[next]))
  }
  return out
}

export function buildTree(): Tree {
  const nodes = new Map<ResearchId, Node>()
  for (const id of researchIds()) {
    const def = RESEARCH[id]
    const ancestors = ancestorsOf(id, new Set([id]))
    nodes.set(id, {
      id,
      def,
      parents: parentsOf(def),
      children: [],
      leaves: def.grants.map(text => ({ kind: 'grant', text }) as Leaf),
      ancestors,
      totalCost: ancestors.reduce((n, a) => n + RESEARCH[a].cost, def.cost),
      totalSeconds: ancestors.reduce((n, a) => n + RESEARCH[a].seconds, def.seconds),
    })
  }

  for (const node of nodes.values()) {
    for (const p of node.parents) nodes.get(p)?.children.push(node.id)
  }

  for (const id of Object.keys(SKUS) as SkuId[]) {
    const sku = SKUS[id]
    const label = skuLabel(id)
    if (sku.unlock !== 'start') {
      nodes.get(sku.unlock)?.leaves.push({ kind: 'sku', id, label, sku, second: false })
    }
    if (sku.need !== 'prize') {
      for (const r of sku.need) {
        if (r !== sku.unlock) nodes.get(r)?.leaves.push({ kind: 'sku', id, label, sku, second: true })
      }
    }
  }

  for (const id of Object.keys(SKILLS) as SkillId[]) {
    const def: SkillDef = SKILLS[id]
    if (def.gate.kind !== 'research') continue
    nodes.get(def.gate.id)?.leaves.push({ kind: 'skill', id, label: def.name, def })
  }

  const roots = researchIds().filter(id => nodes.get(id)?.parents.length === 0)
  const trees = [...new Set(researchIds().map(id => RESEARCH[id].tree))]
  return { nodes, roots, trees }
}

/** Which research gates a sku, and through which field. Empty when it is open from the start. */
export function skuGates(id: SkuId): { field: 'unlock' | 'show' | 'need'; research: ResearchId }[] {
  const sku = SKUS[id]
  const out: { field: 'unlock' | 'show' | 'need'; research: ResearchId }[] = []
  if (sku.unlock !== 'start') out.push({ field: 'unlock', research: sku.unlock })
  if (sku.show !== 'start') out.push({ field: 'show', research: sku.show })
  if (sku.need !== 'prize') for (const r of sku.need) out.push({ field: 'need', research: r })
  return out
}

export const KEY_START = 'start'
export const keyOfResearch = (id: ResearchId): string => `r_${safe(id)}`
export const keyOfSku = (id: SkuId): string => `sku_${safe(id)}`
export const keyOfSkill = (id: SkillId): string => `skill_${safe(id)}`
export const keyOfGrant = (id: ResearchId, i: number): string => `grant_${safe(id)}_${i}`

/**
 * Mermaid rewrites a node key into a DOM id of the form `<renderId>-flowchart-<key>-<n>`, so a
 * key that ends in `-<digits>` cannot be recovered. Grant keys use `_` before the index for that.
 */
export function keyFromDomId(domId: string): string {
  return domId.replace(/^.*?flowchart-/, '').replace(/-\d+$/, '')
}

function safe(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, '_')
}
