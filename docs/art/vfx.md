# VFX

Says whether a machine is working. Readability first, decoration never.

Pixi ticker cuts over atlas frames. No CSS `<use>`. No rAF outside the Pixi ticker. Sim never owns a frame index.

`src/assets/vfx/*.svg`. Rules from [[art/svg]] and [[art/palette]] hold. Registry `src/game/view/vfx.ts`. Paint `layers/vfx.ts`. Atlas rasterizes `f0`…`fN` at 2×, nearest — [[architecture/view]].

## Three channels

| channel | drives | lifetime | truth |
|---|---|---|---|
| state | working now | mounted while true | `World.vfx`, or a working state the view can already read |
| burst | happened just now | one cycle, then unmounts | `World.bursts`, view-drained |
| flow | a system is moving something | continuous while true | conduction and signal, read live |

`flow` is not frames. The Pixi ticker drives a transform, a tint, or a dash offset: no atlas frames, no per-instance sim state, no frame index anywhere. Rigid-body transform of a sub-sprite is legal; interpolating a raster frame is still banned. A marching dash and a turning part are transforms; a smeared bitmap is not.

`vfx-graft` and `vfx-age` are `graft` and `age` in `VfxId`. `vfx-age` is a second barrel state, not a replacement for `brew`.

Today `flow` paints water along conducting pipe (dashes marching away from the sources, stopping dead at a closed valve), beads along a high wire from `from` to `to`, and the gardener walk bob. `FLOW_DASH` is the cycle — preference. Direction on pipe is a view-local BFS from the corners of every `World.sources()` cell over conducting edges, not a sim field.

State VFX mounts only while true. An idle machine is zero sprites — there is no `is-working` attribute to match.

View ticker drains `World.bursts` every frame. `DirtyReason` `'vfx'` is state change (sprinkler on/off). Bursts do not wait for it. — [[architecture/view]]

## Frames

Frames are sibling `<g id="f0" … "fN">` in one file, same convention as [[art/sensors]] `off` / `on`. Atlas: one `Texture` per `(file, group id)`.

Quick cuts, not tweens. `crispEdges` pixel art smears under interpolation. Exactly one frame paints at a time; sprite `alpha` is the only animated property.

Supported frame counts are **2**, **3** and **4** — the members of the `frames` union in `def`. `VfxDef.frames.length` is that count. `VfxDef.slots` may include rest (empty) so the cycle matches today’s brew / dust / steam hold. `burrow-pop` is the 3: spark, flash, fade. Any other count means adding a member to that union and drawing the matching `<g id>` in the file; do not approximate it with a count that is already there.

## Contract

Pixi sprites from those textures. `VfxDef.dur` is the cycle. State: all instances share phase; delay `(i / slots − 1) × dur` so nothing pops on mount. Burst: delay `i / slots × dur`, frames run once, then unmount. Burst wrapper fades out over `dur` (hold opaque to 70%, then out).

Farm sprites have no DOM. Locator: HTML overlay `data-vfx={id}` while mounted, `pointer-events-none`. Frame cuts are Pixi, not CSS `.vfx-frame`. VFX never eats a click. Overlay Graphics `eventMode` `'none'`.

`__view.vfxN` is the visible sprite count. Locator `data-vfx` is not proof of paint.

## Off

`prefers-reduced-motion: reduce`, or the player's reduced-motion setting. `vfxReduced()` reads both live on every call — it is not captured once at module load. No `Save` field. `flow` paints its zero phase. Wet ground still paints.

State VFX keeps frame 0 painted and stops animating — the readability signal survives, the motion does not. Bursts do not mount at all.  Overlay `data-vfx` still present for state frame 0; bursts: no overlay.

## Assets

