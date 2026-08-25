# Contracts

Daily buyer board, generator, accept / deliver / complete / miss / cancel / reorder. Types `src/game/sim/market.h.ts`. Spec [[plans/1.8.0]] Part 2. Stall [[mechanics/market]]. Sat [[mechanics/saturation]]. Family [[mechanics/family]]. Stream [[architecture/rng]]. Research [[mechanics/research]]. MP [[architecture/net]]. Numbers preference unless marked.

Live `World.contracts` only. Not in the save file. Digest includes active fill, `takenToday`, every `StallGood.sat`. Board is derived, not digested. `SAVE_VERSION` / `PROTOCOL` / wordmark stay 1.72 / 1.7.2.

## Files

| file | owns |
|---|---|
| `src/game/sim/market.h.ts` | typedef only. `ContractId` `ContractOffer` `Demand` `Lines` `Active` `Bin` `Contracts` `RollBoard` `Accepts` `CancelFee` `MissPenalty` `CleanUnit` `CompanyId` `GoodClass`. Every constant `declare const` |
| `src/game/defs/companies.ts` | `COMPANIES` book: mix, pool, eligible |
| `src/game/sim/market.ts` | valued constants + `rollBoard` + `cleanUnit` + `Accepts` + `cancelFee` + `missPenalty`. No `World` |
| `src/game/sim/world.ts` | `World.contracts`, accept / cancel / reorder, consign fill, miss tick, `DayTally.contracts` |
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

`market.ts` owns `rollBoard(rng, day, slots) → readonly ContractOffer[]`. Each slot `i` uses `rng.stream('contract').at(day, i, k)`.

### `contract` — `at(day, slot, k)`

| k | roll |
|---|---|
| 0 | `D` |
| 1 | company among eligible at `D` |
| 2 | line 1 good from that pool |
| 3 | line 1 group vs specific (jam / spirit only) |
| 4 | line 1 `minRarity` (rated / spirit-group only) |
| 5 | `DeadlineBand` among affordable |
| 6 | `days` inside `DEADLINE_DAYS[band]` |
| 7 | line 2 good (pair only) |
| 8 | line 2 group vs specific |
| 9 | line 2 `minRarity` |

Amount is derived. Not a roll. Pair is taken iff leftover `Dmix >= PAIR_COST` after steps 1–4 — not a coin flip.

### Difficulty

`[lo, hi] = SLOT_BANDS[slot]`. `D` inclusive integer in `[lo, hi]`, then `min` with `DIFFICULTY_START + DIFFICULTY_PER_DAY * day` and `DIFFICULTY_MAX` 40. `stars` is the highest `Stars` with `D >= STAR_MIN[stars]`; else 1.

Company: uniform among `COMPANIES` with `eligible <= D`. Always at least `whole-cart` / `halbert-eijn` / `intercrop` (`eligible` 0).

`Dmix = D * company.mix`. `Dval = D - Dmix`. `mix` is the company's dial, not a roll.

### Spend `Dmix`

Remaining starts at `Dmix`. Each step takes the rolled option only if remaining covers its cost; else the cheapest legal option. That cheaper pick is the rule. Not `??`. Leftover remaining rolls into `Dval`.

1. Good from the company's pool → `GOOD_COST[good]`. Uniform among pool members with cost ≤ remaining. If none, cheapest in that pool.
2. If the good's class is `'jam'` or `'spirit'`: roll group vs specific. Group costs `GROUP_COST` (−4). Specific costs 0. Both always fit.
3. `RARITY_COST[minRarity]`, only for a `rated` or spirit-group line. Uniform among rarities with cost ≤ remaining; else `common`.
4. `DEADLINE_COST[band]`. Uniform among bands with cost ≤ remaining; else `long`.
5. If remaining ≥ `PAIR_COST`, spend it and repeat steps 1–3 for line 2 (`k` 7–9). Else one line.

`GOOD_COST` carries crop tier. Low-`D` slots cannot afford vanilla. No player-state read.

Jam specific → `plain` `JamId`. Jam group → `{ kind: 'group'; group: 'jam' }`. Crop / wine / spirit specific → `rated`. Sugar / oil / flour / extract → `plain`. Spirit group → `{ kind: 'group'; group: 'spirit'; minRarity }`. `GoodClass` has no `SpiritKind`; current pools never pick a spirit or wine. `Demand` still allows both.

### Amount

```
V      = VALUE_BASE * (1 + Dval / VALUE_SCALE)
unit   = cleanUnit(demand)
amount = nice(V / unit)
```

`nice()` snaps down to the largest `NICE_AMOUNTS[i] <= x`. A pair splits `V` equally across its two lines, then `nice` each.

```
amount = min(nice(V / unit), FEASIBLE_PER_DAY[good] * days * scale(day))
scale(day) = min(1, SCALE_START + day / SCALE_DAYS)
```

Group jam uses `jam-cherry` as the feasible key. Group spirit uses `vodka`.

