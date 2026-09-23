# Vehicles

| | |
|---|---|
| obtained from | bought in a [[items/buildings/hangar]] |
| code | `Vehicle` in `feature-vehicles/vehicle.h.ts` |

Driven by a gardener or sent out on a route ([[features/vehicles]]).

## Kinds

| | Quad | Tractor |
|---|---|---|
| kind | `quad` | `tractor` |
| price | `QUAD_PRICE` | `TRACTOR_PRICE` |
| unlocked by | `unlock-vehicles` | `unlock-vehicles` |
| top speed | `QUAD_VMAX` | `TRACTOR_VMAX` |
| carries | `VEHICLE_SLOTS` item slots | one trailer ([[items/other/trailers]]) |

## Fuel

Fuel is a share of a full tank (`FUEL_LITERS` L). Moving uses it: a full tank lasts `QUAD_FUEL_SECONDS` of driving. Each rank of the `driving-classes` skill makes vehicles use 5% less fuel and drive 5% faster. With an empty tank a vehicle stops. Fuel comes from a [[items/buildings/refueling-station]].

## Surfaces

Top speed × `SURFACE_PAVED` on Asphalt and Paving slab, × `SURFACE_SLOW` on plots, rock and buildings, × `SURFACE_NORMAL` elsewhere, including Brickwork and Cobblestone (`surfaceMul`).
