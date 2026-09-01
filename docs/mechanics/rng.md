# Rng

Named streams. Types: [[architecture/rng]]. Mixer `hash` stays.

`streamSeed` from `world.seed` + `StreamId`. Spatial `at(...ints)` is order-independent. `shop` and `fruit` are `next()` only.

| Stream | Event | Roll |
|---|---|---|
| `gen` | rock, soil, turf, crate | `at(kind, …)` |
| `grow` | annual ripen rarity | `at(col, row, day, n)` |
| `shop` | pack rarity | `next()` per granted pack |
| `weed` | sprout, kind | `at(col, row, bigTicks[, 1])` |
| `grass` | world roll, owned-cell pick, variant | `at(bigTicks[, i, …])` |
| `tree` | yield on/off | `at(base.col, base.row, day)` |
| `fruit` | tree drop rarity | `next()` per successful drop |
| `skill` | offer draw | `at(memberIx, pickCount, i)` |
| `grind` | grind units | `at(col, row, day, i)` |
| `still` | still rarity clamp | `at(col, row, day, n)` on finish only |
| `barrel` | barrel rarity clamp | `at(col, row, day, n)` at mature only |
| `contract` | board slot | `at(day, slot, k)` |

`n` is `World.ripenN` keyed `col,row`. Absent 0. Not a `Soil` field. Failed buy / bulk / drop consumes 0 `next()`.

`clock.t` or `money` as entropy is illegal. `Math.random` only when world seed is omitted.

## Invariants

`rng.shop` — `shop.next()` does not move when `grow` rolls. Same seed: shop-only vs plant-then-shop, first granted pack rarity matches.

`rng.ripen-n` — Two growing→ripe on one cell the same day use distinct `n`. Rarities need not match.

`rng.spatial` — `Spatial.at` / `hash`: same args, any call order → same `u`.

`rng.fail` — Failed `buy` / `buyPacks` (closed, cannot afford, cannot fit) consumes 0 `shop.next()`. Failed tree drop consumes 0 `fruit.next()`. Granted pack: one `next()` each. `buyPacks` always legal: five seed packs at `5 × skuPrice × 0.95`. Success: 5.

`rng.pack` — Pack rarity is `rollShopRarity(seed-bank tier, shop.next())`. Not `clock.t`. Not `money`.
