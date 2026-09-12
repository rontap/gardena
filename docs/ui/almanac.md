# Almanac

Centered overlay. Title **Almanac**. Left list, right pane. Window is a definite height so inner panes scroll. Chrome is a column; body is `scroll-pane`. Solo overlay pause: [[ui/hud]]. Scroll chain: Tabs.Root fills; Tabs.List shrinks; list+pane row fills; left list scrolls; right pane scrolls. `scroll-pane` — [[ui/type]].

Eight underline tabs. Wrap the tab list so a label never splits. Do not shrink type.

| tab id | label | list |
|---|---|---|
| `seeds` | Seeds | **Overview**, then carrot potato wheat tomato raspberry grape vanilla chilli sugar-cane soil weed grass-seeds grass rotten dead |
| `trees` | Trees | apple apricot olive cherry |
| `utility` | Utility | shovel better-shovel pickaxe better-pickaxe axe chainsaw bucket large-bucket fertilizer weed-spray compost sugar wood ash rotary-shovel diamond-pickaxe |
| `sensors` | Sensors | **Overview**, then lever button lamp logic not pulser counter sensor-water sensor-fert sensor-harvest sensor-variety sensor-weather water-system vehicle-detector traffic-light sensor-day |
| `automation` | Automation | **Overview**, then chest grinder compost-box mill furnace still barrel jam freezer station infuser hangar silo-seed silo-produce silo-spray |
| `water` | Water systems | pumpjack well tap pipe valve sprinkler sprinkler-vert sprinkler-large |
| `building` | Building | fence tile-cobble tile-brick tile-paved weather-station |
| `concepts` | Game concepts | Variety, Quality, Freshness, Happiness, Day & Night, Market, Skills, Family, Research, Automation, Luck, Burrow, Infusion |

Overview on **Seeds**, **Sensors**, **Automation** only. First left-list row, label **Overview**, no icon. Tab-scoped id `'overview'`. Tab click on those three lands Overview. Trees, Utility, Water systems, Building, Game concepts: no Overview row. Hangar + silos stay on Automation. Station stays on Automation. Game concepts: no SKU rows.

Building is fence + tiles + weather-station. Apple is not on Seeds. Olive is not on Seeds. No watermelon row. Weather-station pane is generic Building chrome; plate dirt; skuLabel **Weather Forecast Station**; description **Tomorrow's weather appears next to today, so you can plan watering, the stall, and the Water bill before Sunrise. A second station does nothing extra.** Catalog pane `grass-seeds` is the Seed silo pack after landscaping, face `{ kind: 'seeds'; crop: 'grass' }`, not a Build Land card. Cut grass pane `grass` is `{ kind: 'grass' }`. Illegal `{ kind: 'grass-seeds' }`. — [[ui/store]] [[mechanics/inventory]] `inventory.grass-silo`

Crop and Tree panes carry `CROPS.desc` under the name.

## The base plant only

CropPane / TreePane show the crop, not its Varieties. No Variety row, no per-Variety description, no path ratings, no selector. Every face, stat and Recipe on the pane is `'base'`. The Almanac is where a player learns what a crop is; what a Variety is for is read where they pick one — the seed silo and shop seed callout — [[ui/store]].

Fruit row: fruit face + plant/tree prop at `'base'`. Plant art cycles `sprout` / `grow` / `ripe`. Tree prop cycles `trunk` / `grow` / `unripe` / `ripe`. [[architecture/view]]

Illegal: a Variety row. Illegal: a ladder. Illegal: a rating number.

Crop stats: Grow time, Drink, Water range, Fertilizer, Sell, Seed price, Freshness. Leaf meter 1–5. Coin on Sell and Seed price. Crop Freshness stat row stays plain text — not an AlmanacLink. Numbers: `statsOf(crop, 'base', 0, [])` so Sell is `CROPS.sale` at Quality 0. Seed price is the pack of `'base'` only.

Sugar-cane is a CropPane. Product face is cane fruit, not the sugar bag. Vanilla: no CropPane mill line. Chilli: no CropPane mill line. Extract, flour, brandy, mill sugar, flakes, vanilla-extract, infused goods sit in Ingredients, not as extra product panes. Infused goods do not get their own pane — one Game concepts **Infusion** page. [[ui/recipe]] [[mechanics/infusion]] `infusion.overlay`

