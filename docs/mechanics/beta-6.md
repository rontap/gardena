# Beta-6 mechanics

Supersedes [[mechanics/beta-5]] where this file names a replacement. Types: [[architecture/beta-6]]. Chrome: [[ui/beta-6]]. Art: [[art/beta-6]].

Beta-5 world, pipes, pumps, research stay except below.

`DAY_SECONDS = 240`. `SPRINKLER_RATE = 0.5`. `Clock.t` is the only time store.

Forbidden: fertilizer / soil; deleting house, starter, rock; pipe as an inventory item / stacks; per-edge flow, pressure, or pipe capacity; storing unused water; changing starter or pumpjack output/footprint.

## Day phase

`DAY_SECONDS = 240`. `Clock.t` is the only store. `Clock.phase()` as [[architecture/beta-6]]. No `phase` field. `'night'` is not a `DayPhase`.

| phase | share | t range |
|---|---|---|
| sunrise | 0.25 | [0, 60) |
| day | 0.40 | [60, 156) |
| sunset | 0.25 | [156, 216) |
| twilight | 0.10 | [216, 240) |

`t >= 240` → seam recap (night). Not a phase.

HUD: day N + phase icon. No seconds ticker. `remaining` stays for tests. HUD does not read it.

Invariant: at `t=0` sunrise; `t=60` day; `t=156` sunset; `t=216` twilight.

## days()

```
days(s) = s / 240
```

Almanac grow raw: `days(growSeconds)`. Label **Grow time**. Unit **days**. Display: drop trailing zeros. Lock: `Number(days(s).toFixed(2))` + ` days`.

Common display uses `def.growSeconds` (already +15%). Rarity tabs multiply via `RARITY_GROW`.

Shrub/berry grow: `SHRUB_GROW = 360` → **1.5 days**.

Storage stays `growSeconds`. Drink raw stays `L/day`. Meter still ranks on stored `growSeconds`.

Rename almanac **Seed worth** → **Seed price**.

## Economy

Common grow is +15% vs the prior table. Seed baseline stays; seed display = `seed * RARITY_SALE[rarity]` (same ratio as fruit vs common). Wilt (`thirst < WITHER`): drink ×0.5, no growth.

| crop | growSeconds | waterUsePerSec | sale | seed | rotSeconds | pack $ |
|---|---|---|---|---|---|---|
| carrot | 103.5 | 0.004889 | 4 | 1 | 480 | 3 |
| potato | 184 | 0.00375 | 8 | 2 | 480 | 6 |
| wheat | 276 | 0.003333 | 14 | 2 | 480 | 10 |
| tomato | 345 | 0.003111 | 18 | 3 | 300 | 15 |
| watermelon | 345 | 0.013333 | 19 | 4 | 360 | 18 |
| raspberry | 414 | 0.003333 | 24 | 4 | 158.4 | 22 |

`stats.growSeconds = def.growSeconds * RARITY_GROW[rarity]`. `stats.rotSeconds = def.rotSeconds * RARITY_ROT[rarity]`.

| rarity | grow × | rot × | UI |
|---|---|---|---|
| common | 1 | 1 | Common |
| uncommon | 1/1.05 | 1 | Uncommon |
| rare | 1/1.10 | 1/1.10 | Rare |
| heirloom | 1 | 1/1.25 | Specialty |

raspberry `rotSeconds` = `0.66 * 240` = 158.4.

`SKUS['pack-*'].price` is pack $. Research row costs unchanged. Other SKU prices unchanged.

`buy-delete` dies. Not a `SkuId`. Not in `SKUS`. Not an argument to `World.buy`. Shop Automation has no Delete row. Catalog still skips delete. Face `{ kind: 'delete' }` stays (toolbar).

Almanac crop drink: `L/day = waterUsePerSec * DAY_SECONDS`, 1 significant digit. Machine rates stay L/s. Grow time: `days()` above. Seed row label **Seed price**.

## Happiness / rarity roll

`Plant.happiness` starts at `0.5`. Only wilt drains it: while growing and `thirst < WITHER`, `happiness -= dt / 480` (50% → 0 in one day). Clamp 0. No recovery yet.

At ripen, `u = hash(seed, 'grow-rarity', col, row, day)`, then `rarity = rollGrowRarity(rarity, happiness, u)`.

Odds at happiness `h`, `x = h / 0.5`:

| | h ≥ 0.5 | h < 0.5 |
|---|---|---|
| +2 | 0.005 × x | 0 |
| +1 | 0.05 × x | 0.05 × x |
| −1 | 0 | 0.05 × (1 − x) |

At 50%: 0.5% two-up, 5% one-up, 0% down. Clamp common/heirloom. Fruit and later shovel-seed use the rolled rarity.

## Freshness / rot

```
class Plant {
  freshness: number
}

Plot += { kind: 'rotten' }

type Item fruit = { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number; unitSale: number }
```

`growing` → `ripe`: `freshness = 1`. Ticks only while ripe. Not copied onto Item.

While ripe: `freshness -= dt / rotSeconds`. Stops on harvest.

`freshness <= 0` → cell `{ kind: 'rotten' }`. No plant. Not a `CropId`. `isPlot` includes rotten. Look **Rotten plant**.

```
freshMul(f) = f >= 0.8 ? 1 : f / 0.8
```

Harvest:

```
unitSale = statsOf(crop, rarity, mods).sale * freshMul(freshness)
fruit = { kind: 'fruit'; crop; rarity; count: 1; unitSale }
fruitMoney(it) = it.unitSale * it.count
```

`stats.sale` already has rarity and research saleMul. Harvest is the only writer of `unitSale`. Research bump after harvest does not change picked fruit.

