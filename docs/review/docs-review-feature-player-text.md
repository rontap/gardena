# Docs review: Player words table

Notes: `docs/standards/user-facing-text.md` (Concepts table `:15-333`, Chrome `:335-343`, Update notes `:345-347`), `docs/standards/lexicon.md` (for rows that contradict it)
Code: `messages/en/*.json`, `src/game/defs/catalog.ts`, `src/game/defs/shelf.ts`, `src/game/defs/skills.ts`, `src/game/sim/item.ts`, `src/game/sim/prompt.ts`, `src/game/sim/look.ts`, `src/game/ui/lens.tsx`, `src/game/ui/hud.tsx`, `src/game/ui/status.tsx`, `src/game/ui/recap.tsx`, `src/game/ui/almanac.tsx`, `src/game/ui/sku-card.tsx`, `src/game/ui/tree-panel.tsx`, `src/game/view/map.tsx`, `src/App.tsx`, `src/game/ui/changelog.md`
Tests: `src/game/sim/feature-machines/recipe.test.ts`, `src/game/ui/hud.test.ts`, `src/game/sim/inspect.test.ts`, `e2e/vehicles.spec.ts`

Table row numbers below are file line numbers in `docs/standards/user-facing-text.md`. Method: for each row, the **say** word was looked up in `messages/en/*.json` values, and every **never** word was searched case-insensitively in the values (not the keys). Where a string is used by code, the call site is cited. Most rows have no test that asserts the literal text.

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. What word does the player read for a plant whose water is orange on the dry side?
- [ ] **doc** `docs/standards/user-facing-text.md:40` — **thirsty**; never **dry** ("Dry is weather").
- [ ] **doc** `docs/standards/lexicon.md` (Owner table, **thirsty** and **dry** rows) — **thirsty** is only the still's state; a plant short of water is **dry** or **wilting**, never **thirsty**.
- [ ] **code** `messages/en/prompt.json:148` — "thirsty", shown in the plot look as "Water {stored} of {mid} - thirsty" (`prompt.json:120`). Also `messages/en/research.json:14` (Crop variants description) says "A plant that is thirsty, too wet, or …". The Water need lens legend calls the same band "dry" (`messages/en/hud.json:223`, `src/game/ui/lens.tsx:14`). No test asserts the word.
- [ ] **none**

### 2. May player text say a plant is "dry" or "dries out"?
- [ ] **doc** `docs/standards/user-facing-text.md:40`, `:42` — no: never **dry** for orange or red on the dry side; red is **wilting**.
- [ ] **doc** `docs/standards/lexicon.md` (Owner table) — yes: a plant short of water is **dry**, or **wilting**.
- [ ] **code** — the game says it in several places: "Without it they dry out and wilt" (`messages/en/tutorial.json:6`), "turns on when a plant is too dry or too wet" (`messages/en/catalog.json:44`, Water sensor), "What is left when a plant dries out or starves" (`catalog.json:97-98`, Dead plant), "Plots dry out" (`messages/en/hud.json:74`, Drought).
- [ ] **none**

### 3. What word does the player read for a plant whose fertilizer is green?
- [ ] **doc** `docs/standards/user-facing-text.md:44` — say **fertilized**, and the never column also says **fertilized**. The row contradicts itself.
- [ ] **code** `messages/en/prompt.json:143` — "fertilized", shown as "Fertilizer {n}% - fertilized" (`prompt.json:121`).
- [ ] **none**

### 4. May player text call a plot a "tile" or a "bed"?
- [ ] **doc** `docs/standards/user-facing-text.md:25` — no: a tilled cell with soil is a **plot**; never cell, tile, bed.
- [ ] **doc** `docs/standards/user-facing-text.md:276` — the sprinkler amount is **L/day per tile**. This row contradicts `:25`.
- [ ] **code** — "{n} L/day per tile" (`messages/en/sensors.json:6`); "tilled bed" (`messages/en/almanac.json:53`); "stand at the bed" (`almanac.json:63`); "Works the beds" (`messages/en/family.json:4`); the Wooden fence description says "untilled tile" (`messages/en/catalog.json:58`, `:118`).
- [ ] **none**

