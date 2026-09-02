# Weeds

Two variants. Take `empty` tilled plots. Cannot plant on a weed.

`Weed = { variant: 0 | 1; maturity; spread }`. `spread` starts `false`.

## Spawn

`BIG_TICK` — preference. Each tick, each `empty` plot: `mul` 0 → skip; else `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks) * mul`. Kind: `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1. `mul` from current weather — [[mechanics/weather]] [[mechanics/rng]]

`WEED_CHANCE` — preference.

`Soil.weedChance: number` required. New soil (till, expand) = `WEED_CHANCE`. Copy soil on harvest/death keeps the field.

`ramped(chance, bigTicks)` — linear from **−0.10** at tick 0 to `chance` at `CHANCE_RAMP_TICKS = DAY_SECONDS / BIG_TICK`, then flat. Negative → never sprouts. First weed lands minutes into a fresh day one, not on the first tick. Grass uses the same ramp.

## Recover

Iff `weedChance < WEED_CHANCE`, `weedChance = min(WEED_CHANCE, weedChance + 0.15 × dt / DAY_SECONDS)`. Does not pull outbreak down. Tick every `dt` on the recover index (tilled cells with `weedChance < WEED_CHANCE`). Same formula.

## Outbreak

When a weed first reaches maturity 1, once. `Weed.spread: boolean`, starts `false`. `+0.05` on 4-adj (cardinals) that are empty tilled. No cap. Skip self / missing / not empty. Then `spread = true`.

## Drink / grow

`WEED_GROW`, `WEED_WATER_PER_SEC` — preference. Sprout until maturity 0.4, then grow.

`WEED_FERT_PER_SEC` — tuned-to full-plot-in-a-day, then ×0.6 same as plants, then ×0.9.

Same `Soil`. Drinks the whole time.

## Gather vs shovel

Empty hand on a weed: drop `{ kind: 'weed' }`, plot `empty`, same soil, `weedChance = 0`.

Weed in hand: merge up to the stack cap; full is a no-op that says `HAND_FULL` (do not empty-hand) — [[mechanics/inventory]].

Shovel: plot `empty`, same soil, **no drop**, `weedChance = −0.3`. 1 use.

Any other held item cannot gather. Compost takes gathered weeds — [[mechanics/inventory]].

## Spray

Item `{ kind: 'weed-spray'; liters; capacityLiters }`. `WEED_SPRAY_BAG` 30 L — preference (old 30 uses). Illegal: `liters` 0 as held (empty bag leaves the hand). No `usesLeft` field. If a constant remains it is the bag liters.

`buy-weed-spray` utility, unlock and show `unlock-fertilizer`. Additive store, not house. `unlock-fertilizer` effect stays one SKU; spray gates on the research id. — [[mechanics/research]] [[mechanics/inventory]]

Click a tilled plot: need `>= 1` L, spend 1 L, `weedChance = −1`. Instant. Not untilled. Not spray-trailer.

Assumption: bag `WEED_SPRAY_BAG` = 30 L (old 30 uses). Spray click is `Intent` `{ act: 'weed-spray'; at }`, `dest` = `at`, work 0.

## Grass

Cosmetic `untilled` cover. Three variants. Not a plant.

World roll each `BIG_TICK`: `mul` 0 → skip; else `min(1, ramped(GRASS_CHANCE, bigTicks) * ownedCellCount) * mul > grass.at(bigTicks)`. `ownedCellCount = owned.length * CHUNK * CHUNK`. `GRASS_CHANCE` — preference. Keep day-one ramp. `mul` from current weather — [[mechanics/weather]]

If it fires, pick eligible untilled from the grass stream: untilled, not very-hard, cover bare, no drop. Do not sample `bounds()` AABB (unowned holes). At most one tuft. Variant unchanged: `grass.at(col, row, bigTicks)`. Appears grown.

Assumption: keep try-index `i` on the pick rolls; world roll is `at(bigTicks)`.

Empty hand gathers `{ kind: 'grass' }`, cover bare. Shovel tills (or would) with **no grass drop**; tilling removes the cover into `empty` soil. Grass un-tills when sown as turf — [[mechanics/plants]].

## Invariants

`weeds.sprout` — Empty hand gathers weed/grass as items. Each `BIG_TICK`, each `empty` plot: `mul` 0 → skip; else sprouts iff `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks) * mul`. Kind: `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1. `mul` from current weather.

`weeds.chance` — `Soil.weedChance: number` required. New soil (till, expand) = `WEED_CHANCE`. Copy soil on harvest/death keeps the field. Spawn: `mul` 0 → skip; else `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks) * mul`. Recover: iff `weedChance < WEED_CHANCE`, `min(WEED_CHANCE, weedChance + 0.15 × dt / DAY_SECONDS)`. Does not pull outbreak down. Tick every `dt` on the recover index (tilled cells with `weedChance < WEED_CHANCE`). Same formula.

`weeds.outbreak` — Outbreak: when a weed first reaches maturity 1, once. `Weed.spread: boolean`, starts `false`. `+0.05` on 4-adj (cardinals) that are empty tilled. No cap. Skip self / missing / not empty. Then `spread = true`.

`weeds.spray` — Item `{ kind: 'weed-spray'; liters; capacityLiters }`. `WEED_SPRAY_BAG`. Illegal: `liters` 0 as held (empty bag leaves the hand). `buy-weed-spray` utility, unlock and show `unlock-fertilizer`. Additive store. Click a tilled plot: need `>= 1` L, spend 1 L, `weedChance = −1`. Instant. Not untilled. Not spray-trailer.

`weeds.pull` — Hand pull weed: drop `{ kind: 'weed' }`, `weedChance = 0`. Weed in hand merges up to the stack cap; full is a no-op that says `HAND_FULL` (do not empty-hand). Shovel: no drop, `weedChance = −0.3`.

`weeds.grass` — Each `BIG_TICK`, world roll: `mul` 0 → skip; else `min(1, ramped(GRASS_CHANCE, bigTicks) * ownedCellCount) * mul > grass.at(bigTicks)`. `ownedCellCount = owned.length * CHUNK * CHUNK`. Same day-one ramp. `mul` from current weather. If it fires, pick eligible untilled (untilled, not very-hard, cover bare, no drop) via grass stream try-index `i` mapped onto owned cells, not `bounds()` AABB. At most one tuft. Variant `grass.at(col, row, bigTicks)`.
