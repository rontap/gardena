import type { World } from './world.ts'
import { dirtyNets, pruneVert } from './nets.ts'
import { dropWires } from './signal.ts'
import { canFitGrass, expandLeft, putAdditive, putGrass, putSilo, putSugar } from './store.ts'
import { freshSoil } from './field.ts'
import { type BuyFail, type ExpandFace } from './world.h.ts'
import type { SkuId } from './ids.ts'
import { CHUNK, Chest, CompostBox, Freezer, Grinder, Hangar, SiloProduce, SiloSeed, SiloSpray, JamMachine, Mill, Furnace, PotStill, Pump, RainTank, ResearchStation, Tap, Well, Barrel, chunkKey, chunkRect, inFade, inWorld, occupiedCells, type ChunkId, type Coord } from './building.ts'
import { generateChunk } from './gen.ts'
import { skuItem } from './item.ts'
import { isFenceSite, isPlot, isTileSite } from './plot.ts'
import { aoe, edgeKey, vertexKey, vertsOf, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import { hangarSiteOk, maybeSay, placeSolidOk, siloSiteOk, tallSiteOk, wideSiteOk, readPrompt, valvePrompt } from './prompt.ts'
import { driverVehicle, stripPadStops, stripStops } from './vehicle.ts'
import { hitsCell, hitsEdge, hitsVertex, isSensor, makeSensor, skuKind } from './sensor.ts'

export function buyBody(w: World, id: SkuId): BuyFail | undefined {
  if (!w.skuOpen(id)) return undefined
  const made = skuItem(id)
  if (made.kind === 'grass-seeds') {
    const price = w.skuPrice(id)
    if (w.money < price) return 'Cannot afford'
    if (!canFitGrass(w)) return 'Inventory full'
    w.money -= price
    putGrass(w, made.count)
    w.compactInventory()
    w.ping()
    return undefined
  }
  if (made.kind === 'sugar') {
    const price = w.skuPrice(id)
    if (w.money < price) return 'Cannot afford'
    if (w.additives.free < made.liters) return 'Additive store full'
    w.money -= price
    putSugar(w, made.liters, made.unitSale, made.quality)
    w.ping()
    return undefined
  }
  if (made.kind === 'seeds') {
    const price = w.skuPrice(id)
    if (w.money < price) return 'Cannot afford'
    if (w.silo.free < made.count) return 'Seed silo full'
    w.money -= price
    putSilo(w, made.crop, 'base', 0, made.count)
    w.ping()
    return undefined
  }
  if (made.kind === 'fertilizer' || made.kind === 'synth' || made.kind === 'weed-spray') {
    const price = w.skuPrice(id)
    if (w.money < price) return 'Cannot afford'
    if (w.additives.free < made.liters) return 'Additive store full'
    w.money -= price
    putAdditive(w, made.kind, made.liters)
    w.ping()
    return undefined
  }
  if (id === 'buy-sprinkler-vert') w.act.place = { kind: 'sku', id: 'buy-sprinkler-vert', facing: 'ns' }
  else w.act.place = { kind: 'sku', id }
  w.ping()
  return undefined
}

export function buyPacksBody(w: World, id: SkuId): void {
  if (buyPacksFail(w, id) !== undefined) return
  const made = skuItem(id)
  if (made.kind !== 'seeds') return
  w.money -= packsPrice(w, id)
  putSilo(w, made.crop, 'base', 0, 5 * made.count)
  w.ping()
}

export function confirmPlace(w: World, at: Coord): void {
  if (w.act.place.kind === 'delete') {
    deleteBuildingBody(w, at)
    return
  }
  if (w.act.place.kind !== 'sku') return
  if (
    w.act.place.id === 'buy-pipe' ||
    w.act.place.id === 'buy-valve' ||
    w.act.place.id === 'buy-sprinkler' ||
    w.act.place.id === 'buy-sprinkler-vert' ||
    w.act.place.id === 'buy-sprinkler-large'
  ) {
    return
  }
  const price = w.skuPrice(w.act.place.id)
  if (w.money < price) return
  if (
    w.act.place.id === 'buy-tile-paved' ||
    w.act.place.id === 'buy-tile-brick' ||
    w.act.place.id === 'buy-tile-cobble'
  ) {
    if (w.act.id !== 0) return
    if (!inWorld(at, w.owned)) return
    const c = w.cell(at)
    if (!isTileSite(c)) return
    const tile = w.act.place.id === 'buy-tile-paved' ? 'paved' : w.act.place.id === 'buy-tile-brick' ? 'brick' : 'cobble'
    w.money -= price
    w.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'tile', tile } })
      w.ping()
    return
  }
  if (w.act.place.id === 'buy-fence') {
    if (w.act.id !== 0) return
    if (!inWorld(at, w.owned)) return
    if (!isFenceSite(w.cell(at))) return
    if (w.hasFence(at)) return
    w.money -= price
    w.fences.add(`${at.col},${at.row}`)
      w.ping()
    return
  }
  if (w.act.place.id === 'buy-furnace') {
    if (!tallSiteOk(w, at)) return
    w.money -= price
    const furnace = new Furnace({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 2 })
    w.setCell(at, furnace)
    w.setCell({ col: at.col, row: at.row + 1 }, furnace)
    w.act.place = { kind: 'none' }
    w.ping()
    return
  }
  if (
    w.act.place.id === 'buy-pumpjack' ||
    w.act.place.id === 'buy-rain-tank' ||
    w.act.place.id === 'buy-still' ||
    w.act.place.id === 'buy-research-station'
  ) {
    if (!wideSiteOk(w, at)) return
    w.money -= price
    const base = { shape: 'rect' as const, col: at.col, row: at.row, w: 2, h: 1 }
    if (w.act.place.id === 'buy-research-station') {
      const station = new ResearchStation(base)
      w.setCell(at, station)
      w.setCell({ col: at.col + 1, row: at.row }, station)
    } else if (w.act.place.id === 'buy-still') {
      const still = new PotStill(base)
      w.stills.push(still)
      w.setCell(at, still)
      w.setCell({ col: at.col + 1, row: at.row }, still)
      dirtyNets(w)
    } else {
      const made = w.act.place.id === 'buy-pumpjack' ? new Pump(base, 'jack') : new RainTank(base)
      if (made.kind === 'pump') w.pumps.push(made)
      else w.tanks.push(made)
      w.setCell(at, made)
      w.setCell({ col: at.col + 1, row: at.row }, made)
      dirtyNets(w)
    }
      w.act.place = { kind: 'none' }
    w.ping()
    return
  }
  if (
    w.act.place.id === 'buy-chest' ||
    w.act.place.id === 'buy-grinder' ||
    w.act.place.id === 'buy-compost-box' ||
    w.act.place.id === 'buy-tap' ||
    w.act.place.id === 'buy-well' ||
    w.act.place.id === 'buy-mill' ||
    w.act.place.id === 'buy-jam' ||
    w.act.place.id === 'buy-barrel' ||
    w.act.place.id === 'buy-freezer' ||
    w.act.place.id === 'buy-freezer-large' ||
    w.act.place.id === 'buy-hangar' ||
    w.act.place.id === 'buy-silo-seed' ||
    w.act.place.id === 'buy-silo-spray' ||
    w.act.place.id === 'buy-silo-produce' ||
    (SENSOR_CELL_SKUS as readonly string[]).includes(w.act.place.id)
  ) {
    if (w.act.place.id === 'buy-hangar') {
      if (!hangarSiteOk(w, at)) return
      w.money -= price
      const base = { shape: 'rect' as const, col: at.col, row: at.row, w: HANGAR_W, h: HANGAR_H }
      const made = new Hangar(base)
      w.hangars.push(made)
      for (let row = 0; row < HANGAR_H; row++) {
        for (let col = 0; col < HANGAR_W; col++) {
          w.setCell({ col: at.col + col, row: at.row + row }, made)
        }
      }

      w.act.place = { kind: 'none' }
      w.ping()
      return
    }
    if (
      w.act.place.id === 'buy-silo-seed' ||
      w.act.place.id === 'buy-silo-spray' ||
      w.act.place.id === 'buy-silo-produce'
    ) {
      if (!siloSiteOk(w, at)) return
      w.money -= price
      const base = { shape: 'rect' as const, col: at.col, row: at.row, w: SILO_W, h: SILO_H }
      const sku = w.act.place.id
      const made =
        sku === 'buy-silo-seed' ? new SiloSeed(base) : sku === 'buy-silo-spray' ? new SiloSpray(base) : new SiloProduce(base)
      if (made.kind === 'silo-seed') w.seedSilos.push(made)
      else if (made.kind === 'silo-spray') w.spraySilos.push(made)
      else w.produceSilos.push(made)
      for (let row = 0; row < SILO_H; row++) {
        for (let col = 0; col < SILO_W; col++) {
          w.setCell({ col: at.col + col, row: at.row + row }, made)
        }
      }

      w.act.place = { kind: 'none' }
      w.ping()
      return
    }
    const kind = skuKind(w.act.place.id)
    if (kind !== undefined) {
      if (!placeSolidOk(w, at)) return
      w.money -= price
      const base = { shape: 'rect' as const, col: at.col, row: at.row, w: 1, h: 1 }
      const made = makeSensor(kind, base)
      w.setCell(at, made)
      if (made.kind === 'water-system') {
        w.waterSystems.push(made)
        dirtyNets(w)
      }
          w.ping()
      return
    }
    if (!placeSolidOk(w, at)) return
    w.money -= price
    const base = { shape: 'rect' as const, col: at.col, row: at.row, w: 1, h: 1 }
    if (w.act.place.id === 'buy-chest') w.setCell(at, new Chest(base))
    else if (w.act.place.id === 'buy-grinder') w.setCell(at, new Grinder(base))
    else if (w.act.place.id === 'buy-compost-box') w.setCell(at, new CompostBox(base))
    else if (w.act.place.id === 'buy-mill') w.setCell(at, new Mill(base))
    else if (w.act.place.id === 'buy-jam') w.setCell(at, new JamMachine(base))
    else if (w.act.place.id === 'buy-barrel') w.setCell(at, new Barrel(base))
    else if (w.act.place.id === 'buy-freezer') w.setCell(at, new Freezer(base))
    else if (w.act.place.id === 'buy-freezer-large') {
      w.prizeFreezers -= 1
      w.setCell(at, new Freezer(base, FREEZER_LARGE_SLOTS))
    }
    else if (w.act.place.id === 'buy-well') {
      const well = new Well(base)
      w.wells.push(well)
      w.setCell(at, well)
      dirtyNets(w)
    }
    else {
      const tap = new Tap(base)
      w.taps.push(tap)
      w.setCell(at, tap)
      dirtyNets(w)
    }
      w.act.place = { kind: 'none' }
    w.ping()
    return
  }
  if (!inWorld(at, w.owned) || !isPlot(w.cell(at))) return
  const made = skuItem(w.act.place.id)
  if (
    made.kind === 'pumpjack' ||
    made.kind === 'seeds' ||
    made.kind === 'chest' ||
    made.kind === 'grinder' ||
    made.kind === 'compost-box' ||
    made.kind === 'well' ||
    made.kind === 'valve' ||
    made.kind === 'rain-tank' ||
    made.kind === 'tap' ||
    made.kind === 'pipe' ||
    made.kind === 'sprinkler' ||
    made.kind === 'sprinkler-vert' ||
    made.kind === 'sprinkler-large' ||
    made.kind === 'delete' ||
    made.kind === 'tile' ||
    made.kind === 'fence' ||
    made.kind === 'grass-seeds' ||
    made.kind === 'mill' ||
    made.kind === 'jam-machine' ||
    made.kind === 'still' ||
    made.kind === 'furnace' ||
    made.kind === 'station' ||
    made.kind === 'barrel' ||
    made.kind === 'freezer' ||
    made.kind === 'hangar' ||
    made.kind === 'silo-seed' ||
    made.kind === 'silo-spray' ||
    made.kind === 'silo-produce' ||
    made.kind === 'sugar' ||
    made.kind === 'lever' ||
    made.kind === 'button' ||
    made.kind === 'lamp' ||
    made.kind === 'or' ||
    made.kind === 'and' ||
    made.kind === 'not' ||
    made.kind === 'pulser' ||
    made.kind === 'counter' ||
    made.kind === 'sensor-water' ||
    made.kind === 'sensor-fert' ||
    made.kind === 'sensor-harvest' ||
    made.kind === 'sensor-day' ||
    made.kind === 'water-system' ||
    made.kind === 'vehicle-detector' ||
    made.kind === 'traffic-light' ||
    made.kind === 'water'
  ) {
    return
  }
  w.money -= price
  w.drops.push({ at: { ...at }, item: made })
  w.act.place = { kind: 'none' }
  w.ping()
}

