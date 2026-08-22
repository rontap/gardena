# Place

Types [[architecture/world]]. Chrome [[ui/hud]]. Look [[ui/inspect]].

```
Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
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
  | 'delete'
```

Map `STAY_ARMED` SKUs (ghost follow + `promptHit`): `buy-pipe` `buy-valve` + three sprinklers. Delete via `place.kind === 'delete'`.

Confirm does **not** set `none` for StayArmed, **valve**, and **tiles** (`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`). Ghost stays.

Disarm on confirm: `buy-pumpjack` `buy-rain-tank` `buy-well` `buy-tap` `buy-chest` `buy-grinder` `buy-compost-box` and item SKUs.

Pay on confirm only. No charge on cancel. No refund on delete. Pan/zoom stay live. While armed, `readPrompt` is place or blocked only.

Build cluster on the left ribbon, not shop. Trio **Delete** **Rotate** **Cancel** iff delete or sku in `BUILD_IDS`: pumpjack, well, rain-tank, tap, pipe, valve, sprinklers, chest, grinder. Tiles and compost-box: no trio. Rotate is a no-op unless `buy-sprinkler-vert` (`ns` ↔ `ew`). Facing lives on `Place`. Ghost uses `place.facing`.

Shop dock `left-32` past the `w-24` ribbon. Ghosts stay on the map.

Esc / shop dock **×** / left-ribbon **Shop** that closes shop → `cancelPlace`; if `lens === 'pipes'` then `off`. Other lenses stay. Right-click / left-ribbon **Cancel** → `cancelPlace` only.

## Pointer

| pointer | when `place.kind === 'sku'` or `'delete'` | ui |
|---|---|---|
| move | anywhere | ghost follows the hit. `pointer-events-none` |
| hover valid, can pay | `prompt.kind === 'place'` | Map `cursor-pointer` |
| hover else | blocked or off-map | Map `cursor-crosshair` |
| left valid, can pay | confirm | StayArmed / valve / tiles: stay. Else ghost off |
| left blocked | no-op | look already has the string |
| right | `cancelPlace` | ghost off. Lens untouched |
| Esc / shop **×** / Shop close | `cancelPlace`; pipes lens `off` | ghost off |
| left-ribbon Cancel | `cancelPlace` | ghost off. Lens untouched |

Armed shop row (`place.kind === 'sku' && place.id === id`): selected. Label `skuLabel` + coin + price.

Look: `lookText`. Armed with no cell still place / delete copy, not **—**. Status uses roof tint while armed.

## Hover cell

Always one cell rect on `floor` of the world pointer while on the map. Not gated on sku. Pointer leave → none. Hook: `data-cell-stroke`.

Unarmed, and while pipe / valve / sprinkler / delete armed: outline always `stroke-ink`. Pipe / sprinkler / delete ghosts in addition. Pipe ghost is not `EdgeStroke`.

Item / cell / tile SKUs: valid `stroke-ink`, blocked `stroke-roof`. Pumpjack and rain-tank second-tile outline stays and matches. `data-cell-stroke` on the hover cell only.

## Ghosts

Item SKUs and 1-cell buildings (`buy-chest` `buy-grinder` `buy-well` `buy-tap` `buy-compost-box`) and tiles: 64px `skuInner` + **Place {skuLabel}** under the pointer. Drop items on a Plot. Buildings replace a plot (`placeSolidOk`). Tiles: `isTileSite` — untilled bare or existing tile, keep `ground`. Grass is not a tile site. Compost-box disarms. Tiles stay armed.

`buy-pumpjack` `buy-rain-tank`: 2-tile ghost (48×24 well+trough / tank). Confirm occupies both cells. Disarm. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`.

## Pipe / valve

`buy-pipe` `buy-valve`. Nearest edge of the hovered cell, only if the pointer is within **0.35** tile of that edge. Corner → one nearest edge, never two.

Ghost is not a black `EdgeStroke` bar. Not `item-pipe.svg`. Not a 64px item.

While there is an `edgeHit`, the two endpoint vertices draw the **post-confirm** junction: `pipeFit` from the incident arm set **including the pending edge**. Those two vertices show the ghost (`data-pipe-ghost`). Ghost wetness = C of the component after confirm. Isolated pending run, no source touch: dry.

Cell outline stays `stroke-ink`. Copy **Place Pipe** / **Place Manual valve**. Stay armed.

Already piped / not an edge / unowned → **Cannot place here**. Valve on empty edge → **Valve needs a pipe**. Valve on a valved edge → **Pipe already has a valve**. Poor → **Cannot afford**.

Pipes drawn iff `lens === 'pipes'` or place is delete / a `PIPE_PLACE` sku.

## Sprinkler

`buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large`. Snap nearest vertex (`VERTEX_HIT` 0.3). No incident-pipe gate.

Ghost = sprinkler at V + AoE wash `fill-water` 0.35. Not a cell. Not a 64px item. Stay armed.

Vertical facing from `Place.facing`. Rotate toggles.

Copy **Place Sprinkler** / **Place Vertical sprinkler** / **Place Large sprinkler**.

Unowned / occupied / AoE off-map → **Cannot place here**. Poor → **Cannot afford**.

Unarmed, with `unlock-smart-sprinkler` and a sprinkler under the vertex: **Tune sprinkler** → [[ui/docks]] object HUD.

## Delete

`place.kind === 'delete'`. Stay armed. No money, no refund. No 64px ghost.

Same edge hit as pipe. Same vertex snap as sprinkler. Then `deleteBuilding(at)`.

| hit | copy | result |
|---|---|---|
| owned piped edge, no valve | **Delete pipe** | remove pipe |
| owned valved edge | **Delete valve** | valve off, pipe stays |
| owned sprinkler vertex | **Delete sprinkler** | remove sprinkler |
| pumpjack | **Delete pumpjack** | both cells → empty |
| well | **Delete well** | cell → empty |
| rain-tank | **Delete rainwater tank** | both cells → empty |
| tap | **Delete tap** | cell → empty |
| chest | **Delete chest** | slots become drops on at, cell → empty |
| grinder | **Delete grinder** | cell → empty |
| compost-box | **Delete compost box** | cell → empty |
| house, starter, truck, rock, tree, growing / ripe / dead / rotten, empty, untilled, infertile | **Cannot delete here** | no-op |

`deletePipe` / `deleteSprinkler` / `deleteBuilding` require `place.kind === 'delete'`. They do not clear place.

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
| place / pulse tiles | **Place Paved tile** / **Place Brick tile** / **Place Cobble tile** |
| place / pulse `buy-pipe` | **Place Pipe** |
| place / pulse `buy-valve` | **Place Manual valve** |
| place / pulse sprinklers | **Place Sprinkler** / **Place Vertical sprinkler** / **Place Large sprinkler** |
| unarmed valve | **Open valve** / **Close valve** |
| unarmed sprinkler vertex, smart unlocked | **Tune sprinkler** |
| delete, hover piped owned edge | **Delete pipe** / **Delete valve** |
| delete, hover sprinkler vertex | **Delete sprinkler** |
| delete, hover building | **Delete pumpjack** / **Delete well** / **Delete rainwater tank** / **Delete tap** / **Delete chest** / **Delete grinder** / **Delete compost box** |
| delete else | **Cannot delete here** |
| blocked | **Cannot place here** |
| blocked, `money < price` | **Cannot afford** |
| valve, no pipe | **Valve needs a pipe** |
| valve already on edge | **Pipe already has a valve** |
