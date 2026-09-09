# Place

Types [[architecture/world]]. Chrome [[ui/hud]]. Look [[ui/inspect]]. `Place` / `StayArmed` live on `sim/world.ts`.

Demolish is the left-ribbon **Demolish** → `armDelete()` → `{ kind: 'delete' }`. Not a shelf SKU. `buy` never arms it. Packs never arm — `buy` merges seeds into inventory.

Truck is not a Place SKU. Unarmed click.

Map `STAY_ARMED` SKUs (ghost follow + `promptHit`): `buy-pipe` `buy-valve` + three sprinklers + fifteen sensor-cell SKUs (`buy-logic` `buy-sensor-variety` `buy-sensor-weather` in place of `buy-or` `buy-and` `buy-water-system`). Demolish via `place.kind === 'delete'`. Wire via `place.kind === 'wire'`.

Confirm does **not** set `none` for StayArmed, **valve**, and **tiles** (`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`). Ghost stays.

Shift held on the confirming click keeps every other sku armed too: App reads `Seat.place` before `world.click(at)`, and when the click disarmed a sku it re-arms the same one through `world.buy(id)`. `buy` on a place sku only writes `Seat.place`; the money is spent by the confirm that already happened, so nothing is paid twice. `onClick` on `MapView` carries the modifier — `onClick(hit, xy, shift)`. Multiplayer replays it as the `Act.buy` it is.

Disarm on confirm: `buy-pumpjack` `buy-rain-tank` `buy-tap` `buy-chest` `buy-grinder` `buy-compost-box` `buy-mill` `buy-infuser` `buy-jam` `buy-still` `buy-furnace` `buy-barrel` `buy-freezer` `buy-research-station` `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` and item SKUs.

Pay on confirm only. No charge on cancel. No refund on demolish. Pan/zoom stay live except armed `buy-pipe` left-drag (that drag is the pending run, not pan) and armed `buy-fence` left-drag from a fence site. While armed, `readPrompt` is place or blocked only.

Build cluster on the left ribbon, not in a dock. **Demolish** is always there. **Cancel** is there iff `place.kind !== 'none'`, so paving and fencing carry it too. **Rotate** only for `buy-sprinkler-vert` (`ns` ↔ `ew`); no rotatable sensor SKU. `GHOST_SKUS` gates none of the three — [[ui/hud]] [[ui/build]] [[ui/sensors]]. Facing lives on `Place`. Ghost uses `place.facing`. Hangar and field silos: door south, no rotate.

The Build dock sits `left-32` past the `w-24` ribbon, `top-20` level with it. Ghosts stay on the map. It is the only panel that arms — [[ui/build]].

Esc / dock **×** / the rail toggle that closes **Build** / opening another panel → `leaveBuild`: `cancelPlace`, clear the search box, restore an unlocked Build peek. `toolLens` ends with the arming — [[ui/lens]]. Selecting Build Water / Automation / Storage / Sensors peeks that lens with no lock and does not arm. A locked lens is not touched. Esc inside a non-empty search box clears the box and nothing else. Right-click / left-ribbon **Cancel** → `cancelPlace` only.

## Pointer

Canvas host. Pan / zoom / `clickHit` as now, except armed `buy-pipe` left-drag and armed `buy-fence` left-drag from a fence site are the pending run, **not pan**. Other arms / unarmed: pan unchanged. Wheel zoom stays. Expand plates take pointer — [[ui/hud]].

