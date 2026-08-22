# Inspect

Bottom-right `Status` under the queue. Held face + `heldText` / fruit `ItemLineView`. Then `lookText` (cell name, soil, prompt). Armed place tints the look block roof (`bg-roof/20`, larger type).

Plant bars only on hover of a growing or ripe plot. Title, drop, and prompt stay in the look block. `lookText(..., plantStats: false)` — numbers live on the bars, not duplicated as extra look lines. A tree is not a plot: no soil bars.

## Growing

| row | fill | number |
|---|---|---|
| Growth | fill bar | `floor(maturity * 100)%` |
| Happiness | segmented + notch | `floor(happiness * 100)%` |
| Fertilizer | segmented + notch | `floor(fertilizer * 100)%` |
| Water | segmented + notch | `{water}L` two decimals |

Growth is a fill, not a banded bar. Blue `#4b91c2` vs empty `#8b887d`.

Happiness / fertilizer / water: dark track, colored segments, pale notch at current value. Notch `#fff6d5`, outlined, taller than the bar.

Bands: green `#4f9d69`, amber `#d69a3a`, red `#c9574b`.

| bar | red | amber | green |
|---|---|---|---|
| Happiness | `0 .. HAPPY_START/2` | `HAPPY_START/2 .. HAPPY_START` | `HAPPY_START .. 1` |
| Fertilizer | `0 .. floor/2` | `floor/2 .. floor` | `floor .. 1` |
| Water | dry + drown ends | between red and green | `MID ± waterTolerance` |

`floor = FERT_PLOT_MAX - fertTolerance`. Water is 0–`SOIL_WATER_MAX` (2 L). Happy band centered on `SOIL_WATER_MID` (1 L). Red at both ends.

## Ripe

Freshness only. Red `0 .. 0.8`, green `0.8 .. 1`. No amber. Notch at current. Number `floor(freshness * 100)%`.

Empty / weed / dead / rotten / untilled: no bars.

## Tend

Empty hand, growing plot, player owns `tending`, `plant.tended === false`: prompt **Tend**. Click queues `{ act: 'tend'; at }`. Work `TEND_WORK` 0.7s. Else empty-hand growing stays **Move here**. Not ripe. Not twice. Not a tree. [[mechanics/family]].

## Tree

Cell `kind: 'tree'`. Not a plot. No Happiness / Fertilizer / Water / Freshness bars.

`lookText` uses `TREE_NAME[species]`:

| state | line |
|---|---|
| `juvenile < 1` | **{Name} tree - growing {n}%** — `n = floor(juvenile * 100)` |
| `yield` `{ on }` | **{Name} tree - yielding {n}%** — `n = floor(fruit * 100)` |
| `pending` or `{ off }` | **{Name} tree - resting {n}%** — `n = floor(fruit * 100)` |

Juvenile fill while `juvenile < 1`: same Growth fill as a plant, label **Juvenile**, `floor(juvenile * 100)%`. No fill once mature.

## Prompts

Sapling in hand (`{ kind: 'sapling'; tree }`), valid owned 1×2 untilled `ground === 'soft'` (bare or grass): **Plant {Apricot|Lemon|Cherry|Apple}** (`TREE_NAME`). `{ act: 'plant' }`. Work same as sowing. Cover grass clears to bare. Tilled plot: no-op — [[mechanics/plants]].

Shovel on tree: **Dig**. `{ act: 'shovel' }`. No harvest on trees.

Ripe sugar-cane: **Harvest**. Empty hand or holding sugar. Not a box. `{ act: 'harvest' }`.
