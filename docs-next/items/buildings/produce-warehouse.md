# Produce Warehouse

| | |
|---|---|
| SKU | starting building; not sold |
| size | 2 × 2 (`WAREHOUSE_BASE`) |
| demolish | no |
| cell kind | `'warehouse'` |

Where goods are sold. **Drop off** here fills accepted contracts first and sells the rest at once ([[features/market]], [[features/contracts]]).

## Use

Clicking it with a sellable item in hand walks the gardener to the loading spot below it (`PAD`) and drops the item off. The items it takes are listed in [[features/market]].

## Connections

Vehicle unload spots on the row below it (`warehousePads`); a route unload there takes fruit, produce and alcohol ([[features/vehicles]]).

## Screen

Hover: **Produce Warehouse**. Prompt: **Drop off**.

## Art

`prop-produce-warehouse.svg`.
