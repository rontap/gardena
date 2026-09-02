# Vehicles

Hangar dialog, parked Quad / tractor, dashboard, Automate, stops Window, route overlay, follow-cam, WASD, return arrows. Rules [[mechanics/vehicles]]. Light [[ui/sensors]]. Types [[architecture/world]]. Chrome [[ui/store]] [[ui/docks]]. Place [[ui/place]]. Look [[ui/inspect]]. Shop [[ui/shop]]. Hats [[ui/multiplayer]]. Type [[ui/type]]. Art [[art/vehicles]].

`HudTarget` stays sprinkler-only.

`src/game/ui/hangar.tsx` owns the hangar cue. `src/game/ui/vehicle.tsx` owns the parked cue. Dashboard / Automate / stops Window / follow-cam / WASD / hide-gardener / return arrows / route overlay are App + view, not those panels.

## Hangar dialog

Walk-up any occupied hangar cell → `Seat.cue = { kind: 'hangar'; at }` → dialog. Same `Shell` (Radix + `Frame`) as [[ui/store]], `Bar`, `Coin`. Title **Vehicle hangar**. Close acks. Map click closes like chest. Guests: dialog opens.

Not a dock. Not Object HUD. No 6-slot. No cargo. No attachment grid.

List **all** `World.vehicles`, array order. Each row: icon Quad vs Tractor, fuel `Bar` (`value` = `fuel` 0..1), status **Stored** / **Deployed** / **Driven** / **Automated**.

| pose | label |
|---|---|
| `stored` | **Stored** |
| `field` && `driver === 'none'` && `!running` | **Deployed** |
| `field` && `driver` is a `SeatId` | **Driven** |
| `field` && `driver === 'none'` && `running` | **Automated** |

Click row selects `VehicleId`. Select is App-local. Not `World`. Not logged. Selected face `bg-ink` like an armed shop row. No select until a click.

List **all** `World.trailers`, array order. Each row: icon by kind, status **Stored** / **Attached**, `used/100`. Click selects `TrailerId` iff the selected vehicle is a stored tractor. Else not selectable. Selected face `bg-ink`.

| trailer pose | label |
|---|---|
| `stored` | **Stored** |
| `attached` | **Attached** |

### Buy rows

Not shop SKUs. Not `skuPrice`. `haggling` does not discount. Click hangar XY. Poor / not researched: sim no-op. No toast.

| label | icon | `Coin` |
|---|---|---|
| **Buy Quad** | Quad | `QUAD_PRICE` |
| **Buy Tractor** | Tractor | `TRACTOR_PRICE` |
| **Buy seeder** | seeder | `TRAILER_SEED_PRICE` |
| **Buy sprayer** | sprayer | `TRAILER_SPRAY_PRICE` |
| **Buy harvester** | harvester | `TRAILER_HARVEST_PRICE` |

Buy Quad → `buyVehicle(at, 'quad')`. Buy Tractor → `buyVehicle(at, 'tractor')`. Trailers → `buyTrailer(at, k)`.

**Deploy** enabled iff the selected vehicle `pose.kind === 'stored'`; if tractor and a trailer selected, that trailer must be stored. Else not. Click `deploy(id, at, hitch)` this hangar. Tractor with stored trailer selected: that `TrailerId`. Else `'none'`. Seats immediately; cue none closes the dialog.

**Automate** next to **Deploy**. Cottage dirt `Btn`. Enabled iff `unlock-dispatch` in `done`, selected vehicle stored, that vehicle `route !== 'none'`, that route `n ≥ 1`. Else Dock-off face, `aria-disabled`, guarded click. Click `Act.route` `{ k: 'automate'; v; c }` that id + this hangar XY. Does not seat. Dialog stays. Guest: same chrome.

Footer **Refill all** + `Coin` cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Click `refill` this hangar `XY`. Cost 0 (all full): still success. Poor: sim no-op. No toast.

Empty fuel: no toast. No cargo in hangar.

## Parked cue

Click / walk-up the floor of a parked or automated vehicle → `Seat.cue = { kind: 'vehicle'; id }`. Several field vehicles on one cell: first in `World.vehicles` whose floor is that cell. Driven: no this cue. Stored: no field pose. Running auto is embarkable (`field`, `driver === 'none'`).

Dialog, not a dock, not Object HUD. Close acks. Map click closes like chest. Guests: dialog opens. Guests may `swapVehicle` / `swapTrailer`. Title stays **Quad** / **Tractor**. No **Automate** on this dialog (Automate is dash + hangar). Embark still `embark { id }` (pauses running).

