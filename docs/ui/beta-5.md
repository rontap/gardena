# Beta-5 UI

**Historical.** Current law: [[ui/beta-6]].

Supersedes [[ui/beta-4]] where this file names a replacement. See [[mechanics/beta-5]], [[architecture/beta-5]]. Place [[ui/place]]. Beta-4 chrome holds except below.

## HUD

Majors unchanged. Button **Lens** when `lens === 'off'`, **Lens · Pipes** when `lens === 'pipes'`. Other on-lenses stay **Lens · {name}**.

Shop close (dock **×**, HUD **Shop** toggle that closes shop, Esc): `cancelPlace` and if `lens === 'pipes'` then `lens = 'off'`. Leave `water` / `ripe` / `kind`. Right-click: `cancelPlace` only. Lens untouched.

## General store

Left dock title **General store**. Tabs **Seeds** / **Utility** / **Automation**. List only `skuShown` rows. Hidden ≠ greyed.

| tab | SKUs |
|---|---|
| Seeds | pack-carrot, pack-potato, pack-wheat, pack-tomato, pack-raspberry, pack-watermelon |
| Utility | shovel, better-shovel, pickaxe, hardened pickaxe, bucket, large-bucket, box, large-box |
| Automation | pumpjack, well, pipe, sprinkler, vertical sprinkler, large sprinkler, delete, chest, grinder |

`skuLabel` + ` $` + price. `$0` still shows `$0`. Armed place on that SKU = selected.

| id | skuLabel |
|---|---|
| pack-watermelon | Watermelon seeds |
| buy-pumpjack | Pumpjack |
| buy-well | Well |
| buy-pipe | Pipe |
| buy-sprinkler | Sprinkler |
| buy-sprinkler-vert | Vertical sprinkler |
| buy-sprinkler-large | Large sprinkler |
| buy-delete | Delete |
| buy-chest | Chest |
| buy-grinder | Seed grinder |

Hover → `skuDesc` + reason. Catalog templates below. Skip delete. No hover → tab line:

| tab | text |
|---|---|
| Seeds | Seeds for the field. |
| Utility | Tools and carry. |
| Automation | Machines you place. |

## Place

[[ui/place]]. StayArmed exception vs cell/item law.

## Look

| cell | line |
|---|---|
| pump `form` starter / jack | Pump |
| pump `form` well | Well |

Sprinkler is not a cell. No look unless place or delete is armed.

## Map

Hover cell: [[ui/place]]. One `data-cell-stroke` rect on `floor` of the world pointer while the pointer is on the map. Not gated on `place.kind === 'sku'`. Unarmed and pipe / sprinkler / delete-armed: always `stroke-ink`. Pointer leave → none.

Placed pipes: vertex `pipeFit`. `data-pipe` + `data-wet="1"` | `"0"`. Dry: no `#3d7ea6`.

Placed sprinklers: always drawn. `data-sprinkler` on the gfx.

Pipes drawn iff `lens === 'pipes'` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` / `buy-delete` / `buy-well` / `buy-pumpjack`.

AoE wash (`fill-water` **0.2**) on placed sprinkler AoE iff `lens === 'pipes'` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` / `buy-delete`. Not `buy-well` / `buy-pumpjack` alone. Ghost AoE is **0.35**.

## Lenses

HUD **Lens** dropdown. Rows: **None**, **Water need**, **Ripeness**, **Object type**, **Pipes**.

Button **Lens** when off, **Lens · Pipes** when on. No swatches on **Pipes**. Not a cell-tint scale.

`lens === 'pipes'`: reveal pipes. Source cells `water` **0.72**. Placed sprinkler AoE `fill-water` **0.2** replaces generic `house` wash on those cells. Other cells `house` wash **0.35**.

Pipes lens icons: `overlay-water.svg` on wells, pumpjacks / starter (cell min-corner), and sprinklers (vertex). Kind lens keeps the machine circle; pipes lens uses the icon, not that circle.

Kind lens: well + sprinkler = machine (`water`).

## Research

Four tabs stay. Rows use `.name`. Hidden `reveal` rows are absent, not greyed. `unlockAll` stays.

`unlock-pumpjack` is gone. Irrigation on **automation**.

| id | name | tree | reveal |
|---|---|---|---|
| unlock-watermelon | Watermelon seeds | plants | start |
| unlock-irrigation | Irrigation | automation | start |
| unlock-auto-irrigation | Automated irrigation | automation | unlock-irrigation |
| unlock-adv-irrigation | Advanced irrigation | automation | unlock-auto-irrigation |

`unlock-grinder` stays, reveal start. Beta-4 rows that remain: `reveal: start`.

## Almanac

`catalogEntries()`. New: watermelon (crop template), pipe, three sprinklers, well. Skip delete.

| entry | keys |
|---|---|
| watermelon | name, growSeconds, waterUsePerSec, sale, seed |
| pipe | price = 4 |
| sprinkler | name, w, h, rate = SPRINKLER_RATE |
| well | output = 5 |

Large `w×h` = 4×4.

Templates:

- pipe: `Pipe. $4 per edge. Hidden unless the Pipes lens or a pipe tool is out.`
- sprinkler: `${name}. ${w}×${h} plots. ${rate} L/s.`
- well: `Well. ${output} L/s. One tile.`

Watermelon uses the crop template.

## Copy

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
| delete else | **Cannot delete here** |
| blocked | **Cannot place here** |
| blocked, `money < price` | **Cannot afford** |

## Tokens

`dirt` `dirt-dark` `house` `roof` `ink` `water` `leaf` `lens-bad` `lens-good` `lens-done`. No new hex.
