import { type CropClass } from '../defs/crops.ts'
import { BOX_LARGE, BOX_SMALL, CHEST_SLOTS, CONTAINERS, FREEZER_SLOTS, HARVEST_SLOTS, PICKAXES, SHOVELS, VEHICLE_SLOTS } from '../defs/items.ts'
import { RARITY_RANK, type Rarity } from '../defs/rarity.ts'
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
  PotStill,
  Pump,
  RainTank,
  Rock,
  SeedSilo,
  Tap,
  Tree,
  Truck,
  WineBarrel,
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
  type MillRecipe,
  type PickaxeId,
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
  type VehicleId,
} from './ids.ts'
import type { FruitStack, Hand, Item, Slot, Stack } from './item.ts'
import { MemorySink, type LogSink } from './log.ts'
import { type Edge, type Gate, type Segment, type Sprinkler, type Tune, Well } from './pipe.ts'
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
import { makeQuad, makeTractor, type SeedHopper, type SprayHopper, type Trailer, type TrailerPose, type Vehicle } from './vehicle.ts'

export const SLOT_KEY = 'gardena-save-slot-1'
export const DOWNLOAD_NAME = 'gardena.json'
export const SAVE_VERSION = 1.5 as const

const INV = 16

export type LoadFailReason = 'not-gardena' | 'version' | 'unusable'

export type LoadResult = { ok: true; world: World } | { ok: false; reason: LoadFailReason }

export type SaveRng = { seed: number; shop: number; fruit: number }

export type SaveMember<Id> = {
  points: number
  pickCount: number
  owned: { id: Id; tier: number }[]
  offers: { id: Id; tier: number }[]
}

export type SaveStallGood = {
  offered: number
  market: number
  target: number
  acc: number
  stock: { [K in Rarity]: { organic: number; synth: number } }
  worth: { [K in Rarity]: { organic: number; synth: number } }
}

export type SaveSoil = { water: number; fertilizer: number; bio: boolean }

export type SavePlant = {
  crop: AnnualId
  rarity: Rarity
  maturity: number
  freshness: number
  happiness: number
  bio: boolean
  tended: boolean
}

export type SaveWeed = { variant: 0 | 1; maturity: number }
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
  | { kind: 'rock'; base: RectBase }
  | { kind: 'tree'; species: TreeId; base: RectBase; juvenile: number; fruit: number; yield: TreeYield }
  | { kind: 'chest'; base: RectBase; slots: Slot[] }
  | { kind: 'grinder'; base: RectBase }
  | { kind: 'compost-box'; base: RectBase; units: number; progress: number }
  | { kind: 'mill'; base: RectBase; recipe: MillRecipe | 'none'; units: number; progress: number }
  | { kind: 'jam'; base: RectBase; crop: JamCrop | 'none'; fruit: number; sugar: number; progress: number }
  | { kind: 'still'; base: RectBase; feed: { crop: StillCrop; rarity: Rarity; count: number }[]; progress: number; n: number }
  | { kind: 'barrel'; base: RectBase; feed: { rarity: Rarity; count: number }[]; age: number; n: number }
  | { kind: 'freezer'; base: RectBase; slots: Slot[] }
  | { kind: 'hangar'; base: RectBase }
  | { kind: 'silo-seed'; base: RectBase }
  | { kind: 'silo-spray'; base: RectBase }
  | { kind: 'silo-produce'; base: RectBase }
  | { kind: 'seed-silo'; base: RectBase; useDefault: boolean; seeds: SiloStack[] }
  | { kind: 'additive-store'; base: RectBase; useDefault: boolean; held: AdditiveHold[] }
  | { kind: 'truck'; base: RectBase }
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
    }
  | {
      kind: 'tractor'
      id: VehicleId
      fuel: number
      hitch: TrailerId | 'none'
      pose:
        | { kind: 'stored'; hangar: Coord }
        | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }
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

