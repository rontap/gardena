# World

Types as they run. Illegal states are unrepresentable. Coders do not runtime-check these.

Owners: [[architecture/modules]]. Ids: `sim/ids.ts`. Cells / items: `sim/plot.ts` `sim/item.ts` `sim/building.ts`. Tick: [[architecture/tick]]. Log: [[architecture/log]].

## Unrepresentable

`Plant.crop` excludes grass. `Tree.species` is `TreeId`. `seeds.crop` is `AnnualId`. `variety` and `quality` required on plant, seeds, fruit, graft, spirit, cask, jam, oil, flour, extract, sugar, flakes, vanilla-extract, bread. Fruit `cut` required. `infused` required on jam, cask, spirit, oil.

Illegal: olive as `AnnualId`. Illegal: `Plant.crop` `'grass'`. Illegal: `{ kind: 'grass-seeds' }`. Illegal: grass fruit. Illegal: apple as `JamCrop`. Illegal: `'berry'`. Illegal: whisky. Illegal: `sugar.count`. Illegal: optional `variety`, `quality`, `cut`, `infused`. Illegal: `Soil.bio`. Illegal: fruit `bio`. Illegal: flakes or vanilla-extract as `StallGoodId`. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's `crop`. Illegal: `World.pause`. `World.cheatFastResearch` is boolean. `World.cheatSpeed` is `1 | 3`.

`isPlot` / `isSolid` split the `Cell` union. A pipe, sprinkler, wire, or valve is not a `Cell`. Sensor cells sunk; vehicles `SURFACE_SLOW`.

Illegal: `Shrub`. Illegal: `AppleTree`.

`House`, starter pump (`form: 'starter'`), `Truck` are not delete targets.

`Pump.water` is a required `Reservoir`. Starter pump and bought pumpjack are one `SOURCE.pump`. `Pump.ports = ['in']`. `Pump.inn: Signal`. Combinational, no hold, not saved. `inn === 1` → `gatherWater` skips that reservoir. Unwired 0 gathers. Stored still fills a bucket and still feeds the water network. Origin cell owns the port; Pumpjack east cell does not. Starter is wireable. `Tap` has no reservoir; it draws from `Net`.

## Same instance

Multi-cell buildings store **the same instance** in every occupied cell. Interact on any occupied cell; it is one object. Hangar door south, no rotate. Still 2×1. Mill / Infuser 2×2. House seed silo / additive-store 1×2. Station 1×1. Furnace 1×2. [[architecture/tree]] for the 1×2 tree.

`World.pumps` / `wells` / `taps` / `stills` / `waterSystems` hold those same instances for the water grid. Host live order is purchase order until `rebase()` sorts by `originCell` row then col — [[architecture/net]] `net.order`. `World.pump` and `generateChunk`'s starter argument find `form === 'starter'`; sort must not be required to keep index 0.

Mill/jam/still/station/infuser/pump `inn` no hold. Chest/freezer/seed-silo/additive-store `out` + `SENSOR_HOLD`. Compost-box: pads, no port. Grinder hopper, no pads, no `inn`. West chest/freezer pull and east push are adjacency, not cells. Mill, Infuser, Furnace: south row. Jam, still, station: origin row. Rules: [[mechanics/machines]] [[mechanics/infusion]] [[mechanics/sensors]] [[mechanics/inventory]].

`SiloStack` is `{ crop: AnnualId; variety; quality; count }`. `'grass'` is a legal `crop`. No `SeedStore.grass`.

## Seats

`World.seats: Seat[]`. Length 1..4. Index 0 is always the host / solo player. Each `inventory` length 16. `App.local: SeatId` is who this page is. Solo and tests: one in-seat, `local === 0`. `apply(cmd)` mutates `seats[cmd.p]`. `tick` walks every `presence === 'in'` seat. Away: skip that actor walk/work/stride and that seat hand/inventory freshness. Seat stays in `seats`. Walk/work transients live on the seat, not `World`. [[mechanics/multiplayer]]

## Plot

`soil` is required on every tilled arm. `untilled` and `infertile` have no `soil` field. `Soil.weedChance` required. `Weed.spread` required, starts `false`.

Illegal: optional `plant` on `growing` / `ripe` / `dead`. Illegal: `Plant` on `rotten` — `crop` only. Illegal: grass as a nullable index; it is a `Cover` arm. Illegal: `untilled` without `ground` and `cover`.

Cover is `bare` | `grass` (variant 0|1|2) | `tile` | `burrow` (loot required). Burrow is untilled cover, not a `Cell` kind. Not solid. Walk ok. [[mechanics/burrow]]

