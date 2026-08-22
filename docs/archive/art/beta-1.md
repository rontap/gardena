# Beta-1 art

**Historical.** Current law: [[art/beta-2]].

Top-down, pixel-esque, SVG. Clean paths. `viewBox` on a 16×16 or 32×32 grid. No editor metadata. `shape-rendering: crispEdges` where it helps.

## Palette

| token | hex | use |
|---|---|---|
| grass | `#4a7c3f` | untilled tile fill |
| grass-dark | `#3a6232` | clumps on `tile-grass-*` |
| dirt | `#8a5a32` | empty plot; UI studs |
| dirt-dark | `#6b4423` | planted / clod under crop |
| water | `#3d7ea6` | pump, thirst icon |
| leaf | `#6bc04a` | plants |
| ripe | `#d4a017` | ready (wheat/carrot lean; tomato/raspberry use `#c43c3c`) |
| ink | `#1c1710` | outlines; UI rails |
| house | `#cfc6b0` | walls; panel fill |
| roof | `#8b3a2a` | house; UI header / corner |

Character: small top-down walker, ink outline, distinct from crops.

## ViewBox

**1 tile = 16 viewBox units.** Integer coordinates. No `width` / `height` on the file.

| file | viewBox | tiles | place |
|---|---|---|---|
| `actor.svg` | `0 0 16 16` | 1×1 | center on the actor's continuous position |
| `crop-*.svg` | `0 0 16 16` | 1×1 | cell min-corner |
| `item-*.svg` | `0 0 16 16` | 1×1 | toolbar / HUD icon |
| `overlay-water.svg` | `0 0 16 16` | 1×1 | same cell as the plant, stacked above the crop |
| `tile-grass-0.svg` … `tile-grass-3.svg` | `0 0 16 16` | 1×1 | untilled cell min-corner |
| `prop-house.svg` | `0 0 64 48` | 4×3 | house `base` origin — art size **is** the rect base |
| `prop-pump.svg` | `0 0 32 16` | 2×1 | occupied-cell min-corner, extends +2 east / +1 south |
| `ui-corner-tl.svg` `ui-corner-tr.svg` `ui-corner-br.svg` `ui-corner-bl.svg` | `0 0 8 8` | — | frame corners, overlay the rail joints |
| `ui-rail.svg` | `0 0 16 6` | — | tile on X along a frame edge; rotate 90° for vertical |
| `ui-header.svg` | `0 0 16 12` | — | tile on X behind HUD / panel titles |

Every root has `shape-rendering="crispEdges"`. Hex from the palette (fruit ripe `#c43c3c` as named above). No `currentColor`.

## Untilled ground

Not a checker. Not a flat shade swap.

Untilled cells paint `tile-grass-{n}.svg` with **`n = (col + row) % 4`**. Four files; do not collapse them into one pattern sheet.

Clumps wrap across the +1 neighbor (right and down are `n+1`, left and up are `n−1`, mod 4). Adjacent variants share those edge pixels. Corners of each tile stay grass so the four-way join is clean.

Empty plots stay `dirt`. Growing / ripe / dead soil stays `dirt-dark`. Those are fills, not new tile files.

## Crop stages

Each `crop-*.svg` holds four sibling `<g>` layers. Select by **id**, not by file.

| id | when |
|---|---|
| `sprout` | `kind === 'growing'` and `maturity < 0.33` |
| `grow` | `kind === 'growing'` and `maturity < 1` |
| `ripe` | `kind === 'ripe'` |
| `dead` | `kind === 'dead'` |

View shows **exactly one** group (`<use href="crop-carrot.svg#ripe">`, or hide sibling `g`s). All four paint if the whole file is mounted.

Water is `overlay-water.svg`, never inside a crop. Draw it on `growing` / `ripe` when `thirst < 0.33`. Not on `dead`. Critical (`thirst < 0.10`) is the same overlay — view may emphasize; no second file.

Health is a HUD / cell overlay in UI. Not a crop layer. Not a new SVG.

## Pump art vs base

`prop-pump.svg` is **2×1 tiles**. The sim base is a circle `r = 0.5` (one cell). Occupancy uses the base only.

Well / mechanism is the west tile; trough / spout is the east tile. Anchor the SVG at the occupied cell's min-corner (starter: tile `(18, 1)` → art covers `[18, 20] × [1, 2]`). Visual overflow into `(19, 1)` does not occupy that cell. Does not overlap the house.

Buying pumpjack does not change this file.

## UI chrome

HUD, shop, research, market, inventory, recap frames mount these. Transparent outside the ink. Panel fill stays `house` in the layout, not in the SVG.

| file | mount |
|---|---|
| `ui-header.svg` | title strip; repeat X |
| `ui-rail.svg` | remaining edges; repeat along the long axis |
| `ui-corner-*.svg` | matching corner, 8×8, over the rail ends |

No text in the files. Labels stay React.

## Files

`src/assets/*.svg` — one concept per file, named by id (`crop-carrot.svg`, `item-shovel.svg`, `prop-house.svg`, `prop-pump.svg`, `actor.svg`, `tile-grass-0.svg`, `ui-header.svg`).

Growth stages: 3 frames derived from maturity (`<0.33`, `<1`, ripe). Dead is a fourth. Water icon is a separate overlay, not baked into the plant.

`actor.svg` is one south-facing walker. No 4-dir sheet.

House door is drawn on the south wall in the second tile column (`x = 20–28` of the 64-wide viewBox) so it faces the sell stand at `(15, 3)`. The stand tile is not in the house SVG.

## Do not

Raster, Imagine, filters you cannot justify, text in the SVG.
