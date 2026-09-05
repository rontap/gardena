# Sensors

Types [[architecture/world]]. Shop [[mechanics/research]]. Water [[mechanics/water]]. Cmds [[architecture/log]]. Seats [[mechanics/multiplayer]]. Numbers preference unless marked. Classes `sim/sensor.ts`. Ids `sim/ids.ts`.

Combinational loops stay illegal. Sequential feedback through lever / pulser / counter / traffic-light `in` is legal.

`BUTTON_PULSE`, `SENSOR_HOLD`, `COUNTER_MAX` — preference. `Sku.tab` `automation`. `haggling` applies.

## Cells

1×1. `isSolid`. Sunk: art. Vehicles `floor` this cell → `SURFACE_SLOW`. Place like tap. Pay on confirm. StayArmed. Stamp many. Guest `GUEST_BUILD`. Delete building always; drops incident wires.

Solid center never holds a plant.

Place defaults: `Lever.on = false` `inn = 0` `prev = 0`. `Button.left = 0`. Pulser `prev = 0` `inn = 0` `out = 0`. Counter `n = 1` `count = 0`. Water `wilt = true` `over = true`. Harvest `mode = 'any'`. Day `day = true`, others false. Traffic-light `inn = 0` `out = 0` `hold = 0`. `out` / `inn` / `hold` 0.

Tune `n` out of range is no-op, does not write.

## Make table

Not a table in `src/` yet. Next to the classes: `{ [K in SensorKind]: { sku, make } }`. `makeSensor` / `skuKind` become lookups of that map. Ports live on the device. Building `ownsPort`: origin cell and `c.ports` includes the port. Sensor kind arms stay until that wave. `evalDag` stays a function. Do not unify sensors with `Machine`. Sprinkler `in` and valve `in` stay on those `WireEnd`s, not a building class. Live `makeSensor` / `skuKind` / sensor `ownsPort` switches stay until that wave.

## Ports

| kind | in | out |
|---|---|---|
| button, sensor-water, sensor-fert, sensor-harvest, sensor-day, water-system, vehicle-detector | — | `out` bottom |
| lamp | `in` top | — |
| not, pulser, counter, lever, traffic-light | `in` top | `out` bottom |
| and, or | `in-l` left, `in-r` right | `out` bottom |
| sprinkler (after `unlock-smart-irrigation`) | `in` | — |
| valve, after `unlock-smart-irrigation` | `in` on the body | — |
| mill, jam, still, station | `in` origin top | — |
| furnace | `in` origin top | `out` origin bottom |
| chest, freezer, seed-silo, additive-store | — | `out` origin bottom |

Compost-box: pads, no port. Barrel, grinder, field silos: no port.

Illegal combos unrepresentable per device. Finalize no-ops a `WireEnd` that the device does not own.

No prop nubs on mill/jam/still/furnace/chest/freezer/silo/additive. Sensor lens dots only. `WireEnd.at` = origin. Still east cell: no port. Furnace south cell: no port. First machine with both `in` and `out`.

A port is a disc of `PORT_HIT` at `portXY`, live only in the `sensors` lens. Paint is the hitbox — [[ui/sensors]]. The cell body is the device action in every lens: Flip, Press, Tune. No half-cell port, no lens-dependent hitbox.

Whole-cell fallback, `sensors` only, for the devices with no body action: lamp (`in`), sensor-fert / water-system / vehicle-detector / chest / freezer / seed-silo / additive-store (`out`).

Sensors lens: lever / traffic-light are not output-only whole-cell. Top half `in`, bottom `out` (NOT). Lens off: Flip / Press still fire.

## Wire

`World.wires: Wire[]`. Directed `from` → `to`. Signal `0 | 1`. Fan-out: many wires may share `from`. Fan-in: many wires may share a `to` port. Port level = OR of those wires. Unwired port still 0. Visual cross is paint, no join.

One direct path: unique on `nodeKey(from)` → `nodeKey(to)`, not `endKey`. A lever cannot occupy both `in-l` and `in-r` of the same AND. Indirect paths legal. **Combinational** cycles rejected at finalize (`wouldCycle`). Sequential feedback through lever / pulser / counter `in` is legal.

Toggle-remove: finalize of `from` → `to` when a wire already exists with the same node pair: drop that wire, `place = none`. Prompt **Remove wire**.

