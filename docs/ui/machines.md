# Machines

Look and prompt for mill, jam, still, barrel, freezer, grinder. Rules [[mechanics/machines]]. Place [[ui/place]]. Inspect [[ui/inspect]] points here. Chest chrome [[ui/docks]].

No ObjectHud. No pop-up GUI. Nothing attaches to the machine. Progress is look text here; the bottom-right `Status` also draws one recipe row — [[ui/recipe]].

Dump legal → prompt is the verb. Else prompt is the look line (compost / grinder). Compost: `Compost box - {n}/{need} units` / `Compost box - working {pct}%`. `pct` = `floor(progress * 100)`.

West chest/freezer paints a blue chute on the shared edge. East paints a green chute. Always on, under the machine and chest. `pointer-events-none`. Not lens. Not a cell hit.

Still 2×1. Ghost [[ui/place]]. Pads mill / still / jam / compost-box / freezer: dropoff north Unload, takeup south Load. Chrome [[ui/vehicles]]. Barrel, grinder: not. Ports mill / jam / still `in` origin top; freezer `out` origin bottom. Lens [[ui/sensors]].

## Mill

| when | text |
|---|---|
| empty (`recipe` `'none'`) | **Mill** |
| filling | **{have}/{need} → {product}** |
| wrong locked | **Mill - {product} only** |
| full (`units >= need`) | **Mill - full** |

`need` cane / olive / wheat `MILL_IN` 5; grass `MILL_GRASS` 15. `{product}`: sugar, olive oil, flour, extract.

Prompt dump legal: **Crush into sugar** | **Crush into olive oil** | **Crush into flour** | **Crush into extract**. `{ act: 'mill'; at }`.

## Seed grinder

| when | text |
|---|---|
| empty (`crop` `'none'`) | **Seed grinder** |
| filling | **{have} → seeds** |
| wrong locked | **Seed grinder - {crop} only** |
| working (`units >= 1`) | **Seed grinder - working {pct}%** |

`{have}` hopper units. Need 1. `{crop}` locked annual.

Prompt dump legal: **Grind**. `{ act: 'grind'; at }`.

## Pot still

| when | text |
|---|---|
| filling | **Pot still - {n}/10** |
| full, no water | **Pot still - 10/10, needs water** |
| working | **Pot still - working {pct}%** |
| refuse wrong | **Pot still - potatoes, wheat or apricot** |
| full overflow | **Pot still - full** |

`{n}` feed count. Cap `STILL_CAP` 10.

Prompt dump legal: **Distill**. `{ act: 'still'; at }`.

## Wine barrel

| when | text |
|---|---|
| filling | **Wine barrel - {n}/5** |
| maturing (`age < BARREL_MATURE`) | **Wine barrel - maturing {pct}%** |
| aging | **Wine barrel - aging {n}d** |
| refuse | **Wine barrel - grapes** |
| full | **Wine barrel - full** |

Filling `{n}` feed count. Cap `BARREL_CAP` 5. Maturing `{pct}` = `floor((age / BARREL_MATURE) * 100)`. Aging `{n}` = `floor(age / DAY_SECONDS)`.

Prompt dump legal: **Fill barrel**. Prompt collect (mature, empty hand or merge wine): **Collect wine**. Same `{ act: 'barrel'; at }`.

## Jam machine

| when | text |
|---|---|
| empty | **Jam machine** |
| fruit locked, wrong | **Jam machine - {crop} only** |
| filling fruit | **Jam machine - {fruit}/5 {name}** |
| sugar buffer | **{sugar}L / 4L** |
| working | **Jam machine - working {pct}%** |

`{fruit}` vs `JAM_IN` 5. Buffer vs `JAM_BUFFER` 4 L. `{crop}` / `{name}`: crop name; tomato **ketchup**. Buffer line while filling (with the fruit line). Working line alone.

Prompt fruit dump: **Make jam** / **Make ketchup**. Prompt sugar dump: **Fill sugar**. `{ act: 'jam'; at }`.

## Freezer

Look **Freezer**. Prompt walk-up **Freezer**. `{ act: 'chest'; at }`. Host overlay. Guest: no open.

Overlay: chest chrome, title **Freezer**, `FREEZER_SLOTS` 6 cells, 3 columns × 2 rows (`grid-cols-3`). Same swap buttons as chest. Host only.

## Sugar

Held: **Sugar - {n}L**. `n` = `liters`. No `count`.

Assumption: freezer overlay is 3×2. Look strings live here; [[ui/inspect]] does not repeat them.
