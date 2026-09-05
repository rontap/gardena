import { SPRINKLER_TILE_RATE } from '../defs/items.ts'
import { occupiedCells, type Base, type Coord } from './building.ts'
import { statsOf } from './modifiers.ts'
import { aoe, edgeKey, corners, incident, vertexKey, vertsOf, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import { pourEligible, cellKey, dayRaw, evalDag, isSensor, readerRaw, rawMap, storeRaw, vehicleRaw, type Sensor } from './sensor.ts'
import type { Chest, Freezer, Furnace, JamMachine, Mill, PotStill, ResearchStation, SeedSilo, AdditiveStore } from './building.ts'
import type { Net, World } from './world.ts'
import { tickVfx } from './tick.ts'

export function fillable(world: World, at: Coord): boolean {
  const c = world.cell(at)
  if (c.kind === 'pump' || c.kind === 'rain-tank' || c.kind === 'well') return true
  if (c.kind !== 'tap') return false
  const net = netOfCell(world, c.base)
  return net !== undefined && net.sources.length > 0
}

export function grid(world: World): Net[] {
  if (world.nets !== undefined) return world.nets
  const up = new Map<string, string>()
  const root = (k: string): string => {
    let r = k
    while (up.get(r) !== r) r = up.get(r) as string
    return r
  }
  const add = (k: string): void => {
    if (!up.has(k)) up.set(k, k)
  }
  const join = (a: string, b: string): void => {
    add(a)
    add(b)
    up.set(root(a), root(b))
  }
  world.segments.forEach(seg => {
    if (!world.conducts(seg.at)) return
    const [a, b] = vertsOf(seg.at)
    join(vertexKey(a), vertexKey(b))
  })
  const sources = world.sources()
  const sourceCorners = sources.map(s => corners(occupiedCells(s.base, world.owned)).map(vertexKey))
  sourceCorners.forEach(ks => {
    ks.forEach(k => add(k))
    ks.slice(1).forEach(k => join(ks[0], k))
  })
  const byRoot = new Map<string, Net>()
  const netOf = (k: string): Net => {
    const r = root(k)
    const hit = byRoot.get(r)
    if (hit !== undefined) return hit
    const made: Net = { sources: [], sprinklers: [], taps: [], stills: [], waterSystems: [] }
    byRoot.set(r, made)
    return made
  }
  sources.forEach((s, i) => {
    netOf(sourceCorners[i][0]).sources.push(s.water)
  })
  world.sprinklers.forEach(s => {
    const k = vertexKey(s.at)
    if (!up.has(k)) return
    if (!incident(s.at).some(e => world.conducts(e))) return
    netOf(k).sprinklers.push(s)
  })
  world.taps.forEach(t => {
    const hit = corners(occupiedCells(t.base, world.owned)).find(
      v => up.has(vertexKey(v)) && incident(v).some(e => world.conducts(e)),
    )
    if (hit === undefined) return
    netOf(vertexKey(hit)).taps.push(t)
  })
  world.stills.forEach(s => {
    const hit = corners(occupiedCells(s.base, world.owned)).find(
      v => up.has(vertexKey(v)) && incident(v).some(e => world.conducts(e)),
    )
    if (hit === undefined) return
    netOf(vertexKey(hit)).stills.push(s)
  })
  world.waterSystems.forEach(s => {
    const hit = corners(occupiedCells(s.base, world.owned)).find(
      v => up.has(vertexKey(v)) && incident(v).some(e => world.conducts(e)),
    )
    if (hit === undefined) return
    netOf(vertexKey(hit)).waterSystems.push(s)
  })
  world.netAt = new Map([...up.keys()].map(k => [k, netOf(k)]))
  world.nets = [...byRoot.values()]
  return world.nets
}

export function netOfVertex(world: World, v: Vertex): Net | undefined {
  grid(world)
  return world.netAt.get(vertexKey(v))
}

export function netOfCell(world: World, base: Base): Net | undefined {
  grid(world)
  const hit = corners(occupiedCells(base, world.owned)).find(v => world.netAt.has(vertexKey(v)))
  if (hit === undefined) return undefined
  return world.netAt.get(vertexKey(hit))
}

export function vertexWet(world: World, v: Vertex): boolean {
  const net = netOfVertex(world, v)
  return net !== undefined && net.sources.length > 0
}

export function pendingWet(world: World, e: Edge): boolean {
  const seen = new Set<string>([edgeKey(e)])
  const verts = new Set<string>()
  const q: Edge[] = [e]
  while (q.length > 0) {
    const cur = q[q.length - 1]
    q.pop()
    vertsOf(cur).forEach(v => {
      verts.add(vertexKey(v))
      incident(v).forEach(n => {
        const k = edgeKey(n)
        if (seen.has(k) || !world.conducts(n)) return
        seen.add(k)
        q.push(n)
      })
    })
  }
  return (
    world.sources().some(p =>
      corners(occupiedCells(p.base, world.owned)).some(v => verts.has(vertexKey(v))),
    )
  )
}

export function sprinklerTargets(world: World, s: Sprinkler): Coord[] {
  const k = vertexKey(s.at)
  const hit = world.sprinklerTargetCache.get(k)
  if (hit !== undefined) return hit
  const made = aoe(s).filter(at => world.inWorld(at) && world.cell(at).kind === 'growing')
  world.sprinklerTargetCache.set(k, made)
  return made
}

export function dropTargetCachesAt(world: World, at: Coord): void {
  world.sprinklers.forEach(s => {
    if (aoe(s).some(c => c.col === at.col && c.row === at.row)) world.sprinklerTargetCache.delete(vertexKey(s.at))
  })
}

export function rebuildWired(world: World): void {
  world.wiredVerts.clear()
  const keep = new Map<string, Edge>()
  if (world.done.has('unlock-smart-irrigation')) {
    world.wires.forEach(w => {
      if (w.to.kind === 'sprinkler') world.wiredVerts.add(vertexKey(w.to.at))
      if (w.to.kind === 'valve' && world.hasValve(w.to.e)) keep.set(edgeKey(w.to.e), w.to.e)
    })
  }
  ;[...world.valveHold.keys()].forEach(k => {
    if (!keep.has(k)) world.valveHold.delete(k)
  })
  keep.forEach((e, k) => {
    if (!world.valveHold.has(k)) world.valveHold.set(k, { e, level: 0, hold: 0 })
  })
  world.dirtyNets()
}

export function tileRate(world: World, s: Sprinkler): number {
  if (s.tune.kind === 'flat') return SPRINKLER_TILE_RATE
  return statsOf(s.tune.crop, 'base', 0, world.modifiers).waterUsePerSec
}

export function demand(world: World, s: Sprinkler): number {
  return sprinklerTargets(world, s).length * tileRate(world, s)
}

export function sprinklerWired(world: World, at: Vertex): boolean {
  return world.wiredVerts.has(vertexKey(at))
}

export function mayPour(world: World, s: Sprinkler): boolean {
  return pourEligible(sprinklerWired(world, s.at), s.inn)
}

export function rate(world: World, v: Vertex): number {
  const s = world.sprinklerAt(v)
  if (s === undefined) return 0
  if (!mayPour(world, s)) return 0
  const net = netOfVertex(world, v)
  if (!(net?.sprinklers.length)) return 0
  if (net.sources.every(r => r.stored === 0)) return 0
  const total = net.sprinklers.reduce((a, x) => a + (mayPour(world, x) ? demand(world, x) : 0), 0)
  if (total === 0) return 0
  const supply = net.sources.reduce((a, r) => a + r.rate, 0)
  const served = total > supply ? supply : total
  return (demand(world, s) / total) * served
}

export function tickWater(world: World, dt: number): void {
  const pouring = new Set<string>()
  grid(world).forEach(net => {
    const active = net.sprinklers.filter(s => mayPour(world, s))
    const lists = active.map(s => sprinklerTargets(world, s))
    const want = active.map((s, i) => lists[i].length * tileRate(world, s) * dt)
    const total = want.reduce((a, b) => a + b, 0)
    if (total === 0) return
    const got = world.pullWater(net.sources, total)
    if (got === 0) return
    active.forEach((s, i) => {
      const targets = lists[i]
      if (targets.length === 0) return
      pouring.add(vertexKey(s.at))
      const add = ((want[i] / total) * got) / targets.length
      targets.forEach(at => {
        const c = world.cell(at)
        if (c.kind !== 'growing') return
        c.soil.soak(add)
      })
    })
  })
  if (tickVfx(world, pouring)) world.pingFor('vfx')
}

export function evalSensors(world: World, dt: number): void {
  const sensors = new Map<string, Sensor>()
  const machines = new Map<string, Mill | JamMachine | PotStill | Furnace | ResearchStation>()
  const stores = new Map<string, Chest | Freezer | SeedSilo | AdditiveStore | Furnace>()
  for (const at of world.sensors.values()) {
    const c = world.cell(at)
    if (isSensor(c)) sensors.set(cellKey(at), c)
  }
  for (const at of world.machines.values()) {
    const c = world.cell(at)
    if (c.kind === 'mill' || c.kind === 'jam' || c.kind === 'still' || c.kind === 'furnace' || c.kind === 'station') {
      machines.set(cellKey(at), c)
    }
    if (c.kind === 'furnace') stores.set(cellKey(at), c)
  }
  for (const at of world.stores.values()) {
    const c = world.cell(at)
    if (c.kind === 'chest' || c.kind === 'freezer') stores.set(cellKey(at), c)
  }
  stores.set(cellKey({ col: world.silo.base.col, row: world.silo.base.row }), world.silo)
  stores.set(cellKey({ col: world.additives.base.col, row: world.additives.base.row }), world.additives)
  const raw = new Map<string, 0 | 1>()
  sensors.forEach((s, k) => {
    if (s.kind === 'sensor-water' || s.kind === 'sensor-fert' || s.kind === 'sensor-harvest') {
      raw.set(k, readerRaw(s, at => (world.inWorld(at) ? world.cell(at) : undefined), world.modifiers))
    } else if (s.kind === 'sensor-day') {
      raw.set(k, dayRaw(s, world.clock.phase()))
    } else if (s.kind === 'water-system') {
      grid(world)
      const hit = corners(occupiedCells(s.base, world.owned)).find(
        v => world.netAt.has(vertexKey(v)) && incident(v).some(e => world.conducts(e)),
      )
      const net = hit === undefined ? undefined : world.netAt.get(vertexKey(hit))
      if (net === undefined) {
        raw.set(k, 0)
        return
      }
      const stored = net.sources.reduce((a, r) => a + r.stored, 0)
      const want = net.sprinklers.reduce((a, spr) => a + (mayPour(world, spr) ? demand(world, spr) * dt : 0), 0)
      raw.set(k, want > stored ? 1 : 0)
    } else if (s.kind === 'vehicle-detector') {
      raw.set(k, vehicleRaw({ col: s.base.col, row: s.base.row }, world.vehicles))
    }
  })
  stores.forEach((s, k) => {
    raw.set(k, storeRaw(s))
  })
  const prevLevels = new Map<string, 0 | 1>()
  world.valveHold.forEach((h, k) => prevLevels.set(k, h.level))
  evalDag({ sensors, wires: world.wires, valves: world.valveHold, sprinklers: world.sprinklers, raw: rawMap(raw), machines, stores })
  let flipped = false
  world.valveHold.forEach((h, k) => {
    if (prevLevels.get(k) !== h.level) flipped = true
  })
  if (flipped) world.dirtyNets()
}

export function gatherWater(world: World, dt: number): void {
  world.sources().forEach(s => s.water.gather(dt))
}
