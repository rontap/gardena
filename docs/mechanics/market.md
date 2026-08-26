# Market

Walk fruit, sugar, and machine goods to the truck, open Market. Overlay **Stall** | **Contracts**. Stall tab: picture, a count per crop, **Sell all** for one number. That number already includes freshness and rarity. Board [[mechanics/contracts]] [[ui/contracts]].

## Hours

`marketOpen(phase)` — [[mechanics/family]].

| phase | open |
|---|---|
| sunrise, day | always |
| sunset | daughter owns `open-late` |
| twilight | daughter owns `open-24` |

Consign always. Sell all illegal when closed.

Closed copy: “Stall closed until morning.” / “Stall closed at twilight.”

## Truck

`TRUCK_BASE` cells. Solid. Not a plot. Not a Place SKU. House, starter pump, and truck are not delete targets.

Yard three plots; pad ∈ yard. `dest(consign) = PAD`. Click **truck cells only** → `{ act: 'consign' }`. Yard clicks are plot prompts.

Look **Market truck**. Prompt **Drop off**. Arrive pad: consign instant.

## Consign

Legal cargo: fruit (incl. sugar-cane), sugar, box fruit `count ≥ 1`, spirit, wine, jam, oil, flour, extract.

Fruit / box fruit: stall takes count at `freshMul(freshness)` — [[mechanics/plants]]. Hand empty, or box cargo empty.

Sugar: stall id `sugar`, one bin, `worth += liters × unitSale`.

Spirit / wine: stall id `SpiritKind` / `'wine'`, stock at rarity, `worth += count × unitSale`.

Jam / oil / flour / extract: one bin, `worth += count × unitSale`. `jam-tomato` **Ketchup**.

Seeds illegal. Empty box: no-op, hand still the box. Wrong tool: speech, hand unchanged.

Consign fills `contracts.active` in array order, then the stall. A full bin passes through. A unit that `Accepts` and `filled < amount` is contract-bound: it does not enter `StallGood.worth` and does not raise `sat`. Freshness-0 fruit skips bins and consigns to the stall. Miss / cancel remainders enter `worth` and raise `sat` — [[mechanics/contracts]].

`StallGoodId` — `sim/ids.ts`. Illegal: `'berry'`. Illegal: whisky.

Crop stall bins: stock + worth per rarity × bio. Illegal: consign that drops `fruit.bio`. Sugar / jam / oil / flour / extract: stock + worth only. Spirit / wine: stock + worth per rarity.

## Sell all

Legal only when `marketOpen`. Else closed copy.

`marketGain`: per crop good, per rarity × bio, `worth × stallX(id, mods) × raritySale(id, rarity)`, then sale skills. `raritySale` = `CROPS.saleMul?.[rarity] ?? RARITY_SALE[rarity]`. Sugar / jam / oil / flour / extract: `worth ×` saleswoman only. Spirit / wine: `worth ×` saleswoman, and heirloom if `rarity === 'heirloom'`.

`stallX`: crop → `CROPS.sale ×` skill `saleMul` from player `better-*` (`Modifier.source === 'skill'`). Rarity is the extra `raritySale` factor, not inside `stallX`. Sugar and machine goods skip `stallX` and `raritySale` (already in `unitSale`). Sugar-cane fruit uses crop `stallX`.

`worth` accumulated at consign as `count × freshMul` for fruit. Above 80% freshness, full price; below, scales down. Jam floors `freshMul` by owned tier. A raspberry forgotten in a chest is worth less without ever sitting ripe in the field.

Then at `marketGain`, not crop `Modifier`:

- saleswoman: every `StallGoodId` × `(1 + 0.02 × tier)`
- heirloom: `rarity === 'heirloom'` of crop stall goods, spirit, wine × `(1 + 0.05 × tier)`. Not sugar / jam / oil / flour / extract
- bio: crop fruit `bio === true` × `(1 + 0.04 × tier)`. Not sugar / machine goods
- clearance: freshness-0 fruit `$1` each. Else jam floor. Sugar and machine goods do not rot

Saturation last, per good, over that subtotal. [[mechanics/saturation]]. Clearance `$1` exempt. `marketGain()` is the paid total. At `sat = 0` it equals this number.

Consign still accumulates `worth` untouched except contract-bound units, which skip `worth` and `sat`. Saturation is sampled at Sell all, never at consign. Miss / cancel remainders do raise `sat`.

`World.marketQuote(): SellAllQuote`. Panel does no arithmetic.

Sell all pays `marketGain`, bumps `sat` by `V / SAT_DEPTH` clamp 1, clears stock, money += gain. One button. One number.

Better skill after pick: Sell all uses current `stallX`, not the baked `unitSale`.

## Invariants

`market.sell` — Market is Sell all iff `marketOpen`. Sunrise/day always; sunset if `open-late`; twilight if `open-24`. Consign always. Closed: “Stall closed until morning.” / “Stall closed at twilight.” Clean subtotal: freshness (`worth`), rarity (`raritySale` = crop `saleMul` ?? `RARITY_SALE`), saleswoman `(1 + 0.02 × tier)`, heirloom `(1 + 0.05 × tier)`, better skill `saleMul`, bio `(1 + 0.04 × tier)`; jam floors `freshMul`; clearance freshness-0 fruit `$1` else jam floor. Crop stall stock/worth per rarity×bio. Consign: fruit (incl. sugar-cane), sugar, box fruit, spirit, wine, jam, oil, flour, extract. Seeds illegal. Consign fills `contracts.active` in array order, then the stall. Contract-bound units skip `worth` and `sat`. Sugar / jam / oil / flour / extract: baked `unitSale`, saleswoman only. Spirit / wine: baked `unitSale`, saleswoman, heirloom if `heirloom`. No berry. Sat last — [[mechanics/saturation]].

`market.rarity` — Player-facing top rarity is Heirloom (`heirloom`). `RARITY_SALE`.

`market.vodka-common` — 10 common potato fruit `marketGain` vs one still batch of 10 common potato vodka `unitSale`: batch > fruit.

`market.vodka-heirloom` — 10 heirloom potato fruit `marketGain` vs one still batch of 10 heirloom potato vodka `unitSale`: fruit > batch.

`market.mixed` — Mixed still `unitSale` = `MIXED_MUL` × that rarity’s spirit sale. Mixed common vodka < 10 common potato fruit.

`market.sugar` — `SUGAR_MILL` < `SUGAR_SHOP`. `buy-sugar` is `SUGAR_BAG` at `SUGAR_SHOP`.
