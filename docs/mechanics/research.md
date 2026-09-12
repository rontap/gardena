# Research

One job. `startResearch` no-op if a job is running, already done, not `researchOpen`, or `money < cost`. Pay up front. `left` ticks down. Done: `done.add`, tally that day, apply `effect`.

`unlockAll`: every row done, `money += 999`, job idle, `points = 99`. Does not grant skills. UI is the Cheat dock, not Research — [[ui/cheat]].

`unlockAllSkills` is a different cheat. `cheatFastResearch`: toggle. Job drain `× 3`. `Act.cheat` `{ k: 'research' }`. `World.cheatSpeed` is world time, not this arm. `cheatMoney` `+ 200`. `cheatPoints` `+ 10` to the shared bank.

`RESEARCH[id].name` is the visible label. Descriptions as `RESEARCH[id].blurb`. `unlock-better-tools` name **Gardening tools**. `unlock-hardened-tools` name **Hardened tools**. `unlock-multi-crop` name **Multi-Crop Farming**. `unlock-advanced-plants` name **Advanced Plants**. `unlock-smart-irrigation` name **Smart Irrigation Sensors**. `unlock-grinder` name **Machinery & Expansion**. `unlock-weather-station` name **Weather Forecast Station**. Gardening tools: **A Pickaxe mines Rock into untilled ground you can till, and mines Very hard soil into Infertile soil. An Axe chops a mature tree into Wood. Weed spray clears a Weed on a tilled plot. A Large bucket holds more water than a Bucket, so you Fill less often at a Pump.** Hardened tools description names Better shovel, Hardened pickaxe, and Chainsaw: **A Better shovel tills faster than a Shovel and lasts for more uses. A Hardened pickaxe lasts for more uses and mines faster than a Pickaxe. A Chainsaw chops a mature tree in fewer seconds than an Axe and lasts for more uses.** Multi-Crop Farming: **Sow Wheat on tilled soil. Wheat takes longer to ripen than Carrot or Potato and wants more water and fertilizer. You cut it dry.** Advanced Plants: **Sow Tomato or Grape on tilled soil. Both ripen later than Wheat and want a tighter water and fertilizer range. Ripe fruit loses freshness faster than Wheat, so Harvest the day it ripens.** Weather Forecast Station: **Place a Weather Forecast Station. Tomorrow's weather appears next to today, so you can plan watering, the stall, and the Water bill before Sunrise.**

No `unlock-tomato`. No `unlock-grape`. No tabs. No four shelves. — [[ui/docks]]

## One parent

| field | semantics |
|---|---|
| `parent: ResearchId \| null` | one previous. `null` is a start row |
| `path: ResearchId` | start ancestor of this row; `#debug-techtree` subgraph |
| `Sku.need: readonly ResearchId[] \| 'prize'` | OR — any id in `done`; second lock on one item, not the whole row |

No `requires` list. No `reveal` list.

`researchOpen(id)`: `parent === null` or `parent` in `done`. `researchKnown(id)`: `parent === null` or `researchOpen(parent)`. Start rows are known and open. A child of a start row is known from the first day and open once that start row is in `done`. A deeper row is mystery until its parent is open.

Not known: the card stays in the grid, `skill-unknown` icon, unknown name **Unknown**, unknown description **You do not know what this does.** Disabled, no cost, no seconds.

`unlock-necronomicon` is the only exception: known and open only after `World.grandma` is `told` **and** parent `unlock-grinder` is in `done`; until then mystery. No other row reads `grandma`. — [[mechanics/necronomicon]] `necro.reveal`

A known row that is not open is a disabled face; `why` names the parent: *Needs {name} first.* — [[ui/docks]]

`grants`: `readonly string[]` — the concepts a row turns on that no table can express. Empty on rows whose unlocks are fully covered by `SKUS` and `SKILLS`. Read by [[ui/cheat]] `#debug-techtree`, not by the sim. That graph groups by `path`, draws edges from `parent`, and omits SKUs `skuShown` false: `buy-or` `buy-and` `buy-water-system`.

`skuOpen` is unlock done (or `'start'`) and the need: `[]` | prize stock | any one of those rows done. `skuShown` is `show` alone, except `'prize'`, which is shown only while stock is banked. `'prize'` means the sku is never for sale — [[mechanics/contracts]]. `buy-freezer-large` is the only one.

## Rows

`parent` is one id or `null`. Cost / duration live on `RESEARCH`. Seconds and cost preference as named on `RESEARCH`. New rows `unlock-multi-crop` `unlock-advanced-plants` `unlock-weather-station` cost and seconds preference. `unlock-fermentation` cost preference.

