import { heldText } from '../sim/item.ts'
import { lookText } from '../sim/look.ts'
import type { PromptHit } from '../sim/prompt.ts'
import type { World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'
import { ItemLineView } from './held.tsx'
import { faceGfx } from '../view/svgs.ts'

export function Status({ world, hover }: { world: World; hover: PromptHit | undefined }) {
  const hand = world.hand
  return (
    <Chrome className="relative w-full">
      <div className="relative flex items-center gap-3 px-3 py-3">
        {hand.kind === 'hold' ? (
          <svg viewBox="0 0 24 24" className="h-12 w-12 shrink-0" dangerouslySetInnerHTML={{ __html: faceGfx(hand.item) }} />
        ) : (
          <div className="h-12 w-12 shrink-0 bg-dirt-dark" />
        )}
        <div className="text-base leading-snug">
          {hand.kind === 'hold' && (hand.item.kind === 'fruit' || hand.item.kind === 'berry') ? (
            <ItemLineView item={hand.item} />
          ) : (
            heldText(hand, world.modifiers)
          )}
        </div>
      </div>
      <div
        className={`relative px-3 py-3 leading-snug whitespace-pre-line ${
          world.place.kind !== 'none' ? 'bg-roof/20 text-xl text-roof' : 'bg-dirt/40 text-base'
        }`}
      >
        {lookText(world, hover)}
      </div>
    </Chrome>
  )
}
