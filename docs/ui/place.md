# Place

Types [[architecture/world]]. Chrome [[ui/hud]]. Look [[ui/inspect]]. `Place` / `StayArmed` live on `sim/world.ts`.

Delete is the left-ribbon **Delete** → `armDelete()` → `{ kind: 'delete' }`. Not a shop SKU. `buy` never arms delete. Packs never arm — `buy` merges seeds into inventory.

Truck is not a Place SKU. Unarmed click.

Map `STAY_ARMED` SKUs (ghost follow + `promptHit`): `buy-pipe` `buy-valve` + three sprinklers + `buy-well` + fifteen sensor-cell SKUs + `buy-smart-valve`. Delete via `place.kind === 'delete'`. Wire via `place.kind === 'wire'`.

Confirm does **not** set `none` for StayArmed, **valve**, **well**, **smart-valve**, and **tiles** (`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`). Ghost stays.

Disarm on confirm: `buy-pumpjack` `buy-rain-tank` `buy-tap` `buy-chest` `buy-grinder` `buy-compost-box` `buy-mill` `buy-jam` `buy-still` `buy-barrel` `buy-freezer` `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` and item SKUs.

Pay on confirm only. No charge on cancel. No refund on delete. Pan/zoom stay live except armed `buy-pipe` left-drag (that drag is the pending run, not pan). While armed, `readPrompt` is place or blocked only.

Build cluster on the left ribbon, not in a dock. Trio **Delete** **Rotate** **Cancel** iff delete or sku in `GHOST_SKUS`, derived from the Water, Processing, Storage, Vehicles, and Sensors shelves — [[ui/build]] [[ui/sensors]]. Tiles and fence: no trio, they are paint tools. Compost-box does get the trio; the old hand-written list had dropped it. Rotate is a no-op unless `buy-sprinkler-vert` (`ns` ↔ `ew`). No rotatable sensor SKU. Facing lives on `Place`. Ghost uses `place.facing`. Hangar and field silos: door south, no rotate.

Shop and Build docks `left-32` past the `w-24` ribbon, `top-20` level with it. Ghosts stay on the map. Both docks can arm: a search result acts where it lives, whichever dock is open — [[ui/shop]].

Esc / dock **×** / a rail toggle that closes **Shop** or **Build** / leaving the shop system → `leaveShop`: `cancelPlace`; if `lens === 'pipes'` or `lens === 'sensors'` then `off`. Other lenses stay. **Shop ↔ Build** is not a close: the ghost and this lens survive the switch. Selecting Build **Sensors** (`logic`) sets `lens = 'sensors'` and does not arm. Switching Build category does not force the lens off. Esc inside a non-empty search box clears the box and nothing else. Right-click / left-ribbon **Cancel** → `cancelPlace` only.

## Pointer

Canvas host. Pan / zoom / `clickHit` as now, except armed `buy-pipe` left-drag is the pending run, **not pan**. Other arms / unarmed: pan unchanged. Wheel zoom stays. Expand plates take pointer — [[ui/hud]].

| pointer | when `place.kind === 'sku'` or `'delete'` or `'wire'` | ui |
|---|---|---|
| move | anywhere | ghost follows the hit. `pointer-events-none`. Wire: pending bezier |
| hover valid, can pay | `prompt.kind === 'place'` | Map `cursor-pointer` |
| hover else | blocked or off-map | Map `cursor-crosshair` |
| left-drag | `place.id === 'buy-pipe'` | pending run, **not pan**. Snap `EDGE_HIT` 0.35, nearest one edge, never two at a corner. View-local `pendingPipe: Edge[]` unique, `pipeOk` each. Ghost those edges (`data-pipe-ghost`) |
| left up | `buy-pipe` | `placePipe` per pending edge, log order, pay per segment. Stay armed. Empty run: no-op |
| left valid, can pay | confirm (not `buy-pipe` drag) | StayArmed / valve / tiles / sensors: stay. Else ghost off |
| left valid input, `kind === 'wire'` | `placeWire` | fan-out ok; fan-in stacks (many wires on one input; second finalize does **not** replace) |
| left, that A→B already exists | drop that wire | **Remove wire**. `place none` |
| left cycle | no-op | **Cannot loop**. Place stays |
| left blocked | no-op | look already has the string. Wire: **Cannot wire here** |
| right | `cancelPlace` | ghost off. Pending pipe run dropped uncommitted. Lens untouched |
| Esc / shop **×** / Shop close / leave shop | `cancelPlace`; pipes or sensors lens `off` | ghost off. Pending run dropped |
| left-ribbon Cancel | `cancelPlace` | ghost off. Pending run dropped. Lens untouched |

