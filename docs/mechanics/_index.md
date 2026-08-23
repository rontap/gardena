# Mechanics

Rules as the game runs. Tests follow the numbered list. Numbers: preference / tuned-to / derived — [[standards/docs]].

- [[mechanics/day]]
- [[mechanics/soil]]
- [[mechanics/plants]]
- [[mechanics/trees]]
- [[mechanics/water]]
- [[mechanics/weeds]]
- [[mechanics/market]]
- [[mechanics/research]]
- [[mechanics/family]]
- [[mechanics/expansion]]
- [[mechanics/inventory]]
- [[mechanics/machines]]
- [[mechanics/vehicles]]
- [[mechanics/log]]
- [[mechanics/rng]]
- [[mechanics/tutorial]]
- [[mechanics/multiplayer]]

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
10. Picked fruit keeps ticking freshness (hand, house, chest, ground, box cargo) until sold. Freezer slots skip `tickFreshness`. `freshMul(f) = f >= 0.8 ? 1 : f / 0.8`, then jam floor if daughter owns `jam`.
11. Empty-hand harvest of ripe annual including sugar-cane: one fruit, current freshness, `unitSale = stats.sale`, plot `empty` same soil. Fruit box: into the box if it accepts. Shovel growing/ripe annual: one seed. Shovel dead, rotten, weed, or grass: no drop.
12. Empty hand gathers weed/grass as items. Each `BIG_TICK`, each `empty` plot sprouts iff `weed.at(col, row, bigTicks) < WEED_CHANCE`. Kind: `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1.
13. Untuned sprinkler: `SPRINKLER_TILE_DAY` per covered growing tile. Smart crop dial: that crop’s `waterUsePerSec` per tile. Hand pour tops empty/weed to `SOIL_WATER_MID`, growing/ripe to `SOIL_WATER_MID + waterTolerance`.
14. Market is Sell all iff `marketOpen`. Sunrise/day always; sunset if `open-late`; twilight if `open-24`. Consign always. Closed: “Stall closed until morning.” / “Stall closed at twilight.” `marketGain` includes freshness (`worth`), rarity (`raritySale` = crop `saleMul` ?? `RARITY_SALE`), saleswoman `(1 + 0.02 × tier)`, heirloom `(1 + 0.05 × tier)`, better skill `saleMul` 1.04, bio `(1 + 0.03 × tier)`; jam floors `freshMul`; clearance freshness-0 fruit $1 else jam floor. Crop stall stock/worth per rarity×bio. Consign: fruit (incl. sugar-cane), sugar, box fruit, spirit, wine, jam, oil, flour, extract. Seeds illegal. Sugar / jam / oil / flour / extract: baked `unitSale`, saleswoman only. Spirit / wine: baked `unitSale`, saleswoman, heirloom if `heirloom`. No berry.
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
29. Raspberry research `reveal` is `unlock-grape`. Olive `reveal: unlock-tomato`. No `unlock-vanilla`. `pack-vanilla` shows after raspberry; buy requires `vanilla-tending`. `unlock-fermentation` automation $14 / 50s, unlocks `pack-sugar-cane` and gates `buy-still` `buy-barrel`. `unlock-grinder` also gates `buy-mill`. `unlock-preservatives` automation $20 / 55s, reveal `unlock-grinder`, gates `buy-jam` `buy-freezer` `buy-sugar`. No `unlock-mill` `unlock-jam` `unlock-still` `unlock-barrel` `unlock-freezer`.
30. Vanilla `statsOf` sale uses `saleMul` 1 / 1.25 / 3 / 6. Common 22 < raspberry 26.
31. Ripe cane harvests as fruit. Mill 5 cane → `SUGAR_BAG` 2 L at `SUGAR_MILL` 5 / L. Sugar `{ kind: 'sugar'; liters; capacityLiters; unitSale }`. Illegal: `sugar.count`. Sugar does not tick freshness.
32. `Plant.crop` is `AnnualId`. Sapling on a tilled plot is a no-op.
33. Tree juvenile `TREES.juvenileSeconds` (480) then `pending`. Next seam → 3× for 2 days. After that `chance = -0.2`, next seam +0.2 and roll. Off-season fruits at 0.75×.
34. Tree auto-drop freshness 1, cells stay `tree`. Shovel → sapling, cells bare soft.
35. No `'berry'` stall key. No `Shrub`. No `{ kind: 'berry' }` `{ kind: 'shrub' }`.
36. `better-olive` `better-grape` `better-sugar-cane` gated on `unlock-olive` / `unlock-grape` / `unlock-fermentation`. `vanilla-tending` gated on `unlock-raspberry`. `better-vanilla` gated on `vanilla-tending`. No `better-*` for `TreeId`.
37. `World.now` starts 0. Each `tick()` entry, including recap return, `now += 1`. `dispatch` stamps `Cmd.t = now`. Same-`t` cmds apply in log order. Ticks are not cmds.
38. `dispatch` appends to `World.log` and `sink`, then `apply`. `apply` does not log. Replay is `apply` only. `enqueue` does not `dispatch`.
39. Log is player `Cmd`s only. Not sips, rot, weed sprout, ripen, tree drop, grass, stall ticks, research drain, mill / jam / still / barrel ticks, vehicle integrate / burn / follow hitch / boom, walk, panel, camera, hover, lens.
40. Same seed + same `Cmd[]` applied at those `t` with `dt = 1/15` → equal digest: `money`, `clock.day`, `clock.t`, each seat `hand`/`inventory`, cell kinds, plant crop/rarity/maturity, drop count, `done`, family `owned`, stall stock.
41. Two Worlds, same seed, no cmds, N ticks of `1/15` → equal digest.
42. `shop.next()` does not move when `grow` rolls. Same seed: shop-only vs plant-then-shop, first granted pack rarity matches.
43. Two growing→ripe on one cell the same day use distinct `n`. Rarities need not match.
44. Two successful tree drops the same day each consume `fruit.next()`. Rarities need not match.
45. `JSON.parse(JSON.stringify(cmd))` equals that `Cmd` arm.
46. `Spatial.at` / `hash`: same args, any call order → same `u`.
47. Failed `buy` / `buyPacks` (closed, cannot afford, cannot fit) consumes 0 `shop.next()`. Failed tree drop consumes 0 `fruit.next()`. Granted pack: one `next()` each. `buyPacks` success: 5.
48. Pack rarity is `rollShopRarity(seed-bank tier, shop.next())`. Not `clock.t`. Not `money`.
49. Tutorial on only at New Game with `!slotExists()` and fragment not `start_now`. `slotExists()` or `#start_now` → off, including New Game. Load / Upload → off.
50. No tutorial field on `Save` or `World`. Session only. Parse does not resume a step.
51. `tilledCount` is `isTilled` cells (`empty` `weed` `turf` `growing` `ripe` `dead` `rotten`), distinct. Five such cells: not step 2. Not `World.digs`.
52. Step 5 completes on `startResearch` that sets `job.kind === 'run'`, or `done.size > 0`. Not on opening Research.
53. Step 6 ready is `waterBand(...) === 'red'` on a `growing` plant. No extra thirst flag.
54. A box is `Item` `{ kind: 'box' }` in hand, house, chest, or drops. Cap `BOX_SMALL` or `BOX_LARGE`. Not `CompostBox`. Not an unconfirmed SKU.
55. Step 9 completes on a paying `sellAll` (`marketOpen` and `marketGain() > 0`). No-op does not complete.
56. Step 10 dismiss is a click on the tutorial card. Then off for this session. No timer, no click-anywhere, no auto-dismiss.
57. Tutorial does not change crops, buildings, skills, or economy. Does not block HUD. Does not force camera. No step counter.
58. Live App accumulator calls `tick(DT_MAX)` only. Leftover rAF never ticks a non-`DT_MAX` slice. View paints every rAF. Solo and MP.
59. Per host `bundle`: apply `cmds` in log order, then `tick(DT_MAX)`. Empty `cmds` still tick. `bundle.t` is `now` after that tick. Same seed + same bundles → equal digest: invariant 40 plus every seat `actor.x`/`actor.y`, `hand`, `inventory`, `presence`, `place`.
60. Sequencer drops illegal guest cmds. They never enter a bundle. Those cmds no-op.
61. Guest may shop + place + `delete` building for pumpjack, well, rain-tank, tap, chest, grinder, compost-box, mill, jam, still, barrel, freezer, hangar, silo-seed, silo-spray, silo-produce. Guest may dump mill/jam/still/barrel like compost. Guest chest/freezer `swapChest`, pipes, valves, sprinklers, tiles, fences, expand, research start, family pick, cheat: not.
62. `presence === 'away'`: tick skips that actor walk/work and that seat hand/inventory freshness (box cargo included). Field, chest, and ground rot continue. Freezer slots never tick freshness. Seat stays in `seats`.
63. `parse(text)`: `JSON.parse` throw or non-object → `{ ok: false, reason: 'unusable' }`. `game !== "gardena"` → `reason: 'not-gardena'`. File `version` ≠ dump `version` (absent included) → `reason: 'version'`. Else one hydrate of live fields including `seats`. Reconstruct → `{ ok: true, world }`. Hydrate fail → `reason: 'unusable'`. No migrate. `LoadFailReason` is `'not-gardena' | 'version' | 'unusable'`.
64. `hello` when `seats.length === 4` → `reject: full`. Away occupies a slot. Rejoin is the same `playerId`.
65. Digest mismatch: pause, `resync`, Ready, unpause. One retry. Second mismatch → that guest `bye: kicked`. Host continues.
66. 10 common potato fruit `marketGain` $60. One still batch of 10 common potato is vodka `unitSale` $72.
67. 10 heirloom potato fruit `marketGain` $210. One still batch of 10 heirloom potato is vodka `unitSale` $104.
68. Mixed still `unitSale` = `MIXED_MUL` × that rarity’s spirit sale. Mixed common vodka < 10 common potato fruit $60.
69. `SUGAR_MILL` 5 / L < `SUGAR_SHOP` 8 / L. `buy-sugar` $16 for `SUGAR_BAG` 2 L.
70. Barrel is grapes → wine only. No whisky. No migrate.
71. Juvenile growth does not ping. `tickTree` pings `'field'` only on visual stage change: juvenile crosses 1, fruit drop succeeds, fruit first hits 1 on a blocked drop then silent until a drop succeeds. Juvenile increment while `< 1` does not ping. Repeat blocked drop at `fruit === 1` does not ping. Dirty reasons stay `'act' | 'field' | 'big' | 'speech'`. `'field'` means Marks/plots need React.
72. `SAVE_VERSION` 1.5. `PROTOCOL` 1.5. Wordmark 1.5.0. No migrate. Dump `vehicles` + `trailers` + hangar/silo cells. Digest includes every vehicle `id` `kind` `fuel` `pose` and quad `slots` / tractor `hitch`, every trailer `id` `kind` `pose` hopper or `slots`.
73. `VehicleKind` is `'quad' | 'tractor'`. Quad `slots.length === VEHICLE_SLOTS`, no hitch. Tractor no slots, `hitch: TrailerId | 'none'`. Fuel is `0..1` on the vehicle, not an Item. Trailer is stored or attached, never loose. `TRAILER_CAP` 100 is the only cargo cap.
74. Unlimited quads, tractors, trailers. `Act.buyVehicle` pays `QUAD_PRICE` / `TRACTOR_PRICE`, not `skuPrice`. `Act.buyTrailer` pays `TRAILER_*_PRICE`. `machine-contracts` does not discount hangar-buys. `buy-hangar` and three silo SKUs automation `skuPrice` (contracts apply).
75. Guests: hangar cue HUD, `buy-hangar` + three silo SKUs in `GUEST_BUILD`, buy Quad / tractor / trailers, refill, `swapVehicle` `swapTrailer`, embark, disembark, dock, drive, delete empty hangar. Guest `swapChest` still not.
76. Surface mul applies to the cap, not accel. Paved `SURFACE_PAVED`. Tilled (empty weed growing ripe dead rotten turf) / rock / `isSolid` `SURFACE_SLOW`. Grass, untilled bare, cobble, brick, fence `SURFACE_NORMAL`. After integrate, `floor(x,y)` not owned → reject the step. No fade driving. Walk speed unchanged.
77. Empty fuel cap `QUAD_EMPTY_MUL × vMax × surfaceMul × machineryMul` (`vMax` is `QUAD_VMAX` or `TRACTOR_VMAX`). No auto-dismount. Can still `Act.embark`. Burn `dt / QUAD_FUEL_SECONDS` while driver and (`throttle ≠ 0` || `steer ≠ 0`). Tractor `TRACTOR_VMAX = QUAD_VMAX × 0.67`, `TRACTOR_ACCEL = QUAD_ACCEL × 0.5`, `TRACTOR_R = QUAD_R × 0.75`, `TRACTOR_YAW = TRACTOR_VMAX / TRACTOR_R`.
78. Refill all: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Poor no-op. Success: every tank `1`. Shared `World.money`. Trailers have no fuel.
79. Tank-steer: `Drive` `-1 | 0 | 1`. W forward S reverse A/D yaw. Kind yaw same at speed 0. Latest `Act.drive` same `t` wins. Machinery `× (1 + 0.05 × tier)` on vMax and accel only. Boots not. Yaw not.
80. Hangar `HANGAR_W × HANGAR_H`, door south, no rotate. Pad `row = base.row + 2`, `col .. col + HANGAR_W - 1`, stay plots. Silos same footprint, reuse `hangarPad`. Store is `Act.dock` while driver and `floor(x,y)` is a hangar pad cell; that hangar; tractor hitch stores with it. Not on tick. Silo pad is not Dock. Buy from A stores at A. Deploy from B of stored-at-A spawns on B pad, heading `HEADING_SOUTH`, seats immediately; tractor hitch optional (stored trailer or none). Cannot delete a hangar that stores a vehicle or a trailer. Field vehicles do not block delete. Silos delete always.
81. Seated `Act.click` field acts no-op. No coast-walk. `Act.disembark` while driver: speed 0, `driver 'none'`, actor at vehicle `x,y`, drive `{0,0}`, queue `[]`, hitch stays. Always legal while driving. `Act.dock` else no-op. Guest may disembark and dock.
82. Quad slots: any Item, chest swap + compact, `tickFreshness` (not freezer). `Act.swapVehicle` legal iff parked. Tractor has no 6-slot. Trailer cargo parked only: `Act.swapTrailer` iff attached to a tractor that is field && `driver === 'none'`. Seed/spray hopper wrong kind unrepresentable. Harvest 8 slots chest merge+compact, `tickFreshness`. Hangar HUD has no cargo. Parked HUD is `Cue` `{ kind: 'vehicle'; id }` (Quad 6 slots + Embark; tractor trailer cargo if hitched + Embark).
83. Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays. Recap freezes vehicle integrate (boom does not run). Actor pose tracks vehicle while driver. Hide gardener / hat / camera follow are view, not sim.
84. Two drivers on one vehicle, seated + walk/work queue, stored + driver, stored tractor hitch, quad hitch, tractor slots, two trailers on one tractor, attached + stored, trailer attached to missing tractor, harvest `slots.length ≠ 8`, seed/spray hopper wrong item, `HudTarget` hangar, `HudTarget` vehicle: unrepresentable. Boom fires iff driven tractor, hitch present, `steer === 0`, `speed > 0`; after integrate; not a Cmd. Hangar HUD is `Cue` `{ kind: 'hangar'; at }`. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`. Silo: look name only, no cue.
