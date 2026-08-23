# Modules

`src/game/` is `defs`, `sim`, `ui`, `view`, `net`. `src/App.tsx` holds one [[architecture/world]] `World` or none, the panel union, `App.local: SeatId`, and the `DT_MAX` accumulator. Startup [[ui/menu]]: no `World`. Play: holds `World` and ticks it. It does not own `Cell`.

`defs` are tables. `sim` is the game. `ui` is React chrome. `view` is the SVG camera. `net` is PeerJS. `World` does not import `peerjs`.

## defs

No `World`. No tick. Numbers and copy live here; do not duplicate them in notes.

| file | owns |
|---|---|
| `crops.ts` | `CropDef`, `CROPS`. Sale / rot / desc / class / seed / tols / `waterUsePerSec`. Trees: `waterUsePerSec = 0`. `CropDef.saleMul` optional `{ [Rarity]: number }`; absent → `RARITY_SALE`. Vanilla only. |
| `trees.ts` | `TREES`, `TREE_YIELD_DAYS`, `TREE_YIELD_MUL`, `TREE_OFF_MUL`. `TREES[TreeId] = { juvenileSeconds, fruitSeconds }` |
| `items.ts` | tool, container, box, fert, compost, sprinkler constants |
| `rarity.ts` | `Rarity`, sale / grow / rot / weight tables |
| `research.ts` | `RESEARCH`, `SKUS`; `Sku.tab` |
| `skills.ts` | `SKILLS`, `SkillDef`, `TEND_WORK` |
| `catalog.ts` | almanac `CatalogEntry` keyed by `Face` |

`sim/ids.ts` owns id unions (`AnnualId`, `TreeId`, `CropId`, `SkuId`, `ResearchId`, `StallGoodId`, `MemberId`, `PlayerSkillId`, `HusbandSkillId`, `DaughterSkillId`, …). defs import those ids.

`CropId = AnnualId | TreeId`. `StallGoodId = CropId | 'sugar'`. No `'berry'`. `ResearchId` += `unlock-grape` `unlock-olive` `unlock-fermentation`. No `unlock-vanilla`. `SkuId` += `pack-grape` `pack-olive` `pack-vanilla` `pack-sugar-cane`. `pack-vanilla.need` is `vanilla-tending`.

No `bump-*` research ids. No `sale-mul` research effect. Better-crop is player skills — [[architecture/family]]. `unlock-heirloom` is plants `feature`, gates Őstermelő.

## sim

Classes for game objects. Tick and mutation stay here.

| file | owns |
|---|---|
| `world.ts` | `World`, `Seat`, `SeatId`, `Presence`, `PlayerId`, `Intent`, `Place`, `StayArmed`, `Cue`, `Speech`, `Seam`, `Net`, `Family`, `dest()`. `World.seats`. `now`, `dispatch` / `apply`, `log`, `rng`. No `World.actor` / `hand` / `inventory` / `queue` / `place` |
| `mp.ts` | `PROTOCOL`, `MpMsg`, `MpWire`, loopback, digest, sequencer / permissions. No PeerJS. [[architecture/net]] |
| `save.ts` | `Save`, `dump` / `parse` / slot I/O. Snapshot, not `Cmd[]`. App does not own `Save`. [[architecture/save]] |
| `tutorial.ts` | Session check. Not a `World` field. Not in `Save`. [[mechanics/tutorial]] |
| `log.ts` | `Act`, `Cmd`, `XY`, `LogSink`, `MemorySink`, `WorkerSink` |
| `log.worker.ts` | worker JSON sink. Does not apply cmds. Does not own `World`. |
| `plot.ts` | `Cell`, `Plot`, `Tilled`, `Cover`, `Ground` |
| `soil.ts` | `Soil` |
| `plant.ts` | `Plant`, `Weed`, `Doom`. `Plant.crop: AnnualId`. `Plant.tended` |
| `water.ts` | `Reservoir`, `SourceKind`, `pull()` |
| `stall.ts` | `StallGood`, `StallMap`, `StallSale` |
| `building.ts` | `House`, `Pump` (`starter` / `jack`, no `well`), `RainTank`, `Tap`, `Rock`, `Tree`, `Chest`, `Grinder`, `CompostBox`, `Truck`, `Coord`, `Base` |
| `pipe.ts` | `Edge`, `Vertex`, `Segment`, `Sprinkler`, `Well`, `Tune`, `Gate` |
| `actor.ts` | `Actor` |
| `clock.ts` | `Clock`, `DAY_SECONDS` |
| `item.ts` | `Item`, `Hand`, `Slot`, `Face`. Sapling, sugar. No `apple-tree` / `berry` / `shrub`. Box cargo: no berry arm |
| `prompt.ts` | `Prompt`, `PromptHit` |
| `look.ts` | `lookText` — HUD copy, read-only on `World` |
| `drop.ts` | `Drop` |
| `gen.ts` | `generateChunk` |
| `noise.ts` | `goodness`, `groundOf` |
| `modifiers.ts` | `Modifier`, `Stats`. `source` includes `'skill'`. `statsOf` uses `CropDef.saleMul` when present, else `RARITY_SALE` |
| `rng.ts` | `hash`, `rollRarity`, `Rng`, `Spatial`, `Seq`, `StreamId` |

