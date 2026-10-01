# 2.10.next: Difficulty and Speed

Handoff for the implementer. The developer set every value and choice below on 2026-09-30. The section **How the developer's wording was read** lists the five rules that come from reading their words; build them as written unless the developer changes them.

## State now

- `ui/new-game.tsx` holds `NewGamePage`: **Play Now** where **New Game** was, then **Difficulty** (**Peaceful**, **Normal**, **Hard**) and **Speed** (**Leisurely**, **Normal**, **Fast**), full-width tab rows with a one-line description of the selected tab; both start at **Normal**; **←** returns to the main menu ([[menu]]).
- The choices live in `NewGamePage` state. `onPlay` takes no arguments and calls the old `onNew`. Nothing is saved or applied.
- `Difficulty` and `Speed` are types local to `new-game.tsx`.
- `tabSelectListClass` and `tabSelectClass` in `frame.tsx` are the tab-row styles shared with the Almanac variety tabs.

Everything else on this page is not built.

## Why

The game has no settings, and its default is strict: the developer rates today's game 2.1 for difficulty and 2.3 for speed on a scale where 1 is the easy or slow end, 2 is Normal and 3 the hard or fast end. Two choices, made once per farm, let the player set the game to themselves:

- **Difficulty** sets how much leeway the farm gives. Peaceful is for children and first-time players. Hard is for players who want a challenge.
- **Speed** sets how much real time the farm takes, and nothing else. An experienced player plays faster; a new or casual player gets more time to think. Speed must not make the game easier or harder.

Normal/Normal is the default. Normal speed is today's speed. Normal difficulty differs from today in seven values (bold in the tables) and in one new weed rule that holds on every level: easier on freshness and weeds, harsher on cancelling, on a day without a contract, and on a starving plant.

Rejected, with the reason:

- **Day length alone as Speed.** `DAY_SECONDS` is read in 20 files, and 10 constants are computed from it when their module loads (`PUMP_COST_PER_L`, the four weather `*_TICK` amounts, `SPRINKLER_TILE_RATE`, `GRASS_GROW`, `BARREL_MATURE`, `BARREL_AGE`, `CHANCE_RAMP_TICKS`). Changing it alone changes balance: crop `waterUsePerSec` is a daily amount divided by 240 while sprinklers, rain and drought are daily amounts, so a longer day leaves every sprinkler short; support, tax, loan payback and the skill point come once a day while growth is per second, so a longer day earns more harvests per tax; contract amounts come from `FEASIBLE_PER_DAY`, a fixed table per day.
- **The gardener on real time while the farm runs at game speed.** On Leisurely the gardener would do 1.33 times as much walking and work per game day, and on Fast 0.67 times as much, so Speed would also change difficulty.
- **One factor on the weed chance.** Proposed; the developer set four weed values instead.

## The two choices

- `Difficulty = 'peaceful' | 'normal' | 'hard'`, `Speed = 'leisurely' | 'normal' | 'fast'`, `Rules = { difficulty: Difficulty; speed: Speed }`.
- Chosen on the new-game page; both default to Normal. `#start_now` / `?start=now`, the main-menu backdrop farm and every test that builds a `World` without them get Normal/Normal.
- Written in the save file and read back exactly: the same farm on the same version loads with the same choices. Fixed for the life of the farm.
- Multiplayer: the host's farm decides both. A guest's `World` is built from the host's save ([[systems/net]]), so it carries the same `rules`.

## Difficulty

