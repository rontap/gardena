# Modules

`src/game/` is `defs`, `sim`, `ui`, `view`, `net`. `src/App.tsx` holds one [[architecture/world]] `World` or none, the panel union, `App.local: SeatId`, the MP session, and the `DT_MAX` accumulator. Startup [[ui/menu]]: no `World`. Play: holds `World` and ticks it. It does not own `Cell`.

`defs` are tables. `sim` is the game. `ui` is React chrome. `view` is the SVG camera. `net` is PeerJS. `World` does not import `peerjs`.

## defs

No `World`. No tick. Numbers and copy live here; do not duplicate them in notes.

| file | owns |
|---|---|
| `crops.ts` | `CropDef`, `CROPS`. Sale / rot / desc / class / seed / tols / `waterUsePerSec`. Trees: `waterUsePerSec = 0`. `CropDef.saleMul` optional `{ [Rarity]: number }`; absent → `RARITY_SALE`. Vanilla only. |
| `trees.ts` | `TREES`, `TREE_YIELD_DAYS`, `TREE_YIELD_MUL` 3.5, `TREE_OFF_MUL` 0.75. `TREES[TreeId] = { juvenileSeconds, fruitSeconds }` |
| `items.ts` | tool, container, box, fert, compost, weed-spray, sprinkler, mill / jam / still / barrel / freezer / sugar / quad / tractor / trailer / hangar / silo / surface / sensor price and hold constants. `PULSER_PRICE` `COUNTER_PRICE` `SENSOR_DAY_PRICE` `COUNTER_MAX` `QUAD_VMAX` 8 `STILL_WATER` 0.5 `COMPOST_SECONDS` 90 |
| `rarity.ts` | `Rarity`, sale / grow / rot / weight tables |
| `research.ts` | `RESEARCH`, `SKUS`; `Sku.tab`; `Sku.need` required. `unlock-advanced-sensors` `unlock-contracts` |
| `skills.ts` | `SKILLS`, `SkillDef`, `TEND_WORK`. `haggling` `broker` `industrial`. No husband `contracts` |
| `catalog.ts` | almanac SKU `CatalogEntry` keyed by `Face`. Sensor + smart-valve entries exist. Game concepts are not `CatalogEntry`. Overview is not `CatalogEntry`. |
| `shelf.ts` | `BuildShelfId` += `'logic'`. Shelf **Sensors** |
| `companies.ts` | `COMPANIES` book. mix, pool, eligible. [[mechanics/contracts]] |

`sim/ids.ts` owns id unions (`AnnualId`, `TreeId`, `CropId`, `SkuId`, `ResearchId`, `StallGoodId`, `SpiritKind`, `JamCrop`, `StillCrop`, `MillRecipe`, `VehicleKind`, `VehicleId`, `VehicleSlot`, `TrailerKind`, `TrailerId`, `HarvestSlot`, `SensorKind`, `MemberId`, `PlayerSkillId`, `HusbandSkillId` `haggling`, `DaughterSkillId` `broker`, …). defs import those ids.

`CropId = AnnualId | TreeId`. `StallGoodId = CropId | 'sugar' | SpiritKind | 'wine' | JamId | 'oil' | 'flour' | 'extract'`. No `'berry'`. `ResearchId` += `unlock-grape` `unlock-olive` `unlock-fermentation` `unlock-preservatives` `unlock-vehicles` `unlock-sensors` `unlock-advanced-sensors` `unlock-smart-irrigation` `unlock-contracts`. No `unlock-vanilla`. No `unlock-mill` `unlock-jam` `unlock-still` `unlock-barrel` `unlock-freezer`. `SkuId` += `pack-grape` `pack-olive` `pack-vanilla` `pack-sugar-cane` `buy-mill` `buy-jam` `buy-still` `buy-barrel` `buy-freezer` `buy-sugar` `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` `buy-weed-spray` `buy-lever` `buy-button` `buy-lamp` `buy-or` `buy-and` `buy-not` `buy-pulser` `buy-counter` `buy-sensor-water` `buy-sensor-fert` `buy-sensor-harvest` `buy-sensor-day` `buy-water-system` `buy-smart-valve` `buy-vehicle-detector`. No Quad SKU. No tractor SKU. No trailer SKU. No germ / weather / wire SKU. `pack-vanilla.need` is `vanilla-tending`. `Sku.need` required `ResearchId | 'vanilla-tending' | 'none'`.

