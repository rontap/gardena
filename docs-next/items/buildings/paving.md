# Paving

| | |
|---|---|
| Build tab | `building` |
| unlocked by | `unlock-landscaping` |
| placed on | untilled ground without a burrow, or under a placed building (not rock or a tree) (`isPavingSite`) |
| demolish | **Demolish paving** |

A decorative layer on untilled ground. Stored in `World.paving`, beside the tile, not in it; the ground under it keeps its type.

## Kinds

| | Asphalt | Paving slab | Brickwork | Cobblestone |
|---|---|---|---|---|
| SKU | `buy-tile-asphalt` | `buy-tile-paved` | `buy-tile-brick` | `buy-tile-cobble` |
| tile id | `asphalt` | `paved` | `brick` | `cobble` |

The Paving tool stays selected after placing. Vehicles drive at `SURFACE_PAVED` × their top speed on Asphalt and Paving slab; Brickwork and Cobblestone do not change vehicle speed ([[items/other/vehicles]]).

## Art

`src/assets/tiles/`.
