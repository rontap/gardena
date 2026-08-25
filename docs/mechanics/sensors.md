# Sensors

Automation III + 1.7.1 bricks. Types [[architecture/world]]. Shop [[mechanics/research]]. Water [[mechanics/water]]. Cmds [[architecture/log]]. Save [[architecture/save]]. Seats [[mechanics/multiplayer]]. Numbers preference unless marked.

Not electricity. Not analogue. No XOR. No germ SKU. No weather SKU. No new sprinkler SKU. No 5×5 mask. No save migrate. Combinational loops stay illegal. Sequential feedback is 1.7.2.

## Files

| file | owns |
|---|---|
| `src/game/defs/items.ts` | `LEVER_PRICE` `BUTTON_PRICE` `LAMP_PRICE` `OR_PRICE` `AND_PRICE` `NOT_PRICE` `PULSER_PRICE` `COUNTER_PRICE` `SENSOR_WATER_PRICE` `SENSOR_FERT_PRICE` `SENSOR_HARVEST_PRICE` `SENSOR_DAY_PRICE` `WATER_SYSTEM_PRICE` `SMART_VALVE_PRICE` `VEHICLE_DETECTOR_PRICE` `BUTTON_PULSE` `SENSOR_HOLD` `COUNTER_MAX` |
| `src/game/defs/research.ts` | `unlock-sensors` `unlock-advanced-sensors` `unlock-smart-irrigation`. SKUs. `Sku.need` required |
| `src/game/defs/shelf.ts` | `BuildShelfId` += `'logic'`. Shelf **Sensors**, id `logic` |
| `src/game/defs/catalog.ts` | SKU `CatalogEntry` for every sensor SKU + smart valve. Game concepts not CatalogEntry. Overview is not CatalogEntry. Almanac Sensors: Overview, then lever. Copy [[ui/almanac]] |
| `src/game/sim/ids.ts` | `SensorKind` `ResearchId` += `unlock-sensors` `unlock-advanced-sensors` `unlock-smart-irrigation`. `SkuId` += the fifteen. `SENSOR_CELL_SKUS` += pulser counter day |
| `src/game/sim/sensor.ts` | `Wire` `WireEnd` `Sensor` classes, ports, `ownsPort` += mill/jam/still/chest/freezer/seed-silo/additive-store, `wouldCycle`, `evalDag`, `area3`, hold, reader raw, `pourEligible`, counter dial group. No `World` |
| `src/game/sim/building.ts` | mill/jam/still `inn`; chest/freezer/seed-silo/additive-store `out` `hold`. Not sensor classes |
| `src/game/sim/plot.ts` | `Cell` += `Sensor`. `isSolid` += every `SensorKind` |
| `src/game/sim/pipe.ts` | `Gate` += `{ kind: 'smart' }`. `Sprinkler` keeps variant/tune. `flows` for smart uses eval, not a stored open |
| `src/game/sim/world.ts` | `World.wires` `World.waterSystems`. `Net.waterSystems`. Place / StayArmed / Intent / HudTarget. tick: field → eval → mill/jam/still unless `inn === 1` → water. apply place/delete/tune / load / unload |
| `src/game/sim/log.ts` | `Act.armWire` `placeWire` `placeSmartValve` `tuneWater` `tuneHarvest` `tuneCounter` `resetCounter` `tuneDay`. `Act.delete` += `wire` `smart`. `Act.openHud` += `k` |
| `src/game/sim/save.ts` | `SAVE_VERSION` 1.72. dump wires + sensor cells + actuator hold + mill/jam/still `inn` + chest/freezer/seed-silo/additive-store `out` `hold`. Pulser `prev`/`out`; counter `n`/`count`/`out`; day flags + `out`/`hold`; lever `inn`/`prev`/`on`/`out`. No migrate |
| `src/game/sim/mp.ts` | `PROTOCOL` 1.72. `GUEST_BUILD` += fourteen sensor-cell SKUs. permit wire / smart valve / sensor HUD / `tuneCounter` `resetCounter` `tuneDay`. digest wires + outputs + mill/jam/still `inn` + chest/freezer/seed-silo/additive-store `out` |
| `src/game/sim/prompt.ts` | sensor place / port hit / delete wire bezier / smart valve edge |
| `src/game/sim/look.ts` | sensor names |
| `src/game/sim/item.ts` | `Face` += each sensor SKU + `smart-valve` |
| `src/game/sim/vehicle.ts` | `surfaceMul` unchanged: `isSolid` → `SURFACE_SLOW` |
| `src/game/sim/sensor.test.ts` | named invariants |

