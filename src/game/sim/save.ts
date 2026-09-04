import { type CropClass } from '../defs/crops.ts'
import { CHEST_SLOTS, CONTAINERS, COUNTER_MAX, FREEZER_LARGE_SLOTS, FREEZER_SLOTS, HARVEST_SLOTS, PICKAXES, SHOVELS, VEHICLE_SLOTS } from '../defs/items.ts'
import { isVarietyId, VARIETY_IDS, type VarietyId } from '../defs/varieties.ts'
import { RESEARCH } from '../defs/research.ts'
import { DAUGHTER_SKILL_IDS, HUSBAND_SKILL_IDS, PLAYER_SKILL_IDS } from '../defs/skills.ts'
import { Actor } from './actor.ts'
import {
  ADDITIVE_IDS,
  AdditiveStore,
  CHUNK,
  Chest,
  CompostBox,
  DOOR,
  Freezer,
  Grinder,
  Hangar,
  House,
  SiloProduce,
  SiloSeed,
  SiloSpray,
  JamMachine,
  Mill,
  Furnace,
  PotStill,
  Pump,
  RainTank,
  Rock,
  SeedSilo,
  Tap,
  Well,
  Tree,
  Truck,
  Barrel,
  chunkKey,
  chunkRect,
  occupiedCells,
  type AdditiveHold,
  type AdditiveId,
  type Base,
  type ChunkId,
  type Coord,
  type RectBase,
  type SiloStack,
  type TreeYield,
} from './building.ts'
import type { Cell, Cover, Ground } from './plot.ts'
import {
  ANNUAL_IDS,
  TREE_IDS,
  isAnnualId,
  isTreeId,
  type AnnualId,
  type ContainerId,
  type CropId,
  type DaughterSkillId,
  type HusbandSkillId,
  JAM_CROPS,
  type JamCrop,
  MILL_RECIPES,
  type MillRecipe,
  type PickaxeId,
  CASK_IDS,
  type BarrelCrop,
  type CaskId,
  type PlayerSkillId,
  type ResearchId,
  type ShovelId,
  type SkillId,
  type SpiritKind,
  type StallGoodId,
  type StillCrop,
  type TileId,
  type TreeId,
  type TrailerId,
  type RouteId,
  type VehicleId,
} from './ids.ts'
import type { FruitStack, Hand, Item, Slot } from './item.ts'
import type {
  Active,
  CompanyBook,
  CompanyId,
  ContractId,
  ContractOffer,
  Contracts,
  DeadlineBand,
  Demand,
  HistoryEntry,
  Lines,
  Outcome,
  Prize,
  PrizeTool,
  Stars,
} from './market.h.ts'
import { COMPANY_IDS } from '../defs/companies.ts'
import { MemorySink, type LogSink } from './log.ts'
import { type Edge, type Gate, type Segment, type Sprinkler, type Tune } from './pipe.ts'
import {
  AndGate,
  Button,
  Counter,
  DaySensor,
  FertSensor,
  HarvestSensor,
  Lamp,
  Lever,
  NotGate,
  OrGate,
  Pulser,
  TrafficLight,
  VehicleSensor,
  WaterSensor,
  WaterSystem,
  type Wire,
  type WireEnd,
} from './sensor.ts'
import { Plant, Turf, Weed } from './plant.ts'
import { Rng } from './rng.ts'
import { Soil } from './soil.ts'
import { STALL_IDS, StallGood, type StallMap } from './stall.ts'
import {
  World,
  type DayTally,
  type Family,
  type Hydrate,
  type Job,
  type MemberState,
  type Presence,
  type Recap,
  type Seat,
  type SeatId,
  cleanName,
  defaultSeatName,
  type Seam,
  type SkillRef,
} from './world.ts'
import { makeQuad, makeTractor, type Route, type RouteStop, type SeedHopper, type SprayHopper, type Trailer, type TrailerPose, type Vehicle } from './vehicle.ts'

export const SLOT_KEY = 'gardena-save-slot-1'
export const DOWNLOAD_NAME = 'gardena.json'
export const SAVE_VERSION = 2.13 as const

const INV = 16

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
  | { kind: 'barrel'; base: RectBase; crop: BarrelCrop | 'none'; feed: { variety: VarietyId; quality: number; count: number }[]; age: number; n: number }
  | { kind: 'freezer'; base: RectBase; slots: Slot[]; out: 0 | 1; hold: number }
  | { kind: 'hangar'; base: RectBase }
  | { kind: 'silo-seed'; base: RectBase }
  | { kind: 'silo-spray'; base: RectBase }
  | { kind: 'silo-produce'; base: RectBase }
  | { kind: 'seed-silo'; base: RectBase; useDefault: boolean; seeds: SiloStack[]; out: 0 | 1; hold: number }
  | { kind: 'additive-store'; base: RectBase; useDefault: boolean; held: AdditiveHold[]; out: 0 | 1; hold: number }
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

export type Save = {
  game: 'gardena'
  version: 2.13
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

/**
 * Live contract state. `rep` and `repDay` stay on the top-level record where
 * they have always been; everything else that used to be rebuilt empty on load
 * lives here.
 */
export type SaveContracts = {
  active: { offer: ContractOffer; dueDay: number; bins: { demand: Demand; filled: number }[] }[]
  takenToday: ContractId[]
  history: HistoryEntry[]
  book: CompanyBook
}

export function dump(world: World): Save {
  return {
    game: 'gardena',
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    rng: { seed: world.rng.seed, fruit: world.rng.consumed('fruit') },
    clock: { day: world.clock.day, t: world.clock.t },
    money: world.money,
    rep: world.contracts.rep,
    repDay: world.contracts.repDay,
    contracts: dumpContracts(world.contracts),
    purchases: world.purchases,
    prizeSlots: world.prizeSlots,
    prizeFreezers: world.prizeFreezers,
    points: world.points,
    clearance: world.clearance,
    bigTicks: world.bigTicks,
    seats: world.seats.map(s => ({
      playerId: s.playerId,
      name: s.name,
      presence: s.presence,
      actor: { x: s.actor.x, y: s.actor.y },
      hand: s.hand,
      inventory: s.inventory.slice(),
    })),
    vehicles: world.vehicles.map(dumpVehicle),
    nextVehicleId: world.nextVehicleId,
    trailers: world.trailers.map(dumpTrailer),
    nextTrailerId: world.nextTrailerId,
    routes: world.routes.map(r => ({ id: r.id, name: r.name, stops: r.stops.map(s => (s.kind === 'goto' ? { ...s } : { kind: s.kind, at: { col: s.at.col, row: s.at.row } })) })),
    nextRouteId: world.nextRouteId,
    done: [...world.done],
    job: world.job,
    family: {
      player: dumpMember(world.family.player),
      husband: dumpMember(world.family.husband),
      daughter: dumpMember(world.family.daughter),
    },
    stall: Object.fromEntries(STALL_IDS.map(id => [id, dumpStall(world.stall[id])])) as Save['stall'],
    tally: {
      died: world.tally.died,
      harvests: world.tally.harvests,
      research: world.tally.research.slice(),
    },
    seam:
      world.seam.kind === 'play'
        ? { kind: 'play' }
        : {
            kind: 'recap',
            recap: {
              day: world.seam.recap.day,
              money: world.seam.recap.money,
              stipend: world.seam.recap.stipend,
              died: world.seam.recap.died,
              harvests: world.seam.recap.harvests,
              research: world.seam.recap.research,
              tax: world.seam.recap.tax,
              water: world.seam.recap.water,
            },
          },
    chunks: world.owned.map(id => {
      const { col0, row0 } = chunkRect(id)
      const cells: SaveCell[][] = []
      for (let row = 0; row < CHUNK; row++) {
        const line: SaveCell[] = []
        for (let col = 0; col < CHUNK; col++) {
          line.push(dumpCell(world.cell({ col: col0 + col, row: row0 + row }), { col: col0 + col, row: row0 + row }, world.owned))
        }
        cells.push(line)
      }
      return { id: { cx: id.cx, cy: id.cy }, cells }
    }),
    segments: [...world.segments.values()],
    sprinklers: [...world.sprinklers.values()],
    wires: world.wires.map(w => ({ from: w.from, to: w.to })),
    valveHold: [...world.valveHold.values()].map(h => ({ e: h.e, level: h.level, hold: h.hold })),
    fences: [...world.fences].map(k => {
      const i = k.indexOf(',')
      return { col: Number(k.slice(0, i)), row: Number(k.slice(i + 1)) }
    }),
    drops: world.drops.map(d => ({ at: { col: d.at.col, row: d.at.row }, item: d.item })),
  }
}

export function parse(text: string, sink: LogSink = new MemorySink()): LoadResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    // COMMANDMENT: not JSON → unknown format. Do not peek. Do not migrate.
    return { ok: false, reason: 'unknown-format' }
  }
  if (typeof raw !== 'object' || raw === null) {
    // JSON without .game === "gardena".
    return { ok: false, reason: 'not-gardena' }
  }
  const rec = raw as Record<string, unknown>
  if (rec.game !== 'gardena') return { ok: false, reason: 'not-gardena' }
  // COMMANDMENT: always attempt hydrate. Version is not a gate. No migrate.
  // COMMANDMENT: peek version only after hydrate fails. Different version that hydrates is not a refusal.
  const save = readSave(rec)
  if (save === undefined) return failAfterHydrate(rec)
  const world = worldFromSave(save, sink)
  if (world === undefined) return failAfterHydrate(rec)
  return { ok: true, world }
}

function failAfterHydrate(rec: Record<string, unknown>): LoadResult {
  // COMMANDMENT: version is only for the fail copy. Never a refusal of a file that hydrates.
  return { ok: false, reason: num(rec.version) !== SAVE_VERSION ? 'version' : 'unusable' }
}

export function readSlot(): string | undefined {
  const v = localStorage.getItem(SLOT_KEY)
  if (v === null) return undefined
  return v
}

export function writeSlot(save: Save): void {
  localStorage.setItem(SLOT_KEY, JSON.stringify(save))
}

export function slotExists(): boolean {
  return localStorage.getItem(SLOT_KEY) !== null
}

export function slotStamp(): string | undefined {
  const text = readSlot()
  if (text === undefined) return undefined
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return undefined
  }
  if (typeof raw !== 'object' || raw === null) return undefined
  const at = (raw as Record<string, unknown>).savedAt
  if (typeof at !== 'string') return undefined
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return undefined
  const p = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function dumpMember<Id extends SkillId>(m: { pickCount: number; owned: Map<Id, number>; offers: SkillRef<Id>[] }): SaveMember<Id> {
  return {
    pickCount: m.pickCount,
    owned: [...m.owned.entries()].map(([id, tier]) => ({ id, tier })),
    offers: m.offers.map(o => ({ id: o.id, tier: o.tier })),
  }
}

function dumpStall(g: StallGood): SaveStallGood {
  return {
    offered: 0,
    market: 0,
    target: 0,
    acc: 0,
    stock: Object.fromEntries(VARIETY_IDS.map(v => [v, { ...g.stock[v] }])) as SaveStallGood['stock'],
    worth: Object.fromEntries(VARIETY_IDS.map(v => [v, { ...g.worth[v] }])) as SaveStallGood['worth'],
  }
}

function originOf(c: Cell, owned: readonly ChunkId[]): Coord | undefined {
  if (c.kind === 'pump' && c.base.shape === 'circle') {
    const cells = occupiedCells(c.base, owned)
    if (cells.length === 0) return undefined
    return cells[0]
  }
  if (
    c.kind === 'house' ||
    c.kind === 'pump' ||
    c.kind === 'rain-tank' ||
    c.kind === 'tap' ||
    c.kind === 'well' ||
    c.kind === 'rock' ||
    c.kind === 'tree' ||
    c.kind === 'chest' ||
    c.kind === 'grinder' ||
    c.kind === 'compost-box' ||
    c.kind === 'mill' ||
    c.kind === 'jam' ||
    c.kind === 'still' ||
    c.kind === 'furnace' ||
    c.kind === 'barrel' ||
    c.kind === 'freezer' ||
    c.kind === 'hangar' ||
    c.kind === 'silo-seed' ||
    c.kind === 'silo-spray' ||
    c.kind === 'silo-produce' ||
    c.kind === 'seed-silo' ||
    c.kind === 'additive-store' ||
    c.kind === 'truck'
  ) {
    if (c.base.shape === 'rect') return { col: c.base.col, row: c.base.row }
  }
  return undefined
}

