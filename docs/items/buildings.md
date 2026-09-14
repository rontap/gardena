# Buildings

What the player can buy, hold, or place. Size and shelf. Gates [[mechanics/research]]. Place [[ui/place]]. Rules per kind below.

`house` — starter, not a SKU. Door slots: [[mechanics/inventory]].

## Home chunk

`HOUSE_BASE` `DOOR` `PUMP_BASE` `WAREHOUSE_BASE` `POSTBOX_BASE` `SILO_BASE` `ADDITIVE_BASE` `YARD` in `sim/building.ts` — preference. Every cell of those, plus the pads `warehousePads` derives, is in `RESERVED`, so world generation lays no rock, tree or burrow on them. `PAD` is `warehousePads(WAREHOUSE_BASE)[0]`, derived, not a second number.

Reading the row band, north to south: the Seed silo and the Additive store stand east of the house against its roof line, the warehouse sits west of it a row higher with its consign row underneath, the yard runs east from that consign row to the door, and the pump stands one row below the house's east end, with the postbox below the house's west end. Moving any of them means moving it somewhere its own pads still land on walkable ground — [[mechanics/vehicles]] `vehicles.starter-pads`.

`chest` — `buy-chest`. 1×1. `grinder` — `buy-grinder`. 1×1. `compost-box` — `buy-compost-box`. 1×1.

`mill` — `buy-mill`. 2×2, origin NW, no rotate, `squareSiteOk`, pads two cells wide. `infuser` — `buy-infuser`. 2×2, mill I/O, `squareSiteOk`, pads two cells wide. `Sku.tab` `automation`. Almanac **Automation**. `skuLabel` **Infuser**. Rules: [[mechanics/infusion]] `infusion.machine`. `jam` — `buy-jam`. 1×1. `still` — `buy-still`. 2×1, origin NW, no rotate, hover origin extends east. `furnace` — `buy-furnace`. 1×2, origin NW, no rotate, hover origin extends south. `Sku.tab` `automation`. Almanac **Automation**. `skuLabel` **Furnace**. Rules: [[mechanics/machines]]. `barrel` — `buy-barrel`. 1×1. `freezer` — `buy-freezer`. 1×1.

`station` — `buy-research-station`. 2×1, origin NW, no rotate, hover origin extends east. `Sku.tab` `automation`. Almanac **Automation**. Named for what it becomes. Pads, west pull, east push, `inn`. Panel [[ui/station]]. Rules: [[mechanics/machines]] `station.io`.

`sorter` — `buy-sorter`. 1 × `SORT_LEN` upright, `SORT_LEN` × 1 flat. Four `facing` values. `Sku.tab` `automation`. Almanac **Automation**. Rules: [[mechanics/machines]] `machines.sorter`.

`hangar` — `buy-hangar`. 3×2, door south, no rotate. `Sku.tab` `automation`. Almanac **Automation**. Walk-up cue. Quad / tractor / trailer hangar-buys, not place SKUs. Cannot delete while it stores a vehicle or a trailer. Rules: [[mechanics/vehicles]].

`silo-seed` — `buy-silo-seed`. `silo-spray` — `buy-silo-spray`. `silo-produce` — `buy-silo-produce`. 2×3, door south, `siloPad`. `Sku.tab` `automation`. Almanac **Automation**. Walk-up stores: each opens the panel its starter twin uses. `isSolid`, delete always. Rules: [[mechanics/vehicles]] `vehicles.silo-store`.

`seed-silo` — starter, not a SKU. `additive-store` — starter, not a SKU. 1×2, `SILO_BASE` / `ADDITIVE_BASE`. Not placeable, not researchable, not deletable, no almanac entry. Contents and caps: [[mechanics/inventory]]. Panels: [[ui/store]]. Starter **Seed silo** is not `silo-seed`.

`truck` — not a Place SKU. Consign: [[mechanics/market]].

`necronomicon` — `buy-necronomicon`. 2×2, origin NW, no rotate, `squareSiteOk`. `Sku.tab` `automation`. One per farm. Cannot be demolished. Rules: [[mechanics/necronomicon]] `necro.one`.

`weather-station` — `buy-weather-station`. 1×2, origin NW, no rotate, hover origin extends south. `Sku.tab` `building`. Almanac **Building**. Land shelf. Price preference. Many allowed; extras no-op. Demolishable. Not a `Machine`. skuLabel **Weather Forecast Station**. Rules: [[mechanics/weather]] `weather.forecast`.

Sensor cells are not this note — [[items/sensors]].