### 5. How does the held-item line show uses left on a shovel, pickaxe, axe or chainsaw?
- [ ] **doc** `docs/standards/user-facing-text.md:96` — **Durability**; never "uses left".
- [ ] **code** `src/game/sim/item.ts:483`, `:486`, `:574`, `:577` — the item line reads "{name} - {left}/{uses} uses left" (`messages/en/hud.json:8`). The inspect bar is labelled **Durability** (`hud.json:114`, `src/game/sim/item.ts:591-597`).
- [ ] **code + test** `src/game/sim/inspect.test.ts:23-26` — asserts only the inspect bar label **Durability**, not the item line.
- [ ] **none**

### 6. What does the look say on the Market truck?
- [ ] **doc** `docs/standards/user-facing-text.md:131` — **Market truck**; never "stall truck".
- [ ] **code** `src/game/sim/look.ts:109`, `src/game/sim/prompt.ts:627` — the truck cell is kind `warehouse` and its look is "Produce Warehouse" (`messages/en/names.json:150`). The tutorial also says "drop them off at the Produce Warehouse!" (`messages/en/tutorial.json:8`). The only "market truck" is lower-case prose in the almanac (`messages/en/almanac.json:144`).
- [ ] **none**

### 7. What does the button that leaves a vehicle say?
- [ ] **doc** `docs/standards/user-facing-text.md:190` — **Dock**; never park, never "disembark as the button".
- [ ] **code** `src/App.tsx:1374`, `:1390` — the driving dash has two buttons: "Disembark" (leave the vehicle where it is) and "Dock" (store it, only on a hangar pad; title "Dock at the hangar arrows."). Both are English literals in `App.tsx`, not in `messages/en`.
- [ ] **test** `e2e/vehicles.spec.ts:49`, `:77` — clicks the button named "Disembark", then the button named "Dock".
- [ ] **none**

### 8. What does the game call the thing an Expand spends?
- [ ] **doc** `docs/standards/user-facing-text.md:222` — **farm expansion opportunities**; never "permits" (with the note that the plate says **No permit left**).
- [ ] **doc** `docs/standards/user-facing-text.md:314` — the plate says **No expansion permit left**; never "no expansions". This contradicts `:222`.
- [ ] **code** — the notice and chip say "{n} farm expansion opportunities" (`messages/en/notices.json:55`, `messages/en/hud.json:67`). Everywhere else the game says "expansion permit": contract prize "Expansion permit" (`messages/en/market.json:37`, `src/game/ui/feature-contracts/contracts.tsx:163`), research descriptions (`messages/en/research.json:18`, `:20`, `:22`), Family (`messages/en/family.json:5`), Inherit land (`messages/en/skills.json:41`). The Expand plate shows "No permit left", an English literal at `src/game/view/map.tsx:805`.
- [ ] **none**

### 9. May player text call the Market "the stall"?
- [ ] **doc** `docs/standards/user-facing-text.md:128`, `:215` — no: the sell tab and the daughter's role are **Market**; never stall.
- [ ] **code** — "the stall" appears in the Weather Forecast Station research description (`messages/en/research.json:10`) and catalog description (`messages/en/catalog.json:161`), the Weather forecast skill (`messages/en/skills.json:39`), Saleswoman (`skills.json:43`, `:44`), and the Crop Variety Station price-recovery tip "Selling floods the stall" (`messages/en/hud.json:150`).
- [ ] **none**

### 10. What words does the lens panel use?
- [ ] **doc** `docs/standards/user-facing-text.md:230` — the dock is **Lens**; never overlay. `:292` — variety tiers are **Plain / Named / Heirloom**; never Base, Variant. `:39`, `:40`, `:45` — never **ok**, **dry**, **low** for plant water and fertilizer bands.
- [ ] **code** `src/game/ui/lens.tsx:132` — the panel heading is "Overlays" (`messages/en/hud.json:205`). Legends (`lens.tsx:14-57`): Water need "dry / wet / full"; Land quality "low / ok / full"; Variety "base / variant / heirloom" (`hud.json:223-240`). The vehicle cargo picker calls the plain tier "Basic" (`messages/en/vehicles.json:59`).
- [ ] **none**

### 11. What does the shop card say when the Seed silo or the Additive store is full?
- [ ] **doc** `docs/standards/user-facing-text.md:320`, `:321` — **Seed silo full**, **Additive store full**.
- [ ] **code** `src/game/ui/sku-card.tsx:32`, `:89` — "The seed silo is full" and "The additive store is full" (`messages/en/hud.json:97-98`). The engine returns the literal 'Seed silo full' and the card replaces it.
- [ ] **none**