function dumpCell(c: Cell, at: Coord, owned: readonly ChunkId[]): SaveCell {
  const origin = originOf(c, owned)
  if (origin !== undefined && (origin.col !== at.col || origin.row !== at.row)) {
    return { kind: 'occ', of: { col: origin.col, row: origin.row } }
  }
  switch (c.kind) {
    case 'untilled':
      return { kind: 'untilled', ground: c.ground, cover: c.cover }
    case 'empty':
      return { kind: 'empty', soil: dumpSoil(c.soil) }
    case 'infertile':
      return { kind: 'infertile' }
    case 'weed':
      return { kind: 'weed', soil: dumpSoil(c.soil), weed: { variant: c.weed.variant, maturity: c.weed.maturity, spread: c.weed.spread } }
    case 'turf':
      return { kind: 'turf', soil: dumpSoil(c.soil), turf: { variant: c.turf.variant, maturity: c.turf.maturity } }
    case 'growing':
      return { kind: 'growing', soil: dumpSoil(c.soil), plant: dumpPlant(c.plant) }
    case 'ripe':
      return { kind: 'ripe', soil: dumpSoil(c.soil), plant: dumpPlant(c.plant) }
    case 'dead':
      return { kind: 'dead', soil: dumpSoil(c.soil), plant: dumpPlant(c.plant) }
    case 'rotten':
      return { kind: 'rotten', soil: dumpSoil(c.soil), crop: c.crop }
    case 'house':
      return { kind: 'house', base: c.base }
    case 'pump':
      return { kind: 'pump', form: c.form, base: c.base, stored: c.water.stored }
    case 'rain-tank':
      return { kind: 'rain-tank', base: c.base, stored: c.water.stored }
    case 'tap':
      return { kind: 'tap', base: c.base }
    case 'well':
      return { kind: 'well', base: c.base, stored: c.water.stored }
    case 'rock':
      return { kind: 'rock', base: c.base }
    case 'tree':
      return {
        kind: 'tree',
        species: c.species,
        base: c.base,
        juvenile: c.juvenile,
        fruit: c.fruit,
        yield: c.yield,
        tended: c.tended,
        trunk: c.trunk,
        variety: c.variety,
      }
    case 'chest':
      return { kind: 'chest', base: c.base, slots: c.slots.slice(), out: c.out, hold: c.hold }
    case 'seed-silo':
      return {
        kind: 'seed-silo',
        base: c.base,
        useDefault: c.useDefault,
        seeds: c.seeds.map(st => ({ ...st })),
        out: c.out,
        hold: c.hold,
      }
    case 'additive-store':
      return {
        kind: 'additive-store',
        base: c.base,
        useDefault: c.useDefault,
        held: c.held.map(h => ({ ...h })),
        out: c.out,
        hold: c.hold,
      }
    case 'grinder':
      return {
        kind: 'grinder',
        base: c.base,
        crop: c.crop,
        variety: c.variety,
        quality: c.quality,
        units: c.units,
        progress: c.progress,
        n: c.n,
      }
    case 'compost-box':
      return { kind: 'compost-box', base: c.base, units: c.units, progress: c.progress }
    case 'mill':
      return { kind: 'mill', base: c.base, recipe: c.recipe, variety: c.variety, quality: c.quality, units: c.units, progress: c.progress, inn: c.inn }
    case 'jam':
      return { kind: 'jam', base: c.base, crop: c.crop, variety: c.variety, quality: c.quality, fruit: c.fruit, sugar: c.sugar, progress: c.progress, inn: c.inn }
    case 'still':
      return { kind: 'still', base: c.base, feed: c.feed.map(f => ({ ...f })), progress: c.progress, n: c.n, inn: c.inn }
    case 'furnace':
      return { kind: 'furnace', base: c.base, units: c.units, progress: c.progress, inn: c.inn, out: c.out, hold: c.hold }
    case 'barrel':
      return { kind: 'barrel', base: c.base, crop: c.crop, feed: c.feed.map(f => ({ ...f })), age: c.age, n: c.n }
    case 'freezer':
      return { kind: 'freezer', base: c.base, slots: c.slots.slice(), out: c.out, hold: c.hold }
    case 'hangar':
      return { kind: 'hangar', base: c.base }
    case 'silo-seed':
      return { kind: 'silo-seed', base: c.base }
    case 'silo-spray':
      return { kind: 'silo-spray', base: c.base }
    case 'silo-produce':
      return { kind: 'silo-produce', base: c.base }
    case 'truck':
      return { kind: 'truck', base: c.base }
    case 'lever':
      return { kind: 'lever', base: c.base, on: c.on, inn: c.inn, prev: c.prev, out: c.out }
    case 'button':
      return { kind: 'button', base: c.base, left: c.left, out: c.out }
    case 'lamp':
      return { kind: 'lamp', base: c.base, inn: c.inn }
    case 'or':
      return { kind: 'or', base: c.base, out: c.out }
    case 'and':
      return { kind: 'and', base: c.base, out: c.out }
    case 'not':
      return { kind: 'not', base: c.base, out: c.out }
    case 'pulser':
      return { kind: 'pulser', base: c.base, inn: c.inn, prev: c.prev, out: c.out }
    case 'counter':
      return { kind: 'counter', base: c.base, inn: c.inn, n: c.n, count: c.count, out: c.out }
    case 'sensor-water':
      return { kind: 'sensor-water', base: c.base, wilt: c.wilt, over: c.over, out: c.out, hold: c.hold }
    case 'sensor-fert':
      return { kind: 'sensor-fert', base: c.base, out: c.out, hold: c.hold }
    case 'sensor-harvest':
      return { kind: 'sensor-harvest', base: c.base, mode: c.mode, out: c.out, hold: c.hold }
    case 'sensor-day':
      return {
        kind: 'sensor-day',
        base: c.base,
        sunrise: c.sunrise,
        day: c.day,
        sunset: c.sunset,
        twilight: c.twilight,
        out: c.out,
        hold: c.hold,
      }
    case 'water-system':
      return { kind: 'water-system', base: c.base, out: c.out, hold: c.hold }
    case 'vehicle-detector':
      return { kind: 'vehicle-detector', base: c.base, out: c.out, hold: c.hold }
    case 'traffic-light':
      return { kind: 'traffic-light', base: c.base, inn: c.inn, out: c.out, hold: c.hold }
  }
}

function dumpSoil(s: Soil): SaveSoil {
  return { water: s.water, fertilizer: s.fertilizer, bio: s.bio, weedChance: s.weedChance }
}

function dumpPlant(p: Plant): SavePlant {
  return {
    crop: p.crop,
    variety: p.variety,
    quality: p.quality,
    maturity: p.maturity,
    freshness: p.freshness,
    happiness: p.happiness,
    bio: p.bio,
    tended: p.tended,
  }
}

function readSeats(rec: Record<string, unknown>): SaveSeat[] | undefined {
  const seatsIn = arr(rec.seats)
  if (seatsIn === undefined || seatsIn.length < 1) return undefined
  const seats: SaveSeat[] = []
  for (let i = 0; i < seatsIn.length; i++) {
    const o = obj(seatsIn[i])
    if (o === undefined) return undefined
    if (typeof o.playerId !== 'string') return undefined
    if (o.presence !== 'in' && o.presence !== 'away') return undefined
    const actorIn = obj(o.actor)
    if (actorIn === undefined) return undefined
    const ax = num(actorIn.x)
    const ay = num(actorIn.y)
    if (ax === undefined || ay === undefined) return undefined
    const hand = readHand(o.hand)
    if (hand === undefined) return undefined
    const inventory = readInv(o.inventory)
    if (inventory === undefined) return undefined
    // Saves written before names existed still load; the seat just gets its default label.
    const name = typeof o.name === 'string' ? cleanName(o.name) : ''
    seats.push({
      playerId: o.playerId,
      name: name === '' ? defaultSeatName(i as SeatId) : name,
      presence: o.presence,
      actor: { x: ax, y: ay },
      hand,
      inventory,
    })
  }
  return seats
}

function readInv(raw: unknown): Slot[] | undefined {
  const inventoryIn = arr(raw)
  if (inventoryIn === undefined || inventoryIn.length !== INV) return undefined
  const inventory: Slot[] = []
  for (let i = 0; i < INV; i++) {
    const s = readHand(inventoryIn[i])
    if (s === undefined) return undefined
    inventory.push(s)
  }
  return inventory
}

