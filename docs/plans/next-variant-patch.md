# Contract Variety and Quality

Minor. After [[plans/next-variant]]. Graduates into [[mechanics/contracts]], [[ui/contracts]], [[architecture/rng]]. Copy: [[standards/user-facing-text]].

The Variety split stripped `minRarity` from `Demand` so the board would still generate. Offers match a plain good only. This patch puts a Variety and a Quality floor on some offers. It does not change earn paths, the Station, or starter packs.

## Live (keep)

`rollBoard(rng, day, slots, rep)` is pure of `(seed, day, slot)` plus the reputation snapshot. It does not read inventory, plantings, research, or money. Board not saved, not digested. Guest consign fills bins; guest may not accept, cancel, or reorder.

`Demand` is a good (plain jam, spirit, fruit, wine, oil, flour, extract, bread, group jam, group spirit). `Accepts` ignores `infused`. Sugar and extract are never demanded. Flakes and vanilla-extract are not `StallGoodId`.

Unused `at` k 1, 4, 9. Amount derived, not rolled.

## New

`Demand` grows two required fields on a *specific* line (not a group):

```
variety: VarietyId | 'any'
qualityMin: number   // 0..1
```

`'any'` and `qualityMin === 0` is today’s match: any Variety, any Quality.

A group line (`jam` / `spirit`) stays `'any'` / 0. Do not put a Variety on a group.

Consign / fill: a unit counts only if its Variety matches (`'any'` or equal) and its Quality `>= qualityMin`. Infused still ignored. Bin fill math otherwise unchanged.

## Roll

Use unused k 1 (Variety vs `'any'`) and k 4 (Quality floor). No new stream.

| k | roll |
|---|---|
| 1 | specific line: `'any'` vs a named Variety of that good’s crop. Group: skip, stay `'any'` |
| 4 | specific line: `qualityMin` 0 or a step from `CONTRACT_QUALITY_STEPS` — preference. Group: 0 |

A named Variety is only legal when that crop has that Variety in `VARIETIES`. Fruit / jam / wine / spirit / oil / flour / bread keyed to a crop pick from that crop’s list including `'base'`. Goods with one Variety (`'base'` only) always `'any'`.

Do not read `World.done`. An offer may name Concord on day 1. The starter pack covers that.

Specialty: when k 1 names a Variety, the card prints that Variety. When `qualityMin > 0`, the card prints the Quality percent floor. No third word. Never rarity.

Difficulty: naming a Variety or a Quality floor spends grammar budget the way `GROUP_COST` does — `VARIETY_COST` `QUALITY_COST` preference. Requote so a four-star card is not all `'any'` / 0.

## UI

Contract card and hover already name the good and the amount. Add Variety when not `'any'`. Add **Quality {n}%** when `qualityMin > 0`. Almanac Contracts page follows the card; do not invent a second explanation.

`#debug-contracts` shows the new fields.

## Not this update

Station seed face. Changing starter packs. Guest accept. Infused as a demand. Sugar / extract / flakes / vanilla-extract as demand.