| value | Peaceful | Normal | Hard | today |
|---|---|---|---|---|
| plant fertilizer use per second, × the crop's `fertUseMul` | 0.00080 | 0.00085 | 0.00090 | 0.00085 |
| full-price freshness (`FRESH_FULL`) | 70% | **75%** | 80% | 80% |
| rot time | crop × 1.1 | crop × 1 | crop × 0.9 | crop × 1 |
| happiness loss, full to 0, wilting (`HAPPY_WILT_SECONDS`) | 260 s | 240 s | 220 s | 240 s |
| happiness loss, drowning (`HAPPY_DROWN_SECONDS`) | 200 s | 180 s | 160 s | 180 s |
| happiness loss, starving (`HAPPY_STARVE_SECONDS`) | 380 s | **340 s** | 300 s | 400 s |
| tree wilting, full to 0 | 130 s | 120 s | 110 s | 120 s |
| tree drowning | 100 s | 90 s | 80 s | 90 s |
| tree starving | 190 s | **170 s** | 150 s | 200 s |
| happiness gain, one green range, crops and trees | 840 s | 900 s | 960 s | 900 s |
| miss penalty (`PENALTY_RATE`), share of `clean` | 10% | 20% | 40% | 20% |
| reputation lost on a missed or cancelled contract (`REP_LOST`), stars 1 / 2 / 3 / 4 | 0.5 / 1 / 1.5 / 2 | 1 / 2 / 3 / 4 | 2 / 3 / 4 / 5 | 1 / 2 / 3 / 4 |
| cancel fee right after accepting (`CANCEL_MIN`), share of `clean` | 5% | **10%** | 20% | 5% |
| reputation lost at a day change with no contract accepted (`REP_IDLE`) | 0.2 | **0.4** | 0.8 | 0.3 |
| grandma's support (`STIPEND`), ended day 1–3 / 4–6 / 7–10 | 16 / 8 / 4 | 12 / 6 / 3 | 10 / 5 / 2 | 12 / 6 / 3 |
| loan payback | none | `LOAN_PAYBACK` for `LOAN_DAYS` | `LOAN_PAYBACK` for `LOAN_DAYS` | `LOAN_PAYBACK` for `LOAN_DAYS` |

Rot time multiplies each crop's own `rotSeconds`, for annual crops and tree fruit alike, on the plant and after picking. Fertilizer use is the level's base times `fertUseMul`, for crops and for trees. Tree factors: olive 0.44, apricot 0.59, cherry 0.81, apple 0.88. A tree's wilting, drowning and starving clocks are half the crop clocks at that level. Crops and trees share the gain clock. `HAPPY_START` stays 0.5. Tree starting happiness stays `TREE_HAPPY_START`.

Peaceful loan: the loan is given as today (`LOAN_PACKS` packs of `LOAN_PACK` into the Seed silo and `LOAN_CASH`), but `loanDays` does not rise, so nothing is paid back and the end-of-day summary shows no **Loan payback** and no **Days of payback left**.

The same on every level, as today: `PENALTY_FLOOR`, `HAPPY_START`, `TREE_HAPPY_START`, the tree yield, rate and off-season constants, water tolerances, `tax()`, `LOAN_BELOW`, `LOAN_CASH`, `LOAN_PACKS`, `REP_DONE`, the markup and reward.

### What the difficulty values give

| | Peaceful | Normal | Hard | today |
|---|---|---|---|---|
| a new crop (happiness `HAPPY_START`) in red dies after: wilting / drowning / starving | 130 / 100 / 190 s | 120 / 90 / 170 s | 110 / 80 / 150 s | 120 / 90 / 200 s |
| a new tree (happiness 0.33) in red reaches 0 after: wilting / drowning / starving | 42.9 / 33 / 62.7 s | 39.6 / 29.7 / 56.1 s | 36.3 / 26.4 / 49.5 s | 39.6 / 29.7 / 66 s |
| Plain raspberry at full price after ripening | 53 s | 40 s | 29 s | 32 s |
| Plain carrot at full price after ripening | 139 s | 105 s | 76 s | 84 s |
| a full plot keeps a Plain carrot in the green fertilizer band | 1125 s | 1059 s | 1000 s | 1059 s |
| grandma's support, days 1–10 in total | 88 | 66 | 53 | 66 |

## Weeds

| value | Peaceful | Normal | Hard | today |
|---|---|---|---|---|
| `WEED_CHANCE`: the chance set by tilling, and the level the chance returns to | 2.5% | **2.75%** | 3% | 3% |
| added to each empty side neighbour when a weed is full-grown (`outbreak`) | +3% | **+4%** | +5% | +5% |
| the chance after a weed is pulled by hand (`doPickup`) | −9% | **−6%** | −3% | 0% |
| the chance at the first big tick of a new farm (the start of `ramped`) | −15% | −10% | −5% | −10% |

