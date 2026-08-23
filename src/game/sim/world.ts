import {
  BARREL_CAP,
  BARREL_MATURE,
  COMPOST_NEED,
  COMPOST_SECONDS,
  CONTAINERS,
  GRASS_GROW,
  GRASS_WATER_PER_SEC,
  GRIND_MAX,
  GRIND_MIN,
  GRIND_WORK,
  JAM_BUFFER,
  JAM_IN,
  JAM_SECONDS,
  JAM_SUGAR,
  MILL_WORK,
  SPEECH_S,
  SPRINKLER_TILE_RATE,
  STILL_CAP,
  STILL_SECONDS,
  STILL_WATER,
} from '../defs/items.ts'
import { TREES, TREE_NAME, TREE_OFF_MUL, TREE_YIELD_MUL } from '../defs/trees.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { extraGrowUp1, JAM_FLOOR, SKILLS, TEND_WORK, skillIds, type SkillDef } from '../defs/skills.ts'
import { CROPS, freshMul } from '../defs/crops.ts'
import {
  HAPPY_DROWN_SECONDS,
  HAPPY_GAIN_SECONDS,
  HAPPY_MAX,
  HAPPY_STARVE_SECONDS,
  HAPPY_WILT_SECONDS,
  RARITY_RANK,
  RARITY_SALE,
  rollGrowRarity,
  rollShopRarity,
  type Rarity,
} from '../defs/rarity.ts'
import { isAnnualId } from './ids.ts'
import type {
  AnnualId,
  CropId,
  DaughterSkillId,
  HusbandSkillId,
  MemberId,
  PlayerSkillId,
  ResearchId,
  SkillId,
  SkuId,
  StallGoodId,
} from './ids.ts'
import { Actor, WALK } from './actor.ts'
import {
  CHUNK,
  Chest,
  CompostBox,
  DOOR,
  Freezer,
  Grinder,
  HOUSE_BASE,
  House,
  JamMachine,
  Mill,
  PAD,
  PUMP_BASE,
  PotStill,
  Pump,
  RainTank,
  Tap,
  Tree,
  TRUCK_BASE,
  Truck,
  WineBarrel,
  chunkKey,
  chunkOf,
  chunkRect,
  frontOf,
  inFade,
  inWorld,
  local,
  occupiedCells,
  type Base,
  type ChunkId,
  type Coord,
} from './building.ts'
import { Clock } from './clock.ts'
import { onCell, topIndex, type Drop } from './drop.ts'
import { generateChunk } from './gen.ts'
import {
  boxAdd,
  boxAccepts,
  boxAddFruit,
  compostValue,
  fruitStack,
  grindN,
  makeCompost,
  makeContainer,
  makeShovel,
  mergeFreshness,
  mergeUnitSale,
  organic,
  skuItem,
  toolName,
  type FruitStack,
  type Hand,
  type Item,
  type Slot,
} from './item.ts'
import {
  addBarrelFeed,
  addStillFeed,
  bakeSpiritSale,
  bakeWineSale,
  feedUnits,
  fruitCount,
  fruitCrop,
  fruitRarity,
  jamCropOf,
  jamSale,
  meanRarity,
  millDumpUnits,
  millNeed,
  millProduct,
  millProductName,
  millRecipeOf,
  mergeSugar,
  spiritKind,
  stillCropOf,
} from './machine.ts'
import {
  BIO_KEYS,
  binCount,
  goodIx,
  isBakedStall,
  isSpiritStall,
  makeStall,
  rate as stallRate,
  stallRarity,
  stallX,
  tenths,
  STALL_IDS,
  type StallMap,
  type StallSale,
} from './stall.ts'
import { statsOf, type Modifier, type Stats } from './modifiers.ts'
import { goodness } from './noise.ts'
import { Plant, Turf, Weed, type Doom } from './plant.ts'
import { bare, isFenceSite, isPlot, isTileSite, isTilled, type Cell, type Plot } from './plot.ts'
import {
  BIG_TICK,
  FERT_PLOT_MAX,
  GRASS_CHANCE,
  PLANT_FERT_PER_SEC,
  SOIL_TILL_WATER,
  SOIL_WATER_MID,
  STUNT,
  Soil,
  WEED_CHANCE,
  WEED_FERT_PER_SEC,
  WEED_GROW,
  WEED_WATER_PER_SEC,
  fertBand,
  ramped,
  waterBand,
  type Band,
} from './soil.ts'
import {
  aoe,
  edgeKey,
  edgeOwned as pipeOwned,
  corners,
  flows,
  incident,
  vertexKey,
  vertexOwned as pipeVertexOwned,
  vertsOf,
  Well,
  type Edge,
  type Segment,
  type Sprinkler,
  type Tune,
  type Vertex,
} from './pipe.ts'
import { pull, Reservoir, TAP_RATE } from './water.ts'
import {
  placeLabel,
  placeSolidOk,
  wideSiteOk,
  readPrompt,
  readPromptHit,
  valvePrompt,
  wellPrompt,
  NOT_OWNED,
  type Prompt,
  type PromptHit,
} from './prompt.ts'
import { Act, type Cmd, type LogSink, MemorySink } from './log.ts'
import { Rng, rollRarity } from './rng.ts'

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
  | { act: 'fillWell'; stand: Coord; edge: Edge }
  | { act: 'consign' }
  | { act: 'pickup'; at: Coord }
  | { act: 'drop'; at: Coord }
  | { act: 'inventory' }
  | { act: 'chest'; at: Coord }
  | { act: 'grind'; at: Coord }
  | { act: 'still'; at: Coord }
  | { act: 'barrel'; at: Coord }
  | { act: 'jam'; at: Coord }
  | { act: 'mill'; at: Coord }
  | { act: 'valve'; at: Coord; edge: Edge }
  | { act: 'tend'; at: Coord }

export type TaskName =
  | 'Move here'
  | 'Move here and dig'
  | 'Dig'
  | 'Mine'
  | 'Plant'
  | 'Water'
  | 'Fertilize'
  | 'Compost'
  | 'Harvest'
  | 'Fill'
  | 'Drop off'
  | 'Pick up'
  | 'Drop'
  | 'Inventory'
  | 'Chest'
  | 'Grind'
  | 'Mill'
  | 'Still'
  | 'Barrel'
  | 'Jam'
  | 'Valve'
  | 'Tend'

export type Cue = { kind: 'none' } | { kind: 'inventory' } | { kind: 'chest'; at: Coord }

export type Speech = { kind: 'none' } | { kind: 'say'; text: string; left: number }

export type Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
  | { kind: 'delete' }

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
  /** Set by the host after a long silence; drives the sleeping sprite. Never saved. */
  napping: boolean
  cue: Cue
  place: Place
  workLeft: number
  workTotal: number
  filling: boolean
  legStart: { x: number; y: number }
}

export type Pulse = { text: string; at: Coord }

export type Net = { sources: Reservoir[]; sprinklers: Sprinkler[]; taps: Tap[]; stills: PotStill[] }

export type HudTarget = { kind: 'sprinkler'; at: Vertex }

export type DayTally = { died: number; harvests: number; research: ResearchId[] }

export type Recap = {
  day: number
  money: number
  stipend: number
  died: number
  harvests: number
  research: ResearchId[]
  tax: number
}

export type Seam = { kind: 'play' } | { kind: 'recap'; recap: Recap }

export type SkillRef<Id extends SkillId = SkillId> = { id: Id; tier: number }

export type MemberState<Id extends SkillId> = {
  points: number
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
  pumps: Pump[]
  tanks: RainTank[]
  taps: Tap[]
  stills: PotStill[]
  stall: StallMap
  family: Family
  seats: Seat[]
  owned: ChunkId[]
  chunks: Map<string, Cell[][]>
  clock: { day: number; t: number }
  money: number
  purchases: number
  digs: number
  mines: number
  bigTicks: number
  done: ResearchId[]
  job: Job
  tally: DayTally
  seam: Seam
  ripenN: { col: number; row: number; n: number }[]
  segments: Segment[]
  wells: Well[]
  sprinklers: Sprinkler[]
  fences: Coord[]
  drops: Drop[]
}

export const DAY_STIPEND = 10
export const MP_ID_KEY = 'gardena-mp-id'

const QUEUE_CAP = 8
export const DT_MAX = 1 / 15
const INV = 16

export const MP_NAME_KEY = 'gardena-mp-name'
export const NAME_MAX = 16

/** Trim to something that fits a roster row and never renders as blank. */
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
  inventory[0] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 5 } }
  inventory[1] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'rare', count: 2 } }
  inventory[2] = { kind: 'hold', item: { kind: 'seeds', crop: 'tomato', rarity: 'rare', count: 2 } }
  inventory[3] = { kind: 'hold', item: { kind: 'seeds', crop: 'potato', rarity: 'heirloom', count: 2 } }
  inventory[4] = { kind: 'hold', item: { kind: 'sapling', tree: 'apricot' } }
  inventory[5] = { kind: 'hold', item: { kind: 'sapling', tree: 'lemon' } }
  inventory[6] = { kind: 'hold', item: { kind: 'sapling', tree: 'cherry' } }
  const x = DOOR.col + 0.5
  const y = DOOR.row + 0.5
  return liveSeat(0, playerId, name, new Actor(x, y), { kind: 'hold', item: makeShovel('shovel') }, inventory, 'in')
}
const DYNAMIC_MARKET = false
const MEMBER_IX: { readonly [K in MemberId]: number } = { player: 0, husband: 1, daughter: 2 }

function groundSig(c: Cell): string {
  if (c.kind === 'untilled') return `${c.ground}:${c.cover.kind === 'tile' ? c.cover.tile : '-'}`
  if (c.kind === 'infertile') return 'vh'
  return '.'
}

export function dest(i: Intent): Coord {
  if (i.act === 'fill') return i.at
  if (i.act === 'fillWell') return i.stand
  if (i.act === 'consign') return { ...PAD }
  if (i.act === 'inventory') return { ...DOOR }
  return i.at
}

const LOG_CAP = 500

export type PingKind = 'dirty' | 'poured' | 'sold'

export type DirtyReason = 'act' | 'field' | 'big' | 'speech'

const NO_REASONS: ReadonlySet<DirtyReason> = new Set()

export class World {
  readonly rng: Rng
  private readonly cmds: Cmd[] = []
  private logBase = 0
  now = 0
  readonly ripenN = new Map<string, number>()
  private readonly sink: LogSink
  purchases = 0
  readonly owned: ChunkId[] = [{ cx: 0, cy: 0 }]
  readonly pumps: Pump[]
  readonly tanks: RainTank[] = []
  readonly taps: Tap[] = []
  readonly stills: PotStill[] = []
  readonly segments = new Map<string, Segment>()
  readonly wells = new Map<string, Well>()
  readonly fences = new Set<string>()
  readonly sprinklers = new Map<string, Sprinkler>()
  readonly netVerts = new Set<string>()
  readonly house: House
  readonly truck: Truck
  readonly stall: StallMap
  readonly family: Family
  sales: StallSale[] = []
  consignRevision = 0
  readonly seats: Seat[]
  local: SeatId = 0
  act: Seat
  remote: ((cmd: Cmd) => void) | undefined
  readonly clock = new Clock()
  readonly drops: Drop[] = []
  readonly modifiers: Modifier[] = []
  readonly done = new Set<ResearchId>()
  money = 50
  job: Job = { kind: 'idle' }
  speech: Speech = { kind: 'none' }
  pulse: Pulse | undefined = undefined
  hud: HudTarget | undefined = undefined
  tally: DayTally = { died: 0, harvests: 0, research: [] }
  seam: Seam = { kind: 'play' }
  groundRev = 0
  bigTicks = 0
  digs = 0
  mines = 0
  cheatFastResearch = false
  private mktAcc = 0
  private bigAcc = 0
  private nets: Net[] | undefined = undefined
  private netAt = new Map<string, Net>()
  private readonly chunks = new Map<string, Cell[][]>()
  private readonly live = new Map<string, Coord>()
  private readonly vfx = new Map<string, boolean>()
  private readonly subs = new Set<(kind: PingKind, reasons: ReadonlySet<DirtyReason>) => void>()
  private pendingDirty = new Set<DirtyReason>()
  private flushQueued = false

  constructor(seed?: number, sink?: LogSink)
  constructor(h: Hydrate)
  constructor(seedOrH?: number | Hydrate, sink: LogSink = new MemorySink()) {
    if (typeof seedOrH === 'object') {
      const h = seedOrH
      this.rng = h.rng
      this.sink = h.sink
      this.house = h.house
      this.truck = h.truck
      this.pumps = h.pumps
      this.tanks = h.tanks
      this.taps = h.taps
      this.stills = h.stills
      this.stall = h.stall
      this.family = h.family
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
      this.purchases = h.purchases
      this.digs = h.digs
      this.mines = h.mines
      this.bigTicks = h.bigTicks
      this.done.clear()
      h.done.forEach(id => this.done.add(id))
      this.job = h.job
      this.tally = h.tally
      this.seam = h.seam
      this.ripenN.clear()
      h.ripenN.forEach(e => this.ripenN.set(`${e.col},${e.row}`, e.n))
      this.segments.clear()
      h.segments.forEach(s => this.segments.set(edgeKey(s.at), s))
      this.wells.clear()
      h.wells.forEach(well => this.wells.set(edgeKey(well.at), well))
      this.sprinklers.clear()
      h.sprinklers.forEach(s => this.sprinklers.set(vertexKey(s.at), s))
      this.fences.clear()
      h.fences.forEach(at => this.fences.add(`${at.col},${at.row}`))
      this.drops.length = 0
      h.drops.forEach(d => this.drops.push(d))
      this.modifiers.length = 0
      for (const id of h.family.player.owned.keys()) {
        const effect = SKILLS[id].effect
        if (effect.kind === 'better') {
          this.modifiers.push({
            id,
            source: 'skill',
            crop: effect.crop,
            saleMul: effect.saleMul,
            growSpeed: 1,
            waterUseMul: 1,
          })
        }
      }
      this.netVerts.clear()
      h.segments.forEach(s => vertsOf(s.at).forEach(v => this.netVerts.add(vertexKey(v))))
      h.wells.forEach(well => vertsOf(well.at).forEach(v => this.netVerts.add(vertexKey(v))))
      h.sprinklers.forEach(s => this.netVerts.add(vertexKey(s.at)))
      this.now = 0
      this.speech = { kind: 'none' }
      this.pulse = undefined
      this.hud = undefined
      this.cheatFastResearch = false
      this.sales = []
      this.consignRevision = 0
      this.groundRev = 0
      this.mktAcc = 0
      this.bigAcc = 0
      this.nets = undefined
      this.seats.forEach(s => {
        s.queue.length = 0
        s.cue = { kind: 'none' }
        s.actor.work = 0
        s.workLeft = 0
        s.workTotal = 0
        s.filling = false
        s.place = { kind: 'none' }
        s.legStart = { x: s.actor.x, y: s.actor.y }
      })
      this.sink.reset(this.rng.seed)
      this.indexAll()
      return
    }
    this.rng = new Rng(seedOrH)
    this.sink = sink
    this.sink.reset(this.rng.seed)
    this.house = new House(HOUSE_BASE, DOOR)
    this.truck = new Truck(TRUCK_BASE)
    this.pumps = [new Pump(PUMP_BASE, 'starter')]
    this.stall = Object.fromEntries(STALL_IDS.map(id => [id, makeStall(id, this.modifiers)])) as StallMap
    this.family = {
      player: emptyMember(),
      husband: emptyMember(),
      daughter: emptyMember(),
    }
    this.rerollOffers('player')
    this.rerollOffers('husband')
    this.rerollOffers('daughter')
    this.chunks.set(chunkKey(this.owned[0]), generateChunk(this.rng, this.owned[0], this.house, this.pumps[0], this.truck))
    this.seats = [soloSeat(localPlayerId(), localPlayerName())]
    this.act = this.seats[0]
    this.drops.push({ at: { ...DOOR }, item: makeContainer('bucket', CONTAINERS.bucket.capacityLiters) })
    this.indexAll()
  }

