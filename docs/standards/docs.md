# Docs

Working notes for the game as it runs. Not a version gallery.

## Buckets

| Folder | What |
|---|---|
| [[aims]] | Why the game is this game. Loop, fantasy, what “good play” looks like. |
| `docs/items/` | Things the player can hold, buy, plant, or place. One note per kind or tight group. |
| `docs/mechanics/` | Rules. Named invariants live on [[mechanics/_index]]. |
| `docs/architecture/` | Modules, types, who owns what. Not a file-tree dump of a patch. |
| `docs/ui/` | HUD, docks, inspect, place, copy. |
| `docs/art/` | Palette, SVG rules, named assets. |
| `docs/standards/` | How code, tests, and notes are written. |
| `docs/agents/` | Who writes where. |
| `docs/plans/` | Roadmap. Not rules. |
| `docs/archive/` | Old versioned notes. Do not read as current. |

[[canon]] is coding law. [[stack]] is the stack. [[pipeline]] is dispatch.

## Numbers

Every stored number is one of:

- **preference** — chosen, not forced by another number.
- **tuned-to [[note]]** — will move if that other rule moves.
- **derived** — formula named in the same note.

Do not copy a value that `src/game/defs/` already is. Name the identifier.

## Write

Obsidian `[[wikilinks]]`, no `.md` suffix. Link every new note from its `_index` and from [[index]] if it is a new category.

Decisions and contracts. Not tutorials. Working notes describe the game as it runs. Roadmap lives in [[Path to V1.0 - readonly]].

## Do not

- Version filenames (`beta-6`, `v0.3`) in working folders.
- Restate code.