| id | path | parent | grants |
|---|---|---|---|
| unlock-multi-crop | unlock-multi-crop | — | — |
| unlock-better-tools | unlock-multi-crop | unlock-multi-crop | — |
| unlock-hardened-tools | unlock-multi-crop | unlock-better-tools | — |
| unlock-advanced-plants | unlock-multi-crop | unlock-multi-crop | — |
| unlock-raspberry | unlock-multi-crop | unlock-advanced-plants | — |
| unlock-crop-variants | unlock-multi-crop | unlock-multi-crop | — |
| unlock-heirloom | unlock-multi-crop | unlock-crop-variants | — |
| unlock-irrigation | unlock-irrigation | — | — |
| unlock-auto-irrigation | unlock-irrigation | unlock-irrigation | Water need lens |
| unlock-adv-irrigation | unlock-irrigation | unlock-auto-irrigation | — |
| unlock-water-storage | unlock-irrigation | unlock-auto-irrigation | — |
| unlock-vehicles | unlock-irrigation | unlock-irrigation | Quad, tractor and trailer at the hangar |
| unlock-dispatch | unlock-irrigation | unlock-vehicles | Automate chrome |
| unlock-silos | unlock-irrigation | unlock-dispatch | — |
| unlock-sensors | unlock-irrigation | unlock-irrigation | Sensors lens row |
| unlock-advanced-sensors | unlock-irrigation | unlock-sensors | — |
| unlock-smart-irrigation | unlock-irrigation | unlock-advanced-sensors | Sprinkler crop dial; Sprinkler signal input; Signal wire endpoints on sprinklers |
| unlock-grinder | unlock-grinder | — | — |
| unlock-preservatives | unlock-grinder | unlock-grinder | Jam plates in almanac Ingredients |
| unlock-fermentation | unlock-grinder | unlock-preservatives | Rotten consign $1 |
| unlock-infusion | unlock-grinder | unlock-fermentation | — |
| unlock-furnace | unlock-grinder | unlock-preservatives | — |
| unlock-contracts | unlock-grinder | unlock-grinder | Contracts board at the stall; Reputation decay |
| unlock-landscaping | unlock-grinder | unlock-grinder | — |
| unlock-expand | unlock-grinder | unlock-landscaping | Land expansion on the map edge; +1 expansion permit; Land quality lens |
| expand-land | unlock-grinder | unlock-expand | +1 expansion permit |
| eminent-domain | unlock-grinder | unlock-expand | +1 expansion permit |
| unlock-weather-station | unlock-grinder | unlock-landscaping | — |
| unlock-necronomicon | unlock-grinder | unlock-grinder | The Necronomicon on the Build Automation shelf |

Start rows are three: `unlock-multi-crop`, `unlock-irrigation`, `unlock-grinder`. `unlock-landscaping` and `unlock-expand` are not start.

`unlock-crop-variants` and `unlock-heirloom` keep their rows. Ladder effects die: they do not change grow, seed packs, or silo columns. Seed packs are `'base'` at quality 0 with or without those rows. Skills still gate on them — [[mechanics/family]]. `buy-research-station` unlock and show `unlock-crop-variants`. How varieties are earned from seed: [[plans/next-variant]].

Compost box is a start SKU. Chest is a start SKU. Carrot / potato start unlocked. Wheat is not: `pack-wheat` buy `unlock-multi-crop`.

`unlock-vehicles` `effect` `unlock-sku` `buy-hangar`. Quad / tractor / trailers are not SKUs. Lens `vehicles` unhidden after this row. `unlock-silos` `effect` `unlock-sku` `buy-silo-seed`. `unlock-furnace` `effect` `unlock-sku` `buy-furnace`. `unlock-dispatch` `effect` `feature`. Automate chrome iff `unlock-dispatch` in `done`. Card **Automated dispatch**. `Act.route` no-op unless this row is in `done`.

`unlock-sensors` / `unlock-advanced-sensors` / `unlock-smart-irrigation` / `unlock-contracts` / `unlock-heirloom` / `unlock-dispatch` / `unlock-crop-variants` `effect` `feature`. `unlock-smart-irrigation` is the merged capstone: sprinkler HUD and sprinkler wire endpoints both read this row. Almanac Ingredients gates: jam `unlock-preservatives`; spirit / wine / cider `unlock-fermentation`; mill goods `unlock-grinder`; infuser `unlock-infusion`; furnace `unlock-furnace`. Station and sorter have no research row. — [[ui/almanac]]

