# Sensors

1.6. Industrial sunk 1×1. Dark body, bright identifier. Active status on the prop. Ink mass first, fill inset — [[art/svg]] [[art/palette]]. Item is the same object, larger.

Not electricity. Do not reuse [[art/electricity]] windmill, generator, battery, power-line, power-switch. Not cottage tap. Not `item-valve` / `pipe-valve`.

Wire idle `fruit-red` `#c43c3c`, active `water` `#3d7ea6`. Bezier in view. No wire SKU file.

Body `oil` `#2c322c` / `iron` `#4c4844` / `steel` `#8a9198`. Outlines `ink` `#1c1710`. Sunk collar `dirt` / `dirt-dark`. No unnamed hex.

| file | viewBox | groups | depicts |
|---|---|---|---|
| `item-lever.svg` `prop-lever.svg` | `0 0 24 24` | `off` `on` | throw lever, grip, bottom out |
| `item-button.svg` `prop-button.svg` | `0 0 24 24` | `off` `on` | pad, bottom out |
| `item-lamp.svg` `prop-lamp.svg` | `0 0 24 24` | `off` `on` | lantern, jack on the body, no out |
| `item-or.svg` `prop-or.svg` | `0 0 24 24` | — | two side-by-side slots, side ins, bottom out |
| `item-and.svg` `prop-and.svg` | `0 0 24 24` | — | two stacked slots, side ins, bottom out |
| `item-not.svg` `prop-not.svg` | `0 0 24 24` | — | stepped body, bubble, top in, bottom out |
| `item-sensor-water.svg` `prop-sensor-water.svg` | `0 0 24 24` | `red` `blue` | droplet, bottom out |
| `item-sensor-fert.svg` `prop-sensor-fert.svg` | `0 0 24 24` | `red` `ok` | sack, bottom out |
| `item-sensor-harvest.svg` `prop-sensor-harvest.svg` | `0 0 24 24` | `off` `on` | three heads, bottom out |
| `item-water-system.svg` `prop-water-system.svg` | `0 0 24 24` | `off` `on` | cistern + house pipe waist, not a tap, bottom out |
| `item-vehicle-detector.svg` `prop-vehicle-detector.svg` | `0 0 24 24` | `off` `on` | flush floor plate, sunk grout, bottom out |
| `item-smart-valve.svg` | `0 0 24 24` | `closed` `open` | shop/hand, industrial slab on a pipe, jack on the body |
| `pipe-smart-valve.svg` | `0 0 24 24` | `closed` `open` | edge. Same object. Not `power-switch.svg`. Not `pipe-valve.svg` |

Items `src/assets/items/`. Props `src/assets/props/`. Edge `src/assets/joints/pipe-smart-valve.svg`.

## Ports

Steel nubs, readable at 24×24. AND/OR `in-l` left + `in-r` right + `out` bottom. NOT `in` top + `out` bottom. Output-only `out` bottom. Lamp jack on the housing (cell is `in`). Smart valve jack on the body.

`off` out nub `fruit-red`. `on` out nub `water`. Water `red` droplet `fruit-red` / `blue` droplet `water`. Fert `red` sack `fruit-red` / `ok` sack `leaf`. Valve `closed` `fruit-red` gate, dry pipe; `open` water through.

Assumption: harvest / water-system / vehicle-detector groups `off` `on`. Edge file `pipe-smart-valve.svg`.