function readSave(rec: Record<string, unknown>): Save | undefined {
  const rngIn = obj(rec.rng)
  const clockIn = obj(rec.clock)
  const familyIn = obj(rec.family)
  const stallIn = rec.stall
  const tallyIn = obj(rec.tally)
  if (rngIn === undefined || clockIn === undefined) return undefined
  if (familyIn === undefined || tallyIn === undefined) return undefined
  const seed = num(rngIn.seed)
  const fruit = num(rngIn.fruit)
  const day = num(clockIn.day)
  const t = num(clockIn.t)
  const money = num(rec.money)
  const rep = num(rec.rep)
  const repDay = num(rec.repDay)
  const purchases = num(rec.purchases)
  const prizeSlots = num(rec.prizeSlots)
  const prizeFreezers = num(rec.prizeFreezers)
  const points = num(rec.points)
  const clearance = num(rec.clearance)
  const bigTicks = num(rec.bigTicks)
  const savedAt = rec.savedAt
  const seats = readSeats(rec)
  if (
    seed === undefined ||
    fruit === undefined ||
    day === undefined ||
    t === undefined ||
    money === undefined ||
    rep === undefined ||
    repDay === undefined ||
    purchases === undefined ||
    prizeSlots === undefined ||
    prizeFreezers === undefined ||
    points === undefined ||
    clearance === undefined ||
    bigTicks === undefined ||
    seats === undefined ||
    typeof savedAt !== 'string'
  ) {
    return undefined
  }
  const doneIn = arr(rec.done)
  if (doneIn === undefined) return undefined
  const done: ResearchId[] = []
  for (const id of doneIn) {
    if (!isResearchId(id)) return undefined
    done.push(id)
  }
  const job = readJob(rec.job)
  if (job === undefined) return undefined
  const player = readMember(familyIn.player, PLAYER_SKILL_IDS)
  const husband = readMember(familyIn.husband, HUSBAND_SKILL_IDS)
  const daughter = readMember(familyIn.daughter, DAUGHTER_SKILL_IDS)
  if (player === undefined || husband === undefined || daughter === undefined) return undefined
  const stall = readStallSave(stallIn)
  if (stall === undefined) return undefined
  const tally = readTally(tallyIn)
  if (tally === undefined) return undefined
  const seam = readSeam(rec.seam)
  if (seam === undefined) return undefined
  const chunksIn = arr(rec.chunks)
  if (chunksIn === undefined) return undefined
  const chunks: { id: ChunkId; cells: SaveCell[][] }[] = []
  for (const ch of chunksIn) {
    const o = obj(ch)
    if (o === undefined) return undefined
    const idIn = obj(o.id)
    if (idIn === undefined) return undefined
    const cx = num(idIn.cx)
    const cy = num(idIn.cy)
    if (cx === undefined || cy === undefined) return undefined
    const grid = arr(o.cells)
    if (grid === undefined || grid.length !== CHUNK) return undefined
    const cells: SaveCell[][] = []
    for (let row = 0; row < CHUNK; row++) {
      const lineIn = arr(grid[row])
      if (lineIn === undefined || lineIn.length !== CHUNK) return undefined
      const line: SaveCell[] = []
      for (let col = 0; col < CHUNK; col++) {
        const cell = readSaveCell(lineIn[col])
        if (cell === undefined) return undefined
        line.push(cell)
      }
      cells.push(line)
    }
    chunks.push({ id: { cx, cy }, cells })
  }
  const segmentsIn = arr(rec.segments)
  const sprinklersIn = arr(rec.sprinklers)
  const wiresIn = arr(rec.wires)
  const valveHoldIn = arr(rec.valveHold)
  const fencesIn = arr(rec.fences)
  const dropsIn = arr(rec.drops)
  if (
    segmentsIn === undefined ||
    sprinklersIn === undefined ||
    wiresIn === undefined ||
    valveHoldIn === undefined ||
    fencesIn === undefined ||
    dropsIn === undefined
  ) {
    return undefined
  }
  const segments: Segment[] = []
  for (const s of segmentsIn) {
    const seg = readSegment(s)
    if (seg === undefined) return undefined
    segments.push(seg)
  }
  const sprinklers: Sprinkler[] = []
  for (const s of sprinklersIn) {
    const sp = readSprinkler(s)
    if (sp === undefined) return undefined
    sprinklers.push(sp)
  }
  const wires: Wire[] = []
  for (const raw of wiresIn) {
    const w = readWire(raw)
    if (w === undefined) return undefined
    wires.push(w)
  }
  const valveHold: Save['valveHold'] = []
  for (const raw of valveHoldIn) {
    const h = readValveHold(raw)
    if (h === undefined) return undefined
    valveHold.push(h)
  }
  const fences: Coord[] = []
  for (const f of fencesIn) {
    const at = readCoord(f)
    if (at === undefined) return undefined
    fences.push(at)
  }
  const drops: { at: Coord; item: Item }[] = []
  for (const d of dropsIn) {
    const o = obj(d)
    if (o === undefined) return undefined
    const at = readCoord(o.at)
    const item = readItem(o.item)
    if (at === undefined || item === undefined) return undefined
    drops.push({ at, item })
  }
  const vehiclesIn = arr(rec.vehicles)
  const nextVehicleId = num(rec.nextVehicleId)
  if (vehiclesIn === undefined || nextVehicleId === undefined) return undefined
  const vehicles: SaveVehicle[] = []
  for (const raw of vehiclesIn) {
    const v = readVehicle(raw)
    if (v === undefined) return undefined
    vehicles.push(v)
  }
  const trailersIn = arr(rec.trailers)
  const nextTrailerId = num(rec.nextTrailerId)
  if (trailersIn === undefined || nextTrailerId === undefined) return undefined
  const trailers: SaveTrailer[] = []
  for (const raw of trailersIn) {
    const t = readTrailer(raw)
    if (t === undefined) return undefined
    trailers.push(t)
  }
  const routesIn = arr(rec.routes)
  const nextRouteId = num(rec.nextRouteId)
  if (routesIn === undefined || nextRouteId === undefined) return undefined
  if (!Number.isInteger(nextRouteId) || nextRouteId < 1) return undefined
  const routes: Route[] = []
  for (const raw of routesIn) {
    const r = readRoute(raw)
    if (r === undefined) return undefined
    routes.push(r)
  }
  const contracts = readContracts(rec.contracts)
  if (contracts === undefined) return undefined
  return {
    game: 'gardena',
    contracts,
    version: SAVE_VERSION,
    savedAt,
    rng: { seed, fruit },
    clock: { day, t },
    money,
    rep,
    repDay,
    purchases,
    prizeSlots,
    prizeFreezers,
    points,
    clearance,
    bigTicks,
    seats,
    done,
    job,
    family: { player, husband, daughter },
    stall,
    tally,
    seam,
    chunks,
    segments,
    sprinklers,
    wires,
    valveHold,
    fences,
    drops,
    vehicles,
    nextVehicleId,
    trailers,
    nextTrailerId,
    routes,
    nextRouteId,
  }
}

function worldFromSave(save: Save, sink: LogSink): World | undefined {
  const owned = save.chunks.map(ch => ch.id)
  const live = stampChunks(owned, save.chunks)
  if (live === undefined) return undefined
  const h: Hydrate = {
    rng: new Rng(save.rng.seed, { fruit: save.rng.fruit }),
    sink,
    house: live.house,
    silo: live.silo,
    additives: live.additives,
    truck: live.truck,
    pumps: live.pumps,
    tanks: live.tanks,
    taps: live.taps,
    stills: live.stills,
    waterSystems: live.waterSystems,
    wires: save.wires,
    valveHold: save.valveHold,
    stall: makeStallMap(save.stall),
    family: makeFamily(save.family),
    seats: save.seats.map((s, i): Seat => ({
      id: i as SeatId,
      playerId: s.playerId,
      name: s.name,
      presence: s.presence,
      napping: false,
      cue: { kind: 'none' },
      actor: new Actor(s.actor.x, s.actor.y),
      hand: s.hand,
      inventory: s.inventory.slice(),
      queue: [],
      place: { kind: 'none' },
      workLeft: 0,
      workTotal: 0,
      filling: false,
      drive: { throttle: 0, steer: 0 },
      stride: { x: 0, y: 0 },
      legStart: { x: s.actor.x, y: s.actor.y },
    })),
    hangars: live.hangars,
    seedSilos: live.seedSilos,
    spraySilos: live.spraySilos,
    produceSilos: live.produceSilos,
    vehicles: save.vehicles.map(liveVehicle),
    nextVehicleId: save.nextVehicleId,
    trailers: save.trailers.map(liveTrailer),
    nextTrailerId: save.nextTrailerId,
    routes: save.routes.map(r => ({ id: r.id, name: r.name, stops: r.stops.map(s => (s.kind === 'goto' ? { ...s } : { kind: s.kind, at: { col: s.at.col, row: s.at.row } })) })),
    nextRouteId: save.nextRouteId,
    owned,
    chunks: live.chunks,
    clock: save.clock,
    money: save.money,
    rep: save.rep,
    repDay: save.repDay,
    contracts: liveContracts(save.contracts, save.rep, save.repDay),
    purchases: save.purchases,
    prizeSlots: save.prizeSlots,
    prizeFreezers: save.prizeFreezers,
    points: save.points,
    clearance: save.clearance,
    bigTicks: save.bigTicks,
    done: save.done,
    job: save.job,
    tally: { died: save.tally.died, harvests: save.tally.harvests, research: save.tally.research, contracts: [] },
    seam:
      save.seam.kind === 'play'
        ? { kind: 'play' }
        : {
            kind: 'recap',
            recap: { ...save.seam.recap, contracts: [] },
          },
    segments: save.segments,
    wells: live.wells,
    sprinklers: save.sprinklers,
    fences: save.fences,
    drops: save.drops,
  }
  return World.hydrate(h)
}

function makeFamily(f: Save['family']): Family {
  return {
    player: makeMember(f.player),
    husband: makeMember(f.husband),
    daughter: makeMember(f.daughter),
  }
}

function makeMember<Id extends SkillId>(m: SaveMember<Id>): MemberState<Id> {
  return {
    pickCount: m.pickCount,
    owned: new Map(m.owned.map(s => [s.id, s.tier])),
    offers: m.offers.map(o => ({ id: o.id, tier: o.tier })),
  }
}

function makeStallMap(s: Save['stall']): StallMap {
  const stall = {} as StallMap
  for (const id of STALL_IDS) {
    const src = s[id]
    const g = new StallGood(id)
    VARIETY_IDS.forEach(r => {
      g.stock[r] = { organic: src.stock[r].organic, synth: src.stock[r].synth }
      g.worth[r] = { organic: src.worth[r].organic, synth: src.worth[r].synth }
    })
    stall[id] = g
  }
  return stall
}

function stampChunks(
  owned: ChunkId[],
  chunkSaves: { id: ChunkId; cells: SaveCell[][] }[],
):
  | {
      chunks: Map<string, Cell[][]>
      house: House
      truck: Truck
      silo: SeedSilo
      additives: AdditiveStore
      pumps: Pump[]
      tanks: RainTank[]
      taps: Tap[]
      wells: Well[]
      stills: PotStill[]
      waterSystems: WaterSystem[]
      hangars: Hangar[]
      seedSilos: SiloSeed[]
      spraySilos: SiloSpray[]
      produceSilos: SiloProduce[]
    }
  | undefined {
  const origins = new Map<string, Cell>()
  const pumps: Pump[] = []
  const tanks: RainTank[] = []
  const taps: Tap[] = []
  const wells: Well[] = []
  const stills: PotStill[] = []
  const waterSystems: WaterSystem[] = []
  const hangars: Hangar[] = []
  const seedSilos: SiloSeed[] = []
  const spraySilos: SiloSpray[] = []
  const produceSilos: SiloProduce[] = []
  let house: House | undefined
  let truck: Truck | undefined
  let silo: SeedSilo | undefined
  let additives: AdditiveStore | undefined
  for (const ch of chunkSaves) {
    const { col0, row0 } = chunkRect(ch.id)
    for (let row = 0; row < CHUNK; row++) {
      for (let col = 0; col < CHUNK; col++) {
        const sc = ch.cells[row][col]
        if (sc.kind === 'occ') continue
        const at = { col: col0 + col, row: row0 + row }
        const made = makeLive(sc)
        if (made === undefined) return undefined
        origins.set(`${at.col},${at.row}`, made)
        if (made.kind === 'house') house = made
        if (made.kind === 'truck') truck = made
        if (made.kind === 'seed-silo' && made.useDefault) silo = made
        if (made.kind === 'additive-store' && made.useDefault) additives = made
        if (made.kind === 'pump') {
          if (made.form === 'starter') pumps.unshift(made)
          else pumps.push(made)
        }
        if (made.kind === 'rain-tank') tanks.push(made)
        if (made.kind === 'tap') taps.push(made)
        if (made.kind === 'well') wells.push(made)
        if (made.kind === 'still') stills.push(made)
        if (made.kind === 'water-system') waterSystems.push(made)
        if (made.kind === 'hangar') hangars.push(made)
        if (made.kind === 'silo-seed') seedSilos.push(made)
        if (made.kind === 'silo-spray') spraySilos.push(made)
        if (made.kind === 'silo-produce') produceSilos.push(made)
      }
    }
  }
  if (house === undefined || truck === undefined || silo === undefined || additives === undefined) return undefined
  const chunks = new Map<string, Cell[][]>()
  for (const ch of chunkSaves) {
    const { col0, row0 } = chunkRect(ch.id)
    const grid: Cell[][] = []
    for (let row = 0; row < CHUNK; row++) {
      const line: Cell[] = []
      for (let col = 0; col < CHUNK; col++) {
        const sc = ch.cells[row][col]
        const at = { col: col0 + col, row: row0 + row }
        if (sc.kind === 'occ') {
          const inst = origins.get(`${sc.of.col},${sc.of.row}`)
          if (inst === undefined) return undefined
          const origin = originOf(inst, owned)
          if (origin === undefined || origin.col !== sc.of.col || origin.row !== sc.of.row) return undefined
          const occ = occupiedCells(
            inst.kind === 'house' ||
              inst.kind === 'pump' ||
              inst.kind === 'rain-tank' ||
              inst.kind === 'tap' ||
              inst.kind === 'well' ||
              inst.kind === 'rock' ||
              inst.kind === 'tree' ||
              inst.kind === 'chest' ||
              inst.kind === 'grinder' ||
              inst.kind === 'compost-box' ||
              inst.kind === 'mill' ||
              inst.kind === 'jam' ||
              inst.kind === 'still' ||
              inst.kind === 'furnace' ||
              inst.kind === 'barrel' ||
              inst.kind === 'freezer' ||
              inst.kind === 'hangar' ||
              inst.kind === 'silo-seed' ||
              inst.kind === 'silo-spray' ||
              inst.kind === 'silo-produce' ||
              inst.kind === 'seed-silo' ||
              inst.kind === 'additive-store' ||
              inst.kind === 'truck'
              ? inst.base
              : { shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 },
            owned,
          )
          if (!occ.some(p => p.col === at.col && p.row === at.row)) return undefined
          line.push(inst)
        } else {
          const inst = origins.get(`${at.col},${at.row}`)
          if (inst === undefined) return undefined
          line.push(inst)
        }
      }
      grid.push(line)
    }
    chunks.set(chunkKey(ch.id), grid)
  }
  return { chunks, house, truck, silo, additives, pumps, tanks, taps, wells, stills, waterSystems, hangars, seedSilos, spraySilos, produceSilos }
}

