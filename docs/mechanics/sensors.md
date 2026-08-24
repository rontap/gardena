# Sensors

Automation III. Types [[architecture/world]]. Shop [[mechanics/research]]. Water [[mechanics/water]]. Cmds [[architecture/log]]. Save [[architecture/save]]. Seats [[mechanics/multiplayer]]. Numbers preference unless marked.

Not electricity. Not analogue. No XOR. No germ SKU. No weather SKU. No new sprinkler SKU. No 5×5 mask. No Advanced signalling. No save migrate.

## Files

| file | owns |
|---|---|
| `src/game/defs/items.ts` | `LEVER_PRICE` `BUTTON_PRICE` `LAMP_PRICE` `OR_PRICE` `AND_PRICE` `NOT_PRICE` `SENSOR_WATER_PRICE` `SENSOR_FERT_PRICE` `SENSOR_HARVEST_PRICE` `WATER_SYSTEM_PRICE` `SMART_VALVE_PRICE` `VEHICLE_DETECTOR_PRICE` `BUTTON_PULSE` `SENSOR_HOLD` |
| `src/game/defs/research.ts` | `unlock-sensors` `unlock-smart-irrigation`. SKUs. `Sku.need` required |
| `src/game/defs/shelf.ts` | `BuildShelfId` += `'logic'`. Shelf **Sensors**, id `logic` |
| `src/game/defs/catalog.ts` | almanac entries exist for every sensor SKU + smart valve. Copy layout [[ui/almanac]] |
| `src/game/sim/ids.ts` | `SensorKind` `ResearchId` += `unlock-sensors` `unlock-smart-irrigation`. `SkuId` += the twelve |
| `src/game/sim/sensor.ts` | `Wire` `WireEnd` `Sensor` classes, ports, `ownsPort` += mill/jam/still/chest/freezer/seed-silo/additive-store, `wouldCycle`, `evalDag`, `area3`, hold, reader raw, `pourEligible`. No `World` |
| `src/game/sim/building.ts` | mill/jam/still `inn`; chest/freezer/seed-silo/additive-store `out` `hold`. Not sensor classes |
| `src/game/sim/plot.ts` | `Cell` += `Sensor`. `isSolid` += every `SensorKind` |
| `src/game/sim/pipe.ts` | `Gate` += `{ kind: 'smart' }`. `Sprinkler` keeps variant/tune. `flows` for smart uses eval, not a stored open |
| `src/game/sim/world.ts` | `World.wires` `World.waterSystems`. `Net.waterSystems`. Place / StayArmed / Intent / HudTarget. tick: field → eval → mill/jam/still unless `inn === 1` → water. apply place/delete/tune / load / unload |
| `src/game/sim/log.ts` | `Act.armWire` `placeWire` `placeSmartValve` `tuneWater` `tuneHarvest`. `Act.delete` += `wire` `smart`. `Act.openHud` += `k` |
| `src/game/sim/save.ts` | `SAVE_VERSION` 1.62. dump wires + sensor cells + actuator hold + mill/jam/still `inn` + chest/freezer/seed-silo/additive-store `out` `hold`. No migrate |
| `src/game/sim/mp.ts` | `PROTOCOL` 1.62. `GUEST_BUILD` += eleven sensor-cell SKUs. permit wire / smart valve / sensor HUD. digest wires + outputs + mill/jam/still `inn` + chest/freezer/seed-silo/additive-store `out` |
| `src/game/sim/prompt.ts` | sensor place / port hit / delete wire bezier / smart valve edge |
| `src/game/sim/look.ts` | sensor names |
| `src/game/sim/item.ts` | `Face` += each sensor SKU + `smart-valve` |
| `src/game/sim/vehicle.ts` | `surfaceMul` unchanged: `isSolid` → `SURFACE_SLOW` |
| `src/game/sim/sensor.test.ts` | named invariants |
| `src/game/view/map.tsx` | `Lens` += `sensors`. Wires always sim-state; paint and port hit iff `sensors` (or armed sensor / smart-valve SKU, which forces this lens). Bezier is paint |

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
| `SENSOR_WATER_PRICE` | 7 | preference |
| `SENSOR_FERT_PRICE` | 7 | preference |
| `SENSOR_HARVEST_PRICE` | 8 | preference |
| `WATER_SYSTEM_PRICE` | 9 | preference |
| `SMART_VALVE_PRICE` | 6 | preference |
| `VEHICLE_DETECTOR_PRICE` | 8 | preference |
| `BUTTON_PULSE` | 4 | preference. Ticks of `tick()`. Button output high exactly this many |
| `SENSOR_HOLD` | 8 | preference. Ticks after an output **edge** |
| `unlock-sensors` | automation $24 / 55s, reveal `unlock-auto-irrigation` | preference |
| `unlock-smart-irrigation` | automation $32 / 70s, reveal `unlock-sensors` | preference |
| `VERTEX_HIT` | 0.3 | existing. Delete wire: nearest bezier |

