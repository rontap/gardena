# Sensors

Place, wires, ports, object HUDs, copy. Rules [[mechanics/sensors]]. Items [[items/sensors]]. Chrome [[ui/hud]] [[ui/docks]]. Lens [[ui/lens]]. Place [[ui/place]]. Shop [[ui/shop]] [[ui/build]]. Look [[ui/inspect]]. Almanac [[ui/almanac]]. Type [[ui/type]]. Palette [[art/palette]].

No new chrome shell. No wire SKU. No new `@theme` color.

## Lens

`Lens` += `sensors`. Unhidden after `unlock-sensors`. Dock row [[ui/lens]].

Wires are sim-state always. Paint and port hits iff the effective lens is `sensors`. An armed sensor-cell SKU forces it through `toolLens`, and confirming a place locks it — [[ui/lens]].

Selecting Build shelf `logic` (**Sensors**) sets and locks `lens = 'sensors'`. Does not arm a SKU. [[ui/build]]

Esc / Shop **×** / Build close / leaving the shop system: `cancelPlace` only. The lens is untouched — a locked `sensors` survives, and an unlocked one dies with the Lens dock, not the shop.

## Fade

`lens === 'sensors'`: no house `WASH` on `isSensor` cells. Other cells may keep the kind-style fade (pipes pattern: relevant tiles stay clear). 3×3 reader wash unchanged. Sensor center is a sensor cell → not faded.

## Wash

3×3 readers: water, fertilizer, harvest. Center is the sensor. `fill-water` 0.35, same as sprinkler AoE.

Paint that wash when `lens === 'sensors'` (every such reader) or while that water / harvest HUD is open (that cell only). Not gates. Not lamp. Not lever / button. Not pulser / counter. Not day. Not water-system. Not vehicle detector. Not traffic light. Not a size HUD. Counter / day HUD open: no wash.

## Wires

Overlay Graphics bezier. Idle stroke palette `fruit-red`. Active (signal `1`) stroke `water`, with beads marching `from` → `to` on the flow channel — [[art/vfx]]. No new `@theme` color. Visual cross is paint, no join.

No price. Fan-out: many wires from one `from`. Fan-in: many wires on one input; second finalize does **not** replace. Inputs OR.

One direct path between two nodes. Finalize of A→B when that node pair exists: **Remove wire**, drop it, `place none`. Delete-tool bezier **Delete wire** stays.

Start: click an **output port** → `Act.armWire` → `place = { kind: 'wire'; from }`. Pending bezier follows the pointer. Finalize on a valid input → `Act.placeWire`. Press-and-release does the same in one gesture: press an `out` disc, release on an `in` disc. Release anywhere else keeps the arm, so click-click is unchanged. Combinational cycle → no-op, place stays, **Cannot loop**. Sequential feedback (lever / pulser / counter / traffic-light `in`) is legal. Illegal port → no-op, **Cannot wire here**. `cancelPlace` clears.

While a sensor SKU is armed, click confirms place, not a wire.

Delete tool: nearest bezier within `VERTEX_HIT` → **Delete wire**. `Act.delete` `{ k: 'wire'; from; to }`. Building / sprinkler / smart-valve delete drops incident wires.

## Ports

Hits only in `sensors`, and a hit is a disc of `PORT_HIT` at `portXY` — preference. The painted mark is that disc, so paint is the hitbox. `from` is an output. `to` is an input.

| kind | in | out | hit |
|---|---|---|---|
| button, sensor-water, sensor-fert, sensor-harvest, sensor-day, water-system, vehicle-detector | — | `out` bottom | whole-cell = bottom |
| lamp | `in` top | — | whole-cell = `in` |
| not, pulser, counter, lever, traffic-light | `in` top | `out` bottom | top / bottom |
| and, or | `in-l` left, `in-r` right | `out` bottom | left / right half, bottom |
| sprinkler (`unlock-smart-irrigation`) | `in` | — | vertex disc |
| valve (`unlock-smart-irrigation`) | `in` on the body | — | edge-midpoint disc |
| mill, jam, still | `in` origin top | — | origin whole-cell = `in`. East still cell: no port |
| chest, freezer, seed-silo, additive-store | — | `out` origin bottom | origin whole-cell = bottom. South silo / additive cell: no port |

The cell body is the device action in **every** lens: Flip, Press, Tune. No half-cell port, no lens-dependent hitbox. AND / OR get three discs, not left and right halves.

Whole-cell fallback, `sensors` only, for the devices with no body action: lamp (`in`), sensor-fert / water-system / vehicle-detector / chest / freezer / seed-silo / additive-store (`out`).

Wiring a sprinkler or a valve before `unlock-smart-irrigation` is a no-op → **Cannot wire here**. East still cell / south silo cell: **Cannot wire here**. Compost-box: pads, no port. Barrel, grinder, field silos: no port.

