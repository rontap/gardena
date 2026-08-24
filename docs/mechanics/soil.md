# Soil

Water and fertilizer belong to the dirt. One `Soil` per tilled plot, carried through plant, ripe, harvest, death, rot, and weed.

`untilled` and `infertile` hold no soil. Mining very-hard → `infertile`, still no soil.

Only tilling fresh ground, or clearing a deleted building, mints a new `Soil`.

```
Soil = { water: number; fertilizer: number; bio: boolean; weedChance: number }
```

`weedChance` required. New soil (till, expand) = `WEED_CHANCE`. Copy soil on harvest/death keeps the field. Recover / outbreak / spray: [[mechanics/weeds]].

## Water

| id | | |
|---|---|---|
| `SOIL_WATER_MAX` | 2 L | preference |
| `SOIL_WATER_MID` | 1 L | preference. Plants want this. Drown above it. |
| `SOIL_TILL_WATER` | 0.75 L | preference. Tilled start. |

Clamp `0..SOIL_WATER_MAX`. `drowning` iff `water > SOIL_WATER_MID`.

## Fertilizer

`FERT_PLOT_MAX = 1` — preference.

Growing draw `PLANT_FERT_PER_SEC = (1 / 720) * 0.6 * 0.9` — tuned-to 3-day empty, then ×0.6, then ×0.9. Full plot empties in `1 / PLANT_FERT_PER_SEC / DAY_SECONDS` days (derived).

Bag / compost `feed`. Synthetic `spike` (`bio = false`). `bio` restores when one `feed` lands `>= BIO_RESTORE` (0.3 — preference). Produce copies soil `bio` while growing.

Tops a plot to full, spends only the gap. Empty bag leaves the hand.

Ordinary bag always in shop. Synthetic is [[mechanics/research]] `unlock-fertilizer`. Weed spray gates on the same research id — [[mechanics/weeds]].

## Goodness / ground

`goodness(seed, col, row)` in `[0,1]`. Same field sets till fertilizer and ground kind.

| | |
|---|---|
| `goodness < VERY_HARD_MAX` (0.20 preference) | very-hard |
| `goodness < HARD_MAX` (0.34 preference) | hard |
| else | soft |

Hard dirt is poor dirt. That is the difference.

Base boost centred on the door, exponential decay (`BOOST_FALLOFF = 8` — preference), normalised to reach 0 at `r = 16` — preference. No boost edge to read as a ring. `clearBase` forces soft cover inside `r = 8`; it does not rewrite goodness, so start can be soft but mediocre.

## Till

Shovel untilled → `empty`, `water = SOIL_TILL_WATER`, `fertilizer = goodness(...)`, `weedChance = WEED_CHANCE`.

Soft: 1 use, `workSeconds`. Hard: 2 uses, 2× `workSeconds`. Very-hard: shovel no-op; pickaxe → `infertile`.

## Bands

Inspect bars: green / orange / red. `tol` is the plant’s water or fert tolerance.

Water, `d = |water − SOIL_WATER_MID|`: green `d <= tol`; red `d >= (SOIL_WATER_MID + tol) / 2`; else orange. Red at both dry and drowned.

Fert, `floor = FERT_PLOT_MAX − tol`: green `fertilizer >= floor`; red `fertilizer <= floor / 2`; else orange.

Tiles (`paved` / `brick` / `cobble`) are `untilled` cover. Cosmetic. Keep `ground`. [[mechanics/inventory]].
