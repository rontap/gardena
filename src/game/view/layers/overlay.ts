import { Container, Graphics, Text } from 'pixi.js'
import { FADE, chunkKey, chunkOf } from '../../sim/building.ts'
import { hangarPad, siloPad, stopXY } from '../../sim/feature-vehicles/vehicle.ts'
import { isTilled, type Cell } from '../../sim/plot.ts'
import { occupiedCells } from '../../sim/building.ts'
import { aoe, corners, edgeKey, incident, vertexKey, vertsOf, type Edge, type Vertex } from '../../sim/pipe.ts'
import { area3, isSensor, ownsPort, portDevice, portXY, sameEnd, wireControls, type PortId, type WireEnd } from '../../sim/sensor.ts'
import { CROPS, tolerance } from '../../defs/crops.ts'
import { fertBand, waterBand, SOIL_WATER_MID, type Band, type Soil } from '../../sim/soil.ts'
import { goodness } from '../../sim/noise.ts'
import type { CropId } from '../../sim/ids.ts'
import { VARIETY, type VarietyId, type VarietyTier } from '../../defs/varieties.ts'
import type { Place, World } from '../../sim/world.ts'
import { TILE } from '../camera.ts'
import { atlasTex } from '../atlas.ts'
import { SpritePool } from '../app.ts'
import { AOE_WASH, PIPE_PLACE, PORT_HIT, pipesOverlay, wireEndXY, wireSignal, type Lens } from '../hit.ts'
import type { Sprinkler } from '../../sim/pipe.ts'

const ROOF = 0x8b3a2a
const LEAF = 0x6bc04a
const WATER = 0x3d7ea6
const GRAPE = 0x6b1f8c
const RIPE = 0xd4a017
const INK = 0x1c1710
const LATTICE_ALPHA = 0.16
const FLOW_DASH = 1.1
const DASH = 7
const WASH = 0xcfc6b0
const LENS_BAD = 0xe23b2e
const LENS_MID = 0xd4a017
const LENS_GOOD = 0x2fd15a
const LENS_DONE = 0x1e9be6
const FRUIT_RED = 0xc43c3c
const GROUND_CHUNK = 16

const BAND_TINT: { readonly [K in Band]: number } = {
  green: LENS_GOOD,
  orange: LENS_MID,
  red: LENS_BAD,
}

const PORTS: readonly PortId[] = ['out', 'in', 'in-l', 'in-r']

function plantBands(crop: CropId, tier: VarietyTier, soil: Soil): { water: Band; fert: Band } {
  return {
    water: waterBand(soil.water, tolerance(CROPS[crop].waterTolerance, tier)),
    fert: fertBand(soil.fertilizer, tolerance(CROPS[crop].fertTolerance, tier)),
  }
}

function varietyTierOf(variety: VarietyId): VarietyTier {
  return variety === 'base' ? 'base' : VARIETY[variety].tier
}

const TIER_WASH: { readonly [K in VarietyTier]: { fill: number; op: number } } = {
  base: { fill: WASH, op: 0.35 },
  variant: { fill: LEAF, op: 0.45 },
  heirloom: { fill: RIPE, op: 0.45 },
}

function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255
  const ag = (a >> 8) & 255
  const ab = a & 255
  const br = (b >> 16) & 255
  const bg = (b >> 8) & 255
  const bb = b & 255
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | bl
}

function scaleTint(t: number): number {
  if (t < 0.5) return mix(LENS_BAD, LENS_MID, t * 2)
  return mix(LENS_MID, LENS_GOOD, (t - 0.5) * 2)
}