No `bump-*` research ids. No `sale-mul` research effect. Better-crop is player skills — [[architecture/family]]. `unlock-heirloom` is plants `feature`, gates Őstermelő.

## sim

Classes for game objects. Tick and mutation stay here.

| file | owns |
|---|---|
| `world.ts` | `World`, `Seat`, `SeatId`, `Presence`, `PlayerId`, `Intent`, `Place`, `StayArmed`, `Cue`, `Speech`, `Seam`, `Net`, `Family`, `dest()`. `World.seats`. `Seat.stride`. `World.contracts`. `World.stills`. `World.waterSystems`. `World.wires`. `World.smartHold`. `World.hangars`. `World.seedSilos`. `World.spraySilos`. `World.produceSilos`. `World.silo`. `World.additives`. `World.vehicles`. `World.trailers`. `World.nextVehicleId`. `World.nextTrailerId`. `World.vfx` (sprinkler pouring, written by `tickWater`, read by the view). `World.bursts` + `drainBursts` — view-drained, not in `Save`, not in the digest. `World.marketQuote()`. `now`, `dispatch` / `apply`, `log`, `rng`. tick: sat recover every `dt` every `StallGoodId` → miss due contracts → field → `evalDag` → mill/jam/still unless `inn === 1` → water. stride per in-seat not-driver. `tickTree` dirty `'field'` only on visual stage change — [[mechanics/trees]]. Consign fill, accept / cancel / reorder. No `World.actor` / `hand` / `inventory` / `queue` / `place`. No `World.sales`. No `DYNAMIC_MARKET`. No `nudgeOffered`. `contracts` live only — not in `Save` |
| `mp.ts` | `PROTOCOL` 1.72, `MpMsg`, `MpWire`, `MpHost`, `MpGuest`, loopback, digest, sequencer / permissions. `GUEST_BUILD` += fourteen sensor-cell SKUs (incl. vehicle detector, pulser, counter, day). permit `placeWire` / `placeSmartValve` / sensor HUD / `tuneCounter` `tuneDay` / `stride` / `load` `unload` except guest chest/freezer. Guest `placePipe` still not. Guest `acceptContract` / `cancelContract` / `reorderContract` dropped, never in a bundle. Guest consign fills bins. Digest: every `StallGood.sat`; per active `offer.id` `dueDay` each bin `filled`; `takenToday`. Board not digested. No PeerJS. Sequential wire feedback. [[architecture/net]] |
| `save.ts` | `Save`, `dump` / `parse` / slot I/O. `SAVE_VERSION` 1.72. Snapshot, not `Cmd[]`. App does not own `Save`. [[architecture/save]] |
| `tutorial.ts` | Session check. Not a `World` field. Not in `Save`. [[mechanics/tutorial]] |
| `log.ts` | `Act`, `Cmd`, `XY`, `LogSink`, `MemorySink`, `WorkerSink`. `Act.setBoom` `armWire` `placeWire` `placeSmartValve` `tuneWater` `tuneHarvest` `tuneCounter` `tuneDay` `stride` `load` `unload` `acceptContract` `'J'` `cancelContract` `'Y'` `reorderContract` `'Z'`. `Act.delete` += `wire` `smart`. No `Act.nudgeOffered` |
| `log.worker.ts` | worker JSON sink. Does not apply cmds. Does not own `World`. |
| `plot.ts` | `Cell`, `Plot`, `Tilled`, `Cover`, `Ground`. `Cell` += mill jam still barrel freezer hangar `silo-seed` `silo-spray` `silo-produce` `seed-silo` `additive-store` every `SensorKind`. `isSolid` += those |
| `soil.ts` | `Soil`. `weedChance` required |
| `plant.ts` | `Plant`, `Weed`, `Doom`. `Plant.crop: AnnualId`. `Plant.tended`. `Weed.spread` |
| `water.ts` | `Reservoir`, `SourceKind`, `pull()` |
| `stall.ts` | `StallGood.sat`, `StallMap`. No `offered`/`market`/`target`/`acc`. No `rate()`. No `StallSale` |
| `market.h.ts` | typedef only. `SAT_*` `MarketQuote` `SellAllQuote` `CompanyId` `GoodClass` `ContractOffer` `Demand` `Lines` `Active` `RollBoard` `Accepts` `CancelFee` `MissPenalty` `declare const`. No values |
| `market.ts` | valued `SAT_*` + sat helpers `mul` `paid` `recover`. Generator constants + `rollBoard` + `cleanUnit` + `Accepts` + `cancelFee` + `missPenalty`. No `World`. [[mechanics/saturation]] [[mechanics/contracts]] |
| `building.ts` | `House`, `Pump` (`starter` / `jack`, no `well`), `RainTank`, `Tap`, `Rock`, `Tree`, `Chest` `out` `hold`, `Grinder`, `CompostBox`, `Truck`, `Mill` `inn`, `JamMachine` `inn`, `PotStill` 2×1 `inn` prop `48×24`, `WineBarrel`, `Freezer` `out` `hold`, `Hangar`, `SiloSeed`, `SiloSpray`, `SiloProduce`, `SeedSilo` `out` `hold`, `AdditiveStore` `out` `hold`, `Coord`, `Base` |
| `pipe.ts` | `Edge`, `Vertex`, `Segment`, `Sprinkler`, `Well`, `Tune`, `Gate`. `Gate` += `{ kind: 'smart' }` |
| `actor.ts` | `Actor` |
| `clock.ts` | `Clock`, `DAY_SECONDS` |
| `item.ts` | `Item`, `Hand`, `Slot`, `Face`. Sapling, sugar liters, spirit, wine, jam, oil, flour, extract, weed-spray. Face += mill jam still barrel freezer hangar `silo-seed` `silo-spray` `silo-produce` each sensor SKU + `smart-valve` + pulser counter day. No `apple-tree` / `berry` / `shrub`. Box cargo: no berry arm. Box cargo weed. No fuel item. Illegal: `weed-spray.usesLeft` 0 as held |
| `prompt.ts` | `Prompt`, `PromptHit` |
| `look.ts` | `lookText` — HUD copy, read-only on `World` |
| `drop.ts` | `Drop` |
| `gen.ts` | `generateChunk` |
| `noise.ts` | `goodness`, `groundOf` |
| `modifiers.ts` | `Modifier`, `Stats`. `source` includes `'skill'`. `statsOf` uses `CropDef.saleMul` when present, else `RARITY_SALE` |
| `rng.ts` | `hash`, `rollRarity`, `Rng`, `Spatial`, `Seq`, `StreamId` |
| `machine.ts` | mill recipes, feed helpers, rarity mean, sale bake. No `World`. [[mechanics/machines]] |
| `vehicle.ts` | `Vehicle`, `Trailer`, `Drive`, `VehiclePose`, `TrailerPose`, `surfaceMul`, `hangarPad`, `dropoffPad`, `takeupPad`, `padCenter`, `hitchP`, `trailerCenter`, `followHitch`, `boomHits` (takes width), `seekSpeed`, `integrateVehicle`. Tractor `boom: 3 | 5`. No `World`. No `Dismount`. [[mechanics/vehicles]] |
| `sensor.ts` | `Sensor` classes (incl. `Pulser` `Counter` `DaySensor`; lever `inn` `prev`), `Wire`, `WireEnd`, ports, `ownsPort` += mill/jam/still/chest/freezer/seed-silo/additive-store, `wouldCycle`, `evalDag`, `area3`, hold, reader raw, `pourEligible`, counter dial group. No `World`. [[mechanics/sensors]] |

