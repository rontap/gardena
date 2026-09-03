# What is the game, really?

Working sheet. Not law.

Each heading is a mechanic. If docs, tests, and code all say the same rule: **MATCH**. If they don't: each checkbox is a **different rule**. Sources that agree share one box. Tick the rule that should be true.

---

## Day

Sundown pays the stipend, takes tax and the pump bill, opens recap. Money may go negative. Phases are sunrise, day, sunset, twilight. Recap is how a player continues; it grants skill points.

Day seam - MATCH

Day phases - MATCH

Day recap - MATCH

---

## Land

One starting chunk. Neighbours cost more each time. Permits from research, inherit-land, and prizes. Daily tax is a base plus a chunk fee, eased by the tax skill, never below $1.

Expansion tax - MATCH

Expansion chunk - MATCH

---

## Soil

Shovel on soft dirt: one swing, a bed. Hard: two swings. Very-hard: shovel refuses, pickaxe makes it infertile. Rock: pickaxe to soft. The same soil stays through plant, harvest, death, rot, weeds. Dirt near the house is kinder. Fertilizer feeds a bed; synthetic kills organic, enough real feed restores it.

Till - MATCH

Soil instance - MATCH

Soil goodness - MATCH

Fertilizer - MATCH

---

## Plants

Growing plants drink and can be stunted. Happiness drains on drown / wilt / starve and rises when both bars are green. Zero happiness while growing: drown → rotten, else dead. Ripe does not die of thirst — it rots. Harvest, packs, tend, vanilla, annuals, tree-seed foot: all three agree.

Plant drink - MATCH

Plant happiness - MATCH

Ripen - MATCH

Harvest - MATCH

Seed packs - MATCH

Rarity lock - MATCH

Tend - MATCH

Vanilla - MATCH

Annual vs tree - MATCH

Tree plant foot - MATCH

### Fruit in the freezer

- [ ] Fruit in a freezer does not rot. — plants note, inventory note
- [x] Fruit in a freezer still rots, at one fifth speed. Cold never restores freshness. — machines note, tests, code

---

## Trees

Wild apple on the home chunk. Starter seeds are apricot, olive, cherry. Juvenile → pending → on-season → off-season. Fruit drops onto a random nearby plot, not the trunk. Tend off-season. Shovel gives a tree seed.

Wild apple - MATCH

Tree yield - MATCH

Tree drop - MATCH

Tree tend - MATCH

---

## Water

A bucket tops empty/weed beds to the middle of the bar, growing/ripe to comfort. A sprinkler only waters **growing** plants. A closed valve blocks that one pipe; a bypass still flows. Pump and well on the same pipes share tanks.

Pour - MATCH

Sprinkler targets - MATCH

Valve (the rule) - MATCH

Two sources, one network - MATCH

### Placing a valve with no pipe

- [x] Buying a valve on bare dirt also lays the pipe and charges for both. “Valve needs a pipe” is gone. — water note, tests, code
- [ ] You still need a pipe first. Blocked copy: “Valve needs a pipe.” — place-tool note

### Close a valve, far side goes dry

The rule itself matches (closed valve blocks that edge). A click-through for it is written and **skipped**.

- [ ] The rule is enough. Leave the click-through skipped. — docs, unit tests, code
- [ ] A player should be able to close a valve in the browser and watch the far side dry. Un-skip and fix the clicks. — the skipped click-through
- [x] I do not get what skipped is here, but if that is an e2e test, that should be fixed.

### Closed valve, water takes a bypass

Same shape: the rule matches, the click-through is skipped.

- [ ] The rule is enough. Leave it skipped. — docs, unit tests, code
- [x] Un-skip: close a valve, water still arrives around it. — the skipped click-through

### Connected sprinkler waters a plant

- [x] A live sprinkler keeps growing soil wet. Prove it by the plot’s water / wilt, not by the clock. There is no thirst pip on the map. Inspect is “Carrot - growing 12%”. — docs, unit tests, code
- [ ] Wait half a minute of day clock, inspect still says “growing”, and a thirst marker is gone. — the click-through

### Place a sprinkler with no pipes

- [ ] You may place a dry head. It does nothing until a pipe reaches it. Placement + price is enough to check. — docs, tests, code
- [ ] Placing it is not enough; the check must also prove it is dry until connected. — *(no source says this today; tick if you want it)*
- [x] fucking do not ideate here if everywthing agrees

