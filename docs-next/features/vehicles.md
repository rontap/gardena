# Vehicles

Code: `feature-vehicles/vehicle.ts` (driving, boom, loading, routes), `feature-vehicles/pick.ts` (what a route stop moves), `feature-vehicles/vehicle.h.ts` (types), `ui/hangar.tsx`, `ui/vehicle.tsx` (parked vehicle), `ui/feature-vehicles/automation.tsx` (**Vehicle automation**), the driving buttons in `App.tsx`; see [[code-map]].
Unlocked: `unlock-vehicles` (hangar, Quad, Tractor, trailers), `unlock-silos` (field silos), `unlock-dispatch` (routes, Traffic light, Refueling station, Vehicle dispatcher) ([[features/research]]).

## Purpose

Vehicles carry more and cover ground faster than the gardener. The Quad hauls six slots of anything between buildings; the Tractor pulls a trailer that plants, fertilizes or harvests a whole row as it drives over it. With routes, vehicles drive themselves between loading spots, so a field can be planted, harvested, milled and sold without the gardener walking the goods. Fuel and slow ground cost time, and a route has to be built stop by stop.

## Rules

### Vehicles and trailers

The kinds, prices, capacities and what each trailer does to a plot are on [[items/other/vehicles]] and [[items/other/trailers]]. A vehicle is always in one of these states:

| state | pose | driver | `running` |
|---|---|---|---|
| stored | in a hangar | — | false |
| driven | on the field | a seat | false |
| parked | on the field | none | false |
| automated | on the field | none | true |

A trailer is either stored in a hangar or attached to one Tractor; it is never on the field alone. A Tractor keeps its boom width (3 or 5) when a trailer is changed. `TRAILER_CAP` is the only limit on trailer cargo.

### Hangar

