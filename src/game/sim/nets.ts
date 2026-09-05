import type { World } from './world.ts'
import { type Net } from './world.h.ts'
import { inWorld, occupiedCells, type Base, type Coord } from './building.ts'
import { statsOf } from './modifiers.ts'
import { aoe, edgeKey, corners, flows, incident, vertexKey, vertsOf, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import { pull, Reservoir } from './water.ts'
import { pourEligible } from './sensor.ts'

export function grid(w: World): Net[] {
  if (w.nets !== undefined) return w.nets
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
  w.segments.forEach(seg => {
    if (!conducts(w, seg.at)) return
    const [a, b] = vertsOf(seg.at)
    join(vertexKey(a), vertexKey(b))
  })
  const sources = sources(w)
  const sourceCorners = sources.map(s => corners(occupiedCells(s.base, w.owned)).map(vertexKey))
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
  w.sprinklers.forEach(s => {
    const k = vertexKey(s.at)
    if (!up.has(k)) return
    if (!incident(s.at).some(e => conducts(w, e))) return
    netOf(k).sprinklers.push(s)
  })
  w.taps.forEach(t => {
    const hit = corners(occupiedCells(t.base, w.owned)).find(
      v => up.has(vertexKey(v)) && incident(v).some(e => conducts(w, e)),
    )
    if (hit === undefined) return
    netOf(vertexKey(hit)).taps.push(t)
  })
  w.stills.forEach(s => {
    const hit = corners(occupiedCells(s.base, w.owned)).find(
      v => up.has(vertexKey(v)) && incident(v).some(e => conducts(w, e)),
    )
    if (hit === undefined) return
    netOf(vertexKey(hit)).stills.push(s)
  })
  w.waterSystems.forEach(s => {
    const hit = corners(occupiedCells(s.base, w.owned)).find(
      v => up.has(vertexKey(v)) && incident(v).some(e => conducts(w, e)),
    )
    if (hit === undefined) return
    netOf(vertexKey(hit)).waterSystems.push(s)
  })
  w.netAt = new Map([...up.keys()].map(k => [k, netOf(k)]))
  w.nets = [...byRoot.values()]
  return w.nets
}

export function dirtyNets(w: World): void {
  w.nets = undefined
}

export function pendingWet(w: World, e: Edge): boolean {
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
        if (seen.has(k) || !conducts(w, n)) return
        seen.add(k)
        q.push(n)
      })
    })
  }
  return (
    sources(w).some(p =>
      corners(occupiedCells(p.base, w.owned)).some(v => verts.has(vertexKey(v))),
    )
  )
}

export function sprinklerTargets(w: World, s: Sprinkler): Coord[] {
  const k = vertexKey(s.at)
  const hit = w.sprinklerTargetCache.get(k)
  if (hit !== undefined) return hit
  const made = aoe(s).filter(at => w.inWorld(at) && w.cell(at).kind === 'growing')
  w.sprinklerTargetCache.set(k, made)
  return made
}

export function dropTargetCachesAt(w: World, at: Coord): void {
  w.sprinklers.forEach(s => {
    if (aoe(s).some(c => c.col === at.col && c.row === at.row)) w.sprinklerTargetCache.delete(vertexKey(s.at))
  })
}

export function rebuildWired(w: World): void {
  w.wiredVerts.clear()
  const keep = new Map<string, Edge>()
  if (w.done.has('unlock-smart-irrigation')) {
    w.wires.forEach(w => {
      if (w.to.kind === 'sprinkler') w.wiredVerts.add(vertexKey(w.to.at))
      if (w.to.kind === 'valve' && w.hasValve(w.to.e)) keep.set(edgeKey(w.to.e), w.to.e)
    })
  }
  ;[...w.valveHold.keys()].forEach(k => {
    if (!keep.has(k)) w.valveHold.delete(k)
  })
  keep.forEach((e, k) => {
    if (!w.valveHold.has(k)) w.valveHold.set(k, { e, level: 0, hold: 0 })
  })
  dirtyNets(w)
}

