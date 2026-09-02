# Machines

Secondary goods. Shop gates [[mechanics/research]]. Consign [[mechanics/market]]. Water [[mechanics/water]]. Dump permissions [[mechanics/multiplayer]]. Numbers preference unless marked.

Ids: `SpiritKind` `JamCrop` `StillCrop` `MillRecipe` `JamId` `StallGoodId` — `sim/ids.ts`. `jam-tomato` display **Ketchup**. Illegal: `'berry'`. Illegal: whisky.

## Buildings

1×1 except still. Place like chest. Still: pumpjack — `RectBase` `w = 2` `h = 1`, origin NW, no rotate, same instance both cells. Pay on confirm. Disarm. Automation tab. `haggling`. Guest may shop + place + `delete` building.

| class | `kind` | sku | unlock |
|---|---|---|---|
| `Mill` | `mill` | `buy-mill` | `unlock-grinder` |
| `JamMachine` | `jam` | `buy-jam` | `unlock-preservatives` |
| `PotStill` | `still` | `buy-still` | `unlock-fermentation` |
| `Barrel` | `barrel` | `buy-barrel` | `unlock-fermentation` |
| `Freezer` | `freezer` | `buy-freezer` | `unlock-preservatives` |

`World.stills` holds the same `PotStill` instances as their cells. Join a water net like `Tap` — [[mechanics/water]].

Tick origin cell only (`base` matches `at`), like compost. After eval. Not cmds. Not actor work except dump.

`inn: Signal` on mill / jam / still. Port `in` origin top, lamp. Unwired 0. `inn === 1` skip tick (`progress`; still water `pull`). No hold. Dump + `Act.unload` + west-store pull still fill. Unwired = enabled.

Assumption: mill/jam/still tick after this tick’s eval so `inn` gates the same tick.

## Dump

Intents `still` `barrel` `jam` `mill` at `Coord`. `dest(still)` = origin. `dest(barrel | jam | mill)` = `at`. Instant dump like compost: consume accepted cargo, not per-unit grind-work. Dump/pull all legal until dest full. Mill/jam/still/compost keep `frontOf` drops. Guest may dump. Vehicle I/O [[mechanics/vehicles]]. [[architecture/world]] `world.dest`.

Refuse `{ kind: 'rotten' }` `{ kind: 'dead' }` (no crop id). Freshness-0 fruit accepted. Seeds, tree seeds, tools: refuse.

Grinder dump is mill-style: `{ act: 'grind' }`, `arm(0.4)`, into hopper. Not actor `GRIND_WORK`. Guest may dump.

Freezer reuses `{ act: 'chest' }` and `swapChest`. Guest may not open.

## Chest I/O

West of the machine = input. East = output. Orthogonal, same row. Not N/S. Not diagonal.

Still: west of origin, east of the east cell (`base.col + base.w`).

Targets: chest, freezer (any slot count). Machine is the actor. Link is view-derived from adjacency. Not a `Cell`. Not saved. Not a cmd.

A chest between two machines is A's output and B's input.

**Pull** — each `BIG_TICK`, origin only: if west neighbor is chest/freezer, dump-all legal from its slots into the machine. Same accept as walk dump. Slot order `0..n-1`. Until hopper/cap full. Compost consumes the whole slot. Empty box cargo stays in the box. Then compact. `inn === 1` still fills.

**Push** — on produce, not on big tick. If east neighbor is chest/freezer: `insertSlots` the output item. Success → consume the batch. Full → wait, do not drop. No east store → `frontOf` / `dropSpot` (no plot → wait).

Machines: mill, jam, still, compost-box, grinder. Not barrel.

Blue chute west, green chute east. Always painted, under the machine and chest. Not lens. `pointer-events-none`.

## Sugar

`{ kind: 'sugar'; liters; capacityLiters; unitSale }`. Illegal: `count` on sugar. Merge: weighted `unitSale` by liters; `liters` sums; `capacityLiters` sums.

`SUGAR_BAG`. Mill output `unitSale` `SUGAR_MILL`. Shop `buy-sugar` `SUGAR_SHOP` for `SUGAR_BAG` — derived `SUGAR_SHOP × SUGAR_BAG`. Utility tab. `unlock-preservatives`. `haggling`. Does not arm.

