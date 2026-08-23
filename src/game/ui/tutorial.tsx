import type { Tutorial, TutorialStep } from '../sim/tutorial.ts'
import { ready } from '../sim/tutorial.ts'
import type { World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'

const COPY: { readonly [K in TutorialStep]: string } = {
  1: 'Till, plant, water, harvest, sell, buy better tools. Click a grass tile to dig.',
  2: 'Dig four more plots.',
  3: 'Click the house and take seeds in hand.',
  4: 'You only carry one item. Plant the seeds.',
  5: 'Open Research and start something.',
  6: 'A plant is thirsty. Pick up the bucket (3 L), fill it at the pump, water the plant.',
  7: 'Something is ripe. Buy a fruit box and place it.',
  8: 'Pick any fruit.',
  9: 'Drop it at the truck and Sell all.',
  10: "That's the tour. You're on your own.",
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
        className={step === 10 ? 'pointer-events-auto' : undefined}
        onClick={step === 10 ? onOff : undefined}
      >
        <Chrome className="relative w-80 px-4 pt-4 pb-3">
          <div className="relative z-20 text-base leading-relaxed text-ink">{COPY[step]}</div>
        </Chrome>
      </div>
    </div>
  )
}
