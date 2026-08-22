# Tilled edges

Tilled plots keep the dirt texture continuous across adjacent tilled cells (`tile-dirt-0.svg` / `tile-dirt-1.svg`, [[art/palette]] `dirt` / `dirt-dark`).

At every boundary with non-tilled ground, a rotated `tile-dirt-edge.svg` dirt-lip marks the raised transition. The lip may overhang its 24-unit source grid so plot boundaries do not read as hard boxes.

U-turn corners receive `tile-dirt-inset.svg` where three quadrants are tilled and the missing diagonal quadrant is non-tilled.

SVG rules: [[art/svg]].
