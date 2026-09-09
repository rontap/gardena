# Items

Things the player can hold, buy, plant, or place. Identifiers here. Numbers stay in `defs` and the owning mechanic note. Map: [[mechanics/_index]].

- [[items/crops]] — `VarietyId`. Infusion. Chilli. `AnnualId` grass. `pack-grass` Seed silo, not Land. `{ kind: 'seeds'; crop: 'grass' }`. Illegal `{ kind: 'grass-seeds' }`. Flakes. Vanilla-extract. Infused jam / cask / spirit / oil. Bread. overlay-infused
- [[items/tools]] — axe, chainsaw. `SkuId` `buy-chainsaw`. `ResearchId` `unlock-hardened-tools`. Item kind `chainsaw`. `buy-better-pickaxe` `buy-chainsaw` on `unlock-hardened-tools`. Chop drops wood and grafts. Burrow loot may mint `better-shovel` / `better-pickaxe` / `axe`
- [[mechanics/burrow]] — luck, treasure. Not a SKU
- [[items/irrigation]]
- [[items/sensors]] — lever, button, lamp, Logic gate, NOT, pulser, counter, readers, day, pressure plate, traffic light. The valve signal input is Water.
- [[items/buildings]] — furnace, hangar, three field silos (Seeding / Spraying / Produce), research station unlock `unlock-crop-variants`, Infuser unlock `unlock-infusion`. Starter Seed silo is not those SKUs.
- [[items/fertilizer]] — ash
- [[items/wild]] — trunk
- [[items/tiles]]
