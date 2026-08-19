import { CONTAINERS, GRIND_MAX, GRIND_MIN, GRIND_WORK, SPEECH_S, SHRUB_GROW, SPRINKLER_RATE } from '../defs/items.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { CROPS, freshMul, HEALTH, WITHER } from '../defs/crops.ts'
import { HAPPY_WILT_SECONDS, RARITY_RANK, RARITY_SALE, rollGrowRarity, type Rarity } from '../defs/rarity.ts'
import type { CropId, ResearchId, SkuId, StallGoodId } from './ids.ts'
import { Actor } from './actor.ts'
import {
  CHUNK,
  Chest,
  DOOR,
  Grinder,
  HOUSE_BASE,
  House,
  PAD,
  PUMP_BASE,
  Pump,
  Shrub,
  TRUCK_BASE,
  Truck,
  chunkKey,
  chunkOf,
  chunkRect,
  inWorld,
  local,
  occupiedCells,
  type ChunkId,
  type Coord,
} from './building.ts'
import { Clock } from './clock.ts'
import { topIndex, type Drop } from './drop.ts'
import { generateChunk } from './gen.ts'
import {
  boxAdd,
  boxAccepts,
  fruitMoney,
  berryMoney,
  grindN,
  makeContainer,
  makeShovel,
  mergeUnitSale,
  skuItem,
  toolName,
  type Hand,
  type Item,
  type Slot,
} from './item.ts'
import { goodIx, makeStall, rate as stallRate, stallX, tenths, STALL_IDS, type StallMap, type StallSale } from './stall.ts'
import type { Modifier } from './modifiers.ts'
import { Plant } from './plant.ts'
import { isPlot, type Cell, type Plot } from './plot.ts'
import {
  aoe,
  edgeKey,
  edgeOwned as pipeOwned,
  incident,
  vertexKey,
  vertexOwned as pipeVertexOwned,
  type Edge,
  type Sprinkler,
  type System,
  type Vertex,
} from './pipe.ts'
import {
  placeLabel,
  placeSolidOk,
  pumpjackOk,
  readPrompt,
  readPromptHit,
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
  | { act: 'harvest'; at: Coord }
  | { act: 'fill'; at: Coord }
  | { act: 'consign' }
  | { act: 'pickup'; at: Coord }
  | { act: 'drop'; at: Coord }
  | { act: 'inventory' }
  | { act: 'chest'; at: Coord }
  | { act: 'grind'; at: Coord }

export type TaskName =
  | 'Move here'
  | 'Move here and dig'
  | 'Dig'
  | 'Mine'
  | 'Plant'
  | 'Water'
  | 'Harvest'
  | 'Fill'
  | 'Drop off'
  | 'Pick up'
  | 'Drop'
  | 'Inventory'
  | 'Chest'
  | 'Grind'

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

export type DayTally = { died: number; harvests: number; research: ResearchId[] }

export type Recap = {
  day: number
  money: number
  died: number
  harvests: number
  research: ResearchId[]
  tax: number
}

export type Seam = { kind: 'play' } | { kind: 'recap'; recap: Recap }

export type ExpandFace = { id: ChunkId; dir: 'n' | 'e' | 's' | 'w'; at: Coord; price: number }

type Job = { kind: 'idle' } | { kind: 'run'; id: ResearchId; left: number }

const QUEUE_CAP = 8
const DT_MAX = 1 / 15
const INV = 16

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
  readonly pipes = new Map<string, Edge>()
  readonly sprinklers = new Map<string, Sprinkler>()
  readonly house: House
  readonly truck: Truck
  readonly stall: StallMap
  sales: StallSale[] = []
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
  tally: DayTally = { died: 0, harvests: 0, research: [] }
  seam: Seam = { kind: 'play' }
  legStart = { x: DOOR.col + 0.5, y: DOOR.row + 0.5 }
  workTotal = 0
  private workLeft = 0
  private filling = false
  private mktAcc = 0
  private readonly chunks = new Map<string, Cell[][]>()
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
    this.chunks.set(chunkKey(this.owned[0]), generateChunk(this.seed, this.owned[0], this.house, this.pumps[0], this.truck))
    this.actor = new Actor(DOOR.col + 0.5, DOOR.row + 0.5)
    this.inventory[0] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 5 } }
    this.inventory[1] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', rarity: 'rare', count: 2, unitSale: CROPS.carrot.sale * RARITY_SALE.rare },
    }
    this.inventory[2] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'tomato', rarity: 'rare', count: 2, unitSale: CROPS.tomato.sale * RARITY_SALE.rare },
    }
    this.drops.push({ at: { ...DOOR }, item: makeContainer('bucket', CONTAINERS.bucket.capacityLiters) })
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
    this.gridOf(chunkOf(at))[loc.row][loc.col] = cell
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
    return 2 + 6 * (this.owned.length - 1)
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
    this.chunks.set(chunkKey(id), generateChunk(this.seed, id, this.house, this.pumps[0], this.truck))
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
    return this.pipes.has(edgeKey(e))
  }

  sprinklerAt(v: Vertex): Sprinkler | undefined {
    return this.sprinklers.get(vertexKey(v))
  }

  edgeOwned(e: Edge): boolean {
    return pipeOwned(e, at => this.inWorld(at))
  }

  vertexOwned(v: Vertex): boolean {
    return pipeVertexOwned(v, at => this.inWorld(at))
  }

  placePipe(e: Edge): void {
    if (this.place.kind !== 'sku' || this.place.id !== 'buy-pipe') return
    if (this.money < SKUS['buy-pipe'].price) return
    if (!this.edgeOwned(e) || this.hasPipe(e)) return
    this.money -= SKUS['buy-pipe'].price
    this.pipes.set(edgeKey(e), e)
    this.pulse = { text: 'Place Pipe', at: { col: e.col, row: e.row } }
    this.ping()
  }

  deletePipe(e: Edge): void {
    if (this.place.kind !== 'delete') return
    if (!this.edgeOwned(e) || !this.hasPipe(e)) return
    this.pipes.delete(edgeKey(e))
    this.pulse = { text: 'Delete pipe', at: { col: e.col, row: e.row } }
    this.ping()
  }

  placeSprinkler(s: Sprinkler): void {
    const id = sprinklerSku(s)
    if (this.place.kind !== 'sku' || this.place.id !== id) return
    if (this.money < SKUS[id].price) return
    if (!this.vertexOwned(s.at)) return
    if (this.sprinklerAt(s.at) !== undefined) return
    const placed: Sprinkler =
      this.place.id === 'buy-sprinkler-vert'
        ? { variant: 'vert', at: s.at, facing: this.place.facing }
        : s
    if (!aoe(placed).every(c => this.inWorld(c))) return
    this.money -= SKUS[id].price
    this.sprinklers.set(vertexKey(placed.at), placed)
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
      if (c.form === 'jack') {
        occupiedCells(c.base, this.owned).forEach(p => {
          this.setCell(p, { kind: 'empty' })
        })
        this.pumps.splice(this.pumps.indexOf(c), 1)
        this.pulse = { text: 'Delete pumpjack', at: { ...at } }
        this.ping()
        return
      }
      this.setCell(at, { kind: 'empty' })
      this.pumps.splice(this.pumps.indexOf(c), 1)
      this.pulse = { text: 'Delete well', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind === 'chest') {
      c.slots.forEach(s => {
        if (s.kind === 'hold') this.drops.push({ at: { ...at }, item: s.item })
      })
      this.setCell(at, { kind: 'empty' })
      this.pulse = { text: 'Delete chest', at: { ...at } }
      this.ping()
      return
    }
    if (c.kind !== 'grinder') return
    this.setCell(at, { kind: 'empty' })
    this.pulse = { text: 'Delete grinder', at: { ...at } }
    this.ping()
  }

  system(e: Edge): System {
    if (!this.hasPipe(e)) return { C: 0, N: 0, R: 0 }
    const seen = new Set<string>([edgeKey(e)])
    const q: Edge[] = [e]
    while (q.length > 0) {
      const cur = q[q.length - 1]
      q.pop()
      vertsOf(cur).forEach(v => {
        incident(v).forEach(n => {
          const k = edgeKey(n)
          if (seen.has(k) || !this.hasPipe(n)) return
          seen.add(k)
          q.push(n)
        })
      })
    }
    let C = 0
    this.pumps.forEach(p => {
      if (
        occupiedCells(p.base, this.owned).some(cell =>
          boundsOf(cell).some(edge => seen.has(edgeKey(edge))),
        )
      ) {
        C += p.outputLitersPerSec
      }
    })
    let N = 0
    this.sprinklers.forEach(s => {
      if (incident(s.at).some(edge => seen.has(edgeKey(edge)))) N += 1
    })
    const R = N === 0 ? 0 : Math.min(SPRINKLER_RATE, C / N)
    return { C, N, R }
  }

  rate(v: Vertex): number {
    const piped = incident(v).find(e => this.hasPipe(e))
    if (piped === undefined) return 0
    return this.system(piped).R
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
      if (this.money < sku.price) return 'Cannot afford'
      if (merge < 0 && empty < 0) return 'Inventory full'
      this.money -= sku.price
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
      this.place.id === 'buy-sprinkler' ||
      this.place.id === 'buy-sprinkler-vert' ||
      this.place.id === 'buy-sprinkler-large'
    ) {
      return
    }
    const sku = SKUS[this.place.id]
    if (this.money < sku.price) return
    if (this.place.id === 'buy-pumpjack') {
      if (!pumpjackOk(this, at)) return
      this.money -= sku.price
      const pump = new Pump({ shape: 'rect', col: at.col, row: at.row, w: 2, h: 1 }, 'jack')
      this.pumps.push(pump)
      this.setCell(at, pump)
      this.setCell({ col: at.col + 1, row: at.row }, pump)
      this.pulse = { text: 'Place Pumpjack', at: { ...at } }
      this.place = { kind: 'none' }
      this.ping()
      return
    }
    if (this.place.id === 'buy-chest' || this.place.id === 'buy-grinder' || this.place.id === 'buy-well') {
      if (!placeSolidOk(this, at)) return
      this.money -= sku.price
      const base = { shape: 'rect' as const, col: at.col, row: at.row, w: 1, h: 1 }
      if (this.place.id === 'buy-chest') this.setCell(at, new Chest(base))
      else if (this.place.id === 'buy-grinder') this.setCell(at, new Grinder(base))
      else {
        const pump = new Pump(base, 'well')
        this.pumps.push(pump)
        this.setCell(at, pump)
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
      made.kind === 'well' ||
      made.kind === 'pipe' ||
      made.kind === 'sprinkler' ||
      made.kind === 'sprinkler-vert' ||
      made.kind === 'sprinkler-large' ||
      made.kind === 'delete'
    ) {
      return
    }
    this.money -= sku.price
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
    const kept: Slot[] = []
    this.inventory.forEach(slot => {
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
      kept.push(slot)
    })
    kept.forEach((s, i) => {
      this.inventory[i] = s
    })
    for (let i = kept.length; i < INV; i++) this.inventory[i] = { kind: 'empty' }
  }

  unlockAll(): void {
    ;(Object.keys(RESEARCH) as ResearchId[]).forEach(id => {
      this.done.add(id)
    })
    this.money += 999
    this.job = { kind: 'idle' }
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
    this.seam = { kind: 'play' }
    this.clock.banner = 2
    this.ping()
  }

  tick(rawDt: number): void {
    const dt = rawDt > DT_MAX ? DT_MAX : rawDt
    if (this.seam.kind === 'recap') return
    if (this.clock.advance(dt) === 'seam') {
      this.workLeft = 0
      this.workTotal = 0
      this.filling = false
      this.money += 10
      const tax = this.tax()
      this.money -= tax
      this.seam = {
        kind: 'recap',
        recap: {
          day: this.clock.day - 1,
          money: this.money,
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
    this.tickSpeech(dt)
    this.tickJob(dt)
    this.tickQueue(dt)
    this.tickField(dt)
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
    this.job.left -= dt
    if (this.job.left > 0) return
    const def = RESEARCH[this.job.id]
    this.done.add(this.job.id)
    this.tally.research.push(this.job.id)
    this.job = { kind: 'idle' }
    if (def.effect.kind === 'sale-mul') {
      this.modifiers.push({
        id: def.id,
        source: 'research',
        crop: def.effect.crop,
        saleMul: def.effect.saleMul,
        growSpeed: 1,
        waterUseMul: 1,
      })
    }
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
      this.actor.walkToward(at, dt)
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
      case 'sell':
        this.doSell()
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
        this.arm(GRIND_WORK * grindN(this.hand))
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
    if (i.act === 'harvest') this.doHarvest(i.at)
    if (i.act === 'grind') this.doGrind(i.at)
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
    const pumpCell = this.cell(head.at)
    if (pumpCell.kind !== 'pump') {
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
    const add = pumpCell.outputLitersPerSec * dt
    c.liters = add >= miss ? c.capacityLiters : c.liters + add
    if (c.liters === c.capacityLiters) {
      this.filling = false
      this.pulse = { text: 'Fill', at: { ...head.at } }
      this.shiftHead()
    }
  }

  private tickField(dt: number): void {
    let dirty = false
    this.forEachCell((at, c) => {
      if (c.kind === 'shrub' && !c.ripe) {
        c.grow += dt / SHRUB_GROW
        if (c.grow >= 1) {
          c.grow = 1
          c.ripe = true
          dirty = true
        }
        return
      }
      if (c.kind === 'apple-tree' && !c.ripe) {
        c.grow += dt / 720
        if (c.grow >= 1) {
          c.grow = 1
          c.ripe = true
          c.rarity = rollRarity(hash(this.seed, 'apple', c.base.col, c.base.row, this.clock.day))
          dirty = true
        }
        return
      }
      if (c.kind !== 'growing' && c.kind !== 'ripe') return
      const stage0 = c.plant.stage(c.kind)
      const bar0 = c.plant.thirst < HEALTH
      const st = c.plant.stats(this.modifiers)
      if (c.kind === 'growing') {
        const drink = c.plant.thirst < WITHER ? st.waterUsePerSec * 0.5 : st.waterUsePerSec
        c.plant.thirst -= drink * dt
        if (c.plant.thirst < 0) c.plant.thirst = 0
      }
      if (c.kind === 'growing' && c.plant.thirst <= 0) {
        this.setCell(at, { kind: 'dead', plant: c.plant })
        this.tally.died += 1
        dirty = true
        return
      }
      if (c.kind === 'growing' && c.plant.thirst < WITHER) {
        c.plant.happiness -= dt / HAPPY_WILT_SECONDS
        if (c.plant.happiness < 0) c.plant.happiness = 0
      }
      if (c.kind === 'growing' && c.plant.thirst >= WITHER) {
        c.plant.maturity += dt / st.growSeconds
        if (c.plant.maturity >= 1) {
          c.plant.maturity = 1
          c.plant.freshness = 1
          const u = hash(this.seed, 'grow-rarity', at.col, at.row, this.clock.day)
          c.plant.rarity = rollGrowRarity(c.plant.rarity, c.plant.happiness, u)
          this.setCell(at, { kind: 'ripe', plant: c.plant })
          dirty = true
          return
        }
      }
      if (c.kind === 'ripe') {
        const bar0Fresh = c.plant.freshness < 0.8
        c.plant.freshness -= dt / st.rotSeconds
        if (c.plant.freshness <= 0) {
          this.setCell(at, { kind: 'rotten' })
          dirty = true
          return
        }
        if (c.plant.freshness < 0.8 !== bar0Fresh) dirty = true
      }
      const now = this.cell(at)
      if (now.kind !== 'growing' && now.kind !== 'ripe') return
      if (now.plant.stage(now.kind) !== stage0 || now.plant.thirst < HEALTH !== bar0) dirty = true
    })
    this.sprinklers.forEach(s => {
      const r = this.rate(s.at)
      if (r === 0) return
      const targets = aoe(s).filter(at => this.inWorld(at) && this.cell(at).kind === 'growing')
      if (targets.length === 0) return
      const add = (r * dt) / targets.length
      targets.forEach(at => {
        const c = this.cell(at)
        if (c.kind !== 'growing') return
        const next = c.plant.thirst + add
        c.plant.thirst = next > 1 ? 1 : next
        dirty = true
      })
    })
    if (dirty) this.ping()
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
      this.setCell(at, { kind: 'untilled', ground: 'soft' })
      s.item.usesLeft -= 1
      if (s.item.usesLeft <= 0) this.hand = { kind: 'empty' }
      this.pulse = { text: 'Dig', at: { ...at } }
      return
    }
    if (c.kind === 'apple-tree') {
      occupiedCells(c.base, this.owned).forEach(p => this.setCell(p, { kind: 'untilled', ground: 'soft' }))
      this.drops.push({ at: { ...at }, item: { kind: 'apple-tree' } })
      s.item.usesLeft -= 1
      if (s.item.usesLeft <= 0) this.hand = { kind: 'empty' }
      this.pulse = { text: 'Dig', at: { ...at } }
      return
    }
    const text =
      c.kind === 'dead' ? 'Dig out dead plant' : c.kind === 'growing' || c.kind === 'ripe' ? 'Dig up plant' : 'Dig'
    if (c.kind === 'growing' || c.kind === 'ripe') {
      this.drops.push({
        at: { ...at },
        item: { kind: 'seeds', crop: c.plant.crop, rarity: c.plant.rarity, count: 1 },
      })
    }
    this.setCell(at, { kind: 'empty' })
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
      this.setCell(p, { kind: 'untilled', ground: 'soft' })
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
    const s = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'seeds' }> }
    this.setCell(at, {
      kind: 'growing',
      plant: new Plant(s.item.crop, s.item.rarity),
    })
    const crop = s.item.crop
    s.item.count -= 1
    if (s.item.count <= 0) this.hand = { kind: 'empty' }
    this.pulse = { text: `Plant ${crop}`, at: { ...at } }
  }

  private canWater(at: Coord): boolean {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'container') return false
    if (this.hand.item.liters < 1) return false
    const c = this.cell(at)
    return c.kind === 'growing' || c.kind === 'ripe'
  }

  private doWater(at: Coord): void {
    if (!this.canWater(at)) return
    const c = this.cell(at) as Extract<Plot, { kind: 'growing' | 'ripe' }>
    const bucket = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'container' }> }
    bucket.item.liters -= 1
    c.plant.thirst = 1
    this.pulse = { text: 'Water', at: { ...at } }
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
      this.tally.harvests += 1
      this.pulse = { text: 'Harvest', at: { ...at } }
      return
    }
    if (c.kind === 'apple-tree') {
      const unitSale = CROPS.apple.sale * RARITY_SALE[c.rarity]
      occupiedCells(c.base, this.owned).forEach(p => this.setCell(p, { kind: 'untilled', ground: 'soft' }))
      this.tally.harvests += 1
      this.pulse = { text: 'Harvest', at: { ...at } }
      if (this.hand.kind === 'empty') this.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'apple', rarity: c.rarity, count: 1, unitSale } }
      else if (this.hand.item.kind === 'box') boxAdd(this.hand.item, 'fruit', 'apple', c.rarity, 1, unitSale)
      return
    }
    const p = (c as Extract<Plot, { kind: 'ripe' }>).plant
    const unitSale = p.stats(this.modifiers).sale * freshMul(p.freshness)
    this.setCell(at, { kind: 'empty' })
    this.tally.harvests += 1
    this.pulse = { text: 'Harvest', at: { ...at } }
    if (this.hand.kind === 'empty') {
      this.hand = { kind: 'hold', item: { kind: 'fruit', crop: p.crop, rarity: p.rarity, count: 1, unitSale } }
      return
    }
    if (this.hand.item.kind === 'box') boxAdd(this.hand.item, 'fruit', p.crop, p.rarity, 1, unitSale)
  }

  private canFill(at: Coord): boolean {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'container') return false
    return this.cell(at).kind === 'pump'
  }

  private doPickup(at: Coord): void {
    const i = topIndex(this.drops, at)
    if (i < 0) return
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
        const n = boxAdd(this.hand.item, 'fruit', taken.crop, taken.rarity, taken.count, taken.unitSale)
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

  private doSell(): void {
    if (this.hand.kind !== 'hold') return
    if (this.hand.item.kind === 'fruit') {
      this.money += fruitMoney(this.hand.item)
      this.hand = { kind: 'empty' }
      this.pulse = { text: 'Sell', at: { ...DOOR } }
      return
    }
    if (this.hand.item.kind === 'berry') {
      this.money += berryMoney(this.hand.item.rarity, this.hand.item.count)
      this.hand = { kind: 'empty' }
      this.pulse = { text: 'Sell', at: { ...DOOR } }
      return
    }
    if (this.hand.item.kind !== 'box') return
    const cargo = this.hand.item.cargo
    if (cargo.kind === 'berry') {
      this.money += berryMoney(cargo.rarity, cargo.count)
      this.hand.item.cargo = { kind: 'empty' }
      this.pulse = { text: 'Sell', at: { ...DOOR } }
      return
    }
    if (cargo.kind !== 'stack' || cargo.goods !== 'fruit') return
    this.money += fruitMoney(cargo.stack)
    this.hand.item.cargo = { kind: 'empty' }
    this.pulse = { text: 'Sell', at: { ...DOOR } }
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
  if (w.hand.kind !== 'hold' || w.hand.item.kind !== 'container' || w.hand.item.liters >= 1) return false
  const cell = w.cell(at)
  return cell.kind === 'growing' || cell.kind === 'ripe'
}

function primaryAct(cell: Cell): string | undefined {
  if (cell.kind === 'ripe') return 'harvest'
  if (cell.kind === 'shrub' && cell.ripe) return 'harvest'
  if (cell.kind === 'growing') return 'water'
  if (cell.kind === 'empty') return 'plant'
  if (cell.kind === 'untilled' && cell.ground === 'very-hard') return 'mine'
  if (cell.kind === 'untilled') return 'dig'
  if (cell.kind === 'infertile') return 'plant'
  if (cell.kind === 'rock') return 'mine'
  if (cell.kind === 'pump') return 'fill'
  if (cell.kind === 'grinder') return 'grind'
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

function vertsOf(e: Edge): [Vertex, Vertex] {
  if (e.axis === 'h') return [{ col: e.col, row: e.row }, { col: e.col + 1, row: e.row }]
  return [{ col: e.col, row: e.row }, { col: e.col, row: e.row + 1 }]
}

function boundsOf(at: Coord): Edge[] {
  return [
    { axis: 'h', col: at.col, row: at.row },
    { axis: 'h', col: at.col, row: at.row + 1 },
    { axis: 'v', col: at.col, row: at.row },
    { axis: 'v', col: at.col + 1, row: at.row },
  ]
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
    kept.push(slot)
  })
  kept.forEach((s, i) => {
    slots[i] = s
  })
  for (let i = kept.length; i < slots.length; i++) slots[i] = { kind: 'empty' }
}
