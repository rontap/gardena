# Sugar

| | |
|---|---|
| item kind | `'sugar'` |
| unit | litres |
| stack limit | bag of `SUGAR_BAG` L |
| made by | [[items/buildings/mill]]; also bought as `buy-sugar` in the Additive store |
| sold at | Market |

Sugar in litres. It is stored in the Additive store and carried as a bag.

## Variants

None. Mill sugar and bought sugar are the same item with different `unitSale` and `quality`.

## Properties

- From the Mill: `unitSale` = `SUGAR_MILL` × the Preserving best-for multiplier × `qualityMul(quality)`.
- Bought (`buy-sugar`): `SUGAR_BAG` L at `SUGAR_SHOP` per litre, quality 0; unlocked by `unlock-preservatives`.
- Merging averages `unitSale` and quality by litres. It does not lose freshness.

## Selling

Litres × `unitSale`, × the `saleswoman` skill; then the price drop applies ([[features/market]]).

## Affected by

- `saleswoman` skill.
