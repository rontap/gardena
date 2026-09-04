# Tools

`SHOVELS`: `shovel` `better-shovel` `rotary-shovel`. `PICKAXES`: `pickaxe` `better-pickaxe` `diamond-pickaxe`. `AXES.axe`. `CONTAINERS`: `bucket` `large-bucket` — `CONTAINERS.bucket` / `CONTAINERS['large-bucket']`.

Names are `SHOVEL_NAME` / `PICKAXE_NAME`. Do not re-derive a name from the id.

`workSeconds` is baked on the Item at mint. New games / new buys use `SHOVELS.*.workSeconds`. Rotary unchanged.

| id | SKU | unlock |
|---|---|---|
| shovel | buy-shovel | start |
| better-shovel | buy-better-shovel | unlock-better-tools |
| rotary-shovel | — | four-star contract prize |
| pickaxe | buy-pickaxe | unlock-pickaxe |
| better-pickaxe | buy-better-pickaxe | unlock-pickaxe |
| diamond-pickaxe | — | four-star contract prize |
| axe | buy-axe | unlock-pickaxe |

`{ kind: 'axe'; usesLeft; workSeconds }`. No `id`. No better-axe. `AXES.axe` uses / workSeconds — preference. Unlock and show `unlock-pickaxe`. `unlock-pickaxe` effect stays `buy-pickaxe`. Price preference versus `buy-pickaxe`. `skuLabel` **Axe**. Chop: [[mechanics/trees]] `trees.chop`.

Other SKUs: `buy-bucket` `buy-bucket-large` `buy-weed-spray`.

`weed-spray` — `{ kind: 'weed-spray'; liters; capacityLiters }`, `WEED_SPRAY_BAG` 30 L. Bag. Additive store, like fertilizer. Not `usesLeft`. Click tilled: [[mechanics/weeds]] [[items/fertilizer]].

Rotary and diamond are end-game rewards, not sinks. They dig and mine exactly what their tier does — no new sites, no new rules, just uses and speed. Neither has a sku or a research row: one or the other is rolled as the band-3 prize from Whole Cart and Little Lid — [[mechanics/contracts]].

Hand, house, uses, fill, stacks: [[mechanics/inventory]].
