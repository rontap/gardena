# Almanac

Centered overlay. Title **Almanac**. Left list, right pane. Window is a definite height so inner `flex-1 overflow-y-auto` scrolls. Chrome is a column; body is `scroll-pane`.

Solo overlay pause: [[ui/hud]].

Scroll chain: Tabs.Root fills; Tabs.List shrinks; list+pane row fills; left list scrolls; right pane scrolls. `scroll-pane` — [[ui/type]].

Eight underline tabs. Wrap the tab list so a label never splits. Do not shrink type.

| tab id | label | list |
|---|---|---|
| `seeds` | Seeds | **Overview**, then carrot potato wheat tomato raspberry grape vanilla sugar-cane soil weed grass-seeds grass rotten dead |
| `trees` | Trees | apple apricot olive cherry |
| `utility` | Utility | shovel better-shovel pickaxe better-pickaxe axe bucket large-bucket fertilizer synth-fertilizer weed-spray compost sugar wood ash rotary-shovel diamond-pickaxe |
| `sensors` | Sensors | **Overview**, then lever button lamp or and not pulser counter sensor-water sensor-fert sensor-harvest water-system vehicle-detector traffic-light sensor-day |
| `automation` | Automation | **Overview**, then chest grinder compost-box mill furnace still barrel jam freezer station hangar silo-seed silo-produce silo-spray |
| `water` | Water systems | pumpjack well rain-tank tap pipe valve sprinkler sprinkler-vert sprinkler-large |
| `building` | Building | fence tile-cobble tile-brick tile-paved |
| `concepts` | Game concepts | Variety, Quality, Freshness, Happiness, Day & Night, Market, Skills, Family, Research, Automation |

Overview on **Seeds**, **Sensors**, **Automation** only. First left-list row, label **Overview**, no icon. Tab-scoped id `'overview'`. Tab click on those three lands Overview.

Trees, Utility, Water systems, Building, Game concepts: **no** Overview row. Hangar + silos stay on Automation. Station stays on Automation. Game concepts: no SKU rows.

Building stays fence + tiles. Apple is not on Seeds. Olive is not on Seeds. No watermelon row.

Crop and Tree panes carry `CROPS.desc` under the name.

## Variety row

CropPane / TreePane: no ladder tabs. The pane grows a Variety row — one cell per `VARIETIES[crop]`, in list order. Grape and apricot fill four. Carrot, vanilla, sugar-cane fill one. Do not pad empty slots.

Each cell:

| slot | content |
|---|---|
| face | fruit face for that Variety, `h-20 w-20` `bg-dirt-dark`, no caption |
| name | Variety name from `names` |
| paths | **Preserving** / **Fresh** / **Alcohol** each with its `Rating` 1..5. Omit a path at `'none'`. Never a bare number without the path |
| description | one line, the real thing that Variety is known for. Bintje: **A Dutch potato grown for frying and for spirit.** Full set `almanac_variety_desc_*` |

Click selects. Default `'base'`. Selected cell `bg-dirt`. Stats, plant/tree prop preview, and Ingredients follow the selection.

Fruit row above the Variety row stays fruit face + plant/tree prop of the **selected** Variety only. Same `flex gap-3` `flex-wrap`. Plant art cycles `sprout` / `grow` / ripe-group of that Variety. Tree prop cycles `trunk` / `grow` / `unripe` / `ripe`; Variety group on `unripe` / `ripe`. [[architecture/view]]

Crop stats: Grow time, Drink, Water range, Fertilizer, Sell, Seed price, Freshness. Leaf meter 1–5. Coin on Sell and Seed price. Crop Freshness stat row stays plain text — not an AlmanacLink. Numbers: `statsOf(crop, variety, 0, [])` so Sell is `CROPS.sale × RATING_SALE[use.fresh]` at Quality 0. Seed price is the pack of `'base'` only.

