# View

Code: `src/game/view/` — `world-view.ts` (`WorldView`), `layers/` (ground, plots, pipes, props, actors, overlay, VFX), `atlas.ts`, `svgs.ts`, `map.tsx`, `hit.ts`, `camera.ts`, `cursor.ts`, `motion.ts`, `outline.ts`, `meter.ts`, `vfx.ts`; see [[code-map]].

## Job

The view draws the farm on a Pixi canvas and turns the pointer into a target on the map. It reads `World` and never writes it: the simulation runs on its own clock in `App.tsx`, and the view paints what the last step left. Panels, rails and the inspect column are React, outside Pixi ([[shell]]).

## Used by

- [[shell]] — the map behind the panels, hover, clicks and the camera.
- [[art/svg]], [[art/vfx]], [[art/variants]] — how assets reach the screen.
- [[systems/sound]] — `tickSound` runs on the view's frame, beside the effects.
- [[features/almanac]] — machine cards draw atlas effect frames (`atlasHtml`).
- Every feature with art on the map.

## Contract

### Layers

`WorldView` stacks one container per layer, bottom to top:

1. `ground` — owned terrain and the fade around it, in chunk containers.
2. `plots` — tilled plots, plants, weeds, grass, rocks, trees, tufts, burrow covers. A thing larger than one tile is drawn once, from its origin tile.
3. `vfx.ground` — the dig patch: the tilled texture growing under a gardener who is digging, above the plots and below everything standing on them.
4. `pipes` — pipe joints, valves, sprinklers, fences, and the pipe or fence run being dragged.
5. `props` — buildings, machines, stores, sensors, hangars and field silos, drawn from their origin tile; the moving parts of the Pump and the Mill.
6. `actors` — gardeners, vehicles on the field, trailers, items on the ground.
7. `overlay` — lens washes, routes, wires, ports, the area of a hovered sprinkler, and the flow of water and signal.
8. `vfx` — the state, burst and flow effects of [[art/vfx]].

Farm sprites take no pointer events (`eventMode` `'none'`). HTML over the canvas (`map.tsx`) carries the placement ghosts, speech, expansion plates, the hover outline, and one `data-vfx` locator per drawn effect for tests.

### Frame and patch

`World.on('dirty')` patches layers when the simulation changes something discrete: reasons `field`, `big` and `act` patch the field layers, `speech` repaints speech. Patches walk the `World` indexes and instance lists, never every cell. Anything that moves every frame runs on the Pixi ticker in `WorldView.tick`: actor poses, prop motion, `VfxLayer.tick` (state effects and the burst drain), `tickSound`, the flow lines, and the camera following a driven vehicle. The view does not interpolate the simulation; vehicle poses are smoothed in the view only.

### Atlas

`atlas.ts` rasterises named groups of the SVG files into textures at `SCALE` × their viewBox, nearest-neighbour, once at boot (`atlasReady`). A texture is one group of one file: a stage, a Variety group, an `off`/`on` state, a pipe or fence join, an effect frame `f0` … `f7`. A sprite is `TILE` pixels per 24 viewBox units at camera scale 1. `atlasHtml` returns the SVG body of a key for HTML that needs the same picture. `svgs.ts` serves whole SVGs and groups to React panels; map tiles do not go through it.

### Camera and hit

`Camera` is `{ x, y, scale }`, clamped to the farm's fade and to scale 0.5–3 (`clampCam`); it is not saved. `hit.ts` turns a world-space point into the target of a click or hover (`clickHit`): a cell, an edge within `EDGE_HIT`, a vertex within `VERTEX_HIT` (`SPRINKLER_HIT` while a sprinkler is being placed), or an item on the ground.

## Entry points

- `WorldView.mount(host, world, cam, lens, edit, onCam)` — waits for the atlas, creates the Pixi app, binds sound, paints everything once.
- `setCam`, `setLens`, `setHover`, `setPending`, `setPendingFence`, `setDragStop` — from `map.tsx` as the player pans, picks a lens, hovers or drags.
- `hit(wx, wy)` — the target under the pointer.
- `vfxMounts()`, `vfxN` — the effects drawn this frame, for locators and tests.
- `destroy()` — unbinds sound and destroys the app.
- `window.__view` (`ViewHooks`, installed by `map.tsx`) — the camera, the pending pipe run, `hit` and `vfxN` for end-to-end tests.

## Data

The view owns the camera, the pending drag runs, hover state, sprite pools and the textures. None of it is saved, sent to other players, or part of the digest.

## Invariants

| id | rule | test |
|---|---|---|
| `view.read` | the view reads `World` and never changes it | none |
| `view.scan` | patches use `World` indexes and instance lists, never a walk over every cell | none |
| `view.hit` | farm sprites take no pointer events; hits are `hit.ts` world-space math | `hit.test.ts` |
| `view.groups` | every group the atlas asks for exists in its file, and a file has no group the atlas never asks for | `atlas.test.ts` |

## When you change this

- A new asset on the map: its group in `atlas.ts`, its layer in `layers/`, and a check on `#atlas` ([[art/svg]]).
- A new effect: [[art/vfx]].
- A new thing to paint on a dirty reason: patch from an index, not a scan of the farm.

## Decisions

- HUD and panels stay React; the canvas draws only the farm, so panel text, buttons and accessibility stay in the DOM.
- The simulation is not interpolated: the view smooths vehicle poses for the eye, and the simulation stays one step per tick.
