# Trees

Yield, plant, drop: [[mechanics/plants]]. Types: [[architecture/tree]]. Art: [[art/tree]]. Copy: [[ui/inspect]].

`DAY_SECONDS` stays. `TREE_YIELD_MUL` 3.5 / `TREE_OFF_MUL` 0.75 stay. Income `$/min` = `CROPS.sale × mul / fruitSeconds × 60` — derived, not a field. mul is `TREE_YIELD_MUL` while `on`, else `TREE_OFF_MUL`. No tree shop pack.

Class `Tree`. Cell `kind: 'tree'`. Same instance on a vertical 1×2. Planted from `{ kind: 'tree-seed'; tree }` on the clicked cell as the foot. Soft untilled only. Drinks nothing. No fertilizer. No `Plant`. Species-only. `Tree.tended: boolean` required, starts `false`. `Tree.trunk: boolean` required, starts `false`. Illegal: optional `tended`. Illegal: optional `trunk`.

`TREES` in `defs/trees.ts`. `TREE_YIELD_DAYS` — preference. `juvenileSeconds` / `fruitSeconds` / `CROPS.sale` — preference.

| species | `juvenileSeconds` | `fruitSeconds` | `CROPS.sale` |
|---|---|---|---|
| apricot | 192 | 180 | 6.10 |
| apple | 240 | 302.4 | 15.40 |
| cherry | 336 | 124.8 | 8.45 |
| olive | 384 | 240 | 24.40 |

```
TreeYield = pending | { on; daysLeft: 1 | 2 } | { off; chance }
```

`juvenile` 0..1. From seed: once, then `yield = pending` (no fruit). After chop: two full grows — `trunk` then `grow` — then pending. Fruit timer ticks only while mature and not pending. Not while `trunk`. Not while `grow` (`trunk === false` && `juvenile < 1`).

Seam, with stipend/tax, before field tick, per tree with `juvenile >= 1`:

1. `pending` → `{ on, daysLeft: TREE_YIELD_DAYS }`
2. `on` → `daysLeft -= 1`; if 0 → `tended = false`, then `{ off, chance: -0.2 }` (no roll)
3. `off` → `chance += 0.2`; `u = tree.at(base.col, base.row, day)`; if `u < chance` → `{ on, daysLeft: TREE_YIELD_DAYS }` — [[mechanics/rng]]

Field tick, mature, not pending: `fruit += dt / (fruitSeconds / mul)`. mul is `TREE_YIELD_MUL` while `on`, else `TREE_OFF_MUL`. At `>= 1`: drop fruit `freshness` 1 on a random in-world `Plot` cell in the 3 wide × 4 tall block around the trunk (`TREE_DROP_COLS` -1..1 × `TREE_DROP_ROWS` -1..2, offsets from `base`), minus the two footprint cells. Existing drops on a plot are allowed. Candidates exist: `hit = open[floor(fruit.next() * open.length)]` **then** `rarity = rollRarity(fruit.next())` — two draws, spot before rarity — then `fruit = 0`, `tally.harvests += 1`. No plot → clamp `fruit = 1`, show ripe, no `next()`. Cells stay `tree`.

Shovel: tree seed, cells bare soft. Including trunk.

Start chunk `(0,0)`: one wild apple, first valid 1×2 soft pair, `juvenile = 0`, `tended = false`, `trunk = false`.

## Tick dirty

`World.tickTree` in `sim/world.ts`. `tickField` pings `'field'` when `tickTree` returns true.

Dirty iff a visual stage change:

- `trunk && juvenile` crosses 1 (`trunk` → `grow`): `trunk = false`, `juvenile = 0`. Same tick does not also mature
- `juvenile` crosses 1 while `trunk === false` (`grow` → pending / `unripe`)
- fruit drop succeeds
- fruit first hits 1 on a blocked drop (`unripe` → `ripe`), then silent until a drop succeeds

Not dirty: `juvenile += dt` while still `< 1`. Repeat blocked drop while `fruit === 1`.

Dirty reasons: `'act' | 'field' | 'big' | 'speech' | 'vfx'`. `'field'` means Marks/plots need React.

Stage from `Tree`: `trunk === true` → `trunk`; else `juvenile < 1` → `grow`; else `yield.kind === 'on' || fruit >= 1` → `ripe`; else `unripe`.

## Tend

