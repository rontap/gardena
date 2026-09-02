# Plants

Crop table is `CROPS`. Tree juvenile / fruit intervals are `TREES`.

`AnnualId`, `TreeId`, `CropId` — `sim/ids.ts`. `Plant.crop` is `AnnualId` only.

Classes: carrot potato root; wheat sugar-cane grain; else fruit.

Fields on `CROPS`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `sale`, `seed`, `rotSeconds`. Optional `saleMul` per rarity; absent → `RARITY_SALE`. Vanilla `saleMul` — preference, not `RARITY_SALE`.

Grow days = `days(growSeconds)` — derived, [[mechanics/day]]. Drink L/day = `waterUsePerSec × DAY_SECONDS` — derived.

Packs of 5: `SKUS` `pack-*` for annuals that have a pack. `packSku(crop)` in `sim/ids.ts`. Shop pack rarity is `common` unless the player owns `seed-bank` — [[mechanics/family]]. Carrot / potato / wheat start unlocked. Tomato watermelon grape via [[mechanics/research]] plants. Raspberry `reveal: unlock-grape`. Sugar cane `unlock-fermentation`; ripe cane is fruit; mill for sugar — [[mechanics/machines]]. Trees have no pack.

Vanilla has no pack and no research row. Seeds are a contract prize — [[mechanics/contracts]]. Tree seeds likewise: the three starting seeds and the one wild apple are the only ones not won from a contract.

Heirloom names `cropVariety`.

## Grass

Lawn, not a crop. No `CropId`, no rarity, no `Plant`, no market value.

Item `{ kind: 'grass-seeds'; count }`. `pack-grass` unlock `unlock-landscaping`. Buying merges into one house slot like seeds do.

Sow on `empty` → `{ kind: 'turf'; soil; turf: Turf }`. `Turf` holds `maturity` and a `variant` 0–2 picked by `gen.at(3, col, row)` — [[mechanics/rng]]. Prompt **Sow grass**.

Ticks in `tickField` off grow: drinks `GRASS_WATER_PER_SEC`, matures over `GRASS_GROW = DAY_SECONDS / 4`. No happiness, no fertilizer draw, no water band, no death. — [[architecture/tick]]

At `maturity >= 1` the plot becomes `{ kind: 'untilled'; ground: 'soft'; cover: { kind: 'grass', variant } }` — the tilled bed and its `Soil` are gone. That is the point of the item: it un-tills land.

## Stats

`statsOf(crop, rarity, mods)`:

- sale: `CROPS.sale × (CROPS.saleMul?.[rarity] ?? RARITY_SALE[rarity]) × Π saleMul`
- grow: `(CROPS.growSeconds × RARITY_GROW[rarity]) / growSpeed`
- drink: `CROPS.waterUsePerSec × waterUseMul`
- tols: `tolerance(base, rarity) = max(TOL_MIN, base × TOL_RARITY[rarity])`
- rot: `CROPS.rotSeconds × RARITY_ROT[rarity]`

`RARITY_*`, `TOL_*` — preference. Player-facing top rarity is **Heirloom** (`heirloom`). Names: `cropVariety`.

## Grow

Seed on `empty` → `growing`, same `Soil`. Planting does not change water. `Plant.happiness = HAPPY_START` — preference. `Plant.tended` required, starts `false`, same instance through ripe / dead. `bio` starts true; soil non-organic marks the plant.

Stage: maturity `< 0.33` sprout, else grow, then ripe, dead.

While growing: drink water and `PLANT_FERT_PER_SEC` — [[mechanics/soil]]. Bands from soil vs tols.

`STUNT` — preference. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`.

Ripe does not drink. Sprinklers skip ripe / dead / rotten.

## Happiness

Live quality. Does not set growth speed (stunt does).

| | |
|---|---|
| drown | `HAPPY_DROWN_SECONDS` | water red and `drowning` |
| wilt | `HAPPY_WILT_SECONDS` | water red, dry |
| starve | `HAPPY_STARVE_SECONDS` | fert red |
| gain | `HAPPY_GAIN_SECONDS` | each green band, only if neither bar is red |

Seconds 50% → 0. Preference.

Clamp `0..HAPPY_MAX`. Both-red drains starve and water together. Happiness 0 while growing: drown → `rotten`; wilt or starve → `dead`. Same soil.

Ripe does not die of water or fertilizer. It only rots.

## Rarity roll

At ripen: `freshness = 1`. `rarity = rollGrowRarity(rarity, happiness, grow.at(col, row, day, n), extraUp1)`. `n` is `World.ripenN` at that cell, then becomes `n + 1`. Absent 0. Not a `Soil` field. — [[mechanics/rng]]

`extraUp1` is `BETTER_UP1` if the player owns `better-{crop}`, else 0. Scaled by `h / HAPPY_MAX`. No `better-*` for `TreeId`.

Odds at `h`, `x = h / HAPPY_START`:

| | `h >= HAPPY_START` | `h < HAPPY_START` |
|---|---|---|
| +2 | `0.005 × x` | 0 |
| +1 | `0.05 × x + extraUp1 × (h / HAPPY_MAX)` | `0.05 × x + extraUp1 × (h / HAPPY_MAX)` |
| −1 | 0 | `0.05 × (1 − x)` |

Clamp common / heirloom. Seed from a later shovel uses the rolled rarity.

Wild weights `RARITY_WEIGHT` — preference. `rollRarity` for tree fruit drops.

## Freshness

On the plant, while ripe: `freshness -= dt / rotSeconds`. `<= 0` → `{ kind: 'rotten', soil, crop }`.

After pick, fruit keeps rotting in hand, house, chest, and ground until sold. `tickFreshness`. Freezer slots skip. Hits 0 and stays fruit. Sugar does not tick.

`freshMul(f) = f >= 0.8 ? 1 : f / 0.8` — preference at 0.8. Harvest bakes `unitSale = stats.sale`. Sale uses `freshMul` of current freshness — [[mechanics/market]]. Jam floor — [[mechanics/family]].

Merge same crop+rarity: weighted `unitSale` and `freshness`. Different rarity never merges.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. Legal: player owns `tending`, empty hand, growing, `tended === false`. Work `TEND_WORK`. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`. Not ripe. Not twice — [[mechanics/family]].