function makeLive(sc: SaveCell): Cell | undefined {
  switch (sc.kind) {
    case 'untilled':
      return { kind: 'untilled', ground: sc.ground, cover: sc.cover }
    case 'empty':
      return { kind: 'empty', soil: makeSoil(sc.soil) }
    case 'infertile':
      return { kind: 'infertile' }
    case 'weed': {
      const weed = new Weed(sc.weed.variant)
      weed.maturity = sc.weed.maturity
      weed.spread = sc.weed.spread
      return { kind: 'weed', soil: makeSoil(sc.soil), weed }
    }
    case 'turf': {
      const turf = new Turf(sc.turf.variant)
      turf.maturity = sc.turf.maturity
      return { kind: 'turf', soil: makeSoil(sc.soil), turf }
    }
    case 'growing':
    case 'ripe':
    case 'dead':
      return { kind: sc.kind, soil: makeSoil(sc.soil), plant: makePlant(sc.plant) }
    case 'rotten':
      return { kind: 'rotten', soil: makeSoil(sc.soil), crop: sc.crop }
    case 'house':
      return new House(sc.base, DOOR)
    case 'pump': {
      const pump = new Pump(sc.base, sc.form)
      pump.water.stored = sc.stored
      return pump
    }
    case 'rain-tank': {
      const tank = new RainTank(sc.base)
      tank.water.stored = sc.stored
      return tank
    }
    case 'tap':
      return new Tap(sc.base)
    case 'well': {
      const well = new Well(sc.base)
      well.water.stored = sc.stored
      return well
    }
    case 'rock':
      return new Rock(sc.base)
    case 'tree': {
      const tree = new Tree(sc.species, sc.base, sc.juvenile, sc.fruit, sc.yield)
      tree.tended = sc.tended
      tree.trunk = sc.trunk
      tree.variety = sc.variety
      return tree
    }
    case 'chest': {
      const chest = new Chest(sc.base)
      for (let i = 0; i < CHEST_SLOTS; i++) chest.slots[i] = sc.slots[i]
      chest.out = sc.out
      chest.hold = sc.hold
      return chest
    }
    case 'seed-silo': {
      const silo = new SeedSilo(sc.base, sc.useDefault)
      sc.seeds.forEach(st => silo.seeds.push({ ...st }))
      silo.out = sc.out
      silo.hold = sc.hold
      return silo
    }
    case 'additive-store': {
      const store = new AdditiveStore(sc.base, sc.useDefault)
      sc.held.forEach(h => store.held.push({ ...h }))
      store.out = sc.out
      store.hold = sc.hold
      return store
    }
    case 'grinder': {
      const g = new Grinder(sc.base)
      g.crop = sc.crop
      g.variety = sc.variety
      g.quality = sc.quality
      g.units = sc.units
      g.progress = sc.progress
      g.n = sc.n
      return g
    }
    case 'compost-box': {
      const box = new CompostBox(sc.base)
      box.units = sc.units
      box.progress = sc.progress
      return box
    }
    case 'mill': {
      const mill = new Mill(sc.base)
      mill.recipe = sc.recipe
      mill.variety = sc.variety
      mill.quality = sc.quality
      mill.units = sc.units
      mill.progress = sc.progress
      mill.inn = sc.inn
      return mill
    }
    case 'jam': {
      const jam = new JamMachine(sc.base)
      jam.crop = sc.crop
      jam.variety = sc.variety
      jam.quality = sc.quality
      jam.fruit = sc.fruit
      jam.sugar = sc.sugar
      jam.progress = sc.progress
      jam.inn = sc.inn
      return jam
    }
    case 'still': {
      const still = new PotStill(sc.base)
      still.feed = sc.feed.map(f => ({ ...f }))
      still.progress = sc.progress
      still.n = sc.n
      still.inn = sc.inn
      return still
    }
    case 'furnace': {
      const furnace = new Furnace(sc.base)
      furnace.units = sc.units
      furnace.progress = sc.progress
      furnace.inn = sc.inn
      furnace.out = sc.out
      furnace.hold = sc.hold
      return furnace
    }
    case 'barrel': {
      const barrel = new Barrel(sc.base)
      barrel.crop = sc.crop
      barrel.feed = sc.feed.map(f => ({ ...f }))
      barrel.age = sc.age
      barrel.n = sc.n
      return barrel
    }
    case 'freezer': {
      const freezer = new Freezer(sc.base, sc.slots.length)
      for (let i = 0; i < sc.slots.length; i++) freezer.slots[i] = sc.slots[i]
      freezer.out = sc.out
      freezer.hold = sc.hold
      return freezer
    }
    case 'hangar':
      return new Hangar(sc.base)
    case 'silo-seed':
      return new SiloSeed(sc.base)
    case 'silo-spray':
      return new SiloSpray(sc.base)
    case 'silo-produce':
      return new SiloProduce(sc.base)
    case 'truck':
      return new Truck(sc.base)
    case 'lever': {
      const made = new Lever(sc.base)
      made.on = sc.on
      made.inn = sc.inn
      made.prev = sc.prev
      made.out = sc.out
      return made
    }
    case 'button': {
      const made = new Button(sc.base)
      made.left = sc.left
      made.out = sc.out
      return made
    }
    case 'lamp': {
      const made = new Lamp(sc.base)
      made.inn = sc.inn
      return made
    }
    case 'or': {
      const made = new OrGate(sc.base)
      made.out = sc.out
      return made
    }
    case 'and': {
      const made = new AndGate(sc.base)
      made.out = sc.out
      return made
    }
    case 'not': {
      const made = new NotGate(sc.base)
      made.out = sc.out
      return made
    }
    case 'pulser': {
      const made = new Pulser(sc.base)
      made.inn = sc.inn
      made.prev = sc.prev
      made.out = sc.out
      return made
    }
    case 'counter': {
      const made = new Counter(sc.base)
      made.inn = sc.inn
      made.n = sc.n
      made.count = sc.count
      made.out = sc.out
      return made
    }
    case 'sensor-water': {
      const made = new WaterSensor(sc.base)
      made.wilt = sc.wilt
      made.over = sc.over
      made.out = sc.out
      made.hold = sc.hold
      return made
    }
    case 'sensor-fert': {
      const made = new FertSensor(sc.base)
      made.out = sc.out
      made.hold = sc.hold
      return made
    }
    case 'sensor-harvest': {
      const made = new HarvestSensor(sc.base)
      made.mode = sc.mode
      made.out = sc.out
      made.hold = sc.hold
      return made
    }
    case 'sensor-day': {
      const made = new DaySensor(sc.base)
      made.sunrise = sc.sunrise
      made.day = sc.day
      made.sunset = sc.sunset
      made.twilight = sc.twilight
      made.out = sc.out
      made.hold = sc.hold
      return made
    }
    case 'water-system': {
      const made = new WaterSystem(sc.base)
      made.out = sc.out
      made.hold = sc.hold
      return made
    }
    case 'vehicle-detector': {
      const made = new VehicleSensor(sc.base)
      made.out = sc.out
      made.hold = sc.hold
      return made
    }
    case 'traffic-light': {
      const made = new TrafficLight(sc.base)
      made.inn = sc.inn
      made.out = sc.out
      made.hold = sc.hold
      return made
    }
    case 'occ':
      return undefined
  }
}

function makeSoil(s: SaveSoil): Soil {
  const soil = new Soil(s.water, s.fertilizer, s.weedChance)
  soil.bio = s.bio
  return soil
}

function makePlant(p: SavePlant): Plant {
  const plant = new Plant(p.crop, p.variety, p.quality)
  plant.maturity = p.maturity
  plant.freshness = p.freshness
  plant.happiness = p.happiness
  plant.bio = p.bio
  plant.tended = p.tended
  return plant
}

