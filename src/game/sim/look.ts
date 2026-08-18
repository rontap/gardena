import type { Coord } from './building.ts'
import { inWorld } from './building.ts'
import { onCell } from './drop.ts'
import { cropName, heldText, skuLabel, type Hand } from './item.ts'
import type { World } from './world.ts'

export function lookText(world: World, at: Coord | undefined): string {
  if (at !== undefined) {
    const face = world.faces().find(f => f.at.col === at.col && f.at.row === at.row)
    if (face !== undefined) {
      if (world.money < face.price) return 'Cannot afford'
      return `expand ${face.price}`
    }
  }
  if (at === undefined || !inWorld(at, world.owned)) {
    if (world.place.kind === 'sku') return `Place ${skuLabel(world.place.id)}`
    return '—'
  }
  const cell = world.cell(at)
  const lines: string[] = []
  if (world.place.kind === 'sku') lines.push(`Place ${skuLabel(world.place.id)}`)
  if (cell.kind === 'house') lines.push('House')
  else if (cell.kind === 'pump') lines.push('Pump')
  else if (cell.kind === 'rock') lines.push('Rock')
  else if (cell.kind === 'shrub') lines.push(cell.ripe ? 'Berry shrub' : 'Shrub')
  else if (cell.kind === 'untilled') {
    if (cell.ground === 'soft') lines.push('Grass')
    else if (cell.ground === 'hard') lines.push('Hard soil')
    else lines.push('Very hard soil')
  } else if (cell.kind === 'infertile') lines.push('Infertile soil')
  else if (cell.kind === 'empty') lines.push('Tilled soil')
  else if (cell.kind === 'growing') {
    lines.push(
      `${cropName(cell.plant.crop)} - growing ${Math.floor(cell.plant.maturity * 100)}%, water ${Math.floor(cell.plant.thirst * 100)}%`,
    )
  } else if (cell.kind === 'ripe') {
    lines.push(`${cropName(cell.plant.crop)} - ripe, water ${Math.floor(cell.plant.thirst * 100)}%`)
  } else {
    lines.push(`${cropName(cell.plant.crop)} - dead`)
  }
  const drop = onCell(world.drops, at).at(-1)
  if (drop !== undefined) {
    const hand: Hand = { kind: 'hold', item: drop.item }
    lines.push(heldText(hand))
  }
  lines.push(world.prompt(at).text)
  return lines.join('\n')
}
