# Machines

Secondary goods. Types [[architecture/world]]. Shop gates [[mechanics/research]]. Consign [[mechanics/market]]. Water [[mechanics/water]]. Dump permissions [[mechanics/multiplayer]]. Numbers preference unless marked.

Path 0.12 whisky: this task. No whisky. Illegal: whisky item. Illegal: barrel beer. Illegal: second barrel SKU.

## Files

| file | owns |
|---|---|
| `src/game/defs/items.ts` | `STILL_*` `BARREL_*` `JAM_*` `MILL_*` `SUGAR_BAG` `FREEZER_SLOTS` `SUGAR_MILL` `SUGAR_SHOP` `SPIRIT_RARITY` `SPIRIT_SALE` `MIXED_MUL` `WINE_SALE` `WINE_AGE` `JAM_SALE` `OIL` `FLOUR` `EXTRACT` |
| `src/game/sim/machine.ts` | feed helpers, rarity mean, sale bake, mill recipes. No `World`. |
| `src/game/sim/building.ts` | `PotStill` 2×1 `inn`; mill/jam `inn`; freezer `out` `hold` |
| `src/game/sim/ids.ts` | `SpiritKind` `JamCrop` `StillCrop` `MillRecipe` `StallGoodId` |
| `src/game/sim/world.ts` | dump/pull all, still 2×1 place, tick after eval unless `inn === 1`, drop, still pull, freezer skip, `World.stills`, load/unload pads |
| `src/game/sim/log.ts` | `Act.load` `Act.unload` |
| `src/game/sim/item.ts` | item arms, sugar liters, compost liters × fruit |

Do not create `src/` here.

## Ids

```
SpiritKind = 'vodka' | 'beer' | 'brandy' | 'mixed'
JamCrop = 'apricot' | 'grape' | 'raspberry' | 'apple' | 'cherry' | 'tomato'
StillCrop = 'potato' | 'wheat' | 'apricot'
MillRecipe = 'sugar-cane' | 'olive' | 'wheat' | 'grass'
JamId = `jam-${JamCrop}`
```

`jam-tomato` display **Ketchup**.

```
StallGoodId =
  | CropId
  | 'sugar'
  | SpiritKind
  | 'wine'
  | JamId
  | 'oil'
  | 'flour'
  | 'extract'
```

`CropId` includes `'sugar-cane'`. Illegal: `'berry'`. Illegal: whisky.

## Buildings

1×1 except still. Place like chest. Still: pumpjack — `RectBase` `w = 2` `h = 1`, origin NW, no rotate, same instance both cells. Pay on confirm. Disarm. Automation tab. `machine-contracts`. Guest may shop + place + `delete` building.

| class | `kind` | sku | $ | unlock |
|---|---|---|---|---|
| `Mill` | `mill` | `buy-mill` | 35 | `unlock-grinder` |
| `JamMachine` | `jam` | `buy-jam` | 40 | `unlock-preservatives` |
| `PotStill` | `still` | `buy-still` | 45 | `unlock-fermentation` |
| `WineBarrel` | `barrel` | `buy-barrel` | 28 | `unlock-fermentation` |
| `Freezer` | `freezer` | `buy-freezer` | 36 | `unlock-preservatives` |

No `unlock-mill` `unlock-jam` `unlock-still` `unlock-barrel` `unlock-freezer`.

`World.stills` holds the same `PotStill` instances as their cells. Join a water net like `Tap` — [[mechanics/water]].

Tick origin cell only (`base` matches `at`), like compost. After eval. Not cmds. Not actor work except dump.

`inn: Signal` on mill / jam / still. Port `in` origin top, lamp. Unwired 0. `inn === 1` skip tick (`progress`; still water `pull`). No hold. Dump + `Act.unload` still fill. Unwired = enabled.

Assumption: mill/jam/still tick after this tick’s eval so `inn` gates the same tick.

## Dump

```
Intent +=
  | { act: 'still'; at: Coord }
  | { act: 'barrel'; at: Coord }
  | { act: 'jam'; at: Coord }
  | { act: 'mill'; at: Coord }
```

`dest` = `at`. Instant dump like compost: consume accepted cargo, not per-unit grind-work. Dump/pull all legal until dest full. Box fruit. Mill/jam/still/compost keep `frontOf` drops. Guest may dump. Vehicle I/O [[mechanics/vehicles]].

Refuse `{ kind: 'rotten' }` `{ kind: 'dead' }` (no crop id). Freshness-0 fruit accepted. Seeds, saplings, tools: refuse.

