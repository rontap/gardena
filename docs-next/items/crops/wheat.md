# Wheat

| | |
|---|---|
| kind | annual |
| class | grain |
| seeds from | Seed silo pack `pack-wheat`; Grinder; contract prize (Red Fife) |
| unlocked by | `unlock-multi-crop` |
| code id | `'wheat'` |

A grain crop with a longer grow time and a higher price per fruit than the root crops.

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Wheat | Red Fife | — |
| purpose | — | Preserving | — |
| placement need | — | — | — |

## Growing

Fields of `CROPS.wheat`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS.wheat.sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')` × the `saleswoman` skill × the `heirloom` skill for an Heirloom variety, then the price drop ([[features/market]]).

## Affected by

- `better-wheat` skill ([[features/family]]).

## Art

`crop-wheat.svg`, `fruit-wheat.svg`.