Fuel `Bar` (same tokens as hangar rows) + **Embark**. Click `embark { id }`. Empty fuel: still board. No toast.

| parked | chrome |
|---|---|
| Quad | title **Quad**, `VEHICLE_SLOTS` 6, `grid-cols-3` (3×2). Slot click `swapVehicle { id, i }`. Same swap buttons as chest. |
| Tractor hitched seed/spray | title **Tractor**. Consume hopper: 1 slot, `ui-slot-down` overlay. Slot click `swapTrailer { u, i: 0 }`. |
| Tractor hitched harvest | title **Tractor**. Harvest `HARVEST_SLOTS` 8, `grid-cols-4` (4×2). Slot click `swapTrailer { u, i }`. |
| Tractor no hitch | title **Tractor**. **Embark** only. |

Legal cargo iff parked. Tractor has no 6-slot.

## Dashboard

Lower host, local driver only. Hidden when this seat is not a driver, including after store. Not [[ui/hud]] chrome. Not a dock. Not the parked 6-slot.

Host `absolute bottom-4 left-1/2 z-20 w-[30rem] -translate-x-1/2`. Not `pointer-events-none` on the host. SVG underneath (`pointer-events-none`). HTML overlay on top. Needles [[art/vehicles]] — overlay, not SVG paths.

Quad: `ui-dash-quad`. Tractor: `ui-dash-tractor`.

`paintMotion` owns needle angles, fuel/speed readouts, and tractor hitch `{used}/{TRAILER_CAP}` over **used-readout**. React paints the first frame. Dash faces are React, not `paintMotion`.

### Cargo

Driving overlay only. Not parked cue. Not hangar. Not `HudTarget`. Occupied `ItemFace` only (almanac/shop faces). Empty omitted. Reuse Face SVGs. No new item art. Not clickable. No swap. Smaller than shop `skuInner`. `pointer-events-none` on the strip.

| driven | icons |
|---|---|
| Quad | occupied of `slots` (≤6), slot order |
| Tractor + seed/spray | hopper item, or none if empty |
| Tractor + harvest | occupied of 8, slot order |
| Tractor no hitch | none |

Quad: strip above the SVG, `justify-center` in the host. Tractor: same strip above the SVG, `justify-end` (hitch side). `{used}/{TRAILER_CAP}` stays on **used-readout**. Icons are not inside the 30×14 patch. Parked dialog unchanged.

### Readouts

Non-SVG. Display face, tabular nums, over the house-fill patches [[art/vehicles]]. Not inside the SVG. Not the long **Fuel:** / **Speed:** copy.

`%` of the 240×64 viewBox: `left` `x/240`, `top` `y/64`, `width` `w/240`, `height` `h/64`.

| over | patch | text |
|---|---|---|
| fuel | `13 38 70×14` | **F: {n}%** — `n = floor(fuel * 100)` |
| speed | `85 38 70×14` | **V: {n} km/h** — `n = floor(abs(speed) × QUAD_SHOW_MUL)` |
| used-readout | `208 38 30×14` | `{used}/{TRAILER_CAP}` (e.g. **12/100**) iff local driver of a tractor with hitch. Else hidden. |

Src Dash speed at `88 38 100×14` is wrong. Fuel and speed patches are the same size, both centered.

`QUAD_SHOW_MUL` is display only. Not sim. Tractor speed needle maps `±TRACTOR_VMAX` to the same ±36° arc. Live strings: `paintMotion`. React paints the first frame.

### Controls

Dashboard `Btn`s, not the parked dialog. `pointer-events-auto`. Cottage dirt face.

| control | enabled | click |
|---|---|---|
| **Disembark** | always, while driving | dismount |
| **Dock** | iff vehicle `floor(x,y)` is a hangar return-pad cell | store |
| **Unload** | shown iff `floor` is a dropoff pad. Hidden ≠ disabled. Tractor `hitch === 'none'`: hidden | `Act.unload` |
| **Load** | shown iff `floor` is a takeup pad. Hidden ≠ disabled. Tractor `hitch === 'none'`: hidden | `Act.load` |
| boom combobutton | local driver of a tractor (hitch optional). Quad: no button | `Act.setBoom` the other width |
| **Automate** | shown iff `unlock-dispatch` in `done`. Hidden ≠ disabled if not researched (do not show). Always while driving once shown | open editor. Stay seated |

