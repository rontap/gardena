import { describe, expect, test } from 'vitest'
import { HAPPY_MAX } from '../defs/crops.ts'
import { Plant, Weed } from '../sim/plant.ts'
import { Soil, SOIL_WATER_MID, WEED_CHANCE } from '../sim/soil.ts'
import {
  applyRoster,
  AWAY_MS,
  DROP_MS,
  loopback,
  MpGuest,
  MpHost,
  NAP_MS,
  readMpMsg,
  rosterOf,
  type RosterSeat,
} from '../sim/mp.ts'
import { World } from '../sim/world.ts'
import { DAY_SECONDS } from '../sim/clock.ts'
import {
  doneRows,
  dropNotice,
  groupNotices,
  noticeRows,
  passOf,
  rosterNotices,
  trackPass,
  visibleRows,
  NOTICE_ORDER,
  type Notice,
} from './notices.ts'

const AT = { col: 10, row: 12 }

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
  return new Soil(water, fertilizer, WEED_CHANCE)
}

function kinds(rows: readonly Notice[]): string[] {
  return rows.map(r => r.kind)
}

describe('notices.pure', () => {
  test('noticeRows(world) reads World (including recaps / recapUnseen) and writes nothing. Plant stats are folded into a Map local to the pass, never World.statsCached. No notice is a Cmd, is digested, or sets a DirtyReason. seeRecap is App click → World, not the pass. Deleting ui/notices.ts and ui/notices.tsx leaves the sim ticking.', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    const before = {
      money: w.money,
      points: w.points,
      grow: w.grow.size,
      day: w.clock.day,
      t: w.clock.t,
      job: w.job.kind,
      active: w.contracts.active.length,
      cell: w.cell(AT).kind,
      recaps: w.recaps.length,
      recapUnseen: w.recapUnseen.slice(),
    }
    let pinged = 0
    const off = w.on(() => {
      pinged += 1
    })
    noticeRows(w)
    noticeRows(w)
    off()
    expect(pinged).toBe(0)
    expect({
      money: w.money,
      points: w.points,
      grow: w.grow.size,
      day: w.clock.day,
      t: w.clock.t,
      job: w.job.kind,
      active: w.contracts.active.length,
      cell: w.cell(AT).kind,
      recaps: w.recaps.length,
      recapUnseen: w.recapUnseen.slice(),
    }).toEqual(before)
    expect(kinds(noticeRows(w))).toContain('recap')
  })
})

describe('notices.red', () => {
  test('only a red band is a notice. Orange is not.', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    expect(kinds(noticeRows(w))).toContain('wilting')

    const mid = new World()
    mid.setCell(AT, { kind: 'growing', soil: bed(SOIL_WATER_MID), plant: new Plant('carrot', 'base', 0) })
    expect(kinds(noticeRows(mid))).not.toContain('wilting')
  })

  test('drowning splits off wilting on the wet side of red', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(2), plant: new Plant('carrot', 'base', 0) })
    const rows = noticeRows(w)
    expect(kinds(rows)).toContain('drowning')
    expect(kinds(rows)).not.toContain('wilting')
  })

  test('a red fertilizer band is starving, and carries the happiness clock', () => {
    const w = new World()
    const p = new Plant('carrot', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(SOIL_WATER_MID, 0), plant: p })
    const row = noticeRows(w).find(r => r.kind === 'starving')
    expect(row).toBeDefined()
    expect(row?.bar).toBe(p.happiness / HAPPY_MAX)
    expect(row?.cells).toEqual([AT])
  })

  test('dead and rotten cells are notices with no bar', () => {
    const w = new World()
    w.setCell(AT, { kind: 'dead', soil: bed(), plant: new Plant('carrot', 'base', 0) })
    w.setCell({ col: 10, row: 13 }, { kind: 'rotten', soil: bed(), crop: 'carrot' })
    const rows = noticeRows(w)
    expect(kinds(rows)).toContain('dead')
    expect(kinds(rows)).toContain('rotten')
    rows
      .filter(r => r.kind === 'dead' || r.kind === 'rotten')
      .forEach(r => {
        expect(r.bar).toBeUndefined()
      })
  })

  test('weeds are one row for the whole farm, carrying every weed plot, and no row when there are none', () => {
    const w = new World()
    expect(kinds(noticeRows(w))).not.toContain('weed')
    w.setCell(AT, { kind: 'weed', soil: bed(), weed: new Weed(0) })
    w.setCell({ col: 10, row: 13 }, { kind: 'weed', soil: bed(), weed: new Weed(1) })
    const rows = noticeRows(w).filter(r => r.kind === 'weed')
    expect(rows).toHaveLength(1)
    expect(rows[0].cells).toHaveLength(2)
    expect(rows[0].bar).toBeUndefined()
    expect(rows[0].go.kind).toBe('none')
  })
})

