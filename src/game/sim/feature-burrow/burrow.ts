import {
  AGARIC_LOOT_COUNT,
  BURROW_DAY_CHANCE,
  BURROW_DIST_FULL,
  BURROW_ENTRIES,
  BURROW_RARE_BASE,
  BURROW_RARE_DAYS,
  BURROW_RARE_DAYS_FULL,
  BURROW_RARE_DIST,
  BURROW_RARE_MAX,
  BURROW_RARE_STEP,
  BURROW_SPECIAL_SHARE,
  BURROW_START_N,
  BURROW_START_R,
  BURROW_UNCOMMON_BASE,
  BURROW_UNCOMMON_DAYS,
  BURROW_UNCOMMON_DAYS_FULL,
  BURROW_UNCOMMON_DIST,
  SKILL_POINT_LOOT,
  TRUFFLE_LOOT_COUNT,
  WEED_LOOT_COUNT,
  type BurrowEntry,
  type BurrowRarity,
  type BurrowTool,
} from '../../defs/burrow.ts'
import { AXES, PICKAXES, SHOVELS } from '../../defs/items.ts'
import {
  chunkRect,
  DOOR,
  isReserved,
  local,
  type ChunkId,
  type Coord,
} from '../building.ts'
import { onCell } from '../drop.ts'
import type { Item } from '../item.ts'
import type { Cell } from '../plot.ts'
import type { Rng } from '../rng.ts'
import { nearSite } from '../store.ts'
import type { World } from '../world.ts'
import type { BurrowDig, BurrowFind, BurrowOdds } from './burrow.h.ts'

export const BURROW_DAY_SALT = 9
export const BURROW_DIG_SALT = 16

export function doorR(col: number, row: number): number {
  return Math.hypot(col + 0.5 - (DOOR.col + 0.5), row + 0.5 - (DOOR.row + 0.5))
}

export function burrowOdds(distance: number, day: number, sinceRare: number): BurrowOdds {
  const far = Math.min(1, distance / BURROW_DIST_FULL)
  const days = day - 1
  return {
    uncommon:
      BURROW_UNCOMMON_BASE +
      BURROW_UNCOMMON_DIST * far +
      BURROW_UNCOMMON_DAYS * Math.min(1, days / BURROW_UNCOMMON_DAYS_FULL),
    rare: Math.min(
      BURROW_RARE_MAX,
      BURROW_RARE_BASE +
        BURROW_RARE_STEP * sinceRare +
        BURROW_RARE_DIST * far +
        BURROW_RARE_DAYS * Math.min(1, days / BURROW_RARE_DAYS_FULL),
    ),
  }
}

export function rarityOf(u: number, odds: BurrowOdds): BurrowRarity {
  const pct = u * 100
  if (pct < odds.rare) return 'rare'
  if (pct < odds.rare + odds.uncommon) return 'uncommon'
  return 'common'
}

export function toolItem(tool: BurrowTool, left: (uses: number) => number): Item {
  switch (tool.kind) {
    case 'shovel': {
      const d = SHOVELS[tool.id]
      return { kind: 'shovel', id: tool.id, usesLeft: left(d.uses), workSeconds: d.workSeconds }
    }
    case 'pickaxe': {
      const d = PICKAXES[tool.id]
      return { kind: 'pickaxe', id: tool.id, usesLeft: left(d.uses), workSeconds: d.workSeconds }
    }
    case 'axe': {
      const d = AXES[tool.id]
      return { kind: 'axe', id: tool.id, usesLeft: left(d.uses), workSeconds: d.workSeconds }
    }
  }
}

function pickOf<T>(pool: readonly T[], u: number): T {
  return pool[Math.floor(u * pool.length)]
}

