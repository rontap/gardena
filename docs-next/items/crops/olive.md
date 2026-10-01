# Olive

| | |
|---|---|
| kind | tree |
| class | fruit |
| seeds from | tree seed: contract prize; Grinder (Plain); digging up an olive tree |
| unlocked by | start |
| code id | `'olive'` |

A fruit tree with the longest juvenile period and the lowest fertilizer use of the four species; grown for [[items/produce/oil]].
## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Olive | Arbequina | — |
| purpose | — | Preserving | — |
| placement need | — | — | — |

Planting: a soft untilled tile whose upper neighbour is also soft untilled (bare or grass). Variety comes from the seed or a graft on the young tree ([[features/trees]]).

## Growing

Fields of `TREES.olive` (`juvenileSeconds`, `fruitSeconds`) and `CROPS.olive` (`waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`). Rules: [[features/trees]].

## Selling

Fruit at the Market for `CROPS.olive.sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')` × the `saleswoman` skill × the `heirloom` skill for an Heirloom variety, then the price drop. Tree fruit has quality 0 ([[features/market]]).

## Art

`prop-olive-tree.svg`, `fruit-olive.svg`.
