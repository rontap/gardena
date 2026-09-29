# Contracts

Code: `feature-contracts/market.ts` (generation, delivery, outcomes), `feature-contracts/market.h.ts` (types), `defs/companies.ts` (companies and prizes), `store.ts` (`fillContracts`), `ui/feature-contracts/contracts.tsx`; see [[code-map]].
Unlocked: research `unlock-contracts` ([[features/research]]). The skills `broker` and `industrial` need it too ([[features/family]]).

## Purpose

A contract is an order from a company: a set amount of one or two goods, delivered within a number of days. It pays more than the Market would for the same goods and leaves Market prices as they are, and two of each day's offers pay an item instead of money. Some of those items cannot be bought: Named and Heirloom tree seeds, vanilla seeds, the Large freezer, the Rotary shovel and Diamond pickaxe, and expansion permits. Contracts give the player a reason to plan what to plant and make, and to deliver on time: a missed or cancelled contract costs money and reputation, and reputation makes later contracts larger.

## Rules

### Today's contracts

Each day has a fixed list of offers. `rollBoard(rng, day, slots, repDay)` builds it from the world seed, the day number, the number of positions and the reputation at the start of the day, and from these alone. The Contracts panel, the accept command and the play API each call it and get the same list.

- **Positions.** `contractSlots()` = `CONTRACT_OFFERS` + the `broker` rank. Offer ids are `day × CONTRACT_SLOT_MAX + slot`. A `broker` rank taken during the day adds positions at the end; positions `0` to `CONTRACT_OFFERS` − 1 stay the same.
- **Lifetime.** An offer that is not accepted is gone at the end of the day, when the day number changes. An accepted offer's id goes into `takenToday`, and the list hides it for the rest of the day, also after the contract is cancelled.
- **Reputation used.** `repDay` is the reputation copied at the end of the previous day. Reputation gained or lost during the day changes tomorrow's list, not today's.

### How an offer is generated

Every random value comes from the `contract` stream, `stream.at(day, slot, k)` ([[systems/rng]]):

| `k` | at | decides |
|---|---|---|
| 0 | `(day, slot)` | the position's difficulty |
| 2 | `(day, slot)` | the good of line 1 |
| 3 | `(day, slot)` | whether a jam or spirit line 1 becomes Any jam / Any spirit |
| 5 | `(day, slot)` | the deadline kind |
| 6 | `(day, slot)` | the deadline length |
| 7 | `(day, slot)` | the good of line 2 |
| 8 | `(day, slot)` | whether a jam or spirit line 2 becomes Any jam / Any spirit |
| 20 + *i* | `(day, 0)` | the company order |
| 30, 31 | `(day, 0)` | the two positions that pay a prize |
| 32 | `(day, slot)` | which prize, where the company's prize entry has a choice |

The order of work:

```
rollBoard(day, slots, repDay)
  shuffled          company for each position
  for each position:
    slotD           D: the position's difficulty
    offerAt
      deadline      kind, then days
      budget        how much variety the goods may have; one line or two
      money target  solo = REFERENCE_GOLD_PER_DAY × days × load(D)
      spendLine     line 1 good, maybe grouped
      spendLine     line 2 good, maybe grouped (pairs only)
      difficulty    D plus the goods' adjustment -> final difficulty, stars
      lineAmount    amount of each line
      payment       clean value, markup, reward, penalty
  withPrizes        two positions get a prize from their company
```

#### Company

`shuffled` shuffles `COMPANY_IDS` once per day and gives position *i* the company at *i* mod the number of companies. The first `CONTRACT_OFFERS` positions have six different companies; `broker` positions repeat the companies of positions 0 and 1. The company decides only the prize.

#### Difficulty

```
cap   = min(DIFFICULTY_START + DIFFICULTY_PER_DAY × day, DIFFICULTY_MAX)
f     = cap ÷ DIFFICULTY_MAX
l, h  = round(low × f), round(high × f)            low, high = SLOT_BANDS[slot]
D     = l + floor(u × (h − l + 1)) + repDay, at most DIFFICULTY_CEILING
```

`SLOT_BANDS` gives each position its own difficulty range, so one day offers a spread of difficulties. Both ends of every range grow with the day number until `DIFFICULTY_START + DIFFICULTY_PER_DAY × day` reaches `DIFFICULTY_MAX`. Reputation is added as it is, so `D` need not be a whole number.

