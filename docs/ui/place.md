# Place

Types [[architecture/world]]. Chrome [[ui/hud]]. Look [[ui/inspect]]. `Place` / `StayArmed` live on `sim/world.ts`.

Delete is the left-ribbon **Delete** → `armDelete()` → `{ kind: 'delete' }`. Not a shop SKU. `buy` never arms delete. Packs never arm — `buy` merges seeds into inventory.

Truck is not a Place SKU. Unarmed click.

Map `STAY_ARMED` SKUs (ghost follow + `promptHit`): `buy-pipe` `buy-valve` + three sprinklers + fifteen sensor-cell SKUs. Delete via `place.kind === 'delete'`. Wire via `place.kind === 'wire'`.

Confirm does **not** set `none` for StayArmed, **valve**, and **tiles** (`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`). Ghost stays.

Disarm on confirm: `buy-pumpjack` `buy-rain-tank` `buy-tap` `buy-chest` `buy-grinder` `buy-compost-box` `buy-mill` `buy-jam` `buy-still` `buy-barrel` `buy-freezer` `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` and item SKUs.

Pay on confirm only. No charge on cancel. No refund on delete. Pan/zoom stay live except armed `buy-pipe` left-drag (that drag is the pending run, not pan). While armed, `readPrompt` is place or blocked only.

Build cluster on the left ribbon, not in a dock. Trio **Delete** **Rotate** **Cancel** iff delete or sku in `GHOST_SKUS`, derived from the Water, Processing, Storage, Vehicles, and Sensors shelves — [[ui/build]] [[ui/sensors]]. Tiles and fence: no trio, they are paint tools. Compost-box does get the trio; the old hand-written list had dropped it. Rotate is a no-op unless `buy-sprinkler-vert` (`ns` ↔ `ew`). No rotatable sensor SKU. Facing lives on `Place`. Ghost uses `place.facing`. Hangar and field silos: door south, no rotate.

Shop and Build docks `left-32` past the `w-24` ribbon, `top-20` level with it. Ghosts stay on the map. Both docks can arm: a search result acts where it lives, whichever dock is open — [[ui/shop]].

Esc / dock **×** / a rail toggle that closes **Shop** or **Build** / leaving the shop system → `leaveShop`: `cancelPlace` and clear the search box. `leaveShop` does not touch the lens: `toolLens` ends with the arming — [[ui/lens]]. Selecting Build **Sensors** (`logic`) sets and locks `lens = 'sensors'` and does not arm. Esc inside a non-empty search box clears the box and nothing else. Right-click / left-ribbon **Cancel** → `cancelPlace` only.

## Pointer

Canvas host. Pan / zoom / `clickHit` as now, except armed `buy-pipe` left-drag is the pending run, **not pan**. Other arms / unarmed: pan unchanged. Wheel zoom stays. Expand plates take pointer — [[ui/hud]].

| pointer | when `place.kind === 'sku'` or `'delete'` or `'wire'` | ui |
|---|---|---|
| move | anywhere | ghost follows the hit. `pointer-events-none`. Wire: pending bezier |
| hover valid, can pay | `prompt.kind === 'place'` | Map `cursor-pointer` |
| hover else | blocked or off-map | Map `cursor-crosshair` |
| left-drag from an edge | `place.id === 'buy-pipe'` | routed run, **not pan**. Press in the tile centre pans instead. View-local `pendingPipe: Edge[]` from `routeEdges`. Ghost those edges (`data-pipe-ghost`) |
| left up | `buy-pipe` | `placePipe` per pending edge, log order, whole run or nothing. Stay armed. Empty run: place the one edge under the pointer and re-anchor |
| left valid, can pay | confirm (not `buy-pipe` drag) | StayArmed / valve / tiles / sensors: stay. Else ghost off |
| left valid input, `kind === 'wire'` | `placeWire` | fan-out ok; fan-in stacks (many wires on one input; second finalize does **not** replace) |
| press an `out` disc, release on an `in` disc | `armWire` then `placeWire` | drag wiring. Release anywhere else keeps the arm, so click-click is unchanged |
| left, that A→B already exists | drop that wire | **Remove wire**. `place none` |
| left cycle | no-op | **Cannot loop**. Place stays |
| left blocked | no-op | look already has the string. Wire: **Cannot wire here** |
| right | `cancelPlace` | ghost off. Pending pipe run dropped uncommitted. Lens untouched |
| Esc / shop **×** / Shop close / leave shop | `cancelPlace` | ghost off. Pending run and anchor dropped. Lens untouched |
| left-ribbon Cancel | `cancelPlace` | ghost off. Pending run dropped. Lens untouched |

