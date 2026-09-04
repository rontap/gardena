# View

PixiJS v8 canvas world. HUD stays React. Not tick logic. Not Save. Not `PROTOCOL`. [[architecture/modules]] [[architecture/tick]] [[architecture/world]] [[art/svg]] [[art/vfx]]

No `@pixi/react`. No Pixi HUD. No `Graphics.svg` for tiles. Farm sprites `eventMode` `'none'`. Hits are world-space math in `hit.ts`.

## Owners

`src/game/view/`

| file | owner |
|---|---|
| `camera.ts` | `Camera`, `TILE`, `DROP_FACE`, `DROP_INSET`, `DROP_STEP`, `clampCam`, `tileVariant` |
| `atlas.ts` | named SVG `<g id>` → `Texture`, 2×, nearest. `EDGE_PAD` on `dirt-edge` / `dirt-inset`. `vfx-furnace-smoke.svg`. Variety groups, station `off`/`on`, graft face |
| `app.ts` | `Application` create / resize / destroy `releaseGlobalResources` |
| `world-view.ts` | scene graph, dirty patch, Pixi ticker motion, `QUAD_FOLLOW`, `CullerPlugin`, pending pipe run |
| `hit.ts` | `clickHit` / `nearestEdge` / `nearestVertex` / `dropHit` / `routeEdges` / `onEdgeBand` / port discs / ghosts |
| `outline.ts` | union footprint path. Directed edges, reverse cancel, then walk |
| `layers/ground.ts` | terrain + fade chunks |
| `layers/plots.ts` | plots, plants, weeds, turf, rocks, trees, tufts |
| `layers/pipes.ts` | pipes, valves, sprinklers, fences. `pipe-source` |
| `layers/props.ts` | buildings, sensors, house, truck, hangars, silos, station. Furnace / still native viewBox; art occupancy 1×1.5 / 1.5×1 inside. Station `off`/`on` |
| `layers/actors.ts` | seats, vehicles, trailers, drops |
| `layers/overlay.ts` | lens wash, routes, wires, ports, AoE, edge lattice, flow dashes and beads |
| `layers/vfx.ts` | `VfxDef`, state / burst paint. Drain `World.bursts`. Furnace fire south + `furnace-smoke` origin while working |
| `map.tsx` | React host: canvas + HTML ghosts / speech / expand. `MapView`, `Lens`. Boot `onReady` after `WorldView.mount` + first `layout`. `data-furnace-cover` |
| `svgs.ts` | chrome-only (HUD, almanac, shop). `varietyGroup(crop, variety)` selects the plant / fruit / cask / tree group. Not a ladder |
| `motion.ts` | HUD-only binds (`paintMotion` clock / day / research / fps / dash / queue) |

`TILE` 48. Atlas raster is 2× of 24-viewBox art, nearest. Sprite size at scale 1 is `TILE` per tile. Multi-cell props paint at origin, native viewBox. Still viewBox `48×24`; art occupies 1.5×1 centered inside it. Furnace viewBox `24×48`; art occupies 1×1.5 south-aligned inside it so the opening stays in the south cell. Empty viewBox margin is empty pixels. Do not scale those sprites down. Hit, ghost footprint, I/O, ports, pads stay 2×1 / 1×2.

`DROP_FACE` 33 — preference (pre-Pixi DropGfx). `DROP_INSET` 4 `DROP_STEP` 6 — preference. Live next to `TILE` in `camera.ts`. Drop sprite scale `DROP_FACE / TILE` on a 24-unit atlas sprite.

Chrome SVG never enters the atlas. Map tiles never enter `svgs.ts`.

## Layers

Bottom → top, one container each:

1. `ground` — owned terrain + fade. Chunk containers. `CullerPlugin`.
2. `plots` — tilled / plant / weed / turf / rock / tree / tuft. Origin-only for multi-cell. Dirt lip / inset: 24-unit content fills the cell; pad paints onto the neighbour.
3. `vfx.ground` — the dig patch only. Ground the sim has not tilled yet, so it paints above `plots` and below everything that stands on it.
4. `pipes` — joints, valves, sprinklers, fences. Always drawn. Faint when `lens !== 'pipes'` and place is not delete / a `PIPE_PLACE` sku. Wetness tint and sprinkler AoE wash still lens / tool. `pipe-source` on every `World.sources()` occupied cell only while that overlay is on. Not faint. Hidden otherwise.
5. `props` — house, truck, pumps, tanks, taps, machines, stores, station, sensors, hangars, field silos, starter silo / additives. Origin-only. Station `off` / `on` from working.
6. `actors` — in-seat gardeners, field vehicles / trailers, drops. Seated gardener hidden. Drops: 2×2 pack, `DROP_INSET` then `DROP_STEP`.
7. `overlay` — lens wash, routes, wires, ports, sprinkler AoE on hover, the edge lattice while a `PIPE_PLACE` sku is armed, and the flow `Graphics` repainted every frame from `flowTick`.
8. `vfx` — `World.vfx` state + drained `World.bursts`. `pointer-events` none. `VfxLayer.tick` drains bursts every frame. Vertex defs: sprite `anchor` 0.5, position at the vertex (px). Cell defs: origin at the cell corner. `VFX_REDUCED`: state frame 0, bursts do not mount.

