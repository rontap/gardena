# Almanac

Centered overlay. Title **Almanac**. Left list, right pane. Window is a definite height so inner `flex-1 overflow-y-auto` scrolls. Chrome is a column; body is `scroll-pane`.

Solo overlay pause: [[ui/hud]].

Scroll chain: Tabs.Root fills; Tabs.List shrinks; list+pane row fills; left list scrolls; right pane scrolls. `scroll-pane` — [[ui/type]].

Eight underline tabs. Wrap the tab list so a label never splits. Do not shrink type.

| tab id | label | list |
|---|---|---|
| `seeds` | Seeds | **Overview**, then carrot potato wheat tomato raspberry grape vanilla sugar-cane soil weed grass-seeds grass rotten dead |
| `trees` | Trees | apple apricot olive cherry |
| `utility` | Utility | shovel better-shovel pickaxe better-pickaxe bucket large-bucket fertilizer synth-fertilizer weed-spray compost sugar rotary-shovel diamond-pickaxe |
| `sensors` | Sensors | **Overview**, then lever button lamp or and not pulser counter sensor-water sensor-fert sensor-harvest water-system vehicle-detector traffic-light sensor-day |
| `automation` | Automation | **Overview**, then chest grinder compost-box mill still barrel jam freezer hangar silo-seed silo-produce silo-spray |
| `water` | Water systems | pumpjack well rain-tank tap pipe valve sprinkler sprinkler-vert sprinkler-large |
| `building` | Building | fence tile-cobble tile-brick tile-paved |
| `concepts` | Game concepts | Rarity, Freshness, Happiness, Day & Night, Market, Skills, Family, Research, Automation |

Overview on **Seeds**, **Sensors**, **Automation** only. First left-list row, label **Overview**, no icon. Tab-scoped id `'overview'`. Tab click on those three lands Overview.

Trees, Utility, Water systems, Building, Game concepts: **no** Overview row. Hangar + silos stay on Automation. Game concepts: no SKU rows.

Building stays fence + tiles. Apple is not on Seeds. Olive is not on Seeds. No watermelon row.

Crop and Tree panes carry `CROPS.desc` under the name. Crop panes: rarity tabs **Common** **Uncommon** **Rare** **Heirloom**. Preview swaps fruit face, plant art, and numbers.

Crop stats: Grow time, Drink, Water range, Fertilizer, Sell, Seed price, Freshness. Leaf meter 1–5. Coin on Sell and Seed price. Crop Freshness stat row stays plain text — not an AlmanacLink.

Sugar-cane is a CropPane. Product face is cane fruit (`fruit-sugar-cane`), not the sugar bag. Sell is crop fruit `statsOf`. Line under desc: **Mill 5 cane into 2 L sugar.** Vanilla mill is the mill recipe list only — no CropPane mill line, no extract plate. [[ui/recipe]]

Olive is `TreeId`: TreePane only.

Utility `sugar`: liters bag face. Hangar and field silo panes [[ui/vehicles]]. Sensor panes: generic chrome — title, one plate, blurb. Titles match look names [[ui/sensors]]. Pulser, Counter, Day sensor, Traffic light panes. Advanced sensors is a research card, not a `CatalogEntry`. Quad / tractor / trailer are hangar-buys, not almanac SKUs.

SKU panes stay generic / crop / tree / pipe.

## Product plates

Reuse existing faces. No new SVG. `Pane` / `CropPane` / `TreePane` take `done`: `fermentation` `grinder` `preservatives` from `world.done.has('unlock-fermentation' | 'unlock-grinder' | 'unlock-preservatives')`. Not a `jam` boolean.

Fruit face + plant/tree prop always. Extra plates after that row is in `done`. Same `flex gap-3` row, `flex-wrap`. Grape four plates (fruit, plant, jam, wine) wrap in that row. No new chrome. Plate is the existing `h-20 w-20` `bg-dirt-dark` face, no caption.