`Sku.tab` `automation`. `machine-contracts` applies. Identifiers only after this table.

## Ids

```
SensorKind =
  | 'lever'
  | 'button'
  | 'lamp'
  | 'or'
  | 'and'
  | 'not'
  | 'sensor-water'
  | 'sensor-fert'
  | 'sensor-harvest'
  | 'water-system'
  | 'vehicle-detector'

SkuId +=
  | 'buy-lever'
  | 'buy-button'
  | 'buy-lamp'
  | 'buy-or'
  | 'buy-and'
  | 'buy-not'
  | 'buy-sensor-water'
  | 'buy-sensor-fert'
  | 'buy-sensor-harvest'
  | 'buy-water-system'
  | 'buy-smart-valve'
  | 'buy-vehicle-detector'

ResearchId += 'unlock-sensors' | 'unlock-smart-irrigation'

Signal = 0 | 1
```

No germ SKU. No weather SKU. No `'xor'`. No wire SKU.

## Cells

1×1. `RectBase` `w = 1` `h = 1`. `isSolid`. Sunk: art. Vehicles `floor` this cell → `SURFACE_SLOW`. Place like tap. Pay on confirm. StayArmed. Stamp many. Guest `GUEST_BUILD`. Delete building always; drops incident wires.

Solid center never holds a plant.

```
Lever = { kind: 'lever'; base: RectBase; on: boolean; out: Signal }
Button = { kind: 'button'; base: RectBase; left: number; out: Signal }
Lamp = { kind: 'lamp'; base: RectBase; inn: Signal }
NotGate = { kind: 'not'; base: RectBase; out: Signal }
AndGate = { kind: 'and'; base: RectBase; out: Signal }
OrGate = { kind: 'or'; base: RectBase; out: Signal }
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
WaterSystem = { kind: 'water-system'; base: RectBase; out: Signal; hold: number }
VehicleSensor = { kind: 'vehicle-detector'; base: RectBase; out: Signal; hold: number }

Sensor =
  | Lever
  | Button
  | Lamp
  | NotGate
  | AndGate
  | OrGate
  | WaterSensor
  | FertSensor
  | HarvestSensor
  | WaterSystem
  | VehicleSensor
```

Classes in `sim/sensor.ts`. Same instance in the one cell. `World.waterSystems` holds every `WaterSystem` for the water grid — [[mechanics/water]].

Place defaults: `Lever.on = false`. `Button.left = 0`. Water `wilt = true` `over = true`. Harvest `mode = 'any'`. `out` / `inn` / `hold` 0.

Illegal: optional config. Illegal: lamp `out`. Illegal: size HUD. Illegal: analogue field.

## Ports

