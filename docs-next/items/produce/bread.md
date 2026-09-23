# Bread

| | |
|---|---|
| item kind | `'bread'` |
| unit | count |
| stack limit | `STACK_MAX_CRAFTED` (+ `bulk-up`) |
| made by | [[items/buildings/furnace]] from [[items/produce/flour]] |
| sold at | Market |

Baked from flour.

## Variants

None.

## Properties

`unitSale` = `BREAD` × `qualityMul(quality)`, with the Furnace's averaged input quality (`bakeBreadSale`). Merging averages quality and `unitSale` by count. No freshness.

## Selling

`unitSale`, × the `saleswoman` skill at the Market; then the price drop applies ([[features/market]]).

## Affected by

- `saleswoman` skill.
