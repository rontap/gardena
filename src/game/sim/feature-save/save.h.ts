import type { VarietyId } from '../../defs/varieties.ts'
import type {
  AdditiveHold,
  Base,
  ChunkId,
  Coord,
  RectBase,
  SiloStack,
  SugarBin,
  TreeYield,
} from '../building.ts'
import type { Cover, Ground } from '../plot.ts'
import type {
  AnnualId,
  BarrelCrop,
  CropId,
  DaughterSkillId,
  HusbandSkillId,
  JamCrop,
  MillRecipe,
  PlayerSkillId,
  ResearchId,
  RouteId,
  StallGoodId,
  StillCrop,
  TrailerId,
  TreeId,
  VehicleId,
} from '../ids.ts'
import type { Hand, Item, Slot } from '../item.ts'
import type { CompanyBook, ContractId, ContractOffer, Demand, HistoryEntry } from '../feature-contracts/market.h.ts'
import type { Edge, Segment, Sprinkler } from '../pipe.ts'
import type { Wire } from '../sensor.ts'
import type { Presence, SeatId, World } from '../world.ts'
import type { Route, SeedHopper, SprayHopper, TrailerPose } from '../feature-vehicles/vehicle.h.ts'

export type LoadFailReason = 'unknown-format' | 'not-gardena' | 'version' | 'unusable'

export type LoadResult = { ok: true; world: World } | { ok: false; reason: LoadFailReason }

export type SaveRng = { seed: number; fruit: number }

export type SaveMember<Id> = {
  pickCount: number
  owned: { id: Id; tier: number }[]
  offers: { id: Id; tier: number }[]
}

export type SaveStallGood = {
  offered: number
  market: number
  target: number
  acc: number
  stock: { [K in VarietyId]: { organic: number; synth: number } }
  worth: { [K in VarietyId]: { organic: number; synth: number } }
}

export type SaveSoil = { water: number; fertilizer: number; bio: boolean; weedChance: number }

export type SavePlant = {
  crop: AnnualId
  variety: VarietyId
  quality: number
  maturity: number
  freshness: number
  happiness: number
  bio: boolean
  tended: boolean
}

export type SaveWeed = { variant: 0 | 1; maturity: number; spread: boolean }
export type SaveTurf = { variant: 0 | 1 | 2; maturity: number }

export type SaveCell =
  | { kind: 'untilled'; ground: Ground; cover: Cover }
  | { kind: 'empty'; soil: SaveSoil }
  | { kind: 'infertile' }
  | { kind: 'weed'; soil: SaveSoil; weed: SaveWeed }
  | { kind: 'turf'; soil: SaveSoil; turf: SaveTurf }
  | { kind: 'growing'; soil: SaveSoil; plant: SavePlant }
  | { kind: 'ripe'; soil: SaveSoil; plant: SavePlant }
  | { kind: 'dead'; soil: SaveSoil; plant: SavePlant }
  | { kind: 'rotten'; soil: SaveSoil; crop: CropId }
  | { kind: 'house'; base: RectBase }
  | { kind: 'pump'; form: 'starter' | 'jack'; base: Base; stored: number }
  | { kind: 'rain-tank'; base: RectBase; stored: number }
  | { kind: 'tap'; base: RectBase }
  | { kind: 'well'; base: RectBase; stored: number }
  | { kind: 'rock'; base: RectBase }
  | { kind: 'tree'; species: TreeId; base: RectBase; juvenile: number; fruit: number; yield: TreeYield; tended: boolean; trunk: boolean; variety: VarietyId }
  | { kind: 'chest'; base: RectBase; slots: Slot[]; out: 0 | 1; hold: number }
  | { kind: 'grinder'; base: RectBase; crop: CropId | 'none'; variety: VarietyId; quality: number; units: number; progress: number; n: number }
  | { kind: 'compost-box'; base: RectBase; units: number; progress: number }
  | { kind: 'mill'; base: RectBase; recipe: MillRecipe | 'none'; variety: VarietyId; quality: number; units: number; progress: number; inn: 0 | 1 }
  | { kind: 'jam'; base: RectBase; crop: JamCrop | 'none'; variety: VarietyId; quality: number; fruit: number; sugar: number; progress: number; inn: 0 | 1 }
  | { kind: 'still'; base: RectBase; feed: { crop: StillCrop; variety: VarietyId; quality: number; count: number }[]; progress: number; n: number; inn: 0 | 1 }
  | { kind: 'furnace'; base: RectBase; units: number; progress: number; inn: 0 | 1; out: 0 | 1; hold: number }
  | { kind: 'station'; base: RectBase; crop: CropId | 'none'; variety: VarietyId; quality: number; units: number; progress: number; inn: 0 | 1 }
  | { kind: 'barrel'; base: RectBase; crop: BarrelCrop | 'none'; feed: { variety: VarietyId; quality: number; count: number }[]; age: number; n: number }
  | { kind: 'freezer'; base: RectBase; slots: Slot[]; out: 0 | 1; hold: number }
  | { kind: 'hangar'; base: RectBase }
  | { kind: 'silo-seed'; base: RectBase }
  | { kind: 'silo-spray'; base: RectBase }
  | { kind: 'silo-produce'; base: RectBase }
  | { kind: 'seed-silo'; base: RectBase; useDefault: boolean; seeds: SiloStack[]; out: 0 | 1; hold: number }
  | { kind: 'additive-store'; base: RectBase; useDefault: boolean; held: AdditiveHold[]; sugar: SugarBin; out: 0 | 1; hold: number }
  | { kind: 'truck'; base: RectBase }
  | { kind: 'lever'; base: RectBase; on: boolean; inn: 0 | 1; prev: 0 | 1; out: 0 | 1 }
  | { kind: 'button'; base: RectBase; left: number; out: 0 | 1 }
  | { kind: 'lamp'; base: RectBase; inn: 0 | 1 }
  | { kind: 'or'; base: RectBase; out: 0 | 1 }
  | { kind: 'and'; base: RectBase; out: 0 | 1 }
  | { kind: 'not'; base: RectBase; out: 0 | 1 }
  | { kind: 'pulser'; base: RectBase; inn: 0 | 1; prev: 0 | 1; out: 0 | 1 }
  | { kind: 'counter'; base: RectBase; inn: 0 | 1; n: number; count: number; out: 0 | 1 }
  | { kind: 'sensor-water'; base: RectBase; wilt: boolean; over: boolean; out: 0 | 1; hold: number }
  | { kind: 'sensor-fert'; base: RectBase; out: 0 | 1; hold: number }
  | { kind: 'sensor-harvest'; base: RectBase; mode: 'any' | 'all'; out: 0 | 1; hold: number }
  | { kind: 'sensor-day'; base: RectBase; sunrise: boolean; day: boolean; sunset: boolean; twilight: boolean; out: 0 | 1; hold: number }
  | { kind: 'water-system'; base: RectBase; out: 0 | 1; hold: number }
  | { kind: 'vehicle-detector'; base: RectBase; out: 0 | 1; hold: number }
  | { kind: 'traffic-light'; base: RectBase; inn: 0 | 1; out: 0 | 1; hold: number }
  | { kind: 'occ'; of: Coord }

