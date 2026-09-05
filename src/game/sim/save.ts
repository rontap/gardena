import { VARIETY_IDS, type VarietyId } from '../defs/varieties.ts'
import {
  CHUNK,
  chunkRect,
  occupiedCells,
  type AdditiveHold,
  type Base,
  type ChunkId,
  type Coord,
  type RectBase,
  type SiloStack,
  type SugarBin,
  type TreeYield,
} from './building.ts'
import type { Cell, Cover, Ground } from './plot.ts'
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
  SkillId,
  StallGoodId,
  StillCrop,
  TrailerId,
  TreeId,
  VehicleId,
} from './ids.ts'
import type { Hand, Item, Slot } from './item.ts'
import type {
  CompanyBook,
  ContractId,
  ContractOffer,
  Contracts,
  Demand,
  HistoryEntry,
} from './market.h.ts'
import type { Edge, Segment, Sprinkler } from './pipe.ts'
import type { Wire } from './sensor.ts'
import type { Plant } from './plant.ts'
import type { Soil } from './soil.ts'
import { STALL_IDS, type StallGood } from './stall.ts'
import type { Presence, SeatId, SkillRef, World } from './world.ts'
import type { Route, SeedHopper, SprayHopper, Trailer, TrailerPose, Vehicle } from './vehicle.ts'

export const SLOT_KEY = 'gardena-save-slot-1'
export const DOWNLOAD_NAME = 'gardena.json'
export const SAVE_VERSION = 2.15 as const

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

export type Save = {
  game: 'gardena'
  version: typeof SAVE_VERSION
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
  try {
    const rec = JSON.parse(text) as { savedAt: string }
    const t = Date.parse(rec.savedAt)
    if (Number.isNaN(t)) return undefined
    const d = new Date(t)
    const p = (n: number) => (n < 10 ? `0${n}` : String(n))
    return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  } catch {
    return undefined
  }
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

export function originOf(c: Cell, owned: readonly ChunkId[]): Coord | undefined {
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
    c.kind === 'station' ||
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
        sugar: { ...c.sugar },
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
    case 'station':
      return {
        kind: 'station',
        base: c.base,
        crop: c.crop,
        variety: c.variety,
        quality: c.quality,
        units: c.units,
        progress: c.progress,
        inn: c.inn,
      }
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

export { parse } from './save.parse.ts'
