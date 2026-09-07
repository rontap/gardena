# Modules

`src/game/` is `defs`, `sim`, `ui`, `view`, `net`. `src/App.tsx` holds one [[architecture/world]] `World` or none, the panel union, App `recapDay`, `App.local: SeatId`, the MP session, and the `DT_MAX` accumulator (`frameDt * World.cheatSpeed`). No App `SPEED` 1–20. Startup [[ui/menu]]: no `World`. Play: holds `World` and ticks it. It does not own `Cell`.

`defs` are tables. `sim` is the game. `ui` is React chrome. `view` is the PixiJS v8 canvas world. HUD/panels stay React. `net` is PeerJS. `World` does not import `peerjs`. Numbers live in defs; do not duplicate them in notes. Ids: `sim/ids.ts`. `ResearchId` += `unlock-hardened-tools`. `SkuId` += `buy-furnace` `buy-axe` `buy-chainsaw` `buy-research-station` `buy-logic` `buy-sensor-variety` `buy-sensor-weather`. `SensorKind` += `logic` `sensor-variety` `sensor-weather`. `MachineId` += `furnace` `station` (`feature-machines/recipe.ts`). `VfxId` += `furnace-smoke`. Player strings: [[architecture/i18n]].

## defs

| file | owner |
|---|---|
| `crops.ts` | `CROPS`, `HAPPY_*` |
| `trees.ts` | `TREES`, `TREE_YIELD_*` |
| `varieties.ts` | `VarietyId`, `VarietyTier`, `Purpose`, `VARIETY`, `VARIETIES`, `PURPOSE_MUL`, `purposeMul`, `purposeOf`, `tierOf`, `caskGroup`, `VARIETY_GROW`, `VARIETY_TOL`, `VARIETY_ROT`, `QUALITY_TOP`, `QUALITY_STEP`, `BETTER_QUALITY`, `NEIGHBOUR_IDS`, `NEIGHBOUR_REACH` |
| `items.ts` | tool / container / machine / vehicle / sensor hold constants. `FURNACE_*` `AXES.axe` `AXES.chainsaw` `FURNACE_VALUE` `COMPOST_VALUE.ash` `STATION_*` `GRAFT_WORK` `GRIND_MIN_AT` |
| `research.ts` | `RESEARCH`, `SKUS`. `unlock-furnace`, `unlock-hardened-tools`, `buy-furnace`, `buy-axe`, `buy-chainsaw`, `buy-research-station` |
| `skills.ts` | `SKILLS`. `BetterCrop`, `BETTER_IDS`. `lucky`. `machinery` gate `unlock-grinder` |
| `catalog.ts` | almanac SKU `CatalogEntry`. Furnace, axe, chainsaw, station. Wood, ash, graft item rows. Game concepts Luck + Burrow are not `CatalogEntry` |
| `shelf.ts` | `BuildShelfId`. Station on Processing |
| `companies.ts` | `COMPANIES` book — [[mechanics/contracts]] |
| `weather.ts` | weather numbers — [[mechanics/weather]] |
| `burrow.ts` | `BURROW_MUL` `BURROW_START_N` loot-roll numbers `LUCK_CAP` — [[mechanics/burrow]] |
| `math.ts` | `Math.visualRound` — [[architecture/view]] `view.round` |

## sim

`World` is the live-state owner and tick sequencer. `track()` stays on `World`. Do not add `sim/index.ts`. New mechanic → new `sim/<name>.ts`. Do not append a mechanic onto `World`. Pattern: `feature-vehicles/` — types in `vehicle.h.ts`, functions in `vehicle.ts`; `World` holds lists and calls in. Extracting functions `World` calls is legal; the extract is not in `src/` until that wave.

