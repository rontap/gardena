# Vehicles

Quad + hangar + tractor + 3 trailers + boom + 3 field silos + shared routes + traffic light. Shelf gates [[mechanics/research]]. Size [[items/buildings]]. Place [[ui/place]]. Chrome [[ui/vehicles]]. Cmds [[architecture/log]]. Seats [[mechanics/multiplayer]]. Light [[mechanics/sensors]]. Numbers preference unless marked.

`HudTarget` stays sprinkler-only.

## Kind

`VehicleKind` `'quad' | 'tractor'`. Quad `slots.length === VEHICLE_SLOTS`, no hitch, no boom field. Tractor no slots, `hitch: TrailerId | 'none'`, `boom: 3 | 5` default 5, persist, survives trailer swap. Fuel is `0..1` on the vehicle, not an Item. Trailer is stored or attached, never loose. `TRAILER_CAP` is the only cargo cap.

`VehicleId` / `TrailerId` / `RouteId` unique on this `World`. Vehicle holds `route: RouteId | 'none'`, `cursor`, `running`.

Pose names: **stored** in a hangar, no driver; **parked** field && `driver === 'none'` && `!running`; **driven** field && `driver` is a `SeatId`; **automated** field && `driver === 'none'` && `running`; **attached** trailer never loose on the field.

Hangar `HANGAR_W × HANGAR_H`. Silo `SILO_W × SILO_H`. Door south. No rotate. Same instance all occupied cells.

`Seat.drive` ignored unless this seat is a driver. `Seat.stride` ignored while this seat is a driver.

## Buy

Unlimited quads, tractors, trailers. `Act.buyVehicle` pays `QUAD_PRICE` / `TRACTOR_PRICE`, not `skuPrice`. Tractor buy `boom` 5. `Act.buyTrailer` pays `TRAILER_*_PRICE`. Hangar-buys are not `skuPrice`. `buy-hangar` and three silo SKUs automation `skuPrice`. Quad / tractor / trailers are hangar-buy only.

`unlock-vehicles` reveals after `unlock-expand`. The three silos are `unlock-silos`. Lens `vehicles` unhidden after `unlock-vehicles` — [[ui/lens]].

## Hangar

Pad: `row = base.row + 2`, `col .. col + HANGAR_W - 1`. Stay plots. Pad is geometric, not a `Cell` kind. Place does not require pad cells free. Deploy / dock require pad-center `inWorld` / `floor(x,y)` on a pad cell. `hangarPad(base)` those coords. `padCenter(base)` south of the footprint.

Click any occupied cell. `Intent` `{ act: 'hangar'; at }` still carries the clicked cell. `dest` = origin. Arrival dest origin: `Seat.cue = { kind: 'hangar'; at }`. [[architecture/world]] `world.dest`.

Cannot delete a hangar that currently stores a vehicle or a trailer. Field vehicles and attached trailers do not block delete. Guest may delete empty hangar. `Act.dock` reads hangar `hangarPad` only. Silo pad click is not Dock.

## Silos

Each is a `Store` and reuses the panel its starter twin already has.

| silo | is | cap |
|---|---|---|
| Seeding silo | `SeedStore` | `SILO_FIELD_SEED_CAP` seeds, grass `'base'` included |
| Additive silo | `AdditiveHolder` | `SILO_FIELD_ADDITIVE_CAP` liters |
| Produce silo | `Store` with slots | `PRODUCE_SLOTS` of fruit, weed and grass only |

Produce silo `accept` is `fruit`, `weed` or `grass`. Swapping an item it will not take is a no-op. Walk-up reuses `silo` / `additives` / `chest`. Walking up deposits first. `Act.takeStore` carries the store cell. Buy row as the house stores — [[ui/store]] [[mechanics/inventory]] `inventory.grass-silo`. Ports and pads stay off. Delete always. Guest may place the three silos — [[mechanics/multiplayer]] `mp.guest`.

## Buy / deploy / store