Sugar-cane is a CropPane. Product face is cane fruit (`fruit-sugar-cane`), not the sugar bag. Line under desc: **Mill 5 cane into 2 L sugar.** Vanilla: no CropPane mill line. Extract, flour, brandy, mill sugar sit in Ingredients. [[ui/recipe]]

Olive is `TreeId`: TreePane only.

Utility `sugar`: liters bag face. Hangar and field silo panes [[ui/vehicles]]. Sensor panes: generic chrome — title, one plate, blurb. Titles match look names [[ui/sensors]]. Pulser, Counter, Day sensor, Traffic light panes. Advanced sensors is a research card, not a `CatalogEntry`. Quad / tractor / trailer are hangar-buys, not almanac SKUs.

SKU panes stay generic / crop / tree / pipe. Station pane is generic Automation chrome — title, one plate, blurb. No Recipes block.

## Plate fills

Reuse existing faces. No new SVG. Plate is `h-20 w-20`, no caption.

| plate | fill |
|---|---|
| Crop fruit face | `bg-dirt-dark` |
| Crop plant prop | `bg-dirt-dark` |
| Tree fruit face | `bg-dirt-dark` |
| Tree 24×48 prop | `bg-grass` |
| Sensors / Automation / Water systems SKU — buildings, pipe | `bg-grass` |
| Utility / Building / Seeds non-crop SKU | `bg-dirt-dark` |
| Machine goods — sugar, spirit, cask, jam, oil, flour, extract, ash | `bg-water` |

Utility sugar is a machine good: `bg-water`. Ash is a machine good: `bg-water`. Compost, wood, and tools stay `bg-dirt-dark`. Fence and tiles stay Building, `bg-dirt-dark`. Titles **Axe** **Wood** **Ash** **Furnace**. Station plate `bg-grass`.

`Pane` / `CropPane` / `TreePane` take `done`: `fermentation` `grinder` `preservatives` `furnace` from `world.done.has('unlock-fermentation' | 'unlock-grinder' | 'unlock-preservatives' | 'unlock-furnace')`. Not a `jam` boolean. Generic `Pane` takes the current tab so Sensors / Automation / Water systems fill `bg-grass`.

## Ingredients

Hardcoded product plates do not sit on the fruit row. Fruit row is fruit face + plant/tree prop only.

`recipesUsing(face)` in `sim/recipe.ts` — [[mechanics/machines]] `machines.recipes-using`. CropPane / TreePane pass that Variety's fruit face (`crop` + `variety`). `recipesUsing` matches a `one` input on crop + Variety. UI keeps a recipe whose machine unlock is in `done`: mill `unlock-grinder`, jam `unlock-preservatives`, still / barrel `unlock-fermentation`, furnace `unlock-furnace`. Empty → no section. Fruit furnace rows are `any` — skipped. A path at `'none'` has no `one` row, so it does not appear.

Section under the stats, last in the pane. `mt-3 border-t border-ink/20 pt-3` divider above it — same rule as [[ui/recap]] / [[ui/lens]] section breaks. Heading **Recipes** — reused key `m.hud_recipes()`, same word as the Automation recipe block. Plates: yield face, `h-20 w-20` `bg-water`, same wrap row. No caption. Derived, not a crop table. Named jam, mill good, spirit, cask show when the recipe matches. No hardcoded plate list.

Hover a plate: Overlay `aside` [[ui/callout-hover]] `right`. Title `faceName` of the yield. Body: `Coin` of baked `unitSale` at Quality 0 × that path's `RATING_SALE`, then that recipe `Recipes` `{ kind: 'one'; recipe }` `sm` — [[ui/recipe]]. Leave clears. Plates take pointer events; recipe rows do not.

Illegal: extra product plates on the fruit row. Illegal: olive on Seeds. Illegal: a Variety row that is a ladder.

## Shape

`CatalogEntry` stays for SKUs only. Game concepts are not `CatalogEntry`. Overview is not `CatalogEntry`. No fake `Face`.

