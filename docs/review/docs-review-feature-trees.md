# Docs review: Trees

Notes: `docs/mechanics/trees.md`, `docs/architecture/tree.md`, `docs/art/tree.md`, `docs/items/wild.md`
Code: `src/game/defs/trees.ts`, `src/game/defs/crops.ts`, `src/game/sim/building.ts`, `src/game/sim/feature-field/field.ts`, `src/game/sim/feature-field/field.helpers.ts`, `src/game/sim/gen.ts`, `src/game/sim/prompt.ts`, `src/game/sim/mp.ts`, `src/game/ui/almanac.tsx`, `src/assets/props/prop-*-tree.svg`
Tests: `src/game/sim/trees.test.ts`, `src/game/sim/plants.test.ts`, `src/game/sim/world.test.ts`, `src/game/defs/research.test.ts`, `e2e/trees.spec.ts`

`src/game/ui/tree-panel.tsx` is the research and skill tree panel, not fruit trees; it is not reviewed here.

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Are there `better-*` skills for tree crops?
- [ ] **doc** `docs/architecture/tree.md:22` — `better-apple`, `better-apricot`, `better-olive`, `better-cherry` are player skills.
- [ ] **code + test** `src/game/defs/skills.ts:40` — `BETTER_IDS` lists only potato, wheat, tomato, raspberry, grape; no tree skill exists. `src/game/defs/research.test.ts:208` "`better-grape` gated on…; no `better-apple` `better-apricot` `better-olive` `better-cherry`…" asserts they are absent. `docs/mechanics/plants.md:33` points tree `better-*` to `family.better-set`.
- [ ] **none**

### 2. When a chop finds no free plot beside the tree, what is dropped?
- [ ] **doc** `docs/mechanics/trees.md:135` — "Wood and trunk always." and "No plot does not undo the chop." (also `trees.chop` at `:163`: "1 wood and trunk always").
- [ ] **code** `src/game/sim/feature-field/field.helpers.ts:428` — the wood and the grafts are dropped only when `dropSpot` finds a plot cell in front of the tree; with no spot the tree still becomes a trunk and the axe still loses a use, but no wood and no grafts are dropped.
- [ ] **test** `src/game/sim/trees.test.ts:63` — asserts one wood with free plots around the tree; the no-spot case is not tested.
- [ ] **none**

### 3. Where does a tree's fertilizer use per day live?
- [ ] **doc** `docs/mechanics/trees.md:34` — `CROPS` owns water `waterUsePerSec` and the fertilizer litre draw; "L/day Fertilizer — preference on `CROPS`" (`:36`). Same in `docs/architecture/tree.md:53`.
- [ ] **code + test** `src/game/defs/crops.ts:226` — the per-day fertilizer is `TREE_FERT_PER_DAY`, a separate table beside `CROPS` (tree `CROPS` rows have `fertUseMul: 0`); `statsOf` divides it by `DAY_SECONDS` (`src/game/sim/modifiers.ts:39`). Values olive 0.09, apricot 0.12, cherry 0.165, apple 0.18 match the note's table. `src/game/sim/trees.test.ts:219` "trees.drink" reads `TREE_FERT_PER_DAY`.
- [ ] **none**

### 4. What does the almanac tell the player about tree fruit speed?
- [ ] **code** `src/game/ui/almanac.tsx:1148` — the almanac line "Drops on the grass. {days} days at ×{mul}, then ×{off}." is filled from `TREE_YIELD_MUL` 3 and `TREE_OFF_MUL` 0.7 (`src/game/defs/trees.ts:5-6`), so it reads "2 days at ×3, then ×0.7".
- [ ] **code** `src/game/sim/feature-field/field.ts:234` — the fruit timer actually runs at `2.75 + happiness × 0.5` in season (2.75 to 3.25) and `0.25 + happiness × 0.5` off season (0.25 to 0.75). `TREE_YIELD_MUL` and `TREE_OFF_MUL` are read only by the almanac and `src/game/ui/debug-balance.ts`.
- [ ] **doc** `docs/mechanics/trees.md:80` — states the happiness formula; it does not name `TREE_YIELD_MUL` or `TREE_OFF_MUL`.
- [ ] **test** `src/game/sim/plants.test.ts:995` "trees.yield" — asserts the happiness formula.
- [ ] **none**

## Doc only (no code found)

### 5. Where is `tickTree`?
- [ ] **doc** `docs/mechanics/trees.md:90` and `docs/architecture/tree.md:41` — "`World.tickTree` in `sim/world.ts`". Searched: `tickTree` in `src/game/sim/world.ts`, nothing found. The function is `tickTree` in `src/game/sim/feature-field/field.ts:211`, called from `tickField` at `:90`.
- [ ] **removed from the game** (moved; the note needs the new path)
- [ ] **none**

