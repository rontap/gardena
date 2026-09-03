import { m } from '../../paraglide/messages.js'
import type { ReactNode } from 'react'
import { WEATHER_KINDS, WEATHER_NAME } from '../defs/weather.ts'
import type { World } from '../sim/world.ts'
import { SKILL_POINT, skillInner } from '../view/svgs.ts'
import { Coin, Dock } from './frame.tsx'

export function Cheat({ world, onClose }: { world: World; onClose: () => void }) {
  return (
    <Dock title={m.hud_cheat()} onClose={onClose} width="w-80">
      <div className="flex flex-col gap-1.5">
        <Row label={m.hud_cheat_unlock()} onClick={() => world.unlockAll()} />
        <Row label={m.hud_cheat_unlock_skills()} onClick={() => world.unlockAllSkills()} />
        <Row
          label={m.hud_cheat_research({ n: 3 })}
          icon={skillInner('research-speed')}
          selected={world.cheatFastResearch}
          onClick={() => world.toggleCheatResearch()}
        />
        <div className="flex gap-1.5">
          <Row
            className="flex-[2]"
            label={m.hud_cheat_speed_1()}
            selected={world.cheatSpeed === 1}
            onClick={() => world.setCheatSpeed(1)}
          />
          <Row
            className="flex-[2]"
            label={m.hud_cheat_speed_3()}
            selected={world.cheatSpeed === 3}
            onClick={() => world.setCheatSpeed(3)}
          />
        </div>
        <Row
          label={
            <span className="inline-flex items-center gap-1">
              {m.hud_cheat_money()}
              <Coin n={200} />
            </span>
          }
          onClick={() => world.cheatMoney()}
        />
        <Row icon={SKILL_POINT} label={m.hud_cheat_points({ n: 10 })} onClick={() => world.cheatPoints()} />
        <Row label={m.hud_cheat_end_day()} onClick={() => world.endDay()} />
        <div className="grid grid-cols-2 gap-1.5">
          {WEATHER_KINDS.map(kind => (
            <Row
              key={kind}
              label={m.hud_cheat_tomorrow({ name: WEATHER_NAME[kind]() })}
              selected={world.pinnedTomorrow() === kind}
              onClick={() => world.pinTomorrow(kind)}
            />
          ))}
        </div>
      </div>
    </Dock>
  )
}

function Row({
  label,
  icon,
  selected,
  onClick,
  className,
}: {
  label: ReactNode
  icon?: string
  selected?: boolean
  onClick: () => void
  className?: string
}) {
  const on = selected === true
  const face = on
    ? 'cursor-pointer bg-ink text-house'
    : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-3 py-2 text-left ${face} ${className ?? ''}`}>
      {icon !== undefined && (
        <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: icon }} />
      )}
      <span className="min-w-0 flex-1 text-base font-semibold">{label}</span>
    </button>
  )
}
