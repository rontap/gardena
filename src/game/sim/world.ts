import { CONTAINERS } from '../defs/items.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import type { CropId, ResearchId, SkuId } from './ids.ts'
import type { Rarity } from '../defs/rarity.ts'
import { Actor } from './actor.ts'
import {
  COLS,
  DOOR,
  HOUSE_BASE,
  House,
  PUMP_BASE,
  Pump,
  ROWS,
  inWorld,
  occupiedCells,
  type Coord,
} from './building.ts'
import { Clock } from './clock.ts'
import { topIndex, type Drop } from './drop.ts'
import {
  boxAdd,
  boxAccepts,
  makeContainer,
  makeShovel,
  skuItem,
  type Hand,
  type Item,
  type Slot,
} from './item.ts'
import type { Modifier } from './modifiers.ts'
import { Plant } from './plant.ts'
import { isPlot, type Cell, type Plot } from './plot.ts'
import { HEALTH, WITHER } from '../defs/crops.ts'
import { placeLabel, readPrompt, type Prompt } from './prompt.ts'

export type Intent =
  | { act: 'walk'; at: Coord }
  | { act: 'shovel'; at: Coord }
  | { act: 'plant'; at: Coord }
  | { act: 'water'; at: Coord }
  | { act: 'harvest'; at: Coord }
  | { act: 'fill' }
  | { act: 'sell' }
  | { act: 'pickup'; at: Coord }
  | { act: 'drop'; at: Coord }
  | { act: 'inventory' }

export type TaskName =
  | 'Move here'
  | 'Dig'
  | 'Plant'
  | 'Water'
  | 'Harvest'
  | 'Fill'
  | 'Sell'
  | 'Pick up'
  | 'Drop'
  | 'Inventory'

export type Cue = { kind: 'none' } | { kind: 'inventory' }

export type Place = { kind: 'none' } | { kind: 'sku'; id: SkuId }

export type Pulse = { text: string; at: Coord }

export type DayTally = { died: number; harvests: number; research: ResearchId[] }

export type Recap = {
  day: number
  money: number
  died: number
  harvests: number
  research: ResearchId[]
}

export type Seam = { kind: 'play' } | { kind: 'recap'; recap: Recap }

export type SaleOffer =
  | { kind: 'ok'; money: number; label: string }
  | { kind: 'blocked'; text: string }

type Job = { kind: 'idle' } | { kind: 'run'; id: ResearchId; left: number }

const QUEUE_CAP = 8
const DT_MAX = 1 / 15
const INV = 16

export class World {
  readonly grid: Cell[][]
  readonly house: House
  readonly pump: Pump
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
  pulse: Pulse | undefined = undefined
  tally: DayTally = { died: 0, harvests: 0, research: [] }
  seam: Seam = { kind: 'play' }
  legStart = { x: DOOR.col + 0.5, y: DOOR.row + 0.5 }
  workTotal = 0
  private workLeft = 0
  private filling = false
  private readonly subs = new Set<() => void>()

