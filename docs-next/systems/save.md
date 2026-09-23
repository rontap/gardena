# Save

Code: `feature-save/`, save calls in `App.tsx`; see [[code-map]].

## Job

A save is the JSON serialisation of a `World`. The game stores one save in the browser's local storage, writes it at the end of every day and on several menu actions, and can download it or load it from a file.

## Used by

Every feature with persistent state; [[systems/world]] (`World.hydrate`); [[features/multiplayer]] (a guest's `World` is built from the host's save).

## Contract

### Saved fields

`dump(world)` returns a `Save` with: `game: 'gardena'`, `GAME_VERSION`, the save time, the seed and the number of `fruit` stream values used, the clock, money, reputation, contracts, purchases, prize counters, skill points, the Market, research, skills, the day tally, end-of-day summaries and the unread list, grandma's letters, the tutorial, crop familiarity, every seat (player id, name, presence, position, hand, inventory), vehicles, trailers, routes, every tile of every owned chunk, pipes, sprinklers, wires, held valve signals, fences, paving, and items on the ground.

A building that covers several tiles is written once at its origin; its other tiles are written as `occ`.

Not saved: job lists and work timers, Build tools, the command log, Market price drops, `pumpLiters`, `bigAcc`, cheats, weather pins, water networks, and all indexes. On load they start empty or are rebuilt by `rebase()` and `indexAll()`.

### Loading

`parse(text)` returns the `World` or a failure reason:

- `unknown-format` — the text is not JSON;
- `not-gardena` — `game` is not `'gardena'`;
- `version` — building the `World` threw and the save's `version` differs from `GAME_VERSION`;
- `unusable` — building the `World` threw and the versions match.

There is no conversion from older saves. A save containing a research id, skill id or item kind that no longer exists throws and fails as `unusable`.

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
| `save.nomigrate` | a save with an unknown skill, research id or removed item kind fails as `unusable`; nothing is converted | `save.test.ts` |
| `save.recaps` | `recaps` and `recapUnseen` are always written | `save.test.ts` |
| `save.weather-station` | a two-tile building is written once, at its origin | `save.test.ts` |
| `weeds.gone` | a weed's full-grown day is saved and loaded | `weeds.test.ts` |

## When you change this

- New `World` or cell field that must persist: add it to `Save` / `SaveCell` in `save.h.ts`, to `dump`, and to `parse`.
- Removing or renaming a saved id: saves that contain it fail to load. This is accepted.
- Field that does not need to persist: leave it out of `Save` and clear it in `rebase()` ([[systems/world]]).

## Decisions

- Saves from older versions are not converted and may fail to load (developer rule).
