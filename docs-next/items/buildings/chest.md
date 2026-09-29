# Chest

| | |
|---|---|
| SKU | `buy-chest` (Build tab `automation`) |
| price | `SKUS['buy-chest'].price` |
| size | 1 × 1 |
| unlocked by | start |
| demolish | yes |
| cell kind | `'chest'` |

Holds `CHEST_SLOTS` item slots on the farm.

## Use

**Open Chest** walks the gardener to it and opens its panel. Clicking a slot swaps it with the hand. Fruit in a chest keeps losing freshness at the normal rate.

A chest on the left of a machine's bottom row is that machine's input; on the right, its output ([[systems/building-io]]).

## Connections

Vehicle loading spots above and below; signal output, on when every slot holds something ([[systems/signals]]).

## Art

`prop-chest.svg`.

## Sound

Opening plays a lid opening; closing the panel plays the lid shutting ([[systems/sound]]).
