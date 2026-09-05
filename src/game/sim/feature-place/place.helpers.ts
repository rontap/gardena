import { FREEZER_LARGE_SLOTS, HANGAR_H, HANGAR_W, SILO_H, SILO_W } from '../../defs/items.ts'
import {
  Barrel,
  Chest,
  CompostBox,
  Freezer,
  Furnace,
  Grinder,
  Hangar,
  inWorld,
  JamMachine,
  Mill,
  occupiedCells,
  PotStill,
  Pump,
  RainTank,
  ResearchStation,
  SiloProduce,
  SiloSeed,
  SiloSpray,
  Tap,
  Well,
  type Coord,
} from '../building.ts'
import { SENSOR_CELL_SKUS } from '../ids.ts'
import { skuItem } from '../item.ts'
import { edgeKey, incident, vertexKey, vertsOf, type Edge, type Vertex } from '../pipe.ts'
import { isFenceSite, isPlot, isTileSite } from '../plot.ts'
import {
  hangarSiteOk,
  placeSolidOk,
  siloSiteOk,
  tallSiteOk,
  wideSiteOk,
} from '../prompt.ts'
import { hitsCell, isSensor, makeSensor, skuKind } from '../sensor.ts'
import { freshSoil } from '../feature-field/field.ts'
import { stripPadStops, stripStops } from '../feature-vehicles/vehicle.ts'
import type { World } from '../world.ts'

export function pruneVert(w: World, e: Edge | Vertex): void {
  const verts = 'axis' in e ? vertsOf(e) : [e]
  verts.forEach(v => {
    const keep = incident(v).some(x => w.segments.has(edgeKey(x))) || w.sprinklers.has(vertexKey(v))
    if (!keep) w.netVerts.delete(vertexKey(v))
  })
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
    w.dirtyNets()
    w.ping()
    return
  }
  if (c.kind === 'rain-tank') {
    occupiedCells(c.base, w.owned).forEach(p => {
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })
    w.tanks.splice(w.tanks.indexOf(c), 1)
    w.dirtyNets()
    w.ping()
    return
  }
  if (c.kind === 'tap') {
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
    w.taps.splice(w.taps.indexOf(c), 1)
    w.dirtyNets()
    w.ping()
    return
  }
  if (c.kind === 'well') {
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
    w.wells.splice(w.wells.indexOf(c), 1)
    w.dirtyNets()
    w.ping()
    return
  }
  if (c.kind === 'chest') {
    stripPadStops(w, c)
    w.dropWires(wire => hitsCell(wire.from, at) || hitsCell(wire.to, at))
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
    w.dropWires(wire => hitsCell(wire.from, at) || hitsCell(wire.to, at))
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
    w.ping()
    return
  }
  if (c.kind === 'jam') {
    stripPadStops(w, c)
    w.dropWires(wire => hitsCell(wire.from, at) || hitsCell(wire.to, at))
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
    w.ping()
    return
  }
  if (c.kind === 'still') {
    stripPadStops(w, c)
    occupiedCells(c.base, w.owned).forEach(p => {
      w.dropWires(wire => hitsCell(wire.from, p) || hitsCell(wire.to, p))
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })
    w.stills.splice(w.stills.indexOf(c), 1)
    w.dirtyNets()
    w.ping()
    return
  }
  if (c.kind === 'furnace') {
    stripPadStops(w, c)
    occupiedCells(c.base, w.owned).forEach(p => {
      w.dropWires(wire => hitsCell(wire.from, p) || hitsCell(wire.to, p))
      w.setCell(p, { kind: 'empty', soil: freshSoil(w, p) })
    })
    w.ping()
    return
  }
  if (c.kind === 'station') {
    stripPadStops(w, c)
    occupiedCells(c.base, w.owned).forEach(p => {
      w.dropWires(wire => hitsCell(wire.from, p) || hitsCell(wire.to, p))
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
    w.dropWires(wire => hitsCell(wire.from, at) || hitsCell(wire.to, at))
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
    w.dropWires(wire => hitsCell(wire.from, at) || hitsCell(wire.to, at))
    if (c.kind === 'water-system') w.waterSystems.splice(w.waterSystems.indexOf(c), 1)
    w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
    if (c.kind === 'water-system') w.dirtyNets()
    w.ping()
    return
  }
  if (c.kind !== 'grinder') return
  w.setCell(at, { kind: 'empty', soil: freshSoil(w, at) })
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
      w.dirtyNets()
    } else {
      const made = w.act.place.id === 'buy-pumpjack' ? new Pump(base, 'jack') : new RainTank(base)
      if (made.kind === 'pump') w.pumps.push(made)
      else w.tanks.push(made)
      w.setCell(at, made)
      w.setCell({ col: at.col + 1, row: at.row }, made)
      w.dirtyNets()
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
        w.dirtyNets()
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
    } else if (w.act.place.id === 'buy-well') {
      const well = new Well(base)
      w.wells.push(well)
      w.setCell(at, well)
      w.dirtyNets()
    } else {
      const tap = new Tap(base)
      w.taps.push(tap)
      w.setCell(at, tap)
      w.dirtyNets()
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
