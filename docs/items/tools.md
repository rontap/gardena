# Tools

`SHOVELS`: `shovel` `better-shovel` `rotary-shovel`. `PICKAXES`: `pickaxe` `better-pickaxe` `diamond-pickaxe`. `CONTAINERS`: `bucket` `large-bucket` — `CONTAINERS.bucket` / `CONTAINERS['large-bucket']`. Boxes: `box` `BOX_SMALL`, `box-large` `BOX_LARGE`. Cargo empty | seeds | fruit | weed.

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

Other SKUs: `buy-bucket` `buy-bucket-large` `buy-box` `buy-box-large` `buy-weed-spray`.

`weed-spray` — `{ kind: 'weed-spray'; usesLeft }`, `WEED_SPRAY_USES`. Hand tool. House, not additive store. Not a bag. Not liters. Click tilled: [[mechanics/weeds]].

Rotary and diamond are end-game rewards, not sinks. They dig and mine exactly what their tier does — no new sites, no new rules, just uses and speed. Neither has a sku or a research row: one or the other is rolled as the band-3 prize from Whole Cart and Little Lid — [[mechanics/contracts]].

Hand, house, uses, fill, box weed: [[mechanics/inventory]].
