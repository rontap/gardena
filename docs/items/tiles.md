# Paving and fencing

Cosmetic building. Both keep `ground` and both stay armed while placing — click as many cells as money allows, Esc or **Cancel** to stop. Shop tab **Building**. Delete tool removes them.

## Paving

`TileId`: `asphalt` `cobble` `brick` `paved`.

**Paving is its own layer, not a `Cover`.** `World.paving` is a `Map<"col,row", TileId>`, the same shape `World.fences` already has. It was a `Cover` on the plot, which meant `setCell` destroyed it the moment a building landed on the cell and deleting that building left bare soil. A slab you laid is yours until you lift it.

`buy-tile-asphalt` $2, `buy-tile-cobble` $5, `buy-tile-brick` $7, `buy-tile-paved` $11. All unlock `unlock-landscaping` — [[mechanics/research]].

Site: `isPavingSite` — any `untilled` cell, **or** a solid building cell. Paving over paving replaces it. Refused on tilled or planted soil, on a burrow, on a rock and on a tree: you pave under what you built, and around what was already there.

Ground art is `BUILDING_TILES` (`groundSig` no longer carries it; `World.bumpGround` marks the ground dirty on lay and lift). The held / shop / almanac face is `TILE_ICON` (`item-{tile}.svg`).

Delete order on one cell is fence, then building, then paving. The thing standing on the cell goes first and a second click lifts the slab. Prompt **Delete paving**.

`paved` and `asphalt` drive at `SURFACE_PAVED`; `cobble` and `brick` stay `SURFACE_NORMAL` — [[mechanics/vehicles]]. `surfaceMul(world, at)` reads the paving map, not the cell.

### Edges

Every paved cell paints `tile-kerb` on each side whose neighbour is not the same tile: a one-unit ink line at the cell edge and a `dirt-dark` lip overhanging into the neighbour. Same `EDGE_PAD` raster as the tilled lip — [[art/tilled-edges]]. One kerb serves every `TileId`, so a slab patio and an asphalt yard meeting each other each keep their own outline.

### Art

| tile | is |
|---|---|
| `tile-paved` | offset flagstones in `house` and `slab`, ink joints, `dirt` grit; the courses line up across cells so a yard reads as one pavement |
| `tile-asphalt` | `iron` tarmac, `oil` patches, `steel` aggregate, ink chips |
| `tile-cobble` | irregular cobbles, `dirt-dark` joints |
| `tile-brick` | running-bond `roof` brick |

Asphalt is the one ground that takes industrial metal — it is a road surface, not a cottage floor. [[art/palette]]

## Wooden fence

`buy-fence` $8, unlock `unlock-landscaping`.

Not a `Cover`. `World.fences` is a `Set` of `"col,row"`, like `segments` / `sprinklers`. Fence sits in the **middle** of a tile, not on an edge.

Site: `isFenceSite` — any `untilled` plot, including grass and paving. One per cell. Blocked prompts: **Fences need untilled ground**, **Already fenced**.

Art joins to the four orthogonal neighbours through `fenceFit(n, e, s, w)` — same shape as `pipeFit`, but a lone fence is a post rather than `undefined`: `fence-post` `fence-stub` `fence-i` `fence-l` `fence-t` `fence-x`, rotated.

Fences do not block movement. Cosmetic only.

Delete → `fences.delete`. Prompt **Delete wooden fence**. Fence wins over paving and over the building when all three sit on the cell.

## Invariants

`tiles.paving` — Paving is `World.paving`, not a `Cover`. It survives under a building and is deleted only once nothing stands on the cell: fence, then building, then paving.

`tiles.paving-site` — Paving lays on any untilled cell or under a solid building, never on tilled soil, a burrow, a rock or a tree. Paving over paving replaces it.
