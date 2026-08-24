# Research

Husband is the research role. One job. `startResearch` no-op if a job is running, already done, or `money < cost`. Pay up front. `left` ticks down. Done: `done.add`, tally that day, apply `effect`.

`unlockAll`: every row done, `money += 999`, job idle, each member `points = 99`. Does not grant skills. Does not reroll — [[mechanics/family]]. UI is the Cheat dock, not Research — [[ui/cheat]].

`cheatFastResearch`: job drain `× 3` on top of Speedy research. Toggle. `cheatMoney` `+ 200`. `cheatPoints` `+ 10` per member.

`RESEARCH[id].name` is the visible label. Trees: plants, utilities, expansion, automation.

`reveal`: `'start'` or a prior id. `skuOpen` / `skuShown` are separate: show vs buy.

`Sku.need` is required: `ResearchId | 'vanilla-tending' | 'none'`. `'none'` is no extra lock. Vanilla stays `'vanilla-tending'`. Dual-lock SKUs set `unlock` to one research and `need` to the other. `skuOpen` is unlock done (or `'start'`) and the need: `'none'` | skill owned | that research done. Assumption: vanilla keeps this field.

Future germ / weather SKUs use this dual-lock only (`Sku.unlock` + `Sku.need` as `ResearchId`). Do not add those SKUs or research rows in 1.7.1. AND / OR / NOT already dual-lock on `unlock-advanced-sensors`.

`gate` is required on every row. `{ kind: 'none' }` unless the row is earned by play:

- `{ kind: 'digs'; n }` — `World.digs`, bumped once per completed `doShovel`.
- `{ kind: 'mines'; n }` — `World.mines`, bumped once per completed `doMine` (very-hard soil or a rock, whatever its footprint).

`researchOpen(id)` is `gateProgress(id) >= 1`. `startResearch` no-ops while gated. A gated card is inert, shows a `roof` bar and `{have} / {n} {kind}`. `gateHave` is the raw counter. `GATE_TEXT` holds the callout sentence. Counters never reset and are not spent.

## Rows

Blurbs as `RESEARCH[id].blurb`.

