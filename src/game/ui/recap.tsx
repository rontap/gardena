import * as Dialog from '@radix-ui/react-dialog'
import { RESEARCH } from '../defs/research.ts'
import type { Recap as RecapData } from '../sim/world.ts'
import { UI_RECAP_NIGHT } from '../view/svgs.ts'
import { Btn, Chrome, Coin } from './frame.tsx'

export function Recap({ recap, nextDay, onDismiss }: { recap: RecapData; nextDay: number; onDismiss: () => void }) {
  return (
    <Dialog.Root
      open
      onOpenChange={o => {
        if (!o) onDismiss()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 outline-none">
          <Chrome className="relative w-[26rem] overflow-hidden">
            <div className="relative z-20 px-3 pb-3 pt-4">
              <svg
                viewBox="0 0 240 64"
                aria-hidden="true"
                className="block h-20 w-full"
                dangerouslySetInnerHTML={{ __html: UI_RECAP_NIGHT }}
              />
              <Dialog.Title className="font-display mt-3 block text-[11px] leading-relaxed text-ink">
                Day {recap.day}
              </Dialog.Title>
              <div className="mt-3 flex flex-col gap-1 text-sm text-ink">
                <Row label="Harvested" value={`${recap.harvests}`} />
                <Row label="Lost" value={`${recap.died}`} />
                <Row
                  label="Research"
                  value={recap.research.length === 0 ? '—' : recap.research.map(id => RESEARCH[id].name).join(', ')}
                />
              </div>
              <div className="mt-3 border-t border-ink/20 pt-2 text-sm text-ink">
                <Line label="Stipend" sign="+" n={recap.stipend} />
                <Line label="Tax" sign="−" n={recap.tax} />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-ink/20 pt-2">
                <span className="text-sm text-ink">Balance</span>
                <span className="text-sm font-medium text-ink">
                  <Coin n={recap.money} />
                </span>
              </div>
              <Btn className="mt-4 w-full" onClick={onDismiss}>
                <span className="block text-center">Day {nextDay}</span>
              </Btn>
            </div>
          </Chrome>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-ink/60">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function Line({ label, sign, n }: { label: string; sign: string; n: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-ink/60">{label}</span>
      <span className="inline-flex items-center gap-1">
        {sign}
        <Coin n={n} />
      </span>
    </div>
  )
}
