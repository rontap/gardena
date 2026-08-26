import { BUTTON_PULSE, SENSOR_HOLD } from '../defs/items.ts'
import type { AdditiveStore, Chest, Coord, Freezer, JamMachine, Mill, PotStill, RectBase, SeedSilo } from './building.ts'
import type { DayPhase } from './clock.ts'
import type { SensorKind, Signal } from './ids.ts'
import type { Modifier } from './modifiers.ts'
import { edgeKey, vertexKey, type Edge, type Sprinkler, type Vertex } from './pipe.ts'
import type { Cell } from './plot.ts'
import { fertBand, waterBand } from './soil.ts'
import type { Vehicle } from './vehicle.ts'

export type PortId = 'out' | 'in' | 'in-l' | 'in-r'

export type WireEnd =
  | { kind: 'cell'; at: Coord; port: PortId }
  | { kind: 'sprinkler'; at: Vertex; port: 'in' }
  | { kind: 'valve'; e: Edge; port: 'in' }

export type Wire = { from: WireEnd; to: WireEnd }

export class Lever {
  readonly kind = 'lever' as const
  readonly base: RectBase
  on: boolean
  inn: Signal
  prev: Signal
  out: Signal
  constructor(base: RectBase) {
    this.base = base
    this.on = false
    this.inn = 0
    this.prev = 0
    this.out = 0
  }
}

export class Button {
  readonly kind = 'button' as const
  readonly base: RectBase
  left: number
  out: Signal
  constructor(base: RectBase) {
    this.base = base
    this.left = 0
    this.out = 0
  }
}

export class Lamp {
  readonly kind = 'lamp' as const
  readonly base: RectBase
  inn: Signal
  constructor(base: RectBase) {
    this.base = base
    this.inn = 0
  }
}

export class NotGate {
  readonly kind = 'not' as const
  readonly base: RectBase
  out: Signal
  constructor(base: RectBase) {
    this.base = base
    this.out = 0
  }
}

export class AndGate {
  readonly kind = 'and' as const
  readonly base: RectBase
  out: Signal
  constructor(base: RectBase) {
    this.base = base
    this.out = 0
  }
}

export class OrGate {
  readonly kind = 'or' as const
  readonly base: RectBase
  out: Signal
  constructor(base: RectBase) {
    this.base = base
    this.out = 0
  }
}

export class Pulser {
  readonly kind = 'pulser' as const
  readonly base: RectBase
  inn: Signal
  prev: Signal
  out: Signal
  constructor(base: RectBase) {
    this.base = base
    this.inn = 0
    this.prev = 0
    this.out = 0
  }
}

export class Counter {
  readonly kind = 'counter' as const
  readonly base: RectBase
  inn: Signal
  n: number
  count: number
  out: Signal
  constructor(base: RectBase) {
    this.base = base
    this.inn = 0
    this.n = 1
    this.count = 0
    this.out = 0
  }
}

export class WaterSensor {
  readonly kind = 'sensor-water' as const
  readonly base: RectBase
  wilt: boolean
  over: boolean
  out: Signal
  hold: number
  constructor(base: RectBase) {
    this.base = base
    this.wilt = true
    this.over = true
    this.out = 0
    this.hold = 0
  }
}

export class FertSensor {
  readonly kind = 'sensor-fert' as const
  readonly base: RectBase
  out: Signal
  hold: number
  constructor(base: RectBase) {
    this.base = base
    this.out = 0
    this.hold = 0
  }
}

export class HarvestSensor {
  readonly kind = 'sensor-harvest' as const
  readonly base: RectBase
  mode: 'any' | 'all'
  out: Signal
  hold: number
  constructor(base: RectBase) {
    this.base = base
    this.mode = 'any'
    this.out = 0
    this.hold = 0
  }
}

export class DaySensor {
  readonly kind = 'sensor-day' as const
  readonly base: RectBase
  sunrise: boolean
  day: boolean
  sunset: boolean
  twilight: boolean
  out: Signal
  hold: number
  constructor(base: RectBase) {
    this.base = base
    this.sunrise = false
    this.day = true
    this.sunset = false
    this.twilight = false
    this.out = 0
    this.hold = 0
  }
}

