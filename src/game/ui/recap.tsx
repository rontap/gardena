import * as Dialog from '@radix-ui/react-dialog'
import { COMPANIES } from '../defs/companies.ts'
import { RESEARCH } from '../defs/research.ts'
import type { HistoryEntry } from '../sim/market.h.ts'
import type { Recap as RecapData } from '../sim/world.ts'
import { UI_RECAP_NIGHT } from '../view/svgs.ts'
import { Difficulty } from './market.tsx'
import { Btn, Chrome, Coin } from './frame.tsx'

export function Recap({
  recap,
  nextDay,
  guest,
  showContracts,
  onDismiss,
}: {
  recap: RecapData
  nextDay: number
  guest: boolean
  showContracts: boolean
  onDismiss: () => void
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={o => {
        if (!o && !guest) onDismiss()
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
              <div className="mt-3 flex items-baseline justify-between">
                <Dialog.Title className="font-display text-lg leading-relaxed text-ink">
                  Day {recap.day}
                </Dialog.Title>
                <span className="text-base text-ink/60">turned in</span>
              </div>
              <div className="mt-3 flex flex-col gap-1 text-base text-ink">
                <Row label="Harvested" value={`${recap.harvests}`} />
                <Row label="Lost" value={`${recap.died}`} />
                <Row
                  label="Research"
                  value={recap.research.length === 0 ? '—' : recap.research.map(id => RESEARCH[id].name).join(', ')}
                />
              </div>
              {showContracts && (
                <div className="mt-3 flex flex-col gap-1 text-base text-ink">
                  {recap.contracts.map(e => (
                    <ContractLine key={`${e.id}-${e.outcome.kind}`} entry={e} />
                  ))}
                  <div className="text-sm text-ink">A new board is up.</div>
                </div>
              )}
              <div className="mt-3 border-t border-ink/20 pt-2 text-base text-ink">
                <Line label="Stipend" sign="+" n={recap.stipend} />
                <Line label="Tax" sign="−" n={recap.tax} />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-ink/20 pt-2">
                <span className="text-base text-ink">Balance</span>
                <span className="font-display text-lg leading-relaxed text-ink">
                  <Coin n={recap.money} />
                </span>
              </div>
              <Btn className="mt-4 w-full text-center" disabled={guest} onClick={guest ? undefined : onDismiss}>
                Day {nextDay}
              </Btn>
            </div>
          </Chrome>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ContractLine({ entry }: { entry: HistoryEntry }) {
  const outcome =
    entry.outcome.kind === 'done' ? 'Completed' : entry.outcome.kind === 'missed' ? 'Missed' : 'Cancelled'
  const n =
    entry.outcome.kind === 'done'
      ? entry.outcome.paid
      : entry.outcome.kind === 'missed'
        ? entry.outcome.penalty
        : entry.outcome.fee
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{COMPANIES[entry.company].name}</span>
      <Difficulty stars={entry.stars} />
      <span>{entry.day}</span>
      <span>{outcome}</span>
      <span className="ml-auto">
        <Coin n={n} />
      </span>
    </div>
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
