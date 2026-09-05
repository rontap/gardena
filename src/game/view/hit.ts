import { SENSOR_CELL_SKUS, type SkuId } from '../sim/ids.ts'
import { aoe, edgeKey, type Edge, type Sprinkler, type Vertex } from '../sim/pipe.ts'
import { drivesOut, nearestWire, portXY, type PortId, type WireEnd } from '../sim/sensor.ts'
import type { Cell } from '../sim/plot.ts'
import type { Place, World } from '../sim/world.ts'
import type { PromptHit } from '../sim/prompt.ts'
import { DROP_FACE, DROP_INSET, DROP_STEP, TILE } from './camera.ts'

export type Lens = 'off' | 'water' | 'land' | 'ripe' | 'kind' | 'variety' | 'pipes' | 'sensors' | 'vehicles'

export type MapClick = PromptHit

export const EDGE_HIT = 0.35
export const VERTEX_HIT = 0.3
export const SPRINKLER_HIT = 0.45
export const PORT_HIT = 0.18

export const PIPE_PLACE: readonly SkuId[] = [
  'buy-pipe',
  'buy-valve',
  'buy-rain-tank',
  'buy-tap',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-well',
  'buy-pumpjack',
]

export function pipesOverlay(lens: Lens, place: Place): boolean {
  return lens === 'pipes' || place.kind === 'delete' || (place.kind === 'sku' && PIPE_PLACE.includes(place.id))
}

export const AOE_WASH: readonly SkuId[] = [
  'buy-pipe',
  'buy-valve',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
]

export const STAY_ARMED: readonly SkuId[] = [
  'buy-pipe',
  'buy-valve',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  ...SENSOR_CELL_SKUS,
]

export const SPRINKLER_SKU: readonly SkuId[] = ['buy-sprinkler', 'buy-sprinkler-vert', 'buy-sprinkler-large']

export type DeleteTarget =
  | { kind: 'pipe'; edge: Edge }
  | { kind: 'sprinkler'; at: Vertex }
  | { kind: 'wire'; from: WireEnd; to: WireEnd }

export function nearestEdge(wx: number, wy: number): Edge | undefined {
  const col = Math.floor(wx)
  const row = Math.floor(wy)
  const fx = wx - col
  const fy = wy - row
  const hits: { edge: Edge; d: number }[] = [
    { edge: { axis: 'h', col, row }, d: fy },
    { edge: { axis: 'h', col, row: row + 1 }, d: 1 - fy },
    { edge: { axis: 'v', col, row }, d: fx },
    { edge: { axis: 'v', col: col + 1, row }, d: 1 - fx },
  ]
  let best = hits[0]
  for (const h of hits) {
    if (h.d < best.d) best = h
  }
  if (best.d > EDGE_HIT) return undefined
  return best.edge
}

export function nearestVertex(wx: number, wy: number, r: number): Vertex | undefined {
  const col = Math.round(wx)
  const row = Math.round(wy)
  if (Math.hypot(wx - col, wy - row) > r) return undefined
  return { col, row }
}

export function makeSprinkler(place: Extract<Place, { kind: 'sku' }>, at: Vertex): Sprinkler {
  const tune = { kind: 'flat' } as const
  if (place.id === 'buy-sprinkler-large') return { variant: 'large', at, tune, inn: 0, hold: 0 }
  if (place.id === 'buy-sprinkler-vert') return { variant: 'vert', at, facing: place.facing, tune, inn: 0, hold: 0 }
  return { variant: 'basic', at, tune, inn: 0, hold: 0 }
}

export function arms(
  world: World,
  v: Vertex,
  extra: readonly Edge[],
): { n: boolean; e: boolean; s: boolean; w: boolean } {
  const keys = new Set(extra.map(edgeKey))
  const has = (e: Edge) => world.hasPipe(e) || keys.has(edgeKey(e))
  return {
    n: has({ axis: 'v', col: v.col, row: v.row - 1 }),
    e: has({ axis: 'h', col: v.col, row: v.row }),
    s: has({ axis: 'v', col: v.col, row: v.row }),
    w: has({ axis: 'h', col: v.col - 1, row: v.row }),
  }
}

export function roundVertex(wx: number, wy: number): Vertex {
  return { col: Math.round(wx), row: Math.round(wy) }
}

export function onEdgeBand(wx: number, wy: number): boolean {
  const col = Math.floor(wx)
  const row = Math.floor(wy)
  const fx = wx - col
  const fy = wy - row
  return Math.min(fx, 1 - fx) <= EDGE_HIT || Math.min(fy, 1 - fy) <= EDGE_HIT
}