  static hydrate(h: Hydrate): World {
    return new World(h)
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

  logSince(n: number): Cmd[] {
    return this.cmds.slice(Math.max(0, n - this.logBase))
  }

  get pump(): Pump {
    return this.pumps[0]
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
    this.ping()
  }

  commit(cmd: Extract<Cmd, { a: typeof Act.click }>): 'queued' | 'placed' | 'blocked' | 'noop'
  commit(cmd: Extract<Cmd, { a: typeof Act.buy }>): 'Cannot afford' | 'Inventory full' | undefined
  commit(cmd: Cmd): void
  commit(cmd: Cmd): 'queued' | 'placed' | 'blocked' | 'noop' | 'Cannot afford' | 'Inventory full' | undefined | void {
    if (this.remote !== undefined) {
      this.remote(cmd)
      return
    }
    return this.dispatch(cmd)
  }

  dispatch(cmd: Extract<Cmd, { a: typeof Act.click }>): 'queued' | 'placed' | 'blocked' | 'noop'
  dispatch(cmd: Extract<Cmd, { a: typeof Act.buy }>): 'Cannot afford' | 'Inventory full' | undefined
  dispatch(cmd: Cmd): void
  dispatch(cmd: Cmd): 'queued' | 'placed' | 'blocked' | 'noop' | 'Cannot afford' | 'Inventory full' | undefined | void {
    this.cmds.push(cmd)
    if (this.cmds.length > LOG_CAP) {
      this.cmds.shift()
      this.logBase += 1
    }
    this.sink.push(cmd)
    return this.apply(cmd)
  }

  apply(cmd: Extract<Cmd, { a: typeof Act.click }>): 'queued' | 'placed' | 'blocked' | 'noop'
  apply(cmd: Extract<Cmd, { a: typeof Act.buy }>): 'Cannot afford' | 'Inventory full' | undefined
  apply(cmd: Cmd): void
  apply(cmd: Cmd): 'queued' | 'placed' | 'blocked' | 'noop' | 'Cannot afford' | 'Inventory full' | undefined | void {
    this.act = this.seats[cmd.p]
    switch (cmd.a) {
      case Act.click:
        return this.clickBody({ col: cmd.c[0], row: cmd.c[1] })
      case Act.clickValve:
        this.clickValveBody(cmd.e)
        return
      case Act.clickWell:
        this.clickWellBody(cmd.e)
        return
      case Act.enqueue:
        this.enqueueOn(this.act, cmd.i)
        return
      case Act.buy:
        return this.buyBody(cmd.s)
      case Act.buyPacks:
        this.buyPacksBody(cmd.s)
        return
      case Act.placePipe:
        this.placePipeBody(cmd.e)
        return
      case Act.placeSprinkler:
        this.placeSprinklerBody(cmd.s)
        return
      case Act.delete:
        if (cmd.k === 'pipe') this.deletePipeBody(cmd.e)
        else if (cmd.k === 'well') this.deleteWellBody(cmd.e)
        else if (cmd.k === 'sprinkler') this.deleteSprinklerBody({ col: cmd.c[0], row: cmd.c[1] })
        else this.deleteBuildingBody({ col: cmd.c[0], row: cmd.c[1] })
        return
      case Act.expand:
        this.expandBody(cmd.k)
        return
      case Act.startResearch:
        this.startResearchBody(cmd.r)
        return
      case Act.pickSkill:
        this.pickSkillBody(cmd.m, cmd.s)
        return
      case Act.sellAll:
        this.sellAllBody()
        return
      case Act.nudgeOffered:
        this.nudgeOfferedBody(cmd.g, cmd.d)
        return
      case Act.swap:
        this.swapBody(cmd.i)
        return
      case Act.swapChest:
        this.swapChestBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.i)
        return
      case Act.tuneSprinkler:
        this.tuneSprinklerBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.u)
        return
      case Act.openHud:
        this.openHudBody({ kind: 'sprinkler', at: { col: cmd.c[0], row: cmd.c[1] } })
        return
      case Act.closeHud:
        this.closeHudBody()
        return
      case Act.armDelete:
        this.armDeleteBody()
        return
      case Act.cancelPlace:
        this.cancelPlaceBody()
        return
      case Act.rotatePlace:
        this.rotatePlaceBody()
        return
      case Act.dismissRecap:
        this.dismissRecapBody()
        return
      case Act.ackCue:
        this.ackCueBody()
        return
      case Act.rightClick:
        this.rightClickBody({ col: cmd.c[0], row: cmd.c[1] })
        return
      case Act.cheat:
        if (cmd.k === 'all') this.unlockAllBody()
        else if (cmd.k === 'money') this.cheatMoneyBody()
        else if (cmd.k === 'points') this.cheatPointsBody()
        else this.toggleCheatResearchBody()
        return
    }
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

  private emit(kind: Exclude<PingKind, 'dirty'>): void {
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
    grid[loc.row][loc.col] = cell
    if (groundSig(prev) !== groundSig(cell)) this.groundRev += 1
    this.track(at, cell)
  }

  private track(at: Coord, cell: Cell): void {
    const k = `${at.col},${at.row}`
    const on =
      cell.kind === 'growing' ||
      cell.kind === 'ripe' ||
      cell.kind === 'weed' ||
      cell.kind === 'turf' ||
      cell.kind === 'chest' ||
      cell.kind === 'compost-box' ||
      cell.kind === 'mill' ||
      cell.kind === 'jam' ||
      cell.kind === 'still' ||
      cell.kind === 'barrel' ||
      cell.kind === 'freezer' ||
      (cell.kind === 'tree' && cell.base.col === at.col && cell.base.row === at.row)
    if (on) this.live.set(k, { col: at.col, row: at.row })
    else this.live.delete(k)
  }

