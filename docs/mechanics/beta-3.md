# Beta-3 mechanics

Supersedes [[mechanics/beta-2]] where this file names a replacement. Types: [[architecture/beta-3]]. Chrome: [[ui/beta-3]]. Art: [[art/beta-3]].

## Rarity (global)

Weights for every rarity roll. Multipliers on every sale (crops and berries).

| rarity | weight | sale mul |
|---|---|---|
| common | 0.55 | 1 |
| uncommon | 0.35 | 1.25 |
| rare | 0.09 | 2 |
| heirloom | 0.01 | 3.5 |

`rollRarity(u)`: first bucket whose cumulative weight > `u`.

`effectiveSale` crop: `def.sale * RARITY_SALE[rarity] * Π saleMul`.

Berry: `BERRY_SALE * RARITY_SALE[rarity]` (`BERRY_SALE = 2`). No crop mods.

## Map

Starter owned: chunk `(0,0)` = tiles `[0,32)×[0,32)`.

House `{14,6,4×3}`. Door `(15,9)` — Plot, soft untilled. Starter pump one cell `(18,7)`, `2 L/s`.

Actor + camera start door center `(15.5, 9.5)`.

Walk: straight line through every cell. Occupancy does not cancel walk.

Occupancy (`isSolid`): house, every pump, rock, shrub. Not a Plot. No plant, hoe, drop, or SKU-place (except pumpjack which **replaces** two Plots).

## Expand

Research `unlock-expand` — **Unlock land**, utilities, **$15**, **45s**.

```
price = 40 + 15 * purchases
tax = 2 + 6 * (owned.length - 1)
```

`expand(id)` instant. No-op if owned, not a 4-neighbor of owned, research not done, or `money < price`. Else deduct, push chunk, `purchases++`, generate that chunk, ping.

Edge controls: only after research done. Copy `expand ${price}`. Poor: visible, click no-op, look **Cannot afford**.

## Seam / tax

On sundown, before recap:

```
money += 10
money -= tax()    // may be negative
recap.tax = tax()
recap.money = money
```

## Generation

`World.seed` hidden. `new World(seed?)`.

Gen origin `(16,16)`.

```
r = hypot(col + 0.5 - 16, row + 0.5 - 16)
p_rock  = 0.014 + 0.010 * (r / 32)
p_vhard = 0.004 + 0.040 * (r / 32)
p_hard  = 0.015 + 0.060 * (r / 32)
p_shrub = 0.0035
```

Reserve (never rock / hard / shrub): house occupied, starter pump cell, door. Those Plots = `{ kind:'untilled', ground:'soft' }` or the building.

Per cell of a **new** chunk, once:

1. reserved → skip
2. `hash(seed,'rock',col,row) < p_rock` → rock
3. else `u = hash(seed,'soil',col,row)`: `< p_vhard` → very-hard; `< p_vhard+p_hard` → hard; else soft
4. if soft untilled and `hash(seed,'shrub',col,row) < p_shrub` → immature shrub

Rock shape: `u = hash(seed,'rock-shape',col,row)`. `< 0.12` try east `2×1`; `< 0.20` try south `1×2`; else `1×1`. Long rocks rarer than 1×1. Both cells in **this** chunk, not reserved, not already rock. Else `1×1`.

Expand does not reroll old chunks.

## Ground

| cell | look | shovel | plant |
|---|---|---|---|
| untilled soft | Grass | 1× time, 1 use → `empty` | no |
| untilled hard | Hard soil | 2× time, **2 uses** → `empty`. `usesLeft < 2` → no-op | no |
| untilled very-hard | Very hard soil | shovel **Need a pickaxe**. Pickaxe → `{ kind:'infertile' }` | no |
| infertile | Infertile soil | no-op | no |
| empty / crop | Beta-2 | Beta-2 (seed drop on growing/ripe) | Beta-2 |

Plant start `thirst = 0.75`. Watering still sets `1`.

## Rocks / pickaxe

Rock occupies its base. Look **Rock**.

| id | shop | uses | work | unlock |
|---|---|---|---|---|
| pickaxe | **$20** | 40 | 4s | `unlock-pickaxe` |
| better-pickaxe | $25 | 80 | 2s | `unlock-pickaxe` |

Work seconds are `floor(old * 0.5)` from the 8s / 5s base.

