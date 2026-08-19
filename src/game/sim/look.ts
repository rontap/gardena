import { WITHER } from '../defs/crops.ts'
import { inWorld } from './building.ts'
import { onCell } from './drop.ts'
import { cropName, heldText, skuLabel, type Hand } from './item.ts'
import type { PromptHit } from './prompt.ts'
import type { World } from './world.ts'

export function lookText(world: World, hit: PromptHit | undefined): string {
  if (world.place.kind === 'delete') return world.promptHit(hit).text
  if (
    world.place.kind === 'sku' &&
    (world.place.id === 'buy-pipe' ||
      world.place.id === 'buy-sprinkler' ||
      world.place.id === 'buy-sprinkler-vert' ||
      world.place.id === 'buy-sprinkler-large')
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
  if (at === undefined || !inWorld(at, world.owned)) {
    if (world.place.kind === 'sku') {
      return `Place ${skuLabel(world.place.id)}`
    }
    return '—'
  }
  const cell = world.cell(at)
  const lines: string[] = []
  if (world.place.kind === 'sku') {
    lines.push(`Place ${skuLabel(world.place.id)}`)
  }
  if (cell.kind === 'house') lines.push('House')
  else if (cell.kind === 'truck') lines.push('Market truck')
  else if (cell.kind === 'pump') lines.push(cell.form === 'well' ? 'Well' : 'Pump')
  else if (cell.kind === 'rock') lines.push('Rock')
  else if (cell.kind === 'chest') lines.push('Chest')
  else if (cell.kind === 'grinder') lines.push('Seed grinder')
  else if (cell.kind === 'shrub') lines.push(cell.ripe ? 'Berry shrub' : 'Shrub')
  else if (cell.kind === 'untilled') {
    if (cell.ground === 'soft') lines.push('Grass')
    else if (cell.ground === 'hard') lines.push('Hard soil')
    else lines.push('Very hard soil')
  } else if (cell.kind === 'infertile') lines.push('Infertile soil')
  else if (cell.kind === 'empty') lines.push('Tilled soil')
  else if (cell.kind === 'growing') {
    if (cell.plant.thirst < WITHER) {
      lines.push(
        `${cropName(cell.plant.crop)} - water ${Math.floor(cell.plant.thirst * 100)}%, happiness ${Math.floor(cell.plant.happiness * 100)}%`,
      )
    } else {
      lines.push(
        `${cropName(cell.plant.crop)} - growing ${Math.floor(cell.plant.maturity * 100)}%, water ${Math.floor(cell.plant.thirst * 100)}%, happiness ${Math.floor(cell.plant.happiness * 100)}%`,
      )
    }
  } else if (cell.kind === 'ripe') {
    lines.push(`${cropName(cell.plant.crop)} - ripe, freshness ${Math.floor(cell.plant.freshness * 100)}%`)
  } else if (cell.kind === 'rotten') {
    lines.push('Rotten plant')
  } else {
    lines.push(`${cropName(cell.plant.crop)} - dead`)
  }
  const drop = onCell(world.drops, at).at(-1)
  if (drop !== undefined) {
    const hand: Hand = { kind: 'hold', item: drop.item }
    lines.push(heldText(hand, world.modifiers))
  }
  lines.push(world.prompt(at).text)
  return lines.join('\n')
}