`Act.buyVehicle { hangar XY, k }`: XY is a hangar cell. Pay that hangar-buy, push stored at origin. Buy from hangar A stores at A. Cannot afford / not hangar / not researched: no-op.

`Act.deploy { id, hangar XY, hitch }`: vehicle stored. This seat is not a driver. Pad-center `inWorld`. Quad: `hitch` must be `'none'`. Tractor: `hitch === 'none'` or that trailer stored. Spawn field at B `padCenter`, `HEADING_SOUTH`, `driver` this seat. Tractor `boom` unchanged. Seats immediately.

`Act.embark { id }`: vehicle field && `driver === 'none'`, this seat not a driver. If actor is on `floor(x,y)` or Euclidean actor→pose ≤ 1.5, snap and board now. Else enqueue. Empty fuel: still board. Running: pause (`running` false), speed 0, cursor stays. Store is `Act.dock`, not on tick.

## Drive

Driver WASD is UI → `Act.drive`. Not per rAF. Send on change / blur / become-not-driver. W `throttle` 1. S `throttle` −1. A `steer` −1. D `steer` 1. Release 0. Tank-steer. Latest same `t` wins.

Tick, per field vehicle, array order. Recap: no integrate. After each field vehicle’s integrate: if tractor with hitch, `followHitch`, then boom. Boom is not a `Cmd`. Two-phase: motion here; wait / load / unload after `evalDag`.

Seated driver:

1. Burn iff driver and (`throttle ≠ 0` || `steer ≠ 0`): `fuel = max(0, fuel - dt / QUAD_FUEL_SECONDS × (1 − 0.05 × driving-classes tier))`.
2. Yaw iff driver: `heading += steer × YAW × dt`. Quad `QUAD_YAW`. Tractor `TRACTOR_YAW`.
3. `drivingMul = 1 + 0.05 × driving-classes tier`. Boots: not. Yaw: not. Husband `machinery`: not.
4. Quad / tractor vMax and accel × `drivingMul`. `TRACTOR_VMAX = QUAD_VMAX × 0.67`. `TRACTOR_ACCEL = QUAD_ACCEL × 0.5`. `TRACTOR_YAW = TRACTOR_VMAX / TRACTOR_R`.
5. `surfaceMul` of `floor(x,y)` before translate. Cap `vMax × surfaceMul × (fuel > 0 ? 1 : QUAD_EMPTY_MUL)`. Cap only, not accel, not walk.
6. Target speed: throttle 1 → `+cap`; −1 → `−cap`; 0 → `0`. Brake: `speed ≠ 0` and `sign(throttle) === −sign(speed)` → `accel × 2`. Coast `throttle === 0` stays `1×`.
7. Translate along heading. After, if `floor(nx,ny)` not `inWorld`, reject the step.
8. Driver remaining: `actor.x/y = vehicle x/y`. Skip that seat’s walk/work. Queue stays empty.

Auto running synthesizes `Drive` inside `tickVehicles`. Always forward. Yaw in place until `|Δ| ≤ ROUTE_ALIGN`, then throttle 1. No auto reverse. Empty fuel: Drive `{0,0}`, seek 0, no crawl, no advance, `running` stays true.

No driver and not running: no burn. No yaw. Seek speed 0. Hitch still follows.

## WASD walk

Not tank. W north, S south, A west, D east. Diagonal: `speed * dt / hypot` so not √2. `Act.stride`. Ignored while this seat is a driver. Tick: if `stride !== {0,0}` and not driver: clear queue + work, walk. Boots apply. Surfaces not. Click while stride held still enqueues; next tick stride wins until keys up.

## Hitch / boom

`hitchP` behind the tractor. Trailer front stays on `P`. `followHitch` after tractor integrate. `boomHits` takes width. Sim OBB `boom` wide × `BOOM_LONG` long, midpoint = hitch pivot `P`. Fires iff that tractor is seated **or** auto running, hitch present, `steer === 0`, `speed > 0`. Reverse and turning do not apply. `Act.setBoom { w: 3 | 5 }`: legal while this seat drives that tractor. Guest may.

