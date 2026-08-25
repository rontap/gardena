# Vehicles II

Quad + hangar + tractor + 3 trailers + boom + 3 inert silos. Types [[architecture/world]]. Shop gates [[mechanics/research]]. Dump [[architecture/save]]. Cmds [[architecture/log]]. Seats [[mechanics/multiplayer]]. Numbers preference unless marked.

Vehicles I remains. Not collision. Not vehicle-detector. Click-walk speed unchanged — [[items/tiles]]. WASD walk and dash cargo below. `HudTarget` counter / day — [[mechanics/sensors]]. Dash cargo is driving overlay, not `HudTarget`.

## Files

| file | owns |
|---|---|
| `src/game/defs/items.ts` | `QUAD_*` `VEHICLE_SLOTS` `HANGAR_W` `HANGAR_H` `SILO_W` `SILO_H` `SURFACE_*` `HEADING_*` `TRACTOR_VMAX` `TRACTOR_ACCEL` `TRACTOR_R` `TRACTOR_YAW` `TRACTOR_PRICE` `TRACTOR_LEN` `TRACTOR_WIDE` `HITCH_BACK` `TRAILER_LEN` `TRAILER_WIDE` `TRAILER_CAP` `TRAILER_SEED_PRICE` `TRAILER_SPRAY_PRICE` `TRAILER_HARVEST_PRICE` `HARVEST_SLOTS` `BOOM_LONG` `SILO_SEED_PRICE` `SILO_SPRAY_PRICE` `SILO_PRODUCE_PRICE` |
| `src/game/defs/research.ts` | `unlock-vehicles` `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` |
| `src/game/sim/ids.ts` | `VehicleKind` `VehicleId` `VehicleSlot` `TrailerKind` `TrailerId` `HarvestSlot` `SkuId` += `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` |
| `src/game/sim/vehicle.ts` | `Vehicle` `Trailer` `Drive` `VehiclePose` `TrailerPose` `surfaceMul` `hangarPad` `siloPad` `dropoffPad` `takeupPad` `padCenter` `hitchP` `trailerCenter` `followHitch` `boomHits` `seekSpeed` `integrateVehicle`. No `World`. No `Dismount`. |
| `src/game/sim/building.ts` | `Hangar` `SiloSeed` `SiloSpray` `SiloProduce` |
| `src/game/sim/plot.ts` | `Cell` += hangar `silo-seed` `silo-spray` `silo-produce`. `isSolid` += those |
| `src/game/sim/world.ts` | `World.vehicles` `World.trailers` `World.hangars` `World.seedSilos` `World.spraySilos` `World.produceSilos` `World.nextVehicleId` `World.nextTrailerId`. `Seat.drive`. Cue hangar. Cue vehicle. apply / tick / boom after integrate / `away` |
| `src/game/sim/log.ts` | `Act.drive` `stride` `buyVehicle` `buyTrailer` `deploy` `embark` `disembark` `dock` `swapVehicle` `swapTrailer` `refill` `setBoom` `load` `unload` |
| `src/game/sim/save.ts` | `SAVE_VERSION` 1.72. dump vehicles + trailers + hangar/silo cells + mill/jam/still `inn` + chest/freezer/seed-silo/additive-store `out` `hold`. No migrate. `Seat.stride` not in the file |
| `src/game/sim/mp.ts` | `PROTOCOL` 1.72. permit `load` `unload` except guest chest/freezer. permit `stride`. digest += mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out` |
| `src/game/sim/field.ts` | quad slot + harvest-trailer slot `tickFreshness` |
| `src/game/sim/intents.ts` | `hangar` `vehicle` `embark` |
| `src/game/sim/prompt.ts` | hangar / parked vehicle / silo look / delete block. `hangarSiteOk` `siloSiteOk` |
| `src/game/sim/look.ts` | hangar / quad / tractor / silos |
| `src/game/sim/item.ts` | `Face` += hangar `silo-seed` `silo-spray` `silo-produce` |
| `src/game/sim/vehicle.test.ts` | named invariants |
| `src/game/ui/hangar.tsx` | hangar cue: buy Quad / Tractor / three trailers / list / Deploy (stored vehicle; tractor may hitch a stored trailer or none) / Refill. No 6-slot. No cargo. |
| `src/game/ui/vehicle.tsx` | parked Quad: 6 slots + Embark. parked tractor: trailer cargo if hitched + Embark. Parked dialog unchanged — no dash cargo |
| `src/game/view/map.tsx` | paint field quad / tractor / attached trailer; hide gardener while seated; hangar + silo + machine pad arrows view-only, local driver only; pad opacity 0.5, 1 iff that pad action legal |
| `src/game/view/camera.ts` | follow local actor. View-local. Not sim |

Do not create `src/` here.

## Defs

| id | value | |
|---|---|---|
| `WALK` | 6 | existing `actor.ts` |
| `QUAD_VMAX` | 8 | preference |
| `QUAD_SHOW_MUL` | 4 | preference. Dash km/h only. Not sim |
| `QUAD_ACCEL_SECONDS` | 1.5 | preference |
| `QUAD_ACCEL` | `QUAD_VMAX / QUAD_ACCEL_SECONDS` | derived |
| `QUAD_R` | 3 | preference. Turning radius names yaw |
| `QUAD_YAW` | `QUAD_VMAX / QUAD_R` | derived. Not driving-classes |
| `QUAD_FUEL_SECONDS` | 180 | preference. Full tank, continuous throttle or steer |
| `QUAD_REFILL` | 25 | preference. $ for a full tank |
| `QUAD_PRICE` | 150 | preference. Hangar buy. Not a shop place SKU |
| `QUAD_EMPTY_MUL` | 0.1 | preference |
| `VEHICLE_SLOTS` | 6 | preference. Quad only |
| `HANGAR_W` | 3 | preference |
| `HANGAR_H` | 2 | preference |
| `SILO_W` | 2 | preference |
| `SILO_H` | 3 | preference |
| `SURFACE_PAVED` | 1.3 | preference |
| `SURFACE_SLOW` | 0.4 | preference |
| `SURFACE_NORMAL` | 1.0 | preference |
| `HEADING_EAST` | 0 | preference. +x |
| `HEADING_SOUTH` | `π / 2` | derived. +y |
| `TRACTOR_VMAX` | `QUAD_VMAX × 0.67` | derived |
| `TRACTOR_ACCEL` | `QUAD_ACCEL × 0.5` | derived |
| `TRACTOR_R` | 3 | preference. Not `QUAD_R × 0.75` |
| `TRACTOR_YAW` | `TRACTOR_VMAX / TRACTOR_R` | derived. Not driving-classes |
| `TRACTOR_PRICE` | 250 | preference. Hangar buy. Not a shop place SKU |
| `TRACTOR_LEN` | 1 | preference. Tiles along heading |
| `TRACTOR_WIDE` | 1 | preference |
| `HITCH_BACK` | `TRACTOR_LEN / 2` | derived. 0.5 |
| `TRAILER_LEN` | 1 | preference |
| `TRAILER_WIDE` | 1 | preference |
| `TRAILER_CAP` | 100 | preference. One cap. Not a second tank type |
| `TRAILER_SEED_PRICE` | 80 | preference. Hangar buy |
| `TRAILER_SPRAY_PRICE` | 80 | preference. Hangar buy |
| `TRAILER_HARVEST_PRICE` | 100 | preference. Hangar buy |
| `HARVEST_SLOTS` | 8 | preference. 4×2 |
| `BOOM_LONG` | 1 | preference. Along trailer heading |
| `SILO_SEED_PRICE` | 70 | preference. `skuPrice` `buy-silo-seed` |
| `SILO_SPRAY_PRICE` | 70 | preference. `skuPrice` `buy-silo-spray` |
| `SILO_PRODUCE_PRICE` | 70 | preference. `skuPrice` `buy-silo-produce` |
| `unlock-vehicles` | automation $32 / 70s, reveal `unlock-irrigation` | preference |
| `buy-hangar` | $80 automation | preference. `haggling` applies |

Hangar-buys (`QUAD_PRICE` `TRACTOR_PRICE` three trailer prices) are not `skuPrice`. `haggling` does not discount them. Silo SKUs are `skuPrice` (haggling applies).

Tractor boom width is the tractor field `boom: 3 | 5`, default 5. Not a `BOOM_WIDE` constant.

## Ids

```
VehicleKind = 'quad' | 'tractor'
VehicleId = number
VehicleSlot = 0 | 1 | 2 | 3 | 4 | 5
TrailerKind = 'seed' | 'spray' | 'harvest'
TrailerId = number
HarvestSlot = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
Drive = { throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }
```

`VehicleId` unique on this `World`, from `World.nextVehicleId` (starts 1). `TrailerId` unique, from `World.nextTrailerId` (starts 1).

```
VehiclePose =
  | { kind: 'stored'; hangar: Coord }
  | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }

