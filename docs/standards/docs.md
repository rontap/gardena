# Docs

Working notes for the game as it runs. High-level play, laws (code and game) so agents do not invert what is intended, and shared patterns. Not a second copy of `src/`.

## One of three

A note holds **one**:

- **Law** — intended rule. An agent must not invert it.
- **Pattern** — the shared how (place, copy, HUD). Named once. Linked after.
- **Index** — `[[wikilinks]]`. No gloss of identifiers.

## Owner

One fact, one note.

| Fact | Note |
|---|---|
| Gameplay rule, named invariant | `docs/mechanics/<topic>` |
| What the player can buy, hold, plant, or place; shelf; size | `docs/items/` |
| Chrome, pointer, which panel — not the player sentence | `docs/ui/` |
| Module ownership, illegal states (as sentences) | `docs/architecture/` |
| Palette, SVG groups, named files | `docs/art/` |
| Player word | [[standards/user-facing-text]] |
| How code is written | [[canon]] |
| Where a mechanic's parts go | [[standards/mechanics]] |
| Tests | [[standards/testing]] |

## Forbidden

- Changelog deltas (`+=`, "was X", "in place of")
- Type unions and per-file identifier lists copied from `src/`
- Player sentences (those stay in [[standards/user-facing-text]] / `src/`)
- Per-SKU expansion of a named pattern (`Place Pulser` / `Delete pulser`) — [[standards/user-facing-text]] already has **Place {skuLabel}** / **Demolish {skuLabel}** / **Tune {skuLabel}**
- Tailwind, `data-*` hooks, bezier numbers, `HudSpec`
- A second copy of another note's body
- Trailing `Assumption:` after the rule is written — fold into the rule or drop

## Invariants

One sentence an agent must not invert. Player-visible or causal. Not a type dump, not a tick recipe.

Body may explain. [[mechanics/_index]] is **id → note** only. Child notes do not restate that table. Tests use the **id**, not the paragraph. Do not delete an id existing tests name — shorten the sentence; keep the id.

## Indexes

`[[link]]` only. No identifier gloss. New note → link from its `_index` and from [[index]] if it is a new category.

## Buckets

| Folder | What |
|---|---|
| [[aims]] | Why the game is this game. Loop, fantasy, what good play looks like. |
| `docs/items/` | Things the player can hold, buy, plant, or place. One note per kind or tight group. |
| `docs/mechanics/` | Rules. Named invariants live on the owning note. Map: [[mechanics/_index]]. |
| `docs/architecture/` | Modules, types, who owns what. Not a file-tree dump. |
| `docs/ui/` | HUD, docks, inspect, place. Copy slots, not pasted player sentences. |
| `docs/art/` | Palette, SVG rules, named assets. |
| `docs/standards/` | How code, tests, and notes are written. Words: [[standards/lexicon]]. Player words: [[standards/user-facing-text]]. Player changelog: [[standards/update-notes]]. |
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

Obsidian `[[wikilinks]]`, no `.md` suffix.

Decisions and contracts for the game as it runs. Not tutorials. Not what the game used to be. Roadmap lives in [[Path to V1.0 - readonly]].
