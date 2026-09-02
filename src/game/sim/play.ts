/**
 * THIS FILE IS FOR AI-INTERACTIVE GAMEPLAY - IT IS NOT A CORE GAMEPLAY LOOP MECHANIC FILE
 */
import type { Rarity } from '../defs/rarity.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { SKILLS } from '../defs/skills.ts'
import type { AdditiveId, ChunkId, Coord } from './building.ts'
import type {
  AnnualId,
  HarvestSlot,
  MemberId,
  ResearchId,
  SkuId,
  TrailerId,
  TrailerKind,
  VehicleId,
  VehicleKind,
  VehicleSlot,
} from './ids.ts'
import { cropName, heldText, skuLabel } from './item.ts'
import { Act } from './log.ts'
import type { ContractId } from './market.h.ts'
import { demandGood, filledOf, needOf, rollBoard } from './market.ts'
import type { Edge, Sprinkler, Vertex } from './pipe.ts'
import { isTilled, type Cell, type Tilled } from './plot.ts'
import { fertBand, waterBand } from './soil.ts'
import { DT_MAX, QUEUE_CAP, type Intent, type Recap, type World } from './world.ts'

export const DRAIN_MAX = 240

export type TurnAction =
  | { task: 'wait'; sec: number }
  | ({ task: 'enqueue' } & Intent)
  | { task: 'click'; at: Coord }
  | { task: 'build'; sku: SkuId; at: Coord }
  | { task: 'build'; sku: SkuId; edge: Edge }
  | { task: 'buy'; sku: SkuId; packs?: boolean }
  | { task: 'delete'; what: 'pipe' | 'well' | 'smart'; edge: Edge }
  | { task: 'delete'; what: 'sprinkler' | 'building'; at: Coord }
  | { task: 'valve'; edge: Edge }
  | { task: 'research'; id: ResearchId }
  | { task: 'market'; op: 'sellAll' }
  | { task: 'contract'; op: 'accept' | 'cancel'; id: ContractId }
  | { task: 'contract'; op: 'reorder'; id: ContractId; dir: 1 | -1 }
  | { task: 'skill'; member: MemberId; slot: number }
  | { task: 'expand'; chunk: ChunkId }
  | { task: 'swap'; i: number }
  | { task: 'swapChest'; at: Coord; i: number }
  | { task: 'take'; from: 'silo'; crop: AnnualId; rarity: Rarity }
  | { task: 'take'; from: 'additive'; id: AdditiveId }
  | { task: 'vehicle'; op: 'buy'; kind: VehicleKind; at: Coord }
  | { task: 'vehicle'; op: 'buyTrailer'; kind: TrailerKind; at: Coord }
  | { task: 'vehicle'; op: 'deploy'; id: VehicleId; at: Coord; hitch: TrailerId | 'none' }
  | { task: 'vehicle'; op: 'embark'; id: VehicleId }
  | { task: 'vehicle'; op: 'disembark' | 'dock' | 'load' | 'unload' }
  | { task: 'vehicle'; op: 'refill'; at: Coord }
  | { task: 'vehicle'; op: 'seat'; id: VehicleId; slot: VehicleSlot }
  | { task: 'vehicle'; op: 'trailerSlot'; id: TrailerId; slot: HarvestSlot }
  | { task: 'vehicle'; op: 'boom'; width: 3 | 5 }
  | { task: 'vehicle'; op: 'drive'; throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }

export type TaskResult = { n: number; task: string; ok: boolean; note: string }

export type FieldRow = {
  at: Coord
  kind: Tilled['kind']
  crop: string
  maturity: number
  freshness: number
  water: number
  fertilizer: number
  band: { water: string; fert: string }
  flag: string
}

export type BuildingRow = { at: Coord; kind: string; status: string }

export type ContractRow = {
  id: ContractId
  company: string
  good: string
  filled: number
  need: number
  due: number
  reward: number
}

export type BoardRow = { id: ContractId; company: string; good: string; need: number; days: number; reward: number }

export type Snapshot = {
  text: string
  day: number
  t: number
  phase: string
  money: number
  points: number
  job: string
  seat: { at: Coord; hand: string; queue: string[] }
  counts: { [k: string]: number }
  attention: FieldRow[]
  buildings: BuildingRow[]
  contracts: ContractRow[]
  board: BoardRow[]
  market: { open: boolean; sellAll: number }
}

export type TurnReport = Snapshot & {
  elapsed: number
  drained: 'idle' | 'cap'
  tasks: TaskResult[]
  days: Recap[]
}