TrailerPose =
  | { kind: 'stored'; hangar: Coord }
  | { kind: 'attached'; vehicle: VehicleId; heading: number }
```

`hangar` is that hangar’s origin `{ col: base.col, row: base.row }`. Heading radians, wrap `[0, 2π)`. Speed signed tiles/s. Fuel `0..1`.

Pose names (not extra arms):

- **stored** — `pose.kind === 'stored'`. In a hangar. No driver.
- **parked** — vehicle `pose.kind === 'field'` && `driver === 'none'`.
- **driven** — vehicle `pose.kind === 'field'` && `driver` is a `SeatId`.
- **attached** — trailer `pose.kind === 'attached'`. Never loose on the field.

```
Vehicle =
  | {
      kind: 'quad'
      id: VehicleId
      fuel: number
      slots: Slot[]
      pose: VehiclePose
    }
  | {
      kind: 'tractor'
      id: VehicleId
      fuel: number
      hitch: TrailerId | 'none'
      boom: 3 | 5
      pose: VehiclePose
    }
```

Quad: `slots.length` is always `VEHICLE_SLOTS`. No hitch field. No boom field. Tractor: no slots field. Stored tractor: `hitch === 'none'`. Tractor `boom` default 5 on buy. Persist on the tractor. Survives trailer swap.

```
SeedHopper =
  | { kind: 'empty' }
  | { kind: 'hold'; item: Extract<Item, { kind: 'seeds' }> }

