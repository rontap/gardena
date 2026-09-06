# Sensors

Place, wires, ports, object HUDs, copy. Rules [[mechanics/sensors]]. Fenced area [[mechanics/enclosure]]. Items [[items/sensors]]. Chrome [[ui/hud]] [[ui/docks]]. Lens [[ui/lens]]. Place [[ui/place]]. Shop [[ui/shop]] [[ui/build]]. Look [[ui/inspect]]. Almanac [[ui/almanac]]. Type [[ui/type]]. Palette [[art/palette]].

No new chrome shell. No wire SKU. No new `@theme` color.

`Checkbox` / `Radio` in `frame.tsx` (border-ink/30, parchment, checked ink). Sensors stop using `Btn selected` as a fake tick. Settings uses the same `Checkbox`.

## Lens

`Lens` += `sensors`. Unhidden after `unlock-sensors`. Dock row [[ui/lens]].

Wires are sim-state always. Paint and port hits iff the effective lens is `sensors`. An armed sensor-cell SKU forces it through `toolLens`, and confirming a place locks it — [[ui/lens]].

Selecting Build shelf `logic` (**Sensors**) peeks `lens = 'sensors'` with no lock. Does not arm a SKU. [[ui/build]]

Esc / Shop **×** / Build close / leaving the shop system: `cancelPlace` and restore an unlocked peek. A locked `sensors` survives. An unlocked peek dies with Build, not the Lens dock.

## Fade

`lens === 'sensors'`: no house `WASH` on `isSensor` cells. Other cells may keep the kind-style fade (pipes pattern: relevant tiles stay clear). Reader wash is the watched set. Sensor center is a sensor cell → not faded.

## Wash

Fenceable range-readers: water, fertilizer, harvest, variety, pressure plate. `fill-water` 0.35, same as sprinkler AoE. Coord list is the watched set — [[mechanics/enclosure]] — not a hardcoded 3×3. On a fence with `fenceEnclosures` empty: no wash.

Paint that wash when `lens === 'sensors'` (every such reader), while that water / harvest / variety / pressure HUD is open (that cell only), on unarmed hover of a range-reader (water, fertilizer, harvest, variety, pressure plate), and while a range-reader SKU is armed (ghost cell). Fertilizer: hover / lens / armed, no HUD. Not gates. Not lamp. Not lever / button. Not pulser / counter. Not day. Not weather. Not water-system. Not traffic light. Not a size HUD. Counter / day / logic / weather HUD open: no wash.

## Wires

Overlay Graphics bezier. Idle stroke palette `fruit-red`. Active (signal `1`) stroke `water`, with beads marching `from` → `to` on the flow channel — [[art/vfx]]. No new `@theme` color. Visual cross is paint, no join.

No price. Fan-out: many wires from one `from`. Fan-in: many wires on one input; second finalize does **not** replace. Inputs OR.

One direct path between two nodes. Finalize of A→B when that node pair exists: **Remove wire**, drop it, `place none`. Delete-tool bezier **Delete wire** stays.

Start: click an **output port** → `Act.armWire` → `place = { kind: 'wire'; from }`. Pending bezier follows the pointer. Finalize on a valid input → `Act.placeWire`. Press-and-release does the same in one gesture: press an `out` disc, release on an `in` disc. Release anywhere else keeps the arm, so click-click is unchanged. Combinational cycle → no-op, place stays, **Cannot loop**. Sequential feedback (lever / pulser / counter / traffic-light `in`) is legal. Illegal port → no-op, **Cannot wire here**. `cancelPlace` clears.

While a sensor SKU is armed, click confirms place, not a wire.

Delete tool: nearest bezier within `VERTEX_HIT` → **Delete wire**. `Act.delete` `{ k: 'wire'; from; to }`. Building / sprinkler / smart-valve delete drops incident wires. Fenceable sensor delete drops incident wires and leaves the fence.

## Ports

Hits only in `sensors`, and a hit is a disc of `PORT_HIT` at `portXY` — preference. The painted mark is that disc, so paint is the hitbox. `from` is an output. `to` is an input.

