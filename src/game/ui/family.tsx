import { useState } from 'react'
import { SKILLS, roman, skillBlurb, skillLabel } from '../defs/skills.ts'
import type { MemberId, SkillId } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { PORTRAIT, SKILL_POINT, skillInner } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Label, Overlay } from './frame.tsx'

const NAMES: { readonly [K in MemberId]: string } = {
  player: 'You',
  husband: 'Husband',
  daughter: 'Daughter',
}

const ROLES: { readonly [K in MemberId]: string } = {
  player: 'Gardener',
  husband: 'Research',
  daughter: 'Market',
}

const BLURBS: { readonly [K in MemberId]: string } = {
  player: 'Works the beds. Speed, tools and the crops themselves.',
  husband: 'Runs the workshop. Research pace, prices and surveys.',
  daughter: 'Minds the stall. Sale value, opening hours and grades.',
}

const MEMBERS: MemberId[] = ['player', 'husband', 'daughter']
const SLOTS = [0, 1, 2] as const

type Tip = { title: string; description: string; why?: string } | undefined

export function Family({ world, onClose }: { world: World; onClose: () => void }) {
  const [tip, setTip] = useState<Tip>(undefined)
  return (
    <Overlay
      title="Family"
      onClose={onClose}
      className="max-h-[calc(100%-4rem)] w-[58rem]"
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
    >
      <div className="grid grid-cols-3 items-start gap-3">
        {MEMBERS.map(m => (
          <MemberCol key={m} member={m} world={world} onTip={setTip} />
        ))}
      </div>
    </Overlay>
  )
}

function MemberCol({
  member,
  world,
  onTip,
}: {
  member: MemberId
  world: World
  onTip: (tip: Tip) => void
}) {
  const st = world.family[member]
  const owned = [...st.owned.entries()]
  const canPick = st.points > 0
  const empty = st.offers.length === 0
  return (
    <div className="flex flex-col bg-ink/6">
      <div className="flex items-center gap-3 bg-ink/10 px-3 py-3">
        <svg
          viewBox="0 0 64 96"
          className="h-20 w-[3.334rem] shrink-0 bg-ink/15"
          dangerouslySetInnerHTML={{ __html: PORTRAIT[member] }}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="font-display text-xs leading-none">{NAMES[member]}</div>
          <div className="text-sm leading-none font-semibold text-ink/60">{ROLES[member]}</div>
          <div className="mt-1 text-xs leading-snug text-ink/50">{BLURBS[member]}</div>
        </div>
      </div>

      <div
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold ${
          canPick ? 'bg-ripe/25 text-ink' : 'text-ink/45'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" dangerouslySetInnerHTML={{ __html: SKILL_POINT }} />
        <span className="tabular-nums">{st.points}</span>
        <span>{st.points === 1 ? 'point to spend' : 'points to spend'}</span>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3">
        <Label>{empty ? 'Nothing left to learn' : 'Choose one'}</Label>
        <div className="flex flex-col gap-1">
          {SLOTS.map(slot => {
            const o = st.offers[slot]
            if (o === undefined) {
              return <div key={slot} className="h-11 bg-ink/5" />
            }
            const label = skillLabel(o.id, o.tier)
            return (
              <button
                key={o.id}
                type="button"
                aria-disabled={!canPick}
                onPointerEnter={() =>
                  onTip({
                    title: label,
                    description: skillBlurb(o.id, o.tier),
                    why: canPick ? undefined : 'No skill point to spend. Finish a day to earn one.',
                  })
                }
                onPointerLeave={() => onTip(undefined)}
                onClick={() => {
                  if (!canPick) return
                  world.pickSkill(member, slot)
                }}
                className={`flex h-11 w-full items-center gap-2 px-2 text-left ${
                  canPick
                    ? 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
                    : 'cursor-default bg-ink/8 text-ink/45'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-6 w-6 shrink-0 ${canPick ? '' : 'opacity-45'}`}
                  dangerouslySetInnerHTML={{ __html: skillInner(o.id) }}
                />
                <span className="min-w-0 flex-1 truncate text-base font-semibold">{label}</span>
              </button>
            )
          })}
        </div>

        <Label>Learned</Label>
        <div className="flex min-h-9 flex-wrap content-start items-start gap-1 bg-ink/5 p-1.5">
          {owned.length === 0 ? (
            <span className="px-1 text-sm leading-6 text-ink/40">None yet</span>
          ) : (
            owned.map(([id, tier]) => <Learned key={id} id={id} tier={tier} onTip={onTip} />)
          )}
        </div>
      </div>
    </div>
  )
}

function Learned({ id, tier, onTip }: { id: SkillId; tier: number; onTip: (tip: Tip) => void }) {
  const label = skillLabel(id, tier)
  const ranked = SKILLS[id].maxTier > 1
  return (
    <span
      className="inline-flex h-7 items-center gap-0.5 bg-ink/10 px-1"
      onPointerEnter={() => onTip({ title: label, description: skillBlurb(id, tier) })}
      onPointerLeave={() => onTip(undefined)}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" dangerouslySetInnerHTML={{ __html: skillInner(id) }} />
      {ranked && <span className="text-xs leading-none font-bold text-ink/70">{roman(tier)}</span>}
    </span>
  )
}
