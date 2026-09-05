import type { World } from './world.ts'
import { VARIETY, type VarietyId } from '../defs/varieties.ts'
import type { AnnualId, DaughterSkillId, HusbandSkillId, PlayerSkillId, ResearchId, SkillId, RouteId, SkuId, TrailerId, VehicleId, VfxId } from './ids.ts'
import { Actor } from './actor.ts'
import { AdditiveStore, DOOR, Hangar, SiloProduce, SiloSeed, SiloSpray, House, PAD, PotStill, Pump, RainTank, SeedSilo, Tap, Well, Truck, occupiedCells, type Base, type ChunkId, type Coord } from './building.ts'
import type { Drop } from './drop.ts'
import { makeShovel, type Hand, type Item, type Slot } from './item.ts'
import type { Contracts, HistoryEntry } from './market.h.ts'
import type { StallMap } from './stall.ts'
import type { Cell } from './plot.ts'
import type { Edge, Segment, Sprinkler, Vertex } from './pipe.ts'
import { Reservoir } from './water.ts'
import type { LogSink } from './log.ts'
import { Rng } from './rng.ts'
import type { Drive, Route, Trailer, Vehicle } from './vehicle.ts'
import type { ValveHold, WaterSystem, Wire, WireEnd } from './sensor.ts'

export type Intent =
  | { act: 'walk'; at: Coord }
  | { act: 'shovel'; at: Coord }
  | { act: 'mine'; at: Coord }
  | { act: 'plant'; at: Coord }
  | { act: 'water'; at: Coord }
  | { act: 'fertilize'; at: Coord }
  | { act: 'compost'; at: Coord }
  | { act: 'harvest'; at: Coord }
  | { act: 'fill'; at: Coord }
  | { act: 'consign' }
  | { act: 'pickup'; at: Coord }
  | { act: 'drop'; at: Coord }
  | { act: 'inventory' }
  | { act: 'chest'; at: Coord }
  | { act: 'silo'; at: Coord }
  | { act: 'additives'; at: Coord }
  | { act: 'grind'; at: Coord }
  | { act: 'still'; at: Coord }
  | { act: 'furnace'; at: Coord }
  | { act: 'station'; at: Coord }
  | { act: 'barrel'; at: Coord }
  | { act: 'jam'; at: Coord }
  | { act: 'mill'; at: Coord }
  | { act: 'hangar'; at: Coord }
  | { act: 'vehicle'; id: VehicleId }
  | { act: 'embark'; id: VehicleId }
  | { act: 'valve'; at: Coord; edge: Edge }
  | { act: 'toggle'; at: Coord }
  | { act: 'tend'; at: Coord }
  | { act: 'weed-spray'; at: Coord }
  | { act: 'chop'; at: Coord }
  | { act: 'graft'; at: Coord }

export type TaskName = string

export type Cue =
  | { kind: 'none' }
  | { kind: 'inventory' }
  | { kind: 'chest'; at: Coord }
  | { kind: 'silo'; at: Coord }
  | { kind: 'additives'; at: Coord }
  | { kind: 'hangar'; at: Coord }
  | { kind: 'station'; at: Coord }
  | { kind: 'vehicle'; id: VehicleId }

export type Speech = { kind: 'none' } | { kind: 'say'; text: string; left: number }

export type Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
  | { kind: 'wire'; from: WireEnd }
  | { kind: 'delete' }

export type StayArmed =
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'buy-lever'
  | 'buy-button'
  | 'buy-lamp'
  | 'buy-or'
  | 'buy-and'
  | 'buy-not'
  | 'buy-pulser'
  | 'buy-counter'
  | 'buy-sensor-water'
  | 'buy-sensor-fert'
  | 'buy-sensor-harvest'
  | 'buy-sensor-day'
  | 'buy-water-system'
  | 'buy-vehicle-detector'
  | 'buy-traffic-light'
  | 'delete'

export type SeatId = 0 | 1 | 2 | 3
export type Presence = 'in' | 'away'
export type PlayerId = string

export type Seat = {
  id: SeatId
  playerId: PlayerId
  name: string
  actor: Actor
  hand: Hand
  inventory: Slot[]
  queue: Intent[]
  presence: Presence
  napping: boolean
  cue: Cue
  place: Place
  drive: Drive
  stride: { x: -1 | 0 | 1; y: -1 | 0 | 1 }
  workLeft: number
  workTotal: number
  filling: boolean
  legStart: { x: number; y: number }
}