Valve / well / smart-valve stay click-per-edge. Pan while those are armed.

Armed shop row (`place.kind === 'sku' && place.id === id`): selected. Label `skuLabel` + coin + price.

Look: `lookText`. Armed with no cell still place / delete copy, not **—**. Status uses roof tint while armed.

## Hover cell

Always one cell on `floor` of the world pointer while on the map. Not gated on sku. Pointer leave → none.

HTML overlay SVG `rect`s over the canvas (`fill-none` `strokeWidth` 2). Hook: `data-cell-stroke` on the hover cell only. Extra footprint rects have no data hook. Farm sprites have no DOM.

Unarmed, and while pipe / valve / smart-valve / sprinkler / delete / sensor-cell / wire armed: outline always `stroke-ink`. Pipe / sprinkler / delete ghosts in addition. Pipe ghost is not a black bar.

Item / cell / tile SKUs: valid `stroke-ink`, blocked `stroke-roof`. Place ghosts for pumpjack / still / hangar / silo already cover footprint — keep. Pumpjack, rain-tank, still: both occupied cells. Hangar and field silos: all six. Outline stays and matches.

Unarmed hover of a multi-cell building (house, hangar, field silo, still, pumpjack, rain-tank, tree, seed-silo, additive-store): stroke **all occupied cells** of that instance. Same `stroke-ink`. `data-cell-stroke` on the hover cell only.

## Last action

Gone. No gold cell. No pulse label on the map. Look line + ghost remain the confirm. No `World.pulse`.

## Ghosts

HTML overlays over the canvas. Tokens [[art/palette]] / `@theme`. No unnamed hex. Farm sprites have no DOM.

Item SKUs and 1-cell buildings (`buy-chest` `buy-grinder` `buy-tap` `buy-compost-box` `buy-mill` `buy-jam` `buy-barrel` `buy-freezer` and the fifteen sensor cells) and tiles: 64px `skuInner` + **Place {skuLabel}** under the pointer. Screen-fixed, `ptr + 16,16`. Chip `bg-house` `px-2` `py-0.5` `text-base` `text-ink`. `pointer-events-none`. Drop items on a Plot. Buildings replace a plot (`placeSolidOk`). Tiles: `isTileSite` — untilled bare or existing tile, keep `ground`. Grass is not a tile site. Compost-box, mill, jam, barrel, freezer disarm. Sensor cells stay armed. Tiles stay armed.

`buy-pumpjack` `buy-rain-tank`: 2-tile ghost (48×24 well+trough / tank). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`.

`buy-still`: 2-tile ghost like pumpjack (48×24). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`.

`buy-hangar`: 3×2 ghost (`HANGAR_W` × `HANGAR_H`). `buy-silo-seed` `buy-silo-spray` `buy-silo-produce`: 2×3 ghost (`SILO_W` × `SILO_H`). Origin = hovered NW cell, extends east and south. Confirm occupies the six cells. Disarm. Hover valid: all six `stroke-ink`. Blocked: all six `stroke-roof`. Copy **Place Vehicle hangar** / **Place Seeding silo** / **Place Spraying silo** / **Place Produce silo**. Pad cells are not in the ghost. Place does not require pad free. Tractor / trailers are hangar-buys, not Place SKUs. [[ui/vehicles]]

## Pipe / valve / well

`buy-pipe` `buy-valve` `buy-well` `buy-smart-valve`. Nearest edge of the hovered cell, only if the pointer is within **0.35** tile of that edge. Corner → one nearest edge, never two.

Ghost is not a black bar. Not `item-pipe.svg`. Not a 64px item.

While there is an `edgeHit` (or a `pendingPipe` run), each pending edge’s two endpoint vertices draw the **post-confirm** junction: `pipeFit` from the incident arm set **including every pending edge**. Those vertices show the ghost (`data-pipe-ghost`, HTML overlay `<use>`). Ghost wetness = C of the component after confirm. Isolated pending run, no source touch: dry.

Valve: the edge midpoint also draws the open-valve art at 0.7 (`data-valve-ghost`) — the body preview of what is being placed.

Smart valve: same edge midpoint ghost, distinct art (`data-smart-valve-ghost`). Copy **Place Smart valve**. No share with pipe / manual valve / well on that edge. Armed `buy-smart-valve` forces `sensors`, not `pipes`.

Well: no junction ghosts (the well edge gains no pipe). The edge midpoint draws the well art at 0.7 (`data-well-ghost`). Valid iff owned edge with no pipe and no well.

