# Sensors

1.6. Industrial sunk 1×1. Dark body, bright identifier. Active status on the prop. Ink mass first, fill inset — [[art/svg]] [[art/palette]]. Item is the same object, larger.

Not electricity. Do not reuse [[art/electricity]] windmill, generator, battery, power-line, power-switch. Not cottage tap. Not `item-valve` / `pipe-valve`.

Body `oil` `#2c322c` / `iron` `#4c4844` / `steel` `#8a9198`. Outlines `ink` `#1c1710`. Sunk collar `dirt` / `dirt-dark`. No unnamed hex.

AND/OR are compact IEEE-ish pixel glyphs, output down. AND: flat back, D front. OR: pointed/curved back, pointed front. Not a tall slotted box. Collar is a pad, not empty dirt. Side steel nubs + bottom out nub. No port-marker circles/squares in the SVG.

Lamp jack is the top nub (NOT `in` language). Housing sits low so the nub reads. No out. Globe is the mass at map scale: `off` oil + `fruit-red` window, `on` `ripe` + steel window. Jack stays steel.

| file | viewBox | groups | depicts |
|---|---|---|---|
| `item-lever.svg` `prop-lever.svg` | `0 0 24 24` | `off` `on` | throw lever, grip, top in, bottom out |
| `item-button.svg` `prop-button.svg` | `0 0 24 24` | `off` `on` | pad, bottom out |
| `item-lamp.svg` `prop-lamp.svg` | `0 0 24 24` | `off` `on` | large globe, low housing, jack on top, no out |
| `item-or.svg` `prop-or.svg` | `0 0 24 24` | — | IEEE-ish, pointed/curved back, pointed front, side ins, bottom out |
| `item-and.svg` `prop-and.svg` | `0 0 24 24` | — | IEEE-ish, flat back, D front, side ins, bottom out |
| `item-not.svg` `prop-not.svg` | `0 0 24 24` | — | stepped body, bubble, top in, bottom out |
| `item-pulser.svg` `prop-pulser.svg` | `0 0 24 24` | `off` `on` | square pulse, top in, bottom out |
| `item-counter.svg` `prop-counter.svg` | `0 0 24 24` | `s0` `s1` `s2` `s3` `s4` | circular dial, top in, bottom out |
| `item-sensor-water.svg` `prop-sensor-water.svg` | `0 0 24 24` | `red` `blue` | droplet, bottom out |
| `item-sensor-fert.svg` `prop-sensor-fert.svg` | `0 0 24 24` | `red` `ok` | sack, bottom out |
| `item-sensor-harvest.svg` `prop-sensor-harvest.svg` | `0 0 24 24` | `off` `on` | three heads, bottom out |
| `item-sensor-day.svg` `prop-sensor-day.svg` | `0 0 24 24` | `off` `on` | sun, bottom out |
| `item-water-system.svg` `prop-water-system.svg` | `0 0 24 24` | `off` `on` | cistern + house pipe waist, not a tap, bottom out |
| `item-vehicle-detector.svg` `prop-vehicle-detector.svg` | `0 0 24 24` | `off` `on` | flush floor plate, sunk grout, bottom out |
| `item-smart-valve.svg` | `0 0 24 24` | `closed` `open` | shop/hand, industrial slab on a pipe, jack on the body |
| `pipe-smart-valve.svg` | `0 0 24 24` | `closed` `open` | edge. Same object. Not `power-switch.svg`. Not `pipe-valve.svg` |

Items `src/assets/items/`. Props `src/assets/props/`. Edge `src/assets/joints/pipe-smart-valve.svg`.

## Ports

Steel nubs, readable at 24×24. AND/OR `in-l` left + `in-r` right + `out` bottom. NOT / pulser / counter / lever `in` top + `out` bottom. Lamp `in` top of housing, no out. Output-only `out` bottom. Smart valve jack on the body.

Port chrome (circle on out, square on in) is a view overlay. Not baked into these SVGs.

`off` out nub `fruit-red`. `on` out nub `water`. Water `red` droplet `fruit-red` / `blue` droplet `water`. Fert `red` sack `fruit-red` / `ok` sack `leaf`. Valve `closed` `fruit-red` gate, dry pipe; `open` water through.

Lamp overlay attach: top edge, same as NOT `in` (`col+0.5`, `row`).

## Wires

No wire SKU file. Cubic bezier in view (`WiresGfx` / `PendingWire`). `wireControls` / `wirePoint` must match paint. No new `@theme` color.

Idle `fruit-red` `#c43c3c`. Active `water` `#3d7ea6`.

Stroke pass (coder, `map.tsx` + hit-test):

- `stroke-linecap="round"`
- color stroke `2.5`
- optional ink understroke `#1c1710` `4.5` (1px per side), same cap, under the color path
- stronger sag so crossings separate. Preference:

```
c1.x = from.x + dx * 0.35
c1.y = from.y + dy * 0.12 + 0.16
c2.x = to.x - dx * 0.35
c2.y = to.y - dy * 0.12 + 0.16
```

`+0.16` is downward droop in tiles (y-down). Was `dy * 0.05` and no droop — horizontal runs sat on top of each other.

Assumption: harvest / water-system / vehicle-detector / pulser / day groups `off` `on`. Counter `s0`–`s4` pie clockwise from 12. Lever on-throw grip sits under the top in nub. Lamp `in` portXY at the top nub. Wire sag numbers preference; hit-test follows view.
