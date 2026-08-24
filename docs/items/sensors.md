# Sensors

Lever, button, lamp, OR, AND, NOT, pulser, counter, water / fertilizer / harvest / water-system / day sensors, vehicle detector. Smart valve is Water (flow), not this shelf — [[items/irrigation]].

Rules: [[mechanics/sensors]]. Research: [[mechanics/research]].

SKUs: `buy-lever` `buy-button` `buy-lamp` `buy-or` `buy-and` `buy-not` `buy-pulser` `buy-counter` `buy-sensor-water` `buy-sensor-fert` `buy-sensor-harvest` `buy-sensor-day` `buy-water-system` `buy-vehicle-detector`.

`buy-smart-valve` is irrigation.

Build shelf **Sensors**, id `logic`. Filing: signal → Sensors (lever, button, lamp, or, and, not, pulser, counter). Readers: water, fert, harvest, water-system, vehicle-detector, day. Smart valve → Water (flow).

| sku | label | place | delete |
|---|---|---|---|
| `buy-pulser` | Pulser | Place Pulser | Delete pulser |
| `buy-counter` | Counter | Place Counter | Delete counter |
| `buy-sensor-day` | Day sensor | Place Day sensor | Delete day sensor |

Tune prompts: **Tune counter** / **Tune day sensor**.

`PULSER_PRICE` `COUNTER_PRICE` `SENSOR_DAY_PRICE`. AND / OR / NOT: `unlock-advanced-sensors`. Pulser / counter / day: `unlock-sensors`.

`Sku.tab` `automation`. `machine-contracts`. Almanac **Sensors**: Overview, then lever. Tab click lands Overview. Smart valve and sprinklers on Almanac **Water systems**. Copy [[ui/almanac]].