Valve stays click-per-edge. Pan while it is armed.

Armed shop row (`place.kind === 'sku' && place.id === id`): selected. Label `skuLabel` + coin + price.

Look: `lookText`. Armed with no cell still place / delete copy, not **—**. Status uses roof tint while armed.

## Hover cell

Always one cell on `floor` of the world pointer while on the map. Not gated on sku. Pointer leave → none.

One HTML overlay SVG `path` over the canvas (`fill-none` `strokeWidth` 2): the boundary of the union of the footprint cells, internal edges dropped. Every footprint in the game is rectangular, so that boundary is one rect today; the union rule is what stops an L-shaped building bringing the grid back. Hook: `data-cell-stroke` on that one path. Farm sprites have no DOM.

Unarmed, and while pipe / valve / sprinkler / delete / sensor-cell / wire armed: outline always `stroke-ink`. Pipe / sprinkler / delete ghosts in addition. Pipe ghost is not a black bar.

Item / cell / tile SKUs: valid `stroke-ink`, blocked `stroke-roof`. Place ghosts for pumpjack / still / hangar / silo already cover footprint — keep. Pumpjack, rain-tank, still: both occupied cells. Hangar and field silos: all six. Outline stays and matches.

Unarmed hover of a multi-cell building (house, hangar, field silo, still, pumpjack, rain-tank, tree, seed-silo, additive-store): one outline around **the whole instance**, no internal edges. Same `stroke-ink`. Ghost footprints (pumpjack, rain-tank, still, hangar, the three field silos) are the same one outline.

## Last action

Gone. No gold cell. No pulse label on the map. Look line + ghost remain the confirm. No `World.pulse`.

## Ghosts

HTML overlays over the canvas. Tokens [[art/palette]] / `@theme`. No unnamed hex. Farm sprites have no DOM.

Item SKUs and 1-cell buildings (`buy-chest` `buy-grinder` `buy-tap` `buy-compost-box` `buy-mill` `buy-jam` `buy-barrel` `buy-freezer` and the fifteen sensor cells) and tiles: 64px `skuInner` + **Place {skuLabel}** under the pointer. Screen-fixed, `ptr + 16,16`. Chip `bg-house` `px-2` `py-0.5` `text-base` `text-ink`. `pointer-events-none`. Drop items on a Plot. Buildings replace a plot (`placeSolidOk`). Tiles: `isTileSite` — untilled bare or existing tile, keep `ground`. Grass is not a tile site. Compost-box, mill, jam, barrel, freezer disarm. Sensor cells stay armed. Tiles stay armed.

`buy-pumpjack` `buy-rain-tank`: 2-tile ghost (48×24 jack+trough / tank). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`.

`buy-still`: 2-tile ghost like pumpjack (48×24). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`.

`buy-hangar`: 3×2 ghost (`HANGAR_W` × `HANGAR_H`). `buy-silo-seed` `buy-silo-spray` `buy-silo-produce`: 2×3 ghost (`SILO_W` × `SILO_H`). Origin = hovered NW cell, extends east and south. Confirm occupies the six cells. Disarm. Hover valid: all six `stroke-ink`. Blocked: all six `stroke-roof`. Copy **Place Vehicle hangar** / **Place Seeding silo** / **Place Spraying silo** / **Place Produce silo**. Pad cells are not in the ghost. Place does not require pad free. Tractor / trailers are hangar-buys, not Place SKUs. [[ui/vehicles]]

## Pipe / valve

`buy-pipe` `buy-valve`. Nearest edge of the hovered cell, only if the pointer is within **0.35** tile of that edge. Corner → one nearest edge, never two.

Ghost is not a black bar. Not `item-pipe.svg`. Not a 64px item.

While any `PIPE_PLACE` sku is armed, the overlay paints the **lattice**: every owned edge carrying no segment, `ink` at `LATTICE_ALPHA` — preference. Pipes go on the lines, and the player sees that before the first click.

While there is an `edgeHit` (or a `pendingPipe` run), each pending edge’s two endpoint vertices draw the **post-confirm** junction: `pipeFit` from the incident arm set **including every pending edge**. Those vertices show the ghost (`data-pipe-ghost`, HTML overlay `<use>`). Ghost wetness = C of the component after confirm. Isolated pending run, no source touch: dry.

Valve: the edge midpoint also draws the open-valve art at 0.7 (`data-valve-ghost`) — the body preview of what is being placed.

