# Contracts

Daily buyer board, generator, accept / deliver / complete / miss / cancel / reorder. Types `src/game/sim/market.h.ts`. Spec [[plans/1.8.0]] Part 2. Stall [[mechanics/market]]. Sat [[mechanics/saturation]]. Family [[mechanics/family]]. Stream [[architecture/rng]]. Research [[mechanics/research]]. MP [[architecture/net]]. Numbers preference unless marked.

`World.contracts` is saved from 1.8.0: `active` with bin fills, `takenToday`, `history`, `book`. `rep` and `repDay` stay on the top-level record where they always were. The board itself is derived, never saved and never digested. Digest includes active fill, `takenToday`, every `StallGood.sat`. `SAVE_VERSION` / `PROTOCOL` / wordmark are 1.8 / 1.8 / 1.8.0.

## Files

| file | owns |
|---|---|
| `src/game/sim/market.h.ts` | typedef only. `ContractId` `ContractOffer` `Demand` `Lines` `Active` `Bin` `Contracts` `RollBoard` `Accepts` `CancelFee` `MissPenalty` `CleanUnit` `CompanyId` `GoodClass`. Every constant `declare const` |
| `src/game/defs/companies.ts` | `COMPANIES` book. `COMPANY_PRIZES` + `prizeBandOf` + `PRIZE_BAND_MIN` |
| `src/game/sim/market.ts` | valued constants + `rollBoard` + `rollBoardAtD` + `load` + `cleanUnit` + `Accepts` + `cancelFee` + `missPenalty`. No `World` |
| `src/game/sim/world.ts` | `World.contracts`, accept / cancel / reorder, consign fill, miss tick, `payPrize`, `DayTally.contracts` |
| `src/game/sim/save.ts` | `SaveContracts`, `dumpContracts` / `liveContracts` / `readContracts` and the `Prize` / `Demand` / `Offer` / `Outcome` readers |
| `src/game/ui/market.tsx` | `OfferCard`, `PrizeChip`, `prizeName`, `OutcomePay` |
| `src/game/ui/debug-contracts.tsx` | `#debug-contracts` ladder |
| `src/game/sim/log.ts` | `Act.acceptContract` `cancelContract` `reorderContract` |
| `src/game/sim/mp.ts` | guest drop those three; digest sat + active + `takenToday` |
| `src/game/sim/rng.ts` | `SpatialId` `'contract'` |
| `src/game/sim/ids.ts` | `ResearchId` `unlock-contracts`; `HusbandSkillId` `haggling`; `DaughterSkillId` `broker` |
| `src/game/defs/research.ts` | `RESEARCH['unlock-contracts']` |
| `src/game/defs/skills.ts` | `haggling` `broker` `industrial` |
| `src/game/sim/stall.ts` | `stallX` `stallRarity` — clean crop unit uses crop sale with empty mods |

Do not create `src/` here.

## Board

`CONTRACT_OFFERS` 6. `CONTRACT_SLOT_MAX` 8 from day one. `ContractId = day * CONTRACT_SLOT_MAX + slot`. `day` is `clock.day`.

Board size = `CONTRACT_OFFERS +` broker offered bonus. Offered bonus is `+1` at `broker` tier ≥ 1. Tier 2 does not add a second card. Published slots `0..size-1`. Slot `7` unused. `SLOT_BANDS` stays length 8.

Pure function of `(seed, day, slot)` on `SpatialId` `'contract'`. Reads no player state — not inventory, plantings, research, money, `clock.t`, not `broker`. Caller passes `slots`. Not a `Cmd`. Not in `World.log`. Not stored. Regenerating is free.

Visible iff `unlock-contracts` is in `done`. Tab gating is UI. Generation does not read `done`.

Unaccepted offers vanish at the next seam. Accepting writes `takenToday`; that id is not on today's board. `takenToday` clears at the seam. Active contracts persist across the seam.

At most `CONTRACT_ACTIVE +` broker active bonus accepted. Active bonus is `+1` at `broker` tier ≥ 2. Cap 3, or 4 at T2.

## rollBoard

