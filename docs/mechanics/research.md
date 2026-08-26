# Research

Husband is the research role. One job. `startResearch` no-op if a job is running, already done, `requires` unmet, or `money < cost`. Pay up front. `left` ticks down. Done: `done.add`, tally that day, apply `effect`.

`unlockAll`: every row done, `money += 999`, job idle, `points = 99`. Does not grant skills. Does not reroll — [[mechanics/family]]. UI is the Cheat dock, not Research — [[ui/cheat]].

`cheatFastResearch`: job drain `× 3` on top of Speedy research. Toggle. `cheatMoney` `+ 200`. `cheatPoints` `+ 10` to the shared bank.

`RESEARCH[id].name` is the visible label. Trees: plants, land, automation, trade.

## Three fields, three jobs

| field | semantics | job |
|---|---|---|
| `requires: readonly ResearchId[]` | AND — every id in `done` | physical necessity, enforced in `startResearchBody` |
| `reveal: readonly ResearchId[]` | OR — any id in `done`; `[]` is start | pacing; what the shelf shows and when |
| `Sku.need: readonly ResearchId[] \| 'prize'` | OR — any id in `done` | second lock on one item, not the whole row |

`requires` must never make a player ask why. Pipes need a source; a logic gate needs signals to gate. If the answer is "so the graph looks deeper", it is a `reveal` — which makes no claim about the world and is free to follow theme and workload.

`need` as a list puts an item behind two capabilities without inventing a research row for the intersection. It also keeps the organic route from being punished: the fertilizer sensor accepts either soil row.

`researchShown(id)`: `reveal.length === 0 || reveal.some(r => done.has(r))`. `researchOpen(id)`: `requires.every(r => done.has(r))` — a row can be on the shelf and still shut. `unlock-smart-irrigation` is the only such row; the Research card grays and the callout names the missing rows — [[ui/docks]].

`grants`: `readonly string[]` — the concepts a row turns on that no table can express, one short noun phrase each. `SKUS` and `SKILLS` already name what they gate; `grants` covers the rest, the `world.done.has(...)` feature sites. Empty on rows whose unlocks are fully covered by those two tables. Read by [[ui/cheat]] `#debug-techtree`, not by the sim.

`skuOpen` is unlock done (or `'start'`) and the need: `[]` | prize stock | any one of those rows done. `skuShown` is `show` alone, except `'prize'`, which is shown only while stock is banked. `'prize'` means the sku is never for sale — [[mechanics/contracts]]. `buy-freezer-large` is the only one.

## Four shelves

| tab | question |
|---|---|
| Plants | what do I grow, and how good is it |
| Land | how much ground, and what state is it in |
| Automation | what runs without me |
| Trade | how does produce become money |

Contracts is the money pipeline, not a utility: it sits in Trade with the boxes, the chest and the machines. Paving and fences leave Land, which keeps the permit ladder and the tools that break ground. The machines leave Automation, so Automation is one thing — water, logic, vehicles.

## Rows

Blurbs as `RESEARCH[id].blurb`. `reveal` and `requires` are lists; `—` is `[]`. Cost / duration live on `RESEARCH`.

| id | tree | reveal (OR) | requires (AND) | grants |
|---|---|---|---|---|
| unlock-fertilizer | plants | — | — | — |
| unlock-compost | plants | — | — | — |
| unlock-tomato | plants | — | — | — |
| unlock-watermelon | plants | — | — | — |
| unlock-grape | plants | unlock-tomato, unlock-watermelon | — | — |
| unlock-raspberry | plants | unlock-tomato, unlock-watermelon, unlock-grape | — | — |
| unlock-heirloom | plants | expand-land, unlock-vehicles | — | Heirloom rarity column in the store |
| unlock-expand | land | — | — | Land expansion on the map edge; +1 expansion permit |
| unlock-pickaxe | land | unlock-better-tools, unlock-expand | — | — |
| expand-land | land | unlock-expand | unlock-expand | +1 expansion permit |
| eminent-domain | land | expand-land | expand-land | +1 expansion permit |
| unlock-landscaping | land | unlock-expand | — | — |
| unlock-irrigation | automation | — | — | — |
| unlock-water-storage | automation | unlock-irrigation | unlock-irrigation | — |
| unlock-auto-irrigation | automation | unlock-irrigation | unlock-irrigation | — |
| unlock-adv-irrigation | automation | unlock-auto-irrigation | unlock-auto-irrigation | — |
| unlock-sensors | automation | — | — | Sensors lens row |
| unlock-advanced-sensors | automation | unlock-sensors | unlock-sensors | — |
| unlock-smart-irrigation | automation | unlock-sensors | unlock-adv-irrigation, unlock-sensors | Sprinkler crop dial; Sprinkler signal input; Signal wire endpoints on sprinklers |
| unlock-vehicles | automation | unlock-expand | — | Quad, tractor and trailer at the hangar |
| unlock-dispatch | automation | unlock-vehicles | unlock-vehicles | Automate chrome |
| unlock-silos | automation | unlock-vehicles | unlock-vehicles | — |
| unlock-contracts | trade | — | — | Contracts board at the stall; Reputation decay |
| unlock-better-tools | trade | — | — | — |
| unlock-large-box | trade | — | — | — |
| unlock-chest | trade | unlock-large-box | — | — |
| unlock-grinder | trade | — | — | — |
| unlock-preservatives | trade | unlock-grinder | unlock-grinder | Jam icon in the almanac |
| unlock-fermentation | trade | unlock-grinder | — | — |

