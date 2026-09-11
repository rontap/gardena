# Plants

Crop table is `CROPS`. Tree juvenile / fruit intervals are `TREES`. Variety tables are `defs/varieties.ts`. Crop list and Variety rows: [[items/crops]].

`AnnualId` includes `'grass'`. `Plant.crop` is `Exclude<AnnualId, 'grass'>`. Classes: carrot potato root; wheat sugar-cane grain; else fruit. Chilli fruit.

Fields on `CROPS`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `sale`, `seed`, `rotSeconds`. Optional `saleMul` number; vanilla only — preference. Absent → 1. `fertUseMul` 1 is `PLANT_FERT_PER_SEC`. Trees 0.

Grow days = `days(growSeconds)` — derived, [[mechanics/day]]. Drink L/day = `waterUsePerSec × DAY_SECONDS` — derived.

`PACK_N` packs: `SKUS` `pack-*` for annuals that have a pack. `packSku(crop)` is `pack-{crop}` except vanilla (`undefined`). `packSku('grass')` is `pack-grass`. A bought pack is `'base'` at `seedBankQuality(skillTier('seed-bank'))`, quality 0 without that skill — [[mechanics/family]]. Carrot / potato / wheat start unlocked. Pack gates [[mechanics/research]]. Vanilla has no pack and no research row; seeds are a contract prize — [[mechanics/contracts]]. Tree seeds likewise. Chilli pack and mill: [[mechanics/infusion]] `infusion.chilli`. Sugar cane mill: [[mechanics/machines]] `machines.sugar`. Olive is `TreeId`. Trees have no pack.

## Variety

A ladder. `'base'` → `variant` → `heirloom`, one tier at a time. Set when the seed goes in the ground; changed after only by graft or by the roll at ripen. A crop carries at most one `variant` and at most one `heirloom`. `'base'` is legal on every `CropId`. Every other id belongs to exactly one crop. `Plant.variety` required `VarietyId`. Illegal: optional `variety`. Illegal: a `variety` whose `VARIETY[v].crop` is not `Plant.crop`. Illegal: two varieties of one crop sharing a tier. Carrot, vanilla, sugar-cane, chilli and grass list `['base']` only. Names: [[items/crops]].

### Purpose

One axis, not three. Each named variety is good for exactly one of the three things a crop can become, and worse at the other two. `'base'` is neutral everywhere. **produce** is the fruit sold as it is. **processed** is the jam machine and the mill. **alcohol** is the still and the barrel. Which of those a crop can reach at all is not a variety property — `MILL_RECIPES` `JAM_CROPS` `STILL_CROPS` `BARREL_CROPS`.

`purposeMul(variety, path)` — `1` for `'base'`; else `PURPOSE_MUL[tier].on` when `path` is that variety's purpose, `PURPOSE_MUL[tier].off` otherwise. `PURPOSE_MUL` preference. It multiplies the sale of the good made on that path and nothing else: not yield, not speed, not input count. Six heirlooms, two per purpose. Names and descriptions: [[agents/game-text-writer]].

`VARIETY_GROW`, `VARIETY_TOL`, `VARIETY_ROT` — `Record<VarietyTier, number>`. Tuned-to so a `'base'` plant grows, drinks, and rots as it does today. `variant` sits between `'base'` and `'heirloom'`.

### At ripen

No grow stream. No `World.ripenN`.

```
quality = clamp(seed.quality + qualityGain(happiness) + betterGain, 0, 1)
```

`qualityGain(h)` is piecewise linear: `+QUALITY_STEP` at `HAPPY_MAX`, `0` at `HAPPY_START`, `−QUALITY_STEP` at `0`. `QUALITY_STEP` preference. `betterGain` is `BETTER_QUALITY × owned tier × (h / HAPPY_MAX)` when the player owns `better-{crop}`, else 0. `better-*` maxTier 1. No `better-carrot` `better-vanilla` `better-sugar-cane` `better-chilli` `better-grass`. Tree `better-*` does not run here — [[mechanics/family]] `family.better-set`. `freshness = 1`. Variety then rolls.

### Variety roll