| kind | in | out | hit |
|---|---|---|---|
| button, sensor-water, sensor-fert, sensor-harvest, sensor-day, sensor-variety, sensor-weather, water-system, vehicle-detector | — | `out` bottom | disc. Tune body where the device has a HUD |
| lamp | `in` top | — | whole-cell = `in` |
| not, pulser, counter, lever, traffic-light | `in` top | `out` bottom | top / bottom |
| logic | `in-l` left, `in-r` right | `out` bottom | three discs, not halves |
| sprinkler (`unlock-smart-irrigation`) | `in` | — | vertex disc |
| valve (`unlock-smart-irrigation`) | `in` on the body | — | edge-midpoint disc |
| mill, jam, still | `in` origin top | — | origin whole-cell = `in`. East still cell: no port |
| pump | `in` origin top | — | origin whole-cell = `in`. East Pumpjack cell: no port |
| chest, freezer, seed-silo, additive-store | — | `out` origin bottom | origin whole-cell = bottom. South silo / additive cell: no port |

The cell body is the device action in **every** lens: Flip, Press, Tune, Fill. No half-cell port, no lens-dependent hitbox. Logic gate gets three discs, not left and right halves.

Whole-cell fallback, `sensors` only, for the devices with no body action: lamp (`in`), sensor-fert / water-system / chest / freezer / seed-silo / additive-store (`out`), pump origin (`in`). Pressure plate / variety / weather / water / harvest / day / logic / counter have Tune or Field: no whole-cell fallback.

Wiring a sprinkler or a valve before `unlock-smart-irrigation` is a no-op → **Cannot wire here**. East still cell / south silo cell / east Pumpjack cell: **Cannot wire here**. Compost-box: pads, no port. Barrel, grinder, field silos: no port.

## Port chrome

Iff `lens === 'sensors'` or pending wire. Overlay on the map, not baked into prop SVGs.

| port | mark | at |
|---|---|---|
| `out` | small circle | `portXY` `out` |
| `in` / `in-l` / `in-r` | small square | `portXY` that port |

Also sprinkler `in` after `unlock-smart-irrigation`, smart-valve `in`, mill / jam / still / pump `in`, chest / freezer / seed-silo / additive-store `out`. Lens only. Same circles / squares. No prop nubs. Not the full hitbox.

Fill: idle `fruit-red`, high `water`. Stroke `ink`. A solid 3 px mark inside a `PORT_HIT` halo of the same colour at 0.3 alpha — the halo is the hit area, drawn so the player can aim at it.

## Place

StayArmed: fifteen cell SKUs. Stamp many. Pay on confirm. Guest `GUEST_BUILD` for the fifteen cells. `buy-water-system` is not a shop SKU.

Sensor cells: 1×1, `skuInner` like chest. `placeSolidOk`. Fenceable SKU on a fenced untilled cell: legal. Non-fenceable on a fenced cell: **Cannot place here**. Copy **Place {skuLabel}**. Hover valid `stroke-ink`, blocked `stroke-roof`.

On a fence: the fence still draws with its joins; the sensor draws on top. Two sprites. [[architecture/view]]

Rotate: no-op. No sensor SKU in `ROTATABLE`. Trio still from Sensors `cluster: 'build'`.

## Walk-to / HUD

Lever / button: walk-to like valve. **Flip lever** / **Press button**. Work 0 on arrive. Lens off: Flip / Press still fire. In `sensors`, lever top / bottom is ports, not Flip. Traffic light: no walk-to, no Flip, no HUD.

Config HUDs: remote ObjectHud family, same Chrome as **Sprinkler output**. Not a new chrome. No walk. Sprinkler tune unchanged (`Btn` + icon). Sensor tune HUDs (rows + Counter) sit **centered, above** the clicked cell (`translate(-50%, calc(-100% - 8px))` from the cell’s top centre). Sprinkler stays on the vertex. Rows chrome lead-in, muted `text-ink/55`: **Send signal when...** then the ticks.

```
HudRow =
  | { kind: 'check'; id; label; on }
  | { kind: 'radio'; id; label; options: { id; label; on }[] }

HudSpec = { title; col; row; stay; rows: HudRow[]; pick(id) }
```