`from` is an output port. `to` is an input port. `{ kind: 'valve' }` is any valve, once `unlock-smart-irrigation` is done.

No wire SKU. Drawable in view when `Lens` is `sensors`. Armed sensor-cell SKU forces that lens. Wires are always sim-state. View-gated paint and port hits.

Start: `Act.armWire` sets `Seat.place = { kind: 'wire'; from }`. Finalize: `Act.placeWire`. Same node pair already present → drop that wire. Combinational cycle → no-op, place stays. Illegal ports → no-op. `Act.cancelPlace` clears.

Delete: Delete tool, nearest bezier within `VERTEX_HIT`. Building delete, sprinkler delete, valve delete drop incident wires.

## Graph / eval

Two graphs. Wiring may contain cycles **through memory**. Combinational wiring may not.

**Sequential (memory) devices:** lever, pulser, counter. Their `in` is sampled from **last tick’s** outputs, then they update. Internally `in` does not combinationally drive `out` this tick. Flip / Press still apply in `apply` (same-tick Flip + eval edge: both, net zero). Traffic-light `in` is a sequential cut for `wouldCycle` (`isSeqIn`); `inn` is sampled **this** tick (mill-like), then wait resolve after `evalDag`. `inn` does not combinationally drive `out`.

**Combinational devices:** not, and, or, lamp, sprinkler `in`, valve `in`, mill / jam / still / furnace `in`. Traffic-light `inn` set in `evalDag` like mill.

**Sources:** button, world-readers, chest / freezer / seed-silo / additive-store, furnace `out`. Traffic-light `out` after `tickDispatch` (this tick’s waiters).

`wouldCycle(wires, from, to, isSeqIn)`: walk only edges whose `to` is **not** a sequential input. Same-node `from`/`to` is a cycle iff that node is combinational. Lever/pulser/counter/traffic-light out→own in is legal. AND/OR/NOT/lamp out→own in is a cycle.

Combo cycle: finalize no-op, **Cannot loop**. Sequential cut: legal.

`evalDag` still the tick function. Combo subgraph is a DAG. Tick:

1. Readers sample the just-ticked field / nets / vehicles / `clock.phase()`. Raw `Signal`. Sequential `.out` still last tick. Traffic-light `.out` still last tick.
2. Topo-eval **combinational** gates from those outs. Lamp / machine / sprinkler / valve / traffic-light `inn` from this combo + sequential outs.
3. Sequential `inn` = OR of wires on `in` (sees this tick’s combo, last tick’s other memories).
4. Sequential update: lever edge, pulser, counter. Button countdown already on `tick()`.
5. Hold on world-readers + sprinkler input + wired valve. Traffic-light `out` hold is after `tickDispatch`, not here.
6. Actuators use **this** tick’s held inputs for pour / conduction.
7. `tickDispatch`: wait / load / unload using this tick’s light `inn`. Then traffic-light `out` + `SENSOR_HOLD` from this tick’s waiters.

Consequence: a lever chain `Q₀ → NOT → Q₁` no longer ripples in one tick. `Q₁` toggles the tick after `Q₀` falls. One tick per stage.

Unwired input = `0`. Assumption: unwired gate / lamp / NOT / AND / OR / pulser / counter / lever-`in` / sprinkler-input-port / valve-input reads 0. Unwired **sprinkler pour** is the opposite — see actuators. An input is high iff any incoming wire is high.

`SENSOR_HOLD`: after an output **edge** (0→1 or 1→0), that node keeps the new level for `SENSOR_HOLD` ticks, then follows raw. `hold` is remaining ticks. 0 = not holding.

World-readers: water, fert, harvest, water-system, vehicle, day, chest, freezer, seed-silo, additive-store, furnace `out`, traffic-light `out`. Mill/jam/still/furnace `inn` like lamp, no hold. Pulser / counter / lever no hold. Traffic-light `inn` no hold. Furnace `out` high iff `units === 0`. `SENSOR_HOLD` on that `out`.

Button: `out` high exactly `BUTTON_PULSE` ticks. `left` counts down on `tick()`. Reach 0 → `out = 0`. Assumption: toggle while high restarts `BUTTON_PULSE`.