Cell outline stays `stroke-ink`. Copy **Place Pipe** / **Place Manual valve** / **Place Well** / **Place Smart valve**. Stay armed.

Already piped / not an edge / unowned → **Cannot place here**. Valve on empty edge → **Valve needs a pipe**. Valve on a valved edge → **Pipe already has a valve**. Pipe or well on a well edge → **Cannot place here**. Smart valve on an occupied edge → **Cannot place here**. Poor → **Cannot afford**.

Armed `buy-pipe` only: left-drag along edges. Snap still `EDGE_HIT` 0.35, nearest one edge, never two at a corner. View-local `pendingPipe: Edge[]` (unique, `pipeOk` each). Ghost those edges with existing pipe-junction ghosts (`data-pipe-ghost`). Pointer up commits existing `placePipe` per edge, log order, pay per segment. Stay armed. Right-click / Cancel / Esc: drop the run uncommitted (`cancelPlace`). While `buy-pipe` armed, left-drag is the run, **not pan**. Valve / well / smart-valve stay click-per-edge. Copy unchanged: **Place Pipe** / **Cannot place here** / **Cannot afford**.

Pipes always drawn (joints, valves, wells, sprinklers, fences). Faint (`opacity` 0.35, preference) when `lens !== 'pipes'` and place is not delete / a `PIPE_PLACE` sku. Wetness tint + sprinkler AoE wash still lens / tool — [[ui/lens]]. Placed wells always draw their art on the edge midpoint (`data-well`). Wires painted iff `lens === 'sensors'` — [[ui/sensors]].

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
| owned valved edge | **Delete valve** | valve off, pipe stays |
| smart-valve edge | **Delete smart valve** | gate off; incident wires drop |
| well edge | **Delete well** | well off, edge goes |
| owned sprinkler vertex | **Delete sprinkler** | remove sprinkler; incident wires drop |
| pumpjack | **Delete pumpjack** | both cells → empty |
| rain-tank | **Delete rainwater tank** | both cells → empty |
| tap | **Delete tap** | cell → empty |
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

`deletePipe` / `deleteWell` / `deleteSprinkler` / `deleteBuilding` require `place.kind === 'delete'`. They do not clear place.

Delete pipe / sprinkler: look chip + cell outline. Pipes stay Pixi. Cell outline stays `stroke-ink`.

Rocks, soil, plants stay pickaxe / shovel / harvest. Trees: shovel **Dig**, no harvest — [[ui/inspect]]. Sapling plant is a hand `plant`, not a Place SKU.

`placeLabel` = `skuLabel`. Place / pulse copy is **Place {skuLabel}**. Unarmed valve **Open valve** / **Close valve**. Well + container **Fill**; else **Need a bucket**. Smart sprinkler vertex **Tune sprinkler**. Blocked **Cannot place here**. Poor **Cannot afford**. Valve, no pipe **Valve needs a pipe**. Valve already on edge **Pipe already has a valve**. Wire: **Cannot wire here** / **Cannot loop** / **Remove wire**. Sensor Flip / Press / Tune: [[ui/sensors]].

Pipe / delete follow copy: HTML chip under the pointer, same `bg-house` `px-2` `py-0.5` `text-base` `text-ink`, no `skuInner`. Drop tip: shovel / pickaxe / container on the hover cell — `itemLine`, `bg-ink` `px-2` `py-1` `text-base` `text-house`, screen-fixed `ptr + 14, -28`. `pointer-events-none`.

## e2e

Keep by name: `data-cell-stroke` `data-pipe` `data-pipe-ghost` `data-sprinkler` `data-vfx` `data-valve-ghost` `data-smart-valve-ghost` `data-well-ghost`.

Farm sprites have no DOM. Those hooks live on HTML overlays over the canvas (`pointer-events-none`). `data-cell-stroke` keeps `stroke-ink` / `stroke-roof`. `data-pipe-ghost` keeps pipe-junction `<use>` (not a black bar). Overlay `<use>` the same pipe-fit / valve / well / sprinkler groups as today. Not `svgs.ts`. Placed `data-pipe` carries `data-wet` `0`|`1` and stays while the joint exists (lens off is faint, not absent). `data-vfx={id}` present while that VFX is mounted; frame cuts are Pixi, not CSS `.vfx-frame` — [[art/vfx]].

`window.__view` (`map.tsx`, beside `__world`): `cam`, `pendingPipe`, `hit(wx, wy)`. Playwright. Not Save.

Assumption: placed `data-pipe` / `data-sprinkler` / `data-vfx` are locator overlays; paint is Pixi. Mid-run poor is existing `placePipe` **Cannot afford**. Pointer-up commits pending even if the pointer left the canvas.
