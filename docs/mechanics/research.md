# Research

Husband is the research role. One job. `startResearch` no-op if a job is running, already done, `requires` unmet, or `money < cost`. Pay up front. `left` ticks down. Done: `done.add`, tally that day, apply `effect`.

`unlockAll`: every row done, `money += 999`, job idle, `points = 99`. Does not grant skills. Does not reroll — [[mechanics/family]]. UI is the Cheat dock, not Research — [[ui/cheat]].

`unlockAllSkills` is a different cheat. `cheatFastResearch`: toggle. Selected while on. Job drain `× 3` on top of Speedy research. `Act.cheat` `{ k: 'research' }`. `World.cheatSpeed` is world time, not this arm. `cheatMoney` `+ 200`. `cheatPoints` `+ 10` to the shared bank.

`RESEARCH[id].name` is the visible label. Trees: plants, land, automation, trade.

`unlock-fertilizer` name **Synthetic additives**. Bag SKU stays **Synthetic fertilizer**. `unlock-better-tools` name **Gardening tools**. `unlock-hardened-tools` name **Hardened tools**. Blurb **A Hardened pickaxe lasts for more uses and mines faster than a Pickaxe. A Chainsaw chops a mature tree in fewer seconds than an Axe and lasts for more uses.**

## Three fields, three jobs

| field | semantics | job |
|---|---|---|
| `requires: readonly ResearchId[]` | AND — every id in `done` | physical necessity, enforced in `startResearchBody` |
| `reveal: readonly ResearchId[]` | OR — any id in `done`; `[]` is start | pacing; what the shelf shows and when |
| `Sku.need: readonly ResearchId[] \| 'prize'` | OR — any id in `done` | second lock on one item, not the whole row |

`requires` must never make a player ask why. Pipes need a source; a logic gate needs signals to gate. If the answer is "so the graph looks deeper", it is a `reveal` — which makes no claim about the world and is free to follow theme and workload.

`need` as a list puts an item behind two capabilities without inventing a research row for the intersection.

`researchShown(id)`: `reveal.length === 0 || reveal.some(r => done.has(r))`. `researchOpen(id)`: `requires.every(r => done.has(r))` — a row can be on the shelf and still shut. `unlock-smart-irrigation` and `unlock-heirloom` can be shown and shut. The Research card grays and the callout names the missing rows — [[ui/docks]].

`grants`: `readonly string[]` — the concepts a row turns on that no table can express, one short noun phrase each. `SKUS` and `SKILLS` already name what they gate; `grants` covers the rest, the `world.done.has(...)` feature sites. Empty on rows whose unlocks are fully covered by those two tables. Read by [[ui/cheat]] `#debug-techtree`, not by the sim. That graph omits SKUs `skuShown` false: `buy-or` `buy-and` `buy-water-system`.

`skuOpen` is unlock done (or `'start'`) and the need: `[]` | prize stock | any one of those rows done. `skuShown` is `show` alone, except `'prize'`, which is shown only while stock is banked. `'prize'` means the sku is never for sale — [[mechanics/contracts]]. `buy-freezer-large` is the only one.

## Four shelves

| tab | question |
|---|---|
| Plants | what do I grow, and how good is it |
| Land | how much ground, and what state is it in |
| Automation | what runs without me |
| Trade | how does produce become money |

Contracts is the money pipeline, not a utility: it sits in Trade with the chest and the machines. `unlock-better-tools` sits in Plants. Paving and fences leave Land, which keeps the permit ladder and the tools that break ground. `unlock-hardened-tools` sits in Land with `unlock-pickaxe`. The machines leave Automation, so Automation is one thing — water, logic, vehicles.

## Rows

Blurbs as `RESEARCH[id].blurb`. `reveal` and `requires` are lists; `—` is `[]`. Cost / duration live on `RESEARCH`.

| id | tree | reveal (OR) | requires (AND) | grants |
|---|---|---|---|---|
| unlock-fertilizer | plants | — | — | — |
| unlock-tomato | plants | — | — | — |
| unlock-grape | plants | — | — | — |
| unlock-better-tools | plants | — | — | — |
| unlock-crop-variants | plants | unlock-tomato, unlock-grape, unlock-irrigation | — | — |
| unlock-raspberry | plants | unlock-tomato, unlock-grape | — | — |
| unlock-heirloom | plants | expand-land, unlock-vehicles, unlock-crop-variants | unlock-crop-variants | — |
| unlock-expand | land | — | — | Land expansion on the map edge; +1 expansion permit |
| unlock-pickaxe | land | unlock-better-tools, unlock-expand | — | — |
| unlock-hardened-tools | land | unlock-pickaxe | unlock-pickaxe | — |
| expand-land | land | unlock-expand | unlock-expand | +1 expansion permit |
| eminent-domain | land | expand-land | expand-land | +1 expansion permit |
| unlock-landscaping | land | — | — | — |
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
| unlock-chest | trade | — | — | — |
| unlock-grinder | trade | — | — | — |
| unlock-preservatives | trade | unlock-grinder | unlock-grinder | Jam plates in almanac Ingredients |
| unlock-fermentation | trade | unlock-grinder | — | — |
| unlock-furnace | trade | unlock-fermentation | — | — |
| unlock-infusion | trade | unlock-preservatives | unlock-preservatives | — |

