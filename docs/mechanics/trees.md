# Trees

Yield, plant, drop: [[mechanics/plants]]. Types: [[architecture/tree]]. Art: [[art/tree]]. Copy: [[ui/inspect]]. Variety: [[mechanics/plants]]. Soil capacities: [[mechanics/soil]] `soil.tree`.

`DAY_SECONDS` 240. Income `$/min` = `CROPS.sale × mul / fruitSeconds × 60` — derived, not a field. mul is fruit fill from Happiness. No tree shop pack.

Class `Tree`. Cell `kind: 'tree'`. Same instance on a vertical 1×2. Planted from `{ kind: 'tree-seed'; tree; variety; quality }` on the clicked cell as the foot. Soft untilled only. Trees stay untilled 1×2. Not a `Plant`. Not a tilled plot. `Tree.variety` required `VarietyId`. `Tree.tended: boolean` required, starts `false`. `Tree.trunk: boolean` required, starts `false`. `Tree.happiness` required `[0,1]`, starts `TREE_HAPPY_START` 0.33. `Tree.soil` required. Illegal: optional `tended`. Illegal: optional `trunk`. Illegal: optional `variety`. Illegal: optional `happiness`. Illegal: optional `soil`. Illegal: `Tree.quality`. Fruit Quality stays 0. A tree never rolls a variety at fruit drop; graft is the only way its variety changes — [[mechanics/plants]] `plants.variety-roll`.

One `Soil` on the `Tree` instance, shared by both cells. Capacities, clamp, `drowning`, bands: [[mechanics/soil]] `soil.tree`. `weedChance` unused; weeds still only `empty`.

`TREES` in `defs/trees.ts`. `TREE_YIELD_DAYS` — preference. `juvenileSeconds` / `fruitSeconds` / `CROPS.sale` — preference.

| species | `juvenileSeconds` | `fruitSeconds` | `CROPS.sale` |
|---|---|---|---|
| apricot | 192 | 200 | 5 |
| apple | 240 | 300 | 8 |
| cherry | 336 | 160 | 4 |
| olive | 384 | 260 | 10 |

```
TreeYield = pending | { on; daysLeft: 1 | 2 } | { off; chance }
```

`juvenile` 0..1. From seed: once, then `yield = pending` (no fruit). After chop: two full grows — `trunk` then `grow` — then pending. Fruit timer ticks only while mature and not pending. Not while `trunk`. Not while `grow` (`trunk === false` && `juvenile < 1`). A neighbour-need variety does not raise `fruit` and the seam does not turn `pending` into `on` without a neighbour — [[mechanics/plants]] `variety.neighbour`. `juvenile` still grows. Drink, starve, Happiness still tick.

## Soil mint

Mint at plant and wild apple: water 5 L (`TREE_WATER_MID`), Fertilizer `goodness(seed, base.col, base.row) × TREE_FERT_MAX`, Happiness `TREE_HAPPY_START` 0.33. `weedChance` `WEED_CHANCE`, unused.

Chop keeps `Tree.soil` and `Tree.happiness`. Dig destroys them. Graft does not touch them.

## Drink

Every stage (trunk, growing, pending, on-season, off-season). One origin. `CROPS` owns water `waterUsePerSec` and the Fertilizer litre draw. Not `TREES`. Not `PLANT_FERT_PER_SEC × fertUseMul`.

L/day water — preference. `waterUsePerSec` = L/day / `DAY_SECONDS` — derived. L/day Fertilizer — preference on `CROPS`. `statsOf.fertUsePerSec` for a `TreeId` = L/day Fertilizer / `DAY_SECONDS` — derived.

| species | L/day water | `waterUsePerSec` | L/day Fertilizer |
|---|---|---|---|
| olive | 0.36 | 0.0015 | 0.090 |
| apricot | 0.56 | 0.002333 | 0.120 |
| cherry | 0.76 | 0.003167 | 0.165 |
| apple | 0.90 | 0.00375 | 0.180 |