New rule on every level: **the chance does not rise while a plant is growing on the plot.** Today it rises by 0.15 a day towards `WEED_CHANCE` on every tilled plot (`isTilled`: `empty`, `weed`, `turf`, `growing`, `ripe`, `dead`, `rotten`). After the change it rises on `empty`, `weed`, `turf`, `ripe`, `dead` and `rotten`, and holds on `growing`. When the plant is ready to harvest, dies or rots, the `Soil` stays, and the rise continues from where it held.

The same on every level, as today: the rise of 0.15 a day, the shovel's −30%, Weed spray's −100%, `WEATHER_WEED_MUL`, `WEED_GROW`, `WEED_WATER_PER_SEC`, `WEED_FERT_PER_SEC`, `WEED_GONE_DAYS`, the Harvester trailer leaving the chance as it is, the **Weed resistance** bar formula, and wild grass (`GRASS_CHANCE`, its ramp start stays −10%).

### What the weed values give

Times in game seconds, a day is `DAY_SECONDS` (240 s); a weed can sprout once per big tick (10 s).

| | Peaceful | Normal | Hard | today |
|---|---|---|---|---|
| empty plot at `WEED_CHANCE`: a weed within one Clear day | 45.5% | 48.8% | 51.9% | 51.9% |
| empty plot at `WEED_CHANCE`: average wait on Clear | 400 s | 364 s | 333 s | 333 s |
| next to one full-grown weed: a weed within one Clear day | 74.3% | 81.3% | 86.5% | 86.5% |
| after pulling by hand: no weed for / back at `WEED_CHANCE` after | 144 s / 184 s | 96 s / 140 s | 48 s / 96 s | 0 s / 48 s |
| new farm: first big tick with a chance above 0 | 210 s | 190 s | 160 s | 190 s |

## Speed

`GAME_SPEED`, game seconds per real second: `leisurely` 0.75, `normal` 1, `fast` 1.5.

The frame loop in `App.tsx` multiplies the real frame time by `world.cheatSpeed` and by `GAME_SPEED[world.rules.speed]`. Solo and host both run that line; a guest runs each step when the host's bundle arrives (`applyBundle`), so it follows the host. `World.tick`, `tickWorld` and `DT_MAX` do not change, so every rule inside the simulation keeps its balance.

| in real time | Leisurely | Normal | Fast |
|---|---|---|---|
| a day | 320 s | 240 s | 160 s |
| carrot grows | 120 s | 90 s | 60 s |
| research, shortest to longest | 33–240 s | 25–180 s | 17–120 s |
| walking, tiles a second | 4.5 | 6 | 9 |

### What runs on game time

Everything in `tickWorld`, including the gardener's walking and work (developer: game time), vehicles, machines, research, weather, the Market, contracts, and the Button. A Button's signal lasts `BUTTON_PULSE` steps (`tickButton`); the Button is a placed item whose signal drives sensors and machines, so it stays on game time and its signal lasts the same game time on every speed.

### What runs on real time

The speech bubble (`tickSpeech`, `SPEECH_S`) and the **Day {n}** banner (`clock.banner`), developer: real time. Each counts down `dt / pace` instead of `dt`, so it lasts the same real time on every speed, on the host and on guests.

### Times shown to the player

Developer: convert. Every player string that prints a number of seconds shows real seconds: the game seconds divided by the pace, through `World.realSeconds(s)`. Whole-second strings round with `Math.round`; `clockText` keeps `Math.visualRound`; the research footer keeps `Math.ceil`.

