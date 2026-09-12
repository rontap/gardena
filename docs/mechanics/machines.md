# Machines

Secondary goods. Shelf gates [[mechanics/research]]. Size [[items/buildings]]. Place [[ui/place]]. Look [[ui/machines]]. Recipe chrome [[ui/recipe]]. Consign [[mechanics/market]]. Water [[mechanics/water]]. Dump permissions [[mechanics/multiplayer]]. Infused jam / cask / spirit / oil: [[mechanics/infusion]]. Variety and quality: [[mechanics/plants]]. Numbers preference unless marked.

Illegal: `'berry'`. Illegal: whisky. Illegal: apple as jam crop. Apple → barrel cider. Named specialty alcohols are out of this update. Still output is the existing `SpiritKind` at that variety, or `mixed`.

## Dump

Intents `still` `barrel` `jam` `mill` `furnace` `station` `infuse` at `Coord`. `dest(still | furnace)` = origin. `dest(barrel | jam | mill | station | infuser)` = `at`. Instant dump: consume accepted cargo. Dump/pull all legal until dest full. Guest may dump. Vehicle I/O [[mechanics/vehicles]]. Infuser accept [[mechanics/infusion]] `infusion.machine`. [[architecture/world]] `world.dest`.

Refuse `{ kind: 'rotten' }` `{ kind: 'dead' }`. Freshness-0 fruit is not an item after tick. Seeds, tree seeds, tools: refuse. Graft: mill/jam/still/barrel/grinder/station refuse; furnace green rate. Furnace accept is the feedstock table.

Grinder dump is mill-style: `{ act: 'grind' }`, into hopper. Not actor `GRIND_WORK`. Guest may dump. Freezer reuses `{ act: 'chest' }` and `swapChest`. Guest may not open.

Tick origin cell only (`base` matches `at`), after eval, so `inn` gates the same tick. Not cmds. Not actor work except dump. `World.stills` holds the same `PotStill` instances as their cells. Furnace and station are cell-only, not a water join.

## I/O

Shape: [[architecture/modules]] Building I/O.

`Machine` (has `inn`): `Mill`, `JamMachine`, `PotStill`, `Furnace`, `ResearchStation`, `Infuser`. `BaseBuilding` (no `inn`): `Grinder`, `CompostBox`, `Barrel`, `Chest`, `Freezer`, `Sorter`. `CompostBox.pads = 'both'`, `takeAll`. Grinder / barrel keep `'none'`. `Chest` `Freezer` override `pads` `'both'`, `ports` `['out']`, `takeAll`. `Store`: `SeedSilo`, `AdditiveStore`. Mill / jam / still / station / infuser `ports` `['in']`. Furnace `['in','out']`.

Walk dump, chest west-pull / east-push, and vehicle pads all go through instance `accept` / `apply`. `ownsPort` for mill / jam / still / furnace / station / infuser / chest / freezer / seed-silo / additive-store: origin cell and `c.ports` includes the port. Sensor kind arms stay on `ownsPort` — [[mechanics/sensors]]. `PadCell` is `pads === 'both'`. Compost included; grinder / barrel excluded. `IoCell` is the west-pull set (includes grinder). Barrel collect is not `accept`.

West of the machine = input. East = output. Same row `base.row + base.h - 1`. Mill, Infuser, Furnace: that south row. Furnace origin row is not I/O. Jam, still, station: `h = 1`, so south row is origin row. Still and station: west of origin, east of `base.col + base.w`. Targets: chest, freezer. Machine is the actor. Link is view-derived from adjacency.

**Pull** — each `BIG_TICK`, origin only: dump-all legal from the west store into the machine. Same accept as walk dump. Until hopper/cap full. Compost consumes the whole slot. `inn === 1` still fills.

**Push** — on produce. East store `insertSlots` the output item. Success → consume the batch. Full → wait, do not drop. No east store → `dropSpot(base)`: the footprint ring (south row, west column, east column, north row), first free plot. Never a cell the building itself occupies.

Produce: mill, jam, still, compost-box, grinder, furnace, station, infuser. Not barrel. Ghost chutes [[ui/place]] `place.ghost-io`.

