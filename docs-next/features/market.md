# Market

Code: `store.ts` (drop-off and sale), `stall.ts` (`StallGood`), price-drop functions and constants in `feature-contracts/market.ts`, `ui/market.tsx`; see [[code-map]].
Unlocked: from the start. Rotten produce sells after `unlock-fermentation`.

## Purpose

The Market is where the farm earns money. The player drops goods off at the Produce Warehouse and is paid at once. Every good has its own price drop: selling many units of one good lowers the price of the next ones, and the price comes back over time. This makes a farm that grows and makes several goods earn more than one that sells a single crop in bulk, and it makes processing a crop into jam, spirits or flour a way to sell it without lowering the fruit price.

## Rules

### Drop-off

**Drop off** at the Produce Warehouse ([[items/buildings/produce-warehouse]]) is the only way to sell. The gardener walks to `PAD` with the item in hand; a vehicle unloads onto the loading spots below the building ([[features/vehicles]]). Both call `consignItem`, which does this in one step:

```
consignItem(item)
  1. fill accepted contracts, in the order of the Contracts list    fillContracts   [[features/contracts]]
  2. put what is left into the Market's stock                       StallGood.take / takeSpirit / takeBaked / takeSugar
  3. finish every contract that is now full                         finishFull
  4. sell the Market's whole stock                                  sellAllBody -> marketQuote
```

`marketOpen()` returns true at every time of day and in every weather. Step 4 empties the stock, so the stock holds goods only during a drop-off.

### What the Market takes

| item | Market good (`StallGoodId`) | stock kept per |
|---|---|---|
| fruit of every crop and tree | the crop id | variety |
| sugar (litres) | `sugar` | — |
| jam | `jam-{crop}`, crop in `JAM_CROPS` | variety; infused or not (`InfusedKey`) |
| spirit | `vodka`, `beer`, `brandy`, `mixed` (`SPIRIT_KINDS`) | variety; infused or not |
| cask | `wine`, `cider` (`CASK_IDS`) | variety; infused or not |
| oil | `oil` | infused or not |
| flour, bread | `flour`, `bread` | — |
| rotten produce | none; counted in `World.clearance` | — |

`consignUnits` takes only the items in this table; rotten produce only after `unlock-fermentation`. The hand prompt offers **Drop off** for the same items (`canConsign`). A driver unloading a vehicle at the Produce Warehouse sells every item of the table in the cargo (`unloadBody`).

A fruit drop-off adds its count to `World.delivered`, which the tutorial reads ([[features/tutorial]]).

### Value of a unit

Each unit's value before the price drop (`unitClean`):

| good | value per unit |
|---|---|
| fruit | `CROPS[crop].sale` × `freshMul(freshness)` × `qualityMul(quality)` × `purposeMul(variety, 'produce')`, × `heirloom` skill for an Heirloom variety, × `saleswoman` skill |
| jam | `unitSale` × `specialty` skill for a Named or Heirloom variety × `saleswoman` skill |
| vodka, beer, brandy, mixed, wine | `unitSale` × `heirloom` skill for an Heirloom variety × `specialty` skill for a Named or Heirloom variety × `saleswoman` skill |
| cider | `unitSale` × `specialty` skill for a Named or Heirloom variety × `saleswoman` skill |
| oil, sugar, flour, bread | `unitSale` × `saleswoman` skill |
| rotten produce | 1 coin; nothing else applies |

- `saleswoman`: + `SALE_PCT` % per rank. `heirloom`: + `HEIRLOOM_PCT` % per rank. `specialty`: + `SPECIALTY_PCT` % per rank ([[features/family]]).
- Fruit value is fixed at drop-off from the item's freshness, quality and variety (`StallGood.worth`); the crop price and skills are applied at the sale. `stallX` is `CROPS[crop].sale` × the `saleMul` of every `Modifier` for that crop.
- Crafted goods carry their own `unitSale`, set by the machine that made them ([[features/machines]]).
- A unit that goes into a contract is paid by the contract ([[features/contracts]]).

### Price drop

Each good in `STALL_IDS` has one price drop, `StallGood.sat`. It is shared by all varieties of that good, infused or not, and changes only with sales of that good.

```
sat         SAT_MIN ............ 0 ............................ SAT_MAX
cut         sat × SAT_MAX_CUT, never above the row's cap (cutOf)
price       unit value × (1 − cut + weather)                    mul
weather     WEATHER_FRUIT_IMPACT for fruit on a Flood or Drought day, else 0
```

Below 0 the cut is negative and the price is above the unit value; the cap limits only the drop. The cap (`impactOf`) is the largest cut a unit can take:

| good | cap |
|---|---|
| fruit | `SAT_IMPACT_FRUIT` of the variety tier: Plain, Named or Heirloom |
| jam, spirits, wine, cider | `SAT_IMPACT_CRAFT` of the variety tier |
| oil, sugar, flour, bread | `SAT_IMPACT_CRAFT.base` |

### Sale

`marketQuote` prices the whole stock; `sellAllBody` pays its total, writes each good's new `sat`, and empties the stock and `clearance`. For each good, in `STALL_IDS` order, and within a good for each variety in `VARIETY_IDS` order (Plain first, then each Named and Heirloom variety in the order of that list):

1. **Units that are not infused** sell one after another (`saleUnits`). Unit *i*, counting from 0, takes the cut `min(cap, sat × SAT_MAX_CUT + i × step)`, where `step` is `SAT_STEP_FRUIT` for fruit and `SAT_STEP_CRAFT` for every other good (`stepOf`). After the units, `sat` rises by `n × step ÷ SAT_MAX_CUT`, up to `SAT_MAX`. It rises even when the units already sold at the cap, so selling an Heirloom variety past its cap still lowers the price of that good's Plain units.
2. **Infused units** all sell at the `sat` the good had before this sale started, and do not raise it ([[features/machines]] infusion).