export class WaterSystem {
  readonly kind = 'water-system' as const
  readonly base: RectBase
  out: Signal
  hold: number
  constructor(base: RectBase) {
    this.base = base
    this.out = 0
    this.hold = 0
  }
}

export class VehicleSensor {
  readonly kind = 'vehicle-detector' as const
  readonly base: RectBase
  out: Signal
  hold: number
  constructor(base: RectBase) {
    this.base = base
    this.out = 0
    this.hold = 0
  }
}

export class TrafficLight {
  readonly kind = 'traffic-light' as const
  readonly base: RectBase
  inn: Signal
  out: Signal
  hold: number
  constructor(base: RectBase) {
    this.base = base
    this.inn = 0
    this.out = 0
    this.hold = 0
  }
}

export type Sensor =
  | Lever
  | Button
  | Lamp
  | NotGate
  | AndGate
  | OrGate
  | Pulser
  | Counter
  | WaterSensor
  | FertSensor
  | HarvestSensor
  | DaySensor
  | WaterSystem
  | VehicleSensor
  | TrafficLight

export type SmartHold = { e: Edge; level: Signal; hold: number }

const OUT_KINDS: ReadonlySet<SensorKind> = new Set([
  'lever',
  'button',
  'or',
  'and',
  'not',
  'pulser',
  'counter',
  'sensor-water',
  'sensor-fert',
  'sensor-harvest',
  'sensor-day',
  'water-system',
  'vehicle-detector',
  'traffic-light',
])

export function isSensorKind(k: string): k is SensorKind {
  return OUT_KINDS.has(k as SensorKind) || k === 'lamp'
}

export function isSensor(c: { kind: string }): c is Sensor {
  return isSensorKind(c.kind)
}

export function ownsPort(c: Cell, at: Coord, port: PortId): boolean {
  if (c.kind === 'mill' || c.kind === 'jam' || c.kind === 'still') {
    return port === 'in' && c.base.col === at.col && c.base.row === at.row
  }
  if (c.kind === 'chest' || c.kind === 'freezer' || c.kind === 'seed-silo' || c.kind === 'additive-store') {
    return port === 'out' && c.base.col === at.col && c.base.row === at.row
  }
  if (!isSensor(c)) return false
  if (c.kind === 'lamp') return port === 'in'
  if (c.kind === 'not' || c.kind === 'pulser' || c.kind === 'counter' || c.kind === 'lever' || c.kind === 'traffic-light') {
    return port === 'in' || port === 'out'
  }
  if (c.kind === 'and' || c.kind === 'or') return port === 'in-l' || port === 'in-r' || port === 'out'
  return port === 'out'
}

export function isOutEnd(end: WireEnd, cell: Cell | undefined): boolean {
  if (end.kind !== 'cell') return false
  if (cell === undefined) return false
  return ownsPort(cell, end.at, end.port) && end.port === 'out'
}

export function isInEnd(end: WireEnd, cell: Cell | undefined, smart: boolean, sprinklerOk: boolean): boolean {
  if (end.kind === 'sprinkler') return sprinklerOk && end.port === 'in'
  if (end.kind === 'valve') return smart && end.port === 'in'
  if (cell === undefined) return false
  return ownsPort(cell, end.at, end.port) && end.port !== 'out'
}

export type PortDevice =
  | SensorKind
  | 'mill'
  | 'jam'
  | 'still'
  | 'chest'
  | 'freezer'
  | 'seed-silo'
  | 'additive-store'

export function portDevice(c: Cell): PortDevice {
  if (
    isSensor(c) ||
    c.kind === 'mill' ||
    c.kind === 'jam' ||
    c.kind === 'still' ||
    c.kind === 'chest' ||
    c.kind === 'freezer' ||
    c.kind === 'seed-silo' ||
    c.kind === 'additive-store'
  ) {
    return c.kind
  }
  throw new Error('port')
}

export type Raw = { get(k: string): Signal }

export function rawMap(m: ReadonlyMap<string, Signal>): Raw {
  return {
    get(k: string): Signal {
      const v = m.get(k)
      if (v === undefined) throw new Error('raw')
      return v
    },
  }
}

