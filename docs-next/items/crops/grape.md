# Grape

| | |
|---|---|
| kind | annual |
| class | fruit |
| seeds from | Seed silo pack `pack-grape`; Grinder; contract prize (Named, Heirloom) |
| unlocked by | `unlock-advanced-plants` |
| code id | `'grape'` |

A fruit crop between tomato and raspberry in price and freshness time.
## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Grape | Concord | Kéknyelű |
| purpose | — | Preserving | Alcohol |
| placement need | — | — | neighbour |

Neighbour: a Kéknyelű plant grows only with another grape plant that is not Heirloom within `NEIGHBOUR_REACH` tiles, growing and with no red range ([[features/plants]]).

## Growing

Fields of `CROPS.grape`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS.grape.sale` × `qualityMul(quality)` × the Fresh best-for multiplier × freshness ([[features/market]]).

## Affected by

- `better-grape` skill ([[features/family]]).

## Art

`crop-grape.svg`, `fruit-grape.svg`.