const EDGE_SKUS: readonly SkuId[] = ['buy-pipe', 'buy-valve', 'buy-well']

const SPRINKLER_SKUS: readonly SkuId[] = ['buy-sprinkler', 'buy-sprinkler-vert', 'buy-sprinkler-large']

function f2(n: number): string {
  return n.toFixed(2)
}

function coordText(at: Coord): string {
  return `${at.col},${at.row}`
}

function sprinklerOf(sku: SkuId, at: Vertex): Sprinkler {
  if (sku === 'buy-sprinkler-vert') return { variant: 'vert', at, facing: 'ns', tune: { kind: 'flat' }, inn: 0, hold: 0 }
  if (sku === 'buy-sprinkler-large') return { variant: 'large', at, tune: { kind: 'flat' }, inn: 0, hold: 0 }
  return { variant: 'basic', at, tune: { kind: 'flat' }, inn: 0, hold: 0 }
}

function taskText(a: TurnAction): string {
  if (a.task === 'enqueue') return `enqueue ${a.act}`
  if (a.task === 'build') return `build ${a.sku}`
  if (a.task === 'buy') return `buy ${a.sku}`
  if (a.task === 'research') return `research ${a.id}`
  if (a.task === 'contract') return `contract ${a.op} #${a.id}`
  if (a.task === 'vehicle') return `vehicle ${a.op}`
  if (a.task === 'delete') return `delete ${a.what}`
  if (a.task === 'take') return `take ${a.from}`
  if (a.task === 'wait') return `wait ${a.sec}s`
  if (a.task === 'market') return 'market sellAll'
  return a.task
}

function plotCrop(c: Tilled): string {
  if (c.kind === 'growing' || c.kind === 'ripe' || c.kind === 'dead') return cropName(c.plant.crop)
  if (c.kind === 'rotten') return cropName(c.crop)
  if (c.kind === 'weed') return 'weeds'
  if (c.kind === 'turf') return 'grass'
  return 'bare'
}

function fieldRow(world: World, at: Coord, c: Tilled): FieldRow {
  const planted = c.kind === 'growing' || c.kind === 'ripe' || c.kind === 'dead'
  const stats = planted ? c.plant.stats(world.modifiers) : undefined
  const wb = stats === undefined ? 'n/a' : waterBand(c.soil.water, stats.waterTolerance)
  const fb = stats === undefined ? 'n/a' : fertBand(c.soil.fertilizer, stats.fertTolerance)
  const flag = [
    c.kind === 'ripe' ? 'ripe' : '',
    c.kind === 'dead' ? 'dead' : '',
    c.kind === 'rotten' ? 'rotten' : '',
    c.kind === 'weed' ? 'weed' : '',
    wb === 'red' ? (c.soil.drowning ? 'drown' : 'wilt') : '',
    fb === 'red' ? 'starve' : '',
  ]
    .filter(s => s !== '')
    .join(' ')
  return {
    at,
    kind: c.kind,
    crop: plotCrop(c),
    maturity: planted ? c.plant.maturity : 0,
    freshness: planted ? c.plant.freshness : 0,
    water: c.soil.water,
    fertilizer: c.soil.fertilizer,
    band: { water: wb, fert: fb },
    flag,
  }
}

function fieldText(r: FieldRow): string {
  const grown = r.kind === 'growing' || r.kind === 'ripe' || r.kind === 'dead'
  const m = grown ? ` m${f2(r.maturity)} f${f2(r.freshness)}` : ''
  const tail = r.flag === '' ? '' : `  ${r.flag}`
  return `${coordText(r.at)} ${r.crop} ${r.kind}${m} w:${r.band.water} n:${r.band.fert}${tail}`
}

function buildingStatus(c: Cell): string {
  switch (c.kind) {
    case 'grinder':
    case 'mill':
    case 'compost-box':
      return `units ${c.units} progress ${f2(c.progress)}`
    case 'jam':
      return `fruit ${c.fruit} sugar ${c.sugar} progress ${f2(c.progress)}`
    case 'still':
      return `n ${c.n} progress ${f2(c.progress)}`
    case 'barrel':
      return `n ${c.n} age ${f2(c.age)}`
    case 'chest':
      return `${c.slots.filter(s => s.kind === 'hold').length}/${c.slots.length} slots`
    case 'freezer':
      return `${c.slots.filter(s => s.kind === 'hold').length}/${c.slots.length} slots`
    case 'tree':
      return `${c.species} fruit ${c.fruit}`
    default:
      return ''
  }
}

