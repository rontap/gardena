# Palette

Cottage tokens. Preference. Asset SVGs use only these hexes. No new hex.

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

`src/index.css` `@theme` `--color-*` matches these except `fruit-red` (SVG only).

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

Cottage hex only. No bar hex. No `currentColor`. No text. `shape-rendering="crispEdges"`. 24-unit tile grid — [[art/svg]]. No raster.
