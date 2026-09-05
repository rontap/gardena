# Trees

`prop-{apple,apricot,olive,cherry}-tree.svg` are 24×48 vertical two-tile props.

Groups: `trunk` `grow` `unripe`, then one mature `ripe` group per Variety of that species: `ripe` `ripe-variant` `ripe-heirloom`. Unripe fruit carries no Variety — you cannot tell what it will be until it colours.

`trunk` is the cut trunk: no canopy, soil mound at `y ≈ 43`, species bark on a short stump with a dirt cut face. Apple thick, apricot forked stubs, olive gnarled with the knot, cherry slim with two stubs. Not the sapling.

`grow` is the **sapling** in the ground: a species-shaped mini crown on a whip trunk over a fresh soil mound, drawn low so it reads small. Not an item face.

Mature unripe* share the species canopy. Ink silhouette, `#3a6232` canopy, `#4a7c3f` mid, `#6bc04a` highlight top-left; trunk ink + `#6b4423` with a lit `#8a5a32` left edge and a root flare at `y ≈ 44`. Silhouettes are the species tell: apple round and tall, apricot wide and low with forked branches, olive narrow and gnarled with `#cfc6b0` silver flecks, cherry twin-lobed and slim. No fruit on unripe*. Variety is the ripe fruit — silhouette and fill, never a canopy tint.

| species | `ripe` | `ripe-variant` | `ripe-heirloom` |
|---|---|---|---|---|
| apple | 4×4 fruit-red | 3×3 roof, clustered (`kingston-black`) | 4×4 ripe | 3×5 blush, tall (`pink-lady`) |
| apricot | 4×4 ripe | 4×4 ripe + blush cheek (`blenheim`) | 3×3 blush, more (`klosterneuburger`) |
| olive | 4×4 dirt-dark | 3×3 ripe, many (`arbequina`) | — |
| cherry | 3×3 fruit-red | — | 4×4 roof, fewer (`bing`) |

Apple has no second variant; olive has no heirloom; cherry has no second variant. Those groups are still drawn.

Stage paint: `trunk` → `grow` → `unripe*` / `ripe*`.

Fruit icons `fruit-{apple,apricot,olive,cherry}.svg` are 24×24 with one group per Variety of that species.

Tree seed items are `item-seed-{apple,apricot,olive,cherry}.svg`, 24×24, no groups. Each is the fruit **cut in half**, filling the icon like a `fruit-*` face: species skin ring, flesh, and a pit or pips as the focus. Skins are the tell — apple `#c43c3c`, apricot `#d4a017`, olive `#6b4423`, cherry `#8b3a2a` with the long stalk.

Grafts: [[art/items]].

Both: [[art/svg]], [[art/palette]]. Sim: [[architecture/tree]].

Assumption: unused variety slots still get groups so the four-face row can rasterize.
