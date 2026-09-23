# Freezer

| | |
|---|---|
| size | 1 × 1 |
| demolish | yes |
| cell kind | `'freezer'` |

A chest that slows the loss of freshness: fruit inside loses freshness at `FREEZER_ROT_MUL` of the normal rate. It does not stop it or restore it.

## Sizes

| | Freezer | Large freezer |
|---|---|---|
| SKU | `buy-freezer` | `buy-freezer-large` |
| slots | `FREEZER_SLOTS` | `FREEZER_LARGE_SLOTS` |
| obtained | Build, after `unlock-preservatives` | only while a contract prize freezer is banked; placing it uses the prize ([[features/contracts]]) |

## Use

**Open Freezer** walks the gardener to it and opens its panel; clicking a slot swaps it with the hand. Works as a machine input or output chest like a [[items/buildings/chest]].

## Connections

Vehicle loading spots above and below; signal output, on when every slot holds something ([[systems/building-io]], [[systems/signals]]).

## Art

`prop-freezer.svg`.