export function tileRate(w: World, s: Sprinkler): number {
  if (s.tune.kind === 'flat') return SPRINKLER_TILE_RATE
  return statsOf(s.tune.crop, 'base', 0, w.modifiers).waterUsePerSec
}

export function demand(w: World, s: Sprinkler): number {
  return sprinklerTargets(w, s).length * tileRate(w, s)
}

export function sprinklerWired(w: World, at: Vertex): boolean {
  return w.wiredVerts.has(vertexKey(at))
}

export function mayPour(w: World, s: Sprinkler): boolean {
  return pourEligible(sprinklerWired(w, s.at), s.inn)
}

export function rate(w: World, v: Vertex): number {
  const s = w.sprinklerAt(v)
  if (s === undefined) return 0
  if (!mayPour(w, s)) return 0
  const net = w.netOfVertex(v)
  if (net === undefined || net.sprinklers.length === 0) return 0
  if (net.sources.every(r => r.stored === 0)) return 0
  const total = net.sprinklers.reduce((a, x) => a + (mayPour(w, x) ? demand(w, x) : 0), 0)
  if (total === 0) return 0
  const supply = net.sources.reduce((a, r) => a + r.rate, 0)
  const served = total > supply ? supply : total
  return (demand(w, s) / total) * served
}

export function pullWater(w: World, sources: readonly Reservoir[], want: number): number {
  const before = sources.reduce((n, s) => n + (s.kind === 'pump' ? s.drawn : 0), 0)
  const got = pull(sources, want)
  const after = sources.reduce((n, s) => n + (s.kind === 'pump' ? s.drawn : 0), 0)
  w.pumpLiters += after - before
  return got
}

export function tickWater(w: World, dt: number): void {
  const pouring = new Set<string>()
  grid(w).forEach(net => {
    const active = net.sprinklers.filter(s => mayPour(w, s))
    const lists = active.map(s => sprinklerTargets(w, s))
    const want = active.map((s, i) => lists[i].length * tileRate(w, s) * dt)
    const total = want.reduce((a, b) => a + b, 0)
    if (total === 0) return
    const got = pullWater(w, net.sources, total)
    if (got === 0) return
    active.forEach((s, i) => {
      const targets = lists[i]
      if (targets.length === 0) return
      pouring.add(vertexKey(s.at))
      const add = ((want[i] / total) * got) / targets.length
      targets.forEach(at => {
        const c = w.cell(at)
        if (c.kind !== 'growing') return
        c.soil.soak(add)
      })
    })
  })
  if (tickVfx(w, pouring)) w.pingFor('vfx')
}

export function gatherWater(w: World, dt: number): void {
  sources(w).forEach(s => s.water.gather(dt))
}

export function sources(w: World): { base: Base; water: Reservoir }[] {
  return [...w.pumps, ...w.tanks, ...w.wells]
}

export function pruneVert(w: World, e: Edge | Vertex): void {
  const verts = 'axis' in e ? vertsOf(e) : [e]
  verts.forEach(v => {
    const keep =
      incident(v).some(x => w.segments.has(edgeKey(x))) || w.sprinklers.has(vertexKey(v))
    if (!keep) w.netVerts.delete(vertexKey(v))
  })
}

export function tickVfx(w: World, pouring: ReadonlySet<string>): boolean {
  let changed = false
  w.vfx.forEach((_on, k) => {
    if (!w.sprinklers.has(k)) {
      w.vfx.delete(k)
      changed = true
    }
  })
  w.sprinklers.forEach((_s, k) => {
    const now = pouring.has(k)
    if (w.vfx.get(k) !== now) {
      w.vfx.set(k, now)
      changed = true
    }
  })
  return changed
}

export function conducts(w: World, e: Edge): boolean {
  const seg = w.segments.get(edgeKey(e))
  if (seg === undefined) return false
  const h = w.valveHold.get(edgeKey(e))
  if (h !== undefined) return h.level === 1
  return flows(seg)
}
