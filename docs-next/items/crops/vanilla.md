# Vanilla

| | |
|---|---|
| kind | annual |
| class | fruit |
| seeds from | contract prize only (`whole-cart` and `intercrop`, top difficulty band); Grinder |
| unlocked by | no pack; no research |
| code id | `'vanilla'` |

A rare crop with no Seed silo pack. Its seeds come from contracts.

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Vanilla | — | — |
| purpose | — | — | — |
| placement need | — | — | — |

## Growing

Fields of `CROPS.vanilla`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. It has the narrowest water and fertilizer tolerances of the annual crops. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS.vanilla.sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')` × the `saleswoman` skill × the `heirloom` skill for an Heirloom variety, then the price drop ([[features/market]]). `CROPS.vanilla.saleMul` is not part of that price.

## Art

`crop-vanilla.svg`, `fruit-vanilla.svg`.
