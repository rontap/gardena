# World

Types as they run. Illegal states are unrepresentable. Coders do not runtime-check these.

Owners: [[architecture/modules]]. Ids: `sim/ids.ts` (`RouteId`, `VehicleId`, `SensorKind`, `VarietyId`). Cells / items: `sim/plot.ts` `sim/item.ts` `sim/building.ts`. Routes: `sim/vehicle.ts`. Light: `sim/sensor.ts`.

## Unrepresentable

`Plant.crop` is `AnnualId`. `Tree.species` is `TreeId`. `seeds.crop` is `AnnualId`. `Plant.variety` `Tree.variety` required `VarietyId`. `quality` required on `Plant`, seeds, fruit, graft, spirit, cask, jam, oil, flour, extract, sugar. Fruit `cut: boolean` required.

```
AnnualId     = carrot | potato | wheat | tomato | raspberry | grape | vanilla | sugar-cane
TreeId       = apple | apricot | olive | cherry
CropId       = AnnualId | TreeId
BetterCrop   = potato | wheat | tomato | raspberry | grape | apple | apricot | olive | cherry
MillRecipe   = sugar-cane | olive | wheat | grass | vanilla
JamCrop      = apricot | grape | raspberry | cherry | tomato
BarrelCrop   = grape | apple
CaskId       = wine | cider
FruitAnnualId = tomato | raspberry | grape | vanilla
VarietyTier  = base | variant | heirloom
VarietyId    = base | bintje | red-fife | green-zebra | san-marzano | black-raspberry
             | concord | keknyelu | kingston-black | pink-lady | blenheim | klosterneuburger
             | arbequina | bing
```

`ResearchId` has no `unlock-watermelon`. `SkuId` has no `pack-watermelon`. `SkuId` += `buy-research-station`. `PlayerSkillId` has no `better-watermelon` `better-carrot` `better-vanilla` `better-sugar-cane`. `BETTER_IDS` is a complete `{ [K in BetterCrop]: PlayerSkillId }`.

Illegal: olive as `AnnualId`. Illegal: apple as `JamCrop`. Illegal: `'berry'`. Illegal: whisky. Illegal: `sugar.count`. Illegal: optional `variety`. Illegal: optional `quality`. Illegal: optional `cut`. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's `crop`. Illegal: `World.pause`. `World.cheatFastResearch` is boolean. `World.cheatSpeed` is `1 | 3`. `WeatherKind` is `'clear' | 'rain' | 'dry' | 'flood' | 'drought'`.

`isPlot` / `isSolid` split the `Cell` union. A pipe, sprinkler, wire, or valve is not a `Cell`. Sensor cells sunk; vehicles `SURFACE_SLOW`.

Illegal: `Shrub`. Illegal: `AppleTree`.

`House`, starter pump (`form: 'starter'`), `Truck` are not delete targets.

`Pump.water` and `RainTank.water` are required `Reservoir`. `Tap` has no reservoir; it draws from `Net`. `Reservoir.rate` is `SOURCE[kind].rate` × weather mul. `World.pumpLiters` counts pump-kind `take()`.

## Same instance

Multi-cell buildings store **the same instance** in every occupied cell: `House`, starter `Pump`, pumpjack, `RainTank`, `Truck`, `Tree`, `Hangar`, `SiloSeed`, `SiloSpray`, `SiloProduce`, `PotStill`, `SeedSilo`, `AdditiveStore`. Interact on any occupied cell; it is one object. [[architecture/tree]] for the 1×2 tree. Hangar `HANGAR_W × HANGAR_H`. Vehicle silos `SILO_W × SILO_H`. Still 2×1, prop `48×24` occupying both cells. House seed silo / additive-store 1×2. Station 1×1.

`World.pumps` / `World.tanks` / `World.taps` / `World.stills` / `World.waterSystems` hold those same instances for the water grid. Still 2×1 and water-system join like tap (any corner). `World.hangars` / field silos / `World.vehicles` / `World.trailers` / `World.routes` — [[mechanics/vehicles]]. `World.silo` / `World.additives` starter stores. `World.wires` — [[mechanics/sensors]].

Mill/jam/still/station `inn` no hold. Chest/freezer/seed-silo/additive-store `out` + `SENSOR_HOLD`. Compost-box: pads, no port. Grinder hopper, no pads, no `inn`. West chest/freezer pull and east push are adjacency, not cells. Rules: [[mechanics/machines]] [[mechanics/sensors]] [[mechanics/inventory]].

Still `base.w = 2` `base.h = 1` and prop `48×24` occupying both cells.

