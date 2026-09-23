# Docs review: Market

Notes: `docs/aims.md`, `docs/mechanics/market.md`, `docs/mechanics/saturation.md`, `docs/ui/market.md`
Code: `src/game/sim/store.ts`, `src/game/sim/stall.ts`, `src/game/sim/feature-contracts/market.ts`, `src/game/ui/market.tsx`, `src/game/sim/prompt.ts`, `src/game/sim/building.ts`, `src/App.tsx`, `messages/en/market.json`, `messages/en/almanac.json`
Tests: `src/game/sim/feature-contracts/market.test.ts`, `src/game/sim/feature-machines/machine.test.ts`, `src/game/sim/family.test.ts`, `src/game/sim/world.test.ts`. No e2e spec opens the Market panel.

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. How does the player get paid for goods brought to the Market?
- [ ] **doc** `docs/aims.md:23` — The Market is a **Sell all** button at the truck: one number, freshness and rarity already in it.
- [ ] **doc** `docs/mechanics/market.md:3`, `:43-67` — Goods wait in stall bins after drop-off. The Market tab has one **Sell all** button that pays `marketGain` for everything, writes `sat`, and clears the bins.
- [ ] **doc** `docs/ui/market.md:46` — Footer: **Sell all** button (`data-sell-all`) with the coin total, the clean total greyed beside it when they differ, disabled at 0; click runs `sellAll()` and closes the panel.
- [x] **code + test** `src/game/sim/store.ts:222-231` — Every drop-off sells at once. `consignItem` fills contracts, puts the rest in the stall, then calls `sellAllBody` in the same step, so the stall is empty after each drop-off. The player sees speech **I sold {n} {good} for {money}!** (`market_sold`). The Market panel has no sell button (`src/game/ui/market.tsx:23-56`). `Act.sellAll` still exists (`src/game/sim/apply.ts:53`, `src/game/sim/world.ts:1889`); only the text-mode driver `src/game/sim/play.ts:455` calls it. Test `src/game/sim/feature-machines/machine.test.ts:96` "10 common potato fruit `marketGain` $50…" asserts money rises by the sale on the drop-off tick; `src/game/sim/feature-contracts/market.test.ts:711-720` asserts the same for rotten produce.
- [ ] **none**

### 2. Where does the player drop goods off, and what does the world show there?
- [ ] **doc** `docs/mechanics/market.md:11-15` — A **Market truck** of `TRUCK_BASE` cells in a yard of three plots; the pad is in the yard; only truck cells take the click; look **Market truck**, prompt **Drop off**.
- [ ] **doc** `docs/aims.md:9` — "sell at the truck".
- [x] **code** `src/game/sim/building.ts:291`, `:298`, `:633-644`; `src/game/sim/prompt.ts:625-628`; `src/game/sim/queue.ts:33` — A `Warehouse` building, 2×2 at column 10 row 7 (`WAREHOUSE_BASE`). Look name **Produce Warehouse** (`names_building_warehouse`). With a sellable good in hand the prompt is **Drop off** (`prompt_drop_off`); the actor walks to `PAD`, the first of two pads below the warehouse. With anything else in hand the prompt is the blocked name **Produce Warehouse**. Vehicles unload onto the same pads (`src/game/sim/feature-vehicles/vehicle.ts:1480`, `:1525`). `TRUCK_BASE` not found in `src/`. Tests place the actor at `PAD` (`machine.test.ts:98`).
- [ ] **none**

### 3. Is the Market one overlay with a Contracts tab?
- [ ] **doc** `docs/ui/market.md:3`, `:9-24` — Centred `Overlay` `w-[72rem]`, tabs **Market** | **Contracts**, the last tab chosen is remembered in App state `MarketTab`.
- [ ] **doc** `docs/mechanics/market.md:3`, `docs/aims.md:23` — Overlay **Market** | **Contracts**; "Contracts are a second stall tab."
- [x] **code** `src/game/ui/market.tsx:28-33`, `src/game/ui/frame.tsx:424`, `src/game/ui/hud.tsx:176-183`, `src/App.tsx:1118-1119` — Market is a `Dock` window `w-[38rem]` at the top left, no tabs. Contracts is its own panel `{ kind: 'contracts' }` with its own HUD button **Contracts**, shown once `unlock-contracts` is done. `MarketTab` not found in `src/`.
- [ ] **none**

