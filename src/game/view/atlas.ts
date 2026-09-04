import { Texture } from 'pixi.js'
import type {
  ContainerId,
  CropId,
  CaskId,
  JamCrop,
  PickaxeId,
  ShovelId,
  SpiritKind,
  TileId,
  TrailerKind,
  TreeId,
  VfxId,
} from '../sim/ids.ts'
import type { SeatId } from '../sim/world.ts'
import type { Sensor } from '../sim/sensor.ts'
import { ANNUAL_IDS, TREE_IDS } from '../sim/ids.ts'
import { ripeGroup, fruitGroup, caskGroup, varietyGroup, type VarietyGroup } from './svgs.ts'
import { EDGE_PAD } from './camera.ts'
import type { Item } from '../sim/item.ts'
import type { CropClass } from '../defs/crops.ts'
import type { VarietyId } from '../defs/varieties.ts'
import { counterDial } from '../sim/sensor.ts'

import grass0 from '../../assets/tiles/tile-grass-0.svg?raw'
import grass1 from '../../assets/tiles/tile-grass-1.svg?raw'
import grass2 from '../../assets/tiles/tile-grass-2.svg?raw'
import grass3 from '../../assets/tiles/tile-grass-3.svg?raw'
import grass4 from '../../assets/tiles/tile-grass-4.svg?raw'
import grass5 from '../../assets/tiles/tile-grass-5.svg?raw'
import grass6 from '../../assets/tiles/tile-grass-6.svg?raw'
import grass7 from '../../assets/tiles/tile-grass-7.svg?raw'
import dirt0 from '../../assets/tiles/tile-dirt-0.svg?raw'
import dirt1 from '../../assets/tiles/tile-dirt-1.svg?raw'
import dirtEdge from '../../assets/tiles/tile-dirt-edge.svg?raw'
import dirtInset from '../../assets/tiles/tile-dirt-inset.svg?raw'
import hard0 from '../../assets/tiles/tile-hard-0.svg?raw'
import hard1 from '../../assets/tiles/tile-hard-1.svg?raw'
import hard2 from '../../assets/tiles/tile-hard-2.svg?raw'
import veryHard0 from '../../assets/tiles/tile-very-hard-0.svg?raw'
import veryHard1 from '../../assets/tiles/tile-very-hard-1.svg?raw'
import veryHard2 from '../../assets/tiles/tile-very-hard-2.svg?raw'
import tilePaved from '../../assets/tiles/tile-paved.svg?raw'
import tileBrick from '../../assets/tiles/tile-brick.svg?raw'
import tileCobble from '../../assets/tiles/tile-cobble.svg?raw'
import carrot from '../../assets/crops/crop-carrot.svg?raw'
import potato from '../../assets/crops/crop-potato.svg?raw'
import wheat from '../../assets/crops/crop-wheat.svg?raw'
import tomato from '../../assets/crops/crop-tomato.svg?raw'
import raspberry from '../../assets/crops/crop-raspberry.svg?raw'
import apple from '../../assets/crops/crop-apple.svg?raw'
import grape from '../../assets/crops/crop-grape.svg?raw'
import vanilla from '../../assets/crops/crop-vanilla.svg?raw'
import sugarCane from '../../assets/crops/crop-sugar-cane.svg?raw'
import cropRotten from '../../assets/crops/crop-rotten.svg?raw'
import cropGrass from '../../assets/crops/crop-grass.svg?raw'
import weed0 from '../../assets/crops/crop-weed-0.svg?raw'
import weed1 from '../../assets/crops/crop-weed-1.svg?raw'
import fruitCarrot from '../../assets/fruits/fruit-carrot.svg?raw'
import fruitPotato from '../../assets/fruits/fruit-potato.svg?raw'
import fruitWheat from '../../assets/fruits/fruit-wheat.svg?raw'
import fruitTomato from '../../assets/fruits/fruit-tomato.svg?raw'
import fruitRaspberry from '../../assets/fruits/fruit-raspberry.svg?raw'
import fruitApple from '../../assets/fruits/fruit-apple.svg?raw'
import fruitOlive from '../../assets/fruits/fruit-olive.svg?raw'
import fruitGrape from '../../assets/fruits/fruit-grape.svg?raw'
import fruitVanilla from '../../assets/fruits/fruit-vanilla.svg?raw'
import fruitApricot from '../../assets/fruits/fruit-apricot.svg?raw'
import fruitCherry from '../../assets/fruits/fruit-cherry.svg?raw'
import fruitSugarCane from '../../assets/fruits/fruit-sugar-cane.svg?raw'
import itemSeedApple from '../../assets/items/item-seed-apple.svg?raw'
import itemSeedApricot from '../../assets/items/item-seed-apricot.svg?raw'
import itemSeedOlive from '../../assets/items/item-seed-olive.svg?raw'
import itemSeedCherry from '../../assets/items/item-seed-cherry.svg?raw'
import appleTree from '../../assets/props/prop-apple-tree.svg?raw'
import apricotTree from '../../assets/props/prop-apricot-tree.svg?raw'
import oliveTree from '../../assets/props/prop-olive-tree.svg?raw'
import cherryTree from '../../assets/props/prop-cherry-tree.svg?raw'
import house from '../../assets/props/prop-house.svg?raw'
import pump from '../../assets/props/prop-pump.svg?raw'
import chest from '../../assets/props/prop-chest.svg?raw'
import grinder from '../../assets/props/prop-grinder.svg?raw'
import propLinkIn from '../../assets/props/prop-link-in.svg?raw'
import propLinkOut from '../../assets/props/prop-link-out.svg?raw'
import propWell from '../../assets/props/prop-well.svg?raw'
import propTruck from '../../assets/props/prop-truck.svg?raw'
import propRainTank from '../../assets/props/prop-rain-tank.svg?raw'
import propTap from '../../assets/props/prop-tap.svg?raw'
import propSprinkler from '../../assets/props/prop-sprinkler.svg?raw'
import propSprinklerVert from '../../assets/props/prop-sprinkler-vert.svg?raw'
import propSprinklerLarge from '../../assets/props/prop-sprinkler-large.svg?raw'
import propMill from '../../assets/props/prop-mill.svg?raw'
import propStill from '../../assets/props/prop-still.svg?raw'
import propBarrel from '../../assets/props/prop-barrel.svg?raw'
import propJam from '../../assets/props/prop-jam.svg?raw'
import propFreezer from '../../assets/props/prop-freezer.svg?raw'
import propFurnace from '../../assets/props/prop-furnace.svg?raw'
import propHangar from '../../assets/props/prop-hangar.svg?raw'
import propQuad from '../../assets/props/prop-quad.svg?raw'
import propTractor from '../../assets/props/prop-tractor.svg?raw'
import propTrailerSeed from '../../assets/props/prop-trailer-seed.svg?raw'
import propTrailerSpray from '../../assets/props/prop-trailer-spray.svg?raw'
import propTrailerHarvest from '../../assets/props/prop-trailer-harvest.svg?raw'
import propTrailerRake from '../../assets/props/prop-trailer-rake.svg?raw'
import propSiloSeed from '../../assets/props/prop-silo-seed.svg?raw'
import propSiloSpray from '../../assets/props/prop-silo-spray.svg?raw'
import propSiloProduce from '../../assets/props/prop-silo-produce.svg?raw'
import propSeedSilo from '../../assets/props/prop-seed-silo.svg?raw'
import propAdditiveStore from '../../assets/props/prop-additive-store.svg?raw'
import propCompostBox from '../../assets/props/prop-compost-box.svg?raw'
import rock from '../../assets/props/prop-rock.svg?raw'
import rockLong from '../../assets/props/prop-rock-long.svg?raw'
import propGrass0 from '../../assets/props/prop-grass-0.svg?raw'
import propGrass1 from '../../assets/props/prop-grass-1.svg?raw'
import propGrass2 from '../../assets/props/prop-grass-2.svg?raw'
import pipeStub from '../../assets/joints/pipe-stub.svg?raw'
import pipeI from '../../assets/joints/pipe-i.svg?raw'
import pipeL from '../../assets/joints/pipe-l.svg?raw'
import pipeT from '../../assets/joints/pipe-t.svg?raw'
import pipeX from '../../assets/joints/pipe-x.svg?raw'
import pipeSource from '../../assets/joints/pipe-source.svg?raw'
import pipeValve from '../../assets/joints/pipe-valve.svg?raw'
import pipeValveJack from '../../assets/joints/pipe-valve-jack.svg?raw'
import fencePost from '../../assets/joints/fence-post.svg?raw'
import fenceStub from '../../assets/joints/fence-stub.svg?raw'
import fenceI from '../../assets/joints/fence-i.svg?raw'
import fenceL from '../../assets/joints/fence-l.svg?raw'
import fenceT from '../../assets/joints/fence-t.svg?raw'
import fenceX from '../../assets/joints/fence-x.svg?raw'
import actor from '../../assets/actor.svg?raw'
import propLever from '../../assets/props/prop-lever.svg?raw'
import propButton from '../../assets/props/prop-button.svg?raw'
import propLamp from '../../assets/props/prop-lamp.svg?raw'
import propOr from '../../assets/props/prop-or.svg?raw'
import propAnd from '../../assets/props/prop-and.svg?raw'
import propNot from '../../assets/props/prop-not.svg?raw'
import propPulser from '../../assets/props/prop-pulser.svg?raw'
import propCounter from '../../assets/props/prop-counter.svg?raw'
import propSensorWater from '../../assets/props/prop-sensor-water.svg?raw'
import propSensorFert from '../../assets/props/prop-sensor-fert.svg?raw'
import propSensorHarvest from '../../assets/props/prop-sensor-harvest.svg?raw'
import propSensorDay from '../../assets/props/prop-sensor-day.svg?raw'
import propWaterSystem from '../../assets/props/prop-water-system.svg?raw'
import propVehicleDetector from '../../assets/props/prop-vehicle-detector.svg?raw'
import propTrafficLight from '../../assets/props/prop-traffic-light.svg?raw'
import uiHangarReturn from '../../assets/ui/ui-hangar-return.svg?raw'
import uiPadDrop from '../../assets/ui/ui-pad-drop.svg?raw'
import uiPadTake from '../../assets/ui/ui-pad-take.svg?raw'
import shovel from '../../assets/items/item-shovel.svg?raw'
import better from '../../assets/items/item-better-shovel.svg?raw'
import rotaryShovel from '../../assets/items/item-rotary-shovel.svg?raw'
import pickaxe from '../../assets/items/item-pickaxe.svg?raw'
import betterPickaxe from '../../assets/items/item-better-pickaxe.svg?raw'
import diamondPickaxe from '../../assets/items/item-diamond-pickaxe.svg?raw'
import bucket from '../../assets/items/item-bucket.svg?raw'
import largeBucket from '../../assets/items/item-large-bucket.svg?raw'
import itemFertilizer from '../../assets/items/item-fertilizer.svg?raw'
import itemWeedSpray from '../../assets/items/item-weed-spray.svg?raw'
import itemSynth from '../../assets/items/item-synth.svg?raw'
import itemCompost from '../../assets/items/item-compost.svg?raw'
import itemRotten from '../../assets/items/item-rotten.svg?raw'
import itemDead from '../../assets/items/item-dead.svg?raw'
import itemGrass from '../../assets/items/item-grass.svg?raw'
import itemSugar from '../../assets/items/item-sugar.svg?raw'
import itemSpiritVodka from '../../assets/items/item-spirit-vodka.svg?raw'
import itemSpiritBeer from '../../assets/items/item-spirit-beer.svg?raw'
import itemSpiritBrandy from '../../assets/items/item-spirit-brandy.svg?raw'
import itemSpiritMixed from '../../assets/items/item-spirit-mixed.svg?raw'
import itemCider from '../../assets/items/item-cider.svg?raw'
import itemWine from '../../assets/items/item-wine.svg?raw'
import itemJamApricot from '../../assets/items/item-jam-apricot.svg?raw'
import itemJamGrape from '../../assets/items/item-jam-grape.svg?raw'
import itemJamRaspberry from '../../assets/items/item-jam-raspberry.svg?raw'
import itemJamCherry from '../../assets/items/item-jam-cherry.svg?raw'
import itemKetchup from '../../assets/items/item-ketchup.svg?raw'
import itemOil from '../../assets/items/item-oil.svg?raw'
import itemFlour from '../../assets/items/item-flour.svg?raw'
import itemExtract from '../../assets/items/item-extract.svg?raw'
import itemAxe from '../../assets/items/item-axe.svg?raw'
import itemWood from '../../assets/items/item-wood.svg?raw'
import itemAsh from '../../assets/items/item-ash.svg?raw'
import spray from '../../assets/vfx/vfx-spray.svg?raw'
import sprayLarge from '../../assets/vfx/vfx-spray-large.svg?raw'
import sprayVert from '../../assets/vfx/vfx-spray-vert.svg?raw'
import tend from '../../assets/vfx/vfx-tend.svg?raw'
import pour from '../../assets/vfx/vfx-pour.svg?raw'
import brew from '../../assets/vfx/vfx-brew.svg?raw'
import dust from '../../assets/vfx/vfx-dust.svg?raw'
import steam from '../../assets/vfx/vfx-steam.svg?raw'
import dig from '../../assets/vfx/vfx-dig.svg?raw'
import furnaceVfx from '../../assets/vfx/vfx-furnace.svg?raw'
import furnaceSmokeVfx from '../../assets/vfx/vfx-furnace-smoke.svg?raw'

