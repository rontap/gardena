# Beta-6 UI

Supersedes [[ui/beta-5]] where this file names a replacement. See [[mechanics/beta-6]], [[architecture/beta-6]]. Place [[ui/place]]. Beta-5 chrome holds except below.

`$` dies. Coin (`ui-coin.svg`, token `ripe`) + number everywhere money showed `$`.

## HUD

Map full-bleed. Parent of map + HUD is `relative` full viewport. Ribbons and docks `pointer-events-auto` on controls. Map under stays live.

### Top ribbon (Civ)

Horizontal `Chrome` `absolute top-4 left-4 right-4 z-20` height ~2.5rem (`h-10`). Margin from screen edges.

Left→right: `ui-coin` + `Math.floor(world.money)` | **Day {n}** | phase icon `ui-phase-{phase}` (`sunrise` `day` `sunset` `twilight`) | research job bar if `job.kind === 'run'`.

No seconds. HUD does not read `remaining`. Night is recap, not a phase — no night icon.

Research bar hidden when `job.kind !== 'run'`. Text = `RESEARCH[id].name`.

### Left ribbon (Civ)

Vertical `Chrome` `absolute top-16 left-4 z-20` (~5.5rem, `w-22` / `w-24`). Margin from screen edges.

Rows: icon above, label below. Icons larger (`h-12 w-12`). Label `text-xs` centered.

Order: **Shop** **Research** **Market** **Lens** **Almanac**. Then if build cluster: divider, **Delete** **Rotate** **Cancel**.

Build trio visible iff `place` is `buy-pumpjack` `buy-well` `buy-pipe` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-chest` `buy-grinder`, or `place.kind === 'delete'`. Hidden ≠ disabled.

| button | act | selected |
|---|---|---|
| Shop / Research / Market / Almanac | panel toggle (beta-5) | that panel open |
| Lens | dropdown | menu open |
| Delete | `World.armDelete()` | `place.kind === 'delete'` |
| Rotate | `World.rotatePlace()` | never |
| Cancel | `cancelPlace` | never |

Cancel does not change lens. Shop close still: `cancelPlace`; if `lens === 'pipes'` then `off`. Leave `water` / `ripe` / `kind` / `rarity`. Right-click: `cancelPlace` only. Lens untouched. Esc: `cancelPlace`; if `pipes` then `off`; close panel. Leave rarity.

Main five + build three: `ui-btn-*.svg` groups `idle` / `hover` / `selected` / `disabled`. Not dirt `Btn` slabs. Icon above, label below. States as designer groups.

Lens dropdown: `absolute left-full top-0 z-30` (to the right of the ribbon). Not `top-full`. Not covering the map center.

Money: `ui-coin` + `Math.floor(world.money)`. No `$`.

## Docks

Shop, research, market: **left**, past the ribbon. Never right. `side: 'right'` dies.

| panel | pos |
|---|---|
| shop / market | `absolute top-16 left-32 z-20` `w-72` |
| research | same pos, `w-[28rem]` |

Research cards: compact, not `aspect-square`. 3-col grid. Icon + name + cost/time. Hover card stays.

Ghosts stay on the map. Dock must not cover house/field center more than the old left shop (`left-3` `w-72`). Ribbon is extra left chrome; dock sits beside it.

## Status

Queue + Status: `absolute bottom-4 right-4 z-20` `w-80`. Queue then Status. Not left.

Almanac overlay stays centered. Not a dock.

## Lenses

HUD **Lens** dropdown. Rows: **None**, **Water need**, **Ripeness**, **Object type**, **Rarity**, **Pipes**.

Button **Lens** when off, **Lens · Rarity** when `lens === 'rarity'`, **Lens · Pipes** when `lens === 'pipes'`. Other on-lenses **Lens · {name}**.

Rarity swatches: common `house`, uncommon `leaf`, rare `water`, heirloom `ripe`. No swatches on **Pipes**.

`lens === 'rarity'` wash (no multiply scale):

| plant | wash |
|---|---|
| no plant | none |
| common | `house` 0.35 |
| uncommon | `leaf` 0.45 |
| rare | `water` 0.45 |
| heirloom | `ripe` 0.45 |

Growing / ripe / dead use `Plant.rarity`. Rotten, shrub, empty, buildings, rock: no plant → none.

Pipes visible iff `lens === 'pipes'` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` / `buy-well` / `buy-pumpjack` or `place.kind === 'delete'`. `place.kind === 'delete'` replaces `buy-delete`.