### 12. What does the button that leaves the farm for the startup screen say?
- [ ] **doc** `docs/standards/user-facing-text.md:249` — **Main menu**; never quit, exit, title screen.
- [ ] **code** `messages/en/menu.json:10`, `:64` — "Exit to main menu".
- [ ] **none**

### 13. What are jams from a named Variety called?
- [ ] **doc** `docs/standards/user-facing-text.md:166` — **{Crop} jam**; never preserve. (`:160` Ketchup and `:170` Passata are listed separately.)
- [ ] **code** `messages/en/names.json:277-280` — "Grape jelly", "Black raspberry jam", "Sour cherry preserve", "Blenheim apricot jam".
- [ ] **test** `src/game/sim/feature-machines/recipe.test.ts:432-433` — asserts "Grape jelly" and "Black raspberry jam".
- [ ] **none**

### 14. What does player text call a growing plant using its plot's water?
- [ ] **doc** `docs/standards/user-facing-text.md:38` — **consumes water**; never "pulls". (The lexicon keeps **drink** as the vault term.)
- [ ] **code** — only the Smart irrigation description says "consumes" (`messages/en/research.json:38`). Other player strings say "drinks": Potato (`messages/en/catalog.json:4`), Grass seeds (`catalog.json:55`, `:117`), Weed (`catalog.json:71`), Fermentation (`research.json:54`); the almanac stat label is "Drink" (`messages/en/almanac.json:38`).
- [ ] **none**

### 15. May player text say fruit "spoils"?
- [ ] **doc** `docs/standards/user-facing-text.md:50` — freshness at 0 is **rot / Rotten produce**; never expiry, spoil.
- [ ] **code** — "first to spoil" (Raspberry, `messages/en/catalog.json:7`), "Spoils first among the trees" (Cherry, `catalog.json:15`), "spoiled produce" (Necronomicon ash page, `messages/en/necronomicon.json:19`).
- [ ] **none**

### 16. May player text say "hungry"?
- [ ] **doc** `docs/standards/user-facing-text.md:46` — red fertilizer is **starving for fertilizer**; never hungry.
- [ ] **code** — "then hungry for …" (`messages/en/almanac.json:124`), "Water hungry and sells poorly" (Sugar cane, `messages/en/catalog.json:12`). The look and notices use "starving for fertilizer" (`prompt.json:145`, `notices.json:23`).
- [ ] **none**

### 17. What does untilled grass go back to in the Grass seeds description?
- [ ] **doc** `docs/standards/user-facing-text.md:28` — **Grass**; never lawn.
- [ ] **code** `messages/en/catalog.json:55`, `:117` — "the plot goes back to untilled lawn" / "turns back into untilled lawn".
- [ ] **none**

### 18. What are the grafting skill and the specialty skill called?
- [ ] **doc** `docs/standards/user-facing-text.md:65`, `:66` — `<need-help>`: no name decided.
- [ ] **code** `messages/en/skills.json:54`, `:56` — "Tree Grafting" and "Specialty Maker".
- [ ] **none**

### 19. Is there a "Vanilla tending skill"?
- [ ] **doc** `docs/standards/user-facing-text.md:64` — the tend skill is **Careful tending**; never Tending.
- [ ] **code** `src/game/ui/sku-card.tsx:29` — a shop card blocked by a skill reads "You need to earn the Vanilla tending skill" (`messages/en/hud.json:93`). No skill in `messages/en/skills.json` has that name.
- [ ] **none**

### 20. May player text say "Weather forecast"?
- [ ] **doc** `docs/standards/user-facing-text.md:58` — the research and building are **Weather Forecast Station**; never "Weather forecast". The table has no row for the husband's skill.
- [ ] **code** `messages/en/skills.json:38` — the skill is named "Weather forecast". Its description says "plan irrigation, the stall, and pump spend before morning" (`skills.json:39`).
- [ ] **none**

### 21. What words does the almanac use for the day's parts?
- [ ] **doc** `docs/standards/user-facing-text.md:106-109` — **Sunrise**, **Midday**, **Sunset**, **Twilight**; never morning, day, noon, evening, night.
- [ ] **code** — the almanac concept title is "Day & Night" (`messages/en/almanac.json:16`); its first line is "A day has four parts: sunrise, day, sunset, twilight. There is no night." (`almanac.json:134`). "before morning" in `messages/en/skills.json:39`. The clock uses "Midday" (`messages/en/names.json:26`).
- [ ] **none**