Bands: same geometry as plants, `waterBand` / `fertBand` take that `Soil`'s mid/max — [[mechanics/soil]]. Heirloom uses `VARIETY_TOL`. `statsOf` tols.

Stricter late-game: apricot < apple = cherry < olive.

Water `waterTolerance` (half-width, mid 5): apricot 3.6, apple = cherry 2.2, olive 1.2. Fertilizer `fertTolerance` (max 2, floor = 2 − tol): apricot 1.70, apple = cherry 1.35, olive 1.00. Preference on `CROPS`.

## Happiness

Tree Happiness clocks, not plant `HAPPY_*`. `age` never `doomed`. Happiness 0 does not kill, does not stunt juvenile or fruit fill. Tend unchanged — [[#Tend]].

Gain per green band is `TREE_HAPPY_GAIN_SECONDS` 900, same as plant `HAPPY_GAIN_SECONDS`. Drain stays tree clocks. Preference: `TREE_HAPPY_START` 0.33, `TREE_HAPPY_GAIN_SECONDS` 900, `TREE_HAPPY_WILT_SECONDS` 120, `TREE_HAPPY_STARVE_SECONDS` 200, `TREE_HAPPY_DROWN_SECONDS` 90. `DAY_SECONDS` 240.

Derived (not preference):

| | span | seconds | days |
|---|---|---|---|
| both green | 0.33→1 | 301.5 | 1.26d |
| both green | 0→1 | 450 | 1.88d |
| one green | 0.33→1 | 603 | 2.51d |
| wilt | 1→0 | 120 | 0.50d |
| starve | 1→0 | 200 | 0.83d |
| drown | 1→0 | 90 | 0.38d |

Same `age` geometry as plants: drown water red and `drowning`; wilt water red, dry; starve fert red; gain each green band only if neither bar is red; both-red drains starve and water together. Clamp `0..HAPPY_MAX`. Identifiers `TREE_HAPPY_*` in `defs/trees.ts`.

## Yield

Seam, with stipend/tax, before field tick, per tree with `juvenile >= 1` (and a neighbour if needed):

1. `pending` → `{ on, daysLeft: TREE_YIELD_DAYS }`
2. `on` → `daysLeft -= 1`; if 0 → `tended = false`, then `{ off, chance: −0.25 + happiness × 0.1 }` (no roll)
3. `off` → `chance +=` Happiness band; `u = tree.at(base.col, base.row, day)`; if `u < chance` → `{ on, daysLeft: TREE_YIELD_DAYS }` — [[mechanics/rng]]

Off-season `chance +=`: 0.10 red / 0.15 orange / 0.20 green Happiness band (inspect: red 0–0.25, orange 0.25–0.5, green 0.5–1). Preference.

Fruit fill, mature, not pending, neighbour ok: `fruit += dt / (fruitSeconds / mul)`. `on = 2.75 + happiness × 0.5`. `off = 0.25 + happiness × 0.5`. Derived: Happiness 0 → 2.75 / 0.25. Happiness 1 → 3.25 / 0.75. Happiness 0.5 → 3.00 / 0.50.

At `>= 1`: drop fruit `freshness` 1, `quality` 0, `variety` = `Tree.variety`, `cut: false` on a random in-world `Plot` cell in the 3 wide × 4 tall block around the trunk (`TREE_DROP_COLS` -1..1 × `TREE_DROP_ROWS` -1..2, offsets from `base`), minus the two footprint cells. Existing drops on a plot are allowed. Candidates exist: `hit = open[floor(fruit.next() * open.length)]` — one draw, spot only — then `fruit = 0`, `tally.harvests += 1`. No plot → clamp `fruit = 1`, show ripe, no `next()`. Cells stay `tree`.

Shovel: tree seed of that species and `Tree.variety`, quality 0, cells bare soft. Including trunk. Dig destroys soil and Happiness.

Start chunk `(0,0)`: one wild apple, first valid 1×2 soft pair, `juvenile = 0`, `tended = false`, `trunk = false`, `variety = 'base'`, mint soil and Happiness as plant.

## Tick dirty

`World.tickTree` in `sim/world.ts`. `tickField` pings `'field'` when `tickTree` returns true.

`tickTree` drinks, starves, ages Happiness first, then existing juvenile / pending / fruit path. Drink / starve / Happiness do not ping.

Dirty iff a visual stage change:

- `trunk && juvenile` crosses 1 (`trunk` → `grow`): `trunk = false`, `juvenile = 0`. Same tick does not also mature
- `juvenile` crosses 1 while `trunk === false` (`grow` → pending / `unripe`)
- fruit drop succeeds
- fruit first hits 1 on a blocked drop (`unripe` → `ripe`), then silent until a drop succeeds

Not dirty: `juvenile += dt` while still `< 1`. Repeat blocked drop while `fruit === 1`. Drink, starve, Happiness.

Dirty reasons: `'act' | 'field' | 'big' | 'speech' | 'vfx'`. `'field'` means Marks/plots need React.

Stage from `Tree`: `trunk === true` → `trunk`; else `juvenile < 1` → `grow`; else `yield.kind === 'on' || fruit >= 1` → `ripe`; else `unripe`.

## Tend

Skill `tending`. `Intent` `{ act: 'tend'; at: Coord }`. `dest` = `at`. Empty hand, work `TEND_WORK`. Prompt **Tend**.

Legal: `cell.kind === 'tree'`, `juvenile >= 1`, `yield.kind === 'off'`, `tended === false`, `trunk === false`. Either cell of the 1×2. Not pending. Not `{ on }`. Not juvenile. Not trunk. Not grow.

Completing tend: `chance += 0.15`, `tended = true`. No cap. Does not write Happiness.

`pending` look is off-season; prompt is not Tend.

Witness `Tree.tended` — [[architecture/ai-gameplay-api]]. Plants unchanged: [[mechanics/plants]] `plants.tend`. Family: [[mechanics/family]].

## Chop

`AXES.axe` `{ uses: 30; workSeconds }` — uses 30 preference; workSeconds preference. `AXES.chainsaw` `{ uses: 90; workSeconds: 3 }` — preference.

```
ChopItem =
  | { kind: 'axe'; usesLeft; workSeconds }
  | { kind: 'chainsaw'; usesLeft; workSeconds }
```

No `id`. No better-axe. 0 uses: hand empty.

`Intent` `{ act: 'chop'; at: Coord }`. `dest` = `at`. Either cell of the 1×2. Work is the held item's `workSeconds`. Prompt **Chop**. Enqueue, no new `Act` letter.

Legal: hand axe or chainsaw, `cell.kind === 'tree'`, `juvenile >= 1`, `trunk === false`. Not grow. Not trunk. Axe or chainsaw on grow / trunk: no-op.

Complete: `usesLeft -= 1`, drop `{ kind: 'wood'; count: 1 }` `frontOf` / `dropSpot`, drop `{ kind: 'graft'; crop: species; variety: Tree.variety; quality: 0; count: 2 }` `frontOf` / `dropSpot` iff `grafting` is owned, then `trunk = true`, `juvenile = 0`, `fruit = 0`, `yield = pending`, `tended = false`. Pending fruit is lost. Ground drops around the tree stay. Chop always completes. Wood and trunk always. Soil and Happiness kept. No plot does not undo the chop. Variety on the trunk is unchanged. No grafts when `grafting` is not owned.

Loop: chop → `trunk` (`juvenileSeconds`) → `grow` (`trunk = false`, `juvenile` 0, another `juvenileSeconds`) → mature `pending`. Two full grows after a chop.

Graft attach onto a sapling or trunk: [[mechanics/plants]] `graft.attach`.

## Invariants

`trees.wild` — Start chunk `(0,0)` has one wild 1×2 apple `Tree` on the first valid soft pair, `juvenile = 0`, `tended = false`, `trunk = false`, `variety = 'base'`, water 5 L, Fertilizer `goodness × TREE_FERT_MAX`, Happiness `TREE_HAPPY_START`. No shrub.

`trees.drink` — Every stage drinks `CROPS.waterUsePerSec` and the `CROPS` Fertilizer litre draw, once per origin; not `PLANT_FERT_PER_SEC × fertUseMul`.

`trees.happy` — Tree Happiness starts `TREE_HAPPY_START`; gain `TREE_HAPPY_GAIN_SECONDS` per green band; drain `TREE_HAPPY_WILT_SECONDS` / `TREE_HAPPY_DROWN_SECONDS` / `TREE_HAPPY_STARVE_SECONDS`; `age` never `doomed`; Happiness 0 does not kill and does not stunt juvenile or fruit fill.

`trees.chance` — Off-season seam `chance +=` 0.10 red / 0.15 orange / 0.20 green Happiness band (inspect 0–0.25 / 0.25–0.5 / 0.5–1); on→off `chance = −0.25 + happiness × 0.1`.

`trees.yield` — Tree juvenile `TREES.juvenileSeconds` then `pending`. Next seam → `on` for `TREE_YIELD_DAYS`. Fruit fill `on = 2.75 + happiness × 0.5`, `off = 0.25 + happiness × 0.5`. Off-season chance: `trees.chance`. From seed, juvenile once. After chop, two full grows then pending. Neighbour-need varieties: [[mechanics/plants]] `variety.neighbour`.

`trees.drop` — Tree auto-drop freshness 1, quality 0, `variety` = `Tree.variety`, `cut: false`, cells stay `tree`. Shovel → tree seed of that species and variety, quality 0, cells bare soft, soil and Happiness destroyed. Including trunk.

`trees.foot` — Planting anchors on the clicked cell as the lower half: `base` is the cell above it — [[mechanics/plants]].

`trees.rng` — Two successful tree drops the same day each consume `fruit.next()`. Variety is the tree's. Quality is 0.

`trees.ping` — Juvenile growth does not ping. Drink, starve, Happiness do not ping. `tickTree` pings `'field'` only on visual stage change: trunk→grow (`trunk && juvenile` crosses 1: `trunk = false`, `juvenile = 0`; same tick does not also mature), grow→mature (juvenile crosses 1 while `trunk === false`), fruit drop succeeds, fruit first hits 1 on a blocked drop then silent until a drop succeeds. Juvenile increment while `< 1` does not ping. Repeat blocked drop at `fruit === 1` does not ping. Dirty reasons: `'act' | 'field' | 'big' | 'speech' | 'vfx'`. `'field'` means Marks/plots need React.

`trees.tend` — Tend once per off-season: player owns `tending`, empty hand, `cell.kind === 'tree'`, `juvenile >= 1`, `yield.kind === 'off'`, `Tree.tended === false`, `trunk === false`. Either cell of the 1×2. Work `TEND_WORK`. Then `chance += 0.15`, `tended = true`. No cap. Does not write Happiness. Seam `on` → `off`: `tended = false`, then `chance` per `trees.chance`. Not pending. Not `{ on }`. Not juvenile. Not trunk. Not grow. Prompt **Tend**. Witness `Tree.tended`.

`trees.chop` — Axe or chainsaw, mature not trunk, work held `workSeconds`, `AXES.axe.uses` 30, `AXES.chainsaw.uses` 90 `workSeconds` 3, 1 wood and trunk always, 2 grafts of that tree's variety iff `grafting` owned, fruit progress lost, soil and Happiness kept.

`graft.axe` — Chop complete drops 2 grafts of `Tree.variety` at quality 0 iff `grafting` owned, then the trunk result.

`trees.trunk` — Chop → trunk `juvenileSeconds` → sapling `juvenileSeconds` → pending. `trunk` required boolean. Stage `grow` is that sapling.