describe('notices.once', () => {
  test('a contract gone from active with a done outcome mints a completed row', () => {
    const w = new World()
    w.contracts.history.push({
      id: 7,
      company: 'whole-cart',
      stars: 1,
      day: 1,
      outcome: { kind: 'done', paid: 10, prize: { kind: 'cash' } },
    })
    const rows = doneRows(w, { activeIds: [7], running: undefined })
    expect(kinds(rows)).toEqual(['contract-done'])
    expect(rows[0].bar).toBeUndefined()
  })

  test('a contract gone from active with a missed outcome mints nothing', () => {
    const w = new World()
    w.contracts.history.push({
      id: 7,
      company: 'whole-cart',
      stars: 1,
      day: 1,
      outcome: { kind: 'missed', sold: 0, penalty: 5 },
    })
    expect(doneRows(w, { activeIds: [7], running: undefined })).toEqual([])
  })

  test('a run that stopped with its id in done mints a research row', () => {
    const w = new World()
    w.done.add('unlock-fertilizer')
    const rows = doneRows(w, { activeIds: [], running: 'unlock-fertilizer' })
    expect(kinds(rows)).toEqual(['research-done'])
  })

  test('a run still running mints nothing', () => {
    const w = new World()
    w.job = { kind: 'run', id: 'unlock-fertilizer', left: 5 }
    w.done.add('unlock-fertilizer')
    expect(doneRows(w, passOf(w))).toEqual([])
  })

  test('Roster kinds share dismiss and drop-on-swap; they are not recovered from World — notices.roster.', () => {
    const w = new World()
    w.join('g1', 'Ada')
    expect(doneRows(w, passOf(w)).some(r => r.kind === 'joined' || r.kind === 'quit' || r.kind === 'desynced')).toBe(false)
    expect(kinds(noticeRows(w)).some(k => k === 'joined' || k === 'quit' || k === 'desynced')).toBe(false)
  })
})

