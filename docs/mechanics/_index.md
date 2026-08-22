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
- [[mechanics/log]]
- [[mechanics/rng]]

See [[canon]].

## Invariants

1. `DAY_SECONDS` is 240. Seam at `t >= DAY_SECONDS` opens recap before any field tick for the new day.
2. Seam: `money += 10` then `money -= tax()`. `tax() = 2 + 6 * (owned.length - 1)`, then `× (1 − 0.02 × tax tier)`, then min $1. Money may be negative.
3. Phases: `t = 0` sunrise, `t = 60` day, `t = 156` sunset, `t = 216` twilight. `'night'` is not a `DayPhase`.
4. Tilling untilled yields `empty` with `water === SOIL_TILL_WATER` and `fertilizer === goodness(rng, col, row)`.
5. Planting, harvest, death, rot, and weeding keep the same `Soil` instance. Water clamp `0..SOIL_WATER_MAX`. `drowning` iff `water > SOIL_WATER_MID`.
6. `goodness < VERY_HARD_MAX` → very-hard; `< HARD_MAX` → hard; else soft. Hard dirt is poor dirt.
7. Growing drinks `waterUsePerSec` and `PLANT_FERT_PER_SEC`. Ripe does not drink. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`.
8. Happiness starts `HAPPY_START`. Drown drain `HAPPY_DROWN_SECONDS`. Wilt `HAPPY_WILT_SECONDS`. Starve `HAPPY_STARVE_SECONDS`. Happiness 0 while growing: drown → `rotten`; wilt/starve → `dead`. Ripe does not die of water or fertilizer.
9. Ripen: `freshness = 1`, `rarity = rollGrowRarity(rarity, happiness, grow.at(col, row, day, n), extraUp1)`, then `ripenN` at that cell becomes `n + 1`. Absent `n` is 0. `extraUp1` is 0.04 if player owns `better-{crop}`, else 0; scaled by `h / HAPPY_MAX`. Ripe `freshness -= dt / rotSeconds`; `<= 0` → `rotten`.
10. Picked fruit keeps ticking freshness (hand, house, chest, ground, box cargo) until sold. `freshMul(f) = f >= 0.8 ? 1 : f / 0.8`, then jam floor if daughter owns `jam`.
11. Empty-hand harvest of ripe annual except sugar-cane: one fruit, current freshness, `unitSale = stats.sale`, plot `empty` same soil. Ripe sugar-cane: one sugar, `unitSale = stats.sale`, empty hand or merge into held sugar. Shovel growing/ripe annual: one seed. Shovel dead, rotten, weed, or grass: no drop.
12. Empty hand gathers weed/grass as items. Each `BIG_TICK`, each `empty` plot sprouts iff `weed.at(col, row, bigTicks) < WEED_CHANCE`. Kind: `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1.
13. Untuned sprinkler: `SPRINKLER_TILE_DAY` per covered growing tile. Smart crop dial: that crop’s `waterUsePerSec` per tile. Hand pour tops empty/weed to `SOIL_WATER_MID`, growing/ripe to `SOIL_WATER_MID + waterTolerance`.
14. Market is Sell all iff `marketOpen`. Sunrise/day always; sunset if `open-late`; twilight if `open-24`. Consign always. Closed: “Stall closed until morning.” / “Stall closed at twilight.” `marketGain` includes freshness (`worth`), rarity (`raritySale` = crop `saleMul` ?? `RARITY_SALE`), saleswoman `(1 + 0.02 × tier)`, heirloom `(1 + 0.05 × tier)`, better skill `saleMul` 1.04, bio `(1 + 0.03 × tier)`; jam floors `freshMul`; clearance freshness-0 fruit $1 else jam floor. Crop stall stock/worth per rarity×bio. Consign: fruit, sugar, box fruit. Seeds illegal. Sugar: baked `unitSale`, saleswoman only. No berry.
15. One research job. `buy-box` unlock `start`. `buy-box-large` unlock `unlock-large-box`. `BOX_SMALL` 5, `BOX_LARGE` 14, large $18. `buy-fertilizer` unlock `start`. `unlock-fertilizer` unlocks synthetic.
16. `buy-tile-paved` $5, `buy-tile-brick` $7, `buy-tile-cobble` $11. Cosmetic. Keep `ground`.
17. Hand is one item. House 16 slots. Chest `CHEST_SLOTS` 9. Starter: shovel in hand, bucket on door, house 5 common carrot / 2 rare carrot / 2 rare tomato / 2 heirloom potato / 1 apricot sapling / 1 lemon sapling / 1 cherry sapling, money 50.
18. Compost `COMPOST_NEED` → `COMPOST_LITERS` in `COMPOST_SECONDS`. Box $20. Composting research $14 / 45s.
19. `CHUNK` 32. `expandPrice = 40 + 15 * purchases`. 4-connected after `unlock-expand`.
20. Player-facing top rarity is Heirloom (`heirloom`). `RARITY_SALE` 1 / 1.25 / 2 / 3.5.
21. Crop stats are `CROPS`. Pack prices: carrot 3, potato 6, wheat 10, tomato 15, watermelon 18, raspberry 22, grape 16, olive 14, vanilla 40, sugar-cane 8. Shop packs are common unless player owns `seed-bank`: per rank 5% uncommon / 1.2% rare / 0.2% heirloom (`SEED_BANK_CHANCE`). Base 0. No tree pack.
22. Start chunk `(0,0)` has one wild 1×2 apple `Tree` on the first valid soft pair, `juvenile = 0`. No shrub.
23. Recap exit is only `dismissRecap()`. Each member `points += 1`, then play, `banner = 2`.
24. Offers 0–3 persist until pick. `pickSkill` costs 1 of that member’s points, writes `owned[id] = offered.tier`, `pickCount++`, rerolls that member only.
25. Tend once: player owns `tending`, empty hand, growing, `tended === false`. Not ripe. Then `tended = true`.
26. No `bump-carrot` `bump-potato` `bump-wheat`. No research `sale-mul`. Better crop is player `better-*` `saleMul` 1.04 and ripen `extraUp1` 0.04. Őstermelő gated on `unlock-heirloom`.
27. `unlockAll`: every research done, `money += 999`, job idle, each member `points = 99`. Does not grant skills. Does not reroll.
28. Water lens only if husband owns `water-study`. Land lens if husband owns `land-study`.
29. Raspberry research `reveal` is `unlock-grape`. Olive `reveal: unlock-tomato`. No `unlock-vanilla`. `pack-vanilla` shows after raspberry; buy requires `vanilla-tending`. `unlock-fermentation` automation $14 / 50s, unlocks `pack-sugar-cane`.
30. Vanilla `statsOf` sale uses `saleMul` 1 / 1.25 / 3 / 6. Common 22 < raspberry 26.
31. Ripe cane → sugar, not fruit. Sugar has no freshness tick. Plot empty, same soil.
32. `Plant.crop` is `AnnualId`. Sapling on a tilled plot is a no-op.
33. Tree juvenile `TREES.juvenileSeconds` (480) then `pending`. Next seam → 3× for 2 days. After that `chance = -0.2`, next seam +0.2 and roll. Off-season fruits at 0.75×.
34. Tree auto-drop freshness 1, cells stay `tree`. Shovel → sapling, cells bare soft.
35. No `'berry'` stall key. No `Shrub`. No `{ kind: 'berry' }` `{ kind: 'shrub' }`.
36. `better-olive` `better-grape` `better-sugar-cane` gated on `unlock-olive` / `unlock-grape` / `unlock-fermentation`. `vanilla-tending` gated on `unlock-raspberry`. `better-vanilla` gated on `vanilla-tending`. No `better-*` for `TreeId`.
37. `World.now` starts 0. Each `tick()` entry, including recap return, `now += 1`. `dispatch` stamps `Cmd.t = now`. Same-`t` cmds apply in log order. Ticks are not cmds.
38. `dispatch` appends to `World.log` and `sink`, then `apply`. `apply` does not log. Replay is `apply` only. `enqueue` does not `dispatch`.
39. Log is player `Cmd`s only. Not sips, rot, weed sprout, ripen, tree drop, grass, stall ticks, research drain, walk, panel, camera, hover, lens.
40. Same seed + same `Cmd[]` applied at those `t` with `dt = 1/15` → equal digest: `money`, `clock.day`, `clock.t`, `hand`, inventory, cell kinds, plant crop/rarity/maturity, drop count, `done`, family `owned`, stall stock.
41. Two Worlds, same seed, no cmds, N ticks of `1/15` → equal digest.
42. `shop.next()` does not move when `grow` rolls. Same seed: shop-only vs plant-then-shop, first granted pack rarity matches.
43. Two growing→ripe on one cell the same day use distinct `n`. Rarities need not match.
44. Two successful tree drops the same day each consume `fruit.next()`. Rarities need not match.
45. `JSON.parse(JSON.stringify(cmd))` equals that `Cmd` arm.
46. `Spatial.at` / `hash`: same args, any call order → same `u`.
47. Failed `buy` / `buyPacks` (closed, cannot afford, cannot fit) consumes 0 `shop.next()`. Failed tree drop consumes 0 `fruit.next()`. Granted pack: one `next()` each. `buyPacks` success: 5.
48. Pack rarity is `rollShopRarity(seed-bank tier, shop.next())`. Not `clock.t`. Not `money`.