Olive is `TreeId`: TreePane only. Utility `sugar`: liters bag face. Hangar and field silo panes [[ui/vehicles]]. Sensor panes: generic chrome — title, one plate, description. Titles match look names [[ui/sensors]]. Water-system pane stays (sku hidden from Build). Advanced sensors is a research card, not a `CatalogEntry`. Quad / tractor / trailer are hangar-buys, not almanac SKUs. SKU panes stay generic / crop / tree / pipe. Station pane is generic Automation chrome. No Recipes block.

## Plate fills

Reuse existing faces. No new SVG. Plate is square, no caption. Crop fruit / plant and tree fruit: dirt. Tree 24×48 prop: grass. Sensors / Automation / Water systems SKU — buildings, pipe: grass. Utility / Building / Seeds non-crop SKU: dirt. Machine goods — sugar, spirit, cask, jam, oil, flour, extract, flakes, vanilla-extract, bread, ash: water. Compost, wood, and tools stay dirt. Fence, tiles, and weather-station stay Building, dirt. Titles **Axe** **Chainsaw** **Wood** **Ash** **Furnace**. Station plate grass. Infuser plate grass.

`Pane` / `CropPane` / `TreePane` take `done`: `fermentation` `grinder` `preservatives` `furnace` `infusion` from `world.done.has(...)`. Not a `jam` boolean. Generic `Pane` takes the current tab so Sensors / Automation / Water systems fill grass.

## Ingredients

Hardcoded product plates do not sit on the fruit row. Fruit row is fruit face + plant/tree prop only. `recipesUsing(face)` — [[mechanics/machines]] `machines.recipe-collapse`. CropPane / TreePane pass the `'base'` fruit face. UI keeps a recipe whose machine unlock is in `done`: mill `unlock-grinder`, jam `unlock-preservatives`, still / barrel `unlock-fermentation`, furnace `unlock-furnace`, infuser `unlock-infusion`. Empty → no section. Furnace, grinder, mixed-still and infuser jam / spirit / cask rows take many crops — skipped. Infuser oil `one` matches. Infused yield faces draw overlay-infused. No extra infused product plates.

Section under the stats, last in the pane. Heading **Recipes** — reused key `m.hud_recipes()`, same word as the Automation recipe block. Plates: yield face, water fill, same wrap row. No caption. Hover a plate: Overlay `aside` [[ui/callout-hover]] `right`. Title `faceName` of the yield. Body: `Coin` of baked `unitSale` at Quality 0, then that recipe `Recipes` `{ kind: 'one'; recipe }` `sm` — [[ui/recipe]]. Leave clears. Plates take pointer events; recipe rows do not.

Illegal: extra product plates on the fruit row. Illegal: olive on Seeds. Illegal: a Variety row that is a ladder.

## Shape

`CatalogEntry` stays for SKUs only. Game concepts are not `CatalogEntry`. Overview is not `CatalogEntry`. No fake `Face`. Overview id is `'overview'` (tab-scoped). Concept ids: `variety` `quality` `freshness` `happiness` `day` `market` `skills` `family` `research` `automation` `luck` `burrow` `infusion`. Labels: Variety, Quality, Freshness, Happiness, Day & Night, Market, Skills, Family, Research, Automation, Luck, Burrow, Infusion.

Left-list: SKU rows keep `itemInner`. Overview and concept rows: title only, no icon plate. Right pane: SKU → existing Pane. Concept → concept pane. Overview → Overview pane. Opened by the top-ribbon **Almanac** button — [[ui/hud]]. Almanac Overlay passes `aside` for the Ingredients callout. Same `CalloutHover` `right` as Market.

Underline tab click (no link): select that tab and its first list row. First ids: seeds `overview`, trees `apple`, utility `shovel`, sensors `overview`, automation `overview`, water `pumpjack`, building `fence`, concepts `variety`. `AlmanacLink` sets both `tab` and `id`. Deep-link must land the pane, not only the tab. A link’s `{ tab, id }` is a pair that exists on that tab’s list. `{ tab: 'seeds' | 'sensors' | 'automation', id: 'overview' }` is legal. `{ tab: 'trees' | 'utility' | 'water' | 'building' | 'concepts', id: 'overview' }` is not. `{ tab: 'concepts', id: 'luck' | 'burrow' | 'infusion' }` is legal.

