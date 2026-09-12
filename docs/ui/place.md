# Place

`Place` / `StayArmed` live on `sim/world.ts`. Types [[architecture/world]]. Chrome [[ui/hud]]. Look [[ui/inspect]]. Size [[items/buildings]].

Demolish is the left-ribbon **Demolish** → `armDelete()` → `{ kind: 'delete' }`. Not a shelf SKU. Packs never arm — `buy` merges seeds into inventory. Truck is not a Place SKU.

Pay on confirm only. No charge on cancel. No refund on demolish.

Copy **Place {skuLabel}** / **Demolish {skuLabel}**. Special demolish copy below. Sensor Flip / Press / Tune: [[ui/sensors]].

## StayArmed

Confirm does not set `none` for `STAY_ARMED` SKUs (`buy-pipe` `buy-valve` + three sprinklers + fifteen sensor-cell SKUs), for `place.kind === 'delete'`, for `place.kind === 'wire'`, for valve, and for tiles (`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`). Ghost stays.

Shift held on the confirming click keeps every other sku armed: App reads `Seat.place` before `world.click(at)`, and when the click disarmed a sku it re-arms the same one through `world.buy(id)`. `buy` on a place sku only writes `Seat.place`; the money is spent by the confirm that already happened. `onClick` on `MapView` carries the modifier. Multiplayer replays it as the `Act.buy` it is.

Every other place sku disarms on confirm.

Pan/zoom stay live except armed `buy-pipe` left-drag (pending run, not pan) and armed `buy-fence` left-drag from a fence site. While armed, `readPrompt` is place or blocked only.

**Demolish** shows while Build is open or something is armed. **Cancel** shows iff `place.kind !== 'none'`. **Rotate** only for `ROTATABLE` (`buy-sprinkler-vert`; sorter four facings). Facing lives on `Place`. Ghost uses `place.facing`. Hangar and field silos: door south, no rotate. Build is the only panel that arms — [[ui/build]] [[ui/hud]].

Esc / dock **×** / the rail toggle that closes **Build** / opening another panel → `leaveBuild`: `cancelPlace`, clear the search box, restore an unlocked Build peek. `toolLens` ends with the arming — [[ui/lens]]. A locked lens is not touched. Right-click / left-ribbon **Cancel** → `cancelPlace` only.

## Pointer

Canvas host. Wheel zoom stays. Expand plates take pointer — [[ui/hud]].

| pointer | when | result |
|---|---|---|
| move | sku / delete / wire armed | ghost follows the hit |
| hover valid, can pay | `prompt.kind === 'place'` | pointer |
| hover else | blocked or off-map | crosshair |
| left-drag from an edge | `buy-pipe` | routed run, not pan. Press in the tile centre pans. View-local `pendingPipe` from `routeEdges` |
| left-drag from a fence site | `buy-fence` | routed cell run, not pan. View-local `pendingFence` from `routeCells` |
| left up | `buy-pipe` | `placePipe` per pending edge, whole run or nothing. Stay armed. Empty run: place the one edge under the pointer and re-anchor |
| left up | `buy-fence` | `confirmPlace` per pending cell, whole run or nothing. Stay armed. Empty run: place the cell under the pointer if it takes a fence and re-anchor |
| left valid, can pay | confirm (not pipe drag) | StayArmed / valve / tiles / sensors: stay. Else ghost off |
| Shift + left valid, can pay | confirm | the same sku is re-armed |
| left valid input, wire | `placeWire` | fan-out ok; fan-in stacks (second finalize does not replace) |
| press `out` disc, release on `in` | `armWire` then `placeWire` | drag wiring. Release anywhere else keeps the arm |
| left, that A→B already exists | drop that wire | **Remove wire**. `place none` |
| left cycle | no-op | **Cannot loop**. Place stays |
| left blocked | no-op | look already has the string. Wire: **Cannot wire here** |
| right / Esc / Cancel / Build close | `cancelPlace` | ghost off. Pending run dropped. Lens untouched |

Valve stays click-per-edge. Pan while it is armed.

Armed Build card (`place.kind === 'sku' && place.id === id`): selected. Look: `lookText`. Armed with no cell still place / demolish copy, not **—**. Status uses roof tint while armed.

## Hover cell

Always one cell on `floor` of the world pointer while on the map. Pointer leave → none.

