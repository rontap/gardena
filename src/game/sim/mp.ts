import { SKUS } from '../defs/research.ts'
import type { SkuId } from './ids.ts'
import { Act, type Cmd } from './log.ts'
import type { TrailerPose, VehiclePose } from './vehicle.ts'
import { dump, parse, type Save } from './save.ts'
import { cleanName, DT_MAX, type PlayerId, type Presence, type SeatId, type World } from './world.ts'

export const PROTOCOL = 2.03

/** Ticks between digest checks. */
export const DIGEST_EVERY = 30

export type MpMsg =
  // `desyncT` marks a hello sent because a digest mismatched, and names the digest `t` it failed
  // on. Absent means an ordinary join or a stall retry. Keyed on `t` so it survives any RTT.
  | { a: 'hello'; protocol: number; playerId: PlayerId; name: string; desyncT?: number }
  | { a: 'welcome'; protocol: number; seat: SeatId; save: Save; now: number; paused: boolean }
  | { a: 'reject'; reason: 'version' | 'full' | 'busy' }
  | { a: 'ready' }
  | { a: 'ping' }
  | { a: 'bundle'; t: number; cmds: Cmd[] }
  | { a: 'intent'; cmd: Cmd }
  | { a: 'pause'; on: boolean }
  | { a: 'digest'; t: number; hex: string }
  | { a: 'resync'; save: Save; now: number }
  | { a: 'roster'; seats: RosterSeat[] }
  // 'lost' is the transport dropping under us; only 'host-left' means the host meant it.
  | { a: 'bye'; why: 'host-left' | 'kicked' | 'lost' }

export type MpWire = {
  send(msg: MpMsg): void
  onRecv(fn: (msg: MpMsg) => void): void
  close(): void
}

export type RejectReason = 'version' | 'full' | 'busy'

export type RosterSeat = { id: SeatId; name: string; presence: Presence; napping: boolean }

const GUEST_BUILD: ReadonlySet<SkuId> = new Set([
  'buy-pumpjack',
  'buy-well',
  'buy-rain-tank',
  'buy-tap',
  'buy-chest',
  'buy-grinder',
  'buy-compost-box',
  'buy-mill',
  'buy-jam',
  'buy-still',
  'buy-barrel',
  'buy-freezer',
  'buy-freezer-large',
  'buy-hangar',
  'buy-silo-seed',
  'buy-silo-spray',
  'buy-silo-produce',
  'buy-lever',
  'buy-button',
  'buy-lamp',
  'buy-or',
  'buy-and',
  'buy-not',
  'buy-pulser',
  'buy-counter',
  'buy-sensor-water',
  'buy-sensor-fert',
  'buy-sensor-harvest',
  'buy-sensor-day',
  'buy-water-system',
  'buy-vehicle-detector',
  'buy-traffic-light',
])

const GUEST_PIPE: ReadonlySet<SkuId> = new Set([
  'buy-pipe',
  'buy-valve',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-tile-paved',
  'buy-tile-brick',
  'buy-tile-cobble',
  'buy-fence',
])