## AlmanacLink

In-almanac navigation only. Not a `Btn`. Not Press Start. Not external URLs. Not `<a href>`. Token `dirt`. Underline always. Click: `setTab(to.tab); setId(to.id)`. Link concept names, Overview on the three tabs that have it, and a few example SKUs when a player needs a doorway — never a full roster. Link **Market** not stall.

## Copy law

Every value is qualified: subject + amount + unit/noun + where it applies. Quality is a percent of how the plant was treated. Variety is what the plant is. A purpose is **Fresh** / **Preserving** / **Alcohol** plus what it pays. Undefined words are illegal unless a natural farming word, or this page (or a linked page) has already defined them. **Recipe** is defined by [[ui/recipe]] and heads the Automation recipe block. Crop / tree Ingredients heading reuses that word: **Recipes**. Ban in player strings unless defined in-page: gem, pip, overlay, HUD, ribbon, dock, SKU, stall, rolled, tick, recap (define it: the end-of-day summary), stipend (say **Support from grandma**). Coin `<Coin />` for money amounts. Variety and Quality concept copy, Seeds Overview links to those two: `almanac_variety_p1` `almanac_quality_p1` `almanac_seeds_p2_*` `almanac_seeds_p3_*`. The `almanac_variety_desc_*` keys are no longer read.

## Overview / Game concepts

Help pages. Same chrome. Title = list label. No SKU plate. Short paragraphs. Not `CatalogEntry`. Copy lives in `src/game/ui/almanac.tsx`. Do not paste it here. Wrap the marked names in `AlmanacLink`. A page is good iff the reader can answer: why do I need this, what can I use it for, what do I get from it. Forbidden on Overview: item-by-item link list of that tab’s rows; research-gated “after X you can”; full listing of crops / machines / sensors / varieties; “See also” dump of every SKU title. Doorway links: a few named concepts or one example SKU, not a roster.

Game concepts: player help center. Forbidden: developer words listed in [[standards/user-facing-text]] Almanac. Automation here is the **concept page**, not a second copy of the SKU tab. **Luck** and **Burrow** are Game concepts, not SKU rows. Inspect does not name loot. No luck HUD chip. Doorway: Skills, each other. Not a roster of loot. [[mechanics/burrow]]. **Infusion** is one Game concepts page. Not a pane per infused jam, cask, spirit, or oil. Doorway: Market, Automation. Not a roster of infused products. [[mechanics/infusion]]

## TreePane

Same shell as CropPane: fruit face + 24×48 prop at `'base'`, then `Stat` rows with leaf meters 1–5. Meters compare among the four trees (`TREE_IDS`: apple apricot olive cherry). No lemon. No Variety row. Name is the species. Prop cycles `trunk` / `grow` / `unripe` / `ripe`. Tree prop sits on grass. Fruit face stays dirt. Ingredients: same section as CropPane, `recipesUsing` on that Variety's fruit. Line under desc names drop days and multipliers from `TREE_YIELD_DAYS` `TREE_YIELD_MUL` `TREE_OFF_MUL`. Does not say yielding / resting. Look / inspect words are on-season / off-season — [[ui/inspect]]. Rows: Juvenile (`juvenileSeconds`), Fruit every (`1 / fruitSeconds`), Sell (`CROPS.sale` at Quality 0), Freshness (`rotSeconds`). No Water. No Yield. No Drink. No Fertilizer. No Seed price. Numbers: [[mechanics/trees]]. Tree fruit Quality is 0.

## Pipe

Water systems list row `pipe` only. Valve and the sprinklers stay their own static rows. Same generic pane chrome as other non-crop entries. The plate is not `itemInner({ kind: 'pipe' })`. Cycle join art the way CropPane cycles stages: `useCycle(PIPE_JOINS.length)`, `CYCLE_MS` — [[ui/recipe]]. Order, rot 0: `PIPE_STUB` `PIPE_I` `PIPE_L` `PIPE_T` `PIPE_X`. Not `pipe-source`. Not `pipe-valve`. Pipe, crop and tree panes share `useCycle`. One cadence, one hook. Variety row does not cycle. The machine ids add a **Recipes** block under the description, `size="md"` — [[ui/recipe]]. Station does not. Infuser yield faces draw overlay-infused.