function isBuilding(c: Cell): boolean {
  return (
    c.kind !== 'untilled' &&
    c.kind !== 'empty' &&
    c.kind !== 'infertile' &&
    c.kind !== 'weed' &&
    c.kind !== 'turf' &&
    c.kind !== 'growing' &&
    c.kind !== 'ripe' &&
    c.kind !== 'dead' &&
    c.kind !== 'rotten'
  )
}

function jobText(world: World): string {
  return world.job.kind === 'idle' ? 'idle' : `${world.job.id} ${f2(world.job.left)}s left`
}

function contractRows(world: World): ContractRow[] {
  return world.contracts.active.map(a => ({
    id: a.offer.id,
    company: a.offer.company,
    good: a.bins.map(b => demandGood(b.demand)).join(' + '),
    filled: filledOf(a),
    need: needOf(a),
    due: a.dueDay,
    reward: a.offer.reward,
  }))
}

function boardRows(world: World): BoardRow[] {
  return rollBoard(world.rng, world.clock.day, world.contractSlots(), world.contracts.repDay)
    .filter(o => !world.contracts.takenToday.includes(o.id))
    .map(o => ({
      id: o.id,
      company: o.company,
      good: o.lines.map(l => demandGood(l)).join(' + '),
      need: o.lines.reduce((n, l) => n + l.amount, 0),
      days: o.days,
      reward: o.reward,
    }))
}

function snapshot(world: World): Snapshot {
  const seat = world.seats[world.local]
  const counts: { [k: string]: number } = {}
  const attention: FieldRow[] = []
  const buildings: BuildingRow[] = []
  const seen = new Set<Cell>()
  let rocks = 0
  world.forEachCell((at, cell) => {
    if (isBuilding(cell)) {
      if (seen.has(cell)) return
      seen.add(cell)
      if (cell.kind === 'rock') {
        rocks += 1
        return
      }
      buildings.push({ at, kind: cell.kind, status: buildingStatus(cell) })
      return
    }
    if (!isTilled(cell)) return
    counts[cell.kind] = (counts[cell.kind] ?? 0) + 1
    const row = fieldRow(world, at, cell)
    if (row.flag !== '') attention.push(row)
  })
  const tilled = Object.values(counts).reduce((a, b) => a + b, 0)
  const contracts = contractRows(world)
  const board = boardRows(world)
  const open = world.marketOpen()
  const sellAll = open ? world.marketQuote().paid : 0
  const head = [
    `day ${world.clock.day}  t ${Math.round(world.clock.t)}/240 ${world.clock.phase()}  $${Math.round(world.money)}  pts ${world.points}  job ${jobText(world)}`,
    `YOU ${coordText({ col: Math.floor(seat.actor.x), row: Math.floor(seat.actor.y) })}  hand ${heldText(seat.hand, world.modifiers)}  queue ${seat.queue.length}`,
    `FIELDS ${tilled} tilled - ${Object.entries(counts)
      .map(([k, n]) => `${n} ${k}`)
      .join(', ')}`,
    ...attention.map(r => `  ! ${fieldText(r)}`),
    `BUILDINGS ${buildings.length}${rocks === 0 ? '' : ` (+${rocks} rocks)`}`,
    ...buildings.map(b => `  ${coordText(b.at)} ${b.kind}${b.status === '' ? '' : ` ${b.status}`}`),
    `CONTRACTS ${contracts.length}/${world.contractCap()}  rep ${world.contracts.rep}`,
    ...contracts.map(c => `  #${c.id} ${c.company} ${c.filled}/${c.need} ${c.good} due day ${c.due} $${c.reward}`),
    `BOARD ${board.length}`,
    ...board.map(b => `  #${b.id} ${b.company} ${b.need} ${b.good} ${b.days}d $${b.reward}`),
    `MARKET ${open ? `open - sell all $${Math.round(sellAll)}` : 'closed'}`,
  ]
  return {
    text: head.join('\n'),
    day: world.clock.day,
    t: world.clock.t,
    phase: world.clock.phase(),
    money: world.money,
    points: world.points,
    job: jobText(world),
    seat: {
      at: { col: Math.floor(seat.actor.x), row: Math.floor(seat.actor.y) },
      hand: heldText(seat.hand, world.modifiers),
      queue: seat.queue.map(i => world.taskName(i)),
    },
    counts,
    attention,
    buildings,
    contracts,
    board,
    market: { open, sellAll },
  }
}

