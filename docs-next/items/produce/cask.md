# Wine and cider

| | |
|---|---|
| item kind | `'cask'` |
| unit | count (bottles) |
| stack limit | `STACK_MAX_CRAFTED` (+ `bulk-up`) |
| made by | [[items/buildings/barrel]] |
| sold at | Market |

Bottles collected from a Barrel. The longer the barrel ages after it matures, the more each bottle is worth.

## Variants

A Barrel takes one crop and one variety, so every bottle has exactly one variety. A bottle of a Named or Heirloom variety is a specialty bottle: the `specialty` skill raises its price.

| crop | Plain | Named | Heirloom |
|---|---|---|---|
| [[items/crops/grape]] (`wine`) | Wine | Concord: Wine | Kéknyelű: **Premium wine** |
| [[items/crops/apple]] (`cider`) | Cider | Kingston Black: Cider | Pink Lady: **Premium cider** |

Heirloom bottles are named Premium (`caskName`); Named bottles show the plain name and store their variety on the item. Each bottle also carries `infused`. An infused bottle shows **Infused {name}** ([[features/machines]]).

## Properties

`unitSale` is set at collection (`bakeCaskSale`): `CASK_SALE[cask]` × the Alcohol best-for multiplier × `qualityMul(quality)` × the age multiplier. The age multiplier rises from 1 at maturity (`BARREL_MATURE`) to `caskAgeTop(quality)` over `BARREL_AGE`; `caskAgeTop` goes from `CASK_AGE_MIN` at quality 0 to `CASK_AGE_MAX` at quality 1.

```
age multiplier

 caskAgeTop(q) |                      +------------
               |                   /
               |                /
               |             /
             1 |          +
               |          .
               +----------+-----------+------------> barrel age
                          A           B

 A = BARREL_MATURE: the barrel can be collected from here on
 B = BARREL_MATURE + BARREL_AGE: the multiplier stops rising
```

The Alcohol best-for multiplier is above 1 for Kingston Black and Kéknyelű (Alcohol varieties), below 1 for Concord and Pink Lady, and 1 for Plain.

Bottles merge only with the same cask, variety and `infused`. No freshness.

## Selling

`unitSale`, at the Market × the `saleswoman` skill, × the `specialty` skill for Named and Heirloom varieties, and for wine × the `heirloom` skill for Heirloom varieties (not cider); then the price drop applies ([[features/market]]).

## Affected by

- `saleswoman`, `specialty`, `heirloom` (wine only) skills.
- Infusion ([[items/buildings/infuser]]): infused bottles sell without adding to the price drop, and raise contract reputation by up to 25% ([[features/machines]]).