export function deleteBuildingBody(w: World, at: Coord): void {
  if (w.act.place.kind !== 'delete') return
  if (!inWorld(at, w.owned)) return
  const c = w.cell(at)
  if (w.hasFence(at)) {
    if (w.act.id !== 0) return
    w.fences.delete(`${at.col},${at.row}`)
    w.ping()
    return
  }
  if (c.kind === 'untilled' && c.cover.kind === 'tile') {
    if (w.act.id !== 0) return
    w.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'bare' } })
    w.ping()
    return
  }
  if (c.kind === 'pump') {
    if (c.form === 'starter') return
    occupiedCells(c.base, w.owned).forEach(p => {
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })
    w.pumps.splice(w.pumps.indexOf(c), 1)
    dirtyNets(w)

    w.ping()
    return
  }
  if (c.kind === 'rain-tank') {
    occupiedCells(c.base, w.owned).forEach(p => {
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })
    w.tanks.splice(w.tanks.indexOf(c), 1)
    dirtyNets(w)

    w.ping()
    return
  }
  if (c.kind === 'tap') {
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
    w.taps.splice(w.taps.indexOf(c), 1)
    dirtyNets(w)

    w.ping()
    return
  }
  if (c.kind === 'well') {
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
    w.wells.splice(w.wells.indexOf(c), 1)
    dirtyNets(w)

    w.ping()
    return
  }
  if (c.kind === 'chest') {
    stripPadStops(w, c)
    dropWires(w, w => hitsCell(w.from, at) || hitsCell(w.to, at))
    c.slots.forEach(s => {
      if (s.kind === 'hold') w.drops.push({ at: { ...at }, item: s.item })
    })
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })

    w.ping()
    return
  }
  if (c.kind === 'compost-box') {
    stripPadStops(w, c)
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })

    w.ping()
    return
  }
  if (c.kind === 'mill') {
    stripPadStops(w, c)
    dropWires(w, w => hitsCell(w.from, at) || hitsCell(w.to, at))
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })

    w.ping()
    return
  }
  if (c.kind === 'jam') {
    stripPadStops(w, c)
    dropWires(w, w => hitsCell(w.from, at) || hitsCell(w.to, at))
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })

    w.ping()
    return
  }
  if (c.kind === 'still') {
    stripPadStops(w, c)
    occupiedCells(c.base, w.owned).forEach(p => {
      dropWires(w, w => hitsCell(w.from, p) || hitsCell(w.to, p))
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })
    w.stills.splice(w.stills.indexOf(c), 1)
    dirtyNets(w)

    w.ping()
    return
  }
  if (c.kind === 'furnace') {
    stripPadStops(w, c)
    occupiedCells(c.base, w.owned).forEach(p => {
      dropWires(w, w => hitsCell(w.from, p) || hitsCell(w.to, p))
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })

    w.ping()
    return
  }
  if (c.kind === 'station') {
    stripPadStops(w, c)
    occupiedCells(c.base, w.owned).forEach(p => {
      dropWires(w, w => hitsCell(w.from, p) || hitsCell(w.to, p))
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })

    w.ping()
    return
  }
  if (c.kind === 'barrel') {
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })

    w.ping()
    return
  }
  if (c.kind === 'freezer') {
    stripPadStops(w, c)
    dropWires(w, w => hitsCell(w.from, at) || hitsCell(w.to, at))
    c.slots.forEach(s => {
      if (s.kind === 'hold') w.drops.push({ at: { ...at }, item: s.item })
    })
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })

    w.ping()
    return
  }
  if (c.kind === 'hangar') {
    const origin = { col: c.base.col, row: c.base.row }
    if (w.hangarStores(origin)) return
    occupiedCells(c.base, w.owned).forEach(p => {
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })
    w.hangars.splice(w.hangars.indexOf(c), 1)

    w.ping()
    return
  }
  if (c.kind === 'silo-seed' || c.kind === 'silo-spray' || c.kind === 'silo-produce') {
    occupiedCells(c.base, w.owned).forEach(p => {
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })
    if (c.kind === 'silo-seed') w.seedSilos.splice(w.seedSilos.indexOf(c), 1)
    else if (c.kind === 'silo-spray') w.spraySilos.splice(w.spraySilos.indexOf(c), 1)
    else w.produceSilos.splice(w.produceSilos.indexOf(c), 1)
    w.ping()
    return
  }
  if (isSensor(c)) {
    if (c.kind === 'traffic-light') {
      stripStops(w, s => s.kind === 'wait' && s.at.col === at.col && s.at.row === at.row)
    }
    dropWires(w, w => hitsCell(w.from, at) || hitsCell(w.to, at))
    if (c.kind === 'water-system') w.waterSystems.splice(w.waterSystems.indexOf(c), 1)
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
    if (c.kind === 'water-system') dirtyNets(w)

    w.ping()
    return
  }
  if (c.kind !== 'grinder') return
  w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })

  w.ping()
}