| strings | filled in | change |
|---|---|---|
| `hud_research_run` | research footer, `ui/research.tsx` | `world.realSeconds(job.left)` |
| `hud_secs` | research-card duration and the running job, `ui/tree-panel.tsx` | `world.realSeconds(d.seconds)`; the running job is `Math.ceil(world.realSeconds(job.left))` |
| `hud_station_left` | `ui/station.tsx` | `world.realSeconds(left)` |
| `hud_clock_sec` | `clockText` in `feature-machines/recipe.ts`; callers `ui/recipe.tsx` (three) and `view/motion.ts` | callers pass `world.realSeconds(...)` |
| `almanac_seconds` | `familyRows`, tool use time, `ui/almanac.tsx` | `world.realSeconds(t.workSeconds)` |
| `catalog_shovel`, `catalog_better_shovel`, `catalog_pickaxe`, `catalog_better_pickaxe`, `catalog_diamond_pickaxe`, `catalog_rotary_shovel`, `catalog_axe`, `catalog_chainsaw`, `catalog_electric_chainsaw`, `catalog_compost_box`, `catalog_weed`, `catalog_grass_seeds`, `catalog_grinder`, `catalog_mill`, `catalog_jam`, `catalog_still`, `catalog_furnace`, `catalog_infuser`, `catalog_station`, `catalog_extract` | `catalogEntries` in `defs/catalog.ts`, called by `Almanac` | `catalogEntries(pace)`; every seconds fill divided by `pace` |
| `catalog_shovel`, `catalog_better_shovel`, `catalog_pickaxe`, `catalog_better_pickaxe`, `catalog_axe`, `catalog_chainsaw`, `catalog_grinder`, `catalog_sku_buy_compost_box`, `catalog_sku_buy_mill`, `catalog_sku_buy_jam`, `catalog_sku_buy_still`, `catalog_sku_buy_barrel`, `catalog_sku_buy_furnace`, `catalog_sku_buy_research_station`, `catalog_sku_buy_infuser` | `SKU_DESC` / `skuDesc` in `sim/item.ts`; callers `matches` and the SKU callout in `ui/sku-card.tsx`, `matches` from `ui/build.tsx` | `skuDesc(id, pace)`, `matches(id, q, pace)`; every seconds fill divided by `pace` |

Times shown in days are game days and do not change: Almanac growth and freshness time (`daysText`), contract deadlines, the day bar, **Days of payback left**.

`cheatSpeed` multiplies on top of the pace. The frame loop allows `DT_MAX × 2` of game time and two steps per frame: Fast with the 3× cheat (4.5×) reaches that limit below 33.75 frames a second and then runs slower than 4.5×. Fast alone reaches it only below 11.25 frames a second. Shown seconds divide by `pace` only: `cheatSpeed` is not part of that division. `hud_debug_secs` and `hud_debug_min_secs` stay in game seconds.

## Code

### `defs/rules.ts`, new

- `Difficulty`, `Speed`, `Rules`, `RULES_NORMAL = { difficulty: 'normal', speed: 'normal' }`.
- `Hardness`: `plantFertPerSec`, `freshFull`, `rotMul`, `happy: { wilt; drown; starve; gain }`, `penaltyRate`, `repLost: { [K in Stars]: number }`, `cancelMin`, `repIdle`, `stipend: readonly { through: number; amount: number }[]`, `loanPayback: boolean`, `weedChance`, `weedNeighbour`, `weedPulled`, `weedStart`.
- `HARDNESS: { readonly [K in Difficulty]: Hardness }` with the two tables above. Normal's `plantFertPerSec` is `PLANT_FERT_PER_SEC`.
- `GAME_SPEED: { readonly [K in Speed]: number }`.

These replace `FRESH_FULL`, `HAPPY_WILT_SECONDS`, `HAPPY_DROWN_SECONDS`, `HAPPY_STARVE_SECONDS`, `HAPPY_GAIN_SECONDS`, `TREE_HAPPY_WILT_SECONDS`, `TREE_HAPPY_DROWN_SECONDS`, `TREE_HAPPY_STARVE_SECONDS`, `TREE_HAPPY_GAIN_SECONDS`, `PENALTY_RATE`, `REP_LOST`, `CANCEL_MIN`, `REP_IDLE`, `STIPEND` and `WEED_CHANCE`, which are removed. `HAPPY_START` and `TREE_HAPPY_START` stay. `PLANT_FERT_PER_SEC` stays in `soil.ts` as the base the fertilizer factor divides by. Tree wilting, drowning and starving are half of `happy` at the call, not their own fields. Crops and trees both gain through `happy.gain`.

### `World`