HTML over the canvas (`map.tsx`): sku / pipe / sprinkler / delete ghosts, speech, expand faces. `data-cell-stroke` (one footprint outline path, never one rect per cell) `data-furnace-cover` (one covering outline path) `data-pipe-ghost` `data-valve-ghost` `data-queued` `data-speech` stay on HTML. Farm sprites have no DOM.

## Atlas

`atlas.ts` rasterizes a named group (`varietyGroup`, `off`/`on`, pipe fit, `f0`…`fN`) from the SVG file. One `Texture` per `(file, group id)`. Scale 2×. `scaleMode` nearest. Not a whole-file mount. Not `Graphics.svg`.

Group selection is by Variety, not a ladder.

```
VarietyGroup = 'base' | 'variant' | 'variant-2' | 'heirloom'
TreeStage    = 'trunk' | 'grow' | 'unripe' | 'ripe'
CropStage    = 'sprout' | 'grow' | 'ripe' | 'dead'
```

`varietyGroup(crop, variety): VarietyGroup`

| Variety | group |
|---|---|
| `'base'` | `'base'` |
| `VARIETY[v].tier === 'heirloom'` | `'heirloom'` |
| first `tier` `'variant'` of that crop, two variants | `'variant'` |
| first `tier` `'variant'` of that crop, one variant | `'variant-2'` |
| second `tier` `'variant'` of that crop | `'variant-2'` |

Illegal: comparing two Varieties. Illegal: a group from anything but `VARIETIES[crop]` + `VARIETY`.

| `VarietyGroup` | plant ripe | fruit / cask / graft | tree mature |
|---|---|---|---|
| `'base'` | `ripe` | `base` | `unripe` / `ripe` |
| `'variant'` | `ripe-variant` | `variant` | `unripe-variant` / `ripe-variant` |
| `'variant-2'` | `ripe-variant-2` | `variant-2` | `unripe-variant-2` / `ripe-variant-2` |
| `'heirloom'` | `ripe-heirloom` | `heirloom` | `unripe-heirloom` / `ripe-heirloom` |

Cask still has three groups; `'variant-2'` shares `'variant'` on wine / cider until Sprint 4. Tree `trunk` / `grow` are shared, not Variety. Fruit `fruit-${CropId}:${VarietyGroup}`. Plant `crop-${CropId}:${CropStage}` with ripe from `varietyGroup`. Tree atlas `tree-${TreeId}:${group}` for each mature id. Cask `cask-${CaskId}:${VarietyGroup}`.

```
AtlasKey +=
  | `graft-${CropId}:${VarietyGroup}`
  | 'station-off'
  | 'station-on'
```

`faceKey` / `itemInner` take Variety, not a ladder. Graft face. Station prop `off` / `on`. Faces carry no Quality mark; Quality is copy — [[ui/inspect]].

`EDGE_PAD` 4 — preference. Raster `dirt-edge` / `dirt-inset` with 4 viewBox units on every side (32×32 source, then 2×). Equal pad keeps the 24-unit cell at texture center. Other atlas keys stay viewBox-tight. `tile-dirt-edge.svg` / `tile-dirt-inset.svg` overhang the 24-unit grid (edge paths to y=26, inset from -3,-3); a viewBox-tight raster clips the lip. [[art/tilled-edges]]

## Dirty

`World.on('dirty')` is the consumer. Reasons unchanged: `'act' | 'field' | 'big' | 'speech' | 'vfx'`.

| reason | view |
|---|---|
| `speech` | HTML speech bind, ticker pose. Not React state |
| `vfx` | `layers/vfx.ts` state from `World.vfx`. Not Hud. Bursts drain on the Pixi ticker, not this reason |
| `field` / `big` | patch those layers from indexes. Not whole chrome |
| `act` | Hud React + layer patch |

