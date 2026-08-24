# Sensors

Place, wires, ports, object HUDs, copy. Rules [[mechanics/sensors]]. Items [[items/sensors]]. Chrome [[ui/hud]] [[ui/docks]]. Lens [[ui/lens]]. Place [[ui/place]]. Shop [[ui/shop]] [[ui/build]]. Look [[ui/inspect]]. Almanac [[ui/almanac]]. Type [[ui/type]]. Palette [[art/palette]].

No new chrome shell. No 5×5 mask HUD. No germ / weather cards. No new sprinkler pane. No wire SKU. No new `@theme` color.

## Lens

`Lens` += `sensors`. Unhidden after `unlock-sensors`. Dock row [[ui/lens]].

Wires are sim-state always. Paint and port hits iff `lens === 'sensors'`. Armed sensor-cell SKU or `buy-smart-valve` forces this lens (pipes pattern).

Selecting Build shelf `logic` (**Sensors**) sets `lens = 'sensors'`. Does not arm a SKU. Switching to another Build category does **not** force this lens off. [[ui/build]]

Esc / Shop **×** / Build close / leaving the shop system: `cancelPlace`; `pipes` or `sensors` → `off`. `leaveShop` matches Esc. Right-click: `cancelPlace` only. Other lenses stay. Shop ↔ Build keeps the ghost and this lens.

## Fade

`lens === 'sensors'`: no house `WASH` on `isSensor` cells. Other cells may keep the kind-style fade (pipes pattern: relevant tiles stay clear). 3×3 reader wash unchanged. Sensor center is a sensor cell → not faded.

## Wash

3×3 readers: water, fertilizer, harvest. Center is the sensor. `fill-water` 0.35, same as sprinkler AoE.

Paint that wash when `lens === 'sensors'` (every such reader) or while that water / harvest HUD is open (that cell only). Not gates. Not lamp. Not lever / button. Not pulser / counter. Not day. Not water-system. Not vehicle detector. Not a size HUD. Counter / day HUD open: no wash.

## Wires

SVG bezier. Idle stroke palette `fruit-red`. Active (signal `1`) stroke `water`. No new `@theme` color. Visual cross is paint, no join.

No price. Fan-out: many wires from one `from`. Fan-in: many wires on one input; second finalize does **not** replace. Inputs OR.

One direct path between two nodes. Finalize of A→B when that node pair exists: **Remove wire**, drop it, `place none`. Delete-tool bezier **Delete wire** stays.

Start: click an **output port** → `Act.armWire` → `place = { kind: 'wire'; from }`. Pending bezier follows the pointer. Finalize on a valid input → `Act.placeWire`. Combinational cycle → no-op, place stays, **Cannot loop**. Sequential feedback (lever / pulser / counter `in`) is legal. Illegal port → no-op, **Cannot wire here**. `cancelPlace` clears.

While a sensor SKU is armed, click confirms place, not a wire.

Delete tool: nearest bezier within `VERTEX_HIT` → **Delete wire**. `Act.delete` `{ k: 'wire'; from; to }`. Building / sprinkler / smart-valve delete drops incident wires.

## Ports

Hits only in `sensors`. `from` is an output. `to` is an input.

| kind | in | out | hit |
|---|---|---|---|
| button, sensor-water, sensor-fert, sensor-harvest, sensor-day, water-system, vehicle-detector | — | `out` bottom | whole-cell = bottom |
| lamp | `in` top | — | whole-cell = `in` |
| not, pulser, counter, lever | `in` top | `out` bottom | top / bottom |
| and, or | `in-l` left, `in-r` right | `out` bottom | left / right half, bottom |
| sprinkler (`unlock-smart-irrigation`) | `in` | — | vertex |
| smart valve | `in` on the body | — | edge body |
| mill, jam, still | `in` origin top | — | origin whole-cell = `in`. East still cell: no port |
| chest, freezer, seed-silo, additive-store | — | `out` origin bottom | origin whole-cell = bottom. South silo / additive cell: no port |

Lever is not output-only. Same hit as NOT: top half `in`, bottom `out`. Pulser / counter same. Wiring a sprinkler before `unlock-smart-irrigation` is a no-op → **Cannot wire here**. Manual valve has no port. East still cell / south silo cell: **Cannot wire here**. Compost-box: pads, no port. Barrel, grinder, field silos: no port.

## Port chrome

Iff `lens === 'sensors'` or pending wire. Overlay on the map, not baked into prop SVGs.

| port | mark | at |
|---|---|---|
| `out` | small circle | `portXY` `out` |
| `in` / `in-l` / `in-r` | small square | `portXY` that port |

