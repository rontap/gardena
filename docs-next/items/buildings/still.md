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

Distills fruit into [[items/produce/spirit]], and [[items/produce/rotten-produce]] into [[items/other/weed-spray]]. It needs water from a water network.

## Use

The still holds one load (`PotStill.load`): `empty`, `spirit` (fruit) or `spray` (Rotten produce). The first item put in sets the kind; it refuses the other kind until the batch is put out.

- **Spirit.** Takes [[items/crops/potato]], [[items/crops/wheat]] and [[items/crops/apricot]] fruit (`STILL_CROPS`), any mix, up to `STILL_CAP`. When full, it takes `STILL_WATER` L and runs `STILL_SECONDS`.
- **Weed spray.** Takes Rotten produce of any crop class, up to `STILL_SPRAY_IN`. When full, it takes `STILL_SPRAY_WATER` L and runs `STILL_SPRAY_SECONDS`.

The water comes from the water network it touches at any corner; if the network cannot give the full amount it takes nothing and waits, shown as **Needs water**. The batch is sped up by nearby Furnaces only. The load is used at the end.

## Recipe

| input | output |
|---|---|
| `STILL_CAP` potato of one variety + `STILL_WATER` L water | 1 Vodka of that variety |
| `STILL_CAP` wheat of one variety + water | 1 Beer of that variety |
| `STILL_CAP` apricot of one variety + water | 1 Brandy of that variety; Klosterneuburger makes Barackpálinka |
| `STILL_CAP` of these crops with more than one crop or variety + water | 1 Mixed spirit |
| `STILL_SPRAY_IN` Rotten produce + `STILL_SPRAY_WATER` L water | 1 Weed spray bag of `WEED_SPRAY_BAG` L |

Spirit quality is the average of the fruit. Weed spray has no quality.

## Connections

Joins a water network at any corner of its two tiles ([[systems/water-network]]). Chest input on the left, output on the right; vehicle loading spots above and below take fruit and Rotten produce in, and spirits and Weed spray out; signal input ([[systems/building-io]]).

## Screen

Prompt: **Distill**. State **Needs water** while waiting for water. Holding the kind the load refuses: **Pot still - spirit or Weed spray**.

## Invariants

| id | rule | test |
|---|---|---|
| `still.spray` | `STILL_SPRAY_IN` Rotten produce and `STILL_SPRAY_WATER` L make one `WEED_SPRAY_BAG` L Weed spray bag in `STILL_SPRAY_SECONDS`; a load is fruit or Rotten produce, not both | `machine.test.ts` |

## Art

`prop-still.svg`. While working, a bar along the bottom of the footprint shows `progress` ([[features/machines]]).

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `still` cues ([[systems/sound]]).
