# Almanac

Centered overlay. Title **Almanac**. Left list, right pane. Do not match Family `w-[58rem]`.

Almanac Window **definite** size: `h-[min(48rem,calc(100vh-6rem))] w-[48rem]`. Not `max-h`. Overlay `className` is only that pair. `max-h` does not give Chrome a definite height, so inner `flex-1 overflow-y-auto` never scrolls.

Chrome already `flex flex-col overflow-hidden`. Window body stays `scroll-pane relative z-20 min-h-0 flex-1 overflow-y-auto px-4 py-3` and is `flex flex-col` so a `flex-1` child can shrink.

Scroll chain:

- Tabs.Root `flex min-h-0 flex-1 flex-col`
- Tabs.List `shrink-0` wrap (below)
- list+pane row `min-h-0 flex-1` (existing `relative z-20 flex mx-[-0.75rem]`)
- left list `w-44 shrink-0 scroll-pane min-h-0 overflow-y-auto`
- right pane `min-h-0 min-w-0 flex-1 scroll-pane overflow-y-auto p-4`

`scroll-pane` is `overflow-y-auto min-h-0` — 6px, `dirt` thumb, `ink/12` track [[ui/type]].

Eight underline tabs. Wrap `Tabs.List`: `flex flex-wrap gap-1 border-b border-ink/20 bg-house px-4`. Keep `tabTriggerClass` (`whitespace-nowrap`) so a label never splits. Do not `overflow-x-auto`. Do not shrink type.

Tab order and lists:

| tab id | label | list |
|---|---|---|
| `seeds` | Seeds | **Overview**, then carrot potato wheat tomato raspberry watermelon olive grape vanilla sugar-cane soil weed grass-seeds grass rotten dead |
| `trees` | Trees | apple apricot lemon cherry |
| `utility` | Utility | shovel better-shovel pickaxe better-pickaxe bucket large-bucket box box-large fertilizer synth-fertilizer weed-spray compost sugar rotary-shovel diamond-pickaxe |
| `sensors` | Sensors | **Overview**, then lever button lamp or and not sensor-water sensor-fert sensor-harvest water-system vehicle-detector |
| `automation` | Automation | **Overview**, then chest grinder compost-box mill still barrel jam freezer hangar silo-seed silo-spray silo-produce |
| `water` | Water systems | pumpjack well rain-tank tap pipe valve smart-valve sprinkler sprinkler-vert sprinkler-large |
| `building` | Building | fence tile-cobble tile-brick tile-paved |
| `concepts` | Game concepts | Rarity, Freshness, Happiness, Day & Night, Market, Skills, Family, Research, Automation |

Overview on **Seeds**, **Sensors**, **Automation** only. First left-list row, label **Overview**, no icon. Tab-scoped id `'overview'`. Tab click on those three lands Overview.

Trees, Utility, Water systems, Building, Game concepts: **no** Overview row, pane, or id. Hangar + silos stay on Automation. Game concepts: no SKU rows.

Building stays fence + tiles. Seeds / Trees / Utility SKU rows unchanged. Apple is not on Seeds.

Crop and Tree panes carry `CROPS.desc` under the name: one plain-language line on how the plant behaves, no numbers. It is also the crop's `CatalogEntry.blurb`.

Crop panes: rarity tabs **Common** **Uncommon** **Rare** **Heirloom**. Last tab is **Heirloom**. Preview swaps fruit face, plant art, and numbers.

Crop stats: Grow time, Drink, Water range, Fertilizer, Sell, Seed price, Freshness. Leaf meter 1–5. Coin on Sell and Seed price. Crop Freshness stat row stays plain text — not an AlmanacLink.

Sugar-cane is a CropPane. Product face is cane fruit (`fruit-sugar-cane`), not the sugar bag. Sell is crop fruit `statsOf`. Line under desc: **Mill 5 cane into 2 L sugar.**

`unlock-preservatives` done: third `h-20 w-20` `bg-dirt-dark` plate on grape raspberry tomato CropPanes and apple apricot cherry TreePanes. Jam jar; tomato **Ketchup**. Hidden until that research is done.

Utility `sugar`: liters bag face. Hangar and field silo panes [[ui/vehicles]]. Sensor / smart-valve panes: same generic chrome as other non-crop entries — title, one `h-20 w-20` `bg-dirt-dark` plate, blurb. Titles match look names [[ui/sensors]]. No germ. No weather. No new sprinkler pane. No Quad / tractor / trailer SKU pane.

