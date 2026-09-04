# Machines

Secondary goods. Shop gates [[mechanics/research]]. Consign [[mechanics/market]]. Water [[mechanics/water]]. Dump permissions [[mechanics/multiplayer]]. Numbers preference unless marked.

Ids: `SpiritKind` `JamCrop` `StillCrop` `MillRecipe` `JamId` `StallGoodId` — `sim/ids.ts`.

```
MillRecipe = 'sugar-cane' | 'olive' | 'wheat' | 'grass' | 'vanilla'
JamCrop   = 'apricot' | 'grape' | 'raspberry' | 'cherry' | 'tomato'
```

`jam-tomato` display **Ketchup**. Illegal: `'berry'`. Illegal: whisky. Illegal: apple as `JamCrop`. Apple → barrel cider. Grape jam stays.

## Buildings

1×1 except still and furnace. Place like chest. Still: pumpjack — `RectBase` `w = 2` `h = 1`, origin NW, no rotate, same instance both cells, hover origin extends east. Furnace: `RectBase` `w = 1` `h = 2`, origin NW, no rotate, same instance both cells, hover origin extends south. Pay on confirm. Disarm. Automation tab. `haggling`. Guest may shop + place + `delete` building. Guest `GUEST_BUILD` += `buy-furnace`.

| class | `kind` | sku | unlock |
|---|---|---|---|
| `Mill` | `mill` | `buy-mill` | `unlock-grinder` |
| `JamMachine` | `jam` | `buy-jam` | `unlock-preservatives` |
| `PotStill` | `still` | `buy-still` | `unlock-fermentation` |
| `Furnace` | `furnace` | `buy-furnace` | `unlock-furnace` |
| `Barrel` | `barrel` | `buy-barrel` | `unlock-fermentation` |
| `Freezer` | `freezer` | `buy-freezer` | `unlock-preservatives` |

`World.stills` holds the same `PotStill` instances as their cells. Join a water net like `Tap` — [[mechanics/water]]. Furnace is cell-only, not a water join.

Tick origin cell only (`base` matches `at`), like compost. After eval. Not cmds. Not actor work except dump.