The difficulty rating before the goods are chosen, `starsOf(D)`, limits which goods may appear: a good is allowed when its `GOOD_TIER` is at most that rating. `starsOf` gives the highest rating whose `STAR_MIN` is at most the difficulty.

#### Deadline

The deadline kind is `tight`, `normal` or `long` (`DeadlineBand`), chosen with the weights `DEADLINE_WEIGHT`. Its length:

```
lo, hi = DEADLINE_DAYS[kind]
steps  = (hi − lo) ÷ DEADLINE_STEP + 1
days   = lo + DEADLINE_STEP × floor(u × steps)
```

The kind also changes the budget (`DEADLINE_COST`) and the markup (`MARKUP_BAND`).

#### Budget, and one line or two

The budget limits how varied and costly the goods may be. The money target, below, sets how many units.

```
opened = MIX_FLOOR + D × MIX_SHARE − DEADLINE_COST[kind]
budget = max(opened, −BUDGET_OVERDRAFT)
pair   = budget ≥ PAIR_COST                      then each line's budget is (budget − PAIR_COST) ÷ 2
```

A tight deadline takes budget away and a long one adds it, so a long offer asks for two goods at a lower difficulty than a tight one.

#### Money target

```
load(D) = LOAD_MIN + (LOAD_MAX − LOAD_MIN) × ((D + LOAD_D_OFFSET) ÷ (DIFFICULTY_CEILING + LOAD_D_OFFSET)) ^ LOAD_CURVE
solo    = REFERENCE_GOLD_PER_DAY × days × load(D)
share   = solo ÷ 2 when a pair is wanted, else solo
```

`REFERENCE_GOLD_PER_DAY` is the median, over `CONTRACT_GOODS`, of `unitOf(good) × FEASIBLE_PER_DAY[good]`: the money one good earns in a day at the expected output rate of a developed farm. `load(D)` is the share of that day's money the contract asks for; it grows with `D` to the power `LOAD_CURVE`.

#### Goods

`CONTRACT_GOODS` is every Market good except `sugar` and `extract`. `spendLine` picks line 1 uniformly from the candidates:

- `GOOD_TIER[good]` is at most `starsOf(D)`;
- `GOOD_COST[good]` is at most the line's budget + `BUDGET_OVERDRAFT`;
- two units of it are worth no more than `share`: `unitOf(good) × AMOUNT_MIN ≤ share`.

The line's budget then drops by `GOOD_COST[good]`. If the good is a jam or a spirit (`SPIRIT_KINDS`: vodka, beer, brandy, mixed), a second random value decides, one in two, whether the line becomes **Any jam** or **Any spirit**, which is allowed only when `GROUP_TIER` of that group is at most `starsOf(D)`. A grouped line gets `GROUP_COST` back (it is negative, so the budget rises).

When a pair is wanted, line 2 is picked the same way, with the budget `line budget + max(what line 1 left, −BUDGET_OVERDRAFT)`, and it may not be the same family as line 1 (`sameFamily`): not a second jam after a jam or Any jam, not a second spirit after a spirit or Any spirit, not the same good. Wine and cider are casks, not spirits, so they may appear beside a spirit or each other. When no good qualifies for line 2, the offer has one line.

#### Final difficulty and stars

```
eff   = clamp(D + D_STARTER for each line whose good is in STARTER_CROPS, 0, DIFFICULTY_CEILING)
stars = starsOf(eff)
```

`STARTER_CROPS` are carrot, potato and wheat; a line of one of them makes the offer easier. `offer.difficulty` is `eff`. The stars shown on the card and the prize entry both use `eff`, while the goods were limited by `starsOf(D)`.

#### Amounts

```
target  = solo, or solo ÷ 2 for each line when there are two lines
wanted  = target ÷ cleanUnit(line)
limit   = FEASIBLE_PER_DAY[good] × days × scale(day)
scale   = min(1, SCALE_START + day ÷ SCALE_DAYS)
amount  = the largest value in NICE_AMOUNTS that is at most min(wanted, limit); at least NICE_AMOUNTS[0]
```

