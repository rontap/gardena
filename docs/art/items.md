# Items

`src/assets/items/*.svg`. Rules from [[art/svg]] and [[art/palette]] hold. Tile viewBox [[art/svg]].

## Weed spray

`item-weed-spray.svg` — Cottage bag in the language of `item-fertilizer.svg`, with the spray glyph. Not a 30-use can. Liters bag.

Ink silhouette, inner fill, bands, center spray glyph. No pump T. No wand. No ripe volume bars. Coder draws it.

`ui-research-fertilizer.svg` — Small synth bag + small spray bag (not a small can). Unlock-fertilizer research face. Synth dark is `water`. Coder draws it.

`ui-research-crop-variants.svg` — Two quality marks: uncommon `leaf` left, rare `water` right. Crop variants research face. Not heirloom gold.

## Water

`ui-water.svg` — Waterdroplet. Recipe still input. Not the tap. Not `overlay-water`.

Ink silhouette, water fill, house highlight. Same droplet language as `overlay-water`, item-slot size. Face `{ kind: 'water' }`. Chrome only.

## Infusion

Faces: [[art/machines]]. `overlay-infused.svg` flush top-right, not `ui-quality`. `item-infuser.svg` same machine as `prop-infuser`, groups `off` `on`.

## Axe

`item-axe.svg` — Wood haft, iron head, one-sided blade. Not the pickaxe T.

## Chainsaw

`item-chainsaw.svg` — Wood haft, iron housing, iron bar, oil chain. Not the axe blade. Not a pickaxe T. Not `skill-machinery`.

## Wood

`item-wood.svg` — Cut log. Dirt bark, dirt cut face with rings.

## Grafts

`item-graft-{apple,apricot,olive,cherry}.svg` — One group per Variety of that species; `item-graft-apple.svg` carries `base` `variant` `heirloom` because every annual routes to it. A cutting: species stick, cut face, buds, a leaf. Not a seed. Not planted.

Apple thick whip. Apricot forked. Olive gnarled, house fleck leaf. Cherry slim, two leaves. Variety is bud fill.

`GRAFT_CUTTING` maps every `CropId` to the cutting it draws. The four tree species name themselves. The eight annuals have no cutting of their own yet and all name `apple`, the plain whip — placeholder art at the correct group count. Annual grafts reach the player with the research station.

| species | `base` | `variant` | `heirloom` |
|---|---|---|---|
| apple | fruit-red | roof (`kingston-black`) | blush (`pink-lady`) |
| apricot | ripe | ripe + blush (`blenheim`) | blush (`klosterneuburger`) |
| olive | dirt-dark | ripe, more buds (`arbequina`) | — |
| cherry | fruit-red, two buds | — | roof, larger (`bing`) |

## Ash

`item-ash.svg` — Pile. House / ink / dirt. Not a sack.

## Treasure

`item-treasure.svg` — Small chest, ripe metal, ink, `house` glint. Domed lid, vertical straps, lock on the body, feet. HUD / drop face. Atlas `treasure`. Not Coin. Not money. Not `item-chest`.
