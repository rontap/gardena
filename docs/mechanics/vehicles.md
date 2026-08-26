# Vehicles

Quad + hangar + tractor + 3 trailers + boom + 3 inert silos. Shop gates [[mechanics/research]]. Cmds [[architecture/log]]. Seats [[mechanics/multiplayer]]. Numbers preference unless marked. Types `sim/vehicle.ts` / `sim/ids.ts`.

Click-walk speed unchanged — [[items/tiles]]. WASD walk and dash cargo below. Dash cargo is driving overlay, not `HudTarget`.

## Lens

`Lens` += `vehicles` on `src/game/view/map.tsx`. View-local, not `World`. Unhidden after `unlock-vehicles` in `done`. Not a family-study row. leaveShop / Esc still only force pipes / sensors off.

Paint hangar-return + machine pad arrows (`HANGAR_RETURN` / `PAD_DROP` / `PAD_TAKE`) iff local seat is a driver OR `lens === 'vehicles'`. Driving still paints with this lens off. Pad opacity 0.5; 1 iff that pad action legal. Not sim. Not logged.

## Kind

`VehicleKind = 'quad' | 'tractor'`. Quad `slots.length === VEHICLE_SLOTS`, no hitch, no boom field. Tractor no slots, `hitch: TrailerId | 'none'`, `boom: 3 | 5` default 5, persist, survives trailer swap. Fuel is `0..1` on the vehicle, not an Item. Trailer is stored or attached, never loose. `TRAILER_CAP` is the only cargo cap.

`VehicleId` unique on this `World`, from `World.nextVehicleId` (starts 1). `TrailerId` unique, from `World.nextTrailerId` (starts 1).

Pose names: **stored** in a hangar, no driver; **parked** field && `driver === 'none'`; **driven** field && `driver` is a `SeatId`; **attached** trailer never loose on the field.

Hangar `RectBase` `w = HANGAR_W` `h = HANGAR_H`. Silo `RectBase` `w = SILO_W` `h = SILO_H`. Door south. No rotate. Same instance all occupied cells.

`Seat.drive` ignored unless this seat is a driver. `Seat.stride` ignored while this seat is a driver. Load stride `{0,0}` — not in Save.

Trailer is a permanent `World` object: stored at a hangar origin or attached to a tractor. Inventory survives store / attach.

Seed/spray hopper wrong kind unrepresentable. Harvest `slots.length === HARVEST_SLOTS`.

## Buy

Unlimited quads, tractors, trailers. `Act.buyVehicle` pays `QUAD_PRICE` / `TRACTOR_PRICE`, not `skuPrice`. Tractor buy `boom` 5. `Act.buyTrailer` pays `TRAILER_*_PRICE`. `haggling` does not discount hangar-buys. `buy-hangar` and three silo SKUs automation `skuPrice` (haggling applies).

`unlock-vehicles` automation, `effect` `unlock-sku` `buy-hangar`. Reveals after `unlock-expand` — ground to cross, not pipework. A tractor does not need a land permit. The three silos are `unlock-silos`, a storage decision after the driving one.

Quad / tractor / trailers are hangar-buy only. No `Place` ghost. No shop SKU.

## Hangar

Place like chest, origin = clicked NW cell, extends east and south. Pay on confirm. Disarm. Automation tab.

Pad: `row = base.row + 2`, `col .. col + HANGAR_W - 1`. Stay plots. Pad is geometric, not a `Cell` kind. Place does not require pad cells free. Deploy / dock require pad-center `inWorld` / `floor(x,y)` on a pad cell.

`hangarPad(base)` those coords. `padCenter(base)` `{ x: base.col + HANGAR_W / 2, y: base.row + HANGAR_H + 0.5 }`.

`siloPad(base)` two coords south of the drum. Stay plots. Not Dock.

Walk-up any occupied cell. `Intent` `{ act: 'hangar'; at: Coord }`. Arrival: `Seat.cue = { kind: 'hangar'; at }`.

Hangar HUD is that cue. Select is App-local (not logged, not `World`): a stored/field vehicle, and if the selected vehicle is a tractor, a stored trailer or none. Panel: buy Quad / Tractor / Seeder / Sprayer / Harvester / list all owned / Deploy (stored vehicle only; hitch optional) / Refill all. Hangar HUD has no cargo.

Cannot delete a hangar that currently stores a vehicle or a trailer. Field vehicles and attached trailers do not block delete. Empty hangar is a delete target. Guest may delete empty hangar.

