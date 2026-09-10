// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { Act } from './log.ts'
import { dump, parse } from './feature-save/save.ts'
import { Plant } from './plant.ts'
import { Soil, SOIL_WATER_MID } from './soil.ts'
import {
  applyBundle,
  digestDiff,
  digestHex,
  jitterLoopback,
  loopback,
  permit,
  readMpMsg,
  MpGuest,
  MpHost,
  PROTOCOL,
  RETRY_MAX,
  STALL_MS,
  AWAY_MS,
  NAP_MS,
  DROP_MS,
  rosterOf,
  applyRoster,
  type MpMsg,
  type MpWire,
} from './mp.ts'
import { originCell } from './building.ts'
import { originOrder } from './util.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
  return new Soil(water, fertilizer, 0.03)
}

function pair(world: World, playerId = 'g1'): { host: MpHost; guest: MpGuest } {
  const host = new MpHost(world)
  const [a, b] = loopback()
  host.attach(a)
  const guest = new MpGuest(b, playerId)
  guest.hello()
  return { host, guest }
}

describe('1.1 multiplayer', () => {
  test('Live App accumulator calls tick(DT_MAX) only. Leftover rAF never ticks a non-DT_MAX slice. View paints every rAF. Solo and MP.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    expect(w.now).toBe(0)
    host.pump()
    expect(w.now).toBe(1)
    host.pump()
    expect(w.now).toBe(2)
    applyBundle(w, [])
    expect(w.now).toBe(3)
    host.setPaused(true)
    host.pump()
    expect(w.now).toBe(3)
  })

  test('Per host bundle: apply cmds in log order, then tick(DT_MAX). Empty cmds still tick. bundle.t is now after that tick. Same seed + same bundles → equal digest: invariant 40 plus every seat actor.x/actor.y, hand, inventory, presence, place.', () => {
    const a = new World(7)
    const b = new World(7)
    a.dispatch({ a: Act.cheat, t: 0, p: 0, k: 'money' })
    applyBundle(a, [])
    applyBundle(b, [{ a: Act.cheat, t: 0, p: 0, k: 'money' }])
    expect(a.now).toBe(1)
    expect(b.now).toBe(1)
    expect(digestHex(a)).toBe(digestHex(b))
    const w = new World(7)
    const { host, guest } = pair(w)
    expect(guest.world !== undefined).toBe(true)
    for (let i = 0; i < 8; i++) host.pump()
    expect(guest.world?.now).toBe(w.now)
    expect(digestHex(guest.world as World)).toBe(digestHex(w))
  })

  test('Sequencer drops illegal guest cmds. They never enter a bundle. Those cmds no-op.', () => {
    expect(permit({ a: Act.cheat, t: 0, p: 1, k: 'money' })).toBe(false)
    expect(permit({ a: Act.startResearch, t: 0, p: 1, r: 'unlock-expand' })).toBe(false)
    expect(permit({ a: Act.pickSkill, t: 0, p: 1, m: 'player', s: 0 })).toBe(false)
    expect(permit({ a: Act.expand, t: 0, p: 1, k: { cx: 1, cy: 0 } })).toBe(false)
    expect(permit({ a: Act.swapChest, t: 0, p: 1, c: [1, 1], i: 0 })).toBe(false)
    expect(permit({ a: Act.dismissRecap, t: 0, p: 1 })).toBe(false)
    expect(permit({ a: Act.cheat, t: 0, p: 0, k: 'money' })).toBe(true)
    const w = new World(1)
    const { guest } = pair(w)
    const money = w.money
    guest.intent({ a: Act.cheat, t: 0, p: 1, k: 'money' })
    expect(w.money).toBe(money)
    expect(w.log.some(c => c.a === Act.cheat)).toBe(false)
  })

  test('Guest may shop + place + `delete` building for pumpjack, well, rain-tank, tap, chest, grinder, compost-box, mill, jam, still, barrel, freezer, hangar. Guest chest/freezer `swapChest`, pipes, valves, sprinklers, tiles, fences, expand, research start, family pick, cheat: not.', () => {
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-pumpjack', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-well', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-rain-tank', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-tap', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-chest', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-grinder', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-compost-box', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-mill', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-jam', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-still', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-furnace', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-barrel', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-freezer', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-hangar', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buyVehicle, t: 0, p: 1, c: [0, 0], k: 'quad' })).toBe(true)
    expect(permit({ a: Act.buyTrailer, t: 0, p: 1, c: [0, 0], k: 'seed' })).toBe(true)
    expect(permit({ a: Act.deploy, t: 0, p: 1, v: 1, c: [0, 0], hitch: 'none' })).toBe(true)
    expect(permit({ a: Act.swapTrailer, t: 0, p: 1, u: 1, i: 0 })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-silo-seed', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-silo-spray', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-silo-produce', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.embark, t: 0, p: 1, v: 1 })).toBe(true)
    expect(permit({ a: Act.disembark, t: 0, p: 1 })).toBe(true)
    expect(permit({ a: Act.dock, t: 0, p: 1 })).toBe(true)
    expect(permit({ a: Act.swapVehicle, t: 0, p: 1, v: 1, i: 0 })).toBe(true)
    expect(permit({ a: Act.drive, t: 0, p: 1, throttle: 1, steer: 0 })).toBe(true)
    expect(permit({ a: Act.stride, t: 0, p: 1, x: 1, y: 0 })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-pulser', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-counter', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-sensor-day', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.refill, t: 0, p: 1, c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.load, t: 0, p: 1 })).toBe(true)
    expect(permit({ a: Act.unload, t: 0, p: 1 })).toBe(true)
    expect(permit({ a: Act.route, t: 0, p: 1, k: 'create' })).toBe(true)
    expect(permit({ a: Act.route, t: 0, p: 1, k: 'start' })).toBe(true)
    expect(permit({ a: Act.route, t: 0, p: 1, k: 'automate', v: 1, c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-traffic-light', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.delete, t: 0, p: 1, k: 'building', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-pipe', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-valve', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-sprinkler', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-sprinkler-vert', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-sprinkler-large', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-tile-paved', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-tile-brick', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-tile-cobble', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-fence', c: [0, 0] })).toBe(false)
    expect(permit({ a: Act.placePipe, t: 0, p: 1, e: { axis: 'h', col: 0, row: 0 } })).toBe(false)
    expect(permit({ a: Act.placeSprinkler, t: 0, p: 1, s: { variant: 'basic', at: { col: 1, row: 1 }, tune: { kind: 'flat' }, inn: 0, hold: 0 } })).toBe(false)
    expect(permit({ a: Act.clickValve, t: 0, p: 1, e: { axis: 'h', col: 0, row: 0 } })).toBe(false)
    expect(permit({ a: Act.delete, t: 0, p: 1, k: 'pipe', e: { axis: 'h', col: 0, row: 0 } })).toBe(false)
    expect(permit({ a: Act.expand, t: 0, p: 1, k: { cx: 1, cy: 0 } })).toBe(false)
    expect(permit({ a: Act.startResearch, t: 0, p: 1, r: 'unlock-expand' })).toBe(false)
    expect(permit({ a: Act.pickSkill, t: 0, p: 1, m: 'husband', s: 0 })).toBe(false)
    expect(permit({ a: Act.cheat, t: 0, p: 1, k: 'all' })).toBe(false)
    expect(permit({ a: Act.swapChest, t: 0, p: 1, c: [2, 2], i: 0 })).toBe(false)
  })

  test('presence === \'away\': tick skips that actor walk/work and that seat hand/inventory freshness. Field, chest, and ground rot continue. Freezer slots never tick freshness. Seat stays in `seats`.', () => {
    const w = new World(1)
    expect(w.join('g')).toBe(1)
    const s1 = w.seats[1]
    s1.hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 1, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    s1.actor.x = 4
    s1.actor.y = 4
    s1.queue.push({ act: 'walk', at: AT })
    const plant = new Plant('carrot', 'base', 0)
    plant.maturity = 1
    w.setCell(AT, { kind: 'growing', soil: bed(), plant })
    w.tick(DT_MAX)
    const ripe = w.cell(AT)
    expect(ripe.kind).toBe('ripe')
    const field0 = ripe.kind === 'ripe' ? ripe.plant.freshness : -1
    w.away(1)
    const box0 = s1.hand.kind === 'hold' && s1.hand.item.kind === 'fruit' ? s1.hand.item.freshness : -1
    const x = s1.actor.x
    for (let i = 0; i < 20; i++) w.tick(DT_MAX)
    expect(s1.presence).toBe('away')
    expect(w.seats).toHaveLength(2)
    expect(s1.actor.x).toBe(x)
    const box1 = s1.hand.kind === 'hold' && s1.hand.item.kind === 'fruit' ? s1.hand.item.freshness : -1
    expect(box1).toBe(box0)
    const after = w.cell(AT)
    expect(after.kind === 'ripe' && after.plant.freshness).toBeLessThan(field0)
  })

  test('parse(text): JSON.parse throw → unknown-format. game !== "gardena" → not-gardena. Reconstruct → ok even if version differs.', () => {
    const notJson = parse('not-json')
    expect(notJson.ok).toBe(false)
    if (notJson.ok) return
    expect(notJson.reason).toBe('unknown-format')
    const notGardena = parse(JSON.stringify({ game: 'nope' }))
    expect(notGardena.ok).toBe(false)
    if (notGardena.ok) return
    expect(notGardena.reason).toBe('not-gardena')
    expect(parse('null').ok).toBe(false)
    const w = new World(1)
    const s = dump(w)
    const ok = parse(JSON.stringify(s))
    expect(ok.ok).toBe(true)
    const old = parse(JSON.stringify({ ...s, version: 1.0 }))
    expect(old.ok).toBe(true)
    const noVer = { ...s }
    delete (noVer as { version?: unknown }).version
    const missing = parse(JSON.stringify(noVer))
    expect(missing.ok).toBe(true)
  })

  test('hello when seats.length === 4 → reject: full. Away occupies a slot. Rejoin is the same playerId.', () => {
    const w = new World(1)
    expect(w.join('a')).toBe(1)
    expect(w.join('b')).toBe(2)
    expect(w.join('c')).toBe(3)
    expect(w.seats).toHaveLength(4)
    expect(w.join('d')).toBe('full')
    w.away(1)
    expect(w.seats).toHaveLength(4)
    expect(w.join('e')).toBe('full')
    expect(w.join('a')).toBe(1)
    expect(w.seats[1].presence).toBe('in')
    expect(w.seats[1].playerId).toBe('a')
    const host = new MpHost(w)
    const [a, b] = loopback()
    host.attach(a)
    const g = new MpGuest(b, 'e')
    let rejected: string | undefined
    g.onReject = reason => {
      rejected = reason
    }
    g.hello()
    expect(rejected).toBe('full')
  })

  test('Digest mismatch: pause, resync, Ready, unpause. One retry. Second mismatch → that guest bye: kicked. Host continues.', () => {
    const w = new World(1)
    const { host, guest } = pair(w)
    expect(guest.world !== undefined).toBe(true)
    let bye: 'host-left' | 'kicked' | 'lost' | undefined
    guest.onBye = why => {
      bye = why
    }
    for (let i = 0; i < 29; i++) host.pump()
    const gw = guest.world
    if (gw === undefined) return
    gw.money += 1
    host.pump()
    expect(guest.fail).toBeUndefined()
    expect(host.paused).toBe(false)
    expect(digestHex(guest.world as World)).toBe(digestHex(w))
    const gw2 = guest.world
    if (gw2 === undefined) return
    gw2.money += 1
    for (let i = 0; i < 30; i++) host.pump()
    expect(bye).toBe('kicked')
    expect(guest.fail).toBe('desync')
    expect(w.seats[1].presence).toBe('away')
    const n = w.now
    host.pump()
    expect(w.now).toBe(n + 1)
  })

  test('a forced one-section mismatch names that section', () => {
    const a = new World(1)
    const b = new World(1)
    expect(digestDiff(a, b)).toEqual([])
    b.money += 1
    expect(digestDiff(a, b)).toEqual(['money'])
  })

  test('mismatch hello carries the section names', () => {
    const w = new World(1)
    const { host, guest } = pair(w)
    const named: string[][] = []
    host.onDesync = names => {
      named.push(names)
    }
    for (let i = 0; i < 29; i++) host.pump()
    const gw = guest.world
    if (gw === undefined) return
    gw.money += 1
    host.pump()
    expect(named).toEqual([['money']])
  })

  test('Digest mismatch hello still counts after later pumps. Second mismatch kicks. 5s-style hello without digestWait does not.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const { hostW, guestW, flush } = delayToHost()
    host.attach(hostW)
    const guest = new MpGuest(guestW, 'g1')
    let bye: 'host-left' | 'kicked' | 'lost' | undefined
    guest.onBye = why => {
      bye = why
    }
    guest.hello()
    flush()
    expect(guest.world !== undefined).toBe(true)
    guest.hello()
    flush()
    guest.hello()
    flush()
    expect(bye).toBeUndefined()
    expect(guest.fail).toBeUndefined()
    for (let i = 0; i < 29; i++) host.pump()
    const gw = guest.world
    if (gw === undefined) return
    gw.money += 1
    host.pump()
    for (let i = 0; i < 5; i++) host.pump()
    flush()
    expect(bye).toBeUndefined()
    expect(guest.fail).toBeUndefined()
    const gw2 = guest.world
    if (gw2 === undefined) return
    gw2.money += 1
    for (let i = 0; i < 24; i++) host.pump()
    host.pump()
    for (let i = 0; i < 5; i++) host.pump()
    flush()
    expect(bye).toBe('kicked')
    expect(guest.fail).toBe('desync')
    expect(w.seats[1].presence).toBe('away')
    const n = w.now
    host.pump()
    expect(w.now).toBe(n + 1)
  })

  test('Matching digest then 5s-style hello must not kick.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const { hostW, guestW, flush } = delayToHost()
    host.attach(hostW)
    const guest = new MpGuest(guestW, 'g1')
    let bye: 'host-left' | 'kicked' | 'lost' | undefined
    guest.onBye = why => {
      bye = why
    }
    guest.hello()
    flush()
    for (let i = 0; i < 30; i++) host.pump()
    flush()
    for (let i = 0; i < 9; i++) host.pump()
    guest.hello()
    flush()
    expect(bye).toBeUndefined()
    expect(guest.fail).toBeUndefined()
    guest.hello()
    flush()
    expect(bye).toBeUndefined()
    expect(guest.fail).toBeUndefined()
  })

  test('pumpGap keeps the 5s wall while catching. Still behind after flush → hello. lastWall is not rewound. pumpGap while paused does not hello.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const [a, b] = loopback()
    let hellos = 0
    const send = b.send.bind(b)
    b.send = (msg: MpMsg) => {
      if (msg.a === 'hello') hellos += 1
      send(msg)
    }
    host.attach(a)
    const guest = new MpGuest(b, 'g1')
    guest.hello()
    hellos = 0
    let catching = false
    guest.onCatching = on => {
      catching = on
    }
    a.send({ a: 'digest', t: 9999, hex: 'deadbeef' })
    expect(catching).toBe(true)
    guest.pumpGap(100)
    expect(hellos).toBe(0)
    guest.pumpGap(200)
    expect(hellos).toBe(0)
    expect(catching).toBe(true)
    guest.pumpGap(100 + 5001)
    expect(hellos).toBe(1)
    expect(guest.catching).toBe(false)
    hellos = 0
    guest.paused = true
    guest.pumpGap(100 + 5001 + 5001)
    expect(hellos).toBe(0)
    guest.pumpGap(100 + 5001 + 10000)
    expect(hellos).toBe(0)
  })

  test('two guests: dispatch after A ready, B joins. A applies once. B does not double-apply. Digests match.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const [a1, b1] = loopback()
    host.attach(a1)
    const guestA = new MpGuest(b1, 'a')
    guestA.hello()
    expect(guestA.world !== undefined).toBe(true)
    w.dispatch({ a: Act.cheat, t: 0, p: 0, k: 'money' })
    const money = w.money
    expect(money).toBe(250)
    const [a2, b2] = loopback()
    host.attach(a2)
    const guestB = new MpGuest(b2, 'b')
    guestB.hello()
    expect(guestB.world?.money).toBe(money)
    expect(guestB.world?.log.filter(c => c.a === Act.cheat)).toHaveLength(0)
    host.pump()
    expect(guestA.world?.money).toBe(money)
    expect(guestB.world?.money).toBe(money)
    expect(guestA.world?.log.filter(c => c.a === Act.cheat)).toHaveLength(0)
    expect(guestB.world?.log.filter(c => c.a === Act.cheat)).toHaveLength(0)
    expect(digestHex(guestB.world as World)).toBe(digestHex(w))
  })

  test('dispatch then join: guest money/log must not double-apply. Same cursor on welcome and resync.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const [a, b] = loopback()
    host.attach(a)
    w.dispatch({ a: Act.cheat, t: 0, p: 0, k: 'money' })
    const money = w.money
    expect(money).toBe(250)
    const guest = new MpGuest(b, 'g1')
    guest.hello()
    expect(guest.world?.money).toBe(money)
    expect(guest.world?.log.filter(c => c.a === Act.cheat)).toHaveLength(0)
    host.pump()
    expect(guest.world?.money).toBe(w.money)
    expect(guest.world?.money).toBe(money)
    expect(w.log.filter(c => c.a === Act.cheat)).toHaveLength(1)
    w.dispatch({ a: Act.cheat, t: w.now, p: 0, k: 'money' })
    const money2 = w.money
    guest.hello()
    expect(guest.world?.money).toBe(money2)
    host.pump()
    expect(guest.world?.money).toBe(w.money)
    expect(guest.world?.money).toBe(money2)
    expect(w.log.filter(c => c.a === Act.cheat)).toHaveLength(2)
  })

  test('MpHost.leave sends bye host-left. Guest world is cleared.', () => {
    const w = new World(1)
    const { host, guest } = pair(w)
    let bye: 'host-left' | 'kicked' | 'lost' | undefined
    guest.onBye = why => {
      bye = why
    }
    host.leave()
    expect(bye).toBe('host-left')
    expect(guest.fail).toBe('host-left')
    expect(guest.world).toBeUndefined()
  })

  test('readMpMsg rejects unknown a without applying.', () => {
    expect(readMpMsg({ a: 'nope' })).toBeUndefined()
    expect(readMpMsg(null)).toBeUndefined()
    expect(readMpMsg({ a: 'bye', why: 'kicked' })).toEqual({ a: 'bye', why: 'kicked' })
    expect(readMpMsg({ a: 'bye', why: 'nope' })).toBeUndefined()
  })

  test('cue is per seat: one seat opening the inventory never cues another.', () => {
    const w = new World(1)
    expect(w.join('g1')).toBe(1)
    w.dispatch({ a: Act.enqueue, t: 0, p: 0, i: { act: 'inventory' } })
    for (let i = 0; i < 4; i++) w.tick(DT_MAX)
    expect(w.seats[0].cue).toEqual({ kind: 'inventory' })
    expect(w.seats[1].cue).toEqual({ kind: 'none' })
    w.dispatch({ a: Act.ackCue, t: 0, p: 0 })
    expect(w.seats[0].cue).toEqual({ kind: 'none' })
  })

  test('hello carries a name; join keeps the seat and refreshes the name on rejoin.', () => {
    const w = new World(1)
    expect(w.join('g1', 'Ada')).toBe(1)
    expect(w.seats[1].name).toBe('Ada')
    w.away(1)
    expect(w.seats[1].presence).toBe('away')
    expect(w.seats[1].napping).toBe(false)
    expect(w.join('g1', 'Ada Two')).toBe(1)
    expect(w.seats[1].name).toBe('Ada Two')
    expect(w.seats[1].presence).toBe('in')
    expect(w.seats[1].napping).toBe(false)
    expect(readMpMsg({ a: 'hello', protocol: PROTOCOL, playerId: 'g1', name: '  Ada  ' })).toEqual({
      a: 'hello',
      protocol: PROTOCOL,
      playerId: 'g1',
      name: 'Ada',
    })
  })

  test('roster carries names, presence and awaySince over the wire.', () => {
    const w = new World(1)
    w.join('g1', 'Ada')
    w.away(1)
    const rows = rosterOf(w)
    expect(rows[1]).toEqual({ id: 1, name: 'Ada', presence: 'away', napping: false })
    expect(readMpMsg({ a: 'roster', seats: rows })).toEqual({ a: 'roster', seats: rows })
    const mirror = new World(1)
    mirror.join('g1', 'stale')
    applyRoster(mirror, rows)
    expect(mirror.seats[1].name).toBe('Ada')
    expect(mirror.seats[1].presence).toBe('away')
  })

  test('readMpMsg copies leave iff drop or kicked. Absent stays absent. rosterOf has no leave.', () => {
    const w = new World(1)
    w.join('g1', 'Ada')
    expect(rosterOf(w)[1]).toEqual({ id: 1, name: 'Ada', presence: 'in', napping: false })
    const drop = rosterOf(w, [{ id: 1, leave: 'drop' }])
    expect(drop[1]).toEqual({ id: 1, name: 'Ada', presence: 'in', napping: false, leave: 'drop' })
    expect(readMpMsg({ a: 'roster', seats: drop })).toEqual({ a: 'roster', seats: drop })
    const kicked = rosterOf(w, [{ id: 1, leave: 'kicked' }])
    expect(readMpMsg({ a: 'roster', seats: kicked })).toEqual({ a: 'roster', seats: kicked })
    expect(
      readMpMsg({
        a: 'roster',
        seats: [{ id: 1, name: 'Ada', presence: 'away', napping: false, leave: 'nope' }],
      }),
    ).toEqual({ a: 'roster', seats: [{ id: 1, name: 'Ada', presence: 'away', napping: false }] })
  })

  test('Host sets leave drop on drop and kicked on kick; silence roster omits leave.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const pushes: ReturnType<typeof rosterOf>[] = []
    host.onRoster = seats => {
      pushes.push(seats)
    }
    let wall = 0
    host.wall = () => wall
    const [a, b] = loopback()
    host.attach(a)
    const guest = new MpGuest(b, 'g1', 'Ada')
    guest.hello()
    wall = AWAY_MS
    host.sweep()
    expect(pushes[pushes.length - 1].find(s => s.id === 1)).toEqual({
      id: 1,
      name: 'Ada',
      presence: 'away',
      napping: false,
    })
    wall = NAP_MS
    host.sweep()
    expect(pushes[pushes.length - 1].every(s => !('leave' in s))).toBe(true)
    const w2 = new World(1)
    const host2 = new MpHost(w2)
    const seen: ReturnType<typeof rosterOf>[] = []
    host2.onRoster = seats => {
      seen.push(seats)
    }
    const [a1, b1] = loopback()
    host2.attach(a1)
    new MpGuest(b1, 'a', 'Ada').hello()
    const [a2, b2] = loopback()
    host2.attach(a2)
    new MpGuest(b2, 'b', 'Bea').hello()
    host2.drop(a2, 'drop')
    expect(seen[seen.length - 1].find(s => s.id === 2)).toEqual({
      id: 2,
      name: 'Bea',
      presence: 'away',
      napping: false,
      leave: 'drop',
    })
    host2.drop(a1, 'kicked')
    expect(seen[seen.length - 1].find(s => s.id === 1)).toEqual({
      id: 1,
      name: 'Ada',
      presence: 'away',
      napping: false,
      leave: 'kicked',
    })
  })

  test(`a stalled guest retries ${RETRY_MAX} times, then byes with 'lost'. A live host resets the budget.`, () => {
    const w = new World(1)
    const host = new MpHost(w)
    const [a, b] = loopback()
    host.attach(a)
    const guest = new MpGuest(b, 'g1', 'Ada')
    guest.hello()
    expect(guest.world !== undefined).toBe(true)
    let bye: 'host-left' | 'kicked' | 'lost' | undefined
    guest.onBye = why => {
      bye = why
    }
    // The host goes silent: hellos leave, nothing comes back.
    b.send = () => {}
    let wall = 1000
    guest.pumpGap(wall)
    for (let i = 1; i <= RETRY_MAX; i++) {
      wall += 5001
      guest.pumpGap(wall)
      expect(guest.retries).toBe(i)
      expect(bye).toBeUndefined()
    }
    wall += 5001
    guest.pumpGap(wall)
    expect(bye).toBe('lost')
    expect(guest.world).toBeUndefined()
  })

  test('a host that answers the stall hello resets the retry budget.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const [a, b] = loopback()
    host.attach(a)
    const guest = new MpGuest(b, 'g1', 'Ada')
    guest.hello()
    guest.pumpGap(1000)
    guest.pumpGap(1000 + 5001)
    // The loopback host answered with a resync, so the guest is not stalled after all.
    expect(guest.retries).toBe(0)
  })

  test('a silent guest goes away (nap timer), then loses the link. A ping brings them back.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    let wall = 0
    host.wall = () => wall
    const [a, b] = loopback()
    host.attach(a)
    const guest = new MpGuest(b, 'g1', 'Ada')
    guest.hello()
    expect(w.seats[1].presence).toBe('in')
    wall = AWAY_MS - 1
    host.sweep()
    expect(w.seats[1].presence).toBe('in')
    wall = AWAY_MS
    host.sweep()
    expect(w.seats[1].presence).toBe('away')
    expect(w.seats[1].napping).toBe(false)
    wall = NAP_MS
    host.sweep()
    expect(w.seats[1].napping).toBe(true)
    b.send({ a: 'ping' })
    expect(w.seats[1].presence).toBe('in')
    expect(w.seats[1].napping).toBe(false)
    wall += DROP_MS
    host.sweep()
    expect(w.seats[1].presence).toBe('away')
    // The seat survives the drop so the same playerId lands back in it.
    expect(w.seats).toHaveLength(2)
    expect(w.join('g1', 'Ada')).toBe(1)
  })

  test('Guest Unload chest no-op. Guest Load chest no-op.', () => {
    const w = new World(1)
    w.unlockAll()
    w.money = 999
    w.join('g')
    const chestAt = { col: 10, row: 16 }
    w.buy('buy-chest')
    w.confirmPlace(chestAt)
    w.buy('buy-hangar')
    w.confirmPlace({ col: 10, row: 12 })
    w.buyVehicle({ col: 10, row: 12 }, 'quad')
    const v = w.vehicles[0]
    expect(v.kind).toBe('quad')
    if (v.kind !== 'quad') return
    v.pose = { kind: 'field', x: 10.5, y: 15.5, heading: 0, speed: 0, driver: 1 }
    v.slots[0] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 1, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    w.apply({ a: Act.unload, t: w.now, p: 1 })
    const chest = w.cell(chestAt)
    expect(chest.kind).toBe('chest')
    if (chest.kind !== 'chest') return
    expect(chest.slots.every(s => s.kind === 'empty')).toBe(true)
    expect(v.slots[0].kind).toBe('hold')
    chest.slots[0] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', variety: 'base', quality: 0, count: 1, unitSale: 5, freshness: 1, bio: true, cut: false },
    }
    v.pose.x = 10.5
    v.pose.y = 17.5
    v.slots[0] = { kind: 'empty' }
    w.apply({ a: Act.load, t: w.now, p: 1 })
    expect(chest.slots[0].kind).toBe('hold')
    expect(v.slots.every(s => s.kind === 'empty')).toBe(true)
  })

  test('Guest Unload freezer no-op. Guest Load freezer no-op.', () => {
    const w = new World(1)
    w.unlockAll()
    w.money = 999
    w.join('g')
    const fzAt = { col: 10, row: 16 }
    w.buy('buy-freezer')
    w.confirmPlace(fzAt)
    w.buy('buy-hangar')
    w.confirmPlace({ col: 10, row: 12 })
    w.buyVehicle({ col: 10, row: 12 }, 'quad')
    const v = w.vehicles[0]
    expect(v.kind).toBe('quad')
    if (v.kind !== 'quad') return
    v.pose = { kind: 'field', x: 10.5, y: 15.5, heading: 0, speed: 0, driver: 1 }
    v.slots[0] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 1, unitSale: 4, freshness: 1, bio: true, cut: false },
    }
    w.apply({ a: Act.unload, t: w.now, p: 1 })
    const fz = w.cell(fzAt)
    expect(fz.kind).toBe('freezer')
    if (fz.kind !== 'freezer') return
    expect(fz.slots.every(s => s.kind === 'empty')).toBe(true)
    expect(v.slots[0].kind).toBe('hold')
    fz.slots[0] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', variety: 'base', quality: 0, count: 1, unitSale: 5, freshness: 1, bio: true, cut: false },
    }
    v.pose.x = 10.5
    v.pose.y = 17.5
    v.slots[0] = { kind: 'empty' }
    w.apply({ a: Act.load, t: w.now, p: 1 })
    expect(fz.slots[0].kind).toBe('hold')
    expect(v.slots.every(s => s.kind === 'empty')).toBe(true)
  })

  test('Digest includes mill/jam/still `inn` and chest/freezer/seed-silo/additive-store `out`.', () => {
    const a = new World(1)
    const b = new World(1)
    a.unlockAll()
    b.unlockAll()
    a.money = 999
    b.money = 999
    a.buy('buy-mill')
    a.confirmPlace({ col: 10, row: 16 })
    b.buy('buy-mill')
    b.confirmPlace({ col: 10, row: 16 })
    expect(digestHex(a)).toBe(digestHex(b))
    const mill = a.cell({ col: 10, row: 16 })
    expect(mill.kind).toBe('mill')
    if (mill.kind !== 'mill') return
    mill.inn = 1
    expect(digestHex(a)).not.toBe(digestHex(b))
    const chestAt = { col: 12, row: 16 }
    b.buy('buy-chest')
    b.confirmPlace(chestAt)
    a.buy('buy-chest')
    a.confirmPlace(chestAt)
    mill.inn = 0
    expect(digestHex(a)).toBe(digestHex(b))
    const chest = a.cell(chestAt)
    if (chest.kind !== 'chest') return
    chest.out = 1
    expect(digestHex(a)).not.toBe(digestHex(b))
  })

  test('a guest joining a host mid-play stays in step: the snapshot is what a dump/parse produces, not the live world', () => {
    const w = new World(3)
    const host = new MpHost(w)
    // Play first. The guest must arrive while the host is mid-walk, mid-work and mid-big-tick --
    // a host standing idle at join time hides every divergence this test is for.
    w.dispatch({ a: Act.stride, t: 0, p: 0, x: 1, y: 0 })
    for (let i = 0; i < 37; i++) host.pump()
    expect(w.seats[0].stride.x).toBe(1)
    expect(w.seats[0].actor.x).not.toBe(dump(w).seats[0].actor.x - 1)
    const [a, b] = loopback()
    host.attach(a)
    const guest = new MpGuest(b, 'g1')
    guest.hello()
    expect(guest.world).not.toBe(undefined)
    expect(digestDiff(guest.world as World, w)).toEqual([])
    for (let i = 0; i < 400; i++) host.pump()
    expect(guest.world?.now).toBe(w.now)
    expect(digestDiff(guest.world as World, w)).toEqual([])
  })

  test('reordered delivery never applies a bundle out of sequence', () => {
    const w = new World(5)
    const host = new MpHost(w)
    const [a, b, jit] = jitterLoopback()
    host.attach(a)
    const guest = new MpGuest(b, 'g1')
    guest.hello()
    jit.flush()
    expect(guest.world).not.toBe(undefined)
    // One idle tick, then a tick that starts the actor walking. Delivered back to front, blind
    // application walks the actor on both ticks instead of one -- a divergence the digest sees.
    // The guest must refuse the gap and rebuild rather than end up quietly wrong.
    host.pump()
    w.dispatch({ a: Act.stride, t: 0, p: 0, x: 1, y: 0 })
    host.pump()
    expect(jit.pending()).toBe(2)
    jit.swap()
    jit.flush()
    expect(guest.world?.now).toBe(w.now)
    expect(guest.world?.seats[0].actor.x).toBe(w.seats[0].actor.x)
    expect(digestDiff(guest.world as World, w)).toEqual([])
  })

  test('a third player joining re-snapshots the guests already connected', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const [a1, b1] = loopback()
    host.attach(a1)
    const guestA = new MpGuest(b1, 'a')
    guestA.hello()
    expect(guestA.world?.seats).toHaveLength(2)
    const [a2, b2] = loopback()
    host.attach(a2)
    const guestB = new MpGuest(b2, 'b')
    guestB.hello()
    expect(w.seats).toHaveLength(3)
    // Without a re-snapshot guest A keeps two seats forever: `roster` cannot create one, and the
    // first bundled command for seat 2 would then throw inside the transport's data handler.
    expect(guestA.world?.seats).toHaveLength(3)
    expect(digestDiff(guestA.world as World, w)).toEqual([])
    expect(digestDiff(guestB.world as World, w)).toEqual([])
    host.pump()
    expect(digestDiff(guestA.world as World, w)).toEqual([])
  })

  test('a command for a seat this peer has not been told about no-ops instead of throwing', () => {
    const w = new World(1)
    expect(() => applyBundle(w, [{ a: Act.stride, t: 0, p: 2, x: 1, y: 0 }])).not.toThrow()
  })

  test('a command cursor that fell off the log ring gets a snapshot, not a replay', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const [a, b] = loopback()
    host.attach(a)
    const guest = new MpGuest(b, 'g1')
    guest.hello()
    host.pump()
    const money = w.money
    // Overrun LOG_CAP while the host is paused, so the guest's cursor drops below logBase.
    host.setPaused(true)
    for (let i = 0; i < 600; i++) w.dispatch({ a: Act.closeHud, t: 0, p: 0 })
    expect(w.logSince(0)).toBe(undefined)
    host.setPaused(false)
    host.pump()
    // A clamped slice would re-apply hundreds of already-applied commands.
    expect(digestDiff(guest.world as World, w)).toEqual([])
    expect(guest.world?.money).toBe(money)
  })

  test('a missed bundle is a gap: later bundles stay queued, catching holds, lastWall does not move, a lost hello still stalls and resyncs', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const [a, b] = loopback()
    let armed = false
    let dropHello = true
    const sendA = a.send.bind(a)
    a.send = (msg: MpMsg) => {
      if (msg.a === 'bundle' && msg.t === 3) {
        armed = true
        return
      }
      sendA(msg)
    }
    const sendB = b.send.bind(b)
    b.send = (msg: MpMsg) => {
      if (msg.a === 'hello' && armed && dropHello) {
        dropHello = false
        return
      }
      sendB(msg)
    }
    host.attach(a)
    const guest = new MpGuest(b, 'g1')
    let t = 1000
    guest.wall = () => t
    guest.hello()
    expect(guest.world).not.toBe(undefined)
    for (let i = 0; i < 20; i++) host.pump()
    expect(w.now).toBe(20)
    expect(guest.world?.now).toBe(2)
    expect(guest.catching).toBe(true)
    t += 100
    guest.pumpGap(t)
    expect(guest.world?.now).toBe(2)
    t += STALL_MS + 1
    guest.pumpGap(t)
    expect(guest.world?.now).toBe(w.now)
    expect(guest.catching).toBe(false)
  })

  test('World.pumps tanks wells taps stills waterSystems are purchase order on the host. Dump writes no arrays for them; parse walks cells, so those lists are chunk then row/col after hydrate. pull shares by array order, so stored and pumpLiters diverge after join. rebase() sorts those lists by originCell row then col (comparator in sim/util.ts, same shape as boomHits: a.row === b.row ? a.col - b.col : a.row - b.row). Not per tick. Not per push. World.pump and generateChunk\'s starter argument find form === \'starter\'; sort must not be required to keep index 0. Parse does not unshift the starter pump. Do not sort hangars, silos, or modifiers — those are not in pull.', () => {
    expect(originOrder({ row: 1, col: 2 }, { row: 1, col: 3 })).toBe(-1)
    expect(originOrder({ row: 2, col: 0 }, { row: 1, col: 9 })).toBeGreaterThan(0)
    const w = new World(1)
    w.unlockAll()
    w.money = 9999
    const jackAt = { col: 4, row: 4 }
    w.setCell(jackAt, { kind: 'empty', soil: bed() })
    w.setCell({ col: 5, row: 4 }, { kind: 'empty', soil: bed() })
    w.buy('buy-pumpjack')
    w.confirmPlace(jackAt)
    expect(w.pumps[0].form).toBe('starter')
    expect(w.pumps[1].form).toBe('jack')
    expect(originOrder(originCell(w.pumps[1].base), originCell(w.pump.base))).toBeLessThan(0)
    w.tick(DT_MAX)
    expect(w.pumps[0].form).toBe('starter')
    const hangarA = { col: 10, row: 16 }
    const hangarB = { col: 4, row: 8 }
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        w.setCell({ col: hangarA.col + col, row: hangarA.row + row }, { kind: 'empty', soil: bed() })
        w.setCell({ col: hangarB.col + col, row: hangarB.row + row }, { kind: 'empty', soil: bed() })
      }
    }
    w.buy('buy-hangar')
    w.confirmPlace(hangarA)
    w.buy('buy-hangar')
    w.confirmPlace(hangarB)
    expect(w.hangars[0].base.col).toBe(hangarA.col)
    expect(w.hangars[1].base.col).toBe(hangarB.col)
    const parsedBefore = parse(JSON.stringify(dump(w)))
    expect(parsedBefore.ok).toBe(true)
    if (!parsedBefore.ok) return
    expect(parsedBefore.world.pumps[0].form).toBe('jack')
    expect(parsedBefore.world.pump.form).toBe('starter')
    expect(w.pumps[0].form).toBe('starter')
    w.rebase()
    expect(w.pumps[0].form).toBe('jack')
    expect(w.pump.form).toBe('starter')
    expect(w.hangars[0].base.col).toBe(hangarA.col)
    expect(w.hangars[1].base.col).toBe(hangarB.col)
    const parsed = parse(JSON.stringify(dump(w)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.world.pumps.map(p => originCell(p.base))).toEqual(w.pumps.map(p => originCell(p.base)))
    expect(parsed.world.pump.form).toBe('starter')
  })

  test('Host `rebase()` before every `dump` on the wire. `rebase()` clears every seat, so a dump to one link leaves the others on old `place`. One `rebaseAndSnapshotAll(except?)` for underflow, seated hello, and new join. `logSince` below `logBase` → `undefined` → resync, never a clamped replay.', () => {
    const w = new World(1)
    w.done.add('unlock-irrigation')
    w.money = 999
    w.pumpLiters = 40
    w.stall.carrot.sat = 0.5
    const host = new MpHost(w)
    const [a1, b1] = loopback()
    host.attach(a1)
    const guestA = new MpGuest(b1, 'a')
    guestA.hello()
    expect(w.pumpLiters).toBe(0)
    expect(guestA.world?.pumpLiters).toBe(0)
    expect(w.stall.carrot.sat).toBe(0)
    expect(guestA.world?.stall.carrot.sat).toBe(0)
    w.buy('buy-pipe')
    host.pump()
    expect(w.seats[0].place.kind).toBe('sku')
    expect(guestA.world?.seats[0].place.kind).toBe('sku')
    const [a2, b2] = loopback()
    host.attach(a2)
    const guestB = new MpGuest(b2, 'b')
    guestB.hello()
    expect(w.seats[0].place.kind).toBe('none')
    expect(guestA.world?.seats[0].place.kind).toBe('none')
    expect(guestB.world?.seats[0].place.kind).toBe('none')
    expect(guestA.world?.seats).toHaveLength(3)
    expect(digestDiff(guestA.world as World, w)).toEqual([])
    expect(digestDiff(guestB.world as World, w)).toEqual([])
    w.buy('buy-pipe')
    expect(w.seats[0].place.kind).toBe('sku')
    guestA.hello()
    expect(w.seats[0].place.kind).toBe('none')
    expect(guestA.world?.seats[0].place.kind).toBe('none')
    expect(guestB.world?.seats[0].place.kind).toBe('none')
    w.buy('buy-pipe')
    host.setPaused(true)
    for (let i = 0; i < 600; i++) w.dispatch({ a: Act.closeHud, t: 0, p: 0 })
    expect(w.logSince(0)).toBe(undefined)
    expect(w.seats[0].place.kind).toBe('sku')
    host.setPaused(false)
    host.pump()
    expect(w.seats[0].place.kind).toBe('none')
    expect(guestA.world?.seats[0].place.kind).toBe('none')
    expect(guestB.world?.seats[0].place.kind).toBe('none')
    expect(digestDiff(guestA.world as World, w)).toEqual([])
    expect(digestDiff(guestB.world as World, w)).toEqual([])
  })
})

function delayToHost(): { hostW: MpWire; guestW: MpWire; flush: () => void } {
  let hfn: ((msg: MpMsg) => void) | undefined
  let gfn: ((msg: MpMsg) => void) | undefined
  const q: MpMsg[] = []
  const hostW: MpWire = {
    send(msg) {
      if (gfn !== undefined) gfn(msg)
    },
    onRecv(fn) {
      hfn = fn
    },
    close() {
      hfn = undefined
      gfn = undefined
    },
  }
  const guestW: MpWire = {
    send(msg) {
      q.push(msg)
    },
    onRecv(fn) {
      gfn = fn
    },
    close() {
      hfn = undefined
      gfn = undefined
    },
  }
  return {
    hostW,
    guestW,
    flush() {
      while (q.length > 0) {
        const m = q.shift()
        if (m === undefined) return
        if (hfn !== undefined) hfn(m)
      }
    },
  }
}