## Seats

`World.seats: Seat[]`. Length 1..4. Index 0 is always the host / solo player. Each `inventory` length 16.

`App.local: SeatId` is who this page is. Solo and tests: one in-seat, `local === 0`.

`apply(cmd)` mutates `seats[cmd.p]`. `tick` walks every `presence === 'in'` seat. Away: skip that actor walk/work/stride and that seat hand/inventory freshness. Seat stays in `seats`. Freezer slots rot at `FREEZER_ROT_MUL`. [[mechanics/multiplayer]] [[mechanics/machines]]

Assumption: walk/work transients (`workLeft`, `workTotal`, `filling`, `legStart`) live on the seat, not `World`.

## Plot

`soil` is required on every tilled arm. A tilled plot without dirt cannot be written. `untilled` and `infertile` have no `soil` field. `Soil.weedChance: number` required. `Weed.spread: boolean` required, starts `false`.

Illegal: optional `plant` on `growing` / `ripe` / `dead`. Illegal: `Plant` on `rotten` — `crop: CropId` only. Illegal: grass as a nullable index; it is a `Cover` arm. Illegal: `untilled` without `ground` and `cover`.

`Plant.tended: boolean` required, starts `false`, same instance through ripe / dead. `Plant.variety` `Plant.quality` required. `Tree.tended: boolean` required, starts `false`. `Tree.variety` required. [[architecture/family]] [[architecture/tree]].

## Place

`Seat.place` is always a `Place`. No `World.place`. Place is per-seat. `armWire` sets `{ kind: 'wire'; from }`. `buy` never arms wire.

Illegal: `facing` on any id other than `buy-sprinkler-vert`. Illegal: delete as a `SkuId`. Packs never arm — `buy` merges seeds into the silo as `'base'` quality 0.

Confirm: cell buildings and item drops set `none` except StayArmed sensor cells (incl. pulser, counter, day, traffic-light). Pipe, valve, sprinkler, tile, sensor cells, and delete do not.

## Intent

`plant` is seeds (`AnnualId`) or tree seed (`TreeId`). Same act. Tree seed anchors on the clicked cell as the lower half. [[architecture/tree]].

`graft` is `{ act: 'graft'; at: Coord }`. `dest` = `at`. Hold a graft. Never plants.

`dest(consign) = PAD`. `dest(inventory) = DOOR`. `dest(vehicle)` / `dest(embark)` = floor of that vehicle at enqueue. `dest(toggle) = at`. `dest(hangar | silo | still | fill)` = origin of that instance (`base.col`, `base.row`; a leftover circle dump: its occupied cell), not the interior cell clicked. `dest(station)` = `at`. Intent `at` may still be the clicked occupied cell (same instance). Else `at`.

No `World.pulse`. No `Pulse` type. Last-action highlight gone. Not a cmd. Not Save. `say` / `grantPoint` stay.

Truck cells enqueue `{ act: 'consign' }`. Yard cells are plots.

## Stall

`World.stall` is a complete map. Illegal: seeds on the stall. Illegal: a missing good. Illegal: `'berry'`. Sugar-cane fruit is a stall good. Illegal: whisky. `JamId` is `jam-${JamCrop}`. One `extract`. Olive fruit is a stall good (`TreeId`). `{ kind: 'rotten' }` is not a `StallGoodId`. Assumption: consigned rotten is `World.clearance: number`.

Saleswoman `(1 + 0.02 × tier)` on every `StallGoodId`. Őstermelő `(1 + 0.05 × tier)` on variety tier `heirloom` of crop fruit, spirit, wine. Not sugar / jam / oil / flour / extract. [[architecture/family]].

Crop goods: stock and worth per variety × `bio`. Illegal: fruit consign that drops `fruit.bio`.

`World.contracts: Contracts`. Dump persists `active` with fills, `takenToday`, `history`, `book`, plus `rep` / `repDay`. Board is not in the file. New farm empty. Consign fills `active` in array order, then stall. Miss on the tick `nowDay` crosses `dueDay`. [[mechanics/contracts]] [[architecture/save]]

## Hand / Item

No `Item | null`. Chest slots and inventory slots are `Slot[]`. Fruit and grind input stay `CropId`. Sugar-cane harvests as fruit. Illegal: `sugar.count`. Illegal: whisky. Wine age baked into `unitSale`. Illegal: `{ kind: 'apple-tree' }` `{ kind: 'berry' }` `{ kind: 'shrub' }`. `{ kind: 'weed-spray'; liters; capacityLiters }`. Illegal: `liters` 0 as held. No `usesLeft` field. Illegal: fruit with `freshness <= 0` after `tickFreshness`. Illegal: `{ kind: 'box' }`. Not sugar liters. Not spirit / wine / jam / oil / flour / extract. `{ kind: 'graft'; crop; variety; quality; count }`. Fruit `cut: boolean` required.