function isRec(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function seatId(n: unknown): SeatId | undefined {
  if (n === 0 || n === 1 || n === 2 || n === 3) return n
  return undefined
}

export function readMpMsg(data: unknown): MpMsg | undefined {
  if (!isRec(data)) return undefined
  switch (data.a) {
    case 'hello': {
      if (typeof data.protocol !== 'number' || typeof data.playerId !== 'string') return undefined
      const name = typeof data.name === 'string' ? cleanName(data.name) : ''
      const desyncT = typeof data.desyncT === 'number' ? data.desyncT : undefined
      return { a: 'hello', protocol: data.protocol, playerId: data.playerId, name, desyncT }
    }
    case 'welcome': {
      const seat = seatId(data.seat)
      if (
        typeof data.protocol !== 'number' ||
        seat === undefined ||
        !isRec(data.save) ||
        typeof data.now !== 'number' ||
        typeof data.paused !== 'boolean'
      ) {
        return undefined
      }
      return { a: 'welcome', protocol: data.protocol, seat, save: data.save as Save, now: data.now, paused: data.paused }
    }
    case 'reject': {
      if (data.reason !== 'version' && data.reason !== 'full' && data.reason !== 'busy') return undefined
      return { a: 'reject', reason: data.reason }
    }
    case 'ready':
      return { a: 'ready' }
    case 'ping':
      return { a: 'ping' }
    case 'bundle': {
      if (typeof data.t !== 'number' || !Array.isArray(data.cmds)) return undefined
      return { a: 'bundle', t: data.t, cmds: data.cmds as Cmd[] }
    }
    case 'intent': {
      if (!isRec(data.cmd)) return undefined
      return { a: 'intent', cmd: data.cmd as Cmd }
    }
    case 'pause': {
      if (typeof data.on !== 'boolean') return undefined
      return { a: 'pause', on: data.on }
    }
    case 'digest': {
      if (typeof data.t !== 'number' || typeof data.hex !== 'string') return undefined
      return { a: 'digest', t: data.t, hex: data.hex }
    }
    case 'resync': {
      if (!isRec(data.save) || typeof data.now !== 'number') return undefined
      return { a: 'resync', save: data.save as Save, now: data.now }
    }
    case 'roster': {
      const rows = Array.isArray(data.seats) ? data.seats : undefined
      if (rows === undefined) return undefined
      const seats: RosterSeat[] = []
      for (const raw of rows) {
        if (!isRec(raw)) return undefined
        const id = seatId(raw.id)
        if (id === undefined || typeof raw.name !== 'string') return undefined
        if (raw.presence !== 'in' && raw.presence !== 'away') return undefined
        if (typeof raw.napping !== 'boolean') return undefined
        seats.push({ id, name: cleanName(raw.name), presence: raw.presence, napping: raw.napping })
      }
      return { a: 'roster', seats }
    }
    case 'bye': {
      if (data.why !== 'host-left' && data.why !== 'kicked' && data.why !== 'lost') return undefined
      return { a: 'bye', why: data.why }
    }
    default:
      return undefined
  }
}

export function rosterOf(world: World): RosterSeat[] {
  return world.seats.map(s => ({ id: s.id, name: s.name, presence: s.presence, napping: s.napping }))
}

/** Presence and names never ride the command log, so the host pushes them directly. */
export function applyRoster(world: World | undefined, rows: RosterSeat[]): void {
  if (world === undefined) return
  rows.forEach(row => {
    const seat = world.seats[row.id]
    if (seat === undefined) return
    seat.name = row.name
    seat.presence = row.presence
    seat.napping = row.napping
  })
  world.ping()
}

export function loopback(): [MpWire, MpWire] {
  let aFn: ((msg: MpMsg) => void) | undefined
  let bFn: ((msg: MpMsg) => void) | undefined
  const a: MpWire = {
    send(msg) {
      if (bFn !== undefined) bFn(msg)
    },
    onRecv(fn) {
      aFn = fn
    },
    close() {
      aFn = undefined
      bFn = undefined
    },
  }
  const b: MpWire = {
    send(msg) {
      if (aFn !== undefined) aFn(msg)
    },
    onRecv(fn) {
      bFn = fn
    },
    close() {
      aFn = undefined
      bFn = undefined
    },
  }
  return [a, b]
}

export type Jitter = {
  pending(): number
  /** Deliver the queued batch. `order` is indices into that batch, so a test can reorder it. */
  deliver(order?: number[]): void
  /** Deliver everything, in order, until nothing is left. */
  flush(): void
  /** Deliver the batch with adjacent pairs swapped: the cheapest realistic reordering. */
  swap(): void
}

/**
 * `loopback` delivers synchronously and in order, which is exactly what a WebRTC data channel
 * does not guarantee. This pair holds messages so a test can deliver them out of order.
 */
export function jitterLoopback(): [MpWire, MpWire, Jitter] {
  let aFn: ((msg: MpMsg) => void) | undefined
  let bFn: ((msg: MpMsg) => void) | undefined
  let queue: { to: 'a' | 'b'; msg: MpMsg }[] = []
  const shut = () => {
    aFn = undefined
    bFn = undefined
    queue = []
  }
  const a: MpWire = {
    send(msg) {
      queue.push({ to: 'b', msg })
    },
    onRecv(fn) {
      aFn = fn
    },
    close: shut,
  }
  const b: MpWire = {
    send(msg) {
      queue.push({ to: 'a', msg })
    },
    onRecv(fn) {
      bFn = fn
    },
    close: shut,
  }
  const hand = (e: { to: 'a' | 'b'; msg: MpMsg } | undefined) => {
    if (e === undefined) return
    const fn = e.to === 'a' ? aFn : bFn
    if (fn !== undefined) fn(e.msg)
  }
  // A handler may send while being delivered, so take the batch first: those land in the next one.
  const take = () => {
    const batch = queue
    queue = []
    return batch
  }
  const jitter: Jitter = {
    pending: () => queue.length,
    deliver(order) {
      const batch = take()
      const ix = order ?? batch.map((_, i) => i)
      ix.forEach(i => hand(batch[i]))
    },
    flush() {
      for (let guard = 0; queue.length > 0 && guard < 1000; guard++) jitter.deliver()
    },
    swap() {
      const batch = take()
      const ix = batch.map((_, i) => i)
      for (let i = 0; i + 1 < ix.length; i += 2) [ix[i], ix[i + 1]] = [ix[i + 1], ix[i]]
      ix.forEach(i => hand(batch[i]))
    },
  }
  return [a, b, jitter]
}

export function permit(cmd: Cmd): boolean {
  if (cmd.p === 0) return true
  switch (cmd.a) {
    case Act.startResearch:
      // TODO 1.1 multiplayer guest research start
      return false
    case Act.pickSkill:
      // TODO 1.1 multiplayer guest family pick
      return false
    case Act.expand:
      // TODO 1.1 multiplayer guest expand
      return false
    case Act.placePipe:
    case Act.placeSprinkler:
    case Act.clickValve:
    case Act.clickWell:
    case Act.rotatePlace:
      // TODO 1.1 multiplayer guest pipe/valve/sprinkler/tile/fence
      return false
    case Act.swapChest:
      // TODO 1.1 multiplayer guest chest swap
      return false
    case Act.delete:
      if (cmd.k === 'building' || cmd.k === 'wire') return true
      return false
    case Act.tuneSprinkler:
    case Act.dismissRecap:
    case Act.cheat:
    case Act.acceptContract:
    case Act.cancelContract:
    case Act.reorderContract:
      return false
    case Act.openHud:
      return cmd.k === 'water' || cmd.k === 'harvest' || cmd.k === 'counter' || cmd.k === 'day'
    case Act.buy:
      if (GUEST_PIPE.has(cmd.s)) return false
      if (SKUS[cmd.s].tab === 'seeds' || SKUS[cmd.s].tab === 'utility') return true
      return GUEST_BUILD.has(cmd.s)
    case Act.buyPacks:
      return SKUS[cmd.s].tab === 'seeds'
    default:
      return true
  }
}

export function guestBlockedSku(id: SkuId): boolean {
  return GUEST_PIPE.has(id)
}

export function applyBundle(world: World, cmds: Cmd[]): void {
  cmds.forEach(c => world.apply(c))
  world.tick(DT_MAX)
}

/**
 * `Math.sin/cos/atan2/hypot/exp` are implementation-approximated: two engines can differ by an
 * ULP, and vehicle poses and actor positions are integrated through them every tick. Hashing raw
 * floats turns that into a resync storm between a host and a guest on different machines. Four
 * decimals is far finer than anything a player can see and far coarser than that drift.
 *
 * This bounds false positives; it does not make the sim bit-identical across engines. Real
 * cross-engine determinism means fixed-point integration, which is a separate decision.
 */
const PLACES = 1e4
function q(n: number): number {
  return Math.round(n * PLACES) / PLACES
}

function qVehiclePose(pose: VehiclePose): unknown {
  if (pose.kind === 'stored') return pose
  return { ...pose, x: q(pose.x), y: q(pose.y), heading: q(pose.heading), speed: q(pose.speed) }
}

function qTrailerPose(pose: TrailerPose): unknown {
  if (pose.kind === 'stored') return pose
  return { ...pose, heading: q(pose.heading) }
}

/** The digest, section by section. `digestHex` hashes the lot; `digestSections` is for telling a
 * human *which* part drifted, which one 32-bit number never can. */
export function digestParts(world: World): Record<string, unknown> {
  const cells: string[] = []
  world.forEachCell((at, c) => {
    let s = `${at.col},${at.row}:${c.kind}`
    if (c.kind === 'growing' || c.kind === 'ripe' || c.kind === 'dead') {
      s += `:${c.plant.crop}:${c.plant.rarity}:${q(c.plant.maturity)}`
    }
    if (c.kind === 'lamp' || c.kind === 'mill' || c.kind === 'jam' || c.kind === 'still') s += `:inn${c.inn}`
    else if (c.kind === 'lever' || c.kind === 'pulser' || c.kind === 'counter') s += `:inn${c.inn}:out${c.out}`
    else if (c.kind === 'traffic-light') s += `:inn${c.inn}:out${c.out}:hold${c.hold}`
    else if (
      c.kind === 'button' ||
      c.kind === 'or' ||
      c.kind === 'and' ||
      c.kind === 'not' ||
      c.kind === 'sensor-water' ||
      c.kind === 'sensor-fert' ||
      c.kind === 'sensor-harvest' ||
      c.kind === 'sensor-day' ||
      c.kind === 'water-system' ||
      c.kind === 'vehicle-detector' ||
      c.kind === 'chest' ||
      c.kind === 'freezer' ||
      c.kind === 'seed-silo' ||
      c.kind === 'additive-store'
    ) {
      s += `:out${c.out}`
    }
    cells.push(s)
  })
  const seats = world.seats.map(s => ({
    id: s.id,
    x: q(s.actor.x),
    y: q(s.actor.y),
    hand: s.hand,
    inventory: s.inventory,
    presence: s.presence,
    place: s.place,
  }))
  const vehicles = world.vehicles.map(v => ({
    id: v.id,
    kind: v.kind,
    fuel: v.fuel,
    pose: qVehiclePose(v.pose),
    route: v.route,
    cursor: v.cursor,
    running: v.running,
    dwell: q(v.dwell),
    slots: v.kind === 'quad' ? v.slots : undefined,
    hitch: v.kind === 'tractor' ? v.hitch : undefined,
    boom: v.kind === 'tractor' ? v.boom : undefined,
  }))
  const trailers = world.trailers.map(t => ({
    id: t.id,
    kind: t.kind,
    pose: qTrailerPose(t.pose),
    hopper: t.kind === 'harvest' ? undefined : t.hopper,
    slots: t.kind === 'harvest' ? t.slots : undefined,
  }))
  return {
    money: world.money,
    day: world.clock.day,
    t: q(world.clock.t),
    seats,
    vehicles,
    trailers,
    routes: world.routes.map(r => ({ id: r.id, name: r.name, stops: r.stops })),
    nextRouteId: world.nextRouteId,
    cells,
    wires: world.wires,
    valves: [...world.valveHold.values()].map(h => ({ e: h.e, level: h.level, hold: q(h.hold) })),
    sprinklers: [...world.sprinklers.values()].map(s => ({
      at: s.at,
      sig: world.wires.some(
        w => w.to.kind === 'sprinkler' && w.to.at.col === s.at.col && w.to.at.row === s.at.row,
      )
        ? s.inn
        : 'u',
    })),
    drops: world.drops.length,
    done: [...world.done].sort(),
    family: {
      player: [...world.family.player.owned.entries()].sort(),
      husband: [...world.family.husband.owned.entries()].sort(),
      daughter: [...world.family.daughter.owned.entries()].sort(),
    },
    stall: Object.fromEntries(
      (Object.keys(world.stall) as (keyof typeof world.stall)[]).map(id => [
        id,
        { stock: world.stall[id].stock, sat: q(world.stall[id].sat) },
      ]),
    ),
    contracts: {
      takenToday: world.contracts.takenToday,
      active: world.contracts.active.map(a => ({
        id: a.offer.id,
        dueDay: a.dueDay,
        filled: a.bins.map(b => b.filled),
      })),
    },
  }
}

function fnv(payload: string): string {
  let h = 2166136261
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function digestHex(world: World): string {
  return fnv(JSON.stringify(digestParts(world)))
}

/** One hash per section, so a mismatch can name what drifted instead of just that something did. */
export function digestSections(world: World): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(digestParts(world))) out[k] = fnv(JSON.stringify(v))
  return out
}