| target | title | rows | default |
|---|---|---|---|
| `{ kind: 'water'; at }` | **Water sensor** | check **Wilting** **Overwatered** | both on |
| `{ kind: 'harvest'; at }` | **Harvest sensor** | radio **Any** / **All** | Any |
| `{ kind: 'counter'; at }` | **Counter** | live **current** `count`, **Count to**, integer `Field` **n**, **Reset** | place `n = 1` `count = 0` |
| `{ kind: 'day'; at }` | **Day sensor** | check **Sunrise** **Day** **Sunset** **Twilight** | **Day** on, others off |
| `{ kind: 'logic'; at }` | **Logic gate** | radio **OR** / **AND** | OR |
| `{ kind: 'variety'; at }` | **Variety sensor** | check **Plain** / **Named** / **Heirloom** | Plain on |
| `{ kind: 'weather'; at }` | **Weather sensor** | check **Clear** **Rain** **Dry** **Flood** **Drought** | **Clear** on |
| `{ kind: 'pressure'; at }` | **Pressure plate** | check **Vehicle** / **You** / **On the ground** | Vehicle on |

Not a crop list. No size HUD. Fertilizer / water-system / pulser / lamp / traffic light: no HUD. Traffic light: no config HUD, no wash.

Water / day / variety / weather / pressure: independent flags (toggle one, `tuneSensor` / `tuneWater` / `tuneDay` with the rest). Harvest and logic are Radio. Apply immediately and stays open.

Counter column stays open: title **Counter** + ×; live `count`; label **Count to**; integer `Field` `name="n"` `aria-label="Count to"`. Value is stored `n`. Parse integer on change. Apply immediately (`tuneCounter`). `n < 1` or `n > COUNTER_MAX` → no-op, field stays at last applied `n`. Text field: WASD ignored. **Reset to 0** `Btn`. Click `resetCounter` → `count = 0`. Stays open. Does not change `n`.

Live `count` follows sim while the HUD is open. Guest: Field + Reset.

**×** / map click elsewhere / Esc → `closeHud`. Map click another water / harvest / counter / day / logic / variety / weather / pressure / sprinkler-hud hit retargets.

Guest: sensor cells, wires, lever / button, water / harvest / counter / day / logic / variety / weather / pressure HUD. Still no pipes / valves / sprinklers / sprinkler HUD.

## Look

| kind | look |
|---|---|
| lever | **Lever** |
| button | **Button** |
| lamp | **Lamp** |
| logic | **Logic gate** |
| not | **NOT gate** |
| pulser | **Pulser** |
| counter | **Counter** |
| sensor-water | **Water sensor** |
| sensor-fert | **Fertilizer sensor** |
| sensor-harvest | **Harvest sensor** |
| sensor-variety | **Variety sensor** |
| sensor-weather | **Weather sensor** |
| sensor-day | **Day sensor** |
| water-system | **Water-system sensor - no pipes around sensor!** when not on a net. Else **Water-system sensor - on/off** |
| vehicle-detector | **Pressure plate**. On a fence with `fenceEnclosures` empty: **open fence, close it to turn the sensor on** |
| traffic-light | **Traffic light** |
| valve | **Valve** — **Valve - wired** while a wire drives it |

Fenceable readers on an open fence use that not-enclosed line — no **on** / **off** on that line.

May append **on** / **off** from signal: lever `on`, lamp `inn`, traffic-light `inn`, logic `out`, else `out`. Traffic light groups **off** / **on** from `inn`. Logic groups **or** / **and** from `mode`. Not plots. No soil bars. Water-system off-net uses the no-pipes line as written — no **on** / **off** on that line.

`skuLabel` = look name. Place **Place {skuLabel}**. Unarmed **Flip lever** / **Press button**. Tune **Tune {skuLabel}**. Wire **Cannot wire here** / **Cannot loop** / **Remove wire**. Delete **Delete {look}**. Place **Place Traffic light**. Delete **Delete traffic light**.

## Shop / almanac / research

Build shelf **Sensors**, id `logic`, `cluster: 'build'`. Filing: signal → Sensors: lever, button, lamp, logic, not, pulser, counter, traffic-light. Readers: water, fert, harvest, variety, weather, vehicle-detector, day. Traffic light with lever / button, not readers. Water-system not on the shelf.

`skuDesc` = catalog `blurb`. Paste. No tick / DAG / HUD / SKU in these strings.