function place(world: World, sku: SkuId, at: Coord | undefined, edge: Edge | undefined): string {
  if (!world.skuOpen(sku)) return 'Locked'
  if (world.money < world.skuPrice(sku)) return 'Cannot afford'
  const fail = world.buy(sku)
  if (fail !== undefined) return fail
  if (EDGE_SKUS.includes(sku)) {
    if (edge === undefined) return 'Needs an edge'
    const before = world.hasPipe(edge) || world.hasWell(edge)
    world.placePipe(edge)
    const after = world.hasPipe(edge) || world.hasWell(edge)
    world.cancelPlace()
    return sku === 'buy-valve' ? (world.hasValve(edge) ? '' : 'no effect') : before === after ? 'no effect' : ''
  }
  if (at === undefined) return 'Needs a cell'
  if (SPRINKLER_SKUS.includes(sku)) {
    world.placeSprinkler(sprinklerOf(sku, at))
    const ok = world.sprinklerAt(at) !== undefined
    world.cancelPlace()
    return ok ? '' : 'no effect'
  }
  const r = world.click(at)
  world.cancelPlace()
  return r === 'placed' ? '' : r
}

function remove(world: World, a: Extract<TurnAction, { task: 'delete' }>): string {
  world.armDelete()
  switch (a.what) {
    case 'pipe':
      world.deletePipe(a.edge)
      break
    case 'well':
      world.deleteWell(a.edge)
      break
    case 'sprinkler':
      world.deleteSprinkler(a.at)
      break
    case 'building':
      world.deleteBuilding(a.at)
      break
  }
  world.cancelPlace()
  return ''
}

function vehicle(world: World, a: Extract<TurnAction, { task: 'vehicle' }>): string {
  switch (a.op) {
    case 'buy':
      return count(world.vehicles.length, () => world.buyVehicle(a.at, a.kind), () => world.vehicles.length)
    case 'buyTrailer':
      return count(world.trailers.length, () => world.buyTrailer(a.at, a.kind), () => world.trailers.length)
    case 'deploy':
      world.deploy(a.id, a.at, a.hitch)
      return ''
    case 'embark':
      world.embark(a.id)
      return ''
    case 'disembark':
      world.disembark()
      return world.driverVehicle(world.local) === undefined ? '' : 'no effect'
    case 'dock':
      world.dock()
      return ''
    case 'load':
      if (!world.canLoad()) return 'Cannot load here'
      world.load()
      return ''
    case 'unload':
      if (!world.canUnload()) return 'Cannot unload here'
      world.unload()
      return ''
    case 'refill':
      world.refill(a.at)
      return ''
    case 'seat':
      world.swapVehicle(a.id, a.slot)
      return ''
    case 'trailerSlot':
      world.swapTrailer(a.id, a.slot)
      return ''
    case 'boom':
      world.setBoom(a.width)
      return ''
    case 'drive':
      world.drive(a.throttle, a.steer)
      return ''
  }
}

function count(before: number, run: () => void, after: () => number): string {
  run()
  return after() === before ? 'no effect' : ''
}