| pane | extra | face | gate |
|---|---|---|---|
| potato CropPane | vodka | `{ kind: 'spirit'; spirit: 'vodka' }` | `fermentation` |
| wheat CropPane | beer | `{ kind: 'spirit'; spirit: 'beer' }` | `fermentation` |
| grape CropPane | jam, then wine | jam grape; `{ kind: 'cask'; cask: 'wine' }` | `preservatives` / `fermentation` |
| raspberry CropPane | jam | jam raspberry | `preservatives` |
| tomato CropPane | jam **Ketchup** | jam tomato | `preservatives` |
| apple TreePane | cider | `{ kind: 'cask'; cask: 'cider' }` | `fermentation` |
| apricot TreePane | jam | jam apricot | `preservatives` |
| cherry TreePane | jam | jam cherry | `preservatives` |
| olive TreePane | oil | `{ kind: 'oil' }` | `grinder` |

Grape: jam and wine may both show. Wheat: beer, not flour. Apple: cider, not jam. Apricot / cherry: jam, no brandy plate. Illegal: vanilla CropPane product plate. Illegal: flour plate. Illegal: olive on Seeds.

## Shape

`CatalogEntry` stays for SKUs only. Game concepts are not `CatalogEntry`. Overview is not `CatalogEntry`. No fake `Face`.

`AlmanacTab` / `ConceptId` / `AlmanacNav` / `ListRow` — `src/game/ui/almanac.tsx`. Overview id is `'overview'` (tab-scoped).

Concept ids: `rarity` `freshness` `happiness` `day` `market` `skills` `family` `research` `automation`. Labels: Rarity, Freshness, Happiness, Day & Night, Market, Skills, Family, Research, Automation.

Left-list: SKU rows keep `itemInner`. Overview and concept rows: title only, no icon plate.

Right pane: SKU → existing Pane. Concept → concept pane. Overview → Overview pane.

Underline tab click (no link): select that tab and its first list row. First ids: seeds `overview`, trees `apple`, utility `shovel`, sensors `overview`, automation `overview`, water `pumpjack`, building `fence`, concepts `rarity`. `AlmanacLink` sets both `tab` and `id`. Deep-link must land the pane, not only the tab. A link’s `{ tab, id }` is a pair that exists on that tab’s list. `{ tab: 'seeds' | 'sensors' | 'automation', id: 'overview' }` is legal. `{ tab: 'trees' | 'utility' | 'water' | 'building' | 'concepts', id: 'overview' }` is not.

## AlmanacLink

In-almanac navigation only. Not a `Btn`. Not Press Start. Not external URLs. Not `<a href>`.

`AlmanacLink({ to: AlmanacNav; children })`. Token `dirt`. Underline always. Hover `dirt-dark`. Size matches surrounding copy.

Click: `setTab(to.tab); setId(to.id)`. Selecting a link switches the top tab and the left list row.

Link concept names, Overview on the three tabs that have it, and a few example SKUs when a player needs a doorway — never a full roster. Link **Market** not stall.

## Copy law

Every value is qualified: subject + amount + unit/noun + where it applies. “Uncommon fruit of the same crop sells for a quarter more money at the Market than Common fruit.” “Rare vanilla fruit sells for three times the Common vanilla price at the Market.” Happiness going to empty. Freshness going to empty.

Undefined words are illegal unless a natural farming word, or this page (or a linked page) has already defined them.

**Recipe** is defined by [[ui/recipe]] and heads the Automation recipe block.

Ban in player strings unless defined in-page: gem, pip, grade (except Rarity, first sentence: grade = Common / Uncommon / Rare / Heirloom), overlay, HUD, ribbon, dock, SKU, stall, rolled, tick, recap (define it: the end-of-day summary), stipend (say daily pay). **Build** is ok as “the Build menu.”

**“gem” is banned.** The colored `rarityInner` mark may still draw on the Rarity page. First use: “Uncommon, Rare, and Heirloom fruit show a small colored mark: green, blue, or gold. Common fruit has none.” After that, “the mark.”

Natural farmer words need no glossary. Game systems get a first-sentence definition on their own page.

Still forbidden: stall, rolled, RNG, water lives, spoils soonest, SKU dumps, Cosmic Purple lists.

