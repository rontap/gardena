# Vehicles

Quad + hangar + tractor + 3 trailers + boom + 3 inert silos + shared routes + traffic light. Shop gates [[mechanics/research]]. Cmds [[architecture/log]]. Seats [[mechanics/multiplayer]]. Light [[mechanics/sensors]]. Numbers preference unless marked. Types `sim/vehicle.ts` / `sim/ids.ts`.

Click-walk speed unchanged — [[items/tiles]]. WASD walk and dash cargo below. Dash cargo is driving overlay, not `HudTarget`.

## Lens

`Lens` += `vehicles` on `src/game/view/map.tsx`. View-local, not `World`. Unhidden after `unlock-vehicles` in `done`. Not a family-study row. leaveShop / Esc still only force pipes / sensors off.

Paint hangar-return + machine pad arrows (`HANGAR_RETURN` / `PAD_DROP` / `PAD_TAKE`) iff local seat is a driver OR `lens === 'vehicles'`. Driving still paints with this lens off. Pad opacity 0.5; 1 iff that pad action legal. Not sim. Not logged.

## Kind

`VehicleKind = 'quad' | 'tractor'`. Quad `slots.length === VEHICLE_SLOTS`, no hitch, no boom field. Tractor no slots, `hitch: TrailerId | 'none'`, `boom: 3 | 5` default 5, persist, survives trailer swap. Fuel is `0..1` on the vehicle, not an Item. Trailer is stored or attached, never loose. `TRAILER_CAP` is the only cargo cap.

`VehicleId` unique on this `World`, from `World.nextVehicleId` (starts 1). `TrailerId` unique, from `World.nextTrailerId` (starts 1). `RouteId` unique, from `World.nextRouteId` (starts 1). Vehicle holds `route: RouteId | 'none'`, `cursor: number`, `running: boolean`.

Pose names: **stored** in a hangar, no driver; **parked** field && `driver === 'none'` && `!running`; **driven** field && `driver` is a `SeatId`; **automated** field && `driver === 'none'` && `running`; **attached** trailer never loose on the field.

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

Click any occupied cell (same instance). `Intent` `{ act: 'hangar'; at: Coord }` still carries the clicked cell. `dest` = origin, not the interior cell. Arrival dest origin: `Seat.cue = { kind: 'hangar'; at }`. `hangarOrigin` resolves. [[architecture/world]] `world.dest`.

Hangar HUD is that cue. Select is App-local (not logged, not `World`): a stored/field vehicle, and if the selected vehicle is a tractor, a stored trailer or none. Panel: buy Quad / Tractor / Seeder / Sprayer / Harvester / list all owned / Deploy (stored vehicle only; hitch optional) / Hangar Automate (stored, route assigned, `n ≥ 1`, `unlock-dispatch`) / Refill all. Hangar row **Automated** when field, no driver, `running`. Hangar HUD has no cargo. Dash Automate / editor open: App-local, not logged. Automate chrome iff `unlock-dispatch` in `done`.

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

`Act.embark { id }`: from parked / automated cue HUD, or same cmd. Vehicle field && `driver === 'none'`, this seat not a driver. If actor is on `floor(x,y)`, board now. Else enqueue `{ act: 'embark'; id }`. Empty fuel: still board. Running: pause (`running` false), speed 0, cursor stays. Stored: no-op. Driven: no-op. Hitch stays. Boom stays.

No auto-store. Store is not on tick when center enters pad. Store is `Act.dock`.

## Drive

Driver WASD is UI → `Act.drive`. Not per rAF. Send on change / blur / become-not-driver.

W `throttle` 1. S `throttle` −1. A `steer` −1. D `steer` 1. Release 0. Tank-steer: A/D yaw in place. Same kind yaw at speed 0. S reverse. W forward. Not driver: WASD is stride, not tank.

`Act.drive { throttle, steer }` writes `seats[p].drive`. Latest same `t` wins. Ignored unless this seat is a driver.

