import {
  BULK_UP_CRAFTED_STEP,
  BULK_UP_STEP,
  COUNTER_MAX,
  STACK_MAX,
  STACK_MAX_CRAFTED,
  CONTAINERS,
  QUAD_REFILL,
  SPEECH_S
} from '../defs/items.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import {
  betterGain,
  SKILLS
} from '../defs/skills.ts'
import {
  PUMP_COST_PER_L,
  WEATHER_THROUGH_DAY
} from '../defs/weather.ts'
import {
  HAPPY_MAX,
  HAPPY_START
} from '../defs/crops.ts'
import {
  qualityGain,
  STARTER_FRUIT,
  STARTER_FRUIT_N,
  STARTER_TREE_GRAFTS,
  STARTER_VARIETY_PACKS,
  VARIETY,
  type VarietyId
} from '../defs/varieties.ts'
import { TREE_IDS } from './ids.ts'
import type {
  AnnualId,
  CropId,
  DaughterSkillId,
  HusbandSkillId,
  MemberId,
  PlayerSkillId,
  ResearchId,
  SkillId,
  HarvestSlot,
  RouteId,
  SkuId,
  TrailerId,
  TrailerKind,
  VehicleId,
  VehicleKind,
  VehicleSlot,
  VfxId
} from './ids.ts'
import { Actor, WALK } from './actor.ts'
import {
  ADDITIVE_BASE,
  AdditiveStore,
  CHUNK,
  DOOR,
  HOUSE_BASE,
  House,
  PUMP_BASE,
  Pump,
  SILO_BASE,
  SeedSilo,
  TRUCK_BASE,
  Truck,
  chunkKey,
  chunkOf,
  chunkRect,
  inWorld,
  local,
  type AdditiveId,
  type Base,
  type ChunkId,
  type Coord,
  type Furnace,
  type Hangar,
  type PotStill,
  type RainTank,
  type RectBase,
  type SiloProduce,
  type SiloSeed,
  type SiloSpray,
  type Tap,
  type Well
} from './building.ts'
import { Clock, DAY_SECONDS } from './clock.ts'
import {
  type Drop
} from './drop.ts'
import { generateChunk } from './gen.ts'
import {
  crafted,
  makeContainer,
  makeShovel,
  type Countable,
  type Hand,
  type Item,
  type Slot
} from './item.ts'
import {
  isIoCell,
  machineEast,
  machineWest
} from './feature-machines/machine.ts'
import * as machines from './feature-machines/machines.tick.ts'
import {
  CONTRACT_ACTIVE,
  CONTRACT_OFFERS,
  recover,
  emptyContracts,
  addRep,
  tickContracts as tickContractsFn,
  REP_IDLE
} from './feature-contracts/market.ts'
import type {
  ContractId,
  Contracts,
  SellAllQuote
} from './feature-contracts/market.h.ts'
import {
  makeStall,
  STALL_IDS,
  type StallMap
} from './stall.ts'
import { statsOf, type Modifier, type Stats } from './modifiers.ts'
import { Plant } from './plant.ts'
import {
  isTilled,
  type Cell
} from './plot.ts'
import {
  WEED_CHANCE
} from './soil.ts'
import {
  edgeKey,
  edgeOwned as pipeOwned,
  flows,
  vertexKey,
  vertexOwned as pipeVertexOwned,
  vertsOf,
  type Edge,
  type Segment,
  type Sprinkler,
  type Tune,
  type Vertex
} from './pipe.ts'
import {
  pull,
  Reservoir
} from './water.ts'
import { forecastWeather, pumpCostMul, sourceRateMul, type WeatherKind } from './weather.ts'
import {
  readPrompt,
  readPromptHit,
  type Prompt,
  type PromptHit
} from './prompt.ts'
import { Act, type Cmd, type LogSink, MemorySink } from './log.ts'
import { Rng } from './rng.ts'
import {
  compactSlots,
  dropoffPad,
  hangarPad,
  putSugarInto,
  takeupPad,
  type PadCell,
  type Route,
  type RouteStop,
  type Trailer,
  type Vehicle
} from './feature-vehicles/vehicle.ts'
import {
  dropIncident,
  isInEnd,
  isOutEnd,
  isSensor,
  sameEnd,
  sameNode,
  isSeqIn,
  wouldCycle,
  type ValveHold,
  type WaterSystem,
  type Wire,
  type WireEnd
} from './sensor.ts'
import { applyCmd } from './apply.ts'
import * as family from './family.ts'
import { emptyMember, initFamily } from './family.ts'
import * as queue from './queue.ts'
import * as nets from './nets.ts'
import * as store from './store.ts'
import * as vehicles from './feature-vehicles/vehicle.ts'
import * as tick from './tick.ts'
import * as field from './feature-field/field.ts'
import * as place from './feature-place/place.ts'

export type * from './world.h.ts'
import type {
  Burst,
  BuyFail,
  DayTally,
  ExpandFace,
  Family,
  HudTarget,
  Hydrate,
  Intent,
  Job,
  Net,
  PlayerId,
  Presence,
  Seat,
  SeatId,
  Seam,
  SkillRef,
  Speech,
  TaskName,
} from './world.h.ts'

export const POINTS_PER_DAY = 3

export const DAY_STIPEND = 10
export const MP_ID_KEY = 'gardena-mp-id'

export const QUEUE_CAP = 8

export const DT_MAX = 1 / 15
const INV = 16

export const MP_NAME_KEY = 'gardena-mp-name'
export const NAME_MAX = 16

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX)
}

export function localPlayerName(): string {
  return cleanName(localStorage.getItem(MP_NAME_KEY) ?? '')
}

export function setLocalPlayerName(raw: string): void {
  localStorage.setItem(MP_NAME_KEY, cleanName(raw))
}

export function localPlayerId(): PlayerId {
  const have = localStorage.getItem(MP_ID_KEY)
  if (have !== null) return have
  const id = crypto.randomUUID()
  localStorage.setItem(MP_ID_KEY, id)
  return id
}

function emptyInv(): Slot[] {
  return Array.from({ length: INV }, (): Slot => ({ kind: 'empty' }))
}

export function defaultSeatName(id: SeatId): string {
  return `P${id + 1}`
}

function liveSeat(
  id: SeatId,
  playerId: PlayerId,
  name: string,
  actor: Actor,
  hand: Hand,
  inventory: Slot[],
  presence: Presence,
): Seat {
  return {
    id,
    playerId,
    name: name === '' ? defaultSeatName(id) : name,
    actor,
    hand,
    inventory,
    queue: [],
    presence,
    napping: false,
    cue: { kind: 'none' },
    place: { kind: 'none' },
    drive: { throttle: 0, steer: 0 },
    stride: { x: 0, y: 0 },
    workLeft: 0,
    workTotal: 0,
    filling: false,
    legStart: { x: actor.x, y: actor.y },
  }
}

export function joinKit(id: SeatId, playerId: PlayerId, name: string): Seat {
  const x = DOOR.col + 0.5 + id * 0.6
  const y = DOOR.row + 0.5
  return liveSeat(id, playerId, name, new Actor(x, y), { kind: 'hold', item: makeShovel('shovel') }, emptyInv(), 'in')
}

function soloSeat(playerId: PlayerId, name: string): Seat {
  const inventory = emptyInv()
  const stock: Item[] = [
    ...TREE_IDS.map(tree => ({ kind: 'tree-seed' as const, tree, variety: 'base' as const, quality: 0 })),
    ...STARTER_TREE_GRAFTS.map(v => ({
      kind: 'graft' as const,
      crop: VARIETY[v].crop,
      variety: v,
      quality: 0,
      count: 1,
    })),
    ...STARTER_FRUIT.map(v => ({
      kind: 'fruit' as const,
      crop: VARIETY[v].crop,
      variety: v as VarietyId,
      quality: 0,
      count: STARTER_FRUIT_N,
      unitSale: statsOf(VARIETY[v].crop, v, 0, []).sale,
      freshness: 1,
      bio: true,
      cut: false,
    })),
  ]
  stock.forEach((item, i) => {
    inventory[i] = { kind: 'hold', item }
  })
  const x = DOOR.col + 0.5
  const y = DOOR.row + 0.5
  return liveSeat(0, playerId, name, new Actor(x, y), { kind: 'hold', item: makeShovel('shovel') }, inventory, 'in')
}