One overlay path: the boundary of the union of the footprint cells, internal edges dropped. Unarmed hover of a multi-cell building: one outline around the whole instance. Ghost footprints match that outline. Valid `stroke-ink`, blocked `stroke-roof` for item / cell / tile SKUs. Pipe / valve / sprinkler / demolish / sensor-cell / wire armed: outline always ink.

## Covering

Stroke-only outline of the covering area: Chebyshev ≤ `FURNACE_REACH` over the 1×2 — [[mechanics/machines]] `machines.furnace-cover` [[architecture/view]] `view.furnace-cover`. Not the sprinkler wash. Not a lens. Not a dock.

Armed `buy-furnace` ghost, and unarmed hover of a placed furnace (either cell): covering stroke. Else none. Clip to owned. Empty intersection: no element. Blocked place still paints covering ink; footprint may be roof.

## Ghosts

HTML overlays over the canvas. Tokens [[art/palette]]. Farm sprites have no DOM. Footprint from `skuBase` / `SKU_FOOT` — [[items/buildings]]. Ghost follows that footprint. Item SKUs, 1-cell buildings, tiles: chip **Place {skuLabel}** under the pointer. Compost-box, jam, barrel, freezer disarm. Sensor cells stay armed. Tiles stay armed. Grass is not a tile site. Burrow is not a tile site, not a fence site, not `placeSolidOk` — [[mechanics/burrow]] `burrow.block`.

Quad / tractor / trailers are hangar-buys, not Place SKUs — [[mechanics/vehicles]].

## Pipe / valve

Nearest edge of the hovered cell, only if the pointer is within `EDGE_HIT` of that edge. Corner → one nearest edge, never two.

While any `PIPE_PLACE` sku is armed, the overlay paints the lattice: every owned edge carrying no segment, ink at `LATTICE_ALPHA` — preference.

Pending edges draw the post-confirm junction (`pipeFit` including every pending edge). Isolated pending run, no source touch: dry. Valve: the edge midpoint also draws the open-valve art. Copy **Place Pipe** / **Place Valve**. Stay armed.

Already piped / not an edge / unowned → **Cannot place here**. Valve on a valved edge → **Pipe already has a valve**. Poor → **Cannot afford**. `buy-valve` on an owned edge with no pipe lays the pipe and the valve, charging both, or neither. On a bare piped edge it charges the valve alone. — [[mechanics/water]] `water.autolay`.

## Pipe run

Armed `buy-pipe` only. Left-drag is the run only when the press lands on an edge. Press anywhere else in the tile pans. `routeEdges(a, b, flip)` is pure: an L path along the lattice, long axis first, Shift flipping the corner. `pendingPipe` recomputed every move, never accumulated. Anchor is the vertex nearest the press.

Up, pending non-empty: commit per edge, stay armed. Up, pending empty: place the single nearest edge, re-anchor at its far vertex. Right-click / Esc / Cancel: drop anchor and preview, nothing paid. Whole run or nothing. Total over `money` → **Cannot afford**. Pointer-up commits pending even if the pointer left the canvas.

## Fence run

Armed `buy-fence`. Same L-path on cells: `routeCells` / `fenceOk`. Press on a fence site or an already fenced cell starts the run. Press anywhere else pans. Whole run or nothing.

Pipes always drawn. Faint (`opacity` preference) when the effective lens is not `pipes` and place is not demolish / a `PIPE_PLACE` sku. Wetness tint + sprinkler AoE wash still lens / tool — [[ui/lens]]. Wires painted iff the effective lens is `sensors` — [[ui/sensors]].

