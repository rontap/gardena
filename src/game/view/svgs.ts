import actor from '../../assets/actor.svg?raw'
import carrot from '../../assets/crop-carrot.svg?raw'
import potato from '../../assets/crop-potato.svg?raw'
import wheat from '../../assets/crop-wheat.svg?raw'
import tomato from '../../assets/crop-tomato.svg?raw'
import raspberry from '../../assets/crop-raspberry.svg?raw'
import watermelon from '../../assets/crop-watermelon.svg?raw'
import fruitCarrot from '../../assets/fruit-carrot.svg?raw'
import fruitPotato from '../../assets/fruit-potato.svg?raw'
import fruitWheat from '../../assets/fruit-wheat.svg?raw'
import fruitTomato from '../../assets/fruit-tomato.svg?raw'
import fruitRaspberry from '../../assets/fruit-raspberry.svg?raw'
import fruitWatermelon from '../../assets/fruit-watermelon.svg?raw'
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
import itemWell from '../../assets/item-well.svg?raw'
import itemPipe from '../../assets/item-pipe.svg?raw'
import itemSprinkler from '../../assets/item-sprinkler.svg?raw'
import itemSprinklerVert from '../../assets/item-sprinkler-vert.svg?raw'
import itemSprinklerLarge from '../../assets/item-sprinkler-large.svg?raw'
import itemDelete from '../../assets/item-delete.svg?raw'
import house from '../../assets/prop-house.svg?raw'
import pump from '../../assets/prop-pump.svg?raw'
import chest from '../../assets/prop-chest.svg?raw'
import grinder from '../../assets/prop-grinder.svg?raw'
import propWell from '../../assets/prop-well.svg?raw'
import propSprinkler from '../../assets/prop-sprinkler.svg?raw'
import propSprinklerVert from '../../assets/prop-sprinkler-vert.svg?raw'
import propSprinklerLarge from '../../assets/prop-sprinkler-large.svg?raw'
import pipeStub from '../../assets/pipe-stub.svg?raw'
import pipeI from '../../assets/pipe-i.svg?raw'
import pipeL from '../../assets/pipe-l.svg?raw'
import pipeT from '../../assets/pipe-t.svg?raw'
import pipeX from '../../assets/pipe-x.svg?raw'
import overlayWater from '../../assets/overlay-water.svg?raw'
import rock from '../../assets/prop-rock.svg?raw'
import rockLong from '../../assets/prop-rock-long.svg?raw'
import shrub from '../../assets/prop-shrub.svg?raw'
import berryShrub from '../../assets/prop-berry-shrub.svg?raw'
import grass0 from '../../assets/tile-grass-0.svg?raw'
import grass1 from '../../assets/tile-grass-1.svg?raw'
import grass2 from '../../assets/tile-grass-2.svg?raw'
import grass3 from '../../assets/tile-grass-3.svg?raw'
import grass4 from '../../assets/tile-grass-4.svg?raw'
import grass5 from '../../assets/tile-grass-5.svg?raw'
import grass6 from '../../assets/tile-grass-6.svg?raw'
import grass7 from '../../assets/tile-grass-7.svg?raw'
import cropRotten from '../../assets/crop-rotten.svg?raw'
import dirt0 from '../../assets/tile-dirt-0.svg?raw'
import dirt1 from '../../assets/tile-dirt-1.svg?raw'
import hard0 from '../../assets/tile-hard-0.svg?raw'
import hard1 from '../../assets/tile-hard-1.svg?raw'
import veryHard from '../../assets/tile-very-hard-0.svg?raw'
import uiBtn from '../../assets/ui-btn.svg?raw'
import uiBtnShop from '../../assets/ui-btn-shop.svg?raw'
import uiBtnResearch from '../../assets/ui-btn-research.svg?raw'
import uiBtnMarket from '../../assets/ui-btn-market.svg?raw'
import uiBtnAlmanac from '../../assets/ui-btn-almanac.svg?raw'
import uiBtnLens from '../../assets/ui-btn-lens.svg?raw'
import uiBtnDelete from '../../assets/ui-btn-delete.svg?raw'
import uiBtnRotate from '../../assets/ui-btn-rotate.svg?raw'
import uiBtnCancel from '../../assets/ui-btn-cancel.svg?raw'
import uiCoin from '../../assets/ui-coin.svg?raw'
import uiCoinSilver from '../../assets/ui-coin-silver.svg?raw'
import uiMeter from '../../assets/ui-meter.svg?raw'
import uiQuality from '../../assets/ui-quality.svg?raw'
import uiPhaseSunrise from '../../assets/ui-phase-sunrise.svg?raw'
import uiPhaseDay from '../../assets/ui-phase-day.svg?raw'
import uiPhaseSunset from '../../assets/ui-phase-sunset.svg?raw'
import uiPhaseTwilight from '../../assets/ui-phase-twilight.svg?raw'
import uiResearchTools from '../../assets/ui-research-tools.svg?raw'
import uiResearchAuto from '../../assets/ui-research-auto.svg?raw'
import uiResearchAdv from '../../assets/ui-research-adv.svg?raw'
import uiResearchExpand from '../../assets/ui-research-expand.svg?raw'
import uiHeader from '../../assets/ui-header.svg'
import uiRail from '../../assets/ui-rail.svg'
import uiCornerTl from '../../assets/ui-corner-tl.svg'
import uiCornerTr from '../../assets/ui-corner-tr.svg'
import uiCornerBr from '../../assets/ui-corner-br.svg'
import uiCornerBl from '../../assets/ui-corner-bl.svg'
import type { Rarity } from '../defs/rarity.ts'
import type { DayPhase } from '../sim/clock.ts'
import type { CropId, ResearchId, SkuId } from '../sim/ids.ts'
import { skuItem, type Face, type Item } from '../sim/item.ts'

