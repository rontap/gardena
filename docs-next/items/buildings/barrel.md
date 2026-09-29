# Barrel

| | |
|---|---|
| SKU | `buy-barrel` (Build tab `automation`) |
| price | `SKUS['buy-barrel'].price` |
| size | 1 × 1 |
| unlocked by | `unlock-fermentation` |
| demolish | yes |
| cell kind | `'barrel'` |
| recipe kind | `age`, locked, by hand only ([[features/machines]]) |

Ages grapes into wine and apples into cider ([[items/produce/cask]]).

## Use

Filled by hand only: no chest input, no vehicle loading spots, no signal input. The first fruit fixes the crop and variety. It takes fruit until it holds the batch (`barrelNeed`: 5 grapes or 4 apples).

A full barrel ages. After `BARREL_MATURE` seconds it can be collected; quality is fixed then as the average of the fruit. It keeps aging, and the bottle's value rises until `BARREL_MATURE` + `BARREL_AGE` ([[items/produce/cask]]).

**Collect {name}** with an empty hand, or with a stack of the same cask and variety that has room, gives 1 bottle and empties the barrel.

```
  fill by hand          full                    mature                    top value
  ------------> [ 0 .. need ] ---- ages ----> BARREL_MATURE ---- ages ----> BARREL_MATURE + BARREL_AGE
                                                   |  collect any time from here: 1 bottle
```

## Recipe

| input | output |
|---|---|
| 5 [[items/crops/grape]] of one variety | 1 Wine; Kéknyelű: Premium wine |
| 4 [[items/crops/apple]] of one variety | 1 Cider; Pink Lady: Premium cider |

## Screen

Prompts: **Fill barrel**; **Collect {name}** once mature.

## Art

`prop-barrel.svg`.

## Sound

Putting an item in plays the machine load sound. Aging pushes the `barrel` working cue, and reaching `BARREL_MATURE` pushes its batch cue ([[systems/sound]]).