`Plant.tended` required, starts `false`, same instance through ripe / dead. `Tree.tended` required, starts `false`. `Tree.variety` required.

## Place

`Seat.place` is always a `Place`. No `World.place`. Place is per-seat. `armWire` sets `{ kind: 'wire'; from }`. `buy` never arms wire.

Illegal: `facing` on any id other than `buy-sprinkler-vert`. Illegal: delete as a `SkuId`. Packs never arm — `pack-*` merge into the silo as `'base'` quality 0.

Confirm: cell buildings and item drops set `none` except StayArmed (pipe, valve, sprinkler, tile, sensor cells, delete). Pattern: [[ui/place]].

## Intent

`plant` is seeds (`AnnualId`) or tree seed (`TreeId`). Same act. `crop === 'grass'` writes turf, not a `Plant`. Tree seed anchors on the clicked cell as the lower half.

`graft` is `{ act: 'graft'; at }`. Hold a graft. Never plants.

`dest(consign) = PAD`. `dest(inventory) = DOOR`. `dest(vehicle)` / `dest(embark)` = floor of that vehicle at enqueue. `dest(toggle) = at`. `dest(hangar | silo | still | fill)` = origin of that instance. Fill origin is that pump / tap / well. `dest(station | infuser | open | additives)` = `at`. `{ act: 'open'; at }`. `{ act: 'infuse'; at }`. Enqueue, no new `Act` letter. Work 0.

`QUEUE_CAP` — preference. `enqueueOn` past that length is a no-op and `say(prompt_queue_full)`. Not Save.

No `World.pulse`. No `Pulse` type. Last-action highlight gone. Not a cmd. Not Save.

Truck cells enqueue `{ act: 'consign' }`. Yard cells are plots.

## Stall

`World.stall` is a complete map. Illegal: seeds on the stall. Illegal: a missing good. Illegal: `'berry'`. Illegal: grass fruit. Illegal: whisky. Illegal: flakes or vanilla-extract as `StallGoodId`. Sugar-cane fruit, chilli fruit, bread, olive fruit are stall goods. `{ kind: 'rotten' }` is not a `StallGoodId`. Consigned rotten is `World.clearance: number`.

Saleswoman `(1 + 0.02 × tier)` on every `StallGoodId`. Őstermelő `(1 + 0.05 × tier)` on variety tier `heirloom` of crop fruit, spirit, wine. Not sugar / jam / oil / flour / extract / bread. Infused jam / cask / spirit / oil: stock per `InfusedKey`. Crop goods: stock and worth per variety. Infusable goods: stock and worth per variety × `InfusedKey`. Rotten stock is `World.clearance: number`. [[architecture/family]] [[mechanics/infusion]]

`World.contracts: Contracts`. Dump persists `active` with fills, `takenToday`, `history`, `book`, plus `rep` / `repDay`. Board is not in the file. [[mechanics/contracts]]

## Hand / Item

No `Item | null`. Chest slots and inventory slots are `Slot[]`. Illegal: `sugar.count`. Illegal: whisky. Illegal: `{ kind: 'apple-tree' }` `{ kind: 'berry' }` `{ kind: 'shrub' }` `{ kind: 'box' }`. Illegal: `liters` 0 as held. Illegal: fruit with `freshness <= 0` after `tickFreshness`. Illegal: `treasure.count`. Illegal: `unitSale` on flakes or vanilla-extract. Fruit `cut` required. `weed-spray` is `liters`+`capacityLiters`. Chop legal hand is axe or chainsaw (`usesLeft`, `workSeconds`). No `id` on either. Illegal: `{ kind: 'better-axe' }`. Mixed spirit has no `variety` field. Optional `infused` on jam, cask, spirit, oil is illegal.

## Recap / Seam

Live `World.seam` is always `{ kind: 'play' }`. Dump `Seam` is always `{ kind: 'play' }`. Illegal: live `seam.kind === 'recap'`. Illegal: `recipient` on `Recap`. `Recap.water` required.

`World.recaps: Recap[]` — one per ended day; `Recap.day` is the key. `World.recapUnseen: number[]`. `World.recapAt(day)` — total; missing day throws. `World.seeRecap(day)` removes `day` from `recapUnseen`; no-op if absent. Not a `Cmd`.

`Act.dismissRecap` / `dismissRecapBody`: no-op. Log letter unchanged.

Seam, before any field tick of the new day: `stipendOf(endedDay)`, tax, pump bill, burrow mint, tree seam, append `Recap`, push that day onto `recapUnseen`, `grantPoints(POINTS_PER_DAY)`, `clock.banner = 4`, `seam` stays play. Recap popup is App `recapDay`, not `World.seam`. [[mechanics/day]]

