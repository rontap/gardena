# Changelog

History. Not current contracts.

## 2026-08-23 — 1.2.1 tick dirty / HUD `<use>`

[[mechanics/trees]] [[architecture/modules]]

- `tickTree` pings `'field'` only on visual stage change. Juvenile growth and blocked-drop repeats do not ping.
- HUD / coin / actor faces are `<use href={symHref(...)}>`. Phase glyph owned by `paintMotion`.
- Ground bake clipped to bounds±FADE (same skip as `chunkSig`).
- rAF: HUD bind registry, actor transform skip, max 2 ticks per frame.
- `groundRev` matches painted ground. Till grass does not rebake the chunk (dirt is Marks). Pointer path caches the SVG box — no layout read per move.

## 2026-08-23 — 1.2 Machine Update I

[[mechanics/machines]] [[architecture/save]]

- Mill, jam machine, pot still, wine barrel, freezer. Secondary goods. Place like chest.
- No whisky. Barrel is grapes → wine. Cane harvests as fruit. Sugar is liters, mill or shop.
- Research merges: Seed grinder → mill. Preservatives → jam + freezer + sugar. Fermentation → still + barrel (+ cane).
- Save `version` → **1.2**. Pre-1.2 refused. No migrate.

## 2026-08-23 — 1.0.1 early-access tuning

- **Weed / grass grace.** Spawn chance ramps linearly from **−10%** to full over the first day of big ticks (`ramped`, `CHANCE_RAMP_TICKS = 24`). No weed on the first tick of a fresh plot. [[mechanics/weeds]]
- **Pause.** Top-ribbon **Pause** button next to Gear (`ui-btn-pause.svg`). Freezes the sim; selected while paused. [[ui/hud]]
- **Well is edge-based** like a valve. Sits on one owned edge, joins its two vertices, feeds its 5 L / 150 L reservoir into that net. No pipe or valve on a well edge. Fill by clicking it with a container (gardener walks to an adjacent cell). Delete lifts the whole edge. Save `version` → **1.1**: pre-1.1 saves are refused with *different version*. [[mechanics/water]] [[architecture/save]]
- **Valve place ghost.** Armed `buy-valve` now draws the open-valve body on the hovered edge at 0.7, on top of the junction preview. Well ghost likewise. [[ui/place]]
- **Land lens reads untilled ground.** `land` tints untilled tiles by the goodness field (red = not worth digging), infertile flat red. [[ui/lens]]

## 2026-08-22 — cheat dock

- Left ribbon **Cheat**. Dock: Unlock all instantly (moved off Research), research speed 3× toggle, gain 200, gain 10 skill points each.

## 2026-08-22 — 0.7.4

### Building

- **Wooden fence** `buy-fence` $10. Middle of an untilled tile, joins its four neighbours through `fenceFit`. `World.fences` set, not a `Cover`. Cosmetic — does not block walking. [[items/tiles]]
- Paving repriced and reordered: cobble $5, brick $7, paved $11. All gated on Landscape architecture. Shop icons are now `item-{tile}.svg`, not the ground art.
- Fence and paving stay armed while placing. Delete tool lifts both; fence wins when they share a cell.

### Plants

- **Grass seeds** `pack-grass` $1 for 5. Not a crop — no `CropId`, no rarity. New `turf` plot kind + `Turf`. Drinks 0.29 L/day, roots in `DAY_SECONDS / 4`, then the plot reverts to untilled lawn. [[mechanics/plants]]

### Tools

- **Rotary shovel** 1000 uses / 0.2s / $1000. **Diamond pickaxe** 1000 uses / 0.4s / $1000. `SHOVEL_NAME` / `PICKAXE_NAME` replace the id ternaries. [[items/tools]]

### Research

- `ResearchDef.gate` required on every row. `digs` / `mines` counters on `World`, bumped in `doShovel` / `doMine`. `researchOpen` blocks `startResearch`; gated cards show a bar and `{have} / {n}`.
- New rows: **Landscape architecture** (expansion, $12 / 60s), **Rotary shovel** (200 digs), **Diamond pickaxe** (150 mines), both $40 / 120s. [[mechanics/research]]

### UI pass

- One type scale and two faces: Press Start 2P for titles only, **Nunito** for body. `text-lg`-everywhere is gone. [[ui/type]]
- Top ribbon `h-14`: **Gardena** wordmark, money, **Day n · Phase** over a day bar, research job with seconds, dig / mine counters. `paintMotion` updated to match.
- Shop rewamped: `w-[30rem]`, single-word tabs, row-as-button with right-aligned price, armed state, empty-shelf copy.
- Lens is a dock, not a floating menu. Cards with blurbs and legends; locked lenses are counted, not hidden silently. [[ui/lens]]
- Family: three cards with header bands, role blurbs, a points band, fixed-height offer slots, a learned tray.
- Research: 2-col cards with done / running / gated / blocked faces; footer states the running job.
- Blocked controls hover. `aria-disabled` instead of `disabled` in shop rows, research cards and family offers, so the callout can say **why** — no research, no money, no point, no room. [[ui/callout-hover]]
- `scroll-pane` styles every overflow bar; panels sized to not scroll at 1440×900.

## 2026-08-22 — 0.7.3

- Left ribbon: Shop, Research, Market, Lens, **Family**, Almanac.
- Better {crop}: +4% +1-rarity at full happiness (`extraUp1`, scaled). UI: happy plant / superior fruit.
- Gardener **Trusted seed bank** I–V. Shop packs: per rank 5% uncommon / 1.2% rare / 0.2% heirloom. Base 0% (always common).
- Plants research **Heirloom crops** $20 / 120s. Gates Őstermelő.
- Dummy copy: industrial “Does nothing yet.” Forecast names that weather is not in yet.

## 2026-08-22 — 0.6 Family

- Family overlay: three columns, portraits, skill offers, owned icons. Left-ribbon **Family**.
- Recap: `dismissRecap()` grants +1 skill point to each member. No pick.
- Skills: defs `SKILLS`, `World.family`. Better-crop sale moved off research (`bump-*` gone).
- Market closed at sunset/twilight until Open late / Open 24/7. Water lens gated on Water study. Land quality lens on Land quality study.
- [[mechanics/family]] [[ui/family]] [[architecture/family]]

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