Growing + milling cane is cheaper per liter than shop (`SUGAR_MILL < SUGAR_SHOP`). Cane fruit also sells as fruit.

Compost: `liters × COMPOST_VALUE.fruit`.

## Mill

Hopper. First accepted dump locks `recipe`. Later dumps must match. `units === 0` → `recipe: 'none'`.

Need: cane / olive / wheat `MILL_IN`. Grass `MILL_GRASS` — `{ kind: 'grass' }`, not grass-seeds.

At `units >= need`: tick `progress += dt × machineMul / MILL_WORK`. At 1: consume need, drop output `frontOf` (compost rule: no plot → wait), leftover stays.

| recipe | in | out |
|---|---|---|
| `'sugar-cane'` | `MILL_IN` fruit | sugar `SUGAR_BAG` L, `SUGAR_MILL` |
| `'olive'` | `MILL_IN` fruit | `{ kind: 'oil' }` `OIL` |
| `'wheat'` | `MILL_IN` fruit | `{ kind: 'flour' }` `FLOUR` |
| `'grass'` | `MILL_GRASS` grass | `{ kind: 'extract' }` `EXTRACT` |

Extract: mill recipe, no research gate, sellable, no plant effect.

Mill ignores freshness and rarity for output sale.

## Grinder

1×1 hopper. First accepted dump locks `crop` + `rarity`. Later dumps must match both. `units === 0` → `crop: 'none'`. Need 1 annual fruit including sugar-cane. Not `TreeId`. Not sugar liters.

At `units >= 1`: tick `progress += dt × machineMul / GRIND_WORK`. At 1: consume 1, `grind.at(col, row, day, n)`, `n += 1`, emit `GRIND_MIN`..`GRIND_MAX` seeds, same crop and rarity. No plot / east store full → wait. Seeds do not merge into house.

No pads. No `inn`. Box dump fills hopper (cargo emptied, box stays).

## Jam

`JAM_IN`. `JAM_SUGAR`. `JAM_SECONDS`. `JAM_BUFFER`. `sugar` clamp `0..JAM_BUFFER`.

Dump fruit: `crop === 'none'` locks `JamCrop`. Else must match. No mix. `fruit === 0` → `crop: 'none'`. Dump sugar: fill buffer from hand liters.

Ignores freshness and rarity.

At `fruit >= JAM_IN` and `sugar >= JAM_SUGAR`: `progress += dt × machineMul / JAM_SECONDS`. At 1: `fruit -= JAM_IN`, `sugar -= JAM_SUGAR`, drop jam `frontOf` (wait if no plot).

`{ kind: 'jam'; crop: JamCrop; count; unitSale }`. No rarity. `unitSale` `JAM_SALE[crop]`.

Almanac jam third icon on `JamCrop` panes iff `unlock-preservatives` done. Tomato face **Ketchup**.

## Still

`base.w = 2` `base.h = 1` **and** prop `48×24` occupying both cells. Tick origin. Water join any corner. `World.stills` same instances. Origin-only paint + `TILE/24` scale shows the full 48-wide art. [[art/machines]]

`STILL_CAP`. No overload: dump takes only remaining units. Production starts iff feed count `=== STILL_CAP` and `pull` `STILL_WATER` succeeds (full amount; short → pull 0, retry each tick). Water once at start, not per tick. `inn === 1` skips that pull and `progress`.

`STILL_SECONDS`. Not a machinery job. `progress += dt / STILL_SECONDS`. Consume feed and `still.at(col, row, day, n)` on finish only — [[mechanics/rng]]. Then `n += 1`. Drop one spirit `frontOf` (wait if no plot).

`spiritKind`: all potato → `vodka`; all wheat → `beer`; all apricot → `brandy`; else `mixed`.

Rarity: mean `RARITY_RANK` index by unit; `u < frac` → ceil else floor. Clamp common..heirloom. Ignore freshness.

`unitSale` = `SPIRIT_SALE[spirit] × SPIRIT_RARITY[rarity]`; mixed then `× MIXED_MUL`.

Assumption: mixed uses `SPIRIT_SALE.vodka` then `× MIXED_MUL`.

One batch → `count` 1.

## Barrel

`BarrelCrop = 'grape' | 'apple'`. `CaskId = 'wine' | 'cider'`. `CASK_OF` maps crop → cask. `Barrel.crop` starts `'none'`.

