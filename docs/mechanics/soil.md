# Soil

Water and fertilizer belong to the dirt. One `Soil` per tilled plot, carried through plant, ripe, harvest, death, rot, and weed. One `Soil` on each `Tree` instance, shared by both cells of the untilled 1×2 — [[mechanics/trees]].

`untilled` and `infertile` hold no soil. Mining very-hard → `infertile`, still no soil. Cell `kind: 'tree'` is not a tilled plot; the soil lives on `Tree.soil`.

Only tilling fresh ground, or clearing a deleted building, mints a tilled `Soil`. Planting a tree and the wild apple mint a tree `Soil`.

`Soil = { water; fertilizer; weedChance }` plus that instance's water max, water mid, fertilizer max. `weedChance` required. New tilled soil (till, expand) = `WEED_CHANCE`. Tree soil `weedChance` = `WEED_CHANCE` and unused; weeds still only `empty`. Copy soil on harvest/death keeps the field. Chop keeps `Tree.soil`. Dig destroys it. Recover / outbreak / spray: [[mechanics/weeds]].

## Water

`SOIL_WATER_MAX` 2, `SOIL_WATER_MID` 1, `SOIL_TILL_WATER` — preference. Plants want mid. Drown above it. Tilled start is `SOIL_TILL_WATER`.

Tree: `TREE_WATER_MAX` 10 L, `TREE_WATER_MID` 5 L — preference. Mint water `TREE_WATER_MID` — [[mechanics/trees]].

Clamp `0..` that instance's water max. `drowning` iff `water >` that instance's mid.

## Fertilizer

`FERT_PLOT_MAX` 1 — preference. Tree: `TREE_FERT_MAX` 2 L — preference.

Growing annual draw `PLANT_FERT_PER_SEC × CROPS.fertUseMul`. `1` is carrot. potato wheat tomato, chilli, vanilla, raspberry grape, sugar-cane `fertUseMul` — preference on `CROPS`. `PLANT_FERT_PER_SEC` — preference. Full plot at mul 1 empties in `1 / PLANT_FERT_PER_SEC / DAY_SECONDS` days (derived). Tree Fertilizer litre draw: [[mechanics/trees]] `trees.drink`. One owner on `CROPS`.

Bag and compost `feed`. Compost is a bag that feeds like fertilizer. Tops a tilled plot to `FERT_PLOT_MAX`, a tree (either cell) to `TREE_FERT_MAX`, spends only the gap. Empty bag leaves the hand.

Ordinary bag always at the Additive store. Weed spray gates on `unlock-better-tools` — [[mechanics/weeds]].

## Goodness / ground

`goodness(seed, col, row)` in `[0,1]`. Same field sets till fertilizer and ground kind.

| | |
|---|---|
| `goodness < VERY_HARD_MAX` | very-hard |
| `goodness < HARD_MAX` | hard |
| else | soft |

`VERY_HARD_MAX`, `HARD_MAX` — preference. Hard dirt is poor dirt. That is the difference.

Base boost centred on the door, exponential decay (`BOOST_FALLOFF` — preference), normalised to reach 0 at `r = 16` — preference. `clearBase` forces soft cover inside `r = 8`; it does not rewrite goodness, so start can be soft but mediocre.

## Hardness

An `untilled` plot carries `hardness` in `[0,1]` beside `ground`. `hardnessOf(g)` is `1 - g` — derived. The tier gates what a tool may do and which art paints; hardness sets how long it takes.

Both fields are written together and never disagree: `groundOf(1 - hardness) === ground`. Generation writes `bare(groundOf(g), hardnessOf(g))`. Clearing a rock, felling a tree, `clearBase`, and grass rooting write the soft baseline `0` — a cell you cleared is workable ground, whatever the noise underneath says.

Stored, not read live. A cell cleared of a rock digs like the grass it now paints; reading `goodness` at dig time would make it dig like the stone it used to be.

Save carries it. Fields added, no migrate — [[architecture/save]].

## Till

Shovel untilled → `empty`, `water = SOIL_TILL_WATER`, `fertilizer = goodness(...)`, `weedChance = WEED_CHANCE`.

Time is `workSeconds × (1 + DIG_HARD_SPAN × hardness)` — no step. `DIG_HARD_SPAN` — preference, set so the hard/very-hard boundary still costs about the 2× the tier step used to, and the softest ground costs 1×.

Uses are still a step: soft 1, hard 2. A use cannot be fractional.

Very-hard: shovel no-op; pickaxe → `infertile`.

Burrow is untilled cover, not a till. Shovel extract does not till, does not use hardness, 1 use — [[mechanics/burrow]] `burrow.dig`. Pickaxe on a burrow is a no-op. Cover → bare, same `ground` / `hardness`. A second shovel then tills.

## Bands

Inspect bars: green / orange / red. `tol` is the plant’s or tree’s water or fert tolerance.

`waterBand(water, tol, mid)`: `d = |water − mid|`; green `d <= tol`; red `d >= (mid + tol) / 2`; else orange. Red at both dry and drowned. Tilled passes `SOIL_WATER_MID`. Tree passes `TREE_WATER_MID`.

`fertBand(fertilizer, tol, max)`: `floor = max − tol`; green `fertilizer >= floor`; red `fertilizer <= floor / 2`; else orange. Tilled passes `FERT_PLOT_MAX`. Tree passes `TREE_FERT_MAX`.

Paving (`asphalt` / `cobble` / `brick` / `paved`) is `World.paving`, a layer beside the cell, not a cover on it. Cosmetic. Keeps `ground`. [[items/tiles]] [[mechanics/inventory]].

## Invariants

`soil.till` — Tilling untilled yields `empty` with `water === SOIL_TILL_WATER`, `fertilizer === goodness(rng, col, row)`, and `weedChance === WEED_CHANCE`.

`soil.instance` — Planting, harvest, death, rot, and weeding keep the same `Soil` instance. Water clamp `0..` that instance's water max. `drowning` iff `water >` that instance's mid. Feed clamp that instance's fertilizer max.

`soil.tree` — Trees stay untilled 1×2; one `Soil` on the `Tree` instance, shared by both cells; water max 10 L, mid 5 L, Fertilizer max 2 L; tilled stays water max 2, mid 1, Fertilizer max 1; clamps and `drowning` use that instance's max/mid.

`soil.goodness` — `goodness < VERY_HARD_MAX` → very-hard; `< HARD_MAX` → hard; else soft. Hard dirt is poor dirt.

`soil.hardness` — Untilled carries a continuous `hardness` alongside its tier, and the two never disagree: `groundOf(1 - hardness) === ground`. Generation writes `1 - goodness`. Clearing a rock or a tree writes the soft baseline 0.

`soil.dig` — Shovel time is `workSeconds × (1 + DIG_HARD_SPAN × hardness)`. No step at a tier boundary: two cells either side of `HARD_MAX` differ by the noise, not by the tier. Uses stay 1 soft / 2 hard.
