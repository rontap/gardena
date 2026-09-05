import type { World } from './world.ts'
import { sources } from './nets.ts'
import { dropSpot, pullMachineStores } from './craft.ts'
import { stackMax } from './store.ts'
import { TREES } from '../defs/trees.ts'
import { jamRotMul } from '../defs/skills.ts'
import { needsNeighbour, tierOf } from '../defs/varieties.ts'
import type { CropId } from './ids.ts'
import { CHUNK, Tree, chunkRect, inWorld, occupiedCells, type Coord } from './building.ts'
import { onCell } from './drop.ts'
import { fruitStack, mergeInto, type Item } from './item.ts'
import { mul, recover } from './market.ts'
import { statsOf, type Modifier, type Stats } from './modifiers.ts'
import { goodness } from './noise.ts'
import { Plant, Turf, Weed, type Doom } from './plant.ts'
import { bare, isPlot, isTilled, type Cell, type Plot } from './plot.ts'
import { STUNT, Soil, fertBand, ramped, waterBand, type Band } from './soil.ts'
import { soakDelta, weedMul } from './weather.ts'

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

export function grassCount(w: World): number {
  return w.owned.reduce((n, id) => {
    const { col0, row0, col1, row1 } = chunkRect(id)
    let hit = 0
    for (let row = row0; row < row1; row++) {
      for (let col = col0; col < col1; col++) {
        const c = w.cell({ col, row })
        if (c.kind === 'untilled' && c.cover.kind === 'grass') hit += 1
      }
    }
    return n + hit
  }, 0)
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

export function freshSoil(w: World, at: Coord): Soil {
  return new Soil(SOIL_TILL_WATER, goodness(w.rng, at.col, at.row), WEED_CHANCE)
}

export function tickTreesSeam(w: World): void {
  for (const at of w.grow.values()) {
    const c = w.cell(at)
    if (c.kind !== 'tree') continue
    if (c.juvenile < 1) continue
    if (needsNeighbour(c.variety) && !hasNeighbour(w, treeCells(w, c), c.species)) continue
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
  if (needsNeighbour(t.variety) && !hasNeighbour(w, treeCells(w, t), t.species)) return false
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

export function seedPair(w: World, at: Coord): Coord | undefined {
  const above = { col: at.col, row: at.row - 1 }
  if (!w.inWorld(above)) return undefined
  const a = w.cell(at)
  const b = w.cell(above)
  if (a.kind !== 'untilled' || b.kind !== 'untilled') return undefined
  if (a.ground !== 'soft' || b.ground !== 'soft') return undefined
  if (a.cover.kind === 'tile' || b.cover.kind === 'tile') return undefined
  return above
}

export function canShovel(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'shovel') return false
  const c = w.cell(at)
  if (c.kind === 'tree') return true
  if (!isPlot(c)) return false
  if (c.kind === 'infertile') return false
  if (c.kind === 'untilled' && c.ground === 'very-hard') return false
  if (c.kind === 'untilled' && c.ground === 'hard') return w.act.hand.item.usesLeft >= 2
  return true
}

export function doShovel(w: World, at: Coord): boolean {
  if (!canShovel(w, at)) return false
  const c = w.cell(at)
  const s = w.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'shovel' }> }
  if (c.kind === 'tree') {
    occupiedCells(c.base, w.owned).forEach(p => w.setCell(p, bare('soft')))
    w.drops.push({ at: { ...at }, item: { kind: 'tree-seed', tree: c.species, variety: c.variety, quality: 0 } })
    s.item.usesLeft -= 1
    if (s.item.usesLeft <= 0) w.act.hand = { kind: 'empty' }

    return true
  }
  if (c.kind === 'growing' || c.kind === 'ripe') {
    w.drops.push({
      at: { ...at },
      item: { kind: 'seeds', crop: c.plant.crop, variety: c.plant.variety, quality: c.plant.quality, count: 1 },
    })
  }
  if (c.kind === 'weed') c.soil.weedChance = -0.3
  w.setCell(at, { kind: 'empty', soil: isTilled(c) ? c.soil : freshSoil(w, at) })
  const cost = c.kind === 'untilled' && c.ground === 'hard' ? 2 : 1
  s.item.usesLeft -= cost
  if (s.item.usesLeft <= 0) w.act.hand = { kind: 'empty' }

  return true
}

