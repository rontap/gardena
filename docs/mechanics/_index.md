# Mechanics

Rules as the game runs. Tests follow the numbered list. Numbers: preference / tuned-to / derived — [[standards/docs]].

- [[mechanics/day]]
- [[mechanics/soil]]
- [[mechanics/plants]]
- [[mechanics/water]]
- [[mechanics/weeds]]
- [[mechanics/market]]
- [[mechanics/research]]
- [[mechanics/family]]
- [[mechanics/expansion]]
- [[mechanics/inventory]]

See [[canon]].

## Invariants

1. `DAY_SECONDS` is 240. Seam at `t >= DAY_SECONDS` opens recap before any field tick for the new day.
2. Seam: `money += 10` then `money -= tax()`. `tax() = 2 + 6 * (owned.length - 1)`, then `× (1 − 0.02 × tax tier)`, then min $1. Money may be negative.
3. Phases: `t = 0` sunrise, `t = 60` day, `t = 156` sunset, `t = 216` twilight. `'night'` is not a `DayPhase`.
4. Tilling untilled yields `empty` with `water === SOIL_TILL_WATER` and `fertilizer === goodness(seed, col, row)`.
5. Planting, harvest, death, rot, and weeding keep the same `Soil` instance. Water clamp `0..SOIL_WATER_MAX`. `drowning` iff `water > SOIL_WATER_MID`.
6. `goodness < VERY_HARD_MAX` → very-hard; `< HARD_MAX` → hard; else soft. Hard dirt is poor dirt.
7. Growing drinks `waterUsePerSec` and `PLANT_FERT_PER_SEC`. Ripe does not drink. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`.
8. Happiness starts `HAPPY_START`. Drown drain `HAPPY_DROWN_SECONDS`. Wilt `HAPPY_WILT_SECONDS`. Starve `HAPPY_STARVE_SECONDS`. Happiness 0 while growing: drown → `rotten`; wilt/starve → `dead`. Ripe does not die of water or fertilizer.
9. Ripen: `freshness = 1`, `rarity = rollGrowRarity(rarity, happiness, hash(seed, 'grow-rarity', col, row, day))`. Ripe `freshness -= dt / rotSeconds`; `<= 0` → `rotten`.
10. Picked fruit keeps ticking freshness (hand, house, chest, ground, box cargo) until sold. `freshMul(f) = f >= 0.8 ? 1 : f / 0.8`, then jam floor if daughter owns `jam`.
11. Empty-hand harvest of ripe: one fruit, current freshness, `unitSale = stats.sale`, plot `empty` same soil. Shovel growing/ripe: one seed. Shovel dead, rotten, weed, or grass: no drop.
12. Empty hand gathers weed/grass as items. Each `BIG_TICK`, each `empty` plot rolls `WEED_CHANCE`.
13. Untuned sprinkler: `SPRINKLER_TILE_DAY` per covered growing tile. Smart crop dial: that crop’s `waterUsePerSec` per tile. Hand pour tops empty/weed to `SOIL_WATER_MID`, growing/ripe to `SOIL_WATER_MID + waterTolerance`.
14. Market is Sell all iff `marketOpen`. Sunrise/day always; sunset if `open-late`; twilight if `open-24`. Consign always. Closed: “Stall closed until morning.” / “Stall closed at twilight.” `marketGain` includes freshness (`worth`), rarity (`RARITY_SALE`), saleswoman `(1 + 0.02 × tier)`, heirloom `(1 + 0.05 × tier)`, better skill `saleMul` 1.04, bio `(1 + 0.03 × tier)`; jam floors `freshMul`; clearance freshness-0 fruit $1 else jam floor. Crop stall stock/worth per rarity×bio. Consign: fruit, berry, box fruit, box berry. Seeds illegal.
15. One research job. `buy-box` unlock `start`. `buy-box-large` unlock `unlock-large-box`. `BOX_SMALL` 5, `BOX_LARGE` 14, large $18. `buy-fertilizer` unlock `start`. `unlock-fertilizer` unlocks synthetic.
16. `buy-tile-paved` $5, `buy-tile-brick` $7, `buy-tile-cobble` $11. Cosmetic. Keep `ground`.
17. Hand is one item. House 16 slots. Chest `CHEST_SLOTS` 9. Starter: shovel in hand, bucket on door, house 5 common carrot / 2 rare carrot / 2 rare tomato / 2 heirloom potato, money 50.
18. Compost `COMPOST_NEED` → `COMPOST_LITERS` in `COMPOST_SECONDS`. Box $20. Composting research $14 / 45s.
19. `CHUNK` 32. `expandPrice = 40 + 15 * purchases`. 4-connected after `unlock-expand`.
20. Player-facing top rarity is Heirloom (`heirloom`). `RARITY_SALE` 1 / 1.25 / 2 / 3.5.
21. Crop stats are `CROPS`. Pack prices: carrot 3, potato 6, wheat 10, tomato 15, watermelon 18, raspberry 22.
22. Start chunk `(0,0)` has one wild 1×2 apple tree on the first valid soft pair.
23. Recap exit is only `dismissRecap()`. Each member `points += 1`, then play, `banner = 2`.
24. Offers 0–3 persist until pick. `pickSkill` costs 1 of that member’s points, writes `owned[id] = offered.tier`, `pickCount++`, rerolls that member only.
25. Tend once: player owns `tending`, empty hand, growing, `tended === false`. Not ripe. Then `tended = true`.
26. No `bump-carrot` `bump-potato` `bump-wheat`. No research `sale-mul`. Better crop sale is daughter `better-*` `saleMul` 1.04.
27. `unlockAll`: every research done, `money += 999`, job idle, each member `points = 99`. Does not grant skills. Does not reroll.
28. Water lens only if husband owns `water-study`. Land lens if husband owns `land-study`.
