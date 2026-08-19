# Place

Current law. Mechanics [[mechanics/v0.1]]. Types [[architecture/v0.1]]. Chrome [[ui/v0.1]].

```
Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
  | { kind: 'delete' }
```

`buy-delete` gone. Not a `SkuId`. Not in `SKUS`. Not an argument to `World.buy`. Shop Automation has no Delete row. Face `{ kind: 'delete' }` stays (toolbar icon).

Placeable: `buy-shovel` `buy-better-shovel` `buy-pickaxe` `buy-better-pickaxe` `buy-bucket` `buy-bucket-large` `buy-box` `buy-box-large` `buy-pumpjack` `buy-chest` `buy-grinder` `buy-well` `buy-pipe` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large`. Packs never arm. Delete is `World.armDelete()` → `{ kind: 'delete' }`. `buy` never arms delete.

Truck is not a Place SKU. Not in `Place`. Unarmed click.

```
StayArmed =
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'delete'
```

Pay on confirm only. No charge on cancel. No refund on delete. Map pan/zoom stay live. While armed, `readPrompt` is place or blocked only.

Successful confirm on `StayArmed` does **not** set `none`. Ghost stays. `place.kind === 'delete'` stays armed. `buy-well` `buy-pumpjack` and item SKUs disarm.

Build cluster on the left ribbon, not shop. Trio **Delete** **Rotate** **Cancel** visible iff place is `buy-pumpjack` `buy-well` `buy-pipe` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-chest` `buy-grinder`, or `place.kind === 'delete'`.

Shop dock still left, `left-48` (past the ~11rem ribbon). Ghosts stay on the map. Dock must not cover house/field center more than the old left shop (`left-3` `w-72`). Ribbon is extra left chrome; dock sits beside it.

| left ribbon | act |
|---|---|
| Delete | `armDelete()` |
| Rotate | `rotatePlace()` — no-op unless `buy-sprinkler-vert`; toggles `ns` ↔ `ew` |
| Cancel | `cancelPlace` — lens untouched |

Vert facing lives on `Place`. Pointer-offset facing dies. Ghost uses `place.facing`.

Esc / shop dock **×** / left-ribbon **Shop** toggle that closes shop → `cancelPlace`, and if `lens === 'pipes'` then `lens = 'off'`. Other lenses stay (`water` / `ripe` / `kind` / `rarity`). Right-click / left-ribbon **Cancel** → `cancelPlace` only. Lens untouched.

## Pointer

| pointer | when `place.kind === 'sku'` or `'delete'` | ui |
|---|---|---|
| move | anywhere | ghost follows the hit. `pointer-events-none` |
| hover valid, can pay | `prompt.kind === 'place'` | Map `cursor-pointer` |
| hover else | blocked or off-map | Map `cursor-crosshair` |
| left valid, can pay | confirm | StayArmed: stay. Else ghost off |
| left blocked | no-op | look already has the string |
| right | `cancelPlace` | ghost off. Lens untouched |
| Esc / shop dock **×** / left-ribbon **Shop** that closes shop | `cancelPlace`; if `lens === 'pipes'` then `lens = 'off'` | ghost off |
| left-ribbon Cancel | `cancelPlace` | ghost off. Lens untouched |

Armed shop row (`place.kind === 'sku' && place.id === id`): selected. Label `skuLabel` + coin + price. Not `$`.

Look: `lookText`. If armed and `hover` unset → place / delete copy, not **—**.

## Hover cell

Always one cell rect on `floor` of the world pointer while the pointer is on the map. Not gated on `place.kind === 'sku'`. Pointer leave → none. Hook: `data-cell-stroke`.

Unarmed, and while `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` / `place.kind === 'delete'` armed: that outline is always `stroke-ink`. Pipe / sprinkler / delete ghosts in addition. Pipe ghost is not `EdgeStroke`.

Item / pumpjack / chest / grinder / well armed: valid `stroke-ink`, blocked `stroke-roof`. Pumpjack second-tile outline stays and matches.

## Item / cell SKUs

Item SKUs: 64px item ghost + **Place {skuLabel}** under the pointer. Drop on the Plot. Hover valid: tile `stroke-ink`. Else `stroke-roof` if a cell.