Seeding: empty tilled only. Hopper one seeds stack, grass included. Consume 1/plot. Grass sows turf; every other annual plants as hand — [[mechanics/plants]] `plants.grass`.

Spraying: `isTilled && fertilizer < FERT_PLOT_MAX`. Hopper one bag. Spend the gap, same as hand.

Harvest: boom width = that tractor `boom`. Mixed produce, chest merge+compact. Skip trees and turf. Full: skip that cell. Ripe: fruit as empty-hand. Growing `< 0.2`: one seed. Growing `> 0.8`: fruit, quality baked as ripen, freshness = maturity. Growing mid: destroyed. Dead/rotten/weed: that item.

A tick where the boom changed at least one cell sets tractor `working` to `BOOM_WORK_SECONDS`. `working` counts down by `dt` every tick. While it is above 0 the tractor's speed cap is `× BOOM_WORK_MUL`. The cap only — not accel, not yaw, not the burn. A pass over cells the boom cannot touch does not set it, so an empty hopper costs no speed.

## Cap

`TRAILER_CAP`. Seed: hopper empty → 0 else `seeds.count`. Spray: hopper empty → 0 else `floor(liters)`. Harvest: sum of fruit/seeds/dead/rotten/weed `count`. Swap that would exceed cap is no-op.

## Trailer cargo I/O

Parked only. `Act.swapTrailer` legal iff that trailer is `attached` to a tractor that is `field` && `driver === 'none'` && `!running`. Guests may swap.

## Machine pads

Geometric, not a `Cell`. Pads: mill, still, jam, compost-box, chest, freezer, furnace, sorter, house `seed-silo`, `additive-store`. Not barrel, grinder, field silos. Cells from `padPorts()` — [[architecture/modules]] `building.io-ports`. Sorter: one dropoff beside the middle cell, three takeups beside each cell on the side its `facing` names — [[mechanics/machines]] `machines.sorter`. Load from a sorter takeup picks the ground drops of that Variety tier only.

`vehicles.starter-pads` — Every pad the home chunk lays out — both faces of the starter Seed silo and Additive store, and the warehouse's consign row — stands on ground a vehicle can drive onto: owned, not solid, `surfaceMul` 1. `PAD` is the first of `warehousePads(WAREHOUSE_BASE)`, not a second number to keep in step. Moving a starter building means moving it somewhere its pads still land clear — [[items/buildings]].

Unload: dropoff. Load: takeup. Interact iff this seat is driver and `floor(x,y)` is that pad. Instant. Logged. Quad uses quad slots; tractor still needs hitch. Guest: mill/jam/still/compost/furnace/sorter/seed-silo/additive-store yes. Chest/freezer no. Auto tick transfer: chest/freezer legal.

## Surfaces

Mul applies to the cap, not accel, not walk. Paved and asphalt `SURFACE_PAVED` from `World.paving`; tilled (empty weed growing ripe dead rotten turf) / rock / `isSolid` `SURFACE_SLOW`; grass, untilled bare, cobble, brick, fence `SURFACE_NORMAL`. After integrate, `floor(x,y)` not owned → reject the step. Walk speed unchanged. Fence is cosmetic: a paved cell with a fence still uses paved.

## Fuel

Tank on the vehicle. Seated empty: crawl `QUAD_EMPTY_MUL × vMax × surfaceMul`. Auto empty: Drive `{0,0}`, seek 0, no crawl, no advance. No auto-dismount. Can still `Act.embark`. Trailers have no fuel. `Act.refill { hangar XY }`: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Poor no-op. Success: every tank `1`. All full → cost 0, still success.

## Disembark / Dock / Enter

`Act.disembark`: this seat is a driver. Instant: speed 0, `driver` none, actor at vehicle `x,y`, `drive` `{0,0}`, `queue` `[]`. Hitch stays. Route and `running` unchanged. Always legal while driving. Guest may.

