import { SENSOR_CELL_SKUS, type SkuId } from '../sim/ids.ts'
import { aoe, edgeKey, type Edge, type Sprinkler, type Vertex } from '../sim/pipe.ts'
import {
  isSensor,
  nearestWire,
  portDevice,
  portXY,
  type WireEnd,
} from '../sim/sensor.ts'
import type { Place, World } from '../sim/world.ts'
import type { PromptHit } from '../sim/prompt.ts'

export type Lens = 'off' | 'water' | 'land' | 'ripe' | 'kind' | 'rarity' | 'pipes' | 'sensors' | 'vehicles'

export type MapClick = PromptHit

export const EDGE_HIT = 0.35
export const VERTEX_HIT = 0.3

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
  'buy-well',
  ...SENSOR_CELL_SKUS,
  'buy-smart-valve',
]

export const SPRINKLER_SKU: readonly SkuId[] = ['buy-sprinkler', 'buy-sprinkler-vert', 'buy-sprinkler-large']

export type DeleteTarget =
  | { kind: 'pipe'; edge: Edge }
  | { kind: 'well'; edge: Edge }
  | { kind: 'sprinkler'; at: Vertex }
  | { kind: 'smart'; edge: Edge }
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

export function nearestVertex(wx: number, wy: number): Vertex | undefined {
  const col = Math.round(wx)
  const row = Math.round(wy)
  if (Math.hypot(wx - col, wy - row) > VERTEX_HIT) return undefined
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
  if (end.kind === 'cell') return portXY(end, portDevice(world.cell(end.at)))
  return portXY(end)
}

function portHit(world: World, wx: number, wy: number): WireEnd | undefined {
  const at = { col: Math.floor(wx), row: Math.floor(wy) }
  if (world.inWorld(at)) {
    const c = world.cell(at)
    if (isSensor(c)) {
      const fx = wx - at.col
      const fy = wy - at.row
      if (c.kind === 'and' || c.kind === 'or') {
        if (fy > 0.65) return { kind: 'cell', at, port: 'out' }
        return { kind: 'cell', at, port: fx < 0.5 ? 'in-l' : 'in-r' }
      }
      if (c.kind === 'not' || c.kind === 'pulser' || c.kind === 'counter' || c.kind === 'lever' || c.kind === 'traffic-light') {
        return { kind: 'cell', at, port: fy < 0.5 ? 'in' : 'out' }
      }
      if (c.kind === 'lamp') return { kind: 'cell', at, port: 'in' }
      return { kind: 'cell', at, port: 'out' }
    }
    if (c.kind === 'mill' || c.kind === 'jam' || c.kind === 'still') {
      if (c.base.col === at.col && c.base.row === at.row) return { kind: 'cell', at, port: 'in' }
      return undefined
    }
    if (c.kind === 'chest' || c.kind === 'freezer' || c.kind === 'seed-silo' || c.kind === 'additive-store') {
      if (c.base.col === at.col && c.base.row === at.row) return { kind: 'cell', at, port: 'out' }
      return undefined
    }
  }
  const v = nearestVertex(wx, wy)
  if (v !== undefined && world.done.has('unlock-smart-irrigation') && world.sprinklerAt(v) !== undefined) {
    return { kind: 'sprinkler', at: v, port: 'in' }
  }
  const edge = nearestEdge(wx, wy)
  if (edge !== undefined && world.hasSmart(edge)) return { kind: 'valve', e: edge, port: 'in' }
  return undefined
}

export function wireSignal(world: World, from: WireEnd): boolean {
  if (from.kind !== 'cell') return false
  const c = world.cell(from.at)
  if (c.kind === 'lamp' || c.kind === 'mill' || c.kind === 'jam' || c.kind === 'still') return false
  if (isSensor(c) || c.kind === 'chest' || c.kind === 'freezer' || c.kind === 'seed-silo' || c.kind === 'additive-store') {
    return c.out === 1
  }
  return false
}

function valveHit(world: World, wx: number, wy: number): Edge | undefined {
  let best: { edge: Edge; d: number } | undefined = undefined
  world.segments.forEach(seg => {
    if (seg.gate.kind !== 'valve') return
    const mx = seg.at.axis === 'h' ? seg.at.col + 0.5 : seg.at.col
    const my = seg.at.axis === 'h' ? seg.at.row : seg.at.row + 0.5
    const d = Math.hypot(wx - mx, wy - my)
    if (d > VERTEX_HIT) return
    if (best === undefined || d < best.d) best = { edge: seg.at, d }
  })
  if (best === undefined) return undefined
  return (best as { edge: Edge; d: number }).edge
}

