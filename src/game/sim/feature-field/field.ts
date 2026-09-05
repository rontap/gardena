import { GRASS_GROW, GRASS_WATER_PER_SEC } from '../../defs/items.ts'
import { jamRotMul } from '../../defs/skills.ts'
import { TREES, TREE_OFF_MUL, TREE_YIELD_DAYS, TREE_YIELD_MUL } from '../../defs/trees.ts'
import { needsNeighbour } from '../../defs/varieties.ts'
import { CHUNK, chunkRect, type Coord, type Tree } from '../building.ts'
import { DAY_SECONDS } from '../clock.ts'
import { onCell } from '../drop.ts'
import { statsOf } from '../modifiers.ts'
import { Weed } from '../plant.ts'
import { isPlot, isTilled } from '../plot.ts'
import {
  fertBand,
  GRASS_CHANCE,
  PLANT_FERT_PER_SEC,
  ramped,
  STUNT,
  waterBand,
  WEED_CHANCE,
  WEED_FERT_PER_SEC,
  WEED_GROW,
  WEED_WATER_PER_SEC,
} from '../soil.ts'
import { weedMul } from '../weather.ts'
import type { World } from '../world.ts'
import {
  age,
  doomed,
  grassCount,
  hasNeighbour,
  mood,
  treeCells,
} from './field.helpers.ts'

export {
  canChop,
  canFertilize,
  canGraft,
  canHarvest,
  canMine,
  canPlant,
  canShovel,
  canTend,
  canWater,
  doChop,
  doFertilize,
  doGraft,
  doHarvest,
  doMine,
  doPlant,
  doShovel,
  doTend,
  doWater,
  doWeedSpray,
  freshSoil,
  grassCount,
  hasNeighbour,
  mood,
  neighbourReach,
  neighbourWatch,
  pourTarget,
  treeCells,
  waterable,
} from './field.helpers.ts'

const TREE_DROP_ROWS = [-1, 0, 1, 2]
const TREE_DROP_COLS = [-1, 0, 1]

