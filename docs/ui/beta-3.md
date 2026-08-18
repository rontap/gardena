# Beta-3 UI

See [[mechanics/beta-3]], [[architecture/beta-3]], [[art/beta-3]]. Beta-2 chrome holds except below.

## Regions

Unchanged. Camera start `{ x:15.5, y:9.5, scale:1 }`. Clamp pan to owned AABB (tile bounds of `owned`), scale still `[0.5, 3]`.

## Expand controls

Map layer, not `Btn`, not dock. After `unlock-expand` only.

Each `World.faces()` entry: small clickable label at tile `face.at`, text `expand ${face.price}`. Palette `ink` on `house`. Clearly clickable, smaller than a tile.

Click → `World.expand(face.id)`. Poor: no-op. Look when hovering that control: **Cannot afford** if poor, else `expand ${price}`.

## Look

| cell | line |
|---|---|
| untilled soft | Grass |
| untilled hard | Hard soil |
| untilled very-hard | Very hard soil |
| infertile | Infertile soil |
| rock | Rock |
| shrub immature | Shrub |
| shrub ripe | Berry shrub |
| pump (any) | Pump |
| else | Beta-2 |

Prompt extra line stays.

## Held / itemLine

| item | line |
|---|---|
| pickaxe | `Pickaxe - {usesLeft}/{uses} uses left` |
| better-pickaxe | `Better pickaxe - {usesLeft}/{uses} uses left` |
| berry | `Berry - {count}, sell it` |
| shrub | `Shrub - plant it` |
| else | Beta-2 |

## Shop

No Tooltip. One description strip **below the whole SKU list** (not under each row). Hovered row fills it with `skuDesc` plus reason if locked/poor/full. No hover: empty strip.

`skuDesc`:

| id | text |
|---|---|
| pack-* | Pack of 5 {Crop} seeds. |
| buy-shovel | 100 uses, 1s dig. |
| buy-better-shovel | 250 uses, 0.5s dig. |
| buy-pickaxe | 40 uses, 4s mine. |
| buy-better-pickaxe | 80 uses, 2s mine. |
| buy-bucket-large | 8 L. |
| buy-box | Carry 5. |
| buy-box-large | Carry 15. |
| buy-pumpjack | Place a 2 L/s pump. |

Order: packs, shovel, better-shovel, pickaxe, better-pickaxe, large bucket, box, large box, pumpjack.

Pickaxe $0 still shows `$0`.

## Inventory

`itemLine` always under each filled slot. No tooltip. **Sell** on fruit **and** berry.

## Recap

Add `tax {n}`. Money may show `$-N` (`${recap.money}`).

## Queue

Binds `taskName` / `taskProgress` only. Names come from World (Move here while walking).

## Place

[[ui/place]]. Item ghost **64px** plus a **Place {skuLabel}** label under the pointer. Status look leads with that line, `text-xl` / `text-roof`, while armed. Pumpjack: 2-tile ghost + same label.

## Map

Ground: owned chunks only. Soft untilled = grass variant. Hard = `tile-hard-*`. Very-hard = `tile-very-hard-0`. Rebuild grass string when `owned` changes, not on tick.

Marks: hoed plots, crops, rocks, shrubs, every pump (starter + placed), house at `HOUSE_BASE`, drops, actor.

Tool drops (shovel, pickaxe, container, box): native/HTML tooltip with `itemLine`. Status look stays.

House/pump positions from defs, not literals `translate(14*TILE,0)`.

## Research

Rows include **Unlock land** `unlock-expand`, **Unlock pickaxe** `unlock-pickaxe`. No better-pickaxe research row.

## Prompts (new)

| when | text |
|---|---|
| pickaxe + rock / very-hard | Mine |
| shovel + rock / very-hard | Need a pickaxe |
| shovel + immature shrub | Not ready |
| shovel + ripe shrub | Dig |
| empty/box + ripe shrub | Harvest |
| hand shrub + soft untilled | Plant |
| pump + container | Fill (`fill.at` = that cell) |
| expand face, poor | Cannot afford |
