# Rng

Deterministic streams. [[architecture/world]] [[architecture/log]] [[architecture/modules]]

`hash` mixer stays. `rollRarity` stays. `rollShopRarity` / `rollGrowRarity` stay in `defs/rarity.ts`.

## Files

| file | owns |
|---|---|
| `src/game/sim/rng.ts` | `hash`, `rollRarity`, `Rng`, `Spatial`, `Seq`, `StreamId` |
| `src/game/sim/world.ts` | `World.rng`, `World.ripenN`. Shop / grow / weed / grass / tree / fruit / skill / grind / still / barrel call sites |
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

SpatialId = 'gen' | 'grow' | 'weed' | 'grass' | 'tree' | 'skill' | 'grind' | 'still' | 'barrel' | 'contract'
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

One `next()` per pack actually put in inventory. `buyPacks` always legal: five seed packs at `5 × skuPrice × 0.95`. Success = 5 `next()`s, in order. Failed afford / fit / closed sku consumes 0. `u` still goes to `rollShopRarity(seed-bank tier, u)`. No `bulk-buying` skill.

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

### still — `at(col, row, day, n)`

`n` is the still’s batch index. Consume on finish only (output dropped). Failed start (no water) consumes 0.

### barrel — `at(col, row, day, n)`

`n` is the barrel’s batch index. Consume at mature only. Collect does not consume.

### contract — `at(day, slot, k)`

Board offer for slot `i` on `clock.day`. Spatial, not `Seq`. Nothing consumed. Regenerating is free. Not a cmd. Not in `World.log`. Mix ints are `(day, slot, k)` only. Illegal: inventory, plantings, research, money, `clock.t`.

| k | roll |
|---|---|
| 0 | `D` inside `SLOT_BANDS[slot]`, then day cap |
| 1 | company among eligible at `D` |
| 2 | line 1 good from that pool |
| 3 | line 1 group vs specific |
| 4 | line 1 `minRarity` |
| 5 | `DeadlineBand` among affordable |
| 6 | `days` inside `DEADLINE_DAYS[band]` |
| 7 | line 2 good |
| 8 | line 2 group vs specific |
| 9 | line 2 `minRarity` |

Amount is derived. Pair is leftover `Dmix >= PAIR_COST`, not a roll. `rollBoard` [[mechanics/contracts]].

## Illegal

- spatial roll without identity ints
- `(col, row, day)` as grow identity without `n`
- `n` on `Soil`
- `clock.t` or `money` as mix ints
- `Math.random` except omitted world seed
- sequential `next()` on any stream but `shop` / `fruit`
- spatial `at` on `shop` / `fruit`
