# SVG

`src/assets/*.svg`. Clean paths. One concept per file. Hex from [[art/palette]] (cottage, or industrial metal on vehicle/machine assets).

## Root

- `viewBox` set. Integer coordinates.
- No `width` / `height` on component files.
- No editor metadata.
- `shape-rendering="crispEdges"`.
- No unnamed hex. No `currentColor`. No text. No raster.

## Tile grid

**1 tile = 24 viewBox units.** Preference.

| kind | viewBox |
|---|---|
| 1×1 tile, crop, item, actor | `0 0 24 24` |
| 1×2 tree | `0 0 24 48` |
| 2×1 pump, still | `0 0 48 24` |
| 3×2 hangar | `0 0 72 48` |
| 4×3 house | `0 0 96 72` |
| 1×2.5 windmill | `0 0 24 60` |
| 2×2 generator | `0 0 48 48` |

Chrome strips (`ui-header`, `ui-rail`, `ui-corner-*`) and panel art (`ui-market-stall`, `ui-recap-night`, `ui-menu`) are not tiles. Own viewBox. Still no width/height.

## Groups

Stages are sibling `<g id>` in one file. View shows exactly one group. All groups paint if the whole file is mounted.

| files | ids |
|---|---|
| `crop-*.svg` | `sprout` `grow` `ripe` `ripe-rare` `ripe-heirloom` `dead` |
| `fruit-*.svg` | `common` `rare` `heirloom` |
| `item-wine.svg` | `common` `rare` `heirloom` |
| `prop-*-tree.svg` | `grow` `unripe` `ripe` |
| `crop-weed-*.svg` | `sprout` `grow` |
| `item-lever` `prop-lever` `item-button` `prop-button` `item-lamp` `prop-lamp` `item-pulser` `prop-pulser` `item-sensor-harvest` `prop-sensor-harvest` `item-sensor-day` `prop-sensor-day` `item-water-system` `prop-water-system` `item-vehicle-detector` `prop-vehicle-detector` | `off` `on` |
| `item-counter` `prop-counter` | `s0` `s1` `s2` `s3` `s4` |
| `item-sensor-water` `prop-sensor-water` | `red` `blue` |
| `item-sensor-fert` `prop-sensor-fert` | `red` `ok` |
| `item-smart-valve` `pipe-smart-valve` | `closed` `open` |

Select by id (`ripeGroup`, `fruitGroup`, `Plant.stage`, `treeStage`). Uncommon uses `common` / `ripe`.

Rotten field plant is `crop-rotten.svg`, not a crop group.

Named assets: [[art/actor]], [[art/tree]], [[art/recap-night]], [[art/menu]], [[art/tilled-edges]], [[art/skills]], [[art/vehicles]], [[art/electricity]], [[art/sensors]], [[art/items]].