/** The sections that differ between two worlds, most useful first. Empty means they agree. */
export function digestDiff(a: World, b: World): string[] {
  const x = digestSections(a)
  const y = digestSections(b)
  return Object.keys(x).filter(k => x[k] !== y[k])
}

type Link = {
  wire: MpWire
  seat: SeatId | undefined
  playerId: PlayerId | undefined
  lastHeard: number
  fails: number
  ready: boolean
  /** `t` of the last digest this link reported a mismatch on. 0 = none yet. */
  desyncT: number
  n: number
}

export class MpHost {
  paused = false
  joining = false
  readonly world: World
  private readonly guests: Link[] = []
  onPause: ((on: boolean) => void) | undefined
  onCatching: ((on: boolean) => void) | undefined
  onRoster: (() => void) | undefined
  constructor(world: World) {
    this.world = world
  }
  attach(wire: MpWire): void {
    const link: Link = {
      wire,
      seat: undefined,
      playerId: undefined,
      lastHeard: this.wall(),
      fails: 0,
      ready: false,
      desyncT: 0,
      n: 0,
    }
    this.guests.push(link)
    wire.onRecv(msg => this.recv(link, msg))
  }
  drop(wire: MpWire): void {
    const i = this.guests.findIndex(g => g.wire === wire)
    if (i < 0) return
    const g = this.guests[i]
    this.guests.splice(i, 1)
    if (g.seat !== undefined && g.seat !== 0) {
      this.world.away(g.seat)
      this.pushRoster()
    }
    if (this.joining && !g.ready) {
      this.joining = false
      this.setPaused(false)
    }
  }
  /** Overridable so tests can drive wall time; the app just lets it read the clock. */
  wall(): number {
    return performance.now()
  }
  /**
   * WebRTC can take minutes to admit a peer is gone, so silence is the signal:
   * quiet guests go away (and start napping), very quiet ones lose the link.
   */
  sweep(nowMs = this.wall()): void {
    let changed = false
    for (let i = this.guests.length - 1; i >= 0; i--) {
      const g = this.guests[i]
      if (g.seat === undefined || g.seat === 0) continue
      const quiet = nowMs - g.lastHeard
      if (quiet >= DROP_MS) {
        this.guests.splice(i, 1)
        g.wire.close()
        if (this.world.seats[g.seat].presence !== 'away') this.world.away(g.seat)
        this.world.seats[g.seat].napping = true
        changed = true
        continue
      }
      if (quiet >= AWAY_MS && this.world.seats[g.seat].presence !== 'away') {
        this.world.away(g.seat)
        changed = true
      }
      const napping = quiet >= NAP_MS
      if (this.world.seats[g.seat].napping !== napping) {
        this.world.seats[g.seat].napping = napping
        changed = true
      }
    }
    if (changed) this.pushRoster()
  }
  pump(): void {
    this.sweep()
    if (this.paused) return
    this.world.tick(DT_MAX)
    const t = this.world.now
    const sendDigest = t > 0 && t % DIGEST_EVERY === 0
    const hex = sendDigest ? digestHex(this.world) : ''
    this.guests.forEach(g => {
      if (g.seat === undefined) return
      const cmds = this.world.logSince(g.n)
      // Underflow means the ring buffer ate commands this link never saw; a bundle built from
      // what is left would replay already-applied commands. Only a fresh snapshot is correct.
      if (cmds === undefined) {
        // Pause before snapshotting: the guest's `ready` can come straight back.
        this.joining = true
        this.setPaused(true)
        this.world.rebase()
        this.snapshot(g)
        return
      }
      g.n = this.world.logEnd
      g.wire.send({ a: 'bundle', t, cmds })
      if (sendDigest) g.wire.send({ a: 'digest', t, hex })
    })
  }
  pushRoster(): void {
    this.broadcast({ a: 'roster', seats: rosterOf(this.world) })
    if (this.onRoster !== undefined) this.onRoster()
  }
  setPaused(on: boolean): void {
    this.paused = on
    this.broadcast({ a: 'pause', on })
    if (this.onPause !== undefined) this.onPause(on)
  }
  leave(): void {
    this.broadcast({ a: 'bye', why: 'host-left' })
    this.guests.forEach(g => g.wire.close())
    this.guests.length = 0
  }
  private broadcast(msg: MpMsg): void {
    this.guests.forEach(g => {
      if (g.seat !== undefined) g.wire.send(msg)
    })
  }
  private recv(link: Link, msg: MpMsg): void {
    link.lastHeard = this.wall()
    if (msg.a === 'ping') {
      // A ping from a seat we had written off means they are back at the keyboard.
      if (link.seat !== undefined && link.seat !== 0 && this.world.seats[link.seat].presence === 'away') {
        this.world.join(this.world.seats[link.seat].playerId)
        this.pushRoster()
      }
      return
    }
    if (msg.a === 'hello') {
      this.onHello(link, msg)
      return
    }
    if (msg.a === 'ready') {
      link.ready = true
      // One guest's ready must not unpause the world under another still rebuilding its copy.
      if (this.guests.some(g => g.seat !== undefined && !g.ready)) return
      this.joining = false
      this.setPaused(false)
      if (this.onCatching !== undefined) this.onCatching(false)
      return
    }
    if (msg.a === 'intent') {
      if (link.seat === undefined) return
      const cmd = { ...msg.cmd, t: this.world.now, p: link.seat }
      if (!permit(cmd)) return
      this.world.dispatch(cmd)
      return
    }
    if (msg.a === 'pause') {
      this.setPaused(msg.on)
    }
  }
  /**
   * Two mismatches inside this many ticks is a link that resync cannot repair.
   * Measured in world ticks, not wall time, so it does not depend on RTT.
   */
  private consecutive(link: Link, desyncT: number): boolean {
    const near = link.desyncT !== 0 && desyncT - link.desyncT <= DIGEST_EVERY * 2
    link.fails = near ? link.fails + 1 : 1
    link.desyncT = desyncT
    return link.fails >= 2
  }
  /** Snapshot for one link. `rebase` first, or the guest is born diverged. */
  private snapshot(link: Link): void {
    link.ready = false
    link.n = this.world.logEnd
    link.wire.send({ a: 'resync', save: dump(this.world), now: this.world.now })
  }
  private onHello(link: Link, msg: Extract<MpMsg, { a: 'hello' }>): void {
    if (msg.protocol !== PROTOCOL) {
      link.wire.send({ a: 'reject', reason: 'version' })
      return
    }
    if (link.seat !== undefined) {
      // A hello carrying the digest t it failed on is a desync report; a bare one is a stall.
      if (msg.desyncT !== undefined && this.consecutive(link, msg.desyncT)) {
        link.wire.send({ a: 'bye', why: 'kicked' })
        this.drop(link.wire)
        return
      }
      this.joining = true
      this.setPaused(true)
      if (this.onCatching !== undefined) this.onCatching(true)
      this.world.join(msg.playerId, msg.name)
      this.world.rebase()
      this.snapshot(link)
      this.pushRoster()
      return
    }
    if (this.joining) {
      link.wire.send({ a: 'reject', reason: 'busy' })
      return
    }
    const before = this.world.seats.length
    const seat = this.world.join(msg.playerId, msg.name)
    if (seat === 'full') {
      link.wire.send({ a: 'reject', reason: 'full' })
      return
    }
    link.seat = seat
    link.playerId = msg.playerId
    link.ready = false
    this.joining = true
    this.setPaused(true)
    if (this.onCatching !== undefined) this.onCatching(true)
    this.world.rebase()
    link.n = this.world.logEnd
    link.wire.send({
      a: 'welcome',
      protocol: PROTOCOL,
      seat,
      save: dump(this.world),
      now: this.world.now,
      paused: true,
    })
    // A new seat never rides the command log, and `roster` cannot create one, so every guest
    // already connected would keep the old, shorter `seats` forever. Re-snapshot them.
    if (this.world.seats.length > before) {
      this.guests.forEach(g => {
        if (g === link || g.seat === undefined) return
        this.snapshot(g)
      })
    }
    this.pushRoster()
  }
}

