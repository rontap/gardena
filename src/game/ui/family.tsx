import { m } from '../../paraglide/messages.js'
import { SKILLS } from '../defs/skills.ts'
import { luckOf } from '../sim/family.ts'
import { REP_MAX } from '../sim/feature-contracts/market.ts'
import type { World } from '../sim/world.ts'
import { SKILL_POINT, STAT_LUCK, STAT_REPUTATION } from '../view/svgs.ts'
import { Bar } from './frame.tsx'
import { TreePanel } from './tree-panel.tsx'

export function Family({ world, onClose }: { world: World; onClose: () => void }) {
  const n = world.points
  return (
    <TreePanel
      world={world}
      onClose={onClose}
      kind="skill"
      title={m.family_title()}
      header={<Standing world={world} />}
      footer={
        <div className={`flex items-center gap-1.5 text-sm ${n > 0 ? 'font-semibold text-ink' : 'text-ink/55'}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" dangerouslySetInnerHTML={{ __html: SKILL_POINT }} />
          <span className="tabular-nums">{n}</span>
          <span>{n === 1 ? m.family_point_one() : m.family_point_many()}</span>
        </div>
      }
    />
  )
}

function Standing({ world }: { world: World }) {
  const rep = Math.round(world.contracts.rep * 10) / 10
  const luck = luckOf(world)
  return (
    <div className="grid shrink-0 grid-cols-2 gap-1">
      <div className="flex items-center gap-2 bg-ink/6 px-2 py-1.5">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" dangerouslySetInnerHTML={{ __html: STAT_REPUTATION }} />
        <span className="min-w-0 truncate text-sm font-semibold">{m.family_reputation()}</span>
        <span className="ml-auto w-16 shrink-0">
          <Bar value={rep / REP_MAX} color="bg-ripe" />
        </span>
      </div>
      <div className="flex items-center gap-2 bg-ink/6 px-2 py-1.5">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" dangerouslySetInnerHTML={{ __html: STAT_LUCK }} />
        <span className="min-w-0 truncate text-sm font-semibold">{m.family_luck()}</span>
        <span className="ml-auto w-16 shrink-0">
          <Bar value={luck / SKILLS.lucky.maxTier} color="bg-ripe" />
        </span>
      </div>
    </div>
  )
}