| pointer | when `place.kind === 'sku'` or `'delete'` or `'wire'` | ui |
|---|---|---|
| move | anywhere | ghost follows the hit. `pointer-events-none`. Wire: pending bezier |
| hover valid, can pay | `prompt.kind === 'place'` | Map `cursor-pointer` |
| hover else | blocked or off-map | Map `cursor-crosshair` |
| left-drag from an edge | `place.id === 'buy-pipe'` | routed run, **not pan**. Press in the tile centre pans instead. View-local `pendingPipe: Edge[]` from `routeEdges`. Ghost those edges (`data-pipe-ghost`) |
| left-drag from a fence site | `place.id === 'buy-fence'` | routed cell run, **not pan**. View-local `pendingFence: Coord[]` from `routeCells`. Ghost in the pipes layer |
| left up | `buy-pipe` | `placePipe` per pending edge, log order, whole run or nothing. Stay armed. Empty run: place the one edge under the pointer and re-anchor |
| left up | `buy-fence` | `confirmPlace` per pending cell, whole run or nothing. Stay armed. Empty run: place the cell under the pointer if it takes a fence and re-anchor |
| left valid, can pay | confirm (not `buy-pipe` drag) | StayArmed / valve / tiles / sensors: stay. Else ghost off |
| Shift + left valid, can pay | confirm | the same sku is re-armed. Ghost stays for every sku |
| left valid input, `kind === 'wire'` | `placeWire` | fan-out ok; fan-in stacks (many wires on one input; second finalize does **not** replace) |
| press an `out` disc, release on an `in` disc | `armWire` then `placeWire` | drag wiring. Release anywhere else keeps the arm, so click-click is unchanged |
| left, that A→B already exists | drop that wire | **Remove wire**. `place none` |
| left cycle | no-op | **Cannot loop**. Place stays |
| left blocked | no-op | look already has the string. Wire: **Cannot wire here** |
| right | `cancelPlace` | ghost off. Pending pipe run dropped uncommitted. Lens untouched |
| Esc / dock **×** / Build close | `cancelPlace` | ghost off. Pending run and anchor dropped. Lens untouched |
| left-ribbon Cancel | `cancelPlace` | ghost off. Pending run dropped. Lens untouched |

Valve stays click-per-edge. Pan while it is armed.

Armed Build card (`place.kind === 'sku' && place.id === id`): selected. Label `skuLabel` + coin + price.

Look: `lookText`. Armed with no cell still place / demolish copy, not **—**. Status uses roof tint while armed.

## Hover cell

Always one cell on `floor` of the world pointer while on the map. Not gated on sku. Pointer leave → none.

One HTML overlay SVG `path` over the canvas (`fill-none` `strokeWidth` 2): the boundary of the union of the footprint cells, internal edges dropped. Every footprint in the game is rectangular, so that boundary is one rect today; the union rule is what stops an L-shaped building bringing the grid back. Hook: `data-cell-stroke` on that one path. Farm sprites have no DOM.

Unarmed, and while pipe / valve / sprinkler / demolish / sensor-cell / wire armed: outline always `stroke-ink`. Pipe / sprinkler / demolish ghosts in addition. Pipe ghost is not a black bar.

Item / cell / tile SKUs: valid `stroke-ink`, blocked `stroke-roof`. Place ghosts for pumpjack / still / station / furnace / mill / infuser / hangar / silo already cover footprint — keep. Pumpjack, rain-tank, still, station: both occupied cells. Furnace: both occupied cells, 24×48. Mill / infuser: all four, 48×48. Hangar and field silos: all six. Outline stays and matches.

Unarmed hover of a multi-cell building (house, hangar, field silo, still, station, furnace, mill, infuser, pumpjack, rain-tank, tree, seed-silo, additive-store): one outline around **the whole instance**, no internal edges. Same `stroke-ink`. Ghost footprints (pumpjack, rain-tank, still, station, furnace, mill, infuser, hangar, the three field silos) are the same one outline.

## Covering

Stroke-only outline of the covering area: Chebyshev ≤ `FURNACE_REACH` over the 1×2 (derived 7×8). Not the sprinkler `fill-water` wash. Not a lens. Not a dock. Footprint `data-cell-stroke` stays.

| when | overlay |
|---|---|
| `place.kind === 'sku'` `place.id === 'buy-furnace'`, ghost follows hover | covering stroke |
| unarmed, hover a placed furnace (either cell) | covering stroke |
| else | none |

Hook: `data-furnace-cover` on one SVG `path`. `fill-none` `stroke-ink` `strokeWidth` 2. `pointer-events-none`. Union boundary of covering cells, internal edges dropped — same path rule as `data-cell-stroke`. Clip to owned (`inWorld`): drop fade and off-farm covering cells from the union. Empty intersection: no element. Blocked place still paints covering `stroke-ink`; footprint may be `stroke-roof`. Demolish / other SKUs: no covering.

## Last action

Gone. No gold cell. No pulse label on the map. Look line + ghost remain the confirm. No `World.pulse`.

## Ghosts

HTML overlays over the canvas. Tokens [[art/palette]] / `@theme`. No unnamed hex. Farm sprites have no DOM.

