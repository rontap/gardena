# Machines

Look and prompt for mill, jam, still, barrel, freezer, grinder, furnace, infuser, sorter. Station [[ui/station]]. Rules [[mechanics/machines]] [[mechanics/infusion]]. Place [[ui/place]]. Size [[items/buildings]]. Inspect [[ui/inspect]] points here. Recipe row [[ui/recipe]]. Chest chrome [[ui/docks]].

No ObjectHud. No pop-up GUI. Nothing attaches to the machine. Progress is look text here; the bottom-right `Status` also draws one recipe row. Station has no recipe row; its walk-up is a panel.

Dump legal → prompt is the verb. Else prompt is the look line (compost / grinder / furnace / station / infuser). Compost: `Compost box - {n}/{need} units` / `Compost box - working {pct}%`. `pct` = `floor(progress * 100)`. Furnace ash dump **Burn**; flour dump **Bake**. `{ act: 'furnace'; at }`. Either cell, one look. Prop `off` / `on` from working. Two state VFX while working — [[mechanics/machines]] `machines.furnace-smoke`. Infuser dump **Infuse**. `{ act: 'infuse'; at }`. Any of four cells, one look.

West chest/freezer paints a blue chute on the shared edge. East paints a green chute. Always on, under the machine and chest. Not lens. Not a cell hit. Chute row follows chest I/O — [[mechanics/machines]] `machines.io-side`. Pads mill / still / jam / compost-box / freezer / furnace / station / infuser: dropoff north Unload, takeup south Load. Barrel, grinder: not. Ports mill / jam / still / station / infuser `in` origin top; freezer `out` origin bottom; furnace `in` origin top and `out` origin bottom. Lens [[ui/sensors]]. Chrome [[ui/vehicles]].

Mill, jam, barrel, grinder lock crop + Variety. Infuser locks the good. Still does not. Furnace locks ash vs bread. Compost ignore Variety and Quality — [[mechanics/machines]] `machines.variety-lock`.

## Mill

| when | text |
|---|---|
| empty (`recipe` `'none'`) | **Mill** |
| filling | **{have}/{need} → {product}** |
| wrong locked | **{Variety} only** |
| full (`units >= need`) | **Mill - full** |

`need` is `millNeed`. `{product}` from `millProductName`. Prompt dump legal: **Crush into sugar** / **Crush into olive oil** / **Crush into flour** / **Crush into extract** / **Crush into vanilla extract** / **Crush into flakes**. `{ act: 'mill'; at }`.

## Seed grinder

| when | text |
|---|---|
| empty (`crop` `'none'`) | **Seed grinder** |
| filling | **{have} → seeds** |
| wrong locked | **{Variety} only** |
| working (`units >= 1`) | **Seed grinder - working {pct}%** |

Need 1. Prompt dump legal: **Grind**. `{ act: 'grind'; at }`.

## Pot still

| when | text |
|---|---|
| filling | **Pot still - {n}/{cap}** |
| full, no water | **Pot still - {cap}/{cap}, needs water** |
| working | **Pot still - working {pct}%** |
| refuse wrong | **Pot still - potatoes, wheat or apricot** |
| full overflow | **Pot still - full** |

`{n}` feed count. Cap `STILL_CAP`. Prompt dump legal: **Distill**. `{ act: 'still'; at }`. Either cell, one look.

## Barrel

| when | text |
|---|---|
| empty | **Barrel - {n}/{need}** |
| Variety locked, filling | **Barrel - {n}/{need} {Variety}** |
| maturing (`age < BARREL_MATURE`) | **Barrel - maturing {pct}%** |
| aging | **Barrel - aging {n}d, sells at ×{mul}** |
| refuse not a barrel crop | **Barrel - grapes or apples** |
| refuse wrong Variety | **{Variety} only** |
| full | **Barrel - full** |

Filling `{n}` feed count. Need `barrelNeed`. Maturing `{pct}` = `floor((age / BARREL_MATURE) * 100)`. Aging `{n}` = `floor(age / DAY_SECONDS)`, `{mul}` = age multiplier to two decimals. The Aging fill row is [[ui/inspect]].

An aging barrel adds a second look line under the first: **{Wine|Cider} made from {Variety}. Aging up to {days} days multiplies its sale price by {mul}.** `{days}` = `BARREL_AGE / DAY_SECONDS`, `{mul}` = `caskAgeTop(q)` at the barrel's mean Quality. Maturing shows no such line. Names from `caskName` — [[mechanics/machines]] `machines.cask-premium`.

