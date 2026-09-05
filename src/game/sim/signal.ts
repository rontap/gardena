import type { World } from './world.ts'
import { conducts, demand, dirtyNets, grid, mayPour, rebuildWired, sources } from './nets.ts'
import { type HudTarget } from './world.h.ts'
import { AdditiveStore, Chest, Freezer, JamMachine, Mill, Furnace, PotStill, ResearchStation, SeedSilo, inWorld, local, occupiedCells, type Coord } from './building.ts'
import { isIoCell, machineEast, machineWest } from './machine.ts'
import { corners, incident, vertexKey } from './pipe.ts'
import { advanceRoute, driverVehicle, dropoffPad, isPadCell, loadWould, padHit, stopArrived, takeupPad, transferLoad, transferUnload, unloadWould, type PadCell, type Vehicle } from './vehicle.ts'
import { cellKey, dayRaw, dropIncident, evalDag, tickButton, isInEnd, isOutEnd, isSensor, rawMap, readerRaw, sameEnd, sameNode, storeRaw, vehicleRaw, isSeqIn, stepHold, wouldCycle, type Sensor, type Wire, type WireEnd } from './sensor.ts'

export function evalSensors(w: World, dt: number): void {
  const sensors = new Map<string, Sensor>()
  const machines = new Map<string, Mill | JamMachine | PotStill | Furnace | ResearchStation>()
  const stores = new Map<string, Chest | Freezer | SeedSilo | AdditiveStore | Furnace>()
  for (const at of w.sensors.values()) {
    const c = w.cell(at)
    if (isSensor(c)) sensors.set(cellKey(at), c)
  }
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (c.kind === 'mill' || c.kind === 'jam' || c.kind === 'still' || c.kind === 'furnace' || c.kind === 'station') {
      machines.set(cellKey(at), c)
    }
    if (c.kind === 'furnace') stores.set(cellKey(at), c)
  }
  for (const at of w.stores.values()) {
    const c = w.cell(at)
    if (c.kind === 'chest' || c.kind === 'freezer') stores.set(cellKey(at), c)
  }
  stores.set(cellKey({ col: w.silo.base.col, row: w.silo.base.row }), w.silo)
  stores.set(cellKey({ col: w.additives.base.col, row: w.additives.base.row }), w.additives)
  const raw = new Map<string, 0 | 1>()
  sensors.forEach((s, k) => {
    if (s.kind === 'sensor-water' || s.kind === 'sensor-fert' || s.kind === 'sensor-harvest') {
      raw.set(k, readerRaw(s, at => (w.inWorld(at) ? w.cell(at) : undefined), w.modifiers))
    } else if (s.kind === 'sensor-day') {
      raw.set(k, dayRaw(s, w.clock.phase()))
    } else if (s.kind === 'water-system') {
      grid(w)
      const hit = corners(occupiedCells(s.base, w.owned)).find(
        v => w.netAt.has(vertexKey(v)) && incident(v).some(e => conducts(w, e)),
      )
      const net = hit === undefined ? undefined : w.netAt.get(vertexKey(hit))
      if (net === undefined) {
        raw.set(k, 0)
        return
      }
      const stored = net.sources.reduce((a, r) => a + r.stored, 0)
      const want = net.sprinklers.reduce((a, spr) => a + (mayPour(w, spr) ? demand(w, spr) * dt : 0), 0)
      raw.set(k, want > stored ? 1 : 0)
    } else if (s.kind === 'vehicle-detector') {
      raw.set(k, vehicleRaw({ col: s.base.col, row: s.base.row }, w.vehicles))
    }
  })
  stores.forEach((s, k) => {
    raw.set(k, storeRaw(s))
  })
  const prevLevels = new Map<string, 0 | 1>()
  w.valveHold.forEach((h, k) => prevLevels.set(k, h.level))
  evalDag({ sensors, wires: w.wires, valves: w.valveHold, sprinklers: w.sprinklers, raw: rawMap(raw), machines, stores })
  let flipped = false
  w.valveHold.forEach((h, k) => {
    if (prevLevels.get(k) !== h.level) flipped = true
  })
  if (flipped) dirtyNets(w)
}

export function tickButtons(w: World): void {
  for (const at of w.buttons.values()) {
    const c = w.cell(at)
    if (c.kind === 'button') tickButton(c)
  }
}

