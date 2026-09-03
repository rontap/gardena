# Docs

Working notes for the game as it runs.

## Buckets

| Folder | What |
|---|---|
| [[aims]] | Why the game is this game. Loop, fantasy, what “good play” looks like. |
| `docs/items/` | Things the player can hold, buy, plant, or place. One note per kind or tight group. |
| `docs/mechanics/` | Rules. Named invariants live on the owning note. Map: [[mechanics/_index]]. |
| `docs/architecture/` | Modules, types, who owns what. Not a file-tree dump. |
| `docs/ui/` | HUD, docks, inspect, place, copy. |
| `docs/art/` | Palette, SVG rules, named assets. |
| `docs/standards/` | How code, tests, and notes are written. Words and player copy: [[standards/lexicon]]. Exact word per concept: [[standards/user-facing-text]]. Player changelog authorship: [[standards/update-notes]]. |
| `docs/infra/` | GitHub Actions, Pages, release. Not game rules. |
| `docs/agents/` | Who writes where. |
| `docs/plans/` | Roadmap. Not rules. |

[[canon]] is coding law. [[stack]] is the stack. [[pipeline]] is dispatch. Version: [[GLOBAL_VERSION]].

## Numbers

Every stored number is one of:

- **preference** — chosen, not forced by another number.
- **tuned-to [[note]]** — will move if that other rule moves.
- **derived** — formula named in the same note.

Name the identifier in `src/game/defs/`. Do not copy the value.

## Version

`docs.version` — working notes never write a version literal. They `[[GLOBAL_VERSION]]`. Digits live only on that note. Orchestrator owns it.

Player changelog is `src/game/ui/changelog.md`. It is the only history of what the game was. Orchestrator only. Authorship: [[standards/update-notes]].

## Write

Obsidian `[[wikilinks]]`, no `.md` suffix. Link every new note from its `_index` and from [[index]] if it is a new category.

Decisions and contracts for the game as it runs. Not tutorials. Not what the game used to be. Roadmap lives in [[Path to V1.0 - readonly]].