Pad arrows: view-only. `Act.dock` reads hangar `hangarPad` only. Silo pad click is not Dock. Only hangar pads store.

## Silos

Shop SKUs. Door south, no rotate, same instance all cells. Origin = clicked NW. `siloSiteOk` like hangarSiteOk but silo size. Pad: `siloPad`. Automation, `unlock-silos`, `haggling`.

Starter 1×2 `seed-silo` stays. Not these SKUs.

Inert: walk-up look name only. No dialog. No cue. No merge. Delete always. Guest `GUEST_BUILD` += the three SKUs. South pad arrows view-only. Not Dock.

## Buy / deploy / store

`Act.buyVehicle { hangar XY, k }`: XY is a hangar cell (resolve origin). `done` has `unlock-vehicles`. Pay that hangar-buy, push stored at origin. Buy from hangar A stores at A. Cannot afford / not hangar / not researched: no-op.

`Act.buyTrailer { hangar XY, k }`: same hangar, pay `TRAILER_*_PRICE`. Seed/spray hopper empty, harvest empty slots.

`Act.deploy { id, hangar XY, hitch }`: vehicle exists, `pose.kind === 'stored'`. XY is hangar B. This seat is not a driver. Pad-center `inWorld`. Quad: `hitch` must be `'none'`. Tractor: `hitch === 'none'` or that trailer stored. Spawn field at B `padCenter`, `heading: HEADING_SOUTH`, `speed` 0, `driver` this seat. Tractor `boom` unchanged. Deploy from hangar B of a vehicle stored at A spawns on B’s pad. Seats immediately. Trailer hitch optional.

`Act.embark { id }`: from parked cue HUD, or same cmd. Vehicle parked, this seat not a driver. If actor is on `floor(x,y)`, board now. Else enqueue `{ act: 'embark'; id }`. Empty fuel: still board. Stored: no-op. Driven: no-op. Hitch stays. Boom stays.

No auto-store. Store is not on tick when center enters pad. Store is `Act.dock`.

## Drive

Driver WASD is UI → `Act.drive`. Not per rAF. Send on change / blur / become-not-driver.

W `throttle` 1. S `throttle` −1. A `steer` −1. D `steer` 1. Release 0. Tank-steer: A/D yaw in place. Same kind yaw at speed 0. S reverse. W forward. Not driver: WASD is stride, not tank.

`Act.drive { throttle, steer }` writes `seats[p].drive`. Latest same `t` wins. Ignored unless this seat is a driver.

Tick, per field vehicle, array order. Recap: no integrate. After each field vehicle’s integrate: if tractor with hitch, `followHitch`, then boom (that vehicle). Boom is not a `Cmd`.

Driver present: read that `Drive`.

1. Burn iff driver and (`throttle ≠ 0` || `steer ≠ 0`): `fuel = max(0, fuel - dt / QUAD_FUEL_SECONDS × (1 − 0.05 × driving-classes tier))`. Quad and tractor. Same tank seconds.
2. Yaw iff driver: `heading += steer × YAW × dt`, wrap. Quad `QUAD_YAW`. Tractor `TRACTOR_YAW`.
3. `drivingMul = 1 + 0.05 × driving-classes tier`. Boots: not. Yaw: not. Husband `machinery`: not.
4. Quad: `vMax = QUAD_VMAX × drivingMul`. `accel = QUAD_ACCEL × drivingMul`. Tractor: `vMax = TRACTOR_VMAX × drivingMul`. `accel = TRACTOR_ACCEL × drivingMul`. `TRACTOR_VMAX = QUAD_VMAX × 0.67`. `TRACTOR_ACCEL = QUAD_ACCEL × 0.5`. `TRACTOR_YAW = TRACTOR_VMAX / TRACTOR_R`.
5. `surfaceMul` of `floor(x,y)` before translate. Cap `vMax × surfaceMul × (fuel > 0 ? 1 : QUAD_EMPTY_MUL)`. Cap only, not accel, not walk.
6. Target speed: throttle 1 → `+cap`; −1 → `−cap`; 0 → `0`. Seek accel: if `speed ≠ 0` and `sign(throttle) === −sign(speed)` → `accel × 2`. Coast `throttle === 0` stays `1×`. Reverse-from-stop unchanged. If remaining to target `<= accel × dt`, snap target.
7. Translate along heading. After, if `floor(nx,ny)` not `inWorld`, reject the step. Heading and speed stay.
8. Driver remaining: `actor.x/y = vehicle x/y`. Skip that seat’s walk/work. Queue stays empty.