`plants.variety-roll` — Baking quality is followed by one roll on that plot. Annuals only. A tree's variety comes from the graft — [[mechanics/trees]]. `upgradeVariety` takes a `Plant`, so a tree cannot reach it.

`nextVariety(crop, variety)` is the tier above: `'base'` → that crop's `variant`, or straight to its `heirloom` when it has no `variant`; `variant` → `heirloom`. `heirloom`, and a crop whose `VARIETIES` row is `['base']`, have none — those plants do not roll.

```
chance = quality² × MAX_QUALITY_VAR_IMPACT
       + EXPERIENCED_VAR_BONUS   iff the player owns better-{crop}
       + CROSSBREED_VAR_BONUS    iff crossbred
```

`quality` is the number just baked, not the seed's. Constants preference. No floor: a quality-0 plant whose owner holds neither bonus never rolls. Baked quality is a key of the `variety` stream because a plot can ripen twice in one day.

Crossbred: a cell within `CROSSBREED_REACH` Chebyshev of the plot holding a `growing` or `ripe` plant, same crop, a **different** `variety`. The plot itself does not count. `dead` and `rotten` do not count. A tree is never a crossbreed neighbour.

`variety.at(col, row, day, round(quality × 10000))` — [[mechanics/rng]]. Hit: `variety` becomes `nextVariety`, `quality` becomes 0. Miss: nothing changes. The plant is ripe either way. Quality resetting is what stops one high-quality seed line from walking both tiers in a row. `ripe` is reached before the roll, so a neighbour-need heirloom minted here does not stall the plant that made it.

## Grass

Silo crop, `'base'` only. Not a `Plant`. No fruit. No market value. `'grass'` is `AnnualId` so silo / seeds / `packSku` match chilli. No `CROPS.grass` row. `statsOf` is not called on `'grass'`. Pack `GRASS_PACK`, `'base'` quality 0. Show `start`, buy `unlock-landscaping`. Sold at the Seed silo — [[mechanics/inventory]] `inventory.grass-silo` [[ui/store]]. Item `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0; count }`.

Sow / plant on `empty` → `{ kind: 'turf'; soil; turf: Turf }`. Never a `Plant`. Prompt **Sow grass**. Seeder the same — [[mechanics/vehicles]] `vehicles.seeder`. `Turf` holds `maturity` and `variant` 0–2 picked by `gen.at(3, col, row)` — [[mechanics/rng]]. Mill recipe `'grass'` is cut grass `{ kind: 'grass' }`, not this seed crop. Turf tick and untilled cover unchanged: drinks `GRASS_WATER_PER_SEC`, matures over `GRASS_GROW`. No happiness, no fertilizer draw, no water band, no death. — [[architecture/tick]]. At `maturity >= 1` the plot becomes untilled soft grass cover — the tilled bed and its `Soil` are gone.

## Stats

`statsOf(crop, variety, quality, mods)`:

- sale: `CROPS.sale × qualityMul(quality) × purposeMul(variety, 'produce') × Π saleMul` × (`CROPS.saleMul` or 1)
- grow: `(CROPS.growSeconds × VARIETY_GROW[tier]) / growSpeed`
- drink: `CROPS.waterUsePerSec × waterUseMul`
- fert: `PLANT_FERT_PER_SEC × fertUseMul`
- tols: `tolerance(base, tier) = max(TOL_MIN, base × VARIETY_TOL[tier])`
- rot: `CROPS.rotSeconds × VARIETY_ROT[tier]`

`TOL_MIN` — preference. Cache keys `crop` + `variety` for `modGen`; `qualityMul` applies at sale — [[architecture/tick]]. Vanilla `saleMul` is a flat number — preference.

## Grow

Seed on `empty`, `crop !== 'grass'` → `growing`, same `Soil`, same `variety`, same `quality`. Planting does not change water. `Plant.happiness = HAPPY_START` — preference. `Plant.tended` required, starts `false`, same instance through ripe / dead. `bio` starts true; soil non-organic marks the plant. `crop === 'grass'` → turf, not a `Plant`.

