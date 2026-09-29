# Palette

Code: `src/index.css` (`@theme`, the colours panels use), the SVG files in `src/assets/`, colour constants in `view/layers/overlay.ts` and `ui/status.tsx`; see [[code-map]].

The game has one cottage palette. An asset or a panel uses only colours from the tables on this page, by name. A colour listed as "SVG only" is not in `@theme`, so panels cannot use it.

## Cottage

| token | hex | used for | in `@theme` |
|---|---|---|---|
| `grass` | `#4a7c3f` | untilled ground | yes |
| `grass-dark` | `#3a6232` | clumps on grass, tree canopy | yes |
| `dirt` | `#8a5a32` | tilled plot, wood, UI studs | yes |
| `dirt-dark` | `#6b4423` | soil under a crop, shadows of wood, hat bands | yes |
| `water` | `#3d7ea6` | water, glass, cold metal, an output that is on, the postbox flag when mail is waiting | yes |
| `leaf` | `#6bc04a` | plants | yes |
| `ripe` | `#d4a017` | ripe gold (wheat, carrot), energy, highlights | yes |
| `fruit-red` | `#c43c3c` | red fruit, an output that is off, the Tractor | SVG only |
| `grape` | `#6b1f8c` | grapes, the Necronomicon | yes |
| `blush` | `#d4788c` | apricot cheek, pink varieties | SVG only |
| `ink` | `#1c1710` | outlines, UI rails, text | yes |
| `house` | `#cfc6b0` | walls, panel fill, glints | yes |
| `slab` | `#b7ae99` | the shaded face of a paving stone and a Necronomicon page | SVG only |
| `roof` | `#8b3a2a` | roofs, copper, UI header | yes |
| `fire` | `#e04610` | the Furnace flame | SVG only |

## Panel only

| token | hex | used for |
|---|---|---|
| `parch` | `#ded7c4` | text fields and checkboxes |
| `study` | `#24487a` | research progress in the research station panel |
| `tier-1` … `tier-4` | `#3d7ea6`, `#2a9d8f`, `#e07b18`, `#e23b2e` | contract difficulty dots |
| `lens-bad`, `lens-good`, `lens-done` | `#e23b2e`, `#2fd15a`, `#1e9be6` | the map views' colours and their swatches ([[shell]]) |

## Stone and paving

SVG only, for the tiles and props named.

| token | hex | used for |
|---|---|---|
| `stone-lit`, `stone`, `stone-mid`, `stone-dark` | `#a79681`, `#897861`, `#685b4b`, `#463e34` | rocks (`prop-rock*`): lit face, body, face turned away, cleave |
| `cobble-lit`, `cobble`, `cobble-mid`, `cobble-dark` | `#d4d0c4`, `#c4c0b4`, `#a8a394`, `#8a867c` | cobble paving; `cobble-dark` also a Necronomicon page |

A rock never takes a soil colour: it has to read apart from the ground around it at a glance.

## Industrial

SVG only, for vehicles, the hangar, field silos, the Pumpjack, sensors, and the metal parts of the still, furnace and infuser. Outlines stay `ink`.

| token | hex | used for |
|---|---|---|
| `steel` | `#8a9198` | sheet metal, vehicle bodies |
| `iron` | `#4c4844` | structure, chassis, corrugation |
| `oil` | `#2c322c` | grease, tyres, underbody, a sensor body |

## Inspect bars

Only in the bars of the inspect column (`STAT_COLOR`, `GROWTH_BLUE`, `GROWTH_EMPTY` in `status.tsx`), never in an SVG.

| token | hex | used for |
|---|---|---|
| good | `#4f9d69` | green range |
| mid | `#d69a3a` | orange range |
| bad | `#c9574b` | red range |
| growth | `#4b91c2` | growth fill |
| empty | `#8b887d` | growth remainder |

## Off the palette

The four player hat colours (`HAT` in `atlas.ts`) are the only colours outside these tables, chosen to stand out on grass ([[art/svg]]).

## Type

Panel text uses two faces from `@theme`: `font-display` (Press Start 2P) for titles and the wordmark, `font-body` (Nunito) for everything else, on the `text-xs` … `text-5xl` steps defined there.

## Decisions

- `slab` exists because a paving stone needs two faces to read as laid stone, and the second has to stay close to `house` to read as the same material.
- Variety fruit on trees reuses `fruit-red`, `roof`, `ripe`, `blush` and `grape`; no colour was added per variety.