Coin `<Coin />` for money amounts. Four rarities only.

## Overview

Help page. Same chrome as Game concepts. Title = list label **Overview**. No SKU plate. Short paragraphs. Not `CatalogEntry`.

A page is good iff the reader can answer: why do I need this, what can I use it for, what do I get from it.

Forbidden on Overview: item-by-item link list of that tab’s rows; research-gated “after X you can”; full listing of crops / machines / sensors / variants; “See also” dump of every SKU title.

Doorway links: a few named concepts or one example SKU, not a roster. Seeds Overview may link Rarity / Happiness / Freshness / Market. Sensors Overview may link Automation concept and one example (Lever or Water sensor). Automation Overview may link Market / Research / Sensors Overview.

Copy lives in `src/game/ui/almanac.tsx`. Do not paste it here. Wrap the marked names in `AlmanacLink`.

## Game concepts

Player help center. Same left-list + right-pane chrome as SKU entries. No SKU plate. Qualified sentences. Coin for money.

Copy lives in `src/game/ui/almanac.tsx`. Wrap marked names in `AlmanacLink`.

Forbidden: Overview as a link-list of the tab’s SKUs. Research-gated walkthroughs. Full listing of items or variants. Unqualified stubs. Developer words: gem, pip, rolled, RNG, tick, DAG, node, SKU, dump, unitSale, seam, Cmd, hash, overlay, HUD, ribbon, dock. “Stall” — in game it is **Market**.

Automation here is the **concept page**, not a second copy of the SKU tab.

Rarity is the grade of fruit and seed: Common / Uncommon / Rare / Heirloom. Four grades only. Bio farmer is a skill, not a grade. Common: no `rarityInner`. Uncommon / Rare / Heirloom: `rarityInner(rarity)` fills uncommon `leaf`, rare `water`, heirloom `ripe`. Same fills as `qualityPip`. Copy never says gem or pip.

## TreePane

Same shell as CropPane: rarity tabs, fruit face + 24×48 prop, then `Stat` rows with leaf meters 1–5. Meters compare among the four trees (`TREE_IDS`: apple apricot olive cherry). No lemon. Rarity tabs preview dropped fruit only — the tree has no rarity. Name is `cropVariety(id, preview)`. Prop cycles `grow` / `unripe` / `ripe`. Tree prop sits on `bg-grass`. Fruit face stays `bg-dirt-dark`. Extra plates: Product plates.

Line under desc: **Drops on the grass. {TREE_YIELD_DAYS} days at ×{TREE_YIELD_MUL}, then ×{TREE_OFF_MUL}.** Does not say yielding / resting. Look / inspect words are on-season / off-season — [[ui/inspect]].

Rows: Juvenile (`juvenileSeconds`), Fruit every (`1 / fruitSeconds`), Sell (`CROPS.sale`), Freshness (`rotSeconds`). No Water. No Yield. No Drink. No Fertilizer. No Seed price. Numbers: [[mechanics/trees]].

## Pipe

Water systems list row `pipe` only. Valve and the sprinklers stay their own static rows.

Same generic pane chrome as other non-crop entries: title, one plate, blurb. The plate is not `itemInner({ kind: 'pipe' })`.

Cycle join art the way CropPane cycles `sprout` / `grow` / `ripe`: `useCycle(PIPE_JOINS.length)`, `CYCLE_MS` 800 — [[ui/recipe]]. Order, rot 0: `PIPE_STUB` `PIPE_I` `PIPE_L` `PIPE_T` `PIPE_X`. Not `pipe-source`. Not `pipe-valve`.

Pipe, crop and tree panes share `useCycle`. One cadence, one hook. No local `setInterval`.

The six machine ids (`mill` `jam` `still` `barrel` `grinder` `compost-box`) add a **Recipes** block under the blurb, `size="md"` — [[ui/recipe]].

Assumption: Haggling knocks $1 per rank off utility and automation shop goods, min $1. Almanac Day & Night / Skills strings still describe per-member +1; live is shared `World.points`.