`Act.dock`: this seat is a driver AND `floor(x,y)` is a hangar pad cell. Store into that hangar. Tractor hitch stores with it. Tractor `boom` kept. Keep route, `running` false, cursor kept. Guest may.

Enter: if this seat is a driver → `Act.disembark`. Else closest field vehicle with `driver === 'none'`, Euclidean actor→pose ≤ 1.5 → `Act.embark { id }`. Several: min dist, then `World.vehicles` order. Stored / driven: skip. Snap and 1.5-tile reach live in `embarkBody`. Running auto: pause, board, speed 0, cursor stays. No walk-to-embark on Enter. Seated `Act.click` field acts no-op.

## Parked / slots

Click / walk-up the floor cell of a parked or automated vehicle. Arrival: still field && `driver === 'none'` → `Seat.cue = { kind: 'vehicle'; id }`. Quad slots: any `Item`, chest swap + compact, `tickFreshness` (not freezer). `Act.swapVehicle` legal iff parked. Tractor has no 6-slot. Harvest slots chest merge+compact, `tickFreshness`. Hangar HUD has no cargo. Away does not skip vehicle-slot freshness.

## Dispatch

`World.routes`. Route is a World object, not a vehicle. Edit live for every assignee. Stops: `goto`, `unload` / `load` pad, `wait` traffic-light cell — every one a cell `Coord`, and `stopXY` is that cell's centre. Loop `i = (i + 1) % n`. Zero stops: Deploy / hangar Automate no-op. Create names `Route {n}`. Delete route: no-op while one of its vehicles is on the field; otherwise it clears `route` on the stored ones and removes the route. No dock-stop.

A new `World` starts with one empty `Route 1` and `nextRouteId` 2, so the dock has something to draw on with no setup. That is a starting state, not an invariant: delete the last route and there are none until **New route**.

Goto arrive Euclidean ≤ `ROUTE_ARRIVE`. Load/unload/wait arrive `floor` is that pad/cell. Wait holds while light `inn === 0`; on `1`, next — [[mechanics/sensors]] `sensors.light`. Add appends. Add goto no-op unless that cell is owned. Move replaces stop `i` with the stop that cell yields, so a Go dragged onto a pad becomes Load or Unload. Reorder takes stop `i` out and puts it back at `to`, a move and not a swap; `i === to` or either out of range is a no-op. Cursor follows the current stop on remove, move and reorder. `n === 0` → `cursor` 0, assignees `running` false. Delete of a light or pad building strips targeting stops.

`Act.route` `'o'`. All no-op unless `unlock-dispatch` in `done`. Guest may. There is no assign and no start: a vehicle takes a route when Deploy sends it out, and keeps it until the route is deleted.

Deploy: `n ≥ 1` and some hangar stores what `Route.deploy` names. First hangar in `World.hangars` order that can supply it wins. Spawn that hangar's `padCenter`, `HEADING_SOUTH`, driver `'none'`, route assigned, `i = 0`, `running` true; does not seat. Tractor takes the route's `boom`. Hangar Automate: vehicle stored, that hangar, route assigned, `n ≥ 1`; spawn `padCenter`, driver `'none'`, `i = 0`, `running` true; does not seat.

Recall: vehicle field && `driver === 'none'` → store at the nearest hangar by `padCenter` distance, hitch stores with it, `running` false, route kept. No hangar: no-op. It does not drive home.

## What a stop takes

A Load or Unload stop carries a `Pick` — what that stop is allowed to move. It is a chain, each step carrying the ones above it: `any`, then a `PickType`, then a `PickGood`, then a variety. Every step must match the item or it does not move. A stop starts at `any`. `Act.route` `pick` sets it whole.