const STARTER_SEEDS: readonly { crop: AnnualId; variety: VarietyId; quality: number; count: number }[] = [
  { crop: 'carrot', variety: 'base', quality: 0, count: 7 },
  { crop: 'tomato', variety: 'base', quality: 0, count: 2 },
  { crop: 'potato', variety: 'base', quality: 0, count: 2 },
  ...STARTER_VARIETY_PACKS.map(v => ({ crop: VARIETY[v].crop as AnnualId, variety: v, quality: 0, count: 5 })),
]

function groundSig(c: Cell): string {
  if (c.kind === 'untilled' && c.cover.kind === 'tile') return `t:${c.cover.tile}`
  if (c.kind === 'untilled' && c.ground === 'hard') return 'h'
  if ((c.kind === 'untilled' && c.ground === 'very-hard') || c.kind === 'infertile') return 'vh'
  return 'g'
}

const LOG_CAP = 500

export type PingKind = 'dirty' | 'poured' | 'sold'

export type DirtyReason = 'act' | 'field' | 'big' | 'speech' | 'vfx'

const NO_REASONS: ReadonlySet<DirtyReason> = new Set()

const HYDRATE = Symbol()

export class World {
  readonly rng: Rng
  private readonly cmds: Cmd[] = []
  private logBase = 0
  now = 0
  private readonly sink: LogSink
  purchases = 0
  prizeSlots = 0
  prizeFreezers = 0
  readonly owned: ChunkId[] = [{ cx: 0, cy: 0 }]
  readonly pumps: Pump[]
  readonly tanks: RainTank[] = []
  readonly taps: Tap[] = []
  readonly stills: PotStill[] = []
  readonly waterSystems: WaterSystem[] = []
  readonly wires: Wire[] = []
  readonly valveHold = new Map<string, ValveHold>()
  readonly hangars: Hangar[] = []
  readonly seedSilos: SiloSeed[] = []
  readonly spraySilos: SiloSpray[] = []
  readonly produceSilos: SiloProduce[] = []
  readonly vehicles: Vehicle[] = []
  nextVehicleId: VehicleId = 1
  readonly trailers: Trailer[] = []
  nextTrailerId: TrailerId = 1
  readonly routes: Route[] = []
  nextRouteId: RouteId = 1
  readonly segments = new Map<string, Segment>()
  readonly wells: Well[] = []
  readonly fences = new Set<string>()
  readonly sprinklers = new Map<string, Sprinkler>()
  readonly netVerts = new Set<string>()
  readonly sprinklerTargetCache = new Map<string, Coord[]>()
  readonly wiredVerts = new Set<string>()
  readonly house: House
  readonly truck: Truck
  readonly silo: SeedSilo
  readonly additives: AdditiveStore
  readonly stall: StallMap
  readonly family: Family
  points = 0
  clearance = 0
  consignRevision = 0
  readonly seats: Seat[]
  local: SeatId = 0
  act: Seat
  remote: ((cmd: Cmd) => void) | undefined
  readonly clock = new Clock()
  readonly drops: Drop[] = []
  readonly modifiers: Modifier[] = []
  modGen = 0
  private statsCacheGen = -1
  private readonly statsCache = new Map<string, Stats>()
  readonly done = new Set<ResearchId>()
  money = 50
  job: Job = { kind: 'idle' }
  speech: Speech = { kind: 'none' }
  hud: HudTarget | undefined = undefined
  tally: DayTally = { died: 0, harvests: 0, research: [], contracts: [] }
  readonly contracts: Contracts = emptyContracts()
  seam: Seam = { kind: 'play' }
  groundRev = 0
  bigTicks = 0
  cheatFastResearch = false
  cheatSpeed: 1 | 3 = 1
  bigAcc = 0
  nets: Net[] | undefined = undefined
  netAt = new Map<string, Net>()
  readonly chunks = new Map<string, Cell[][]>()
  readonly grow = new Map<string, Coord>()
  readonly machines = new Map<string, Coord>()
  furnaceSnap: Furnace[] = []
  readonly stores = new Map<string, Coord>()
  readonly sensors = new Map<string, Coord>()
  readonly buttons = new Map<string, Coord>()
  readonly recover = new Map<string, Coord>()
  readonly empty = new Map<string, Coord>()
  readonly tilled = new Map<string, Coord>()
  pumpLiters = 0
  private weatherTable: WeatherKind[] = []
  private readonly weatherPins = new Map<number, WeatherKind>()
  readonly tufts = new Map<string, Coord>()
  readonly rocks = new Map<string, Coord>()
  private readonly dirtEdgeCache = new Map<string, string>()
  readonly vfx = new Map<string, boolean>()
  readonly bursts: Burst[] = []
  private burstSeq = 0
  private readonly subs = new Set<(kind: PingKind, reasons: ReadonlySet<DirtyReason>) => void>()
  private pendingDirty = new Set<DirtyReason>()
  private flushQueued = false

  constructor(seed?: number, sink?: LogSink)
  constructor(tag: typeof HYDRATE, h: Hydrate)
  constructor(seedOrTag?: number | typeof HYDRATE, sinkOrH: LogSink | Hydrate = new MemorySink()) {
    if (seedOrTag === HYDRATE) {
      const h = sinkOrH as Hydrate
      this.rng = h.rng
      this.sink = h.sink
      this.house = h.house
      this.truck = h.truck
      this.silo = h.silo
      this.additives = h.additives
      this.pumps = h.pumps
      this.tanks = h.tanks
      this.taps = h.taps
      this.stills = h.stills
      this.waterSystems.length = 0
      h.waterSystems.forEach(x => this.waterSystems.push(x))
      this.wires.length = 0
      h.wires.forEach(x => this.wires.push(x))
      this.valveHold.clear()
      h.valveHold.forEach(x => this.valveHold.set(edgeKey(x.e), x))
      this.hangars.length = 0
      h.hangars.forEach(x => this.hangars.push(x))
      this.seedSilos.length = 0
      h.seedSilos.forEach(x => this.seedSilos.push(x))
      this.spraySilos.length = 0
      h.spraySilos.forEach(x => this.spraySilos.push(x))
      this.produceSilos.length = 0
      h.produceSilos.forEach(x => this.produceSilos.push(x))
      this.vehicles.length = 0
      h.vehicles.forEach(x => this.vehicles.push(x))
      this.nextVehicleId = h.nextVehicleId
      this.trailers.length = 0
      h.trailers.forEach(x => this.trailers.push(x))
      this.nextTrailerId = h.nextTrailerId
      this.routes.length = 0
      h.routes.forEach(x => this.routes.push(x))
      this.nextRouteId = h.nextRouteId
      this.stall = h.stall
      this.family = h.family
      this.points = h.points
      this.clearance = h.clearance
      this.seats = h.seats
      this.act = this.seats[0]
      this.owned.length = 0
      h.owned.forEach(id => this.owned.push(id))
      this.chunks.clear()
      h.chunks.forEach((g, k) => this.chunks.set(k, g))
      this.clock.day = h.clock.day
      this.clock.t = h.clock.t
      this.clock.banner = 0
      this.money = h.money
      this.contracts.rep = h.rep
      this.contracts.repDay = h.repDay
      this.contracts.active = h.contracts.active
      this.contracts.takenToday = h.contracts.takenToday
      this.contracts.history = h.contracts.history
      this.contracts.book = h.contracts.book
      this.purchases = h.purchases
      this.prizeSlots = h.prizeSlots
      this.prizeFreezers = h.prizeFreezers
      this.bigTicks = h.bigTicks
      this.done.clear()
      h.done.forEach(id => this.done.add(id))
      this.job = h.job
      this.tally = h.tally
      this.seam = h.seam
      this.segments.clear()
      h.segments.forEach(s => this.segments.set(edgeKey(s.at), s))
      this.wells = h.wells
      this.sprinklers.clear()
      h.sprinklers.forEach(s => this.sprinklers.set(vertexKey(s.at), s))
      this.fences.clear()
      h.fences.forEach(at => this.fences.add(`${at.col},${at.row}`))
      this.drops.length = 0
      h.drops.forEach(d => this.drops.push(d))
      this.modifiers.length = 0
      family.rebuildSkillModifiers(this)
      this.netVerts.clear()
      h.segments.forEach(s => vertsOf(s.at).forEach(v => this.netVerts.add(vertexKey(v))))
      h.sprinklers.forEach(s => this.netVerts.add(vertexKey(s.at)))
      this.now = 0
      this.speech = { kind: 'none' }
      this.hud = undefined
      this.consignRevision = 0
      this.groundRev = 0
      this.sink.reset(this.rng.seed)
      this.rebase()
      this.pumpLiters = 0
      this.rebuildWeather()
      this.applyWeatherRates()
      return
    }
    this.rng = new Rng(seedOrTag)
    this.sink = sinkOrH as LogSink
    this.sink.reset(this.rng.seed)
    this.house = new House(HOUSE_BASE, DOOR)
    this.truck = new Truck(TRUCK_BASE)
    this.silo = new SeedSilo(SILO_BASE)
    this.additives = new AdditiveStore(ADDITIVE_BASE)
    this.pumps = [new Pump(PUMP_BASE, 'starter')]
    this.stall = Object.fromEntries(STALL_IDS.map(id => [id, makeStall(id)])) as StallMap
    this.family = {
      player: emptyMember(),
      husband: emptyMember(),
      daughter: emptyMember(),
    }
    initFamily(this)
    this.chunks.set(
      chunkKey(this.owned[0]),
      generateChunk(this.rng, this.owned[0], this.house, this.pumps[0], this.truck, this.silo, this.additives),
    )
    this.seats = [soloSeat(localPlayerId(), localPlayerName())]
    this.act = this.seats[0]
    STARTER_SEEDS.forEach(st => this.putSilo(st.crop, st.variety, st.quality, st.count))
    this.drops.push({ at: { ...DOOR }, item: makeContainer('bucket', CONTAINERS.bucket.capacityLiters) })
    this.indexAll()
    this.rebuildWeather()
    this.applyWeatherRates()
  }