export function placeWireBody(w: World, from: WireEnd, to: WireEnd): void {
  if (w.act.place.kind !== 'wire') return
  if (!portLegal(w, from, 'from') || !portLegal(w, to, 'to')) return
  const next = w.wires.filter(w => !(sameNode(w.from, from) && sameNode(w.to, to)))
  if (next.length !== w.wires.length) {
    w.wires.length = 0
    next.forEach(w => w.wires.push(w))
    rebuildWired(w)
    w.act.place = { kind: 'none' }
    w.ping()
    return
  }
  if (
    wouldCycle(w.wires, from, to, end =>
      isSeqIn(end, end.kind === 'cell' && w.inWorld(end.at) ? w.cell(end.at) : undefined),
    )
  ) {
    return
  }
  w.wires.push({ from, to })
  rebuildWired(w)
  w.act.place = { kind: 'none' }
  w.ping()
}

export function deleteWireBody(w: World, from: WireEnd, to: WireEnd): void {
  if (w.act.place.kind !== 'delete') return
  const next = w.wires.filter(w => !sameEnd(w.from, from) || !sameEnd(w.to, to))
  if (next.length === w.wires.length) return
  w.wires.length = 0
  next.forEach(w => w.wires.push(w))
  rebuildWired(w)
  w.ping()
}

export function dropWires(w: World, gone: (w: Wire) => boolean): void {
  const next = dropIncident(w.wires, gone)
  w.wires.length = 0
  next.forEach(w => w.wires.push(w))
  rebuildWired(w)
}

export function portLegal(w: World, end: WireEnd, side: 'from' | 'to'): boolean {
  const c = end.kind === 'cell' && w.inWorld(end.at) ? w.cell(end.at) : undefined
  if (side === 'from') return isOutEnd(end, c)
  const on = w.done.has('unlock-smart-irrigation')
  const valve = on && end.kind === 'valve' && w.hasValve(end.e)
  const sprinkler = on && end.kind === 'sprinkler' && w.sprinklerAt(end.at) !== undefined
  return isInEnd(end, c, valve, sprinkler)
}

export function tuneWaterBody(w: World, at: Coord, wilt: boolean, over: boolean): void {
  const c = w.cell(at)
  if (c.kind !== 'sensor-water') return
  c.wilt = wilt
  c.over = over
  w.ping()
}

export function tuneHarvestBody(w: World, at: Coord, mode: 'any' | 'all'): void {
  const c = w.cell(at)
  if (c.kind !== 'sensor-harvest') return
  c.mode = mode
  w.ping()
}

export function tuneCounterBody(w: World, at: Coord, n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > COUNTER_MAX) return
  const c = w.cell(at)
  if (c.kind !== 'counter') return
  c.n = n
  w.ping()
}

export function resetCounterBody(w: World, at: Coord): void {
  const c = w.cell(at)
  if (c.kind !== 'counter') return
  c.count = 0
  w.ping()
}

export function tuneDayBody(w: World, at: Coord, sunrise: boolean, day: boolean, sunset: boolean, twilight: boolean): void {
  const c = w.cell(at)
  if (c.kind !== 'sensor-day') return
  c.sunrise = sunrise
  c.day = day
  c.sunset = sunset
  c.twilight = twilight
  w.ping()
}

export function openHudBody(w: World, target: HudTarget): void {
  w.hud = target
  w.ping()
}

export function closeHudBody(w: World): void {
  if (w.hud === undefined) return
  w.hud = undefined
  w.ping()
}

export function sensorAt(w: World, at: Coord): Sensor | undefined {
  if (!w.inWorld(at)) return undefined
  const c = w.cell(at)
  if (!isSensor(c)) return undefined
  return c
}

export function armWireBody(w: World, from: WireEnd): void {
  if (!portLegal(w, from, 'from')) return
  w.act.place = { kind: 'wire', from }
  w.ping()
}

export function tickDispatch(w: World, dt: number): void {
  w.vehicles.forEach(v => {
    if (v.pose.kind !== 'field' || !v.running || v.route === 'none') return
    const route = w.routeById(v.route)
    if (route === undefined || route.stops.length === 0) return
    const stop = route.stops[v.cursor]
    if (stop.kind === 'goto') return
    if (!stopArrived(w, v.pose, stop)) return
    if (v.fuel === 0) return
    if (stop.kind === 'wait') {
      if (!w.inWorld(stop.at)) return
      const light = w.cell(stop.at)
      if (light.kind !== 'traffic-light') return
      if (light.inn === 1) advanceRoute(w, v, route)
      return
    }
    if (v.dwell <= 0) {
      v.dwell = DISPATCH_DWELL
      return
    }
    v.dwell -= dt
    if (v.dwell > 0) return
    v.dwell = 0
    if (stop.kind === 'load') transferLoad(w, v)
    else transferUnload(w, v)
    advanceRoute(w, v, route)
  })
  for (const at of w.sensors.values()) {
    const c = w.cell(at)
    if (c.kind !== 'traffic-light') continue
    const raw: 0 | 1 = lightWaiter(w, c) ? 1 : 0
    const next = stepHold(c.out, c.hold, raw)
    c.out = next.out
    c.hold = next.hold
  }
}

