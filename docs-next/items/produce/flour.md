# Flour

| | |
|---|---|
| item kind | `'flour'` |
| unit | count |
| stack limit | `STACK_MAX_CRAFTED` (+ `bulk-up`) |
| made by | [[items/buildings/mill]] from [[items/crops/wheat]] |
| sold at | Market |

Milled wheat.

## Variants

None.

## Properties

`quality` and `unitSale` are set by the Mill. Merging averages both by count. No freshness.

## Selling

`unitSale` = `FLOUR` × the Preserving best-for multiplier of the wheat variety × `qualityMul(quality)`. At the Market × the `saleswoman` skill; then the price drop applies ([[features/market]]).

## Affected by

- `saleswoman` skill.