export type Save = {
  game: 'gardena'
  version: 1.5
  savedAt: string
  rng: SaveRng
  clock: { day: number; t: number }
  money: number
  purchases: number
  digs: number
  mines: number
  bigTicks: number
  seats: SaveSeat[]
  vehicles: SaveVehicle[]
  nextVehicleId: VehicleId
  trailers: SaveTrailer[]
  nextTrailerId: TrailerId
  done: ResearchId[]
  job: { kind: 'idle' } | { kind: 'run'; id: ResearchId; left: number }
  family: {
    player: SaveMember<PlayerSkillId>
    husband: SaveMember<HusbandSkillId>
    daughter: SaveMember<DaughterSkillId>
  }
  stall: { [K in StallGoodId]: SaveStallGood }
  tally: DayTally
  seam: Seam
  ripenN: { col: number; row: number; n: number }[]
  chunks: { id: ChunkId; cells: SaveCell[][] }[]
  segments: Segment[]
  wells: { at: Edge; stored: number }[]
  sprinklers: Sprinkler[]
  fences: Coord[]
  drops: { at: Coord; item: Item }[]
}

export function dump(world: World): Save {
  return {
    game: 'gardena',
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    rng: { seed: world.rng.seed, shop: world.rng.consumed('shop'), fruit: world.rng.consumed('fruit') },
    clock: { day: world.clock.day, t: world.clock.t },
    money: world.money,
    purchases: world.purchases,
    digs: world.digs,
    mines: world.mines,
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
    seam: world.seam,
    ripenN: [...world.ripenN.entries()].flatMap(([k, n]) => {
      if (n <= 0) return []
      const i = k.indexOf(',')
      return [{ col: Number(k.slice(0, i)), row: Number(k.slice(i + 1)), n }]
    }),
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
    wells: [...world.wells.values()].map(well => ({ at: well.at, stored: well.water.stored })),
    sprinklers: [...world.sprinklers.values()],
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
    return { ok: false, reason: 'unusable' }
  }
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'unusable' }
  const rec = raw as Record<string, unknown>
  if (rec.game !== 'gardena') return { ok: false, reason: 'not-gardena' }
  if (num(rec.version) !== SAVE_VERSION) return { ok: false, reason: 'version' }
  const save = readSave(rec)
  if (save === undefined) return { ok: false, reason: 'unusable' }
  const world = worldFromSave(save, sink)
  if (world === undefined) return { ok: false, reason: 'unusable' }
  return { ok: true, world }
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

function dumpMember<Id extends SkillId>(m: { points: number; pickCount: number; owned: Map<Id, number>; offers: SkillRef<Id>[] }): SaveMember<Id> {
  return {
    points: m.points,
    pickCount: m.pickCount,
    owned: [...m.owned.entries()].map(([id, tier]) => ({ id, tier })),
    offers: m.offers.map(o => ({ id: o.id, tier: o.tier })),
  }
}

function dumpStall(g: StallGood): SaveStallGood {
  return {
    offered: g.offered,
    market: g.market,
    target: g.target,
    acc: g.acc,
    stock: {
      common: { ...g.stock.common },
      uncommon: { ...g.stock.uncommon },
      rare: { ...g.stock.rare },
      heirloom: { ...g.stock.heirloom },
    },
    worth: {
      common: { ...g.worth.common },
      uncommon: { ...g.worth.uncommon },
      rare: { ...g.worth.rare },
      heirloom: { ...g.worth.heirloom },
    },
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
    c.kind === 'rock' ||
    c.kind === 'tree' ||
    c.kind === 'chest' ||
    c.kind === 'grinder' ||
    c.kind === 'compost-box' ||
    c.kind === 'mill' ||
    c.kind === 'jam' ||
    c.kind === 'still' ||
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
      return { kind: 'weed', soil: dumpSoil(c.soil), weed: { variant: c.weed.variant, maturity: c.weed.maturity } }
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
      }
    case 'chest':
      return { kind: 'chest', base: c.base, slots: c.slots.slice() }
    case 'seed-silo':
      return { kind: 'seed-silo', base: c.base, useDefault: c.useDefault, seeds: c.seeds.map(st => ({ ...st })) }
    case 'additive-store':
      return { kind: 'additive-store', base: c.base, useDefault: c.useDefault, held: c.held.map(h => ({ ...h })) }
    case 'grinder':
      return { kind: 'grinder', base: c.base }
    case 'compost-box':
      return { kind: 'compost-box', base: c.base, units: c.units, progress: c.progress }
    case 'mill':
      return { kind: 'mill', base: c.base, recipe: c.recipe, units: c.units, progress: c.progress }
    case 'jam':
      return { kind: 'jam', base: c.base, crop: c.crop, fruit: c.fruit, sugar: c.sugar, progress: c.progress }
    case 'still':
      return { kind: 'still', base: c.base, feed: c.feed.map(f => ({ ...f })), progress: c.progress, n: c.n }
    case 'barrel':
      return { kind: 'barrel', base: c.base, feed: c.feed.map(f => ({ ...f })), age: c.age, n: c.n }
    case 'freezer':
      return { kind: 'freezer', base: c.base, slots: c.slots.slice() }
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
  }
}

