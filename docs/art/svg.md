# SVG

`src/assets/*.svg`. Clean paths. One concept per file. Hex from [[art/palette]] cottage tokens.

## Root

- `viewBox` set. Integer coordinates.
- No `width` / `height` on component files.
- No editor metadata.
- `shape-rendering="crispEdges"`.
- No new hex. No `currentColor`. No text. No raster.

## Tile grid

**1 tile = 24 viewBox units.** Preference.

| kind | viewBox |
|---|---|
| 1×1 tile, crop, item, actor | `0 0 24 24` |
| 1×2 tree | `0 0 24 48` |
| 2×1 pump | `0 0 48 24` |
| 4×3 house | `0 0 96 72` |

Chrome strips (`ui-header`, `ui-rail`, `ui-corner-*`) and panel art (`ui-market-stall`, `ui-recap-night`) are not tiles. Own viewBox. Still no width/height.

## Groups

Stages are sibling `<g id>` in one file. View shows exactly one group. All groups paint if the whole file is mounted.

| files | ids |
|---|---|
| `crop-*.svg` | `sprout` `grow` `ripe` `ripe-rare` `ripe-heirloom` `dead` |
| `fruit-*.svg` | `common` `rare` `heirloom` |
| `prop-*-tree.svg` | `grow` `unripe` `ripe` |
| `crop-weed-*.svg` | `sprout` `grow` |

Select by id (`ripeGroup`, `fruitGroup`, `Plant.stage`, `treeStage`). Uncommon uses `common` / `ripe`.

Rotten field plant is `crop-rotten.svg`, not a crop group.

Named assets: [[art/actor]], [[art/tree]], [[art/recap-night]], [[art/tilled-edges]], [[art/skills]].
