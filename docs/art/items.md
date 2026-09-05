# Items

`src/assets/items/*.svg`. Rules from [[art/svg]] and [[art/palette]] hold.

## Weed spray

`item-weed-spray.svg` — viewBox `0 0 24 24`. Cottage bag in the language of `item-fertilizer.svg`, with the spray glyph. Not a 30-use can. Liters bag.

Ink silhouette, inner fill, bands, center spray glyph. No pump T. No wand. No ripe volume bars. Coder draws it.

`ui-research-fertilizer.svg` — viewBox `0 0 24 24`. Small synth bag + small spray bag (not a small can). Unlock-fertilizer research face. Coder draws it.

`ui-research-crop-variants.svg` — viewBox `0 0 24 24`. Two quality marks: uncommon `leaf` left, rare `water` right. Crop variants research face. Not heirloom gold.

Assumption: unnamed synth dark is water on the research face.

## Water

`ui-water.svg` — viewBox `0 0 24 24`. Waterdroplet. Recipe still input. Not the tap. Not `overlay-water`.

Ink silhouette, water fill, house highlight. Same droplet language as `overlay-water`, item-slot size. Face `{ kind: 'water' }`. Chrome only.

## Axe

`item-axe.svg` — viewBox `0 0 24 24`. Wood haft, iron head, one-sided blade. Not the pickaxe T.

## Wood

`item-wood.svg` — viewBox `0 0 24 24`. Cut log. Dirt bark, dirt cut face with rings.

## Grafts

`item-graft-{apple,apricot,olive,cherry}.svg` — viewBox `0 0 24 24`. One group per Variety of that species; `item-graft-apple.svg` carries `base` `variant` `heirloom` because every annual routes to it. A cutting: species stick, cut face, buds, a leaf. Not a seed. Not planted.

Apple thick whip. Apricot forked. Olive gnarled, house fleck leaf. Cherry slim, two leaves. Variety is bud fill.

`GRAFT_CUTTING` maps every `CropId` to the cutting it draws. The four tree species name themselves. The eight annuals have no cutting of their own yet and all name `apple`, the plain whip — placeholder art at the correct group count, the way the crop sprites shipped before their redraw. Annual grafts reach the player with the research station, so their eight faces are that update's art.

| species | `base` | `variant` | `heirloom` |
|---|---|---|---|---|
| apple | fruit-red | roof (`kingston-black`) | blush (`pink-lady`) |
| apricot | ripe | ripe + blush (`blenheim`) | blush (`klosterneuburger`) |
| olive | dirt-dark | ripe, more buds (`arbequina`) | — |
| cherry | fruit-red, two buds | — | roof, larger (`bing`) |

## Ash

`item-ash.svg` — viewBox `0 0 24 24`. Pile. House / ink / dirt. Not a sack.
