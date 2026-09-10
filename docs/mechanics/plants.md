# Plants

Crop table is `CROPS`. Tree juvenile / fruit intervals are `TREES`. Variety tables are `defs/varieties.ts`.

`AnnualId`, `TreeId`, `CropId` — `sim/ids.ts`. `AnnualId` += `'grass'`. `Plant.crop` is `Exclude<AnnualId, 'grass'>`.

Classes: carrot potato root; wheat sugar-cane grain; else fruit. Chilli fruit.

Fields on `CROPS`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `sale`, `seed`, `rotSeconds`. Optional `saleMul` number; vanilla only — preference. Absent → 1. `fertUseMul` 1 is `PLANT_FERT_PER_SEC`. Trees 0.

Grow days = `days(growSeconds)` — derived, [[mechanics/day]]. Drink L/day = `waterUsePerSec × DAY_SECONDS` — derived.

`PACK_N` packs: `SKUS` `pack-*` for annuals that have a pack. `packSku(crop)` is `pack-{crop}` except vanilla (`undefined`). `packSku('grass')` is `pack-grass`. A bought pack is `'base'` at `seedBankQuality(skillTier('seed-bank'))`, quality 0 without that skill — [[mechanics/family]]. Carrot / potato / wheat start unlocked. Tomato grape via [[mechanics/research]] plants. Raspberry `reveal: unlock-tomato | unlock-grape`. Sugar cane `unlock-fermentation`; ripe cane is fruit; mill for sugar — [[mechanics/machines]]. Chilli `unlock-infusion`; ripe chilli is fruit; mill for flakes — [[mechanics/infusion]]. Grass `unlock-landscaping`; sow is turf, not a `Plant`. Olive is `TreeId`. Trees have no pack.

Vanilla has no pack and no research row. Seeds are a contract prize — [[mechanics/contracts]]. Tree seeds likewise: the four starting `'base'` seeds and the one wild apple are the only ones not won from a contract.

Chilli has a pack. No chilli research row. `pack-chilli` show and buy `unlock-infusion`, `PACK_N` at 10, `'base'` quality 0. `growSeconds` 190, slower than potato, faster than vanilla. `rotSeconds` longer than potato. Mill for flakes — [[mechanics/infusion]] `infusion.chilli`.

## Variety