| sku | `skuLabel` | `skuDesc` / blurb |
|---|---|---|
| `buy-lever` | **Lever** | A switch you flip by hand to send a signal down its wire, and flip again to stop it. Wire it to a valve or a sprinkler and you control water without walking there. An incoming signal flips it too. |
| `buy-button` | **Button** | Press it to send one short signal that stops on its own. |
| `buy-lamp` | **Lamp** | Lights up while the wire feeding it is on. It does nothing else: it is there to show you what your wiring is doing. |
| `buy-logic` | **Logic gate** | Turns on from two incoming signals. Set OR so it turns on if either is on, AND so it turns on only while both are on. Wire two sensors into it so a Sprinkler or a Valve can wait on more than one signal. |
| `buy-not` | **NOT gate** | Turns on while its input is off, and off while it is on. |
| `buy-pulser` | **Pulser** | Sends a single signal the moment its input turns on, then stays quiet until that input goes off and comes back. It turns a signal that stays on into a single one. |
| `buy-counter` | **Counter** | Counts up while its input is on. Set a number to stop at: on reaching that count it sends one signal and starts again from zero, so something runs at intervals instead of constantly. |
| `buy-sensor-water` | **Water sensor** | Watches the plots around it and turns on when a plant is too dry or too wet — tick which of the two you care about. Wire it to a sprinkler and the field waters itself. |
| `buy-sensor-fert` | **Fertilizer sensor** | Watches the growing plants around it and turns on as soon as one is starving for fertilizer. |
| `buy-sensor-harvest` | **Harvest sensor** | Watches the crops around it and turns on when they are ready to pick. Set Any for the first ripe plant, or All to wait until the whole patch is ripe. |
| `buy-sensor-variety` | **Variety sensor** | Watches plants and trees around it and turns on when a growing or ripe plant matches what you tick: the plain crop, a named Variety, or Heirloom. |
| `buy-sensor-weather` | **Weather sensor** | Turns on while today's weather is one you tick: Clear, Rain, Dry, Flood, or Drought. |
| `buy-sensor-day` | **Day sensor** | Turns on during the parts of the day you tick: sunrise, day, sunset, twilight. |
| `buy-water-system` | **Water-system sensor** | Joins your water network like a tap, and turns on when the sprinklers want more water than the tanks hold. Wire it to a valve to shut part of the field off before the whole network runs dry. |
| `buy-vehicle-detector` | **Pressure plate** | Watches the ground around it and turns on while something you tick is there: a Quad or Tractor, You, or something on the ground. Place it on a Wooden fence and it watches the plots inside that fence instead. |
| `buy-traffic-light` | **Traffic light** | Stops a vehicle on its route while its input is off, and lets it go when the input turns on. It sends a signal of its own while a vehicle is waiting, so one vehicle can wait for another to finish. |

Pulser / counter / day / weather: `show` + `unlock` `unlock-sensors`, `need: []`. Logic gate / NOT: `show: unlock-sensors`, `unlock: unlock-advanced-sensors`, `need: []`. Locked callout: Needs the **Advanced sensors** research. Water / fert / variety / vehicle-detector show on `unlock-sensors` and carry a `need` list; their locked callout names that list. Variety `need` `unlock-crop-variants`. Traffic light: `show` `unlock-sensors`, `need` `unlock-dispatch`. There is no valve SKU on this shelf: `unlock-smart-irrigation` gives the valve its port in place. Locked callout names **Automated dispatch** — [[mechanics/research]]. `buy-water-system` `skuShown` false.

Research card `unlock-advanced-sensors` name **Advanced sensors**. Blurb: A Logic gate turns on from two signals: set OR if either is on, AND only while both are on. A NOT gate turns on while its input is off. Wire them so a Sprinkler or a Valve can wait on more than one sensor, or run only while another signal is off. SKUs: Logic gate + NOT. Not a `CatalogEntry`.

Almanac **Sensors**: Overview, then lever button lamp logic not pulser counter sensor-water sensor-fert sensor-harvest sensor-variety sensor-weather water-system vehicle-detector traffic-light sensor-day. Tab click lands Overview. Generic pane. Valves and sprinklers on Almanac **Water systems**. [[ui/almanac]]

Assumption: Flip / Press / Tune fire when `place.kind === 'none'` and port hits are off (`lens !== 'sensors'`); in `sensors`, output-only whole-cell starts a wire; lever / pulser / counter / traffic-light top / bottom are ports. HUD toggles stay open. Sensors tab after Vehicles, before Land. Off-net water-system = tap-join with no incident pipe. Fan-in / A→B toggle copy here wins over the stale replace-rule in [[mechanics/sensors]]. Additive-store south cell is the same no-port as south silo. Counter `Field` is the existing frame control; out of range does not toast. Traffic-light `skuDesc` is the items blurb. Open-fence look is the not-enclosed line for every fenceable reader, not only the pressure plate.
