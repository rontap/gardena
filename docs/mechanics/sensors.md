# Sensors

Types [[architecture/world]]. Shop [[mechanics/research]]. Water [[mechanics/water]]. Cmds [[architecture/log]]. Seats [[mechanics/multiplayer]]. Fenced area [[mechanics/enclosure]]. Numbers preference unless marked. Classes `sim/sensor.ts`. Ids `sim/ids.ts`.

Combinational loops stay illegal. Sequential feedback through lever / pulser / counter / traffic-light `in` is legal.

`BUTTON_PULSE`, `SENSOR_HOLD`, `COUNTER_MAX` — preference. `Sku.tab` `automation`. `haggling` applies.

## Cells

1×1. `isSolid`. Sunk: art. Vehicles `floor` this cell → `SURFACE_SLOW`. Place like tap. Pay on confirm. StayArmed. Stamp many. Guest `GUEST_BUILD`. Delete building always; drops incident wires. Fenceable + `hasFence`: delete the sensor, drop incident wires, leave the fence — [[mechanics/enclosure]] [[items/tiles]].

Solid center never holds a plant. `isSolid` uses `isSensor` for the sensor half. New kinds that join `MAKE` add no `isSolid` arm.

Place defaults: `Lever.on = false` `inn = 0` `prev = 0`. `Button.left = 0`. Pulser `prev = 0` `inn = 0` `out = 0`. Counter `n = 1` `count = 0`. Water `wilt = true` `over = true`. Harvest `mode = 'any'`. Day `day = true`, others false. `LogicGate.mode = 'or'`. Variety `base = true` `variant = false` `heirloom = false`. Weather `clear = true`, Rain / Dry / Flood / Drought false. Pressure plate `vehicle = true` `player = false` `item = false`. Traffic-light `inn = 0` `out = 0` `hold = 0`. `out` / `inn` / `hold` 0.

Tune `n` out of range is no-op, does not write. All-off flags are legal (raw 0).

## Make table

Not a table in `src/` yet. Next to the classes: `{ [K in SensorKind]: { sku, make } }`. `makeSensor` / `skuKind` become lookups of that map. Ports live on the device. Building `ownsPort`: origin cell and `c.ports` includes the port. Sensor kind arms stay until that wave. `evalDag` stays a function. Do not unify sensors with `Machine`. Sprinkler `in` and valve `in` stay on those `WireEnd`s, not a building class. Live `makeSensor` / `skuKind` / sensor `ownsPort` switches stay until that wave. Pump `ownsPort`: origin cell and `c.ports` includes the port.

```
SensorKind += 'logic' | 'sensor-variety' | 'sensor-weather'
SensorKind  -= 'or' | 'and'   // parse aliases only
SkuId      += 'buy-logic' | 'buy-sensor-variety' | 'buy-sensor-weather'
```

Live `kind: 'logic'`. Parse `kind: 'and' | 'or'` → `LogicGate` with that `mode`. Dump writes `'logic'`. No migrate. `buy-or` / `buy-and` unused, not shown.

## Fenceable

`SensorBase.fenceable = false`. Water / fertilizer / harvest / variety / pressure plate override `true`. Callers ask `s.fenceable`, never a kind list.

Fenceable: water, fertilizer, harvest, variety, pressure plate.

Not fenceable: lever, button, lamp, logic, not, pulser, counter, day, weather, water-system, traffic light. Those refuse a fenced cell (place blocked). Fence refuses a non-fenceable sensor cell.

`isFenceSite` += fenceable sensor cell and not already fenced. Untilled (not burrow) unchanged.

Place order (same result):

```
untilled  --fence-->  untilled+F  --sensor-->  Sensor+F
untilled  --sensor-->  Sensor     --fence-->  Sensor+F
```

Paint: fence with its orthogonal joins, then the sensor on top. Two sprites. [[architecture/view]]

Delete: if `fenceable && hasFence` → delete the sensor, drop incident wires, leave the fence. Else fence-first as today.

Range:

| | not on a fence (open ground or inside a ring) | on a fence, in ≥1 fenced area | on a fence, in none |
|---|---|---|---|
| water / fert / harvest / variety | `area3` minus origin | union of those interiors | raw 0 |
| pressure plate | `area3` **including** origin | same union | raw 0 |

Weather and day stay 1×1, no range.

`readerRaw` takes the watched coord list. Lookup: [[mechanics/enclosure]].

