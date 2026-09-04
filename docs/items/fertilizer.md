# Fertilizer

`fertilizer` — `buy-fertilizer`, `FERT_BAG_LITERS`. `synth-fertilizer` — `buy-synth-fertilizer`, `SYNTH_BAG_LITERS`. `compost` from the box, `COMPOST_LITERS`, not a SKU. Ash `{ kind: 'ash'; count }` into the box: `COMPOST_VALUE.ash` × count. Not a SKU. Not a stall good. Compost still counts `COMPOST_NEED` waste. — [[mechanics/inventory]] `inventory.ash`

Shop bags fill the additive store. Not a place ghost. Feed / spike / `bio`: [[mechanics/soil]]. Caps, bags, drink: [[mechanics/inventory]] [[mechanics/_index]].

`weed-spray` is an additive-store bag, not a soil feed. `ADDITIVE_IDS` includes `weed-spray`. `ADDITIVE_BAG.weed-spray = WEED_SPRAY_BAG`. Buy / walk-up / take like fertilizer. Does not `feed` / `spike`. Trailer spray hopper still fertilizer|synth|compost only. — [[items/tools]] [[mechanics/weeds]] [[mechanics/inventory]]
