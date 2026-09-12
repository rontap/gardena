# Sensors

Chrome. Rules [[mechanics/sensors]]. Fenced area [[mechanics/enclosure]]. Items [[items/sensors]]. Art [[art/sensors]]. Dock [[ui/hud]] [[ui/docks]]. Lens [[ui/lens]]. Place [[ui/place]]. Shop [[ui/build]]. Look [[ui/inspect]]. Almanac [[ui/almanac]].

No new chrome shell.

`Checkbox` / `Radio` in `frame.tsx`. Sensors stop using `Btn selected` as a fake tick. Settings uses the same `Checkbox`.

## Lens

`Lens` `sensors`. Unhidden after `unlock-sensors`. Dock row [[ui/lens]].

Wires are sim-state always. Paint and port hits iff the effective lens is `sensors`. An armed sensor-cell SKU forces it through `toolLens`, and confirming a place locks it — [[ui/lens]].

Selecting Build shelf `logic` (**Sensors**) peeks `sensors` with no lock and does not arm a SKU. [[ui/build]]

Esc / Build **×** / Build close / opening another panel: `cancelPlace` and restore an unlocked peek. A locked `sensors` survives. An unlocked peek dies with Build, not the Lens dock.

## Fade

`lens === 'sensors'`: no house `WASH` on `isSensor` cells. Other cells may keep the kind-style fade. Reader wash is the watched set. Sensor center is a sensor cell → not faded.

## Wash

Fenceable range-readers (`s.fenceable`). Same wash as sprinkler AoE. Coord list is the watched set — [[mechanics/enclosure]]. On a fence with `fenceEnclosures` empty: no wash.

Paint that wash when `lens === 'sensors'` (every fenceable range-reader), while that water / harvest / variety / pressure HUD is open (that cell only), on unarmed hover of a range-reader, and while a range-reader SKU is armed (ghost cell). Fertilizer: hover / lens / armed, no HUD. Counter / day / logic / weather HUD open: no wash.

## Wires

Overlay Graphics bezier. Paint [[art/sensors]]. Active (signal `1`) beads `from` → `to` — [[art/vfx]].

Pointer: [[ui/place]]. Combinational cycle → **Cannot loop**. Illegal port → **Cannot wire here**. Finalize of an existing A→B → **Remove wire**.

While a sensor SKU is armed, click confirms place, not a wire.

## Port chrome

Hits [[mechanics/sensors]] `sensors.port`. Iff `lens === 'sensors'` or pending wire. Overlay on the map, not baked into prop SVGs.

| port | mark | at |
|---|---|---|
| `out` | small circle | `portXY` `out` |
| `in` / `in-l` / `in-r` | small square | `portXY` that port |

Marks at every live `ownsPort` `portXY`, including sprinkler / valve after `unlock-smart-irrigation`. Same marks. No prop nubs. Not the full hitbox.

Fill: idle `fruit-red`, signal `1` `water`. Stroke `ink`. A solid mark inside a `PORT_HIT` halo of the same colour at 0.3 alpha — the halo is the hit area.

In `sensors`, lever top / bottom is ports, not Flip.

## HUD

Lever / button: walk-to like valve. **Flip lever** / **Press button**. Work 0 on arrive. Lens off: Flip / Press still fire. Traffic light: no walk-to, no Flip, no HUD.

Config HUDs: remote ObjectHud family, same chrome as **Sprinkler output**. No walk. Sprinkler tune unchanged (`Btn` + icon). Sensor tune HUDs sit centered above the clicked cell. Sprinkler stays on the vertex. Rows chrome lead-in, muted: **Send signal when...** then the ticks.

| target | title | rows |
|---|---|---|
| `{ kind: 'water'; at }` | **Water sensor** | check **Wilting** **Overwatered** |
| `{ kind: 'harvest'; at }` | **Harvest sensor** | radio **Any** / **All** |
| `{ kind: 'counter'; at }` | **Counter** | live **current** `count`, **Count to**, integer `Field` **n**, **Reset** |
| `{ kind: 'day'; at }` | **Day sensor** | check **Sunrise** **Day** **Sunset** **Twilight** |
| `{ kind: 'logic'; at }` | **Logic gate** | radio **OR** / **AND** |
| `{ kind: 'variety'; at }` | **Variety sensor** | check **Plain** / **Named** / **Heirloom** |
| `{ kind: 'weather'; at }` | **Weather sensor** | check **Clear** **Rain** **Dry** **Flood** **Drought** |
| `{ kind: 'pressure'; at }` | **Pressure plate** | check **Vehicle** / **You** / **On the ground** |

Not a crop list. No size HUD. Fertilizer / water-system / pulser / lamp / traffic light: no HUD.

Water / day / variety / weather / pressure: independent flags. Harvest and logic are Radio. Apply immediately and stay open. Defaults [[mechanics/sensors]].

Counter column stays open: title **Counter** + ×; live `count`; label **Count to**; integer `Field` `name="n"` `aria-label="Count to"`. Parse integer on change. Apply immediately. Out of range → field stays at last applied `n`. Text field: WASD ignored. **Reset to 0** `Btn` sets `count = 0`, not `n`. Live `count` follows sim while open. Guest: Field + Reset.

**×** / map click elsewhere / Esc → `closeHud`. Map click another water / harvest / counter / day / logic / variety / weather / pressure / sprinkler-hud hit retargets.

Guest: [[mechanics/multiplayer]] `mp.guest`.

Flip / Press / Tune fire when `place.kind === 'none'` and port hits are off (`lens !== 'sensors'`); in `sensors`, output-only whole-cell starts a wire.
