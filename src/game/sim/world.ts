import {
  COMPOST_NEED,
  COMPOST_SECONDS,
  CONTAINERS,
  GRIND_MAX,
  GRIND_MIN,
  GRIND_WORK,
  SPEECH_S,
  SHRUB_GROW,
  SPRINKLER_TILE_RATE,
} from '../defs/items.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { JAM_FLOOR, SKILLS, TEND_WORK, skillIds, type SkillDef } from '../defs/skills.ts'
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
  type Rarity,
} from '../defs/rarity.ts'
import type {
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
  Grinder,
  HOUSE_BASE,
  House,
  PAD,
  PUMP_BASE,
  Pump,
  RainTank,
  Shrub,
  Tap,
  TRUCK_BASE,
  Truck,
  chunkKey,
  chunkOf,
  chunkRect,
  frontOf,
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
  BIO_KEYS,
  binCount,
  goodIx,
  makeStall,
  rate as stallRate,
  stallX,
  tenths,
  STALL_IDS,
  type StallMap,
  type StallSale,
} from './stall.ts'
import { statsOf, type Modifier, type Stats } from './modifiers.ts'
import { goodness } from './noise.ts'
import { Plant, Weed, type Doom } from './plant.ts'
import { bare, isPlot, isTileSite, isTilled, type Cell, type Plot } from './plot.ts'
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
  type Prompt,
  type PromptHit,
} from './prompt.ts'
import { hash, rollRarity } from './rng.ts'

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
  | { act: 'grind'; at: Coord }
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
  | 'Valve'
  | 'Tend'

export type Cue = { kind: 'none' } | { kind: 'inventory' } | { kind: 'chest'; at: Coord }

export type Speech = { kind: 'none' } | { kind: 'say'; text: string; left: number }

export type Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
  | { kind: 'delete' }

export type StayArmed =
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'delete'

export type Pulse = { text: string; at: Coord }

export type Net = { sources: Reservoir[]; sprinklers: Sprinkler[]; taps: Tap[] }

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

type Job = { kind: 'idle' } | { kind: 'run'; id: ResearchId; left: number }

export const DAY_STIPEND = 10

const QUEUE_CAP = 8
export const DT_MAX = 1 / 15
const INV = 16
const DYNAMIC_MARKET = false

function groundSig(c: Cell): string {
  if (c.kind === 'untilled') return `${c.ground}:${c.cover !== undefined && c.cover.kind === 'tile' ? c.cover.tile : '-'}`
  if (c.kind === 'infertile') return 'vh'
  return '.'
}

export function dest(i: Intent): Coord {
  if (i.act === 'fill') return i.at
  if (i.act === 'consign') return { ...PAD }
  if (i.act === 'inventory') return { ...DOOR }
  return i.at
}

export class World {
  seed: number
  purchases = 0
  readonly owned: ChunkId[] = [{ cx: 0, cy: 0 }]
  readonly pumps: Pump[]
  readonly tanks: RainTank[] = []
  readonly taps: Tap[] = []
  readonly segments = new Map<string, Segment>()
  readonly sprinklers = new Map<string, Sprinkler>()
  readonly netVerts = new Set<string>()
  readonly house: House
  readonly truck: Truck
  readonly stall: StallMap
  readonly family: Family
  sales: StallSale[] = []
  consignRevision = 0
  readonly actor: Actor
  readonly clock = new Clock()
  readonly drops: Drop[] = []
  readonly queue: Intent[] = []
  readonly modifiers: Modifier[] = []
  readonly done = new Set<ResearchId>()
  readonly inventory: Slot[] = Array.from({ length: INV }, (): Slot => ({ kind: 'empty' }))
  hand: Hand = { kind: 'hold', item: makeShovel('shovel') }
  money = 50
  job: Job = { kind: 'idle' }
  place: Place = { kind: 'none' }
  cue: Cue = { kind: 'none' }
  speech: Speech = { kind: 'none' }
  pulse: Pulse | undefined = undefined
  hud: HudTarget | undefined = undefined
  tally: DayTally = { died: 0, harvests: 0, research: [] }
  seam: Seam = { kind: 'play' }
  groundRev = 0
  legStart = { x: DOOR.col + 0.5, y: DOOR.row + 0.5 }
  workTotal = 0
  bigTicks = 0
  private workLeft = 0
  private filling = false
  private mktAcc = 0
  private bigAcc = 0
  private nets: Net[] | undefined = undefined
  private netAt = new Map<string, Net>()
  private readonly chunks = new Map<string, Cell[][]>()
  private readonly live = new Map<string, Coord>()
  private readonly vfx = new Map<string, boolean>()
  private readonly subs = new Set<() => void>()

