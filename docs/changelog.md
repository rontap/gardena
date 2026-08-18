# Changelog

## 2026-08-18 — Beta-3

Current contracts: [[mechanics/beta-3]] [[architecture/beta-3]] [[ui/beta-3]] [[ui/place]] [[art/beta-3]].

### World

- Starter field 32×32. House rows 6–8, door (15, 9), pump (18, 7).
- 4-connected 32×32 chunks. **Unlock land** then edge `expand $N`. Price `40+15n`. Tax `2+6*(chunks-1)` after sundown +$10. Money may go negative.
- Hidden map seed. Hard / very-hard / rock / shrub from distance to (16,16). Rocks rarer; longs rarer than 1×1. Shrubs 0.0035.

### Objects

- Hard soil: one dig, 2× time, 2 uses. Very-hard: cannot dig.
- Rocks 1×1 / 1×2. Pickaxe $20, research $0. Mine 4s / 2s. Long rock 2 uses. Very-hard → infertile (no plant).
- Shrubs on grass, 360s → berries (base 2 × rarity). Harvest cycles. Shovel ripe extracts a plantable shrub.
- Pumpjack **places** a 2 L/s pump. Every pump is 2 L/s. Fill is per pump.

### Economy / UI

- Rarity global: 0.55/0.35/0.09/0.01 weights, 1 / 1.25 / 2 / 3.5 sale.
- Carrot pack $3. Large bucket $22. Box $6 / $12.
- Shop description under the whole list. Inventory `itemLine` always. Box shows cargo art.
- Queue: **Move here and dig** while walking to a dig.
- `unlockAll` also `money += 999`.
- Place: 64px ghost + Place label. Tool drops have tooltips.
- Plant start thirst 0.75.

## 2026-08-18 — Beta-2 close

Historical. Current law: [[mechanics/beta-3]].

Beta-1 notes are historical.

### Loop

- Walk 6 tiles/s. Start $50. Sundown +$10 before recap.
- Wilt: start thirst 1.0. waterUse carrot 0.008333 / potato 0.007333 / wheat 0.006 / tomato 0.009333 / raspberry 0.01. Health bar under 0.5.
- Ripe does not drink. Dig growing/ripe drops one seed; dead does not.
- Cans gone. Bucket 3L start. Large bucket 8L / $18. Shovel $10.
- Research costs floor(old/2). One job. **unlock all instantly**.
- 16-slot house inventory. Swap hand. Auto-merge seeds/fruit. Sell fruit from a slot, hand stays.
- Drop and inventory walk, then act. Place-confirm stays instant.

### View

- Tiles 48px / 24 viewBox. Five grass, two hoed dirt. Hash `tileVariant`, not a checker.
- Grass baked once. `tick` does not remount React. Motion via refs.
- No water overlay. Fruit in hand uses `fruit-*`, not the plant.
- Drops 50% larger.

### Chrome

- Shop left dock. Research / Market right dock. Inventory / recap stay dialogs.
- Status + queue: `fixed` bottom-left `w-80` stack, `gap-3`, both `Chrome`.
- Status: hand line (`67/100 uses`, `2/3L`) and look (plant %, action).
- `Chrome` header/rail/corners on HUD, docks, status, queue.
- Buttons: dirt face, header strip, `cursor-pointer`. No ink box.
- `user-select: none`. Shell `overflow-hidden`.
- Place: pointer ghost, armed shop row, `Place {skuLabel}`.