const CROPS: { readonly [K in CropId]: string } = {
  carrot,
  potato,
  wheat,
  tomato,
  raspberry,
  watermelon,
}

const FRUIT: { readonly [K in CropId]: string } = {
  carrot: fruitCarrot,
  potato: fruitPotato,
  wheat: fruitWheat,
  tomato: fruitTomato,
  raspberry: fruitRaspberry,
  watermelon: fruitWatermelon,
}

export type { Face }

export function ripeGroup(rarity: Rarity): 'ripe' | 'ripe-rare' | 'ripe-heirloom' {
  if (rarity === 'rare') return 'ripe-rare'
  if (rarity === 'heirloom') return 'ripe-heirloom'
  return 'ripe'
}

export function fruitGroup(rarity: Rarity): 'common' | 'rare' | 'heirloom' {
  if (rarity === 'rare') return 'rare'
  if (rarity === 'heirloom') return 'heirloom'
  return 'common'
}

export function cropInner(id: CropId, stage: string): string {
  return stageOnly(CROPS[id], stage)
}

export function itemInner(item: Face): string {
  if (item.kind === 'pumpjack') return `<g transform="translate(0,6) scale(0.5)">${inner(pump)}</g>`
  if (item.kind === 'chest') return inner(itemChest)
  if (item.kind === 'grinder') return inner(itemGrinder)
  if (item.kind === 'well') return inner(itemWell)
  if (item.kind === 'pipe') return inner(itemPipe)
  if (item.kind === 'sprinkler') return inner(itemSprinkler)
  if (item.kind === 'sprinkler-vert') return inner(itemSprinklerVert)
  if (item.kind === 'sprinkler-large') return inner(itemSprinklerLarge)
  if (item.kind === 'delete') return inner(itemDelete)
  if (item.kind === 'shovel') return inner(item.id === 'shovel' ? shovel : better)
  if (item.kind === 'pickaxe') return inner(item.id === 'pickaxe' ? pickaxe : betterPickaxe)
  if (item.kind === 'container') {
    if (item.id === 'bucket') return inner(bucket)
    return inner(largeBucket)
  }
  if (item.kind === 'box') return boxInner(item)
  if (item.kind === 'seeds') return cropInner(item.crop, ripeGroup(item.rarity))
  if (item.kind === 'fruit') return stageOnly(FRUIT[item.crop], fruitGroup(item.rarity))
  if (item.kind === 'berry') return inner(itemBerry)
  return inner(itemShrub)
}