| file | viewBox | frames | is |
|---|---|---|---|
| `vfx-spray.svg` | `0 0 48 48` | `f0`–`f3` | fine mist on ten rays, droplets marching outward, reaching ±1 tile |
| `vfx-spray-large.svg` | `0 0 96 96` | `f0`–`f3` | same mist on fourteen rays, ±2 tiles |
| `vfx-spray-vert.svg` | `0 0 96 48` | `f0`–`f1` | three-row bar mist marching out both ways |
| `vfx-brew.svg` | `0 0 24 24` | `f0`–`f3` | bubbles off a filling cask |
| `vfx-dust.svg` | `0 0 24 24` | `f0`–`f1` | crush dust at the mill and the jam pot |
| `vfx-steam.svg` | `0 0 48 24` | `f0`–`f3` | steam off the still |
| `vfx-dig.svg` | `0 0 24 24` | `f0`–`f3` | clods off the spade |
| `vfx-grind.svg` | `0 0 24 24` | `f0`–`f3` | `leaf` / `grass-dark` chips flicking off the grinder drum, east side |
| `vfx-station.svg` | `0 0 24 24` | `f0`–`f3` | the station's two seed-tray bars lighting in turn, `leaf` and `ripe`, with a lamp pulse |
| `vfx-exhaust.svg` | `0 0 24 24` | `f0`–`f3` | `oil` / `steel` / `house` puffs thinning as they rise, behind a moving tractor |
| `vfx-burrow-pop.svg` | `0 0 24 24` | `f0`–`f2` | `ripe` rays bursting from a `house` core: a tight spark, a full star reaching the cell edge, then a faded ring |
| `vfx-tend.svg` | `0 0 24 24` | `f0`–`f1` | leaf ticks rising |
| `vfx-pour.svg` | `0 0 24 24` | `f0`–`f1` | splash landing |
| `vfx-furnace.svg` | `0 0 24 24` | `f0`–`f3` | fire at the furnace opening |
| `vfx-furnace-smoke.svg` | `0 0 24 24` | `f0`–`f3` | smoke rising from the furnace chimney |
| `vfx-graft.svg` | `0 0 24 24` | `f0`–`f3` | wood chips and leaf ticks rising off the cut |
| `vfx-age.svg` | `0 0 24 24` | `f0`–`f3` | bubbles rising off an aging cask, denser than `vfx-brew` |

`vfx-spray-large` is its own file, not `vfx-spray` at `scale(2)` — a scaled copy doubles the pixel grid.

**The spray does not sweep.** Four frames cannot turn an arc without strobing; the old rotating arc jumped 90° every `dur / 4` and was the loudest thing on the farm. It is a mist instead: droplets on fixed rays, each frame advancing them one step outward, so the motion reads as spraying and the shape never moves. Droplets are 1 unit past the head (2 near it), carry `fill-opacity` falling from 0.6 to 0.3 with distance, and the far tip is `house` at 0.35. `dur` is roughly double the old value on all three.

`fill-opacity` in a VFX asset is allowed — `vfx-furnace-smoke.svg` established it. It stays out of props and tiles.

`vfx-spray-vert` is drawn `ew` and rotated 90° for `ns`, same expression as the body art.

Reach is the real AoE from `aoe()` — [[mechanics/water]]. Basic ±1 tile, large ±2, vertical a 4×2 strip.

`VfxDef.anchor`: `vertex` — Pixi `anchor` 0.5 at the grid vertex so `rot` is about the head. Not top-left. `cell` puts origin at the cell corner (bursts).

## State: sprinklers

`tickWater` already filters `mayPour`, sums `demand`, and calls `pull`. It therefore knows which sprinklers actually poured this tick. It writes `World.vfx` and pings `'vfx'`.

Not `tickBig`. Not `rate()`. `rate()` cannot see that `pull` returned nothing, and `BIG_TICK` is 10 s — that lag was the old still-droplets bug. Invariant 102.

Dry, sourceless, unreachable, or nothing growing in the AoE: no VFX.

## State: furnace

Working furnace: `vfx-furnace` mounts at the south cell — the opening. `vfx-furnace-smoke` mounts at the north cell — the chimney. Prop groups `off` / `on` light that opening; fire VFX is the fire; smoke VFX is the chimney. Chimney mouth `(12, 14)` in `prop-furnace` and in north-cell local. Smoke viewBox `0 0 24 24`, `cell` origin at the north cell corner, puffs leave that mouth toward y=0. Reduced motion: frame 0 on both. Fire: `fire` / `ripe` / `fruit-red` / `roof`. Smoke: `steel` / `house` / `oil` / `ink`. No `fire` on the smoke.

## Flow: mill sails

`prop-mill.svg` carries `body` and `sails`. Atlas keys `mill-body` / `mill-sails`. `PropsLayer.patch` paints the body; `PropsLayer.tick` paints the sails, every Pixi frame, from the same second `SpritePool` the pump arm uses.

The sails are **the drawn sails, turned** — not a second set of frames. They are authored upright and the sprite carries `anchor` at the hub `(24, 18)` of the 48-unit box, so `rotation` turns about the shaft. `SAIL_REST` 45° is where they sit. While the mill works they turn **continuously**, a full revolution every `SAIL_TURN` — preference. Reduced motion holds them at rest.

Continuous, not stepped. A stepped angle holds still between jumps, and at any step count that reads as a stutter rather than a turn. Both forms cost the same one `rotation` write per frame, so there is no reason to step it.

Rotating one sprite costs one texture and no new art. Redrawing the sails once per angle costs a file per angle and, at this size, sampling a rotation per pixel gives ragged clusters rather than sails.

A working mill also mounts `dust` at `millDustAt(origin)` — `MILL_DUST_X` / `MILL_DUST_Y`, preference — at the door in the plinth. A 1×1 mill used to put it at the origin corner; on a 2×2 that corner is the roof.