export function cancelPlaceBody(w: World): void {
  if (w.act.place.kind === 'none') return
  w.act.place = { kind: 'none' }
  w.ping()
}

export function rotatePlaceBody(w: World): void {
  if (w.act.place.kind !== 'sku' || w.act.place.id !== 'buy-sprinkler-vert') return
  w.act.place = {
    kind: 'sku',
    id: 'buy-sprinkler-vert',
    facing: w.act.place.facing === 'ns' ? 'ew' : 'ns',
  }
  w.ping()
}

export function armDeleteBody(w: World): void {
  w.act.place = { kind: 'delete' }
  w.ping()
}

export function expandBody(w: World, id: ChunkId): void {
  if (!w.done.has('unlock-expand')) return
  if (expandLeft(w) <= 0) return
  if (w.owned.some(c => c.cx === id.cx && c.cy === id.cy)) return
  if (!w.owned.some(c => Math.abs(c.cx - id.cx) + Math.abs(c.cy - id.cy) === 1)) return
  const price = w.expandPrice()
  if (w.money < price) return
  w.money -= price
  w.owned.push(id)
  w.purchases += 1
  dirtyNets(w)
  w.sprinklerTargetCache.clear()
  w.chunks.set(
    chunkKey(id),
    generateChunk(w.rng, id, w.house, w.pumps[0], w.truck, w.silo, w.additives),
  )
  w.indexAll()
  w.ping()
}