export function canMine(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'pickaxe') return false
  const c = w.cell(at)
  if (c.kind === 'untilled' && c.ground === 'very-hard') return true
  if (c.kind !== 'rock') return false
  const n = occupiedCells(c.base, w.owned).length
  return n < 2 || w.act.hand.item.usesLeft >= 2
}

export function doMine(w: World, at: Coord): void {
  if (!canMine(w, at)) return
  const c = w.cell(at)
  const s = w.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'pickaxe' }> }
  if (c.kind === 'untilled' && c.ground === 'very-hard') {
    w.setCell(at, { kind: 'infertile' })
    s.item.usesLeft -= 1
    if (s.item.usesLeft <= 0) w.act.hand = { kind: 'empty' }
      return
  }
  if (c.kind !== 'rock') return
  const n = occupiedCells(c.base, w.owned).length
  occupiedCells(c.base, w.owned).forEach(p => {
    w.setCell(p, bare('soft'))
  })
  s.item.usesLeft -= n === 1 ? 1 : 2
  if (s.item.usesLeft <= 0) w.act.hand = { kind: 'empty' }
}

export function canPlant(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  if (w.act.hand.item.kind === 'tree-seed') return seedPair(w, at) !== undefined
  if (w.act.hand.item.kind !== 'seeds' && w.act.hand.item.kind !== 'grass-seeds') return false
  return w.cell(at).kind === 'empty'
}

export function doPlant(w: World, at: Coord): void {
  if (!canPlant(w, at)) return
  if (w.act.hand.kind !== 'hold') return
  if (w.act.hand.item.kind === 'tree-seed') {
    const above = seedPair(w, at)
    if (above === undefined) return
    const tree = new Tree(w.act.hand.item.tree, { shape: 'rect', col: above.col, row: above.row, w: 1, h: 2 })
    tree.variety = w.act.hand.item.variety
    w.setCell(above, tree)
    w.setCell(at, tree)
    w.act.hand = { kind: 'empty' }

    return
  }
  const bed = w.cell(at) as Extract<Plot, { kind: 'empty' }>
  if (w.act.hand.item.kind === 'grass-seeds') {
    const g = w.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'grass-seeds' }> }
    const variant = Math.floor(w.rng.stream('gen').at(3, at.col, at.row) * 3) as 0 | 1 | 2
    w.setCell(at, { kind: 'turf', soil: bed.soil, turf: new Turf(variant) })
    g.item.count -= 1
    if (g.item.count <= 0) w.act.hand = { kind: 'empty' }

    w.compactInventory()
    w.ping()
    return
  }
  const s = w.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'seeds' }> }
  w.setCell(at, {
    kind: 'growing',
    soil: bed.soil,
    plant: new Plant(s.item.crop, s.item.variety, s.item.quality),
  })
  s.item.count -= 1
  if (s.item.count <= 0) w.act.hand = { kind: 'empty' }

}

export function canWater(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'container') return false
  if (w.act.hand.item.liters <= 0) return false
  return waterable(w.cell(at), w.modifiers)
}

export function doWater(w: World, at: Coord): boolean {
  if (!canWater(w, at)) return false
  const c = w.cell(at) as Extract<Plot, { soil: Soil }>
  const bucket = w.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'container' }> }
  const need = pourTarget(c, w.modifiers) - c.soil.water
  const use = need > bucket.item.liters ? bucket.item.liters : need
  c.soil.soak(use)
  bucket.item.liters -= use

  return c.kind === 'growing' || c.kind === 'ripe'
}

