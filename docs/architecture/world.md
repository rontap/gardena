# World

Types as they run. Illegal states are unrepresentable. Coders do not runtime-check these.

Owners: [[architecture/modules]]. Ids: `sim/ids.ts` (`RouteId`, `VehicleId`, `SensorKind`). Cells / items: `sim/plot.ts` `sim/item.ts` `sim/building.ts`. Routes: `sim/vehicle.ts`. Light: `sim/sensor.ts`.

## Unrepresentable

`Plant.crop` is `AnnualId`. `Tree.species` is `TreeId`. `seeds.crop` is `AnnualId`. Illegal: `'berry'`. Illegal: whisky. Illegal: `sugar.count`.

`isPlot` / `isSolid` split the `Cell` union. A pipe, sprinkler, wire, or smart valve is not a `Cell`. Sensor cells sunk; vehicles `SURFACE_SLOW`.

Illegal: `Shrub`. Illegal: `AppleTree`.

`House`, starter pump (`form: 'starter'`), `Truck` are not delete targets.

`Pump.water` and `RainTank.water` are required `Reservoir`. `Tap` has no reservoir; it draws from `Net`.

## Same instance

Multi-cell buildings store **the same instance** in every occupied cell: `House`, starter `Pump`, pumpjack, `RainTank`, `Truck`, `Tree`, `Hangar`, `SiloSeed`, `SiloSpray`, `SiloProduce`, `PotStill`, `SeedSilo`, `AdditiveStore`. Interact on any occupied cell; it is one object. [[architecture/tree]] for the 1×2 tree. Hangar `HANGAR_W × HANGAR_H`. Vehicle silos `SILO_W × SILO_H`. Still 2×1, prop `48×24` occupying both cells. House seed silo / additive-store 1×2.

`World.pumps` / `World.tanks` / `World.taps` / `World.stills` / `World.waterSystems` hold those same instances for the water grid. Still 2×1 and water-system join like tap (any corner). `World.hangars` / field silos / `World.vehicles` / `World.trailers` / `World.routes` — [[mechanics/vehicles]]. `World.silo` / `World.additives` starter stores. `World.wires` — [[mechanics/sensors]].

Mill/jam/still `inn` no hold. Chest/freezer/seed-silo/additive-store `out` + `SENSOR_HOLD`. Compost-box: pads, no port. Grinder hopper, no pads, no `inn`. West chest/freezer pull and east push are adjacency, not cells. Rules: [[mechanics/machines]] [[mechanics/sensors]] [[mechanics/inventory]].

Still `base.w = 2` `base.h = 1` and prop `48×24` occupying both cells.

## Seats

`World.seats: Seat[]`. Length 1..4. Index 0 is always the host / solo player. Each `inventory` length 16.

`App.local: SeatId` is who this page is. Solo and tests: one in-seat, `local === 0`.

`apply(cmd)` mutates `seats[cmd.p]`. `tick` walks every `presence === 'in'` seat. Away: skip that actor walk/work/stride and that seat hand/inventory freshness. Seat stays in `seats`. Freezer slots skip `tickFreshness`. [[mechanics/multiplayer]]

Assumption: walk/work transients (`workLeft`, `workTotal`, `filling`, `legStart`) live on the seat, not `World`.

## Plot

`soil` is required on every tilled arm. A tilled plot without dirt cannot be written. `untilled` and `infertile` have no `soil` field. `Soil.weedChance: number` required. `Weed.spread: boolean` required, starts `false`.

Illegal: optional `plant` on `growing` / `ripe` / `dead`. Illegal: `Plant` on `rotten` — `crop: CropId` only. Illegal: grass as a nullable index; it is a `Cover` arm. Illegal: `untilled` without `ground` and `cover`.

`Plant.tended: boolean` required, starts `false`, same instance through ripe / dead. [[architecture/family]].

## Place

`Seat.place` is always a `Place`. No `World.place`. Place is per-seat. `armWire` sets `{ kind: 'wire'; from }`. `buy` never arms wire.

