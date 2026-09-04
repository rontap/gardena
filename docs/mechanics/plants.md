# Plants

Crop table is `CROPS`. Tree juvenile / fruit intervals are `TREES`. Variety tables are `defs/varieties.ts`.

`AnnualId`, `TreeId`, `CropId` — `sim/ids.ts`. `Plant.crop` is `AnnualId` only.

Classes: carrot potato root; wheat sugar-cane grain; else fruit.

Fields on `CROPS`: `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `sale`, `seed`, `rotSeconds`. Optional `saleMul` number; vanilla only — preference. Absent → 1.

Grow days = `days(growSeconds)` — derived, [[mechanics/day]]. Drink L/day = `waterUsePerSec × DAY_SECONDS` — derived.

Packs of 5: `SKUS` `pack-*` for annuals that have a pack. `packSku(crop)` in `sim/ids.ts`. Shop pack is `'base'` at quality 0. Carrot / potato / wheat start unlocked. Tomato grape via [[mechanics/research]] plants. Raspberry `reveal: unlock-tomato | unlock-grape`. Sugar cane `unlock-fermentation`; ripe cane is fruit; mill for sugar — [[mechanics/machines]]. Olive is `TreeId`. Trees have no pack.

Vanilla has no pack and no research row. Seeds are a contract prize — [[mechanics/contracts]]. Tree seeds likewise: the four starting `'base'` seeds and the one wild apple are the only ones not won from a contract.

## Variety

Identity, not a ladder. Set when the seed goes in the ground and never changes after, except graft — [[#Graft]]. Two varieties of the same crop are siblings, not steps.

```
VarietyTier = 'base' | 'variant' | 'heirloom'
VarietyId   = 'base' | 'bintje' | 'russian-banana' | 'sonora' | 'red-fife'
            | 'green-zebra' | 'san-marzano' | 'black-raspberry'
            | 'concord' | 'thompson' | 'keknyelu'
            | 'kingston-black' | 'pink-lady'
            | 'moorpark' | 'klosterneuburger' | 'blenheim'
            | 'kalamata' | 'arbequina' | 'montmorency' | 'bing'
