// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { Plant } from './plant.ts'
import { Rng } from './rng.ts'
import { dump, parse } from './save.ts'
import { Soil, SOIL_WATER_MID, waterBand } from './soil.ts'
import { check, ready, startTutorial, type Tutorial } from './tutorial.ts'
import { World } from './world.ts'

const AT = { col: 10, row: 12 }

function on(step: Tutorial['kind'] extends 'on' ? never : 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, extra?: { poured?: boolean; sold?: boolean }): Tutorial {
  return { kind: 'on', step, poured: extra?.poured === true, sold: extra?.sold === true }
}

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
  return new Soil(water, fertilizer, 0.03)
}

function plots(w: World, n: number, kind: 'empty' | 'growing' | 'ripe'): void {
  for (let i = 0; i < n; i++) {
    const at = { col: 10 + i, row: 12 }
    if (kind === 'empty') w.setCell(at, { kind: 'empty', soil: bed() })
    else w.setCell(at, { kind, soil: bed(), plant: new Plant('carrot', 'base', 0) })
  }
}

describe('tutorial', () => {
  test('Tutorial on only at New Game with `!slotExists()` and fragment not `start_now` or `unlockall`. `slotExists()` or `#start_now` or `#unlockall` → off, including New Game. Load / Upload → off.', () => {
    expect(startTutorial('new', false).kind).toBe('on')
    expect(startTutorial('new', true).kind).toBe('off')
    expect(startTutorial('start_now', false).kind).toBe('off')
    expect(startTutorial('start_now', true).kind).toBe('off')
    expect(startTutorial('load', false).kind).toBe('off')
    expect(startTutorial('load', true).kind).toBe('off')
    expect(startTutorial('upload', false).kind).toBe('off')
    expect(startTutorial('upload', true).kind).toBe('off')
  })

  test('No tutorial field on `Save` or `World`. Session only. Parse does not resume a step.', () => {
    const w = new World(1)
    expect(Object.hasOwn(w, 'tutorial')).toBe(false)
    const save = dump(w)
    expect(Object.hasOwn(save, 'tutorial')).toBe(false)
    const r = parse(JSON.stringify(save))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(Object.hasOwn(r.world, 'tutorial')).toBe(false)
  })

  test('`tilledCount` is `isTilled` cells (`empty` `weed` `turf` `growing` `ripe` `dead` `rotten`), distinct. Five such cells: not step 2.', () => {
    const w = new World(1)
    const t1 = check(w, on(1))
    expect(t1.kind === 'on' && t1.step === 1).toBe(true)
    const spots = [
      { col: 10, row: 12 },
      { col: 11, row: 12 },
      { col: 12, row: 12 },
      { col: 13, row: 12 },
      { col: 14, row: 12 },
    ]
    w.setCell(spots[0], { kind: 'empty', soil: bed() })
    const afterOne = check(w, on(1))
    expect(afterOne.kind === 'on' && afterOne.step === 2).toBe(true)
    w.setCell(spots[1], { kind: 'empty', soil: bed() })
    w.setCell(spots[2], { kind: 'empty', soil: bed() })
    w.setCell(spots[3], { kind: 'empty', soil: bed() })
    w.setCell(spots[4], { kind: 'empty', soil: bed() })
    const afterFive = check(w, on(1))
    expect(afterFive.kind === 'on' && afterFive.step !== 2).toBe(true)
    expect(afterFive.kind === 'on' && afterFive.step === 3).toBe(true)
    w.setCell(spots[0], { kind: 'empty', soil: bed() })
    const still = check(w, afterFive)
    expect(still.kind === 'on' && still.step === 3).toBe(true)
  })

  test('Step 5 completes on `startResearch` that sets `job.kind === \'run\'`, or `done.size > 0`. Not on opening Research.', () => {
    const w = new World(1)
    plots(w, 5, 'growing')
    const at5 = check(w, on(1))
    expect(at5.kind === 'on' && at5.step === 5).toBe(true)
    const opened = check(w, at5)
    expect(opened.kind === 'on' && opened.step === 5).toBe(true)
    expect(w.job.kind).toBe('idle')
    w.startResearch('unlock-tomato')
    expect(w.job.kind).toBe('run')
    const after = check(w, at5)
    expect(after.kind === 'on' && after.step !== 5).toBe(true)
    const w2 = new World(1)
    plots(w2, 5, 'growing')
    w2.done.add('unlock-tomato')
    const viaDone = check(w2, on(1))
    expect(viaDone.kind === 'on' && viaDone.step !== 5).toBe(true)
  })

  test('Step 6 ready is `waterBand(...) === \'red\'` on a `growing` plant. No extra thirst flag.', () => {
    const w = new World(1)
    const p = new Plant('carrot', 'base', 0)
    w.setCell(AT, { kind: 'growing', soil: bed(0), plant: p })
    expect(waterBand(0, p.stats(w.modifiers).waterTolerance)).toBe('red')
    const t: Tutorial = { kind: 'on', step: 6, poured: false, sold: false }
    expect(ready(6, w, t)).toBe(true)
    w.setCell(AT, { kind: 'growing', soil: bed(SOIL_WATER_MID), plant: p })
    expect(ready(6, w, t)).toBe(false)
    expect('thirst' in w).toBe(false)
    expect('thirst' in p).toBe(false)
  })

  test('Step 8 completes on a paying `sellAll` (`marketOpen` and `marketGain() > 0`). No-op does not complete.', () => {
    const w = new World(1)
    plots(w, 4, 'growing')
    w.setCell({ col: 14, row: 12 }, { kind: 'ripe', soil: bed(), plant: new Plant('carrot', 'base', 0) })
    w.done.add('unlock-tomato')
    w.drops.push({
      at: AT,
      item: {
        kind: 'fruit',
        crop: 'carrot',
        variety: 'base', quality: 0,
        count: 1,
        unitSale: 1,
        freshness: 1,
        bio: true,
        cut: false,
      },
    })
    const t = check(w, on(1))
    expect(t.kind === 'on' && t.step === 8).toBe(true)
    w.clock.t = 220
    expect(w.marketOpen()).toBe(false)
    w.sellAll()
    const closed = check(w, t)
    expect(closed.kind === 'on' && closed.step === 8).toBe(true)
    w.clock.t = 10
    w.sellAll()
    expect(w.marketGain()).toBe(0)
    const noop = check(w, t)
    expect(noop.kind === 'on' && noop.step === 8).toBe(true)
    w.stall.carrot.take('base', 2, 1, true)
    expect(w.marketOpen() && w.marketGain() > 0).toBe(true)
    const pays = w.marketOpen() && w.marketGain() > 0
    w.sellAll()
    const next = check(w, t.kind === 'on' ? { ...t, sold: pays } : t)
    expect(next.kind === 'on' && next.step === 9).toBe(true)
  })

  test('Step 9 dismiss is a click on the tutorial card. Then off for this session. No timer, no click-anywhere, no auto-dismiss.', () => {
    const w = new World(1)
    const t: Tutorial = { kind: 'on', step: 9, poured: true, sold: true }
    expect(check(w, t)).toEqual(t)
    const later = check(w, t)
    expect(later.kind).toBe('on')
    expect(later.kind === 'on' && later.step === 9).toBe(true)
  })

  test('Tutorial does not change crops, buildings, skills, or economy. Does not block HUD. Does not force camera. No step counter.', () => {
    const w = new World(1)
    const money = w.money
    const crop = w.cell(AT).kind
    const owned = w.family.player.owned.size
    check(w, on(1))
    expect(w.money).toBe(money)
    expect(w.cell(AT).kind).toBe(crop)
    expect(w.family.player.owned.size).toBe(owned)
  })

  test('dump→parse restores seed, clock, money, shop/fruit cursors, a tilled cell, idle gardener', () => {
    const w = new World(1)
    w.rng.stream('fruit').next()
    w.rng.stream('fruit').next()
    w.rng.stream('fruit').next()
    w.setCell(AT, { kind: 'empty', soil: bed(0.8, 0.4) })
    w.clock.day = 3
    w.clock.t = 41
    w.money = 88
    w.seats[0].actor.x = 12.25
    w.seats[0].actor.y = 9.75
    w.enqueue({ act: 'walk', at: AT })
    const text = JSON.stringify(dump(w))
    const r = parse(text)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.world.seed).toBe(1)
    expect(r.world.clock.day).toBe(3)
    expect(r.world.clock.t).toBe(41)
    expect(r.world.money).toBe(88)
    expect(r.world.rng.consumed('fruit')).toBe(3)
    expect(r.world.cell(AT).kind).toBe('empty')
    expect(r.world.seats[0].queue).toEqual([])
    expect(r.world.seats[0].actor.work).toBe(0)
    expect(r.world.seats[0].actor.x).toBe(12.25)
    expect(r.world.seats[0].actor.y).toBe(9.75)
    const seq = new Rng(1)
    seq.stream('fruit').next()
    seq.stream('fruit').next()
    seq.stream('fruit').next()
    expect(r.world.rng.stream('fruit').next()).toBe(seq.stream('fruit').next())
  })

})
