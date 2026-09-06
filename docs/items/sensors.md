# Sensors

Lever, button, lamp, Logic gate, NOT, pulser, counter, water / fertilizer / harvest / variety / weather / day sensors, pressure plate, traffic light. Water-system sensor exists on old farms, not on the shelf. The valve signal input is Water (flow), not this shelf — [[items/irrigation]].

Rules: [[mechanics/sensors]]. Fenced area: [[mechanics/enclosure]]. Research: [[mechanics/research]].

SKUs: `buy-lever` `buy-button` `buy-lamp` `buy-logic` `buy-not` `buy-pulser` `buy-counter` `buy-sensor-water` `buy-sensor-fert` `buy-sensor-harvest` `buy-sensor-variety` `buy-sensor-weather` `buy-sensor-day` `buy-vehicle-detector` `buy-traffic-light`.

`buy-or` `buy-and` unused, not shown. `buy-water-system` `skuShown` false, not buyable.

Build shelf **Sensors**, id `logic`. Filing: signal → Sensors (lever, button, lamp, logic, not, pulser, counter, traffic-light). Readers: water, fert, harvest, variety, weather, vehicle-detector, day.

| sku | label | place | delete |
|---|---|---|---|
| `buy-pulser` | Pulser | Place Pulser | Delete pulser |
| `buy-counter` | Counter | Place Counter | Delete counter |
| `buy-sensor-day` | Day sensor | Place Day sensor | Delete day sensor |
| `buy-traffic-light` | Traffic light | Place Traffic light | Delete traffic light |
| `buy-logic` | Logic gate | Place Logic gate | Delete logic gate |
| `buy-sensor-variety` | Variety sensor | Place Variety sensor | Delete variety sensor |
| `buy-sensor-weather` | Weather sensor | Place Weather sensor | Delete weather sensor |
| `buy-vehicle-detector` | Pressure plate | Place Pressure plate | Delete pressure plate |

Tune prompts: **Tune {skuLabel}**.

`PULSER_PRICE` `COUNTER_PRICE` `SENSOR_DAY_PRICE` `TRAFFIC_LIGHT_PRICE` `LOGIC_PRICE` `SENSOR_VARIETY_PRICE` `SENSOR_WEATHER_PRICE`. Logic gate + NOT: `unlock-advanced-sensors`. Pulser / counter / day / weather: `unlock-sensors`. Variety: `show` `unlock-sensors`, `need` `unlock-crop-variants`. Traffic light: `show` `unlock-sensors`, `need` `unlock-dispatch`. Pressure plate: `show` `unlock-sensors`, `need` `unlock-vehicles`.

`buy-traffic-light` blurb: holds a vehicle until the input is green; output is on while a vehicle waits here. Look **Traffic light**.

`Sku.tab` `automation`. `haggling`. Almanac **Sensors**: Overview, then lever. Tab click lands Overview. Valves and sprinklers on Almanac **Water systems**. Copy [[ui/almanac]].
