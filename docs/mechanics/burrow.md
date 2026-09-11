# Burrow

Untilled cover. Loot is rolled at spawn and stored. Dig drops that item. Luck feeds both the day chance and the loot roll. Treasure is an item you open for money.

Owner: `defs/burrow.ts`, `sim/feature-burrow/`. Cover on `sim/plot.ts`. Treasure on `sim/item.ts`. Index `World.burrows` via `track()`. `World` does not own loot. Not a `World.luck` field. Generate of `(0,0)` calls in; expand generate does not. Seam calls in. Shovel complete calls in. [[architecture/modules]] [[architecture/world]]

Vault terms this note owns: **burrow**, **loot roll**, **luck**, **treasure**.

## Cover

Untilled cover `{ kind: 'burrow'; loot }`. `loot` required at spawn. Illegal: optional `loot`. Illegal: burrow as a `Cell` kind. Illegal: fruit / compost / wood / graft / `rotary-shovel` / `diamond-pickaxe` / starter `shovel` / starter `pickaxe` as `loot`. Illegal: `vanilla`, `chilli`, or `grass` as a burrow seed crop. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's crop.

Loot kinds: treasure; tree-seed; seeds of tomato / raspberry / grape; fertilizer; weed; fly-agaric; better-shovel; better-pickaxe; axe.

Not solid. Walk ok. `isSolid` false. Plot. Same `ground` / `hardness` as the untilled cell. Place / tile / fence / tree-seed refuse. `placeSolidOk` refuses `cover.kind === 'burrow'`. `isTileSite` stays bare or tile. `isFenceSite` is untilled and not burrow. Tree seed still needs both cells untilled, `ground === 'soft'`, cover bare or grass. [[ui/place]] [[mechanics/plants]]

Empty hand: walk. Drop on the plot is legal. Seam will not mint onto a cell that already has a drop.

## Dig

Held shovel, any `ShovelId` including `rotary-shovel`. `{ act: 'shovel'; at }`. Prompt **Dig**. Work `workSeconds × BURROW_MUL` — derived. `BURROW_MUL` — preference. Not hardness. Not `DIG_HARD_SPAN`. 1 use, including on hard. Does not till. Complete: `usesLeft -= 1` (0 → hand empty), cover → `{ kind: 'bare' }`, same `ground` / `hardness`, drop stored item on `nearSite(w, at)` — the first of S, W, E, N that is `inWorld` and `isPlot`, else the dug cell. Grass that the burrow replaced is gone. Pickaxe: no-op. Prompt stays the look line. Inspect does not name loot. [[ui/inspect]]

## Start

Chunk `(0,0)` generate mints `BURROW_START_N` — preference. Euclidean `r` from door, cell center to door center, same `r` as `clearBase` (`> 8`). None on reserved / rock / tree / very-hard. Day-1 generate does not also seam-spawn. Expand generate mints 0. Site pick: spatial `burrow.at(cx, cy, day, k)`. Start: `(0, 0, 1, k)` for `k = 0 .. BURROW_START_N-1`. Eligible of that chunk, sorted `(row, col)`, without replacement: `floor(u * remaining)`. Fewer eligible than `BURROW_START_N`: mint that many.

## Seam

After stipend and tax, before field tick, `clock.day` already incremented: per owned chunk, roll `burrow.at(cx, cy, clock.day, BURROW_DAY_SALT)` against `burrowDayChance(luck)` and skip the chunk on a miss; on a hit, `+1` on one eligible cell, or skip if none. Independent per chunk, `owned` order. `burrow.at(cx, cy, clock.day, 0)` maps onto that chunk's eligible list. Empty → skip.

```
burrowDayChance = BURROW_DAY_CHANCE + luck × BURROW_LUCK_CHANCE
```