---

## Weather

Forecast is a table from the seed. Flood/drought always next clear. Rain/flood soak beds; dry/drought evaporate. Pump bill at sundown uses yesterday. Flood closes the stall at sunrise; drought at midday unless open-24. Forecast skill: tomorrow’s glyph.

Weather chain - MATCH

Soak / evap - MATCH

Pump bill - MATCH

Market hours - MATCH

Forecast skill - MATCH

### Drought shop prices

- [x] On drought, only seed packs and utility tools cost double. Buildings, automation, hangar buys do not. The HUD should not say “Shop goods cost double.” — weather price rule, tests, code (the prices)
- [ ] Everything in the shop costs double, and the HUD sentence is right. — HUD callout copy (weather note + HUD note + the string in the game)

---

## Weeds

Empty tilled beds may sprout on the slow tick. Chance ramps over the first day. Rain/flood make it worse. Dry/drought make it **impossible**. Mature weeds once raise neighbours. Spray, pull, shovel, grass: notes, unit tests, and sim agree.

Weed chance - MATCH

Weed outbreak - MATCH

Weed spray - MATCH

Weed pull - MATCH

Grass - MATCH

### Weeds appear on empty beds

- [ ] Weeds sprout on empty tilled soil unless the day is dry or drought. They live on the farm canvas, not as a page marker. A browser check must lock weather and look at the farm. — docs, unit tests, code
- [ ] Till five beds and wait until a weed marker appears in the page. — the click-through
- [x] these two statements are not contradictory

---

## Market

Sell all when open. Consign always. Freshness, rarity, skills, flood/drought fruit bonus, then saturation. Rotten is $1 only with clearance. Vodka vs potato, mixed mash, mill sugar vs shop sugar: agree.

Stall sell - MATCH

Vodka vs potato - MATCH

Mixed spirit - MATCH

Sugar mill vs shop - MATCH

Saturation - MATCH

### Heirloom skill on cider

- [ ] Heirloom bonus applies to wine **and** cider (every cask, every spirit). — market note, code
- [x] Heirloom bonus applies to wine, not cider. — family note
- [ ] *(tests never check cider)*

---

## Contracts

The day’s board is pure from the seed. Delivery does not press the stall; miss and cancel leftovers do. Miss pays market minus a penalty; a full bin is a complete. Fill live jobs in list order, then the stall.

Board - MATCH

Delivery vs stall - MATCH

Miss - MATCH

Consign order - MATCH

Cancel is not a miss on that company’s record. Fee + reputation + history “cancelled”. Miss tally unchanged.

Cancel vs company book - MATCH

### Do live contracts survive save and load?

- [x] Yes. Active jobs, fills, history, reputation persist. The board is not saved; it is rolled again from the seed. — contracts note, save note, tests, code
- [ ] No. Load wipes contracts. — one architecture note

---

## Research

One job, pay up front. Paving is cosmetic. Crop-variants unlocks rarity. Dispatch research before routes. Unlock-all is a cheat.

Research job - MATCH

Gates / reveal / variants / dispatch - MATCH

---

## Family

Shared skill-point bank. Sundown grants some. Water lens / land lens / vehicles lens gates. Haggling is hidden. Jam slows rot below half freshness.

Skill pick - MATCH

Lenses - MATCH

Haggling hidden - MATCH

Jam rot - MATCH

---

## Bags and house

One thing in the hand. Sixteen house slots. Seeds to the seed silo, additives to that store. Compost box. Stack caps. Bucket 5 L, large 10 L.

Inventory - MATCH

Compost - MATCH

Stacks - MATCH

Containers - MATCH

---

## Machines

Cane mill, vanilla extract, barrel wine/cider, still needs piped water, wire pauses mill/jam/still, west chest in / east chest out, grinder hopper. Machinery skill does not haste the still or barrel.

Sugar mill - MATCH

Vanilla mill - MATCH

Barrel - MATCH

Still water - MATCH

Wire pause - MATCH

Chest in / out - MATCH

Grinder - MATCH

---

## Vehicles

Quad vs tractor, hangar, fuel, surfaces, empty crawl, refill-all, WASD, Enter to board, cargo only parked, boom while moving straight, routes.

Kinds / buy / hangar / drive / enter / cargo / boom fire / routes - MATCH

### Field silos

