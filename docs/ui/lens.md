# Lens

A left [[ui/docks]] `Dock` titled **Lens**, `w-80`. Was a bare floating menu; it is a panel like every other now.

HUD **Lens** toggles the dock. The rail button shows the active lens id under the label when one is on.

Top: a full-width **No lens** button, `bg-ink` when `lens === 'off'`. Then `Label` **Overlays** and one card per row.

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

Sensors card blurb: Reveals wires and sensor reach.

`off` is the button, not a row.

Hide **Water need** until husband owns `water-study`; hide **Land quality** until `land-study`. Hidden rows are counted and reported in the footer line — *n more lenses are waiting on a family study skill* — so the player knows they exist. If the active lens loses its skill, force `off`.

Hide **Sensors** until `unlock-sensors`. Not a family-study row. Not in that footer.

Tokens (`@theme`): `lens-bad` `#e23b2e`, `lens-good` `#2fd15a`, `lens-done` `#1e9be6`, `leaf` `#6bc04a`, `water` `#3d7ea6`, `ink` `#1c1710`, `roof` `#8b3a2a`, `house` `#cfc6b0`, `ripe` `#d4a017`.

Pipes wash on the map when `lens === 'pipes'` or place is delete / a `PIPE_PLACE` sku.

Sensors: wires + port chrome + 3×3 reader wash when `lens === 'sensors'`. Armed sensor-cell SKU or `buy-smart-valve` forces this lens. Build shelf `logic` sets it and does not arm. Close / `leaveShop` / Esc: pipes or sensors → `off`. Switching Build category does not force it off. Shop ↔ Build keeps it.

`lens === 'sensors'`: no house `WASH` on `isSensor` cells (pipes pattern: relevant tiles stay clear). Other cells may keep the kind-style fade. 3×3 reader wash unchanged. Sensor center is a sensor cell → not faded.

Wire stroke idle palette `fruit-red`, active `water`. Port overlay: output circle / input square at `portXY`, idle `fruit-red`, high `water`, stroke `ink` — [[ui/sensors]]. No new `@theme` color.
