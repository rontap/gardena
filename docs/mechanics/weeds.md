# Weeds

Two variants. Take `empty` tilled plots. Cannot plant on a weed.

## Spawn

`BIG_TICK = 10` s — preference. Each tick, each `empty` plot: `weed.at(col, row, bigTicks) < ramped(WEED_CHANCE, bigTicks)`. Kind: `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1. — [[mechanics/rng]]

`WEED_CHANCE = 0.035` — preference.

`ramped(chance, bigTicks)` — linear from **−0.10** at tick 0 to `chance` at `CHANCE_RAMP_TICKS = DAY_SECONDS / BIG_TICK`, then flat. Negative → never sprouts. First weed lands minutes into a fresh day one, not on the first tick. Grass uses the same ramp.

## Drink / grow

`WEED_GROW = 60` s — preference. Sprout until maturity 0.4, then grow.

`WEED_WATER_PER_SEC = 0.008` — preference.

`WEED_FERT_PER_SEC = (1 / 240) * 0.6` — tuned-to full-plot-in-a-day, then ×0.6 same as plants.

Same `Soil`. Drinks the whole time.

## Gather vs shovel

Empty hand on a weed: pick up `{ kind: 'weed' }`, plot `empty`, same soil.

Shovel: plot `empty`, same soil, **no drop**. 1 use.

Held item cannot gather. Compost takes gathered weeds — [[mechanics/inventory]].

## Grass

Cosmetic `untilled` cover. Three variants. Not a plant.

One roll per big tick for the world: `ramped(GRASS_CHANCE, bigTicks)`, `GRASS_CHANCE = 0.5` — preference. Then up to 24 samples. Eligible: untilled, not very-hard, cover bare, no drop. Appears grown.

Empty hand gathers `{ kind: 'grass' }`, cover bare. Shovel tills (or would) with **no grass drop**; tilling removes the cover into `empty` soil.