## Ports

| kind | in | out |
|---|---|---|
| button, sensor-water, sensor-fert, sensor-harvest, sensor-day, sensor-variety, sensor-weather, water-system, vehicle-detector | — | `out` bottom |
| lamp | `in` top | — |
| not, pulser, counter, lever, traffic-light | `in` top | `out` bottom |
| logic | `in-l` left, `in-r` right | `out` bottom |
| sprinkler (after `unlock-smart-irrigation`) | `in` | — |
| valve, after `unlock-smart-irrigation` | `in` on the body | — |
| mill, jam, still, station | `in` origin top | — |
| furnace | `in` origin top | `out` origin bottom |
| chest, freezer, seed-silo, additive-store | — | `out` origin bottom |
| pump (starter and Pumpjack) | `in` origin top | — |

Compost-box: pads, no port. Barrel, grinder, field silos: no port. Pumpjack east cell: no port. Starter is wireable, still not a delete target.

Illegal combos unrepresentable per device. Finalize no-ops a `WireEnd` that the device does not own.

No prop nubs on mill/jam/still/furnace/chest/freezer/silo/additive/pump. Sensor lens dots only. `WireEnd.at` = origin. Still east cell: no port. Furnace south cell: no port. Pumpjack east cell: no port.

A port is a disc of `PORT_HIT` at `portXY`, live only in the `sensors` lens. Paint is the hitbox — [[ui/sensors]]. The cell body is the device action in every lens: Flip, Press, Tune, Fill. No half-cell port, no lens-dependent hitbox.

Whole-cell fallback, `sensors` only, for the devices with no body action: lamp (`in`), sensor-fert / water-system / chest / freezer / seed-silo / additive-store (`out`), pump origin (`in`). Pressure plate / variety / weather have Tune: no whole-cell fallback.

## Wire

`World.wires: Wire[]`. Directed `from` → `to`. Signal `0 | 1`. Fan-out: many wires may share `from`. Fan-in: many wires may share a `to` port. Port level = OR of those wires. Unwired port still 0. Visual cross is paint, no join.

One direct path: unique on `nodeKey(from)` → `nodeKey(to)`, not `endKey`. A lever cannot occupy both `in-l` and `in-r` of the same logic gate. Indirect paths legal. **Combinational** cycles rejected at finalize (`wouldCycle`). Sequential feedback through lever / pulser / counter `in` is legal.

Toggle-remove: finalize of `from` → `to` when a wire already exists with the same node pair: drop that wire, `place = none`. Prompt **Remove wire**.

`from` is an output port. `to` is an input port. `{ kind: 'valve' }` is any valve, once `unlock-smart-irrigation` is done.

No wire SKU. Drawable in view when `Lens` is `sensors`. Armed sensor-cell SKU forces that lens. Wires are always sim-state. View-gated paint and port hits.

Start: `Act.armWire` sets `Seat.place = { kind: 'wire'; from }`. Finalize: `Act.placeWire`. Same node pair already present → drop that wire. Combinational cycle → no-op, place stays. Illegal ports → no-op. `Act.cancelPlace` clears.

Delete: Delete tool, nearest bezier within `VERTEX_HIT`. Building delete, sprinkler delete, valve delete drop incident wires. Fenceable sensor delete drops incident wires and leaves the fence.

## Graph / eval

Two graphs. Wiring may contain cycles **through memory**. Combinational wiring may not.

**Sequential (memory) devices:** lever, pulser, counter. Their `in` is sampled from **last tick’s** outputs, then they update. Internally `in` does not combinationally drive `out` this tick. Flip / Press still apply in `apply` (same-tick Flip + eval edge: both, net zero). Traffic-light `in` is a sequential cut for `wouldCycle` (`isSeqIn`); `inn` is sampled **this** tick (mill-like), then wait resolve after `evalDag`. `inn` does not combinationally drive `out`.

**Combinational devices:** not, logic, lamp, sprinkler `in`, valve `in`, mill / jam / still / furnace `in`, pump `in`. Traffic-light `inn` set in `evalDag` like mill.

**Sources:** button, world-readers, chest / freezer / seed-silo / additive-store, furnace `out`. Traffic-light `out` after `tickDispatch` (this tick’s waiters).