No driver: Drive ignored. No burn. No yaw. Seek speed 0 at that kind’s accel. Translate. Hitch still follows.

## WASD walk

Not tank. W north (−y), S south (+y), A west (−x), D east (+x). Both of an axis → 0. Diagonal: `speed * dt / hypot(dx, dy)` so not √2.

`Act.stride` `'K'`. Send on key change / blur / become-not-driver, same as `Act.drive`. Latest same `t` wins. Ignored while this seat is a driver. Load `{0,0}` — not in Save.

Tick (`presence === 'in'`, not recap): if `stride !== {0,0}` and not driver: clear queue + work, `actor.x/y += dir * walkSpeed() * dt`. Boots apply. Surfaces not. Away skips.

Click while stride held still enqueues; next tick stride wins until keys up.

Not logged: the integrate. Logged: `Act.stride`.

## Dash cargo

Driving dash only. Not parked cue. Not hangar.

Occupied Face icons only. Empty omitted.

| driven | icons |
|---|---|
| Quad | occupied of `slots`, slot order |
| Tractor + seed/spray | hopper item, or none if empty |
| Tractor + harvest | occupied of `HARVEST_SLOTS`, slot order |
| Tractor no hitch | none |

Parked dialog unchanged.

## Hitch / boom

`hitchP(x, y, heading) = (x, y) − HITCH_BACK · (cos heading, sin heading)`. Trailer front stays on `P`. `followHitch` after tractor integrate: non-rigid, heading from rear to new `P`.

One trailer SKU per kind. `boomHits` takes width. Sim OBB `boom` wide × `BOOM_LONG` long (`3 | 5` × 1), midpoint = hitch pivot `P`, long axis = trailer heading. `boomHits` those coords, sort row then col.

Tick after integrate. Vehicle array order. Not a `Cmd`.

Fires iff that tractor is driven, hitch present, that seat `steer === 0`, `speed > 0` (forward). Reverse and turning do not apply.

`Act.setBoom { w: 3 | 5 }`: legal while this seat drives that tractor (hitch optional). Writes `boom`. Quad: no-op. Latest same `t` wins. Guest may.

Seeding: empty tilled only. Hopper one seeds stack. Consume 1/plot. Plant same as hand.

Spraying: `isTilled && fertilizer < FERT_PLOT_MAX`. Hopper one bag. Spend the gap, same as hand. `weed-spray` in the hopper is unrepresentable.

Harvest: boom width = that tractor `boom`. Mixed produce, chest merge+compact. Skip trees and turf. Full: skip that cell (plant stays).

| plot | item | plot after |
|---|---|---|
| `ripe` | fruit, same as empty-hand harvest | `empty` same soil |
| `growing` maturity `< 0.2` | one seed | `empty` same soil |
| `growing` maturity `> 0.8` | fruit, rarity = plant rarity (no ripen roll), freshness = maturity | `empty` same soil |
| `growing` mid | none (destroyed) | `empty` same soil |
| `dead` / `rotten` / `weed` | that item | `empty` same soil |

## Cap

`TRAILER_CAP`. Dashboard `used / TRAILER_CAP` while local driver of a tractor with hitch.

```
trailerUsed:
  seed: hopper empty → 0 else seeds.count
  spray: hopper empty → 0 else floor(liters)
  harvest: sum of fruit/seeds/dead/rotten/weed `count` across harvest slots
```

Seed: swap that would exceed cap is no-op. Spray: swap/pour that would put `floor(liters) > TRAILER_CAP` is no-op. Harvest: insert that would make `used > TRAILER_CAP` is skip.

## Trailer cargo I/O

Parked only. `Act.swapTrailer` swaps hand with hopper or `slots[i]`, then compact on harvest. Legal iff that trailer is `attached` to a tractor that is `field` && `driver === 'none'`. Guests may swap.

## Machine pads

Geometric, not a `Cell`. Pads: mill, still, jam, compost-box, chest, freezer, house `seed-silo`, `additive-store`. Not barrel, grinder, field silos.

```
dropoffPad(base) = { row: base.row - 1, col: base.col + i } for i in 0..w-1
takeupPad(base)  = { row: base.row + h, col: base.col + i } for i in 0..w-1
```

Unload: dropoff. Load: takeup. Interact iff this seat is driver and `floor(x,y)` is that pad. Else no-op.

`Act.load` `'L'`. `Act.unload` `'U'`. No coord. Floor of the driven vehicle. Instant. Logged. Legal while driven.