export function skuInner(id: SkuId): string {
  if (id === 'buy-chest') return itemInner({ kind: 'chest' })
  if (id === 'buy-grinder') return itemInner({ kind: 'grinder' })
  if (id === 'buy-pumpjack') return itemInner({ kind: 'pumpjack' })
  if (id === 'buy-well') return itemInner({ kind: 'well' })
  if (id === 'buy-pipe') return itemInner({ kind: 'pipe' })
  if (id === 'buy-sprinkler') return itemInner({ kind: 'sprinkler' })
  if (id === 'buy-sprinkler-vert') return itemInner({ kind: 'sprinkler-vert' })
  if (id === 'buy-sprinkler-large') return itemInner({ kind: 'sprinkler-large' })
  return itemInner(skuItem(id))
}

export function researchInner(id: ResearchId): string {
  switch (id) {
    case 'unlock-tomato':
      return stageOnly(FRUIT.tomato, 'common')
    case 'unlock-raspberry':
      return stageOnly(FRUIT.raspberry, 'common')
    case 'unlock-watermelon':
      return stageOnly(FRUIT.watermelon, 'common')
    case 'bump-carrot':
      return stageOnly(FRUIT.carrot, 'common')
    case 'bump-potato':
      return stageOnly(FRUIT.potato, 'common')
    case 'bump-wheat':
      return stageOnly(FRUIT.wheat, 'common')
    case 'unlock-large-box':
      return itemInner({ kind: 'box', cap: 14, cargo: { kind: 'empty' } })
    case 'unlock-irrigation':
      return itemInner({ kind: 'pumpjack' })
    case 'unlock-chest':
      return itemInner({ kind: 'chest' })
    case 'unlock-grinder':
      return itemInner({ kind: 'grinder' })
    case 'unlock-pickaxe':
      return inner(pickaxe)
    case 'unlock-better-tools':
      return inner(uiResearchTools)
    case 'unlock-auto-irrigation':
      return inner(uiResearchAuto)
    case 'unlock-adv-irrigation':
      return inner(uiResearchAdv)
    case 'unlock-expand':
      return inner(uiResearchExpand)
  }
}

export function pipeFit(
  n: boolean,
  e: boolean,
  s: boolean,
  w: boolean,
): { html: string; rot: number } | undefined {
  const d = Number(n) + Number(e) + Number(s) + Number(w)
  if (d === 0) return undefined
  if (d === 4) return { html: PIPE_X, rot: 0 }
  if (d === 3) {
    if (!n) return { html: PIPE_T, rot: 0 }
    if (!e) return { html: PIPE_T, rot: 90 }
    if (!s) return { html: PIPE_T, rot: 180 }
    return { html: PIPE_T, rot: 270 }
  }
  if (d === 1) {
    if (e) return { html: PIPE_STUB, rot: 0 }
    if (s) return { html: PIPE_STUB, rot: 90 }
    if (w) return { html: PIPE_STUB, rot: 180 }
    return { html: PIPE_STUB, rot: 270 }
  }
  if (e && w) return { html: PIPE_I, rot: 0 }
  if (n && s) return { html: PIPE_I, rot: 90 }
  if (e && s) return { html: PIPE_L, rot: 0 }
  if (s && w) return { html: PIPE_L, rot: 90 }
  if (w && n) return { html: PIPE_L, rot: 180 }
  return { html: PIPE_L, rot: 270 }
}

function boxInner(item: Extract<Item, { kind: 'box' }>): string {
  const crate = inner(item.cap === 5 ? box : largeBox)
  if (item.cargo.kind === 'empty') return crate
  const cargo =
    item.cargo.kind === 'berry'
      ? inner(itemBerry)
      : item.cargo.goods === 'fruit'
        ? stageOnly(FRUIT[item.cargo.stack.crop], fruitGroup(item.cargo.stack.rarity))
        : cropInner(item.cargo.stack.crop, ripeGroup(item.cargo.stack.rarity))
  return `${crate}<g transform="translate(7,7) scale(${10 / 24})">${cargo}</g>`
}