| id | name | tree | $ | s | reveal | blurb |
|---|---|---|---|---|---|---|
| unlock-tomato | Tomato seeds | plants | 7 | 30 | start | Unlocks Tomato seeds in the general store. |
| unlock-olive | Olive seeds | plants | 11 | 42 | unlock-tomato | Unlocks Olive seeds in the general store. |
| unlock-grape | Grape seeds | plants | 10 | 40 | start | Unlocks Grape seeds in the general store. |
| unlock-raspberry | Raspberry seeds | plants | 12 | 45 | unlock-grape | Unlocks Raspberry seeds in the general store. |
| unlock-watermelon | Watermelon seeds | plants | 8 | 35 | start | Unlocks Watermelon seeds in the general store. |
| unlock-heirloom | Heirloom crops | plants | 20 | 120 | start | Unlocks Őstermelő. Heirloom produce can sell for more. |
| unlock-fertilizer | Fertilizer | plants | 9 | 40 | start | Unlocks Synthetic fertilizer in the general store. |
| unlock-better-tools | Better gardening tools | utilities | 16 | 45 | start | Unlocks Better shovel and Large bucket in the general store. |
| unlock-large-box | Fruit boxes | utilities | 17 | 50 | start | Unlocks Large fruit box in the general store. |
| unlock-chest | Chest | utilities | 12 | 40 | start | Unlocks Chest in the general store. |
| unlock-pickaxe | Pickaxes | utilities | 0 | 40 | start | Unlocks Pickaxe and Hardened pickaxe in the general store. |
| unlock-compost | Composting | utilities | 14 | 45 | unlock-fertilizer | Unlocks Compost box in the general store. Turns organic waste back into fertilizer. |
| unlock-expand | Unlock land | expansion | 15 | 45 | start | Unlocks land expansion on the map edge. |
| unlock-irrigation | Irrigation | automation | 20 | 50 | start | Unlocks Pumpjack in the general store. |
| unlock-vehicles | Vehicles | automation | 32 | 70 | unlock-irrigation | Unlocks Hangar, tractor, trailers, and field silos. Buy Quads and tractors at a hangar. |
| unlock-auto-irrigation | Automated irrigation | automation | 22 | 55 | unlock-irrigation | Unlocks Pipe, Sprinkler, Manual valve, Rainwater tank and Tap in the general store. |
| unlock-adv-irrigation | Advanced irrigation | automation | 28 | 65 | unlock-auto-irrigation | Unlocks Well, Vertical sprinkler, and Large sprinkler in the general store. |
| unlock-smart-sprinkler | Smart sprinklers | automation | 30 | 70 | unlock-adv-irrigation | Every sprinkler gains a crop dial. Tuned to a crop, it pours exactly what that crop drinks. |
| unlock-sensors | Sensors | automation | 24 | 55 | unlock-auto-irrigation | Unlocks the Sensors shelf: lever, button, lamp, pulser, counter, and field readers. |
| unlock-advanced-sensors | Advanced sensors | automation | 22 | 50 | unlock-sensors | Unlocks AND, OR, and NOT. |
| unlock-smart-irrigation | Smart Irrigation | automation | 32 | 70 | unlock-sensors | Sprinklers gain a signal input. Unlocks Smart valve and Vehicle detector. |
| unlock-grinder | Seed grinder | automation | 18 | 50 | start | Unlocks Seed grinder and Mill in the general store. |
| unlock-preservatives | Preservatives | automation | 20 | 55 | unlock-grinder | Unlocks Jam machine, Freezer, and Sugar in the general store. |
| unlock-fermentation | Fermentation | automation | 14 | 50 | start | Unlocks Sugar cane seeds, Pot still, and Wine barrel. Ripe cane is fruit. Mill cane for sugar. |
| unlock-landscaping | Landscape architecture | expansion | 12 | 60 | start | Unlocks Grass seeds, Wooden fence and every paving tile in the general store. |
| unlock-rotary-shovel | Rotary shovel | utilities | 40 | 120 | unlock-better-tools | Unlocks the Rotary shovel in the general store. Earned by digging, not by reading. |
| unlock-diamond-pickaxe | Diamond pickaxe | utilities | 40 | 120 | unlock-pickaxe | Unlocks the Diamond pickaxe in the general store. Earned by mining, not by reading. |

`unlock-rotary-shovel` gate `digs` `ROTARY_DIGS` 200. `unlock-diamond-pickaxe` gate `mines` `DIAMOND_MINES` 150. Every other row is `{ kind: 'none' }`. `unlock-vehicles` `effect` `unlock-sku` `buy-hangar`. Quad / tractor / trailers are not SKUs. `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` unlock on `unlock-vehicles`.

`unlock-sensors` `effect` `feature`. `unlock-advanced-sensors` `effect` `feature`. `unlock-smart-irrigation` `effect` `feature`. `startResearch('unlock-smart-irrigation')` no-ops unless `unlock-adv-irrigation` is in `done`. Assumption: no new `ResearchGate` arm. Assumption: `unlock-advanced-sensors` $22 / 50s.

`unlock-sensors` cell SKUs (lever, button, lamp, pulser, counter, water, fert, harvest, water-system, day): `show` + `unlock` `unlock-sensors`, `need: 'none'`. AND / OR / NOT: `show: unlock-sensors`, `unlock: unlock-advanced-sensors`, `need: unlock-sensors` — visible after Sensors; buy after Advanced sensors. `buy-smart-valve` `buy-vehicle-detector`: `show: unlock-sensors`, `unlock: unlock-smart-irrigation`, `need: unlock-sensors`. `skuShown` Sensors shelf (`logic`) after `unlock-sensors`. Smart Irrigation cards shown after Sensors, buy after both.

