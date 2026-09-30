# Rng

Code: `sim/rng.ts` (`Rng`, `Spatial`, `Seq`, `hash`), `World.rng` in `world.ts`; each draw is made where its feature decides; see [[code-map]].

## Job

Every random outcome in the simulation comes from the game's seed, so the same seed and the same commands give the same farm on every machine and after every load. A draw is a function of the seed, a stream name and a few integers that say what is being decided (a tile, a day, an index), not the next value of a running generator. Two players therefore draw the same numbers without exchanging them, and a draw's order in the step does not matter.

## Used by

- [[features/expansion]] — ground quality, rocks.
- [[features/weeds]] — sprouting, weed look, wild grass.
- [[features/plants]] — the variety roll at ripening.
- [[features/trees]] — seasons and where dropped fruit lands.
- [[features/burrow]] — where burrows appear and what a dug burrow gives.
- [[features/mushrooms]] — whether a tree gets a mushroom, where, and which kind.
- [[features/contracts]] — the daily board.
- [[features/market]] — daily demand.
- [[features/machines]] — how many grinder units a batch gives.
- [[features/weather-day]] — the weather table.
- [[systems/net]] — equal draws on host and guests are what keep copies equal.

## Contract

### Seed

`new Rng(seed)` keeps `seed`; with no seed, one is made once from `Math.random`. `World.rng.seed` is the game's seed and is saved. No other simulation code uses `Math.random`, the wall clock, `clock.t` or money as a source of randomness. Sound effects and song order use `Math.random`; they change nothing in `World`.

### Streams

`rng.stream(id)` returns the stream named `id`. Its own seed (`streamSeed`) mixes the game's seed with the stream's name, so streams never share values.

- **Spatial** (`Spatial.at(...ints)`): returns a number in [0, 1) from the stream seed and the integers given, at least one. The same integers always give the same number, in any order of calls; nothing is consumed.
- **Sequence** (`Seq.next()`): returns the next number of a counter that starts at 0. Only `fruit` is a sequence. Its count is saved (`rng.fruit` in the save) so a loaded game continues it.

| stream | kind | decides | integers |
|---|---|---|---|
| `gen` | spatial | rock (0), rock shape (1), ground quality boost (2), turf look (3), ground noise lattice (4), Market crate position (5) | the number in brackets, then tile or lattice position or good index |
| `weed` | spatial | weed sprouts; weed look | col, row, big tick; + 1 for the look |
| `grass` | spatial | whether wild grass appears this big tick; which tile (up to 24 tries); the look of grass left by a weed | big tick; big tick, try, 0; col, row, day |
| `tree` | spatial | a tree's season on or off | tree origin col, row, day |
| `fruit` | sequence | the tile a tree's dropped fruit lands on | one `next()` per fruit actually dropped |
| `variety` | spatial | the variety roll when a plant ripens | col, row, day, quality × 10000 |
| `grind` | spatial | the unit count of a grinder batch | col, row, day, batch number |
| `burrow` | spatial | which chunks get a burrow today and where; at a dig, the rarity, the entry, the item, and the treasure coins or tool uses | chunk cx, cy, day, index or `BURROW_DAY_SALT`; col, row, dig day, `BURROW_DIG_SALT` + 0 to 3 |
| `mushroom` | spatial | whether a grown tree gets a mushroom at the end of the day; which tile of its area; Fly agaric or Truffle | tree `base` col, row, ended day, and 0, 1 or 2 |
| `contract` | spatial | the daily contract board | day, position, value index |
| `market-demand` | spatial | the two goods whose demand moves today | day, 0 or 1 |
| `weather` | spatial | the weather table, from a new `Rng(seed)` | day, 0 or 1 |

A draw that is attempted and fails consumes nothing: a fruit drop with no free tile does not call `fruit.next()`.

## Entry points

- `new Rng(seed?, { fruit })`, `rng.stream(id)`, `rng.consumed('fruit')`.
- `Spatial.at(...ints)`, `Seq.next()`.
- `hash(seed, salt, ...ints)` — the same mixing without a stream, for one-off values.

## Data

Saved: `seed` and the `fruit` count. Streams are made on first use. The digest does not carry the seed; it carries the state the draws produced ([[systems/net]]).

## Invariants

| id | rule | test |
|---|---|---|
| `rng.spatial` | `at` with the same integers gives the same value in any call order | `rng.test.ts` |
| `rng.fail` | a failed tree drop consumes no `fruit` draw; a successful one consumes one | `plants.test.ts` |
| `rng.burrow` | burrow sites and what a dug burrow gives are spatial draws, not the sequence | `rng.test.ts` |
| `weather.spatial` | weather reads its stream by day only | `weather.test.ts` |

## When you change this

- A new random decision: pick a stream (or add a `SpatialId`), and draw with `at` from integers that name the decision uniquely: tile, day, and an index. Two decisions with the same stream and integers get the same number.
- Never add a draw that depends on the order things are processed in; use `at`, not a new sequence.
- A new sequence stream must save its count, or a loaded game draws numbers already used.

## Decisions

- Draws are positional, not a shared running generator: a step that processes tiles in a different order, or a guest that joins mid-game, still draws the same numbers.
