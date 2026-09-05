# Modules

`src/game/` is `defs`, `sim`, `ui`, `view`, `net`. `src/App.tsx` holds one [[architecture/world]] `World` or none, the panel union, `App.local: SeatId`, the MP session, and the `DT_MAX` accumulator (`frameDt * World.cheatSpeed`). No App `SPEED` 1–20. Startup [[ui/menu]]: no `World`. Play: holds `World` and ticks it. It does not own `Cell`.

`defs` are tables. `sim` is the game. `ui` is React chrome. `view` is the PixiJS v8 canvas world. HUD/panels stay React. `net` is PeerJS. `World` does not import `peerjs`. Numbers live in defs; do not duplicate them in notes. Ids: `sim/ids.ts`. `SkuId` += `buy-furnace` `buy-axe` `buy-research-station`. `MachineId` += `furnace` `station` (`recipe.ts`). `VfxId` += `furnace-smoke`. Player strings: [[architecture/i18n]].

## defs

| file | owner |
|---|---|
| `crops.ts` | `CROPS`, `HAPPY_*` |
| `trees.ts` | `TREES`, `TREE_YIELD_*` |
| `varieties.ts` | `VarietyId`, `VarietyTier`, `Purpose`, `VARIETY`, `VARIETIES`, `PURPOSE_MUL`, `purposeMul`, `purposeOf`, `tierOf`, `caskGroup`, `VARIETY_GROW`, `VARIETY_TOL`, `VARIETY_ROT`, `QUALITY_TOP`, `QUALITY_STEP`, `BETTER_QUALITY`, `NEIGHBOUR_IDS`, `NEIGHBOUR_REACH` |
| `items.ts` | tool / container / machine / vehicle / sensor hold constants. `FURNACE_*` `AXES` `FURNACE_VALUE` `COMPOST_VALUE.ash` `STATION_*` `GRAFT_WORK` `GRIND_MIN_AT` |
| `research.ts` | `RESEARCH`, `SKUS`. `unlock-furnace`, `buy-furnace`, `buy-axe`, `buy-research-station` |
| `skills.ts` | `SKILLS`. `BetterCrop`, `BETTER_IDS` |
| `catalog.ts` | almanac SKU `CatalogEntry`. Furnace, axe, station. Wood, ash, graft item rows |
| `shelf.ts` | `BuildShelfId`. Station on Processing |
| `companies.ts` | `COMPANIES` book — [[mechanics/contracts]] |
| `weather.ts` | weather numbers — [[mechanics/weather]] |

## sim

`World` is the live-state owner and tick sequencer. `track()` stays on `World`. Do not add `sim/index.ts`. New mechanic → new `sim/<name>.ts`. Do not append a mechanic onto `World`. Pattern: `vehicle.ts` — types and functions in the feature file; `World` holds lists and calls in. Extracting functions `World` calls is legal; the extract is not in `src/` until that wave.

| file | owner |
|---|---|
| `world.ts` | coordinator: `cell` / `setCell` / `track`, apply dispatch, tick order, place / click, seats. `World`, `Seat`, `cheatSpeed`, `cheatFastResearch`. Still holds `tickMachines` `furnaceMul` snapshot. Intent `chop` `furnace` `graft` `station` |
| `family.ts` | Offers, pick, skill-modifier rebuild. `initFamily` `rerollOffers` `skillEligible` `pickSkillBody` `rebuildSkillModifiers` `unlockAllSkillsBody`. State stays `World.family` / `World.points`. New-farm constructor calls `initFamily(this)` |
| `mp.ts` | `PROTOCOL`, sequencer, digest — [[architecture/net]] |
| `save.ts` | `Save`, dump / parse — [[architecture/save]] |
| `tutorial.ts` | session check — [[mechanics/tutorial]] |
| `settings.ts` | `Settings`, `settings()` / `saveSettings` — [[ui/settings]] |
| `log.ts` | `Act`, `Cmd` |
| `log.worker.ts` | worker JSON sink |
| `plot.ts` | `Cell`, `Plot` |
| `soil.ts` | `Soil` |
| `plant.ts` | `Plant` (`variety`, `quality`), `Weed` |
| `water.ts` | `Reservoir`, `pull()` |
| `stall.ts` | `StallGood`. Crop bins per variety × bio |
| `market.h.ts` | sat / contract typedefs. `Demand` plain or group |
| `market.ts` | sat helpers, `rollBoard` |
| `building.ts` | buildings, `Tree` (`tended`, `trunk`, `variety`), `Furnace`, `ResearchStation`, `Hangar`, stores, `AdditiveId` (includes `weed-spray`). `SiloStack` crop+variety+quality. `BaseBuilding` `Machine`; `Store` extends `BaseBuilding` |
| `pipe.ts` | `Edge`, `Sprinkler`, `Gate` |
| `actor.ts` | `Actor` |
| `clock.ts` | `Clock` |
| `item.ts` | `Item`, `Hand`, `Face`. `weed-spray` bag `liters`+`capacityLiters`. `axe` `wood` `ash` `graft`. Fruit `cut`. `furnaceValue`, `compostValue` ash |
| `prompt.ts` | `Prompt`. Chop / furnace dump / graft / station |
| `look.ts` | `lookText`. Furnace / trunk / grow. Covering haste line. Neighbour wait line |
| `drop.ts` | `Drop` |
| `gen.ts` | `generateChunk` |
| `noise.ts` | `goodness` |
| `modifiers.ts` | `Modifier`, `statsOf(crop, variety, quality, mods)` |
| `rng.ts` | `Rng`, streams |
| `weather.ts` | `WeatherKind`, `forecastWeather` |
| `machine.ts` | mill recipes, sale bake, grind hopper accept, furnace feedstock, machine west/east, `qualityMul`, `caskAgeTop` |
| `recipe.ts` | `recipesOf`, `recipesUsing`, mill/jam/still/barrel rows pinned to variety, compost 4, furnace 6, station, still water face. `MachineId` += `furnace` `station` |
| `vehicle.ts` | `Vehicle`, `Trailer`, `Route`, `RouteStop`, integrate |
| `sensor.ts` | `Sensor`, `Wire`, `evalDag`, traffic light. Will: make table `{ [K in SensorKind]: { sku, make } }` next to the classes; `makeSensor` / `skuKind` lookups; ports on the device. `evalDag` stays a function. Not a `Machine` |

