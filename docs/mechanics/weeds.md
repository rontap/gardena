# Weeds

Two variants. Take `empty` tilled plots. Cannot plant on a weed.

`Weed = { variant: 0 | 1; maturity; spread }`. `spread` starts `false`.

## Spawn

`BIG_TICK` — preference. Each tick, each `empty` plot: `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks)`. Kind: `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1. — [[mechanics/rng]]

`WEED_CHANCE` — preference.

`Soil.weedChance: number` required. New soil (till, expand) = `WEED_CHANCE`. Copy soil on harvest/death keeps the field.

`ramped(chance, bigTicks)` — linear from **−0.10** at tick 0 to `chance` at `CHANCE_RAMP_TICKS = DAY_SECONDS / BIG_TICK`, then flat. Negative → never sprouts. First weed lands minutes into a fresh day one, not on the first tick. Grass uses the same ramp.

## Recover

Iff `weedChance < WEED_CHANCE`, `weedChance = min(WEED_CHANCE, weedChance + 0.15 × dt / DAY_SECONDS)`. Does not pull outbreak down. Tick every `dt` on every `Soil` that exists (tilled cells).

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

Item `{ kind: 'weed-spray'; usesLeft }`. `WEED_SPRAY_USES` — preference. Illegal: `usesLeft` 0 as held (throw away at 0).

`buy-weed-spray` utility, unlock and show `unlock-fertilizer`. `unlock-fertilizer` effect stays one SKU; spray gates on the research id. — [[mechanics/research]]

Click any tilled plot: `weedChance = −1`, spend 1 use. Instant. Not untilled. Not spray-trailer.

Assumption: spray click is `Intent` `{ act: 'weed-spray'; at }`, `dest` = `at`, work 0.

## Grass

Cosmetic `untilled` cover. Three variants. Not a plant.

One roll per big tick for the world: `ramped(GRASS_CHANCE, bigTicks)`, `GRASS_CHANCE` — preference. Then up to 24 samples. Eligible: untilled, not very-hard, cover bare, no drop. Appears grown.

Empty hand gathers `{ kind: 'grass' }`, cover bare. Shovel tills (or would) with **no grass drop**; tilling removes the cover into `empty` soil. Grass un-tills when sown as turf — [[mechanics/plants]].

## Invariants

`weeds.sprout` — Empty hand gathers weed/grass as items. Each `BIG_TICK`, each `empty` plot sprouts iff `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks)`. Kind: `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1.

`weeds.chance` — `Soil.weedChance: number` required. New soil (till, expand) = `WEED_CHANCE`. Copy soil on harvest/death keeps the field. Spawn: `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks)`. Recover: iff `weedChance < WEED_CHANCE`, `min(WEED_CHANCE, weedChance + 0.15 × dt / DAY_SECONDS)`. Does not pull outbreak down. Tick every `dt` on every `Soil` that exists (tilled cells).

`weeds.outbreak` — Outbreak: when a weed first reaches maturity 1, once. `Weed.spread: boolean`, starts `false`. `+0.05` on 4-adj (cardinals) that are empty tilled. No cap. Skip self / missing / not empty. Then `spread = true`.

`weeds.spray` — Item `{ kind: 'weed-spray'; usesLeft }`. `WEED_SPRAY_USES`. Illegal: `usesLeft` 0 as held (throw away at 0). `buy-weed-spray` utility, unlock and show `unlock-fertilizer`. Click any tilled plot: `weedChance = −1`, spend 1 use. Instant. Not untilled. Not spray-trailer.

`weeds.pull` — Hand pull weed: drop `{ kind: 'weed' }`, `weedChance = 0`. Weed in hand merges up to the stack cap; full is a no-op that says `HAND_FULL` (do not empty-hand). Shovel: no drop, `weedChance = −0.3`.