function lensHit(lens: Lens, cell: Cell, g: number): number | undefined {
  if (lens === 'water') {
    if (!isTilled(cell)) return undefined
    if (cell.kind === 'growing' || cell.kind === 'ripe') {
      return BAND_TINT[plantBands(cell.plant.crop, varietyTierOf(cell.plant.variety), cell.soil).water]
    }
    if (cell.soil.water >= SOIL_WATER_MID) return LENS_DONE
    return scaleTint(cell.soil.water / SOIL_WATER_MID)
  }
  if (lens === 'land') {
    if (!isTilled(cell)) {
      if (cell.kind === 'infertile') return LENS_BAD
      if (cell.kind === 'untilled') return scaleTint(g)
      return undefined
    }
    if (cell.kind === 'growing' || cell.kind === 'ripe') {
      return BAND_TINT[plantBands(cell.plant.crop, varietyTierOf(cell.plant.variety), cell.soil).fert]
    }
    if (cell.soil.fertilizer >= 1) return LENS_DONE
    return scaleTint(cell.soil.fertilizer)
  }
  if (lens === 'ripe') {
    if (cell.kind === 'growing') return scaleTint(cell.plant.maturity)
    if (cell.kind === 'ripe') return LENS_DONE
    if (cell.kind === 'dead') return LENS_BAD
    return undefined
  }
  if (
    cell.kind === 'growing' ||
    cell.kind === 'ripe' ||
    cell.kind === 'dead' ||
    cell.kind === 'weed' ||
    cell.kind === 'tree'
  ) {
    return LEAF
  }
  if (
    cell.kind === 'pump' ||
    cell.kind === 'well' ||
    cell.kind === 'chest' ||
    cell.kind === 'grinder' ||
    cell.kind === 'compost-box' ||
    cell.kind === 'mill' ||
    cell.kind === 'jam' ||
    cell.kind === 'still' ||
    cell.kind === 'furnace' ||
    cell.kind === 'station' ||
    cell.kind === 'barrel' ||
    cell.kind === 'freezer' ||
    cell.kind === 'hangar' ||
    cell.kind === 'silo-seed' ||
    cell.kind === 'silo-spray' ||
    cell.kind === 'silo-produce' ||
    cell.kind === 'seed-silo' ||
    cell.kind === 'additive-store'
  ) {
    return WATER
  }
  if (cell.kind === 'rock') return INK
  if (cell.kind === 'house') return ROOF
  return undefined
}

function lensFill(
  lens: Lens,
  cell: Cell,
  aoeOn: boolean,
  g: number,
): { fill: number; op: number; hard: boolean } | undefined {
  if (lens === 'off' || lens === 'vehicles') return undefined
  if (lens === 'variety') {
    if (cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead') {
      const w = TIER_WASH[varietyTierOf(cell.plant.variety)]
      return { fill: w.fill, op: w.op, hard: false }
    }
    if (cell.kind === 'tree') {
      const w = TIER_WASH[varietyTierOf(cell.variety)]
      return { fill: w.fill, op: w.op, hard: false }
    }
    return undefined
  }
  if (lens === 'pipes') {
    if (cell.kind === 'pump' || cell.kind === 'rain-tank' || cell.kind === 'tap' || cell.kind === 'well') {
      return { fill: WATER, op: 0.72, hard: true }
    }
    if (aoeOn) return undefined
    return { fill: WASH, op: 0.35, hard: false }
  }
  if (lens === 'sensors' && isSensor(cell)) return undefined
  const hit = lensHit(lens, cell, g)
  if (hit === undefined) return { fill: WASH, op: 0.35, hard: false }
  return { fill: hit, op: 0.72, hard: true }
}

function portHigh(world: World, end: WireEnd, cell: Cell | undefined): boolean {
  if (end.kind === 'sprinkler') {
    const s = world.sprinklerAt(end.at)
    return s !== undefined && s.inn === 1
  }
  if (end.kind === 'valve') {
    const h = world.valveHold.get(edgeKey(end.e))
    return h !== undefined && h.level === 1
  }
  if (end.port === 'out') {
    if (cell === undefined) return false
    if (cell.kind === 'lamp' || cell.kind === 'mill' || cell.kind === 'jam' || cell.kind === 'still' || cell.kind === 'station') return false
    if (
      isSensor(cell) ||
      cell.kind === 'chest' ||
      cell.kind === 'freezer' ||
      cell.kind === 'seed-silo' ||
      cell.kind === 'additive-store' ||
      cell.kind === 'furnace'
    ) {
      return cell.out === 1
    }
    return false
  }
  return world.wires.some(w => sameEnd(w.to, end) && wireSignal(world, w.from))
}

function cubicAt(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
}

