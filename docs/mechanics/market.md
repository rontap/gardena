# Market

Walk fruit (and sugar) to the truck, open Market. Stall picture, a count per crop, **Sell all** for one number. That number already includes freshness and rarity.

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

`TRUCK_BASE` cells `(12,8)` `(13,8)`. Solid. Not a plot. Not a Place SKU. House, starter pump, and truck are not delete targets.

Yard three plots; pad `(12,9)` ∈ yard. `dest(consign) = PAD`. Click **truck cells only** → `{ act: 'consign' }`. Yard clicks are plot prompts.

Look **Market truck**. Prompt **Drop off**. Arrive pad: consign instant.

## Consign

Legal cargo: fruit, sugar, box fruit `count ≥ 1`.

Fruit / box fruit: stall takes count at `freshMul(freshness)` — [[mechanics/plants]]. Hand empty, or box cargo empty.

Sugar: stall id `sugar`, one bin, `worth += count × unitSale`. No rarity, no bio, no freshness. Hand empty.

Seeds illegal. Empty box: no-op, hand still the box. Wrong tool: speech, hand unchanged.

`StallGoodId` = `Exclude<CropId, 'sugar-cane'> | 'sugar'`. Illegal: any other id. Illegal: sugar-cane fruit (cane is never fruit).

Crop stall bins: stock + worth per rarity × bio. Illegal: consign that drops `fruit.bio`. Sugar: stock + worth only.

## Sell all

Legal only when `marketOpen`. Else closed copy.

`marketGain`: per crop good, per rarity × bio, `worth × stallX(id, mods) × raritySale(id, rarity)`, then sale skills. `raritySale` = `CROPS.saleMul?.[rarity] ?? RARITY_SALE[rarity]`. Sugar: `worth ×` saleswoman only.

`stallX`: crop → `CROPS.sale ×` skill `saleMul` 1.04 from player `better-*` (`Modifier.source === 'skill'`). No research `sale-mul`. No `bump-*`. Rarity is the extra `raritySale` factor, not inside `stallX`. Sugar skips `stallX` and `raritySale` (already in `unitSale`).

`worth` accumulated at consign as `count × freshMul` for fruit. Above 80% freshness, full price; below, scales down. Jam floors `freshMul` to `0.10 / 0.20 / 0.30 / 0.40 / 0.50` by owned tier. A raspberry forgotten in a chest is worth less without ever sitting ripe in the field.

Then at `marketGain`, not crop `Modifier`:

- saleswoman: every `StallGoodId` × `(1 + 0.02 × tier)`
- heirloom: `rarity === 'heirloom'` of crop stall goods × `(1 + 0.05 × tier)`. Not sugar
- bio: crop fruit `bio === true` × `(1 + 0.03 × tier)`. Not sugar
- clearance: freshness-0 fruit `$1` each. Else jam floor. Sugar does not rot

Sell all pays `marketGain`, clears stock, money += gain. One button. One number.

Better skill after pick: Sell all uses current `stallX`, not the baked `unitSale`.