Rating      = 1 | 2 | 3 | 4 | 5
Use         = { preserve: Rating | 'none'; fresh: Rating; alcohol: Rating | 'none' }
```

`'base'` is legal on every `CropId`. Every other id belongs to exactly one crop. `VARIETY: Record<Exclude<VarietyId, 'base'>, { crop: CropId; tier: 'variant' | 'heirloom'; use: Use }>` and `VARIETIES: Record<CropId, readonly VarietyId[]>`, both complete maps, `defs/varieties.ts`. Carrot, vanilla and sugar-cane list `['base']` only.

`Plant.variety` required `VarietyId`. Illegal: optional `variety`. Illegal: a `variety` whose `VARIETY[v].crop` is not `Plant.crop`.

`useOf(crop, variety)`: `'base'` is `3` wherever that crop has the path, `'none'` where it does not. Other ids read `VARIETY[v].use`. `'none'` means the crop has no such machine — not a bad rating, an absent one.

Preserve is the jam machine and the mill. Fresh is the fruit sold as it is. Alcohol is the still and the barrel.

`RATING_SALE: Record<Rating, number>` — preference. Neutral at 3, so a crop with no varieties is untouched by this section. It multiplies the sale of the good made on that path, and nothing else: not yield, not speed, not input count.

| crop | `'base'` | variant | variant | heirloom |
|---|---|---|---|---|
| carrot | — / 3 / — | — | — | — |
| potato | — / 3 / 3 | `bintje` — / 2 / 4 | — | `russian-banana` — / 5 / 1 |
| wheat | 3 / 3 / 3 | `sonora` 2 / 3 / 4 | — | `red-fife` 5 / 2 / 1 |
| tomato | 3 / 3 / — | `green-zebra` 2 / 4 / — | — | `san-marzano` 5 / 2 / — |
| raspberry | 3 / 3 / — | — | — | `black-raspberry` 5 / 2 / — |
| grape | 3 / 3 / 3 | `concord` 4 / 3 / 2 | `thompson` 3 / 4 / 2 | `keknyelu` 1 / 2 / 5 |
| vanilla | 3 / 3 / — | — | — | — |
| sugar-cane | 3 / 3 / — | — | — | — |
| apple | — / 3 / 3 | `kingston-black` — / 2 / 4 | — | `pink-lady` — / 5 / 1 |
| apricot | 3 / 3 / 3 | `moorpark` 3 / 4 / 2 | `klosterneuburger` 3 / 2 / 4 | `blenheim` 5 / 2 / 1 |
| olive | 3 / 3 / — | `kalamata` 2 / 4 / — | `arbequina` 4 / 2 / — | — |
| cherry | 3 / 3 / — | `montmorency` 4 / 2 / — | — | `bing` 2 / 5 / — |

Read `preserve / fresh / alcohol`. Names and descriptions: [[agents/game-text-writer]].

`VARIETY_GROW`, `VARIETY_TOL`, `VARIETY_ROT` — `Record<VarietyTier, number>`. Tuned-to so a `'base'` plant grows, drinks, and rots as it does today. `variant` sits between `'base'` and `'heirloom'`.

## Quality

`quality: number`, 0..1, required on `Plant`, seeds, fruit, graft, spirit, cask, jam, oil, flour, extract and sugar. Illegal: optional `quality`. Grass extract and shop sugar are `0`. Tree fruit is `0`.

`qualityMul(q) = 1 + (QUALITY_TOP − 1) × q`. `QUALITY_TOP` — tuned-to so `qualityMul(0)` is today's `'base'` sale.

Bought seed is `0`.

### At ripen

No roll. No grow stream. No `World.ripenN`.

```
quality = clamp(seed.quality + qualityGain(happiness) + betterGain, 0, 1)
```

`qualityGain(h)` is piecewise linear: `+QUALITY_STEP` at `HAPPY_MAX`, `0` at `HAPPY_START`, `−QUALITY_STEP` at `0`. `QUALITY_STEP` 0.25 — preference. A plant left at the happiness it was planted with hands its seed exactly what it was given; four clean generations reach the top, and a neglected one walks back down.

`betterGain` is `BETTER_QUALITY × owned tier × (h / HAPPY_MAX)` when the player owns `better-{crop}`, else 0. `better-*` maxTier 1. No `better-carrot` `better-vanilla` `better-sugar-cane`. Tree `better-*` does not run here — trees have no happiness — [[mechanics/family]] `family.better-set`.

`freshness = 1`. Variety unchanged.

## Grass

Lawn, not a crop. No `CropId`, no variety, no quality, no `Plant`, no market value.

Item `{ kind: 'grass-seeds'; count }`. `pack-grass` unlock `unlock-landscaping`. Buying merges into one house slot like seeds do.

Sow on `empty` → `{ kind: 'turf'; soil; turf: Turf }`. `Turf` holds `maturity` and `variant` 0–2 picked by `gen.at(3, col, row)` — [[mechanics/rng]]. Prompt **Sow grass**.

Ticks in `tickField` off grow: drinks `GRASS_WATER_PER_SEC`, matures over `GRASS_GROW = DAY_SECONDS / 4`. No happiness, no fertilizer draw, no water band, no death. — [[architecture/tick]]

At `maturity >= 1` the plot becomes `{ kind: 'untilled'; ground: 'soft'; cover: { kind: 'grass', variant } }` — the tilled bed and its `Soil` are gone. That is the point of the item: it un-tills land.

## Stats

`statsOf(crop, variety, quality, mods)`:

- sale: `CROPS.sale × qualityMul(quality) × RATING_SALE[use.fresh] × Π saleMul` × (`CROPS.saleMul` or 1)
- grow: `(CROPS.growSeconds × VARIETY_GROW[tier]) / growSpeed`
- drink: `CROPS.waterUsePerSec × waterUseMul`
- tols: `tolerance(base, tier) = max(TOL_MIN, base × VARIETY_TOL[tier])`
- rot: `CROPS.rotSeconds × VARIETY_ROT[tier]`

`TOL_MIN` — preference. Cache keys `crop` + `variety` for `modGen`; `qualityMul` applies at sale — [[architecture/tick]].

Vanilla `saleMul` is a flat number — preference.

## Grow

Seed on `empty` → `growing`, same `Soil`, same `variety`, same `quality`. Planting does not change water. `Plant.happiness = HAPPY_START` — preference. `Plant.tended` required, starts `false`, same instance through ripe / dead. `bio` starts true; soil non-organic marks the plant.

Stage: maturity `< 0.33` sprout, else grow, then ripe, dead.

While growing: drink water and `PLANT_FERT_PER_SEC` — [[mechanics/soil]]. Bands from soil vs tols.

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

After pick, fruit keeps rotting in hand, house, chest, ground, quad, and harvest trailer until sold. `tickFreshness`. Freezer slots rot at `FREEZER_ROT_MUL` of the open rate: cold slows rot, it does not stop it and it never restores freshness. `<= 0` replaces that slot with `{ kind: 'rotten'; cls: CROPS[crop].cls; count }`. Convert in place, no auto-merge. Sugar does not tick. Mill hopper is units, no freshness. Freshness-0 fruit no longer exists as an item after tick. On-plant ripe already becomes plot rotten.

`freshMul(f) = f >= 0.8 ? 1 : f / 0.8` — preference at 0.8. Harvest bakes `unitSale = stats.sale`. Sale uses `freshMul` of current freshness — [[mechanics/market]]. Jam rot — [[mechanics/family]].

Merge same crop+variety: weighted `unitSale`, `freshness`, and `quality`. Different variety never merges.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. Legal: player owns `tending`, empty hand, growing, `tended === false`. Work `TEND_WORK`. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`. Not ripe. Not twice. Plants unchanged. Trees: [[mechanics/trees]] `trees.tend` — [[mechanics/family]].