SKU panes stay generic / crop / tree / pipe.

## Shape

`CatalogEntry` stays for SKUs only. Game concepts are not `CatalogEntry`. Overview is not `CatalogEntry`. No fake `Face`.

```
AlmanacTab =
  | 'seeds'
  | 'trees'
  | 'utility'
  | 'sensors'
  | 'automation'
  | 'water'
  | 'building'
  | 'concepts'

ConceptId =
  | 'rarity'
  | 'freshness'
  | 'happiness'
  | 'day'
  | 'market'
  | 'skills'
  | 'family'
  | 'research'
  | 'automation'

AlmanacNav = { tab: AlmanacTab; id: string }

ListRow =
  | { kind: 'overview' }
  | { kind: 'concept'; id: ConceptId }
  | { kind: 'sku'; id: string }
```

Overview id is `'overview'` (tab-scoped). `{ kind: 'overview' }` has no extra id field. `rowId` → `'overview'`.

Concept ids and labels:

| id | label |
|---|---|
| `rarity` | Rarity |
| `freshness` | Freshness |
| `happiness` | Happiness |
| `day` | Day & Night |
| `market` | Market |
| `skills` | Skills |
| `family` | Family |
| `research` | Research |
| `automation` | Automation |

SKU `id` is the catalog id (same as today).

Left-list chrome is the same button as now (`text-lg`, selected `bg-dirt text-house`). SKU rows keep the `h-4 w-4` `itemInner`. Overview and concept rows: title only, no icon plate, no empty spacer icon.

Right pane: SKU → existing Pane. Concept → concept pane. Overview → Overview pane (below).

Underline tab click (no link): select that tab and its first list row (that tab’s first id). First ids: seeds `overview`, trees `apple`, utility `shovel`, sensors `overview`, automation `overview`, water `pumpjack`, building `fence`, concepts `rarity`. `AlmanacLink` sets both `tab` and `id`. Deep-link must land the pane, not only the tab. A link’s `{ tab, id }` is a pair that exists on that tab’s list — no recovery if it does not. `{ tab: 'seeds' | 'sensors' | 'automation', id: 'overview' }` is legal. `{ tab: 'trees' | 'utility' | 'water' | 'building' | 'concepts', id: 'overview' }` is not a pair.

## AlmanacLink

In-almanac navigation only. Not a `Btn`. Not Press Start. Not external URLs. Not `<a href>`.

```
AlmanacLink({ to: AlmanacNav; children })
```

Token `dirt` (`#8a5a32`). Underline always. Hover `dirt-dark`. Body face Nunito. `inline`. `text-sm` or `text-base` matching surrounding copy — pane body is `text-base`, so links in these panes are `text-base`.

```
inline cursor-pointer text-dirt underline decoration-dirt hover:text-dirt-dark hover:decoration-dirt-dark
```

Click: `setTab(to.tab); setId(to.id)`. Selecting a link switches the top tab and the left list row.

Link concept names, Overview on the three tabs that have it, and a few example SKUs when a player needs a doorway — never a full roster. Link **Market** not stall.

## Copy law

Every value is qualified: subject + amount + unit/noun + where it applies.

Illegal: “a quarter more at the Market.” Legal: “Uncommon fruit of the same crop sells for a quarter more money at the Market than Common fruit.”

Illegal: “twice the usual price” with no fruit / crop / Market. Illegal: “vanilla is triple.” Legal: “Rare vanilla fruit sells for three times the Common vanilla price at the Market.”

Illegal: “a little faster in the bed.” Legal: “the plant finishes growing a little sooner than Common of the same crop.”

Illegal: “fussier still about water and feed.” Legal: the plant needs a tighter water and feed range than the named rarity.

Illegal: “hits nothing.” Happiness going to empty. Freshness going to empty.

Undefined words are illegal unless a natural farming word, or this page (or a linked page) has already defined them.

Ban in player strings unless defined in-page: gem, pip, grade (except Rarity, first sentence: grade = Common / Uncommon / Rare / Heirloom), overlay, HUD, ribbon, dock, SKU, stall, rolled, tick, recap (define it: the end-of-day summary), stipend (say daily pay). **Build** is ok as “the Build menu.”

**“gem” is banned.** Do not write “has no gem.” The colored `rarityInner` mark may still draw on the Rarity page. Copy talks in farmer words. First use: “Uncommon, Rare, and Heirloom fruit show a small colored mark: green, blue, or gold. Common fruit has none.” After that, “the mark.” Never “gem.”