### 4. What does the Market panel list?
- [ ] **doc** `docs/ui/market.md:26-44` — A **Demand** row of chips (6-column grid of goods whose price is not 100%), then a table of stocked goods with columns Produce | Quantity | Demand | Sale price, read from `marketQuote()`; **No produce.** when nothing is stocked.
- [x] **code** `src/game/ui/market.tsx:34-53`, `src/game/sim/store.ts:436-451` — One table read from `marketDemand()`, no chips, no stock. Columns **Produce**, **Demand**, **Current Sale Price**, **MSRP**, **Back to baseline** (`market_col_*`). One row per good whose shown percent rounds to something other than 100%; a crop gets one row per variety only when its varieties show different percents. **MSRP** is the good's base unit price × the variety's produce rate (`unitOf × purposeMul`); **Current Sale Price** is MSRP × the shown percent; **Back to baseline** is days.
- [ ] **none**

### 5. What does the Market panel say when every price is at 100%?
- [ ] **doc** `docs/ui/market.md:30` — **All Market prices are normal.**
- [x] **code** `messages/en/market.json:51` `market_demand_empty` — "Every price is at its baseline."
- [ ] **none**


### 7. How fast does a Market price return to 100%?
- [ ] **doc** `docs/mechanics/saturation.md:57`, `:61`, `:83` — 30 shown points a day for every good, constant `SAT_RECOVER_PER_DAY`.
- [ ] **doc** `docs/mechanics/saturation.md:63` — `SAT_RECOVER[good]` per good, plus the familiarity bonus (this line contradicts `:57` in the same note).
- [x] **code + test** `src/game/sim/feature-contracts/market.ts:60-90`, `:159-179` — Per good `SAT_RECOVER` in shown points per day: Carrot 30; Potato, Sugar cane, Cherry 20; Wheat, Chilli, Apricot, Olive, Apple 15; Tomato, Grape, Raspberry, Vanilla 10; every crafted good and sugar 30; crop goods add familiarity × `FAMILIARITY_RECOVER` (0.005). `SAT_RECOVER_PER_DAY` not found. Test `market.test.ts:604` "`sat` starts 0 and ticks toward 0 by that good's own `SAT_RECOVER`…" asserts carrot 50% → 80% and tomato 50% → 60% in one day.
- [ ] **none**

### 8. How does demand change at the start of each day?
- [ ] **doc** `docs/mechanics/saturation.md:65` — Two fruit crops each get a whole number of shown points in [−20, 20] from `rng.stream('market-demand')`.
- [x] **code + test** `src/game/sim/feature-contracts/market.ts:181-197` — Two different crop goods: one gets +33 shown points (price up), the other −33 (`DEMAND_NUDGE` 33). Test `market.test.ts:632-639` asserts deltas `[DEMAND_NUDGE, -DEMAND_NUDGE]` on two different goods.
- [ ] **none**

### 9. What are the limits of a price?
- [ ] **doc** `docs/mechanics/saturation.md:65` — `sat` clamps `SAT_MIN`..`SAT_MAX`, "−80%..+50% cut".
- [x] **code** `src/game/sim/feature-contracts/market.ts:92-94`, `:125-129` — `SAT_MIN` −0.8, `SAT_MAX` 1, and cut = `sat × SAT_MAX_CUT` (0.5), so the cut runs from −40% to +50%: the shown price runs from 140% down to 50% before weather and the per-row cap. No test asserts `SAT_MIN`.
- [ ] **none**

### 10. Can the player carry rotten produce to the warehouse and sell it?
- [ ] **doc** `docs/mechanics/market.md:19`, `:59` — Yes after Fermentation (`unlock-fermentation`): $1 each; refused without it.
- [x] **code** `src/game/sim/prompt.ts:930-947` — `canConsign` has no case for rotten produce, so a hand holding rotten produce on the warehouse shows the blocked name **Produce Warehouse** and no **Drop off**. The sale code accepts it after Fermentation (`src/game/sim/store.ts:207`), and vehicles use that path (`vehicle.ts:1525`), so only a vehicle can deliver rotten produce.
- [ ] **test** `market.test.ts:703-720` — Enqueues `{ act: 'consign' }` directly, skipping the prompt; asserts refusal without Fermentation and $1 each with it.
- [ ] **none**

