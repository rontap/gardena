# Docs review: Contracts

Notes: `docs/mechanics/contracts.md`, `docs/ui/contracts.md`, `docs/art/companies.md`
Code: `src/game/sim/feature-contracts/market.ts`, `src/game/sim/feature-contracts/market.h.ts`, `src/game/sim/store.ts`, `src/game/defs/companies.ts`, `src/game/defs/skills.ts`, `src/game/ui/feature-contracts/contracts.tsx`, `src/game/ui/recap.tsx`, `src/game/sim/tick.ts`, `src/assets/market/`
Tests: `src/game/sim/feature-contracts/market.test.ts`, `e2e/contracts-prize.spec.ts`, `e2e/mp-guest.spec.ts:82`, `e2e/infusion.spec.ts:369`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. When a contract is missed or cancelled, how are the goods already delivered paid?
- [ ] **doc** `docs/mechanics/contracts.md:185`, `:189` — The delivered units are paid once at the current market price (`sold`), and they "consign into stall"; the doc was written when the stall held goods until **Sell all**.
- [x] **code + test** `src/game/sim/feature-contracts/market.ts:832-870`, `:934-951`, `:988-1006` — `dumpFilled` pays the delivered units at once (`money += sold − penalty`) and also puts the same units into the stall bins with worth (`consignDemand`). The next drop-off at the warehouse sells the whole stall (`src/game/sim/store.ts:227`), so those units are paid a second time and raise `sat` a second time. Test `market.test.ts:127` asserts stall worth > 0 after cancel and after miss; `market.test.ts:423` asserts money = before + `sold` − penalty.
- [ ] **none**

### 2. How many offers can the Broker skill add, and does the board have room for them?
- [ ] **doc** `docs/mechanics/contracts.md:13`, `:199` — +1 offer and +1 active contract per `broker` rank, max rank 3; "`CONTRACT_SLOT_MAX` and `SLOT_BANDS` cover `CONTRACT_OFFERS +` broker max".
- [ ] **doc** `docs/ui/contracts.md:5`, `:13` — +1 offer at rank 1 or higher, +1 active at rank 2 or higher; "Broker 0: 6 cards. T1+: 7 cards. Not 8."
- [x] **code** `src/game/sim/world.ts` `contractSlots()` / `contractCap()`, `src/game/defs/skills.ts:256-263`, `src/game/sim/feature-contracts/market.ts:199-238`, `:638-647` — +1 offer and +1 active per rank, max rank 3, so rank 3 asks for 9 offers. `CONTRACT_SLOT_MAX` is 8 and `SLOT_BANDS` has 8 rows: slot 8 reads `SLOT_BANDS[8]`, which does not exist, and its `ContractId` (`day × 8 + 8`) equals the next day's slot 0. Tests roll at most 8 slots (`market.test.ts:97`, `:769`); no test covers rank 3.
- [ ] **none**

### 3. What does the offer hover say the cancellation costs?
- [ ] **doc** `docs/ui/contracts.md:32` — **Cancellation cost is {fee}**.
- [ ] **doc** `docs/mechanics/contracts.md:189` — Cancelling right after accepting costs `CANCEL_MIN` (0.05) × clean value, rising to the miss penalty at the deadline.
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:92-93` — The board hover prints `offer.penalty`, which is `PENALTY_RATE` (0.2) × clean value, the full miss penalty, not the 5% a cancel costs at acceptance. The running-contract **×** hover prints the live `cancelFee` (`contracts.tsx:417-427`). No test.
- [ ] **none**

### 4. What does the at-cap message say when the player holds more than four contracts?
- [ ] **doc** `docs/ui/contracts.md:32` — Cap 3: **Three contracts already running.**; Broker rank 2: **Four contracts already running.**
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:84` — **Four contracts already running.** when the cap is 4, **Three contracts already running.** for every other cap; with Broker rank 2 or 3 the cap is 5 or 6 and the message says three. No test.
- [ ] **none**

### 5. How is a running contract cancelled?
- [ ] **doc** `docs/ui/contracts.md:64` — First click on **×** arms it; a second click cancels.
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:412-433` — One click on **×** cancels. No arming state. No test.
- [ ] **none**

### 6. Where is the Contracts screen?
- [ ] **doc** `docs/ui/contracts.md:3`, `:13` — A tab on the Market overlay; panel stays `{ kind: 'market' }`.
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:29-34`, `src/App.tsx:1119`, `src/game/ui/hud.tsx:177-183` — Its own `Overlay` titled **Contracts**, `w-[72rem]`, panel `{ kind: 'contracts' }`, opened from its own HUD button once `unlock-contracts` is done. Opening it pauses solo play (`src/App.tsx:720`).
- [ ] **none**

### 7. Does the board scroll?
- [ ] **doc** `docs/ui/contracts.md:13` — Left column (board) does not scroll; only the right column may.
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:52` — Both columns are `scroll-pane overflow-y-auto`.
- [ ] **none**

### 8. What does the right column say when no contract is running?
- [ ] **doc** `docs/ui/contracts.md:15` — **No contracts running.**, shown only when there are no running contracts and no history.
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:352-353`, `messages/en/market.json:9` `market_no_running` — "You currently don't have any contracts. Click one of the available contracts on the left to begin working on it. New contracts are available daily.", shown whenever no contract is running, with history still listed below.
- [ ] **none**