SprayHopper =
  | { kind: 'empty' }
  | { kind: 'hold'; item: Extract<Item, { kind: 'fertilizer' | 'synth' | 'compost' }> }

Trailer =
  | { kind: 'seed'; id: TrailerId; pose: TrailerPose; hopper: SeedHopper }
  | { kind: 'spray'; id: TrailerId; pose: TrailerPose; hopper: SprayHopper }
  | { kind: 'harvest'; id: TrailerId; pose: TrailerPose; slots: Slot[] }
```

Harvest `slots.length` is always `HARVEST_SLOTS`. Hopper is one stack / one bag. Wrong item kind is unrepresentable.

```
Hangar = { kind: 'hangar'; base: RectBase }
SiloSeed = { kind: 'silo-seed'; base: RectBase }
SiloSpray = { kind: 'silo-spray'; base: RectBase }
SiloProduce = { kind: 'silo-produce'; base: RectBase }
```

Hangar `RectBase` `w = HANGAR_W` `h = HANGAR_H`. Silo `RectBase` `w = SILO_W` `h = SILO_H`. Door south. No rotate. Same instance all 6 cells.

```
Seat += { drive: Drive; stride: { x: -1 | 0 | 1; y: -1 | 0 | 1 } }
```

`Seat.drive` ignored unless this seat is a driver. `Seat.stride` ignored while this seat is a driver. Load stride `{0,0}` — not in Save.

No `Seat.dismount`. No `Dismount` type.

`World.vehicles: Vehicle[]`. `World.trailers: Trailer[]`. `World.hangars` / `World.seedSilos` / `World.spraySilos` / `World.produceSilos` hold the same instances as their cells. `World.nextVehicleId`. `World.nextTrailerId`.

Trailer is a permanent `World` object: stored at a hangar origin or attached to a tractor. Never loose. Inventory survives store / attach.

## Illegal

- two drivers on one vehicle
- seated seat with walk/work queue
- stored + driver
- stored tractor `hitch !== 'none'`
- quad hitch / tractor slots
- quad boom / boom other than `3 | 5`
- two trailers on one tractor
- trailer attached + stored
- trailer attached to missing or non-tractor vehicle
- tractor `hitch === id` without that trailer `attached.vehicle ===` that tractor
- `harvest.slots.length ≠ HARVEST_SLOTS`
- seed/spray hopper holding the wrong item
- `slots.length ≠ VEHICLE_SLOTS` on a quad
- `{ kind: 'fuel' }` Item
- `HudTarget` hangar
- `HudTarget` vehicle
- save migrate
- `Dismount` / `Seat.dismount`

Stored arm has no `driver`. Field `driver` is `SeatId | 'none'`. At most one `pose.field.driver === s` for each seat. At most one trailer `attached.vehicle === v`. Cap per driver: one trailer per tractor. One driver per vehicle. Several field tractor+trailers legal (MP). Quad unlimited.

## Research / shop

`unlock-vehicles` automation, `gate` `{ kind: 'none' }`, `effect` `unlock-sku` `buy-hangar`. Reveals after `unlock-irrigation`. Does not grant a Quad / tractor / trailer SKU. No new research row.

`buy-hangar` automation tab, unlock `unlock-vehicles`, show `unlock-irrigation`. Place path. Disarm on confirm. `skuPrice` (haggling). Guest `GUEST_BUILD`.

`buy-silo-seed` `buy-silo-spray` `buy-silo-produce` automation tab, unlock `unlock-vehicles`, show `unlock-irrigation`. Place path. Disarm on confirm. `skuPrice` `SILO_*_PRICE` (haggling). Guest `GUEST_BUILD`.

Quad / tractor / trailers are hangar-buy only. `Act.buyVehicle` / `Act.buyTrailer`. No `Place` ghost. No shop SKU.

## Hangar

Place like chest, 3×2 plots, origin = clicked NW cell, extends east and south. Pay on confirm. Disarm. Automation tab.

Pad: `row = base.row + 2`, `col .. col + HANGAR_W - 1`. Stay plots. Pad is geometric, not a `Cell` kind. Place does not require pad cells free. Deploy / dock require pad-center `inWorld` / `floor(x,y)` on a pad cell.

`hangarPad(base)` those three coords. `padCenter(base)` `{ x: base.col + HANGAR_W / 2, y: base.row + HANGAR_H + 0.5 }`.

`siloPad(base)` two coords: `row = base.row + SILO_H`, `col = base.col` and `base.col + 1`. Stay plots. Not Dock.

Walk-up any occupied cell (silo cue). `Intent` `{ act: 'hangar'; at: Coord }`. `dest` = `at`. Arrival: `Seat.cue = { kind: 'hangar'; at }`.

Hangar HUD is that cue. `HudTarget` stays sprinkler-only. Select is App-local (not logged, not `World`): a stored/field vehicle, and if the selected vehicle is a tractor, a stored trailer or none. Panel: buy Quad / Tractor / Seeder / Sprayer / Harvester / list all owned vehicles and trailers / Deploy (stored vehicle only; hitch optional) / Refill all. No 6-slot. No cargo UI. No attachment grid.

Cannot delete a hangar that currently stores a vehicle or a trailer (`pose.kind === 'stored'` && `hangar` equals this origin). No-op. Field vehicles and attached trailers do not block delete. Empty hangar is a delete target. Guest may delete empty hangar.

House / starter pump / truck still not delete targets.

`isSolid` += hangar.

Pad arrows: view-only, only while local driver. Not sim. Not logged. `Act.dock` reads hangar `hangarPad` only. Silo pad click is not Dock. Only hangar pads store.

## Silos

Shop SKUs. 2×3, door south, no rotate, same instance all 6 cells. Origin = clicked NW, extends east `SILO_W` and south `SILO_H`. `siloSiteOk` like hangarSiteOk but 2×3. Do not call hangarSiteOk for silo SKUs. Pad: `siloPad`. Automation, `unlock-vehicles`, `haggling`.

| class | `kind` | sku | $ | look |
|---|---|---|---|---|
| `SiloSeed` | `silo-seed` | `buy-silo-seed` | `SILO_SEED_PRICE` | **Seeding silo** |
| `SiloSpray` | `silo-spray` | `buy-silo-spray` | `SILO_SPRAY_PRICE` | **Spraying silo** |
| `SiloProduce` | `silo-produce` | `buy-silo-produce` | `SILO_PRODUCE_PRICE` | **Produce silo** |

Starter 1×2 `seed-silo` / **Seed silo** stays. Not these SKUs.

Inert: walk-up look name only. No dialog. No cue. No merge. `isSolid`. Delete always. Guest `GUEST_BUILD` += the three SKUs. South pad arrows while local driver (view-only): two arrows, `siloPad`. Not Dock. Hangar still `hangarPad` three cells.

## Buy / deploy / store

Unlimited Quads, tractors, trailers.

`Act.buyVehicle { hangar XY, k }`: XY is a hangar cell (resolve origin). `done` has `unlock-vehicles`. `k === 'quad'` → `money >= QUAD_PRICE`, pay `QUAD_PRICE`, push quad `fuel` 1, six empty slots, `pose: { kind: 'stored'; hangar: origin }`, `id = nextVehicleId++`. `k === 'tractor'` → `money >= TRACTOR_PRICE`, pay `TRACTOR_PRICE`, push tractor `fuel` 1, `hitch: 'none'`, `boom: 5`, stored at origin. Buy from hangar A stores at A. Cannot afford / not hangar / not researched: no-op.

`Act.buyTrailer { hangar XY, k }`: XY hangar cell. `done` has `unlock-vehicles`. Pay `TRAILER_SEED_PRICE` / `TRAILER_SPRAY_PRICE` / `TRAILER_HARVEST_PRICE` for that `TrailerKind`. Push `Trailer` `id = nextTrailerId++`, `pose: { kind: 'stored'; hangar: origin }`, seed/spray hopper empty, harvest eight empty slots. Cannot afford / not hangar / not researched: no-op.

`Act.deploy { id, hangar XY, hitch }`: vehicle exists, `pose.kind === 'stored'`. XY is hangar B (resolve origin). This seat is not a driver. Pad-center `inWorld`. Quad: `hitch` must be `'none'` else no-op. Tractor: `hitch === 'none'` or that `TrailerId` exists and `pose.kind === 'stored'`; else no-op. Spawn field at B `padCenter`, `heading: HEADING_SOUTH`, `speed` 0, `driver` this seat. Tractor `hitch` written. Tractor `boom` unchanged. If hitching: trailer `pose = { kind: 'attached'; vehicle: id; heading: HEADING_SOUTH }`. `Seat.drive` `{0,0}`. `queue` `[]`. `cue` none. Actor `x,y` = pad-center. Deploy from hangar B of a vehicle stored at A spawns on B’s pad. Seats immediately. Trailer hitch optional.

`Act.embark { id }`: from parked cue HUD, or same cmd. Vehicle parked, this seat not a driver. If actor is on `floor(x,y)`, board now: `driver` this seat, `drive` `{0,0}`, `queue` `[]`, `cue` none, actor snaps to `x,y`. Else enqueue `{ act: 'embark'; id }`, `dest` = that floor at apply. Arrival: board iff still parked, actor on current `floor(x,y)`; else `shiftHead`. Empty fuel: still board. Stored: no-op. Driven: no-op. Hitch stays. Boom stays.

No auto-store. Store is not on tick when center enters pad. Store is `Act.dock`.

## Drive

Driver WASD is UI → `Act.drive`. Not per rAF. Send on change / blur / become-not-driver.

W `throttle` 1. S `throttle` −1. A `steer` −1. D `steer` 1. Release 0. Tank-steer: A/D yaw in place. Same kind yaw at speed 0. S reverse. W forward. Quad dash / follow-cam / pad-dock unchanged. Not driver: WASD is stride, not tank.

`Act.drive { throttle, steer }` writes `seats[p].drive`. Latest same `t` wins. Ignored unless this seat is a driver.

App: existing WASD `held` — if driver `drive`, else `stride`. Text fields ignore.

Tick, per field vehicle, array order. Recap: no integrate. After each field vehicle’s integrate: if tractor with hitch, `followHitch`, then boom (that vehicle). Boom is not a `Cmd`. No pulse.

Driver present: read that `Drive`.

1. Burn iff driver and (`throttle ≠ 0` || `steer ≠ 0`): `fuel = max(0, fuel - dt / QUAD_FUEL_SECONDS × (1 − 0.05 × driving-classes tier))`. Quad and tractor. Same tank seconds. Missing owned key → tier 0.
2. Yaw iff driver: `heading += steer × YAW × dt`, wrap. Quad `QUAD_YAW`. Tractor `TRACTOR_YAW`.
3. `drivingMul = 1 + 0.05 × driving-classes tier`. Boots: not. Yaw: not. Husband `machinery`: not.
4. Quad: `vMax = QUAD_VMAX × drivingMul`. `accel = QUAD_ACCEL × drivingMul`. Tractor: `vMax = TRACTOR_VMAX × drivingMul`. `accel = TRACTOR_ACCEL × drivingMul`.
5. `surfaceMul` of `floor(x,y)` before translate. Cap `vMax × surfaceMul × (fuel > 0 ? 1 : QUAD_EMPTY_MUL)`. Cap only, not accel, not walk.
6. Target speed: throttle 1 → `+cap`; −1 → `−cap`; 0 → `0`. Seek accel: if `speed ≠ 0` and `sign(throttle) === −sign(speed)` → `accel × 2`. Coast `throttle === 0` stays `1×`. Reverse-from-stop unchanged (`speed === 0`). `seekSpeed` at that accel. If remaining to target `<= accel × dt`, snap target (speed 0 is exact).
7. Translate along heading: `dx = cos(heading) × speed × dt`, `dy = sin(heading) × speed × dt`. After, if `floor(nx,ny)` not `inWorld`, reject the step (keep `x,y`). Heading and speed stay. No fade driving.
8. Driver remaining: `actor.x/y = vehicle x/y`. Skip that seat’s walk/work. Queue stays empty.

No driver: Drive ignored. No burn. No yaw. Seek speed 0 at that kind’s accel (not driving-classes). Translate. Hitch still follows.

No store-on-tick. No coast-to-walk.

## WASD walk

Not tank. W north (−y), S south (+y), A west (−x), D east (+x). W+A northwest. Both of an axis → 0. Diagonal: `speed * dt / hypot(dx, dy)` so not √2.

```
Seat.stride = { x: -1 | 0 | 1; y: -1 | 0 | 1 }
Cmd += { a: typeof Act.stride; t; p; x: -1 | 0 | 1; y: -1 | 0 | 1 }
```

`Act.stride` `'K'`. `pickSkill` stays `'k'`. Send on key change / blur / become-not-driver, same as `Act.drive`. Latest same `t` wins. Ignored while this seat is a driver. Load `{0,0}` — not in Save.

Tick (`tickQueue` / per-seat, `presence === 'in'`, not recap): if `stride !== {0,0}` and not driver: clear queue + work (stop shovel mid-swing), `actor.x/y += dir * walkSpeed() * dt`. Boots apply. Surfaces not. No owned-land reject (click-walk has none). Away skips. Actor SVG stays one pose.

Click while stride held still enqueues; next tick stride wins until keys up. WASD walk **and** click-queue.

Window blur → stride `{0,0}`.

Not logged: the integrate. Logged: `Act.stride` (MP digest already has `actor.x/y`).

## Dash cargo

Driving dash only (`src/game/ui` overlay on `ui-dash-*`). Not parked cue. Not hangar.

Small `ItemFace` of current load. Occupied Face icons only (almanac/shop faces). Empty omitted. Reuse Face SVGs. No new item art. Size: smaller than shop `h-10` (ui-ux).

| driven | icons |
|---|---|
| Quad | occupied of `slots` (≤6), slot order |
| Tractor + seed/spray | hopper item, or none if empty |
| Tractor + harvest | occupied of 8, slot order |
| Tractor no hitch | none |

Quad dash currently has no cargo strip — add one. Tractor keeps `{used}/100`; icons sit with that readout. Parked dialog unchanged.

## Hitch / visual

Tractor 1×1 tiles, red, pose `(x,y)` = center. Trailer 1×1. Hitch at tractor rear.

`hitchP(x, y, heading) = (x, y) − HITCH_BACK · (cos heading, sin heading)`.

Trailer front stays on `P`. `trailerCenter(P, trailerHeading) = P − (TRAILER_LEN / 2) · trailer heading vec`.

`followHitch` after tractor integrate (including rejected step — current `P`):

1. `P0` from tractor pose before integrate; center = `trailerCenter(P0, heading)`.
2. `P1` from tractor pose after integrate.
3. Rear = center − `(TRAILER_LEN / 2) ·` old heading vec.
4. New heading = `atan2(P1.y − rear.y, P1.x − rear.x)`, wrap.
5. Write `pose.heading`. Front on `P1`. Not rigid. Deploy snaps trailer heading = tractor heading.

## Boom

One trailer SKU per kind. `boomHits` takes width. Sim OBB `boom` wide × `BOOM_LONG` long (`3 | 5` × 1), midpoint = hitch pivot `P`, long axis = trailer heading. Half extents `boom / 2` perp, `BOOM_LONG / 2` along. Any owned plot whose tile square `[col, col+1] × [row, row+1]` intersects the OBB is touching. `boomHits` those coords, sort row then col. Rake visual matches boom width (view scale; not sim).

Tick after integrate. Vehicle array order. Not a `Cmd`. No pulse.

Fires iff that tractor is driven, that seat `steer === 0`, `speed > 0` (forward). Reverse and turning do not apply. `hitch === 'none'`: no boom.

`Act.setBoom { w: 3 | 5 }`: legal while this seat drives that tractor (hitch optional). Writes `boom`. Quad: no-op (no boom field). Latest same `t` wins. Guest may.

### Seeding

Trailer `kind === 'seed'`. Empty tilled only (`plot.kind === 'empty'`). Hopper one `{ kind: 'seeds' }` stack (one crop+rarity). Consume 1/plot. Plant same as hand: `growing`, same soil, `Plant(crop, rarity)`. Hopper `count -= 1`; `count === 0` → empty. Skip weed, turf, grass-seeds, saplings, empty hopper, used would not apply (already empty). Empty hopper: skip remaining cells.

### Spraying

Trailer `kind === 'spray'`. `isTilled && fertilizer < FERT_PLOT_MAX`. Hopper one bag `fertilizer` | `synth` | `compost`. Spend the gap, same as hand: `need = FERT_PLOT_MAX − fertilizer`, `use = min(need, liters)`, synth `spike` else `feed`, `liters -= use`, `liters <= 0` → empty. Empty hopper / full plot: skip. Not weed-spray. `weed-spray` in the hopper is unrepresentable.

### Harvest

Trailer `kind === 'harvest'`. Boom width = that tractor `boom`, 4×2 (`HARVEST_SLOTS`) slots, mixed produce, chest merge+compact (`compactSlots`). Skip trees and turf. Full in the sense of `TRAILER_CAP` or no merge slot: skip that cell (plant stays). Insert then compact; do not partial-insert.

| plot | item | plot after |
|---|---|---|
| `ripe` | fruit, same as empty-hand harvest (`unitSale = stats.sale`, freshness / bio from plant, `tally.harvests += 1`) | `empty` same soil |
| `growing` maturity `< 0.2` | `{ kind: 'seeds'; crop; rarity; count: 1 }` | `empty` same soil |
| `growing` maturity `> 0.8` | fruit, rarity = plant rarity (no ripen roll), freshness = maturity, bio from plant, `unitSale = stats.sale` | `empty` same soil |
| `growing` `0.2 ≤ m ≤ 0.8` | none (destroyed) | `empty` same soil |
| `dead` | `{ kind: 'dead'; cls: CROPS[plant.crop].cls; count: 1 }` | `empty` same soil |
| `rotten` | `{ kind: 'rotten'; cls: CROPS[crop].cls; count: 1 }` | `empty` same soil |
| `weed` | `{ kind: 'weed'; count: 1 }` | `empty` same soil |

## Cap

`TRAILER_CAP = 100`. Dashboard `used / 100` while local driver of a tractor with hitch. One cap. Do not invent a 100 L tank type.

```
trailerUsed:
  seed: hopper empty → 0 else seeds.count
  spray: hopper empty → 0 else floor(liters)
  harvest: sum of fruit/seeds/dead/rotten/weed `count` across the 8 slots (no liters)
