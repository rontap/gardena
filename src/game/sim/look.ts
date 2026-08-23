import { inFade, inWorld } from './building.ts'
import { NOT_OWNED } from './prompt.ts'
import { onCell } from './drop.ts'
import type { Rarity } from '../defs/rarity.ts'
import { TREE_NAME } from '../defs/trees.ts'
import { cropName, heldText, skuLabel, type Hand } from './item.ts'
import type { PromptHit } from './prompt.ts'
import { fertBand, waterBand, SOIL_WATER_MID, type Band, type Soil } from './soil.ts'
import type { TileId } from './ids.ts'
import type { World } from './world.ts'

const FERT_WORD: { readonly [K in Band]: string } = {
  green: 'fed',
  orange: 'mediocre',
  red: 'starving',
}

export function lookText(world: World, hit: PromptHit | undefined, plantStats: boolean): string {
  const place = world.seats[world.local].place
  if (place.kind === 'delete') return world.promptHit(hit).text
  if (
    hit !== undefined &&
    (hit.kind === 'valve' || hit.kind === 'well' || hit.kind === 'sprinkler-hud')
  ) {
    return world.promptHit(hit).text
  }
  if (
    place.kind === 'sku' &&
    (place.id === 'buy-pipe' ||
      place.id === 'buy-valve' ||
      place.id === 'buy-well' ||
      place.id === 'buy-sprinkler' ||
      place.id === 'buy-sprinkler-vert' ||
      place.id === 'buy-sprinkler-large')
  ) {
    return world.promptHit(hit).text
  }
  const at = hit !== undefined && hit.kind === 'cell' ? hit.at : undefined
  if (at !== undefined) {
    const face = world.faces().find(f => f.at.col === at.col && f.at.row === at.row)
    if (face !== undefined) {
      if (world.money < face.price) return 'Cannot afford'
      return `expand ${face.price}`
    }
  }
  if (at === undefined) {
    if (place.kind === 'sku') return `Place ${skuLabel(place.id)}`
    return '—'
  }
  if (!inWorld(at, world.owned)) {
    if (inFade(at, world.owned)) return NOT_OWNED
    if (place.kind === 'sku') {
      return `Place ${skuLabel(place.id)}`
    }
    return '—'
  }
  const cell = world.cell(at)
  const lines: string[] = []
  if (place.kind === 'sku') {
    lines.push(`Place ${skuLabel(place.id)}`)
  }
  if (cell.kind === 'house') lines.push('House')
  else if (cell.kind === 'truck') lines.push('Market truck')
  else if (cell.kind === 'pump') lines.push(`Pump - ${liters(cell.water.stored)} of ${liters(cell.water.capacity)}`)
  else if (cell.kind === 'rain-tank') lines.push(`Rainwater tank - ${liters(cell.water.stored)} of ${liters(cell.water.capacity)}`)
  else if (cell.kind === 'tap') lines.push('Tap')
  else if (cell.kind === 'rock') lines.push('Rock')
  else if (cell.kind === 'seed-silo') lines.push(`Seed silo - ${cell.used} of ${cell.cap} seeds`)
  else if (cell.kind === 'additive-store') lines.push(`Additive store - ${liters(cell.used)} of ${liters(cell.cap)}`)
  else if (cell.kind === 'chest') lines.push('Chest')
  else if (cell.kind === 'freezer') lines.push('Freezer')
  else if (cell.kind === 'grinder') lines.push('Seed grinder')
  else if (cell.kind === 'compost-box') lines.push('Compost box')
  else if (cell.kind === 'mill') lines.push('Mill')
  else if (cell.kind === 'still') lines.push('Pot still')
  else if (cell.kind === 'barrel') lines.push('Wine barrel')
  else if (cell.kind === 'jam') lines.push('Jam machine')
  else if (cell.kind === 'tree') {
    const name = `${TREE_NAME[cell.species]} tree`
    if (cell.juvenile < 1) lines.push(`${name} - growing ${Math.floor(cell.juvenile * 100)}%`)
    else if (cell.yield.kind === 'on') lines.push(`${name} - yielding`)
    else if (cell.yield.kind === 'pending') lines.push(`${name} - resting`)
    else lines.push(`${name} - resting`)
    if (cell.juvenile >= 1) lines.push(`fruit ${Math.floor(cell.fruit * 100)}%`)
  }
  else if (cell.kind === 'untilled') {
    if (cell.cover.kind === 'tile') lines.push(tileName(cell.cover.tile))
    else if (cell.ground === 'soft') lines.push('Grass')
    else if (cell.ground === 'hard') lines.push('Hard soil')
    else lines.push('Very hard soil')
  } else if (cell.kind === 'infertile') lines.push('Infertile soil')
  else if (cell.kind === 'empty') lines.push(`Tilled soil - ${soilLine(cell.soil)}`)
  else if (cell.kind === 'weed') lines.push(`Weed - ${soilLine(cell.soil)}`)
  else if (cell.kind === 'turf') lines.push(`Grass - rooting ${Math.floor(cell.turf.maturity * 100)}%`)
  else if (cell.kind === 'growing') {
    const st = cell.plant.stats(world.modifiers)
    lines.push(`${cropName(cell.plant.crop)} - growing ${Math.floor(cell.plant.maturity * 100)}%`)
    if (plantStats) {
      lines.push(`happiness ${Math.floor(cell.plant.happiness * 100)}%`)
      lines.push(`water ${liters(cell.soil.water)} of ${liters(SOIL_WATER_MID)} - ${waterWord(cell.soil, st.waterTolerance)}`)
      lines.push(`fertilizer ${Math.floor(cell.soil.fertilizer * 100)}% - ${FERT_WORD[fertBand(cell.soil.fertilizer, st.fertTolerance)]}`)
    }
  } else if (cell.kind === 'ripe') {
    lines.push(`${cropName(cell.plant.crop)} - ripe, ${rarityText(cell.plant.rarity)}${plantStats ? `, freshness ${Math.floor(cell.plant.freshness * 100)}%` : ''}`)
  } else if (cell.kind === 'rotten') {
    lines.push(`Rotten ${cropName(cell.crop)} - ${soilLine(cell.soil)}`)
  } else {
    lines.push(`${cropName(cell.plant.crop)} - dead`)
  }
  if (world.hasFence(at)) lines.push('Wooden fence')
  const drop = onCell(world.drops, at).at(-1)
  if (drop !== undefined) {
    const hand: Hand = { kind: 'hold', item: drop.item }
    lines.push(heldText(hand, world.modifiers))
  }
  lines.push(world.prompt(at).text)
  return lines.join('\n')
}

const TILE_NAME: { readonly [K in TileId]: string } = {
  paved: 'Paving slab',
  brick: 'Brickwork',
  cobble: 'Cobblestone',
}

function tileName(id: TileId): string {
  return TILE_NAME[id]
}

function soilLine(soil: Soil): string {
  return `water ${liters(soil.water)}, fertilizer ${Math.floor(soil.fertilizer * 100)}%${soil.bio ? '' : ', not organic'}`
}

function liters(n: number): string {
  return `${Number(n.toFixed(2))}L`
}

function rarityText(rarity: Rarity): string {
  return rarity.slice(0, 1).toUpperCase() + rarity.slice(1)
}

function waterWord(soil: Soil, tol: number): string {
  const band = waterBand(soil.water, tol)
  if (band === 'green') return 'happy'
  if (band === 'orange') return soil.drowning ? 'too wet' : 'thirsty'
  return soil.drowning ? 'drowning' : 'wilting'
}