Selling *n* units in one drop-off pays the same as *n* drop-offs of one unit each, when no time passes between them. Rotten produce adds `clearance` coins to the total, with no price drop.

After the sale the gardener says **I sold {n} {good} for {money}!**, where *n* is the units of the dropped item that went to the Market and *money* is the total paid in that sale. The line is said when *n* and *money* are both above 0.

### Price recovery

Every step, each good's `sat` moves toward 0 (`recover`): down when it is above 0, up when it is below. The rate is `recoverPerDay` price points a day: `SAT_RECOVER[good]`, plus, for fruit, the crop's familiarity × `FAMILIARITY_RECOVER` ([[features/machines]] familiarity); for crafted goods, `SAT_RECOVER[good]`.

### Daily demand change

At the end of each day `applyDayDemand` picks two different fruit goods from the `market-demand` stream at the new day number ([[systems/rng]]). The first gets its price raised by `DEMAND_NUDGE` points (`sat` lowered by `DEMAND_NUDGE` ÷ 100 ÷ `SAT_MAX_CUT`), the second gets it lowered by the same amount. `sat` stays within `SAT_MIN` and `SAT_MAX`. Recovery then moves both back toward normal.

## Screen

- **Produce Warehouse**: hover **Produce Warehouse**; with a sellable item in hand the prompt is **Drop off**; with any other hand the prompt is the building name.
- **Market** button on the HUD, from the start. It opens a window titled **Market** at the top left; the game keeps running while it is open. It lists prices only, from `marketDemand`:
  - Columns: **Produce**, **Demand** (an arrow and the price percent), **Current Sale Price**, **MSRP**, **Back to baseline** (days).
  - One row per good whose price, rounded, is not 100%. A crop gets one row per variety only when its varieties show different percents (different caps).
  - **MSRP** is `unitOf(good)` × `purposeMul(variety, 'produce')`: the base price with no quality, freshness or skill. **Current Sale Price** is MSRP × the percent.
  - The percent is blue above 100%, grey at 100%, orange while the cut is under half the row's cap, red from half the cap.
  - **Back to baseline** is `|sat| × SAT_MAX_CUT ÷ recoverPerDay(good)`. For fruit, `recoverPerDay` is `SAT_RECOVER[good]` plus familiarity × `FAMILIARITY_RECOVER`. Crafted goods use `SAT_RECOVER` only.
  - Hover on a row: **Maximum Market Impact {n}%. {days}d to clean.** — the row's cap and the same day count. [[name-map]] replaces Maximum Market Impact with Price drop.
  - No rows: **Every price is at its baseline.**

## Guest

A guest can drop goods off and open the Market window. Money is the farm's, shared by every player.

## Save and sync

Saved per good: `sat`, and `stock` and `worth` per variety and per `InfusedKey`; and `World.clearance`.

The digest carries each good's `stock` and `sat` (rounded) and `World.money` ([[systems/net]]).

## Art

`prop-produce-warehouse.svg`; `ui-btn-market.svg` (HUD button), `ui-price-arrow.svg` (Demand arrow, recoloured by `priceTint`).

## Invariants

| id | rule | test |
|---|---|---|
| `market.sell` | a drop-off fills contracts first, then sells the rest at once; `marketOpen` is always true; the unit values and skills are as in the table above; rotten produce pays 1 coin each only after `unlock-fermentation` | `market.test.ts` |
| `sat.trapezoid` | *n* units that are not infused, at `sat`, pay unit *i* at cut `min(cap, sat × SAT_MAX_CUT + i × step)`, then `sat` rises by `n × step ÷ SAT_MAX_CUT`; *n* single sales pay the same as one sale of *n* | `market.test.ts` |
| `sat.infused` | infused units pay `mul` at the good's `sat` from before the sale and do not raise it | `market.test.ts` |
| `sat.recover` | `sat` starts at 0 and moves toward 0 by `recoverPerDay(good)` each day, every step | `market.test.ts` |
| `familiarity.market` | familiarity adds to recovery for fruit goods only | `market.test.ts` |
| — | the daily demand change moves two different fruit goods by `DEMAND_NUDGE` points, one up and one down | `market.test.ts` |
| — | contract units raise no `sat` and enter no `worth` | `market.test.ts` |

## When you change this

- New sellable item: `consignUnits`, `toStall`, a `StallGoodId` and its rows in every `StallGoodId`-keyed table (`SAT_RECOVER`, `GOOD_COST`, `GOOD_TIER`, `FEASIBLE_PER_DAY`), `unitOf`, `unitClean`, `stallGoodName`, `canConsign` for the hand prompt, the Produce Warehouse `padGoods` for vehicles, and the contract pages ([[features/contracts]]).
- Price rule: `unitClean` and `saleUnits` are shared by the drop-off sale and a contract's miss or cancel sale (`dumpFilled`); change both callers' results together.
- The Market window's numbers come from `marketDemand` and the sale from `marketQuote`; a change to the sale price math goes into both.

## Decisions

- Price drop is counted in units sold: `sat` of 1 is `SAT_MAX_CUT` of the price.
- Selling pays the sum over units (the unit-by-unit ramp), so splitting a delivery into single units earns the same as one delivery.
- Infused goods sell without adding to the price drop. That is what infusion buys at the Market.