`wouldCycle(wires, from, to, isSeqIn)`: walk only edges whose `to` is **not** a sequential input. Same-node `from`/`to` is a cycle iff that node is combinational. Lever/pulser/counter/traffic-light out→own in is legal. Logic/NOT/lamp out→own in is a cycle.

Combo cycle: finalize no-op, **Cannot loop**. Sequential cut: legal.

`evalDag` still the tick function. Combo subgraph is a DAG. Tick:

1. Readers sample the just-ticked field / nets / vehicles / drops / seats / `clock.phase()` / `world.weather(clock.day)`. Raw `Signal`. Sequential `.out` still last tick. Traffic-light `.out` still last tick.
2. Topo-eval **combinational** gates from those outs. Lamp / machine / sprinkler / valve / traffic-light / pump `inn` from this combo + sequential outs.
3. Sequential `inn` = OR of wires on `in` (sees this tick’s combo, last tick’s other memories).
4. Sequential update: lever edge, pulser, counter. Button countdown already on `tick()`.
5. Hold on world-readers + sprinkler input + wired valve. Traffic-light `out` hold is after `tickDispatch`, not here.
6. Actuators use **this** tick’s held inputs for pour / conduction.
7. `tickDispatch`: wait / load / unload using this tick’s light `inn`. Then traffic-light `out` + `SENSOR_HOLD` from this tick’s waiters.

Consequence: a lever chain `Q₀ → NOT → Q₁` no longer ripples in one tick. `Q₁` toggles the tick after `Q₀` falls. One tick per stage.

Unwired input = `0`. Assumption: unwired gate / lamp / NOT / logic / pulser / counter / lever-`in` / sprinkler-input-port / valve-input / pump-`in` reads 0. Unwired **sprinkler pour** is the opposite — see actuators. An input is high iff any incoming wire is high.

`SENSOR_HOLD`: after an output **edge** (0→1 or 1→0), that node keeps the new level for `SENSOR_HOLD` ticks, then follows raw. `hold` is remaining ticks. 0 = not holding.

World-readers: water, fert, harvest, water-system, vehicle-detector, day, variety, weather, chest, freezer, seed-silo, additive-store, furnace `out`, traffic-light `out`. Mill/jam/still/furnace/pump `inn` like lamp, no hold. Pulser / counter / lever no hold. Traffic-light `inn` no hold. Furnace `out` high iff `units === 0`. `SENSOR_HOLD` on that `out`.

Button: `out` high exactly `BUTTON_PULSE` ticks. `left` counts down on `tick()`. Reach 0 → `out = 0`. Assumption: toggle while high restarts `BUTTON_PULSE`.

Lever: Flip always `on = !on` in apply (`toggle` walk-to). Eval: `inn` = OR of wires on `in`. If `prev === 0 && inn === 1` then `on = !on`. Then `prev = inn`. `out = on ? 1 : 0`. Unwired `inn` 0: no edge, Flip unchanged. Same-tick Flip + rising edge: both apply (two toggles → net zero). Look **on** / **off** still from `on`.

NOT: `out = 1 - inn`. Logic `or`: (OR of `in-l`) OR (OR of `in-r`). Logic `and`: (OR of `in-l`) AND (OR of `in-r`). Lamp: `inn` only. Mill/jam/still/furnace: `inn === 1` skip tick; unwired 0 ticks. No hold. Pump: `inn === 1` skip gather; unwired 0 gathers. No hold.

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

Skip unowned. Water / fertilizer / harvest: skip non-plants, skip trees. Center is the sensor, never a plant. Variety: growing / ripe annuals **and** trees (`trunk === false`). Pressure plate: vehicles, in-seat actors, drops — not plants.

Growing annuals unless noted.

| Device | High when | HUD |
|---|---|---|
| Water | any in range matches a checked box: Wilting = `waterBand === 'red'` ∧ ¬`drowning`; Overwatered = `waterBand === 'red'` ∧ `drowning` | two checkboxes. Default both **on**. Both off → raw 0 |
| Fertilizer | any **growing** `fertBand === 'red'` | none |
| Harvest `any` | ≥1 `ripe` | Radio Any / All. Default **Any** |
| Harvest `all` | count(`growing` ∨ `ripe`) ≥ 1 and every such is `ripe` | |
| Variety | any in-range growing/ripe annual or non-trunk tree whose `tierOf(variety)` is ticked | three checkboxes. Default **base** on. All off → raw 0 |
| Weather | `world.weather(clock.day)` is a ticked `WeatherKind` | five checkboxes. Default **Clear** on. All off → raw 0 |
| Water-system | that net’s sprinkler want this tick > `stored` | none |
| Pressure plate | any ticked match in range | three checkboxes. Default **vehicle** on. All off → raw 0 |
| Day | current `clock.phase()` is a checked flag | four checkboxes. Default **Day** on, others off. All off → raw 0 |

