# Modules

`src/game/` is `defs`, `sim`, `ui`, `view`, `net`. `src/App.tsx` holds one [[architecture/world]] `World` or none, the panel union, `App.local: SeatId`, the MP session, and the `DT_MAX` accumulator. Startup [[ui/menu]]: no `World`. Play: holds `World` and ticks it. It does not own `Cell`.

`defs` are tables. `sim` is the game. `ui` is React chrome. `view` is the SVG camera. `net` is PeerJS. `World` does not import `peerjs`.

## defs

No `World`. No tick. Numbers and copy live here; do not duplicate them in notes.

| file | owns |
|---|---|
| `crops.ts` | `CropDef`, `CROPS`. Sale / rot / desc / class / seed / tols / `waterUsePerSec`. Trees: `waterUsePerSec = 0`. `CropDef.saleMul` optional `{ [Rarity]: number }`; absent → `RARITY_SALE`. Vanilla only. |
| `trees.ts` | `TREES`, `TREE_YIELD_DAYS`, `TREE_YIELD_MUL`, `TREE_OFF_MUL`. `TREES[TreeId] = { juvenileSeconds, fruitSeconds }` |
| `items.ts` | tool, container, box, fert, compost, sprinkler, mill / jam / still / barrel / freezer / sugar / quad / tractor / trailer / hangar / silo / surface constants |
| `rarity.ts` | `Rarity`, sale / grow / rot / weight tables |
| `research.ts` | `RESEARCH`, `SKUS`; `Sku.tab` |
| `skills.ts` | `SKILLS`, `SkillDef`, `TEND_WORK` |
| `catalog.ts` | almanac `CatalogEntry` keyed by `Face` |

`sim/ids.ts` owns id unions (`AnnualId`, `TreeId`, `CropId`, `SkuId`, `ResearchId`, `StallGoodId`, `SpiritKind`, `JamCrop`, `StillCrop`, `MillRecipe`, `VehicleKind`, `VehicleId`, `VehicleSlot`, `TrailerKind`, `TrailerId`, `HarvestSlot`, `MemberId`, `PlayerSkillId`, `HusbandSkillId`, `DaughterSkillId`, …). defs import those ids.

`CropId = AnnualId | TreeId`. `StallGoodId = CropId | 'sugar' | SpiritKind | 'wine' | JamId | 'oil' | 'flour' | 'extract'`. No `'berry'`. `ResearchId` += `unlock-grape` `unlock-olive` `unlock-fermentation` `unlock-preservatives` `unlock-vehicles`. No `unlock-vanilla`. No `unlock-mill` `unlock-jam` `unlock-still` `unlock-barrel` `unlock-freezer`. `SkuId` += `pack-grape` `pack-olive` `pack-vanilla` `pack-sugar-cane` `buy-mill` `buy-jam` `buy-still` `buy-barrel` `buy-freezer` `buy-sugar` `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce`. No Quad SKU. No tractor SKU. No trailer SKU. `pack-vanilla.need` is `vanilla-tending`.

No `bump-*` research ids. No `sale-mul` research effect. Better-crop is player skills — [[architecture/family]]. `unlock-heirloom` is plants `feature`, gates Őstermelő.

## sim

Classes for game objects. Tick and mutation stay here.

