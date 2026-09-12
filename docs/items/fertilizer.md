# Fertilizer

`fertilizer` — `buy-fertilizer`, `FERT_BAG_LITERS`. `compost` from the box, `COMPOST_LITERS`, not a SKU. Compost is a bag that feeds like fertilizer. Ash `{ kind: 'ash'; count }` into the box: `COMPOST_VALUE.ash` × count. Not a SKU. Not a stall good. Compost still counts `COMPOST_NEED` waste. — [[mechanics/inventory]] `inventory.ash`

Bags are bought at the Additive store and fill its tanks. Not a place ghost. Not on a Build shelf — [[ui/store]] [[ui/build]]. Feed: [[mechanics/soil]]. Caps, bags, drink: [[mechanics/inventory]] [[mechanics/_index]].

`weed-spray` is an additive-store bag, not a soil feed. `ADDITIVE_IDS` includes `weed-spray`. `ADDITIVE_BAG.weed-spray = WEED_SPRAY_BAG`. Buy / walk-up / take like fertilizer. Does not `feed`. Trailer spray hopper fertilizer|compost only. — [[items/tools]] [[mechanics/weeds]] [[mechanics/inventory]]
