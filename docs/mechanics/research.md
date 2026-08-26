# Research

Husband is the research role. One job. `startResearch` no-op if a job is running, already done, `requires` unmet, or `money < cost`. Pay up front. `left` ticks down. Done: `done.add`, tally that day, apply `effect`.

`unlockAll`: every row done, `money += 999`, job idle, `points = 99`. Does not grant skills. Does not reroll — [[mechanics/family]]. UI is the Cheat dock, not Research — [[ui/cheat]].

`cheatFastResearch`: job drain `× 3` on top of Speedy research. Toggle. `cheatMoney` `+ 200`. `cheatPoints` `+ 10` to the shared bank.

`RESEARCH[id].name` is the visible label. Trees: plants, land, automation, trade. 28 rows.

## Three fields, three jobs

| field | semantics | job |
|---|---|---|
| `requires: readonly ResearchId[]` | AND — every id in `done` | physical necessity, enforced in `startResearchBody` |
| `reveal: readonly ResearchId[]` | OR — any id in `done`; `[]` is start | pacing; what the shelf shows and when |
| `Sku.need: readonly ResearchId[] \| 'prize'` | OR — any id in `done` | second lock on one item, not the whole row |

`requires` must never make a player ask why. Pipes need a source; a logic gate needs signals to gate. If the answer is "so the graph looks deeper", it is a `reveal` — which makes no claim about the world and is free to follow theme and workload.

`need` as a list puts an item behind two capabilities without inventing a research row for the intersection. It also keeps the organic route from being punished: the fertilizer sensor accepts either soil row.

`researchShown(id)`: `reveal.length === 0 || reveal.some(r => done.has(r))`. `researchOpen(id)`: `requires.every(r => done.has(r))` — a row can be on the shelf and still shut. `unlock-smart-irrigation` is the only such row; the Research card grays and the callout names the missing rows — [[ui/docks]].

`gate` and `ResearchGate` are gone. 1.8.0 removed the `digs` / `mines` play-gates along with the only two rows that used them; 1.8.2 removed the empty field they left behind.

`grants`: `readonly string[]` — the concepts a row turns on that no table can express, one short noun phrase each. `SKUS` and `SKILLS` already name what they gate; `grants` covers the rest, the `world.done.has(...)` feature sites. Empty on rows whose unlocks are fully covered by those two tables. Read by [[ui/cheat]] `#debug-techtree`, not by the sim.

`skuOpen` is unlock done (or `'start'`) and the need: `[]` | prize stock | any one of those rows done. `skuShown` is `show` alone, except `'prize'`, which is shown only while stock is banked. `'prize'` means the sku is never for sale — [[mechanics/contracts]]. `buy-freezer-large` is the only one.

1.8.2 removed `unlock-smart-sprinkler`. A file written before it is not loadable and gets the existing cannot-load screen. No retired-id list, no skip, no drop, no migrate — [[architecture/save]].

## Four shelves

| tab | rows | at start | question |
|---|---|---|---|
| Plants | 7 | 4 | what do I grow, and how good is it |
| Land | 5 | 1 | how much ground, and what state is it in |
| Automation | 9 | 2 | what runs without me |
| Trade | 7 | 4 | how does produce become money |

Contracts is the money pipeline, not a utility: it sits in Trade with the boxes, the chest and the machines. Paving and fences leave Land, which keeps the permit ladder and the tools that break ground. The machines leave Automation, so Automation is one thing — water, logic, vehicles.

$1392 / 1740s over 28 rows. Day-1 shelf $160 against a $50 start.

## Rows

Blurbs as `RESEARCH[id].blurb`. `reveal` and `requires` are lists; `—` is `[]`.

