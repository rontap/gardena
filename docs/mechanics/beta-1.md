# Beta-1 mechanics

**Historical.** Current law: [[mechanics/beta-2]].

Garden sim. Loop: shovel → plant → water → harvest → walk to house → sell → buy / research.

Renderer: SVG + DOM. See [[architecture/beta-1]].

## Time

- A **day** is `240s` of sim time. HUD clock.
- At `240s` the day ends at sundown and **becomes the next morning**. No night phase, no night UI.
- **No ticks across the seam.** Plants, thirst, research, and fill/work timers do not advance between days.
- Brief `Day N` banner. No extra day-end payout. Expenses are not in Beta-1.

## Map

- World: `32×48` tiles (32 columns, 48 rows), `32px` each. Origin top-left; +x east, +y south. Cell `(col, row)` is the unit square `[col, col+1] × [row, row+1]`.
- Every tile is workable (shovel / plant / water / harvest) unless a building occupies that tile.

**Base → occupied tiles** (total):

Every placeable has a **base** in tile space: `rect { x, y, w, h }` (axis-aligned) or `circle { cx, cy, r }`. Visual SVG may be larger than the base; occupancy uses the base only.

`occupied(base) = { (col, row) | area(cell(col, row) ∩ base) > 0 }`

Those cells are buildings, not crop slots, not plantable.

**House** (north): base = axis-aligned `4×3` rect. Occupies cols `14–17`, rows `0–2`.
Door / sell stand: `(15, 3)` — not in the house base.

**Pump**: visual ≈ `2×1` tiles. Base = circle `r = 0.5` centered on cell `(18, 1)` (east of house; typically that one cell).
Buying pumpjack does not place a second pump. It sets the existing `Pump.outputLitersPerSec` from `2` to `5`. Same instance, same base, same tiles.

## Actor

- Continuous position. Speed **6 tiles/s**. Straight line to the target cell center. No walk collision (buildings only block hoe/plant).
- Arrived when the position is inside the target cell `[col, col+1) × [row, row+1)`.
- Clicks **append** to an action queue (cap 8): walk, then the act. Work timers: shovel `1.0s`, plant `0.5s`, harvest `0.5s`, water `0.4s`. Fill duration = missing liters / pump output.
- Walk to door `(15, 3)` to sell. Market queues `sell`.

## Plots

Every non-building tile:

| `kind` | Meaning |
|---|---|
| `untilled` | Needs shovel |
| `empty` | Tilled, plantable |
| `growing` | Plant, `maturity < 1`, not dead |
| `ripe` | `maturity === 1`, harvestable |
| `dead` | Thirst hit `0` while `growing`. Must shovel. No drop |

Shovel on `growing` / `ripe` / `dead` / `untilled` → `empty`, costs 1 use. No harvest from a shoveled live plant.

## Plants

One growth clock + thirst. See [[canon]] for data shape.

**Defs** (common baseline):

| id | growSeconds | waterUse /s | sale | seed |
|---|---|---|---|---|
| carrot | 45 | 0.025 | 4 | 2 |
| potato | 60 | 0.022 | 7 | 3 |
| wheat | 75 | 0.018 | 10 | 5 |
| tomato | 90 | 0.028 | 14 | 7 |
| raspberry | 120 | 0.030 | 20 | 10 |

**Rarity** is data on the seed/plant, not a class. Multipliers on **sale only** in Beta-1:

| rarity | mul |
|---|---|
| common | 1 |
| uncommon | 1.5 |
| rare | 2.5 |
| heirloom | 4 |

Only **common** is unlocked.

**Tick** (day only):

- `thirst -= effectiveWaterUse * dt`
- if `thirst <= 0`: `thirst = 0`; if `growing` → `dead`; if `ripe` → remain `ripe` (thirst cannot kill a ripe plant)
- else if `thirst >= witherThreshold` and not ripe: `maturity += dt / effectiveGrowSeconds`, clamp to `1`
- if `thirst < witherThreshold`: no growth

Config (not baked into code paths): `witherThreshold = 0.33`, `criticalThreshold = 0.10`.

Indicators: below wither → needs-water; below critical → aggressive; dead → dead art.

**Plant:** new plant has `thirst = 0.7`, `maturity = 0`.

**Watering:** `1 L` sets `thirst = 1`. No effect on `dead`. Works on `growing` and `ripe`.

**Effective stats** (modifier stack — research flats now; fertilizer later):

```
sale     = def.sale * rarityMul * Π saleMul
growSec  = def.growSeconds / Π growSpeed
waterUse = def.waterUsePerSec * Π waterUseMul
```

A modifier is `{ id, source, crop? }`. Absent `crop` = all types. Individual (future fertilizer on one tile) and flat (research) share this type.

Disease: not in Beta-1. No field.

## Water

`1 L = 1 watering`.

