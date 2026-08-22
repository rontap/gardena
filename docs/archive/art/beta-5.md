# Beta-5 art

**Historical.** Current law: [[art/beta-6]].

Supersedes [[art/beta-4]] where this file names a replacement. Palette, 24-unit grid, `shape-rendering="crispEdges"`, no text, no raster, no `currentColor`.

Pumpjack map art stays `prop-pump.svg`. Do not redraw it.

## Pipes

Vertex pieces. viewBox `0 0 24 24`. Vertex is `(12,12)`. Arms hit the viewBox edge midpoints so neighbors meet.

| file | default arms | fitting |
|---|---|---|
| `pipe-stub.svg` | E | hex cap, closed west |
| `pipe-i.svg` | E–W | two collar rings |
| `pipe-l.svg` | E + S | cast elbow, heel SE |
| `pipe-t.svg` | W + E + S | header block + stem plate |
| `pipe-x.svg` | N + E + S + W | octagon hub, four corner bolts |

Arm channel: ink `4` tall/wide, `dirt` body `2`, `water` `2`, centered on 12. View rotates 90° CW. Junction from the incident set — [[mechanics/beta-5]]. Distinct fittings: cap, collar, elbow, T-block, cross hub. Not one tube recolored.

Water channel is `#3d7ea6` rects only. Dry (`C===0`) omits those rects. Do not bake wetness in any other fill.

`item-pipe.svg`: shop / almanac / ghost. One flanged segment, not a vertex piece. Same 4 / 2 / 2 stack. May keep a water stripe.

## Sprinklers

Sit on a vertex. viewBox `0 0 24 24`. Three unique bodies, not recolors.

| file | body |
|---|---|
| `prop-sprinkler.svg` | squat `house` base, wood stem, small rotary disc, two side nozzles |
| `prop-sprinkler-vert.svg` | low wood stand, long spray bar, slots along the bar |
| `prop-sprinkler-large.svg` | wide plinth, thick stem, mushroom `roof` cap, four cardinal nozzles |

`item-sprinkler.svg` `item-sprinkler-vert.svg` `item-sprinkler-large.svg`: shop / almanac / ghost. Same silhouette, larger in frame.

`prop-sprinkler-vert.svg` / `item-sprinkler-vert.svg` stay.

## Overlay

`overlay-water.svg` — pipes-lens source icon. viewBox `0 0 24 24`. Small droplet + puddle. Token `water` + `ink` + `house`. Cottage-core. No text. Wells, pumpjacks / starter, sprinklers.

## Well

1×1. Not a scaled 2-tile pump. Stone ring + water + wood windlass. No trough. No pumpjack.

| file | viewBox | use |
|---|---|---|
| `prop-well.svg` | `0 0 24 24` | map, cell min-corner |
| `item-well.svg` | `0 0 24 24` | shop / almanac / ghost |

## Delete

`item-delete.svg`: shop wrench + X. `dirt` / `dirt-dark` / `ink`. Cottage-core. No refund icon.

## Watermelon

`crop-watermelon.svg` — groups `sprout` `grow` `ripe` `dead`, same select as `crop-tomato.svg`. Sprawling vine, not a tomato bush. Ripe is one striped melon: `grass-dark` rind, `leaf` / `grass` bands. Not a `#c43c3c` recolor.

`fruit-watermelon.svg` — hand / box fruit. Whole striped melon, stem, `house` sheen, `ripe` ground spot.

## VFX

Coder paints. Not in the asset files. Working (`R>0` and ≥1 growing AoE plant): rotary `water` dashes on basic + large; linear `water` spray on vertical. Idle = no spray. Minimal.

## Do not

Imagine, raster, new hex, text in asset files, redraw `prop-pump.svg`.