export function lightWaiter(w: World, light: Extract<Sensor, { kind: 'traffic-light' }>): boolean {
  const at = { col: light.base.col, row: light.base.row }
  return w.vehicles.some(v => {
    if (v.pose.kind !== 'field' || !v.running || v.route === 'none') return false
    const route = w.routeById(v.route)
    if (route === undefined || route.stops.length === 0) return false
    const stop = route.stops[v.cursor]
    if (stop.kind !== 'wait') return false
    if (stop.at.col !== at.col || stop.at.row !== at.row) return false
    if (Math.floor(v.pose.x) !== at.col || Math.floor(v.pose.y) !== at.row) return false
    return light.inn === 0
  })
}

export function machinePads(w: World): { col: number; row: number; side: 'dropoff' | 'takeup'; legal: boolean }[] {
  w.act = w.seats[w.local]
  const v = w.driverVehicle(w.local)
  const floor =
    v !== undefined && v.pose.kind === 'field'
      ? { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) }
      : undefined
  const out: { col: number; row: number; side: 'dropoff' | 'takeup'; legal: boolean }[] = []
  padBuildings(w).forEach(b => {
    dropoffPad(b.base).forEach(p => {
      const on = floor !== undefined && p.col === floor.col && p.row === floor.row
      out.push({ col: p.col, row: p.row, side: 'dropoff', legal: on && unloadWould(w) })
    })
    takeupPad(b.base).forEach(p => {
      const on = floor !== undefined && p.col === floor.col && p.row === floor.row
      out.push({ col: p.col, row: p.row, side: 'takeup', legal: on && loadWould(w) })
    })
  })
  return out
}

export function machineLinks(w: World): { x: number; y: number; side: 'in' | 'out' }[] {
  const out: { x: number; y: number; side: 'in' | 'out' }[] = []
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (!isIoCell(c)) continue
    if (c.base.col !== at.col || c.base.row !== at.row) continue
    const west = machineWest(c.base)
    if (w.inWorld(west)) {
      const s = w.cell(west)
      if (s.kind === 'chest' || s.kind === 'freezer') out.push({ x: c.base.col - 0.5, y: c.base.row, side: 'in' })
    }
    const east = machineEast(c.base)
    if (w.inWorld(east)) {
      const s = w.cell(east)
      if (s.kind === 'chest' || s.kind === 'freezer') {
        out.push({ x: c.base.col + c.base.w - 0.5, y: c.base.row, side: 'out' })
      }
    }
  }
  return out
}

export function enter(w: World): void {
  const driven = w.driverVehicle(w.local)
  if (driven !== undefined) {
    w.disembark()
    return
  }
  const actor = w.seats[w.local].actor
  let best: Vehicle | undefined
  let bestD = Infinity
  w.vehicles.forEach(v => {
    if (v.pose.kind !== 'field' || v.pose.driver !== 'none') return
    const d = Math.hypot(actor.x - v.pose.x, actor.y - v.pose.y)
    if (d > 1.5) return
    if (best === undefined || d < bestD) {
      best = v
      bestD = d
    }
  })
  if (best === undefined || best.pose.kind !== 'field') return
  w.seats[w.local].actor.x = best.pose.x
  w.seats[w.local].actor.y = best.pose.y
  w.embark(best.id)
}

export function padBuildings(w: World): PadCell[] {
  const out: PadCell[] = []
  for (const at of w.machines.values()) {
    const c = w.cell(at)
    if (isPadCell(c)) out.push(c)
  }
  for (const at of w.stores.values()) {
    const c = w.cell(at)
    if (isPadCell(c)) out.push(c)
  }
  if (isPadCell(w.silo)) out.push(w.silo)
  if (isPadCell(w.additives)) out.push(w.additives)
  return out
}

export function padSideOfLocal(w: World): 'dropoff' | 'takeup' | undefined {
  const v = w.driverVehicle(w.local)
  if (v === undefined || v.pose.kind !== 'field') return undefined
  const hit = padHit(w, { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
  return hit === undefined ? undefined : hit.side
}