Do not create `src/` here.

## Defs

| id | value | |
|---|---|---|
| `LEVER_PRICE` | 4 | preference |
| `BUTTON_PRICE` | 3 | preference |
| `LAMP_PRICE` | 3 | preference |
| `OR_PRICE` | 5 | preference |
| `AND_PRICE` | 5 | preference |
| `NOT_PRICE` | 4 | preference |
| `PULSER_PRICE` | 5 | preference |
| `COUNTER_PRICE` | 6 | preference |
| `SENSOR_WATER_PRICE` | 7 | preference |
| `SENSOR_FERT_PRICE` | 7 | preference |
| `SENSOR_HARVEST_PRICE` | 8 | preference |
| `SENSOR_DAY_PRICE` | 7 | preference |
| `WATER_SYSTEM_PRICE` | 9 | preference |
| `SMART_VALVE_PRICE` | 6 | preference |
| `VEHICLE_DETECTOR_PRICE` | 8 | preference |
| `BUTTON_PULSE` | 4 | preference. Ticks of `tick()`. Button output high exactly this many |
| `SENSOR_HOLD` | 8 | preference. Ticks after an output **edge** |
| `COUNTER_MAX` | 9999 | preference. Tune `n` max |
| `unlock-sensors` | automation $24 / 55s, reveal `unlock-auto-irrigation` | preference |
| `unlock-advanced-sensors` | automation $22 / 50s, reveal `unlock-sensors` | preference |
| `unlock-smart-irrigation` | automation $32 / 70s, reveal `unlock-sensors` | preference |
| `VERTEX_HIT` | 0.3 | existing. Delete wire: nearest bezier |

`Sku.tab` `automation`. `haggling` applies. Identifiers only after this table.

Assumption: `unlock-advanced-sensors` $22 / 50s automation, `effect` `feature`.

## Ids

```
SensorKind =
  | 'lever'
  | 'button'
  | 'lamp'
  | 'or'
  | 'and'
  | 'not'
  | 'pulser'
  | 'counter'
  | 'sensor-water'
  | 'sensor-fert'
  | 'sensor-harvest'
  | 'sensor-day'
  | 'water-system'
  | 'vehicle-detector'

SkuId +=
  | 'buy-lever'
  | 'buy-button'
  | 'buy-lamp'
  | 'buy-or'
  | 'buy-and'
  | 'buy-not'
  | 'buy-pulser'
  | 'buy-counter'
  | 'buy-sensor-water'
  | 'buy-sensor-fert'
  | 'buy-sensor-harvest'
  | 'buy-sensor-day'
  | 'buy-water-system'
  | 'buy-smart-valve'
  | 'buy-vehicle-detector'

ResearchId += 'unlock-sensors' | 'unlock-advanced-sensors' | 'unlock-smart-irrigation'

Signal = 0 | 1
```

No germ SKU. No weather SKU. No `'xor'`. No wire SKU.

`SENSOR_CELL_SKUS` is the fourteen cell SKUs (not `buy-smart-valve`).

## Cells

1×1. `RectBase` `w = 1` `h = 1`. `isSolid`. Sunk: art. Vehicles `floor` this cell → `SURFACE_SLOW`. Place like tap. Pay on confirm. StayArmed. Stamp many. Guest `GUEST_BUILD`. Delete building always; drops incident wires.

Solid center never holds a plant.

