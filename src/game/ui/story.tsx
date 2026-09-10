import { m } from '../../paraglide/messages.js'
import * as Dialog from '@radix-ui/react-dialog'
import type { Grandma } from '../sim/ids.ts'
import { UI_RECAP_NIGHT } from '../view/svgs.ts'
import { Btn, Chrome } from './frame.tsx'

const TITLE: { readonly [K in Exclude<Grandma, 'well'>]: () => string } = {
  ill: () => m.necro_grandma_ill_title(),
  care: () => m.necro_grandma_care_title(),
  gone: () => m.necro_grandma_gone_title(),
  told: () => m.necro_grandma_told_title(),
}

const BODY: { readonly [K in Exclude<Grandma, 'well'>]: () => string } = {
  ill: () => m.necro_grandma_ill_body(),
  care: () => m.necro_grandma_care_body(),
  gone: () => m.necro_grandma_gone_body(),
  told: () => m.necro_grandma_told_body(),
}

export function Story({ beat, onDismiss }: { beat: Exclude<Grandma, 'well'>; onDismiss: () => void }) {
  return (
    <Dialog.Root
      open
      onOpenChange={o => {
        if (!o) onDismiss()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 outline-none">
          <Chrome className="relative w-[26rem] overflow-hidden">
            <div className="relative z-20 px-4 pt-4 pb-4">
              <svg
                viewBox="0 0 240 64"
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-16 w-full opacity-25"
                dangerouslySetInnerHTML={{ __html: UI_RECAP_NIGHT }}
              />
              <Dialog.Title className="relative mb-3 font-display text-sm leading-[1.6] text-ink">
                {TITLE[beat]()}
              </Dialog.Title>
              <div className="relative mb-4 text-base leading-relaxed text-ink">{BODY[beat]()}</div>
              <Btn onClick={onDismiss} className="w-full">
                {m.necro_story_read()}
              </Btn>
            </div>
          </Chrome>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