Seconds preference: `unlock-raspberry` 40, `unlock-heirloom` 120, `unlock-chest` 30, `unlock-grinder` 45, `unlock-fermentation` 70, `unlock-furnace` 80, `unlock-infusion` preference, `unlock-vehicles` 60, `unlock-adv-irrigation` 70, `unlock-auto-irrigation` 45, `unlock-irrigation` 30, `unlock-hardened-tools` 20.

Cost preference: `unlock-auto-irrigation` 16, `unlock-crop-variants` 16, `unlock-preservatives` 32, `unlock-furnace` 67, `unlock-hardened-tools` 100.

`unlock-hardened-tools` `effect` `unlock-sku` `buy-better-pickaxe`.

`unlock-crop-variants` and `unlock-heirloom` keep their rows. Ladder effects die: they do not change grow, seed packs, or silo columns. Seed packs are `'base'` at quality 0 with or without those rows. Skills still gate on them — [[mechanics/family]]. `buy-research-station` unlock and show `unlock-crop-variants`. How varieties are earned from seed: [[plans/next-variant]].

Synthetic is research; compost box is a start SKU. Synthetic is instant, costs a bag forever and sets `bio = false`; compost needs a box and feeding, and restores bio at `BIO_RESTORE` — [[mechanics/soil]]. Start plants shelf is four: `unlock-fertilizer`, `unlock-tomato`, `unlock-grape`, `unlock-better-tools`. `unlock-grape` cost 12, seconds 40 — preference. `unlock-crop-variants` reveals after tomato, grape, or irrigation. `unlock-heirloom` requires Crop variants and also reveals on land or vehicles. Land start shelf is `unlock-expand` and `unlock-landscaping`.

Advanced sensors and Advanced irrigation carry the money in Automation: both are where the system stops being convenience and starts being expressive, and their own SKUs are pocket change, so the research is the price. Fermentation is priced against [[mechanics/saturation]] — spirits and wine floor at `SAT_FLOOR` where crops floor higher, and they top the contract `GOOD_COST` list.

`unlock-vehicles` `effect` `unlock-sku` `buy-hangar`. Quad / tractor / trailers are not SKUs. Lens `vehicles` unhidden after this row. Not a family-study. `unlock-silos` `effect` `unlock-sku` `buy-silo-seed`. `unlock-furnace` `effect` `unlock-sku` `buy-furnace`.

`unlock-dispatch` `effect` `feature`. Automate chrome iff `unlock-dispatch` in `done`. Card **Automated dispatch**. Blurb: vehicles follow a shared stop list; the traffic light holds a vehicle only if that light is a stop. Cost 100, seconds 80 — preference. `Act.route` no-op unless this row is in `done`.

`unlock-sensors` / `unlock-advanced-sensors` / `unlock-smart-irrigation` / `unlock-contracts` / `unlock-heirloom` / `unlock-dispatch` / `unlock-crop-variants` `effect` `feature`. Advanced sensors SKUs: Logic gate + NOT. Card blurb: A Logic gate turns on from two signals: set OR if either is on, AND only while both are on. A NOT gate turns on while its input is off. Wire them so a Sprinkler or a Valve can wait on more than one sensor, or run only while another signal is off. Research face is the Logic gate, not AND — [[architecture/modules]]. Contracts board visible iff `unlock-contracts` is in `done`. Tab gating is UI. `effect` is `unlock-sku` | `expand` | `feature`. Better crop is player skills — [[mechanics/family]]. Machinery skill gates on `unlock-grinder` — [[mechanics/family]]. Machinery research face is `skill-machinery.svg` 1-1. No new research SVG.

`unlock-smart-irrigation` is the merged capstone: the crop dial and the signal input were always one idea split in half. Sprinkler HUD and sprinkler wire endpoints both read this row.