Illegal: `facing` on any id other than `buy-sprinkler-vert`. Illegal: delete as a `SkuId`. Packs never arm — `buy` merges seeds into inventory.

Confirm: cell buildings and item drops set `none` except StayArmed sensor cells (incl. pulser, counter, day, traffic-light). Pipe, valve, smart valve, sprinkler, tile, sensor cells, and delete do not.

## Intent

`plant` is seeds (`AnnualId`) or sapling (`TreeId`). Same act. [[architecture/tree]].

`dest(consign) = PAD`. `dest(inventory) = DOOR`. `dest(vehicle)` / `dest(embark)` = floor of that vehicle at enqueue. `dest(toggle) = at`. Else `at`.

Truck cells enqueue `{ act: 'consign' }`. Yard cells are plots.

## Stall

`World.stall` is a complete map. Illegal: seeds on the stall. Illegal: a missing good. Illegal: `'berry'`. Sugar-cane fruit is a stall good. Illegal: whisky.

Saleswoman `(1 + 0.02 × tier)` on every `StallGoodId`. Őstermelő `(1 + 0.05 × tier)` on `rarity === 'heirloom'` of crop fruit, spirit, wine. Not sugar / jam / oil / flour / extract. [[architecture/family]].

Crop goods: stock and worth per rarity × `bio`. Illegal: fruit consign that drops `fruit.bio`.

`World.contracts: Contracts`. Live only. Load empty. New farm empty. Consign fills `active` in array order, then stall. Miss on the tick `nowDay` crosses `dueDay`. [[mechanics/contracts]]

## Hand / Item

No `Item | null`. Chest slots and inventory slots are `Slot[]`. Fruit and grind input stay `CropId`. Sugar-cane harvests as fruit. Illegal: `sugar.count`. Illegal: whisky. Jam has no rarity. Wine age baked into `unitSale`. Illegal: `{ kind: 'apple-tree' }` `{ kind: 'berry' }` `{ kind: 'shrub' }`. Illegal: `weed-spray.usesLeft` 0 as held. Illegal: `{ kind: 'box' }`. Not sugar liters. Not spirit / wine / jam / oil / flour / extract.

## Recap / Seam

Illegal: `recipient?: MemberId` on `Recap`. Play frozen while `kind === 'recap'`. Only exit: `dismissRecap()` — grants `POINTS_PER_DAY` to `World.points`, then play. Seam copies `tally.contracts` into `Recap.contracts`, then tally resets. Recap shows those outcomes and that a new board is up. [[architecture/family]] [[mechanics/contracts]].

## Family

`World.family: Family` always. Offers, owned, pickCount per member. Shared `World.points`. [[architecture/family]].

`offers` length 0..3. `buyPacks` always legal: five seed packs at `5 × skuPrice × 0.95`. `unlockAll` still every research done, `money += 999`, job idle, and `World.points = 99`. `cheatFastResearch` multiplies job drain by 3. `cheatMoney` `+200`. `cheatPoints` `+10` to the shared bank.

## Time

Tick law: [[architecture/tick]].

`World.now: number` — integer count of `tick()` entries. Starts 0. Increments by 1 at every `tick()` entry, including recap return.

`Cmd.t` is `now` after last completed tick, before apply. `Cmd.p` is `SeatId`. Solo and tests: `p = 0`. [[architecture/log]]

Live: App accumulator fires `tick(DT_MAX)` only, at most two ticks per frame. Never a leftover. View paints every rAF. No sim interpolation. Do not raise `DT_MAX`. Do not move `World` to a worker. Solo and MP. Tests replay with `dt = DT_MAX`. MP: one `tick(DT_MAX)` per host bundle. [[architecture/net]]

### Indexes

Maps on `World`, same `Coord` values as `live`. Origin-only for multi-cell. `track()` from `setCell`. `indexAll` on hydrate / rebase. No `sim/index.ts`. `live` is not a tick walk.