Tick, per field vehicle, array order. Recap: no integrate. After each field vehicle’s integrate: if tractor with hitch, `followHitch`, then boom (that vehicle). Boom is not a `Cmd`. Two-phase: motion here; wait / load / unload after `evalDag` — [[#Dispatch]].

Seated driver: read that `Drive`.

1. Burn iff driver and (`throttle ≠ 0` || `steer ≠ 0`): `fuel = max(0, fuel - dt / QUAD_FUEL_SECONDS × (1 − 0.05 × driving-classes tier))`. Quad and tractor. Same tank seconds.
2. Yaw iff driver: `heading += steer × YAW × dt`, wrap. Quad `QUAD_YAW`. Tractor `TRACTOR_YAW`.
3. `drivingMul = 1 + 0.05 × driving-classes tier`. Boots: not. Yaw: not. Husband `machinery`: not.
4. Quad: `vMax = QUAD_VMAX × drivingMul`. `accel = QUAD_ACCEL × drivingMul`. Tractor: `vMax = TRACTOR_VMAX × drivingMul`. `accel = TRACTOR_ACCEL × drivingMul`. `TRACTOR_VMAX = QUAD_VMAX × 0.67`. `TRACTOR_ACCEL = QUAD_ACCEL × 0.5`. `TRACTOR_YAW = TRACTOR_VMAX / TRACTOR_R`.
5. `surfaceMul` of `floor(x,y)` before translate. Cap `vMax × surfaceMul × (fuel > 0 ? 1 : QUAD_EMPTY_MUL)`. Cap only, not accel, not walk.
6. Target speed: throttle 1 → `+cap`; −1 → `−cap`; 0 → `0`. Seek accel: if `speed ≠ 0` and `sign(throttle) === −sign(speed)` → `accel × 2`. Coast `throttle === 0` stays `1×`. Reverse-from-stop unchanged. If remaining to target `<= accel × dt`, snap target.
7. Translate along heading. After, if `floor(nx,ny)` not `inWorld`, reject the step. Heading and speed stay.
8. Driver remaining: `actor.x/y = vehicle x/y`. Skip that seat’s walk/work. Queue stays empty.

Auto running (field, driver `'none'`, `running`): synthesize `Drive` inside `tickVehicles` (not `Act.drive`, not `Seat.drive`). Always forward. Yaw in place until heading aligns (smallest-angle `|Δ| ≤ ROUTE_ALIGN`), then throttle 1. No auto reverse. Target: goto `(x,y)`; load / unload / wait pad/cell center `(col + 0.5, row + 0.5)`. Burn when synthesized throttle or steer, same formula as seated (`World.skillTier('driving-classes')`). Empty fuel: Drive `{0,0}`, seek speed 0, do not crawl, do not advance stops; `running` stays true. Hitch follows.

No driver and not running: Drive ignored. No burn. No yaw. Seek speed 0 at that kind’s accel. Translate. Hitch still follows.

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

Fires iff that tractor is seated **or** auto running, hitch present, synthesized or seated `steer === 0`, `speed > 0` (forward). Reverse and turning do not apply. Unmanned auto farms.

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

Parked only. `Act.swapTrailer` swaps hand with hopper or `slots[i]`, then compact on harvest. Legal iff that trailer is `attached` to a tractor that is `field` && `driver === 'none'` && `!running`. Guests may swap.

## Machine pads

Geometric, not a `Cell`. Pads: mill, still, jam, compost-box, chest, freezer, house `seed-silo`, `additive-store`. Not barrel, grinder, field silos.

```
dropoffPad(base) = { row: base.row - 1, col: base.col + i } for i in 0..w-1
takeupPad(base)  = { row: base.row + h, col: base.col + i } for i in 0..w-1
```

Unload: dropoff. Load: takeup. Interact iff this seat is driver and `floor(x,y)` is that pad. Else no-op.

`Act.load` `'L'`. `Act.unload` `'U'`. No coord. Floor of the driven vehicle. Instant. Logged. Legal while driven.

Unload: cargo → building, all legal until dest full. Same accept as walk dump. Load: chest/freezer pull until cargo full; silo seeds; additive bags; machines pick all ground drops on takeup cells the cargo accepts. Quad uses quad slots; tractor still needs hitch (`vehicleCargo()`).

Guest: mill/jam/still/compost/seed-silo/additive-store yes. Chest/freezer no. Auto tick transfer: chest/freezer legal.

Route load/unload stops: one transfer, same body, then next — [[#Dispatch]].

## Surfaces

Mul applies to the cap, not accel, not walk. Same cell classes: paved `SURFACE_PAVED`; tilled (empty weed growing ripe dead rotten turf) / rock / `isSolid` `SURFACE_SLOW`; grass, untilled bare, cobble, brick, fence `SURFACE_NORMAL`. After integrate, `floor(x,y)` not owned → reject the step. Walk speed unchanged.

Fence is cosmetic: a paved cell with a fence still uses paved. Pose clamped to owned land. Fade tiles are not owned.

## Fuel

Tank on the vehicle. Not an item. Seated empty: crawl `QUAD_EMPTY_MUL × vMax × surfaceMul`. Auto empty: Drive `{0,0}`, seek 0, no crawl, no advance. No auto-dismount. Can still `Act.embark`. Trailers have no fuel.

`Act.refill { hangar XY }`: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Poor no-op. Success: every tank `1`. Shared `World.money`. Field and stored. All full → cost 0, still success.

## Disembark / Dock / Enter

`Act.disembark`: this seat is a driver. Instant: speed 0, `driver` none, actor at vehicle `x,y`, `drive` `{0,0}`, `queue` `[]`. Hitch stays. Route and `running` unchanged (`running` is already false; seated+running unrepresentable). Always legal while driving. Guest may.

`Act.dock`: this seat is a driver AND `floor(x,y)` is a hangar pad cell (not a silo pad). Store into that hangar. Tractor hitch stores with it. Tractor `boom` kept. Keep route, `running` false, cursor kept. Guest may. No dock-stop.

Enter: if this seat is a driver → `Act.disembark`. Else closest field vehicle with `driver === 'none'`, Euclidean actor→pose ≤ 1.5 → `Act.embark { id }` instant. Several: min dist, then `World.vehicles` order. Stored / driven: skip. Running auto is field + no driver: Embark / Enter pauses (`running` false), board, speed 0, cursor stays. Dash Disembark / parked Embark stay. No walk-to-embark on Enter. Seated `Act.click` field acts no-op. No coast-walk.

`Act.embark` on running: same pause, board, speed 0, cursor stays. Start from that seat resumes.

## Parked

Click / walk-up the floor cell of a parked or automated vehicle. Arrival: still field && `driver === 'none'` → `Seat.cue = { kind: 'vehicle'; id }`. Quad: `VEHICLE_SLOTS` + Embark. Tractor: trailer cargo if hitched + Embark. Tractor has no 6-slot. Hangar HUD is `Cue` `{ kind: 'hangar'; at }`. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`. Silo: look name only, no cue.

## Slots

Quad: any `Item`, chest swap + compact, `tickFreshness` (not freezer). `Act.swapVehicle` legal iff parked (`field && driver === 'none' && !running`). Tractor has no 6-slot. Harvest slots chest merge+compact, `tickFreshness`. Hangar HUD has no cargo.

Away does not skip vehicle-slot freshness.

## Dispatch

`World.routes: Route[]`. `World.nextRouteId` starts 1. Route is a World object, not a vehicle. Edit live for every assignee.

```
RouteStop =
  | { kind: 'goto'; x: number; y: number }
  | { kind: 'unload'; at: Coord }
  | { kind: 'load'; at: Coord }
  | { kind: 'wait'; at: Coord }

Route = { id: RouteId; name: string; stops: RouteStop[] }
```

Loop `i = (i + 1) % n`. Zero stops: Start / hangar Automate no-op. Create names `Route {n}` with minted `id`. Delete route: no-op while assigned. No dock-stop.

Goto: in-world XY, not tile-snap. Arrive Euclidean ≤ `ROUTE_ARRIVE`. Then next.

Unload: dropoff pad tile. Arrive `floor` is that pad. One transfer, same body as dash Unload, then next.

Load: takeup pad tile. Arrive `floor` is that pad. One transfer, same body as dash Load, then next.

Wait: traffic-light cell. Arrive `floor` is that cell. Hold while light `inn === 0`; on `1`, next. Light [[mechanics/sensors]] `sensors.light`.

Add appends. Add goto no-op unless `floor` owned. Add load/unload no-op unless that coord is a takeup/dropoff pad. Add wait no-op unless that cell is a traffic-light. Reorder swaps neighbors; out of range no-op. Empty rename no-op. Cursor follows the current stop on remove/reorder; `n === 0` → `cursor` 0, assignees `running` false. Assign `'none'` or a different id: `cursor` 0; `running` false if `'none'` or `n === 0`. Delete of a light or pad building strips targeting stops.

`Act.route` `'o'`. Inner `k`: `create` | `delete` | `assign` | `add` | `remove` | `reorder` | `rename` | `start` | `automate`. All no-op unless `unlock-dispatch` in `done`. Latest same-`t` `assign` / `start` wins like drive. Other `k` apply in log order. Guest may. [[architecture/log]]

Start: this seat drives that vehicle, route assigned, `n ≥ 1` → disembark, `running` true. Cursor kept.

Hangar Automate: `k: 'automate'; v; c` hangar XY. Vehicle stored, that hangar, route assigned, `n ≥ 1`. Spawn `padCenter`, `HEADING_SOUTH`, speed 0, driver `'none'`, `i = 0`, `running` true. Does not seat. Pad-center `inWorld`. This seat may already drive another vehicle.

Two-phase tick. Recap skips both. Vehicle array order.

1. Motion in `tickVehicles`. Goto arrive → next, same phase. Arrived wait: synthesized Drive `{0,0}` until resolve.
2. After `evalDag`, `tickDispatch`: wait uses this tick’s light `inn`; load/unload one transfer then next, even if 0 items moved. Empty fuel: do not transfer, do not advance. 1-tick-late wait is wrong for a button pulse.

Several waiters on one light: all hold on 0, all leave on 1. No collision.

## Away / recap / view

Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays. Does not set `running` (already false). Recap freezes vehicle integrate and `tickDispatch` (boom does not run). Actor pose tracks vehicle while driver. Hide gardener / hat / camera follow are view, not sim. Auto unmanned continues until recap.

Not logged: integrate, follow hitch, boom, burn, stride integrate, synthesized auto drive, wait / load / unload resolve, camera follow, hide gardener, hangar select, pad arrows, dash faces, Dash Automate, editor open. Logged: `Act.disembark` `Act.dock` `Act.setBoom` `Act.load` `Act.unload` `Act.stride` `Act.route`. Store is not a tick. Place light is buy + `confirmPlace` inside `click`.

Assumption: `ROUTE_ARRIVE` / `ROUTE_ALIGN` preference; add appends; auto chest/freezer legal; hangar Automate does not require this seat idle; delete of a pad/light strips targeting stops.

## Invariants

`vehicles.kind` — `VehicleKind` is `'quad' | 'tractor'`. Quad `slots.length === VEHICLE_SLOTS`, no hitch, no boom field. Tractor no slots, `hitch: TrailerId | 'none'`, `boom: 3 | 5` default 5, persist, survives trailer swap. Fuel is `0..1` on the vehicle, not an Item. Trailer is stored or attached, never loose. `TRAILER_CAP` is the only cargo cap.

`vehicles.buy` — Unlimited quads, tractors, trailers. `Act.buyVehicle` pays `QUAD_PRICE` / `TRACTOR_PRICE`, not `skuPrice`. Tractor buy `boom` 5. `Act.buyTrailer` pays `TRAILER_*_PRICE`. `haggling` does not discount hangar-buys. `buy-hangar` and three silo SKUs automation `skuPrice` (haggling applies).

`vehicles.surface` — Surface mul applies to the cap, not accel, not walk. Same cell classes: paved; tilled (empty weed growing ripe dead rotten turf) / rock / `isSolid` slow; grass, untilled bare, cobble, brick, fence normal. After integrate, `floor(x,y)` not owned → reject the step. Walk speed unchanged.

`vehicles.empty` — Seated empty fuel cap `QUAD_EMPTY_MUL × vMax × surfaceMul` (`vMax` already includes driving-classes). No auto-dismount. Can still `Act.embark`. Burn `dt / QUAD_FUEL_SECONDS × (1 − 0.05 × driving-classes tier)` while seated and (`throttle ≠ 0` || `steer ≠ 0`). Auto empty: Drive `{0,0}`, seek 0, no crawl, no advance, `running` stays true. `TRACTOR_VMAX = QUAD_VMAX × 0.67`, `TRACTOR_ACCEL = QUAD_ACCEL × 0.5`, `TRACTOR_YAW = TRACTOR_VMAX / TRACTOR_R`.

`vehicles.refill` — Refill all: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Poor no-op. Success: every tank `1`. Shared `World.money`. Trailers have no fuel.

`vehicles.drive` — Tank-steer: `Drive` `-1 | 0 | 1`. W forward S reverse A/D yaw. Kind yaw same at speed 0. Latest `Act.drive` same `t` wins. Brake: `speed ≠ 0` and `sign(throttle) === −sign(speed)` → seek at `accel × 2`. Coast `throttle === 0` stays `1×`. Reverse-from-stop unchanged. driving-classes: burn `× (1 − 0.05 × tier)`, vMax and accel `× (1 + 0.05 × tier)`. Additive ranks. Yaw not. Boots not. Husband machinery not on vMax/accel.

`vehicles.hangar` — Hangar `HANGAR_W × HANGAR_H`, door south, no rotate. Pad `row = base.row + 2`, `col .. col + HANGAR_W - 1`, stay plots. Silos `SILO_W × SILO_H`, `siloPad` two cells south of the drum. Store is `Act.dock` while driver and `floor(x,y)` is a hangar pad cell; that hangar; tractor hitch stores with it; tractor `boom` kept; keep route, `running` false, cursor kept. Not on tick. Silo pad is not Dock. Buy from A stores at A. Deploy from B of stored-at-A spawns on B pad, heading `HEADING_SOUTH`, seats immediately; tractor hitch optional. Hangar Automate from B of stored-at-A: spawn B pad, `HEADING_SOUTH`, driver `'none'`, `i = 0`, `running` true, does not seat. Cannot delete a hangar that stores a vehicle or a trailer. Field vehicles do not block delete. Silos delete always. Hangar row Automated when field, no driver, `running`.

`vehicles.enter` — Enter: if this seat is a driver → `Act.disembark`. Else closest field vehicle with `driver === 'none'`, Euclidean actor→pose ≤ 1.5 → `Act.embark { id }` instant. Several: min dist, then `World.vehicles` order. Stored / driven: skip. Running auto: pause, board, speed 0, cursor stays. Dash Disembark / parked Embark stay. No walk-to-embark on Enter. Seated `Act.click` field acts no-op. No coast-walk. `Act.disembark` while driver: speed 0, `driver 'none'`, actor at vehicle `x,y`, drive `{0,0}`, queue `[]`, hitch stays. Always legal while driving. `Act.dock` else no-op. Guest may disembark and dock.

`vehicles.slots` — Quad slots: any Item, chest swap + compact, `tickFreshness` (not freezer). `Act.swapVehicle` legal iff parked (`!running`). Tractor has no 6-slot. Trailer cargo parked only: `Act.swapTrailer` iff attached to a tractor that is field && `driver === 'none'` && `!running`. Seed/spray hopper wrong kind unrepresentable. Harvest slots chest merge+compact, `tickFreshness`. Hangar HUD has no cargo. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`.

`vehicles.away` — Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays. Recap freezes vehicle integrate and `tickDispatch` (boom does not run). Actor pose tracks vehicle while driver. Hide gardener / hat / camera follow are view, not sim. Auto unmanned continues until recap.

`vehicles.unrep` — Two drivers on one vehicle, two vehicles driving the same seat, seated + walk/work queue, stored + driver, stored + running, seated + running, running with no route, running with 0 stops, cursor out of range, goto without XY, load/unload without pad coord, wait without a light cell, stored tractor hitch, quad hitch, tractor slots, quad boom, boom other than `3 | 5`, two trailers on one tractor, attached + stored, trailer attached to missing tractor, harvest `slots.length ≠ HARVEST_SLOTS`, seed/spray hopper wrong item, `HudTarget` hangar, `HudTarget` vehicle: unrepresentable. `Act.setBoom { w: 3 | 5 }` legal while this seat drives that tractor (hitch optional). Latest same `t` wins. Guest may. `boomHits` takes width. Sim OBB `3 | 5` wide × 1 long. Boom fires iff seated **or** auto running, hitch present, `steer === 0`, `speed > 0`; after integrate; not a Cmd. Hangar HUD is `Cue` `{ kind: 'hangar'; at }`. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`. Silo: look name only, no cue.

`vehicles.dash` — Driving dash: occupied Face icons only. Quad occupied of `VEHICLE_SLOTS`; seed/spray hopper or none; harvest occupied of `HARVEST_SLOTS`; tractor no hitch none. Empty omitted. Parked unchanged. Automate chrome iff `unlock-dispatch` in `done`. Dash Automate / editor open: App-local, not logged.

`vehicles.dispatch` — Route is a World object. Vehicle holds `RouteId | 'none'`, cursor `i`, `running`. Loop `i = (i + 1) % n`. Zero stops: Start / hangar Automate no-op. Create names `Route {n}`. Delete route no-op while assigned. Goto arrive dist ≤ `ROUTE_ARRIVE`. Load/unload/wait arrive `floor` is that pad/cell and `speed === 0`. Load/unload then `DISPATCH_DWELL` then one transfer then next. Wait holds while light `inn === 0`; on `1`, next. Seated Load/Unload no-op unless `speed === 0`. Start: this seat drives, route assigned, `n ≥ 1` → disembark, `running` true, cursor kept. Hangar Automate: spawn pad, driver `'none'`, `i = 0`, `running` true. Dock: keep route, `running` false. Embark / Enter on running: pause, board, speed 0, cursor stays. Two-phase: motion in `tickVehicles`; after `evalDag`, `tickDispatch` wait / load / unload. No dock-stop. Guest Start / hangar Automate / route edit. `Act.route` `'o'`. Latest same-`t` assign/start wins.

`vehicles.auto` — Auto running synthesizes Drive inside `tickVehicles` (not `Act.drive`, not `Seat.drive`). Always forward. Yaw in place until `|Δ| ≤ ROUTE_ALIGN`, then throttle 1. No auto reverse. vMax `× AUTO_VMAX_MUL`. Decel only `× AUTO_DECEL_MUL` (throttle 0). Burn when synthesized throttle or steer, same seated formula. Empty fuel: Drive `{0,0}`, seek 0, no crawl, no advance, `running` true. Hitch follows. Boom: seated or auto running, hitch, steer 0, speed > 0.

`vehicles.route` — `World.routes` `World.nextRouteId`. Add appends. Cursor follows the current stop on remove/reorder. `n === 0` → cursor 0, `running` false. Assign `'none'` or a different id: cursor 0; `running` false if none or empty. Quad load/unload uses quad slots; tractor needs hitch (`vehicleCargo()`). Auto tick chest/freezer legal.
