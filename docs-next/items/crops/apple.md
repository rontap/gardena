# Apple

| | |
|---|---|
| kind | tree |
| class | fruit |
| seeds from | tree seed: contract prize; Grinder (Plain); digging up an apple tree |
| unlocked by | start |
| code id | `'apple'` |

A fruit tree. It takes two tiles, grows for a juvenile period, then drops fruit onto nearby plots in season. 

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Apple | Kingston Black | Pink Lady |
| purpose | — | Alcohol | Fresh |
| placement need | — | — | neighbour |

Every tree is planted from a tree seed on a soft untilled tile whose upper neighbour is also soft untilled (bare or grass). Neighbour: a Pink Lady tree bears fruit and moves through its seasons only with a grown apple tree (past its juvenile period, not a stump) that is not Heirloom within `NEIGHBOUR_REACH` tiles. A tree's variety is set by its seed or by a graft on the young tree; trees do not roll for a variety ([[features/trees]]).

## Growing

Fields of `TREES.apple` (`juvenileSeconds`, `fruitSeconds`), `CROPS.apple` (`waterUsePerSec`, `waterTolerance`, `fertTolerance`, `rotSeconds`) and `TREE_FERT_PER_DAY.apple`. Rules: [[features/trees]].

## Selling

Fruit at the Market for `CROPS.apple.sale` × the Fresh best-for multiplier × freshness. Tree fruit has quality 0 ([[features/market]]).

## Art

`prop-apple-tree.svg`, `fruit-apple.svg`.
