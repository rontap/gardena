# Changelog

History. Not current contracts.

## 2026-08-22 — v0.7.1

- Base soil boost: exponential decay to `r = 16` instead of a linear taper to `r = 8`. No hard ring around the cottage.
- Actor redrawn — straw hat, overalls, boots. [[art/actor]].
- Market and almanac overlays close on backdrop, matching the Radix dialogs.
- Crop panes carry a plain-language `desc` under the name; it doubles as the catalog blurb.
- Recap redesigned: night strip, tally rows, stipend / tax / balance ledger. `Recap.stipend` added. [[ui/docks]] [[art/recap-night]].

## 2026-08-22 — v0.3 Dirt Overhaul & Fertilizers

[[archive/mechanics/v0.3]] [[archive/architecture/v0.3]].

- Water and fertilizer belong to the soil, not the plant. `Plant.thirst` dies.
- Soil survives harvest, dig, death and rot. Bare tilled soil can be watered.
- Ground kind derives from a Perlin-style goodness field; hard dirt is poor dirt. Base boost tapers to r=8.
- Weeds take fallow tilled plots and drink water + fertilizer. Two variants.
- Grass spreads over untilled ground. Three variants, cosmetic.
- Fertilizer bag 5 L / $6, `unlock-fertilizer`. Spends only the gap.
- Big tick (10s) owns weed and grass spawning.

## 2026-08-19 — Beta-6 / Update 7

[[archive/mechanics/beta-6]] [[archive/architecture/beta-6]] [[archive/ui/beta-6]] [[archive/art/beta-6]] [[ui/place]].

- HUD overlay + cottage buttons.
- Coin replaces `$`.
- Almanac tabs + growth + meters.
- Delete is HUD, not shop. Buildings (no house/starter). No refund.
- Freshness / rot.
- Rarity pip. Rare / heirloom fruit. Rarity lens.
- Seed rebalance 45 / 80 / 120 / 150 / 150 / 180.
- Actor held item.
- Grass 8-tile. Very-hard grass fill.

## 2026-08-19 — Beta-5 irrigation fix

[[archive/mechanics/beta-5]] [[archive/architecture/beta-5]] [[archive/ui/beta-5]] [[archive/art/beta-5]] [[ui/place]].

- Sprinkler place without incident pipe; rate 0 until sourced.
- Large AoE 4×4 centered.
- Dry pipes omit water fill.
- Pipe place ghost is `pipeFit`.
- Hover cell outline restored.
- Pipes-lens source `overlay-water`.
- Shop close exits pipes lens.
- Playwright e2e.

## 2026-08-18 — Beta-5

Automation. [[archive/mechanics/beta-5]] [[archive/architecture/beta-5]] [[archive/ui/beta-5]] [[archive/art/beta-5]] [[ui/place]].

### Network

- Pipes on **edges**. Sprinklers on **vertices**. Neither is a Cell.
- Well 1×1, 5 L/s, $75. Pumpjack $40.
- Watermelon. `unlock-watermelon` $8 / 35s. Pack $12. 2.5× tomato thirst.
- Irrigation → Automated irrigation → Advanced irrigation. `unlock-pumpjack` dies.
- Lens **Pipes**. `buy-delete` $0. Pipes and sprinklers only.

## 2026-08-18 — Beta-4

[[archive/mechanics/beta-4]] [[archive/architecture/beta-4]] [[archive/ui/beta-4]] [[archive/art/beta-4]] [[ui/place]].

### Chrome

- Research human names. Tabs: plants, utilities, expansion, automation.
- General store, three tabs, icons, permanent description.
- Almanac. Lenses (water, ripeness, object type).
- Button states. Expand plate. Speech on wrong tool.
- Fruit box. Sell line shows exact $. Wilt pulses, no “growing”. Infertile: does not need seeds.

### Content

- Chest 1×1, 9 slots, walk-open. $18 / research $12.
- Seed grinder 1×1. Fruit → 1–3 seeds. Fruit box dumps all. $30 / research $18.
- House redrawn. Immature shrubs shovelable.

## 2026-08-18 — Beta-3

[[archive/mechanics/beta-3]] [[archive/architecture/beta-3]] [[archive/ui/beta-3]] [[ui/place]] [[archive/art/beta-3]].

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

[[archive/mechanics/beta-3]].

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
