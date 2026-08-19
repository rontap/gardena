# Beta-4 art

**Historical.** Current law: [[art/beta-5]].

Supersedes [[art/beta-3]] where this file names a replacement. Palette, 24-unit grid, `shape-rendering="crispEdges"`, no text, no raster, no `currentColor`.

## House

Redraw `prop-house.svg`. viewBox `0 0 96 72`. Cottage-core, still simple. Same occupancy. Door south wall, second tile column (`x = 24–48`) facing (15,9). Pump unchanged.

## New files

| file | viewBox | use |
|---|---|---|
| `prop-chest.svg` | `0 0 24 24` | 1×1 chest on map |
| `prop-grinder.svg` | `0 0 24 24` | 1×1 mill on map |
| `item-chest.svg` | `0 0 24 24` | shop / almanac / ghost |
| `item-grinder.svg` | `0 0 24 24` | shop / almanac / ghost |

Chest: wooden crate, `dirt` / `dirt-dark` / `ink`, closed lid, not a fruit box. Grinder: small mill stone + hopper, `house` / `ink` / `dirt-dark`.

## Expand

Designed plate, not an asset file. Map control. See [[ui/beta-4]].

## Speech

HTML/SVG bubble. Not a new asset file required. `house` fill, `ink` text.

## Lens tint

SVG rect over the cell. Tokens from [[ui/beta-4]]. No new hex except interpolations between `roof` / `leaf` / `water`.