export function storeRaw(c: Chest | Freezer | SeedSilo | AdditiveStore): Signal {
  if (c.kind === 'chest' || c.kind === 'freezer') return c.slots.every(s => s.kind !== 'empty') ? 1 : 0
  return c.used >= c.cap ? 1 : 0
}

export function endKey(e: WireEnd): string {
  if (e.kind === 'cell') return `c:${e.at.col},${e.at.row}:${e.port}`
  if (e.kind === 'sprinkler') return `s:${e.at.col},${e.at.row}:${e.port}`
  return `v:${e.e.axis}:${e.e.col},${e.e.row}:${e.port}`
}

export function sameEnd(a: WireEnd, b: WireEnd): boolean {
  return endKey(a) === endKey(b)
}

export function nodeKey(e: WireEnd): string {
  if (e.kind === 'cell') return `c:${e.at.col},${e.at.row}`
  if (e.kind === 'sprinkler') return `s:${e.at.col},${e.at.row}`
  return `v:${e.e.axis}:${e.e.col},${e.e.row}`
}

export function sameNode(a: WireEnd, b: WireEnd): boolean {
  return nodeKey(a) === nodeKey(b)
}

export function cellKey(at: Coord): string {
  return `${at.col},${at.row}`
}

export function area3(at: Coord): Coord[] {
  return [-1, 0, 1].flatMap(dr => [-1, 0, 1].map(dc => ({ col: at.col + dc, row: at.row + dr })))
}

export function readerRaw(
  s: WaterSensor | FertSensor | HarvestSensor,
  cellAt: (at: Coord) => Cell | undefined,
  mods: readonly Modifier[],
): Signal {
  const origin = { col: s.base.col, row: s.base.row }
  const around = area3(origin).flatMap(at => {
    if (at.col === origin.col && at.row === origin.row) return []
    const c = cellAt(at)
    if (c === undefined) return []
    if (c.kind === 'tree') return []
    return [c]
  })
  if (s.kind === 'sensor-water') {
    if (!s.wilt && !s.over) return 0
    return around.some(c => {
      if (c.kind !== 'growing') return false
      if (waterBand(c.soil.water, c.plant.stats(mods).waterTolerance) !== 'red') return false
      return c.soil.drowning ? s.over : s.wilt
    })
      ? 1
      : 0
  }
  if (s.kind === 'sensor-fert') {
    return around.some(
      c => c.kind === 'growing' && fertBand(c.soil.fertilizer, c.plant.stats(mods).fertTolerance) === 'red',
    )
      ? 1
      : 0
  }
  const crop = around.filter(c => c.kind === 'growing' || c.kind === 'ripe')
  if (s.mode === 'any') return crop.some(c => c.kind === 'ripe') ? 1 : 0
  if (crop.length === 0) return 0
  return crop.every(c => c.kind === 'ripe') ? 1 : 0
}

export function dayRaw(s: DaySensor, phase: DayPhase): Signal {
  if (phase === 'sunrise') return s.sunrise ? 1 : 0
  if (phase === 'day') return s.day ? 1 : 0
  if (phase === 'sunset') return s.sunset ? 1 : 0
  return s.twilight ? 1 : 0
}

export type CounterDial = 's0' | 's1' | 's2' | 's3' | 's4'

export function counterDial(c: Counter): CounterDial {
  if (c.out === 1) return 's4'
  const pct = c.count / c.n
  if (pct === 0) return 's0'
  if (pct < 0.25) return 's1'
  if (pct < 0.5) return 's2'
  if (pct < 0.75) return 's3'
  return 's4'
}

export function vehicleRaw(at: Coord, vehicles: readonly Vehicle[]): Signal {
  return vehicles.some(
    v => v.pose.kind === 'field' && Math.floor(v.pose.x) === at.col && Math.floor(v.pose.y) === at.row,
  )
    ? 1
    : 0
}

export function stepHold(cur: Signal, hold: number, raw: Signal): { out: Signal; hold: number } {
  if (hold > 0) {
    const left = hold - 1
    if (left > 0) return { out: cur, hold: left }
    return { out: raw, hold: 0 }
  }
  if (raw === cur) return { out: cur, hold: 0 }
  return { out: raw, hold: SENSOR_HOLD }
}