```
Lever = { kind: 'lever'; base: RectBase; on: boolean; inn: Signal; prev: Signal; out: Signal }
Button = { kind: 'button'; base: RectBase; left: number; out: Signal }
Lamp = { kind: 'lamp'; base: RectBase; inn: Signal }
NotGate = { kind: 'not'; base: RectBase; out: Signal }
AndGate = { kind: 'and'; base: RectBase; out: Signal }
OrGate = { kind: 'or'; base: RectBase; out: Signal }
Pulser = { kind: 'pulser'; base: RectBase; inn: Signal; prev: Signal; out: Signal }
Counter = { kind: 'counter'; base: RectBase; inn: Signal; n: number; count: number; out: Signal }
WaterSensor = {
  kind: 'sensor-water'
  base: RectBase
  wilt: boolean
  over: boolean
  out: Signal
  hold: number
}
FertSensor = { kind: 'sensor-fert'; base: RectBase; out: Signal; hold: number }
HarvestSensor = {
  kind: 'sensor-harvest'
  base: RectBase
  mode: 'any' | 'all'
  out: Signal
  hold: number
}
DaySensor = {
  kind: 'sensor-day'
  base: RectBase
  sunrise: boolean
  day: boolean
  sunset: boolean
  twilight: boolean
  out: Signal
  hold: number
}
WaterSystem = { kind: 'water-system'; base: RectBase; out: Signal; hold: number }
VehicleSensor = { kind: 'vehicle-detector'; base: RectBase; out: Signal; hold: number }

Sensor =
  | Lever
  | Button
  | Lamp
  | NotGate
  | AndGate
  | OrGate
  | Pulser
  | Counter
  | WaterSensor
  | FertSensor
  | HarvestSensor
  | DaySensor
  | WaterSystem
  | VehicleSensor
```

Classes in `sim/sensor.ts`. Same instance in the one cell. `World.waterSystems` holds every `WaterSystem` for the water grid — [[mechanics/water]].

Place defaults: `Lever.on = false` `inn = 0` `prev = 0`. `Button.left = 0`. Pulser `prev = 0` `inn = 0` `out = 0`. Counter `n = 1` `count = 0`. Water `wilt = true` `over = true`. Harvest `mode = 'any'`. Day `day = true`, `sunrise` `sunset` `twilight` false. `out` / `inn` / `hold` 0.

Illegal: optional config. Illegal: lamp `out`. Illegal: size HUD. Illegal: analogue field. Illegal: counter `n` not an integer in `1..COUNTER_MAX` as stored (tune out of range is no-op, does not write).

## Ports

| kind | in | out |
|---|---|---|
| button, sensor-water, sensor-fert, sensor-harvest, sensor-day, water-system, vehicle-detector | — | `out` bottom |
| lamp | `in` top | — |
| not, pulser, counter, lever | `in` top | `out` bottom |
| and, or | `in-l` left, `in-r` right | `out` bottom |
| sprinkler (after `unlock-smart-irrigation`) | `in` | — |
| smart valve | `in` on the body | — |
| mill, jam, still | `in` origin top | — |
| chest, freezer, seed-silo, additive-store | — | `out` origin bottom |

Not `SensorKind`. Compost-box: pads, no port. Barrel, grinder, field silos: no port.

Illegal combos unrepresentable per device: a lamp has no out port; AND/OR have no single `in`; mill/jam/still have no out; chest/freezer/silo/additive have no in. Finalize no-ops a `WireEnd` that the device does not own.

No prop nubs on mill/jam/still/chest/freezer/silo/additive. Sensor lens dots only. `WireEnd.at` = origin. Still east cell: no port.

Output-only: whole-cell click = bottom `out`. Chest/freezer/seed-silo/additive-store: origin only, same. AND/OR: left/right half of the cell for `in-l` / `in-r`; bottom for `out`. NOT / pulser / counter / lever: top `in`, bottom `out`. Lamp / mill / jam / still: `in` on origin top, same as NOT `in`. Whole-cell click still = `in`. Still east cell: no port. `portXY` lamp/`in` → `{ x: origin.col+0.5, y: origin.row }`. Sprinkler vertex: `in`. Smart valve edge: `in` on the body.

Sensors lens: lever is not output-only whole-cell. Top half `in`, bottom `out` (NOT). Lens off: Flip / Press still fire.

## Wire