Natural farmer words (soil, seed, fruit, water, feed, harvest, shovel, plant, Market, money) need no glossary. Game systems (Happiness, Freshness, Rarity, Skills, Family, Research, Automation) get a first-sentence definition on their own page.

Still forbidden: stall, rolled, RNG, water lives, spoils soonest, SKU dumps, Cosmic Purple lists.

Coin `<Coin />` for money amounts. Four rarities only.

## Overview

Help page. Same chrome as Game concepts: title `text-lg` = list label **Overview**. Body `text-base leading-relaxed`. No SKU plate. Short paragraphs. Not `CatalogEntry`.

A page is good iff the reader can answer: why do I need this, what can I use it for, what do I get from it.

Forbidden on Overview:

- item-by-item link list of that tab’s rows
- research-gated “after X you can”
- full listing of crops / machines / sensors / variants
- “See also” dump of every SKU title

Doorway links: a few named concepts or one example SKU, not a roster. Seeds Overview may link Rarity / Happiness / Freshness / Market. Sensors Overview may link Automation concept and one example (Lever or Water sensor). Automation Overview may link Market / Research / Sensors Overview.

Paste the strings below. Wrap the marked names in `AlmanacLink`.

### Seeds Overview

```
Seeds are what you sow in a tilled bed so a plant can grow. You need them to raise fruit you sell at the Market, and to keep a crop going after harvest.

Buy a pack of five in the shop, or shovel a growing or ripe plant for one seed. That seed keeps the plant's rarity. Sow it on empty soil, then water and feed the plant until it is ripe. Harvest ripe fruit empty-handed. Shovel Rotten produce or a Dead plant and you get no seed back.

Fruit of the same crop is not all worth the same money. Rarity and Freshness change what the Market pays for that fruit. Happiness is how the plant is doing while it grows — happier plants more often ripen as a better rarity.

See Rarity, Happiness, Freshness, and Market.
```

Links: **Market** → `concepts:market`. **rarity** / **Rarity** / **better rarity** → `concepts:rarity`. **Freshness** → `concepts:freshness`. **Happiness** → `concepts:happiness`.

### Sensors Overview

```
Sensors send on or off through a wire so you do not have to stand at the bed. You need them to watch water, harvest, and machines, then let a wire act while you garden.

A Lever is a switch you flip by hand. Its output is on or off. Run a wire from that output to pause a mill or stop a sprinkler.

Automation is the machines and stores those wires can run. Open that concept for what the machines are for.

See Automation.
```

Links: **Lever** → `sensors:lever`. **Automation** → `concepts:automation`. One example SKU only (Lever). Do not roster the Sensors list.

### Automation Overview

```
Automation is machines and stores so you walk less. You need it so plants stay watered, machines keep working, and fruit waits until you take it to the Market.

A Mill is one machine: it turns fruit into goods the Market pays money for. You get those goods, a place to hold a haul, and less walking between beds. The Freezer keeps fruit from losing freshness.

Research is how new machines show up in the shop and the Build menu. Sensors Overview covers the wires that can pause a mill or a sprinkler.

See Market, Research, and Sensors Overview.
```

Links: **Market** → `concepts:market`. **Mill** → `automation:mill`. **Research** → `concepts:research`. **Sensors Overview** → `sensors:overview`. One example SKU only (Mill). Do not roster the Automation list. Do not write “after {research}.”

## Game concepts

Player help center. Not a developer tool, not a catalogue, not a SKU dump.

Audience: new and returning players who open the Almanac to check, read, and understand.

A page is good iff the reader can answer: why do I need this, what can I use it for, what do I get from it.

Same left-list + right-pane chrome as SKU entries. Title `text-lg` = list label. Body `text-base leading-relaxed`. No SKU plate. Short paragraphs. Qualified sentences. Coin (`<Coin />`) for money.

Paste the strings below. Wrap the marked names in `AlmanacLink`.

Forbidden: Overview as a link-list of the tab’s SKUs. Research-gated walkthroughs. Full listing of items or variants. Unqualified stubs. Developer words: gem, pip, rolled, RNG, tick, DAG, node, SKU, dump, unitSale, seam, Cmd, hash, overlay, HUD, ribbon, dock. “Stall” — in game it is **Market**. “Water lives in tanks.” “Spoils soonest.” If a mechanic has no player word, describe the outcome.

Automation here is the **concept page**, not a second copy of the SKU tab. The SKU tab still exists. Concept page does not list machines.

