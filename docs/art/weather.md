# Weather

HUD chrome. `src/assets/ui/ui-weather-*.svg`. Same family as `ui-phase-*`. viewBox `0 0 16 16`, no width/height, `crispEdges`, integer rects, cottage hex, no groups. Whole-file mount. Readable at `h-5 w-5` next to the phase sun. Not world VFX. Not tiles. Coder registers in `svgs.ts`.

| file | kind | depicts |
|---|---|---|
| `ui-weather-clear.svg` | clear | ripe disc, no rays; leaf under. Not `ui-phase-day`. |
| `ui-weather-rain.svg` | rain | ink cloud, two water drops |
| `ui-weather-dry.svg` | dry | ripe disc, roof core, four diagonal roof rays |
| `ui-weather-flood.svg` | flood | water mass, wave peaks, house glint on water |
| `ui-weather-drought.svg` | drought | dirt mound, dirt-dark Y-crack |

Kinds: [[mechanics/weather]]. HUD row after the day block. No names in the row.

Assumption: masses in ripe / leaf / water / ink / roof / dirt so they read on `bg-house`; house only as flood glint on water.