| file | owner |
|---|---|
| `world.ts` | coordinator: `cell` / `setCell` / `track`, apply dispatch, tick order, seats. `World`, `Seat`, `Place`, `StayArmed`, `cheatSpeed`, `cheatFastResearch`. Holds `furnaceSnap`. Indexes `enclosures` `fenceEnclosures` `plotEnclosures` — filled by feature-enclosure, not `track()`. Machine tick / walk-dump live in `feature-machines/`. Field tick / till / plant / harvest / tend / chop / graft live in `feature-field/`. Place / buy / delete / expand / pipe-place live in `feature-place/`. Burrow mint / roll / extract live in `feature-burrow/`. Intent `chop` `furnace` `graft` `station` `open` |
| `family.ts` | Offers, pick, skill-modifier rebuild. `initFamily` `rerollOffers` `skillEligible` `pickSkillBody` `rebuildSkillModifiers` `unlockAllSkillsBody`. State stays `World.family` / `World.points`. `lucky` is owned here; luck is derived, not a World field. New-farm constructor calls `initFamily(this)` |
| `mp.ts` | `PROTOCOL`, sequencer, digest — [[architecture/net]] |
| `feature-save/save.h.ts` | `Save` typedefs |
| `feature-save/save.ts` | dump / parse — [[architecture/save]] |
| `feature-save/save.parse.ts` | parse |
| `tutorial.ts` | session check — [[mechanics/tutorial]] |
| `settings.ts` | `Settings`, `settings()` / `saveSettings` — [[ui/settings]] |
| `log.ts` | `Act`, `Cmd` |
| `log.worker.ts` | worker JSON sink |
| `plot.ts` | `Cell`, `Plot`. `Cover` += burrow |
| `soil.ts` | `Soil` |
| `plant.ts` | `Plant` (`variety`, `quality`), `Weed` |
| `water.ts` | `Reservoir`, `pull()` |
| `stall.ts` | `StallGood`. Crop bins per variety × bio |
| `feature-contracts/market.h.ts` | sat / contract typedefs. `Demand` plain or group |
| `feature-contracts/market.ts` | sat helpers, `rollBoard` |
| `building.ts` | buildings, `Tree` (`tended`, `trunk`, `variety`), `Furnace`, `ResearchStation`, `Hangar`, stores, `AdditiveId` (includes `weed-spray`). `SiloStack` crop+variety+quality. `BaseBuilding` `Machine`; `Store` extends `BaseBuilding`. `Pump.ports` `['in']` `Pump.inn` |
| `pipe.ts` | `Edge`, `Sprinkler`, `Gate` |
| `actor.ts` | `Actor` |
| `clock.ts` | `Clock` |
| `item.ts` | `Item`, `Hand`, `Face`. `weed-spray` bag `liters`+`capacityLiters`. `axe` `chainsaw` `wood` `ash` `graft` `treasure`. Fruit `cut`. `furnaceValue`, `compostValue` ash |
| `prompt.ts` | `Prompt`. Chop (axe or chainsaw) / furnace dump / graft / station / burrow Dig / treasure open |
| `look.ts` | `lookText`. Furnace / trunk / grow. Covering haste line. Neighbour wait line. Burrow look does not name loot |
| `drop.ts` | `Drop` |
| `gen.ts` | `generateChunk`. `(0,0)` calls feature-burrow start mint |
| `noise.ts` | `goodness` |
| `modifiers.ts` | `Modifier`, `statsOf(crop, variety, quality, mods)` |
| `rng.ts` | `Rng`, streams. Spatial `burrow` |
| `weather.ts` | `WeatherKind`, `forecastWeather` |
| `feature-machines/machine.ts` | mill recipes, sale bake, grind hopper accept, furnace feedstock, machine west/east, `qualityMul`, `caskAgeTop` |
| `feature-machines/machines.tick.ts` | `tickMachines` `pullMachineStores` `workingFurnaces` `furnaceMulFor`. Snapshot `World.furnaceSnap` at start of `tickMachines`. Re-exports emit |
| `feature-machines/machines.emit.ts` | `emitProduct` `emitPair` `dropSpot` `pullStillWater`. Called from `BaseBuilding.tick` |
| `feature-machines/machines.helpers.ts` | `canMill`/`doMill` `canJam`/`doJam` `canStill`/`doStill` `canFurnace`/`doFurnace` `canStation`/`doStation` `canGrind`/`doGrind` `canBarrel`/`doBarrel`/`canBarrelCollect` `canCompost`/`doCompost`. Public `canStation` / `dropSpot` / `furnaceMulFor` stay World wrappers |
| `feature-machines/recipe.h.ts` | `Recipe`, `Craft`, `MachineId` |
| `feature-machines/recipe.ts` | `recipesOf`, `recipesUsing`, mill/jam/still/barrel rows pinned to variety, compost 4, furnace 6, station, still water face. `MachineId` += `furnace` `station` |
| `feature-field/field.ts` | grow / recover tick, tree seam, weeds, grass |
| `feature-burrow/` | start mint, seam mint, loot roll, extract. Types in `burrow.h.ts`, functions in `burrow.ts`. `World` indexes `burrows` and calls in |
| `feature-enclosure/` | `Enclosure`, rebuild, lookup. Types in `enclosure.h.ts`, functions `(w, …)` in `enclosure.ts`. `World` indexes; it does not own. Rebuild on fence add/remove and `indexAll` |
| `feature-field/field.helpers.ts` | neighbour, waterable, mood, age, till / plant / water / harvest / tend / chop / graft. Chop accepts axe or chainsaw; work is the held item's `workSeconds`. Shovel on burrow cover calls feature-burrow extract |
| `feature-place/place.ts` | `buyBody` `buyPacksBody` `clickBody` `clickValveBody` `rightClickBody` `expandBody` `faces` `placePipeBody` `deletePipeBody` `placeSprinklerBody` `deleteSprinklerBody` `armDeleteBody` `rotatePlaceBody` `cancelPlaceBody`. Public `buy` / `click` / `confirmPlace` stay World wrappers |
| `feature-place/place.helpers.ts` | `confirmPlace` `deleteBuildingBody` `pruneVert`. Burrow refuses place / tile / fence. Fenceable sensor site; sensor-then-fence delete |
| `feature-vehicles/vehicle.h.ts` | `Vehicle`, `Trailer`, `Route`, `RouteStop` |
| `feature-vehicles/vehicle.ts` | integrate |
| `sensor.ts` | `Sensor`, `Wire`, `evalDag`, traffic light. `SensorBase.fenceable`. `readerRaw` range argument. `LogicGate` `mode`. Variety / weather / pressure eval. Will: make table `{ [K in SensorKind]: { sku, make } }` next to the classes; `makeSensor` / `skuKind` lookups; ports on the device. `evalDag` stays a function. Not a `Machine` |