Ordinary bag is always at the Additive store. Compost feeds like fertilizer. `buy-weed-spray` gates on `unlock-better-tools`. `unlock-better-tools` `effect` `unlock-sku` `buy-pickaxe`. `unlock-multi-crop` `effect` `unlock-sku` `pack-wheat`. `unlock-advanced-plants` `effect` `unlock-sku` `pack-tomato`. `unlock-weather-station` `effect` `unlock-sku` `buy-weather-station`.

## Sku gates

`buy-fertilizer` unlock `start`. `buy-weed-spray` utility, unlock and show `unlock-better-tools`. `buy-compost-box` unlock `start`, show `start`. `buy-chest` unlock `start`, show `start`, price preference. `buy-research-station` unlock and show `unlock-crop-variants`. The rotary shovel and the diamond pickaxe have no sku; both are four-star contract prizes — [[mechanics/contracts]].

`pack-wheat` show `start`, buy `unlock-multi-crop`. `pack-tomato` show `start`, buy `unlock-advanced-plants`. `pack-grape` show `start`, buy `unlock-advanced-plants`. `pack-raspberry` show `unlock-advanced-plants`, buy `unlock-raspberry`. `pack-sugar-cane` show + buy `unlock-fermentation`. `pack-chilli` show + buy `unlock-infusion`. `pack-grass` show `start`, buy `unlock-landscaping`. No `pack-olive`. No `pack-vanilla`. No `pack-watermelon`. No `unlock-chilli`. Packs are `'base'` quality 0. `buy-freezer-large` `need: 'prize'`.

`buy-mill` show `start`, buy `unlock-grinder`. `buy-jam` / `buy-freezer` / `buy-sugar` show `unlock-grinder`, buy `unlock-preservatives`. `buy-still` show `unlock-grinder`, buy `unlock-fermentation`. `buy-barrel` show `start`, buy `unlock-fermentation`. `buy-furnace` show `unlock-preservatives`, buy `unlock-furnace`. `buy-infuser` show `unlock-fermentation`, buy `unlock-infusion`. `buy-sorter` show + buy `unlock-crop-variants`. `buy-weather-station` show + buy `unlock-weather-station`, price preference, Land shelf, occupancy 1×2. — [[mechanics/machines]] [[mechanics/infusion]] [[items/buildings]] [[mechanics/weather]]

`buy-freezer` price preference.

### Water

Three rows, three jobs. Irrigation routes the pump the farm already owns; Water storage sells a second source; Automated and Advanced sell what throws the water — [[mechanics/water]].

| sku | show | unlock |
|---|---|---|
| buy-pipe | start | unlock-irrigation |
| buy-tap | start | unlock-irrigation |
| buy-pumpjack | unlock-auto-irrigation | unlock-water-storage |
| buy-well | unlock-auto-irrigation | unlock-water-storage |
| buy-sprinkler | unlock-irrigation | unlock-auto-irrigation |
| buy-valve | unlock-auto-irrigation | unlock-auto-irrigation |
| buy-sprinkler-vert | unlock-auto-irrigation | unlock-adv-irrigation |
| buy-sprinkler-large | unlock-auto-irrigation | unlock-adv-irrigation |

`buy-pumpjack` and `buy-well` price preference.

### Vehicles

`buy-hangar` automation, show `unlock-irrigation`, buy `unlock-vehicles`. `buy-silo-seed` / `buy-silo-spray` / `buy-silo-produce` automation, show `unlock-dispatch`, buy `unlock-silos`. Quad / tractor / trailer hangar-buys not shop place SKUs, not `skuPrice`. Automate chrome after `unlock-dispatch`. — [[mechanics/vehicles]]

### Sensors

Sensors shelf (`logic`) after `unlock-sensors`. Buy gates live on `SKUS` (`unlock` / `show` / `need`). The Research tree is the map. `buy-water-system` `skuShown` false. `buy-or` `buy-and` unused. — [[mechanics/sensors]]

### Land

`buy-fence` and all four paving SKUs show from `start`, buy after `unlock-landscaping`; they file on the Build **Land** shelf — [[items/tiles]] [[ui/build]]. `pack-grass` show from `start`, buy after `unlock-landscaping`; sold at the Seed silo — [[mechanics/inventory]] `inventory.grass-silo`. `buy-weather-station` Land shelf, show + buy `unlock-weather-station`. `buy-pickaxe` show `start`, buy `unlock-better-tools`. `buy-better-pickaxe` unlock and show `unlock-hardened-tools`. `buy-axe` utility, unlock and show `unlock-better-tools`. `buy-chainsaw` utility, unlock and show `unlock-hardened-tools`. `buy-better-shovel` unlock and show `unlock-hardened-tools`. `buy-bucket-large` unlock `unlock-better-tools`, show `start`. `unlock-better-tools` effect `buy-pickaxe`. `unlock-hardened-tools` effect `buy-better-shovel`. Axe `workSeconds` stays `AXES.axe.workSeconds`. Hardened tools research face matches Better shovel, Hardened pickaxe, and Chainsaw. — [[items/tools]] [[mechanics/expansion]]