describe('notices.group', () => {
  test('rows of one kind are one block, in NOTICE_ORDER', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    w.setCell({ col: 10, row: 13 }, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    w.points = 2
    const blocks = groupNotices(noticeRows(w))
    const wilting = blocks.find(b => b.kind === 'wilting')
    expect(wilting?.rows.length).toBe(2)
    expect(blocks.filter(b => b.kind === 'wilting').length).toBe(1)
    const order = blocks.map(b => NOTICE_ORDER.indexOf(b.kind))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  test('a row id is stable across passes for the same condition on the same plot', () => {
    const w = new World()
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    const first = noticeRows(w).map(r => r.id)
    const second = noticeRows(w).map(r => r.id)
    expect(second).toEqual(first)
  })
})

describe('standing rows', () => {
  test('skill points and expansion show only above zero, and click through', () => {
    const w = new World()
    expect(kinds(noticeRows(w))).not.toContain('points')
    w.points = 3
    const row = noticeRows(w).find(r => r.kind === 'points')
    expect(row?.go).toEqual({ kind: 'panel', panel: 'family' })
    expect(row?.bar).toBeUndefined()
  })
})

describe('notices.popup', () => {
  test('NoticeGo is `{ kind: \'none\' } | { kind: \'panel\'; panel } | { kind: \'popup\'; popup }`. Left click on a row runs that row\'s `go`. Recap `go` sets App `recapDay` to that ended day. Not `World.seam`. Opening does not `seeRecap`.', () => {
    const w = new World(1)
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    expect(w.seam.kind).toBe('play')
    const row = noticeRows(w).find(r => r.kind === 'recap')
    expect(row?.go).toEqual({ kind: 'popup', popup: { kind: 'recap', day: 1 } })
    expect(row?.bar).toBeUndefined()
    expect(row?.subjects).toEqual([])
    expect(w.recapUnseen).toEqual([1])
    expect(NOTICE_ORDER[0]).toBe('recap')
  })
})

describe('notices.dismiss', () => {
  test('Right-click a row: `preventDefault`, discard that row, do not run `go`. Event rows `recap` / `joined` / `quit` / `desynced` / `contract-done` / `research-done` are gone; recap also `seeRecap(day)`. Condition rows dismissed while the condition holds leave the pass and drop the id; return is two-pass as new. Recap popup Close / Esc / backdrop: `seeRecap(day)` and close. Guest Close live.', () => {
    const w = new World(1)
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    const recap = noticeRows(w).find(r => r.kind === 'recap')
    expect(recap).toBeDefined()
    if (recap === undefined) return
    const first = trackPass(new Map(), noticeRows(w))
    expect(visibleRows(first, []).some(r => r.id === recap.id)).toBe(true)
    const dropped = dropNotice(first, [], recap.id)
    expect(visibleRows(dropped.tracked, dropped.once).some(r => r.id === recap.id)).toBe(false)
    w.seeRecap(1)
    expect(w.recapUnseen).toEqual([])
    expect(kinds(noticeRows(w))).not.toContain('recap')

    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: new Plant('carrot', 'base', 0) })
    const now = noticeRows(w)
    const wilt = now.find(r => r.kind === 'wilting')
    expect(wilt).toBeDefined()
    if (wilt === undefined) return
    const pending = trackPass(new Map(), now)
    expect(visibleRows(pending, []).some(r => r.id === wilt.id)).toBe(false)
    const armed = trackPass(pending, now)
    expect(visibleRows(armed, []).some(r => r.id === wilt.id)).toBe(true)
    const gone = dropNotice(armed, [], wilt.id)
    expect(visibleRows(gone.tracked, gone.once).some(r => r.id === wilt.id)).toBe(false)
    const again = trackPass(gone.tracked, now)
    expect(visibleRows(again, []).some(r => r.id === wilt.id)).toBe(false)
    const back = trackPass(again, now)
    expect(visibleRows(back, []).some(r => r.id === wilt.id)).toBe(true)

    const hostSeat: RosterSeat = { id: 0, name: 'Host', presence: 'in', napping: false }
    const guestSeat: RosterSeat = { id: 1, name: 'Ada', presence: 'in', napping: false }
    const minted = rosterNotices([hostSeat], [hostSeat, guestSeat], 0, true, 0)
    expect(minted.rows).toHaveLength(1)
    const joined = minted.rows[0]
    const held = trackPass(new Map(), [joined])
    expect(visibleRows(held, []).some(r => r.id === joined.id)).toBe(true)
    const goneJoin = dropNotice(held, [joined], joined.id)
    expect(visibleRows(goneJoin.tracked, goneJoin.once).some(r => r.id === joined.id)).toBe(false)
  })
})