function smartHit(world: World, wx: number, wy: number): Edge | undefined {
  let best: { edge: Edge; d: number } | undefined = undefined
  world.segments.forEach(seg => {
    if (seg.gate.kind !== 'smart') return
    const mx = seg.at.axis === 'h' ? seg.at.col + 0.5 : seg.at.col
    const my = seg.at.axis === 'h' ? seg.at.row : seg.at.row + 0.5
    const d = Math.hypot(wx - mx, wy - my)
    if (d > VERTEX_HIT) return
    if (best === undefined || d < best.d) best = { edge: seg.at, d }
  })
  if (best === undefined) return undefined
  return (best as { edge: Edge; d: number }).edge
}

function wellHit(world: World, wx: number, wy: number): Edge | undefined {
  let best: { edge: Edge; d: number } | undefined = undefined
  world.wells.forEach(well => {
    const mx = well.at.axis === 'h' ? well.at.col + 0.5 : well.at.col
    const my = well.at.axis === 'h' ? well.at.row : well.at.row + 0.5
    const d = Math.hypot(wx - mx, wy - my)
    if (d > VERTEX_HIT) return
    if (best === undefined || d < best.d) best = { edge: well.at, d }
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
    if (world.hasWell(edge)) return { kind: 'well', edge }
    if (world.hasSmart(edge)) return { kind: 'smart', edge }
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
  if (placeId === 'buy-well' || placeId === 'buy-smart-valve') {
    return (
      edge !== undefined &&
      world.edgeOwned(edge) &&
      !world.hasPipe(edge) &&
      !world.hasWell(edge) &&
      !world.hasSmart(edge)
    )
  }
  if (s === undefined) return false
  return sprinklerOk(world, s)
}

export function clickHit(world: World, wx: number, wy: number, lens: Lens): MapClick | undefined {
  const place = world.seats[world.local].place
  if (place.kind === 'sku' && (place.id === 'buy-pipe' || place.id === 'buy-valve' || place.id === 'buy-well' || place.id === 'buy-smart-valve')) {
    const edge = nearestEdge(wx, wy)
    if (edge === undefined) return undefined
    return { kind: 'edge', edge }
  }
  if (place.kind === 'sku' && SPRINKLER_SKU.includes(place.id)) {
    const at = nearestVertex(wx, wy)
    if (at === undefined) return undefined
    return { kind: 'sprinkler', sprinkler: makeSprinkler(place, at) }
  }
  if (place.kind === 'delete') {
    const edge = nearestEdge(wx, wy)
    const at = nearestVertex(wx, wy)
    const del = deleteHit(world, edge, at, wx, wy)
    if (del?.kind === 'wire') return { kind: 'delete-wire', from: del.from, to: del.to }
    if (del?.kind === 'pipe') return { kind: 'delete-pipe', edge: del.edge }
    if (del?.kind === 'well') return { kind: 'delete-well', edge: del.edge }
    if (del?.kind === 'smart') return { kind: 'smart-valve', edge: del.edge }
    if (del?.kind === 'sprinkler') return { kind: 'delete-sprinkler', at: del.at }
    return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
  }
  const skuArmed = place.kind === 'sku' && (SENSOR_CELL_SKUS as readonly string[]).includes(place.id)
  if ((lens === 'sensors' || place.kind === 'wire') && !skuArmed) {
    const port = portHit(world, wx, wy)
    if (port !== undefined) return { kind: 'port', end: port }
  }
  if (place.kind === 'none') {
    const v = nearestVertex(wx, wy)
    if (v !== undefined && world.done.has('unlock-smart-irrigation') && world.sprinklerAt(v) !== undefined) {
      return { kind: 'sprinkler-hud', at: v }
    }
    const valve = valveHit(world, wx, wy)
    if (valve !== undefined) return { kind: 'valve', edge: valve }
    const smart = smartHit(world, wx, wy)
    if (smart !== undefined) return { kind: 'smart-valve', edge: smart }
    const well = wellHit(world, wx, wy)
    if (well !== undefined) return { kind: 'well', edge: well }
    const cellAt = { col: Math.floor(wx), row: Math.floor(wy) }
    if (world.inWorld(cellAt)) {
      const c = world.cell(cellAt)
      if (c.kind === 'sensor-water' && lens !== 'sensors') return { kind: 'water-hud', at: cellAt }
      if (c.kind === 'sensor-harvest' && lens !== 'sensors') return { kind: 'harvest-hud', at: cellAt }
      if (c.kind === 'counter' && lens !== 'sensors') return { kind: 'counter-hud', at: cellAt }
      if (c.kind === 'sensor-day' && lens !== 'sensors') return { kind: 'day-hud', at: cellAt }
    }
  }
  return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
}

export function hoverSprinkler(world: World, wx: number, wy: number): Sprinkler | undefined {
  const v = nearestVertex(wx, wy)
  if (v === undefined) return undefined
  return world.sprinklerAt(v)
}