### 11. When is rotten produce paid?
- [ ] **doc** `docs/mechanics/market.md:37` — It waits in `World.clearance`; the save keeps it; **Sell all** pays and zeros it.
- [x] **code + test** `src/game/sim/store.ts:281`, `:318-331` — Added to `clearance` and paid in the same drop-off; `clearance` is 0 again before the tick ends. The field is still saved (`src/game/sim/feature-save/save.ts:59`). Test `market.test.ts:717-720` asserts `clearance` 0 and money up right after the drop-off.
- [ ] **none**

### 12. Do the Better-crop skills raise the sale price?
- [ ] **doc** `docs/mechanics/market.md:49`, `:69` — `stallX` multiplies the crop sale by the `better-*` skill `saleMul` (`Modifier.source === 'skill'`); a skill taken after the pick raises the price at sale.
- [x] **code + test** `src/game/defs/skills.ts:137-173`, `src/game/sim/family.ts:37`, `src/game/sim/stall.ts:74-81` — Every `better-*` skill has `saleMul: 1`, and `family.ts` only adds a modifier when `saleMul` is not 1, so no Better skill changes a price. `stallX` multiplies every modifier's `saleMul` for that crop with no filter on `source`. Tests `src/game/defs/research.test.ts:63`, `src/game/defs/skills.test.ts:96` assert `saleMul: 1` for potato.
- [ ] **none**

### 13. How many days does the Market say until a price is back to 100%?
- [ ] **doc** `docs/mechanics/saturation.md:67` — `|sat| × SAT_MAX_CUT / SAT_RECOVER_PER_DAY`.
- [x] **code** `src/game/sim/store.ts:441` — `|sat| × SAT_MAX_CUT / SAT_RECOVER[good]`. The familiarity bonus that the real recovery adds (`market.ts:159`) is left out, so for a studied crop the panel shows more days than recovery takes. No test.
- [ ] **none**

### 14. What name does a wine or cider stall row show for an Heirloom variety?
- [ ] **doc** `docs/mechanics/market.md:31` — The bin reads the plain `CASK_NAME`; **Premium** is only on the item.
- [x] **code** `src/game/sim/stall.ts:57`, `src/game/sim/item.ts:461-464` — `stallGoodName` passes the variety to `caskName`, which returns **Premium {name}** for an Heirloom variety. No test.
- [ ] **none**

### 15. Which tomato jam is named Ketchup?
- [ ] **doc** `docs/mechanics/market.md:33` — `jam-tomato` is **Ketchup** when the variety is `'base'`.
- [x] **code** `src/game/sim/item.ts:237-242` — Every tomato jam except San Marzano is **Ketchup**, so Green Zebra tomato jam is also **Ketchup**. No test.
- [ ] **none**



## Doc only (no code found)

### 17. Is there a `SellAllQuote` panel with a footer button?
- [ ] **doc** `docs/mechanics/market.md:65`, `docs/mechanics/saturation.md:69-77`, `docs/ui/market.md:32` — The panel reads `World.marketQuote()` and does no arithmetic. Searched: `marketQuote` in `src/game/ui/` and `src/App.tsx`, nothing found. `marketQuote` exists (`src/game/sim/store.ts:374`) and is used only by `sellAllBody`, `marketGain` and `play.ts`.
- [ ] **removed from the game**
- [ ] **none**
- [ ] Developement question, not doc mateiral.

### 18. Do the stall crates appear in the yard?
- [ ] **doc** `docs/mechanics/market.md:13` — Yard of three plots beside the truck. Searched: `crateCells` — defined at `src/game/sim/stall.ts:132-146`, no caller in `src/`. `YARD` cells are still reserved (`building.ts:293-297`, `:314`).
- [ ] **removed from the game**
- [ ] **none**
- [ ] Developement question, not doc mateiral.

## Code only (no note mentions it)

### 19. Does a drop-off of fruit count toward the tutorial?
- [x] **code** `src/game/sim/store.ts:224`, `src/game/sim/tutorial.ts:71`, `:97` — Every fruit dropped off adds to `World.delivered`; the tutorial reads it (a step completes at more than 0, and `TUTORIAL_DELIVERED` gates a later step).
- [ ] **intended, document it**
- [ ] **not intended**

### 20. Do contracts take fruit at 0 freshness?
- [ ] **code** `src/game/sim/store.ts:237` — Fruit at freshness 0 skips the contracts (`skip` true) and goes straight to the stall.
- [ ] **intended, document it**
- [ ] **not intended**
- [ ] skip