`inn: Signal` on mill / jam / still / furnace. Port `in` origin top, lamp. Unwired 0. `inn === 1` skip tick (`progress`; still water `pull`). No hold. Dump + `Act.unload` + west-store pull still fill. Unwired = enabled. Furnace also has `out` + `hold` — [[#Furnace]].

Assumption: mill/jam/still/furnace tick after this tick’s eval so `inn` gates the same tick.
Assumption: `buy-furnace` Processing shelf, compost group.

## Dump

Intents `still` `barrel` `jam` `mill` `furnace` at `Coord`. `dest(still | furnace)` = origin. `dest(barrel | jam | mill)` = `at`. Instant dump like compost: consume accepted cargo, not per-unit grind-work. Dump/pull all legal until dest full. Mill/jam/still/compost/furnace keep `frontOf` drops. Guest may dump. Vehicle I/O [[mechanics/vehicles]]. [[architecture/world]] `world.dest`.

Refuse `{ kind: 'rotten' }` `{ kind: 'dead' }` (no crop id). Freshness-0 fruit is not an item after tick. Seeds, tree seeds, tools: refuse. Furnace accept is the feedstock table — [[#Feedstock]]. Not this mill refuse list.

Grinder dump is mill-style: `{ act: 'grind' }`, `arm(0.4)`, into hopper. Not actor `GRIND_WORK`. Guest may dump.

Freezer reuses `{ act: 'chest' }` and `swapChest`. Guest may not open.

## Chest I/O

West of the machine = input. East = output. Orthogonal, same row. Not N/S. Not diagonal.

Still: west of origin, east of the east cell (`base.col + base.w`). Furnace: west of origin, east of origin, origin row only. South furnace cell is not I/O.

Targets: chest, freezer (any slot count). Machine is the actor. Link is view-derived from adjacency. Not a `Cell`. Not saved. Not a cmd.

A chest between two machines is A's output and B's input.

**Pull** — each `BIG_TICK`, origin only: if west neighbor is chest/freezer, dump-all legal from its slots into the machine. Same accept as walk dump. Slot order `0..n-1`. Until hopper/cap full. Compost consumes the whole slot. Empty box cargo stays in the box. Then compact. `inn === 1` still fills.

**Push** — on produce, not on big tick. If east neighbor is chest/freezer: `insertSlots` the output item. Success → consume the batch. Full → wait, do not drop. No east store → `frontOf` / `dropSpot` (no plot → wait).

Machines: mill, jam, still, compost-box, grinder, furnace. Not barrel.

Blue chute west, green chute east. Always painted, under the machine and chest. Not lens. `pointer-events-none`. Furnace: origin row only.

## Sugar

`{ kind: 'sugar'; liters; capacityLiters; unitSale }`. Illegal: `count` on sugar. Merge: weighted `unitSale` by liters; `liters` sums; `capacityLiters` sums.

`SUGAR_BAG`. Mill output `unitSale` `SUGAR_MILL`. Shop `buy-sugar` `SUGAR_SHOP` for `SUGAR_BAG` — derived `SUGAR_SHOP × SUGAR_BAG`. Utility tab. `unlock-preservatives`. `haggling`. Does not arm.

Growing + milling cane is cheaper per liter than shop (`SUGAR_MILL < SUGAR_SHOP`). Cane fruit also sells as fruit.

Compost: `liters × COMPOST_VALUE.fruit`.

## Mill

Hopper. First accepted dump locks `recipe`. Later dumps must match. `units === 0` → `recipe: 'none'`.

Need: cane / olive / wheat `MILL_IN`. Grass `MILL_GRASS` — `{ kind: 'grass' }`, not grass-seeds. Vanilla `MILL_VANILLA_IN` 2 — preference. `millNeed('vanilla')` is `MILL_VANILLA_IN`. `MILL_VANILLA_OUT` 3 — preference. `millRecipeOf`: grass, or fruit sugar-cane | olive | wheat | vanilla.

At `units >= need`: tick `progress += dt × machineMul / MILL_WORK`. At 1: consume need, drop output `frontOf` (compost rule: no plot → wait), leftover stays.

| recipe | in | out |
|---|---|---|
| `'sugar-cane'` | `MILL_IN` fruit | sugar `SUGAR_BAG` L, `SUGAR_MILL` |
| `'olive'` | `MILL_IN` fruit | `{ kind: 'oil' }` `OIL` |
| `'wheat'` | `MILL_IN` fruit | `{ kind: 'flour' }` `FLOUR` |
| `'grass'` | `MILL_GRASS` grass | `{ kind: 'extract' }` count 1, `EXTRACT` |
| `'vanilla'` | `MILL_VANILLA_IN` fruit | `{ kind: 'extract' }` count `MILL_VANILLA_OUT`, `EXTRACT` |

`MILL_RECIPES` order: sugar-cane olive wheat grass vanilla.

`millProductName('vanilla')` is `vanilla extract`. Grass name unchanged (`extract`). Vanilla mill yields the existing extract stall good, not a new SKU. Olive mill takes `TreeId` olive fruit. Almanac extract plate is Ingredients via `recipesUsing`, gate `unlock-grinder`. No CropPane mill line.

Extract: mill recipe, no research gate, sellable, no plant effect.

Mill ignores freshness and rarity for output sale.

Assumption: vanilla mill yields the existing extract stall good, not a new SKU.

## Grinder

1×1 hopper. First accepted dump locks `crop` + `rarity`. Later dumps must match both. `units === 0` → `crop: 'none'`. Need 1 annual fruit including sugar-cane. Not `TreeId`. Not sugar liters.

At `units >= 1`: tick `progress += dt × machineMul / GRIND_WORK`. At 1: consume 1, `grind.at(col, row, day, n)`, `n += 1`, emit `GRIND_MIN`..`GRIND_MAX` seeds, same crop and rarity. No plot / east store full → wait. Seeds do not merge into house.

No pads. No `inn`. Box dump fills hopper (cargo emptied, box stays).

## Jam

`JAM_IN`. `JAM_SUGAR`. `JAM_SECONDS`. `JAM_BUFFER`. `sugar` clamp `0..JAM_BUFFER`.

Dump fruit: `crop === 'none'` locks `JamCrop`. Else must match. No mix. `fruit === 0` → `crop: 'none'`. Dump sugar: fill buffer from hand liters. Apple fruit is refuse.

Ignores freshness and rarity.

At `fruit >= JAM_IN` and `sugar >= JAM_SUGAR`: `progress += dt × machineMul / JAM_SECONDS`. At 1: `fruit -= JAM_IN`, `sugar -= JAM_SUGAR`, drop jam `frontOf` (wait if no plot).

`{ kind: 'jam'; crop: JamCrop; count; unitSale }`. No rarity. `unitSale` `JAM_SALE[crop]`. `JAM_CROPS` 5. No apple. Grape jam stays. Apricot / cherry / tomato / raspberry jam stay.

Almanac jam plate on `JamCrop` Ingredients iff `unlock-preservatives` done — `recipesUsing`, not a hardcoded fruit-row plate. Tomato face **Ketchup**. [[ui/almanac]]

## Still

`base.w = 2` `base.h = 1`. Tick origin. Water join any corner. `World.stills` same instances. Hit, ghost footprint, I/O, ports, pads stay 2×1. viewBox stays `48×24`. Prop art occupies 1.5×1 centered in that viewBox (6 viewBox units empty each side). Origin-only paint + `TILE/24` of the viewBox; empty margin is empty pixels. Do not scale the sprite down. [[art/machines]]

`STILL_CAP`. No overload: dump takes only remaining units. Production starts iff feed count `=== STILL_CAP` and `pull` `STILL_WATER` succeeds (full amount; short → pull 0, retry each tick). `STILL_WATER` 2 — preference. Water once at start, not per tick. `inn === 1` skips that pull and `progress`. Still recipes already carry `STILL_WATER` liters on the water face.

`STILL_SECONDS`. Not a machinery job. `progress += dt / STILL_SECONDS`. Consume feed and `still.at(col, row, day, n)` on finish only — [[mechanics/rng]]. Then `n += 1`. Drop one spirit `frontOf` (wait if no plot).

`spiritKind`: all potato → `vodka`; all wheat → `beer`; all apricot → `brandy`; else `mixed`.

Rarity: mean `RARITY_RANK` index by unit; `u < frac` → ceil else floor. Clamp common..heirloom. Ignore freshness.

`unitSale` = `SPIRIT_SALE[spirit] × SPIRIT_RARITY[rarity]`; mixed then `× MIXED_MUL`.

Assumption: mixed uses `SPIRIT_SALE.vodka` then `× MIXED_MUL`.

One batch → `count` 1.

## Barrel

`BarrelCrop = 'grape' | 'apple'`. `CaskId = 'wine' | 'cider'`. `CASK_OF` maps crop → cask. `Barrel.crop` starts `'none'`.

First accepted dump locks `crop`, mill-style. Later dumps must match. Collect clears it back to `'none'`. No mix. `barrelNeed('apple')` = 4, `barrelNeed('grape')` = 5. Catalog/recipe rows use `barrelNeed`. Wine still 5. `BARREL_CAP` as a single 5 is wrong for cider — grape stays 5. No overload. Age ticks after `crop !== 'none'` and feed count `=== barrelNeed(crop)`. `BARREL_MATURE = DAY_SECONDS` — derived. `BARREL_AGE = 3 × DAY_SECONDS` — derived. `CASK_SALE.cider` unchanged.

At `age === BARREL_MATURE`: consume `barrel.at(col, row, day, n)`, bake rarity (same mean/clamp as still; ignore freshness), `n += 1`. Age continues.

Collect after mature only. Same `act: 'barrel'`: empty hand or a mergeable cask of the same `cask` and rarity. Not a drop. Age stays on the barrel until collect.

Age mul: linear `1 → CASK_AGE[r]` over `BARREL_AGE` after mature. Clamp at `CASK_AGE`.

Cask item `{ kind: 'cask'; cask: CaskId; rarity; count; unitSale }`. Age baked into `unitSale` at collect: `CASK_SALE[cask] × SPIRIT_RARITY[r] × ageMul`. `count` 1. One barrel SKU. Illegal whisky.

`caskAgeOf(item)` reads that multiplier back out of `unitSale` — no age field on the item. `itemLine` and `itemTip` show it when it rounds above 1. Stacking is unchanged: `stackable` matches on `cask` + `rarity`, and `mergeInto` averages `unitSale` weighted by count, so merging a fresh cask into an aged one keeps the total worth intact.

## Freezer

`FREEZER_SLOTS`. Any item, like chest. `tickFreshness` runs freezer slots at `FREEZER_ROT_MUL` 0.2 — preference — of the open rate: cold slows rot, it does not stop it and it never restores freshness. Chest / house / hand / ground / quad / harvest trailer fruit tick at 1. Mill hopper is units, no freshness. `out` + `SENSOR_HOLD`: full = no empty slot. Port `out` origin bottom. [[mechanics/sensors]].

`swapChest` on a freezer cell. Guest: not. Host cue reuses chest.

## Furnace

`Furnace` `{ units; progress; inn; out; hold }`. `base.w = 1` `base.h = 2`. Tick origin. Hit, ghost footprint, I/O, ports, pads stay 1×2. viewBox stays `24×48`. Prop art occupies 1×1.5 south-aligned in that viewBox (12 viewBox units empty at the top) so the opening stays in the south cell. Chimney sits in the origin cell. Origin-only paint + `TILE/24` of the viewBox; empty margin is empty pixels. Do not scale the sprite down. [[art/machines]]

`FURNACE_CAP` `FURNACE_NEED` `FURNACE_SECONDS` `FURNACE_ASH` — preference. No overload: dump takes whole items while `units + furnaceValue <= cap`; sugar liters may partial. Production ticks iff `units >= FURNACE_NEED` and `inn === 0` and `progress < 1`. Mix freely: no recipe lock. `units === 0` → empty.

`progress += dt × furnaceMul / FURNACE_SECONDS`. Not a machinery job. At 1: `units -= FURNACE_NEED`, leftover stays, drop `{ kind: 'ash'; count: FURNACE_ASH }` east store else `frontOf` (full / no plot → wait at `progress >= 1`).

Working: `units >= FURNACE_NEED` and `inn === 0` and `progress < 1`. Prop groups `off` / `on`. Two state VFX while working: `furnace` at the south cell (opening) and `furnace-smoke` at the origin cell (chimney). File `src/assets/vfx/vfx-furnace-smoke.svg`. Reduced motion: frame 0 both. Idle: neither.

`out` high iff `units === 0`. `SENSOR_HOLD` on `out`. Port `in` origin top, `out` origin bottom. First machine with both. Combinational `inn` like mill, no hold. `out` is a world-reader like chest. South cell: no port. Unwired `inn` 0 ticks. `inn === 1` skip tick; dump and Unload still fill.

## Feedstock

`furnaceValue(item)` — `FURNACE_VALUE` preference. Refuse → 0, dump refuses.

| item | units |
|---|---|
| rotten, seeds, grass-seeds, tree-seed, weed, grass, dead | `FURNACE_VALUE.green` × count (tree-seed: × 1, no `count`) |
| fruit (any crop, any rarity) | `FURNACE_VALUE.fruit` × count |
| sugar | `FURNACE_VALUE.fruit` × liters |
| oil | `FURNACE_VALUE.oil` × count |
| spirit (any kind) | `FURNACE_VALUE.spirit` × count |
| wood | `FURNACE_VALUE.wood` × count |

Heirloom fruit uses the fruit rate. Jam, cask, flour, extract, compost bags, fertilizer, synth, weed-spray, tools, ash: refuse. Tree-seed is green rate even though compost refuses it.

Ash into compost: `COMPOST_VALUE.ash` × count. Compost still counts `COMPOST_NEED` waste. Wood is not compost. Wood and ash are not stall goods.

## furnaceMul

Chebyshev ≤ `FURNACE_REACH` between any cell of a **working** furnace and any cell of the target footprint (derived 7 wide × 8 tall from a 1×2). Count `n` working furnaces in reach, **including the target** if it is a working furnace. `FURNACE_REACH` `FURNACE_HASTE` — preference.

`furnaceMul = 1 + FURNACE_HASTE × n`. Progress `+= dt × machineMul() × furnaceMul / work` on mill, jam, grinder. Progress `+= dt × furnaceMul / fixed` on still, compost-box, furnace. Barrel age unchanged. Catalog `clockText` stays nominal seconds. Live `left` uses the tick rate.

A lone working furnace covers itself. Two covering furnaces on a mill: `n = 2`. Empty / filling / `inn === 1` / waiting on output (`progress >= 1`): that furnace is not in `n`.

Snapshot the working set at the start of `tickMachines` (after this tick’s `evalSensors`). Two-pass: who would tick, then apply. `tickCompost` uses that same set.

Covering area of a 1×2 is that Chebyshev set (derived 7 wide × 8 tall). Armed `buy-furnace` and unarmed hover of a placed furnace paint it stroke-only — [[ui/place]] [[architecture/view]] `view.furnace-cover`.

Hover mill / jam / still / grinder / compost-box / furnace: one look line iff live covering count `n > 0`. Barrel never. `n === 0`: no line. `{%}` is `FURNACE_HASTE × n` as percent. `{n}` is that count. Look reads live working furnaces, not `furnaceSnap`. Copy [[ui/machines]] [[ui/inspect]].

Assumption: one snapshot per `World.tick`; compost after machines still reads the start-of-`tickMachines` set.
Assumption: smoke viewBox `24×24`, frames `f0`–`f3`, cell-anchor at the origin cell corner; smoke sits on the chimney in that cell.

## Machinery

Player `machinery`: valve 0.3 s, mill tick, jam tick, grinder tick `÷ (1 + 0.05 × tier)`. Still / barrel / furnace not work jobs. Pipe place stays 0. `furnaceMul` is not `machinery`.

## Recipes

`sim/recipe.ts`. No `World`. The one enumeration of what each machine makes; every number derived from `defs/items.ts` and `sim/machine.ts`, none retyped. Shown by [[ui/recipe]]. Reverse lookup `recipesUsing(face)` for [[ui/almanac]] Ingredients.

`MachineId` — `mill` `jam` `still` `barrel` `grinder` `compost-box` `furnace`. Freezer and chest are storage, not machines. `machineOfSku('buy-furnace')` is `furnace`. `CraftCell` += `Furnace`.

`Amount` — `units` | `liters` | `waste`. Sugar and still water are liters. The box still fills on `COMPOST_NEED` waste (`COMPOST_VALUE`, not items). Display rows use the item counts that make one batch: fruit `COMPOST_NEED / COMPOST_VALUE.fruit`, weed/grass `COMPOST_NEED / COMPOST_VALUE.weed`, rotten `COMPOST_NEED / COMPOST_VALUE.rotten` (5), ash `COMPOST_NEED / COMPOST_VALUE.ash`. Furnace live `have` / `need` are furnace units (`FURNACE_NEED`). List rows show item counts `FURNACE_NEED / FURNACE_VALUE.*`.

`Ingredient` — `one` | `any`. `any` is the set-input rows: mixed still, grinder (any `AnnualId`), compost fruit (any `CropId`), compost green (weed, grass), compost rotten (`CropClass` faces), furnace green / fruit / spirit.

`recipesUsing(face): readonly Recipe[]` — walk `MACHINE_IDS` then `recipesOf`. Include a recipe iff some input is `one` and matches `face` by kind+identity. Skip `any` (mixed still, grinder, compost fruit / green / rotten, furnace green / fruit / spirit). A still or jam recipe still matches on its fruit `one` when water or sugar is a second `one`. Furnace sugar / oil / wood `one` match. Compost ash `one` matches.

Identity: fruit `crop` (not rarity, not bio, not freshness); jam `crop`; spirit `spirit`; cask `cask`; seeds `crop`; else kind only.

Order is machine order then list order. No World. Wheat → mill flour then still beer. Apricot → jam then still brandy. Vanilla → mill extract. Sugar-cane → mill sugar. Apple → barrel cider. Olive → mill oil. Carrot → none.

`Yield` — `exact` | `range`. `range` is the grinder's `GRIND_MIN`..`GRIND_MAX` with `faces` in `ANNUAL_IDS` order, lockstep with the input faces.

`Duration` — `work` divided by `machineMul` (mill, jam, grinder); `fixed` not divided by `machineMul` (still, compost, furnace); `age` for the barrel, which has no `progress`. `furnaceMul` multiplies mill, jam, grinder, still, compost-box, furnace progress; not barrel. Catalog `clockText` stays nominal seconds. Live `left` uses the tick rate. The one place that rule is written.

`clockText(seconds)` is `{n} sec`. `n` is `Math.round(seconds)`.

Rows: mill `MILL_RECIPES` 5, jam `JAM_CROPS` 5, still `STILL_CROPS` 3 + mixed, barrel `BARREL_CROPS` 2 (`barrelNeed`), grinder 1, compost 4 (fruit, then weed/grass, then rotten, then ash `one`), furnace 6 (green `any`, fruit `any`, sugar `one`, oil `one`, spirit `any`, wood `one`). All compost rows yield `COMPOST_LITERS`. `recipesOf('compost-box')` 4. `recipesOf('furnace')` 6, all yield `FURNACE_ASH` ash, duration `fixed` `FURNACE_SECONDS`. `recipesOf('barrel')` lists `BARREL_CROPS` (grape → wine, apple → cider). Live barrel craft pins to the locked crop. Live furnace: empty (`units === 0`) cycles all list rows; filling / working / ready pin the first list row; `have` / `need` stay furnace units. Mix; no recipe lock.

Still water is an input of `STILL_WATER` liters drawn with the `water` face — [[art/items]]. Water is not an `Item`. Not `tap`.

Empty compost (`units === 0`) is `idle` so the live row cycles all list rows. Filling / working / ready pin the fruit row; `have` / `need` stay waste. Sim already accepts rotten.

`craftState` derives the live `Craft`: `idle` `filling` `paused` `thirsty` `working` `ready`. `thirsty` is `stillReady && progress === 0` — `tickMachines` only leaves `progress` at 0 after `pullStillWater` succeeds, so no net read is needed. `ready` is `progress >= 1`, held there while the output has nowhere to go, and the collectable barrel. Furnace: no `thirsty`. `inn === 1` and `units > 0` → `paused`. Live `left` uses tick rate (`machineMul × furnaceMul` on `work`, `furnaceMul` on `fixed`).

Assumption: the barrel counts down to `BARREL_MATURE`, not `BARREL_AGE`.

## Sale bake

`sim/machine.ts`. No `World`.

Crop fruit stall path unchanged. Machine goods: baked `unitSale`, no `stallX`, no `raritySale`. Saleswoman every `StallGoodId`. Őstermelő iff `rarity === 'heirloom'` (spirit, wine, crop fruit). Bio: crop fruit only. Jam / oil / flour / extract / sugar: no rarity, no bio. Clearance: `{ kind: 'rotten' }` only.

Merge same keys; sugar by liters; else by count; weighted `unitSale`.

## Output

Produce: mill, jam, still, compost-box, grinder, furnace. East store insert if present; else drop `frontOf`. Barrel collect into hand.

Spirit / wine / jam / oil / flour / extract: not compost unless named (sugar only). Ash composts. Wood does not.

## Pads

Geometric, not a `Cell`. Mill, still, jam, compost-box, chest, freezer, furnace. Dropoff north Unload / takeup south Load — [[mechanics/vehicles]]. Furnace takeup is south of the south cell (`base.row + h`). Barrel, grinder: not.

## Invariants

`machines.sugar` — Ripe cane harvests as fruit. Mill `MILL_IN` cane → `SUGAR_BAG` at `SUGAR_MILL`. Sugar `{ kind: 'sugar'; liters; capacityLiters; unitSale }`. Illegal: `sugar.count`. Sugar does not tick freshness.

`machines.mill-vanilla` — Mill recipe `'vanilla'`: `MILL_VANILLA_IN` vanilla fruit → `{ kind: 'extract' }` count `MILL_VANILLA_OUT`, `unitSale` `EXTRACT`. Same stall good as grass mill. `millProductName('vanilla')` is `vanilla extract`. Grass name unchanged. No new SKU. `MILL_RECIPES` order sugar-cane olive wheat grass vanilla. Almanac extract plate is Ingredients via `recipesUsing`, not a fruit-row plate.

`machines.barrel` — Barrel locks one `BarrelCrop` on first dump: grape → wine, apple → cider. No mix. Collect clears `crop`. No whisky. `barrelNeed('apple')` 4, `barrelNeed('grape')` 5. `recipesOf('barrel')` lists `BARREL_CROPS`. Rows: 2. Catalog/recipe rows use `barrelNeed`. `CASK_SALE.cider` unchanged.

`machines.still-foot` — `PotStill` `RectBase` `w = 2` `h = 1`, origin NW, no rotate, same instance both cells, tick origin, water join any corner. Hit, ghost footprint, I/O, ports, pads stay 2×1. viewBox `48×24`. Prop art occupies 1.5×1 centered in that viewBox. Origin-only paint + `TILE/24` of the viewBox. Do not scale the sprite down.

`machines.inn` — `inn === 1` freezes mill/jam/still/furnace ticks (progress + still water pull). Dump and Unload still fill.

`machines.unwired` — Unwired mill/jam/still/furnace `inn` 0 ticks (enabled).

`machines.quad-mill` — Quad on mill dropoff: Unload cane into mill.

`machines.tractor-mill` — Tractor harvest on mill takeup: Load sugar drop.

`machines.water` — `STILL_WATER` 2 preference. Start still requires full pull. Every still recipe carries that many liters on the water face.

`machines.io-side` — West chest/freezer is input. East is output. Still: west of origin, east of east cell. Furnace: west of origin, east of origin, origin row only.

`machines.io-pull` — Each `BIG_TICK`, dump-all legal from the west store into the machine.

`machines.io-push` — Produce inserts into the east store if present; else `frontOf`. East store full → wait.

`machines.grind-hopper` — Grinder is a hopper. `GRIND_WORK` 12 — preference. Mill-like tick. Not actor work. Seeds do not merge into house.

`machines.recipe-source` — `sim/recipe.ts` is the only recipe enumeration. Mill `MILL_RECIPES` 5; inputs equal `millNeed` (`MILL_VANILLA_IN` on vanilla). Jam `JAM_CROPS` 5, carries `JAM_IN` fruit and `JAM_SUGAR` liters. No apple jam. Grinder yields `GRIND_MIN`..`GRIND_MAX` with seed faces matching the annual inputs. Compost lists four recipes; the box counts `COMPOST_NEED` waste. Furnace lists six recipes; the machine counts `FURNACE_NEED` units. Barrel `BARREL_CROPS` 2, inputs equal `barrelNeed`, `age` not `work`. `recipesUsing` is the reverse lookup.

`machines.recipe-water` — Every still recipe carries one `liters` input of `STILL_WATER` on the `water` face and `STILL_CAP` fruit.

`machines.recipe-compost` — Compost lists four recipes. Fruit: any `CropId`. Green: weed, grass. Rotten: `CropClass` faces, amount `COMPOST_NEED / COMPOST_VALUE.rotten` (5). Ash: `one`, amount `COMPOST_NEED / COMPOST_VALUE.ash`. Sim still counts `COMPOST_NEED` waste. Empty box cycles all list rows.

`machines.recipe-haste` — `work` durations divide by `machineMul`; `fixed` and `age` do not. `furnaceMul` multiplies mill, jam, grinder, still, compost-box, furnace progress; not barrel. Catalog `clockText` stays nominal.

`machines.furnace-feed` — Accept compost feedstock + oil + spirit + wood + tree-seed. Values as `FURNACE_VALUE`. Mix. Cap `FURNACE_CAP`. Refuse jam/cask/flour/extract/ash/tools.

`machines.furnace-burn` — `FURNACE_NEED` units, `FURNACE_SECONDS`, consume `FURNACE_NEED` at finish, drop `FURNACE_ASH` ash, leftover stays, `inn === 1` skips.

`machines.furnace-haste` — Working furnace Chebyshev ≤ `FURNACE_REACH` on footprint. `1 + FURNACE_HASTE × n` including self. Still and compost take it. Barrel does not. Waiting / empty / gated do not count.

`machines.furnace-io` — West pull, east push, pads, `in` top, `out` bottom high iff `units === 0`. Origin row only. South cell no port.

`machines.furnace-draw` — `Furnace` `RectBase` `w = 1` `h = 2`, origin NW, no rotate, same instance both cells, tick origin. Hit, ghost footprint, I/O, ports, pads stay 1×2. viewBox `24×48`. Prop art occupies 1×1.5 south-aligned in that viewBox so the opening stays in the south cell. Origin-only paint + `TILE/24` of the viewBox. Do not scale the sprite down.

`machines.furnace-smoke` — Working furnace mounts two state VFX: `furnace` at the south cell (opening) and `furnace-smoke` at the origin cell (chimney). File `src/assets/vfx/vfx-furnace-smoke.svg`. Reduced motion: frame 0 both. Idle: neither.

`machines.furnace-cover` — Covering area is Chebyshev ≤ `FURNACE_REACH` over the 1×2 (derived 7×8). Armed `buy-furnace` and unarmed hover of a placed furnace (either cell) paint that area stroke-only. Footprint `data-cell-stroke` stays. Not a lens. Not a dock. Not sprinkler fill.

`machines.furnace-haste-look` — Hover mill / jam / still / grinder / compost-box / furnace: one look line iff covering working count `n > 0`. `{%}` is `FURNACE_HASTE × n` as percent. `{n}` is covering count. Barrel never. `n === 0`: no line. Live working set, not `furnaceSnap`.

`machines.recipes-using` — `recipesUsing(face)` matches `one` inputs by kind+identity. Skip `any` (mixed still, grinder, compost, furnace green / fruit / spirit). Still / jam fruit `one` matches even when water / sugar is a second `one`. Furnace sugar / oil / wood `one` match. Compost ash `one` matches. Almanac Ingredients is this list, gated by machine unlock in `done`. No hardcoded crop→product plates on the fruit row.