Day: 1×1. Output only. No 3×3. Raw 1 iff `DayPhase` matches a true flag. `SENSOR_HOLD`. Phases [[mechanics/day]].

Weather: 1×1. Output only. No 3×3. Not fenceable. Raw 1 iff current day kind matches a true flag. `SENSOR_HOLD`. Kinds [[mechanics/weather]]. `show` `unlock-sensors`, `need` `[]`.

Variety: fenceable. `SENSOR_HOLD`. `show` `unlock-sensors`, `need` `unlock-crop-variants`.

Pressure plate: `SensorKind` `vehicle-detector`. Player **Pressure plate**. SkuId `buy-vehicle-detector`. Fenceable. `SENSOR_HOLD`.

- Vehicle: field Quad or tractor, `floor` in range. Stored no. Trailer no.
- Player: in-seat actor `floor` in range. Away no.
- Item on ground: a `Drop` whose `at` is in range.

Water-system: 1×1, joins a net like `Tap` (any corner). Not a producer. Not a fill target. No incident pipe edge at any corner → not on a net. Look: **Water-system sensor - no pipes around sensor!** Raw 0. Taps / stills not in demand. Want = sum of `demand(s)` × `dt` for sprinklers on that net that are **pre-eval** `pourEligible`. `stored` = sum of that net’s reservoirs after gather. High iff want > stored. Assumption: gather then eval then pour, so stored includes this tick’s production; water-system uses pre-eval eligibility so a wire from this sensor can still gate pour **this** tick.

Class, eval, save, look stay. Sku not on the Sensors shelf. `skuShown` false. Not buyable. Placed ones keep working. Almanac row stays.

## Pump `in`

`Pump.ports = ['in']`. Combinational like mill. Unwired 0 = runs. `inn === 1` → `gatherWater` skips that reservoir. Hold: none. Port chrome: origin top. Pumpjack east cell: no port. Starter is wireable, still not a delete target. `inn` not saved; eval sets it.

Stored water still fills a bucket and still feeds the water network.

Tick order stays gather then eval then pour. `inn` is set in `evalDag` after gather, so a rising edge skips the **next** gather. Assumption: skip reads live `Pump.inn` from last eval; unwired 0 gathers this tick.

```
[sensor out] --wire--> [Pump in]
signal off : gather as now
signal on  : gather skipped
```

## Traffic light

1×1 sunk. `SensorKind` `traffic-light`. Look **Traffic light**. Groups **off** / **on** from `inn` (0 red, 1 green). StayArmed. Guest `GUEST_BUILD`. Delete always; strips wait stops targeting this cell. Drops incident wires.

Unwired `inn` 0 = red = hold. Output 1 iff a vehicle’s current stop is this cell **and** it is waiting on it: `running`, wait stop, `floor` is that cell, this tick `inn === 0`. Path-cross is not a wait. `SENSOR_HOLD` on `out`. Several waiters: all hold on 0, all leave on 1. No collision.

SKU `buy-traffic-light`. Sensors shelf. `show` `unlock-sensors`, `need` `unlock-dispatch`. `Sku.tab` automation. `haggling`. `TRAFFIC_LIGHT_PRICE`. Blurb: holds a vehicle until the input is green; output is on while a vehicle waits here.

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
| `unlock-sensors` | `feature` | SKUs: lever, button, lamp, pulser, counter, water, fert, harvest, day, variety, weather, vehicle-detector. Lens `sensors` |
| `unlock-advanced-sensors` | `feature` | SKUs: Logic gate, NOT |
| `unlock-smart-irrigation` | `feature` | feature: sprinkler crop dial + sprinkler and valve signal inputs. No SKU |

`unlock-sensors` is a no-prerequisite root carrying only what stands alone. `startResearch('unlock-smart-irrigation')` no-ops unless both `unlock-adv-irrigation` and `unlock-sensors` are in `done` — `requires` is AND. The card reveals on `unlock-sensors` alone, so it can be on the shelf and shut — [[mechanics/research]].

