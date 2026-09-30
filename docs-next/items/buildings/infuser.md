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

Makes infused versions of jam, spirits, wine and cider, olive oil, and Extract.

## Use

The first good put in fixes what the Infuser works on: one jam crop and variety, one cask and variety, one spirit and variety (Mixed spirit as its own kind), olive oil, or Extract. Already infused goods are refused. Extract goes in only as a full bag of `EXTRACT_BAG_LITERS`.

The reagents go into their own stores (`Infuser.reagents`), one per reagent: [[items/produce/flakes]], [[items/produce/vanilla-extract]], [[items/produce/truffle-extract]] and [[items/other/fly-agaric]]. The stores take each reagent at any time, whatever the lock.

Each good takes two of the reagents (`INFUSE_REAGENTS`):

| good | reagents, in the order they are used |
|---|---|
| [[items/produce/jam]] | vanilla extract, flakes |
| [[items/produce/cask]] (wine, cider) | vanilla extract, flakes |
| [[items/produce/spirit]] | vanilla extract, Truffle extract |
| [[items/produce/oil]] | flakes, Truffle extract |
| [[items/produce/extract]] | Fly agaric, Truffle extract |

Among vanilla extract, flakes and Truffle extract, each of the four goods lacks one, so any two of the three infuse all four, and one alone does not.

Each batch takes `INFUSE_IN` good and `INFUSE_REAGENT` of the first of the good's two reagents the Infuser holds (`infuseReagent`), and runs `INFUSE_SECONDS`, sped up by nearby Furnaces. A reagent the locked good does not take stays in its store. The infused good keeps the averaged quality and `unitSale` of what went in.

## Recipe

| input | output |
|---|---|
| `INFUSE_IN` [[items/produce/jam]] + `INFUSE_REAGENT` vanilla extract or flakes | 1 infused jam, same crop and variety |
| `INFUSE_IN` [[items/produce/cask]] + `INFUSE_REAGENT` vanilla extract or flakes | 1 infused wine or cider, same variety |
| `INFUSE_IN` [[items/produce/spirit]] + `INFUSE_REAGENT` vanilla extract or Truffle extract | 1 infused spirit, same spirit and variety |
| `INFUSE_IN` [[items/produce/oil]] + `INFUSE_REAGENT` flakes or Truffle extract | 1 infused olive oil |
| one full bag of [[items/produce/extract]] + `INFUSE_REAGENT` Fly agaric or Truffle extract | one full bag of Infused Extract |

An infused jam, cask, spirit or oil keeps the value per unit of the good that went in. It has two outcomes ([[features/machines]]):

1. At the Market it sells at the price drop in force when the drop-off started and leaves the price drop as it is.
2. In a completed contract it raises the reputation gained by up to 25%, in proportion to the infused share of delivered units.

Infused Extract is not sold. Poured on a plant, sapling or stump, it speeds up growth for `EXTRACT_INFUSED_SECONDS` instead of `EXTRACT_SECONDS` ([[items/produce/extract]]).

## Connections

Chest input on the left of the bottom row, output on the right; vehicle loading spots above and below; signal input ([[systems/building-io]]).

## Screen

Prompt: **Infuse**. Hover: **{have}/{need} → Infused {name}**, **{have}/{need} {first} or {second}** with the locked good's two reagents, **Infuser - working {n}%**. With an infused good or Infused Extract in hand: **Already infused**. Recipe panel: one row per good, each with its two reagents.

## Art

`prop-infuser.svg`, groups `off` and `on`.

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `infuser` cues ([[systems/sound]]).
