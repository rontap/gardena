# Tilled edges

Tilled plots keep the dirt texture continuous across adjacent tilled cells (`tile-dirt-0.svg` / `tile-dirt-1.svg`, [[art/palette]] `dirt` / `dirt-dark`).

At every boundary with non-tilled ground, a rotated `tile-dirt-edge.svg` dirt-lip marks the raised transition. The lip overhangs its 24-unit source grid so plot boundaries do not read as hard boxes.

U-turn corners receive `tile-dirt-inset.svg` where three quadrants are tilled and the missing diagonal quadrant is non-tilled.

SVG rules: [[art/svg]].

## Atlas

Atlas must keep the overhang. Raster `EDGE_PAD` 4 (preference) around `tile-dirt-edge` / `tile-dirt-inset`. Wrap viewBox `-4 -4 32 32`. Do not clip to `0 0 24 24`. 2× nearest — [[architecture/view]].

Assumption: source SVGs keep `viewBox="0 0 24 24"`; paths already paint outside that box; atlas wrap is the pad.

## Placement

24-unit content still fills the cell. Lip / inset paint onto the neighbour. Edge rotates about the cell centre; inset sits on the missing-quadrant corner. Pad travels with the sprite.
