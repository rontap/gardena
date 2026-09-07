# Burrow

Untilled cover. Loot is rolled at spawn and stored. Dig drops that item. Luck feeds the loot roll. Treasure is an item you open for money.

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
  | { kind: 'seeds'; crop: 'tomato' | 'raspberry' | 'grape' | 'vanilla'; variety: VarietyId; quality: number; count: number }
  | { kind: 'fertilizer'; liters: number; capacityLiters: number }
  | { kind: 'shovel'; id: 'better-shovel'; usesLeft: number; workSeconds: number }
  | { kind: 'pickaxe'; id: 'better-pickaxe'; usesLeft: number; workSeconds: number }
  | { kind: 'axe'; usesLeft: number; workSeconds: number }
```

`loot` required at spawn. Illegal: optional `loot`. Illegal: burrow as a `Cell` kind. Illegal: fruit / compost / wood / graft / `rotary-shovel` / `diamond-pickaxe` / starter `shovel` / starter `pickaxe` as `loot`. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's crop.

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

After stipend and tax, before field tick, `clock.day` already incremented: `+1` per owned chunk on one eligible cell, or skip if none. Independent per chunk, `owned` order. `burrow.at(cx, cy, clock.day, 0)` maps onto that chunk's eligible list. Empty → skip.

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

| id | gate | pool |
|---|---|---|
| `treasure` | always | coins `round((TREASURE_COINS_BASE + floor(u × TREASURE_COINS_SPAN)) × lootRoll)`, `u = burrow.at(col, row, 3)` |
| `tree-seed-base` | `lootRoll ≤ LOOT_GATE_BASE` | apple / apricot / cherry / olive `'base'` |
| `tree-seed-variant` | `lootRoll ≥ LOOT_GATE_VARIANT` | apple `kingston-black`, apricot `blenheim`, olive `arbequina` |
| `tree-seed-heirloom` | `lootRoll ≥ LOOT_GATE_HEIRLOOM` | apple `pink-lady`, apricot `klosterneuburger`, cherry `bing` |
| `fertilizer` | `lootRoll ≤ LOOT_GATE_FERT` | ordinary bag `FERT_BAG_LITERS` |
| `tool` | `lootRoll ≤ LOOT_GATE_TOOL` | `better-shovel` / `better-pickaxe` / `axe`; then used iff `burrow.at(col, row, 3) < 0.5`: `usesLeft = floor(max / 2)`, else full. `workSeconds` from `SHOVELS` / `PICKAXES` / `AXES` at mint |
| `seeds-base` | `lootRoll ≤ LOOT_GATE_BASE` | tomato / raspberry / grape / vanilla `'base'`, count `SEED_BASE_COUNT` |
| `seeds-variant` | `lootRoll ≥ LOOT_GATE_VARIANT` | tomato `green-zebra`, grape `concord`, count `SEED_VARIANT_COUNT` |
| `seeds-heirloom` | `lootRoll ≥ LOOT_GATE_HEIRLOOM` | tomato `san-marzano`, raspberry `black-raspberry`, grape `keknyelu`, count `SEED_HEIRLOOM_COUNT` |

No cherry in the variant tree-seed pool. No olive in the heirloom tree-seed pool. No raspberry / vanilla in the variant seeds pool (vanilla has no variant). No vanilla in the heirloom seeds pool. Not rotary. Not diamond. Not starter shovel / pickaxe. No research filter.

Treasure skips the pool draw. Tool uses salt 3 for used/full. Spatial, not seq. [[mechanics/rng]]

## Treasure

```
Item += { kind: 'treasure'; coins: number }
Intent += { act: 'open'; at: Coord }
```

`coins` required. Not countable. `compostValue` 0. `furnaceValue` 0. Not a `StallGoodId`. Seed silo / additive store do not take it. House / chest / vehicle slots may. Consign refused.

Hold treasure, click an owned plot: prompt **Open treasure**. `{ act: 'open'; at }`. `dest` = `at`. Work 0. Enqueue, no new `Act` letter. Left-click is open, not drop. Right-click drop unchanged.

Complete: `money += coins`, hand empty. Illegal: open empty hand. Illegal: open a different kind.

Coin glyph for the amount. Money, not gold. [[mechanics/inventory]] [[ui/inspect]]

## Luck

Derived `min(LUCK_CAP, skillTier('lucky'))`. `LUCK_CAP` — preference. Not a World field. No HUD chip.

`PlayerSkillId` += `lucky`. `maxTier` 3. Gate none. `SkillEffect` `{ kind: 'lucky' }`. Player offers. `unlockAllSkills` grants it. [[mechanics/family]] `family.lucky`

Almanac Game concepts **Luck** + **Burrow**. Copy: **Luck is how much money a new burrow's treasure holds, and how often that burrow holds a seed or tree seed of a Variety the shop does not sell as a pack. You raise it by learning Lucky on Family, on You the Gardener, ranks I–III. Each rank raises both compared to a burrow that appeared without Lucky. Luck is set when the burrow appears. A burrow already on the farm stays as it is if you learn Lucky later.** **A burrow is a hole in untilled ground. You need it because digging one drops what it holds: treasure you open for money, or something you can use on the farm. Looking at it does not say which. Dig it with a shovel — the prompt is Dig, the same Dig as a tree or a weed. Digging a burrow does not till the ground. A pickaxe does nothing. You cannot place, pave, fence, or plant a tree on it. You can walk across it. A few sit on the farm when you start. When a day begins, one more can appear on untilled ground in each piece of land you own, if there is room. Grass there is gone. Hold treasure and click a plot you own: Open treasure. That adds the money it holds. The Market does not take treasure.** [[ui/almanac]]

## Index / module

`World.burrows`: untilled `cover.kind === 'burrow'`. `track()` from `setCell`. `indexAll` on hydrate / rebase. View dirty patches from it. Not a tick walk. [[architecture/tick]] [[architecture/view]]

`sim/feature-burrow/` owns mint, roll, extract. `defs/burrow.ts` owns the numbers. `generateChunk` calls start mint for `(0,0)` only. `World.tick` seam calls `mintSeam`. `doShovel` calls extract when cover is burrow.

Save: Cover arm + treasure on Item. Fields added, no migrate. [[architecture/save]]

## Invariants

`burrow.start` — Chunk `(0,0)` generate mints `BURROW_START_N` with Euclidean `r` from door `> 8` (same `r` as `clearBase`). None on reserved / rock / tree / very-hard. Day-1 generate does not also seam-spawn. Expand generate mints 0.

`burrow.day` — Seam, after stipend and tax, before field tick: `+1` per owned chunk on an eligible cell, or skip if none. Eligible: owned, untilled, not very-hard, cover bare or grass, not reserved, no drop. Grass cover is replaced.

`burrow.block` — Burrow is untilled cover `{ kind: 'burrow'; loot }`, loot required. Not solid. Walk ok. Place / tile / fence / tree-seed refuse.

`burrow.dig` — Shovel extract: work `workSeconds × BURROW_MUL`, not hardness, 1 use, any shovel id, does not till. Cover → bare, same `ground` / `hardness`. Drop stored item on the cell. Prompt **Dig**. Pickaxe no-op. Inspect does not name loot.

`burrow.loot` — `lootRoll` as `defs/burrow.ts`. Nine rows, filter by gate + non-empty pool, then equal chance. Treasure always. Second roll uniform in that row's listed pool. Quality 0. Spatial `burrow.at(col, row, salt)`. Stored at spawn.

`burrow.open` — `{ kind: 'treasure'; coins }`. Not countable, not compost, not furnace, not stall, not silo. `{ act: 'open'; at }` via `Act.enqueue`, work 0: `money += coins`, hand empty.

Assumption: site pick without replacement, eligible sorted `(row, col)`; start `day = 1`; seam `k = 0` after `clock.day` increments; loot salts 0 lootRoll `u`, 1 row, 2 pool, 3 coins or tool used; no research filter on rows; seam does not test fence; left-click held treasure on a plot is open, not drop.
