# Burrow

Untilled cover. Loot is rolled at spawn and stored. Dig drops that item. Luck feeds both the day chance and the loot roll. Treasure is an item you open for money.

Owner: `defs/burrow.ts`, `sim/feature-burrow/`. Cover on `sim/plot.ts`. Treasure on `sim/item.ts`. Index `World.burrows` via `track()`. `World` does not own loot. Not a `World.luck` field. Generate of `(0,0)` calls in; expand generate does not. Seam calls in. Shovel complete calls in. [[architecture/modules]] [[architecture/world]]

Vault terms this note owns: **burrow**, **loot roll**, **luck**, **treasure**.

## Cover

```
Cover =
  | { kind: 'bare' }
  | { kind: 'grass'; variant: 0 | 1 | 2 }
  | { kind: 'tile'; tile: TileId }
  | { kind: 'burrow'; loot: LootItem }

LootItem =
  | { kind: 'treasure'; coins: number }
  | { kind: 'tree-seed'; tree: TreeId; variety: VarietyId; quality: number }
  | { kind: 'seeds'; crop: 'tomato' | 'raspberry' | 'grape'; variety: VarietyId; quality: number; count: number }
  | { kind: 'fertilizer'; liters: number; capacityLiters: number }
  | { kind: 'weed'; count: number }
  | { kind: 'fly-agaric'; count: number }
  | { kind: 'shovel'; id: 'better-shovel'; usesLeft: number; workSeconds: number }
  | { kind: 'pickaxe'; id: 'better-pickaxe'; usesLeft: number; workSeconds: number }
  | { kind: 'axe'; usesLeft: number; workSeconds: number }
```

`loot` required at spawn. Illegal: optional `loot`. Illegal: burrow as a `Cell` kind. Illegal: fruit / compost / wood / graft / `rotary-shovel` / `diamond-pickaxe` / starter `shovel` / starter `pickaxe` as `loot`. Illegal: `vanilla`, `chilli`, or `grass` as a burrow seed crop — the seed rows are annuals a shelf pack already covers, and the three that are not go through the [[ui/store]] Seed silo. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's crop.

Not solid. Walk ok. `isSolid` false. Plot. Same `ground` / `hardness` as the untilled cell.

Place / tile / fence / tree-seed refuse. `placeSolidOk` refuses `cover.kind === 'burrow'`. `isTileSite` stays bare or tile. `isFenceSite` is untilled and not burrow. Tree seed still needs both cells untilled, `ground === 'soft'`, cover bare or grass. [[ui/place]] [[mechanics/plants]]

Empty hand: walk. Drop on the plot is legal. Seam will not mint onto a cell that already has a drop.

## Dig

Held shovel, any `ShovelId` including `rotary-shovel`. `{ act: 'shovel'; at }`. Prompt **Dig**.

Work `workSeconds × BURROW_MUL` — derived. `BURROW_MUL` — preference. Not hardness. Not `DIG_HARD_SPAN`. 1 use, including on hard. Does not till.

Complete: `usesLeft -= 1` (0 → hand empty), cover → `{ kind: 'bare' }`, same `ground` / `hardness`, `drops.push({ at, item: loot })`. Grass that the burrow replaced is gone.

Pickaxe: no-op. Not mine. Not extract. Prompt stays the look line.

Inspect does not name loot. [[ui/inspect]]

## Start

Chunk `(0,0)` generate mints `BURROW_START_N` — preference. Euclidean `r` from door, cell center to door center, same `r` as `clearBase` (`> 8`). None on reserved / rock / tree / very-hard.

Day-1 generate does not also seam-spawn. Expand generate mints 0.

Site pick: spatial `burrow.at(cx, cy, day, k)`. Start: `(0, 0, 1, k)` for `k = 0 .. BURROW_START_N-1`. Eligible of that chunk, sorted `(row, col)`, without replacement: `floor(u * remaining)`. Fewer eligible than `BURROW_START_N`: mint that many.

## Seam

After stipend and tax, before field tick, `clock.day` already incremented: per owned chunk, roll `burrow.at(cx, cy, clock.day, BURROW_DAY_SALT)` against `burrowDayChance(luck)` and skip the chunk on a miss; on a hit, `+1` on one eligible cell, or skip if none. Independent per chunk, `owned` order. `burrow.at(cx, cy, clock.day, 0)` maps onto that chunk's eligible list. Empty → skip.

```
burrowDayChance = BURROW_DAY_CHANCE + luck × BURROW_LUCK_CHANCE
```

A day can pass with nothing new. `BURROW_DAY_SALT` sits clear of the site-pick `k`, which never exceeds `BURROW_START_N`, so the two draws on one chunk-day cannot collide. Start does not roll it: `mintStart` always mints `BURROW_START_N`.

Eligible: owned, untilled, not very-hard, cover bare or grass, not reserved, no drop. Grass cover is replaced. Existing burrow / tile / tilled: not eligible. Fence is not a Cover; seam does not test it.

`mintSeam` lives in `sim/feature-burrow/`. `World.tick` only calls. Ping is the seam ping. [[mechanics/day]]

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

