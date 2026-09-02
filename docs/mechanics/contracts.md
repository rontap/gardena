# Contracts

Daily buyer board, generator, accept / deliver / complete / miss / cancel / reorder. Types `src/game/sim/market.h.ts`. Spec [[plans/1.8.0]] Part 2. Stall [[mechanics/market]]. Sat [[mechanics/saturation]]. Family [[mechanics/family]]. Stream [[architecture/rng]]. Research [[mechanics/research]]. MP [[architecture/net]]. Guest cmds: [[mechanics/multiplayer]] `mp.guest`.

`World.contracts` is saved: `active` with bin fills, `takenToday`, `history`, `book`. `rep` and `repDay` stay on the top-level record. The board itself is derived, never saved and never digested. Digest includes active fill, `takenToday`, every `StallGood.sat`.

## Board

`CONTRACT_OFFERS`. `CONTRACT_SLOT_MAX`. `ContractId = day * CONTRACT_SLOT_MAX + slot`. `day` is `clock.day`.

Board size = `CONTRACT_OFFERS +` broker offered bonus. Offered bonus is `+1` at `broker` tier ≥ 1. Tier 2 does not add a second card. Published slots `0..size-1`. Slot `7` unused. `SLOT_BANDS` stays length 8.

Pure function of `(seed, day, slot)` on `SpatialId` `'contract'`. Reads no player state — not inventory, plantings, research, money, `clock.t`, not `broker`. Caller passes `slots`. Not a `Cmd`. Not in `World.log`. Not stored. Regenerating is free.

Visible iff `unlock-contracts` is in `done`. Tab gating is UI. Generation does not read `done`.

Unaccepted offers vanish at the next seam. Accepting writes `takenToday`; that id is not on today's board. `takenToday` clears at the seam. Active contracts persist across the seam.

At most `CONTRACT_ACTIVE +` broker active bonus accepted. Active bonus is `+1` at `broker` tier ≥ 2.

## rollBoard

`market.ts` owns `rollBoard(rng, day, slots, rep) → readonly ContractOffer[]`. Each slot `i` uses `rng.stream('contract').at(day, i, k)`.

`rollBoardAtD(rng, D, slots)` is the debug ladder: it forces `D` on every slot and scales amounts at `LADDER_DAY`. `#debug-contracts` only — [[ui/contracts]].

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
cap    = min(DIFFICULTY_START + DIFFICULTY_PER_DAY * day, DIFFICULTY_MAX)
f      = cap / DIFFICULTY_MAX
[l, h] = round(SLOT_BANDS[slot] * f)
D      = l + floor(u * (h - l + 1)) + rep                                   // clamp DIFFICULTY_CEILING
```

`rep` is `contracts.repDay`, the reputation snapshot taken at the seam, not live rep. Mid-day rep does not move the board.

Then the shape of the lines bumps it: `eff = clamp(D + shapeD(line1) + shapeD(line2), 0, DIFFICULTY_CEILING)`, where `shapeD` is `D_STARTER` for carrot / potato / wheat plus `D_RARITY[minRarity]`. `offer.difficulty` is `eff`, and `stars` is the highest `Stars` with `eff >= STAR_MIN[stars]`.

`eff` is what the prize band reads. Not `D`.

### Grammar budget

Two budgets, spent independently. The **grammar** budget buys shape; the **money** pool buys size.

```
opened = MIX_FLOOR + D * MIX_SHARE - DEADLINE_COST[band]
budget = max(opened, -BUDGET_OVERDRAFT)
pair   = budget >= PAIR_COST                                 // then budget = (budget - PAIR_COST) / 2
```

Each line then spends `GOOD_COST[good]` and, for a rated or spirit-group line, `RARITY_COST[minRarity]`. Candidates are filtered to `GOOD_TIER[good] <= stars` and cost within `budget + BUDGET_OVERDRAFT`. A jam or spirit good may go group for `GROUP_COST` if `GROUP_TIER` allows at that star. Line 2 may not share a family with line 1.

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

`load(D)` is the share of a mature farm-day the contract eats. `REFERENCE_GOLD_PER_DAY` is the median `unitOf(g) * FEASIBLE_PER_DAY[g]` over `CONTRACT_GOODS` — derived.

`LOAD_CURVE` and `LOAD_MAX` — preference. The curve is convex on purpose: the pool must climb harder over the top half of the ladder than the bottom, so a four-star board is worth giving up a prize slot for.

Divide by `cleanUnit`, the rarity-scaled unit the reward is later settled at — **not** `unitOf`, the common-rarity base.

`nice()` snaps down to the largest `NICE_AMOUNTS[i] <= x`, floor `NICE_AMOUNTS[0]`. There is no discard-and-retry. Group jam uses `jam-cherry` as the feasible key; group spirit uses `vodka`.

### Deadline

```
[lo, hi] = DEADLINE_DAYS[band]
steps    = (hi - lo) / DEADLINE_STEP + 1
days     = lo + DEADLINE_STEP * floor(u * steps)
```

Each band offers three lengths, halves included. `nowDay` is fractional already.

Band feeds three things: `days`, the grammar deduction `DEADLINE_COST[band]`, and `MARKUP_BAND[band]`. `DEADLINE_WEIGHT` — preference.

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

Two of the six offers each day pay goods instead of money, and pay **no** money.

The board is the only source of tree seeds past the starting three, of vanilla seeds, of the large freezer, of the rotary shovel and the diamond pickaxe, and of expansion permits past the third. Money buys capability; it does not buy these.

```
Prize =
  | { kind: 'cash' }
  | { kind: 'tree-seed'; tree: TreeId }
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