export function routeEdges(a: Vertex, b: Vertex, flip: boolean): Edge[] {
  const dx = b.col - a.col
  const dy = b.row - a.row
  const horizFirst = flip ? Math.abs(dx) < Math.abs(dy) : Math.abs(dx) >= Math.abs(dy)
  const out: Edge[] = []
  const run = (from: Vertex, to: Vertex): Vertex => {
    if (from.col !== to.col) {
      const step = to.col > from.col ? 1 : -1
      for (let c = from.col; c !== to.col; c += step) {
        out.push({ axis: 'h', col: step === 1 ? c : c - 1, row: from.row })
      }
      return { col: to.col, row: from.row }
    }
    const step = to.row > from.row ? 1 : -1
    for (let r = from.row; r !== to.row; r += step) {
      out.push({ axis: 'v', col: from.col, row: step === 1 ? r : r - 1 })
    }
    return { col: from.col, row: to.row }
  }
  const corner = horizFirst ? { col: b.col, row: a.row } : { col: a.col, row: b.row }
  const mid = run(a, corner)
  run(mid, b)
  return out
}

export function pipeOk(world: World, id: SkuId, e: Edge): boolean {
  if (!world.edgeOwned(e)) return false
  if (id === 'buy-valve') return world.hasPipe(e) && !world.hasValve(e)
  return !world.hasPipe(e)
}

export function sprinklerOk(world: World, s: Sprinkler): boolean {
  if (world.sprinklerAt(s.at) !== undefined) return false
  if (!aoe(s).every(at => world.inWorld(at))) return false
  const { col, row } = s.at
  return (
    world.inWorld({ col: col - 1, row: row - 1 }) ||
    world.inWorld({ col, row: row - 1 }) ||
    world.inWorld({ col: col - 1, row }) ||
    world.inWorld({ col, row })
  )
}

export function wireEndXY(world: World, end: WireEnd): { x: number; y: number } {
  if (end.kind === 'cell') {
    const c = world.cell(end.at)
    return portXY(end, 'ports' in c ? c.ports : undefined)
  }
  return portXY(end)
}

const WHOLE_CELL_PORT: Record<string, PortId> = {
  lamp: 'in',
  'sensor-fert': 'out',
  'water-system': 'out',
  'vehicle-detector': 'out',
  chest: 'out',
  freezer: 'out',
  'seed-silo': 'out',
  'additive-store': 'out',
}

function originOk(c: Cell, at: { col: number; row: number }): boolean {
  if (!('base' in c)) return true
  if (c.base.shape !== 'rect') return false
  return c.base.col === at.col && c.base.row === at.row
}

function portHit(world: World, wx: number, wy: number): WireEnd | undefined {
  const col = Math.floor(wx)
  const row = Math.floor(wy)
  let bestD = PORT_HIT
  let best: WireEnd | undefined = undefined
  const take = (end: WireEnd, x: number, y: number): void => {
    const d = Math.hypot(wx - x, wy - y)
    if (d > bestD) return
    bestD = d
    best = end
  }
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const at = { col: col + dc, row: row + dr }
      if (!world.inWorld(at)) continue
      const c = world.cell(at)
      if (!originOk(c, at)) continue
      if (!('ports' in c)) continue
      c.ports.forEach(port => {
        const end: WireEnd = { kind: 'cell', at, port }
        const p = portXY(end, c.ports)
        take(end, p.x, p.y)
      })
    }
  }
  if (world.done.has('unlock-smart-irrigation')) {
    const v = { col: Math.round(wx), row: Math.round(wy) }
    if (world.sprinklerAt(v) !== undefined) take({ kind: 'sprinkler', at: v, port: 'in' }, v.col, v.row)
    const edge = nearestEdge(wx, wy)
    if (edge !== undefined && world.hasValve(edge)) {
      const p = portXY({ kind: 'valve', e: edge, port: 'in' })
      take({ kind: 'valve', e: edge, port: 'in' }, p.x, p.y)
    }
  }
  if (best !== undefined) return best as WireEnd
  const at = { col, row }
  if (!world.inWorld(at)) return undefined
  const c = world.cell(at)
  if (!originOk(c, at)) return undefined
  const port = WHOLE_CELL_PORT[c.kind]
  if (port === undefined) return undefined
  return { kind: 'cell', at, port }
}

export function wireSignal(world: World, from: WireEnd): boolean {
  if (from.kind !== 'cell') return false
  const c = world.cell(from.at)
  return drivesOut(c) && c.out === 1
}

function valveHit(world: World, wx: number, wy: number): Edge | undefined {
  let best: { edge: Edge; d: number } | undefined = undefined
  world.segments.forEach(seg => {
    if (seg.gate.kind !== 'valve') return
    const mx = seg.at.axis === 'h' ? seg.at.col + 0.5 : seg.at.col
    const my = seg.at.axis === 'h' ? seg.at.row : seg.at.row + 0.5
    const d = Math.hypot(wx - mx, wy - my)
    if (d > VERTEX_HIT) return
    if (best === undefined) best = { edge: seg.at, d }
    else if (d < best.d) best = { edge: seg.at, d }
  })
  if (best === undefined) return undefined
  return (best as { edge: Edge; d: number }).edge
}

