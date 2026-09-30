# Additive store

| | |
|---|---|
| SKU | starting building; not sold |
| size | 1 × 2 (`ADDITIVE_BASE`) |
| demolish | no |
| cell kind | `'additive-store'` |

The farm's store for [[items/other/fertilizer]], [[items/other/compost]], [[items/other/weed-spray]] and [[items/produce/sugar]], and the place to buy them.

## Use

**Open Additive store** walks the gardener to it, puts every fertilizer, compost, Weed spray and sugar item from the hand and inventory into it, and opens its panel.

- Holds up to `ADDITIVE_CAP_LITERS` litres in total.
- Taking a row gives a bag of `ADDITIVE_BAG` litres (sugar: `SUGAR_BAG`), or tops up the same kind of bag in hand.
- Buying (`buy-fertilizer`, `buy-weed-spray`, `buy-sugar`) puts the bag straight into the store; a purchase that does not fit is refused with **Additive store full**.

The Additive silo (`buy-silo-spray`) is a separate building for vehicles with the same store rules ([[items/buildings/field-silos]]).

## Connections

Vehicle loading spots above and below; signal output, on when full ([[systems/building-io]], [[systems/signals]]).

## Art

`prop-additive-store.svg`.

## Sound

Opening and closing the panel play the chest's open and close sounds ([[systems/sound]]).