`pads` on the instance says whether, `padPorts()` says where — [[architecture/modules]] `building.io-ports`. Dropoff north Unload / takeup south Load — [[mechanics/vehicles]]. Furnace takeup is south of the south cell. Barrel, grinder: `'none'`. Seed silo / additive store / compost-box / chest / freezer / mill / still / jam / furnace / station / infuser / sorter: `'both'`. The sorter is the one building whose pads are not the north and south edges. `IoCell` is not the same set as `PadCell`.

## Sugar

`{ kind: 'sugar'; liters; capacityLiters; unitSale; quality }`. Illegal: `count` on sugar. Merge: weighted `unitSale` and `quality` by liters. Shop sugar quality 0. Mill output `SUGAR_MILL × purposeMul(variety, 'processed') × qualityMul(mean q)`. Additive store `buy-sugar` is `SUGAR_SHOP` for `SUGAR_BAG`. Mill sugar sells for more per liter than Additive store sugar. Compost: `liters × COMPOST_VALUE.fruit`.

## Mill

Hopper. First accepted dump locks `recipe` + `variety`. Later dumps must match both. `units === 0` → `recipe: 'none'`. Grass has no variety lock. Need `millNeed`. Running mean `quality` weighted by units. At `units >= need`: tick `progress += dt × machineMul / MILL_WORK`. At 1: consume need, drop output `frontOf` (no plot → wait), leftover stays. Output sale takes `purposeMul(locked variety, 'processed')` × `qualityMul(mean q)`.

| recipe | out |
|---|---|
| `'sugar-cane'` | sugar `SUGAR_BAG` L |
| `'olive'` | oil, `infused: false` |
| `'wheat'` | flour |
| `'grass'` | `{ kind: 'extract' }` count 1, quality 0 |
| `'vanilla'` | `{ kind: 'vanilla-extract' }` count `MILL_VANILLA_OUT`. Not stall |
| `'chilli'` | `{ kind: 'flakes' }` count `MILL_CHILLI_OUT`. Not stall |

`MILL_RECIPES` order: sugar-cane olive wheat grass vanilla chilli. Grass mill is stall `'extract'`. Vanilla-extract and flakes are not stall goods. Mill ignores freshness. Grass takes `NO_PATH_SALE`. — [[mechanics/infusion]] `infusion.extract` `infusion.chilli`

## Grinder

Hopper. First accepted dump locks `crop` + `variety`. Need 1 fruit including sugar-cane and tree fruit. Not sugar liters.

Annual fruit → seeds of the same crop and variety, `heirloom` included. Tree fruit → `{ kind: 'tree-seed' }` of that species at `'base'`. Seed quality equals the fruit's quality. `{ kind: 'tree-seed' }` carries no `count`; `GRIND_MIN`..`GRIND_MAX` and `GRIND_MIN_AT(q)` govern annual seeds only. `GRIND_MIN_AT(q)` raises the yield floor with quality. `grind.at(col, row, day, n)`. At `units >= 1`: tick `progress += dt × machineMul / GRIND_WORK`. Seeds do not merge into house. No pads. No `inn`.

## Jam

Sugar is per jar, `jamSugar(crop, variety)`: `san-marzano` 0, tomato `KETCHUP_SUGAR` (twice `JAM_SUGAR`), else `JAM_SUGAR`. A jar at 0 has no sugar input and no sugar `filling` stage. The buffer still fills on any jam machine.

Dump fruit: first dump locks `JamCrop` + `variety`. Else must match both. Dump sugar: fill buffer from hand liters. Apple fruit is refuse. Running mean quality of the fruit. Sugar quality does not enter the jam mean. Output quality is the mean of the fruit that went in. `infused: false` from the jam machine. `unitSale` `JAM_SALE[crop] × purposeMul(variety, 'processed') × qualityMul(mean q)`. `JAM_CROPS`. No apple. Infuser — [[mechanics/infusion]] `infusion.item`.

