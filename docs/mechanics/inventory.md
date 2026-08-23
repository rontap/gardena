# Inventory

Hand is one item. Empty or hold.

House: 16 slots. Walk to the door, swap with hand. Auto-merge same crop+rarity seeds and fruit. Sugar merges weighted `unitSale` by liters. Weighted freshness / `unitSale` on fruit.

Chest: `CHEST_SLOTS = 9` — preference. 1×1, $18, `unlock-chest`. Walk up, swap any item.

Freezer: `FREEZER_SLOTS = 6` — preference. 1×1, $36, `unlock-preservatives`. Reuses chest act / `swapChest`. Slots skip `tickFreshness`. Guest may not open — [[mechanics/machines]].

## Starter

Shovel in hand. Bucket on the doorstep (full 3 L). Money $50 — preference.

House:

- 5 common carrot
- 2 rare carrot
- 2 rare tomato
- 2 heirloom potato
- 1 apricot sapling
- 1 lemon sapling
- 1 cherry sapling

Shop `pack-*` are five seeds. Always common unless the player owns `seed-bank` — [[mechanics/family]].

## Tools

| | uses | work s | $ | unlock |
|---|---|---|---|---|
| shovel | 80 | 1.2 | 10 | start |
| better shovel | 200 | 0.6 | 30 | `unlock-better-tools` |
| pickaxe | 25 | 4 | 18 | `unlock-pickaxe` |
| hardened pickaxe | 40 | 2 | 24 | `unlock-pickaxe` |
| bucket | — | 3 L | 8 | start |
| large bucket | — | 8 L | 22 | `unlock-better-tools` |

Uses / work / capacities — preference. 0 uses: hand empty.

## Boxes

`BOX_SMALL = 5`, `BOX_LARGE = 14` — preference. Small $6, in the shop from the start. Large $18, `unlock-large-box` only.

One kind: fruit or seeds, one crop+rarity. Harvest and pickup fill the box if it accepts. Sugar-cane is fruit. Not sugar liters. Not saplings. Not spirit / wine / jam / oil / flour / extract.

## Fertilizer / compost

Ordinary bag `FERT_BAG_LITERS = 5`, $6, always in the shop. Synthetic `SYNTH_BAG_LITERS = 8`, $5, research. Compost `COMPOST_LITERS = 3`, organic feed.

Compost box $20. `unlock-compost` $14 / 45s. `COMPOST_NEED = 10` units → one bag in `COMPOST_SECONDS = 120` (half a day — derived). Output drop on a plot in front.

`COMPOST_VALUE` — preference:

| | units |
|---|---|
| seeds | 1 |
| fruit | 5 |
| heirloom fruit | 20 |
| grass | 1 |
| weed | 1 |
| rotten | 2 |
| dead | 1 |

Sugar composts as `liters × COMPOST_VALUE.fruit`. Empty-hand weeds/grass are feedstock. Shovel dead/rotten drops nothing — [[mechanics/plants]]. Spirit / wine / jam / oil / flour / extract: not compost.

## Grind

Seed grinder 1×1, $30, `unlock-grinder`. One annual fruit including sugar-cane (not `TreeId`) → `GRIND_MIN`..`GRIND_MAX` (1–3) seeds, same crop and rarity. `GRIND_WORK = 2` s per fruit — preference. Box dumps all accepted fruit in it. Seeds merge into house or drop if full. Tree fruit and sugar: refuse.

Mill / jam / still / barrel / freezer / shop sugar: [[mechanics/machines]].

## Tiles

`buy-tile-paved` $5, `buy-tile-brick` $7, `buy-tile-cobble` $11 — preference. Cosmetic. Stay armed. Replace bare untilled or an existing tile. Keep `ground`. Grass is not a tile site.
