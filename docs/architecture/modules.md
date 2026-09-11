# Modules

`src/game/` is `defs`, `sim`, `ui`, `view`, `net`. `src/App.tsx` holds one [[architecture/world]] `World` or none, the panel union, App `recapDay`, `App.local: SeatId`, the MP session, and the `DT_MAX` accumulator (`frameDt * World.cheatSpeed`). No App `SPEED` 1–20. Startup [[ui/menu]]: no `World`. Play: holds `World` and ticks it. It does not own `Cell`.

`defs` are tables. `sim` is the game. `ui` is React chrome. `view` is the PixiJS v8 canvas world. HUD/panels stay React. `net` is PeerJS. `World` does not import `peerjs`. Numbers live in defs; do not duplicate them in notes. Ids: `sim/ids.ts`. Player strings: [[architecture/i18n]]. How a mechanic is layered: [[standards/mechanics]].

`World` is the live-state coordinator and tick sequencer. `track()` stays on `World`. Do not add `sim/index.ts`. New mechanic → new `sim/<name>.ts` or `sim/feature-<x>/`. Do not append a mechanic onto `World`. Pattern: types in `<name>.h.ts`, functions in `<name>.ts`; `World` holds lists and calls in.

`Place` / `StayArmed` stay on `world.ts`. Tutorial is App session state. Save I/O is `sim/feature-save/save.ts`. App does not own `Save`. Camera and `Lens` are view-local. Panel open/close is App-local. World has no pause field.

## Owners

| unit | owner |
|---|---|
| `World` | `sim/world.ts`. App holds the instance or none |
| `Seat` | `World.seats`. Construction `seat.ts`; local player `player.ts`; `world.ts` re-exports both |
| `Soil` | `sim/soil.ts`. Required on every `Tilled` plot |
| `Plant` | `sim/plant.ts`. `crop` excludes grass. `variety` `quality` required |
| `Tree` | `sim/building.ts`. Same instance in both 1×2 cells. `trunk` `variety` required |
| `Furnace` | `sim/building.ts`. Same instance in both 1×2 cells. Tick origin. `recipe` required. No `World.furnaces` list |
| `ResearchStation` | `sim/building.ts`. 1×1. Tick origin. No `World.stations` list |
| `Infuser` | `sim/building.ts`. Same instance in all four 2×2 cells. Tick origin. No `World.infusers` list |
| `Reservoir` | `sim/water.ts`. `Pump.water`, `RainTank.water` |
| `WeatherKind` | `sim/weather.ts`. `World.weather(day)` |
| `Stall` | `sim/stall.ts`. `World.stall` complete `StallGoodId` map |
| `Place` | `Seat.place`. Always a `Place` |
| `MpWire` | `sim/mp.ts` type. PeerJS in `net/peer.ts` only |
| `MpHost` / `MpGuest` | `sim/mp.ts`. App holds the session |

`World.house` / `truck` / `pumps` / `tanks` / `taps` / `wells` / `stills` / `waterSystems` / `hangars` / field silos / `silo` / `additives` are the same instances stored in their cells. `World.vehicles` / `World.trailers` / `World.routes` are lists, not cells. `World.wires` is the signal graph. `World.segments` and `World.sprinklers` are the pipe graph. A valve is a `Gate` on a segment. `World.fences` is the fence set. `World.enclosures` / `fenceEnclosures` / `plotEnclosures` are fenced-area indexes — [[mechanics/enclosure]].

Map-atlas vs chrome SVG: `atlas.ts` owns farm textures. `svgs.ts` owns HUD / almanac / Build fragments only. Pipes and sprinklers are not cells. Map hits `Edge` / `Vertex` separately.

## Building I/O

`BaseBuilding` carries `solid` `ticks` `hasted` beside `ports` `pads` `takeAll`. A building that wants the default declares nothing. No call site re-derives a flag by listing kinds.

`Machine` extends `BaseBuilding` with `inn`, `pads` `'both'`, `ticks`. `Store` extends `BaseBuilding`.

Walk dump, chest west-pull / east-push, and vehicle pads go through instance `accept` / `apply`. `ownsPort`: origin cell and `c.ports` includes the port. Sensor kind arms stay on `ownsPort` — [[mechanics/sensors]]. Pumpjack east cell: no port. `PadCell` is `pads === 'both'`. `IoCell` is the west-pull set (includes grinder). Keep `isIoCell` as its own predicate. Chest west / east adjacency stays `World`; payload is `accept` / `apply`. Plots stay a union; no `Cell.accept`. Barrel collect is not `accept`. `isSolid` uses `solid` for the `BaseBuilding` half; house / rock / tree / truck / pump stay kind arms; sensors via `isSensor`.

`tickMachines` does not name a machine kind. Origin-cell guard and `ticks` live in the loop; rate and product live on the machine. `hasted` is a flag, not `machineMul` on the class — still and furnace take furnace haste, not the machinery skill.

Sensors are not `Machine` and not `BaseBuilding`. They carry the same readonly `ports`.

## I/O ports

`IoPort` is `{ at: Coord; role: 'in' | 'out'; takes?: (item: Item) => boolean }`. Derived, never saved.

`storePorts()` is the chest and freezer link set. `padPorts()` is the vehicle Load / Unload set. Both live on the instance. Defaults: west `in` / east `out` on the south row; whole north edge `in` / whole south edge `out`. Read the instance, not the geometry. `dropoffPad` / `takeupPad` / `machineWest` / `machineEast` and `skuPorts` serve the ghost, which has no instance. `pads` says whether, `padPorts()` says where. `IoPort.takes` is the per-output test; only a multi-output building sets it. `Sorter` overrides both port functions.

`ports` is the only statement of which ports a cell has. `hit.ts` has no `portsOf`.

## Invariants

`building.flags` — `BaseBuilding` carries `solid` `ticks` `hasted` beside `ports` `pads` `takeAll`. A building that wants the default declares nothing.

`building.ports-single` — `ports` is the only statement of which ports a cell has.

`machines.tick-self` — `tickMachines` does not name a machine kind. Origin-cell guard and `ticks` live in the loop; rate and product live on the machine.

`building.io-ports` — `storePorts()` and `padPorts()` on the instance are the only statement of which cells a building reads and writes. `pads` says whether, `padPorts()` says where.
