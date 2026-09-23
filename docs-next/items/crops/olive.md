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

Fields of `TREES.olive` (`juvenileSeconds`, `fruitSeconds`), `CROPS.olive` (`waterUsePerSec`, `waterTolerance`, `fertTolerance`, `rotSeconds`) and `TREE_FERT_PER_DAY.olive`. Rules: [[features/trees]].

## Selling

Fruit at the Market for `CROPS.olive.sale` × the Fresh best-for multiplier × freshness. Tree fruit has quality 0 ([[features/market]]).

## Art

`prop-olive-tree.svg`, `fruit-olive.svg`.
