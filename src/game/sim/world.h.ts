import type { Actor } from './actor.ts'
import type {
  AdditiveStore,
  ChunkId,
  Coord,
  Hangar,
  House,
  PotStill,
  Pump,
  RainTank,
  SeedSilo,
  SiloProduce,
  SiloSeed,
  SiloSpray,
  Tap,
  Truck,
  Well,
} from './building.ts'
import type { Drop } from './drop.ts'
import type {
  DaughterSkillId,
  HusbandSkillId,
  PlayerSkillId,
  ResearchId,
  RouteId,
  SkillId,
  SkuId,
  TrailerId,
  VehicleId,
  VfxId,
} from './ids.ts'
import type { Hand, Slot } from './item.ts'
import type { LogSink } from './log.ts'
import type { Contracts, HistoryEntry } from './feature-contracts/market.h.ts'
import type { Cell } from './plot.ts'
import type { Edge, Segment, Sprinkler, Vertex } from './pipe.ts'
import type { Rng } from './rng.ts'
import type { Reservoir } from './water.ts'
import type { Drive, Route, Trailer, Vehicle } from './feature-vehicles/vehicle.h.ts'
import type { StallMap } from './stall.ts'
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
