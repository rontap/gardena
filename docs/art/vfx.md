# VFX

Says whether a machine is working. Readability first, decoration never.

Pixi ticker cuts over atlas frames. No CSS `<use>`. No rAF outside the Pixi ticker. Sim never owns a frame index.

`src/assets/vfx/*.svg`. Rules from [[art/svg]] and [[art/palette]] hold. Registry `src/game/view/vfx.ts`. Paint `layers/vfx.ts`. Atlas rasterizes `f0`…`fN` at 2×, nearest — [[architecture/view]].

## Two channels

| channel | drives | lifetime | truth |
|---|---|---|---|
| state | working now | mounted while true | `World.vfx` |
| burst | happened just now | one cycle, then unmounts | `World.bursts`, view-drained |

State VFX mounts only while true. An idle machine is zero sprites — there is no `is-working` attribute to match.

## Frames

Frames are sibling `<g id="f0" … "fN">` in one file, same convention as [[art/sensors]] `off` / `on`. Atlas: one `Texture` per `(file, group id)`.

Quick cuts, not tweens. `crispEdges` pixel art smears under interpolation. Exactly one frame paints at a time; sprite `alpha` is the only animated property.

Supported frame counts are **2** and **4**. `VfxDef.frames.length` is that count. `VfxDef.slots` may include rest (empty) so the cycle matches today’s brew / dust / steam hold. A third painted count means a third cut; do not fake it.

## Contract

Pixi sprites from those textures. `VfxDef.dur` is the cycle. State: all instances share phase; delay `(i / slots − 1) × dur` so nothing pops on mount. Burst: delay `i / slots × dur`, frames run once, then unmount. Burst wrapper fades out over `dur` (hold opaque to 70%, then out).

Farm sprites have no DOM. Locator: HTML overlay `data-vfx={id}` while mounted, `pointer-events-none`. Frame cuts are Pixi, not CSS `.vfx-frame`. VFX never eats a click. Overlay Graphics `eventMode` `'none'`.

## Off

`prefers-reduced-motion: reduce`. No setting, no toggle, no `Save` field.

State VFX keeps frame 0 painted and stops animating — the readability signal survives, the motion does not. Bursts do not mount at all. `VFX_REDUCED` is read once at module load. Overlay `data-vfx` still present for state frame 0; bursts: no overlay.

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
