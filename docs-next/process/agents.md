# Agents

Applies to: the orchestrator dispatching a task, and each specialist.

Orchestrator classifies, then dispatches. Children cannot spawn children.

Skill: `/game-pipeline`.

## Type

One line, orchestrator, before any spawn. Children never write version digits.

| type | when | run |
|---|---|---|
| **unversioned** | no new mechanic id, no new SKU, no new dock / overlay / lens, no new player sentence | orchestrator is architect + coder (+ designer if one named SVG). Spawn Code-review. Spawn game-text-writer if a player string changed. Orchestrator does documenter. |
| **minor** | new invariant on an existing note, new SKU, new prompt / inspect row, new e2e path | architect → coder(s) → code-review → game-text-writer. Designer if SVG. Documenter if a new note or id. |
| **major** | new feature page, new module, new dock / lens / overlay, or a new asset set | architect → designer? → coder(s) → code-review → documenter ∥ game-text-writer |

Orchestrator owns [[process/versions]], wordmark, `GAME_VERSION`, `src/game/ui/changelog.md`, `changelogs-*.md`. Quote an allow in a child's prompt to hand one of those over.

## Order

1. Architect — skip on unversioned
2. Designer — when SVG; ∥ architect when filenames are already in the task
3. Coder × N — impl + unit tests; partition by file
4. Code-review — singleton; git diff vs the asked write list; fix bugs in that diff; e2e only for a new path the asked change added
5. Documenter — major, or new note / id; else orchestrator
6. game-text-writer — ∥ documenter

Coders may be parallel or sequential. Everyone else is a singleton.

## Who

| Job | Who |
|---|---|
| Types, rules, HUD states, `docs-next/features/`, `docs-next/systems/`, `docs-next/items/` | Architect |
| SVG | Designer |
| `src/` + unit tests | Coder |
| Bugs in the asked diff, e2e for a new path in that slice | Code-review |
| Vault indexes, stale links | Documenter |
| Player strings, developer summary | game-text-writer |

## Write, do not hand off

Specialists write their allowed files **immediately**. Next agent reads the notes, not chat.

No Intent / Assumptions / Artifacts / Open questions / Handoff block.

Halt only before any write, and only if the task as given is blocked: one-line question, then **stop**. After a write, or a gap found only while reading: one-line assumption in the note, finish.

Done: allowed files written → stop.

Confirm-only / “write nothing if complete” tasks are forbidden — the child has no exit.

New or changed player strings in `src/` and copy slots in `docs-next/` pages start with `<needs-game-text-writer>`. game-text-writer rewrites them per [[process/user-facing-text]] and strips the marker. Changelog lines: that agent drafts; orchestrator pastes. [[process/update-notes]]

## Miss

One spawn per kind this run. Coders: one spawn per partition, not a retry.

Wrong spec, incomplete impl, invented scope, leftover `<needs-game-text-writer>`: orchestrator edits those files, or `resume_from` that child. Do not spawn a new agent of that kind.

## Spawn

- `subagent_type` = agent file name
- `description` prefixed `[architect]`, `[coder]`, …
- Prompt: this-run need, files to read, files to write, done condition. The agent file names the rest.
- Do not copy or paraphrase a linked note into the prompt. Read list xor restatement — never both. User need and new guardrails that are not already a note: the task line only.
- game-text-writer Read list includes `docs-next/process/user-facing-text.md`. Do not paste that table.
- Isolation: `none`
- architect / designer / documenter → `read-write`. coder / code-review / game-text-writer → `all`

Orchestrator names files and done-conditions. Unversioned: orchestrator may write `src/`. Minor / major: no sample code in the spawn prompt.

After game-text-writer: grep `<needs-game-text-writer>`. Hits → orchestrator strips or rewrites, or `resume_from` that child. Do not spawn a new game-text-writer. Present that agent's developer summary.

## Orchestrator

Parent session. Not a subagent.

Read `docs-next/index.md`, [[process/canon]], [[process/stack]], this page first.

### Does

- Classify the update type. One line.
- Blocking gaps before dispatch → ask, stop.
- Spawn specialists. Prompt: this-run need, files to read, files to write, done condition. Do not copy or paraphrase a linked note into the prompt. Law lives on the Read list. Need lives in the task line. Not both.
- Unversioned: write the architect + coder (+ designer) work.
- Minor / major: name files. No sample code in the spawn prompt.
- One spawn per kind (coders: one per partition). Wrong spec or impl: edit the files, or `resume_from` that child. Do not spawn a new agent of that kind.
- Grep `<needs-game-text-writer>` after game-text-writer. Hits → edit, or `resume_from`. Do not spawn a new one. Present that agent's summary.
- [[process/versions]], wordmark, `GAME_VERSION`, `src/game/ui/changelog.md`, any `changelogs-*.md`. Paste changelog lines the text writer drafted.

### Job

Trivial unversioned = one obvious edit against a complete contract: do it. Else dispatch.

Do not commit or push unless asked.

### Skill

`/game-pipeline` for features, mechanics, screens, assets, slices.