`ui` and `view` call `World` methods. They do not construct `Soil` / `Plant` / `Reservoir` / `StallGood`.

## ui

Function components. Play chrome reads `World`. Do not tick. Do not own `Cell` or `Place`. Startup [[ui/menu]] has no `World`.

| file | chrome |
|---|---|
| `frame.tsx` | `Dock`, `Chrome`, `Coin`, `Btn`. Coin faces are `<use href={symHref(...)}>`. Not `AlmanacLink`. |
| `callout-hover.tsx` | `CalloutHover` — Chrome card off the right of a panel |
| `hud.tsx` | clock, build ribbon, docks, Multiplayer face, pause, gear. Remaining expand permits and skill points from `expandLeft()` and `World.points` — derived, not new state. `FaceBtn` / `IconButton` faces are `<use href={symHref(...)}>`. Phase icon: `paintMotion` owns it; Hud must not also innerHTML `UI_PHASE` every render. |
| `menu.tsx` | startup / in-play gear shell. Menu-local `MenuPage` (home / changelog). Owns changelog open/close. [[ui/menu]] [[architecture/changelog]] |
| `changelog.md` | player copy. Shipped. Not `docs/`. Only `RELEASES` source. Drafts `changelogs-*.md` beside it are not sources; do not import. |
| `changelog.ts` | `ChangeKind` `Change` `Release` `KIND_EMOJI` `parseChangelog` `ChangelogParseError` `RELEASES`. `import src from './changelog.md?raw'`. |
| `changelog.tsx` | `Changelog` body only. Imports `RELEASES` / `KIND_EMOJI`. No copy. Not a `Panel`. Not `Overlay`. [[architecture/changelog]] |
| `multiplayer.tsx` | join / host / guest dialogs, catching-up overlay. [[ui/multiplayer]] |
| `tutorial.tsx` | tour card. [[ui/tutorial]] |
| `lens.tsx` | lens dock. `Lens` += `sensors` `vehicles`. [[ui/lens]] |
| `status.tsx` | look line |
| `held.tsx` | hand / item face |
| `queue.tsx` | intent queue |
| `shop.tsx` | `World.buy` |
| `cheat.tsx` | `unlockAll` / `cheatMoney` / `cheatPoints` / `toggleCheatResearch` |
| `research.tsx` | `World.startResearch` |
| `market.tsx` | overlay Stall \| Contracts; stall **Sell all**. [[ui/market]] [[ui/contracts]] |
| `inventory.tsx` | house slots |
| `chest.tsx` | chest slots |
| `almanac.tsx` | Overview on Seeds / Sensors / Automation, catalog SKUs, Game concepts, `AlmanacLink` |
| `objecthud.tsx` | sprinkler tune. water / harvest / counter / day sensor HUD |
| `hangar.tsx` | hangar cue: buy Quad / Tractor / trailers / list all owned / Deploy (stored vehicle; tractor hitch optional) / Refill. No 6-slot. No cargo |
| `vehicle.tsx` | parked Quad: 6 slots + Embark. parked tractor: trailer cargo if hitched + Embark |
| `recap.tsx` | end-of-day; `dismissRecap()` |
| `family.tsx` | family overlay; `offers` / `pickSkill` |

