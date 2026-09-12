# Research

Husband is the research role. One job. `startResearch` no-op if a job is running, already done, `requires` unmet, or `money < cost`. Pay up front. `left` ticks down. Done: `done.add`, tally that day, apply `effect`.

`unlockAll`: every row done, `money += 999`, job idle, `points = 99`. Does not grant skills. Does not reroll — [[mechanics/family]]. UI is the Cheat dock, not Research — [[ui/cheat]].

`unlockAllSkills` is a different cheat. `cheatFastResearch`: toggle. Job drain `× 3`. `Act.cheat` `{ k: 'research' }`. `World.cheatSpeed` is world time, not this arm. `cheatMoney` `+ 200`. `cheatPoints` `+ 10` to the shared bank.

`RESEARCH[id].name` is the visible label. Trees: plants, land, automation, trade. `unlock-better-tools` name **Gardening tools**. `unlock-hardened-tools` name **Hardened tools**. Descriptions as `RESEARCH[id].blurb`. Gardening tools: **A Pickaxe mines Rock into untilled ground you can till, and mines Very hard soil into Infertile soil. An Axe chops a mature tree into Wood. Weed spray clears a Weed on a tilled plot. A Large bucket holds more water than a Bucket, so you Fill less often at a Pump.** Hardened tools description names Better shovel, Hardened pickaxe, and Chainsaw: **A Better shovel tills faster than a Shovel and lasts for more uses. A Hardened pickaxe lasts for more uses and mines faster than a Pickaxe. A Chainsaw chops a mature tree in fewer seconds than an Axe and lasts for more uses.**

## Three fields, three jobs

| field | semantics | job |
|---|---|---|
| `requires: readonly ResearchId[]` | AND — every id in `done` | physical necessity, enforced in `startResearchBody` |
| `reveal: readonly ResearchId[]` | OR — any id in `done`; `[]` is start | pacing; what the shelf shows and when |
| `Sku.need: readonly ResearchId[] \| 'prize'` | OR — any id in `done` | second lock on one item, not the whole row |

`requires` must never make a player ask why. Pipes need a source; a logic gate needs signals to gate. If the answer is so the graph looks deeper, it is a `reveal`.

`researchShown(id)`: `reveal.length === 0 || reveal.some(r => done.has(r))`, except `unlock-necronomicon`, which is shut until `World.grandma` is `told` whatever `reveal` says — [[mechanics/necronomicon]] `necro.reveal`. `researchOpen(id)`: `requires.every(r => done.has(r))`. A row can be on the shelf and still shut. The Research card grays and the callout names the missing rows — [[ui/docks]].

`grants`: `readonly string[]` — the concepts a row turns on that no table can express. Empty on rows whose unlocks are fully covered by `SKUS` and `SKILLS`. Read by [[ui/cheat]] `#debug-techtree`, not by the sim. That graph omits SKUs `skuShown` false: `buy-or` `buy-and` `buy-water-system`.

`skuOpen` is unlock done (or `'start'`) and the need: `[]` | prize stock | any one of those rows done. `skuShown` is `show` alone, except `'prize'`, which is shown only while stock is banked. `'prize'` means the sku is never for sale — [[mechanics/contracts]]. `buy-freezer-large` is the only one.

## Four shelves

| tab | question |
|---|---|
| Plants | what do I grow, and how good is it |
| Land | how much ground, and what state is it in |
| Automation | what runs without me |
| Trade | how does produce become money |

Contracts sits in Trade with the machines. `unlock-better-tools` sits in Plants. Paving and fences file on the Build Land shelf. `unlock-hardened-tools` sits in Land. Machines sit in Trade. Automation is water, logic, vehicles.

## Rows

`reveal` and `requires` are lists; `—` is `[]`. Cost / duration live on `RESEARCH`. Seconds and cost preference as named on `RESEARCH`. `unlock-fermentation` cost preference.

