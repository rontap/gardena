# SVG

`src/assets/*.svg`. Clean paths. One concept per file. Hex from [[art/palette]] (cottage, or industrial metal on vehicle/machine assets).

Farm tiles: atlas rasters named groups — [[architecture/view]]. HUD / almanac / shop: React chrome SVG (`svgs.ts`). Not an SVG camera. Not a DOM world. Mermaid stays the `#debug-techtree` exception — [[stack]].

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
| 1×2 tree, furnace | `0 0 24 48` |
| 2×1 pump, still, research station | `0 0 48 24` |
| 3×2 hangar | `0 0 72 48` |
| 4×3 house | `0 0 96 72` |
| 1×2.5 windmill | `0 0 24 60` |
| 2×2 generator | `0 0 48 48` |

Chrome strips (`ui-header`, `ui-rail`, `ui-corner-*`) and panel art (`ui-market-stall`, `ui-recap-night`, `ui-menu`) are not tiles. Own viewBox. Still no width/height.

## Groups

Stages are sibling `<g id>` in one file. Atlas rasterizes one named group per texture. Chrome (`svgs.ts`) selects by id. Whole-file mount paints every group — don't.

| files | ids |
|---|---|
| `crop-*.svg` | `sprout` `grow` `dead`, plus one ripe group per Variety of that crop: `ripe` `ripe-variant` `ripe-heirloom` |
| `fruit-*.svg` | one per Variety of that crop: `base` `variant` `heirloom` |
| `item-wine.svg` `item-cider.svg` | `base` `heirloom` |
| `prop-*-tree.svg` | `trunk` `grow` `unripe`, plus one ripe group per Variety: `ripe` `ripe-variant` `ripe-heirloom` — `trunk` is the cut trunk, `grow` is the sapling, [[art/tree]] |
| `item-graft-*.svg` | one per Variety group that species is asked for; `item-graft-apple.svg` carries all three because every annual routes to it |
| `item-research-station` `prop-research-station` | `off` `on` |
| `crop-weed-*.svg` | `sprout` `grow` |
| `item-lever` `prop-lever` `item-button` `prop-button` `item-lamp` `prop-lamp` `item-pulser` `prop-pulser` `item-sensor-harvest` `prop-sensor-harvest` `item-sensor-day` `prop-sensor-day` `item-water-system` `prop-water-system` `item-vehicle-detector` `prop-vehicle-detector` `item-traffic-light` `prop-traffic-light` `prop-furnace` | `off` `on` |
| `item-counter` `prop-counter` | `s0` `s1` `s2` `s3` `s4` |
| `ui-arrow-right.svg` | `ink` `fill` |
| `item-sensor-water` `prop-sensor-water` | `red` `blue` |
| `item-sensor-fert` `prop-sensor-fert` | `red` `ok` |
| `pipe-valve-jack` | `jack` |

One face per Variety, no more and no fewer. Crop ripe: `ripe` (base), `ripe-variant`, `ripe-heirloom`. Fruit: `base`, `variant`, `heirloom`. A crop with fewer Varieties carries fewer groups — a spare group is art nobody can reach, and a copy of `base` is a Variety the player cannot see. Select by id (`ripeGroup`, `fruitGroup`, `Plant.stage`, `treeStage`). `atlas.test.ts` `view.groups` holds the files and the code to the same set.

Not this set: watermelon, grass, weed, rotten.

Rotten field plant is `crop-rotten.svg`, not a crop group.

Named assets: [[art/actor]], [[art/tree]], [[art/recap-night]], [[art/menu]], [[art/weather]], [[art/tilled-edges]], [[art/skills]], [[art/vehicles]], [[art/electricity]], [[art/sensors]], [[art/items]], [[art/companies]].