`PIPE_PLACE`: `buy-pipe` `buy-valve` `buy-tap` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-well` `buy-pumpjack`.

## Sprinkler

Snap nearest vertex (`VERTEX_HIT`). No incident-pipe gate. Ghost = sprinkler at V + AoE wash. Stay armed. Vertical facing from `Place.facing`. Rotate toggles.

Unowned / occupied / AoE off-map → **Cannot place here**. Poor → **Cannot afford**.

Unarmed: hovering a placed sprinkler vertex within `VERTEX_HIT` paints that head’s `aoe()` wash. Unarmed, with `unlock-smart-irrigation` and a sprinkler under the vertex: **Tune sprinkler** → [[ui/docks]]. Sprinkler `in` after the same row is a wire port in `sensors` — [[ui/sensors]].

## Demolish

`place.kind === 'delete'`. Stay armed. No money, no refund.

Same edge hit as pipe. Same vertex snap as sprinkler. Nearest wire bezier within `VERTEX_HIT` first. Then `deleteBuilding(at)`.

`place.demolish-land` — Every cell a building stood on comes back as soft untilled bare ground, `bare('soft', 0)`. No `Soil`, so no water and no fertilizer carry over, and the cell is a paving site and a fence site again.

`deletePipe` / `deleteSprinkler` / `deleteBuilding` require `place.kind === 'delete'`. They do not clear place.

| hit | copy | result |
|---|---|---|
| bezier within `VERTEX_HIT` | **Demolish wire** | remove wire |
| owned piped edge, no valve | **Demolish pipe** | remove pipe |
| owned valved edge | **Demolish valve** | valve off, pipe stays, incident wires drop |
| owned sprinkler vertex | **Demolish sprinkler** | remove sprinkler; incident wires drop |
| hangar that stores a vehicle or a trailer | **Cannot demolish here (stores a vehicle)** | no-op |
| fenceable sensor + `hasFence` | **Demolish {skuLabel}** | sensor and wires go, fence remains. Traffic-light demolish also strips wait stops targeting that cell |
| fenced cell, host | **Demolish wooden fence** | fence goes, cell keeps what is under it |
| bare plot carrying paving, host | **Demolish paving** | slab goes, ground stays |
| house, starter, truck, rock, tree, growing / ripe / dead / rotten, empty, bare untilled, Necronomicon | **Cannot demolish here** | no-op |
| else a building the body takes down | **Demolish {skuLabel}** | every cell it stood on |

`place.demolish-filter` — The copy table and `deleteBuildingBody` cover the same set. `DELETE_NAME` is the name lookup, not the gate: a kind the body takes down and the table does not name reads **Cannot demolish here** and the click dies before `confirmPlace`. Fence and paving are host only in both, so a guest reads **Cannot demolish here**. Paving needs `isPlot` on both sides: a slab under the house stays.

Rocks, soil, plants stay pickaxe / shovel / harvest. Trees: shovel **Dig**, no harvest — [[ui/inspect]]. Tree seed plant is a hand `plant`, not a Place SKU.

Unarmed valve **Open valve** / **Close valve**. Pump / tap / well + container **Fill**; else **Need a bucket**. Blocked **Cannot place here**. Poor **Cannot afford**. Fenceable sensor on a fenced cell: **Place {skuLabel}**. Non-fenceable on a fence: **Cannot place here**. Fence on a fenceable sensor: **Place Wooden fence**. Burrow place / tile / fence / tree-seed: **Cannot place here**, not **Fences need untilled ground**.

## Ghost connections

`place.ghost-io` — While `place.kind === 'sku'`, the ghost paints the connections that building will have, for that building alone. Pixi overlay beside the pads it mirrors, `GHOST_IO_ALPHA` — preference. Off-farm cells drop.

`skuBase(id, at)` is the one footprint source. `strokeFoot` reads the same call, so the outline and the connections cannot disagree.

| set | draws |
|---|---|
| `IO_SKUS` | `link-in` west of the south row, `link-out` east of it. Always, chest there or not |
| `PAD_SKUS` | `pad-drop` on `dropoffPad`, `pad-take` on `takeupPad` |
| `HANGAR_PAD_SKUS` / `SILO_PAD_SKUS` | `hangar-return` on `hangarPad` / `siloPad` |

Pads need `unlock-vehicles` done. Before that research the ghost shows chutes only. The chutes are not gated. The three sets mirror class flags, so `place.ghost-io` places every sku in `SKU_FOOT` and asserts the built instance agrees.

## Queue markers / drops

Every cell the local seat's queue resolves to through `dest` gets one triangle in the overlay, deduped by cell, `QUEUE_MARK` — preference. Local seat only. Derived from `Seat.queue` on render.

Dropped item face `DROP_FACE` — preference. Click / hover on the painted face is that drop. Empty cell pixels are not the drop. Last `World.drops` face wins overlap. Drop tip: shovel / pickaxe / container on that face.

Cell outline stays `floor` of the pointer.