`PickType` is `seed` `fruit` `produce` `alcohol` `compostable` `tool` `other`. `typeOf(item)` is total over `Item`. `goodOf(item)` is the good inside that type — the crop for seed, fruit and graft, the jam's crop, the spirit or cask kind, otherwise the item kind. A variety step matches one `VarietyId`; an item that carries no variety never matches one. Tier is not a step: the editor colours a variety row by `tierOf` instead, because a tier holding one variety made two rows that meant the same thing.

`sampleItem(type, good, variety)` builds the representative item the editor draws an icon from. It is display only; the sim never calls it.

`varietiesOf(type, good)` is every variety that good can carry, and it is `VARIETIES[cropOfGood(type, good)]` for all of them. A spirit or cask resolves through `CROP_OF_SPIRIT` / `CROP_OF_CASK`, so Brandy offers apricot's varieties and Wine offers grape's — a Brandy is never a potato variety. A mixed spirit is always `base`, so it offers nothing and the editor hides that step. A good with no crop behind it — flour, wood, a tool — offers nothing.

The pick only narrows. The building's `accept` still decides: a pick cannot make a chest take what it refuses, and a stop whose pick matches nothing aboard transfers nothing and still advances.

`BaseBuilding.padGoods(role)` is what each pad side handles — `in` is the dropoff, `out` the takeup. It answers `'all'` or a list of `{ type, good }` pairs, so a side can be narrow down to one good and not just one type. The editor offers only those, and pre-picks a step when the side leaves one option: the compost box takeup is the single pair `other` / `compost`, so both its chips are fixed and unclickable. This is the option space, not a second gate — the sim never reads it; `accept` still decides.

| side | handles |
|---|---|
| Seed silo, both | every seed |
| Warehouse in | every fruit, produce and alcohol |
| Additive store, both | sugar, fertilizer, compost |
| Pot still | `STILL_CROPS` in, `SPIRIT_KINDS` out |
| Mill | its five milled crops plus grass in; sugar, oil, flour, extract, vanilla-extract, flakes out |
| Jam machine | jam crops plus sugar in, the five jams out |
| Compost box | compostables, seeds, fruit and sugar in; compost out |
| Infuser | the infusables plus flakes and vanilla-extract in, the infusables out |

Chest, freezer and sorter stay `'all'`.

## Route deploy

`Route.deploy` is `{ kind: 'quad' }` or `{ kind: 'tractor'; trailer: TrailerKind | 'none'; boom: 3 | 5 }`. A quad carries no trailer and no boom width. A new route starts `{ kind: 'quad' }`. `Act.route` `setDeploy` sets it whole. Deploy reads it and needs one hangar holding both the vehicle and, when a trailer is named, that trailer.

Two-phase tick. Motion in `tickVehicles`. After `evalDag`, `tickDispatch`: wait uses this tick’s light `inn`; load/unload one transfer then next, even if 0 items moved. Empty fuel: do not transfer, do not advance. Several waiters on one light: all hold on 0, all leave on 1. `ROUTE_ARRIVE` / `ROUTE_ALIGN` preference.

## Away / view

Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays. Recap does not freeze vehicle integrate or `tickDispatch`. Actor pose tracks vehicle while driver. Hide gardener / hat / camera follow are view, not sim — [[ui/vehicles]]. Auto unmanned continues through the seam.

Not logged: integrate, follow hitch, boom, burn, `working` countdown, stride integrate, synthesized auto drive, wait / load / unload resolve, camera follow, hide gardener, hangar select, pad arrows, dash faces, route pick in the Vehicle automation dock. Logged: `Act.disembark` `Act.dock` `Act.setBoom` `Act.load` `Act.unload` `Act.stride` `Act.route`.

## Invariants

`vehicles.kind` — `VehicleKind` is `'quad' | 'tractor'`; Quad `slots.length === VEHICLE_SLOTS`, no hitch, no boom, no `working`; Tractor no slots, `hitch` / `boom: 3 | 5` default 5 persist, `working` seconds of cut speed left; fuel is `0..1` on the vehicle, not an Item; trailer is stored or attached, never loose; `TRAILER_CAP` is the only cargo cap.

