# Save

Code: `feature-save/`, save calls in `App.tsx`; see [[code-map]].

## Job

A save is the JSON serialisation of a `World`. The game stores one save in the browser's local storage, writes it at the end of every day and on several menu actions, and can download it or load it from a file.

## Used by

Every feature with persistent state; [[systems/world]] (`World.hydrate`); [[features/multiplayer]] (a guest's `World` is built from the host's save).

## Contract

### Saved fields

`dump(world)` returns a `Save` with: `game: 'gardena'`, `GAME_VERSION`, the save time, the seed and the number of `fruit` stream values used, the clock, money, reputation, contracts, purchases, prize counters, skill points, the Market (each good's `sat`, `stock` and `worth`), research, skills, the day tally, end-of-day summaries and the unread list, grandma's letters, the tutorial, crop familiarity, every seat (player id, name, presence, position, hand, inventory), vehicles, trailers, routes, every tile of every owned chunk, pipes, sprinklers, wires, held valve signals, fences, paving, and items on the ground.

A building that covers several tiles is written once at its origin; its other tiles are written as `occ`.

On load, job lists and work timers, Build tools, the command log, `pumpLiters`, `bigAcc`, cheats and weather pins start empty; water networks and all indexes are rebuilt by `rebase()` and `indexAll()`.

### Loading

`parse(text)` builds the `World` from the `Save` fields exactly as `dump` writes them (`worldFromSave`, then `World.hydrate`), or returns a failure reason:

- `unknown-format` — the text is not JSON;
- `not-gardena` — `game` is not `'gardena'`;
- `version` — building the `World` threw and the save's `version` differs from `GAME_VERSION`;
- `unusable` — building the `World` threw and the versions match.

### Writes to the save slot

The slot is the local-storage key `SLOT_KEY`. `writeSlot(dump(world))` is called:

- when the day number changes, if this client is seat 0 (solo or host);
- on **Quick Save** in the Gear menu;
- on **Download Save…**, before the file is created (file name `DOWNLOAD_NAME`);
- on **Upload Save…**, after the file is parsed;
- on **Exit to main menu**, unless this client is a guest;
- when a host ends a multiplayer session.

**Load Save ({stamp})** on the main menu reads the slot. The crash screen offers the slot as a file (**Download save**).

## Entry points

- `dump`, `parse` in `feature-save/`.
- `readSlot`, `writeSlot`, `slotExists`, `slotStamp`.
- `World.hydrate` builds the `World` from parsed data.

## Invariants

| id | rule | test |
|---|---|---|
| `save.nomigrate` | skills (`family.owned`) and a held chainsaw load back as dumped | `save.test.ts` |
| `save.recaps` | `recaps`, `recapUnseen` and `tally.contracts` are written and load back as written | `save.test.ts` |
| `save.weather-station` | a two-tile building is written once, at its origin | `save.test.ts` |
| `weeds.gone` | a weed's full-grown day is saved and loaded | `weeds.test.ts` |

## When you change this

- New `World` or cell field that must persist: add it to `Save` / `SaveCell` in `save.h.ts`, to `dump`, and to `parse`, which reads it as written.
- Field that starts fresh on every load: keep it in `World` only and clear it in `rebase()` ([[systems/world]]).

## Decisions

- `parse` reads the current `Save` shape and nothing else (developer rule).