Panel open/close is App-local. Changelog open/close is Menu-local, not a `Panel` arm. `Seat.cue` is how sim asks App to open inventory, a chest, a store, a hangar, or a parked vehicle. Hangar and parked-vehicle panels are those cues, not `HudTarget`. Silo cells are look name only — no cue.

## view

SVG world. Camera and `Lens` are view-local, not `World` fields. Camera follow is view-local, not sim — follows local seat actor (tracks vehicle while driver). Hide gardener while seated is view. Hat color is view. `Lens` includes `land` `sensors` `vehicles`. Water lens requires husband `water-study`; `land` requires `land-study` — [[architecture/family]]. `sensors` unhidden after `unlock-sensors`. `vehicles` unhidden after `unlock-vehicles`. Not a family-study row. leaveShop / Esc still only force pipes / sensors off. Driving still paints hangar-return + machine pad arrows with this lens off. Wires sim-state always; paint and port hit view-gated on `sensors` (armed sensor / smart-valve SKU forces this lens).

| file | owns |
|---|---|
| `camera.ts` | `Camera`, `TILE` |
| `map.tsx` | `MapView`, `Lens` (`off` `water` `ripe` `kind` `rarity` `pipes` `land` `sensors` `vehicles`); paints `Cell`; paints field quad / tractor / attached trailer; paints wires iff `sensors`; hit → `PromptHit`. Ground bake: one `<g><use>` per tile, clipped to bounds±FADE (same skip as `chunkSig`). Unowned fade tiles use `groundArt` at 0.65/0.35. Cache by content signature. `groundRev` tracks **painted** ground only (tile / hard / very-hard / infertile / grass). Tilling a grass cell does not rebake — dirt is Marks `PlotGfx`. Rebake one chunk on `groundRev`. Clear `bakedChunks` on `World` identity change. Pointer world-coords use a cached SVG box; no `getBoundingClientRect` on the rAF path. Clip only; do not flatten ground to canvas/image. Marks render per-entity memo components keyed by cell; props are primitives so unchanged entities skip DOM writes. Thirst / fert / fresh / compost bar rects are shells; widths come from `motion.ts` only. Actor body is `<use href={symHref(ACTOR)}>`. Hat CSS `--hat` on parent `g`. No actor innerHTML. Hangar + silo + machine pad arrows view-only, iff local driver OR `lens === 'vehicles'`. Same `HANGAR_RETURN` / `PAD_DROP` / `PAD_TAKE`. Driving still paints with this lens off. Pad opacity 0.5; 1 iff that pad action legal. Sensor lens dots on mill/jam/still/chest/freezer/seed-silo/additive-store ports; no prop nubs. |
| `motion.ts` | rAF paint of actor / meters. Registry not DOM scans: `bindBar(kind, at, el)` for plot + compost bars, `bindActor(id, el)` for seats. `paintMotion(root, world)` signature unchanged. Owns `[data-day-bar]` width outright. Owns the phase glyph on `[data-phase]`. Hud must not also innerHTML `UI_PHASE` every render. Assumption: `paintMotion` paints `[data-phase]` from rAF; Hud does not seed `UI_PHASE`. |
| `vfx.ts` | `VfxDef`, `VFX`, `VFX_REDUCED`. Frames via `groupInner`, pre-registered at init. Table only — no `World`. [[art/vfx]] |
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
| `Seat` | on `World.seats`. `id`, `playerId`, `actor`, `hand`, `inventory`, `queue`, `presence`, `place`, `drive`, `stride`. |
| `Soil` | class `sim/soil.ts`. Required field on every `Tilled` plot. `weedChance` required. |
| `Plant` | class `sim/plant.ts`. Required on `growing` / `ripe` / `dead`. `crop: AnnualId`. |
| `Tree` | class `sim/building.ts`. Same instance in both 1×2 cells. |
| `Reservoir` | class `sim/water.ts`. `Pump.water`, `RainTank.water`. Not on `Tap`. |
| `Stall` | `StallGood` in `sim/stall.ts`. `sat` `0..1`. `World.stall: StallMap` — one good per `StallGoodId`. |
| `Place` | type on `sim/world.ts`. Field `Seat.place`. Always a `Place`, never missing. |
| `MpWire` | `sim/mp.ts` type. Loopback there. PeerJS in `net/peer.ts` only. |
| `MpHost` / `MpGuest` | class `sim/mp.ts`. App holds the session. |

