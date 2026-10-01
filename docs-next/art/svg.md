# SVG

Code: `view/atlas.ts` (map textures), `view/svgs.ts` (panel and HUD art), `src/assets/`; see [[code-map]].

## Where art goes

| folder | holds | prefix |
|---|---|---|
| `crops/` | annual crops on a plot, weeds, turf | `crop-` |
| `fruits/` | harvested fruit | `fruit-` |
| `items/` | items in the hand, inventory, Build cards | `item-` |
| `props/` | buildings, trees, rocks, burrows, vehicles on the map | `prop-` |
| `tiles/` | ground and paving | `tile-` |
| `joints/` | pipe and fence pieces, drawn by fit | `pipe-`, `fence-` |
| `vfx/` | animated effects ([[art/vfx]]) | `vfx-` |
| `ui/` | HUD, buttons, panel pictures, cursor, weather and phase glyphs | `ui-` |
| `skills/` | Family portraits, skill icons, standing icons | `portrait-`, `skill-`, `stat-` |
| `market/` | company marks | `company-` |

A thing on the map has an `item-` face and a `prop-` face. The item face is the same object as the prop, drawn larger to fill 24 × 24; it is not the prop shrunk.

Map art is rasterized into the atlas (`atlas.ts`): each `(file, group id)` becomes one texture, drawn at `SCALE` 2 with nearest-neighbour filtering. Panels and the HUD mount the SVG markup through `svgs.ts` and select groups by id. Both read the same files.

## File rules

- `viewBox` set, integer coordinates, no `width` or `height`, no editor metadata.
- `shape-rendering="crispEdges"`.
- Every colour is a token from [[art/palette]]. No `currentColor`, no text, no raster images.
- `fill-opacity` only in `vfx-` files.
- One concept per file.

## Tile grid

One tile is 24 viewBox units and is drawn 48 px on screen, so one unit is 2 px.

| footprint | viewBox |
|---|---|
| 1 × 1 tile, crop, fruit, item, actor | `0 0 24 24` |
| 1 wide × 2 tall: tree, furnace | `0 0 24 48` |
| 2 × 1: pump, still, research station | `0 0 48 24` |
| 2 × 2: mill, infuser, Necronomicon | `0 0 48 48` |
| 2 × 3: field silos | `0 0 48 72` |
| 3 × 2: hangar | `0 0 72 48` |
| 4 × 3: house | `0 0 96 72` |

The drawn shape may be smaller than the footprint (the still is drawn 1.5 tiles wide, centred; the furnace 1.5 tiles tall, standing on the south edge), but the viewBox is the footprint. Panel art (`ui-menu`, `ui-recap-night`, `ui-market-stall`, rails, corners, dashboards) is not on the tile grid and has its own viewBox.

## Groups

A file with several states draws each as a sibling `<g id>`. The atlas makes one texture per group and the code picks one; mounting a whole multi-group file in a panel paints every state at once, so panels select by id too.

| state | group ids | used by |
|---|---|---|
| growth | `sprout`, `grow`, `dead`, then one ripe group per variety | `crop-*` |
| tree growth | `trunk` (stump), `grow` (sapling), `unripe`, then one ripe group per variety | `prop-*-tree` |
| variety | `base`, `variant`, `heirloom` | `fruit-*`, `item-graft-*`, wine and cider faces |
| working | `off`, `on` | furnace, infuser, research station, refueling station, Necronomicon, postbox, most sensors |
| reading | `red` / `blue`, `red` / `ok` | water sensor, fertilizer sensor |
| count | `s0` … `s4` | Counter |
| mode | `or`, `and` | Logic gate |
| button | `idle`, `hover`, `selected`, `disabled` | `ui-btn-*`, chosen with `btnFace` |
| frames | `f0` … `f7` | `vfx-*` ([[art/vfx]]) |
| part | `body`, `sails` | `prop-mill`; the view turns `sails` |
| part | `hat` | actor, quad, tractor: tinted per player |

The variety groups follow [[art/variants]]. A file carries exactly the groups the code asks for: a missing group stops the atlas from loading, and a spare group is art no player can reach (`view.groups` in `atlas.test.ts`).

## Drawing rules

- **Drawn for the map scale.** Nothing narrower than 4 units: at 2 px per unit, thinner parts blur into each other. A prop is drawn for the map, not copied from its item face with thinner parts.
- **Outline the silhouette, not every part.** One ink mass per part, large enough to read against grass; detail inside it is carried by fill changes. Outlining each small rect separately makes a tangle of black frames.
- **Two objects in one system differ in silhouette, not only colour.** The chest is brown with a domed lid and a centre latch; the freezer is a low steel cabinet whose lid overhangs. The bucket is a tall tapered pail with a handle; the large bucket a wide straight tub with side lugs. The Mill is a solid tapered tower with a cap and sails; the Grinder a low iron drum with a crank.
- **One perspective per file.** Ground, vehicles and trailers are top-down; freestanding props are a flat front view. Never both in one file.
- **The state is on the prop.** A machine or sensor that is on shows it in its own `on` group; motion goes in a VFX over the prop, never a third prop group.

## Kinds

| kind | look |
|---|---|
| cottage buildings: house, stores, chest, tap, well, mill, jam machine, barrel, research station | `house` walls, `roof` tiles or copper, `dirt` wood. Water fixtures (tap, well) are cottage, not industrial |
| machines | cottage body; copper reads as `roof`, cold parts, condensers and glass read as `water`. The still, furnace and infuser carry industrial metal for their structure |
| vehicles, hangar, field silos, Pumpjack | industrial: `steel`, `iron`, `oil`. Quad steel, Tractor `fruit-red`; vehicles face +x, trailers hitch at the front |
| sensors and logic | industrial and sunk into the ground: dark body, bright identifier, steel port nubs; an output nub is `fruit-red` when off and `water` when on |
| crops and trees | `leaf` / `grass` / `grass-dark` plants; the variety shows in the fruit only, never in a leaf tint ([[art/variants]]) |
| gardener | `actor.svg`, one pose, straw hat, `roof` shirt, `water` overalls; the `hat` group is tinted per player (`HAT` in `atlas.ts`): seat 0 straw gold, seats 1 to 3 pink, cyan and violet, off the palette on purpose so players tell each other apart on grass |
| company marks | `0 0 24 24` pixel marks in two or three palette tokens |
| HUD glyphs | weather and phase glyphs `0 0 16 16`, readable at 20 px on `house` |
| browser icon | `public/favicon.svg`, `0 0 16 16`: a tomato in `fruit-red` with an `ink` outline, `roof` shade on the lower right, a `house` glint, and a `leaf` and `grass-dark` calyx and stem. `apple-touch-icon.png` (180 px, on `house`) and `icon-512.png` (512 px, transparent) are its rects drawn at 10 and 30 px per unit; redraw them when the SVG changes |

Pad marks on the map (vehicle load and unload, refuel, hangar return) are drawn without opacity; the view sets it.

The cursor (`ui/ui-cursor.svg`, groups `walk`, `dig`, `water`, `gather`, `tune`, `bright`, `wire`) is one arrow shape in every group, filled with two to four shades of that group's colour; `cursor.ts` draws it at `SIZE` × `SIZE` px with the hotspot at `HOT`, the arrow's tip.

## When you change this

- A new state for an asset: a group in the file, the key in `atlas.ts` or the selector in `svgs.ts`, and `atlas.test.ts` still passing.
- A new colour: [[art/palette]] first.
- A new asset: check it on `#atlas` at map scale before wiring it ([[systems/debug-pages]]).