- [ ] The three field silos are scenery. They do not load or unload. Real hoppers are the house seed silo and the additive store. — vehicles note, changelog, tests, code
- [ ] Field silos load trailers. — Build tab blurb
- [x] do _NOT_ change behavior here.

### Boom width

- [x] Boom 3 vs 5 changes how wide the tractor paints, on the farm. Prove it by tiles planted (or sprayed, or harvested), not by a page drawing. Enter boards and dismounts. — docs, unit tests, the seeder click-through, code
- [ ] After Boom 5 → 3, a rake drawing in the page must contain `scale(0.6`. — that click-through’s second half  --> this is classic idiotic design which would break on any scaling changes and does NOT test for actual functionality. Fucking idiot.

### Buy a Quad, drive, dock

- [ ] Hangar → buy Quad → deploy → drive → disembark → embark → dock, as a player would walk it. — docs, code
- [ ] Same loop, but teleport the gardener onto the pad and into the seat. — the click-through
- [x] what are you talking about? what is the click-through? I asked for comparison of e2e tests, code and docs. There is no click-through concept.

---

## Wires

No instant loops. Button pulse, pulser on a rising edge. Unwired sprinkler pours; wired follows the wire. Chest/silo full is a signal. Spray art follows the pour.

Sensors - MATCH

### Sprinkler spray while it pours

- [ ] Spray is on while the head pours, off when it doesn’t. Reduced motion: no bursts, state spray holds still. Clicks pass through spray. Prove pour on/off and “no bursts”. — docs, code, the on/off click-through, the no-bursts click-through
- [ ] It is enough that *some* spray exists, or that a CSS flag says don’t-steal-clicks, or that a “rest gap” is named without watching a rest frame. — the other click-throughs
- [x] there are literally not opposing at all.

---

## Tutorial

New farm only, session only, never blocks you.

Tutorial - MATCH

---

## Placing and HUD

Pay on confirm. Cancel free. Delete does not refund. Pipes, valves, sprinklers, wells, sensors, tiles stay in the hand.

Place / stay armed - MATCH

### Closing Shop vs the Pipes overlay

- [x] Closing Shop puts the **held pipe** away. A Pipes lens you **picked** stays. — newer place / docks / lens notes, code
- [ ] Closing Shop or Escape always turns Pipes and Sensors off, even if you picked them. — older HUD / Build / vehicles notes, the click-through

### Is there a Smart valve for sale?

- [x] No. One valve. Smart irrigation gives every valve a wire. — water / sensors / research notes, tests (they only place the ordinary valve), code
- [ ] Yes. Shop sells a Smart valve, and guests / AI place it as its own command. — shop note, guest note, AI note

### Hover ring on a tile

- [ ] One outline around the footprint. Ink while idle. Roof colour once a build tool is armed and the tile is not a legal place. Almanac hover clears it. — docs (one outline), code
- [ ] The ring is always the ink colour, including after you arm a pipe, a sprinkler, or Delete. — the click-through
- [x] what the fuck is ink when idle? speak normally 

### Pipe ghost and dry pipes

- [ ] A pipe you are aiming looks like a pipe. A dry pipe does not look wet. That is farm art. — docs, code
- [ ] The ghost’s page markup must contain a picture reference and not a scratch line. A dry pipe’s markup must not contain one specific wet-water colour code. — the click-throughs

### HUD panels open

- [ ] Shop, Research, and Almanac open from the rail. A smoke that they open is allowed. It is not play. — docs (HUD smoke only), code
- [ ] Four screenshots of those panels are the check. — the click-through
- [ ] this is fucking ridiculusly not understandable

### Ripe fruit rots on the plot

- [x] Ripe freshness counts down; at zero the plot is rotten. Starter carrots are in the seed silo. — docs, unit tests, code
- [ ] Plant from the house inventory line “Carrot seed - 5, plant it”, wait until ripe, wait until rotten. — the skipped click-through

---

## Paths and fences

Cosmetic on untilled ground. They do not change walk speed.

Landscape - MATCH

---

## Other people on the farm

Guest may shop, place most buildings, drive, wire, consign. Guest may not lay pipes, click valves, expand, research, pick skills, or open chests. Away pockets stop rotting; the field still rots. Four seats then the door is full.

Multiplayer - MATCH except the leftover Smart valve sentence under placing.

---

When the boxes are ticked, send this back. No fixes until then.