export function tickButton(b: Button): void {
  if (b.left === 0) {
    b.out = 0
    return
  }
  b.left -= 1
  b.out = b.left > 0 ? 1 : 0
}

export function pressButton(b: Button): void {
  b.left = BUTTON_PULSE
  b.out = 1
}

export function flipLever(l: Lever): void {
  l.on = !l.on
  l.out = l.on ? 1 : 0
}

export function pourEligible(wired: boolean, inn: Signal): boolean {
  if (!wired) return true
  return inn === 1
}

export function isSeqIn(end: WireEnd, cell: Cell | undefined): boolean {
  if (end.kind !== 'cell' || end.port !== 'in') return false
  if (cell === undefined) return false
  return cell.kind === 'lever' || cell.kind === 'pulser' || cell.kind === 'counter' || cell.kind === 'traffic-light'
}

export function wouldCycle(
  wires: readonly Wire[],
  from: WireEnd,
  to: WireEnd,
  isSeqIn: (end: WireEnd) => boolean,
): boolean {
  if (isSeqIn(to)) return false
  if (nodeKey(from) === nodeKey(to)) return true
  const adj = new Map<string, string[]>()
  wires.forEach(w => {
    if (isSeqIn(w.to)) return
    const a = nodeKey(w.from)
    const b = nodeKey(w.to)
    const list = adj.get(a)
    if (list === undefined) adj.set(a, [b])
    else list.push(b)
  })
  const start = nodeKey(to)
  const goal = nodeKey(from)
  const seen = new Set<string>()
  const stack = [start]
  while (stack.length > 0) {
    const cur = stack.pop() as string
    if (cur === goal) return true
    if (seen.has(cur)) continue
    seen.add(cur)
    const next = adj.get(cur)
    if (next === undefined) continue
    next.forEach(n => {
      if (!seen.has(n)) stack.push(n)
    })
  }
  return false
}

function as01(n: number): Signal {
  return n === 0 ? 0 : 1
}

export type EvalIn = {
  sensors: ReadonlyMap<string, Sensor>
  wires: readonly Wire[]
  smart: Map<string, SmartHold>
  sprinklers: ReadonlyMap<string, Sprinkler>
  raw: Raw
  machines: ReadonlyMap<string, Mill | JamMachine | PotStill>
  stores: ReadonlyMap<string, Chest | Freezer | SeedSilo | AdditiveStore>
}

