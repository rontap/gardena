# Spirits

| | |
|---|---|
| item kind | `'spirit'` |
| unit | count (bottles) |
| stack limit | `STACK_MAX_CRAFTED` (+ `bulk-up`) |
| made by | [[items/buildings/still]], from [[items/crops/potato]], [[items/crops/wheat]] or [[items/crops/apricot]] only (`STILL_CROPS`) |
| sold at | Market |

One bottle per full Pot still batch (`STILL_CAP` fruit). What the bottle is depends on the batch.

## Variants

A batch of one crop and one variety makes that crop's spirit at that variety. A bottle of a Named or Heirloom variety is a specialty spirit: the `specialty` skill raises its price.

| crop | Plain | Named | Heirloom |
|---|---|---|---|
| potato | Vodka | Bintje: Vodka | — |
| wheat | Beer | Red Fife: Beer | — |
| apricot | Brandy | Blenheim: Brandy | Klosterneuburger: **Barackpálinka** |

A batch with more than one of these crops, or more than one variety, makes **Mixed spirit** with variety Plain.

Barackpálinka is the one spirit with a name of its own. The other specialty spirits show the plain name; their variety is stored on the item. An infused bottle shows **Infused {name}** ([[features/machines]]).

## Properties

Bottles merge only with the same spirit, variety and `infused`; quality and `unitSale` are averaged by count. No freshness.

## Selling

`unitSale` (`bakeSpiritSale`):

- Vodka, Beer, Brandy, Barackpálinka: `SPIRIT_SALE[spirit]` × the Alcohol best-for multiplier of the variety × `qualityMul(quality)`. The multiplier is above 1 for Bintje and Klosterneuburger (Alcohol varieties), below 1 for Red Fife and Blenheim, and 1 for Plain.
- Mixed spirit: `SPIRIT_SALE.vodka` × `MIXED_MUL` × `qualityMul(quality)`.

At the Market × the `saleswoman` skill, × the `heirloom` skill for Barackpálinka, × the `specialty` skill for Named and Heirloom varieties; then the price drop applies ([[features/market]]).

## Affected by

- `saleswoman`, `heirloom`, `specialty` skills.
- Infusion ([[items/buildings/infuser]]): infused bottles sell without adding to the price drop, and raise contract reputation by up to 25% ([[features/machines]]).
