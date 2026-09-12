# Contracts

Daily buyer board, generator, accept / deliver / complete / miss / cancel / reorder. Stall [[mechanics/market]]. Sat [[mechanics/saturation]]. Family [[mechanics/family]]. Stream [[architecture/rng]]. Research [[mechanics/research]]. MP [[architecture/net]]. Guest cmds: [[mechanics/multiplayer]] `mp.guest`. Chrome [[ui/contracts]].

`World.contracts` is saved: `active` with bin fills, `takenToday`, `history`, `book`. `rep` and `repDay` stay on the top-level record. The board itself is derived, never saved and never digested. Digest includes active fill, `takenToday`, every `StallGood.sat`.

Offers match a plain good only. No Variety. No Quality floor. Those fields: [[plans/next-variant-patch]].

## Board

`CONTRACT_OFFERS`. `CONTRACT_SLOT_MAX`. `ContractId = day * CONTRACT_SLOT_MAX + slot`. `day` is `clock.day`.

Board size = `CONTRACT_OFFERS +` broker offered bonus. Offered bonus is `+1` at `broker` tier ≥ 1. Tier 2 does not add a second card. Published slots `0..size-1`. Slot `7` unused. `SLOT_BANDS` stays length 8.

Pure function of `(seed, day, slot)` on `SpatialId` `'contract'`. Reads no player state. Caller passes `slots`. Not a `Cmd`. Not in `World.log`. Not stored. Regenerating is free.

Visible iff `unlock-contracts` is in `done`. Tab gating is UI. Generation does not read `done`.

Unaccepted offers vanish at the next seam. Accepting writes `takenToday`; that id is not on today's board. `takenToday` clears at the seam. Active contracts persist across the seam.

At most `CONTRACT_ACTIVE +` broker active bonus accepted. Active bonus is `+1` at `broker` tier ≥ 2.

## rollBoard

`market.ts` owns `rollBoard(rng, day, slots, rep)`. Each slot `i` uses `rng.stream('contract').at(day, i, k)`. `rollBoard` takes `Rng`. `rollBoardAtD` is the debug ladder — [[ui/contracts]].

| k | roll |
|---|---|
| 0 | `D` for that slot |
| 2 | line 1 good |
| 3 | line 1 group vs specific (jam / spirit only) |
| 5 | `DeadlineBand` |
| 6 | `days` inside `DEADLINE_DAYS[band]` on the `DEADLINE_STEP` grid |
| 7 | line 2 good (pair only) |
| 8 | line 2 group vs specific |
| `20+i` | company shuffle, at `(day, 0, ·)` |
| 30, 31 | the two prize slots, at `(day, 0, ·)` |
| 32 | rotary vs diamond, when the prize is a tool |

`k` 1, 4, 9 unused. Amount is derived, not rolled. Pair is taken iff the grammar budget covers `PAIR_COST`. Jam/spirit group vs specific is a roll.

Company is cosmetic. `shuffled()` Fisher-Yates shuffles `COMPANY_IDS` per day and deals one per slot. It does not steer goods or difficulty. It does decide the prize, because the prize table is keyed by company.

### Difficulty

```
cap    = min(DIFFICULTY_START + DIFFICULTY_PER_DAY * day, DIFFICULTY_MAX)
f      = cap / DIFFICULTY_MAX
[l, h] = round(SLOT_BANDS[slot] * f)
D      = l + floor(u * (h - l + 1)) + rep                                   // clamp DIFFICULTY_CEILING
```

`rep` is `contracts.repDay`, the reputation snapshot taken at the seam, not live rep. Then `eff = clamp(D + shapeD(line1) + shapeD(line2), 0, DIFFICULTY_CEILING)`, where `shapeD` is `D_STARTER` for carrot / potato / wheat. `offer.difficulty` is `eff`. `stars` is the highest `Stars` with `eff >= STAR_MIN[stars]`. `eff` is what the prize band reads.