  constructor() {
    this.house = new House(HOUSE_BASE, DOOR)
    this.pump = new Pump(PUMP_BASE, 2)
    this.grid = buildGrid(this.house, this.pump)
    this.actor = new Actor(DOOR.col + 0.5, DOOR.row + 0.5)
    this.inventory[0] = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 5 } }
    this.drops.push({ at: { ...DOOR }, item: makeContainer('bucket', CONTAINERS.bucket.capacityLiters) })
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

  cell(at: Coord): Cell {
    return this.grid[at.row][at.col]
  }

  skuOpen(id: SkuId): boolean {
    const u = SKUS[id].unlock
    return u === 'start' || this.done.has(u)
  }

  prompt(at: Coord): Prompt {
    return readPrompt(this, at)
  }

  click(at: Coord): 'queued' | 'placed' | 'blocked' | 'noop' {
    if (!inWorld(at) && this.place.kind === 'none') return 'noop'
    const p = this.prompt(at)
    if (p.kind === 'intent') {
      this.enqueue(p.intent)
      return 'queued'
    }
    if (p.kind === 'place') {
      this.confirmPlace(at)
      return 'placed'
    }
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
    switch (i.act) {
      case 'walk':
        return 'Move here'
      case 'shovel':
        return 'Dig'
      case 'plant':
        return 'Plant'
      case 'water':
        return 'Water'
      case 'harvest':
        return 'Harvest'
      case 'fill':
        return 'Fill'
      case 'sell':
        return 'Sell'
      case 'pickup':
        return 'Pick up'
      case 'drop':
        return 'Drop'
      case 'inventory':
        return 'Inventory'
    }
  }

  taskProgress(): number {
    const head = this.queue[0]
    if (head === undefined) return 0
    if (this.workLeft > 0 && this.workTotal > 0) return 1 - this.workLeft / this.workTotal
    if (this.filling && this.hand.kind === 'hold' && this.hand.item.kind === 'container') {
      return this.hand.item.liters / this.hand.item.capacityLiters
    }
    const dest = destOf(head)
    if (!this.actor.inside(dest)) {
      const tx = dest.col + 0.5
      const ty = dest.row + 0.5
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
    if (made.kind === 'pumpjack') {
      if (this.money < sku.price) return 'Cannot afford'
      this.money -= sku.price
      this.pump.outputLitersPerSec = 5
      this.ping()
      return undefined
    }
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
    this.place = { kind: 'sku', id }
    this.ping()
    return undefined
  }

  confirmPlace(at: Coord): void {
    if (this.place.kind !== 'sku') return
    if (!inWorld(at) || !isPlot(this.cell(at))) return
    const sku = SKUS[this.place.id]
    if (this.money < sku.price) return
    const made = skuItem(this.place.id)
    if (made.kind === 'pumpjack' || made.kind === 'seeds') return
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
    if (!inWorld(at)) return
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

  sellSlot(i: number): void {
    const slot = this.inventory[i]
    if (slot.kind !== 'hold' || slot.item.kind !== 'fruit') return
    this.money += fruitMoney(this, slot.item.crop, slot.item.rarity, slot.item.count)
    this.inventory[i] = { kind: 'empty' }
    this.compactInventory()
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
    this.job = { kind: 'idle' }
    this.ping()
  }

  saleOffer(): SaleOffer {
    if (this.hand.kind !== 'hold') return { kind: 'blocked', text: 'Nothing to sell' }
    if (this.hand.item.kind === 'fruit') {
      const it = this.hand.item
      return { kind: 'ok', money: fruitMoney(this, it.crop, it.rarity, it.count), label: `${it.crop} ×${it.count}` }
    }
    if (this.hand.item.kind === 'box' && this.hand.item.cargo.kind === 'stack' && this.hand.item.cargo.goods === 'fruit') {
      const st = this.hand.item.cargo.stack
      return { kind: 'ok', money: fruitMoney(this, st.crop, st.rarity, st.count), label: `${st.crop} ×${st.count}` }
    }
    return { kind: 'blocked', text: 'Nothing to sell' }
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
      this.seam = {
        kind: 'recap',
        recap: {
          day: this.clock.day - 1,
          money: this.money,
          died: this.tally.died,
          harvests: this.tally.harvests,
          research: this.tally.research,
        },
      }
      this.tally = { died: 0, harvests: 0, research: [] }
      this.ping()
      return
    }
    this.tickJob(dt)
    this.tickQueue(dt)
    this.tickPlants(dt)
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
    const dest = destOf(next)
    if (!this.actor.inside(dest)) {
      this.actor.walkToward(dest, dt)
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
        this.arm((this.hand as { item: Extract<Item, { kind: 'shovel' }> }).item.workSeconds)
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
        if (!this.canFill()) {
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
    if (this.actor.inside(destOf(i))) return
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
    if (i.act === 'plant') this.doPlant(i.at)
    if (i.act === 'water') this.doWater(i.at)
    if (i.act === 'harvest') this.doHarvest(i.at)
    this.shiftHead()
  }

  private tickFill(dt: number): void {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'container') {
      this.filling = false
      this.shiftHead()
      return
    }
    const c = this.hand.item
    const miss = c.capacityLiters - c.liters
    if (miss <= 0) {
      this.filling = false
      this.pulse = { text: 'Fill', at: { col: 18, row: 1 } }
      this.shiftHead()
      return
    }
    const add = this.pump.outputLitersPerSec * dt
    c.liters = add >= miss ? c.capacityLiters : c.liters + add
    if (c.liters === c.capacityLiters) {
      this.filling = false
      this.pulse = { text: 'Fill', at: { col: 18, row: 1 } }
      this.shiftHead()
    }
  }

  private tickPlants(dt: number): void {
    let dirty = false
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const c = this.grid[row][col]
        if (c.kind !== 'growing' && c.kind !== 'ripe') continue
        const stage0 = c.plant.stage(c.kind)
        const bar0 = c.plant.thirst < HEALTH
        const st = c.plant.stats(this.modifiers)
        if (c.kind === 'growing') {
          c.plant.thirst -= st.waterUsePerSec * dt
          if (c.plant.thirst < 0) c.plant.thirst = 0
        }
        if (c.kind === 'growing' && c.plant.thirst <= 0) {
          this.grid[row][col] = { kind: 'dead', plant: c.plant }
          this.tally.died += 1
          dirty = true
          continue
        }
        if (c.kind === 'growing' && c.plant.thirst >= WITHER) {
          c.plant.maturity += dt / st.growSeconds
          if (c.plant.maturity >= 1) {
            c.plant.maturity = 1
            this.grid[row][col] = { kind: 'ripe', plant: c.plant }
            dirty = true
            continue
          }
        }
        const now = this.grid[row][col]
        if (now.kind !== 'growing' && now.kind !== 'ripe') continue
        if (now.plant.stage(now.kind) !== stage0 || now.plant.thirst < HEALTH !== bar0) dirty = true
      }
    }
    if (dirty) this.ping()
  }

  private canShovel(at: Coord): boolean {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'shovel') return false
    const c = this.cell(at)
    return isPlot(c)
  }

  private doShovel(at: Coord): void {
    if (!this.canShovel(at)) return
    const c = this.cell(at)
    const text =
      c.kind === 'dead' ? 'Dig out dead plant' : c.kind === 'growing' || c.kind === 'ripe' ? 'Dig up plant' : 'Dig'
    const s = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'shovel' }> }
    if (c.kind === 'growing' || c.kind === 'ripe') {
      this.drops.push({
        at: { ...at },
        item: { kind: 'seeds', crop: c.plant.crop, rarity: c.plant.rarity, count: 1 },
      })
    }
    this.grid[at.row][at.col] = { kind: 'empty' }
    s.item.usesLeft -= 1
    if (s.item.usesLeft <= 0) this.hand = { kind: 'empty' }
    this.pulse = { text, at: { ...at } }
  }

  private canPlant(at: Coord): boolean {
    if (this.hand.kind !== 'hold' || this.hand.item.kind !== 'seeds') return false
    return this.cell(at).kind === 'empty'
  }

  private doPlant(at: Coord): void {
    if (!this.canPlant(at)) return
    const s = this.hand as { kind: 'hold'; item: Extract<Item, { kind: 'seeds' }> }
    this.grid[at.row][at.col] = {
      kind: 'growing',
      plant: new Plant(s.item.crop, s.item.rarity),
    }
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
    if (this.cell(at).kind !== 'ripe') return false
    if (this.hand.kind === 'empty') return true
    if (this.hand.item.kind !== 'box') return false
    const p = (this.cell(at) as Extract<Plot, { kind: 'ripe' }>).plant
    return boxAccepts(this.hand.item, 'fruit', p.crop, p.rarity, 1) > 0
  }

  private doHarvest(at: Coord): void {
    if (!this.canHarvest(at)) return
    const p = (this.cell(at) as Extract<Plot, { kind: 'ripe' }>).plant
    this.grid[at.row][at.col] = { kind: 'empty' }
    this.tally.harvests += 1
    this.pulse = { text: 'Harvest', at: { ...at } }
    if (this.hand.kind === 'empty') {
      this.hand = { kind: 'hold', item: { kind: 'fruit', crop: p.crop, rarity: p.rarity, count: 1 } }
      return
    }
    if (this.hand.item.kind === 'box') boxAdd(this.hand.item, 'fruit', p.crop, p.rarity, 1)
  }

  private canFill(): boolean {
    return this.hand.kind === 'hold' && this.hand.item.kind === 'container'
  }

  private doPickup(at: Coord): void {
    const i = topIndex(this.drops, at)
    if (i < 0) return
    const taken = this.drops[i].item
    if (this.hand.kind === 'hold' && this.hand.item.kind === 'box' && (taken.kind === 'seeds' || taken.kind === 'fruit')) {
      const n = boxAdd(this.hand.item, taken.kind, taken.crop, taken.rarity, taken.count)
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
      this.money += fruitMoney(this, this.hand.item.crop, this.hand.item.rarity, this.hand.item.count)
      this.hand = { kind: 'empty' }
      this.pulse = { text: 'Sell', at: { ...DOOR } }
      return
    }
    if (this.hand.item.kind !== 'box') return
    const cargo = this.hand.item.cargo
    if (cargo.kind !== 'stack' || cargo.goods !== 'fruit') return
    this.money += fruitMoney(this, cargo.stack.crop, cargo.stack.rarity, cargo.stack.count)
    this.hand.item.cargo = { kind: 'empty' }
    this.pulse = { text: 'Sell', at: { ...DOOR } }
  }
}

function fruitMoney(w: World, crop: CropId, rarity: Rarity, n: number): number {
  return new Plant(crop, rarity).stats(w.modifiers).sale * n
}

function destOf(i: Intent): Coord {
  if (i.act === 'fill') return { col: 18, row: 1 }
  if (i.act === 'sell' || i.act === 'inventory') return { ...DOOR }
  return i.at
}

function buildGrid(house: House, pump: Pump): Cell[][] {
  const g: Cell[][] = []
  for (let row = 0; row < ROWS; row++) {
    const line: Cell[] = []
    for (let col = 0; col < COLS; col++) line.push({ kind: 'untilled' })
    g.push(line)
  }
  occupiedCells(house.base).forEach(({ col, row }) => {
    g[row][col] = house
  })
  occupiedCells(pump.base).forEach(({ col, row }) => {
    g[row][col] = pump
  })
  return g
}