Carrot / potato / wheat start unlocked. `unlock-grape` → `pack-grape`. `unlock-raspberry` → `pack-raspberry`. Vanilla and olive have no research row and no pack. Olive is `TreeId`. No `unlock-chilli`. `unlock-infusion` → `pack-chilli` `buy-infuser`. `unlock-fermentation` → `pack-sugar-cane`; also `buy-still` `buy-barrel`. `unlock-furnace` → `buy-furnace`. Name **Furnace**. `unlock-grinder` → `buy-grinder` `buy-mill`. `unlock-preservatives` → `buy-jam` `buy-freezer` `buy-sugar`. Almanac Ingredients: jam gate `unlock-preservatives`; spirit / wine / cider gate `unlock-fermentation`; oil / flour / extract / mill sugar / flakes / vanilla-extract gate `unlock-grinder`; infuser gate `unlock-infusion`. Furnace gate `unlock-furnace`. Station has no research row. Layout is UI. — [[ui/almanac]]

`unlock-fertilizer` unlocks **synthetic**. Ordinary bag is always at the Additive store. `buy-weed-spray` gates on `unlock-fertilizer`; the research `effect` stays one SKU.

## Sku gates

`buy-fertilizer` unlock `start`. `buy-synth-fertilizer` unlock + show `unlock-fertilizer`. `buy-weed-spray` utility, unlock and show `unlock-fertilizer`.

`buy-compost-box` unlock `start`, show `start`. `buy-research-station` unlock and show `unlock-crop-variants`, Processing shelf, `haggling`.

The rotary shovel and the diamond pickaxe have no sku. Both are four-star contract prizes — [[mechanics/contracts]].

`pack-tomato` show `start`, buy `unlock-tomato`. `pack-grape` show `start`, buy `unlock-grape`. `pack-raspberry` show `unlock-grape`, buy `unlock-raspberry`. `pack-sugar-cane` show + buy `unlock-fermentation`. `pack-chilli` show + buy `unlock-infusion`, `PACK_N` at 10. No `pack-olive`. No `pack-vanilla`. No `pack-watermelon`. No `unlock-chilli`. Packs are `'base'` quality 0. `buy-freezer-large` `need: 'prize'` — shown and buyable only while one is banked.

`buy-mill` show `start`, buy `unlock-grinder`. `buy-jam` / `buy-freezer` / `buy-sugar` show `unlock-grinder`, buy `unlock-preservatives`. `buy-still` show `unlock-grinder`, buy `unlock-fermentation`. `buy-barrel` show `start`, buy `unlock-fermentation`. `buy-furnace` show `unlock-grinder`, buy `unlock-furnace`. `buy-infuser` show `unlock-preservatives`, buy `unlock-infusion`. — [[mechanics/machines]] [[mechanics/infusion]]

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

Sensors shelf (`logic`) after `unlock-sensors`. Every sensor sku shows on `unlock-sensors` except `buy-water-system` (`skuShown` false). Dual-lock `need` on the capability they read — [[mechanics/sensors]].

| sku | unlock | need |
|---|---|---|
| buy-lever, buy-button, buy-lamp, buy-pulser, buy-counter | unlock-sensors | — |
| buy-sensor-harvest, buy-sensor-day, buy-sensor-weather | unlock-sensors | — |
| buy-logic, buy-not | unlock-advanced-sensors | — |
| buy-sensor-water | unlock-sensors | unlock-irrigation |
| buy-sensor-fert | unlock-sensors | unlock-fertilizer |
| buy-sensor-variety | unlock-sensors | unlock-crop-variants |
| buy-vehicle-detector | unlock-sensors | unlock-vehicles |
| buy-traffic-light | unlock-sensors | unlock-dispatch |

Logic gate + NOT do not carry `need: unlock-sensors`: `unlock-advanced-sensors` requires `unlock-sensors`. `buy-water-system` `skuShown` false, not on the shelf, not buyable.

`buy-vehicle-detector` Sensors. Player **Pressure plate**. `buy-traffic-light` Sensors. `buy-logic` Sensors. `buy-or` `buy-and` unused.

### Land

`pack-grass`, `buy-fence` and all four paving SKUs show from `start`, buy after `unlock-landscaping`; all of them file on the Build **Land** shelf — [[items/tiles]] [[ui/build]]. `buy-pickaxe` show `start`, buy `unlock-pickaxe`. `buy-better-pickaxe` unlock and show `unlock-hardened-tools`, price 44 — preference. `buy-axe` utility, unlock and show `unlock-pickaxe`. `buy-chainsaw` utility, unlock and show `unlock-hardened-tools`, price 60 — preference. `unlock-pickaxe` effect stays `buy-pickaxe`. `unlock-hardened-tools` effect `buy-better-pickaxe`. `skuLabel` **Axe**. `skuLabel` **Chainsaw**. — [[items/tools]] [[mechanics/expansion]]