`buy-pumpjack`: 2-tile ghost (well + trough, 48×24). Confirm replaces two cells with a Pump. No drop. Disarms. Hover valid: both cells `stroke-ink`. Blocked: both `stroke-roof`. `data-cell-stroke` on the hover cell only.

`buy-chest` `buy-grinder` `buy-well`: 1-tile 64px ghost + **Place Chest** / **Place Seed grinder** / **Place Well**. Confirm replaces one Plot. No drop. Disarms. Hover valid: `stroke-ink`. Blocked: `stroke-roof`.

## Pipe

`buy-pipe`. Nearest edge of the hovered cell, only if the pointer is within **0.35** tile of that edge. Corner → one nearest edge, never two.

Ghost is not a black `EdgeStroke` bar. Not `item-pipe.svg`. Not a 64px item.

While there is an `edgeHit`, the two endpoint vertices draw the **post-confirm** junction: `pipeFit` from the incident arm set **including the pending edge**. Same vertex pieces + rotation as after `placePipe`. Those two vertices show the ghost (`data-pipe-ghost`), not the pre-confirm piece underneath. Ghost wetness = C of the component after confirm. Isolated pending run, no source touch: dry.

Cell outline stays `stroke-ink`. Copy **Place Pipe**. Valid vs blocked is `lookText`. Blocked pending edge: still no-op, stay armed.

Already piped / not an edge / unowned → **Cannot place here**. `money < 4` → **Cannot afford**.

Pipes drawn iff `lens === 'pipes'` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` / `buy-well` / `buy-pumpjack` or `place.kind === 'delete'`.

## Sprinkler

`buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large`. Snap nearest vertex. No incident-pipe gate.

Ghost = sprinkler at V + AoE wash `fill-water` 0.35. Not a cell. Not a 64px item.

Vertical facing from `Place.facing`. Rotate toggles. Pointer-offset facing dies.

Copy **Place Sprinkler** / **Place Vertical sprinkler** / **Place Large sprinkler**.

Unowned / occupied / AoE off-map → **Cannot place here**. Poor → **Cannot afford**. Stay armed.

## Delete

`place.kind === 'delete'`. Not a shop SKU. Left-ribbon **Delete** → `armDelete()`. Does not spawn an item. No 64px ghost. Stay armed. No money, no refund.

Same edge hit as pipe (nearest edge iff within 0.35). Same vertex snap as sprinkler. Then `deleteBuilding(at)`.

| hit | copy | result |
|---|---|---|
| owned piped edge | **Delete pipe** | remove pipe |
| owned sprinkler vertex | **Delete sprinkler** | remove sprinkler |
| pumpjack `form` jack | **Delete pumpjack** | both cells → empty |
| well | **Delete well** | cell → empty |
| chest | **Delete chest** | slots become drops on at, cell → empty |
| grinder | **Delete grinder** | cell → empty |
| house, starter, truck, rock, shrub, growing / ripe / dead / rotten, empty, untilled, infertile | **Cannot delete here** | no-op |

`deletePipe` / `deleteSprinkler` / `deleteBuilding` require `place.kind === 'delete'`. They do not clear place. House, starter, and truck are not delete targets.

Delete pipe / sprinkler uses `EdgeStroke` / `VertexStroke`. Cell outline stays `stroke-ink`.

Rocks, soil, plants, shrubs stay pickaxe / shovel / harvest.

## Copy

`placeLabel` = `skuLabel`.

| when | text |
|---|---|
| place / pulse item SKU | **Place {skuLabel}** |
| place / pulse `buy-pumpjack` | **Place Pumpjack** |
| place / pulse `buy-well` | **Place Well** |
| place / pulse `buy-pipe` | **Place Pipe** |
| place / pulse `buy-sprinkler` | **Place Sprinkler** |
| place / pulse `buy-sprinkler-vert` | **Place Vertical sprinkler** |
| place / pulse `buy-sprinkler-large` | **Place Large sprinkler** |
| delete, hover piped owned edge | **Delete pipe** |
| delete, hover sprinkler vertex | **Delete sprinkler** |
| delete, hover pumpjack `form` jack | **Delete pumpjack** |
| delete, hover well | **Delete well** |
| delete, hover chest | **Delete chest** |
| delete, hover grinder | **Delete grinder** |
| delete else | **Cannot delete here** |
| blocked | **Cannot place here** |
| blocked, `money < price` | **Cannot afford** |