## ui

| file | owner |
|---|---|
| `frame.tsx` | `Dock`, `Chrome`, `Coin`, `Btn`, `Checkbox`, `Radio` |
| `callout-hover.tsx` | `CalloutHover` |
| `hud.tsx` | clock, ribbon, docks, pause, gear |
| `notices.ts` | `noticeRows(world)` — pure read, no writes. `Notice`, `NoticeGo`, `NOTICE_*` — [[ui/notices]] |
| `notices.tsx` | Command Center, per-row click, dismiss, two-pass state, bars — [[ui/notices]] |
| `menu.tsx` | startup / gear shell, `MenuPage` |
| `settings.tsx` | `SettingsPage` body — [[ui/settings]] |
| `changelog.md` | player copy. Shipped. Not `docs/` |
| `changelog.ts` | `parseChangelog`, `RELEASES` |
| `changelog.tsx` | `Changelog` body |
| `multiplayer.tsx` | join / host / guest |
| `tutorial.tsx` | tour card |
| `lens.tsx` | lens dock |
| `status.tsx` | look line |
| `held.tsx` | hand / item face |
| `queue.tsx` | intent queue |
| `shop.tsx` | `World.buy` |
| `cheat.tsx` | `unlockAll` / `unlockAllSkills` / `cheatFastResearch` / `cheatSpeed` / end day / weather pins |
| `research.tsx` | `World.startResearch` |
| `market.tsx` | Stall \| Contracts overlay |
| `inventory.tsx` | house slots |
| `chest.tsx` | chest slots |
| `almanac.tsx` | catalog. Game concepts Luck + Burrow |
| `objecthud.tsx` | sprinkler / sensor HUD. Sensor `HudSpec.rows` `HudRow` check / radio |
| `hangar.tsx` | hangar cue |
| `vehicle.tsx` | parked cue |
| `recap.tsx` | end-of-day summary. App `recapDay`, not `World.seam` |
| `family.tsx` | family overlay |
| `station.tsx` | station panel — [[ui/station]] |

Panel open/close is App-local. Solo family / market / almanac / recap-popup overlay pause, the day-increment pause (`settings.solo`), and the tab pause are App-local. World has no pause field. MP pause is the net flag — [[architecture/net]]. Changelog open/close is Menu-local, not a `Panel` arm. `Seat.cue` opens inventory, chest, store, hangar, parked vehicle, or station. Silo cells are look name only. Recap popup is App `recapDay`. `goNotice` takes `NoticeGo`.

## view

PixiJS v8 canvas world. No `@pixi/react`. No Pixi HUD. No `Graphics.svg` for tiles. Atlas rasterizes named SVG groups at 2×, nearest. Farm sprites `eventMode` `'none'`. `CullerPlugin` on chunks. `Application.destroy` `releaseGlobalResources`. Contract: [[architecture/view]].