  constructor(seed?: number) {
    this.seed = seed === undefined ? (Math.random() * 0x100000000) >>> 0 : seed
    this.house = new House(HOUSE_BASE, DOOR)
    this.truck = new Truck(TRUCK_BASE)
    this.pumps = [new Pump(PUMP_BASE, 'starter')]
    this.stall = {
      carrot: makeStall('carrot', this.modifiers),
      potato: makeStall('potato', this.modifiers),
      wheat: makeStall('wheat', this.modifiers),
      tomato: makeStall('tomato', this.modifiers),
      raspberry: makeStall('raspberry', this.modifiers),
      watermelon: makeStall('watermelon', this.modifiers),
      apple: makeStall('apple', this.modifiers),
      berry: makeStall('berry', this.modifiers),
    }
    this.family = {
      player: emptyMember(),
      husband: emptyMember(),
      daughter: emptyMember(),
    }
    this.rerollOffers('player')
    this.rerollOffers('husband')
    this.rerollOffers('daughter')
    this.chunks.set(chunkKey(this.owned[0]), generateChunk(this.seed, this.owned[0], this.house, this.pumps[0], this.truck))
    this.actor = new Actor(DOOR.col + 0.5, DOOR.row + 0.5)
    this.inventory[0] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 5 } }
    this.inventory[1] = {
      kind: 'hold',
      item: { kind: 'seeds', crop: 'carrot', rarity: 'rare', count: 2 },
    }
    this.inventory[2] = {
      kind: 'hold',
      item: { kind: 'seeds', crop: 'tomato', rarity: 'rare', count: 2 },
    }
    this.inventory[3] = {
      kind: 'hold',
      item: { kind: 'seeds', crop: 'potato', rarity: 'heirloom', count: 2 },
    }
    this.drops.push({ at: { ...DOOR }, item: makeContainer('bucket', CONTAINERS.bucket.capacityLiters) })
    this.indexAll()
  }

  get pump(): Pump {
    return this.pumps[0]
  }

  on(fn: () => void): () => void {
    this.subs.add(fn)
    return () => {
      this.subs.delete(fn)
    }
  }

  private ping(): void {
    this.subs.forEach(f => f())
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
      cell.kind === 'chest' ||
      cell.kind === 'compost-box' ||
      ((cell.kind === 'shrub' || cell.kind === 'apple-tree') && !cell.ripe)
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
      const u = hash(this.seed, member, st.pickCount, i)
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
    if (def.gate.kind === 'skill') return this.hasSkill('open-late')
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
    if (!this.done.has('unlock-expand')) return
    if (this.owned.some(c => c.cx === id.cx && c.cy === id.cy)) return
    if (!this.owned.some(c => Math.abs(c.cx - id.cx) + Math.abs(c.cy - id.cy) === 1)) return
    const price = this.expandPrice()
    if (this.money < price) return
    this.money -= price
    this.owned.push(id)
    this.purchases += 1
    this.dirtyNets()
    this.chunks.set(chunkKey(id), generateChunk(this.seed, id, this.house, this.pumps[0], this.truck))
    this.indexAll()
    this.ping()
  }

  skuOpen(id: SkuId): boolean {
    const u = SKUS[id].unlock
    return u === 'start' || this.done.has(u)
  }

  skuShown(id: SkuId): boolean {
    const s = SKUS[id].show
    return s === 'start' || this.done.has(s)
  }

  researchShown(id: ResearchId): boolean {
    const r = RESEARCH[id].reveal
    return r === 'start' || this.done.has(r)
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
    if (this.place.kind !== 'sku') return
    const id = this.place.id
    if (id !== 'buy-pipe' && id !== 'buy-valve') return
    if (this.money < this.skuPrice(id)) return
    if (!this.edgeOwned(e)) return
    if (id === 'buy-pipe') {
      if (this.hasPipe(e)) return
      this.segments.set(edgeKey(e), { at: e, gate: { kind: 'bare' } })
      vertsOf(e).forEach(v => this.netVerts.add(vertexKey(v)))
    } else {
      const seg = this.segmentAt(e)
      if (seg === undefined || seg.gate.kind === 'valve') return
      seg.gate = { kind: 'valve', open: true }
    }
    this.money -= this.skuPrice(id)
    this.dirtyNets()
    this.pulse = { text: `Place ${placeLabel(id)}`, at: { col: e.col, row: e.row } }
    this.ping()
  }

  deletePipe(e: Edge): void {
    if (this.place.kind !== 'delete') return
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

  toggleValve(e: Edge): void {
    const seg = this.segmentAt(e)
    if (seg === undefined || seg.gate.kind !== 'valve') return
    seg.gate = { kind: 'valve', open: !seg.gate.open }
    this.dirtyNets()
    this.pulse = { text: seg.gate.open ? 'Open valve' : 'Close valve', at: { col: e.col, row: e.row } }
    this.ping()
  }

  openHud(target: HudTarget): void {
    this.hud = target
    this.ping()
  }

  closeHud(): void {
    if (this.hud === undefined) return
    this.hud = undefined
    this.ping()
  }

  tuneSprinkler(at: Vertex, tune: Tune): void {
    const s = this.sprinklerAt(at)
    if (s === undefined) return
    s.tune = tune
    this.ping()
  }

  placeSprinkler(s: Sprinkler): void {
    const id = sprinklerSku(s)
    if (this.place.kind !== 'sku' || this.place.id !== id) return
    if (this.money < this.skuPrice(id)) return
    if (!this.vertexOwned(s.at)) return
    if (this.sprinklerAt(s.at) !== undefined) return
    const placed: Sprinkler =
      this.place.id === 'buy-sprinkler-vert'
        ? { variant: 'vert', at: s.at, facing: this.place.facing, tune: { kind: 'flat' } }
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
    if (this.place.kind !== 'delete') return
    if (this.sprinklerAt(v) === undefined) return
    this.sprinklers.delete(vertexKey(v))
    this.pruneVert(v)
    this.dirtyNets()
    this.pulse = { text: 'Delete sprinkler', at: { col: v.col, row: v.row } }
    this.ping()
  }

  armDelete(): void {
    this.place = { kind: 'delete' }
    this.ping()
  }

  rotatePlace(): void {
    if (this.place.kind !== 'sku' || this.place.id !== 'buy-sprinkler-vert') return
    this.place = {
      kind: 'sku',
      id: 'buy-sprinkler-vert',
      facing: this.place.facing === 'ns' ? 'ew' : 'ns',
    }
    this.ping()
  }

  deleteBuilding(at: Coord): void {
    if (this.place.kind !== 'delete') return
    if (!inWorld(at, this.owned)) return
    const c = this.cell(at)
    if (c.kind === 'pump') {
      if (c.form === 'starter') return
      occupiedCells(c.base, this.owned).forEach(p => {
        this.setCell(p, { kind: 'empty', soil: this.freshSoil(p) })
      })
      this.pumps.splice(this.pumps.indexOf(c), 1)
      this.dirtyNets()
      this.pulse = { text: c.form === 'jack' ? 'Delete pumpjack' : 'Delete well', at: { ...at } }
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
      const made: Net = { sources: [], sprinklers: [], taps: [] }
      byRoot.set(r, made)
      return made
    }
    sources.forEach((s, i) => {
      netOf(sourceCorners[i][0]).sources.push(s.water)
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
    return this.sources().some(p =>
      corners(occupiedCells(p.base, this.owned)).some(v => verts.has(vertexKey(v))),
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
    return readPrompt(this, at)
  }

  promptHit(hit: PromptHit | undefined): Prompt {
    return readPromptHit(this, hit)
  }

  say(text: string): void {
    this.speech = { kind: 'say', text, left: SPEECH_S }
    this.ping()
  }

  click(at: Coord): 'queued' | 'placed' | 'blocked' | 'noop' {
    if (!inWorld(at, this.owned) && this.place.kind === 'none') return 'noop'
    const p = this.prompt(at)
    if (p.kind === 'intent') {
      this.enqueue(p.intent)
      return 'queued'
    }
    if (p.kind === 'place') {
      this.confirmPlace(at)
      return 'placed'
    }
    if (this.place.kind === 'none' && inWorld(at, this.owned)) this.maybeSay(at)
    return 'blocked'
  }

  clickValve(e: Edge): void {
    const p = valvePrompt(this, e)
    if (p.kind !== 'intent') return
    this.enqueue(p.intent)
  }

  ackCue(): void {
    this.cue = { kind: 'none' }
    this.ping()
  }

  enqueue(i: Intent): void {
    if (this.queue.length >= QUEUE_CAP) return
    const start = this.queue.length === 0
    this.queue.push(i)
    if (start) this.markWalk(i)
    this.ping()
  }

  taskName(i: Intent): TaskName {
    if (!this.actor.inside(dest(i))) {
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
      case 'valve':
        return 'Valve'
      case 'tend':
        return 'Tend'
    }
  }

  taskProgress(): number {
    const head = this.queue[0]
    if (head === undefined) return 0
    if (this.workLeft > 0 && this.workTotal > 0) return 1 - this.workLeft / this.workTotal
    if (this.filling && this.hand.kind === 'hold' && this.hand.item.kind === 'container') {
      return this.hand.item.liters / this.hand.item.capacityLiters
    }
    const at = dest(head)
    if (!this.actor.inside(at)) {
      const tx = at.col + 0.5
      const ty = at.row + 0.5
      const span = Math.hypot(this.legStart.x - tx, this.legStart.y - ty)
      if (span === 0) return 1
      return 1 - Math.hypot(this.actor.x - tx, this.actor.y - ty) / span
    }
    return 1
  }

  buy(id: SkuId): 'Cannot afford' | 'Inventory full' | undefined {
    if (!this.skuOpen(id)) return undefined
    const sku = SKUS[id]
    const made = skuItem(id)
    if (made.kind === 'seeds') {
      const merge = this.inventory.findIndex(
        s =>
          s.kind === 'hold' &&
          s.item.kind === 'seeds' &&
          s.item.crop === made.crop &&
          s.item.rarity === made.rarity,
      )
      const empty = this.inventory.findIndex(s => s.kind === 'empty')
      const price = this.skuPrice(id)
      if (this.money < price) return 'Cannot afford'
      if (merge < 0 && empty < 0) return 'Inventory full'
      this.money -= price
      if (merge >= 0) {
        const slot = this.inventory[merge]
        if (slot.kind === 'hold' && slot.item.kind === 'seeds') slot.item.count += made.count
      } else {
        this.inventory[empty] = { kind: 'hold', item: made }
      }
      this.compactInventory()
      this.ping()
      return undefined
    }
    if (id === 'buy-sprinkler-vert') this.place = { kind: 'sku', id: 'buy-sprinkler-vert', facing: 'ns' }
    else this.place = { kind: 'sku', id }
    this.ping()
    return undefined
  }

  confirmPlace(at: Coord): void {
    if (this.place.kind === 'delete') {
      this.deleteBuilding(at)
      return
    }
    if (this.place.kind !== 'sku') return
    if (
      this.place.id === 'buy-pipe' ||
      this.place.id === 'buy-valve' ||
      this.place.id === 'buy-sprinkler' ||
      this.place.id === 'buy-sprinkler-vert' ||
      this.place.id === 'buy-sprinkler-large'
    ) {
      return
    }
    const price = this.skuPrice(this.place.id)
    if (this.money < price) return
    if (
      this.place.id === 'buy-tile-paved' ||
      this.place.id === 'buy-tile-brick' ||
      this.place.id === 'buy-tile-cobble'
    ) {
      if (!inWorld(at, this.owned)) return
      const c = this.cell(at)
      if (!isTileSite(c)) return
      const tile = this.place.id === 'buy-tile-paved' ? 'paved' : this.place.id === 'buy-tile-brick' ? 'brick' : 'cobble'
      this.money -= price
      this.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'tile', tile } })
      this.pulse = { text: `Place ${placeLabel(this.place.id)}`, at: { ...at } }
      this.ping()
      return
    }
    if (this.place.id === 'buy-pumpjack' || this.place.id === 'buy-rain-tank') {
      if (!wideSiteOk(this, at)) return
      this.money -= price
      const base = { shape: 'rect' as const, col: at.col, row: at.row, w: 2, h: 1 }
      const made = this.place.id === 'buy-pumpjack' ? new Pump(base, 'jack') : new RainTank(base)
      if (made.kind === 'pump') this.pumps.push(made)
      else this.tanks.push(made)
      this.setCell(at, made)
      this.setCell({ col: at.col + 1, row: at.row }, made)
      this.dirtyNets()
      this.pulse = { text: `Place ${placeLabel(this.place.id)}`, at: { ...at } }
      this.place = { kind: 'none' }
      this.ping()
      return
    }
    if (
      this.place.id === 'buy-chest' ||
      this.place.id === 'buy-grinder' ||
      this.place.id === 'buy-compost-box' ||
      this.place.id === 'buy-tap' ||
      this.place.id === 'buy-well'
    ) {
      if (!placeSolidOk(this, at)) return
      this.money -= price
      const base = { shape: 'rect' as const, col: at.col, row: at.row, w: 1, h: 1 }
      if (this.place.id === 'buy-chest') this.setCell(at, new Chest(base))
      else if (this.place.id === 'buy-grinder') this.setCell(at, new Grinder(base))
      else if (this.place.id === 'buy-compost-box') this.setCell(at, new CompostBox(base))
      else if (this.place.id === 'buy-tap') {
        const tap = new Tap(base)
        this.taps.push(tap)
        this.setCell(at, tap)
        this.dirtyNets()
      } else {
        const pump = new Pump(base, 'well')
        this.pumps.push(pump)
        this.setCell(at, pump)
        this.dirtyNets()
      }
      this.pulse = { text: `Place ${placeLabel(this.place.id)}`, at: { ...at } }
      this.place = { kind: 'none' }
      this.ping()
      return
    }
    if (!inWorld(at, this.owned) || !isPlot(this.cell(at))) return
    const made = skuItem(this.place.id)
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
      made.kind === 'tile'
    ) {
      return
    }
    this.money -= price
    this.drops.push({ at: { ...at }, item: made })
    this.pulse = { text: `Place ${placeLabel(this.place.id)}`, at: { ...at } }
    this.place = { kind: 'none' }
    this.ping()
  }

  cancelPlace(): void {
    if (this.place.kind === 'none') return
    this.place = { kind: 'none' }
    this.ping()
  }

  rightClick(at: Coord): void {
    if (this.place.kind !== 'none') {
      this.place = { kind: 'none' }
      this.ping()
      return
    }
    if (!inWorld(at, this.owned)) return
    if (!isPlot(this.cell(at))) return
    if (this.hand.kind !== 'hold') return
    this.enqueue({ act: 'drop', at: { ...at } })
  }

  swap(i: number): void {
    const held = this.hand
    this.hand = this.inventory[i]
    this.inventory[i] = held
    this.compactInventory()
    this.ping()
  }

  swapChest(at: Coord, i: number): void {
    const cell = this.cell(at)
    if (cell.kind !== 'chest') return
    const held = this.hand
    this.hand = cell.slots[i]
    cell.slots[i] = held
    compactSlots(cell.slots)
    this.ping()
  }

  compactInventory(): void {
    compactSlots(this.inventory)
  }

  unlockAll(): void {
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

  buyPacks(id: SkuId): void {
    if (!this.hasSkill('bulk-buying')) return
    if (!this.skuOpen(id)) return
    const made = skuItem(id)
    if (made.kind !== 'seeds') return
    const price = 5 * this.skuPrice(id) * 0.95
    const merge = this.inventory.findIndex(
      s =>
        s.kind === 'hold' &&
        s.item.kind === 'seeds' &&
        s.item.crop === made.crop &&
        s.item.rarity === made.rarity,
    )
    const empty = this.inventory.findIndex(s => s.kind === 'empty')
    if (this.money < price) return
    if (merge < 0 && empty < 0) return
    this.money -= price
    const add = made.count * 5
    if (merge >= 0) {
      const slot = this.inventory[merge]
      if (slot.kind === 'hold' && slot.item.kind === 'seeds') slot.item.count += add
    } else {
      this.inventory[empty] = { kind: 'hold', item: { ...made, count: add } }
    }
    this.compactInventory()
    this.ping()
  }

  nudgeOffered(id: StallGoodId, dir: 1 | -1): void {
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
      const x = stallX(id, this.modifiers)
      return (
        total +
        RARITY_RANK.reduce((goodTotal, rarity) => {
          const rareX = RARITY_SALE[rarity] * (rarity === 'heirloom' ? heirX : 1)
          return (
            goodTotal +
            BIO_KEYS.reduce((bioTotal, k) => {
              const count = this.stall[id].stock[rarity][k]
              if (count === 0) return bioTotal
              const worth = this.stall[id].worth[rarity][k]
              if (clearance && worth === 0) return bioTotal + count
              const avg = worth / count
              const fresh = avg < jam ? jam : avg
              const organicMul = k === 'organic' && id !== 'berry' ? bioX : 1
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
    this.ping()
  }

  private retarget(slot: 0 | 1): void {
    STALL_IDS.forEach(id => {
      const g = this.stall[id]
      const x = stallX(id, this.modifiers)
      const u = hash(this.seed, 'mkt-tgt', goodIx(id), this.clock.day, slot)
      g.target = clamp(g.target * (0.75 + u * 0.5), 0.25 * x, 1.75 * x)
    })
  }

  startResearch(id: ResearchId): void {
    if (this.job.kind === 'run') return
    if (this.done.has(id)) return
    const def = RESEARCH[id]
    if (this.money < def.cost) return
    this.money -= def.cost
    this.job = { kind: 'run', id, left: def.seconds }
    this.ping()
  }

  dismissRecap(): void {
    if (this.seam.kind !== 'recap') return
    this.grantPoint('player')
    this.grantPoint('husband')
    this.grantPoint('daughter')
    this.seam = { kind: 'play' }
    this.clock.banner = 2
    this.ping()
  }

  tick(rawDt: number): void {
    const dt = rawDt > DT_MAX ? DT_MAX : rawDt
    if (this.seam.kind === 'recap') return
    this.sales = []
    const t0 = this.clock.t
    const seam = this.clock.advance(dt) === 'seam'
    if (seam) {
      if (DYNAMIC_MARKET) this.retarget(1)
      this.workLeft = 0
      this.workTotal = 0
      this.filling = false
      this.money += DAY_STIPEND
      const tax = this.tax()
      this.money -= tax
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
    this.tickQueue(dt)
    this.tickField(dt)
    this.tickWater(dt)
    this.tickFreshness(dt)
    this.tickCompost(dt)
    this.tickBig(dt)
    if (this.tickStall(dt) || this.sales.length > 0) this.ping()
  }

  private tickSpeech(dt: number): void {
    if (this.speech.kind !== 'say') return
    this.speech.left -= dt
    if (this.speech.left > 0) return
    this.speech = { kind: 'none' }
    this.ping()
  }

  private tickJob(dt: number): void {
    if (this.job.kind === 'idle') return
    this.job.left -= dt * (1 + 0.05 * this.skillTier('research-speed'))
    if (this.job.left > 0) return
    this.done.add(this.job.id)
    this.tally.research.push(this.job.id)
    this.job = { kind: 'idle' }
    this.ping()
  }

  private tickQueue(dt: number): void {
    if (this.workLeft > 0) {
      this.workLeft -= dt
      if (this.workLeft > 0) return
      this.finishWork()
      return
    }
    if (this.filling) {
      this.tickFill(dt)
      return
    }
    const next = this.queue[0]
    if (next === undefined) return
    const at = dest(next)
    if (!this.actor.inside(at)) {
      this.actor.walkToward(at, dt, this.walkSpeed())
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
        if (!this.canFill(i.at)) {
          this.shiftHead()
          return
        }
        this.filling = true
        return
      case 'drop':
        this.doDrop(i.at)
        this.shiftHead()
        return
      case 'inventory':
        this.cue = { kind: 'inventory' }
        this.shiftHead()
        return
      case 'chest':
        if (this.cell(i.at).kind !== 'chest') {
          this.shiftHead()
          return
        }
        this.cue = { kind: 'chest', at: { ...i.at } }
        this.shiftHead()
        return
      case 'grind':
        if (!this.canGrind(i.at)) {
          this.shiftHead()
          return
        }
        this.arm((GRIND_WORK * grindN(this.hand)) / this.machineMul())
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
    this.workLeft = seconds
    this.workTotal = seconds
  }

  private markWalk(i: Intent): void {
    if (this.actor.inside(dest(i))) return
    this.legStart = { x: this.actor.x, y: this.actor.y }
  }

  private shiftHead(): void {
    this.queue.shift()
    this.workLeft = 0
    this.workTotal = 0
    const next = this.queue[0]
    if (next !== undefined) this.markWalk(next)
    this.ping()
  }

  private finishWork(): void {
    const i = this.queue[0]
    if (i === undefined) return
    if (i.act === 'shovel') this.doShovel(i.at)
    if (i.act === 'mine') this.doMine(i.at)
    if (i.act === 'plant') this.doPlant(i.at)
    if (i.act === 'water') this.doWater(i.at)
    if (i.act === 'fertilize') this.doFertilize(i.at)
    if (i.act === 'compost') this.doCompost(i.at)
    if (i.act === 'harvest') this.doHarvest(i.at)
    if (i.act === 'grind') this.doGrind(i.at)
    if (i.act === 'valve') this.doValve(i.edge)
    if (i.act === 'tend') this.doTend(i.at)
    this.shiftHead()
  }

  private tickFill(dt: number): void {
    const head = this.queue[0]
    if (head === undefined || head.act !== 'fill') {
      this.filling = false
      this.shiftHead()
      return
    }
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'container') {
      this.filling = false
      this.shiftHead()
      return
    }
    const source = this.cell(head.at)
    if (source.kind !== 'pump' && source.kind !== 'rain-tank' && source.kind !== 'tap') {
      this.filling = false
      this.shiftHead()
      return
    }
    const c = this.hand.item
    const miss = c.capacityLiters - c.liters
    if (miss <= 0) {
      this.filling = false
      this.pulse = { text: 'Fill', at: { ...head.at } }
      this.shiftHead()
      return
    }
    const add = this.fillDraw(source, dt)
    c.liters = add >= miss ? c.capacityLiters : c.liters + add
    if (c.liters === c.capacityLiters) {
      this.filling = false
      this.pulse = { text: 'Fill', at: { ...head.at } }
      this.shiftHead()
    }
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
      if (c.kind === 'shrub' && !c.ripe) {
        c.grow += dt / SHRUB_GROW
        if (c.grow >= 1) {
          c.grow = 1
          c.ripe = true
          this.track(at, c)
          dirty = true
        }
        continue
      }
      if (c.kind === 'apple-tree' && !c.ripe) {
        c.grow += dt / 720
        if (c.grow >= 1) {
          c.grow = 1
          c.ripe = true
          c.rarity = rollRarity(hash(this.seed, 'apple', c.base.col, c.base.row, this.clock.day))
          this.track(at, c)
          dirty = true
        }
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
          const u = hash(this.seed, 'grow-rarity', at.col, at.row, this.clock.day)
          c.plant.rarity = rollGrowRarity(c.plant.rarity, c.plant.happiness, u)
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
    if (dirty) this.ping()
  }

  private tickWater(dt: number): void {
    this.sources().forEach(s => s.water.gather(dt))
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
    if (dirty) this.ping()
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
    slot(this.hand)
    this.inventory.forEach(slot)
    this.drops.forEach(d => slot({ kind: 'hold', item: d.item }))
    this.live.forEach(at => {
      const c = this.cell(at)
      if (c.kind === 'chest') c.slots.forEach(slot)
    })
  }

  private tickBig(dt: number): void {
    this.bigAcc += dt
    if (this.bigAcc < BIG_TICK) return
    this.bigAcc -= BIG_TICK
    this.bigTicks += 1
    const weeds = this.sproutWeeds()
    const grass = this.sproutGrass()
    const vfx = this.tickVfx()
    if (weeds || grass || vfx) this.ping()
  }

  private tickVfx(): boolean {
    let changed = false
    this.vfx.forEach((on, k) => {
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
      if (hash(this.seed, 'weed', at.col, at.row, this.bigTicks) >= WEED_CHANCE) return
      const variant = hash(this.seed, 'weed-kind', at.col, at.row, this.bigTicks) < 0.5 ? 0 : 1
      this.setCell(at, { kind: 'weed', soil: c.soil, weed: new Weed(variant) })
      grew = true
    })
    return grew
  }

  private sproutGrass(): boolean {
    if (hash(this.seed, 'grass-roll', this.bigTicks) >= GRASS_CHANCE) return false
    const b = this.bounds()
    for (let i = 0; i < 24; i++) {
      const col = b.col0 + Math.floor(hash(this.seed, 'grass-col', this.bigTicks, i) * (b.col1 - b.col0))
      const row = b.row0 + Math.floor(hash(this.seed, 'grass-row', this.bigTicks, i) * (b.row1 - b.row0))
      const at = { col, row }
      if (!this.inWorld(at)) continue
      const c = this.cell(at)
      if (c.kind !== 'untilled' || c.ground === 'very-hard' || c.cover.kind !== 'bare') continue
      if (onCell(this.drops, at).length > 0) continue
      const variant = Math.floor(hash(this.seed, 'grass-kind', col, row, this.bigTicks) * 3) as 0 | 1 | 2
      this.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'grass', variant } })
      return true
    }
    return false
  }

  private freshSoil(at: Coord): Soil {
    return new Soil(SOIL_TILL_WATER, goodness(this.seed, at.col, at.row))
  }

  private canShovel(at: Coord): boolean {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'shovel') return false
    const c = this.cell(at)
    if (c.kind === 'shrub' || c.kind === 'apple-tree') return true
    if (!isPlot(c)) return false
    if (c.kind === 'infertile') return false
    if (c.kind === 'untilled' && c.ground === 'very-hard') return false
    if (c.kind === 'untilled' && c.ground === 'hard') return this.hand.item.usesLeft >= 2
    return true
  }

  private doShovel(at: Coord): void {
    if (!this.canShovel(at)) return
    const c = this.cell(at)
    const s = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'shovel' }> }
    if (c.kind === 'shrub') {
      this.drops.push({ at: { ...at }, item: { kind: 'shrub' } })
      this.setCell(at, bare('soft'))
      s.item.usesLeft -= 1
      if (s.item.usesLeft <= 0) this.hand = { kind: 'empty' }
      this.pulse = { text: 'Dig', at: { ...at } }
      return
    }
    if (c.kind === 'apple-tree') {
      occupiedCells(c.base, this.owned).forEach(p => this.setCell(p, bare('soft')))
      this.drops.push({ at: { ...at }, item: { kind: 'apple-tree' } })
      s.item.usesLeft -= 1
      if (s.item.usesLeft <= 0) this.hand = { kind: 'empty' }
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
    s.item.usesLeft -= cost
    if (s.item.usesLeft <= 0) this.hand = { kind: 'empty' }
    this.pulse = { text, at: { ...at } }
  }

  private canMine(at: Coord): boolean {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'pickaxe') return false
    const c = this.cell(at)
    if (c.kind === 'untilled' && c.ground === 'very-hard') return true
    if (c.kind !== 'rock') return false
    const n = occupiedCells(c.base, this.owned).length
    return n < 2 || this.hand.item.usesLeft >= 2
  }

  private doMine(at: Coord): void {
    if (!this.canMine(at)) return
    const c = this.cell(at)
    const s = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'pickaxe' }> }
    if (c.kind === 'untilled' && c.ground === 'very-hard') {
      this.setCell(at, { kind: 'infertile' })
      s.item.usesLeft -= 1
      if (s.item.usesLeft <= 0) this.hand = { kind: 'empty' }
      this.pulse = { text: 'Mine', at: { ...at } }
      return
    }
    if (c.kind !== 'rock') return
    const n = occupiedCells(c.base, this.owned).length
    occupiedCells(c.base, this.owned).forEach(p => {
      this.setCell(p, bare('soft'))
    })
    s.item.usesLeft -= n === 1 ? 1 : 2
    if (s.item.usesLeft <= 0) this.hand = { kind: 'empty' }
    this.pulse = { text: 'Mine', at: { ...at } }
  }

  private canPlant(at: Coord): boolean {
    if (this.hand.kind !== 'hold') return false
    if (this.hand.item.kind === 'shrub') {
      const c = this.cell(at)
      return c.kind === 'untilled' && c.ground === 'soft'
    }
    if (this.hand.item.kind !== 'seeds') return false
    return this.cell(at).kind === 'empty'
  }

  private doPlant(at: Coord): void {
    if (!this.canPlant(at)) return
    if (this.hand.kind !== 'hold') return
    if (this.hand.item.kind === 'shrub') {
      this.setCell(at, new Shrub(false, 0))
      this.hand = { kind: 'empty' }
      this.pulse = { text: 'Plant', at: { ...at } }
      return
    }
    const bed = this.cell(at) as Extract<Plot, { kind: 'empty' }>
    const s = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'seeds' }> }
    this.setCell(at, {
      kind: 'growing',
      soil: bed.soil,
      plant: new Plant(s.item.crop, s.item.rarity),
    })
    const crop = s.item.crop
    s.item.count -= 1
    if (s.item.count <= 0) this.hand = { kind: 'empty' }
    this.pulse = { text: `Plant ${crop}`, at: { ...at } }
  }

  private canWater(at: Coord): boolean {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'container') return false
    if (this.hand.item.liters <= 0) return false
    return waterable(this.cell(at), this.modifiers)
  }

  private doWater(at: Coord): void {
    if (!this.canWater(at)) return
    const c = this.cell(at) as Extract<Plot, { soil: Soil }>
    const bucket = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'container' }> }
    const need = pourTarget(c, this.modifiers) - c.soil.water
    const use = need > bucket.item.liters ? bucket.item.liters : need
    c.soil.soak(use)
    bucket.item.liters -= use
    this.pulse = { text: 'Water', at: { ...at } }
  }

  private doValve(edge: Edge): void {
    this.toggleValve(edge)
  }

  private canFertilize(at: Coord): boolean {
    if (this.hand.kind !== 'hold') return false
    const it = this.hand.item
    if (it.kind !== 'fertilizer' && it.kind !== 'synth' && it.kind !== 'compost') return false
    if (it.liters <= 0) return false
    const c = this.cell(at)
    return isTilled(c) && c.soil.fertilizer < FERT_PLOT_MAX
  }

  private doFertilize(at: Coord): void {
    if (!this.canFertilize(at)) return
    const c = this.cell(at) as Extract<Plot, { soil: Soil }>
    const bag = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'fertilizer' | 'synth' | 'compost' }> }
    const need = FERT_PLOT_MAX - c.soil.fertilizer
    const use = need > bag.item.liters ? bag.item.liters : need
    if (bag.item.kind === 'synth') c.soil.spike(use)
    else c.soil.feed(use)
    bag.item.liters -= use
    if (bag.item.liters <= 0) this.hand = { kind: 'empty' }
    this.pulse = { text: 'Fertilize', at: { ...at } }
  }

  private canCompost(at: Coord): boolean {
    if (this.hand.kind !== 'hold') return false
    if (this.cell(at).kind !== 'compost-box') return false
    return organic(this.hand.item)
  }

  private doCompost(at: Coord): void {
    if (!this.canCompost(at)) return
    const box = this.cell(at) as CompostBox
    const held = this.hand as { kind: 'hold'; item: Item }
    box.units += compostValue(held.item)
    this.track(at, box)
    this.hand = { kind: 'empty' }
    this.pulse = { text: 'Compost', at: { ...at } }
  }

  canTend(at: Coord): boolean {
    if (!this.hasSkill('tending')) return false
    if (this.hand.kind !== 'empty') return false
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
    if ((c.kind === 'shrub' || c.kind === 'apple-tree') && c.ripe) {
      if (this.hand.kind === 'empty') return true
      if (this.hand.item.kind !== 'box') return false
      const cargo = this.hand.item.cargo
      return cargo.kind === 'empty' || (cargo.kind === 'berry' && cargo.count < this.hand.item.cap)
    }
    if (c.kind !== 'ripe') return false
    if (this.hand.kind === 'empty') return true
    if (this.hand.item.kind !== 'box') return false
    return boxAccepts(this.hand.item, 'fruit', c.plant.crop, c.plant.rarity, 1) > 0
  }

  private doHarvest(at: Coord): void {
    if (!this.canHarvest(at)) return
    const c = this.cell(at)
    if (c.kind === 'shrub') {
      const rarity = rollRarity(hash(this.seed, 'berry', at.col, at.row, this.clock.day))
      if (this.hand.kind === 'hold' && this.hand.item.kind === 'box') {
        if (boxAccepts(this.hand.item, 'berry', rarity, 1) === 0) return
        boxAdd(this.hand.item, 'berry', rarity, 1)
      } else {
        this.hand = { kind: 'hold', item: { kind: 'berry', rarity, count: 1 } }
      }
      c.ripe = false
      c.grow = 0
      this.track(at, c)
      this.tally.harvests += 1
      this.pulse = { text: 'Harvest', at: { ...at } }
      return
    }
    if (c.kind === 'apple-tree') {
      const picked = fruitStack('apple', c.rarity, 1, CROPS.apple.sale * RARITY_SALE[c.rarity], 1, true)
      occupiedCells(c.base, this.owned).forEach(p => this.setCell(p, bare('soft')))
      this.tally.harvests += 1
      this.pulse = { text: 'Harvest', at: { ...at } }
      if (this.hand.kind === 'empty') this.hand = { kind: 'hold', item: { kind: 'fruit', ...picked } }
      else if (this.hand.item.kind === 'box') boxAddFruit(this.hand.item, picked)
      return
    }
    const bed = c as Extract<Plot, { kind: 'ripe' }>
    const p = bed.plant
    const picked = fruitStack(p.crop, p.rarity, 1, p.stats(this.modifiers).sale, p.freshness, p.bio)
    this.setCell(at, { kind: 'empty', soil: bed.soil })
    this.tally.harvests += 1
    this.pulse = { text: 'Harvest', at: { ...at } }
    if (this.hand.kind === 'empty') {
      this.hand = { kind: 'hold', item: { kind: 'fruit', ...picked } }
      return
    }
    if (this.hand.item.kind === 'box') boxAddFruit(this.hand.item, picked)
  }

  private canFill(at: Coord): boolean {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'container') return false
    return fillable(this, at)
  }

  private doPickup(at: Coord): void {
    const i = topIndex(this.drops, at)
    if (i < 0) {
      if (this.hand.kind !== 'empty') return
      const c = this.cell(at)
      if (c.kind === 'weed') {
        this.setCell(at, { kind: 'empty', soil: c.soil })
        this.hand = { kind: 'hold', item: { kind: 'weed', count: 1 } }
      } else if (c.kind === 'untilled' && c.cover.kind === 'grass') {
        this.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'bare' } })
        this.hand = { kind: 'hold', item: { kind: 'grass', count: 1 } }
      } else return
      this.pulse = { text: 'Pick up', at: { ...at } }
      return
    }
    const taken = this.drops[i].item
    if (this.hand.kind === 'hold' && this.hand.item.kind === 'box') {
      if (taken.kind === 'seeds') {
        const n = boxAdd(this.hand.item, 'seeds', taken.crop, taken.rarity, taken.count)
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
        const n = boxAddFruit(this.hand.item, taken)
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
      if (taken.kind === 'berry') {
        const n = boxAdd(this.hand.item, 'berry', taken.rarity, taken.count)
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
    if (this.hand.kind === 'empty') {
      this.hand = { kind: 'hold', item: taken }
      this.pulse = { text: 'Pick up', at: { ...at } }
      return
    }
    this.drops.push({ at: { ...at }, item: this.hand.item })
    this.hand = { kind: 'hold', item: taken }
    this.pulse = { text: 'Pick up', at: { ...at } }
  }

  private doDrop(at: Coord): void {
    if (this.hand.kind !== 'hold') return
    if (!isPlot(this.cell(at))) return
    this.drops.push({ at: { ...at }, item: this.hand.item })
    this.hand = { kind: 'empty' }
  }

  private doConsign(): void {
    if (this.hand.kind !== 'hold') return
    const item = this.hand.item
    if (item.kind === 'fruit') {
      this.stall[item.crop].take(item.rarity, item.count, freshMul(item.freshness), item.bio)
      this.hand = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.kind === 'berry') {
      this.stall.berry.take(item.rarity, item.count, 1, true)
      this.hand = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.kind !== 'box') return
    if (item.cargo.kind === 'stack' && item.cargo.goods === 'fruit') {
      const cargo = item.cargo.stack
      this.stall[cargo.crop].take(cargo.rarity, cargo.count, freshMul(cargo.freshness), cargo.bio)
      item.cargo = { kind: 'empty' }
      this.completeConsign()
      return
    }
    if (item.cargo.kind === 'berry') {
      this.stall.berry.take(item.cargo.rarity, item.cargo.count, 1, true)
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

  private canGrind(at: Coord): boolean {
    return this.cell(at).kind === 'grinder' && grindN(this.hand) > 0
  }

  private doGrind(at: Coord): void {
    if (!this.canGrind(at)) return
    if (this.hand.kind !== 'hold') return
    const n = grindN(this.hand)
    let crop
    let rarity
    if (this.hand.item.kind === 'fruit') {
      crop = this.hand.item.crop
      rarity = this.hand.item.rarity
      this.hand.item.count -= 1
      if (this.hand.item.count <= 0) this.hand = { kind: 'empty' }
    } else if (
      this.hand.item.kind === 'box' &&
      this.hand.item.cargo.kind === 'stack' &&
      this.hand.item.cargo.goods === 'fruit'
    ) {
      crop = this.hand.item.cargo.stack.crop
      rarity = this.hand.item.cargo.stack.rarity
      this.hand.item.cargo = { kind: 'empty' }
    } else return
    let total = 0
    for (let i = 0; i < n; i++) {
      const u = hash(this.seed, 'grind', at.col, at.row, this.clock.day, i)
      total += GRIND_MIN + Math.floor(u * (GRIND_MAX - GRIND_MIN + 1))
    }
    this.mergeSeeds(crop, rarity, total, at)
    this.pulse = { text: 'Grind', at: { ...at } }
  }

  private mergeSeeds(crop: CropId, rarity: Rarity, count: number, at: Coord): void {
    const merge = this.inventory.findIndex(
      s =>
        s.kind === 'hold' &&
        s.item.kind === 'seeds' &&
        s.item.crop === crop &&
        s.item.rarity === rarity,
    )
    if (merge >= 0) {
      const slot = this.inventory[merge]
      if (slot.kind === 'hold' && slot.item.kind === 'seeds') slot.item.count += count
      this.compactInventory()
      return
    }
    const empty = this.inventory.findIndex(s => s.kind === 'empty')
    if (empty >= 0) {
      this.inventory[empty] = { kind: 'hold', item: { kind: 'seeds', crop, rarity, count } }
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
    this.say(`I cannot use this ${toolName(this.hand)} to ${action}`)
  }
}

function usesLeftBlocked(w: World, at: Coord): boolean {
  if (w.hand.kind !== 'hold') return false
  const cell = w.cell(at)
  if (w.hand.item.kind === 'shovel' && cell.kind === 'untilled' && cell.ground === 'hard' && w.hand.item.usesLeft < 2) {
    return true
  }
  if (w.hand.item.kind === 'pickaxe' && cell.kind === 'rock') {
    const n = cell.base.w * cell.base.h
    if (n > 1 && w.hand.item.usesLeft < 2) return true
  }
  return false
}

function emptyBucketBlocked(w: World, at: Coord): boolean {
  if (w.hand.kind !== 'hold' || w.hand.item.kind !== 'container' || w.hand.item.liters > 0) return false
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
  if (cell.kind === 'shrub' && cell.ripe) return 'harvest'
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
  const s = (w.hand as { item: Extract<Item, { kind: 'shovel' }> }).item
  const c = w.cell(at)
  if (c.kind === 'untilled' && c.ground === 'hard') return s.workSeconds * 2
  return s.workSeconds
}

function mineTime(w: World, at: Coord): number {
  const p = (w.hand as { item: Extract<Item, { kind: 'pickaxe' }> }).item
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
    if (slot.item.kind === 'berry') {
      const rarity = slot.item.rarity
      const hit = kept.find(s => s.kind === 'hold' && s.item.kind === 'berry' && s.item.rarity === rarity)
      if (hit !== undefined && hit.kind === 'hold' && hit.item.kind === 'berry') {
        hit.item.count += slot.item.count
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