Item SKUs and 1-cell buildings (`buy-chest` `buy-grinder` `buy-tap` `buy-compost-box` `buy-jam` `buy-barrel` `buy-freezer` and the fifteen sensor cells) and tiles: 64px `skuInner` + **Place {skuLabel}** under the pointer. Screen-fixed, `ptr + 16,16`. Chip `bg-house` `px-2` `py-0.5` `text-base` `text-ink`. `pointer-events-none`. Drop items on a Plot. Buildings replace a plot (`placeSolidOk`). Tiles: `isTileSite` — untilled bare or existing tile, keep `ground`. Grass is not a tile site. Burrow is not a tile site, not a fence site, not `placeSolidOk`. Compost-box, jam, barrel, freezer disarm. Sensor cells stay armed. Tiles stay armed.

`buy-mill` `buy-infuser`: 2×2 ghost (`MILL_W` × `MILL_H`), origin = hovered NW cell, extends east and south, `squareSiteOk`. Confirm occupies the four cells. Disarm. No rotate. Hover valid: all four `stroke-ink`. Blocked: all four `stroke-roof`. Copy **Place Mill** / **Place Infuser**. `skuLabel` mill **Mill**; infuser **Infuser**. Pads two cells wide. [[mechanics/infusion]] `infusion.machine`

`buy-pumpjack` `buy-rain-tank`: 2-tile ghost (48×24 jack+trough / tank). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`.

`buy-still`: 2-tile ghost like pumpjack (viewBox 48×24). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`. Ghost footprint stays 2×1. Prop art occupies 1.5×1 centered in that viewBox.