## Port chrome

Iff `lens === 'sensors'` or pending wire. Overlay on the map, not baked into prop SVGs.

| port | mark | at |
|---|---|---|
| `out` | small circle | `portXY` `out` |
| `in` / `in-l` / `in-r` | small square | `portXY` that port |

Also sprinkler `in` after `unlock-smart-irrigation`, smart-valve `in`, mill / jam / still `in`, chest / freezer / seed-silo / additive-store `out`. Lens only. Same circles / squares. No prop nubs. Not the full hitbox.

Fill: idle `fruit-red`, high `water`. Stroke `ink`. A solid 3 px mark inside a `PORT_HIT` halo of the same colour at 0.3 alpha — the halo is the hit area, drawn so the player can aim at it.

## Place

StayArmed: fifteen cell SKUs. Stamp many. Pay on confirm. Guest `GUEST_BUILD` for the fifteen cells.

Sensor cells: 1×1, `skuInner` like chest. `placeSolidOk`. Copy **Place {skuLabel}**. Hover valid `stroke-ink`, blocked `stroke-roof`.

Rotate: no-op. No sensor SKU in `ROTATABLE`. Trio still from Sensors `cluster: 'build'`.

## Walk-to / HUD

Lever / button: walk-to like valve. **Flip lever** / **Press button**. Work 0 on arrive. Lens off: Flip / Press still fire. In `sensors`, lever top / bottom is ports, not Flip. Traffic light: no walk-to, no Flip, no HUD.

Config HUDs: remote ObjectHud family, same Chrome as **Sprinkler output**. Not a new chrome. No walk. Sprinkler tune unchanged.

| target | title | rows | default |
|---|---|---|---|
| `{ kind: 'water'; at }` | **Water sensor** | checkboxes **Wilting** **Overwatered** | both on |
| `{ kind: 'harvest'; at }` | **Harvest sensor** | **Any** / **All** | Any |
| `{ kind: 'counter'; at }` | **Counter** | live **current** `count`, **Count to**, integer `Field` **n**, **Reset** | place `n = 1` `count = 0` |
| `{ kind: 'day'; at }` | **Day sensor** | checkboxes **Sunrise** **Day** **Sunset** **Twilight** | **Day** on, others off |

Not a crop list. No size HUD. Fertilizer / water-system / vehicle detector / pulser / gates / lamp / traffic light: no HUD. Traffic light: no config HUD, no wash.

Water / harvest / day: `Btn` `selected` rows, same as today’s water. Independent flags on water and day (toggle one, `tune*` with the rest). Harvest is Any / All. Apply immediately (`tuneWater` / `tuneHarvest` / `tuneDay`) and stays open.

Counter column stays open: title **Counter** + ×; live `count`; label **Count to**; integer `Field` `name="n"` `aria-label="Count to"`. Value is stored `n`. Parse integer on change. Apply immediately (`tuneCounter`). `n < 1` or `n > COUNTER_MAX` → no-op, field stays at last applied `n`. Text field: WASD ignored. **Reset to 0** `Btn`. Click `resetCounter` → `count = 0`. Stays open. Does not change `n`.

Live `count` follows sim while the HUD is open. Guest: Field + Reset.

**×** / map click elsewhere / Esc → `closeHud`. Map click another water / harvest / counter / day / sprinkler-hud hit retargets.

Guest: sensor cells, wires, lever / button, water / harvest / counter / day HUD. Still no pipes / valves / sprinklers / sprinkler HUD.

## Look

| kind | look |
|---|---|
| lever | **Lever** |
| button | **Button** |
| lamp | **Lamp** |
| or | **OR gate** |
| and | **AND gate** |
| not | **NOT gate** |
| pulser | **Pulser** |
| counter | **Counter** |
| sensor-water | **Water sensor** |
| sensor-fert | **Fertilizer sensor** |
| sensor-harvest | **Harvest sensor** |
| sensor-day | **Day sensor** |
| water-system | **Water-system sensor - no pipes around sensor!** when not on a net. Else **Water-system sensor - on/off** |
| vehicle-detector | **Vehicle detector** |
| traffic-light | **Traffic light** |
| valve | **Valve** — **Valve - wired** while a wire drives it |

May append **on** / **off** from signal: lever `on`, lamp `inn`, traffic-light `inn`, else `out`. Traffic light groups **off** / **on** from `inn`. Not plots. No soil bars. Water-system off-net uses the no-pipes line as written — no **on** / **off** on that line.

`skuLabel` = look name. Place **Place {skuLabel}**. Unarmed **Flip lever** / **Press button**. Tune **Tune water sensor** / **Tune harvest sensor** / **Tune counter** / **Tune day sensor**. Wire **Cannot wire here** / **Cannot loop** / **Remove wire**. Delete **Delete {look}**. Place **Place Traffic light**. Delete **Delete traffic light**.