```
Spirit =
  | { kind: 'spirit'; spirit: Exclude<SpiritKind, 'mixed'>; variety: VarietyId; quality: number; count: number; unitSale: number }
  | { kind: 'spirit'; spirit: 'mixed'; quality: number; count: number; unitSale: number }
```

## Recap / Seam

Illegal: `recipient?: MemberId` on `Recap`. `Recap.water` required (pump bill). Play frozen while `kind === 'recap'`. Only exit: `dismissRecap()` — grants `POINTS_PER_DAY` to `World.points`, then play. Seam bills pump then copies `tally.contracts` into `Recap.contracts`, then tally resets. Recap shows those outcomes and that a new board is up. [[architecture/family]] [[mechanics/contracts]] [[mechanics/weather]].

## Family

`World.family: Family` always. Offers, owned, pickCount per member. Shared `World.points`. [[architecture/family]].

`offers` length 0..3. `buyPacks` always legal: five seed packs at `5 × skuPrice × 0.95`, `'base'` quality 0. `unlockAll` still every research done, `money += 999`, job idle, and `World.points = 99`. Does not grant skills. `unlockAllSkills` grants every `SKILLS` id at `maxTier` including `haggling`, ignores gates, rebuilds modifiers, empties offers. `cheatFastResearch` multiplies job drain by 3 on top of Speedy research. `cheatMoney` `+200`. `cheatPoints` `+10` to the shared bank. End day sets `clock.t = DAY_SECONDS`.

```
World.cheatFastResearch = boolean
World.cheatSpeed         = 1 | 3
```

`cheatFastResearch` starts false. Not Save. Toggle `Act.cheat` `{ k: 'research' }`.
`cheatSpeed` starts 1. Not Save. `Act.cheat` `{ k: 'speed'; n: 1 | 3 }`.

## Time

Tick law: [[architecture/tick]].

`World.now: number` — integer count of `tick()` entries. Starts 0. Increments by 1 at every `tick()` entry, including recap return.

`Cmd.t` is `now` after last completed tick, before apply. `Cmd.p` is `SeatId`. Solo and tests: `p = 0`. [[architecture/log]]

Live: App host accumulator `frameDt * World.cheatSpeed`, then `tick(DT_MAX)` only, at most two ticks per frame. Never a leftover. World.tick does not multiply `dt`. View paints via the Pixi ticker. No sim interpolation. View vehicles keep `QUAD_FOLLOW`. Do not raise `DT_MAX`. Do not move `World` to a worker. Solo and MP. Tests replay with `dt = DT_MAX`. MP: one `tick(DT_MAX)` per host bundle. [[architecture/net]] [[architecture/view]] [[architecture/tick]]

### Indexes

Maps on `World`, same `Coord` values as `live`. Origin-only for multi-cell. `track()` from `setCell`. `indexAll` on hydrate / rebase. No `sim/index.ts`. `live` is not a tick walk.

| name | members |
|---|---|
| grow | growing, ripe, weed, turf, tree origin |
| machines | mill, jam, still, barrel, grinder, compost, furnace, station origin |
| stores | chest, freezer |
| sensors | sunk sensor cells |
| buttons | button cells |
| recover | tilled with `weedChance < WEED_CHANCE` |
| empty | empty plots |
| tilled | `isTilled` |

`tickField` grow+recover. `tickMachines` / `tickCompost` machines. `tickFreshness` stores (+ seats / drops / vehicles, not grow). `tickButtons` buttons. `evalSensors` sensors+machines+stores. `sproutWeeds` empty. Weather soak `tickBig` walks tilled. `padBuildings` machines+stores (+ World `silo` / `additives` / `seedSilos`).

`forEachCell` is forbidden on the tick path. Iterate maps directly. No live-array copy. View dirty walks these plus `segments` / `sprinklers` / `fences`; not `forEachCell`. [[architecture/view]] `view.scan`.

## Log

`World.log: Cmd[]` is source of truth. In-process. Worker is an async JSON sink. It does not apply cmds. It does not own `World`. Vitest never uses a Worker.

```
dispatch(cmd): log then apply
apply(cmd): mutate seats[cmd.p] and shared farm. No log.
```

No silent flag. Replay calls `apply` only.

