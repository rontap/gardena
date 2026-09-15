# Vehicles

Hangar dialog, parked Quad / tractor, dashboard, Vehicle automation dock, route overlay, follow-cam, WASD, return arrows. Rules [[mechanics/vehicles]]. Light [[ui/sensors]]. Types [[architecture/world]]. Chrome [[ui/store]] [[ui/docks]]. Place [[ui/place]]. Look [[ui/inspect]]. Shop [[ui/build]]. Hats [[ui/multiplayer]]. Art [[art/vehicles]].

`HudTarget` stays sprinkler-only.

`src/game/ui/hangar.tsx` owns the hangar cue. `src/game/ui/vehicle.tsx` owns the parked cue. `src/game/ui/feature-vehicles/automation.tsx` owns the dock. Dashboard / follow-cam / WASD / hide-gardener / return arrows / route overlay are App + view, not those panels.

## Hangar dialog

Walk-up any occupied hangar cell → `Seat.cue = { kind: 'hangar'; at }` → dialog. Same `Shell` as [[ui/store]]. Title **Vehicle hangar**. Close acks. Map click closes like chest. Guests: dialog opens.

Not a dock. Not Object HUD. No cargo. No attachment grid.

List **all** `World.vehicles`, array order. Each row: icon Quad vs Tractor, fuel `Bar`, status **Stored** / **Deployed** / **Driven** / **Automated**.

| pose | label |
|---|---|
| `stored` | **Stored** |
| `field` && `driver === 'none'` && `!running` | **Deployed** |
| `field` && `driver` is a `SeatId` | **Driven** |
| `field` && `driver === 'none'` && `running` | **Automated** |

Click row selects `VehicleId`. Select is App-local. Not `World`. Not logged. No select until a click.

List **all** `World.trailers`, array order. Each row: icon by kind, status **Stored** / **Attached**, `used/TRAILER_CAP`. Click selects `TrailerId` iff the selected vehicle is a stored tractor.

### Buy rows

Not shelf SKUs. Not `skuPrice`. Click hangar XY. Poor / not researched: sim no-op. No toast. Labels **Buy Quad** **Buy Tractor** **Buy seeder** **Buy sprayer** **Buy harvester**. Prices `QUAD_PRICE` `TRACTOR_PRICE` `TRAILER_*_PRICE`.

**Deploy** enabled iff the selected vehicle is stored; if tractor and a trailer selected, that trailer must be stored. Click `deploy(id, at, hitch)` this hangar. Seats immediately; cue none closes the dialog.

**Automate** next to **Deploy**. Enabled iff `unlock-dispatch` in `done`, selected vehicle stored, that vehicle `route !== 'none'`, that route `n ≥ 1`. Click `Act.route` `{ k: 'automate'; v; c }` that id + this hangar XY. Does not seat. Dialog stays. Guest: same chrome.

Footer **Refill all** + `Coin` cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Click `refill` this hangar `XY`. Cost 0 (all full): still success. Poor: sim no-op. No toast.

## Parked cue

Click / walk-up the floor of a parked or automated vehicle → `Seat.cue = { kind: 'vehicle'; id }`. Several field vehicles on one cell: first in `World.vehicles` whose floor is that cell. Driven: no this cue. Running auto is embarkable.

Dialog, not a dock, not Object HUD. Close acks. Map click closes like chest. Guests: dialog opens. Guests may `swapVehicle` / `swapTrailer`. Title stays **Quad** / **Tractor**. No **Automate** on this dialog. Embark still `embark { id }` (pauses running). Fuel `Bar` + **Embark**. Empty fuel: still board. No toast.

| parked | chrome |
|---|---|
| Quad | title **Quad**, `VEHICLE_SLOTS`. Slot click `swapVehicle { id, i }`. Same swap buttons as chest |
| Tractor hitched seed/spray | title **Tractor**. Consume hopper: 1 slot. Slot click `swapTrailer { u, i: 0 }` |
| Tractor hitched harvest | title **Tractor**. `HARVEST_SLOTS`. Slot click `swapTrailer { u, i }` |
| Tractor no hitch | title **Tractor**. **Embark** only |