```

Seed: swap that would exceed 100 is no-op. Spray: swap/pour that would put `floor(liters) > 100` is no-op. Bag `capacityLiters` stays the bag’s own cap. A bag with `liters > 100` cannot swap in. Harvest: insert that would make `used > 100` is skip (plant stays) / swap no-op.

## Trailer cargo I/O

Parked only. `Act.swapTrailer { u, i }` swaps `seats[p].hand` with hopper (`i` must be 0) or `slots[i]`, then `compactSlots` on harvest. Legal iff that trailer is `attached` to a tractor that is `field` && `driver === 'none'`. Hangar: no cargo UI. Driving: no cargo swap. Stored unattached: no-op. Seed/spray refuse wrong item kind (hopper type cannot represent it) — no-op. Guests may swap.

## Machine pads

Geometric, not a `Cell`. Stay plots. Place does not require pad free.

Pads: mill, still, jam, compost-box, chest, freezer, house `seed-silo`, `additive-store`. Not barrel, grinder, field silos.

```
dropoffPad(base) = { row: base.row - 1, col: base.col + i } for i in 0..w-1
takeupPad(base)  = { row: base.row + h, col: base.col + i } for i in 0..w-1
```

Unload: dropoff. Load: takeup. Interact iff this seat is driver and `floor(x,y)` is that pad (hangar `Act.dock`). Else no-op.

Paint: local driver only. Opacity 0.5; 1 iff that pad’s Load or Unload is legal.

## Load / Unload

Cargo: Quad `slots`. Tractor harvest `slots` `TRAILER_CAP`; seed hopper; spray hopper. Tractor `hitch === 'none'`: buttons hidden, both cmds no-op.

```
Cmd +=
  | { a: typeof Act.load; t; p }
  | { a: typeof Act.unload; t; p }