`ping()` coalesces: marks dirty reasons (`'act' | 'field' | 'big' | 'speech' | 'vfx'`) and flushes subscribers once per microtask with the reason set. From tick only on discrete change. Continuous world chrome is the Pixi ticker. Continuous HUD chrome is `paintMotion`. No every-tick counter HUD `this.ping()`. Juvenile growth does not ping `'field'`. [[mechanics/trees]] `poured` / `sold` emit synchronously. `flushDirty()` forces a flush. FPS readout: [[ui/hud]]. Not a `DirtyReason`.

Ping consumption: `speech` HTML bind + ticker pose; `vfx` not Hud; `field` / `big` world-view patch not whole chrome; `act` Hud + patch. A new `DirtyReason` must have a view that filters it. Unused reason is a defect. [[architecture/tick]] [[architecture/view]]

Public UI methods wrap `dispatch`. `enqueue` is a mutator (tests); UI field acts go through `click` / `clickValve`. `confirmPlace` is inside `click` — not a cmd. Map `rightClick` is a cmd.

`Seat.place` / `World.hud` / `Seat.cue` are game and are logged via the mutators that set them. Panel / camera / hover / lens / hangar select / camera follow / Dash Automate / editor open are not. Camera follow is view-local, not `World`, not sim.

Cheats are cmds.

Cmd table: [[architecture/log]]. Do not restate it here.

Vehicles unrepresentable: two drivers on one vehicle, two vehicles driving the same seat, seated + walk/work queue, stored + driver, stored + running, seated + running, running with no route, running with 0 stops, cursor out of range, goto without XY, load/unload without pad coord, wait without a light cell, quad hitch, quad boom, boom other than `3 | 5`, two trailers on one tractor, trailer attached + stored. Cycle wire. Two direct paths same `nodeKey(from)` → `nodeKey(to)`. Wire into an output. Analogue signal. Still rotate / 1×1. Still prop not occupying both cells. Mill/jam/still/station `inn` hold. Pad as a `Cell`. AND/OR/NOT buyable on `unlock-sensors` alone. Traffic-light `inn` combinationally driving `out`.

`World.routes: Route[]`. `World.nextRouteId` starts 1. Vehicle holds `route: RouteId | 'none'`, `cursor`, `running`. `RouteStop` is a closed union. Rules: [[mechanics/vehicles]] `vehicles.dispatch`.

## Rng

`World.rng: Rng`. `World.seed` is `rng.seed`. `Math.random` only when seed is omitted.

No `World.ripenN`. No grow stream. [[architecture/rng]]

Illegal: spatial roll without identity ints. Weather identity `at(day, k)` only. `clock.t` or `money` as entropy.

## Weather

`WeatherKind` on `sim/weather.ts`. Table from `forecastWeather(seed, throughDay, pins?)`. `World.weather(day)` indexes it. Current = `weather(clock.day)`. `World.pumpLiters` 0 at init, load, and after the seam bill. Pins: `Map<day, WeatherKind>`, not Save, not `Cmd`, host only. [[mechanics/weather]]

## Modifier

`Modifier.source = 'research' | 'fertilizer' | 'skill'`. Skill crop sale (`better-*`) is `source: 'skill'`.

`World.modGen` increments when `modifiers` change. Cache `statsOf(crop, variety)` for that generation. `qualityMul` applies at sale, not in the cache key. Plants do not re-filter modifiers every tick.

## Invariants

`world.dest` — `dest(hangar | silo | still | fill)` is the origin of that instance, not the interior cell clicked. `dest(inventory)` is `DOOR`. `dest(consign)` is `PAD`. `dest(station)` is `at`.

`world.pulse` — `World` has no `pulse` field. Last-action highlight gone. Not a cmd. Not Save.

`world.pause` — World has no `pause` field. Solo family / market / almanac overlay pause is App-local. MP pause is the net flag on `MpHost` / `MpGuest`. Not Save. Not a `Cmd`.

`world.cheatSpeed` — `World.cheatSpeed` is `1 | 3`. App host accumulator `frameDt * cheatSpeed`. World.tick does not multiply `dt`. `Act.cheat` `{ k: 'speed'; n: 1 | 3 }`. `?speed=3` boots 3; any other URL value boots 1. Not job drain.

`world.cheatFastResearch` — `World.cheatFastResearch` is boolean. Starts false. Not Save. Toggle `Act.cheat` `{ k: 'research' }`. On: job drain `× 3` on top of Speedy research. Off: Speedy research only. Not `cheatSpeed`.

Assumption: `dest(additives)` stays `at`.
