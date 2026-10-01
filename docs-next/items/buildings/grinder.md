# Grinder

| | |
|---|---|
| SKU | `buy-grinder` (Build tab `automation`) |
| price | `SKUS['buy-grinder'].price` |
| size | 1 × 1 |
| unlocked by | `unlock-grinder` |
| demolish | yes |
| cell kind | `'grinder'` |
| recipe kind | `work`, locked ([[features/machines]]) |

Turns fruit back into seeds of the same crop and variety.

## Use

Takes fruit of any crop, annual or tree. The first fruit fixes the crop and variety. Each fruit takes `GRIND_WORK` seconds, sped up by the `machinery` skill and nearby Furnaces. Quality is averaged over the fruit put in.

## Recipe

| input | output |
|---|---|
| 1 fruit of an annual crop | `grindMinAt(quality)` to `GRIND_MAX` seeds of that crop and variety, rolled on the `grind` stream; the minimum rises from `GRIND_MIN` at quality 0 to `GRIND_MAX` at quality 1; seeds keep the fruit's quality |
| 1 tree fruit | 1 Plain tree seed of that species, with the fruit's quality |

## Connections

Chest input on the left, output on the right. Vehicle loading spots: fruit is unloaded into it from above; seeds and tree seeds it put on the ground below are loaded from below. Signal input: while on, grinding stops; filling continues ([[systems/building-io]], [[systems/signals]]).

## Screen

Prompt: **Grind**. Hover shows **{n} → seeds**.

## Art

`prop-grinder.svg`. While working, a bar along the bottom of the footprint shows `progress` ([[features/machines]]).

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `grinder` cues ([[systems/sound]]).