export type SaveSeat = {
  playerId: string
  name: string
  presence: Presence
  actor: { x: number; y: number }
  hand: Hand
  inventory: Slot[]
}

export type SaveVehicle =
  | {
      kind: 'quad'
      id: VehicleId
      fuel: number
      slots: Slot[]
      pose:
        | { kind: 'stored'; hangar: Coord }
        | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }
      route: RouteId | 'none'
      cursor: number
      running: boolean
      dwell: number
    }
  | {
      kind: 'tractor'
      id: VehicleId
      fuel: number
      hitch: TrailerId | 'none'
      boom: 3 | 5
      pose:
        | { kind: 'stored'; hangar: Coord }
        | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }
      route: RouteId | 'none'
      cursor: number
      running: boolean
      dwell: number
    }

export type SaveTrailer =
  | {
      kind: 'seed'
      id: TrailerId
      pose: TrailerPose
      hopper: SeedHopper
    }
  | {
      kind: 'spray'
      id: TrailerId
      pose: TrailerPose
      hopper: SprayHopper
    }
  | {
      kind: 'harvest'
      id: TrailerId
      pose: TrailerPose
      slots: Slot[]
    }

export type SaveRecap = {
  day: number
  money: number
  stipend: number
  died: number
  harvests: number
  research: ResearchId[]
  tax: number
  water: number
}

export type SaveContracts = {
  active: { offer: ContractOffer; dueDay: number; bins: { demand: Demand; filled: number }[] }[]
  takenToday: ContractId[]
  history: HistoryEntry[]
  book: CompanyBook
}

export type Save = {
  game: 'gardena'
  version: typeof import('./save.ts').SAVE_VERSION
  savedAt: string
  rng: SaveRng
  clock: { day: number; t: number }
  money: number
  rep: number
  repDay: number
  purchases: number
  prizeSlots: number
  prizeFreezers: number
  points: number
  clearance: number
  bigTicks: number
  seats: SaveSeat[]
  vehicles: SaveVehicle[]
  nextVehicleId: VehicleId
  trailers: SaveTrailer[]
  nextTrailerId: TrailerId
  routes: Route[]
  nextRouteId: RouteId
  done: ResearchId[]
  job: { kind: 'idle' } | { kind: 'run'; id: ResearchId; left: number }
  family: {
    player: SaveMember<PlayerSkillId>
    husband: SaveMember<HusbandSkillId>
    daughter: SaveMember<DaughterSkillId>
  }
  stall: { [K in StallGoodId]: SaveStallGood }
  tally: { died: number; harvests: number; research: ResearchId[] }
  seam: { kind: 'play' } | { kind: 'recap'; recap: SaveRecap }
  chunks: { id: ChunkId; cells: SaveCell[][] }[]
  segments: Segment[]
  sprinklers: Sprinkler[]
  wires: Wire[]
  valveHold: { e: Edge; level: 0 | 1; hold: number }[]
  fences: Coord[]
  drops: { at: Coord; item: Item }[]
  contracts: SaveContracts
}
