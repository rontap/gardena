# VFX

1.7. Says whether a machine is working. Readability first, decoration never.

CSS animation over `<use>` layers. No rAF, no timers, no JS per frame. Sim never owns a frame index.

`src/assets/vfx/*.svg`. Rules from [[art/svg]] and [[art/palette]] hold. Registry `src/game/view/vfx.ts`. Paint `VfxLayers` in `src/game/view/map.tsx`.

## Two channels

| channel | drives | lifetime | truth |
|---|---|---|---|
| state | working now | mounted while true | `World.vfx` |
| burst | happened just now | one cycle, then unmounts | `World.bursts`, view-drained |

State VFX mounts only while true. An idle machine is zero DOM and zero running animations — there is no `is-working` attribute to match.

## Frames

Frames are sibling `<g id="f0" … "fN">` in one file, same convention as [[art/sensors]] `off` / `on`. `groupInner` slices each; each frame is its own symbol; the view renders N `<use>` siblings.

CSS cannot select into a `<use>` shadow tree. Only inherited properties and custom properties cross — the `--hat` seam in [[art/actor]]. So the animated element is the `<use>` in the light DOM, never a rect inside the asset.

Quick cuts, not tweens. `crispEdges` pixel art smears under interpolation. Exactly one frame paints at a time; `opacity` is the only animated property, so the work stays on the compositor.

Supported frame counts are **2** and **4**, one keyframe set each (`vfx-cut-2`, `vfx-cut-4`). `VfxDef.cut` names it and fixes `frames.length`. A third count means a third keyframe set; do not fake it.

## Contract

Wrapper `<g class="vfx" data-vfx={id}>`, `--vfx-cut` and `--vfx-dur` on it. Each layer `<use class="vfx-frame" data-vfx-i={i}>`, `--vfx-t` = `i / n`.

Delay `(--vfx-t − 1) × --vfx-dur` for state, `--vfx-t × --vfx-dur` for burst. Negative for state so nothing pops on mount; all instances share phase.

Burst adds `vfx-burst` on the wrapper: `vfx-burst-life` fades it out over `--vfx-dur`, frames run once, and the view unmounts on that wrapper's `animationend`.

`.vfx` is `pointer-events: none`. VFX never eats a click.

## Off

`prefers-reduced-motion: reduce`. No setting, no toggle, no `Save` field.

State VFX keeps frame 0 painted and stops animating — the readability signal survives, the motion does not. Bursts do not mount at all: they end on `animationend`, and a killed animation never fires one. `VFX_REDUCED` is read once at module load.

## Assets

| file | viewBox | frames | is |
|---|---|---|---|
| `vfx-spray.svg` | `0 0 48 48` | `f0`–`f3` | arc sweeping clockwise, reaching ±1 tile |
| `vfx-spray-large.svg` | `0 0 96 96` | `f0`–`f3` | same sweep, more droplets, ±2 tiles |
| `vfx-spray-vert.svg` | `0 0 96 48` | `f0`–`f1` | bar spray marching out both ways |
| `vfx-tend.svg` | `0 0 24 24` | `f0`–`f1` | leaf ticks rising |
| `vfx-pour.svg` | `0 0 24 24` | `f0`–`f1` | splash landing |

`vfx-spray-large` is its own file, not `vfx-spray` at `scale(2)` — a scaled copy doubles the pixel grid.

`vfx-spray-vert` is drawn `ew` and rotated 90° for `ns`, same expression as the body art.

Reach is the real AoE from `aoe()` — [[mechanics/water]]. Basic ±1 tile, large ±2, vertical a 4×2 strip.

`VfxDef.anchor`: `vertex` centres the asset on the grid vertex (sprinklers), `cell` puts its origin at the cell corner (bursts).

## State: sprinklers

`tickWater` already filters `mayPour`, sums `demand`, and calls `pull`. It therefore knows which sprinklers actually poured this tick. It writes `World.vfx` and pings `'vfx'`.

Not `tickBig`. Not `rate()`. `rate()` cannot see that `pull` returned nothing, and `BIG_TICK` is 10 s — that lag was the old still-droplets bug. Invariant 102.

Dry, sourceless, unreachable, or nothing growing in the AoE: no VFX.

## Burst

`World.burst(id, at)` from anywhere in the sim. `World.bursts` is a drain queue: not in `Save`, not in the MP snapshot, not in the digest. `finishWork` runs the same on every peer, so each client makes its own bursts with no traffic.

`finishWork` is the funnel every completed gardener action already passes through. Bursts hook it. **No new triggers.**

| act | vfx |
|---|---|
| `tend` | `tend` |
| `water` | `pour` |

Everything else: none yet. Add a line at the outcome, not a listener.