### 22. What does the almanac call the end-of-day screen?
- [ ] **doc** `docs/standards/user-facing-text.md:110` — **end-of-day summary**; never recap.
- [ ] **code** `messages/en/almanac.json:135` — "When twilight ends, the recap opens. The recap is the end-of-day summary: …".
- [ ] **none**

### 23. How often may the almanac say "grade", and what colour is the Heirloom mark?
- [ ] **doc** `docs/standards/user-facing-text.md:61` — never grade, except that the first almanac sentence may define it. `:60` — never gold for top rarity.
- [ ] **code** — "grade" is defined in `messages/en/almanac.json:74` and used again in `:75`, `:91`, `:92`, `:93`. The mark colours are "green, blue, or gold" (`almanac.json:76`). The unused key `hud_lens_rarity_blurb` also says "grade" (`messages/en/hud.json:216`).
- [ ] **none**

### 24. May player text say "sapling"?
- [ ] **doc** `docs/standards/user-facing-text.md:253`, `:254`, `:261` — no: a young tree is **{Name} tree - growing**, a tree seed is **{Name} seed**.
- [ ] **code** `messages/en/catalog.json:153` — the graft description: "Hold it against a young plant or a sapling".
- [ ] **none**

### 25. May player text say "hopper"?
- [ ] **doc** `docs/standards/user-facing-text.md:135` — the field seed tank is **Seeding silo**; never hopper. `:173` — the "seed hopper machine" is **Seed grinder**.
- [ ] **code** — the Seed grinder description opens "Hopper." (`messages/en/catalog.json:24`); the Mill descriptions open "Hopper mill." (`catalog.json:60`, `:123`).
- [ ] **none**

### 26. May player text say "whisky"?
- [ ] **doc** `docs/standards/user-facing-text.md:157`, `:168` — never whisky ("illegal").
- [ ] **code** `messages/en/catalog.json:125` — the Barrel description ends "Wine or cider, not whisky."
- [ ] **none**

### 27. May player text say something "feeds" the Necronomicon?
- [ ] **doc** `docs/standards/user-facing-text.md:327` — giving a thing to the book is **Sacrifice**; never feed.
- [ ] **code** `messages/en/necronomicon.json:12` — "A chest to the west of the book feeds it for you."
- [ ] **none**

### 28. May player text say research "unlocks" things?
- [ ] **doc** `docs/standards/user-facing-text.md:323` — **research / Researching**; never unlock, and never name a gate in a description.
- [ ] **code** — the research panel headings are "Unlocks", "Unlocks Skills", "Unlocks Research" (`messages/en/hud.json:256-258`, `src/game/ui/tree-panel.tsx:613`, `:623`, `:630`). The tutorial says "Researching unlocks new buildings and crops!" (`messages/en/tutorial.json:12`).
- [ ] **none**

### 29. What does the Pipes lens description call the water network?
- [ ] **doc** `docs/standards/user-facing-text.md:17` — **water network**.
- [ ] **code** `src/game/ui/lens.tsx:63` — "Reveals the whole water grid and every sprinkler reach." (`messages/en/hud.json:219`).
- [ ] **none**

### 30. May player text say "cash"?
- [ ] **doc** `docs/standards/user-facing-text.md:23` — **money**; never gold, cash, `$`.
- [ ] **code** `src/game/ui/feature-contracts/contracts.tsx:158` — the money contract prize reads "Cash" (`messages/en/market.json:33`). Cheat panel: "×{n} cash" (`messages/en/hud.json:252`).
- [ ] **test** `src/game/ui/hud.test.ts:37` — asserts the prize name equals the `market_cash` message, not the literal text.
- [ ] **none**

### 31. What does the Crop Variety Station call a study in progress?
- [ ] **doc** `docs/standards/user-facing-text.md:224` — **Researching {name}** is the husband's research job. The station prompt is "Study" (`messages/en/prompt.json:131`); no row covers the station.
- [ ] **code** `src/game/ui/station.tsx` — the station panel heading is "Researching now:" (`messages/en/hud.json:123`).
- [ ] **none**

