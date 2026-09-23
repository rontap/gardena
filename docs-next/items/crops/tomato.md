# Tomato

| | |
|---|---|
| kind | annual |
| class | fruit |
| seeds from | Seed silo pack `pack-tomato`; Grinder; contract prize (Named, Heirloom) |
| unlocked by | `unlock-advanced-plants` |
| code id | `'tomato'` |

A fruit crop with a long grow time and narrow water and fertilizer ranges; it sells for more per fruit than the starting root crops.
## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Tomato | Green Zebra | San Marzano |
| purpose | — | Fresh | Preserving |
| placement need | — | — | — |

## Growing

Fields of `CROPS.tomato`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS.tomato.sale` × `qualityMul(quality)` × the Fresh best-for multiplier × freshness ([[features/market]]).

## Affected by

- `better-tomato` skill ([[features/family]]).

## Art

`crop-tomato.svg`, `fruit-tomato.svg`.
