# Sensors

Types [[architecture/world]]. Shelf [[items/sensors]] [[mechanics/research]]. Water [[mechanics/water]]. Vehicles [[mechanics/vehicles]]. Fenced area [[mechanics/enclosure]]. Chrome [[ui/sensors]]. Numbers preference unless marked. Classes `sim/sensor.ts`.

`BUTTON_PULSE`, `SENSOR_HOLD`, `COUNTER_MAX` — preference.

## Cells

`isSolid`. Sunk: art. Vehicles `floor` this cell → `SURFACE_SLOW`. Delete building drops incident wires.

Solid center never holds a plant. `isSolid` uses `isSensor` for the sensor half. Do not unify sensors with `Machine`. Sprinkler `in` and valve `in` stay on those `WireEnd`s, not a building class.

Place defaults: `Lever.on = false` `inn = 0` `prev = 0`. `Button.left = 0`. Pulser `prev = 0` `inn = 0` `out = 0`. Counter `n = 1` `count = 0`. Water `wilt = true` `over = true`. Harvest `mode = 'any'`. Day `day = true`, others false. `LogicGate.mode = 'or'`. Variety `base = true` `variant = false` `heirloom = false`. Weather `clear = true`, Rain / Dry / Flood / Drought false. Pressure plate `vehicle = true` `player = false` `item = false`. Traffic-light `inn = 0` `out = 0` `hold = 0`. `out` / `inn` / `hold` 0.

Tune `n` out of range is no-op, does not write. All-off flags are legal (raw 0). Changing `n` keeps `count`; next eval may fire immediately.

Live `kind: 'logic'`. Parse `kind: 'and' | 'or'` → `LogicGate` with that `mode`. Dump writes `'logic'`. No migrate.

Building `ownsPort`: origin cell and `c.ports` includes the port. Pump `ownsPort`: origin cell and `c.ports` includes the port.

## Fence range

`SensorBase.fenceable = false`. Water / fertilizer / harvest / variety / pressure plate override `true`. Callers ask `s.fenceable`, never a kind list.

Others refuse a fenced cell. Fence refuses a non-fenceable sensor cell.

`isFenceSite` includes a fenceable sensor cell that is not already fenced. Untilled (not burrow) unchanged.

Place order (same result):

```
untilled  --fence-->  untilled+F  --sensor-->  Sensor+F
untilled  --sensor-->  Sensor     --fence-->  Sensor+F
```

Delete: if `fenceable && hasFence` → delete the sensor, drop incident wires, leave the fence. Else fence-first.

| | not on a fence (open ground or inside a ring) | on a fence, in ≥1 fenced area | on a fence, in none |
|---|---|---|---|
| water / fert / harvest / variety | `area3` minus origin | union of those interiors | raw 0 |
| pressure plate | `area3` **including** origin | same union | raw 0 |

Weather and day: no range.

`readerRaw` takes the watched coord list. Lookup: [[mechanics/enclosure]].

## Ports

Illegal combos unrepresentable per device. Finalize no-ops a `WireEnd` that the device does not own. `WireEnd.at` = origin.

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

Compost-box: pads, no port. Barrel, grinder, field silos: no port. Still east cell, furnace south cell, Pumpjack east cell, south silo / additive-store cell: no port. Starter is wireable, still not a delete target.

A port is a disc of `PORT_HIT` at `portXY`, live only in the `sensors` lens. Paint is the hitbox. The cell body is the device action in every lens: Flip, Press, Tune, Fill. No half-cell port, no lens-dependent hitbox. Logic gate: three discs, not halves.

Whole-cell fallback, `sensors` only, for devices with no body action: lamp (`in`), sensor-fert / water-system / chest / freezer / seed-silo / additive-store (`out`), pump origin (`in`). Pressure plate / variety / weather / water / harvest / day / logic / counter have Tune or Field: no whole-cell fallback.

Port chrome [[ui/sensors]].

## Graph / eval

`World.wires: Wire[]`. Directed `from` → `to`. Signal `0 | 1`. Fan-out: many wires may share `from`. Fan-in: many wires may share a `to` port. Port level = OR of those wires. Unwired port still 0.

