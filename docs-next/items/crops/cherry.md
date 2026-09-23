# Cherry

| | |
|---|---|
| kind | tree |
| class | fruit |
| seeds from | tree seed: contract prize; Grinder (Plain); digging up a cherry tree |
| unlocked by | start |
| code id | `'cherry'` |

A fruit tree with the shortest fruit time and the shortest freshness time of the four species.
## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Cherry | — | Bing |
| purpose | — | — | Fresh |
| placement need | — | — | neighbour |

Planting: a soft untilled tile whose upper neighbour is also soft untilled (bare or grass). Neighbour: a Bing tree bears fruit and moves through its seasons only with a grown cherry tree (past its juvenile period, not a stump) that is not Heirloom within `NEIGHBOUR_REACH` tiles. Variety comes from the seed or a graft on the young tree ([[features/trees]]).

## Growing

Fields of `TREES.cherry` (`juvenileSeconds`, `fruitSeconds`), `CROPS.cherry` (`waterUsePerSec`, `waterTolerance`, `fertTolerance`, `rotSeconds`) and `TREE_FERT_PER_DAY.cherry`. Rules: [[features/trees]].

## Selling

Fruit at the Market for `CROPS.cherry.sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')` × the `saleswoman` skill × the `heirloom` skill for an Heirloom variety, then the price drop. Tree fruit has quality 0 ([[features/market]]).

## Art

`prop-cherry-tree.svg`, `fruit-cherry.svg`.