### Grammar budget

Two budgets, spent independently. The grammar budget buys shape; the money pool buys size.

```
opened = MIX_FLOOR + D * MIX_SHARE - DEADLINE_COST[band]
budget = max(opened, -BUDGET_OVERDRAFT)
pair   = budget >= PAIR_COST                                 // then budget = (budget - PAIR_COST) / 2
```

Each line then spends `GOOD_COST[good]`. Candidates are filtered to `GOOD_TIER[good] <= stars` and cost within `budget + BUDGET_OVERDRAFT`. A jam or spirit good may go group for `GROUP_COST` if `GROUP_TIER` allows at that star. Line 2 may not share a family with line 1. Sugar and extract are never demanded. Flakes and vanilla-extract are not `StallGoodId`. Infused is not a demand; `Accepts` ignores `infused`.

### Money pool and amount

```
load(D) = LOAD_MIN + (LOAD_MAX - LOAD_MIN) * ((D + LOAD_D_OFFSET) / (DIFFICULTY_CEILING + LOAD_D_OFFSET)) ** LOAD_CURVE
solo    = REFERENCE_GOLD_PER_DAY * days * load(D)
target  = pair ? solo / 2 : solo
amount  = nice(min(target / cleanUnit(demand), FEASIBLE_PER_DAY[good] * days * scale(day)))
scale(day) = min(1, SCALE_START + day / SCALE_DAYS)
```

`load(D)` is the share of a mature farm-day the contract eats. `REFERENCE_GOLD_PER_DAY` is the median `unitOf(g) * FEASIBLE_PER_DAY[g]` over `CONTRACT_GOODS` — derived. `LOAD_CURVE` and `LOAD_MAX` — preference. Divide by `cleanUnit`. `nice()` snaps down to the largest `NICE_AMOUNTS[i] <= x`. Group jam uses `jam-cherry` as the feasible key; group spirit uses `vodka`. `FEASIBLE_PLOTS` so `SCALE_START` × long carrot ≥ `AMOUNT_MIN`. `FEASIBLE_PLOTS` preference. `FEASIBLE_PER_DAY` tuned-to grow / barrel / still / mill / jam / furnace rates.

### Deadline

```
[lo, hi] = DEADLINE_DAYS[band]
steps    = (hi - lo) / DEADLINE_STEP + 1
days     = lo + DEADLINE_STEP * floor(u * steps)
```

Band feeds `days`, `DEADLINE_COST[band]`, and `MARKUP_BAND[band]`. `DEADLINE_WEIGHT` — preference.

### Reward

```
markup  = round2(MARKUP_BASE + MARKUP_PER_DIFFICULTY * eff + MARKUP_BAND[band])
clean   = round(sum over lines of amount * cleanUnit(demand))
reward  = round(clean * (1 + markup))
penalty = round(PENALTY_RATE * clean)
```

Baked at generation. Saturation at delivery does not move `reward`. `industrial` multiplies at complete, not here. A prize offer never pays `reward` — but the fertilizer prize is priced against it, and `penalty` derives from `clean`.

## Prizes

Two of the six offers each day pay goods instead of money, and pay no money. The board is the only source of tree seeds past the starting four, of vanilla seeds, of the large freezer, of the rotary shovel and the diamond pickaxe, and of expansion permits past the third. Tree-seed prizes are `'base'` quality 0. Vanilla prizes are `'base'` quality 0.

Kinds: `cash` | `tree-seed` | `seeds` (vanilla) | `fertilizer` | `freezer` | `expansion-slot` | `skill-points` | `tool` (rotary-shovel | diamond-pickaxe).

`prizeSlots(stream, day)` draws a distinct pair from `[0, CONTRACT_OFFERS)` off `k` 30 and 31. Drawn from the base six, never from the live slot count. Broker slots are always cash. Exactly two prizes on a six-slot board, still exactly two on eight.