`vehicles.buy` — Unlimited quads, tractors, trailers; `Act.buyVehicle` / `Act.buyTrailer` pay hangar prices, not `skuPrice`; hangar-buys are not `skuPrice`; `buy-hangar` and three silo SKUs automation `skuPrice`.

`vehicles.surface` — Surface mul applies to the cap, not accel, not walk; paved and asphalt from `World.paving`; tilled / rock / `isSolid` slow; grass, untilled bare, cobble, brick, fence normal; after integrate, `floor(x,y)` not owned → reject the step; walk speed unchanged.

`vehicles.empty` — Seated empty fuel cap `QUAD_EMPTY_MUL × vMax × surfaceMul`; no auto-dismount; can still `Act.embark`; burn `dt / QUAD_FUEL_SECONDS × (1 − 0.05 × driving-classes tier)` while seated and (`throttle ≠ 0` || `steer ≠ 0`); auto empty: Drive `{0,0}`, seek 0, no crawl, no advance, `running` stays true; `TRACTOR_VMAX` / `TRACTOR_ACCEL` / `TRACTOR_YAW` derived from Quad.

`vehicles.refill` — Refill all: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`; poor no-op; success: every tank `1`; trailers have no fuel.

`vehicles.drive` — Tank-steer `Drive` `-1 | 0 | 1`; W forward S reverse A/D yaw; latest `Act.drive` same `t` wins; brake seeks at `accel × 2`; coast `throttle === 0` stays `1×`; driving-classes: burn `× (1 − 0.05 × tier)`, vMax and accel `× (1 + 0.05 × tier)`; yaw not; boots not; husband machinery not on vMax/accel.

`vehicles.hangar` — Hangar `HANGAR_W × HANGAR_H`, door south, pad south of the footprint stay plots; silos `SILO_W × SILO_H`, `siloPad` two cells south; store is `Act.dock` while driver and `floor` is a hangar pad cell; silo pad is not Dock; buy from A stores at A; deploy from B of stored-at-A spawns on B pad, seats immediately; hangar Automate from B: spawn B pad, driver `'none'`, `running` true, does not seat; cannot delete a hangar that stores a vehicle or a trailer; silos delete always.

`vehicles.enter` — Enter: if this seat is a driver → `Act.disembark`; else closest field vehicle with `driver === 'none'` within 1.5 → `Act.embark`; snap and reach live in `embarkBody`; running auto: pause, board, speed 0, cursor stays; no walk-to-embark on Enter; `Act.disembark` while driver always legal; guest may disembark and dock.

`vehicles.slots` — Quad slots any Item, chest swap + compact, `tickFreshness` (not freezer); `Act.swapVehicle` legal iff parked; tractor has no 6-slot; trailer cargo parked only; hangar HUD has no cargo; parked HUD is `Cue` `{ kind: 'vehicle'; id }`.

`vehicles.away` — Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays; recap does not freeze vehicle integrate or `tickDispatch`; hide gardener / hat / camera follow are view, not sim; auto unmanned continues through the seam.

`vehicles.unrep` — Two drivers on one vehicle, two vehicles driving the same seat, seated + walk/work queue, stored + driver, stored + running, seated + running, running with no route, running with 0 stops, cursor out of range, goto without XY, load/unload without pad coord, wait without a light cell, stored tractor hitch, quad hitch, tractor slots, quad boom, boom other than `3 | 5`, two trailers on one tractor, attached + stored, trailer attached to missing tractor, harvest `slots.length ≠ HARVEST_SLOTS`, seed/spray hopper wrong item, `HudTarget` hangar, `HudTarget` vehicle: unrepresentable.

`vehicles.dash` — Driving dash: occupied Face icons only; Quad occupied of `VEHICLE_SLOTS`; seed/spray hopper or none; harvest occupied of `HARVEST_SLOTS`; tractor no hitch none; empty omitted; the dash has no Automate button and the driver's seat does not edit routes — [[ui/vehicles]].

`vehicles.dispatch` — Route is a World object; vehicle holds `RouteId | 'none'`, cursor, `running`; loop `i = (i + 1) % n`; zero stops: Deploy / hangar Automate no-op; goto arrive dist ≤ `ROUTE_ARRIVE`; load/unload/wait arrive `floor` is that pad/cell; wait holds while light `inn === 0`; Deploy: `n ≥ 1` and a hangar stores what `Route.deploy` names → spawn that pad, driver `'none'`, route assigned, `i = 0`, `running` true; Recall: field and driver `'none'` → store at the nearest hangar, `running` false, route kept; hangar Automate: spawn pad, driver `'none'`, `running` true; delete route no-op while one of its vehicles is on the field, else it clears the stored ones; two-phase: motion in `tickVehicles`, after `evalDag` `tickDispatch`; no dock-stop; guest Deploy / Recall / hangar Automate / route edit.

`vehicles.pick` — A Load or Unload stop carries a `Pick` that narrows what moves: `any`, then a `PickType`, then a `PickGood`, then one `VarietyId`; each step must match; a new stop is `any`; the pick only narrows and the building's `accept` still decides; `varietiesOf` is `VARIETIES[cropOfGood(...)]`, so a spirit or cask offers only its own crop's varieties and a mixed spirit offers none; `padGoods(role)` is the building's declared option space as `{ type, good }` pairs, for the editor only — the sim never reads it — and a step with one option is pre-picked and fixed.

`vehicles.deploy` — `Route.deploy` is `{ kind: 'quad' }` or `{ kind: 'tractor'; trailer: TrailerKind | 'none'; boom: 3 | 5 }`; a new route starts `{ kind: 'quad' }`; Deploy takes the first hangar in `World.hangars` order that stores that vehicle and, when a trailer is named, that trailer too; the deployed tractor takes the route's `boom`; a route with no stops is not deployable.

`vehicles.boom-work` — A tick whose boom changed at least one cell sets tractor `working` to `BOOM_WORK_SECONDS`; `working` counts down by `dt` each tick; while `working > 0` the speed cap is `× BOOM_WORK_MUL`; the cap only, not accel, not yaw, not the burn.

`vehicles.auto` — Auto running synthesizes Drive inside `tickVehicles`; always forward; yaw in place until `|Δ| ≤ ROUTE_ALIGN`, then throttle 1; no auto reverse; vMax `× AUTO_VMAX_MUL`; empty fuel: Drive `{0,0}`, seek 0, no crawl, no advance, `running` true; hitch follows; boom: seated or auto running, hitch, steer 0, speed > 0.

`vehicles.route` — `World.routes` `World.nextRouteId`; a new `World` starts with one empty `Route 1` and `nextRouteId` 2; every stop is a cell `Coord` and `stopXY` is that cell's centre; add appends; move replaces stop `i` with the stop that cell yields; reorder lifts stop `i` and inserts it at `to`, a move not a swap; cursor follows the current stop on remove, move and reorder; `n === 0` → cursor 0, `running` false; Quad load/unload uses quad slots; tractor needs hitch; auto tick chest/freezer legal.

`vehicles.silo-store` — The three field silos hold what their name says and open the walk-up panel their starter twin uses; Seeding silo `SILO_FIELD_SEED_CAP` seeds, grass `'base'` included; Additive silo `SILO_FIELD_ADDITIVE_CAP` liters; Produce silo `PRODUCE_SLOTS` of fruit, weed and grass only; `Act.takeStore` carries the store cell — [[ui/store]] [[mechanics/inventory]] `inventory.grass-silo`.

`vehicles.seeder` — Seeder hopper is one `{ kind: 'seeds' }` stack, `crop: 'grass'` legal; boom on empty tilled: grass sows turf; every other annual plants as hand; consume 1/plot.
