# Crop Variety Station

| | |
|---|---|
| SKU | `buy-research-station` (Build tab `automation`) |
| price | `SKUS['buy-research-station'].price` + `STATION_PRICE_STEP` × the stations on the farm (`skuPrice`) |
| size | 2 × 1 |
| unlocked by | `unlock-crop-variants` |
| demolish | yes |
| cell kind | `'station'` |
| recipe kind | none; studies fruit ([[features/machines]]) |

Studies fruit to raise the farm's familiarity with a crop.

## Use

Takes fruit of any crop. The first fruit fixes the crop and variety. It takes fruit only up to what is left to learn about that crop (`stationRoom`). Each fruit takes `stationSeconds(level)` = `STATION_SECONDS_BASE` + `STATION_SECONDS_STEP` × the crop's current familiarity; neither the `machinery` skill nor Furnaces speed it up. Each fruit studied adds `FAMILIARITY_GAIN` of its variety tier to the crop's familiarity, up to `familiarityMax(crop)`.

Familiarity is stored on the farm, not on the station: several stations study the same numbers, and demolishing one loses nothing ([[features/machines]]).

Each station on the farm adds `STATION_PRICE_STEP` to the price of the next one; the count is the stations on the farm when the next is placed (the `station` cells in `World.machines`), so demolishing one lowers the price again.

## Connections

Chest input on the left; no output. Vehicle loading spots; signal input ([[systems/building-io]]).

## Screen

Prompt: **Study**. Hover: **Crop Variety Station**, **{name} · {left} left · {n}%**, or **Nothing left to learn about {name}**. Panel: `station.tsx`.

## Art

`prop-research-station.svg`, groups `off` and `on`.

## Sound

Putting an item in plays the machine load sound ([[systems/sound]]).