Stage: maturity `< 0.33` sprout, else grow, then ripe, dead. While growing: drink water and `PLANT_FERT_PER_SEC × fertUseMul` — [[mechanics/soil]]. Trees `fertUseMul` 0. `STUNT` — preference. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`. Ripe does not drink. Sprinklers skip ripe / dead / rotten. A neighbour-need variety does not raise `maturity` without a neighbour. Water, fertilizer, happiness, stunt and death still tick.

## Happiness

Does not set growth speed (stunt does). Does not set sale (quality does). Drown: `HAPPY_DROWN_SECONDS`, water red and `drowning`. Wilt: `HAPPY_WILT_SECONDS`, water red, dry. Starve: `HAPPY_STARVE_SECONDS`, fert red. Gain: `HAPPY_GAIN_SECONDS`, each green band, only if neither bar is red. Seconds 50% → 0. Preference. Clamp `0..HAPPY_MAX`. Both-red drains starve and water together. Happiness 0 while growing: drown → `rotten`; wilt or starve → `dead`. Same soil. Ripe does not die of water or fertilizer. It only rots.

## Freshness

On the plant, while ripe: `freshness -= dt / (rotSeconds × jamRotMul)`. `<= 0` → `{ kind: 'rotten', soil, crop }`. `jamRotMul` 1 unless daughter owns `jam` and freshness `< 0.5` — [[mechanics/family]]. After pick, fruit keeps rotting in hand, house, chest, ground, quad, and harvest trailer until sold. `tickFreshness`. Freezer slots rot at `FREEZER_ROT_MUL` of the open rate. `<= 0` replaces that slot with `{ kind: 'rotten'; cls; count; createdAt: clock.day }`. Convert in place, no auto-merge. `createdAt` is required; merging two rotten stacks keeps the smaller of the two. Sugar does not tick. Mill hopper is units, no freshness. Freshness-0 fruit no longer exists as an item after tick. `freshMul(f) = f >= 0.8 ? 1 : f / 0.8` — preference at 0.8. Harvest bakes `unitSale = stats.sale`. Sale uses `freshMul` of current freshness — [[mechanics/market]].

## Rotten on the ground

`clearOldRotten` runs at the seam, `clock.day` already incremented, before `mintSeam`: every `World.drops` entry whose item is `rotten` and whose `clock.day - createdAt >= ROTTEN_GROUND_DAYS` leaves the array. `ROTTEN_GROUND_DAYS` — preference. A rotten stack in a hand, chest, freezer, quad, or trailer is not touched. Merge same crop+variety: weighted `unitSale`, `freshness`, and `quality`. Different variety never merges.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. Legal: player owns `tending`, empty hand, growing, `tended === false`. Work `TEND_WORK`. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`. Not ripe. Not twice. Trees: [[mechanics/trees]] `trees.tend` — [[mechanics/family]].

## Harvest / shovel

Ripe annual including sugar-cane, empty hand: one fruit, current freshness, `variety` and `quality` from the plant, `cut: false`, plot `empty` same soil. Same crop+variety in hand: merged onto that stack up to the cap — [[mechanics/inventory]]. Shovel growing or ripe annual: one seed, same variety, quality as the plant (growing: planted quality; ripe: baked). Same soil. Shovel dead or rotten: empty, no drop.

Empty hand on a `dead` or `rotten` plot: `{ act: 'pickup'; at }`, prompt **Pick up**, no work. `plotPick` is the item. Plot becomes `empty` on the same `Soil`. Same kind in hand merges one onto it up to the cap; a full hand says `HAND_FULL`. Both compost at `COMPOST_VALUE` 1.

Harvest boom: [[mechanics/vehicles]]. Growing `> 0.8` bakes quality as ripen. Grinder: [[mechanics/machines]] `machines.grind-tree`.

## Graft

`{ kind: 'graft'; crop; variety; quality; count }`. Stacks on crop + variety, quality averaged. Not compost. Furnace takes it at the green rate — [[mechanics/inventory]]. A graft is never planted. `Intent` `{ act: 'graft'; at }`. Hold a graft. Work `GRAFT_WORK` — preference. Prompt **Graft**. Legal targets, same crop, graft's tier is anything, **target's variety tier is not `heirloom`**: annual `growing`; tree `juvenile < 1`. Complete: the target's `variety` and `quality` become the graft's, one graft is consumed. Maturity, juvenile progress, `trunk`, happiness, `tended`, organic and the soil are untouched. Grafting a `Tree` sets `variety` only — there is no `Tree.quality`. Sources: axe on a mature tree — [[mechanics/trees]] `graft.axe`; research station — [[mechanics/machines]] `station.io`.