Freezer reuses `{ act: 'chest' }` and `swapChest`. Guest may not open.

## Sugar

```
{ kind: 'sugar'; liters: number; capacityLiters: number; unitSale: number }
```

Illegal: `count` on sugar. Merge: weighted `unitSale` by liters; `liters` sums; `capacityLiters` sums.

`SUGAR_BAG` 2 L. Mill output `unitSale` `SUGAR_MILL` 5 / L. Shop `buy-sugar` `SUGAR_SHOP` 8 / L, $16 for `SUGAR_BAG` — derived `SUGAR_SHOP × SUGAR_BAG`. Utility tab. `unlock-preservatives`. Tool-contracts. Does not arm.

Growing + milling cane is cheaper per liter than shop (`SUGAR_MILL < SUGAR_SHOP`). Cane fruit also sells as fruit.

Compost: `liters × COMPOST_VALUE.fruit`.

## Mill

```
Mill = { kind: 'mill'; base: RectBase; recipe: MillRecipe | 'none'; units: number; progress: number; inn: Signal }
```

Hopper. First accepted dump locks `recipe`. Later dumps must match. `units === 0` → `recipe: 'none'`.

Need: cane / olive / wheat `MILL_IN` 5. Grass `MILL_GRASS` 15 — `{ kind: 'grass' }`, not grass-seeds.

At `units >= need`: tick `progress += dt × machineMul / MILL_WORK`. `MILL_WORK` 3 s / machine — not player grind-work. At 1: consume need, drop output `frontOf` (compost rule: no plot → wait), leftover stays.

| recipe | in | out |
|---|---|---|
| `'sugar-cane'` | 5 fruit | sugar `SUGAR_BAG` L, `SUGAR_MILL` |
| `'olive'` | 5 fruit | `{ kind: 'oil'; count: 1; unitSale: OIL }` `OIL` 96 |
| `'wheat'` | 5 fruit | `{ kind: 'flour'; count: 1; unitSale: FLOUR }` `FLOUR` 72 |
| `'grass'` | 15 grass | `{ kind: 'extract'; count: 1; unitSale: EXTRACT }` `EXTRACT` 8 |

Extract: mill recipe, no research gate, sellable, no plant effect.

Mill ignores freshness and rarity for output sale.

## Jam

```
JamMachine = { kind: 'jam'; base: RectBase; crop: JamCrop | 'none'; fruit: number; sugar: number; progress: number; inn: Signal }
```

`JAM_IN` 5. `JAM_SUGAR` 0.4 L. `JAM_SECONDS` 20 / machine. `JAM_BUFFER` 4 L. `sugar` clamp `0..JAM_BUFFER`.

Dump fruit: `crop === 'none'` locks `JamCrop`. Else must match. No mix. `fruit === 0` → `crop: 'none'`. Dump sugar: fill buffer from hand liters.

Ignores freshness and rarity.

At `fruit >= JAM_IN` and `sugar >= JAM_SUGAR`: `progress += dt × machineMul / JAM_SECONDS`. At 1: `fruit -= JAM_IN`, `sugar -= JAM_SUGAR`, drop jam `frontOf` (wait if no plot).

```
{ kind: 'jam'; crop: JamCrop; count: number; unitSale: number }
```

No rarity. `unitSale` `JAM_SALE[crop]`: apricot 36, grape 72, raspberry 104, apple 80, cherry 20, tomato 80 (ketchup).

Almanac jam third icon on `JamCrop` panes iff `unlock-preservatives` done. Tomato face **Ketchup**.

## Still

```
PotStill = {
  kind: 'still'
  base: RectBase
  feed: { crop: StillCrop; rarity: Rarity; count: number }[]
  progress: number
  n: number
  inn: Signal
}
```

`base.w = 2` `base.h = 1` **and** prop `48×24` occupying both cells. Tick origin. Water join any corner. `World.stills` same instances. Origin-only paint + `TILE/24` scale shows the full 48-wide art (hangar/silo pattern). Ghost already 2-wide via pumpjack path. [[art/machines]]

`STILL_CAP` 10. No overload: dump takes only remaining units. Production starts iff feed count `=== STILL_CAP` and `pull` `STILL_WATER` 0.5 L succeeds (full amount; stored `< 0.5` → pull 0, retry each tick). Water once at start, not per tick. `inn === 1` skips that pull and `progress`.

