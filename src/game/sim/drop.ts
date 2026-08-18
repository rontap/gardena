import type { Coord } from './building.ts'
import type { Item } from './item.ts'

export type Drop = { at: Coord; item: Item }

export function topIndex(drops: readonly Drop[], at: Coord): number {
  let i = -1
  drops.forEach((d, k) => {
    if (d.at.col === at.col && d.at.row === at.row) i = k
  })
  return i
}

export function onCell(drops: readonly Drop[], at: Coord): Drop[] {
  return drops.filter(d => d.at.col === at.col && d.at.row === at.row)
}