export function canFertilize(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const it = w.act.hand.item
  if (it.kind !== 'fertilizer' && it.kind !== 'synth' && it.kind !== 'compost') return false
  if (it.liters <= 0) return false
  const c = w.cell(at)
  return isTilled(c) && c.soil.fertilizer < FERT_PLOT_MAX
}

export function doFertilize(w: World, at: Coord): void {
  if (!canFertilize(w, at)) return
  const c = w.cell(at) as Extract<Plot, { soil: Soil }>
  const bag = w.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'fertilizer' | 'synth' | 'compost' }> }
  const need = FERT_PLOT_MAX - c.soil.fertilizer
  const use = need > bag.item.liters ? bag.item.liters : need
  if (bag.item.kind === 'synth') c.soil.spike(use)
  else c.soil.feed(use)
  bag.item.liters -= use
  if (bag.item.liters <= 0) w.act.hand = { kind: 'empty' }

}

export function canCompost(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const c = w.cell(at)
  return c.kind === 'compost-box' && c.accept(w.act.hand.item) > 0
}

export function doCompost(w: World, at: Coord): void {
  if (!canCompost(w, at) || w.act.hand.kind !== 'hold') return
  const c = w.cell(at)
  if (c.kind !== 'compost-box') return
  const n = c.accept(w.act.hand.item)
  c.apply(w.act.hand.item, n)
  w.act.hand = { kind: 'empty' }
  w.track(at, c)
}

export function canTend(w: World, at: Coord): boolean {
  if (!w.hasSkill('tending')) return false
  if (w.act.hand.kind !== 'empty') return false
  const c = w.cell(at)
  if (c.kind === 'growing') return !c.plant.tended
  if (c.kind === 'tree') return c.juvenile >= 1 && c.yield.kind === 'off' && !c.tended && !c.trunk
  return false
}

export function doTend(w: World, at: Coord): void {
  if (!canTend(w, at)) return
  const c = w.cell(at)
  if (c.kind === 'growing') {
    c.plant.happiness += 0.1
    if (c.plant.happiness > HAPPY_MAX) c.plant.happiness = HAPPY_MAX
    c.plant.tended = true
    return
  }
  if (c.kind === 'tree' && c.yield.kind === 'off') {
    c.yield.chance += 0.15
    c.tended = true
  }
}

export function canChop(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'axe') return false
  const c = w.cell(at)
  return c.kind === 'tree' && c.juvenile >= 1 && !c.trunk
}

export function doChop(w: World, at: Coord): void {
  if (!canChop(w, at)) return
  const c = w.cell(at)
  if (c.kind !== 'tree') return
  const s = w.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'axe' }> }
  s.item.usesLeft -= 1
  if (s.item.usesLeft <= 0) w.act.hand = { kind: 'empty' }
  const spot = dropSpot(w, at)
  if (spot !== undefined) {
    w.drops.push({ at: { ...spot }, item: { kind: 'wood', count: 1 } })
    w.drops.push({
      at: { ...spot },
      item: { kind: 'graft', crop: c.species, variety: c.variety, quality: 0, count: CHOP_GRAFTS },
    })
  }
  c.trunk = true
  c.juvenile = 0
  c.fruit = 0
  c.yield = { kind: 'pending' }
  c.tended = false
}

export function treeCells(w: World, t: Tree): Coord[] {
  return [
    { col: t.base.col, row: t.base.row },
    { col: t.base.col, row: t.base.row + 1 },
  ]
}

export function goodNeighbour(w: World, at: Coord, crop: CropId, self: readonly Coord[]): boolean {
  if (self.some(s => s.col === at.col && s.row === at.row)) return false
  if (!w.inWorld(at)) return false
  const c = w.cell(at)
  if (c.kind === 'growing') {
    if (c.plant.crop !== crop || tierOf(c.plant.variety) === 'heirloom') return false
    const st = w.statsCached(c.plant.crop, c.plant.variety)
    return (
      waterBand(c.soil.water, st.waterTolerance) !== 'red' && fertBand(c.soil.fertilizer, st.fertTolerance) !== 'red'
    )
  }
  if (c.kind === 'tree') return c.species === crop && tierOf(c.variety) !== 'heirloom' && c.juvenile >= 1 && !c.trunk
  return false
}

