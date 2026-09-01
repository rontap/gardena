# Modules

`src/game/` is `defs`, `sim`, `ui`, `view`, `net`. `src/App.tsx` holds one [[architecture/world]] `World` or none, the panel union, `App.local: SeatId`, the MP session, and the `DT_MAX` accumulator. Startup [[ui/menu]]: no `World`. Play: holds `World` and ticks it. It does not own `Cell`.

`defs` are tables. `sim` is the game. `ui` is React chrome. `view` is the SVG camera. `net` is PeerJS. `World` does not import `peerjs`. Numbers live in defs; do not duplicate them in notes. Ids: `sim/ids.ts`.

## defs

| file | owner |
|---|---|
| `crops.ts` | `CROPS` |
| `trees.ts` | `TREES`, `TREE_YIELD_*` |
| `items.ts` | tool / container / machine / vehicle / sensor hold constants |
| `rarity.ts` | `Rarity` tables |
| `research.ts` | `RESEARCH`, `SKUS` |
| `skills.ts` | `SKILLS` |
| `catalog.ts` | almanac SKU `CatalogEntry` |
| `shelf.ts` | `BuildShelfId` |
| `companies.ts` | `COMPANIES` book — [[mechanics/contracts]] |

## sim

| file | owner |
|---|---|
| `world.ts` | `World`, `Seat`, tick, dispatch / apply, indexes / `track` |
| `mp.ts` | `PROTOCOL`, sequencer, digest — [[architecture/net]] |
| `save.ts` | `Save`, dump / parse — [[architecture/save]] |
| `tutorial.ts` | session check — [[mechanics/tutorial]] |
| `log.ts` | `Act`, `Cmd` |
| `log.worker.ts` | worker JSON sink |
| `plot.ts` | `Cell`, `Plot` |
| `soil.ts` | `Soil` |
| `plant.ts` | `Plant`, `Weed` |
| `water.ts` | `Reservoir`, `pull()` |
| `stall.ts` | `StallGood` |
| `market.h.ts` | sat / contract typedefs |
| `market.ts` | sat helpers, `rollBoard` |
| `building.ts` | buildings, `Tree`, `Hangar`, stores |
| `pipe.ts` | `Edge`, `Sprinkler`, `Gate` |
| `actor.ts` | `Actor` |
| `clock.ts` | `Clock` |
| `item.ts` | `Item`, `Hand`, `Face` |
| `prompt.ts` | `Prompt` |
| `look.ts` | `lookText` |
| `drop.ts` | `Drop` |
| `gen.ts` | `generateChunk` |
| `noise.ts` | `goodness` |
| `modifiers.ts` | `Modifier`, `statsOf` |
| `rng.ts` | `Rng`, streams |
| `machine.ts` | mill recipes, sale bake, grind hopper accept, machine west/east |
| `vehicle.ts` | `Vehicle`, `Trailer`, `Route`, `RouteStop`, integrate |
| `sensor.ts` | `Sensor`, `Wire`, `evalDag`, traffic light |

## ui

| file | owner |
|---|---|
| `frame.tsx` | `Dock`, `Chrome`, `Coin`, `Btn` |
| `callout-hover.tsx` | `CalloutHover` |
| `hud.tsx` | clock, ribbon, docks, pause, gear |
| `menu.tsx` | startup / gear shell, `MenuPage` |
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
| `cheat.tsx` | `unlockAll` / cheats |
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

Panel open/close is App-local. Changelog open/close is Menu-local, not a `Panel` arm. `Seat.cue` opens inventory, chest, store, hangar, or parked vehicle. Silo cells are look name only.

## view

Camera and `Lens` are view-local, not `World` fields. Camera follow is view-local. Water lens requires husband `water-study`; `land` requires `land-study`. `sensors` unhidden after `unlock-sensors`. `vehicles` unhidden after `unlock-vehicles`. Wires sim-state always; paint and port hit view-gated on `sensors`.

| file | owner |
|---|---|
| `camera.ts` | `Camera`, `TILE` |
| `map.tsx` | `MapView`, `Lens`, paints `Cell` |
| `motion.ts` | rAF paint of actor / meters / FPS |
| `vfx.ts` | `VfxDef` table |
| `svgs.ts` | inner SVG fragments |

Pipes and sprinklers are not cells. Map hits `Edge` / `Vertex` separately.

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
| `Plant` | `sim/plant.ts`. `crop: AnnualId` |
| `Tree` | `sim/building.ts`. Same instance in both 1×2 cells |
| `Reservoir` | `sim/water.ts`. `Pump.water`, `RainTank.water` |
| `Stall` | `sim/stall.ts`. `World.stall` complete `StallGoodId` map |
| `Place` | `Seat.place`. Always a `Place` |
| `MpWire` | `sim/mp.ts` type. PeerJS in `net/peer.ts` only |
| `MpHost` / `MpGuest` | `sim/mp.ts`. App holds the session |

`World.house` / `truck` / `pumps` / `tanks` / `taps` / `stills` / `waterSystems` / `hangars` / field silos / `silo` / `additives` are the same instances stored in their cells. `World.vehicles` / `World.trailers` / `World.routes` are lists, not cells. `World.wires` is the signal graph. `tickDispatch` on `world.ts` after `evalDag`. `World.segments`, `World.wells`, `World.sprinklers` are the pipe graph. Wells sit on edges. Smart valve is a `Gate` on a segment. `World.fences` is the fence set.

Tutorial is App session state. Save I/O is `sim/save.ts`. App does not own `Save`.