`limit` keeps an order within what the farm can make in the time: `FEASIBLE_PER_DAY` is a good's expected daily output, and `scale` makes it smaller on early days. For Any jam the good used for `FEASIBLE_PER_DAY` is `jam-cherry`; for Any spirit it is `vodka`. Every published amount is at least `AMOUNT_MIN`.

`cleanUnit` is a line's base price per unit, with no quality, freshness, variety or skill: `unitOf(good)`, which is `CROPS[crop].sale` for fruit, `JAM_SALE[crop]` for jam, `CASK_SALE` for wine and cider, `bakeSpiritSale(kind, 'base', 0)` for spirits, and `SUGAR_MILL`, `OIL`, `FLOUR`, `EXTRACT`, `BREAD` for the others. Any jam uses the lowest `JAM_SALE`; Any spirit uses the vodka price.

#### Payment

```
clean   = round(Σ amount × cleanUnit(line))
markup  = round(MARKUP_BASE + MARKUP_PER_DIFFICULTY × eff + MARKUP_BAND[kind], to hundredths)
reward  = round(clean × (1 + markup))
penalty = round(PENALTY_RATE × clean)
```

All four are fixed when the offer is generated.

#### Prizes

`withPrizes` picks two different positions from `0` to `CONTRACT_OFFERS` − 1 (values `k` 30 and 31), so every day has `PRIZE_SLOTS` prize offers and `broker` positions always pay money. A prize offer pays its item and no money.

The item is `COMPANY_PRIZES[company][prizeBandOf(eff)]`. `prizeBandOf` picks the entry from `PRIZE_BAND_MIN`:

| company | from `PRIZE_BAND_MIN[0]` | from `PRIZE_BAND_MIN[1]` | from `PRIZE_BAND_MIN[2]` | from `PRIZE_BAND_MIN[3]` |
|---|---|---|---|---|
| Whole Cart | Cherry tree seed | Apricot tree seed | one Named tree seed | one Heirloom tree seed, or 1 Vanilla seed |
| Little Lid | Apple tree seed | Olive tree seed | one Plain tree seed | one Named tree seed |
| Trade Jo | Apple tree seed | Cherry tree seed | 1 skill point | a tool |
| Mercanova | fertilizer | Large freezer | 1 skill point | expansion permit |
| Halbert Eijn | Plain fruit seeds, count from the reward | 2 Named annual seeds | 1 Heirloom annual seed | a tool |
| Intercrop | `STARTER_CROPS` seeds, count from the reward | Plain fruit seeds, count from the reward | 4 Named annual seeds | 2 Heirloom annual seeds, or 2 Vanilla seeds |

Where an entry names a group, value `k` 32 picks one member uniformly:

- Tree seeds: Plain is every tree at its Plain variety; Named and Heirloom are every tree variety of that tier (`PLAIN_TREE_POOL`, `NAMED_TREE_POOL`, `HEIRLOOM_TREE_POOL`). A tree seed prize is always one seed.
- Annual seeds: Named and Heirloom are every annual variety of that tier, grass excluded (`NAMED_ANNUAL_POOL`, `HEIRLOOM_ANNUAL_POOL`). Plain fruit is every annual of class `fruit` except vanilla, at its Plain variety (`FRUIT_ANNUAL_POOL`).
- "or Vanilla seeds": the Vanilla seeds are one more member beside the group's members.
- A tool: the Rotary shovel, the Diamond pickaxe or the Electric chainsaw, one in three (`PRIZE_TOOLS`).
- "count from the reward": `ceil(reward ÷ CROPS[crop].seed)` seeds — as many as the reward would buy at the seed price.

The offer still has a `reward` and `penalty`. The fertilizer and "count from the reward" prizes use the reward; the penalty and cancel fee work as for money offers.

### Accepting

`acceptContractBody` accepts an offer when `unlock-contracts` is done, fewer than `contractCap()` contracts are running, the id is not in `takenToday`, and the id is on today's list (`rollBoard` at the current `contractSlots()` and `repDay`). `contractCap()` = `CONTRACT_ACTIVE` + the `broker` rank.

The running contract (`Active`) keeps a copy of the offer, one order line (`Bin`) per offer line with `filled` and `infusedFilled` at 0, and `dueDay = nowDay() + days`, where `nowDay()` is the day number minus 1 plus the time of day as a fraction of `DAY_SECONDS`. The deadline counts from acceptance.