## Needs a neighbour

`keknyelu`, `pink-lady`, `bing`. `NEIGHBOUR_IDS`. `NEIGHBOUR_REACH` preference. Chebyshev, from the plot, or from either cell of a 1×2 tree. A valid neighbour: same crop, variety tier not `heirloom`, and annual `growing` with neither band red, or tree `juvenile >= 1`, `trunk === false`. Without one, annual `maturity` does not increase; tree `fruit` does not increase and the seam does not turn `pending` into `on`. Juvenile still grows. Water, fertilizer, happiness, stunt, death still tick. Look [[ui/inspect]].

## Trees

Class `Tree`. Cell `kind: 'tree'`. Same instance on a vertical 1×2. Soft untilled only. Drinks nothing. No fertilizer. No `Plant`. `Tree.variety` required. Yield, drop, ping: [[mechanics/trees]]. Plant tree seed: hold a tree seed, `{ act: 'plant' }`. The clicked cell is the **foot**; the pair is it and the cell **above**. Both untilled, `ground === 'soft'`, owned. Cover bare or grass — grass clears to bare. New tree `juvenile = 0`, `base` at the upper cell, `variety` from the seed. Shovel: `{ kind: 'tree-seed'; tree; variety: Tree.variety; quality: 0 }`, both cells bare soft.

## Invariants

`plants.drink` — Growing drinks `waterUsePerSec` and `PLANT_FERT_PER_SEC × fertUseMul`; ripe does not drink; trees draw 0 fertilizer; water red or fert red: growth × `STUNT`; both red: `STUNT × STUNT`.

`plants.happy` — Happiness starts `HAPPY_START`; drown drain `HAPPY_DROWN_SECONDS`; wilt `HAPPY_WILT_SECONDS`; starve `HAPPY_STARVE_SECONDS`; happiness 0 while growing: drown → `rotten`; wilt/starve → `dead`; ripe does not die of water or fertilizer.

`plants.ripen` — Ripen: `freshness = 1`; `quality = clamp(seed.quality + qualityGain(happiness) + betterGain, 0, 1)`; variety unchanged; no roll.

`plants.fresh` — Picked fruit keeps ticking freshness (hand, house, chest, ground, quad, harvest trailer) until sold; freezer slots rot at `FREEZER_ROT_MUL` of the open rate; mill hopper is units, no freshness; `<= 0` replaces that slot with `{ kind: 'rotten'; cls; count }` in place, no auto-merge; illegal: fruit with `freshness <= 0` after tick; `freshMul(f) = f >= 0.8 ? 1 : f / 0.8`; jam is rot, not a sale floor.

`plants.variety-roll` — Baking quality is followed by one roll on that plot, annuals only; chance is `quality² × MAX_QUALITY_VAR_IMPACT` plus `EXPERIENCED_VAR_BONUS` and `CROSSBREED_VAR_BONUS` when those hold; hit: `variety` becomes `nextVariety`, `quality` becomes 0; baked quality is a key of the `variety` stream.

`quality.ripen` — No roll at ripen; bought seed quality 0 stays 0 if happiness stays `HAPPY_START`; `betterGain` only if `better-{crop}` owned; tree fruit quality is 0.

`quality.sale` — Fruit sale is `CROPS.sale × qualityMul(quality) × purposeMul(variety, 'produce') × Π saleMul`; `qualityMul(0)` matches today's `'base'` sale.

`variety.purpose` — Every named Variety has exactly one `purpose`; `purposeMul(variety, path)` pays `PURPOSE_MUL[tier].on` on that purpose and `PURPOSE_MUL[tier].off` on the other two; `'base'` is 1 on all three; a crop carries at most one `variant` and at most one `heirloom`; six heirlooms, two per purpose.

