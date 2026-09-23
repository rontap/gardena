# Logic devices

Lever, Button, Lamp, Logic gate, NOT gate, Pulser, Counter, Traffic light.

| | |
|---|---|
| size | 1 × 1 |
| Build tab | `automation` |
| demolish | yes; removes its wires |
| code | `sensor.ts` |

Devices that the player operates, that combine signals, or that show a signal. Shared rules for ports, wires and timing: [[systems/signals]]. Placing any of them keeps the Build tool selected.

## Devices

| device | SKU | unlocked by | ports | output |
|---|---|---|---|---|
| Lever | `buy-lever` | `unlock-sensors` | `in`, `out` | on while the lever is up |
| Button | `buy-button` | `unlock-sensors` | `out` | on for `BUTTON_PULSE` steps after a press |
| Lamp | `buy-lamp` | `unlock-sensors` | `in` | none; lights while its input is on |
| Logic gate | `buy-logic` | `unlock-advanced-sensors` | `in-l`, `in-r`, `out` | OR or AND of its two inputs |
| NOT gate | `buy-not` | `unlock-advanced-sensors` | `in`, `out` | the opposite of its input |
| Pulser | `buy-pulser` | `unlock-advanced-sensors` | `in`, `out` | on for one step when its input turns on |
| Counter | `buy-counter` | `unlock-advanced-sensors` | `in`, `out` | on for one step every **Count to** steps with the input on |
| Traffic light | `buy-traffic-light` | `unlock-dispatch` | `in`, `out` | on while a route vehicle waits on it and its input is off |

## Lever

**Flip lever** sends the gardener to it and switches it. Its input also switches it: each time the input turns on, the lever flips. The output follows the lever's position.

## Button

**Press button** sends the gardener to it. The output is on for `BUTTON_PULSE` steps, then off.

## Lamp

Lights while its input is on.

## Logic gate

Tuned to **OR** or **AND**. OR: on when either input is on. AND: on when both are on. Output changes in the same step as its inputs.

## NOT gate

On when its input is off, off when it is on. Output changes in the same step as its input.

## Pulser

Output is on for exactly one step on the step its input goes from off to on, then off until the input turns off and on again.

```
input   ___/‾‾‾‾‾‾‾\___/‾‾‾\___
output  ___/\__________/\______
```

## Counter

Tuned with **Count to** (1 to `COUNTER_MAX`). Each step with the input on adds 1 to the count. When the count reaches **Count to**, the output is on for that step and the count goes back to 0. **Reset** sets the count to 0. A Counter fed by a Pulser counts pulses; fed by a steady signal it counts steps.

## Traffic light

A route stop placed on a Traffic light makes the vehicle stop there until the light's input is on ([[features/vehicles]]). The light's output is on while a route vehicle is stopped on it and its input is off, held for `SENSOR_HOLD` steps; wire it to something that should react to a waiting vehicle.

## Screen

Hover: **{name} - on** / **{name} - off**. Tuning panels (`objecthud.tsx`): Logic gate **OR** / **AND**; Counter **Count to**, **Reset**. Prompts: **Flip lever**, **Press button**, **Tune {name}** with the name in lower case (**Tune counter**).

## Art

`src/assets/props/prop-{lever,button,lamp,logic,not,pulser,counter,traffic-light}.svg` and matching `items/item-*.svg`, groups `off` and `on`; the counter uses `s0` to `s4` for its progress toward **Count to**.