## Invariants

`research.job` — One research job; `buy-fertilizer` unlock `start`; `buy-weed-spray` utility, unlock and show `unlock-better-tools`; `unlock-better-tools` effect `buy-pickaxe`.

`research.tiles` — `buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`; cosmetic; keep `ground`.

`research.better` — Better crop is `better-*` `saleMul` and ripen `betterGain`; potato / wheat gated on `unlock-crop-variants`; tomato / grape gated on `unlock-advanced-plants`; raspberry gated on `unlock-raspberry`; Őstermelő gated on `unlock-heirloom`; no tree `better-*`.

`research.variants` — `unlock-crop-variants` parent `unlock-multi-crop`, `effect` `feature`; ladder effects die: seed packs `'base'` quality 0 with or without it; ripen does not roll; silo does not hide columns; `buy-research-station` unlock and show that row; `unlock-heirloom` parent is it; both rows stay; earn path: [[plans/next-variant]].

`research.unlockAll` — `unlockAll`: every research done, `money += 999`, job idle, `World.points = 99`; does not grant skills; job drain ×3 is `cheatFastResearch`, not this.

`research.start` — Start rows are three: `unlock-multi-crop`, `unlock-irrigation`, `unlock-grinder` (`parent: null`); `pack-wheat` unlock `unlock-multi-crop`, show `start`; carrot / potato start; wheat is not start; `unlock-landscaping` and `unlock-expand` are not start.

`research.reveal` — `researchKnown` is parent null or parent open; `researchOpen` is parent null or parent in `done`; not known: card stays, `skill-unknown`, unknown copy, disabled; `unlock-necronomicon` known and open only after grandma `told` and `unlock-grinder` done; raspberry parent `unlock-advanced-plants`; no olive research row; no vanilla research row; vanilla has no pack; no `unlock-chilli`; `unlock-infusion` parent `unlock-fermentation`, gates `buy-infuser` and `pack-chilli`; `unlock-fermentation` parent `unlock-preservatives`, unlocks `pack-sugar-cane` and gates `buy-still` `buy-barrel`; rotten consign `$1` iff `unlock-fermentation` in `done`; `unlock-furnace` parent `unlock-preservatives`, gates `buy-furnace`, show `unlock-preservatives`; `unlock-grinder` also gates `buy-mill`; `unlock-preservatives` parent `unlock-grinder`, gates `buy-jam` `buy-freezer` `buy-sugar`; station has no research row.

`research.gates` — `better-grape` gated on `unlock-advanced-plants`; no `better-apple` `better-apricot` `better-olive` `better-cherry`; no `better-carrot` `better-vanilla` `better-sugar-cane` `better-chilli` `better-grass`; no `unlock-olive`; no `unlock-chilli`; no `unlock-tomato`; no `unlock-grape`; `machinery` gated on `unlock-grinder`.

`research.infusion` — `unlock-infusion` parent `unlock-fermentation`, `effect` `unlock-sku` `buy-infuser`; `buy-infuser` show `unlock-fermentation`, buy that row; `pack-chilli` show + buy that row; no chilli research row — [[mechanics/infusion]].

`research.dispatch` — `unlock-dispatch` parent `unlock-vehicles`, `effect` `feature`, grants Automate chrome; card **Automated dispatch**; Automate chrome iff that row is in `done`; `Act.route` no-op unless `unlock-dispatch` in `done`.

`research.furnace` — Own row, parent `unlock-preservatives`, gates `buy-furnace`, show `unlock-preservatives`; `buy-axe` on `unlock-better-tools`.

`research.hardened` — `unlock-hardened-tools` parent `unlock-better-tools`, `effect` `unlock-sku` `buy-better-shovel`; `buy-better-shovel` unlock + show that row; `buy-better-pickaxe` unlock + show that row; `buy-chainsaw` unlock + show that row; `buy-axe` stays `unlock-better-tools`.

`research.techtree` — `#debug-techtree` subgraphs by `path`, edges from `parent`; omits SKUs `skuShown` false: `buy-or` `buy-and` `buy-water-system`.
