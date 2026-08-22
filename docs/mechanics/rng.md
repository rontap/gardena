# Rng

Named streams. Types: [[architecture/rng]]. Mixer `hash` stays.

`streamSeed` from `world.seed` + `StreamId`. Spatial `at(...ints)` is order-independent. `shop` and `fruit` are `next()` only.

| Stream | Event | Roll |
|---|---|---|
| `gen` | rock, soil, turf, crate | `at(kind, …)` |
| `grow` | annual ripen rarity | `at(col, row, day, n)` |
| `shop` | pack rarity | `next()` per granted pack |
| `weed` | sprout, kind | `at(col, row, bigTicks[, 1])` |
| `grass` | roll, pick, variant | `at(bigTicks[, i, …])` |
| `tree` | yield on/off | `at(base.col, base.row, day)` |
| `fruit` | tree drop rarity | `next()` per successful drop |
| `skill` | offer draw | `at(memberIx, pickCount, i)` |
| `grind` | grind units | `at(col, row, day, i)` |
| `market` | `retarget` | `at(goodIx, day, slot)` |

`n` is `World.ripenN` keyed `col,row`. Absent 0. Not a `Soil` field. Failed buy / bulk / drop consumes 0 `next()`.

Illegal: `clock.t` or `money` as entropy. `Math.random` only when world seed is omitted.