function dumpSoil(s: Soil): SaveSoil {
  return { water: s.water, fertilizer: s.fertilizer, bio: s.bio }
}

function dumpPlant(p: Plant): SavePlant {
  return {
    crop: p.crop,
    rarity: p.rarity,
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
  const shop = num(rngIn.shop)
  const fruit = num(rngIn.fruit)
  const day = num(clockIn.day)
  const t = num(clockIn.t)
  const money = num(rec.money)
  const purchases = num(rec.purchases)
  const digs = num(rec.digs)
  const mines = num(rec.mines)
  const bigTicks = num(rec.bigTicks)
  const savedAt = rec.savedAt
  const seats = readSeats(rec)
  if (
    seed === undefined ||
    shop === undefined ||
    fruit === undefined ||
    day === undefined ||
    t === undefined ||
    money === undefined ||
    purchases === undefined ||
    digs === undefined ||
    mines === undefined ||
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
  const ripenIn = arr(rec.ripenN)
  if (ripenIn === undefined) return undefined
  const ripenN: { col: number; row: number; n: number }[] = []
  for (const e of ripenIn) {
    const o = obj(e)
    if (o === undefined) return undefined
    const col = num(o.col)
    const row = num(o.row)
    const n = num(o.n)
    if (col === undefined || row === undefined || n === undefined || n <= 0) return undefined
    ripenN.push({ col, row, n })
  }
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
  const wellsIn = arr(rec.wells)
  const sprinklersIn = arr(rec.sprinklers)
  const fencesIn = arr(rec.fences)
  const dropsIn = arr(rec.drops)
  if (segmentsIn === undefined || wellsIn === undefined || sprinklersIn === undefined || fencesIn === undefined || dropsIn === undefined) {
    return undefined
  }
  const segments: Segment[] = []
  for (const s of segmentsIn) {
    const seg = readSegment(s)
    if (seg === undefined) return undefined
    segments.push(seg)
  }
  const wells: { at: Edge; stored: number }[] = []
  for (const s of wellsIn) {
    const o = obj(s)
    if (o === undefined) return undefined
    const at = readEdge(o.at)
    const stored = num(o.stored)
    if (at === undefined || stored === undefined) return undefined
    wells.push({ at, stored })
  }
  const sprinklers: Sprinkler[] = []
  for (const s of sprinklersIn) {
    const sp = readSprinkler(s)
    if (sp === undefined) return undefined
    sprinklers.push(sp)
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
  return {
    game: 'gardena',
    version: SAVE_VERSION,
    savedAt,
    rng: { seed, shop, fruit },
    clock: { day, t },
    money,
    purchases,
    digs,
    mines,
    bigTicks,
    seats,
    done,
    job,
    family: { player, husband, daughter },
    stall,
    tally,
    seam,
    ripenN,
    chunks,
    segments,
    wells,
    sprinklers,
    fences,
    drops,
    vehicles,
    nextVehicleId,
    trailers,
    nextTrailerId,
  }
}

function worldFromSave(save: Save, sink: LogSink): World | undefined {
  const owned = save.chunks.map(ch => ch.id)
  const live = stampChunks(owned, save.chunks)
  if (live === undefined) return undefined
  const h: Hydrate = {
    rng: new Rng(save.rng.seed, { shop: save.rng.shop, fruit: save.rng.fruit }),
    sink,
    house: live.house,
    silo: live.silo,
    additives: live.additives,
    truck: live.truck,
    pumps: live.pumps,
    tanks: live.tanks,
    taps: live.taps,
    stills: live.stills,
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
    owned,
    chunks: live.chunks,
    clock: save.clock,
    money: save.money,
    purchases: save.purchases,
    digs: save.digs,
    mines: save.mines,
    bigTicks: save.bigTicks,
    done: save.done,
    job: save.job,
    tally: save.tally,
    seam: save.seam,
    ripenN: save.ripenN,
    segments: save.segments,
    wells: save.wells.map(well => {
      const made = new Well(well.at)
      made.water.stored = well.stored
      return made
    }),
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
    points: m.points,
    pickCount: m.pickCount,
    owned: new Map(m.owned.map(s => [s.id, s.tier])),
    offers: m.offers.map(o => ({ id: o.id, tier: o.tier })),
  }
}

function makeStallMap(s: Save['stall']): StallMap {
  const stall = {} as StallMap
  for (const id of STALL_IDS) {
    const src = s[id]
    const g = new StallGood(id, src.offered)
    g.offered = src.offered
    g.market = src.market
    g.target = src.target
    g.acc = src.acc
    RARITY_RANK.forEach(r => {
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
      stills: PotStill[]
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
  const stills: PotStill[] = []
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
        if (made.kind === 'still') stills.push(made)
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
              inst.kind === 'rock' ||
              inst.kind === 'tree' ||
              inst.kind === 'chest' ||
              inst.kind === 'grinder' ||
              inst.kind === 'compost-box' ||
              inst.kind === 'mill' ||
              inst.kind === 'jam' ||
              inst.kind === 'still' ||
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
  return { chunks, house, truck, silo, additives, pumps, tanks, taps, stills, hangars, seedSilos, spraySilos, produceSilos }
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
    case 'rock':
      return new Rock(sc.base)
    case 'tree':
      return new Tree(sc.species, sc.base, sc.juvenile, sc.fruit, sc.yield)
    case 'chest': {
      const chest = new Chest(sc.base)
      for (let i = 0; i < CHEST_SLOTS; i++) chest.slots[i] = sc.slots[i]
      return chest
    }
    case 'seed-silo': {
      const silo = new SeedSilo(sc.base, sc.useDefault)
      sc.seeds.forEach(st => silo.seeds.push({ ...st }))
      return silo
    }
    case 'additive-store': {
      const store = new AdditiveStore(sc.base, sc.useDefault)
      sc.held.forEach(h => store.held.push({ ...h }))
      return store
    }
    case 'grinder':
      return new Grinder(sc.base)
    case 'compost-box': {
      const box = new CompostBox(sc.base)
      box.units = sc.units
      box.progress = sc.progress
      return box
    }
    case 'mill': {
      const mill = new Mill(sc.base)
      mill.recipe = sc.recipe
      mill.units = sc.units
      mill.progress = sc.progress
      return mill
    }
    case 'jam': {
      const jam = new JamMachine(sc.base)
      jam.crop = sc.crop
      jam.fruit = sc.fruit
      jam.sugar = sc.sugar
      jam.progress = sc.progress
      return jam
    }
    case 'still': {
      const still = new PotStill(sc.base)
      still.feed = sc.feed.map(f => ({ ...f }))
      still.progress = sc.progress
      still.n = sc.n
      return still
    }
    case 'barrel': {
      const barrel = new WineBarrel(sc.base)
      barrel.feed = sc.feed.map(f => ({ ...f }))
      barrel.age = sc.age
      barrel.n = sc.n
      return barrel
    }
    case 'freezer': {
      const freezer = new Freezer(sc.base)
      for (let i = 0; i < FREEZER_SLOTS; i++) freezer.slots[i] = sc.slots[i]
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
    case 'occ':
      return undefined
  }
}

function makeSoil(s: SaveSoil): Soil {
  const soil = new Soil(s.water, s.fertilizer)
  soil.bio = s.bio
  return soil
}

function makePlant(p: SavePlant): Plant {
  const plant = new Plant(p.crop, p.rarity)
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
    if (base === undefined || juvenile === undefined || fruit === undefined || y === undefined) return undefined
    return { kind: 'tree', species: o.species, base, juvenile, fruit, yield: y }
  }
  if (kind === 'chest') {
    const base = readRectBase(o.base)
    const slotsIn = arr(o.slots)
    if (base === undefined || slotsIn === undefined || slotsIn.length !== CHEST_SLOTS) return undefined
    const slots: Slot[] = []
    for (const s of slotsIn) {
      const slot = readHand(s)
      if (slot === undefined) return undefined
      slots.push(slot)
    }
    return { kind: 'chest', base, slots }
  }
  if (kind === 'seed-silo') {
    const base = readRectBase(o.base)
    const useDefault = bool(o.useDefault)
    const seedsIn = arr(o.seeds)
    if (base === undefined || useDefault === undefined || seedsIn === undefined) return undefined
    const seeds: SiloStack[] = []
    for (const v of seedsIn) {
      const st = readSiloStack(v)
      if (st === undefined) return undefined
      seeds.push(st)
    }
    return { kind: 'seed-silo', base, useDefault, seeds }
  }
  if (kind === 'additive-store') {
    const base = readRectBase(o.base)
    const useDefault = bool(o.useDefault)
    const heldIn = arr(o.held)
    if (base === undefined || useDefault === undefined || heldIn === undefined) return undefined
    const held: AdditiveHold[] = []
    for (const v of heldIn) {
      const h = readAdditiveHold(v)
      if (h === undefined) return undefined
      held.push(h)
    }
    return { kind: 'additive-store', base, useDefault, held }
  }
  if (kind === 'grinder') {
    const base = readRectBase(o.base)
    if (base === undefined) return undefined
    return { kind: 'grinder', base }
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
    const units = num(o.units)
    const progress = num(o.progress)
    if (base === undefined || recipe === undefined || units === undefined || progress === undefined) return undefined
    return { kind: 'mill', base, recipe, units, progress }
  }
  if (kind === 'jam') {
    const base = readRectBase(o.base)
    const crop = readJamCropOrNone(o.crop)
    const fruit = num(o.fruit)
    const sugar = num(o.sugar)
    const progress = num(o.progress)
    if (base === undefined || crop === undefined || fruit === undefined || sugar === undefined || progress === undefined) {
      return undefined
    }
    return { kind: 'jam', base, crop, fruit, sugar, progress }
  }
  if (kind === 'still') {
    const base = readRectBase(o.base)
    const feedIn = arr(o.feed)
    const progress = num(o.progress)
    const n = num(o.n)
    if (base === undefined || feedIn === undefined || progress === undefined || n === undefined) return undefined
    const feed: { crop: StillCrop; rarity: Rarity; count: number }[] = []
    for (const f of feedIn) {
      const e = readStillFeed(f)
      if (e === undefined) return undefined
      feed.push(e)
    }
    return { kind: 'still', base, feed, progress, n }
  }
  if (kind === 'barrel') {
    const base = readRectBase(o.base)
    const feedIn = arr(o.feed)
    const age = num(o.age)
    const n = num(o.n)
    if (base === undefined || feedIn === undefined || age === undefined || n === undefined) return undefined
    const feed: { rarity: Rarity; count: number }[] = []
    for (const f of feedIn) {
      const e = readBarrelFeed(f)
      if (e === undefined) return undefined
      feed.push(e)
    }
    return { kind: 'barrel', base, feed, age, n }
  }
  if (kind === 'freezer') {
    const base = readRectBase(o.base)
    const slotsIn = arr(o.slots)
    if (base === undefined || slotsIn === undefined || slotsIn.length !== FREEZER_SLOTS) return undefined
    const slots: Slot[] = []
    for (const s of slotsIn) {
      const slot = readHand(s)
      if (slot === undefined) return undefined
      slots.push(slot)
    }
    return { kind: 'freezer', base, slots }
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
  if (v.kind === 'quad') return { kind: 'quad', id: v.id, fuel: v.fuel, slots: v.slots.slice(), pose: dumpPose(v.pose) }
  return { kind: 'tractor', id: v.id, fuel: v.fuel, hitch: v.hitch, pose: dumpPose(v.pose) }
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
  if (v.kind === 'quad') return makeQuad(v.id, v.fuel, v.slots.slice(), pose)
  return makeTractor(v.id, v.fuel, v.hitch, pose)
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

function readVehicle(v: unknown): SaveVehicle | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const id = num(o.id)
  const fuel = num(o.fuel)
  const pose = readVehiclePose(o.pose)
  if (id === undefined || fuel === undefined || pose === undefined) return undefined
  if (o.kind === 'quad') {
    const slots = readSlots(o.slots, VEHICLE_SLOTS)
    if (slots === undefined) return undefined
    return { kind: 'quad', id, fuel, slots, pose }
  }
  if (o.kind === 'tractor') {
    const hitch = o.hitch === 'none' || typeof o.hitch === 'number' ? o.hitch : undefined
    if (hitch === undefined) return undefined
    if (pose.kind === 'stored' && hitch !== 'none') return undefined
    return { kind: 'tractor', id, fuel, hitch, pose }
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
  if (water === undefined || fertilizer === undefined || bio === undefined) return undefined
  return { water, fertilizer, bio }
}

function readPlant(v: unknown): SavePlant | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (!isAnnual(o.crop)) return undefined
  const rarity = readRarity(o.rarity)
  const maturity = num(o.maturity)
  const freshness = num(o.freshness)
  const happiness = num(o.happiness)
  const bio = bool(o.bio)
  const tended = bool(o.tended)
  if (
    rarity === undefined ||
    maturity === undefined ||
    freshness === undefined ||
    happiness === undefined ||
    bio === undefined ||
    tended === undefined
  ) {
    return undefined
  }
  return { crop: o.crop, rarity, maturity, freshness, happiness, bio, tended }
}

function readWeed(v: unknown): SaveWeed | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const variant = o.variant
  const maturity = num(o.maturity)
  if ((variant !== 0 && variant !== 1) || maturity === undefined) return undefined
  return { variant, maturity }
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
  const points = num(o.points)
  const pickCount = num(o.pickCount)
  const ownedIn = arr(o.owned)
  const offersIn = arr(o.offers)
  if (points === undefined || pickCount === undefined || ownedIn === undefined || offersIn === undefined) {
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
  return { points, pickCount, owned, offers }
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

function readBins(v: unknown): { [K in Rarity]: { organic: number; synth: number } } | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const out = {} as { [K in Rarity]: { organic: number; synth: number } }
  for (const r of RARITY_RANK) {
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
  return { died, harvests, research }
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
  const researchIn = arr(o.research)
  if (
    day === undefined ||
    money === undefined ||
    stipend === undefined ||
    died === undefined ||
    harvests === undefined ||
    tax === undefined ||
    researchIn === undefined
  ) {
    return undefined
  }
  const research: ResearchId[] = []
  for (const id of researchIn) {
    if (!isResearchId(id)) return undefined
    research.push(id)
  }
  return { day, money, stipend, died, harvests, research, tax }
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

function readSprinkler(v: unknown): Sprinkler | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const at = readCoord(o.at)
  const tune = readTune(o.tune)
  if (at === undefined || tune === undefined) return undefined
  if (o.variant === 'basic') return { variant: 'basic', at, tune }
  if (o.variant === 'large') return { variant: 'large', at, tune }
  if (o.variant === 'vert') {
    if (o.facing !== 'ns' && o.facing !== 'ew') return undefined
    return { variant: 'vert', at, facing: o.facing, tune }
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
    case 'box': {
      if (o.cap !== BOX_SMALL && o.cap !== BOX_LARGE) return undefined
      const cargo = readCargo(o.cargo)
      if (cargo === undefined) return undefined
      return { kind: 'box', cap: o.cap, cargo }
    }
    case 'seeds': {
      if (!isAnnual(o.crop)) return undefined
      const rarity = readRarity(o.rarity)
      const count = num(o.count)
      if (rarity === undefined || count === undefined) return undefined
      return { kind: 'seeds', crop: o.crop, rarity, count }
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
    case 'sapling': {
      if (!isTreeIdValue(o.tree)) return undefined
      return { kind: 'sapling', tree: o.tree }
    }
    case 'sugar': {
      const liters = num(o.liters)
      const capacityLiters = num(o.capacityLiters)
      const unitSale = num(o.unitSale)
      if (liters === undefined || capacityLiters === undefined || unitSale === undefined) return undefined
      return { kind: 'sugar', liters, capacityLiters, unitSale }
    }
    case 'spirit': {
      if (!isSpiritKind(o.spirit)) return undefined
      const rarity = readRarity(o.rarity)
      const count = num(o.count)
      const unitSale = num(o.unitSale)
      if (rarity === undefined || count === undefined || unitSale === undefined) return undefined
      return { kind: 'spirit', spirit: o.spirit, rarity, count, unitSale }
    }
    case 'wine': {
      const rarity = readRarity(o.rarity)
      const count = num(o.count)
      const unitSale = num(o.unitSale)
      if (rarity === undefined || count === undefined || unitSale === undefined) return undefined
      return { kind: 'wine', rarity, count, unitSale }
    }
    case 'jam': {
      if (!isJamCrop(o.crop)) return undefined
      const count = num(o.count)
      const unitSale = num(o.unitSale)
      if (count === undefined || unitSale === undefined) return undefined
      return { kind: 'jam', crop: o.crop, count, unitSale }
    }
    case 'oil':
    case 'flour':
    case 'extract': {
      const count = num(o.count)
      const unitSale = num(o.unitSale)
      if (count === undefined || unitSale === undefined) return undefined
      return { kind: o.kind, count, unitSale }
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
    default:
      return undefined
  }
}

function readCargo(v: unknown): Extract<Item, { kind: 'box' }>['cargo'] | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (o.kind === 'empty') return { kind: 'empty' }
  if (o.kind !== 'stack') return undefined
  if (o.goods === 'seeds') {
    const stack = readStack(o.stack)
    if (stack === undefined) return undefined
    return { kind: 'stack', goods: 'seeds', stack }
  }
  if (o.goods === 'fruit') {
    const stack = readFruitStack(o.stack)
    if (stack === undefined) return undefined
    return { kind: 'stack', goods: 'fruit', stack }
  }
  return undefined
}

function readStack(v: unknown): Stack | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (!isAnnual(o.crop)) return undefined
  const rarity = readRarity(o.rarity)
  const count = num(o.count)
  if (rarity === undefined || count === undefined) return undefined
  return { crop: o.crop, rarity, count }
}

function readFruitStack(v: unknown): FruitStack | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  if (!isCropId(o.crop)) return undefined
  const rarity = readRarity(o.rarity)
  const count = num(o.count)
  const unitSale = num(o.unitSale)
  const freshness = num(o.freshness)
  const bio = bool(o.bio)
  if (
    rarity === undefined ||
    count === undefined ||
    unitSale === undefined ||
    freshness === undefined ||
    bio === undefined
  ) {
    return undefined
  }
  return { crop: o.crop, rarity, count, unitSale, freshness, bio }
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

function readMillRecipe(v: unknown): MillRecipe | 'none' | undefined {
  if (v === 'none' || v === 'sugar-cane' || v === 'olive' || v === 'wheat' || v === 'grass') return v
  return undefined
}

function readJamCropOrNone(v: unknown): JamCrop | 'none' | undefined {
  if (v === 'none') return 'none'
  if (isJamCrop(v)) return v
  return undefined
}

function readStillFeed(v: unknown): { crop: StillCrop; rarity: Rarity; count: number } | undefined {
  const o = obj(v)
  if (o === undefined || !isStillCrop(o.crop)) return undefined
  const rarity = readRarity(o.rarity)
  const count = num(o.count)
  if (rarity === undefined || count === undefined) return undefined
  return { crop: o.crop, rarity, count }
}

function readBarrelFeed(v: unknown): { rarity: Rarity; count: number } | undefined {
  const o = obj(v)
  if (o === undefined) return undefined
  const rarity = readRarity(o.rarity)
  const count = num(o.count)
  if (rarity === undefined || count === undefined) return undefined
  return { rarity, count }
}

function readSiloStack(v: unknown): SiloStack | undefined {
  const o = obj(v)
  if (o === undefined || !isAnnual(o.crop)) return undefined
  const rarity = readRarity(o.rarity)
  const count = num(o.count)
  if (rarity === undefined || count === undefined) return undefined
  return { crop: o.crop, rarity, count }
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

function readRarity(v: unknown): Rarity | undefined {
  if (v === 'common' || v === 'uncommon' || v === 'rare' || v === 'heirloom') return v
  return undefined
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