AoE wash (`fill-water` **0.2**) on placed sprinkler AoE iff `lens === 'pipes'` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` or `place.kind === 'delete'`. Not well / pumpjack alone. Ghost AoE is **0.35**.

Water / ripe / kind tints stay [[ui/beta-4]] / [[ui/beta-5]].

## Store

Left dock title **General store**. Tabs **Seeds** / **Utility** / **Automation**. List only `skuShown` rows. Hidden ≠ greyed.

Automation: no Delete. Not a row. Not a `SkuId`.

| tab | SKUs |
|---|---|
| Seeds | pack-carrot, pack-potato, pack-wheat, pack-tomato, pack-raspberry, pack-watermelon |
| Utility | shovel, better-shovel, pickaxe, hardened pickaxe, bucket, large-bucket, box, large-box |
| Automation | pumpjack, well, pipe, sprinkler, vertical sprinkler, large sprinkler, chest, grinder |

Row: `skuLabel` + coin + price. Not `$`. `0` still shows coin + `0`. Armed `place.kind === 'sku' && place.id === id` = selected. Rows stay dirt `Btn`.

Hover → `skuDesc` + reason. `skuDesc` fill templates:

| id | text |
|---|---|
| pack-* | Pack of 5 {name} seeds. Plant on tilled soil. |
| shovel | Digs grass and hard soil, and uproots plants and shrubs. {uses} uses, {workSeconds}s per dig. |
| better-shovel | Same jobs, faster and longer lasting. {uses} uses, {workSeconds}s per dig. |
| pickaxe | Breaks rocks and very hard soil. {uses} uses, {workSeconds}s per mine. |
| better-pickaxe | Same jobs, faster and longer lasting. {uses} uses, {workSeconds}s per mine. |
| bucket | Holds {n} L. Fill at a pump or well. 1 L fills one plot. |
| large-bucket | Holds {n} L. Fill at a pump or well. 1 L fills one plot. |
| box | Allows you to gather up to 5 of the same fruits at the same time. Also holds seeds or berries of one kind. |
| box-large | Allows you to gather up to 14 of the same fruits at the same time. Also holds seeds or berries of one kind. |
| pumpjack | Place a 2 L/s pump on two tiles. Fill a bucket here. Pipe its edges to feed sprinklers. |
| well | Place a 5 L/s well on one tile. Fill a bucket here. Pipe its edges to feed sprinklers. |
| pipe | Pipe. 4 per edge. Hidden unless the Pipes lens or a pipe tool is out. |
| sprinkler | Waters a 2×2 around a corner. 0.5 L/s when piped to a source. |
| sprinkler-vert | Waters a 4×2 strip. Rotate while placing to flip NS/EW. 0.5 L/s when piped. |
| sprinkler-large | Waters a 4×4 around a corner. 0.5 L/s when piped to a source. |
| chest | 9 slots. Walk up and store any item. |
| grinder | One fruit becomes 1–3 seeds of the same crop and rarity. 2s per fruit. |

`{name}` = `cropName`. `{n}` = `capacityLiters`. `{uses}` `{workSeconds}` from defs.

No hover → tab line:

| tab | text |
|---|---|
| Seeds | Seeds for the field. |
| Utility | Tools and carry. |
| Automation | Machines you place. |

Reasons stay **not researched** / **cannot afford** / **inventory-full**.

## Tabs (shop + research)

`Tabs.List` sticky at top of dock scroller (`sticky top-0 bg-house`). Title stays outside the scroller. List scrolls under tabs. Description strip stays under the scroller.

## Research

Four tabs stay. Sticky tabs as shop. Hidden `reveal` rows absent. **unlock all instantly** stays.

Not row-`Btn`s. Grid: 2 columns of square-ish cards.

Each card:

1. `.name` on top
2. row: Coin+cost left, `{seconds}s` right
3. progress bar if running or done

Hover: floating `Chrome` immediately to the RIGHT of that card (not over it). `.name` + `.blurb` + Coin+cost + `{seconds}s`. Greater description = `.blurb`. Copy [[mechanics/beta-6]] Research blurbs. No invented lore. No item literals in the React file.

## Almanac

Tabs **Seeds** / **Utility** / **Automation** (same grouping as store). Skip delete.

| tab | entries |
|---|---|
| Seeds | carrot potato wheat tomato raspberry watermelon, berry, shrub |
| Utility | shovel, better shovel, pickaxe, hardened pickaxe, bucket, large bucket, fruit box, large fruit box |
| Automation | pumpjack, well, pipe, 3 sprinklers, chest, grinder |

Crop pane order: **variety name**, rarity tabs **Common** / **Uncommon** / **Rare** / **Specialty**, icons, details. Default Common. Type stays `heirloom`; UI says Specialty. Title is `cropVariety(id, preview)` (rare/specialty IRL names). Uncommon uses common art + pip. Rare → `rare` / `ripe-rare`. Specialty → `heirloom` / `ripe-heirloom`. Sell = `sale * RARITY_SALE`. Seed price = `seed * RARITY_SALE` (same ratio vs common, not equal to fruit). Grow uses `RARITY_GROW`. Freshness uses `RARITY_ROT`.

| stat | meter 1–5 | raw |
|---|---|---|
| Grow time | | days(stats.growSeconds) |
| Drink | | {L/day} 1 sig |
| Sell | | money(sale × rarity) |
| Seed price | | money(seed × rarity) |
| Freshness | | days(stats.rotSeconds) |

Not **Seed worth**. Not `{growSeconds}s`. `L/day = waterUsePerSec * 240`. Meter: `1 + round(4 * (v − min) / (max − min))` across the six crops, that column’s raw (`growSeconds` / `waterUsePerSec` / `sale` / `seed`). Ties share. `ui-meter.svg`.

Non-crop: icon + rewritten blurb (store templates). No meter. No growth loop.

Berry pane: same order (name, four rarity tabs, icons, details). Berry icon + shrub cycle (`prop-shrub` → ripe `prop-berry-shrub`, 0.8s). Table: **Grow time** 1.5 days, **Sell** `BERRY_SALE * RARITY_SALE[preview]`. No drink. No seed price.

Shrub: Berry shrub. Matures in 360s, then berries. Shovel to move.

Titles stay catalog titles. Overlay chrome stays [[ui/beta-4]].

## Money

One currency. Gold is the unit. **Silver** is tenths: 10 silver = 1 gold. Not a second purse.

Internal `money` / `unitSale` stay floats. **Display** floors to 1 silver (`floor(n * 10) / 10`). No extra digits.

```
tenths = floor(n * 10)
gold   = floor(tenths / 10)
silver = tenths % 10
```

| show | when |
|---|---|
| gold coin + gold | silver === 0 |
| gold coin + gold + silver coin + silver | gold > 0 and silver > 0 |
| silver coin + silver | gold === 0 |

HUD, shop, research, market, sell line, expand, recap, tax, almanac. Fresh fruit (baked `unitSale`) is why silver appears.

`ui-coin.svg` gold (`ripe`). `ui-coin-silver.svg` silver (`house` body, `ink` outline).

| where | was | now |
|---|---|---|
| HUD | `$` + floor(money) | coin + floor(money) |
| shop row | `skuLabel` + `$` + price | `skuLabel` + coin + price |
| research card | `$` + cost | coin + cost |
| market | `label` + `$` + money | `label` + coin + money |
| itemLine fruit / berry | `sell for $` + n | `sell for ` + coin + n |
| expand plate | **Expand $N** | **Expand** + coin + N |
| recap money | `$` + recap.money | coin + recap.money |
| recap tax | `tax {n}` | `tax ` + coin + n |
| almanac sale / seed | `$` + n | coin + n |

Negative recap money: coin then the signed number.

## Look

| cell | line |
|---|---|
| growing | include `happiness {n}%` |
| ripe | `{Crop} - ripe, freshness {n}%` — no water. `n = floor(freshness * 100)` |
| rotten | **Rotten plant** |

Ripe: hide water bar and water look. Freshness bar when `freshness < 0.8`, fill `lens-bad`, width ∝ freshness, same slot as the thirst bar. Growing thirst bar unchanged.

Pump look stays [[ui/beta-5]].

## Quality pip

Lower-right. Uncommon+ only. Common none. `qualityPip` on: seeds, fruit, berries, box cargo, planted crops (growing / ripe / dead). Inventory Face, status item, actor overlay, map plant.

## Actor

Held item miniature at art socket (~8/24). Empty: no overlay. Pip if rarity.

## Ground

Grass (and very-hard fill): `tileVariant(col, row, 8)`. Very-hard uses grass fill (art). Hard stays `tileVariant(col, row, 2)`.

## Place

[[ui/place]]. Build trio on the left ribbon, not shop. Shop dock still left, past the ribbon.

## Tokens

`dirt` `dirt-dark` `house` `roof` `ink` `water` `leaf` `ripe` `lens-bad` `lens-good` `lens-done`. No new hex. Coin uses `ripe`. Freshness bar: `lens-bad`.