export function evalDag(input: EvalIn): void {
  const { sensors, wires, smart, sprinklers, raw, machines, stores } = input
  const byTo = new Map<string, Wire[]>()
  wires.forEach(w => {
    const k = endKey(w.to)
    const list = byTo.get(k)
    if (list === undefined) byTo.set(k, [w])
    else list.push(w)
  })
  const orTo = (k: string): Signal => {
    const list = byTo.get(k)
    if (list === undefined) return 0
    return list.some(w => outOf(w.from) === 1) ? 1 : 0
  }
  const innOf = (at: Coord, port: PortId): Signal => orTo(endKey({ kind: 'cell', at, port }))
  const outOf = (from: WireEnd): Signal => {
    if (from.kind === 'cell') {
      const s = sensors.get(cellKey(from.at))
      if (s !== undefined) {
        if (s.kind === 'lamp') throw new Error('out')
        return s.out
      }
      const store = stores.get(cellKey(from.at))
      if (store === undefined) throw new Error('out')
      return store.out
    }
    if (from.kind === 'sprinkler') {
      const s = sprinklers.get(vertexKey(from.at))
      if (s === undefined) throw new Error('out')
      return s.inn
    }
    const h = smart.get(edgeKey(from.e))
    if (h === undefined) throw new Error('out')
    return h.level
  }
  sensors.forEach(s => {
    if (
      s.kind === 'sensor-water' ||
      s.kind === 'sensor-fert' ||
      s.kind === 'sensor-harvest' ||
      s.kind === 'sensor-day' ||
      s.kind === 'water-system' ||
      s.kind === 'vehicle-detector'
    ) {
      const r = raw.get(cellKey({ col: s.base.col, row: s.base.row }))
      const next = stepHold(s.out, s.hold, r)
      s.out = next.out
      s.hold = next.hold
    }
  })
  stores.forEach((s, k) => {
    const r = raw.get(k)
    const next = stepHold(s.out, s.hold, r)
    s.out = next.out
    s.hold = next.hold
  })
  const nodes: string[] = []
  sensors.forEach((s, k) => {
    if (s.kind === 'not' || s.kind === 'and' || s.kind === 'or' || s.kind === 'lamp') nodes.push(k)
  })
  const indeg = new Map<string, number>()
  const adj = new Map<string, string[]>()
  nodes.forEach(k => {
    indeg.set(k, 0)
    adj.set(k, [])
  })
  wires.forEach(w => {
    if (w.from.kind !== 'cell' || w.to.kind !== 'cell') return
    const a = cellKey(w.from.at)
    const b = cellKey(w.to.at)
    if (!indeg.has(a) || !indeg.has(b)) return
    const list = adj.get(a)
    if (list !== undefined) list.push(b)
    indeg.set(b, (indeg.get(b) as number) + 1)
  })
  const q: string[] = []
  indeg.forEach((n, k) => {
    if (n === 0) q.push(k)
  })
  const order: string[] = []
  while (q.length > 0) {
    const k = q.shift() as string
    order.push(k)
    const next = adj.get(k)
    if (next === undefined) continue
    next.forEach(b => {
      const d = (indeg.get(b) as number) - 1
      indeg.set(b, d)
      if (d === 0) q.push(b)
    })
  }
  order.forEach(k => {
    const s = sensors.get(k)
    if (s === undefined) return
    const at = { col: s.base.col, row: s.base.row }
    if (s.kind === 'lamp') s.inn = innOf(at, 'in')
    else if (s.kind === 'not') s.out = as01(1 - innOf(at, 'in'))
    else if (s.kind === 'and') s.out = innOf(at, 'in-l') === 1 && innOf(at, 'in-r') === 1 ? 1 : 0
    else if (s.kind === 'or') s.out = innOf(at, 'in-l') === 1 || innOf(at, 'in-r') === 1 ? 1 : 0
  })
  machines.forEach(m => {
    m.inn = innOf({ col: m.base.col, row: m.base.row }, 'in')
  })
  sensors.forEach(s => {
    if (s.kind === 'traffic-light') s.inn = innOf({ col: s.base.col, row: s.base.row }, 'in')
  })
  sensors.forEach(s => {
    if (s.kind === 'pulser' || s.kind === 'counter' || s.kind === 'lever') {
      s.inn = innOf({ col: s.base.col, row: s.base.row }, 'in')
    }
  })
  sensors.forEach(s => {
    if (s.kind === 'pulser') {
      s.out = s.prev === 0 && s.inn === 1 ? 1 : 0
      s.prev = s.inn
    } else if (s.kind === 'counter') {
      if (s.inn === 1) s.count += 1
      if (s.count >= s.n) {
        s.out = 1
        s.count = 0
      } else s.out = 0
    } else if (s.kind === 'lever') {
      if (s.prev === 0 && s.inn === 1) s.on = !s.on
      s.prev = s.inn
      s.out = s.on ? 1 : 0
    }
  })
  smart.forEach(h => {
    const inn = orTo(endKey({ kind: 'valve', e: h.e, port: 'in' }))
    const next = stepHold(h.level, h.hold, inn)
    h.level = next.out
    h.hold = next.hold
  })
  sprinklers.forEach(s => {
    const inn = orTo(endKey({ kind: 'sprinkler', at: s.at, port: 'in' }))
    const next = stepHold(s.inn, s.hold, inn)
    s.inn = next.out
    s.hold = next.hold
  })
}

export function dropIncident(wires: Wire[], gone: (w: Wire) => boolean): Wire[] {
  return wires.filter(w => !gone(w))
}

export function hitsCell(end: WireEnd, at: Coord): boolean {
  return end.kind === 'cell' && end.at.col === at.col && end.at.row === at.row
}

export function hitsVertex(end: WireEnd, at: Vertex): boolean {
  return end.kind === 'sprinkler' && end.at.col === at.col && end.at.row === at.row
}

export function hitsEdge(end: WireEnd, e: Edge): boolean {
  return end.kind === 'valve' && end.e.axis === e.axis && end.e.col === e.col && end.e.row === e.row
}