`market.ts` owns `rollBoard(rng, day, slots, rep) → readonly ContractOffer[]`. Each slot `i` uses `rng.stream('contract').at(day, i, k)`.

`rollBoardAtD(rng, D, slots)` is the debug ladder: it forces `D` on every slot and scales amounts at `LADDER_DAY` 24. `#debug-contracts` only — [[ui/contracts]].

### `contract` — `at(day, slot, k)`

| k | roll |
|---|---|
| 0 | `D` for that slot |
| 2 | line 1 good |
| 3 | line 1 group vs specific (jam / spirit only) |
| 4 | line 1 `minRarity` (rated / spirit-group only) |
| 5 | `DeadlineBand` |
| 6 | `days` inside `DEADLINE_DAYS[band]` on the `DEADLINE_STEP` grid |
| 7 | line 2 good (pair only) |
| 8 | line 2 group vs specific |
| 9 | line 2 `minRarity` |
| `20+i` | company shuffle, at `(day, 0, ·)` |
| 30, 31 | the two prize slots, at `(day, 0, ·)` |
| 32 | rotary vs diamond, when the prize is a tool |

`k` 1 is unused: company no longer depends on `D`. Amount is derived, not rolled. Pair is taken iff the grammar budget covers `PAIR_COST` — not a coin flip.

Company is cosmetic. `shuffled()` Fisher-Yates shuffles `COMPANY_IDS` per day and deals one per slot. It does not steer goods, rarity or difficulty. It **does** decide the prize, because the prize table is keyed by company.

### Difficulty

```
cap    = min(DIFFICULTY_START + DIFFICULTY_PER_DAY * day, DIFFICULTY_MAX)   // 8 + 0.8d, cap 40
f      = cap / DIFFICULTY_MAX
[l, h] = round(SLOT_BANDS[slot] * f)
D      = l + floor(u * (h - l + 1)) + rep                                   // clamp DIFFICULTY_CEILING 60
```

`rep` is `contracts.repDay`, the reputation snapshot taken at the seam, not live rep. Mid-day rep does not move the board.

Then the shape of the lines bumps it: `eff = clamp(D + shapeD(line1) + shapeD(line2), 0, DIFFICULTY_CEILING)`, where `shapeD` is `D_STARTER` −1 for carrot / potato / wheat plus `D_RARITY[minRarity]` (`common` 0, `uncommon` 0, `rare` 1, `heirloom` 3). `offer.difficulty` is `eff`, and `stars` is the highest `Stars` with `eff >= STAR_MIN[stars]`.

`eff` is what the prize band reads. Not `D`.

### Grammar budget

Two budgets, spent independently. The **grammar** budget buys shape; the **money** pool buys size.

```
opened = MIX_FLOOR + D * MIX_SHARE - DEADLINE_COST[band]     // 2 + 0.5D - band
budget = max(opened, -BUDGET_OVERDRAFT)
pair   = budget >= PAIR_COST                                 // then budget = (budget - PAIR_COST) / 2
```

Each line then spends `GOOD_COST[good]` and, for a rated or spirit-group line, `RARITY_COST[minRarity]`. Candidates are filtered to `GOOD_TIER[good] <= stars` and cost within `budget + BUDGET_OVERDRAFT`. A jam or spirit good may go group for `GROUP_COST` (−4) if `GROUP_TIER` allows at that star. Line 2 may not share a family with line 1.

`GOOD_COST` carries crop tier; low-`D` slots cannot afford vanilla. No player state is read.

Jam specific → `plain` `JamId`. Jam group → `{ kind: 'group'; group: 'jam' }`. Crop / wine / spirit specific → `rated`. Sugar / oil / flour / extract → `plain`. Spirit group → `{ kind: 'group'; group: 'spirit'; minRarity }`. Sugar and extract are never demanded (`CONTRACT_GOODS` excludes them).

### Money pool and amount

```
load(D) = LOAD_MIN + (LOAD_MAX - LOAD_MIN) * ((D + LOAD_D_OFFSET) / (DIFFICULTY_CEILING + LOAD_D_OFFSET)) ** LOAD_CURVE
solo    = REFERENCE_GOLD_PER_DAY * days * load(D)
target  = pair ? solo / 2 : solo
amount  = nice(min(target / cleanUnit(demand), FEASIBLE_PER_DAY[good] * days * scale(day)))
scale(day) = min(1, SCALE_START + day / SCALE_DAYS)
```

