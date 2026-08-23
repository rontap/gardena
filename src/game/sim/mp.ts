import { SKUS } from '../defs/research.ts'
import type { SkuId } from './ids.ts'
import { Act, type Cmd } from './log.ts'
import { dump, parse, type Save } from './save.ts'
import { cleanName, DT_MAX, type PlayerId, type Presence, type SeatId, type World } from './world.ts'

export const PROTOCOL = 1.4

export type MpMsg =
  | { a: 'hello'; protocol: number; playerId: PlayerId; name: string }
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
  'buy-hangar',
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
      return { a: 'hello', protocol: data.protocol, playerId: data.playerId, name }
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
      if (cmd.k === 'building') return true
      // TODO 1.1 multiplayer guest pipe/valve/sprinkler/tile/fence
      return false
    case Act.tuneSprinkler:
    case Act.nudgeOffered:
    case Act.dismissRecap:
    case Act.cheat:
    case Act.openHud:
      return false
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

export function digestHex(world: World): string {
  const cells: string[] = []
  world.forEachCell((at, c) => {
    let s = `${at.col},${at.row}:${c.kind}`
    if (c.kind === 'growing' || c.kind === 'ripe' || c.kind === 'dead') {
      s += `:${c.plant.crop}:${c.plant.rarity}:${c.plant.maturity}`
    }
    cells.push(s)
  })
  const seats = world.seats.map(s => ({
    id: s.id,
    x: s.actor.x,
    y: s.actor.y,
    hand: s.hand,
    inventory: s.inventory,
    presence: s.presence,
    place: s.place,
  }))
  const vehicles = world.vehicles.map(v => ({
    id: v.id,
    kind: v.kind,
    fuel: v.fuel,
    slots: v.slots,
    pose: v.pose,
  }))
  const payload = JSON.stringify({
    money: world.money,
    day: world.clock.day,
    t: world.clock.t,
    seats,
    vehicles,
    cells,
    drops: world.drops.length,
    done: [...world.done].sort(),
    family: {
      player: [...world.family.player.owned.entries()].sort(),
      husband: [...world.family.husband.owned.entries()].sort(),
      daughter: [...world.family.daughter.owned.entries()].sort(),
    },
    stall: Object.fromEntries(
      (Object.keys(world.stall) as (keyof typeof world.stall)[]).map(id => [id, world.stall[id].stock]),
    ),
  })
  let h = 2166136261
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

type Link = {
  wire: MpWire
  seat: SeatId | undefined
  playerId: PlayerId | undefined
  lastHeard: number
  fails: number
  ready: boolean
  digestWait: boolean
  digestHold: number
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
      digestWait: false,
      digestHold: 0,
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
    const sendDigest = t > 0 && t % 30 === 0
    const hex = sendDigest ? digestHex(this.world) : ''
    this.guests.forEach(g => {
      if (g.seat === undefined) return
      const cmds = this.world.logSince(g.n)
      g.n = this.world.logEnd
      g.wire.send({ a: 'bundle', t, cmds })
      if (sendDigest) {
        g.digestWait = true
        g.digestHold = 8
        g.wire.send({ a: 'digest', t, hex })
      } else if (g.digestHold > 0) {
        g.digestHold -= 1
        if (g.digestHold === 0) g.digestWait = false
      }
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
      this.joining = false
      link.ready = true
      link.digestWait = false
      link.digestHold = 0
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
  private onHello(link: Link, msg: Extract<MpMsg, { a: 'hello' }>): void {
    if (msg.protocol !== PROTOCOL) {
      link.wire.send({ a: 'reject', reason: 'version' })
      return
    }
    if (link.seat !== undefined) {
      if (link.digestWait) {
        link.digestWait = false
        link.fails += 1
        if (link.fails >= 2) {
          link.wire.send({ a: 'bye', why: 'kicked' })
          this.drop(link.wire)
          return
        }
      }
      link.ready = false
      this.joining = true
      this.setPaused(true)
      if (this.onCatching !== undefined) this.onCatching(true)
      link.n = this.world.logEnd
      this.world.join(msg.playerId, msg.name)
      link.wire.send({ a: 'resync', save: dump(this.world), now: this.world.now })
      this.pushRoster()
      return
    }
    if (this.joining) {
      link.wire.send({ a: 'reject', reason: 'busy' })
      return
    }
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
    link.n = this.world.logEnd
    link.wire.send({
      a: 'welcome',
      protocol: PROTOCOL,
      seat,
      save: dump(this.world),
      now: this.world.now,
      paused: true,
    })
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
  hello(): void {
    this.wire.send({ a: 'hello', protocol: PROTOCOL, playerId: this.playerId, name: this.name })
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
      applyBundle(this.world, msg.cmds)
      return
    }
    if (msg.a === 'digest') {
      this.flush()
      if (this.world === undefined) return
      if (this.world.now < msg.t) {
        this.catchUp(true)
        this.flush()
        if (this.world !== undefined && this.world.now < msg.t) this.catchUp(true)
        return
      }
      if (digestHex(this.world) !== msg.hex) {
        this.hello()
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
  private flush(): void {
    if (this.world === undefined) return
    while (this.queued.length > 0) {
      const b = this.queued.shift()
      if (b === undefined) return
      applyBundle(this.world, b.cmds)
    }
    if (this.catching) this.catchUp(false)
  }
}
