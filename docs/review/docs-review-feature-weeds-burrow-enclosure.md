# Docs review: Weeds, burrows and fenced areas

Notes: `docs/mechanics/weeds.md`, `docs/mechanics/burrow.md`, `docs/mechanics/enclosure.md`
Code: `src/game/sim/feature-field/field.ts`, `src/game/sim/feature-field/field.helpers.ts`, `src/game/sim/soil.ts`, `src/game/sim/queue.ts`, `src/game/sim/prompt.ts`, `src/game/sim/tick.ts`, `src/game/sim/feature-burrow/burrow.ts`, `src/game/defs/burrow.ts`, `src/game/sim/family.ts`, `src/game/sim/store.ts`, `src/game/sim/feature-enclosure/enclosure.ts`, `src/game/sim/sensor.ts`, `src/game/sim/nets.ts`
Tests: `src/game/sim/weeds.test.ts`, `src/game/sim/plants.test.ts`, `src/game/sim/world.test.ts`, `src/game/sim/feature-burrow/burrow.test.ts`, `src/game/sim/feature-enclosure/enclosure.test.ts`, `e2e/water.spec.ts`, `e2e/burrow.spec.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Is spraying a plot instant?
- [ ] **doc** `docs/mechanics/weeds.md:57` — "Instant."
- [ ] **doc** `docs/mechanics/weeds.md:61` and `:81` — the spray click is work `SPRAY_WORK`, armed by `canWeedSpray`.
- [ ] **code + test** `src/game/sim/queue.ts:406` — the gardener works `SPRAY_WORK` (0.33 s, `src/game/defs/items.ts:62`) before `doWeedSpray` runs. `src/game/sim/plants.test.ts:688` "…Work `SPRAY_WORK`…".
- [ ] **none**

### 2. How many loot rows does the burrow table have?
- [ ] **doc** `docs/mechanics/burrow.md:98` — eleven rows (the table at `:54-66` lists eleven).
- [ ] **code** `src/game/sim/feature-burrow/burrow.ts:49` — `LootRowId` has eleven ids and `keptRows` (`:101`) tests all eleven.
- [ ] **test** `src/game/sim/feature-burrow/burrow.test.ts:246` "`lootRoll` as `defs/burrow.ts`. Nine rows…" — the title says nine; the assertions check the roll formula and gate order, not a row count.
- [ ] **none**

### 2b. How does the player get the money out of treasure?
- [ ] **doc** `docs/mechanics/burrow.md:72`, `:106` — treasure lies on the ground; **Pick up** adds the coins to money and removes it; there is no `open` intent and it never enters the hand.
- [ ] **doc** `docs/mechanics/inventory.md:90` — house, chest and vehicle may hold treasure; `{ act: 'open'; at }`, work 0: `money += coins`, hand empty.
- [ ] **code + test** `src/game/sim/queue.ts:619` — picking up a treasure drop adds its coins to money and removes the drop; no `open` act exists. `src/game/sim/feature-burrow/burrow.test.ts:364` "…Never enters a hand: picking it up adds `coins` to `money`…".
- [ ] **code (player copy)** `messages/en/almanac.json:233` `almanac_burrow_p1` — the almanac tells the player "Hold treasure and click a plot you own: Open treasure."
- [ ] **none**

## Doc only (no code found)

None found. Every identifier the notes name exists: `Weed.spread`, `Weed.readyAt`, `ramped`, `CHANCE_RAMP_TICKS`, `WEED_GONE_DAYS`, `clearRipeWeeds`, `SPRAY_WORK`, `grassCount`, `BURROW_*`, `LOOT_*`, `BURROW_DAY_SALT`, `mintStart`, `mintSeam`, `nearSite`, `luckOf` (the note calls it "derived", no name), `World.enclosures`, `World.fenceEnclosures`, `World.plotEnclosures`.

## Code only (no note mentions it)

### 3. Can a player's luck ever reach `LUCK_CAP`?
- [ ] **code** `src/game/defs/burrow.ts:4` and `src/game/defs/skills.ts:177` — `LUCK_CAP` is 10, but the `lucky` skill has at most 3 ranks, so luck is 0 to 3. The day chance is at most 0.66 + 3 × 0.01 = 0.69, and luck adds at most 1 to the loot roll. The note's "below 1 at `LUCK_CAP`" (`docs/mechanics/burrow.md:92`) describes a value the game cannot reach.
- [ ] **intended, document it**
- [ ] **not intended**

### 5. What happens when the player clicks a weed while holding something that is not a weed?
- [ ] **code** `src/game/sim/prompt.ts:849` and `src/game/sim/queue.ts:596` — for most held items the prompt still reads **Pick up**; on arrival the gardener says the empty-hand line (`NEED_EMPTY_HAND`) and nothing changes. A held bucket, fertilizer bag, spray or shovel takes their own action first. The note says "Any other held item cannot gather" (`docs/mechanics/weeds.md:49`) without the prompt.
- [ ] **intended, document it**
- [ ] **not intended**

### 6. Where does treasure coin count get its random number?
- [ ] **code** `src/game/sim/feature-burrow/burrow.ts:153` — coins use `burrow.at(col, row, 3)`, a separate draw from the `u` in the loot roll (salt 0). The note's treasure row writes the coins with `u` (`docs/mechanics/burrow.md:56`); its salt list at `:50` says salt 3 is "coins or tool used", which matches the code.
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 7. Weeds sprout each `BIG_TICK` (10 s) on `empty` tilled plots when `weed.at(col, row, bigTicks) < ramped(weedChance, bigTicks) × weather mul`; a weather mul of 0 skips; variant from `weed.at(col, row, bigTicks, 1) < 0.5` → 0 else 1 — doc `docs/mechanics/weeds.md:9`, `:75`, code `src/game/sim/feature-field/field.ts:274`, `src/game/sim/soil.ts:13`, test `src/game/sim/plants.test.ts:656`, `e2e/water.spec.ts:119`.
- [ ] 8. `ramped` runs linearly from −0.10 at tick 0 to the chance after one day of big ticks (`DAY_SECONDS / BIG_TICK` = 24), then flat; grass uses the same ramp — doc `docs/mechanics/weeds.md:15`, code `src/game/sim/soil.ts:16-21`, test `src/game/sim/world.test.ts:90`.
- [ ] 9. `weedChance`: new tilled soil gets `WEED_CHANCE` (0.03); soil below it recovers by 0.15 per day up to 0.03, every tick, through the recover index; outbreak raises are not pulled down — doc `docs/mechanics/weeds.md:11-19`, code `src/game/sim/feature-field/field.ts:77`, test `src/game/sim/plants.test.ts:656`.
- [ ] 10. Outbreak: the first time a weed reaches maturity 1, each cardinal neighbour that is an `empty` plot gets +0.05 chance, no cap; then `spread = true` — doc `docs/mechanics/weeds.md:23`, code `src/game/sim/feature-field/field.ts:111`, `:289`, test `src/game/sim/plants.test.ts:670`.
- [ ] 11. A weed drinks `WEED_WATER_PER_SEC` (0.008) and `WEED_FERT_PER_SEC` from the plot the whole time, grows over `WEED_GROW` (60 s), and is a sprout below maturity 0.4 — doc `docs/mechanics/weeds.md:27-31`, code `src/game/sim/feature-field/field.ts:105`, `src/game/sim/plant.ts:63`, `src/game/sim/soil.ts:9-11`, test `src/game/sim/plants.test.ts:925`.
- [ ] 12. Reaching maturity 1 stamps `readyAt` with the day; at the day change after `clearOldRotten` and before trees, weeds stamped `WEED_GONE_DAYS` (1) or more days ago become untilled soft ground, hardness 0, grass cover variant `grass.at(col, row, day)`; the soil is gone; nothing drops — doc `docs/mechanics/weeds.md:35-39`, `:83`, code `src/game/sim/feature-field/field.ts:114`, `:166`, `src/game/sim/tick.ts:162-163`, test `src/game/sim/weeds.test.ts:21`, `:42`.
- [ ] 13. Empty hand on a weed: one **Pulled weed** item, plot `empty` on the same soil, `weedChance` 0; weeds in hand merge up to the cap, a full hand says `HAND_FULL`; shovel: no drop, `weedChance` −0.3, 1 use, prompt **Dig weed** (`prompt_pull` "Dig {name}") — doc `docs/mechanics/weeds.md:43-47`, `:85`, code `src/game/sim/queue.ts:583-612`, `src/game/sim/feature-field/field.helpers.ts:266`, `src/game/sim/prompt.ts:799`, `messages/en/names.json:141`, test `src/game/sim/plants.test.ts:737`.
- [ ] 14. Spray: bag 30 L, sold at the Additive store, unlocked and shown by `unlock-better-tools`; on a tilled plot with at least 1 L it spends 1 L and sets `weedChance` −1; a weed plot becomes `empty` with no drop; other tilled plots keep their kind; untilled refuses; an empty bag leaves the hand — doc `docs/mechanics/weeds.md:53-59`, `:81`, code `src/game/sim/feature-field/field.helpers.ts:491`, `src/game/defs/research.ts:409`, test `src/game/sim/plants.test.ts:688`, `:722`.
- [ ] 15. Grass tufts: one world roll per `BIG_TICK`; skipped when cover grass already counts `CHUNK × owned chunks` (32 per chunk) or the weather mul is 0; else fires when `min(1, ramped(GRASS_CHANCE, bigTicks) × owned cells) × mul > grass.at(bigTicks)`; up to 24 tries pick an owned untilled, not very-hard, bare, drop-free cell; at most one tuft — doc `docs/mechanics/weeds.md:67-69`, `:87`, code `src/game/sim/feature-field/field.ts:304`, test `src/game/sim/plants.test.ts:772`.
- [ ] 16. Empty hand gathers grass cover as a `grass` item and leaves bare ground; shovel tills grass with no grass drop — doc `docs/mechanics/weeds.md:71`, code `src/game/sim/queue.ts:610`, `src/game/sim/feature-field/field.helpers.ts:267`, test `src/game/sim/world.test.ts:239` (plants.test "till grass does not bump groundRev").
- [ ] 17. Burrow is untilled cover `{ kind: 'burrow', loot }`, not solid, walkable; placing, paving, fencing and tree seeds refuse it — doc `docs/mechanics/burrow.md:11-17`, `:94`, code `src/game/sim/plot.ts:55`, `:133-158`, `src/game/sim/prompt.ts:864`, test `src/game/sim/feature-burrow/burrow.test.ts:146`.
- [ ] 18. Dig a burrow: any shovel, prompt **Dig**, work `workSeconds × BURROW_MUL` (3), 1 use on any ground, cover becomes bare with the same ground and hardness, loot drops on the first of south, west, east, north that is an owned plot (else the dug cell); pickaxe does nothing and the prompt shows **Burrow**; inspect does not name the loot — doc `docs/mechanics/burrow.md:21`, `:96`, code `src/game/sim/feature-burrow/burrow.ts:289`, `src/game/sim/store.ts:186`, `src/game/sim/building.ts:1452`, `src/game/sim/queue.ts:665`, test `src/game/sim/feature-burrow/burrow.test.ts:178` (its title says "Drop stored item on the cell"; its assertions check the drop is beside the cell), `e2e/burrow.spec.ts:77`.
- [ ] 19. Start chunk `(0,0)` mints `BURROW_START_N` (3) burrows more than 8 from the door, never on reserved, rock, tree or very-hard cells, picked with `burrow.at(0, 0, 1, k)` without replacement; expanded chunks mint none at generation — doc `docs/mechanics/burrow.md:25`, `:88`, code `src/game/sim/feature-burrow/burrow.ts:211`, `:259`, `src/game/sim/gen.ts:73`, test `src/game/sim/feature-burrow/burrow.test.ts:49`.
- [ ] 20. Each day change, each owned chunk rolls `burrow.at(cx, cy, day, 9)` against `0.66 + luck × 0.01`; a hit adds one burrow on an eligible cell (owned, untilled, not very-hard, bare or grass, not reserved, no drop, no paving), picked with `burrow.at(cx, cy, day, 0)` — doc `docs/mechanics/burrow.md:29-35`, `:90-92`, code `src/game/sim/feature-burrow/burrow.ts:228`, `:268`, `src/game/defs/burrow.ts:6-7`, test `src/game/sim/feature-burrow/burrow.test.ts:84`, `:320`.
- [ ] 21. Loot roll = 1 + 3 × min(1, r / 48) + 3 × min(1, (day − 1) / 32) + luck / 3 + u × 0.75 − 0.25; stored at spawn; later luck does not change it — doc `docs/mechanics/burrow.md:41-50`, code `src/game/sim/feature-burrow/burrow.ts:88`, `src/game/defs/burrow.ts:9-16`, test `src/game/sim/feature-burrow/burrow.test.ts:246`.
- [ ] 22. Rows and gates: treasure always; base tree seeds and base seeds below 4.5; variant tree seeds and variant seeds from 3.5; heirloom tree seeds, heirloom seeds and fly agaric from 4.5; fertilizer and weed below 1.5; tool below 2.5; pools as the table (no cherry variant, no olive heirloom, no raspberry variant, no vanilla, chilli or grass); counts base seeds 2, variant 1, heirloom 1, weed 1, agaric 1; treasure coins `round((6 + floor(u × 15)) × lootRoll)`; equal chance over kept rows, then uniform in the pool; quality 0 — doc `docs/mechanics/burrow.md:52-68`, `:102`, code `src/game/sim/feature-burrow/burrow.ts:59-179`, `src/game/defs/burrow.ts:18-32`, test `src/game/sim/feature-burrow/burrow.test.ts:246`, `:296`.
- [ ] 23. Treasure `{ kind: 'treasure', coins }` is picked up with **Pick up**; the coins go to money and the drop is removed; it never enters the hand, so a full hand does not block it; hover reads "Treasure - {coins}" — doc `docs/mechanics/burrow.md:72`, `:104-106`, code `src/game/sim/queue.ts:619`, `src/game/sim/prompt.ts:631`, `messages/en/hud.json:26`, test `src/game/sim/feature-burrow/burrow.test.ts:364`, `e2e/burrow.spec.ts:77`.
- [ ] 24. Fly agaric stacks, composts and burns, is not sold, top band only; name **Fly agaric** — doc `docs/mechanics/burrow.md:76`, `:100`, code `src/game/sim/item.ts:185`, `src/game/defs/items.ts:76`, `:91`, `messages/en/names.json:126`, test `src/game/sim/feature-burrow/burrow.test.ts:348`.
- [ ] 24b. A burrow tool is a better shovel, better pickaxe or axe with equal chance; "used" (`burrow.at(col, row, 3) < 0.5`) means half its uses rounded down, else full — doc `docs/mechanics/burrow.md:61`, `docs/items/tools.md:30`, code `src/game/sim/feature-burrow/burrow.ts:117`, `:170`, test `src/game/sim/feature-burrow/burrow.test.ts:246`.
- [ ] 25. Luck is `min(LUCK_CAP, skillTier('lucky'))`, not a World field — doc `docs/mechanics/burrow.md:80`, code `src/game/sim/family.ts:6`, test `src/game/sim/feature-burrow/burrow.test.ts:417`.
- [ ] 26. Fenced area: an 8-connected group of owned non-fence cells that cannot 8-reach unowned land; its fences are fence cells within 1 (Chebyshev) of it; unowned land and the map edge are outside; a diagonal gap leaks — doc `docs/mechanics/enclosure.md:21-26`, `:106-108`, code `src/game/sim/feature-enclosure/enclosure.ts:15`, test `src/game/sim/feature-enclosure/enclosure.test.ts:38`, `:56`.
- [ ] 27. A fence can belong to several fenced areas (the centre of a 2×2 grid of rooms is in four; an inner ring fence is in both the ring area and the hole) — doc `docs/mechanics/enclosure.md:52-76`, `:110-112`, code `src/game/sim/feature-enclosure/enclosure.ts:90`, `:100`, test `src/game/sim/feature-enclosure/enclosure.test.ts:81`, `:105`.
- [ ] 28. Rebuild runs on fence add, fence remove and `indexAll`, never from eval or hover — doc `docs/mechanics/enclosure.md:5`, `:114`, code `src/game/sim/feature-place/place.helpers.ts:79`, `:278`, `src/game/sim/world.ts:742`, test `src/game/sim/feature-enclosure/enclosure.test.ts:139`.
- [ ] 29. A reader sensor on a fence watches the interiors of every fenced area that fence belongs to; on a fence that closes nothing it reads 0; off a fence it watches the 3×3 around it — doc `docs/mechanics/enclosure.md:80-102`, code `src/game/sim/nets.ts:288-292`, `src/game/sim/sensor.ts:337`, test `e2e/sensors.spec.ts:186`, `:200`.
