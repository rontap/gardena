# World

Code: `world.ts`, `world.h.ts`, `plot.ts`; see [[code-map]].

## Job

`World` holds the complete state of one game: the tile grid, buildings, seats, money, research, contracts and the clock. Simulation code reads and writes it. The React UI and the Pixi map read it. The save file is its JSON serialisation. Each open game has one `World` instance; a multiplayer guest holds its own instance, which [[systems/net]] keeps equal to the host's.

## Used by

Every feature page and every system page.

## Contract

### Tile grid

The grid is divided into chunks of `CHUNK` × `CHUNK` tiles. `World.owned` lists the owned chunks; a new game owns chunk (0, 0), and [[features/expansion]] adds chunks. For a tile outside the owned chunks, `inWorld(at)` is false and `cell(at)` must not be called.

Each tile holds one `Cell`, a union over `kind` in `plot.ts`: untilled ground, rock, a plot in one of its states (`empty`, `weed`, `growing`, `ripe`, `dead`, `rotten`, `turf`), a tree, or a placed building. A building that covers several tiles stores the same instance in each of them; its `base` gives its position, and the tile at `base` is its origin.

Replace a tile's cell only with `setCell(at, cell)`. `setCell` updates the indexes listed below and clears the caches that depend on the tile (tilled-edge art, sprinkler targets). When code changes a field of a cell without replacing the cell, for example `soil.weedChance`, it must call `track(at, cell)` to update the indexes.

### Indexes

`World` keeps maps from tile key to coordinate, so that tick code iterates only the tiles it needs:

- `grow` — plots that change over time (growing, ripe, weed, turf, dead, rotten) and the origin of each tree.
- `machines` — origins of buildings with a tick.
- `stores` — chests and freezers.
- `sensors`, `buttons`.
- `empty`, `tilled` — plots with nothing on them; all plots.
- `recover` — plots with weed chance below `WEED_CHANCE`.
- `burrows`, `tufts` (wild grass), `rocks`.

`indexAll()` rebuilds every index, the wire set and the fence enclosures from the cells. It runs after a game is created or loaded.

### Seats

`World.seats` holds up to four seats, one per player. A seat has the gardener (`actor`), the hand, the inventory, the job list (`queue`), the selected Build tool (`place`), the driving input, and `presence` (`in` or `away`). Seat 0 is the solo player or the host. `World.local` is the seat of this client. `World.act` is the seat whose command or job is being applied at the moment; code that applies a player action reads `w.act`, not `w.local`.

`join(playerId, name)` returns a returning player's existing seat, or adds a new seat, or returns `'full'` when four seats exist. `away(id)` clears that seat's job list and Build tool and removes it from any vehicle.

### Player actions and tick writes

Each player action has two methods on `World`: `x()` builds a `Cmd` and passes it to `commit`, and `xBody()` performs the change. UI code calls `x()`. Only `applyCmd` calls `xBody()`. Some bodies are in feature files (`place.ts`, `store.ts`, `family.ts`) instead of on `World`. See [[systems/commands]].

Changes that are not player actions (growth, water, machines, vehicles on routes, the end of day) are written directly by tick code. See [[systems/tick]].

### Change notification

`ping()` and `pingFor(reason)` add a reason to a pending set: `act`, `field`, `big`, `speech` or `vfx`. The set is delivered once per microtask to every listener registered with `on(fn)`. `emit('sold')` delivers a single event without a reason set. The UI re-renders from these notifications; simulation code does not call React or Pixi.

### Construction

`new World(seed)` creates a new game: the house, the Produce Warehouse, the postbox, the Seed silo, the Additive store and the starter pump in chunk (0, 0); one solo seat. The weather table for every day is computed from the seed.

`World.hydrate(h)` creates a game from loaded save data, then runs `rebase()`, `indexAll()` and the weather setup.

`rebase()` clears state that starts fresh on every load: each seat's job list, work timer, Build tool, driving input and walking input; `bigAcc`; `pumpLiters`; the cheats; the cached water networks. It also sorts pumps, wells, taps, stills and water-system sensors by position. Two `World` instances loaded from the same save are equal after `rebase()`.

### Other fields

The starting buildings are fields: `house`, `warehouse`, `postbox`, `silo`, `additives`, `pumps`. Placed buildings that other code looks up by type are also kept in lists: `taps`, `stills`, `wells`, `waterSystems`, `hangars`, and the three field silo types. Pipes (`segments`), sprinklers, wires, fences and paving are stored outside the tile grid, keyed by edge, corner or tile. Items on the ground are in `drops`.

`money`, `loanDays` (loan payback days left, [[features/weather-day]]), `clock`, `done` and `job` (research), `family` and `points` (skills), `contracts`, `stall` (Market), `recaps` and `recapUnseen` (end-of-day summaries), `grandma` and `grandmaUnseen`, `tutorial`, `familiarity`, `vehicles`, `trailers` and `routes` are fields on `World`.

Whether an end-of-day summary is unread is stored in `recapUnseen`.

## Entry points

- `cell`, `setCell`, `track`, `inWorld`, `forEachCell` — tile grid.
- `x()` / `xBody()` pairs; `commit`, `dispatch`, `apply` — commands.
- `tick(dt)` — one simulation step.
- `prompt(at)` — the action a click on a tile would perform; also used for the hover line.
- `on`, `ping`, `pingFor`, `emit` — change notification.
- `join`, `away`, `rebase`, `indexAll`, `World.hydrate` — seats and loading.
- Lookups used across features: `skillTier`, `hasSkill`, `skuOpen`, `skuPrice`, `researchKnown`, `statsCached`, `weather(day)`, `nowDay()`, `tax()`, `walkSpeed()`, `machineMul()`.

## Invariants

| id | rule | test |
|---|---|---|
| `world.dest` | a job on a multi-tile building walks to its origin; the inventory job walks to the door; Drop off walks to the Produce Warehouse loading spot (`PAD`) | `world.test.ts` |
| `world.queue` | a seat's job list holds at most `QUEUE_CAP` jobs; one more shows the list-full message | `queue.test.ts` |

## When you change this

- New cell kind: add it to `Cell` in `plot.ts`; add it to `track` if tick code must find it; add it to [[systems/save]] and to the digest in [[systems/net]].
- New field on `World`: decide whether it is saved ([[systems/save]]), included in the digest ([[systems/net]]), and cleared by `rebase()`.
- Writing a cell field in place: call `track` if an index depends on that field.