```
WireEnd =
  | { kind: 'cell'; at: Coord; port: 'out' | 'in' | 'in-l' | 'in-r' }
  | { kind: 'sprinkler'; at: Vertex; port: 'in' }
  | { kind: 'valve'; e: Edge; port: 'in' }

Wire = { from: WireEnd; to: WireEnd }
```

`World.wires: Wire[]`. Directed `from` → `to`. Signal `0 | 1`. Fan-out: many wires may share `from`. Fan-in: many wires may share a `to` port. Port level = OR of those wires. Unwired port still 0. Visual cross is paint, no join.

One direct path: unique on `nodeKey(from)` → `nodeKey(to)`, not `endKey`. A lever cannot occupy both `in-l` and `in-r` of the same AND. Indirect paths legal. **Combinational** cycles rejected at finalize (`wouldCycle`). Sequential feedback through lever / pulser / counter `in` is legal.

Toggle-remove: finalize of `from` → `to` when a wire already exists with the same node pair: drop that wire, `place = none`. Same ports or different ports on those two nodes — one path, so it removes. Not a retarget. Prompt **Remove wire** (ui-ux).

`from` is an output port. `to` is an input port. `{ kind: 'valve' }` is a **smart** valve only. Manual valve has no port.

No wire SKU. No price. Drawable in view when `Lens` is `sensors`. Armed sensor-cell SKU or `buy-smart-valve` forces that lens (pipes pattern). Wires are always sim-state. View-gated paint and port hits.

Start: `Act.armWire` sets `Seat.place = { kind: 'wire'; from }`. Finalize: `Act.placeWire`. Same node pair already present → drop that wire, `place = none`. Combinational cycle → no-op, place stays. Illegal ports → no-op. `Act.cancelPlace` clears.

Delete: Delete tool, nearest bezier within `VERTEX_HIT`. `Act.delete` `{ k: 'wire'; from; to }`. Building delete, sprinkler delete, smart-valve delete drop incident wires.

## Graph / eval

Two graphs. Wiring may contain cycles **through memory**. Combinational wiring may not.

**Sequential (memory) devices:** lever, pulser, counter. Their `in` is sampled from **last tick’s** outputs, then they update. Internally `in` does not combinationally drive `out` this tick. Flip / Press still apply in `apply` (same-tick Flip + eval edge: both, net zero).

**Combinational devices:** not, and, or, lamp, sprinkler `in`, smart valve `in`, mill / jam / still `in`.

**Sources:** button, world-readers, chest / freezer / seed-silo / additive-store.

`wouldCycle(wires, from, to, isSeqIn)`: walk only edges whose `to` is **not** a sequential input. Same-node `from`/`to` is a cycle iff that node is combinational. Lever/pulser/counter out→own in is legal. AND/OR/NOT/lamp out→own in is a cycle.

Combo cycle (NOT→AND→NOT, AND→OR→AND, gate self): finalize no-op, **Cannot loop**. Sequential cut (lever→AND→same lever, pulser→NOT→pulser, Q bits → is9 → Q.in): legal.

`evalDag` still the tick function. Combo subgraph is a DAG; do not runtime-check the full wire graph. Tick:

1. Readers sample the just-ticked field / nets / vehicles / `clock.phase()`. Raw `Signal`. Sequential `.out` still last tick.
2. Topo-eval **combinational** gates from those outs (AND/OR/NOT). Lamp / machine / sprinkler / smart-valve `inn` from this combo + sequential outs.
3. Sequential `inn` = OR of wires on `in` (sees this tick’s combo, last tick’s other memories).
4. Sequential update: lever edge, pulser, counter. Button countdown already on `tick()`.
5. Hold on world-readers + sprinkler input + smart valve.
6. Actuators use **this** tick’s held inputs for pour / conduction.

Consequence: a lever chain `Q₀ → NOT → Q₁` no longer ripples in one tick. `Q₁` toggles the tick after `Q₀` falls. One tick per stage. Decade wrap `is9 → extra T on Q₃` uses last-tick bits; all four T-FFs update together.

Unwired input = `0`. Assumption: unwired gate / lamp / NOT / AND / OR / pulser / counter / lever-`in` / sprinkler-input-port / smart-valve-input reads 0. Unwired **sprinkler pour** is the opposite — see actuators. An input is high iff any incoming wire is high.