If the clamp drops amount below `AMOUNT_MIN`, discard and generate that slot again with `D` forced to `SLOT_BANDS[slot][0]` (`k` 0 unused). One retry.

### Reward

```
markup  = MARKUP_BASE + MARKUP_PER_DIFFICULTY * D + MARKUP_PER_DAY * days
clean   = sum over lines of amount * unit
reward  = clean * (1 + markup)
penalty = PENALTY_RATE * clean
```

Baked at generation. Saturation at delivery does not move `reward`. `industrial` multiplies at complete, not here.

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
World.contracts: Contracts = { active, takenToday, history, book }
```

Live only. Load → empty. New farm → empty. `book` is a complete `CompanyId` → `{ done: 0, missed: 0 }`. `history` ring `CONTRACT_HISTORY_MAX` 24.

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

Every bin `filled === amount` → immediate on that delivering tick: `money += offer.reward * (1 + 0.03 * industrialTier)` at the current daughter `industrial` tier (0 if absent). `book[company].done += 1`. History `{ kind: 'done'; paid }`. Slot freed. Those units never hit the stall.

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

`defs/companies.ts` owns `COMPANIES: { readonly [K in CompanyId]: Company }`. Complete map.

```
Company = {
  id: CompanyId
  name: string
  riff: string
  region: 'US' | 'NL' | 'DE' | 'ES' | 'HU'
  mix: number
  pool: readonly GoodClass[]
  eligible: number
}
```

`eligible` is min `D`. `mix` is the company's dial. Sector = `region`. No standing drift.

| id | name | riff | region | mix | pool | eligible at D |
|---|---|---|---|---|---|---|
| `whole-cart` | Whole Cart | Walmart | US | 0.15 | all `CropId` | 0 |
| `trade-jo` | Trade Jo | Trader Joe's | US | 0.70 | fruit annuals + trees + jam | 8 |
| `halbert-eijn` | Halbert Eijn | Albert Heijn | NL | 0.20 | carrot potato wheat tomato sugar | 0 |
| `little-lid` | Little Lid | Lidl | DE | 0.25 | all `CropId` + flour + oil | 4 |
| `mercanova` | Mercanova | Mercadona | ES | 0.45 | fruit annuals + trees + jam | 6 |
| `intercrop` | Intercrop | Interspar HU | HU | 0.30 | all `CropId` | 0 |

All `CropId` = `ANNUAL_IDS` then `TREE_IDS`. Fruit annuals in the order named. Trees `TREE_IDS`. Jam `JAM_IDS`. Then `flour` `oil` as the pool lists them.

mix / eligible preference.

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
| `DIFFICULTY_MAX` | 40 | [[plans/1.8.0]] |
| `DIFFICULTY_START` | 8 | preference |
| `DIFFICULTY_PER_DAY` | 0.6 | preference |
| `SLOT_BANDS` | `[0,8] [4,12] [8,18] [12,24] [18,32] [24,40] [20,36] [28,40]` | preference |
| `STAR_MIN` | 1→0, 2→10, 3→20, 4→30 | preference |
| `NICE_AMOUNTS` | 4 5 6 8 10 12 15 20 25 30 40 50 60 80 100 | preference |
| `MARKUP_BASE` | 0.20 | preference |
| `MARKUP_PER_DIFFICULTY` | 0.015 | preference |
| `MARKUP_PER_DAY` | 0.04 | preference |
| `PENALTY_RATE` | 0.20 | preference |
| `VALUE_BASE` | 40 | preference |
| `VALUE_SCALE` | 20 | preference |
| `AMOUNT_MIN` | 4 | preference |
| `SCALE_START` | 0.35 | preference |
| `SCALE_DAYS` | 24 | preference |
| `PENALTY_FLOOR` | 0.25 | preference |
| `CANCEL_MIN` | 0.05 | preference |
| `PAIR_COST` | 6 | preference |
| `GROUP_COST` | −4 | preference |

`DEADLINE_DAYS` — yours, not preference: tight `[1,2]` normal `[2,3]` long `[4,5]`.

`DEADLINE_COST`: tight 8, normal 3, long 0. Preference.

`RARITY_COST`: common 0, uncommon 3, rare 8, heirloom 16. Preference.

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
- live `Contracts` / `sat` in the save file
- guest `acceptContract` / `cancelContract` / `reorderContract` in a bundle
- standing drift
- silo filler
- `??` as Dmix recovery
- version bump

Assumption: `FEASIBLE_PLOTS` is 8 so `SCALE_START` × long carrot ≥ `AMOUNT_MIN`; jam/spirit group vs specific is a roll; pair iff leftover `Dmix >= PAIR_COST`; group jam unit is `min JAM_SALE`; `rollBoard` takes `Rng`.
Assumption: wine is in no pool; `WINE_SALE` vs `VALUE_BASE` cannot reach `AMOUNT_MIN`; retry at `SLOT_BANDS[slot][0]` is that company's lowest-unit common long line; retry miss throws.
