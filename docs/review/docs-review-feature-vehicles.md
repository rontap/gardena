# Docs review: Vehicles

Notes: `docs/mechanics/vehicles.md`, `docs/ui/vehicles.md`, `docs/art/vehicles.md`
Code: `src/game/sim/feature-vehicles/vehicle.ts`, `src/game/sim/feature-vehicles/vehicle.h.ts`, `src/game/sim/feature-vehicles/pick.ts`, `src/game/sim/building.ts`, `src/game/sim/tick.ts`, `src/game/sim/world.ts`, `src/game/sim/world.h.ts`, `src/game/sim/mp.ts`, `src/game/sim/prompt.ts`, `src/game/sim/look.ts`, `src/game/sim/feature-place/place.helpers.ts`, `src/game/ui/hangar.tsx`, `src/game/ui/vehicle.tsx`, `src/game/ui/feature-vehicles/automation.tsx`, `src/App.tsx`, `src/game/view/map.tsx`, `src/game/view/motion.ts`, `src/game/view/world-view.ts`, `src/game/view/layers/overlay.ts`, `src/game/defs/items.ts`, `src/game/defs/research.ts`, `src/game/defs/shelf.ts`
Tests: `src/game/sim/feature-vehicles/vehicle.test.ts`, `src/game/sim/sensor.test.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Can a guest in a multiplayer game load from or unload into a chest or freezer while driving?
- [ ] **doc** `docs/mechanics/vehicles.md:104` — no: "Guest: mill/jam/still/compost/furnace/sorter/seed-silo/additive-store yes. Chest/freezer no."
- [ ] **code + test** `src/game/sim/mp.ts:214`, `src/game/sim/feature-vehicles/vehicle.ts:1486-1504` — yes: `permit` lets a guest send **Load** and **Unload**, and `loadBody` / `unloadBody` do not check the building kind or the seat. `src/game/sim/feature-vehicles/vehicle.test.ts:141` asserts guest `Act.load` and `Act.unload` are permitted (`:151-152`); no test covers a guest at a chest.
- [ ] **none**

### 2. Does a vehicle driving itself on a route use fuel?
- [ ] **doc** `docs/mechanics/vehicles.md:61`, `:196` — fuel burns "iff driver" / "while seated" and a control is held; the automated section (`:70`, `:226`) does not mention burning.
- [ ] **code + test** `src/game/sim/feature-vehicles/vehicle.ts:1391-1395` — yes: while running on a route, it burns with the same formula whenever it turns or drives forward. `src/game/sim/feature-vehicles/vehicle.test.ts:1185` "…Burn when synthesized throttle or steer, same seated formula…".
- [ ] **none**

### 3. What happens when an automated vehicle reaches a Load or Unload stop?
- [ ] **doc** `docs/mechanics/vehicles.md:134`, `:174`, `:216` — it has arrived when it is on the pad cell; then one transfer and on to the next stop.
- [ ] **code + test** `src/game/sim/feature-vehicles/vehicle.ts:1231-1236`, `:1580-1589` — it has arrived only when it is on the pad cell and has stopped (speed 0); it then waits `DISPATCH_DWELL` (3 s), does one transfer, and moves on. `src/game/sim/feature-vehicles/vehicle.test.ts:975` "…arrive `floor` is that pad/cell and `speed === 0`. Load/unload then `DISPATCH_DWELL` then one transfer then next…".
- [ ] **none**

### 4. Can the driver press Load or Unload while still rolling?
- [ ] **doc** `docs/mechanics/vehicles.md:104` — "Interact iff this seat is driver and `floor(x,y)` is that pad. Instant."
- [ ] **code + test** `src/game/sim/feature-vehicles/vehicle.ts:1488`, `:1498`, `:1511` — no: the vehicle must also be stopped (speed 0); until then the button shows but is inactive. `src/game/sim/feature-vehicles/vehicle.test.ts:975` "…Seated Load/Unload no-op unless `speed === 0`…".
- [ ] **none**

### 5. Do vehicles keep moving through the change of day?
- [ ] **doc** `docs/mechanics/vehicles.md:57` — "Recap: no integrate."
- [ ] **doc** `docs/mechanics/vehicles.md:184`, `:210` — "Recap does not freeze vehicle integrate or `tickDispatch`"; unmanned automated vehicles continue through the day change.
- [ ] **code + test** `src/game/sim/tick.ts:147-190` — the single tick that crosses into the new day runs only the day-change work and returns, so no vehicle moves or stops-handling runs on that tick; the next tick carries on as normal (the day screen does not pause the world, `seam` is `'play'`). `src/game/sim/feature-vehicles/vehicle.test.ts:406` "…Recap freezes vehicle integrate…" asserts the pose is unchanged across that one tick and `seam.kind` is `'play'`.
- [ ] **none**

### 6. Which map objects open a small settings panel above the object (`HudTarget`)?
- [ ] **doc** `docs/mechanics/vehicles.md:5`, `docs/ui/vehicles.md:5` — "`HudTarget` stays sprinkler-only."
- [ ] **code** `src/game/sim/world.h.ts:176-186` — sprinkler, the eight sensor panels (water, harvest, counter, day, logic, variety, weather, pressure) and the Refueling station (`refuel`); clicking a Refueling station opens its panel (`src/App.tsx:1046-1055`). Hangar and vehicle are still not panel targets.
- [ ] **none**

### 7. What is the field silo that holds fertilizer called?
- [ ] **doc** `docs/ui/vehicles.md:174` — look **Spraying silo**.
- [ ] **doc** `docs/mechanics/vehicles.md:40` — **Additive silo**.
- [ ] **code** `messages/en/names.json:168` — **Additive silo** (`names_building_silo_spray`), used by look (`src/game/sim/look.ts:106`) and prompt (`src/game/sim/prompt.ts:622`).
- [ ] **none**

### 8. What happens when the player clicks a field silo?
- [ ] **doc** `docs/ui/vehicles.md:173-177` — look name only; no prompt, no act, no dialog.
- [ ] **doc** `docs/mechanics/vehicles.md:43` — walking up opens the same panel as its starter twin (seed silo, additive store, chest) and deposits first.
- [ ] **code + test** `src/game/sim/prompt.ts:621-623` — the prompt names the silo and walking up opens the seed-silo, additive or chest panel. `src/game/sim/feature-vehicles/vehicle.test.ts:760` "Field silos are walk-up stores…".
- [ ] **none**

### 9. Which buildings have vehicle pads?
- [ ] **doc** `docs/mechanics/vehicles.md:100` — mill, still, jam, compost box, chest, freezer, furnace, sorter, house seed silo, additive store, three field silos; not barrel, grinder. The pad-goods table (`:156-166`) adds warehouse, infuser and Refueling station; `docs/ui/vehicles.md:158` lists arrows on mill, still, jam, compost box, chest, freezer, seed silo, additive store, field silos and Refueling station.
- [ ] **code** `src/game/sim/feature-vehicles/vehicle.ts:589-624`, `src/game/sim/building.ts:520` — every machine (mill, jam, still, furnace, Infuser, Crop Variety Station), compost box, chest, freezer (both sizes), sorter, Refueling station, the house seed silo, additive store, the Produce Warehouse (dropoff only, cargo is sold on consignment, `:1473`) and the three field silos. The pad-goods table has no row for the furnace, which takes seeds, fruit, sugar, oil, flour, spirits and compostables in and gives ash and bread out (`src/game/sim/building.ts:869`), or for the Crop Variety Station, which takes anything (`'all'`, `:506`).
- [ ] **test** `src/game/sim/feature-vehicles/vehicle.test.ts:874`, `:892`, `:927`, `:950` — test starter pads, field silo pads, mill dropoff and takeup; no test for Infuser, Crop Variety Station or warehouse pads.
- [ ] **none**

### 10. What does each row in the route's stop list say?
- [ ] **doc** `docs/ui/vehicles.md:112` — kind labels **Go** / **Load** / **Unload** / **Wait**.
- [ ] **doc** `docs/ui/vehicles.md:100` — **Load from {name}** / **Unload into {name}**, **Go**, **Wait**, **Refuel at {name}**.
- [ ] **code** `src/game/ui/feature-vehicles/automation.tsx:124-130` — matches `:100`: "Load from {at}", "Unload into {at}", "Refuel at {at}", "Go", "Wait" (`messages/en/vehicles.json`); a building that was removed reads "a gone building".
- [ ] **none**

### 11. With a route picked in the Vehicle automation dock, what does a map click add?
- [ ] **doc** `docs/ui/vehicles.md:126` — a left-click on empty ground adds a stop.
- [ ] **code** `src/App.tsx:1057-1060` — a left-click on any owned cell adds the stop that cell gives (`stopAt`, `src/game/sim/feature-vehicles/vehicle.ts:644`): a pad gives Load / Unload / Refuel, a traffic light gives Wait, and every other cell, including the house, a chest or a machine body, gives **Go**. Only the Refueling station's own cell adds nothing (it opens its panel).
- [ ] **none**

### 12. After which research does Vehicles appear?
- [ ] **doc** `docs/mechanics/vehicles.md:23` — `unlock-vehicles` reveals after `unlock-expand`.
- [ ] **code** `src/game/defs/research.ts:162-171` — `unlock-vehicles` has parent `unlock-irrigation`; `buy-hangar` shows after `unlock-irrigation` and unlocks with `unlock-vehicles` (`:467`).
- [ ] **none**

### 13. Where on the Build panel are the hangar and the field silos?
- [ ] **doc** `docs/ui/vehicles.md:181` — three automation SKUs; Almanac **Automation** holds hangar and three silos.
- [ ] **doc** `docs/mechanics/vehicles.md:21` — `buy-hangar` and three silo SKUs are automation SKUs.
- [ ] **code** `src/game/defs/shelf.ts:53` — the Automation shelf's **Hangar** group holds `buy-hangar` and `buy-refuel`; the three field silos are on the Storage shelf, group **Silos** (`:63`). All five SKUs have `tab: 'automation'` (`src/game/defs/research.ts:467-469`). Almanac not checked.
- [ ] **none**

## Doc only (no code found)

### 14. What controls what a guest may place?
- [ ] **doc** `docs/ui/vehicles.md:181` — "Guest `GUEST_BUILD`." Searched `GUEST_BUILD` in `src/`: nothing found. Guests are limited only by `permit` (`src/game/sim/mp.ts:214`), which refuses skill picks, land expansion and cheats.
- [ ] **removed from the game**
- [ ] **none**

### 15. What restores the Build lens peek when leaving?
- [ ] **doc** `docs/ui/vehicles.md:158` — "`leaveShop` restores an unlocked Build peek." Searched `leaveShop` in `src/`: nothing found. The function that does this is `leaveBuild` (`src/App.tsx:587`).
- [ ] **removed from the game**
- [ ] **none**

## Code only (no note mentions it)

### 16. When the hangar sends out a vehicle on its route (**Automate**), what does it take?
- [ ] **code** `src/game/sim/feature-vehicles/vehicle.ts:1205-1228` — the vehicle leaves with no trailer and keeps its own boom width; the route's **Vehicle** and **Boom** choices (`Route.deploy`) are not read. Only the dock's **Deploy** attaches the named trailer and boom (`:1169-1189`).
- [ ] **intended, document it**
- [ ] **not intended**

### 17. Can a tractor leave from one hangar with a trailer stored in another?
- [ ] **code** `src/game/sim/feature-vehicles/vehicle.ts:784-823` — yes: the hangar **Deploy** checks only that the trailer is stored, not where; a tractor stored at hangar A and a trailer stored at hangar B can be deployed together from hangar C. The dock's **Deploy** requires both in one hangar (`:1027-1050`).
- [ ] **intended, document it**
- [ ] **not intended**

### 18. How does an automated vehicle slow down for a stop?
- [ ] **code + test** `src/game/sim/feature-vehicles/vehicle.ts:1263-1273`, `:1399-1408` — for a Load, Unload, Wait or Refuel stop it lets go of the throttle once it is within its stopping distance plus 0.2 tile; with the throttle released it slows at `AUTO_DECEL_MUL` (1.5) times its acceleration; once on the stop's cell it holds still. `src/game/sim/feature-vehicles/vehicle.test.ts:1185` "…Decel only `× AUTO_DECEL_MUL` (throttle 0)…".
- [ ] **intended, document it**
- [ ] **not intended**

### 19. What happens to seed quality when seeds are loaded into a seeder that already holds some?
- [ ] **code** `src/game/sim/feature-vehicles/vehicle.ts:526-545` — seeds only go in if they are the same crop and Variety as the hopper; the hopper's quality becomes the count-weighted average of the two; the hopper stops at `TRAILER_CAP` (100). A sprayer takes fertilizer or compost, one kind at a time (`:546-556`).
- [ ] **intended, document it**
- [ ] **not intended**

### 20. After **Delete route**, which route is shown?
- [ ] **code** `src/game/ui/feature-vehicles/automation.tsx:217-220` — none: the dock drops the pick and shows **Pick a route, or make a new one.**, even when other routes remain. `docs/ui/vehicles.md:94` gives that text only for "No routes at all".
- [ ] **intended, document it**
- [ ] **not intended**

### 21. Are the dashboard buttons translatable?
- [ ] **code** `src/App.tsx:1372-1432` — **Disembark**, **Dock**, **Unload**, **Load**, **Boom 3** / **Boom 5** and the hover **Dock at the hangar arrows.** are written in the component, not in `messages/en/*.json`. The fuel and speed readouts are (`src/game/view/motion.ts:122-123`).
- [ ] **intended, document it**
- [ ] **not intended**

### 22. What else does the picked route's map drawing show?
- [ ] **code** `src/game/view/layers/overlay.ts:673-695` — the path is a closed loop, last stop back to the first; Refuel markers are drawn large like Load and Unload; each running vehicle on the route gets a red line from where it is to its current stop. With no route picked in the Vehicles lens, assigned routes are drawn with the same line width as a picked one.
- [ ] **intended, document it**
- [ ] **not intended**

### 23. What does the delete prompt say on a hangar that stores something?
- [ ] **code** `src/game/sim/prompt.ts:418` — **Cannot demolish here (stores a vehicle)** (`messages/en/prompt.json:9`), also when it stores only a trailer.
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 24. Two vehicle kinds, Quad and tractor; Quad has `VEHICLE_SLOTS` (6) slots; tractor has a hitch and boom 3 or 5, default 5, kept across trailer swaps and docking; fuel 0 to 1 on the vehicle; trailers are stored or attached — doc `docs/mechanics/vehicles.md:9`, code `src/game/sim/feature-vehicles/vehicle.h.ts:38-67`, `src/game/defs/items.ts:181`, test `src/game/sim/feature-vehicles/vehicle.test.ts:112`, `:522`, `:804`.
- [ ] 25. Buying: unlimited; Quad `QUAD_PRICE` 75, tractor `TRACTOR_PRICE` 125, seeder 50, sprayer 40, harvester 75, paid from the hangar dialog and stored at that hangar; poor, not a hangar, or not researched does nothing — doc `docs/mechanics/vehicles.md:21`, `:47`, `docs/ui/vehicles.md:30`, code `src/game/sim/feature-vehicles/vehicle.ts:750-782`, `src/game/defs/items.ts:179`, `:205`, `:212-214`, `src/game/ui/hangar.tsx:125-169`, test `src/game/sim/feature-vehicles/vehicle.test.ts:123`.
- [ ] 26. Hangar 3×2 (`HANGAR_W` × `HANGAR_H`), pad is the row just south; field silos 2×3; hangar deploy spawns at the pad centre facing south and seats the player; deploy from another hangar spawns at that hangar — doc `docs/mechanics/vehicles.md:15`, `:27`, `:49`, code `src/game/sim/feature-vehicles/vehicle.ts:132-156`, `:784-823`, `src/game/defs/items.ts:182-183`, `:194-195`, test `src/game/sim/feature-vehicles/vehicle.test.ts:287`.
- [ ] 27. A hangar that stores a vehicle or a trailer cannot be deleted; vehicles out on the field do not block it — doc `docs/mechanics/vehicles.md:31`, code `src/game/sim/feature-place/place.helpers.ts:207`, `src/game/sim/feature-vehicles/vehicle.ts:693`, test `src/game/sim/feature-vehicles/vehicle.test.ts:760`.
- [ ] 28. Field silos: Seeding silo `SILO_FIELD_SEED_CAP` 300 seeds, Additive silo `SILO_FIELD_ADDITIVE_CAP` 600 litres, Produce silo `PRODUCE_SLOTS` 16 slots of fruit, weed and grass; dropoff on the north row, takeup on the two south cells; pad goods are the starter twin's; no signal port; a Load restocks like a hand take — doc `docs/mechanics/vehicles.md:37-43`, `:106`, code `src/game/sim/building.ts:1297-1445`, `src/game/sim/feature-vehicles/vehicle.ts:1454-1466`, `src/game/defs/items.ts:184-186`, test `src/game/sim/feature-vehicles/vehicle.test.ts:760`, `:892`.
- [ ] 29. Embark: within 1.5 tiles board now, else walk there; empty tank still boards; boarding a running vehicle pauses it, speed 0, stop kept. Enter: driving → get out; else nearest free field vehicle within 1.5 — doc `docs/mechanics/vehicles.md:51`, `:122`, `docs/ui/vehicles.md:154`, code `src/game/sim/feature-vehicles/vehicle.ts:655-674`, `:838-853`, `src/App.tsx:397-401`, test `src/game/sim/feature-vehicles/vehicle.test.ts:822`.
- [ ] 30. Driving: W forward, S reverse, A/D turn; braking against motion at twice the acceleration; speed cap = top speed × surface × (`QUAD_EMPTY_MUL` 0.1 when empty); a step onto unowned ground is refused; tractor top speed 0.67 of the Quad's, acceleration half, turn rate from `TRACTOR_R` 3; driving-classes adds 5 % per tier to top speed and acceleration and cuts burn 5 % per tier — doc `docs/mechanics/vehicles.md:55-68`, code `src/game/sim/feature-vehicles/vehicle.ts:296-318`, `:1420-1442`, `src/game/defs/items.ts:171-204`, test `src/game/sim/feature-vehicles/vehicle.test.ts:196`, `:257`.
- [ ] 31. Automated driving: turn in place until within `ROUTE_ALIGN`, then full forward, never reverse, top speed × `AUTO_VMAX_MUL` 0.75; empty tank stops it and it stays running — doc `docs/mechanics/vehicles.md:70`, `:226`, code `src/game/sim/feature-vehicles/vehicle.ts:1254-1275`, `:1388-1411`, `src/game/defs/items.ts:243-245`, test `src/game/sim/feature-vehicles/vehicle.test.ts:1185`.
- [ ] 32. No driver and not running: coasts to 0, no burn, no turning — doc `docs/mechanics/vehicles.md:72`, code `src/game/sim/feature-vehicles/vehicle.ts:1412-1419`, test `src/game/sim/feature-vehicles/vehicle.test.ts:406`.
- [ ] 33. Walking with WASD: screen directions, diagonal not faster, cancels queued work, ignored while driving — doc `docs/mechanics/vehicles.md:76`, code `src/game/sim/tick.ts:194-208`, `src/game/sim/world.ts:1484`, no dedicated test read.
- [ ] 34. Boom: centred on the hitch point, width 3 or 5, works only while driven or automated, with a trailer, not turning and moving forward — doc `docs/mechanics/vehicles.md:80`, code `src/game/sim/feature-vehicles/vehicle.ts:1350-1375`, `:222`, test `src/game/sim/feature-vehicles/vehicle.test.ts:544`.
- [ ] 35. Seeder plants on empty tilled plots only, one seed each; grass seeds lay turf. Sprayer tops up tilled plots to `FERT_PLOT_MAX` and trees (once, at the tree's origin) to their maximum. Harvester: ripe → fruit as by hand; growing under 0.2 → one seed; over 0.8 → fruit with quality set now and freshness = maturity; in between destroyed; dead, rotten, weed → that item; trees and turf skipped; full → cell left alone — doc `docs/mechanics/vehicles.md:82-86`, code `src/game/sim/feature-vehicles/vehicle.ts:1277-1348`, test `src/game/sim/feature-vehicles/vehicle.test.ts:567`, `:593`, `:625`, `:655`.
- [ ] 36. A boom pass that changed a cell slows the tractor's cap to `BOOM_WORK_MUL` 0.5 for `BOOM_WORK_SECONDS` 3 s; acceleration, turning and burn unchanged — doc `docs/mechanics/vehicles.md:88`, `:224`, code `src/game/sim/feature-vehicles/vehicle.ts:1374`, `:1385-1386`, `src/game/defs/items.ts:217-218`, test `src/game/sim/feature-vehicles/vehicle.test.ts:1146`.
- [ ] 37. Trailer cap `TRAILER_CAP` 100: seeder counts seeds, sprayer whole litres, harvester item counts; a swap past the cap does nothing; trailer cargo can be swapped only while parked — doc `docs/mechanics/vehicles.md:92`, `:96`, code `src/game/sim/feature-vehicles/vehicle.ts:278`, `:899-944`, test `src/game/sim/feature-vehicles/vehicle.test.ts:593`, `:722`.
- [ ] 38. Surfaces: paved and asphalt 1.3, tilled, rock and solid cells 0.4, else 1.0; cap only — doc `docs/mechanics/vehicles.md:110`, code `src/game/sim/feature-vehicles/vehicle.ts:158`, `src/game/defs/items.ts:196-198`, test `src/game/sim/feature-vehicles/vehicle.test.ts:157`.
- [ ] 39. **Refill all** costs `QUAD_REFILL` (25) per full tank over all vehicles, fills every tank, does nothing if short — doc `docs/mechanics/vehicles.md:114`, `docs/ui/vehicles.md:36`, code `src/game/sim/feature-vehicles/vehicle.ts:946`, test `src/game/sim/feature-vehicles/vehicle.test.ts:239`.
- [ ] 40. Get out: speed 0, player stands at the vehicle, route and running unchanged. Dock: only on a hangar pad cell; trailer is stored with it; route kept, stops running — doc `docs/mechanics/vehicles.md:118-120`, code `src/game/sim/feature-vehicles/vehicle.ts:855-887`, test `src/game/sim/feature-vehicles/vehicle.test.ts:334`, `:975`.
- [ ] 41. Quad slots hold any item, swap and compact like a chest, lose freshness; swap only while parked — doc `docs/mechanics/vehicles.md:126`, code `src/game/sim/feature-vehicles/vehicle.ts:889`, `src/game/sim/tick.ts:85-90`, test `src/game/sim/feature-vehicles/vehicle.test.ts:375`.
- [ ] 42. Routes: a new game has **Route 1**; **New route** names it `Route {n}`; add appends; move replaces with what the new cell gives; reorder is a move; the current stop follows edits; zero stops → running false; deleting a route is refused while one of its vehicles is out, otherwise clears it on stored vehicles; deleting a light or pad building strips its stops — doc `docs/mechanics/vehicles.md:130-136`, code `src/game/sim/world.ts:278-279`, `src/game/sim/feature-vehicles/vehicle.ts:964-1015`, `:1072-1168`, test `src/game/sim/feature-vehicles/vehicle.test.ts:975`, `:1212`.
- [ ] 43. Dock **Deploy**: needs a stop and the first hangar (in list order) holding the named vehicle and trailer; spawns at that pad, no driver, first stop, running, tractor takes the route's boom. Recall stores at the nearest hangar, trailer too, route kept — doc `docs/mechanics/vehicles.md:138-140`, `:172`, code `src/game/sim/feature-vehicles/vehicle.ts:1027-1050`, `:1169-1204`, test `src/game/sim/feature-vehicles/vehicle.test.ts:1042`.
- [ ] 44. Stop filter: any → type → good → variety, each must match; a new stop is any; the building still decides; spirits and casks offer their crop's varieties, mixed spirit none; the pad side limits the menus and pre-fixes a single option — doc `docs/mechanics/vehicles.md:144-168`, `docs/ui/vehicles.md:102-110`, code `src/game/sim/feature-vehicles/pick.ts:83-171`, `src/game/sim/building.ts:611-1445`, `src/game/ui/feature-vehicles/automation.tsx:429-588`, test `src/game/sim/feature-vehicles/vehicle.test.ts:1075`.
- [ ] 45. Refuel stops: a pause of `DISPATCH_DWELL` 3 s, then move `min(store, room)` litres, then buy the rest at `QUAD_REFILL / FUEL_LITERS` a litre only if the money covers all of it; **No wait** leaves after one transfer, **Wait for fuel** stays until full; runs even on an empty tank; a full reading is `FUEL_LITERS` 25 — doc `docs/mechanics/vehicles.md:174-180`, `:218`, code `src/game/sim/feature-vehicles/vehicle.ts:1529-1579`, `src/game/defs/items.ts:97`, `:178`, `:244`, test `src/game/sim/feature-vehicles/vehicle.test.ts:1265`, `:1346`.
- [ ] 46. Wait stops hold while the traffic light's input is off and move on when it is on — doc `docs/mechanics/vehicles.md:134`, code `src/game/sim/feature-vehicles/vehicle.ts:1558-1565`, test `src/game/sim/sensor.test.ts:1257`.
- [ ] 47. Going away while driving: no driver, pose kept, coasts to 0, trailer stays — doc `docs/mechanics/vehicles.md:184`, code `src/game/sim/world.ts:561-576`, test `src/game/sim/feature-vehicles/vehicle.test.ts:406`.
- [ ] 48. Every starter pad is on drivable owned ground at surface 1.0 — doc `docs/mechanics/vehicles.md:102`, code `src/game/sim/feature-vehicles/vehicle.ts:611`, test `src/game/sim/feature-vehicles/vehicle.test.ts:874`.
- [ ] 49. Hangar dialog: title **Vehicle hangar**; all vehicles with icon, fuel bar and **Stored** / **Deployed** / **Driven** / **Automated**; all trailers with **Stored** / **Attached** and used/100; a trailer is selectable only with a stored tractor selected; **Deploy** needs a stored vehicle and, with a trailer, a stored trailer; **Automate** needs Automated dispatch researched, a stored vehicle with a route that has a stop; **Refill all** with its cost — doc `docs/ui/vehicles.md:11-36`, code `src/game/ui/hangar.tsx:18-209`, `messages/en/vehicles.json`, test `src/game/sim/feature-vehicles/vehicle.test.ts:141`.
- [ ] 50. Parked dialog: title **Quad** / **Tractor**, fuel bar and **Embark**; Quad shows 6 slots; seeder / sprayer one hopper slot with the down arrow; harvester 8 slots; no trailer → Embark only — doc `docs/ui/vehicles.md:40-51`, code `src/game/ui/vehicle.tsx:52-117`, test `src/game/sim/feature-vehicles/vehicle.test.ts:375`.
- [ ] 51. Dashboard: shown only while the local player drives; **F: {n}%** and **V: {n} km/h** (speed × `QUAD_SHOW_MUL` 4); tractor with a trailer shows used/100; **Disembark** always; **Dock** inactive off a hangar pad with hover **Dock at the hangar arrows.**; **Unload** / **Load** only on that pad side and only with cargo; tractor gets the **Boom 3** / **Boom 5** toggle; needles: fuel −45° to +45°, speed ±36° at ± top speed, steer ±90° — doc `docs/ui/vehicles.md:55-86`, `docs/art/vehicles.md:76-86`, code `src/App.tsx:1209`, `:1299-1436`, `src/game/view/motion.ts:98-137`, `messages/en/vehicles.json`, no test read.
- [ ] 52. Vehicle automation dock: rail item after Automated dispatch; `w-[32rem]`; opening switches to the Vehicles lens and picks the first route, closing restores the lens and drops the pick; double-click the active tab to rename, Enter or leaving the field saves, empty ignored, Esc restores without closing; body **Vehicle**, **Boom** (tractor with trailer only), **Stops**, **Out on this route**; vehicle grid Quad / Tractor over No trailer / Seeder / Sprayer / Harvester, bottom row off for Quad; out-on-route status **Out of fuel** / **Stopped** / **Heading to {n}**; **Delete route** off with hover **Send its vehicles back first.**; **Deploy** off with a hover naming what is missing — doc `docs/ui/vehicles.md:90-122`, code `src/game/ui/hud.tsx:185`, `src/App.tsx:739-750`, `src/game/ui/feature-vehicles/automation.tsx:145-427`, `:590-609`, no test read.
- [ ] 53. Map editing: drag a stop to move it, right-click a stop to remove it; hovering with a route picked adds **Add stop here** / **Add load here** / **Add unload here** / **Add wait here** / **Add refuel here** — doc `docs/ui/vehicles.md:126-138`, code `src/game/view/map.tsx:471-548`, `src/App.tsx:1533-1543`, no test read.
- [ ] 54. Route drawing: picked route numbered from 1, Load / Unload markers larger with a heavier ring and number; a dragged marker is gold; a tractor-with-trailer route shades tilled cells the boom would sweep, sampled every `SWATH_STEP`, not with fewer than two stops — doc `docs/ui/vehicles.md:142-144`, code `src/game/view/layers/overlay.ts:633-697`, no test read.
- [ ] 55. Follow camera: while driving, the camera follows the vehicle — doc `docs/ui/vehicles.md:148`, code `src/game/view/world-view.ts:161-170`, no test read.
- [ ] 56. WASD while driving sends drive on change, ignores text fields, releases on window blur; Enter gets in or out — doc `docs/ui/vehicles.md:152-154`, code `src/App.tsx:370-431`, no test read.
- [ ] 57. Pad arrows: hangar and field-silo return arrows and machine pad arrows are drawn while driving or in the Vehicles lens; Refueling station north drop arrow and south refuel mark; opacity 0.5, 1 when that Load or Unload would move something — doc `docs/ui/vehicles.md:158`, code `src/game/view/layers/overlay.ts:449-468`, `src/game/sim/feature-vehicles/vehicle.ts:724-742`, no test read.
- [ ] 58. Look: **Vehicle hangar** on a hangar cell, **Quad** / **Tractor** on a parked or automated vehicle's cell, silo names on silos — doc `docs/ui/vehicles.md:168-175`, code `src/game/sim/look.ts:102-107`, `src/game/sim/prompt.ts:613-620`, no test read.
- [ ] 59. Art files exist with the stated sizes: `prop-hangar.svg` 72×48, silos 48×72, `prop-trailer-rake.svg` 120×8, quad, tractor and trailers 24×24; `ui-dash-quad.svg` and `ui-dash-tractor.svg` carry `fuel-needle`, `speed-needle`, `steer`; `ui-hangar-return.svg`, `ui-pad-drop.svg`, `ui-pad-take.svg`, `ui-pad-refuel.svg`, `ui-slot-down.svg` exist — doc `docs/art/vehicles.md:11-100`, code `src/assets/props/`, `src/assets/items/`, `src/assets/ui/`, no test read.
