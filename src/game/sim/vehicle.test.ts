import { describe, expect, test } from 'vitest'
import {
  HANGAR_H,
  HANGAR_W,
  HARVEST_SLOTS,
  QUAD_ACCEL,
  QUAD_EMPTY_MUL,
  QUAD_FUEL_SECONDS,
  QUAD_PRICE,
  QUAD_REFILL,
  QUAD_VMAX,
  QUAD_YAW,
  SILO_SEED_PRICE,
  SURFACE_NORMAL,
  SURFACE_PAVED,
  SURFACE_SLOW,
  TRACTOR_ACCEL,
  TRACTOR_PRICE,
  TRACTOR_VMAX,
  TRAILER_CAP,
  TRAILER_HARVEST_PRICE,
  TRAILER_SEED_PRICE,
  VEHICLE_SLOTS,
} from '../defs/items.ts'
import { SKUS } from '../defs/research.ts'
import { PROTOCOL } from './mp.ts'
import { dump, parse, SAVE_VERSION } from './save.ts'
import { permit } from './mp.ts'
import { Act } from './log.ts'
import { lookText } from './look.ts'
import { dest, DT_MAX, World } from './world.ts'
import { hangarPad, padCenter, seekSpeed, surfaceMul, trailerUsed } from './vehicle.ts'
import { isSolid } from './plot.ts'
import { Plant } from './plant.ts'
import { FERT_PLOT_MAX, Soil } from './soil.ts'

const AT = { col: 10, row: 12 }

function farm(): World {
  const w = new World(1)
  w.unlockAll()
  w.buy('buy-hangar')
  w.confirmPlace(AT)
  return w
}

function digest(w: World) {
  return {
    money: w.money,
    vehicles: w.vehicles.map(v => ({
      id: v.id,
      kind: v.kind,
      fuel: v.fuel,
      pose: v.pose,
      slots: v.kind === 'quad' ? v.slots : undefined,
      hitch: v.kind === 'tractor' ? v.hitch : undefined,
    })),
    trailers: w.trailers.map(t => ({
      id: t.id,
      kind: t.kind,
      pose: t.pose,
      hopper: t.kind === 'harvest' ? undefined : t.hopper,
      slots: t.kind === 'harvest' ? t.slots : undefined,
    })),
  }
}

