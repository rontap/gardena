# Jam

| | |
|---|---|
| item kind | `'jam'` |
| unit | count (jars) |
| stack limit | `STACK_MAX_CRAFTED` (+ `bulk-up`) |
| made by | [[items/buildings/jam-machine]] |
| sold at | Market |

A jar made from one crop (`JamCrop`: apricot, grape, raspberry, cherry, tomato) and one variety. It does not lose freshness.

## Variants

Every jar the game can make, by crop and variety. The name comes from `jamJar`. A jar of a Named or Heirloom variety is a specialty jar: the `specialty` skill raises its price.

| crop | Plain | Named | Heirloom |
|---|---|---|---|
| [[items/crops/apricot]] | Apricot jam | Blenheim: Apricot jam | Klosterneuburger: Apricot jam |
| [[items/crops/grape]] | Grape jam | Concord: **Grape jelly** | Kéknyelű: Grape jam |
| [[items/crops/raspberry]] | Raspberry jam | — | Black raspberry: **Black raspberry jam** |
| [[items/crops/cherry]] | Cherry jam | — | Bing: Cherry jam |
| [[items/crops/tomato]] | **Ketchup** | Green Zebra: **Ketchup** | San Marzano: **Passata** |

Bold names are the jars with a name of their own. The other specialty jars show the plain jar name; their variety is stored on the item. An infused jar shows **Infused {name}** ([[features/machines]]).

## Properties

`quality` and `unitSale` are set when the jar is made. Jars merge only with the same crop, variety and `infused`; quality and `unitSale` are averaged by count.

## Selling

`unitSale` = `JAM_SALE[crop]` × the Preserving best-for multiplier of the variety × `qualityMul(quality)`. The multiplier is above 1 for Concord, Black raspberry and San Marzano (Preserving varieties), below 1 for the other Named and Heirloom varieties, and 1 for Plain.

At the Market × the `saleswoman` skill, × the `specialty` skill for Named and Heirloom varieties; then the price drop applies ([[features/market]]).

## Affected by

- `saleswoman`, `specialty` skills.
- Infusion ([[items/buildings/infuser]]): infused jars sell without adding to the price drop, and raise contract reputation by up to 25% ([[features/machines]]).