## Code only (no note mentions it)

### 6. Can the player shovel a tree with a shovel that has one use left?
- [ ] **code** `src/game/sim/feature-field/field.helpers.ts:235` — any shovel may dig up a tree; it costs 1 use, and the tree seed drops on the clicked cell.
- [ ] **intended, document it**
- [ ] **not intended**

### 7. What does the prompt say when the player holds an axe over a trunk or sapling?
- [ ] **code + test** `src/game/sim/prompt.ts:1175` — the prompt is blocked and shows "{name} tree" with a label: "trunk", "growing", "on-season" or "off-season" (`treeLine`, `messages/en/prompt.json:51`, `:113-116`); a `pending` tree shows "off-season". `src/game/sim/trees.test.ts:121` asserts the blocked prompt equals `treeLine(tree)`. The note says only "no-op" (`docs/mechanics/trees.md:133`).
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 8. `TREES` table: apricot 192 / 200 s, apple 240 / 300, cherry 336 / 160, olive 384 / 260 (`juvenileSeconds` / `fruitSeconds`); sale apricot 5, apple 8, cherry 4, olive 10; `TREE_YIELD_DAYS` 2 — doc `docs/mechanics/trees.md:13-18`, code `src/game/defs/trees.ts:4`, `:20`, `src/game/defs/crops.ts:89-193`, test `src/game/sim/plants.test.ts:995`.
- [ ] 9. Water use: olive 0.0015, apricot 0.002333, cherry 0.003167, apple 0.00375 L/s; tree drinks water and fertilizer at every stage (trunk, sapling, pending, on, off), once per tree — doc `docs/mechanics/trees.md:34-43`, code `src/game/sim/feature-field/field.ts:211`, test `src/game/sim/trees.test.ts:219`.
- [ ] 10. Tolerances: water apricot 3.6, apple and cherry 2.2, olive 1.2; fertilizer apricot 1.7, apple and cherry 1.35, olive 1.0; bands use the tree soil's mid 5 and max 2 — doc `docs/mechanics/trees.md:45-49`, code `src/game/defs/crops.ts:89-193`, `src/game/sim/feature-field/field.ts:215`, no direct test of tree tolerances.
- [ ] 11. Tree happiness: start 0.33, gain 900 s per green band, wilt 120, starve 200, drown 90; same drain and gain rules as plants; happiness 0 does not kill the tree and does not slow sapling growth or fruit — doc `docs/mechanics/trees.md:53-68`, code `src/game/defs/trees.ts:7-11`, `src/game/sim/feature-field/field.helpers.ts:97`, `src/game/sim/feature-field/field.ts:217`, test `src/game/sim/trees.test.ts:257`.
- [ ] 12. From seed: one sapling grow, then `pending`, no fruit; the next day change turns `pending` into two days of season — doc `docs/mechanics/trees.md:24`, `:74`, code `src/game/sim/feature-field/field.ts:218-230`, `:192`, test `src/game/sim/plants.test.ts:208`, `:995`.
- [ ] 13. Season end: `daysLeft` counts down; at 0 `tended` resets and the tree goes off season with chance `−0.25 + happiness × 0.1`; off season, each day change adds 0.10 / 0.15 / 0.20 by happiness band (red below 0.25, orange below 0.5, green) and rolls the `tree` stream at the base cell — doc `docs/mechanics/trees.md:74-78`, code `src/game/sim/feature-field/field.ts:191`, `src/game/defs/trees.ts:12`, `src/game/sim/soil.ts:43`, test `src/game/sim/trees.test.ts:287`.
- [ ] 14. Fruit timer: `fruit += dt / (fruitSeconds / mul)`, `mul` in season `2.75 + happiness × 0.5`, off season `0.25 + happiness × 0.5`; no fruit while trunk, sapling or pending — doc `docs/mechanics/trees.md:80`, code `src/game/sim/feature-field/field.ts:231-235`, test `src/game/sim/plants.test.ts:995`.
- [ ] 15. Fruit drop: freshness 1, quality 0, the tree's Variety, `cut: false`, on a random plot cell in the 3 wide × 4 tall block around the tree minus its two cells; one `fruit` stream draw; `tally.harvests += 1`; no free plot leaves `fruit` at 1 — doc `docs/mechanics/trees.md:82`, `:153`, `:157`, code `src/game/sim/feature-field/field.ts:72-73`, `:236-272`, test `src/game/sim/plants.test.ts:538`, `:1321`.
- [ ] 16. Screen refresh (`'field'` ping) only on trunk → sapling, sapling → mature, a successful drop, and the first blocked drop; the trunk → sapling tick does not also mature — doc `docs/mechanics/trees.md:94-101`, `:159`, code `src/game/sim/feature-field/field.ts:218-243`, `src/game/sim/world.ts:248`, test `src/game/sim/plants.test.ts:222`.
- [ ] 17. Stage: trunk → `trunk`; sapling → `grow`; in season or `fruit >= 1` → `ripe`; else `unripe` — doc `docs/mechanics/trees.md:105`, `docs/architecture/tree.md:37`, code `src/game/sim/building.ts:408`, test `src/game/sim/trees.test.ts:162`.
- [ ] 18. Tend a tree: `tending` owned, empty hand, mature, off season, not tended, not trunk, either cell; work `TEND_WORK`; `chance += 0.15`, `tended = true`; happiness untouched; prompt **Tend** — doc `docs/mechanics/trees.md:109-115`, code `src/game/sim/feature-field/field.helpers.ts:395`, `:408`, test `src/game/sim/plants.test.ts:1043`.
- [ ] 19. Chop: axe (30 uses, 5 s) or chainsaw (90 uses, 3 s) on a mature tree that is not a trunk, either cell; one use; wood plus 2 grafts of the tree's Variety at quality 0 when `grafting` is owned; then trunk, `juvenile` 0, `fruit` 0, `pending`, `tended` false; soil and happiness kept; prompt **Chop**; on a sapling or trunk the prompt shows the tree line and nothing happens — doc `docs/mechanics/trees.md:121-137`, `:165`, code `src/game/sim/feature-field/field.helpers.ts:414`, `src/game/defs/items.ts:25`, `:38`, test `src/game/sim/trees.test.ts:63`.
- [ ] 20. After a chop: trunk grows `juvenileSeconds`, becomes a sapling at 0, grows `juvenileSeconds` again, then `pending` — doc `docs/mechanics/trees.md:137`, `:167`, code `src/game/sim/feature-field/field.ts:218-229`, test `src/game/sim/trees.test.ts:162`.
- [ ] 21. Soil mint at planting and for the wild apple: water 5 L, fertilizer `goodness(base) × 2`, happiness 0.33 — doc `docs/mechanics/trees.md:28`, code `src/game/sim/feature-field/field.helpers.ts:318`, `src/game/sim/gen.ts:91`, test `src/game/sim/trees.test.ts:326`.
- [ ] 22. Start chunk `(0,0)` gets one wild base apple on the first soft 1×2 pair (row by row), `juvenile` 0, not tended, not a trunk — doc `docs/mechanics/trees.md:86`, `:143`, code `src/game/sim/gen.ts:66`, `:76`, test `src/game/sim/trees.test.ts:326`.
- [ ] 23. Shovel a tree (trunk included): tree seed of that species and Variety at quality 0, both cells bare soft, soil and happiness gone — doc `docs/mechanics/trees.md:84`, code `src/game/sim/feature-field/field.helpers.ts:248`, test `src/game/sim/world.test.ts:735`.
- [ ] 24. A tree never rolls a Variety; only a graft changes it; fruit quality is 0; `Tree` has no quality field — doc `docs/mechanics/trees.md:7`, code `src/game/sim/building.ts:379`, `src/game/sim/feature-field/field.helpers.ts:462`, test `src/game/sim/plants.test.ts:1321`, `:1445`.
- [ ] 25. Multiplayer digest carries tree Variety, and happiness and soil at the base cell — doc `docs/architecture/tree.md:43`, code `src/game/sim/mp.ts:261`, no test read.
- [ ] 26. Tree art: `prop-{species}-tree.svg` is 24×48 with groups `trunk`, `grow`, `unripe`, then one ripe group per Variety (apple and apricot all three, olive `ripe` and `ripe-variant`, cherry `ripe` and `ripe-heirloom`); fruit icons carry one group per Variety; four `item-seed-*.svg` — doc `docs/art/tree.md:3-26`, code `src/assets/props/prop-*-tree.svg`, `src/assets/items/item-seed-*.svg`, no test read.
- [ ] 27. Weeds and grass gathered by hand merge up to the stack cap; a full hand says so; shovel on a weed drops nothing — doc `docs/items/wild.md:5`, code `src/game/sim/queue.ts:583`, `src/game/sim/feature-field/field.helpers.ts:266`, test `src/game/sim/plants.test.ts:737`.
