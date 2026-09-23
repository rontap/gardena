# Potato

| | |
|---|---|
| kind | annual |
| class | root |
| seeds from | Seed silo pack `pack-potato`; Grinder; contract prize (Bintje) |
| unlocked by | start |
| code id | `'potato'` |

A root crop that uses less water than the carrot and keeps its freshness longer.

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Potato | Bintje | — |
| purpose | — | Alcohol | — |
| placement need | — | — | — |

## Growing

Fields of `CROPS.potato`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS.potato.sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')` × the `saleswoman` skill × the `heirloom` skill for an Heirloom variety, then the price drop ([[features/market]]).

## Affected by

- `better-potato` skill ([[features/family]]).

## Art

`crop-potato.svg`, `fruit-potato.svg`.