Legal cargo iff parked. Tractor has no 6-slot.

## Dashboard

Lower host, local driver only. Hidden when this seat is not a driver, including after store. Not [[ui/hud]] chrome. Not a dock. Not the parked 6-slot. Needles [[art/vehicles]] — overlay, not SVG paths. `paintMotion` owns needle angles, fuel/speed readouts, and tractor hitch `{used}/{TRAILER_CAP}`. React paints the first frame.

### Cargo

Driving overlay only. Occupied `ItemFace` only. Empty omitted. Not clickable. No swap.

| driven | icons |
|---|---|
| Quad | occupied of `slots`, slot order |
| Tractor + seed/spray | hopper item, or none if empty |
| Tractor + harvest | occupied of 8, slot order |
| Tractor no hitch | none |

### Readouts

Non-SVG. Display face, tabular nums. Not the long **Fuel:** / **Speed:** copy. Fuel **F: {n}%** — `n = floor(fuel * 100)`. Speed **V: {n} km/h** — `n = floor(abs(speed) × QUAD_SHOW_MUL)`. Hitch `{used}/{TRAILER_CAP}` iff local driver of a tractor with hitch. Else hidden. `QUAD_SHOW_MUL` is display only. Live strings: `paintMotion`.

### Controls

Dashboard `Btn`s, not the parked dialog.

| control | enabled | click |
|---|---|---|
| **Disembark** | always, while driving | dismount |
| **Dock** | iff vehicle `floor(x,y)` is a hangar return-pad cell | store |
| **Unload** | shown iff `floor` is a dropoff pad. Hidden ≠ disabled. Tractor `hitch === 'none'`: hidden | `Act.unload` |
| **Load** | shown iff `floor` is a takeup pad. Hidden ≠ disabled. Tractor `hitch === 'none'`: hidden | `Act.load` |
| boom combobutton | local driver of a tractor (hitch optional). Quad: no button | `Act.setBoom` the other width |

Boom label is the current width: **Boom 3** or **Boom 5**. Cycles `3 ↔ 5`. Persist on the tractor. Guest may. **Dock** off: locked card face, `aria-disabled`, guarded click. Hover: **Dock at the hangar arrows.** **Load** / **Unload** shown+inactive: Dock-off face, no extra hover string. No **Automate** button: routes are built in the Vehicle automation dock, never from the seat.

Map click while driving does not dismount. Pad click is not Return. Esc does not dismount. Silo pad is not Dock. Dock click stores; Disembark dismounts in place.

## Vehicle automation dock

Rail item **Vehicle automation**, shown iff `unlock-dispatch` in `done`, under **Contracts** — [[ui/hud]]. `Dock` `w-[32rem]`, the Build position — [[ui/docks]]. Opening forces `lens = 'vehicles'` and remembers the lens that was on; closing restores it and drops the picked route. Rail toggle, **×** and Esc all close it. Needs no driver and no vehicle. Guest: same chrome.

The picked route is App-local, not `World`, not logged. Opening the dock picks the first route, so a fresh farm can draw a route with no setup — a new `World` starts with one empty `Route 1` and `nextRouteId` 2.

Routes are a vertical `Tabs.List`, one trigger per `World.routes` row, the same rail and active left border as Build's categories — [[ui/docks]]. Its own class, `w-36` not Build's `w-28`, because route names are typed by the player. **New route** sits under the last tab: `Act.route` `{ k: 'create' }` then picks the minted id. Opening the dock picks `routes[0]`. No routes at all: **Pick a route, or make a new one.**

Double-click the active tab to rename it: the trigger becomes an input, selected. Enter or blur writes `Act.route` `{ k: 'rename' }`; empty is a no-op; Esc restores the name and does not close the dock. Double-click on a tab that is not active only picks it. WASD ignored while that input is focused.

Body order is **Vehicle**, **Boom**, **Stops**, **Out on this route**.

Each stop is a bordered mini-card, so where one stop ends and the next begins is visible without counting rows. Its title names the building: **Load from {name}** / **Unload into {name}** from the pad's own cell, **Go** and **Wait** as they are.