`unlock-pickaxe` — utilities, **$0**, **40s**. No `unlock-better-pickaxe`.

Place pickaxe SKUs like shovel.

`{ act:'mine'; at }` — hand pickaxe.

| target | time | uses | result |
|---|---|---|---|
| rock 1×1 | `workSeconds` | 1 | soft untilled |
| rock 1×2 / 2×1 | `2 * workSeconds` | **2** (`usesLeft < 2` → no-op) | both cells soft untilled |
| very-hard | `workSeconds` | 1 | `{ kind:'infertile' }` |

0 uses → hand empty.

Shovel on rock / very-hard: **Need a pickaxe**, not queued.

## Shrubs / berries

`Shrub.grow` 0..1 over **360s** day-time (`grow += dt/360`), then `ripe = true`. No water. No seam tick.

| state | look | harvest | shovel |
|---|---|---|---|
| immature | Shrub | blocked | **Not ready** |
| ripe | Berry shrub | 1 berry, reset | extract |

Harvest (empty hand or box that accepts berry): rarity = `rollRarity(hash(seed,'berry',col,row,day))`. Then `ripe=false`, `grow=0`.

`sellSlot` / market / compact merge berries by rarity. Box `goods:'berry'`.

Extract: shovel ripe → drop `{ kind:'shrub' }`, cell soft untilled, −1 use, shovel work time.

Place from hand: soft untilled only. Queued 0.5s, **Plant**. Immature shrub. Shrubs do not stack.

## Pumpjack

`buy-pumpjack` ($50, `unlock-pumpjack`) **arms place**. Does not mutate starter.

Confirm: cells `(col,row)` and `(col+1,row)` both `inWorld`, Plot, `untilled|empty`, no drops. Pay 50. Both cells become one `Pump` base `{ shape:'rect', col, row, w:2, h:1 }`, output **2**. Every pump is 2 L/s.

`{ act:'fill'; at }` — walk to `at`, fill at **that** pump’s rate.

## Queue

One intent. Walking to shovel → **Move here and dig**. Other walks → **Move here**. Arrived + work → **Dig** / **Mine** / **Plant** / …. Progress: walk span, then work timer.

## Shop prices (changed)

| SKU | price |
|---|---|
| pack-carrot | 3 |
| buy-bucket-large | 22 |
| buy-box | 6 |
| buy-box-large | 12 |
| buy-pickaxe | 20 |
| buy-better-pickaxe | 25 |
| buy-pumpjack | 50 |

Other SKUs unchanged.

## Research added

| id | tree | cost | s | effect |
|---|---|---|---|---|
| unlock-expand | utilities | 15 | 45 | expand faces |
| unlock-pickaxe | utilities | 0 | 40 | both pickaxe SKUs |

`unlockAll` includes them and `money += 999`.

Shop order: packs, shovels, pickaxes, large bucket, boxes, pumpjack.

## Copy helpers

`skuDesc(id)` — [[ui/beta-3]].
`itemLine` gains pickaxe / berry / shrub.

## Named invariants (tests after impl)

Beta-2 9–18 stay except plant thirst 0.75, SKU prices above, rarity muls, house/door/pump coords, `fill.at`.

19. Starter coverage 32×32. House rows 6–8. Door (15,9).
20. `expandPrice === 40+15*purchases`. `tax === 2+6*(owned-1)`. Seam +10 then −tax; money may be < 0.
21. `expand` no-op if locked / poor / owned / not a 4-neighbor.
22. Hard shovel: 2× time, −2 uses, `empty`. `usesLeft < 2` → no-op.
23. Very-hard / rock shovel no-op (**Need a pickaxe**).
24. Pickaxe 1×1: −1 use, 4s, soft untilled. 1×2: 8s, −2 uses, both soft untilled. Very-hard: −1 use → infertile.
25. `new World(fixed)` twice: identical rocks/ground/shrubs.
26. Harvest ripe shrub → 1 berry, unripe. Shovel ripe → shrub item, soft untilled.
27. Pumpjack confirm: two cells one Pump at 2. Starter still 2.
28. Walk onto rock/shrub/building is legal (intent not cancelled).
29. `RARITY_SALE` / `RARITY_WEIGHT` match this file. Berry sale is `2 * RARITY_SALE[r]`.
30. `buy-pickaxe` price 20. `unlock-pickaxe` cost 0. `unlockAll` adds 999 money.
