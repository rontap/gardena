# Irrigation

`pipe` `valve` `sprinkler` `sprinkler-vert` `sprinkler-large` `pumpjack` `well` `rain-tank` `tap`.

SKUs: `buy-pipe` `buy-valve` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-pumpjack` `buy-well` `buy-rain-tank` `buy-tap`.

Starter pump is `SOURCE.pump`. Well is a 1×1 source cell like a tap — [[mechanics/water]]. Grid, tanks, pour: [[mechanics/water]].

There is one valve. `buy-valve` on a bare owned edge lays the pipe with it and charges both — [[mechanics/water]].

Smart irrigation adds a signal `in` to every vertex sprinkler **and** every valve, plus the crop dial. No new SKU on either side. Unwired sprinkler still pours; unwired valve is still the hand valve. — [[mechanics/sensors]]

Almanac **Water systems**. [[ui/almanac]]