Carrot / potato / wheat start unlocked. No `bump-*`. No `{ kind: 'sale-mul' }`. `effect` is `unlock-sku` | `expand` | `feature`. `unlock-heirloom` is `feature` — gates Őstermelő. Better crop is player skills — [[mechanics/family]].

`unlock-olive` → `pack-olive`. `unlock-grape` → `pack-grape`. `unlock-raspberry` → `pack-raspberry`. Vanilla has no research row. `unlock-fermentation` → `pack-sugar-cane`; also `buy-still` `buy-barrel`. `unlock-grinder` → `buy-grinder` `buy-mill`. `unlock-preservatives` → `buy-jam` `buy-freezer` `buy-sugar`. Almanac jam third icon when `unlock-preservatives` done. No `unlock-mill` `unlock-jam` `unlock-still` `unlock-barrel` `unlock-freezer`.

`unlock-large-box` unlocks **large** only. Small box is in the shop from the start.

`unlock-fertilizer` unlocks **synthetic**. Ordinary bag is always in the shop. `buy-weed-spray` gates on `unlock-fertilizer`; the research `effect` stays one SKU.

## Shop gates

`buy-box` unlock `start`, $6. `buy-box-large` unlock `unlock-large-box`, $18.

`buy-fertilizer` unlock `start`, $18. `buy-synth-fertilizer` unlock + show `unlock-fertilizer`, $15. `buy-weed-spray` $12 utility, unlock and show `unlock-fertilizer`. `unlock-fertilizer` effect stays one SKU (`buy-synth-fertilizer`); spray gates on the research id.

`buy-compost-box` unlock `unlock-compost`, show `unlock-fertilizer`, $20.

`buy-rotary-shovel` show after `unlock-better-tools`, buy after `unlock-rotary-shovel`, $1000. `buy-diamond-pickaxe` show after `unlock-pickaxe`, buy after `unlock-diamond-pickaxe`, $1000.

`pack-olive` $14 show `unlock-tomato`, buy `unlock-olive`. `pack-grape` $16 show `start`, buy `unlock-grape`. `pack-raspberry` $22 show `unlock-grape`, buy `unlock-raspberry`. `pack-vanilla` $40 show `unlock-raspberry`, buy iff player owns `vanilla-tending`. Locked copy: “You need to earn the Vanilla tending skill.” `pack-sugar-cane` $8 show + buy `unlock-fermentation`.

`buy-mill` $35 show `start`, buy `unlock-grinder`. `buy-jam` $40 / `buy-freezer` $36 / `buy-sugar` $16 show `unlock-grinder`, buy `unlock-preservatives`. Assumption: `buy-sugar` tab utility. `buy-still` $45 / `buy-barrel` $28 show `start`, buy `unlock-fermentation`. — [[mechanics/machines]]

`buy-hangar` $80 automation, show `unlock-irrigation`, buy `unlock-vehicles`. `contracts` applies. `buy-silo-seed` / `buy-silo-spray` / `buy-silo-produce` $70 automation, show `unlock-irrigation`, buy `unlock-vehicles`, contracts apply. Quad / tractor / trailer hangar-buys `QUAD_PRICE` `TRACTOR_PRICE` `TRAILER_*_PRICE`, not shop place SKUs, contracts do not discount. — [[mechanics/vehicles]]

`pack-grass` $1, `buy-fence` $10 and all three paving SKUs show from `start`, buy after `unlock-landscaping` — [[items/tiles]].

`buy-better-pickaxe` show after `unlock-pickaxe`. Sprinkler shown after Irrigation, buyable after Automated. Vert / large / well shown after Automated, buyable after Advanced.

Sensors shelf after `unlock-sensors`. AND / OR / NOT after Advanced sensors. `buy-smart-valve` Water (flow). `buy-vehicle-detector` Sensors. Prices [[mechanics/sensors]].
