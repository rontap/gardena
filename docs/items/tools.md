# Tools

`SHOVELS`: `shovel` `better-shovel` `rotary-shovel`. `PICKAXES`: `pickaxe` `better-pickaxe` `diamond-pickaxe`. `CONTAINERS`: `bucket` `large-bucket` — `CONTAINERS.bucket` / `CONTAINERS['large-bucket']`. Boxes: `box` `BOX_SMALL`, `box-large` `BOX_LARGE`. Cargo empty | seeds | fruit | weed.

Names are `SHOVEL_NAME` / `PICKAXE_NAME`. Do not re-derive a name from the id.

| id | uses | s per swing | SKU | $ | unlock |
|---|---|---|---|---|---|
| shovel | 80 | 1.2 | buy-shovel | 10 | start |
| better-shovel | 200 | 0.6 | buy-better-shovel | 30 | unlock-better-tools |
| rotary-shovel | 1000 | 0.2 | buy-rotary-shovel | 1000 | unlock-rotary-shovel |
| pickaxe | 25 | 4 | buy-pickaxe | 18 | unlock-pickaxe |
| better-pickaxe | 40 | 2 | buy-better-pickaxe | 24 | unlock-pickaxe |
| diamond-pickaxe | 1000 | 0.4 | buy-diamond-pickaxe | 1000 | unlock-diamond-pickaxe |

Other SKUs: `buy-bucket` `buy-bucket-large` `buy-box` `buy-box-large` `buy-weed-spray`.

`weed-spray` — `{ kind: 'weed-spray'; usesLeft }`, `WEED_SPRAY_USES`. Hand tool. House, not additive store. Not a bag. Not liters. Click tilled: [[mechanics/weeds]].

Rotary and diamond are end-game sinks. They dig and mine exactly what their tier does — no new sites, no new rules, just uses and speed. Their research is stat-gated — [[mechanics/research]].

Hand, house, uses, fill, box weed: [[mechanics/inventory]].
