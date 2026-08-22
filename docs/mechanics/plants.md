# Plants

Crop table is `CROPS`. Tree juvenile / fruit intervals are `TREES`. Do not fork a third table.

`AnnualId` = carrot potato wheat tomato raspberry watermelon olive grape vanilla sugar-cane. `TreeId` = apple apricot lemon cherry. `CropId` = both. `Plant.crop` is `AnnualId` only.

Classes: carrot potato root; wheat sugar-cane grain; else fruit.

Fields: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `sale`, `seed`, `rotSeconds`. Optional `saleMul` per rarity; absent → `RARITY_SALE`. Vanilla only: 1 / 1.25 / 3 / 6 — preference.

Grow days = `days(growSeconds)` — derived, [[mechanics/day]]. Drink L/day = `waterUsePerSec × DAY_SECONDS` — derived.

Packs of 5: `SKUS` `pack-*` for annuals except none for trees. Shop pack rarity is `common` unless the player owns `seed-bank` — [[mechanics/family]]. Carrot / potato / wheat start unlocked. Tomato watermelon grape via [[mechanics/research]] plants. Olive `reveal: unlock-tomato`. Raspberry `reveal: unlock-grape`. Vanilla pack shows after raspberry; buy requires player skill `vanilla-tending`. Sugar cane `unlock-fermentation` on automation. Trees have no pack.

New annuals — preference. Drink L/day derived:

| id | grow s | L/day | wTol | fTol | sale | seed | rot s |
|---|---|---|---|---|---|---|---|
| grape | 300 | 1.2 | 0.62 | 0.58 | 18 | 3 | 220 |
| olive | 360 | 0.80 | 0.72 | 0.50 | 16 | 3 | 540 |
| sugar-cane | 200 | 2.5 | 0.55 | 0.65 | 5 | 1 | 360 |
| vanilla | 480 | 1.4 | 0.42 | 0.38 | 22 | 8 | 600 |

Vanilla common sale 22 < raspberry 26. Rare 66 > 52. Heirloom 132 > 91. Vanilla rot = potato.

Heirloom names `cropVariety`. Heirloom apple is Pink Lady. Grape White grape / Kéknyelű. Olive Kalamata / Arbequina. Vanilla Tahitian / Bourbon. Sugar cane Purple cane / Striped cane. Apricot Moorpark / Blenheim. Lemon Meyer / Lisbon. Cherry Sour cherry / Bing.

## Grass

Lawn, not a crop. No `CropId`, no rarity, no `Plant`, no market value.

Item `{ kind: 'grass-seeds'; count }`. `pack-grass` $1 for `GRASS_PACK` 5, unlock `unlock-landscaping`. Buying merges into one house slot like seeds do.

Sow on `empty` → `{ kind: 'turf'; soil; turf: Turf }`. `Turf` holds `maturity` and a `variant` 0–2 picked by `gen.at(3, col, row)` — [[mechanics/rng]]. Prompt **Sow grass**, pulse **Sow grass**.

Ticks in `tickField` off `live`: drinks `GRASS_WATER_PER_SEC` 0.0012 L/s (0.29 L a day — an order under any crop), matures over `GRASS_GROW` = `DAY_SECONDS / 4` = 60s. No happiness, no fertilizer draw, no water band, no death.

At `maturity >= 1` the plot becomes `{ kind: 'untilled'; ground: 'soft'; cover: { kind: 'grass', variant } }` — the tilled bed and its `Soil` are gone. That is the point of the item: it un-tills land.

Art `crop-grass.svg`, stages `sprout` under 0.5 then `grow`. Face for the seed item is the `grow` stage.

## Stats

`statsOf(crop, rarity, mods)`:

- sale: `CROPS.sale × (CROPS.saleMul?.[rarity] ?? RARITY_SALE[rarity]) × Π saleMul`
- grow: `(CROPS.growSeconds × RARITY_GROW[rarity]) / growSpeed`
- drink: `CROPS.waterUsePerSec × waterUseMul`
- tols: `tolerance(base, rarity) = max(TOL_MIN, base × TOL_RARITY[rarity])`
- rot: `CROPS.rotSeconds × RARITY_ROT[rarity]`

`RARITY_SALE` 1 / 1.25 / 2 / 3.5 — preference. `RARITY_GROW` 1, `1/1.05`, `1/1.1`, 1. `RARITY_ROT` 1, 1, `1/1.1`, `1/1.25`. `TOL_RARITY` 1 / 0.92 / 0.8 / 0.65. `TOL_MIN` 0.25 — preference.

Player-facing top rarity is **Heirloom** (`heirloom`). Names: `cropVariety`.

## Grow

Seed on `empty` → `growing`, same `Soil`. Planting does not change water. `Plant.happiness = HAPPY_START` (0.5 — preference). `Plant.tended` required, starts `false`, same instance through ripe / dead. `bio` starts true; soil non-organic marks the plant.

Stage: maturity `< 0.33` sprout, else grow, then ripe, dead.

While growing: drink water and `PLANT_FERT_PER_SEC` — [[mechanics/soil]]. Bands from soil vs tols.

`STUNT = 0.67` — preference. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT` (0.67²).

Ripe does not drink. Sprinklers skip ripe / dead / rotten.

## Happiness

Live quality. Does not set growth speed (stunt does).

| | seconds 50% → 0 | |
|---|---|---|
| drown | `HAPPY_DROWN_SECONDS` 180 preference | water red and `drowning` |
| wilt | `HAPPY_WILT_SECONDS` 240 preference | water red, dry |
| starve | `HAPPY_STARVE_SECONDS` 400 preference | fert red |
| gain | `HAPPY_GAIN_SECONDS` 900 preference | each green band, only if neither bar is red |

Clamp `0..HAPPY_MAX` (1). Both-red drains starve and water together. Happiness 0 while growing: drown → `rotten`; wilt or starve → `dead`. Same soil.

Ripe does not die of water or fertilizer. It only rots.

## Rarity roll

At ripen: `freshness = 1`. `rarity = rollGrowRarity(rarity, happiness, grow.at(col, row, day, n), extraUp1)`. `n` is `World.ripenN` at that cell, then becomes `n + 1`. Absent 0. Not a `Soil` field. — [[mechanics/rng]]

`extraUp1` is `BETTER_UP1` 0.04 if the player owns `better-{crop}`, else 0. Scaled by `h / HAPPY_MAX` so 4% is at full happiness. UI: “increased chance that a happy plant will produce a superior fruit.” No `better-*` for `TreeId`.

Odds at `h`, `x = h / HAPPY_START`:

| | `h >= HAPPY_START` | `h < HAPPY_START` |
|---|---|---|
| +2 | `0.005 × x` | 0 |
| +1 | `0.05 × x + extraUp1 × (h / HAPPY_MAX)` | `0.05 × x + extraUp1 × (h / HAPPY_MAX)` |
| −1 | 0 | `0.05 × (1 − x)` |

Clamp common / heirloom. Seed from a later shovel uses the rolled rarity.

Wild weights `RARITY_WEIGHT` 0.55 / 0.35 / 0.09 / 0.01 — preference. `rollRarity` for tree fruit drops. No wild berry.

## Freshness

On the plant, while ripe: `freshness -= dt / rotSeconds`. `<= 0` → `{ kind: 'rotten', soil, crop }`. No plant left.

After pick, fruit keeps rotting in hand, house, chest, ground, and box cargo until sold. `tickFreshness`. Hits 0 and stays fruit, worth nothing useful. Sugar does not tick.

`freshMul(f) = f >= 0.8 ? 1 : f / 0.8` — preference at 0.8. Harvest bakes `unitSale = stats.sale` (rarity + skill `saleMul` already in). Sale uses `freshMul` of current freshness — [[mechanics/market]]. Jam floor — [[mechanics/family]].

Merge same crop+rarity: weighted `unitSale` and `freshness`. Different rarity never merges.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. Legal: player owns `tending`, empty hand, growing, `tended === false`. Work `TEND_WORK` 0.7s. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`. Not ripe. Not twice — [[mechanics/family]].

