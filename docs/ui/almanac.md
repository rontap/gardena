# Almanac

Centered overlay, `w-[36rem]`, `max-h-[min(36rem,calc(100%-6rem))]`. Title **Almanac**. Left list, right pane. Do not widen for the Trees tab; the existing max-h is the overflow rule.

| tab | list |
|---|---|
| Seeds | carrot potato wheat tomato raspberry watermelon olive grape vanilla sugar-cane soil weed grass rotten dead |
| Trees | apple apricot lemon cherry |
| Utility | shovel better-shovel pickaxe better-pickaxe bucket large-bucket box box-large fertilizer synth-fertilizer compost |
| Automation | pumpjack well rain-tank tap pipe valve sprinkler sprinkler-vert sprinkler-large chest grinder compost-box |

Crop and Tree panes carry `CROPS.desc` under the name: one plain-language line on how the plant behaves, no numbers. It is also the crop's `CatalogEntry.blurb`.

Crop panes: rarity tabs **Common** **Uncommon** **Rare** **Heirloom**. Last tab is **Heirloom**. Preview swaps fruit face, plant art, and numbers.

Crop stats: Grow time, Drink, Water range, Fertilizer, Sell, Seed price, Freshness. Leaf meter 1–5. Coin on Sell and Seed price.

Sugar-cane is a CropPane. Product face is the sugar bag (`{ kind: 'sugar' }`), not a fruit. Sell is sugar `unitSale` at common — `statsOf('sugar-cane', 'common')`. One line: bagged sugar does not rot.

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
