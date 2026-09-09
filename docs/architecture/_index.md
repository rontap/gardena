# Architecture

Module map and types for the game as it runs.

- [[architecture/modules]] — `MachineId` mill jam still barrel grinder compost-box furnace station infuser. Item axe chainsaw wood ash graft treasure flakes vanilla-extract bread. `{ kind: 'seeds'; crop: 'grass' }`. Illegal `{ kind: 'grass-seeds' }`. `AnnualId` grass. `GrownCrop`. `ResearchId` `unlock-hardened-tools` `unlock-infusion`. `SkuId` `buy-chainsaw` `buy-infuser` `pack-chilli` `pack-grass`. `VarietyId`. Cover burrow. luck. `feature-burrow/`. `feature-enclosure/`. `SensorKind` logic variety weather. Pump `in`. Command Center `notices`. App `recapDay`. Infusion. Infused jam / cask / spirit / oil. overlay-infused. Mill Infuser Furnace south-row chest I/O. `stipendOf`
- [[architecture/world]] — variety, quality, cut, station, burrow, luck, treasure, `lucky`. `AnnualId` grass. `Plant.crop` excludes grass. Illegal `{ kind: 'grass-seeds' }`. `ResearchId` `unlock-hardened-tools` `unlock-infusion`. `SkuId` `buy-chainsaw` `buy-infuser` `pack-grass`. Item kind `chainsaw` `flakes` `vanilla-extract` `bread`. Infusion. chilli. Infused. Infuser 2×2. overlay-infused. `Enclosure`. `HudTarget` logic variety weather pressure. `recaps` `recapUnseen`. `stipendOf`. Live seam play. Mill Infuser Furnace south-row
- [[architecture/tick]] — furnace origin, station origin. Burrow seam mint. Enclosure rebuild not on tick. Pump gather skip. No recap early return
- [[architecture/view]] — burrow cover. Sensor wash from watched set. Pump origin port. `view.boot`. Notice cell outline. overlay-infused
- [[architecture/log]]
- [[architecture/net]] — plant crop/variety/quality. `net.order`
- [[architecture/rng]] — no grow stream. Spatial `burrow`
- [[architecture/family]] — `BetterCrop`. luck
- [[architecture/tree]] — trunk, variety
- [[architecture/save]] — furnace recipe, axe, chainsaw, wood, ash, trunk, variety, quality, cut, graft, station, infuser, burrow, treasure, infused, flakes, vanilla-extract, bread. `{ kind: 'seeds'; crop: 'grass' }`. Illegal `{ kind: 'grass-seeds' }`. Logic parse aliases `and` / `or`. `save.recaps`. `stipendOf`. Dump seam play
- [[architecture/changelog]]
- [[architecture/i18n]] — `unlock-hardened-tools`, `chainsaw`, `unlock-infusion`, chilli, Infuser, Infusion, overlay-infused. `pack-grass` Grass seeds. `stipendOf`
- [[architecture/ai-gameplay-api]] — `play.seam` never holds at sundown

See [[canon]].
