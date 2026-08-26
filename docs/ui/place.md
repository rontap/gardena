# Place

Types [[architecture/world]]. Chrome [[ui/hud]]. Look [[ui/inspect]].

```
Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
  | { kind: 'wire'; from: WireEnd }
  | { kind: 'delete' }
```

Delete is the left-ribbon **Delete** → `armDelete()` → `{ kind: 'delete' }`. Not a shop SKU. `buy` never arms delete. Packs never arm — `buy` merges seeds into inventory.

Truck is not a Place SKU. Unarmed click.

```
StayArmed =
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'buy-lever' | 'buy-button' | 'buy-lamp' | 'buy-or' | 'buy-and' | 'buy-not'
  | 'buy-pulser' | 'buy-counter'
  | 'buy-sensor-water' | 'buy-sensor-fert' | 'buy-sensor-harvest' | 'buy-sensor-day'
  | 'buy-water-system'
  | 'buy-smart-valve' | 'buy-vehicle-detector'
  | 'delete'
```

Map `STAY_ARMED` SKUs (ghost follow + `promptHit`): `buy-pipe` `buy-valve` + three sprinklers + `buy-well` + fourteen sensor-cell SKUs + `buy-smart-valve`. Delete via `place.kind === 'delete'`. Wire via `place.kind === 'wire'`.

Confirm does **not** set `none` for StayArmed, **valve**, **well**, **smart-valve**, and **tiles** (`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`). Ghost stays.

Disarm on confirm: `buy-pumpjack` `buy-rain-tank` `buy-tap` `buy-chest` `buy-grinder` `buy-compost-box` `buy-mill` `buy-jam` `buy-still` `buy-barrel` `buy-freezer` `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` and item SKUs.

Pay on confirm only. No charge on cancel. No refund on delete. Pan/zoom stay live. While armed, `readPrompt` is place or blocked only.

Build cluster on the left ribbon, not in a dock. Trio **Delete** **Rotate** **Cancel** iff delete or sku in `GHOST_SKUS`, derived from the Water, Processing, Storage, Vehicles, and Sensors shelves — [[ui/build]] [[ui/sensors]]. Tiles and fence: no trio, they are paint tools. Compost-box does get the trio; the old hand-written list had dropped it. Rotate is a no-op unless `buy-sprinkler-vert` (`ns` ↔ `ew`). No rotatable sensor SKU. Facing lives on `Place`. Ghost uses `place.facing`. Hangar and field silos: door south, no rotate.

Shop and Build docks `left-32` past the `w-24` ribbon, `top-20` level with it. Ghosts stay on the map. Both docks can arm: a search result acts where it lives, whichever dock is open — [[ui/shop]].

Esc / dock **×** / a rail toggle that closes **Shop** or **Build** / leaving the shop system → `leaveShop`: `cancelPlace`; if `lens === 'pipes'` or `lens === 'sensors'` then `off`. Other lenses stay. **Shop ↔ Build** is not a close: the ghost and this lens survive the switch. Selecting Build **Sensors** (`logic`) sets `lens = 'sensors'` and does not arm. Switching Build category does not force the lens off. Esc inside a non-empty search box clears the box and nothing else. Right-click / left-ribbon **Cancel** → `cancelPlace` only.

## Pointer

| pointer | when `place.kind === 'sku'` or `'delete'` or `'wire'` | ui |
|---|---|---|
| move | anywhere | ghost follows the hit. `pointer-events-none`. Wire: pending bezier |
| hover valid, can pay | `prompt.kind === 'place'` | Map `cursor-pointer` |
| hover else | blocked or off-map | Map `cursor-crosshair` |
| left valid, can pay | confirm | StayArmed / valve / tiles / sensors: stay. Else ghost off |
| left valid input, `kind === 'wire'` | `placeWire` | fan-out ok; fan-in stacks (many wires on one input; second finalize does **not** replace) |
| left, that A→B already exists | drop that wire | **Remove wire**. `place none` |
| left cycle | no-op | **Cannot loop**. Place stays |
| left blocked | no-op | look already has the string. Wire: **Cannot wire here** |
| right | `cancelPlace` | ghost off. Lens untouched |
| Esc / shop **×** / Shop close / leave shop | `cancelPlace`; pipes or sensors lens `off` | ghost off |
| left-ribbon Cancel | `cancelPlace` | ghost off. Lens untouched |

Armed shop row (`place.kind === 'sku' && place.id === id`): selected. Label `skuLabel` + coin + price.

Look: `lookText`. Armed with no cell still place / delete copy, not **—**. Status uses roof tint while armed.

## Hover cell

Always one cell rect on `floor` of the world pointer while on the map. Not gated on sku. Pointer leave → none. Hook: `data-cell-stroke`.