## Invariants

`research.job` — One research job. `buy-fertilizer` unlock `start`. `unlock-fertilizer` unlocks synthetic. `buy-weed-spray` utility, unlock and show `unlock-fertilizer`. `unlock-fertilizer` effect stays one SKU.

`research.tiles` — `buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`. Cosmetic. Keep `ground`.

`research.better` — Better crop is player `better-*` `saleMul` and ripen `betterGain`. Potato / wheat gated on `unlock-crop-variants`. Őstermelő gated on `unlock-heirloom`. Tree `better-*` gate none.

`research.variants` — `unlock-crop-variants` plants, cost 16, 40s, `reveal` tomato | grape | irrigation, `effect` `feature`. Ladder effects die: seed packs `'base'` quality 0 with or without it; ripen does not roll; silo does not hide columns. `buy-research-station` unlock and show that row. `unlock-heirloom` `requires` it. Both rows stay. Earn path: [[plans/next-variant]].

`research.unlockAll` — `unlockAll`: every research done, `money += 999`, job idle, `World.points = 99`. Does not grant skills. Does not reroll. Job drain ×3 is `cheatFastResearch`, not this.

`research.start` — Plants start shelf is four: `unlock-fertilizer`, `unlock-tomato`, `unlock-grape`, `unlock-better-tools`. `unlock-better-tools` plants, `reveal: []`. `unlock-grape` `reveal: []`, cost 12, seconds 40 — preference. `pack-grape` unlock `unlock-grape`, show `start`. Pack is not free on day 1. Land start shelf is `unlock-expand` and `unlock-landscaping` (`reveal: []`).

`research.reveal` — Raspberry research `reveal` tomato | grape. No olive research row. No vanilla research row. Vanilla has no pack. No `unlock-chilli`. `unlock-infusion` trade, `reveal` and `requires` `unlock-preservatives`, gates `buy-infuser` and `pack-chilli`. `pack-chilli` show + buy `unlock-infusion`. `unlock-fermentation` unlocks `pack-sugar-cane` and gates `buy-still` `buy-barrel`. `buy-still` show `unlock-grinder`, buy `unlock-fermentation`. `buy-barrel` show `start`, buy `unlock-fermentation`. `unlock-furnace` trade, `reveal` fermentation, gates `buy-furnace`, show `unlock-grinder`. `unlock-grinder` also gates `buy-mill`. `unlock-preservatives` trade, reveal `unlock-grinder`, gates `buy-jam` `buy-freezer` `buy-sugar`. Station has no research row.

`research.gates` — `better-grape` gated on `unlock-grape`. `better-apple` `better-apricot` `better-olive` `better-cherry` gate none. No `better-carrot` `better-vanilla` `better-sugar-cane` `better-chilli`. No `unlock-olive`. No `unlock-chilli`. `machinery` gated on `unlock-grinder`.

`research.infusion` — `unlock-infusion` trade, `reveal` and `requires` `unlock-preservatives`, `effect` `unlock-sku` `buy-infuser`. `buy-infuser` show `unlock-preservatives`, buy that row. `pack-chilli` show + buy that row, `PACK_N` at 10. No chilli research row. — [[mechanics/infusion]]

`research.dispatch` — `unlock-dispatch` automation, `reveal` and `requires` `unlock-vehicles`, `effect` `feature`, grants Automate chrome. Card **Automated dispatch**. Cost 100, seconds 80 preference. Automate chrome iff that row is in `done`. `buy-traffic-light` `show` `unlock-sensors` `need` `unlock-dispatch`. `Sku.tab` automation. `haggling`. `Act.route` no-op unless `unlock-dispatch` in `done`.

`research.furnace` — Own trade row, reveal fermentation, gates `buy-furnace`, show `unlock-grinder`. `buy-axe` on `unlock-pickaxe`.

`research.hardened` — `unlock-hardened-tools` land, `reveal` and `requires` `unlock-pickaxe`, cost 100, seconds 20, `effect` `unlock-sku` `buy-better-pickaxe`. `buy-better-pickaxe` unlock + show that row, price 44. `buy-chainsaw` unlock + show that row, price 60. `buy-axe` stays `unlock-pickaxe`.

`research.techtree` — `#debug-techtree` omits SKUs `skuShown` false: `buy-or` `buy-and` `buy-water-system`.

Assumption: axe `workSeconds` stays `AXES.axe.workSeconds`. Hardened tools research face is the Hardened pickaxe item; no new research SVG.
