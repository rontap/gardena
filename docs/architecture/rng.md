# Rng

Deterministic streams. [[architecture/world]] [[architecture/log]] [[architecture/modules]] [[mechanics/rng]]

`hash` mixer stays. `rollRarity` stays. `rollShopRarity` / `rollGrowRarity` stay in `defs/rarity.ts`. Owner: `sim/rng.ts`. `World.rng`, `World.ripenN` on `sim/world.ts`.

## Seed

`Rng` owns `world.seed`. `World.seed` is `rng.seed`. Seed omitted → `(Math.random() * 0x100000000) >>> 0` once. `Math.random` nowhere else.

## Types

`StreamId = SpatialId | SeqId`. Spatial: `gen` `grow` `weed` `grass` `tree` `skill` `grind` `still` `barrel` `contract`. Seq: `shop` `fruit`. Shape: `sim/rng.ts`.

`streamSeed` = mixer u32 of `world.seed` and `StreamId`. `at(...ints)` mixes those ints onto `streamSeed` and returns `[0,1)`. `next()` mixes a per-stream monotonic seq starting at 0.

Illegal: `Spatial.at()` with no ints. Illegal: `next()` on a spatial id. Illegal: `at()` on `shop` / `fruit`. Illegal: `clock.t` or `money` as entropy.

## Identities

### gen — `at(kind, …)`

| kind | ints | event |
|---|---|---|
| 0 | col, row | rock presence |
| 1 | col, row | rock-shape |
| 2 | col, row | soil-boost |
| 3 | col, row | turf variant |
| 4 | oct, x0, y0 | soil-noise lattice |
| 5 | goodIx | crate |

Noise uses octave lattice, not world `(col, row, oct)`.

### grow — `at(col, row, day, n)`

`n` = prior ripen count on that cell. Illegal to reuse `(col, row, day)` alone.

`n` lives on `World`, not `Soil`. `World.ripenN` keyed `col,row`. Absent = 0. On growing → ripe: roll with current `n`, then store `n + 1`. Survives harvest, till, `freshSoil`, delete. `Soil` is replaced; a Soil field would reset.

### shop — `next()` per pack granted

One `next()` per pack actually put in inventory. `buyPacks` always legal: five seed packs at `5 × skuPrice × 0.95`. Success = 5 `next()`s, in order. Failed afford / fit / closed sku consumes 0. `u` still goes to `rollShopRarity(seed-bank tier, u)`.

### weed — `at(col, row, bigTicks)` including kind

| ints | event |
|---|---|
| col, row, bigTicks | sprout chance |
| col, row, bigTicks, 1 | kind |

### grass — `at(bigTicks[, i])`

| ints | event |
|---|---|
| bigTicks | sprout roll |
| bigTicks, i, 0 | col pick |
| bigTicks, i, 1 | row pick |
| col, row, bigTicks | variant |

`i` is the try index (0..23).

### tree — `at(col, row, day)`

Yield on/off. `col, row` = `Tree.base`.

### fruit — `next()` per successful drop

Consume only when a drop spot is found and fruit is spawned. Failed drop does not consume. `rollRarity(u)`.

### skill — `at(memberIx, pickCount, i)`

`memberIx`: player = 0, husband = 1, daughter = 2. `pickCount` as stored at reroll time. `i` is the draw index into the remaining pool.

### grind — `at(col, row, day, i)`

`i` is the unit index in that grind.

### still — `at(col, row, day, n)`

`n` is the still’s batch index. Consume on finish only. Failed start (no water) consumes 0.

### barrel — `at(col, row, day, n)`

`n` is the barrel’s batch index. Consume at mature only. Collect does not consume.

### contract — `at(day, slot, k)`

Board offer for slot `i` on `clock.day`. Spatial, not `Seq`. Nothing consumed. Regenerating is free. Not a cmd. Mix ints are `(day, slot, k)` only. Amount is derived. Pair is leftover budget, not a roll. `rollBoard` [[mechanics/contracts]].
