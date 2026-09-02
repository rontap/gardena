# Lens

A left [[ui/docks]] `Dock` titled **Lens**, `w-80`. Was a bare floating menu; it is a panel like every other now.

HUD **Lens** toggles the dock. The rail button shows the active lens id under the label when one is on.

Top: a full-width **No lens** button, `bg-ink` when `lens === 'off'`. Then the **Lock view** button, then `Label` **Overlays** and one card per row.

Card: name `text-base` semibold, one-line blurb `text-sm`, then the swatch legend `text-xs`. Active card is `bg-dirt-dark` and says **active**. Picking does not close the dock — comparing lenses is the job.

| id | row | swatches |
|---|---|---|
| `water` | Water need | dry `lens-bad` · wet `lens-good` · full `lens-done` |
| `land` | Land quality | low `lens-bad` · ok `lens-good` · full `lens-done` |

`land` also tints **untilled** ground by the goodness field (the fertility a dig would give): very-hard / hard reads red-orange, soft runs orange → green. Infertile is flat `lens-bad`. Use it to pick where to dig.
| `ripe` | Ripeness | early `lens-bad` · ready `lens-good` · ripe `lens-done` |
| `kind` | Object type | plant `leaf` · machine `water` · obstruction `ink` · building `roof` |
| `rarity` | Rarity | common `house` · uncommon `leaf` · rare `water` · **heirloom** `ripe` |
| `pipes` | Pipes | none |
| `sensors` | Sensors | none |
| `vehicles` | Vehicle interactions | none |

Sensors card blurb: Reveals wires and sensor reach.

Vehicle interactions blurb: Hangar, silo, and machine pads.

`off` is the button, not a row. **No lens** clears the lock with it.

## Peek, job, tool

Three states, view-local in `map.tsx`. Not `World`, not Save, not logged.

| state | is |
|---|---|
| `lens` | the picked lens |
| `lensLock` | survives the dock closing |
| `toolLens` | forced by an armed sku, lives exactly as long as that arming |

Effective lens = `toolLens` when set, else `lens`. Disarm restores the picked lens; it never overwrites it. `toolLens` is `sensors` while a sensor-cell sku is armed, `pipes` while a `PIPE_PLACE` sku or delete is armed.

**Lock view** sits under **No lens**, `selected` on `lensLock`, disabled while `lens === 'off'` with the reason in the row — [[ui/callout-hover]]. Closing the dock (**×**, rail toggle, Esc) drops an unlocked lens to `off` and keeps a locked one.

Rail **Lens** sub-line carries the lens id, and *locked* with it when locked, beside a **×** that clears lens and lock without opening the dock — [[ui/hud]].

Hide **Water need** until husband owns `water-study`; hide **Land quality** until `land-study`. Hidden rows are counted and reported in the footer line — *n more lenses are waiting on a family study skill* — so the player knows they exist. If the active lens loses its skill, force `off`.

Hide **Sensors** until `unlock-sensors`. Not a family-study row. Not in that footer.

Hide **Vehicle interactions** until `unlock-vehicles`. Not a family-study row. Not in that footer.

Tokens (`@theme`): `lens-bad` `#e23b2e`, `lens-good` `#2fd15a`, `lens-done` `#1e9be6`, `leaf` `#6bc04a`, `water` `#3d7ea6`, `ink` `#1c1710`, `roof` `#8b3a2a`, `house` `#cfc6b0`, `ripe` `#d4a017`.

Pipes (joints, valves, wells, sprinklers, fences) always drawn. Faint when `lens !== 'pipes'` and place is not delete / a `PIPE_PLACE` sku — [[ui/place]]. Lens **Pipes** is the wetness tint + sprinkler AoE wash, not the only way to see joints.

Water-source mark (`pipe-source`, × + tap glyph on each occupied pump / rain-tank cell) only while pipes overlay is on (`lens === 'pipes'` or delete / a `PIPE_PLACE` sku). Not faint. Hidden when joints are faint. Joints stay always drawn.

Wetness + AoE wash when `lens === 'pipes'` or place is delete / an `AOE_WASH` sku (`buy-pipe` `buy-valve` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large`). Unarmed hover of a placed sprinkler also paints that head’s `aoe()` — [[ui/place]].

Sensors: wires + port chrome + 3×3 reader wash when the effective lens is `sensors`. Build shelf `logic` sets it, locks it, and does not arm. Confirming a sensor-cell place sets and locks it too, look **Sensors lens locked**, once per arming. `leaveShop` no longer touches the lens: `toolLens` ends with the arming.

Vehicles: paint hangar-return + pad arrows iff `driverVehicle(local)` OR `lens === 'vehicles'`. Same `HANGAR_RETURN` / `PAD_DROP` / `PAD_TAKE`. No wash. Driving still paints with this lens off. Editor on: force this lens; route overlay numbered. This lens and editor off: thin assigned routes, no numbers. [[ui/vehicles]]

`lens === 'sensors'`: no house `WASH` on `isSensor` cells (pipes pattern: relevant tiles stay clear). Other cells may keep the kind-style fade. 3×3 reader wash unchanged. Sensor center is a sensor cell → not faded.

Wire stroke idle palette `fruit-red`, active `water`. Port overlay: output circle / input square at `portXY`, idle `fruit-red`, high `water`, stroke `ink` — [[ui/sensors]]. No new `@theme` color.
