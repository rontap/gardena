# Actor

`actor.svg`, `0 0 24 24`, one pose, no facing. Drawn on the 24-unit tile grid, held item on top at `translate(15,13) scale(8/24)`.

| part | rows | hex |
|---|---|---|
| straw hat crown + brim | 1–5 | `#d4a017`, band and underside `#6b4423` |
| face | 6–11 | `#cfc6b0`, eyes and outline `#1c1710`, mouth `#6b4423` |
| shirt and sleeves | 12–15 | `#8b3a2a`, shade `#6b4423` |
| hands | 14 | `#cfc6b0` |
| overalls, bib and straps | 12–19 | `#3d7ea6` |
| boots | 20–22 | `#8a5a32` over `#6b4423`, sole `#1c1710` |

Silhouette is 1 px ink all round; arms break out to `x = 2` and `x = 21` so the shape reads against grass at tile size.

Hat group `id="hat"` wraps the straw-gold CROWN rects (`#d4a017` crown + brim). Band and underside stay `#6b4423` outside the group. Default fill is straw gold. One pose still. Farm: atlas `actor-body` + `actor-hat`; tint is the seat table. Not CSS `--hat` on the world.

| seat | hex |
|---|---|
| 0 | `#d4a017` |
| 1 | `#ff3d8e` |
| 2 | `#2de8ff` |
| 3 | `#b85cff` |

1–3 are off-palette, loud on grass, not cottage (not water / leaf / ripe / fruit-red / overalls). Band `#6b4423`.