export function tickField(w: World, dt: number): void {
  let dirty = false
  for (const [k, at] of w.recover) {
    const c = w.cell(at)
    if (!isTilled(c) || c.soil.weedChance >= WEED_CHANCE) {
      w.recover.delete(k)
      continue
    }
    const next = c.soil.weedChance + (0.15 * dt) / DAY_SECONDS
    c.soil.weedChance = next > WEED_CHANCE ? WEED_CHANCE : next
    if (c.soil.weedChance >= WEED_CHANCE) w.recover.delete(k)
  }
  for (const at of w.grow.values()) {
    const c = w.cell(at)
    if (c.kind === 'tree') {
      if (tickTree(w, c, dt)) dirty = true
      continue
    }
    if (c.kind === 'turf') {
      const stage0 = c.turf.stage()
      c.soil.drink(GRASS_WATER_PER_SEC * dt)
      c.turf.maturity += dt / GRASS_GROW
      if (c.turf.maturity >= 1) {
        w.setCell(at, { kind: 'untilled', ground: 'soft', cover: { kind: 'grass', variant: c.turf.variant } })
        dirty = true
        continue
      }
      if (c.turf.stage() !== stage0) dirty = true
      continue
    }
    if (c.kind === 'weed') {
      const stage0 = c.weed.stage()
      c.soil.drink(WEED_WATER_PER_SEC * dt)
      c.soil.starve(WEED_FERT_PER_SEC * dt)
      const grown = c.weed.maturity + dt / WEED_GROW
      c.weed.maturity = grown > 1 ? 1 : grown
      if (c.weed.maturity === 1 && !c.weed.spread) {
        outbreak(w, at)
        c.weed.spread = true
      }
      if (c.weed.stage() !== stage0) dirty = true
      continue
    }
    if (c.kind !== 'growing' && c.kind !== 'ripe') continue
    const stage0 = c.plant.stage(c.kind)
    const st = w.statsCached(c.plant.crop, c.plant.variety)
    const mood0 = mood(c.soil, st)
    if (c.kind === 'growing') {
      c.soil.drink(st.waterUsePerSec * dt)
      c.soil.starve(PLANT_FERT_PER_SEC * dt)
      if (!c.soil.bio) c.plant.bio = false
      const water = waterBand(c.soil.water, st.waterTolerance)
      const fert = fertBand(c.soil.fertilizer, st.fertTolerance)
      const q = w.bakeQuality(c.plant)
      const harm = age(c.plant, c.soil, water, fert, dt)
      if (harm.kind === 'hurt' && c.plant.happiness <= 0) {
        w.setCell(at, doomed(harm.by, c.soil, c.plant))
        w.tally.died += 1
        dirty = true
        continue
      }
      const stunt = (water === 'red' ? STUNT : 1) * (fert === 'red' ? STUNT : 1)
      const lonely = needsNeighbour(c.plant.variety) && !hasNeighbour(w, [at], c.plant.crop)
      if (!lonely) c.plant.maturity += (dt * stunt) / st.growSeconds
      if (c.plant.maturity >= 1) {
        c.plant.maturity = 1
        c.plant.freshness = 1
        c.plant.quality = q
        w.setCell(at, { kind: 'ripe', soil: c.soil, plant: c.plant })
        dirty = true
        continue
      }
    }
    if (c.kind === 'ripe') {
      const bar0Fresh = c.plant.freshness < 0.8
      c.plant.freshness -= dt / (st.rotSeconds * jamRotMul(w.skillTier('jam'), c.plant.freshness))
      if (c.plant.freshness <= 0) {
        w.setCell(at, { kind: 'rotten', soil: c.soil, crop: c.plant.crop })
        dirty = true
        continue
      }
      if (c.plant.freshness < 0.8 !== bar0Fresh) dirty = true
    }
    const now = w.cell(at)
    if (now.kind !== 'growing' && now.kind !== 'ripe') continue
    if (now.plant.stage(now.kind) !== stage0 || mood(now.soil, st) !== mood0) dirty = true
  }
  if (dirty) w.pingFor('field')
}

export function tickTreesSeam(w: World): void {
  for (const at of w.grow.values()) {
    const c = w.cell(at)
    if (c.kind !== 'tree') continue
    if (c.juvenile < 1) continue
    if (needsNeighbour(c.variety) && !hasNeighbour(w, treeCells(c), c.species)) continue
    advanceYield(w, c)
  }
}

export function advanceYield(w: World, t: Tree): void {
  if (t.yield.kind === 'pending') {
    t.yield = { kind: 'on', daysLeft: TREE_YIELD_DAYS }
    return
  }
  if (t.yield.kind === 'on') {
    const left = (t.yield.daysLeft - 1) as 0 | 1
    if (left === 0) {
      t.tended = false
      t.yield = { kind: 'off', chance: -0.2 }
    } else {
      t.yield = { kind: 'on', daysLeft: left }
    }
    return
  }
  const chance = t.yield.chance + 0.2
  const u = w.rng.stream('tree').at(t.base.col, t.base.row, w.clock.day)
  t.yield = u < chance ? { kind: 'on', daysLeft: TREE_YIELD_DAYS } : { kind: 'off', chance }
}

export function tickTree(w: World, t: Tree, dt: number): boolean {
  if (t.juvenile < 1) {
    t.juvenile += dt / TREES[t.species].juvenileSeconds
    if (t.juvenile < 1) return false
    t.juvenile = 1
    if (t.trunk) {
      t.trunk = false
      t.juvenile = 0
      return true
    }
    t.yield = { kind: 'pending' }
    t.fruit = 0
    return true
  }
  if (t.yield.kind === 'pending') return false
  if (needsNeighbour(t.variety) && !hasNeighbour(w, treeCells(t), t.species)) return false
  const ripe = t.fruit >= 1
  const mul = t.yield.kind === 'on' ? TREE_YIELD_MUL : TREE_OFF_MUL
  t.fruit += dt / (TREES[t.species].fruitSeconds / mul)
  if (t.fruit < 1) return false
  if (!dropTreeFruit(w, t)) {
    t.fruit = 1
    return !ripe
  }
  t.fruit = 0
  w.tally.harvests += 1
  return true
}