A [[items/buildings/hangar]] is where vehicles and trailers are bought (the prices are the hangar's, not Build prices), stored, and taken out. The row of tiles along its south side is its pad.

```
   +-----------+
   |  hangar   |   HANGAR_W x HANGAR_H, door on the south side
   +-----------+
   [ pad  pad  pad ]   Deploy puts the vehicle at the pad's centre, facing south;
                       driving onto the pad and pressing Dock stores it
```

In the hangar panel:

- **Buy Quad**, **Buy Tractor**, **Buy seeder** / **sprayer** / **harvester**: stored in this hangar.
- **Deploy**: takes a stored vehicle (and, for a Tractor, a stored trailer or **No trailer**) out onto the pad with the gardener driving it. Refused while the gardener already drives.
- **Automate**: sends a stored vehicle that already has a route with at least one stop out on that route, unmanned.
- **Refill all**: fills every vehicle's tank on the farm for `QUAD_REFILL` per full tank of missing fuel; refused if the farm cannot pay all of it.

A hangar that stores a vehicle or a trailer cannot be demolished.

### Driving

**Enter** (the key) gets out of the vehicle being driven, or into the nearest field vehicle with no driver within 1.5 tiles. Clicking a vehicle farther away walks the gardener to it first (**Embark**). Getting into an automated vehicle stops it on its route (`running` false); the route and its place on it are kept.

The vehicle is steered like a tank: W forward, S reverse, A and D turn, at a rate that does not depend on speed. Each vehicle accelerates toward its top speed (`QUAD_VMAX`, or `TRACTOR_VMAX` for a Tractor), braking at twice its acceleration when driven against its motion. The top speed is multiplied by the ground under it:

- `SURFACE_PAVED` on Paving slab and Asphalt;
- `SURFACE_SLOW` on plots, rock and buildings;
- `SURFACE_NORMAL` elsewhere, including Brickwork, Cobblestone and grass ([[features/build]]).

A step that would leave owned land is not taken. Each rank of `driving-classes` raises top speed and acceleration by 5% and lowers fuel use by 5% ([[features/family]]).

While driving, the gardener rides at the vehicle's position, and a gardener's job list stays empty. The driving buttons: **Disembark**; **Dock**, only on a hangar pad; **Unload** and **Load**, only with cargo, stopped on a loading spot; and on a Tractor, **Boom 3** / **Boom 5**.

### Fuel

Fuel is a share of a full tank, `FUEL_LITERS` litres. It is used only while the vehicle is told to move or turn: a full tank lasts `QUAD_FUEL_SECONDS` of that. With an empty tank a driven vehicle still crawls at `QUAD_EMPTY_MUL` of its top speed; an automated one stops where it is and waits. Fuel is bought with **Refill all** or at a [[items/buildings/refueling-station]]. Trailers use none.

### Boom

A Tractor's trailer works the tiles under its boom: a strip `boom` tiles wide and `BOOM_LONG` long, centred on the hitch behind the Tractor and turned with the trailer (`boomHits`). It works only while the Tractor is driven or automated, moving forward, and not turning; reversing or steering works nothing. Each tile is worked once as the boom passes it (seeding, spraying or harvesting, [[items/other/trailers]]); a tree is worked once at its origin tile.

While the boom changed at least one tile in the last `BOOM_WORK_SECONDS`, the Tractor's top speed is × `BOOM_WORK_MUL`. Passing over tiles it cannot work, for example with an empty hopper, does not slow it.

### Loading spots

Buildings that trade items with vehicles have loading spots (pads) next to them: a drop-off side, where **Unload** puts cargo in, and a take-up side, where **Load** takes their output ([[systems/building-io]]). Which buildings have them, and on which sides, is on each building's page. The field silos ([[items/buildings/field-silos]]) take and give what their starting twins do, and a Load from a Seeding or Additive silo restocks it as a hand take does.

A transfer needs the vehicle stopped on the spot. The Quad uses its own slots; a Tractor uses its trailer, so it needs one attached. Unloading at the Produce Warehouse drop-off sells the cargo the way a hand drop-off does ([[features/market]]). The building still decides what it accepts.

A parked vehicle's cargo can also be swapped by hand: click a parked Quad for its slots, or a parked Tractor for its trailer's hopper or slots.

### Routes

After `unlock-dispatch`, **Vehicle automation** on the left rail lists routes (`World.routes`). A new game has one empty **Route 1**; **New route** adds **Route {n}**, double-click renames, **Delete route** removes one (refused while any of its vehicles is on the field: **Send its vehicles back first.**).

A route has:

- **Stops**, added by clicking the map with the route open. The tile clicked decides the kind:

| clicked tile | stop | the vehicle, on arrival |
|---|---|---|
| owned ground | **Go** | continues once within `ROUTE_ARRIVE` of the tile's centre |
| a drop-off spot | **Unload into {at}** | stops, waits `DISPATCH_DWELL`, unloads what its pick allows, continues |
| a take-up spot | **Load from {at}** | stops, waits `DISPATCH_DWELL`, loads what its pick allows, continues |
| a Traffic light | **Wait** | stops until the light's input is on ([[items/buildings/sensors-logic]]) |
| the south side of a Refueling station | **Refuel at {at}** | stops, waits `DISPATCH_DWELL`, takes fuel; with **Wait for fuel** it stays until the tank is full |

  Stops can be dragged to another position in the list, or moved to another tile. A load or unload moves nothing if nothing matches, and the vehicle still continues. Demolishing a building removes the stops on its spots.
- **What a stop takes** (load and unload only): **Anything**, or narrowed step by step to a kind (**Seeds**, **Fruit**, **Produce**, **Alcohol**, **Compostable**, **Tools**, **Other**), then one good, then one variety (`Pick`). The editor offers only what that building's side handles (`padGoods`) and fixes a step that has one option. The pick only narrows; the building's accept rule still decides.
- **Vehicle**: a Quad, or a Tractor with a trailer kind or **No trailer** and **Boom 3** / **Boom 5** (`Route.deploy`).
- **After the last stop**: **Loop again**, or **Send back to the hangar**, which stores the vehicle in the nearest hangar at once.

**Deploy** on a route takes the first hangar that stores the named vehicle (and the named trailer, in the same hangar) and sends it out unmanned from that hangar's pad; the reason it cannot shows instead: **Add a stop first.**, **No Quad stored in a hangar.**, **No Tractor stored in a hangar.**, **No hangar stores a Tractor and a {trailer} together.** **Out on this route** lists its vehicles with **Heading to {n}**, **Stopped** or **Out of fuel**, and **Send back to the hangar** stores one in the nearest hangar at once. 

The **Vehicle dispatcher** (`buy-dispatch`, `DISPATCH_PRICE`, after `unlock-dispatch`) is a signal device with an input and an output. Its panel sets a route (**No route** until one is picked) and **At least** {n}. Each time its input turns from off to on, it deploys once on that route, as **Deploy** does. Its output is on while at least {n} vehicles are out on that route ([[systems/signals]]).

An automated vehicle drives itself toward the current stop: it turns in place until it faces the stop (within `ROUTE_ALIGN`), then drives forward at `AUTO_VMAX_MUL` of its top speed, braking to stop on a spot tile. It never reverses. Loads, unloads, waits and refuels are resolved after the signal step, so a Traffic light's input is this step's ([[systems/tick]]).

## Screen

- Hangar panel: stored vehicles and trailers, with state **Stored**, **Driven**, **Automated**, **Deployed**, **Attached**; the buy buttons, **Deploy**, **Automate**, **Refill all**.
- Driving: the dash with fuel (**F: {pct}%**), speed (**V: {n} km/h**), steering, and the cargo; the driving buttons above.
- Parked vehicle panel: its slots or trailer, and **Embark**.
- **Vehicle automation** dock: routes, stops, picks, the vehicle, the end, the vehicles out. Hovering the map with a route open shows **Add stop here**, **Add load here**, **Add unload here**, **Add wait here**, **Add refuel here**.
- Map: while driving, or with the **Vehicle interactions** view on (after `unlock-vehicles`, [[shell]]), hangar and silo pads and every loading spot are drawn as arrows, dimmed where the current vehicle cannot use them. The camera follows the vehicle being driven.
- Command Center: an empty tank on a vehicle is a red row.

## Guest

A guest can do everything on this page, including buying, driving, routes and **Refill all**. A guest's gardener leaving while driving leaves the vehicle parked where it was.

## Save and sync

Saved: every vehicle (kind, fuel, pose, slots, or hitch, boom and `working`, route, place on the route, `running`, `dwell`), every trailer, every route, and the next vehicle, trailer and route ids. Not saved: driving input. The digest carries vehicles, trailers, routes and the next ids, with poses, fuel and `dwell` rounded ([[systems/net]]).

## Art

`prop-quad.svg`, `prop-tractor.svg` (group `hat`, tinted per driver), `prop-trailer-{seed,spray,harvest}.svg`, `prop-trailer-rake.svg` (the boom, drawn 5 tiles wide and scaled to the width), `prop-hangar.svg`; dashes `ui-dash-quad.svg`, `ui-dash-tractor.svg`; spot arrows `ui-pad-drop.svg`, `ui-pad-take.svg`, `ui-pad-refuel.svg`, `ui-hangar-return.svg`. A moving Tractor shows `exhaust` ([[art/vfx]]).

## Invariants

| id | rule | test |
|---|---|---|
| `vehicles.buy` | any number of vehicles and trailers; bought at hangar prices, stored in the hangar they were bought at | `vehicle.test.ts` |
| `vehicles.surface` | the ground multiplies top speed only; a step off owned land is not taken | `vehicle.test.ts` |
| `vehicles.empty` | an empty driven vehicle crawls at `QUAD_EMPTY_MUL`; an empty automated one stops and does not continue its route | `vehicle.test.ts` |
| `vehicles.refill` | **Refill all** costs the missing share of every tank × `QUAD_REFILL`, all or nothing | `vehicle.test.ts` |
| `vehicles.drive` | tank steering; braking at twice the acceleration | `vehicle.test.ts` |
| `vehicles.enter` | **Enter** leaves the vehicle driven, else enters the nearest free one within 1.5 tiles; entering an automated one stops it | `vehicle.test.ts` |
| `vehicles.boom-work` | a step that works a tile slows the Tractor for `BOOM_WORK_SECONDS` | `vehicle.test.ts` |
| `vehicles.auto` | automated vehicles turn in place, then drive forward; never reverse | `vehicle.test.ts` |
| `vehicles.route` | stops by tile; reorder is a move; the place on the route follows its stop; **Send back to the hangar** does not wrap | `vehicle.test.ts` |
| `vehicles.deploy` | Deploy needs a stop and one hangar storing the named vehicle and trailer | `vehicle.test.ts` |
| `vehicles.pick` | a pick only narrows what moves; the building still decides | `vehicle.test.ts` |
| `vehicles.refuel`, `vehicles.liters` | a refuel stop waits `DISPATCH_DWELL`, takes the station's store, buys the rest only if the farm can pay all of it | `vehicle.test.ts` |
| `vehicles.starter-pads`, `vehicles.silo-pads` | every starting loading spot is drivable ground; field silos load and unload like their starting twins | `vehicle.test.ts` |

## When you change this

- A new trailer kind: `TrailerKind`, `Trailer`, `boomCell`, cargo in `vehicleCargo` and the transfers, its hangar buy button and `Route.deploy`, save and digest.
- A new building with loading spots: `pads: 'both'`, `padPorts`, `padGoods` for the route editor, and `padBuildings` ([[systems/building-io]]).
- Anything that changes what a tile is: `surfaceMul` reads it for speed; a new solid building slows vehicles.
- New route stop kind: `RouteStop`, `stopLegal`, `stopAt`, `stopArrived`, `tickDispatch`, the editor's stop list, and `stripPadStops` if it points at a building.
- Fuel or speed numbers: the hangar and Refueling station prices depend on `QUAD_REFILL` and `FUEL_LITERS`.

## Decisions

- Routes belong to the farm, not to a vehicle: editing a route changes it for every vehicle on it, and a vehicle takes a route only when it is sent out.
- A stop's pick narrows what moves but never widens what a building accepts, so a route cannot put into a building what the gardener could not.
