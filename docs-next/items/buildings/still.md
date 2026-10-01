# Pot still

| | |
|---|---|
| SKU | `buy-still` (Build tab `automation`) |
| price | `SKUS['buy-still'].price` |
| size | 2 × 1 |
| unlocked by | `unlock-fermentation` |
| demolish | yes |
| cell kind | `'still'` |
| recipe kind | `fixed`, mixed ([[features/machines]]) |

Distills fruit into [[items/produce/spirit]]. It needs water from a water network.

## Use

Takes [[items/crops/potato]], [[items/crops/wheat]] and [[items/crops/apricot]] fruit (`STILL_CROPS`), any mix, up to `STILL_CAP`. When full, it takes `STILL_WATER` L from the water network it touches at any corner; if the network cannot give the full amount it takes nothing and waits, shown as **Needs water**. The batch then takes `STILL_SECONDS`, sped up by nearby Furnaces only. The fruit is used at the end.

## Recipe

| input | output |
|---|---|
| `STILL_CAP` potato of one variety + `STILL_WATER` L water | 1 Vodka of that variety |
| `STILL_CAP` wheat of one variety + water | 1 Beer of that variety |
| `STILL_CAP` apricot of one variety + water | 1 Brandy of that variety; Klosterneuburger makes Barackpálinka |
| `STILL_CAP` of these crops with more than one crop or variety + water | 1 Mixed spirit |

Quality is the average of the fruit.

## Connections

Joins a water network at any corner of its two tiles ([[systems/water-network]]). Chest input on the left, output on the right; vehicle loading spots above and below; signal input ([[systems/building-io]]).

## Screen

Prompt: **Distill**. State **Needs water** while waiting for water.

## Art

`prop-still.svg`. While working, a bar along the bottom of the footprint shows `progress` ([[features/machines]]).

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `still` cues ([[systems/sound]]).