- `readonly rules: Rules`. Constructor `(seed?: number, sink?: LogSink, rules: Rules = RULES_NORMAL)`; the `HYDRATE` branch reads `Hydrate.rules`. The rules are set before `generateChunk` runs in the constructor.
- `get hard(): Hardness` returns `HARDNESS[this.rules.difficulty]`. `get pace(): number` returns `GAME_SPEED[this.rules.speed]`. `realSeconds(s)` returns `s / this.pace`.
- `modifiers` holds `difficultyModifier(this.rules.difficulty)` from construction: pushed in the new-game branch, and in the `HYDRATE` branch after `this.modifiers.length = 0` and before `rebuildSkillModifiers`, which keeps modifiers that are not skills.
- `track`: a cell goes into `recover` when `recovers(cell)` and `cell.soil.weedChance < this.hard.weedChance`.

### Save

`Save.rules: Rules`. `dump` writes `world.rules`; `parse` passes `save.rules` through `worldFromSave` into `Hydrate.rules`. `parse` reads it as written ([[systems/save]]). The save shape changes; version numbers are the orchestrator's ([[process/versions]]).

### New Game

`Difficulty` and `Speed` move from `new-game.tsx` to `defs/rules.ts`. `NewGamePage` takes `onPlay: (rules: Rules) => void` and calls it with `{ difficulty, speed }`. `Menu`'s `onNew` becomes `(rules: Rules) => void`. `playNew(rules)` in `App.tsx` builds `new World(undefined, sink, rules)`; the tutorial rule is unchanged.

### Per value

| value | file | change |
|---|---|---|
| fertilizer, rot | `sim/modifiers.ts` | `Modifier` gains `fertUseMul` and `rotMul`; `source` gains `'difficulty'`. `apply` multiplies `fertUsePerSec` (`PLANT_FERT_PER_SEC × fertUseMul`, crops and trees) by the product of `fertUseMul`, and `rotSeconds` by the product of `rotMul`. New `difficultyModifier(d)`: `id: 'difficulty'`, `source: 'difficulty'`, no `crop`, `saleMul`, `growSpeed`, `waterUseMul` 1, `fertUseMul: HARDNESS[d].plantFertPerSec / PLANT_FERT_PER_SEC`, `rotMul: HARDNESS[d].rotMul` |
| | `sim/family.ts` | both skill modifiers set `fertUseMul: 1`, `rotMul: 1` |
| | `ui/almanac.tsx` | `plantLines` and `treeLines` use `[difficultyModifier(rules.difficulty)]` instead of `[]`, so the freshness time matches the farm. `groupScales` and `GROW_SCALE` stay on `[]`: a factor on every crop leaves those ratings as they are |
| full-price freshness | `defs/crops.ts` | `freshMul(f, full)` |
| | `sim/store.ts` `toStall`; `sim/item.ts` `fruitMoney` | pass `world.hard.freshFull`; `fruitMoney` takes `full` |
| | `feature-field/field.ts` `tickField` | the ripe-plant freshness redraw check reads `w.hard.freshFull` |
| | `ui/notices.ts` | the **{crop} is losing freshness** row reads `world.hard.freshFull` |
| | `ui/almanac.tsx` `FreshnessConcept` | `const full = 80` becomes `Math.round(HARDNESS[rules.difficulty].freshFull * 100)` |
| happiness | `feature-field/field.helpers.ts` `age`, `ageTree` | `age` takes wilt, drown, starve and gain from `w.hard.happy`. `ageTree` takes wilt, drown and starve at half, and the same `happy.gain`. `HAPPY_START` stays |
| penalty | `feature-contracts/market.ts` | `rollBoard(rng, day, slots, rep, penaltyRate)` and `rollBoardAtD(rng, D, slots, penaltyRate)` pass it to `offerAt`. Callers: `acceptContractBody` and `ui/feature-contracts/contracts.tsx` with `hard.penaltyRate`, `play.ts` with the world's, `ui/debug-contracts.tsx` with Normal's |
| reputation lost | `market.ts` `resolveMiss`, `cancelContractBody` | `w.hard.repLost[stars]` |
| cancel fee | `market.ts` `cancelFee(a, nowDay, cancelMin)` | callers `cancelContractBody` and the running-card hover in `contracts.tsx` pass `hard.cancelMin`; the offer hover's `Math.round(CANCEL_MIN × offer.clean)` in `contracts.tsx` reads `world.hard.cancelMin` |
| idle reputation | `sim/tick.ts` end of day | `addRep(world, -world.hard.repIdle)` |
| support | `sim/world.ts` `stipendOf(endedDay, bands)` | `tickWorld` passes `world.hard.stipend` |
| loan | `sim/loan.ts` `settleLoan` | `loanDays += LOAN_DAYS` only when `world.hard.loanPayback` |
| weed chance | `feature-field/field.helpers.ts` | tilling (`freshSoil`) and tree planting use `w.hard.weedChance` |
| | `sim/gen.ts` `generateChunk` | takes `weedChance`; callers the `World` constructor and `feature-place/place.ts` pass `hard.weedChance`. A tree's soil keeps the value only because `makeTreeSoil` takes one; no rule reads it |
| rise holds under a plant | `sim/plot.ts` | new `recovers(c)`: `isTilled(c) && c.kind !== 'growing'` |
| | `feature-field/field.ts` `tickField` | the `recover` loop drops a plot when `!recovers(c)` or its chance is at `w.hard.weedChance`, and caps the rise there |
| neighbour burst | `field.ts` `outbreak` | `+= w.hard.weedNeighbour` |
| pulled by hand | `sim/queue.ts` `doPickup` | `c.soil.weedChance = world.hard.weedPulled` |
| start of a new farm | `sim/soil.ts` `ramped(chance, bigTicks, start)` | `start + (chance − start) × k`. `sproutWeeds` passes `w.hard.weedStart`; `sproutGrass` passes new `GRASS_RAMP_START` (−0.1) |
| pace | `App.tsx` frame loop | `frameDt × world.cheatSpeed × world.pace` |
| speech | `sim/tick.ts` | `tickSpeech(world, dt / world.pace)` |
| banner | `sim/clock.ts` `Clock.advance(dt, pace)` | the banner counts down `dt / pace`; `tickWorld` passes `world.pace` |
| shown seconds | see **Times shown to the player** | |