Camera and `Lens` are view-local, not `World` fields. Camera follow is view-local. Water lens requires husband `water-study`; `land` requires `land-study`. `sensors` unhidden after `unlock-sensors`. `vehicles` unhidden after `unlock-vehicles`. Wires sim-state always; paint and port hit view-gated on `sensors`.

Map-atlas vs chrome SVG: `atlas.ts` owns farm textures. `svgs.ts` owns HUD / almanac / shop fragments only.

| file | owner |
|---|---|
| `camera.ts` | `Camera`, `TILE` |
| `atlas.ts` | SVG group → `Texture`. `vfx-furnace-smoke.svg` |
| `app.ts` | `Application` lifecycle |
| `world-view.ts` | scene graph, dirty patch, ticker motion |
| `hit.ts` | `clickHit` / `nearestEdge` / ghosts |
| `outline.ts` | union footprint path |
| `layers/ground.ts` | terrain chunks |
| `layers/plots.ts` | plots, plants, weeds, turf, rocks, trees, tufts, burrow cover. Tree stage `trunk`. Crop groups base / variant / variant / heirloom |
| `layers/pipes.ts` | pipes, valves, sprinklers, fences |
| `layers/props.ts` | buildings, sensors, house, truck, hangars, silos. Furnace `off`/`on`. Station `off`/`on`. Still / furnace native viewBox; art 1.5×1 / 1×1.5 inside |
| `layers/actors.ts` | seats, vehicles, trailers, drops |
| `layers/overlay.ts` | lens wash, routes, wires, ports, AoE. Sensor wash from watched set; pump origin port |
| `layers/vfx.ts` | `VfxDef`, state / burst. Furnace fire south + `furnace-smoke` origin while working |
| `map.tsx` | React host: canvas + HTML ghosts / speech / expand. `MapView`, `Lens`. Loading overlay until `onReady`. `data-furnace-cover` |
| `svgs.ts` | chrome-only (HUD, almanac, shop). `treeStage` += `trunk`. Furnace faces. Graft face. Station faces. Chainsaw face. `researchInner`: `unlock-advanced-sensors` is the Logic gate, not AND; `unlock-grinder` is `skill-machinery.svg` 1-1, no new research SVG |
| `motion.ts` | HUD-only binds. Live craft `left` uses `furnaceMul` |

Pipes and sprinklers are not cells. Map hits `Edge` / `Vertex` separately. Pipes always drawn (faint when lens off). Wetness + AoE still lens / tool. Sprinkler AoE on hover is view. Pipe drag-to-draw is view-local pending run; commit existing `placePipe` per edge; no new cmd.

## net

| file | owner |
|---|---|
| `peer.ts` | PeerJS star. Default cloud broker + default STUN |

## Owners

| unit | owner |
|---|---|
| `World` | `sim/world.ts`. App holds the instance or none |
| `Seat` | `World.seats` |
| `Soil` | `sim/soil.ts`. Required on every `Tilled` plot |
| `Plant` | `sim/plant.ts`. `crop: AnnualId`. `variety` `quality` required |
| `Tree` | `sim/building.ts`. Same instance in both 1×2 cells. `trunk` `variety` required |
| `Furnace` | `sim/building.ts`. Same instance in both 1×2 cells. Tick origin. Not a `World.furnaces` list |
| `ResearchStation` | `sim/building.ts`. 1×1. Tick origin. Not a `World.stations` list |
| `Reservoir` | `sim/water.ts`. `Pump.water`, `RainTank.water`. `rate` × weather mul |
| `WeatherKind` | `sim/weather.ts`. `World.weather(day)` |
| `Stall` | `sim/stall.ts`. `World.stall` complete `StallGoodId` map. Crop bins per variety × bio |
| `Place` | `Seat.place`. Always a `Place` |
| `MpWire` | `sim/mp.ts` type. PeerJS in `net/peer.ts` only |
| `MpHost` / `MpGuest` | `sim/mp.ts`. App holds the session |

`World.house` / `truck` / `pumps` / `tanks` / `taps` / `wells` / `stills` / `waterSystems` / `hangars` / field silos / `silo` / `additives` are the same instances stored in their cells. `Furnace` same instance both cells; tick via `machines` index; no `World.furnaces` list. Station tick via `machines` index. `World.vehicles` / `World.trailers` / `World.routes` are lists, not cells. `World.wires` is the signal graph. `tickDispatch` on `world.ts` after `evalDag`. `World.segments` and `World.sprinklers` are the pipe graph. A valve is a `Gate` on a segment. `World.fences` is the fence set. `World.enclosures` / `fenceEnclosures` / `plotEnclosures` are fenced-area indexes — [[mechanics/enclosure]].