const SCALE = 2

export type CropStage = 'sprout' | 'grow' | 'ripe' | 'ripe-variant' | 'ripe-variant-2' | 'ripe-heirloom' | 'dead'

export type TreeAtlasStage =
  | 'trunk'
  | 'grow'
  | 'unripe'
  | 'unripe-variant'
  | 'unripe-variant-2'
  | 'unripe-heirloom'
  | 'ripe'
  | 'ripe-variant'
  | 'ripe-variant-2'
  | 'ripe-heirloom'

export type AtlasKey =
  | `grass-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | 'dirt-0'
  | 'dirt-1'
  | 'dirt-edge'
  | 'dirt-inset'
  | `hard-${0 | 1 | 2}`
  | `vh-${0 | 1 | 2}`
  | `tile-${TileId}`
  | 'rotten'
  | `tuft-${0 | 1 | 2}`
  | 'rock'
  | 'rock-long'
  | 'house'
  | 'pump'
  | 'truck'
  | 'chest'
  | 'grinder'
  | 'link-in'
  | 'link-out'
  | 'well'
  | 'rain-tank'
  | 'tap'
  | 'sprinkler'
  | 'sprinkler-vert'
  | 'sprinkler-large'
  | 'mill'
  | 'still'
  | 'barrel'
  | 'jam'
  | 'freezer'
  | 'furnace-off'
  | 'furnace-on'
  | 'hangar'
  | 'quad'
  | 'tractor'
  | `trailer-${TrailerKind | 'rake'}`
  | 'silo-seed'
  | 'silo-spray'
  | 'silo-produce'
  | 'seed-silo'
  | 'additive-store'
  | 'compost-box'
  | 'pipe-source'
  | 'hangar-return'
  | 'pad-drop'
  | 'pad-take'
  | 'or'
  | 'and'
  | 'not'
  | 'pipe-stub'
  | 'pipe-i'
  | 'pipe-l'
  | 'pipe-t'
  | 'pipe-x'
  | 'pipe-stub-dry'
  | 'pipe-i-dry'
  | 'pipe-l-dry'
  | 'pipe-t-dry'
  | 'pipe-x-dry'
  | 'valve-open'
  | 'valve-closed'
  | 'valve-jack'
  | 'fence-post'
  | 'fence-stub'
  | 'fence-i'
  | 'fence-l'
  | 'fence-t'
  | 'fence-x'
  | 'lever-on'
  | 'lever-off'
  | 'button-on'
  | 'button-off'
  | 'lamp-on'
  | 'lamp-off'
  | 'pulser-on'
  | 'pulser-off'
  | `counter-${'s0' | 's1' | 's2' | 's3' | 's4'}`
  | 'water-blue'
  | 'water-red'
  | 'fert-ok'
  | 'fert-red'
  | 'harvest-on'
  | 'harvest-off'
  | 'day-on'
  | 'day-off'
  | 'water-system-on'
  | 'water-system-off'
  | 'vehicle-detector-on'
  | 'vehicle-detector-off'
  | 'traffic-on'
  | 'traffic-off'
  | 'turf-sprout'
  | 'turf-grow'
  | `weed-${0 | 1}-${'sprout' | 'grow'}`
  | `crop-${CropId}:${CropStage}`
  | `fruit-${CropId}:${VarietyGroup}`
  | `tree-${TreeId}:${TreeAtlasStage}`
  | `tree-seed-${TreeId}`
  | 'actor-hat'
  | 'actor-body'
  | ShovelId
  | PickaxeId
  | 'axe'
  | 'wood'
  | 'ash'
  | ContainerId
  | 'fertilizer'
  | 'weed-spray'
  | 'synth'
  | 'compost'
  | `item-rotten-${CropClass}`
  | `item-dead-${CropClass}`
  | 'item-grass'
  | 'sugar'
  | `spirit-${SpiritKind}`
  | `cask-${CaskId}-${'common' | 'rare' | 'heirloom'}`
  | `jam-${Exclude<JamCrop, 'tomato'>}`
  | 'ketchup'
  | 'oil'
  | 'flour'
  | 'extract'
  | `vfx-${VfxId}:f${0 | 1 | 2 | 3}`

type PipeFitKey = 'pipe-stub' | 'pipe-i' | 'pipe-l' | 'pipe-t' | 'pipe-x'
type FenceFitKey = 'fence-post' | 'fence-stub' | 'fence-i' | 'fence-l' | 'fence-t' | 'fence-x'

const tex = new Map<AtlasKey, Texture>()
const html = new Map<AtlasKey, string>()
const dim = new Map<AtlasKey, { w: number; h: number }>()

let boot: Promise<void> | undefined

function vb(raw: string): { w: number; h: number } {
  const m = raw.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/)
  if (m === null) throw new Error('viewBox')
  return { w: Number(m[1]), h: Number(m[2]) }
}

function innerOf(raw: string): string {
  return raw.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>[\s\S]*$/i, '')
}

function groupOf(raw: string, id: string): string {
  const needle = `id="${id}"`
  let from = 0
  while (from < raw.length) {
    const idAt = raw.indexOf(needle, from)
    if (idAt < 0) break
    const after = raw[idAt + needle.length]
    if (after !== ' ' && after !== '>' && after !== '/') {
      from = idAt + needle.length
      continue
    }
    const open = raw.lastIndexOf('<g', idAt)
    if (open < 0) break
    const gt = raw.indexOf('>', idAt)
    if (gt < 0) break
    const start = gt + 1
    const end = raw.indexOf('</g>', start)
    if (end < 0) break
    return raw.slice(start, end)
  }
  throw new Error(id)
}

function wrap(inner: string, w: number, h: number, box: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${box}" fill="none" shape-rendering="crispEdges">${inner}</svg>`
}