Cell outline stays `stroke-ink`. Copy **Place Pipe** / **Place Valve**. Stay armed.

Already piped / not an edge / unowned → **Cannot place here**. Valve on a valved edge → **Pipe already has a valve**. Poor → **Cannot afford**. `buy-valve` on an owned edge with no pipe lays the pipe and the valve, charging both, or neither. On a bare piped edge it charges the valve alone. — [[mechanics/water]] `water.autolay`.

## Pipe run

Armed `buy-pipe` only. Left-drag is the run **only when the press lands on an edge** — within `EDGE_HIT` of the nearest edge. Press anywhere else in the tile pans, exactly as unarmed. No rebound button, no modifier.

`routeEdges(a, b, flip)` in `hit.ts` is pure: an L path along the lattice, long axis first, Shift flipping the corner. `pendingPipe = routeEdges(anchor, roundVertex(ptr), shift).filter(pipeOk)`, recomputed every move, never accumulated — a fast diagonal drag is a connected run, not confetti.

Anchor is the vertex nearest the press.

| pointer | result |
|---|---|
| up, pending non-empty | commit `placePipe` per edge, log order. Anchor drops. Stay armed |
| up, pending empty | place the single nearest edge, re-anchor at its far vertex. Click-click chains from there |
| move with an anchor and no button | preview the route from the anchor |
| right-click / Esc / Cancel | drop anchor and preview, nothing paid |

Chip while a run is pending: segment count and total. Total over `money` → the whole run is blocked, **Cannot afford**, no partial commit. Mid-run truncation is gone.

Pipes always drawn (joints, valves, sprinklers, fences). Faint (`opacity` 0.35, preference) when the effective lens is not `pipes` and place is not delete / a `PIPE_PLACE` sku. Wetness tint + sprinkler AoE wash still lens / tool — [[ui/lens]]. Wires painted iff the effective lens is `sensors` — [[ui/sensors]].

