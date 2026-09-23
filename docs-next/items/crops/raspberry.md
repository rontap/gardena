# Raspberry

| | |
|---|---|
| kind | annual |
| class | fruit |
| seeds from | Seed silo pack `pack-raspberry`; Grinder; contract prize (Heirloom) |
| unlocked by | `unlock-raspberry` |
| code id | `'raspberry'` |

A high-price fruit crop with a short freshness time.

## Varieties

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | Raspberry | — | Black raspberry |
| purpose | — | — | Preserving |
| placement need | — | — | — |

With no Named variety, a Plain plant's variety roll goes straight to Heirloom.

## Growing

Fields of `CROPS.raspberry`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. Rules: [[features/plants]].

## Selling

Fruit at the Market for `CROPS.raspberry.sale` × `qualityMul(quality)` × the Fresh best-for multiplier × freshness ([[features/market]]).

## Affected by

- `better-raspberry` skill ([[features/family]]).

## Art

`crop-raspberry.svg`, `fruit-raspberry.svg`.