`SENSOR_HOLD`: after an output **edge** (0→1 or 1→0), that node keeps the new level for `SENSOR_HOLD` ticks, then follows raw. `hold` is remaining ticks. 0 = not holding.

World-readers: water, fert, harvest, water-system, vehicle, day, chest, freezer, seed-silo, additive-store. Not lamps. Not gates. Not pulser. Not counter. Not lever. Not button. Not mill/jam/still (`inn` like lamp, no hold).

Button: `out` high exactly `BUTTON_PULSE` ticks. `left` counts down on `tick()`. Reach 0 → `out = 0`. Assumption: toggle while high restarts `BUTTON_PULSE`.

Lever: Flip always `on = !on` in apply (`toggle` walk-to). Eval: `inn` = OR of wires on `in`. If `prev === 0 && inn === 1` then `on = !on`. Then `prev = inn`. `out = on ? 1 : 0`. Unwired `inn` 0: no edge, Flip unchanged. Same-tick Flip + rising edge: both apply (two toggles → net zero). Look **on** / **off** still from `on`.

NOT / lamp / sprinkler / smart valve / mill / jam / still / pulser / counter / lever: `inn` = OR of wires on `in`. NOT: `out = 1 - inn`. AND: (OR of wires on `in-l`) AND (OR of wires on `in-r`). OR: (OR of `in-l`) OR (OR of `in-r`). Lamp: `inn` only, display. Mill/jam/still: `inn === 1` skip tick; unwired 0 ticks. No hold.

Pulser (after `inn`): if `prev === 0 && inn === 1` then `out = 1` else `out = 0`; then `prev = inn`. Pulse is 1 tick on 0→1, then 0 until input falls.

Counter (after `inn`): if `inn === 1` then `count += 1`. If `count >= n` then `out = 1`, `count = 0`; else `out = 0`. Increments each tick `inn === 1`. Pulser 1-tick → `n = 10` is 10 vehicles. Fertilizer 15 s → `n = 225`.

Chest / freezer / seed-silo / additive-store: `out` + `SENSOR_HOLD`. Full: chest/freezer no empty slot; silo `used >= SILO_SEED_CAP`; additive `used >= ADDITIVE_CAP_LITERS`.

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

Day: 1×1. Output only. No 3×3 wash. Raw 1 iff `DayPhase` matches a true flag. `SENSOR_HOLD`. World-reader. Phases [[mechanics/day]].

Vehicle: stored no. Trailer no. `tickVehicles` already ran this `tick()`.

Water-system: 1×1, joins a net like `Tap` (any corner). Not a producer. Not a fill target. No incident pipe / well / smart-valve edge at any corner → not on a net. Look: **Water-system sensor - no pipes around sensor!** Not on/off. Raw 0. Taps / stills not in demand. Want = sum of `demand(s)` × `dt` for sprinklers on that net that are **pre-eval** `pourEligible`. `stored` = sum of that net’s reservoirs after gather. High iff want > stored. Assumption: gather then eval then pour, so stored includes this tick’s production; water-system uses pre-eval eligibility so a wire from this sensor can still gate pour **this** tick.

## Actuators

`pourEligible(s)`:

- no wire to that sprinkler `in` → **on** (unwired ≠ low)
- wired → held input `1` = on, `0` = off

Unwired sprinkler still pours after Smart Irrigation. Wired-low does not. Digest distinguishes unwired vs wired-low (wire present, level 0).

Smart Irrigation is a `feature`: every vertex sprinkler gains `in`. No new SKU. No mask HUD. `unlock-smart-sprinkler` crop dial unchanged. Wiring a sprinkler before `unlock-smart-irrigation` is a no-op.

`tickWater` pours only `pourEligible` sprinklers, this tick, existing AoE + dial.

Smart valve: edge SKU `buy-smart-valve`. `Gate` `{ kind: 'smart' }`. No manual click. One input on the body. Unwired **closed** (`flows` false). High open, low closed. Hold on the input. Affects this tick’s conduction; rebuild nets after eval. No share with pipe / manual valve / well on that edge.

