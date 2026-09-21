# Irrigation

`pipe` `valve` `sprinkler` `sprinkler-vert` `sprinkler-large` `pumpjack` `well` `tap`.

SKUs: `buy-pipe` `buy-valve` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-pumpjack` `buy-well` `buy-tap`.

Starter pump and bought pumpjack are one `SOURCE.pump`. Well is a 1×1 source cell like a tap — [[mechanics/water]]. Grid, tanks, pour, fill: [[mechanics/water]] `water.fill`. Player-facing gather rate is L/day (`rate × DAY_SECONDS`). Gather is not fill. Catalog tap fills `{rate}` L/s from `TAP_RATE`. Pumpjack and well catalog stay gather L/day.

There is one valve. `buy-valve` on a bare owned edge lays the pipe with it and charges both — [[mechanics/water]].

Smart irrigation adds a signal `in` to every vertex sprinkler **and** every valve, plus the crop dial. No new SKU on either side. Unwired sprinkler still pours; unwired valve is still the hand valve. — [[mechanics/sensors]]

Almanac **Water systems**. [[ui/almanac]]
