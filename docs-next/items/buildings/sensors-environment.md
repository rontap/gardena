# Environment sensors

Weather sensor, Day sensor, Pressure plate.

| | |
|---|---|
| size | 1 × 1 |
| Build tab | `automation` |
| demolish | yes; removes its wires |
| ports | `out` |
| code | `sensor.ts` (`weatherRaw`, `dayRaw`, `pressureRaw`), `evalSensors` in `nets.ts` |

Sensors that read the time, the weather, or what stands on the tiles around them. Shared rules for wires and held outputs: [[systems/signals]]. Placing any of them keeps the Build tool selected.

## Devices

| sensor | SKU | unlocked by | output is on when… | settings |
|---|---|---|---|---|
| Weather sensor | `buy-sensor-weather` | `unlock-smart-irrigation` | today's weather is ticked | **Clear**, **Rain**, **Dry**, **Flood**, **Drought**; **Clear** ticked when placed |
| Day sensor | `buy-sensor-day` | `unlock-smart-irrigation` | the current phase is ticked | **Sunrise**, **Day**, **Sunset**, **Twilight**; **Day** ticked when placed |
| Pressure plate | `buy-vehicle-detector` | `unlock-sensors` | a ticked thing is on a watched tile | **Vehicle**, **You**, **On the ground**; **Vehicle** ticked when placed |

The Day sensor's **Day** checkbox is the phase the top rail calls **Midday**.

## Pressure plate

**Vehicle**: a vehicle on the field (not in a hangar) has its position on a watched tile. **You**: a present player's gardener stands on a watched tile. **On the ground**: an item lies on a watched tile. With nothing ticked, it is always off.

It watches its own tile and the 8 around it:

```
  w w w
  w P w
  w w w
```

Placed on a fence tile, it watches the inside of the fenced area instead; if the fence does not close an area, it is off ([[features/fences]]).

## Output timing

The reading is taken every step. A change switches the output at once and holds it for `SENSOR_HOLD` steps ([[systems/signals]]).

## Screen

Hover: **{name} - on** / **{name} - off**. Clicking opens its tuning panel under **Send signal when...** (`objecthud.tsx`); prompt **Tune {name}** in lower case.

## Art

`prop-sensor-weather.svg`, `prop-sensor-day.svg`, `prop-vehicle-detector.svg` and matching `item-*.svg`, groups `off` and `on`.

The Water-system sensor (`buy-water-system`) exists in code but is not shown in Build (`skuShown`).