Also sprinkler `in` after `unlock-smart-irrigation`, smart-valve `in`, mill / jam / still `in`, chest / freezer / seed-silo / additive-store `out`. Lens only. Same circles / squares as 1.6.1. No prop nubs. Not the full hitbox.

Fill: idle `fruit-red`, high `water`. Stroke `ink`. Size ~2–3 viewBox units on the art 24-tile (~4–6 px). Readable, not a second sprite.

## Place

StayArmed: fourteen cell SKUs + `buy-smart-valve`. Stamp many. Pay on confirm. Guest `GUEST_BUILD` for the fourteen cells + `placeSmartValve`.

Sensor cells: 1×1, `skuInner` like chest. `placeSolidOk`. Copy **Place {skuLabel}**. Hover valid `stroke-ink`, blocked `stroke-roof`.

Smart valve: edge ghost like manual valve, distinct copy **Place Smart valve**. Nearest edge, 0.35 tile. Occupied / not an edge / unowned → **Cannot place here**. Poor → **Cannot afford**. Forces `sensors`, not `pipes`.

Rotate: no-op. No sensor SKU in `ROTATABLE`. Trio still from Sensors `cluster: 'build'`.

## Walk-to / HUD

Lever / button: walk-to like valve. **Flip lever** / **Press button**. Work 0 on arrive. Lens off: Flip / Press still fire. In `sensors`, lever top / bottom is ports, not Flip.

Config HUDs: remote ObjectHud family, same `Chrome` `w-56` as **Sprinkler output**. Not a new chrome. No walk. Sprinkler tune unchanged.

| target | title | rows | default |
|---|---|---|---|
| `{ kind: 'water'; at }` | **Water sensor** | checkboxes **Wilting** **Overwatered** | both on |
| `{ kind: 'harvest'; at }` | **Harvest sensor** | **Any** / **All** | Any |
| `{ kind: 'counter'; at }` | **Counter** | live **current** `count`, **Count to**, integer `Field` **n**, **Reset** | place `n = 1` `count = 0` |
| `{ kind: 'day'; at }` | **Day sensor** | checkboxes **Sunrise** **Day** **Sunset** **Twilight** | **Day** on, others off |

Not a crop list. No size HUD. Fertilizer / water-system / vehicle detector / pulser / gates / lamp: no HUD.

Water / harvest / day: `Btn` `selected` rows, same as today’s water. Independent flags on water and day (toggle one, `tune*` with the rest). Harvest is Any / All. Apply immediately (`tuneWater` / `tuneHarvest` / `tuneDay`) and stays open.

Counter column, same `Chrome` `w-56`, stays open:

1. Title **Counter** + ×
2. Current value: live `count`, `tabular-nums` `text-lg`. Not an input.
3. Label **Count to** (`text-sm`)
4. Integer `Field` (`w-full select-text border-2 border-ink/30 bg-parch px-2 py-2 font-mono text-sm text-ink shadow-[inset_2px_2px_0_0_rgba(28,23,16,0.12)] outline-none placeholder:text-ink/35 focus:border-ink`), `name="n"`, `aria-label="Count to"`, `tabular-nums`. Value is stored `n`. Parse integer on change. Apply immediately (`tuneCounter`). `n < 1` or `n > COUNTER_MAX` → no-op, field stays at last applied `n`. No error face. Text field: WASD ignored.
5. **Reset to 0** `Btn`, full width. Click `resetCounter` → `count = 0`. Stays open. Does not change `n`.

Live `count` follows sim while the HUD is open. Guest: Field + Reset.

**×** / map click elsewhere / Esc → `closeHud`. Map click another water / harvest / counter / day / sprinkler-hud hit retargets.

Guest: sensor cells, smart valve, wires, lever / button, water / harvest / counter / day HUD. Still no pipes / manual valves / sprinklers / sprinkler HUD.

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
| smart valve | **Smart valve** |

May append **on** / **off** from signal: lever `on`, lamp `inn`, else `out`; smart valve held input. Not plots. No soil bars. Water-system off-net uses the no-pipes line as written — no **on** / **off** on that line.

## Copy

`skuLabel` = look name. `placeLabel` = `skuLabel`.

