# Extract

| | |
|---|---|
| item kind | `'extract'` |
| unit | count |
| stack limit | `STACK_MAX_CRAFTED` (+ `bulk-up`) |
| made by | [[items/buildings/mill]] from [[items/other/cut-grass]] |
| sold at | Market |

Pressed from cut grass. Different item from [[items/produce/vanilla-extract]].

## Variants

None.

## Properties

`unitSale` = `EXTRACT` × `qualityMul(quality)`; Cut grass has quality 0 and no variety, so no best-for multiplier. No freshness.

## Selling

`unitSale`, × the `saleswoman` skill at the Market; then the price drop applies ([[features/market]]).

## Affected by

- `saleswoman` skill.