`skuShown` Sensors shelf after `unlock-sensors`, except `buy-water-system` (`skuShown` false). Dual-lock `need` on the capability they read: water `unlock-irrigation`, fert either soil row, variety `unlock-crop-variants`, vehicle-detector `unlock-vehicles`, traffic-light `unlock-dispatch`. Logic gate + NOT unlock `unlock-advanced-sensors`. Weather `need` `[]`.

Filing: signal → Sensors (`logic`): lever, button, lamp, logic, not, pulser, counter, traffic-light. Readers: water, fert, harvest, variety, weather, vehicle-detector, day. Traffic light → Sensors (ports like NOT). Pressure plate → Sensors (`buy-vehicle-detector`). Water-system not on the shelf.

`LOGIC_PRICE` `SENSOR_VARIETY_PRICE` `SENSOR_WEATHER_PRICE` — preference.

## Lens

`Lens` += `sensors`. Unhidden after `unlock-sensors`. Wires visible and drawable only there. Armed sensor SKU forces this lens. UI chrome [[ui/lens]].

## Place / StayArmed

While a sensor SKU is armed, click confirms place, not a wire. `place none` or `{ kind: 'wire' }`: port clicks arm/finalize wires. StayArmed sensor cells (incl. pulser, counter, day, traffic-light, logic, variety, weather, pressure plate). Fifteen shop SKUs. `buy-water-system` is not a shop SKU.

## Cmds

Lever / button: walk-to, like valve. `Intent` `{ act: 'toggle'; at: Coord }`. Work 0 on arrive. Flip always toggles.

Config HUDs: remote `ObjectHud`, no walk. Water / harvest / counter / day / logic / variety / weather / pressure HUD: guest yes. `openHud` `k: 'sprinkler'` stays host-only.

```
HudTarget +=
  | { kind: 'logic'; at: Coord }
  | { kind: 'variety'; at: Coord }
  | { kind: 'weather'; at: Coord }
  | { kind: 'pressure'; at: Coord }
```

`Act.openHud` `k` += `logic` `variety` `weather` `pressure`. Tune: `Act.tuneSensor` inner `k` those four. Apply immediately, stay open. Tune prompts: **Tune {skuLabel}**.

```
HudRow =
  | { kind: 'check'; id: string; label: string; on: boolean }
  | { kind: 'radio'; id: string; label: string; options: { id: string; label: string; on: boolean }[] }

HudSpec = { title: string; col: number; row: number; stay: boolean; rows: HudRow[]; pick: (id: string) => void }
```

| target | control |
|---|---|
| water, day, variety, weather, pressure plate | `check` |
| harvest Any/All, logic OR/AND | `radio` |
| counter | existing Field + Reset (not this table) |
| sprinkler | unchanged `Btn` + icon (not a sensor HUD) |

`Checkbox` / `Radio` in `frame.tsx`. Sensors stop using `Btn selected` as a fake tick.

Counter HUD: title **Counter**. Live `count`. Label **Count to**. Integer field `n`. **Reset to 0** sets `count = 0`, not `n`. Apply immediately, stays open. `n < 1` or `n > COUNTER_MAX` → no-op. Changing `n` keeps `count`; next eval may fire immediately. `Act.resetCounter` legal on a counter cell. Guest yes.

Day HUD: title **Day sensor**. Checkboxes **Sunrise** **Day** **Sunset** **Twilight**. Apply immediately.

Wash while HUD open: water, harvest, variety, fertilizer (hover), pressure plate — the watched set, not a hardcoded 3×3.

Not logged: eval, hold countdown, pourEligible, net rebuild, bezier, lens, counter dial group, traffic-light `out` / wait resolve, enclosure rebuild.

Guest wire / sensor HUD: [[mechanics/multiplayer]] `mp.guest`.

## Invariants

`sensors.cycle` — New wire that would combinational-cycle: no-op. Sequential feedback through lever / pulser / counter `in` is legal.

`sensors.button` — Button: high exactly `BUTTON_PULSE` ticks. Pulser: `out` 1 exactly 1 tick on `inn` 0→1, else 0; then `prev = inn`.

`sensors.hold` — Water sensor hold: output edge then hold `SENSOR_HOLD` ticks. Covers new world-readers (variety, weather, pressure plate).

`sensors.unwired-sprinkler` — Unwired sprinkler still pours after Smart Irrigation.