A ladder. `'base'` → `variant` → `heirloom`, one tier at a time. Set when the seed goes in the ground; changed after only by graft — [[#Graft]] — or by the roll at ripen — [[#Variety roll]]. A crop carries at most one `variant` and at most one `heirloom`, so the climb is at most two steps.

```
VarietyTier = 'base' | 'variant' | 'heirloom'
VarietyId   = 'base' | 'bintje' | 'red-fife' | 'green-zebra' | 'san-marzano'
            | 'black-raspberry' | 'concord' | 'keknyelu'
            | 'kingston-black' | 'pink-lady' | 'blenheim' | 'klosterneuburger'
            | 'arbequina' | 'bing'
Purpose     = 'produce' | 'processed' | 'alcohol'
```

`'base'` is legal on every `CropId`. Every other id belongs to exactly one crop, and a crop carries **at most one** `variant` and **at most one** `heirloom`. `VARIETY: Record<Exclude<VarietyId, 'base'>, { crop: CropId; tier: 'variant' | 'heirloom'; purpose: Purpose }>` and `VARIETIES: Record<CropId, readonly VarietyId[]>`, both complete maps, `defs/varieties.ts`. Carrot, vanilla, sugar-cane, chilli and grass list `['base']` only.

`Plant.variety` required `VarietyId`. Illegal: optional `variety`. Illegal: a `variety` whose `VARIETY[v].crop` is not `Plant.crop`. Illegal: two varieties of one crop sharing a tier.

### Purpose

One axis, not three. Each named variety is good for exactly one of the three things a crop can become, and worse at the other two. `'base'` is neutral everywhere.

**produce** is the fruit sold as it is. **processed** is the jam machine and the mill. **alcohol** is the still and the barrel. Which of those a crop can reach at all is not a variety property — `MILL_RECIPES` `JAM_CROPS` `STILL_CROPS` `BARREL_CROPS` in `sim/ids.ts` own that.

`purposeMul(variety, path)` — `1` for `'base'`; else `PURPOSE_MUL[tier].on` when `path` is that variety's purpose, `PURPOSE_MUL[tier].off` otherwise. `PURPOSE_MUL` `variant` 1.4 / 0.8, `heirloom` 1.8 / 0.6 — preference. It multiplies the sale of the good made on that path and nothing else: not yield, not speed, not input count.

| crop | variant | heirloom |
|---|---|---|
| carrot | — | — |
| potato | `bintje` alcohol | — |
| wheat | `red-fife` processed | — |
| tomato | `green-zebra` produce | `san-marzano` processed |
| raspberry | — | `black-raspberry` processed |
| grape | `concord` processed | `keknyelu` alcohol |
| vanilla | — | — |
| chilli | — | — |
| sugar-cane | — | — |
| grass | — | — |
| apple | `kingston-black` alcohol | `pink-lady` produce |
| apricot | `blenheim` produce | `klosterneuburger` alcohol |
| olive | `arbequina` processed | — |
| cherry | — | `bing` produce |

Six heirlooms, two per purpose. The starter annuals carry the fewest paths and push the player toward the machines; the later crops carry both a variant and an heirloom. Names and descriptions: [[agents/game-text-writer]].

`VARIETY_GROW`, `VARIETY_TOL`, `VARIETY_ROT` — `Record<VarietyTier, number>`. Tuned-to so a `'base'` plant grows, drinks, and rots as it does today. `variant` sits between `'base'` and `'heirloom'`.

### At ripen

No grow stream. No `World.ripenN`.

```
quality = clamp(seed.quality + qualityGain(happiness) + betterGain, 0, 1)
```

`qualityGain(h)` is piecewise linear: `+QUALITY_STEP` at `HAPPY_MAX`, `0` at `HAPPY_START`, `−QUALITY_STEP` at `0`. `QUALITY_STEP` 0.25 — preference. A plant left at the happiness it was planted with hands its seed exactly what it was given; four clean generations reach the top, and a neglected one walks back down.

`betterGain` is `BETTER_QUALITY × owned tier × (h / HAPPY_MAX)` when the player owns `better-{crop}`, else 0. `better-*` maxTier 1. No `better-carrot` `better-vanilla` `better-sugar-cane` `better-chilli` `better-grass`. Tree `better-*` does not run here — trees have no happiness — [[mechanics/family]] `family.better-set`.

`freshness = 1`. Variety then rolls — [[#Variety roll]].

### Variety roll

`plants.variety-roll` — Baking quality is followed by one roll on that plot. Annuals only. A tree's variety comes from the graft — [[mechanics/trees]]; `upgradeVariety` takes a `Plant`, and `Plant.crop` is `Exclude<AnnualId, 'grass'>`, so a tree cannot reach it.

`nextVariety(crop, variety)` is the tier above: `'base'` → that crop's `variant`, or straight to its `heirloom` when it has no `variant`; `variant` → `heirloom`. `heirloom`, and a crop whose `VARIETIES` row is `['base']`, have none — those plants do not roll.

```
chance = quality² × MAX_QUALITY_VAR_IMPACT
       + EXPERIENCED_VAR_BONUS   iff the player owns better-{crop}
       + CROSSBREED_VAR_BONUS    iff crossbred
```

`quality` is the number just baked, not the seed's. `MAX_QUALITY_VAR_IMPACT` `EXPERIENCED_VAR_BONUS` `CROSSBREED_VAR_BONUS` — preference. No floor: a quality-0 plant whose owner holds neither bonus never rolls.

Crossbred: a cell within `CROSSBREED_REACH` Chebyshev of the plot holding a `growing` or `ripe` plant, same crop, a **different** `variety`. `CROSSBREED_REACH` 1 — preference. The plot itself does not count. `dead` and `rotten` do not count. No crop is both `AnnualId` and `TreeId`, so a tree is never a crossbreed neighbour.

`variety.at(col, row, day, round(quality × 10000))` — [[mechanics/rng]]. Hit: `variety` becomes `nextVariety`, `quality` becomes 0. Miss: nothing changes. The plant is ripe either way.

Quality resetting is what stops one high-quality seed line from walking both tiers in a row: the climb to `heirloom` starts from 0 again.

`ripe` is reached before the roll, so a neighbour-need heirloom minted here does not stall the plant that made it. `needsNeighbour` binds that plant's seeds, not it — [[#Needs a neighbour]].

Assumption: baked quality is a key of the `variety` stream because a plot can ripen twice in one day — carrot `growSeconds` is under `DAY_SECONDS` — and `(col, row, day)` alone would hand both plants the same roll.

## Grass

Silo crop, `'base'` only. Not a `Plant`. No fruit. No market value.

`AnnualId` += `'grass'`. `packSku('grass')` is `pack-grass`. Pack `GRASS_PACK`, `'base'` quality 0. Show `start`, buy `unlock-landscaping`. Sold at the Seed silo like `pack-chilli`. Not on Build. No extra grass store type. — [[mechanics/inventory]] `inventory.grass-silo` [[ui/store]]

Item `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0; count }`. Take from silo is that stack.

Sow / plant on `empty` → `{ kind: 'turf'; soil; turf: Turf }`. Never a `Plant`. Prompt **Sow grass**. Seeder the same — [[mechanics/vehicles]] `vehicles.seeder`. `Turf` holds `maturity` and `variant` 0–2 picked by `gen.at(3, col, row)` — [[mechanics/rng]]. Mill recipe `'grass'` is cut grass `{ kind: 'grass' }`, not this seed crop.

Turf tick and untilled cover unchanged: drinks `GRASS_WATER_PER_SEC`, matures over `GRASS_GROW = DAY_SECONDS / 4`. No happiness, no fertilizer draw, no water band, no death. — [[architecture/tick]]

At `maturity >= 1` the plot becomes `{ kind: 'untilled'; ground: 'soft'; cover: { kind: 'grass', variant } }` — the tilled bed and its `Soil` are gone. That is the point of the item: it un-tills land.

Assumption: `'grass'` is `AnnualId` so silo / seeds / `packSku` match chilli. `Plant.crop` is `Exclude<AnnualId, 'grass'>`. No `CROPS.grass` row. `statsOf` is not called on `'grass'`.

## Stats

`statsOf(crop, variety, quality, mods)`:

- sale: `CROPS.sale × qualityMul(quality) × purposeMul(variety, 'produce') × Π saleMul` × (`CROPS.saleMul` or 1)
- grow: `(CROPS.growSeconds × VARIETY_GROW[tier]) / growSpeed`
- drink: `CROPS.waterUsePerSec × waterUseMul`
- fert: `PLANT_FERT_PER_SEC × fertUseMul`
- tols: `tolerance(base, tier) = max(TOL_MIN, base × VARIETY_TOL[tier])`
- rot: `CROPS.rotSeconds × VARIETY_ROT[tier]`

`TOL_MIN` — preference. Cache keys `crop` + `variety` for `modGen`; `qualityMul` applies at sale — [[architecture/tick]].

Vanilla `saleMul` is a flat number — preference.

## Grow

Seed on `empty`, `crop !== 'grass'` → `growing`, same `Soil`, same `variety`, same `quality`. Planting does not change water. `Plant.happiness = HAPPY_START` — preference. `Plant.tended` required, starts `false`, same instance through ripe / dead. `bio` starts true; soil non-organic marks the plant. `crop === 'grass'` → turf, not a `Plant` — [[#Grass]].

Stage: maturity `< 0.33` sprout, else grow, then ripe, dead.

While growing: drink water and `PLANT_FERT_PER_SEC × fertUseMul` — [[mechanics/soil]]. Trees `fertUseMul` 0. Bands from soil vs tols.

`STUNT` — preference. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`.

Ripe does not drink. Sprinklers skip ripe / dead / rotten.

A neighbour-need variety does not raise `maturity` without a neighbour — [[#Needs a neighbour]]. Water, fertilizer, happiness, stunt and death still tick.

## Happiness

Does not set growth speed (stunt does). Does not set sale (quality does).

| | |
|---|---|
| drown | `HAPPY_DROWN_SECONDS` | water red and `drowning` |
| wilt | `HAPPY_WILT_SECONDS` | water red, dry |
| starve | `HAPPY_STARVE_SECONDS` | fert red |
| gain | `HAPPY_GAIN_SECONDS` | each green band, only if neither bar is red |

Seconds 50% → 0. Preference.

Clamp `0..HAPPY_MAX`. Both-red drains starve and water together. Happiness 0 while growing: drown → `rotten`; wilt or starve → `dead`. Same soil.

Ripe does not die of water or fertilizer. It only rots.

## Freshness

On the plant, while ripe: `freshness -= dt / (rotSeconds × jamRotMul)`. `<= 0` → `{ kind: 'rotten', soil, crop }`. `jamRotMul` 1 unless daughter owns `jam` and freshness `< 0.5` — [[mechanics/family]].

After pick, fruit keeps rotting in hand, house, chest, ground, quad, and harvest trailer until sold. `tickFreshness`. Freezer slots rot at `FREEZER_ROT_MUL` of the open rate: cold slows rot, it does not stop it and it never restores freshness. `<= 0` replaces that slot with `{ kind: 'rotten'; cls: CROPS[crop].cls; count; createdAt: clock.day }`. Convert in place, no auto-merge. `createdAt` is required on every rotten item and is the day it stopped being fruit; merging two rotten stacks keeps the smaller of the two, so a merge never buys a pile more time — [[#Rotten on the ground]]. Sugar does not tick. Mill hopper is units, no freshness. Freshness-0 fruit no longer exists as an item after tick. On-plant ripe already becomes plot rotten.

`freshMul(f) = f >= 0.8 ? 1 : f / 0.8` — preference at 0.8. Harvest bakes `unitSale = stats.sale`. Sale uses `freshMul` of current freshness — [[mechanics/market]]. Jam rot — [[mechanics/family]].

## Rotten on the ground

`clearOldRotten` runs at the seam, `clock.day` already incremented, before `mintSeam`: every `World.drops` entry whose item is `rotten` and whose `clock.day - createdAt >= ROTTEN_GROUND_DAYS` leaves the array. `ROTTEN_GROUND_DAYS` — preference. Nothing else is swept, and a rotten stack in a hand, chest, freezer, quad, or trailer is not touched — only the ground clears itself.

Shortest life is the last tick of the day it rotted, two whole days, then the first seam of the third: rot on day 4, gone at the seam that opens day 7. Clearing before `mintSeam` frees those cells, so a burrow can mint where a pile stood.

Merge same crop+variety: weighted `unitSale`, `freshness`, and `quality`. Different variety never merges.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. Legal: player owns `tending`, empty hand, growing, `tended === false`. Work `TEND_WORK`. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`. Not ripe. Not twice. Plants unchanged. Trees: [[mechanics/trees]] `trees.tend` — [[mechanics/family]].

## Harvest / shovel

Ripe annual including sugar-cane, empty hand: one fruit, current freshness, `variety` and `quality` from the plant, `cut: false`, plot `empty` same soil. Same crop+variety in hand: merged onto that stack up to the cap — [[mechanics/inventory]].

Shovel growing or ripe annual: one seed, same variety, quality as the plant (growing: planted quality; ripe: baked). Same soil. Shovel dead or rotten: empty, no drop.

Empty hand on a `dead` or `rotten` plot: `{ act: 'pickup'; at }`, prompt **Pick up**, no work — the weed and grass path. `plotPick` is the item: `{ kind: 'dead'; cls: CROPS[plant.crop].cls; count: 1 }` or `{ kind: 'rotten'; cls: CROPS[crop].cls; count: 1; createdAt: clock.day }`. Plot becomes `empty` on the same `Soil`. Holding a stack of the same kind merges one onto it up to the cap; a full hand says `HAND_FULL`; any other held item falls through to the shovel or drop path. Both compost at `COMPOST_VALUE` 1 — [[mechanics/inventory]].

Harvest boom (driven tractor, hitch harvest, steer 0, speed > 0): ripe same as empty-hand; growing `< 0.2` one seed at planted variety and quality; growing `> 0.8` fruit (plant variety, quality baked as ripen, freshness = maturity); growing mid destroyed; dead/rotten/weed items. Skip trees and turf. Cap / no slot: plant stays. — [[mechanics/vehicles]]

Assumption: harvest boom at growing `> 0.8` bakes quality as ripen.

Grinder: annual fruit including sugar-cane, and tree fruit. Sugar: refuse. Cane fruit mills to sugar — [[mechanics/machines]] `machines.grind-tree`.

## Graft

```
{ kind: 'graft'; crop: CropId; variety: VarietyId; quality: number; count: number }
```

Stacks on crop + variety, quality averaged. Not compost. Furnace takes it at the green rate — [[mechanics/inventory]].

A graft is never planted. It always attaches. New ground comes from seed; a graft changes what is already growing there.

`Intent` `{ act: 'graft'; at: Coord }`. `dest` = `at`. Hold a graft. Work `GRAFT_WORK` — preference. Prompt **Graft**. Enqueue, no new `Act` letter.

Legal targets, same crop, graft's tier is anything, **target's variety tier is not `heirloom`**:

| target | state |
|---|---|
| annual `Plant` | `growing`. Not ripe, dead, rotten, empty. |
| `Tree` | `juvenile < 1` — sapling or `trunk`. Not mature. |

Complete: the target's `variety` becomes the graft's, the target's `quality` becomes the graft's, one graft is consumed. Maturity, juvenile progress, `trunk`, happiness, `tended`, organic and the soil are untouched. An heirloom cannot be grafted over.

Sources: axe on a mature tree — [[mechanics/trees]] `graft.axe`; research station — [[mechanics/machines]] `station.io`.

Assumption: grafting a `Tree` sets `variety` only. There is no `Tree.quality` to copy onto — [[mechanics/trees]] — and tree fruit stays quality 0.

## Needs a neighbour

`keknyelu`, `pink-lady`, `bing`. `NEIGHBOUR_IDS`. `NEIGHBOUR_REACH` 2 — preference. Chebyshev, from the plot, or from either cell of a 1×2 tree.

A cell in reach is a valid neighbour when it holds:

- an annual of the same crop, variety tier not `heirloom`, `growing`, with neither the water band nor the fertilizer band red; or
- a tree of the same species, variety tier not `heirloom`, `juvenile >= 1`, `trunk === false`.

A sapling, a trunk, a ripe plant, a starving one, a dead or rotten one, and another heirloom are all not neighbours.

Without one, the plant does not advance toward fruit:

- annual: `maturity` does not increase. Water, fertilizer, happiness, stunt and death all still tick — a lonely plant can still die of thirst.
- tree: `fruit` does not increase and the seam does not turn `pending` into `on`. `juvenile` still grows, so a lone orchard can be raised and then given its neighbour.

Look line and inspect name it — [[ui/inspect]]. Copy **Needs another {crop} nearby that is not Heirloom.** / **Needs another {crop} tree nearby that is not Heirloom.**

## Trees

Class `Tree`. Cell `kind: 'tree'`. Same instance on a vertical 1×2. Soft untilled only. Drinks nothing. No fertilizer. No `Plant`. `Tree.variety` required. Yield, drop, ping: [[mechanics/trees]].

Plant tree seed: hold a tree seed, `{ act: 'plant' }`. The clicked cell is the **foot**; the pair is it and the cell **above**. Both untilled, `ground === 'soft'`, owned. Cover bare or grass — grass clears to bare. Consumes the seed. New tree `juvenile = 0`, `base` at the upper cell, `variety` from the seed, `quality` not a tree field.

Shovel: `{ kind: 'tree-seed'; tree: species; variety: Tree.variety; quality: 0 }`, both cells bare soft.

Assumption: shovel keeps the tree's variety on the seed.

## Invariants

`plants.drink` — Growing drinks `waterUsePerSec` and `PLANT_FERT_PER_SEC × fertUseMul`. Ripe does not drink. Trees draw 0 fertilizer. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`.

`plants.happy` — Happiness starts `HAPPY_START`. Drown drain `HAPPY_DROWN_SECONDS`. Wilt `HAPPY_WILT_SECONDS`. Starve `HAPPY_STARVE_SECONDS`. Happiness 0 while growing: drown → `rotten`; wilt/starve → `dead`. Ripe does not die of water or fertilizer.

`plants.ripen` — Ripen: `freshness = 1`. `quality = clamp(seed.quality + qualityGain(happiness) + betterGain, 0, 1)`. Variety unchanged. No roll.

`plants.fresh` — Picked fruit keeps ticking freshness (hand, house, chest, ground, quad, harvest trailer) until sold. Freezer slots rot at `FREEZER_ROT_MUL` of the open rate: cold slows rot, it does not stop it and it never restores freshness. Mill hopper is units, no freshness. `<= 0` replaces that slot with `{ kind: 'rotten'; cls: CROPS[crop].cls; count }` in place, no auto-merge. Illegal: fruit with `freshness <= 0` after tick. `freshMul(f) = f >= 0.8 ? 1 : f / 0.8`. Jam is rot, not a sale floor.

`quality.ripen` — No roll at ripen. Bought seed quality 0 stays 0 if happiness stays `HAPPY_START`. `betterGain` only if `better-{crop}` owned. Tree fruit quality is 0.

`quality.sale` — Fruit sale is `CROPS.sale × qualityMul(quality) × purposeMul(variety, 'produce') × Π saleMul`. `qualityMul(0)` matches today's `'base'` sale.

`variety.purpose` — Every named Variety has exactly one `purpose`. `purposeMul(variety, path)` pays `PURPOSE_MUL[tier].on` on that purpose and `PURPOSE_MUL[tier].off` on the other two; `'base'` is 1 on all three. A crop carries at most one `variant` and at most one `heirloom`. Six heirlooms, two per purpose.

`variety.identity` — `Plant.variety`, `Tree.variety`, and `variety` on seeds, fruit, grafts are required `VarietyId`. Illegal: optional `variety`. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's `crop`. `'base'` is legal on every `CropId`. Set at plant. Graft is the only later change.

`variety.neighbour` — `keknyelu` `pink-lady` `bing` need a neighbour in Chebyshev `NEIGHBOUR_REACH`. Without one, annual `maturity` does not increase; tree `fruit` does not increase and the seam does not turn `pending` into `on`. Juvenile still grows. Water, fertilizer, happiness, stunt, death still tick.

`graft.attach` — A graft is never planted. Same crop, target variety tier not `heirloom`. Annual `growing`. Tree `juvenile < 1`. Complete: target `variety` and `quality` become the graft's; one consumed. Maturity, juvenile, `trunk`, happiness, `tended`, organic, soil untouched.

`quality.carry` — Grind seed quality equals the fruit's quality. Graft copies quality onto the target. Machine output quality is the mean of what went in — [[mechanics/machines]] `machines.quality-carry`.

`plants.harvest` — Empty-hand harvest of ripe annual including sugar-cane: one fruit, current freshness, plant `variety` and `quality`, `cut: false`, `unitSale = stats.sale`, plot `empty` same soil. Same crop+variety in hand: merged up to the stack cap. Shovel growing/ripe annual: one seed, same variety, plant quality. Shovel dead, rotten, weed, or grass: no drop.

`plants.pick-spoiled` — Empty hand on `dead` or `rotten` is `{ act: 'pickup'; at }`, no work: one `{ kind: 'dead' | 'rotten'; cls; count: 1 }`, `createdAt` on the rotten one, plot `empty` on the same `Soil`. Same kind in hand merges one up to the cap, a full hand says `HAND_FULL`. The shovel path still clears the plot and drops nothing.

`plants.rot-ground` — `clearOldRotten` at the seam, before `mintSeam`, drops every `World.drops` entry that is `rotten` with `clock.day - createdAt >= ROTTEN_GROUND_DAYS`. Rotten held, stored, or carried never expires. `createdAt` is required on the item and is the day the fruit rotted; a merge keeps the smaller of the two.

`plants.packs` — Crop stats are `CROPS`. Bought packs are `'base'` at quality 0. `packSku` is `pack-{crop}` except vanilla (`undefined`). `pack-chilli` exists. `packSku('grass')` is `pack-grass`. No tree pack. No olive pack. No vanilla pack.

`plants.grass` — `'grass'` is `AnnualId`, `'base'` only. Item `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0; count }`. `Plant.crop` excludes `'grass'`. Sow / plant / seeder on `empty` writes turf, never a `Plant`. Turf tick and untilled cover unchanged. `pack-grass` sold at the Seed silo after `unlock-landscaping`. No `{ kind: 'grass-seeds' }`.

`plants.tend` — Tend once: player owns `tending`, empty hand, growing, `tended === false`. Not ripe. Then `tended = true`. Trees: [[mechanics/trees]] `trees.tend`.

`plants.vanilla` — Vanilla `statsOf` sale uses vanilla `saleMul`, a flat number. One variety. Base vanilla sale matches raspberry. Mill yields vanilla-extract, not stall extract — [[mechanics/infusion]] `infusion.extract`.

`plants.chilli` — Chilli `growSeconds` 190, slower than potato, faster than vanilla. `rotSeconds` longer than potato. One Variety `'base'`. No `unlock-chilli`. `pack-chilli` show and buy `unlock-infusion`, `PACK_N` at 10. Mill yields flakes — [[mechanics/infusion]] `infusion.chilli`.

`plants.annual` — `AnnualId` is carrot potato wheat tomato raspberry grape vanilla chilli sugar-cane grass. `Plant.crop` is `Exclude<AnnualId, 'grass'>`. Olive is `TreeId`. Tree seed on a tilled plot is a no-op.

`plants.tree-foot` — Planting a tree seed at `at` puts the tree's foot on `at` and its `base` on `{ col: at.col, row: at.row - 1 }`. `at.row + 1` is untouched.

`plants.kinds` — No `'berry'` stall key. No `Shrub`. No `{ kind: 'berry' }` `{ kind: 'shrub' }`.