| name | members |
|---|---|
| grow | growing, ripe, weed, turf, tree origin |
| machines | mill, jam, still, barrel, grinder, compost origin |
| stores | chest, freezer |
| sensors | sunk sensor cells |
| buttons | button cells |
| recover | tilled with `weedChance < WEED_CHANCE` |
| empty | empty plots |

`tickField` grow+recover. `tickMachines` / `tickCompost` machines. `tickFreshness` stores (+ seats / drops / vehicles, not grow). `tickButtons` buttons. `evalSensors` sensors+machines+stores. `sproutWeeds` empty. `padBuildings` machines+stores (+ World `silo` / `additives` / `seedSilos`).

`forEachCell` is forbidden on the tick path. Iterate maps directly. No live-array copy. Marks walks these plus `segments` / `sprinklers` / `fences`; not `forEachCell`.

## Log

`World.log: Cmd[]` is source of truth. In-process. Worker is an async JSON sink. It does not apply cmds. It does not own `World`. Vitest never uses a Worker.

```
dispatch(cmd): log then apply
apply(cmd): mutate seats[cmd.p] and shared farm. No log.
```

No silent flag. Replay calls `apply` only.

`ping()` coalesces: marks dirty reasons (`'act' | 'field' | 'big' | 'speech' | 'vfx'`) and flushes subscribers once per microtask with the reason set. From tick only on discrete change. Continuous chrome is `paintMotion` or CSS. No every-tick counter HUD `this.ping()`. Juvenile growth does not ping `'field'`. [[mechanics/trees]] `poured` / `sold` emit synchronously. `flushDirty()` forces a flush. FPS readout: [[ui/hud]]. Not a `DirtyReason`.

Ping consumption: `speech` off React; `vfx` not Hud; `field` / `big` Marks not whole chrome; `act` Hud+Marks. A new `DirtyReason` must have a view that filters it. Unused reason is a defect. [[architecture/tick]]

Public UI methods wrap `dispatch`. `enqueue` is a mutator (tests); UI field acts go through `click` / `clickValve`. `confirmPlace` is inside `click` — not a cmd. Map `rightClick` is a cmd.

`Seat.place` / `World.hud` / `Seat.cue` are game and are logged via the mutators that set them. Panel / camera / hover / lens / hangar select / camera follow / Dash Automate / editor open are not. Camera follow is view-local, not `World`, not sim.

Cheats are cmds.

Cmd table: [[architecture/log]]. Do not restate it here.

Vehicles unrepresentable: two drivers on one vehicle, two vehicles driving the same seat, seated + walk/work queue, stored + driver, stored + running, seated + running, running with no route, running with 0 stops, cursor out of range, goto without XY, load/unload without pad coord, wait without a light cell, quad hitch, quad boom, boom other than `3 | 5`, two trailers on one tractor, trailer attached + stored. Cycle wire. Two direct paths same `nodeKey(from)` → `nodeKey(to)`. Wire into an output. Analogue signal. Still rotate / 1×1. Still prop not occupying both cells. Mill/jam/still `inn` hold. Pad as a `Cell`. AND/OR/NOT buyable on `unlock-sensors` alone. Traffic-light `inn` combinationally driving `out`.

`World.routes: Route[]`. `World.nextRouteId` starts 1. Vehicle holds `route: RouteId | 'none'`, `cursor`, `running`. `RouteStop` is a closed union. Rules: [[mechanics/vehicles]] `vehicles.dispatch`.

## Rng

`World.rng: Rng`. `World.seed` is `rng.seed`. `Math.random` only when seed is omitted.

`World.ripenN: Map<string, number>` keyed `col,row` — per-cell ripen count `n` for grow rarity. Not a `Soil` field. Absent = 0. [[architecture/rng]]

Illegal: spatial roll without identity ints. Grow identity `(col, row, day)` without `n`. `clock.t` or `money` as entropy.

## Modifier

`Modifier.source = 'research' | 'fertilizer' | 'skill'`. Skill crop sale (`better-*`) is `source: 'skill'`.

`World.modGen` increments when `modifiers` change. Cache `statsOf(crop, rarity)` for that generation. Plants do not re-filter modifiers every tick.