export function faces(w: World): ExpandFace[] {
  if (!w.done.has('unlock-expand')) return []
  const have = new Set(w.owned.map(chunkKey))
  const seen = new Set<string>()
  const price = w.expandPrice()
  const out: ExpandFace[] = []
  const dirs = [
    { dir: 'n' as const, dcx: 0, dcy: -1 },
    { dir: 'e' as const, dcx: 1, dcy: 0 },
    { dir: 's' as const, dcx: 0, dcy: 1 },
    { dir: 'w' as const, dcx: -1, dcy: 0 },
  ]
  w.owned.forEach(o => {
    const rect = chunkRect(o)
    dirs.forEach(d => {
      const id = { cx: o.cx + d.dcx, cy: o.cy + d.dcy }
      const key = chunkKey(id)
      if (have.has(key) || seen.has(key)) return
      seen.add(key)
      const at =
        d.dir === 'n'
          ? { col: rect.col0 + CHUNK / 2, row: rect.row0 - 1 }
          : d.dir === 'e'
            ? { col: rect.col1, row: rect.row0 + CHUNK / 2 }
            : d.dir === 's'
              ? { col: rect.col0 + CHUNK / 2, row: rect.row1 }
              : { col: rect.col0 - 1, row: rect.row0 + CHUNK / 2 }
      out.push({ id, dir: d.dir, at, price })
    })
  })
  return out
}

