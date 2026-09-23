# Crop sensors

Water sensor, Fertilizer sensor, Harvest sensor, Variety sensor.

| | |
|---|---|
| size | 1 × 1 |
| Build tab | `automation` |
| demolish | yes; removes its wires |
| ports | `out` |
| code | `sensor.ts` (`readerRaw`), `evalSensors` in `nets.ts` |

Sensors that read the plants and trees around them and send a signal. Shared rules for wires and held outputs: [[systems/signals]]. Placing any of them keeps the Build tool selected.

## Devices

| sensor | SKU | unlocked by | output is on when a watched tile has… | settings |
|---|---|---|---|---|
| Water sensor | `buy-sensor-water` | `unlock-sensors` (needs `unlock-irrigation`) | a growing or ripe plant, or a tree, with water in red: too dry if **Wilting** is ticked, too wet if **Overwatered** is ticked | **Wilting**, **Overwatered**; both ticked when placed |
| Fertilizer sensor | `buy-sensor-fert` | `unlock-sensors` | a growing plant or a tree with fertilizer in red | none |
| Harvest sensor | `buy-sensor-harvest` | `unlock-sensors` | **Any**: at least one ripe plant. **All**: at least one growing or ripe plant, and all of them ripe | **Any** / **All**; **Any** when placed |
| Variety sensor | `buy-sensor-variety` | `unlock-crop-variants` | a growing or ripe plant, or a tree that is not a stump, of a ticked tier | **Plain**, **Named**, **Heirloom**; **Plain** ticked when placed |

With nothing ticked, the Water and Variety sensors are always off. Red ranges are the same ones the plant uses ([[features/plants]]). The Harvest sensor ignores trees. Each tree counts once, whichever of its two tiles is watched.

## Watched tiles

A crop sensor watches the 8 tiles around it, not its own tile:

```
  w w w
  w S w
  w w w
```

A crop sensor placed on a fence tile watches the inside of the fenced area the fence belongs to instead ([[features/fences]]). If that fence does not close an area, the sensor is off and its hover line says **open fence, close it to turn the sensor on**.

## Output timing

The reading is taken every step. A change switches the output at once and holds it for `SENSOR_HOLD` steps ([[systems/signals]]).

## Screen

Hover: **{name} - on** / **{name} - off**. Clicking opens its tuning panel under **Send signal when...** (`objecthud.tsx`); prompt **Tune {name}** in lower case. The Water sensor's sprite shows `red` or `blue`, the Fertilizer sensor's `red` or `ok`; the others `off` and `on`.

## Art

`prop-sensor-{water,fert,harvest,variety}.svg`, `item-sensor-{water,fert,harvest,variety}.svg`.
