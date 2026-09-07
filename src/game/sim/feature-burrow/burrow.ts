import {
  BURROW_START_N,
  BURROW_START_R,
  LOOT_GATE_BASE,
  LOOT_GATE_FERT,
  LOOT_GATE_HEIRLOOM,
  LOOT_GATE_TOOL,
  LOOT_GATE_VARIANT,
  LOOT_LUCK_DIV,
  LOOT_ROLL_BASE,
  LOOT_ROLL_DAY,
  LOOT_ROLL_DAY_SPAN,
  LOOT_ROLL_DIST,
  LOOT_ROLL_DIST_R,
  LOOT_U_OFF,
  LOOT_U_SPAN,
  SEED_BASE_COUNT,
  SEED_HEIRLOOM_COUNT,
  SEED_VARIANT_COUNT,
  TREASURE_COINS_BASE,
  TREASURE_COINS_SPAN,
} from '../../defs/burrow.ts'
import { AXES, FERT_BAG_LITERS, PICKAXES, SHOVELS } from '../../defs/items.ts'
import type { VarietyId } from '../../defs/varieties.ts'
import {
  chunkRect,
  DOOR,
  isReserved,
  local,
  type ChunkId,
  type Coord,
} from '../building.ts'
import { onCell } from '../drop.ts'
import { luckOf } from '../family.ts'
import type { TreeId } from '../ids.ts'
import type { Cell, LootItem } from '../plot.ts'
import type { Rng } from '../rng.ts'
import { nearSite } from '../store.ts'
import type { World } from '../world.ts'

type SeedCrop = 'tomato' | 'raspberry' | 'grape' | 'vanilla'
type ToolId = 'better-shovel' | 'better-pickaxe' | 'axe'
type LootRowId =
  | 'treasure'
  | 'tree-seed-base'
  | 'tree-seed-variant'
  | 'tree-seed-heirloom'
  | 'fertilizer'
  | 'tool'
  | 'seeds-base'
  | 'seeds-variant'
  | 'seeds-heirloom'

const TREE_BASE: readonly TreeId[] = ['apple', 'apricot', 'cherry', 'olive']
const TREE_VARIANT: readonly { tree: TreeId; variety: VarietyId }[] = [
  { tree: 'apple', variety: 'kingston-black' },
  { tree: 'apricot', variety: 'blenheim' },
  { tree: 'olive', variety: 'arbequina' },
]
const TREE_HEIRLOOM: readonly { tree: TreeId; variety: VarietyId }[] = [
  { tree: 'apple', variety: 'pink-lady' },
  { tree: 'apricot', variety: 'klosterneuburger' },
  { tree: 'cherry', variety: 'bing' },
]
const SEED_BASE: readonly SeedCrop[] = ['tomato', 'raspberry', 'grape', 'vanilla']
const SEED_VARIANT: readonly { crop: SeedCrop; variety: VarietyId }[] = [
  { crop: 'tomato', variety: 'green-zebra' },
  { crop: 'grape', variety: 'concord' },
]
const SEED_HEIRLOOM: readonly { crop: SeedCrop; variety: VarietyId }[] = [
  { crop: 'tomato', variety: 'san-marzano' },
  { crop: 'raspberry', variety: 'black-raspberry' },
  { crop: 'grape', variety: 'keknyelu' },
]
const TOOLS: readonly ToolId[] = ['better-shovel', 'better-pickaxe', 'axe']

export function doorR(col: number, row: number): number {
  return Math.hypot(col + 0.5 - (DOOR.col + 0.5), row + 0.5 - (DOOR.row + 0.5))
}

export function lootRoll(u: number, r: number, day: number, luck: number): number {
  return (
    LOOT_ROLL_BASE +
    LOOT_ROLL_DIST * Math.min(1, r / LOOT_ROLL_DIST_R) +
    LOOT_ROLL_DAY * Math.min(1, (day - 1) / LOOT_ROLL_DAY_SPAN) +
    luck / LOOT_LUCK_DIV +
    u * LOOT_U_SPAN -
    LOOT_U_OFF
  )
}