`load(D)` is the share of a mature farm-day the contract eats. `REFERENCE_GOLD_PER_DAY` is the median `unitOf(g) * FEASIBLE_PER_DAY[g]` over `CONTRACT_GOODS` — derived, not a preference.

`LOAD_CURVE` 2 and `LOAD_MAX` 1.35 — preference, 1.8.0. The curve is convex on purpose: the pool must climb harder over the top half of the ladder than the bottom, so a four-star board is worth giving up a prize slot for. Roughly `×1.8` from D 8 to D 20, `×2.3` from D 20 to D 40.

Divide by `cleanUnit`, the rarity-scaled unit the reward is later settled at — **not** `unitOf`, the common-rarity base. Sizing against common prices and paying at heirloom ones was a 1.8.0 bugfix; before it, two contracts of the same `D` could differ tenfold.

`nice()` snaps down to the largest `NICE_AMOUNTS[i] <= x`, floor `NICE_AMOUNTS[0]` 2. There is no discard-and-retry. Group jam uses `jam-cherry` as the feasible key; group spirit uses `vodka`.

### Deadline

```
[lo, hi] = DEADLINE_DAYS[band]        // tight [1,2]  normal [2,3]  long [3,4]
steps    = (hi - lo) / DEADLINE_STEP + 1
days     = lo + DEADLINE_STEP * floor(u * steps)
```

`DEADLINE_STEP` 0.5, so each band offers three lengths, halves included. 1.8.0 — `long` used to be 4-5 days with whole-day steps. `nowDay` is fractional already, so a 1.5-day deadline needs nothing special.

Band feeds three things: `days`, the grammar deduction `DEADLINE_COST[band]`, and `MARKUP_BAND[band]`. `DEADLINE_WEIGHT` is `tight` 2, `normal` 5, `long` 2.

### Reward

```
markup  = round2(MARKUP_BASE + MARKUP_PER_DIFFICULTY * eff + MARKUP_BAND[band])
clean   = round(sum over lines of amount * cleanUnit(demand))
reward  = round(clean * (1 + markup))
penalty = round(PENALTY_RATE * clean)
```

Baked at generation. Saturation at delivery does not move `reward`. `industrial` multiplies at complete, not here.

`reward` is published on every offer, prize or not. A prize offer never pays it — but the fertilizer prize is priced against it, and `penalty` derives from `clean`, so miss and cancel math is identical either way.

## Prizes

1.8.0. Two of the six offers each day pay goods instead of money, and pay **no** money.

The board is the only source of tree saplings past the starting three, of vanilla seeds, of the large freezer, of the rotary shovel and the diamond pickaxe, and of expansion permits past the third. Money buys capability; it does not buy these.

```
Prize =
  | { kind: 'cash' }
  | { kind: 'sapling'; tree: TreeId }
  | { kind: 'seeds'; crop: 'vanilla'; count }
  | { kind: 'fertilizer' }
  | { kind: 'freezer' }
  | { kind: 'expansion-slot' }
  | { kind: 'skill-points'; n }
  | { kind: 'tool'; tool: 'rotary-shovel' | 'diamond-pickaxe' }
```

### Which slots

`prizeSlots(stream, day)` draws a distinct pair from `[0, CONTRACT_OFFERS)` off `k` 30 and 31 — `b >= a ? b + 1 : b`, the standard distinct-second draw.

Drawn from the base six, **never** from the live slot count. `broker` grows the board and must not reshuffle the offers already on it, so broker slots are always cash. Exactly two prizes on a six-slot board, still exactly two on eight.

### Which prize

`COMPANY_PRIZES[company][prizeBandOf(offer.difficulty)]` in `defs/companies.ts`. Fixed per company — only *which* slots pay a prize is rolled. Bands `[0,8) [8,20) [20,30) [30,∞)` off `PRIZE_BAND_MIN`, read against final `eff`.

Six firms, three columns:

| band | Whole Cart / Little Lid | Trade Jo / Mercanova | Halbert Eijn / Intercrop |
|---|---|---|---|
| 0-8 | cherry sapling | apple sapling | fertilizer |
| 8-20 | apricot sapling | olive sapling | 1 skill point |
| 20-30 | vanilla seeds `VANILLA_PRIZE_SEEDS` 5 | large freezer | 2 skill points |
| 30- | rotary shovel or diamond pickaxe | expansion permit | 3 skill points |

The tool arm in the table is a template; `prizeFor` rolls the actual tool per offer off `k` 32. Every other arm is returned as written.

Columns preference. Band edges preference.

### Payout

`World.payPrize` in `world.ts`, from `resolveDone`. Only `cash` touches `money`.

| prize | lands as |
|---|---|
| `sapling` | drop at `DOOR` |
| `tool` | drop at `DOOR`, full `SHOVELS` / `PICKAXES` uses |
| `seeds` | `putSilo('vanilla', 'common', count)` |
| `fertilizer` | `putAdditive('fertilizer', bags * FERT_BAG_LITERS)`, `bags = max(1, round(reward / SKUS['buy-fertilizer'].price))` — "worth the cash" |
| `freezer` | `prizeFreezers += 1`; `buy-freezer-large` opens while stock lasts — [[mechanics/research]] |
| `expansion-slot` | `prizeSlots += 1` — [[mechanics/expansion]] |
| `skill-points` | `grantPoints(n)` into the shared bank — [[mechanics/family]] |

Drops at the door, the way a shovelled-up sapling drops. Store prizes clamp to free space; overflow is lost, same as any other put.

## cleanUnit

| demand | unit |
|---|---|
| `rated` crop | `CROPS[good].sale × raritySale` at `minRarity` |
| `rated` wine | `WINE_SALE × SPIRIT_RARITY[minRarity]` — no age |
| `rated` spirit | `bakeSpiritSale(good, minRarity)` |
| `plain` sugar | `SUGAR_MILL` |
| `plain` jam | `JAM_SALE[crop]` |
| `plain` oil / flour / extract | `OIL` / `FLOUR` / `EXTRACT` |
| group jam | `min JAM_SALE` (`cherry`) |
| group spirit | `bakeSpiritSale('vodka', minRarity)` |

No skills, freshness, or bio.

## Accepts

```
Accepts(demand, good, rarity) → boolean
```

| demand | accepts |
|---|---|
| `rated` | `good === demand.good` and `RARITY_RANK[rarity] >= RARITY_RANK[minRarity]` |
| `plain` | `good === demand.good` |
| group jam | `good` is `JamId` |
| group spirit | `good` is `SpiritKind` and rarity ≥ `minRarity` |

Rarity is a minimum. Higher qualifies as one unit. No overage bonus. Freshness is not in `Accepts` — consign skips freshness-0 fruit before this test.

## State

```
World.contracts: Contracts = { active, takenToday, history, book, rep, repDay }
```

New farm → empty. Load restores what was saved, including part-filled bins. 1.8.0 — before that a reload dropped every running contract, which stopped mattering the moment the board became the only route to a sapling. `book` is a complete `CompanyId` → `{ done: 0, missed: 0 }`. `history` ring `CONTRACT_HISTORY_MAX` 24.

```
nowDay = (clock.day - 1) + clock.t / DAY_SECONDS
```

Deadline runs from acceptance, not publication.

## Accept

`Act.acceptContract` `'J'` `{ c: ContractId }`.

Legal iff `unlock-contracts` done, `active.length < CONTRACT_ACTIVE +` broker active bonus, the id is on today's board (`rollBoard` at current `slots`, not in `takenToday`). Else no-op.

Creates `Active` with `dueDay = nowDay + offer.days` and one `Bin` per line at `filled: 0`. Pushes `offer.id` onto `takenToday`.

## Deliver

Existing consign at the truck. Logged as `enqueue`. `consignBody` fills `contracts.active` in array order, then the stall remainder.

`Act.reorderContract` `'Z'` `{ c: ContractId; d: 1 | -1 }` swaps that entry with its neighbour. `d = 1` toward the end. No-op at ends or unknown id. Fill priority **is** array order. No lookahead.

