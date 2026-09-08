# Buildings

`house` — starter, not a SKU. Door slots: [[mechanics/inventory]].

`chest` — `buy-chest`. `grinder` — `buy-grinder`. `compost-box` — `buy-compost-box`.

`mill` — `buy-mill`. 2x2, origin NW, no rotate; `squareSiteOk`, pads two cells wide. `infuser` — `buy-infuser`. 2×2, mill I/O, `squareSiteOk`, pads two cells wide. Automation shelf, show `unlock-preservatives`, buy `unlock-infusion`, `haggling`. Guest shop + place + delete + dump. `skuLabel` **Infuser**. Rules: [[mechanics/infusion]] `infusion.machine`. `jam` — `buy-jam`. `still` — `buy-still`. `furnace` — `buy-furnace`. 1×2, origin NW, no rotate, hover origin extends south. `Sku.tab` `automation`. Almanac **Automation**. `unlock-furnace`, `haggling`. Guest shop + place + delete + dump. `skuLabel` **Furnace**. Rules: [[mechanics/machines]]. `barrel` — `buy-barrel`. `freezer` — `buy-freezer`.

`station` — `buy-research-station`. 2×1, place like the still. Automation shelf, unlock and show `unlock-crop-variants`, `need: []`. No research row of its own. `haggling`. Guest shop + place + delete + dump. `dest(station)` = `at`. Pads, west pull, east push, `inn`, like the still. Heirloom fruit in, cut fruit and grafts out. Panel [[ui/station]]. Rules: [[mechanics/machines]] `station.io`.

Assumption: the station is named for what it becomes, not only for what it does this update.

`hangar` — `buy-hangar`. 3×2, door south, no rotate. `Sku.tab` `automation`. Almanac **Automation**. `unlock-vehicles`. Walk-up cue. Quad / tractor / trailer hangar-buys, not place SKUs. Cannot delete while it stores a vehicle or a trailer. Rules: [[mechanics/vehicles]].

`silo-seed` — `buy-silo-seed`. `silo-spray` — `buy-silo-spray`. `silo-produce` — `buy-silo-produce`. 2×3, door south, `siloPad`. `Sku.tab` `automation`. Almanac **Automation**. `unlock-silos`, `haggling`. Walk-up stores: each opens the panel its starter twin uses. `isSolid`, delete always. Guest `GUEST_BUILD`. Rules: [[mechanics/vehicles]].

`seed-silo` — starter, not a SKU. `additive-store` — starter, not a SKU. 1×2, `SILO_BASE` `(17,9)` / `ADDITIVE_BASE` `(18,9)`. Not placeable, not researchable, not deletable, no almanac entry. Contents and caps: [[mechanics/inventory]]. Panels: [[ui/store]]. Starter **Seed silo** is not `silo-seed`.

`truck` — not a Place SKU. Consign: [[mechanics/market]].

Sensor cells are not this note — [[items/sensors]].
