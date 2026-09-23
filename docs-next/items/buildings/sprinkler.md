# Sprinkler

| | |
|---|---|
| placed on | a tile corner on a water network |
| Build tab | `automation` |
| demolish | yes |

Waters every growing plot and tree in its area from its water network.

## Kinds

| | Sprinkler | Vertical sprinkler | Large sprinkler |
|---|---|---|---|
| SKU | `buy-sprinkler` | `buy-sprinkler-vert` | `buy-sprinkler-large` |
| unlocked by | `unlock-auto-irrigation` | `unlock-adv-irrigation` | `unlock-adv-irrigation` |
| area | 2 × 2 | 2 × 4, rotatable (north-south or east-west) | 4 × 4 |

Areas around the corner `+` it is placed on (`aoe`); each `x` is a tile, `+` sits where four tiles meet:

```
 Sprinkler       Vertical (ns)     Vertical (ew)        Large

                    x x                                 x x x x
                    x x              x x x x            x x x x
   x x               +                  +                  +
   x x              x x              x x x x            x x x x
                    x x                                 x x x x
```

## Use

- It pours on each growing plot and each tree in its area, a tree once even if both its tiles are covered. It does not pour on ripe, dead or empty plots. Without any growing plot or tree in its area, or with no water in its network, it pours nothing.
- Default amount: `SPRINKLER_TILE_DAY` litres per tile per day, which is more than any crop uses.
- After `unlock-smart-irrigation`: **Tune sprinkler** opens **Sprinkler output**, a slider from 0 to `SPRINKLER_TILE_DAY` L/day per tile in steps of `SPRINKLER_STEP`. It also gains a signal input: wired, it pours only while the input is on ([[systems/signals]]).

## Art

`prop-sprinkler.svg`, `prop-sprinkler-vert.svg`, `prop-sprinkler-large.svg`; pouring shows a VFX.