A bin takes a unit iff `Accepts` and `filled < amount`. Freshness-0 fruit does not count; it passes through to the stall. A full bin passes through. Contract-bound units do not enter `StallGood.worth` and do not raise `sat`. Sugar fills in liters. Fruit / jam / spirit / wine / oil / flour / extract fill in count.

No silo filler. No cheapest-qualifying-rarity picker.

## Complete

Every bin `filled === amount` → immediate on that delivering tick. `book[company].done += 1`. History `{ kind: 'done'; paid; prize }`. Slot freed. Those units never hit the stall.

Cash offer: `money += offer.reward * (1 + 0.03 * industrialTier)` at the current daughter `industrial` tier (0 if absent), and `paid` is that number.

Prize offer: `payPrize(prize, offer.reward)` and `paid` is 0. No money moves, so `industrial` does not apply.

## Miss

On the tick `nowDay` crosses `dueDay`, if not complete:

```
sold    = delivered units sold at the current saturated market rate
penalty = offer.penalty * max(PENALTY_FLOOR, 1 - filled / need)
```

`need` = sum of line amounts. `filled` = sum of `bin.filled`. `filled === need` is completion, never a miss.

Remainders consign into stall (stock + worth) and raise `sat` by that clean `V / SAT_DEPTH`. `money += sold - penalty`. `sold` is those units at the current saturated rate. `book[company].missed += 1`. History `{ kind: 'missed'; sold; penalty }`. Slot freed.

## Cancel

`Act.cancelContract` `'Y'` `{ c: ContractId }`. Legal while that id is `active`. Else no-op.

```
elapsed = nowDay - (dueDay - offer.days)
fee     = lerp(CANCEL_MIN * clean, missPenalty(active), clamp(elapsed / offer.days, 0, 1))
```

At `elapsed = 0`: `CANCEL_MIN * clean`. At `elapsed = days`: the miss penalty at that fill. Delivered units consign + raise `sat` as in Miss. `money += sold - fee`. Not a miss: `book` untouched. History `{ kind: 'cancelled'; sold; fee }`. Slot freed.

## Recap

`DayTally.contracts: HistoryEntry[]`. Complete / miss / cancel push here and onto `history`. Seam copies tally into `Recap.contracts`, then tally resets (`contracts: []`). Recap shows those outcomes and that a new board is up (`rollBoard` for the new `clock.day`). `takenToday` clears at the seam. Dump omits `tally.contracts` and `Recap.contracts`. Parse hydrates `[]`.

## CompanyId

```
CompanyId =
  | 'whole-cart'
  | 'trade-jo'
  | 'halbert-eijn'
  | 'little-lid'
  | 'mercanova'
  | 'intercrop'
```

Header `CompanyId` is this union. Illegal: any other string.

```
FruitAnnualId = 'tomato' | 'raspberry' | 'watermelon' | 'olive' | 'grape' | 'vanilla'
GoodClass = CropId | JamId | 'sugar' | 'flour' | 'oil' | 'wine'
```

`GoodClass` covers every pool member. Not `CropClass`. Fruit annuals are that set, not root/grain, not `sugar-cane`. Trees are `TreeId`. `JamId` as live. `SpiritKind` is not in any pool.

## Book

`defs/companies.ts` owns `COMPANIES: { readonly [K in CompanyId]: Company }` and `COMPANY_PRIZES`. Both complete maps.

```
Company = {
  id: CompanyId
  name: string
  riff: string
  region: 'US' | 'NL' | 'DE' | 'ES' | 'HU'
}
```

No `mix`, no `pool`, no `eligible`. Those went with the 994819b generator rewrite: the generator reads no company field at all when picking goods, rarity or difficulty. Sector = `region`. No standing drift.

| id | name | riff | region | prize column |
|---|---|---|---|---|
| `whole-cart` | Whole Cart | Walmart | US | saplings, vanilla, late tools |
| `trade-jo` | Trade Jo | Trader Joe's | US | buildings and land |
| `halbert-eijn` | Halbert Eijn | Albert Heijn | NL | household |
| `little-lid` | Little Lid | Lidl | DE | saplings, vanilla, late tools |
| `mercanova` | Mercanova | Mercadona | ES | buildings and land |
| `intercrop` | Intercrop | Interspar HU | HU | household |