| id | name | tree | $ | s | reveal (OR) | requires (AND) | grants |
|---|---|---|---|---|---|---|---|
| unlock-fertilizer | Synthetic fertilizer | plants | 10 | 30 | — | — | — |
| unlock-compost | Composting | plants | 10 | 30 | — | — | — |
| unlock-tomato | Tomato seeds | plants | 8 | 30 | — | — | — |
| unlock-watermelon | Watermelon seeds | plants | 14 | 45 | — | — | — |
| unlock-grape | Grape seeds | plants | 12 | 40 | unlock-tomato, unlock-watermelon | — | — |
| unlock-raspberry | Raspberry seeds | plants | 32 | 45 | unlock-tomato, unlock-watermelon, unlock-grape | — | — |
| unlock-heirloom | Heirloom crops | plants | 140 | 140 | expand-land, unlock-vehicles | — | Heirloom rarity column in the store |
| unlock-expand | Unlock land | land | 25 | 50 | — | — | Land expansion on the map edge; +1 expansion permit |
| unlock-pickaxe | Pickaxes | land | 12 | 40 | unlock-better-tools, unlock-expand | — | — |
| expand-land | Expand land | land | 120 | 110 | unlock-expand | unlock-expand | +1 expansion permit |
| eminent-domain | Eminent domain | land | 420 | 200 | expand-land | expand-land | +1 expansion permit |
| unlock-landscaping | Landscape architecture | land | 12 | 30 | unlock-expand | — | — |
| unlock-irrigation | Irrigation | automation | 12 | 40 | — | — | — |
| unlock-water-storage | Water storage | automation | 30 | 70 | unlock-irrigation | unlock-irrigation | — |
| unlock-auto-irrigation | Automated irrigation | automation | 20 | 55 | unlock-irrigation | unlock-irrigation | — |
| unlock-adv-irrigation | Advanced irrigation | automation | 75 | 75 | unlock-auto-irrigation | unlock-auto-irrigation | — |
| unlock-sensors | Sensors | automation | 20 | 50 | — | — | Sensors lens row |
| unlock-advanced-sensors | Advanced sensors | automation | 140 | 60 | unlock-sensors | unlock-sensors | — |
| unlock-smart-irrigation | Smart irrigation | automation | 60 | 100 | unlock-sensors | unlock-adv-irrigation, unlock-sensors | Sprinkler crop dial; Sprinkler signal input; Signal wire endpoints on sprinklers |
| unlock-vehicles | Vehicles | automation | 40 | 80 | unlock-expand | — | Quad, tractor and trailer at the hangar |
| unlock-silos | Field silos | automation | 30 | 60 | unlock-vehicles | unlock-vehicles | — |
| unlock-contracts | Contracts | trade | 10 | 30 | — | — | Contracts board at the stall; Reputation decay |
| unlock-better-tools | Better gardening tools | trade | 16 | 45 | — | — | — |
| unlock-large-box | Fruit boxes | trade | 15 | 40 | — | — | — |
| unlock-chest | Chest | trade | 14 | 40 | unlock-large-box | — | — |
| unlock-grinder | Seed grinder | trade | 20 | 50 | — | — | — |
| unlock-preservatives | Preservatives | trade | 30 | 70 | unlock-grinder | unlock-grinder | Jam icon in the almanac |
| unlock-fermentation | Fermentation | trade | 45 | 85 | unlock-grinder | — | — |

Fertilizer and compost are identical in money and time on purpose: one decision made two ways, so the whole difference lives in what they do. Synthetic is instant, costs $15 a bag forever and sets `bio = false`; compost needs a $20 box and feeding, and restores bio at `BIO_RESTORE` — [[mechanics/soil]]. Neither is downstream of the other. `unlock-heirloom` reveals on land or vehicles, not on either soil row.

Advanced sensors and Advanced irrigation carry the money in Automation: both are where the system stops being convenience and starts being expressive, and their own SKUs are pocket change, so the research is the price. Fermentation is priced against [[mechanics/saturation]] — spirits and wine floor at `SAT_FLOOR` 0.25 where crops floor at 0.40–0.55, and they top the contract `GOOD_COST` list.

`unlock-vehicles` `effect` `unlock-sku` `buy-hangar`. Quad / tractor / trailers are not SKUs. Lens `vehicles` unhidden after this row. Not a family-study. `unlock-silos` `effect` `unlock-sku` `buy-silo-seed`.

`unlock-sensors` / `unlock-advanced-sensors` / `unlock-smart-irrigation` / `unlock-contracts` / `unlock-heirloom` `effect` `feature`. Contracts board visible iff `unlock-contracts` is in `done`. Tab gating is UI. `effect` is `unlock-sku` | `expand` | `feature`. No `bump-*`. No `{ kind: 'sale-mul' }`. Better crop is player skills — [[mechanics/family]].

`unlock-smart-irrigation` is the merged capstone: the crop dial and the signal input were always one idea split in half. Sprinkler HUD and sprinkler wire endpoints both read this row. `unlock-smart-sprinkler` no longer exists.

Carrot / potato / wheat start unlocked. `unlock-grape` → `pack-grape`. `unlock-raspberry` → `pack-raspberry`. Vanilla and olive have no research row and no pack. `unlock-fermentation` → `pack-sugar-cane`; also `buy-still` `buy-barrel`. `unlock-grinder` → `buy-grinder` `buy-mill`. `unlock-preservatives` → `buy-jam` `buy-freezer` `buy-sugar`. Almanac jam third icon when `unlock-preservatives` done. No `unlock-mill` `unlock-jam` `unlock-still` `unlock-barrel` `unlock-freezer` `unlock-pumpjack`.

