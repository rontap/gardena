import { BUTTON_PULSE, SENSOR_HOLD } from '../defs/items.ts'
import type { AdditiveStore, Chest, Coord, Freezer, Furnace, JamMachine, Mill, PotStill, RectBase, ResearchStation, SeedSilo } from './building.ts'
import type { DayPhase } from './clock.ts'
import type { SensorKind, Signal, SkuId } from './ids.ts'
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

abstract class SensorBase {
  readonly base: RectBase
  readonly ports: readonly PortId[] = []
  constructor(base: RectBase) {
    this.base = base
  }
}

abstract class HeldSensor extends SensorBase {
  out: Signal = 0
  hold = 0
  eval(raw: Signal): void {
    const next = stepHold(this.out, this.hold, raw)
    this.out = next.out
    this.hold = next.hold
  }
}

export class Lever extends SensorBase {
  readonly kind = 'lever' as const
  override readonly ports: readonly PortId[] = ['in', 'out']
  on = false
  inn: Signal = 0
  prev: Signal = 0
  out: Signal = 0
  sample(inn: Signal): void {
    this.inn = inn
  }
  eval(): void {
    if (this.prev === 0 && this.inn === 1) this.on = !this.on
    this.prev = this.inn
    this.out = this.on ? 1 : 0
  }
}

export class Button extends SensorBase {
  readonly kind = 'button' as const
  override readonly ports: readonly PortId[] = ['out']
  left = 0
  out: Signal = 0
}

export class Lamp extends SensorBase {
  readonly kind = 'lamp' as const
  override readonly ports: readonly PortId[] = ['in']
  inn: Signal = 0
  eval(inn: Signal): void {
    this.inn = inn
  }
}

export class NotGate extends SensorBase {
  readonly kind = 'not' as const
  override readonly ports: readonly PortId[] = ['in', 'out']
  out: Signal = 0
  eval(inn: Signal): void {
    this.out = inn === 1 ? 0 : 1
  }
}

export class AndGate extends SensorBase {
  readonly kind = 'and' as const
  override readonly ports: readonly PortId[] = ['in-l', 'in-r', 'out']
  out: Signal = 0
  eval(l: Signal, r: Signal): void {
    this.out = l === 1 && r === 1 ? 1 : 0
  }
}

export class OrGate extends SensorBase {
  readonly kind = 'or' as const
  override readonly ports: readonly PortId[] = ['in-l', 'in-r', 'out']
  out: Signal = 0
  eval(l: Signal, r: Signal): void {
    this.out = l === 1 || r === 1 ? 1 : 0
  }
}

export class Pulser extends SensorBase {
  readonly kind = 'pulser' as const
  override readonly ports: readonly PortId[] = ['in', 'out']
  inn: Signal = 0
  prev: Signal = 0
  out: Signal = 0
  sample(inn: Signal): void {
    this.inn = inn
  }
  eval(): void {
    this.out = this.prev === 0 && this.inn === 1 ? 1 : 0
    this.prev = this.inn
  }
}

export class Counter extends SensorBase {
  readonly kind = 'counter' as const
  override readonly ports: readonly PortId[] = ['in', 'out']
  inn: Signal = 0
  n = 1
  count = 0
  out: Signal = 0
  sample(inn: Signal): void {
    this.inn = inn
  }
  eval(): void {
    if (this.inn === 1) this.count += 1
    if (this.count >= this.n) {
      this.out = 1
      this.count = 0
    } else this.out = 0
  }
}

export class WaterSensor extends HeldSensor {
  readonly kind = 'sensor-water' as const
  override readonly ports: readonly PortId[] = ['out']
  wilt = true
  over = true
}

export class FertSensor extends HeldSensor {
  readonly kind = 'sensor-fert' as const
  override readonly ports: readonly PortId[] = ['out']
}

export class HarvestSensor extends HeldSensor {
  readonly kind = 'sensor-harvest' as const
  override readonly ports: readonly PortId[] = ['out']
  mode: 'any' | 'all' = 'any'
}

export class DaySensor extends HeldSensor {
  readonly kind = 'sensor-day' as const
  override readonly ports: readonly PortId[] = ['out']
  sunrise = false
  day = true
  sunset = false
  twilight = false
}

export class WaterSystem extends HeldSensor {
  readonly kind = 'water-system' as const
  override readonly ports: readonly PortId[] = ['out']
}

export class VehicleSensor extends HeldSensor {
  readonly kind = 'vehicle-detector' as const
  override readonly ports: readonly PortId[] = ['out']
}

