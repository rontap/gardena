# Sensors

Industrial sunk. Dark body, bright identifier. Active status on the prop. Ink mass first, fill inset — [[art/svg]] [[art/palette]]. Item is the same object, larger. Size [[items/sensors]]. Tile grid [[art/svg]].

On a fence: fence tile with `fenceFit` joins, sensor prop on top. Two sprites. Not a combined SVG. [[architecture/view]]

Not electricity. Do not reuse [[art/electricity]] windmill, generator, battery, power-line, power-switch. Not cottage tap. Not `item-valve` / `pipe-valve`.

Body `oil` / `iron` / `steel`. Outlines `ink`. Sunk collar `dirt` / `dirt-dark`.

Logic gate is one body; IEEE-ish glyph swaps with `mode`. AND: flat back, D front. OR: pointed/curved back, pointed front. Output down. Not a tall slotted box. Collar is a pad, not empty dirt. Side steel nubs + bottom out nub. No port-marker circles/squares in the SVG. `item-and` / `item-or` / `prop-and` / `prop-or` stay on disk, not on a shelf.

Lamp jack is the top nub. Housing sits low so the nub reads. No out. Globe is the mass at map scale: `off` oil + `fruit-red` window, `on` `ripe` + steel window. Jack stays steel.

Traffic light: two stacked ovals, visor as a hood on the housing, not a street pole. Both ovals always present. `off` top fruit-red, bottom oil. `on` top oil, bottom leaf. Out nub fruit-red / water. Unlit oval is oil with ink frame.

Lever on-throw grip sits under the top in nub.

| file | groups | depicts |
|---|---|---|
| `item-lever.svg` `prop-lever.svg` | `off` `on` | throw lever, grip, top in, bottom out |
| `item-button.svg` `prop-button.svg` | `off` `on` | pad, bottom out |
| `item-lamp.svg` `prop-lamp.svg` | `off` `on` | large globe, low housing, jack on top, no out |
| `item-or.svg` `prop-or.svg` | — | not on a shelf. IEEE-ish, pointed/curved back, pointed front, side ins, bottom out |
| `item-and.svg` `prop-and.svg` | — | not on a shelf. IEEE-ish, flat back, D front, side ins, bottom out |
| `item-logic.svg` `prop-logic.svg` | `or` `and` | one body, IEEE glyph swaps with mode. Side ins, bottom out |
| `item-sensor-variety.svg` `prop-sensor-variety.svg` | `off` `on` | out only, bottom nub |
| `item-sensor-weather.svg` `prop-sensor-weather.svg` | `off` `on` | out only, bottom nub |
| `item-not.svg` `prop-not.svg` | — | stepped body, bubble, top in, bottom out |
| `item-pulser.svg` `prop-pulser.svg` | `off` `on` | square pulse, top in, bottom out |
| `item-counter.svg` `prop-counter.svg` | `s0` `s1` `s2` `s3` `s4` | circular dial, pie clockwise from 12, top in, bottom out |
| `item-sensor-water.svg` `prop-sensor-water.svg` | `red` `blue` | droplet, bottom out |
| `item-sensor-fert.svg` `prop-sensor-fert.svg` | `red` `ok` | sack, bottom out |
| `item-sensor-harvest.svg` `prop-sensor-harvest.svg` | `off` `on` | three heads, bottom out |
| `item-sensor-day.svg` `prop-sensor-day.svg` | `off` `on` | sun, bottom out |
| `item-water-system.svg` `prop-water-system.svg` | `off` `on` | cistern + house pipe waist, not a tap, bottom out |
| `item-vehicle-detector.svg` `prop-vehicle-detector.svg` | `off` `on` | flush floor plate, sunk grout, bottom out. Pressure plate. Keep these files |
| `item-traffic-light.svg` `prop-traffic-light.svg` | `off` `on` | two stacked ovals, top in, bottom out |
| `pipe-valve-jack.svg` | `jack` | edge. Steel socket bolted to the valve body, drawn over `pipe-valve.svg` when that valve owns a port |

Items `src/assets/items/`. Props `src/assets/props/`. Edge `src/assets/joints/pipe-valve-jack.svg`.

## Ports

Steel nubs, readable at 24×24. Layout [[mechanics/sensors]]. Valve jack on the body, `pipe-valve-jack.svg`, only after `unlock-smart-irrigation`. Pump origin `in` overlay only, no prop nub.

Port chrome is a view overlay. Not baked into these SVGs. [[ui/sensors]]

`off` out nub `fruit-red`. `on` out nub `water`. Water `red` droplet `fruit-red` / `blue` droplet `water`. Fert `red` sack `fruit-red` / `ok` sack `leaf`. Valve `closed` `fruit-red` gate, dry pipe; `open` water through.

## Wires

No wire SKU file. Cubic bezier in overlay Graphics. `wireControls` / `wirePoint` must match paint. No new `@theme` color. Sag preference so crossings separate; hit-test follows view.

Idle `fruit-red`. Active `water`. Round cap, color stroke, ink understroke. Visual cross is paint, no join.

Beads on signal `1`: [[art/vfx]].