Patch uses existing `World` indexes and instance lists. Illegal on the tick or dirty path: `live`, `forEachCell`, `[...this.live.values()]`. First paint / `World` swap / `groundRev` rebuilds visible chunks the same way.

Indexes: `grow` `empty` `machines` `stores` `sensors` `buttons` `recover` `tufts` `rocks`. Lists: `segments` `sprinklers` `fences` `hangars` `seedSilos` `spraySilos` `produceSilos` `pumps` `tanks` `taps` `wells` `stills` `waterSystems` `silo` `additives` `house` `truck` `vehicles` `trailers` `drops` `wires`. Ground textures stay terrain. Station patches with `machines`.

`ping()` from tick only on discrete change. Continuous world chrome is the Pixi ticker (`QUAD_FOLLOW`, actor pose, speech follow, VFX cuts, burst drain). Continuous HUD chrome is `paintMotion`. No every-tick counter HUD ping. FPS: [[ui/hud]]. Not a `DirtyReason`.

## Ticker vs ping

App owns the `DT_MAX` accumulator. At most two `tick(DT_MAX)` per frame. Never a leftover. Do not raise `DT_MAX`. Do not move `World` to a worker. Do not interpolate sim.

View paints on the Pixi ticker. Vehicle field pose smoothing stays view-local: `QUAD_FOLLOW` 0.35 — preference. Snap on bind / `World` swap. Trailer hitch follows the smoothed tractor. Sim pose is discrete.

Camera follow of a driven field vehicle is view-local. App does not write `cam` from pose. Farm pivot, not an SVG camera. Vehicle stays in actors. No dummy.

`VfxLayer.tick` drains `World.bursts` every frame. Do not wait for `DirtyReason` `'vfx'`.

## Camera

`Camera = { x, y, scale }`. Clamp `scale` 0.5..3, pan to fade bounds. Not `World`. Not logged. Not Save.

View may cull: `CullerPlugin` on chunk containers. Sim does not cull.

## Hit

`hit.ts` is pure. `EDGE_HIT` 0.35 `VERTEX_HIT` 0.3 `SPRINKLER_HIT` 0.45. `nearestVertex` takes its radius; there is no default. Same `MapClick` / `PromptHit` union. Host pointer → world tile → `clickHit`. Farm `eventMode` `'none'`; overlay Graphics rects too. Expand plates are HTML and take pointer.

`dropHit(world, wx, wy)` is the painted drop sprite rect in world space: origin `DROP_INSET` + 2×2 `DROP_STEP`, size `DROP_FACE` (CSS px at scale 1, then `/ TILE`). Topmost drop wins. Overflow into a neighbour still picks that drop. `clickHit` uses it.

Pipe drag-to-draw is view-local. Armed `buy-pipe` only, and only when the press lands within `EDGE_HIT` of an edge: left-drag builds `pendingPipe = routeEdges(anchor, roundVertex(ptr), shift).filter(pipeOk)`, recomputed each move, never accumulated. Ghost those edges. Pointer up commits `placePipe` per edge in log order, whole run or nothing. An empty run on release places the one edge under the pointer and re-anchors at its far vertex, so clicks chain. No new `Act`. No new `Place` arm. Right-click / `cancelPlace` drops the run and the anchor.

A press in the tile centre pans, exactly as unarmed — the centre of a tile is not a pipe site, so it keeps the pan.

Wire drag is view-local too: press an `out` disc, release on an `in` disc, and the host dispatches `armWire` then `placeWire`. Release anywhere else keeps the arm, so click-click is unchanged.

The lens the view paints with is the effective lens: `toolLens` when a sku forces one, else the picked `lens` — [[ui/lens]].

An armed sprinkler snaps at `SPRINKLER_HIT`: roughly two thirds of a tile reaches a corner, against a quarter at `VERTEX_HIT`. Delete, inspect and hover keep the tight radius, because those compete with the cell under them. Placement does not: while a sprinkler is armed nothing else wants the click.

Sprinkler AoE on hover is view: unarmed, vertex within `VERTEX_HIT` of a placed sprinkler → overlay `aoe()` wash. Armed ghost AoE unchanged. Wetness + tool AoE still lens / `PIPE_PLACE` / delete.

No `World.pulse`. Last-action highlight gone.

## `__view`

`window.__view`, installed by `map.tsx` beside `__world`. Playwright. Not Save. Not sim. Unmount / `World` swap: destroy the `Application` with `releaseGlobalResources`, delete the hook.

| field | is |
|---|---|
| `cam` | live `Camera` |
| `pendingPipe` | view-local drag run |
| `hit(wx, wy)` | `clickHit` |
| `vfxN` | count of visible VFX sprites this frame |