Lever: Flip always `on = !on` in apply (`toggle` walk-to). Eval: `inn` = OR of wires on `in`. If `prev === 0 && inn === 1` then `on = !on`. Then `prev = inn`. `out = on ? 1 : 0`. Unwired `inn` 0: no edge, Flip unchanged. Same-tick Flip + rising edge: both apply (two toggles → net zero). Look **on** / **off** still from `on`.

NOT: `out = 1 - inn`. AND: (OR of `in-l`) AND (OR of `in-r`). OR: (OR of `in-l`) OR (OR of `in-r`). Lamp: `inn` only. Mill/jam/still/furnace: `inn === 1` skip tick; unwired 0 ticks. No hold.

Pulser: if `prev === 0 && inn === 1` then `out = 1` else `out = 0`; then `prev = inn`. Pulse is 1 tick on 0→1.

Counter: if `inn === 1` then `count += 1`. If `count >= n` then `out = 1`, `count = 0`; else `out = 0`. Increments each tick `inn === 1`.

Chest / freezer / seed-silo / additive-store: `out` + `SENSOR_HOLD`. Full: chest/freezer no empty slot; silo `used >= SILO_SEED_CAP`; additive `used >= ADDITIVE_CAP_LITERS`.

Furnace: `out` + `SENSOR_HOLD`. High iff `units === 0`. Combinational `inn` like mill, no hold.

## Counter dial

`n ≥ 1`. `pct = count / n`. Not `floor(4 * count / n)`.

| group | when |
|---|---|
| `s0` | `pct === 0` (and not firing) |
| `s1` | `0 < pct < 0.25` |
| `s2` | `0.25 ≤ pct < 0.50` |
| `s3` | `0.50 ≤ pct < 0.75` |
| `s4` | `pct ≥ 0.75`, or this tick `out === 1` |

Art groups [[art/sensors]]. This table is sim.

## Readers

3×3 centered on the sensor cell except day. No size HUD. Skip unowned. Skip non-plants. Skip trees. Center is the sensor, never a plant.

Growing annuals unless noted.

| Device | High when | HUD |
|---|---|---|
| Water | any in range matches a checked box: Wilting = `waterBand === 'red'` ∧ ¬`drowning`; Overwatered = `waterBand === 'red'` ∧ `drowning` | two checkboxes. Default both **on**. Both off → raw 0 |
| Fertilizer | any **growing** `fertBand === 'red'` | none |
| Harvest `any` | ≥1 `ripe` | Any / All. Default **Any** |
| Harvest `all` | count(`growing` ∨ `ripe`) ≥ 1 and every such is `ripe` | |
| Water-system | that net’s sprinkler want this tick > `stored` | none |
| Vehicle | a field Quad or tractor `floor(x, y)` equals the cell | none |
| Day | current `clock.phase()` is a checked flag | four checkboxes. Default **Day** on, others off. All off → raw 0 |

Day: 1×1. Output only. No 3×3. Raw 1 iff `DayPhase` matches a true flag. `SENSOR_HOLD`. Phases [[mechanics/day]].

Vehicle: stored no. Trailer no. `tickVehicles` already ran this `tick()`. Path-cross is not a traffic-light wait.

## Traffic light

1×1 sunk. `SensorKind` `traffic-light`. Look **Traffic light**. Groups **off** / **on** from `inn` (0 red, 1 green). StayArmed. Guest `GUEST_BUILD`. Delete always; strips wait stops targeting this cell. Drops incident wires.

Unwired `inn` 0 = red = hold. Output 1 iff a vehicle’s current stop is this cell **and** it is waiting on it: `running`, wait stop, `floor` is that cell, this tick `inn === 0`. Path-cross is not a wait. `SENSOR_HOLD` on `out`. Several waiters: all hold on 0, all leave on 1. No collision.

SKU `buy-traffic-light`. Sensors shelf. `show` `unlock-sensors`, `need` `unlock-dispatch`. `Sku.tab` automation. `haggling`. `TRAFFIC_LIGHT_PRICE`. Blurb: holds a vehicle until the input is green; output is on while a vehicle waits here.

