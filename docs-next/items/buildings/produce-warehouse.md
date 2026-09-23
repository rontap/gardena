# Produce Warehouse

| | |
|---|---|
| SKU | starting building; not sold |
| size | 2 × 2 (`WAREHOUSE_BASE`) |
| demolish | no |
| cell kind | `'warehouse'` |

Where goods are sold: the Market truck. **Drop off** here fills accepted contracts first and sells the rest at once ([[features/market]], [[features/contracts]]).

## Use

Clicking it with a sellable item in hand walks the gardener to the loading spot below it (`PAD`) and drops the item off. Items the Market does not take are refused.

## Connections

Vehicle unload spots on the row below it (`warehousePads`); they take fruit, produce and alcohol ([[features/vehicles]]). No chest input or output.

## Screen

Hover: **Produce Warehouse**. Prompt: **Drop off**.

## Art

`prop-produce-warehouse.svg`, `prop-truck.svg`.