function keptRows(roll: number): LootRowId[] {
  const rows: LootRowId[] = []
  rows.push('treasure')
  if (roll <= LOOT_GATE_BASE && TREE_BASE.length > 0) rows.push('tree-seed-base')
  if (roll >= LOOT_GATE_VARIANT && TREE_VARIANT.length > 0) rows.push('tree-seed-variant')
  if (roll >= LOOT_GATE_HEIRLOOM && TREE_HEIRLOOM.length > 0) rows.push('tree-seed-heirloom')
  if (roll <= LOOT_GATE_FERT) rows.push('fertilizer')
  if (roll <= LOOT_GATE_TOOL && TOOLS.length > 0) rows.push('tool')
  if (roll <= LOOT_GATE_BASE && SEED_BASE.length > 0) rows.push('seeds-base')
  if (roll >= LOOT_GATE_VARIANT && SEED_VARIANT.length > 0) rows.push('seeds-variant')
  if (roll >= LOOT_GATE_HEIRLOOM && SEED_HEIRLOOM.length > 0) rows.push('seeds-heirloom')
  return rows
}

function toolLoot(id: ToolId, used: boolean): LootItem {
  if (id === 'better-shovel') {
    const d = SHOVELS['better-shovel']
    return {
      kind: 'shovel',
      id: 'better-shovel',
      usesLeft: used ? Math.floor(d.uses / 2) : d.uses,
      workSeconds: d.workSeconds,
    }
  }
  if (id === 'better-pickaxe') {
    const d = PICKAXES['better-pickaxe']
    return {
      kind: 'pickaxe',
      id: 'better-pickaxe',
      usesLeft: used ? Math.floor(d.uses / 2) : d.uses,
      workSeconds: d.workSeconds,
    }
  }
  const d = AXES.axe
  return {
    kind: 'axe',
    usesLeft: used ? Math.floor(d.uses / 2) : d.uses,
    workSeconds: d.workSeconds,
  }
}

export function rollLoot(rng: Rng, col: number, row: number, day: number, luck: number): LootItem {
  const stream = rng.stream('burrow')
  const roll = lootRoll(stream.at(col, row, 0), doorR(col, row), day, luck)
  const rows = keptRows(roll)
  const id = rows[Math.floor(stream.at(col, row, 1) * rows.length)]
  if (id === 'treasure') {
    const u = stream.at(col, row, 3)
    return {
      kind: 'treasure',
      coins: Math.round((TREASURE_COINS_BASE + Math.floor(u * TREASURE_COINS_SPAN)) * roll),
    }
  }
  const pick = stream.at(col, row, 2)
  if (id === 'tree-seed-base') {
    const tree = TREE_BASE[Math.floor(pick * TREE_BASE.length)]
    return { kind: 'tree-seed', tree, variety: 'base', quality: 0 }
  }
  if (id === 'tree-seed-variant') {
    const hit = TREE_VARIANT[Math.floor(pick * TREE_VARIANT.length)]
    return { kind: 'tree-seed', tree: hit.tree, variety: hit.variety, quality: 0 }
  }
  if (id === 'tree-seed-heirloom') {
    const hit = TREE_HEIRLOOM[Math.floor(pick * TREE_HEIRLOOM.length)]
    return { kind: 'tree-seed', tree: hit.tree, variety: hit.variety, quality: 0 }
  }
  if (id === 'fertilizer') {
    return { kind: 'fertilizer', liters: FERT_BAG_LITERS, capacityLiters: FERT_BAG_LITERS }
  }
  if (id === 'tool') {
    const tool = TOOLS[Math.floor(pick * TOOLS.length)]
    return toolLoot(tool, stream.at(col, row, 3) < 0.5)
  }
  if (id === 'seeds-base') {
    const crop = SEED_BASE[Math.floor(pick * SEED_BASE.length)]
    return { kind: 'seeds', crop, variety: 'base', quality: 0, count: SEED_BASE_COUNT }
  }
  if (id === 'seeds-variant') {
    const hit = SEED_VARIANT[Math.floor(pick * SEED_VARIANT.length)]
    return { kind: 'seeds', crop: hit.crop, variety: hit.variety, quality: 0, count: SEED_VARIANT_COUNT }
  }
  const hit = SEED_HEIRLOOM[Math.floor(pick * SEED_HEIRLOOM.length)]
  return { kind: 'seeds', crop: hit.crop, variety: hit.variety, quality: 0, count: SEED_HEIRLOOM_COUNT }
}

