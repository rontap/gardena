# Rng

Deterministic streams. [[architecture/world]] [[architecture/log]] [[architecture/modules]] [[mechanics/rng]]

`hash` mixer stays. Owner: `sim/rng.ts`. `World.rng` on `sim/world.ts`. No `World.ripenN`. No grow stream.

## Seed

`Rng` owns `world.seed`. `World.seed` is `rng.seed`. Seed omitted → `(Math.random() * 0x100000000) >>> 0` once. `Math.random` nowhere else.

## Types

`StreamId = SpatialId | SeqId`. Spatial: `gen` `weed` `grass` `tree` `skill` `grind` `contract` `weather`. Seq: `fruit`. Shape: `sim/rng.ts`.

`streamSeed` = mixer u32 of `world.seed` and `StreamId`. `at(...ints)` mixes those ints onto `streamSeed` and returns `[0,1)`. `next()` mixes a per-stream monotonic seq starting at 0.

Illegal: `Spatial.at()` with no ints. Illegal: `next()` on a spatial id. Illegal: `at()` on `fruit`. Illegal: `clock.t` or `money` as entropy.

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

### weed — `at(col, row, bigTicks)` including kind

| ints | event |
|---|---|
| col, row, bigTicks | sprout chance |
| col, row, bigTicks, 1 | kind |

### grass — `at(bigTicks[, i])`

| ints | event |
|---|---|
| bigTicks | world sprout roll |
| bigTicks, i, 0 | owned-cell pick |
| bigTicks, i, 1 | owned-cell pick |
| col, row, bigTicks | variant |

`i` is the try index (0..23). Pick maps `u` onto owned cells (`owned.length * CHUNK * CHUNK`), not `bounds()` AABB. World-roll threshold: [[mechanics/weeds]] `weeds.grass`.

### tree — `at(col, row, day)`

Yield on/off. `col, row` = `Tree.base`.

### fruit — `next()` per successful drop

Consume only when a drop spot is found and fruit is spawned. Failed drop does not consume. One `next()`: spot. Variety is the tree's. Quality is 0.

### skill — `at(memberIx, pickCount, i)`

`memberIx`: player = 0, husband = 1, daughter = 2. `pickCount` as stored at reroll time. `i` is the draw index into the remaining pool.

### grind — `at(col, row, day, i)`

`i` is the unit index in that grind. Station graft count 1–2 uses `grind.at(col, row, day)` on finish only.

### contract — `at(day, slot, k)`

Board offer for slot `i` on `clock.day`. Spatial, not `Seq`. Nothing consumed. Regenerating is free. Not a cmd. Mix ints are `(day, slot, k)` only. Amount is derived. Pair is leftover budget, not a roll. `k` 4 and 9 unused. `rollBoard` [[mechanics/contracts]].

### weather — `at(day, k)`

Day kind walk. Spatial, not `Seq`. Nothing consumed. Regenerating is free. Not a cmd. Mix ints are `(day, k)` only. `k` is 0 (special / severe) or 1 (rain vs dry; continue). Illegal: `next()`. `forecastWeather` [[mechanics/weather]].