### 32. Do the update notes use the table's words?
- [ ] **doc** `docs/standards/user-facing-text.md:347` — subject names come from this table or `skuLabel`; `{what it does}` is player register.
- [ ] **code** `src/game/ui/changelog.md` — recent entries use never words: "the stall" (`:82`, `:101`, `:107`), "the HUD" (`:16`), "An empty hopper" (`:18`). Older entries use net, overlay, permits, stall throughout (for example `:442`, `:514`, `:634`).
- [ ] **none**

### 33. Which never column belongs to which row at lines 216–220 of the table?
- [ ] **doc** `docs/standards/user-facing-text.md:216-219` — the Skill points, Auto-restock, Reputation and Luck rows have two cells and no never column.
- [ ] **doc** `docs/standards/user-facing-text.md:220` — "keep the armed tool after a click → **Hold Shift**" carries never "XP, points", which fits the Skill points row (`:216`), not Hold Shift.
- [ ] **none**

### 34. Does the table's "rotten" row agree with the lexicon?
- [ ] **doc** `docs/standards/user-facing-text.md:48` — a plant whose Happiness reaches 0 by drowning becomes **Rotten produce / rotten**.
- [ ] **doc** `docs/standards/lexicon.md` (Owner table, **rot** row) — rot is freshness at 0; not the end of anything that is not fruit.
- [ ] **code** `messages/en/catalog.json:82-83` — the Rotten produce description: "What is left when a plant drowns or a ripe crop is never picked." The code matches `user-facing-text.md:48`.
- [ ] **none**

## Doc only (no code found)

### 35. Is there a Rarity lens?
- [ ] **doc** `docs/standards/user-facing-text.md:237` — rarity lens is **Rarity**. Searched: `LENS_ROWS` in `src/game/ui/lens.tsx:8-77`; the lenses are Water need, Land quality, Ripeness, Object type, Variety (label from `almanac_concept_variety`), Pipes, Sensors, Vehicle interactions. `hud_lens_rarity_blurb` (`messages/en/hud.json:216`) is used by no code.
- [ ] **removed from the game**
- [ ] **none**

### 36. Does the game show "parked" for a vehicle on the field with no driver?
- [ ] **doc** `docs/standards/user-facing-text.md:184` — **parked**; never idle. Searched: `parked`, `Parked` in `messages/en` and in `src/**/*.tsx`, nothing found. The vehicle state strings are Stored, Driven, Automated, Deployed, Attached (`messages/en/vehicles.json:3-7`).
- [ ] **removed from the game**
- [ ] **none**

## Code only (no note mentions it)

### 37. Which vehicle words have no row?
- [ ] **code** — "Deployed" (`messages/en/vehicles.json:6`), the "Embark" button and prompt (`vehicles.json:19`, `src/game/sim/prompt.ts:206`, `src/game/ui/vehicle.tsx:76`), and the "Disembark" dash button (`src/App.tsx:1374`).
- [ ] **intended, document it**
- [ ] **not intended**

### 38. Which Command Center lines are not in the Chrome list?
- [ ] **code** `messages/en/notices.json` — the Chrome list (`docs/standards/user-facing-text.md:341`) has **Contract**; the game shows "Contract · {days} days left" / "Contract · due today" (`:13-18`). Not listed at all: "{name} joined", "{name} left", "{name} drifted" (`:66-68`), "A page is ready for the ritual" (`:69`). **A letter is waiting** (`:70`) is in the Concepts table (`:330`) but not in the Chrome list.
- [ ] **intended, document it**
- [ ] **not intended**

### 39. Which rail buttons are not in the Chrome list?
- [ ] **code** `src/game/ui/hud.tsx:199-221` — **Rotate** shows while Build is open and the armed thing can rotate; a small "×" button labelled "Clear lens" sits on the Lens button while the lens is locked. The Chrome list (`docs/standards/user-facing-text.md:337`) names neither.
- [ ] **intended, document it**
- [ ] **not intended**

### 40. Which names on the map have no row?
- [ ] **code** — **Asphalt** is a fourth paving (`messages/en/names.json:294-295`; row `:26` lists three). **Postbox** (`names.json:151`, `src/game/sim/prompt.ts:629`), **Burrow** (`names.json:182`), **Treasure** (`names.json:127`), **House** (`names.json:149`) have no row.
- [ ] **intended, document it**
- [ ] **not intended**