### Delivering

Goods reach contracts only through **Drop off** at the Produce Warehouse, by hand or vehicle ([[features/market]]). `fillContracts` goes through the running contracts in list order, and through each contract's lines in order. A line takes units while it has room and accepts the good (`Accepts`):

| line | accepts |
|---|---|
| one good | that `StallGoodId` only |
| Any jam | every jam in `JAM_IDS` |
| Any spirit | `SPIRIT_KINDS`: vodka, beer, brandy, mixed; not wine or cider |

`Accepts` checks the good only; any variety and quality, infused or plain, fills the line. Sugar fills in litres. Fruit at freshness 0 and rotten produce go straight to the Market. Infused units add to the line's `infusedFilled` as well as `filled`. Units taken by a contract skip the Market's stock and price drop; what is left is sold at the Market in the same drop-off.

The player sets the order with the ▲ ▼ buttons (`reorderContractBody` swaps a contract with its neighbour), which decides which contract gets goods first.

### Completing

A contract is complete when every line is full. `finishFull` checks after each drop-off, so a contract completes on the drop-off that fills it; `tickContracts` also completes a full contract at its deadline. On completion (`resolveDone`):

- A money offer pays `reward × (1 + INDUSTRIAL_PCT % × industrial rank)`, at the rank at completion time.
- A prize offer pays the prize (`payPrize`):

| prize | goes to |
|---|---|
| tree seed, tool | the first empty Postbox slot, quality 0; on the ground at the house door (`DOOR`) when the Postbox is full |
| annual seeds | the Seed silo, at `boughtSeedQuality` (the quality of seeds bought in the shop); what does not fit is lost |
| fertilizer | the Additive store: `max(1, round(reward ÷ price of buy-fertilizer))` bags of `FERT_BAG_LITERS` L; what does not fit is lost |
| Large freezer | `World.prizeFreezers` + 1: one Large freezer to place from Build ([[items/buildings/freezer]]) |
| expansion permit | `World.prizeSlots` + 1 ([[features/expansion]]) |
| skill point | `grantPoints` ([[features/family]]) |

- Reputation rises by `REP_DONE[stars] × (1 + 0.25 × infused units ÷ units required)`, counted over all lines ([[features/machines]] infusion).
- `book[company].done` rises by 1, and the contract moves to the history.

### Missing

At the first step where `nowDay()` is at or past `dueDay` and a line is not full, the contract is missed (`resolveMiss`):

- The delivered units are sold (`dumpFilled`). Each line's units count as its good (Any jam as `jam-cherry`, Any spirit as `vodka`), at `cleanUnit`, at that good's current price drop with the Plain cap, plus the weather addition for fruit ([[features/market]]). Units that are not infused raise the price drop; infused units sell at the price drop in force and leave it as it is.
- The penalty is `round(penalty × max(1 − delivered ÷ required, PENALTY_FLOOR))` (`missPenalty`).
- Money changes by the sale minus the penalty. Reputation falls by `REP_LOST[stars]`. `book[company].missed` rises by 1.

### Cancelling

The **×** on a running contract cancels it at once (`cancelContractBody`). The delivered units are sold as for a miss, and the fee is:

```
elapsed = nowDay() − (dueDay − days)
t       = clamp(elapsed ÷ days, 0, 1)
fee     = round((1 − t) × CANCEL_MIN × clean + t × missPenalty)
```

Right after accepting, the fee is `CANCEL_MIN` of the clean value; at the deadline it equals the miss penalty for what was delivered. Reputation falls by `REP_LOST[stars]`. The company's `book` counts completed and missed contracts only.

### Reputation

`contracts.rep` runs from 0 to `REP_MAX`. `addRep` clamps it and returns the change it made, which the history stores. It changes:

| when | change |
|---|---|
| a contract completes | + `REP_DONE[stars]` × (1 + 0.25 × infused share) |
| a contract is missed or cancelled | − `REP_LOST[stars]` |
| end of a day with `unlock-contracts` done and no contract accepted that day | − `REP_IDLE` |

Reputation is added to every position's difficulty, from the next day. A higher difficulty gives larger orders, two lines more often, more stars, a higher markup, and the company's prize entry for that difficulty.

### End of day

