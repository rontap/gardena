import { m } from '../../paraglide/messages.js'
import { RESEARCH } from '../defs/research.ts'
import type { World } from '../sim/world.ts'
import { TreePanel } from './tree-panel.tsx'

export function Research({ world, onClose }: { world: World; onClose: () => void }) {
  const job = world.job
  return (
    <TreePanel
      world={world}
      onClose={onClose}
      kind="research"
      title={m.names_role_research()}
      footer={
        <div className="text-sm text-ink/55">
          {job.kind === 'run'
            ? m.hud_research_run({ name: RESEARCH[job.id].name, secs: Math.ceil(job.left) })
            : m.hud_research_idle()}
        </div>
      }
    />
  )
}
