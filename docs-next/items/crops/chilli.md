# Chilli

| | |
|---|---|
| kind | annual |
| class | fruit |
| seeds from | Seed silo pack `pack-chilli`; Grinder |
| unlocked by | `unlock-infusion` |
| code id | `'chilli'` |

A fruit crop with low water use and long freshness, grown for [[items/produce/flakes]].

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Chilli | — | — |
| purpose | — | — | — |
| placement need | — | — | — |

## Growing

Fields of `CROPS.chilli`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. It has the highest `fertUseMul` of the annual crops. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS.chilli.sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')` × the `saleswoman` skill × the `heirloom` skill for an Heirloom variety, then the price drop ([[features/market]]).

## Art

`crop-chilli.svg`, `fruit-chilli.svg`.
