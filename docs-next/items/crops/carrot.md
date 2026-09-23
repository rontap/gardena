# Carrot

| | |
|---|---|
| kind | annual |
| class | root |
| seeds from | Seed silo pack `pack-carrot`; Grinder |
| unlocked by | start |
| code id | `'carrot'` |

The first crop: cheap seeds, a short grow time and wide water and fertilizer ranges. `fertUseMul` 1 is the reference the other crops' fertilizer use is set against.

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Carrot | — | — |
| purpose | — | — | — |
| placement need | — | — | — |

No variety roll at ripening.

## Growing

Fields of `CROPS.carrot`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS.carrot.sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')` × the `saleswoman` skill × the `heirloom` skill for an Heirloom variety, then the price drop ([[features/market]]).

## Art

`crop-carrot.svg`, `fruit-carrot.svg`.