## State: grinder, station

`busyVfx` gained two arms beside mill / jam / still / barrel. `grinderWorking(c)` is `crop !== 'none' && units > 0 && progress < 1`; `stationWorking` already existed. Both are base-cell guarded like the rest, so the 2×1 station mounts once.

The station's `off` / `on` prop groups are the state; `vfx-station` is the motion. `PropsLayer` repaints only on dirty, so nothing inside a prop file can flicker on its own — a bar that changes every frame is a VFX over the prop, never a third prop group.

## State: tractor exhaust

A tractor mounts `exhaust` while `Math.abs(pose.speed) >= SMOKE_SPEED`, at `pose` offset `SMOKE_BACK` behind the heading so the puff leaves the exhaust rather than the middle. Quads do not smoke.

`VfxLayer.draw` already multiplied `col` / `row` by `TILE`, so a fractional cell coordinate needed no signature change: the pool, the frame cutter, reduced motion, the `data-vfx` locator and `__view.vfxN` all come along. Read live from `World.vehicles` on the ticker — no sim field, no `World.vfx` entry.

## Flow: pump arm

`prop-pump.svg` carries two groups: `body` and `arm` (the walking beam and its rod). Atlas keys `pump-body` / `pump-arm`.

`PropsLayer.tick(world, now)` runs on the Pixi ticker beside `actors` and `vfx`, and paints only the arm, from a second `SpritePool` on the same container so it stays at prop depth — under the gardener, not over. `PropsLayer.patch` still paints `pump-body` on dirty.

The arm rides `Math.sin(((now / 1000 / PUMP_STROKE) % 1) × 2π) × PUMP_LIFT`, rounded to whole units so the pixel grid holds. `PUMP_STROKE` and `PUMP_LIFT` — preference.

It moves only while a seat's head intent is `fill` on one of the pump's cells. A pump gathers every second of every day, so an arm tied to gathering would never stop and would say nothing. Reduced motion pins the lift at 0.

This is `flow`: a rigid transform of a sub-sprite on the ticker, no frames, no frame index, no sim state.

## State: barrel

A working barrel paints one of two: `brew` while `age < BARREL_MATURE`, `age` after it. Maturing is the fruit fermenting, aging is the cask sitting. One at a time, never both – [[mechanics/machines]].

## Burst

`World.burst(id, at)` from anywhere in the sim. `World.bursts` is a drain queue: not in `Save`, not in the MP snapshot, not in the digest. `finishWork` runs the same on every peer, so each client makes its own bursts with no traffic.

View ticker drains the queue every frame. `'vfx'` ping is not the burst path.

`finishWork` is the funnel every completed gardener action already passes through. Bursts hook it. **No new triggers.**

| act | vfx |
|---|---|
| `tend` | `tend` |
| `water` | `pour` |
| `shovel` on a burrow | `burrow-pop` |

Everything else: none yet. Add a line at the outcome, not a listener.

`burrow-pop` fires from `doShovel` where the burrow is extracted, beside `extractBurrow` — the outcome, not a watcher on the cover. Three frames: the ground gives, the light comes out, it fades.

## State: work

`dig` is **not** a burst. A completion burst plays on ground that is already tilled: it says *done*, and the player needed *doing*.

Sim adds nothing. `Seat.workLeft` and `Seat.workTotal` already carry the progress, the head `Intent` already carries `act` and `at`, and lockstep already replays both on every peer, so the paint costs no traffic and needs no snapshot field. `p = 1 - workLeft / workTotal`, view-derived; `workTotal === 0` is not a work state.

While a seat’s head intent is `shovel` and `workLeft > 0`:

- `vfx-dig` mounts at `at` as a `state` VFX. It starts when the spade does.
- The destination `dirt` texture paints over that cell, masked to a centred square of side `TILE × p`. The dig opens outward from where the spade is, instead of being puffed at or filling like a bar.

The patch is ground, so it lives in `VfxLayer.ground`, mounted between `plots` and `pipes` — under the gardener who is digging it, never over. The clods stay on the `vfx` root above. The mask unmounts the tick `doShovel` lands, when `plots` paints the tilled cell for real. One or the other, never both. Cancel or an interrupted queue drops the mask with no ground changed. The mask is the 24-unit cell only; the tilled lip arrives with the real cell.

Keyed per seat, not per cell, so two gardeners digging is two masks.

While a seat's head intent is `graft` and `workLeft > 0`, `vfx-graft` mounts at `at` the same way. No ground mask – grafting changes the plant, not the soil. `GRAFT_WORK` is long enough to read, so the work carries the VFX and there is no completion burst. Any other timed act can claim the channel by naming its asset.