  static hydrate(h: Hydrate): World {
    return new World(HYDRATE, h)
  }

  get seed(): number {
    return this.rng.seed
  }

  get log(): Cmd[] {
    return this.cmds
  }

  get logEnd(): number {
    return this.logBase + this.cmds.length
  }

  
  logSince(n: number): Cmd[] | undefined {
    if (n < this.logBase) return undefined
    return this.cmds.slice(n - this.logBase)
  }

  get pump(): Pump {
    return this.pumps[0]
  }

  
  rebase(): void {
    this.bigAcc = 0
    this.cheatFastResearch = false
    this.cheatSpeed = 1
    this.nets = undefined
    this.seats.forEach(s => {
      s.queue.length = 0
      s.cue = { kind: 'none' }
      s.actor.work = 0
      s.workLeft = 0
      s.workTotal = 0
      s.filling = false
      s.place = { kind: 'none' }
      s.drive = { throttle: 0, steer: 0 }
      s.stride = { x: 0, y: 0 }
      const driven = this.vehicles.find(v => v.pose.kind === 'field' && v.pose.driver === s.id)
      if (driven !== undefined && driven.pose.kind === 'field') {
        s.actor.x = driven.pose.x
        s.actor.y = driven.pose.y
      }
      s.legStart = { x: s.actor.x, y: s.actor.y }
    })
    this.indexAll()
  }

  join(playerId: PlayerId, name = ''): SeatId | 'full' {
    const hit = this.seats.find(s => s.playerId === playerId)
    if (hit !== undefined) {
      hit.presence = 'in'
      hit.napping = false
      if (name !== '') hit.name = name
      return hit.id
    }
    if (this.seats.length >= 4) return 'full'
    const id = this.seats.length as SeatId
    this.seats.push(joinKit(id, playerId, name === '' ? defaultSeatName(id) : name))
    return id
  }

  away(id: SeatId): void {
    const s = this.seats[id]
    s.presence = 'away'
    s.cue = { kind: 'none' }
    s.queue.length = 0
    s.workLeft = 0
    s.workTotal = 0
    s.filling = false
    s.place = { kind: 'none' }
    s.drive = { throttle: 0, steer: 0 }
    s.stride = { x: 0, y: 0 }
    this.vehicles.forEach(v => {
      if (v.pose.kind === 'field' && v.pose.driver === id) v.pose.driver = 'none'
    })
    this.ping()
  }

  commit(cmd: Extract<Cmd, { a: typeof Act.click }>): 'queued' | 'placed' | 'blocked' | 'noop'
  commit(cmd: Extract<Cmd, { a: typeof Act.buy }>): BuyFail | undefined
  commit(cmd: Cmd): void
  commit(cmd: Cmd): 'queued' | 'placed' | 'blocked' | 'noop' | BuyFail | undefined | void {
    if (this.remote !== undefined) {
      this.remote(cmd)
      return
    }
    return this.dispatch(cmd)
  }

  dispatch(cmd: Extract<Cmd, { a: typeof Act.click }>): 'queued' | 'placed' | 'blocked' | 'noop'
  dispatch(cmd: Extract<Cmd, { a: typeof Act.buy }>): BuyFail | undefined
  dispatch(cmd: Cmd): void
  dispatch(cmd: Cmd): 'queued' | 'placed' | 'blocked' | 'noop' | BuyFail | undefined | void {
    this.cmds.push(cmd)
    if (this.cmds.length > LOG_CAP) {
      this.cmds.shift()
      this.logBase += 1
    }
    this.sink.push(cmd)
    return this.apply(cmd)
  }

  apply(cmd: Extract<Cmd, { a: typeof Act.click }>): 'queued' | 'placed' | 'blocked' | 'noop'
  apply(cmd: Extract<Cmd, { a: typeof Act.buy }>): BuyFail | undefined
  apply(cmd: Cmd): void
  apply(cmd: Cmd): 'queued' | 'placed' | 'blocked' | 'noop' | BuyFail | undefined | void {
    return applyCmd(this, cmd)
  }

  on(fn: (kind: PingKind, reasons: ReadonlySet<DirtyReason>) => void): () => void {
    this.subs.add(fn)
    return () => {
      this.subs.delete(fn)
    }
  }

  ping(): void {
    this.mark('act')
  }

  pingFor(reason: DirtyReason): void {
    this.mark(reason)
  }

  flushDirty(): void {
    this.flushQueued = false
    if (this.pendingDirty.size === 0) return
    const reasons = this.pendingDirty
    this.pendingDirty = new Set()
    this.subs.forEach(f => f('dirty', reasons))
  }

  private mark(reason: DirtyReason): void {
    this.pendingDirty.add(reason)
    if (this.flushQueued) return
    this.flushQueued = true
    queueMicrotask(() => this.flushDirty())
  }

  emit(kind: Exclude<PingKind, 'dirty'>): void {
    this.subs.forEach(f => f(kind, NO_REASONS))
  }

  inWorld(at: Coord): boolean {
    return inWorld(at, this.owned)
  }

  cell(at: Coord): Cell {
    const loc = local(at)
    return this.gridOf(chunkOf(at))[loc.row][loc.col]
  }

  setCell(at: Coord, cell: Cell): void {
    const loc = local(at)
    const grid = this.gridOf(chunkOf(at))
    const prev = grid[loc.row][loc.col]
    const prevTilled = isTilled(prev)
    grid[loc.row][loc.col] = cell
    if (groundSig(prev) !== groundSig(cell)) this.groundRev += 1
    this.track(at, cell)
    if ((prev.kind === 'growing') !== (cell.kind === 'growing')) this.dropTargetCachesAt(at)
    if (prevTilled !== isTilled(cell)) this.invalidateDirtEdges(at)
  }