Six firms share three columns; 4-6 duplicate 1-3. Full table under Prizes.

## Research

`unlock-contracts`. Tree `utilities`. `reveal: 'start'`. `effect: { kind: 'feature' }`. `$8` / `30s`. Name **Contracts**. Blurb **The stall can take orders from buyers.** `gate: { kind: 'none' }`.

## Skills

Husband `haggling` — was `contracts`. Utility and automation `skuPrice − $tier`, min $1. Hangar-buys still not `skuPrice`. `SkillEffect { kind: 'haggling' }`. Max 3.

Daughter `broker` max `BROKER_MAX_TIER` 2. Gate research `unlock-contracts`. T1 `+1` offered. T2 `+1` offered and `+1` active. `SkillEffect { kind: 'broker' }`. Mid-day pick grows the board; slots `0..5` unchanged.

Daughter `industrial` is live. Complete pays `offer.reward * (1 + 0.03 * tier)` at complete time, current tier. Max 3. `SkillEffect { kind: 'industrial' }`. Miss and cancel do not take it.

## Multiplayer

Host only: `acceptContract` `cancelContract` `reorderContract`. Guest those cmds are dropped by the sequencer, never enter a bundle. Guest consign still fills bins.

## Constants

Valued in `market.ts`. Header stays `declare const`.

| id | value | |
|---|---|---|
| `CONTRACT_OFFERS` | 6 | preference |
| `CONTRACT_ACTIVE` | 3 | preference |
| `CONTRACT_SLOT_MAX` | 8 | preference |
| `BROKER_MAX_TIER` | 2 | preference |
| `CONTRACT_HISTORY_MAX` | 24 | preference |
| `PRIZE_SLOTS` | 2 | preference |
| `DIFFICULTY_MAX` | 40 | [[plans/1.8.0]] |
| `DIFFICULTY_START` | 8 | preference |
| `DIFFICULTY_PER_DAY` | 0.8 | preference |
| `DIFFICULTY_CEILING` | 60 | preference |
| `SLOT_BANDS` | `[8,16] [13,21] [18,26] [23,31] [28,36] [32,40] [25,33] [32,40]` | preference |
| `STAR_MIN` | 1->0, 2->10, 3->20, 4->30 | preference |
| `PRIZE_BAND_MIN` | 0, 8, 20, 30 | preference |
| `NICE_AMOUNTS` | 2 3 4 5 6 8 10 12 15 20 25 30 40 50 60 80 100 | preference |
| `MARKUP_BASE` | 0.15 | preference |
| `MARKUP_PER_DIFFICULTY` | 0.004 | preference |
| `MARKUP_BAND` | tight 0.11, normal 0.05, long 0 | preference |
| `PENALTY_RATE` | 0.20 | preference |
| `LOAD_MIN` | 0.12 | preference |
| `LOAD_MAX` | 1.35 | preference |
| `LOAD_CURVE` | 2 | preference |
| `LOAD_D_OFFSET` | 6 | preference |
| `MIX_FLOOR` | 2 | preference |
| `MIX_SHARE` | 0.5 | preference |
| `BUDGET_OVERDRAFT` | 3 | preference |
| `AMOUNT_MIN` | 2 | preference |
| `SCALE_START` | 0.35 | preference |
| `SCALE_DAYS` | 24 | preference |
| `PENALTY_FLOOR` | 0.25 | preference |
| `CANCEL_MIN` | 0.05 | preference |
| `PAIR_COST` | 10 | preference |
| `GROUP_COST` | -4 | preference |
| `DEADLINE_STEP` | 0.5 | preference |
| `REP_MAX` | 20 | preference |
| `REP_IDLE` | 0.3 | preference |
| `LADDER_DAY` | 24 | debug only |
| `VANILLA_PRIZE_SEEDS` | 5 | preference |

