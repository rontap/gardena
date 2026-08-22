# Beta-6 art

Supersedes [[art/beta-5]] where this file names a replacement. Palette, 24-unit grid, `shape-rendering="crispEdges"`, no text, no raster, no `currentColor`, no new hex.

Pumpjack map art stays `prop-pump.svg`. Do not redraw it.

## Palette

Tokens from [[art/beta-1]]. Fruit red `#c43c3c` stays (tomato / raspberry common). No other hex.

| token | hex |
|---|---|
| grass | `#4a7c3f` |
| grass-dark | `#3a6232` |
| dirt | `#8a5a32` |
| dirt-dark | `#6b4423` |
| water | `#3d7ea6` |
| leaf | `#6bc04a` |
| ripe | `#d4a017` |
| ink | `#1c1710` |
| house | `#cfc6b0` |
| roof | `#8b3a2a` |
| fruit-red | `#c43c3c` |

## HUD buttons

Pixel cottage-core icon plates. viewBox `0 0 24 24`. Sibling `<g id>`:

| id | plate | icon |
|---|---|---|
| `idle` | `house` + `dirt` thatch rail | wood / thatch / `ink` |
| `hover` | `dirt-dark` + `dirt` rail | `house` / `roof` / `ripe` |
| `selected` | `ink` + `house` lip | `house` (holes `ink`) |
| `disabled` | faded `dirt` + `dirt-dark` rail | `dirt-dark` |

Not `ui-btn.svg` dirt slabs. Labels stay React.

| file | icon |
|---|---|
| `ui-btn-shop.svg` | storefront + `roof` awning |
| `ui-btn-research.svg` | book + sprout |
| `ui-btn-market.svg` | stall + coin scale |
| `ui-btn-almanac.svg` | open almanac |
| `ui-btn-lens.svg` | lens / monocle |
| `ui-btn-delete.svg` | wrench + X (item-delete silhouette, smaller) |
| `ui-btn-rotate.svg` | two corner arrows |
| `ui-btn-cancel.svg` | `ink` X on wood |

## Coin

`ui-coin.svg` — viewBox `0 0 12 12`. `ripe` body, `ink` outline, `dirt` rim. Money glyph. No `$`.

`ui-coin-silver.svg` — same. `house` `#cfc6b0` body, `ink` outline, `dirt-dark` rim.

## Meter

`ui-meter.svg` — viewBox `0 0 40 8`. Five 8×8 cells at `x = 0, 8, 16, 24, 32`.

| slot | group | fill rect | empty |
|---|---|---|---|
| 0 | `slot-0` | `#fill-0` | `ink` box, `house` inner |
| 1 | `slot-1` | `#fill-1` | same |
| 2 | `slot-2` | `#fill-2` | same |
| 3 | `slot-3` | `#fill-3` | same |
| 4 | `slot-4` | `#fill-4` | same |

Coder sets `#fill-N` to `dirt` or `leaf` for the first N cells. Almanac 1–5: [[ui/beta-6]].

## Quality pip

`ui-quality.svg` — viewBox `0 0 8 8`. `ink` box + plus. One recolor shape: `<rect id="fill">`, default `leaf`.

| rarity | `#fill` |
|---|---|
| uncommon | `leaf` |
| rare | `water` |
| heirloom | `ripe` |

Common: no pip. View: `qualityPip`. Lower-right on Face / plant / held item.

## Fruit

Same file. Sibling groups `common` `rare` `heirloom`. Uncommon uses `common`. viewBox `0 0 24 24`. Hand / box / Face.

| file | common | rare | heirloom |
|---|---|---|---|
| `fruit-carrot.svg` | `ripe` orange | Atomic Red (`#c43c3c` + `roof`) | Cosmic Purple (`roof` + `water`) |
| `fruit-potato.svg` | tan `dirt` | Adirondack Blue (`water`) | Russian Banana (`ripe` fingerling) |
| `fruit-wheat.svg` | `ripe` gold | Black emmer (`ink` heads) | Red Fife (`roof` awns) |
| `fruit-tomato.svg` | `#c43c3c` | Cherokee Purple (`roof`) | Green Zebra (`leaf` + `grass-dark` stripes) |
| `fruit-raspberry.svg` | `#c43c3c` cluster | Golden (`ripe`) | Black raspberry (`ink` + `leaf`) |
| `fruit-watermelon.svg` | striped rind | Yellow Crimson (`ripe` flesh cue) | Moon and Stars (`ink` spots) |

## Crops

Keep `sprout` `grow` `ripe` `dead`. Add `ripe-rare` `ripe-heirloom`. Foliage unchanged. Field fruit matches the fruit table.

| plant | group |
|---|---|
| common / uncommon | `ripe` |
| rare | `ripe-rare` |
| heirloom | `ripe-heirloom` |

Files: `crop-carrot.svg` `crop-potato.svg` `crop-wheat.svg` `crop-tomato.svg` `crop-raspberry.svg` `crop-watermelon.svg`.