export function placePipeBody(w: World, e: Edge): void {
  if (w.act.place.kind !== 'sku') return
  const id = w.act.place.id
  if (id !== 'buy-pipe' && id !== 'buy-valve') return
  if (w.money < w.skuPrice(id)) return
  if (!w.edgeOwned(e)) return
  if (id === 'buy-pipe') {
    if (w.hasPipe(e)) return
    w.segments.set(edgeKey(e), { at: e, gate: { kind: 'bare' } })
    vertsOf(e).forEach(v => w.netVerts.add(vertexKey(v)))
  } else if (id === 'buy-valve') {
    const seg = w.segmentAt(e)
    if (seg === undefined) {
      const total = w.skuPrice('buy-pipe') + w.skuPrice('buy-valve')
      if (w.money < total) return
      w.segments.set(edgeKey(e), { at: e, gate: { kind: 'valve', open: true } })
      vertsOf(e).forEach(v => w.netVerts.add(vertexKey(v)))
      w.money -= total
      dirtyNets(w)
      w.ping()
      return
    }
    if (seg.gate.kind !== 'bare') return
    seg.gate = { kind: 'valve', open: true }
  }
  w.money -= w.skuPrice(id)
  dirtyNets(w)
  w.ping()
}

export function deletePipeBody(w: World, e: Edge): void {
  if (w.act.place.kind !== 'delete') return
  const seg = w.segmentAt(e)
  if (!w.edgeOwned(e) || seg === undefined) return
  if (seg.gate.kind === 'valve') {
    seg.gate = { kind: 'bare' }
    dropWires(w, w => hitsEdge(w.from, e) || hitsEdge(w.to, e))
  } else {
    w.segments.delete(edgeKey(e))
    pruneVert(w, e)
  }
  dirtyNets(w)
  w.ping()
}

