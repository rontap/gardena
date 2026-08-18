import actor from '../../assets/actor.svg?raw'
import carrot from '../../assets/crop-carrot.svg?raw'
import potato from '../../assets/crop-potato.svg?raw'
import wheat from '../../assets/crop-wheat.svg?raw'
import tomato from '../../assets/crop-tomato.svg?raw'
import raspberry from '../../assets/crop-raspberry.svg?raw'
import fruitCarrot from '../../assets/fruit-carrot.svg?raw'
import fruitPotato from '../../assets/fruit-potato.svg?raw'
import fruitWheat from '../../assets/fruit-wheat.svg?raw'
import fruitTomato from '../../assets/fruit-tomato.svg?raw'
import fruitRaspberry from '../../assets/fruit-raspberry.svg?raw'
import shovel from '../../assets/item-shovel.svg?raw'
import better from '../../assets/item-better-shovel.svg?raw'
import pickaxe from '../../assets/item-pickaxe.svg?raw'
import betterPickaxe from '../../assets/item-better-pickaxe.svg?raw'
import box from '../../assets/item-box.svg?raw'
import largeBox from '../../assets/item-large-box.svg?raw'
import bucket from '../../assets/item-bucket.svg?raw'
import largeBucket from '../../assets/item-large-bucket.svg?raw'
import itemShrub from '../../assets/item-shrub.svg?raw'
import itemBerry from '../../assets/item-berry.svg?raw'
import itemChest from '../../assets/item-chest.svg?raw'
import itemGrinder from '../../assets/item-grinder.svg?raw'
import house from '../../assets/prop-house.svg?raw'
import pump from '../../assets/prop-pump.svg?raw'
import chest from '../../assets/prop-chest.svg?raw'
import grinder from '../../assets/prop-grinder.svg?raw'
import rock from '../../assets/prop-rock.svg?raw'
import rockLong from '../../assets/prop-rock-long.svg?raw'
import shrub from '../../assets/prop-shrub.svg?raw'
import berryShrub from '../../assets/prop-berry-shrub.svg?raw'
import grass0 from '../../assets/tile-grass-0.svg?raw'
import grass1 from '../../assets/tile-grass-1.svg?raw'
import grass2 from '../../assets/tile-grass-2.svg?raw'
import grass3 from '../../assets/tile-grass-3.svg?raw'
import grass4 from '../../assets/tile-grass-4.svg?raw'
import dirt0 from '../../assets/tile-dirt-0.svg?raw'
import dirt1 from '../../assets/tile-dirt-1.svg?raw'
import hard0 from '../../assets/tile-hard-0.svg?raw'
import hard1 from '../../assets/tile-hard-1.svg?raw'
import veryHard from '../../assets/tile-very-hard-0.svg?raw'
import uiBtn from '../../assets/ui-btn.svg?raw'
import uiHeader from '../../assets/ui-header.svg'
import uiRail from '../../assets/ui-rail.svg'
import uiCornerTl from '../../assets/ui-corner-tl.svg'
import uiCornerTr from '../../assets/ui-corner-tr.svg'
import uiCornerBr from '../../assets/ui-corner-br.svg'
import uiCornerBl from '../../assets/ui-corner-bl.svg'
import type { CropId, SkuId } from '../sim/ids.ts'
import { skuItem, type Item } from '../sim/item.ts'

const CROPS: { readonly [K in CropId]: string } = {
  carrot,
  potato,
  wheat,
  tomato,
  raspberry,
}

const FRUIT: { readonly [K in CropId]: string } = {
  carrot: fruitCarrot,
  potato: fruitPotato,
  wheat: fruitWheat,
  tomato: fruitTomato,
  raspberry: fruitRaspberry,
}

export type Face = Item | { kind: 'pumpjack' } | { kind: 'chest' } | { kind: 'grinder' }

export function cropInner(id: CropId, stage: string): string {
  return stageOnly(CROPS[id], stage)
}

export function itemInner(item: Face): string {
  if (item.kind === 'pumpjack') return `<g transform="translate(0,6) scale(0.5)">${inner(pump)}</g>`
  if (item.kind === 'chest') return inner(itemChest)
  if (item.kind === 'grinder') return inner(itemGrinder)
  if (item.kind === 'shovel') return inner(item.id === 'shovel' ? shovel : better)
  if (item.kind === 'pickaxe') return inner(item.id === 'pickaxe' ? pickaxe : betterPickaxe)
  if (item.kind === 'container') {
    if (item.id === 'bucket') return inner(bucket)
    return inner(largeBucket)
  }
  if (item.kind === 'box') return boxInner(item)
  if (item.kind === 'seeds') return cropInner(item.crop, 'ripe')
  if (item.kind === 'fruit') return inner(FRUIT[item.crop])
  if (item.kind === 'berry') return inner(itemBerry)
  return inner(itemShrub)
}

export function skuInner(id: SkuId): string {
  if (id === 'buy-chest') return itemInner({ kind: 'chest' })
  if (id === 'buy-grinder') return itemInner({ kind: 'grinder' })
  if (id === 'buy-pumpjack') return itemInner({ kind: 'pumpjack' })
  return itemInner(skuItem(id))
}

function boxInner(item: Extract<Item, { kind: 'box' }>): string {
  const crate = inner(item.cap === 5 ? box : largeBox)
  if (item.cargo.kind === 'empty') return crate
  const cargo =
    item.cargo.kind === 'berry'
      ? inner(itemBerry)
      : item.cargo.goods === 'fruit'
        ? inner(FRUIT[item.cargo.stack.crop])
        : cropInner(item.cargo.stack.crop, 'ripe')
  return `${crate}<g transform="translate(7,7) scale(${10 / 24})">${cargo}</g>`
}

export const ACTOR = inner(actor)
export const HOUSE = inner(house)
export const PUMP = inner(pump)
export const CHEST = inner(chest)
export const GRINDER = inner(grinder)
export const ITEM_CHEST = inner(itemChest)
export const ITEM_GRINDER = inner(itemGrinder)
export const ROCK = inner(rock)
export const ROCK_LONG = inner(rockLong)
export const SHRUB = inner(shrub)
export const BERRY_SHRUB = inner(berryShrub)
export const GRASS = [inner(grass0), inner(grass1), inner(grass2), inner(grass3), inner(grass4)] as const
export const DIRT = [inner(dirt0), inner(dirt1)] as const
export const HARD = [inner(hard0), inner(hard1)] as const
export const VERY_HARD = inner(veryHard)
export const UI_BTN_IDLE = groupInner(uiBtn, 'idle')
export const UI_BTN_HOVER = groupInner(uiBtn, 'hover')
export const UI_BTN_DISABLED = groupInner(uiBtn, 'disabled')
export const UI_HEADER = uiHeader
export const UI_RAIL = uiRail
export const UI_CORNER_TL = uiCornerTl
export const UI_CORNER_TR = uiCornerTr
export const UI_CORNER_BR = uiCornerBr
export const UI_CORNER_BL = uiCornerBl

function inner(raw: string): string {
  return raw.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>[\s\S]*$/i, '')
}

function groupInner(raw: string, id: string): string {
  const open = `<g id="${id}">`
  const start = raw.indexOf(open) + open.length
  return raw.slice(start, raw.indexOf('</g>', start))
}

function stageOnly(raw: string, stage: string): string {
  const body = inner(raw)
  return body.replace(/<g id="(\w+)"/g, (_m, id: string) =>
    id === stage ? `<g id="${id}"` : `<g id="${id}" display="none"`,
  )
}
