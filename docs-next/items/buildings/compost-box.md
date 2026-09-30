# Compost box

| | |
|---|---|
| SKU | `buy-compost-box` (Build tab `automation`) |
| price | `SKUS['buy-compost-box'].price` |
| size | 1 × 1 |
| unlocked by | start |
| demolish | yes |
| cell kind | `'compost-box'` |
| recipe kind | `fixed`, pooled ([[features/machines]]) |

Turns organic waste into [[items/other/compost]].

## Use

Takes any item with a compost value, a whole stack at a time. Each item adds points (`COMPOST_VALUE`), without a limit on the total. Every time it holds `COMPOST_NEED` points it makes one bag in `COMPOST_SECONDS`, sped up by nearby Furnaces, and keeps the rest.

## Recipe

`COMPOST_NEED` points → `COMPOST_LITERS` L [[items/other/compost]].

| item | points each (`COMPOST_VALUE`) |
|---|---|
| seeds | `seeds` |
| fruit (any crop) | `fruit` |
| [[items/produce/sugar]] | `sugar` per litre |
| [[items/other/cut-grass]] | `grass` |
| [[items/other/pulled-weed]] | `weed` |
| [[items/produce/rotten-produce]] | `rotten` |
| dead plant | `dead` |
| [[items/other/ash]] | `ash` |
| [[items/other/wood]] | `wood` |
| [[items/other/fly-agaric]] | `fly-agaric` |
| [[items/other/truffle]] | `truffle` |

## Connections

Chest input on the left, output on the right; vehicle loading spots above and below ([[systems/building-io]]). No signal input.

## Screen

Prompt: **Compost**.

## Art

`prop-compost-box.svg`.

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `compost-box` cues ([[systems/sound]]).
