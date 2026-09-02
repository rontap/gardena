# Trees

Yield, plant, drop: [[mechanics/plants]]. Types: [[architecture/tree]]. Art: [[art/tree]].

`TREE_YIELD_MUL`, `TREE_OFF_MUL` — preference. Juvenile unchanged.

Class `Tree`. Cell `kind: 'tree'`. Same instance on a vertical 1×2. Planted from `{ kind: 'tree-seed'; tree }` on the clicked cell as the foot. Soft untilled only. Drinks nothing. No fertilizer. No `Plant`. Species-only.

`TREES` in `defs/trees.ts`. `TREE_YIELD_DAYS` — preference.

```
TreeYield = pending | { on; daysLeft: 1 | 2 } | { off; chance }
```

`juvenile` 0..1 once. Then `yield = pending` (no fruit). Fruit timer ticks only while mature and not pending.

Seam, with stipend/tax, before field tick, per tree with `juvenile >= 1`:

1. `pending` → `{ on, daysLeft: TREE_YIELD_DAYS }`
2. `on` → `daysLeft -= 1`; if 0 → `{ off, chance: -0.2 }` (no roll)
3. `off` → `chance += 0.2`; `u = tree.at(base.col, base.row, day)`; if `u < chance` → `{ on, daysLeft: TREE_YIELD_DAYS }` — [[mechanics/rng]]

Field tick, mature, not pending: `fruit += dt / (fruitSeconds / mul)`. mul is `TREE_YIELD_MUL` while `on`, else `TREE_OFF_MUL`. At `>= 1`: drop fruit `freshness` 1 on the first in-world `frontOf` cell that is a `Plot` and is not in the footprint. Walk `frontOf(base)` then `frontOf({ col, row: row+1 })`. Existing drops on a plot are allowed. Spot found: `rarity = rollRarity(fruit.next())`, `fruit = 0`, `tally.harvests += 1`. No plot → clamp `fruit = 1`, show ripe, no `next()`. Cells stay `tree`.

Shovel: tree seed, cells bare soft.

Start chunk `(0,0)`: one wild apple, first valid 1×2 soft pair, `juvenile = 0`.

## Tick dirty

`World.tickTree` in `sim/world.ts`. `tickField` pings `'field'` when `tickTree` returns true.

Dirty iff a visual stage change:

- `juvenile` crosses 1 (`grow` → pending / `unripe`)
- fruit drop succeeds
- fruit first hits 1 on a blocked drop (`unripe` → `ripe`), then silent until a drop succeeds

Not dirty: `juvenile += dt` while still `< 1`. Repeat blocked drop while `fruit === 1`.

Dirty reasons: `'act' | 'field' | 'big' | 'speech' | 'vfx'`. `'field'` means Marks/plots need React.

Stage from `Tree`: `juvenile < 1` → `grow`; else `yield.kind === 'on' || fruit >= 1` → `ripe`; else `unripe`.

## Invariants

`trees.wild` — Start chunk `(0,0)` has one wild 1×2 apple `Tree` on the first valid soft pair, `juvenile = 0`. No shrub.

`trees.yield` — Tree juvenile `TREES.juvenileSeconds` then `pending`. Next seam → `TREE_YIELD_MUL` for `TREE_YIELD_DAYS`. After that `chance = -0.2`, next seam +0.2 and roll. Off-season fruits at `TREE_OFF_MUL`. Juvenile unchanged.

`trees.drop` — Tree auto-drop freshness 1, cells stay `tree`. Shovel → tree seed, cells bare soft.

`trees.foot` — Planting anchors on the clicked cell as the lower half: `base` is the cell above it — [[mechanics/plants]].

`trees.rng` — Two successful tree drops the same day each consume `fruit.next()`. Rarities need not match.

`trees.ping` — Juvenile growth does not ping. `tickTree` pings `'field'` only on visual stage change: juvenile crosses 1, fruit drop succeeds, fruit first hits 1 on a blocked drop then silent until a drop succeeds. Juvenile increment while `< 1` does not ping. Repeat blocked drop at `fruit === 1` does not ping. Dirty reasons: `'act' | 'field' | 'big' | 'speech' | 'vfx'`. `'field'` means Marks/plots need React.