### 41. Are OR gate and AND gate still in the game?
- [ ] **code** — the Build shelf does not list them (`src/game/defs/shelf.ts:66-98`), and the changelog says they were removed (`src/game/ui/changelog.md:232`). Their names and catalog entries remain: `names_sku_buy_or` / `names_sku_buy_and` (`messages/en/names.json:100-101`), catalog entries titled "OR gate" and "AND gate" (`src/game/defs/catalog.ts:486`, `:492`), and SKU rows `buy-or` / `buy-and` (`src/game/defs/research.ts:475-476`). I did not check whether the almanac lists the catalog entries.
- [ ] **intended, document it**
- [ ] **not intended**

### 42. Which player strings are written in code, not in `messages/en`?
- [ ] **code** — "Disembark", "Dock", "Dock at the hangar arrows." (`src/App.tsx:1374`, `:1390`, `:1379`) and "No permit left" (`src/game/view/map.tsx:805`).
- [ ] **intended, document it**
- [ ] **not intended**

### 43. Which Family strings that the table bans still exist?
- [ ] **code** `messages/en/family.json:9`, `:10`, `:15`, `:16` — "Nothing left to learn", "Choose one", "Learned", "None yet" are in the file but no code uses them (searched `family_nothing_left`, `family_choose_one`, `family_learned`, `family_none_yet` in `src/`). The Crop Variety Station uses "Nothing left to learn about {name}" (`messages/en/prompt.json:132`).
- [ ] **intended, document it**
- [ ] **not intended**

### 44. Does the almanac still say "Sell all"?
- [ ] **code** `src/game/ui/almanac.tsx:622`, `:732`, `:814` — almanac links read "Sell all" (`messages/en/market.json:6`); the Market concept page says "Sell all pays one money total" and "Drop goods off and Sell all at …" (`messages/en/almanac.json:145`, `:147`). No row covers a Sell all button, and the Market no longer has one.
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

Agreed here means: the **say** word is the string in `messages/en` (call site cited where checked), and no **never** word was found for that row.