`AlmanacTab` / `ConceptId` / `AlmanacNav` / `ListRow` — `src/game/ui/almanac.tsx`. Overview id is `'overview'` (tab-scoped).

```
ConceptId =
  | 'variety'
  | 'quality'
  | 'freshness'
  | 'happiness'
  | 'day'
  | 'market'
  | 'skills'
  | 'family'
  | 'research'
  | 'automation'
```

Labels: Variety, Quality, Freshness, Happiness, Day & Night, Market, Skills, Family, Research, Automation.

Left-list: SKU rows keep `itemInner`. Overview and concept rows: title only, no icon plate.

Right pane: SKU → existing Pane. Concept → concept pane. Overview → Overview pane.

Almanac Overlay passes `aside` for the Ingredients callout. Same `CalloutHover` `right` as Market.

Underline tab click (no link): select that tab and its first list row. First ids: seeds `overview`, trees `apple`, utility `shovel`, sensors `overview`, automation `overview`, water `pumpjack`, building `fence`, concepts `variety`. `AlmanacLink` sets both `tab` and `id`. Deep-link must land the pane, not only the tab. A link’s `{ tab, id }` is a pair that exists on that tab’s list. `{ tab: 'seeds' | 'sensors' | 'automation', id: 'overview' }` is legal. `{ tab: 'trees' | 'utility' | 'water' | 'building' | 'concepts', id: 'overview' }` is not.

## AlmanacLink

In-almanac navigation only. Not a `Btn`. Not Press Start. Not external URLs. Not `<a href>`.

`AlmanacLink({ to: AlmanacNav; children })`. Token `dirt`. Underline always. Hover `dirt-dark`. Size matches surrounding copy.

Click: `setTab(to.tab); setId(to.id)`. Selecting a link switches the top tab and the left list row.

Link concept names, Overview on the three tabs that have it, and a few example SKUs when a player needs a doorway — never a full roster. Link **Market** not stall.

## Copy law

Every value is qualified: subject + amount + unit/noun + where it applies. Quality is a percent of how the plant was treated. Variety is what the plant is. A path rating is **Preserving** / **Fresh** / **Alcohol** plus the number.

Undefined words are illegal unless a natural farming word, or this page (or a linked page) has already defined them.

**Recipe** is defined by [[ui/recipe]] and heads the Automation recipe block. Crop / tree Ingredients heading reuses that word: **Recipes**.

Ban in player strings unless defined in-page: gem, pip, overlay, HUD, ribbon, dock, SKU, stall, rolled, tick, recap (define it: the end-of-day summary), stipend (say daily pay). **Build** is ok as “the Build menu.” `tier` is vault-only.

Natural farmer words need no glossary. Game systems get a first-sentence definition on their own page.

Still forbidden: stall, rolled, RNG, water lives, spoils soonest, SKU dumps.

Coin `<Coin />` for money amounts.

Variety and Quality concept copy, Variety descriptions, Seeds Overview links to those two: `almanac_variety_p1` `almanac_quality_p1` `almanac_seeds_p2_*` `almanac_seeds_p3_*` `almanac_variety_desc_*`.

## Overview

Help page. Same chrome as Game concepts. Title = list label **Overview**. No SKU plate. Short paragraphs. Not `CatalogEntry`.

A page is good iff the reader can answer: why do I need this, what can I use it for, what do I get from it.

Forbidden on Overview: item-by-item link list of that tab’s rows; research-gated “after X you can”; full listing of crops / machines / sensors / varieties; “See also” dump of every SKU title.

Doorway links: a few named concepts or one example SKU, not a roster. Seeds Overview may link Variety / Quality / Happiness / Freshness / Market. Sensors Overview may link Automation concept and one example (Lever or Water sensor). Automation Overview may link Market / Research / Sensors Overview.

Copy lives in `src/game/ui/almanac.tsx`. Do not paste it here. Wrap the marked names in `AlmanacLink`.

