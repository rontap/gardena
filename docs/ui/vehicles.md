# Vehicles II

Hangar dialog, parked Quad / tractor, dashboard, follow-cam, WASD, return arrows. Rules [[mechanics/vehicles]]. Types [[architecture/world]]. Chrome [[ui/store]] [[ui/docks]]. Place [[ui/place]]. Look [[ui/inspect]]. Shop [[ui/shop]]. Hats [[ui/multiplayer]]. Type [[ui/type]]. Art [[art/vehicles]].

`HudTarget` stays sprinkler-only.

`src/game/ui/hangar.tsx` owns the hangar cue. `src/game/ui/vehicle.tsx` owns the parked cue. Dashboard / follow-cam / WASD / hide-gardener / return arrows are App + view, not those panels.

## Hangar dialog

Walk-up any occupied hangar cell → `Seat.cue = { kind: 'hangar'; at }` → dialog. Same `Shell` (Radix + `Frame`) as [[ui/store]], `Bar`, `Coin`. Title **Vehicle hangar**. `w-[30rem]`. Close acks. Map click closes like chest. Guests: dialog opens.

Not a dock. Not Object HUD. No 6-slot. No cargo. No attachment grid.

List **all** `World.vehicles`, array order. Each row: icon Quad vs Tractor, fuel `Bar` (`value` = `fuel` 0..1, `bg-ripe` `h-1.5 w-20`), status **Stored** / **Deployed** / **Driven**.

| pose | label |
|---|---|
| `stored` | **Stored** |
| `field` && `driver === 'none'` | **Deployed** |
| `field` && `driver` is a `SeatId` | **Driven** |

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

Footer **Refill all** + `Coin` cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Click `refill` this hangar `XY`. Cost 0 (all full): still success. Poor: sim no-op. No toast.

Empty fuel: no toast. No cargo in hangar.

## Parked cue

Click / walk-up the floor of a parked vehicle → `Seat.cue = { kind: 'vehicle'; id }`. Several field vehicles on one cell: first in `World.vehicles` whose floor is that cell. Driven: no this cue. Stored: no field pose.

Dialog, not a dock, not Object HUD. Close acks. Map click closes like chest. Guests: dialog opens. Guests may `swapVehicle` / `swapTrailer`.

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

Driving overlay only. Not parked cue. Not hangar. Not `HudTarget`. Occupied `ItemFace` only (almanac/shop faces). Empty omitted. Reuse Face SVGs. No new item art. Not clickable. No swap.

Face svg `h-6 w-6` `viewBox="0 0 24 24"` — smaller than shop `skuInner` `h-10`. Wrapper `relative flex h-6 w-6 items-center justify-center`. Badge stays `absolute bottom-0 right-0 bg-ink px-1 text-xs leading-tight font-bold text-house`. Row `flex flex-wrap items-center gap-0.5`. `pointer-events-none` on the strip.

| driven | icons |
|---|---|
| Quad | occupied of `slots` (≤6), slot order |
| Tractor + seed/spray | hopper item, or none if empty |
| Tractor + harvest | occupied of 8, slot order |
| Tractor no hitch | none |

Quad: strip above the SVG, `justify-center` in the host. Tractor: same strip above the SVG, `justify-end` (hitch side). `{used}/{TRAILER_CAP}` stays on **used-readout**. Icons are not inside the 30×14 patch. Parked dialog unchanged.

### Readouts

Non-SVG. `--font-display`, `text-xs`, `tabular-nums`, `text-ink`. `absolute` `flex items-center justify-center` over the house-fill patches [[art/vehicles]]. Not inside the SVG. Not the long **Fuel:** / **Speed:** copy.

`%` of the 240×64 viewBox: `left` `x/240`, `top` `y/64`, `width` `w/240`, `height` `h/64`.

| over | patch | text |
|---|---|---|
| fuel | `13 38 70×14` | **F: {n}%** — `n = floor(fuel * 100)` |
| speed | `85 38 70×14` | **V: {n} km/h** — `n = floor(abs(speed) × QUAD_SHOW_MUL)` |
| used-readout | `208 38 30×14` | `{used}/{TRAILER_CAP}` (e.g. **12/100**) iff local driver of a tractor with hitch. Else hidden. |

Src Dash speed at `88 38 100×14` is wrong. Fuel and speed patches are the same size, both centered.

`QUAD_SHOW_MUL` is display only. Not sim. Tractor speed needle maps `±TRACTOR_VMAX` to the same ±36° arc. Live strings: `paintMotion`. React paints the first frame.

### Controls

Dashboard `Btn`s, not the parked dialog. `pointer-events-auto`. Face `bg-dirt text-house hover:bg-dirt-dark`, `text-base`. Same row `flex justify-center gap-2`.

| control | enabled | click |
|---|---|---|
| **Disembark** | always, while driving | dismount |
| **Dock** | iff vehicle `floor(x,y)` is a hangar return-pad cell | store |
| **Unload** | shown iff `floor` is a dropoff pad. Hidden ≠ disabled. Tractor `hitch === 'none'`: hidden | `Act.unload` |
| **Load** | shown iff `floor` is a takeup pad. Hidden ≠ disabled. Tractor `hitch === 'none'`: hidden | `Act.load` |
| boom combobutton | local driver of a tractor (hitch optional). Quad: no button | `Act.setBoom` the other width |

Boom label is the current width: **Boom 3** or **Boom 5**. Cycles `3 ↔ 5`. Persist on the tractor. Guest may.