Unload: cargo → building, all legal until dest full. Same accept as walk dump. Load: chest/freezer pull until cargo full; silo seeds; additive bags; machines pick all ground drops on takeup cells the cargo accepts.

Guest: mill/jam/still/compost/seed-silo/additive-store yes. Chest/freezer no.

## Surfaces

Mul applies to the cap, not accel, not walk. Same cell classes: paved `SURFACE_PAVED`; tilled (empty weed growing ripe dead rotten turf) / rock / `isSolid` `SURFACE_SLOW`; grass, untilled bare, cobble, brick, fence `SURFACE_NORMAL`. After integrate, `floor(x,y)` not owned → reject the step. Walk speed unchanged.

Fence is cosmetic: a paved cell with a fence still uses paved. Pose clamped to owned land. Fade tiles are not owned.

## Fuel

Tank on the vehicle. Not an item. Empty: crawl `QUAD_EMPTY_MUL × vMax × surfaceMul`. No auto-dismount. Can still `Act.embark`. Trailers have no fuel.

`Act.refill { hangar XY }`: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Poor no-op. Success: every tank `1`. Shared `World.money`. Field and stored. All full → cost 0, still success.

## Disembark / Dock / Enter

`Act.disembark`: this seat is a driver. Instant: speed 0, `driver` none, actor at vehicle `x,y`, `drive` `{0,0}`, `queue` `[]`. Hitch stays. Always legal while driving. Guest may.

`Act.dock`: this seat is a driver AND `floor(x,y)` is a hangar pad cell (not a silo pad). Store into that hangar. Tractor hitch stores with it. Tractor `boom` kept. Guest may.

Enter: if this seat is a driver → `Act.disembark`. Else closest parked field vehicle, Euclidean actor→pose ≤ 1.5 → `Act.embark { id }` instant. Several: min dist, then `World.vehicles` order. Stored / driven: skip. Dash Disembark / parked Embark stay. No walk-to-embark on Enter. Seated `Act.click` field acts no-op. No coast-walk.

## Parked