In `tickWorld`, when the day changes: running contracts past their deadline are completed or missed (`tickContracts`); the end-of-day summary takes the contracts finished that day (`tally.contracts`); then reputation loses `REP_IDLE` if no contract was accepted, `takenToday` is emptied, `repDay` is set to the reputation, and the Market's daily demand change runs ([[features/market]], [[features/weather-day]]). The new day number gives a new list of offers.

### Broker

`broker` has three ranks (`BROKER_MAX_TIER`). Each rank adds one position and one running contract. `CONTRACT_SLOT_MAX` is `CONTRACT_OFFERS + BROKER_MAX_TIER`, and `SLOT_BANDS` has one row per position, so every position of every day has its own difficulty range and its own id.

## Screen

- **Contracts** button on the HUD once `unlock-contracts` is done. It opens a window titled **Contracts**; in a solo game the game is paused while it is open.
- Top: **Reputation** with a bar of `rep ÷ REP_MAX`; **Available {n}** over the offers, **Taken {n}/{max}** over the running contracts.
- Offer card: company icon and name, one dot per star, one row per line (item face and name, or **Any jam** / **Any spirit**), **Deadline {n} days** / **Deadline 1 day**, then the coin reward or the prize face and name. Clicking accepts it; at the limit the cards are grey.
- Offer hover: **{difficulty}/{DIFFICULTY_CEILING} difficulty contract for {company}.**, **Deliver {amount} {good}.** per line, **Contract duration is {days}, earn {reward} when completed ({markup}% more than farmer's market).** or **earn {prize} when completed.**, **Cancellation cost is {fee}.**, and **Click to accept offer**. The fee is `round(CANCEL_MIN × clean)`, the cost of cancelling right after accepting. At the limit it shows **Three contracts already running.**, **Four contracts already running.**, **Five contracts already running.** or **Six contracts already running.**, matching the limit.
- Running card: company, stars, ▲ ▼ to change the order, **×** to cancel with the hover **Cancelling this offer will incur a {fee} penalty.**; one row per line with the units still needed; **Deadline {x.x} days** with the time left; a bar of delivered ÷ required; the reward.
- **Finished**: the history, one chip each: company icon, one face per line with its amount, the reputation change, and the money paid, the penalty, the fee or the prize. Hover: **Completed** / **Missed** / **Cancelled**, **Day {n}**, **Difficulty {n}**.
- Empty: **There are no more contracts for today. New contracts will be available the next day.** on the left; **You currently don't have any contracts. …** on the right.
- Command Center: one row per running contract, **Contract · {n} days left** or **Contract · due today**, with the company face, the goods still needed and the delivered bar; **Contract completed** when one completes. Clicking either opens the Contracts window.
- End-of-day summary: one line per contract finished that day (company, stars, day, **Completed** / **Missed** / **Cancelled**, **{sign}{n} Reputation**, money or prize), then **A new board is up.** ([[name-map]]: today's contracts).
- Research row: **Contracts button**, and a description that a Contracts button opens the Contracts window.

## Guest

A guest can accept, cancel and reorder contracts, and a guest's drop-offs fill them (`permit` refuses a guest only `pickSkill`, `expand` and `cheat`). The list of offers is computed on each machine from the shared seed.

## Save and sync

Saved in `contracts`: `active` (each with its copy of the offer, `dueDay`, and each line's `filled` and `infusedFilled`), `takenToday`, `history` (the last `CONTRACT_HISTORY_MAX` entries) and `book`; `rep` and `repDay` are saved at the top level; the day tally's `contracts` and each end-of-day summary's contract lines are saved with them. Today's offers are computed from the seed on load.

The digest carries `takenToday` and, for each running contract, its id, `dueDay` and each line's `filled` ([[systems/net]]).

## Art

`src/assets/market/company-{id}.svg`, one per company (`COMPANY`); `ui-btn-contracts.svg` (HUD button); `stat-reputation.svg`. Prize faces use the item faces, the skill point and expansion icons, and the Large freezer's Build face.

## Invariants

| id | rule | test |
|---|---|---|
| `contracts.board` | position *i* on day *d* depends only on the seed, *d*, *i* and `repDay` | `market.test.ts` |
| `contracts.id` | `ContractId = day × CONTRACT_SLOT_MAX + slot`; `broker` positions do not change positions below `CONTRACT_OFFERS` | `market.test.ts` |
| `contracts.not-cmd` | generating the list is not a command | `market.test.ts` |
| `contracts.sat` | delivered units skip the Market's stock and price drop; a miss or cancel pays them at the Market price, and units that are not infused raise the price drop | `market.test.ts` |
| `contracts.amount` | every amount is at least `AMOUNT_MIN` and at most `FEASIBLE_PER_DAY[good] × days × scale(day)` | `market.test.ts` |
| `contracts.reward` | `reward = clean × (1 + markup)` is fixed at generation | `market.test.ts` |
| — | amount, clean, reward and penalty are whole numbers; markup is whole percent | `market.test.ts` |
| — | a pair never has two lines of one family | `market.test.ts` |
| — | no good appears below its `GOOD_TIER`; sugar and extract never appear | `market.test.ts` |
| — | one day never offers the same company twice in the first `CONTRACT_OFFERS` positions | `market.test.ts` |
| — | final difficulty stays within 0 and `DIFFICULTY_CEILING` | `market.test.ts` |
| — | the list reads `repDay`, so reputation changes during the day do not change it | `market.test.ts` |
| `contracts.miss` | a miss pays the delivered units at the Market price and `penalty × max(PENALTY_FLOOR, 1 − delivered ÷ required)`; all lines full is a completion | `market.test.ts` |
| `contracts.cancel` | the cancel fee is `CANCEL_MIN × clean` at acceptance and the miss penalty at the deadline | `market.test.ts` |
| `contracts.consign` | drop-off fills running contracts in list order, then the Market; a full line passes units on | `market.test.ts` |
| `contracts.infused` | completion reputation is `REP_DONE[stars] × (1 + 0.25 × infused ÷ required)`; miss and cancel do not use it | `market.test.ts` |
| `contracts.prize` | two of the first `CONTRACT_OFFERS` positions pay a prize from `COMPANY_PRIZES[company][prizeBandOf(eff)]`; `broker` positions pay money | `market.test.ts`, `e2e/contracts-prize.spec.ts` |
| `contracts.prize-pool` | the tree and annual groups are built from `VARIETIES`; vanilla is in no group | `market.test.ts` |
| `contracts.prize-vanilla` | Vanilla seeds appear only in the last entries of Whole Cart and Intercrop, as one extra choice | `market.test.ts` |
| `contracts.prize-item` | a paid tree seed carries its variety at quality 0; paid seeds carry crop, variety and count; count from the reward is `ceil(reward ÷ CROPS[crop].seed)` | `market.test.ts` |
| — | a prize offer pays its item and no money | `market.test.ts` |
| — | guests may accept, cancel and reorder | `market.test.ts` |

## When you change this

- New Market good: its rows in `GOOD_COST`, `GOOD_TIER`, `FEASIBLE_PER_DAY`, `SAT_RECOVER`; `unitOf`; `demandItem` and `demandName` for the cards; if it should not be ordered, exclude it from `CONTRACT_GOODS` ([[features/market]]).
- New company: `CompanyId`, `COMPANY_IDS`, `COMPANIES`, a `COMPANY_PRIZES` row, `emptyBook`, an icon in `COMPANY`, its name string. The number of companies decides how many positions have different companies.
- New prize kind: `Prize`, `PrizeTemplate`, `prizeFor`, `payPrize`, `prizeName`, `prizeItem` or `PRIZE_ART`, and its save handling ([[systems/save]]).
- More `broker` ranks or offers: `SLOT_BANDS` needs a row and `CONTRACT_SLOT_MAX` must cover every position, or ids of two days collide.
- Generation constants change the difficulty of every day; check the `#debug-contracts` page, which shows the offers for each difficulty (`rollBoardAtD`) and for each day ([[systems/debug-pages]]).

## Decisions

- The list of offers reads reputation and no other player state. A generator that reads what the player planted or owns can be steered by planting one seed; reputation is earned by delivering.
- The deadline counts from acceptance.
- Contracts state a good; any variety and quality fills it.
- Which two positions pay a prize is random; which prize a company pays at a difficulty is fixed. Contracts pay items that money cannot buy.
- The reward and penalty are fixed when the offer is generated.
- The player sets the order in which running contracts take a delivery, because only the player knows which contract they are saving goods for.