Prompt dump legal: **Fill barrel**. Prompt collect (mature, empty hand or merge the matching cask): **Collect wine** / **Collect cider** off `CASK_OF[crop]`. Same `{ act: 'barrel'; at }`.

## Jam machine

| when | text |
|---|---|
| empty | **Jam machine** |
| fruit locked, wrong | **{Variety} only** |
| filling fruit | **{fruit}/{need} {jar}** |
| sugar buffer | **{sugar}L / {buffer}L** |
| working | **Jam machine - working {pct}%** |

`{fruit}` vs `JAM_IN`. Buffer vs `JAM_BUFFER`. Buffer line while filling (with the fruit line). Working line alone. Named jars [[ui/recipe]].

Prompt fruit dump: **Make jam** / **Make ketchup**. Named jar dump prompt: **Make grape jelly** / **Make black raspberry jam** / **Make Passata**. Prompt sugar dump: **Fill sugar**. `{ act: 'jam'; at }`. Apple fruit is refuse. Dump illegal. Prompt stays the look line.

## Freezer

Look **Freezer**. Prompt walk-up **Freezer**. `{ act: 'chest'; at }`. Host overlay. Guest: no open. Overlay: chest chrome, title **Freezer**, `FREEZER_SLOTS`, same swap buttons as chest. Host only.

## Furnace

| when | text |
|---|---|
| empty (`units === 0`) | **Furnace** |
| filling ash (`units < FURNACE_NEED`) | **Furnace - {n}/{need} units** |
| filling bread | **Furnace - {n}/{need} flour** |
| working | **Furnace - working {pct}%** |
| paused (`inn === 1`) | **Furnace - Paused by wire** |
| ready (`progress >= 1`) | **Furnace - Output blocked** |
| refuse wrong lock | **Furnace - ash or bread** |
| refuse | **Furnace - will not burn this** |
| full (`units >= FURNACE_CAP`) | **Furnace - full** |

`{n}` hopper units. `pct` = `floor(progress * 100)`. Prompt dump legal ash: **Burn**. Prompt dump legal flour: **Bake**. `{ act: 'furnace'; at }`. Either cell.

## Infuser

| when | text |
|---|---|
| empty (`lock` `'none'`) | **Infuser** |
| filling good | **{have}/{need} → Infused {name}** |
| filling reagent | **{have}/{need} Flakes** / **{have}/{need} Vanilla extract** |
| wrong locked | **{Variety} only** / **Olive oil only** / **Mixed spirit only** |
| refuse infused | **Already infused** |
| working | **Infuser - working {pct}%** |
| ready | **Output blocked** |
| paused (`inn === 1`) | **Paused by wire** |

`need` `INFUSE_IN`. Prompt dump legal: **Infuse**. `{ act: 'infuse'; at }`. Any of four cells, one look.

## Variety sorter

No HUD, no walk-up panel, no dump prompt. Any of three cells, one look.

| when | text |
|---|---|
| empty (`held` `'none'`) | **Variety sorter** |
| carrying an item | **Variety sorter - Sorting {name}** |
| that side full (`progress >= 1`) | **Variety sorter - The {tier} side is full** |

`{name}` is `faceName(held)`. `{tier}` is `tierLabel` — [[standards/user-facing-text]].

## Covering haste

Hover mill / jam / still / grinder / compost-box / furnace / infuser. Sits in `lookText` after the machine look, before the prompt. Bottom-right `Status`. Not the recipe row. Not ObjectHud. Still / furnace: either cell, one line. Infuser: any of four cells, one line. Live covering count `n` — [[mechanics/machines]] `machines.furnace-haste-look`. Neighbour wait on a plant uses this same insertion — [[ui/inspect]].

| when | line |
|---|---|
| `n > 0` | **Finishes {pct}% faster with {n} working Furnace than without a Furnace.** / **Finishes {pct}% faster with {n} working Furnaces than without a Furnace.** |
| `n === 0` | (no line) |
| barrel | never |
| station | never |

`{pct}` is `FURNACE_HASTE × n` as percent. `{n}` is covering working furnaces on that footprint. A lone working furnace covers itself, so its own hover shows the line.