## Harvest / shovel

Ripe annual including sugar-cane, empty hand: one fruit, current freshness, `variety` and `quality` from the plant, `cut: false`, plot `empty` same soil. Same crop+variety in hand: merged onto that stack up to the cap — [[mechanics/inventory]].

Shovel growing or ripe annual: one seed, same variety, quality as the plant (growing: planted quality; ripe: baked). Same soil. Shovel dead or rotten: empty, no drop. Compost is from what you already carry.

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

`plants.drink` — Growing drinks `waterUsePerSec` and `PLANT_FERT_PER_SEC`. Ripe does not drink. Water red or fert red: growth × `STUNT`. Both red: `STUNT × STUNT`.

`plants.happy` — Happiness starts `HAPPY_START`. Drown drain `HAPPY_DROWN_SECONDS`. Wilt `HAPPY_WILT_SECONDS`. Starve `HAPPY_STARVE_SECONDS`. Happiness 0 while growing: drown → `rotten`; wilt/starve → `dead`. Ripe does not die of water or fertilizer.

`plants.ripen` — Ripen: `freshness = 1`. `quality = clamp(seed.quality + qualityGain(happiness) + betterGain, 0, 1)`. Variety unchanged. No roll.

`plants.fresh` — Picked fruit keeps ticking freshness (hand, house, chest, ground, quad, harvest trailer) until sold. Freezer slots rot at `FREEZER_ROT_MUL` of the open rate: cold slows rot, it does not stop it and it never restores freshness. Mill hopper is units, no freshness. `<= 0` replaces that slot with `{ kind: 'rotten'; cls: CROPS[crop].cls; count }` in place, no auto-merge. Illegal: fruit with `freshness <= 0` after tick. `freshMul(f) = f >= 0.8 ? 1 : f / 0.8`. Jam is rot, not a sale floor.

`quality.ripen` — No roll at ripen. Bought seed quality 0 stays 0 if happiness stays `HAPPY_START`. `betterGain` only if `better-{crop}` owned. Tree fruit quality is 0.

`quality.sale` — Fruit sale is `CROPS.sale × qualityMul(quality) × RATING_SALE[use.fresh] × Π saleMul`. `qualityMul(0)` matches today's `'base'` sale.

`variety.identity` — `Plant.variety`, `Tree.variety`, and `variety` on seeds, fruit, grafts are required `VarietyId`. Illegal: optional `variety`. Illegal: a `variety` whose `VARIETY[v].crop` is not the item's `crop`. `'base'` is legal on every `CropId`. Set at plant. Graft is the only later change.

`variety.neighbour` — `keknyelu` `pink-lady` `bing` need a neighbour in Chebyshev `NEIGHBOUR_REACH`. Without one, annual `maturity` does not increase; tree `fruit` does not increase and the seam does not turn `pending` into `on`. Juvenile still grows. Water, fertilizer, happiness, stunt, death still tick.

`graft.attach` — A graft is never planted. Same crop, target variety tier not `heirloom`. Annual `growing`. Tree `juvenile < 1`. Complete: target `variety` and `quality` become the graft's; one consumed. Maturity, juvenile, `trunk`, happiness, `tended`, organic, soil untouched.

`quality.carry` — Grind seed quality equals the fruit's quality. Graft copies quality onto the target. Machine output quality is the mean of what went in — [[mechanics/machines]] `machines.quality-carry`.

`plants.harvest` — Empty-hand harvest of ripe annual including sugar-cane: one fruit, current freshness, plant `variety` and `quality`, `cut: false`, `unitSale = stats.sale`, plot `empty` same soil. Same crop+variety in hand: merged up to the stack cap. Shovel growing/ripe annual: one seed, same variety, plant quality. Shovel dead, rotten, weed, or grass: no drop.

`plants.packs` — Crop stats are `CROPS`. Shop packs are `'base'` at quality 0. `packSku` is `pack-{crop}` except vanilla (`undefined`). No tree pack. No olive pack.

`plants.tend` — Tend once: player owns `tending`, empty hand, growing, `tended === false`. Not ripe. Then `tended = true`. Trees: [[mechanics/trees]] `trees.tend`.

`plants.vanilla` — Vanilla `statsOf` sale uses vanilla `saleMul`, a flat number. One variety. Base vanilla sale < raspberry.

`plants.annual` — `Plant.crop` is `AnnualId`. `AnnualId` is carrot potato wheat tomato raspberry grape vanilla sugar-cane. Olive is `TreeId`. Tree seed on a tilled plot is a no-op.

`plants.tree-foot` — Planting a tree seed at `at` puts the tree's foot on `at` and its `base` on `{ col: at.col, row: at.row - 1 }`. `at.row + 1` is untouched.

`plants.kinds` — No `'berry'` stall key. No `Shrub`. No `{ kind: 'berry' }` `{ kind: 'shrub' }`.
