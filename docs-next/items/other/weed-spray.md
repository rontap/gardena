# Weed spray

| | |
|---|---|
| item kind | `'weed-spray'` |
| unit | litres; a bag holds `WEED_SPRAY_BAG` |
| stack limit | 1 bag |
| obtained from | `buy-weed-spray` in the [[items/buildings/additive-store]], after `unlock-better-tools`; a [[items/buildings/still]] makes one bag from `STILL_SPRAY_IN` Rotten produce |
| sold at | not sold |

Clears a weed and keeps a plot free of weeds for longer.

## Use

**Spray** on any tilled plot uses 1 L: the plot's weed chance becomes `WEED_SPRAYED` (−1), and a weed on it is removed with nothing dropped. It takes `SPRAY_WORK` seconds. The bag leaves the hand when it holds less than 1 L ([[features/weeds]]).

The Sprayer trailer carries it ([[items/other/trailers]]): under the boom, a weed or a tilled plot with weed chance 0 or above takes 1 L and the same result. A plot below 0 with no weed is passed over, so a plot is not sprayed again while no weed can sprout on it.

## Art

`item-weed-spray.svg`. A finished **Spray** shows the green pour burst `pour-green` on the plot ([[art/vfx]]).

## Sound

**Spray** plays `spray`, a short high hiss ([[systems/sound]]).