export function dropTreeFruit(w: World, t: Tree): boolean {
  const open = TREE_DROP_ROWS.flatMap(dr =>
    TREE_DROP_COLS.map(dc => ({ col: t.base.col + dc, row: t.base.row + dr })),
  ).filter(p => {
    if (p.col === t.base.col && (p.row === t.base.row || p.row === t.base.row + 1)) return false
    if (!w.inWorld(p)) return false
    return isPlot(w.cell(p))
  })
  if (open.length === 0) return false
  const fruit = w.rng.stream('fruit')
  const hit = open[Math.floor(fruit.next() * open.length)]
  const sale = statsOf(t.species, t.variety, 0, w.modifiers).sale
  w.drops.push({
    at: { ...hit },
    item: {
      kind: 'fruit',
      crop: t.species,
      variety: t.variety,
      quality: 0,
      count: 1,
      unitSale: sale,
      freshness: 1,
      bio: true,
      cut: false,
    },
  })
  return true
}

export function sproutWeeds(w: World): boolean {
  const mul = weedMul(w.weather(w.clock.day))
  if (mul === 0) return false
  let grew = false
  for (const at of w.empty.values()) {
    const c = w.cell(at)
    if (c.kind !== 'empty') continue
    if (w.rng.stream('weed').at(at.col, at.row, w.bigTicks) >= ramped(c.soil.weedChance, w.bigTicks) * mul) continue
    const variant = w.rng.stream('weed').at(at.col, at.row, w.bigTicks, 1) < 0.5 ? 0 : 1
    w.setCell(at, { kind: 'weed', soil: c.soil, weed: new Weed(variant) })
    grew = true
  }
  return grew
}

export function outbreak(w: World, at: Coord): void {
  ;[
    { col: at.col - 1, row: at.row },
    { col: at.col + 1, row: at.row },
    { col: at.col, row: at.row - 1 },
    { col: at.col, row: at.row + 1 },
  ].forEach(n => {
    if (!w.inWorld(n)) return
    const c = w.cell(n)
    if (c.kind !== 'empty') return
    c.soil.weedChance += 0.05
    w.track(n, c)
  })
}

export function sproutGrass(w: World): boolean {
  const mul = weedMul(w.weather(w.clock.day))
  if (mul === 0) return false
  if (grassCount(w) >= CHUNK * w.owned.length) return false
  const grass = w.rng.stream('grass')
  const ownedCellCount = w.owned.length * CHUNK * CHUNK
  if (!(Math.min(1, ramped(GRASS_CHANCE, w.bigTicks) * ownedCellCount) * mul > grass.at(w.bigTicks))) return false
  const per = CHUNK * CHUNK
  for (let i = 0; i < 24; i++) {
    const u = grass.at(w.bigTicks, i, 0)
    let index = Math.floor(u * ownedCellCount)
    if (index >= ownedCellCount) index = ownedCellCount - 1
    const id = w.owned[Math.floor(index / per)]
    const localIx = index % per
    const { col0, row0 } = chunkRect(id)
    const col = col0 + (localIx % CHUNK)
    const row = row0 + Math.floor(localIx / CHUNK)
    const at = { col, row }
    const c = w.cell(at)
    if (c.kind !== 'untilled' || c.ground === 'very-hard' || c.cover.kind !== 'bare') continue
    if (onCell(w.drops, at).length > 0) continue
    const variant = Math.floor(grass.at(col, row, w.bigTicks) * 3) as 0 | 1 | 2
    w.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'grass', variant } })
    return true
  }
  return false
}