function findOf(entry: BurrowEntry, pick: number, u: number): BurrowFind {
  switch (entry.kind) {
    case 'treasure':
      return { kind: 'item', item: { kind: 'treasure', coins: entry.min + Math.floor(u * (entry.max - entry.min + 1)) } }
    case 'seeds': {
      const p = pickOf(entry.pool, pick)
      return { kind: 'item', item: { kind: 'seeds', crop: p.crop, variety: p.variety, quality: 0, count: entry.count } }
    }
    case 'tree-seed': {
      const p = pickOf(entry.pool, pick)
      return { kind: 'item', item: { kind: 'tree-seed', tree: p.tree, variety: p.variety, quality: 0 } }
    }
    case 'weed':
      return { kind: 'item', item: { kind: 'weed', count: WEED_LOOT_COUNT } }
    case 'fly-agaric':
      return { kind: 'item', item: { kind: 'fly-agaric', count: AGARIC_LOOT_COUNT } }
    case 'truffle':
      return { kind: 'item', item: { kind: 'truffle', count: TRUFFLE_LOOT_COUNT } }
    case 'skill-point':
      return { kind: 'skill-point' }
    case 'tool':
      return { kind: 'item', item: toolItem(pickOf(entry.pool, pick), uses => (u < 0.5 ? Math.floor(uses / 2) : uses)) }
    case 'special-tool':
      return { kind: 'item', item: toolItem(pickOf(entry.pool, pick), uses => Math.round(uses * BURROW_SPECIAL_SHARE)) }
    case 'permit':
      return { kind: 'permit' }
  }
}

export function digBurrow(rng: Rng, at: Coord, day: number, sinceRare: number): BurrowDig {
  const stream = rng.stream('burrow')
  const draw = (i: number) => stream.at(at.col, at.row, day, BURROW_DIG_SALT + i)
  const rarity = rarityOf(draw(0), burrowOdds(doorR(at.col, at.row), day, sinceRare))
  return { rarity, find: findOf(pickOf(BURROW_ENTRIES[rarity], draw(1)), draw(2), draw(3)) }
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

function burrowOn(c: Cell): Cell {
  if (c.kind !== 'untilled') throw new Error('untilled')
  return { kind: 'untilled', ground: c.ground, hardness: c.hardness, cover: { kind: 'burrow' } }
}

export function mintStart(cells: Cell[][], rng: Rng): void {
  const id = { cx: 0, cy: 0 }
  pickSites(rng, 0, 0, 1, BURROW_START_N, eligibleGrid(cells, id)).forEach(at => put(cells, at, burrowOn(atCell(cells, at))))
}

export function mintSeam(w: World): void {
  const day = w.clock.day
  w.owned.forEach(id => {
    if (w.rng.stream('burrow').at(id.cx, id.cy, day, BURROW_DAY_SALT) >= BURROW_DAY_CHANCE) return
    pickSites(w.rng, id.cx, id.cy, day, 1, eligibleSeam(w, id)).forEach(at => w.setCell(at, burrowOn(w.cell(at))))
  })
}

export function extractBurrow(w: World, at: Coord): void {
  const c = w.cell(at)
  if (c.kind !== 'untilled' || c.cover.kind !== 'burrow') throw new Error('burrow')
  const s = w.act.hand
  if (s.kind !== 'hold' || s.item.kind !== 'shovel') throw new Error('shovel')
  const { rarity, find } = digBurrow(w.rng, at, w.clock.day, w.sinceRare)
  w.sinceRare = rarity === 'rare' ? 0 : w.sinceRare + 1
  s.item.usesLeft -= 1
  if (s.item.usesLeft <= 0) w.act.hand = { kind: 'empty' }
  w.setCell(at, { kind: 'untilled', ground: c.ground, hardness: c.hardness, cover: { kind: 'bare' } })
  if (find.kind === 'permit') w.prizeSlots += 1
  else if (find.kind === 'skill-point') w.grantPoints(SKILL_POINT_LOOT)
  else w.drops.push({ at: nearSite(w, at), item: find.item })
}