function cubicXY(
  a: { x: number; y: number },
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  return { x: cubicAt(a.x, c1.x, c2.x, b.x, t), y: cubicAt(a.y, c1.y, c2.y, b.y, t) }
}

export class OverlayLayer {
  readonly root = new Container({ eventMode: 'none', isRenderGroup: true })
  private readonly gfx = new Graphics({ eventMode: 'none' })
  private readonly flow = new Graphics({ eventMode: 'none' })
  private dist = new Map<string, number>()
  private flowLens: Lens = 'off'
  private flowPipes = false
  private readonly sprites = new SpritePool(this.root)
  private readonly labels: Text[] = []
  private nLabel = 0

  constructor() {
    this.root.addChild(this.gfx, this.flow)
  }

  private sourceDist(world: World): void {
    this.dist = new Map<string, number>()
    const q: Vertex[] = []
    const seed = (v: Vertex): void => {
      const k = vertexKey(v)
      if (this.dist.has(k)) return
      this.dist.set(k, 0)
      q.push(v)
    }
    world.sources().forEach(src => corners(occupiedCells(src.base, world.owned)).forEach(seed))
    for (let i = 0; i < q.length; i++) {
      const v = q[i]
      const d = this.dist.get(vertexKey(v)) as number
      incident(v).forEach(e => {
        if (!world.conducts(e)) return
        vertsOf(e).forEach(n => {
          const k = vertexKey(n)
          if (this.dist.has(k)) return
          this.dist.set(k, d + 1)
          q.push(n)
        })
      })
    }
  }

  private pipeDashes(world: World, now: number): void {
    if (!this.flowPipes) return
    const t = ((now / 1000 / FLOW_DASH) % 1) * DASH * 2
    let wet = false
    world.segments.forEach(seg => {
      if (!world.conducts(seg.at)) return
      const [a, b] = vertsOf(seg.at)
      const da = this.dist.get(vertexKey(a))
      const db = this.dist.get(vertexKey(b))
      if (da === undefined || db === undefined) return
      const from = da <= db ? a : b
      const to = da <= db ? b : a
      const dx = (to.col - from.col) * TILE
      const dy = (to.row - from.row) * TILE
      const len = Math.hypot(dx, dy)
      const ux = dx / len
      const uy = dy / len
      for (let o = t - DASH * 2; o < len; o += DASH * 2) {
        const s0 = Math.max(0, o)
        const s1 = Math.min(len, o + DASH)
        if (s1 <= s0) continue
        this.flow.moveTo(from.col * TILE + ux * s0, from.row * TILE + uy * s0)
        this.flow.lineTo(from.col * TILE + ux * s1, from.row * TILE + uy * s1)
        wet = true
      }
    })
    if (wet) this.flow.stroke({ color: WATER, width: 2, cap: 'round' })
  }

  private wireBeads(world: World, now: number): void {
    if (this.flowLens !== 'sensors') return
    let beads = false
    world.wires.forEach(w => {
      if (!wireSignal(world, w.from)) return
      const a = wireEndXY(world, w.from)
      const b = wireEndXY(world, w.to)
      const { c1, c2 } = wireControls(a, b)
      const base = (now / 1000 / FLOW_DASH) % 1
      for (let i = 0; i < 3; i++) {
        const u = (base + i / 3) % 1
        const p = cubicXY(a, c1, c2, b, u)
        this.flow.circle(p.x * TILE, p.y * TILE, 2)
        beads = true
      }
    })
    if (beads) this.flow.fill({ color: WATER })
  }

  flowTick(world: World, now: number): void {
    this.flow.clear()
    this.pipeDashes(world, now)
    this.wireBeads(world, now)
  }