**Dock** off: shop-row face `bg-ink/6 text-ink/35`, `aria-disabled`, guarded click — not the `disabled` attribute. Hover: **Dock at the hangar arrows.** Boom has no off face.

**Load** / **Unload** same row. Shown+inactive: Dock-off face `bg-ink/6 text-ink/35` `aria-disabled` guarded click. Copy **Load** **Unload**.

Map click while driving does not dismount. Pad click is not Return. Esc does not dismount. Silo pad is not Dock.

## Follow-cam

View-local. Not `World`. Not sim. Not logged.

While local seat is a driver: `camera.x/y` = vehicle `x/y`. Zoom stays. Pan locked. The local driver's field vehicle is not painted in the world. A dummy sits at screen center, outside the camera group, rotated by heading (quad or tractor). Hitched trailer dummy: front on `hitchP`, rotated by trailer heading. Other seats still see the field vehicle.

On store or dismount complete: freeze at that pose. Pan unlocks. Dummy off.

## WASD

App `keydown` / `keyup` while local seat is a driver and the target is not a text field. Not per rAF. `Act.drive` on change.

| key | field |
|---|---|
| W | `throttle` 1 |
| S | `throttle` −1 |
| A | `steer` −1 |
| D | `steer` 1 |
| release | that axis 0 |

Window blur → `drive` `{0,0}`.

Esc still closes panels (`cancelPlace`, `closeHud`, ack cue). Esc does not dismount.

Enter, same text-field ignore. If driving → `Act.disembark`. Else closest parked field vehicle, Euclidean actor→pose ≤ 1.5 → `Act.embark { id }` instant (already-on-tile path). Several: min dist, then `World.vehicles` order. Stored / driven: skip. None in range: no-op. No walk-to-embark on Enter. Dash **Disembark** and parked **Embark** stay.

## Return arrows

`ui-hangar-return` on each hangar’s three pad tiles and on every seed/spray/produce silo’s two pad tiles (`siloPad`). `pointer-events-none`. Paint iff `driverVehicle(local)` OR `lens === 'vehicles'`. Else hidden. Same art. No wash. Driving still paints with this lens off. Silo pads: no dialog.

`ui-pad-drop` on dropoff tiles, `ui-pad-take` on takeup. Mill, still, jam, compost-box, chest, freezer, seed-silo, additive-store. Not barrel, grinder, field silos. Same show rule: `driverVehicle(local)` OR `lens === 'vehicles'`. Else hidden. Opacity 0.5; 1 iff that pad’s Load or Unload is legal. `pointer-events-none`. No wash. `leaveShop` / Esc still only pipes / sensors → `off`. [[ui/lens]] [[ui/hud]]

## View

Hide gardener while that seat is a driver. Sim actor still tracks the vehicle.

Quad / tractor `--hat` from the driving seat. Same `--hat` table as [[ui/multiplayer]]. Parked / stored: no driver hat.

Tractor paint 1×1 at center, rotate heading. Attached trailer 1×1, front on hitchP, rotate trailer heading. Rake at trailer rear, view-only. Quad unchanged.

## Look / prompt

Not plots. No soil bars. No Object HUD.

| when | look | prompt |
|---|---|---|
| hangar cell | **Vehicle hangar** | **Vehicle hangar** `{ act: 'hangar'; at }` |
| parked Quad floor | **Quad** | **Quad** `{ act: 'vehicle'; id }` |
| parked tractor floor | **Tractor** | **Tractor** `{ act: 'vehicle'; id }` |
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

## Copy

Lock these strings:

| when | text |
|---|---|
| place / pulse `buy-hangar` | **Place Vehicle hangar** |
| place / pulse `buy-silo-seed` | **Place Seeding silo** |
| place / pulse `buy-silo-spray` | **Place Spraying silo** |
| place / pulse `buy-silo-produce` | **Place Produce silo** |
| delete, empty hangar | **Delete vehicle hangar** |
| delete, hangar that stores a vehicle or trailer | **Cannot delete here (stores a vehicle)** |
| delete silo | **Delete seeding silo** / **Delete spraying silo** / **Delete produce silo** |
| look hangar | **Vehicle hangar** |
| prompt walk-up hangar | **Vehicle hangar** |
| look parked Quad | **Quad** |
| look parked tractor | **Tractor** |
| prompt parked Quad | **Quad** |
| prompt parked tractor | **Tractor** |
| look silo | **Seeding silo** **Spraying silo** **Produce silo** |
| hangar | **Deploy** **Embark** **Refill all** **Buy Quad** **Buy Tractor** **Buy seeder** **Buy sprayer** **Buy harvester** |
| driving dash | **Disembark** **Dock** **Load** **Unload** **Boom 3** **Boom 5** |
| Dock hover (off pad) | **Dock at the hangar arrows.** |
| row status | **Stored** **Deployed** **Driven** **Attached** |
| empty fuel | no toast |

No `$`. `Coin`. Cottage tokens. No new hex.

Assumption: boom face is **Boom {n}** for current tractor `boom` (3 or 5); click writes the other width. Fuel/speed stay the live `F:` / `V:` paintMotion lines, patches `13 38 70×14` and `85 38 70×14`. Tractor hitch readout is `{used}/100` over **used-readout**. Dash cargo Face svg is `h-6 w-6`; Quad and tractor strips sit above the SVG (`justify-center` / `justify-end`). `skuLabel('buy-hangar')` is **Vehicle hangar**. Dock click stores; Disembark dismounts in place. Load/Unload shown+inactive has no extra hover string.