Fertilizer and compost are identical in money and time on purpose: one decision made two ways, so the whole difference lives in what they do. Synthetic is instant, costs a bag forever and sets `bio = false`; compost needs a box and feeding, and restores bio at `BIO_RESTORE` — [[mechanics/soil]]. Neither is downstream of the other. `unlock-heirloom` reveals on land or vehicles, not on either soil row.

Advanced sensors and Advanced irrigation carry the money in Automation: both are where the system stops being convenience and starts being expressive, and their own SKUs are pocket change, so the research is the price. Fermentation is priced against [[mechanics/saturation]] — spirits and wine floor at `SAT_FLOOR` where crops floor higher, and they top the contract `GOOD_COST` list.

`unlock-vehicles` `effect` `unlock-sku` `buy-hangar`. Quad / tractor / trailers are not SKUs. Lens `vehicles` unhidden after this row. Not a family-study. `unlock-silos` `effect` `unlock-sku` `buy-silo-seed`.

`unlock-dispatch` `effect` `feature`. Automate chrome iff `unlock-dispatch` in `done`. Card **Automated dispatch**. Blurb: vehicles follow a shared stop list; the traffic light holds a vehicle only if that light is a stop. Cost 35, seconds 70 — preference, vehicles/silos band. `Act.route` no-op unless this row is in `done`.

`unlock-sensors` / `unlock-advanced-sensors` / `unlock-smart-irrigation` / `unlock-contracts` / `unlock-heirloom` / `unlock-dispatch` `effect` `feature`. Contracts board visible iff `unlock-contracts` is in `done`. Tab gating is UI. `effect` is `unlock-sku` | `expand` | `feature`. Better crop is player skills — [[mechanics/family]].

`unlock-smart-irrigation` is the merged capstone: the crop dial and the signal input were always one idea split in half. Sprinkler HUD and sprinkler wire endpoints both read this row.

Carrot / potato / wheat start unlocked. `unlock-grape` → `pack-grape`. `unlock-raspberry` → `pack-raspberry`. Vanilla and olive have no research row and no pack. `unlock-fermentation` → `pack-sugar-cane`; also `buy-still` `buy-barrel`. `unlock-grinder` → `buy-grinder` `buy-mill`. `unlock-preservatives` → `buy-jam` `buy-freezer` `buy-sugar`. Almanac jam third icon when `unlock-preservatives` done.

`unlock-large-box` unlocks **large** only. Small box is in the shop from the start.

`unlock-fertilizer` unlocks **synthetic**. Ordinary bag is always in the shop. `buy-weed-spray` gates on `unlock-fertilizer`; the research `effect` stays one SKU.

## Shop gates

`buy-box` unlock `start`. `buy-box-large` unlock `unlock-large-box`.

`buy-fertilizer` unlock `start`. `buy-synth-fertilizer` unlock + show `unlock-fertilizer`. `buy-weed-spray` utility, unlock and show `unlock-fertilizer`.

`buy-compost-box` unlock `unlock-compost`, show `start`. Shown from the start beside the synthetic route, never behind it.

The rotary shovel and the diamond pickaxe have no sku. Both are four-star contract prizes — [[mechanics/contracts]].

`pack-grape` show `start`, buy `unlock-grape`. `pack-raspberry` show `unlock-grape`, buy `unlock-raspberry`. `pack-sugar-cane` show + buy `unlock-fermentation`. `buy-freezer-large` `need: 'prize'` — shown and buyable only while one is banked.

