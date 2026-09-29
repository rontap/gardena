# Furnace

| | |
|---|---|
| SKU | `buy-furnace` (Build tab `automation`) |
| price | `SKUS['buy-furnace'].price` |
| size | 1 × 2 |
| unlocked by | `unlock-furnace` |
| demolish | yes |
| cell kind | `'furnace'` |
| recipe kind | `fixed`; pooled for ash, locked for bread ([[features/machines]]) |

Burns waste into [[items/other/ash]] or bakes [[items/produce/flour]] into [[items/produce/bread]]. While burning it speeds up nearby machines.

## Use

The Furnace runs one of two recipes at a time, set by the first item put in:

- **Burn** (ash): any burnable item adds points (`FURNACE_VALUE`), up to `FURNACE_CAP` points. Every `FURNACE_NEED` points burn in `FURNACE_SECONDS` into `FURNACE_ASH` ash.
- **Bake** (bread): flour, up to `FURNACE_CAP`. Each `FURNACE_BREAD_IN` flour bakes in `FURNACE_SECONDS` into 1 bread with the flour's averaged quality.

It refuses flour while burning and burnable items while baking, until it is empty.

## Recipe

| input | points each (`FURNACE_VALUE`) |
|---|---|
| seeds, tree seeds, grafts, [[items/produce/rotten-produce]], dead plants, [[items/other/pulled-weed]], [[items/other/cut-grass]] | `green` |
| fruit (any crop) | `fruit` |
| [[items/produce/sugar]] | `fruit` per litre |
| [[items/produce/oil]] | `oil` |
| [[items/produce/spirit]] | `spirit` |
| [[items/other/wood]] | `wood` |
| [[items/other/fly-agaric]] | `fly-agaric` |

`FURNACE_NEED` points → `FURNACE_ASH` [[items/other/ash]]. `FURNACE_BREAD_IN` [[items/produce/flour]] → 1 [[items/produce/bread]].

## Speed-up area

While burning or baking, the Furnace adds `FURNACE_HASTE` to the speed of every other machine with a tile within `FURNACE_REACH` tiles (Chebyshev distance) of either of its tiles. Speed-ups from several Furnaces add up ([[features/machines]]).

```
  r r r r r r r
  r r r r r r r
  r r r r r r r
  r r r F r r r      F = Furnace (2 tiles), r = within FURNACE_REACH
  r r r F r r r
  r r r r r r r
  r r r r r r r
  r r r r r r r
```

Placing a Furnace, or hovering a placed one, outlines this area on the map.

## Connections

Chest input on the left of the bottom tile, output on the right; vehicle loading spots above and below; signal input (stops it) and signal output (on when it holds nothing to burn) ([[systems/building-io]], [[systems/signals]]).

## Screen

Prompts: **Burn**, **Bake** with flour in hand.

## Art

`prop-furnace.svg`, groups `off` and `on`.

## Sound

Putting an item in plays the machine load sound. Working and a batch put out push the `furnace` cues ([[systems/sound]]).
