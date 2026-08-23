import type { ReactNode } from 'react'
import type { World } from '../sim/world.ts'
import { SKILL_POINT, skillInner } from '../view/svgs.ts'
import { Coin, Dock } from './frame.tsx'

export function Cheat({ world, onClose }: { world: World; onClose: () => void }) {
  return (
    <Dock title="Cheat" onClose={onClose} width="w-80">
      <div className="flex flex-col gap-1.5">
        <Row label="Unlock all instantly" onClick={() => world.unlockAll()} />
        <Row
          label="Research speed 3×"
          icon={skillInner('research-speed')}
          selected={world.cheatFastResearch}
          onClick={() => world.toggleCheatResearch()}
        />
        <Row
          label={
            <span className="inline-flex items-center gap-1">
              Gain <Coin n={200} />
            </span>
          }
          onClick={() => world.cheatMoney()}
        />
        <Row icon={SKILL_POINT} label="Gain 10 skill points" onClick={() => world.cheatPoints()} />
      </div>
    </Dock>
  )
}

function Row({
  label,
  icon,
  selected,
  onClick,
}: {
  label: ReactNode
  icon?: string
  selected?: boolean
  onClick: () => void
}) {
  const on = selected === true
  const face = on
    ? 'cursor-pointer bg-ink text-house'
    : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-3 py-2 text-left ${face}`}>
      {icon !== undefined && (
        <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: icon }} />
      )}
      <span className="min-w-0 flex-1 text-base font-semibold">{label}</span>
    </button>
  )
}