  private indexAll(): void {
    this.live.clear()
    this.forEachCell((at, c) => this.track(at, c))
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

  skuPrice(id: SkuId): number {
    let p = SKUS[id].price
    const tab = SKUS[id].tab
    if (tab === 'utility') p -= this.skillTier('tool-contracts')
    if (tab === 'automation') p -= this.skillTier('machine-contracts')
    return p < 1 ? 1 : p
  }

  marketOpen(): boolean {
    const p = this.clock.phase()
    if (p === 'sunrise' || p === 'day') return true
    if (p === 'sunset') return this.hasSkill('open-late')
    return this.hasSkill('open-24')
  }

  grantPoint(member: MemberId): void {
    this.family[member].points += 1
  }

  pickSkill(member: MemberId, slot: number): void {
    this.commit({ a: Act.pickSkill, t: this.now, p: this.local, m: member, s: slot })
  }

  private pickSkillBody(member: MemberId, slot: number): void {
    const st = this.family[member]
    if (st.points < 1) return
    const offer = st.offers[slot]
    if (offer === undefined) return
    st.points -= 1
    st.owned.set(offer.id as never, offer.tier)
    const effect = SKILLS[offer.id].effect
    if (effect.kind === 'better') {
      this.modifiers.push({
        id: offer.id,
        source: 'skill',
        crop: effect.crop,
        saleMul: effect.saleMul,
        growSpeed: 1,
        waterUseMul: 1,
      })
    }
    st.pickCount += 1
    this.rerollOffers(member)
    this.ping()
  }

  private rerollOffers(member: MemberId): void {
    const st = this.family[member]
    const pool = skillIds(member).filter(id => this.skillEligible(id))
    const n = Math.min(3, pool.length)
    const left = [...pool]
    const out: SkillRef[] = []
    for (let i = 0; i < n; i++) {
      const u = this.rng.stream('skill').at(MEMBER_IX[member], st.pickCount, i)
      const ix = Math.floor(u * left.length)
      const id = left.splice(ix, 1)[0]
      const have = this.skillTier(id)
      out.push({ id, tier: have + 1 })
    }
    st.offers = out as never
  }

  private skillEligible(id: SkillId): boolean {
    const def: SkillDef = SKILLS[id]
    if (this.skillTier(id) >= def.maxTier) return false
    if (def.gate.kind === 'research') return this.done.has(def.gate.id)
    if (def.gate.kind === 'skill') return this.hasSkill(def.gate.id)
    return true
  }

  faces(): ExpandFace[] {
    if (!this.done.has('unlock-expand')) return []
    const have = new Set(this.owned.map(chunkKey))
    const seen = new Set<string>()
    const price = this.expandPrice()
    const out: ExpandFace[] = []
    const dirs = [
      { dir: 'n' as const, dcx: 0, dcy: -1 },
      { dir: 'e' as const, dcx: 1, dcy: 0 },
      { dir: 's' as const, dcx: 0, dcy: 1 },
      { dir: 'w' as const, dcx: -1, dcy: 0 },
    ]
    this.owned.forEach(o => {
      const rect = chunkRect(o)
      dirs.forEach(d => {
        const id = { cx: o.cx + d.dcx, cy: o.cy + d.dcy }
        const key = chunkKey(id)
        if (have.has(key) || seen.has(key)) return
        seen.add(key)
        const at =
          d.dir === 'n'
            ? { col: rect.col0 + CHUNK / 2, row: rect.row0 - 1 }
            : d.dir === 'e'
              ? { col: rect.col1, row: rect.row0 + CHUNK / 2 }
              : d.dir === 's'
                ? { col: rect.col0 + CHUNK / 2, row: rect.row1 }
                : { col: rect.col0 - 1, row: rect.row0 + CHUNK / 2 }
        out.push({ id, dir: d.dir, at, price })
      })
    })
    return out
  }

  expand(id: ChunkId): void {
    this.commit({ a: Act.expand, t: this.now, p: this.local, k: id })
  }

  private expandBody(id: ChunkId): void {
    if (!this.done.has('unlock-expand')) return
    if (this.owned.some(c => c.cx === id.cx && c.cy === id.cy)) return
    if (!this.owned.some(c => Math.abs(c.cx - id.cx) + Math.abs(c.cy - id.cy) === 1)) return
    const price = this.expandPrice()
    if (this.money < price) return
    this.money -= price
    this.owned.push(id)
    this.purchases += 1
    this.dirtyNets()
    this.chunks.set(chunkKey(id), generateChunk(this.rng, id, this.house, this.pumps[0], this.truck))
    this.indexAll()
    this.ping()
  }

  skuOpen(id: SkuId): boolean {
    const s = SKUS[id]
    if (s.need !== undefined && !this.hasSkill(s.need)) return false
    return s.unlock === 'start' || this.done.has(s.unlock)
  }

  skuShown(id: SkuId): boolean {
    const s = SKUS[id].show
    return s === 'start' || this.done.has(s)
  }

  researchShown(id: ResearchId): boolean {
    const r = RESEARCH[id].reveal
    return r === 'start' || this.done.has(r)
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
    return seg !== undefined && flows(seg)
  }

  hasValve(e: Edge): boolean {
    const seg = this.segments.get(edgeKey(e))
    return seg !== undefined && seg.gate.kind === 'valve'
  }

  wellAt(e: Edge): Well | undefined {
    return this.wells.get(edgeKey(e))
  }

  hasWell(e: Edge): boolean {
    return this.wells.has(edgeKey(e))
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

  private pruneVert(e: Edge | Vertex): void {
    const verts = 'axis' in e ? vertsOf(e) : [e]
    verts.forEach(v => {
      const keep =
        incident(v).some(x => this.segments.has(edgeKey(x))) || this.sprinklers.has(vertexKey(v))
      if (!keep) this.netVerts.delete(vertexKey(v))
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

  private placePipeBody(e: Edge): void {
    if (this.act.place.kind !== 'sku') return
    const id = this.act.place.id
    if (id !== 'buy-pipe' && id !== 'buy-valve' && id !== 'buy-well') return
    if (this.money < this.skuPrice(id)) return
    if (!this.edgeOwned(e)) return
    if (id === 'buy-pipe') {
      if (this.hasPipe(e) || this.hasWell(e)) return
      this.segments.set(edgeKey(e), { at: e, gate: { kind: 'bare' } })
      vertsOf(e).forEach(v => this.netVerts.add(vertexKey(v)))
    } else if (id === 'buy-valve') {
      const seg = this.segmentAt(e)
      if (seg === undefined || seg.gate.kind === 'valve') return
      seg.gate = { kind: 'valve', open: true }
    } else {
      if (this.hasPipe(e) || this.hasWell(e)) return
      this.wells.set(edgeKey(e), new Well(e))
      vertsOf(e).forEach(v => this.netVerts.add(vertexKey(v)))
    }
    this.money -= this.skuPrice(id)
    this.dirtyNets()
    this.pulse = { text: `Place ${placeLabel(id)}`, at: { col: e.col, row: e.row } }
    this.ping()
  }

  deletePipe(e: Edge): void {
    this.commit({ a: Act.delete, t: this.now, p: this.local, k: 'pipe', e })
  }

  private deletePipeBody(e: Edge): void {
    if (this.act.place.kind !== 'delete') return
    const seg = this.segmentAt(e)
    if (!this.edgeOwned(e) || seg === undefined) return
    if (seg.gate.kind === 'valve') {
      seg.gate = { kind: 'bare' }
      this.pulse = { text: 'Delete valve', at: { col: e.col, row: e.row } }
    } else {
      this.segments.delete(edgeKey(e))
      this.pruneVert(e)
      this.pulse = { text: 'Delete pipe', at: { col: e.col, row: e.row } }
    }
    this.dirtyNets()
    this.ping()
  }

  deleteWell(e: Edge): void {
    this.commit({ a: Act.delete, t: this.now, p: this.local, k: 'well', e })
  }

  private deleteWellBody(e: Edge): void {
    if (this.act.place.kind !== 'delete') return
    if (this.wellAt(e) === undefined) return
    this.wells.delete(edgeKey(e))
    this.pruneVert(e)
    this.dirtyNets()
    this.pulse = { text: 'Delete well', at: { col: e.col, row: e.row } }
    this.ping()
  }

  toggleValve(e: Edge): void {
    const seg = this.segmentAt(e)
    if (seg === undefined || seg.gate.kind !== 'valve') return
    seg.gate = { kind: 'valve', open: !seg.gate.open }
    this.dirtyNets()
    this.pulse = { text: seg.gate.open ? 'Open valve' : 'Close valve', at: { col: e.col, row: e.row } }
    this.ping()
  }

  openHud(target: HudTarget): void {
    this.commit({ a: Act.openHud, t: this.now, p: this.local, c: [target.at.col, target.at.row] })
  }

  private openHudBody(target: HudTarget): void {
    this.hud = target
    this.ping()
  }

  closeHud(): void {
    this.commit({ a: Act.closeHud, t: this.now, p: this.local })
  }

  private closeHudBody(): void {
    if (this.hud === undefined) return
    this.hud = undefined
    this.ping()
  }

  tuneSprinkler(at: Vertex, tune: Tune): void {
    this.commit({ a: Act.tuneSprinkler, t: this.now, p: this.local, c: [at.col, at.row], u: tune })
  }

  private tuneSprinklerBody(at: Vertex, tune: Tune): void {
    const s = this.sprinklerAt(at)
    if (s === undefined) return
    s.tune = tune
    this.ping()
  }

  placeSprinkler(s: Sprinkler): void {
    this.commit({ a: Act.placeSprinkler, t: this.now, p: this.local, s })
  }

  private placeSprinklerBody(s: Sprinkler): void {
    const id = sprinklerSku(s)
    if (this.act.place.kind !== 'sku' || this.act.place.id !== id) return
    if (this.money < this.skuPrice(id)) return
    if (!this.vertexOwned(s.at)) return
    if (this.sprinklerAt(s.at) !== undefined) return
    const placed: Sprinkler =
      this.act.place.id === 'buy-sprinkler-vert'
        ? { variant: 'vert', at: s.at, facing: this.act.place.facing, tune: { kind: 'flat' } }
        : s
    if (!aoe(placed).every(c => this.inWorld(c))) return
    this.money -= this.skuPrice(id)
    this.sprinklers.set(vertexKey(placed.at), placed)
    this.netVerts.add(vertexKey(placed.at))
    this.dirtyNets()
    const text =
      placed.variant === 'basic'
        ? 'Place Sprinkler'
        : placed.variant === 'vert'
          ? 'Place Vertical sprinkler'
          : 'Place Large sprinkler'
    this.pulse = { text, at: { col: placed.at.col, row: placed.at.row } }
    this.ping()
  }

  deleteSprinkler(v: Vertex): void {
    this.commit({ a: Act.delete, t: this.now, p: this.local, k: 'sprinkler', c: [v.col, v.row] })
  }

  private deleteSprinklerBody(v: Vertex): void {
    if (this.act.place.kind !== 'delete') return
    if (this.sprinklerAt(v) === undefined) return
    this.sprinklers.delete(vertexKey(v))
    this.pruneVert(v)
    this.dirtyNets()
    this.pulse = { text: 'Delete sprinkler', at: { col: v.col, row: v.row } }
    this.ping()
  }

  armDelete(): void {
    this.commit({ a: Act.armDelete, t: this.now, p: this.local })
  }

  private armDeleteBody(): void {
    this.act.place = { kind: 'delete' }
    this.ping()
  }

  rotatePlace(): void {
    this.commit({ a: Act.rotatePlace, t: this.now, p: this.local })
  }

  private rotatePlaceBody(): void {
    if (this.act.place.kind !== 'sku' || this.act.place.id !== 'buy-sprinkler-vert') return
    this.act.place = {
      kind: 'sku',
      id: 'buy-sprinkler-vert',
      facing: this.act.place.facing === 'ns' ? 'ew' : 'ns',
    }
    this.ping()
  }

  deleteBuilding(at: Coord): void {
    this.commit({ a: Act.delete, t: this.now, p: this.local, k: 'building', c: [at.col, at.row] })
  }

  private deleteBuildingBody(at: Coord): void {
    if (this.act.place.kind !== 'delete') return
    if (!inWorld(at, this.owned)) return
    const c = this.cell(at)
    if (this.hasFence(at)) {
      // TODO 1.1 multiplayer guest pipe/valve/sprinkler/tile/fence
      if (this.act.id !== 0) return
      this.fences.delete(`${at.col},${at.row}`)
      this.pulse = { text: 'Delete wooden fence', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'untilled' && c.cover.kind === 'tile') {
      // TODO 1.1 multiplayer guest pipe/valve/sprinkler/tile/fence
      if (this.act.id !== 0) return
      this.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'bare' } })
      this.pulse = { text: 'Delete paving', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'pump') {
      if (c.form === 'starter') return
      occupiedCells(c.base, this.owned).forEach(p => {
        this.setCell(p, { kind: 'empty', soil: this.freshSoil(p) })
      })
      this.pumps.splice(this.pumps.indexOf(c), 1)
      this.dirtyNets()
      this.pulse = { text: 'Delete pumpjack', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'rain-tank') {
      occupiedCells(c.base, this.owned).forEach(p => {
        this.setCell(p, { kind: 'empty', soil: this.freshSoil(p) })
      })
      this.tanks.splice(this.tanks.indexOf(c), 1)
      this.dirtyNets()
      this.pulse = { text: 'Delete rainwater tank', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'tap') {
      this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
      this.taps.splice(this.taps.indexOf(c), 1)
      this.dirtyNets()
      this.pulse = { text: 'Delete tap', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'chest') {
      c.slots.forEach(s => {
        if (s.kind === 'hold') this.drops.push({ at: { ...at }, item: s.item })
      })
      this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
      this.pulse = { text: 'Delete chest', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'compost-box') {
      this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
      this.pulse = { text: 'Delete compost box', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'mill') {
      this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
      this.pulse = { text: 'Delete mill', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'jam') {
      this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
      this.pulse = { text: 'Delete jam machine', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'still') {
      this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
      this.stills.splice(this.stills.indexOf(c), 1)
      this.dirtyNets()
      this.pulse = { text: 'Delete pot still', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'barrel') {
      this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
      this.pulse = { text: 'Delete wine barrel', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'freezer') {
      c.slots.forEach(s => {
        if (s.kind === 'hold') this.drops.push({ at: { ...at }, item: s.item })
      })
      this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
      this.pulse = { text: 'Delete freezer', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind !== 'grinder') return
    this.setCell(at, { kind: 'empty', soil: this.freshSoil(at) })
    this.pulse = { text: 'Delete grinder', at: { ...at } }
    this.ping()
  }

  sources(): { base: Base; water: Reservoir }[] {
    return [...this.pumps, ...this.tanks]
  }

  private dirtyNets(): void {
    this.nets = undefined
  }

  private grid(): Net[] {
    if (this.nets !== undefined) return this.nets
    const up = new Map<string, string>()
    const root = (k: string): string => {
      let r = k
      while (up.get(r) !== r) r = up.get(r) as string
      return r
    }
    const add = (k: string): void => {
      if (!up.has(k)) up.set(k, k)
    }
    const join = (a: string, b: string): void => {
      add(a)
      add(b)
      up.set(root(a), root(b))
    }
    this.segments.forEach(seg => {
      if (!flows(seg)) return
      const [a, b] = vertsOf(seg.at)
      join(vertexKey(a), vertexKey(b))
    })
    this.wells.forEach(well => {
      const [a, b] = vertsOf(well.at)
      join(vertexKey(a), vertexKey(b))
    })
    const sources = this.sources()
    const sourceCorners = sources.map(s => corners(occupiedCells(s.base, this.owned)).map(vertexKey))
    sourceCorners.forEach(ks => {
      ks.forEach(k => add(k))
      ks.slice(1).forEach(k => join(ks[0], k))
    })
    const byRoot = new Map<string, Net>()
    const netOf = (k: string): Net => {
      const r = root(k)
      const hit = byRoot.get(r)
      if (hit !== undefined) return hit
      const made: Net = { sources: [], sprinklers: [], taps: [], stills: [] }
      byRoot.set(r, made)
      return made
    }
    sources.forEach((s, i) => {
      netOf(sourceCorners[i][0]).sources.push(s.water)
    })
    this.wells.forEach(well => {
      const [a] = vertsOf(well.at)
      netOf(vertexKey(a)).sources.push(well.water)
    })
    this.sprinklers.forEach(s => {
      const k = vertexKey(s.at)
      if (!up.has(k)) return
      if (!incident(s.at).some(e => this.conducts(e))) return
      netOf(k).sprinklers.push(s)
    })
    this.taps.forEach(t => {
      const hit = corners(occupiedCells(t.base, this.owned)).find(
        v => up.has(vertexKey(v)) && incident(v).some(e => this.conducts(e)),
      )
      if (hit === undefined) return
      netOf(vertexKey(hit)).taps.push(t)
    })
    this.stills.forEach(s => {
      const hit = corners(occupiedCells(s.base, this.owned)).find(
        v => up.has(vertexKey(v)) && incident(v).some(e => this.conducts(e)),
      )
      if (hit === undefined) return
      netOf(vertexKey(hit)).stills.push(s)
    })
    this.netAt = new Map([...up.keys()].map(k => [k, netOf(k)]))
    this.nets = [...byRoot.values()]
    return this.nets
  }

  netOfVertex(v: Vertex): Net | undefined {
    this.grid()
    return this.netAt.get(vertexKey(v))
  }

  netOfCell(base: Base): Net | undefined {
    this.grid()
    const hit = corners(occupiedCells(base, this.owned)).find(v => this.netAt.has(vertexKey(v)))
    if (hit === undefined) return undefined
    return this.netAt.get(vertexKey(hit))
  }

  vertexWet(v: Vertex): boolean {
    const net = this.netOfVertex(v)
    return net !== undefined && net.sources.length > 0
  }

  pendingWet(e: Edge): boolean {
    const seen = new Set<string>([edgeKey(e)])
    const verts = new Set<string>()
    const q: Edge[] = [e]
    while (q.length > 0) {
      const cur = q[q.length - 1]
      q.pop()
      vertsOf(cur).forEach(v => {
        verts.add(vertexKey(v))
        incident(v).forEach(n => {
          const k = edgeKey(n)
          if (seen.has(k) || !this.conducts(n)) return
          seen.add(k)
          q.push(n)
        })
      })
    }
    return (
      this.sources().some(p =>
        corners(occupiedCells(p.base, this.owned)).some(v => verts.has(vertexKey(v))),
      ) ||
      [...this.wells.values()].some(well =>
        vertsOf(well.at).some(v => verts.has(vertexKey(v))),
      )
    )
  }

  sprinklerTargets(s: Sprinkler): Coord[] {
    return aoe(s).filter(at => this.inWorld(at) && this.cell(at).kind === 'growing')
  }

  tileRate(s: Sprinkler): number {
    if (s.tune.kind === 'flat') return SPRINKLER_TILE_RATE
    return statsOf(s.tune.crop, 'common', this.modifiers).waterUsePerSec
  }

  demand(s: Sprinkler): number {
    return this.sprinklerTargets(s).length * this.tileRate(s)
  }

  rate(v: Vertex): number {
    const s = this.sprinklerAt(v)
    if (s === undefined) return 0
    const net = this.netOfVertex(v)
    if (net === undefined || net.sprinklers.length === 0) return 0
    if (net.sources.every(r => r.stored === 0)) return 0
    const total = net.sprinklers.reduce((a, x) => a + this.demand(x), 0)
    if (total === 0) return 0
    const supply = net.sources.reduce((a, r) => a + r.rate, 0)
    const served = total > supply ? supply : total
    return (this.demand(s) / total) * served
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

  private clickBody(at: Coord): 'queued' | 'placed' | 'blocked' | 'noop' {
    if (!inWorld(at, this.owned)) {
      if (inFade(at, this.owned) && this.act.place.kind === 'none') this.say(NOT_OWNED)
      return 'noop'
    }
    const p = readPrompt(this, at)
    if (p.kind === 'intent') {
      this.enqueueOn(this.act, p.intent)
      return 'queued'
    }
    if (p.kind === 'place') {
      this.confirmPlace(at)
      return 'placed'
    }
    if (this.act.place.kind === 'none' && inWorld(at, this.owned)) this.maybeSay(at)
    return 'blocked'
  }

  clickValve(e: Edge): void {
    this.commit({ a: Act.clickValve, t: this.now, p: this.local, e })
  }

  private clickValveBody(e: Edge): void {
    const p = valvePrompt(this, e)
    if (p.kind !== 'intent') return
    this.enqueueOn(this.act, p.intent)
  }

  clickWell(e: Edge): void {
    this.commit({ a: Act.clickWell, t: this.now, p: this.local, e })
  }

  private clickWellBody(e: Edge): void {
    const p = wellPrompt(this, e)
    if (p.kind !== 'intent') return
    this.enqueueOn(this.act, p.intent)
  }

  ackCue(): void {
    this.commit({ a: Act.ackCue, t: this.now, p: this.local })
  }

  private ackCueBody(): void {
    this.act.cue = { kind: 'none' }
    this.ping()
  }

  enqueue(i: Intent): void {
    this.enqueueOn(this.seats[this.local], i)
  }

  private enqueueOn(seat: Seat, i: Intent): void {
    if (seat.queue.length >= QUEUE_CAP) return
    const start = seat.queue.length === 0
    seat.queue.push(i)
    if (start) {
      this.act = seat
      this.markWalk(i)
    }
    this.ping()
  }

  taskName(i: Intent): TaskName {
    this.act = this.seats[this.local]
    if (!this.act.actor.inside(dest(i))) {
      if (i.act === 'shovel') return 'Move here and dig'
      if (i.act === 'consign') return 'Drop off'
      return 'Move here'
    }
    switch (i.act) {
      case 'walk':
        return 'Move here'
      case 'shovel':
        return 'Dig'
      case 'mine':
        return 'Mine'
      case 'plant':
        return 'Plant'
      case 'water':
        return 'Water'
      case 'fertilize':
        return 'Fertilize'
      case 'compost':
        return 'Compost'
      case 'harvest':
        return 'Harvest'
      case 'fill':
      case 'fillWell':
        return 'Fill'
      case 'consign':
        return 'Drop off'
      case 'pickup':
        return 'Pick up'
      case 'drop':
        return 'Drop'
      case 'inventory':
        return 'Inventory'
      case 'chest':
        return 'Chest'
      case 'grind':
        return 'Grind'
      case 'mill':
        return 'Mill'
      case 'still':
        return 'Still'
      case 'barrel':
        return 'Barrel'
      case 'jam':
        return 'Jam'
      case 'valve':
        return 'Valve'
      case 'tend':
        return 'Tend'
    }
  }

  taskProgress(): number {
    this.act = this.seats[this.local]
    const head = this.act.queue[0]
    if (head === undefined) return 0
    if (this.act.workLeft > 0 && this.act.workTotal > 0) return 1 - this.act.workLeft / this.act.workTotal
    if (this.act.filling && this.act.hand.kind === 'hold' && this.act.hand.item.kind === 'container') {
      return this.act.hand.item.liters / this.act.hand.item.capacityLiters
    }
    const at = dest(head)
    if (!this.act.actor.inside(at)) {
      const tx = at.col + 0.5
      const ty = at.row + 0.5
      const span = Math.hypot(this.act.legStart.x - tx, this.act.legStart.y - ty)
      if (span === 0) return 1
      return 1 - Math.hypot(this.act.actor.x - tx, this.act.actor.y - ty) / span
    }
    return 1
  }

  buy(id: SkuId): 'Cannot afford' | 'Inventory full' | undefined {
    return this.commit({ a: Act.buy, t: this.now, p: this.local, s: id })
  }

  private buyBody(id: SkuId): 'Cannot afford' | 'Inventory full' | undefined {
    if (!this.skuOpen(id)) return undefined
    const made = skuItem(id)
    if (made.kind === 'grass-seeds') {
      const price = this.skuPrice(id)
      if (this.money < price) return 'Cannot afford'
      if (!this.canFitGrass()) return 'Inventory full'
      this.money -= price
      this.putGrass(made.count)
      this.compactInventory()
      this.ping()
      return undefined
    }
    if (made.kind === 'sugar') {
      const price = this.skuPrice(id)
      if (this.money < price) return 'Cannot afford'
      if (!this.canFitSugar()) return 'Inventory full'
      this.money -= price
      this.putSugar(made)
      this.compactInventory()
      this.ping()
      return undefined
    }
    if (made.kind === 'seeds') {
      const price = this.skuPrice(id)
      if (this.money < price) return 'Cannot afford'
      const tier = this.skillTier('seed-bank')
      const fits =
        tier <= 0
          ? this.canFitSeeds(made.crop, [{ rarity: 'common', count: made.count }])
          : this.act.inventory.some(s => s.kind === 'empty') ||
            RARITY_RANK.every(rarity => this.seedSlot(made.crop, rarity) >= 0)
      if (!fits) return 'Inventory full'
      const rarity = rollShopRarity(tier, this.rng.stream('shop').next())
      this.money -= price
      this.putSeeds(made.crop, rarity, made.count)
      this.compactInventory()
      this.ping()
      return undefined
    }
    if (id === 'buy-sprinkler-vert') this.act.place = { kind: 'sku', id: 'buy-sprinkler-vert', facing: 'ns' }
    else this.act.place = { kind: 'sku', id }
    this.ping()
    return undefined
  }

  confirmPlace(at: Coord): void {
    if (this.act.place.kind === 'delete') {
      this.deleteBuildingBody(at)
      return
    }
    if (this.act.place.kind !== 'sku') return
    if (
      this.act.place.id === 'buy-pipe' ||
      this.act.place.id === 'buy-valve' ||
      this.act.place.id === 'buy-well' ||
      this.act.place.id === 'buy-sprinkler' ||
      this.act.place.id === 'buy-sprinkler-vert' ||
      this.act.place.id === 'buy-sprinkler-large'
    ) {
      return
    }
    const price = this.skuPrice(this.act.place.id)
    if (this.money < price) return
    if (
      this.act.place.id === 'buy-tile-paved' ||
      this.act.place.id === 'buy-tile-brick' ||
      this.act.place.id === 'buy-tile-cobble'
    ) {
      // TODO 1.1 multiplayer guest pipe/valve/sprinkler/tile/fence
      if (this.act.id !== 0) return
      if (!inWorld(at, this.owned)) return
      const c = this.cell(at)
      if (!isTileSite(c)) return
      const tile = this.act.place.id === 'buy-tile-paved' ? 'paved' : this.act.place.id === 'buy-tile-brick' ? 'brick' : 'cobble'
      this.money -= price
      this.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'tile', tile } })
      this.pulse = { text: `Place ${placeLabel(this.act.place.id)}`, at: { ...at } }
      this.ping()
      return
    }
    if (this.act.place.id === 'buy-fence') {
      // TODO 1.1 multiplayer guest pipe/valve/sprinkler/tile/fence
      if (this.act.id !== 0) return
      if (!inWorld(at, this.owned)) return
      if (!isFenceSite(this.cell(at))) return
      if (this.hasFence(at)) return
      this.money -= price
      this.fences.add(`${at.col},${at.row}`)
      this.pulse = { text: `Place ${placeLabel(this.act.place.id)}`, at: { ...at } }
      this.ping()
      return
    }
    if (this.act.place.id === 'buy-pumpjack' || this.act.place.id === 'buy-rain-tank') {
      if (!wideSiteOk(this, at)) return
      this.money -= price
      const base = { shape: 'rect' as const, col: at.col, row: at.row, w: 2, h: 1 }
      const made = this.act.place.id === 'buy-pumpjack' ? new Pump(base, 'jack') : new RainTank(base)
      if (made.kind === 'pump') this.pumps.push(made)
      else this.tanks.push(made)
      this.setCell(at, made)
      this.setCell({ col: at.col + 1, row: at.row }, made)
      this.dirtyNets()
      this.pulse = { text: `Place ${placeLabel(this.act.place.id)}`, at: { ...at } }
      this.act.place = { kind: 'none' }
      this.ping()
      return
    }
    if (
      this.act.place.id === 'buy-chest' ||
      this.act.place.id === 'buy-grinder' ||
      this.act.place.id === 'buy-compost-box' ||
      this.act.place.id === 'buy-tap' ||
      this.act.place.id === 'buy-mill' ||
      this.act.place.id === 'buy-jam' ||
      this.act.place.id === 'buy-still' ||
      this.act.place.id === 'buy-barrel' ||
      this.act.place.id === 'buy-freezer'
    ) {
      if (!placeSolidOk(this, at)) return
      this.money -= price
      const base = { shape: 'rect' as const, col: at.col, row: at.row, w: 1, h: 1 }
      if (this.act.place.id === 'buy-chest') this.setCell(at, new Chest(base))
      else if (this.act.place.id === 'buy-grinder') this.setCell(at, new Grinder(base))
      else if (this.act.place.id === 'buy-compost-box') this.setCell(at, new CompostBox(base))
      else if (this.act.place.id === 'buy-mill') this.setCell(at, new Mill(base))
      else if (this.act.place.id === 'buy-jam') this.setCell(at, new JamMachine(base))
      else if (this.act.place.id === 'buy-still') {
        const still = new PotStill(base)
        this.stills.push(still)
        this.setCell(at, still)
        this.dirtyNets()
      } else if (this.act.place.id === 'buy-barrel') this.setCell(at, new WineBarrel(base))
      else if (this.act.place.id === 'buy-freezer') this.setCell(at, new Freezer(base))
      else {
        const tap = new Tap(base)
        this.taps.push(tap)
        this.setCell(at, tap)
        this.dirtyNets()
      }
      this.pulse = { text: `Place ${placeLabel(this.act.place.id)}`, at: { ...at } }
      this.act.place = { kind: 'none' }
      this.ping()
      return
    }
    if (!inWorld(at, this.owned) || !isPlot(this.cell(at))) return
    const made = skuItem(this.act.place.id)
    if (
      made.kind === 'pumpjack' ||
      made.kind === 'seeds' ||
      made.kind === 'chest' ||
      made.kind === 'grinder' ||
      made.kind === 'compost-box' ||
      made.kind === 'well' ||
      made.kind === 'valve' ||
      made.kind === 'rain-tank' ||
      made.kind === 'tap' ||
      made.kind === 'pipe' ||
      made.kind === 'sprinkler' ||
      made.kind === 'sprinkler-vert' ||
      made.kind === 'sprinkler-large' ||
      made.kind === 'delete' ||
      made.kind === 'tile' ||
      made.kind === 'fence' ||
      made.kind === 'grass-seeds' ||
      made.kind === 'mill' ||
      made.kind === 'jam-machine' ||
      made.kind === 'still' ||
      made.kind === 'barrel' ||
      made.kind === 'freezer' ||
      made.kind === 'sugar'
    ) {
      return
    }    this.money -= price
    this.drops.push({ at: { ...at }, item: made })
    this.pulse = { text: `Place ${placeLabel(this.act.place.id)}`, at: { ...at } }
    this.act.place = { kind: 'none' }
    this.ping()
  }

  cancelPlace(): void {
    this.commit({ a: Act.cancelPlace, t: this.now, p: this.local })
  }

  private cancelPlaceBody(): void {
    if (this.act.place.kind === 'none') return
    this.act.place = { kind: 'none' }
    this.ping()
  }

  rightClick(at: Coord): void {
    this.commit({ a: Act.rightClick, t: this.now, p: this.local, c: [at.col, at.row] })
  }

  private rightClickBody(at: Coord): void {
    if (this.act.place.kind !== 'none') {
      this.cancelPlaceBody()
      return
    }
    if (!inWorld(at, this.owned)) return
    if (!isPlot(this.cell(at))) return
    if (this.act.hand.kind !== 'hold') return
    this.enqueueOn(this.act, { act: 'drop', at: { ...at } })
  }

  swap(i: number): void {
    this.commit({ a: Act.swap, t: this.now, p: this.local, i })
  }

  private swapBody(i: number): void {
    const held = this.act.hand
    this.act.hand = this.act.inventory[i]
    this.act.inventory[i] = held
    this.compactInventory()
    this.ping()
  }

  swapChest(at: Coord, i: number): void {
    this.commit({ a: Act.swapChest, t: this.now, p: this.local, c: [at.col, at.row], i })
  }

  private swapChestBody(at: Coord, i: number): void {
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

  unlockAll(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'all' })
  }

  private unlockAllBody(): void {
    ;(Object.keys(RESEARCH) as ResearchId[]).forEach(id => {
      this.done.add(id)
    })
    this.money += 999
    this.job = { kind: 'idle' }
    this.family.player.points = 99
    this.family.husband.points = 99
    this.family.daughter.points = 99
    this.ping()
  }

  cheatMoney(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'money' })
  }

  private cheatMoneyBody(): void {
    this.money += 200
    this.ping()
  }

  cheatPoints(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'points' })
  }

  private cheatPointsBody(): void {
    this.family.player.points += 10
    this.family.husband.points += 10
    this.family.daughter.points += 10
    this.ping()
  }

  toggleCheatResearch(): void {
    this.commit({ a: Act.cheat, t: this.now, p: this.local, k: 'research' })
  }

  private toggleCheatResearchBody(): void {
    this.cheatFastResearch = !this.cheatFastResearch
    this.ping()
  }

  buyPacks(id: SkuId): void {
    this.commit({ a: Act.buyPacks, t: this.now, p: this.local, s: id })
  }

  private buyPacksBody(id: SkuId): void {
    if (!this.hasSkill('bulk-buying')) return
    if (!this.skuOpen(id)) return
    const made = skuItem(id)
    if (made.kind !== 'seeds') return
    const price = 5 * this.skuPrice(id) * 0.95
    if (this.money < price) return
    const fits =
      this.skillTier('seed-bank') <= 0
        ? this.canFitSeeds(made.crop, [{ rarity: 'common', count: made.count }])
        : this.canFitSeeds(
            made.crop,
            RARITY_RANK.map(rarity => ({ rarity, count: made.count })),
          )
    if (!fits) return
    const shop = this.rng.stream('shop')
    const rarityOf = [0, 1, 2, 3, 4].map(() => rollShopRarity(this.skillTier('seed-bank'), shop.next()))
    const stacks = RARITY_RANK.flatMap(rarity => {
      const n = rarityOf.filter(x => x === rarity).length
      return n === 0 ? [] : [{ rarity, count: n * made.count }]
    })
    this.money -= price
    stacks.forEach(s => this.putSeeds(made.crop, s.rarity, s.count))
    this.compactInventory()
    this.ping()
  }

  private seedSlot(crop: CropId, rarity: Rarity): number {
    return this.act.inventory.findIndex(
      s => s.kind === 'hold' && s.item.kind === 'seeds' && s.item.crop === crop && s.item.rarity === rarity,
    )
  }

  private grassSlot(): number {
    return this.act.inventory.findIndex(s => s.kind === 'hold' && s.item.kind === 'grass-seeds')
  }

  private canFitGrass(): boolean {
    return this.grassSlot() >= 0 || this.act.inventory.some(s => s.kind === 'empty')
  }

  private putGrass(count: number): void {
    const merge = this.grassSlot()
    if (merge >= 0) {
      const slot = this.act.inventory[merge]
      if (slot.kind === 'hold' && slot.item.kind === 'grass-seeds') slot.item.count += count
      return
    }
    this.act.inventory[this.act.inventory.findIndex(s => s.kind === 'empty')] = {
      kind: 'hold',
      item: { kind: 'grass-seeds', count },
    }
  }

  private canFitSeeds(crop: CropId, stacks: readonly { rarity: Rarity; count: number }[]): boolean {
    let empties = this.act.inventory.filter(s => s.kind === 'empty').length
    const seen = new Set<Rarity>()
    for (const s of stacks) {
      if (this.seedSlot(crop, s.rarity) >= 0 || seen.has(s.rarity)) {
        seen.add(s.rarity)
        continue
      }
      seen.add(s.rarity)
      if (empties < 1) return false
      empties -= 1
    }
    return true
  }

  private putSeeds(crop: AnnualId, rarity: Rarity, count: number): void {
    const merge = this.seedSlot(crop, rarity)
    if (merge >= 0) {
      const slot = this.act.inventory[merge]
      if (slot.kind === 'hold' && slot.item.kind === 'seeds') slot.item.count += count
      return
    }
    const empty = this.act.inventory.findIndex(s => s.kind === 'empty')
    this.act.inventory[empty] = { kind: 'hold', item: { kind: 'seeds', crop, rarity, count } }
  }

  nudgeOffered(id: StallGoodId, dir: 1 | -1): void {
    this.commit({ a: Act.nudgeOffered, t: this.now, p: this.local, g: id, d: dir })
  }

  private nudgeOfferedBody(id: StallGoodId, dir: 1 | -1): void {
    const g = this.stall[id]
    const cap = tenths(3 * stallX(id, this.modifiers))
    const next = tenths(g.offered) + dir
    const t = next < 1 ? 1 : next > cap ? cap : next
    g.offered = t / 10
    this.ping()
  }

  marketGain(): number {
    if (!this.marketOpen()) return 0
    const saleX = 1 + 0.02 * this.skillTier('saleswoman')
    const heirX = 1 + 0.05 * this.skillTier('heirloom')
    const bioX = 1 + 0.03 * this.skillTier('bio')
    const jam = this.jamFloor()
    const clearance = this.hasSkill('clearance')
    return STALL_IDS.reduce((total, id) => {
      if (isBakedStall(id)) {
        const count = this.stall[id].stock.common.organic
        if (count === 0) return total
        return total + this.stall[id].worth.common.organic * saleX
      }
      if (isSpiritStall(id)) {
        return (
          total +
          RARITY_RANK.reduce((goodTotal, rarity) => {
            const count = this.stall[id].stock[rarity].organic
            if (count === 0) return goodTotal
            const worth = this.stall[id].worth[rarity].organic
            return goodTotal + worth * saleX * (rarity === 'heirloom' ? heirX : 1)
          }, 0)
        )
      }
      const x = stallX(id, this.modifiers)
      return (
        total +
        RARITY_RANK.reduce((goodTotal, rarity) => {
          const rareX = stallRarity(id, rarity) * (rarity === 'heirloom' ? heirX : 1)
          return (
            goodTotal +
            BIO_KEYS.reduce((bioTotal, k) => {
              const count = this.stall[id].stock[rarity][k]
              if (count === 0) return bioTotal
              const worth = this.stall[id].worth[rarity][k]
              if (clearance && worth === 0) return bioTotal + count
              const avg = worth / count
              const fresh = avg < jam ? jam : avg
              const organicMul = k === 'organic' ? bioX : 1
              return bioTotal + count * fresh * x * rareX * saleX * organicMul
            }, 0)
          )
        }, 0)
      )
    }, 0)
  }

  private jamFloor(): number {
    const t = this.skillTier('jam')
    if (t === 0) return 0
    return JAM_FLOOR[t - 1]
  }

  sellAll(): void {
    this.commit({ a: Act.sellAll, t: this.now, p: this.local })
  }

  private sellAllBody(): void {
    if (!this.marketOpen()) return
    const gain = this.marketGain()
    if (gain === 0) return
    STALL_IDS.forEach(id => {
      RARITY_RANK.forEach(rarity => {
        this.stall[id].stock[rarity] = { organic: 0, synth: 0 }
        this.stall[id].worth[rarity] = { organic: 0, synth: 0 }
      })
      this.stall[id].acc = 0
    })
    this.money += gain
    this.sales = []
    this.emit('sold')
  }

  private retarget(slot: 0 | 1): void {
    STALL_IDS.forEach(id => {
      const g = this.stall[id]
      const x = stallX(id, this.modifiers)
      const u = this.rng.stream('market').at(goodIx(id), this.clock.day, slot)
      g.target = clamp(g.target * (0.75 + u * 0.5), 0.25 * x, 1.75 * x)
    })
  }

  gateProgress(id: ResearchId): number {
    const gate = RESEARCH[id].gate
    if (gate.kind === 'none') return 1
    return Math.min(1, (gate.kind === 'digs' ? this.digs : this.mines) / gate.n)
  }

  gateHave(id: ResearchId): number {
    const gate = RESEARCH[id].gate
    if (gate.kind === 'none') return 0
    return gate.kind === 'digs' ? this.digs : this.mines
  }

  researchOpen(id: ResearchId): boolean {
    return this.gateProgress(id) >= 1
  }

  startResearch(id: ResearchId): void {
    this.commit({ a: Act.startResearch, t: this.now, p: this.local, r: id })
  }

  private startResearchBody(id: ResearchId): void {
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

  private dismissRecapBody(): void {
    if (this.seam.kind !== 'recap') return
    this.grantPoint('player')
    this.grantPoint('husband')
    this.grantPoint('daughter')
    this.seam = { kind: 'play' }
    this.clock.banner = 2
    this.ping()
  }

  tick(rawDt: number): void {
    this.now += 1
    const dt = rawDt > DT_MAX ? DT_MAX : rawDt
    if (this.seam.kind === 'recap') return
    this.sales = []
    const t0 = this.clock.t
    const seam = this.clock.advance(dt) === 'seam'
    if (seam) {
      if (DYNAMIC_MARKET) this.retarget(1)
      this.seats.forEach(s => {
        s.workLeft = 0
        s.workTotal = 0
        s.filling = false
      })
      this.money += DAY_STIPEND
      const tax = this.tax()
      this.money -= tax
      this.tickTreesSeam()
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
        },
      }
      this.tally = { died: 0, harvests: 0, research: [] }
      this.ping()
      return
    }
    if (DYNAMIC_MARKET && t0 < 120 && this.clock.t >= 120) this.retarget(0)
    this.tickSpeech(dt)
    this.tickJob(dt)
    this.seats.forEach(s => {
      if (s.presence !== 'in') return
      this.act = s
      this.tickQueue(dt)
    })
    this.act = this.seats[this.local]
    this.tickField(dt)
    this.tickWater(dt)
    this.tickFreshness(dt)
    this.tickCompost(dt)
    this.tickMachines(dt)
    this.tickBig(dt)
    if (this.tickStall(dt) || this.sales.length > 0) this.ping()
  }

  private tickSpeech(dt: number): void {
    if (this.speech.kind !== 'say') return
    this.speech.left -= dt
    if (this.speech.left > 0) return
    this.speech = { kind: 'none' }
    this.pingFor('speech')
  }

  private tickJob(dt: number): void {
    if (this.job.kind === 'idle') return
    const cheat = this.cheatFastResearch ? 3 : 1
    this.job.left -= dt * (1 + 0.05 * this.skillTier('research-speed')) * cheat
    if (this.job.left > 0) return
    this.done.add(this.job.id)
    this.tally.research.push(this.job.id)
    this.job = { kind: 'idle' }
    this.ping()
  }

  private tickQueue(dt: number): void {
    if (this.act.workLeft > 0) {
      this.act.workLeft -= dt
      if (this.act.workLeft > 0) return
      this.finishWork()
      return
    }
    if (this.act.filling) {
      this.tickFill(dt)
      return
    }
    const next = this.act.queue[0]
    if (next === undefined) return
    const at = dest(next)
    if (!this.act.actor.inside(at)) {
      this.act.actor.walkToward(at, dt, this.walkSpeed())
      return
    }
    this.begin(next)
  }

  private begin(i: Intent): void {
    switch (i.act) {
      case 'walk':
        this.shiftHead()
        return
      case 'shovel':
        if (!this.canShovel(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(shovelTime(this, i.at))
        return
      case 'mine':
        if (!this.canMine(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(mineTime(this, i.at))
        return
      case 'plant':
        if (!this.canPlant(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.5)
        return
      case 'water':
        if (!this.canWater(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.4)
        return
      case 'fertilize':
        if (!this.canFertilize(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.6)
        return
      case 'compost':
        if (!this.canCompost(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.4)
        return
      case 'harvest':
        if (!this.canHarvest(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.5)
        return
      case 'pickup':
        this.doPickup(i.at)
        this.shiftHead()
        return
      case 'consign':
        this.doConsign()
        this.shiftHead()
        return
      case 'fill':
      case 'fillWell':
        if (i.act === 'fill' ? !this.canFill(i.at) : !this.canFillWell(i.edge)) {
          this.shiftHead()
          return
        }
        this.act.filling = true
        return
      case 'drop':
        this.doDrop(i.at)
        this.shiftHead()
        return
      case 'inventory':
        this.act.cue = { kind: 'inventory' }
        this.shiftHead()
        return
      case 'chest': {
        const c = this.cell(i.at)
        if (c.kind !== 'chest' && c.kind !== 'freezer') {
          this.shiftHead()
          return
        }
        // TODO 1.1 multiplayer guest chest swap
        if (this.act.id !== 0) {
          this.shiftHead()
          return
        }
        this.act.cue = { kind: 'chest', at: { ...i.at } }
        this.shiftHead()
        return
      }
      case 'grind':
        if (!this.canGrind(i.at)) {
          this.shiftHead()
          return
        }
        this.arm((GRIND_WORK * grindN(this.act.hand)) / this.machineMul())
        return
      case 'mill':
        if (!this.canMill(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.4)
        return
      case 'still':
        if (!this.canStill(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.4)
        return
      case 'barrel':
        if (!this.canBarrel(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.4)
        return
      case 'jam':
        if (!this.canJam(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(0.4)
        return
      case 'valve':
        this.arm(0.3 / this.machineMul())
        return
      case 'tend':
        if (!this.canTend(i.at)) {
          this.shiftHead()
          return
        }
        this.arm(TEND_WORK)
        return
    }
  }

  private arm(seconds: number): void {
    if (seconds <= 0) {
      this.finishWork()
      return
    }
    this.act.workLeft = seconds
    this.act.workTotal = seconds
  }

  private markWalk(i: Intent): void {
    if (this.act.actor.inside(dest(i))) return
    this.act.legStart = { x: this.act.actor.x, y: this.act.actor.y }
  }

  private shiftHead(): void {
    this.act.queue.shift()
    this.act.workLeft = 0
    this.act.workTotal = 0
    const next = this.act.queue[0]
    if (next !== undefined) this.markWalk(next)
    this.ping()
  }

  private finishWork(): void {
    const i = this.act.queue[0]
    if (i === undefined) return
    if (i.act === 'shovel') this.doShovel(i.at)
    if (i.act === 'mine') this.doMine(i.at)
    if (i.act === 'plant') this.doPlant(i.at)
    if (i.act === 'water' && this.doWater(i.at)) this.emit('poured')
    if (i.act === 'fertilize') this.doFertilize(i.at)
    if (i.act === 'compost') this.doCompost(i.at)
    if (i.act === 'harvest') this.doHarvest(i.at)
    if (i.act === 'grind') this.doGrind(i.at)
    if (i.act === 'mill') this.doMill(i.at)
    if (i.act === 'still') this.doStill(i.at)
    if (i.act === 'barrel') this.doBarrel(i.at)
    if (i.act === 'jam') this.doJam(i.at)
    if (i.act === 'valve') this.doValve(i.edge)
    if (i.act === 'tend') this.doTend(i.at)
    this.shiftHead()
  }

  private tickFill(dt: number): void {
    const head = this.act.queue[0]
    if (head === undefined || (head.act !== 'fill' && head.act !== 'fillWell')) {
      this.act.filling = false
      this.shiftHead()
      return
    }
    if (this.act.hand.kind !== 'hold' || this.act.hand.item.kind !== 'container') {
      this.act.filling = false
      this.shiftHead()
      return
    }
    const at = head.act === 'fill' ? head.at : head.stand
    let source: Pump | RainTank | Tap | undefined
    if (head.act === 'fill') {
      const c = this.cell(head.at)
      if (c.kind === 'pump' || c.kind === 'rain-tank' || c.kind === 'tap') source = c
    }
    const well = head.act === 'fillWell' ? this.wellAt(head.edge) : undefined
    if (source === undefined && well === undefined) {
      this.act.filling = false
      this.shiftHead()
      return
    }
    const c = this.act.hand.item
    const miss = c.capacityLiters - c.liters
    if (miss <= 0) {
      this.act.filling = false
      this.pulse = { text: 'Fill', at: { ...at } }
      this.shiftHead()
      return
    }
    const add =
      source !== undefined
        ? this.fillDraw(source, dt)
        : well !== undefined
          ? well.water.take(well.water.rate * dt)
          : 0
    c.liters = add >= miss ? c.capacityLiters : c.liters + add
    if (c.liters === c.capacityLiters) {
      this.act.filling = false
      this.pulse = { text: 'Fill', at: { ...at } }
      this.shiftHead()
    }
  }

  private canFillWell(e: Edge): boolean {
    if (this.act.hand.kind !== 'hold' || this.act.hand.item.kind !== 'container') return false
    return this.wellAt(e) !== undefined
  }

  private fillDraw(source: Pump | RainTank | Tap, dt: number): number {
    if (source.kind === 'tap') {
      const net = this.netOfCell(source.base)
      if (net === undefined) return 0
      const got = pull(net.sources, TAP_RATE * dt)
      source.drawn += got
      return got
    }
    return source.water.take(source.water.rate * dt)
  }

  private tickField(dt: number): void {
    let dirty = false
    const live = [...this.live.values()]
    for (let i = 0; i < live.length; i++) {
      const at = live[i]
      const c = this.cell(at)
      if (c.kind === 'tree') {
        if (this.tickTree(c, dt)) dirty = true
        continue
      }
      if (c.kind === 'turf') {
        const stage0 = c.turf.stage()
        c.soil.drink(GRASS_WATER_PER_SEC * dt)
        c.turf.maturity += dt / GRASS_GROW
        if (c.turf.maturity >= 1) {
          this.setCell(at, { kind: 'untilled', ground: 'soft', cover: { kind: 'grass', variant: c.turf.variant } })
          dirty = true
          continue
        }
        if (c.turf.stage() !== stage0) dirty = true
        continue
      }
      if (c.kind === 'weed') {
        const stage0 = c.weed.stage()
        c.soil.drink(WEED_WATER_PER_SEC * dt)
        c.soil.starve(WEED_FERT_PER_SEC * dt)
        const grown = c.weed.maturity + dt / WEED_GROW
        c.weed.maturity = grown > 1 ? 1 : grown
        if (c.weed.stage() !== stage0) dirty = true
        continue
      }
      if (c.kind !== 'growing' && c.kind !== 'ripe') continue
      const stage0 = c.plant.stage(c.kind)
      const st = c.plant.stats(this.modifiers)
      const mood0 = mood(c.soil, st)
      if (c.kind === 'growing') {
        c.soil.drink(st.waterUsePerSec * dt)
        c.soil.starve(PLANT_FERT_PER_SEC * dt)
        if (!c.soil.bio) c.plant.bio = false
        const water = waterBand(c.soil.water, st.waterTolerance)
        const fert = fertBand(c.soil.fertilizer, st.fertTolerance)
        const harm = age(c.plant, c.soil, water, fert, dt)
        if (harm.kind === 'hurt' && c.plant.happiness <= 0) {
          this.setCell(at, doomed(harm.by, c.soil, c.plant))
          this.tally.died += 1
          dirty = true
          continue
        }
        const stunt = (water === 'red' ? STUNT : 1) * (fert === 'red' ? STUNT : 1)
        c.plant.maturity += (dt * stunt) / st.growSeconds
        if (c.plant.maturity >= 1) {
          c.plant.maturity = 1
          c.plant.freshness = 1
          const key = `${at.col},${at.row}`
          const stored = this.ripenN.get(key)
          const n = stored === undefined ? 0 : stored
          const u = this.rng.stream('grow').at(at.col, at.row, this.clock.day, n)
          c.plant.rarity = rollGrowRarity(
            c.plant.rarity,
            c.plant.happiness,
            u,
            extraGrowUp1(c.plant.crop, id => this.hasSkill(id)),
          )
          this.ripenN.set(key, n + 1)
          this.setCell(at, { kind: 'ripe', soil: c.soil, plant: c.plant })
          dirty = true
          continue
        }
      }
      if (c.kind === 'ripe') {
        const bar0Fresh = c.plant.freshness < 0.8
        c.plant.freshness -= dt / st.rotSeconds
        if (c.plant.freshness <= 0) {
          this.setCell(at, { kind: 'rotten', soil: c.soil, crop: c.plant.crop })
          dirty = true
          continue
        }
        if (c.plant.freshness < 0.8 !== bar0Fresh) dirty = true
      }
      const now = this.cell(at)
      if (now.kind !== 'growing' && now.kind !== 'ripe') continue
      if (now.plant.stage(now.kind) !== stage0 || mood(now.soil, st) !== mood0) dirty = true
    }
    if (dirty) this.pingFor('field')
  }

  private tickWater(dt: number): void {
    this.sources().forEach(s => s.water.gather(dt))
    this.wells.forEach(w => w.water.gather(dt))
    this.grid().forEach(net => {
      const want = net.sprinklers.map(s => this.demand(s) * dt)
      const total = want.reduce((a, b) => a + b, 0)
      if (total === 0) return
      const got = pull(net.sources, total)
      if (got === 0) return
      net.sprinklers.forEach((s, i) => {
        const targets = this.sprinklerTargets(s)
        if (targets.length === 0) return
        const add = ((want[i] / total) * got) / targets.length
        targets.forEach(at => {
          const c = this.cell(at)
          if (c.kind !== 'growing') return
          c.soil.soak(add)
        })
      })
    })
  }

  private tickCompost(dt: number): void {
    let dirty = false
    for (const at of this.live.values()) {
      const c = this.cell(at)
      if (c.kind !== 'compost-box') continue
      if (c.base.col !== at.col || c.base.row !== at.row) continue
      if (c.units < COMPOST_NEED) continue
      c.progress += dt / COMPOST_SECONDS
      if (c.progress < 1) continue
      const spot = frontOf(at).find(p => this.inWorld(p) && isPlot(this.cell(p)))
      if (spot === undefined) continue
      c.progress = 0
      c.units -= COMPOST_NEED
      this.track(at, c)
      this.drops.push({ at: spot, item: makeCompost() })
      dirty = true
    }
    if (dirty) this.pingFor('field')
  }

  private tickFreshness(dt: number): void {
    const rot = (f: FruitStack) => {
      const next = f.freshness - dt / statsOf(f.crop, f.rarity, this.modifiers).rotSeconds
      f.freshness = next < 0 ? 0 : next
    }
    const slot = (s: Slot) => {
      if (s.kind !== 'hold') return
      if (s.item.kind === 'fruit') rot(s.item)
      if (s.item.kind === 'box' && s.item.cargo.kind === 'stack' && s.item.cargo.goods === 'fruit') {
        rot(s.item.cargo.stack)
      }
    }
    this.seats.forEach(s => {
      if (s.presence === 'away') return
      slot(s.hand)
      s.inventory.forEach(slot)
    })
    this.drops.forEach(d => slot({ kind: 'hold', item: d.item }))
    this.live.forEach(at => {
      const c = this.cell(at)
      if (c.kind === 'chest') c.slots.forEach(slot)
    })
  }

  private tickMachines(dt: number): void {
    let dirty = false
    for (const at of this.live.values()) {
      const c = this.cell(at)
      if (c.kind === 'mill') {
        if (c.base.col !== at.col || c.base.row !== at.row) continue
        if (c.recipe === 'none') continue
        const need = millNeed(c.recipe)
        if (c.units < need) continue
        c.progress += (dt * this.machineMul()) / MILL_WORK
        if (c.progress < 1) continue
        const spot = this.dropSpot(at)
        if (spot === undefined) continue
        c.progress = 0
        c.units -= need
        this.drops.push({ at: spot, item: millProduct(c.recipe) })
        if (c.units === 0) c.recipe = 'none'
        this.track(at, c)
        dirty = true
        continue
      }
      if (c.kind === 'jam') {
        if (c.base.col !== at.col || c.base.row !== at.row) continue
        if (c.crop === 'none' || c.fruit < JAM_IN || c.sugar < JAM_SUGAR) continue
        c.progress += (dt * this.machineMul()) / JAM_SECONDS
        if (c.progress < 1) continue
        const spot = this.dropSpot(at)
        if (spot === undefined) continue
        c.progress = 0
        c.fruit -= JAM_IN
        c.sugar -= JAM_SUGAR
        this.drops.push({ at: spot, item: { kind: 'jam', crop: c.crop, count: 1, unitSale: jamSale(c.crop) } })
        if (c.fruit === 0) c.crop = 'none'
        this.track(at, c)
        dirty = true
        continue
      }
      if (c.kind === 'still') {
        if (c.base.col !== at.col || c.base.row !== at.row) continue
        if (feedUnits(c.feed) !== STILL_CAP) continue
        if (c.progress === 0) {
          if (!this.pullStillWater(c)) continue
        }
        c.progress += dt / STILL_SECONDS
        if (c.progress < 1) continue
        const spot = this.dropSpot(at)
        if (spot === undefined) continue
        const kind = spiritKind(c.feed)
        const u = this.rng.stream('still').at(at.col, at.row, this.clock.day, c.n)
        const rarity = meanRarity(c.feed, u)
        this.drops.push({
          at: spot,
          item: { kind: 'spirit', spirit: kind, rarity, count: 1, unitSale: bakeSpiritSale(kind, rarity) },
        })
        c.feed = []
        c.progress = 0
        c.n += 1
        this.track(at, c)
        dirty = true
        continue
      }
      if (c.kind === 'barrel') {
        if (c.base.col !== at.col || c.base.row !== at.row) continue
        if (feedUnits(c.feed) !== BARREL_CAP) continue
        const was = c.age
        c.age += dt
        if (was < BARREL_MATURE && c.age >= BARREL_MATURE) {
          const u = this.rng.stream('barrel').at(at.col, at.row, this.clock.day, c.n)
          const rarity = meanRarity(c.feed, u)
          c.feed = [{ rarity, count: BARREL_CAP }]
          c.n += 1
        }
        this.track(at, c)
      }
    }
    if (dirty) this.pingFor('field')
  }

  private dropSpot(at: Coord): Coord | undefined {
    return frontOf(at).find(p => this.inWorld(p) && isPlot(this.cell(p)))
  }

  private pullStillWater(still: PotStill): boolean {
    const net = this.netOfCell(still.base)
    if (net === undefined) return false
    const held = net.sources.reduce((n, s) => n + s.stored, 0)
    if (held < STILL_WATER) return false
    pull(net.sources, STILL_WATER)
    return true
  }

  private tickBig(dt: number): void {
    this.bigAcc += dt
    if (this.bigAcc < BIG_TICK) return
    this.bigAcc -= BIG_TICK
    this.bigTicks += 1
    const weeds = this.sproutWeeds()
    const grass = this.sproutGrass()
    const vfx = this.tickVfx()
    if (weeds || grass || vfx) this.pingFor('big')
  }

  private tickVfx(): boolean {
    let changed = false
    this.vfx.forEach((_on, k) => {
      if (!this.sprinklers.has(k)) {
        this.vfx.delete(k)
        changed = true
      }
    })
    this.sprinklers.forEach((s, k) => {
      const now = this.rate(s.at) > 0
      if (this.vfx.get(k) !== now) {
        this.vfx.set(k, now)
        changed = true
      }
    })
    return changed
  }

  private sproutWeeds(): boolean {
    const fallow: Coord[] = []
    this.forEachCell((at, c) => {
      if (c.kind === 'empty') fallow.push(at)
    })
    let grew = false
    fallow.forEach(at => {
      const c = this.cell(at)
      if (c.kind !== 'empty') return
      if (this.rng.stream('weed').at(at.col, at.row, this.bigTicks) >= ramped(WEED_CHANCE, this.bigTicks)) return
      const variant = this.rng.stream('weed').at(at.col, at.row, this.bigTicks, 1) < 0.5 ? 0 : 1
      this.setCell(at, { kind: 'weed', soil: c.soil, weed: new Weed(variant) })
      grew = true
    })
    return grew
  }

  private sproutGrass(): boolean {
    if (this.rng.stream('grass').at(this.bigTicks) >= ramped(GRASS_CHANCE, this.bigTicks)) return false
    const b = this.bounds()
    for (let i = 0; i < 24; i++) {
      const col = b.col0 + Math.floor(this.rng.stream('grass').at(this.bigTicks, i, 0) * (b.col1 - b.col0))
      const row = b.row0 + Math.floor(this.rng.stream('grass').at(this.bigTicks, i, 1) * (b.row1 - b.row0))
      const at = { col, row }
      if (!this.inWorld(at)) continue
      const c = this.cell(at)
      if (c.kind !== 'untilled' || c.ground === 'very-hard' || c.cover.kind !== 'bare') continue
      if (onCell(this.drops, at).length > 0) continue
      const variant = Math.floor(this.rng.stream('grass').at(col, row, this.bigTicks) * 3) as 0 | 1 | 2
      this.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'grass', variant } })
      return true
    }
    return false
  }

  private freshSoil(at: Coord): Soil {
    return new Soil(SOIL_TILL_WATER, goodness(this.rng, at.col, at.row))
  }

  private tickTreesSeam(): void {
    this.forEachCell((at, c) => {
      if (c.kind !== 'tree') return
      if (c.base.col !== at.col || c.base.row !== at.row) return
      if (c.juvenile < 1) return
      this.advanceYield(c)
    })
  }

  private advanceYield(t: Tree): void {
    if (t.yield.kind === 'pending') {
      t.yield = { kind: 'on', daysLeft: 2 }
      return
    }
    if (t.yield.kind === 'on') {
      const left = (t.yield.daysLeft - 1) as 0 | 1
      t.yield = left === 0 ? { kind: 'off', chance: -0.2 } : { kind: 'on', daysLeft: left }
      return
    }
    const chance = t.yield.chance + 0.2
    const u = this.rng.stream('tree').at(t.base.col, t.base.row, this.clock.day)
    t.yield = u < chance ? { kind: 'on', daysLeft: 2 } : { kind: 'off', chance }
  }

  private tickTree(t: Tree, dt: number): boolean {
    if (t.juvenile < 1) {
      t.juvenile += dt / TREES[t.species].juvenileSeconds
      if (t.juvenile >= 1) {
        t.juvenile = 1
        t.yield = { kind: 'pending' }
        t.fruit = 0
      }
      return true
    }
    if (t.yield.kind === 'pending') return false
    const mul = t.yield.kind === 'on' ? TREE_YIELD_MUL : TREE_OFF_MUL
    t.fruit += dt / (TREES[t.species].fruitSeconds / mul)
    if (t.fruit < 1) return false
    if (!this.dropTreeFruit(t)) {
      t.fruit = 1
      return true
    }
    t.fruit = 0
    this.tally.harvests += 1
    return true
  }

  private dropTreeFruit(t: Tree): boolean {
    const below = { col: t.base.col, row: t.base.row + 1 }
    const seen = new Set<string>()
    const spots = [...frontOf({ col: t.base.col, row: t.base.row }), ...frontOf(below)]
    const hit = spots.find(p => {
      const k = `${p.col},${p.row}`
      if (seen.has(k)) return false
      seen.add(k)
      if (p.col === t.base.col && (p.row === t.base.row || p.row === t.base.row + 1)) return false
      if (!this.inWorld(p)) return false
      return isPlot(this.cell(p))
    })
    if (hit === undefined) return false
    const rarity = rollRarity(this.rng.stream('fruit').next())
    const sale = CROPS[t.species].sale * RARITY_SALE[rarity]
    this.drops.push({
      at: { ...hit },
      item: { kind: 'fruit', crop: t.species, rarity, count: 1, unitSale: sale, freshness: 1, bio: true },
    })
    return true
  }

  private saplingPair(at: Coord): Coord | undefined {
    const below = { col: at.col, row: at.row + 1 }
    if (!this.inWorld(below)) return undefined
    const a = this.cell(at)
    const b = this.cell(below)
    if (a.kind !== 'untilled' || b.kind !== 'untilled') return undefined
    if (a.ground !== 'soft' || b.ground !== 'soft') return undefined
    if (a.cover.kind === 'tile' || b.cover.kind === 'tile') return undefined
    return below
  }

  private canShovel(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold' || this.act.hand.item.kind !== 'shovel') return false
    const c = this.cell(at)
    if (c.kind === 'tree') return true
    if (!isPlot(c)) return false
    if (c.kind === 'infertile') return false
    if (c.kind === 'untilled' && c.ground === 'very-hard') return false
    if (c.kind === 'untilled' && c.ground === 'hard') return this.act.hand.item.usesLeft >= 2
    return true
  }

  private doShovel(at: Coord): void {
    if (!this.canShovel(at)) return
    const c = this.cell(at)
    const s = this.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'shovel' }> }
    if (c.kind === 'tree') {
      occupiedCells(c.base, this.owned).forEach(p => this.setCell(p, bare('soft')))
      this.drops.push({ at: { ...at }, item: { kind: 'sapling', tree: c.species } })
      s.item.usesLeft -= 1
      if (s.item.usesLeft <= 0) this.act.hand = { kind: 'empty' }
      this.pulse = { text: 'Dig', at: { ...at } }
      return
    }
    const text =
      c.kind === 'dead'
        ? 'Dig out dead plant'
        : c.kind === 'weed'
          ? 'Pull weed'
          : c.kind === 'growing' || c.kind === 'ripe'
            ? 'Dig up plant'
            : 'Dig'
    if (c.kind === 'growing' || c.kind === 'ripe') {
      this.drops.push({
        at: { ...at },
        item: { kind: 'seeds', crop: c.plant.crop, rarity: c.plant.rarity, count: 1 },
      })
    }
    this.setCell(at, { kind: 'empty', soil: isTilled(c) ? c.soil : this.freshSoil(at) })
    const cost = c.kind === 'untilled' && c.ground === 'hard' ? 2 : 1
    this.digs += 1
    s.item.usesLeft -= cost
    if (s.item.usesLeft <= 0) this.act.hand = { kind: 'empty' }
    this.pulse = { text, at: { ...at } }
  }

  private canMine(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold' || this.act.hand.item.kind !== 'pickaxe') return false
    const c = this.cell(at)
    if (c.kind === 'untilled' && c.ground === 'very-hard') return true
    if (c.kind !== 'rock') return false
    const n = occupiedCells(c.base, this.owned).length
    return n < 2 || this.act.hand.item.usesLeft >= 2
  }

  private doMine(at: Coord): void {
    if (!this.canMine(at)) return
    const c = this.cell(at)
    const s = this.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'pickaxe' }> }
    if (c.kind === 'untilled' && c.ground === 'very-hard') {
      this.setCell(at, { kind: 'infertile' })
      this.mines += 1
      s.item.usesLeft -= 1
      if (s.item.usesLeft <= 0) this.act.hand = { kind: 'empty' }
      this.pulse = { text: 'Mine', at: { ...at } }
      return
    }
    if (c.kind !== 'rock') return
    const n = occupiedCells(c.base, this.owned).length
    occupiedCells(c.base, this.owned).forEach(p => {
      this.setCell(p, bare('soft'))
    })
    this.mines += 1
    s.item.usesLeft -= n === 1 ? 1 : 2
    if (s.item.usesLeft <= 0) this.act.hand = { kind: 'empty' }
    this.pulse = { text: 'Mine', at: { ...at } }
  }

  private canPlant(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold') return false
    if (this.act.hand.item.kind === 'sapling') return this.saplingPair(at) !== undefined
    if (this.act.hand.item.kind !== 'seeds' && this.act.hand.item.kind !== 'grass-seeds') return false
    return this.cell(at).kind === 'empty'
  }

  private doPlant(at: Coord): void {
    if (!this.canPlant(at)) return
    if (this.act.hand.kind !== 'hold') return
    if (this.act.hand.item.kind === 'sapling') {
      const below = this.saplingPair(at)
      if (below === undefined) return
      const tree = new Tree(this.act.hand.item.tree, { shape: 'rect', col: at.col, row: at.row, w: 1, h: 2 })
      this.setCell(at, tree)
      this.setCell(below, tree)
      this.act.hand = { kind: 'empty' }
      this.pulse = { text: `Plant ${TREE_NAME[tree.species]}`, at: { ...at } }
      return
    }
    const bed = this.cell(at) as Extract<Plot, { kind: 'empty' }>
    if (this.act.hand.item.kind === 'grass-seeds') {
      const g = this.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'grass-seeds' }> }
      const variant = Math.floor(this.rng.stream('gen').at(3, at.col, at.row) * 3) as 0 | 1 | 2
      this.setCell(at, { kind: 'turf', soil: bed.soil, turf: new Turf(variant) })
      g.item.count -= 1
      if (g.item.count <= 0) this.act.hand = { kind: 'empty' }
      this.pulse = { text: 'Sow grass', at: { ...at } }
      this.compactInventory()
      this.ping()
      return
    }
    const s = this.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'seeds' }> }
    this.setCell(at, {
      kind: 'growing',
      soil: bed.soil,
      plant: new Plant(s.item.crop, s.item.rarity),
    })
    const crop = s.item.crop
    s.item.count -= 1
    if (s.item.count <= 0) this.act.hand = { kind: 'empty' }
    this.pulse = { text: `Plant ${crop}`, at: { ...at } }
  }

  private canWater(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold' || this.act.hand.item.kind !== 'container') return false
    if (this.act.hand.item.liters <= 0) return false
    return waterable(this.cell(at), this.modifiers)
  }

  private doWater(at: Coord): boolean {
    if (!this.canWater(at)) return false
    const c = this.cell(at) as Extract<Plot, { soil: Soil }>
    const bucket = this.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'container' }> }
    const need = pourTarget(c, this.modifiers) - c.soil.water
    const use = need > bucket.item.liters ? bucket.item.liters : need
    c.soil.soak(use)
    bucket.item.liters -= use
    this.pulse = { text: 'Water', at: { ...at } }
    return c.kind === 'growing' || c.kind === 'ripe'
  }

  private doValve(edge: Edge): void {
    this.toggleValve(edge)
  }

  private canFertilize(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold') return false
    const it = this.act.hand.item
    if (it.kind !== 'fertilizer' && it.kind !== 'synth' && it.kind !== 'compost') return false
    if (it.liters <= 0) return false
    const c = this.cell(at)
    return isTilled(c) && c.soil.fertilizer < FERT_PLOT_MAX
  }

  private doFertilize(at: Coord): void {
    if (!this.canFertilize(at)) return
    const c = this.cell(at) as Extract<Plot, { soil: Soil }>
    const bag = this.act.hand as { kind: 'hold'; item: Extract<Item, { kind: 'fertilizer' | 'synth' | 'compost' }> }
    const need = FERT_PLOT_MAX - c.soil.fertilizer
    const use = need > bag.item.liters ? bag.item.liters : need
    if (bag.item.kind === 'synth') c.soil.spike(use)
    else c.soil.feed(use)
    bag.item.liters -= use
    if (bag.item.liters <= 0) this.act.hand = { kind: 'empty' }
    this.pulse = { text: 'Fertilize', at: { ...at } }
  }

  private canCompost(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold') return false
    if (this.cell(at).kind !== 'compost-box') return false
    return organic(this.act.hand.item)
  }

  private doCompost(at: Coord): void {
    if (!this.canCompost(at)) return
    const box = this.cell(at) as CompostBox
    const held = this.act.hand as { kind: 'hold'; item: Item }
    box.units += compostValue(held.item)
    this.track(at, box)
    this.act.hand = { kind: 'empty' }
    this.pulse = { text: 'Compost', at: { ...at } }
  }

  canTend(at: Coord): boolean {
    if (!this.hasSkill('tending')) return false
    if (this.act.hand.kind !== 'empty') return false
    const c = this.cell(at)
    return c.kind === 'growing' && !c.plant.tended
  }

  private doTend(at: Coord): void {
    if (!this.canTend(at)) return
    const c = this.cell(at)
    if (c.kind !== 'growing') return
    c.plant.happiness += 0.1
    if (c.plant.happiness > HAPPY_MAX) c.plant.happiness = HAPPY_MAX
    c.plant.tended = true
    this.pulse = { text: 'Tend', at: { ...at } }
  }

  private canHarvest(at: Coord): boolean {
    const c = this.cell(at)
    if (c.kind !== 'ripe') return false
    if (this.act.hand.kind === 'empty') return true
    if (this.act.hand.item.kind !== 'box') return false
    return boxAccepts(this.act.hand.item, 'fruit', c.plant.crop, c.plant.rarity, 1) > 0
  }

  private doHarvest(at: Coord): void {
    if (!this.canHarvest(at)) return
    const c = this.cell(at)
    const bed = c as Extract<Plot, { kind: 'ripe' }>
    const p = bed.plant
    const picked = fruitStack(p.crop, p.rarity, 1, p.stats(this.modifiers).sale, p.freshness, p.bio)
    this.setCell(at, { kind: 'empty', soil: bed.soil })
    this.tally.harvests += 1
    this.pulse = { text: 'Harvest', at: { ...at } }
    if (this.act.hand.kind === 'empty') {
      this.act.hand = { kind: 'hold', item: { kind: 'fruit', ...picked } }
      return
    }
    if (this.act.hand.item.kind === 'box') boxAddFruit(this.act.hand.item, picked)
  }

  private canFill(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold' || this.act.hand.item.kind !== 'container') return false
    return fillable(this, at)
  }

  private doPickup(at: Coord): void {
    const i = topIndex(this.drops, at)
    if (i < 0) {
      if (this.act.hand.kind !== 'empty') return
      const c = this.cell(at)
      if (c.kind === 'weed') {
        this.setCell(at, { kind: 'empty', soil: c.soil })
        this.act.hand = { kind: 'hold', item: { kind: 'weed', count: 1 } }
      } else if (c.kind === 'untilled' && c.cover.kind === 'grass') {
        this.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'bare' } })
        this.act.hand = { kind: 'hold', item: { kind: 'grass', count: 1 } }
      } else return
      this.pulse = { text: 'Pick up', at: { ...at } }
      return
    }
    const taken = this.drops[i].item
    if (this.act.hand.kind === 'hold' && this.act.hand.item.kind === 'box') {
      if (taken.kind === 'seeds') {
        const n = boxAdd(this.act.hand.item, 'seeds', taken.crop, taken.rarity, taken.count)
        if (n === taken.count) {
          this.drops.splice(i, 1)
          this.pulse = { text: 'Pick up', at: { ...at } }
          return
        }
        if (n > 0) {
          taken.count -= n
          this.pulse = { text: 'Pick up', at: { ...at } }
          return
        }
      }
      if (taken.kind === 'fruit') {
        const n = boxAddFruit(this.act.hand.item, taken)
        if (n === taken.count) {
          this.drops.splice(i, 1)
          this.pulse = { text: 'Pick up', at: { ...at } }
          return
        }
        if (n > 0) {
          taken.count -= n
          this.pulse = { text: 'Pick up', at: { ...at } }
          return
        }
      }
    }
    this.drops.splice(i, 1)
    if (this.act.hand.kind === 'empty') {
      this.act.hand = { kind: 'hold', item: taken }
      this.pulse = { text: 'Pick up', at: { ...at } }
      return
    }
    this.drops.push({ at: { ...at }, item: this.act.hand.item })
    this.act.hand = { kind: 'hold', item: taken }
    this.pulse = { text: 'Pick up', at: { ...at } }
  }

  private doDrop(at: Coord): void {
    if (this.act.hand.kind !== 'hold') return
    if (!isPlot(this.cell(at))) return
    this.drops.push({ at: { ...at }, item: this.act.hand.item })
    this.act.hand = { kind: 'empty' }
  }

  private doConsign(): void {
    if (this.act.hand.kind !== 'hold') return
    const item = this.act.hand.item
    if (item.kind === 'fruit') {
      this.stall[item.crop].take(item.rarity, item.count, freshMul(item.freshness), item.bio)
      this.act.hand = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.kind === 'sugar') {
      this.stall.sugar.takeSugar(item.liters, item.unitSale)
      this.act.hand = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.kind === 'spirit') {
      this.stall[item.spirit].takeSpirit(item.rarity, item.count, item.unitSale)
      this.act.hand = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.kind === 'wine') {
      this.stall.wine.takeSpirit(item.rarity, item.count, item.unitSale)
      this.act.hand = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.kind === 'jam') {
      this.stall[`jam-${item.crop}`].takeBaked(item.count, item.unitSale)
      this.act.hand = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.kind === 'oil' || item.kind === 'flour' || item.kind === 'extract') {
      this.stall[item.kind].takeBaked(item.count, item.unitSale)
      this.act.hand = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.kind !== 'box') return
    if (item.cargo.kind === 'stack' && item.cargo.goods === 'fruit') {
      const cargo = item.cargo.stack
      this.stall[cargo.crop].take(cargo.rarity, cargo.count, freshMul(cargo.freshness), cargo.bio)
      item.cargo = { kind: 'empty' }
      this.completeConsign()
    }
  }

  private completeConsign(): void {
    this.consignRevision += 1
    this.pulse = { text: 'Drop off', at: { ...PAD } }
  }

  private tickStall(dt: number): boolean {
    if (!DYNAMIC_MARKET) return false
    let changed = false
    this.mktAcc += dt
    while (this.mktAcc >= 10) {
      this.mktAcc -= 10
      STALL_IDS.forEach(id => {
        const g = this.stall[id]
        const current = tenths(g.market)
        const target = tenths(g.target)
        if (current < target) {
          g.market = (current + 1) / 10
          changed = true
        }
        if (current > target) {
          g.market = (current - 1) / 10
          changed = true
        }
      })
    }
    STALL_IDS.forEach(id => {
      const g = this.stall[id]
      if (binCount(g) === 0) {
        g.acc = 0
        return
      }
      g.acc += stallRate(g.offered, g.market) * dt
      while (g.acc >= 1 && binCount(g) > 0) {
        const rarity = RARITY_RANK.find(r => g.stock[r].organic + g.stock[r].synth > 0) as Rarity
        const k = g.stock[rarity].organic > 0 ? 'organic' : 'synth'
        const fresh = g.worth[rarity][k] / g.stock[rarity][k]
        g.stock[rarity][k] -= 1
        g.worth[rarity][k] -= fresh
        const money = g.offered * RARITY_SALE[rarity] * fresh
        this.money += money
        this.sales.push({ good: id, rarity, money })
        g.acc -= 1
        changed = true
      }
    })
    return changed
  }

  private canMill(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold') return false
    const c = this.cell(at)
    if (c.kind !== 'mill') return false
    const recipe = millRecipeOf(this.act.hand.item)
    if (recipe === undefined) return false
    if (c.recipe !== 'none' && c.recipe !== recipe) return false
    return millDumpUnits(this.act.hand.item, recipe) > 0
  }

  private doMill(at: Coord): void {
    if (!this.canMill(at)) return
    if (this.act.hand.kind !== 'hold') return
    const mill = this.cell(at) as Mill
    const recipe = millRecipeOf(this.act.hand.item)
    if (recipe === undefined) return
    const n = millDumpUnits(this.act.hand.item, recipe)
    if (n <= 0) return
    if (mill.recipe === 'none') mill.recipe = recipe
    mill.units += n
    this.takeHandCount(n)
    this.track(at, mill)
    this.pulse = { text: millProductName(recipe) === 'sugar' ? 'Crush into sugar' : `Crush into ${millProductName(recipe)}`, at: { ...at } }
  }

  private canStill(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold') return false
    const c = this.cell(at)
    if (c.kind !== 'still') return false
    const crop = stillCropOf(this.act.hand.item)
    if (crop === undefined) return false
    const room = STILL_CAP - feedUnits(c.feed)
    return room > 0 && fruitCount(this.act.hand.item) > 0
  }

  private doStill(at: Coord): void {
    if (!this.canStill(at)) return
    if (this.act.hand.kind !== 'hold') return
    const still = this.cell(at) as PotStill
    const crop = stillCropOf(this.act.hand.item)
    const rarity = fruitRarity(this.act.hand.item)
    if (crop === undefined || rarity === undefined) return
    const room = STILL_CAP - feedUnits(still.feed)
    const n = Math.min(room, fruitCount(this.act.hand.item))
    if (n <= 0) return
    addStillFeed(still.feed, crop, rarity, n)
    this.takeHandCount(n)
    this.track(at, still)
    this.pulse = { text: 'Distill', at: { ...at } }
  }

  private canBarrelCollect(at: Coord): boolean {
    const c = this.cell(at)
    if (c.kind !== 'barrel') return false
    if (feedUnits(c.feed) !== BARREL_CAP || c.age < BARREL_MATURE) return false
    if (this.act.hand.kind === 'empty') return true
    if (this.act.hand.item.kind !== 'wine') return false
    return this.act.hand.item.rarity === c.feed[0].rarity
  }

  private canBarrel(at: Coord): boolean {
    if (this.canBarrelCollect(at)) return true
    if (this.act.hand.kind !== 'hold') return false
    const c = this.cell(at)
    if (c.kind !== 'barrel') return false
    if (fruitCrop(this.act.hand.item) !== 'grape') return false
    const room = BARREL_CAP - feedUnits(c.feed)
    return room > 0 && fruitCount(this.act.hand.item) > 0
  }

  private doBarrel(at: Coord): void {
    if (this.canBarrelCollect(at)) {
      const barrel = this.cell(at) as WineBarrel
      const rarity = barrel.feed[0].rarity
      const wine: Item = {
        kind: 'wine',
        rarity,
        count: 1,
        unitSale: bakeWineSale(rarity, barrel.age),
      }
      if (this.act.hand.kind === 'empty') this.act.hand = { kind: 'hold', item: wine }
      else if (this.act.hand.item.kind === 'wine') {
        const it = this.act.hand.item
        it.unitSale = mergeUnitSale(it, wine)
        it.count += 1
      }
      barrel.feed = []
      barrel.age = 0
      this.track(at, barrel)
      this.pulse = { text: 'Collect wine', at: { ...at } }
      return
    }
    if (!this.canBarrel(at)) return
    if (this.act.hand.kind !== 'hold') return
    const barrel = this.cell(at) as WineBarrel
    const rarity = fruitRarity(this.act.hand.item)
    if (rarity === undefined) return
    const room = BARREL_CAP - feedUnits(barrel.feed)
    const n = Math.min(room, fruitCount(this.act.hand.item))
    if (n <= 0) return
    addBarrelFeed(barrel.feed, rarity, n)
    this.takeHandCount(n)
    this.track(at, barrel)
    this.pulse = { text: 'Fill barrel', at: { ...at } }
  }

  private canJam(at: Coord): boolean {
    if (this.act.hand.kind !== 'hold') return false
    const c = this.cell(at)
    if (c.kind !== 'jam') return false
    const it = this.act.hand.item
    if (it.kind === 'sugar') return it.liters > 0 && c.sugar < JAM_BUFFER
    const crop = jamCropOf(it)
    if (crop === undefined) return false
    if (c.crop !== 'none' && c.crop !== crop) return false
    return fruitCount(it) > 0
  }

  private doJam(at: Coord): void {
    if (!this.canJam(at)) return
    if (this.act.hand.kind !== 'hold') return
    const jam = this.cell(at) as JamMachine
    const it = this.act.hand.item
    if (it.kind === 'sugar') {
      const room = JAM_BUFFER - jam.sugar
      const take = it.liters < room ? it.liters : room
      if (take <= 0) return
      jam.sugar += take
      it.liters -= take
      if (it.liters <= 0) this.act.hand = { kind: 'empty' }
      this.track(at, jam)
      this.pulse = { text: 'Fill sugar', at: { ...at } }
      return
    }
    const crop = jamCropOf(it)
    if (crop === undefined) return
    const n = fruitCount(it)
    if (jam.crop === 'none') jam.crop = crop
    jam.fruit += n
    this.takeHandCount(n)
    this.track(at, jam)
    this.pulse = { text: crop === 'tomato' ? 'Make ketchup' : 'Make jam', at: { ...at } }
  }

  private takeHandCount(n: number): void {
    if (this.act.hand.kind !== 'hold') return
    const it = this.act.hand.item
    if (it.kind === 'fruit' || it.kind === 'grass') {
      it.count -= n
      if (it.count <= 0) this.act.hand = { kind: 'empty' }
      return
    }
    if (it.kind === 'box' && it.cargo.kind === 'stack') {
      it.cargo.stack.count -= n
      if (it.cargo.stack.count <= 0) it.cargo = { kind: 'empty' }
    }
  }

  private canFitSugar(): boolean {
    return this.act.inventory.some(s => s.kind === 'empty' || (s.kind === 'hold' && s.item.kind === 'sugar'))
  }

  private putSugar(item: Extract<Item, { kind: 'sugar' }>): void {
    const merge = this.act.inventory.findIndex(s => s.kind === 'hold' && s.item.kind === 'sugar')
    if (merge >= 0) {
      const slot = this.act.inventory[merge]
      if (slot.kind === 'hold' && slot.item.kind === 'sugar') {
        const m = mergeSugar(slot.item, item)
        slot.item.liters = m.liters
        slot.item.capacityLiters = m.capacityLiters
        slot.item.unitSale = m.unitSale
      }
      return
    }
    const empty = this.act.inventory.findIndex(s => s.kind === 'empty')
    this.act.inventory[empty] = { kind: 'hold', item }
  }

  private canGrind(at: Coord): boolean {
    return this.cell(at).kind === 'grinder' && grindN(this.act.hand) > 0
  }

  private doGrind(at: Coord): void {
    if (!this.canGrind(at)) return
    if (this.act.hand.kind !== 'hold') return
    const n = grindN(this.act.hand)
    let crop
    let rarity
    if (this.act.hand.item.kind === 'fruit') {
      crop = this.act.hand.item.crop
      rarity = this.act.hand.item.rarity
      this.act.hand.item.count -= 1
      if (this.act.hand.item.count <= 0) this.act.hand = { kind: 'empty' }
    } else if (
      this.act.hand.item.kind === 'box' &&
      this.act.hand.item.cargo.kind === 'stack' &&
      this.act.hand.item.cargo.goods === 'fruit'
    ) {
      crop = this.act.hand.item.cargo.stack.crop
      rarity = this.act.hand.item.cargo.stack.rarity
      this.act.hand.item.cargo = { kind: 'empty' }
    } else return
    let total = 0
    for (let i = 0; i < n; i++) {
      const u = this.rng.stream('grind').at(at.col, at.row, this.clock.day, i)
      total += GRIND_MIN + Math.floor(u * (GRIND_MAX - GRIND_MIN + 1))
    }
    this.mergeSeeds(crop, rarity, total, at)
    this.pulse = { text: 'Grind', at: { ...at } }
  }

  private mergeSeeds(crop: CropId, rarity: Rarity, count: number, at: Coord): void {
    if (!isAnnualId(crop)) return
    const merge = this.act.inventory.findIndex(
      s =>
        s.kind === 'hold' &&
        s.item.kind === 'seeds' &&
        s.item.crop === crop &&
        s.item.rarity === rarity,
    )
    if (merge >= 0) {
      const slot = this.act.inventory[merge]
      if (slot.kind === 'hold' && slot.item.kind === 'seeds') slot.item.count += count
      this.compactInventory()
      return
    }
    const empty = this.act.inventory.findIndex(s => s.kind === 'empty')
    if (empty >= 0) {
      this.act.inventory[empty] = { kind: 'hold', item: { kind: 'seeds', crop, rarity, count } }
      this.compactInventory()
      return
    }
    this.drops.push({ at: { ...at }, item: { kind: 'seeds', crop, rarity, count } })
  }

  private maybeSay(at: Coord): void {
    if (usesLeftBlocked(this, at)) return
    if (emptyBucketBlocked(this, at)) return
    const action = primaryAct(this.cell(at))
    if (action === undefined) return
    this.say(`I cannot use this ${toolName(this.act.hand)} to ${action}`)
  }
}

function usesLeftBlocked(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold') return false
  const cell = w.cell(at)
  if (w.act.hand.item.kind === 'shovel' && cell.kind === 'untilled' && cell.ground === 'hard' && w.act.hand.item.usesLeft < 2) {
    return true
  }
  if (w.act.hand.item.kind === 'pickaxe' && cell.kind === 'rock') {
    const n = cell.base.w * cell.base.h
    if (n > 1 && w.act.hand.item.usesLeft < 2) return true
  }
  return false
}

function emptyBucketBlocked(w: World, at: Coord): boolean {
  if (w.act.hand.kind !== 'hold' || w.act.hand.item.kind !== 'container' || w.act.hand.item.liters > 0) return false
  return waterable(w.cell(at), w.modifiers)
}

export function fillable(w: World, at: Coord): boolean {
  const c = w.cell(at)
  if (c.kind === 'pump' || c.kind === 'rain-tank') return true
  if (c.kind !== 'tap') return false
  const net = w.netOfCell(c.base)
  return net !== undefined && net.sources.length > 0
}

export function pourTarget(c: Extract<Plot, { soil: Soil }>, mods: readonly Modifier[]): number {
  if (c.kind !== 'growing' && c.kind !== 'ripe') return SOIL_WATER_MID
  return SOIL_WATER_MID + c.plant.stats(mods).waterTolerance
}

export function waterable(c: Cell, mods: readonly Modifier[]): boolean {
  if (c.kind !== 'empty' && c.kind !== 'weed' && c.kind !== 'growing' && c.kind !== 'ripe') return false
  return c.soil.water < pourTarget(c, mods)
}

type Harm = { kind: 'none' } | { kind: 'hurt'; by: Doom }

function age(plant: Plant, soil: Soil, water: Band, fert: Band, dt: number): Harm {
  let harm: Harm = { kind: 'none' }
  if (fert === 'red') {
    plant.happiness -= dt / HAPPY_STARVE_SECONDS
    harm = { kind: 'hurt', by: 'starve' }
  }
  if (water === 'red') {
    const by: Doom = soil.drowning ? 'drown' : 'wilt'
    plant.happiness -= dt / (by === 'drown' ? HAPPY_DROWN_SECONDS : HAPPY_WILT_SECONDS)
    harm = { kind: 'hurt', by }
  }
  if (harm.kind === 'none') {
    if (fert === 'green') plant.happiness += dt / HAPPY_GAIN_SECONDS
    if (water === 'green') plant.happiness += dt / HAPPY_GAIN_SECONDS
  }
  plant.happiness = plant.happiness < 0 ? 0 : plant.happiness > HAPPY_MAX ? HAPPY_MAX : plant.happiness
  return harm
}

function doomed(by: Doom, soil: Soil, plant: Plant): Plot {
  if (by === 'drown') return { kind: 'rotten', soil, crop: plant.crop }
  return { kind: 'dead', soil, plant }
}

export function mood(soil: Soil, st: Stats): string {
  return `${waterBand(soil.water, st.waterTolerance)}-${fertBand(soil.fertilizer, st.fertTolerance)}`
}

function primaryAct(cell: Cell): string | undefined {
  if (cell.kind === 'ripe') return 'harvest'
  if (cell.kind === 'growing') return 'water'
  if (cell.kind === 'weed') return 'dig'
  if (cell.kind === 'empty') return 'plant'
  if (cell.kind === 'untilled' && cell.ground === 'very-hard') return 'mine'
  if (cell.kind === 'untilled') return 'dig'
  if (cell.kind === 'infertile') return 'plant'
  if (cell.kind === 'rock') return 'mine'
  if (cell.kind === 'pump') return 'fill'
  if (cell.kind === 'grinder') return 'grind'
  if (cell.kind === 'compost-box') return 'compost'
  if (cell.kind === 'chest') return 'open'
  if (cell.kind === 'house') return 'inventory'
  if (cell.kind === 'dead') return 'dig'
  if (cell.kind === 'rotten') return 'dig'
  return undefined
}

function shovelTime(w: World, at: Coord): number {
  const s = (w.act.hand as { item: Extract<Item, { kind: 'shovel' }> }).item
  const c = w.cell(at)
  if (c.kind === 'untilled' && c.ground === 'hard') return s.workSeconds * 2
  return s.workSeconds
}

function mineTime(w: World, at: Coord): number {
  const p = (w.act.hand as { item: Extract<Item, { kind: 'pickaxe' }> }).item
  const c = w.cell(at)
  if (c.kind !== 'rock') return p.workSeconds
  const n = occupiedCells(c.base, w.owned).length
  return n === 1 ? p.workSeconds : p.workSeconds * 2
}

function sprinklerSku(s: Sprinkler): SkuId {
  if (s.variant === 'basic') return 'buy-sprinkler'
  if (s.variant === 'vert') return 'buy-sprinkler-vert'
  return 'buy-sprinkler-large'
}

function emptyMember<Id extends SkillId>(): MemberState<Id> {
  return { points: 0, pickCount: 0, owned: new Map(), offers: [] }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function compactSlots(slots: Slot[]): void {
  const kept: Slot[] = []
  slots.forEach(slot => {
    if (slot.kind === 'empty') return
    if (slot.item.kind === 'seeds' || slot.item.kind === 'fruit') {
      const kind = slot.item.kind
      const crop = slot.item.crop
      const rarity = slot.item.rarity
      const hit = kept.find(
        s =>
          s.kind === 'hold' &&
          s.item.kind === kind &&
          (s.item.kind === 'seeds' || s.item.kind === 'fruit') &&
          s.item.crop === crop &&
          s.item.rarity === rarity,
      )
      if (hit !== undefined && hit.kind === 'hold' && (hit.item.kind === 'seeds' || hit.item.kind === 'fruit')) {
        if (hit.item.kind === 'fruit' && slot.item.kind === 'fruit') {
          hit.item.unitSale = mergeUnitSale(hit.item, slot.item)
          hit.item.freshness = mergeFreshness(hit.item, slot.item)
          hit.item.bio = hit.item.bio && slot.item.bio
        }
        hit.item.count += slot.item.count
        return
      }
    }
    if (slot.item.kind === 'sugar') {
      const hit = kept.find(s => s.kind === 'hold' && s.item.kind === 'sugar')
      if (hit !== undefined && hit.kind === 'hold' && hit.item.kind === 'sugar') {
        const m = mergeSugar(hit.item, slot.item)
        hit.item.liters = m.liters
        hit.item.capacityLiters = m.capacityLiters
        hit.item.unitSale = m.unitSale
        return
      }
    }
    if (
      slot.item.kind === 'spirit' ||
      slot.item.kind === 'wine' ||
      slot.item.kind === 'jam' ||
      slot.item.kind === 'oil' ||
      slot.item.kind === 'flour' ||
      slot.item.kind === 'extract'
    ) {
      const it = slot.item
      const hit = kept.find(
        s =>
          s.kind === 'hold' &&
          s.item.kind === it.kind &&
          (it.kind !== 'spirit' || (s.item.kind === 'spirit' && s.item.spirit === it.spirit && s.item.rarity === it.rarity)) &&
          (it.kind !== 'wine' || (s.item.kind === 'wine' && s.item.rarity === it.rarity)) &&
          (it.kind !== 'jam' || (s.item.kind === 'jam' && s.item.crop === it.crop)),
      )
      if (hit !== undefined && hit.kind === 'hold' && 'count' in hit.item && 'unitSale' in hit.item && 'count' in it) {
        hit.item.unitSale = mergeUnitSale(hit.item, it)
        hit.item.count += it.count
        return
      }
    }
    if (slot.item.kind === 'rotten' || slot.item.kind === 'dead') {
      const kind = slot.item.kind
      const cls = slot.item.cls
      const hit = kept.find(
        s =>
          s.kind === 'hold' &&
          s.item.kind === kind &&
          (s.item.kind === 'rotten' || s.item.kind === 'dead') &&
          s.item.cls === cls,
      )
      if (hit !== undefined && hit.kind === 'hold' && (hit.item.kind === 'rotten' || hit.item.kind === 'dead')) {
        hit.item.count += slot.item.count
        return
      }
    }
    if (slot.item.kind === 'weed' || slot.item.kind === 'grass') {
      const kind = slot.item.kind
      const hit = kept.find(s => s.kind === 'hold' && s.item.kind === kind)
      if (hit !== undefined && hit.kind === 'hold' && (hit.item.kind === 'weed' || hit.item.kind === 'grass')) {
        hit.item.count += slot.item.count
        return
      }
    }
    kept.push(slot)
  })
  kept.forEach((s, i) => {
    slots[i] = s
  })
  for (let i = kept.length; i < slots.length; i++) slots[i] = { kind: 'empty' }
}