`sensors.valve` — Unwired valve conducts on `open` and takes the click. Wired valve conducts on the held input, refuses the click, and keeps `open` for when the wire goes. Valve delete drops incident wires.

`sensors.port` — A port is a `PORT_HIT` disc at `portXY`, `sensors` lens only. The cell body fires the device action in every lens. Whole-cell fallback only where the device has no body action.

`sensors.fan` — Fan-out: one lever drives two lamps. Fan-in OR: two levers, one lamp, both wires stay; lamp high if either is. Toggle A→B: wires length 0.

`sensors.mask` — Off-fence 3×3 does not read plants outside the square; center building is not a plant. On-fence range is the watched interiors.

`sensors.signal` — Signal is `0 | 1`. Combinational graph is a DAG. Sequential feedback through lever / pulser / counter / traffic-light `in` is legal. Hold on world-readers + sprinkler input + wired valve only. Mill/jam/still/furnace/pump `inn` no hold. Furnace `out` + `SENSOR_HOLD`. Pulser / counter / lever no hold. Traffic-light `inn` no hold; `out` + `SENSOR_HOLD` after `tickDispatch`. Digest distinguishes unwired sprinkler vs wired-low. Port level = OR of wires on that `to`. Direct path unique on `nodeKey(from)` → `nodeKey(to)`, not `endKey`. `SensorKind` += `pulser` `counter` `sensor-day` `traffic-light` `logic` `sensor-variety` `sensor-weather`. Live kinds have no `or` / `and`. Lever has `in`. Logic gate + NOT require `unlock-advanced-sensors`. Memories sample last tick; combo this tick; then sequential update. Traffic-light `inn` this tick; combo reads last tick’s `out`. Pump `in` combinational.

`sensors.light` — Traffic light: 1×1 sunk. Ports `in` top `out` bottom. Unwired `inn` 0 = red = hold. `out` 1 iff a vehicle’s current stop is this cell and it is waiting on it (`running`, wait stop, floor is that cell, `inn === 0`). Path-cross is not a wait. `SENSOR_HOLD` on `out`. Several waiters: all hold on 0, all leave on 1. No collision. Groups off/on from `inn`. Look **Traffic light**. `buy-traffic-light` `show` `unlock-sensors` `need` `unlock-dispatch`. StayArmed. Guest `GUEST_BUILD`. Wait resolve after `evalDag` using this tick’s `inn`.

`sensors.chest` — Chest no empty slot (`CHEST_SLOTS`) → `out` 1 after `SENSOR_HOLD`.

`sensors.silo` — Seed silo `used >= SILO_SEED_CAP` → `out` 1 after hold. Additive `used >= ADDITIVE_CAP_LITERS` → `out` 1 after hold.

`sensors.vfx` — Sprinkler VFX flips on the tick the pour changes. `tickWater` writes `World.vfx`; `tickBig` does not. View reads that map, never `rate()`.

`sensors.counter` — Counter: each tick `inn === 1`, `count += 1`; `count >= n` → `out = 1` `count = 0` else `out = 0`. `n` default 1, min 1, max `COUNTER_MAX`. Tune out of range no-op. Changing `n` keeps `count`. Dial from `pct = count / n` vs 0 / 25% / 50% / 75% / 100% (`s0`…`s4`); this tick `out === 1` → `s4`. Not `floor(4 * count / n)`.

`sensors.day` — Day sensor: four flags, default `day` on others off. Raw 1 iff `clock.phase()` is a true flag. All off → raw 0. `SENSOR_HOLD`. No 3×3.

`sensors.lever` — Lever Flip always toggles. Wired `in` 0→1 also toggles. Same-tick Flip + rising edge: both apply (net zero). Unwired `inn` 0: no edge.

`sensors.fence-range` — fenceable on a closed ring reads interiors, not `area3`. On an open fence: raw 0. Inside a ring but not on a fence: `area3`.

`sensors.fence-place` — fence then sensor and sensor then fence are the same cell: sensor + `hasFence`.

`sensors.fence-delete` — first delete drops the sensor and wires; fence remains.

`sensors.logic` — mode `or` / `and` matches old OR / AND. Default `or`.

`sensors.pressure` — flags; 3×3 includes origin; all off → 0.

`sensors.variety` — default base only; trees counted; all off → 0.

`sensors.weather` — current day kind; default Clear on; all off → 0.

`sensors.pump` — unwired gather; wired on skips gather; stored still fills.