| id | tree | reveal (OR) | requires (AND) | grants |
|---|---|---|---|---|
| unlock-tomato | plants | — | — | — |
| unlock-grape | plants | — | — | — |
| unlock-better-tools | plants | — | — | — |
| unlock-crop-variants | plants | unlock-tomato, unlock-grape, unlock-irrigation | — | — |
| unlock-raspberry | plants | unlock-tomato, unlock-grape | — | — |
| unlock-heirloom | plants | expand-land, unlock-vehicles, unlock-crop-variants | unlock-crop-variants | — |
| unlock-expand | land | — | — | Land expansion on the map edge; +1 expansion permit; Land quality lens |
| unlock-hardened-tools | land | unlock-better-tools | unlock-better-tools | — |
| expand-land | land | unlock-expand | unlock-expand | +1 expansion permit |
| eminent-domain | land | expand-land | expand-land | +1 expansion permit |
| unlock-landscaping | land | — | — | — |
| unlock-irrigation | automation | — | — | — |
| unlock-water-storage | automation | unlock-irrigation | unlock-irrigation | — |
| unlock-auto-irrigation | automation | unlock-irrigation | unlock-irrigation | Water need lens |
| unlock-adv-irrigation | automation | unlock-auto-irrigation | unlock-auto-irrigation | — |
| unlock-sensors | automation | — | — | Sensors lens row |
| unlock-advanced-sensors | automation | unlock-sensors | unlock-sensors | — |
| unlock-smart-irrigation | automation | unlock-sensors | unlock-adv-irrigation, unlock-sensors | Sprinkler crop dial; Sprinkler signal input; Signal wire endpoints on sprinklers |
| unlock-vehicles | automation | unlock-expand | — | Quad, tractor and trailer at the hangar |
| unlock-dispatch | automation | unlock-vehicles | unlock-vehicles | Automate chrome |
| unlock-silos | automation | unlock-vehicles | unlock-vehicles | — |
| unlock-contracts | trade | — | — | Contracts board at the stall; Reputation decay |
| unlock-grinder | trade | — | — | — |
| unlock-preservatives | trade | unlock-grinder | unlock-grinder | Jam plates in almanac Ingredients |
| unlock-fermentation | trade | unlock-grinder | — | Rotten consign $1 |
| unlock-furnace | trade | unlock-fermentation | — | — |
| unlock-infusion | trade | unlock-preservatives | unlock-preservatives | — |
| unlock-necronomicon | trade | — | — | The Necronomicon on the Build Automation shelf |

`unlock-crop-variants` and `unlock-heirloom` keep their rows. Ladder effects die: they do not change grow, seed packs, or silo columns. Seed packs are `'base'` at quality 0 with or without those rows. Skills still gate on them — [[mechanics/family]]. `buy-research-station` unlock and show `unlock-crop-variants`. How varieties are earned from seed: [[plans/next-variant]].

Compost box is a start SKU. Chest is a start SKU. Plants start shelf is three: `unlock-tomato`, `unlock-grape`, `unlock-better-tools`. Land start shelf is `unlock-expand` and `unlock-landscaping`.

`unlock-vehicles` `effect` `unlock-sku` `buy-hangar`. Quad / tractor / trailers are not SKUs. Lens `vehicles` unhidden after this row. `unlock-silos` `effect` `unlock-sku` `buy-silo-seed`. `unlock-furnace` `effect` `unlock-sku` `buy-furnace`. `unlock-dispatch` `effect` `feature`. Automate chrome iff `unlock-dispatch` in `done`. Card **Automated dispatch**. `Act.route` no-op unless this row is in `done`.

`unlock-sensors` / `unlock-advanced-sensors` / `unlock-smart-irrigation` / `unlock-contracts` / `unlock-heirloom` / `unlock-dispatch` / `unlock-crop-variants` `effect` `feature`. `unlock-smart-irrigation` is the merged capstone: sprinkler HUD and sprinkler wire endpoints both read this row. Carrot / potato / wheat start unlocked. Almanac Ingredients gates: jam `unlock-preservatives`; spirit / wine / cider `unlock-fermentation`; mill goods `unlock-grinder`; infuser `unlock-infusion`; furnace `unlock-furnace`. Station and sorter have no research row. — [[ui/almanac]]

Ordinary bag is always at the Additive store. Compost feeds like fertilizer. `buy-weed-spray` gates on `unlock-better-tools`. `unlock-better-tools` `effect` `unlock-sku` `buy-pickaxe`.

## Sku gates

`buy-fertilizer` unlock `start`. `buy-weed-spray` utility, unlock and show `unlock-better-tools`. `buy-compost-box` unlock `start`, show `start`. `buy-chest` unlock `start`, show `start`, price preference. `buy-research-station` unlock and show `unlock-crop-variants`. The rotary shovel and the diamond pickaxe have no sku; both are four-star contract prizes — [[mechanics/contracts]].

