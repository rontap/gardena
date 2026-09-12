# Tools

`SHOVELS`: `shovel` `better-shovel` `rotary-shovel`. `PICKAXES`: `pickaxe` `better-pickaxe` `diamond-pickaxe`. `AXES.axe` `AXES.chainsaw`. `CONTAINERS`: `bucket` `large-bucket` — `CONTAINERS.bucket` / `CONTAINERS['large-bucket']`.

Names are `SHOVEL_NAME` / `PICKAXE_NAME`. Do not re-derive a name from the id.

`workSeconds` is baked on the Item at mint. New games / new buys use `SHOVELS.*.workSeconds` / `AXES.*.workSeconds`.

| id | SKU | unlock |
|---|---|---|
| shovel | buy-shovel | start |
| better-shovel | buy-better-shovel | unlock-hardened-tools |
| rotary-shovel | — | four-star contract prize |
| pickaxe | buy-pickaxe | unlock-better-tools |
| better-pickaxe | buy-better-pickaxe | unlock-hardened-tools |
| diamond-pickaxe | — | four-star contract prize |
| axe | buy-axe | unlock-better-tools |
| chainsaw | buy-chainsaw | unlock-hardened-tools |

`SHOVELS.shovel.uses` and `buy-shovel` price preference. `SHOVELS['better-shovel'].uses` and `buy-better-shovel` price preference. `{ kind: 'axe'; usesLeft; workSeconds }`. `{ kind: 'chainsaw'; usesLeft; workSeconds }`. No `id`. No better-axe. `AXES.axe` uses 30, workSeconds preference. `AXES.chainsaw` uses 90, workSeconds 3 — preference. `buy-pickaxe` show `start`, buy `unlock-better-tools`. `buy-axe` unlock and show `unlock-better-tools`. `buy-chainsaw` unlock and show `unlock-hardened-tools`, price preference. `buy-better-pickaxe` unlock and show `unlock-hardened-tools`, price preference. `buy-better-shovel` unlock and show `unlock-hardened-tools`. `buy-bucket-large` unlock `unlock-better-tools`, show `start`. `unlock-better-tools` effect `buy-pickaxe`. `unlock-hardened-tools` effect `buy-better-shovel`. `skuLabel` **Axe**. `skuLabel` **Chainsaw**. Chop accepts axe or chainsaw; work is the held item's `workSeconds`. Chop: 1 wood and trunk always, 2 grafts iff `grafting` owned — [[mechanics/trees]] `trees.chop` `graft.axe`.

`{ kind: 'graft'; crop: CropId; variety: VarietyId; quality: number; count: number }`. Not a tool SKU. Not planted. Attaches — [[mechanics/plants]] `graft.attach`. Furnace green rate. Not compost.

Other SKUs: `buy-bucket` `buy-bucket-large` `buy-weed-spray`. Large bucket stays on Gardening tools.

`weed-spray` — `{ kind: 'weed-spray'; liters; capacityLiters }`, `WEED_SPRAY_BAG` 30 L. Bag. Additive store, like fertilizer. Unlock and show `unlock-better-tools`. Not `usesLeft`. Click tilled: [[mechanics/weeds]] [[items/fertilizer]].

Rotary and diamond are end-game rewards, not sinks. They dig and mine exactly what their owned tier does — no new sites, no new rules, just uses and speed. Neither has a sku or a research row: one or the other is rolled as the band-3 prize from Whole Cart and Little Lid — [[mechanics/contracts]].

Burrow loot may mint `better-shovel` / `better-pickaxe` / `axe`. Equal among those three. Then 50% used `usesLeft = floor(max / 2)`, else full. `workSeconds` from `SHOVELS` / `PICKAXES` / `AXES.axe` at mint. Not rotary. Not diamond. Not starter shovel / pickaxe. Not chainsaw. Any shovel id extracts a burrow — [[mechanics/burrow]] `burrow.loot` `burrow.dig`.

Hand, house, uses, fill, stacks: [[mechanics/inventory]]. Treasure: [[mechanics/burrow]] `burrow.open`.