export const ACTOR = inner(actor)
export const HOUSE = inner(house)
export const PUMP = inner(pump)
export const WELL = inner(propWell)
export const CHEST = inner(chest)
export const GRINDER = inner(grinder)
export const SPRINKLER = inner(propSprinkler)
export const SPRINKLER_VERT = inner(propSprinklerVert)
export const SPRINKLER_LARGE = inner(propSprinklerLarge)
export const PIPE_STUB = inner(pipeStub)
export const PIPE_I = inner(pipeI)
export const PIPE_L = inner(pipeL)
export const PIPE_T = inner(pipeT)
export const PIPE_X = inner(pipeX)
export const OVERLAY_WATER = inner(overlayWater)
export const ITEM_CHEST = inner(itemChest)
export const ITEM_GRINDER = inner(itemGrinder)
export const ROCK = inner(rock)
export const ROCK_LONG = inner(rockLong)
export const SHRUB = inner(shrub)
export const BERRY_SHRUB = inner(berryShrub)
export const CROP_ROTTEN = inner(cropRotten)
export const GRASS = [
  inner(grass0),
  inner(grass1),
  inner(grass2),
  inner(grass3),
  inner(grass4),
  inner(grass5),
  inner(grass6),
  inner(grass7),
] as const
export const DIRT = [inner(dirt0), inner(dirt1)] as const
export const HARD = [inner(hard0), inner(hard1)] as const
export const VERY_HARD = inner(veryHard)
export const UI_BTN_IDLE = groupInner(uiBtn, 'idle')
export const UI_BTN_HOVER = groupInner(uiBtn, 'hover')
export const UI_BTN_DISABLED = groupInner(uiBtn, 'disabled')
export const UI_COIN = inner(uiCoin)
export const UI_COIN_SILVER = inner(uiCoinSilver)
export const UI_METER = uiMeter
export const UI_QUALITY = inner(uiQuality)
export const UI_BTN_SHOP = uiBtnShop
export const UI_BTN_RESEARCH = uiBtnResearch
export const UI_BTN_MARKET = uiBtnMarket
export const UI_BTN_ALMANAC = uiBtnAlmanac
export const UI_BTN_LENS = uiBtnLens
export const UI_BTN_DELETE = uiBtnDelete
export const UI_BTN_ROTATE = uiBtnRotate
export const UI_BTN_CANCEL = uiBtnCancel
export const UI_PHASE: { readonly [K in DayPhase]: string } = {
  sunrise: inner(uiPhaseSunrise),
  day: inner(uiPhaseDay),
  sunset: inner(uiPhaseSunset),
  twilight: inner(uiPhaseTwilight),
}

export type BtnState = 'idle' | 'hover' | 'selected' | 'disabled'

export function btnFace(raw: string, state: BtnState): string {
  return groupInner(raw, state)
}

export function qualityPip(rarity: Rarity): string | undefined {
  if (rarity === 'common') return undefined
  const fill = rarity === 'uncommon' ? '#6bc04a' : rarity === 'rare' ? '#3d7ea6' : '#d4a017'
  return UI_QUALITY.replace('id="fill" fill="#6bc04a"', `id="fill" fill="${fill}"`)
}

export function faceRarity(item: Face): Rarity | undefined {
  if (item.kind === 'seeds' || item.kind === 'fruit' || item.kind === 'berry') return item.rarity
  if (item.kind === 'box' && item.cargo.kind === 'stack') return item.cargo.stack.rarity
  if (item.kind === 'box' && item.cargo.kind === 'berry') return item.cargo.rarity
  return undefined
}

export function faceGfx(item: Face): string {
  const base = itemInner(item)
  const r = faceRarity(item)
  if (r === undefined) return base
  const pip = qualityPip(r)
  if (pip === undefined) return base
  return `${base}<g transform="translate(16,16)">${pip}</g>`
}

export function meterInner(filled: number, token: 'dirt' | 'leaf'): string {
  const color = token === 'dirt' ? '#8a5a32' : '#6bc04a'
  let raw = UI_METER
  for (let i = 0; i < filled; i++) {
    raw = raw.replace(`id="fill-${i}" fill="#cfc6b0"`, `id="fill-${i}" fill="${color}"`)
  }
  return inner(raw)
}
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
  return body.replace(/<g id="([^"]+)"/g, (_m, id: string) =>
    id === stage ? `<g id="${id}"` : `<g id="${id}" display="none"`,
  )
}