A **Load** or **Unload** card carries a second line of up to three `DropdownMenu` chips that narrow what that stop moves — [[mechanics/vehicles]]. **Go** and **Wait** have none. Each chip shows the chosen row's icon and label; every row in the open menu carries the same icon, drawn by `faceGfx` from a representative item. The Any row's icon is **\***.

Both the first and second chips are cut to what the building's `padGoods` names for that pad side, so a menu never offers something that pad cannot handle: a Mill dropoff lists only **Fruit** and **Compostable**, not all seven types. A step the side leaves one option for is pre-picked and rendered as a plain label rather than a menu — a Compost box takeup opens already reading **Other · Compost**, both fixed, and a Jam machine takeup opens on **Produce**. A fixed first chip still gets a second, which is how a Pot still takeup narrows from all alcohol to Brandy.

The second chip's Any row names the type — **Any produce**, **Any seed** — never a bare "Anything", so the chip still says what it will take.

The third chip appears once a good is chosen and only when that good has more than one variety. Rows are **Any variety**, **Basic**, then each named variety. Tier is the row's background, not a row of its own: `variant` is `bg-water/25`, `heirloom` is `bg-ripe/30`, `base` is untinted. Listing the tiers as their own rows duplicated the names whenever a tier held one variety, so they are gone.

Every chip writes `Act.route` `pick` immediately. Choosing the Any row at a step clears that step and the ones below it. The chips are not draggable, so a drag that starts on one does not start a row reorder.

**Stops**: numbered rows, 1-based, each a drag handle plus kind label plus **×**. Kind labels **Go** / **Load** / **Unload** / **Wait**. Drag a row onto another to move it there — `Act.route` `{ k: 'reorder'; i; to }`, a move and not a swap, so the rows between shift by one. The held row fades and the row under the pointer takes a `bg-ink/10` band. Remove × same as contract cancel. No current-stop highlight in the list. Empty: **Click the map to add a stop. Click a pad to load or unload there, a traffic light to wait.**

**Vehicle**: first in the body, a 4-column grid of icon-over-text cells, one `Act.route` `{ k: 'setDeploy' }` each. Top row is **Quad** and **Tractor**, two cells each spanning two columns; bottom row is **No trailer** **Seeder** **Sprayer** **Harvester**, one column each. The top row picks the vehicle, the bottom the trailer. Picking **Quad** disables the whole bottom row — a quad has no hitch. No save button; every click writes.

**Boom**: **Boom 3** / **Boom 5**, shown only for tractor with a trailer. Same `setDeploy`.

**Out on this route**: every `World.vehicles` whose `route` is this one and whose pose is field. Icon, one status line, fuel `Bar`, **×**. Status: **Out of fuel** when `fuel === 0`, else **Stopped** when not running or speed 0, else **Heading to {n}** with the 1-based stop number the map marker shows. **×** is `Act.route` `{ k: 'recall' }` — it stores the vehicle at the nearest hangar, it does not drive home. Empty: **Nothing is out on this route.**

Footer **Delete route** and **Deploy**. Delete disabled while one of its vehicles is on the field, hover **Send its vehicles back first.** Deploy enabled iff the route has a stop and some hangar holds what the **Vehicle** grid names; disabled hover says which of those is missing. Click `Act.route` `{ k: 'deploy' }`.

Panel values move on the tick, so the dock repaints on `useRefresh` — [[ui/hud]].

## Map gestures

Dock open with a route picked. Left-click empty ground, `place.kind === 'none'` → `Act.route` `{ k: 'add'; r; s }`; consumes the click. Left-drag from a stop moves it: on release, `{ k: 'move'; r; i; s }` of the cell under the cursor; the dragged marker follows the pointer while held and paints `RIPE`. Release without moving: nothing. Left-drag from anywhere else pans the map as usual. Right-click a stop removes it; right-click elsewhere is the usual right-click. A stop is under the cursor when its cell is the cell under the cursor — stops are one cell each.

