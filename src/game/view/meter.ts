import { Texture } from 'pixi.js'
import type { RectBase } from '../sim/building.ts'
import { craftState, type CraftCell, type MachineId } from '../sim/feature-machines/recipe.ts'
import type { SpritePool } from './app.ts'
import { TILE } from './camera.ts'

const INK = 0x1c1710
const GOOD = 0x2fd15a

export const METERED: readonly MachineId[] = ['mill', 'jam', 'still', 'grinder', 'compost-box', 'furnace', 'infuser']

export type Meter = { show: false } | { show: true; t: number }

export function meterOf(cell: CraftCell, mul: number, haste: number): Meter {
  if (!METERED.some(id => id === cell.kind)) return { show: false }
  const craft = craftState(cell, mul, haste)
  if (craft.kind !== 'working') return { show: false }
  return { show: true, t: craft.progress }
}

export function drawMeter(pool: SpritePool, base: RectBase, t: number): void {
  const white = Texture.WHITE
  const x = base.col * TILE
  const y = (base.row + base.h) * TILE - 6
  const span = base.w * TILE
  const bg = pool.take(white)
  bg.tint = INK
  bg.position.set(x + 2, y)
  bg.width = span - 4
  bg.height = 4
  const fg = pool.take(white)
  fg.tint = GOOD
  fg.position.set(x + 3, y + 1)
  fg.width = (span - 6) * t
  fg.height = 2
}