Water-system: 1×1, joins a net like `Tap` (any corner). Not a producer. Not a fill target. No incident pipe edge at any corner → not on a net. Look: **Water-system sensor - no pipes around sensor!** Raw 0. Taps / stills not in demand. Want = sum of `demand(s)` × `dt` for sprinklers on that net that are **pre-eval** `pourEligible`. `stored` = sum of that net’s reservoirs after gather. High iff want > stored. Assumption: gather then eval then pour, so stored includes this tick’s production; water-system uses pre-eval eligibility so a wire from this sensor can still gate pour **this** tick.

## Actuators

`pourEligible(s)`:

- no wire to that sprinkler `in` → **on** (unwired ≠ low)
- wired → held input `1` = on, `0` = off

Unwired sprinkler still pours after Smart Irrigation. Wired-low does not. Digest distinguishes unwired vs wired-low (wire present, level 0).

Smart irrigation is a `feature`: every vertex sprinkler gains `in`, and the same row grants the crop dial. Wiring a sprinkler before `unlock-smart-irrigation` is a no-op.

`tickWater` pours only `pourEligible` sprinklers, this tick, existing AoE + dial. `tickWater` writes `World.vfx`; `tickBig` does not. View reads that map, never `rate()`.

Valve `in`: `unlock-smart-irrigation` gives every valve one input on the body. There is no smart gate and no smart SKU. Unwired the valve is the hand valve; wired, high opens and low closes, and the click is a no-op. Hold on the input. Affects this tick’s conduction; rebuild nets after eval. `valveHold` holds `level` / `hold` for wired valves only and is rebuilt with the wire set.

Guest may wire a valve. Guest still cannot place or click one.

## Research / shop

| id | effect | unlocks |
|---|---|---|
| `unlock-sensors` | `feature` | SKUs: lever, button, lamp, pulser, counter, water, fert, harvest, water-system, day. Lens `sensors` |
| `unlock-advanced-sensors` | `feature` | SKUs: AND, OR, NOT |
| `unlock-smart-irrigation` | `feature` | feature: sprinkler crop dial + sprinkler and valve signal inputs. No SKU |

`unlock-sensors` is a no-prerequisite root carrying only what stands alone. `startResearch('unlock-smart-irrigation')` no-ops unless both `unlock-adv-irrigation` and `unlock-sensors` are in `done` — `requires` is AND. The card reveals on `unlock-sensors` alone, so it can be on the shelf and shut — [[mechanics/research]].

`skuShown` Sensors shelf after `unlock-sensors`. Every sensor sku shows on `unlock-sensors`. Dual-lock `need` on the capability they read: water `unlock-irrigation`, fert either soil row, water-system `unlock-adv-irrigation`, vehicle-detector `unlock-vehicles`, traffic-light `unlock-dispatch`. AND / OR / NOT unlock `unlock-advanced-sensors`.

Filing: signal → Sensors (`logic`). Readers: water, fert, harvest, water-system, vehicle-detector, day. Traffic light → Sensors (ports like NOT). Vehicle detector → Sensors.

## Lens

`Lens` += `sensors`. Unhidden after `unlock-sensors`. Wires visible and drawable only there. Armed sensor SKU forces this lens. UI chrome [[ui/lens]].

## Place / StayArmed

While a sensor SKU is armed, click confirms place, not a wire. `place none` or `{ kind: 'wire' }`: port clicks arm/finalize wires. StayArmed sensor cells (incl. pulser, counter, day, traffic-light).

## Cmds

Lever / button: walk-to, like valve. `Intent` `{ act: 'toggle'; at: Coord }`. Work 0 on arrive. Flip always toggles.

Config HUDs: remote `ObjectHud`, no walk. Water / harvest / counter / day HUD: guest yes. `openHud` `k: 'sprinkler'` stays host-only.

Counter HUD: title **Counter**. Live `count`. Label **Count to**. Integer field `n`. **Reset to 0** sets `count = 0`, not `n`. Apply immediately, stays open. `n < 1` or `n > COUNTER_MAX` → no-op. Changing `n` keeps `count`; next eval may fire immediately. `Act.resetCounter` legal on a counter cell. Guest yes.

Day HUD: title **Day sensor**. Checkboxes **Sunrise** **Day** **Sunset** **Twilight**. Apply immediately.

Tune prompts: **Tune counter** / **Tune day sensor**.