function readSaveCell(v: unknown): SaveCell | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const kind = o.kind
  if (kind === 'untilled') {
    const ground = readGround(o.ground)
    const cover = readCover(o.cover)
    if (ground === undefined || cover === undefined) return undefined
    return { kind: 'untilled', ground, cover }
  }
  if (kind === 'empty') {
    const soil = readSoil(o.soil)
    if (soil === undefined) return undefined
    return { kind: 'empty', soil }
  }
  if (kind === 'infertile') return { kind: 'infertile' }
  if (kind === 'weed') {
    const soil = readSoil(o.soil)
    const weed = readWeed(o.weed)
    if (soil === undefined || weed === undefined) return undefined
    return { kind: 'weed', soil, weed }
  }
  if (kind === 'turf') {
    const soil = readSoil(o.soil)
    const turf = readTurf(o.turf)
    if (soil === undefined || turf === undefined) return undefined
    return { kind: 'turf', soil, turf }
  }
  if (kind === 'growing' || kind === 'ripe' || kind === 'dead') {
    const soil = readSoil(o.soil)
    const plant = readPlant(o.plant)
    if (soil === undefined || plant === undefined) return undefined
    return { kind, soil, plant }
  }
  if (kind === 'rotten') {
    const soil = readSoil(o.soil)
    if (soil === undefined || !isCropId(o.crop)) return undefined
    return { kind: 'rotten', soil, crop: o.crop }
  }
  if (kind === 'house') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'house', base }
  }
  if (kind === 'pump') {
    const form = o.form
    if (form !== 'starter' && form !== 'jack') return undefined
    const base = readBase(o.base)
    const stored = num(o.stored)
    if (base === undefined || stored === undefined) return undefined
    return { kind: 'pump', form, base, stored }
  }
  if (kind === 'rain-tank') {
    const base = readRectBase(o.base)
    const stored = num(o.stored)
    if (base === undefined || stored === undefined) return undefined
    return { kind: 'rain-tank', base, stored }
  }
  if (kind === 'tap') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'tap', base }
  }
  if (kind === 'well') {
    const base = readRectBase(o.base)
    const stored = num(o.stored)
    if (base === undefined || stored === undefined) return undefined
    return { kind: 'well', base, stored }
  }
  if (kind === 'rock') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'rock', base }
  }
  if (kind === 'tree') {
    if (!isTreeIdValue(o.species)) return undefined
    const base = readRectBase(o.base)
    const juvenile = num(o.juvenile)
    const fruit = num(o.fruit)
    const y = readTreeYield(o.yield)
    const tended = bool(o.tended)
    const trunk = bool(o.trunk)
    const variety = readVariety(o.variety)
    if (base === undefined || juvenile === undefined || fruit === undefined || y === undefined || tended === undefined || trunk === undefined || variety === undefined) return undefined
    return { kind: 'tree', species: o.species, base, juvenile, fruit, yield: y, tended, trunk, variety }
  }
  if (kind === 'chest') {
    const base = readRectBase(o.base)
    const slotsIn = arr(o.slots)
    const hold = num(o.hold)
    if (base === undefined || slotsIn === undefined || slotsIn.length !== CHEST_SLOTS || hold === undefined) return undefined
    if (o.out !== 0 && o.out !== 1) return undefined
    const slots: Slot[] = []
    for (const s of slotsIn) {
      const slot = readHand(s)
      if (slot === undefined) return undefined
      slots.push(slot)
    }
    return { kind: 'chest', base, slots, out: o.out, hold }
  }
  if (kind === 'seed-silo') {
    const base = readRectBase(o.base)
    const useDefault = bool(o.useDefault)
    const seedsIn = arr(o.seeds)
    const hold = num(o.hold)
    if (base === undefined || useDefault === undefined || seedsIn === undefined || hold === undefined) return undefined
    if (o.out !== 0 && o.out !== 1) return undefined
    const seeds: SiloStack[] = []
    for (const v of seedsIn) {
      const st = readSiloStack(v)
      if (st === undefined) return undefined
      seeds.push(st)
    }
    return { kind: 'seed-silo', base, useDefault, seeds, out: o.out, hold }
  }
  if (kind === 'additive-store') {
    const base = readRectBase(o.base)
    const useDefault = bool(o.useDefault)
    const heldIn = arr(o.held)
    const hold = num(o.hold)
    if (base === undefined || useDefault === undefined || heldIn === undefined || hold === undefined) return undefined
    if (o.out !== 0 && o.out !== 1) return undefined
    const held: AdditiveHold[] = []
    for (const v of heldIn) {
      const h = readAdditiveHold(v)
      if (h === undefined) return undefined
      held.push(h)
    }
    return { kind: 'additive-store', base, useDefault, held, out: o.out, hold }
  }
  if (kind === 'grinder') {
    const base = readRectBase(o.base)
    const crop = o.crop === 'none' ? 'none' : readCropId(o.crop)
    const variety = readVariety(o.variety)
    const quality = num(o.quality)
    const units = num(o.units)
    const progress = num(o.progress)
    const n = num(o.n)
    if (base === undefined || crop === undefined || variety === undefined || quality === undefined || units === undefined || progress === undefined || n === undefined) {
      return undefined
    }
    return { kind: 'grinder', base, crop, variety, quality, units, progress, n }
  }
  if (kind === 'compost-box') {
    const base = readRectBase(o.base)
    const units = num(o.units)
    const progress = num(o.progress)
    if (base === undefined || units === undefined || progress === undefined) return undefined
    return { kind: 'compost-box', base, units, progress }
  }
  if (kind === 'mill') {
    const base = readRectBase(o.base)
    const recipe = readMillRecipe(o.recipe)
    const variety = readVariety(o.variety)
    const quality = num(o.quality)
    const units = num(o.units)
    const progress = num(o.progress)
    if (base === undefined || recipe === undefined || variety === undefined || quality === undefined || units === undefined || progress === undefined) return undefined
    if (o.inn !== 0 && o.inn !== 1) return undefined
    return { kind: 'mill', base, recipe, variety, quality, units, progress, inn: o.inn }
  }
  if (kind === 'jam') {
    const base = readRectBase(o.base)
    const crop = readJamCropOrNone(o.crop)
    const variety = readVariety(o.variety)
    const quality = num(o.quality)
    const fruit = num(o.fruit)
    const sugar = num(o.sugar)
    const progress = num(o.progress)
    if (base === undefined || crop === undefined || variety === undefined || quality === undefined || fruit === undefined || sugar === undefined || progress === undefined) {
      return undefined
    }
    if (o.inn !== 0 && o.inn !== 1) return undefined
    return { kind: 'jam', base, crop, variety, quality, fruit, sugar, progress, inn: o.inn }
  }
  if (kind === 'still') {
    const base = readRectBase(o.base)
    const feedIn = arr(o.feed)
    const progress = num(o.progress)
    const n = num(o.n)
    if (base === undefined || feedIn === undefined || progress === undefined || n === undefined) return undefined
    if (base.w !== 2 || base.h !== 1) return undefined
    if (o.inn !== 0 && o.inn !== 1) return undefined
    const feed: { crop: StillCrop; variety: VarietyId; quality: number; count: number }[] = []
    for (const f of feedIn) {
      const e = readStillFeed(f)
      if (e === undefined) return undefined
      feed.push(e)
    }
    return { kind: 'still', base, feed, progress, n, inn: o.inn }
  }
  if (kind === 'furnace') {
    const base = readRectBase(o.base)
    const units = num(o.units)
    const progress = num(o.progress)
    const hold = num(o.hold)
    if (base === undefined || units === undefined || progress === undefined || hold === undefined) return undefined
    if (base.w !== 1 || base.h !== 2) return undefined
    if (o.inn !== 0 && o.inn !== 1) return undefined
    if (o.out !== 0 && o.out !== 1) return undefined
    return { kind: 'furnace', base, units, progress, inn: o.inn, out: o.out, hold }
  }
  if (kind === 'barrel') {
    const base = readRectBase(o.base)
    const crop = readBarrelCropOrNone(o.crop)
    const feedIn = arr(o.feed)
    const age = num(o.age)
    const n = num(o.n)
    if (base === undefined || crop === undefined || feedIn === undefined || age === undefined || n === undefined) {
      return undefined
    }
    const feed: { variety: VarietyId; quality: number; count: number }[] = []
    for (const f of feedIn) {
      const e = readBarrelFeed(f)
      if (e === undefined) return undefined
      feed.push(e)
    }
    return { kind: 'barrel', base, crop, feed, age, n }
  }
  if (kind === 'freezer') {
    const base = readRectBase(o.base)
    const slotsIn = arr(o.slots)
    const hold = num(o.hold)
    const sized = slotsIn !== undefined && (slotsIn.length === FREEZER_SLOTS || slotsIn.length === FREEZER_LARGE_SLOTS)
    if (base === undefined || slotsIn === undefined || !sized || hold === undefined) {
      return undefined
    }
    if (o.out !== 0 && o.out !== 1) return undefined
    const slots: Slot[] = []
    for (const s of slotsIn) {
      const slot = readHand(s)
      if (slot === undefined) return undefined
      slots.push(slot)
    }
    return { kind: 'freezer', base, slots, out: o.out, hold }
  }
  if (kind === 'hangar') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'hangar', base }
  }
  if (kind === 'silo-seed') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'silo-seed', base }
  }
  if (kind === 'silo-spray') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'silo-spray', base }
  }
  if (kind === 'silo-produce') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'silo-produce', base }
  }
  if (kind === 'truck') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'truck', base }
  }
  if (kind === 'lever') {
    const base = readRectBase(o.base)
    const on = bool(o.on)
    if (base === undefined || on === undefined) return undefined
    if ((o.inn !== 0 && o.inn !== 1) || (o.prev !== 0 && o.prev !== 1) || (o.out !== 0 && o.out !== 1)) return undefined
    return { kind: 'lever', base, on, inn: o.inn, prev: o.prev, out: o.out }
  }
  if (kind === 'button') {
    const base = readRectBase(o.base)
    const left = num(o.left)
    if (base === undefined || left === undefined || (o.out !== 0 && o.out !== 1)) return undefined
    return { kind: 'button', base, left, out: o.out }
  }
  if (kind === 'lamp') {
    const base = readRectBase(o.base)
    if (base === undefined || (o.inn !== 0 && o.inn !== 1)) return undefined
    return { kind: 'lamp', base, inn: o.inn }
  }
  if (kind === 'or' || kind === 'and' || kind === 'not') {
    const base = readRectBase(o.base)
    if (base === undefined || (o.out !== 0 && o.out !== 1)) return undefined
    return { kind, base, out: o.out }
  }
  if (kind === 'pulser') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    if ((o.inn !== 0 && o.inn !== 1) || (o.prev !== 0 && o.prev !== 1) || (o.out !== 0 && o.out !== 1)) return undefined
    return { kind: 'pulser', base, inn: o.inn, prev: o.prev, out: o.out }
  }
  if (kind === 'counter') {
    const base = readRectBase(o.base)
    const n = num(o.n)
    const count = num(o.count)
    if (base === undefined || n === undefined || count === undefined) return undefined
    if (!Number.isInteger(n) || n < 1 || n > COUNTER_MAX) return undefined
    if (!Number.isInteger(count) || count < 0) return undefined
    if (o.inn !== 0 && o.inn !== 1) return undefined
    if (o.out !== 0 && o.out !== 1) return undefined
    return { kind: 'counter', base, inn: o.inn, n, count, out: o.out }
  }
  if (kind === 'sensor-water') {
    const base = readRectBase(o.base)
    const wilt = bool(o.wilt)
    const over = bool(o.over)
    const hold = num(o.hold)
    if (base === undefined || wilt === undefined || over === undefined || hold === undefined) return undefined
    if (o.out !== 0 && o.out !== 1) return undefined
    return { kind: 'sensor-water', base, wilt, over, out: o.out, hold }
  }
  if (kind === 'sensor-fert' || kind === 'water-system' || kind === 'vehicle-detector') {
    const base = readRectBase(o.base)
    const hold = num(o.hold)
    if (base === undefined || hold === undefined || (o.out !== 0 && o.out !== 1)) return undefined
    return { kind, base, out: o.out, hold }
  }
  if (kind === 'traffic-light') {
    const base = readRectBase(o.base)
    const hold = num(o.hold)
    if (base === undefined || hold === undefined) return undefined
    if ((o.inn !== 0 && o.inn !== 1) || (o.out !== 0 && o.out !== 1)) return undefined
    return { kind: 'traffic-light', base, inn: o.inn, out: o.out, hold }
  }
  if (kind === 'sensor-harvest') {
    const base = readRectBase(o.base)
    const hold = num(o.hold)
    if (base === undefined || hold === undefined || (o.mode !== 'any' && o.mode !== 'all')) return undefined
    if (o.out !== 0 && o.out !== 1) return undefined
    return { kind: 'sensor-harvest', base, mode: o.mode, out: o.out, hold }
  }
  if (kind === 'sensor-day') {
    const base = readRectBase(o.base)
    const hold = num(o.hold)
    const sunrise = bool(o.sunrise)
    const day = bool(o.day)
    const sunset = bool(o.sunset)
    const twilight = bool(o.twilight)
    if (base === undefined || hold === undefined || sunrise === undefined || day === undefined || sunset === undefined || twilight === undefined) {
      return undefined
    }
    if (o.out !== 0 && o.out !== 1) return undefined
    return { kind: 'sensor-day', base, sunrise, day, sunset, twilight, out: o.out, hold }
  }
  if (kind === 'occ') {
    const of = readCoord(o.of)
    if (of === undefined) return undefined
    return { kind: 'occ', of }
  }
  return undefined
}

function dumpPose(pose: Vehicle['pose']): SaveVehicle['pose'] {
  return pose.kind === 'stored'
    ? { kind: 'stored', hangar: { col: pose.hangar.col, row: pose.hangar.row } }
    : {
        kind: 'field',
        x: pose.x,
        y: pose.y,
        heading: pose.heading,
        speed: pose.speed,
        driver: pose.driver,
      }
}

function dumpVehicle(v: Vehicle): SaveVehicle {
  if (v.kind === 'quad') {
    return { kind: 'quad', id: v.id, fuel: v.fuel, slots: v.slots.slice(), pose: dumpPose(v.pose), route: v.route, cursor: v.cursor, running: v.running, dwell: v.dwell }
  }
  return { kind: 'tractor', id: v.id, fuel: v.fuel, hitch: v.hitch, boom: v.boom, pose: dumpPose(v.pose), route: v.route, cursor: v.cursor, running: v.running, dwell: v.dwell }
}

function dumpTrailer(t: Trailer): SaveTrailer {
  const pose = t.pose.kind === 'stored'
    ? { kind: 'stored' as const, hangar: { col: t.pose.hangar.col, row: t.pose.hangar.row } }
    : { kind: 'attached' as const, vehicle: t.pose.vehicle, heading: t.pose.heading }
  if (t.kind === 'seed') return { kind: 'seed', id: t.id, pose, hopper: t.hopper }
  if (t.kind === 'spray') return { kind: 'spray', id: t.id, pose, hopper: t.hopper }
  return { kind: 'harvest', id: t.id, pose, slots: t.slots.slice() }
}