Manual valve unchanged. Guest still cannot place or click it.

## Research / shop

| id | effect | unlocks |
|---|---|---|
| `unlock-sensors` | `feature` | SKUs: lever, button, lamp, pulser, counter, water, fert, harvest, water-system, day. Lens `sensors` |
| `unlock-advanced-sensors` | `feature` | SKUs: AND, OR, NOT |
| `unlock-smart-irrigation` | `feature` | feature: sprinkler inputs. SKUs: smart valve, vehicle detector |

`startResearch('unlock-smart-irrigation')` no-ops unless `unlock-adv-irrigation` is in `done`. Card still `reveal: unlock-sensors`. Gate stays `{ kind: 'none' }`. Assumption: no new `ResearchGate` arm.

`skuShown` Sensors shelf after `unlock-sensors`. Smart Irrigation cards `show: unlock-sensors`, `unlock: unlock-smart-irrigation`, `need: unlock-sensors` — shown after Sensors, buy after both.

AND / OR / NOT: `show: unlock-sensors`, `unlock: unlock-advanced-sensors`, `need: unlock-sensors` — visible after Sensors; buy after Advanced sensors.

Other `unlock-sensors` cell SKUs: `show` + `unlock` `unlock-sensors`, `need: 'none'`.

Filing: signal → Sensors (`logic`): lever, button, lamp, or, and, not, pulser, counter. Readers: water, fert, harvest, water-system, vehicle-detector, day. Smart valve → Water (flow), after manual valve. Vehicle detector → Sensors.

## Lens

`Lens` += `sensors`. Unhidden after `unlock-sensors`. Wires visible and drawable only there. Armed `buy-lever` … `buy-water-system` / `buy-pulser` / `buy-counter` / `buy-sensor-day` / `buy-vehicle-detector` / `buy-smart-valve` forces this lens. UI chrome [[ui/lens]].

## Place / StayArmed

```
StayArmed +=
  | 'buy-lever' | 'buy-button' | 'buy-lamp' | 'buy-or' | 'buy-and' | 'buy-not'
  | 'buy-pulser' | 'buy-counter'
  | 'buy-sensor-water' | 'buy-sensor-fert' | 'buy-sensor-harvest' | 'buy-sensor-day'
  | 'buy-water-system'
  | 'buy-smart-valve' | 'buy-vehicle-detector'

Place +=
  | { kind: 'wire'; from: WireEnd }
```

While a sensor SKU is armed, click confirms place, not a wire. `place none` or `{ kind: 'wire' }`: port clicks arm/finalize wires.

## Cmds

Lever / button: walk-to, like valve. `Intent` `{ act: 'toggle'; at: Coord }`. `dest = at`. Work 0 on arrive. `Act.click` enqueues. Not a new click letter. Flip always toggles.

Config HUDs: remote `ObjectHud`, no walk.

```
HudTarget +=
  | { kind: 'water'; at: Coord }
  | { kind: 'harvest'; at: Coord }
  | { kind: 'counter'; at: Coord }
  | { kind: 'day'; at: Coord }

Cmd +=
  | { a: typeof Act.armWire; t; p; from: WireEnd }
  | { a: typeof Act.placeWire; t; p; from: WireEnd; to: WireEnd }
  | { a: typeof Act.placeSmartValve; t; p; e: Edge }
  | { a: typeof Act.tuneWater; t; p; c: XY; wilt: boolean; over: boolean }
  | { a: typeof Act.tuneHarvest; t; p; c: XY; mode: 'any' | 'all' }
  | { a: typeof Act.tuneCounter; t; p; c: XY; n: number }
  | { a: typeof Act.resetCounter; t; p; c: XY }
  | { a: typeof Act.tuneDay; t; p; c: XY; sunrise: boolean; day: boolean; sunset: boolean; twilight: boolean }
  | { a: typeof Act.delete; t; p; k: 'wire'; from: WireEnd; to: WireEnd }
  | { a: typeof Act.delete; t; p; k: 'smart'; e: Edge }
  | { a: typeof Act.openHud; t; p; k: 'sprinkler' | 'water' | 'harvest' | 'counter' | 'day'; c: XY }
```

