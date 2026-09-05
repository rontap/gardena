import { SKILLS, skillIds, type SkillDef } from '../defs/skills.ts'
import type { MemberId, SkillId } from './ids.ts'
import type { MemberState, SkillRef, World } from './world.ts'

const MEMBER_IX: { readonly [K in MemberId]: number } = { player: 0, husband: 1, daughter: 2 }

export function emptyMember<Id extends SkillId>(): MemberState<Id> {
  return { pickCount: 0, owned: new Map(), offers: [] }
}

export function initFamily(w: World): void {
  rerollOffers(w, 'player')
  rerollOffers(w, 'husband')
  rerollOffers(w, 'daughter')
}

export function pickSkillBody(w: World, member: MemberId, slot: number): void {
  const st = w.family[member]
  if (w.points < 1) return
  const offer = st.offers[slot]
  if (offer === undefined) return
  w.points -= 1
  st.owned.set(offer.id as never, offer.tier)
  const effect = SKILLS[offer.id].effect
  if (effect.kind === 'better') {
    w.modifiers.push({
      id: offer.id,
      source: 'skill',
      crop: effect.crop,
      saleMul: effect.saleMul,
      growSpeed: 1,
      waterUseMul: 1,
    })
    w.modGen += 1
  }
  st.pickCount += 1
  rerollOffers(w, member)
  w.ping()
}

export function rebuildSkillModifiers(w: World): void {
  const keep = w.modifiers.filter(m => m.source !== 'skill')
  w.modifiers.length = 0
  keep.forEach(m => w.modifiers.push(m))
  w.family.player.owned.forEach((_tier, id) => {
    const effect = SKILLS[id].effect
    if (effect.kind !== 'better') return
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

export function rerollOffers(w: World, member: MemberId): void {
  const st = w.family[member]
  const pool = skillIds(member).filter(id => skillEligible(w, id))
  const n = Math.min(3, pool.length)
  const left = [...pool]
  const out: SkillRef[] = []
  for (let i = 0; i < n; i++) {
    const u = w.rng.stream('skill').at(MEMBER_IX[member], st.pickCount, i)
    const ix = Math.floor(u * left.length)
    const id = left.splice(ix, 1)[0]
    const have = w.skillTier(id)
    out.push({ id, tier: have + 1 })
  }
  st.offers = out as never
}

export function skillEligible(w: World, id: SkillId): boolean {
  const def: SkillDef = SKILLS[id]
  if (w.skillTier(id) >= def.maxTier) return false
  if (def.gate.kind === 'hidden') return false
  if (def.gate.kind === 'research') return w.done.has(def.gate.id)
  if (def.gate.kind === 'skill') return w.hasSkill(def.gate.id)
  return true
}

export function unlockAllSkillsBody(w: World): void {
  ;(['player', 'husband', 'daughter'] as const).forEach(member => {
    const st = w.family[member]
    skillIds(member).forEach(id => {
      st.owned.set(id as never, SKILLS[id].maxTier)
    })
    st.offers = []
  })
  rebuildSkillModifiers(w)
  w.ping()
}