One direct path: unique on `nodeKey(from)` → `nodeKey(to)`, not `endKey`. A lever cannot occupy both `in-l` and `in-r` of the same logic gate. Indirect paths legal. Finalize of `from` → `to` when that node pair exists: drop that wire.

`from` is an output port. `to` is an input port. `{ kind: 'valve' }` is any valve, once `unlock-smart-irrigation` is done.

Two graphs. Wiring may contain cycles **through memory**. Combinational wiring may not.

**Sequential (memory) devices:** lever, pulser, counter. Their `in` is sampled from **last tick’s** outputs, then they update. Internally `in` does not combinationally drive `out` this tick. Flip / Press still apply in `apply` (same-tick Flip + eval edge: both, net zero). Traffic-light `in` is a sequential cut for `wouldCycle` (`isSeqIn`); `inn` is sampled **this** tick (mill-like), then wait resolve after `evalDag`. `inn` does not combinationally drive `out`.

**Combinational devices:** not, logic, lamp, sprinkler `in`, valve `in`, mill / jam / still / furnace `in`, pump `in`. Traffic-light `inn` set in `evalDag` like mill.

**Sources:** button, world-readers, chest / freezer / seed-silo / additive-store, furnace `out`. Traffic-light `out` after `tickDispatch` (this tick’s waiters).

`wouldCycle(wires, from, to, isSeqIn)`: walk only edges whose `to` is **not** a sequential input. Same-node `from`/`to` is a cycle iff that node is combinational. Lever/pulser/counter/traffic-light out→own in is legal. Logic/NOT/lamp out→own in is a cycle.

Combo cycle: finalize no-op. Sequential cut: legal.

`evalDag` is the tick function. Combo subgraph is a DAG. Tick:

1. Readers sample the just-ticked field / nets / vehicles / drops / seats / `clock.phase()` / `world.weather(clock.day)`. Raw `Signal`. Sequential `.out` still last tick. Traffic-light `.out` still last tick.
2. Topo-eval **combinational** gates from those outs. Lamp / machine / sprinkler / valve / traffic-light / pump `inn` from this combo + sequential outs.
3. Sequential `inn` = OR of wires on `in` (sees this tick’s combo, last tick’s other memories).
4. Sequential update: lever edge, pulser, counter. Button countdown already on `tick()`.
5. Hold on world-readers + sprinkler input + wired valve. Traffic-light `out` hold is after `tickDispatch`, not here.
6. Actuators use **this** tick’s held inputs for pour / conduction.
7. `tickDispatch`: wait / load / unload using this tick’s light `inn`. Then traffic-light `out` + `SENSOR_HOLD` from this tick’s waiters.

A lever chain `Q₀ → NOT → Q₁` does not ripple in one tick. `Q₁` toggles the tick after `Q₀` falls. One tick per stage.

Unwired input = `0`. Unwired gate / lamp / NOT / logic / pulser / counter / lever-`in` / sprinkler-input-port / valve-input / pump-`in` reads 0. Unwired **sprinkler pour** is the opposite — see actuators. An input is high iff any incoming wire is high.

`SENSOR_HOLD`: after an output **edge** (0→1 or 1→0), that node keeps the new level for `SENSOR_HOLD` ticks, then follows raw. `hold` is remaining ticks. 0 = not holding.

World-readers: water, fert, harvest, water-system, vehicle-detector, day, variety, weather, chest, freezer, seed-silo, additive-store, furnace `out`, traffic-light `out`. Mill/jam/still/furnace/pump `inn` like lamp, no hold. Pulser / counter / lever no hold. Traffic-light `inn` no hold. Furnace `out` high iff `units === 0`. `SENSOR_HOLD` on that `out`.

NOT: `out = 1 - inn`. Logic `or`: (OR of `in-l`) OR (OR of `in-r`). Logic `and`: (OR of `in-l`) AND (OR of `in-r`). Lamp: `inn` only. Mill/jam/still/furnace: `inn === 1` skip tick; unwired 0 ticks. No hold. Pump: `inn === 1` skip gather; unwired 0 gathers. No hold.