function dryOf(body: string): string {
  return body.replace(/<rect fill="#3d7ea6"[^/]*\/>/g, '')
}

async function raster(svg: string, w: number, h: number): Promise<Texture> {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.src = url
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = w * SCALE
  canvas.height = h * SCALE
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)
  const t = Texture.from(canvas)
  t.source.scaleMode = 'nearest'
  t.source.autoGenerateMipmaps = false
  return t
}

export function atlasVb(key: 'dirt-edge' | 'dirt-inset' | 'dirt-0'): { w: number; h: number } {
  if (key === 'dirt-edge' || key === 'dirt-inset') return { w: 24 + EDGE_PAD * 2, h: 24 + EDGE_PAD * 2 }
  return { w: 24, h: 24 }
}

async function add(key: AtlasKey, raw: string, group?: string, mutate?: (s: string) => string): Promise<void> {
  const sliced = group === undefined ? innerOf(raw) : groupOf(raw, group)
  const body = mutate === undefined ? sliced : mutate(sliced)
  const pad = key === 'dirt-edge' || key === 'dirt-inset'
  const size = key === 'dirt-edge' || key === 'dirt-inset' || key === 'dirt-0' ? atlasVb(key) : vb(raw)
  const box = pad ? `${-EDGE_PAD} ${-EDGE_PAD} ${size.w} ${size.h}` : `0 0 ${size.w} ${size.h}`
  html.set(key, body)
  dim.set(key, size)
  try {
    tex.set(key, await raster(wrap(body, size.w, size.h, box), size.w, size.h))
  } catch {
    throw new Error(key)
  }
}