```

`Act.load` `'L'`. `Act.unload` `'U'`. No coord. Floor of the driven vehicle. Instant. Logged. Legal while driven.

Unload: cargo → building, all legal until dest full. Same accept as walk dump (boxes). Mill/jam fruit/compost: no extra hopper cap. Still `STILL_CAP`. Jam sugar `JAM_BUFFER`. Chest/freezer merge+compact. Seed silo `SILO_SEED_CAP`. Additive `ADDITIVE_CAP_LITERS`.

Load: chest/freezer pull until cargo full. Silo seeds. Additive bags `min(ADDITIVE_BAG, stored)`. Machines: pick all ground drops on takeup cells the cargo accepts. Keep `frontOf`.

Guest: mill/jam/still/compost/seed-silo/additive-store yes. Chest/freezer no (`swapChest`).

## Surfaces

Mul applies to the cap, not accel, not walk. Speed seeks the new cap at accel. Same cell classes.

| site | mul |
|---|---|
| `untilled` cover `tile` `paved` | `SURFACE_PAVED` |
| tilled: `empty` `weed` `growing` `ripe` `dead` `rotten` `turf` | `SURFACE_SLOW` |
| `rock` | `SURFACE_SLOW` |
| `isSolid` | `SURFACE_SLOW` |
| grass, untilled bare, cobble, brick, fence, else | `SURFACE_NORMAL` |

Fence is cosmetic: a paved cell with a fence still uses paved. Walk speed is not this slice. Silos are `isSolid` → `SURFACE_SLOW`.

Pose clamped to owned land. Fade tiles are not owned.

## Fuel

Tank on the vehicle. Not an item. Empty: crawl, no auto-dismount, can still Embark. Trailers have no fuel.

`Act.refill { hangar XY }`: XY is a hangar cell. Cost `sum over World.vehicles of (1 - fuel) × QUAD_REFILL`. `money < cost` → no-op, no tank changes. Else pay, every tank `1`. Shared money. Field and stored. Quads and tractors. All full → cost 0, still success.

## Disembark / Dock / Enter

No auto-dismount. No auto-store. No coast-to-walk.

`Act.disembark`: this seat is a driver. Instant: speed 0, `driver` none, actor at vehicle `x,y`, `drive` `{0,0}`, `queue` `[]`. Hitch stays attached. Always legal while driving. Else no-op. Guest may.

`Act.dock`: this seat is a driver AND `floor(x,y)` is a hangar pad cell (not a silo pad). Store into that hangar — pose `{ kind: 'stored'; hangar: origin }`, `driver` none, `drive` `{0,0}`, `queue` `[]`, actor stays at vehicle `x,y` (standing on the pad). If tractor `hitch !== 'none'`: that trailer `pose = { kind: 'stored'; hangar: origin }`, tractor `hitch = 'none'`, inventory kept. Tractor `boom` kept on the stored tractor. That hangar: the pad that contains the center. Else no-op. Guest may.

Enter: if this seat is a driver → `Act.disembark`. Else closest parked field vehicle with Euclidean actor→pose ≤ 1.5 → `Act.embark { id }` instant (same as already-on-tile). Several: min dist, then `World.vehicles` order. Stored / driven: skip. None in range: no-op. Dash Disembark / parked Embark stay. No walk-to-embark on Enter.

Seated `Act.click` is not dismount. Click while driving: no-op for field acts (same as today’s place-while-seated no-op). Do not start coast-walk. Click unowned while seated: no-op. Place while seated: no-op.

Pad click is not Return. Pad arrows stay view-only, still only while local driver. Dock reads hangar `hangarPad`. Silo pad click is not Dock.

## Parked

Click / walk-up the floor cell of a parked vehicle. `Intent` `{ act: 'vehicle'; id }`. `dest` = `floor(x,y)` at enqueue. Arrival: still parked → `Seat.cue = { kind: 'vehicle'; id }`. Else `shiftHead`.

Parked HUD is that cue. Quad: 6 slots + Embark. Tractor: trailer cargo (if hitched) + Embark. No hitch: Embark only. Tractor has no 6-slot. `HudTarget` stays sprinkler-only. Illegal: vehicle on `HudTarget`. Driven: no this cue. Stored: no field pose to click. Trailers have no field click.

Several field vehicles on one cell: first in `World.vehicles` whose floor is that cell.

## Slots

Quad six. Any `Item`. Chest rules: `Act.swapVehicle { id, i }` swaps `seats[p].hand` with `slots[i]`, then `compactSlots`. `i: VehicleSlot`. Legal iff parked. Stored: no-op. Driven: no-op. Guests may swap. Not on the hangar HUD. Tractor: no `swapVehicle`.

`tickFreshness` on every quad slot (box cargo included) and every harvest-trailer slot. Not freezer. Not hoppers. Stored vehicles / trailers are not cells — tick `World.vehicles` quad slots and `World.trailers` harvest slots, like chest. Away does not skip them.

## Away / recap / view

Away while driving: that vehicle `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays. `World.away` does this. Recap freezes integrate (`tick` early return). Boom does not run during recap.

