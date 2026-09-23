# Docs review: Sensors

Notes: `docs/mechanics/sensors.md`, `docs/items/sensors.md`, `docs/ui/sensors.md`, `docs/art/sensors.md`, `docs/art/electricity.md`
Code: `src/game/sim/sensor.ts`, `src/game/sim/nets.ts`, `src/game/sim/tick.ts`, `src/game/sim/world.ts`, `src/game/sim/prompt.ts`, `src/game/sim/look.ts`, `src/game/sim/plot.ts`, `src/game/sim/mp.ts`, `src/game/sim/building.ts`, `src/game/sim/feature-place/place.helpers.ts`, `src/game/sim/feature-vehicles/vehicle.ts`, `src/game/sim/feature-save/save.ts`, `src/game/sim/feature-save/save.parse.ts`, `src/game/ui/objecthud.tsx`, `src/game/view/hit.ts`, `src/game/view/layers/overlay.ts`, `src/App.tsx`, `src/game/defs/items.ts`, `src/game/defs/research.ts`, `src/game/defs/shelf.ts`
Tests: `src/game/sim/sensor.test.ts`, `src/game/defs/research.test.ts`, `src/game/view/hit.test.ts`, `src/game/sim/feature-vehicles/vehicle.test.ts`, `e2e/sensors.spec.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Can a guest in a multiplayer game place a valve or click one open and shut?
- [ ] **doc** `docs/mechanics/sensors.md:189` — "Guest may wire a valve. Guest still cannot place or click one."
- [ ] **code + test** `src/game/sim/mp.ts:214` — `permit` lets a guest do every command except pick a skill, expand land, and cheat, so a guest can place, click and wire a valve. `src/game/sim/sensor.test.ts:753` "…guest wires, places, and clicks" asserts `permit` is true for a guest `placePipe` and `clickValve` (`:783-784`).
- [ ] **none**

### 2. What does the sprinkler settings panel look like after Smart irrigation?
- [ ] **doc** `docs/mechanics/sensors.md:183` — the Smart irrigation research row "grants the crop dial".
- [ ] **doc** `docs/ui/sensors.md:56` — "Sprinkler tune unchanged (`Btn` + icon)".
- [ ] **code** `src/game/ui/objecthud.tsx:40`, `:402`, `:439` — the panel **Sprinkler output** is a slider in litres a day per tile with crop marks beside it; there is no crop dial and no button row (see the water review, questions 1 and 24).
- [ ] **none**

### 3. With the Sensors lens on, does clicking a sensor still flip, press or open its settings?
- [ ] **doc** `docs/mechanics/sensors.md:66` — yes: a port is only a small disc (`PORT_HIT`); the cell body does the device action (Flip, Press, Tune, Fill) in every lens.
- [ ] **doc** `docs/ui/sensors.md:79` — no: Flip / Press / Tune fire only when the lens is not `sensors`; in `sensors` an output-only whole cell starts a wire.
- [ ] **code + test** `src/game/view/hit.ts:344-366` — in the Sensors lens a click inside a port disc (`PORT_HIT` 0.18 tile) starts or ends a wire; outside the discs, the whole cell starts a wire only for lamp, fertilizer sensor, water-system sensor, chest, freezer, seed silo, additive store and pump (`WHOLE_CELL_PORT`, `:203`); every other sensor falls through to its settings panel or its Flip / Press. `src/game/view/hit.test.ts:77-78` asserts a click on a water sensor and a pressure plate in the `sensors` lens opens their panels. Matches `docs/mechanics/sensors.md:66`.
- [ ] **none**

### 4. What colour is the input mark on a valve in the Sensors lens?
- [ ] **doc** `docs/ui/sensors.md:48` — every port mark is red (`fruit-red`) while idle and blue (`water`) while its signal is on.
- [ ] **code** `src/game/view/layers/overlay.ts:561-567` — a valve's input mark is blue while the valve lets water through (`world.conducts`) and red while it is closed, whatever the wire carries; an unwired open valve shows a blue mark. The function that reads the held input for valves (`portHigh`, `:223`) is not used for valve marks. No test.
- [ ] **none**

### 5. What does the counter's reset button say?
- [ ] **doc** `docs/ui/sensors.md:62` — **Reset**.
- [ ] **doc** `docs/ui/sensors.md:73` — **Reset to 0**; it sets the count to 0, not to the target.
- [ ] **code** `src/game/ui/objecthud.tsx:287` — `m.sensors_reset({ n: 0 })`, "Reset to {n}" (`messages/en/sensors.json:13`), so **Reset to 0**; `resetCounterBody` sets `count = 0` and keeps `n` (`src/game/sim/world.ts:1182`). Test `src/game/sim/sensor.test.ts:1157-1159`.
- [ ] **none**

### 6. How fast does a vehicle drive over a sensor cell?
- [ ] **doc** `docs/mechanics/sensors.md:9` — a vehicle whose `floor` is on a sensor cell drives at `SURFACE_SLOW` (0.4).
- [ ] **code** `src/game/sim/feature-vehicles/vehicle.ts:158` — paving is checked first: a sensor cell paved with **paved** or **asphalt** paving gives `SURFACE_PAVED` (1.3); an unpaved sensor cell gives `SURFACE_SLOW` (0.4). Sensor cells can be paved because `isPavingSite` accepts every solid cell except rock and tree (`src/game/sim/plot.ts:155`).
- [ ] **test** `src/game/sim/feature-vehicles/vehicle.test.ts:157` — asserts `SURFACE_SLOW` is 0.4 and solid cells are slow; it does not test a paved sensor cell.
- [ ] **none**

## Doc only (no code found)

### 7. What is the variety sensor's "plain crop" flag called?
- [ ] **doc** `docs/mechanics/sensors.md:13` — place default `base = true`. Searched `VarietySensor` fields: the field is `baseOn` (`src/game/sim/sensor.ts:161`, saved as `baseOn` in `src/game/sim/feature-save/save.ts:424`); `base` on a sensor is its `RectBase` position.
- [ ] **removed from the game**
- [ ] **none**

### 8. Is there electricity in the game (windmill, generator, battery, power line, power switch)?
- [ ] **doc** `docs/art/electricity.md:1-25` — describes the art for a windmill, generator, battery, power lines and a power switch; "Research card reuses `item-windmill`" (`:25`). `docs/art/sensors.md:7` says not to reuse these for sensors. Searched `windmill`, `generator`, `battery`, `power-` in `src/**/*.ts`, `src/**/*.tsx` and `messages/en/*.json`: no SKU, cell kind, research row or string. The SVG files exist (`src/assets/items/item-windmill.svg`, `src/assets/props/prop-generator.svg`, `src/assets/joints/power-*.svg`, …) and are loaded only by the debug atlas page (`src/game/ui/atlas-view.tsx:9`, opened from `src/main.tsx:60`). No research card uses `item-windmill`.
- [ ] **removed from the game**
- [ ] **none**

## Code only (no note mentions it)

### 9. Can the Infuser be switched off by a signal?
- [ ] **code** `src/game/sim/building.ts:997` — the Infuser has an `in` port like the mill; `evalSensors` sets its `inn` (`src/game/sim/nets.ts:267`), and a high input pauses it (`src/game/sim/feature-machines/machine.ts:413`). The port table (`docs/mechanics/sensors.md:59`) lists mill, jam, still and station, and the rule text (`:84`, `:108`, `:110`) lists mill, jam, still and furnace; the Infuser is in neither.
- [ ] **intended, document it**
- [ ] **not intended**

### 10. Does a freezer send a signal when it is full?
- [ ] **code** `src/game/sim/sensor.ts:305` — a freezer's `out` goes high, after `SENSOR_HOLD`, when none of its slots is empty, the same rule as the chest. The port table lists the freezer (`docs/mechanics/sensors.md:61`), but the rule (`sensors.chest`, `:213`) names only the chest. No test for the freezer.
- [ ] **intended, document it**
- [ ] **not intended**

### 11. What does the prompt say while dragging a wire?
- [ ] **code** `src/game/sim/prompt.ts:435-449` — while a wire is being drawn: over anything that is not a port, or over an output port, **Cannot wire here**; over the input of a pair that is already wired, **Remove wire**; if it would make a loop, **Cannot loop**; otherwise **Place** (`messages/en/prompt.json:27`). `docs/ui/sensors.md:33` lists the first three and not **Place**. In delete mode a wire under the pointer is chosen before a pipe or sprinkler and reads **Demolish wire** (`src/game/view/hit.ts:292`, `src/game/sim/prompt.ts:488`).
- [ ] **intended, document it**
- [ ] **not intended**

### 12. How is the Sensors shelf laid out?
- [ ] **code** `src/game/defs/shelf.ts:67-97` — two groups: **Signal** (lever, button, lamp, logic gate, NOT gate, pulser, counter, traffic light) and **Readers** (water, fertilizer, harvest, variety, weather sensors, pressure plate, day sensor). The shelf line is "Signal, gates, readers." (`messages/en/hud.json:37`). `docs/items/sensors.md:3-5` lists the SKUs without groups.
- [ ] **intended, document it**
- [ ] **not intended**

### 13. What is the "day" checkbox on the day sensor called?
- [ ] **code** `src/game/ui/objecthud.tsx:117` — the second box reads **Day** (`sensors_day`), while the same phase is named **Midday** everywhere else (`names_phase_day`, `messages/en/names.json:26`). The other three boxes use the phase names **Sunrise**, **Sunset**, **Twilight**. `docs/ui/sensors.md:63` says **Day**.
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 14. Place defaults: lever off; button 0; counter target 1, count 0; water sensor **Wilting** and **Overwatered** on; harvest `any`; day sensor only `day` on; logic gate `or`; variety sensor plain only; weather sensor `clear` only; pressure plate vehicle only; traffic light 0 — doc `docs/mechanics/sensors.md:13`, code `src/game/sim/sensor.ts:41-197`, test `src/game/sim/sensor.test.ts:1114`, `:1165`, `:1354`, `:1433`, `:1472`, `:1516`, `e2e/sensors.spec.ts:88`, `:104`.
- [ ] 15. Counter target outside 1 to `COUNTER_MAX` (9999), or not a whole number, is ignored; changing the target keeps the count — doc `docs/mechanics/sensors.md:15`, `docs/ui/sensors.md:73`, code `src/game/sim/world.ts:1170`, `src/game/defs/items.ts:249`, test `src/game/sim/sensor.test.ts:1114`.
- [ ] 16. Saves write the logic gate as `'logic'`; `'and'` / `'or'` cells are still read as a logic gate in that mode — doc `docs/mechanics/sensors.md:17`, code `src/game/sim/feature-save/save.ts:395`, `src/game/sim/feature-save/save.parse.ts:600-612`, no test of the old kinds.
- [ ] 17. Fenceable sensors are water, fertilizer, harvest, variety and pressure plate; others cannot go on a fence and a fence cannot go on them; fence then sensor and sensor then fence give the same cell; deleting a fenceable sensor on a fence removes the sensor and its wires and leaves the fence — doc `docs/mechanics/sensors.md:23-36`, code `src/game/sim/sensor.ts:129-183`, `src/game/sim/plot.ts:133`, `src/game/sim/feature-place/place.helpers.ts:73`, `:428`, test `src/game/sim/sensor.test.ts:1304`, `:1329`, `e2e/sensors.spec.ts:141`, `:163`.
- [ ] 18. Range: off a fence, the 3×3 around the sensor without its own cell (pressure plate includes its own cell); on a fence, the insides of every closed fenced area it belongs to; on a fence that closes nothing, always off; weather and day sensors have no range — doc `docs/mechanics/sensors.md:38-43`, code `src/game/sim/sensor.ts:337`, `src/game/sim/nets.ts:288-304`, test `src/game/sim/sensor.test.ts:451`, `:1590`, `e2e/sensors.spec.ts:186`, `:200`.
- [ ] 19. Ports: readers and button out at the bottom; lamp in at the top; NOT, pulser, counter, lever, traffic light in at the top and out at the bottom; logic gate in left, in right, out bottom; mill, jam, still, station, pump in; furnace in and out; chest, freezer, seed silo, additive store out; field silos and compost box none — doc `docs/mechanics/sensors.md:51-64`, code `src/game/sim/sensor.ts:41-197`, `:697`, `src/game/sim/building.ts:337`, `:528`, `:658-1431`, test `src/game/sim/sensor.test.ts:416`.
- [ ] 20. Sprinkler and valve inputs exist only after `unlock-smart-irrigation`; wiring either before that is refused — doc `docs/mechanics/sensors.md:57-58`, `:183`, `:187`, code `src/game/sim/world.ts:1293-1299`, `src/game/view/hit.ts:245`, test `src/game/sim/sensor.test.ts:813`.
- [ ] 21. Wires run from an output to an input; many wires may leave one output; many may enter one input and the input is on if any is; one wire per pair of devices, and wiring the same pair again removes it — doc `docs/mechanics/sensors.md:74-76`, code `src/game/sim/world.ts:1104-1127`, `src/game/sim/sensor.ts:562`, test `src/game/sim/sensor.test.ts:323`, `:355`, `:390`, `:403`.
- [ ] 22. A wire that would close a loop through NOT, logic gate or lamp is refused (**Cannot loop**); a loop through the input of a lever, pulser, counter or traffic light is allowed; a lever chain through NOT moves one step per tick — doc `docs/mechanics/sensors.md:80-102`, `docs/ui/sensors.md:33`, code `src/game/sim/sensor.ts:501-540`, `src/game/sim/prompt.ts:442`, test `src/game/sim/sensor.test.ts:83`, `:108`, `:210`.
- [ ] 23. Tick order: vehicles move, field, pumps and wells gather, sensors read and evaluate, vehicles at stops are handled, machines, sprinklers pour — doc `docs/mechanics/sensors.md:92-100`, `:158`, code `src/game/sim/tick.ts:212-218`, test `src/game/sim/sensor.test.ts:659`, `:1560`.
- [ ] 24. A reader, store or traffic-light output keeps a new level for `SENSOR_HOLD` (8) ticks, then follows its reading; lever, pulser, counter, lamp and machine inputs have no hold — doc `docs/mechanics/sensors.md:106-108`, code `src/game/sim/sensor.ts:467`, `src/game/defs/items.ts:248`, test `src/game/sim/sensor.test.ts:630`.
- [ ] 25. NOT inverts; logic gate `or` is on if either side is, `and` only if both are; lamp shows its input — doc `docs/mechanics/sensors.md:110`, code `src/game/sim/sensor.ts:65-91`, test `src/game/sim/sensor.test.ts:295`, `:1354`.
- [ ] 26. A machine with a high input pauses; unwired it runs — doc `docs/mechanics/sensors.md:110`, code `src/game/sim/feature-machines/machine.ts:382`, `:535-555`, `src/game/sim/feature-machines/recipe.ts:676`, test `src/game/sim/sensor.test.ts:1036`.
- [ ] 27. Button is on for `BUTTON_PULSE` (4) ticks; pulser is on for one tick when its input turns on — doc `docs/mechanics/sensors.md:195`, code `src/game/sim/sensor.ts:477-489`, `:102`, `src/game/defs/items.ts:247`, test `src/game/sim/sensor.test.ts:272`, `:1092`.
- [ ] 28. Counter adds one each tick its input is on; at the target it sends one tick of signal and starts again from 0; the dial art uses count ÷ target in quarters, full while firing — doc `docs/mechanics/sensors.md:114-124`, `:219`, code `src/game/sim/sensor.ts:118`, `:437`, test `src/game/sim/sensor.test.ts:1114`.
- [ ] 29. Lever: Flip always toggles; an input turning on also toggles; both in one tick cancel out — doc `docs/mechanics/sensors.md:223`, code `src/game/sim/sensor.ts:51`, `:491`, test `src/game/sim/sensor.test.ts:1188`.
- [ ] 30. Water sensor: on if any growing or ripe plant or tree in range is in the red water band and matches a ticked box (dry → **Wilting**, drowning → **Overwatered**); a tree counts once; both off → off — doc `docs/mechanics/sensors.md:128-134`, code `src/game/sim/sensor.ts:373-391`, test `src/game/sim/sensor.test.ts:489`.
- [ ] 31. Fertilizer sensor: on if any growing plant (not ripe) or tree in range is in the red fertilizer band — doc `docs/mechanics/sensors.md:135`, code `src/game/sim/sensor.ts:392-406`, no dedicated test.
- [ ] 32. Harvest sensor: `any` on at one ripe plant; `all` on when at least one growing or ripe plant is in range and all are ripe; trees ignored — doc `docs/mechanics/sensors.md:136-137`, code `src/game/sim/sensor.ts:407-410`, test `src/game/sim/sensor.test.ts:544`.
- [ ] 33. Variety sensor reads growing and ripe plants and trees past the trunk stage by tier; weather sensor reads today's weather; day sensor reads the current phase; all boxes off → off — doc `docs/mechanics/sensors.md:138-142`, code `src/game/sim/sensor.ts:362-371`, `:420-433`, `src/game/sim/nets.ts:305-308`, test `src/game/sim/sensor.test.ts:1165`, `:1472`, `:1516`.
- [ ] 34. Pressure plate: a Quad or tractor out on the field, a player who is in the game, or an item on the ground in range; stored vehicles, trailers and away players do not count — doc `docs/mechanics/sensors.md:146-148`, code `src/game/sim/sensor.ts:447`, `src/game/sim/nets.ts:293-303`, test `src/game/sim/sensor.test.ts:908`, `:1433`.
- [ ] 35. Water-system sensor: joins a water network at any corner with a pipe; on when this tick's pour of the sprinklers allowed to pour (read before evaluation) is more than the tanks hold after gathering — doc `docs/mechanics/sensors.md:150`, code `src/game/sim/nets.ts:309-321`, test `src/game/sim/sensor.test.ts:421`, `:659`.
- [ ] 36. Pump input: unwired it gathers; wired and on it skips gathering, from the next gather after the input turns on; stored water still fills buckets and feeds the network; `inn` not saved — doc `docs/mechanics/sensors.md:152-164`, code `src/game/sim/nets.ts:346`, `src/game/sim/sensor.ts:653`, `src/game/sim/feature-save/save.ts:250`, test `src/game/sim/sensor.test.ts:1560`, `e2e/sensors.spec.ts:225`.
- [ ] 37. Traffic light: unwired it holds; its output is on while a running vehicle's current stop is a wait at this cell, the vehicle is on the cell and the input is off; the vehicle leaves when the input is on; deleting the light removes wait stops on it and its wires — doc `docs/mechanics/sensors.md:166-172`, code `src/game/sim/feature-vehicles/vehicle.ts:1558-1612`, `src/game/sim/feature-place/place.helpers.ts:50`, test `src/game/sim/sensor.test.ts:1257`.
- [ ] 38. Sprinkler: unwired it pours; wired it pours only while its held input is on — doc `docs/mechanics/sensors.md:176-181`, code `src/game/sim/sensor.ts:496`, `src/game/sim/nets.ts:211`, test `src/game/sim/sensor.test.ts:652`, `:813`.
- [ ] 39. Valve: unwired it follows its hand setting and takes the click; wired it follows its held input, refuses the click and keeps its hand setting; deleting a valve removes its wires — doc `docs/mechanics/sensors.md:187`, `:201`, code `src/game/sim/nets.ts:174`, `src/game/sim/sensor.ts:667`, `src/game/sim/feature-place/place.ts:119`, test `src/game/sim/sensor.test.ts:753`, `:790`.
- [ ] 40. Chest full (no empty slot of `CHEST_SLOTS` 9), seed silo at `SILO_SEED_CAP` (100), additive store at `ADDITIVE_CAP_LITERS` (200), furnace with no units → `out` on after hold — doc `docs/mechanics/sensors.md:108`, `:213-215`, code `src/game/sim/sensor.ts:303`, `src/game/defs/items.ts:33`, `:119-120`, test `src/game/sim/sensor.test.ts:1053`, `:1077`.
- [ ] 41. Deleting any building drops the wires on its cells — doc `docs/mechanics/sensors.md:9`, code `src/game/sim/feature-place/place.helpers.ts:54`, `:109-197`, test `src/game/sim/sensor.test.ts:1329`.
- [ ] 42. Shelf **Sensors** (id `logic`, tab `automation`) shows after `unlock-sensors`; `buy-or`, `buy-and`, `buy-water-system` are never shown — doc `docs/items/sensors.md:3-9`, code `src/game/defs/shelf.ts:67`, `src/game/sim/world.ts:936`, `src/game/defs/research.ts:472-515`, test `src/game/defs/research.test.ts:357`, `src/game/sim/sensor.test.ts:1222`.
- [ ] 43. Sensors lens appears after `unlock-sensors`; opening the Sensors shelf switches the lens to `sensors` until Build closes; an armed sensor SKU forces it — doc `docs/ui/sensors.md:11-17`, code `src/game/ui/lens.tsx:98`, `src/App.tsx:577-592`, `:1440-1453`, no test.
- [ ] 44. In the Sensors lens, sensor cells get no grey fade — doc `docs/ui/sensors.md:21`, code `src/game/view/layers/overlay.ts:192`, no test.
- [ ] 45. Range shading for fenceable sensors: every one in the Sensors lens, the open panel's sensor (water, harvest, variety, pressure), the hovered one, and the armed SKU's ghost; none on a fence that closes nothing — doc `docs/ui/sensors.md:25-27`, code `src/game/view/layers/overlay.ts:379-404`, `:440-446`, test `e2e/sensors.spec.ts:186`, `:200`.
- [ ] 46. Port marks: circle for out, square for in, at the port position, red idle and blue on, ink outline, inside a see-through halo (0.3) the size of the click area; shown in the Sensors lens or while drawing a wire; wires are red idle, blue on — doc `docs/ui/sensors.md:39-48`, `docs/art/sensors.md:55`, code `src/game/view/layers/overlay.ts:472`, `:529-587`, no test.
- [ ] 47. Settings panels: titles **Water sensor**, **Harvest sensor**, **Counter**, **Day sensor**, **Logic gate**, **Variety sensor**, **Weather sensor**, **Pressure plate**; lead-in **Send signal when...**; boxes **Wilting** / **Overwatered**, radio **Any** / **All**, **Sunrise** / **Day** / **Sunset** / **Twilight**, radio **OR** / **AND**, **Plain** / **Named** / **Heirloom**, **Clear** / **Rain** / **Dry** / **Flood** / **Drought**, **Vehicle** / **You** / **On the ground**; counter has **Count to** field; no panel for fertilizer, water-system, pulser, lamp, traffic light — doc `docs/ui/sensors.md:56-73`, code `src/game/ui/objecthud.tsx:63-238`, `:241-294`, `:526-540`, `messages/en/sensors.json`, test `e2e/sensors.spec.ts:88`, `:104`.
- [ ] 48. Lever and button: the player walks there; prompts **Flip lever** / **Press button** — doc `docs/ui/sensors.md:54`, code `src/game/sim/prompt.ts:732-736`, `messages/en/prompt.json:36-37`, test `src/game/sim/sensor.test.ts:272`.
- [ ] 49. Art: every sensor has an item and a prop file with the listed groups (lever, button, lamp, pulser, variety, weather, harvest, day, water-system, pressure plate, traffic light `off` / `on`; logic `or` / `and`; counter `s0`–`s4`; water `red` / `blue`; fertilizer `red` / `ok`); `item-or` / `item-and` files remain; `pipe-valve-jack.svg` exists — doc `docs/art/sensors.md:19-41`, code `src/assets/props/prop-*.svg`, `src/assets/joints/pipe-valve-jack.svg`, `src/game/view/atlas.ts:892`, no test read.