## ui

| file | owner |
|---|---|
| `frame.tsx` | `Dock`, `Chrome`, `Coin`, `Btn` |
| `callout-hover.tsx` | `CalloutHover` |
| `hud.tsx` | clock, ribbon, docks, pause, gear |
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
| `almanac.tsx` | catalog |
| `objecthud.tsx` | sprinkler / sensor HUD |
| `hangar.tsx` | hangar cue |
| `vehicle.tsx` | parked cue |
| `recap.tsx` | end-of-day |
| `family.tsx` | family overlay |
| `station.tsx` | station panel — [[ui/station]] |

Panel open/close is App-local. Solo family / market / almanac overlay pause, the day-seam pause, and the tab pause are App-local. World has no pause field. MP pause is the net flag — [[architecture/net]]. Changelog open/close is Menu-local, not a `Panel` arm. `Seat.cue` opens inventory, chest, store, hangar, parked vehicle, or station. Silo cells are look name only.

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
| `layers/plots.ts` | plots, plants, weeds, turf, rocks, trees, tufts. Tree stage `trunk`. Crop groups base / variant / variant / heirloom |
| `layers/pipes.ts` | pipes, valves, sprinklers, fences |
| `layers/props.ts` | buildings, sensors, house, truck, hangars, silos. Furnace `off`/`on`. Station `off`/`on`. Still / furnace native viewBox; art 1.5×1 / 1×1.5 inside |
| `layers/actors.ts` | seats, vehicles, trailers, drops |
| `layers/overlay.ts` | lens wash, routes, wires, ports, AoE |
| `layers/vfx.ts` | `VfxDef`, state / burst. Furnace fire south + `furnace-smoke` origin while working |
| `map.tsx` | React host: canvas + HTML ghosts / speech / expand. `MapView`, `Lens`. `data-furnace-cover` |
| `svgs.ts` | chrome-only (HUD, almanac, shop). `treeStage` += `trunk`. Furnace faces. Graft face. Station faces |
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

`World.house` / `truck` / `pumps` / `tanks` / `taps` / `wells` / `stills` / `waterSystems` / `hangars` / field silos / `silo` / `additives` are the same instances stored in their cells. `Furnace` same instance both cells; tick via `machines` index; no `World.furnaces` list. Station tick via `machines` index. `World.vehicles` / `World.trailers` / `World.routes` are lists, not cells. `World.wires` is the signal graph. `tickDispatch` on `world.ts` after `evalDag`. `World.segments` and `World.sprinklers` are the pipe graph. A valve is a `Gate` on a segment. `World.fences` is the fence set.

Tutorial is App session state. Save I/O is `sim/save.ts`. App does not own `Save`.

## Building I/O

```
BaseBuilding
  base
  accept(item) → 0
  apply(item, n) → no-op
  ports → []
  pads → 'none'
  takeAll → false

Machine extends BaseBuilding
  inn: Signal
  pads → 'both'
```

`Store` extends `BaseBuilding`.

`Machine` (has `inn`): `Mill`, `JamMachine`, `PotStill`, `Furnace`, `ResearchStation`.

`BaseBuilding`, not `Machine` (no `inn`): `Grinder`, `CompostBox`, `Barrel`, `Chest`, `Freezer`. `CompostBox.pads = 'both'`, `takeAll`. Grinder / barrel keep `'none'`. `Chest` `Freezer` override `pads` `'both'`, `ports` `['out']`, `takeAll`.

`Store`: `SeedSilo`, `AdditiveStore`. Override `pads` `'both'`, `ports` `['out']`.

House / pump / hangar / field silos unchanged this pass.

Override only when the body is real logic. Do not put mill / jam / furnace specifics on `Machine`. Mill / jam / still / station `ports` `['in']`. Furnace `['in','out']`.

Walk dump, chest west-pull / east-push, and vehicle pads all go through instance `accept` / `apply`. `dumpAccept` is `dest.accept`. `dumpApply` is `dest.apply` then `take` (`takeAll` → whole item, else `n`). `ownsPort` for mill / jam / still / furnace / station / chest / freezer / seed-silo / additive-store: origin cell and `c.ports` includes the port. Sensor kind arms stay on `ownsPort` — [[mechanics/sensors]]. `PadCell` is `pads === 'both'` (type guard). `padBuildings` walks machines / stores / silo / additives and keeps that set. Compost included; grinder / barrel excluded. `IoCell` is the west-pull set (includes grinder). Chest west / east adjacency stays `World`; payload is `accept` / `apply`. Plots stay a union; no `Cell.accept`. Barrel collect is not `accept`.

Sensors are not `Machine`. Make table and ports: [[mechanics/sensors]].

Assumption: leftover `useOf` is `purposeMul`; no `pathUse`.