`STILL_SECONDS` 180. Not a machinery job. `progress += dt / STILL_SECONDS`. Consume feed and `still.at(col, row, day, n)` on finish only — [[mechanics/rng]]. Then `n += 1`. Drop one spirit `frontOf` (wait if no plot).

```
{ kind: 'spirit'; spirit: SpiritKind; rarity: Rarity; count: number; unitSale: number }
```

`spiritKind`: all potato → `vodka`; all wheat → `beer`; all apricot → `brandy`; else `mixed`.

Rarity: mean `RARITY_RANK` index by unit; `u < frac` → ceil else floor. Clamp common..heirloom. Ignore freshness.

`unitSale` = `SPIRIT_SALE[spirit] × SPIRIT_RARITY[rarity]`; mixed then `× MIXED_MUL` 0.7.

Assumption: mixed uses `SPIRIT_SALE.vodka` then `× MIXED_MUL`.

`SPIRIT_SALE`: vodka 72, beer 144, brandy 108. `SPIRIT_RARITY` 1 / 1.15 / 1.3 / 1.45.

One batch → `count` 1.

## Barrel

```
WineBarrel = { kind: 'barrel'; base: RectBase; feed: { rarity: Rarity; count: number }[]; age: number; n: number }
```

Grapes only. `BARREL_CAP` 5. No overload. Age ticks after feed count `=== BARREL_CAP`. `BARREL_MATURE` = `DAY_SECONDS` — derived. `BARREL_AGE` = `3 × DAY_SECONDS` — derived.

At `age === BARREL_MATURE`: consume `barrel.at(col, row, day, n)`, bake rarity (same mean/clamp as still; ignore freshness), `n += 1`. Age continues.

Collect after mature only. Same `act: 'barrel'`: empty hand or mergeable wine. Not a drop. Age stays on the barrel until collect.

Age mul: linear `1 → WINE_AGE[r]` over `BARREL_AGE` after mature. Clamp at `WINE_AGE`. `WINE_AGE` 1.5 / 2 / 2.5 / 3.

```
{ kind: 'wine'; rarity: Rarity; count: number; unitSale: number }
```

Age baked into `unitSale` at collect: `WINE_SALE × SPIRIT_RARITY[r] × ageMul`. `WINE_SALE` 108. `count` 1. One barrel SKU.

## Freezer

```
Freezer = { kind: 'freezer'; base: RectBase; slots: Slot[]; out: Signal; hold: number }
```

`FREEZER_SLOTS` 6. Any item, like chest. `tickFreshness` skips freezer slots (box cargo included). Chest / house / hand / ground / mill hopper fruit still tick. `out` + `SENSOR_HOLD`: full = no empty slot. Port `out` origin bottom. [[mechanics/sensors]].

`swapChest` on a freezer cell. Guest: not. Host cue reuses chest.

## Machinery

Player `machinery`: `GRIND_WORK`, valve 0.3 s, mill tick, jam tick `÷ (1 + 0.05 × tier)`. Still / barrel not work jobs. Pipe place stays 0.

## Sale bake

`sim/machine.ts`. No `World`.

Crop fruit stall path unchanged. Machine goods: baked `unitSale`, no `stallX`, no `raritySale`. Saleswoman every `StallGoodId`. Őstermelő iff `rarity === 'heirloom'` (spirit, wine, crop fruit). Bio: crop fruit only. Jam / oil / flour / extract / sugar: no rarity, no bio. Clearance: fruit only.

Merge same keys; sugar by liters; else by count; weighted `unitSale`.

## Output

Drop `frontOf` like compost: mill, jam, still. Barrel collect into hand. Seeds from grinder unchanged.

Spirit / wine / jam / oil / flour / extract: not box cargo. Not compost unless named (sugar only).

## Pads

Geometric, not a `Cell`. Mill, still, jam, compost-box, chest, freezer. Dropoff north Unload / takeup south Load — [[mechanics/vehicles]]. Barrel, grinder: not.

## Illegal

- whisky
- `sugar.count`
- still `w ≠ 2` or `h ≠ 1` or rotate
- still feed not `StillCrop`
- barrel feed not grape
- jam mix
- mill dump vs locked recipe
- rotten / dead into hopper
- start still on partial water
- collect barrel before mature
- freezer slots length ≠ 6
- mill / jam / still `inn` hold
- extra research rows for mill / jam / still / barrel / freezer
- mill / jam as actor grind-work
- barrel / grinder pads
- save migrate
- electricity