## Harvest / shovel

Ripe annual except sugar-cane, empty hand: one fruit, current freshness, plot `empty` same soil. Fruit box: into the box if it accepts.

Ripe sugar-cane: one `{ kind: 'sugar'; count: 1; unitSale: stats.sale }`. Empty hand, or hand already holding sugar (merge weighted `unitSale`). Not a box cargo. Plot `empty` same soil. Bagged sugar does not rot. Ripe cane on the plot still ticks freshness and can become `rotten`.

Shovel growing or ripe annual: one seed, same soil. Shovel dead or rotten: empty, **no drop**. Compost is from what you already carry.

Grinder: annual fruit except sugar-cane (cane is never fruit). Tree fruit: refuse.

## Trees

Class `Tree`. Cell `kind: 'tree'`. Same instance on a vertical 1×2. Soft untilled only. Drinks nothing. No fertilizer. No `Plant`. Species-only — no sapling rarity, no `better-*`.

`TREES` in `defs/trees.ts`. `TREE_YIELD_DAYS` 2, `TREE_YIELD_MUL` 3, `TREE_OFF_MUL` 0.75 — preference.

| | sale | juvenile s | fruit s | rot s |
|---|---|---|---|---|
| apple | 20 | 480 | 720 | 660 |
| apricot | 9 | 480 | 180 | 340 |
| lemon | 7 | 480 | 200 | 480 |
| cherry | 5 | 480 | 143 | 180 |

`CROPS[tree].waterUsePerSec = 0`. `CROPS.growSeconds` unused for trees. Rot on the dropped fruit uses `CROPS.rotSeconds`.

```
TreeYield = pending | { on; daysLeft: 1 | 2 } | { off; chance }
```

`juvenile` 0..1 once. Then `yield = pending` (no fruit). Fruit timer ticks only while mature and not pending.

Seam, with stipend/tax, before field tick, per tree with `juvenile >= 1`:

1. `pending` → `{ on, daysLeft: 2 }`
2. `on` → `daysLeft -= 1`; if 0 → `{ off, chance: -0.2 }` (no roll)
3. `off` → `chance += 0.2`; `u = tree.at(base.col, base.row, day)`; if `u < chance` → `{ on, daysLeft: 2 }` — [[mechanics/rng]]

Field tick, mature, not pending: `fruit += dt / (fruitSeconds / mul)`. mul is `TREE_YIELD_MUL` while `on`, else `TREE_OFF_MUL`. At `>= 1`: drop `{ kind: 'fruit', crop: species, freshness: 1, bio: true, unitSale: CROPS.sale × RARITY_SALE[rarity] }` on the first in-world `frontOf` cell that is a `Plot` and is not in the footprint. Walk `frontOf(base)` then `frontOf({ col, row: row+1 })`. Existing drops on a plot are allowed. Spot found: `rarity = rollRarity(fruit.next())`, `fruit = 0`, `tally.harvests += 1`. No plot → clamp `fruit = 1`, show ripe, no `next()`. No harvest prompt. — [[mechanics/rng]]

Shovel: `{ kind: 'sapling'; tree: species }`, both cells bare soft.

Plant sapling: hold sapling, `{ act: 'plant' }`. Both cells untilled, `ground === 'soft'`, owned. Cover bare or grass — grass clears to bare. Work same as sowing a seed. Consumes the sapling. New tree `juvenile = 0`, `yield` unused until mature.

Start chunk `(0,0)`: one wild apple, first valid 1×2 soft pair, `juvenile = 0` — invariant 22.

No shrub. No berry.