Click / walk-up the floor cell of a parked vehicle. Arrival: still parked → `Seat.cue = { kind: 'vehicle'; id }`. Quad: `VEHICLE_SLOTS` + Embark. Tractor: trailer cargo if hitched + Embark. Tractor has no 6-slot. Hangar HUD is `Cue` `{ kind: 'hangar'; at }`. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`. Silo: look name only, no cue.

## Slots

Quad: any `Item`, chest swap + compact, `tickFreshness` (not freezer). `Act.swapVehicle` legal iff parked. Tractor has no 6-slot. Harvest slots chest merge+compact, `tickFreshness`. Hangar HUD has no cargo.

Away does not skip vehicle-slot freshness.

## Away / recap / view

Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays. Recap freezes vehicle integrate (boom does not run). Actor pose tracks vehicle while driver. Hide gardener / hat / camera follow are view, not sim.

Not logged: integrate, follow hitch, boom, burn, stride integrate, camera follow, hide gardener, hangar select, pad arrows, dash faces. Logged: `Act.disembark` `Act.dock` `Act.setBoom` `Act.load` `Act.unload` `Act.stride`. Store is not a tick.

Assumption: `Act.setBoom` `'W'`; `Act.stride` `'K'`; latest same-`t` `Act.stride` wins like drive; attached `TrailerPose` carries `heading`; growing `m > 0.8` boom fruit `unitSale = stats.sale`.

## Invariants

`vehicles.kind` — `VehicleKind` is `'quad' | 'tractor'`. Quad `slots.length === VEHICLE_SLOTS`, no hitch, no boom field. Tractor no slots, `hitch: TrailerId | 'none'`, `boom: 3 | 5` default 5, persist, survives trailer swap. Fuel is `0..1` on the vehicle, not an Item. Trailer is stored or attached, never loose. `TRAILER_CAP` is the only cargo cap.

`vehicles.buy` — Unlimited quads, tractors, trailers. `Act.buyVehicle` pays `QUAD_PRICE` / `TRACTOR_PRICE`, not `skuPrice`. Tractor buy `boom` 5. `Act.buyTrailer` pays `TRAILER_*_PRICE`. `haggling` does not discount hangar-buys. `buy-hangar` and three silo SKUs automation `skuPrice` (haggling applies).

`vehicles.surface` — Surface mul applies to the cap, not accel, not walk. Same cell classes: paved; tilled (empty weed growing ripe dead rotten turf) / rock / `isSolid` slow; grass, untilled bare, cobble, brick, fence normal. After integrate, `floor(x,y)` not owned → reject the step. Walk speed unchanged.

`vehicles.empty` — Empty fuel cap `QUAD_EMPTY_MUL × vMax × surfaceMul` (`vMax` already includes driving-classes). No auto-dismount. Can still `Act.embark`. Burn `dt / QUAD_FUEL_SECONDS × (1 − 0.05 × driving-classes tier)` while driver and (`throttle ≠ 0` || `steer ≠ 0`). `TRACTOR_VMAX = QUAD_VMAX × 0.67`, `TRACTOR_ACCEL = QUAD_ACCEL × 0.5`, `TRACTOR_YAW = TRACTOR_VMAX / TRACTOR_R`.

`vehicles.refill` — Refill all: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Poor no-op. Success: every tank `1`. Shared `World.money`. Trailers have no fuel.

`vehicles.drive` — Tank-steer: `Drive` `-1 | 0 | 1`. W forward S reverse A/D yaw. Kind yaw same at speed 0. Latest `Act.drive` same `t` wins. Brake: `speed ≠ 0` and `sign(throttle) === −sign(speed)` → seek at `accel × 2`. Coast `throttle === 0` stays `1×`. Reverse-from-stop unchanged. driving-classes: burn `× (1 − 0.05 × tier)`, vMax and accel `× (1 + 0.05 × tier)`. Additive ranks. Yaw not. Boots not. Husband machinery not on vMax/accel.

`vehicles.hangar` — Hangar `HANGAR_W × HANGAR_H`, door south, no rotate. Pad `row = base.row + 2`, `col .. col + HANGAR_W - 1`, stay plots. Silos `SILO_W × SILO_H`, `siloPad` two cells south of the drum. Store is `Act.dock` while driver and `floor(x,y)` is a hangar pad cell; that hangar; tractor hitch stores with it; tractor `boom` kept. Not on tick. Silo pad is not Dock. Buy from A stores at A. Deploy from B of stored-at-A spawns on B pad, heading `HEADING_SOUTH`, seats immediately; tractor hitch optional. Cannot delete a hangar that stores a vehicle or a trailer. Field vehicles do not block delete. Silos delete always.

`vehicles.enter` — Enter: if this seat is a driver → `Act.disembark`. Else closest parked field vehicle, Euclidean actor→pose ≤ 1.5 → `Act.embark { id }` instant. Several: min dist, then `World.vehicles` order. Stored / driven: skip. Dash Disembark / parked Embark stay. No walk-to-embark on Enter. Seated `Act.click` field acts no-op. No coast-walk. `Act.disembark` while driver: speed 0, `driver 'none'`, actor at vehicle `x,y`, drive `{0,0}`, queue `[]`, hitch stays. Always legal while driving. `Act.dock` else no-op. Guest may disembark and dock.

`vehicles.slots` — Quad slots: any Item, chest swap + compact, `tickFreshness` (not freezer). `Act.swapVehicle` legal iff parked. Tractor has no 6-slot. Trailer cargo parked only: `Act.swapTrailer` iff attached to a tractor that is field && `driver === 'none'`. Seed/spray hopper wrong kind unrepresentable. Harvest slots chest merge+compact, `tickFreshness`. Hangar HUD has no cargo. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`.

`vehicles.away` — Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays. Recap freezes vehicle integrate (boom does not run). Actor pose tracks vehicle while driver. Hide gardener / hat / camera follow are view, not sim.

`vehicles.unrep` — Two drivers on one vehicle, seated + walk/work queue, stored + driver, stored tractor hitch, quad hitch, tractor slots, quad boom, boom other than `3 | 5`, two trailers on one tractor, attached + stored, trailer attached to missing tractor, harvest `slots.length ≠ HARVEST_SLOTS`, seed/spray hopper wrong item, `HudTarget` hangar, `HudTarget` vehicle: unrepresentable. `Act.setBoom { w: 3 | 5 }` legal while this seat drives that tractor (hitch optional). Latest same `t` wins. Guest may. `boomHits` takes width. Sim OBB `3 | 5` wide × 1 long. Boom fires iff driven tractor, hitch present, `steer === 0`, `speed > 0`; after integrate; not a Cmd. Hangar HUD is `Cue` `{ kind: 'hangar'; at }`. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`. Silo: look name only, no cue.

`vehicles.dash` — Driving dash: occupied Face icons only. Quad occupied of `VEHICLE_SLOTS`; seed/spray hopper or none; harvest occupied of `HARVEST_SLOTS`; tractor no hitch none. Empty omitted. Parked unchanged.