### Rarity

Rarity is the grade of fruit and seed: **Common** **Uncommon** **Rare** **Heirloom**. Four grades only. Not five. Bio farmer is a skill, not a grade.

Each row: name + mark. Common: no `rarityInner`. Uncommon / Rare / Heirloom: `rarityInner(rarity)` — standalone mark, fills uncommon `leaf` `#6bc04a`, rare `water` `#3d7ea6`, heirloom `ripe` `#d4a017`. Same fills as `qualityPip`. Do not add SVG files. No crop-variety name lists. Copy never says gem. Copy never says pip.

Body:

```
Rarity is the grade of fruit and seed: Common, Uncommon, Rare, or Heirloom. Four grades only. Bio farmer is a skill, not a fifth grade.

Uncommon, Rare, and Heirloom fruit show a small colored mark: green, blue, or gold. Common fruit has none.

Common
Common fruit of that crop sells at the crop's ordinary price at the Market. The Common plant finishes growing in the time written on the crop. Ripe Common fruit stays fresh for the crop's freshness time. The Common plant uses the crop's usual water and feed range.

Uncommon
Uncommon fruit of the same crop sells for a quarter more money at the Market than Common fruit. The Uncommon plant finishes growing a little sooner than Common of the same crop. Ripe Uncommon fruit keeps as long as Common fruit of that crop. The Uncommon plant needs a slightly tighter water and feed range than Common of the same crop.

Rare
Rare fruit of the same crop sells for twice the Common fruit price at the Market. Rare vanilla fruit sells for three times the Common vanilla price at the Market. The Rare plant finishes growing sooner than Common of the same crop. Ripe Rare fruit loses freshness faster than Common fruit of that crop. The Rare plant needs a tighter water and feed range than Uncommon of the same crop.

Heirloom
Heirloom fruit of the same crop sells for three and a half times the Common fruit price at the Market. Heirloom vanilla fruit sells for six times the Common vanilla price at the Market. The Heirloom plant finishes growing at the Common pace of that crop. Ripe Heirloom fruit loses freshness faster than Common fruit of that crop. The Heirloom plant needs the tightest water and feed range of the four grades.

Seed you shovel off a plant keeps that plant's grade. Fruit that drops from a tree has its own grade — most Common, some Uncommon, few Rare, almost never Heirloom. The tree itself has no grade.

Happier plants more often ripen as a better grade. A plant below the middle of Happiness can ripen one grade lower than the seed you planted. A plant at or above the middle can ripen one grade higher than the seed you planted, and sometimes two grades higher than the seed you planted. Careful tending and the crop skills on Family help a happy plant ripen higher.

Shop packs of five seeds are Common unless you learned Trusted seed bank. Trusted seed bank is one of your skills on Family. Each rank, a shop pack of five seeds is 5% Uncommon, 1.2% Rare, or 0.2% Heirloom.

See Happiness, Skills, Freshness, and Market.
```

Links: **Market** → `concepts:market`. **Happiness** → `concepts:happiness`. **Skills**, **Careful tending**, **Trusted seed bank** → `concepts:skills` for the skill names; **Family** / **your skills on Family** / **the crop skills on Family** → `concepts:family`. **keeps as long as** / **loses freshness** / **freshness time** / **Freshness** → `concepts:freshness`.

### Freshness

```
Freshness is how much quality ripe fruit still has. You need it because the Market pays less money for fruit that has gone off.

Ripe fruit loses freshness while it sits on the plant. When freshness goes to empty, the plot becomes Rotten produce. Picked fruit keeps losing freshness in your hand, the house, a Chest, on the ground, and in a fruit box until you Sell all. A Freezer holds freshness still. Sugar does not lose freshness.

Above 80% freshness, the Market pays the full Market price for that fruit. Below 80% freshness, the money the Market pays for that fruit falls with its freshness. Still good for jam keeps 10% of the fruit's Market price as a floor at rank I, 20% at rank II, and 30% at rank III. Clearance sale pays <Coin n={1} /> for each fruit whose freshness has gone to empty.

Rare and Heirloom fruit lose freshness faster than Common fruit of the same crop. Uncommon fruit keeps as long as Common fruit of that crop.

See Rarity, Market, and Skills.
```

Links: **Rotten produce** → `seeds:rotten`. **Chest** → `automation:chest`. **Freezer** → `automation:freezer`. **Sell all** / **Market** → `concepts:market`. **Sugar** → `utility:sugar`. **Still good for jam**, **Clearance sale**, **Skills** → `concepts:skills`. **Rare**, **Heirloom**, **Common**, **Uncommon**, **Rarity** → `concepts:rarity`.

