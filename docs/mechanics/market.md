# Market

Walk fruit, sugar, and machine goods to the truck, open Market. Overlay **Stall** | **Contracts**. Stall tab: picture, a count per crop, **Sell all** for one number. That number already includes freshness, quality, and path rating. Board [[mechanics/contracts]] [[ui/contracts]].

## Hours

`marketOpen` is always true. No phase hours. No weather close. Consign always. Sell all always legal.

## Truck

`TRUCK_BASE` cells. Solid. Not a plot. Not a Place SKU. House, starter pump, and truck are not delete targets.

Yard three plots; pad ∈ yard. `dest(consign) = PAD`. Click **truck cells only** → `{ act: 'consign' }`. Yard clicks are plot prompts.

Look **Market truck**. Prompt **Drop off**. Arrive pad: consign instant.

## Consign

Legal cargo: fruit (incl. sugar-cane, chilli), sugar, spirit, cask (wine / cider), jam, oil, flour, extract, bread. Flakes and vanilla-extract illegal. `{ kind: 'rotten' }` legal iff `unlock-fermentation` in `done`. Without that row: compost only, consign refused. Infused jam / cask / spirit / oil consign as those goods; `infused` is kept — [[mechanics/infusion]] `infusion.stall`.

Fruit: stall takes count at

```
worth += count × freshMul(freshness) × qualityMul(quality) × purposeMul(variety, 'produce')
```

— [[mechanics/plants]]. Hand empty after.

Sugar: stall id `sugar`, one bin, `worth += liters × unitSale`.

Spirit / cask: stall id `SpiritKind` / `CaskId`, stock per variety (mixed: one bin), `worth += count × unitSale`. The bin is a `CaskId` and reads the plain `CASK_NAME`; the **Premium** prefix is on the item, which carries a variety — [[mechanics/machines]].

Jam / oil / flour / extract / bread: one bin, `worth += count × unitSale`. Infusable goods (jam, cask, spirit, oil) stock and worth per variety × `InfusedKey`. `jam-tomato` **Ketchup** when variety is `'base'`. Named jars — [[mechanics/machines]].

Seeds and grafts illegal. Wrong tool: speech, hand unchanged.

Consign fills `contracts.active` in array order, then the stall. A full bin passes through. A unit that `Accepts` and `filled < amount` is contract-bound: it does not enter `StallGood.worth` and does not raise `sat`. `{ kind: 'rotten' }` is not a `StallGoodId`, never `Accepts`, never contract-bound. Consigned rotten is `World.clearance: number` — [[architecture/world]]. Dump persists it. Sell all zeros it. Freshness-0 fruit is not an item after tick. Miss / cancel remainders enter `worth` and raise `sat` — [[mechanics/contracts]].

`StallGoodId` — `sim/ids.ts`. Illegal: `'berry'`. Illegal: whisky.

Crop stall bins: stock + worth per variety. Sugar / flour / extract / bread: stock + worth only. Jam / oil: stock + worth per `InfusedKey`. Spirit / cask: stock + worth per variety × `InfusedKey`. Mixed: one bin × `InfusedKey`. Flakes and vanilla-extract are not `StallGoodId`.

## Sell all

Legal when `marketOpen`. `marketOpen` is always true.

`marketGain`: per crop good, per variety, `worth × stallX(id, mods)`, then sale skills. Sugar / oil / flour / extract / bread: `worth ×` saleswoman only. Jam: `worth ×` saleswoman, and specialty if variety tier is `variant` | `heirloom`. Spirit / wine: `worth ×` saleswoman, heirloom if variety tier is `heirloom`, specialty if variety tier is `variant` | `heirloom`. Cider: `worth ×` saleswoman, and specialty if variety tier is `variant` | `heirloom`. Infused uses the same skills as the plain good.

`stallX`: crop → `CROPS.sale ×` skill `saleMul` from player `better-*` (`Modifier.source === 'skill'`). Quality and path rating are already in `worth` at consign, not inside `stallX`. Sugar and machine goods skip `stallX` (already in `unitSale`). Sugar-cane fruit uses crop `stallX`.

`worth` for fruit accumulated at consign as `count × freshMul × qualityMul × purposeMul(variety, 'produce')`. Above 80% freshness, full freshness factor; below, scales down. A raspberry forgotten in a chest is worth less without ever sitting ripe in the field.

Then at `marketGain`, not crop `Modifier`:

- saleswoman: every `StallGoodId` × `(1 + 0.02 × tier)`
- heirloom: variety tier `heirloom` of crop fruit, spirit, wine × `(1 + 0.05 × tier)`. Not cider. Not sugar / jam / oil / flour / extract / bread
- specialty: jam / spirit / wine / cider variety tier `variant` | `heirloom` × `(1 + 0.05 × tier)`. Stacks with heirloom. Not sugar / oil / flour / extract / bread. Not raw fruit
- flood or drought: fruit stall goods only (annual including sugar-cane and chilli, tree fruit) × `WEATHER_FRUIT_SALE`. Not sugar / jam / spirit / wine / oil / flour / extract / bread. After skills, before sat. — [[mechanics/weather]]
- rotten: `{ kind: 'rotten' }` `$1` each iff `unlock-fermentation` in `done`. Sat exempt. Saleswoman / heirloom / specialty / weather do not apply. Sugar and machine goods do not rot. Without that row: consign refused.

Saturation last, per good, over that subtotal. Infused clean pays `mul(sat)` and does not raise `sat` — [[mechanics/infusion]] `infusion.stall` [[mechanics/saturation]] `sat.infused`. Rotten `$1` exempt. `marketGain()` is the paid total. At `sat = 0` it equals this number.

Consign still accumulates `worth` untouched except contract-bound units, which skip `worth` and `sat`. Saturation is sampled at Sell all, never at consign. Miss / cancel remainders do raise `sat`.

`World.marketQuote(): SellAllQuote`. Panel does no arithmetic.

Sell all pays `marketGain`, bumps `sat` by `V / SAT_DEPTH` clamp 1, clears stock, money += gain. One button. One number.

Better skill after pick: Sell all uses current `stallX`, not the baked `unitSale`.

## Invariants

`market.sell` — Market is Sell all iff `marketOpen`. `marketOpen` is always true. No phase hours. No weather close. Consign always. Clean subtotal: freshness + quality + path rating (`worth`), saleswoman `(1 + 0.02 × tier)`, heirloom `(1 + 0.05 × tier)` on variety tier `heirloom` of crop fruit, spirit, wine, specialty `(1 + 0.05 × tier)` on jam / spirit / wine / cider variety tier `variant` | `heirloom` stacked with heirloom, better skill `saleMul`; flood/drought fruit stall goods × `WEATHER_FRUIT_SALE` after skills before sat; `{ kind: 'rotten' }` `$1` iff `unlock-fermentation` in `done`, sat exempt, saleswoman / heirloom / specialty / weather do not apply. Crop stall stock/worth per variety. Consign: fruit (incl. sugar-cane, chilli), sugar, spirit, cask, jam, oil, flour, extract, bread; `{ kind: 'rotten' }` iff `unlock-fermentation` in `done`. Flakes and vanilla-extract illegal. Without that row: consign refused. Seeds and grafts illegal. Consign fills `contracts.active` in array order, then the stall. Contract-bound units skip `worth` and `sat`. Rotten never `Accepts`. Sugar / oil / flour / extract / bread: baked `unitSale`, saleswoman only. Jam: baked `unitSale`, saleswoman, specialty if variety tier `variant` | `heirloom`. Spirit / wine: baked `unitSale`, saleswoman, heirloom if variety tier `heirloom`, specialty if variety tier `variant` | `heirloom`. Cider: baked `unitSale`, saleswoman, specialty if variety tier `variant` | `heirloom`. Infused jam / cask / spirit / oil: same skills, `InfusedKey` bin. No berry. Sat last; infused pays `mul(sat)` and does not raise `sat` — [[mechanics/saturation]] [[mechanics/infusion]] [[mechanics/weather]].

`market.infused` — Infused clean `V_inf` pays `V_inf × mul(sat, good)` at that good's sat at the start of Sell all for that good, and does not raise `sat`. Plain trapezoid still raises `sat`. Flakes and vanilla-extract are not stall goods.

`market.quality` — Crop stall bins per crop × variety. Consign folds `freshMul`, `qualityMul`, and `purposeMul(variety, 'produce')` into `worth`. Sell all uses `stallX` and sale skills; no second purpose multiplier.

`market.vodka-common` — 10 `'base'` potato fruit at quality 0 `marketGain` vs one still batch of 10 `'base'` potato vodka at quality 0 `unitSale`: batch > fruit.

`market.vodka-bintje` — 10 `bintje` potato fruit at quality 1 `marketGain` vs one still batch of 10 `bintje` potato vodka at quality 1 `unitSale`: the fruit pays the off-purpose rate, the batch the on-purpose one.

`market.mixed` — Mixed still `unitSale` = `MIXED_MUL` × `SPIRIT_SALE.vodka` × `qualityMul(mean q)`, neutral rating. Mixed vodka at quality 0 < 10 `'base'` potato fruit.

`market.sugar` — `SUGAR_MILL` > `SUGAR_SHOP`. `buy-sugar` is `SUGAR_BAG` at `SUGAR_SHOP`, quality 0.