Box fruit cargo carries `unitSale`. Seeds cargo does not.

Merge same crop+rarity (inventory, box, chest, house):

```
unitSale' = (a.unitSale * a.count + b.unitSale * b.count) / (a.count + b.count)
```

Different rarities never combine. Rarity does not combine.

Ripe: hide water bar and water look. Freshness bar when `freshness < 0.8`, red, width ∝ freshness.

Hover ripe: `{Crop} - ripe, freshness {n}%` (`n = floor(freshness * 100)`).

Rotten: primary act dig (shovel) → `{ kind: 'empty' }`, no drop. Wrong tool → existing speech. Dead (wilt) unchanged.

Sprinklers skip ripe / dead / rotten. Only growing get water.

## Delete

Not a shop SKU. `World.armDelete()` sets `{ kind: 'delete' }`. Stay armed. No refund. Money unchanged.

```
StayArmed =
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'delete'
```

Same edge hit as pipe. Same vertex snap as sprinkler. Then `deleteBuilding(at)`.

| hit | result |
|---|---|
| owned piped edge | remove pipe |
| owned sprinkler vertex | remove sprinkler |
| pumpjack form jack | both cells → empty |
| well | cell → empty |
| chest | slots become drops on at, cell → empty |
| grinder | cell → empty |
| house, starter, rock, shrub, growing/ripe/dead/rotten/empty/untilled/infertile | Cannot delete here |

`deletePipe` / `deleteSprinkler` / `deleteBuilding` require `place.kind === 'delete'`. They do not clear place. House and starter are not delete targets.

Rocks, soil, plants, shrubs stay pickaxe / shovel / harvest.

## Place facing

Vert sprinkler facing lives on `Place`. Pointer-offset facing dies.

```
Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
  | { kind: 'delete' }
```

`World.buy('buy-sprinkler-vert')` constructs the vert arm with `facing`. Other `buy` ids: `{ kind: 'sku'; id }`. `buy` never arms delete.

`World.rotatePlace()`: no-op unless place is `buy-sprinkler-vert`; toggles `ns` ↔ `ew`.

`placeSprinkler` for vert uses `place.facing`.

Build cluster: `buy-pumpjack` `buy-well` `buy-pipe` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-chest` `buy-grinder`, or `place.kind === 'delete'`. Not shovel / bucket / box.

## Research blurbs

`ResearchDef.blurb` required. UI reads `.blurb`. No item literals in the React file. Lock:

| id | blurb |
|---|---|
| unlock-tomato | Unlocks Tomato seeds in the general store. |
| unlock-raspberry | Unlocks Raspberry seeds in the general store. |
| unlock-watermelon | Unlocks Watermelon seeds in the general store. |
| bump-carrot | Carrot fruit sells for 1.1×. |
| bump-potato | Potato fruit sells for 1.1×. |
| bump-wheat | Wheat fruit sells for 1.1×. |
| unlock-better-tools | Unlocks Better shovel and Large bucket in the general store. |
| unlock-large-box | Unlocks Large fruit box in the general store. |
| unlock-irrigation | Unlocks Pumpjack in the general store. |
| unlock-auto-irrigation | Unlocks Pipe and Sprinkler in the general store. |
| unlock-adv-irrigation | Unlocks Well, Vertical sprinkler, and Large sprinkler in the general store. |
| unlock-chest | Unlocks Chest in the general store. |
| unlock-expand | Unlocks land expansion on the map edge. |
| unlock-pickaxe | Unlocks Pickaxe and Hardened pickaxe in the general store. |
| unlock-grinder | Unlocks Seed grinder in the general store. |

## Berry almanac

Wild berry gets the crop pane treatment: berry icon + shrub cycle (`prop-shrub` → ripe `prop-berry-shrub`, 0.8s). Table: **Grow time** 1.5 days (`SHRUB_GROW`), **Sell** coin `BERRY_SALE`. No drink. No seed price.

Shrub entry stays a blurb-only row (move plant).

## Crop animation

Almanac crop cycle: `sprout` → `grow` → `ripe`, 0.8s/stage. No `dead`.

`stageOnly` hides every `<g id>` whose id ≠ stage, including hyphen ids. When stage is `ripe`, hide `ripe-rare` / `ripe-heirloom`. `\w+` is illegal.

## Rarity

Uncommon+ inventory Face shows `qualityPip` (view). Common does not.

Merge still requires same rarity. Rarity does not combine. Different rarity seeds do not merge.

## Named invariants (tests after impl)

Keep 1–55 except 50.

50. Delete pipe, sprinkler, or a delete-legal building: money unchanged.

56. Pack prices and CROPS match the table. Watermelon pack 18, grow 150, sale 19, waterUsePerSec 0.04.
57. Ripe plant: no thirst bar. freshness starts 1. After rotSeconds, cell is rotten.
58. Harvest at freshness 0.8+ → unitSale === stats.sale. At 0.4 → unitSale === stats.sale * 0.5.
59. Two fruits same crop+rarity, unitSale 4 and 6, counts 1+1 → stack unitSale 5.
60. buy-delete is not a SkuId. Shop Automation has no Delete row.
61. Delete pumpjack: money unchanged, both cells empty, starter still there.
62. Delete chest: items are drops on at. House click-delete is no-op.
63. Rotten + shovel → empty, no drop. Pickaxe / empty hand does not clear it.
64. Uncommon+ inventory face has the quality pip. Common does not. (`qualityPip`)
65. Different rarity seeds do not merge.
66. phase() at t=0/60/156/216 is sunrise/day/sunset/twilight.
67. days(45) displays as 0.19 days. days(360) as 1.5 days.