export class TrafficLight extends HeldSensor {
  readonly kind = 'traffic-light' as const
  override readonly ports: readonly PortId[] = ['in', 'out']
  inn: Signal = 0
  sample(inn: Signal): void {
    this.inn = inn
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

const MAKE: { [K in SensorKind]: { sku: SkuId; make: (base: RectBase) => Sensor } } = {
  lever: { sku: 'buy-lever', make: base => new Lever(base) },
  button: { sku: 'buy-button', make: base => new Button(base) },
  lamp: { sku: 'buy-lamp', make: base => new Lamp(base) },
  or: { sku: 'buy-or', make: base => new OrGate(base) },
  and: { sku: 'buy-and', make: base => new AndGate(base) },
  not: { sku: 'buy-not', make: base => new NotGate(base) },
  pulser: { sku: 'buy-pulser', make: base => new Pulser(base) },
  counter: { sku: 'buy-counter', make: base => new Counter(base) },
  'sensor-water': { sku: 'buy-sensor-water', make: base => new WaterSensor(base) },
  'sensor-fert': { sku: 'buy-sensor-fert', make: base => new FertSensor(base) },
  'sensor-harvest': { sku: 'buy-sensor-harvest', make: base => new HarvestSensor(base) },
  'sensor-day': { sku: 'buy-sensor-day', make: base => new DaySensor(base) },
  'water-system': { sku: 'buy-water-system', make: base => new WaterSystem(base) },
  'vehicle-detector': { sku: 'buy-vehicle-detector', make: base => new VehicleSensor(base) },
  'traffic-light': { sku: 'buy-traffic-light', make: base => new TrafficLight(base) },
}

export type ValveHold = { e: Edge; level: Signal; hold: number }

export function isSensorKind(k: string): k is SensorKind {
  return k in MAKE
}

export function isSensor(c: { kind: string }): c is Sensor {
  return isSensorKind(c.kind)
}

export function ownsPort(c: Cell, at: Coord, port: PortId): boolean {
  if (isSensor(c)) return c.base.col === at.col && c.base.row === at.row && c.ports.includes(port)
  if ('ports' in c) {
    return c.base.col === at.col && c.base.row === at.row && c.ports.some(p => p === port)
  }
  return false
}

export function isOutEnd(end: WireEnd, cell: Cell | undefined): boolean {
  if (end.kind !== 'cell') return false
  if (cell === undefined) return false
  return ownsPort(cell, end.at, end.port) && end.port === 'out'
}

export function isInEnd(end: WireEnd, cell: Cell | undefined, valveOk: boolean, sprinklerOk: boolean): boolean {
  if (end.kind === 'sprinkler') return sprinklerOk && end.port === 'in'
  if (end.kind === 'valve') return valveOk && end.port === 'in'
  if (cell === undefined) return false
  return ownsPort(cell, end.at, end.port) && end.port !== 'out'
}

export type PortDevice =
  | SensorKind
  | 'mill'
  | 'jam'
  | 'still'
  | 'furnace'
  | 'station'
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
    c.kind === 'furnace' ||
    c.kind === 'station' ||
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

export function storeRaw(c: Chest | Freezer | SeedSilo | AdditiveStore | Furnace): Signal {
  if (c.kind === 'furnace') return c.units === 0 ? 1 : 0
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

export type EvalIn = {
  sensors: ReadonlyMap<string, Sensor>
  wires: readonly Wire[]
  valves: Map<string, ValveHold>
  sprinklers: ReadonlyMap<string, Sprinkler>
  raw: Raw
  machines: ReadonlyMap<string, Mill | JamMachine | PotStill | Furnace | ResearchStation>
  stores: ReadonlyMap<string, Chest | Freezer | SeedSilo | AdditiveStore | Furnace>
}

export function evalDag(input: EvalIn): void {
  const { sensors, wires, valves, sprinklers, raw, machines, stores } = input
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
    const h = valves.get(edgeKey(from.e))
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
      s.eval(raw.get(cellKey({ col: s.base.col, row: s.base.row })))
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
    if (s.kind === 'lamp' || s.kind === 'not') s.eval(innOf(at, 'in'))
    else if (s.kind === 'and' || s.kind === 'or') s.eval(innOf(at, 'in-l'), innOf(at, 'in-r'))
  })
  machines.forEach(m => {
    m.inn = innOf({ col: m.base.col, row: m.base.row }, 'in')
  })
  sensors.forEach(s => {
    if (s.kind === 'traffic-light') s.sample(innOf({ col: s.base.col, row: s.base.row }, 'in'))
  })
  sensors.forEach(s => {
    if (s.kind === 'pulser' || s.kind === 'counter' || s.kind === 'lever') {
      s.sample(innOf({ col: s.base.col, row: s.base.row }, 'in'))
    }
  })
  sensors.forEach(s => {
    if (s.kind === 'pulser' || s.kind === 'counter' || s.kind === 'lever') s.eval()
  })
  valves.forEach(h => {
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
    kind === 'furnace' ||
    kind === 'station' ||
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
  return MAKE[id].make(base)
}

export function skuKind(id: string): SensorKind | undefined {
  return (Object.keys(MAKE) as SensorKind[]).find(k => MAKE[k].sku === id)
}