Almanac: `Almanac` passes `world.rules` down to `ConceptPane` (for `FreshnessConcept`) and to `CropPane` / `TreePane` (for `plantLines` / `treeLines`) the way it passes `done` and `familiarity`, and passes `world.pace` to `catalogEntries`.

`ui/debug-balance.ts` keeps Normal: `PLANT_FERT_PER_SEC` and `freshMul(f, HARDNESS.normal.freshFull)`.

## Tests

New, one per rule, in the file that owns the mechanic:

| id | rule | file |
|---|---|---|
| `rules.new` | `new World(seed, sink, rules)` keeps `rules`; without them Normal/Normal | `world.test.ts` |
| `rules.saved` | `rules` load back as dumped | `save.test.ts` |
| `rules.fert` | a growing plant and a tree use `plantFertPerSec × fertUseMul` a second per level | `plants.test.ts` |
| `rules.rot` | freshness falls at 1 ÷ (`rotSeconds × rotMul`) on the plant and in a hand | `plants.test.ts` |
| `rules.fresh` | `freshMul` is 1 at `freshFull` and above, proportional below | `world.test.ts` |
| `rules.happy` | a crop in the red loses happiness by `dt` ÷ that level's clock; a tree uses half; one green range adds `dt` ÷ `happy.gain` for a crop and for a tree | `plants.test.ts` |
| `rules.penalty` | an offer's `penalty` is `round(penaltyRate × clean)` | `market.test.ts` |
| `rules.rep` | a miss and a cancel take `repLost[stars]`; a day with no contract accepted takes `repIdle` | `market.test.ts` |
| `rules.cancel` | the fee is `cancelMin × clean` at acceptance and the miss penalty at the deadline | `market.test.ts` |
| `rules.stipend` | support follows the level's bands, then 0 | `day.test.ts` |
| `rules.loan` | Peaceful gives the loan and never pays it back; Normal and Hard as today | `day.test.ts` |
| `weeds.levels` | tilling sets `weedChance`; full growth adds `weedNeighbour`; pulling sets `weedPulled`; the ramp starts at `weedStart` | `weeds.test.ts` |
| `weeds.hold` | the chance does not rise on a growing plot and rises again when the plant is ready to harvest | `weeds.test.ts` |
| `speed.pace` | `pace` is 0.75, 1, 1.5 by `Speed`; `realSeconds(s)` is `s / pace` | `day.test.ts` |
| `speed.real` | speech and the Day banner last `SPEECH_S` and 4 s of real time at every pace; a Button's signal lasts `BUTTON_PULSE` steps at every pace | `day.test.ts` |
| — | New Game → Hard and Fast → **Play Now** starts a farm; **Quick Save** writes `rules: { difficulty: 'hard', speed: 'fast' }`; **Play Now** has the bounding box **New Game** had | `e2e/new-game.spec.ts` |