`PIPE_PLACE`: `buy-pipe` `buy-valve` `buy-rain-tank` `buy-tap` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-well` `buy-pumpjack`.

## Sprinkler

`buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large`. Snap nearest vertex (`VERTEX_HIT` 0.3). No incident-pipe gate.

Ghost = sprinkler at V + AoE wash `fill-water` 0.35. Not a cell. Not a 64px item. Stay armed. Click, stay armed.

Vertical facing from `Place.facing`. Rotate toggles.

Copy **Place Sprinkler** / **Place Vertical sprinkler** / **Place Large sprinkler**.

Unowned / occupied / AoE off-map → **Cannot place here**. Poor → **Cannot afford**.

Unarmed: hovering a placed sprinkler vertex within `VERTEX_HIT` paints that head’s `aoe()` wash (`fill-water` 0.35). Armed ghost AoE unchanged.

Unarmed, with `unlock-smart-irrigation` and a sprinkler under the vertex: **Tune sprinkler** → [[ui/docks]] object HUD. Sprinkler `in` after the same row is a wire port in `sensors` — [[ui/sensors]]. Tune unchanged.

## Delete

`place.kind === 'delete'`. Stay armed. No money, no refund. No 64px ghost.

Same edge hit as pipe. Same vertex snap as sprinkler. Nearest wire bezier within `VERTEX_HIT` first. Then `deleteBuilding(at)`.

| hit | copy | result |
|---|---|---|
| bezier within `VERTEX_HIT` | **Delete wire** | remove wire |
| owned piped edge, no valve | **Delete pipe** | remove pipe |
| owned valved edge | **Delete valve** | valve off, pipe stays, incident wires drop |
| owned sprinkler vertex | **Delete sprinkler** | remove sprinkler; incident wires drop |
| pumpjack | **Delete pumpjack** | both cells → empty |
| rain-tank | **Delete rainwater tank** | both cells → empty |
| tap | **Delete tap** | cell → empty |
| well | **Delete well** | cell → empty |
| chest | **Delete chest** | slots become drops on at, cell → empty |
| grinder | **Delete grinder** | cell → empty |
| compost-box | **Delete compost box** | cell → empty |
| mill | **Delete mill** | cell → empty |
| still | **Delete pot still** | cell → empty |
| barrel | **Delete wine barrel** | cell → empty |
| jam | **Delete jam machine** | cell → empty |
| freezer | **Delete freezer** | slots become drops on at, cell → empty |
| hangar, stores no vehicle or trailer | **Delete vehicle hangar** | six cells → empty |
| hangar that stores a vehicle or a trailer | **Cannot delete here (stores a vehicle)** | no-op |
| silo-seed / silo-spray / silo-produce | **Delete seeding silo** / **Delete spraying silo** / **Delete produce silo** | six cells → empty |
| lever / button / lamp / or / and / not / pulser / counter / sensor-water / sensor-fert / sensor-harvest / water-system / vehicle-detector / sensor-day / traffic-light | **Delete lever** / **Delete button** / **Delete lamp** / **Delete OR gate** / **Delete AND gate** / **Delete NOT gate** / **Delete pulser** / **Delete counter** / **Delete water sensor** / **Delete fertilizer sensor** / **Delete harvest sensor** / **Delete water-system sensor** / **Delete vehicle detector** / **Delete day sensor** / **Delete traffic light** | cell → empty; incident wires drop. Traffic-light delete also strips wait stops targeting that cell |
| house, starter, truck, rock, tree, growing / ripe / dead / rotten, empty, untilled, infertile | **Cannot delete here** | no-op |

`deletePipe` / `deleteSprinkler` / `deleteBuilding` require `place.kind === 'delete'`. They do not clear place.

Delete pipe / sprinkler: look chip + cell outline. Pipes stay Pixi. Cell outline stays `stroke-ink`.

Rocks, soil, plants stay pickaxe / shovel / harvest. Trees: shovel **Dig**, no harvest — [[ui/inspect]]. Tree seed plant is a hand `plant`, not a Place SKU.

`placeLabel` = `skuLabel`. Place / pulse copy is **Place {skuLabel}**. Unarmed valve **Open valve** / **Close valve**. Pump / tank / tap / well + container **Fill**; else **Need a bucket**. Smart sprinkler vertex **Tune sprinkler**. Blocked **Cannot place here**. Poor **Cannot afford**. Valve already on edge **Pipe already has a valve**. Wire: **Cannot wire here** / **Cannot loop** / **Remove wire**. Sensor Flip / Press / Tune: [[ui/sensors]].

Pipe / delete follow copy: HTML chip under the pointer, same `bg-house` `px-2` `py-0.5` `text-base` `text-ink`, no `skuInner`.

## Queue markers

Every cell the local seat's queue resolves to through `dest(i, world)` gets one small triangle in the world-transformed HTML overlay (`data-queued="{col},{row}"`), deduped by cell, `bg-house/85` clipped to a downward triangle, `QUEUE_MARK` 5 — preference. Local seat only. Derived from `Seat.queue` on render; not in Save, not in the digest, not a `DirtyReason`. `enqueueOn` already pings.

## Drop tip / pickup

Dropped item face `DROP_FACE` 33 CSS px — preference. Packed `DROP_INSET` 4 / `DROP_STEP` 6 — preference. Click / hover on the painted face, including overflow into a neighbour, is that drop (`dropHit` → cell `at`). Empty cell pixels are not the drop. Hitbox is the sprite rect. No outline.

Drop tip: shovel / pickaxe / container on that face — `itemLine`, `bg-ink` `px-2` `py-1` `text-base` `text-house`, screen-fixed `ptr + 14, -28`. `pointer-events-none`.

## e2e

Keep by name: `data-cell-stroke` `data-pipe` `data-pipe-ghost` `data-sprinkler` `data-vfx` `data-valve-ghost` `data-queued`.

Farm sprites have no DOM. Those hooks live on HTML overlays over the canvas (`pointer-events-none`). `data-cell-stroke` keeps `stroke-ink` / `stroke-roof` and is one element per hover, never one per cell. `data-pipe-ghost` keeps pipe-junction `<use>` (not a black bar). Overlay `<use>` the same pipe-fit / valve / sprinkler groups as today. Not `svgs.ts`. Placed `data-pipe` carries `data-wet` `0`|`1` and stays while the joint exists (lens off is faint, not absent). `data-vfx={id}` present while that VFX is mounted; count `__view.vfxN`; frame cuts are Pixi, not CSS `.vfx-frame` — [[art/vfx]].

`window.__view` (`map.tsx`, beside `__world`): `cam`, `pendingPipe`, `hit(wx, wy)`, `vfxN`. Playwright. Not Save.

Assumption: cell outline stays `floor` of the pointer; last `World.drops` face wins overlap. Placed `data-pipe` / `data-sprinkler` / `data-vfx` are locator overlays; paint is Pixi. Mid-run poor is existing `placePipe` **Cannot afford**. Pointer-up commits pending even if the pointer left the canvas. `vfxN` is live VFX mount count.