Boom label is the current width: **Boom 3** or **Boom 5**. Cycles `3 ↔ 5`. Persist on the tractor. Guest may.

**Dock** off: shop-row locked face, `aria-disabled`, guarded click — not the `disabled` attribute. Hover: **Dock at the hangar arrows.** Boom has no off face.

**Load** / **Unload** same row. Shown+inactive: Dock-off face, `aria-disabled` guarded click. Copy **Load** **Unload**.

**Automate** cottage dirt `Btn` on that row, after Boom. Selected face while the editor is on. Click opens the editor. Does not toggle off. Stay seated. WASD still drives. App-local, not logged.

Map click while driving does not dismount. Pad click is not Return. Esc does not dismount. Silo pad is not Dock.

## Editor

Shown iff local driver and `unlock-dispatch` in `done`. Open is App-local, not logged.

Editor on: force `lens = 'vehicles'` (pad arrows = Vehicle interactions). Remember the lens that was on. Close does not persist `vehicles` unless it was already `vehicles`.

Window **×**: close editor, stay seated, do not Start, restore that lens. Esc: that, then existing Esc (`cancelPlace`, `closeHud`, pipes / sensors → `off`, ack cue, close panel). Right-click unchanged (`cancelPlace` / drop). Guest: same chrome.

## Stops Window

Editor on only. Not a dock. Not Overlay. Not a dialog. Not Object HUD.

`absolute top-20 right-4 z-20 w-80`. `max-h` clears inspect (`absolute right-4 bottom-4 z-20 w-80`). Same width, they stack, never overlap. Common case no scroll at 1440×900.

`Window` chrome. Title = assigned route `name` (`font-display` Press Start). Unassigned: empty title. Body Nunito. `scroll-pane`. Hairline footer.

Dash **Automate** with no route: create `Route 1` if `World.routes` is empty, then assign `routes[0]`. Top: native `<select>` of `World.routes` array order, label `name`, plus cottage dirt `Btn` **New**. Selected value = driven `route`. Change → `Act.route` `{ k: 'assign'; v; r }` that id. **New** → `{ k: 'create' }` then assign the minted id. No unassign row.

Rename: `Field` `name="route"` `aria-label="Route name"`, shown iff a route is assigned. WASD ignored (existing Field pattern; native `<select>` focused same ignore). Empty no-op; Field stays at last applied name.

Body: numbered rows, 1-based, `tabular-nums`. Kind labels **Go** / **Load** / **Unload** / **Wait**. Reorder ▲▼ same as accepted contracts. Remove × same as contract cancel. Ends: sim no-op. Stops list updates on cmds, not rAF. No current-stop highlight in the list.

Footer **Start**. Enabled iff assigned route `n ≥ 1`. Click `Act.route` `{ k: 'start' }`. Disabled: Dock-off face, `aria-disabled` guarded click, hover: **Add a stop.**

Guest: same chrome. `mp.guest` already allows `Act.route`.

## Map add

Editor on, `place.kind === 'none'`, local driver. In-world click → `Act.route` `{ k: 'add'; r; s }`. Consumes the click. Driving still does not dismount. No assigned route: no-op, no toast.

| hit | stop |
|---|---|
| dropoff pad tile | `{ kind: 'unload'; at }` that coord |
| takeup pad tile | `{ kind: 'load'; at }` that coord |
| traffic-light cell | `{ kind: 'wait'; at }` that cell |
| else in-world owned floor | `{ kind: 'goto'; x; y }` click XY, not tile-snap |
| unowned / invalid | no-op, no toast |

Pad / light win over floor. HUD / Window clicks do not add.

Editor on, inspect look prepends **Add stop here** / **Add load here** / **Add unload here** / **Add wait here** from `stopAt` of the hovered cell.

## Route paint

Overlay Graphics. `eventMode` `'none'`. No new `@theme` color. Each drive leg is a straight stroke (ink understroke + grape `#6b1f8c`). Geometry is stop-to-stop cell/XY the auto seeks, plus the live pose→current stop (fruit-red). No wire sag.

Editor on: paint the selected/assigned route only. Numbered markers: ink-stroke house (current: ripe) circle, Nunito `tabular-nums` ink. 1-based. `n === 0`: no path.

`lens === 'vehicles'` and editor off: thin assigned routes (at least one vehicle holds that id), no numbers.

Else: no route paint. Driving without the editor does not paint routes.

Patch on dirty / lens / editor. Ticker restrokes live pose→current stop. Not React path `d`. Not HUD `paintMotion`.