  patch(
    world: World,
    lens: Lens,
    editor: boolean,
    place: Place,
    hoverAoe: Sprinkler | undefined,
    ptr?: { x: number; y: number },
  ): void {
    this.gfx.clear()
    this.flowLens = lens
    this.flowPipes = pipesOverlay(lens, place)
    this.sourceDist(world)
    this.sprites.begin()
    this.nLabel = 0
    const washAoe =
      lens === 'pipes' ||
      place.kind === 'delete' ||
      (place.kind === 'sku' && AOE_WASH.includes(place.id))
    const aoeWash = new Set<string>()
    if (washAoe) {
      world.sprinklers.forEach(s => {
        aoe(s).forEach(at => {
          if (world.inWorld(at)) aoeWash.add(`${at.col},${at.row}`)
        })
      })
    }
    if (hoverAoe !== undefined && place.kind === 'none') {
      aoe(hoverAoe).forEach(at => {
        if (world.inWorld(at)) aoeWash.add(`${at.col},${at.row}`)
      })
    }
    const sensorWash = new Set<string>()
    const addReader = (at: { col: number; row: number }) => {
      area3(at).forEach(c => {
        if (world.inWorld(c)) sensorWash.add(`${c.col},${c.row}`)
      })
    }
    const hud = world.hud
    if (hud !== undefined && (hud.kind === 'water' || hud.kind === 'harvest')) addReader(hud.at)
    if (lens === 'sensors') {
      for (const at of world.sensors.values()) {
        const cell = world.cell(at)
        if (cell.kind === 'sensor-water' || cell.kind === 'sensor-fert' || cell.kind === 'sensor-harvest') {
          addReader(at)
        }
      }
    }
    if (place.kind === 'sku' && PIPE_PLACE.includes(place.id)) this.lattice(world)
    const keys = new Set(world.owned.map(chunkKey))
    const b = world.bounds()
    const cyEnd = Math.floor((b.row1 + FADE - 1) / GROUND_CHUNK)
    const cxBnd = Math.floor((b.col1 + FADE - 1) / GROUND_CHUNK)
    for (let cy = Math.floor((b.row0 - FADE) / GROUND_CHUNK); cy <= cyEnd; cy++) {
      for (let cx = Math.floor((b.col0 - FADE) / GROUND_CHUNK); cx <= cxBnd; cx++) {
        const c0 = cx * GROUND_CHUNK
        const r0 = cy * GROUND_CHUNK
        for (let row = r0; row < r0 + GROUND_CHUNK; row++) {
          for (let col = c0; col < c0 + GROUND_CHUNK; col++) {
            const at = { col, row }
            if (!keys.has(chunkKey(chunkOf(at)))) continue
            if (lens === 'off' || lens === 'vehicles') continue
            const key = `${col},${row}`
            const cell = world.cell(at)
            const g = lens === 'land' ? goodness(world.rng, col, row) : 0
            const tint = lensFill(lens, cell, aoeWash.has(key), g)
            if (tint === undefined) continue
            this.gfx.rect(col * TILE, row * TILE, TILE, TILE)
            this.gfx.fill({ color: tint.fill, alpha: tint.op })
          }
        }
      }
    }
    const hoverFill = hoverAoe !== undefined && place.kind === 'none' ? 0.35 : 0.2
    aoeWash.forEach(k => {
      const comma = k.indexOf(',')
      const col = Number(k.slice(0, comma))
      const row = Number(k.slice(comma + 1))
      const under = world.cell({ col, row }).kind
      if (under === 'pump' || under === 'rain-tank' || under === 'tap' || under === 'well') return
      this.gfx.rect(col * TILE, row * TILE, TILE, TILE)
      this.gfx.fill({ color: WATER, alpha: hoverFill })
    })
    sensorWash.forEach(k => {
      const comma = k.indexOf(',')
      const col = Number(k.slice(0, comma))
      const row = Number(k.slice(comma + 1))
      this.gfx.rect(col * TILE, row * TILE, TILE, TILE)
      this.gfx.fill({ color: WATER, alpha: 0.35 })
    })
    this.gfx.circle((world.house.door.col + 0.5) * TILE, (world.house.door.row + 0.5) * TILE, 3)
    this.gfx.fill({ color: ROOF })
    if (world.driverVehicle(world.local) !== undefined || lens === 'vehicles') {
      world.hangars.forEach(h => {
        hangarPad(h.base).forEach(p => {
          const s = this.sprites.take(atlasTex('hangar-return'))
          s.position.set(p.col * TILE, p.row * TILE)
        })
      })
      ;[...world.seedSilos, ...world.spraySilos, ...world.produceSilos].forEach(h => {
        siloPad(h.base).forEach(p => {
          const s = this.sprites.take(atlasTex('hangar-return'))
          s.position.set(p.col * TILE, p.row * TILE)
        })
      })
      world.machinePads().forEach(p => {
        const s = this.sprites.take(atlasTex(p.side === 'dropoff' ? 'pad-drop' : 'pad-take'))
        s.position.set(p.col * TILE, p.row * TILE)
        s.alpha = p.legal ? 1 : 0.5
      })
    }
    if (lens === 'sensors' || place.kind === 'wire') this.wires(world)
    if (place.kind === 'wire' && ptr !== undefined) this.pendingWire(world, place.from, ptr.x, ptr.y)
    this.routes(world, lens, editor)
    this.sprites.end()
    for (let i = this.nLabel; i < this.labels.length; i++) this.labels[i].visible = false
  }

