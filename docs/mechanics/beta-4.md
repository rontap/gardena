# Beta-4 mechanics

**Historical.** Current law: [[mechanics/beta-5]].

Supersedes [[mechanics/beta-3]] where this file names a replacement. Types: [[architecture/beta-4]]. Chrome: [[ui/beta-4]]. Art: [[art/beta-4]].

Beta-3 world, gen, expand, tax, pumps, rarity, pickaxe, walk stay except below.

## Base clear

After a chunk generates, strip specials within **8** tiles of the door center `(15.5, 9.5)`:

`hypot(col + 0.5 - 15.5, row + 0.5 - 9.5) < 8`

Rocks (whole rock if any cell is inside), shrubs, hard, very-hard → soft untilled. House and starter pump stay. Gen hashes unchanged; this is a post-pass.

## Research names and trees

`RESEARCH[id].name` is the only visible research label (rows and HUD bar). Never the id.

| id | name | tree | cost | s | effect |
|---|---|---|---|---|---|
| unlock-tomato | Tomato seeds | plants | 7 | 30 | unlock pack-tomato |
| unlock-raspberry | Raspberry seeds | plants | 12 | 45 | unlock pack-raspberry |
| bump-carrot | Better carrots | plants | 10 | 40 | carrot sale ×1.1 |
| bump-potato | Better potatoes | plants | 10 | 40 | potato sale ×1.1 |
| bump-wheat | Better wheat | plants | 12 | 45 | wheat sale ×1.1 |
| unlock-better-tools | Better gardening tools | utilities | 16 | 45 | large bucket + better shovel |
| unlock-large-box | Large fruit box | utilities | 17 | 50 | unlock large fruit box |
| unlock-pumpjack | Pumpjack | utilities | 20 | 60 | pumpjack |
| unlock-pickaxe | Pickaxes | utilities | 0 | 40 | both pickaxe SKUs |
| unlock-chest | Chest | utilities | 12 | 40 | unlock buy-chest |
| unlock-expand | Unlock land | expansion | 15 | 45 | expand faces |
| unlock-grinder | Seed grinder | automation | 18 | 50 | unlock buy-grinder |

Carrot / potato / wheat start unlocked. Their bump rows are sale only.

`unlockAll` still marks every row done and `money += 999`.

## Shop SKUs added

| id | price | unlock |
|---|---|---|
| buy-chest | 18 | unlock-chest |
| buy-grinder | 30 | unlock-grinder |

Both **arm place** (1×1). Pay on confirm. Confirm: `inWorld`, Plot, `untilled|empty`, no drops. Cell becomes Chest or Grinder.

## Occupancy

`isSolid` also chest, grinder. Not a Plot. No plant / hoe / drop / SKU-place onto them.

## Fruit box

Player-facing name **Fruit box** / **Large fruit box**. Same item. Caps 5 / 15.

Caps 5 / **14**. Large fruit box **$18**.

`buy-box` is `unlock: start`. No `unlock-box` research.

## Tools (nerf)

| item | uses | work | shop |
|---|---|---|---|
| shovel | 80 | 1.2s | $10 |
| better shovel | 200 | 0.6s | $30, `unlock-better-tools` |
| pickaxe | 25 | 4s | $18 |
| hardened pickaxe | 40 | 2s | $24, show after Pickaxes |
| bucket | 3 L | — | **$8**, start |
| large bucket | 8 L | — | $22, `unlock-better-tools` |

`unlock-better-tools` replaces Large bucket + Better shovel as one row. **$16 / 45s**.

`buy-bucket` arms place like other tools. Full 3 L.

## Shop show

`SKUS[id].show`: `'start' | ResearchId`. Store lists a row only if `show === 'start'` or that research is done. Separate from `unlock` (can buy).

| SKU | show |
|---|---|
| buy-better-pickaxe | unlock-pickaxe |
| all others | start |

Pickaxe row stays visible (grey) before Pickaxes research. Better pickaxe appears when that research completes.

## Chest

1×1 solid. 9 slots, any `Item`. Each chest owns its slots. House stays 16.

Click → `{ act:'chest'; at }`. Walk (through solids). Arrive → `cue = { kind:'chest'; at }`. App opens that chest. Swap/compact that chest only.

Look / prompt / task at work: **Chest**. Walking: **Move here**.

## Seed grinder

1×1 solid. Look **Seed grinder**.

Click:

- hand fruit, count ≥ 1 → `{ act:'grind'; at }`
- fruit box with fruit cargo count N ≥ 1 → grind
- else → speech (`grind`), no queue

Work `2 * n` seconds. `n = 1` for hand fruit, `n = cargo.count` for box.

Per fruit `i` in `0..n-1`:

```
u = hash(seed, 'grind', at.col, at.row, clock.day, i)
count = 1 + floor(u * 3)
```