## Follow-cam

View-local. Not `World`. Not sim. Not logged.

While local seat is a driver: `camera.x/y` = vehicle `x/y` (smoothed pose). Zoom stays. Pan locked. Vehicle stays in actors. Hitch follows. No dummy. No SVG camera group. Other seats still see the field vehicle.

On store or dismount complete: freeze at that pose. Pan unlocks.

## WASD

App `keydown` / `keyup` while local seat is a driver and the target is not a text field or the route `<select>`. Not per rAF. `Act.drive` on change. Editor on: WASD still drives.

| key | field |
|---|---|
| W | `throttle` 1 |
| S | `throttle` −1 |
| A | `steer` −1 |
| D | `steer` 1 |
| release | that axis 0 |

Window blur → `drive` `{0,0}`.

Esc still closes panels (`cancelPlace`, `closeHud`, ack cue). Esc does not dismount. Editor on: Esc closes the editor first (stay seated, do not Start, restore lens).

Enter, same text-field ignore. If driving → `Act.disembark`. Else closest field vehicle with `driver === 'none'`, Euclidean actor→pose ≤ 1.5 → `Act.embark { id }` instant (already-on-tile path). Several: min dist, then `World.vehicles` order. Stored / driven: skip. Running auto: pause, board. None in range: no-op. No walk-to-embark on Enter. Dash **Disembark** and parked **Embark** stay.

## Return arrows

`ui-hangar-return` on each hangar’s three pad tiles and on every seed/spray/produce silo’s two pad tiles (`siloPad`). `pointer-events-none`. Paint iff `driverVehicle(local)` OR `lens === 'vehicles'`. Else hidden. Same art. No wash. Driving still paints with this lens off. Silo pads: no dialog.

`ui-pad-drop` on dropoff tiles, `ui-pad-take` on takeup. Mill, still, jam, compost-box, chest, freezer, seed-silo, additive-store. Not barrel, grinder, field silos. Same show rule: `driverVehicle(local)` OR `lens === 'vehicles'`. Else hidden. Opacity 0.5; 1 iff that pad’s Load or Unload is legal. `pointer-events-none`. No wash. `leaveShop` / Esc still only pipes / sensors → `off`. [[ui/lens]] [[ui/hud]]

## View

Hide gardener while that seat is a driver. Sim actor still tracks the vehicle.

Quad / tractor driver hat: atlas `actor-hat` tint from the seat table — [[ui/multiplayer]]. Parked / stored: no driver hat sprite.

Tractor paint 1×1 at center, rotate heading. Attached trailer 1×1, front on hitchP, rotate trailer heading. Rake at trailer rear, view-only. Quad unchanged.

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

Silo: look name only. No prompt act. No dialog. No cue.

## Shop / place

Three automation SKUs via `SKUS`. Guest `GUEST_BUILD`. Place path. Disarm on confirm. `skuPrice` (haggling).

| sku | `skuLabel` | `skuDesc` | place / pulse |
|---|---|---|---|
| `buy-silo-seed` | **Seeding silo** | 2×3 field tank. Look only. | **Place Seeding silo** |
| `buy-silo-spray` | **Spraying silo** | 2×3 field tank. Look only. | **Place Spraying silo** |
| `buy-silo-produce` | **Produce silo** | 2×3 field tank. Look only. | **Place Produce silo** |

Almanac **Automation**: hangar + three silos. Not Sensors. Not Water systems. [[ui/almanac]]

Place **Place Vehicle hangar** / silo labels. Delete empty hangar **Delete vehicle hangar**; stores a vehicle **Cannot delete here (stores a vehicle)**. Dash **Disembark** **Dock** **Load** **Unload** **Boom 3** **Boom 5** **Automate**. Stops **New** **Start** **Go** **Load** **Unload** **Wait** **Up** **Down** **Remove**. Hangar **Automate** **Automated**. No `$`. `Coin`.

Assumption: HUD has no dropdown primitive — native `<select>` of `World.routes` plus **New**. WASD ignored while that select or the rename `Field` is focused. Map add with no assigned route is a no-op. Boom face is **Boom {n}** for current tractor `boom` (3 or 5); click writes the other width. Fuel/speed stay the live `F:` / `V:` paintMotion lines. Tractor hitch readout is `{used}/TRAILER_CAP` over **used-readout**. `skuLabel('buy-hangar')` is **Vehicle hangar**. Dock click stores; Disembark dismounts in place. Load/Unload shown+inactive has no extra hover string.
