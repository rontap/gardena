# Mill

| | |
|---|---|
| SKU | `buy-mill` (Build tab `automation`) |
| price | `SKUS['buy-mill'].price` |
| size | `MILL_W` × `MILL_H` tiles |
| unlocked by | `unlock-grinder` |
| demolish | yes |
| cell kind | `'mill'` |
| recipe kind | `work`, locked ([[features/machines]]) |

Crushes one kind of crop into a product.

## Use

The first item put in sets the Mill's recipe and variety. Until it is empty, it accepts only more of that crop and variety; Cut grass has no variety. It accepts every unit offered. Quality is averaged over what went in.

When it holds at least the recipe's input amount, it runs for `MILL_WORK` seconds, divided by the machine speed skill (`machineMul`) and by the speed-up from working Furnaces nearby (`furnaceMul`). It then outputs one batch and starts the next if enough is left. A signal of 1 on its input stops it.

## Recipe

| input | amount | output |
|---|---|---|
| [[items/crops/sugar-cane]] | `MILL_IN` | `SUGAR_BAG` L [[items/produce/sugar]] |
| [[items/crops/olive]] | `MILL_IN` | 1 [[items/produce/oil]] |
| [[items/crops/wheat]] | `MILL_IN` | 1 [[items/produce/flour]] |
| [[items/other/cut-grass]] | `MILL_GRASS` | 1 [[items/produce/extract]] |
| [[items/crops/vanilla]] | `MILL_VANILLA_IN` | `MILL_VANILLA_OUT` [[items/produce/vanilla-extract]] |
| [[items/crops/chilli]] | `MILL_CHILLI_IN` | `MILL_CHILLI_OUT` [[items/produce/flakes]] |

Output value: the product's base price (`SUGAR_MILL` per litre, `OIL`, `FLOUR`, `EXTRACT`) × the Preserving best-for multiplier of the locked variety × `qualityMul` of the averaged quality. Extract from Cut grass takes no best-for multiplier. Vanilla extract and flakes have no sale price.

## Connections

Chest input on the left of the bottom row, output on the right; vehicle loading spots above and below; signal input ([[systems/building-io]]).

## Screen

Hover line from `millLook`. Prompts with a matching item in hand: **Crush into {name}**, **Crush into flakes**.

## Art

`prop-mill.svg`.

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `mill` cues ([[systems/sound]]).