export function portXY(end: WireEnd, kind?: PortDevice): { x: number; y: number } {
  if (end.kind === 'sprinkler') return { x: end.at.col, y: end.at.row }
  if (end.kind === 'valve') {
    if (end.e.axis === 'h') return { x: end.e.col + 0.5, y: end.e.row }
    return { x: end.e.col, y: end.e.row + 0.5 }
  }
  const { col, row } = end.at
  if (end.port === 'out') return { x: col + 0.5, y: row + 1 }
  if (end.port === 'in-l') return { x: col, y: row + 0.5 }
  if (end.port === 'in-r') return { x: col + 1, y: row + 0.5 }
  if (
    kind === 'not' ||
    kind === 'lamp' ||
    kind === 'mill' ||
    kind === 'jam' ||
    kind === 'still' ||
    kind === 'pulser' ||
    kind === 'counter' ||
    kind === 'lever' ||
    kind === 'traffic-light'
  ) {
    return { x: col + 0.5, y: row }
  }
  return { x: col + 0.5, y: row + 0.5 }
}

function cube(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
}

export function wirePoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const { c1, c2 } = wireControls(from, to)
  return { x: cube(from.x, c1.x, c2.x, to.x, t), y: cube(from.y, c1.y, c2.y, to.y, t) }
}

export function wireControls(from: { x: number; y: number }, to: { x: number; y: number }): { c1: { x: number; y: number }; c2: { x: number; y: number } } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  return {
    c1: { x: from.x + dx * 0.35, y: from.y + dy * 0.12 + 0.16 },
    c2: { x: to.x - dx * 0.35, y: to.y - dy * 0.12 + 0.16 },
  }
}

export function nearestWire(
  wires: readonly Wire[],
  x: number,
  y: number,
  xy: (end: WireEnd) => { x: number; y: number },
  hit: number,
): Wire | undefined {
  let best: Wire | undefined
  let bestD = hit
  wires.forEach(w => {
    const a = xy(w.from)
    const b = xy(w.to)
    for (let i = 0; i <= 16; i++) {
      const p = wirePoint(a, b, i / 16)
      const d = Math.hypot(p.x - x, p.y - y)
      if (d < bestD) {
        bestD = d
        best = w
      }
    }
  })
  return best
}

export function makeSensor(id: SensorKind, base: RectBase): Sensor {
  switch (id) {
    case 'lever':
      return new Lever(base)
    case 'button':
      return new Button(base)
    case 'lamp':
      return new Lamp(base)
    case 'not':
      return new NotGate(base)
    case 'and':
      return new AndGate(base)
    case 'or':
      return new OrGate(base)
    case 'pulser':
      return new Pulser(base)
    case 'counter':
      return new Counter(base)
    case 'sensor-water':
      return new WaterSensor(base)
    case 'sensor-fert':
      return new FertSensor(base)
    case 'sensor-harvest':
      return new HarvestSensor(base)
    case 'sensor-day':
      return new DaySensor(base)
    case 'water-system':
      return new WaterSystem(base)
    case 'vehicle-detector':
      return new VehicleSensor(base)
    case 'traffic-light':
      return new TrafficLight(base)
  }
}

export function skuKind(id: string): SensorKind | undefined {
  if (id === 'buy-lever') return 'lever'
  if (id === 'buy-button') return 'button'
  if (id === 'buy-lamp') return 'lamp'
  if (id === 'buy-or') return 'or'
  if (id === 'buy-and') return 'and'
  if (id === 'buy-not') return 'not'
  if (id === 'buy-pulser') return 'pulser'
  if (id === 'buy-counter') return 'counter'
  if (id === 'buy-sensor-water') return 'sensor-water'
  if (id === 'buy-sensor-fert') return 'sensor-fert'
  if (id === 'buy-sensor-harvest') return 'sensor-harvest'
  if (id === 'buy-sensor-day') return 'sensor-day'
  if (id === 'buy-water-system') return 'water-system'
  if (id === 'buy-vehicle-detector') return 'vehicle-detector'
  if (id === 'buy-traffic-light') return 'traffic-light'
  return undefined
}