`COMPANY_PRIZES[company][prizeBandOf(offer.difficulty)]` in `defs/companies.ts`. Fixed per company — only which slots pay a prize is rolled. Bands off `PRIZE_BAND_MIN`, read against final `eff`. Six firms: `whole-cart` `trade-jo` `halbert-eijn` `little-lid` `mercanova` `intercrop`. The tool arm is a template; `prizeFor` rolls the actual tool per offer off `k` 32.

`World.payPrize` from `resolveDone`. Only `cash` touches `money`. Tree-seed and tool drop at `DOOR`. Vanilla `putSilo`. Fertilizer `putAdditive`, bags = `max(1, round(reward / SKUS['buy-fertilizer'].price))`. Freezer `prizeFreezers += 1` — [[mechanics/research]]. Expansion `prizeSlots += 1` — [[mechanics/expansion]]. Skill-points `grantPoints(n)` — [[mechanics/family]]. Store prizes clamp to free space; overflow is lost.

## cleanUnit

Plain crop `CROPS[good].sale`. Plain wine `WINE_SALE` — no age. Plain spirit `SPIRIT_SALE[spirit]`. Plain sugar `SUGAR_MILL`. Plain jam `JAM_SALE[crop]`. Plain oil / flour / extract / bread `OIL` / `FLOUR` / `EXTRACT` / `BREAD`. Group jam `min JAM_SALE` (`cherry`). Group spirit `SPIRIT_SALE.vodka`. No skills, freshness, quality, or path rating.

## Accepts

`plain`: `good === demand.good`. Group jam: `good` is `JamId`. Group spirit: `good` is `SpiritKind`. A match is a match. No overage bonus. Freshness, variety, quality, and `infused` are not in `Accepts`. `{ kind: 'rotten' }` never `Accepts`. Flakes and vanilla-extract never `Accepts`.

## State

`nowDay = (clock.day - 1) + clock.t / DAY_SECONDS`. Deadline runs from acceptance, not publication. `Bin = { demand; filled; infusedFilled }`. `infusedFilled` starts 0. `HistoryEntry.rep` required, the reputation `addRep` actually moved — `contracts.rep-line`. New farm → empty. `book` is a complete `CompanyId` → `{ done: 0, missed: 0 }`. `history` ring `CONTRACT_HISTORY_MAX`.

## Accept

`Act.acceptContract` `'J'` `{ c: ContractId }`. Legal iff `unlock-contracts` done, `active.length` under cap, the id is on today's board. Else no-op. Creates `Active` with `dueDay = nowDay + offer.days` and one `Bin` per line at `filled: 0`. Pushes `offer.id` onto `takenToday`.

## Deliver

Existing consign at the truck. `consignBody` fills `contracts.active` in array order, then the stall remainder. `Act.reorderContract` `'Z'` swaps that entry with its neighbour. `d = 1` toward the end. Fill priority **is** array order. A bin takes a unit iff `Accepts` and `filled < amount`. A full bin passes through. Contract-bound units do not enter `StallGood.worth` and do not raise `sat`. Sugar fills in liters. Else count. Jam / cask / spirit / oil with `infused === true` also increment `infusedFilled`. `infusedFilled <= filled`.

## Complete

Every bin `filled === amount` → immediate on that delivering tick. `book[company].done += 1`. Slot freed. Those units never hit the stall.

```
fraction = sum(bin.infusedFilled) / sum(bin.demand.amount)
rep = addRep(REP_DONE[stars] × (1 + 0.25 × fraction))   // clamp [0, REP_MAX], returns what it moved
```

Cash offer: `money += offer.reward * (1 + 0.03 * industrialTier)` at the current daughter `industrial` tier. Prize offer: `payPrize(prize, offer.reward)` and `paid` is 0. No money moves, so `industrial` does not apply. Prize complete still takes the infused fraction.

## Miss

