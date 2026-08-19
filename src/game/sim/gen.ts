import {
  CHUNK,
  DOOR,
  HOUSE_BASE,
  PUMP_BASE,
  TRUCK_BASE,
  YARD,
  Rock,
  Shrub,
  chunkRect,
  inWorld,
  local,
  occupiedCells,
  type ChunkId,
  type Coord,
  type House,
  type Pump,
  type Truck,
} from './building.ts'
import type { Cell } from './plot.ts'
import { hash } from './rng.ts'

const HOME: ChunkId[] = [{ cx: 0, cy: 0 }]

const RESERVED = new Set(
  [
    ...occupiedCells(HOUSE_BASE, HOME),
    ...occupiedCells(PUMP_BASE, HOME),
    DOOR,
    ...occupiedCells(TRUCK_BASE, HOME),
    ...YARD,
  ].map(a => `${a.col},${a.row}`),
)

export function generateChunk(seed: number, id: ChunkId, house: House, pump: Pump, truck: Truck): Cell[][] {
  const cells: Cell[][] = []
  for (let row = 0; row < CHUNK; row++) {
    const line: Cell[] = []
    for (let col = 0; col < CHUNK; col++) line.push({ kind: 'untilled', ground: 'soft' })
    cells.push(line)
  }
  const rect = chunkRect(id)
  const owned = [id]
  for (let row = rect.row0; row < rect.row1; row++) {
    for (let col = rect.col0; col < rect.col1; col++) {
      const at = { col, row }
      if (RESERVED.has(`${col},${row}`)) continue
      if (atCell(cells, at).kind === 'rock') continue
      const r = Math.hypot(col + 0.5 - 16, row + 0.5 - 16)
      const t = r / 32
      const pRock = 0.014 + 0.01 * t
      const pVhard = 0.004 + 0.04 * t
      const pHard = 0.015 + 0.06 * t
      if (hash(seed, 'rock', col, row) < pRock) {
        placeRock(cells, seed, id, at)
        continue
      }
      const u = hash(seed, 'soil', col, row)
      let ground: 'soft' | 'hard' | 'very-hard' = 'soft'
      if (u < pVhard) ground = 'very-hard'
      else if (u < pVhard + pHard) ground = 'hard'
      put(cells, at, { kind: 'untilled', ground })
      if (ground === 'soft' && hash(seed, 'shrub', col, row) < 0.0035) {
        put(cells, at, new Shrub(false, 0))
      }
    }
  }
  clearBase(cells, id)
  occupiedCells(house.base, owned).forEach(at => put(cells, at, house))
  occupiedCells(pump.base, owned).forEach(at => put(cells, at, pump))
  occupiedCells(truck.base, owned).forEach(at => put(cells, at, truck))
  return cells
}

function placeRock(cells: Cell[][], seed: number, id: ChunkId, at: Coord): void {
  const shape = hash(seed, 'rock-shape', at.col, at.row)
  if (shape < 0.12) {
    const east = { col: at.col + 1, row: at.row }
    if (freeRock(cells, id, east)) {
      const rock = new Rock({ shape: 'rect', col: at.col, row: at.row, w: 2, h: 1 })
      put(cells, at, rock)
      put(cells, east, rock)
      return
    }
  } else if (shape < 0.2) {
    const south = { col: at.col, row: at.row + 1 }
    if (freeRock(cells, id, south)) {
      const rock = new Rock({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 2 })
      put(cells, at, rock)
      put(cells, south, rock)
      return
    }
  }
  put(cells, at, new Rock({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }))
}

const CLEAR = 8

function nearBase(col: number, row: number): boolean {
  return Math.hypot(col + 0.5 - (DOOR.col + 0.5), row + 0.5 - (DOOR.row + 0.5)) < CLEAR
}

function clearBase(cells: Cell[][], id: ChunkId): void {
  const rect = chunkRect(id)
  for (let row = rect.row0; row < rect.row1; row++) {
    for (let col = rect.col0; col < rect.col1; col++) {
      if (RESERVED.has(`${col},${row}`)) continue
      if (!nearBase(col, row)) continue
      const cell = atCell(cells, { col, row })
      if (cell.kind === 'rock') {
        occupiedCells(cell.base, [id]).forEach(at => put(cells, at, { kind: 'untilled', ground: 'soft' }))
        continue
      }
      if (cell.kind === 'shrub' || (cell.kind === 'untilled' && cell.ground !== 'soft')) {
        put(cells, { col, row }, { kind: 'untilled', ground: 'soft' })
      }
    }
  }
}

function freeRock(cells: Cell[][], id: ChunkId, at: Coord): boolean {
  if (!inWorld(at, [id])) return false
  if (RESERVED.has(`${at.col},${at.row}`)) return false
  return atCell(cells, at).kind !== 'rock'
}

function atCell(cells: Cell[][], at: Coord): Cell {
  const loc = local(at)
  return cells[loc.row][loc.col]
}

function put(cells: Cell[][], at: Coord, cell: Cell): void {
  const loc = local(at)
  cells[loc.row][loc.col] = cell
}
