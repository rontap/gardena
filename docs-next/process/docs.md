# Docs

Applies to: anyone writing a `docs-next/` page.

Working notes for the game as it runs. The page states what `src/`, `src/game/defs/` and `messages/en/` do now. Not a second copy of `src/`.

Writing rules at the top of [[index]] apply to every page: no starting-kit list, identifiers by name, constants by name, prose unless the rows share columns.

## One fact, one page

[[definitions]] names the owner of each concept. Other pages link there.

| Fact | Page |
|---|---|
| What the game is | [[game]] |
| A concept's term, player word, owner | [[definitions]] |
| Folder and file | [[code-map]] |
| One crop, building, product, other item | `docs-next/items/` |
| One player-facing feature | `docs-next/features/` |
| A shared or engine system | `docs-next/systems/` |
| The screen around the farm | [[shell]], [[menu]] |
| Palette, SVG, effects, music | `docs-next/art/` |
| Words `docs-next` prose uses | [[name-map]] |
| Player say column | [[process/user-facing-text]] |
| How code is written | [[process/canon]] |
| Where a mechanic's code goes | [[process/mechanics]] |
| Tests | [[process/testing]] |
| Who writes where | [[process/agents]] |
| Version digits | [[process/versions]] |

## Forbidden

- Changelog deltas (`+=`, "was X", "in place of")
- What the game used to do, what it lacks, leftovers, bugs
- Type unions and per-file identifier lists copied from `src/`
- Line numbers
- Player sentences (those stay in [[process/user-facing-text]] / `messages/en/`)
- Per-SKU expansion of a named pattern — [[process/user-facing-text]] already has **Place {skuLabel}** / **Demolish {skuLabel}** / **Tune {skuLabel}**
- Tailwind, `data-*` hooks, bezier numbers, `HudSpec`
- A second copy of another page's body
- Trailing `Assumption:` after the rule is written — fold into the rule or drop

## Invariants

One sentence an agent must not invert. Player-visible or causal. Not a type dump, not a tick recipe.

Body may explain. The owning page holds the sentence. Tests use the **id**, not the paragraph. Do not delete an id existing tests name — shorten the sentence; keep the id.

## Indexes

`[[link]]` only. No identifier gloss. New page → link from its `_index`, and from [[index]] if it is a new folder.

## Numbers

Every stored number is one of:

- **preference** — chosen, not forced by another number.
- **tuned-to [[note]]** — will move if that other rule moves.
- **derived** — formula named in the same note.

Name the identifier in `src/game/defs/`. Do not copy the value.

## Version

Working notes do not write a version literal. They `[[process/versions]]`. Digits live only on that page. Orchestrator owns it.

Player changelog is `src/game/ui/changelog.md`. It is the only history of what the game was. Orchestrator only. Authorship: [[process/update-notes]].

## Write

Obsidian `[[wikilinks]]`, no `.md` suffix.

Decisions and contracts for the game as it runs. Not tutorials. Not what the game used to be.
