# Docs review: Plants and soil

Notes: `docs/mechanics/plants.md`, `docs/mechanics/soil.md`, `docs/items/crops.md`, `docs/items/fertilizer.md`
Code: `src/game/sim/plant.ts`, `src/game/sim/soil.ts`, `src/game/sim/plot.ts`, `src/game/sim/tick.ts`, `src/game/sim/modifiers.ts`, `src/game/sim/store.ts`, `src/game/sim/queue.ts`, `src/game/sim/prompt.ts`, `src/game/sim/noise.ts`, `src/game/sim/feature-field/field.ts`, `src/game/sim/feature-field/field.helpers.ts`, `src/game/defs/crops.ts`, `src/game/defs/varieties.ts`, `src/game/defs/items.ts`, `src/game/defs/research.ts`, `src/game/defs/skills.ts`
Tests: `src/game/sim/plants.test.ts`, `src/game/sim/world.test.ts`, `src/game/sim/soil.test.ts`, `src/game/sim/feature-burrow/burrow.test.ts`, `e2e/grow.spec.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Does an annual roll for a better Variety when it ripens?
- [ ] **doc** `docs/mechanics/plants.md:37` — Yes. After quality is baked, one roll on that plot; a hit moves the plant one tier up (`nextVariety`) and sets quality to 0 (`plants.variety-roll`, also `:125`).
- [ ] **doc** `docs/mechanics/plants.md:121` — No. `plants.ripen` says "variety unchanged; no roll". `docs/mechanics/plants.md:127` `quality.ripen` also says "No roll at ripen".
- [ ] **code + test** `src/game/sim/feature-field/field.ts:143` — Yes. Ripening calls `upgradeVariety` after baking quality. `src/game/sim/plants.test.ts:1856` "The roll runs on the ripen seam, so the ripe plot carries the new Variety and Quality 0" asserts a base tomato ripens as `green-zebra` at quality 0.
- [ ] **test** `src/game/sim/plants.test.ts:1321` "No roll at ripen…" and `src/game/sim/plants.test.ts:877` "…ripen does not roll…" — the titles say no roll, but they ripen a quality-0 potato and a carrot; a quality-0 plant with no bonus has chance 0 and a carrot has no tier above, so these pass with the roll in place.
- [ ] **none**

### 2. Is the wheat seed pack for sale from the first day?
- [ ] **doc** `docs/mechanics/plants.md:11` — Carrot, potato and wheat start unlocked.
- [ ] **code** `src/game/defs/research.ts:380` — `pack-wheat` is shown from the start but can only be bought after the `unlock-multi-crop` research (`src/game/defs/research.ts:40`, whose effect unlocks `pack-wheat`). Carrot and potato are `start`.
- [ ] **test** `src/game/sim/plants.test.ts:627` "A bought pack is `'base'`…" — adds `unlock-multi-crop` to `done` before buying `pack-wheat`, so it assumes wheat is locked at start.
- [ ] **none**

### 3. What quality do bought seeds have?
- [ ] **doc** `docs/mechanics/plants.md:11` — A bought pack is `'base'` at `seedBankQuality(skillTier('seed-bank'))`, quality 0 without that skill. Same in `docs/items/crops.md:26` ("Bought packs are `'base'` at quality 0").
- [ ] **code** `src/game/sim/store.ts:31` — `boughtSeedQuality` is the seed-bank value plus `familiarity[crop] × FAMILIARITY_SEED_QUALITY` (0.02 per familiarity point), capped at 1. Studying a crop at the research station raises the quality of every pack bought after. Used by single buy (`src/game/sim/feature-place/place.ts:226`) and the five-pack buy (`src/game/sim/feature-place/place.ts:305`).
- [ ] **test** `src/game/sim/plants.test.ts:627` — asserts quality 0 without the skill and `SEED_BANK_QUALITY` with it, on a new world with familiarity 0. The familiarity term is not tested.
- [ ] **none**

### 4. What quality do vanilla seeds from a contract prize have?
- [ ] **doc** `docs/items/crops.md:26` — `'base'`, quality 0.
- [ ] **code** `src/game/sim/feature-contracts/market.ts:886` — seed prizes go into the silo at `boughtSeedQuality` (seed-bank value plus familiarity, see question 3), not at 0.
- [ ] **test** — no test found for prize seed quality.
- [ ] **none**

### 5. What do the happiness drain and gain constants measure?
- [ ] **doc** `docs/mechanics/plants.md:81` — `HAPPY_DROWN_SECONDS`, `HAPPY_WILT_SECONDS`, `HAPPY_STARVE_SECONDS`, `HAPPY_GAIN_SECONDS` are the seconds to go from 50% to 0.
- [ ] **code** `src/game/sim/feature-field/field.helpers.ts:72` — each second happiness changes by `dt / SECONDS`, so the constant is the time to go from full (1) to 0; from 50% to 0 takes half of it. Values `src/game/defs/crops.ts:221`: gain 900, wilt 240, starve 400, drown 180.
- [ ] **test** `src/game/sim/world.test.ts:1690` "wilt drains happiness" — asserts only that happiness drops below `HAPPY_START` and stays above 0 after one tick.
- [ ] **none**

### 6. What does "`PACK_N` at 10" mean for the chilli pack?
- [ ] **doc** `docs/items/crops.md:26` — "`pack-chilli` show and buy `unlock-infusion`, `PACK_N` at 10".
- [ ] **code** `src/game/sim/item.ts:833` — a chilli pack holds 5 seeds, like every crop pack (`PACK_N = 5` at `src/game/sim/item.ts:692` is only used in the description). The price is 10 (`src/game/defs/research.ts:385`).
- [ ] **test** `src/game/sim/plants.test.ts:1676` "…`PACK_N` at 10…" — asserts `price: 10` and the gate, not a count of 10; `src/game/sim/plants.test.ts:1717` asserts the chilli pack item has count 5.
- [ ] **none**

### 7. Does deleting a building leave tilled soil?
- [ ] **doc** `docs/mechanics/soil.md:7` — Only tilling fresh ground, or clearing a deleted building, mints a tilled `Soil`.
- [ ] **code** `src/game/sim/feature-place/place.helpers.ts:56` (and every delete branch to `:230`) — deleting a building writes untilled bare soft ground with hardness 0 (`bare('soft', 0)`). No `Soil` is made; the player tills again. The only code that mints tilled `Soil` is `freshSoil` on a shovel (`src/game/sim/feature-field/field.helpers.ts:228`).
- [ ] **test** — no test checks the cell kind after a building delete.
- [ ] **none**

### 8. What quality are bought grass seeds?
- [ ] **doc** `docs/mechanics/plants.md:56` — `GRASS_PACK`, `'base'`, quality 0 (also `plants.grass` at `:149`).
- [ ] **code** `src/game/sim/store.ts:33` — grass seeds are bought at the seed-bank value, which is above 0 once the player owns `seed-bank`. The quality has no effect, since turf has no quality.
- [ ] **test** `src/game/sim/plants.test.ts:1730` "`'grass'` is `AnnualId`…" — asserts quality 0 on a world without `seed-bank`.
- [ ] **none**

### 9. What does a lone tree that needs a neighbour skip at the day change?
- [ ] **doc** `docs/mechanics/plants.md:109` — its `fruit` does not increase and the seam does not turn `pending` into `on` (also `variety.neighbour` at `:135`).
- [ ] **code** `src/game/sim/feature-field/field.ts:186` — the whole yield step is skipped for a lone tree: `pending` does not become `on`, an `on` season does not count down, and an `off` tree does not roll to start fruiting.
- [ ] **test** `src/game/sim/plants.test.ts:1597` "A lone tree raises `juvenile` but not `fruit`, and the seam leaves `pending` alone" — covers only the `pending` case.
- [ ] **none**

## Doc only (no code found)

### 10. Is there a constant or rule named "`World.ripenN`" or a grow stream?
- [ ] **doc** `docs/mechanics/plants.md:27` — "No grow stream. No `World.ripenN`." Searched: `ripenN`, `stream('grow')`, nothing found. The line records something removed.
- [ ] **removed from the game**
- [ ] **none**

## Code only (no note mentions it)

### 11. Does fruit rot in the Produce silo and the postbox?
- [ ] **code** `src/game/sim/tick.ts:80` — `tickFreshness` rots fruit in hands, the house inventory, ground drops, chests, freezers, quads and harvest trailers. The `stores` index holds only chests and freezers (`src/game/sim/world.ts:685`), so fruit in a Produce silo (`SiloProduce`, which accepts fruit, `src/game/sim/building.ts:1443`) or a postbox never loses freshness.
- [ ] **intended, document it**
- [ ] **not intended**

### 12. Does fruit carried by a multiplayer guest who is away keep rotting?
- [ ] **code** `src/game/sim/tick.ts:73` — seats with `presence === 'away'` are skipped; their hand and inventory do not rot.
- [ ] **intended, document it**
- [ ] **not intended**

### 13. What does the shovel prompt say on hard ground with one use left?
- [ ] **code** `src/game/sim/prompt.ts:796` — the prompt reads **Cannot dig** (`prompt_cannot_dig`), and the click does nothing.
- [ ] **intended, document it**
- [ ] **not intended**

### 14. When does sown grass change from a sprout to grown art?
- [ ] **code** `src/game/sim/plant.ts:46` — `Turf.stage()` is sprout below maturity 0.5, grow at 0.5 and above. Annuals switch at 0.33 (`src/game/sim/plant.ts:31`, documented).
- [ ] **intended, document it**
- [ ] **not intended**

### 15. Is `SHRUB_GROW` used?
- [ ] **code** `src/game/defs/items.ts:46` — `SHRUB_GROW = 360` is exported and read nowhere. `docs/mechanics/plants.md:161` says there is no `Shrub`.
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 17. Harvesting a ripe annual with an empty hand gives one fruit with the plant's freshness, Variety and quality, `cut: false`, `unitSale` from the plant's stats, and leaves the plot `empty` on the same soil; the same crop and Variety in hand merges up to the stack cap — doc `docs/mechanics/plants.md:97`, code `src/game/sim/feature-field/field.helpers.ts:476`, test `src/game/sim/plants.test.ts:1166`, `:1178`.
- [ ] 18. Prompts: **Harvest**, **Tend**, **Graft**, **Pick up**, **Sow grass** (`prompt_sow` "Sow {name}" with "grass"), full hand **My hand is full!** — doc `docs/mechanics/plants.md:58`, `:99`, `:105`, code `src/game/sim/prompt.ts:811-866`, `messages/en/prompt.json:41,71,87,88,129,4`, test `src/game/sim/plants.test.ts:1193`.
- [ ] 19. Empty hand (or a hand holding the same kind) on a `dead` or `rotten` plot picks up one `dead` / `rotten` item with no work; the plot becomes `empty` on the same soil; a full stack says `HAND_FULL` — doc `docs/mechanics/plants.md:99`, code `src/game/sim/queue.ts:583`, `src/game/sim/feature-field/field.helpers.ts:47`, no test for the plot pick-up.
- [ ] 20. Shovel on a growing or ripe annual drops one seed of the same Variety at the plant's quality; shovel on dead or rotten empties the plot with no drop; same soil kept — doc `docs/mechanics/plants.md:97`, code `src/game/sim/feature-field/field.helpers.ts:260`, test `src/game/sim/world.test.ts:518`, `:1603` (the title of `:1603` says "with compostable drop"; its assertions check there is no drop).
- [ ] 21. A growing plant drinks `waterUsePerSec` and `PLANT_FERT_PER_SEC × fertUseMul` fertilizer (0.00085 per second); a ripe plant drinks nothing. `fertUseMul`: carrot 1, potato 1.33, wheat 1.33, tomato 1.33, raspberry 0.8, grape 0.8, vanilla 0.5, sugar-cane 1.5, chilli 1.66 — doc `docs/mechanics/plants.md:7`, `:77`, code `src/game/sim/feature-field/field.ts:124`, `src/game/defs/crops.ts:23`, `src/game/sim/soil.ts:7`, test `src/game/sim/plants.test.ts:940`.
- [ ] 22. Water band red or fertilizer band red slows growth to `STUNT` (0.67); both red to `STUNT × STUNT` — doc `docs/mechanics/plants.md:77`, code `src/game/sim/feature-field/field.ts:136`, `src/game/sim/soil.ts:8`, test `src/game/sim/world.test.ts:109`, `:1659`.
- [ ] 23. Happiness starts at `HAPPY_START` 0.5, max 1; red fertilizer drains by starve, red water drains by drown when the soil is over its mid and by wilt otherwise; both drain together; gain only when neither is red, once per green band. At 0 a growing plant becomes `rotten` if drowning, else `dead`; ripe plants do not age happiness — doc `docs/mechanics/plants.md:81`, code `src/game/sim/feature-field/field.helpers.ts:62`, `:106`, `src/game/sim/feature-field/field.ts:129`, test `src/game/sim/world.test.ts:121` (dead path only; no test for the drown → rotten path).
- [ ] 24. Ripen bakes `quality = clamp(seed quality + qualityGain(happiness) + betterGain)`: `qualityGain` is +`QUALITY_STEP` (0.25) at full happiness, 0 at 0.5, −0.25 at 0; `betterGain` is `BETTER_QUALITY` (0.04) × tier × happiness, only for potato, wheat, tomato, raspberry, grape — doc `docs/mechanics/plants.md:30-33`, code `src/game/sim/world.ts:758`, `src/game/defs/varieties.ts:176`, `src/game/defs/skills.ts:40-57`, test `src/game/sim/plants.test.ts:1321`.
- [ ] 25. Roll chance is `quality² × 0.015 + 0.005 if better-{crop} + 0.01 if crossbred + 0.001 × familiarity`; crossbreed is a growing or ripe plant of the same crop and a different Variety within 1 cell (Chebyshev), not the plot itself, not dead or rotten; the roll key includes `round(quality × 10000)` — doc `docs/mechanics/plants.md:41-52`, code `src/game/defs/varieties.ts:72-76`, `:197`, `src/game/sim/feature-field/field.helpers.ts:156`, `:166`, test `src/game/sim/plants.test.ts:1789`, `:1833`.
- [ ] 26. `nextVariety`: base goes to the crop's `variant`, or to its `heirloom` when it has none; `variant` goes to `heirloom`; heirlooms and base-only crops do not roll — doc `docs/mechanics/plants.md:39`, code `src/game/defs/varieties.ts:186`, test `src/game/sim/plants.test.ts:1789`.
- [ ] 27. Variety table per crop (carrot, vanilla, chilli, sugar-cane, grass base only; potato `bintje`; wheat `red-fife`; tomato `green-zebra`, `san-marzano`; raspberry `black-raspberry`; grape `concord`, `keknyelu`; apple `kingston-black`, `pink-lady`; apricot `blenheim`, `klosterneuburger`; olive `arbequina`; cherry `bing`); six heirlooms, two per purpose — doc `docs/items/crops.md:9-24`, `docs/mechanics/plants.md:15`, `:21`, code `src/game/defs/varieties.ts:111-141`, no test of the whole table.
- [ ] 28. `purposeMul`: base 1 everywhere; variant 1.4 on its purpose and 0.8 off; heirloom 1.8 on and 0.6 off; it multiplies sale only — doc `docs/mechanics/plants.md:21`, code `src/game/defs/varieties.ts:42`, `:221`, test `src/game/sim/plants.test.ts:1365` (market.quality).
- [ ] 29. `statsOf`: sale = `CROPS.sale × qualityMul(quality) × purposeMul(variety, 'produce') × skill sale muls × CROPS.saleMul`; grow seconds × `VARIETY_GROW[tier]` ÷ grow speed; tolerances × `VARIETY_TOL[tier]` with floor `TOL_MIN` 0.25; rot seconds × `VARIETY_ROT[tier]` — doc `docs/mechanics/plants.md:62-69`, code `src/game/sim/modifiers.ts:26`, `src/game/defs/crops.ts:233`, test `src/game/sim/plants.test.ts:167`.
- [ ] 30. Vanilla `saleMul` is a flat 1, so base vanilla sells at 24 like raspberry — doc `docs/mechanics/plants.md:153`, code `src/game/defs/crops.ts:127`, test `src/game/sim/plants.test.ts:167`.
- [ ] 31. Chilli grows in 190 s (slower than potato 120, faster than vanilla 360), rots in 720 s (longer than potato 600), base only, no `unlock-chilli`, pack shown and sold after `unlock-infusion` — doc `docs/mechanics/plants.md:155`, code `src/game/defs/crops.ts:129`, `src/game/defs/research.ts:385`, test `src/game/sim/plants.test.ts:1676`.
- [ ] 32. `packSku` is `pack-{crop}` except vanilla (none); `pack-grass` exists; no olive or vanilla pack — doc `docs/mechanics/plants.md:147`, code `src/game/sim/ids.ts:69`, test `src/game/sim/plants.test.ts:1717`, `:182`.
- [ ] 33. Pack gates: tomato and grape shown at start, bought after `unlock-advanced-plants`; raspberry after `unlock-raspberry` (child of advanced plants); sugar-cane shown and bought after `unlock-fermentation`; grass shown at start, bought after `unlock-landscaping` — doc `docs/items/crops.md:26`, code `src/game/defs/research.ts:381-385`, `:447`, test `src/game/sim/plants.test.ts:174`, `:1730`.
- [ ] 34. `AnnualId` list and olive as `TreeId`; a tree seed on a tilled plot does nothing — doc `docs/mechanics/plants.md:157`, code `src/game/sim/feature-field/field.helpers.ts:202`, test `src/game/sim/plants.test.ts:1689`.
- [ ] 35. Sowing grass on an `empty` plot makes turf with variant from `gen.at(3, col, row)`; turf drinks `GRASS_WATER_PER_SEC` (0.0012), matures over `GRASS_GROW` (a quarter day), then becomes untilled soft grass cover with hardness 0 and no soil — doc `docs/mechanics/plants.md:58`, code `src/game/sim/feature-field/field.helpers.ts:329`, `src/game/sim/feature-field/field.ts:93`, test `src/game/sim/plants.test.ts:1730`.
- [ ] 36. Tend: owns `tending`, empty hand, growing, not yet tended; work `TEND_WORK` (0.7 s); +0.1 happiness capped at max; once — doc `docs/mechanics/plants.md:93`, code `src/game/sim/feature-field/field.helpers.ts:390`, `src/game/sim/queue.ts:399`, no test for annual tend (trees only at `src/game/sim/plants.test.ts:1043`).
- [ ] 37. Graft: same crop, target not heirloom, annual `growing` or tree `juvenile < 1`; work `GRAFT_WORK` (5 s); annual takes the graft's Variety and quality, tree takes Variety only; one graft consumed — doc `docs/mechanics/plants.md:105`, code `src/game/sim/feature-field/field.helpers.ts:445`, `src/game/defs/items.ts:37`, test `src/game/sim/plants.test.ts:1401`, `:1418`, `:1438`, `:1445`.
- [ ] 38. Neighbour-need Varieties `keknyelu`, `pink-lady`, `bing`; reach `NEIGHBOUR_REACH` 2 (Chebyshev); a neighbour is the same crop, not heirloom, and either a growing annual with no red band or a mature tree that is not a trunk; a lone annual does not gain maturity but still drinks and ages — doc `docs/mechanics/plants.md:109`, code `src/game/defs/varieties.ts:166`, `src/game/defs/items.ts:39`, `src/game/sim/feature-field/field.helpers.ts:131`, `src/game/sim/feature-field/field.ts:137`, test `src/game/sim/plants.test.ts:1500`, `:1516`, `:1546`.
- [ ] 39. Ripe fruit loses `dt / (rotSeconds × jamRotMul)` freshness; `jamRotMul` is 1 + 0.15 × `jam` rank when freshness is below 0.5; at 0 the plot becomes `rotten` — doc `docs/mechanics/plants.md:85`, code `src/game/sim/feature-field/field.ts:149`, `src/game/defs/skills.ts:59`, test `src/game/sim/world.test.ts:1433`, `src/game/sim/plants.test.ts:907`.
- [ ] 40. Picked fruit keeps rotting; freezer slots rot at `FREEZER_ROT_MUL` (0.2); a stack at 0 becomes `{ kind: 'rotten', cls, count, createdAt: clock.day }` in place; `freshMul(f)` is 1 at 0.8 and above, else `f / 0.8` — doc `docs/mechanics/plants.md:85`, code `src/game/sim/tick.ts:53`, `src/game/defs/crops.ts:263`, test `src/game/sim/plants.test.ts:289`, `:309`, `src/game/sim/world.test.ts:1445`.
- [ ] 41. At the day change, rotten items on the ground older than `ROTTEN_GROUND_DAYS` (3) are removed; held and stored rotten stays; merging two rotten stacks keeps the smaller `createdAt` — doc `docs/mechanics/plants.md:89`, code `src/game/sim/tick.ts:93`, `:162`, `src/game/sim/item.ts:1024`, no test.
- [ ] 42. Planting a tree seed: the clicked cell is the foot, the cell above is `base`; both untilled, soft, owned, cover bare or grass; the cell below is untouched — doc `docs/mechanics/plants.md:113`, `:159`, code `src/game/sim/feature-field/field.helpers.ts:202`, `:312`, test `src/game/sim/world.test.ts:762`.
- [ ] 43. Shovel on a tree drops `{ kind: 'tree-seed', tree, variety, quality: 0 }` and both cells become bare soft ground — doc `docs/mechanics/plants.md:113`, code `src/game/sim/feature-field/field.helpers.ts:248`, test `src/game/sim/world.test.ts:735`.
- [ ] 44. Soil: tilled water max 2, mid 1, fertilizer max 1; tree water max 10, mid 5, fertilizer max 2; water clamps to 0..max; `drowning` means water above mid; feed clamps to fertilizer max — doc `docs/mechanics/soil.md:13-21`, `:81`, code `src/game/sim/soil.ts:3-6`, `:23-25`, `:49`, test `src/game/sim/soil.test.ts:14`.
- [ ] 45. Tilling untilled ground gives `empty` with water `SOIL_TILL_WATER` (0.75), fertilizer `goodness(col, row)` and `weedChance` `WEED_CHANCE` (0.03) — doc `docs/mechanics/soil.md:55`, `:77`, code `src/game/sim/feature-field/field.helpers.ts:228`, `src/game/sim/soil.ts:5`, test `src/game/sim/world.test.ts:227`.
- [ ] 46. Shovel time on untilled ground is `workSeconds × (1 + DIG_HARD_SPAN × hardness)` with `DIG_HARD_SPAN` 1.25; soft costs 1 use, hard 2; very-hard refuses the shovel; pickaxe turns very-hard into `infertile` — doc `docs/mechanics/soil.md:57-61`, code `src/game/sim/queue.ts:662`, `src/game/sim/feature-field/field.helpers.ts:232`, `:283`, `src/game/defs/items.ts:5`, test `src/game/sim/soil.test.ts:65`, `src/game/sim/world.test.ts:622`, `:651`, `:666`.
- [ ] 47. Ground tiers from goodness: below `VERY_HARD_MAX` (0.2) very-hard, below `HARD_MAX` (0.34) hard, else soft; hardness is `1 − goodness` and is stored; clearing a rock, a tree, the start clearing and grown grass write hardness 0 — doc `docs/mechanics/soil.md:31-51`, code `src/game/sim/noise.ts:4-5`, `:33-40`, `src/game/sim/gen.ts:62`, test `src/game/sim/soil.test.ts:49`.
- [ ] 48. The start-area boost fades with distance from the door (falloff 8) and reaches 0 at radius 16; the start clearing inside radius 8 forces soft ground without rewriting goodness — doc `docs/mechanics/soil.md:41`, code `src/game/sim/noise.ts:14-27`, `src/game/sim/gen.ts:123-145`, test `src/game/sim/world.test.ts:726`.
- [ ] 49. Burrow: shovel extract takes `workSeconds × BURROW_MUL`, 1 use, does not till, cover becomes bare with the same ground and hardness; pickaxe on a burrow does nothing — doc `docs/mechanics/soil.md:63`, code `src/game/sim/feature-burrow/burrow.ts:289`, `src/game/sim/queue.ts:665`, `src/game/sim/prompt.ts:782`, test `src/game/sim/feature-burrow/burrow.test.ts:178`.
- [ ] 50. Bands: water band green within tolerance of mid, red at `(mid + tol) / 2` or more away, else orange; fertilizer band green at `max − tol` or more, red at half that or less — doc `docs/mechanics/soil.md:69-71`, code `src/game/sim/soil.ts:29-41`, no direct test.
- [ ] 51. Fertilizer bag and compost top a tilled plot to 1 or a tree to 2, spend only the gap, and an empty bag leaves the hand; bag 8 L (`FERT_BAG_LITERS`), compost 4 L (`COMPOST_LITERS`); fertilizer sold from the start at the Additive store — doc `docs/mechanics/soil.md:25-27`, `docs/items/fertilizer.md:3-5`, code `src/game/sim/feature-field/field.helpers.ts:367`, `src/game/defs/items.ts:59-60`, `src/game/defs/research.ts:408`, test `src/game/sim/plants.test.ts:925`.
- [ ] 52. Weed spray is an additive-store bag (`ADDITIVE_IDS` holds it, bag 30 L), gated on `unlock-better-tools`, does not feed soil — doc `docs/items/fertilizer.md:7`, code `src/game/sim/building.ts:1321`, test `src/game/sim/plants.test.ts:688`.
- [ ] 53. Stage: maturity below 0.33 is sprout, then grow, ripe, dead — doc `docs/mechanics/plants.md:77`, code `src/game/sim/plant.ts:28`, no test.
- [ ] 54. Stats are cached by crop and Variety and cleared when `modGen` changes — doc `docs/mechanics/plants.md:71`, code `src/game/sim/world.ts:745`, no test.