`pack-tomato` show `start`, buy `unlock-tomato`. `pack-grape` show `start`, buy `unlock-grape`. `pack-raspberry` show `unlock-grape`, buy `unlock-raspberry`. `pack-sugar-cane` show + buy `unlock-fermentation`. `pack-chilli` show + buy `unlock-infusion`. `pack-grass` show `start`, buy `unlock-landscaping`. No `pack-olive`. No `pack-vanilla`. No `pack-watermelon`. No `unlock-chilli`. Packs are `'base'` quality 0. `buy-freezer-large` `need: 'prize'`.

`buy-mill` show `start`, buy `unlock-grinder`. `buy-jam` / `buy-freezer` / `buy-sugar` show `unlock-grinder`, buy `unlock-preservatives`. `buy-still` show `unlock-grinder`, buy `unlock-fermentation`. `buy-barrel` show `start`, buy `unlock-fermentation`. `buy-furnace` show `unlock-grinder`, buy `unlock-furnace`. `buy-infuser` show `unlock-preservatives`, buy `unlock-infusion`. `buy-sorter` show + buy `unlock-crop-variants`. — [[mechanics/machines]] [[mechanics/infusion]]

`buy-freezer` price preference.

### Water

Three rows, three jobs. Irrigation routes the pump the farm already owns; Water storage sells a second source; Automated and Advanced sell what throws the water — [[mechanics/water]].

| sku | show | unlock |
|---|---|---|
| buy-pipe | start | unlock-irrigation |
| buy-tap | start | unlock-irrigation |
| buy-pumpjack | start | unlock-water-storage |
| buy-well | unlock-irrigation | unlock-water-storage |
| buy-sprinkler | unlock-irrigation | unlock-auto-irrigation |
| buy-valve | unlock-auto-irrigation | unlock-auto-irrigation |
| buy-sprinkler-vert | unlock-auto-irrigation | unlock-adv-irrigation |
| buy-sprinkler-large | unlock-auto-irrigation | unlock-adv-irrigation |

`buy-pumpjack` and `buy-well` price preference.

### Vehicles

`buy-hangar` automation, show `unlock-irrigation`, buy `unlock-vehicles`. `buy-silo-seed` / `buy-silo-spray` / `buy-silo-produce` automation, show `unlock-vehicles`, buy `unlock-silos`. Quad / tractor / trailer hangar-buys not shop place SKUs, not `skuPrice`. Automate chrome after `unlock-dispatch`. — [[mechanics/vehicles]]

### Sensors

Sensors shelf (`logic`) after `unlock-sensors`. Every sensor sku shows on `unlock-sensors` except `buy-water-system` (`skuShown` false). Dual-lock `need` on the capability they read — [[mechanics/sensors]].

| sku | unlock | need |
|---|---|---|
| buy-lever, buy-button, buy-lamp, buy-pulser, buy-counter | unlock-sensors | — |
| buy-sensor-harvest, buy-sensor-day, buy-sensor-weather | unlock-sensors | — |
| buy-logic, buy-not | unlock-advanced-sensors | — |
| buy-sensor-water | unlock-sensors | unlock-irrigation |
| buy-sensor-fert | unlock-sensors | — |
| buy-sensor-variety | unlock-sensors | unlock-crop-variants |
| buy-vehicle-detector | unlock-sensors | unlock-vehicles |
| buy-traffic-light | unlock-sensors | unlock-dispatch |

Logic gate + NOT do not carry `need: unlock-sensors`: `unlock-advanced-sensors` requires `unlock-sensors`. `buy-sensor-fert` `need: []`. `buy-water-system` `skuShown` false. `buy-or` `buy-and` unused.

### Land

`buy-fence` and all four paving SKUs show from `start`, buy after `unlock-landscaping`; they file on the Build **Land** shelf — [[items/tiles]] [[ui/build]]. `pack-grass` show from `start`, buy after `unlock-landscaping`; sold at the Seed silo — [[mechanics/inventory]] `inventory.grass-silo`. `buy-pickaxe` show `start`, buy `unlock-better-tools`. `buy-better-pickaxe` unlock and show `unlock-hardened-tools`. `buy-axe` utility, unlock and show `unlock-better-tools`. `buy-chainsaw` utility, unlock and show `unlock-hardened-tools`. `buy-better-shovel` unlock and show `unlock-hardened-tools`. `buy-bucket-large` unlock `unlock-better-tools`, show `start`. `unlock-better-tools` effect `buy-pickaxe`. `unlock-hardened-tools` effect `buy-better-shovel`. Axe `workSeconds` stays `AXES.axe.workSeconds`. Hardened tools research face matches Better shovel, Hardened pickaxe, and Chainsaw. — [[items/tools]] [[mechanics/expansion]]