`World.house` / `World.truck` / `World.pumps` / `World.tanks` / `World.taps` / `World.stills` / `World.waterSystems` / `World.hangars` / `World.seedSilos` / `World.spraySilos` / `World.produceSilos` / `World.silo` / `World.additives` are the same instances stored in their cells. `World.vehicles` / `World.trailers` are lists, not cells. `World.wires` is the signal graph. Not `Cell`.

`World.segments`, `World.wells` and `World.sprinklers` are the pipe graph. Not `Cell`. Wells sit on edges. Smart valve is a `Gate` on a segment — [[mechanics/water]] [[mechanics/sensors]].

`World.fences` is the fence set. Not `Cell`. Not `Cover`. [[items/tiles]]

Tutorial is App session state. `sim/tutorial.ts` checks. Not a `World` field. [[mechanics/tutorial]] [[ui/tutorial]]

Save I/O is `sim/save.ts`. App does not own `Save`. [[architecture/save]]

Chest, grinder, compost box, mill, jam, still, barrel, freezer, hangar, silo-seed, silo-spray, silo-produce, seed-silo, additive-store, rock, tree, sensor cells: cell only. No shrub. [[architecture/tree]] for the 1×2 footprint. Still 2×1 prop `48×24` occupying both cells; also in `World.stills` for the water grid. Water-system also in `World.waterSystems`. Hangar also in `World.hangars`. Field silos also in their arrays. House `seed-silo` / `additive-store` are `World.silo` / `World.additives`. Quad / tractor are `World.vehicles`. Trailers are `World.trailers`. Wires are `World.wires`. Not cells. Pads are geometric.