### 9. What does an offer card show for the deadline, and a running card for the time left?
- [ ] **doc** `docs/ui/contracts.md:28`, `:62` — Offer: **1 day** or **{n} days**. Running: **{x.x} days left**.
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:140`, `:441`, `messages/en/market.json:17-18` — Offer: **Deadline 1 day** / **Deadline {n} days**. Running: **Deadline {x.x} days** (`market_deadline` with one decimal). The hover uses **1 day** / **{n} days** (`contracts.tsx:79`).
- [ ] **none**

### 10. What does a finished-contract line show on the Contracts screen?
- [ ] **doc** `docs/ui/contracts.md:66-76` — One line each: company name, difficulty dots, day, outcome word (**Completed** / **Missed** / **Cancelled**), money; the reputation change as **{sign}{n} Reputation**.
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:362-369`, `:490-514` — Under a **Finished** label, a 2-column grid of chips: company icon, one face per line, reputation icon with ±n, and money or prize. Company name, outcome word, day and difficulty appear only in the hover. **{sign}{n} Reputation** (`RepChange`) is used on the recap line, not here.
- [ ] **none**

### 11. What does the hover say is the top difficulty?
- [ ] **doc** `docs/ui/contracts.md:32` — `{difficulty}/40`.
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:89`, `src/game/sim/feature-contracts/market.ts:209`, `:215`, `:611` — The text is `{difficulty}/40` with 40 written into the UI, while an offer's difficulty can reach `DIFFICULTY_CEILING` 60 once reputation and the day are added, so the hover can read "52/40". Test `market.test.ts:371` asserts difficulty stays within 0..60.
- [ ] **none**

### 12. What quality are seed prizes?
- [ ] **doc** `docs/mechanics/contracts.md:102`, `:115`, `:150`, `:235` — Quality 0; seeds go in the silo with `putSilo(crop, variety, 0, count)`.
- [x] **code** `src/game/sim/feature-contracts/market.ts:885-887` — Seed prizes go into the silo at `boughtSeedQuality` (Seed bank skill plus that crop's familiarity), the same as shop seeds. Tree-seed prizes are quality 0 (`:896`). The offer card face shows quality 0 (`contracts.tsx:170`). Test `market.test.ts:895-906` checks the count only.
- [ ] **none**

### 13. Where do tree-seed and tool prizes arrive?
- [ ] **doc** `docs/mechanics/contracts.md:150` — Dropped at `DOOR`.
- [x] **code + test** `src/game/sim/feature-contracts/market.ts:894-910` — Put in the first empty slot of the **Postbox** (four slots, `POSTBOX_SLOTS`); dropped at `DOOR` only when the postbox is full. Tests `market.test.ts:186`, `:891-894` assert the postbox slot.
- [ ] **none**

### 14. Does the board read any player state?
- [ ] **doc** `docs/mechanics/contracts.md:15`, `:205` — Pure function of `(seed, day, slot)`; reads no player state.
- [ ] **doc** `docs/mechanics/contracts.md:53` — Difficulty adds `contracts.repDay`, the reputation at the start of the day.
- [x] **code + test** `src/game/sim/feature-contracts/market.ts:638-647`, `:736-743` — `rollBoard(rng, day, slots, rep)` adds `repDay` to every slot's difficulty. Tests `market.test.ts:73` "(seed, d, i, repAtDayStart)", `:385`, `:414`.
- [ ] **none**

### 15. Which function fills contracts on a drop-off?
- [ ] **doc** `docs/mechanics/contracts.md:170` — "Existing consign at the truck. `consignBody` fills…"
- [ ] **code** `src/game/sim/store.ts:222-231`, `:301-316` — `consignItem` calls `fillContracts`; drop-off is at the **Produce Warehouse**. `consignBody` not found in `src/`.
- [ ] **none**
- [x] !! This is not a high-level thing, it should not even be in the docs

## Doc only (no code found)

### 16. Is there a `MarketTab` that remembers the Contracts tab?
- [ ] **doc** `docs/ui/contracts.md:3` (via `docs/ui/market.md:24`) — Contracts tab gating is UI on the Market overlay. Searched: `MarketTab`, `Tabs.Content` in `src/game/ui/market.tsx` and `contracts.tsx`, nothing found.
- [x] **removed from the game**
- [ ] **none**

## Code only (no note mentions it)

### 17. Does reputation fall on a day with no contract taken?
- [x] **code** `src/game/sim/tick.ts:184`, `src/game/sim/feature-contracts/market.ts:223` — At each new day, once Contracts is researched, reputation drops by `REP_IDLE` 0.3 if no contract was accepted that day. Test `market.test.ts:400` asserts the value only.
- [x] **intended, document it**
- [ ] **not intended**

### 18. What sits above the board?
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:36-49` — A **Reputation** bar (`rep / REP_MAX`, `REP_MAX` 20), then labels **Available {n}** and **Taken {n}/{max}**.
- [x] **intended, document it**
- [ ] **not intended**

### 19. What does the left column say when every offer is taken?
- [x] **code** `src/game/ui/feature-contracts/contracts.tsx:53-54`, `messages/en/market.json:10` — "There are no more contracts for today. New contracts will be available the next day."
- [x] **intended, document it**
- [ ] **not intended**

### 20. Do broker slots past six repeat companies?
- [x] **code** `src/game/sim/feature-contracts/market.ts:574-583` — Six companies are shuffled per day and dealt `i % 6`, so slots 6 and 7 repeat the companies of slots 0 and 1. Test `market.test.ts:313` checks six slots only.
- [x] **intended, document it**
- [ ] **not intended**
