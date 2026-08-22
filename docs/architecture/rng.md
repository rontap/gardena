# Rng

Deterministic streams. [[architecture/world]] [[architecture/log]] [[architecture/modules]]

`hash` mixer stays. `rollRarity` stays. `rollShopRarity` / `rollGrowRarity` stay in `defs/rarity.ts`.

## Files

| file | owns |
|---|---|
| `src/game/sim/rng.ts` | `hash`, `rollRarity`, `Rng`, `Spatial`, `Seq`, `StreamId` |
| `src/game/sim/world.ts` | `World.rng`, `World.ripenN`. Shop / grow / weed / grass / tree / fruit / skill / grind / market call sites |
| `src/game/sim/gen.ts` | rocks, rock-shape. Uses `gen` |
| `src/game/sim/noise.ts` | soil-noise, soil-boost. Uses `gen` |
| `src/game/sim/stall.ts` | crate. Uses `gen` |

Do not create `src/` here.

## Seed

`Rng` owns `world.seed`. `World.seed` is `rng.seed`.

```
constructor(seed?: number)
seed omitted → (Math.random() * 0x100000000) >>> 0 once
```

`Math.random` nowhere else.

## Types

```
StreamId = SpatialId | SeqId

SpatialId = 'gen' | 'grow' | 'weed' | 'grass' | 'tree' | 'skill' | 'grind' | 'market'
SeqId = 'shop' | 'fruit'

class Rng {
  readonly seed: number
  stream(id: SpatialId): Spatial
  stream(id: SeqId): Seq
}

class Spatial {
  at(...ints: [number, ...number[]]): number
}

class Seq {
  next(): number
}
```

`streamSeed` = mixer u32 of `world.seed` and `StreamId` (same mix as `hash`, not the `[0,1)` float). `at(...ints)` mixes those ints onto `streamSeed` and returns `[0,1)` like `hash`. `next()` mixes a per-stream monotonic seq starting at 0.

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

`goodIx` is `stall.ts` `goodIx`. Noise uses octave lattice, not world `(col, row, oct)`.

### grow — `at(col, row, day, n)`

`n` = prior ripen count on that cell. Illegal to reuse `(col, row, day)` alone.

`n` lives on `World`, not `Soil`. `World.ripenN: Map<string, number>` keyed `col,row`. Absent = 0. On growing → ripe: roll with current `n`, then store `n + 1`. Survives harvest, till, `freshSoil`, delete. `Soil` is replaced; a Soil field would reset.

### shop — `next()` per pack granted

One `next()` per pack actually put in inventory. `buyPacks` = 5 `next()`s, in order, only if the bulk grant succeeds. Failed afford / fit / closed sku consumes 0. `u` still goes to `rollShopRarity(seed-bank tier, u)`.

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

```
memberIx: player = 0, husband = 1, daughter = 2
```

`pickCount` as stored at reroll time (0 on construct, incremented before reroll after a pick). `i` is the draw index into the remaining pool.

### grind — `at(col, row, day, i)`

`i` is the unit index in that grind.

### market — `at(goodIx, day, slot)`

`slot` is 0 or 1 as `retarget` now. `DYNAMIC_MARKET` stays false. Stream still this identity when that path runs. Not a cmd.

## Illegal

- spatial roll without identity ints
- `(col, row, day)` as grow identity without `n`
- `n` on `Soil`
- `clock.t` or `money` as mix ints
- `Math.random` except omitted world seed
- sequential `next()` on any stream but `shop` / `fruit`
- spatial `at` on `shop` / `fruit`