function liveVehicle(v: SaveVehicle): Vehicle {
  const pose = v.pose.kind === 'stored' ? { kind: 'stored' as const, hangar: { ...v.pose.hangar } } : { ...v.pose }
  const made = v.kind === 'quad' ? makeQuad(v.id, v.fuel, v.slots.slice(), pose) : makeTractor(v.id, v.fuel, v.hitch, v.boom, pose)
  made.route = v.route
  made.cursor = v.cursor
  made.running = v.running
  return made
}

function liveTrailer(t: SaveTrailer): Trailer {
  const pose = t.pose.kind === 'stored' ? { kind: 'stored' as const, hangar: { ...t.pose.hangar } } : { ...t.pose }
  if (t.kind === 'seed') return { kind: 'seed', id: t.id, pose, hopper: t.hopper }
  if (t.kind === 'spray') return { kind: 'spray', id: t.id, pose, hopper: t.hopper }
  return { kind: 'harvest', id: t.id, pose, slots: t.slots.slice() }
}

function readVehiclePose(v: unknown): SaveVehicle['pose'] | undefined {
  const poseIn = obj(v)
  if (poseIn === undefined) return undefined
  if (poseIn.kind === 'stored') {
    const hangar = readCoord(poseIn.hangar)
    if (hangar === undefined) return undefined
    return { kind: 'stored', hangar }
  }
  if (poseIn.kind === 'field') {
    const x = num(poseIn.x)
    const y = num(poseIn.y)
    const heading = num(poseIn.heading)
    const speed = num(poseIn.speed)
    const driver =
      poseIn.driver === 'none' || poseIn.driver === 0 || poseIn.driver === 1 || poseIn.driver === 2 || poseIn.driver === 3
        ? poseIn.driver
        : undefined
    if (x === undefined || y === undefined || heading === undefined || speed === undefined || driver === undefined) {
      return undefined
    }
    return { kind: 'field', x, y, heading, speed, driver }
  }
  return undefined
}

function readTrailerPose(v: unknown): TrailerPose | undefined {
  const poseIn = obj(v)
  if (poseIn === undefined) return undefined
  if (poseIn.kind === 'stored') {
    const hangar = readCoord(poseIn.hangar)
    if (hangar === undefined) return undefined
    return { kind: 'stored', hangar }
  }
  if (poseIn.kind === 'attached') {
    const vehicle = num(poseIn.vehicle)
    const heading = num(poseIn.heading)
    if (vehicle === undefined || heading === undefined) return undefined
    return { kind: 'attached', vehicle, heading }
  }
  return undefined
}

function readSlots(v: unknown, n: number): Slot[] | undefined {
  const slotsIn = arr(v)
  if (slotsIn === undefined || slotsIn.length !== n) return undefined
  const slots: Slot[] = []
  for (const s of slotsIn) {
    const slot = readHand(s)
    if (slot === undefined) return undefined
    slots.push(slot)
  }
  return slots
}

function readCoordStop(v: unknown): Coord | undefined {
  return readCoord(v)
}

function readRouteStop(v: unknown): RouteStop | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'goto') {
    const x = num(o.x)
    const y = num(o.y)
    if (x === undefined || y === undefined) return undefined
    return { kind: 'goto', x, y }
  }
  if (o.kind === 'unload' || o.kind === 'load' || o.kind === 'wait') {
    const at = readCoordStop(o.at)
    if (at === undefined) return undefined
    return { kind: o.kind, at }
  }
  return undefined
}

function readRoute(v: unknown): Route | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const id = num(o.id)
  if (id === undefined || !Number.isInteger(id) || id < 1) return undefined
  if (typeof o.name !== 'string') return undefined
  const stopsIn = arr(o.stops)
  if (stopsIn === undefined) return undefined
  const stops: RouteStop[] = []
  for (const raw of stopsIn) {
    const s = readRouteStop(raw)
    if (s === undefined) return undefined
    stops.push(s)
  }
  return { id, name: o.name, stops }
}

function readRouteId(v: unknown): RouteId | 'none' | undefined {
  if (v === 'none') return 'none'
  const n = num(v)
  if (n === undefined || !Number.isInteger(n) || n < 1) return undefined
  return n
}

function readVehicle(v: unknown): SaveVehicle | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const id = num(o.id)
  const fuel = num(o.fuel)
  const pose = readVehiclePose(o.pose)
  const route = readRouteId(o.route)
  const cursor = num(o.cursor)
  if (id === undefined || fuel === undefined || pose === undefined || route === undefined || cursor === undefined) return undefined
  if (!Number.isInteger(cursor) || cursor < 0) return undefined
  if (typeof o.running !== 'boolean') return undefined
  const dwell = num(o.dwell)
  if (dwell === undefined || dwell < 0) return undefined
  if (pose.kind === 'stored' && o.running) return undefined
  if (pose.kind === 'field' && pose.driver !== 'none' && o.running) return undefined
  if (o.running && route === 'none') return undefined
  if (o.kind === 'quad') {
    const slots = readSlots(o.slots, VEHICLE_SLOTS)
    if (slots === undefined) return undefined
    return { kind: 'quad', id, fuel, slots, pose, route, cursor, running: o.running, dwell }
  }
  if (o.kind === 'tractor') {
    const hitch = o.hitch === 'none' || typeof o.hitch === 'number' ? o.hitch : undefined
    const boom = o.boom === 3 || o.boom === 5 ? o.boom : undefined
    if (hitch === undefined || boom === undefined) return undefined
    if (pose.kind === 'stored' && hitch !== 'none') return undefined
    return { kind: 'tractor', id, fuel, hitch, boom, pose, route, cursor, running: o.running, dwell }
  }
  return undefined
}

function readSeedHopper(v: unknown): SeedHopper | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'empty') return { kind: 'empty' }
  if (o.kind === 'hold') {
    const item = readItem(o.item)
    if (item === undefined || item.kind !== 'seeds') return undefined
    return { kind: 'hold', item }
  }
  return undefined
}

function readSprayHopper(v: unknown): SprayHopper | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'empty') return { kind: 'empty' }
  if (o.kind === 'hold') {
    const item = readItem(o.item)
    if (item === undefined || (item.kind !== 'fertilizer' && item.kind !== 'synth' && item.kind !== 'compost')) return undefined
    return { kind: 'hold', item }
  }
  return undefined
}

function readTrailer(v: unknown): SaveTrailer | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const id = num(o.id)
  const pose = readTrailerPose(o.pose)
  if (id === undefined || pose === undefined) return undefined
  if (o.kind === 'seed') {
    const hopper = readSeedHopper(o.hopper)
    if (hopper === undefined) return undefined
    return { kind: 'seed', id, pose, hopper }
  }
  if (o.kind === 'spray') {
    const hopper = readSprayHopper(o.hopper)
    if (hopper === undefined) return undefined
    return { kind: 'spray', id, pose, hopper }
  }
  if (o.kind === 'harvest') {
    const slots = readSlots(o.slots, HARVEST_SLOTS)
    if (slots === undefined) return undefined
    return { kind: 'harvest', id, pose, slots }
  }
  return undefined
}

function readSoil(v: unknown): SaveSoil | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const water = num(o.water)
  const fertilizer = num(o.fertilizer)
  const bio = bool(o.bio)
  const weedChance = num(o.weedChance)
  if (water === undefined || fertilizer === undefined || bio === undefined || weedChance === undefined) return undefined
  return { water, fertilizer, bio, weedChance }
}

function readPlant(v: unknown): SavePlant | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (!isAnnual(o.crop)) return undefined
  const variety = readVariety(o.variety)
  const quality = num(o.quality)
  const maturity = num(o.maturity)
  const freshness = num(o.freshness)
  const happiness = num(o.happiness)
  const bio = bool(o.bio)
  const tended = bool(o.tended)
  if (
    variety === undefined ||
    quality === undefined ||
    maturity === undefined ||
    freshness === undefined ||
    happiness === undefined ||
    bio === undefined ||
    tended === undefined
  ) {
    return undefined
  }
  return { crop: o.crop, variety, quality, maturity, freshness, happiness, bio, tended }
}

function readWeed(v: unknown): SaveWeed | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const variant = o.variant
  const maturity = num(o.maturity)
  const spread = bool(o.spread)
  if ((variant !== 0 && variant !== 1) || maturity === undefined || spread === undefined) return undefined
  return { variant, maturity, spread }
}

function readTurf(v: unknown): SaveTurf | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const variant = o.variant
  const maturity = num(o.maturity)
  if ((variant !== 0 && variant !== 1 && variant !== 2) || maturity === undefined) return undefined
  return { variant, maturity }
}

function readGround(v: unknown): Ground | undefined {
  if (v === 'soft' || v === 'hard' || v === 'very-hard') return v
  return undefined
}

function readCover(v: unknown): Cover | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'bare') return { kind: 'bare' }
  if (o.kind === 'grass') {
    const variant = o.variant
    if (variant !== 0 && variant !== 1 && variant !== 2) return undefined
    return { kind: 'grass', variant }
  }
  if (o.kind === 'tile') {
    if (o.tile !== 'paved' && o.tile !== 'brick' && o.tile !== 'cobble') return undefined
    return { kind: 'tile', tile: o.tile as TileId }
  }
  return undefined
}

function readRectBase(v: unknown): RectBase | undefined {
  const o = obj(v)
  if (o === undefined || o.shape !== 'rect') return undefined
  const col = num(o.col)
  const row = num(o.row)
  const w = num(o.w)
  const h = num(o.h)
  if (col === undefined || row === undefined || w === undefined || h === undefined) return undefined
  return { shape: 'rect', col, row, w, h }
}

function readBase(v: unknown): Base | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.shape === 'rect') return readRectBase(o)
  if (o.shape === 'circle') {
    const cx = num(o.cx)
    const cy = num(o.cy)
    const r = num(o.r)
    if (cx === undefined || cy === undefined || r === undefined) return undefined
    return { shape: 'circle', cx, cy, r }
  }
  return undefined
}

function readTreeYield(v: unknown): TreeYield | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'pending') return { kind: 'pending' }
  if (o.kind === 'on') {
    if (o.daysLeft !== 1 && o.daysLeft !== 2) return undefined
    return { kind: 'on', daysLeft: o.daysLeft }
  }
  if (o.kind === 'off') {
    const chance = num(o.chance)
    if (chance === undefined) return undefined
    return { kind: 'off', chance }
  }
  return undefined
}

function readCoord(v: unknown): Coord | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const col = num(o.col)
  const row = num(o.row)
  if (col === undefined || row === undefined) return undefined
  return { col, row }
}

function readJob(v: unknown): Job | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'idle') return { kind: 'idle' }
  if (o.kind === 'run') {
    if (!isResearchId(o.id)) return undefined
    const left = num(o.left)
    if (left === undefined) return undefined
    return { kind: 'run', id: o.id, left }
  }
  return undefined
}

function readMember<Id extends string>(
  v: unknown,
  ids: readonly Id[],
): SaveMember<Id> | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const pickCount = num(o.pickCount)
  const ownedIn = arr(o.owned)
  const offersIn = arr(o.offers)
  if (pickCount === undefined || ownedIn === undefined || offersIn === undefined) {
    return undefined
  }
  const owned: { id: Id; tier: number }[] = []
  for (const e of ownedIn) {
    const ref = readSkillRef(e, ids)
    if (ref === undefined) return undefined
    owned.push(ref)
  }
  const offers: { id: Id; tier: number }[] = []
  for (const e of offersIn) {
    const ref = readSkillRef(e, ids)
    if (ref === undefined) return undefined
    offers.push(ref)
  }
  return { pickCount, owned, offers }
}

function readSkillRef<Id extends string>(v: unknown, ids: readonly Id[]): { id: Id; tier: number } | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const id = o.id
  const tier = num(o.tier)
  if (typeof id !== 'string' || tier === undefined) return undefined
  if (!(ids as readonly string[]).includes(id)) return undefined
  return { id: id as Id, tier }
}