Skill `tending`. `Intent` `{ act: 'tend'; at: Coord }`. `dest` = `at`. Empty hand, work `TEND_WORK`. Prompt **Tend**.

Legal: `cell.kind === 'tree'`, `juvenile >= 1`, `yield.kind === 'off'`, `tended === false`, `trunk === false`. Either cell of the 1×2. Not pending. Not `{ on }`. Not juvenile. Not trunk. Not grow.

Completing tend: `chance += 0.15`, `tended = true`. No cap.

`pending` look is off-season; prompt is not Tend.

Witness `Tree.tended` — [[architecture/ai-gameplay-api]]. Plants unchanged: [[mechanics/plants]] `plants.tend`. Family: [[mechanics/family]].

## Chop

`AXES.axe` `{ uses; workSeconds }` — preference. Item `{ kind: 'axe'; usesLeft; workSeconds }`. No `id`. No better-axe. 0 uses: hand empty.

`Intent` `{ act: 'chop'; at: Coord }`. `dest` = `at`. Either cell of the 1×2. Work `AXES.axe.workSeconds`. Prompt **Chop**. Enqueue, no new `Act` letter.

Legal: hand axe, `cell.kind === 'tree'`, `juvenile >= 1`, `trunk === false`. Not grow. Not trunk. Axe on grow / trunk: no-op.

Complete: `usesLeft -= 1`, drop `{ kind: 'wood'; count: 1 }` `frontOf`, then `trunk = true`, `juvenile = 0`, `fruit = 0`, `yield = pending`, `tended = false`. Pending fruit is lost. Ground drops around the tree stay. Chop always completes.

Loop: chop → `trunk` (`juvenileSeconds`) → `grow` (`trunk = false`, `juvenile` 0, another `juvenileSeconds`) → mature `pending`. Two full grows after a chop.

Assumption: wood uses `frontOf` / `dropSpot`; no plot does not undo the chop.

## Invariants

`trees.wild` — Start chunk `(0,0)` has one wild 1×2 apple `Tree` on the first valid soft pair, `juvenile = 0`, `tended = false`, `trunk = false`. No shrub.

`trees.yield` — Tree juvenile `TREES.juvenileSeconds` then `pending`. Next seam → `TREE_YIELD_MUL` for `TREE_YIELD_DAYS`. After that `chance = -0.2`, next seam +0.2 and roll. Off-season fruits at `TREE_OFF_MUL`. From seed, juvenile once. After chop, two full grows then pending.

`trees.drop` — Tree auto-drop freshness 1, cells stay `tree`. Shovel → tree seed, cells bare soft. Including trunk.

`trees.foot` — Planting anchors on the clicked cell as the lower half: `base` is the cell above it — [[mechanics/plants]].

`trees.rng` — Two successful tree drops the same day each consume `fruit.next()`. Rarities need not match.

`trees.ping` — Juvenile growth does not ping. `tickTree` pings `'field'` only on visual stage change: trunk→grow (`trunk && juvenile` crosses 1: `trunk = false`, `juvenile = 0`; same tick does not also mature), grow→mature (juvenile crosses 1 while `trunk === false`), fruit drop succeeds, fruit first hits 1 on a blocked drop then silent until a drop succeeds. Juvenile increment while `< 1` does not ping. Repeat blocked drop at `fruit === 1` does not ping. Dirty reasons: `'act' | 'field' | 'big' | 'speech' | 'vfx'`. `'field'` means Marks/plots need React.

`trees.tend` — Tend once per off-season: player owns `tending`, empty hand, `cell.kind === 'tree'`, `juvenile >= 1`, `yield.kind === 'off'`, `Tree.tended === false`, `trunk === false`. Either cell of the 1×2. Work `TEND_WORK`. Then `chance += 0.15`, `tended = true`. No cap. Seam `on` → `off`: `tended = false`, then `chance = -0.2`. Not pending. Not `{ on }`. Not juvenile. Not trunk. Not grow. Prompt **Tend**. Witness `Tree.tended`.

`trees.chop` — Axe, mature not trunk, `AXES.axe.workSeconds`, `AXES.axe.uses`, 1 wood, fruit progress lost.

`trees.trunk` — Chop → trunk `juvenileSeconds` → sapling `juvenileSeconds` → pending. `trunk` required boolean. Stage `grow` is that sapling.