| hit | stop |
|---|---|
| dropoff pad tile | `{ kind: 'unload'; at }` |
| takeup pad tile | `{ kind: 'load'; at }` |
| traffic-light cell | `{ kind: 'wait'; at }` |
| else in-world owned floor | `{ kind: 'goto'; at }` |
| unowned | no-op, no toast |

Pad / light win over floor. Every stop sits on the centre of its cell, never the click point. HUD / dock clicks do not add. With a route picked, inspect look prepends **Add stop here** / **Add load here** / **Add unload here** / **Add wait here** from `stopAt` of the hovered cell.

## Route paint

Overlay Graphics. No pointer. Each drive leg is a straight stroke. Geometry is stop-to-stop plus, for every running vehicle on that route, its live pose→its current stop. Route picked: paint that one route, numbered markers 1-based. A **Load** or **Unload** marker is a bigger disc with a heavier ring and a bigger number than a **Go** or **Wait** — that is where the route does its work, and it reads at a glance from the map. `n === 0`: no path. No route picked and `lens === 'vehicles'`: thin assigned routes, no numbers. Else: no route paint. Patch on dirty / lens / picked route. Ticker restrokes live pose→current stop.

Picked route whose deploy is a tractor with a trailer: every tilled cell the boom would sweep along the legs takes a `WATER` wash. Swept cells are `boomHits` at the route's boom width, sampled every `SWATH_STEP` along each leg. Under two stops: no wash. The wash says the boom can touch that plot, not that it will change it.

## Follow-cam

View-local. Not `World`. Not sim. Not logged. While local seat is a driver: `camera.x/y` = vehicle `x/y`. Zoom stays. Pan locked. On store or dismount complete: freeze at that pose. Pan unlocks.

## WASD

App `keydown` / `keyup` while local seat is a driver and the target is not a text field. Not per rAF. `Act.drive` on change. Dock open: WASD still drives. W throttle 1, S −1, A steer −1, D 1, release that axis 0. Window blur → `drive` `{0,0}`.

Esc still closes panels. Esc does not dismount. Enter, same text-field ignore: if driving → `Act.disembark`; else closest field vehicle with `driver === 'none'` within 1.5 → `Act.embark`. Several: min dist, then `World.vehicles` order. Running auto: pause, board. None in range: no-op. No walk-to-embark on Enter.

## Return arrows

On each hangar’s three pad tiles and on every seed/spray/produce silo’s two pad tiles. Paint iff `driverVehicle(local)` OR `lens === 'vehicles'`. Else hidden. Driving still paints with this lens off. Silo pads: no dialog. Dropoff / takeup arrows on mill, still, jam, compost-box, chest, freezer, seed-silo, additive-store. Not barrel, grinder, field silos. Opacity 0.5; 1 iff that pad’s Load or Unload is legal. `leaveShop` restores an unlocked Build peek. [[ui/lens]] [[ui/hud]]

## View

Hide gardener while that seat is a driver. Sim actor still tracks the vehicle. Quad / tractor driver hat: atlas `actor-hat` tint from the seat table — [[ui/multiplayer]]. Parked / stored: no driver hat sprite. Tractor paint 1×1 at center, rotate heading. Attached trailer 1×1, front on hitchP. Rake at trailer rear, view-only.

## Look / prompt

Not plots. No soil bars. No Object HUD.

| when | look | prompt |
|---|---|---|
| hangar cell | **Vehicle hangar** | **Vehicle hangar** `{ act: 'hangar'; at }` |
| parked or automated Quad floor | **Quad** | **Quad** `{ act: 'vehicle'; id }` |
| parked or automated tractor floor | **Tractor** | **Tractor** `{ act: 'vehicle'; id }` |
| `silo-seed` | **Seeding silo** | none |
| `silo-spray` | **Spraying silo** | none |
| `silo-produce` | **Produce silo** | none |

Silo: look name only. No prompt act. No dialog.

## Shelf

Three automation SKUs via `SKUS`. Guest `GUEST_BUILD`. Place path — [[ui/place]]. Almanac **Automation**: hangar + three silos. Not Sensors. Not Water systems. [[ui/almanac]]
