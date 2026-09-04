# Machines

Look and prompt for mill, jam, still, barrel, freezer, grinder, furnace. Rules [[mechanics/machines]]. Place [[ui/place]]. Inspect [[ui/inspect]] points here. Chest chrome [[ui/docks]].

No ObjectHud. No pop-up GUI. Nothing attaches to the machine. Progress is look text here; the bottom-right `Status` also draws one recipe row — [[ui/recipe]].

Dump legal → prompt is the verb. Else prompt is the look line (compost / grinder / furnace). Compost: `Compost box - {n}/{need} units` / `Compost box - working {pct}%`. `pct` = `floor(progress * 100)`. Furnace look below; dump prompt **Burn**. `{ act: 'furnace'; at }`. Either cell, one look. Prop `off` / `on` from working. Two state VFX while working: `furnace` at the south opening, `furnace-smoke` at the origin chimney. Reduced motion: frame 0 both.

West chest/freezer paints a blue chute on the shared edge. East paints a green chute. Always on, under the machine and chest. `pointer-events-none`. Not lens. Not a cell hit. Furnace: origin row only.

Still 2×1. Furnace 1×2. Hit, ghost footprint, I/O, ports, pads stay those sizes. viewBox still `48×24` / furnace `24×48`. Prop art occupies 1.5×1 centered (still) and 1×1.5 south-aligned (furnace) inside those viewBoxes. Ghost [[ui/place]]. Pads mill / still / jam / compost-box / freezer / furnace: dropoff north Unload, takeup south Load. Furnace takeup south of the south cell. Chrome [[ui/vehicles]]. Barrel, grinder: not. Ports mill / jam / still `in` origin top; freezer `out` origin bottom; furnace `in` origin top and `out` origin bottom. Lens [[ui/sensors]].

## Mill

| when | text |
|---|---|
| empty (`recipe` `'none'`) | **Mill** |
| filling | **{have}/{need} → {product}** |
| wrong locked | **Mill - {product} only** |
| full (`units >= need`) | **Mill - full** |

`need` cane / olive / wheat `MILL_IN` 5; grass `MILL_GRASS` 15; vanilla `MILL_VANILLA_IN`. `{product}`: sugar, olive oil, flour, extract, vanilla extract. `millProductName('vanilla')` is **vanilla extract**. Grass name unchanged.

Prompt dump legal: **Crush into sugar** | **Crush into olive oil** | **Crush into flour** | **Crush into extract** | **Crush into vanilla extract**. `{ act: 'mill'; at }`.

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

## Barrel

| when | text |
|---|---|
| empty | **Barrel - {n}/5** |
| crop locked, filling | **Barrel - {n}/5 {crop}** |
| maturing (`age < BARREL_MATURE`) | **Barrel - maturing {pct}%** |
| aging | **Barrel - aging {n}d, sells at ×{mul}** |
| refuse not a barrel crop | **Barrel - grapes or apples** |
| refuse wrong crop | **Barrel - {crop}s only** |
| full | **Barrel - full** |

Filling `{n}` feed count. Cap `BARREL_CAP` 5. Maturing `{pct}` = `floor((age / BARREL_MATURE) * 100)`. Aging `{n}` = `floor(age / DAY_SECONDS)`, `{mul}` = `caskAgeMul(feed[0].rarity, age)` to two decimals. The Aging fill row is [[ui/inspect]].

Prompt dump legal: **Fill barrel**. Prompt collect (mature, empty hand or merge the matching cask): **Collect wine** / **Collect cider** off `CASK_OF[crop]`. Same `{ act: 'barrel'; at }`.

## Jam machine

| when | text |
|---|---|
| empty | **Jam machine** |
| fruit locked, wrong | **Jam machine - {crop} only** |
| filling fruit | **Jam machine - {fruit}/5 {name}** |
| sugar buffer | **{sugar}L / 4L** |
| working | **Jam machine - working {pct}%** |

`{fruit}` vs `JAM_IN` 5. Buffer vs `JAM_BUFFER` 4 L. `{crop}` / `{name}`: crop name; tomato **ketchup**. Buffer line while filling (with the fruit line). Working line alone.

Prompt fruit dump: **Make jam** / **Make ketchup**. Prompt sugar dump: **Fill sugar**. `{ act: 'jam'; at }`. Apple fruit is refuse. Dump illegal. Prompt stays the look line. Not **Make jam**.

## Freezer

Look **Freezer**. Prompt walk-up **Freezer**. `{ act: 'chest'; at }`. Host overlay. Guest: no open.

Overlay: chest chrome, title **Freezer**, `FREEZER_SLOTS` 6 cells, 3 columns × 2 rows (`grid-cols-3`). Same swap buttons as chest. Host only.

## Furnace

| when | text |
|---|---|
| empty (`units === 0`) | **Furnace** |
| filling (`units < FURNACE_NEED`) | **Furnace - {n}/{need} units** |
| working | **Furnace - working {pct}%** |
| paused (`inn === 1`) | **Furnace - Paused by wire** |
| ready (`progress >= 1`) | **Furnace - Output blocked** |
| refuse | **Furnace - will not burn this** |
| full (`units >= FURNACE_CAP`) | **Furnace - full** |

`{n}` hopper units. Cap `FURNACE_CAP`. Need `FURNACE_NEED`. Mix; no recipe lock. `pct` = `floor(progress * 100)`.

Prompt dump legal: **Burn**. `{ act: 'furnace'; at }`. Either cell.

## Covering haste

Hover mill / jam / still / grinder / compost-box / furnace. Sits in `lookText` after the machine look, before the prompt. Bottom-right `Status`. Not the recipe row. Not ObjectHud. Still / furnace: either cell, one line. Live covering count `n`, not `furnaceSnap`.

| when | line |
|---|---|
| `n > 0` | **Finishes {pct}% faster with {n} working Furnace than without a Furnace.** / **Finishes {pct}% faster with {n} working Furnaces than without a Furnace.** |
| `n === 0` | (no line) |
| barrel | never |

`{pct}` is `FURNACE_HASTE × n` as percent. `{n}` is covering working furnaces on that footprint. Plural Furnace / Furnaces. Barrel never, even when `n > 0`. A lone working furnace covers itself, so its own hover shows the line.

## Sugar

Held: **Sugar - {n}L**. `n` = `liters`. No `count`.

Held wood: **Wood - {count}**. Held ash: **Ash - {count}, compost it**. Held axe: **Axe - {left}/{uses} uses left**.

Assumption: freezer overlay is 3×2. Look strings live here; [[ui/inspect]] names the haste HUD state and points here.