/** A stalled link gets this many resync attempts before we call it dead. */
export const RETRY_MAX = 3
export const STALL_MS = 5000
/** Guests beat this often so a host can tell a quiet player from a vanished one. */
export const PING_MS = 2000
/** Silence past this and the seat is marked away. */
export const AWAY_MS = 8000
/**
 * Silence past this and the player is drawn asleep. Measured on the host's wall clock,
 * because world time runs many times faster than real time and scales with ?speed.
 */
export const NAP_MS = 30000
/** Silence past this and the link itself is released. */
export const DROP_MS = 60000

export class MpGuest {
  world: World | undefined
  seat: SeatId | undefined
  paused = false
  catching = false
  /** Consecutive stalls with no traffic back; reset by anything the host sends. */
  retries = 0
  fail: 'version' | 'full' | 'busy' | 'host-left' | 'desync' | 'unusable' | 'ice' | undefined
  private readonly wire: MpWire
  private readonly playerId: PlayerId
  private readonly name: string
  private readonly queued: Extract<MpMsg, { a: 'bundle' }>[] = []
  private lastWall = 0
  private lastPing = 0
  /** One snapshot request per gap, not one per bundle that lands in it. */
  private gapAsked = false
  onWorld: ((world: World, seat: SeatId) => void) | undefined
  onCatching: ((on: boolean) => void) | undefined
  onRetry: ((n: number) => void) | undefined
  onPause: ((on: boolean) => void) | undefined
  onBye: ((why: 'host-left' | 'kicked' | 'lost') => void) | undefined
  onReject: ((reason: RejectReason | 'unusable') => void) | undefined
  constructor(wire: MpWire, playerId: PlayerId, name = '') {
    this.wire = wire
    this.playerId = playerId
    this.name = name
    wire.onRecv(msg => this.recv(msg))
  }
  /** `desyncT` names the digest `t` that mismatched, so the host can count consecutive failures
   * without guessing from wall time. Omit it for an ordinary join or a stall retry. */
  hello(desyncT?: number): void {
    this.wire.send({ a: 'hello', protocol: PROTOCOL, playerId: this.playerId, name: this.name, desyncT })
  }
  intent(cmd: Cmd): void {
    // TODO 1.1 multiplayer client prediction
    this.wire.send({ a: 'intent', cmd })
  }
  togglePause(): void {
    const on = !this.paused
    this.paused = on
    this.wire.send({ a: 'pause', on })
  }
  leave(): void {
    this.wire.close()
  }
  pumpGap(now: number): void {
    // The heartbeat runs even while paused: being idle is not the same as being gone.
    if (this.world !== undefined && now - this.lastPing >= PING_MS) {
      this.lastPing = now
      this.wire.send({ a: 'ping' })
    }
    if (this.lastWall === 0) {
      this.lastWall = now
      return
    }
    if (this.paused) {
      this.lastWall = now
      return
    }
    if (now - this.lastWall <= STALL_MS || this.world === undefined) return
    this.flush()
    if (this.world === undefined) return
    this.retries += 1
    if (this.onRetry !== undefined) this.onRetry(this.retries)
    if (this.retries > RETRY_MAX) {
      this.fail = 'host-left'
      if (this.onBye !== undefined) this.onBye('lost')
      this.world = undefined
      return
    }
    this.hello()
    this.catchUp(true)
    this.lastWall = now
  }
  /**
   * Anything from the host proves the link is alive, so the retry budget resets.
   * The stall clock stays with the bundle branch: digests alone do not mean we are keeping up.
   */
  private settle(): void {
    if (this.retries === 0) return
    this.retries = 0
    if (this.onRetry !== undefined) this.onRetry(0)
  }
  private catchUp(on: boolean): void {
    this.catching = on
    if (this.onCatching !== undefined) this.onCatching(on)
  }
  private recv(msg: MpMsg): void {
    if (msg.a === 'reject') {
      this.fail = msg.reason
      if (this.onReject !== undefined) this.onReject(msg.reason)
      return
    }
    if (msg.a === 'welcome') {
      if (msg.protocol !== PROTOCOL) {
        this.fail = 'version'
        return
      }
      const r = parse(JSON.stringify(msg.save))
      if (!r.ok) {
        this.fail = 'unusable'
        if (this.onReject !== undefined) this.onReject('unusable')
        this.wire.close()
        return
      }
      r.world.now = msg.now
      r.world.local = msg.seat
      r.world.remote = cmd => this.intent(cmd)
      this.world = r.world
      this.gapAsked = false
      this.seat = msg.seat
      this.paused = msg.paused
      this.catchUp(true)
      if (this.onWorld !== undefined) this.onWorld(r.world, msg.seat)
      this.wire.send({ a: 'ready' })
      return
    }
    if (msg.a !== 'bye') this.settle()
    if (msg.a === 'roster') {
      applyRoster(this.world, msg.seats)
      return
    }
    if (msg.a === 'bundle') {
      this.lastWall = performance.now()
      if (this.world === undefined || this.catching) {
        this.queued.push(msg)
        this.flush()
        return
      }
      this.take(msg)
      return
    }
    if (msg.a === 'digest') {
      this.flush()
      if (this.world === undefined) return
      // Behind the host is not a desync, it is latency: the bundles for those ticks are still
      // in flight. Only judge a digest for a tick we have actually reached.
      if (this.world.now !== msg.t) {
        this.catchUp(true)
        return
      }
      if (digestHex(this.world) !== msg.hex) {
        this.hello(msg.t)
        this.catchUp(true)
      }
      return
    }
    if (msg.a === 'resync') {
      const r = parse(JSON.stringify(msg.save))
      if (!r.ok) {
        this.fail = 'unusable'
        if (this.onReject !== undefined) this.onReject('unusable')
        return
      }
      r.world.now = msg.now
      if (this.seat !== undefined) r.world.local = this.seat
      r.world.remote = cmd => this.intent(cmd)
      this.world = r.world
      this.gapAsked = false
      this.queued.length = 0
      if (this.onWorld !== undefined && this.seat !== undefined) this.onWorld(r.world, this.seat)
      this.wire.send({ a: 'ready' })
      this.catchUp(false)
      return
    }
    if (msg.a === 'pause') {
      this.paused = msg.on
      if (this.onPause !== undefined) this.onPause(msg.on)
      return
    }
    if (msg.a === 'bye') {
      this.fail = msg.why === 'kicked' ? 'desync' : 'host-left'
      if (this.onBye !== undefined) this.onBye(msg.why)
      this.world = undefined
    }
  }
  /**
   * Bundles are a tick sequence, not independent messages: `bundle.t` must be exactly the next
   * tick. A repeat is stale. A gap means one was missed or the transport reordered them, and
   * applying it anyway diverges silently -- ask for a snapshot instead.
   */
  private take(msg: Extract<MpMsg, { a: 'bundle' }>): void {
    if (this.world === undefined) return
    if (msg.t <= this.world.now) return
    if (msg.t > this.world.now + 1) {
      if (!this.gapAsked) {
        this.gapAsked = true
        this.hello()
      }
      this.catchUp(true)
      return
    }
    applyBundle(this.world, msg.cmds)
  }
  private flush(): void {
    if (this.world === undefined) return
    while (this.queued.length > 0) {
      const b = this.queued.shift()
      if (b === undefined) return
      this.take(b)
    }
    if (this.catching) this.catchUp(false)
  }
}
