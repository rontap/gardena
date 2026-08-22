# Beta-2 art

**Historical.** Current law: [[art/beta-3]].

Supersedes [[art/beta-1]] size and ground. Palette and crop-stage ids stay.

Top-down, pixel-esque, SVG. Integer coordinates. No `width` / `height` on the file. `shape-rendering="crispEdges"`. Palette hex only. No `currentColor`. No text in files. No raster.

## Grid

**1 tile = 24 viewBox units.** CSS paints that tile at 48px at scale 1.

Redraw every map object to this grid. Do not scale-up the 16-unit files.

| file | viewBox | tiles |
|---|---|---|
| `actor.svg` | `0 0 24 24` | 1×1 |
| `crop-*.svg` | `0 0 24 24` | 1×1 |
| `item-*.svg` | `0 0 24 24` | 1×1 |
| `fruit-carrot.svg` `fruit-potato.svg` `fruit-wheat.svg` `fruit-tomato.svg` `fruit-raspberry.svg` | `0 0 24 24` | 1×1 |
| `tile-grass-0.svg` … `tile-grass-4.svg` | `0 0 24 24` | 1×1 |
| `tile-dirt-0.svg` `tile-dirt-1.svg` | `0 0 24 24` | 1×1 |
| `prop-house.svg` | `0 0 96 72` | 4×3 |
| `prop-pump.svg` | `0 0 48 24` | 2×1 |
| `overlay-water.svg` | keep | unused |
| `ui-corner-*.svg` `ui-rail.svg` `ui-header.svg` | keep | chrome |
| `ui-btn.svg` | `0 0 48 8` | chrome |

## Ground

Five grass files. Two dirt files.

`n = tileVariant(col, row, 5)` / `tileVariant(col, row, 2)` — [[architecture/beta-2]]. Not `(col+row)%n`. Variants must read as a field, not a stripe or checker.

Clumps wrap across edges so neighbors join. Corners stay the base fill.

Empty / planted soil both use `tile-dirt-*`. Those files are **hoed earth** (felkapált): furrows, clods, hoe marks. Must read as tilled, not as a brown grass. Two furrow layouts. Crop groups sit on top. Grass stays unhoed.

## Crops / actor / items / props

Same stage ids: `sprout` `grow` `ripe` `dead`.

House door still faces the stand at `(15, 3)` (south wall, second tile column of the 4-wide base).

Pump: west well, east trough. Anchor at occupied-cell min-corner.

Items in play: `item-shovel` `item-better-shovel` `item-bucket` `item-large-bucket` `item-box` `item-large-box`.

Hand/drop fruit uses `fruit-{crop}.svg`, not the in-field `ripe` group. Harvested produce for HUD / hand / drops. More detailed, less stylized than the plant. No dirt plot. Still palette hex, 24×24 viewBox, no text. Carrot / wheat lean `ripe` `#d4a017`. Tomato / raspberry use `#c43c3c`.

`ui-btn.svg`: second pass. Quiet rustic. Idle / hover / disabled groups. Thin top cap, header-like wood grain. Not a black slab. Not a tall face stretched across a row.

Leave on disk, unused: `item-can.svg` `item-large-can.svg` `overlay-water.svg`. Do not delete them. Do not redraw them unless needed to keep the file valid.

## Buttons

`ui-btn.svg` — three sibling `<g>`:

| id | when |
|---|---|
| `idle` | default |
| `hover` | pointer over an enabled button |
| `disabled` | locked / cannot-afford / inventory-full / running research no-op |

Horizontal cap, same language as `ui-header.svg`: `ink` rails, `roof` band, `dirt` grain studs, `house` lip. No vertical box stroke. Tiles on X along the button’s top edge. Hover keeps the cap and adds a `house` highlight on the roof. Disabled is muted dirt (`dirt` / `dirt-dark` in place of `roof` / `ink`). No new hex.

No label in the SVG.

## Water

Do not draw the overlay. Plant groups stay visible when thirsty.

## Do not

Raster, Imagine, filters you cannot justify, text in the SVG, delete unused files, invent extra chrome files.