- [ ] 45. Words that never appear in player strings: net, irrigation system, plumbing, power, current, juice, cable, connection, lead, blurb, `$`, silver, dollar, packed dirt, boulder, turf, hay, decay, stale, corpse, health, mood, progress, maturity, nutrients, NPK, manure, pest, invasive, overgrown, blight, skeleton, fog of war, queue, invalid, unwire, toggle, shutoff, smart valve, backpack, seed chest, fertilizer shed, borehole, faucet, spigot, hose, tubing, kiln, oven, mixer, spice, enchant, loaf, toast, canner, vintage, deluxe, booze, liquor, cutting, scion, composter, fridge, garage, barn, ATV, seed drill, combine, docked, piloted, hitch, tome, grimoire, altar, shrine, rite, ceremony, cutscene, lemon, hatchet, lumber, timber, charcoal, toadstool, barrier, configure, flow rate, throughput, moisture, nutrient, timer, threshold, stoplight, LED, throw, brew, fell — doc `docs/standards/user-facing-text.md:15-333`, grep of `messages/en/*.json` values, no test.
- [ ] 46. Ground and paving: Grass, Hard soil, Very hard soil, Infertile soil, Rock, Tilled soil, Paving slab, Brickwork, Cobblestone, "Grass - rooting {n}%" — doc `:26-34`, code `messages/en/names.json:39-41`, `:152`, `:176-180`, `src/game/sim/look.ts:144`, no test.
- [ ] 47. Items: Cut grass, Grass seeds, Grass seed, Fertilizer bag, Compost, Weed spray, Pulled weed, Axe, Chainsaw, Wood, Ash, Fly agaric, Wooden fence, Sugar, Bread, Flakes, Vanilla extract, Ketchup, Passata, Barackpálinka, Wine, Cider, Premium {name}, Vodka / Beer / Brandy / Mixed spirit, Olive oil / Flour / Extract, Infused {name}, {name} graft, {Crop} ({Variety}), {Crop} seed, {Crop} seeds — doc `:35-37`, `:55`, `:59`, `:151-172`, `:259-270`, code `messages/en/names.json:32-38`, `:50-58`, `:118-144`, `:289-290`, `messages/en/hud.json:4-5`, test `src/game/sim/feature-machines/recipe.test.ts:434-436` (Passata, Ketchup).
- [ ] 48. Buildings: Pumpjack, Pump, Well, Tap, Sprinkler, Vertical sprinkler, Large sprinkler, Pipe, Valve, Pot still, Furnace, Infuser, Jam machine, Barrel, Seed grinder, Compost box, Freezer, Large freezer, Vehicle hangar, Seed silo, Additive store, Seeding silo, Additive silo, Produce silo, Refueling station, Weather Forecast Station, Necronomicon — doc `:58`, `:133-149`, `:155-156`, `:173-177`, `:193`, `:325`, code `messages/en/names.json:67-114`, `:146-175`, `:296-299`, no test.
- [ ] 49. Crops, trees, rarities, purposes, tree looks: Carrot … Sugar cane, Apple / Apricot / Cherry / Olive, Common / Uncommon / Rare / Heirloom, Fresh / Preserving / Alcohol, "{Name} tree - growing / trunk / on-season / off-season" — doc `:61`, `:162-164`, `:253-258`, code `messages/en/names.json:3-19`, `:291-293`, `messages/en/prompt.json:51`, `:113-116`, no test.
- [ ] 50. Plant state words in the plot look and notices: happy, too wet, wilting, drowning, needs fertilizer, starving for fertilizer; "{Crop} is wilting / drowning / starving for fertilizer / losing freshness"; Dead plant; Rotten produce; still **Needs water** — doc `:39`, `:41-43`, `:45-49`, code `messages/en/prompt.json:100`, `:144-150`, `messages/en/notices.json:21-26`, `messages/en/hud.json:118`, no test of the text.
- [ ] 51. Stat labels: Happiness, Growth, Fertilizer, Freshness, Quality, Weed resistance, Aging, maturing, Durability, Content — doc `:51-54`, `:96-97`, `:271-273`, code `messages/en/hud.json:107-115`, `messages/en/prompt.json:103-104`, test `src/game/sim/inspect.test.ts:23` (Durability label).
- [ ] 52. Research names: Gardening tools, Hardened tools; skills: Careful tending, Trusted seed bank, Őstermelő; skill ranks I–III (`ROMAN`, every skill's `maxTier` is 1 or 3) — doc `:56-57`, `:64`, `:133`, `:332-333`, code `messages/en/research.json:47`, `:55`, `messages/en/skills.json:12`, `:14`, `:45`, `src/game/defs/skills.ts:267`, no test.
- [ ] 53. Prompts: Tend, Harvest, Dig, Plant {name}, Sow {name}, Spray, Fill, Fill {name}, Need a bucket (lower-cased name), Move here, Place {name}, Demolish {name}, Demolish paving, Demolish wire, Remove wire, Cannot loop, Cannot wire here, Cannot afford, Cannot place here, Cannot demolish here, Cannot demolish here (stores a vehicle), Pipe already has a valve, Open valve / Close valve, "{name} - wired", My hand is full!, I need to drop what is in my hand to pick this up, I can't remember more errands than that!, Nothing in hand, I need a tool to {action}, I cannot use this {tool} to {action}, I don't own this land!, Fences need untilled ground, Already fenced, Drop off, Inventory, Crush into {name} / flakes, Burn, Bake, Chop, Grind, Distill, Infuse, Collect {name}, Make jam / Make {name}, Flip {name}, Press {name}, Tune {name}, Sacrifice — doc `:63`, `:67-92`, `:94-95`, `:98`, `:130`, `:132`, `:150`, `:298-319`, code `messages/en/prompt.json:3-90`, `:167`, `src/game/sim/prompt.ts:769`, no test of the text.
- [ ] 54. Walking up to a chest, silo, store, hangar, house or vehicle shows "Click to Open {name}" in the inspect panel — doc `:92-93`, code `src/game/ui/status.tsx:306-327`, `messages/en/prompt.json:17`, `:33`, no test.
- [ ] 55. Weather and clock: Clear, Rain, Dry, Flood, Drought; "Tomorrow · {name}"; "Day {day} · {phase}"; Sunrise, Midday, Sunset, Twilight — doc `:99-109`, code `messages/en/names.json:20-28`, `messages/en/hud.json:56`, `:65`, no test.
- [ ] 56. End-of-day summary: "Day {n} turned in", Support from grandma, Tax, Water, Harvested, Lost, Research, Balance, A new board is up., Completed / Missed / Cancelled, Close; notice "Day {n} Finished" — doc `:111-122`, code `src/game/ui/recap.tsx:12-80`, `messages/en/hud.json:75-85`, `messages/en/notices.json:65`, no test.
- [ ] 57. Command Center: title Command Center, Weed infestation, and {n} more, Hide / Show, Researching {name}, Researched {name}, Contract completed, {vehicle} is out of fuel, Water network is running low, {n} skill points to spend, {n} farm expansion opportunities, A letter is waiting; map boot Loading... — doc `:123-126`, `:330`, `:341`, code `messages/en/notices.json:19-70`, `messages/en/hud.json:53`, no test.
- [ ] 58. Market and family: Market, Contracts, Reputation, Luck, Skill points, Auto-restock, Maximum Market Impact, Expansion, Expand {price}, Hold Shift, Family, You, Husband, Daughter, Gardener, Research, Market (role), Only the host can choose a skill., Done — doc `:127-129`, `:209-221`, `:223`, `:322`, `:331`, code `messages/en/market.json:3-7`, `:43`, `messages/en/family.json:3`, `:14`, `:17`, `:20`, `messages/en/names.json:183-188`, `messages/en/hud.json:41`, `:66`, `:68`, `:159`, `:186`, `messages/en/prompt.json:112`, no test.
- [ ] 59. Vehicles: Quad, Tractor, Seeder, Sprayer, Harvester, Stored, Driven, Automated, Attached, Deploy, Automate, fuel / Fuel, Buy from market, Wait for fuel, No wait, Refuel at {at}, Add refuel here, "{units}/{cap} units, {store}/{storeCap} L", route, Vehicle automation, Send back to the hangar, Heading to {n}, Stopped, Out of fuel, Boom 3 / Boom 5 — doc `:178-208`, code `messages/en/vehicles.json:3-17`, `:22-31`, `:76-83`, `messages/en/names.json:166`, `:190-191`, `messages/en/hud.json:297`, `messages/en/prompt.json:92`, no test.
- [ ] 60. Chrome and menus: Almanac, almanac tabs Seeds / Trees / Utility / Sensors / Automation / Water systems / Building / Game concepts, Infusion, Build tabs Tools / Water / Automation / Storage / Sensors / Land (in that order), Build, Lens, No lens, Lock view, Water need, Land quality, Ripeness, Object type, Pipes, Sensors, Vehicle interactions, Cheat, Multiplayer, host / guest, Pause / Resume, Gear, Settings, Back, Revert to default, Reduced motion, Pause when this tab is not in front, Gardena — doc `:225-236`, `:238-248`, `:250-252`, code `src/game/ui/almanac.tsx:172-181`, `src/game/defs/shelf.ts:18-101`, `src/game/ui/lens.tsx:8-77`, `messages/en/hud.json:28-49`, `:198-221`, `messages/en/menu.json:9-16`, no test.
- [ ] 61. Rail left: Build, Research, Market, Contracts (after its research), Vehicle automation (after its research), Lens, Family, then Demolish and Cancel while building; rail top buttons Multiplayer, Almanac, Cheat, Gear, Pause / Resume — doc `:337-339`, code `src/game/ui/hud.tsx:162-234`, no test.
- [ ] 62. Almanac text avoids the Chrome list's banned words (gem, pip, overlay, HUD, ribbon, dock, SKU, stall, rolled, RNG, tick, DAG, node, dump, seam, Cmd, hash) — doc `:343`, grep of `messages/en/almanac.json` values found none, no test.
- [ ] 63. Sensors and signals: Send signal when..., on / off, Sprinkler output, Sprinkler output ({crop}), L/day per tile, Water sensor, Wilting / Overwatered, Harvest sensor, Any / All, Fertilizer sensor, Day sensor with checkbox Day, Counter, Count to, Reset to {n}, Water-system sensor, "no pipes around sensor!", Pressure plate, Variety sensor, Weather sensor, Plain / Named / Heirloom, Vehicle / You / On the ground, "open fence, close it to turn the sensor on", Traffic light, Pulser, Lamp, Logic gate, NOT gate, OR / AND — doc `:18-21`, `:274-313`, code `messages/en/sensors.json:3-22`, `messages/en/prompt.json:137-142`, `messages/en/names.json:192-209`, no test.
- [ ] 64. Necronomicon: page, Sacrifice, Perform the ritual / ritual, Done, A letter is waiting — doc `:325-330`, code `messages/en/prompt.json:167-171`, `messages/en/notices.json:69-70`, `messages/en/necronomicon.json`, no test.