| kind | in | out |
|---|---|---|
| lever, button, sensor-water, sensor-fert, sensor-harvest, water-system, vehicle-detector | — | `out` bottom |
| lamp | `in` top | — |
| not | `in` top | `out` bottom |
| and, or | `in-l` left, `in-r` right | `out` bottom |
| sprinkler (after `unlock-smart-irrigation`) | `in` | — |
| smart valve | `in` on the body | — |
| mill, jam, still | `in` origin top | — |
| chest, freezer, seed-silo, additive-store | — | `out` origin bottom |

Not `SensorKind`. Compost-box: pads, no port. Barrel, grinder, field silos: no port.

Illegal combos unrepresentable per device: a lamp has no out port; a lever has no in port; AND/OR have no single `in`; mill/jam/still have no out; chest/freezer/silo/additive have no in. Finalize no-ops a `WireEnd` that the device does not own.

No prop nubs on mill/jam/still/chest/freezer/silo/additive. Sensor lens dots only. `WireEnd.at` = origin. Still east cell: no port.

Output-only: whole-cell click = bottom `out`. Chest/freezer/seed-silo/additive-store: origin only, same. AND/OR: left/right half of the cell for `in-l` / `in-r`; bottom for `out`. NOT: top `in`, bottom `out`. Lamp / mill / jam / still: `in` on origin top, same as NOT `in`. Whole-cell click still = `in`. Still east cell: no port. `portXY` lamp/`in` → `{ x: origin.col+0.5, y: origin.row }`. Sprinkler vertex: `in`. Smart valve edge: `in` on the body.

## Wire

```
WireEnd =
  | { kind: 'cell'; at: Coord; port: 'out' | 'in' | 'in-l' | 'in-r' }
  | { kind: 'sprinkler'; at: Vertex; port: 'in' }
  | { kind: 'valve'; e: Edge; port: 'in' }

Wire = { from: WireEnd; to: WireEnd }
```

`World.wires: Wire[]`. Directed `from` → `to`. Signal `0 | 1`. Fan-out: many wires may share `from`. Fan-in: many wires may share a `to` port. Port level = OR of those wires. Unwired port still 0. Visual cross is paint, no join.

One direct path: unique on `nodeKey(from)` → `nodeKey(to)`, not `endKey`. A lever cannot occupy both `in-l` and `in-r` of the same AND. Indirect paths legal. Cycle still rejected at finalize (`wouldCycle`).

Toggle-remove: finalize of `from` → `to` when a wire already exists with the same node pair: drop that wire, `place = none`. Same ports or different ports on those two nodes — one path, so it removes. Not a retarget. Prompt **Remove wire** (ui-ux).

`from` is an output port. `to` is an input port. `{ kind: 'valve' }` is a **smart** valve only. Manual valve has no port.

No wire SKU. No price. Drawable in view when `Lens` is `sensors`. Armed sensor-cell SKU or `buy-smart-valve` forces that lens (pipes pattern). Wires are always sim-state. View-gated paint and port hits.

Start: `Act.armWire` sets `Seat.place = { kind: 'wire'; from }`. Finalize: `Act.placeWire`. Same node pair already present → drop that wire, `place = none`. Cycle → no-op, place stays. Illegal ports → no-op. `Act.cancelPlace` clears.

Delete: Delete tool, nearest bezier within `VERTEX_HIT`. `Act.delete` `{ k: 'wire'; from; to }`. Building delete, sprinkler delete, smart-valve delete drop incident wires.

## Graph / eval

`sim/sensor.ts` `wouldCycle(wires, from, to): boolean`. `evalDag` topo-eval. Loops rejected at finalize. Live graph is a DAG; do not runtime-check acyclicity on tick.

Unwired input = `0`. Assumption: unwired gate / lamp / NOT / AND / OR / sprinkler-input-port / smart-valve-input reads 0. Unwired **sprinkler pour** is the opposite — see actuators. An input is high iff any incoming wire is high.

Tick, after vehicles and field, before water:

1. Readers sample the just-ticked field / nets / vehicles. Raw `Signal`.
2. Topo-eval sources then gates.
3. Hold on world-readers + sprinkler input + smart valve.
4. Lever / button / gates: no hold. Outputs may change every tick.
5. Actuators use **this** tick’s held inputs for pour / conduction.

`SENSOR_HOLD`: after an output **edge** (0→1 or 1→0), that node keeps the new level for `SENSOR_HOLD` ticks, then follows raw. `hold` is remaining ticks. 0 = not holding.

World-readers: water, fert, harvest, water-system, vehicle, chest, freezer, seed-silo, additive-store. Not lamps. Not gates. Not lever. Not button. Not mill/jam/still (`inn` like lamp, no hold).

Button: `out` high exactly `BUTTON_PULSE` ticks. `left` counts down on `tick()`. Reach 0 → `out = 0`. Assumption: toggle while high restarts `BUTTON_PULSE`.

Lever: walk-to toggle `on`. `out = on ? 1 : 0`.

NOT / lamp / sprinkler / smart valve / mill / jam / still: `inn` = OR of wires on `in`. NOT: `out = 1 - inn`. AND: (OR of wires on `in-l`) AND (OR of wires on `in-r`). OR: (OR of `in-l`) OR (OR of `in-r`). Lamp: `inn` only, display. Mill/jam/still: `inn === 1` skip tick; unwired 0 ticks. No hold.

Chest / freezer / seed-silo / additive-store: `out` + `SENSOR_HOLD`. Full: chest/freezer no empty slot; silo `used >= SILO_SEED_CAP`; additive `used >= ADDITIVE_CAP_LITERS`.

## Readers

3×3 centered on the sensor cell. No size HUD. Skip unowned. Skip non-plants. Skip trees. Center is the sensor, never a plant.

Growing annuals unless noted.

| Device | High when | HUD |
|---|---|---|
| Water | any in range matches a checked box: Wilting = `waterBand === 'red'` ∧ ¬`drowning`; Overwatered = `waterBand === 'red'` ∧ `drowning` | two checkboxes. Default both **on**. Both off → raw 0 |
| Fertilizer | any **growing** `fertBand === 'red'` | none |
| Harvest `any` | ≥1 `ripe` | Any / All. Default **Any** |
| Harvest `all` | count(`growing` ∨ `ripe`) ≥ 1 and every such is `ripe` | |
| Water-system | that net’s sprinkler want this tick > `stored` | none |
| Vehicle | a field Quad or tractor `floor(x, y)` equals the cell | none |

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
| `unlock-sensors` | `feature` | SKUs: lever, button, lamp, AND, OR, NOT, water, fert, harvest, water-system. Lens `sensors` |
| `unlock-smart-irrigation` | `feature` | feature: sprinkler inputs. SKUs: smart valve, vehicle detector |

No Advanced signalling.

`startResearch('unlock-smart-irrigation')` no-ops unless `unlock-adv-irrigation` is in `done`. Card still `reveal: unlock-sensors`. Gate stays `{ kind: 'none' }`. Assumption: no new `ResearchGate` arm.

`skuShown` Sensors shelf after `unlock-sensors`. Smart Irrigation cards `show: unlock-sensors`, `unlock: unlock-smart-irrigation`, `need: unlock-sensors` — shown after Sensors, buy after both.

Sensor-cell SKUs: `show` + `unlock` `unlock-sensors`, `need: 'none'`.

Filing: signal → Sensors (`logic`). Smart valve → Water (flow), after manual valve. Vehicle detector → Sensors.

## Lens

`Lens` += `sensors`. Unhidden after `unlock-sensors`. Wires visible and drawable only there. Armed `buy-lever` … `buy-water-system` / `buy-vehicle-detector` / `buy-smart-valve` forces this lens. UI chrome [[ui/lens]].

## Place / StayArmed