export function deleteHit(
  world: World,
  edge: Edge | undefined,
  v: Vertex | undefined,
  wx: number,
  wy: number,
): DeleteTarget | undefined {
  const wire = nearestWire(world.wires, wx, wy, end => wireEndXY(world, end), VERTEX_HIT)
  if (wire !== undefined) return { kind: 'wire', from: wire.from, to: wire.to }
  if (edge !== undefined) {
    if (world.hasPipe(edge) && world.edgeOwned(edge)) return { kind: 'pipe', edge }
  }
  if (v !== undefined && world.sprinklerAt(v) !== undefined) return { kind: 'sprinkler', at: v }
  return undefined
}

export function stayOk(
  world: World,
  placeId: SkuId | undefined,
  edge: Edge | undefined,
  s: Sprinkler | undefined,
  del: DeleteTarget | undefined,
): boolean {
  if (world.seats[world.local].place.kind === 'delete') {
    if (del !== undefined) return true
    if (edge === undefined && s === undefined) return false
    return del !== undefined
  }
  if (placeId === undefined) return false
  if (world.money < world.skuPrice(placeId)) return false
  if (placeId === 'buy-pipe' || placeId === 'buy-valve') {
    return edge !== undefined && pipeOk(world, placeId, edge)
  }
  if (s === undefined) return false
  return sprinklerOk(world, s)
}

export function clickHit(world: World, wx: number, wy: number, lens: Lens): MapClick | undefined {
  const place = world.seats[world.local].place
  if (place.kind === 'sku' && (place.id === 'buy-pipe' || place.id === 'buy-valve')) {
    const edge = nearestEdge(wx, wy)
    if (edge === undefined) return undefined
    return { kind: 'edge', edge }
  }
  if (place.kind === 'sku' && SPRINKLER_SKU.includes(place.id)) {
    const at = nearestVertex(wx, wy, SPRINKLER_HIT)
    if (at === undefined) return undefined
    return { kind: 'sprinkler', sprinkler: makeSprinkler(place, at) }
  }
  if (place.kind === 'delete') {
    const edge = nearestEdge(wx, wy)
    const at = nearestVertex(wx, wy, VERTEX_HIT)
    const del = deleteHit(world, edge, at, wx, wy)
    if (del?.kind === 'wire') return { kind: 'delete-wire', from: del.from, to: del.to }
    if (del?.kind === 'pipe') return { kind: 'delete-pipe', edge: del.edge }
    if (del?.kind === 'sprinkler') return { kind: 'delete-sprinkler', at: del.at }
    return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
  }
  const skuArmed = place.kind === 'sku' && (SENSOR_CELL_SKUS as readonly string[]).includes(place.id)
  if ((lens === 'sensors' || place.kind === 'wire') && !skuArmed) {
    const port = portHit(world, wx, wy)
    if (port !== undefined) return { kind: 'port', end: port }
  }
  if (place.kind === 'none') {
    const v = nearestVertex(wx, wy, VERTEX_HIT)
    if (v !== undefined && world.done.has('unlock-smart-irrigation') && world.sprinklerAt(v) !== undefined) {
      return { kind: 'sprinkler-hud', at: v }
    }
    const valve = valveHit(world, wx, wy)
    if (valve !== undefined) return { kind: 'valve', edge: valve }
    const cellAt = { col: Math.floor(wx), row: Math.floor(wy) }
    if (world.inWorld(cellAt)) {
      const c = world.cell(cellAt)
      if (c.kind === 'sensor-water') return { kind: 'water-hud', at: cellAt }
      if (c.kind === 'sensor-harvest') return { kind: 'harvest-hud', at: cellAt }
      if (c.kind === 'counter') return { kind: 'counter-hud', at: cellAt }
      if (c.kind === 'sensor-day') return { kind: 'day-hud', at: cellAt }
    }
  }
  const drop = dropHit(world, wx, wy)
  if (drop !== undefined) return { kind: 'cell', at: drop }
  return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
}

export function dropRect(at: { col: number; row: number }, i: number): { x: number; y: number; w: number; h: number } {
  const n = i % 4
  const s = DROP_FACE / TILE
  return {
    x: at.col + (DROP_INSET + (n % 2) * DROP_STEP) / TILE,
    y: at.row + (DROP_INSET + Math.floor(n / 2) * DROP_STEP) / TILE,
    w: s,
    h: s,
  }
}

export function dropHit(world: World, wx: number, wy: number): { col: number; row: number } | undefined {
  for (let i = world.drops.length - 1; i >= 0; i--) {
    const d = world.drops[i]
    let pack = 0
    for (let j = 0; j < i; j++) {
      const e = world.drops[j]
      if (e.at.col === d.at.col && e.at.row === d.at.row) pack += 1
    }
    const r = dropRect(d.at, pack)
    if (wx >= r.x && wy >= r.y && wx < r.x + r.w && wy < r.y + r.h) return d.at
  }
  return undefined
}

export function hoverSprinkler(world: World, wx: number, wy: number): Sprinkler | undefined {
  const v = nearestVertex(wx, wy, VERTEX_HIT)
  if (v === undefined) return undefined
  return world.sprinklerAt(v)
}