  track(at: Coord, cell: Cell): void {
    const k = `${at.col},${at.row}`
    const here = { col: at.col, row: at.row }
    const origin =
      !('base' in cell) ||
      (cell.base.shape === 'rect'
        ? cell.base.col === at.col && cell.base.row === at.row
        : Math.floor(cell.base.cx - cell.base.r) === at.col && Math.floor(cell.base.cy - cell.base.r) === at.row)
    if (
      cell.kind === 'growing' ||
      cell.kind === 'ripe' ||
      cell.kind === 'weed' ||
      cell.kind === 'turf' ||
      cell.kind === 'dead' ||
      cell.kind === 'rotten' ||
      (cell.kind === 'tree' && origin)
    ) {
      this.grow.set(k, here)
    } else this.grow.delete(k)
    if (origin && 'ticks' in cell && cell.ticks) this.machines.set(k, here)
    else this.machines.delete(k)
    if (cell.kind === 'chest' || cell.kind === 'freezer') this.stores.set(k, here)
    else this.stores.delete(k)
    if (isSensor(cell)) this.sensors.set(k, here)
    else this.sensors.delete(k)
    if (cell.kind === 'button') this.buttons.set(k, here)
    else this.buttons.delete(k)
    if (isTilled(cell) && cell.soil.weedChance < WEED_CHANCE) this.recover.set(k, here)
    else this.recover.delete(k)
    if (cell.kind === 'empty') this.empty.set(k, here)
    else this.empty.delete(k)
    if (isTilled(cell)) this.tilled.set(k, here)
    else this.tilled.delete(k)
    if (cell.kind === 'untilled' && cell.cover.kind === 'grass') this.tufts.set(k, here)
    else this.tufts.delete(k)
    if (cell.kind === 'rock' && origin) this.rocks.set(k, here)
    else this.rocks.delete(k)
  }

