# Sensors

Place, wires, ports, object HUDs, copy. Rules [[mechanics/sensors]]. Items [[items/sensors]]. Chrome [[ui/hud]] [[ui/docks]]. Lens [[ui/lens]]. Place [[ui/place]]. Shop [[ui/shop]] [[ui/build]]. Look [[ui/inspect]]. Almanac [[ui/almanac]]. Type [[ui/type]]. Palette [[art/palette]].

No new chrome shell. No 5×5 mask HUD. No germ / weather cards. No new sprinkler pane. No wire SKU.

## Lens

`Lens` += `sensors`. Unhidden after `unlock-sensors`. Dock row [[ui/lens]].

Wires are sim-state always. Paint and port hits iff `lens === 'sensors'`. Armed sensor-cell SKU or `buy-smart-valve` forces this lens (pipes pattern).

Esc / Shop **×** / Build close: `cancelPlace`; `pipes` or `sensors` → `off`. Right-click: `cancelPlace` only. Other lenses stay. Shop ↔ Build keeps the ghost and this lens.

## Wash

3×3 readers: water, fertilizer, harvest. Center is the sensor. `fill-water` 0.35, same as sprinkler AoE.

Paint that wash when `lens === 'sensors'` (every such reader) or while that water / harvest HUD is open (that cell only). Not gates. Not lamp. Not lever / button. Not water-system. Not vehicle detector. Not a size HUD.

## Wires

SVG bezier. Idle stroke palette `fruit-red`. Active (signal `1`) stroke `water`. No new `@theme` color. Visual cross is paint, no join.

No price. Fan-out: many wires from one `from`. One wire per input; second finalize replaces.

Start: click an **output port** → `Act.armWire` → `place = { kind: 'wire'; from }`. Pending bezier follows the pointer. Finalize on a valid input → `Act.placeWire`. Cycle → no-op, place stays, **Cannot loop**. Illegal port → no-op, **Cannot wire here**. `cancelPlace` clears.

While a sensor SKU is armed, click confirms place, not a wire.

Delete tool: nearest bezier within `VERTEX_HIT` → **Delete wire**. `Act.delete` `{ k: 'wire'; from; to }`. Building / sprinkler / smart-valve delete drops incident wires.

## Ports

Hits only in `sensors`. `from` is an output. `to` is an input.

| kind | in | out | hit |
|---|---|---|---|
| lever, button, sensor-water, sensor-fert, sensor-harvest, water-system, vehicle-detector | — | `out` bottom | whole-cell = bottom |
| lamp | `in` | — | cell = `in` |
| not | `in` top | `out` bottom | top / bottom |
| and, or | `in-l` left, `in-r` right | `out` bottom | left / right half, bottom |
| sprinkler (`unlock-smart-irrigation`) | `in` | — | vertex |
| smart valve | `in` on the body | — | edge body |

Wiring a sprinkler before `unlock-smart-irrigation` is a no-op → **Cannot wire here**. Manual valve has no port.

## Place

StayArmed: all twelve SKUs. Stamp many. Pay on confirm. Guest `GUEST_BUILD` for the eleven cells + `placeSmartValve`.

Sensor cells: 1×1, `skuInner` like chest. `placeSolidOk`. Copy **Place {skuLabel}**. Hover valid `stroke-ink`, blocked `stroke-roof`.

Smart valve: edge ghost like manual valve, distinct copy **Place Smart valve**. Nearest edge, 0.35 tile. Occupied / not an edge / unowned → **Cannot place here**. Poor → **Cannot afford**. Forces `sensors`, not `pipes`.

Rotate: no-op. No sensor SKU in `ROTATABLE`. Trio still from Sensors `cluster: 'build'`.

## Walk-to / HUD

Lever / button: walk-to like valve. **Flip lever** / **Press button**. Work 0 on arrive.

Config HUDs: remote ObjectHud family, same shell as **Sprinkler output**. Not a new chrome. No walk. Sprinkler tune unchanged.

| target | title | rows | default |
|---|---|---|---|
| `{ kind: 'water'; at }` | **Water sensor** | checkboxes **Wilting** **Overwatered** | both on |
| `{ kind: 'harvest'; at }` | **Harvest sensor** | **Any** / **All** | Any |

Not a crop list. No size HUD. Fertilizer / water-system / vehicle detector / gates / lamp: no HUD.

Checkbox / Any-All applies immediately (`tuneWater` / `tuneHarvest`) and stays open. **×** / map click elsewhere / Esc → `closeHud`. Map click another water / harvest / sprinkler-hud hit retargets.

Guest: sensor cells, smart valve, wires, lever / button, water / harvest HUD. Still no pipes / manual valves / sprinklers / sprinkler HUD.

## Look

| kind | look |
|---|---|
| lever | **Lever** |
| button | **Button** |
| lamp | **Lamp** |
| or | **OR gate** |
| and | **AND gate** |
| not | **NOT gate** |
| sensor-water | **Water sensor** |
| sensor-fert | **Fertilizer sensor** |
| sensor-harvest | **Harvest sensor** |
| water-system | **Water-system sensor** |
| vehicle-detector | **Vehicle detector** |
| smart valve | **Smart valve** |

May append **on** / **off** from signal: lever `on`, lamp `inn`, else `out`; smart valve held input. Not plots. No soil bars.

## Copy

`skuLabel` = look name. `placeLabel` = `skuLabel`.

| when | text |
|---|---|
| place / pulse sensor cell | **Place Lever** / **Place Button** / **Place Lamp** / **Place OR gate** / **Place AND gate** / **Place NOT gate** / **Place Water sensor** / **Place Fertilizer sensor** / **Place Harvest sensor** / **Place Water-system sensor** / **Place Vehicle detector** |
| place / pulse `buy-smart-valve` | **Place Smart valve** |
| unarmed lever | **Flip lever** |
| unarmed button | **Press button** |
| unarmed water / harvest, port hits off | **Tune water sensor** / **Tune harvest sensor** |
| pending wire, illegal port | **Cannot wire here** |
| pending wire, cycle | **Cannot loop** |
| delete, bezier in `VERTEX_HIT` | **Delete wire** |
| delete sensor cell | **Delete lever** / **Delete button** / **Delete lamp** / **Delete OR gate** / **Delete AND gate** / **Delete NOT gate** / **Delete water sensor** / **Delete fertilizer sensor** / **Delete harvest sensor** / **Delete water-system sensor** / **Delete vehicle detector** |
| delete smart valve edge | **Delete smart valve** |
| blocked | **Cannot place here** |
| blocked, `money < price` | **Cannot afford** |

## Shop / almanac

Build shelf **Sensors**, id `logic`, `cluster: 'build'`. Filing: signal → Sensors. Vehicle detector → Sensors. Smart valve → Water (flow), after manual valve.

Almanac Automation: every new SKU, generic building pane. No germ / weather. No new sprinkler pane. [[ui/almanac]]

Assumption: Flip / Press / Tune-water / Tune-harvest fire when `place.kind === 'none'` and port hits are off (`lens !== 'sensors'`); in `sensors`, output-only whole-cell starts a wire. HUD toggles stay open. Sensors tab after Vehicles, before Land.