`buy-research-station`: 2-tile ghost like pumpjack (viewBox 48×24). Confirm occupies both cells. Disarm. No rotate. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`. Ghost art is `STATION`, not `STILL`. Copy **Place Seed Variety Station**. `skuLabel` **Seed Variety Station**. [[ui/station]]

`buy-furnace`: 2-tile ghost viewBox 24×48, origin = hovered cell, extends south. Confirm occupies both cells. Disarm. No rotate. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`. Copy **Place Furnace**. `skuLabel` **Furnace**. Ghost footprint stays 1×2. Prop art occupies 1×1.5 south-aligned in that viewBox. Covering stroke follows this ghost — [[#Covering]].

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

## Fence run

Armed `buy-fence`. Same L-path as the pipe run, on cells: `routeCells` / `fenceOk`. Press on a fence site or an already fenced cell starts the run. Press anywhere else pans. `pendingFence` ghosts in the pipes layer with `fenceFit` joins.

| pointer | result |
|---|---|
| up, pending non-empty | commit `confirmPlace` per cell. Anchor drops. Stay armed |
| up, pending empty | place the cell under the pointer if `fenceOk`, re-anchor there |
| move with an anchor and no button | preview the route from the anchor |
| right-click / Esc / Cancel | drop anchor and preview, nothing paid |

Whole run or nothing. Total over `money` → **Cannot afford**.

Pipes always drawn (joints, valves, sprinklers, fences). Faint (`opacity` 0.35, preference) when the effective lens is not `pipes` and place is not demolish / a `PIPE_PLACE` sku. Wetness tint + sprinkler AoE wash still lens / tool — [[ui/lens]]. Wires painted iff the effective lens is `sensors` — [[ui/sensors]].

`PIPE_PLACE`: `buy-pipe` `buy-valve` `buy-rain-tank` `buy-tap` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-well` `buy-pumpjack`.

## Sprinkler

`buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large`. Snap nearest vertex (`VERTEX_HIT` 0.3). No incident-pipe gate.

Ghost = sprinkler at V + AoE wash `fill-water` 0.35. Not a cell. Not a 64px item. Stay armed. Click, stay armed.

Vertical facing from `Place.facing`. Rotate toggles.

Copy **Place Sprinkler** / **Place Vertical sprinkler** / **Place Large sprinkler**.

Unowned / occupied / AoE off-map → **Cannot place here**. Poor → **Cannot afford**.

Unarmed: hovering a placed sprinkler vertex within `VERTEX_HIT` paints that head’s `aoe()` wash (`fill-water` 0.35). Armed ghost AoE unchanged.

Unarmed, with `unlock-smart-irrigation` and a sprinkler under the vertex: **Tune sprinkler** → [[ui/docks]] object HUD. Sprinkler `in` after the same row is a wire port in `sensors` — [[ui/sensors]]. Tune unchanged.

## Demolish

`place.kind === 'delete'`. Stay armed. No money, no refund. No 64px ghost.

Same edge hit as pipe. Same vertex snap as sprinkler. Nearest wire bezier within `VERTEX_HIT` first. Then `deleteBuilding(at)`.

Every cell a building stood on comes back as soft untilled bare ground, `bare('soft', 0)` — the same ground a dug tree leaves. There is no `Soil` on it, so no water and no fertilizer carry over, and the cell is a paving site and a fence site again. `place.demolish-land`

| hit | copy | result |
|---|---|---|
| bezier within `VERTEX_HIT` | **Demolish wire** | remove wire |
| owned piped edge, no valve | **Demolish pipe** | remove pipe |
| owned valved edge | **Demolish valve** | valve off, pipe stays, incident wires drop |
| owned sprinkler vertex | **Demolish sprinkler** | remove sprinkler; incident wires drop |
| pumpjack | **Demolish pumpjack** | both cells |
| rain-tank | **Demolish rainwater tank** | both cells |
| tap | **Demolish tap** | cell |
| well | **Demolish well** | cell |
| chest | **Demolish chest** | slots become drops on at, cell |
| station | **Demolish Seed Variety Station** | both cells |
| grinder | **Demolish seed grinder** | cell |
| compost-box | **Demolish compost box** | cell |
| mill | **Demolish mill** | four cells |
| infuser | **Demolish Infuser** | four cells |
| still | **Demolish pot still** | both cells |
| furnace | **Demolish {skuLabel}** | both cells |
| barrel | **Demolish wine barrel** | cell |
| jam | **Demolish jam machine** | cell |
| freezer | **Demolish freezer** | slots become drops on at, cell |
| hangar, stores no vehicle or trailer | **Demolish vehicle hangar** | six cells |
| hangar that stores a vehicle or a trailer | **Cannot demolish here (stores a vehicle)** | no-op |
| silo-seed / silo-spray / silo-produce | **Demolish seeding silo** / **Demolish spraying silo** / **Demolish produce silo** | six cells |
| lever / button / lamp / logic / not / pulser / counter / sensor-water / sensor-fert / sensor-harvest / sensor-variety / sensor-weather / water-system / vehicle-detector / sensor-day / traffic-light | **Demolish lever** / **Demolish button** / **Demolish lamp** / **Demolish logic gate** / **Demolish NOT gate** / **Demolish pulser** / **Demolish counter** / **Demolish water sensor** / **Demolish fertilizer sensor** / **Demolish harvest sensor** / **Demolish variety sensor** / **Demolish weather sensor** / **Demolish water-system sensor** / **Demolish pressure plate** / **Demolish day sensor** / **Demolish traffic light** | cell; incident wires drop. Fenceable + `hasFence`: sensor and wires go, fence remains. Traffic-light demolish also strips wait stops targeting that cell |
| fenced cell, host | **Demolish wooden fence** | fence goes, cell keeps what is under it |
| bare plot carrying paving, host | **Demolish paving** | slab goes, ground stays |
| house, starter, truck, rock, tree, growing / ripe / dead / rotten, empty, bare untilled | **Cannot demolish here** | no-op |

`place.demolish-filter` — the copy table above and `deleteBuildingBody` cover the same set. `DELETE_NAME` in `prompt.ts` is the name lookup, not the gate: a kind the body takes down and the table does not name reads **Cannot demolish here** and the click dies before `confirmPlace`. Station and paving were exactly that. Fence and paving are host only in both, so a guest reads **Cannot demolish here** rather than a prompt that does nothing. Paving needs `isPlot` on both sides: a slab under the house stays.

`deletePipe` / `deleteSprinkler` / `deleteBuilding` require `place.kind === 'delete'`. They do not clear place.

Demolish pipe / sprinkler: look chip + cell outline. Pipes stay Pixi. Cell outline stays `stroke-ink`.

Rocks, soil, plants stay pickaxe / shovel / harvest. Trees: shovel **Dig**, no harvest — [[ui/inspect]]. Tree seed plant is a hand `plant`, not a Place SKU. Burrow: shovel **Dig**, pickaxe no-op, place / tile / fence / tree-seed refuse — [[mechanics/burrow]] `burrow.block`.

`placeLabel` = `skuLabel`. Place / pulse copy is **Place {skuLabel}**. Unarmed valve **Open valve** / **Close valve**. Pump / tank / tap / well + container **Fill**; else **Need a bucket**. Smart sprinkler vertex **Tune sprinkler**. Blocked **Cannot place here**. Poor **Cannot afford**. Valve already on edge **Pipe already has a valve**. Wire: **Cannot wire here** / **Cannot loop** / **Remove wire**. Sensor Flip / Press / Tune: [[ui/sensors]]. Fenceable sensor on a fenced cell: **Place {skuLabel}**. Non-fenceable on a fence: **Cannot place here**. Fence on a fenceable sensor: **Place Wooden fence**. Burrow place / tile / fence / tree-seed: **Cannot place here**, not **Fences need untilled ground**.

Pipe / demolish follow copy: HTML chip under the pointer, same `bg-house` `px-2` `py-0.5` `text-base` `text-ink`, no `skuInner`.

## Ghost connections

`place.ghost-io` — While `place.kind === 'sku'`, the ghost paints the connections that building will have, for that building alone. Pixi overlay layer beside the pads it mirrors, `GHOST_IO_ALPHA` 0.7 — preference. Nothing in the HTML overlay. Off-farm cells drop (`inWorld`).

`skuBase(id, at)` on `building.ts` is the one footprint source: `SKU_FOOT` maps a sku to `{ w, h }`, absent for pipe, valve, sprinkler, tiles, fence and item SKUs. `strokeFoot` in `map.tsx` reads the same call, so the outline and the connections cannot disagree.

| set | draws |
|---|---|
| `IO_SKUS` (`machine.ts`, beside `isIoCell`) | `link-in` west of the south row, `link-out` east of it — the `machineWest` / `machineEast` cells at the `machineLinks` offsets. Always, chest there or not: the point is showing where the chest goes |
| `PAD_SKUS` (`vehicle.ts`, beside `padBuildings`) | `pad-drop` on `dropoffPad`, `pad-take` on `takeupPad` |
| `HANGAR_PAD_SKUS` / `SILO_PAD_SKUS` | `hangar-return` on `hangarPad` / `siloPad` |

Pads need `unlock-vehicles` done. Before that research the ghost shows chutes only — a pad the player cannot drive onto is chrome for a machine they do not have. The chutes are not gated: chest I/O is open from the first mill.

The three sets mirror class flags (`isIoCell`, `pads`), so `place.ghost-io` places every sku in `SKU_FOOT` and asserts the built instance agrees. That test is what stops the preview drifting from the sim.

## Queue markers

Every cell the local seat's queue resolves to through `dest(i, world)` gets one small triangle in the world-transformed HTML overlay (`data-queued="{col},{row}"`), deduped by cell, `bg-house/85` clipped to a downward triangle, `QUEUE_MARK` 5 — preference. Local seat only. Derived from `Seat.queue` on render; not in Save, not in the digest, not a `DirtyReason`. `enqueueOn` already pings.

## Drop tip / pickup

Dropped item face `DROP_FACE` 33 CSS px — preference. Packed `DROP_INSET` 4 / `DROP_STEP` 6 — preference. Click / hover on the painted face, including overflow into a neighbour, is that drop (`dropHit` → cell `at`). Empty cell pixels are not the drop. Hitbox is the sprite rect. No outline.

Drop tip: shovel / pickaxe / container on that face — `itemLine`, `bg-ink` `px-2` `py-1` `text-base` `text-house`, screen-fixed `ptr + 14, -28`. `pointer-events-none`.

## e2e

Keep by name: `data-cell-stroke` `data-furnace-cover` `data-pipe` `data-pipe-ghost` `data-sprinkler` `data-vfx` `data-valve-ghost` `data-queued`.

Farm sprites have no DOM. Those hooks live on HTML overlays over the canvas (`pointer-events-none`). `data-cell-stroke` keeps `stroke-ink` / `stroke-roof` and is one element per hover, never one per cell. `data-furnace-cover` is one covering path, `stroke-ink` `strokeWidth` 2 `fill-none`, clipped to `inWorld`. `data-pipe-ghost` keeps pipe-junction `<use>` (not a black bar). Overlay `<use>` the same pipe-fit / valve / sprinkler groups as today. Not `svgs.ts`. Placed `data-pipe` carries `data-wet` `0`|`1` and stays while the joint exists (lens off is faint, not absent). `data-vfx={id}` present while that VFX is mounted; count `__view.vfxN`; frame cuts are Pixi, not CSS `.vfx-frame` — [[art/vfx]].

`window.__view` (`map.tsx`, beside `__world`): `cam`, `pendingPipe`, `hit(wx, wy)`, `vfxN`. Playwright. Not Save.

Assumption: cell outline stays `floor` of the pointer; last `World.drops` face wins overlap. Placed `data-pipe` / `data-sprinkler` / `data-vfx` are locator overlays; paint is Pixi. Mid-run poor is existing `placePipe` **Cannot afford**. Pointer-up commits pending even if the pointer left the canvas. `vfxN` is live VFX mount count.