Locator `data-vfx` is not proof of paint. `__view.vfxN` is.

## Invariants

`view.scan` — View does not walk `live` / `forEachCell` on the tick or dirty path. Dirty patches use existing indexes and World instance lists. Scanning the whole farm from view dirty is a defect. Review enforces. Do not spy on `forEachCell`.

`view.hit` — Farm sprites `eventMode` `'none'`. Hits are `hit.ts` world-space math. Overlay Graphics do not take pointer.

`view.hud` — HUD / docks / panels are React. Not in Pixi. No `@pixi/react`. No Pixi HUD.

`view.ticker` — Sim is not interpolated. View vehicles keep `QUAD_FOLLOW`. App owns the `DT_MAX` accumulator. Pixi ticker paints. `ping` is discrete dirty only.

`view.route` — `routeEdges` is pure: an L path along the lattice, long axis first, `flip` turning the corner the other way, unique edges, endpoints joined. Same start and end is an empty run.

`view.lens` — Effective lens = `toolLens` when a sku forces one, else `lens`. `toolLens` lives exactly as long as the arming and never overwrites the picked lens. An unlocked lens dies when the Lens dock closes; a locked one survives. `leaveShop` does not touch the lens.

`view.outline` — Hover paints one outline per footprint: the boundary of the union of its cells, internal edges dropped, one `data-cell-stroke` element. Directed cell-edge set; opposite edges cancel; walk the remainder. Same path for `data-furnace-cover`. Stroke sits inside a 1-unit pad so the 2-wide stroke is not clipped.

`view.furnace-cover` — Armed `buy-furnace` (ghost follows hover) and unarmed hover of a placed furnace (either cell): one `data-furnace-cover` path, the union of covering cells (Chebyshev ≤ `FURNACE_REACH` over the 1×2, derived 7×8). `fill-none` `stroke-ink` `strokeWidth` 2. Clip to owned (`inWorld`); drop fade and off-farm cells. Internal edges dropped. Footprint `data-cell-stroke` stays. Not sprinkler fill. Not a lens. Not a dock. Not Pixi overlay wash.

`view.flow` — The flow `Graphics` repaints on the Pixi ticker, never from a `DirtyReason`. It carries no frames and no sim state. Pipe dash direction is a view-local BFS from source vertices over conducting edges. Each half paints only while its own overlay is up: dashes with `pipesOverlay`, beads with the `sensors` lens. Faint pipe does not flow — nothing reads on a network you are not looking at.

`view.edge` — Atlas rasters `dirt-edge` / `dirt-inset` with `EDGE_PAD` 4 viewBox units on every side (32×32 source). Other keys stay viewBox-tight. Equal pad keeps the 24-unit cell at texture center. Placement: 24-unit content fills the cell; lip/inset paint onto the neighbour.

`view.source` — `pipe-source` on pump / rain-tank occupied cells only while pipes overlay is on (`lens === 'pipes'` or place delete or a `PIPE_PLACE` sku). Not faint. Hidden otherwise. Joints stay always-on/faint.

`view.drop` — Drop face scale `DROP_FACE / TILE` on a 24-unit atlas sprite. Pack `DROP_INSET` `DROP_STEP` 2×2. `dropHit` is that sprite rect; topmost wins; overflow into a neighbour still picks that drop. Constants next to `TILE` in `camera.ts`.

`view.vfx.drain` — `VfxLayer.tick` drains `World.bursts` every frame. Do not wait for `DirtyReason` `'vfx'`. Vertex: sprite `anchor` 0.5 at the vertex (px). Cell: origin at the cell corner. `__view.vfxN` is visible VFX sprite count this frame. Locator `data-vfx` is not proof of paint. Working furnace mounts `furnace` at the south cell and `furnace-smoke` at the origin cell (chimney). File `src/assets/vfx/vfx-furnace-smoke.svg`. Reduced motion: frame 0 both. Idle: neither.

`view.variety` — Plant ripe, fruit, cask, tree unripe/ripe, and graft faces select `varietyGroup(crop, variety)`. Never a ladder. Two Varieties of one crop that share a `tier` `'variant'` take `'variant'` then `'variant-2'` in `VARIETIES[crop]` order. One such Variety takes `'variant-2'` (the distinct face). HUD chrome uses the same selector in `svgs.ts`.

Assumption: [[art/tilled-edges]] / [[art/vfx]] follow the pad / drain / vertex-anchor rules.
Assumption: `furnace-smoke` viewBox `24×24`, frames `f0`–`f3`, cell-anchor at the origin cell corner.
