import * as Tooltip from '@radix-ui/react-tooltip'
import type { Hand, Item } from '../sim/item.ts'
import { itemTip } from '../sim/item.ts'
import { itemInner } from '../view/svgs.ts'

export function Held({ hand, onClick }: { hand: Hand; onClick: () => void }) {
  if (hand.kind === 'empty') {
    return (
      <button
        type="button"
        className="flex h-16 min-h-16 min-w-16 w-16 items-center justify-center border-2 border-ink bg-dirt-dark text-xs text-ink"
        onClick={onClick}
      >
        empty
      </button>
    )
  }
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className="relative flex h-16 min-h-16 min-w-16 w-16 items-center justify-center border-2 border-ink bg-roof"
          onClick={onClick}
        >
          <svg viewBox="0 0 16 16" className="h-14 w-14" dangerouslySetInnerHTML={{ __html: itemInner(hand.item) }} />
          <Badge item={hand.item} />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="z-50 border border-ink bg-ink px-2 py-1 text-xs text-house" sideOffset={6}>
          {itemTip(hand.item)}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export function ItemFace({ item }: { item: Item }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span className="relative flex h-12 w-12 items-center justify-center">
          <svg viewBox="0 0 16 16" className="h-10 w-10" dangerouslySetInnerHTML={{ __html: itemInner(item) }} />
          <Badge item={item} />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="z-50 border border-ink bg-ink px-2 py-1 text-xs text-house" sideOffset={6}>
          {itemTip(item)}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function Badge({ item }: { item: Item }) {
  const t = badge(item)
  if (t === undefined) return null
  return (
    <span className="absolute bottom-0 right-0 bg-ink px-0.5 text-[10px] leading-tight text-house">{t}</span>
  )
}

function badge(item: Item): string | undefined {
  if (item.kind === 'shovel') return String(item.usesLeft)
  if (item.kind === 'container') return `${item.liters}L`
  if (item.kind === 'seeds' || item.kind === 'fruit') return String(item.count)
  if (item.kind === 'box' && item.cargo.kind === 'stack') return String(item.cargo.stack.count)
  return undefined
}
