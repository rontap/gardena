import * as Tooltip from '@radix-ui/react-tooltip'
import type { Hand, Item } from '../sim/item.ts'
import { itemTip } from '../sim/item.ts'
import { cropVariety } from '../defs/crops.ts'
import { faceGfx } from '../view/svgs.ts'

export function Held({ hand }: { hand: Hand }) {
  if (hand.kind === 'empty') {
    return <div className="flex h-20 min-h-20 min-w-20 w-20 items-center justify-center border-2 border-ink bg-dirt-dark" />
  }
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div className="flex min-h-20 min-w-20 flex-col items-center border-2 border-ink bg-roof px-2 pt-1 pb-1">
          <svg viewBox="0 0 24 24" className="h-20 w-20" dangerouslySetInnerHTML={{ __html: faceGfx(hand.item) }} />
          <span className="text-sm leading-none font-bold">{heldNumber(hand.item)}</span>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="z-50 bg-ink px-2 py-1 text-sm text-house" sideOffset={6}>
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

export function DashFace({ item }: { item: Item }) {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-6 w-6" dangerouslySetInnerHTML={{ __html: faceGfx(item) }} />
      <Badge item={item} />
    </span>
  )
}

function Badge({ item }: { item: Item }) {
  const t = badge(item)
  if (t === undefined) return null
  return (
    <span className="absolute bottom-0 right-0 bg-ink px-1 text-xs leading-tight font-bold text-house">{t}</span>
  )
}

function badge(item: Item): string | undefined {
  if (item.kind === 'shovel' || item.kind === 'pickaxe') return String(item.usesLeft)
  if (item.kind === 'container') return `${Number(item.liters.toFixed(1))}L`
  if (item.kind === 'sugar') return `${Number(item.liters.toFixed(1))}L`
  if (
    item.kind === 'seeds' ||
    item.kind === 'fruit' ||
    item.kind === 'spirit' ||
    item.kind === 'wine' ||
    item.kind === 'jam' ||
    item.kind === 'oil' ||
    item.kind === 'flour' ||
    item.kind === 'extract' ||
    item.kind === 'rotten' ||
    item.kind === 'dead' ||
    item.kind === 'weed' ||
    item.kind === 'grass'
  ) {
    return String(item.count)
  }
  if (item.kind === 'box' && item.cargo.kind === 'stack') {
    return String(item.cargo.goods === 'weed' ? item.cargo.count : item.cargo.stack.count)
  }
  return undefined
}

export function ItemLineView({ item }: { item: Item }) {
  if (item.kind === 'fruit') {
    return (
      <span className="inline-flex items-center gap-1">
      {cropVariety(item.crop, item.rarity)} - {item.count}
      </span>
    )
  }
  if (item.kind === 'sugar') {
    return (
      <span className="inline-flex items-center gap-1">
      Sugar - {item.liters}L
      </span>
    )
  }
  return null
}

function heldNumber(item: Item): string {
  if (item.kind === 'shovel' || item.kind === 'pickaxe') return String(item.usesLeft)
  if (item.kind === 'container') return `${Number(item.liters.toFixed(1))}L`
  if (item.kind === 'fertilizer' || item.kind === 'synth' || item.kind === 'compost') {
    return `${Number(item.liters.toFixed(1))}L`
  }
  if (item.kind === 'box') {
    if (item.cargo.kind === 'empty') return String(item.cap)
    if (item.cargo.goods === 'weed') return `${item.cargo.count}/${item.cap}`
    return `${item.cargo.stack.count}/${item.cap}`
  }
  if (item.kind === 'sugar') return `${Number(item.liters.toFixed(1))}L`
  if (item.kind === 'sapling') return ''
  if (item.kind === 'weed-spray') return String(item.usesLeft)
  return String(item.count)
}
