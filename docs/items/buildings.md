# Buildings

`house` — starter, not a SKU. Door slots: [[mechanics/inventory]].

`chest` — `buy-chest`. `grinder` — `buy-grinder`. `compost-box` — `buy-compost-box`.

`mill` — `buy-mill`. `jam` — `buy-jam`. `still` — `buy-still`. `barrel` — `buy-barrel`. `freezer` — `buy-freezer`. Rules: [[mechanics/machines]].

`hangar` — `buy-hangar`. 3×2, door south, no rotate. Automation tab. `unlock-vehicles`. Walk-up cue. Quad / tractor / trailer hangar-buys, not place SKUs. Cannot delete while it stores a vehicle or a trailer. Rules: [[mechanics/vehicles]].

`silo-seed` — `buy-silo-seed`. `silo-spray` — `buy-silo-spray`. `silo-produce` — `buy-silo-produce`. 3×2, door south, pad like hangar. Automation, `unlock-vehicles`, `machine-contracts`. Inert: look name only, no dialog, no merge, `isSolid`, delete always. Guest `GUEST_BUILD`. Rules: [[mechanics/vehicles]].

`seed-silo` — starter, not a SKU. `additive-store` — starter, not a SKU. 1×2, `SILO_BASE` `(17,9)` / `ADDITIVE_BASE` `(18,9)`. Not placeable, not researchable, not deletable, no almanac entry. Contents and caps: [[mechanics/inventory]]. Panels: [[ui/store]]. Starter **Seed silo** is not `silo-seed`.

`truck` — not a Place SKU. Consign: [[mechanics/market]].
