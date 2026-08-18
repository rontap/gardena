import actor from '../../assets/actor.svg?raw'
import carrot from '../../assets/crop-carrot.svg?raw'
import potato from '../../assets/crop-potato.svg?raw'
import wheat from '../../assets/crop-wheat.svg?raw'
import tomato from '../../assets/crop-tomato.svg?raw'
import raspberry from '../../assets/crop-raspberry.svg?raw'
import shovel from '../../assets/item-shovel.svg?raw'
import better from '../../assets/item-better-shovel.svg?raw'
import box from '../../assets/item-box.svg?raw'
import largeBox from '../../assets/item-large-box.svg?raw'
import bucket from '../../assets/item-bucket.svg?raw'
import largeBucket from '../../assets/item-large-bucket.svg?raw'
import can from '../../assets/item-can.svg?raw'
import largeCan from '../../assets/item-large-can.svg?raw'
import house from '../../assets/prop-house.svg?raw'
import pump from '../../assets/prop-pump.svg?raw'
import water from '../../assets/overlay-water.svg?raw'
import grass0 from '../../assets/tile-grass-0.svg?raw'
import grass1 from '../../assets/tile-grass-1.svg?raw'
import grass2 from '../../assets/tile-grass-2.svg?raw'
import grass3 from '../../assets/tile-grass-3.svg?raw'
import uiHeader from '../../assets/ui-header.svg'
import uiRail from '../../assets/ui-rail.svg'
import uiCornerTl from '../../assets/ui-corner-tl.svg'
import uiCornerTr from '../../assets/ui-corner-tr.svg'
import uiCornerBr from '../../assets/ui-corner-br.svg'
import uiCornerBl from '../../assets/ui-corner-bl.svg'
import type { CropId } from '../sim/ids.ts'
import type { Item } from '../sim/item.ts'

const CROPS: { readonly [K in CropId]: string } = {
  carrot,
  potato,
  wheat,
  tomato,
  raspberry,
}

export function cropInner(id: CropId, stage: string): string {
  return stageOnly(CROPS[id], stage)
}

export function itemInner(item: Item): string {
  if (item.kind === 'shovel') return inner(item.id === 'shovel' ? shovel : better)
  if (item.kind === 'container') {
    if (item.id === 'bucket') return inner(bucket)
    if (item.id === 'large-bucket') return inner(largeBucket)
    if (item.id === 'can') return inner(can)
    return inner(largeCan)
  }
  if (item.kind === 'box') return inner(item.cap === 5 ? box : largeBox)
  if (item.kind === 'seeds' || item.kind === 'fruit') return cropInner(item.crop, 'ripe')
  return inner(shovel)
}

export const ACTOR = inner(actor)
export const HOUSE = inner(house)
export const PUMP = inner(pump)
export const WATER = inner(water)
export const GRASS = [inner(grass0), inner(grass1), inner(grass2), inner(grass3)] as const
export const UI_HEADER = uiHeader
export const UI_RAIL = uiRail
export const UI_CORNER_TL = uiCornerTl
export const UI_CORNER_TR = uiCornerTr
export const UI_CORNER_BR = uiCornerBr
export const UI_CORNER_BL = uiCornerBl

function inner(raw: string): string {
  return raw.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>[\s\S]*$/i, '')
}

function stageOnly(raw: string, stage: string): string {
  const body = inner(raw)
  return body.replace(/<g id="(\w+)"/g, (_m, id: string) =>
    id === stage ? `<g id="${id}"` : `<g id="${id}" display="none"`,
  )
}