May exceed `LOOT_GATE_HEIRLOOM`. Not clamped. `r` is Euclidean from door, same as start. `day` is `clock.day` at spawn. `u` is `burrow.at(col, row, 0)`. Identifiers in `defs/burrow.ts` — preference.

Nine rows. Keep a row iff its gate holds and its pool is non-empty. Then equal chance: `floor(burrow.at(col, row, 1) * n)` on the kept list in table order. Treasure always (gate is always). Second roll uniform in that row's listed pool: `floor(burrow.at(col, row, 2) * pool.length)`. Quality 0.

Eleven rows. Low gates are strict `<`, high gates `≥`, so the bands are disjoint and `LOOT_GATE_BASE` and `LOOT_GATE_HEIRLOOM` at the same value hand the roll from the base rows to the heirloom rows with no overlap.

| id | gate | pool |
|---|---|---|
| `treasure` | always | coins `round((TREASURE_COINS_BASE + floor(u × TREASURE_COINS_SPAN)) × lootRoll)`, `u = burrow.at(col, row, 3)` |
| `tree-seed-base` | `lootRoll < LOOT_GATE_BASE` | apple / apricot / cherry / olive `'base'` |
| `tree-seed-variant` | `lootRoll ≥ LOOT_GATE_VARIANT` | apple `kingston-black`, apricot `blenheim`, olive `arbequina` |
| `tree-seed-heirloom` | `lootRoll ≥ LOOT_GATE_HEIRLOOM` | apple `pink-lady`, apricot `klosterneuburger`, cherry `bing` |
| `fertilizer` | `lootRoll < LOOT_GATE_FERT` | ordinary bag `FERT_BAG_LITERS` |
| `tool` | `lootRoll < LOOT_GATE_TOOL` | `better-shovel` / `better-pickaxe` / `axe`; then used iff `burrow.at(col, row, 3) < 0.5`: `usesLeft = floor(max / 2)`, else full. `workSeconds` from `SHOVELS` / `PICKAXES` / `AXES` at mint |
| `weed` | `lootRoll < LOOT_GATE_WEED` | `WEED_LOOT_COUNT` **Pulled weed**. Compost feed, nothing else |
| `fly-agaric` | `lootRoll ≥ LOOT_GATE_AGARIC` | `AGARIC_LOOT_COUNT` **Fly agaric** — [[#Fly agaric]] |
| `seeds-base` | `lootRoll < LOOT_GATE_BASE` | tomato / raspberry / grape `'base'`, count `SEED_BASE_COUNT` |
| `seeds-variant` | `lootRoll ≥ LOOT_GATE_VARIANT` | tomato `green-zebra`, grape `concord`, count `SEED_VARIANT_COUNT` |
| `seeds-heirloom` | `lootRoll ≥ LOOT_GATE_HEIRLOOM` | tomato `san-marzano`, raspberry `black-raspberry`, grape `keknyelu`, count `SEED_HEIRLOOM_COUNT` |

Resulting bands, treasure in every one:

| `lootRoll` | rows |
|---|---|
| below `LOOT_GATE_WEED` | treasure, tree-seed-base, seeds-base, fertilizer, tool, weed |
| to `LOOT_GATE_TOOL` | treasure, tree-seed-base, seeds-base, tool |
| to `LOOT_GATE_VARIANT` | treasure, tree-seed-base, seeds-base |
| to `LOOT_GATE_BASE` | treasure, tree-seed-base, seeds-base, tree-seed-variant, seeds-variant |
| from `LOOT_GATE_HEIRLOOM` | treasure, tree-seed-variant, tree-seed-heirloom, seeds-variant, seeds-heirloom, fly-agaric |

No cherry in the variant tree-seed pool. No olive in the heirloom tree-seed pool. No raspberry in the variant seeds pool. No vanilla, chilli, or grass in any seed pool. Not rotary. Not diamond. Not starter shovel / pickaxe. No research filter.

Treasure skips the pool draw. Tool uses salt 3 for used/full. Spatial, not seq. [[mechanics/rng]]

## Treasure

```
Item += { kind: 'treasure'; coins: number }
```

`coins` required. Not countable. `compostValue` 0. `furnaceValue` 0. Not a `StallGoodId`. No store, slot, or vehicle takes it, because it never reaches a hand. Consign refused.

Treasure lies on the ground and is picked up like anything else: prompt **Pick up**, `{ act: 'pickup'; at }`. `doPickup` adds `coins` to `money` and splices the drop. There is no second click and no `open` intent.

The hand is untouched, so a full hand does not block it and `HAND_FULL` never fires on treasure.

Coin glyph for the amount. Money, not gold. [[mechanics/inventory]] [[ui/inspect]]

## Fly agaric

```
Item += { kind: 'fly-agaric'; count: number }
```

`Countable`, so it stacks and merges like **Ash**. `compostValue` 0. `furnaceValue` 0. Not a `StallGoodId`. No recipe eats it. It is a burrow drop that sits in a chest.

`AGARIC_LOOT_COUNT` — preference. Top band only, so the first one arrives late. Art `item-fly-agaric.svg`, cap `fruit-red` over `roof`, spots and stem `house` over `slab`, ink outline — [[art/palette]] [[art/items]]. Almanac Utility.

It does nothing yet. Do not give it a use, a price, or a recipe without a note that owns the use.

## Luck

Derived `min(LUCK_CAP, skillTier('lucky'))`. `LUCK_CAP` — preference. Not a World field. No HUD chip. `lucky` `maxTier` is below `LUCK_CAP`, so the clamp does not bind today; the cap is the ceiling the roll is designed against, not the tier table. Luck enters twice: `burrowDayChance` and `lootRoll`.

`PlayerSkillId` += `lucky`. `maxTier` 3. Gate none. `SkillEffect` `{ kind: 'lucky' }`. Player offers. `unlockAllSkills` grants it. [[mechanics/family]] `family.lucky`

Almanac Game concepts **Luck** + **Burrow**. Copy: **Luck is how much money a new burrow's treasure holds, and how often that burrow holds a seed or tree seed of a Variety no shelf sells as a pack. You raise it by learning Lucky on Family, on You the Gardener, ranks I–III. Each rank raises both compared to a burrow that appeared without Lucky. Luck is set when the burrow appears. A burrow already on the farm stays as it is if you learn Lucky later.** **A burrow is a hole in untilled ground. You need it because digging one drops what it holds: treasure you open for money, or something you can use on the farm. Looking at it does not say which. Dig it with a shovel — the prompt is Dig, the same Dig as a tree or a weed. Digging a burrow does not till the ground. A pickaxe does nothing. You cannot place, pave, fence, or plant a tree on it. You can walk across it. A few sit on the farm when you start. When a day begins, one more can appear on untilled ground in each piece of land you own, if there is room. Grass there is gone. Picking up treasure adds the money it holds. The Market does not take treasure.** [[ui/almanac]]

## Index / module

`World.burrows`: untilled `cover.kind === 'burrow'`. `track()` from `setCell`. `indexAll` on hydrate / rebase. View dirty patches from it. Not a tick walk. [[architecture/tick]] [[architecture/view]]

`sim/feature-burrow/` owns mint, roll, extract. `defs/burrow.ts` owns the numbers. `generateChunk` calls start mint for `(0,0)` only. `World.tick` seam calls `mintSeam`. `doShovel` calls extract when cover is burrow.

Save: Cover arm + treasure on Item. Fields added, no migrate. [[architecture/save]]

## Invariants

`burrow.start` — Chunk `(0,0)` generate mints `BURROW_START_N` with Euclidean `r` from door `> 8` (same `r` as `clearBase`). None on reserved / rock / tree / very-hard. Day-1 generate does not also seam-spawn. Expand generate mints 0.

`burrow.day` — Seam, after stipend and tax, before field tick: per owned chunk, a `burrowDayChance(luck)` roll, then `+1` on an eligible cell, or skip if none. Eligible: owned, untilled, not very-hard, cover bare or grass, not reserved, no drop. Grass cover is replaced.

`burrow.day-chance` — `burrowDayChance = BURROW_DAY_CHANCE + luck × BURROW_LUCK_CHANCE`, below 1 at `LUCK_CAP`. Rolled per owned chunk per day on `BURROW_DAY_SALT`. A day can pass with no new burrow. `mintStart` does not roll it.

`burrow.block` — Burrow is untilled cover `{ kind: 'burrow'; loot }`, loot required. Not solid. Walk ok. Place / tile / fence / tree-seed refuse.

`burrow.dig` — Shovel extract: work `workSeconds × BURROW_MUL`, not hardness, 1 use, any shovel id, does not till. Cover → bare, same `ground` / `hardness`. Drop stored item on `nearSite(w, at)` — the first of S, W, E, N that is `inWorld` and `isPlot`, else the dug cell. Prompt **Dig**. Pickaxe no-op. Inspect does not name loot.

`burrow.loot` — `lootRoll` as `defs/burrow.ts`. Eleven rows, filter by gate + non-empty pool, then equal chance. Treasure always. Second roll uniform in that row's listed pool. Quality 0. Spatial `burrow.at(col, row, salt)`. Stored at spawn.

`burrow.agaric` — `{ kind: 'fly-agaric'; count }`. `Countable`, stacks like Ash. `compostValue` 0, `furnaceValue` 0, no store accepts it. Only the top band. Name, Almanac Utility entry, and `item-fly-agaric.svg` exist. No use yet.

`burrow.bands` — Five bands off the gate table. Low gates strict `<`, high gates `≥`. Treasure in every band. Fly agaric only in the top one. No vanilla, chilli, or grass in a seed row.

`burrow.treasure` — `{ kind: 'treasure'; coins }`. Not countable, not compost, not furnace, not stall, not silo. Never enters a hand: `doPickup` adds `coins` to `money` and removes the drop. No `open` intent.

Assumption: site pick without replacement, eligible sorted `(row, col)`; start `day = 1`; seam `k = 0` after `clock.day` increments; loot salts 0 lootRoll `u`, 1 row, 2 pool, 3 coins or tool used; no research filter on rows; seam does not test fence; left-click held treasure on a plot is open, not drop.