Hide gardener while seated is view. Sim actor pose still tracks the vehicle while driver. Hat color is view.

Camera follow is view-local, not `World`, not sim. Follows local seat actor.

Tractor paint 1×1 red. Trailer 1×1, front on `P`. Quad paint unchanged. Rake is view-only at trailer rear. Boom OBB uses that tractor `boom` × `BOOM_LONG` from pivot `P`. Rake visual matches (view).

## Cmds

```
Cmd +=
  | { a: typeof Act.drive; t; p; throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }
  | { a: typeof Act.stride; t; p; x: -1 | 0 | 1; y: -1 | 0 | 1 }
  | { a: typeof Act.buyVehicle; t; p; c: XY; k: VehicleKind }
  | { a: typeof Act.buyTrailer; t; p; c: XY; k: TrailerKind }
  | { a: typeof Act.deploy; t; p; v: VehicleId; c: XY; hitch: TrailerId | 'none' }
  | { a: typeof Act.embark; t; p; v: VehicleId }
  | { a: typeof Act.disembark; t; p }
  | { a: typeof Act.dock; t; p }
  | { a: typeof Act.swapVehicle; t; p; v: VehicleId; i: VehicleSlot }
  | { a: typeof Act.swapTrailer; t; p; u: TrailerId; i: HarvestSlot }
  | { a: typeof Act.refill; t; p; c: XY }
  | { a: typeof Act.setBoom; t; p; w: 3 | 5 }
  | { a: typeof Act.load; t; p }
  | { a: typeof Act.unload; t; p }
```