`unlock-large-box` unlocks **large** only. Small box is in the shop from the start.

`unlock-fertilizer` unlocks **synthetic**. Ordinary bag is always in the shop. `buy-weed-spray` gates on `unlock-fertilizer`; the research `effect` stays one SKU.

## Shop gates

`buy-box` unlock `start`, $6. `buy-box-large` unlock `unlock-large-box`, $18.

`buy-fertilizer` unlock `start`, $18. `buy-synth-fertilizer` unlock + show `unlock-fertilizer`, $15. `buy-weed-spray` $12 utility, unlock and show `unlock-fertilizer`.

`buy-compost-box` unlock `unlock-compost`, show `start`, $20. Shown from the start beside the synthetic route, never behind it.

The rotary shovel and the diamond pickaxe have no sku. Both are four-star contract prizes — [[mechanics/contracts]].

`pack-grape` $16 show `start`, buy `unlock-grape`. `pack-raspberry` $22 show `unlock-grape`, buy `unlock-raspberry`. `pack-sugar-cane` $8 show + buy `unlock-fermentation`. `buy-freezer-large` $0 `need: 'prize'` — shown and buyable only while one is banked.

`buy-mill` $35 show `start`, buy `unlock-grinder`. `buy-jam` $40 / `buy-freezer` $36 / `buy-sugar` $16 show `unlock-grinder`, buy `unlock-preservatives`. `buy-still` $45 / `buy-barrel` $28 show `start`, buy `unlock-fermentation`. — [[mechanics/machines]]

### Water

Three rows, three jobs. Irrigation routes the pump the farm already owns; Water storage sells a second source; Automated and Advanced sell what throws the water — [[mechanics/water]].

| sku | $ | show | unlock |
|---|---|---|---|
| buy-pipe | 4 | start | unlock-irrigation |
| buy-tap | 10 | start | unlock-irrigation |
| buy-rain-tank | 20 | start | start |
| buy-pumpjack | 40 | start | unlock-water-storage |
| buy-well | 75 | unlock-irrigation | unlock-water-storage |
| buy-sprinkler | 15 | unlock-irrigation | unlock-auto-irrigation |
| buy-valve | 6 | unlock-auto-irrigation | unlock-auto-irrigation |
| buy-sprinkler-vert | 30 | unlock-auto-irrigation | unlock-adv-irrigation |
| buy-sprinkler-large | 33 | unlock-auto-irrigation | unlock-adv-irrigation |

Rainwater tank is not research. It is on the shelf from the start.

### Vehicles

`buy-hangar` $80 automation, show `unlock-irrigation`, buy `unlock-vehicles`. `haggling` applies. `buy-silo-seed` / `buy-silo-spray` / `buy-silo-produce` $70 automation, show `unlock-vehicles`, buy `unlock-silos`, haggling applies. Quad / tractor / trailer hangar-buys `QUAD_PRICE` `TRACTOR_PRICE` `TRAILER_*_PRICE`, not shop place SKUs, haggling does not discount. — [[mechanics/vehicles]]

### Sensors

Sensors shelf (`logic`) after `unlock-sensors`. Every sensor sku shows on `unlock-sensors`. Nine stand alone; four dual-lock through `need` on the capability they read — [[mechanics/sensors]].

| sku | unlock | need |
|---|---|---|
| buy-lever, buy-button, buy-lamp, buy-pulser, buy-counter | unlock-sensors | — |
| buy-sensor-harvest, buy-sensor-day | unlock-sensors | — |
| buy-and, buy-or, buy-not | unlock-advanced-sensors | — |
| buy-smart-valve | unlock-smart-irrigation | — |
| buy-sensor-water | unlock-sensors | unlock-irrigation |
| buy-sensor-fert | unlock-sensors | unlock-fertilizer, unlock-compost |
| buy-water-system | unlock-sensors | unlock-adv-irrigation |
| buy-vehicle-detector | unlock-sensors | unlock-vehicles |

AND / OR / NOT no longer carry `need: unlock-sensors`: `unlock-advanced-sensors` requires `unlock-sensors`, so the second lock was compensating for a schema that could not say it. `buy-smart-valve` the same through `unlock-smart-irrigation`.

`buy-smart-valve` Water (flow). `buy-vehicle-detector` Sensors. Prices [[mechanics/sensors]].

### Land

`pack-grass` $1, `buy-fence` $10 and all three paving SKUs show from `start`, buy after `unlock-landscaping` — [[items/tiles]]. `buy-better-pickaxe` show after `unlock-pickaxe`. Both pickaxes buy on `unlock-pickaxe` — [[mechanics/expansion]].