## Rotten

`crop-rotten.svg` — one shared wilted heap. `dirt` / `dirt-dark` / `ink`. No groups. Not a `CropId`. Plot `{ kind: 'rotten' }`.

## Actor

`actor.svg` — viewBox `0 0 24 24`. Simpler top-down cottage walker. Big `ink` silhouette. Fills: `house` + `dirt-dark` only. 2-pixel eyes. Simple legs. Visible right arm. No held item in the file. Readable at 48px. Fewer than ~18 rects.

Hand socket (coder composites the item): pixel box `x=15 y=13 w=8 h=8` (lower-right). Scale item ~8/24 into that box.

## Phase icons

viewBox `0 0 16 16`. Cottage sun / sky. No text.

| file | look |
|---|---|
| `ui-phase-sunrise.svg` | sun on horizon, `ripe` + `roof` |
| `ui-phase-day.svg` | high sun, `ripe` |
| `ui-phase-sunset.svg` | low sun, `roof` + `ripe` |
| `ui-phase-twilight.svg` | dim sun / dusk, `ink` + `water` + `house` |

## Irrigation

Industrial steel. Supersedes [[art/beta-5]] pipes and sprinklers. `house` = steel, `ink` = outline, `dirt-dark` = shade only, `water` = wet channel. No wood: do not use `dirt` as body. `dirt-dark` is shade, not timber. No thatch. No `roof` on fittings or sprinklers.

Well stays stone (`prop-well.svg` / `item-well.svg`). Pumpjack stays `prop-pump.svg`.

### Pipes

Vertex pieces. viewBox `0 0 24 24`. Vertex is `(12,12)`. Arms hit the viewBox edge midpoints so neighbors meet.

| file | default arms | fitting |
|---|---|---|
| `pipe-stub.svg` | E | hex cap, closed west |
| `pipe-i.svg` | E–W | two collar rings |
| `pipe-l.svg` | E + S | cast elbow, heel SE |
| `pipe-t.svg` | W + E + S | header block + stem plate |
| `pipe-x.svg` | N + E + S + W | octagon hub, four corner bolts |

Arm channel: ink `4` tall/wide, `house` body `2`, `water` `2`, centered on 12. View rotates 90° CW. Junction from the incident set — [[mechanics/beta-5]]. Distinct fittings: cap, collar, elbow, T-block, cross hub. Not one tube recolored.

Water channel is `#3d7ea6` rects only. Dry (`C===0`) omits those rects. Do not bake wetness in any other fill.

`item-pipe.svg`: shop / almanac / ghost. One flanged steel segment, not a vertex piece. Same 4 / 2 / 2 stack. May keep a water stripe.

### Sprinklers

Sit on a vertex. viewBox `0 0 24 24`. Three unique bodies, not recolors. Metallic.

| file | body |
|---|---|
| `prop-sprinkler.svg` | sits in ~10–12 of the 24 box, centered on `(12,12)`. Low steel head, thin stem, small disc |
| `prop-sprinkler-vert.svg` | smaller steel spray bar |
| `prop-sprinkler-large.svg` | steel mushroom, smaller than the wood version, four cardinal nozzles |

`item-sprinkler.svg` `item-sprinkler-vert.svg` `item-sprinkler-large.svg`: shop / almanac / ghost. Same silhouette, larger in frame.

`prop-sprinkler-vert.svg` / `item-sprinkler-vert.svg` stay.

## Research icons

viewBox `0 0 24 24`. `shape-rendering="crispEdges"`. No text. No groups. Research cards. Not HUD plates.

| file | look |
|---|---|
| `ui-research-tools.svg` | shovel + bucket, cottage-core |
| `ui-research-auto.svg` | steel pipe segment + small sprinkler |
| `ui-research-adv.svg` | well ring + two small steel nozzles |
| `ui-research-expand.svg` | map plate + plus / fence corner. dirt + grass + ink |

Auto / adv: irrigation steel. Tools: wood + `house` metal, same as `item-shovel` / `item-bucket`. Expand: `dirt` `#8a5a32` + `grass` `#4a7c3f` + `ink` `#1c1710` only.

## Grass

`tile-grass-0.svg` … `tile-grass-7.svg`. Fill `grass` `#4a7c3f`. `n = tileVariant(col, row, 8)`.

Wrap edges identical on all eight (top↔bottom, left↔right). Corners stay `grass`. Interiors differ: tall `grass-dark` tufts, small `leaf` flowers (`ripe` 1px center), `dirt-dark` 1px pebbles. Not a checker.

## Very hard

`tile-very-hard-0.svg` — fill `grass` `#4a7c3f`. Stones `ink` / `dirt-dark` / `house`. Same grass variant index as untilled.

## Do not

Imagine, raster, new hex, text in asset files, redraw `prop-pump.svg`, invent extra files.
