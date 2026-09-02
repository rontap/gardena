# Paving and fencing

Cosmetic building. Both keep `ground` and both stay armed while placing — click as many cells as money allows, Esc or **Cancel** to stop. Shop tab **Building**. Delete tool removes them.

## Paving

`TileId`: `cobble` `brick` `paved`. Lives in `Cover` as `{ kind: 'tile'; tile }` on an `untilled` plot.

`buy-tile-cobble` $5, `buy-tile-brick` $7, `buy-tile-paved` $11. All unlock `unlock-landscaping` — [[mechanics/research]].

Site: `isTileSite` — `untilled` with `bare` or `tile` cover. Paving over paving replaces it. Ground art is `BUILDING_TILES` (baked, `groundSig`); the held / shop / almanac face is `TILE_ICON` (`item-{tile}.svg`).

Delete → `cover: { kind: 'bare' }`. Prompt **Delete paving**.

Walking speed is not affected yet.

## Wooden fence

`buy-fence` $8, unlock `unlock-landscaping`.

Not a `Cover`. `World.fences` is a `Set` of `"col,row"`, like `segments` / `sprinklers`. Fence sits in the **middle** of a tile, not on an edge.

Site: `isFenceSite` — any `untilled` plot, including grass and paving. One per cell. Blocked prompts: **Fences need untilled ground**, **Already fenced**.

Art joins to the four orthogonal neighbours through `fenceFit(n, e, s, w)` — same shape as `pipeFit`, but a lone fence is a post rather than `undefined`: `fence-post` `fence-stub` `fence-i` `fence-l` `fence-t` `fence-x`, rotated.

Fences do not block movement. Cosmetic only.

Delete → `fences.delete`. Prompt **Delete wooden fence**. Fence wins over paving when both sit on the cell.