## Shop / almanac / research

Build shelf **Sensors**, id `logic`, `cluster: 'build'`. Filing: signal → Sensors: lever, button, lamp, or, and, not, pulser, counter, traffic-light. Readers: water, fert, harvest, water-system, vehicle-detector, day. Traffic light with lever / button, not readers.

`skuDesc` = catalog `blurb`. Paste. No tick / DAG / HUD / SKU in these strings.

| sku | `skuLabel` | `skuDesc` / blurb |
|---|---|---|
| `buy-lever` | **Lever** | A switch you flip by hand to send a signal down its wire, and flip again to stop it. Wire it to a valve or a sprinkler and you control water without walking there. An incoming signal flips it too. |
| `buy-button` | **Button** | Press it to send one short signal that stops on its own. |
| `buy-lamp` | **Lamp** | Lights up while the wire feeding it is on. It does nothing else: it is there to show you what your wiring is doing. |
| `buy-or` | **OR gate** | Turns on when either of its two inputs is on. |
| `buy-and` | **AND gate** | Turns on only while both of its inputs are on. |
| `buy-not` | **NOT gate** | Turns on while its input is off, and off while it is on. |
| `buy-pulser` | **Pulser** | Sends a single signal the moment its input turns on, then stays quiet until that input goes off and comes back. It turns a signal that stays on into a single one. |
| `buy-counter` | **Counter** | Counts up while its input is on. Set a number to stop at: on reaching that count it sends one signal and starts again from zero, so something runs at intervals instead of constantly. |
| `buy-sensor-water` | **Water sensor** | Watches the plots around it and turns on when a plant is too dry or too wet — tick which of the two you care about. Wire it to a sprinkler and the field waters itself. |
| `buy-sensor-fert` | **Fertilizer sensor** | Watches the growing plants around it and turns on as soon as one is starving for fertilizer. |
| `buy-sensor-harvest` | **Harvest sensor** | Watches the crops around it and turns on when they are ready to pick. Set Any for the first ripe plant, or All to wait until the whole patch is ripe. |
| `buy-sensor-day` | **Day sensor** | Turns on during the parts of the day you tick: sunrise, day, sunset, twilight. |
| `buy-water-system` | **Water-system sensor** | Joins your water network like a tap, and turns on when the sprinklers want more water than the tanks hold. Wire it to a valve to shut part of the field off before the whole network runs dry. |
| `buy-vehicle-detector` | **Vehicle detector** | A floor plate you drive over. Turns on while a Quad or tractor stands on it, so an arriving vehicle can set something off. |
| `buy-traffic-light` | **Traffic light** | Stops a vehicle on its route while its input is off, and lets it go when the input turns on. It sends a signal of its own while a vehicle is waiting, so one vehicle can wait for another to finish. |

Pulser / counter / day: `show` + `unlock` `unlock-sensors`, `need: []`. AND / OR / NOT: `show: unlock-sensors`, `unlock: unlock-advanced-sensors`, `need: []`. Locked callout: Needs the **Advanced sensors** research. Water / fert / water-system / vehicle-detector show on `unlock-sensors` and carry a `need` list; their locked callout names that list. Traffic light: `show` `unlock-sensors`, `need` `unlock-dispatch`. There is no valve SKU on this shelf: `unlock-smart-irrigation` gives the valve its port in place. Locked callout names **Automated dispatch** — [[mechanics/research]].

Research card `unlock-advanced-sensors` name **Advanced sensors**. Blurb: **Unlocks AND, OR, and NOT. AND is on if both inputs are. OR if either is. NOT inverts.** Not a `CatalogEntry`.

Almanac **Sensors**: Overview, then lever button lamp or and not pulser counter sensor-water sensor-fert sensor-harvest water-system vehicle-detector traffic-light sensor-day. Tab click lands Overview. Generic pane. Valves and sprinklers on Almanac **Water systems**. [[ui/almanac]]

Assumption: Flip / Press / Tune-water / Tune-harvest / Tune-counter / Tune-day fire when `place.kind === 'none'` and port hits are off (`lens !== 'sensors'`); in `sensors`, output-only whole-cell starts a wire; lever / pulser / counter / traffic-light top / bottom are ports. HUD toggles stay open. Sensors tab after Vehicles, before Land. Off-net water-system = tap-join with no incident pipe. Fan-in / A→B toggle copy here wins over the stale replace-rule in [[mechanics/sensors]]. Additive-store south cell is the same no-port as south silo. Counter `Field` is the existing frame control; out of range does not toast. Traffic-light `skuDesc` is the items blurb.
