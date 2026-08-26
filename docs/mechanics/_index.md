# Mechanics

Rules as the game runs. Tests follow the numbered list. Numbers: preference / tuned-to / derived — [[standards/docs]].

- [[mechanics/day]]
- [[mechanics/soil]]
- [[mechanics/plants]]
- [[mechanics/trees]]
- [[mechanics/water]]
- [[mechanics/sensors]]
- [[mechanics/weeds]]
- [[mechanics/market]]
- [[mechanics/saturation]]
- [[mechanics/contracts]]
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
4. Tilling untilled yields `empty` with `water === SOIL_TILL_WATER`, `fertilizer === goodness(rng, col, row)`, and `weedChance === WEED_CHANCE`.
5. Planting, harvest, death, rot, and weeding keep the same `Soil` instance. Water clamp `0..SOIL_WATER_MAX`. `drowning` iff `water > SOIL_WATER_MID`.
6. `goodness < VERY_HARD_MAX` → very-hard; `< HARD_MAX` → hard; else soft. Hard dirt is poor dirt.
7. Growing drinks `waterUsePerSec` and `PLANT_FERT_PER_SEC`. Ripe does not drink. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`.
8. Happiness starts `HAPPY_START`. Drown drain `HAPPY_DROWN_SECONDS`. Wilt `HAPPY_WILT_SECONDS`. Starve `HAPPY_STARVE_SECONDS`. Happiness 0 while growing: drown → `rotten`; wilt/starve → `dead`. Ripe does not die of water or fertilizer.
9. Ripen: `freshness = 1`, `rarity = rollGrowRarity(rarity, happiness, grow.at(col, row, day, n), extraUp1)`, then `ripenN` at that cell becomes `n + 1`. Absent `n` is 0. `extraUp1` is 0.04 if player owns `better-{crop}`, else 0; scaled by `h / HAPPY_MAX`. Ripe `freshness -= dt / rotSeconds`; `<= 0` → `rotten`.
10. Picked fruit keeps ticking freshness (hand, house, chest, ground, box cargo) until sold. Freezer slots skip `tickFreshness`. `freshMul(f) = f >= 0.8 ? 1 : f / 0.8`, then jam floor if daughter owns `jam`.
11. Empty-hand harvest of ripe annual including sugar-cane: one fruit, current freshness, `unitSale = stats.sale`, plot `empty` same soil. Fruit box: into the box if it accepts. Shovel growing/ripe annual: one seed. Shovel dead, rotten, weed, or grass: no drop.
12. Empty hand gathers weed/grass as items. Each `BIG_TICK`, each `empty` plot sprouts iff `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks)`. Kind: `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1. `WEED_CHANCE` 0.03.
13. Untuned sprinkler: `SPRINKLER_TILE_DAY` per covered growing tile. Smart crop dial: that crop’s `waterUsePerSec` per tile. Hand pour tops empty/weed to `SOIL_WATER_MID`, growing/ripe to `SOIL_WATER_MID + waterTolerance`.
14. Market is Sell all iff `marketOpen`. Sunrise/day always; sunset if `open-late`; twilight if `open-24`. Consign always. Closed: “Stall closed until morning.” / “Stall closed at twilight.” Clean subtotal: freshness (`worth`), rarity (`raritySale` = crop `saleMul` ?? `RARITY_SALE`), saleswoman `(1 + 0.02 × tier)`, heirloom `(1 + 0.05 × tier)`, better skill `saleMul` 1.04, bio `(1 + 0.04 × tier)`; jam floors `freshMul` to `0.10 / 0.20 / 0.30`; clearance freshness-0 fruit $1 else jam floor. Crop stall stock/worth per rarity×bio. Consign: fruit (incl. sugar-cane), sugar, box fruit, spirit, wine, jam, oil, flour, extract. Seeds illegal. Consign fills `contracts.active` in array order, then the stall. Contract-bound units skip `worth` and `sat`. Sugar / jam / oil / flour / extract: baked `unitSale`, saleswoman only. Spirit / wine: baked `unitSale`, saleswoman, heirloom if `heirloom`. No berry. Sat last — 122–124.
15. One research job. `buy-box` unlock `start`. `buy-box-large` unlock `unlock-large-box`. `BOX_SMALL` 5, `BOX_LARGE` 14, large $18. `buy-fertilizer` unlock `start`, $18, `FERT_BAG_LITERS` 10. `unlock-fertilizer` unlocks synthetic (`SYNTH_BAG_LITERS` 16, $15). `buy-weed-spray` $12 utility, unlock and show `unlock-fertilizer`. `unlock-fertilizer` effect stays one SKU.
16. `buy-tile-paved` $5, `buy-tile-brick` $7, `buy-tile-cobble` $11. Cosmetic. Keep `ground`.
17. Hand is one item. House 16 slots. Chest `CHEST_SLOTS` 9. Starter: shovel in hand, bucket on door (`CONTAINERS.bucket` 5 L), house 5 common carrot / 2 rare carrot / 2 rare tomato / 2 heirloom potato / 1 apricot sapling / 1 lemon sapling / 1 cherry sapling, money 50. `CONTAINERS['large-bucket']` 10 L.
18. Compost `COMPOST_NEED` → `COMPOST_LITERS` 5 in `COMPOST_SECONDS` 90. Box $20. Composting research $14 / 45s.
19. `CHUNK` 32. `expandPrice = 40 + 15 * purchases`. 4-connected after `unlock-expand`.
20. Player-facing top rarity is Heirloom (`heirloom`). `RARITY_SALE` 1 / 1.25 / 2 / 3.5.
21. Crop stats are `CROPS`. Pack prices: carrot 3, potato 6, wheat 10, tomato 15, watermelon 18, raspberry 22, grape 16, olive 14, vanilla 40, sugar-cane 8. Shop packs are common unless player owns `seed-bank`: per rank 5% uncommon / 1.2% rare / 0.2% heirloom (`SEED_BANK_CHANCE`). Base 0. No tree pack.
22. Start chunk `(0,0)` has one wild 1×2 apple `Tree` on the first valid soft pair, `juvenile = 0`. No shrub.
23. Recap exit is only `dismissRecap()`. Each member `points += 1`, then play, `banner = 2`.
24. Offers 0–3 persist until pick. `pickSkill` costs 1 of that member’s points, writes `owned[id] = offered.tier`, `pickCount++`, rerolls that member only.
25. Tend once: player owns `tending`, empty hand, growing, `tended === false`. Not ripe. Then `tended = true`.
26. No `bump-carrot` `bump-potato` `bump-wheat`. No research `sale-mul`. Better crop is player `better-*` `saleMul` 1.04 and ripen `extraUp1` 0.04. Őstermelő gated on `unlock-heirloom`.
27. `unlockAll`: every research done, `money += 999`, job idle, each member `points = 99`. Does not grant skills. Does not reroll.
28. Water lens only if husband owns `water-study`. Land lens if husband owns `land-study`. Vehicle interactions lens if `unlock-vehicles` done.
29. Raspberry research `reveal` is `unlock-grape`. Olive `reveal: unlock-tomato`. No `unlock-vanilla`. `pack-vanilla` shows after raspberry; buy requires `vanilla-tending`. `unlock-fermentation` automation $14 / 50s, unlocks `pack-sugar-cane` and gates `buy-still` `buy-barrel`. `unlock-grinder` also gates `buy-mill`. `unlock-preservatives` automation $20 / 55s, reveal `unlock-grinder`, gates `buy-jam` `buy-freezer` `buy-sugar`. No `unlock-mill` `unlock-jam` `unlock-still` `unlock-barrel` `unlock-freezer`.
30. Vanilla `statsOf` sale uses `saleMul` 1 / 1.25 / 3 / 6. Common 22 < raspberry 26.
31. Ripe cane harvests as fruit. Mill 5 cane → `SUGAR_BAG` 2 L at `SUGAR_MILL` 5 / L. Sugar `{ kind: 'sugar'; liters; capacityLiters; unitSale }`. Illegal: `sugar.count`. Sugar does not tick freshness.
32. `Plant.crop` is `AnnualId`. Sapling on a tilled plot is a no-op.
33. Tree juvenile `TREES.juvenileSeconds` (480) then `pending`. Next seam → `TREE_YIELD_MUL` 3.5× for 2 days. After that `chance = -0.2`, next seam +0.2 and roll. Off-season fruits at `TREE_OFF_MUL` 0.75×. Juvenile unchanged.
34. Tree auto-drop freshness 1, cells stay `tree`. Shovel → sapling, cells bare soft.
35. No `'berry'` stall key. No `Shrub`. No `{ kind: 'berry' }` `{ kind: 'shrub' }`.
36. `better-olive` `better-grape` `better-sugar-cane` gated on `unlock-olive` / `unlock-grape` / `unlock-fermentation`. `vanilla-tending` gated on `unlock-raspberry`. `better-vanilla` gated on `vanilla-tending`. No `better-*` for `TreeId`.
37. `World.now` starts 0. Each `tick()` entry, including recap return, `now += 1`. `dispatch` stamps `Cmd.t = now`. Same-`t` cmds apply in log order. Ticks are not cmds.
38. `dispatch` appends to `World.log` and `sink`, then `apply`. `apply` does not log. Replay is `apply` only. `enqueue` does not `dispatch`.
39. Log is player `Cmd`s only. Not sips, rot, weed sprout, outbreak, recover, ripen, tree drop, grass, stall ticks, research drain, mill / jam / still / barrel ticks, vehicle integrate / burn / follow hitch / boom, walk, stride integrate, panel, camera, hover, lens, pad paint, dash faces. `Act.setBoom` `Act.load` `Act.unload` `Act.stride` are cmds.
40. Same seed + same `Cmd[]` applied at those `t` with `dt = 1/15` → equal digest: `money`, `clock.day`, `clock.t`, each seat `hand`/`inventory`, cell kinds, plant crop/rarity/maturity, drop count, `done`, family `owned`, stall stock, every `StallGood.sat`, per active contract `offer.id` `dueDay` each bin `filled`, `takenToday`, every wire `from`/`to`, every sensor `out`/`inn`, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`, sprinkler unwired vs wired level, smart-valve held level. Board not digested.
41. Two Worlds, same seed, no cmds, N ticks of `1/15` → equal digest.
42. `shop.next()` does not move when `grow` rolls. Same seed: shop-only vs plant-then-shop, first granted pack rarity matches.
43. Two growing→ripe on one cell the same day use distinct `n`. Rarities need not match.
44. Two successful tree drops the same day each consume `fruit.next()`. Rarities need not match.
45. `JSON.parse(JSON.stringify(cmd))` equals that `Cmd` arm.
46. `Spatial.at` / `hash`: same args, any call order → same `u`.
47. Failed `buy` / `buyPacks` (closed, cannot afford, cannot fit) consumes 0 `shop.next()`. Failed tree drop consumes 0 `fruit.next()`. Granted pack: one `next()` each. `buyPacks` always legal: five seed packs at `5 × skuPrice × 0.95`. Success: 5. No `bulk-buying` skill.
48. Pack rarity is `rollShopRarity(seed-bank tier, shop.next())`. Not `clock.t`. Not `money`.
49. Tutorial on only at New Game with `!slotExists()` and fragment not `start_now` or `unlockall`. `slotExists()` or `#start_now` or `#unlockall` → off, including New Game. Load / Upload → off.
50. No tutorial field on `Save` or `World`. Session only. Parse does not resume a step.
51. `tilledCount` is `isTilled` cells (`empty` `weed` `turf` `growing` `ripe` `dead` `rotten`), distinct. Five such cells: not step 2. Not `World.digs`.
52. Step 5 completes on `startResearch` that sets `job.kind === 'run'`, or `done.size > 0`. Not on opening Research.
53. Step 6 ready is `waterBand(...) === 'red'` on a `growing` plant. No extra thirst flag.
54. A box is `Item` `{ kind: 'box' }` in hand, house, chest, or drops. Cap `BOX_SMALL` or `BOX_LARGE`. Cargo empty | seeds | fruit | weed. Not `CompostBox`. Not an unconfirmed SKU. Illegal: box weed+fruit mix. Illegal: weed+seeds mix.
55. Step 9 completes on a paying `sellAll` (`marketOpen` and `marketGain() > 0`). No-op does not complete.
56. Step 10 dismiss is a click on the tutorial card. Then off for this session. No timer, no click-anywhere, no auto-dismiss.
57. Tutorial does not change crops, buildings, skills, or economy. Does not block HUD. Does not force camera. No step counter.
58. Live App accumulator calls `tick(DT_MAX)` only. Leftover rAF never ticks a non-`DT_MAX` slice. View paints every rAF. Solo and MP.
59. Per host `bundle`: apply `cmds` in log order, then `tick(DT_MAX)`. Empty `cmds` still tick. `bundle.t` is `now` after that tick. Same seed + same bundles → equal digest: invariant 40 plus every seat `actor.x`/`actor.y`, `hand`, `inventory`, `presence`, `place`.
60. Sequencer drops illegal guest cmds. They never enter a bundle. Those cmds no-op.
61. Guest may shop + place + `delete` building for pumpjack, well, rain-tank, tap, chest, grinder, compost-box, mill, jam, still, barrel, freezer, hangar, silo-seed, silo-spray, silo-produce, lever, button, lamp, AND, OR, NOT, pulser, counter, water/fert/harvest/water-system/day sensors, vehicle detector. Guest may dump mill/jam/still/barrel like compost. Guest may `load`/`unload` mill/jam/still/compost/seed-silo/additive-store. Guest may `placeSmartValve`, wires (`armWire` `placeWire` delete wire), toggle lever/button, water/harvest/counter/day HUD, stride. Guest chest/freezer `swapChest`, chest/freezer `load`/`unload`, pipes, manual valves, sprinklers, tiles, fences, expand, research start, family pick, `acceptContract` `cancelContract` `reorderContract`, cheat: not. Guest Unload chest no-op. Guest `placeWire` permitted; guest `placePipe` still not. Guest consign fills contract bins.
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
72. `SAVE_VERSION` 1.72. `PROTOCOL` 1.72. Wordmark 1.7.2. No migrate. 1.71 file → `'version'`. Dump `vehicles` + `trailers` + hangar/silo cells + `wires` + sensor cells + mill/jam/still `inn` + chest/freezer/seed-silo/additive-store `out` `hold` + pulser `prev`/`out` + counter `n`/`count`/`out` + day flags/`out`/`hold` + lever `inn`/`prev`/`on`/`out`. Save `Soil.weedChance`, `Weed.spread`, tractor `boom`, `Item` `weed-spray`, box cargo weed. Digest includes every vehicle `id` `kind` `fuel` `pose` and quad `slots` / tractor `hitch` `boom`, every trailer `id` `kind` `pose` hopper or `slots`, every wire, every sensor output, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`. `Seat.stride` not in the file.
73. `VehicleKind` is `'quad' | 'tractor'`. Quad `slots.length === VEHICLE_SLOTS`, no hitch, no boom field. Tractor no slots, `hitch: TrailerId | 'none'`, `boom: 3 | 5` default 5, persist, survives trailer swap. Fuel is `0..1` on the vehicle, not an Item. Trailer is stored or attached, never loose. `TRAILER_CAP` 100 is the only cargo cap.
74. Unlimited quads, tractors, trailers. `Act.buyVehicle` pays `QUAD_PRICE` / `TRACTOR_PRICE`, not `skuPrice`. Tractor buy `boom` 5. `Act.buyTrailer` pays `TRAILER_*_PRICE`. `haggling` does not discount hangar-buys. `buy-hangar` and three silo SKUs automation `skuPrice` (haggling applies).
75. Guests: hangar cue HUD, `buy-hangar` + three silo SKUs in `GUEST_BUILD`, buy Quad / tractor / trailers, refill, `swapVehicle` `swapTrailer`, embark, disembark, dock, drive, `setBoom`, delete empty hangar, `load`/`unload` mill/jam/still/compost/seed-silo/additive-store. Guest `swapChest` still not. Guest chest/freezer Load/Unload no-op.
76. Surface mul applies to the cap, not accel, not walk. `SURFACE_PAVED` 1.3. `SURFACE_SLOW` 0.4. `SURFACE_NORMAL` 1.0. Same cell classes: paved; tilled (empty weed growing ripe dead rotten turf) / rock / `isSolid` slow; grass, untilled bare, cobble, brick, fence normal. After integrate, `floor(x,y)` not owned → reject the step. No fade driving. Walk speed unchanged.
77. Empty fuel cap `QUAD_EMPTY_MUL × vMax × surfaceMul` (`vMax` already includes driving-classes). No auto-dismount. Can still `Act.embark`. Burn `dt / QUAD_FUEL_SECONDS × (1 − 0.05 × driving-classes tier)` while driver and (`throttle ≠ 0` || `steer ≠ 0`). `QUAD_VMAX` 8. `QUAD_R` 3. Tractor `TRACTOR_VMAX = QUAD_VMAX × 0.67`, `TRACTOR_ACCEL = QUAD_ACCEL × 0.5`, `TRACTOR_R` 3, `TRACTOR_YAW = TRACTOR_VMAX / TRACTOR_R`.
78. Refill all: cost `sum((1 - fuel) × QUAD_REFILL)` over `World.vehicles`. Poor no-op. Success: every tank `1`. Shared `World.money`. Trailers have no fuel.
79. Tank-steer: `Drive` `-1 | 0 | 1`. W forward S reverse A/D yaw. Kind yaw same at speed 0. Latest `Act.drive` same `t` wins. Brake: `speed ≠ 0` and `sign(throttle) === −sign(speed)` → seek at `accel × 2`. Coast `throttle === 0` stays `1×`. Reverse-from-stop unchanged. driving-classes: burn `× (1 − 0.05 × tier)`, vMax and accel `× (1 + 0.05 × tier)`. Additive ranks. Yaw not. Boots not. Husband machinery not on vMax/accel.
80. Hangar `HANGAR_W × HANGAR_H`, door south, no rotate. Pad `row = base.row + 2`, `col .. col + HANGAR_W - 1`, stay plots. Silos `SILO_W × SILO_H` (2×3), `siloPad` two cells south of the drum. Store is `Act.dock` while driver and `floor(x,y)` is a hangar pad cell; that hangar; tractor hitch stores with it; tractor `boom` kept. Not on tick. Silo pad is not Dock. Buy from A stores at A. Deploy from B of stored-at-A spawns on B pad, heading `HEADING_SOUTH`, seats immediately; tractor hitch optional (stored trailer or none). Cannot delete a hangar that stores a vehicle or a trailer. Field vehicles do not block delete. Silos delete always.
81. Enter: if this seat is a driver → `Act.disembark`. Else closest parked field vehicle, Euclidean actor→pose ≤ 1.5 → `Act.embark { id }` instant (already-on-tile path). Several: min dist, then `World.vehicles` order. Stored / driven: skip. Dash Disembark / parked Embark stay. No walk-to-embark on Enter. Seated `Act.click` field acts no-op. No coast-walk. `Act.disembark` while driver: speed 0, `driver 'none'`, actor at vehicle `x,y`, drive `{0,0}`, queue `[]`, hitch stays. Always legal while driving. `Act.dock` else no-op. Guest may disembark and dock.
82. Quad slots: any Item, chest swap + compact, `tickFreshness` (not freezer). `Act.swapVehicle` legal iff parked. Tractor has no 6-slot. Trailer cargo parked only: `Act.swapTrailer` iff attached to a tractor that is field && `driver === 'none'`. Seed/spray hopper wrong kind unrepresentable. Harvest 8 slots chest merge+compact, `tickFreshness`. Hangar HUD has no cargo. Parked HUD is `Cue` `{ kind: 'vehicle'; id }` (Quad 6 slots + Embark; tractor trailer cargo if hitched + Embark).
83. Away while driving: `driver = 'none'`, field pose kept, speed coasts to 0, hitch stays. Recap freezes vehicle integrate (boom does not run). Actor pose tracks vehicle while driver. Hide gardener / hat / camera follow are view, not sim.
84. Two drivers on one vehicle, seated + walk/work queue, stored + driver, stored tractor hitch, quad hitch, tractor slots, quad boom, boom other than `3 | 5`, two trailers on one tractor, attached + stored, trailer attached to missing tractor, harvest `slots.length ≠ 8`, seed/spray hopper wrong item, `HudTarget` hangar, `HudTarget` vehicle: unrepresentable. `Act.setBoom { w: 3 | 5 }` legal while this seat drives that tractor (hitch optional). Latest same `t` wins. Guest may. `boomHits` takes width. Sim OBB `3 | 5` wide × 1 long. Boom fires iff driven tractor, hitch present, `steer === 0`, `speed > 0`; after integrate; not a Cmd. Hangar HUD is `Cue` `{ kind: 'hangar'; at }`. Parked HUD is `Cue` `{ kind: 'vehicle'; id }`. Silo: look name only, no cue.
85. `Soil.weedChance: number` required. New soil (till, expand) = `WEED_CHANCE`. Copy soil on harvest/death keeps the field. Spawn: `weed.at(col, row, bigTicks) < ramped(soil.weedChance, bigTicks)`. Recover: iff `weedChance < WEED_CHANCE`, `min(WEED_CHANCE, weedChance + 0.15 × dt / DAY_SECONDS)`. Does not pull outbreak down. Tick every `dt` on every `Soil` that exists (tilled cells).
86. Outbreak: when a weed first reaches maturity 1, once. `Weed.spread: boolean`, starts `false`. `+0.05` on 4-adj (cardinals) that are empty tilled. No cap. Skip self / missing / not empty. Then `spread = true`.
87. Item `{ kind: 'weed-spray'; usesLeft }`. `WEED_SPRAY_USES` 30. Illegal: `usesLeft` 0 as held (throw away at 0). `buy-weed-spray` $12 utility, unlock and show `unlock-fertilizer`. Click any tilled plot: `weedChance = −1`, spend 1 use. Instant. Not untilled. Not spray-trailer.
88. Hand pull weed: drop `{ kind: 'weed' }`, `weedChance = 0`. Box in hand: into box if empty or already weed cargo, up to cap; else no-op (do not empty-hand). Shovel: no drop, `weedChance = −0.3`. Box cargo `{ kind: 'stack'; goods: 'weed'; count }`. Compost accepts boxed weeds (`COMPOST_VALUE.weed`).
89. `PlayerSkillId`: `driving-classes` not `machinery`. `driving-classes` max 3, gate `unlock-vehicles`. `HusbandSkillId`: `machinery`, `haggling`; no `contracts` `tool-contracts` `machine-contracts` `bulk-buying`. `haggling` max 3. `skuPrice` `− $tier` on utility AND automation, min $1. Hangar-buys still not `skuPrice`. Daughter `bio` `+4%`/tier max 3. `jam` max 3, `JAM_FLOOR` `0.10 / 0.20 / 0.30`. `industrial` max 3, complete `× (1 + 0.03 × tier)`. `broker` max 2, gate `unlock-contracts`; T1 `+1` offered; T2 `+1` offered and `+1` active.
90. `CONTAINERS.bucket` 5. `large-bucket` 10. `FERT_BAG_LITERS` 10, `buy-fertilizer` $18. `SYNTH_BAG_LITERS` 16, `buy-synth-fertilizer` $15. `COMPOST_LITERS` 5. `PLANT_FERT_PER_SEC` and `WEED_FERT_PER_SEC` × 0.9 on the prior tuned-to×0.6 values.
91. Same seed + cmds → equal digest including wires and outputs.
92. New wire that would combinational-cycle: no-op. Sequential feedback through lever / pulser / counter `in` is legal.
93. Button: high exactly `BUTTON_PULSE` ticks. Pulser: `out` 1 exactly 1 tick on `inn` 0→1, else 0; then `prev = inn`.
94. Water sensor hold: output edge then hold `SENSOR_HOLD` ticks.
95. Unwired sprinkler still pours after Smart Irrigation.
96. Unwired smart valve does not conduct.
97. Fan-out: one lever drives two lamps. Fan-in OR: two levers, one lamp, both wires stay; lamp high if either is. Toggle A→B: wires length 0.
98. Guest `placeWire` permitted; guest `placePipe` still not.
99. `SAVE_VERSION` 1.72; 1.71 file → `'version'`.
100. 3×3 does not read plants outside the square; center building is not a plant.
101. Signal is `0 | 1`. Combinational graph is a DAG. Sequential feedback through lever / pulser / counter `in` is legal. Hold on world-readers + sprinkler input + smart valve only. Mill/jam/still `inn` no hold. Pulser / counter / lever no hold. Digest distinguishes unwired sprinkler vs wired-low. Port level = OR of wires on that `to`. Direct path unique on `nodeKey(from)` → `nodeKey(to)`, not `endKey`. `SensorKind` += `pulser` `counter` `sensor-day`. Lever has `in`. AND / OR / NOT require `unlock-advanced-sensors`. Memories sample last tick; combo this tick; then sequential update.
102. `PotStill` `RectBase` `w = 2` `h = 1` **and** prop `48×24` occupying both cells, origin NW, no rotate, same instance both cells, tick origin, water join any corner. Origin-only paint + `TILE/24` scale shows the full 48-wide art.
103. `inn === 1` freezes mill/jam/still ticks (progress + still water pull). Dump and Unload still fill.
104. Unwired mill/jam/still `inn` 0 ticks (enabled).
105. Chest no empty slot (`CHEST_SLOTS` 9/9) → `out` 1 after `SENSOR_HOLD`.
106. Seed silo `used >= SILO_SEED_CAP` → `out` 1 after hold. Additive `used >= ADDITIVE_CAP_LITERS` → `out` 1 after hold.
107. Quad on mill dropoff: Unload cane into mill.
108. Tractor harvest on mill takeup: Load sugar drop.
109. Guest Unload chest no-op. Guest Load chest no-op.
110. Digest includes mill/jam/still `inn` and chest/freezer/seed-silo/additive-store `out`.
111. `SAVE_VERSION` 1.72. `PROTOCOL` 1.72. Wordmark 1.7.2. No migrate. 1.71 file → `'version'`.
112. Sprinkler VFX flips on the tick the pour changes. `tickWater` writes `World.vfx`; `tickBig` does not. View reads that map, never `rate()`.
113. Counter: each tick `inn === 1`, `count += 1`; `count >= n` → `out = 1` `count = 0` else `out = 0`. `n` default 1, min 1, max `COUNTER_MAX` 9999. Tune out of range no-op. Changing `n` keeps `count`. Dial from `pct = count / n` vs 0 / 25% / 50% / 75% / 100% (`s0`…`s4`); this tick `out === 1` → `s4`. Not `floor(4 * count / n)`.
114. Day sensor: four flags, default `day` on others off. Raw 1 iff `clock.phase()` is a true flag. All off → raw 0. `SENSOR_HOLD`. No 3×3.
115. Lever Flip always toggles. Wired `in` 0→1 also toggles. Same-tick Flip + rising edge: both apply (net zero). Unwired `inn` 0: no edge.
116. `Seat.stride`. Not driver, `presence === 'in'`, not recap: if `stride !== {0,0}` clear queue+work, `actor += dir * walkSpeed() * dt`, diagonal normalized. Surfaces not. Ignored while driver. Not in Save. `Act.stride` logged; integrate not.
117. Driving dash: occupied Face icons only. Quad occupied of 6; seed/spray hopper or none; harvest occupied of 8; tractor no hitch none. Empty omitted. Parked unchanged.
118. `STILL_WATER` 0.5. Start still requires full pull.
119. Board slot `i` on day `d` is a pure function of `(seed, d, i)`. Same seed, same day → same offer, regardless of inventory, plantings, research, money, or `clock.t`.
120. `ContractId = day * CONTRACT_SLOT_MAX + slot`. Growing the board with `broker` adds slots and does not change slots 0..5.
121. Board generation is not a `Cmd`.
122. `sat` is `0..1` per `StallGoodId`, starts 0, ticks down `SAT_RECOVER_PER_DAY` per day on every good every `dt`, never resets at the seam.
123. Sell all of clean value `V` at `sat` pays the trapezoid, clamped piecewise at `SAT_FLOOR[good]`. Ten sales of `V/10` pay the same total as one sale of `V`.
124. Saturation applies last, per good, over the existing `marketGain` subtotal. Clearance's `$1` floor is exempt.
125. Contract delivery raises no `sat` and enters no `StallGood.worth`. Miss and cancel remainders do both.
126. A `Demand` never carries a rarity for a `PlainGoodId`, and `Lines` never nests.
127. `amount >= AMOUNT_MIN` on every published offer, and `amount <= FEASIBLE_PER_DAY[good] * days * scale(day)`.
128. `reward = clean * (1 + markup)` baked at generation. Saturation at delivery time does not move it.
129. Miss pays market rate for delivered units and `offer.penalty * max(PENALTY_FLOOR, 1 - filled/need)`. `filled = need` is completion, never a miss.
130. Cancel fee at `elapsed = 0` is `CANCEL_MIN * clean`; at `elapsed = days` it equals the miss penalty at that fill.
131. Consign fills `active` in array order, then the stall. A full bin passes through.
132. Guest `acceptContract` / `cancelContract` / `reorderContract` never enter a bundle. Guest consign fills bins.

Assumption: `Act.setBoom` `'W'`; `Act.placeWire` `'N'`; `Act.load` `'L'`; `Act.unload` `'U'`; `Act.stride` `'K'`; `Act.tuneCounter` `'M'`; `Act.tuneDay` `'O'`; `Act.acceptContract` `'J'`; `Act.cancelContract` `'Y'`; `Act.reorderContract` `'Z'`; spray click is `Intent` `{ act: 'weed-spray'; at }`.