export function neighbourReach(w: World, cells: readonly Coord[]): Coord[] {
  const span = Array.from({ length: NEIGHBOUR_REACH * 2 + 1 }, (_, i) => i - NEIGHBOUR_REACH)
  const seen = new Set<string>()
  return cells
    .flatMap(o => span.flatMap(dc => span.map(dr => ({ col: o.col + dc, row: o.row + dr }))))
    .filter(p => {
      const k = `${p.col},${p.row}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
}

export function hasNeighbour(w: World, cells: readonly Coord[], crop: CropId): boolean {
  return neighbourReach(w, cells).some(p => goodNeighbour(w, p, crop, cells))
}

export function neighbourWatch(w: World, at: Coord): { crop: CropId; tree: boolean; reach: Coord[]; ok: boolean } | undefined {
  const c = w.cell(at)
  if (c.kind === 'growing' && needsNeighbour(c.plant.variety)) {
    return {
      crop: c.plant.crop,
      tree: false,
      reach: neighbourReach(w, [at]),
      ok: hasNeighbour(w, [at], c.plant.crop),
    }
  }
  if (c.kind === 'tree' && needsNeighbour(c.variety) && c.juvenile >= 1 && !c.trunk) {
    const cells = treeCells(w, c)
    return { crop: c.species, tree: true, reach: neighbourReach(w, cells), ok: hasNeighbour(w, cells, c.species) }
  }
  return undefined
}

export function canGraft(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'graft') return false
  const g = w.act.hand.item
  const c = w.cell(at)
  if (c.kind === 'growing') return c.plant.crop === g.crop && tierOf(c.plant.variety) !== 'heirloom'
  if (c.kind === 'tree') return c.species === g.crop && c.juvenile < 1 && tierOf(c.variety) !== 'heirloom'
  return false
}

export function doGraft(w: World, at: Coord): void {
  if (!canGraft(w, at)) return
  const s = w.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'graft' }> }
  const c = w.cell(at)
  if (c.kind === 'growing') {
    c.plant.variety = s.item.variety
    c.plant.quality = s.item.quality
  }
  if (c.kind === 'tree') c.variety = s.item.variety
  s.item.count -= 1
  if (s.item.count <= 0) w.act.hand = { kind: 'empty' }
}

export function canHarvest(w: World, at: Coord): boolean {
  const c = w.cell(at)
  if (c.kind !== 'ripe') return false
  if (w.act.hand.kind === 'empty') return true
  const it = w.act.hand.item
  if (it.kind !== 'fruit') return false
  return it.crop === c.plant.crop && it.variety === c.plant.variety && it.count < stackMax(w, it)
}

export function doHarvest(w: World, at: Coord): void {
  if (!canHarvest(w, at)) return
  const c = w.cell(at)
  const bed = c as Extract<Plot, { kind: 'ripe' }>
  const p = bed.plant
  const picked = fruitStack(p.crop, p.variety, p.quality, 1, p.stats(w.modifiers).sale, p.freshness, p.bio, false)
  w.setCell(at, { kind: 'empty', soil: bed.soil })
  w.tally.harvests += 1

  if (w.act.hand.kind === 'empty') {
    w.act.hand = { kind: 'hold', item: { kind: 'fruit', ...picked } }
    return
  }
  if (w.act.hand.item.kind === 'fruit') mergeInto(w.act.hand.item, { kind: 'fruit', ...picked }, 1)
}

export function doWeedSpray(w: World, at: Coord): void {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'weed-spray') return
  if (w.act.hand.item.liters < 1) return
  if (!w.inWorld(at)) return
  const c = w.cell(at)
  if (!isTilled(c)) return
  c.soil.weedChance = -1
  if (c.kind === 'weed') w.setCell(at, { kind: 'empty', soil: c.soil })
  else w.track(at, c)
  w.act.hand.item.liters -= 1
  if (w.act.hand.item.liters < 1) w.act.hand = { kind: 'empty' }
}

export function tickBig(w: World, dt: number): void {
  w.bigAcc += dt
  if (w.bigAcc < BIG_TICK) return
  w.bigAcc -= BIG_TICK
  w.bigTicks += 1
  pullMachineStores(w)
  const d = soakDelta(w.weather(w.clock.day))
  if (d !== 0) {
    for (const at of w.tilled.values()) {
      const c = w.cell(at)
      if (!isTilled(c)) continue
      if (d > 0) c.soil.soak(d)
      else c.soil.drink(-d)
    }
  }
  const weeds = sproutWeeds(w)
  const grass = sproutGrass(w)
  if (weeds || grass || d !== 0) w.pingFor('big')
}

export function fillable(w: World, at: Coord): boolean {
  const c = w.cell(at)
  if (c.kind === 'pump' || c.kind === 'rain-tank' || c.kind === 'well') return true
  if (c.kind !== 'tap') return false
  const net = w.netOfCell(c.base)
  return net !== undefined && net.sources.length > 0
}

export function pourTarget(c: Extract<Plot, { soil: Soil }>, mods: readonly Modifier[]): number {
  if (c.kind !== 'growing' && c.kind !== 'ripe') return SOIL_WATER_MID
  return SOIL_WATER_MID + c.plant.stats(mods).waterTolerance
}

export function waterable(c: Cell, mods: readonly Modifier[]): boolean {
  if (c.kind !== 'empty' && c.kind !== 'weed' && c.kind !== 'growing' && c.kind !== 'ripe') return false
  return c.soil.water < pourTarget(c, mods)
}

type Harm = { kind: 'none' } | { kind: 'hurt'; by: Doom }

function age(plant: Plant, soil: Soil, water: Band, fert: Band, dt: number): Harm {
  let harm: Harm = { kind: 'none' }
  if (fert === 'red') {
    plant.happiness -= dt / HAPPY_STARVE_SECONDS
    harm = { kind: 'hurt', by: 'starve' }
  }
  if (water === 'red') {
    const by: Doom = soil.drowning ? 'drown' : 'wilt'
    plant.happiness -= dt / (by === 'drown' ? HAPPY_DROWN_SECONDS : HAPPY_WILT_SECONDS)
    harm = { kind: 'hurt', by }
  }
  if (harm.kind === 'none') {
    if (fert === 'green') plant.happiness += dt / HAPPY_GAIN_SECONDS
    if (water === 'green') plant.happiness += dt / HAPPY_GAIN_SECONDS
  }
  plant.happiness = plant.happiness < 0 ? 0 : plant.happiness > HAPPY_MAX ? HAPPY_MAX : plant.happiness
  return harm
}

function doomed(by: Doom, soil: Soil, plant: Plant): Plot {
  if (by === 'drown') return { kind: 'rotten', soil, crop: plant.crop }
  return { kind: 'dead', soil, plant }
}

export function mood(soil: Soil, st: Stats): string {
  return `${waterBand(soil.water, st.waterTolerance)}-${fertBand(soil.fertilizer, st.fertTolerance)}`
}

function shovelTime(w: World, at: Coord): number {
  const s = (w.act.hand as { item: Extract<Item, { kind: 'shovel' }> }).item
  const c = w.cell(at)
  if (c.kind === 'untilled' && c.ground === 'hard') return s.workSeconds * 2
  return s.workSeconds
}

function mineTime(w: World, at: Coord): number {
  const p = (w.act.hand as { item: Extract<Item, { kind: 'pickaxe' }> }).item
  const c = w.cell(at)
  if (c.kind !== 'rock') return p.workSeconds
  const n = occupiedCells(c.base, w.owned).length
  return n === 1 ? p.workSeconds : p.workSeconds * 2
}