## Harvest / shovel

Ripe annual including sugar-cane, empty hand: one fruit, current freshness, plot `empty` same soil. Same crop+rarity in hand: merged onto that stack up to the cap — [[mechanics/inventory]].

Shovel growing or ripe annual: one seed, same soil. Shovel dead or rotten: empty, no drop. Compost is from what you already carry.

Harvest boom (driven tractor, hitch harvest, steer 0, speed > 0): ripe same as empty-hand; growing `< 0.2` one seed; growing `> 0.8` fruit (plant rarity, no ripen roll, freshness = maturity); growing mid destroyed; dead/rotten/weed items. Skip trees and turf. Cap / no slot: plant stays. — [[mechanics/vehicles]]

Grinder: annual fruit including sugar-cane. Tree fruit and sugar: refuse. Cane fruit mills to sugar — [[mechanics/machines]].

## Trees

Class `Tree`. Cell `kind: 'tree'`. Same instance on a vertical 1×2. Soft untilled only. Drinks nothing. No fertilizer. No `Plant`. Species-only. Yield, drop, ping: [[mechanics/trees]].

Plant tree seed: hold a tree seed, `{ act: 'plant' }`. The clicked cell is the **foot**; the pair is it and the cell **above**. Both untilled, `ground === 'soft'`, owned. Cover bare or grass — grass clears to bare. Consumes the seed. New tree `juvenile = 0`, `base` at the upper cell.

Shovel: `{ kind: 'tree-seed'; tree: species }`, both cells bare soft.

## Invariants

`plants.drink` — Growing drinks `waterUsePerSec` and `PLANT_FERT_PER_SEC`. Ripe does not drink. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`.

`plants.happy` — Happiness starts `HAPPY_START`. Drown drain `HAPPY_DROWN_SECONDS`. Wilt `HAPPY_WILT_SECONDS`. Starve `HAPPY_STARVE_SECONDS`. Happiness 0 while growing: drown → `rotten`; wilt/starve → `dead`. Ripe does not die of water or fertilizer.

`plants.ripen` — Ripen: `freshness = 1`, `rarity = rollGrowRarity(rarity, happiness, grow.at(col, row, day, n), extraUp1)`, then `ripenN` at that cell becomes `n + 1`. Absent `n` is 0. `extraUp1` is `BETTER_UP1` if player owns `better-{crop}`, else 0; scaled by `h / HAPPY_MAX`. Ripe `freshness -= dt / rotSeconds`; `<= 0` → `rotten`.

`plants.fresh` — Picked fruit keeps ticking freshness (hand, house, chest, ground) until sold. Freezer slots skip `tickFreshness`. `freshMul(f) = f >= 0.8 ? 1 : f / 0.8`, then jam floor if daughter owns `jam`.

`plants.harvest` — Empty-hand harvest of ripe annual including sugar-cane: one fruit, current freshness, `unitSale = stats.sale`, plot `empty` same soil. Same crop+rarity in hand: merged up to the stack cap. Shovel growing/ripe annual: one seed. Shovel dead, rotten, weed, or grass: no drop.

`plants.packs` — Crop stats are `CROPS`. Shop packs are common unless player owns `seed-bank`: per rank `SEED_BANK_CHANCE`. Base 0. No tree pack.

`plants.tend` — Tend once: player owns `tending`, empty hand, growing, `tended === false`. Not ripe. Then `tended = true`.

`plants.vanilla` — Vanilla `statsOf` sale uses vanilla `saleMul`, not `RARITY_SALE`. Common vanilla sale < raspberry.

`plants.annual` — `Plant.crop` is `AnnualId`. Tree seed on a tilled plot is a no-op.

`plants.tree-foot` — Planting a tree seed at `at` puts the tree's foot on `at` and its `base` on `{ col: at.col, row: at.row - 1 }`. `at.row + 1` is untouched.

`plants.kinds` — No `'berry'` stall key. No `Shrub`. No `{ kind: 'berry' }` `{ kind: 'shrub' }`.