First accepted dump locks `crop`, mill-style. Later dumps must match. Collect clears it back to `'none'`. No mix. `BARREL_CAP`. No overload. Age ticks after `crop !== 'none'` and feed count `=== BARREL_CAP`. `BARREL_MATURE = DAY_SECONDS` — derived. `BARREL_AGE = 3 × DAY_SECONDS` — derived.

At `age === BARREL_MATURE`: consume `barrel.at(col, row, day, n)`, bake rarity (same mean/clamp as still; ignore freshness), `n += 1`. Age continues.

Collect after mature only. Same `act: 'barrel'`: empty hand or a mergeable cask of the same `cask` and rarity. Not a drop. Age stays on the barrel until collect.

Age mul: linear `1 → CASK_AGE[r]` over `BARREL_AGE` after mature. Clamp at `CASK_AGE`.

Cask item `{ kind: 'cask'; cask: CaskId; rarity; count; unitSale }`. Age baked into `unitSale` at collect: `CASK_SALE[cask] × SPIRIT_RARITY[r] × ageMul`. `count` 1. One barrel SKU. Illegal whisky.

## Freezer

`FREEZER_SLOTS`. Any item, like chest. `tickFreshness` skips freezer slots. Chest / house / hand / ground / mill hopper fruit still tick. `out` + `SENSOR_HOLD`: full = no empty slot. Port `out` origin bottom. [[mechanics/sensors]].

`swapChest` on a freezer cell. Guest: not. Host cue reuses chest.

## Machinery

Player `machinery`: valve 0.3 s, mill tick, jam tick, grinder tick `÷ (1 + 0.05 × tier)`. Still / barrel not work jobs. Pipe place stays 0.

## Sale bake

`sim/machine.ts`. No `World`.

Crop fruit stall path unchanged. Machine goods: baked `unitSale`, no `stallX`, no `raritySale`. Saleswoman every `StallGoodId`. Őstermelő iff `rarity === 'heirloom'` (spirit, wine, crop fruit). Bio: crop fruit only. Jam / oil / flour / extract / sugar: no rarity, no bio. Clearance: fruit only.

Merge same keys; sugar by liters; else by count; weighted `unitSale`.

## Output

Produce: mill, jam, still, compost-box, grinder. East store insert if present; else drop `frontOf`. Barrel collect into hand.

Spirit / wine / jam / oil / flour / extract: not compost unless named (sugar only).

## Pads

Geometric, not a `Cell`. Mill, still, jam, compost-box, chest, freezer. Dropoff north Unload / takeup south Load — [[mechanics/vehicles]]. Barrel, grinder: not.

## Invariants

`machines.sugar` — Ripe cane harvests as fruit. Mill `MILL_IN` cane → `SUGAR_BAG` at `SUGAR_MILL`. Sugar `{ kind: 'sugar'; liters; capacityLiters; unitSale }`. Illegal: `sugar.count`. Sugar does not tick freshness.

`machines.barrel` — Barrel locks one `BarrelCrop` on first dump: grape → wine, apple → cider. No mix. Collect clears `crop`. No whisky.

`machines.still-foot` — `PotStill` `RectBase` `w = 2` `h = 1` **and** prop `48×24` occupying both cells, origin NW, no rotate, same instance both cells, tick origin, water join any corner. Origin-only paint + `TILE/24` scale shows the full 48-wide art.

`machines.inn` — `inn === 1` freezes mill/jam/still ticks (progress + still water pull). Dump and Unload still fill.

`machines.unwired` — Unwired mill/jam/still `inn` 0 ticks (enabled).

`machines.quad-mill` — Quad on mill dropoff: Unload cane into mill.

`machines.tractor-mill` — Tractor harvest on mill takeup: Load sugar drop.

`machines.water` — `STILL_WATER`. Start still requires full pull.

`machines.io-side` — West chest/freezer is input. East is output. Still: west of origin, east of east cell.

`machines.io-pull` — Each `BIG_TICK`, dump-all legal from the west store into the machine.

`machines.io-push` — Produce inserts into the east store if present; else `frontOf`. East store full → wait.

`machines.grind-hopper` — Grinder is a hopper. `GRIND_WORK` is a mill-like tick. Not actor work. Seeds do not merge into house.
