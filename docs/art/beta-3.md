# Beta-3 art

Supersedes [[art/beta-2]] with new files below. Palette, 24-unit grid, `shape-rendering="crispEdges"`, no text, no raster, no `currentColor`.

## New files

| file | viewBox | tiles |
|---|---|---|
| `tile-hard-0.svg` `tile-hard-1.svg` | `0 0 24 24` | 1×1 |
| `tile-very-hard-0.svg` | `0 0 24 24` | 1×1 |
| `prop-rock.svg` | `0 0 24 24` | 1×1 |
| `prop-rock-long.svg` | `0 0 48 24` | 2×1 |
| `prop-shrub.svg` `prop-berry-shrub.svg` | `0 0 24 24` | 1×1 |
| `item-pickaxe.svg` `item-better-pickaxe.svg` | `0 0 24 24` | 1×1 |
| `item-shrub.svg` `item-berry.svg` | `0 0 24 24` | 1×1 |

Hard tiles: grass base but clearly drier — larger `dirt` / `dirt-dark` patches, not just extra grass specks. Still unhoed. Two variants via `tileVariant(col,row,2)`.

Very-hard: rocky. Stone chips in `house` / `dirt-dark` / `ink` on a `grass-dark` field. Must read as gravel, not dark grass.

Infertile (after pickaxe on very-hard): paint with the very-hard tile. No new file.

Rock: stone, ink + house + dirt-dark. Long rock is one slab, not two copies.

1×2 rock: draw `prop-rock-long` rotated 90° in the view. Do not add a third file.

Shrub: small bush on grass tones + leaf. Berry-shrub: same bush + ripe berries (`#c43c3c`).

Pickaxe: tool, not a shovel. Better pickaxe: same silhouette, roof/ripe metal.

Item shrub: uprooted bush, no dirt plot. Item berry: handful, `#c43c3c`, not raspberry plant.

## Box overlay

`itemInner` for box with cargo: box (or large-box) group, then cargo art scaled ~10/24 centered in the crate. Fruit → `fruit-*`. Seeds → crop `ripe`. Berry → `item-berry`. Empty: box only.

## Expand label

Not an SVG asset. Map DOM/SVG `<text>` in `ink`. No `ui-btn`.

## House / pump

House door still south wall, second tile column of the 4-wide base (now rows 6–8). Pump art unchanged. Placed pumpjacks reuse `prop-pump.svg`.

## Do not

Imagine, raster, new hex, text in asset files, delete unused can/overlay files.
