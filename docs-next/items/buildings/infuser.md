# Infuser

| | |
|---|---|
| SKU | `buy-infuser` (Build tab `automation`) |
| price | `SKUS['buy-infuser'].price` |
| size | `MILL_W` × `MILL_H` tiles |
| unlocked by | `unlock-infusion` |
| demolish | yes |
| cell kind | `'infuser'` |
| recipe kind | `fixed`, locked ([[features/machines]]) |

Makes infused versions of jam, spirits, wine and cider, and olive oil.

## Use

The first good put in fixes what the Infuser works on: one jam crop and variety, one cask and variety, one spirit and variety (Mixed spirit as its own kind), or olive oil. Already infused goods are refused. [[items/produce/flakes]] and [[items/produce/vanilla-extract]] go into their own stores.

Each batch takes `INFUSE_IN` good and `INFUSE_FLAKES` flakes, or `INFUSE_EXTRACT` vanilla extract when there are no flakes, and runs `INFUSE_SECONDS`, sped up by nearby Furnaces. The infused good keeps the averaged quality and `unitSale` of what went in.

## Recipe

| input | output |
|---|---|
| `INFUSE_IN` [[items/produce/jam]] + `INFUSE_FLAKES` flakes or `INFUSE_EXTRACT` vanilla extract | 1 infused jam, same crop and variety |
| `INFUSE_IN` [[items/produce/spirit]] + reagent | 1 infused spirit, same spirit and variety |
| `INFUSE_IN` [[items/produce/cask]] + reagent | 1 infused wine or cider, same variety |
| `INFUSE_IN` [[items/produce/oil]] + reagent | 1 infused olive oil |

An infused good keeps the value per unit of the good that went in. It has two outcomes ([[features/machines]]):

1. At the Market it sells at the price drop in force when the drop-off started and leaves the price drop as it is.
2. In a completed contract it raises the reputation gained by up to 25%, in proportion to the infused share of delivered units.

## Connections

Chest input on the left of the bottom row, output on the right; vehicle loading spots above and below; signal input ([[systems/building-io]]).

## Screen

Prompt: **Infuse**. Hover: **{have}/{need} → Infused {name}**, **{have}/{need} Flakes** or **{have}/{need} Vanilla extract**, **Infuser - working {n}%**.

## Art

`prop-infuser.svg`, groups `off` and `on`.

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `infuser` cues ([[systems/sound]]).
