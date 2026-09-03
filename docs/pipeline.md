# Pipeline

Orchestrator classifies, then dispatches. Children cannot spawn children.

Skill: `/game-pipeline`.

## Type

One line, orchestrator, before any spawn. Children never write version digits.

| type | when | run |
|---|---|---|
| **unversioned** | no new mechanic id, no new SKU, no new dock / overlay / lens, no new player sentence | orchestrator is architect + coder (+ designer if one named SVG). Spawn [[agents/code-review]]. Spawn [[agents/game-text-writer]] if a player string changed. Orchestrator does documenter. |
| **minor** | new invariant on an existing note, new SKU, new prompt / inspect row, new e2e path | architect → coder(s) → code-review → game-text-writer. Designer if SVG. Documenter if a new note or id. |
| **major** | new mechanics note, new module, new dock / lens / overlay, or a new asset set | architect → designer? → coder(s) → code-review → documenter ∥ game-text-writer |

Orchestrator owns [[GLOBAL_VERSION]], wordmark, `SAVE_VERSION`, dump `version`, `PROTOCOL`, `src/game/ui/changelog.md`, `changelogs-*.md`. Quote an allow in a child's prompt to hand one of those over.

## Order

1. [[agents/architect]] — skip on unversioned
2. [[agents/designer]] — when SVG; ∥ architect when filenames are already in the task
3. [[agents/coder]] × N — impl + unit tests; partition by file
4. [[agents/code-review]] — singleton; issues, then fix `blocker`/`bug`, then e2e
5. [[agents/documenter]] — major, or new note / id; else orchestrator
6. [[agents/game-text-writer]] — ∥ documenter

Coders may be parallel or sequential. Everyone else is a singleton.

## Who

| Job | Who |
|---|---|
| Types, rules, HUD states, `docs/ui/` | [[agents/architect]] |
| SVG | [[agents/designer]] |
| `src/` + unit tests | [[agents/coder]] |
| Review file, fixes, e2e | [[agents/code-review]] |
| Vault indexes, stale links | [[agents/documenter]] |
| Player strings, developer summary | [[agents/game-text-writer]] |

## Write, do not hand off

Specialists write their allowed files **immediately**. Next agent reads the notes, not chat.

No Intent / Assumptions / Artifacts / Open questions / Handoff block.

Halt only before any write, and only if the task as given is blocked: one-line question, then **stop**. After a write, or a gap found only while reading: one-line assumption in the note, finish.

Done: allowed files written → stop.

Confirm-only / “write nothing if complete” tasks are forbidden — the child has no exit.

Invented scope is a failed run. Reject. Re-spawn. Do not silently repair.

New or changed player strings in `src/` and copy slots in `docs/ui/` start with `<needs-game-text-writer>`. [[agents/game-text-writer]] rewrites them per [[standards/user-facing-text]] and strips the marker. Changelog lines: that agent drafts; orchestrator pastes. [[standards/update-notes]]

## Spawn

- `subagent_type` = agent file name
- `description` prefixed `[architect]`, `[coder]`, …
- Prompt: task, files to read, files to write, done condition. The agent file names the rest.
- [[agents/game-text-writer]] prompt also lists `docs/standards/user-facing-text.md`
- Isolation: `none`
- architect / designer / documenter → `read-write`. coder / code-review / game-text-writer → `all`

Orchestrator names files and done-conditions. Unversioned: orchestrator may write `src/`. Minor / major: no sample code in the spawn prompt.

After game-text-writer: grep `<needs-game-text-writer>`. Hits → re-spawn that agent. Present its developer summary.
