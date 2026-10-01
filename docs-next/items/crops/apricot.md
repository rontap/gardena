# Apricot

| | |
|---|---|
| kind | tree |
| class | fruit |
| seeds from | tree seed: contract prize; Grinder (Plain); digging up an apricot tree |
| unlocked by | start |
| code id | `'apricot'` |

A fruit tree with the shortest juvenile period of the four species.

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Apricot | Blenheim | Klosterneuburger |
| purpose | — | Fresh | Alcohol |
| placement need | — | — | — |

Planting: a soft untilled tile whose upper neighbour is also soft untilled (bare or grass). Variety comes from the seed or a graft on the young tree ([[features/trees]]).

## Growing

Fields of `TREES.apricot` (`juvenileSeconds`, `fruitSeconds`) and `CROPS.apricot` (`waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`). Rules: [[features/trees]].

## Selling

Fruit at the Market for `CROPS.apricot.sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')` × the `saleswoman` skill × the `heirloom` skill for an Heirloom variety, then the price drop. Tree fruit has quality 0 ([[features/market]]).

## Art

`prop-apricot-tree.svg`, `fruit-apricot.svg`.