  private takeLabel(): Text {
    let t = this.labels[this.nLabel]
    if (t === undefined) {
      t = new Text({ text: '', style: { fontFamily: 'Nunito, sans-serif', fontSize: 14, fill: INK, fontWeight: '700' }, eventMode: 'none' })
      t.anchor.set(0.5)
      this.root.addChild(t)
      this.labels.push(t)
    }
    t.visible = true
    this.nLabel += 1
    return t
  }

  private wires(world: World): void {
    world.wires.forEach(w => {
      const a = wireEndXY(world, w.from)
      const b = wireEndXY(world, w.to)
      const on = wireSignal(world, w.from)
      this.bezier(a, b, on ? WATER : FRUIT_RED)
    })
    const marks: { x: number; y: number; out: boolean; high: boolean }[] = []
    const pushCell = (at: { col: number; row: number }, c: Cell) => {
      PORTS.forEach(port => {
        if (!ownsPort(c, at, port)) return
        const end: WireEnd = { kind: 'cell', at, port }
        const p = portXY(end, portDevice(c))
        marks.push({ x: p.x, y: p.y, out: port === 'out', high: portHigh(world, end, c) })
      })
    }
    for (const at of world.sensors.values()) pushCell(at, world.cell(at))
    for (const at of world.machines.values()) pushCell(at, world.cell(at))
    for (const at of world.stores.values()) pushCell(at, world.cell(at))
    pushCell({ col: world.silo.base.col, row: world.silo.base.row }, world.silo)
    pushCell({ col: world.additives.base.col, row: world.additives.base.row }, world.additives)
    if (world.done.has('unlock-smart-irrigation')) {
      world.sprinklers.forEach(s => {
        const end: WireEnd = { kind: 'sprinkler', at: s.at, port: 'in' }
        const p = portXY(end)
        marks.push({ x: p.x, y: p.y, out: false, high: s.inn === 1 })
      })
    }
    if (world.done.has('unlock-smart-irrigation')) {
      world.segments.forEach(seg => {
        if (seg.gate.kind !== 'valve') return
        const end: WireEnd = { kind: 'valve', e: seg.at, port: 'in' }
        const p = portXY(end)
        marks.push({ x: p.x, y: p.y, out: false, high: world.conducts(seg.at) })
      })
    }
    const r = PORT_HIT * TILE
    marks.forEach(m => {
      const col = m.high ? WATER : FRUIT_RED
      const x = m.x * TILE
      const y = m.y * TILE
      if (m.out) {
        this.gfx.circle(x, y, r)
        this.gfx.fill({ color: col, alpha: 0.3 })
        this.gfx.circle(x, y, 3)
        this.gfx.fill({ color: col })
        this.gfx.stroke({ color: INK, width: 1 })
      } else {
        this.gfx.rect(x - r, y - r, r * 2, r * 2)
        this.gfx.fill({ color: col, alpha: 0.3 })
        this.gfx.rect(x - 3, y - 3, 6, 6)
        this.gfx.fill({ color: col })
        this.gfx.stroke({ color: INK, width: 1 })
      }
    })
  }