On the tick `nowDay` crosses `dueDay`, if not complete: sold = delivered units at the current saturated market rate; `penalty = offer.penalty * max(PENALTY_FLOOR, 1 - filled / need)`. `filled === need` is completion, never a miss. Remainders consign into stall. Plain remainders raise `sat`. Infused remainders enter infused worth and do not raise `sat`. `money += sold - penalty`. `book[company].missed += 1`. History `{ kind: 'missed' }` carrying `rep`, which is negative. Miss does not take the infused reputation mul.

## Cancel

`Act.cancelContract` `'Y'`. Legal while that id is `active`. `elapsed = nowDay - (dueDay - offer.days)`. `fee = lerp(CANCEL_MIN * clean, missPenalty(active), clamp(elapsed / offer.days, 0, 1))`. At `elapsed = 0`: `CANCEL_MIN * clean`. At `elapsed = days`: the miss penalty at that fill. Delivered units consign + raise `sat` as in Miss. `money += sold - fee`. Not a miss: `book` untouched. History `{ kind: 'cancelled' }` carrying `rep`, which is negative.

## Recap

`DayTally.contracts: HistoryEntry[]`. Complete / miss / cancel push here and onto `history`. Seam copies tally into `Recap.contracts`, then tally resets. Recap shows those outcomes and that a new board is up. `takenToday` clears at the seam. Dump omits `tally.contracts` and `Recap.contracts`.

## Skills

Hangar-buys are not `skuPrice` — [[mechanics/family]].

Daughter `broker` max `BROKER_MAX_TIER`. Gate `unlock-contracts`. T1 `+1` offered. T2 `+1` offered and `+1` active. Mid-day pick grows the board; slots `0..5` unchanged.

Daughter `industrial` is live. Complete pays `offer.reward * (1 + 0.03 * tier)` at complete time. Miss and cancel do not take it.

## Invariants

`contracts.board` — Board slot `i` on day `d` is a pure function of `(seed, d, i)`; same seed, same day → same offer, regardless of inventory, plantings, research, money, or `clock.t`.

`contracts.id` — `ContractId = day * CONTRACT_SLOT_MAX + slot`; growing the board with `broker` adds slots and does not change slots 0..5.

`contracts.not-cmd` — Board generation is not a `Cmd`.

`contracts.sat` — Contract delivery raises no `sat` and enters no `StallGood.worth`; miss and cancel plain remainders do both; infused remainders enter infused worth and raise no `sat`.

`contracts.demand` — A `Demand` is a plain good match or a group; no minimum; `Lines` never nests.

`contracts.amount` — `amount >= AMOUNT_MIN` on every published offer, and `amount <= FEASIBLE_PER_DAY[good] * days * scale(day)`.

`contracts.rep-line` — `addRep` returns what it actually moved after the `[0, REP_MAX]` clamp, and every `HistoryEntry` stores that number as `rep`; complete is positive, miss and cancel are `-REP_LOST[stars]`; board, Recap and Command Center read the stored number, never recompute it — [[ui/contracts]].

`contracts.reward` — `reward = clean * (1 + markup)` baked at generation; saturation at delivery time does not move it.

`contracts.miss` — Miss pays market rate for delivered units and `offer.penalty * max(PENALTY_FLOOR, 1 - filled/need)`; `filled = need` is completion, never a miss.

`contracts.cancel` — Cancel fee at `elapsed = 0` is `CANCEL_MIN * clean`; at `elapsed = days` it equals the miss penalty at that fill.

`contracts.consign` — Consign fills `active` in array order, then the stall; a full bin passes through; guest `acceptContract` / `cancelContract` / `reorderContract` / consign: [[mechanics/multiplayer]] `mp.guest`.

`contracts.infused` — Complete: `addRep(REP_DONE[stars] × (1 + 0.25 × infusedFilled / amount))`, clamp `[0, REP_MAX]`; `Bin.infusedFilled` counts infused jam / cask / spirit / oil only; `Accepts` ignores `infused`; miss and cancel do not take the mul.