`Act.armWire` `'R'`. `Act.placeWire` `'N'`. `Act.setBoom` `'W'`. `Act.placeSmartValve` `'I'`. `Act.tuneWater` `'C'`. `Act.tuneHarvest` `'G'`. `Act.tuneCounter` `'M'`. `Act.resetCounter` `'X'`. `Act.tuneDay` `'O'`.

`openHud` `k: 'sprinkler'` stays host-only. Water / harvest / counter / day HUD: guest yes.

Counter HUD: title **Counter**. Live `count`. Label **Count to**. Integer field `n`. **Reset to 0** sets `count = 0`, not `n`. Apply immediately, stays open. `n < 1` or `n > COUNTER_MAX` → no-op. Changing `n` keeps `count`; next eval may fire immediately. `Act.resetCounter` legal on a counter cell; else no-op. Guest yes.

Day HUD: title **Day sensor**. Checkboxes **Sunrise** **Day** **Sunset** **Twilight**. Apply immediately.

Tune prompts: **Tune counter** / **Tune day sensor**.

Wrappers: `armWire` `placeWire` `placeSmartValve` `deleteWire` `tuneWater` `tuneHarvest` `tuneCounter` `resetCounter` `tuneDay`. `toggle` is actor work from the intent. Not a cmd.

Not logged: eval, hold countdown, pourEligible, net rebuild, bezier, lens, counter dial group.

## Guest

May: shop + place + `delete` building for lever, button, lamp, AND, OR, NOT, pulser, counter, water/fert/harvest/water-system/day sensors, vehicle detector. Guest may `placeSmartValve`, wires (`armWire` `placeWire` delete wire), toggle lever/button, water/harvest/counter/day HUD including `resetCounter`.

May not: `placePipe`, manual valve (`clickValve`), sprinklers, sprinkler HUD / `tuneSprinkler`. Guest `placeWire` permitted; guest `placePipe` still not.

Assumption: invariant 61; fourteen cells including vehicle detector + pulser + counter + day.

## Save / net

`SAVE_VERSION` 1.72. `PROTOCOL` 1.72. Wordmark **1.7.2**. No migrate. 1.71 file → `LoadFailReason` `'version'`. `World.wires[]` already a list. Dump mill/jam/still `inn`; chest/freezer/seed-silo/additive-store `out` `hold`.

Dump `World.wires`, `Save.smartHold`, sensor origin cells (config + `out` / `inn` / `on` / `left` / `hold` / pulser `prev` / counter `n` `count` / lever `inn` `prev` / day flags), sprinkler `inn`/`hold`, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`/`hold`, `World.waterSystems` as those cells, smart-valve segments (`Gate` `'smart'`). Digest: invariant 40 plus every wire `from`/`to`, every sensor `out`/`inn`, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`, every sprinkler unwired vs level, every smart valve held level. Unchanged except fan-in OR. Wired-low still ≠ unwired.

## Dual lock

AND / OR / NOT use `Sku.unlock` + `Sku.need` as `ResearchId`. Future germ / weather SKUs use the same dual-lock. Do not add those SKUs, research rows, or `SensorKind` arms in 1.7.1.

## Illegal

- combinational cycle (gate-to-gate / lamp self). Sequential feedback through lever / pulser / counter `in` is legal
- two direct paths same `nodeKey(from)` → `nodeKey(to)`
- wire into an output, or out of an input-only lamp
- analogue / XOR
- germ / weather SKUs
- new sprinkler SKU / 5×5 mask
- save migrate
- unwired sprinkler treated as low
- unwired smart valve conducting
- guest `placePipe` / `clickValve` / place sprinkler
- `Partial<T>` / optional that means unsure
- electricity / power-line as this system
- mill / jam / still `inn` hold
- pulser / counter / lever hold
- prop nubs on mill/jam/still/chest/freezer/silo/additive
- `HudTarget` hangar or vehicle
- counter dial `floor(4 * count / n)`
- AND / OR / NOT buyable on `unlock-sensors` alone
- comments in `src/`