  private lattice(world: World): void {
    const b = world.bounds()
    let any = false
    const line = (e: Edge): void => {
      if (!world.edgeOwned(e) || world.hasPipe(e)) return
      const [a, c] = vertsOf(e)
      this.gfx.moveTo(a.col * TILE, a.row * TILE)
      this.gfx.lineTo(c.col * TILE, c.row * TILE)
      any = true
    }
    for (let row = b.row0; row <= b.row1 + 1; row++) {
      for (let col = b.col0; col <= b.col1 + 1; col++) {
        line({ axis: 'h', col, row })
        line({ axis: 'v', col, row })
      }
    }
    if (any) this.gfx.stroke({ color: INK, width: 1, alpha: LATTICE_ALPHA })
  }

  pendingWire(world: World, from: WireEnd, x: number, y: number): void {
    const a = wireEndXY(world, from)
    this.bezier(a, { x, y }, FRUIT_RED)
  }

  private bezier(from: { x: number; y: number }, to: { x: number; y: number }, color: number): void {
    const { c1, c2 } = wireControls(from, to)
    this.gfx.moveTo(from.x * TILE, from.y * TILE)
    this.gfx.bezierCurveTo(c1.x * TILE, c1.y * TILE, c2.x * TILE, c2.y * TILE, to.x * TILE, to.y * TILE)
    this.gfx.stroke({ color: INK, width: 4.5, cap: 'round' })
    this.gfx.moveTo(from.x * TILE, from.y * TILE)
    this.gfx.bezierCurveTo(c1.x * TILE, c1.y * TILE, c2.x * TILE, c2.y * TILE, to.x * TILE, to.y * TILE)
    this.gfx.stroke({ color, width: 2.5, cap: 'round' })
  }

  private line(from: { x: number; y: number }, to: { x: number; y: number }, color: number): void {
    this.gfx.moveTo(from.x * TILE, from.y * TILE)
    this.gfx.lineTo(to.x * TILE, to.y * TILE)
    this.gfx.stroke({ color: INK, width: 4.5, cap: 'round' })
    this.gfx.moveTo(from.x * TILE, from.y * TILE)
    this.gfx.lineTo(to.x * TILE, to.y * TILE)
    this.gfx.stroke({ color, width: 2.5, cap: 'round' })
  }

  private routes(world: World, lens: Lens, editor: boolean): void {
    const driven = world.driverVehicle(world.local)
    const assigned = new Set(world.vehicles.filter(v => v.route !== 'none').map(v => v.route))
    const routes = editor
      ? driven !== undefined && driven.route !== 'none'
        ? world.routes.filter(r => r.id === driven.route)
        : []
      : lens === 'vehicles'
        ? world.routes.filter(r => assigned.has(r.id))
        : []
    if (routes.length === 0) return
    const current = driven !== undefined && driven.route !== 'none' ? driven : undefined
    const mover = world.vehicles.find(v => v.running && v.route !== 'none' && v.pose.kind === 'field')
    routes.forEach(route => {
      if (route.stops.length === 0) return
      const pts = route.stops.map(stopXY)
      const n = pts.length
      if (n > 1) {
        pts.forEach((p, i) => this.line(p, pts[(i + 1) % n], GRAPE))
      }
      const follow =
        mover !== undefined && mover.route === route.id && mover.pose.kind === 'field' && n > 0
          ? { from: { x: mover.pose.x, y: mover.pose.y }, to: stopXY(route.stops[mover.cursor]) }
          : current !== undefined && current.route === route.id && current.pose.kind === 'field' && n > 0
            ? { from: { x: current.pose.x, y: current.pose.y }, to: stopXY(route.stops[current.cursor]) }
            : undefined
      if (follow !== undefined) this.line(follow.from, follow.to, FRUIT_RED)
      if (!editor) return
      route.stops.forEach((s, i) => {
        const p = stopXY(s)
        const cur = current !== undefined && current.route === route.id && current.cursor === i
        const r = cur ? 12 : 10
        this.gfx.circle(p.x * TILE, p.y * TILE, r)
        this.gfx.fill({ color: cur ? RIPE : WASH })
        this.gfx.circle(p.x * TILE, p.y * TILE, r)
        this.gfx.stroke({ color: INK, width: 2 })
        const lab = this.takeLabel()
        lab.text = String(i + 1)
        lab.style.fontSize = cur ? 16 : 14
        lab.position.set(p.x * TILE, p.y * TILE)
      })
    })
  }
}
