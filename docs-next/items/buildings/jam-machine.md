# Jam machine

| | |
|---|---|
| SKU | `buy-jam` (Build tab `automation`) |
| price | `SKUS['buy-jam'].price` |
| size | 1 × 1 |
| unlocked by | `unlock-preservatives` |
| demolish | yes |
| cell kind | `'jam'` |
| recipe kind | `work`, locked ([[features/machines]]) |

Makes jars of [[items/produce/jam]] from fruit and sugar.

## Use

The first fruit put in fixes the crop and variety; until the machine is empty it takes only more of that crop and variety. It takes every fruit offered. Sugar goes into a separate store of up to `JAM_BUFFER` L.

A jar starts when the machine holds `JAM_IN` fruit and the jar's sugar. It takes `JAM_SECONDS`, sped up by the `machinery` skill and nearby Furnaces. The jar's quality is the average quality of the fruit put in; sugar quality is not used.

## Recipe

| fruit | sugar per jar | output |
|---|---|---|
| `JAM_IN` [[items/crops/apricot]], [[items/crops/grape]], [[items/crops/raspberry]] or [[items/crops/cherry]] | `JAM_SUGAR` L [[items/produce/sugar]] | 1 jar of that crop's jam |
| `JAM_IN` Plain or Green Zebra [[items/crops/tomato]] | `KETCHUP_SUGAR` L | 1 Ketchup |
| `JAM_IN` San Marzano tomato | none | 1 Passata |

Jar names for every crop and variety: [[items/produce/jam]].

## Connections

Chest input on the left, output on the right; vehicle loading spots above and below; signal input ([[systems/building-io]], [[systems/signals]]).

## Screen

Prompts: **Make jam**, or **Make {jar name}** for a jar with its own name; **Fill sugar** with sugar in hand.

## Art

`prop-jam.svg`.

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `jam` cues ([[systems/sound]]).