### Happiness

```
Happiness is how the plant is doing while it grows. Happiness does not set how fast the plant grows. Too little water, too much water, or too little feed all make the plant finish growing later than it would in the water and feed range written on that crop in this Almanac.

You need it because happier plants more often ripen as a better rarity, and a plant whose Happiness goes to empty while still growing can die.

A new plant starts in the middle of Happiness. Empty-handed, Careful tending lifts Happiness a short way toward full, once, before the plant is ripe. Good water and feed slowly raise Happiness. Too much water drains Happiness fastest, then too little water, then hungry for feed.

Too much water also slows growth, not only drains Happiness. Too little water slows growth and can wilt a growing plant to a Dead plant. If Happiness goes to empty while the plant is still growing: too much water drowns it into Rotten produce; too little water or no feed leaves a Dead plant. Ripe plants do not die of water or feed; they only lose freshness.

The crop skills on Family add a slightly higher chance the ripe fruit is one rarity above the seed when the plant is happy.

A Water sensor is one way to watch for wilt and overwater. See Skills and Rarity.
```

Links: **Careful tending**, **Skills** → `concepts:skills`. **the crop skills on Family** / **Family** → `concepts:family`. **Rotten produce** → `seeds:rotten`. **Dead plant** → `seeds:dead`. **lose freshness** → `concepts:freshness`. **better rarity** / **Rarity** → `concepts:rarity`. **Water sensor** → `sensors:sensor-water`. Do not link Fertilizer sensor.

### Day & Night

```
A day has four parts: sunrise, day, sunset, twilight. There is no night.

When twilight ends, the recap opens. The recap is the end-of-day summary: daily pay, tax, what you harvested and lost, research that finished. Play waits until you dismiss it. Dismissing starts the next day and gives You, Husband, and Daughter one skill point each.

The Market stays open through sunrise and day. At sunset it needs Open late. At twilight it needs Open 24/7. You can still drop goods off when it is closed; you cannot Sell all until it opens.

See Market, Family, and Skills.
```

Links: **Market** / **Sell all** → `concepts:market`. **Family** / **You**, **Husband**, **Daughter** → `concepts:family`. **Skills**, **Open late**, **Open 24/7**, **skill point** → `concepts:skills`. **research** → `concepts:research`.

### Market

```
The Market is where you sell fruit, sugar, and machine goods for money. Walk them to the market truck, then open Market. The picture is not a building you place.

Sell all pays one money total; Freshness and Rarity are already in that total. You can drop off while the Market is shut. You cannot Sell all until it opens.

Daughter skills on Family change the money and hours: each rank of Saleswoman raises the money the Market pays for every good by 2%. Each rank of Őstermelő raises the money the Market pays for Heirloom fruit, spirit, and wine by 5%. Each rank of Bio farmer raises the money the Market pays for organic fruit by 4%. Still good for jam keeps 10% of the fruit's Market price as a floor at rank I, 20% at rank II, and 30% at rank III. Clearance sale pays <Coin n={1} /> for each fruit whose freshness has gone to empty. Open late keeps Sell all legal at sunset. Open 24/7 keeps Sell all legal at twilight.

See Skills, Day & Night, Freshness, and Rarity.
```

Links: **Freshness** → `concepts:freshness`. **Rarity** / **Heirloom** → `concepts:rarity`. **Skills** / skill names → `concepts:skills`. **Family** → `concepts:family`. **Day & Night** → `concepts:day`. Do not AlmanacLink “market truck” as a SKU. Never **stall**.

### Skills

```
Skills are the three people's learned work. The farm is three people. You garden, your husband researches, your daughter runs the Market. Each end-of-day summary gives every member one skill point to spend on Family. The three skill choices stay until that person picks. Skill points do not move between people.

Your skills help the garden: happier plants, better rarity. Boots lets you walk across the farm faster than without that skill. Speedy research makes research jobs finish in less time than without that skill. Contracts makes utility and automation goods in the shop cost <Coin n={1} /> less money per rank of Contracts, never below <Coin n={1} />. Hers change the money the Market pays for fruit and goods, and the hours Sell all is allowed.

See Family, Research, Rarity, Freshness, Happiness, Market, and Day & Night.
```