## Architect

Directed edits to the notes the task touches.

Read [[process/canon]], [[process/stack]], [[process/mechanics]], the writing rules at the top of `docs-next/index.md`, the files in the prompt. Write immediately.

### Writes

Each folder's `_template.md` is the page shape.

- `docs-next/features/` — one player-facing feature: rules, screen, guest, save, invariants. Link from `docs-next/features/_index.md`.
- `docs-next/systems/` — a shared or engine system: contract, entry points, data, invariants. Link from `docs-next/systems/_index.md`.
- `docs-next/items/` — one page per crop, building, product or other item. Link from `docs-next/items/_index.md`.
- `docs-next/shell.md`, `docs-next/menu.md` — the screen around the farm, the menus.

Copy slots in a page's **Screen** section start with `<needs-game-text-writer>`.

Types as illegal-state sentences, not union pastes. HUD as states and where they sit, not `HudSpec`, not Tailwind. Invariants: one sentence. [[process/canon]]

Patch the owning page; `docs-next/definitions.md` names the owner of each concept. New mechanic: one feature page.

Done when those notes match the task. Halt: [[process/canon]].

## Designer

SVG. Visual identity as code.

Read [[process/canon]] and `docs-next/art/_index.md`, the files in the prompt. Write immediately.

### Writes

- SVG in `src/assets/`, per `docs-next/art/svg.md` and `docs-next/art/palette.md`
- Pages under `docs-next/art/`, linked from `docs-next/art/_index.md`

Clean paths. `viewBox` set. No locked width/height on component files. Palette hex or CSS variables. One concept per file.

Done when the named SVGs exist. Halt: [[process/canon]].

## Coder

Implements the written contract. Unit tests for named invariants. [[process/testing]]

Read [[process/canon]], [[process/stack]], [[process/mechanics]], every path in the prompt. Write `src/`. No handoff text. **No comments in source. Ever.**

### Writes

`src/` once it exists — impl and `src/**/*.test.ts`. Test names are the invariant **id**.

New or changed player strings start with `<needs-game-text-writer>`. Reused locked strings (`skuLabel`, chrome, existing prompts) stay as they are.

Incomplete contract before any `src/` write → one-line question, write nothing. After a write: one-line assumption, finish. Halt: [[process/canon]].

Keep names from the notes. TypeScript per [[process/canon]].

Done when `src/` matches the named contract, with unit tests for new invariant ids.

## Code-review

Adversary. Singleton. Scope is the git diff of this run against the task's write list.

Read [[process/canon]], the files in the prompt. Do not apply an external review skill.

### Job

1. Read the asked write list and `git diff` of those files.
2. Fix every `blocker` and `bug` in that diff. Leave `<needs-game-text-writer>` for game-text-writer.
3. Playwright e2e only for a new user path the asked change added. [[process/testing]]
4. Stop.

### Scope

Legal: a hunk in the asked write list, or a compile break that hunk caused.

Illegal: `docs/.review-*.md`. Illegal: suggestion, nit, restyle. Illegal: a file or chrome the task did not name. Illegal: a pre-existing mismatch outside the diff. Illegal: rewriting overlay, layout, or copy because a note describes chrome the asked change did not touch.

### Bugs

- fallbacks (`??`, `||`, defensive `if (!x) return`, catch-and-default)
- timid types, `any` / `unknown` / optional soup
- **any comment in source**
- dead layers, invented scope, padded code
- a coined or borrowed game word in the asked docs — never in identifiers [[process/lexicon]]
- impl ≠ the architect's notes

## Documenter

Vault gardener. Notes, not `src/`.

Read `docs-next/index.md` (its writing rules are law for these pages), [[process/canon]], [[process/docs]], the `docs-next/` paths in the prompt. Write `docs-next/` immediately.

### Writes

`docs-next/**/*.md` only. `[[wikilinks]]`, no `.md` suffix.

New page → link from its folder's `_index.md`, and from `docs-next/index.md` if it is a new folder. Fix stale links. Fold `Assumption:` into the rule or drop it.

Do not restate another page. Do not gloss indexes. One fact, one owner: `docs-next/definitions.md` names the owner.

Done when indexes match the task and the write list has no second copy of a fact. Halt: [[process/canon]].

## Game-text-writer

Player strings and the developer summary. Sole owner of new user-facing text.

Read [[process/user-facing-text]] in full, then [[process/lexicon]], then `messages/en/`, then the files in the prompt. Grep `<needs-game-text-writer>`.

### Writes

`messages/en/{section}.json`. Marked strings in `src/` become keys there; strip the marker. Copy slots in `docs-next/` pages the same. Paste the **say** column. [[process/lexicon]] `lex.copy`. Strings compile from `messages/en/` ([[code-map]]).

Draft changelog lines for the orchestrator. Shape: [[process/update-notes]]. Orchestrator pastes `src/game/ui/changelog.md`.

### Return

Final message: developer summary, 5–15 lines, **say** column. That is the slice's user-facing report.

Done when grep `<needs-game-text-writer>` is empty and the summary is the final message.
