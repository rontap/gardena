import { LUCK_CAP } from '../defs/burrow.ts'
import { SKILLS, SKILL_IDS, type SkillDef } from '../defs/skills.ts'
import type { SkillId } from './ids.ts'
import type { World } from './world.ts'

export function luckOf(w: World): number {
  const n = w.skillTier('lucky')
  return n < LUCK_CAP ? n : LUCK_CAP
}

export function initFamily(w: World): void {
  w.family.owned.clear()
}

export function skillOpen(w: World, id: SkillId): boolean {
  const parent = SKILLS[id].parent
  return parent === null || w.skillTier(parent) >= 1
}

export function skillKnown(w: World, id: SkillId): boolean {
  const parent = SKILLS[id].parent
  return parent === null || skillOpen(w, parent)
}

export function pickSkillBody(w: World, id: SkillId): void {
  if (w.local !== 0) return
  if (!skillKnown(w, id) || !skillOpen(w, id)) return
  const def: SkillDef = SKILLS[id]
  if (def.gate.kind === 'research' && !w.done.has(def.gate.id)) return
  const have = w.skillTier(id)
  if (have >= def.maxTier) return
  const rank = have + 1
  if (w.points < rank) return
  w.points -= rank
  w.family.owned.set(id, rank)
  const effect = def.effect
  if (effect.kind === 'better' && effect.saleMul !== 1) {
    w.modifiers.push({
      id,
      source: 'skill',
      crop: effect.crop,
      saleMul: effect.saleMul,
      growSpeed: 1,
      waterUseMul: 1,
    })
    w.modGen += 1
  }
  w.ping()
}

export function rebuildSkillModifiers(w: World): void {
  const keep = w.modifiers.filter(m => m.source !== 'skill')
  w.modifiers.length = 0
  keep.forEach(m => w.modifiers.push(m))
  w.family.owned.forEach((_tier, id) => {
    const effect = SKILLS[id].effect
    if (effect.kind !== 'better' || effect.saleMul === 1) return
    w.modifiers.push({
      id,
      source: 'skill',
      crop: effect.crop,
      saleMul: effect.saleMul,
      growSpeed: 1,
      waterUseMul: 1,
    })
  })
  w.modGen += 1
}

export function unlockAllSkillsBody(w: World): void {
  SKILL_IDS.forEach(id => {
    w.family.owned.set(id, SKILLS[id].maxTier)
  })
  rebuildSkillModifiers(w)
  w.ping()
}