Links: **Family** → `concepts:family`. **Research** → `concepts:research`. **Rarity** / **better rarity** → `concepts:rarity`. **Freshness** → `concepts:freshness`. **Happiness** / **happier plants** → `concepts:happiness`. **Market** / **Sell all** → `concepts:market`. **end-of-day summary** / **Day & Night** → `concepts:day`. **Boots**, **Speedy research**, **Contracts** stay on this page — names, not ids.

### Family

```
Family is You, Husband, and Daughter. Open Family from the same buttons as Almanac, Market, and Research. Left to right: You the Gardener, Husband on Research, Daughter on Market. You work the beds. He runs research. She minds the Market. Spend skill points on Skills here. This Almanac page does not replace Family.

See Skills and Research.
```

Links: **Skills** / **skill points** → `concepts:skills`. **Research** → `concepts:research`. **Market** → `concepts:market`.

### Research

```
Research is your husband's work so the farm can grow past the starter tools and crops. Open Research from the same buttons as Shop and the Build menu to pick a job.

He can run only one job at a time. Starting a job spends money up front. The job takes time in seconds while you garden. When it finishes, new things appear in the shop and the Build menu, and you can buy more land.

Research is how you get new crops, tools, water, machines, and sensors. Skills are not research — spend those on Family.

See Family, Skills, and Automation.
```

Links: **Family** → `concepts:family`. **Skills** → `concepts:skills`. **Automation** / **machines** → `concepts:automation`. Do not list research rows. Do not write “after {research} you can…”.

### Automation

```
Automation is machines, stores, and wires so you walk less. Plants stay watered. Machines keep working. A wire that is on can pause a Mill.

Machines turn fruit into goods you sell at the Market. A Chest or Freezer holds what you picked; the Freezer keeps fruit from losing freshness. A Fruit box carries a haul. The Vehicle hangar and field silos sit on the Automation list with those machines.

Wires and sensors send on or off. Open Sensors at Overview. A wire can pause a mill, stop a sprinkler, or open a Smart valve.

See Research, Market, Freshness, and Happiness.
```

Links: **Mill** → `automation:mill`. **Market** → `concepts:market`. **Chest** → `automation:chest`. **Freezer** → `automation:freezer`. **Fruit box** → `utility:box`. **Vehicle hangar** → `automation:hangar`. **Overview** / **Sensors at Overview** → `sensors:overview`. **Smart valve** → `water:smart-valve`. **Research** → `concepts:research`. **Freshness** / **losing freshness** → `concepts:freshness`. **Happiness** → `concepts:happiness`. Do not roster the Automation SKU tab. Do not write “after {research}.”

## TreePane

Same shell as CropPane: rarity tabs, fruit face + 24×48 prop, then `Stat` rows with leaf meters 1–5. Meters compare among the four trees. Rarity tabs preview dropped fruit only — the tree has no rarity. Name is `cropVariety(id, preview)`. Prop cycles `grow` / `unripe` / `ripe`. Tree prop sits on `bg-grass`. Fruit face stays `bg-dirt-dark`.

Line under desc: **Drops on the grass. {TREE_YIELD_DAYS} days at ×{TREE_YIELD_MUL}, then ×{TREE_OFF_MUL}.**

| row | meter | value |
|---|---|---|
| Juvenile | `juvenileSeconds` among trees | `{n} days` |
| Fruit every | `1 / fruitSeconds` among trees (more fruit → more pips) | `{n} days` |
| Sell | `CROPS.sale` among trees | Coin |
| Freshness | `rotSeconds` among trees | `{n} days` |

No Water. No Yield row. No Drink. No Fertilizer. No Seed price.

## Pipe

Water systems list row `pipe` only. Valve, smart valve, and the sprinklers stay their own static rows.

Same generic pane chrome as other non-crop entries: title, one `h-20 w-20` `bg-dirt-dark` plate (`h-16 w-16` svg, `viewBox="0 0 24 24"`), blurb. The plate is not `itemInner({ kind: 'pipe' })`.

Cycle join art the way CropPane cycles `sprout` / `grow` / `ripe`: `setInterval` 800ms, `(s + 1) % 5`. Order, rot 0:

`PIPE_STUB` `PIPE_I` `PIPE_L` `PIPE_T` `PIPE_X`

(`pipe-stub` `pipe-i` `pipe-l` `pipe-t` `pipe-x`). Not `pipe-source`. Not `pipe-valve`.

Assumption: Contracts knocks $1 per rank off utility and automation shop goods, min $1 (family.md), not 5%.