## Invariants

`research.job` — One research job; `buy-fertilizer` unlock `start`; `buy-weed-spray` utility, unlock and show `unlock-better-tools`; `unlock-better-tools` effect `buy-pickaxe`.

`research.tiles` — `buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`; cosmetic; keep `ground`.

`research.better` — Better crop is player `better-*` `saleMul` and ripen `betterGain`; potato / wheat gated on `unlock-crop-variants`; Őstermelő gated on `unlock-heirloom`; tree `better-*` gate none.

`research.variants` — `unlock-crop-variants` plants, `reveal` tomato | grape | irrigation, `effect` `feature`; ladder effects die: seed packs `'base'` quality 0 with or without it; ripen does not roll; silo does not hide columns; `buy-research-station` unlock and show that row; `unlock-heirloom` `requires` it; both rows stay; earn path: [[plans/next-variant]].

`research.unlockAll` — `unlockAll`: every research done, `money += 999`, job idle, `World.points = 99`; does not grant skills; does not reroll; job drain ×3 is `cheatFastResearch`, not this.

`research.start` — Plants start shelf is three: `unlock-tomato`, `unlock-grape`, `unlock-better-tools`; `unlock-better-tools` plants, `reveal: []`; `unlock-grape` `reveal: []`; `pack-grape` unlock `unlock-grape`, show `start`; pack is not free on day 1; land start shelf is `unlock-expand` and `unlock-landscaping` (`reveal: []`).

`research.reveal` — Raspberry research `reveal` tomato | grape; no olive research row; no vanilla research row; vanilla has no pack; no `unlock-chilli`; `unlock-infusion` trade, `reveal` and `requires` `unlock-preservatives`, gates `buy-infuser` and `pack-chilli`; `unlock-fermentation` unlocks `pack-sugar-cane` and gates `buy-still` `buy-barrel`; rotten consign `$1` iff `unlock-fermentation` in `done`; `unlock-furnace` trade, `reveal` fermentation, gates `buy-furnace`, show `unlock-grinder`; `unlock-grinder` also gates `buy-mill`; `unlock-preservatives` trade, reveal `unlock-grinder`, gates `buy-jam` `buy-freezer` `buy-sugar`; station has no research row.

`research.gates` — `better-grape` gated on `unlock-grape`; `better-apple` `better-apricot` `better-olive` `better-cherry` gate none; no `better-carrot` `better-vanilla` `better-sugar-cane` `better-chilli` `better-grass`; no `unlock-olive`; no `unlock-chilli`; `machinery` gated on `unlock-grinder`.

`research.infusion` — `unlock-infusion` trade, `reveal` and `requires` `unlock-preservatives`, `effect` `unlock-sku` `buy-infuser`; `buy-infuser` show `unlock-preservatives`, buy that row; `pack-chilli` show + buy that row; no chilli research row — [[mechanics/infusion]].

`research.dispatch` — `unlock-dispatch` automation, `reveal` and `requires` `unlock-vehicles`, `effect` `feature`, grants Automate chrome; card **Automated dispatch**; Automate chrome iff that row is in `done`; `buy-traffic-light` `show` `unlock-sensors` `need` `unlock-dispatch`; `Act.route` no-op unless `unlock-dispatch` in `done`.

`research.furnace` — Own trade row, reveal fermentation, gates `buy-furnace`, show `unlock-grinder`; `buy-axe` on `unlock-better-tools`.

`research.hardened` — `unlock-hardened-tools` land, `reveal` and `requires` `unlock-better-tools`, `effect` `unlock-sku` `buy-better-shovel`; `buy-better-shovel` unlock + show that row; `buy-better-pickaxe` unlock + show that row; `buy-chainsaw` unlock + show that row; `buy-axe` stays `unlock-better-tools`.

`research.techtree` — `#debug-techtree` omits SKUs `skuShown` false: `buy-or` `buy-and` `buy-water-system`.