`ui` and `view` call `World` methods. They do not construct `Soil` / `Plant` / `Reservoir` / `StallGood`.

## ui

Function components. Play chrome reads `World`. Do not tick. Do not own `Cell` or `Place`. Startup [[ui/menu]] has no `World`.

| file | chrome |
|---|---|
| `frame.tsx` | `Dock`, `Chrome`, `Coin`, `Btn` |
| `callout-hover.tsx` | `CalloutHover` — Chrome card off the right of a panel |
| `hud.tsx` | clock, build ribbon, docks, pause, gear |
| `menu.tsx` | startup / in-play gear shell. [[ui/menu]] |
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
| `recap.tsx` | end-of-day; `dismissRecap()` |
| `family.tsx` | family overlay; `offers` / `pickSkill` |

Panel open/close is App-local. `World.cue` is how sim asks App to open inventory or a chest.

## view

SVG world. Camera and `Lens` are view-local, not `World` fields. `Lens` includes `land`. Water lens requires husband `water-study`; `land` requires `land-study` — [[architecture/family]].

| file | owns |
|---|---|
| `camera.ts` | `Camera`, `TILE` |
| `map.tsx` | `MapView`, `Lens` (`off` `water` `ripe` `kind` `rarity` `pipes` `land`); paints `Cell`; hit → `PromptHit` |
| `motion.ts` | rAF paint of actor / meters |
| `svgs.ts` | inner SVG fragments |

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
| `Seat` | on `World.seats`. `id`, `playerId`, `actor`, `hand`, `inventory`, `queue`, `presence`, `place`. |
| `Soil` | class `sim/soil.ts`. Required field on every `Tilled` plot. |
| `Plant` | class `sim/plant.ts`. Required on `growing` / `ripe` / `dead`. `crop: AnnualId`. |
| `Tree` | class `sim/building.ts`. Same instance in both 1×2 cells. |
| `Reservoir` | class `sim/water.ts`. `Pump.water`, `RainTank.water`. Not on `Tap`. |
| `Stall` | `StallGood` in `sim/stall.ts`. `World.stall: StallMap` — one good per `StallGoodId`. |
| `Place` | type on `sim/world.ts`. Field `Seat.place`. Always a `Place`, never missing. |
| `MpWire` | `sim/mp.ts` type. Loopback there. PeerJS in `net/peer.ts` only. |

`World.house` / `World.truck` / `World.pumps` / `World.tanks` / `World.taps` are the same instances stored in their cells.

`World.segments`, `World.wells` and `World.sprinklers` are the pipe graph. Not `Cell`. Wells sit on edges — [[mechanics/water]].

`World.fences` is the fence set. Not `Cell`. Not `Cover`. [[items/tiles]]

Tutorial is App session state. `sim/tutorial.ts` checks. Not a `World` field. [[mechanics/tutorial]] [[ui/tutorial]]

Save I/O is `sim/save.ts`. App does not own `Save`. [[architecture/save]]

Chest, grinder, compost box, rock, tree: cell only. No shrub. [[architecture/tree]] for the 1×2 footprint.
