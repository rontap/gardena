# Vehicles

Rects. One concept per file. [[art/svg]] [[art/palette]]

Hangar is industrial shed, not house-language barn. Item face is the same shed, larger. Quad steel ATV, top-down. Tractor fruit-red, top-down. Trailers hitch-front. Silos industrial towers. Dash is chrome, not a tile. Hat `id="hat"` same contract as [[art/actor]].

Cottage + industrial metal. Ink outlines `#1c1710`. No unnamed hex. No text. No width/height on component files. `shape-rendering` crispEdges. 24 units = 1 tile.

## Hangar

| file | viewBox | depicts |
|---|---|---|
| `prop-hangar.svg` | `0 0 72 48` | 3×2 industrial shed, south door |
| `item-hangar.svg` | `0 0 24 24` | same, shop/almanac |

Flat corrugated steel roof, iron ribs, oil eave. Iron vent stack east, no window. Steel walls, iron corrugation. Roller bay south: iron slats, steel tracks, oil handle. No cottage windows. No tiled `#8b3a2a` roof. No cupola. Ink outlines. No text.

## Quad

| file | viewBox | depicts |
|---|---|---|
| `prop-quad.svg` | `0 0 24 24` | top-down ATV, faces +x |

Steel body, iron fenders / racks, oil engine. Ink tires, steel hubs. Not dirt-wood, not roof fenders.

`id="hat"` wraps seat + helmet. Band `#6b4423`, outline `#1c1710` outside the group. Farm driver hat is atlas `actor-hat` tint — [[art/actor]]. Parked default straw gold.

## Tractor

| file | viewBox | depicts |
|---|---|---|
| `prop-tractor.svg` | `0 0 24 24` | top-down tractor, faces +x |
| `item-tractor.svg` | `0 0 24 24` | hangar/almanac face |

Red body `#c43c3c`. Iron/steel wheels. Oil engine at +x. Hitch tongue at −x. Ink outlines.

`id="hat"` wraps seat fill, same contract as quad. Band `#6b4423`, outline `#1c1710` outside the group.

## Trailers

Faces +x. Front = hitch (right of viewBox). 1×1 tiles.

| file | viewBox | depicts |
|---|---|---|
| `prop-trailer-seed.svg` | `0 0 24 24` | seeding trailer, hopper, hitch +x |
| `prop-trailer-spray.svg` | `0 0 24 24` | spraying trailer, tank, hitch +x |
| `prop-trailer-harvest.svg` | `0 0 24 24` | harvesting trailer, crate bed, hitch +x |
| `prop-trailer-rake.svg` | `0 0 120 8` | 5-wide source; view scales width by boom/5 |
| `item-trailer-seed.svg` | `0 0 24 24` | hangar/almanac |
| `item-trailer-spray.svg` | `0 0 24 24` | |
| `item-trailer-harvest.svg` | `0 0 24 24` | |

Steel body, iron chassis / hitch, oil underbody. Seed hopper leaf lid. Spray tank water band. Harvest crate dirt bed. Ink tires, steel hubs. No text.

## Silos

2×3 industrial tower, south door. Not the starter 1×2 seed silo.

| file | viewBox | depicts |
|---|---|---|
| `prop-silo-seed.svg` | `0 0 48 72` | seeding silo, leaf band, south door |
| `prop-silo-spray.svg` | `0 0 48 72` | spraying silo, water band, south door |
| `prop-silo-produce.svg` | `0 0 48 72` | produce silo, fruit-red band, south door |
| `item-silo-seed.svg` | `0 0 24 24` | shop/almanac |
| `item-silo-spray.svg` | `0 0 24 24` | |
| `item-silo-produce.svg` | `0 0 24 24` | |

Steel drum, iron ribs / legs, oil eave, iron south door. Ink outlines. Map paints native 2×3 (`TILE/24`) at origin. Occupancy 2×3. Drum mid-icon below the color band: seed (teardrop grain, leaf/dirt), fertilizer (small bag, leaf fill), fruit (round fruit-red/ripe). Colored bars stay.

## Dash

`ui-dash-quad.svg`, `0 0 240 64`. Chrome of `ui-btn-pause` (ink frame, house fill, dirt cap, dirt-dark studs, dirt footer). Not a tile. Gauge plates steel. Not full-circle dials.

Fuel left, speed mid: limited ticks + short chord, not a circle well. Steer right: small widget. Water tick = fuel full. Ripe tick = +vMax. Dirt-dark = empty / reverse. No letters.

House-fill patches for HTML (ui-ux overlay), empty of ticks/needles:

| | viewBox | |
|---|---|---|
| fuel number | `13 38 70×14` | left, under fuel chord |
| speed number | `85 38 70×14` | mid, under speed chord |

View rotates groups about the pivot. `0°` = 12 o'clock.

| id | pivot | |
|---|---|---|
| `fuel-needle` | `48 34` | fuel `0` = −45°, `1` = +45° |
| `speed-needle` | `120 34` | speed `0` = 0°, `+vMax` = +36°, `−vMax` = −36° (same short arc, negative) |
| `steer` | `192 34` | steer `−1` = −90°, `0` = 0°, `+1` = +90° |

Speed arc ends at `+vMax`, not paved/machinery cap. Reverse is the same arc negative, not a separate tick-only mark. Quad dash unchanged.

`ui-dash-tractor.svg`, `0 0 240 64`. Same chrome/needle contract as `ui-dash-quad` (same ids, pivots, fuel/speed patches). Extra house-fill patch **used-readout** `208 38 30×14` for HTML `{used}/100`.

## Pad / slot

`ui-hangar-return.svg`, `0 0 24 24`. South pad mark. Ripe arrow, ink outline, points north into the door. No button groups. Reuse on silo pads.

`ui-pad-drop.svg`, `0 0 24 24`. Machine dropoff. Steel arrow, iron dock, oil bay. Points south into the building. No baked opacity.

`ui-pad-take.svg`, `0 0 24 24`. Machine takeup. Steel arrow, iron dock, oil bay. Points north out of the south face. Not hangar-return. No baked opacity.

`ui-slot-down.svg`, `0 0 24 24`. Down arrow for consume hopper. Ripe fill, ink outline. Points south.

## Paint

Tractor 1×1 at center, rotate heading. Pivot tile center. Same as Quad. Atlas sprite. Follow-cam is farm pivot, not a dummy, not an SVG transform.

Attached trailer 1×1, front on `hitchP`, rotate trailer heading. Pivot tile center.

Rake is view-only at trailer rear (opposite hitch): `trailerCenter − (TRAILER_LEN/2)·heading`. `prop-trailer-rake.svg` stays the 5-wide source (`0 0 120 8`). Do not add a 3-wide file. View scales width by `boom / 5`. Paint width = boom tiles × 24. Long axis perp heading. Same rake all three trailer kinds. Not a Cell. Not logged. Boom OBB follows tractor.boom `3 | 5`.

Quad unchanged.

Assumption: tractor and trailer are 1×1 tiles (fill-size like Quad); rake is view-only. Tractor speed needle maps `±TRACTOR_VMAX` to the same ±36° arc. Pad-mark opacity is view, not SVG.