export function placeSprinklerBody(w: World, s: Sprinkler): void {
  const id = sprinklerSku(s)
  if (w.act.place.kind !== 'sku' || w.act.place.id !== id) return
  if (w.money < w.skuPrice(id)) return
  if (!w.vertexOwned(s.at)) return
  if (w.sprinklerAt(s.at) !== undefined) return
  const placed: Sprinkler =
    w.act.place.id === 'buy-sprinkler-vert'
      ? { variant: 'vert', at: s.at, facing: w.act.place.facing, tune: { kind: 'flat' }, inn: 0, hold: 0 }
      : { ...s, inn: 0, hold: 0 }
  if (!aoe(placed).every(c => w.inWorld(c))) return
  w.money -= w.skuPrice(id)
  w.sprinklers.set(vertexKey(placed.at), placed)
  w.sprinklerTargetCache.delete(vertexKey(placed.at))
  w.netVerts.add(vertexKey(placed.at))
  dirtyNets(w)
  w.ping()
}

export function deleteSprinklerBody(w: World, v: Vertex): void {
  if (w.act.place.kind !== 'delete') return
  if (w.sprinklerAt(v) === undefined) return
  w.sprinklers.delete(vertexKey(v))
  w.sprinklerTargetCache.delete(vertexKey(v))
  dropWires(w, w => hitsVertex(w.from, v) || hitsVertex(w.to, v))
  pruneVert(w, v)
  dirtyNets(w)
  w.ping()
}

export function clickBody(w: World, at: Coord): 'queued' | 'placed' | 'blocked' | 'noop' {
  if (w.driverVehicle(w.act.id) !== undefined) return 'noop'
  if (!inWorld(at, w.owned)) {
    if (inFade(at, w.owned) && w.act.place.kind === 'none') w.say(NOT_OWNED)
    return 'noop'
  }
  const p = readPrompt(w, at)
  if (p.kind === 'intent') {
    w.enqueueOn(w.act, p.intent)
    return 'queued'
  }
  if (p.kind === 'place') {
    confirmPlace(w, at)
    return 'placed'
  }
  if (w.act.place.kind === 'none' && inWorld(at, w.owned)) maybeSay(w, at, p.text)
  return 'blocked'
}

export function clickValveBody(w: World, e: Edge): void {
  const p = valvePrompt(w, e)
  if (p.kind !== 'intent') return
  w.enqueueOn(w.act, p.intent)
}

export function rightClickBody(w: World, at: Coord): void {
  if (w.act.place.kind !== 'none') {
    cancelPlaceBody(w)
    return
  }
  if (!inWorld(at, w.owned)) return
  if (!isPlot(w.cell(at))) return
  if (w.act.hand.kind !== 'hold') return
  w.enqueueOn(w.act, { act: 'drop', at: { ...at } })
}

export function prizeStock(w: World, id: SkuId): number {
  return id === 'buy-freezer-large' ? w.prizeFreezers : 0
}

export function buyPacksFail(w: World, id: SkuId): BuyFail | 'Locked' | undefined {
  if (!w.skuOpen(id)) return 'Locked'
  const made = skuItem(id)
  if (made.kind !== 'seeds') return 'Locked'
  if (w.money < packsPrice(w, id)) return 'Cannot afford'
  if (w.silo.free < 5 * made.count) return 'Seed silo full'
  return undefined
}

export function packsPrice(w: World, id: SkuId): number {
  return 5 * w.skuPrice(id) * 0.95
}

function sprinklerSku(s: Sprinkler): SkuId {
  if (s.variant === 'basic') return 'buy-sprinkler'
  if (s.variant === 'vert') return 'buy-sprinkler-vert'
  return 'buy-sprinkler-large'
}