describe('vehicles I', () => {
  test('`SAVE_VERSION` 1.5. `PROTOCOL` 1.5. No migrate. Dump `vehicles` + hangar cells. Digest includes every vehicle `id` `kind` `fuel` `slots` `pose`.', () => {
    expect(SAVE_VERSION).toBe(1.5)
    expect(PROTOCOL).toBe(1.5)
    const w = farm()
    w.buyVehicle(AT, 'quad')
    const s = dump(w)
    expect(s.version).toBe(1.5)
    expect(s.vehicles).toHaveLength(1)
    expect(s.nextVehicleId).toBe(2)
    expect(s.trailers).toHaveLength(0)
    expect(s.nextTrailerId).toBe(1)
    expect(s.chunks[0].cells[AT.row][AT.col].kind).toBe('hangar')
    const loaded = parse(JSON.stringify(s))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(digest(loaded.world)).toEqual(digest(w))
    expect(parse(JSON.stringify({ ...s, version: 1.4 })).ok).toBe(false)
  })

  test("`VehicleKind` is `'quad' | 'tractor'`. Quad `slots.length === VEHICLE_SLOTS`. Fuel is `0..1` on the vehicle, not an Item.", () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    const v = w.vehicles[0]
    expect(v.kind).toBe('quad')
    if (v.kind !== 'quad') return
    expect(v.slots.length).toBe(VEHICLE_SLOTS)
    expect(v.fuel).toBe(1)
    expect(v.slots.every(s => s.kind === 'empty')).toBe(true)
  })

  test('Unlimited quads. `Act.buyVehicle` pays `QUAD_PRICE`, not `skuPrice`. `machine-contracts` does not discount Quad. `buy-hangar` automation `skuPrice` (contracts apply).', () => {
    const w = farm()
    const before = w.money
    w.buyVehicle(AT, 'quad')
    w.buyVehicle(AT, 'quad')
    expect(w.vehicles).toHaveLength(2)
    expect(w.money).toBe(before - QUAD_PRICE - QUAD_PRICE)
    expect(SKUS['buy-hangar'].price).toBe(80)
    expect(SKUS['buy-hangar'].tab).toBe('automation')
    w.family.husband.owned.set('machine-contracts', 2)
    expect(w.skuPrice('buy-hangar')).toBe(78)
    expect(QUAD_PRICE).toBe(150)
  })

  test('Guests: hangar cue HUD, `buy-hangar` in `GUEST_BUILD`, buy Quad, refill, `swapVehicle`, embark, disembark, dock, drive, delete empty hangar. Guest `swapChest` still not.', () => {
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-hangar' })).toBe(true)
    expect(permit({ a: Act.buyVehicle, t: 0, p: 1, c: [0, 0], k: 'quad' })).toBe(true)
    expect(permit({ a: Act.refill, t: 0, p: 1, c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.swapVehicle, t: 0, p: 1, v: 1, i: 0 })).toBe(true)
    expect(permit({ a: Act.embark, t: 0, p: 1, v: 1 })).toBe(true)
    expect(permit({ a: Act.disembark, t: 0, p: 1 })).toBe(true)
    expect(permit({ a: Act.dock, t: 0, p: 1 })).toBe(true)
    expect(permit({ a: Act.drive, t: 0, p: 1, throttle: 1, steer: 0 })).toBe(true)
    expect(permit({ a: Act.delete, t: 0, p: 1, k: 'building', c: [0, 0] })).toBe(true)
    expect(permit({ a: Act.swapChest, t: 0, p: 1, c: [0, 0], i: 0 })).toBe(false)
  })

  test('Surface mul applies to the cap, not accel. Paved `SURFACE_PAVED`. Tilled (empty weed growing ripe dead rotten turf) / rock / `isSolid` `SURFACE_SLOW`. Grass, untilled bare, cobble, brick, fence `SURFACE_NORMAL`. After integrate, `floor(x,y)` not owned → reject the step. No fade driving. Walk speed unchanged.', () => {
    expect(surfaceMul({ kind: 'untilled', ground: 'soft', cover: { kind: 'tile', tile: 'paved' } })).toBe(SURFACE_PAVED)
    expect(surfaceMul({ kind: 'empty', soil: new Soil(1, 1) })).toBe(SURFACE_SLOW)
    expect(surfaceMul({ kind: 'untilled', ground: 'soft', cover: { kind: 'bare' } })).toBe(SURFACE_NORMAL)
    expect(surfaceMul({ kind: 'untilled', ground: 'soft', cover: { kind: 'tile', tile: 'cobble' } })).toBe(SURFACE_NORMAL)
    expect(surfaceMul({ kind: 'untilled', ground: 'soft', cover: { kind: 'grass', variant: 0 } })).toBe(SURFACE_NORMAL)
    expect(surfaceMul({ kind: 'infertile' })).toBe(SURFACE_NORMAL)
    const w = farm()
    expect(isSolid(w.cell(AT))).toBe(true)
    expect(surfaceMul(w.cell(AT))).toBe(SURFACE_SLOW)
    w.buyVehicle(AT, 'quad')
    w.deploy(1, AT, 'none')
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    v.pose.x = 0.1
    v.pose.y = 0.5
    v.pose.heading = Math.PI
    v.pose.speed = QUAD_VMAX
    w.drive(1, 0)
    w.tick(DT_MAX)
    if (w.vehicles[0].pose.kind !== 'field') throw new Error('field')
    expect(w.vehicles[0].pose.x).toBe(0.1)
    expect(w.walkSpeed()).toBe(6)
  })

  test('Empty fuel cap `QUAD_EMPTY_MUL × QUAD_VMAX × surfaceMul × machineryMul`. No auto-dismount. Can still `Act.embark`. Burn `dt / QUAD_FUEL_SECONDS` while driver and (`throttle ≠ 0` || `steer ≠ 0`).', () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    w.deploy(1, AT, 'none')
    const v = w.vehicles[0]
    v.fuel = 0
    w.drive(1, 0)
    const y0 = v.pose.kind === 'field' ? v.pose.y : 0
    w.tick(DT_MAX)
    expect(v.fuel).toBe(0)
    expect(v.pose.kind).toBe('field')
    if (v.pose.kind !== 'field') return
    expect(v.pose.driver).toBe(0)
    expect(Math.abs(v.pose.speed)).toBeLessThanOrEqual(QUAD_EMPTY_MUL * QUAD_VMAX * SURFACE_NORMAL + 1e-9)
    expect(v.pose.y).not.toBe(y0)
    expect(v.pose.driver).toBe(0)
    w.disembark()
    expect(v.pose.kind).toBe('field')
    if (v.pose.kind !== 'field') return
    expect(v.pose.driver).toBe('none')
    w.seats[0].actor.x = v.pose.x
    w.seats[0].actor.y = v.pose.y
    w.embark(1)
    expect(v.pose.driver).toBe(0)
    const fuel = 1
    v.fuel = fuel
    w.drive(1, 0)
    w.tick(DT_MAX)
    expect(v.fuel).toBeCloseTo(fuel - DT_MAX / QUAD_FUEL_SECONDS, 8)
  })

  test('Refill all: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Poor no-op. Success: every tank `1`. Shared `World.money`.', () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    w.buyVehicle(AT, 'quad')
    w.vehicles[0].fuel = 0.5
    w.vehicles[1].fuel = 0
    const cost = 0.5 * QUAD_REFILL + QUAD_REFILL
    expect(w.refillCost()).toBe(cost)
    w.money = cost - 1
    w.refill(AT)
    expect(w.vehicles[0].fuel).toBe(0.5)
    w.money = cost
    w.refill(AT)
    expect(w.vehicles[0].fuel).toBe(1)
    expect(w.vehicles[1].fuel).toBe(1)
    expect(w.money).toBe(0)
  })

  test('Tank-steer: `Drive` `-1 | 0 | 1`. W forward S reverse A/D yaw. `QUAD_YAW` same at speed 0. Latest `Act.drive` same `t` wins. Machinery `× (1 + 0.05 × tier)` on vMax and accel only. Boots not. Yaw not.', () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    w.deploy(1, AT, 'none')
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    const h0 = v.pose.heading
    w.drive(0, 1)
    w.tick(DT_MAX)
    expect(v.pose.kind).toBe('field')
    if (v.pose.kind !== 'field') return
    expect(v.pose.heading).toBeCloseTo(h0 + QUAD_YAW * DT_MAX, 8)
    expect(v.pose.speed).toBe(0)
    w.apply({ a: Act.drive, t: w.now, p: 0, throttle: 1, steer: 0 })
    w.apply({ a: Act.drive, t: w.now, p: 0, throttle: 0, steer: -1 })
    expect(w.seats[0].drive).toEqual({ throttle: 0, steer: -1 })
    expect(w.machineMul()).toBe(1)
    w.family.player.owned.set('machinery', 2)
    expect(w.machineMul()).toBe(1.1)
    expect(QUAD_VMAX).toBe(10)
    expect(QUAD_ACCEL).toBe(QUAD_VMAX / 1.5)
  })

  test('Hangar `HANGAR_W × HANGAR_H`, door south, no rotate. Pad `row = base.row + 2`, `col .. col + HANGAR_W - 1`, stay plots. Store is `Act.dock` while driver and `floor(x,y)` is a pad cell; that hangar. Not on tick. Buy from A stores at A. Deploy from B of stored-at-A spawns on B pad, heading `HEADING_SOUTH`, seats immediately. Cannot delete a hangar that stores a vehicle. Field vehicles do not block delete.', () => {
    const w = farm()
    expect(HANGAR_W).toBe(3)
    expect(HANGAR_H).toBe(2)
    const cell = w.cell(AT)
    expect(cell.kind).toBe('hangar')
    if (cell.kind !== 'hangar') return
    expect(hangarPad(cell.base)).toEqual([
      { col: 10, row: 14 },
      { col: 11, row: 14 },
      { col: 12, row: 14 },
    ])
    expect(w.cell({ col: 10, row: 14 }).kind).not.toBe('hangar')
    const B = { col: 16, row: 12 }
    w.buy('buy-hangar')
    w.confirmPlace(B)
    w.buyVehicle(AT, 'quad')
    expect(w.vehicles[0].pose).toEqual({ kind: 'stored', hangar: AT })
    w.armDelete()
    w.deleteBuilding(AT)
    expect(w.cell(AT).kind).toBe('hangar')
    w.cancelPlace()
    w.deploy(1, B, 'none')
    expect(w.vehicles[0].pose.kind).toBe('field')
    if (w.vehicles[0].pose.kind !== 'field') return
    expect(w.vehicles[0].pose.heading).toBe(Math.PI / 2)
    expect(w.vehicles[0].pose.driver).toBe(0)
    const bCell = w.cell(B)
    expect(bCell.kind).toBe('hangar')
    if (bCell.kind !== 'hangar') return
    const padB = padCenter(bCell.base)
    expect(w.vehicles[0].pose.x).toBe(padB.x)
    expect(w.vehicles[0].pose.y).toBe(padB.y)
    expect(w.seats[0].actor.x).toBe(padB.x)
    for (let i = 0; i < 20; i++) w.tick(DT_MAX)
    expect(w.vehicles[0].pose.kind).toBe('field')
    w.dock()
    expect(w.vehicles[0].pose).toEqual({ kind: 'stored', hangar: B })
    w.deploy(1, AT, 'none')
    w.drive(1, 0)
    for (let i = 0; i < 40; i++) w.tick(DT_MAX)
    expect(w.vehicles[0].pose.kind).toBe('field')
    w.armDelete()
    w.deleteBuilding(AT)
    expect(w.cell(AT).kind).not.toBe('hangar')
  })

  test("Seated `Act.click` field acts no-op. No coast-walk. `Act.disembark` while driver: speed 0, `driver 'none'`, actor at vehicle `x,y`, drive `{0,0}`, queue `[]`. Always legal while driving. `Act.dock` else no-op. Guest may disembark and dock.", () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    w.deploy(1, AT, 'none')
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    v.pose.speed = 4
    w.drive(1, 0)
    w.click({ col: 8, row: 8 })
    expect(w.seats[0].drive).toEqual({ throttle: 1, steer: 0 })
    expect(v.pose.driver).toBe(0)
    expect(w.seats[0].queue).toEqual([])
    w.tick(DT_MAX)
    expect(v.pose.driver).toBe(0)
    w.disembark()
    expect(v.pose.kind).toBe('field')
    if (v.pose.kind !== 'field') return
    expect(v.pose.speed).toBe(0)
    expect(v.pose.driver).toBe('none')
    expect(w.seats[0].actor.x).toBe(v.pose.x)
    expect(w.seats[0].actor.y).toBe(v.pose.y)
    expect(w.seats[0].drive).toEqual({ throttle: 0, steer: 0 })
    expect(w.seats[0].queue).toEqual([])
    w.seats[0].actor.x = v.pose.x
    w.seats[0].actor.y = v.pose.y
    w.embark(1)
    expect(v.pose.driver).toBe(0)
    v.pose.x = 8.5
    v.pose.y = 8.5
    w.dock()
    expect(v.pose.kind).toBe('field')
    if (v.pose.kind !== 'field') return
    expect(v.pose.driver).toBe(0)
    v.pose.x = 11.5
    v.pose.y = 14.5
    w.dock()
    expect(v.pose).toEqual({ kind: 'stored', hangar: AT })
    expect(permit({ a: Act.disembark, t: 0, p: 1 })).toBe(true)
    expect(permit({ a: Act.dock, t: 0, p: 1 })).toBe(true)
  })

  test("Vehicle slots: any Item, chest swap + compact, `tickFreshness` (not freezer). `Act.swapVehicle` legal iff parked (`field` && `driver === 'none'`). Stored: no-op. Driven: no-op. Guests may swap. Hangar HUD has no 6-slot. Parked HUD is `Cue` `{ kind: 'vehicle'; id }` (6 slots + Embark).", () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    const fruit = {
      kind: 'fruit' as const,
      crop: 'carrot' as const,
      rarity: 'common' as const,
      count: 1,
      unitSale: 4,
      freshness: 1,
      bio: true,
    }
    w.seats[0].hand = { kind: 'hold', item: { ...fruit } }
    w.swapVehicle(1, 0)
    expect(w.vehicles[0].kind === 'quad' && w.vehicles[0].slots[0].kind === 'empty').toBe(true)
    w.deploy(1, AT, 'none')
    w.seats[0].hand = { kind: 'hold', item: { ...fruit } }
    w.swapVehicle(1, 0)
    expect(w.vehicles[0].kind === 'quad' && w.vehicles[0].slots[0].kind === 'empty').toBe(true)
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    v.pose.driver = 'none'
    w.seats[0].queue.length = 0
    w.seats[0].hand = { kind: 'hold', item: { ...fruit } }
    w.swapVehicle(1, 0)
    expect(w.vehicles[0].kind === 'quad' && w.vehicles[0].slots[0]).toEqual({ kind: 'hold', item: fruit })
    w.tick(1)
    const slot = w.vehicles[0].kind === 'quad' ? w.vehicles[0].slots[0] : { kind: 'empty' as const }
    expect(slot.kind === 'hold' && slot.item.kind === 'fruit' && slot.item.freshness).toBeLessThan(1)
  })

  test("Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0. Recap freezes vehicle integrate. Actor pose tracks vehicle while driver. Hide gardener / hat / camera follow are view, not sim.", () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    w.deploy(1, AT, 'none')
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    v.pose.speed = 6
    w.away(0)
    expect(v.pose.kind).toBe('field')
    if (v.pose.kind !== 'field') return
    expect(v.pose.driver).toBe('none')
    const y0 = v.pose.y
    w.tick(DT_MAX)
    expect(v.pose.y).not.toBe(y0)
    expect(Math.abs(v.pose.speed)).toBeLessThan(6)
    w.seats[0].presence = 'in'
    if (v.pose.kind !== 'field') return
    v.pose.driver = 0
    w.clock.t = 239.999
    const pose = { ...v.pose }
    w.tick(1)
    expect(w.seam.kind).toBe('recap')
    expect(w.vehicles[0].pose).toEqual(pose)
  })

  test("Two drivers on one vehicle, seated + walk/work queue, stored + driver, `HudTarget` hangar, `HudTarget` vehicle, `slots.length ≠ VEHICLE_SLOTS`, Quad attachments: unrepresentable. Hangar HUD is `Cue` `{ kind: 'hangar'; at }`. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`.", () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    w.enqueue({ act: 'hangar', at: AT })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(w.seats[0].cue).toEqual({ kind: 'hangar', at: AT })
    w.ackCue()
    w.deploy(1, AT, 'none')
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    v.pose.driver = 'none'
    w.seats[0].actor.x = v.pose.x
    w.seats[0].actor.y = v.pose.y
    w.enqueue({ act: 'vehicle', id: 1 })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(w.seats[0].cue).toEqual({ kind: 'vehicle', id: 1 })
    expect(seekSpeed(10, 0, QUAD_ACCEL, DT_MAX)).toBeLessThan(10)
  })

  test('dest vehicle/embark stored or missing is not hangar or actor cell. Dock actor stays on pad.', () => {
    const w = farm()
    w.buyVehicle(AT, 'quad')
    const x0 = w.seats[0].actor.x
    const y0 = w.seats[0].actor.y
    w.enqueue({ act: 'vehicle', id: 1 })
    w.tick(DT_MAX)
    expect(w.seats[0].queue).toEqual([])
    expect(w.seats[0].actor.x).toBe(x0)
    expect(w.seats[0].actor.y).toBe(y0)
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    expect(w.seats[0].actor.inside(dest({ act: 'vehicle', id: 1 }, w))).toBe(false)
    expect(w.seats[0].actor.inside(dest({ act: 'embark', id: 1 }, w))).toBe(false)
    expect(w.seats[0].actor.inside(dest({ act: 'vehicle', id: 99 }, w))).toBe(false)
    w.enqueue({ act: 'embark', id: 1 })
    const ax = w.seats[0].actor.x
    const ay = w.seats[0].actor.y
    w.tick(DT_MAX)
    expect(w.seats[0].queue).toEqual([])
    expect(w.seats[0].actor.x).toBe(ax)
    expect(w.seats[0].actor.y).toBe(ay)
    w.deploy(1, AT, 'none')
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    const px = v.pose.x
    const py = v.pose.y
    w.dock()
    expect(w.vehicles[0].pose).toEqual({ kind: 'stored', hangar: AT })
    expect(w.seats[0].actor.x).toBe(px)
    expect(w.seats[0].actor.y).toBe(py)
  })
})

