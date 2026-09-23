# Sugar cane

| | |
|---|---|
| kind | annual |
| class | grain |
| seeds from | Seed silo pack `pack-sugar-cane`; Grinder |
| unlocked by | `unlock-fermentation` |
| code id | `'sugar-cane'` |

A crop grown to make [[items/produce/sugar]]. Its fruit sells for little at the Market, and it uses more water than the other annual crops. Ripe cane is harvested as a fruit item.

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Sugar cane | — | — |
| purpose | — | — | — |
| placement need | — | — | — |

## Growing

Fields of `CROPS['sugar-cane']`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS['sugar-cane'].sale` × `qualityMul(quality)` × freshness ([[features/market]]).

## Art

`crop-sugar-cane.svg`, `fruit-sugar-cane.svg`.