`REP_DONE` 1*->0.5, 2*->1, 3*->1.5, 4*->2. `REP_LOST` 1*->1, 2*->2, 3*->3, 4*->4. Preference.

`D_STARTER` -1. `D_RARITY`: common 0, uncommon 0, rare 1, heirloom 3. Preference.

`DEADLINE_DAYS` - yours, not preference: tight `[1,2]` normal `[2,3]` long `[3,4]`, on the `DEADLINE_STEP` grid.

`DEADLINE_COST`: tight 8, normal 0, long -4. Preference.

`DEADLINE_WEIGHT`: tight 2, normal 5, long 2. Preference.

`RARITY_COST`: common 0, uncommon 2, rare 5, heirloom 9. Preference.

`REFERENCE_GOLD_PER_DAY` is derived at module load, not a constant to tune.

`VALUE_BASE`, `VALUE_SCALE` and `MARKUP_PER_DAY` are gone. They were replaced by `load()` and `MARKUP_BAND`.

`GOOD_COST` complete `{ [K in StallGoodId]: number }` preference:

| good | cost |
|---|---|
| carrot | 0 |
| potato | 1 |
| wheat | 2 |
| tomato | 3 |
| watermelon | 4 |
| grape | 4 |
| olive | 5 |
| raspberry | 6 |
| apple | 5 |
| apricot | 5 |
| lemon | 5 |
| cherry | 6 |
| sugar-cane | 4 |
| vanilla | 14 |
| sugar | 3 |
| jam-* | 6 |
| oil | 5 |
| flour | 4 |
| extract | 8 |
| vodka | 8 |
| beer | 7 |
| brandy | 10 |
| mixed | 4 |
| wine | 12 |

### `FEASIBLE_PER_DAY`

Complete `{ [K in StallGoodId]: number }`. Tuned-to `CROPS.growSeconds` / `BARREL_AGE` / `STILL_SECONDS` / mill and jam batch. `FEASIBLE_PLOTS` 8 preference — mature-farm crop plots; `scale(day)` is the early-farm fraction.

Crop: `round(FEASIBLE_PLOTS * DAY_SECONDS / CROPS[id].growSeconds)`.

Spirit: `DAY_SECONDS / STILL_SECONDS` (one still). Jam: `DAY_SECONDS / JAM_SECONDS` (one jam). Oil / flour / extract: `DAY_SECONDS / MILL_WORK` (one mill). Sugar: that mill rate × `SUGAR_BAG`. Wine stock-only: 1.

| good | FEASIBLE_PER_DAY |
|---|---|
| carrot | 21 |
| potato | 16 |
| wheat | 11 |
| tomato | 7 |
| raspberry | 6 |
| watermelon | 7 |
| olive | 5 |
| grape | 6 |
| vanilla | 4 |
| sugar-cane | 10 |
| apple | 3 |
| apricot | 4 |
| lemon | 4 |
| cherry | 4 |
| vodka beer brandy mixed | `4/3` |
| jam-* | 12 |
| oil flour extract | 80 |
| sugar | 160 |
| wine | 1 |

## Illegal

- player state or `clock.t` as mix ints
- board generation as a `Cmd` or a log entry
- `Seq.next` on `'contract'`
- `at()` without `(day, slot, k)`
- `Demand` rarity on a `PlainGoodId`
- nested `Lines`
- `CompanyId` other than the six
- `COMPANIES` missing an id
- `STUB_COMPANY` as the generator
- live `sat` in the save file
- guest `acceptContract` / `cancelContract` / `reorderContract` in a bundle
- standing drift
- silo filler
- a prize slot drawn from the live slot count rather than `CONTRACT_OFFERS`
- a prize contract also paying `reward`
- `COMPANY_PRIZES` missing a company or a band
- reading `D` rather than final `eff` for the prize band
- sizing an amount off `unitOf` when the reward settles at `cleanUnit`

Assumption: `FEASIBLE_PLOTS` is 8 so `SCALE_START` × long carrot ≥ `AMOUNT_MIN`; jam/spirit group vs specific is a roll; pair iff the grammar budget covers `PAIR_COST`; group jam unit is `min JAM_SALE`; `rollBoard` takes `Rng`.