function act(world: World, a: TurnAction): string {
  const seat = world.seats[world.local]
  switch (a.task) {
    case 'wait':
      return ''
    case 'enqueue': {
      if (seat.queue.length >= QUEUE_CAP) return `Queue full (${QUEUE_CAP})`
      const { task: _t, ...intent } = a
      const before = seat.queue.length
      world.commit({ a: Act.enqueue, t: world.now, p: world.local, i: intent as Intent })
      return seat.queue.length === before ? 'no effect' : ''
    }
    case 'click': {
      const r = world.click(a.at)
      return r === 'blocked' || r === 'noop' ? `${r} - ${world.prompt(a.at).text}` : ''
    }
    case 'build':
      return place(world, a.sku, 'at' in a ? a.at : undefined, 'edge' in a ? a.edge : undefined)
    case 'buy': {
      if (!world.skuOpen(a.sku)) return 'Locked'
      if (a.packs === true) {
        const fail = world.buyPacksFail(a.sku)
        if (fail !== undefined) return fail
        world.buyPacks(a.sku)
        return ''
      }
      const fail = world.buy(a.sku)
      return fail ?? ''
    }
    case 'delete':
      return remove(world, a)
    case 'valve':
      world.clickValve(a.edge)
      return ''
    case 'research': {
      if (world.done.has(a.id)) return 'Already done'
      if (world.job.kind === 'run') return `Busy with ${world.job.id}`
      if (!world.researchOpen(a.id)) return 'Prerequisites not done'
      if (world.money < RESEARCH[a.id].cost) return 'Cannot afford'
      world.startResearch(a.id)
      return ''
    }
    case 'market': {
      if (!world.marketOpen()) return 'Stall closed'
      if (world.marketQuote().paid === 0) return 'Nothing to sell'
      world.sellAll()
      return ''
    }
    case 'contract': {
      if (a.op === 'reorder') {
        world.reorderContract(a.id, a.dir)
        return ''
      }
      const n = world.contracts.active.length
      if (a.op === 'accept') {
        if (n >= world.contractCap()) return `Contract slots full (${world.contractCap()})`
        world.acceptContract(a.id)
        return world.contracts.active.length === n ? 'no effect' : ''
      }
      world.cancelContract(a.id)
      return world.contracts.active.length === n ? 'no effect' : ''
    }
    case 'skill': {
      if (world.points < 1) return 'No skill points'
      const before = world.points
      world.pickSkill(a.member, a.slot)
      return world.points === before ? 'no effect' : ''
    }
    case 'expand': {
      if (world.money < world.expandPrice()) return 'Cannot afford'
      if (world.expandLeft() < 1) return 'No expansion slots'
      world.expand(a.chunk)
      return ''
    }
    case 'swap':
      world.swap(a.i)
      return ''
    case 'swapChest':
      world.swapChest(a.at, a.i)
      return ''
    case 'take':
      if (a.from === 'silo') world.commit({ a: Act.takeStore, t: world.now, p: world.local, k: 'silo', c: a.crop, r: a.rarity })
      else world.commit({ a: Act.takeStore, t: world.now, p: world.local, k: 'additive', d: a.id })
      return ''
    case 'vehicle':
      return vehicle(world, a)
  }
}

type Witness = { n: number; act: string; at: Coord; before: number | string }

const KIND_ACTS = ['shovel', 'mine', 'harvest', 'plant', 'weed-spray']

const SOIL_ACTS = ['water', 'fertilize', 'compost']

function witnessOf(world: World, act: string, at: Coord): number | string | undefined {
  const c = world.cell(at)
  if (KIND_ACTS.includes(act)) return c.kind
  if (!isTilled(c)) return SOIL_ACTS.includes(act) || act === 'tend' ? 'no soil' : undefined
  if (act === 'water') return c.soil.water
  if (SOIL_ACTS.includes(act)) return c.soil.fertilizer
  if (act === 'tend') return c.kind === 'growing' || c.kind === 'ripe' ? String(c.plant.tended) : 'no plant'
  return undefined
}

function landed(world: World, w: Witness): boolean {
  const now = witnessOf(world, w.act, w.at)
  if (now === undefined) return true
  if (SOIL_ACTS.includes(w.act)) return typeof w.before === 'number' && (now as number) > w.before
  return now !== w.before
}

function step(world: World, days: Recap[]): void {
  world.tick(DT_MAX)
  if (world.seam.kind !== 'recap') return
  days.push(world.seam.recap)
  world.dismissRecap()
}

function busy(world: World): boolean {
  const seat = world.seats[world.local]
  return seat.queue.length > 0 || seat.workLeft > 0 || seat.filling
}

export function turn(world: World, actions: readonly TurnAction[]): TurnReport {
  const tasks: TaskResult[] = []
  const days: Recap[] = []
  const watch: Witness[] = []
  let ticks = 0
  actions.forEach((a, i) => {
    const seen = a.task === 'enqueue' && 'at' in a ? witnessOf(world, a.act, a.at) : undefined
    const note = act(world, a)
    tasks.push({ n: i + 1, task: taskText(a), ok: note === '', note })
    if (a.task === 'enqueue' && 'at' in a && note === '' && seen !== undefined) {
      watch.push({ n: i + 1, act: a.act, at: a.at, before: seen })
    }
    if (a.task !== 'wait') return
    const n = Math.ceil(a.sec / DT_MAX)
    for (let k = 0; k < n; k++) {
      step(world, days)
      ticks += 1
    }
  })
  const cap = Math.ceil(DRAIN_MAX / DT_MAX)
  let drained: 'idle' | 'cap' = 'idle'
  let k = 0
  while (busy(world)) {
    if (k >= cap) {
      drained = 'cap'
      break
    }
    step(world, days)
    ticks += 1
    k += 1
  }
  watch
    .filter(v => !landed(world, v))
    .forEach(v => {
      const t = tasks[v.n - 1]
      t.ok = false
      t.note = 'dropped - illegal when it ran'
    })
  world.ping()
  const snap = snapshot(world)
  const elapsed = ticks * DT_MAX
  const failed = tasks.filter(t => !t.ok)
  const text = [
    snap.text.split('\n')[0],
    `TURN +${f2(elapsed)}s, drained ${drained}`,
    ...snap.text.split('\n').slice(1),
    `TASKS ${tasks.length}: ${tasks.length - failed.length} ok ${failed.length} failed`,
    ...failed.map(t => `  #${t.n} ${t.task} - ${t.note}`),
    days.length === 0
      ? 'DAYS 0'
      : `DAYS +${days.length}  ${days
          .map(d => `day ${d.day}: +$${d.stipend} -$${Math.round(d.tax)}, ${d.harvests} harvests, ${d.died} died`)
          .join(' | ')}`,
  ].join('\n')
  return { ...snap, text, elapsed, drained, tasks, days }
}