`variety.identity` — `Plant.variety`, `Tree.variety`, and `variety` on seeds, fruit, grafts are required `VarietyId`; illegal: optional `variety`; illegal: a `variety` whose `VARIETY[v].crop` is not the item's `crop`; `'base'` is legal on every `CropId`; set at plant; graft is the only later change besides the ripen roll.

`variety.neighbour` — `keknyelu` `pink-lady` `bing` need a neighbour in Chebyshev `NEIGHBOUR_REACH`; without one, annual `maturity` does not increase; tree `fruit` does not increase and the seam does not turn `pending` into `on`; juvenile still grows; water, fertilizer, happiness, stunt, death still tick.

`graft.attach` — A graft is never planted; same crop, target variety tier not `heirloom`; annual `growing`; tree `juvenile < 1`; complete: target `variety` and `quality` become the graft's; one consumed; maturity, juvenile, `trunk`, happiness, `tended`, organic, soil untouched.

`quality.carry` — Grind seed quality equals the fruit's quality; graft copies quality onto the target; machine output quality is the mean of what went in — [[mechanics/machines]] `machines.quality-carry`.

`plants.harvest` — Empty-hand harvest of ripe annual including sugar-cane: one fruit, current freshness, plant `variety` and `quality`, `cut: false`, `unitSale = stats.sale`, plot `empty` same soil; same crop+variety in hand: merged up to the stack cap; shovel growing/ripe annual: one seed, same variety, plant quality; shovel dead, rotten, weed, or grass: no drop.

`plants.pick-spoiled` — Empty hand on `dead` or `rotten` is `{ act: 'pickup'; at }`, no work: one `{ kind: 'dead' | 'rotten'; cls; count: 1 }`, `createdAt` on the rotten one, plot `empty` on the same `Soil`; same kind in hand merges one up to the cap; a full hand says `HAND_FULL`; the shovel path still clears the plot and drops nothing.

`plants.rot-ground` — `clearOldRotten` at the seam, before `mintSeam`, drops every `World.drops` entry that is `rotten` with `clock.day - createdAt >= ROTTEN_GROUND_DAYS`; rotten held, stored, or carried never expires; `createdAt` is required and is the day the fruit rotted; a merge keeps the smaller of the two.

`plants.packs` — Crop stats are `CROPS`; bought packs are `'base'` at quality 0; `packSku` is `pack-{crop}` except vanilla (`undefined`); `pack-chilli` exists; `packSku('grass')` is `pack-grass`; no tree pack; no olive pack; no vanilla pack.

`plants.grass` — `'grass'` is `AnnualId`, `'base'` only; item `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0; count }`; `Plant.crop` excludes `'grass'`; sow / plant / seeder on `empty` writes turf, never a `Plant`; turf tick and untilled cover unchanged; `pack-grass` sold at the Seed silo after `unlock-landscaping`; no `{ kind: 'grass-seeds' }`.

`plants.tend` — Tend once: player owns `tending`, empty hand, growing, `tended === false`; not ripe; then `tended = true`; trees: [[mechanics/trees]] `trees.tend`.

`plants.vanilla` — Vanilla `statsOf` sale uses vanilla `saleMul`, a flat number; one variety; base vanilla sale matches raspberry; mill yields vanilla-extract, not stall extract — [[mechanics/infusion]] `infusion.extract`.

`plants.chilli` — Chilli `growSeconds` slower than potato, faster than vanilla; `rotSeconds` longer than potato; one Variety `'base'`; no `unlock-chilli`; `pack-chilli` show and buy `unlock-infusion`; mill yields flakes — [[mechanics/infusion]] `infusion.chilli`.

`plants.annual` — `AnnualId` is carrot potato wheat tomato raspberry grape vanilla chilli sugar-cane grass; `Plant.crop` is `Exclude<AnnualId, 'grass'>`; olive is `TreeId`; tree seed on a tilled plot is a no-op.

`plants.tree-foot` — Planting a tree seed at `at` puts the tree's foot on `at` and its `base` on `{ col: at.col, row: at.row - 1 }`; `at.row + 1` is untouched.

`plants.kinds` — No `'berry'` stall key; no `Shrub`; no `{ kind: 'berry' }` `{ kind: 'shrub' }`.