  private invalidateDirtEdges(at: Coord): void {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        this.dirtEdgeCache.delete(`${at.col + dc},${at.row + dr}`)
      }
    }
  }

  plotEdges(col: number, row: number): string {
    const k = `${col},${row}`
    const hit = this.dirtEdgeCache.get(k)
    if (hit !== undefined) return hit
    const t = (c: number, r: number) => this.inWorld({ col: c, row: r }) && isTilled(this.cell({ col: c, row: r }))
    const top = !t(col, row - 1)
    const right = !t(col + 1, row)
    const bottom = !t(col, row + 1)
    const left = !t(col - 1, row)
    const sig = `${top ? 1 : 0}${right ? 1 : 0}${bottom ? 1 : 0}${left ? 1 : 0}${t(col - 1, row) && t(col, row - 1) && !t(col - 1, row - 1) ? 1 : 0}${t(col + 1, row) && t(col, row - 1) && !t(col + 1, row - 1) ? 1 : 0}${t(col + 1, row) && t(col, row + 1) && !t(col + 1, row + 1) ? 1 : 0}${t(col - 1, row) && t(col, row + 1) && !t(col - 1, row + 1) ? 1 : 0}`
    this.dirtEdgeCache.set(k, sig)
    return sig
  }

  indexAll(): void {
    this.grow.clear()
    this.machines.clear()
    this.stores.clear()
    this.sensors.clear()
    this.buttons.clear()
    this.recover.clear()
    this.empty.clear()
    this.tilled.clear()
    this.tufts.clear()
    this.rocks.clear()
    this.dirtEdgeCache.clear()
    this.forEachCell((at, c) => this.track(at, c))
    this.rebuildWired()
  }

  statsCached(crop: CropId, variety: VarietyId): Stats {
    if (this.statsCacheGen !== this.modGen) {
      this.statsCache.clear()
      this.statsCacheGen = this.modGen
    }
    const k = `${crop}:${variety}`
    const hit = this.statsCache.get(k)
    if (hit !== undefined) return hit
    const st = statsOf(crop, variety, 0, this.modifiers)
    this.statsCache.set(k, st)
    return st
  }

  bakeQuality(p: Plant): number {
    const h = p.happiness
    const next = p.quality + qualityGain(h, HAPPY_START, HAPPY_MAX) + betterGain(p.crop, h, id => this.skillTier(id))
    return next < 0 ? 0 : next > 1 ? 1 : next
  }

  forEachCell(fn: (at: Coord, cell: Cell) => void): void {
    this.owned.forEach(id => {
      const g = this.gridOf(id)
      const { col0, row0 } = chunkRect(id)
      for (let row = 0; row < CHUNK; row++) {
        for (let col = 0; col < CHUNK; col++) {
          fn({ col: col0 + col, row: row0 + row }, g[row][col])
        }
      }
    })
  }

  private gridOf(id: ChunkId): Cell[][] {
    return this.chunks.get(chunkKey(id)) as Cell[][]
  }

  bounds(): { col0: number; row0: number; col1: number; row1: number } {
    let col0 = Infinity
    let row0 = Infinity
    let col1 = -Infinity
    let row1 = -Infinity
    this.owned.forEach(id => {
      const r = chunkRect(id)
      if (r.col0 < col0) col0 = r.col0
      if (r.row0 < row0) row0 = r.row0
      if (r.col1 > col1) col1 = r.col1
      if (r.row1 > row1) row1 = r.row1
    })
    return { col0, row0, col1, row1 }
  }

  expandPrice(): number {
    return 40 + 15 * this.purchases
  }

  stackMax(item: Countable): number {
    return crafted(item)
      ? STACK_MAX_CRAFTED + BULK_UP_CRAFTED_STEP * this.skillTier('bulk-up')
      : STACK_MAX + BULK_UP_STEP * this.skillTier('bulk-up')
  }

  
  expandSlots(): number {
    return (
      (this.done.has('unlock-expand') ? 1 : 0) +
      (this.done.has('expand-land') ? 1 : 0) +
      (this.done.has('eminent-domain') ? 1 : 0) +
      this.skillTier('inherit-land') +
      this.prizeSlots
    )
  }

  
  expandLeft(): number {
    const left = this.expandSlots() - this.purchases
    return left < 0 ? 0 : left
  }

  tax(): number {
    let n = 2 + 6 * (this.owned.length - 1)
    const cut = 0.02 * this.skillTier('tax')
    if (cut > 0) n *= 1 - cut
    return n < 1 ? 1 : n
  }

  hasSkill(id: SkillId): boolean {
    const m = SKILLS[id].member
    if (m === 'player') return this.family.player.owned.has(id as PlayerSkillId)
    if (m === 'husband') return this.family.husband.owned.has(id as HusbandSkillId)
    return this.family.daughter.owned.has(id as DaughterSkillId)
  }

  skillTier(id: SkillId): number {
    const m = SKILLS[id].member
    if (m === 'player') return this.family.player.owned.get(id as PlayerSkillId) ?? 0
    if (m === 'husband') return this.family.husband.owned.get(id as HusbandSkillId) ?? 0
    return this.family.daughter.owned.get(id as DaughterSkillId) ?? 0
  }

  offers(member: MemberId): SkillRef[] {
    return this.family[member].offers
  }

  walkSpeed(): number {
    return WALK * (1 + 0.05 * this.skillTier('boots'))
  }

  machineMul(): number {
    return 1 + 0.05 * this.skillTier('machinery')
  }

  furnaceMulFor(base: RectBase): number {
    return machines.furnaceMulFor(this, base)
  }

  skuPrice(id: SkuId): number {
    let p = SKUS[id].price
    const tab = SKUS[id].tab
    if (tab === 'utility' || tab === 'automation') p -= this.skillTier('haggling')
    if (p < 1) p = 1
    if (this.weather(this.clock.day) === 'drought' && (tab === 'seeds' || tab === 'utility')) p *= 2
    return p
  }

  marketOpen(): boolean {
    const p = this.clock.phase()
    const w = this.weather(this.clock.day)
    if (!this.hasSkill('open-24') && ((w === 'flood' && p === 'sunrise') || (w === 'drought' && p === 'day'))) return false
    if (p === 'sunrise' || p === 'day') return true
    if (p === 'sunset') return this.hasSkill('open-late')
    return this.hasSkill('open-24')
  }

  weather(day: number): WeatherKind {
    return this.weatherTable[day - 1]
  }

  pinnedTomorrow(): WeatherKind | undefined {
    return this.weatherPins.get(this.clock.day + 1)
  }

  pinTomorrow(kind: WeatherKind): void {
    this.weatherPins.set(this.clock.day + 1, kind)
    this.rebuildWeather()
    this.ping()
  }

  private rebuildWeather(): void {
    this.weatherTable = forecastWeather(this.rng.seed, WEATHER_THROUGH_DAY, this.weatherPins)
  }

  private applyWeatherRates(): void {
    const w = this.weather(this.clock.day)
    this.sources().forEach(s => {
      s.water.mul = sourceRateMul(s.water.kind, w)
    })
  }

  pullWater(sources: readonly Reservoir[], want: number): number {
    const before = sources.reduce((n, s) => n + (s.kind === 'pump' ? s.drawn : 0), 0)
    const got = pull(sources, want)
    const after = sources.reduce((n, s) => n + (s.kind === 'pump' ? s.drawn : 0), 0)
    this.pumpLiters += after - before
    return got
  }

  grantPoints(n: number): void {
    this.points += n
  }

  pickSkill(member: MemberId, slot: number): void {
    this.commit({ a: Act.pickSkill, t: this.now, p: this.local, m: member, s: slot })
  }

  faces(): ExpandFace[] {
    return place.faces(this)
  }

  expand(id: ChunkId): void {
    this.commit({ a: Act.expand, t: this.now, p: this.local, k: id })
  }

  skuOpen(id: SkuId): boolean {
    const s = SKUS[id]
    if (s.need === 'prize') return this.prizeStock(id) > 0
    if (s.need.length > 0 && !s.need.some(r => this.done.has(r))) return false
    return s.unlock === 'start' || this.done.has(s.unlock)
  }

  skuShown(id: SkuId): boolean {
    if (SKUS[id].need === 'prize') return this.prizeStock(id) > 0
    const s = SKUS[id].show
    return s === 'start' || this.done.has(s)
  }

  
  prizeStock(id: SkuId): number {
    return id === 'buy-freezer-large' ? this.prizeFreezers : 0
  }

  researchShown(id: ResearchId): boolean {
    const r = RESEARCH[id].reveal
    return r.length === 0 || r.some(p => this.done.has(p))
  }

  hasFence(at: Coord): boolean {
    return this.fences.has(`${at.col},${at.row}`)
  }

  fenceArms(at: Coord): { n: boolean; e: boolean; s: boolean; w: boolean } {
    return {
      n: this.hasFence({ col: at.col, row: at.row - 1 }),
      e: this.hasFence({ col: at.col + 1, row: at.row }),
      s: this.hasFence({ col: at.col, row: at.row + 1 }),
      w: this.hasFence({ col: at.col - 1, row: at.row }),
    }
  }

  hasPipe(e: Edge): boolean {
    return this.segments.has(edgeKey(e))
  }

  segmentAt(e: Edge): Segment | undefined {
    return this.segments.get(edgeKey(e))
  }

  conducts(e: Edge): boolean {
    const seg = this.segments.get(edgeKey(e))
    if (seg === undefined) return false
    const h = this.valveHold.get(edgeKey(e))
    if (h !== undefined) return h.level === 1
    return flows(seg)
  }

  hasValve(e: Edge): boolean {
    const seg = this.segments.get(edgeKey(e))
    return seg !== undefined && seg.gate.kind === 'valve'
  }

  valveWired(e: Edge): boolean {
    return this.valveHold.has(edgeKey(e))
  }

  sprinklerAt(v: Vertex): Sprinkler | undefined {
    return this.sprinklers.get(vertexKey(v))
  }

  eachNetVert(fn: (v: Vertex) => void): void {
    this.netVerts.forEach(k => {
      const i = k.indexOf(',')
      fn({ col: Number(k.slice(0, i)), row: Number(k.slice(i + 1)) })
    })
  }

  edgeOwned(e: Edge): boolean {
    return pipeOwned(e, at => this.inWorld(at))
  }

  vertexOwned(v: Vertex): boolean {
    return pipeVertexOwned(v, at => this.inWorld(at))
  }

  placePipe(e: Edge): void {
    this.commit({ a: Act.placePipe, t: this.now, p: this.local, e })
  }

  deletePipe(e: Edge): void {
    this.commit({ a: Act.delete, t: this.now, p: this.local, k: 'pipe', e })
  }

  toggleValve(e: Edge): void {
    const seg = this.segmentAt(e)
    if (seg?.gate.kind !== 'valve') return
    seg.gate = { kind: 'valve', open: !seg.gate.open }
    this.dirtyNets()
    this.ping()
  }

  openHud(target: HudTarget): void {
    this.commit({
      a: Act.openHud,
      t: this.now,
      p: this.local,
      k: target.kind,
      c: [target.at.col, target.at.row],
    })
  }

  openHudBody(target: HudTarget): void {
    this.hud = target
    this.ping()
  }

  closeHud(): void {
    this.commit({ a: Act.closeHud, t: this.now, p: this.local })
  }

  closeHudBody(): void {
    if (this.hud === undefined) return
    this.hud = undefined
    this.ping()
  }

  tuneSprinkler(at: Vertex, tune: Tune): void {
    this.commit({ a: Act.tuneSprinkler, t: this.now, p: this.local, c: [at.col, at.row], u: tune })
  }

  tuneSprinklerBody(at: Vertex, tune: Tune): void {
    const s = this.sprinklerAt(at)
    if (s === undefined) return
    s.tune = tune
    this.ping()
  }

  placeSprinkler(s: Sprinkler): void {
    this.commit({ a: Act.placeSprinkler, t: this.now, p: this.local, s })
  }

  deleteSprinkler(v: Vertex): void {
    this.commit({ a: Act.delete, t: this.now, p: this.local, k: 'sprinkler', c: [v.col, v.row] })
  }

  armDelete(): void {
    this.commit({ a: Act.armDelete, t: this.now, p: this.local })
  }

  armWire(from: WireEnd): void {
    this.commit({ a: Act.armWire, t: this.now, p: this.local, from })
  }

  armWireBody(from: WireEnd): void {
    if (!this.portLegal(from, 'from')) return
    this.act.place = { kind: 'wire', from }
    this.ping()
  }

  placeWire(from: WireEnd, to: WireEnd): void {
    this.commit({ a: Act.placeWire, t: this.now, p: this.local, from, to })
  }

  placeWireBody(from: WireEnd, to: WireEnd): void {
    if (this.act.place.kind !== 'wire') return
    if (!this.portLegal(from, 'from') || !this.portLegal(to, 'to')) return
    const next = this.wires.filter(w => !(sameNode(w.from, from) && sameNode(w.to, to)))
    if (next.length !== this.wires.length) {
      this.wires.length = 0
      next.forEach(w => this.wires.push(w))
      this.rebuildWired()
      this.act.place = { kind: 'none' }
      this.ping()
      return
    }
    if (
      wouldCycle(this.wires, from, to, end =>
        isSeqIn(end, end.kind === 'cell' && this.inWorld(end.at) ? this.cell(end.at) : undefined),
      )
    ) {
      return
    }
    this.wires.push({ from, to })
    this.rebuildWired()
    this.act.place = { kind: 'none' }
    this.ping()
  }

  deleteWire(from: WireEnd, to: WireEnd): void {
    this.commit({ a: Act.delete, t: this.now, p: this.local, k: 'wire', from, to })
  }

  deleteWireBody(from: WireEnd, to: WireEnd): void {
    if (this.act.place.kind !== 'delete') return
    const next = this.wires.filter(w => !sameEnd(w.from, from) || !sameEnd(w.to, to))
    if (next.length === this.wires.length) return
    this.wires.length = 0
    next.forEach(w => this.wires.push(w))
    this.rebuildWired()
    this.ping()
  }

  tuneWater(at: Coord, wilt: boolean, over: boolean): void {
    this.commit({ a: Act.tuneWater, t: this.now, p: this.local, c: [at.col, at.row], wilt, over })
  }

  tuneWaterBody(at: Coord, wilt: boolean, over: boolean): void {
    const c = this.cell(at)
    if (c.kind !== 'sensor-water') return
    c.wilt = wilt
    c.over = over
    this.ping()
  }

  tuneHarvest(at: Coord, mode: 'any' | 'all'): void {
    this.commit({ a: Act.tuneHarvest, t: this.now, p: this.local, c: [at.col, at.row], mode })
  }

  tuneHarvestBody(at: Coord, mode: 'any' | 'all'): void {
    const c = this.cell(at)
    if (c.kind !== 'sensor-harvest') return
    c.mode = mode
    this.ping()
  }

  tuneCounter(at: Coord, n: number): void {
    this.commit({ a: Act.tuneCounter, t: this.now, p: this.local, c: [at.col, at.row], n })
  }

  tuneCounterBody(at: Coord, n: number): void {
    if (!Number.isInteger(n) || n < 1 || n > COUNTER_MAX) return
    const c = this.cell(at)
    if (c.kind !== 'counter') return
    c.n = n
    this.ping()
  }

  resetCounter(at: Coord): void {
    this.commit({ a: Act.resetCounter, t: this.now, p: this.local, c: [at.col, at.row] })
  }

  resetCounterBody(at: Coord): void {
    const c = this.cell(at)
    if (c.kind !== 'counter') return
    c.count = 0
    this.ping()
  }

  tuneDay(at: Coord, sunrise: boolean, day: boolean, sunset: boolean, twilight: boolean): void {
    this.commit({
      a: Act.tuneDay,
      t: this.now,
      p: this.local,
      c: [at.col, at.row],
      sunrise,
      day,
      sunset,
      twilight,
    })
  }

  tuneDayBody(at: Coord, sunrise: boolean, day: boolean, sunset: boolean, twilight: boolean): void {
    const c = this.cell(at)
    if (c.kind !== 'sensor-day') return
    c.sunrise = sunrise
    c.day = day
    c.sunset = sunset
    c.twilight = twilight
    this.ping()
  }

  dropWires(gone: (w: Wire) => boolean): void {
    const next = dropIncident(this.wires, gone)
    this.wires.length = 0
    next.forEach(w => this.wires.push(w))
    this.rebuildWired()
  }

  private portLegal(end: WireEnd, side: 'from' | 'to'): boolean {
    const c = end.kind === 'cell' && this.inWorld(end.at) ? this.cell(end.at) : undefined
    if (side === 'from') return isOutEnd(end, c)
    const on = this.done.has('unlock-smart-irrigation')
    const valve = on && end.kind === 'valve' && this.hasValve(end.e)
    const sprinkler = on && end.kind === 'sprinkler' && this.sprinklerAt(end.at) !== undefined
    return isInEnd(end, c, valve, sprinkler)
  }

  rotatePlace(): void {
    this.commit({ a: Act.rotatePlace, t: this.now, p: this.local })
  }

  deleteBuilding(at: Coord): void {
    this.commit({ a: Act.delete, t: this.now, p: this.local, k: 'building', c: [at.col, at.row] })
  }

  sources(): { base: Base; water: Reservoir }[] {
    return [...this.pumps, ...this.tanks, ...this.wells]
  }

  dirtyNets(): void {
    this.nets = undefined
  }

  netOfVertex(v: Vertex): Net | undefined {
    return nets.netOfVertex(this, v)
  }

  netOfCell(base: Base): Net | undefined {
    return nets.netOfCell(this, base)
  }

  vertexWet(v: Vertex): boolean {
    return nets.vertexWet(this, v)
  }

  pendingWet(e: Edge): boolean {
    return nets.pendingWet(this, e)
  }

  private dropTargetCachesAt(at: Coord): void {
    nets.dropTargetCachesAt(this, at)
  }

  rebuildWired(): void {
    nets.rebuildWired(this)
  }

  demand(s: Sprinkler): number {
    return nets.demand(this, s)
  }

  rate(v: Vertex): number {
    return nets.rate(this, v)
  }

  prompt(at: Coord): Prompt {
    this.act = this.seats[this.local]
    return readPrompt(this, at)
  }

  promptHit(hit: PromptHit | undefined): Prompt {
    this.act = this.seats[this.local]
    return readPromptHit(this, hit)
  }

  say(text: string): void {
    this.speech = { kind: 'say', text, left: SPEECH_S }
    this.ping()
  }

  click(at: Coord): 'queued' | 'placed' | 'blocked' | 'noop' {
    return this.commit({ a: Act.click, t: this.now, p: this.local, c: [at.col, at.row] })
  }

  clickValve(e: Edge): void {
    this.commit({ a: Act.clickValve, t: this.now, p: this.local, e })
  }

  ackCue(): void {
    this.commit({ a: Act.ackCue, t: this.now, p: this.local })
  }

  ackCueBody(): void {
    this.act.cue = { kind: 'none' }
    this.ping()
  }

  enqueue(i: Intent): void {
    this.enqueueOn(this.seats[this.local], i)
  }

  enqueueOn(seat: Seat, i: Intent): void {
    if (seat.queue.length >= QUEUE_CAP) return
    const start = seat.queue.length === 0
    seat.queue.push(i)
    if (start) {
      this.act = seat
      queue.markWalk(this, i)
    }
    this.ping()
  }

  taskName(i: Intent): TaskName {
    return queue.taskName(this, i)
  }

  taskProgress(): number {
    return queue.taskProgress(this)
  }

  buy(id: SkuId): BuyFail | undefined {
    return this.commit({ a: Act.buy, t: this.now, p: this.local, s: id })
  }

  confirmPlace(at: Coord): void {
    place.confirmPlace(this, at)
  }

  cancelPlace(): void {
    this.commit({ a: Act.cancelPlace, t: this.now, p: this.local })
  }

  rightClick(at: Coord): void {
    this.commit({ a: Act.rightClick, t: this.now, p: this.local, c: [at.col, at.row] })
  }

  swap(i: number): void {
    this.commit({ a: Act.swap, t: this.now, p: this.local, i })
  }

  swapBody(i: number): void {
    const held = this.act.hand
    this.act.hand = this.act.inventory[i]
    this.act.inventory[i] = held
    this.compactInventory()
    this.ping()
  }

  swapChest(at: Coord, i: number): void {
    this.commit({ a: Act.swapChest, t: this.now, p: this.local, c: [at.col, at.row], i })
  }

  swapChestBody(at: Coord, i: number): void {
    const cell = this.cell(at)
    if (cell.kind !== 'chest' && cell.kind !== 'freezer') return
    const held = this.act.hand
    this.act.hand = cell.slots[i]
    cell.slots[i] = held
    compactSlots(cell.slots)
    this.ping()
  }

  compactInventory(): void {
    compactSlots(this.act.inventory)
  }

  drive(throttle: -1 | 0 | 1, steer: -1 | 0 | 1): void {
    this.commit({ a: Act.drive, t: this.now, p: this.local, throttle, steer })
  }

  stride(x: -1 | 0 | 1, y: -1 | 0 | 1): void {
    this.commit({ a: Act.stride, t: this.now, p: this.local, x, y })
  }

  strideBody(x: -1 | 0 | 1, y: -1 | 0 | 1): void {
    if (this.driverVehicle(this.act.id) !== undefined) return
    this.act.stride = { x, y }
    this.ping()
  }

  buyVehicle(at: Coord, k: VehicleKind): void {
    this.commit({ a: Act.buyVehicle, t: this.now, p: this.local, c: [at.col, at.row], k })
  }

  buyTrailer(at: Coord, k: TrailerKind): void {
    this.commit({ a: Act.buyTrailer, t: this.now, p: this.local, c: [at.col, at.row], k })
  }

  deploy(id: VehicleId, at: Coord, hitch: TrailerId | 'none'): void {
    this.commit({ a: Act.deploy, t: this.now, p: this.local, v: id, c: [at.col, at.row], hitch })
  }

  embark(id: VehicleId): void {
    this.commit({ a: Act.embark, t: this.now, p: this.local, v: id })
  }

  disembark(): void {
    this.commit({ a: Act.disembark, t: this.now, p: this.local })
  }

  dock(): void {
    this.commit({ a: Act.dock, t: this.now, p: this.local })
  }

  swapVehicle(id: VehicleId, i: VehicleSlot): void {
    this.commit({ a: Act.swapVehicle, t: this.now, p: this.local, v: id, i })
  }

  swapTrailer(u: TrailerId, i: HarvestSlot): void {
    this.commit({ a: Act.swapTrailer, t: this.now, p: this.local, u, i })
  }

  refill(at: Coord): void {
    this.commit({ a: Act.refill, t: this.now, p: this.local, c: [at.col, at.row] })
  }

  refillCost(): number {
    return this.vehicles.reduce((n, v) => n + (1 - v.fuel) * QUAD_REFILL, 0)
  }

  setBoom(w: 3 | 5): void {
    this.commit({ a: Act.setBoom, t: this.now, p: this.local, w })
  }

  load(): void {
    this.commit({ a: Act.load, t: this.now, p: this.local })
  }

  unload(): void {
    this.commit({ a: Act.unload, t: this.now, p: this.local })
  }

  createRoute(): void {
    this.commit({ a: Act.route, t: this.now, p: this.local, k: 'create' })
  }

  assignRoute(v: VehicleId, r: RouteId | 'none'): void {
    this.commit({ a: Act.route, t: this.now, p: this.local, k: 'assign', v, r })
  }

  addStop(r: RouteId, s: RouteStop): void {
    this.commit({ a: Act.route, t: this.now, p: this.local, k: 'add', r, s })
  }

  removeStop(r: RouteId, i: number): void {
    this.commit({ a: Act.route, t: this.now, p: this.local, k: 'remove', r, i })
  }

  reorderStop(r: RouteId, i: number, d: 1 | -1): void {
    this.commit({ a: Act.route, t: this.now, p: this.local, k: 'reorder', r, i, d })
  }

  renameRoute(r: RouteId, n: string): void {
    this.commit({ a: Act.route, t: this.now, p: this.local, k: 'rename', r, n })
  }

  startRoute(): void {
    this.commit({ a: Act.route, t: this.now, p: this.local, k: 'start' })
  }

  automate(v: VehicleId, at: Coord): void {
    this.commit({ a: Act.route, t: this.now, p: this.local, k: 'automate', v, c: [at.col, at.row] })
  }

  routeById(id: RouteId): Route | undefined {
    return this.routes.find(r => r.id === id)
  }

  stopAt(at: Coord, xy: { x: number; y: number }): RouteStop | undefined {
    const hit = vehicles.padHit(this, at)
    if (hit !== undefined && hit.side === 'dropoff') return { kind: 'unload', at: { col: at.col, row: at.row } }
    if (hit !== undefined && hit.side === 'takeup') return { kind: 'load', at: { col: at.col, row: at.row } }
    if (this.inWorld(at) && this.cell(at).kind === 'traffic-light') return { kind: 'wait', at: { col: at.col, row: at.row } }
    if (this.inWorld(at)) return { kind: 'goto', x: xy.x, y: xy.y }
    return undefined
  }

  enter(): void {
    const driven = this.driverVehicle(this.local)
    if (driven !== undefined) {
      this.disembark()
      return
    }
    const actor = this.seats[this.local].actor
    let best: Vehicle | undefined
    let bestD = Infinity
    this.vehicles.forEach(v => {
      if (v.pose.kind !== 'field' || v.pose.driver !== 'none') return
      const d = Math.hypot(actor.x - v.pose.x, actor.y - v.pose.y)
      if (d > 1.5) return
      if (best === undefined || d < bestD) {
        best = v
        bestD = d
      }
    })
    if (best?.pose.kind !== 'field') return
    this.seats[this.local].actor.x = best.pose.x
    this.seats[this.local].actor.y = best.pose.y
    this.embark(best.id)
  }

  driverVehicle(id: SeatId): Vehicle | undefined {
    return vehicles.driverVehicle(this, id)
  }

  parkedAt(at: Coord): Vehicle | undefined {
    return this.vehicles.find(
      v =>
        v.pose.kind === 'field' &&
        v.pose.driver === 'none' &&
        Math.floor(v.pose.x) === at.col &&
        Math.floor(v.pose.y) === at.row,
    )
  }

  hangarOrigin(at: Coord): Coord | undefined {
    if (!this.inWorld(at)) return undefined
    const c = this.cell(at)
    if (c.kind !== 'hangar') return undefined
    return { col: c.base.col, row: c.base.row }
  }

  hangarStores(origin: Coord): boolean {
    return this.vehicles.some(v => vehicles.storedHere(v.pose, origin)) || this.trailers.some(t => vehicles.storedHere(t.pose, origin))
  }

  hangarAtPad(at: Coord): Hangar | undefined {
    return this.hangars.find(h => hangarPad(h.base).some(p => p.col === at.col && p.row === at.row))
  }

  vehicleCargo(): boolean {
    const v = this.driverVehicle(this.local)
    if (v?.pose.kind !== 'field') return false
    if (v.kind === 'tractor' && v.hitch === 'none') return false
    return true
  }

  onDropoffPad(): boolean {
    return this.padSideOfLocal() === 'dropoff'
  }

  onTakeupPad(): boolean {
    return this.padSideOfLocal() === 'takeup'
  }

  canLoad(): boolean {
    this.act = this.seats[this.local]
    return vehicles.loadWould(this)
  }

  canUnload(): boolean {
    this.act = this.seats[this.local]
    return vehicles.unloadWould(this)
  }

  machinePads(): { col: number; row: number; side: 'dropoff' | 'takeup'; legal: boolean }[] {
    this.act = this.seats[this.local]
    const v = this.driverVehicle(this.local)
    const floor =
      v !== undefined && v.pose.kind === 'field'
        ? { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) }
        : undefined
    const out: { col: number; row: number; side: 'dropoff' | 'takeup'; legal: boolean }[] = []
    this.padBuildings().forEach(b => {
      dropoffPad(b.base).forEach(p => {
        const on = floor !== undefined && p.col === floor.col && p.row === floor.row
        out.push({ col: p.col, row: p.row, side: 'dropoff', legal: on && vehicles.unloadWould(this) })
      })
      takeupPad(b.base).forEach(p => {
        const on = floor !== undefined && p.col === floor.col && p.row === floor.row
        out.push({ col: p.col, row: p.row, side: 'takeup', legal: on && vehicles.loadWould(this) })
      })
    })
    return out
  }

  machineLinks(): { x: number; y: number; side: 'in' | 'out' }[] {
    const out: { x: number; y: number; side: 'in' | 'out' }[] = []
    for (const at of this.machines.values()) {
      const c = this.cell(at)
      if (!isIoCell(c)) continue
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      const west = machineWest(c.base)
      if (this.inWorld(west)) {
        const s = this.cell(west)
        if (s.kind === 'chest' || s.kind === 'freezer') out.push({ x: c.base.col - 0.5, y: c.base.row, side: 'in' })
      }
      const east = machineEast(c.base)
      if (this.inWorld(east)) {
        const s = this.cell(east)
        if (s.kind === 'chest' || s.kind === 'freezer') {
          out.push({ x: c.base.col + c.base.w - 0.5, y: c.base.row, side: 'out' })
        }
      }
    }
    return out
  }

  unlockAll(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'all' })
  }

  unlockAllBody(): void {
    ;(Object.keys(RESEARCH) as ResearchId[]).forEach(id => {
      this.done.add(id)
    })
    this.money += 999
    this.job = { kind: 'idle' }
    this.points = 99
    this.ping()
  }

  unlockAllSkills(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'skills' })
  }

  cheatMoney(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'money' })
  }

  cheatMoneyBody(): void {
    this.money += 200
    this.ping()
  }

  cheatPoints(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'points' })
  }

  cheatPointsBody(): void {
    this.points += 10
    this.ping()
  }

  toggleCheatResearch(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'research' })
  }

  toggleCheatResearchBody(): void {
    this.cheatFastResearch = !this.cheatFastResearch
    this.ping()
  }

  setCheatSpeed(n: 1 | 3): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'speed', n })
  }

  setCheatSpeedBody(n: 1 | 3): void {
    this.cheatSpeed = n
    this.ping()
  }

  endDay(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'day' })
  }

  endDayBody(): void {
    if (this.seam.kind === 'recap') return
    this.clock.t = DAY_SECONDS
    this.ping()
  }

  buyPacks(id: SkuId): void {
    this.commit({ a: Act.buyPacks, t: this.now, p: this.local, s: id })
  }

  packsPrice(id: SkuId): number {
    return place.packsPrice(this, id)
  }

  buyPacksFail(id: SkuId): BuyFail | 'Locked' | undefined {
    return place.buyPacksFail(this, id)
  }

  
  putSilo(crop: AnnualId, variety: VarietyId, quality: number, count: number): number {
    return store.putSilo(this, crop, variety, quality, count)
  }

  takeSilo(crop: AnnualId, variety: VarietyId): void {
    this.commit({ a: Act.takeStore, t: this.now, p: this.local, k: 'silo', c: crop, r: variety })
  }

  

  
  putAdditive(id: AdditiveId, liters: number): number {
    return store.putAdditive(this, id, liters)
  }

  putSugar(liters: number, unitSale: number, quality: number): number {
    return putSugarInto(this.additives, liters, unitSale, quality)
  }

  takeSugar(): void {
    this.commit({ a: Act.takeStore, t: this.now, p: this.local, k: 'sugar', d: 'sugar' })
  }

  takeAdditive(id: AdditiveId): void {
    this.commit({ a: Act.takeStore, t: this.now, p: this.local, k: 'additive', d: id })
  }

  

  marketQuote(): SellAllQuote {
    return store.marketQuote(this)
  }

  marketGain(): number {
    if (!this.marketOpen()) return 0
    return this.marketQuote().paid
  }

  nowDay(): number {
    return this.clock.day - 1 + this.clock.t / DAY_SECONDS
  }

  contractSlots(): number {
    return CONTRACT_OFFERS + (this.skillTier('broker') >= 1 ? 1 : 0)
  }

  contractCap(): number {
    return CONTRACT_ACTIVE + (this.skillTier('broker') >= 2 ? 1 : 0)
  }

  acceptContract(c: ContractId): void {
    this.commit({ a: Act.acceptContract, t: this.now, p: this.local, c })
  }

  cancelContract(c: ContractId): void {
    this.commit({ a: Act.cancelContract, t: this.now, p: this.local, c })
  }

  reorderContract(c: ContractId, d: 1 | -1): void {
    this.commit({ a: Act.reorderContract, t: this.now, p: this.local, c, d })
  }

  sellAll(): void {
    this.commit({ a: Act.sellAll, t: this.now, p: this.local })
  }

  
  researchOpen(id: ResearchId): boolean {
    return RESEARCH[id].requires.every(r => this.done.has(r))
  }

  startResearch(id: ResearchId): void {
    this.commit({ a: Act.startResearch, t: this.now, p: this.local, r: id })
  }

  startResearchBody(id: ResearchId): void {
    if (this.job.kind === 'run') return
    if (this.done.has(id)) return
    if (!this.researchOpen(id)) return
    const def = RESEARCH[id]
    if (this.money < def.cost) return
    this.money -= def.cost
    this.job = { kind: 'run', id, left: def.seconds }
    this.ping()
  }

  dismissRecap(): void {
    this.commit({ a: Act.dismissRecap, t: this.now, p: this.local })
  }

  dismissRecapBody(): void {
    if (this.seam.kind !== 'recap') return
    this.grantPoints(POINTS_PER_DAY)
    this.seam = { kind: 'play' }
    this.clock.banner = 2
    this.ping()
  }

  tick(rawDt: number): void {
    this.now += 1
    const dt = rawDt > DT_MAX ? DT_MAX : rawDt
    if (this.seam.kind === 'recap') return
    this.applyWeatherRates()
    const beforeDay = this.nowDay()
    const seam = this.clock.advance(dt) === 'seam'
    if (seam) {
      this.seats.forEach(s => {
        s.workLeft = 0
        s.workTotal = 0
        s.filling = false
      })
      tickContractsFn(this, beforeDay, this.nowDay())
      this.money += DAY_STIPEND
      const tax = this.tax()
      this.money -= tax
      const bill = this.pumpLiters * PUMP_COST_PER_L * pumpCostMul(this.weather(this.clock.day - 1))
      this.money -= bill
      this.pumpLiters = 0
      field.tickTreesSeam(this)
      this.seam = {
        kind: 'recap',
        recap: {
          day: this.clock.day - 1,
          money: this.money,
          stipend: DAY_STIPEND,
          died: this.tally.died,
          harvests: this.tally.harvests,
          research: this.tally.research,
          tax,
          water: bill,
          contracts: this.tally.contracts,
        },
      }
      this.tally = { died: 0, harvests: 0, research: [], contracts: [] }
      if (this.done.has('unlock-contracts') && this.contracts.takenToday.length === 0) addRep(this, -REP_IDLE)
      this.contracts.takenToday = []
      this.contracts.repDay = this.contracts.rep
      this.ping()
      return
    }
    tick.tickSpeech(this, dt)
    tick.tickJob(this, dt)
    tick.tickButtons(this)
    this.seats.forEach(s => {
      if (s.presence !== 'in') return
      if (this.driverVehicle(s.id) !== undefined) return
      this.act = s
      if (s.stride.x !== 0 || s.stride.y !== 0) {
        s.queue.length = 0
        s.workLeft = 0
        s.workTotal = 0
        s.filling = false
        const hypot = Math.hypot(s.stride.x, s.stride.y)
        const step = this.walkSpeed() * dt
        s.actor.x += (s.stride.x / hypot) * step
        s.actor.y += (s.stride.y / hypot) * step
        return
      }
      queue.tickQueue(this, dt)
    })
    this.act = this.seats[0]
    vehicles.tickVehicles(this, dt)
    field.tickField(this, dt)
    nets.gatherWater(this, dt)
    nets.evalSensors(this, dt)
    vehicles.tickDispatch(this, dt)
    machines.tickMachines(this, dt)
    nets.tickWater(this, dt)
    tick.tickFreshness(this, dt)
    tick.tickBig(this, dt)
    tickContractsFn(this, beforeDay, this.nowDay())
    STALL_IDS.forEach(id => {
      this.stall[id].sat = recover(this.stall[id].sat, dt)
    })
  }

  burst(id: VfxId, at: Coord): void {
    this.burstSeq += 1
    this.bursts.push({ id, at: { ...at }, seq: this.burstSeq })
  }

  drainBursts(): Burst[] {
    return this.bursts.splice(0, this.bursts.length)
  }

  dropSpot(at: Coord): Coord | undefined {
    return machines.dropSpot(this, at)
  }

  canTend(at: Coord): boolean {
    return field.canTend(this, at)
  }

  neighbourWatch(at: Coord): { crop: CropId; tree: boolean; reach: Coord[]; ok: boolean } | undefined {
    return field.neighbourWatch(this, at)
  }

  canGraft(at: Coord): boolean {
    return field.canGraft(this, at)
  }

  

  padBuildings(): PadCell[] {
    return vehicles.padBuildings(this)
  }

  private padSideOfLocal(): 'dropoff' | 'takeup' | undefined {
    const v = this.driverVehicle(this.local)
    if (v?.pose.kind !== 'field') return undefined
    const hit = vehicles.padHit(this, { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) })
    return hit === undefined ? undefined : hit.side
  }

  canStation(at: Coord): boolean {
    return machines.canStation(this, at)
  }

}