Unarmed, and while pipe / valve / smart-valve / sprinkler / delete / sensor-cell / wire armed: outline always `stroke-ink`. Pipe / sprinkler / delete ghosts in addition. Pipe ghost is not `EdgeStroke`.

Item / cell / tile SKUs: valid `stroke-ink`, blocked `stroke-roof`. Pumpjack, rain-tank, still: both occupied cells. Outline stays and matches. Hangar and field silos: all six occupied cells. `data-cell-stroke` on the hover cell only.

## Ghosts

Item SKUs and 1-cell buildings (`buy-chest` `buy-grinder` `buy-tap` `buy-compost-box` `buy-mill` `buy-jam` `buy-barrel` `buy-freezer` and the eleven sensor cells) and tiles: 64px `skuInner` + **Place {skuLabel}** under the pointer. Drop items on a Plot. Buildings replace a plot (`placeSolidOk`). Tiles: `isTileSite` — untilled bare or existing tile, keep `ground`. Grass is not a tile site. Compost-box, mill, jam, barrel, freezer disarm. Sensor cells stay armed. Tiles stay armed.

`buy-pumpjack` `buy-rain-tank`: 2-tile ghost (48×24 well+trough / tank). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`.

`buy-still`: 2-tile ghost like pumpjack (48×24). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`.

`buy-hangar`: 3×2 ghost (`HANGAR_W` × `HANGAR_H`). `buy-silo-seed` `buy-silo-spray` `buy-silo-produce`: 2×3 ghost (`SILO_W` × `SILO_H`). Origin = hovered NW cell, extends east and south. Confirm occupies the six cells. Disarm. Hover valid: all six `stroke-ink`. Blocked: all six `stroke-roof`. Copy **Place Vehicle hangar** / **Place Seeding silo** / **Place Spraying silo** / **Place Produce silo**. Pad cells are not in the ghost. Place does not require pad free. Tractor / trailers are hangar-buys, not Place SKUs. [[ui/vehicles]]

## Pipe / valve / well

`buy-pipe` `buy-valve` `buy-well` `buy-smart-valve`. Nearest edge of the hovered cell, only if the pointer is within **0.35** tile of that edge. Corner → one nearest edge, never two.

Ghost is not a black `EdgeStroke` bar. Not `item-pipe.svg`. Not a 64px item.

While there is an `edgeHit`, the two endpoint vertices draw the **post-confirm** junction: `pipeFit` from the incident arm set **including the pending edge**. Those two vertices show the ghost (`data-pipe-ghost`). Ghost wetness = C of the component after confirm. Isolated pending run, no source touch: dry.

Valve: the edge midpoint also draws the open-valve art at 0.7 (`data-valve-ghost`) — the body preview of what is being placed.

Smart valve: same edge midpoint ghost, distinct art (`data-smart-valve-ghost`). Copy **Place Smart valve**. No share with pipe / manual valve / well on that edge. Armed `buy-smart-valve` forces `sensors`, not `pipes`.

Well: no junction ghosts (the well edge gains no pipe). The edge midpoint draws the well art at 0.7 (`data-well-ghost`). Valid iff owned edge with no pipe and no well.

Cell outline stays `stroke-ink`. Copy **Place Pipe** / **Place Manual valve** / **Place Well** / **Place Smart valve**. Stay armed.

Already piped / not an edge / unowned → **Cannot place here**. Valve on empty edge → **Valve needs a pipe**. Valve on a valved edge → **Pipe already has a valve**. Pipe or well on a well edge → **Cannot place here**. Smart valve on an occupied edge → **Cannot place here**. Poor → **Cannot afford**.

Pipes drawn iff `lens === 'pipes'` or place is delete / a `PIPE_PLACE` sku. Placed wells always draw their art on the edge midpoint (`data-well`). Wires painted iff `lens === 'sensors'` — [[ui/sensors]].

## Sprinkler

`buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large`. Snap nearest vertex (`VERTEX_HIT` 0.3). No incident-pipe gate.

Ghost = sprinkler at V + AoE wash `fill-water` 0.35. Not a cell. Not a 64px item. Stay armed.

Vertical facing from `Place.facing`. Rotate toggles.

Copy **Place Sprinkler** / **Place Vertical sprinkler** / **Place Large sprinkler**.

Unowned / occupied / AoE off-map → **Cannot place here**. Poor → **Cannot afford**.

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
| lever / button / lamp / or / and / not / sensor-water / sensor-fert / sensor-harvest / water-system / vehicle-detector | **Delete lever** / **Delete button** / **Delete lamp** / **Delete OR gate** / **Delete AND gate** / **Delete NOT gate** / **Delete water sensor** / **Delete fertilizer sensor** / **Delete harvest sensor** / **Delete water-system sensor** / **Delete vehicle detector** | cell → empty; incident wires drop |
| house, starter, truck, rock, tree, growing / ripe / dead / rotten, empty, untilled, infertile | **Cannot delete here** | no-op |