Not logged: eval, hold countdown, pourEligible, net rebuild, bezier, lens, counter dial group, traffic-light `out` / wait resolve.

Guest wire / sensor HUD: [[mechanics/multiplayer]] `mp.guest`.

## Invariants

`sensors.cycle` — New wire that would combinational-cycle: no-op. Sequential feedback through lever / pulser / counter `in` is legal.

`sensors.button` — Button: high exactly `BUTTON_PULSE` ticks. Pulser: `out` 1 exactly 1 tick on `inn` 0→1, else 0; then `prev = inn`.

`sensors.hold` — Water sensor hold: output edge then hold `SENSOR_HOLD` ticks.

`sensors.unwired-sprinkler` — Unwired sprinkler still pours after Smart Irrigation.

`sensors.valve` — Unwired valve conducts on `open` and takes the click. Wired valve conducts on the held input, refuses the click, and keeps `open` for when the wire goes. Valve delete drops incident wires.

`sensors.port` — A port is a `PORT_HIT` disc at `portXY`, `sensors` lens only. The cell body fires the device action in every lens. Whole-cell fallback only where the device has no body action.

`sensors.fan` — Fan-out: one lever drives two lamps. Fan-in OR: two levers, one lamp, both wires stay; lamp high if either is. Toggle A→B: wires length 0.

`sensors.mask` — 3×3 does not read plants outside the square; center building is not a plant.

`sensors.signal` — Signal is `0 | 1`. Combinational graph is a DAG. Sequential feedback through lever / pulser / counter / traffic-light `in` is legal. Hold on world-readers + sprinkler input + wired valve only. Mill/jam/still/furnace `inn` no hold. Furnace `out` + `SENSOR_HOLD`. Pulser / counter / lever no hold. Traffic-light `inn` no hold; `out` + `SENSOR_HOLD` after `tickDispatch`. Digest distinguishes unwired sprinkler vs wired-low. Port level = OR of wires on that `to`. Direct path unique on `nodeKey(from)` → `nodeKey(to)`, not `endKey`. `SensorKind` += `pulser` `counter` `sensor-day` `traffic-light`. Lever has `in`. AND / OR / NOT require `unlock-advanced-sensors`. Memories sample last tick; combo this tick; then sequential update. Traffic-light `inn` this tick; combo reads last tick’s `out`.

`sensors.light` — Traffic light: 1×1 sunk. Ports `in` top `out` bottom. Unwired `inn` 0 = red = hold. `out` 1 iff a vehicle’s current stop is this cell and it is waiting on it (`running`, wait stop, floor is that cell, `inn === 0`). Path-cross is not a wait. `SENSOR_HOLD` on `out`. Several waiters: all hold on 0, all leave on 1. No collision. Groups off/on from `inn`. Look **Traffic light**. `buy-traffic-light` `show` `unlock-sensors` `need` `unlock-dispatch`. StayArmed. Guest `GUEST_BUILD`. Wait resolve after `evalDag` using this tick’s `inn`.

`sensors.chest` — Chest no empty slot (`CHEST_SLOTS`) → `out` 1 after `SENSOR_HOLD`.

`sensors.silo` — Seed silo `used >= SILO_SEED_CAP` → `out` 1 after hold. Additive `used >= ADDITIVE_CAP_LITERS` → `out` 1 after hold.

`sensors.vfx` — Sprinkler VFX flips on the tick the pour changes. `tickWater` writes `World.vfx`; `tickBig` does not. View reads that map, never `rate()`.

`sensors.counter` — Counter: each tick `inn === 1`, `count += 1`; `count >= n` → `out = 1` `count = 0` else `out = 0`. `n` default 1, min 1, max `COUNTER_MAX`. Tune out of range no-op. Changing `n` keeps `count`. Dial from `pct = count / n` vs 0 / 25% / 50% / 75% / 100% (`s0`…`s4`); this tick `out === 1` → `s4`. Not `floor(4 * count / n)`.

`sensors.day` — Day sensor: four flags, default `day` on others off. Raw 1 iff `clock.phase()` is a true flag. All off → raw 0. `SENSOR_HOLD`. No 3×3.

`sensors.lever` — Lever Flip always toggles. Wired `in` 0→1 also toggles. Same-tick Flip + rising edge: both apply (net zero). Unwired `inn` 0: no edge.