Five varieties have a product of their own; every other variety falls back to the plain jam of its crop; `'base'` tomato keeps **Ketchup**. `concord` **Grape jelly**. `black-raspberry` **Black raspberry jam**. `san-marzano` **Passata**. Art [[art/machines]].

## Still

`RectBase` `w = 2` `h = 1`, origin NW, no rotate, same instance both cells, tick origin, water join any corner. `STILL_CAP`. No overload. Production starts iff feed count `=== STILL_CAP` and `pull` `STILL_WATER` succeeds (full amount; short → pull 0, retry each tick). Water once at start. `inn === 1` skips that pull and `progress`. `STILL_SECONDS`. Not a machinery job. `progress += dt / STILL_SECONDS`. Consume feed on finish only.

No lock, it still mixes. `spiritKind`: all potato → `vodka`; all wheat → `beer`; all apricot → `brandy`; else `mixed`. On finish: every unit one crop and one variety → that crop's named spirit at that variety. `klosterneuburger` brandy carries a name of its own. Else `mixed` at `SPIRIT_SALE.vodka × MIXED_MUL × qualityMul(mean q)`, no `variety` field. One variety or mixed; no partial credit. Still output `infused: false`. Ignore freshness. One batch → `count` 1.

## Barrel

First accepted dump locks `crop` + `variety`. Collect clears them back to `'none'`. No mix. `barrelNeed('apple')` / `barrelNeed('grape')`. Age ticks after `crop !== 'none'` and feed count `=== barrelNeed(crop)`. `BARREL_MATURE` / `BARREL_AGE` derived. At `age === BARREL_MATURE`: consume feed, bake quality as the mean, `caskAgeTop(q)` lerps the cap over quality (`caskAgeTop(0)` lowest cap, `caskAgeTop(1)` top). Age continues. Collect after mature only: empty hand or a mergeable cask of the same `cask` and variety. Age mul: linear `1 → caskAgeTop(q)` over `BARREL_AGE` after mature. `caskName` prefixes **Premium** when `caskGroup` is `heirloom`. Age baked into `unitSale` at collect. `caskMulOf` reads purpose and age back out as one multiplier. Collect `infused: false`. Infuser — [[mechanics/infusion]] `infusion.item`.

## Freezer

`FREEZER_SLOTS`. Any item, like chest. `tickFreshness` runs freezer slots at `FREEZER_ROT_MUL` of the open rate: cold slows rot, it does not stop it and it never restores freshness. `out` + `SENSOR_HOLD`: full = no empty slot. Port `out` origin bottom. [[mechanics/sensors]]. Guest: not. Host cue reuses chest.

## Cut fruit

`{ kind: 'fruit'; ...; cut: boolean }`, required, `false` from the field. The research station returns the fruit it took with `cut = true` and refuses fruit that already carries it. Cut fruit is otherwise ordinary. Illegal: optional `cut`. `cut` is not in the stack identity key — [[mechanics/inventory]] `inventory.stack`. A merged stack is cut when either side was.

## Research station

2×1. Pads, west pull, east push, `inn`, like mill. Accepts heirloom fruit only, `cut === false`. First dump locks crop + variety. Empty stores `variety: 'base'` and `quality: 0` until the first dump locks both. At `progress` 1: consume, emit `STATION_IN` fruit with `cut = true` and a rolled 1–2 grafts of that variety, both at the input quality. `grind.at(col, row, day)` on finish, same roll all day on that cell. Both outputs land or neither: the east store is measured for the cut fruit and the grafts together before either is emitted. The type carries no freshness and no organic field, so returned fruit leaves at freshness 1 and not organic. Panel [[ui/station]]. Earn path from seed: [[plans/next-variant]].

## Variety sorter

Makes nothing, so it is not a `MachineId` and has no `Recipe` row. `Sorter` 1 × `SORT_LEN` upright, `SORT_LEN` × 1 flat. `facing` names the side the three outputs face. Rotate while armed: `Act.rotatePlace`. Origin NW, same instance on all three cells, tick origin. One `in` port beside the middle cell. Three `out` ports beside each cell on the far side, in `VARIETY_TIERS` order. `storePorts()` and `padPorts()` return those same four cells.