`deletePipe` / `deleteWell` / `deleteSprinkler` / `deleteBuilding` require `place.kind === 'delete'`. They do not clear place.

Delete pipe / sprinkler uses `EdgeStroke` / `VertexStroke`. Cell outline stays `stroke-ink`.

Rocks, soil, plants stay pickaxe / shovel / harvest. Trees: shovel **Dig**, no harvest — [[ui/inspect]]. Sapling plant is a hand `plant`, not a Place SKU.

## Copy

`placeLabel` = `skuLabel`.

| when | text |
|---|---|
| place / pulse item SKU | **Place {skuLabel}** |
| place / pulse `buy-pumpjack` | **Place Pumpjack** |
| place / pulse `buy-well` | **Place Well** |
| place / pulse `buy-rain-tank` | **Place Rainwater tank** |
| place / pulse `buy-tap` | **Place Tap** |
| place / pulse `buy-chest` | **Place Chest** |
| place / pulse `buy-grinder` | **Place Seed grinder** |
| place / pulse `buy-compost-box` | **Place Compost box** |
| place / pulse `buy-mill` | **Place Mill** |
| place / pulse `buy-still` | **Place Pot still** |
| place / pulse `buy-barrel` | **Place Wine barrel** |
| place / pulse `buy-jam` | **Place Jam machine** |
| place / pulse `buy-freezer` | **Place Freezer** |
| place / pulse `buy-hangar` | **Place Vehicle hangar** |
| place / pulse `buy-silo-seed` | **Place Seeding silo** |
| place / pulse `buy-silo-spray` | **Place Spraying silo** |
| place / pulse `buy-silo-produce` | **Place Produce silo** |
| place / pulse tiles | **Place Paved tile** / **Place Brick tile** / **Place Cobble tile** |
| place / pulse `buy-pipe` | **Place Pipe** |
| place / pulse `buy-valve` | **Place Manual valve** |
| place / pulse `buy-smart-valve` | **Place Smart valve** |
| place / pulse sprinklers | **Place Sprinkler** / **Place Vertical sprinkler** / **Place Large sprinkler** |
| place / pulse sensor cells | **Place Lever** / **Place Button** / **Place Lamp** / **Place OR gate** / **Place AND gate** / **Place NOT gate** / **Place Pulser** / **Place Counter** / **Place Water sensor** / **Place Fertilizer sensor** / **Place Harvest sensor** / **Place Day sensor** / **Place Water-system sensor** / **Place Vehicle detector** |
| unarmed valve | **Open valve** / **Close valve** |
| unarmed well edge, container in hand | **Fill** |
| unarmed well edge, no container | **Need a bucket** |
| unarmed sprinkler vertex, smart unlocked | **Tune sprinkler** |
| unarmed lever / button, port hits off | **Flip lever** / **Press button** |
| unarmed water / harvest / counter / day, port hits off | **Tune water sensor** / **Tune harvest sensor** / **Tune counter** / **Tune day sensor** |
| pending wire, illegal port | **Cannot wire here** |
| pending wire, cycle | **Cannot loop** |
| pending wire, that A→B already exists | **Remove wire** |
| delete, bezier in `VERTEX_HIT` | **Delete wire** |
| delete, hover piped owned edge | **Delete pipe** / **Delete valve** |
| delete, hover smart-valve edge | **Delete smart valve** |
| delete, hover well edge | **Delete well** |
| delete, hover sprinkler vertex | **Delete sprinkler** |
| delete, hover building | **Delete pumpjack** / **Delete rainwater tank** / **Delete tap** / **Delete chest** / **Delete grinder** / **Delete compost box** / **Delete mill** / **Delete pot still** / **Delete wine barrel** / **Delete jam machine** / **Delete freezer** / **Delete vehicle hangar** / **Delete seeding silo** / **Delete spraying silo** / **Delete produce silo** / **Delete lever** / **Delete button** / **Delete lamp** / **Delete OR gate** / **Delete AND gate** / **Delete NOT gate** / **Delete pulser** / **Delete counter** / **Delete water sensor** / **Delete fertilizer sensor** / **Delete harvest sensor** / **Delete day sensor** / **Delete water-system sensor** / **Delete vehicle detector** |
| delete, hangar that stores a vehicle or a trailer | **Cannot delete here (stores a vehicle)** |
| delete else | **Cannot delete here** |
| blocked | **Cannot place here** |
| blocked, `money < price` | **Cannot afford** |
| valve, no pipe | **Valve needs a pipe** |
| valve already on edge | **Pipe already has a valve** |