`COMPANY_PRIZES[company][prizeBandOf(offer.difficulty)]` in `defs/companies.ts`. Fixed per company — only *which* slots pay a prize is rolled. Bands off `PRIZE_BAND_MIN`, read against final `eff`.

Six firms, three columns: Whole Cart / Little Lid tree-seeds-vanilla-tools; Trade Jo / Mercanova buildings-and-land; Halbert Eijn / Intercrop household. The tool arm is a template; `prizeFor` rolls the actual tool per offer off `k` 32. Every other arm is returned as written.

### Payout

`World.payPrize` in `world.ts`, from `resolveDone`. Only `cash` touches `money`.

| prize | lands as |
|---|---|
| `tree-seed` | drop at `DOOR` |
| `tool` | drop at `DOOR`, full `SHOVELS` / `PICKAXES` uses |
| `seeds` | `putSilo('vanilla', 'common', count)` |
| `fertilizer` | `putAdditive('fertilizer', bags * FERT_BAG_LITERS)`, `bags = max(1, round(reward / SKUS['buy-fertilizer'].price))` — "worth the cash" |
| `freezer` | `prizeFreezers += 1`; `buy-freezer-large` opens while stock lasts — [[mechanics/research]] |
| `expansion-slot` | `prizeSlots += 1` — [[mechanics/expansion]] |
| `skill-points` | `grantPoints(n)` into the shared bank — [[mechanics/family]] |

Drops at the door, the way a shovelled-up tree seed drops. Store prizes clamp to free space; overflow is lost, same as any other put.

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

`World.contracts: Contracts = { active, takenToday, history, book, rep, repDay }`.

New farm → empty. Load restores what was saved, including part-filled bins. `book` is a complete `CompanyId` → `{ done: 0, missed: 0 }`. `history` ring `CONTRACT_HISTORY_MAX`.

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

Six firms: `whole-cart` `trade-jo` `halbert-eijn` `little-lid` `mercanova` `intercrop`. Header `CompanyId` is this union.

`GoodClass` covers every pool member. Fruit annuals are that set, not root/grain, not `sugar-cane`. Trees are `TreeId`. `SpiritKind` is not in any pool.

`defs/companies.ts` owns `COMPANIES` and `COMPANY_PRIZES`. Both complete maps. The generator reads no company field at all when picking goods, rarity or difficulty. Sector = `region`.

## Skills

Husband `haggling`. Utility and automation `skuPrice − $tier`, min $1. Hangar-buys still not `skuPrice`. Max 3.

Daughter `broker` max `BROKER_MAX_TIER`. Gate research `unlock-contracts`. T1 `+1` offered. T2 `+1` offered and `+1` active. Mid-day pick grows the board; slots `0..5` unchanged.

Daughter `industrial` is live. Complete pays `offer.reward * (1 + 0.03 * tier)` at complete time, current tier. Max 3. Miss and cancel do not take it.

`FEASIBLE_PER_DAY` complete `{ [K in StallGoodId]: number }`. Tuned-to `CROPS.growSeconds` / `BARREL_AGE` / `STILL_SECONDS` / mill and jam batch. `FEASIBLE_PLOTS` preference — mature-farm crop plots; `scale(day)` is the early-farm fraction.

Crop: `round(FEASIBLE_PLOTS * DAY_SECONDS / CROPS[id].growSeconds)`.

Spirit: `DAY_SECONDS / STILL_SECONDS` (one still). Jam: `DAY_SECONDS / JAM_SECONDS` (one jam). Oil / flour / extract: `DAY_SECONDS / MILL_WORK` (one mill). Sugar: that mill rate × `SUGAR_BAG`. Wine stock-only: 1.

Constants valued in `market.ts`. Header stays `declare const`.

Assumption: `FEASIBLE_PLOTS` so `SCALE_START` × long carrot ≥ `AMOUNT_MIN`; jam/spirit group vs specific is a roll; pair iff the grammar budget covers `PAIR_COST`; group jam unit is `min JAM_SALE`; `rollBoard` takes `Rng`.

## Invariants

`contracts.board` — Board slot `i` on day `d` is a pure function of `(seed, d, i)`. Same seed, same day → same offer, regardless of inventory, plantings, research, money, or `clock.t`.

`contracts.id` — `ContractId = day * CONTRACT_SLOT_MAX + slot`. Growing the board with `broker` adds slots and does not change slots 0..5.

`contracts.not-cmd` — Board generation is not a `Cmd`.

`contracts.sat` — Contract delivery raises no `sat` and enters no `StallGood.worth`. Miss and cancel remainders do both.

`contracts.demand` — A `Demand` never carries a rarity for a `PlainGoodId`, and `Lines` never nests.

`contracts.amount` — `amount >= AMOUNT_MIN` on every published offer, and `amount <= FEASIBLE_PER_DAY[good] * days * scale(day)`.

`contracts.reward` — `reward = clean * (1 + markup)` baked at generation. Saturation at delivery time does not move it.

`contracts.miss` — Miss pays market rate for delivered units and `offer.penalty * max(PENALTY_FLOOR, 1 - filled/need)`. `filled = need` is completion, never a miss.

`contracts.cancel` — Cancel fee at `elapsed = 0` is `CANCEL_MIN * clean`; at `elapsed = days` it equals the miss penalty at that fill.

`contracts.consign` — Consign fills `active` in array order, then the stall. A full bin passes through. Guest cmds: [[mechanics/multiplayer]] `mp.guest`.
