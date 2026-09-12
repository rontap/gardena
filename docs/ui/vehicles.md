# Vehicles

Hangar dialog, parked Quad / tractor, dashboard, Automate, stops Window, route overlay, follow-cam, WASD, return arrows. Rules [[mechanics/vehicles]]. Light [[ui/sensors]]. Types [[architecture/world]]. Chrome [[ui/store]] [[ui/docks]]. Place [[ui/place]]. Look [[ui/inspect]]. Shop [[ui/build]]. Hats [[ui/multiplayer]]. Art [[art/vehicles]].

`HudTarget` stays sprinkler-only.

`src/game/ui/hangar.tsx` owns the hangar cue. `src/game/ui/vehicle.tsx` owns the parked cue. Dashboard / Automate / stops Window / follow-cam / WASD / hide-gardener / return arrows / route overlay are App + view, not those panels.

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
| **Automate** | shown iff `unlock-dispatch` in `done`. Hidden ≠ disabled if not researched. Always while driving once shown | open editor. Stay seated |

Boom label is the current width: **Boom 3** or **Boom 5**. Cycles `3 ↔ 5`. Persist on the tractor. Guest may. **Dock** off: locked card face, `aria-disabled`, guarded click. Hover: **Dock at the hangar arrows.** **Load** / **Unload** shown+inactive: Dock-off face, no extra hover string. **Automate** selected face while the editor is on. Click opens the editor. Does not toggle off. Stay seated. WASD still drives. App-local, not logged.

Map click while driving does not dismount. Pad click is not Return. Esc does not dismount. Silo pad is not Dock. Dock click stores; Disembark dismounts in place.

## Editor

Shown iff local driver and `unlock-dispatch` in `done`. Open is App-local, not logged. Editor on: force `lens = 'vehicles'`. Remember the lens that was on. Close does not persist `vehicles` unless it was already `vehicles`. Window **×**: close editor, stay seated, do not Start, restore that lens. Esc: that, then existing Esc. Guest: same chrome.

## Stops Window

Editor on only. Not a dock. Not Overlay. Not a dialog. Not Object HUD. Same width as inspect, they stack, never overlap. Title = assigned route `name`. Unassigned: empty title.

HUD has no dropdown primitive — native `<select>` of `World.routes` plus **New**. WASD ignored while that select or the rename `Field` is focused. Dash **Automate** with no route: create `Route 1` if `World.routes` is empty, then assign `routes[0]`. Change → `Act.route` `{ k: 'assign'; v; r }`. **New** → `{ k: 'create' }` then assign the minted id. No unassign row. Rename: `Field` shown iff a route is assigned. Empty no-op.

Body: numbered rows, 1-based. Kind labels **Go** / **Load** / **Unload** / **Wait**. Reorder ▲▼ same as accepted contracts. Remove × same as contract cancel. Ends: sim no-op. No current-stop highlight in the list. Footer **Start**. Enabled iff assigned route `n ≥ 1`. Click `Act.route` `{ k: 'start' }`. Disabled hover: **Add a stop.** Guest: same chrome.

## Map add

Editor on, `place.kind === 'none'`, local driver. In-world click → `Act.route` `{ k: 'add'; r; s }`. Consumes the click. Driving still does not dismount. No assigned route: no-op, no toast.

| hit | stop |
|---|---|
| dropoff pad tile | `{ kind: 'unload'; at }` |
| takeup pad tile | `{ kind: 'load'; at }` |
| traffic-light cell | `{ kind: 'wait'; at }` |
| else in-world owned floor | `{ kind: 'goto'; x; y }` click XY, not tile-snap |
| unowned / invalid | no-op, no toast |

Pad / light win over floor. HUD / Window clicks do not add. Editor on, inspect look prepends **Add stop here** / **Add load here** / **Add unload here** / **Add wait here** from `stopAt` of the hovered cell.

## Route paint

Overlay Graphics. No pointer. Each drive leg is a straight stroke. Geometry is stop-to-stop plus the live pose→current stop. Editor on: paint the selected/assigned route only, numbered markers 1-based. `n === 0`: no path. `lens === 'vehicles'` and editor off: thin assigned routes, no numbers. Else: no route paint. Driving without the editor does not paint routes. Patch on dirty / lens / editor. Ticker restrokes live pose→current stop.

## Follow-cam

View-local. Not `World`. Not sim. Not logged. While local seat is a driver: `camera.x/y` = vehicle `x/y`. Zoom stays. Pan locked. On store or dismount complete: freeze at that pose. Pan unlocks.

## WASD

App `keydown` / `keyup` while local seat is a driver and the target is not a text field or the route `<select>`. Not per rAF. `Act.drive` on change. Editor on: WASD still drives. W throttle 1, S −1, A steer −1, D 1, release that axis 0. Window blur → `drive` `{0,0}`.

Esc still closes panels. Esc does not dismount. Editor on: Esc closes the editor first. Enter, same text-field ignore: if driving → `Act.disembark`; else closest field vehicle with `driver === 'none'` within 1.5 → `Act.embark`. Several: min dist, then `World.vehicles` order. Running auto: pause, board. None in range: no-op. No walk-to-embark on Enter.

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
