import { m } from '../../paraglide/messages.js'
import type { Tutorial, TutorialStep } from '../sim/tutorial.ts'
import { ready } from '../sim/tutorial.ts'
import type { World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'

const COPY: { readonly [K in TutorialStep]: () => string } = {
  1: () => m.tutorial_1(),
  2: () => m.tutorial_2(),
  3: () => m.tutorial_3(),
  4: () => m.tutorial_4(),
  5: () => m.tutorial_5(),
  6: () => m.tutorial_6({ n: 3 }),
  7: () => m.tutorial_7(),
  8: () => m.tutorial_8(),
  9: () => m.tutorial_9(),
}

export function TutorialCard({
  world,
  tutorial,
  onOff,
}: {
  world: World
  tutorial: Tutorial
  onOff: () => void
}) {
  if (tutorial.kind !== 'on') return null
  if (!ready(tutorial.step, world, tutorial)) return null
  const step = tutorial.step
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
      <div
        className={step === 9 ? 'pointer-events-auto' : undefined}
        onClick={step === 9 ? onOff : undefined}
      >
        <Chrome className="relative w-80 px-4 pt-4 pb-3">
          <div className="relative z-20 text-base leading-relaxed text-ink">{COPY[step]()}</div>
        </Chrome>
      </div>
    </div>
  )
}