## Family

`World.family: Family` always. Shared `World.points`. Luck is `min(LUCK_CAP, skillTier('lucky'))`. Not a World field. Illegal: `World.luck`. [[architecture/family]]

`offers` length 0..3. `unlockAll` still every research done, `money += 999`, job idle, and `World.points = 99`. Does not grant skills. `unlockAllSkills` grants every `SKILLS` id at `maxTier`, ignores gates, rebuilds modifiers, empties offers. `cheatFastResearch` multiplies job drain by 3. `cheatMoney` `+200`. `cheatPoints` `+10`. End day sets `clock.t = DAY_SECONDS`. Cheats not Save.

## Time / indexes / log

[[architecture/tick]] [[architecture/log]]. Do not restate them here.

Fenced-area maps, not `track()`: `enclosures` / `fenceEnclosures` / `plotEnclosures`. Rebuild on fence add / fence remove / `indexAll`. Never on tick. Not Save. [[mechanics/enclosure]]

Vehicles unrepresentable: two drivers on one vehicle, two vehicles driving the same seat, seated + walk/work queue, stored + driver, stored + running, seated + running, running with no route, running with 0 stops, cursor out of range, goto without XY, load/unload without pad coord, wait without a light cell, quad hitch, quad boom, boom other than `3 | 5`, two trailers on one tractor, trailer attached + stored. Cycle wire. Two direct paths same `nodeKey(from)` → `nodeKey(to)`. Wire into an output. Analogue signal. Still rotate / 1×1. Mill/jam/still/station/infuser/pump `inn` hold. Pad as a `Cell`. Logic gate / NOT buyable on `unlock-sensors` alone. Live `SensorKind` `'or'` `'and'`. Traffic-light `inn` combinationally driving `out`. `HudTarget` hangar or vehicle. Enclosure on tick. `plotEnclosures` as a field on `Plot`. Infuser 1×1. `unlock-chilli`.

`World.routes: Route[]`. `World.nextRouteId` starts 1. Vehicle holds `route: RouteId | 'none'`, `cursor`, `running`. Rules: [[mechanics/vehicles]].

`HudTarget` is sprinkler vertex or a sensor cell (water, harvest, counter, day, logic, variety, weather, pressure). No hangar. No vehicle.

## Rng

`World.rng: Rng`. `World.seed` is `rng.seed`. `Math.random` only when seed is omitted. No `World.ripenN`. No grow stream. [[architecture/rng]]

Illegal: spatial roll without identity ints. Weather identity `at(day, k)` only. Burrow site `at(cx, cy, day, k)`. Burrow loot `at(col, row, salt)`. `clock.t` or `money` as entropy.

## Weather

`World.weather(day)` indexes `forecastWeather(seed, throughDay, pins?)`. Current = `weather(clock.day)`. `World.pumpLiters` 0 at init, load, `rebase()`, and after the seam bill. Pins: `Map<day, WeatherKind>`, not Save, not `Cmd`, host only. [[mechanics/weather]]

## Modifier

`Modifier.source = 'research' | 'fertilizer' | 'skill'`. Skill crop sale (`better-*`) is `source: 'skill'`. `World.modGen` increments when `modifiers` change. Cache `statsOf(crop, variety)` for that generation. `qualityMul` applies at sale, not in the cache key.

## Invariants

`world.queue` — `Seat.queue` length ≤ `QUEUE_CAP`. Further `enqueueOn` is a no-op and `say(prompt_queue_full)`. Not Save.

`world.dest` — `dest(hangar | silo | still | fill)` is the origin of that instance, not the interior cell clicked. Fill is pump / tap / well. `dest(inventory)` is `DOOR`. `dest(consign)` is `PAD`. `dest(station | infuser | open | additives)` is `at`.

`world.pulse` — `World` has no `pulse` field. Last-action highlight gone. Not a cmd. Not Save.

`world.pause` — World has no `pause` field. Solo family / market / almanac overlay pause is App-local. MP pause is the net flag on `MpHost` / `MpGuest`. Not Save. Not a `Cmd`.

`world.cheatSpeed` — `World.cheatSpeed` is `1 | 3`. App host accumulator `frameDt * cheatSpeed`. World.tick does not multiply `dt`. `Act.cheat` `{ k: 'speed'; n: 1 | 3 }`. `?speed=3` boots 3; any other URL value boots 1. Not job drain.

`world.cheatFastResearch` — `World.cheatFastResearch` is boolean. Starts false. Not Save. Toggle `Act.cheat` `{ k: 'research' }`. On: job drain `× 3`. Off: 1×. Not `cheatSpeed`.