```
StayArmed +=
  | 'buy-lever' | 'buy-button' | 'buy-lamp' | 'buy-or' | 'buy-and' | 'buy-not'
  | 'buy-sensor-water' | 'buy-sensor-fert' | 'buy-sensor-harvest' | 'buy-water-system'
  | 'buy-smart-valve' | 'buy-vehicle-detector'

Place +=
  | { kind: 'wire'; from: WireEnd }
```

While a sensor SKU is armed, click confirms place, not a wire. `place none` or `{ kind: 'wire' }`: port clicks arm/finalize wires.

## Cmds

Lever / button: walk-to, like valve. `Intent` `{ act: 'toggle'; at: Coord }`. `dest = at`. Work 0 on arrive. `Act.click` enqueues. Not a new click letter.

Config HUDs: remote `ObjectHud`, no walk.

```
HudTarget +=
  | { kind: 'water'; at: Coord }
  | { kind: 'harvest'; at: Coord }

Cmd +=
  | { a: typeof Act.armWire; t; p; from: WireEnd }
  | { a: typeof Act.placeWire; t; p; from: WireEnd; to: WireEnd }
  | { a: typeof Act.placeSmartValve; t; p; e: Edge }
  | { a: typeof Act.tuneWater; t; p; c: XY; wilt: boolean; over: boolean }
  | { a: typeof Act.tuneHarvest; t; p; c: XY; mode: 'any' | 'all' }
  | { a: typeof Act.delete; t; p; k: 'wire'; from: WireEnd; to: WireEnd }
  | { a: typeof Act.delete; t; p; k: 'smart'; e: Edge }
  | { a: typeof Act.openHud; t; p; k: 'sprinkler' | 'water' | 'harvest'; c: XY }
```

`Act.armWire` `'R'`. `Act.placeWire` `'N'`. `Act.setBoom` `'W'`. `Act.placeSmartValve` `'I'`. `Act.tuneWater` `'C'`. `Act.tuneHarvest` `'G'`.

`openHud` `k: 'sprinkler'` stays host-only. Water / harvest HUD: guest yes.

Wrappers: `armWire` `placeWire` `placeSmartValve` `deleteWire` `tuneWater` `tuneHarvest`. `toggle` is actor work from the intent. Not a cmd.

Not logged: eval, hold countdown, pourEligible, net rebuild, bezier, lens.

## Guest

May: shop + place + `delete` building for lever, button, lamp, AND, OR, NOT, water/fert/harvest/water-system sensors, vehicle detector. Guest may `placeSmartValve`, wires (`armWire` `placeWire` delete wire), toggle lever/button, water/harvest HUD.

May not: `placePipe`, manual valve (`clickValve`), sprinklers, sprinkler HUD / `tuneSprinkler`. Guest `placeWire` permitted; guest `placePipe` still not.

Assumption: invariant 61; eleven cells including vehicle detector.

## Save / net

`SAVE_VERSION` 1.62. `PROTOCOL` 1.62. Wordmark **1.6.2**. No migrate. 1.6 file → `LoadFailReason` `'version'`. `World.wires[]` already a list. Dump mill/jam/still `inn`; chest/freezer/seed-silo/additive-store `out` `hold`.

Dump `World.wires`, `Save.smartHold`, sensor origin cells (config + `out` / `inn` / `on` / `left` / `hold`), sprinkler `inn`/`hold`, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`/`hold`, `World.waterSystems` as those cells, smart-valve segments (`Gate` `'smart'`). Digest: invariant 40 plus every wire `from`/`to`, every sensor `out`/`inn`, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`, every sprinkler unwired vs level, every smart valve held level. Unchanged except fan-in OR. Wired-low still ≠ unwired.

## Dual lock (later)

Future germ / weather SKUs use `Sku.unlock` + `Sku.need` as `ResearchId` the same way smart valve does. Do not add those SKUs, research rows, or `SensorKind` arms in 1.6.

## Illegal

- cycle
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
- prop nubs on mill/jam/still/chest/freezer/silo/additive
- `HudTarget` hangar or vehicle
- comments in `src/`