const CROP: { readonly [K in CropId]: string } = {
  carrot,
  potato,
  wheat,
  tomato,
  raspberry,
  apple,
  grape,
  vanilla,
  'sugar-cane': sugarCane,
  apricot: apple,
  olive: apple,
  cherry: apple,
}

const FRUIT: { readonly [K in CropId]: string } = {
  carrot: fruitCarrot,
  potato: fruitPotato,
  wheat: fruitWheat,
  tomato: fruitTomato,
  raspberry: fruitRaspberry,
  apple: fruitApple,
  grape: fruitGrape,
  vanilla: fruitVanilla,
  'sugar-cane': fruitSugarCane,
  apricot: fruitApricot,
  olive: fruitOlive,
  cherry: fruitCherry,
}

const TREE_SEED: { readonly [K in TreeId]: string } = {
  apple: itemSeedApple,
  apricot: itemSeedApricot,
  olive: itemSeedOlive,
  cherry: itemSeedCherry,
}

const TREE: { readonly [K in TreeId]: string } = {
  apple: appleTree,
  apricot: apricotTree,
  olive: oliveTree,
  cherry: cherryTree,
}

const CROP_STAGES = ['sprout', 'grow', 'ripe', 'ripe-variant', 'ripe-variant-2', 'ripe-heirloom', 'dead'] as const
const TREE_FRUIT_STAGES = ['unripe', 'ripe'] as const