`Act.drive` `'V'`. `Act.stride` `'K'`. `Act.buyVehicle` `'Q'`. `Act.buyTrailer` `'T'`. `Act.deploy` `'D'`. `Act.embark` `'B'`. `Act.disembark` `'E'`. `Act.dock` `'P'`. `Act.swapVehicle` `'H'`. `Act.swapTrailer` `'A'`. `Act.refill` `'F'`. `Act.setBoom` `'W'`. `Act.load` `'L'`. `Act.unload` `'U'`. Latest `Act.drive` same `t` wins. Latest `Act.stride` same `t` wins. Latest `Act.setBoom` same `t` wins.

Place hangar / silos is existing place path.

Wrappers: `drive` `stride` `buyVehicle` `buyTrailer` `deploy` `embark` `disembark` `dock` `swapVehicle` `swapTrailer` `refill` `setBoom` `load` `unload`.

Not logged: integrate, follow hitch, boom, burn, stride integrate, camera follow, hide gardener, hangar select, pad arrows, pad opacity, dash faces.

Logged: `Act.disembark` `Act.dock` `Act.setBoom` `Act.load` `Act.unload` `Act.stride`. Store is not a tick.

## Save / net

`SAVE_VERSION` 1.72. `PROTOCOL` 1.72. Wordmark 1.7.2. No migrate. 1.71 file → `'version'`. Dump `vehicles` + `nextVehicleId` + `trailers` + `nextTrailerId` + hangar / silo origin cells (`occ` others). Tractor `boom`. Mill/jam/still `inn`. Chest/freezer/seed-silo/additive-store `out` `hold`. Digest includes every vehicle `id` `kind` `fuel` `pose` and quad `slots` / tractor `hitch` `boom`, every trailer `id` `kind` `pose` hopper or `slots`, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`. `Seat.drive` not in the file — load `{0,0}`. `Seat.stride` not in the file — load `{0,0}`. Restore `pose.driver`; actor at vehicle if driver.

## Guest

Full parity: hangar HUD, buy hangar / Quad / tractor / trailers, place/delete silos, refill, `swapVehicle` `swapTrailer`, embark, disembark, dock, drive, stride, `setBoom`, delete empty hangar, `load`/`unload` mill/jam/still/compost/seed-silo/additive-store. `permit` default true on the new cmds except guest chest/freezer `load`/`unload`. `GUEST_BUILD` += `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce`. Guest `swapChest` still not. Guest Unload chest no-op.

## Look

| when | look |
|---|---|
| hangar cell | **Vehicle hangar** |
| parked Quad floor | **Quad** |
| parked tractor floor | **Tractor** |
| `silo-seed` | **Seeding silo** |
| `silo-spray` | **Spraying silo** |
| `silo-produce` | **Produce silo** |

Silo: look name only. No prompt act. No dialog.

Assumption: `Act.setBoom` `'W'`; `Act.stride` `'K'`; latest same-`t` `Act.stride` wins like drive; attached `TrailerPose` carries `heading` (non-rigid hitch); `Act.swapTrailer` JSON `u` is TrailerId (`Cmd.t` is time); growing `m > 0.8` boom fruit `unitSale = stats.sale`.
