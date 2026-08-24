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

Paint that wash when `lens === 'sensors'` (every such reader) or while that water / harvest HUD is open (that cell only). Not gates. Not lamp. Not lever / button. Not water-system. Not vehicle detector. Not a size HUD.

## Wires

SVG bezier. Idle stroke palette `fruit-red`. Active (signal `1`) stroke `water`. No new `@theme` color. Visual cross is paint, no join.

No price. Fan-out: many wires from one `from`. Fan-in: many wires on one input; second finalize does **not** replace. Inputs OR.

One direct path between two nodes. Finalize of A→B when that node pair exists: **Remove wire**, drop it, `place none`. Delete-tool bezier **Delete wire** stays.

Start: click an **output port** → `Act.armWire` → `place = { kind: 'wire'; from }`. Pending bezier follows the pointer. Finalize on a valid input → `Act.placeWire`. Cycle → no-op, place stays, **Cannot loop**. Illegal port → no-op, **Cannot wire here**. `cancelPlace` clears.

While a sensor SKU is armed, click confirms place, not a wire.

Delete tool: nearest bezier within `VERTEX_HIT` → **Delete wire**. `Act.delete` `{ k: 'wire'; from; to }`. Building / sprinkler / smart-valve delete drops incident wires.

## Ports

Hits only in `sensors`. `from` is an output. `to` is an input.

| kind | in | out | hit |
|---|---|---|---|
| lever, button, sensor-water, sensor-fert, sensor-harvest, water-system, vehicle-detector | — | `out` bottom | whole-cell = bottom |
| lamp | `in` top | — | whole-cell = `in` |
| not | `in` top | `out` bottom | top / bottom |
| and, or | `in-l` left, `in-r` right | `out` bottom | left / right half, bottom |
| sprinkler (`unlock-smart-irrigation`) | `in` | — | vertex |
| smart valve | `in` on the body | — | edge body |
| mill, jam, still | `in` origin top | — | origin whole-cell = `in`. East still cell: no port |
| chest, freezer, seed-silo, additive-store | — | `out` origin bottom | origin whole-cell = bottom. South silo / additive cell: no port |

Wiring a sprinkler before `unlock-smart-irrigation` is a no-op → **Cannot wire here**. Manual valve has no port. East still cell / south silo cell: **Cannot wire here**. Compost-box: pads, no port. Barrel, grinder, field silos: no port.

## Port chrome

Iff `lens === 'sensors'` or pending wire. Overlay on the map, not baked into prop SVGs.

| port | mark | at |
|---|---|---|
| `out` | small circle | `portXY` `out` |
| `in` / `in-l` / `in-r` | small square | `portXY` that port |

Also sprinkler `in` after `unlock-smart-irrigation`, smart-valve `in`, mill / jam / still `in`, chest / freezer / seed-silo / additive-store `out`. Lens only. Same circles / squares as 1.6.1. No prop nubs. Not the full hitbox.

Fill: idle `fruit-red`, high `water`. Stroke `ink`. Size ~2–3 viewBox units on the art 24-tile (~4–6 px). Readable, not a second sprite.

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
| water-system | **Water-system sensor - no pipes around sensor!** when not on a net. Else **Water-system sensor - on/off** |
| vehicle-detector | **Vehicle detector** |
| smart valve | **Smart valve** |

May append **on** / **off** from signal: lever `on`, lamp `inn`, else `out`; smart valve held input. Not plots. No soil bars. Water-system off-net uses the no-pipes line as written — no **on** / **off** on that line.

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
| pending wire, that A→B already exists | **Remove wire** |
| delete, bezier in `VERTEX_HIT` | **Delete wire** |
| delete sensor cell | **Delete lever** / **Delete button** / **Delete lamp** / **Delete OR gate** / **Delete AND gate** / **Delete NOT gate** / **Delete water sensor** / **Delete fertilizer sensor** / **Delete harvest sensor** / **Delete water-system sensor** / **Delete vehicle detector** |
| delete smart valve edge | **Delete smart valve** |
| blocked | **Cannot place here** |
| blocked, `money < price` | **Cannot afford** |

## Shop / almanac

Build shelf **Sensors**, id `logic`, `cluster: 'build'`. Filing: signal → Sensors. Vehicle detector → Sensors. Smart valve → Water (flow), after manual valve.

Almanac Automation: every new SKU, generic building pane. No germ / weather. No new sprinkler pane. [[ui/almanac]]

Assumption: Flip / Press / Tune-water / Tune-harvest fire when `place.kind === 'none'` and port hits are off (`lens !== 'sensors'`); in `sensors`, output-only whole-cell starts a wire. HUD toggles stay open. Sensors tab after Vehicles, before Land. Off-net water-system = tap-join with no incident pipe. Fan-in / A→B toggle copy here wins over the stale replace-rule in [[mechanics/sensors]]. Additive-store south cell is the same no-port as south silo.