Existing tests to change:

- `WEED_CHANCE` is imported by 19 test files (`varieties`, `day`, `extract`, `family`, `market`, `machine`, `mushroom`, `vehicle`, `inspect`, `inventory`, `plants`, `queue`, `sensor`, `soil`, `trees`, `weather`, `weeds`, `world`, `notices`); they read `HARDNESS.normal.weedChance`, which is 2.75%.
- `weeds.pull` ("pulling sets 0") becomes `weedPulled`; `weeds.chance` reads the level's chance.
- `market.test.ts` and `contracts.test.ts`: `CANCEL_MIN`, `REP_IDLE`, `REP_LOST`, `rollBoard` and `cancelFee` signatures; Normal's cancel fee is 10% and idle loss 0.4.
- `day.test.ts`: `STIPEND`, `stipendOf(endedDay, bands)`, `LOAN_*`, the banner.
- `world.test.ts`, `weather.test.ts`: `freshMul` and `stipendOf` signatures; `ramped` takes a start.
- `plants.test.ts`: `PLANT_FERT_PER_SEC`, `ramped`, `weedChance`; Normal's starving clock is 340 s.
- `inspect`, `plants`, `queue` tests using `SPEECH_S`: unchanged at pace 1.

## Pages to update after it is built

- New `features/difficulty-speed.md` from [[features/_template]]: the choices, both tables, the pace, the real-time timers, the shown seconds; add it to [[features/_index]] and [[definitions]].
- [[features/plants]]: fertilizer rate, happiness clocks, rot factor, full-price line per level.
- [[features/trees]]: tree fruit rot follows the level; fertilizer follows the level's base times `fertUseMul`; wilting, drowning and starving are half the crop clocks; gain is the same clock as crops.
- [[features/weeds]]: the weed table, the hold under a growing plot, the start per level.
- [[features/contracts]]: penalty, reputation lost, cancel fee, idle loss per level.
- [[features/weather-day]]: support bands per level, Peaceful loan.
- [[features/market]]: the full-price freshness line per level.
- [[features/research]]: the footer shows real seconds.
- [[systems/tick]]: the pace in the frame loop, speech and banner in real time, the Button in game time; the `world.cheatSpeed` invariant gains the pace.
- [[systems/save]]: the `rules` field.
- [[systems/world]]: `rules`, `hard`, `pace`, `realSeconds`, the difficulty modifier.
- [[menu]]: `onPlay` passes the rules; the main-menu backdrop is Normal/Normal.
- [[code-map]]: `defs/rules.ts`.

## Out of scope

- Changing difficulty or speed on a running farm.
- Showing the farm's difficulty or speed during play.
- Loading saves from other versions ([[systems/save]]).
- Update notes and version numbers: the orchestrator's.
- Debug tech tree seconds (`hud_debug_secs`, `hud_debug_min_secs`).
- Dividing shown seconds by `cheatSpeed`.

## How the developer's wording was read

- **"weed chance should not increase if there is a fruit growing already on the soil"**: the rise holds on `growing` only. A plant that is ready to harvest rises, as do `dead`, `rotten`, `turf` and `weed`.
- **Fertilizer 0.00080 / 0.00085 / 0.00090**: the base for crops and trees, times `fertUseMul`. Tree wilting, drowning and starving are half the crop clocks at that level. Gain per green range is 840 / 900 / 960 s for crops and for trees. `HAPPY_START` stays 0.5. `TREE_HAPPY_START` stays.
- **"rot time: [plant] × 1.1 / [plant] / [plant] × 0.9"**: each crop's own `rotSeconds`, tree fruit included.
- **"start of new farm chance"**, listed under weeds: the weed ramp only; wild grass keeps −10%.
- **"3. real time"** for the timers: speech bubbles and the Day banner run in real time. The Button stays on game time: one press is the same length inside the day on every speed.