async function load(): Promise<void> {
  const jobs: (() => Promise<void>)[] = []
  const put = (key: AtlasKey, raw: string, group?: string, mutate?: (s: string) => string) => {
    jobs.push(() => add(key, raw, group, mutate))
  }
  ;([
    ['grass-0', grass0],
    ['grass-1', grass1],
    ['grass-2', grass2],
    ['grass-3', grass3],
    ['grass-4', grass4],
    ['grass-5', grass5],
    ['grass-6', grass6],
    ['grass-7', grass7],
  ] as const).forEach(([k, r]) => put(k, r))
  put('dirt-0', dirt0)
  put('dirt-1', dirt1)
  put('dirt-edge', dirtEdge)
  put('dirt-inset', dirtInset)
  put('hard-0', hard0)
  put('hard-1', hard1)
  put('hard-2', hard2)
  put('vh-0', veryHard0)
  put('vh-1', veryHard1)
  put('vh-2', veryHard2)
  put('tile-paved', tilePaved)
  put('tile-brick', tileBrick)
  put('tile-cobble', tileCobble)
  put('rotten', cropRotten)
  put('tuft-0', propGrass0)
  put('tuft-1', propGrass1)
  put('tuft-2', propGrass2)
  put('rock', rock)
  put('rock-long', rockLong)
  put('house', house)
  put('pump', pump)
  put('truck', propTruck)
  put('chest', chest)
  put('grinder', grinder)
  put('link-in', propLinkIn)
  put('link-out', propLinkOut)
  put('well', propWell)
  put('rain-tank', propRainTank)
  put('tap', propTap)
  put('sprinkler', propSprinkler)
  put('sprinkler-vert', propSprinklerVert)
  put('sprinkler-large', propSprinklerLarge)
  put('mill', propMill)
  put('still', propStill)
  put('barrel', propBarrel)
  put('jam', propJam)
  put('freezer', propFreezer)
  put('furnace-off', propFurnace, 'off')
  put('furnace-on', propFurnace, 'on')
  put('hangar', propHangar)
  put('quad', propQuad)
  put('tractor', propTractor)
  put('trailer-seed', propTrailerSeed)
  put('trailer-spray', propTrailerSpray)
  put('trailer-harvest', propTrailerHarvest)
  put('trailer-rake', propTrailerRake)
  put('silo-seed', propSiloSeed)
  put('silo-spray', propSiloSpray)
  put('silo-produce', propSiloProduce)
  put('seed-silo', propSeedSilo)
  put('additive-store', propAdditiveStore)
  put('compost-box', propCompostBox)
  put('pipe-source', pipeSource)
  put('hangar-return', uiHangarReturn)
  put('pad-drop', uiPadDrop)
  put('pad-take', uiPadTake)
  put('or', propOr)
  put('and', propAnd)
  put('not', propNot)
  const pipes = [
    ['pipe-stub', pipeStub],
    ['pipe-i', pipeI],
    ['pipe-l', pipeL],
    ['pipe-t', pipeT],
    ['pipe-x', pipeX],
  ] as const
  pipes.forEach(([k, r]) => {
    put(k, r)
    put(`${k}-dry`, r, undefined, dryOf)
  })
  put('valve-open', pipeValve, 'open')
  put('valve-closed', pipeValve, 'closed')
  put('valve-jack', pipeValveJack, 'jack')
  put('fence-post', fencePost)
  put('fence-stub', fenceStub)
  put('fence-i', fenceI)
  put('fence-l', fenceL)
  put('fence-t', fenceT)
  put('fence-x', fenceX)
  put('lever-on', propLever, 'on')
  put('lever-off', propLever, 'off')
  put('button-on', propButton, 'on')
  put('button-off', propButton, 'off')
  put('lamp-on', propLamp, 'on')
  put('lamp-off', propLamp, 'off')
  put('pulser-on', propPulser, 'on')
  put('pulser-off', propPulser, 'off')
  ;(['s0', 's1', 's2', 's3', 's4'] as const).forEach(g => put(`counter-${g}`, propCounter, g))
  put('water-blue', propSensorWater, 'blue')
  put('water-red', propSensorWater, 'red')
  put('fert-ok', propSensorFert, 'ok')
  put('fert-red', propSensorFert, 'red')
  put('harvest-on', propSensorHarvest, 'on')
  put('harvest-off', propSensorHarvest, 'off')
  put('day-on', propSensorDay, 'on')
  put('day-off', propSensorDay, 'off')
  put('water-system-on', propWaterSystem, 'on')
  put('water-system-off', propWaterSystem, 'off')
  put('vehicle-detector-on', propVehicleDetector, 'on')
  put('vehicle-detector-off', propVehicleDetector, 'off')
  put('traffic-on', propTrafficLight, 'on')
  put('traffic-off', propTrafficLight, 'off')
  put('turf-sprout', cropGrass, 'sprout')
  put('turf-grow', cropGrass, 'grow')
  put('weed-0-sprout', weed0, 'sprout')
  put('weed-0-grow', weed0, 'grow')
  put('weed-1-sprout', weed1, 'sprout')
  put('weed-1-grow', weed1, 'grow')
  ANNUAL_IDS.forEach(id => {
    CROP_STAGES.forEach(st => put(`crop-${id}:${st}`, CROP[id], st))
  })
  ;[...ANNUAL_IDS, ...TREE_IDS].forEach(id => {
    ;(['base', 'variant', 'variant-2', 'heirloom'] as const).forEach(g => put(`fruit-${id}:${g}`, FRUIT[id], g))
  })
  ;(TREE_IDS as TreeId[]).forEach(id => {
    put(`tree-${id}:trunk`, TREE[id], 'trunk')
    put(`tree-${id}:grow`, TREE[id], 'grow')
    TREE_FRUIT_STAGES.forEach(st => {
      put(`tree-${id}:${st}`, TREE[id], st)
      put(`tree-${id}:${st}-variant`, TREE[id], `${st}-variant`)
      put(`tree-${id}:${st}-variant-2`, TREE[id], `${st}-variant-2`)
      put(`tree-${id}:${st}-heirloom`, TREE[id], `${st}-heirloom`)
    })
    put(`tree-seed-${id}`, TREE_SEED[id])
  })
  const hat = groupOf(actor, 'hat').replace(/var\(--hat, #d4a017\)/g, '#ffffff')
  const body = innerOf(actor).replace(/<g id="hat"[^>]*>[\s\S]*?<\/g>/, '')
  put('actor-hat', actor, undefined, () => hat)
  put('actor-body', actor, undefined, () => body)
  put('shovel', shovel)
  put('better-shovel', better)
  put('rotary-shovel', rotaryShovel)
  put('pickaxe', pickaxe)
  put('better-pickaxe', betterPickaxe)
  put('diamond-pickaxe', diamondPickaxe)
  put('bucket', bucket)
  put('large-bucket', largeBucket)
  put('fertilizer', itemFertilizer)
  put('weed-spray', itemWeedSpray)
  put('synth', itemSynth)
  put('compost', itemCompost)
  put('item-rotten-root', itemRotten, 'root')
  put('item-rotten-grain', itemRotten, 'grain')
  put('item-rotten-fruit', itemRotten, 'fruit')
  put('item-dead-root', itemDead, 'root')
  put('item-dead-grain', itemDead, 'grain')
  put('item-dead-fruit', itemDead, 'fruit')
  put('item-grass', itemGrass)
  put('sugar', itemSugar)
  put('spirit-vodka', itemSpiritVodka)
  put('spirit-beer', itemSpiritBeer)
  put('spirit-brandy', itemSpiritBrandy)
  put('spirit-mixed', itemSpiritMixed)
  put('cask-wine-common', itemWine, 'common')
  put('cask-wine-rare', itemWine, 'rare')
  put('cask-wine-heirloom', itemWine, 'heirloom')
  put('cask-cider-common', itemCider, 'common')
  put('cask-cider-rare', itemCider, 'rare')
  put('cask-cider-heirloom', itemCider, 'heirloom')
  put('jam-apricot', itemJamApricot)
  put('jam-grape', itemJamGrape)
  put('jam-raspberry', itemJamRaspberry)
  put('jam-cherry', itemJamCherry)
  put('ketchup', itemKetchup)
  put('oil', itemOil)
  put('flour', itemFlour)
  put('extract', itemExtract)
  put('axe', itemAxe)
  put('wood', itemWood)
  put('ash', itemAsh)
  ;([
    ['sprinkler-spray', spray, 4],
    ['sprinkler-spray-large', sprayLarge, 4],
    ['sprinkler-spray-vert', sprayVert, 2],
    ['tend', tend, 2],
    ['pour', pour, 2],
    ['brew', brew, 4],
    ['dust', dust, 2],
    ['steam', steam, 4],
    ['dig', dig, 4],
    ['furnace', furnaceVfx, 4],
    ['furnace-smoke', furnaceSmokeVfx, 4],
  ] as const).forEach(([id, raw, n]) => {
    const frames = [0, 1, 2, 3] as const
    for (const i of frames) {
      if (i >= n) break
      put(`vfx-${id}:f${i}`, raw, `f${i}`)
    }
  })
  const batch = 8
  for (let i = 0; i < jobs.length; i += batch) {
    await Promise.all(jobs.slice(i, i + batch).map(fn => fn()))
  }
}

export function atlasReady(): Promise<void> {
  if (boot === undefined) boot = load()
  return boot
}

export function atlasTex(key: AtlasKey): Texture {
  const t = tex.get(key)
  if (t === undefined) throw new Error(key)
  return t
}

export function atlasHtml(key: AtlasKey): string {
  const h = html.get(key)
  if (h === undefined) throw new Error(key)
  return h
}

export function atlasSize(key: AtlasKey): { w: number; h: number } {
  const d = dim.get(key)
  if (d === undefined) throw new Error(key)
  return d
}

export function vfxKey(id: VfxId, frame: 0 | 1 | 2 | 3): AtlasKey {
  return `vfx-${id}:f${frame}`
}

export function pipeFit(n: boolean, e: boolean, s: boolean, w: boolean): { key: PipeFitKey; rot: number } | undefined {
  const d = Number(n) + Number(e) + Number(s) + Number(w)
  if (d === 0) return undefined
  if (d === 4) return { key: 'pipe-x', rot: 0 }
  if (d === 3) {
    if (!n) return { key: 'pipe-t', rot: 0 }
    if (!e) return { key: 'pipe-t', rot: 90 }
    if (!s) return { key: 'pipe-t', rot: 180 }
    return { key: 'pipe-t', rot: 270 }
  }
  if (d === 1) {
    if (e) return { key: 'pipe-stub', rot: 0 }
    if (s) return { key: 'pipe-stub', rot: 90 }
    if (w) return { key: 'pipe-stub', rot: 180 }
    return { key: 'pipe-stub', rot: 270 }
  }
  if (e && w) return { key: 'pipe-i', rot: 0 }
  if (n && s) return { key: 'pipe-i', rot: 90 }
  if (e && s) return { key: 'pipe-l', rot: 0 }
  if (s && w) return { key: 'pipe-l', rot: 90 }
  if (w && n) return { key: 'pipe-l', rot: 180 }
  return { key: 'pipe-l', rot: 270 }
}

export function fenceFit(n: boolean, e: boolean, s: boolean, w: boolean): { key: FenceFitKey; rot: number } {
  const d = Number(n) + Number(e) + Number(s) + Number(w)
  if (d === 0) return { key: 'fence-post', rot: 0 }
  if (d === 4) return { key: 'fence-x', rot: 0 }
  if (d === 3) {
    if (!n) return { key: 'fence-t', rot: 0 }
    if (!e) return { key: 'fence-t', rot: 90 }
    if (!s) return { key: 'fence-t', rot: 180 }
    return { key: 'fence-t', rot: 270 }
  }
  if (d === 1) {
    if (e) return { key: 'fence-stub', rot: 0 }
    if (s) return { key: 'fence-stub', rot: 90 }
    if (w) return { key: 'fence-stub', rot: 180 }
    return { key: 'fence-stub', rot: 270 }
  }
  if (e && w) return { key: 'fence-i', rot: 0 }
  if (n && s) return { key: 'fence-i', rot: 90 }
  if (e && s) return { key: 'fence-l', rot: 0 }
  if (s && w) return { key: 'fence-l', rot: 90 }
  if (w && n) return { key: 'fence-l', rot: 180 }
  return { key: 'fence-l', rot: 270 }
}

export function cropKey(id: CropId, stage: CropStage): AtlasKey {
  return `crop-${id}:${stage}`
}

export function tileKey(id: TileId): AtlasKey {
  return `tile-${id}`
}

export function sensorKey(cell: Sensor): AtlasKey {
  if (cell.kind === 'lever') return cell.on ? 'lever-on' : 'lever-off'
  if (cell.kind === 'button') return cell.out === 1 ? 'button-on' : 'button-off'
  if (cell.kind === 'lamp') return cell.inn === 1 ? 'lamp-on' : 'lamp-off'
  if (cell.kind === 'or') return 'or'
  if (cell.kind === 'and') return 'and'
  if (cell.kind === 'not') return 'not'
  if (cell.kind === 'pulser') return cell.out === 1 ? 'pulser-on' : 'pulser-off'
  if (cell.kind === 'counter') return `counter-${counterDial(cell)}`
  if (cell.kind === 'sensor-water') return cell.out === 1 ? 'water-blue' : 'water-red'
  if (cell.kind === 'sensor-fert') return cell.out === 0 ? 'fert-red' : 'fert-ok'
  if (cell.kind === 'sensor-harvest') return cell.out === 1 ? 'harvest-on' : 'harvest-off'
  if (cell.kind === 'sensor-day') return cell.out === 1 ? 'day-on' : 'day-off'
  if (cell.kind === 'water-system') return cell.out === 1 ? 'water-system-on' : 'water-system-off'
  if (cell.kind === 'traffic-light') return cell.inn === 1 ? 'traffic-on' : 'traffic-off'
  if (cell.kind === 'vehicle-detector') return cell.out === 1 ? 'vehicle-detector-on' : 'vehicle-detector-off'
  const _: never = cell
  throw new Error(String(_))
}

export const HAT: { readonly [K in SeatId]: number } = {
  0: 0xd4a017,
  1: 0xff3d8e,
  2: 0x2de8ff,
  3: 0xb85cff,
}

export function faceKey(item: Item): AtlasKey {
  if (item.kind === 'seeds') return cropKey(item.crop, ripeGroup(item.crop, item.variety))
  if (item.kind === 'fruit') return `fruit-${item.crop}:${fruitGroup(item.crop, item.variety)}`
  if (item.kind === 'tree-seed') return `tree-seed-${item.tree}`
  if (item.kind === 'shovel') return item.id
  if (item.kind === 'pickaxe') return item.id
  if (item.kind === 'container') return item.id
  if (item.kind === 'fertilizer') return 'fertilizer'
  if (item.kind === 'weed-spray') return 'weed-spray'
  if (item.kind === 'synth') return 'synth'
  if (item.kind === 'compost') return 'compost'
  if (item.kind === 'grass') return 'item-grass'
  if (item.kind === 'grass-seeds') return 'turf-grow'
  if (item.kind === 'weed') return 'weed-0-grow'
  if (item.kind === 'rotten') return `item-rotten-${item.cls}`
  if (item.kind === 'dead') return `item-dead-${item.cls}`
  if (item.kind === 'sugar') return 'sugar'
  if (item.kind === 'spirit') return `spirit-${item.spirit}`
  if (item.kind === 'cask') return `cask-${item.cask}-${caskGroup(item.variety)}`
  if (item.kind === 'jam') {
    if (item.crop === 'tomato') return 'ketchup'
    return `jam-${item.crop}`
  }
  if (item.kind === 'oil') return 'oil'
  if (item.kind === 'flour') return 'flour'
  if (item.kind === 'extract') return 'extract'
  if (item.kind === 'axe') return 'axe'
  if (item.kind === 'wood') return 'wood'
  if (item.kind === 'ash') return 'ash'
  const _: never = item
  throw new Error(String(_))
}

export function ripeStage(crop: CropId, variety: VarietyId): CropStage {
  return ripeGroup(crop, variety)
}

export function treeAtlasStage(species: TreeId, stage: 'trunk' | 'grow' | 'unripe' | 'ripe', variety: VarietyId): TreeAtlasStage {
  if (stage === 'trunk' || stage === 'grow') return stage
  const g = varietyGroup(species, variety)
  return g === 'base' ? stage : `${stage}-${g}`
}
