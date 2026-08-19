import * as Tooltip from '@radix-ui/react-tooltip'
import type { Hand, Item } from '../sim/item.ts'
import { itemTip } from '../sim/item.ts'
import { berryMoney, fruitMoney } from '../sim/item.ts'
import { cropVariety } from '../defs/crops.ts'
import { faceGfx } from '../view/svgs.ts'
import { Coin } from './frame.tsx'

export function Held({ hand }: { hand: Hand }) {
  if (hand.kind === 'empty') {
    return <div className="flex h-20 min-h-20 min-w-20 w-20 items-center justify-center border-2 border-ink bg-dirt-dark" />
  }
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div className="flex min-h-20 min-w-20 flex-col items-center border-2 border-ink bg-roof px-2 pt-1 pb-1">
          <svg viewBox="0 0 24 24" className="h-20 w-20" dangerouslySetInnerHTML={{ __html: faceGfx(hand.item) }} />
          <span className="text-2xl leading-none">{heldNumber(hand.item)}</span>
        </div>
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
    <span className="relative flex h-12 w-12 items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-10 w-10" dangerouslySetInnerHTML={{ __html: faceGfx(item) }} />
      <Badge item={item} />
    </span>
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
  if (item.kind === 'shovel' || item.kind === 'pickaxe') return String(item.usesLeft)
  if (item.kind === 'container') return `${item.liters}L`
  if (item.kind === 'seeds' || item.kind === 'fruit' || item.kind === 'berry') return String(item.count)
  if (item.kind === 'box' && item.cargo.kind === 'stack') return String(item.cargo.stack.count)
  if (item.kind === 'box' && item.cargo.kind === 'berry') return String(item.cargo.count)
  return undefined
}

export function ItemLineView({ item }: { item: Item }) {
  if (item.kind === 'fruit') {
    return (
      <span className="inline-flex items-center gap-1">
        {cropVariety(item.crop, item.rarity)} - {item.count}, sell for <Coin n={fruitMoney(item)} />
      </span>
    )
  }
  if (item.kind === 'berry') {
    return (
      <span className="inline-flex items-center gap-1">
        Berry - {item.count}, sell for <Coin n={berryMoney(item.rarity, item.count)} />
      </span>
    )
  }
  return null
}

function heldNumber(item: Item): string {
  if (item.kind === 'shovel' || item.kind === 'pickaxe') return String(item.usesLeft)
  if (item.kind === 'container') return `${item.liters}L`
  if (item.kind === 'box') {
    if (item.cargo.kind === 'empty') return String(item.cap)
    if (item.cargo.kind === 'berry') return `${item.cargo.count}/${item.cap}`
    return `${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'shrub' || item.kind === 'apple-tree') return ''
  return String(item.count)
}