export type PlayApi = {
  turn(actions: readonly TurnAction[]): TurnReport
  state(): Snapshot
  fields(): FieldRow[]
  look(at: Coord): { text: string; intent: Intent | 'none' }
  research(): { id: ResearchId; name: string; cost: number; seconds: number; done: boolean; open: boolean }[]
  shop(): { id: SkuId; name: string; price: number; tab: string }[]
  skills(): { member: MemberId; slot: number; id: string; name: string; tier: number; max: number }[]
  world: World
  help(): string
}

const HELP = `window.play - turn-based API. Actions are data; no callbacks, no control flow.

play.turn([...TurnAction]) runs the list, then plays out queued work until idle.
  { task:'wait', sec }                         extra idle time on top
  { task:'enqueue', act, at }                  act: walk shovel mine plant water fertilize
                                               compost harvest fill pickup drop chest silo
                                               additives grind still barrel jam mill hangar
                                               toggle tend weed-spray consign inventory
  { task:'click', at }                         whatever the tile affords - see play.look(at)
  { task:'build', sku, at }                    buildings, sensors, sprinklers
  { task:'build', sku, edge }                  buy-pipe buy-valve buy-well
  { task:'buy', sku, packs? }
  { task:'delete', what, at|edge }             pipe well smart sprinkler building
  { task:'valve', edge }
  { task:'research', id }
  { task:'market', op:'sellAll' }
  { task:'contract', op, id, dir? }            accept cancel reorder
  { task:'skill', member, slot }
  { task:'expand', chunk }
  { task:'swap', i } | { task:'swapChest', at, i }
  { task:'take', from:'silo', crop, rarity } | { task:'take', from:'additive', id }
  { task:'vehicle', op, ... }                  buy buyTrailer deploy embark disembark dock
                                               load unload refill seat trailerSlot boom drive

Reads: play.state() play.fields() play.look(at) play.research() play.shop() play.skills() play.world

Not implemented: route editing, wire placement.`

export function installPlay(world: World, hold: { current: boolean }): () => void {
  const api: PlayApi = {
    turn: actions => {
      hold.current = true
      return turn(world, actions)
    },
    state: () => snapshot(world),
    fields: () => {
      const rows: FieldRow[] = []
      world.forEachCell((at, cell) => {
        if (isTilled(cell)) rows.push(fieldRow(world, at, cell))
      })
      return rows
    },
    look: at => {
      const p = world.prompt(at)
      return { text: p.text, intent: p.kind === 'intent' ? p.intent : 'none' }
    },
    research: () =>
      Object.values(RESEARCH).map(r => ({
        id: r.id,
        name: r.name,
        cost: r.cost,
        seconds: r.seconds,
        done: world.done.has(r.id),
        open: world.researchOpen(r.id),
      })),
    shop: () =>
      Object.values(SKUS)
        .filter(s => world.skuOpen(s.id))
        .map(s => ({ id: s.id, name: skuLabel(s.id), price: world.skuPrice(s.id), tab: s.tab })),
    skills: () =>
      (['player', 'husband', 'daughter'] as const).flatMap(m =>
        world.offers(m).map((ref, slot) => ({
          member: m,
          slot,
          id: ref.id,
          name: SKILLS[ref.id].name,
          tier: world.skillTier(ref.id),
          max: SKILLS[ref.id].maxTier,
        })),
      ),
    world,
    help: () => HELP,
  }
  ;(window as unknown as { play?: PlayApi }).play = api
  return () => {
    hold.current = false
    delete (window as unknown as { play?: PlayApi }).play
  }
}
