# Trailers

| | |
|---|---|
| obtained from | bought in a [[items/buildings/hangar]] |
| pulled by | a Tractor ([[items/other/vehicles]]) |
| code | `Trailer` in `feature-vehicles/vehicle.h.ts`, `boomCell` in `vehicle.ts` |

A trailer loads and unloads at building loading spots that handle its items ([[systems/building-io]]). It works the plots under its boom while the Tractor moves forward without steering. **Width 3** or **Width 5** (`boom`) sets how many tiles across it covers.

## Kinds

| | Seeder | Sprayer | Harvester |
|---|---|---|---|
| kind | `seed` | `spray` | `harvest` |
| price | `TRAILER_SEED_PRICE` | `TRAILER_SPRAY_PRICE` | `TRAILER_HARVEST_PRICE` |
| holds | one stack of seeds, up to `TRAILER_CAP` | litres of one bag kind: fertilizer, compost or Weed spray, up to `TRAILER_CAP` | `HARVEST_SLOTS` item slots |

## What each does on a plot

- **Seeder**: plants its seeds on each empty plot; grass seed makes turf.
- **Sprayer**: with fertilizer or compost, fertilizes each plot and tree below its maximum, using only the difference. With Weed spray, sprays each weed and each tilled plot whose weed chance is 0 or above, 1 L each, as **Spray** by hand does ([[items/other/weed-spray]]); trees are passed over.
- **Harvester**:

| plot | result |
|---|---|
| ripe | the fruit, into the trailer; plot empty |
| growing, below 20% growth | one seed, into the trailer; plot empty |
| growing, above 80% growth | one fruit with freshness equal to its growth; plot empty |
| growing, 20% to 80% | plant destroyed, nothing kept; plot empty |
| dead plant, Rotten produce | the item, into the trailer; plot empty |
| weed | a Pulled weed, into the trailer; plot empty, weed chance unchanged |

It works plots only, and passes over a plot whose item would not fit in the trailer.