describe('vehicles II', () => {
  test('Tractor hitch follow. Deploy hitch optional. Stored tractor hitch is none.', () => {
    const w = farm()
    w.buyVehicle(AT, 'tractor')
    w.buyTrailer(AT, 'seed')
    expect(w.vehicles[0].kind).toBe('tractor')
    if (w.vehicles[0].kind !== 'tractor') return
    expect(w.vehicles[0].hitch).toBe('none')
    w.deploy(1, AT, 1)
    expect(w.vehicles[0].kind === 'tractor' && w.vehicles[0].hitch).toBe(1)
    expect(w.trailers[0].pose).toEqual({ kind: 'attached', vehicle: 1, heading: Math.PI / 2 })
    w.drive(1, 0)
    const t0 = w.trailers[0].pose.kind === 'attached' ? w.trailers[0].pose.heading : 0
    w.tick(DT_MAX)
    expect(w.trailers[0].pose.kind).toBe('attached')
    if (w.trailers[0].pose.kind !== 'attached') return
    expect(w.trailers[0].pose.heading).toBeCloseTo(t0, 5)
    w.drive(0, 1)
    w.tick(DT_MAX)
    expect(w.trailers[0].pose.heading).not.toBe(t0)
  })

  test('Boom seed band. Fires iff driven tractor, hitch, steer 0, speed > 0.', () => {
    const w = farm()
    w.buyVehicle(AT, 'tractor')
    w.buyTrailer(AT, 'seed')
    w.seats[0].hand = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 20 } }
    w.deploy(1, AT, 1)
    w.disembark()
    w.seats[0].actor.x = w.vehicles[0].pose.kind === 'field' ? w.vehicles[0].pose.x : 0
    w.seats[0].actor.y = w.vehicles[0].pose.kind === 'field' ? w.vehicles[0].pose.y : 0
    w.swapTrailer(1, 0)
    const south = { col: 11, row: 16 }
    w.setCell(south, { kind: 'empty', soil: new Soil(1, 1) })
    w.seats[0].actor.x = w.vehicles[0].pose.kind === 'field' ? w.vehicles[0].pose.x : 0
    w.seats[0].actor.y = w.vehicles[0].pose.kind === 'field' ? w.vehicles[0].pose.y : 0
    w.embark(1)
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    v.pose.heading = Math.PI / 2
    v.pose.x = 11.5
    v.pose.y = 15.5
    v.pose.speed = TRACTOR_VMAX
    w.drive(1, 0)
    w.tick(DT_MAX)
    expect(w.cell(south).kind === 'growing' || w.cell({ col: 11, row: 15 }).kind === 'growing' || w.cell({ col: 10, row: 16 }).kind === 'growing' || w.cell({ col: 12, row: 16 }).kind === 'growing').toBe(true)
  })

  test('Boom spray band. Full plot skip. TRAILER_CAP.', () => {
    const w = farm()
    w.buyVehicle(AT, 'tractor')
    w.buyTrailer(AT, 'spray')
    w.seats[0].hand = { kind: 'hold', item: { kind: 'fertilizer', liters: 5, capacityLiters: 5 } }
    w.deploy(1, AT, 1)
    w.disembark()
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    w.seats[0].actor.x = v.pose.x
    w.seats[0].actor.y = v.pose.y
    w.swapTrailer(1, 0)
    expect(trailerUsed(w.trailers[0])).toBe(5)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'fertilizer', liters: 101, capacityLiters: 101 } }
    w.swapTrailer(1, 0)
    expect(trailerUsed(w.trailers[0])).toBe(5)
    expect(TRAILER_CAP).toBe(100)
    const at = { col: 11, row: 16 }
    w.setCell(at, { kind: 'empty', soil: new Soil(1, 0) })
    w.seats[0].actor.x = v.pose.x
    w.seats[0].actor.y = v.pose.y
    w.embark(1)
    v.pose.heading = Math.PI / 2
    v.pose.x = 11.5
    v.pose.y = 15.5
    v.pose.speed = TRACTOR_VMAX
    w.drive(1, 0)
    w.tick(DT_MAX)
    const c = w.cell(at)
    if (isSolid(c)) return
    if (c.kind === 'empty') expect(c.soil.fertilizer).toBeGreaterThan(0)
  })

  test('Boom harvest band. Parked-only swap. Persist cargo across dock.', () => {
    const w = farm()
    w.buyVehicle(AT, 'tractor')
    w.buyTrailer(AT, 'harvest')
    expect(w.trailers[0].kind === 'harvest' && w.trailers[0].slots.length).toBe(HARVEST_SLOTS)
    w.deploy(1, AT, 1)
    const fruit = {
      kind: 'fruit' as const,
      crop: 'carrot' as const,
      rarity: 'common' as const,
      count: 1,
      unitSale: 4,
      freshness: 1,
      bio: true,
    }
    w.seats[0].hand = { kind: 'hold', item: { ...fruit } }
    w.swapTrailer(1, 0)
    expect(w.trailers[0].kind === 'harvest' && w.trailers[0].slots[0].kind).toBe('empty')
    w.disembark()
    const v = w.vehicles[0]
    if (v.pose.kind !== 'field') throw new Error('field')
    w.seats[0].actor.x = v.pose.x
    w.seats[0].actor.y = v.pose.y
    w.seats[0].hand = { kind: 'hold', item: { ...fruit } }
    w.swapTrailer(1, 0)
    expect(w.trailers[0].kind === 'harvest' && w.trailers[0].slots[0]).toEqual({ kind: 'hold', item: fruit })
    v.pose.x = 11.5
    v.pose.y = 14.5
    w.seats[0].actor.x = v.pose.x
    w.seats[0].actor.y = v.pose.y
    w.embark(1)
    w.dock()
    expect(w.vehicles[0].pose).toEqual({ kind: 'stored', hangar: AT })
    expect(w.vehicles[0].kind === 'tractor' && w.vehicles[0].hitch).toBe('none')
    expect(w.trailers[0].pose).toEqual({ kind: 'stored', hangar: AT })
    expect(w.trailers[0].kind === 'harvest' && w.trailers[0].slots[0]).toEqual({ kind: 'hold', item: fruit })
    const ripe = { col: 11, row: 16 }
    w.setCell(ripe, { kind: 'ripe', soil: new Soil(1, 1), plant: new Plant('carrot', 'common') })
    w.deploy(1, AT, 1)
    const tr = w.vehicles[0]
    if (tr.pose.kind !== 'field') throw new Error('field')
    tr.pose.heading = Math.PI / 2
    tr.pose.x = 11.5
    tr.pose.y = 15.5
    tr.pose.speed = TRACTOR_VMAX
    w.drive(1, 0)
    w.tick(DT_MAX)
    expect(w.cell(ripe).kind === 'empty' || w.trailers[0].kind === 'harvest').toBe(true)
  })

  test('Silo look-only. Cannot delete hangar storing trailer. Hangar-buys not skuPrice.', () => {
    const w = farm()
    const before = w.money
    w.buyVehicle(AT, 'tractor')
    w.buyTrailer(AT, 'seed')
    expect(w.money).toBe(before - TRACTOR_PRICE - TRAILER_SEED_PRICE)
    expect(SKUS['buy-silo-seed'].price).toBe(SILO_SEED_PRICE)
    w.family.husband.owned.set('machine-contracts', 2)
    expect(w.skuPrice('buy-silo-seed')).toBe(68)
    expect(TRACTOR_PRICE).toBe(250)
    expect(TRAILER_HARVEST_PRICE).toBe(100)
    w.armDelete()
    w.deleteBuilding(AT)
    expect(w.cell(AT).kind).toBe('hangar')
    w.cancelPlace()
    w.buy('buy-silo-seed')
    w.confirmPlace({ col: 16, row: 12 })
    expect(w.cell({ col: 16, row: 12 }).kind).toBe('silo-seed')
    expect(isSolid(w.cell({ col: 16, row: 12 }))).toBe(true)
    w.enqueue({ act: 'walk', at: { col: 16, row: 12 } })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(w.seats[0].cue.kind).toBe('none')
    expect(lookText(w, { kind: 'cell', at: { col: 16, row: 12 } }, false)).toContain('Seeding silo')
    expect(TRACTOR_VMAX).toBeCloseTo(QUAD_VMAX * 0.67)
    expect(TRACTOR_ACCEL).toBe(QUAD_ACCEL * 0.5)
    expect(FERT_PLOT_MAX).toBe(1)
  })
})