`buy-mill` show `start`, buy `unlock-grinder`. `buy-jam` / `buy-freezer` / `buy-sugar` show `unlock-grinder`, buy `unlock-preservatives`. `buy-still` / `buy-barrel` show `start`, buy `unlock-fermentation`. — [[mechanics/machines]]

### Water

Three rows, three jobs. Irrigation routes the pump the farm already owns; Water storage sells a second source; Automated and Advanced sell what throws the water — [[mechanics/water]].

| sku | show | unlock |
|---|---|---|
| buy-pipe | start | unlock-irrigation |
| buy-tap | start | unlock-irrigation |
| buy-rain-tank | start | start |
| buy-pumpjack | start | unlock-water-storage |
| buy-well | unlock-irrigation | unlock-water-storage |
| buy-sprinkler | unlock-irrigation | unlock-auto-irrigation |
| buy-valve | unlock-auto-irrigation | unlock-auto-irrigation |
| buy-sprinkler-vert | unlock-auto-irrigation | unlock-adv-irrigation |
| buy-sprinkler-large | unlock-auto-irrigation | unlock-adv-irrigation |

Rainwater tank is not research. It is on the shelf from the start.

### Vehicles

`buy-hangar` automation, show `unlock-irrigation`, buy `unlock-vehicles`. `haggling` applies. `buy-silo-seed` / `buy-silo-spray` / `buy-silo-produce` automation, show `unlock-vehicles`, buy `unlock-silos`, haggling applies. Quad / tractor / trailer hangar-buys `QUAD_PRICE` `TRACTOR_PRICE` `TRAILER_*_PRICE`, not shop place SKUs, haggling does not discount. Automate chrome after `unlock-dispatch`. — [[mechanics/vehicles]]

### Sensors

Sensors shelf (`logic`) after `unlock-sensors`. Every sensor sku shows on `unlock-sensors`. Dual-lock `need` on the capability they read — [[mechanics/sensors]].

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
| buy-traffic-light | unlock-sensors | unlock-dispatch |

AND / OR / NOT do not carry `need: unlock-sensors`: `unlock-advanced-sensors` requires `unlock-sensors`. `buy-smart-valve` the same through `unlock-smart-irrigation`.

`buy-smart-valve` Water (flow). `buy-vehicle-detector` Sensors. `buy-traffic-light` Sensors.

### Land

`pack-grass`, `buy-fence` and all three paving SKUs show from `start`, buy after `unlock-landscaping` — [[items/tiles]]. `buy-better-pickaxe` show after `unlock-pickaxe`. Both pickaxes buy on `unlock-pickaxe` — [[mechanics/expansion]].

## Invariants

`research.job` — One research job. `buy-box` unlock `start`. `buy-box-large` unlock `unlock-large-box`. `buy-fertilizer` unlock `start`. `unlock-fertilizer` unlocks synthetic. `buy-weed-spray` utility, unlock and show `unlock-fertilizer`. `unlock-fertilizer` effect stays one SKU.

`research.tiles` — `buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`. Cosmetic. Keep `ground`.

`research.better` — Better crop is player `better-*` `saleMul` and ripen `extraUp1`. Őstermelő gated on `unlock-heirloom`.

`research.unlockAll` — `unlockAll`: every research done, `money += 999`, job idle, `World.points = 99`. Does not grant skills. Does not reroll.

`research.reveal` — Raspberry research `reveal` is `unlock-grape`. Olive `reveal: unlock-tomato`. `pack-vanilla` shows after raspberry; buy requires `vanilla-tending`. `unlock-fermentation` automation unlocks `pack-sugar-cane` and gates `buy-still` `buy-barrel`. `unlock-grinder` also gates `buy-mill`. `unlock-preservatives` automation, reveal `unlock-grinder`, gates `buy-jam` `buy-freezer` `buy-sugar`.

`research.gates` — `better-olive` `better-grape` `better-sugar-cane` gated on `unlock-olive` / `unlock-grape` / `unlock-fermentation`. `vanilla-tending` gated on `unlock-raspberry`. `better-vanilla` gated on `vanilla-tending`. No `better-*` for `TreeId`.

`research.dispatch` — `unlock-dispatch` automation, `reveal` and `requires` `unlock-vehicles`, `effect` `feature`, grants Automate chrome. Card **Automated dispatch**. Cost 35, seconds 70 preference. Automate chrome iff that row is in `done`. `buy-traffic-light` `show` `unlock-sensors` `need` `unlock-dispatch`. `Sku.tab` automation. `haggling`. `Act.route` no-op unless `unlock-dispatch` in `done`.