function readStallSave(v: unknown): Save['stall'] | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const stall = {} as Save['stall']
  for (const id of STALL_IDS) {
    const g = readStallGoodSave(o[id])
    if (g === undefined) return undefined
    stall[id] = g
  }
  return stall
}

function readStallGoodSave(v: unknown): SaveStallGood | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const offered = num(o.offered)
  const market = num(o.market)
  const target = num(o.target)
  const acc = num(o.acc)
  if (offered === undefined || market === undefined || target === undefined || acc === undefined) return undefined
  const stock = readBins(o.stock)
  const worth = readBins(o.worth)
  if (stock === undefined || worth === undefined) return undefined
  return { offered, market, target, acc, stock, worth }
}

function readBins(v: unknown): { [K in VarietyId]: { organic: number; synth: number } } | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const out = {} as { [K in VarietyId]: { organic: number; synth: number } }
  for (const r of VARIETY_IDS) {
    const b = obj(o[r])
    if (b === undefined) return undefined
    const organic = num(b.organic)
    const synth = num(b.synth)
    if (organic === undefined || synth === undefined) return undefined
    out[r] = { organic, synth }
  }
  return out
}

function readTally(v: Record<string, unknown>): DayTally | undefined {
  const died = num(v.died)
  const harvests = num(v.harvests)
  const researchIn = arr(v.research)
  if (died === undefined || harvests === undefined || researchIn === undefined) return undefined
  const research: ResearchId[] = []
  for (const id of researchIn) {
    if (!isResearchId(id)) return undefined
    research.push(id)
  }
  return { died, harvests, research, contracts: [] }
}

function readSeam(v: unknown): Seam | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'play') return { kind: 'play' }
  if (o.kind === 'recap') {
    const recap = readRecap(o.recap)
    if (recap === undefined) return undefined
    return { kind: 'recap', recap }
  }
  return undefined
}

function readRecap(v: unknown): Recap | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const day = num(o.day)
  const money = num(o.money)
  const stipend = num(o.stipend)
  const died = num(o.died)
  const harvests = num(o.harvests)
  const tax = num(o.tax)
  const water = num(o.water)
  const researchIn = arr(o.research)
  if (
    day === undefined ||
    money === undefined ||
    stipend === undefined ||
    died === undefined ||
    harvests === undefined ||
    tax === undefined ||
    water === undefined ||
    researchIn === undefined
  ) {
    return undefined
  }
  const research: ResearchId[] = []
  for (const id of researchIn) {
    if (!isResearchId(id)) return undefined
    research.push(id)
  }
  return { day, money, stipend, died, harvests, research, tax, water, contracts: [] }
}

function readSegment(v: unknown): Segment | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const at = readEdge(o.at)
  const gate = readGate(o.gate)
  if (at === undefined || gate === undefined) return undefined
  return { at, gate }
}

function readEdge(v: unknown): Edge | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.axis !== 'h' && o.axis !== 'v') return undefined
  const col = num(o.col)
  const row = num(o.row)
  if (col === undefined || row === undefined) return undefined
  return { axis: o.axis, col, row }
}

function readGate(v: unknown): Gate | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'bare') return { kind: 'bare' }
  if (o.kind === 'valve') {
    const open = bool(o.open)
    if (open === undefined) return undefined
    return { kind: 'valve', open }
  }
  return undefined
}

function readWire(v: unknown): Wire | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const from = readWireEnd(o.from)
  const to = readWireEnd(o.to)
  if (from === undefined || to === undefined) return undefined
  return { from, to }
}

function readWireEnd(v: unknown): WireEnd | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'cell') {
    const at = readCoord(o.at)
    if (at === undefined) return undefined
    if (o.port !== 'out' && o.port !== 'in' && o.port !== 'in-l' && o.port !== 'in-r') return undefined
    return { kind: 'cell', at, port: o.port }
  }
  if (o.kind === 'sprinkler') {
    const at = readCoord(o.at)
    if (at === undefined || o.port !== 'in') return undefined
    return { kind: 'sprinkler', at, port: 'in' }
  }
  if (o.kind === 'valve') {
    const e = readEdge(o.e)
    if (e === undefined || o.port !== 'in') return undefined
    return { kind: 'valve', e, port: 'in' }
  }
  return undefined
}

function readValveHold(v: unknown): Save['valveHold'][number] | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const e = readEdge(o.e)
  const hold = num(o.hold)
  if (e === undefined || hold === undefined) return undefined
  if (o.level !== 0 && o.level !== 1) return undefined
  return { e, level: o.level, hold }
}

function readSprinkler(v: unknown): Sprinkler | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const at = readCoord(o.at)
  const tune = readTune(o.tune)
  const hold = num(o.hold)
  if (at === undefined || tune === undefined || hold === undefined) return undefined
  if (o.inn !== 0 && o.inn !== 1) return undefined
  if (o.variant === 'basic') return { variant: 'basic', at, tune, inn: o.inn, hold }
  if (o.variant === 'large') return { variant: 'large', at, tune, inn: o.inn, hold }
  if (o.variant === 'vert') {
    if (o.facing !== 'ns' && o.facing !== 'ew') return undefined
    return { variant: 'vert', at, facing: o.facing, tune, inn: o.inn, hold }
  }
  return undefined
}

function readTune(v: unknown): Tune | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'flat') return { kind: 'flat' }
  if (o.kind === 'crop') {
    if (!isCropId(o.crop)) return undefined
    return { kind: 'crop', crop: o.crop }
  }
  return undefined
}

function readHand(v: unknown): Hand | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'empty') return { kind: 'empty' }
  if (o.kind !== 'hold') return undefined
  const item = readItem(o.item)
  if (item === undefined) return undefined
  return { kind: 'hold', item }
}

function readItem(v: unknown): Item | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  switch (o.kind) {
    case 'shovel': {
      if (!isShovelId(o.id)) return undefined
      const usesLeft = num(o.usesLeft)
      const workSeconds = num(o.workSeconds)
      if (usesLeft === undefined || workSeconds === undefined) return undefined
      return { kind: 'shovel', id: o.id, usesLeft, workSeconds }
    }
    case 'pickaxe': {
      if (!isPickaxeId(o.id)) return undefined
      const usesLeft = num(o.usesLeft)
      const workSeconds = num(o.workSeconds)
      if (usesLeft === undefined || workSeconds === undefined) return undefined
      return { kind: 'pickaxe', id: o.id, usesLeft, workSeconds }
    }
    case 'container': {
      if (!isContainerId(o.id)) return undefined
      const liters = num(o.liters)
      const capacityLiters = num(o.capacityLiters)
      if (liters === undefined || capacityLiters === undefined) return undefined
      return { kind: 'container', id: o.id, liters, capacityLiters }
    }
    case 'fertilizer':
    case 'synth':
    case 'compost': {
      const liters = num(o.liters)
      const capacityLiters = num(o.capacityLiters)
      if (liters === undefined || capacityLiters === undefined) return undefined
      return { kind: o.kind, liters, capacityLiters }
    }
    case 'seeds': {
      if (!isAnnual(o.crop)) return undefined
      const variety = readVariety(o.variety)
      const quality = num(o.quality)
      const count = num(o.count)
      if (variety === undefined || quality === undefined || count === undefined) return undefined
      return { kind: 'seeds', crop: o.crop, variety, quality, count }
    }
    case 'grass-seeds': {
      const count = num(o.count)
      if (count === undefined) return undefined
      return { kind: 'grass-seeds', count }
    }
    case 'fruit': {
      const stack = readFruitStack(o)
      if (stack === undefined) return undefined
      return { kind: 'fruit', ...stack }
    }
    case 'tree-seed': {
      if (!isTreeIdValue(o.tree)) return undefined
      const variety = readVariety(o.variety)
      const quality = num(o.quality)
      if (variety === undefined || quality === undefined) return undefined
      return { kind: 'tree-seed', tree: o.tree, variety, quality }
    }
    case 'sugar': {
      const liters = num(o.liters)
      const capacityLiters = num(o.capacityLiters)
      const unitSale = num(o.unitSale)
      const quality = num(o.quality)
      if (liters === undefined || capacityLiters === undefined || unitSale === undefined || quality === undefined) return undefined
      return { kind: 'sugar', liters, capacityLiters, unitSale, quality }
    }
    case 'spirit': {
      if (!isSpiritKind(o.spirit)) return undefined
      const variety = readVariety(o.variety)
      const quality = num(o.quality)
      const count = num(o.count)
      const unitSale = num(o.unitSale)
      if (variety === undefined || quality === undefined || count === undefined || unitSale === undefined) return undefined
      return { kind: 'spirit', spirit: o.spirit, variety, quality, count, unitSale }
    }
    case 'cask': {
      if (!isCaskId(o.cask)) return undefined
      const variety = readVariety(o.variety)
      const quality = num(o.quality)
      const count = num(o.count)
      const unitSale = num(o.unitSale)
      if (variety === undefined || quality === undefined || count === undefined || unitSale === undefined) return undefined
      return { kind: 'cask', cask: o.cask, variety, quality, count, unitSale }
    }
    case 'jam': {
      if (!isJamCrop(o.crop)) return undefined
      const variety = readVariety(o.variety)
      const quality = num(o.quality)
      const count = num(o.count)
      const unitSale = num(o.unitSale)
      if (variety === undefined || quality === undefined || count === undefined || unitSale === undefined) return undefined
      return { kind: 'jam', crop: o.crop, variety, quality, count, unitSale }
    }
    case 'oil':
    case 'flour':
    case 'extract': {
      const quality = num(o.quality)
      const count = num(o.count)
      const unitSale = num(o.unitSale)
      if (quality === undefined || count === undefined || unitSale === undefined) return undefined
      return { kind: o.kind, quality, count, unitSale }
    }
    case 'rotten':
    case 'dead': {
      const cls = readCropClass(o.cls)
      const count = num(o.count)
      if (cls === undefined || count === undefined) return undefined
      return { kind: o.kind, cls, count }
    }
    case 'weed':
    case 'grass': {
      const count = num(o.count)
      if (count === undefined) return undefined
      return { kind: o.kind, count }
    }
    case 'weed-spray': {
      const liters = num(o.liters)
      const capacityLiters = num(o.capacityLiters)
      if (liters === undefined || capacityLiters === undefined || liters < 1) return undefined
      return { kind: 'weed-spray', liters, capacityLiters }
    }
    case 'axe': {
      const usesLeft = num(o.usesLeft)
      const workSeconds = num(o.workSeconds)
      if (usesLeft === undefined || workSeconds === undefined) return undefined
      return { kind: 'axe', usesLeft, workSeconds }
    }
    case 'wood':
    case 'ash': {
      const count = num(o.count)
      if (count === undefined) return undefined
      return { kind: o.kind, count }
    }
    case 'graft': {
      if (!isCropId(o.crop)) return undefined
      const variety = readVariety(o.variety)
      const quality = num(o.quality)
      const count = num(o.count)
      if (variety === undefined || quality === undefined || count === undefined) return undefined
      return { kind: 'graft', crop: o.crop, variety, quality, count }
    }
    default:
      return undefined
  }
}

function readFruitStack(v: unknown): FruitStack | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (!isCropId(o.crop)) return undefined
  const variety = readVariety(o.variety)
  const quality = num(o.quality)
  const count = num(o.count)
  const unitSale = num(o.unitSale)
  const freshness = num(o.freshness)
  const bio = bool(o.bio)
  if (
    variety === undefined ||
    quality === undefined ||
    count === undefined ||
    unitSale === undefined ||
    freshness === undefined ||
    bio === undefined
  ) {
    return undefined
  }
  return { crop: o.crop, variety, quality, count, unitSale, freshness, bio }
}

function isShovelId(v: unknown): v is ShovelId {
  return typeof v === 'string' && v in SHOVELS
}