export type Burst = { id: VfxId; at: Coord; seq: number }

export type BuyFail = 'Cannot afford' | 'Inventory full' | 'Seed silo full' | 'Additive store full'

export type Net = {
  sources: Reservoir[]
  sprinklers: Sprinkler[]
  taps: Tap[]
  stills: PotStill[]
  waterSystems: WaterSystem[]
}

export type HudTarget =
  | { kind: 'sprinkler'; at: Vertex }
  | { kind: 'water'; at: Coord }
  | { kind: 'harvest'; at: Coord }
  | { kind: 'counter'; at: Coord }
  | { kind: 'day'; at: Coord }

export type DayTally = { died: number; harvests: number; research: ResearchId[]; contracts: HistoryEntry[] }

export type Recap = {
  day: number
  money: number
  stipend: number
  died: number
  harvests: number
  research: ResearchId[]
  tax: number
  water: number
  contracts: HistoryEntry[]
}

export type Seam = { kind: 'play' } | { kind: 'recap'; recap: Recap }

export type SkillRef<Id extends SkillId = SkillId> = { id: Id; tier: number }

export type MemberState<Id extends SkillId> = {
  pickCount: number
  owned: Map<Id, number>
  offers: SkillRef<Id>[]
}

export type Family = {
  player: MemberState<PlayerSkillId>
  husband: MemberState<HusbandSkillId>
  daughter: MemberState<DaughterSkillId>
}

export type ExpandFace = { id: ChunkId; dir: 'n' | 'e' | 's' | 'w'; at: Coord; price: number }

export type Job = { kind: 'idle' } | { kind: 'run'; id: ResearchId; left: number }

export type Hydrate = {
  rng: Rng
  sink: LogSink
  house: House
  truck: Truck
  silo: SeedSilo
  additives: AdditiveStore
  pumps: Pump[]
  tanks: RainTank[]
  taps: Tap[]
  stills: PotStill[]
  waterSystems: WaterSystem[]
  wires: Wire[]
  valveHold: ValveHold[]
  hangars: Hangar[]
  seedSilos: SiloSeed[]
  spraySilos: SiloSpray[]
  produceSilos: SiloProduce[]
  vehicles: Vehicle[]
  nextVehicleId: VehicleId
  trailers: Trailer[]
  nextTrailerId: TrailerId
  routes: Route[]
  nextRouteId: RouteId
  stall: StallMap
  family: Family
  points: number
  seats: Seat[]
  owned: ChunkId[]
  chunks: Map<string, Cell[][]>
  clock: { day: number; t: number }
  money: number
  rep: number
  repDay: number
  contracts: Contracts
  purchases: number
  prizeSlots: number
  prizeFreezers: number
  bigTicks: number
  done: ResearchId[]
  job: Job
  tally: DayTally
  seam: Seam
  segments: Segment[]
  wells: Well[]
  sprinklers: Sprinkler[]
  fences: Coord[]
  drops: Drop[]
  clearance: number
}

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

function destOrigin(c: { base: Base }, owned: readonly ChunkId[]): Coord {
  if (c.base.shape === 'circle') return occupiedCells(c.base, owned)[0]
  return { col: c.base.col, row: c.base.row }
}

export function dest(i: Intent, w: World): Coord {
  if (i.act === 'fill' || i.act === 'hangar' || i.act === 'silo' || i.act === 'still' || i.act === 'furnace') {
    const c = w.cell(i.at)
    if ('base' in c) return destOrigin(c, w.owned)
    return { ...i.at }
  }
  if (i.act === 'consign') return { ...PAD }
  if (i.act === 'inventory') return { ...DOOR }
  if (i.act === 'toggle') return i.at
  if (i.act === 'vehicle' || i.act === 'embark') {
    const v = w.vehicles.find(x => x.id === i.id)
    if (v !== undefined && v.pose.kind === 'field') {
      return { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) }
    }
    return { col: Number.POSITIVE_INFINITY, row: Number.POSITIVE_INFINITY }
  }
  return i.at
}

export type PingKind = 'dirty' | 'poured' | 'sold'

export type DirtyReason = 'act' | 'field' | 'big' | 'speech' | 'vfx'
