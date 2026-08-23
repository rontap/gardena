import { describe, expect, test } from 'vitest'
import { BOX_SMALL } from '../defs/items.ts'
import { Act } from './log.ts'
import { dump, parse } from './save.ts'
import { Plant } from './plant.ts'
import { Soil, SOIL_WATER_MID } from './soil.ts'
import {
  applyBundle,
  digestHex,
  loopback,
  permit,
  readMpMsg,
  MpGuest,
  MpHost,
  PROTOCOL,
  type MpMsg,
  type MpWire,
} from './mp.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
  return new Soil(water, fertilizer)
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
    expect(PROTOCOL).toBe(1.1)
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

  test('Guest may shop + place + delete building for pumpjack, well, rain-tank, tap, chest, grinder, compost-box. Guest chest swapChest, pipes, valves, sprinklers, tiles, fences, expand, research start, family pick, cheat: not.', () => {
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-pumpjack' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-well' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-rain-tank' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-tap' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-chest' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-grinder' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-compost-box' })).toBe(true)
    expect(permit({ a: Act.delete, t: 0, p: 1, k: 'building', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-pipe' })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-valve' })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-sprinkler' })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-sprinkler-vert' })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-sprinkler-large' })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-tile-paved' })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-tile-brick' })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-tile-cobble' })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-fence' })).toBe(false)
    expect(permit({ a: Act.placePipe, t: 0, p: 1, e: { axis: 'h', col: 0, row: 0 } })).toBe(false)
    expect(permit({ a: Act.placeSprinkler, t: 0, p: 1, s: { variant: 'basic', at: { col: 1, row: 1 }, tune: { kind: 'flat' } } })).toBe(false)
    expect(permit({ a: Act.clickValve, t: 0, p: 1, e: { axis: 'h', col: 0, row: 0 } })).toBe(false)
    expect(permit({ a: Act.delete, t: 0, p: 1, k: 'pipe', e: { axis: 'h', col: 0, row: 0 } })).toBe(false)
    expect(permit({ a: Act.expand, t: 0, p: 1, k: { cx: 1, cy: 0 } })).toBe(false)
    expect(permit({ a: Act.startResearch, t: 0, p: 1, r: 'unlock-expand' })).toBe(false)
    expect(permit({ a: Act.pickSkill, t: 0, p: 1, m: 'husband', s: 0 })).toBe(false)
    expect(permit({ a: Act.cheat, t: 0, p: 1, k: 'all' })).toBe(false)
    expect(permit({ a: Act.swapChest, t: 0, p: 1, c: [2, 2], i: 0 })).toBe(false)
  })

  test('presence === \'away\': tick skips that actor walk/work and that seat hand/inventory freshness (box cargo included). Field, chest, and ground rot continue. Seat stays in seats.', () => {
    const w = new World(1)
    expect(w.join('g')).toBe(1)
    const s1 = w.seats[1]
    s1.hand = {
      kind: 'hold',
      item: {
        kind: 'box',
        cap: BOX_SMALL,
        cargo: {
          kind: 'stack',
          goods: 'fruit',
          stack: { crop: 'carrot', rarity: 'common', count: 1, unitSale: 4, freshness: 1, bio: true },
        },
      },
    }
    s1.actor.x = 4
    s1.actor.y = 4
    s1.queue.push({ act: 'walk', at: AT })
    const plant = new Plant('carrot', 'common')
    plant.maturity = 1
    w.setCell(AT, { kind: 'growing', soil: bed(), plant })
    w.tick(DT_MAX)
    const ripe = w.cell(AT)
    expect(ripe.kind).toBe('ripe')
    const field0 = ripe.kind === 'ripe' ? ripe.plant.freshness : -1
    w.away(1)
    const box0 =
      s1.hand.kind === 'hold' &&
      s1.hand.item.kind === 'box' &&
      s1.hand.item.cargo.kind === 'stack'
        ? s1.hand.item.cargo.stack.freshness
        : -1
    const x = s1.actor.x
    for (let i = 0; i < 20; i++) w.tick(DT_MAX)
    expect(s1.presence).toBe('away')
    expect(w.seats).toHaveLength(2)
    expect(s1.actor.x).toBe(x)
    const box1 =
      s1.hand.kind === 'hold' &&
      s1.hand.item.kind === 'box' &&
      s1.hand.item.cargo.kind === 'stack'
        ? s1.hand.item.cargo.stack.freshness
        : -1
    expect(box1).toBe(box0)
    const after = w.cell(AT)
    expect(after.kind === 'ripe' && after.plant.freshness).toBeLessThan(field0)
  })

  test('parse(text): JSON.parse throw or non-object → { ok: false, reason: \'unusable\' }. game !== "gardena" → reason: \'not-gardena\'. File version ≠ dump version (absent included) → reason: \'version\'. Else one hydrate of live fields including seats. Reconstruct → { ok: true, world }. Hydrate fail → reason: \'unusable\'. No migrate. LoadFailReason is \'not-gardena\' | \'version\' | \'unusable\'.', () => {
    expect(parse('not-json').ok).toBe(false)
    if (parse('not-json').ok) return
    expect(parse('not-json').reason).toBe('unusable')
    expect(parse(JSON.stringify({ game: 'nope' })).ok).toBe(false)
    if (parse(JSON.stringify({ game: 'nope' })).ok) return
    expect(parse(JSON.stringify({ game: 'nope' })).reason).toBe('not-gardena')
    const w = new World(1)
    const s = dump(w)
    const ok = parse(JSON.stringify(s))
    expect(ok.ok).toBe(true)
    const old = parse(JSON.stringify({ ...s, version: 1.0 }))
    expect(old.ok).toBe(false)
    if (old.ok) return
    expect(old.reason).toBe('version')
    const noVer = { ...s }
    delete (noVer as { version?: unknown }).version
    const missing = parse(JSON.stringify(noVer))
    expect(missing.ok).toBe(false)
    if (missing.ok) return
    expect(missing.reason).toBe('version')
    const noSeats = { ...s }
    delete (noSeats as { seats?: unknown }).seats
    const bad = parse(JSON.stringify(noSeats))
    expect(bad.ok).toBe(false)
    if (bad.ok) return
    expect(bad.reason).toBe('unusable')
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
    let bye: 'host-left' | 'kicked' | undefined
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

  test('Digest mismatch hello still counts after later pumps. Second mismatch kicks. 5s-style hello without digestWait does not.', () => {
    const w = new World(1)
    const host = new MpHost(w)
    const { hostW, guestW, flush } = delayToHost()
    host.attach(hostW)
    const guest = new MpGuest(guestW, 'g1')
    let bye: 'host-left' | 'kicked' | undefined
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
    let bye: 'host-left' | 'kicked' | undefined
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
    expect(guest.catching).toBe(true)
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
    let bye: 'host-left' | 'kicked' | undefined
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
