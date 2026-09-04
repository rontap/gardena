# Rng

Named streams. Types: [[architecture/rng]]. Mixer `hash` stays.

`streamSeed` from `world.seed` + `StreamId`. Spatial `at(...ints)` is order-independent. `fruit` is `next()` only.

| Stream | Event | Roll |
|---|---|---|
| `gen` | rock, soil, turf, crate | `at(kind, …)` |
| `weed` | sprout, kind | `at(col, row, bigTicks[, 1])` |
| `grass` | world roll, owned-cell pick, variant | `at(bigTicks[, i, …])` |
| `tree` | yield on/off | `at(base.col, base.row, day)` |
| `fruit` | tree drop spot | one `next()` per successful drop |
| `skill` | offer draw | `at(memberIx, pickCount, i)` |
| `grind` | grind units; station graft count | `at(col, row, day[, i])` |
| `contract` | board slot | `at(day, slot, k)` |
| `weather` | day kind | `at(day, k)` |

No grow stream. No `World.ripenN`. Shop packs do not roll. Still and barrel do not roll.

Failed buy / bulk / drop consumes 0 `next()`.

`clock.t` or `money` as entropy is illegal. `Math.random` only when world seed is omitted.

Assumption: station graft count 1–2 uses `grind.at(col, row, day)` on finish.

## Invariants

`rng.spatial` — `Spatial.at` / `hash`: same args, any call order → same `u`.

`rng.fail` — Failed `buy` / `buyPacks` (closed, cannot afford, cannot fit) consumes 0 seq `next()`. Failed tree drop consumes 0 `fruit.next()`; a successful one consumes 1. `buyPacks` always legal: five seed packs at `5 × skuPrice × 0.95`, all `'base'` quality 0. Success: 0 seq draws.
