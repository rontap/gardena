import {
  HAPPY_DROWN_SECONDS,
  HAPPY_GAIN_SECONDS,
  HAPPY_MAX,
  HAPPY_STARVE_SECONDS,
  HAPPY_WILT_SECONDS,
} from '../../defs/crops.ts'
import { CHOP_GRAFTS, NEIGHBOUR_REACH } from '../../defs/items.ts'
import { needsNeighbour, tierOf } from '../../defs/varieties.ts'
import { chunkRect, occupiedCells, Tree, type Coord } from '../building.ts'
import type { CropId } from '../ids.ts'
import { fruitStack, mergeInto, type Item } from '../item.ts'
import type { Modifier, Stats } from '../modifiers.ts'
import { goodness } from '../noise.ts'
import { Plant, Turf, type Doom } from '../plant.ts'
import { bare, isPlot, isTilled, type Cell, type Plot } from '../plot.ts'
import { FERT_PLOT_MAX, fertBand, SOIL_TILL_WATER, SOIL_WATER_MID, Soil, waterBand, WEED_CHANCE, type Band } from '../soil.ts'
import type { World } from '../world.ts'

type Harm = { kind: 'none' } | { kind: 'hurt'; by: Doom }

export function pourTarget(c: Extract<Plot, { soil: Soil }>, mods: readonly Modifier[]): number {
  if (c.kind !== 'growing' && c.kind !== 'ripe') return SOIL_WATER_MID
  return SOIL_WATER_MID + c.plant.stats(mods).waterTolerance
}

export function waterable(c: Cell, mods: readonly Modifier[]): boolean {
  if (c.kind !== 'empty' && c.kind !== 'weed' && c.kind !== 'growing' && c.kind !== 'ripe') return false
  return c.soil.water < pourTarget(c, mods)
}

export function mood(soil: Soil, st: Stats): string {
  return `${waterBand(soil.water, st.waterTolerance)}-${fertBand(soil.fertilizer, st.fertTolerance)}`
}

export function age(plant: Plant, soil: Soil, water: Band, fert: Band, dt: number): Harm {
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

export function doomed(by: Doom, soil: Soil, plant: Plant): Plot {
  if (by === 'drown') return { kind: 'rotten', soil, crop: plant.crop }
  return { kind: 'dead', soil, plant }
}

export function treeCells(t: Tree): Coord[] {
  return [
    { col: t.base.col, row: t.base.row },
    { col: t.base.col, row: t.base.row + 1 },
  ]
}

export function neighbourReach(cells: readonly Coord[]): Coord[] {
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

export function hasNeighbour(w: World, cells: readonly Coord[], crop: CropId): boolean {
  return neighbourReach(cells).some(p => goodNeighbour(w, p, crop, cells))
}

export function neighbourWatch(
  w: World,
  at: Coord,
): { crop: CropId; tree: boolean; reach: Coord[]; ok: boolean } | undefined {
  const c = w.cell(at)
  if (c.kind === 'growing' && needsNeighbour(c.plant.variety)) {
    return {
      crop: c.plant.crop,
      tree: false,
      reach: neighbourReach([at]),
      ok: hasNeighbour(w, [at], c.plant.crop),
    }
  }
  if (c.kind === 'tree' && needsNeighbour(c.variety) && c.juvenile >= 1 && !c.trunk) {
    const cells = treeCells(c)
    return { crop: c.species, tree: true, reach: neighbourReach(cells), ok: hasNeighbour(w, cells, c.species) }
  }
  return undefined
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

export function freshSoil(w: World, at: Coord): Soil {
  return new Soil(SOIL_TILL_WATER, goodness(w.rng, at.col, at.row), WEED_CHANCE)
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
  const spot = w.dropSpot(at)
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
  return it.crop === c.plant.crop && it.variety === c.plant.variety && it.count < w.stackMax(it)
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