function isPickaxeId(v: unknown): v is PickaxeId {
  return typeof v === 'string' && v in PICKAXES
}

function isContainerId(v: unknown): v is ContainerId {
  return typeof v === 'string' && v in CONTAINERS
}

function readCropClass(v: unknown): CropClass | undefined {
  if (v === 'root' || v === 'grain' || v === 'fruit') return v
  return undefined
}

function isResearchId(v: unknown): v is ResearchId {
  return typeof v === 'string' && v in RESEARCH
}

function isAnnual(v: unknown): v is AnnualId {
  return typeof v === 'string' && isAnnualId(v as CropId)
}

function isTreeIdValue(v: unknown): v is TreeId {
  return typeof v === 'string' && isTreeId(v as CropId)
}

function isCropId(v: unknown): v is CropId {
  return typeof v === 'string' && ((ANNUAL_IDS as readonly string[]).includes(v) || (TREE_IDS as readonly string[]).includes(v))
}

function isSpiritKind(v: unknown): v is SpiritKind {
  return v === 'vodka' || v === 'beer' || v === 'brandy' || v === 'mixed'
}

function isJamCrop(v: unknown): v is JamCrop {
  return typeof v === 'string' && (JAM_CROPS as readonly string[]).includes(v)
}

function isStillCrop(v: unknown): v is StillCrop {
  return v === 'potato' || v === 'wheat' || v === 'apricot'
}

function readBarrelCropOrNone(v: unknown): BarrelCrop | 'none' | undefined {
  if (v === 'none' || v === 'grape' || v === 'apple') return v
  return undefined
}

function readMillRecipe(v: unknown): MillRecipe | 'none' | undefined {
  if (v === 'none' || (typeof v === 'string' && (MILL_RECIPES as readonly string[]).includes(v))) return v as MillRecipe | 'none'
  return undefined
}

function readCropId(v: unknown): CropId | undefined {
  return isCropId(v) ? v : undefined
}

function readJamCropOrNone(v: unknown): JamCrop | 'none' | undefined {
  if (v === 'none') return 'none'
  if (isJamCrop(v)) return v
  return undefined
}

function readStillFeed(v: unknown): { crop: StillCrop; variety: VarietyId; quality: number; count: number } | undefined {
  const o = obj(v)
  if (o === undefined || !isStillCrop(o.crop)) return undefined
  const variety = readVariety(o.variety)
  const quality = num(o.quality)
  const count = num(o.count)
  if (variety === undefined || quality === undefined || count === undefined) return undefined
  return { crop: o.crop, variety, quality, count }
}

function readBarrelFeed(v: unknown): { variety: VarietyId; quality: number; count: number } | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const variety = readVariety(o.variety)
  const quality = num(o.quality)
  const count = num(o.count)
  if (variety === undefined || quality === undefined || count === undefined) return undefined
  return { variety, quality, count }
}

function readSiloStack(v: unknown): SiloStack | undefined {
  const o = obj(v)
  if (o === undefined || !isAnnual(o.crop)) return undefined
  const variety = readVariety(o.variety)
  const quality = num(o.quality)
  const count = num(o.count)
  if (variety === undefined || quality === undefined || count === undefined) return undefined
  return { crop: o.crop, variety, quality, count }
}

function readAdditiveHold(v: unknown): AdditiveHold | undefined {
  const o = obj(v)
  if (o === undefined || !isAdditiveId(o.id)) return undefined
  const liters = num(o.liters)
  if (liters === undefined) return undefined
  return { id: o.id, liters }
}

function isAdditiveId(v: unknown): v is AdditiveId {
  return typeof v === 'string' && (ADDITIVE_IDS as readonly string[]).includes(v)
}

function readVariety(v: unknown): VarietyId | undefined {
  return isVarietyId(v) ? v : undefined
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function bool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}

function obj(v: unknown): Record<string, unknown> | undefined {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}

function arr(v: unknown): unknown[] | undefined {
  return Array.isArray(v) ? v : undefined
}

// ---------------------------------------------------------------------------
// Contracts
//
// Offers, demands and prizes are plain data, so dumping is a structural copy.
// Reading them back is not: a hand-edited or stale file must be rejected rather
// than hydrated into a board the sim cannot reason about, so every arm of every
// union is checked here the way the rest of this file checks its input.
// ---------------------------------------------------------------------------

const DEADLINE_BAND_VALUES: readonly DeadlineBand[] = ['tight', 'normal', 'long']
const STARS_VALUES: readonly Stars[] = [1, 2, 3, 4]
const PRIZE_TOOL_VALUES: readonly PrizeTool[] = ['rotary-shovel', 'diamond-pickaxe']

function dumpContracts(c: Contracts): SaveContracts {
  return {
    active: c.active.map(a => ({
      offer: a.offer,
      dueDay: a.dueDay,
      bins: a.bins.map(b => ({ demand: b.demand, filled: b.filled })),
    })),
    takenToday: c.takenToday.slice(),
    history: c.history.slice(),
    book: { ...c.book },
  }
}

function liveContracts(s: SaveContracts, rep: number, repDay: number): Contracts {
  return {
    active: s.active.map(a => ({
      offer: a.offer,
      dueDay: a.dueDay,
      bins: (a.bins.length === 1
        ? [{ demand: a.bins[0].demand, filled: a.bins[0].filled }]
        : [
            { demand: a.bins[0].demand, filled: a.bins[0].filled },
            { demand: a.bins[1].demand, filled: a.bins[1].filled },
          ]) as Active['bins'],
    })),
    takenToday: s.takenToday.slice(),
    history: s.history.slice(),
    book: { ...s.book },
    rep,
    repDay,
  }
}

function readContracts(v: unknown): SaveContracts | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const activeIn = arr(o.active)
  const takenIn = arr(o.takenToday)
  const historyIn = arr(o.history)
  const book = readBook(o.book)
  if (activeIn === undefined || takenIn === undefined || historyIn === undefined || book === undefined) {
    return undefined
  }
  const active: SaveContracts['active'] = []
  for (const raw of activeIn) {
    const a = readActive(raw)
    if (a === undefined) return undefined
    active.push(a)
  }
  const takenToday: ContractId[] = []
  for (const raw of takenIn) {
    const id = num(raw)
    if (id === undefined) return undefined
    takenToday.push(id)
  }
  const history: HistoryEntry[] = []
  for (const raw of historyIn) {
    const e = readHistoryEntry(raw)
    if (e === undefined) return undefined
    history.push(e)
  }
  return { active, takenToday, history, book }
}

function readBook(v: unknown): CompanyBook | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const book = {} as CompanyBook
  for (const id of COMPANY_IDS) {
    const rec = obj(o[id])
    if (rec === undefined) return undefined
    const done = num(rec.done)
    const missed = num(rec.missed)
    if (done === undefined || missed === undefined) return undefined
    book[id] = { done, missed }
  }
  return book
}

function readActive(v: unknown): SaveContracts['active'][number] | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const offer = readOffer(o.offer)
  const dueDay = num(o.dueDay)
  const binsIn = arr(o.bins)
  if (offer === undefined || dueDay === undefined || binsIn === undefined) return undefined
  if (binsIn.length !== offer.lines.length) return undefined
  const bins: { demand: Demand; filled: number }[] = []
  for (const raw of binsIn) {
    const b = obj(raw)
    if (b === undefined) return undefined
    const demand = readDemand(b.demand)
    const filled = num(b.filled)
    if (demand === undefined || filled === undefined) return undefined
    bins.push({ demand, filled })
  }
  return { offer, dueDay, bins }
}

function readOffer(v: unknown): ContractOffer | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const id = num(o.id)
  const slot = num(o.slot)
  const difficulty = num(o.difficulty)
  const days = num(o.days)
  const clean = num(o.clean)
  const markup = num(o.markup)
  const reward = num(o.reward)
  const penalty = num(o.penalty)
  const prize = readPrize(o.prize)
  const linesIn = arr(o.lines)
  if (
    id === undefined ||
    slot === undefined ||
    difficulty === undefined ||
    days === undefined ||
    clean === undefined ||
    markup === undefined ||
    reward === undefined ||
    penalty === undefined ||
    prize === undefined ||
    linesIn === undefined ||
    !isCompanyId(o.company) ||
    !isStars(o.stars) ||
    !isDeadlineBand(o.band)
  ) {
    return undefined
  }
  if (linesIn.length !== 1 && linesIn.length !== 2) return undefined
  const first = readDemand(linesIn[0])
  if (first === undefined) return undefined
  let lines: Lines = [first]
  if (linesIn.length === 2) {
    const second = readDemand(linesIn[1])
    if (second === undefined) return undefined
    lines = [first, second]
  }
  return {
    id,
    slot,
    company: o.company,
    difficulty,
    stars: o.stars,
    band: o.band,
    days,
    lines,
    prize,
    clean,
    markup,
    reward,
    penalty,
  }
}

function readDemand(v: unknown): Demand | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const amount = num(o.amount)
  if (amount === undefined) return undefined
  if (o.kind === 'plain') {
    if (!(STALL_IDS as readonly unknown[]).includes(o.good)) return undefined
    return { kind: 'plain', good: o.good as StallGoodId, amount }
  }
  if (o.kind !== 'group') return undefined
  if (o.group === 'jam') return { kind: 'group', group: 'jam', amount }
  if (o.group === 'spirit') return { kind: 'group', group: 'spirit', amount }
  return undefined
}

function readPrize(v: unknown): Prize | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'cash') return { kind: 'cash' }
  if (o.kind === 'fertilizer') return { kind: 'fertilizer' }
  if (o.kind === 'freezer') return { kind: 'freezer' }
  if (o.kind === 'expansion-slot') return { kind: 'expansion-slot' }
  if (o.kind === 'tree-seed') {
    return isTreeIdValue(o.tree) ? { kind: 'tree-seed', tree: o.tree } : undefined
  }
  if (o.kind === 'seeds') {
    const count = num(o.count)
    if (count === undefined || o.crop !== 'vanilla') return undefined
    return { kind: 'seeds', crop: 'vanilla', count }
  }
  if (o.kind === 'skill-points') {
    const n = num(o.n)
    return n === undefined ? undefined : { kind: 'skill-points', n }
  }
  if (o.kind === 'tool') {
    return (PRIZE_TOOL_VALUES as readonly unknown[]).includes(o.tool)
      ? { kind: 'tool', tool: o.tool as PrizeTool }
      : undefined
  }
  return undefined
}

function readHistoryEntry(v: unknown): HistoryEntry | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const id = num(o.id)
  const day = num(o.day)
  const outcome = readOutcome(o.outcome)
  if (id === undefined || day === undefined || outcome === undefined) return undefined
  if (!isCompanyId(o.company) || !isStars(o.stars)) return undefined
  return { id, company: o.company, stars: o.stars, day, outcome }
}

function readOutcome(v: unknown): Outcome | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'done') {
    const paid = num(o.paid)
    const prize = readPrize(o.prize)
    return paid === undefined || prize === undefined ? undefined : { kind: 'done', paid, prize }
  }
  const sold = num(o.sold)
  if (sold === undefined) return undefined
  if (o.kind === 'missed') {
    const penalty = num(o.penalty)
    return penalty === undefined ? undefined : { kind: 'missed', sold, penalty }
  }
  if (o.kind === 'cancelled') {
    const fee = num(o.fee)
    return fee === undefined ? undefined : { kind: 'cancelled', sold, fee }
  }
  return undefined
}

function isCompanyId(v: unknown): v is CompanyId {
  return (COMPANY_IDS as readonly unknown[]).includes(v)
}

function isStars(v: unknown): v is Stars {
  return (STARS_VALUES as readonly unknown[]).includes(v)
}

function isDeadlineBand(v: unknown): v is DeadlineBand {
  return (DEADLINE_BAND_VALUES as readonly unknown[]).includes(v)
}

function isCaskId(v: unknown): v is CaskId {
  return (CASK_IDS as readonly unknown[]).includes(v)
}