A day can pass with nothing new. `BURROW_DAY_SALT` sits clear of the site-pick `k`. Start does not roll it: `mintStart` always mints `BURROW_START_N`. Eligible: owned, untilled, not very-hard, cover bare or grass, not reserved, no drop. Grass cover is replaced. Existing burrow / tile / tilled: not eligible. Fence is not a Cover; seam does not test it. `mintSeam` lives in `sim/feature-burrow/`. Ping is the seam ping. [[mechanics/day]]

## Loot roll

Derived at spawn. Stored. Later luck does not reroll.

```
luck     = min(LUCK_CAP, skillTier('lucky'))
lootRoll = LOOT_ROLL_BASE
         + LOOT_ROLL_DIST × min(1, r / LOOT_ROLL_DIST_R)
         + LOOT_ROLL_DAY  × min(1, (day − 1) / LOOT_ROLL_DAY_SPAN)
         + luck / LOOT_LUCK_DIV
         + u × LOOT_U_SPAN − LOOT_U_OFF
```

May exceed `LOOT_GATE_HEIRLOOM`. Not clamped. `r` is Euclidean from door. `day` is `clock.day` at spawn. `u` is `burrow.at(col, row, 0)`. Identifiers in `defs/burrow.ts` — preference. Salts: 0 lootRoll `u`, 1 row, 2 pool, 3 coins or tool used.

Keep a row iff its gate holds and its pool is non-empty. Then equal chance: `floor(burrow.at(col, row, 1) * n)` on the kept list in table order. Treasure always. Second roll uniform in that row's listed pool. Quality 0. Low gates are strict `<`, high gates `≥`, so the bands are disjoint. No research filter.

| id | gate | pool |
|---|---|---|
| `treasure` | always | coins `round((TREASURE_COINS_BASE + floor(u × TREASURE_COINS_SPAN)) × lootRoll)` |
| `tree-seed-base` | `lootRoll < LOOT_GATE_BASE` | apple / apricot / cherry / olive `'base'` |
| `tree-seed-variant` | `lootRoll ≥ LOOT_GATE_VARIANT` | apple `kingston-black`, apricot `blenheim`, olive `arbequina` |
| `tree-seed-heirloom` | `lootRoll ≥ LOOT_GATE_HEIRLOOM` | apple `pink-lady`, apricot `klosterneuburger`, cherry `bing` |
| `fertilizer` | `lootRoll < LOOT_GATE_FERT` | ordinary bag `FERT_BAG_LITERS` |
| `tool` | `lootRoll < LOOT_GATE_TOOL` | `better-shovel` / `better-pickaxe` / `axe`; then used iff `burrow.at(col, row, 3) < 0.5` |
| `weed` | `lootRoll < LOOT_GATE_WEED` | `WEED_LOOT_COUNT` **Pulled weed** |
| `fly-agaric` | `lootRoll ≥ LOOT_GATE_AGARIC` | `AGARIC_LOOT_COUNT` **Fly agaric** |
| `seeds-base` | `lootRoll < LOOT_GATE_BASE` | tomato / raspberry / grape `'base'`, count `SEED_BASE_COUNT` |
| `seeds-variant` | `lootRoll ≥ LOOT_GATE_VARIANT` | tomato `green-zebra`, grape `concord`, count `SEED_VARIANT_COUNT` |
| `seeds-heirloom` | `lootRoll ≥ LOOT_GATE_HEIRLOOM` | tomato `san-marzano`, raspberry `black-raspberry`, grape `keknyelu`, count `SEED_HEIRLOOM_COUNT` |

Five bands, treasure in every one. Fly agaric only in the top one. No cherry in the variant tree-seed pool. No olive in the heirloom tree-seed pool. No raspberry in the variant seeds pool. No vanilla, chilli, or grass in any seed pool. Not rotary. Not diamond. Not starter shovel / pickaxe. Spatial, not seq. [[mechanics/rng]]

## Treasure

