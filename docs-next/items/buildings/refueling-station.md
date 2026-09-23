# Refueling station

| | |
|---|---|
| SKU | `buy-refuel` (Build tab `automation`) |
| price | `SKUS['buy-refuel'].price` |
| size | 1 × 1 |
| unlocked by | `unlock-dispatch` |
| demolish | yes |
| cell kind | `'refuel'` |
| recipe kind | `fixed`, pooled ([[features/machines]]) |

Makes vehicle fuel from wood, oil, sugar cane and alcohol, and stores it for vehicles.

## Use

Takes burnable goods; each adds fuel points (`FUEL_WORTH`), up to `FURNACE_CAP` points. When it holds `FUEL_BATCH` points and its fuel store is empty, it works for `FUEL_SECONDS`, sped up by nearby Furnaces, and moves `FUEL_BATCH` L of fuel into the store.

Vehicles take fuel from the store at a route stop or when driven onto it. With **Buy from market** ticked, fuel the store does not hold is bought with money ([[features/vehicles]]).

## Recipe

| input | fuel points each (`FUEL_WORTH`) |
|---|---|
| [[items/other/wood]] | `wood` |
| [[items/produce/oil]] | `oil` |
| [[items/crops/sugar-cane]] fruit | `cane` |
| [[items/produce/spirit]], [[items/produce/cask]] | `alcohol` |

`FUEL_BATCH` points → `FUEL_BATCH` L fuel.

## Connections

Chest input on the left of its tile; no output chest. Vehicle unload spot above ([[systems/building-io]]).

## Screen

Prompt: **Fill**. Hover: **{units}/{cap} units, {store}/{storeCap} L**. Panel: **Buy from market** checkbox.

## Art

`prop-refuel.svg`.
