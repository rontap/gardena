import {
  CHUNK,
  DOOR,
  Rock,
  Tree,
  chunkRect,
  inWorld,
  isReserved,
  local,
  occupiedCells,
  type ChunkId,
  type Coord,
  type AdditiveStore,
  type House,
  type Pump,
  type SeedSilo,
  type Truck,
} from './building.ts'
import { mintStart } from './feature-burrow/burrow.ts'
import { goodness, groundOf, hardnessOf } from './noise.ts'
import { bare, type Cell } from './plot.ts'
import type { Rng } from './rng.ts'

const ROCK_BASE = 0.002
const ROCK_EDGE = 0.004
const ROCK_HARD = 0.03

export function generateChunk(
  rng: Rng,
  id: ChunkId,
  house: House,
  pump: Pump,
  truck: Truck,
  silo: SeedSilo,
  additives: AdditiveStore,
): Cell[][] {
  const cells: Cell[][] = []
  for (let row = 0; row < CHUNK; row++) {
    const line: Cell[] = []
    for (let col = 0; col < CHUNK; col++) line.push(bare('soft', 0))
    cells.push(line)
  }
  const rect = chunkRect(id)
  const owned = [id]
  const gen = rng.stream('gen')
  for (let row = rect.row0; row < rect.row1; row++) {
    for (let col = rect.col0; col < rect.col1; col++) {
      const at = { col, row }
      if (isReserved(at)) continue
      if (atCell(cells, at).kind === 'rock') continue
      const r = Math.hypot(col + 0.5 - 16, row + 0.5 - 16)
      const g = goodness(rng, col, row)
      const pRock = ROCK_BASE + ROCK_EDGE * (r / 32) + ROCK_HARD * hardnessOf(g)
      if (gen.at(0, col, row) < pRock) {
        placeRock(cells, rng, id, at)
        continue
      }
      put(cells, at, bare(groundOf(g), hardnessOf(g)))
    }
  }
  clearBase(cells, id)
  if (id.cx === 0 && id.cy === 0) spawnAppleTree(cells, id)
  occupiedCells(house.base, owned).forEach(at => put(cells, at, house))
  occupiedCells(pump.base, owned).forEach(at => put(cells, at, pump))
  occupiedCells(truck.base, owned).forEach(at => put(cells, at, truck))
  occupiedCells(silo.base, owned).forEach(at => put(cells, at, silo))
  occupiedCells(additives.base, owned).forEach(at => put(cells, at, additives))
  if (id.cx === 0 && id.cy === 0) mintStart(cells, rng)
  return cells
}

function spawnAppleTree(cells: Cell[][], id: ChunkId): void {
  const rect = chunkRect(id)
  for (let row = rect.row0; row < rect.row1; row++) {
    for (let col = rect.col0; col < rect.col1; col++) {
      const a = { col, row }
      const b = { col, row: row + 1 }
      if (!inWorld(b, [id])) continue
      if (atCell(cells, a).kind !== 'untilled' || atCell(cells, b).kind !== 'untilled') continue
      const ca = atCell(cells, a)
      const cb = atCell(cells, b)
      if (ca.kind !== 'untilled' || cb.kind !== 'untilled' || ca.ground !== 'soft' || cb.ground !== 'soft') continue
      const tree = new Tree('apple', { shape: 'rect', col, row, w: 1, h: 2 })
      put(cells, a, tree)
      put(cells, b, tree)
      return
    }
  }
}

function placeRock(cells: Cell[][], rng: Rng, id: ChunkId, at: Coord): void {
  const shape = rng.stream('gen').at(1, at.col, at.row)
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
      if (isReserved({ col, row })) continue
      if (!nearBase(col, row)) continue
      const cell = atCell(cells, { col, row })
      if (cell.kind === 'rock') {
        occupiedCells(cell.base, [id]).forEach(at => put(cells, at, bare('soft', 0)))
        continue
      }
      if (cell.kind === 'untilled' && cell.ground !== 'soft') {
        put(cells, { col, row }, bare('soft', 0))
      }
    }
  }
}

function freeRock(cells: Cell[][], id: ChunkId, at: Coord): boolean {
  if (!inWorld(at, [id])) return false
  if (isReserved(at)) return false
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
