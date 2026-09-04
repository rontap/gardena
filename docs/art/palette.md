# Palette

Cottage tokens. Preference. Asset SVGs use these hexes, plus industrial metal where named. No unnamed hex.

| token | hex | use |
|---|---|---|
| grass | `#4a7c3f` | untilled tile fill |
| grass-dark | `#3a6232` | clumps on grass tiles |
| dirt | `#8a5a32` | empty plot; UI studs |
| dirt-dark | `#6b4423` | planted / clod under crop |
| water | `#3d7ea6` | pump, water marks |
| leaf | `#6bc04a` | plants |
| ripe | `#d4a017` | gold ready (wheat, carrot) |
| fruit-red | `#c43c3c` | red fruit (tomato, raspberry, apple) |
| grape | `#6b1f8c` | common grape |
| blush | `#d4788c` | rare apricot |
| ink | `#1c1710` | outlines; UI rails |
| house | `#cfc6b0` | walls; panel fill |
| roof | `#8b3a2a` | house; UI header / corner |
| fire | `#e04610` | furnace flame |
| tier-1 | `#3d7ea6` | contract difficulty dot, 1 |
| tier-2 | `#2a9d8f` | contract difficulty dot, 2 |
| tier-3 | `#e07b18` | contract difficulty dot, 3 |
| tier-4 | `#e23b2e` | contract difficulty dot, 4 |

`src/index.css` `@theme` `--color-*` matches these except `fruit-red` and `fire` (SVG only).

## Industrial

Vehicle / machine metal only. Not cottage. Do not replace cottage tokens. Ink outlines stay `#1c1710`. Not inspect bars.

| token | hex | use |
|---|---|---|
| steel | `#8a9198` | galvanized sheet; hangar walls / roof; quad body |
| iron | `#4c4844` | structural; corrugation; roller door; chassis |
| oil | `#2c322c` | grease; tracks; underbody |

SVG only, like `fruit-red`. Not `@theme`.

## Inspect bars

Separate bar palette. Never in `src/assets/*.svg`. Inspect `STAT_COLOR` / `GROWTH_BLUE` / `GROWTH_EMPTY` / notch. Layout: [[ui/inspect]].

| token | hex | use |
|---|---|---|
| good | `#4f9d69` | ideal range |
| mid | `#d69a3a` | acceptable |
| bad | `#c9574b` | bad |
| growth | `#4b91c2` | growth fill |
| empty | `#8b887d` | growth remainder |
| notch | `#fff6d5` | current-value marker |

## Assets

Cottage hex, plus industrial metal on vehicle/machine assets. No bar hex. No `currentColor`. No text. `shape-rendering="crispEdges"`. 24-unit tile grid — [[art/svg]]. No raster.

Tree ripe variety fruit reuses fruit-red, roof, ripe, blush, grape. No new hex.

Assumption: industrial tokens stay SVG-only. `fire` is SVG-only, like `fruit-red`.
