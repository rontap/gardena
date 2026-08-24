# Almanac

Centered overlay, `w-[36rem]`, `max-h-[min(36rem,calc(100%-6rem))]`. Title **Almanac**. Left list, right pane. Do not widen for the Trees tab; the existing max-h is the overflow rule.

| tab | list |
|---|---|
| Seeds | carrot potato wheat tomato raspberry watermelon olive grape vanilla sugar-cane soil weed grass rotten dead |
| Trees | apple apricot lemon cherry |
| Utility | shovel better-shovel pickaxe better-pickaxe bucket large-bucket box box-large fertilizer synth-fertilizer weed-spray compost sugar |
| Automation | pumpjack well rain-tank tap pipe valve sprinkler sprinkler-vert sprinkler-large chest grinder compost-box mill still barrel jam freezer hangar silo-seed silo-spray silo-produce |

Crop and Tree panes carry `CROPS.desc` under the name: one plain-language line on how the plant behaves, no numbers. It is also the crop's `CatalogEntry.blurb`.

Crop panes: rarity tabs **Common** **Uncommon** **Rare** **Heirloom**. Last tab is **Heirloom**. Preview swaps fruit face, plant art, and numbers.

Crop stats: Grow time, Drink, Water range, Fertilizer, Sell, Seed price, Freshness. Leaf meter 1–5. Coin on Sell and Seed price.

Sugar-cane is a CropPane. Product face is cane fruit (`fruit-sugar-cane`), not the sugar bag. Sell is crop fruit `statsOf`. Line under desc: **Mill 5 cane into 2 L sugar.**

`unlock-preservatives` done: third `h-20 w-20` `bg-dirt-dark` plate on grape raspberry tomato CropPanes and apple apricot cherry TreePanes. Jam jar; tomato **Ketchup**. Hidden until that research is done.

Utility `sugar`: liters bag face. Automation order after compost-box: mill, still, barrel, jam, freezer, hangar, silo-seed, silo-spray, silo-produce. Hangar and field silo panes [[ui/vehicles]]. Assumption: hangar and three silos are on Automation. No Quad / tractor / trailer SKU pane.

Apple is not on Seeds.

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

Automation list row `pipe` only. Valve and the sprinklers stay their own static rows.

Same generic pane chrome as other non-crop entries: title, one `h-20 w-20` `bg-dirt-dark` plate (`h-16 w-16` svg, `viewBox="0 0 24 24"`), blurb. The plate is not `itemInner({ kind: 'pipe' })`.

Cycle join art the way CropPane cycles `sprout` / `grow` / `ripe`: `setInterval` 800ms, `(s + 1) % 5`. Order, rot 0:

`PIPE_STUB` `PIPE_I` `PIPE_L` `PIPE_T` `PIPE_X`

(`pipe-stub` `pipe-i` `pipe-l` `pipe-t` `pipe-x`). Not `pipe-source`. Not `pipe-valve`.
