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

`item-graft-{apple,apricot,olive,cherry}.svg` — viewBox `0 0 24 24`. Groups `base` `variant` `variant-2` `heirloom`. A cutting: species stick, cut face, buds, a leaf. Not a seed. Not planted.

Apple thick whip. Apricot forked. Olive gnarled, house fleck leaf. Cherry slim, two leaves. Variety is bud fill.

`GRAFT_CUTTING` maps every `CropId` to the cutting it draws. The four tree species name themselves. The eight annuals have no cutting of their own yet and all name `apple`, the plain whip — placeholder art at the correct group count, the way the crop sprites shipped before their redraw. Annual grafts reach the player with the research station, so their eight faces are that update's art.

| species | `base` | `variant` | `variant-2` | `heirloom` |
|---|---|---|---|---|
| apple | fruit-red | roof (`kingston-black`) | ripe | blush (`pink-lady`) |
| apricot | ripe | ripe, larger buds (`moorpark`) | blush (`klosterneuburger`) | ripe + blush (`blenheim`) |
| olive | dirt-dark | grape (`kalamata`) | ripe, more buds (`arbequina`) | house |
| cherry | fruit-red, two buds | fruit-red, four buds (`montmorency`) | ripe | roof, larger (`bing`) |

## Ash

`item-ash.svg` — viewBox `0 0 24 24`. Pile. House / ink / dirt. Not a sack.
