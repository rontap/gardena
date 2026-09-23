# Olive oil

| | |
|---|---|
| item kind | `'oil'` |
| unit | count |
| stack limit | `STACK_MAX_CRAFTED` (+ `bulk-up`) |
| made by | [[items/buildings/mill]] from [[items/crops/olive]] |
| sold at | Market |

Oil pressed from olives.

## Variants

Plain or infused (`infused`). An infused bottle shows **Infused Olive oil** ([[features/machines]]).

## Properties

`quality` and `unitSale` are set by the Mill. Bottles merge only with the same `infused`; quality and `unitSale` are averaged by count. No freshness.

## Selling

`unitSale` = `OIL` × the Preserving best-for multiplier of the olive variety × `qualityMul(quality)`. At the Market × the `saleswoman` skill; then the price drop applies ([[features/market]]).

## Affected by

- `saleswoman` skill.
- Infusion ([[items/buildings/infuser]]): infused bottles sell without adding to the price drop, and raise contract reputation by up to 25% ([[features/machines]]).