| when | text |
|---|---|
| place / pulse sensor cell | **Place Lever** / **Place Button** / **Place Lamp** / **Place OR gate** / **Place AND gate** / **Place NOT gate** / **Place Pulser** / **Place Counter** / **Place Water sensor** / **Place Fertilizer sensor** / **Place Harvest sensor** / **Place Day sensor** / **Place Water-system sensor** / **Place Vehicle detector** |
| place / pulse `buy-smart-valve` | **Place Smart valve** |
| unarmed lever | **Flip lever** |
| unarmed button | **Press button** |
| unarmed water / harvest / counter / day, port hits off | **Tune water sensor** / **Tune harvest sensor** / **Tune counter** / **Tune day sensor** |
| pending wire, illegal port | **Cannot wire here** |
| pending wire, cycle | **Cannot loop** |
| pending wire, that A→B already exists | **Remove wire** |
| delete, bezier in `VERTEX_HIT` | **Delete wire** |
| delete sensor cell | **Delete lever** / **Delete button** / **Delete lamp** / **Delete OR gate** / **Delete AND gate** / **Delete NOT gate** / **Delete pulser** / **Delete counter** / **Delete water sensor** / **Delete fertilizer sensor** / **Delete harvest sensor** / **Delete day sensor** / **Delete water-system sensor** / **Delete vehicle detector** |
| delete smart valve edge | **Delete smart valve** |
| blocked | **Cannot place here** |
| blocked, `money < price` | **Cannot afford** |

## Shop / almanac / research

Build shelf **Sensors**, id `logic`, `cluster: 'build'`. Filing: signal → Sensors: lever, button, lamp, or, and, not, pulser, counter. Readers: water, fert, harvest, water-system, vehicle-detector, day. Smart valve → Water (flow), after manual valve.

`skuDesc` = catalog `blurb`. Paste. No tick / DAG / HUD / SKU in these strings.

| sku | `skuLabel` | `skuDesc` / blurb |
|---|---|---|
| `buy-lever` | **Lever** | Throw it, or a wire turning on throws it. Output high when on. |
| `buy-button` | **Button** | Press. Output high for a short pulse. |
| `buy-lamp` | **Lamp** | Lights when its input is high. |
| `buy-or` | **OR gate** | Output high if either input is high. |
| `buy-and` | **AND gate** | Output high if both inputs are high. |
| `buy-not` | **NOT gate** | Output is the inverse of its input. |
| `buy-pulser` | **Pulser** | When its input turns on, the output turns on once, then off until the input turns off. |
| `buy-counter` | **Counter** | Counts while its input is on. Set a number; when the count reaches it, the output turns on once and the count starts over. |
| `buy-sensor-water` | **Water sensor** | Reads nearby plant water. Output high when a plot matches the checked boxes. |
| `buy-sensor-fert` | **Fertilizer sensor** | Reads nearby growing plants. Output high when any is starving. |
| `buy-sensor-harvest` | **Harvest sensor** | Reads nearby crops. Any: one ripe. All: every growing or ripe plant is ripe. |
| `buy-sensor-day` | **Day sensor** | Turns on during the parts of the day you check: sunrise, day, sunset, twilight. Day is checked when you place it. |
| `buy-water-system` | **Water-system sensor** | Joins a water net. Output high when sprinklers on that net want more than the tanks hold. |
| `buy-vehicle-detector` | **Vehicle detector** | Flush plate. Output high when a field Quad or tractor sits on this tile. |
| `buy-smart-valve` | **Smart valve** | Sits on an edge. Closed unless its input is high. No manual click. |

Pulser / counter / day: `show` + `unlock` `unlock-sensors`, `need: 'none'`. AND / OR / NOT: `show: unlock-sensors`, `unlock: unlock-advanced-sensors`, `need: unlock-sensors`. Locked callout: Needs the **Advanced sensors** research.

Research card `unlock-advanced-sensors` name **Advanced sensors**. Blurb: **Unlocks AND, OR, and NOT. AND is on if both inputs are. OR if either is. NOT inverts.** Not a `CatalogEntry`.

Almanac **Sensors**: Overview, then lever button lamp or and not pulser counter sensor-water sensor-fert sensor-harvest water-system vehicle-detector sensor-day. Tab click lands Overview. Generic pane. Smart valve and sprinklers on Almanac **Water systems**. No germ / weather. No new sprinkler pane. [[ui/almanac]]

Assumption: Flip / Press / Tune-water / Tune-harvest / Tune-counter / Tune-day fire when `place.kind === 'none'` and port hits are off (`lens !== 'sensors'`); in `sensors`, output-only whole-cell starts a wire; lever / pulser / counter top / bottom are ports. HUD toggles stay open. Sensors tab after Vehicles, before Land. Off-net water-system = tap-join with no incident pipe. Fan-in / A→B toggle copy here wins over the stale replace-rule in [[mechanics/sensors]]. Additive-store south cell is the same no-port as south silo. Counter `Field` is the existing frame control; out of range does not toast.