describe('notices.roster', () => {
  test('Kinds `joined` `quit` `desynced` are stamped at the net/App boundary, never by `noticeRows`. Not a `Cmd`. Not digested. Not in `Save`. Not a recap. They skip two-pass. Right-click dismiss; left click `go: none`. Reload or `World` swap drops them, same cost as `notices.once`. No cells. No bar. Face `{ kind: \'hat\'; seat }` → `actor-hat` tint `HAT[seat]`. Do not mint for `App.local`. Do not mint for `presence: \'away\'` from silence (`AWAY_MS` / nap). Quit is the link released (`drop` / leave / `lost`). Desynced is `bye: kicked` then drop. Joined is a new seat or `away` → `in`. Solo (`seats.length === 1`, no session) never mints. Host sets `RosterSeat.leave` `\'drop\' | \'kicked\'` on that roster push; silence roster omits `leave`. Other peers recover join from seats; quit vs kick from `leave` surviving `readMpMsg`. Additive JSON; do not bump `PROTOCOL`.', () => {
    const w = new World(1)
    expect(kinds(noticeRows(w))).not.toContain('joined')
    expect(kinds(noticeRows(w))).not.toContain('quit')
    expect(kinds(noticeRows(w))).not.toContain('desynced')
    w.join('g1', 'Ada')
    expect(kinds(noticeRows(w))).not.toContain('joined')
    expect(doneRows(w, passOf(w)).every(r => r.kind !== 'joined' && r.kind !== 'quit' && r.kind !== 'desynced')).toBe(true)

    const host: RosterSeat = { id: 0, name: 'Host', presence: 'in', napping: false }
    const ada: RosterSeat = { id: 1, name: 'Ada', presence: 'in', napping: false }
    const adaAway: RosterSeat = { id: 1, name: 'Ada', presence: 'away', napping: false }
    const adaNap: RosterSeat = { id: 1, name: 'Ada', presence: 'away', napping: true }
    const adaDrop: RosterSeat = { id: 1, name: 'Ada', presence: 'away', napping: false, leave: 'drop' }
    const adaKick: RosterSeat = { id: 1, name: 'Ada', presence: 'away', napping: false, leave: 'kicked' }

    expect(rosterNotices([], [host], 0, false, 0).rows).toEqual([])
    expect(rosterNotices([host], [host], 0, true, 0).rows).toEqual([])
    expect(rosterNotices([host], [host, ada], 0, false, 0).rows).toEqual([])
    expect(rosterNotices([host], [host, ada], 1, true, 0).rows).toEqual([])
    expect(rosterNotices([host], [host, adaAway], 0, true, 0).rows).toEqual([])

    const bea: RosterSeat = { id: 2, name: 'Bea', presence: 'in', napping: false }
    const dumpAfterJoin = [host, ada, bea]
    expect(rosterNotices(dumpAfterJoin, dumpAfterJoin, 1, true, 0).rows).toEqual([])
    const peerJoin = rosterNotices([host, ada], dumpAfterJoin, 1, true, 0)
    expect(peerJoin.rows.map(r => r.kind)).toEqual(['joined'])
    expect(peerJoin.rows[0].face).toEqual({ kind: 'hat', seat: 2 })

    const joined = rosterNotices([host], [host, ada], 0, true, 0)
    expect(joined.rows).toHaveLength(1)
    expect(joined.rows[0].kind).toBe('joined')
    expect(joined.rows[0].id).toBe('joined:1:1')
    expect(joined.rows[0].face).toEqual({ kind: 'hat', seat: 1 })
    expect(joined.rows[0].subjects).toEqual([])
    expect(joined.rows[0].cells).toEqual([])
    expect(joined.rows[0].bar).toBeUndefined()
    expect(joined.rows[0].go).toEqual({ kind: 'none' })

    const back = rosterNotices([host, adaAway], [host, ada], 0, true, joined.n)
    expect(back.rows).toHaveLength(1)
    expect(back.rows[0].kind).toBe('joined')
    expect(back.rows[0].id).toBe('joined:1:2')

    expect(rosterNotices([host, ada], [host, adaAway], 0, true, 0).rows).toEqual([])
    expect(rosterNotices([host, adaAway], [host, adaNap], 0, true, 0).rows).toEqual([])

    const quit = rosterNotices([host, ada], [host, adaDrop], 0, true, 0)
    expect(quit.rows.map(r => r.kind)).toEqual(['quit'])
    expect(quit.rows[0].face).toEqual({ kind: 'hat', seat: 1 })
    expect(quit.rows[0].bar).toBeUndefined()
    expect(quit.rows[0].go).toEqual({ kind: 'none' })

    const kicked = rosterNotices([host, ada], [host, adaKick], 0, true, 0)
    expect(kicked.rows.map(r => r.kind)).toEqual(['desynced'])
    expect(kicked.rows[0].go).toEqual({ kind: 'none' })

    const pending = trackPass(new Map(), joined.rows)
    expect(visibleRows(pending, []).map(r => r.id)).toEqual([joined.rows[0].id])
    const dropped = dropNotice(pending, joined.rows, joined.rows[0].id)
    expect(visibleRows(dropped.tracked, dropped.once)).toEqual([])

    expect(NOTICE_ORDER.slice(0, 6)).toEqual(['recap', 'joined', 'quit', 'desynced', 'contract-done', 'research-done'])

    const wireDrop = { a: 'roster' as const, seats: [host, adaDrop] }
    expect(readMpMsg(wireDrop)).toEqual(wireDrop)
    const wireKick = { a: 'roster' as const, seats: [host, adaKick] }
    expect(readMpMsg(wireKick)).toEqual(wireKick)
    expect(readMpMsg({ a: 'roster', seats: [host, { ...adaAway, leave: 'nope' }] })).toEqual({
      a: 'roster',
      seats: [host, adaAway],
    })
    expect(readMpMsg({ a: 'roster', seats: [host, adaAway] })).toEqual({ a: 'roster', seats: [host, adaAway] })

    const farm = new World(1)
    const hostNet = new MpHost(farm)
    const pushes: RosterSeat[][] = []
    hostNet.onRoster = seats => {
      pushes.push(seats)
    }
    let wall = 0
    hostNet.wall = () => wall
    const [a, b] = loopback()
    hostNet.attach(a)
    const guest = new MpGuest(b, 'g1', 'Ada')
    const peer: RosterSeat[][] = []
    guest.onRoster = seats => {
      peer.push(seats)
    }
    guest.hello()
    const afterJoin = pushes[pushes.length - 1]
    expect(afterJoin.some(s => s.id === 1 && !('leave' in s) && s.presence === 'in')).toBe(true)
    expect(rosterOf(farm).every(s => !('leave' in s))).toBe(true)

    wall = AWAY_MS
    hostNet.sweep()
    const silent = pushes[pushes.length - 1]
    expect(silent.find(s => s.id === 1)).toEqual({ id: 1, name: 'Ada', presence: 'away', napping: false })
    wall = NAP_MS
    hostNet.sweep()
    const nap = pushes[pushes.length - 1]
    expect(nap.find(s => s.id === 1)).toEqual({ id: 1, name: 'Ada', presence: 'away', napping: true })
    expect(nap.every(s => !('leave' in s))).toBe(true)

    wall = DROP_MS
    hostNet.sweep()
    const droppedLink = pushes[pushes.length - 1].find(s => s.id === 1)
    expect(droppedLink).toEqual({ id: 1, name: 'Ada', presence: 'away', napping: true, leave: 'drop' })

    const farm2 = new World(1)
    const host2 = new MpHost(farm2)
    const seen: RosterSeat[][] = []
    host2.onRoster = seats => {
      seen.push(seats)
    }
    const [a1, b1] = loopback()
    host2.attach(a1)
    const gA = new MpGuest(b1, 'a', 'Ada')
    const peerA: RosterSeat[][] = []
    gA.onRoster = seats => {
      peerA.push(seats)
    }
    gA.hello()
    const [a2, b2] = loopback()
    host2.attach(a2)
    const gB = new MpGuest(b2, 'b', 'Bea')
    gB.hello()
    host2.drop(a2, 'kicked')
    const kickPush = seen[seen.length - 1].find(s => s.id === 2)
    expect(kickPush).toEqual({ id: 2, name: 'Bea', presence: 'away', napping: false, leave: 'kicked' })
    const peerSaw = peerA[peerA.length - 1].find(s => s.id === 2)
    expect(peerSaw).toEqual({ id: 2, name: 'Bea', presence: 'away', napping: false, leave: 'kicked' })
    expect(readMpMsg({ a: 'roster', seats: peerA[peerA.length - 1] })).toEqual({
      a: 'roster',
      seats: peerA[peerA.length - 1],
    })

    const mirror = new World(1)
    mirror.join('a', 'stale')
    mirror.join('b', 'stale')
    applyRoster(mirror, peerA[peerA.length - 1])
    expect(mirror.seats[2].presence).toBe('away')
    expect(mirror.seats[2].name).toBe('Bea')
  })
})
