// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, it } from 'vitest'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { SKILLS } from '../defs/skills.ts'
import type { ResearchId, SkillId, SkuId } from '../sim/ids.ts'
import { buildTree, keyFromDomId, keyOfGrant, keyOfResearch, researchIds } from './techtree.ts'

const tree = buildTree()

describe('techtree', () => {
  it('holds every research exactly once', () => {
    expect(tree.nodes.size).toBe(researchIds().length)
    for (const id of researchIds()) expect(tree.nodes.get(id)?.id).toBe(id)
  })

  it('reaches every research from a root', () => {
    const roots = new Set(tree.roots)
    for (const id of researchIds()) {
      const seen = new Set<ResearchId>([id])
      const queue = [id]
      let hit = roots.has(id)
      while (queue.length > 0 && !hit) {
        const next = queue.shift()
        if (next === undefined) break
        for (const p of tree.nodes.get(next)?.parents ?? []) {
          if (seen.has(p)) continue
          seen.add(p)
          if (roots.has(p)) hit = true
          queue.push(p)
        }
      }
      expect(hit, id).toBe(true)
    }
  })

  it('has no cycles', () => {
    for (const id of researchIds()) {
      expect(tree.nodes.get(id)?.ancestors).not.toContain(id)
    }
  })

  it('attaches every research-gated sku to its unlock research', () => {
    for (const id of Object.keys(SKUS) as SkuId[]) {
      const sku = SKUS[id]
      const hits = [...tree.nodes.values()].flatMap(n =>
        n.leaves.filter(l => l.kind === 'sku' && l.id === id).map(l => ({ n, l })),
      )
      const primary = hits.filter(h => h.l.kind === 'sku' && !h.l.second)
      if (sku.unlock === 'start') expect(primary.length, id).toBe(0)
      else {
        expect(primary.length, id).toBe(1)
        expect(primary[0].n.id).toBe(sku.unlock)
      }
      const second = hits.filter(h => h.l.kind === 'sku' && h.l.second)
      const needs = sku.need === 'prize' ? [] : sku.need.filter(r => r !== sku.unlock)
      expect(second.length, id).toBe(needs.length)
      expect(second.map(h => h.n.id).sort(), id).toEqual([...needs].sort())
    }
  })

  it('attaches every research-gated skill', () => {
    for (const id of Object.keys(SKILLS) as SkillId[]) {
      const gate = SKILLS[id].gate
      if (gate.kind !== 'research') continue
      const leaves = tree.nodes.get(gate.id)?.leaves ?? []
      expect(leaves.some(l => l.kind === 'skill' && l.id === id), id).toBe(true)
    }
  })

  it('attaches every grant', () => {
    for (const id of researchIds()) {
      const grants = (tree.nodes.get(id)?.leaves ?? []).filter(l => l.kind === 'grant')
      expect(grants.length, id).toBe(RESEARCH[id].grants.length)
    }
  })

  it('counts a diamond ancestor once', () => {
    const n = tree.nodes.get('unlock-smart-irrigation')
    expect(n?.parents).toEqual(expect.arrayContaining(['unlock-sensors', 'unlock-adv-irrigation']))
    expect(n?.ancestors.slice().sort()).toEqual(
      ['unlock-adv-irrigation', 'unlock-auto-irrigation', 'unlock-irrigation', 'unlock-sensors'].sort(),
    )
    const sum = (f: 'cost' | 'seconds') =>
      RESEARCH['unlock-smart-irrigation'][f] +
      RESEARCH['unlock-sensors'][f] +
      RESEARCH['unlock-adv-irrigation'][f] +
      RESEARCH['unlock-auto-irrigation'][f] +
      RESEARCH['unlock-irrigation'][f]
    expect(n?.totalCost).toBe(sum('cost'))
    expect(n?.totalSeconds).toBe(sum('seconds'))
  })

  it('charges a root only its own cost', () => {
    for (const id of tree.roots) {
      expect(tree.nodes.get(id)?.totalCost).toBe(RESEARCH[id].cost)
      expect(tree.nodes.get(id)?.totalSeconds).toBe(RESEARCH[id].seconds)
    }
  })

  it('round-trips every node key through the mermaid dom id', () => {
    const keys = [
      ...researchIds().map(keyOfResearch),
      ...researchIds().flatMap(id => RESEARCH[id].grants.map((_, i) => keyOfGrant(id, i))),
    ]
    for (const k of keys) {
      expect(keyFromDomId(`flowchart-${k}-0`), k).toBe(k)
      expect(keyFromDomId(`tt-a1b2c3-flowchart-${k}-17`), k).toBe(k)
    }
  })
})