Seeds same crop + rarity as that fruit. Merge into inventory like a shop pack. Remainder drops on `at`.

Hand: fruit count −1 (0 → empty). Box: cargo empty.

Same seed + day + at + n → same counts.

Grinder is not a box target.

Task: walk **Move here**, work **Grind**.

## Speech

```
speech: { kind:'none' } | { kind:'say'; text; left }
say(text): left = 2.5
```

`tick` decrements. `left ≤ 0` → none.

`click` returns blocked **and** the tile has a primary act the hand cannot do → `say('I cannot use this {tool} to {action}')`.

Do **not** speak for: cannot afford, cannot place, empty bucket, usesLeft too low.

Primary act:

| tile | action |
|---|---|
| ripe crop, ripe shrub | harvest |
| growing | water |
| empty | plant |
| untilled any | dig |
| infertile | plant |
| rock, very-hard | mine |
| pump | fill |
| grinder | grind |
| chest | open |
| house | inventory |
| dead | dig |

Legal alternate (shovel dig-up, shovel shrub, empty harvest, container water ripe) → enqueue, no speech.

`{tool}`: empty → `hand`; else the item’s display name (Shovel, Better shovel, Pickaxe, Hardened pickaxe, Bucket, Large bucket, Fruit box, Large fruit box, `{Crop} seed`, `{Crop}`, Berry, Shrub).

## Infertile

Prompt **does not need seeds**. Never **Need seeds** on infertile. Still cannot plant.

## Shrub shovel

Any shrub + shovel → Dig. Drop `{ kind:'shrub' }`, soft untilled, −1 use. Ripe or not. Harvest still ripe-only. Delete **Not ready**.

## Sell line

`itemLine` fruit / berry: `{name} - {count}, sell for ${n}`.

`n` = `fruitMoney` / `berryMoney` for the stack (same as `sellSlot`).

## Wilt look

`growing && thirst < WITHER`: `{Crop} - water {floor(thirst*100)}%`. No “growing”. Bar pulses. Else Beta-3 growing line.

## Catalog

`catalogEntries()` maps defs. Templates only. `fill(template, vars)` — missing key throws. Numbers live on defs:

| entry | keys |
|---|---|
| crop | name, growSeconds, waterUsePerSec, sale, seed |
| shovel / pickaxe | name, uses, workSeconds |
| bucket | name, capacityLiters |
| fruit box | name, cap |
| berry | sale = BERRY_SALE |
| shrub | growSeconds = 360 |
| pumpjack | output = 2 |
| chest | slots = 9 |
| grinder | min = 1, max = 3, workSeconds = 2 |

`skuDesc` also `fill`s from the same defs.

Templates:

- crop: `${name}. Grows in ${growSeconds}s. Drinks ${waterUsePerSec} L/s. Fruit sells for $${sale}. A seed is worth $${seed}.`
- shovel: `${name}. ${uses} uses. ${workSeconds}s per dig.`
- pickaxe: `${name}. ${uses} uses. ${workSeconds}s per mine.`
- bucket: `${name}. Holds ${capacityLiters} L. 1 L waters one plot.`
- box: `${name}. Carries ${cap}. Fruit, seeds, or berries.`
- berry: `Wild berry. Sells for $${sale} times the rarity multiplier.`
- shrub: `Berry shrub. Matures in ${growSeconds}s, then berries. Shovel to move.`
- pumpjack: `Pump. ${output} L/s. Place on two tiles.`
- chest: `Chest. ${slots} slots. Walk up and store any item.`
- grinder: `Seed grinder. One fruit becomes ${min}–${max} seeds of the same crop and rarity. ${workSeconds}s per fruit.`

## Named invariants (tests after impl)

Keep 1–30. Add:

31. Immature shrub + shovel → shrub item, soft untilled.
32. `buy-chest` 18, `unlock-chest` 12. Place 1×1. 9 slots. Two chests do not share slots.
33. Hand 1 fruit → 1–3 seeds same crop+rarity. Same seed/day/at twice → same count.
34. Box fruit N → N rolls, work `2*N`, box empty. Overflow drops on tile.
35. `unlock-grinder` 18, tree automation. `buy-grinder` 30.
36. `RESEARCH[id].name` matches the table. `unlock-expand`.tree === `expansion`.
37. `itemLine` fruit/berry sell-for equals `sellSlot` delta.
38. Infertile prompt is `does not need seeds`.
39. Pickaxe + ripe click: queue unchanged, speech that cannot-use line.
40. `skuLabel('buy-box') === 'Fruit box'`.
41. Cells with `hypot` to door center `< 8` are not rock / shrub / hard / very-hard.
42. `buy-box` unlock start. `skuShown('buy-better-pickaxe')` is false until `unlock-pickaxe`.