Button, lever, pulser, counter, chest/silo full: [[#Invariants]].

### Counter dial

`n ≥ 1`. `pct = count / n`. Not `floor(4 * count / n)`. Art groups [[art/sensors]]. This table is sim.

| group | when |
|---|---|
| `s0` | `pct === 0` (and not firing) |
| `s1` | `0 < pct < 0.25` |
| `s2` | `0.25 ≤ pct < 0.50` |
| `s3` | `0.50 ≤ pct < 0.75` |
| `s4` | `pct ≥ 0.75`, or this tick `out === 1` |

## Readers

Skip unowned. Water / fertilizer / harvest: skip non-plants, skip trees. Center is the sensor, never a plant. Variety: growing / ripe annuals **and** trees (`trunk === false`). Pressure plate: vehicles, in-seat actors, drops — not plants.

Growing annuals unless noted.

| Device | High when |
|---|---|
| Water | any in range matches a checked box: Wilting = `waterBand === 'red'` ∧ ¬`drowning`; Overwatered = `waterBand === 'red'` ∧ `drowning`. Both off → raw 0 |
| Fertilizer | any **growing** `fertBand === 'red'` |
| Harvest `any` | ≥1 `ripe` |
| Harvest `all` | count(`growing` ∨ `ripe`) ≥ 1 and every such is `ripe` |
| Variety | any in-range growing/ripe annual or non-trunk tree whose `tierOf(variety)` is ticked. All off → raw 0 |
| Weather | `world.weather(clock.day)` is a ticked `WeatherKind`. All off → raw 0 |
| Water-system | that net’s sprinkler want this tick > `stored` |
| Pressure plate | any ticked match in range. All off → raw 0 |
| Day | current `clock.phase()` is a checked flag. All off → raw 0 |

Phases [[mechanics/day]]. Kinds [[mechanics/weather]]. Pressure plate: `SensorKind` `vehicle-detector`.

- Vehicle: field Quad or tractor, `floor` in range. Stored no. Trailer no.
- Player: in-seat actor `floor` in range. Away no.
- Item on ground: a `Drop` whose `at` is in range.

Water-system: joins a net like `Tap` (any corner). Not a producer. Not a fill target. No incident pipe edge at any corner → not on a net. Raw 0. Taps / stills not in demand. Want = sum of `demand(s)` × `dt` for sprinklers on that net that are **pre-eval** `pourEligible`. `stored` = sum of that net’s reservoirs after gather. High iff want > stored. Gather then eval then pour, so stored includes this tick’s production; water-system uses pre-eval eligibility so a wire from this sensor can still gate pour **this** tick.

## Pump `in`

`Pump.ports = ['in']`. Combinational like mill. Unwired 0 = runs. `inn === 1` → `gatherWater` skips that reservoir. Hold: none. `inn` not saved; eval sets it.

Stored water still fills a bucket and still feeds the water network.

Tick order stays gather then eval then pour. `inn` is set in `evalDag` after gather, so a rising edge skips the **next** gather. Skip reads live `Pump.inn` from last eval; unwired 0 gathers this tick.

```
[sensor out] --wire--> [Pump in]
signal 0 : gather as now
signal 1 : gather skipped
```

## Traffic light

`SensorKind` `traffic-light`. Groups [[art/sensors]] from `inn` (0 red, 1 green). Delete strips wait stops targeting this cell and drops incident wires.

Unwired `inn` 0 = red = hold. Output 1 iff a vehicle’s current stop is this cell **and** it is waiting on it: `running`, wait stop, `floor` is that cell, this tick `inn === 0`. Path-cross is not a wait. `SENSOR_HOLD` on `out`. Several waiters: all hold on 0, all leave on 1. No collision.

Wait resolve after `evalDag` using this tick’s `inn`.

## Actuators

`pourEligible(s)`:

- no wire to that sprinkler `in` → **on** (unwired ≠ low)
- wired → held input `1` = on, `0` = off

Unwired sprinkler still pours after Smart Irrigation. Wired-low does not. Digest distinguishes unwired vs wired-low (wire present, level 0).

Smart irrigation is a `feature`: every vertex sprinkler gains `in`, and the same row grants the crop dial. Wiring a sprinkler before `unlock-smart-irrigation` is a no-op.

`tickWater` pours only `pourEligible` sprinklers, this tick, existing AoE + dial. `tickWater` writes `World.vfx`; `tickBig` does not. View reads that map, never `rate()`.

Valve `in`: `unlock-smart-irrigation` gives every valve one input on the body. There is no smart gate and no smart SKU. Unwired the valve is the hand valve; wired, high opens and low closes, and the click is a no-op. Hold on the input. Affects this tick’s conduction; rebuild nets after eval. `valveHold` holds `level` / `hold` for wired valves only and is rebuilt with the wire set. Valve delete drops incident wires.

Guest may wire a valve. Guest still cannot place or click one.

## Invariants

`sensors.cycle` — New wire that would combinational-cycle: no-op; sequential feedback through lever / pulser / counter / traffic-light `in` is legal.

`sensors.button` — Button high exactly `BUTTON_PULSE` ticks; pulser `out` 1 exactly 1 tick on `inn` 0→1, else 0, then `prev = inn`.

`sensors.hold` — World-reader output edge then holds `SENSOR_HOLD` ticks.

`sensors.unwired-sprinkler` — Unwired sprinkler still pours after Smart Irrigation.

`sensors.valve` — Unwired valve conducts on `open` and takes the click; wired valve conducts on the held input, refuses the click, and keeps `open`.

`sensors.port` — A port is a `PORT_HIT` disc at `portXY` in the `sensors` lens; the cell body fires the device action in every lens; whole-cell fallback only where the device has no body action.

`sensors.fan` — Fan-out shares `from`; fan-in OR shares `to` and both wires stay; finalize of an existing node pair drops that wire.

`sensors.mask` — Off-fence `area3` does not read plants outside the square and the center is not a plant; on-fence range is the watched interiors.

`sensors.signal` — Signal is `0 | 1`; combinational graph is a DAG; sequential feedback through lever / pulser / counter / traffic-light `in` is legal.

`sensors.light` — Traffic light: unwired `inn` 0 holds; `out` 1 iff a vehicle’s current wait stop is this cell with `inn === 0`; path-cross is not a wait.

`sensors.chest` — Chest with no empty slot (`CHEST_SLOTS`) → `out` 1 after `SENSOR_HOLD`.

`sensors.silo` — Seed silo `used >= SILO_SEED_CAP` or additive `used >= ADDITIVE_CAP_LITERS` → `out` 1 after hold.

`sensors.vfx` — Sprinkler VFX flips on the tick the pour changes; `tickWater` writes `World.vfx`, view reads that map, never `rate()`.

`sensors.counter` — Each tick `inn === 1` increments `count`; `count >= n` fires `out = 1` and zeros `count`; dial is `pct = count / n`, not `floor(4 * count / n)`.

`sensors.day` — Day sensor raw 1 iff `clock.phase()` matches a true flag; default `day` on; all off → raw 0; no `area3`.

`sensors.lever` — Flip always toggles; wired `in` 0→1 also toggles; same-tick Flip + rising edge both apply (net zero); unwired `inn` 0 has no edge.

`sensors.fence-range` — fenceable on a closed ring reads interiors, not `area3`; on an open fence: raw 0; inside a ring but not on a fence: `area3`.

`sensors.fence-place` — fence then sensor and sensor then fence are the same cell: sensor + `hasFence`.

`sensors.fence-delete` — first delete drops the sensor and wires; fence remains.

`sensors.logic` — mode `or` / `and`; default `or`.

`sensors.pressure` — flags; 3×3 includes origin; all off → 0.

`sensors.variety` — default base only; trees counted; all off → 0.

`sensors.weather` — current day kind; default `clear` on; all off → 0.

`sensors.pump` — unwired gather; wired on skips gather; stored still fills.
