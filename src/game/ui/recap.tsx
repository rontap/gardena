import * as Dialog from '@radix-ui/react-dialog'
import type { Recap as RecapData } from '../sim/world.ts'
import { Frame } from './frame.tsx'

export function Recap({ recap, nextDay, onDismiss }: { recap: RecapData; nextDay: number; onDismiss: () => void }) {
  return (
    <Dialog.Root
      open
      onOpenChange={o => {
        if (!o) onDismiss()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 outline-none">
          <Frame title={`day ${recap.day}`}>
            <Dialog.Title className="sr-only">day {recap.day}</Dialog.Title>
            <div className="flex flex-col gap-1 text-sm">
              <div>${Math.floor(recap.money)}</div>
              <div>died {recap.died}</div>
              <div>harvests {recap.harvests}</div>
              <div>research {recap.research.join(' ')}</div>
            </div>
            <button type="button" className="mt-4 border border-ink bg-dirt px-3 py-1 text-house" onClick={onDismiss}>
              Day {nextDay}
            </button>
          </Frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