## Game concepts

Player help center. Same left-list + right-pane chrome as SKU entries. No SKU plate. Qualified sentences. Coin for money.

Copy lives in `src/game/ui/almanac.tsx`. Wrap marked names in `AlmanacLink`.

Forbidden: Overview as a link-list of the tab’s SKUs. Research-gated walkthroughs. Full listing of items or varieties. Unqualified stubs. Developer words: gem, pip, rolled, RNG, tick, DAG, node, SKU, dump, unitSale, seam, Cmd, hash, overlay, HUD, ribbon, dock. “Stall” — in game it is **Market**.

Automation here is the **concept page**, not a second copy of the SKU tab.

**Variety** is what the plant is. Identity, not a ladder. Two Varieties of the same crop are siblings. Copy: **Variety is what the plant is. Potato and Bintje are two Varieties of potato — siblings, not steps. Each Variety carries Preserving, Fresh, and Alcohol, each with a number from 1 to 5, or no number if that crop has no such path. Preserving is jam and the mill. Fresh is fruit sold as it is. Alcohol is the Pot still and the Barrel. The Market pays more for a high number on the path of the good you made.**

**Quality** is how well the plant was treated. A percent. Sale, seed carry, stack average. Bought seed starts at nothing. Copy: **Quality is how well the plant was treated, shown as a percent. The Market pays more for higher Quality fruit of the same Variety. A seed you shovel keeps that plant's Quality, and a stack of the same Variety averages Quality. Seed you buy starts at 0%. Happiness while the plant grows is the live care; Quality is set when the fruit ripens. Tree fruit is 0%.**

## TreePane

Same shell as CropPane: Variety row, fruit face + 24×48 prop, then `Stat` rows with leaf meters 1–5. Meters compare among the four trees (`TREE_IDS`: apple apricot olive cherry). No lemon. Variety row previews dropped fruit of that Variety — the tree's growth stage is not a Variety. Name is the Variety. Prop cycles `trunk` / `grow` / `unripe` / `ripe`. Tree prop sits on `bg-grass`. Fruit face stays `bg-dirt-dark`. Ingredients: same section as CropPane, `recipesUsing` on that Variety's fruit.

Line under desc: **Drops on the grass. {TREE_YIELD_DAYS} days at ×{TREE_YIELD_MUL}, then ×{TREE_OFF_MUL}.** Does not say yielding / resting. Look / inspect words are on-season / off-season — [[ui/inspect]].

Rows: Juvenile (`juvenileSeconds`), Fruit every (`1 / fruitSeconds`), Sell (`CROPS.sale × RATING_SALE[use.fresh]` at Quality 0), Freshness (`rotSeconds`). No Water. No Yield. No Drink. No Fertilizer. No Seed price. Numbers: [[mechanics/trees]]. Tree fruit Quality is 0.

## Pipe

Water systems list row `pipe` only. Valve and the sprinklers stay their own static rows.

Same generic pane chrome as other non-crop entries: title, one plate, blurb. The plate is not `itemInner({ kind: 'pipe' })`.

Cycle join art the way CropPane cycles `sprout` / `grow` / ripe: `useCycle(PIPE_JOINS.length)`, `CYCLE_MS` 800 — [[ui/recipe]]. Order, rot 0: `PIPE_STUB` `PIPE_I` `PIPE_L` `PIPE_T` `PIPE_X`. Not `pipe-source`. Not `pipe-valve`.

Pipe, crop and tree panes share `useCycle`. One cadence, one hook. No local `setInterval`. Variety row does not cycle.

The seven machine ids (`mill` `jam` `still` `barrel` `grinder` `compost-box` `furnace`) add a **Recipes** block under the blurb, `size="md"` — [[ui/recipe]]. Station does not.

Assumption: Haggling knocks $1 per owned haggling off utility and automation shop goods, min $1. Almanac Day & Night / Skills strings still describe per-member +1; live is shared `World.points`.