| file | owns |
|---|---|
| `world.ts` | `World`, `Seat`, `SeatId`, `Presence`, `PlayerId`, `Intent`, `Place`, `StayArmed`, `Cue`, `Speech`, `Seam`, `Net`, `Family`, `dest()`. `World.seats`. `World.stills`. `World.hangars`. `World.seedSilos`. `World.spraySilos`. `World.produceSilos`. `World.vehicles`. `World.trailers`. `World.nextVehicleId`. `World.nextTrailerId`. `now`, `dispatch` / `apply`, `log`, `rng`. `tickTree` dirty `'field'` only on visual stage change — [[mechanics/trees]]. No `World.actor` / `hand` / `inventory` / `queue` / `place` |
| `mp.ts` | `PROTOCOL`, `MpMsg`, `MpWire`, `MpHost`, `MpGuest`, loopback, digest, sequencer / permissions. No PeerJS. [[architecture/net]] |
| `save.ts` | `Save`, `dump` / `parse` / slot I/O. Snapshot, not `Cmd[]`. App does not own `Save`. [[architecture/save]] |
| `tutorial.ts` | Session check. Not a `World` field. Not in `Save`. [[mechanics/tutorial]] |
| `log.ts` | `Act`, `Cmd`, `XY`, `LogSink`, `MemorySink`, `WorkerSink` |
| `log.worker.ts` | worker JSON sink. Does not apply cmds. Does not own `World`. |
| `plot.ts` | `Cell`, `Plot`, `Tilled`, `Cover`, `Ground`. `Cell` += mill jam still barrel freezer hangar `silo-seed` `silo-spray` `silo-produce` |
| `soil.ts` | `Soil` |
| `plant.ts` | `Plant`, `Weed`, `Doom`. `Plant.crop: AnnualId`. `Plant.tended` |
| `water.ts` | `Reservoir`, `SourceKind`, `pull()` |
| `stall.ts` | `StallGood`, `StallMap`, `StallSale` |
| `building.ts` | `House`, `Pump` (`starter` / `jack`, no `well`), `RainTank`, `Tap`, `Rock`, `Tree`, `Chest`, `Grinder`, `CompostBox`, `Truck`, `Mill`, `JamMachine`, `PotStill`, `WineBarrel`, `Freezer`, `Hangar`, `SiloSeed`, `SiloSpray`, `SiloProduce`, `Coord`, `Base` |
| `pipe.ts` | `Edge`, `Vertex`, `Segment`, `Sprinkler`, `Well`, `Tune`, `Gate` |
| `actor.ts` | `Actor` |
| `clock.ts` | `Clock`, `DAY_SECONDS` |
| `item.ts` | `Item`, `Hand`, `Slot`, `Face`. Sapling, sugar liters, spirit, wine, jam, oil, flour, extract. Face += mill jam still barrel freezer hangar `silo-seed` `silo-spray` `silo-produce`. No `apple-tree` / `berry` / `shrub`. Box cargo: no berry arm. No fuel item |
| `prompt.ts` | `Prompt`, `PromptHit` |
| `look.ts` | `lookText` — HUD copy, read-only on `World` |
| `drop.ts` | `Drop` |
| `gen.ts` | `generateChunk` |
| `noise.ts` | `goodness`, `groundOf` |
| `modifiers.ts` | `Modifier`, `Stats`. `source` includes `'skill'`. `statsOf` uses `CropDef.saleMul` when present, else `RARITY_SALE` |
| `rng.ts` | `hash`, `rollRarity`, `Rng`, `Spatial`, `Seq`, `StreamId` |
| `machine.ts` | mill recipes, feed helpers, rarity mean, sale bake. No `World`. [[mechanics/machines]] |
| `vehicle.ts` | `Vehicle`, `Trailer`, `Drive`, `VehiclePose`, `TrailerPose`, `surfaceMul`, `hangarPad`, `padCenter`, `hitchP`, `trailerCenter`, `followHitch`, `boomHits`, `seekSpeed`, `integrateVehicle`. No `World`. No `Dismount`. [[mechanics/vehicles]] |

`ui` and `view` call `World` methods. They do not construct `Soil` / `Plant` / `Reservoir` / `StallGood`.

## ui

Function components. Play chrome reads `World`. Do not tick. Do not own `Cell` or `Place`. Startup [[ui/menu]] has no `World`.

| file | chrome |
|---|---|
| `frame.tsx` | `Dock`, `Chrome`, `Coin`, `Btn`. Coin faces are `<use href={symHref(...)}>`. |
| `callout-hover.tsx` | `CalloutHover` — Chrome card off the right of a panel |
| `hud.tsx` | clock, build ribbon, docks, Multiplayer face, pause, gear. `FaceBtn` / `IconButton` faces are `<use href={symHref(...)}>`. Phase icon: `paintMotion` owns it; Hud must not also innerHTML `UI_PHASE` every render. |
| `menu.tsx` | startup / in-play gear shell. Menu-local `MenuPage` (home / changelog). Owns changelog open/close. [[ui/menu]] [[architecture/changelog]] |
| `changelog.tsx` | `ChangeKind` `Change` `Release` `RELEASES` `Changelog` body. Not a `Panel`. Not `Overlay`. [[architecture/changelog]] |
| `multiplayer.tsx` | join / host / guest dialogs, catching-up overlay. [[ui/multiplayer]] |
| `tutorial.tsx` | tour card. [[ui/tutorial]] |
| `lens.tsx` | lens dock. [[ui/lens]] |
| `status.tsx` | look line |
| `held.tsx` | hand / item face |
| `queue.tsx` | intent queue |
| `shop.tsx` | `World.buy` |
| `cheat.tsx` | `unlockAll` / `cheatMoney` / `cheatPoints` / `toggleCheatResearch` |
| `research.tsx` | `World.startResearch` |
| `market.tsx` | stall overlay; **Sell all** |
| `inventory.tsx` | house slots |
| `chest.tsx` | chest slots |
| `almanac.tsx` | catalog |
| `objecthud.tsx` | sprinkler tune |
| `hangar.tsx` | hangar cue: buy Quad / Tractor / trailers / list all owned / Deploy (stored vehicle; tractor hitch optional) / Refill. No 6-slot. No cargo |
| `vehicle.tsx` | parked Quad: 6 slots + Embark. parked tractor: trailer cargo if hitched + Embark |
| `recap.tsx` | end-of-day; `dismissRecap()` |
| `family.tsx` | family overlay; `offers` / `pickSkill` |

Panel open/close is App-local. Changelog open/close is Menu-local, not a `Panel` arm. `Seat.cue` is how sim asks App to open inventory, a chest, a store, a hangar, or a parked vehicle. Hangar and parked-vehicle panels are those cues, not `HudTarget`. Silo cells are look name only — no cue.