Tutorial is App session state. Save I/O is `sim/feature-save/save.ts`. App does not own `Save`.

## Building I/O

```
BaseBuilding
  base
  accept(item) → 0
  apply(item, n) → no-op
  ports → []
  pads → 'none'
  takeAll → false
  solid → true
  ticks → false
  hasted → false
  tick(w, at, dt) → false

Machine extends BaseBuilding
  inn: Signal
  pads → 'both'
  ticks → true
```

`Store` extends `BaseBuilding`.

`Machine` (has `inn`): `Mill`, `JamMachine`, `PotStill`, `Furnace`, `ResearchStation`.

`BaseBuilding`, not `Machine` (no `inn`): `Grinder`, `CompostBox`, `Barrel`, `Chest`, `Freezer`. `CompostBox.pads = 'both'`, `takeAll`, `ticks`, `hasted`. Grinder `ticks` `hasted`, pads `'none'`. Barrel `ticks`, pads `'none'`. `Chest` `Freezer` override `pads` `'both'`, `ports` `['out']`, `takeAll`.

`Store`: `SeedSilo`, `AdditiveStore`. Override `pads` `'both'`, `ports` `['out']`.

A building that wants the default writes nothing. `solid` every `BaseBuilding`. `ticks` mill jam still grinder barrel furnace station compost-box — `World.machines`. `hasted` mill jam still grinder furnace compost-box — furnace haste look. Station and barrel tick; they are not `hasted`. `BaseBuilding.tick(w, at, dt)` returns whether it changed anything. `tickMachines` does not name a machine kind. Origin-cell guard and `ticks` live in the loop; rate and product live on the machine. Compost-box ticks in that loop. `emitProduct` / `emitPair` / `dropSpot` / `pullStillWater` stay free functions in `machines.emit.ts`; the machine calls them.

House / hangar / field silos unchanged this pass. `Pump.ports` `['in']`. `Pump.inn` combinational, no hold, not saved. `gatherWater` skips that reservoir when `inn === 1`.

Override only when the body is real logic. Do not put mill / jam / furnace specifics on `Machine`. Mill / jam / still / station `ports` `['in']`. Furnace `['in','out']`.

Walk dump, chest west-pull / east-push, and vehicle pads all go through instance `accept` / `apply`. `dumpAccept` is `dest.accept`. `dumpApply` is `dest.apply` then `take` (`takeAll` → whole item, else `n`). `ownsPort` for mill / jam / still / furnace / station / chest / freezer / seed-silo / additive-store / pump: origin cell and `c.ports` includes the port. Sensor kind arms stay on `ownsPort` — [[mechanics/sensors]]. Pumpjack east cell: no port. `PadCell` is `pads === 'both'` (type guard). `padBuildings` walks machines / stores / silo / additives and keeps that set. Compost included; grinder / barrel excluded. `IoCell` is the west-pull set (includes grinder). Keep `isIoCell` as its own predicate, not a flag alias. Chest west / east adjacency stays `World`; payload is `accept` / `apply`. Plots stay a union; no `Cell.accept`. Barrel collect is not `accept`. `isSolid` uses `solid` for the `BaseBuilding` half; house / rock / tree / truck / pump stay kind arms; sensors via `isSensor`.

Sensors are not `Machine` and not `BaseBuilding`. They carry the same readonly `ports`. Make table and ports: [[mechanics/sensors]].

`building.flags` — `BaseBuilding` carries `solid` `ticks` `hasted` beside `ports` `pads` `takeAll`. A building that wants the default declares nothing. No call site re-derives a flag by listing kinds.

`building.ports-single` — `ports` is the only statement of which ports a cell has. `hit.ts` has no `portsOf`. Sensors carry the same field.

`machines.tick-self` — `tickMachines` does not name a machine kind. Origin-cell guard and `ticks` live in the loop; rate and product live on the machine.

Assumption: leftover `useOf` is `purposeMul`; no `pathUse`.

Assumption: `Place` / `StayArmed` stay on `world.ts`; dest and wire place stay.

Assumption: `hasted` is a flag, not `machineMul` on the class — the still and furnace take furnace haste but not the machinery skill, and one boolean says that where a rate method would hide it.

Assumption: sensors gain `ports` in Cut 1. They are not `BaseBuilding` and this spec does not make them one.