| item | capacity L | start | shop |
|---|---|---|---|
| bucket | 2 | yes | — |
| large-bucket | 4 | unlock | yes |
| can | 5 | unlock | $20 |
| large-can | 10 | unlock | yes |

All are the same `Container` type (`capacityLiters`, `liters`). Art differs.

**Pump** (building): `outputLitersPerSec`. Starter `2`. Buying pumpjack sets that field to `5` on the existing pump — no second pump, same base, same tiles. Occupy the pump with a container selected: walk there, fill `liters → capacity` at `output / s`. Duration = missing liters / output.

Beta-1 does not build irrigation. Types must accept later outputs/consumers without a rewrite.

## Tools

| item | uses | work | notes |
|---|---|---|---|
| shovel | 100 | 1.0s | one tile, soft soil only in Beta-1 |
| better-shovel | 250 | 0.5s | research then shop |
| box | — | harvest | carry cap 5 of **one** crop+rarity |
| large-box | — | harvest | carry cap 15 of one crop+rarity |

At `0` uses the shovel is **destroyed**. Buy another.

Ground type is a future field on the tile. Beta-1 every workable tile is `soft`. Do not switch on missing types.

**Hand:** exactly one item, or empty. See [[architecture/beta-1]] `Item` / `Hand`.

**Box:** bag. Harvest (one plant per act) or pickup of the same `goods`+crop+rarity goes into the box up to `cap`. Different goods: no merge (swap on pickup; harvest is a no-op).

**No hotbar.** Items not in hand are **drops** on Plot cells. Click hits drops on that cell first → `pickup`. Else the held item decides the act (`shovel` / `plant` / `water` / `harvest` / `fill`). Empty hand + plant cell → inspect. Empty hand + no plant → inspect the plot.

Pickup: empty hand takes the top drop. Box that can absorb merges (leftover stays). Otherwise swap (hand drops here, then take).

Shop buy: empty hand → hold; else the SKU drops on the door tile.

**Sell:** at door, if holding `fruit` or a box whose cargo is `fruit`, those fruits become money (`effectiveSale` each). Seeds in a box are not sold. Hand becomes empty, or the box stays empty.

## Start

- $10
- hand: shovel (100)
- drops on `(15, 3)`: bucket 2 L full, then carrot seeds ×5 (top)
- house + starter pump as above; actor on door tile
- whole `32×48` is `untilled` except building tiles

## Unlock / shop

**Day-1 plantable:** carrot, potato, wheat. **Research-gated:** tomato, raspberry.

Shop sells **packs of 5** at `5 × seed` price. Day-1 SKUs: carrot $10, potato $15, wheat $25, replacement shovel $15.

After unlock: tomato $35, raspberry $50, can $20, box $25, large-bucket / large-can / large-box / better-shovel / pumpjack (prices below).

## Research

Husband panel. UI button. **One job at a time.** Progress ticks only during the day. Completing unlocks the shop SKU or the plant / flat.

| id | tree | cost | seconds | effect |
|---|---|---|---|---|
| unlock-tomato | plants | 15 | 30 | tomato in shop |
| unlock-raspberry | plants | 25 | 45 | raspberry in shop |
| bump-carrot | plants | 20 | 40 | carrot `saleMul 1.10` |
| bump-potato | plants | 20 | 40 | potato `saleMul 1.10` |
| bump-wheat | plants | 25 | 45 | wheat `saleMul 1.10` |
| unlock-can | utilities | 15 | 30 | can in shop |
| unlock-large-bucket | utilities | 20 | 40 | large-bucket in shop |
| unlock-large-can | utilities | 30 | 50 | large-can in shop |
| unlock-box | utilities | 20 | 35 | box in shop |
| unlock-large-box | utilities | 35 | 50 | large-box in shop |
| unlock-better-shovel | utilities | 25 | 40 | better-shovel in shop |
| unlock-pumpjack | utilities | 40 | 60 | pumpjack in shop |

Shop prices after unlock: large-bucket $18, large-can $40, large-box $45, better-shovel $35, pumpjack $50.

Third tree: absent.

## Named invariants (tests)

1. Growth and thirst tick only while a day is running, never across sundown.
2. `maturity` increases iff `thirst >= witherThreshold` and the plant is not ripe/dead.
3. `thirst <= 0` on `growing` ⇒ `dead`; `ripe` is excluded from death; shovel is the only transition off `dead`.
4. One watering subtracts `1 L` from the container and sets `thirst = 1`.
5. `effectiveSale` is `def.sale * rarityMul * Π saleMul`.
6. Shovel use count hits `0` ⇒ item removed (hand empty).
8. Hand is empty or exactly one `Item`.
7. `occupied(base)` is exactly the cells with positive-area intersection. House occupies the 12 cells cols `14–17`, rows `0–2`. Pumpjack does not add a pump or change pump tiles.

## Out of Beta-1

Disease, fertilizer, automation / irrigation consumers, third research tree, ground types other than soft, playable night, expenses, uncommon+ planting.