## view

SVG world. Camera and `Lens` are view-local, not `World` fields. Camera follow is view-local, not sim — follows local seat actor (tracks vehicle while driver). Hide gardener while seated is view. Hat color is view. `Lens` includes `land`. Water lens requires husband `water-study`; `land` requires `land-study` — [[architecture/family]].

| file | owns |
|---|---|
| `camera.ts` | `Camera`, `TILE` |
| `map.tsx` | `MapView`, `Lens` (`off` `water` `ripe` `kind` `rarity` `pipes` `land`); paints `Cell`; paints field quad / tractor / attached trailer; hit → `PromptHit`. Ground bake: one `<g><use>` per tile, clipped to bounds±FADE (same skip as `chunkSig`). Unowned fade tiles use `groundArt` at 0.65/0.35. Cache by content signature. `groundRev` tracks **painted** ground only (tile / hard / very-hard / infertile / grass). Tilling a grass cell does not rebake — dirt is Marks `PlotGfx`. Rebake one chunk on `groundRev`. Clear `bakedChunks` on `World` identity change. Pointer world-coords use a cached SVG box; no `getBoundingClientRect` on the rAF path. Clip only; do not flatten ground to canvas/image. Marks render per-entity memo components keyed by cell; props are primitives so unchanged entities skip DOM writes. Thirst / fert / fresh / compost bar rects are shells; widths come from `motion.ts` only. Actor body is `<use href={symHref(ACTOR)}>`. Hat CSS `--hat` on parent `g`. No actor innerHTML. Hangar + silo pad arrows view-only, local driver only. |
| `motion.ts` | rAF paint of actor / meters. Registry not DOM scans: `bindBar(kind, at, el)` for plot + compost bars, `bindActor(id, el)` for seats. `paintMotion(root, world)` signature unchanged. Owns `[data-day-bar]` width outright. Owns the phase glyph on `[data-phase]`. Hud must not also innerHTML `UI_PHASE` every render. Assumption: `paintMotion` paints `[data-phase]` from rAF; Hud does not seed `UI_PHASE`. |
| `svgs.ts` | inner SVG fragments. `symHref(html)` registers a fragment once into a hidden defs host and returns a `<use>` href; map view renders `<use>` clones, never re-parses fragments per instance. Hot fragments pre-registered at module init. |

Pipes and sprinklers are not cells. Map hits `Edge` / `Vertex` separately.

## net

PeerJS only here. Implements `MpWire`. [[architecture/net]]

| file | owns |
|---|---|
| `peer.ts` | PeerJS star. Default cloud broker + default STUN. No TURN. |

## Owners

| unit | owner |
|---|---|
| `World` | class `sim/world.ts`. App holds the instance or none. `World.seats`. Family state is `World.family`, not a class. |
| `Seat` | on `World.seats`. `id`, `playerId`, `actor`, `hand`, `inventory`, `queue`, `presence`, `place`, `drive`. |
| `Soil` | class `sim/soil.ts`. Required field on every `Tilled` plot. |
| `Plant` | class `sim/plant.ts`. Required on `growing` / `ripe` / `dead`. `crop: AnnualId`. |
| `Tree` | class `sim/building.ts`. Same instance in both 1×2 cells. |
| `Reservoir` | class `sim/water.ts`. `Pump.water`, `RainTank.water`. Not on `Tap`. |
| `Stall` | `StallGood` in `sim/stall.ts`. `World.stall: StallMap` — one good per `StallGoodId`. |
| `Place` | type on `sim/world.ts`. Field `Seat.place`. Always a `Place`, never missing. |
| `MpWire` | `sim/mp.ts` type. Loopback there. PeerJS in `net/peer.ts` only. |
| `MpHost` / `MpGuest` | class `sim/mp.ts`. App holds the session. |

`World.house` / `World.truck` / `World.pumps` / `World.tanks` / `World.taps` / `World.stills` / `World.hangars` / `World.seedSilos` / `World.spraySilos` / `World.produceSilos` are the same instances stored in their cells. `World.vehicles` / `World.trailers` are lists, not cells.

`World.segments`, `World.wells` and `World.sprinklers` are the pipe graph. Not `Cell`. Wells sit on edges — [[mechanics/water]].

`World.fences` is the fence set. Not `Cell`. Not `Cover`. [[items/tiles]]

Tutorial is App session state. `sim/tutorial.ts` checks. Not a `World` field. [[mechanics/tutorial]] [[ui/tutorial]]

Save I/O is `sim/save.ts`. App does not own `Save`. [[architecture/save]]

Chest, grinder, compost box, mill, jam, still, barrel, freezer, hangar, silo-seed, silo-spray, silo-produce, rock, tree: cell only. No shrub. [[architecture/tree]] for the 1×2 footprint. Still also in `World.stills` for the water grid. Hangar also in `World.hangars`. Silos also in their arrays. Quad / tractor are `World.vehicles`. Trailers are `World.trailers`. Not cells.