`{ kind: 'treasure'; coins }`. `coins` required. Not countable. `compostValue` 0. `furnaceValue` 0. Not a `StallGoodId`. No store, slot, or vehicle takes it, because it never reaches a hand. Consign refused. Treasure lies on the ground and is picked up like anything else: prompt **Pick up**, `{ act: 'pickup'; at }`. `doPickup` adds `coins` to `money` and splices the drop. There is no second click and no `open` intent. The hand is untouched, so a full hand does not block it and `HAND_FULL` never fires on treasure. Coin glyph for the amount. Money, not gold. [[mechanics/inventory]] [[ui/inspect]]

## Fly agaric

`{ kind: 'fly-agaric'; count }`. `Countable`, so it stacks and merges like **Ash**. `compostValue` 0. `furnaceValue` 0. Not a `StallGoodId`. No recipe eats it. `AGARIC_LOOT_COUNT` — preference. Top band only. Art [[art/items]]. Almanac Utility. No machine takes it, the Market does not buy it, and it has no price. Its one use is the Necronomicon `agaric` page — [[mechanics/necronomicon]] `necro.claim`.

## Luck

Derived `min(LUCK_CAP, skillTier('lucky'))`. `LUCK_CAP` — preference. Not a World field. No HUD chip. Luck enters twice: `burrowDayChance` and `lootRoll`. Skill: [[mechanics/family]] `family.lucky`. Almanac Game concepts **Luck** + **Burrow** — [[ui/almanac]].

## Index / module

`World.burrows`: untilled `cover.kind === 'burrow'`. `track()` from `setCell`. `indexAll` on hydrate / rebase. View dirty patches from it. Not a tick walk. `sim/feature-burrow/` owns mint, roll, extract. `defs/burrow.ts` owns the numbers. Save: Cover arm + treasure on Item. Fields added, no migrate. [[architecture/save]] [[architecture/tick]] [[architecture/view]]

## Invariants

`burrow.start` — Chunk `(0,0)` generate mints `BURROW_START_N` with Euclidean `r` from door `> 8` (same `r` as `clearBase`); none on reserved / rock / tree / very-hard; day-1 generate does not also seam-spawn; expand generate mints 0.

`burrow.day` — Seam, after stipend and tax, before field tick: per owned chunk, a `burrowDayChance(luck)` roll, then `+1` on an eligible cell, or skip if none; eligible: owned, untilled, not very-hard, cover bare or grass, not reserved, no drop; grass cover is replaced.

`burrow.day-chance` — `burrowDayChance = BURROW_DAY_CHANCE + luck × BURROW_LUCK_CHANCE`, below 1 at `LUCK_CAP`; rolled per owned chunk per day on `BURROW_DAY_SALT`; a day can pass with no new burrow; `mintStart` does not roll it.

`burrow.block` — Burrow is untilled cover `{ kind: 'burrow'; loot }`, loot required; not solid; walk ok; place / tile / fence / tree-seed refuse.

`burrow.dig` — Shovel extract: work `workSeconds × BURROW_MUL`, not hardness, 1 use, any shovel id, does not till; cover → bare, same `ground` / `hardness`; drop stored item on `nearSite`; prompt **Dig**; pickaxe no-op; inspect does not name loot.

`burrow.loot` — `lootRoll` as `defs/burrow.ts`; eleven rows, filter by gate + non-empty pool, then equal chance; treasure always; second roll uniform in that row's listed pool; quality 0; spatial `burrow.at(col, row, salt)`; stored at spawn.

`burrow.agaric` — `{ kind: 'fly-agaric'; count }`; `Countable`, stacks like Ash; `compostValue` 0, `furnaceValue` 0, no store accepts it; only the top band; its one sink is the Necronomicon `agaric` page — [[mechanics/necronomicon]] `necro.claim`.

`burrow.bands` — Five bands off the gate table; low gates strict `<`, high gates `≥`; treasure in every band; fly agaric only in the top one; no vanilla, chilli, or grass in a seed row.

`burrow.treasure` — `{ kind: 'treasure'; coins }`; not countable, not compost, not furnace, not stall, not silo.

`burrow.open` — `doPickup` adds `coins` to `money` and splices the drop; no `open` intent; treasure never enters a hand.
