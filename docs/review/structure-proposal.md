# Proposed docs structure

A proposal, not a decision. Nothing under `docs/` has moved.

## What the review found about the current structure

- **One behaviour, three to five notes.** Notes are split by layer (`mechanics/`, `ui/`, `items/`, `art/`, `architecture/`). A rule that has a player side, a screen side and a save side is written in each layer's note, and the copies drift. Examples from the review: which windows pause (4 notes, 4 lists), guest rights (4+ notes), when the save slot is written (4 notes), the vehicle silo walk-up (2 notes, 2 answers).
- **Lists that data already owns.** The sensor note's input list and the vehicle note's pad list each enumerate buildings, and each misses the Infuser. The words table repeats names that `messages/en/names.json` and `skuLabel` already fix.
- **The body restates the code, then the invariant restates the body.** The duplicated text is where the numbers and identifiers go stale.
- **Facts are filed under the code that holds them, not under the task that needs them.** The icon preview page is in `ui/cheat.md`; `art/svg.md` and `agents/designer.md` do not mention it.
- **No note says why, or what else a change touches.**

## Proposal

```
docs/
  index.md             routing: task type → pages to read
  game.md              what the game is and why: loop, pillars, one paragraph per feature
  features/<name>.md   one page per player-facing feature
  systems/<name>.md    one page per system several features share
  shell.md             the screen around the farm: layout, panels, pause, rail, Command Center, hover, type, palette
  howto/<task>.md      checklists for recurring task types
  words.md             player words: state words and phrasing only
  process/             canon, lexicon, agents, pipeline, testing, update notes
  plans/               unchanged
```

### `features/<name>.md`

Market, contracts, plants, trees, water, weeds, weather and day, machines, sensors, vehicles, research, family, expansion, Necronomicon, tutorial, burrow, fences, multiplayer.

One page holds the rules, the screen, the player words and the art for that feature. Fixed headings:

1. **Purpose** — what the player gets from it, and why it exists in the game. Source for the almanac.
2. **Rules** — the behaviour, in sentences. Numbers are named and point to their `defs/` file; no digits.
3. **Screen** — what the player sees and clicks. Player strings by key.
4. **Guest** — what a guest can and cannot do. One line when the answer is "same as host".
5. **Save and sync** — what is saved, what is in the digest.
6. **Art** — which asset files, which groups.
7. **Invariants** — each one names the test that asserts it. An invariant with no test is marked so.
8. **When you change this** — the other features and systems a change here touches.

### `systems/<name>.md`

Engine and shared systems: world and tick, commands and log, save, RNG, multiplayer transport, i18n, rendering and atlas, building I/O (ports, pads, west pull, east push), signals and wires, the water network, the place tool.

A system page holds the contract other code relies on, and a **Used by** list linking to feature pages. A building's ports and pads are read from the building's defs entry; the page describes the rule, not the list.

### `howto/<task>.md`

Checklists, each linking to the pages to read and the files to touch:
- add a building or machine
- add a crop or variety
- add a research row or skill
- add a sensor
- add a command
- add player text
- add or check art (includes `#atlas` and `#debug-iconset`)
- change a shared system

### `index.md` routing

| task | read |
|---|---|
| new mechanic | `game.md`, the nearest feature pages, `systems/` world, save, multiplayer |
| UI pass | `shell.md`, the feature pages whose screens change, `words.md` |
| new building | `howto/add-building.md`, `systems/building-io.md` |
| shared system overhaul | the system page, then each page in its **Used by** list |
| engine change | `systems/`, then the pages that link to it |

## Rules that keep it current

- Each fact lives on one page. Other pages link to it and do not restate it.
- No digits, no type definitions, no lists of ids. Point to `src/game/defs/` and `messages/en/`.
- A pull of code that changes a rule changes the page in the same commit. Code review checks this.
- Invariants name tests, so the test run is the check that the page is still true.

## Migration

After the review files are ticked, rewrite one feature at a time into the new page, and delete the old notes each new page replaces. The ticked review files are the source; the old notes are not.