No `inn`. No wire. No HUD. No hopper: `held` plus `progress`. Takes seeds, fruit, tree-seed, graft; refuses jam / cask / spirit / oil. Whole stack per cycle at `SORT_SECONDS`, not `machineMul` and not `furnaceMul`. `emitSorted` writes that tier's port cell only, never `frontOfBase`. A blocked side stops that side alone. Grass seed and tree seed are `'base'` only. `accept` is 1 when `held === 'none'` and `sortVariety` is not undefined. Demolish drops `held` at the origin. Art [[art/machines]].

## Furnace

`FurnaceRecipe` `'none' | 'ash' | 'bread'`. `RectBase` `w = 1` `h = 2`, origin NW, no rotate, same instance both cells, tick origin. First accepted dump locks `recipe`. `units === 0` → `'none'`. Flour locks `'bread'`. Ash feedstock locks `'ash'`. Mix ash freely among ash feedstock. Variety, quality, `infused` ignored on ash. Production ticks iff need is met and `inn === 0` and `progress < 1`. `progress += dt × furnaceMul / FURNACE_SECONDS`. Not a machinery job. Ash at 1: consume `FURNACE_NEED`, drop `FURNACE_ASH` ash. Bread at 1: consume `FURNACE_BREAD_IN` flour, drop `{ kind: 'bread' }`. East store else `frontOf`. `out` high iff `units === 0`. Port `in` origin top, `out` origin bottom. South cell: no port. Working: two state VFX — [[#Invariants]] `machines.furnace-smoke`. Art [[art/machines]]. [[mechanics/infusion]] `infusion.furnace`.

## Feedstock

`furnaceValue(item)` — `FURNACE_VALUE` preference. Refuse → 0.

| item | units |
|---|---|
| rotten, seeds, tree-seed, weed, grass, dead, graft | `FURNACE_VALUE.green` × count (tree-seed: × 1) |
| fruit | `FURNACE_VALUE.fruit` × count |
| sugar | `FURNACE_VALUE.fruit` × liters |
| oil (`infused` ignored) | `FURNACE_VALUE.oil` × count |
| spirit (`infused` ignored) | `FURNACE_VALUE.spirit` × count |
| wood | `FURNACE_VALUE.wood` × count |

Flour is bread lock, not ash. Jam, cask, extract, vanilla-extract, flakes, bread, compost bags, fertilizer, weed-spray, tools, ash: refuse. Tree-seed and graft are green rate. Ash into compost: `COMPOST_VALUE.ash` × count. Wood is not compost. Wood and ash are not stall goods.

## furnaceMul

Chebyshev ≤ `FURNACE_REACH` between any cell of a **working** furnace and any cell of the target footprint. Count `n` working furnaces in reach, **never the target itself**. `furnaceMul = 1 + FURNACE_HASTE × n`. Progress `+= dt × machineMul() × furnaceMul / work` on mill, jam, grinder. Progress `+= dt × furnaceMul / fixed` on still, compost-box, furnace, infuser. Barrel age unchanged. Station progress is `fixed`, no `furnaceMul`. Catalog `clockText` stays nominal seconds. Live `left` uses the tick rate.

A lone working furnace has `n = 0`. Empty / filling / `inn === 1` / waiting on output (`progress >= 1`): that furnace is not in `n`. Snapshot the working set at the start of `tickMachines` (after this tick’s `evalSensors`). Compost-box reads that same set from the same loop. Compost bags have no freshness, so compost-box in that loop is not a freshness change.

Covering paint [[ui/place]] [[architecture/view]] `view.furnace-cover`. Covering look [[ui/machines]] [[ui/inspect]].

## Machinery

Player `machinery`: valve, mill tick, jam tick, grinder tick `÷ (1 + 0.05 × tier)`. Still / barrel / furnace / station / infuser not work jobs. Pipe place stays 0. `furnaceMul` is not `machinery`.

## Recipes

`sim/recipe.ts`. No `World`. The one enumeration of what each machine makes; every number derived from `defs/items.ts` and `sim/machine.ts`. Shown by [[ui/recipe]]. Reverse lookup `recipesUsing(face)` for [[ui/almanac]] Ingredients.

`MachineId` — mill jam still barrel grinder compost-box furnace station infuser. Freezer and chest are storage, not machines. Sorter makes nothing, so no `MachineId`.

`Duration` — `work` divided by `machineMul` (mill, jam, grinder); `fixed` not (still, compost, furnace, station, infuser); `age` for the barrel. `furnaceMul` multiplies mill, jam, grinder, infuser, still, compost-box, furnace progress; not barrel, not station. Infuser is `fixed`, not `work`. `clockText(seconds)` is `{n} sec`.

`recipesUsing(face)` matches `one` inputs by kind+identity. Skip `any` (mixed still, grinder, compost, furnace green / fruit / spirit, infuser jam / spirit / cask). Infuser reagent `any` faces match flakes and vanilla-extract by kind. Almanac Ingredients is this list, gated by machine unlock in `done`.

`recipesOf(machine)` is the catalog listing and collapses; the per-variety rows behind it stay whole for `craftState`. Rows of one machine and one crop whose output reads the same name and draws the same group (`sameProduct`) merge into one row whose fruit input becomes `{ kind: 'any'; faces }` and cycles. `craftState` derives the live `Craft`: `idle` `filling` `paused` `thirsty` `working` `ready`. `thirsty` is still only. Furnace / station / infuser: no `thirsty`. `inn === 1` and `units > 0` → `paused`. The barrel counts down to `BARREL_MATURE`, not `BARREL_AGE`. Empty compost (`units === 0`) is `idle`. Filling compost pins the fruit row. Live furnace empty (`units === 0`) cycles all list rows; filling pins the locked recipe.

## Sale bake

`sim/machine.ts`. No `World`. Crop fruit stall path: consign folds quality and path rating into `worth` — [[mechanics/market]]. Machine goods: baked `unitSale`, no `stallX`. Infused jam / cask / spirit / oil: same sale skills as the plain good. Flakes and vanilla-extract are not stall goods. Merge same keys; sugar by liters; else by count; weighted `unitSale` and `quality`.

Spirit / wine / jam / oil / flour / extract / flakes / vanilla-extract / bread / graft: not compost unless named (sugar only). Ash composts. Wood does not.

## Invariants

`machines.sugar` — Ripe cane harvests as fruit; mill `MILL_IN` cane → `SUGAR_BAG` at `SUGAR_MILL × purposeMul(v, 'processed') × qualityMul`; sugar is `{ kind: 'sugar'; liters; capacityLiters; unitSale; quality }` with no `count`, no freshness tick, shop quality 0.

`machines.mill-vanilla` — Mill recipe `'vanilla'`: `MILL_VANILLA_IN` fruit → `{ kind: 'vanilla-extract'; quality }` count `MILL_VANILLA_OUT`, not stall `'extract'`; grass mill stays `{ kind: 'extract' }` stall `'extract'` quality 0 — [[mechanics/infusion]] `infusion.extract`.

`machines.mill-chilli` — Mill recipe `'chilli'`: `MILL_CHILLI_IN` fruit → `{ kind: 'flakes'; quality }` count `MILL_CHILLI_OUT`, not stall — [[mechanics/infusion]] `infusion.chilli`.

`machines.infuser` — Infuser is a 2×2 `Machine` with mill I/O, `INFUSE_SECONDS` `fixed`, `furnaceMul`, not machinery, not `work`, not `machineMul`; locks `Infusable`; need 1 good + 1 reagent (flakes or vanilla-extract, not both); same `infused: true` either way; output quality and `unitSale` unchanged; oil is infusable — [[mechanics/infusion]] `infusion.machine`.

`machines.barrel` — Barrel locks one `BarrelCrop` + variety on first dump (grape → wine, apple → cider), no mix, no whisky; collect clears `crop`; `barrelNeed` is the input; `caskAgeTop(q)` lerps the cap over quality; past `BARREL_MATURE` the look block carries a second line naming the cask — [[ui/machines]].

`machines.still-foot` — `PotStill` is 2×1, origin NW, no rotate, same instance both cells, tick origin, water join any corner.

`machines.sorter` — `Sorter` is 1 × `SORT_LEN` with four `facing` values, same instance all three cells; one `in` and three `out` in `VARIETY_TIERS` order; `storePorts()` and `padPorts()` are those four cells; no `inn`, no wire, no hopper; takes seeds, fruit, tree-seed, graft; whole stack per cycle at `SORT_SECONDS`; `emitSorted` writes that tier's port cell only; a blocked side stops that side alone.

`machines.inn` — `inn === 1` freezes mill/jam/still/furnace/station/infuser ticks (progress + still water pull); dump and Unload still fill.

`machines.unwired` — Unwired mill/jam/still/furnace/station/infuser `inn` 0 ticks (enabled).

`machines.quad-mill` — Quad on mill dropoff: Unload cane into mill.

`machines.tractor-mill` — Tractor harvest on mill takeup: Load sugar drop.

`machines.water` — `STILL_WATER` preference; start still requires full pull; every still recipe carries that many liters on the water face.

`machines.io-side` — West chest/freezer is input, east is output, same row `base.row + base.h - 1`; mill / infuser / furnace use the south row; jam / still / station use origin row; still and station east of `base.col + base.w`.

`machines.io-pull` — Each `BIG_TICK`, dump-all legal from the west store into the machine.

`machines.io-push` — Produce inserts into the east store if present; else `dropSpot(base)`, the first free plot on the footprint ring; east store full → wait; never a cell the building itself occupies.

`machines.grind-hopper` — Grinder is a hopper that locks crop + variety; `GRIND_WORK` preference; mill-like tick, not actor work; seeds do not merge into house.

`machines.grind-tree` — Tree fruit yields `{ kind: 'tree-seed' }` of that species at `'base'`; annual `heirloom` fruit → `'base'` seeds; annual `'base'` or `variant` → same variety seeds; seed quality equals fruit quality; sugar refused; `GRIND_MIN_AT(q)` raises the annual yield floor.

`machines.grind-variant-row` — `recipesOf('grinder')` is two rows: first `'base'` and `heirloom` annuals plus tree fruit; second annual `variant` fruit only; trees never join the second row.

`machines.variety-lock` — Mill, jam, barrel, grinder, station lock crop + variety; infuser locks `Infusable`; still does not; furnace ash ignores variety, quality, `infused`; furnace bread locks flour; compost ignores variety and quality.

`still.variety` — On finish, every unit one crop and one variety → that crop's named spirit at that variety; else `mixed` at `SPIRIT_SALE.vodka × MIXED_MUL × qualityMul(mean q)`, no `variety` field.

`machines.jam-sugar` — `jamSugar(crop, variety)` is the one statement of sugar per jar: `san-marzano` 0, tomato `KETCHUP_SUGAR` (twice `JAM_SUGAR`), else `JAM_SUGAR`; a jar at 0 has no sugar input and no sugar `filling` stage.

`machines.cask-premium` — `caskName(cask, variety)` is the one cask name: heirloom reads **Premium {cask}**, every other variety the plain cask name; the stall bin keeps `CASK_NAME`.

`machines.quality-carry` — Output quality is the mean of what went in; infuser output quality is the mean of the good (flakes and vanilla-extract do not enter) and does not change `unitSale`; output sale takes `purposeMul(input variety, that machine's path)` × `qualityMul`; which machines a crop can reach is `MILL_RECIPES` / `JAM_CROPS` / `STILL_CROPS` / `BARREL_CROPS`.

`station.cut` — Fruit `cut: boolean` required, `false` from the field; station returns `cut = true` and refuses `cut === true`; a merged stack is cut when either side was; illegal: optional `cut`.

`station.io` — Station is 2×1 with mill I/O; heirloom fruit only, `cut === false`; first dump locks crop + variety; at progress 1 it emits `STATION_IN` cut fruit and 1–2 grafts at input quality, both or neither; east store else `frontOf`.

`variety.copy` — Station grafts are the locked variety at input quality.

`machines.recipe-source` — `sim/recipe.ts` is the only recipe enumeration; mill, jam, still and barrel pin every variety of their crops (grass: one); mill inputs equal `millNeed`; jam rows carry `JAM_IN` fruit and `jamSugar`; barrel inputs equal `barrelNeed` and `age` not `work`; no apple jam; named jam titles on `concord` `black-raspberry` `san-marzano`; every other tomato is Ketchup; grinder two rows; compost four; furnace seven; station rows pinned to each `heirloom` fruit; infuser four, each `INFUSE_IN` good + 1 reagent.

`machines.recipe-collapse` — `recipesOf(machine)` is the catalog listing and collapses; the per-variety rows behind it stay whole for `craftState`; rows of one machine and one crop whose output reads the same name and draws the same group merge into one cycling `any` row; `recipesUsing` matches a `one` input on crop + variety, and a collapsed `any` input whose faces are all one crop; it never matches the grinder, furnace or mixed-still rows.

`machines.recipe-water` — Every still recipe carries one `liters` input of `STILL_WATER` on the `water` face and `STILL_CAP` fruit.

`machines.recipe-compost` — Compost lists four recipes (fruit any `CropId`; green weed/grass; rotten `CropClass` faces; ash `one`); the box counts `COMPOST_NEED` waste; empty box cycles all list rows.

`machines.recipe-haste` — `work` durations divide by `machineMul`; `fixed` and `age` do not; `furnaceMul` multiplies mill, jam, grinder, infuser, still, compost-box, furnace progress, not barrel, not station; infuser is `fixed`; catalog `clockText` stays nominal.

`machines.furnace-feed` — Ash lock: compost feedstock + oil + spirit + wood + tree-seed + graft at `FURNACE_VALUE`; mix ash; cap `FURNACE_CAP`; refuse jam/cask/extract/vanilla-extract/flakes/bread/ash/tools; flour is bread lock; variety, quality, `infused` ignored on ash.

`machines.furnace-burn` — Ash: `FURNACE_NEED` units, `FURNACE_SECONDS`, drop `FURNACE_ASH` ash, leftover stays, `inn === 1` skips; bread: `FURNACE_BREAD_IN` flour, same seconds, drop `{ kind: 'bread' }`.

`machines.furnace-lock` — First dump locks `'ash' | 'bread'`; `units === 0` → `'none'`; no mix — [[mechanics/infusion]] `infusion.furnace`.

`machines.furnace-haste` — Working furnace Chebyshev ≤ `FURNACE_REACH` on footprint; `1 + FURNACE_HASTE × n`, the target itself never in `n`; still, compost, infuser take it; barrel and station do not; waiting / empty / gated do not count.

`machines.furnace-io` — West pull, east push on the south row; pads; `in` top; `out` bottom high iff `units === 0`; signal ports stay origin; south cell no port; origin row is not chest I/O.

`machines.furnace-draw` — `Furnace` is 1×2, origin NW, no rotate, same instance both cells, tick origin.

`machines.furnace-smoke` — Working furnace mounts two state VFX: `furnace` at the south cell (opening) and `furnace-smoke` at the origin cell (chimney); reduced motion: frame 0 both; idle: neither.

`machines.furnace-cover` — Covering area is Chebyshev ≤ `FURNACE_REACH` over the 1×2; armed `buy-furnace` and unarmed hover of a placed furnace paint that area stroke-only; not a lens, not a dock, not sprinkler fill — [[ui/place]].

`machines.furnace-haste-look` — Hover mill / jam / still / grinder / compost-box / furnace / infuser: one look line iff covering working count `n > 0`; barrel never; station never; live working set, not `furnaceSnap` — [[ui/machines]].

`machines.recipes-using` — `recipesUsing(face)` matches `one` inputs by kind+identity (fruit / jam / seeds / graft: crop + variety; jam / spirit / cask / oil also `infused`); skip `any` except infuser reagent flakes and vanilla-extract by kind; Almanac Ingredients is this list, gated by machine unlock in `done`; no hardcoded crop→product plates; no infused duplicate panes.