function atCell(cells: Cell[][], at: Coord): Cell {
  const loc = local(at)
  return cells[loc.row][loc.col]
}

function put(cells: Cell[][], at: Coord, cell: Cell): void {
  const loc = local(at)
  cells[loc.row][loc.col] = cell
}

function pickSites(rng: Rng, cx: number, cy: number, day: number, n: number, list: Coord[]): Coord[] {
  const left = list.slice()
  const out: Coord[] = []
  const kMax = n < left.length ? n : left.length
  for (let k = 0; k < kMax; k++) {
    const ix = Math.floor(rng.stream('burrow').at(cx, cy, day, k) * left.length)
    out.push(left.splice(ix, 1)[0])
  }
  return out
}

function eligibleGrid(cells: Cell[][], id: ChunkId): Coord[] {
  const { col0, row0, col1, row1 } = chunkRect(id)
  const out: Coord[] = []
  for (let row = row0; row < row1; row++) {
    for (let col = col0; col < col1; col++) {
      const at = { col, row }
      if (isReserved(at)) continue
      if (doorR(col, row) <= BURROW_START_R) continue
      const c = atCell(cells, at)
      if (c.kind !== 'untilled') continue
      if (c.ground === 'very-hard') continue
      out.push(at)
    }
  }
  return out
}

function eligibleSeam(w: World, id: ChunkId): Coord[] {
  const { col0, row0, col1, row1 } = chunkRect(id)
  const out: Coord[] = []
  for (let row = row0; row < row1; row++) {
    for (let col = col0; col < col1; col++) {
      const at = { col, row }
      if (isReserved(at)) continue
      if (onCell(w.drops, at).length > 0) continue
      if (w.pavingAt(at) !== 'none') continue
      const c = w.cell(at)
      if (c.kind !== 'untilled') continue
      if (c.ground === 'very-hard') continue
      if (c.cover.kind !== 'bare' && c.cover.kind !== 'grass') continue
      out.push(at)
    }
  }
  return out
}

function mintGrid(cells: Cell[][], rng: Rng, at: Coord, day: number, luck: number): void {
  const c = atCell(cells, at)
  if (c.kind !== 'untilled') throw new Error('untilled')
  const loot = rollLoot(rng, at.col, at.row, day, luck)
  put(cells, at, {
    kind: 'untilled',
    ground: c.ground,
    hardness: c.hardness,
    cover: { kind: 'burrow', loot },
  })
}

export function mintStart(cells: Cell[][], rng: Rng): void {
  const id = { cx: 0, cy: 0 }
  pickSites(rng, 0, 0, 1, BURROW_START_N, eligibleGrid(cells, id)).forEach(at => mintGrid(cells, rng, at, 1, 0))
}

export function mintSeam(w: World): void {
  const luck = luckOf(w)
  const day = w.clock.day
  w.owned.forEach(id => {
    const list = eligibleSeam(w, id)
    pickSites(w.rng, id.cx, id.cy, day, 1, list).forEach(at => {
      const c = w.cell(at)
      if (c.kind !== 'untilled') throw new Error('untilled')
      const loot = rollLoot(w.rng, at.col, at.row, day, luck)
      w.setCell(at, {
        kind: 'untilled',
        ground: c.ground,
        hardness: c.hardness,
        cover: { kind: 'burrow', loot },
      })
    })
  })
}

export function extractBurrow(w: World, at: Coord): void {
  const c = w.cell(at)
  if (c.kind !== 'untilled' || c.cover.kind !== 'burrow') throw new Error('burrow')
  const s = w.act.hand
  if (s.kind !== 'hold' || s.item.kind !== 'shovel') throw new Error('shovel')
  const loot = c.cover.loot
  s.item.usesLeft -= 1
  if (s.item.usesLeft <= 0) w.act.hand = { kind: 'empty' }
  w.setCell(at, { kind: 'untilled', ground: c.ground, hardness: c.hardness, cover: { kind: 'bare' } })
  w.drops.push({ at: nearSite(w, at), item: loot })
}

