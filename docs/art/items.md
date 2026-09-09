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

## Infusion

`overlay-infused.svg` — viewBox `0 0 24 24`. Small + mark, ink + ripe, house glint, flush top-right border (`x=19`–`24`, `y=0`–`5`). Draw-over. Not centered. Not `ui-quality`.

`ui-research-infusion.svg` — viewBox `0 0 24 24`. Hollow flask, roof cap, fruit-red liquid `fill-opacity`, ripe + mark right. Infusion research face.

`item-chilli-flakes.svg` — viewBox `0 0 24 24`. Corked glass jar, dirt cork, ink rim, house glint, fruit-red flakes visible through empty glass. Not a jam jar. Not a dish.

`item-vanilla-extract.svg` — viewBox `0 0 24 24`. Tall thin dropper vial, house bulb, house label, roof crimson fill to the neck, fruit-red left edge. Not oil. Not grass extract. Not a gold cap.

`item-bread.svg` — viewBox `0 0 24 24`. Loaf, ripe crust, house crumb in the split. Not the flour sack.

`item-infuser.svg` — viewBox `0 0 24 24`. Same machine as `prop-infuser`, card/hand; groups `off` `on`. [[art/machines]]

## Axe

`item-axe.svg` — viewBox `0 0 24 24`. Wood haft, iron head, one-sided blade. Not the pickaxe T.

## Chainsaw

`item-chainsaw.svg` — viewBox `0 0 24 24`. Wood haft, iron housing, iron bar, oil chain. Not the axe blade. Not a pickaxe T. Not `skill-machinery`.

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

## Treasure

`item-treasure.svg` — viewBox `0 0 24 24`. Small chest, ripe metal, ink, `house` glint. Domed lid, vertical straps, lock on the body, feet. HUD / drop face. Atlas `treasure`. Not Coin. Not money. Not `item-chest`.
